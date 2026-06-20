import { prisma } from "../../services/database";
import { OwnerService } from "../owners/owner.service";
import { automationBus, AUTOMATION_EVENTS } from "./automation-events";
import { logger } from "../../utils/logger";

const SOURCE = "OwnerBridge";

/**
 * Phase 2 — Pont entre l'ingestion des logs (Phase 1) et le système Owner.
 *
 * À chaque VOUCH/FEEDBACK/TICKET détecté, remonte la chaîne :
 *   vendeur → OwnerTeamMember → Owner → score + objectifs + alertes + stats
 */
export class OwnerBridgeService {
  static init() {
    automationBus.onEvent(AUTOMATION_EVENTS.VOUCH_DETECTED, (p) => this.onVouch(p));
    automationBus.onEvent(AUTOMATION_EVENTS.FEEDBACK_DETECTED, (p) => this.onFeedback(p));
    automationBus.onEvent(AUTOMATION_EVENTS.TICKET_CLOSED_DETECTED, (p) => this.onTicket(p));
    logger.info(SOURCE, "Phase 2 initialisée — écoute VOUCH / FEEDBACK / TICKET");
  }

  // ── VOUCH ──────────────────────────────────────────────
  private static async onVouch(payload: { sellerId: string; vouchId?: string }) {
    const member = await this.findMember(payload.sellerId);
    if (!member) return;

    await OwnerService.addScore(member.ownerId, "TEAM_VOUCH", 10, payload.sellerId);
    await OwnerService.markMemberActive(payload.sellerId);
    await this.incrementMetricGoals(member.ownerId, "TEAM_VOUCH");
    await this.refreshOwnerStats(member.ownerId);
    automationBus.emitEvent(AUTOMATION_EVENTS.OWNER_STATS_UPDATED, { ownerId: member.ownerId });

    logger.info(SOURCE, `Vouch → Owner ${member.ownerId} +10pts (seller ${payload.sellerId})`);
  }

  // ── FEEDBACK ───────────────────────────────────────────
  private static async onFeedback(payload: { sellerId: string; rating: number }) {
    const member = await this.findMember(payload.sellerId);
    if (!member) return;

    const points = payload.rating >= 4 ? 5 : -15;
    const type = payload.rating >= 4 ? "GOOD_RATING" : "BAD_RATING";
    await OwnerService.addScore(member.ownerId, type as any, points, payload.sellerId);
    await this.incrementMetricGoals(member.ownerId, "RATING");
    await this.refreshOwnerStats(member.ownerId);

    // Alerte si note basse
    if (payload.rating <= 2) {
      await this.createAlert(
        member.ownerId,
        payload.sellerId,
        "BAD_RATING",
        `<@${payload.sellerId}> a reçu une note de ${payload.rating}/5`,
        "warning",
      );
    }

    automationBus.emitEvent(AUTOMATION_EVENTS.OWNER_STATS_UPDATED, { ownerId: member.ownerId });
    logger.info(SOURCE, `Feedback ${payload.rating}/5 → Owner ${member.ownerId} ${points > 0 ? "+" : ""}${points}pts`);
  }

  // ── TICKET ─────────────────────────────────────────────
  private static async onTicket(payload: { sellerId: string }) {
    const member = await this.findMember(payload.sellerId);
    if (!member) return;

    await OwnerService.addScore(member.ownerId, "TICKET_HANDLED", 5, payload.sellerId);
    await OwnerService.markMemberActive(payload.sellerId);
    await this.incrementMetricGoals(member.ownerId, "TICKET");
    await this.refreshOwnerStats(member.ownerId);
    automationBus.emitEvent(AUTOMATION_EVENTS.OWNER_STATS_UPDATED, { ownerId: member.ownerId });

    logger.info(SOURCE, `Ticket → Owner ${member.ownerId} +5pts (handler ${payload.sellerId})`);
  }

  // ── HELPERS ────────────────────────────────────────────

  /** Retrouve le membre d'équipe (et donc l'Owner) à partir du Discord ID vendeur. */
  private static async findMember(discordId: string) {
    return prisma.ownerTeamMember.findFirst({
      where: { discordId, status: "ACTIVE" },
    });
  }

  /** Incrémente les OwnerGoal avec un metric donné. */
  private static async incrementMetricGoals(ownerId: string, metric: string) {
    const now = new Date();
    const goals = await prisma.ownerGoal.findMany({
      where: {
        ownerId,
        metric,
        completed: false,
        endsAt: { gte: now },
      },
    });

    for (const goal of goals) {
      const newCurrent = goal.current + 1;
      await prisma.ownerGoal.update({
        where: { id: goal.id },
        data: { current: newCurrent, completed: newCurrent >= goal.target },
      });
    }

    if (goals.length > 0) {
      automationBus.emitEvent(AUTOMATION_EVENTS.OBJECTIVE_PROGRESS_UPDATED, { ownerId, metric });
    }
  }

  /** Recalcule OwnerStats (cache agrégé). */
  private static async refreshOwnerStats(ownerId: string) {
    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
      include: { team: { where: { status: { in: ["ACTIVE", "INACTIVE"] } } } },
    });
    if (!owner) return;

    const memberIds = owner.team.map((m) => m.discordId);
    const activeIds = owner.team.filter((m) => m.status === "ACTIVE").map((m) => m.discordId);
    const inactiveCount = owner.team.filter((m) => m.status === "INACTIVE").length;

    // Agrège depuis SellerProfile pour les membres de l'équipe
    const profiles = memberIds.length > 0
      ? await prisma.sellerProfile.findMany({ where: { discordUserId: { in: memberIds } } })
      : [];

    const totalTeamVouches = profiles.reduce((s, p) => s + p.totalVouches, 0);
    const weeklyTeamVouches = profiles.reduce((s, p) => s + p.weeklyVouches, 0);
    const monthlyTeamVouches = profiles.reduce((s, p) => s + p.monthlyVouches, 0);
    const ticketsHandled = profiles.reduce((s, p) => s + p.ticketsHandled, 0);

    const ratedProfiles = profiles.filter((p) => p.totalRatings > 0);
    const averageTeamRating = ratedProfiles.length > 0
      ? Number((ratedProfiles.reduce((s, p) => s + p.averageRating, 0) / ratedProfiles.length).toFixed(2))
      : 0;

    // Score qualité /100
    const qualityScore = this.computeQualityScore({
      weeklyTeamVouches,
      averageTeamRating,
      activeMembers: activeIds.length,
      totalMembers: owner.team.length,
      weeklyProgression: weeklyTeamVouches, // simplifié pour v1
      alertCount: 0, // TODO: compter les alertes non résolues
    });

    await prisma.ownerStats.upsert({
      where: { ownerId },
      create: {
        ownerId,
        totalTeamVouches,
        weeklyTeamVouches,
        monthlyTeamVouches,
        averageTeamRating,
        activeMembers: activeIds.length,
        inactiveMembers: inactiveCount,
        ticketsHandled,
        qualityScore,
      },
      update: {
        totalTeamVouches,
        weeklyTeamVouches,
        monthlyTeamVouches,
        averageTeamRating,
        activeMembers: activeIds.length,
        inactiveMembers: inactiveCount,
        ticketsHandled,
        qualityScore,
      },
    });
  }

  /**
   * Score qualité Owner /100 :
   *   30% vouches équipe (cap à 300/semaine → 30 pts)
   *   25% note moyenne (4.0+ → 25 pts, linéaire)
   *   20% taux de membres actifs
   *   15% progression hebdo (cap à 100 vouches → 15 pts)
   *   10% absence d'alertes non résolues
   */
  private static computeQualityScore(data: {
    weeklyTeamVouches: number;
    averageTeamRating: number;
    activeMembers: number;
    totalMembers: number;
    weeklyProgression: number;
    alertCount: number;
  }): number {
    const vouchScore = Math.min(data.weeklyTeamVouches / 300, 1) * 30;
    const ratingScore = data.averageTeamRating > 0
      ? Math.min(data.averageTeamRating / 5, 1) * 25
      : 12.5; // pas encore de note → neutre
    const activityRate = data.totalMembers > 0 ? data.activeMembers / data.totalMembers : 0;
    const activityScore = activityRate * 20;
    const progressionScore = Math.min(data.weeklyProgression / 100, 1) * 15;
    const alertScore = data.alertCount === 0 ? 10 : Math.max(0, 10 - data.alertCount * 2);

    return Math.round(vouchScore + ratingScore + activityScore + progressionScore + alertScore);
  }

  /** Crée une alerte Owner. */
  private static async createAlert(
    ownerId: string,
    memberId: string,
    type: string,
    message: string,
    severity: string,
  ) {
    await prisma.ownerAlert.create({
      data: { ownerId, memberId, type, message, severity },
    });
    automationBus.emitEvent(AUTOMATION_EVENTS.OWNER_ALERT_TRIGGERED, { ownerId, type });
  }
}

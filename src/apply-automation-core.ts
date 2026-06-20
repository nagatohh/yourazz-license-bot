import { prisma } from "./services/database";

/**
 * Migration Automation Core (Phase 1) — appliquée via $executeRawUnsafe car
 * `prisma db push` / `migrate` se bloquent sur le pooler pgbouncer (6543).
 * Chaque statement est idempotent (IF NOT EXISTS) → script ré-exécutable sans risque.
 *
 *   Lancer :  npx tsx src/apply-automation-core.ts
 */
const STATEMENTS: string[] = [
  // ── Valeurs d'enum (PG 12+ : ADD VALUE IF NOT EXISTS) ──
  `ALTER TYPE licenses."ScoreEventType" ADD VALUE IF NOT EXISTS 'TEAM_VOUCH'`,
  `ALTER TYPE licenses."ScoreEventType" ADD VALUE IF NOT EXISTS 'GOOD_RATING'`,
  `ALTER TYPE licenses."ScoreEventType" ADD VALUE IF NOT EXISTS 'BAD_RATING'`,
  `ALTER TYPE licenses."ScoreEventType" ADD VALUE IF NOT EXISTS 'TICKET_HANDLED'`,

  // ── Colonnes ajoutées à l'existant ──
  `ALTER TABLE licenses."Owner" ADD COLUMN IF NOT EXISTS "teamName" TEXT`,
  `ALTER TABLE licenses."OwnerGoal" ADD COLUMN IF NOT EXISTS "metric" TEXT`,

  // ── ProcessedEvent ──
  `CREATE TABLE IF NOT EXISTS licenses."ProcessedEvent" (
     "id" TEXT NOT NULL,
     "discordMessageId" TEXT NOT NULL,
     "sourceChannelId" TEXT NOT NULL,
     "eventType" TEXT NOT NULL,
     "externalEventId" TEXT,
     "hash" TEXT NOT NULL,
     "status" TEXT NOT NULL DEFAULT 'processed',
     "errorMessage" TEXT,
     "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "ProcessedEvent_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ProcessedEvent_discordMessageId_key" ON licenses."ProcessedEvent"("discordMessageId")`,
  `CREATE INDEX IF NOT EXISTS "ProcessedEvent_hash_idx" ON licenses."ProcessedEvent"("hash")`,
  `CREATE INDEX IF NOT EXISTS "ProcessedEvent_eventType_idx" ON licenses."ProcessedEvent"("eventType")`,
  `CREATE INDEX IF NOT EXISTS "ProcessedEvent_externalEventId_idx" ON licenses."ProcessedEvent"("externalEventId")`,
  `CREATE INDEX IF NOT EXISTS "ProcessedEvent_sourceChannelId_idx" ON licenses."ProcessedEvent"("sourceChannelId")`,

  // ── SellerProfile ──
  `CREATE TABLE IF NOT EXISTS licenses."SellerProfile" (
     "id" TEXT NOT NULL,
     "discordUserId" TEXT NOT NULL,
     "username" TEXT NOT NULL,
     "ownerId" TEXT,
     "rank" TEXT,
     "totalVouches" INTEGER NOT NULL DEFAULT 0,
     "weeklyVouches" INTEGER NOT NULL DEFAULT 0,
     "monthlyVouches" INTEGER NOT NULL DEFAULT 0,
     "totalRatings" INTEGER NOT NULL DEFAULT 0,
     "ratingSum" INTEGER NOT NULL DEFAULT 0,
     "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
     "ticketsHandled" INTEGER NOT NULL DEFAULT 0,
     "lastActivityAt" TIMESTAMP(3),
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "SellerProfile_discordUserId_key" ON licenses."SellerProfile"("discordUserId")`,
  `CREATE INDEX IF NOT EXISTS "SellerProfile_ownerId_idx" ON licenses."SellerProfile"("ownerId")`,

  // ── VouchEvent ──
  `CREATE TABLE IF NOT EXISTS licenses."VouchEvent" (
     "id" TEXT NOT NULL,
     "messageId" TEXT NOT NULL,
     "vouchId" TEXT,
     "sellerId" TEXT NOT NULL,
     "clientId" TEXT,
     "comment" TEXT,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "VouchEvent_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VouchEvent_messageId_key" ON licenses."VouchEvent"("messageId")`,
  `CREATE INDEX IF NOT EXISTS "VouchEvent_sellerId_idx" ON licenses."VouchEvent"("sellerId")`,
  `CREATE INDEX IF NOT EXISTS "VouchEvent_vouchId_idx" ON licenses."VouchEvent"("vouchId")`,

  // ── FeedbackEvent ──
  `CREATE TABLE IF NOT EXISTS licenses."FeedbackEvent" (
     "id" TEXT NOT NULL,
     "messageId" TEXT NOT NULL,
     "sellerId" TEXT NOT NULL,
     "clientId" TEXT,
     "rating" INTEGER NOT NULL,
     "comment" TEXT,
     "ticketId" TEXT,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "FeedbackEvent_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "FeedbackEvent_messageId_key" ON licenses."FeedbackEvent"("messageId")`,
  `CREATE INDEX IF NOT EXISTS "FeedbackEvent_sellerId_idx" ON licenses."FeedbackEvent"("sellerId")`,

  // ── TicketEvent ──
  `CREATE TABLE IF NOT EXISTS licenses."TicketEvent" (
     "id" TEXT NOT NULL,
     "messageId" TEXT NOT NULL,
     "ticketId" TEXT,
     "sellerId" TEXT,
     "eventType" TEXT NOT NULL,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "TicketEvent_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "TicketEvent_messageId_key" ON licenses."TicketEvent"("messageId")`,
  `CREATE INDEX IF NOT EXISTS "TicketEvent_sellerId_idx" ON licenses."TicketEvent"("sellerId")`,
  `CREATE INDEX IF NOT EXISTS "TicketEvent_ticketId_idx" ON licenses."TicketEvent"("ticketId")`,

  // ── OwnerStats ──
  `CREATE TABLE IF NOT EXISTS licenses."OwnerStats" (
     "id" TEXT NOT NULL,
     "ownerId" TEXT NOT NULL,
     "totalTeamVouches" INTEGER NOT NULL DEFAULT 0,
     "weeklyTeamVouches" INTEGER NOT NULL DEFAULT 0,
     "monthlyTeamVouches" INTEGER NOT NULL DEFAULT 0,
     "averageTeamRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
     "activeMembers" INTEGER NOT NULL DEFAULT 0,
     "inactiveMembers" INTEGER NOT NULL DEFAULT 0,
     "ticketsHandled" INTEGER NOT NULL DEFAULT 0,
     "qualityScore" INTEGER NOT NULL DEFAULT 0,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "OwnerStats_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "OwnerStats_ownerId_key" ON licenses."OwnerStats"("ownerId")`,

  // ── OwnerAlert ──
  `CREATE TABLE IF NOT EXISTS licenses."OwnerAlert" (
     "id" TEXT NOT NULL,
     "ownerId" TEXT NOT NULL,
     "memberId" TEXT,
     "type" TEXT NOT NULL,
     "message" TEXT NOT NULL,
     "severity" TEXT NOT NULL DEFAULT 'info',
     "resolved" BOOLEAN NOT NULL DEFAULT false,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "OwnerAlert_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE INDEX IF NOT EXISTS "OwnerAlert_ownerId_idx" ON licenses."OwnerAlert"("ownerId")`,
  `CREATE INDEX IF NOT EXISTS "OwnerAlert_resolved_idx" ON licenses."OwnerAlert"("resolved")`,

  // ── Clés étrangères (onDelete: Cascade) — idempotent via DO block ──
  `DO $$ BEGIN
     ALTER TABLE licenses."OwnerStats"
       ADD CONSTRAINT "OwnerStats_ownerId_fkey"
       FOREIGN KEY ("ownerId") REFERENCES licenses."Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
     ALTER TABLE licenses."OwnerAlert"
       ADD CONSTRAINT "OwnerAlert_ownerId_fkey"
       FOREIGN KEY ("ownerId") REFERENCES licenses."Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
];

async function main() {
  console.log(`Application de ${STATEMENTS.length} statements (Automation Core Phase 1)...\n`);
  for (const [i, sql] of STATEMENTS.entries()) {
    const label = sql.trim().split("\n")[0].slice(0, 70);
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`✅ [${i + 1}/${STATEMENTS.length}] ${label}`);
    } catch (err: any) {
      // Tolère les "déjà existant" non couverts par IF NOT EXISTS (ex: enum déjà présent).
      const msg = String(err?.message ?? err);
      if (/already exists|duplicate/i.test(msg)) {
        console.log(`↩️  [${i + 1}/${STATEMENTS.length}] déjà présent — ${label}`);
      } else {
        console.error(`❌ [${i + 1}/${STATEMENTS.length}] ${label}\n   → ${msg}`);
        throw err;
      }
    }
  }

  // Vérification : les nouvelles tables existent-elles ?
  const tables: Array<{ table_name: string }> = await prisma.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'licenses'
         AND table_name IN ('ProcessedEvent','SellerProfile','VouchEvent','FeedbackEvent','TicketEvent','OwnerStats','OwnerAlert')
       ORDER BY table_name;`,
  );
  console.log(`\n📦 Tables Automation Core présentes : ${tables.map((t) => t.table_name).join(", ") || "(aucune)"}`);

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(async (err: any) => {
  console.error("\n❌ Migration échouée :", err.message);
  await prisma.$disconnect();
  process.exit(1);
});

const cooldowns = new Map<string, number>();

const LIMITS: Record<string, number> = {
  "licence acheter": 10,
  "licence statut": 5,
  "licence renouveler": 10,
  "licence dashboard": 5,
  "licence key": 5,
  "licence aide": 5,
  "key redeem": 15,
  "key status": 5,
  default: 3,
};

export function checkCooldown(userId: string, command: string): { ok: boolean; remaining: number } {
  const seconds = LIMITS[command] ?? LIMITS.default;
  const key = `${userId}:${command}`;
  const now = Date.now();
  const last = cooldowns.get(key) ?? 0;
  const elapsed = now - last;

  if (elapsed < seconds * 1000) {
    return { ok: false, remaining: Math.ceil((seconds * 1000 - elapsed) / 1000) };
  }

  cooldowns.set(key, now);

  // Nettoyage mémoire toutes les 500 entrées
  if (cooldowns.size > 500) {
    const threshold = now - 60_000;
    for (const [k, v] of cooldowns) {
      if (v < threshold) cooldowns.delete(k);
    }
  }

  return { ok: true, remaining: 0 };
}

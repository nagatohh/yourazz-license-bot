import { prisma } from "./services/database";

async function main() {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE licenses."OwnerTeamMember"
       ADD COLUMN IF NOT EXISTS "note" TEXT,
       ADD COLUMN IF NOT EXISTS "addedById" TEXT;`,
  );
  console.log("✅ ALTER TABLE appliqué.");

  const rows: Array<{ column_name: string }> = await prisma.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'licenses'
         AND table_name = 'OwnerTeamMember'
         AND column_name IN ('note', 'addedById')
       ORDER BY column_name;`,
  );
  console.log("Colonnes présentes :", rows.map((r) => r.column_name).join(", ") || "(aucune)");

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(async (err: any) => {
  console.error("❌ Erreur :", err.message);
  await prisma.$disconnect();
  process.exit(1);
});

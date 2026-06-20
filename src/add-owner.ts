import { prisma } from "./services/database";

async function main() {
  await prisma.$connect();

  const owner = await prisma.owner.upsert({
    where: { discordId: "1105560513020170270" },
    update: {},
    create: {
      discordId: "1105560513020170270",
      username: "Kylian",
    },
  });

  console.log(`✅ Owner créé/existant: ${owner.username} (${owner.id})`);
  console.log(`   Tier: ${owner.tier}`);
  console.log(`   Score: ${owner.totalScore}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

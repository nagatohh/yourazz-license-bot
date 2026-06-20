import { prisma } from "./services/database";

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ DB connectée");
    const count = await prisma.owner.count();
    console.log(`Owners en DB: ${count}`);
  } catch (e: any) {
    console.error(`❌ ${e.message}`);
  }
  await prisma.$disconnect();
}

main();

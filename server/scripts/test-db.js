import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
});

async function test() {
  console.log("=== DATABASE DIAGNOSTICS ===");
  console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
  console.log("DIRECT_URL exists:", !!process.env.DIRECT_URL);
  console.log("NODE_ENV:", process.env.NODE_ENV);

  const dbUrl = process.env.DATABASE_URL || "";
  if (dbUrl) {
    try {
      const parsed = new URL(dbUrl);
      console.log("HOST:", parsed.hostname);
      console.log("PORT:", parsed.port);
      console.log("USER:", parsed.username);
      console.log("PROTOCOL:", parsed.protocol);
    } catch (err) {
      console.log("DATABASE_URL parse failed:", err.message);
    }
  } else {
    console.log("DATABASE_URL is empty");
  }

  try {
    console.log("\nAttempting $connect()...");
    await prisma.$connect();
    console.log("CONNECTED");

    console.log("\nRunning $queryRaw SELECT 1...");
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log("QUERY RESULT:", result);

    console.log("\n=== SUCCESS ===");
    process.exit(0);
  } catch (error) {
    console.error("\nCONNECTION FAILED:");
    console.error("Name:", error.name);
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

test();

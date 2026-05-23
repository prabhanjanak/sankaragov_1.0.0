import "./prestart";
import app from "./app";
import { logger } from "./lib/logger";

import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "./lib/crypto";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function ensureSuperAdmin() {
  try {
    // 1. Default admin
    const existingDefault = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, "admin@sankaraeye.com"));

    if (existingDefault.length === 0) {
      const pwdHash = hashPassword("Welcome@123");
      await db.insert(usersTable).values({
        clerkId: "local_auth_admin",
        email: "admin@sankaraeye.com",
        name: "MHQ Admin",
        role: "super_admin",
        passwordHash: pwdHash,
        mustChangePassword: true,
        isActive: true,
      });
      logger.info("Successfully seeded default super_admin (admin@sankaraeye.com / Welcome@123)");
    }

    // 2. Prabhanjan Admin
    const existingPrabhanjan = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, "prabhanjan@sankaraeye.com"));

    if (existingPrabhanjan.length === 0) {
      const pwdHash = hashPassword("Prabhanjan@2026");
      await db.insert(usersTable).values({
        clerkId: "local_auth_prabhanjan",
        email: "prabhanjan@sankaraeye.com",
        name: "Prabhanjan Admin",
        role: "super_admin",
        passwordHash: pwdHash,
        mustChangePassword: false,
        isActive: true,
      });
      logger.info("Successfully seeded Prabhanjan Admin (prabhanjan@sankaraeye.com / Prabhanjan@2026)");
    }

    // 3. Saravanan Admin
    const existingSaravanan = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, "saravanan@sankaraeye.com"));

    if (existingSaravanan.length === 0) {
      const pwdHash = hashPassword("Saravanan@2026");
      await db.insert(usersTable).values({
        clerkId: "local_auth_saravanan",
        email: "saravanan@sankaraeye.com",
        name: "Saravanan Admin",
        role: "super_admin",
        passwordHash: pwdHash,
        mustChangePassword: false,
        isActive: true,
      });
      logger.info("Successfully seeded Saravanan Admin (saravanan@sankaraeye.com / Saravanan@2026)");
    }
  } catch (err) {
    logger.error({ err }, "Error checking or seeding super_admins");
  }
}

async function start() {
  await ensureSuperAdmin();
  app.listen(port, () => {
    logger.info({ port }, "Server listening");
  });
}

start().catch((err) => {
  logger.error({ err }, "Error starting server");
  process.exit(1);
});


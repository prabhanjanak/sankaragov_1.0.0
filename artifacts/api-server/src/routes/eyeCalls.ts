import { Router } from "express";
import { db, eyeCallsTable, unitsTable, usersTable } from "@workspace/db";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import {
  CreateEyeCallBody,
  UpdateEyeCallBody,
  UpdateEyeCallStatusBody,
  GetEyeCallParams,
  UpdateEyeCallParams,
  DeleteEyeCallParams,
  UpdateEyeCallStatusParams,
  ListEyeCallsQueryParams,
} from "@workspace/api-zod";

const router = Router();

function generateCallId(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `EC${year}${month}${day}${rand}`;
}

async function attachUnitName(call: typeof eyeCallsTable.$inferSelect) {
  const [unit] = await db.select().from(unitsTable).where(eq(unitsTable.id, call.unitId));
  return { ...call, unitName: unit?.name ?? "Unknown" };
}

router.get("/eye-calls", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).appUser;
  const queryParams = ListEyeCallsQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const { status, unitId, search, page = 1, limit = 20 } = queryParams.data;

  let query = db.select().from(eyeCallsTable);
  const conditions = [];

  // Unit coordinators can only see their unit's calls
  if (user.role === "unit_coordinator" && user.unitId) {
    conditions.push(eq(eyeCallsTable.unitId, user.unitId));
  } else if (unitId) {
    conditions.push(eq(eyeCallsTable.unitId, unitId));
  }

  if (status) {
    conditions.push(eq(eyeCallsTable.status, status));
  }

  if (search) {
    conditions.push(
      or(
        ilike(eyeCallsTable.donorName, `%${search}%`),
        ilike(eyeCallsTable.referrerName, `%${search}%`),
        ilike(eyeCallsTable.callId, `%${search}%`),
      )!,
    );
  }

  const baseQuery = conditions.length > 0 
    ? db.select().from(eyeCallsTable).where(and(...conditions))
    : db.select().from(eyeCallsTable);

  const totalResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(eyeCallsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const total = totalResult[0]?.count ?? 0;
  const offset = (page - 1) * limit;

  const calls = await db
    .select()
    .from(eyeCallsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${eyeCallsTable.createdAt} DESC`)
    .limit(limit)
    .offset(offset);

  const callsWithUnits = await Promise.all(calls.map(attachUnitName));

  res.json({ data: callsWithUnits, total, page, limit });
});

router.post("/eye-calls", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateEyeCallBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [unit] = await db.select().from(unitsTable).where(eq(unitsTable.id, parsed.data.unitId));
  if (!unit) {
    res.status(400).json({ error: "Unit not found" });
    return;
  }

  const [call] = await db
    .insert(eyeCallsTable)
    .values({ ...parsed.data, callId: generateCallId() })
    .returning();

  res.status(201).json(await attachUnitName(call));
});

router.get("/eye-calls/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetEyeCallParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [call] = await db.select().from(eyeCallsTable).where(eq(eyeCallsTable.id, params.data.id));
  if (!call) {
    res.status(404).json({ error: "Eye call not found" });
    return;
  }

  res.json(await attachUnitName(call));
});

router.patch("/eye-calls/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateEyeCallParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateEyeCallBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [call] = await db
    .update(eyeCallsTable)
    .set(parsed.data)
    .where(eq(eyeCallsTable.id, params.data.id))
    .returning();

  if (!call) {
    res.status(404).json({ error: "Eye call not found" });
    return;
  }

  res.json(await attachUnitName(call));
});

router.delete("/eye-calls/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).appUser;
  if (user.role !== "super_admin") {
    res.status(403).json({ error: "Only admins can delete eye calls" });
    return;
  }

  const params = DeleteEyeCallParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [call] = await db.delete(eyeCallsTable).where(eq(eyeCallsTable.id, params.data.id)).returning();
  if (!call) {
    res.status(404).json({ error: "Eye call not found" });
    return;
  }

  res.sendStatus(204);
});

router.patch("/eye-calls/:id/status", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateEyeCallStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateEyeCallStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [call] = await db
    .update(eyeCallsTable)
    .set(parsed.data)
    .where(eq(eyeCallsTable.id, params.data.id))
    .returning();

  if (!call) {
    res.status(404).json({ error: "Eye call not found" });
    return;
  }

  res.json(await attachUnitName(call));
});

export default router;

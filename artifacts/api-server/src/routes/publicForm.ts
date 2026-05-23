import { Router } from "express";
import { db, eyeCallsTable, unitsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SubmitPublicEyeCallBody } from "@workspace/api-zod";

const router = Router();

function generateCallId(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `EC${year}${month}${day}${rand}`;
}

function generateWhatsAppMessage(data: {
  donorName: string;
  donorAge: number;
  referrerName: string;
  referrerMobile: string;
  state: string;
  district: string;
  address: string;
  timeOfDeath: string;
  unitName: string;
  callId: string;
}): string {
  return (
    `*NEW EYE DONATION CALL - ${data.callId}*\n\n` +
    `*Donor Details:*\n` +
    `Name: ${data.donorName}\n` +
    `Age: ${data.donorAge}\n` +
    `Time of Death: ${data.timeOfDeath}\n\n` +
    `*Referrer Details:*\n` +
    `Name: ${data.referrerName}\n` +
    `Mobile: ${data.referrerMobile}\n\n` +
    `*Location:*\n` +
    `State: ${data.state}\n` +
    `District: ${data.district}\n` +
    `Address: ${data.address}\n\n` +
    `*Assigned Unit:* ${data.unitName}\n\n` +
    `Please take immediate action.`
  );
}

router.get("/public/units", async (_req, res): Promise<void> => {
  const units = await db
    .select({
      id: unitsTable.id,
      name: unitsTable.name,
      state: unitsTable.state,
      district: unitsTable.district,
      address: unitsTable.address,
    })
    .from(unitsTable)
    .where(eq(unitsTable.isActive, true))
    .orderBy(unitsTable.name);

  res.json(units);
});

router.post("/public/eye-calls", async (req, res): Promise<void> => {
  const parsed = SubmitPublicEyeCallBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [unit] = await db.select().from(unitsTable).where(eq(unitsTable.id, parsed.data.unitId));
  if (!unit) {
    res.status(400).json({ error: "Selected unit not found" });
    return;
  }

  const callId = generateCallId();

  const [call] = await db
    .insert(eyeCallsTable)
    .values({
      ...parsed.data,
      callId,
      status: "new",
    })
    .returning();

  const whatsappMessage = generateWhatsAppMessage({
    donorName: parsed.data.donorName,
    donorAge: parsed.data.donorAge,
    referrerName: parsed.data.referrerName,
    referrerMobile: parsed.data.referrerMobile,
    state: parsed.data.state,
    district: parsed.data.district,
    address: parsed.data.address,
    timeOfDeath: parsed.data.timeOfDeath,
    unitName: unit.name,
    callId,
  });

  const whatsappNumber = unit.coordinatorWhatsapp.replace(/\D/g, "");
  const encodedMessage = encodeURIComponent(whatsappMessage);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

  res.status(201).json({
    eyeCall: { ...call, unitName: unit.name },
    whatsappMessage,
    whatsappUrl,
  });
});

export default router;

import type { Types } from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { Donation } from "@/models/donation";

const PENDING_STATUSES = ["pending", "in_process", "authorized"] as const;
const FAILED_STATUSES = ["rejected", "cancelled", "canceled"] as const;

export function isApprovedPaymentStatus(status?: string | null) {
  return status === "approved";
}

export function isFailedPaymentStatus(status?: string | null) {
  return (
    status != null &&
    FAILED_STATUSES.includes(status as (typeof FAILED_STATUSES)[number])
  );
}

export function isApprovedDonation(status?: string | null, collectionStatus?: string | null) {
  return (
    isApprovedPaymentStatus(status) ||
    isApprovedPaymentStatus(collectionStatus)
  );
}

export function isFailedDonation(status?: string | null, collectionStatus?: string | null) {
  return (
    isFailedPaymentStatus(status) ||
    isFailedPaymentStatus(collectionStatus)
  );
}

/** Mesmo dia civil no fuso de São Paulo. */
export function getBrazilDayRange(date: Date) {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  return {
    start: new Date(`${day}T00:00:00-03:00`),
    end: new Date(`${day}T23:59:59.999-03:00`),
  };
}

function buildFailedAttemptsFilter(userId: Types.ObjectId, start: Date, end: Date) {
  return {
    user: userId,
    createdAt: { $gte: start, $lte: end },
    sameDayDonation: { $ne: "success" },
    $and: [
      { status: { $ne: "approved" } },
      { collectionStatus: { $ne: "approved" } },
      { status: { $nin: PENDING_STATUSES } },
      { collectionStatus: { $nin: PENDING_STATUSES } },
    ],
  };
}

export async function markSameDayDonationIfNeeded({
  userId,
  referenceDate = new Date(),
}: {
  userId: Types.ObjectId;
  referenceDate?: Date;
}) {
  await connectDB();

  const { start, end } = getBrazilDayRange(referenceDate);
  const filter = buildFailedAttemptsFilter(userId, start, end);

  // Usa o driver nativo para não depender do schema em cache do Mongoose no hot reload.
  const result = await Donation.collection.updateMany(filter, {
    $set: { sameDayDonation: "success" },
  });

  if (result.modifiedCount > 0) {
    console.info(
      `sameDayDonation: ${result.modifiedCount} tentativa(s) falha(s) marcada(s) para o usuário ${userId}`
    );
  }
}

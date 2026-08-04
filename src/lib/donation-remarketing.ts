import type { Types } from "mongoose";

import { getBrazilDayRange } from "@/lib/donation-same-day";
import { sendEmailRemarketingDonation } from "@/lib/emails";
import { connectDB } from "@/lib/mongodb";
import { Donation } from "@/models/donation";
import { Donor } from "@/models/donor";

type RemarketingDonor = {
  _id: Types.ObjectId;
  email: string;
  fullName: string;
};

function getFirstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function buildRemarketingNotSentTodayFilter(start: Date, end: Date) {
  return {
    $or: [
      { remarketingEmailSentAt: { $exists: false } },
      { remarketingEmailSentAt: { $lt: start } },
      { remarketingEmailSentAt: { $gt: end } },
    ],
  };
}

async function donorQualifiesForRemarketing(
  donorId: Types.ObjectId,
  start: Date,
  end: Date,
) {
  const hasApprovedDonationToday = await Donation.exists({
    user: donorId,
    createdAt: { $gte: start, $lte: end },
    $or: [{ status: "approved" }, { collectionStatus: "approved" }],
  });

  if (hasApprovedDonationToday) {
    return false;
  }

  const hasAbandonedDonationToday = await Donation.exists({
    user: donorId,
    createdAt: { $gte: start, $lte: end },
    sameDayDonation: { $ne: "success" },
    failureEmailSentAt: { $exists: false },
  });

  return Boolean(hasAbandonedDonationToday);
}

async function sendRemarketingIfNeeded(donor: RemarketingDonor) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY não configurada; e-mail de remarketing não enviado.");
    return false;
  }

  const now = new Date();
  const { start, end } = getBrazilDayRange(now);

  const reservedDonor = await Donor.findOneAndUpdate(
    {
      _id: donor._id,
      ...buildRemarketingNotSentTodayFilter(start, end),
    },
    { $set: { remarketingEmailSentAt: now } },
  );

  if (!reservedDonor) {
    return false;
  }

  try {
    await sendEmailRemarketingDonation({
      userFirstname: getFirstName(donor.fullName),
      email: donor.email,
    });
    return true;
  } catch (error) {
    await Donor.updateOne(
      { _id: donor._id },
      { $unset: { remarketingEmailSentAt: "" } },
    );
    console.error("Erro ao enviar e-mail de remarketing:", error);
    return false;
  }
}

export async function processAbandonedDonationRemarketing() {
  await connectDB();

  const now = new Date();
  const { start, end } = getBrazilDayRange(now);

  const candidates = await Donor.find({
    updatedAt: { $gte: start, $lte: end },
    ...buildRemarketingNotSentTodayFilter(start, end),
  })
    .select("_id email fullName")
    .lean<RemarketingDonor[]>();

  let sent = 0;
  let skipped = 0;

  for (const donor of candidates) {
    const qualifies = await donorQualifiesForRemarketing(donor._id, start, end);

    if (!qualifies) {
      skipped++;
      continue;
    }

    const didSend = await sendRemarketingIfNeeded(donor);
    if (didSend) {
      sent++;
      console.info("E-mail de remarketing enviado para:", donor.email);
    } else {
      skipped++;
    }
  }

  return {
    candidates: candidates.length,
    sent,
    skipped,
  };
}

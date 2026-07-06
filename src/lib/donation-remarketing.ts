import type { Types } from "mongoose";

import { getBrazilDayRange } from "@/lib/donation-same-day";
import { sendEmailRemarketingDonation } from "@/lib/emails";
import { connectDB } from "@/lib/mongodb";
import { Donation } from "@/models/donation";
import { User } from "@/models/user";

type RemarketingUser = {
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

async function userQualifiesForRemarketing(
  userId: Types.ObjectId,
  start: Date,
  end: Date,
) {
  const hasApprovedDonationToday = await Donation.exists({
    user: userId,
    createdAt: { $gte: start, $lte: end },
    $or: [{ status: "approved" }, { collectionStatus: "approved" }],
  });

  if (hasApprovedDonationToday) {
    return false;
  }

  const hasAbandonedDonationToday = await Donation.exists({
    user: userId,
    createdAt: { $gte: start, $lte: end },
    sameDayDonation: { $ne: "success" },
    failureEmailSentAt: { $exists: false },
  });

  return Boolean(hasAbandonedDonationToday);
}

async function sendRemarketingIfNeeded(user: RemarketingUser) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY não configurada; e-mail de remarketing não enviado.");
    return false;
  }

  const now = new Date();
  const { start, end } = getBrazilDayRange(now);

  const reservedUser = await User.findOneAndUpdate(
    {
      _id: user._id,
      ...buildRemarketingNotSentTodayFilter(start, end),
    },
    { $set: { remarketingEmailSentAt: now } },
  );

  if (!reservedUser) {
    return false;
  }

  try {
    await sendEmailRemarketingDonation({
      userFirstname: getFirstName(user.fullName),
      email: user.email,
    });
    return true;
  } catch (error) {
    await User.updateOne(
      { _id: user._id },
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

  const candidates = await User.find({
    updatedAt: { $gte: start, $lte: end },
    ...buildRemarketingNotSentTodayFilter(start, end),
  })
    .select("_id email fullName")
    .lean<RemarketingUser[]>();

  let sent = 0;
  let skipped = 0;

  for (const user of candidates) {
    const qualifies = await userQualifiesForRemarketing(user._id, start, end);

    if (!qualifies) {
      skipped++;
      continue;
    }

    const didSend = await sendRemarketingIfNeeded(user);
    if (didSend) {
      sent++;
      console.info("E-mail de remarketing enviado para:", user.email);
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

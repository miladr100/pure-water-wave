import type { Types } from "mongoose";

import type { AcademyRole } from "@/lib/academy/roles";
import type { MeProfile, TutorCard } from "@/lib/academy/types";
import { isAppTheme } from "@/lib/theme";
import type { UserLanguage } from "@/lib/user-languages";

// The profile side of an `AcademyUser`: the wire shapes `MeProfile` and
// `TutorCard`, the photo URL and the birthday format. Shared by the student
// `/me` routes, the tutor list and the admin serializer so a photo or a
// birthday always reads the same wherever it is shown.

type IdLike = Types.ObjectId | string | { toString(): string };

export type PhotoOwner = { _id: IdLike; photoUpdatedAt?: Date | null };

export type TutorDoc = PhotoOwner & { fullName: string; country?: string | null };

export type ProfileDoc = PhotoOwner & {
  fullName: string;
  email: string;
  role: AcademyRole;
  language?: UserLanguage;
  country?: string | null;
  city?: string | null;
  phone?: string | null;
  birthday?: Date | null;
  theme?: string | null;
  showOtherLanguage?: boolean | null;
  assignedTutorId?: TutorDoc | IdLike | null;
  createdAt?: Date;
};

// The URL carries the upload time so the browser can cache the bytes for a
// year and still see a new photo the moment it is replaced.
export function photoUrlOf(user: PhotoOwner): string | null {
  if (!user.photoUpdatedAt) {
    return null;
  }

  return `/api/academia/foto/${user._id.toString()}?v=${user.photoUpdatedAt.getTime()}`;
}

export function tutorCard(user: TutorDoc): TutorCard {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    country: user.country ?? "",
    photoUrl: photoUrlOf(user),
  };
}

// Birthdays are stored at UTC midnight and travel as `yyyy-mm-dd`, so a
// student born on the 1st stays born on the 1st in every time zone.
export function formatBirthday(value: Date | null | undefined): string | null {
  if (!value || Number.isNaN(value.getTime())) {
    return null;
  }

  return value.toISOString().slice(0, 10);
}

const BIRTHDAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MIN_BIRTH_YEAR = 1900;

// Accepts `yyyy-mm-dd` for a real calendar day between 1900 and today;
// returns the Date to store, or null when the text is not a valid birthday.
export function parseBirthday(value: string): Date | null {
  const match = BIRTHDAY_PATTERN.exec(value.trim());
  if (!match) {
    return null;
  }

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  // `Date.UTC` rolls 2024-02-30 over to March; a round trip catches that.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  if (year < MIN_BIRTH_YEAR || date.getTime() > Date.now()) {
    return null;
  }

  return date;
}

function isTutorDoc(value: ProfileDoc["assignedTutorId"]): value is TutorDoc {
  return typeof value === "object" && value !== null && "fullName" in value;
}

// Expects `assignedTutorId` populated with `fullName country photoUpdatedAt`;
// an unpopulated id (or a tutor that no longer exists) reads as no tutor.
export function meProfile(user: ProfileDoc): MeProfile {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    language: user.language ?? "pt",
    country: user.country ?? "",
    city: user.city ?? "",
    phone: user.phone ?? "",
    birthday: formatBirthday(user.birthday),
    photoUrl: photoUrlOf(user),
    theme: isAppTheme(user.theme) ? user.theme : "system",
    showOtherLanguage: Boolean(user.showOtherLanguage),
    tutor: isTutorDoc(user.assignedTutorId) ? tutorCard(user.assignedTutorId) : null,
    createdAt: (user.createdAt ?? new Date(0)).toISOString(),
  };
}

// The fields `/me` and the admin serializer select to build a profile.
export const PROFILE_FIELDS =
  "fullName email role language country city phone birthday theme showOtherLanguage photoUpdatedAt assignedTutorId createdAt";

export const TUTOR_CARD_FIELDS = "fullName country photoUpdatedAt";

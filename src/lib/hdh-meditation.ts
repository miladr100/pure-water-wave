import daysEn from "@/lib/hdh-meditation-days-en.json";
import daysEs from "@/lib/hdh-meditation-days-es.json";
import daysPt from "@/lib/hdh-meditation-days.json";
import type { UserLanguage } from "@/lib/user-languages";

export type HdhMeditationDay = {
  id: number;
  title: string;
  startPage: number;
  reading: string;
  questions: string[];
};

export { formatHdhTitle } from "@/lib/hdh-title";

const HDH_DAYS_BY_LANGUAGE: Record<UserLanguage, HdhMeditationDay[]> = {
  pt: daysPt as HdhMeditationDay[],
  en: daysEn as HdhMeditationDay[],
  es: daysEs as HdhMeditationDay[],
};

export const HDH_MEDITATION_DAYS = HDH_DAYS_BY_LANGUAGE.pt;

export function getHdhMeditationDays(language: UserLanguage) {
  return HDH_DAYS_BY_LANGUAGE[language] ?? HDH_DAYS_BY_LANGUAGE.pt;
}

export function getHdhMeditationDay(
  dayId: number,
  language: UserLanguage = "pt",
) {
  return (
    getHdhMeditationDays(language).find((day) => day.id === dayId) ??
    HDH_DAYS_BY_LANGUAGE.pt.find((day) => day.id === dayId) ??
    null
  );
}

export function parseHdhDayId(raw: string, language: UserLanguage = "pt") {
  const dayId = Number(raw);

  if (!Number.isInteger(dayId) || dayId < 1) {
    return null;
  }

  return getHdhMeditationDay(dayId, language);
}

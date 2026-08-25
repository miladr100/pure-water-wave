import days from "@/lib/hdh-meditation-days.json";

export type HdhMeditationDay = {
  id: number;
  title: string;
  startPage: number;
  reading: string;
  questions: string[];
};

export { formatHdhTitle } from "@/lib/hdh-title";

export const HDH_MEDITATION_DAYS = days as HdhMeditationDay[];

export function getHdhMeditationDay(dayId: number) {
  return HDH_MEDITATION_DAYS.find((day) => day.id === dayId) ?? null;
}

export function parseHdhDayId(raw: string) {
  const dayId = Number(raw);

  if (!Number.isInteger(dayId) || dayId < 1) {
    return null;
  }

  return getHdhMeditationDay(dayId);
}

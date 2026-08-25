import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { HdhMeditationDayPage } from "@/components/hdh-meditation-day-page";
import { getSession, isSystemUserSession } from "@/lib/auth";
import { formatHdhTitle } from "@/lib/hdh-title";
import {
  HDH_MEDITATION_DAYS,
  parseHdhDayId,
} from "@/lib/hdh-meditation";

type HdhDayRouteProps = {
  params: Promise<{ dayId: string }>;
};

export function generateStaticParams() {
  return HDH_MEDITATION_DAYS.map((day) => ({ dayId: String(day.id) }));
}

export async function generateMetadata({
  params,
}: HdhDayRouteProps): Promise<Metadata> {
  const { dayId } = await params;
  const session = await getSession();
  const day = parseHdhDayId(dayId, session?.language ?? "pt");

  if (!day) {
    return {
      title: "Hoon Dok Hae e Meditação — Biblioteca Água Pura",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${formatHdhTitle(day.title)} — Biblioteca Água Pura`,
    robots: { index: false, follow: false },
  };
}

export default async function BibliotecaHdhMeditacaoDayPage({
  params,
}: HdhDayRouteProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!isSystemUserSession(session)) {
    redirect("/login");
  }

  const { dayId } = await params;
  const day = parseHdhDayId(dayId);

  if (!day) {
    notFound();
  }

  const dayIndex = HDH_MEDITATION_DAYS.findIndex((item) => item.id === day.id);
  const previousDayId =
    dayIndex > 0 ? HDH_MEDITATION_DAYS[dayIndex - 1].id : null;
  const nextDayId =
    dayIndex >= 0 && dayIndex < HDH_MEDITATION_DAYS.length - 1
      ? HDH_MEDITATION_DAYS[dayIndex + 1].id
      : null;

  return (
    <HdhMeditationDayPage
      session={session}
      dayId={day.id}
      previousDayId={previousDayId}
      nextDayId={nextDayId}
    />
  );
}

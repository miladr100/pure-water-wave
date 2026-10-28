import type { Metadata } from "next";

import { Dashboard } from "@/components/academy/dashboard";
import { AcademyLanding, type LandingCourse } from "@/components/academy/landing";
import { LocaleProvider } from "@/components/academy/locale-provider";
import { PageShell } from "@/components/academy/page-shell";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/academy/auth";
import { detectLanguage } from "@/lib/academy/detect-language";
import { loadCourseStructure, type CourseDoc } from "@/lib/academy/load";
import { pick } from "@/lib/academy/localized";
import { getAppMessages } from "@/lib/i18n/academy-messages";
import { connectDB } from "@/lib/mongodb";
import { Course } from "@/models/course";

export const metadata: Metadata = {
  title: "Academia Água Pura",
  description:
    "Cursos em vídeo com atividades de revisão e acompanhamento de tutores. Gratuita, no seu ritmo.",
  robots: { index: true, follow: true },
};

// Signed out, /academia is the academy's public home; signed in, it is the
// student's dashboard. It sits outside the (app) group on purpose: that
// layout demands a session, this page must not.
export default async function AcademiaHomePage() {
  const session = await getSession();

  if (session) {
    return (
      <LocaleProvider language={session.language}>
        <PageShell session={session}>
          <Dashboard session={session} />
        </PageShell>
        <Toaster richColors position="top-center" />
      </LocaleProvider>
    );
  }

  const language = await detectLanguage();
  const t = getAppMessages(language);

  return <AcademyLanding t={t} courses={await landingCourses(language)} />;
}

// Published courses a newcomer can start (no prerequisites), the starter
// first. Without a database the landing still renders, just without them.
async function landingCourses(language: "pt" | "en" | "es"): Promise<LandingCourse[]> {
  if (!process.env.MONGODB_URI) {
    return [];
  }

  try {
    await connectDB();
    const docs = (await Course.find({ published: true, prerequisites: { $size: 0 } })
      .sort({ starter: -1, order: 1 })
      .limit(6)
      .lean()) as CourseDoc[];

    const courses: LandingCourse[] = [];
    for (const doc of docs) {
      const loaded = await loadCourseStructure(doc._id, doc);
      const lessons = loaded?.structure.lessons ?? [];
      if (lessons.length === 0) {
        continue;
      }
      courses.push({
        slug: doc.slug,
        title: pick(doc.title, language),
        description: pick(doc.description, language),
        coverUrl: doc.coverUrl ?? "",
        lessonCount: lessons.length,
        totalMinutes: lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0),
        starter: Boolean(doc.starter),
      });
    }
    return courses;
  } catch (error) {
    console.error("Erro ao carregar os cursos da home da academia:", error);
    return [];
  }
}

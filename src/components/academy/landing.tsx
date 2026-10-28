import Link from "next/link";
import { ArrowRight, GraduationCap, HandHeart, Mail, PlayCircle, ShieldCheck } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { CourseCover } from "@/components/academy/course-card";
import { fmtDuration } from "@/components/academy/format";
import type { AppMessages } from "@/lib/i18n/academy-messages";

// The academy's public home, like academy.ffpum.org's welcome screen: what
// it is, how it works, the courses open to a newcomer, and how to reach the
// team. Server-rendered and always light (`theme-light`), whatever theme the
// last account on this browser stored.
export const ACADEMY_CONTACT_EMAIL = "academia@aguapura.org";

export type LandingCourse = {
  slug: string;
  title: string;
  description: string;
  coverUrl: string;
  lessonCount: number;
  totalMinutes: number;
  starter: boolean;
};

const FEATURE_ICONS = [PlayCircle, ShieldCheck, HandHeart];

export function AcademyLanding({ t, courses }: { t: AppMessages; courses: LandingCourse[] }) {
  return (
    <div className="theme-light min-h-screen bg-background text-foreground">
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Link href="/" className="flex items-center gap-2 text-primary-foreground">
            <BrandLogo className="h-10 w-10" />
            <span className="font-display text-xl">Água Pura</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/academia/login"
              className="inline-flex items-center rounded-full border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-primary-foreground backdrop-blur transition hover:bg-white/20"
            >
              {t.landing.enter}
            </Link>
            <Link
              href="/academia/cadastro"
              className="hidden items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-primary-deep shadow-soft transition hover:bg-white sm:inline-flex"
            >
              <GraduationCap className="h-4 w-4" /> {t.landing.register}
            </Link>
          </div>
        </div>
      </header>

      <section className="relative isolate flex min-h-[80vh] items-center overflow-hidden bg-gradient-hero">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <img
            src="/assets/academy2.jpeg"
            alt=""
            aria-hidden
            className="h-full w-full object-cover opacity-30 animate-ken-burns"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-deep/90 via-primary/70 to-primary/40" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 overflow-hidden">
          <svg
            className="absolute bottom-0 left-0 h-32 w-[200%] text-white/20 animate-wave-drift-slow"
            viewBox="0 0 2880 160"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0,80 C240,130 480,30 720,70 C960,110 1200,140 1440,80 C1680,30 1920,120 2160,90 C2400,60 2640,100 2880,80 L2880,160 L0,160 Z" />
          </svg>
        </div>

        <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-36 text-primary-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur">
            {t.landing.eyebrow}
          </span>
          <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[1.05] text-balance sm:text-6xl md:text-7xl">
            {t.landing.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-primary-foreground/90 sm:text-xl">
            {t.landing.subtitle}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/academia/cadastro"
              className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-semibold text-coral-foreground shadow-soft transition hover:scale-[1.02]"
            >
              {t.landing.register} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/academia/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/10 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/20"
            >
              {t.landing.enter}
            </Link>
            <span className="text-sm text-primary-foreground/80">{t.landing.free}</span>
          </div>
        </div>
      </section>

      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display text-3xl text-primary-deep sm:text-4xl">{t.landing.featuresTitle}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {t.landing.features.map((feature, index) => {
              const Icon = FEATURE_ICONS[index] ?? PlayCircle;
              return (
                <div key={feature.title} className="rounded-3xl border border-border/60 bg-card p-7 shadow-card">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-cta text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 font-display text-2xl">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-gradient-wave py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display text-3xl text-primary-deep sm:text-4xl">{t.landing.howTitle}</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {t.landing.steps.map((step, index) => (
              <li key={step.title} className="relative rounded-3xl border border-border/60 bg-card/80 p-7 shadow-card">
                <span className="font-display text-5xl text-primary/30">{index + 1}</span>
                <h3 className="mt-2 font-display text-2xl">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display text-3xl text-primary-deep sm:text-4xl">{t.landing.coursesTitle}</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {courses.length > 0 ? t.landing.coursesBody : t.landing.coursesEmpty}
          </p>
          {courses.length > 0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <Link
                  key={course.slug}
                  href="/academia/cadastro"
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-glow"
                >
                  <CourseCover coverUrl={course.coverUrl} title={course.title} />
                  <div className="flex flex-1 flex-col p-6">
                    {course.starter ? (
                      <span className="mb-2 inline-flex w-fit rounded-full bg-coral/15 px-3 py-1 text-xs font-semibold text-coral">
                        {t.catalog.starter}
                      </span>
                    ) : null}
                    <h3 className="font-display text-xl leading-tight group-hover:text-primary">{course.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{course.description}</p>
                    <p className="mt-auto pt-4 text-xs text-muted-foreground">
                      {t.common.lessons(course.lessonCount)} · {fmtDuration(course.totalMinutes)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="relative overflow-hidden bg-primary-deep py-20 text-primary-foreground sm:py-24">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/40 blur-3xl" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-8 px-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl sm:text-4xl">{t.landing.contactTitle}</h2>
            <p className="mt-3 text-primary-foreground/80">{t.landing.contactBody}</p>
          </div>
          <a
            href={`mailto:${ACADEMY_CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 rounded-full bg-white/95 px-6 py-3 text-sm font-semibold text-primary-deep shadow-soft transition hover:bg-white"
          >
            <Mail className="h-4 w-4" /> {ACADEMY_CONTACT_EMAIL}
          </a>
        </div>
      </section>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 md:flex-row">
          <div className="flex items-center gap-2">
            <BrandLogo className="h-9 w-9" />
            <span className="font-display text-lg">Água Pura</span>
          </div>
          <Link href="/" className="text-sm text-primary hover:underline">
            {t.landing.backToSite}
          </Link>
        </div>
      </footer>
    </div>
  );
}

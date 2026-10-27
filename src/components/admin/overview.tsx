"use client";

import Link from "next/link";
import {
  BookOpen,
  ClipboardCheck,
  MessageCircleQuestion,
  PhoneCall,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { PageHeading } from "@/components/admin/admin-shell";
import { toastError, useDateFormat } from "@/components/admin/helpers";
import { useLocale } from "@/components/academy/locale-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/academy/api-client";
import type { AdminOverview } from "@/lib/academy/types";

function StatCard({ icon: Icon, value, label }: { icon: LucideIcon; value: number; label: string }) {
  return (
    <Card className="border-border/60 shadow-card">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary-deep">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-4xl font-semibold leading-none text-primary">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function Overview() {
  const { t } = useLocale();
  const formatDate = useDateFormat();
  const [data, setData] = useState<AdminOverview | null>(null);

  useEffect(() => {
    api<AdminOverview>("/api/admin/overview")
      .then(setData)
      .catch((error) => toastError(error, t.common.error));
  }, [t]);

  return (
    <>
      <PageHeading title={t.admin.overviewHeading} description={t.admin.overviewDescription} />

      {!data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard icon={Users} value={data.students} label={t.admin.statStudents} />
          <StatCard icon={UserCheck} value={data.tutors} label={t.admin.statTutors} />
          <StatCard icon={BookOpen} value={data.publishedCourses} label={t.admin.statCourses} />
          <StatCard
            icon={MessageCircleQuestion}
            value={data.openQuestions}
            label={t.admin.statOpenQuestions}
          />
          <StatCard icon={ClipboardCheck} value={data.pendingGrading} label={t.admin.statGrading} />
          <StatCard
            icon={PhoneCall}
            value={data.pendingFirstContact}
            label={t.admin.statFirstContact}
          />
        </section>
      )}

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-xl">{t.admin.recentStudents}</CardTitle>
          </CardHeader>
          <CardContent>
            {!data ? (
              <Skeleton className="h-40" />
            ) : data.recentStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.admin.noStudents}</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {data.recentStudents.map((student) => (
                  <li key={student.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/alunos/${student.id}`}
                        className="block truncate font-medium text-primary-deep hover:underline"
                      >
                        {student.fullName}
                      </Link>
                      <p className="truncate text-sm text-muted-foreground">
                        {[student.country, student.city].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {formatDate(student.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-xl">{t.admin.recentQuestions}</CardTitle>
          </CardHeader>
          <CardContent>
            {!data ? (
              <Skeleton className="h-40" />
            ) : data.recentQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.admin.noQuestions}</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {data.recentQuestions.map((question) => (
                  <li key={question.id} className="py-3">
                    <Link href="/admin/perguntas" className="block hover:underline">
                      <p className="line-clamp-2 text-sm">{question.text}</p>
                    </Link>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {question.studentName} · {question.courseTitle} · {question.lessonLabel} ·{" "}
                      {formatDate(question.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}

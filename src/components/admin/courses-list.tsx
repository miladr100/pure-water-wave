"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHeading } from "@/components/admin/admin-shell";
import { toastError } from "@/components/admin/helpers";
import { useLocale } from "@/components/academy/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/academy/api-client";
import type { AdminCourseRow } from "@/lib/academy/types";
import { USER_LANGUAGE_LABELS } from "@/lib/user-languages";

function NewCourseDialog() {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await api<{ id: string }>("/api/admin/cursos", {
        method: "POST",
        body: { title: { pt: title }, slug: slug || undefined },
      });
      setOpen(false);
      router.push(`/admin/cursos/${data.id}`);
    } catch (error) {
      toastError(error, t.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus className="h-4 w-4" />
          {t.admin.newCourse}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t.admin.newCourse}</DialogTitle>
            <DialogDescription>{t.admin.coursesDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-course-title">
              {t.admin.courseTitle} ({t.admin.languageTabs.pt})
            </Label>
            <Input
              id="new-course-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              minLength={2}
              disabled={busy}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-course-slug">{t.admin.courseSlug}</Label>
            <Input
              id="new-course-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              disabled={busy}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={busy || !title.trim()}>
              {busy ? t.common.saving : t.admin.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CoursesList() {
  const { t } = useLocale();
  const [courses, setCourses] = useState<AdminCourseRow[] | null>(null);

  useEffect(() => {
    api<{ courses: AdminCourseRow[] }>("/api/admin/cursos")
      .then((data) => setCourses(data.courses))
      .catch((error) => toastError(error, t.common.error));
  }, [t]);

  return (
    <>
      <PageHeading
        title={t.admin.coursesHeading}
        description={t.admin.coursesDescription}
        actions={<NewCourseDialog />}
      />

      {!courses ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.admin.noCourses}</p>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/admin/cursos/${course.id}`} className="group">
              <Card className="flex h-full flex-col border-border/60 shadow-card transition group-hover:border-primary/40">
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="font-display text-xl leading-tight">{course.title.pt}</CardTitle>
                    <Badge variant={course.published ? "default" : "outline"} className="shrink-0">
                      {course.published ? t.admin.published : t.admin.draft}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {USER_LANGUAGE_LABELS[course.language]}
                    {course.starter ? ` · ${t.catalog.starter}` : ""}
                  </p>
                </CardHeader>
                <CardContent className="mt-auto space-y-1 text-sm text-muted-foreground">
                  <p>
                    {course.publishedLessonCount} / {t.common.lessons(course.lessonCount)} ·{" "}
                    {t.admin.enrollments}: {course.enrolledCount}
                  </p>
                  {course.prerequisites.length ? (
                    <p className="truncate">
                      {t.admin.coursePrerequisites}: {course.prerequisites.map((item) => item.title).join(", ")}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}

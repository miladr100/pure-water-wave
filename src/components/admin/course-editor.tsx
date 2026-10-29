"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeading } from "@/components/admin/admin-shell";
import { CourseSettingsForm, type CourseSettingsBody } from "@/components/admin/course-settings-form";
import { ExamEditor } from "@/components/admin/exam-editor";
import { toastError } from "@/components/admin/helpers";
import { ModuleSection } from "@/components/admin/module-section";
import { useLocale } from "@/components/academy/locale-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { api } from "@/lib/academy/api-client";
import type { AdminCourseStructure } from "@/lib/academy/types";
import type { Localized } from "@/lib/academy/localized";

type ModuleInput = { id?: string; number: number; title: Localized };

export function CourseEditor({ courseId }: { courseId: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const [data, setData] = useState<AdminCourseStructure | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchCourse = useCallback(
    () => api<AdminCourseStructure>(`/api/admin/cursos/${courseId}`),
    [courseId],
  );

  useEffect(() => {
    fetchCourse()
      .then(setData)
      .catch((error) => toastError(error, t.common.error));
  }, [fetchCourse, t]);

  const reload = useCallback(async () => {
    try {
      setData(await fetchCourse());
    } catch (error) {
      toastError(error, t.common.error);
    }
  }, [fetchCourse, t]);

  // Every course-level change goes through here, so the whole structure
  // (counts, module ids, lesson numbers) is what the server says it is.
  const patchCourse = useCallback(
    async (body: Partial<CourseSettingsBody> & { published?: boolean; modules?: ModuleInput[] }) => {
      setBusy(true);
      try {
        setData(await api<AdminCourseStructure>(`/api/admin/cursos/${courseId}`, { method: "PATCH", body }));
        toast.success(t.admin.saved);
        return true;
      } catch (error) {
        toastError(error, t.common.error);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [courseId, t],
  );

  async function remove() {
    setBusy(true);
    try {
      await api(`/api/admin/cursos/${courseId}`, { method: "DELETE" });
      router.push("/admin/cursos");
    } catch (error) {
      toastError(error, t.common.error);
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-96" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { course, lessons, exams } = data;
  const modules = course.modules.map((mod) => ({ id: mod.id, number: mod.number, title: mod.title }));
  const finalExam = exams.find((exam) => exam.scope === "final") ?? null;

  return (
    <TooltipProvider delayDuration={200}>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 gap-1 text-muted-foreground">
        <Link href="/admin/cursos">
          <ArrowLeft className="h-4 w-4" />
          {t.common.back}
        </Link>
      </Button>

      <PageHeading
        title={course.title.pt}
        description={`${t.admin.enrollments}: ${data.enrolledCount}`}
        actions={
          <>
            <Badge variant={course.published ? "default" : "outline"}>
              {course.published ? t.admin.published : t.admin.draft}
            </Badge>
            {course.published ? (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/academia/cursos/${course.slug}`} target="_blank">
                  <ExternalLink className="h-4 w-4" />
                  {t.admin.openInAcademy}
                </Link>
              </Button>
            ) : null}
            <Button
              type="button"
              variant={course.published ? "outline" : "default"}
              className="rounded-full"
              disabled={busy}
              onClick={() => void patchCourse({ published: !course.published })}
            >
              {course.published ? t.admin.unpublish : t.admin.publish}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" size="icon" aria-label={t.common.delete} className="text-destructive" disabled={busy}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{course.title.pt}</AlertDialogTitle>
                  <AlertDialogDescription>{t.admin.deleteConfirm}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void remove()}>{t.common.delete}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        }
      />

      <div className="space-y-8">
        <CourseSettingsForm
          key={course.id}
          course={course}
          courseOptions={data.courseOptions}
          onSave={(body) => patchCourse(body)}
        />

        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold text-primary-deep">{t.admin.modules}</h2>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={busy}
              onClick={() => {
                const number = Math.max(0, ...modules.map((mod) => mod.number)) + 1;
                // The default title is content in the authoring language, the
                // same the server gives the first module of a new course.
                void patchCourse({
                  modules: [...modules, { number, title: { pt: `Módulo ${number}`, en: "", es: "" } }],
                });
              }}
            >
              <Plus className="h-4 w-4" />
              {t.admin.newModule}
            </Button>
          </div>

          {modules.map((mod) => (
            <ModuleSection
              key={mod.id}
              courseId={course.id}
              module={mod}
              lessons={lessons.filter((lesson) => lesson.moduleId === mod.id)}
              exam={exams.find((exam) => exam.scope === "module" && exam.moduleId === mod.id) ?? null}
              bunnyUpload={data.bunny.upload}
              onRename={async (title) => {
                await patchCourse({
                  modules: modules.map((item) => (item.id === mod.id ? { ...item, title } : item)),
                });
              }}
              onDelete={async () => {
                await patchCourse({
                  modules: modules
                    .filter((item) => item.id !== mod.id)
                    .map((item, index) => ({ ...item, number: index + 1 })),
                });
              }}
              onChanged={reload}
            />
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-primary-deep">{t.admin.finalActivityLabel}</h2>
          <ExamEditor courseId={course.id} scope="final" moduleId={null} exam={finalExam} onChanged={reload} />
        </section>
      </div>
    </TooltipProvider>
  );
}

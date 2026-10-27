"use client";

import Link from "next/link";
import { ArrowLeft, Cake, Calendar, Clock, Globe, Mail, MapPin, Phone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeading } from "@/components/admin/admin-shell";
import { toastError, useDateFormat } from "@/components/admin/helpers";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/academy/api-client";
import type { AdminStudentDetail, AdminStudentRow } from "@/lib/academy/types";
import type { SessionPayload } from "@/lib/academy/auth";
import { normalizePhone } from "@/lib/phone";
import { USER_LANGUAGE_LABELS } from "@/lib/user-languages";

const NO_TUTOR = "none";

type Patch = {
  firstContact?: boolean;
  tutorNotes?: string;
  assignedTutorId?: string | null;
  role?: "student" | "tutor";
};

function Fact({ icon: Icon, children }: { icon: typeof Mail; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 truncate">{children}</span>
    </div>
  );
}

export function StudentDetail({ studentId, session }: { studentId: string; session: SessionPayload }) {
  const { t } = useLocale();
  const formatDate = useDateFormat();
  const [student, setStudent] = useState<AdminStudentDetail | null>(null);
  const [tutors, setTutors] = useState<AdminStudentRow[]>([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ student: AdminStudentDetail }>(`/api/admin/alunos/${studentId}`)
      .then((data) => {
        setStudent(data.student);
        setNotes(data.student.tutorNotes);
      })
      .catch((error) => toastError(error, t.common.error));
    api<{ tutors: AdminStudentRow[] }>("/api/admin/tutores")
      .then((data) => setTutors(data.tutors))
      .catch((error) => toastError(error, t.common.error));
  }, [studentId, t]);

  const patch = useCallback(
    async (body: Patch) => {
      setBusy(true);
      try {
        const data = await api<{ student: AdminStudentDetail }>(`/api/admin/alunos/${studentId}`, {
          method: "PATCH",
          body,
        });
        setStudent(data.student);
        toast.success(t.admin.saved);
      } catch (error) {
        toastError(error, t.common.error);
      } finally {
        setBusy(false);
      }
    },
    [studentId, t],
  );

  if (!student) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const isTutor = student.role === "tutor";
  const isSelf = student.id === session.userId;
  const phoneDigits = normalizePhone(student.phone);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 gap-1 text-muted-foreground">
        <Link href={isTutor ? "/admin/tutores" : "/admin/alunos"}>
          <ArrowLeft className="h-4 w-4" />
          {t.common.back}
        </Link>
      </Button>

      <PageHeading
        title={student.fullName}
        actions={
          isTutor ? (
            <Badge variant="secondary">{t.header.tutors}</Badge>
          ) : student.firstContactAt ? (
            <Badge variant="secondary">{t.admin.firstContactDone}</Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              {t.admin.firstContactPending}
            </Badge>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/60 shadow-card">
          <CardContent className="space-y-3 p-6">
            <Fact icon={Mail}>
              <a href={`mailto:${student.email}`} className="hover:underline">
                {student.email}
              </a>
            </Fact>
            {student.phone ? (
              <Fact icon={Phone}>
                <a
                  href={`https://wa.me/${phoneDigits}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {student.phone}
                </a>
              </Fact>
            ) : null}
            <Fact icon={MapPin}>{[student.country, student.city].filter(Boolean).join(" · ") || "—"}</Fact>
            <Fact icon={Globe}>{USER_LANGUAGE_LABELS[student.language]}</Fact>
            {student.birthYear ? <Fact icon={Cake}>{student.birthYear}</Fact> : null}
            <Fact icon={Calendar}>
              {t.admin.colSignedUp}: {formatDate(student.createdAt)}
            </Fact>
            <Fact icon={Clock}>
              {t.admin.colLastSeen}: {formatDate(student.lastSeenAt)}
            </Fact>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-xl">{t.admin.colFirstContact}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant={student.firstContactAt ? "outline" : "default"}
              className="w-full rounded-full"
              disabled={busy}
              onClick={() => void patch({ firstContact: !student.firstContactAt })}
            >
              {student.firstContactAt ? t.admin.unmarkFirstContact : t.admin.markFirstContact}
            </Button>
            <div className="space-y-2">
              <Label htmlFor="tutor-notes">{t.admin.notes}</Label>
              <Textarea
                id="tutor-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={t.admin.notesPlaceholder}
                rows={5}
                disabled={busy}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={busy || notes === student.tutorNotes}
                onClick={() => void patch({ tutorNotes: notes })}
              >
                {busy ? t.common.saving : t.common.save}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-xl">{t.admin.assignTutor}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={student.tutor?.id ?? NO_TUTOR}
              onValueChange={(value) =>
                void patch({ assignedTutorId: value === NO_TUTOR ? null : value })
              }
              disabled={busy}
            >
              <SelectTrigger aria-label={t.admin.assignTutor}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_TUTOR}>{t.admin.noTutor}</SelectItem>
                {tutors.map((tutor) => (
                  <SelectItem key={tutor.id} value={tutor.id}>
                    {tutor.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isTutor ? (
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full"
                disabled={busy || isSelf}
                onClick={() => void patch({ role: "student" })}
              >
                {t.admin.revokeTutor}
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="outline" className="w-full rounded-full" disabled={busy}>
                    {t.admin.convertToTutor}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.admin.convertToTutor}</AlertDialogTitle>
                    <AlertDialogDescription>{t.admin.convertConfirm}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void patch({ role: "tutor" })}>
                      {t.common.yes}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 font-display text-2xl font-semibold text-primary-deep">{t.admin.enrollments}</h2>
        {student.enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.admin.noEnrollments}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {student.enrollments.map((enrollment) => (
              <Card key={enrollment.courseId} className="border-border/60 shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-start justify-between gap-3 font-display text-lg">
                    <Link
                      href={`/admin/cursos/${enrollment.courseId}`}
                      className="hover:underline"
                    >
                      {enrollment.courseTitle}
                    </Link>
                    {enrollment.completedAt ? (
                      <Badge variant="secondary">{t.catalog.completed}</Badge>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={enrollment.coursePct} aria-label={t.course.progress(enrollment.coursePct)} />
                  <p className="text-sm text-muted-foreground">
                    {t.course.progress(enrollment.coursePct)} · {enrollment.completedLessons} /{" "}
                    {t.common.lessons(enrollment.lessonCount)}
                  </p>
                  {enrollment.exams.length ? (
                    <div className="flex flex-wrap gap-2">
                      {enrollment.exams.map((exam) => (
                        <Badge
                          key={exam.examId}
                          variant={exam.state === "aprovado" ? "default" : exam.state === "reprovado" ? "destructive" : "outline"}
                        >
                          {exam.label}: {t.admin.examState[exam.state]}
                          {exam.bestScorePct !== null ? ` (${exam.bestScorePct}%)` : ""}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {t.admin.colSignedUp}: {formatDate(enrollment.enrolledAt)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-4 font-display text-2xl font-semibold text-primary-deep">{t.admin.questionsHeading}</h2>
        {student.questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.admin.noQuestions}</p>
        ) : (
          <div className="space-y-3">
            {student.questions.map((question) => (
              <Card key={question.id} className="border-border/60 shadow-card">
                <CardContent className="space-y-2 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      {question.courseTitle} · {question.lessonLabel} · {formatDate(question.createdAt)}
                    </span>
                    <Badge variant={question.status === "open" ? "outline" : "secondary"}>
                      {question.status === "open"
                        ? t.admin.statusOpen
                        : question.status === "answered"
                          ? t.admin.statusAnswered
                          : t.admin.statusArchived}
                    </Badge>
                  </div>
                  <p className="whitespace-pre-line text-sm">{question.text}</p>
                  {question.answer ? (
                    <p className="whitespace-pre-line rounded-lg bg-secondary/60 p-3 text-sm">
                      {question.answer}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

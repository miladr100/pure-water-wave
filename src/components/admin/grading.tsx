"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeading } from "@/components/admin/admin-shell";
import { toastError, useDateFormat } from "@/components/admin/helpers";
import { useLocale } from "@/components/academy/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/academy/api-client";
import type { AdminGradingRow } from "@/lib/academy/types";

type Review = AdminGradingRow["reviews"][number];

function ReviewRow({
  attemptId,
  review,
  onReviewed,
}: {
  attemptId: string;
  review: Review;
  onReviewed: (questionId: string, feedback: string) => void;
}) {
  const { t } = useLocale();
  const [feedback, setFeedback] = useState(review.feedback);
  const [busy, setBusy] = useState(false);

  async function markReviewed() {
    setBusy(true);
    try {
      await api(`/api/admin/correcoes/${attemptId}`, {
        method: "PATCH",
        body: { questionId: review.questionId, feedback, reviewed: true },
      });
      onReviewed(review.questionId, feedback);
      toast.success(t.admin.saved);
    } catch (error) {
      toastError(error, t.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-medium">{review.questionText}</p>
        <div className="flex gap-2">
          {review.reflection ? <Badge variant="outline">{t.admin.reflectionTag}</Badge> : null}
          {review.reviewed ? <Badge variant="secondary">{t.exam.reviewed}</Badge> : null}
        </div>
      </div>
      <p className="whitespace-pre-line rounded-lg bg-secondary/60 p-3 text-sm">{review.answer}</p>
      {review.reviewed ? (
        review.feedback ? (
          <p className="whitespace-pre-line text-sm text-muted-foreground">{review.feedback}</p>
        ) : null
      ) : (
        <>
          <Textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder={t.admin.feedbackPlaceholder}
            rows={3}
            disabled={busy}
          />
          <div className="flex justify-end">
            <Button type="button" size="sm" className="rounded-full" disabled={busy} onClick={() => void markReviewed()}>
              {busy ? t.common.saving : t.admin.markReviewed}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function Grading() {
  const { t } = useLocale();
  const formatDate = useDateFormat();
  const [rows, setRows] = useState<AdminGradingRow[] | null>(null);

  useEffect(() => {
    api<{ rows: AdminGradingRow[] }>("/api/admin/correcoes")
      .then((data) => setRows(data.rows))
      .catch((error) => toastError(error, t.common.error));
  }, [t]);

  // Reviewed rows stay on screen until the page reloads, so the tutor can
  // still see what they just wrote; an attempt leaves only once it's fully done.
  function handleReviewed(attemptId: string, questionId: string, feedback: string) {
    setRows((current) =>
      current
        ? current.map((row) =>
            row.attemptId === attemptId
              ? {
                  ...row,
                  reviews: row.reviews.map((review) =>
                    review.questionId === questionId
                      ? { ...review, reviewed: true, feedback, gradedAt: new Date().toISOString() }
                      : review,
                  ),
                }
              : row,
          )
        : current,
    );
  }

  return (
    <>
      <PageHeading title={t.admin.gradingHeading} description={t.admin.gradingDescription} />

      {!rows ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.admin.noGrading}</p>
      ) : (
        <div className="space-y-6">
          {rows.map((row) => (
            <Card key={row.attemptId} className="border-border/60 shadow-card">
              <CardHeader>
                <CardTitle className="flex flex-wrap items-baseline justify-between gap-2 font-display text-lg">
                  <Link href={`/admin/alunos/${row.studentId}`} className="hover:underline">
                    {row.studentName}
                  </Link>
                  <span className="text-sm font-normal text-muted-foreground">
                    {row.courseTitle} · {row.examLabel} · {formatDate(row.submittedAt)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {row.reviews.map((review, index) => (
                  <div key={review.questionId}>
                    {index > 0 ? <Separator className="mb-5" /> : null}
                    <ReviewRow
                      attemptId={row.attemptId}
                      review={review}
                      onReviewed={(questionId, feedback) => handleReviewed(row.attemptId, questionId, feedback)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

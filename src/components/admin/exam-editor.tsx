"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { isPersistedId, toastError } from "@/components/admin/helpers";
import { newQuestion, QuestionEditor, type EditableQuestion } from "@/components/admin/question-editor";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/academy/api-client";
import type { AdminExam } from "@/lib/academy/types";

type Props = {
  courseId: string;
  scope: "module" | "final";
  moduleId: string | null;
  exam: AdminExam | null;
  onChanged: () => Promise<void> | void;
};

function ExamForm({ exam, title, onChanged }: { exam: AdminExam; title: string; onChanged: Props["onChanged"] }) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  const [passThreshold, setPassThreshold] = useState(exam.passThreshold);
  const [requiredToAdvance, setRequiredToAdvance] = useState(exam.requiredToAdvance);
  const [questions, setQuestions] = useState<EditableQuestion[]>(exam.questions);

  async function save() {
    setBusy(true);
    try {
      // Ids that exist in the database go back so attempts keep matching;
      // temporary client ids are dropped and the server mints fresh ones.
      const body = {
        passThreshold,
        requiredToAdvance,
        questions: questions.map((question) => ({
          ...question,
          id: isPersistedId(question.id) ? question.id : undefined,
          options: question.options.map((option) => ({
            ...option,
            id: isPersistedId(option.id) ? option.id : undefined,
          })),
        })),
      };
      await api(`/api/admin/atividades/${exam.id}`, { method: "PATCH", body });
      toast.success(t.admin.saved);
      await onChanged();
    } catch (error) {
      toastError(error, t.common.error);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api(`/api/admin/atividades/${exam.id}`, { method: "DELETE" });
      await onChanged();
    } catch (error) {
      toastError(error, t.common.error);
    } finally {
      setBusy(false);
    }
  }

  function move(index: number, direction: -1 | 1) {
    setQuestions((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <Card className="border-border/60 shadow-card">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle className="font-display text-lg">
          {title}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {t.common.questions(questions.length)}
          </span>
        </CardTitle>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="text-destructive" disabled={busy}>
              <Trash2 className="h-4 w-4" />
              {t.common.delete}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription>{t.admin.deleteConfirm}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
              <AlertDialogAction onClick={() => void remove()}>{t.common.delete}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-end gap-6">
          <div className="space-y-2">
            <Label htmlFor={`exam-${exam.id}-threshold`}>{t.admin.passThreshold}</Label>
            <Input
              id={`exam-${exam.id}-threshold`}
              type="number"
              min={0}
              max={100}
              value={passThreshold}
              onChange={(event) => setPassThreshold(Number(event.target.value))}
              className="w-28"
              disabled={busy}
            />
          </div>
          {exam.scope === "module" ? (
            <label className="flex items-center gap-3 pb-2 text-sm">
              <Switch checked={requiredToAdvance} onCheckedChange={setRequiredToAdvance} disabled={busy} />
              {t.admin.requiredToAdvance}
            </label>
          ) : null}
        </div>

        <div className="space-y-4">
          {questions.map((question, index) => (
            <QuestionEditor
              key={question.id}
              question={question}
              index={index}
              total={questions.length}
              disabled={busy}
              onChange={(next) =>
                setQuestions((current) => current.map((item) => (item.id === next.id ? next : item)))
              }
              onRemove={() => setQuestions((current) => current.filter((item) => item.id !== question.id))}
              onMove={(direction) => move(index, direction)}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => setQuestions((current) => [...current, newQuestion()])}
          >
            <Plus className="h-4 w-4" />
            {t.admin.newQuestion}
          </Button>
          <Button type="button" className="rounded-full" disabled={busy} onClick={() => void save()}>
            {busy ? t.common.saving : t.common.save}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExamEditor({ courseId, scope, moduleId, exam, onChanged }: Props) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  const title = scope === "final" ? t.admin.finalActivityLabel : t.admin.moduleActivityLabel;

  async function create() {
    setBusy(true);
    try {
      await api(`/api/admin/cursos/${courseId}/atividades`, { method: "POST", body: { scope, moduleId } });
      await onChanged();
    } catch (error) {
      toastError(error, t.common.error);
    } finally {
      setBusy(false);
    }
  }

  if (!exam) {
    return (
      <Card className="border-dashed border-border/60">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm text-muted-foreground">{title}</p>
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void create()}>
            <Plus className="h-4 w-4" />
            {t.admin.newActivity}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // The parent reloads the whole course after any change. Keying the form on
  // the activity's content means only a change to this activity remounts it
  // (and resets what is being typed); a lesson save elsewhere does not.
  return <ExamForm key={JSON.stringify(exam)} exam={exam} title={title} onChanged={onChanged} />;
}

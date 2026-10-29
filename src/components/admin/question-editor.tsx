"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { tempId } from "@/components/admin/helpers";
import { LocalizedField } from "@/components/admin/localized-field";
import { useLocale } from "@/components/academy/locale-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { AdminExam } from "@/lib/academy/types";
import { EMPTY_LOCALIZED } from "@/lib/academy/localized";
import type { QuestionType } from "@/models/exam";

// Mirrors the model's list; importing the model itself would ship mongoose
// to the browser.
const QUESTION_TYPES: QuestionType[] = ["single", "multi", "truefalse", "text", "reflection"];

export type EditableQuestion = AdminExam["questions"][number];
export type EditableOption = EditableQuestion["options"][number];

export function newOption(): EditableOption {
  return { id: tempId(), text: { ...EMPTY_LOCALIZED }, correct: false };
}

export function newQuestion(): EditableQuestion {
  return {
    id: tempId(),
    qtype: "single",
    text: { ...EMPTY_LOCALIZED },
    statementIsTrue: true,
    explanation: { ...EMPTY_LOCALIZED },
    options: [newOption(), newOption()],
  };
}

export function QuestionEditor({
  question,
  index,
  total,
  onChange,
  onRemove,
  onMove,
  disabled,
}: {
  question: EditableQuestion;
  index: number;
  total: number;
  onChange: (next: EditableQuestion) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  disabled?: boolean;
}) {
  const { t } = useLocale();
  const isChoice = question.qtype === "single" || question.qtype === "multi";

  function changeType(qtype: QuestionType) {
    const choice = qtype === "single" || qtype === "multi";
    onChange({
      ...question,
      qtype,
      // Switching to a single-answer type keeps at most one option marked.
      options: !choice
        ? []
        : question.options.length
          ? question.options.map((option, i) => ({
              ...option,
              correct: qtype === "single" ? i === question.options.findIndex((o) => o.correct) : option.correct,
            }))
          : [newOption(), newOption()],
    });
  }

  function setCorrect(optionId: string, correct: boolean) {
    onChange({
      ...question,
      options: question.options.map((option) =>
        option.id === optionId
          ? { ...option, correct }
          : question.qtype === "single" && correct
            ? { ...option, correct: false }
            : option,
      ),
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-card/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-primary-deep">{t.exam.questionOf(index + 1, total)}</p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t.admin.moveUp}
            disabled={disabled || index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t.admin.moveDown}
            disabled={disabled || index === total - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t.common.delete}
            className="text-destructive"
            disabled={disabled}
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
        <div className="space-y-2">
          <Label htmlFor={`q-${question.id}-type`}>{t.admin.questionType}</Label>
          <Select value={question.qtype} onValueChange={(value) => changeType(value as QuestionType)} disabled={disabled}>
            <SelectTrigger id={`q-${question.id}-type`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPES.map((qtype) => (
                <SelectItem key={qtype} value={qtype}>
                  {t.admin.qtypes[qtype]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <LocalizedField
          id={`q-${question.id}-text`}
          label={t.admin.questionText}
          value={question.text}
          onChange={(text) => onChange({ ...question, text })}
          multiline
          rows={2}
          required
          disabled={disabled}
        />
      </div>

      {question.qtype === "truefalse" ? (
        <div className="space-y-4">
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={question.statementIsTrue}
              onCheckedChange={(statementIsTrue) => onChange({ ...question, statementIsTrue })}
              disabled={disabled}
            />
            {t.admin.statementIsTrue}
          </label>
          <LocalizedField
            id={`q-${question.id}-explanation`}
            label={t.admin.explanation}
            value={question.explanation}
            onChange={(explanation) => onChange({ ...question, explanation })}
            multiline
            rows={2}
            disabled={disabled}
          />
        </div>
      ) : null}

      {isChoice ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">{t.admin.options}</p>
          {question.options.map((option) => (
            <div key={option.id} className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
              <label className="mt-1 flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={option.correct}
                  onCheckedChange={(value) => setCorrect(option.id, Boolean(value))}
                  disabled={disabled}
                  aria-label={t.admin.correct}
                />
                {t.admin.correct}
              </label>
              <LocalizedField
                id={`q-${question.id}-o-${option.id}`}
                value={option.text}
                onChange={(text) =>
                  onChange({
                    ...question,
                    options: question.options.map((item) => (item.id === option.id ? { ...item, text } : item)),
                  })
                }
                required
                disabled={disabled}
                className="min-w-0 flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t.common.delete}
                className="shrink-0 text-muted-foreground"
                disabled={disabled || question.options.length <= 2}
                onClick={() =>
                  onChange({ ...question, options: question.options.filter((item) => item.id !== option.id) })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onChange({ ...question, options: [...question.options, newOption()] })}
          >
            <Plus className="h-4 w-4" />
            {t.admin.addOption}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

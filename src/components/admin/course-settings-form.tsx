"use client";

import { useState } from "react";

import { LocalizedField } from "@/components/admin/localized-field";
import { useLocale } from "@/components/academy/locale-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { AdminCourseStructure } from "@/lib/academy/types";
import { EMPTY_LOCALIZED, type Localized } from "@/lib/academy/localized";
import { USER_LANGUAGE_LABELS, USER_LANGUAGES, type UserLanguage } from "@/lib/user-languages";

export type CourseSettingsBody = {
  title: Localized;
  description: Localized;
  coverUrl: string;
  speaker: string;
  language: UserLanguage;
  order: number;
  starter: boolean;
  prerequisites: string[];
};

export function CourseSettingsForm({
  course,
  courseOptions,
  onSave,
}: {
  course: AdminCourseStructure["course"];
  courseOptions: AdminCourseStructure["courseOptions"];
  onSave: (body: CourseSettingsBody) => Promise<boolean>;
}) {
  const { t } = useLocale();
  const [title, setTitle] = useState<Localized>({ ...EMPTY_LOCALIZED, ...course.title });
  const [description, setDescription] = useState<Localized>({ ...EMPTY_LOCALIZED, ...course.description });
  const [coverUrl, setCoverUrl] = useState(course.coverUrl);
  const [speaker, setSpeaker] = useState(course.speaker);
  const [language, setLanguage] = useState<UserLanguage>(course.language);
  const [order, setOrder] = useState(course.order);
  const [starter, setStarter] = useState(course.starter);
  const [prerequisites, setPrerequisites] = useState<string[]>(course.prerequisites);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await onSave({ title, description, coverUrl, speaker, language, order, starter, prerequisites });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-border/60 shadow-card">
      <CardHeader>
        <CardTitle className="font-display text-xl">{t.admin.courseTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-5">
          <LocalizedField id="course-title" label={t.admin.courseTitle} value={title} onChange={setTitle} required disabled={busy} />
          <LocalizedField
            id="course-description"
            label={t.admin.courseDescription}
            value={description}
            onChange={setDescription}
            multiline
            rows={4}
            disabled={busy}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="course-slug">{t.admin.courseSlug}</Label>
              <Input id="course-slug" value={course.slug} readOnly className="text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-speaker">{t.admin.courseSpeaker}</Label>
              <Input id="course-speaker" value={speaker} onChange={(event) => setSpeaker(event.target.value)} disabled={busy} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-cover">{t.admin.courseCover}</Label>
            <Input
              id="course-cover"
              type="url"
              value={coverUrl}
              onChange={(event) => setCoverUrl(event.target.value)}
              disabled={busy}
              autoComplete="off"
            />
            {coverUrl ? (
              // Plain <img>: the cover comes from wherever the tutor hosts it.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="" className="aspect-video w-48 rounded-lg object-cover" />
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="course-language">{t.admin.courseLanguage}</Label>
              <Select value={language} onValueChange={(value) => setLanguage(value as UserLanguage)} disabled={busy}>
                <SelectTrigger id="course-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_LANGUAGES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {USER_LANGUAGE_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-order">{t.admin.courseOrder}</Label>
              <Input
                id="course-order"
                type="number"
                value={order}
                onChange={(event) => setOrder(Number(event.target.value))}
                disabled={busy}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={starter}
              onCheckedChange={(value) => {
                setStarter(value);
                if (value) setPrerequisites([]);
              }}
              disabled={busy}
            />
            {t.admin.courseStarter}
          </label>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t.admin.coursePrerequisites}</p>
            <p className="text-xs text-muted-foreground">{t.admin.coursePrerequisitesHint}</p>
            {courseOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.common.none}</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {courseOptions.map((option) => (
                  <label key={option.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={prerequisites.includes(option.id)}
                      disabled={busy || starter}
                      onCheckedChange={(value) =>
                        setPrerequisites((current) =>
                          value ? [...current, option.id] : current.filter((id) => id !== option.id),
                        )
                      }
                    />
                    {option.title}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="rounded-full" disabled={busy || !title.pt.trim()}>
              {busy ? t.common.saving : t.common.save}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

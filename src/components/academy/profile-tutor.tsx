"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useLocale } from "@/components/academy/locale-provider";
import { SectionCard, patchProfile } from "@/components/academy/profile-shared";
import { describeError, useApi } from "@/components/academy/use-api";
import { UserAvatar } from "@/components/academy/user-avatar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { MeProfile, TutorCard } from "@/lib/academy/types";

const NO_TUTOR = "none";

export function ProfileTutor({
  profile,
  onSaved,
}: {
  profile: MeProfile;
  onSaved: (profile: MeProfile) => void;
}) {
  const { t } = useLocale();
  const tutors = useApi<{ tutors: TutorCard[] }>("/api/academia/tutores");
  const [busy, setBusy] = useState(false);

  async function handleChange(value: string) {
    const assignedTutorId = value === NO_TUTOR ? null : value;
    if (assignedTutorId === (profile.tutor?.id ?? null) || busy) {
      return;
    }
    setBusy(true);
    try {
      const data = await patchProfile({ assignedTutorId });
      onSaved(data.profile);
      toast.success(t.profile.tutorSaved);
    } catch (error) {
      toast.error(describeError(error, t));
    } finally {
      setBusy(false);
    }
  }

  const list = tutors.data?.tutors ?? [];
  // The current tutor stays selectable even if the list no longer carries them.
  const options =
    profile.tutor && !list.some((tutor) => tutor.id === profile.tutor?.id)
      ? [profile.tutor, ...list]
      : list;

  return (
    <SectionCard title={t.profile.tutorSection} description={t.profile.tutorHint}>
      <div className="space-y-5">
        {profile.tutor ? (
          <div className="flex items-center gap-4 rounded-2xl bg-secondary/50 p-4">
            <UserAvatar
              fullName={profile.tutor.fullName}
              photoUrl={profile.tutor.photoUrl}
              className="h-14 w-14"
              textClassName="text-lg"
            />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold text-primary-deep">
                {profile.tutor.fullName}
              </p>
              {profile.tutor.country ? (
                <p className="truncate text-sm text-muted-foreground">{profile.tutor.country}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="rounded-2xl bg-secondary/50 p-4 text-sm text-muted-foreground">
            {t.profile.tutorNone}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="profile-tutor">{t.profile.tutorSection}</Label>
          {tutors.loading ? (
            <Skeleton className="h-9 w-full sm:max-w-xs" />
          ) : (
            <Select
              value={profile.tutor?.id ?? NO_TUTOR}
              onValueChange={(value) => void handleChange(value)}
              disabled={busy}
            >
              <SelectTrigger id="profile-tutor" className="sm:max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_TUTOR}>{t.profile.tutorNone}</SelectItem>
                {options.map((tutor) => (
                  <SelectItem key={tutor.id} value={tutor.id}>
                    {tutor.fullName}
                    {tutor.country ? ` · ${tutor.country}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!tutors.loading && list.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.profile.noTutorsYet}</p>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}

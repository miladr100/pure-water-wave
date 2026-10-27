"use client";

import { Camera, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ErrorState } from "@/components/academy/error-state";
import { fmtDate } from "@/components/academy/format";
import { useLocale } from "@/components/academy/locale-provider";
import { PhotoDialog } from "@/components/academy/photo-dialog";
import { ProfileAccount } from "@/components/academy/profile-account";
import { ProfileDataForm } from "@/components/academy/profile-data-form";
import { ProfilePreferences } from "@/components/academy/profile-preferences";
import { ProfileTutor } from "@/components/academy/profile-tutor";
import { describeError, refreshMe, useApi } from "@/components/academy/use-api";
import { UserAvatar } from "@/components/academy/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/academy/api-client";
import type { SessionPayload } from "@/lib/academy/auth";
import type { MeProfile, MeResponse } from "@/lib/academy/types";

function ProfileHeaderCard({
  profile,
  onChanged,
}: {
  profile: MeProfile;
  onChanged: () => void;
}) {
  const { t, language } = useLocale();
  const [photoOpen, setPhotoOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    setRemoving(true);
    try {
      await api<{ ok: boolean }>("/api/academia/me/foto", { method: "DELETE" });
      toast.success(t.profile.photoSaved);
      onChanged();
    } catch (error) {
      toast.error(describeError(error, t));
    } finally {
      setRemoving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-card sm:p-6">
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left">
        <UserAvatar
          fullName={profile.fullName}
          photoUrl={profile.photoUrl}
          className="h-24 w-24 shadow-soft sm:h-28 sm:w-28"
          textClassName="text-3xl"
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-2xl font-semibold text-primary-deep">
            {profile.fullName}
          </h2>
          <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
          {profile.createdAt ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {t.profile.memberSince(fmtDate(profile.createdAt, language))}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Button
              type="button"
              className="rounded-full"
              onClick={() => setPhotoOpen(true)}
              disabled={removing}
            >
              <Camera className="h-4 w-4" />
              {t.profile.changePhoto}
            </Button>
            {profile.photoUrl ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => void handleRemove()}
                disabled={removing}
              >
                <Trash2 className="h-4 w-4" />
                {t.profile.removePhoto}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <PhotoDialog open={photoOpen} onOpenChange={setPhotoOpen} onSaved={onChanged} />
    </section>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 w-full rounded-3xl" />
      <Skeleton className="h-80 w-full rounded-3xl" />
      <Skeleton className="h-64 w-full rounded-3xl" />
    </div>
  );
}

export function ProfileScreen({ session }: { session: SessionPayload }) {
  const { t } = useLocale();
  const me = useApi<MeResponse>("/api/academia/me");
  // Each section saves on its own and hands back the profile the server
  // answered with, so the others see the change without another GET. The
  // edit is tied to the GET it was based on: a reload wins over it.
  const [edited, setEdited] = useState<{ base: MeResponse; profile: MeProfile } | null>(null);
  const profile =
    edited && me.data && edited.base === me.data ? edited.profile : (me.data?.profile ?? null);

  useEffect(() => {
    if (me.error) {
      toast.error(describeError(me.error, t));
    }
  }, [me.error, t]);

  function reloadAll() {
    me.reload();
    // The header shows the photo from the shared `/me`.
    void refreshMe().catch(() => {});
  }

  function handleSaved(next: MeProfile) {
    if (me.data) {
      setEdited({ base: me.data, profile: next });
    }
    void refreshMe().catch(() => {});
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-display text-3xl font-semibold text-primary-deep md:text-4xl">
          {t.profile.heading}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t.profile.description}</p>
      </section>

      {me.error ? (
        <ErrorState message={describeError(me.error, t)} onRetry={me.reload} />
      ) : !profile ? (
        <ProfileSkeleton />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
          <div className="space-y-6">
            <ProfileHeaderCard profile={profile} onChanged={reloadAll} />
            <ProfileDataForm profile={profile} onSaved={handleSaved} />
            <ProfileAccount
              profile={profile}
              onEmailChanged={(email) => handleSaved({ ...profile, email })}
            />
          </div>
          <div className="space-y-6">
            <ProfilePreferences profile={profile} onSaved={handleSaved} />
            {session.role === "tutor" ? null : (
              <ProfileTutor profile={profile} onSaved={handleSaved} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

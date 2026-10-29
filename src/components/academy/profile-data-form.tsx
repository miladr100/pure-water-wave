"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { todayIso } from "@/components/academy/format";
import { useLocale } from "@/components/academy/locale-provider";
import { FieldError, SectionCard, fieldErrorsOf, patchProfile } from "@/components/academy/profile-shared";
import { describeError } from "@/components/academy/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES, COUNTRIES_MAIN, COUNTRIES_REST } from "@/lib/academy/countries";
import type { MeProfile } from "@/lib/academy/types";

export function ProfileDataForm({
  profile,
  onSaved,
}: {
  profile: MeProfile;
  onSaved: (profile: MeProfile) => void;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.fullName);
  const [country, setCountry] = useState(profile.country);
  const [city, setCity] = useState(profile.city);
  const [phone, setPhone] = useState(profile.phone);
  const [birthday, setBirthday] = useState(profile.birthday ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  // A saved (or reloaded) profile replaces what is in the fields.
  const [syncedProfile, setSyncedProfile] = useState(profile);
  if (syncedProfile !== profile) {
    setSyncedProfile(profile);
    setFullName(profile.fullName);
    setCountry(profile.country);
    setCity(profile.city);
    setPhone(profile.phone);
    setBirthday(profile.birthday ?? "");
  }

  const dirty =
    fullName !== profile.fullName ||
    country !== profile.country ||
    city !== profile.city ||
    phone !== profile.phone ||
    birthday !== (profile.birthday ?? "");

  // A country stored before the list existed still has to show in the select.
  const extraCountry =
    country && !(COUNTRIES as readonly string[]).includes(country) ? country : null;

  // The server answers a code per field; there is no copy per code, so the
  // field is marked and the generic line explains.
  const fieldMessage = (name: string) => (errors[name] ? t.common.error : undefined);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setBusy(true);

    try {
      const nameChanged = fullName.trim() !== profile.fullName;
      const data = await patchProfile({
        fullName: fullName.trim(),
        country,
        city: city.trim(),
        phone: phone.trim(),
        birthday: birthday || null,
      });
      onSaved(data.profile);
      toast.success(t.profile.saved);
      if (nameChanged) {
        // The header greets by name from the session cookie.
        router.refresh();
      }
    } catch (error) {
      const fields = fieldErrorsOf(error);
      setErrors(fields);
      if (Object.keys(fields).length === 0) {
        toast.error(describeError(error, t));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionCard title={t.profile.dataSection}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="profile-name">{t.auth.fullName}</Label>
          <Input
            id="profile-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            minLength={2}
            disabled={busy}
            autoComplete="name"
            aria-invalid={errors.fullName ? true : undefined}
          />
          <FieldError message={fieldMessage("fullName")} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-country">{t.auth.country}</Label>
            <Select value={country} onValueChange={setCountry} disabled={busy}>
              <SelectTrigger id="profile-country" aria-invalid={errors.country ? true : undefined}>
                <SelectValue placeholder={t.auth.selectCountry} />
              </SelectTrigger>
              <SelectContent>
                {extraCountry ? <SelectItem value={extraCountry}>{extraCountry}</SelectItem> : null}
                {COUNTRIES_MAIN.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
                {COUNTRIES_REST.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={fieldMessage("country")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-city">{t.auth.city}</Label>
            <Input
              id="profile-city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              disabled={busy}
              autoComplete="address-level2"
              aria-invalid={errors.city ? true : undefined}
            />
            <FieldError message={fieldMessage("city")} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-phone">{t.auth.phone}</Label>
            <Input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={busy}
              autoComplete="tel"
              placeholder="+55 11 99999-9999"
              aria-invalid={errors.phone ? true : undefined}
            />
            <FieldError message={fieldMessage("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-birthday">{t.profile.birthday}</Label>
            <Input
              id="profile-birthday"
              type="date"
              value={birthday}
              max={todayIso()}
              onChange={(event) => setBirthday(event.target.value)}
              disabled={busy}
              autoComplete="bday"
              aria-invalid={errors.birthday ? true : undefined}
            />
            <FieldError message={fieldMessage("birthday")} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="rounded-full" disabled={busy || !dirty || !country}>
            {busy ? t.common.saving : t.common.save}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

"use client";

import { Eye } from "lucide-react";

import { useLocale } from "@/components/academy/locale-provider";

// Tutors walk the student screens with every gate open and nothing saved;
// this line keeps them from mistaking that for what a student sees.
export function TutorBanner() {
  const { t } = useLocale();

  return (
    <div className="border-b border-border/60 bg-accent/70">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-sm text-accent-foreground sm:px-6">
        <Eye className="h-4 w-4 shrink-0" />
        <span>{t.admin.tutorView}</span>
      </div>
    </div>
  );
}

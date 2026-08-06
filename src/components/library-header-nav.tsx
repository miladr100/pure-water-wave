"use client";

import Link from "next/link";
import { BookOpen, FileText } from "lucide-react";

import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

type LibraryHeaderNavProps = {
  showSupportMaterialsLink?: boolean;
  showBackToLibrary?: boolean;
};

export function LibraryHeaderNav({
  showSupportMaterialsLink = true,
  showBackToLibrary = false,
}: LibraryHeaderNavProps) {
  const { t } = useLocale();

  return (
    <>
      {showBackToLibrary ? (
        <Button asChild variant="outline">
          <Link href="/biblioteca">
            <BookOpen className="h-4 w-4" />
            {t.common.library}
          </Link>
        </Button>
      ) : null}

      {showSupportMaterialsLink ? (
        <Button asChild variant="outline">
          <Link href="/biblioteca/materiais">
            <FileText className="h-4 w-4" />
            {t.common.supportMaterials}
          </Link>
        </Button>
      ) : null}
    </>
  );
}

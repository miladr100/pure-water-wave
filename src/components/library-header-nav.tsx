"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, FileText, PlayCircle, Wrench } from "lucide-react";

import { useLibraryViewer } from "@/components/library-viewer";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

type LibraryHeaderNavProps = {
  showSupportMaterialsLink?: boolean;
  showVideosLink?: boolean;
  showToolsLink?: boolean;
  showBackToLibrary?: boolean;
};

export function LibraryHeaderNav({
  showSupportMaterialsLink = true,
  showVideosLink = true,
  showToolsLink = true,
  showBackToLibrary = false,
}: LibraryHeaderNavProps) {
  const { t } = useLocale();
  const viewer = useLibraryViewer();

  return (
    <>
      {viewer !== "pastor" ? (
        <Button asChild variant="outline">
          <Link href={viewer === "tutor" ? "/admin" : "/academia"}>
            <ArrowLeft className="h-4 w-4" />
            {viewer === "tutor" ? t.common.adminPanel : t.common.academy}
          </Link>
        </Button>
      ) : null}
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

      {showVideosLink ? (
        <Button asChild variant="outline">
          <Link href="/biblioteca/videos">
            <PlayCircle className="h-4 w-4" />
            {t.common.videos}
          </Link>
        </Button>
      ) : null}

      {showToolsLink ? (
        <Button asChild variant="outline">
          <Link href="/biblioteca/ferramentas">
            <Wrench className="h-4 w-4" />
            {t.common.tools}
          </Link>
        </Button>
      ) : null}
    </>
  );
}

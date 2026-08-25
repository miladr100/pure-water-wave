"use client";

import { useState } from "react";

import { LibraryFeedbackButton } from "@/components/library-feedback-button";
import { LibraryHeaderNav } from "@/components/library-header-nav";
import { LibraryMobileMenu } from "@/components/library-mobile-menu";
import { LibrarySettingsMenu } from "@/components/library-settings-menu";
import { LogoutButton } from "@/components/logout-button";

type LibraryHeaderProps = {
  title: string;
  subtitle: string;
  fullName: string;
  showSupportMaterialsLink?: boolean;
  showVideosLink?: boolean;
  showToolsLink?: boolean;
  showBackToLibrary?: boolean;
};

export function LibraryHeader({
  title,
  subtitle,
  fullName,
  showSupportMaterialsLink = true,
  showVideosLink = true,
  showToolsLink = true,
  showBackToLibrary = false,
}: LibraryHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <header className="border-b border-border/60 bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-3 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <LibrarySettingsMenu
            fullName={fullName}
            logoClassName="h-10 w-10"
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
          />
          <LibraryMobileMenu
            showSupportMaterialsLink={showSupportMaterialsLink}
            showVideosLink={showVideosLink}
            showToolsLink={showToolsLink}
            showBackToLibrary={showBackToLibrary}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenFeedback={() => setFeedbackOpen(true)}
          />
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-semibold text-primary-deep md:whitespace-normal">
              {title}
            </p>
            <p className="truncate text-sm text-muted-foreground md:whitespace-normal">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="hidden w-full flex-wrap items-center justify-start gap-2 md:flex xl:w-auto xl:justify-end">
          <LibraryHeaderNav
            showSupportMaterialsLink={showSupportMaterialsLink}
            showVideosLink={showVideosLink}
            showToolsLink={showToolsLink}
            showBackToLibrary={showBackToLibrary}
          />
          <LibraryFeedbackButton open={feedbackOpen} onOpenChange={setFeedbackOpen} />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

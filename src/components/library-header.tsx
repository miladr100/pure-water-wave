import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LibraryHeaderNav } from "@/components/library-header-nav";
import { LogoutButton } from "@/components/logout-button";

type LibraryHeaderProps = {
  title: string;
  subtitle: string;
  showSupportMaterialsLink?: boolean;
  showBackToLibrary?: boolean;
};

export function LibraryHeader({
  title,
  subtitle,
  showSupportMaterialsLink = true,
  showBackToLibrary = false,
}: LibraryHeaderProps) {
  return (
    <header className="border-b border-border/60 bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo className="h-10 w-10 shrink-0" />
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-semibold text-primary-deep">
              {title}
            </p>
            <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <LibraryHeaderNav
            showSupportMaterialsLink={showSupportMaterialsLink}
            showBackToLibrary={showBackToLibrary}
          />
          <LanguageSwitcher />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

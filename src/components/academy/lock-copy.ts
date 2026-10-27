import type { LockReason } from "@/lib/academy/types";
import type { AppMessages } from "@/lib/i18n/academy-messages";

export function lockCopy(reason: LockReason | null | undefined, t: AppMessages) {
  switch (reason) {
    case "not_enrolled":
      return t.course.lockedNotEnrolled;
    case "module_locked":
      return t.course.lockedModule;
    case "lessons_incomplete":
      return t.course.lockedLessons;
    case "modules_incomplete":
      return t.course.lockedModules;
    default:
      return t.course.locked;
  }
}

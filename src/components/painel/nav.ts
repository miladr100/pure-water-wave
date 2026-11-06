import {
  BookOpen,
  Building2,
  FileText,
  GraduationCap,
  MessageCircleQuestion,
  PlayCircle,
  Sparkles,
  Wrench,
  HandCoins,
  Heart,
  Home,
  Library,
  Settings,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import type { AppMessages } from "@/lib/i18n/academy-messages";
import type { PainelMessages } from "@/lib/i18n/painel-messages";
import type { Papeis } from "@/lib/hj/types";

export type ShellArea = "painel" | "academia" | "admin" | "biblioteca";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  // every path that keeps this item active
  match: string[];
  exact?: boolean;
};

export type SubTab = { href: string; label: string; exact?: boolean };

// The sidebar (computer) and bottom bar (phone) of each area. The phone
// shows the first five; the rest live behind "Mais".
export function navFor(area: ShellArea, papeis: Papeis | null, t: PainelMessages, ta: AppMessages): NavItem[] {
  if (area === "biblioteca") {
    return [
      { href: "/biblioteca", label: t.nav.biblioteca, icon: Library, match: ["/biblioteca"], exact: true },
      { href: "/biblioteca/materiais", label: t.nav.materiais, icon: FileText, match: ["/biblioteca/materiais"] },
      { href: "/biblioteca/videos", label: t.nav.videos, icon: PlayCircle, match: ["/biblioteca/videos"] },
      { href: "/biblioteca/ferramentas", label: t.nav.ferramentas, icon: Wrench, match: ["/biblioteca/ferramentas"] },
      { href: "/biblioteca/ia", label: t.nav.ia, icon: Sparkles, match: ["/biblioteca/ia"] },
    ];
  }

  if (area === "academia") {
    return [
      { href: "/academia", label: ta.header.myCourses, icon: GraduationCap, match: ["/academia"], exact: true },
      { href: "/academia/cursos", label: ta.header.catalog, icon: BookOpen, match: ["/academia/cursos"] },
      { href: "/academia/perguntas", label: ta.header.myQuestions, icon: MessageCircleQuestion, match: ["/academia/perguntas"] },
    ];
  }

  if (area === "painel") {
    return [
      { href: "/painel", label: t.nav.inicio, icon: Home, match: ["/painel"], exact: true },
      { href: "/painel/arrecadacao", label: t.nav.arrecadacao, icon: HandCoins, match: ["/painel/arrecadacao"] },
      { href: "/painel/testemunho", label: t.nav.testemunho, icon: Heart, match: ["/painel/testemunho"] },
      ...(papeis?.capitao || papeis?.educador
        ? [{ href: "/painel/equipe", label: t.nav.equipe, icon: Users, match: ["/painel/equipe"] }]
        : []),
    ];
  }

  const base: NavItem[] = [
    { href: "/admin", label: t.nav.inicio, icon: Home, match: ["/admin"], exact: true },
    { href: "/admin/arrecadacao", label: t.nav.arrecadacao, icon: HandCoins, match: ["/admin/arrecadacao"] },
    { href: "/admin/testemunho", label: t.nav.testemunho, icon: Heart, match: ["/admin/testemunho"] },
    {
      href: "/admin/pessoas",
      label: t.nav.pessoas,
      icon: Users,
      match: ["/admin/pessoas", "/admin/tutores", "/admin/pastores", "/admin/contas"],
    },
    {
      href: "/admin/academia",
      label: t.nav.academia,
      icon: GraduationCap,
      match: ["/admin/academia", "/admin/alunos", "/admin/cursos", "/admin/perguntas", "/admin/correcoes"],
    },
    { href: "/admin/equipes", label: t.nav.equipes, icon: UsersRound, match: ["/admin/equipes"] },
  ];
  if (papeis?.administrador) {
    base.push(
      { href: "/admin/organizacao", label: t.nav.organizacao, icon: Building2, match: ["/admin/organizacao"] },
      { href: "/admin/configuracoes", label: t.nav.configuracoes, icon: Settings, match: ["/admin/configuracoes"] },
    );
  }
  return base;
}

export function isActive(item: NavItem, pathname: string) {
  return item.match.some((path) => (item.exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`)));
}

// Pages that share one sidebar item get a row of tabs under the header.
export function subTabsFor(pathname: string, papeis: Papeis | null, t: PainelMessages): SubTab[] | null {
  const people = ["/admin/pessoas", "/admin/tutores", "/admin/pastores", "/admin/contas"];
  if (people.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return [
      { href: "/admin/pessoas", label: t.admin.membersTab, exact: true },
      { href: "/admin/pessoas/educadores", label: t.admin.educatorsTab },
      ...(papeis?.administrador ? [{ href: "/admin/pessoas/administradores", label: t.admin.adminsTab }] : []),
      { href: "/admin/pastores", label: t.admin.pastorsTab },
    ];
  }
  const academy = ["/admin/academia", "/admin/alunos", "/admin/cursos", "/admin/perguntas", "/admin/correcoes"];
  if (academy.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return [
      { href: "/admin/academia", label: "Visão geral", exact: true },
      { href: "/admin/alunos", label: "Alunos" },
      { href: "/admin/cursos", label: "Cursos" },
      { href: "/admin/perguntas", label: "Perguntas" },
      { href: "/admin/correcoes", label: "Correções" },
    ];
  }
  return null;
}


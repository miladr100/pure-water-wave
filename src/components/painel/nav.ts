import {
  BookOpen,
  Building2,
  CalendarClock,
  ClipboardList,
  FileText,
  GraduationCap,
  HandCoins,
  Heart,
  Home,
  Library,
  MapPinned,
  MessageCircleQuestion,
  PlayCircle,
  Settings,
  Sparkles,
  Target,
  Users,
  UsersRound,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import type { AppMessages } from "@/lib/i18n/academy-messages";
import type { PainelMessages } from "@/lib/i18n/painel-messages";
import type { Modulos, Papeis } from "@/lib/hj/types";

// The frame the page is drawn in: the member's panel, the educator's
// administration, the academy, the library.
export type ShellArea = "painel" | "academia" | "admin" | "biblioteca";

// The five modules of the switch (Milad, 13/11/2026): Painel (people,
// teams, meetings, organisation), Restauração Material, Testemunho,
// Academia, Biblioteca. A module is read off the path, so URLs stay.
export type Modulo = "painel" | "rm" | "testemunho" | "academia" | "biblioteca";

export const ACADEMY_ADMIN_PATHS = ["/admin/academia", "/admin/alunos", "/admin/cursos", "/admin/perguntas", "/admin/correcoes", "/admin/tutores"];

const under = (pathname: string, paths: string[]) => paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

export function moduloOf(pathname: string): Modulo {
  if (pathname.startsWith("/academia") || under(pathname, ACADEMY_ADMIN_PATHS)) return "academia";
  if (pathname.startsWith("/biblioteca")) return "biblioteca";
  if (under(pathname, ["/painel/arrecadacao", "/painel/equipe", "/admin/arrecadacao", "/admin/equipes"])) return "rm";
  if (under(pathname, ["/painel/testemunho", "/admin/testemunho"])) return "testemunho";
  return "painel";
}

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  // every path that keeps this item active
  match: string[];
  exact?: boolean;
  // when set, the item is active only with this `?aba=` (tabs of one page)
  aba?: string;
};

export type SubTab = { href: string; label: string; exact?: boolean };

export type NavOptions = { aiChat?: boolean; pathname?: string; modulos?: Modulos | null };

// The sidebar (computer) and bottom bar (phone) of the module the person
// is in. The phone shows the first five; the rest live behind "Mais".
export function navFor(area: ShellArea, papeis: Papeis | null, t: PainelMessages, ta: AppMessages, options: NavOptions = {}): NavItem[] {
  const pathname = options.pathname ?? "";
  const modulo = area === "academia" ? "academia" : area === "biblioteca" ? "biblioteca" : moduloOf(pathname);
  const educador = Boolean(papeis?.educador);
  const admin = Boolean(papeis?.administrador);

  if (modulo === "biblioteca") {
    const items: NavItem[] = [
      { href: "/biblioteca", label: t.nav.inicio, icon: Home, match: ["/biblioteca"], exact: true },
      { href: "/biblioteca/materiais", label: t.nav.materiais, icon: FileText, match: ["/biblioteca/materiais"] },
      { href: "/biblioteca/videos", label: t.nav.videos, icon: PlayCircle, match: ["/biblioteca/videos"] },
      { href: "/biblioteca/ferramentas", label: t.nav.ferramentas, icon: Wrench, match: ["/biblioteca/ferramentas"] },
    ];
    if (options.aiChat !== false) {
      items.push({ href: "/biblioteca/ia", label: t.nav.ia, icon: Sparkles, match: ["/biblioteca/ia"] });
    }
    return items;
  }

  if (modulo === "academia") {
    if (area === "admin") {
      // The educator's academy: the old sub-tabs, now the module's menu.
      return [
        { href: "/admin/academia", label: t.nav.visaoGeral, icon: Home, match: ["/admin/academia"], exact: true },
        { href: "/admin/alunos", label: t.nav.alunos, icon: Users, match: ["/admin/alunos", "/admin/tutores"] },
        { href: "/admin/cursos", label: t.nav.cursos, icon: BookOpen, match: ["/admin/cursos"] },
        { href: "/admin/perguntas", label: t.nav.perguntas, icon: MessageCircleQuestion, match: ["/admin/perguntas"] },
        { href: "/admin/correcoes", label: t.nav.correcoes, icon: ClipboardList, match: ["/admin/correcoes"] },
        { href: "/academia", label: t.nav.verComoAluno, icon: GraduationCap, match: [] },
      ];
    }
    return [
      { href: "/academia", label: ta.header.myCourses, icon: GraduationCap, match: ["/academia"], exact: true },
      { href: "/academia/cursos", label: ta.header.catalog, icon: BookOpen, match: ["/academia/cursos"] },
      { href: "/academia/perguntas", label: ta.header.myQuestions, icon: MessageCircleQuestion, match: ["/academia/perguntas"] },
    ];
  }

  // ---------- the member's modules ----------
  if (area === "painel") {
    if (modulo === "rm") {
      return [
        { href: "/painel/arrecadacao", label: t.nav.relatorioDia, icon: HandCoins, match: ["/painel/arrecadacao"] },
        ...(papeis?.capitao ? [{ href: "/painel/equipe", label: t.nav.minhaEquipe, icon: Users, match: ["/painel/equipe"] }] : []),
      ];
    }
    if (modulo === "testemunho") {
      return [
        { href: "/painel/testemunho", label: t.nav.convidados, icon: Heart, match: ["/painel/testemunho"], exact: true },
        ...(papeis?.capitao ? [{ href: "/painel/testemunho/caixa", label: t.nav.caixa, icon: Wallet, match: ["/painel/testemunho/caixa"] }] : []),
      ];
    }
    return [
      { href: "/painel", label: t.nav.inicio, icon: Home, match: ["/painel"], exact: true },
      { href: "/painel/reunioes", label: t.nav.reunioes, icon: CalendarClock, match: ["/painel/reunioes"] },
    ];
  }

  // ---------- the educator's modules ----------
  if (modulo === "rm") {
    return [
      { href: "/admin/arrecadacao", label: t.admin.resultsTab, icon: Target, match: ["/admin/arrecadacao"], exact: true },
      { href: "/admin/arrecadacao?aba=relatorios", label: t.admin.reportsTab, icon: HandCoins, match: ["/admin/arrecadacao"], aba: "relatorios" },
      { href: "/admin/arrecadacao?aba=metas", label: t.admin.goalsTab, icon: Target, match: ["/admin/arrecadacao"], aba: "metas" },
      { href: "/admin/arrecadacao?aba=contabilidade", label: t.admin.accountingTab, icon: Wallet, match: ["/admin/arrecadacao"], aba: "contabilidade" },
      { href: "/admin/equipes", label: t.nav.equipes, icon: UsersRound, match: ["/admin/equipes"] },
    ];
  }
  if (modulo === "testemunho") {
    return [
      { href: "/admin/testemunho", label: t.nav.convidados, icon: Heart, match: ["/admin/testemunho"], exact: true },
      { href: "/admin/testemunho/resultados", label: t.nav.porArea, icon: MapPinned, match: ["/admin/testemunho/resultados"] },
      { href: "/admin/testemunho/caixa", label: t.nav.caixa, icon: Wallet, match: ["/admin/testemunho/caixa"] },
    ];
  }
  const base: NavItem[] = [
    { href: "/admin", label: t.nav.inicio, icon: Home, match: ["/admin"], exact: true },
    { href: "/admin/pessoas", label: t.nav.pessoas, icon: Users, match: ["/admin/pessoas", "/admin/pastores", "/admin/contas"] },
    { href: "/admin/reunioes", label: t.nav.reunioes, icon: CalendarClock, match: ["/admin/reunioes"] },
  ];
  if (admin) {
    base.push(
      { href: "/admin/biblioteca", label: t.nav.biblioteca, icon: Library, match: ["/admin/biblioteca"] },
      { href: "/admin/organizacao", label: t.nav.organizacao, icon: Building2, match: ["/admin/organizacao"] },
      { href: "/admin/configuracoes", label: t.nav.configuracoes, icon: Settings, match: ["/admin/configuracoes"] },
    );
  }
  void educador;
  return base;
}

export function isActive(item: NavItem, pathname: string, aba: string | null = null) {
  const onPath = item.match.some((path) => (item.exact || item.aba !== undefined ? pathname === path : pathname === path || pathname.startsWith(`${path}/`)));
  if (!onPath) {
    return false;
  }
  if (item.aba !== undefined) {
    return aba === item.aba;
  }
  // a tabbed page's first item is active only without a tab
  if (item.exact && item.match.some((path) => path === pathname) && aba) {
    return false;
  }
  return true;
}

// Pages that share one sidebar item get a row of tabs under the header.
export function subTabsFor(pathname: string, papeis: Papeis | null, t: PainelMessages): SubTab[] | null {
  const people = ["/admin/pessoas", "/admin/pastores", "/admin/contas"];
  if (under(pathname, people)) {
    return [
      { href: "/admin/pessoas", label: t.admin.membersTab, exact: true },
      { href: "/admin/pessoas/educadores", label: t.admin.educatorsTab },
      ...(papeis?.administrador ? [{ href: "/admin/pessoas/administradores", label: t.admin.adminsTab }] : []),
      { href: "/admin/pastores", label: t.admin.pastorsTab },
    ];
  }
  if (under(pathname, ["/admin/organizacao"])) {
    return [
      { href: "/admin/organizacao", label: t.admin.projectsTitle, exact: true },
      { href: "/admin/organizacao/programas", label: t.pessoa.programsTitle },
      { href: "/admin/organizacao/areas", label: t.missao.title },
    ];
  }
  return null;
}

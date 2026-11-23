import {
  BookOpen,
  Building2,
  CalendarClock,
  ChartPie,
  ClipboardList,
  FileText,
  GraduationCap,
  HandCoins,
  Heart,
  Home,
  Library,
  List,
  MessageCircleQuestion,
  PlayCircle,
  Settings,
  Sparkles,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import type { AppMessages } from "@/lib/i18n/academy-messages";
import type { PainelMessages } from "@/lib/i18n/painel-messages";
import type { Modulos, Papeis } from "@/lib/hj/types";

// The frame the page is drawn in: the member's panel, the educator's
// administration, the academy, the library.
export type ShellArea = "painel" | "academia" | "admin" | "biblioteca";

// The modules of the switch: Painel, Contabilidade, Academia, Biblioteca.
// Restauração Material and Testemunho were modules of their own for two
// days (Milad, 13/11/2026) and went back into the Painel as sidebar items
// (Victor, 15/11/2026): they are what the Painel is about. A module is
// read off the path, so URLs stay.
export type Modulo = "painel" | "contabilidade" | "academia" | "biblioteca";

export const ACADEMY_ADMIN_PATHS = ["/admin/academia", "/admin/alunos", "/admin/cursos", "/admin/perguntas", "/admin/correcoes", "/admin/tutores"];

const under = (pathname: string, paths: string[]) => paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

export function moduloOf(pathname: string): Modulo {
  if (pathname.startsWith("/academia") || under(pathname, ACADEMY_ADMIN_PATHS)) return "academia";
  if (pathname.startsWith("/biblioteca")) return "biblioteca";
  if (under(pathname, ["/painel/contabilidade", "/admin/contabilidade"])) return "contabilidade";
  return "painel";
}

export type NavItem = {
  href: string;
  label: string;
  // the phone's bottom bar has room for a word, not for a name
  curto?: string;
  icon: LucideIcon;
  // every path that keeps this item active
  match: string[];
  exact?: boolean;
  // when set, the item is active only with this `?aba=` (tabs of one page)
  aba?: string;
};

// `aba` ties a tab to the page's `?aba=`; null is the page without one.
export type SubTab = { href: string; label: string; exact?: boolean; aba?: string | null };

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

  // The accounting module is the same four screens on both sides.
  if (modulo === "contabilidade") {
    const raiz = area === "admin" ? "/admin/contabilidade" : "/painel/contabilidade";
    const inicio: NavItem = { href: raiz, label: t.nav.inicio, icon: Home, match: [raiz], exact: true };
    // a member who is not the captain only finds the note that sends them to the RM report
    if (area === "painel" && !papeis?.capitao) {
      return [inicio];
    }
    return [
      inicio,
      { href: `${raiz}/movimentos`, label: t.nav.movimentos, icon: List, match: [`${raiz}/movimentos`] },
      { href: `${raiz}/informes`, label: t.nav.informes, icon: ChartPie, match: [`${raiz}/informes`] },
      { href: `${raiz}/ajustes`, label: t.nav.ajustes, icon: Settings, match: [`${raiz}/ajustes`] },
    ];
  }

  // ---------- the member's Painel ----------
  if (area === "painel") {
    // testimony shows only while the administrator has it on (or the person is already inside)
    const testemunho = Boolean(options.modulos?.testemunho) || under(pathname, ["/painel/testemunho"]);
    return [
      { href: "/painel", label: t.nav.inicio, icon: Home, match: ["/painel"], exact: true },
      { href: "/painel/arrecadacao", label: t.areas.rm, curto: t.areas.rmShort, icon: HandCoins, match: ["/painel/arrecadacao", "/painel/equipe"] },
      ...(testemunho ? [{ href: "/painel/testemunho", label: t.areas.testemunho, icon: Heart, match: ["/painel/testemunho"] }] : []),
      { href: "/painel/reunioes", label: t.nav.reunioes, icon: CalendarClock, match: ["/painel/reunioes"] },
    ];
  }

  // ---------- the educator's Painel ----------
  const base: NavItem[] = [
    { href: "/admin", label: t.nav.inicio, icon: Home, match: ["/admin"], exact: true },
    { href: "/admin/arrecadacao", label: t.areas.rm, curto: t.areas.rmShort, icon: HandCoins, match: ["/admin/arrecadacao", "/admin/equipes"] },
    { href: "/admin/testemunho", label: t.areas.testemunho, icon: Heart, match: ["/admin/testemunho"] },
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
  // Restauração Material: one sidebar item, its pages in tabs.
  if (under(pathname, ["/admin/arrecadacao", "/admin/equipes"])) {
    return [
      { href: "/admin/arrecadacao", label: t.admin.resultsTab, aba: null },
      { href: "/admin/arrecadacao?aba=relatorios", label: t.admin.reportsTab, aba: "relatorios" },
      { href: "/admin/arrecadacao?aba=metas", label: t.admin.goalsTab, aba: "metas" },
      { href: "/admin/arrecadacao?aba=contabilidade", label: t.admin.accountingTab, aba: "contabilidade" },
      { href: "/admin/arrecadacao?aba=areas", label: t.admin.areasTab, aba: "areas" },
      { href: "/admin/equipes", label: t.nav.equipes },
    ];
  }
  if (under(pathname, ["/admin/testemunho"])) {
    return [
      { href: "/admin/testemunho", label: t.nav.convidados },
      { href: "/admin/testemunho/equipes", label: t.nav.equipes },
      { href: "/admin/testemunho/resultados", label: t.nav.porArea },
      { href: "/admin/testemunho/caixa", label: t.nav.caixa },
    ];
  }
  // The member's side: only the captain has a second RM page.
  if (under(pathname, ["/painel/arrecadacao", "/painel/equipe"])) {
    return papeis?.capitao
      ? [
          { href: "/painel/arrecadacao", label: t.nav.relatorioDia },
          { href: "/painel/equipe", label: t.nav.minhaEquipe },
        ]
      : null;
  }
  if (under(pathname, ["/painel/testemunho"])) {
    return [
      { href: "/painel/testemunho", label: t.nav.convidados },
      { href: "/painel/testemunho/caixa", label: t.nav.caixa },
    ];
  }
  return null;
}

// The tab the person is on: the deepest path that holds the page, and on
// a page with `?aba=` the tab of that value (the first tab when the value
// is absent or unknown).
export function activeSubTab(tabs: SubTab[], pathname: string, aba: string | null): string | null {
  let best: { href: string; depth: number } | null = null;
  for (const tab of tabs) {
    const path = tab.href.split("?")[0];
    const onPath = tab.exact || tab.aba !== undefined ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
    if (!onPath) continue;
    if (tab.aba !== undefined) {
      const known = tabs.some((other) => other.href.split("?")[0] === path && typeof other.aba === "string" && other.aba === aba);
      if (tab.aba === null ? known : tab.aba !== aba) continue;
    }
    if (!best || path.length > best.depth) best = { href: tab.href, depth: path.length };
  }
  return best?.href ?? null;
}

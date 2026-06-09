"use client";

import { useState } from "react";
import {
  Heart,
  Droplets,
  Waves,
  Sparkles,
  Globe2,
  Users,
  GraduationCap,
  HandHeart,
  ShieldCheck,
  FileText,
  Mail,
  CreditCard,
  QrCode,
  ArrowRight,
  Check,
  Quote,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  formatDonationAmount,
  getDonationAmount,
} from "@/lib/donation-amount";

const heroImg = "/assets/hero-youth.jpg";
const g1 = "/assets/gallery-1.jpg";
const g2 = "/assets/gallery-2.jpg";
const g3 = "/assets/gallery-3.jpg";
const g4 = "/assets/gallery-4.jpg";
const a1 = "/assets/avatar-1.jpg";
const a2 = "/assets/avatar-2.jpg";
const a3 = "/assets/avatar-3.jpg";
const a4 = "/assets/avatar-4.jpg";
const a5 = "/assets/avatar-5.jpg";
const a6 = "/assets/avatar-6.jpg";

// WhatsApp destination (international format, digits only)
const WHATSAPP_NUMBER = "5511999999999";

const COUNTRIES: { name: string; flag: string }[] = [
  { name: "Brasil", flag: "🇧🇷" },
  { name: "Argentina", flag: "🇦🇷" },
  { name: "Bolívia", flag: "🇧🇴" },
  { name: "Peru", flag: "🇵🇪" },
  { name: "Portugal", flag: "🇵🇹" },
  { name: "São Tomé e Príncipe", flag: "🇸🇹" },
];

type Impact = {
  icon: typeof GraduationCap;
  title: string;
  desc: string;
  gallery: string[];
  long: string;
};

const IMPACTS: Impact[] = [
  {
    icon: GraduationCap,
    title: "Formações e workshops",
    desc: "Trilhas de desenvolvimento para jovens líderes.",
    gallery: [g1, g4, g2],
    long:
      "Promovemos trilhas formativas com encontros semanais, workshops temáticos e mentorias com lideranças de diferentes áreas. Cada jovem recebe acompanhamento individual e participa de dinâmicas de grupo que desenvolvem autoconhecimento, comunicação, propósito e liderança consciente.",
  },
  {
    icon: HandHeart,
    title: "Ações sociais e culturais",
    desc: "Iniciativas que transformam comunidades inteiras.",
    gallery: [g3, g1, g4],
    long:
      "Levamos ações culturais, educativas e de cuidado a comunidades em situação de vulnerabilidade. Mutirões, oficinas de arte, atividades com crianças e idosos, distribuição de alimentos e campanhas de saúde — sempre com protagonismo dos jovens locais.",
  },
  {
    icon: Users,
    title: "Educação em valores",
    desc: "Programas de liderança, ética e responsabilidade.",
    gallery: [g4, g2, g1],
    long:
      "Trabalhamos valores como integridade, respeito, gratidão e responsabilidade através de programas estruturados de educação humana. Conteúdos vivenciais que ajudam o jovem a construir uma base sólida para tomar boas decisões na vida pessoal, profissional e cívica.",
  },
  {
    icon: Globe2,
    title: "Intercâmbio cultural",
    desc: "Encontros entre jovens de diferentes países.",
    gallery: [g2, g3, g4],
    long:
      "Conectamos jovens de Brasil, Argentina, Bolívia, Peru, Portugal e São Tomé e Príncipe em encontros presenciais e virtuais. O intercâmbio amplia visão de mundo, fortalece amizades transcontinentais e inspira novos projetos colaborativos entre culturas.",
  },
  {
    icon: Sparkles,
    title: "Consciência e pureza",
    desc: "Jovens com clareza de propósito e coração aberto.",
    gallery: [g1, g2, g3],
    long:
      "Cultivamos práticas de silêncio, leitura, autorreflexão e serviço ao próximo. Um caminho de pureza interior que reflete em escolhas mais coerentes, relações mais verdadeiras e um senso de propósito que move o jovem para fora de si.",
  },
  {
    icon: Waves,
    title: "Cuidado com o planeta",
    desc: "Cuidado ativo com o meio ambiente e a sociedade.",
    gallery: [g3, g4, g2],
    long:
      "Organizamos limpezas de praias e rios, plantios coletivos, hortas comunitárias e campanhas de consumo consciente. A ecologia integral nos lembra que cuidar da casa comum é também cuidar das pessoas que vivem nela.",
  },
];

const DONATIONS = [
  { amount: 30, label: "Ajude na formação de um jovem", popular: false },
  { amount: 50, label: "Apoie materiais e atividades educativas", popular: false },
  { amount: 100, label: "Fortaleça workshops e encontros", popular: true },
  { amount: 300, label: "Patrocine uma ação de impacto social", popular: false },
];

const TESTIMONIALS = [
  {
    photo: a1,
    quote: "Encontrei propósito, amigos do mundo inteiro e uma comunidade que acredita em mim.",
    name: "Mariana Souza",
    role: "Jovem participante — Brasil",
  },
  {
    photo: a2,
    quote: "Vi de perto como a formação muda o olhar de um jovem sobre si e sobre a sociedade.",
    name: "Luís Tavares",
    role: "Voluntário — Portugal",
  },
  {
    photo: a3,
    quote: "O intercâmbio com jovens de outros países nos ensinou que somos uma só onda.",
    name: "Camila Acosta",
    role: "Líder regional — Argentina",
  },
  {
    photo: a4,
    quote: "Aprendi a servir minha comunidade e descobri que sou capaz de inspirar outros jovens.",
    name: "Adilson Neves",
    role: "Jovem líder — São Tomé e Príncipe",
  },
  {
    photo: a5,
    quote: "Cada encontro é uma semente. Hoje vejo minha cidade florescer com o que plantamos.",
    name: "Yara Quispe",
    role: "Voluntária — Bolívia",
  },
  {
    photo: a6,
    quote: "Cheguei tímido e saí com coragem para liderar um projeto social no meu bairro.",
    name: "Mateo Vargas",
    role: "Jovem participante — Peru",
  },
];

/* -------------------- Hero animated background -------------------- */
function HeroAnimatedBg() {
  // Pre-computed bubble positions for a stable SSR render
  const bubbles = [
    { left: 6, size: 14, delay: 0, duration: 16, opacity: 0.35 },
    { left: 14, size: 22, delay: 4, duration: 22, opacity: 0.25 },
    { left: 22, size: 10, delay: 2, duration: 14, opacity: 0.4 },
    { left: 33, size: 28, delay: 7, duration: 24, opacity: 0.2 },
    { left: 44, size: 12, delay: 1, duration: 18, opacity: 0.4 },
    { left: 55, size: 18, delay: 5, duration: 20, opacity: 0.3 },
    { left: 64, size: 9, delay: 3, duration: 13, opacity: 0.45 },
    { left: 73, size: 24, delay: 6, duration: 26, opacity: 0.22 },
    { left: 82, size: 14, delay: 0.5, duration: 17, opacity: 0.35 },
    { left: 91, size: 20, delay: 8, duration: 23, opacity: 0.28 },
  ];
  return (
    <>
      {/* Background photo with slow Ken Burns motion */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <img
          src={heroImg}
          alt=""
          aria-hidden
          className="h-full w-full object-cover animate-ken-burns"
        />
      </div>
      {/* Color overlays */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-deep/85 via-primary/70 to-primary/40" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-primary-deep/85 via-transparent to-primary-deep/30" />

      {/* Floating bubbles for liquid feel */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {bubbles.map((b, i) => (
          <span
            key={i}
            className="absolute bottom-[-10vh] rounded-full bg-white/40 blur-[1px] animate-bubble"
            style={{
              left: `${b.left}%`,
              width: b.size,
              height: b.size,
              opacity: b.opacity,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Animated drifting wave layers */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 -z-10 h-48 overflow-hidden">
        <svg
          className="absolute bottom-0 left-0 h-40 w-[200%] text-white/15 animate-wave-drift-slow"
          viewBox="0 0 2880 160"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,80 C240,130 480,30 720,70 C960,110 1200,140 1440,80 C1680,30 1920,120 2160,90 C2400,60 2640,100 2880,80 L2880,160 L0,160 Z" />
        </svg>
        <svg
          className="absolute bottom-0 left-0 h-32 w-[200%] text-white/25 animate-wave-drift"
          viewBox="0 0 2880 160"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,100 C200,60 400,140 600,100 C800,60 1000,130 1200,90 C1400,50 1600,120 1800,100 C2000,80 2200,40 2400,90 C2600,140 2800,100 2880,90 L2880,160 L0,160 Z" />
        </svg>
      </div>
    </>
  );
}

/* -------------------- Floating WhatsApp -------------------- */
function FloatingWhatsApp() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ name: "", email: "" });

  const handleStart = () => {
    if (!data.name || !data.email) {
      toast.error("Preencha seu nome e e-mail para iniciar a conversa.");
      return;
    }
    const msg = `Olá! Sou ${data.name} (${data.email}) e gostaria de saber mais sobre o Água Pura.`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
    setData({ name: "", email: "" });
    toast.success("Abrindo o WhatsApp...");
  };

  return (
    <>
      <button
        type="button"
        aria-label="Falar no WhatsApp"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-glow hover:scale-110 transition-transform"
      >
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ripple" />
        <MessageCircle className="relative h-7 w-7" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-[#25D366]" /> Falar no WhatsApp
            </DialogTitle>
            <DialogDescription>
              Deixe seu nome e e-mail e seguimos a conversa direto no WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="wa-name">Nome</Label>
              <Input
                id="wa-name"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                placeholder="Seu nome"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="wa-email">E-mail</Label>
              <Input
                id="wa-email"
                type="email"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                placeholder="voce@email.com"
                className="mt-1"
              />
            </div>
            <Button
              type="button"
              onClick={handleStart}
              className="w-full h-11 rounded-full bg-[#25D366] hover:bg-[#1ebe5b] text-white font-semibold"
            >
              <MessageCircle className="h-5 w-5" /> Abrir conversa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* -------------------- Impact dialog with carousel -------------------- */
function ImpactDialog({
  impact,
  open,
  onOpenChange,
}: {
  impact: Impact | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [idx, setIdx] = useState(0);
  if (!impact) return null;
  const total = impact.gallery.length;
  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);
  const Icon = impact.icon;
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setIdx(0);
      }}
    >
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="relative aspect-[16/9] bg-muted">
          {impact.gallery.map((src, i) => (
            <img
              key={src + i}
              src={src}
              alt={`${impact.title} — imagem ${i + 1}`}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                i === idx ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <button
            type="button"
            onClick={prev}
            aria-label="Imagem anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-foreground hover:bg-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Próxima imagem"
            className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-foreground hover:bg-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {impact.gallery.map((_, i) => (
              <button
                key={i}
                aria-label={`Ir para imagem ${i + 1}`}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? "w-6 bg-white" : "w-2 bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="p-7">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-cta text-primary-foreground">
                <Icon className="h-5 w-5" />
              </span>
              {impact.title}
            </DialogTitle>
          </DialogHeader>
          <p className="mt-4 text-foreground/80 leading-relaxed">{impact.long}</p>
          <a
            href="#doar"
            onClick={() => onOpenChange(false)}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-coral text-coral-foreground px-5 py-2.5 text-sm font-semibold shadow-soft hover:scale-[1.02] transition"
          >
            <Heart className="h-4 w-4 fill-current" /> Apoiar este pilar
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Newsletter form -------------------- */
function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState({ name: "", email: "", consent: true });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.email || !data.consent) {
      toast.error("Informe seu e-mail e aceite receber as comunicações.");
      return;
    }
    toast.success("Inscrição confirmada! Você acompanhará nossa onda mensalmente.");
    setData({ name: "", email: "", consent: true });
  };
  return (
    <form onSubmit={submit} className={`space-y-3 ${compact ? "" : "max-w-xl"}`}>
      <div className="grid sm:grid-cols-2 gap-3">
        <Input
          placeholder="Seu nome"
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          className="h-11 bg-white"
        />
        <Input
          type="email"
          placeholder="voce@email.com"
          value={data.email}
          onChange={(e) => setData({ ...data, email: e.target.value })}
          className="h-11 bg-white"
        />
      </div>
      <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
        <Checkbox
          checked={data.consent}
          onCheckedChange={(v) => setData({ ...data, consent: Boolean(v) })}
          className="mt-0.5"
        />
        <span>
          Quero receber a newsletter mensal. Sem spam — posso cancelar quando quiser.
        </span>
      </label>
      <Button type="submit" className="h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
        <Send className="h-4 w-4" /> Quero acompanhar a onda
      </Button>
    </form>
  );
}

/* ===================================================================== */

export default function Home() {
  const [customAmount, setCustomAmount] = useState("");
  const [selected, setSelected] = useState<number | "custom">(100);
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", consent: true, newsletter: true });
  const [openImpact, setOpenImpact] = useState<Impact | null>(null);
  const [isDonating, setIsDonating] = useState(false);

  const activeAmount = getDonationAmount(selected, customAmount);

  const handleDonate = async () => {
    if (!form.name || !form.email) {
      toast.error("Preencha nome e e-mail para continuar.");
      return;
    }
    if (!form.consent) {
      toast.error("Confirme o consentimento para receber comunicações.");
      return;
    }
    if (activeAmount <= 0) {
      toast.error("Escolha um valor válido para doar.");
      return;
    }

    setIsDonating(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: activeAmount,
          name: form.name,
          email: form.email,
        }),
      });

      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Erro ao iniciar pagamento");
      }

      window.location.href = data.url;
    } catch {
      toast.error("Não foi possível abrir o checkout. Tente novamente.");
      setIsDonating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-center" richColors />

      {/* NAV */}
      <header className="absolute top-0 inset-x-0 z-30">
        <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2 text-primary-foreground">
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur">
              <Droplets className="h-5 w-5" />
              <span className="absolute inset-0 rounded-full border border-white/30 animate-ripple" />
            </span>
            <span className="font-display text-xl">Água Pura</span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm text-primary-foreground/90">
            <a href="#movimento" className="hover:text-primary-foreground transition">O movimento</a>
            <a href="#impacto" className="hover:text-primary-foreground transition">Impacto</a>
            <a href="#prova" className="hover:text-primary-foreground transition">Histórias</a>
            <a href="#doar" className="hover:text-primary-foreground transition">Doar</a>
          </nav>
          <a
            href="#doar"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/95 text-primary-deep px-5 py-2.5 text-sm font-semibold shadow-soft hover:bg-white transition"
          >
            <Heart className="h-4 w-4 fill-current" /> Doar agora
          </a>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative isolate min-h-[100vh] flex items-center overflow-hidden">
        <HeroAnimatedBg />

        <div className="mx-auto max-w-7xl px-6 pt-32 pb-20 grid md:grid-cols-12 gap-10 items-end w-full">
          <div className="md:col-span-8 text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/90 border border-white/20">
              <Waves className="h-3.5 w-3.5" /> Movimento Pure Water Wave
            </span>
            <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.02] text-balance">
              Uma onda de jovens<br />
              transformando o mundo<br />
              <span className="italic font-normal text-white/85">com pureza e propósito.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg sm:text-xl text-white/85 text-balance">
              Sua doação ajuda jovens a viverem com propósito, pureza e responsabilidade social —
              em comunidades de 6 países.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#doar"
                className="group inline-flex items-center gap-2 rounded-full bg-coral text-coral-foreground px-7 py-4 text-base font-semibold shadow-glow hover:scale-[1.02] transition"
              >
                <QrCode className="h-5 w-5" />
                Doar com Pix
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
              </a>
              <a
                href="#doar"
                className="inline-flex items-center gap-2 rounded-full bg-white/95 text-primary-deep px-7 py-4 text-base font-semibold shadow-soft hover:bg-white transition"
              >
                <CreditCard className="h-5 w-5" />
                Doar com Cartão
              </a>
            </div>

            <p className="mt-6 text-sm text-white/75 max-w-xl">
              Sua doação ajuda jovens a viverem com propósito, pureza e responsabilidade social.
            </p>
          </div>

          <div className="md:col-span-4 hidden md:block">
            <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 text-primary-foreground shadow-glow">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-coral/90 flex items-center justify-center">
                  <Heart className="h-5 w-5 fill-current text-coral-foreground" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/70">Doação sugerida</p>
                  <p className="text-2xl font-display">R$ 100</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-white/85">
                Fortalece um workshop completo de liderança para jovens da comunidade.
              </p>
              <a
                href="#doar"
                className="mt-5 inline-flex w-full justify-center items-center gap-2 rounded-full bg-white text-primary-deep px-4 py-3 text-sm font-semibold hover:bg-white/90 transition"
              >
                Quero contribuir <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* wave divider */}
        <svg className="absolute bottom-[-1px] left-0 right-0 w-full h-16 text-background z-[1]" viewBox="0 0 1440 80" fill="currentColor" preserveAspectRatio="none">
          <path d="M0,40 C240,90 480,0 720,30 C960,60 1200,80 1440,30 L1440,80 L0,80 Z" />
        </svg>
      </section>

      {/* IMPACT PROMISE */}
      <section id="impacto" className="py-24 sm:py-32 bg-background">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Promessa de impacto</span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl text-balance">
              O que sua doação torna possível.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              Cada real apoia jovens em formação, ações reais e encontros que mudam a forma como
              olhamos para nós mesmos e para o mundo.{" "}
              <span className="text-foreground/80">Clique em cada pilar para ver imagens e a história por trás.</span>
            </p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {IMPACTS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setOpenImpact(item)}
                  className="group text-left relative rounded-3xl bg-card border border-border p-7 shadow-card hover:shadow-glow hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-cta text-primary-foreground shadow-soft">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-display text-2xl">{item.title}</h3>
                  <p className="mt-2 text-muted-foreground">{item.desc}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                    Ver mais <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <ImpactDialog
        impact={openImpact}
        open={!!openImpact}
        onOpenChange={(v) => !v && setOpenImpact(null)}
      />

      {/* STORY — PURE WATER WAVE */}
      <section id="movimento" className="relative py-24 sm:py-32 bg-gradient-wave overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-mint/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Nossa história</span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl text-balance">
              Não somos um projeto.<br />
              <span className="italic">Somos uma onda.</span>
            </h2>
            <p className="mt-6 text-lg text-foreground/80">
              Água Pura nasce do movimento <strong>Pure Water Wave</strong> — uma geração de jovens
              que escolheu viver de outra forma.
            </p>

            <ul className="mt-8 space-y-5">
              <li className="flex gap-4">
                <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-display">P</span>
                <div>
                  <p className="font-semibold text-foreground">Pure — pureza</p>
                  <p className="text-muted-foreground">Pureza do corpo, do espírito e do coração.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-display">W</span>
                <div>
                  <p className="font-semibold text-foreground">Water — água</p>
                  <p className="text-muted-foreground">Movimento, vida e direção para um propósito maior.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral text-coral-foreground font-display">W</span>
                <div>
                  <p className="font-semibold text-foreground">Wave — onda</p>
                  <p className="text-muted-foreground">
                    Uma onda de jovens que abraça pessoas, transcende culturas e cuida da sociedade
                    e do meio ambiente.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="grid grid-cols-2 gap-4">
              <img src={g1} alt="Jovens em workshop" width={800} height={800} loading="lazy" className="rounded-3xl aspect-square object-cover shadow-card" />
              <img src={g2} alt="Intercâmbio cultural entre jovens" width={800} height={800} loading="lazy" className="rounded-3xl aspect-square object-cover shadow-card mt-10 animate-float" />
              <img src={g3} alt="Ação social ambiental" width={800} height={800} loading="lazy" className="rounded-3xl aspect-square object-cover shadow-card -mt-6" />
              <img src={g4} alt="Jovem palestrando em encontro" width={800} height={800} loading="lazy" className="rounded-3xl aspect-square object-cover shadow-card" />
            </div>
          </div>
        </div>
      </section>

      {/* VISUAL PROOF / GALLERY */}
      <section id="prova" className="py-24 sm:py-32 bg-background">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Prova visual</span>
              <h2 className="mt-3 font-display text-4xl sm:text-5xl text-balance">
                Pessoas reais. Impacto real.
              </h2>
            </div>
            <p className="max-w-md text-muted-foreground">
              Cada imagem é um momento real do movimento: jovens em formação, intercâmbios,
              workshops e ações comunitárias.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <img src={g1} alt="Workshop de jovens" width={800} height={800} loading="lazy" className="rounded-2xl aspect-[4/5] object-cover shadow-card hover:scale-[1.02] transition" />
            <img src={g4} alt="Encontro de liderança" width={800} height={800} loading="lazy" className="rounded-2xl aspect-[4/5] object-cover shadow-card md:mt-10 hover:scale-[1.02] transition" />
            <img src={g2} alt="Intercâmbio cultural" width={800} height={800} loading="lazy" className="rounded-2xl aspect-[4/5] object-cover shadow-card hover:scale-[1.02] transition" />
            <img src={g3} alt="Ação ambiental" width={800} height={800} loading="lazy" className="rounded-2xl aspect-[4/5] object-cover shadow-card md:mt-10 hover:scale-[1.02] transition" />
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-24 sm:py-32 bg-gradient-wave overflow-hidden">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Prova social</span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl text-balance">
              Uma onda que já atravessa fronteiras.
            </h2>
          </div>

          <div className="mt-14 grid sm:grid-cols-3 gap-6">
            <div className="rounded-3xl bg-card border border-border p-8 text-center shadow-card">
              <p className="font-display text-5xl text-primary">+1.200</p>
              <p className="mt-2 text-sm uppercase tracking-wider text-muted-foreground">Jovens impactados</p>
            </div>
            <div className="rounded-3xl bg-card border border-border p-8 text-center shadow-card">
              <p className="font-display text-5xl text-primary">+300</p>
              <p className="mt-2 text-sm uppercase tracking-wider text-muted-foreground">Voluntários ativos</p>
            </div>
            <div className="rounded-3xl bg-card border border-border p-8 text-center shadow-card">
              <p className="font-display text-5xl text-primary">+150</p>
              <p className="mt-2 text-sm uppercase tracking-wider text-muted-foreground">Ações realizadas</p>
            </div>
          </div>

          {/* International presence with flags */}
          <div className="mt-10 rounded-3xl bg-card border border-border p-8 shadow-card">
            <div className="flex items-center gap-3 text-primary">
              <Globe2 className="h-5 w-5" />
              <p className="text-sm uppercase tracking-wider font-semibold">Presença internacional</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {COUNTRIES.map((c) => (
                <span
                  key={c.name}
                  className="inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-4 py-2 text-sm font-medium border border-border"
                >
                  <span aria-hidden className="text-xl leading-none">{c.flag}</span>
                  {c.name}
                </span>
              ))}
            </div>
          </div>

          {/* Testimonials carousel — auto-scrolling marquee */}
          <div className="mt-14">
            <div className="flex items-end justify-between gap-6 mb-8">
              <h3 className="font-display text-3xl sm:text-4xl text-balance">
                Histórias que movem a onda.
              </h3>
              <p className="hidden sm:block text-sm text-muted-foreground max-w-sm">
                Vozes de jovens, voluntários e líderes que constroem o Água Pura todos os dias.
              </p>
            </div>

            <div
              className="group relative overflow-hidden"
              style={{
                maskImage:
                  "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
              }}
            >
              <div className="flex gap-6 w-max animate-marquee group-hover:[animation-play-state:paused]">
                {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                  <figure
                    key={i}
                    className="w-[320px] sm:w-[360px] shrink-0 rounded-3xl bg-card border border-border p-6 shadow-card flex flex-col"
                  >
                    <Quote className="h-6 w-6 text-primary/50" />
                    <blockquote className="mt-3 text-foreground/90 leading-relaxed text-[15px]">
                      "{t.quote}"
                    </blockquote>
                    <figcaption className="mt-5 flex items-center gap-3">
                      <img
                        src={t.photo}
                        alt={t.name}
                        width={56}
                        height={56}
                        loading="lazy"
                        className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/20"
                      />
                      <div>
                        <p className="font-semibold leading-tight">{t.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
                      </div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DONATION SECTION */}
      <section id="doar" className="py-24 sm:py-32 bg-background scroll-mt-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Sua doação</span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl text-balance">
              Escolha o tamanho da sua onda.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Toda contribuição vira formação, encontro e impacto.{" "}
              <span className="text-foreground/80">
                Você pode acompanhar nossas atividades pela nossa newsletter mensal.
              </span>
            </p>
          </div>

          <div className="mt-14 grid lg:grid-cols-5 gap-8">
            {/* Amounts */}
            <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4">
              {DONATIONS.map((d) => {
                const active = selected === d.amount;
                return (
                  <button
                    key={d.amount}
                    type="button"
                    onClick={() => {
                      setSelected(d.amount);
                      setCustomAmount("");
                    }}
                    className={`relative text-left rounded-3xl border p-6 transition-all ${
                      active
                        ? "border-primary bg-primary/5 shadow-glow -translate-y-1"
                        : "border-border bg-card hover:border-primary/40 shadow-card"
                    }`}
                  >
                    {d.popular && (
                      <span className="absolute -top-3 left-6 rounded-full bg-coral text-coral-foreground px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                        Mais escolhido
                      </span>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-4xl">R$ {d.amount}</span>
                      {active && <Check className="h-5 w-5 text-primary" />}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{d.label}</p>
                  </button>
                );
              })}

              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelected("custom")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected("custom");
                  }
                }}
                className={`sm:col-span-2 rounded-3xl border p-6 transition-all cursor-text ${
                  selected === "custom" ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-card shadow-card"
                }`}
              >
                <Label htmlFor="custom" className="text-sm font-semibold">Outro valor</Label>
                <div className="mt-2 flex items-center gap-3">
                  <span className="font-display text-2xl text-muted-foreground">R$</span>
                  <Input
                    id="custom"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={customAmount}
                    onFocus={() => setSelected("custom")}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelected("custom");
                    }}
                    className="text-xl h-12"
                  />
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2 rounded-3xl bg-gradient-cta text-primary-foreground p-8 shadow-glow">
              <h3 className="font-display text-2xl">Seus dados</h3>
              <p className="mt-1 text-sm text-white/80">Rápido, seguro e transparente.</p>

              <div className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="name" className="text-white/90">Nome completo</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Seu nome" className="mt-1 bg-white/95 text-foreground border-0" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-white/90">E-mail</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="voce@email.com" className="mt-1 bg-white/95 text-foreground border-0" />
                </div>
                <div>
                  <Label htmlFor="whats" className="text-white/90">WhatsApp <span className="text-white/60">(opcional)</span></Label>
                  <Input id="whats" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="(00) 00000-0000" className="mt-1 bg-white/95 text-foreground border-0" />
                </div>

                <label className="flex items-start gap-3 text-sm text-white/90 cursor-pointer">
                  <Checkbox checked={form.newsletter} onCheckedChange={(v) => setForm({ ...form, newsletter: Boolean(v) })} className="mt-0.5 border-white/60 data-[state=checked]:bg-white data-[state=checked]:text-primary" />
                  <span>Quero receber a newsletter mensal do Água Pura.</span>
                </label>
                <label className="flex items-start gap-3 text-sm text-white/90 cursor-pointer">
                  <Checkbox checked={form.consent} onCheckedChange={(v) => setForm({ ...form, consent: Boolean(v) })} className="mt-0.5 border-white/60 data-[state=checked]:bg-white data-[state=checked]:text-primary" />
                  <span>Concordo em receber comunicações. Sem spam, com possibilidade de cancelar a qualquer momento.</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={handleDonate}
                    disabled={isDonating}
                    className="h-12 rounded-full bg-coral text-coral-foreground hover:bg-coral/90 text-base font-semibold"
                  >
                    <QrCode className="h-5 w-5" /> {isDonating ? "Abrindo..." : "Doar Pix"}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleDonate}
                    disabled={isDonating}
                    className="h-12 rounded-full bg-white text-primary-deep hover:bg-white/90 text-base font-semibold"
                  >
                    <CreditCard className="h-5 w-5" /> {isDonating ? "Abrindo..." : "Cartão"}
                  </Button>
                </div>

                <p className="text-center text-xs text-white/70 pt-1">
                  Doando{" "}
                  <strong className="text-white">
                    R$ {activeAmount > 0 ? formatDonationAmount(activeAmount) : "0,00"}
                  </strong>{" "}
                  agora
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRANSPARENCY + NEWSLETTER */}
      <section className="py-24 sm:py-32 bg-gradient-wave">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Transparência</span>
              <h2 className="mt-3 font-display text-4xl sm:text-5xl text-balance">
                Você sabe exatamente onde sua doação chega.
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Todas as doações são utilizadas para apoiar atividades de formação, projetos sociais,
                encontros de jovens, materiais educativos e ações de impacto.
              </p>
              <a
                href="mailto:contato@aguapura.org"
                className="mt-6 inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
              >
                <Mail className="h-4 w-4" /> Fale com a gente
              </a>

              {/* Newsletter signup */}
              <div className="mt-8 rounded-3xl bg-card border border-border p-6 shadow-card">
                <div className="flex items-center gap-2 text-primary">
                  <Send className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.2em] font-semibold">Newsletter</p>
                </div>
                <h3 className="mt-2 font-display text-2xl">
                  Faça parte da newsletter e se inspire.
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Histórias, bastidores e o impacto mês a mês — direto no seu e-mail.
                </p>
                <div className="mt-4">
                  <NewsletterForm />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              {[
                { icon: FileText, title: "Prestação de contas", desc: "Relatórios financeiros públicos." },
                { icon: ShieldCheck, title: "Uso responsável", desc: "Recursos aplicados 100% no propósito." },
                { icon: Waves, title: "Acompanhe o impacto", desc: "Atualizações reais sobre os projetos." },
                { icon: Mail, title: "Canal aberto", desc: "Dúvidas respondidas com transparência." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-3xl bg-card border border-border p-6 shadow-card">
                  <Icon className="h-7 w-7 text-primary" />
                  <h3 className="mt-3 font-display text-xl">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-28 sm:py-36 overflow-hidden bg-primary-deep text-primary-foreground">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <Droplets className="mx-auto h-12 w-12 text-white/80" />
          <h2 className="mt-6 font-display text-5xl sm:text-6xl leading-tight text-balance">
            Faça parte dessa onda<br />de transformação.
          </h2>
          <p className="mt-6 text-lg sm:text-xl text-white/85 max-w-2xl mx-auto">
            Doe hoje e ajude jovens a viverem com propósito, pureza e amor pela sociedade.
            Acompanhe mensalmente o impacto que você ajudou a construir.
          </p>

          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <a
              href="#doar"
              className="inline-flex items-center gap-2 rounded-full bg-coral text-coral-foreground px-8 py-4 text-base font-semibold shadow-glow hover:scale-[1.02] transition"
            >
              <QrCode className="h-5 w-5" /> Doar com Pix
            </a>
            <a
              href="#doar"
              className="inline-flex items-center gap-2 rounded-full bg-white text-primary-deep px-8 py-4 text-base font-semibold hover:bg-white/90 transition"
            >
              <CreditCard className="h-5 w-5" /> Doar com Cartão
            </a>
          </div>

          <p className="mt-8 text-sm text-white/70">
            Pure. Water. Wave. — uma onda de jovens transformando o mundo.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-background border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Droplets className="h-5 w-5" />
            </span>
            <span className="font-display text-lg">Água Pura</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} Água Pura — Movimento Pure Water Wave. Feito com propósito.
          </p>
          <a href="mailto:contato@aguapura.org" className="text-sm text-primary hover:underline">
            contato@aguapura.org
          </a>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <FloatingWhatsApp />
    </div>
  );
}

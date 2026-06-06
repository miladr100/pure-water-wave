import type { Metadata } from "next";

import Home from "@/components/home";

const pageTitle = "Água Pura — Doe e transforme vidas de jovens";
const pageDescription =
  "Faça parte da onda. Sua doação forma jovens com propósito, pureza e impacto social em 6 países.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  openGraph: {
    title: pageTitle,
    description: pageDescription,
  },
};

export default Home;

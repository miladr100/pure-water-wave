import { MercadoPagoConfig } from "mercadopago";

export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
});

export function getAppBaseUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function isMercadoPagoTestMode() {
  return process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith("TEST-") ?? false;
}

/** MP só aceita auto_return com back_urls em HTTPS (não funciona em localhost). */
export function canUseAutoReturn(baseUrl: string) {
  return baseUrl.startsWith("https://");
}

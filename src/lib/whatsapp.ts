// WhatsApp Cloud API, the thin part: one template message to one number.
//
// Needs a production phone number on the Meta business (FFPUM Marketing
// has the app "FFPUM Academia" and only a test number today), a System
// User token, and templates approved in the "utility" category. Until
// those exist the sender reports itself unconfigured and the panel falls
// back to e-mail and the in-app bell. Business-initiated messages are
// billed per message (Brazil utility ≈ US$ 0.007 as of 2026).
//
//   WHATSAPP_TOKEN              permanent System User token
//   WHATSAPP_PHONE_NUMBER_ID    the sending number's id
//   WHATSAPP_TEMPLATE_<NAME>    approved template names (pt_BR)
//   WHATSAPP_API_VERSION        optional, default v21.0

export const whatsappConfigured = () => Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

export function whatsappTemplate(name: string) {
  return process.env[`WHATSAPP_TEMPLATE_${name.toUpperCase()}`] ?? "";
}

// E.164 without the plus: Brazilian numbers typed without the country
// code get 55 in front.
export function whatsappNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) {
    return null;
  }
  return digits.length <= 11 ? `55${digits}` : digits;
}

export async function sendWhatsappTemplate({ to, template, params }: { to: string; template: string; params: string[] }) {
  if (!whatsappConfigured()) {
    return { ok: false as const, detalhe: "WhatsApp não configurado" };
  }
  if (!template) {
    return { ok: false as const, detalhe: "Modelo de mensagem não configurado" };
  }
  const number = whatsappNumber(to);
  if (!number) {
    return { ok: false as const, detalhe: "Telefone inválido" };
  }
  const version = process.env.WHATSAPP_API_VERSION ?? "v21.0";
  const response = await fetch(`https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: number,
      type: "template",
      template: {
        name: template,
        language: { code: "pt_BR" },
        components: params.length > 0 ? [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }] : [],
      },
    }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return { ok: false as const, detalhe: `${response.status} ${text.slice(0, 200)}` };
  }
  return { ok: true as const, detalhe: "" };
}

// The manual way, free: a prefilled chat with the person on the phone.
export function whatsappLink(phone: string, text: string) {
  const number = whatsappNumber(phone);
  return number ? `https://api.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(text)}` : null;
}

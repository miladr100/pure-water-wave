import { Payment, Preference } from "mercadopago";

import { mercadoPagoClient } from "@/lib/mercadopago";

export type MercadoPagoRedirectParams = {
  collection_id?: string | null;
  collection_status?: string | null;
  payment_id?: string | null;
  status?: string | null;
  external_reference?: string | null;
  payment_type?: string | null;
  merchant_order_id?: string | null;
  preference_id?: string | null;
  site_id?: string | null;
  processing_mode?: string | null;
  merchant_account_id?: string | null;
};

export function mapMercadoPagoRedirectParams(
  params: MercadoPagoRedirectParams
) {
  return {
    collectionId: params.collection_id ?? undefined,
    collectionStatus: params.collection_status ?? undefined,
    paymentId: params.payment_id ?? undefined,
    status: params.status ?? undefined,
    externalReference: params.external_reference ?? undefined,
    paymentType: params.payment_type ?? undefined,
    merchantOrderId: params.merchant_order_id ?? undefined,
    preferenceId: params.preference_id ?? undefined,
    siteId: params.site_id ?? undefined,
    processingMode: params.processing_mode ?? undefined,
    merchantAccountId:
      params.merchant_account_id && params.merchant_account_id !== "null"
        ? params.merchant_account_id
        : undefined,
  };
}

export function parseUserIdFromExternalReference(
  externalReference: string
): string | undefined {
  const match = externalReference.match(/^doacao-([a-f0-9]{24})-\d+$/i);
  return match?.[1];
}

export async function getMercadoPagoDonationAmount(
  preferenceId?: string | null,
  paymentId?: string | null,
) {
  if (preferenceId) {
    const preference = new Preference(mercadoPagoClient);
    const prefData = await preference.get({ preferenceId });
    const amount = prefData.items?.[0]?.unit_price;
    if (amount && amount > 0) return amount;
  }

  if (paymentId) {
    const payment = new Payment(mercadoPagoClient);
    const paymentData = await payment.get({ id: paymentId });
    const amount = paymentData.transaction_amount;
    if (amount && amount > 0) return amount;
  }

  return null;
}

export function mapMercadoPagoPaymentData(payment: {
  id?: number | string;
  status?: string;
  external_reference?: string;
  payment_type_id?: string;
  order?: { id?: string | number };
  collector_id?: number;
}) {
  const paymentId = payment.id != null ? String(payment.id) : undefined;

  return {
    collectionId: paymentId,
    collectionStatus: payment.status,
    paymentId,
    status: payment.status,
    externalReference: payment.external_reference,
    paymentType: payment.payment_type_id,
    merchantOrderId:
      payment.order?.id != null ? String(payment.order.id) : undefined,
    merchantAccountId:
      payment.collector_id != null ? String(payment.collector_id) : undefined,
  };
}

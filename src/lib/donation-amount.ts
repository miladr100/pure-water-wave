export function parseDonationAmount(value: string): number {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.round(parsed * 100) / 100;
}

export function getDonationAmount(
  selected: number | "custom",
  customAmount: string
): number {
  if (selected === "custom") {
    return parseDonationAmount(customAmount);
  }

  return selected;
}

export function formatDonationAmount(amount: number): string {
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

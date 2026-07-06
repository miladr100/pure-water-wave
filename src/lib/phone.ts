export function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidPhoneWithDdd(phone: string) {
  const digits = normalizePhone(phone);
  return digits.length >= 10 && digits.length <= 13;
}

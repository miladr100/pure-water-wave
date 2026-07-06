const REGISTER_SECRET = "verdadeirospais";

export function isValidRegisterSecret(secret: string) {
  return secret.trim().toLowerCase() === REGISTER_SECRET;
}

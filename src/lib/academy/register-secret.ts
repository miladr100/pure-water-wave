// Students register freely. A tutor account needs the shared secret, the same
// way the library gates its pastor sign-up — set TUTOR_REGISTER_SECRET on
// the server; without it no tutor can self-register and the only way in is
// "Convert to tutor" in the panel (or the seed script).
export function isValidTutorSecret(secret: string) {
  const expected = process.env.TUTOR_REGISTER_SECRET?.trim().toLowerCase();
  if (!expected) {
    return false;
  }

  return secret.trim().toLowerCase() === expected;
}

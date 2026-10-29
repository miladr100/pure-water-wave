// Pins the environment every test relies on. Routes refuse to run without
// AUTH_SECRET and MONGODB_URI; the API helper sets MONGODB_URI once the
// in-memory server is up, so here it only gets a placeholder that fails
// loudly if a test forgets `startDb()`.
process.env.AUTH_SECRET ??= "test-secret-do-not-use";
// A non-empty placeholder: src/lib/mongodb.ts reads the variable at import
// time and refuses an empty one; the real connection comes from startDb().
process.env.MONGODB_URI ??= "mongodb://placeholder.invalid:27017/unused";
// Never let a real key reach the suite: the register route mails tutors
// when RESEND_API_KEY is set.
process.env.RESEND_API_KEY = "";
delete process.env.BUNNY_STREAM_CDN_HOST;
delete process.env.BUNNY_STREAM_TOKEN_KEY;
delete process.env.BUNNY_STREAM_LIBRARY_ID;
delete process.env.BUNNY_STREAM_API_KEY;

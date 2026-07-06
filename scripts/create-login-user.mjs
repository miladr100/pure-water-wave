/**
 * Cria um usuário com login e senha para acesso ao painel.
 *
 * Uso:
 *   node scripts/create-login-user.mjs <login> <senha> "<nome completo>" <email> <telefone> [papel]
 *
 * Exemplo:
 *   node scripts/create-login-user.mjs admin minhaSenha123 "Admin PWW" admin@purewaterwave.org 11999999999 pastor
 */

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const USER_ROLES = ["pastor", "doador"];

const [, , login, password, fullName, email, phone, roleArg] = process.argv;

if (!login || !password || !fullName || !email || !phone) {
  console.error(
    "Uso: node scripts/create-login-user.mjs <login> <senha> \"<nome completo>\" <email> <telefone> [papel]",
  );
  process.exit(1);
}

const role = (roleArg?.trim().toLowerCase() ?? "pastor");
if (!USER_ROLES.includes(role)) {
  console.error(`Papel inválido. Use: ${USER_ROLES.join(" ou ")}`);
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Defina MONGODB_URI no ambiente antes de executar o script.");
  process.exit(1);
}

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    login: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    password: { type: String, select: false },
    role: { type: String, enum: USER_ROLES, default: "pastor", required: true },
    remarketingEmailSentAt: { type: Date },
  },
  { timestamps: true },
);

const User = mongoose.models.User ?? mongoose.model("User", userSchema);

await mongoose.connect(MONGODB_URI);

const hashedPassword = await bcrypt.hash(password, 12);
const normalizedLogin = login.trim().toLowerCase();
const normalizedPhone = phone.trim();

const user = await User.findOneAndUpdate(
  { login: normalizedLogin },
  {
    fullName: fullName.trim(),
    phone: normalizedPhone,
    email: email.trim().toLowerCase(),
    login: normalizedLogin,
    password: hashedPassword,
    role,
  },
  { upsert: true, new: true, setDefaultsOnInsert: true },
);

console.log(`Usuário pronto: ${user.login} (${user._id})`);

await mongoose.disconnect();

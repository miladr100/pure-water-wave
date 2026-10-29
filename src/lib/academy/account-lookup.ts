import type { Model } from "mongoose";

import { AcademyPasswordReset } from "@/models/academy-password-reset";
import { AcademyUser } from "@/models/academy-user";
import { PasswordReset } from "@/models/password-reset";
import { SystemUser } from "@/models/system-user";

// The site has one Login and one "esqueci minha senha" for two kinds of
// account: the library's (pastors, legacy HJ Team) and the academy's
// (students, educators). The password-reset routes look the person up here
// and get back the collection-specific pieces they need.

// Both reset collections share this shape; typing them through one model
// interface lets a route treat either the same way.
export type ResetDoc = {
  email: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  verifiedAt?: Date | null;
  createdAt: Date;
};

export type ResetModel = Model<ResetDoc>;

export type Account = {
  kind: "library" | "academy";
  id: string;
  email: string;
  fullName: string;
  // The reset codes live next to their accounts.
  resets: ResetModel;
  setPassword: (hash: string) => Promise<void>;
};

export async function findAccountByLogin(login: string): Promise<Account | null> {
  const normalized = login.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const library = await SystemUser.findOne({ $or: [{ email: normalized }, { login: normalized }] });
  if (library) {
    return {
      kind: "library",
      id: library._id.toString(),
      email: library.email,
      fullName: library.fullName,
      resets: PasswordReset as unknown as ResetModel,
      setPassword: async (hash) => {
        await SystemUser.updateOne({ _id: library._id }, { password: hash });
      },
    };
  }

  const academy = await AcademyUser.findOne({ $or: [{ email: normalized }, { login: normalized }] });
  if (academy) {
    return {
      kind: "academy",
      id: academy._id.toString(),
      email: academy.email,
      fullName: academy.fullName,
      resets: AcademyPasswordReset as unknown as ResetModel,
      setPassword: async (hash) => {
        await AcademyUser.updateOne({ _id: academy._id }, { password: hash });
      },
    };
  }

  return null;
}

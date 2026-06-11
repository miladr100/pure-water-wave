import { Schema, model, models, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true },
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const User = models.User ?? model("User", userSchema);

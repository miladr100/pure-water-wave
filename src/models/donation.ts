import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Types,
} from "mongoose";

const donationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    collectionId: { type: String },
    collectionStatus: { type: String },
    paymentId: { type: String },
    status: { type: String },
    externalReference: { type: String, required: true, unique: true },
    paymentType: { type: String },
    merchantOrderId: { type: String },
    preferenceId: { type: String },
    siteId: { type: String },
    processingMode: { type: String },
    merchantAccountId: { type: String },
    sameDayDonation: { type: String },
  },
  { timestamps: true }
);

export type DonationDocument = InferSchemaType<typeof donationSchema> & {
  user: Types.ObjectId;
};

if (models.Donation) {
  delete models.Donation;
}

export const Donation = model("Donation", donationSchema);

import { AcademyUser } from "@/models/academy-user";

// The profile photo: a browser-cropped 512×512 image stored in the user's
// own document (see `academy-user.ts`), so there is nothing to resize here —
// only to check, store, remove and serve.

export const PHOTO_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type PhotoContentType = (typeof PHOTO_CONTENT_TYPES)[number];

// 4 MB leaves room for a careless PNG; a 512 px JPEG is a few dozen KB.
export const PHOTO_MAX_BYTES = 4 * 1024 * 1024;

export function isPhotoContentType(value: unknown): value is PhotoContentType {
  return (
    typeof value === "string" &&
    (PHOTO_CONTENT_TYPES as readonly string[]).includes(value.split(";")[0].trim().toLowerCase())
  );
}

export function normalizePhotoContentType(value: string): PhotoContentType {
  return value.split(";")[0].trim().toLowerCase() as PhotoContentType;
}

export type StoredPhoto = { data: Uint8Array; contentType: PhotoContentType; updatedAt: Date };

type PhotoRow = {
  photo?: { data?: unknown; contentType?: string } | null;
  photoUpdatedAt?: Date | null;
};

// A lean read hands the bytes back as a Node Buffer (the driver promotes
// BinData 0), but a raw `Binary` is handled too so a changed driver option
// does not turn every photo into a 404.
function toBytes(data: unknown): Uint8Array | null {
  if (data instanceof Uint8Array) {
    return data;
  }

  if (data && typeof data === "object" && "buffer" in data) {
    const inner = (data as { buffer: unknown }).buffer;
    if (inner instanceof Uint8Array) {
      return inner;
    }
    if (inner instanceof ArrayBuffer) {
      return new Uint8Array(inner);
    }
  }

  return null;
}

export async function storePhoto(userId: string, bytes: ArrayBuffer, contentType: PhotoContentType) {
  const photoUpdatedAt = new Date();
  await AcademyUser.updateOne(
    { _id: userId },
    { $set: { photo: { data: Buffer.from(bytes), contentType }, photoUpdatedAt } },
  );

  return photoUpdatedAt;
}

export async function removePhoto(userId: string) {
  await AcademyUser.updateOne({ _id: userId }, { $unset: { photo: 1 }, $set: { photoUpdatedAt: null } });
}

export async function loadPhoto(userId: string): Promise<StoredPhoto | null> {
  // `photo` is `select: false` on the schema; `+photo` adds it back.
  const row = (await AcademyUser.findById(userId)
    .select("+photo photoUpdatedAt")
    .lean()) as PhotoRow | null;

  const data = toBytes(row?.photo?.data);
  const contentType = row?.photo?.contentType;
  if (!row?.photoUpdatedAt || !data || data.byteLength === 0 || !isPhotoContentType(contentType)) {
    return null;
  }

  return { data, contentType: normalizePhotoContentType(contentType), updatedAt: row.photoUpdatedAt };
}

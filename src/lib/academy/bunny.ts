import crypto from "crypto";

// Bunny Stream, exactly as the FFPUM academy uses it. Nothing here is
// required to run the academy: with YouTube lessons and no BUNNY_* variables
// every function below reports "not configured" and the panel hides the
// upload button.
//
//   BUNNY_STREAM_LIBRARY_ID   the Stream library
//   BUNNY_STREAM_API_KEY      the library's API key (server only; TUS uploads
//                             are authorised per video and never expose it)
//   BUNNY_STREAM_CDN_HOST     e.g. vz-xxxxx.b-cdn.net (the library's pull zone)
//   BUNNY_STREAM_TOKEN_KEY    the pull zone's token-authentication key
//   BUNNY_URL_TTL_SECONDS     optional, default 4 h

const API = "https://video.bunnycdn.com";
export const TUS_ENDPOINT = "https://video.bunnycdn.com/tusupload";
const DEFAULT_TTL = 4 * 60 * 60;

export const bunnyUploadConfigured = () =>
  Boolean(process.env.BUNNY_STREAM_LIBRARY_ID && process.env.BUNNY_STREAM_API_KEY);

export const bunnyPlaybackConfigured = () =>
  Boolean(process.env.BUNNY_STREAM_CDN_HOST && process.env.BUNNY_STREAM_TOKEN_KEY);

const libraryId = () => process.env.BUNNY_STREAM_LIBRARY_ID!;
const apiKey = () => process.env.BUNNY_STREAM_API_KEY!;

// Bunny URL-token v2 scoped to the video's directory, so one token covers the
// playlist, every segment and the generated thumbnail under /{guid}/.
function directoryToken(videoId: string, expires: number) {
  const key = process.env.BUNNY_STREAM_TOKEN_KEY!;
  const tokenPath = `/${videoId}/`;
  const token = crypto
    .createHash("sha256")
    .update(`${key}${tokenPath}${expires}token_path=${tokenPath}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `token=${token}&expires=${expires}&token_path=${encodeURIComponent(tokenPath)}`;
}

export function signVideoUrl(videoId: string) {
  const ttl = Number(process.env.BUNNY_URL_TTL_SECONDS) || DEFAULT_TTL;
  const expiresAt = Math.floor(Date.now() / 1000) + ttl;

  if (!bunnyPlaybackConfigured()) {
    return null;
  }

  const authQuery = directoryToken(videoId, expiresAt);
  const host = process.env.BUNNY_STREAM_CDN_HOST!;

  return {
    url: `https://${host}/${videoId}/playlist.m3u8?${authQuery}`,
    thumbnailUrl: `https://${host}/${videoId}/thumbnail.jpg?${authQuery}`,
    authQuery,
    expiresAt,
  };
}

export async function createVideo(title: string): Promise<{ guid: string }> {
  const res = await fetch(`${API}/library/${libraryId()}/videos`, {
    method: "POST",
    headers: { AccessKey: apiKey(), "content-type": "application/json" },
    body: JSON.stringify({ title: title.slice(0, 250) }),
  });

  if (!res.ok) {
    throw new Error(`bunny_create_failed_${res.status}`);
  }

  const json = (await res.json()) as { guid: string };
  return { guid: json.guid };
}

// Presigned TUS authorisation: sha256_hex(libraryId + apiKey + expires + videoId).
export function tusAuth(videoId: string, ttlSeconds = 6 * 60 * 60) {
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const signature = crypto
    .createHash("sha256")
    .update(`${libraryId()}${apiKey()}${expires}${videoId}`)
    .digest("hex");

  return { endpoint: TUS_ENDPOINT, signature, expires, videoId, libraryId: libraryId() };
}

export async function getVideo(guid: string) {
  const res = await fetch(`${API}/library/${libraryId()}/videos/${guid}`, {
    headers: { AccessKey: apiKey() },
  });

  if (!res.ok) {
    throw new Error(`bunny_get_failed_${res.status}`);
  }

  const video = (await res.json()) as {
    status: number;
    encodeProgress?: number;
    length?: number;
    availableResolutions?: string | null;
  };

  // Bunny status: 0 queued, 1 processing, 2 encoding, 3 finished, 4 resolution
  // finished, 5 failed, 6 presigned upload started.
  const state = video.status === 5 ? "error" : video.status >= 3 ? "ready" : "processing";

  return {
    state,
    status: video.status,
    encodeProgress: video.encodeProgress ?? 0,
    lengthSeconds: video.length ?? 0,
    durationMinutes: Math.max(1, Math.round((video.length ?? 0) / 60)),
    resolutions: video.availableResolutions ?? null,
  };
}

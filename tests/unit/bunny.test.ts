import { createHash } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  bunnyPlaybackConfigured,
  bunnyUploadConfigured,
  createVideo,
  getVideo,
  signVideoUrl,
  TUS_ENDPOINT,
  tusAuth,
} from "@/lib/academy/bunny";

const LIBRARY = "12345";
const API_KEY = "api-key-secret";
const CDN_HOST = "vz-test.b-cdn.net";
const TOKEN_KEY = "token-key-secret";
const GUID = "0f2a8b1e-guid";

function configureUpload() {
  vi.stubEnv("BUNNY_STREAM_LIBRARY_ID", LIBRARY);
  vi.stubEnv("BUNNY_STREAM_API_KEY", API_KEY);
}

function configurePlayback() {
  vi.stubEnv("BUNNY_STREAM_CDN_HOST", CDN_HOST);
  vi.stubEnv("BUNNY_STREAM_TOKEN_KEY", TOKEN_KEY);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("without BUNNY_* variables", () => {
  it("reports upload and playback as not configured", () => {
    expect(bunnyUploadConfigured()).toBe(false);
    expect(bunnyPlaybackConfigured()).toBe(false);
  });

  it("needs both variables of a pair", () => {
    vi.stubEnv("BUNNY_STREAM_LIBRARY_ID", LIBRARY);
    expect(bunnyUploadConfigured()).toBe(false);
    vi.stubEnv("BUNNY_STREAM_CDN_HOST", CDN_HOST);
    expect(bunnyPlaybackConfigured()).toBe(false);
  });

  it("signs nothing", () => {
    expect(signVideoUrl(GUID)).toBeNull();
  });
});

describe("signVideoUrl", () => {
  it("signs the playlist and the thumbnail with one directory-scoped token", () => {
    configurePlayback();
    const before = Math.floor(Date.now() / 1000);
    const signed = signVideoUrl(GUID);
    expect(signed).not.toBeNull();
    if (!signed) {
      return;
    }

    const tokenPath = `/${GUID}/`;
    const expected = createHash("sha256")
      .update(`${TOKEN_KEY}${tokenPath}${signed.expiresAt}token_path=${tokenPath}`)
      .digest("base64url");

    expect(signed.authQuery).toBe(
      `token=${expected}&expires=${signed.expiresAt}&token_path=${encodeURIComponent(tokenPath)}`,
    );
    expect(signed.url).toBe(`https://${CDN_HOST}/${GUID}/playlist.m3u8?${signed.authQuery}`);
    expect(signed.thumbnailUrl).toBe(`https://${CDN_HOST}/${GUID}/thumbnail.jpg?${signed.authQuery}`);
    // Default TTL is four hours.
    expect(signed.expiresAt).toBeGreaterThanOrEqual(before + 4 * 60 * 60);
    expect(signed.expiresAt).toBeLessThanOrEqual(before + 4 * 60 * 60 + 2);
  });

  it("honours BUNNY_URL_TTL_SECONDS and ignores a non-numeric value", () => {
    configurePlayback();
    vi.stubEnv("BUNNY_URL_TTL_SECONDS", "60");
    const now = Math.floor(Date.now() / 1000);
    expect(signVideoUrl(GUID)!.expiresAt).toBeGreaterThanOrEqual(now + 60);
    expect(signVideoUrl(GUID)!.expiresAt).toBeLessThanOrEqual(now + 62);

    vi.stubEnv("BUNNY_URL_TTL_SECONDS", "soon");
    expect(signVideoUrl(GUID)!.expiresAt).toBeGreaterThanOrEqual(now + 4 * 60 * 60);
  });
});

describe("tusAuth", () => {
  it("signs sha256hex(libraryId + apiKey + expires + videoId) for the TUS endpoint", () => {
    configureUpload();
    const now = Math.floor(Date.now() / 1000);
    const auth = tusAuth(GUID, 100);

    const expected = createHash("sha256").update(`${LIBRARY}${API_KEY}${auth.expires}${GUID}`).digest("hex");
    expect(auth).toEqual({
      endpoint: TUS_ENDPOINT,
      signature: expected,
      expires: auth.expires,
      videoId: GUID,
      libraryId: LIBRARY,
    });
    expect(auth.expires).toBeGreaterThanOrEqual(now + 100);
    expect(auth.expires).toBeLessThanOrEqual(now + 102);
  });

  it("defaults the TTL to six hours", () => {
    configureUpload();
    const now = Math.floor(Date.now() / 1000);
    expect(tusAuth(GUID).expires).toBeGreaterThanOrEqual(now + 6 * 60 * 60);
  });
});

describe("createVideo", () => {
  it("posts the title to the library with the API key and returns the guid", async () => {
    configureUpload();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ guid: GUID }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createVideo("Aula 1")).resolves.toEqual({ guid: GUID });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`https://video.bunnycdn.com/library/${LIBRARY}/videos`);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ AccessKey: API_KEY, "content-type": "application/json" });
    expect(JSON.parse(init.body as string)).toEqual({ title: "Aula 1" });
  });

  it("cuts the title at 250 characters", async () => {
    configureUpload();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ guid: GUID }));
    vi.stubGlobal("fetch", fetchMock);

    await createVideo("t".repeat(300));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string).title).toHaveLength(250);
  });

  it("throws with the status when Bunny refuses", async () => {
    configureUpload();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 401)));
    await expect(createVideo("x")).rejects.toThrow("bunny_create_failed_401");
  });
});

describe("getVideo", () => {
  async function stateFor(status: number, length = 0, extra: Record<string, unknown> = {}) {
    configureUpload();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ status, length, ...extra }));
    vi.stubGlobal("fetch", fetchMock);
    const video = await getVideo(GUID);
    return { video, fetchMock };
  }

  it("reads the video with the API key", async () => {
    const { fetchMock } = await stateFor(3);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`https://video.bunnycdn.com/library/${LIBRARY}/videos/${GUID}`);
    expect(init.headers).toEqual({ AccessKey: API_KEY });
  });

  it("maps status 5 to error, 3 and above to ready and the rest to processing", async () => {
    expect((await stateFor(5)).video.state).toBe("error");
    expect((await stateFor(3)).video.state).toBe("ready");
    expect((await stateFor(4)).video.state).toBe("ready");
    expect((await stateFor(6)).video.state).toBe("ready");
    expect((await stateFor(0)).video.state).toBe("processing");
    expect((await stateFor(1)).video.state).toBe("processing");
    expect((await stateFor(2)).video.state).toBe("processing");
  });

  it("rounds the length to whole minutes, never below one", async () => {
    expect((await stateFor(3, 0)).video.durationMinutes).toBe(1);
    expect((await stateFor(3, 29)).video.durationMinutes).toBe(1);
    expect((await stateFor(3, 90)).video.durationMinutes).toBe(2);
    expect((await stateFor(3, 629)).video.durationMinutes).toBe(10);
  });

  it("passes through progress, length and resolutions with defaults", async () => {
    const { video } = await stateFor(2, 120, { encodeProgress: 40, availableResolutions: "360p,720p" });
    expect(video).toEqual({
      state: "processing",
      status: 2,
      encodeProgress: 40,
      lengthSeconds: 120,
      durationMinutes: 2,
      resolutions: "360p,720p",
    });

    const { video: bare } = await stateFor(1);
    expect(bare.encodeProgress).toBe(0);
    expect(bare.lengthSeconds).toBe(0);
    expect(bare.resolutions).toBeNull();
  });

  it("throws with the status when Bunny refuses", async () => {
    configureUpload();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 404)));
    await expect(getVideo(GUID)).rejects.toThrow("bunny_get_failed_404");
  });
});

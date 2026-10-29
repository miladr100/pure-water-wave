import { describe, expect, it } from "vitest";

import { getYoutubeThumbnailUrl, getYoutubeWatchUrl, parseYoutubeId } from "@/lib/academy/youtube";

const ID = "dQw4w9WgXcQ";

describe("parseYoutubeId", () => {
  it("accepts a bare 11-character id, trimmed", () => {
    expect(parseYoutubeId(ID)).toBe(ID);
    expect(parseYoutubeId(`  ${ID}\n`)).toBe(ID);
    expect(parseYoutubeId("a-b_c123456")).toBe("a-b_c123456");
  });

  it("reads the v parameter of a watch URL", () => {
    expect(parseYoutubeId(`https://www.youtube.com/watch?v=${ID}`)).toBe(ID);
    expect(parseYoutubeId(`https://www.youtube.com/watch?t=42&v=${ID}&list=PL1`)).toBe(ID);
  });

  it("reads the last path segment of youtu.be, shorts and embed URLs", () => {
    expect(parseYoutubeId(`https://youtu.be/${ID}`)).toBe(ID);
    expect(parseYoutubeId(`https://youtu.be/${ID}?si=abc`)).toBe(ID);
    expect(parseYoutubeId(`https://www.youtube.com/shorts/${ID}`)).toBe(ID);
    expect(parseYoutubeId(`https://www.youtube.com/embed/${ID}/`)).toBe(ID);
  });

  it("returns null for garbage, ids of the wrong length and URLs without an id", () => {
    expect(parseYoutubeId("")).toBeNull();
    expect(parseYoutubeId("not a url")).toBeNull();
    expect(parseYoutubeId("abc")).toBeNull();
    expect(parseYoutubeId("dQw4w9WgXcQ1")).toBeNull();
    expect(parseYoutubeId("https://www.youtube.com/")).toBeNull();
    expect(parseYoutubeId("https://www.youtube.com/watch?v=short")).toBeNull();
    expect(parseYoutubeId("https://example.com/path/with/many/segments")).toBeNull();
  });
});

describe("YouTube URLs", () => {
  it("builds the hqdefault thumbnail URL", () => {
    expect(getYoutubeThumbnailUrl(ID)).toBe(`https://img.youtube.com/vi/${ID}/hqdefault.jpg`);
  });

  it("builds the watch URL", () => {
    expect(getYoutubeWatchUrl(ID)).toBe(`https://www.youtube.com/watch?v=${ID}`);
  });
});

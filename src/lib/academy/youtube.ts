// Same helpers the library uses for its support videos.
export function getYoutubeThumbnailUrl(youtubeId: string) {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function getYoutubeWatchUrl(youtubeId: string) {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

// Accepts a bare id or any of the usual URL forms and returns the 11-char id.
export function parseYoutubeId(input: string): string | null {
  const value = input.trim();

  if (YOUTUBE_ID.test(value)) {
    return value;
  }

  try {
    const url = new URL(value);
    const fromQuery = url.searchParams.get("v");
    if (fromQuery && YOUTUBE_ID.test(fromQuery)) {
      return fromQuery;
    }

    const segments = url.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && YOUTUBE_ID.test(last)) {
      return last;
    }
  } catch {
    // not a URL
  }

  return null;
}

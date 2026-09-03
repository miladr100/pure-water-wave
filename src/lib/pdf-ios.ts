export function isAppleTouchDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return (
    /iP(hone|od|ad)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function getIosVersion() {
  if (typeof navigator === "undefined") {
    return null;
  }

  const match = navigator.userAgent.match(/OS (\d+)[._](\d+)/);

  if (!match) {
    return null;
  }

  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
  };
}

function isIosBelow(major: number, minor = 0) {
  const version = getIosVersion();

  if (!version) {
    return false;
  }

  return (
    version.major < major ||
    (version.major === major && version.minor < minor)
  );
}

/**
 * PDF.js 5 / react-pdf 10 officially need Safari 17.4+.
 * Older iPhones (often stuck on iOS 16) fail to load the worker.
 */
export function shouldUseNativePdfViewer() {
  if (!isAppleTouchDevice()) {
    return false;
  }

  const version = getIosVersion();

  if (!version) {
    return false;
  }

  return isIosBelow(17, 4);
}

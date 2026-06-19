import { readFileSync } from "fs";
import { join } from "path";

const LOGO_CONTENT_ID = "pw-logo";
const LOGO_WIDTH = 1556;
const LOGO_HEIGHT = 2000;
const EMAIL_LOGO_DISPLAY_WIDTH = 120;

export const emailLogoDimensions = {
  width: EMAIL_LOGO_DISPLAY_WIDTH,
  height: Math.round(EMAIL_LOGO_DISPLAY_WIDTH * (LOGO_HEIGHT / LOGO_WIDTH)),
};

let cachedLogoBase64: string | null = null;

function getLogoBase64() {
  if (cachedLogoBase64) return cachedLogoBase64;

  const logoPath = join(process.cwd(), "public", "assets", "pwlogo.png");
  cachedLogoBase64 = readFileSync(logoPath).toString("base64");
  return cachedLogoBase64;
}

export function getEmailLogoContentId() {
  return LOGO_CONTENT_ID;
}

export function getEmailLogoAttachment() {
  return {
    filename: "pwlogo.png",
    content: getLogoBase64(),
    contentId: LOGO_CONTENT_ID,
    contentType: "image/png",
  };
}

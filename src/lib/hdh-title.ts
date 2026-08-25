const SMALL_WORDS = new Set([
  "A",
  "O",
  "AS",
  "OS",
  "E",
  "DE",
  "DA",
  "DO",
  "DAS",
  "DOS",
  "EM",
  "NA",
  "NO",
  "NAS",
  "NOS",
  "PARA",
  "AO",
  "AOS",
  "COM",
  "OU",
  "UM",
  "UMA",
  "É",
  "EL",
  "LA",
  "LOS",
  "LAS",
  "DEL",
  "Y",
  "EN",
  "UN",
  "UNA",
  "AL",
  "POR",
  "ES",
  "AN",
  "AND",
  "AT",
  "BY",
  "FOR",
  "FROM",
  "IN",
  "OF",
  "ON",
  "OR",
  "THE",
  "TO",
  "IS",
  "UNTIL",
]);

export function formatHdhTitle(title: string) {
  return title
    .split(/\s+/)
    .map((word, index) => {
      const punctuation = word.match(/[?!.]+$/)?.[0] ?? "";
      const core = word.replace(/[?!.]+$/, "");

      if (index > 0 && SMALL_WORDS.has(core)) {
        return core.toLowerCase() + punctuation;
      }

      return core.charAt(0) + core.slice(1).toLowerCase() + punctuation;
    })
    .join(" ");
}

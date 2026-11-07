// Split text into search-sized chunks along paragraph boundaries.
// Each chunk is what search returns and what chat cites as [n], so a few paragraphs is the right size.

const TARGET_CHARS = 1500;

export function chunkText(text: string): string[] {
  const paragraphs = text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .flatMap(splitLongParagraph);

  const chunks: string[] = [];
  let current = "";
  for (const p of paragraphs) {
    if (current && current.length + p.length + 2 > TARGET_CHARS) {
      chunks.push(current);
      current = p;
    } else {
      current = current ? `${current}\n\n${p}` : p;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// PDFs often come out as one giant "paragraph"; break those at sentence or word boundaries.
function splitLongParagraph(p: string): string[] {
  const parts: string[] = [];
  let rest = p;
  while (rest.length > TARGET_CHARS) {
    const window = rest.slice(0, TARGET_CHARS);
    const sentenceEnd = Math.max(window.lastIndexOf(". "), window.lastIndexOf("\n"));
    const space = window.lastIndexOf(" ");
    const cut = sentenceEnd > TARGET_CHARS / 2 ? sentenceEnd + 1 : space > TARGET_CHARS / 2 ? space : TARGET_CHARS;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

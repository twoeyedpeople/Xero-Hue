export type ParsedDataUrl = {
  mimeType: string;
  base64: string;
};

const DATA_URL_PATTERN = /^data:([^;,]+);base64,(.+)$/;

export function parseDataUrl(dataUrl: string): ParsedDataUrl {
  const match = dataUrl.match(DATA_URL_PATTERN);

  if (!match) {
    throw new Error("Expected a base64 data URL.");
  }

  return {
    mimeType: match[1],
    base64: match[2],
  };
}

export function dataUrlToBuffer(dataUrl: string): { mimeType: string; buffer: Buffer } {
  const parsed = parseDataUrl(dataUrl);

  return {
    mimeType: parsed.mimeType,
    buffer: Buffer.from(parsed.base64, "base64"),
  };
}

export function bufferToDataUrl(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

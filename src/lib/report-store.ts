export type MemoryReport = {
  buffer: Buffer;
  contentType: string;
  paletteId?: number;
  paletteName?: string;
  createdAt: number;
};

declare global {
  var __xeroHueReports: Map<string, MemoryReport> | undefined;
}

export function getMemoryReports(): Map<string, MemoryReport> {
  if (!globalThis.__xeroHueReports) {
    globalThis.__xeroHueReports = new Map<string, MemoryReport>();
  }

  return globalThis.__xeroHueReports;
}

export function hasBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

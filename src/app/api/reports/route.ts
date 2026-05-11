import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { dataUrlToBuffer } from "@/lib/data-url";
import { getMemoryReports, hasBlobStorage } from "@/lib/report-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ReportRequest = {
  image: string;
  paletteId?: number;
  paletteName?: string;
};

function getOrigin(request: Request): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  let payload: ReportRequest;

  try {
    payload = (await request.json()) as ReportRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.image) {
    return Response.json({ error: "Missing report image." }, { status: 400 });
  }

  const id = randomUUID();
  const { buffer, mimeType } = dataUrlToBuffer(payload.image);
  const pathname = `reports/${id}.png`;
  let blobUrl: string | undefined;
  let blobDownloadUrl: string | undefined;
  let storage: "blob" | "memory" = "memory";

  if (hasBlobStorage()) {
    const blob = await put(pathname, buffer, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: false,
      cacheControlMaxAge: 60 * 60 * 24 * 7,
      contentType: mimeType,
    });

    blobUrl = blob.url;
    blobDownloadUrl = blob.downloadUrl;
    storage = "blob";
  } else {
    getMemoryReports().set(id, {
      buffer,
      contentType: mimeType,
      paletteId: payload.paletteId,
      paletteName: payload.paletteName,
      createdAt: Date.now(),
    });
  }

  const origin = getOrigin(request);

  return Response.json({
    id,
    storage,
    downloadPageUrl: `${origin}/download/${id}`,
    imageUrl: `${origin}/api/reports/${id}/image`,
    blobUrl,
    blobDownloadUrl,
  });
}

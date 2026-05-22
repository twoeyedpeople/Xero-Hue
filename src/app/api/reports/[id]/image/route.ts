import { get } from "@vercel/blob";
import { getMemoryReports, hasBlobStorage } from "@/lib/report-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const REPORT_IMAGE_EXTENSIONS = ["jpg", "png", "webp"] as const;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function notFound() {
  return new Response("Report image not found.", { status: 404 });
}

function getExtensionFromContentType(contentType: string | undefined): string {
  if (contentType === "image/jpeg") {
    return "jpg";
  }

  if (contentType === "image/webp") {
    return "webp";
  }

  return "png";
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const disposition = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";

  if (hasBlobStorage()) {
    let result: Awaited<ReturnType<typeof get>> | null = null;

    for (const extension of REPORT_IMAGE_EXTENSIONS) {
      const nextResult = await get(`reports/${id}.${extension}`, { access: "private" }).catch(() => null);

      if (nextResult?.statusCode === 200 && nextResult.stream) {
        result = nextResult;
        break;
      }
    }

    if (!result?.stream) {
      return notFound();
    }

    const extension = getExtensionFromContentType(result.blob.contentType);

    return new Response(result.stream, {
      headers: {
        "Cache-Control": "public, max-age=604800, immutable",
        "Content-Disposition": `${disposition}; filename="xero-hue-report-${id}.${extension}"`,
        "Content-Type": result.blob.contentType,
      },
    });
  }

  const report = getMemoryReports().get(id);

  if (!report) {
    return notFound();
  }

  return new Response(new Uint8Array(report.buffer), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `${disposition}; filename="xero-hue-report-${id}.${getExtensionFromContentType(report.contentType)}"`,
      "Content-Type": report.contentType,
    },
  });
}

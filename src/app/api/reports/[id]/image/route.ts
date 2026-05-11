import { get } from "@vercel/blob";
import { getMemoryReports, hasBlobStorage } from "@/lib/report-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function notFound() {
  return new Response("Report image not found.", { status: 404 });
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const disposition = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";

  if (hasBlobStorage()) {
    const result = await get(`reports/${id}.png`, { access: "private" });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return notFound();
    }

    return new Response(result.stream, {
      headers: {
        "Cache-Control": "public, max-age=604800, immutable",
        "Content-Disposition": `${disposition}; filename="xero-hue-report-${id}.png"`,
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
      "Content-Disposition": `${disposition}; filename="xero-hue-report-${id}.png"`,
      "Content-Type": report.contentType,
    },
  });
}

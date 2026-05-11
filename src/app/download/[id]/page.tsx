import Link from "next/link";

type DownloadPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DownloadPage({ params }: DownloadPageProps) {
  const { id } = await params;
  const imageUrl = `/api/reports/${id}/image`;
  const downloadUrl = `/api/reports/${id}/image?download=1`;

  return (
    <main className="download-page">
      <section className="download-panel">
        <div className="download-brand">xero hue</div>
        <div className="download-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Your generated Hue report" />
        </div>
        <a className="primary-action" href={downloadUrl} download>
          Download image
        </a>
        <Link className="secondary-link" href="/">
          Create another report
        </Link>
      </section>
    </main>
  );
}

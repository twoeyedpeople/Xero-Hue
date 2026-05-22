import { DownloadShareButton } from "./download-share-button";

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="download-brand" src="/images/Logo-Xero.svg" alt="Xero" />
        <div className="download-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Your generated Hue report" />
        </div>
        <DownloadShareButton downloadUrl={downloadUrl} imageUrl={imageUrl} />
      </section>
    </main>
  );
}

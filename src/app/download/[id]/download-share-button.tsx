"use client";

import { useState } from "react";

type DownloadShareButtonProps = {
  downloadUrl: string;
  imageUrl: string;
};

function getFilename(response: Response): string {
  const disposition = response.headers.get("content-disposition");
  const match = disposition?.match(/filename="?([^"]+)"?/i);

  return match?.[1] ?? "xero-hue-report.jpg";
}

function downloadImage(downloadUrl: string): void {
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "";
  document.body.append(link);
  link.click();
  link.remove();
}

export function DownloadShareButton({ downloadUrl, imageUrl }: DownloadShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isSharing) {
      return;
    }

    if (!navigator.share) {
      downloadImage(downloadUrl);
      return;
    }

    setIsSharing(true);

    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error("Report image is not available.");
      }

      const blob = await response.blob();
      const file = new File([blob], getFilename(response), {
        type: blob.type || response.headers.get("content-type") || "image/jpeg",
      });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Xero Hue report",
        });
        return;
      }

      await navigator.share({
        title: "Xero Hue report",
        url: new URL(imageUrl, window.location.href).href,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      downloadImage(downloadUrl);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button className="primary-action" type="button" onClick={handleShare} disabled={isSharing}>
      {isSharing ? "Preparing..." : "Download image"}
    </button>
  );
}

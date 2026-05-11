import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Xero - Hue & You",
    short_name: "Hue & You",
    description: "AI colour analysis and personalised palette report.",
    start_url: "/",
    scope: "/",
    display: "fullscreen",
    background_color: "#ECF2F6",
    theme_color: "#062F48",
    orientation: "portrait",
    icons: [
      {
        src: "/images/appIcon.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/appIcon.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

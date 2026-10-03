import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Caribbean Star Store",
    short_name: "Caribbean Star",
    description: "An international marketplace for products, services, businesses, jobs, and real estate.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0670c8",
    icons: [
      {
        src: "/caribbean-star-store-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

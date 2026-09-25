import type { MetadataRoute } from "next";

const productionSite = "https://caribbeanstarstorett.com";

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV !== "production") {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/auth",
        "/api",
        "/build-a-buy",
        "/business",
        "/dashboard",
        "/forgot-password",
        "/sell",
        "/seller",
        "/sign-in",
        "/sign-up",
        "/update-password",
      ],
      allow: ["/", "/businesses"],
    },
    sitemap: `${productionSite}/sitemap.xml`,
    host: productionSite,
  };
}

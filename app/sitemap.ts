import type { MetadataRoute } from "next";

const productionSite = "https://www.caribbeanstarstorett.com";

export default function sitemap(): MetadataRoute.Sitemap {
  if (process.env.VERCEL_ENV !== "production") return [];

  return [
    { url: productionSite, changeFrequency: "weekly", priority: 1 },
    { url: `${productionSite}/marketplace`, changeFrequency: "daily", priority: 0.9 },
    { url: `${productionSite}/auctions`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${productionSite}/businesses`, changeFrequency: "daily", priority: 0.8 },
    { url: `${productionSite}/opportunities`, changeFrequency: "daily", priority: 0.8 },
    { url: `${productionSite}/sell`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${productionSite}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${productionSite}/help`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${productionSite}/how-it-works`, changeFrequency: "monthly", priority: 0.6 },
  ];
}

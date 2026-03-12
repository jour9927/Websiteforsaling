import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/login", "/signup", "/logout"],
      },
    ],
    sitemap: "https://eventglass.vercel.app/sitemap.xml",
  };
}

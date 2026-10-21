import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const exercises = await prisma.exercise.findMany({
    select: { slug: true, updatedAt: true },
    orderBy: { name: "asc" },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/entrar`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/criar-conta`, changeFrequency: "monthly", priority: 0.8 },
  ];

  const exerciseRoutes: MetadataRoute.Sitemap = exercises.map((exercise) => ({
    url: `${baseUrl}/exercicios/${exercise.slug}`,
    lastModified: exercise.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...exerciseRoutes];
}

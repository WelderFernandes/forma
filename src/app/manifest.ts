import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL
  )?.replace(/\/$/, "");
  const manifestUrl = appUrl
    ? `${appUrl}/manifest.webmanifest`
    : "/manifest.webmanifest";
  const appId = appUrl ? `${appUrl}/` : "/";

  return {
    name: "Forma — Treino, Nutrição e Bem-estar",
    short_name: "Forma",
    description:
      "Planos de treino sob medida, dicas de execução, acompanhamento de progresso e ferramentas de nutrição.",
    id: "/",
    scope: "/",
    start_url: "/painel",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#111310",
    theme_color: "#111310",
    lang: "pt-BR",
    dir: "ltr",
    categories: ["health", "fitness", "lifestyle"],
    prefer_related_applications: false,
    // Permite que `navigator.getInstalledRelatedApps()` identifique esta PWA
    // quando ela já estiver instalada, inclusive se o usuário abrir pelo navegador.
    related_applications: [
      {
        platform: "webapp",
        url: manifestUrl,
        id: appId,
      },
    ],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Painel", url: "/painel" },
      { name: "Treinar agora", url: "/treinos" },
      { name: "Cardio ao ar livre", url: "/cardio" },
      { name: "Progresso", url: "/progresso" },
      { name: "Registrar refeição", url: "/nutricao" },
    ],
  };
}

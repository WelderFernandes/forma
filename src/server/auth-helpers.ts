import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "@/lib/auth";

/**
 * Retorna o usuário autenticado ou null.
 * Cacheado por requisição para evitar múltiplas consultas ao banco.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
});

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Retorna o id do usuário autenticado ou lança. */
export async function requireUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return user.id;
}

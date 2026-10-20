/**
 * Smoke test end-to-end do Forma.
 *
 * Cria um usuário real via Better Auth, percorre as rotas autenticadas
 * verificando status HTTP e ausência de erros de renderização.
 *
 * Uso: node scripts/smoke.mjs [baseUrl]
 */

const BASE = process.argv[2] ?? "http://localhost:3000";
const STAMP = Date.now();
const EMAIL = `smoke+${STAMP}@forma.test`;
const PASSWORD = "senha-de-teste-123";
const NAME = "Usuário Smoke";

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  const icon = ok ? "✔" : "✖";
  console.log(`${icon} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function readSetCookies(response) {
  const raw = response.headers.getSetCookie?.() ?? [];
  return raw.map((c) => c.split(";")[0]).join("; ");
}

async function main() {
  console.log(`\n→ Smoke test em ${BASE}\n`);

  // ── 1. Landing pública ──
  const landing = await fetch(`${BASE}/`);
  record(
    "Landing pública",
    landing.status === 200,
    `status ${landing.status}`,
  );

  // ── 2. Cadastro via Better Auth ──
  const signUp = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BASE,
    },
    body: JSON.stringify({ name: NAME, email: EMAIL, password: PASSWORD }),
  });

  const signUpBody = await signUp.text();
  let cookies = await readSetCookies(signUp);
  let userId = null;
  try {
    const parsed = JSON.parse(signUpBody);
    userId = parsed?.user?.id ?? null;
    if (parsed?.token && !cookies) cookies = `better-auth.session_token=${parsed.token}`;
  } catch {
    /* resposta não-JSON */
  }

  record(
    "Cadastro via Better Auth",
    signUp.ok && Boolean(cookies),
    `status ${signUp.status}${userId ? ` user=${userId}` : ""}`,
  );

  if (!cookies) {
    console.log("\nSem cookie de sessão — encerrando.");
    summarize();
    return;
  }

  // ── 3. Sessão autenticada ──
  const session = await fetch(`${BASE}/api/auth/get-session`, {
    headers: { Cookie: cookies },
  });
  const sessionBody = await session.json().catch(() => null);
  record(
    "Sessão ativa",
    session.ok && Boolean(sessionBody?.user),
    sessionBody?.user?.email ?? "sem usuário",
  );

  // ── 4. Rotas autenticadas ──
  const routes = [
    "/painel",
    "/treinos",
    "/treinos/novo",
    "/exercicios",
    "/exercicios/flexao-de-barra",
    "/progresso",
    "/nutricao",
    "/corpo",
    "/calculadoras",
    "/desafios",
    "/mentalidade",
    "/configuracoes",
    "/onboarding",
  ];

  for (const route of routes) {
    try {
      const res = await fetch(`${BASE}${route}`, {
        headers: { Cookie: cookies },
        redirect: "manual",
      });
      const text = await res.text();
      const broken =
        /Unhandled Runtime Error|Application error: a server-side exception|Internal Server Error/i.test(
          text,
        );
      const redirected = res.status === 307 || res.status === 302;
      record(
        `GET ${route}`,
        !broken,
        broken
          ? "ERRO DE RENDERIZAÇÃO"
          : redirected
            ? `redirecionado (${res.status})`
            : `status ${res.status}`,
      );
    } catch (error) {
      record(`GET ${route}`, false, String(error).slice(0, 90));
    }
  }

  // ── 5. Fluxo do onboarding (grava perfil + plano) ──
  const onboard = await fetch(`${BASE}/api/onboarding`, {
    method: "POST",
    headers: { Cookie: cookies, "Content-Type": "application/json" },
    body: JSON.stringify({
      sex: "male",
      birthDate: "1994-05-10",
      heightCm: 178,
      weightKg: 82.5,
      goal: "build_muscle",
      level: "intermediate",
      equipment: ["none", "dumbbell", "band"],
      daysPerWeek: 4,
      sessionMinutes: 45,
      focusAreas: ["costas", "quadril"],
      lowImpact: false,
      activity: "moderate",
    }),
  });
  const onboardText = await onboard.text();
  record(
    "Onboarding grava perfil e gera plano",
    onboard.ok && !/error/i.test(onboardText.slice(0, 200)),
    onboardText.slice(0, 120),
  );

  // ── 6. Painel autenticado agora deve renderizar ──
  const panel = await fetch(`${BASE}/painel`, {
    headers: { Cookie: cookies },
    redirect: "manual",
  });
  const panelText = await panel.text();
  record(
    "Painel com perfil completo",
    panel.status === 200 &&
      !/Unhandled Runtime Error|Internal Server Error/i.test(panelText),
    `status ${panel.status}`,
  );

  // ── 7. Rotas públicas de metadata ──
  for (const meta of ["/robots.txt", "/sitemap.xml", "/manifest.webmanifest"]) {
    try {
      const res = await fetch(`${BASE}${meta}`);
      record(`GET ${meta}`, res.ok, `status ${res.status}`);
    } catch (error) {
      record(`GET ${meta}`, false, String(error).slice(0, 80));
    }
  }

  summarize();
}

function summarize() {
  const failed = results.filter((r) => !r.ok);
  console.log(
    `\n${results.length - failed.length}/${results.length} verificações passaram`,
  );
  if (failed.length > 0) {
    console.log("\nFalhas:");
    for (const f of failed) console.log(` - ${f.name}: ${f.detail}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Erro no smoke test:", error);
  process.exit(1);
});

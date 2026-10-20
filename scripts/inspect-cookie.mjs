/** Inspeciona os headers crus de um POST de cadastro (Set-Cookie). */
const BASE = "http://localhost:3000";
const email = `cookie${Date.now()}@forma.test`;

const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Origin: BASE,
  },
  body: JSON.stringify({
    name: "Cookie Test",
    email,
    password: "senha-de-teste-123",
  }),
});

console.log("status:", res.status);
console.log("--- headers ---");
for (const [key, value] of res.headers) {
  console.log(`${key}: ${value}`);
}
console.log("--- getSetCookie ---");
console.log(res.headers.getSetCookie());
console.log("--- body ---");
console.log((await res.text()).slice(0, 300));

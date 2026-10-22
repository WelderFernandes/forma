/**
 * Captura o `beforeinstallprompt` antes da hidratação do React.
 *
 * O evento pode ser disparado pelo navegador antes dos componentes clientes
 * montarem. Sem esta captura antecipada, o prompt nativo se perde e o botão
 * "Instalar" acaba caindo nas instruções manuais.
 */
const INSTALL_PROMPT_CAPTURE = `
(function () {
  if (typeof window === "undefined") return;
  if (window.__formaInstallPrompt !== undefined) return;

  window.__formaInstallPrompt = null;

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    window.__formaInstallPrompt = event;
    window.dispatchEvent(new Event("forma:installprompt"));
  });

  window.addEventListener("appinstalled", function () {
    window.__formaInstallPrompt = null;
    window.__formaAppInstalled = true;
    try {
      window.localStorage.setItem("forma:app-installed-at", String(Date.now()));
    } catch (error) {
      // Sem localStorage, o marcador em memória ainda evita o banner nesta sessão.
    }
    window.dispatchEvent(new Event("forma:appinstalled"));
  });
})();
`;

export function InstallPromptCapture() {
  return <script dangerouslySetInnerHTML={{ __html: INSTALL_PROMPT_CAPTURE }} />;
}

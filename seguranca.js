
(function () {
  "use strict";

  const KEY = "financasCasaSegurancaV1";
  const LOCK_AFTER = 2 * 60 * 1000;

  if (!window.crypto || !crypto.subtle) {
    console.warn("Segurança: navegador incompatível.");
    return;
  }

  const encoder = new TextEncoder();
  let config = null;
  let unlocked = false;
  let lastActivity = Date.now();

  try {
    config = JSON.parse(localStorage.getItem(KEY));
  } catch {
    config = null;
  }

  function bytesToBase64(bytes) {
    let text = "";
    bytes.forEach(b => text += String.fromCharCode(b));
    return btoa(text);
  }

  function base64ToBytes(text) {
    return Uint8Array.from(atob(text), c => c.charCodeAt(0));
  }

  async function derive(pin, salt) {
    const material = await crypto.subtle.importKey(
      "raw",
      encoder.encode(pin),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 310000,
        hash: "SHA-256"
      },
      material,
      256
    );

    return bytesToBase64(new Uint8Array(bits));
  }

  function validPin(pin) {
    return /^\d{6}$/.test(pin);
  }

  const overlay = document.createElement("div");
  overlay.id = "securityOverlay";
  overlay.style.cssText = `
    position:fixed;
    inset:0;
    z-index:99999;
    background:#123b35;
    color:white;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:20px;
  `;

  const panel = document.createElement("div");
  panel.style.cssText = `
    background:white;
    color:#17342e;
    border-radius:18px;
    padding:24px;
    width:100%;
    max-width:360px;
    text-align:center;
  `;

  overlay.appendChild(panel);

  function setPanel(title, description, buttonText) {
    panel.replaceChildren();

    const heading = document.createElement("h2");
    heading.textContent = title;

    const info = document.createElement("p");
    info.textContent = description;

    const input = document.createElement("input");
    input.type = "password";
    input.inputMode = "numeric";
    input.autocomplete = "off";
    input.maxLength = 6;
    input.placeholder = "PIN de 6 números";
    input.setAttribute("aria-label", "PIN de 6 números");

    const message = document.createElement("p");
    message.style.color = "#ad493a";

    const button = document.createElement("button");
    button.textContent = buttonText;
    button.className = "primary";
    button.style.width = "100%";

    panel.append(heading, info, input, message, button);

    return { input, message, button };
  }

  function showOverlay() {
    if (!overlay.isConnected) {
      document.body.appendChild(overlay);
    }
  }

  function hideOverlay() {
    overlay.remove();
    unlocked = true;
    lastActivity = Date.now();
  }

  function lock() {
    if (!config) return;

    unlocked = false;
    showOverlay();

    const ui = setPanel(
      "Finanças da Casa",
      "Digite seu PIN para acessar.",
      "Desbloquear"
    );

    ui.button.onclick = async function () {
      const pin = ui.input.value;

      if (!validPin(pin)) {
        ui.message.textContent = "Digite os 6 números.";
        return;
      }

      ui.button.disabled = true;

      try {
        const hash = await derive(
          pin,
          base64ToBytes(config.salt)
        );

        if (hash === config.hash) {
          hideOverlay();
        } else {
          ui.message.textContent = "PIN incorreto.";
          ui.input.value = "";
        }
      } catch {
        ui.message.textContent = "Erro ao verificar PIN.";
      } finally {
        ui.button.disabled = false;
      }
    };
  }

  function setup() {
    showOverlay();

    const ui = setPanel(
      "Criar PIN de segurança",
      "Escolha 6 números e confirme na próxima etapa.",
      "Continuar"
    );

    ui.button.onclick = function () {
      const first = ui.input.value;

      if (!validPin(first)) {
        ui.message.textContent = "Use exatamente 6 números.";
        return;
      }

      const confirmUI = setPanel(
        "Confirmar PIN",
        "Digite novamente os mesmos 6 números.",
        "Ativar proteção"
      );

      confirmUI.button.onclick = async function () {
        if (confirmUI.input.value !== first) {
          confirmUI.message.textContent =
            "Os códigos não coincidem.";
          return;
        }

        confirmUI.button.disabled = true;

        try {
          const salt = crypto.getRandomValues(
            new Uint8Array(16)
          );

          const hash = await derive(first, salt);

          config = {
            version: 1,
            salt: bytesToBase64(salt),
            hash
          };

          localStorage.setItem(
            KEY,
            JSON.stringify(config)
          );

          hideOverlay();
          alert("PIN configurado com sucesso!");
        } catch {
          confirmUI.message.textContent =
            "Não foi possível configurar o PIN.";
          confirmUI.button.disabled = false;
        }
      };
    };
  }

  const lockButton = document.createElement("button");
  lockButton.type = "button";
  lockButton.textContent = "🔒 Bloquear agora";
  lockButton.style.cssText =
    "display:block;margin:0 16px 12px;width:calc(100% - 32px)";

  const privacyButton = document.getElementById(
    "privacyToggle"
  );

  if (privacyButton) {
    privacyButton.after(lockButton);
  } else {
    document.querySelector("header").after(lockButton);
  }

  lockButton.onclick = lock;

  ["pointerdown", "keydown", "touchstart"].forEach(event => {
    document.addEventListener(event, function () {
      if (unlocked && !document.hidden) {
        lastActivity = Date.now();
      }
    }, { passive: true });
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && config) {
      lock();
    }
  });

  window.setInterval(function () {
    if (
      config &&
      unlocked &&
      Date.now() - lastActivity >= LOCK_AFTER
    ) {
      lock();
    }
  }, 1000);

  if (config && config.salt && config.hash) {
    lock();
  } else {
    setup();
  }
})();

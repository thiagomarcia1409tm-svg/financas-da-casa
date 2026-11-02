
/* Finanças da Casa — bloqueio visual local, versão 2.
 * Não criptografa o armazenamento local nem substitui autenticação de servidor.
 */
(function () {
  'use strict';
  const KEY = 'financasCasaSegurancaV2';
  const LEGACY_KEY = 'financasCasaSegurancaV1';
  const IDLE_MS = 2 * 60 * 1000;
  const ROUNDS = 310000;
  if (!window.crypto || !crypto.subtle || !document.body) return;

  const enc = new TextEncoder();
  const b64 = bytes => btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''));
  const unb64 = str => Uint8Array.from(atob(str), c => c.charCodeAt(0));
  const validPin = pin => /^\d{6}$/.test(pin);
  const randomRecovery = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

  async function digest(secret, salt) {
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveBits']);
    return b64(new Uint8Array(await crypto.subtle.deriveBits({
      name: 'PBKDF2',
      salt,
      iterations: ROUNDS,
      hash: 'SHA-256'
    }, key, 256)));
  }

  let cfg;
  try {
    cfg = JSON.parse(localStorage.getItem(KEY));
  } catch (_) {
    cfg = null;
  }

  if (!cfg || cfg.version !== 2 || !cfg.salt || !cfg.pinHash || !cfg.recoveryHash) {
    cfg = null;
  }

  let unlocked = false;
  let lastActivity = Date.now();
  let attempts = 0;
  let waitUntil = 0;

  const cover = document.createElement('div');
  cover.id = 'securityOverlay';
  cover.setAttribute('role', 'dialog');
  cover.setAttribute('aria-modal', 'true');
  cover.setAttribute('aria-label', 'Proteção do Finanças da Casa');
  cover.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#123b35;color:#17342e;display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto';

  const panel = document.createElement('div');
  panel.style.cssText = 'background:#fff;border-radius:18px;padding:22px;width:100%;max-width:380px;box-shadow:0 10px 36px #0005';
  cover.append(panel);

  function show() {
    if (!cover.isConnected) document.body.append(cover);
  }

  function hide() {
  unlocked = true;
  lastActivity = Date.now();
  cover.remove();
  document.documentElement.classList.remove('security-pending');
  }

  function node(tag, content) {
    const el = document.createElement(tag);
    el.textContent = content;
    return el;
  }

  function render(title, description) {
    panel.replaceChildren();
    const heading = node('h2', title);
    const info = node('p', description);
    const msg = node('p', '');
    msg.style.cssText = 'color:#a63d31;min-height:1.3em;font-size:14px';
    panel.append(heading, info);

    return {
      msg,
      addInput(label, placeholder = '') {
        const field = node('label', label);
        const input = document.createElement('input');
        input.type = 'password';
        input.autocomplete = 'off';
        input.inputMode = 'numeric';
        input.maxLength = 6;
        input.placeholder = placeholder;
        input.style.cssText = 'width:100%;padding:12px;margin:8px 0 12px;border:1px solid #ccc;border-radius:10px';
        panel.append(field, input);
        return input;
      },
      addButton(label, fn, secondary = false) {
        const btn = node('button', label);
        btn.type = 'button';
        btn.style.cssText = 'width:100%;padding:12px;margin-top:8px;border:0;border-radius:10px;background:' + (secondary ? '#e7efeb' : '#176b55') + ';color:' + (secondary ? '#17342e' : 'white') + ';font-weight:700';
        btn.addEventListener('click', fn);
        panel.append(btn);
        return btn;
      },
      finish() {
        panel.append(msg);
      }
    };
  }

  function lock() {
  if (!cfg) return;

  document.documentElement.classList.add('security-pending');
  unlocked = false;
  show();

    const ui = render('🔒 Finanças da Casa', 'Digite seu PIN para desbloquear.');
    const input = ui.addInput('PIN de 6 números', '••••••');

    const btn = ui.addButton('Desbloquear', async () => {
      if (Date.now() < waitUntil) {
        ui.msg.textContent = 'Aguarde antes de tentar novamente.';
        return;
      }

      if (!validPin(input.value)) {
        ui.msg.textContent = 'Digite exatamente 6 números.';
        return;
      }

      btn.disabled = true;

      try {
        const hash = await digest(input.value, unb64(cfg.salt));

        if (hash === cfg.pinHash) {
          attempts = 0;
          waitUntil = 0;
          hide();
        } else {
          attempts++;

          if (attempts >= 5) {
            waitUntil = Date.now() + 30000;
            attempts = 0;
            ui.msg.textContent = 'Muitas tentativas. Aguarde 30 segundos.';
          } else {
            ui.msg.textContent = 'PIN incorreto.';
          }

          input.value = '';
        }
      } catch (_) {
        ui.msg.textContent = 'Não foi possível verificar o PIN.';
      } finally {
        btn.disabled = false;
      }
    });

    ui.addButton('Esqueci meu PIN', recovery, true);
    ui.finish();
  }

  function recovery() {
    show();

    const ui = render(
      'Recuperar acesso',
      'Digite o código de recuperação que foi fornecido ao criar o PIN.'
    );

    const input = ui.addInput('Código de recuperação');
    input.inputMode = 'text';
    input.maxLength = 32;
    input.autocapitalize = 'characters';

    const btn = ui.addButton('Verificar código', async () => {
      if (Date.now() < waitUntil) {
        ui.msg.textContent = 'Aguarde antes de tentar novamente.';
        return;
      }

      btn.disabled = true;

      try {
        const value = input.value.trim().toUpperCase();
        const hash = await digest(value, unb64(cfg.salt));

        if (hash === cfg.recoveryHash) {
          attempts = 0;
          waitUntil = 0;
          setup(true);
        } else {
          attempts++;
          ui.msg.textContent = 'Código incorreto.';

          if (attempts >= 5) {
            waitUntil = Date.now() + 30000;
            attempts = 0;
            ui.msg.textContent = 'Aguarde 30 segundos.';
          }
        }
      } catch (_) {
        ui.msg.textContent = 'Falha na verificação.';
      } finally {
        btn.disabled = false;
      }
    });

    ui.addButton('Voltar', lock, true);
    ui.finish();
  }

  function setup(isRecovery = false) {
    show();

    const ui = render(
      isRecovery ? 'Criar novo PIN' : 'Ativar proteção por PIN',
      'Escolha um PIN de 6 números. Você receberá um código de recuperação para guardar fora do aplicativo.'
    );

    const first = ui.addInput('Novo PIN');
    const second = ui.addInput('Confirme o PIN');

    const btn = ui.addButton('Continuar', async () => {
      if (!validPin(first.value) || first.value !== second.value) {
        ui.msg.textContent = 'Os dois PINs devem ter os mesmos 6 números.';
        return;
      }

      btn.disabled = true;

      try {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const recoveryCode = randomRecovery();

        const next = {
          version: 2,
          salt: b64(salt),
          pinHash: await digest(first.value, salt),
          recoveryHash: await digest(recoveryCode, salt)
        };

        const step = render(
          'Guarde seu código de recuperação',
          'Anote este código em um local seguro, fora do celular. Ele será necessário se você esquecer o PIN.'
        );

        const code = node('p', recoveryCode);
        code.style.cssText = 'overflow-wrap:anywhere;font-family:monospace;font-size:17px;font-weight:700;background:#eef4f0;padding:12px;border-radius:8px';
        panel.append(code);

        const acknowledge = document.createElement('input');
        acknowledge.type = 'checkbox';
        acknowledge.style.width = 'auto';

        const label = node('label', ' Guardei o código de recuperação em local seguro');
        label.prepend(acknowledge);
        panel.append(label);

        step.addButton('Concluir e ativar', () => {
          if (!acknowledge.checked) {
            step.msg.textContent = 'Confirme que guardou o código.';
            return;
          }

          try {
            localStorage.setItem(KEY, JSON.stringify(next));
            cfg = next;
            hide();
          } catch (_) {
            step.msg.textContent = 'Não foi possível salvar a configuração.';
          }
        });

        step.finish();
      } catch (_) {
        ui.msg.textContent = 'Erro ao preparar o PIN.';
        btn.disabled = false;
      }
    });

    ui.finish();
  }

  show();

  const lockBtn = node('button', '🔒 Bloquear agora');
  lockBtn.type = 'button';
  lockBtn.style.cssText = 'display:block;width:calc(100% - 32px);margin:0 16px 12px';

  const privacyBtn = document.getElementById('privacyToggle');

  if (privacyBtn) {
    privacyBtn.after(lockBtn);
  } else {
    document.querySelector('header')?.after(lockBtn);
  }

  lockBtn.addEventListener('click', () => {
    if (cfg) lock();
  });

  for (const evt of ['pointerdown', 'keydown', 'touchstart']) {
    document.addEventListener(evt, () => {
      if (unlocked && !document.hidden) {
        lastActivity = Date.now();
      }
    }, { passive: true });
  }

  
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && cfg && unlocked) {
    if (Date.now() - lastActivity >= IDLE_MS) {
      lock();
    }
  }
});


  
window.addEventListener('pageshow', () => {
  if (cfg && unlocked && Date.now() - lastActivity >= IDLE_MS) {
    lock();
  }
});


  window.setInterval(() => {
    if (cfg && unlocked && Date.now() - lastActivity >= IDLE_MS) {
      lock();
    }
  }, 1000);

  if (cfg) {
    lock();
  } else {
    setup();
  }
})();

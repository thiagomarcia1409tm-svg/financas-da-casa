/* Finanças da Casa — menu lateral recolhível */
(function () {
  'use strict';

  const tabs = document.getElementById('tabs');
  const header = document.querySelector('.wrap > header');

  if (!tabs || !header) return;

  const style = document.createElement('style');
  style.textContent = `
    #tabs {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: min(280px, 85vw);
      height: 100dvh;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      gap: 8px;
      padding: 76px 16px 24px;
      background: #fff;
      box-shadow: 4px 0 24px #0003;
      overflow-y: auto;
      transform: translateX(-110%);
      transition: transform .2s ease;
      visibility: hidden;
    }

    #tabs.menu-aberto {
      transform: translateX(0);
      visibility: visible;
    }

    #tabs button {
      width: 100%;
      text-align: left;
      flex-shrink: 0;
    }

    #abrirMenu {
      background: transparent;
      color: white;
      font-size: 25px;
      padding: 4px 10px 4px 0;
    }

    #fundoMenu {
      position: fixed;
      inset: 0;
      background: #0007;
      z-index: 999;
    }

    #fundoMenu[hidden] {
      display: none;
    }
  `;
  document.head.append(style);

  const abrir = document.createElement('button');
  abrir.id = 'abrirMenu';
  abrir.type = 'button';
  abrir.textContent = '☰';
  abrir.setAttribute('aria-label', 'Abrir menu');
  abrir.setAttribute('aria-expanded', 'false');
  abrir.setAttribute('aria-controls', 'tabs');

  header.insertBefore(abrir, header.firstChild);

  const fundo = document.createElement('div');
  fundo.id = 'fundoMenu';
  fundo.hidden = true;
  document.body.append(fundo);

  function fecharMenu() {
    tabs.classList.remove('menu-aberto');
    fundo.hidden = true;
    abrir.setAttribute('aria-expanded', 'false');
    abrir.setAttribute('aria-label', 'Abrir menu');
    tabs.setAttribute('aria-hidden', 'true');
  }

  function abrirMenu() {
    tabs.classList.add('menu-aberto');
    fundo.hidden = false;
    abrir.setAttribute('aria-expanded', 'true');
    abrir.setAttribute('aria-label', 'Fechar menu');
    tabs.removeAttribute('aria-hidden');
  }

  abrir.addEventListener('click', () => {
    if (tabs.classList.contains('menu-aberto')) {
      fecharMenu();
    } else {
      abrirMenu();
    }
  });

  fundo.addEventListener('click', fecharMenu);

  tabs.querySelectorAll('[data-tab]').forEach(botao => {
    botao.addEventListener('click', fecharMenu);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') fecharMenu();
  });

  fecharMenu();
})();



/* Finanças da Casa — ordenação de lançamentos */
(function () {
  'use strict';

  const lista = document.getElementById('lista');
  if (!lista) return;

  const painel = document.createElement('div');
  painel.style.cssText =
    'margin:12px 0;padding:12px;background:#f4f7f5;border-radius:12px';

  const titulo = document.createElement('label');
  titulo.htmlFor = 'ordenarLancamentos';
  titulo.textContent = 'Ordenar lançamentos por';

  const seletor = document.createElement('select');
  seletor.id = 'ordenarLancamentos';

  seletor.innerHTML = `
    <option value="data-recente">Data — mais recentes primeiro</option>
    <option value="data-antiga">Data — mais antigos primeiro</option>
    <option value="valor-maior">Valor — maior primeiro</option>
    <option value="valor-menor">Valor — menor primeiro</option>
    <option value="descricao">Descrição — ordem alfabética</option>
  `;

  painel.append(titulo, seletor);
  lista.before(painel);

  function ordenar() {
    const linhas = Array.from(lista.children).filter(
      elemento => elemento.classList.contains('item')
    );

    if (linhas.length < 2) return;

    const registros = new Map(
      state.entries.map(item => [String(item.id), item])
    );

    function obterRegistro(linha) {
      const botao = linha.querySelector('[data-toggle]');
      return botao
        ? registros.get(botao.dataset.toggle)
        : null;
    }

    const ordenadas = linhas.slice().sort((a, b) => {
      const primeiro = obterRegistro(a);
      const segundo = obterRegistro(b);

      if (!primeiro || !segundo) return 0;

      switch (seletor.value) {
        case 'data-antiga':
          return primeiro.date.localeCompare(segundo.date);

        case 'valor-maior':
          return segundo.amount - primeiro.amount;

        case 'valor-menor':
          return primeiro.amount - segundo.amount;

        case 'descricao':
          return String(primeiro.description).localeCompare(
            String(segundo.description),
            'pt-BR',
            { sensitivity: 'base' }
          );

        default:
          return segundo.date.localeCompare(primeiro.date);
      }
    });

    const mudou = ordenadas.some(
      (linha, indice) => linha !== linhas[indice]
    );

    if (!mudou) return;

    const fragmento = document.createDocumentFragment();

    ordenadas.forEach(linha => {
      fragmento.appendChild(linha);
    });

    lista.appendChild(fragmento);
  }

  seletor.addEventListener('change', ordenar);

  new MutationObserver(ordenar).observe(lista, {
    childList: true
  });

  ordenar();
})();

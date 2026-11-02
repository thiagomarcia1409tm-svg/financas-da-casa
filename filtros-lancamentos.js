/* Finanças da Casa — pesquisa e filtros de lançamentos */
(function () {
  'use strict';

  const lista = document.getElementById('lista');
  if (!lista) return;

  const painel = document.createElement('div');
  painel.id = 'filtrosLancamentos';
  painel.style.cssText = 'margin:14px 0;padding:14px;background:#f4f7f5;border-radius:12px';

  painel.innerHTML = `
    <label for="pesquisaLancamentos">Pesquisar lançamento</label>
    <input
      id="pesquisaLancamentos"
      type="search"
      placeholder="Ex.: mercado, salário, luz"
      autocomplete="off"
    >

    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">
      <div>
        <label for="filtroTipo">Tipo</label>
        <select id="filtroTipo">
          <option value="">Todos</option>
          <option value="receita">Receitas</option>
          <option value="despesa">Despesas</option>
        </select>
      </div>

      <div>
        <label for="filtroSituacao">Situação</label>
        <select id="filtroSituacao">
          <option value="">Todas</option>
          <option value="realizado">Realizadas</option>
          <option value="previsto">Pendentes</option>
        </select>
      </div>
    </div>

    <p id="resumoFiltros" class="muted" aria-live="polite"></p>
  `;

  lista.before(painel);

  const pesquisa = document.getElementById('pesquisaLancamentos');
  const tipo = document.getElementById('filtroTipo');
  const situacao = document.getElementById('filtroSituacao');
  const resumo = document.getElementById('resumoFiltros');

  function normalizar(texto) {
    return String(texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function aplicarFiltros() {
    const termo = normalizar(pesquisa.value.trim());
    const linhas = lista.querySelectorAll('.item');
    let encontrados = 0;

    linhas.forEach(linha => {
      const botao = linha.querySelector('[data-toggle]');
      const id = botao ? botao.dataset.toggle : '';

      const registro = state.entries.find(
        item => String(item.id) === id
      );

      if (!registro) return;

      const texto = normalizar(
        registro.description + ' ' + registro.category
      );

      const corresponde =
        (!termo || texto.includes(termo)) &&
        (!tipo.value || registro.type === tipo.value) &&
        (!situacao.value || registro.status === situacao.value);

      linha.hidden = !corresponde;

      if (corresponde) encontrados++;
    });

    resumo.textContent =
      encontrados + ' de ' + linhas.length + ' lançamentos exibidos.';
  }

  pesquisa.addEventListener('input', aplicarFiltros);
  tipo.addEventListener('change', aplicarFiltros);
  situacao.addEventListener('change', aplicarFiltros);

  new MutationObserver(aplicarFiltros).observe(lista, {
    childList: true,
    subtree: true
  });

  aplicarFiltros();
})();

/* Finanças da Casa — restauração com proteção */
(function () {
  'use strict';

  const STORAGE_KEY = 'financasCasaV1';
  const input = document.getElementById('import');

  if (!input) {
    console.warn('Campo de importação não encontrado.');
    return;
  }

  function baixarBackup(dados) {
    const conteudo = JSON.stringify(dados, null, 2);
    const blob = new Blob([conteudo], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const data = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, '-');

    link.href = url;
    link.download =
      'financas-da-casa-antes-restauracao-' +
      data + '.json';

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  function validar(dados) {
    if (
      !dados ||
      typeof dados !== 'object' ||
      Array.isArray(dados)
    ) {
      throw new Error('Arquivo inválido.');
    }

    if (typeof dados.family !== 'string') {
      throw new Error('Nome da família inválido.');
    }

    if (!Array.isArray(dados.entries)) {
      throw new Error('Lista de lançamentos inválida.');
    }

    if (
      !dados.budgets ||
      typeof dados.budgets !== 'object' ||
      Array.isArray(dados.budgets)
    ) {
      throw new Error('Orçamentos inválidos.');
    }

    if (
      !dados.reserve ||
      typeof dados.reserve !== 'object' ||
      Array.isArray(dados.reserve)
    ) {
      throw new Error('Reserva inválida.');
    }

    if (
      dados.recurring !== undefined &&
      !Array.isArray(dados.recurring)
    ) {
      throw new Error('Contas fixas inválidas.');
    }

    for (const valor of Object.values(dados.budgets)) {
      if (
        typeof valor !== 'number' ||
        !Number.isFinite(valor) ||
        valor < 0
      ) {
        throw new Error('Valor de orçamento inválido.');
      }
    }

    for (const item of dados.entries) {
      if (
        !item ||
        typeof item !== 'object' ||
        Array.isArray(item)
      ) {
        throw new Error('Lançamento inválido.');
      }
    }

    return true;
  }

  input.onchange = async function (event) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) return;

    try {
      if (arquivo.size > 5 * 1024 * 1024) {
        throw new Error('Arquivo maior que 5 MB.');
      }

      const dados = JSON.parse(await arquivo.text());
      validar(dados);

      const atual = localStorage.getItem(STORAGE_KEY);

      if (atual === null) {
        throw new Error(
          'Dados atuais não encontrados. ' +
          'A restauração foi cancelada.'
        );
      }

      const dadosAtuais = JSON.parse(atual);
      validar(dadosAtuais);

      const continuar = confirm(
        'O backup selecionado substituirá os ' +
        'dados financeiros atuais. Deseja continuar?'
      );

      if (!continuar) return;

      baixarBackup(dadosAtuais);

      const confirmar = confirm(
        'Uma cópia dos dados atuais foi enviada ' +
        'para download. Confirme que conseguiu ' +
        'salvá-la antes de continuar.\n\n' +
        'OK: restaurar o arquivo selecionado.\n' +
        'Cancelar: manter os dados atuais.'
      );

      if (!confirmar) return;

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(dados)
      );

      alert(
        'Backup restaurado. O aplicativo será ' +
        'recarregado para atualizar os valores.'
      );

      location.reload();

    } catch (erro) {
      alert(
        'Restauração cancelada: ' + erro.message
      );
    } finally {
      input.value = '';
    }
  };
})();

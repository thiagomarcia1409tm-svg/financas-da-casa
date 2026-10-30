
/* Finanças da Casa — backup com compartilhamento */
(function () {
  'use strict';

  const STORAGE_KEY = 'financasCasaV1';
  const botaoExportar = document.getElementById('export');

  if (!botaoExportar) return;

  const botao = document.createElement('button');
  botao.id = 'backupDrive';
  botao.type = 'button';
  botao.textContent = 'Fazer backup agora';
  botao.classList.add('primary');
  botao.style.marginLeft = '8px';

  botaoExportar.insertAdjacentElement('afterend', botao);

  function baixarArquivo(arquivo) {
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement('a');

    link.href = url;
    link.download = arquivo.name;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  botao.addEventListener('click', async () => {
    let dados;

    try {
      const conteudo = localStorage.getItem(STORAGE_KEY);

      if (!conteudo) {
        alert('Nenhum dado encontrado para backup.');
        return;
      }

      dados = JSON.parse(conteudo);

      if (!dados || !Array.isArray(dados.entries)) {
        throw new Error('Dados financeiros inválidos.');
      }
    } catch (erro) {
      alert('Erro ao preparar backup: ' + erro.message);
      return;
    }

    const data = new Date().toISOString().slice(0, 10);
    const nome = 'financas-da-casa-backup-' + data + '.json';

    const arquivo = new File(
      [JSON.stringify(dados, null, 2)],
      nome,
      { type: 'application/json' }
    );

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [arquivo] })
    ) {
      try {
        await navigator.share({
          files: [arquivo],
          title: 'Backup Finanças da Casa'
        });
        return;
      } catch (erro) {
        if (erro.name === 'AbortError') return;
      }
    }

    baixarArquivo(arquivo);

    alert(
      'Backup preparado e enviado para download. ' +
      'Você pode salvá-lo no Google Drive.'
    );
  });
})();


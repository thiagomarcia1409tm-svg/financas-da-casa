
/* Finanças da Casa — download e compartilhamento */
(function () {
  'use strict';

  const KEY = 'financasCasaV1';
  const exportar = document.getElementById('export');

  if (!exportar) return;

  function prepararArquivo() {
    const texto = localStorage.getItem(KEY);

    if (!texto) {
      throw new Error('Nenhum dado encontrado.');
    }

    const dados = JSON.parse(texto);

    if (!dados || !Array.isArray(dados.entries)) {
      throw new Error('Dados financeiros inválidos.');
    }

    const hoje = new Date();
    const data = [
      hoje.getFullYear(),
      String(hoje.getMonth() + 1).padStart(2, '0'),
      String(hoje.getDate()).padStart(2, '0')
    ].join('-');

    return new File(
      [JSON.stringify(dados, null, 2)],
      'financas-da-casa-backup-' + data + '.json',
      { type: 'application/json' }
    );
  }

  function criarBotao(id, titulo) {
    const botao = document.createElement('button');
    botao.id = id;
    botao.type = 'button';
    botao.textContent = titulo;
    botao.style.margin = '8px 8px 0 0';
    exportar.insertAdjacentElement('afterend', botao);
    return botao;
  }

  function baixar(arquivo) {
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement('a');

    link.href = url;
    link.download = arquivo.name;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  const compartilhar = criarBotao(
    'compartilharBackup',
    'Compartilhar backup'
  );

  const baixarAgora = criarBotao(
    'backupDrive',
    'Fazer backup agora'
  );

  baixarAgora.classList.add('primary');

  baixarAgora.addEventListener('click', () => {
    try {
      baixar(prepararArquivo());
      alert(
        'Download solicitado. Confira se o arquivo ' +
        'foi realmente salvo no celular.'
      );
    } catch (erro) {
      alert('Erro ao preparar backup: ' + erro.message);
    }
  });

  
  compartilhar.addEventListener('click', async () => {
    let arquivo;

    try {
      arquivo = prepararArquivo();
    } catch (erro) {
      alert('Erro ao preparar backup: ' + erro.message);
      return;
    }

    if (typeof window.showSaveFilePicker !== 'function') {
      alert(
        'O seletor de destino não está disponível ' +
        'neste aplicativo. Use Fazer backup agora ' +
        'e envie o arquivo pelo aplicativo Google Drive.'
      );
      return;
    }

    try {
      const destino = await window.showSaveFilePicker({
        suggestedName: arquivo.name,
        types: [{
          description: 'Arquivo de backup JSON',
          accept: { 'application/json': ['.json'] }
        }]
      });

const gravacao = await destino.createWritable();
await gravacao.write(arquivo);
await gravacao.close();

const agora = new Date();
const dataBackup = [
  agora.getFullYear(),
  String(agora.getMonth() + 1).padStart(2, '0'),
  String(agora.getDate()).padStart(2, '0')
].join('-');

localStorage.setItem(
  'financasCasaUltimoBackup',
  dataBackup
);

alert('Backup salvo! O lembrete diário foi atualizado.');


      alert('Arquivo salvo no destino escolhido.');
    } catch (erro) {
      if (erro.name === 'AbortError') return;

      alert(
        'Não foi possível salvar o arquivo: ' +
        erro.message
      );
    }
  });
})();



/* Finanças da Casa — download e compartilhamento */
(function () {
  'use strict';

  const KEY = 'financasCasaV1';
  const exportar = document.getElementById('export');

  if (!exportar) return;
  
function verificarLembreteBackup() {
  const hoje = new Date();
  const dataHoje = [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, '0'),
    String(hoje.getDate()).padStart(2, '0')
  ].join('-');

  const ultimoBackup = localStorage.getItem(
    'financasCasaUltimoBackup'
  );

  const ultimoAviso = sessionStorage.getItem(
    'financasCasaAvisoBackup'
  );

  if (ultimoBackup === dataHoje || ultimoAviso === dataHoje) {
    return;
  }

  sessionStorage.setItem(
    'financasCasaAvisoBackup',
    dataHoje
  );

  
setTimeout(() => {
  if (document.getElementById('securityOverlay')) {
    sessionStorage.removeItem('financasCasaAvisoBackup');
    return;
  }

  const fazerBackup = confirm(

      'Você ainda não registrou um backup hoje.\n\n' +
      'Deseja salvar seus dados no Google Drive agora?'
    );

    if (fazerBackup) {
      document.getElementById('compartilharBackup')?.click();
    }
  }, 3000);
}

window.addEventListener('load', verificarLembreteBackup);
  

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
  
  // Painel de backup na aba Família
  const painel = document.createElement('div');
  painel.id = 'painelBackup';
  painel.style.cssText =
    'margin:16px 0;padding:16px;border:1px solid #ccc;' +
    'border-radius:12px;';

  const tituloPainel = document.createElement('h3');
  tituloPainel.textContent = 'Segurança dos backups';

  const statusBackup = document.createElement('p');
  statusBackup.id = 'statusBackup';

  function atualizarStatusBackup() {
    const data = localStorage.getItem('financasCasaUltimoBackup');

    if (!data) {
      statusBackup.textContent = 'Nenhum backup registrado ainda.';
      return;
    }

    const partes = data.split('-');
    statusBackup.textContent =
      'Último backup registrado: ' +
      partes[2] + '/' + partes[1] + '/' + partes[0];
  }

  const botaoPainel = document.createElement('button');
  botaoPainel.type = 'button';
  botaoPainel.textContent = 'Salvar backup no Drive';
  botaoPainel.classList.add('primary');

  botaoPainel.addEventListener('click', () => {
    compartilhar.click();
  });

  painel.append(tituloPainel, statusBackup, botaoPainel);
  exportar.parentElement.appendChild(painel);

  atualizarStatusBackup();
  

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


    } catch (erro) {
      if (erro.name === 'AbortError') return;

      alert(
        'Não foi possível salvar o arquivo: ' +
        erro.message
      );
    }
  });
})();



/* Finanças da Casa — edição de lançamentos */
(function () {
  'use strict';

  const form = document.getElementById('entryForm');
  const lista = document.getElementById('lista');

  if (!form || !lista) return;

  const titulo = form.closest('.card').querySelector('h2');
  const salvar = form.querySelector('button.primary');
  const campo = id => document.getElementById(id);

  let editandoId = null;

  const cancelar = document.createElement('button');
  cancelar.type = 'button';
  cancelar.textContent = 'Cancelar edição';
  cancelar.hidden = true;
  cancelar.style.background = '#e7efeb';
  form.append(cancelar);

  function sairDaEdicao() {
    editandoId = null;
    form.reset();

    const hoje = new Date();
    campo('data').value = [
      hoje.getFullYear(),
      String(hoje.getMonth() + 1).padStart(2, '0'),
      String(hoje.getDate()).padStart(2, '0')
    ].join('-');

    titulo.textContent = 'Novo lançamento';
    salvar.textContent = 'Salvar lançamento';
    cancelar.hidden = true;
  }

  function editar(id) {
    const registro = state.entries.find(
      item => String(item.id) === id
    );

    if (!registro) return;

    editandoId = id;

    campo('tipo').value = registro.type;
    campo('descricao').value = registro.description;
    campo('valor').value = registro.amount;
    campo('categoria').value = registro.category;
    campo('data').value = registro.date;
    campo('situacao').value = registro.status;

    titulo.textContent = 'Editar lançamento';
    salvar.textContent = 'Salvar alterações';
    cancelar.hidden = false;

    form.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  function adicionarBotoes() {
    lista.querySelectorAll('button[data-toggle]').forEach(botao => {
      const area = botao.parentElement;

      if (area.querySelector('[data-edit]')) return;

      const editarBotao = document.createElement('button');
      editarBotao.type = 'button';
      editarBotao.textContent = 'Editar';
      editarBotao.dataset.edit = botao.dataset.toggle;

      area.style.flexWrap = 'wrap';
      area.insertBefore(editarBotao, botao);
    });
  }

  lista.addEventListener('click', evento => {
    const botao = evento.target.closest('button[data-edit]');
    if (!botao) return;

    editar(botao.dataset.edit);
  });

  new MutationObserver(adicionarBotoes).observe(lista, {
    childList: true,
    subtree: true
  });

  adicionarBotoes();

  form.addEventListener('submit', evento => {
    if (editandoId === null) return;

    evento.preventDefault();
    evento.stopImmediatePropagation();

    const indice = state.entries.findIndex(
      item => String(item.id) === editandoId
    );

    if (indice < 0) {
      alert('Lançamento não encontrado.');
      sairDaEdicao();
      return;
    }

    const valor = Number(campo('valor').value);
    const descricao = campo('descricao').value.trim();

    if (!Number.isFinite(valor) || valor <= 0 ||
        !descricao || !campo('data').value) {
      alert('Confira a descrição, o valor e a data.');
      return;
    }

    Object.assign(state.entries[indice], {
      type: campo('tipo').value,
      description: descricao,
      amount: valor,
      category: campo('categoria').value,
      date: campo('data').value,
      status: campo('situacao').value
    });

    sairDaEdicao();
    save();

    alert('Lançamento atualizado com sucesso!');
  }, true);

  cancelar.addEventListener('click', sairDaEdicao);
})();

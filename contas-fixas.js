(function () {
  const KEY = 'financasCasaV1';
  const get = id => document.getElementById(id);
  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch { return {}; }
  };
  const write = data => localStorage.setItem(KEY, JSON.stringify(data));
  const money = n => Number(n).toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL'
  });

  const section = get('familia');
  if (!section || !get('month')) return;

  const panel = document.createElement('div');
  panel.className = 'card';
  panel.innerHTML = `
    <h3>📅 Contas fixas mensais</h3>
    <p class="muted">Cadastre contas que se repetem todo mês.</p>
    <form id="recForm">
      <label>Descrição</label>
      <input id="recName" required placeholder="Ex.: Internet">
      <label>Valor mensal (R$)</label>
      <input id="recValue" type="number" min="0.01"
             step="0.01" required>
      <label>Dia do vencimento</label>
      <input id="recDay" type="number" min="1" max="31"
             value="10" required>
      <label>Categoria</label>
      <select id="recCategory"></select>
      <button class="primary">Cadastrar conta fixa</button>
    </form>
    <div id="recList"></div>
  `;
  section.prepend(panel);

  function update() {
    const data = read();
    data.entries ||= [];
    data.recurring ||= [];

    const selectedMonth = get('month').value;
    const categories = Object.keys(data.budgets || {Outros: 0});
    const category = get('recCategory');
    const current = category.value;
    category.replaceChildren();

    for (const name of categories) {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      category.append(option);
    }
    if (categories.includes(current)) category.value = current;

    let changed = false;

    for (const recurring of data.recurring) {
      if (!recurring.active || selectedMonth < recurring.start) continue;

      const id = `rec-${recurring.id}-${selectedMonth}`;
      if (data.entries.some(entry => entry.id === id)) continue;

      const [year, month] = selectedMonth.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      const day = Math.min(recurring.day, lastDay);

      data.entries.push({
        id,
        type: 'despesa',
        description: recurring.description,
        amount: recurring.amount,
        category: recurring.category,
        date: `${selectedMonth}-${String(day).padStart(2, '0')}`,
        status: 'previsto',
        recurringId: recurring.id
      });
      changed = true;
    }

    if (changed) {
  write(data);
  location.reload();
  return;
    }

    const list = get('recList');
    list.replaceChildren();

    for (const recurring of data.recurring) {
      const row = document.createElement('div');
      row.className = 'item';

      const label = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = recurring.description;
      const details = document.createElement('div');
      details.className = 'muted';
      details.textContent = `${money(recurring.amount)} • Dia ${recurring.day}` +
        (recurring.active ? '' : ' • Desativada');
      label.append(title, details);

      const button = document.createElement('button');
      button.textContent = recurring.active ? 'Desativar' : 'Ativar';
      button.onclick = () => {
        const latest = read();
        const item = (latest.recurring || [])
          .find(value => value.id === recurring.id);
        if (!item) return;
        item.active = !item.active;
        write(latest);
        update();
      };

      row.append(label, button);
      list.append(row);
    }
  }

  get('recForm').onsubmit = event => {
    event.preventDefault();
    const data = read();
    data.recurring ||= [];

    const description = get('recName').value.trim();
    const amount = Number(get('recValue').value);
    const day = Number(get('recDay').value);

    if (!description || amount <= 0 || day < 1 || day > 31) {
      alert('Confira os dados da conta.');
      return;
    }

    data.recurring.push({
      id: crypto.randomUUID(),
      description,
      amount,
      day,
      category: get('recCategory').value,
      start: get('month').value,
      active: true
    });

    write(data);
    event.target.reset();
    update();
    alert('Conta fixa cadastrada!');
  };

  get('month').addEventListener('change', update);
  update();
})();

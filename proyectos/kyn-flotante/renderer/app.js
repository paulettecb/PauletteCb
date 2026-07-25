(function () {
  const BOARD_KEY = 'kyn-flotante.board.v1';
  const JOURNAL_KEY = 'kyn-flotante.journal.v1';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------- Tabs ----------
  $$('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.tab-btn').forEach((b) => b.classList.remove('active'));
      $$('.tab-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      $(`#tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  // ---------- Lector: overlay de prueba ----------
  const overlayBtn = $('#overlay-toggle');
  const overlayStatus = $('#overlay-status');

  function paintOverlayState(active) {
    overlayBtn.textContent = active ? 'Apagar overlay de prueba' : 'Prender overlay de prueba';
    overlayStatus.textContent = active ? '🟢 activo' : '⚪ apagado';
  }

  window.kynFlotante.overlay.get().then(paintOverlayState);
  window.kynFlotante.overlay.onChange(paintOverlayState);
  overlayBtn.addEventListener('click', async () => {
    const current = overlayStatus.textContent.includes('activo');
    const next = await window.kynFlotante.overlay.toggle(!current);
    paintOverlayState(next);
  });

  // ---------- Board (Pendientes / Programados) ----------
  function loadBoard() {
    try { return JSON.parse(localStorage.getItem(BOARD_KEY)) || []; }
    catch { return []; }
  }
  function saveBoard(items) { localStorage.setItem(BOARD_KEY, JSON.stringify(items)); }

  function renderBoard() {
    const items = loadBoard();
    const pendientes = items.filter((i) => !i.date);
    const programados = items.filter((i) => i.date).sort((a, b) => a.date.localeCompare(b.date));

    const renderList = (list, container) => {
      container.innerHTML = '';
      if (!list.length) {
        container.innerHTML = '<li class="empty">nada por aquí todavía</li>';
        return;
      }
      list.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'board-card';
        li.innerHTML = `
          <span class="board-card-text">${escapeHtml(item.text)}</span>
          ${item.date ? `<span class="board-card-date">${formatDateTime(item.date)}</span>` : ''}
          <button class="board-card-del" title="Eliminar" data-id="${item.id}">✕</button>
        `;
        container.appendChild(li);
      });
    };

    renderList(pendientes, $('#board-pendientes'));
    renderList(programados, $('#board-programados'));

    $$('.board-card-del').forEach((btn) => {
      btn.addEventListener('click', () => {
        saveBoard(loadBoard().filter((i) => i.id !== btn.dataset.id));
        renderBoard();
      });
    });
  }

  $('#board-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const textInput = $('#board-text');
    const dateInput = $('#board-date');
    const text = textInput.value.trim();
    if (!text) return;
    const items = loadBoard();
    items.push({ id: randomId(), text, date: dateInput.value || null });
    saveBoard(items);
    textInput.value = '';
    dateInput.value = '';
    renderBoard();
  });

  renderBoard();

  // ---------- Journal ----------
  function loadJournal() {
    try { return JSON.parse(localStorage.getItem(JOURNAL_KEY)) || []; }
    catch { return []; }
  }
  function saveJournal(items) { localStorage.setItem(JOURNAL_KEY, JSON.stringify(items)); }

  function renderJournal() {
    const items = loadJournal().slice().reverse();
    const list = $('#journal-list');
    list.innerHTML = '';
    if (!items.length) {
      list.innerHTML = '<li class="empty">todavía no hay entradas</li>';
      return;
    }
    items.forEach((entry) => {
      const li = document.createElement('li');
      li.className = 'journal-entry';
      li.innerHTML = `
        <span class="journal-entry-date">${formatDateTime(entry.createdAt)}</span>
        <p class="journal-entry-text">${escapeHtml(entry.text)}</p>
      `;
      list.appendChild(li);
    });
  }

  $('#journal-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const textarea = $('#journal-text');
    const text = textarea.value.trim();
    if (!text) return;
    const items = loadJournal();
    items.push({ id: randomId(), text, createdAt: new Date().toISOString() });
    saveJournal(items);
    textarea.value = '';
    renderJournal();
  });

  $('#journal-export').addEventListener('click', async () => {
    const items = loadJournal();
    const text = items.map((e) => `[${formatDateTime(e.createdAt)}]\n${e.text}`).join('\n\n');
    await navigator.clipboard.writeText(text || '(journal vacío)');
    const status = $('#journal-export-status');
    status.textContent = '¡Copiado! Pégalo donde quieras.';
    setTimeout(() => { status.textContent = ''; }, 2500);
  });

  renderJournal();

  // ---------- Helpers ----------
  function randomId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  function formatDateTime(isoOrLocal) {
    const d = new Date(isoOrLocal);
    if (Number.isNaN(d.getTime())) return isoOrLocal;
    return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
})();

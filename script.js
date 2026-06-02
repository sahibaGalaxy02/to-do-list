    const KEY = 'todos-v1';
    const STREAK_KEY = 'todos-streak';

    /** @type {{id:string,text:string,done:boolean,created:number}[]} */
    let state = [];
    let filter = 'all';

    const $ = (q, el = document) => el.querySelector(q);
    const $$ = (q, el = document) => [...el.querySelectorAll(q)];

    function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

    function load() {
      try { state = JSON.parse(localStorage.getItem(KEY)) || []; } catch { state = []; }
      render();
      updateStreak();
    }

    function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

    // --------Streak (counts active days you added/edited tasks)
    
    function updateStreak(didAction = false) {
      const today = new Date(); today.setHours(0,0,0,0);
      let data = { last: today.getTime(), streak: 0 };
      try { data = JSON.parse(localStorage.getItem(STREAK_KEY)) || data; } catch {}
      const last = new Date(data.last); last.setHours(0,0,0,0);

      if (didAction) {
        const diffDays = Math.floor((today - last) / 86400000);
        data.streak = diffDays === 1 ? (data.streak + 1) : (diffDays > 1 ? 1 : (data.streak || 1));
        data.last = today.getTime();
        localStorage.setItem(STREAK_KEY, JSON.stringify(data));
      }
      const s = JSON.parse(localStorage.getItem(STREAK_KEY) || '{}');
      $('#streak').textContent = s.streak ? `Streak: ${s.streak} day${s.streak>1?'s':''}` : '';
    }

    // ---- Rendering ----
    function render() {
      const list = $('#list');
      list.innerHTML = '';
      const filtered = state.filter(t => filter === 'all' || (filter === 'active' ? !t.done : t.done));
      const empty = filtered.length === 0;
      $('#empty').style.display = empty ? 'block' : 'none';

      for (const t of filtered) {
        const li = document.createElement('li');
        li.className = 'todo' + (t.done ? ' done' : '');
        li.dataset.id = t.id;
        li.innerHTML = `
          <input type="checkbox" ${t.done ? 'checked' : ''} aria-label="Toggle done">
          <div class="text" role="textbox" tabindex="0" aria-label="Task text" title="Double‑click to edit">${escapeHTML(t.text)}</div>
          <button class="icon" aria-label="Delete task" title="Delete">🗑️</button>
        `;
        list.appendChild(li);
      }
      $('#count').textContent = `${state.length} item${state.length !== 1 ? 's' : ''}`;
      $$('.filter').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
      save();
    }

    function escapeHTML(str) { return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m])); }

    // ---- Actions ----
    function addTask(text) {
      const trimmed = (text || '').trim();
      if (!trimmed) return;
      state.unshift({ id: uid(), text: trimmed, done: false, created: Date.now() });
      render();
      updateStreak(true);
    }

    function toggleTask(id) {
      const t = state.find(x => x.id === id); if (!t) return; t.done = !t.done; render();
    }

    function deleteTask(id) { state = state.filter(t => t.id !== id); render(); }

    function clearCompleted() { state = state.filter(t => !t.done); render(); }

    function startInlineEdit(div) {
      const li = div.closest('li.todo'); if (!li) return;
      const id = li.dataset.id; const t = state.find(x => x.id === id); if (!t) return;
      const input = document.createElement('input');
      input.type = 'text'; input.value = t.text; input.className = 'text'; input.setAttribute('aria-label','Edit task');
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { t.text = input.value.trim() || t.text; render(); updateStreak(true); }
        if (e.key === 'Escape') { render(); }
      });
      input.addEventListener('blur', () => { t.text = input.value.trim() || t.text; render(); updateStreak(true); });
      li.replaceChild(input, div); input.focus(); input.select();
    }

    // ---- Events ----
    $('#add-btn').addEventListener('click', () => addTask($('#todo-input').value));
    $('#todo-input').addEventListener('keydown', e => { if (e.key === 'Enter') { addTask(e.target.value); e.target.value=''; }});

    $('#list').addEventListener('click', e => {
      const li = e.target.closest('li.todo'); if (!li) return;
      const id = li.dataset.id;
      if (e.target.matches('input[type="checkbox"]')) toggleTask(id);
      if (e.target.matches('button.icon')) deleteTask(id);
    });

    $('#list').addEventListener('dblclick', e => { const div = e.target.closest('.text'); if (div) startInlineEdit(div); });

    $$('.filter').forEach(btn => btn.addEventListener('click', () => { filter = btn.dataset.filter; render(); }));
    $('#clear-completed').addEventListener('click', clearCompleted);
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') { e.preventDefault(); $('#todo-input').focus(); }
      if (e.key === 'Delete') { const li = document.activeElement?.closest?.('li.todo'); if (li) deleteTask(li.dataset.id); }
    });

    load();
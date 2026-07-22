/* ==========================================================================
   ARC Guide V3 — script.js
   Vanilla ES6+, no dependencies.
   Sections: Utils -> Data loading -> Renderers -> Interactions -> Init
   ========================================================================== */

(() => {
  'use strict';

  /* ------------------------------- Utils ---------------------------------- */

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const STORAGE_KEY = 'arcGuide.onboarding.v1';

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.warn('ARC Guide: gagal membaca localStorage', err);
      return {};
    }
  }

  function saveProgress(progress) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (err) {
      console.warn('ARC Guide: gagal menyimpan localStorage', err);
    }
  }

  /** Fetch JSON with a simple error wrapper. Returns { ok, data, error }. */
  async function fetchJSON(path) {
    try {
      const res = await fetch(path, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { ok: true, data };
    } catch (err) {
      console.error(`ARC Guide: gagal memuat ${path}`, err);
      return { ok: false, error: err };
    }
  }

  function renderSkeleton(container, count = 3) {
    container.innerHTML = Array.from({ length: count }).map(() => (
      '<div class="skeleton skeleton-card"></div>'
    )).join('');
  }

  function renderError(container, message, onRetry) {
    container.innerHTML = `
      <div class="error-box">
        <p>${message}</p>
        <button class="btn btn-secondary" type="button" data-retry>Coba lagi</button>
      </div>`;
    const btn = container.querySelector('[data-retry]');
    if (btn && onRetry) btn.addEventListener('click', onRetry, { once: true });
  }

  function escapeHTML(str = '') {
    return str.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  const ICONS = {
    music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    waveform: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h2l2-7 3 16 3-13 2 8 2-4h4"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M17 5h3a2 2 0 0 1-2 4h-1M7 5H4a2 2 0 0 0 2 4h1"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9a2 2 0 0 0 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3Z"/><path d="M13 5v14" stroke-dasharray="3 3"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  };

  /* --------------------------------- App state ------------------------------ */

  const store = {
    onboarding: null,
    bots: null,
    channels: null,
    faq: null,
    events: null,
    staff: null,
  };

  /* --------------------------------- Hero bubbles ---------------------------- */

  function spawnBubbles() {
    const holder = $('#heroBubbles');
    if (!holder || prefersReducedMotion) return;
    const count = window.innerWidth < 640 ? 10 : 18;
    for (let i = 0; i < count; i += 1) {
      const b = document.createElement('span');
      const size = 4 + Math.random() * 12;
      b.className = 'bubble';
      b.style.width = `${size}px`;
      b.style.height = `${size}px`;
      b.style.left = `${Math.random() * 100}%`;
      b.style.setProperty('--drift', `${(Math.random() - 0.5) * 60}px`);
      b.style.animationDuration = `${8 + Math.random() * 10}s`;
      b.style.animationDelay = `${Math.random() * 10}s`;
      holder.appendChild(b);
    }
  }

  /* --------------------------------- Checklist / progress -------------------- */

  function renderChecklist(steps) {
    const list = $('#homeChecklist');
    const progress = loadProgress();
    const previewSteps = steps.slice(0, 4);

    list.innerHTML = previewSteps.map((step) => {
      const done = !!progress[step.id];
      return `
        <li class="checklist-item ${done ? 'done' : ''}" data-step-id="${step.id}" role="button" tabindex="0" aria-pressed="${done}">
          <span class="check-circle">${ICONS.check}</span>
          <span class="check-text">
            <span class="check-title">${escapeHTML(step.title)}</span>
            <p class="check-sub">${escapeHTML(step.short)}</p>
          </span>
        </li>`;
    }).join('');

    updateProgressBar(steps);

    $$('.checklist-item', list).forEach((item) => {
      const toggle = () => toggleStep(item.dataset.stepId, steps);
      item.addEventListener('click', toggle);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
  }

  function toggleStep(stepId, allSteps) {
    const progress = loadProgress();
    progress[stepId] = !progress[stepId];
    saveProgress(progress);
    renderChecklist(allSteps);
    renderSteps(allSteps); // keep "Mulai di ARC" page in sync
  }

  function updateProgressBar(steps) {
    const progress = loadProgress();
    const doneCount = steps.filter((s) => progress[s.id]).length;
    const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
    $('#progressFill').style.width = `${pct}%`;
    $('#progressLabel').textContent = `${doneCount}/${steps.length} selesai`;
  }

  function renderSteps(steps) {
    const list = $('#stepsList');
    const progress = loadProgress();
    list.innerHTML = steps.map((step, i) => `
      <div class="step-card ${progress[step.id] ? 'done' : ''}">
        <span class="step-index">${progress[step.id] ? '&#10003;' : i + 1}</span>
        <div>
          <h3>${escapeHTML(step.title)}</h3>
          <p>${escapeHTML(step.description)}</p>
          ${step.channel ? `<span class="step-channel-tag">${escapeHTML(step.channel)}</span>` : ''}
        </div>
      </div>
    `).join('');
  }

  /* --------------------------------- Feature / bot cards ---------------------- */

  function renderHomeFeatures(bots) {
    const grid = $('#homeFeatureGrid');
    grid.innerHTML = bots.map((bot) => `
      <div class="card feature-card" data-bot-id="${bot.id}" role="button" tabindex="0">
        <div class="card-icon">${ICONS[bot.icon] || ''}</div>
        <h3>${escapeHTML(bot.name)}</h3>
        <p>${escapeHTML(bot.tagline)}</p>
      </div>
    `).join('');
    bindBotCardEvents(grid, bots);
  }

  function renderBotGrid(bots) {
    const grid = $('#botGrid');
    grid.innerHTML = bots.map((bot) => `
      <div class="card feature-card" data-bot-id="${bot.id}" role="button" tabindex="0">
        <div class="card-icon">${ICONS[bot.icon] || ''}</div>
        <h3>${escapeHTML(bot.name)}</h3>
        <p>${escapeHTML(bot.function)}</p>
        <span class="card-tag">Kapan pakai: ${escapeHTML(bot.whenToUse)}</span>
      </div>
    `).join('');
    bindBotCardEvents(grid, bots);
  }

  function bindBotCardEvents(container, bots) {
    $$('.feature-card', container).forEach((card) => {
      const open = () => openBotModal(bots.find((b) => b.id === card.dataset.botId));
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });
  }

  function openBotModal(bot) {
    if (!bot) return;
    $('#botModalTag').textContent = 'Fitur & Bot';
    $('#botModalTitle').textContent = bot.name;
    $('#botModalDesc').textContent = bot.function;
    $('#botModalSteps').innerHTML = bot.howTo.map((s, i) => `
      <div class="modal-step">
        <span class="step-num">${String(i + 1).padStart(2, '0')}</span>
        <div>
          <strong>${escapeHTML(s.step)}</strong>
          <p class="check-sub">${escapeHTML(s.detail)}</p>
        </div>
      </div>
    `).join('');
    $('#botModalExample').textContent = bot.example || '';
    const overlay = $('#botModal');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    $('#botModalClose').focus();
  }

  function closeBotModal() {
    $('#botModal').classList.remove('open');
    document.body.style.overflow = '';
  }

  /* --------------------------------- Events / countdown ----------------------- */

  function formatEventDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString('id-ID', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  }

  function eventCardHTML(ev) {
    return `
      <div class="event-card" data-event-date="${ev.date}">
        <div class="event-banner">
          <span class="event-game">${escapeHTML(ev.game)}</span>
          <h3>${escapeHTML(ev.name)}</h3>
        </div>
        <div class="event-body">
          <p>${escapeHTML(ev.description)}</p>
          <div class="event-meta">
            <div class="event-meta-item"><span>Hadiah</span>${escapeHTML(ev.prize)}</div>
            <div class="event-meta-item"><span>Host</span>${escapeHTML(ev.host)}</div>
            <div class="event-meta-item"><span>Jadwal</span>${formatEventDate(ev.date)}</div>
            <div class="event-meta-item"><span>Daftar di</span>${escapeHTML(ev.registrationChannel)}</div>
          </div>
          <div class="countdown" data-countdown="${ev.date}">
            <div class="countdown-unit"><strong data-unit="d">00</strong><span>Hari</span></div>
            <div class="countdown-unit"><strong data-unit="h">00</strong><span>Jam</span></div>
            <div class="countdown-unit"><strong data-unit="m">00</strong><span>Menit</span></div>
            <div class="countdown-unit"><strong data-unit="s">00</strong><span>Detik</span></div>
          </div>
          <a href="${ev.registrationChannel.startsWith('#') ? '#event' : ev.registrationChannel}" class="btn btn-primary">Daftar Sekarang</a>
        </div>
      </div>`;
  }

  function renderEvents(events) {
    $('#eventPreviewList').innerHTML = events.slice(0, 2).map(eventCardHTML).join('');
    $('#eventFullList').innerHTML = events.map(eventCardHTML).join('');
    tickCountdowns();
  }

  let countdownTimer = null;
  function tickCountdowns() {
    if (countdownTimer) clearInterval(countdownTimer);
    const update = () => {
      $$('[data-countdown]').forEach((el) => {
        const target = new Date(el.dataset.countdown).getTime();
        const now = Date.now();
        let diff = Math.max(0, target - now);
        const d = Math.floor(diff / 86400000); diff -= d * 86400000;
        const h = Math.floor(diff / 3600000); diff -= h * 3600000;
        const m = Math.floor(diff / 60000); diff -= m * 60000;
        const s = Math.floor(diff / 1000);
        el.querySelector('[data-unit="d"]').textContent = String(d).padStart(2, '0');
        el.querySelector('[data-unit="h"]').textContent = String(h).padStart(2, '0');
        el.querySelector('[data-unit="m"]').textContent = String(m).padStart(2, '0');
        el.querySelector('[data-unit="s"]').textContent = String(s).padStart(2, '0');
      });
    };
    update();
    countdownTimer = setInterval(update, 1000);
  }

  /* --------------------------------- Rules / channels -------------------------- */

  function renderRules(rules) {
    $('#rulesList').innerHTML = rules.map((rule, i) => `
      <div class="rule-item">
        <span class="rule-num">${String(i + 1).padStart(2, '0')}</span>
        <p style="margin:0">${escapeHTML(rule)}</p>
      </div>
    `).join('');
  }

  function renderChannels(categories) {
    $('#channelsList').innerHTML = categories.map((cat) => `
      <div class="channel-group">
        <div class="channel-group-title">${escapeHTML(cat.name)}</div>
        ${cat.channels.map((ch) => `
          <div class="channel-item">
            <span class="channel-name">${escapeHTML(ch.name)}</span>
            <span class="channel-desc">${escapeHTML(ch.description)}</span>
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  /* --------------------------------- FAQ --------------------------------- */

  function renderFAQ(items) {
    const list = $('#faqList');
    const noResults = $('#faqNoResults');

    function draw(filtered) {
      noResults.hidden = filtered.length > 0;
      list.innerHTML = filtered.map((item) => `
        <div class="accordion-item" data-faq-id="${item.id}">
          <button class="accordion-trigger" aria-expanded="false">
            <span>${escapeHTML(item.question)}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div class="accordion-panel">
            <div class="accordion-panel-inner"><p style="margin:0">${escapeHTML(item.answer)}</p></div>
          </div>
        </div>
      `).join('');

      $$('.accordion-trigger', list).forEach((trigger) => {
        trigger.addEventListener('click', () => {
          const itemEl = trigger.closest('.accordion-item');
          const panel = itemEl.querySelector('.accordion-panel');
          const isOpen = itemEl.classList.contains('open');
          // close siblings for a cleaner single-open accordion
          $$('.accordion-item.open', list).forEach((openItem) => {
            if (openItem !== itemEl) {
              openItem.classList.remove('open');
              openItem.querySelector('.accordion-panel').style.maxHeight = '';
              openItem.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
            }
          });
          itemEl.classList.toggle('open', !isOpen);
          trigger.setAttribute('aria-expanded', String(!isOpen));
          panel.style.maxHeight = isOpen ? '' : `${panel.scrollHeight}px`;
        });
      });
    }

    draw(items);

    const input = $('#faqSearchInput');
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      const filtered = !q ? items : items.filter((it) =>
        it.question.toLowerCase().includes(q) || it.answer.toLowerCase().includes(q));
      draw(filtered);
    });
  }

  /* --------------------------------- Staff --------------------------------- */

  function renderStaff(staffList) {
    const groups = [
      { key: 'owner', label: 'Owner' },
      { key: 'admin', label: 'Admin' },
      { key: 'moderator', label: 'Moderator' },
    ];
    const container = $('#staffGroups');
    container.innerHTML = groups.map((group) => {
      const members = staffList.filter((s) => s.roleGroup === group.key);
      if (!members.length) return '';
      return `
        <div class="staff-group">
          <div class="staff-group-title">${group.label}</div>
          <div class="grid grid-2 staff-grid">
            ${members.map((m) => `
              <div class="staff-card">
                <img src="${m.avatar}" alt="" loading="lazy" width="56" height="56">
                <div>
                  <div class="staff-role">${escapeHTML(m.role)}</div>
                  <strong>${escapeHTML(m.name)}</strong>
                  <p>${escapeHTML(m.description)}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>`;
    }).join('');
  }

  /* --------------------------------- Global search ---------------------------- */

  function buildSearchIndex() {
    const idx = [];
    (store.faq || []).forEach((f) => idx.push({ type: 'FAQ', title: f.question, target: '#faq' }));
    (store.bots || []).forEach((b) => idx.push({ type: 'Fitur & Bot', title: b.name, target: '#fitur' }));
    (store.staff || []).forEach((s) => idx.push({ type: 'Staff', title: s.name, target: '#staff' }));
    (store.events || []).forEach((e) => idx.push({ type: 'Event', title: e.name, target: '#event' }));
    if (store.channels) {
      store.channels.categories.forEach((cat) => cat.channels.forEach((ch) => {
        idx.push({ type: 'Channel', title: `${ch.name} — ${cat.name}`, target: '#panduan' });
      }));
    }
    return idx;
  }

  function initGlobalSearch() {
    const overlay = $('#globalSearchOverlay');
    const input = $('#globalSearchInput');
    const results = $('#globalSearchResults');

    function open() {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      input.value = '';
      results.innerHTML = '';
      setTimeout(() => input.focus(), 50);
    }
    function close() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    $('#searchOpenBtn').addEventListener('click', open);
    $('#globalSearchCloseBtn').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { results.innerHTML = ''; return; }
      const idx = buildSearchIndex();
      const matches = idx.filter((item) => item.title.toLowerCase().includes(q)).slice(0, 20);
      results.innerHTML = matches.length ? matches.map((m) => `
        <div class="global-search-result" data-target="${m.target}">
          <div class="result-type">${m.type}</div>
          <div>${escapeHTML(m.title)}</div>
        </div>
      `).join('') : '<p class="no-results">Tidak ditemukan.</p>';

      $$('.global-search-result', results).forEach((el) => {
        el.addEventListener('click', () => {
          close();
          document.querySelector(el.dataset.target)?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        });
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
  }

  /* --------------------------------- Scroll spy / reveal ----------------------- */

  function initScrollSpy() {
    const sections = $$('[data-section]');
    const navLinks = $$('[data-nav]');

    const setActive = (id) => {
      navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
      sections.forEach((s) => observer.observe(s));
    }
  }

  function initReveal() {
    const items = $$('.reveal');
    if (!items.length) return;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('in-view'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach((el) => observer.observe(el));
  }

  /* --------------------------------- Modal / misc bindings ---------------------- */

  function initModal() {
    $('#botModalClose').addEventListener('click', closeBotModal);
    $('#botModal').addEventListener('click', (e) => {
      if (e.target === $('#botModal')) closeBotModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && $('#botModal').classList.contains('open')) closeBotModal();
    });
  }

  /* --------------------------------- Section loaders ---------------------------- */

  async function loadOnboarding() {
    const homeList = $('#homeChecklist');
    renderSkeleton(homeList, 4);
    const { ok, data } = await fetchJSON('data/onboarding.json');
    if (!ok) {
      renderError(homeList, 'Gagal memuat checklist onboarding.', loadOnboarding);
      renderError($('#stepsList'), 'Gagal memuat langkah onboarding.', loadOnboarding);
      return;
    }
    store.onboarding = data.steps;
    renderChecklist(data.steps);
    renderSteps(data.steps);
  }

  async function loadBots() {
    renderSkeleton($('#homeFeatureGrid'), 4);
    renderSkeleton($('#botGrid'), 4);
    const { ok, data } = await fetchJSON('data/bots.json');
    if (!ok) {
      renderError($('#homeFeatureGrid'), 'Gagal memuat fitur.', loadBots);
      renderError($('#botGrid'), 'Gagal memuat daftar bot.', loadBots);
      return;
    }
    store.bots = data.bots;
    renderHomeFeatures(data.bots);
    renderBotGrid(data.bots);
  }

  async function loadChannels() {
    renderSkeleton($('#rulesList'), 3);
    renderSkeleton($('#channelsList'), 3);
    const { ok, data } = await fetchJSON('data/channels.json');
    if (!ok) {
      renderError($('#rulesList'), 'Gagal memuat rules.', loadChannels);
      renderError($('#channelsList'), 'Gagal memuat daftar channel.', loadChannels);
      return;
    }
    store.channels = data;
    renderRules(data.rules);
    renderChannels(data.categories);
  }

  async function loadFAQ() {
    renderSkeleton($('#faqList'), 4);
    const { ok, data } = await fetchJSON('data/faq.json');
    if (!ok) {
      renderError($('#faqList'), 'Gagal memuat FAQ.', loadFAQ);
      return;
    }
    store.faq = data.faq;
    renderFAQ(data.faq);
  }

  async function loadEvents() {
    renderSkeleton($('#eventPreviewList'), 2);
    renderSkeleton($('#eventFullList'), 2);
    const { ok, data } = await fetchJSON('data/events.json');
    if (!ok) {
      renderError($('#eventPreviewList'), 'Gagal memuat event.', loadEvents);
      renderError($('#eventFullList'), 'Gagal memuat event.', loadEvents);
      return;
    }
    store.events = data.events;
    if (data.schedule) $('#eventScheduleDesc').textContent = data.schedule;
    renderEvents(data.events);
  }

  async function loadStaff() {
    renderSkeleton($('#staffGroups'), 3);
    const { ok, data } = await fetchJSON('data/staff.json');
    if (!ok) {
      renderError($('#staffGroups'), 'Gagal memuat data staff.', loadStaff);
      return;
    }
    store.staff = data.staff;
    renderStaff(data.staff);
  }

  /* --------------------------------- Init --------------------------------- */

  function initStartNowScroll() {
    $('#startNowBtn')?.addEventListener('click', () => {
      // no-op beyond default anchor jump; kept for potential analytics hook
    });
  }

  async function init() {
    spawnBubbles();
    initModal();
    initGlobalSearch();
    initScrollSpy();
    initReveal();
    initStartNowScroll();

    await Promise.all([
      loadOnboarding(),
      loadBots(),
      loadChannels(),
      loadFAQ(),
      loadEvents(),
      loadStaff(),
    ]);

    // Re-run reveal in case content injected after initial observer pass
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

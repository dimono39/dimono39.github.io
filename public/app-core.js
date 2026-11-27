// ============================================================
// APP CORE — ЕДИНЫЙ КАРКАС ПРИЛОЖЕНИЯ (рекомендации 5.1–5.12)
// ============================================================
// 5.1  Дизайн-токены + компоненты (app-btn, app-card, app-modal, app-tabs)
// 5.2  Хлебные крошки
// 5.3  Горячие клавиши
// 5.4  Единый undo-менеджер
// 5.5  Онбординг-тур
// 5.6  Единые toast-уведомления
// 5.7  Тёмная тема
// 5.8  Локализация (использует messages.js)
// 5.9  PWA (manifest + service worker)
// 5.10 Логирование действий
// 5.11 Единое автосохранение сессии
// 5.12 Импорт/экспорт сессии (.fcmpo)
// ============================================================

(function () {
  'use strict';

  // Локальный ярлык к i18n
  var t = function (key, params) {
    if (window.AppI18n) {
      return params ? window.AppI18n.tf(key, params) : window.AppI18n.t(key);
    }
    return key;
  };

  // ============================================================
  // 5.1 — CSS-ТОКЕНЫ И КОМПОНЕНТЫ
  // ============================================================
  var APP_CSS = `
:root {
  --app-radius: 12px;
  --app-radius-sm: 8px;
  --app-radius-lg: 20px;
  --app-shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --app-shadow-md: 0 4px 14px rgba(0,0,0,0.10);
  --app-shadow-lg: 0 12px 40px rgba(0,0,0,0.16);
  --app-primary: #4f46e5;
  --app-primary-dark: #4338ca;
  --app-primary-light: #e0e7ff;
  --app-accent: #7c3aed;
  --app-bg: #f1f5f9;
  --app-surface: #ffffff;
  --app-surface-2: #f8fafc;
  --app-text: #0f172a;
  --app-text-muted: #64748b;
  --app-border: #e2e8f0;
  --app-success: #10b981;
  --app-warning: #f59e0b;
  --app-danger: #dc2626;
  --app-info: #3b82f6;
  --app-transition: 0.2s ease;
  --app-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

body.theme-dark {
  --app-bg: #0f172a;
  --app-surface: #1e293b;
  --app-surface-2: #334155;
  --app-text: #f1f5f9;
  --app-text-muted: #94a3b8;
  --app-border: #334155;
  --app-primary-light: #312e81;
  --app-shadow-sm: 0 1px 3px rgba(0,0,0,0.4);
  --app-shadow-md: 0 4px 14px rgba(0,0,0,0.5);
  --app-shadow-lg: 0 12px 40px rgba(0,0,0,0.6);
}

/* 5.1 — кнопка */
.app-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 18px; border: none; border-radius: var(--app-radius-sm);
  font-size: 0.85rem; font-weight: 600; font-family: var(--app-font);
  cursor: pointer; transition: all var(--app-transition);
  background: var(--app-primary); color: #fff; line-height: 1.2;
}
.app-btn:hover { background: var(--app-primary-dark); transform: translateY(-1px); box-shadow: var(--app-shadow-sm); }
.app-btn:active { transform: translateY(0); }
.app-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.app-btn.app-btn-secondary { background: var(--app-surface-2); color: var(--app-text); border: 1px solid var(--app-border); }
.app-btn.app-btn-secondary:hover { background: var(--app-border); }
.app-btn.app-btn-ghost { background: transparent; color: var(--app-text-muted); }
.app-btn.app-btn-ghost:hover { background: var(--app-surface-2); color: var(--app-text); }
.app-btn.app-btn-danger { background: var(--app-danger); }
.app-btn.app-btn-success { background: var(--app-success); }
.app-btn.app-btn-sm { padding: 4px 12px; font-size: 0.75rem; }

/* 5.1 — карточка */
.app-card {
  background: var(--app-surface); border-radius: var(--app-radius);
  box-shadow: var(--app-shadow-sm); border: 1px solid var(--app-border);
  padding: 20px; transition: box-shadow var(--app-transition);
}
.app-card:hover { box-shadow: var(--app-shadow-md); }
.app-card-title { font-size: 1.05rem; font-weight: 700; color: var(--app-text); margin: 0 0 12px; }

/* 5.1 — модальное окно */
.app-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px); z-index: 100000;
  display: flex; align-items: center; justify-content: center;
  animation: appFadeIn 0.18s ease;
}
.app-modal {
  background: var(--app-surface); border-radius: var(--app-radius-lg);
  box-shadow: var(--app-shadow-lg); max-width: 640px; width: 92%; max-height: 86vh;
  overflow-y: auto; padding: 28px; animation: appSlideUp 0.22s ease;
}
.app-modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.app-modal-title { font-size: 1.2rem; font-weight: 700; color: var(--app-text); margin: 0; }
.app-modal-close { background: none; border: none; font-size: 1.6rem; cursor: pointer; color: var(--app-text-muted); line-height: 1; padding: 4px; }
.app-modal-close:hover { color: var(--app-text); }
.app-modal-body { color: var(--app-text); }
.app-modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 22px; padding-top: 16px; border-top: 1px solid var(--app-border); }

@keyframes appFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes appSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
@keyframes appToastIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
@keyframes appToastOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(40px); } }

/* 5.1 — вкладки */
.app-tabs { display: flex; gap: 4px; border-bottom: 2px solid var(--app-border); margin-bottom: 18px; }
.app-tab { padding: 10px 20px; border: none; background: none; cursor: pointer;
  font-size: 0.85rem; font-weight: 600; color: var(--app-text-muted);
  border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all var(--app-transition); border-radius: var(--app-radius-sm) var(--app-radius-sm) 0 0; }
.app-tab:hover { color: var(--app-text); background: var(--app-surface-2); }
.app-tab.active { color: var(--app-primary); border-bottom-color: var(--app-primary); }

/* 5.6 — toast */
.app-toast-container { position: fixed; top: 16px; right: 16px; z-index: 100001; display: flex; flex-direction: column; gap: 10px; pointer-events: none; max-width: 380px; }
.app-toast {
  pointer-events: auto; display: flex; align-items: center; gap: 10px;
  padding: 12px 18px; border-radius: var(--app-radius); box-shadow: var(--app-shadow-md);
  font-size: 0.85rem; font-weight: 500; color: #fff; min-width: 240px;
  animation: appToastIn 0.25s ease; font-family: var(--app-font);
}
.app-toast.app-toast-success { background: var(--app-success); }
.app-toast.app-toast-error { background: var(--app-danger); }
.app-toast.app-toast-warning { background: var(--app-warning); }
.app-toast.app-toast-info { background: var(--app-info); }
.app-toast.removing { animation: appToastOut 0.25s ease forwards; }

/* 5.2 — хлебные крошки */
.app-breadcrumb-bar { display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  padding: 8px 16px; background: var(--app-surface-2); border-radius: var(--app-radius);
  border: 1px solid var(--app-border); margin-bottom: 14px; font-size: 0.8rem; }
.app-breadcrumb-item { color: var(--app-text-muted); font-weight: 500; display: inline-flex; align-items: center; gap: 4px; }
.app-breadcrumb-item.current { color: var(--app-primary); font-weight: 700; }
.app-breadcrumb-sep { color: var(--app-border); font-size: 0.7rem; }

/* 5.7 — переключатель темы */
.app-theme-toggle { display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
  padding: 6px 14px; border-radius: 40px; border: 1px solid var(--app-border);
  background: var(--app-surface); color: var(--app-text); font-size: 0.78rem; font-weight: 600;
  transition: all var(--app-transition); }
.app-theme-toggle:hover { box-shadow: var(--app-shadow-sm); border-color: var(--app-primary); }

/* 5.5 — тур */
.app-tour-overlay { position: fixed; inset: 0; z-index: 100002; pointer-events: none; }
.app-tour-highlight { position: absolute; border: 3px solid var(--app-primary); border-radius: var(--app-radius);
  box-shadow: 0 0 0 9999px rgba(0,0,0,0.55); transition: all 0.3s ease; pointer-events: none; z-index: 100003; }
.app-tour-popover { position: fixed; z-index: 100004; background: var(--app-surface); border-radius: var(--app-radius);
  box-shadow: var(--app-shadow-lg); padding: 22px; max-width: 360px; pointer-events: auto; animation: appSlideUp 0.25s ease; }
.app-tour-popover h3 { margin: 0 0 10px; font-size: 1.05rem; color: var(--app-text); }
.app-tour-popover p { margin: 0 0 18px; font-size: 0.85rem; color: var(--app-text-muted); line-height: 1.5; }
.app-tour-progress { display: flex; gap: 4px; margin-bottom: 12px; }
.app-tour-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--app-border); }
.app-tour-dot.active { background: var(--app-primary); }

/* 5.3 — диалог клавиш */
.app-keys-grid { display: grid; grid-template-columns: auto 1fr; gap: 8px 18px; font-size: 0.85rem; }
.app-keys-grid kbd { background: var(--app-surface-2); border: 1px solid var(--app-border); border-radius: 6px;
  padding: 3px 10px; font-weight: 700; color: var(--app-text); font-family: var(--app-font); white-space: nowrap; }
.app-keys-grid span { color: var(--app-text-muted); align-self: center; }

/* 5.10 — журнал */
.app-log-list { max-height: 360px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
.app-log-entry { display: flex; justify-content: space-between; gap: 12px; padding: 8px 12px; background: var(--app-surface-2); border-radius: var(--app-radius-sm); font-size: 0.8rem; }
.app-log-entry .app-log-time { color: var(--app-text-muted); white-space: nowrap; }

/* Утилитарная панель в шапке */
.app-utilities { display: inline-flex; align-items: center; gap: 8px; }
@media (max-width: 768px) { .app-utilities { flex-wrap: wrap; } .app-toast-container { left: 8px; right: 8px; max-width: none; } }
`;

  function injectCSS() {
    if (document.getElementById('app-core-css')) return;
    var style = document.createElement('style');
    style.id = 'app-core-css';
    style.textContent = APP_CSS;
    document.head.appendChild(style);
  }

  // ============================================================
  // 5.6 — ЕДИНЫЕ TOAST-УВЕДОМЛЕНИЯ
  // ============================================================
  var AppToast = (function () {
    var queue = [];
    var active = false;
    var MAX_VISIBLE = 2;          // одновременно на экране — не больше двух
    var DEDUPE_WINDOW = 6000;     // одинаковые сообщения чаще, чем раз в 6 c, не показываем
    var recent = {};

    function getContainer() {
      var c = document.getElementById('appToastContainer');
      if (!c) {
        c = document.createElement('div');
        c.id = 'appToastContainer';
        c.className = 'app-toast-container';
        document.body.appendChild(c);
      }
      return c;
    }

    // Одинаковые уведомления (например, «Меню #1 загружено» при каждой перерисовке)
    // не должны появляться пачками
    function _isDuplicate(msg) {
      var now = Date.now();
      var key = String(msg);
      var last = recent[key];
      if (last && now - last < DEDUPE_WINDOW) return true;
      recent[key] = now;
      // чистим устаревшие записи
      Object.keys(recent).forEach(function (k) {
        if (now - recent[k] > DEDUPE_WINDOW * 2) delete recent[k];
      });
      return false;
    }

    function show(msg, type, opts) {
      type = type || 'info';
      opts = opts || {};
      // backward-compat: обновляем #statusArea
      var sa = document.getElementById('statusArea');
      if (sa) {
        var icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
        sa.innerHTML = '<i class="fas ' + icon + '"></i> ' + msg;
        sa.className = 'status-message status-' + type;
        sa.style.display = 'flex';
        clearTimeout(sa._timeout);
        sa._timeout = setTimeout(function () { sa.style.display = 'none'; }, 5000);
      }
      if (_isDuplicate(msg)) return;
      var c = getContainer();
      if (c.children.length >= MAX_VISIBLE) {
        queue.push({ msg: msg, type: type, opts: opts });
        return;
      }
      _renderToast(c, msg, type, opts);
    }

    function _renderToast(c, msg, type, opts) {
      var icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
      var el = document.createElement('div');
      el.className = 'app-toast app-toast-' + type;
      el.innerHTML = '<i class="fas ' + icon + '"></i><span>' + _escape(msg) + '</span>';
      c.appendChild(el);
      var duration = opts.duration || (type === 'error' ? 6000 : 4000);
      var timer = setTimeout(function () { _remove(el); }, duration);
      el.addEventListener('click', function () { clearTimeout(timer); _remove(el); });
    }

    function _remove(el) {
      el.classList.add('removing');
      setTimeout(function () {
        el.remove();
        var c = document.getElementById('appToastContainer');
        if (c && queue.length && c.children.length < MAX_VISIBLE) {
          var next = queue.shift();
          _renderToast(c, next.msg, next.type, next.opts);
        }
      }, 250);
    }

    function _escape(s) {
      return String(s).replace(/[&<>]/g, function (m) { return m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;'; });
    }

    return { show: show };
  })();

  // ============================================================
  // 5.10 — ЛОГИРОВАНИЕ ДЕЙСТВИЙ
  // ============================================================
  var AppLog = (function () {
    var KEY = 'activityLog';
    var entries = [];
    var MAX = 200;

    function _load() {
      try { entries = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { entries = []; }
    }

    function log(action, detail) {
      var entry = { time: Date.now(), action: action, detail: detail || '' };
      entries.push(entry);
      if (entries.length > MAX) entries = entries.slice(-MAX);
      try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch (e) {}
    }

    function getAll() { return entries.slice(); }
    function clear() { entries = []; try { localStorage.removeItem(KEY); } catch (e) {} }

    function showViewer() {
      var html = '<div class="app-modal-body">';
      if (entries.length === 0) {
        html += '<p style="text-align:center;color:var(--app-text-muted);padding:30px 0;">' + t('log.empty') + '</p>';
      } else {
        html += '<div class="app-log-list">';
        for (var i = entries.length - 1; i >= 0; i--) {
          var e = entries[i];
          var d = new Date(e.time);
          var ts = d.toLocaleTimeString('ru-RU') + ' ' + d.toLocaleDateString('ru-RU');
          html += '<div class="app-log-entry"><span><b>' + _esc(e.action) + '</b>' + (e.detail ? ' — ' + _esc(e.detail) : '') + '</span><span class="app-log-time">' + ts + '</span></div>';
        }
        html += '</div>';
      }
      html += '</div>';
      var modal = AppModal.open(t('log.title'), html, [
        { label: t('log.clear'), danger: true, onClick: function () { clear(); AppModal.close(); AppToast.show(t('log.empty'), 'info'); } },
        { label: t('app.close'), onClick: function () { AppModal.close(); } }
      ]);
    }

    function _esc(s) { return String(s).replace(/[&<>]/g, function (m) { return m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;'; }); }

    _load();
    return { log: log, getAll: getAll, clear: clear, showViewer: showViewer };
  })();

  // ============================================================
  // 5.1 — МОДАЛЬНОЕ ОКНО (компонент)
  // ============================================================
  var AppModal = (function () {
    var current = null;

    function open(title, bodyHTML, buttons) {
      close();
      var overlay = document.createElement('div');
      overlay.className = 'app-modal-overlay';
      var modal = document.createElement('div');
      modal.className = 'app-modal';
      var html = '<div class="app-modal-header"><h3 class="app-modal-title">' + _esc(title) + '</h3><button class="app-modal-close" aria-label="close">&times;</button></div>';
      html += '<div class="app-modal-body">' + bodyHTML + '</div>';
      if (buttons && buttons.length) {
        html += '<div class="app-modal-footer">';
        buttons.forEach(function (b, i) {
          var cls = 'app-btn';
          if (b.secondary) cls += ' app-btn-secondary';
          if (b.danger) cls += ' app-btn-danger';
          if (b.success) cls += ' app-btn-success';
          if (b.ghost) cls += ' app-btn-ghost';
          html += '<button class="' + cls + '" data-btn="' + i + '">' + _esc(b.label) + '</button>';
        });
        html += '</div>';
      }
      modal.innerHTML = html;
      overlay.appendChild(modal);
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
      modal.querySelector('.app-modal-close').addEventListener('click', close);
      if (buttons) {
        buttons.forEach(function (b, i) {
          var btn = modal.querySelector('[data-btn="' + i + '"]');
          if (btn && b.onClick) btn.addEventListener('click', b.onClick);
        });
      }
      document.body.appendChild(overlay);
      document.addEventListener('keydown', _escKey);
      current = overlay;
      return overlay;
    }

    function close() {
      if (current) { current.remove(); current = null; document.removeEventListener('keydown', _escKey); }
    }

    function _escKey(e) { if (e.key === 'Escape') close(); }
    function _esc(s) { return String(s).replace(/[&<>]/g, function (m) { return m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;'; }); }

    return { open: open, close: close };
  })();

  // ============================================================
  // 5.4 — ЕДИНЫЙ UNDO-МЕНЕДЖЕР
  // ============================================================
  var AppUndo = (function () {
    function _activeTab() {
      var tabs = ['tabMain', 'tabCalendar', 'tabDaily', 'tabGenerator', 'tabAnalytics'];
      for (var i = 0; i < tabs.length; i++) {
        var el = document.getElementById(tabs[i]);
        if (el && el.style.display !== 'none') return tabs[i];
      }
      return 'tabMain';
    }

    function undo() {
      var tab = _activeTab();
      if (tab === 'tabMain') {
        if (typeof window.undo === 'function') { window.undo(); }
        else { var b = document.getElementById('undoBtn'); if (b && !b.disabled) b.click(); else AppToast.show(t('toast.noUndo'), 'warning'); }
      } else if (tab === 'tabCalendar') {
        var b = document.getElementById('calendarUndoBtn');
        if (b && !b.disabled) b.click(); else AppToast.show(t('toast.noUndo'), 'warning');
      } else {
        AppToast.show(t('toast.noUndo'), 'warning');
      }
      AppLog.log('undo', tab);
    }

    function redo() {
      var tab = _activeTab();
      if (tab === 'tabMain') {
        if (typeof window.redo === 'function') { window.redo(); }
        else { var b = document.getElementById('redoBtn'); if (b && !b.disabled) b.click(); else AppToast.show(t('toast.noRedo'), 'warning'); }
      } else if (tab === 'tabCalendar') {
        var b = document.getElementById('calendarRedoBtn');
        if (b && !b.disabled) b.click(); else AppToast.show(t('toast.noRedo'), 'warning');
      } else {
        AppToast.show(t('toast.noRedo'), 'warning');
      }
      AppLog.log('redo', tab);
    }

    return { undo: undo, redo: redo, getActiveTab: _activeTab };
  })();

  // ============================================================
  // 5.2 — ХЛЕБНЫЕ КРОШКИ
  // ============================================================
  var AppBreadcrumbs = (function () {
    var barEl = null;

    function init() {
      var header = document.querySelector('.premium-header .header-content') || document.querySelector('.premium-header');
      if (!header) return;
      if (document.getElementById('appBreadcrumbBar')) return;
      barEl = document.createElement('div');
      barEl.id = 'appBreadcrumbBar';
      barEl.className = 'app-breadcrumb-bar';
      // Вставляем после header, перед основным контентом
      var wrapper = document.querySelector('.app-wrapper') || document.querySelector('main') || document.body;
      wrapper.insertBefore(barEl, wrapper.firstChild);
      update();
    }

    function update() {
      if (!barEl) { barEl = document.getElementById('appBreadcrumbBar'); if (!barEl) return; }
      var crumbs = buildCrumbs();
      var html = '';
      crumbs.forEach(function (c, i) {
        var isCurrent = i === crumbs.length - 1;
        html += '<span class="app-breadcrumb-item' + (isCurrent ? ' current' : '') + '">';
        if (c.icon) html += '<i class="fas ' + c.icon + '"></i> ';
        html += _esc(c.label) + '</span>';
        if (i < crumbs.length - 1) html += '<span class="app-breadcrumb-sep"><i class="fas fa-chevron-right"></i></span>';
      });
      barEl.innerHTML = html;
    }

    function buildCrumbs() {
      var crumbs = [{ icon: 'fa-pen', label: t('bc.editor') }];
      var tab = AppUndo.getActiveTab();
      if (tab === 'tabMain') {
        var menuNum = _readMenuNumber();
        if (menuNum) {
          crumbs.push({ label: t('bc.menu', { n: menuNum }) });
          var week = Math.ceil(menuNum / 5);
          var day = menuNum - (week - 1) * 5;
          crumbs.push({ label: t('bc.week', { n: week }) });
          crumbs.push({ label: t('bc.day', { n: day }) });
        }
      } else if (tab === 'tabCalendar') {
        crumbs.push({ icon: 'fa-calendar', label: t('tab.calendar') });
      } else if (tab === 'tabDaily') {
        crumbs.push({ icon: 'fa-utensils', label: t('tab.daily') });
        var mn = _readMenuNumber();
        if (mn) {
          crumbs.push({ label: t('bc.menu', { n: mn }) });
          var w = Math.ceil(mn / 5), d = mn - (w - 1) * 5;
          crumbs.push({ label: t('bc.week', { n: w }) });
          crumbs.push({ label: t('bc.day', { n: d }) });
        }
      } else if (tab === 'tabGenerator') {
        crumbs.push({ icon: 'fa-magic', label: t('tab.generator') });
      } else if (tab === 'tabAnalytics') {
        crumbs.push({ icon: 'fa-chart-line', label: t('tab.analytics') });
      }
      return crumbs;
    }

    function _readMenuNumber() {
      try {
        if (window.DailyMenuModule) {
          var s = window.DailyMenuModule.getState();
          if (s && s.selectedMenuNumber) return s.selectedMenuNumber;
        }
      } catch (e) {}
      try {
        var v = document.getElementById('menuNumberSelect') || document.getElementById('menuSelect');
        if (v && v.value) return parseInt(v.value, 10);
      } catch (e) {}
      return null;
    }

    function _esc(s) { return String(s).replace(/[&<>]/g, function (m) { return m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;'; }); }

    return { init: init, update: update };
  })();

  // ============================================================
  // 5.7 — ТЁМНАЯ ТЕМА
  // ============================================================
  var AppTheme = (function () {
    var KEY = 'appTheme';

    function applyStored() {
      var saved;
      try { saved = localStorage.getItem(KEY); } catch (e) {}
      if (saved === 'dark') document.body.classList.add('theme-dark');
    }

    function toggle() {
      var isDark = document.body.classList.toggle('theme-dark');
      try { localStorage.setItem(KEY, isDark ? 'dark' : 'light'); } catch (e) {}
      AppToast.show(isDark ? t('toast.themeDark') : t('toast.themeLight'), 'info');
      AppLog.log('theme', isDark ? 'dark' : 'light');
      updateToggleUI();
    }

    function updateToggleUI() {
      var btn = document.getElementById('appThemeToggle');
      if (!btn) return;
      var isDark = document.body.classList.contains('theme-dark');
      btn.innerHTML = '<i class="fas ' + (isDark ? 'fa-sun' : 'fa-moon') + '"></i> ' + (isDark ? t('theme.light') : t('theme.dark'));
    }

    function init() {
      var target = document.querySelector('.app-utilities') || document.querySelector('.premium-header .header-content') || document.querySelector('.premium-header');
      if (target && !document.getElementById('appThemeToggle')) {
        var btn = document.createElement('button');
        btn.id = 'appThemeToggle';
        btn.className = 'app-theme-toggle';
        btn.title = t('theme.toggle');
        btn.addEventListener('click', toggle);
        target.appendChild(btn);
      }
      updateToggleUI();
    }

    // Применяем как можно раньше
    if (document.body) applyStored(); else document.addEventListener('DOMContentLoaded', applyStored);

    return { init: init, toggle: toggle, applyStored: applyStored };
  })();

  // ============================================================
  // 5.11 — ЕДИНОЕ АВТОСОХРАНЕНИЕ СЕССИИ
  // ============================================================
  var AppState = (function () {
    var KEY = 'appState_v1';
    var timer = null;

    function _collect() {
      var snap = {};
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k === KEY) continue;
          snap[k] = localStorage.getItem(k);
        }
      } catch (e) {}
      return snap;
    }

    function save() {
      var snap = { version: 1, timestamp: Date.now(), keys: _collect() };
      try { localStorage.setItem(KEY, JSON.stringify(snap)); } catch (e) {}
    }

    function restore() {
      var raw;
      try { raw = localStorage.getItem(KEY); } catch (e) { return false; }
      if (!raw) return false;
      var snap;
      try { snap = JSON.parse(raw); } catch (e) { return false; }
      if (!snap || !snap.keys) return false;
      for (var k in snap.keys) {
        try { localStorage.setItem(k, snap.keys[k]); } catch (e) {}
      }
      return true;
    }

    function init() {
      // Восстанавливаем только если нет основных данных (чистая сессия)
      var hasData = false;
      try { hasData = !!localStorage.getItem('autoSavedMenu'); } catch (e) {}
      if (!hasData && restore()) {
        AppToast.show(t('toast.restored'), 'success');
      }
      // Периодическое сохранение
      timer = setInterval(save, 60000);
      // Сохранение по событиям
      document.addEventListener('menuDataChanged', function () { save(); AppLog.log('menuChanged', 'auto-save'); });
      document.addEventListener('app:save', function () { save(); });
      window.addEventListener('beforeunload', save);
    }

    function saveNow() { save(); }

    return { init: init, save: save, saveNow: saveNow, restore: restore, collect: _collect };
  })();

  // ============================================================
  // 5.12 — ИМПОРТ/ЭКСПОРТ СЕССИИ (.fcmpo)
  // ============================================================
  var AppSession = (function () {
    function exportSession() {
      var data = {
        format: 'fcmpo',
        version: 1,
        timestamp: Date.now(),
        app: 'PRO Menu Editor',
        localStorage: AppState.collect()
      };
      // Добавляем in-memory данные, если есть
      try {
        if (window.templateMenuData) data.menuData = window.templateMenuData;
        if (window.schoolInfo) data.schoolInfo = window.schoolInfo;
        if (window.CalendarModule) data.calendarState = window.CalendarModule.getState();
      } catch (e) {}

      var json = JSON.stringify(data, null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var ts = new Date().toISOString().slice(0, 10);
      var filename = 'session-' + ts + '.fcmpo';
      if (window.saveAs) {
        window.saveAs(blob, filename);
      } else {
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }
      AppToast.show(t('session.exported'), 'success');
      AppLog.log('sessionExport', filename);
    }

    function importSession(file) {
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var data = JSON.parse(e.target.result);
          if (!data || data.format !== 'fcmpo') throw new Error('bad format');
          if (!confirm(t('session.confirmOverwrite'))) return;
          // Восстанавливаем localStorage
          if (data.localStorage) {
            for (var k in data.localStorage) {
              try { localStorage.setItem(k, data.localStorage[k]); } catch (e2) {}
            }
          }
          AppLog.log('sessionImport', 'restored');
          AppToast.show(t('session.imported'), 'success');
          // Перезагружаем для применения
          setTimeout(function () { window.location.reload(); }, 1200);
        } catch (err) {
          AppToast.show(t('session.importError'), 'error');
        }
      };
      reader.onerror = function () { AppToast.show(t('session.importError'), 'error'); };
      reader.readAsText(file);
    }

    function importPrompt() {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.fcmpo,.json';
      input.style.display = 'none';
      input.addEventListener('change', function () {
        if (input.files && input.files[0]) importSession(input.files[0]);
      });
      document.body.appendChild(input);
      input.click();
      setTimeout(function () { input.remove(); }, 5000);
    }

    return { exportSession: exportSession, importSession: importSession, importPrompt: importPrompt };
  })();

  // ============================================================
  // 5.3 — ГОРЯЧИЕ КЛАВИШИ
  // ============================================================
  var AppHotkeys = (function () {
    var TAB_ORDER = ['main', 'calendar', 'daily', 'generator', 'analytics'];

    function _isTyping(e) {
      var tag = (e.target.tagName || '').toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    }

    function _switchToTab(name) {
      var btn = document.querySelector('.tab-btn[data-tab="' + name + '"]');
      if (btn) { btn.click(); AppLog.log('tabSwitch', name); }
      else if (typeof window.switchTab === 'function') { window.switchTab('tab' + name.charAt(0).toUpperCase() + name.slice(1)); }
    }

    function _save() {
      var done = false;
      if (typeof window.saveToStorage === 'function') { try { window.saveToStorage(); done = true; } catch (e) {} }
      document.dispatchEvent(new CustomEvent('app:save'));
      AppToast.show(t('toast.save'), 'success');
      AppLog.log('save', 'Ctrl+S');
    }

    function _export() {
      if (typeof window.exportMenuToFile === 'function') { try { window.exportMenuToFile(); } catch (e) {} }
      else if (typeof window.exportToExcel === 'function') { try { window.exportToExcel(); } catch (e) {} }
      AppLog.log('export', 'Ctrl+Shift+E');
    }

    function _generate() {
      _switchToTab('generator');
      setTimeout(function () {
        var btn = document.getElementById('genGenerateBtn');
        if (btn) btn.click();
      }, 300);
      AppLog.log('generate', 'Ctrl+G');
    }

    function _search() {
      var inp = document.getElementById('globalSearchInput') || document.getElementById('searchInput') || document.querySelector('input[type="search"]');
      if (inp) { inp.focus(); inp.select(); }
      AppLog.log('search', 'Ctrl+F');
    }

    function showKeysDialog() {
      var keys = [
        ['1 – 5', t('hk.switchTab', { n: '1-5' })],
        ['Ctrl + S', t('hk.save')],
        ['Ctrl + Z', t('hk.undo')],
        ['Ctrl + Y', t('hk.redo')],
        ['Ctrl + F', t('hk.search')],
        ['Ctrl + G', t('hk.generate')],
        ['Ctrl + Shift + E', t('hk.export')],
        ['F1', t('hk.help')],
        ['?', t('hk.allKeys')]
      ];
      var html = '<div class="app-keys-grid">';
      keys.forEach(function (k) { html += '<kbd>' + k[0] + '</kbd><span>' + k[1] + '</span>'; });
      html += '</div>';
      AppModal.open(t('hk.title'), html, [{ label: t('app.close'), onClick: function () { AppModal.close(); } }]);
      AppLog.log('help', 'keys dialog');
    }

    function init() {
      document.addEventListener('keydown', function (e) {
        // F1 — оставляем существующему обработчику
        if (e.key === 'F1') return;
        // Ctrl+F — оставляем существующему обработчику
        if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F') && !e.shiftKey) return;

        var ctrl = e.ctrlKey || e.metaKey;

        // Ctrl+S
        if (ctrl && (e.key === 's' || e.key === 'S')) { e.preventDefault(); _save(); return; }
        // Ctrl+Z (без shift)
        if (ctrl && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) { e.preventDefault(); AppUndo.undo(); return; }
        // Ctrl+Y или Ctrl+Shift+Z
        if (ctrl && ((e.key === 'y' || e.key === 'Y') || ((e.key === 'z' || e.key === 'Z') && e.shiftKey))) { e.preventDefault(); AppUndo.redo(); return; }
        // Ctrl+G
        if (ctrl && (e.key === 'g' || e.key === 'G') && !e.shiftKey) { e.preventDefault(); _generate(); return; }
        // Ctrl+Shift+E
        if (ctrl && e.shiftKey && (e.key === 'e' || e.key === 'E')) { e.preventDefault(); _export(); return; }

        // Не обрабатываем цифры и ? при вводе текста
        if (_isTyping(e)) return;

        // ? — все клавиши
        if (e.key === '?' || (e.shiftKey && e.key === '/')) { e.preventDefault(); showKeysDialog(); return; }

        // 1–5 — вкладки
        if (!ctrl && !e.altKey && /^[1-5]$/.test(e.key)) {
          var idx = parseInt(e.key, 10) - 1;
          if (idx < TAB_ORDER.length) { e.preventDefault(); _switchToTab(TAB_ORDER[idx]); }
          return;
        }
      });
    }

    return { init: init, showKeysDialog: showKeysDialog };
  })();

  // ============================================================
  // 5.5 — ОНБОРДИНГ-ТУР
  // ============================================================
  var AppTour = (function () {
    var KEY = 'appTourDone';
    var steps = [];
    var current = 0;
    var overlayEl = null, highlightEl = null, popoverEl = null;
    var activeTarget = null;
    var settleTimers = [];

    function _buildSteps() {
      return [
        { selector: '.tab-btn[data-tab="main"]', title: t('tab.main'), text: t('tour.step1') },
        { selector: '.tab-btn[data-tab="main"]', title: t('tab.main'), text: t('tour.step2') },
        { selector: '.tab-btn[data-tab="calendar"]', title: t('tab.calendar'), text: t('tour.step3') },
        { selector: '.tab-btn[data-tab="analytics"]', title: t('tab.analytics'), text: t('tour.step4') },
        { selector: '.tab-btn[data-tab="generator"]', title: t('tab.generator'), text: t('tour.step5') },
        { selector: '.tab-btn[data-tab="daily"]', title: t('tab.daily'), text: t('tour.step6') },
        { selector: '#appBreadcrumbBar', title: t('bc.editor'), text: t('tour.step7') },
        { selector: '#appThemeToggle', title: t('theme.toggle'), text: t('tour.step8') }
      ];
    }

    function start() {
      steps = _buildSteps();
      current = 0;
      _showStep();
      AppLog.log('tour', 'start');
    }

    function _showStep() {
      _clear();
      if (current >= steps.length) { _finish(); return; }
      var step = steps[current];
      var target = document.querySelector(step.selector);
      activeTarget = target || null;

      // Шаг 1: досрочно прокручиваем к цели — до любых измерений.
      // Раньше попап мерился во время smooth-прокрутки и уезжал за пределы
      // экрана, из-за чего онбординг выглядел «не работающим».
      if (target) {
        try {
          target.scrollIntoView({ block: 'center', behavior: 'auto' });
        } catch (e) {}
      }

      overlayEl = document.createElement('div');
      overlayEl.className = 'app-tour-overlay';
      document.body.appendChild(overlayEl);

      if (target) {
        highlightEl = document.createElement('div');
        highlightEl.className = 'app-tour-highlight';
        document.body.appendChild(highlightEl);
      }

      popoverEl = document.createElement('div');
      popoverEl.className = 'app-tour-popover';

      var dotsHTML = '';
      steps.forEach(function (s, i) { dotsHTML += '<div class="app-tour-dot' + (i <= current ? ' active' : '') + '"></div>'; });

      var btns = '';
      btns += '<button class="app-btn app-btn-ghost app-btn-sm" id="appTourSkip">' + t('tour.skip') + '</button>';
      if (current > 0) btns += '<button class="app-btn app-btn-secondary app-btn-sm" id="appTourPrev">' + t('tour.prev') + '</button>';
      var last = current === steps.length - 1;
      btns += '<button class="app-btn app-btn-sm" id="appTourNext">' + (last ? t('tour.finish') : t('tour.next')) + '</button>';

      popoverEl.innerHTML = '<div class="app-tour-progress">' + dotsHTML + '</div><h3>' + _esc(step.title) + '</h3><p>' + _esc(step.text) + '</p><div style="display:flex;gap:8px;justify-content:flex-end;align-items:center;">' + btns + '</div>';
      document.body.appendChild(popoverEl);

      _positionPopover();

      // Страховка от «поздней» перестройки макета: приложение дорисовывает
      // контент после загрузки, поэтому несколько раз подравниваем позицию.
      [0, 120, 400].forEach(function (delay) {
        settleTimers.push(setTimeout(_positionPopover, delay));
      });
      window.addEventListener('scroll', _positionPopover, true);
      window.addEventListener('resize', _positionPopover);

      document.getElementById('appTourSkip').addEventListener('click', _finish);
      var prevBtn = document.getElementById('appTourPrev');
      if (prevBtn) prevBtn.addEventListener('click', function () { current--; _showStep(); });
      document.getElementById('appTourNext').addEventListener('click', function () { current++; _showStep(); });
    }

    // Подсветка цели по её актуальным координатам
    function _placeHighlight(rect) {
      if (!highlightEl || !rect) return;
      highlightEl.style.top = (rect.top - 4) + 'px';
      highlightEl.style.left = (rect.left - 4) + 'px';
      highlightEl.style.width = (rect.width + 8) + 'px';
      highlightEl.style.height = (rect.height + 8) + 'px';
    }

    // Позиционирование попапа с жёстким удержанием внутри окна
    function _positionPopover() {
      if (!popoverEl) return;
      var margin = 16;
      var vw = window.innerWidth || document.documentElement.clientWidth || 1024;
      var vh = window.innerHeight || document.documentElement.clientHeight || 768;
      var pw = popoverEl.offsetWidth || 320;
      var ph = popoverEl.offsetHeight || 160;
      var top, left;

      if (activeTarget && document.body.contains(activeTarget)) {
        var rect = activeTarget.getBoundingClientRect();
        _placeHighlight(rect);
        top = rect.bottom + margin;
        left = rect.left + rect.width / 2 - pw / 2;
        if (top + ph > vh - margin) top = rect.top - ph - margin;
      } else {
        top = (vh - ph) / 2;
        left = (vw - pw) / 2;
      }

      // Главное исправление: попап никогда не уходит за границы экрана
      top = Math.min(Math.max(top, margin), Math.max(margin, vh - ph - margin));
      left = Math.min(Math.max(left, margin), Math.max(margin, vw - pw - margin));

      popoverEl.style.top = top + 'px';
      popoverEl.style.left = left + 'px';
      popoverEl.style.transform = 'none';
    }

    function _clear() {
      if (overlayEl) { overlayEl.remove(); overlayEl = null; }
      if (highlightEl) { highlightEl.remove(); highlightEl = null; }
      if (popoverEl) { popoverEl.remove(); popoverEl = null; }
      activeTarget = null;
      settleTimers.forEach(function (id) { clearTimeout(id); });
      settleTimers = [];
      window.removeEventListener('scroll', _positionPopover, true);
      window.removeEventListener('resize', _positionPopover);
    }

    function _finish() {
      _clear();
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
      AppToast.show(t('toast.tourDone'), 'success');
      AppLog.log('tour', 'finish');
    }

    function maybeAutoStart() {
      var done;
      try { done = localStorage.getItem(KEY); } catch (e) {}
      if (!done) setTimeout(start, 1500);
    }

    function _esc(s) { return String(s).replace(/[&<>]/g, function (m) { return m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;'; }); }

    return { start: start, maybeAutoStart: maybeAutoStart };
  })();

  // ============================================================
  // 5.9 — PWA
  // ============================================================
  var AppPWA = (function () {
    function init() {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(function (reg) {
          AppLog.log('pwa', 'sw registered');
        }).catch(function () {});
      }
    }
    return { init: init };
  })();

  // ============================================================
  // УТИЛИТЫ В ШАПКЕ (экспорт/импорт сессии, журнал, тур)
  // ============================================================
  function injectUtilities() {
    var header = document.querySelector('.premium-header .header-content') || document.querySelector('.premium-header');
    if (!header) return;
    if (document.getElementById('appUtilities')) return;
    var wrap = document.createElement('div');
    wrap.id = 'appUtilities';
    wrap.className = 'app-utilities';

    var tourBtn = document.createElement('button');
    tourBtn.className = 'app-theme-toggle';
    tourBtn.innerHTML = '<i class="fas fa-graduation-cap"></i>';
    tourBtn.title = t('tour.welcome');
    tourBtn.addEventListener('click', AppTour.start);

    var exportBtn = document.createElement('button');
    exportBtn.className = 'app-theme-toggle';
    exportBtn.innerHTML = '<i class="fas fa-download"></i>';
    exportBtn.title = t('session.export');
    exportBtn.addEventListener('click', AppSession.exportSession);

    var importBtn = document.createElement('button');
    importBtn.className = 'app-theme-toggle';
    importBtn.innerHTML = '<i class="fas fa-upload"></i>';
    importBtn.title = t('session.import');
    importBtn.addEventListener('click', AppSession.importPrompt);

    var logBtn = document.createElement('button');
    logBtn.className = 'app-theme-toggle';
    logBtn.innerHTML = '<i class="fas fa-list"></i>';
    logBtn.title = t('log.title');
    logBtn.addEventListener('click', AppLog.showViewer);

    wrap.appendChild(tourBtn);
    wrap.appendChild(exportBtn);
    wrap.appendChild(importBtn);
    wrap.appendChild(logBtn);
    header.appendChild(wrap);
  }

  // ============================================================
  // ГЛОБАЛЬНЫЙ showToast (для делегирования из showStatus)
  // ============================================================
  window.showToast = function (msg, type) { AppToast.show(msg, type); };

  // ============================================================
  // ОРКЕСТРАТОР
  // ============================================================
  var AppCore = {
    init: function () {
      injectCSS();
      AppTheme.applyStored();
      // Сначала создаём группу утилит, чтобы переключатель темы попал в неё
      injectUtilities();
      AppTheme.init();
      AppBreadcrumbs.init();
      AppHotkeys.init();
      AppState.init();
      AppPWA.init();
      // Подписка на переключение вкладок для обновления крошек
      document.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('.tab-btn')) {
          setTimeout(AppBreadcrumbs.update, 100);
        }
      });
      document.addEventListener('menuDataChanged', function () { AppBreadcrumbs.update(); });
      // Авто-старт тура для новых пользователей
      AppTour.maybeAutoStart();
      AppLog.log('appInit', 'AppCore ready');
    },
    toast: AppToast,
    modal: AppModal,
    undo: AppUndo,
    breadcrumbs: AppBreadcrumbs,
    theme: AppTheme,
    tour: AppTour,
    log: AppLog,
    state: AppState,
    session: AppSession,
    hotkeys: AppHotkeys,
    pwa: AppPWA
  };

  window.AppCore = AppCore;

  // Авто-инициализация
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', AppCore.init);
  } else {
    AppCore.init();
  }
})();

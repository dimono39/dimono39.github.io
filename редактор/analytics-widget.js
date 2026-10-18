/* analytics-widget.js
   Плавающая иконка-ссылка на аналитику питания.
   Подключение: <script src="analytics-widget.js" defer></script>
   Настройки можно переопределить до подключения:
     window.ANALYTICS_WIDGET = {
       url: "https://dimono39.github.io/мм/index.html",
       label: "Аналитика питания",
       position: "left",   // "left" | "right"
       bottom: "20px",
       side: "20px"
     };
*/
(function () {
  "use strict";

  const DEFAULTS = {
    url: "https://dimono39.github.io/мм/index.html",
    label: "Аналитика питания",
    position: "left",     // слева или справа
    bottom: "20px",
    side: "20px",         // отступ от края
    iconColor: "#2980b9",
    iconColorHover: "#1f6391",
    zIndex: 2147483000    // очень высокий, чтобы быть поверх всего
  };
  const cfg = Object.assign({}, DEFAULTS, window.ANALYTICS_WIDGET || {});

  // Не добавляем дважды
  if (document.getElementById("analytics-widget-root")) return;

  const css = `
    #analytics-widget-root {
      position: fixed;
      ${cfg.position}: ${cfg.side};
      bottom: ${cfg.bottom};
      z-index: ${cfg.zIndex};
      isolation: isolate;
      font-family: Arial, sans-serif;
    }
    #analytics-widget-root .aw-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px 12px 12px;
      border-radius: 999px;
      background: ${cfg.iconColor};
      color: #fff;
      text-decoration: none;
      box-shadow: 0 6px 20px rgba(0,0,0,0.22);
      transition: transform .15s ease, background .15s ease, box-shadow .15s ease;
      max-width: 56px;
      overflow: hidden;
      white-space: nowrap;
      cursor: pointer;
    }
    #analytics-widget-root .aw-btn:hover,
    #analytics-widget-root .aw-btn:focus-visible {
      background: ${cfg.iconColorHover};
      transform: translateY(-2px);
      box-shadow: 0 10px 26px rgba(0,0,0,0.28);
      max-width: 340px;
      outline: none;
    }
    #analytics-widget-root .aw-icon {
      width: 28px;
      height: 28px;
      flex: 0 0 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    #analytics-widget-root .aw-icon svg {
      width: 24px; height: 24px; display: block;
    }
    #analytics-widget-root .aw-label {
      font-size: 14px;
      font-weight: 600;
      opacity: 0;
      transform: translateX(-6px);
      transition: opacity .15s ease, transform .15s ease;
      pointer-events: none;
    }
    #analytics-widget-root .aw-btn:hover .aw-label,
    #analytics-widget-root .aw-btn:focus-visible .aw-label {
      opacity: 1;
      transform: translateX(0);
    }
    /* Мобильные: кнопка чуть меньше, отступы меньше */
    @media (max-width: 600px) {
      #analytics-widget-root {
        ${cfg.position}: 12px;
        bottom: 12px;
      }
      #analytics-widget-root .aw-btn {
        padding: 10px;
        max-width: 48px;
      }
      #analytics-widget-root .aw-icon { width: 24px; height: 24px; flex-basis: 24px; }
      #analytics-widget-root .aw-icon svg { width: 20px; height: 20px; }
      /* На тач-устройствах подпись не выезжает — иначе мешает */
      #analytics-widget-root .aw-btn:hover .aw-label,
      #analytics-widget-root .aw-btn:focus-visible .aw-label {
        opacity: 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      #analytics-widget-root .aw-btn,
      #analytics-widget-root .aw-label { transition: none; }
    }
  `;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "analytics-widget-root";
  root.setAttribute("aria-live", "polite");

  // Иконка: «плитка с графиком» — узнаваемый символ аналитики
  const iconSvg = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="3.5" width="19" height="17" rx="3"
            stroke="currentColor" stroke-width="1.8"/>
      <path d="M6 16.5 L9.5 12.5 L12.5 14.5 L18 8.5"
            stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="18" cy="8.5" r="1.6" fill="currentColor"/>
    </svg>`;

  root.innerHTML = `
    <a class="aw-btn"
       href="${cfg.url}"
       target="_blank"
       rel="noopener noreferrer"
       title="${cfg.label} — открыть в новой вкладке"
       aria-label="${cfg.label} — открыть в новой вкладке">
      <span class="aw-icon">${iconSvg}</span>
      <span class="aw-label">${cfg.label}</span>
    </a>`;

  // Добавляем после загрузки DOM
  function attach() {
    document.body.appendChild(root);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attach, { once: true });
  } else {
    attach();
  }

  // Лёгкий трекинг (если на основном сайте есть собственный аналитик —
  // можно удалить или заменить на свой обработчик)
  root.querySelector(".aw-btn").addEventListener("click", function () {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", "analytics_widget_click", { url: cfg.url });
      }
      if (typeof window.ym === "function" && window.ANALYTICS_WIDGET?.ymCounter) {
        window.ym(window.ANALYTICS_WIDGET.ymCounter, "reachGoal", "ANALYTICS_WIDGET_CLICK");
      }
    } catch (_) { /* трекинг не критичен */ }
  });
})();
/**
 * ============================================================
 * МОДУЛЬ "МОБИЛЬНАЯ ВЕРСИЯ" v1.0 — ЭТАП 1
 * Подключаемый файл для PRO Редактора типового меню
 * ============================================================
 * 
 * Возможности этапа 1:
 *  ✓ Автодетекция устройства (мобильный / планшет / десктоп)
 *  ✓ Нижняя навигация (Bottom Nav) с 4 табами
 *  ✓ Sticky-панель действий
 *  ✓ Оптимизация touch-targets (минимум 44px)
 *  ✓ Улучшенные модалки (bottom sheet)
 *  ✓ Мобильные стили (инжектятся в <head>)
 *  ✓ Плавающая кнопка "Наверх"
 *  ✓ Индикатор безопасной зоны (iPhone notch)
 * 
 * Подключение в testtm1.html:
 * <script src="mobile-module.js"></script>
 * 
 * Автозапуск: модуль сам инициализируется при DOMContentLoaded
 * ============================================================
 */

const MobileModule = (function() {
    'use strict';

    // ============================================================
    // КОНФИГУРАЦИЯ
    // ============================================================
    
    const CONFIG = {
        BREAKPOINT_TABLET: 1024,
        BREAKPOINT_MOBILE: 768,
        BREAKPOINT_SMALL: 480,
        TOUCH_TARGET_MIN: 44,
        ENABLE_BOTTOM_NAV: true,
        ENABLE_STICKY_ACTIONS: true,
        ENABLE_BOTTOM_SHEET: true,
        ENABLE_SCROLL_TOP: true,
        DEBOUNCE_DELAY: 150,
        DEBUG: false
    };

    // ============================================================
    // СОСТОЯНИЕ
    // ============================================================
    
    let state = {
        isMobile: false,
        isTablet: false,
        isTouch: false,
        isInitialized: false,
        orientation: 'portrait',
        currentTab: 'main',
        bottomNav: null,
        scrollTopBtn: null,
        resizeTimeout: null,
        lastWidth: window.innerWidth,
        lastHeight: window.innerHeight
    };

    // ============================================================
    // УТИЛИТЫ
    // ============================================================

    function log(...args) {
        if (CONFIG.DEBUG) console.log('📱 [MobileModule]', ...args);
    }

    function debounce(fn, delay) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    function throttle(fn, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ============================================================
    // ДЕТЕКЦИЯ УСТРОЙСТВА
    // ============================================================

    function detectDevice() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isTouch = ('ontouchstart' in window) || 
                        (navigator.maxTouchPoints > 0) || 
                        (navigator.msMaxTouchPoints > 0);

        // Определяем ориентацию
        state.orientation = height > width ? 'portrait' : 'landscape';
        state.isTouch = isTouch;

        // Определяем тип устройства
        const wasMobile = state.isMobile;
        const wasTablet = state.isTablet;

        // Мобильный: ширина < 768px
        state.isMobile = width < CONFIG.BREAKPOINT_MOBILE;

        // Планшет: 768px <= ширина < 1024px
        state.isTablet = width >= CONFIG.BREAKPOINT_MOBILE && 
                         width < CONFIG.BREAKPOINT_TABLET;

        // Устанавливаем классы на <body>
        document.body.classList.toggle('is-mobile', state.isMobile);
        document.body.classList.toggle('is-tablet', state.isTablet);
        document.body.classList.toggle('is-touch', state.isTouch);
        document.body.classList.toggle('is-portrait', state.orientation === 'portrait');
        document.body.classList.toggle('is-landscape', state.orientation === 'landscape');

        // Устанавливаем CSS-переменную для высоты viewport
        // (решает проблему с 100vh на мобильных браузерах)
        document.documentElement.style.setProperty('--vh', `${height * 0.01}px`);
        document.documentElement.style.setProperty('--vw', `${width * 0.01}px`);

        if (wasMobile !== state.isMobile || wasTablet !== state.isTablet) {
            log(`Устройство: mobile=${state.isMobile}, tablet=${state.isTablet}, touch=${isTouch}, orientation=${state.orientation}`);
        }

        return { isMobile: state.isMobile, isTablet: state.isTablet };
    }

    // ============================================================
    // ИНЖЕКТ МОБИЛЬНЫХ СТИЛЕЙ
    // ============================================================

    function injectMobileStyles() {
        if (document.getElementById('mobileModuleStyles')) return;

        const style = document.createElement('style');
        style.id = 'mobileModuleStyles';
        style.textContent = `
/* ============================================================
   MOBILE MODULE v1.0 — СТИЛИ
   ============================================================ */

/* ---------- КОРНЕВЫЕ ПЕРЕМЕННЫЕ ---------- */
:root {
    --safe-area-top: env(safe-area-inset-top, 0px);
    --safe-area-bottom: env(safe-area-inset-bottom, 0px);
    --safe-area-left: env(safe-area-inset-left, 0px);
    --safe-area-right: env(safe-area-inset-right, 0px);
    --bottom-nav-height: 64px;
    --mobile-gap: 12px;
    --mobile-radius: 16px;
}

/* ---------- БАЗОВЫЕ МОБИЛЬНЫЕ ПРАВИЛА ---------- */

body.is-mobile,
body.is-tablet {
    /* Убираем "резинку" при overscroll */
    overscroll-behavior-y: contain;
    /* Улучшаем рендеринг текста */
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    /* Отключаем tap-highlight */
    -webkit-tap-highlight-color: transparent;
}

/* Отключаем hover-эффекты на тач-устройствах */
body.is-touch .feature-item:hover,
body.is-touch .rule-badge:hover,
body.is-touch .stat-card:hover,
body.is-touch .btn:hover,
body.is-touch .action-btn:hover {
    transform: none !important;
    box-shadow: inherit !important;
}

/* ---------- BOTTOM NAVIGATION ---------- */

.mobile-bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: calc(var(--bottom-nav-height) + var(--safe-area-bottom));
    padding-bottom: var(--safe-area-bottom);
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid rgba(226, 232, 240, 0.8);
    display: flex;
    justify-content: space-around;
    align-items: stretch;
    z-index: 9000;
    box-shadow: 0 -4px 20px rgba(15, 23, 42, 0.08);
    animation: navSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes navSlideUp {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
}

.mobile-bottom-nav button {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px 4px;
    border: none;
    background: transparent;
    color: #94a3b8;
    font-size: 0.65rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    font-family: inherit;
    -webkit-tap-highlight-color: transparent;
    min-height: 48px;
}

.mobile-bottom-nav button i {
    font-size: 1.1rem;
    transition: transform 0.2s ease;
}

.mobile-bottom-nav button:active {
    transform: scale(0.94);
}

.mobile-bottom-nav button.active {
    color: #059669;
}

.mobile-bottom-nav button.active i {
    transform: translateY(-2px) scale(1.1);
}

.mobile-bottom-nav button.active::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 32px;
    height: 3px;
    background: linear-gradient(90deg, #10b981, #059669);
    border-radius: 0 0 4px 4px;
    animation: navIndicator 0.3s ease;
}

@keyframes navIndicator {
    from { width: 0; opacity: 0; }
    to   { width: 32px; opacity: 1; }
}

/* Бейдж с уведомлением на иконке */
.mobile-bottom-nav button .nav-badge {
    position: absolute;
    top: 6px;
    right: calc(50% - 18px);
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    background: #ef4444;
    color: white;
    border-radius: 8px;
    font-size: 0.55rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.4);
    animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.15); }
}

/* ---------- ОТСТУПЫ ПОД BOTTOM NAV ---------- */

body.is-mobile.has-bottom-nav .container {
    padding-bottom: calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 20px);
}

body.is-mobile.has-bottom-nav footer {
    margin-bottom: calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 20px);
}

/* Скрываем нижнюю навигацию при печати */
@media print {
    .mobile-bottom-nav { display: none !important; }
}

/* ---------- STICKY ACTIONS ---------- */

body.is-mobile .actions-grid-premium {
    position: sticky;
    bottom: 0;
    z-index: 8000;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 -4px 16px rgba(15, 23, 42, 0.08);
    border-top: 1px solid #e2e8f0;
    padding: 10px 12px;
    margin: 0 -16px -16px;
    overflow-x: auto;
    overflow-y: hidden;
    flex-wrap: nowrap;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
}

body.is-mobile .actions-grid-premium::-webkit-scrollbar {
    display: none;
}

body.is-mobile .actions-grid-premium .action-btn {
    flex: 0 0 auto;
    min-height: 44px;
    scroll-snap-align: start;
}

/* Sticky-эффект только когда панель видима */
body.is-mobile .actions-grid-premium.sticky-visible {
    box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.12);
}

/* ---------- КНОПКА "НАВЕРХ" ---------- */

.mobile-scroll-top {
    position: fixed;
    right: 16px;
    bottom: calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 16px);
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    box-shadow: 0 8px 24px rgba(5, 150, 105, 0.4);
    z-index: 8500;
    opacity: 0;
    visibility: hidden;
    transform: translateY(20px) scale(0.8);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    -webkit-tap-highlight-color: transparent;
}

.mobile-scroll-top.visible {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
}

.mobile-scroll-top:active {
    transform: scale(0.9);
}

/* ---------- МОДАЛКИ → BOTTOM SHEET ---------- */

body.is-mobile .modal {
    align-items: flex-end !important;
    padding: 0;
}

body.is-mobile .modal .modal-content {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100% !important;
    max-width: 100% !important;
    max-height: 92vh;
    border-radius: 24px 24px 0 0;
    padding: 24px 20px calc(24px + var(--safe-area-bottom));
    animation: bottomSheetSlide 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
}

@keyframes bottomSheetSlide {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
}

/* Ручка для свайпа вниз */
body.is-mobile .modal .modal-content::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 4px;
    background: #cbd5e1;
    border-radius: 2px;
    opacity: 0.6;
}

body.is-mobile .modal .modal-content > *:first-child {
    margin-top: 8px;
}

/* ---------- АДАПТАЦИЯ КОНТЕЙНЕРА ---------- */

body.is-mobile .container {
    padding: 0;
    max-width: 100%;
}

body.is-mobile body {
    padding: 8px;
}

/* ---------- АДАПТАЦИЯ КАРТОЧЕК ---------- */

body.is-mobile .card,
body.is-mobile .premium-card {
    border-radius: 20px;
    padding: 16px;
    margin-bottom: 16px;
}

body.is-mobile .card-header-premium {
    padding: 16px;
    gap: 12px;
}

body.is-mobile .card-header-left {
    gap: 12px;
}

body.is-mobile .card-icon-wrapper {
    width: 40px;
    height: 40px;
}

body.is-mobile .card-icon-wrapper i {
    font-size: 18px;
}

body.is-mobile .card-title-premium {
    font-size: 1rem;
}

body.is-mobile .card-subtitle-premium {
    font-size: 0.7rem;
}

/* ---------- АДАПТАЦИЯ ХЕДЕРА ---------- */

body.is-mobile .premium-header {
    border-radius: 20px;
    margin-bottom: 16px;
}

body.is-mobile .header-content {
    padding: 16px;
}

body.is-mobile .header-main {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 16px;
}

body.is-mobile .logo-section {
    gap: 12px;
}

body.is-mobile .logo-icon {
    width: 48px;
    height: 48px;
}

body.is-mobile .logo-icon i {
    font-size: 22px;
}

body.is-mobile .logo-text h1 {
    font-size: 1.1rem;
}

body.is-mobile .stats-row {
    width: 100%;
    justify-content: space-around;
    padding: 8px 12px;
}

body.is-mobile .stat-chip span {
    font-size: 1.1rem;
}

body.is-mobile .features-grid {
    gap: 6px;
    padding: 10px 0;
}

body.is-mobile .feature-item {
    padding: 4px 10px;
    font-size: 0.7rem;
}

body.is-mobile .feature-text {
    font-size: 0.65rem;
}

body.is-mobile .header-bottom {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
}

body.is-mobile .mode-toggle-wrapper {
    flex-wrap: wrap;
    gap: 8px;
    padding: 6px 10px;
}

body.is-mobile .mode-toggle {
    width: 100%;
}

body.is-mobile .mode-toggle-btn {
    flex: 1;
    font-size: 0.7rem;
    padding: 8px 12px;
}

/* ---------- АДАПТАЦИЯ ТАБОВ (верхних) ---------- */

body.is-mobile .tab-navigation {
    display: none !important; /* Заменяем на bottom nav */
}

/* ---------- АДАПТАЦИЯ ПОИСКА И ФИЛЬТРОВ ---------- */

body.is-mobile .search-panel-premium {
    padding: 12px 16px;
}

body.is-mobile .search-fields {
    flex-direction: column;
    gap: 10px;
}

body.is-mobile .search-input-wrapper {
    width: 100%;
}

body.is-mobile .filter-group {
    width: 100%;
    flex-direction: column;
    gap: 8px;
}

body.is-mobile .filter-select-premium,
body.is-mobile .btn-filter-clear {
    width: 100%;
    min-height: 44px;
}

/* ---------- АДАПТАЦИЯ СТАТИСТИКИ ---------- */

body.is-mobile .stats-grid-premium {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    padding: 12px 16px;
}

body.is-mobile .stat-number-premium {
    font-size: 1.3rem;
}

body.is-mobile .stat-label-premium {
    font-size: 0.6rem;
}

/* ---------- АДАПТАЦИЯ ПРАВИЛ ---------- */

body.is-mobile .rules-panel-premium {
    padding: 12px 16px;
    gap: 6px;
}

body.is-mobile .rule-badge {
    font-size: 0.65rem;
    padding: 4px 10px;
}

/* ---------- АДАПТАЦИЯ ТАБЛИЦЫ (горизонтальный скролл) ---------- */

body.is-mobile .editor-wrapper-premium {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
    scroll-snap-type: x proximity;
    padding-bottom: 8px;
}

body.is-mobile .editor-wrapper-premium::-webkit-scrollbar {
    height: 4px;
}

body.is-mobile .editor-wrapper-premium::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
}

body.is-mobile .editor-table {
    min-width: 1200px;
    font-size: 0.7rem;
}

body.is-mobile .editor-table th,
body.is-mobile .editor-table td {
    padding: 6px 8px;
}

body.is-mobile .editor-table input,
body.is-mobile .editor-table select {
    min-height: 36px;
    font-size: 0.75rem;
}

/* Индикатор горизонтального скролла */
body.is-mobile .editor-wrapper-premium::after {
    content: '← Прокрутите вправо →';
    position: sticky;
    left: 0;
    display: block;
    text-align: center;
    font-size: 0.7rem;
    color: #94a3b8;
    padding: 8px;
    background: linear-gradient(180deg, transparent, rgba(255,255,255,0.9));
    pointer-events: none;
    opacity: 1;
    transition: opacity 0.3s;
}

body.is-mobile .editor-wrapper-premium.scrolled::after {
    opacity: 0;
}

/* ---------- АДАПТАЦИЯ КАЛЕНДАРЯ ---------- */

body.is-mobile #calendarContainer {
    padding: 12px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

body.is-mobile #calendarContainer table {
    min-width: 800px;
    font-size: 0.7rem;
}

body.is-mobile #calendarContainer th,
body.is-mobile #calendarContainer td {
    padding: 4px 6px;
    min-width: 32px;
}

/* ---------- АДАПТАЦИЯ ЕЖЕДНЕВНОГО МЕНЮ ---------- */

body.is-mobile .daily-menu-header {
    padding: 16px;
}

body.is-mobile .daily-menu-body {
    padding: 0 16px 16px;
}

body.is-mobile .menu-selector-wrapper {
    flex-direction: column;
    gap: 12px;
}

body.is-mobile .menu-selector-wrapper > div {
    min-width: 100% !important;
    flex: 1 1 100% !important;
}

body.is-mobile .menu-selector {
    gap: 6px;
}

body.is-mobile .menu-number-btn {
    min-width: 48px;
    max-width: 60px;
    min-height: 48px;
}

body.is-mobile .daily-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
}

body.is-mobile .toolbar-group {
    width: 100%;
}

body.is-mobile .meal-filter-btn {
    min-height: 40px;
    padding: 8px 12px;
    font-size: 0.7rem;
}

body.is-mobile .date-quick-btn {
    min-height: 40px;
    padding: 6px 12px;
    font-size: 0.75rem;
}

body.is-mobile .daily-status-bar {
    flex-direction: column;
    gap: 8px;
    padding: 10px 14px;
}

body.is-mobile .daily-status-bar .status-time {
    margin-left: 0;
    width: 100%;
    text-align: center;
}

/* ---------- АДАПТАЦИЯ БЛОКА ВАРИАНТА ---------- */

body.is-mobile .variant-name-block {
    padding: 12px;
    gap: 10px;
}

body.is-mobile .variant-name-block > div {
    padding: 10px 12px !important;
}

body.is-mobile .variant-name-block .actions-group {
    flex-direction: column;
}

body.is-mobile .variant-name-block .actions-group .btn {
    width: 100%;
    justify-content: center;
    min-height: 44px;
}

body.is-mobile .variant-name-block .actions-group > div[style*="width: 1px"] {
    display: none;
}

body.is-mobile #dailyApprovalPosition,
body.is-mobile #dailyApprovalName,
body.is-mobile #dailyAgreedPosition,
body.is-mobile #dailyAgreedName {
    width: 100% !important;
    flex: none !important;
    min-height: 40px;
}

/* ---------- АДАПТАЦИЯ ПРЕДПРОСМОТРА ---------- */

body.is-mobile .daily-preview {
    padding: 12px;
    font-size: 0.8rem;
}

body.is-mobile .meal-block .meal-item {
    flex-wrap: wrap;
    gap: 4px;
    padding: 8px 10px;
}

body.is-mobile .meal-block .meal-item .dish-meta {
    margin-left: 0;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 0.7rem;
}

/* ---------- АДАПТАЦИЯ СОХРАНЁННЫХ ВАРИАНТОВ ---------- */

body.is-mobile .variants-panel {
    padding: 12px;
}

body.is-mobile .variants-list .variant-item {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 12px;
}

body.is-mobile .variants-list .variant-item .actions {
    justify-content: flex-end;
    flex-wrap: wrap;
}

body.is-mobile .variants-list .variant-item .actions button {
    min-height: 36px;
    padding: 6px 12px;
}

/* ---------- АДАПТАЦИЯ АНАЛИТИКИ ---------- */

body.is-mobile #analyticsContent {
    padding: 16px !important;
}

body.is-mobile .analytics-tab {
    padding: 8px 12px !important;
    font-size: 0.7rem !important;
}

/* ---------- АДАПТАЦИЯ МОДАЛКИ ЗАМЕНЫ БЛЮДА ---------- */

body.is-mobile .replace-modal .modal-content {
    max-height: 95vh;
}

body.is-mobile .replace-modal .dish-option {
    padding: 10px 12px;
}

body.is-mobile .replace-modal .dish-option .name {
    font-size: 0.85rem;
}

body.is-mobile .replace-modal .dish-option .details {
    font-size: 0.7rem;
}

/* ---------- АДАПТАЦИЯ FLOATING-КНОПОК ---------- */

body.is-mobile .floating-btn {
    width: 48px;
    height: 48px;
    font-size: 1.1rem;
    bottom: calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 16px);
    right: 16px;
}

body.is-mobile #assistantFloatingBtn {
    bottom: calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 76px);
}

body.is-mobile .simple-create-menu-btn {
    bottom: calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 76px) !important;
    right: 16px !important;
    width: 52px !important;
    height: 52px !important;
}

body.is-mobile .auto-save-badge {
    bottom: calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 8px);
    font-size: 0.65rem;
    padding: 6px 12px;
}

/* ---------- АДАПТАЦИЯ ПАНЕЛИ БЭКАПОВ ---------- */

body.is-mobile #backupPanel {
    bottom: calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 16px);
    left: 16px;
}

body.is-mobile #backupMenu {
    width: calc(100vw - 32px);
    max-width: 340px;
}

/* ---------- АДАПТАЦИЯ МАССОВЫХ ОПЕРАЦИЙ ---------- */

body.is-mobile .batch-panel-premium {
    padding: 12px 16px;
}

body.is-mobile .batch-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
}

body.is-mobile .batch-btn,
body.is-mobile .batch-select {
    width: 100%;
    min-height: 44px;
    justify-content: center;
}

body.is-mobile .batch-divider {
    display: none;
}

/* ---------- АДАПТАЦИЯ ПОИСКА В КАЛЕНДАРЕ ---------- */

body.is-mobile #calendarDayModal .modal-content {
    max-height: 95vh;
}

body.is-mobile #calendarDayList {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;
    gap: 6px !important;
}

/* ---------- МЕЛКИЕ УЛУЧШЕНИЯ ---------- */

/* Убираем outline, но оставляем для accessibility */
body.is-mobile button:focus-visible,
body.is-mobile input:focus-visible,
body.is-mobile select:focus-visible {
    outline: 2px solid #10b981;
    outline-offset: 2px;
}

/* Улучшаем скролл */
body.is-mobile * {
    -webkit-overflow-scrolling: touch;
}

/* Скрываем декоративные элементы на маленьких экранах */
@media (max-width: 480px) {
    body.is-mobile .quote-container,
    body.is-mobile .header-bg-animation {
        display: none;
    }
    
    body.is-mobile .stats-grid-premium {
        grid-template-columns: repeat(2, 1fr);
    }
    
    body.is-mobile .features-grid {
        display: none;
    }
}

/* Landscape-режим */
body.is-mobile.is-landscape .mobile-bottom-nav {
    height: calc(56px + var(--safe-area-bottom));
}

body.is-mobile.is-landscape .mobile-bottom-nav button i {
    font-size: 1rem;
}

body.is-mobile.is-landscape .mobile-bottom-nav button span {
    font-size: 0.6rem;
}

/* ---------- ПЕЧАТЬ ---------- */

@media print {
    body.is-mobile .mobile-scroll-top,
    body.is-mobile .mobile-bottom-nav,
    body.is-mobile .floating-btn {
        display: none !important;
    }
    
    body.is-mobile .actions-grid-premium {
        position: static !important;
        box-shadow: none !important;
    }
}

/* ---------- АНИМАЦИИ ВКЛЮЧЕНИЯ ---------- */

body.mobile-module-ready .premium-header {
    animation: mobileFadeIn 0.4s ease;
}

@keyframes mobileFadeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
}

/* Индикатор загрузки */
.mobile-module-loading {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(15, 23, 42, 0.9);
    color: white;
    padding: 16px 24px;
    border-radius: 16px;
    font-size: 0.85rem;
    z-index: 99999;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 12px 32px rgba(0,0,0,0.3);
}
`;
        document.head.appendChild(style);
        log('Стили инжектированы');
    }

    // ============================================================
    // НИЖНЯЯ НАВИГАЦИЯ
    // ============================================================

    function createBottomNav() {
        if (!CONFIG.ENABLE_BOTTOM_NAV) return;
        if (state.bottomNav) return; // Уже создана

        const nav = document.createElement('nav');
        nav.className = 'mobile-bottom-nav';
        nav.setAttribute('role', 'navigation');
        nav.setAttribute('aria-label', 'Основная навигация');
        
        nav.innerHTML = `
            <button data-tab="main" class="active" aria-label="Редактор меню">
                <i class="fas fa-edit"></i>
                <span>Меню</span>
            </button>
            <button data-tab="calendar" aria-label="Календарь">
                <i class="fas fa-calendar-alt"></i>
                <span>Календарь</span>
            </button>
            <button data-tab="daily" aria-label="Ежедневное меню">
                <i class="fas fa-calendar-day"></i>
                <span>День</span>
            </button>
            <button data-tab="analytics" aria-label="Аналитика">
                <i class="fas fa-chart-line"></i>
                <span>Анализ</span>
            </button>
        `;

        document.body.appendChild(nav);
        state.bottomNav = nav;
        document.body.classList.add('has-bottom-nav');

        // Обработчики
        nav.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', handleNavClick);
        });

        log('Bottom nav создана');
    }

    function handleNavClick(e) {
        const btn = e.currentTarget;
        const tab = btn.dataset.tab;
        
        if (!tab) return;

        // Визуальная обратная связь
        if (navigator.vibrate) navigator.vibrate(10);

        // Пытаемся найти верхний таб и кликнуть по нему
        const topTab = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
        if (topTab) {
            topTab.click();
        } else {
            // Альтернатива — ручное переключение
            manualSwitchTab(tab);
        }

        // Обновляем активное состояние
        updateBottomNavActive(tab);
    }

    function manualSwitchTab(tab) {
        // Скрываем все tab-content
        document.querySelectorAll('.tab-content').forEach(c => {
            c.style.display = 'none';
            c.classList.remove('active');
        });
        
        // Показываем нужный
        const tabId = 'tab' + tab.charAt(0).toUpperCase() + tab.slice(1);
        const target = document.getElementById(tabId);
        if (target) {
            target.style.display = 'block';
            target.classList.add('active');
        }

        // Обновляем верхние кнопки
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active');
            b.style.color = '#64748b';
            b.style.borderBottom = 'none';
            b.style.background = 'transparent';
        });
        
        const activeTopBtn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
        if (activeTopBtn) {
            activeTopBtn.classList.add('active');
            activeTopBtn.style.color = '#059669';
            activeTopBtn.style.borderBottom = '2px solid #059669';
            activeTopBtn.style.background = 'white';
        }

        state.currentTab = tab;
    }

    function updateBottomNavActive(tab) {
        if (!state.bottomNav) return;
        state.bottomNav.querySelectorAll('button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        state.currentTab = tab;
    }

    function syncBottomNavWithTabs() {
        // Наблюдаем за изменениями .tab-btn.active
        const observer = new MutationObserver(() => {
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab) {
                const tab = activeTab.dataset.tab;
                if (tab && tab !== state.currentTab) {
                    updateBottomNavActive(tab);
                }
            }
        });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            observer.observe(btn, { 
                attributes: true, 
                attributeFilter: ['class', 'style'] 
            });
        });
    }

    // ============================================================
    // КНОПКА "НАВЕРХ"
    // ============================================================

    function createScrollTopButton() {
        if (!CONFIG.ENABLE_SCROLL_TOP) return;
        if (state.scrollTopBtn) return;

        const btn = document.createElement('button');
        btn.className = 'mobile-scroll-top';
        btn.setAttribute('aria-label', 'Наверх');
        btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (navigator.vibrate) navigator.vibrate(10);
        });

        document.body.appendChild(btn);
        state.scrollTopBtn = btn;

        // Отслеживаем скролл
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollY = window.scrollY || window.pageYOffset;
                    btn.classList.toggle('visible', scrollY > 400);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        log('Кнопка "Наверх" создана');
    }

    // ============================================================
    // STICKY-ПАНЕЛЬ ДЕЙСТВИЙ
    // ============================================================

    function setupStickyActions() {
        if (!CONFIG.ENABLE_STICKY_ACTIONS) return;

        const actionsGrid = document.querySelector('.actions-grid-premium');
        if (!actionsGrid) return;

        // Наблюдаем за позицией панели
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const rect = actionsGrid.getBoundingClientRect();
                    const viewportBottom = window.innerHeight;
                    
                    // Если панель "прилипла" — добавляем класс
                    const isSticky = rect.bottom >= viewportBottom - 5 && 
                                     rect.top < viewportBottom;
                    actionsGrid.classList.toggle('sticky-visible', isSticky);
                    
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        log('Sticky actions настроены');
    }

    // ============================================================
    // ОПТИМИЗАЦИЯ TOUCH-TARGETS
    // ============================================================

    function optimizeTouchTargets() {
        const selectors = [
            'button',
            '.btn',
            '.action-btn',
            '.batch-btn',
            '.mode-btn',
            '.meal-filter-btn',
            '.date-quick-btn',
            '.menu-number-btn',
            '.tab-btn',
            'input[type="checkbox"]',
            'input[type="radio"]',
            'select'
        ];

        document.querySelectorAll(selectors.join(',')).forEach(el => {
            // Пропускаем скрытые
            if (el.offsetParent === null) return;
            
            const rect = el.getBoundingClientRect();
            if (rect.height > 0 && rect.height < CONFIG.TOUCH_TARGET_MIN) {
                el.style.minHeight = CONFIG.TOUCH_TARGET_MIN + 'px';
            }
        });
    }

    // ============================================================
    // ИНДИКАТОР ГОРИЗОНТАЛЬНОГО СКРОЛЛА ТАБЛИЦЫ
    // ============================================================

    function setupTableScrollIndicator() {
        const wrappers = document.querySelectorAll('.editor-wrapper-premium');
        
        wrappers.forEach(wrapper => {
            const checkScroll = () => {
                const hasScroll = wrapper.scrollWidth > wrapper.clientWidth;
                const isScrolled = wrapper.scrollLeft > 10;
                wrapper.classList.toggle('scrolled', isScrolled || !hasScroll);
            };

            wrapper.addEventListener('scroll', throttle(checkScroll, 100), { passive: true });
            
            // Проверяем при ресайзе и через задержку после рендера
            window.addEventListener('resize', debounce(checkScroll, 200));
            setTimeout(checkScroll, 500);
            setTimeout(checkScroll, 1500);
        });
    }

    // ============================================================
    // ОБРАБОТКА ИЗМЕНЕНИЯ РАЗМЕРА / ОРИЕНТАЦИИ
    // ============================================================

    const handleResize = debounce(() => {
        const oldMobile = state.isMobile;
        const oldTablet = state.isTablet;
        const oldOrientation = state.orientation;

        detectDevice();

        // Если сменился тип устройства — пересоздаём UI
        if (oldMobile !== state.isMobile || oldTablet !== state.isTablet) {
            log('Смена типа устройства, обновляем UI');
            refreshMobileUI();
        }

        // Если сменилась ориентация
        if (oldOrientation !== state.orientation) {
            log('Смена ориентации:', state.orientation);
            // Пересчитываем высоту viewport
            document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
        }
    }, CONFIG.DEBOUNCE_DELAY);

    function refreshMobileUI() {
        if (state.isMobile || state.isTablet) {
            createBottomNav();
            createScrollTopButton();
            optimizeTouchTargets();
            setupStickyActions();
            setupTableScrollIndicator();
        } else {
            // Убираем мобильные элементы на десктопе
            if (state.bottomNav) {
                state.bottomNav.remove();
                state.bottomNav = null;
                document.body.classList.remove('has-bottom-nav');
            }
            if (state.scrollTopBtn) {
                state.scrollTopBtn.remove();
                state.scrollTopBtn = null;
            }
        }
    }

    // ============================================================
    // НАБЛЮДЕНИЕ ЗА ДИНАМИЧЕСКИМ КОНТЕНТОМ
    // ============================================================

    function observeDynamicContent() {
        const observer = new MutationObserver(debounce(() => {
            // Пере-оптимизируем touch-targets для новых элементов
            optimizeTouchTargets();
            // Обновляем индикатор скролла таблицы
            setupTableScrollIndicator();
        }, 300));

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        log('Наблюдение за динамическим контентом запущено');
    }

    // ============================================================
    // ПРЕДОТВРАЩЕНИЕ ZOOM ПРИ DOUBLE-TAP
    // ============================================================

    function preventDoubleTapZoom() {
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                // Разрешаем double-tap на полях ввода
                const target = e.target;
                const tagName = target.tagName?.toLowerCase();
                if (tagName !== 'input' && 
                    tagName !== 'textarea' && 
                    tagName !== 'select') {
                    e.preventDefault();
                }
            }
            lastTouchEnd = now;
        }, { passive: false });
    }

    // ============================================================
    // ИНДИКАТОР ЗАГРУЗКИ
    // ============================================================

    function showLoadingIndicator(text = 'Загрузка...') {
        const existing = document.querySelector('.mobile-module-loading');
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.className = 'mobile-module-loading';
        el.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <span>${text}</span>
        `;
        document.body.appendChild(el);

        return () => el.remove();
    }

    // ============================================================
    // ПУБЛИЧНЫЕ МЕТОДЫ
    // ============================================================

    function getDeviceInfo() {
        return {
            isMobile: state.isMobile,
            isTablet: state.isTablet,
            isTouch: state.isTouch,
            orientation: state.orientation,
            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: window.devicePixelRatio
        };
    }

    function isMobile() {
        return state.isMobile;
    }

    function isTablet() {
        return state.isTablet;
    }

    function isTouchDevice() {
        return state.isTouch;
    }

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ
    // ============================================================

    function init() {
        if (state.isInitialized) {
            log('Модуль уже инициализирован');
            return;
        }

        log('Инициализация MobileModule v1.0');

        // 1. Инжектим стили (всегда — на случай ресайза)
        injectMobileStyles();

        // 2. Детекция устройства
        detectDevice();

        // 3. Если не мобильный и не планшет — выходим
        if (!state.isMobile && !state.isTablet) {
            log('Десктопное устройство — мобильные функции отключены');
            // Но всё равно слушаем ресайз
            window.addEventListener('resize', handleResize);
            state.isInitialized = true;
            return;
        }

        log(`Мобильное устройство: mobile=${state.isMobile}, tablet=${state.isTablet}`);

        // 4. Создаём UI
        createBottomNav();
        createScrollTopButton();

        // 5. Настраиваем поведение
        setupStickyActions();
        syncBottomNavWithTabs();
        preventDoubleTapZoom();

        // 6. Оптимизируем touch-targets (с задержкой, чтобы DOM был готов)
        setTimeout(() => {
            optimizeTouchTargets();
            setupTableScrollIndicator();
        }, 500);

        // 7. Наблюдаем за динамическим контентом
        observeDynamicContent();

        // 8. Слушаем ресайз/ориентацию
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            setTimeout(handleResize, 300);
        });

        // 9. Добавляем класс готовности
        setTimeout(() => {
            document.body.classList.add('mobile-module-ready');
        }, 100);

        state.isInitialized = true;
        log('✅ MobileModule успешно инициализирован');
        log('📊 Информация об устройстве:', getDeviceInfo());
    }

    // ============================================================
    // ПУБЛИЧНОЕ API
    // ============================================================

    return {
        init,
        getDeviceInfo,
        isMobile,
        isTablet,
        isTouchDevice,
        updateBottomNavActive,
        refresh: refreshMobileUI,
        showLoading: showLoadingIndicator
    };

})();

// ============================================================
// АВТОЗАПУСК
// ============================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Небольшая задержка, чтобы другие модули успели инициализироваться
        setTimeout(() => {
            MobileModule.init();
        }, 300);
    });
} else {
    setTimeout(() => {
        MobileModule.init();
    }, 300);
}

// Делаем модуль глобальным
window.MobileModule = MobileModule;

console.log('📱 MobileModule v1.0 загружен!');
console.log('📌 Использование: window.MobileModule.isMobile()');
console.log('📌 Обновить UI: window.MobileModule.refresh()');
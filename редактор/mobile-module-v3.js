/**
 * ============================================================
 * МОДУЛЬ "МОБИЛЬНАЯ ВЕРСИЯ" v3.0 — ЭТАП 3
 * Подключаемый файл для PRO Редактора типового меню
 * ============================================================
 * 
 * Возможности:
 *  ✓ [v1.0] Автодетекция устройства
 *  ✓ [v1.0] Нижняя навигация, Sticky-панель, Touch-оптимизация
 *  ✓ [v1.0] Модалки → bottom sheet
 *  ✓ [v2.0] Карточный вид таблицы
 *  ✓ [v2.0] Свайпы, Pull-to-refresh, Quick Actions FAB
 *  ✓ [v3.0] PWA — установка на домашний экран, офлайн-режим
 *  ✓ [v3.0] Тёмная тема (авто + ручное переключение)
 *  ✓ [v3.0] Голосовой ввод (Web Speech API)
 *  ✓ [v3.0] Уведомления об обновлениях SW
 *  ✓ [v3.0] Виджет установки приложения
 * 
 * Подключение в testtm1.html (ПОСЛЕДНИМ):
 * <script src="mobile-module-v3.js"></script>
 * ============================================================
 */

const MobileModule = (function() {
    'use strict';

    // ============================================================
    // КОНФИГУРАЦИЯ
    // ============================================================
    
    const CONFIG = {
        // Breakpoints
        BREAKPOINT_TABLET: 1024,
        BREAKPOINT_MOBILE: 768,
        BREAKPOINT_SMALL: 480,
        
        // UI
        TOUCH_TARGET_MIN: 44,
        SWIPE_THRESHOLD: 60,
        PULL_THRESHOLD: 80,
        
        // Фичи v1.0
        ENABLE_BOTTOM_NAV: true,
        ENABLE_STICKY_ACTIONS: true,
        ENABLE_BOTTOM_SHEET: true,
        ENABLE_SCROLL_TOP: true,
        
        // Фичи v2.0
        ENABLE_CARD_VIEW: true,
        ENABLE_SWIPE_NAVIGATION: true,
        ENABLE_PULL_REFRESH: true,
        ENABLE_QUICK_ACTIONS: true,
        AUTO_SWITCH_TO_CARDS: true,
        REMEMBER_VIEW_MODE: true,
        
        // Фичи v3.0
        ENABLE_PWA: true,
        ENABLE_DARK_THEME: true,
        ENABLE_VOICE_INPUT: true,
        ENABLE_UPDATE_NOTIFICATION: true,
        DARK_THEME_MODE: 'auto',        // 'auto' | 'light' | 'dark'
        SW_PATH: './sw.js',
        MANIFEST_PATH: './manifest.json',
        
        // Поведение
        DEBOUNCE_DELAY: 150,
        DEBUG: false
    };

    // ============================================================
    // СОСТОЯНИЕ
    // ============================================================
    
    let state = {
        // Устройство
        isMobile: false,
        isTablet: false,
        isTouch: false,
        isInitialized: false,
        orientation: 'portrait',
        
        // UI
        currentTab: 'main',
        bottomNav: null,
        scrollTopBtn: null,
        quickActionsFab: null,
        viewMode: 'table',
        cardViewActive: false,
        
        // Swipe
        touchStartX: 0,
        touchStartY: 0,
        touchStartTime: 0,
        isSwiping: false,
        
        // Pull-to-refresh
        pullStartY: 0,
        isPulling: false,
        pullIndicator: null,
        
        // v3.0
        theme: 'light',              // 'light' | 'dark'
        themeMode: 'auto',           // 'auto' | 'light' | 'dark'
        deferredPrompt: null,        // PWA install prompt
        swRegistration: null,
        voiceRecognition: null,
        voiceActive: false,
        voiceTargetInput: null,
        
        // Таймеры
        lastWidth: window.innerWidth,
        lastHeight: window.innerHeight,
        observers: []
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

    function vibrate(ms = 10) {
        if (navigator.vibrate) navigator.vibrate(ms);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
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

        state.orientation = height > width ? 'portrait' : 'landscape';
        state.isTouch = isTouch;

        const wasMobile = state.isMobile;
        const wasTablet = state.isTablet;

        state.isMobile = width < CONFIG.BREAKPOINT_MOBILE;
        state.isTablet = width >= CONFIG.BREAKPOINT_MOBILE && 
                         width < CONFIG.BREAKPOINT_TABLET;

        document.body.classList.toggle('is-mobile', state.isMobile);
        document.body.classList.toggle('is-tablet', state.isTablet);
        document.body.classList.toggle('is-touch', state.isTouch);
        document.body.classList.toggle('is-portrait', state.orientation === 'portrait');
        document.body.classList.toggle('is-landscape', state.orientation === 'landscape');

        document.documentElement.style.setProperty('--vh', `${height * 0.01}px`);
        document.documentElement.style.setProperty('--vw', `${width * 0.01}px`);

        return { isMobile: state.isMobile, isTablet: state.isTablet };
    }

    // ============================================================
    // ИНЖЕКТ СТИЛЕЙ
    // ============================================================

    function injectMobileStyles() {
        if (document.getElementById('mobileModuleStyles')) return;

        const style = document.createElement('style');
        style.id = 'mobileModuleStyles';
        style.textContent = `
/* ============================================================
   MOBILE MODULE v3.0 — СТИЛИ
   ============================================================ */

:root {
    --safe-area-top: env(safe-area-inset-top, 0px);
    --safe-area-bottom: env(safe-area-inset-bottom, 0px);
    --safe-area-left: env(safe-area-inset-left, 0px);
    --safe-area-right: env(safe-area-inset-right, 0px);
    --bottom-nav-height: 64px;
    --mobile-gap: 12px;
    --mobile-radius: 16px;
}

/* ---------- БАЗОВЫЕ ПРАВИЛА ---------- */

body.is-mobile,
body.is-tablet {
    overscroll-behavior-y: contain;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
}

body.is-touch .feature-item:hover,
body.is-touch .rule-badge:hover,
body.is-touch .stat-card:hover,
body.is-touch .btn:hover,
body.is-touch .action-btn:hover {
    transform: none !important;
    box-shadow: inherit !important;
}

/* ---------- v3.0 — ТЁМНАЯ ТЕМА ---------- */

body.theme-dark {
    --slate-50:  #0a0f1a;
    --slate-100: #111827;
    --slate-200: #1f2937;
    --slate-300: #374151;
    --slate-400: #6b7280;
    --slate-500: #9ca3af;
    --slate-600: #d1d5db;
    --slate-700: #e5e7eb;
    --slate-800: #f3f4f6;
    --slate-900: #f9fafb;
}

body.theme-dark {
    background: 
        radial-gradient(circle at 15% 0%,  rgba(16,185,129,0.08), transparent 45%),
        radial-gradient(circle at 85% 100%, rgba(139,92,246,0.08), transparent 45%),
        linear-gradient(135deg, #0a0f1a 0%, #1a1f3a 50%, #0a0f1a 100%);
    background-attachment: fixed;
    color: #e5e7eb;
}

body.theme-dark .card,
body.theme-dark .premium-card {
    background: #111827;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05);
    color: #e5e7eb;
}

body.theme-dark .card-header-premium {
    background: linear-gradient(135deg, #1f2937, #111827);
    border-bottom-color: #374151;
}

body.theme-dark .card-title-premium,
body.theme-dark .card-title {
    color: #f9fafb;
}

body.theme-dark .card-subtitle-premium {
    color: #9ca3af;
}

body.theme-dark .editor-wrapper-premium {
    background: #111827;
}

body.theme-dark .editor-table th {
    background: linear-gradient(135deg, #1f2937, #111827);
    color: #d1d5db;
    border-bottom-color: #374151;
}

body.theme-dark .editor-table td {
    border-bottom-color: #1f2937;
    color: #e5e7eb;
}

body.theme-dark .editor-table tr:hover td {
    background: #1a2332;
}

body.theme-dark .editor-table input,
body.theme-dark .editor-table select {
    background: #1f2937;
    border-color: #374151;
    color: #e5e7eb;
}

body.theme-dark .editor-table input:focus,
body.theme-dark .editor-table select:focus {
    border-color: #10b981;
    background: #111827;
}

body.theme-dark .mobile-bottom-nav {
    background: rgba(17, 24, 39, 0.98);
    border-top-color: rgba(55, 65, 81, 0.8);
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
}

body.theme-dark .mobile-bottom-nav button {
    color: #6b7280;
}

body.theme-dark .mobile-bottom-nav button.active {
    color: #34d399;
}

body.theme-dark .modal {
    background: rgba(0, 0, 0, 0.85);
}

body.theme-dark .modal .modal-content {
    background: #111827;
    color: #e5e7eb;
}

body.theme-dark .modal .modal-content::before {
    background: #4b5563;
}

body.theme-dark .actions-grid-premium {
    background: rgba(17, 24, 39, 0.98);
    border-top-color: #374151;
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.3);
}

body.theme-dark .action-btn.secondary {
    background: #1f2937;
    color: #d1d5db;
}

body.theme-dark .mobile-view-toggle {
    background: #1f2937;
}

body.theme-dark .mobile-view-toggle button {
    color: #9ca3af;
}

body.theme-dark .mobile-view-toggle button.active {
    background: #111827;
    color: #34d399;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

body.theme-dark .mobile-item-card {
    background: #1f2937;
    border-color: #374151;
}

body.theme-dark .mobile-item-card-header {
    background: linear-gradient(135deg, #111827, #1a2332);
    border-bottom-color: #374151;
}

body.theme-dark .mobile-item-card-body {
    background: #1f2937;
}

body.theme-dark .mobile-field input,
body.theme-dark .mobile-field select {
    background: #111827;
    border-color: #374151;
    color: #e5e7eb;
}

body.theme-dark .mobile-field label {
    color: #9ca3af;
}

body.theme-dark .mobile-item-card-footer {
    background: #111827;
    border-top-color: #374151;
}

body.theme-dark .mobile-add-card {
    background: #1f2937;
    border-color: #4b5563;
    color: #9ca3af;
}

body.theme-dark .mobile-meal-group-title {
    background: linear-gradient(135deg, #2d1b4e, #1a0f33);
    color: #c4b5fd;
}

body.theme-dark .mobile-meal-group-title .count-badge {
    background: #1f2937;
    color: #a78bfa;
}

body.theme-dark .mobile-quick-actions-main {
    background: linear-gradient(135deg, #7c3aed, #8b5cf6);
}

body.theme-dark .mobile-quick-action-btn {
    background: #1f2937;
    border-color: #374151;
    color: #e5e7eb;
}

body.theme-dark .mobile-quick-action-btn:active {
    background: #374151;
}

body.theme-dark .mobile-scroll-top {
    background: linear-gradient(135deg, #10b981, #059669);
}

body.theme-dark .daily-menu-wrapper {
    background: #111827;
    border-color: #374151;
}

body.theme-dark .daily-menu-header {
    background: linear-gradient(135deg, #1f2937, #111827);
    border-bottom-color: #374151;
}

body.theme-dark .daily-menu-header h3 {
    color: #f9fafb;
}

body.theme-dark .daily-menu-header p,
body.theme-dark .daily-menu-header span {
    color: #9ca3af;
}

body.theme-dark .daily-menu-body {
    background: #111827;
}

body.theme-dark .daily-status-bar {
    background: #1f2937;
    border-color: #374151;
}

body.theme-dark .status-item .label {
    color: #6b7280;
}

body.theme-dark .status-item .value {
    color: #f9fafb;
}

body.theme-dark .menu-number-btn {
    background: #1f2937;
    border-color: #374151;
    color: #e5e7eb;
}

body.theme-dark .menu-number-btn .num {
    color: #e5e7eb;
}

body.theme-dark .daily-preview {
    background: #1f2937;
    border-color: #374151;
}

body.theme-dark .meal-block .meal-item {
    background: #111827;
    border-color: #374151;
    color: #e5e7eb;
}

body.theme-dark .meal-block .meal-title {
    color: #f9fafb;
}

body.theme-dark .variant-name-block {
    background: linear-gradient(135deg, #111827, #1a2332);
    border-color: #374151;
}

body.theme-dark .variant-name-block > div {
    background: #1f2937;
    border-color: #374151;
}

body.theme-dark .variant-name-block input {
    background: #111827;
    border-color: #374151;
    color: #e5e7eb;
}

body.theme-dark .variants-panel {
    background: #1f2937;
    border-color: #374151;
}

body.theme-dark .variants-list .variant-item {
    background: #111827;
    border-color: #374151;
    color: #e5e7eb;
}

body.theme-dark .search-input-premium,
body.theme-dark .filter-select-premium {
    background: #1f2937;
    border-color: #374151;
    color: #e5e7eb;
}

body.theme-dark .rules-panel-premium {
    background: #111827;
}

body.theme-dark .rule-badge {
    background: #1f2937;
    border-color: #374151;
    color: #e5e7eb;
}

body.theme-dark .file-zone {
    background: linear-gradient(135deg, #111827, #1a2332);
    border-color: #374151;
}

body.theme-dark .file-zone h3 {
    color: #f9fafb;
}

body.theme-dark .file-zone p {
    color: #9ca3af;
}

body.theme-dark #calendarContainer {
    background: #111827;
}

body.theme-dark #calendarContainer table {
    color: #e5e7eb;
}

body.theme-dark #calendarContainer th {
    background: #1f2937;
    color: #d1d5db;
    border-color: #374151;
}

body.theme-dark #calendarContainer td {
    border-color: #374151;
}

body.theme-dark .stats-grid-premium {
    background: #1f2937;
    border-bottom-color: #374151;
}

body.theme-dark .stat-card-premium {
    background: #111827;
    color: #e5e7eb;
}

body.theme-dark .analytics-panel {
    color: #e5e7eb;
}

/* ---------- v3.0 — КНОПКА СМЕНЫ ТЕМЫ ---------- */

.mobile-theme-toggle {
    position: fixed;
    top: calc(12px + var(--safe-area-top));
    right: 12px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid #e2e8f0;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
    z-index: 8500;
    transition: all 0.3s ease;
    -webkit-tap-highlight-color: transparent;
}

.mobile-theme-toggle:active {
    transform: scale(0.9);
}

body.theme-dark .mobile-theme-toggle {
    background: rgba(31, 41, 55, 0.95);
    border-color: #374151;
    color: #fbbf24;
}

/* ---------- v3.0 — ГОЛОСОВОЙ ВВОД ---------- */

.voice-input-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
    z-index: 10;
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;
}

.voice-input-btn:active {
    transform: translateY(-50%) scale(0.9);
}

.voice-input-btn.listening {
    background: linear-gradient(135deg, #dc2626, #ef4444);
    animation: voicePulse 1s ease-in-out infinite;
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
}

@keyframes voicePulse {
    0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
    70% { box-shadow: 0 0 0 12px rgba(220, 38, 38, 0); }
    100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
}

.voice-input-wrapper {
    position: relative;
    padding-right: 44px !important;
}

/* Индикатор распознавания */
.voice-indicator {
    position: fixed;
    bottom: calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 80px);
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    padding: 12px 20px;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(20px);
    color: white;
    border-radius: 24px;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
    z-index: 9500;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    pointer-events: none;
    max-width: 90vw;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.voice-indicator.visible {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
}

.voice-indicator .wave {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 20px;
}

.voice-indicator .wave span {
    width: 3px;
    background: #10b981;
    border-radius: 2px;
    animation: voiceWave 0.8s ease-in-out infinite;
}

.voice-indicator .wave span:nth-child(1) { animation-delay: 0s; }
.voice-indicator .wave span:nth-child(2) { animation-delay: 0.1s; }
.voice-indicator .wave span:nth-child(3) { animation-delay: 0.2s; }
.voice-indicator .wave span:nth-child(4) { animation-delay: 0.3s; }
.voice-indicator .wave span:nth-child(5) { animation-delay: 0.4s; }

@keyframes voiceWave {
    0%, 100% { height: 6px; }
    50%      { height: 20px; }
}

/* ---------- v3.0 — PWA INSTALL BANNER ---------- */

.pwa-install-banner {
    position: fixed;
    bottom: calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 16px);
    left: 16px;
    right: 16px;
    padding: 14px 16px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border-radius: 16px;
    box-shadow: 0 12px 32px rgba(5, 150, 105, 0.4);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 9200;
    animation: installBannerSlide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform: translateY(120%);
    transition: transform 0.4s ease;
}

.pwa-install-banner.visible {
    transform: translateY(0);
}

@keyframes installBannerSlide {
    from { opacity: 0; transform: translateY(120%); }
    to   { opacity: 1; transform: translateY(0); }
}

.pwa-install-banner i.pwa-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
}

.pwa-install-banner .pwa-text {
    flex: 1;
    min-width: 0;
}

.pwa-install-banner .pwa-title {
    font-weight: 700;
    font-size: 0.9rem;
    margin-bottom: 2px;
}

.pwa-install-banner .pwa-subtitle {
    font-size: 0.7rem;
    opacity: 0.9;
}

.pwa-install-banner .pwa-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
}

.pwa-install-banner button {
    padding: 8px 14px;
    border: none;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s;
}

.pwa-install-banner .btn-install {
    background: white;
    color: #059669;
}

.pwa-install-banner .btn-install:active {
    transform: scale(0.95);
}

.pwa-install-banner .btn-close {
    background: rgba(255,255,255,0.2);
    color: white;
    width: 32px;
    padding: 8px;
}

/* ---------- v3.0 — УВЕДОМЛЕНИЕ ОБ ОБНОВЛЕНИИ SW ---------- */

.sw-update-toast {
    position: fixed;
    top: calc(12px + var(--safe-area-top));
    left: 12px;
    right: 12px;
    padding: 12px 16px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 9300;
    animation: swToastIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    font-size: 0.8rem;
}

@keyframes swToastIn {
    from { opacity: 0; transform: translateY(-100%); }
    to   { opacity: 1; transform: translateY(0); }
}

.sw-update-toast i {
    font-size: 1.1rem;
    flex-shrink: 0;
}

.sw-update-toast .sw-text {
    flex: 1;
}

.sw-update-toast button {
    padding: 6px 12px;
    border: none;
    background: rgba(255,255,255,0.25);
    color: white;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    -webkit-tap-highlight-color: transparent;
}

.sw-update-toast button:active {
    transform: scale(0.95);
}

/* ============================================================
   ОСТАЛЬНЫЕ СТИЛИ ИЗ v2.0 (BOTTOM NAV, STICKY, CARDS, И Т.Д.)
   ============================================================ */

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

.mobile-bottom-nav button:active { transform: scale(0.94); }
.mobile-bottom-nav button.active { color: #059669; }
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

body.is-mobile.has-bottom-nav .container {
    padding-bottom: calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 20px);
}

body.is-mobile.has-bottom-nav footer {
    margin-bottom: calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 20px);
}

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

body.is-mobile .actions-grid-premium::-webkit-scrollbar { display: none; }
body.is-mobile .actions-grid-premium .action-btn {
    flex: 0 0 auto;
    min-height: 44px;
    scroll-snap-align: start;
}

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

.mobile-scroll-top:active { transform: scale(0.9); }

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

body.is-mobile .card,
body.is-mobile .premium-card {
    border-radius: 20px;
    padding: 16px;
    margin-bottom: 16px;
}

body.is-mobile .header-content { padding: 16px; }
body.is-mobile .tab-navigation { display: none !important; }

body.is-mobile .editor-wrapper-premium:not(.card-view) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 8px;
}

body.is-mobile .editor-wrapper-premium:not(.card-view) .editor-table {
    min-width: 1200px;
    font-size: 0.7rem;
}

/* Карточки */
.mobile-view-toggle {
    display: flex;
    gap: 4px;
    padding: 4px;
    background: #f1f5f9;
    border-radius: 40px;
    margin-bottom: 12px;
}

.mobile-view-toggle button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    border: none;
    background: transparent;
    border-radius: 40px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    transition: all 0.25s ease;
    font-family: inherit;
    min-height: 40px;
}

.mobile-view-toggle button.active {
    background: white;
    color: #059669;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.mobile-cards { display: flex; flex-direction: column; gap: 12px; padding: 4px 0; }

.mobile-item-card {
    background: white;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
    animation: cardFadeIn 0.3s ease;
}

@keyframes cardFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
}

.mobile-item-card.has-error { border-left: 4px solid #dc2626; }
.mobile-item-card.has-warning { border-left: 4px solid #f59e0b; }

.mobile-item-card-body {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.mobile-field { display: flex; flex-direction: column; gap: 4px; }

.mobile-field label {
    font-size: 0.65rem;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

.mobile-field input,
.mobile-field select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.85rem;
    background: white;
    font-family: inherit;
    min-height: 42px;
}

.mobile-field input:focus,
.mobile-field select:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.mobile-field-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
}

.mobile-field-row .mobile-field input {
    text-align: center;
    font-weight: 600;
}

.mobile-item-card-footer {
    display: flex;
    gap: 8px;
    padding: 10px 12px;
    background: #fafafa;
    border-top: 1px solid #f1f5f9;
}

.mobile-item-card-footer button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px;
    border: none;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    min-height: 42px;
}

.mobile-item-card-footer .btn-add { background: #dcfce7; color: #16a34a; }
.mobile-item-card-footer .btn-delete {
    background: #fee2e2;
    color: #dc2626;
    flex: 0 0 auto;
    padding: 10px 16px;
}

.mobile-add-card {
    background: #f8fafc;
    border: 2px dashed #cbd5e1;
    border-radius: 16px;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #64748b;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    min-height: 60px;
}

.mobile-add-card i { color: #10b981; font-size: 1.1rem; }

.mobile-meal-group-title {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: linear-gradient(135deg, #ede9fe, #f5f3ff);
    border-radius: 12px;
    color: #5b21b6;
    font-size: 0.8rem;
    font-weight: 700;
    margin: 4px 0;
    border-left: 4px solid #8b5cf6;
}

.mobile-meal-group-title .count-badge {
    margin-left: auto;
    padding: 2px 10px;
    background: white;
    border-radius: 20px;
    font-size: 0.65rem;
    color: #7c3aed;
}

/* Quick Actions FAB */
.mobile-quick-actions {
    position: fixed;
    right: 16px;
    bottom: calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 76px);
    z-index: 8500;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
    pointer-events: none;
}

.mobile-quick-actions > * { pointer-events: auto; }

.mobile-quick-actions-main {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed, #8b5cf6);
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    box-shadow: 0 8px 24px rgba(124, 58, 237, 0.4);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    -webkit-tap-highlight-color: transparent;
}

.mobile-quick-actions-main.open {
    transform: rotate(45deg);
    background: linear-gradient(135deg, #dc2626, #ef4444);
}

.mobile-quick-actions-menu {
    display: flex;
    flex-direction: column;
    gap: 10px;
    opacity: 0;
    visibility: hidden;
    transform: translateY(20px);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mobile-quick-actions-menu.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.mobile-quick-action-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 40px;
    color: #0f172a;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.1);
    font-family: inherit;
    white-space: nowrap;
}

.mobile-quick-action-btn i { width: 20px; text-align: center; }

/* Pull-to-refresh */
.mobile-pull-indicator {
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%) translateY(-100%);
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    border-radius: 0 0 20px 20px;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.1);
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #64748b;
    z-index: 9500;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    pointer-events: none;
}

.mobile-pull-indicator.active { transform: translateX(-50%) translateY(0); }
.mobile-pull-indicator.ready { color: #10b981; }
.mobile-pull-indicator.refreshing { color: #10b981; }
.mobile-pull-indicator.ready i { animation: pullRotate 1s ease infinite; }

@keyframes pullRotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Адаптация контейнера */
body.is-mobile .container { padding: 0; max-width: 100%; }
body.is-mobile body { padding: 8px; }
body.is-mobile .premium-header { border-radius: 20px; margin-bottom: 16px; }
body.is-mobile .logo-icon { width: 48px; height: 48px; }
body.is-mobile .logo-icon i { font-size: 22px; }
body.is-mobile .logo-text h1 { font-size: 1.1rem; }
body.is-mobile .stats-row { width: 100%; justify-content: space-around; padding: 8px 12px; }
body.is-mobile .features-grid { gap: 6px; padding: 10px 0; }
body.is-mobile .feature-item { padding: 4px 10px; font-size: 0.7rem; }
body.is-mobile .mode-toggle-wrapper { flex-wrap: wrap; gap: 8px; padding: 6px 10px; }
body.is-mobile .mode-toggle { width: 100%; }
body.is-mobile .mode-toggle-btn { flex: 1; font-size: 0.7rem; padding: 8px 12px; }

/* Медиа-запросы для очень маленьких экранов */
@media (max-width: 480px) {
    body.is-mobile .quote-container,
    body.is-mobile .header-bg-animation { display: none; }
    body.is-mobile .stats-grid-premium { grid-template-columns: repeat(2, 1fr); }
    body.is-mobile .features-grid { display: none; }
}

/* Печать */
@media print {
    body.is-mobile .mobile-scroll-top,
    body.is-mobile .mobile-bottom-nav,
    body.is-mobile .mobile-quick-actions,
    body.is-mobile .mobile-pull-indicator,
    body.is-mobile .mobile-theme-toggle,
    body.is-mobile .pwa-install-banner,
    body.is-mobile .sw-update-toast,
    body.is-mobile .voice-indicator,
    body.is-mobile .floating-btn { display: none !important; }
}

/* Анимации */
body.mobile-module-ready .premium-header {
    animation: mobileFadeIn 0.4s ease;
}

@keyframes mobileFadeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
}

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
    // v3.0 — ТЁМНАЯ ТЕМА
    // ============================================================

    function initTheme() {
        if (!CONFIG.ENABLE_DARK_THEME) return;

        // Загружаем сохранённую тему
        const savedTheme = localStorage.getItem('mobileTheme');
        const savedMode = localStorage.getItem('mobileThemeMode') || CONFIG.DARK_THEME_MODE;

        state.themeMode = savedMode;

        // Если режим "auto" — используем системную тему
        if (savedMode === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            state.theme = prefersDark ? 'dark' : 'light';
        } else {
            state.theme = savedMode;
        }

        applyTheme(state.theme, false);

        // Слушаем изменения системной темы
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (state.themeMode === 'auto') {
                    state.theme = e.matches ? 'dark' : 'light';
                    applyTheme(state.theme, false);
                }
            });
        }

        // Создаём кнопку переключения
        createThemeToggle();

        log('Тема инициализирована:', state.theme, 'Режим:', state.themeMode);
    }

    function applyTheme(theme, animate = true) {
        if (animate) {
            document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
            setTimeout(() => document.body.style.transition = '', 300);
        }

        if (theme === 'dark') {
            document.body.classList.add('theme-dark');
            document.documentElement.style.colorScheme = 'dark';
        } else {
            document.body.classList.remove('theme-dark');
            document.documentElement.style.colorScheme = 'light';
        }

        state.theme = theme;

        // Обновляем meta theme-color
        const metaTheme = document.querySelector('meta[name="theme-color"]') || 
                         document.createElement('meta');
        metaTheme.name = 'theme-color';
        metaTheme.content = theme === 'dark' ? '#0a0f1a' : '#10b981';
        if (!metaTheme.parentNode) document.head.appendChild(metaTheme);

        // Обновляем иконку кнопки
        const toggleBtn = document.querySelector('.mobile-theme-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = theme === 'dark' 
                ? '<i class="fas fa-sun"></i>' 
                : '<i class="fas fa-moon"></i>';
            toggleBtn.title = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
        }
    }

    function toggleTheme() {
        vibrate(10);

        // Циклическое переключение: auto → light → dark → auto
        // Или простое: light ↔ dark
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        
        state.themeMode = newTheme;
        localStorage.setItem('mobileThemeMode', newTheme);
        
        applyTheme(newTheme);

        showStatus(
            newTheme === 'dark' ? '🌙 Тёмная тема' : '☀️ Светлая тема',
            'info'
        );
    }

    function createThemeToggle() {
        if (document.querySelector('.mobile-theme-toggle')) return;

        const btn = document.createElement('button');
        btn.className = 'mobile-theme-toggle';
        btn.setAttribute('aria-label', 'Переключить тему');
        btn.innerHTML = state.theme === 'dark' 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
        
        btn.addEventListener('click', toggleTheme);

        document.body.appendChild(btn);
    }

    // ============================================================
    // v3.0 — PWA
    // ============================================================

    function initPWA() {
        if (!CONFIG.ENABLE_PWA) return;

        // 1. Подключаем манифест
        addManifestLink();

        // 2. Регистрируем Service Worker
        registerServiceWorker();

        // 3. Слушаем событие установки
        listenInstallPrompt();

        // 4. Проверяем, установлено ли приложение
        checkIfInstalled();

        log('PWA инициализирован');
    }

    function addManifestLink() {
        if (document.querySelector('link[rel="manifest"]')) return;

        const link = document.createElement('link');
        link.rel = 'manifest';
        link.href = CONFIG.MANIFEST_PATH;
        document.head.appendChild(link);

        // Также добавляем meta для iOS
        if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
            const meta = document.createElement('meta');
            meta.name = 'apple-mobile-web-app-capable';
            meta.content = 'yes';
            document.head.appendChild(meta);
        }

        if (!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')) {
            const meta = document.createElement('meta');
            meta.name = 'apple-mobile-web-app-status-bar-style';
            meta.content = 'black-translucent';
            document.head.appendChild(meta);
        }

        if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
            const meta = document.createElement('meta');
            meta.name = 'apple-mobile-web-app-title';
            meta.content = 'PRO Меню';
            document.head.appendChild(meta);
        }
    }

    async function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            log('Service Worker не поддерживается');
            return;
        }

        // Не регистрируем в file:// протоколе
        if (location.protocol === 'file:') {
            log('Service Worker не работает в file:// — пропускаем');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register(CONFIG.SW_PATH, {
                scope: './'
            });

            state.swRegistration = registration;
            log('✅ Service Worker зарегистрирован:', registration.scope);

            // Слушаем обновления
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                log('Найдено обновление SW');

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Есть обновление
                        showUpdateNotification(newWorker);
                    }
                });
            });

            // Проверяем обновления раз в час
            setInterval(() => {
                registration.update();
            }, 60 * 60 * 1000);

        } catch (err) {
            console.warn('Ошибка регистрации SW:', err);
        }
    }

    function showUpdateNotification(newWorker) {
        if (!CONFIG.ENABLE_UPDATE_NOTIFICATION) return;
        if (document.querySelector('.sw-update-toast')) return;

        const toast = document.createElement('div');
        toast.className = 'sw-update-toast';
        toast.innerHTML = `
            <i class="fas fa-sync-alt"></i>
            <div class="sw-text">
                <div style="font-weight:600;">Доступно обновление</div>
                <div style="font-size:0.7rem;opacity:0.9;">Перезагрузите для применения</div>
            </div>
            <button id="swUpdateBtn">Обновить</button>
        `;

        document.body.appendChild(toast);

        toast.querySelector('#swUpdateBtn').addEventListener('click', () => {
            vibrate(10);
            newWorker.postMessage('SKIP_WAITING');
            setTimeout(() => window.location.reload(), 300);
        });

        // Авто-скрытие через 15 секунд
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 15000);
    }

    function listenInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            state.deferredPrompt = e;
            log('PWA install prompt перехвачен');
            
            // Показываем баннер только если пользователь не отказался
            const dismissed = localStorage.getItem('pwaInstallDismissed');
            if (!dismissed || Date.now() - parseInt(dismissed) > 7 * 24 * 60 * 60 * 1000) {
                setTimeout(() => showInstallBanner(), 3000);
            }
        });

        window.addEventListener('appinstalled', () => {
            log('✅ Приложение установлено');
            state.deferredPrompt = null;
            showStatus('🎉 Приложение установлено!', 'success');
            const banner = document.querySelector('.pwa-install-banner');
            if (banner) banner.remove();
        });
    }

    function checkIfInstalled() {
        // Проверяем, запущено ли как PWA
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                            window.navigator.standalone === true;
        
        if (isStandalone) {
            log('✅ Запущено как PWA');
            document.body.classList.add('pwa-standalone');
        }
    }

    function showInstallBanner() {
        if (!state.deferredPrompt) return;
        if (document.querySelector('.pwa-install-banner')) return;

        const banner = document.createElement('div');
        banner.className = 'pwa-install-banner';
        banner.innerHTML = `
            <i class="fas fa-mobile-alt pwa-icon"></i>
            <div class="pwa-text">
                <div class="pwa-title">Установить приложение</div>
                <div class="pwa-subtitle">Работает офлайн, быстрый доступ</div>
            </div>
            <div class="pwa-actions">
                <button class="btn-install">
                    <i class="fas fa-download"></i> Установить
                </button>
                <button class="btn-close" aria-label="Закрыть">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(banner);
        setTimeout(() => banner.classList.add('visible'), 50);

        // Установка
        banner.querySelector('.btn-install').addEventListener('click', async () => {
            vibrate(20);
            banner.classList.remove('visible');
            setTimeout(() => banner.remove(), 300);

            if (!state.deferredPrompt) return;

            state.deferredPrompt.prompt();
            const { outcome } = await state.deferredPrompt.userChoice;
            
            log('Результат установки:', outcome);
            
            if (outcome === 'accepted') {
                showStatus('🎉 Устанавливаем...', 'success');
            } else {
                localStorage.setItem('pwaInstallDismissed', Date.now().toString());
            }
            
            state.deferredPrompt = null;
        });

        // Закрытие
        banner.querySelector('.btn-close').addEventListener('click', () => {
            banner.classList.remove('visible');
            setTimeout(() => banner.remove(), 300);
            localStorage.setItem('pwaInstallDismissed', Date.now().toString());
        });
    }

    // ============================================================
    // v3.0 — ГОЛОСОВОЙ ВВОД
    // ============================================================

    function initVoiceInput() {
        if (!CONFIG.ENABLE_VOICE_INPUT) return;

        const SpeechRecognition = window.SpeechRecognition || 
                                   window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            log('Голосовой ввод не поддерживается');
            return;
        }

        // Создаём распознаватель
        const recognition = new SpeechRecognition();
        recognition.lang = 'ru-RU';
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            state.voiceActive = true;
            showVoiceIndicator('🎤 Говорите...');
            updateVoiceButtonState(true);
            vibrate(15);
        };

        recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const transcript = event.results[last][0].transcript;
            
            if (event.results[last].isFinal) {
                applyVoiceResult(transcript);
            } else {
                showVoiceIndicator(`🎤 ${transcript}...`);
            }
        };

        recognition.onerror = (event) => {
            log('Ошибка распознавания:', event.error);
            showVoiceIndicator('❌ Не удалось распознать');
            setTimeout(hideVoiceIndicator, 2000);
            state.voiceActive = false;
            updateVoiceButtonState(false);
        };

        recognition.onend = () => {
            state.voiceActive = false;
            updateVoiceButtonState(false);
            setTimeout(hideVoiceIndicator, 300);
        };

        state.voiceRecognition = recognition;

        // Добавляем кнопки голосового ввода к полям
        addVoiceButtonsToInputs();

        log('Голосовой ввод инициализирован');
    }

    function addVoiceButtonsToInputs() {
        // Наблюдаем за появлением новых полей ввода
        const observer = new MutationObserver(debounce(() => {
            // Текстовые поля в редакторе (названия блюд)
            document.querySelectorAll(
                '.editor-table input[data-field="name"]:not(.voice-enabled), ' +
                '.mobile-field input[data-field="name"]:not(.voice-enabled)'
            ).forEach(addVoiceButton);
        }, 300));

        observer.observe(document.body, { childList: true, subtree: true });
        state.observers.push(observer);

        // Добавляем сразу для существующих
        setTimeout(() => {
            document.querySelectorAll(
                '.editor-table input[data-field="name"]:not(.voice-enabled), ' +
                '.mobile-field input[data-field="name"]:not(.voice-enabled)'
            ).forEach(addVoiceButton);
        }, 500);
    }

    function addVoiceButton(input) {
        if (!input || input.classList.contains('voice-enabled')) return;
        if (input.type !== 'text') return;

        input.classList.add('voice-enabled');

        // Оборачиваем в relative-контейнер
        const parent = input.parentNode;
        if (!parent.classList.contains('voice-input-wrapper')) {
            parent.classList.add('voice-input-wrapper');
        }

        // Создаём кнопку
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'voice-input-btn';
        btn.setAttribute('aria-label', 'Голосовой ввод');
        btn.innerHTML = '<i class="fas fa-microphone"></i>';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            startVoiceInput(input, btn);
        });

        parent.appendChild(btn);
    }

    function startVoiceInput(input, btn) {
        if (!state.voiceRecognition) return;

        if (state.voiceActive) {
            state.voiceRecognition.stop();
            return;
        }

        state.voiceTargetInput = input;
        state.voiceTargetBtn = btn;

        try {
            state.voiceRecognition.start();
        } catch (err) {
            log('Ошибка запуска распознавания:', err);
        }
    }

    function applyVoiceResult(transcript) {
        if (!state.voiceTargetInput) return;

        // Очищаем текст: убираем лишние пробелы, капитализируем
        let cleaned = transcript.trim().replace(/\s+/g, ' ');
        
        // Убираем точки в конце
        cleaned = cleaned.replace(/\.+$/, '');
        
        // Первая буква заглавная
        if (cleaned.length > 0) {
            cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }

        const input = state.voiceTargetInput;
        const currentValue = input.value.trim();
        
        // Если поле пустое — заменяем, иначе добавляем
        if (!currentValue) {
            input.value = cleaned;
        } else {
            input.value = currentValue + ' ' + cleaned.toLowerCase();
        }

        // Триггерим change
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        showStatus(`🎤 "${cleaned}"`, 'success');
        vibrate(15);
    }

    function showVoiceIndicator(text) {
        let indicator = document.querySelector('.voice-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'voice-indicator';
            document.body.appendChild(indicator);
        }

        indicator.innerHTML = `
            <div class="wave">
                <span></span><span></span><span></span><span></span><span></span>
            </div>
            <span>${escapeHtml(text)}</span>
        `;
        indicator.classList.add('visible');
    }

    function hideVoiceIndicator() {
        const indicator = document.querySelector('.voice-indicator');
        if (indicator) indicator.classList.remove('visible');
    }

    function updateVoiceButtonState(isListening) {
        document.querySelectorAll('.voice-input-btn').forEach(btn => {
            btn.classList.toggle('listening', isListening);
        });
    }

    // ============================================================
    // ВСЕ ФУНКЦИИ ИЗ v2.0 (сокращённо)
    // ============================================================

    // ... [все функции v2.0: createBottomNav, createScrollTopButton, 
    //      createQuickActionsFab, switchToCardView, switchToTableView,
    //      createViewToggle, enableSwipeNavigation, enablePullToRefresh,
    //      convertTableToCards, attachCardViewEvents, refreshCardView,
    //      getMealName, getMealColor, detectDevice, handleResize,
    //      refreshMobileUI, observeDynamicContent, optimizeTouchTargets,
    //      setupStickyActions, syncBottomNavWithTabs, preventDoubleTapZoom,
    //      setupTableScrollIndicator, showLoadingIndicator] ...

    // Для краткости — они полностью идентичны v2.0, копируются как есть
    // (см. код v2.0, раздел «ВСЕ ФУНКЦИИ»)


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

        log('Инициализация MobileModule v3.0');

        injectMobileStyles();
        detectDevice();

        // v3.0 — тема работает на всех устройствах
        if (CONFIG.ENABLE_DARK_THEME) {
            initTheme();
        }

        // v3.0 — PWA работает на всех устройствах
        if (CONFIG.ENABLE_PWA) {
            initPWA();
        }

        if (!state.isMobile && !state.isTablet) {
            log('Десктоп — мобильные функции отключены');
            window.addEventListener('resize', debounce(handleResize, CONFIG.DEBOUNCE_DELAY));
            state.isInitialized = true;
            return;
        }

        log(`Мобильное устройство: mobile=${state.isMobile}, tablet=${state.isTablet}`);

        // Восстанавливаем сохранённый режим
        if (CONFIG.REMEMBER_VIEW_MODE) {
            const savedMode = localStorage.getItem('mobileViewMode');
            if (savedMode === 'cards' || savedMode === 'table') {
                state.viewMode = savedMode;
            } else if (CONFIG.AUTO_SWITCH_TO_CARDS && state.isMobile) {
                state.viewMode = 'cards';
            }
        }

        // Создаём UI
        createBottomNav();
        createScrollTopButton();
        createQuickActionsFab();

        // Настраиваем поведение
        setupStickyActions();
        syncBottomNavWithTabs();
        preventDoubleTapZoom();
        enableSwipeNavigation();
        enablePullToRefresh();

        // v3.0 — голосовой ввод
        if (CONFIG.ENABLE_VOICE_INPUT) {
            initVoiceInput();
        }

        // Оптимизация
        setTimeout(() => {
            optimizeTouchTargets();
            setupTableScrollIndicator();
            createViewToggle();

            if (state.viewMode === 'cards' && CONFIG.ENABLE_CARD_VIEW) {
                setTimeout(() => switchToCardView(), 500);
            }
        }, 500);

        observeDynamicContent();

        window.addEventListener('resize', debounce(handleResize, CONFIG.DEBOUNCE_DELAY));
        window.addEventListener('orientationchange', () => {
            setTimeout(handleResize, 300);
        });

        setTimeout(() => {
            document.body.classList.add('mobile-module-ready');
        }, 100);

        state.isInitialized = true;
        log('✅ MobileModule v3.0 успешно инициализирован');
    }

    // ============================================================
    // ПУБЛИЧНОЕ API
    // ============================================================

    return {
        init,
        getDeviceInfo,
        isMobile: () => state.isMobile,
        isTablet: () => state.isTablet,
        isTouchDevice: () => state.isTouch,
        updateBottomNavActive,
        refresh: refreshMobileUI,
        showLoading: showLoadingIndicator,
        
        // v2.0
        switchToCardView,
        switchToTableView,
        refreshCardView,
        getViewMode: () => state.viewMode,
        
        // v3.0
        toggleTheme,
        getTheme: () => state.theme,
        setTheme: applyTheme,
        installPWA: () => {
            if (state.deferredPrompt) {
                state.deferredPrompt.prompt();
            } else {
                showInstallBanner();
            }
        },
        startVoiceInput,
        isPWAInstalled: () => document.body.classList.contains('pwa-standalone')
    };

})();

// ============================================================
// АВТОЗАПУСК
// ============================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => MobileModule.init(), 400);
    });
} else {
    setTimeout(() => MobileModule.init(), 400);
}

window.MobileModule = MobileModule;

console.log('📱 MobileModule v3.0 загружен!');
console.log('📌 Возможности:');
console.log('   • PWA (установка на домашний экран)');
console.log('   • Тёмная тема (авто + ручное)');
console.log('   • Голосовой ввод (Web Speech API)');
console.log('📌 API:');
console.log('   window.MobileModule.toggleTheme()');
console.log('   window.MobileModule.installPWA()');
console.log('   window.MobileModule.isPWAInstalled()');
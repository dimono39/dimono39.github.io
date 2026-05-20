// ============================================
// Главный модуль приложения
// Управление вкладками, инициализация, глобальные функции
// ============================================

// Текущая активная вкладка
let currentTab = 'upload';

// Показ статуса
function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('uploadStatus');
    if (!statusDiv) return;
    
    statusDiv.textContent = message;
    statusDiv.className = `status-message status-${type}`;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 4000);
}

// Экранирование HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, (m) => {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Переключение вкладок
function switchTab(tabId) {
    currentTab = tabId;
    
    // Обновляем кнопки меню
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabId) {
            btn.classList.add('active');
        }
    });
    
    // Обновляем контент
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`tab-${tabId}`)?.classList.add('active');
    
    // Обновляем данные при переключении
    if (tabId === 'analytics' && typeof updateAnalytics === 'function') {
        updateAnalytics();
    }
    if (tabId === 'editor' && currentTemplateData && typeof renderEditor === 'function') {
        renderEditor();
    }
}

// Инициализация приложения
function initApp() {
    // Настройка дат
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    if (startDate && endDate) {
        startDate.min = '2026-01-01';
        startDate.max = '2026-12-31';
        endDate.min = '2026-01-01';
        endDate.max = '2026-12-31';
    }
    
    // Сохранение настроек школы
    const schoolNameInput = document.getElementById('schoolName');
    const ageCategorySelect = document.getElementById('ageCategory');
    const directorNameInput = document.getElementById('directorName');
    
    schoolNameInput?.addEventListener('change', () => {
        schoolInfo.name = schoolNameInput.value;
        saveToLocalStorage();
    });
    
    ageCategorySelect?.addEventListener('change', () => {
        schoolInfo.ageCategory = ageCategorySelect.value;
        saveToLocalStorage();
    });
    
    directorNameInput?.addEventListener('change', () => {
        schoolInfo.director = directorNameInput.value;
        saveToLocalStorage();
    });
    
    // Кнопки управления хранилищем
    document.getElementById('loadFromStorageBtn')?.addEventListener('click', () => {
        loadFromLocalStorage();
    });
    
    document.getElementById('clearStorageBtn')?.addEventListener('click', () => {
        clearLocalStorage();
    });
    
    // Инициализация модулей
	initSidebarToggle();
    initFileLoaders();
    initEditor();
    initGenerator();
    initAnalytics();
    initExport();
    initStorage();
    
    // Навигация по вкладкам
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });
    
    // Закрытие модалок по клику на фон
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    console.log('✅ Приложение инициализировано');
}

// Переключение боковой панели
function initSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (!toggleBtn || !sidebar) return;
    
    // Загружаем состояние из localStorage
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
        toggleBtn.classList.add('collapsed');
    }
    
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        toggleBtn.classList.toggle('collapsed');
        
        // Сохраняем состояние
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    });
}

// Запуск после загрузки DOM
document.addEventListener('DOMContentLoaded', initApp);
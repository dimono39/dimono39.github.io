import { getState, setState, subscribe, loadFromLocalStorage, saveToLocalStorage } from './core/state-manager.js';
import { renderGenerator, initGenerator } from './modules/generator.js';
import { renderEditor, initEditor } from './modules/editor.js';
import { showToast } from './core/utils.js';

let currentModule = 'generator';
let unsubscribe = null;

// Рендеринг выбранного модуля
async function renderModule(moduleName) {
    const container = document.getElementById('module-container');
    if (!container) return;
    
    // Анимация исчезновения
    container.style.opacity = '0';
    
    setTimeout(async () => {
        if (moduleName === 'generator') {
            await renderGenerator(container);
            initGenerator();
        } else if (moduleName === 'editor') {
            await renderEditor(container);
            initEditor();
        }
        
        // Анимация появления
        container.style.opacity = '1';
        container.style.transition = 'opacity 0.3s ease';
    }, 150);
}

// Обновление активной кнопки в шапке
function updateActiveButton(moduleName) {
    document.querySelectorAll('.module-btn').forEach(btn => {
        if (btn.dataset.module === moduleName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Инициализация переключателя модулей
function initModuleSwitcher() {
    document.querySelectorAll('.module-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const module = btn.dataset.module;
            if (module === currentModule) return;
            
            currentModule = module;
            setState({ currentModule: module });
            updateActiveButton(module);
            renderModule(module);
            
            showToast(`Переключено на ${module === 'generator' ? 'Генератор меню' : 'Редактор меню'}`, 'info', 1500);
        });
    });
}

// Подписка на изменения состояния
function initStateSubscription() {
    unsubscribe = subscribe((newState, oldState) => {
        // Автоматическое сохранение при изменении данных
        if (newState.calendarData !== oldState.calendarData ||
            newState.templateMenuData !== oldState.templateMenuData ||
            newState.dailyMenus !== oldState.dailyMenus) {
            saveToLocalStorage();
        }
    });
}

// Глобальные обработчики клавиш
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+S - сохранение
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveToLocalStorage();
            showToast('Данные сохранены', 'success', 1500);
        }
        
        // Ctrl+Z - отмена (если нужно)
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            // Можно реализовать undo/redo в каждом модуле
        }
        
        // F1 - помощь
        if (e.key === 'F1') {
            e.preventDefault();
            showHelp();
        }
    });
}

// Показ справки
function showHelp() {
    const helpMessage = `🎓 PRO Система управления школьным питанием

📌 Генератор меню:
- Загрузите файлы календаря (kp2026.xlsx) и типового меню (tm2026-sm.xlsx)
- Выберите период и нажмите "Создать ежедневные меню"
- Экспортируйте в ZIP, Excel или PDF

📌 Редактор меню:
- Редактируйте типовое меню в удобной таблице
- Массовые операции, проверка правил
- Аналитика и отчёты

⌨️ Горячие клавиши:
- Ctrl+S: Сохранить
- F1: Справка

Приятной работы!`;
    
    alert(helpMessage);
}

// Инициализация приложения
async function initApp() {
    // Загружаем сохранённые данные
    loadFromLocalStorage();
    
    // Инициализируем подписки
    initStateSubscription();
    
    // Инициализируем переключатель
    initModuleSwitcher();
    
    // Инициализируем клавиатурные сокращения
    initKeyboardShortcuts();
    
    // Рендерим начальный модуль
    const state = getState();
    currentModule = state.currentModule;
    updateActiveButton(currentModule);
    await renderModule(currentModule);
    
    console.log('Application initialized successfully');
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);

// Экспорт глобальных функций для отладки (опционально)
window.appAPI = {
    getState,
    setState,
    saveToLocalStorage,
    clearState: () => import('./core/state-manager.js').then(m => m.clearState())
};
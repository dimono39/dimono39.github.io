import { getState, setState, subscribe, loadFromLocalStorage, saveToLocalStorage } from './core/state-manager.js';
import { showToast } from './core/utils.js';

// Проверяем загрузку библиотек
function checkLibraries() {
    const missing = [];
    if (typeof XLSX === 'undefined') missing.push('XLSX');
    if (typeof saveAs === 'undefined') missing.push('FileSaver');
    if (typeof JSZip === 'undefined') missing.push('JSZip');
    if (typeof Chart === 'undefined') missing.push('Chart.js');
    if (typeof ExcelJS === 'undefined') missing.push('ExcelJS');
    
    if (missing.length > 0) {
        console.error('Missing libraries:', missing);
        showToast(`Ошибка загрузки библиотек: ${missing.join(', ')}. Обновите страницу.`, 'error');
        return false;
    }
    
    console.log('All libraries loaded successfully');
    return true;
}

let currentModule = 'generator';
let generatorModule = null;
let editorModule = null;

// Динамическая загрузка модулей
async function loadModule(moduleName) {
    try {
        if (moduleName === 'generator') {
            if (!generatorModule) {
                const module = await import('./modules/generator.js');
                generatorModule = module;
            }
            return generatorModule;
        } else if (moduleName === 'editor') {
            if (!editorModule) {
                const module = await import('./modules/editor.js');
                editorModule = module;
            }
            return editorModule;
        }
    } catch (error) {
        console.error(`Failed to load ${moduleName} module:`, error);
        showToast(`Ошибка загрузки модуля: ${error.message}`, 'error');
        return null;
    }
}

// Рендеринг выбранного модуля
async function renderModule(moduleName) {
    const container = document.getElementById('module-container');
    if (!container) return;
    
    // Анимация исчезновения
    container.style.opacity = '0';
    
    setTimeout(async () => {
        const module = await loadModule(moduleName);
        if (!module) return;
        
        if (moduleName === 'generator' && module.renderGenerator) {
            await module.renderGenerator(container);
            if (module.initGenerator) module.initGenerator();
        } else if (moduleName === 'editor' && module.renderEditor) {
            await module.renderEditor(container);
            if (module.initEditor) module.initEditor();
        }
        
        // Анимация появления
        container.style.opacity = '1';
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
        btn.addEventListener('click', async () => {
            const module = btn.dataset.module;
            if (module === currentModule) return;
            
            currentModule = module;
            setState({ currentModule: module });
            updateActiveButton(module);
            await renderModule(module);
            
            showToast(`Переключено на ${module === 'generator' ? 'Генератор меню' : 'Редактор меню'}`, 'info', 1500);
        });
    });
}

// Подписка на изменения состояния
function initStateSubscription() {
    subscribe((newState, oldState) => {
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
- Экспортируйте в ZIP или Excel

📌 Редактор меню:
- Редактируйте типовое меню в удобной таблице
- Массовые операции, проверка правил
- Экспорт в Excel

⌨️ Горячие клавиши:
- Ctrl+S: Сохранить
- F1: Справка

Приятной работы!`;
    
    alert(helpMessage);
}

// Инициализация приложения
async function initApp() {
    // Проверяем библиотеки
    if (!checkLibraries()) {
        console.warn('Some libraries failed to load, but continuing...');
    }
    
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
    currentModule = state.currentModule || 'generator';
    updateActiveButton(currentModule);
    await renderModule(currentModule);
    
    console.log('Application initialized successfully');
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);

// Экспорт глобальных функций для отладки
window.appAPI = {
    getState,
    setState,
    saveToLocalStorage
};
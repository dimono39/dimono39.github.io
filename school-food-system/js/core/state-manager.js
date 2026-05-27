import { STORAGE_KEY } from './constants.js';
import { deepClone, showToast } from './utils.js';

// Начальное состояние
const initialState = {
    currentModule: 'generator',
    calendarData: null,
    templateMenuData: null,
    dailyMenus: [],
    uploadedFiles: [],
    schoolInfo: {
        name: '',
        ageCategory: '7-11',
        approval: {
            position: 'Директор',
            name: '',
            date: new Date().toLocaleDateString('ru-RU')
        }
    },
    currentYear: 2026,
    settings: {
        colorScheme: 'default',
        autoSave: true
    }
};

let appState = deepClone(initialState);
let subscribers = [];
let saveTimeout = null;

// Получение состояния
export function getState() {
    return deepClone(appState);
}

// Обновление состояния
export function setState(updates, silent = false) {
    const oldState = deepClone(appState);
    appState = { ...appState, ...updates };
    
    if (!silent) {
        notifySubscribers(oldState, appState);
    }
    
    // Автосохранение
    if (appState.settings.autoSave) {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveToLocalStorage();
        }, 1000);
    }
}

// Подписка на изменения
export function subscribe(callback) {
    subscribers.push(callback);
    return () => {
        const index = subscribers.indexOf(callback);
        if (index > -1) subscribers.splice(index, 1);
    };
}

// Уведомление подписчиков
function notifySubscribers(oldState, newState) {
    subscribers.forEach(callback => {
        try {
            callback(newState, oldState);
        } catch (error) {
            console.error('Subscriber error:', error);
        }
    });
}

// Сохранение в localStorage
export function saveToLocalStorage() {
    try {
        const dataToSave = {
            calendarData: appState.calendarData,
            templateMenuData: appState.templateMenuData,
            dailyMenus: appState.dailyMenus,
            schoolInfo: appState.schoolInfo,
            currentYear: appState.currentYear,
            settings: appState.settings,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        
        // Показываем индикатор сохранения
        const indicator = document.getElementById('saveIndicator');
        if (indicator) {
            indicator.classList.add('saving');
            setTimeout(() => indicator.classList.remove('saving'), 500);
        }
        
        console.log('Data saved to localStorage');
    } catch (error) {
        console.error('Save error:', error);
        showToast('Ошибка сохранения: ' + error.message, 'error');
    }
}

// Загрузка из localStorage
export function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            appState = {
                ...appState,
                calendarData: data.calendarData || null,
                templateMenuData: data.templateMenuData || null,
                dailyMenus: data.dailyMenus || [],
                schoolInfo: data.schoolInfo || initialState.schoolInfo,
                currentYear: data.currentYear || 2026,
                settings: data.settings || initialState.settings
            };
            
            notifySubscribers(initialState, appState);
            console.log('Data loaded from localStorage');
            showToast('Данные восстановлены', 'success', 2000);
            return true;
        }
    } catch (error) {
        console.error('Load error:', error);
        showToast('Ошибка загрузки данных', 'error');
    }
    return false;
}

// Очистка состояния
export function clearState() {
    appState = deepClone(initialState);
    localStorage.removeItem(STORAGE_KEY);
    notifySubscribers(appState, appState);
    showToast('Все данные очищены', 'info', 2000);
}

// Экспорт состояния в файл
export function exportState() {
    const dataStr = JSON.stringify(appState, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `school-system-backup-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Бэкап создан', 'success');
}

// Импорт состояния из файла
export function importState(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            appState = { ...appState, ...data };
            saveToLocalStorage();
            notifySubscribers(appState, appState);
            showToast('Данные восстановлены из файла', 'success');
        } catch (error) {
            showToast('Ошибка при импорте: неверный формат файла', 'error');
        }
    };
    reader.readAsText(file);
}
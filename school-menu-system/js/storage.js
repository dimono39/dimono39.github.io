// ============================================
// Модуль управления хранилищем (localStorage)
// Автосохранение каждые 30 секунд
// ============================================

const STORAGE_KEY = 'schoolMenuSystemPro_v6';

let autoSaveInterval = null;
let currentTemplateData = null;
let currentCalendarData = null;
let currentDailyMenus = [];
let originalTemplateData = null;
let schoolInfo = {
    name: '',
    ageCategory: '7-11',
    director: ''
};

// Сохранение всей системы в localStorage
function saveToLocalStorage() {
    if (!currentTemplateData && !currentCalendarData && currentDailyMenus.length === 0) return;
    
    const dataToSave = {
        templateData: currentTemplateData,
        calendarData: currentCalendarData,
        dailyMenus: currentDailyMenus,
        schoolInfo: schoolInfo,
        savedAt: new Date().toISOString(),
        version: '6.0'
    };
    
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        updateAutoSaveStatus(true);
        return true;
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        if (error.name === 'QuotaExceededError') {
            showStatus('Хранилище заполнено, экспортируйте данные', 'error');
        }
        return false;
    }
}

// Загрузка из localStorage
function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) {
            showStatus('Нет сохранённых данных', 'info');
            return false;
        }
        
        const parsed = JSON.parse(savedData);
        
        if (parsed.templateData) {
            currentTemplateData = parsed.templateData;
            originalTemplateData = JSON.parse(JSON.stringify(parsed.templateData));
        }
        
        if (parsed.calendarData) {
            currentCalendarData = parsed.calendarData;
        }
        
        if (parsed.dailyMenus) {
            currentDailyMenus = parsed.dailyMenus;
        }
        
        if (parsed.schoolInfo) {
            schoolInfo = parsed.schoolInfo;
            document.getElementById('schoolName').value = schoolInfo.name || '';
            document.getElementById('ageCategory').value = schoolInfo.ageCategory || '7-11';
            document.getElementById('directorName').value = schoolInfo.director || '';
        }
        
        showStatus(`Данные загружены из памяти (${new Date(parsed.savedAt).toLocaleString()})`, 'success');
        
        // Обновляем UI
        if (typeof updateFilePreview === 'function') {
            updateFilePreview();
        }
        
        if (currentTemplateData && typeof renderEditor === 'function') {
            flatItems = buildFlatFromTemplate(currentTemplateData);
            renderEditor();
        }
        
        if (currentCalendarData && typeof updateCalendarDisplay === 'function') {
            updateCalendarDisplay();
        }
        
        if (currentDailyMenus.length > 0 && typeof updateMenuGridDisplay === 'function') {
            updateMenuGridDisplay();
        }
        
        return true;
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showStatus('Ошибка при загрузке данных', 'error');
        return false;
    }
}

// Очистка localStorage
function clearLocalStorage() {
    if (confirm('Очистить все сохранённые данные? Это действие нельзя отменить.')) {
        localStorage.removeItem(STORAGE_KEY);
        currentTemplateData = null;
        currentCalendarData = null;
        currentDailyMenus = [];
        schoolInfo = { name: '', ageCategory: '7-11', director: '' };
        originalTemplateData = null;
        
        showStatus('Данные очищены', 'info');
        
        // Обновляем UI
        if (typeof resetUI === 'function') {
            resetUI();
        }
        
        // Очищаем поля
        document.getElementById('schoolName').value = '';
        document.getElementById('ageCategory').value = '7-11';
        document.getElementById('directorName').value = '';
        document.getElementById('calendarFileInfo').classList.remove('active');
        document.getElementById('menuFileInfo').classList.remove('active');
    }
}

// Обновление статуса автосохранения
function updateAutoSaveStatus(success) {
    const statusSpan = document.getElementById('autoSaveStatus');
    if (statusSpan) {
        if (success) {
            statusSpan.innerHTML = '✅ Сохранено';
            setTimeout(() => {
                statusSpan.innerHTML = 'Автосохранение';
            }, 2000);
        }
    }
}

// Запуск автосохранения
function startAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    
    autoSaveInterval = setInterval(() => {
        if (currentTemplateData || currentCalendarData || currentDailyMenus.length > 0) {
            saveToLocalStorage();
        }
    }, 30000); // каждые 30 секунд
}

// Остановка автосохранения
function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
    }
}

// Сохранение истории для undo/redo (для редактора)
let historyStack = [];
let historyIndex = -1;
let isUndoRedo = false;

function saveToHistory() {
    if (isUndoRedo || !currentTemplateData) return;
    
    const newState = JSON.parse(JSON.stringify(currentTemplateData));
    historyStack = historyStack.slice(0, historyIndex + 1);
    historyStack.push(newState);
    historyIndex++;
    
    if (historyStack.length > 50) {
        historyStack.shift();
        historyIndex--;
    }
}

function undo() {
    if (historyIndex > 0 && currentTemplateData) {
        historyIndex--;
        isUndoRedo = true;
        currentTemplateData = JSON.parse(JSON.stringify(historyStack[historyIndex]));
        if (typeof buildFlatFromTemplate === 'function') {
            flatItems = buildFlatFromTemplate(currentTemplateData);
        }
        if (typeof renderEditor === 'function') {
            renderEditor();
        }
        showStatus('Отменено', 'info');
        isUndoRedo = false;
        saveToLocalStorage();
    }
}

function redo() {
    if (historyIndex < historyStack.length - 1 && currentTemplateData) {
        historyIndex++;
        isUndoRedo = true;
        currentTemplateData = JSON.parse(JSON.stringify(historyStack[historyIndex]));
        if (typeof buildFlatFromTemplate === 'function') {
            flatItems = buildFlatFromTemplate(currentTemplateData);
        }
        if (typeof renderEditor === 'function') {
            renderEditor();
        }
        showStatus('Повторено', 'info');
        isUndoRedo = false;
        saveToLocalStorage();
    }
}

// Инициализация хранилища
function initStorage() {
    startAutoSave();
    
    // Загружаем из localStorage при старте
    loadFromLocalStorage();
}

// Экспорт данных для отладки
function exportStorageDebug() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const blob = new Blob([saved], { type: 'application/json' });
        saveAs(blob, `backup_${new Date().toISOString().slice(0,19)}.json`);
        showStatus('Бэкап создан', 'success');
    } else {
        showStatus('Нет данных для бэкапа', 'error');
    }
}
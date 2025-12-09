// final-fix.js
console.log('🔧 Применение финальных исправлений...');

// 1. Добавляем все недостающие функции как заглушки
const functionStubs = [
    'updateRecommendations', 'exportToGoogleClassroom', 'removeLastTask',
    'showTasksQuickEdit', 'generateTemplate', 'showErrorManagementDialog',
    'showBulkDeleteErrors', 'exportErrorsToCSV', 'showQuickErrorAdd',
    'showBulkEditDialog', 'printRecommendationsForParents',
    'printRecommendationsForTeacher', 'printRecommendationsForAdmin',
    'exportRecommendationsToWord', 'exportAnalyticsToPDF',
    'generateSmartRecommendations', 'showAdvancedSearchDialog',
    'showComparativeAnalysis', 'updateVPRAnalysis', 'updateLiteracyAnalysis',
    'updateGIAnalysis', 'updatePsychologyAnalysis', 'updateFinalAnalysis'
];

functionStubs.forEach(funcName => {
    if (!window[funcName]) {
        window[funcName] = function(...args) {
            console.log(`🔄 Вызов заглушки: ${funcName}`, args);
            showNotification(`Функция "${funcName}" в разработке`, 'info');
        };
        window.app[funcName] = window[funcName];
    }
});

// 2. Фикс для removeLastTask
if (!window.removeLastTask) {
    window.removeLastTask = function() {
        if (appData && appData.tasks && appData.tasks.length > 1) {
            const lastIndex = appData.tasks.length - 1;
            if (typeof removeTask === 'function') {
                removeTask(lastIndex);
            }
        } else {
            showNotification("Нельзя удалить последнее задание", "error");
        }
    };
    window.app.removeLastTask = window.removeLastTask;
}

// 3. Фикс для графиков
if (typeof initGradesChart === 'function') {
    const originalInit = initGradesChart;
    window.initGradesChart = function() {
        const canvas = document.getElementById('gradesChart');
        if (!canvas) {
            console.log('⏳ График отложен - canvas не найден');
            return;
        }
        return originalInit();
    };
}

// 4. Предотвращаем двойную инициализацию
let appInitialized = false;
const originalInitializeApp = window.initializeApp;
if (originalInitializeApp) {
    window.initializeApp = function() {
        if (appInitialized) {
            console.log('🔄 Приложение уже инициализировано, пропускаем');
            return;
        }
        appInitialized = true;
        return originalInitializeApp();
    };
}

console.log('✅ Все фиксы применены');
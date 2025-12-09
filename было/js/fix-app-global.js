// fix-app-global.js
console.log('🔧 Запуск фикса глобальных функций...');

// Создаём или расширяем глобальный объект app
window.app = window.app || {};

// Экспорт ВСЕХ нужных функций из core.js
if (typeof showTab === 'function') window.app.showTab = showTab;
if (typeof saveData === 'function') window.app.saveData = saveData;
if (typeof loadSampleData === 'function') window.app.loadSampleData = loadSampleData;
if (typeof scheduleAutoSave === 'function') window.app.scheduleAutoSave = scheduleAutoSave;

// Функции из render.js
if (typeof renderTestSettings === 'function') window.app.renderTestSettings = renderTestSettings;

// Заглушки для отсутствующих функций
window.app.saveTestSettings = function() {
    console.log('💾 saveTestSettings called');
    
    // Сохранение всех полей формы
    const fields = [
        'subject', 'class', 'testDate', 'theme', 'goals',
        'workType', 'workFormat', 'timeLimit',
        'totalStudents', 'presentStudents', 'absentReason'
    ];
    
    let savedCount = 0;
    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element && element.value !== undefined) {
            appData.test[field] = element.value;
            savedCount++;
        }
    });
    
    saveData();
    showNotification(`Сохранено ${savedCount} настроек`, 'success');
};

window.app.syncStudentsCount = function() {
    console.log('👥 syncStudentsCount called');
    appData.test.totalStudents = appData.students.length;
    appData.test.presentStudents = appData.students.length;
    saveData();
    if (typeof renderTestSettings === 'function') {
        renderTestSettings();
    }
    showNotification('Количество учащихся синхронизировано', 'success');
};

window.app.updateWorkType = function() {
    console.log('🔄 updateWorkType called');
    const workType = document.getElementById('workType')?.value || 'current';
    appData.test.workType = workType;
    updateCriteriaForWorkType();
    saveData();
    renderTestSettings();
    showNotification(`Тип работы изменён на: ${workType}`, 'info');
};

window.app.restoreBackupDialog = function() {
    showNotification('Функция восстановления из бэкапа будет доступна в следующей версии', 'info');
};

// Экспортируем также в глобальную область (на всякий случай)
window.showTab = window.app.showTab;
window.saveData = window.app.saveData;
window.loadSampleData = window.app.loadSampleData;

console.log('✅ Глобальные функции зафиксированы. Доступно функций:', Object.keys(window.app).length);
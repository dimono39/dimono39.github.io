// Основной объект настроек
const appState = {
    currentStep: 1,
    totalSteps: 4,
    workType: '',
    settings: {},
    criteria: {}
};
const tabState = {
    setup: {},
    criteria: {},
    students: {},
    analytics: {},
    currentTab: 'setup'
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadSavedData();
    updateProgress();
    setupEventListeners();
});

// Функция для сохранения состояния текущей вкладки
function saveTabState(tabId) {
    if (!tabId) return;
    
    const tabContent = document.querySelector(`#${tabId} .tab-content`);
    if (!tabContent) return;
    
    // Сохраняем все значения полей ввода
    const inputs = tabContent.querySelectorAll('input, select, textarea');
    tabState[tabId] = {};
    
    inputs.forEach(input => {
        const id = input.id;
        if (id) {
            tabState[tabId][id] = input.value;
        }
    });
    
    // Для специальных вкладок сохраняем дополнительное состояние
    if (tabId === 'criteria') {
        saveCriteriaState();
    }
}

// Функция для восстановления состояния вкладки
function restoreTabState(tabId) {
    if (!tabState[tabId] || Object.keys(tabState[tabId]).length === 0) {
        return;
    }
    
    const tabContent = document.querySelector(`#${tabId} .tab-content`);
    if (!tabContent) return;
    
    // Восстанавливаем значения полей
    Object.keys(tabState[tabId]).forEach(id => {
        const element = document.getElementById(id);
        if (element && element.value !== undefined) {
            element.value = tabState[tabId][id];
        }
    });
    
    // Для специальных вкладок
    if (tabId === 'criteria') {
        restoreCriteriaState();
    }
}

// Сохранение состояния критериев
function saveCriteriaState() {
    const criteria = {
        type: document.getElementById('criteriaType')?.value || 'points',
        rows: []
    };
    
    document.querySelectorAll('.criteria-row:not(.header)').forEach(row => {
        const grade = row.querySelector('.grade-badge')?.textContent || '';
        const min = row.querySelector('.criteria-min')?.value || 0;
        const max = row.querySelector('.criteria-max')?.value || 0;
        const desc = row.querySelector('.criteria-desc')?.value || '';
        
        criteria.rows.push({ grade, min, max, desc });
    });
    
    tabState.criteria.data = criteria;
}

// Восстановление состояния критериев
function restoreCriteriaState() {
    if (!tabState.criteria.data) return;
    
    const criteria = tabState.criteria.data;
    
    // Устанавливаем тип критериев
    const typeSelect = document.getElementById('criteriaType');
    if (typeSelect) {
        typeSelect.value = criteria.type;
        changeCriteriaType(); // Пересоздаем интерфейс
    }
    
    // Даем время на создание DOM элементов
    setTimeout(() => {
        const rows = document.querySelectorAll('.criteria-row:not(.header)');
        criteria.rows.forEach((rowData, index) => {
            if (rows[index]) {
                const minInput = rows[index].querySelector('.criteria-min');
                const maxInput = rows[index].querySelector('.criteria-max');
                const descInput = rows[index].querySelector('.criteria-desc');
                
                if (minInput) minInput.value = rowData.min;
                if (maxInput) maxInput.value = rowData.max;
                if (descInput) descInput.value = rowData.desc;
            }
        });
        
        updateCriteriaPreview();
    }, 100);
}
// Замените текущую функцию переключения вкладок на эту:
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Сохраняем состояние текущей вкладки
            saveTabState(tabState.currentTab);
            
            // Скрываем все вкладки
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // Убираем активный класс со всех кнопок
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Показываем выбранную вкладку
            document.getElementById(tabId).classList.add('active');
            this.classList.add('active');
            
            // Обновляем текущую вкладку
            tabState.currentTab = tabId;
            
            // Восстанавливаем состояние новой вкладки
            restoreTabState(tabId);
            
            // Обновляем данные если нужно
            if (tabId === 'analytics') {
                updateCharts();
            } else if (tabId === 'students') {
                updateStudentsTable();
            }
        });
    });
}

// Инициализируйте навигацию при загрузке
document.addEventListener('DOMContentLoaded', function() {
    setupTabNavigation();
});
// Мастер шагов
function nextStep() {
    if (validateCurrentStep()) {
        const current = document.querySelector('.wizard-step.active');
        const nextStep = appState.currentStep + 1;
        
        if (nextStep <= appState.totalSteps) {
            current.classList.remove('active');
            document.getElementById(`step${nextStep}`).classList.add('active');
            appState.currentStep = nextStep;
            
            // Если это последний шаг, показываем кнопки действий
            if (nextStep === appState.totalSteps) {
                document.getElementById('actionButtons').style.display = 'block';
            }
            
            updateProgress();
            updateStepContent();
        }
    }
}

function prevStep() {
    if (appState.currentStep > 1) {
        const current = document.querySelector('.wizard-step.active');
        const prevStep = appState.currentStep - 1;
        
        current.classList.remove('active');
        document.getElementById(`step${prevStep}`).classList.add('active');
        appState.currentStep = prevStep;
        
        // Скрываем кнопки действий если не на последнем шаге
        if (prevStep < appState.totalSteps) {
            document.getElementById('actionButtons').style.display = 'none';
        }
        
        updateProgress();
    }
}

function validateCurrentStep() {
    const step = appState.currentStep;
    let isValid = true;
    
    switch(step) {
        case 1:
            isValid = !!appState.workType;
            if (!isValid) {
                showNotification('Выберите тип работы', 'warning');
            }
            break;
            
        case 2:
            const requiredFields = ['subject', 'class', 'testDate'];
            requiredFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (!field.value.trim()) {
                    field.style.borderColor = '#e74c3c';
                    isValid = false;
                } else {
                    field.style.borderColor = '#ddd';
                }
            });
            
            if (!isValid) {
                showNotification('Заполните обязательные поля', 'warning');
            }
            break;
            
        case 3:
            const total = parseInt(document.getElementById('totalStudents').value) || 0;
            const present = parseInt(document.getElementById('presentStudents').value) || 0;
            
            if (total < 1 || present < 1 || present > total) {
                showNotification('Проверьте количество учащихся', 'warning');
                isValid = false;
            }
            break;
    }
    
    return isValid;
}

// Выбор типа работы
function selectWorkType(type) {
    appState.workType = type;
    
    // Обновляем визуальное выделение
    document.querySelectorAll('.worktype-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Добавляем selected к выбранной карточке
    const selectedCard = event.currentTarget;
    selectedCard.classList.add('selected');
    
    // Обновляем информацию о типе работы
    updateWorkTypeInfo(type);
    
    // Разблокируем кнопку "Далее"
    document.getElementById('nextStep1').disabled = false;
    
    // Загружаем соответствующие критерии
    loadCriteriaForWorkType(type);
    
    updateProgress();
    scheduleAutoSave();
}

// Обновление информации о типе работы
function updateWorkTypeInfo(type) {
    const typeInfo = {
        'current': {
            title: 'Текущая контрольная',
            desc: 'Оценка знаний по текущей теме изучения',
            time: '40-45 минут',
            format: 'Традиционный формат',
            grading: '5-балльная система'
        },
        'milestone': {
            title: 'Рубежная контрольная',
            desc: 'Контроль знаний за четверть или триместр',
            time: '80-90 минут',
            format: 'Смешанный формат',
            grading: '5-балльная система'
        },
        'final': {
            title: 'Итоговая контрольная',
            desc: 'Годовая контрольная работа',
            time: '90-120 минут',
            format: 'Традиционный с развернутыми ответами',
            grading: '5-балльная система'
        },
        'oge': {
            title: 'Основной государственный экзамен',
            desc: 'Государственная итоговая аттестация для 9 класса',
            time: '180-235 минут',
            format: 'Стандартизированный тест',
            grading: 'Первичные и тестовые баллы'
        },
        'ege': {
            title: 'Единый государственный экзамен',
            desc: 'Государственный экзамен для 11 класса',
            time: '180-235 минут',
            format: 'Стандартизированный тест',
            grading: 'Первичные и тестовые баллы'
        },
        'vpr': {
            title: 'Всероссийская проверочная работа',
            desc: 'Единая проверочная работа для всей страны',
            time: '45-60 минут',
            format: 'Тестовая форма',
            grading: 'Процентная система'
        },
        'psychology': {
            title: 'Психологическая диагностика',
            desc: 'Оценка личностных качеств и психологического состояния',
            time: '40-60 минут',
            format: 'Тесты и анкеты',
            grading: 'Уровневая система'
        }
    };
    
    const info = typeInfo[type] || typeInfo['current'];
    
    document.getElementById('selectedWorktypeTitle').textContent = info.title;
    document.getElementById('selectedWorktypeDesc').textContent = info.desc;
    document.getElementById('infoTime').textContent = info.time;
    document.getElementById('infoFormat').textContent = info.format;
    document.getElementById('infoGrading').textContent = info.grading;
    
    document.getElementById('worktypeInfo').style.display = 'block';
    
    // Автоматически заполняем связанные поля
    if (type === 'oge' || type === 'ege') {
        document.getElementById('timeLimit').value = 180;
        document.getElementById('workFormat').value = 'mixed';
    } else if (type === 'vpr') {
        document.getElementById('timeLimit').value = 45;
        document.getElementById('workFormat').value = 'test';
    } else if (type === 'psychology') {
        document.getElementById('timeLimit').value = 40;
        document.getElementById('workFormat').value = 'test';
    }
}

// Обновление шага 2 при выборе типа работы
function updateStepContent() {
    if (appState.currentStep === 2 && appState.workType) {
        const subject = document.getElementById('subject');
        const today = new Date().toISOString().split('T')[0];
        
        // Автозаполнение даты
        document.getElementById('testDate').value = today;
        
        // Автозаполнение темы в зависимости от типа
        const themeMap = {
            'current': 'Текущий контроль знаний',
            'milestone': 'Рубежный контроль знаний',
            'final': 'Итоговая аттестация',
            'oge': 'Подготовка к ОГЭ',
            'ege': 'Подготовка к ЕГЭ',
            'vpr': 'Всероссийская проверочная работа',
            'psychology': 'Психологическая диагностика'
        };
        
        document.getElementById('testTheme').value = themeMap[appState.workType] || '';
    }
}

// Обновление количества присутствующих
function updatePresentStudents() {
    const total = parseInt(document.getElementById('totalStudents').value) || 0;
    const present = document.getElementById('presentStudents');
    
    // Автоматически устанавливаем присутствующих как 90% от общего количества
    if (total > 0) {
        const calculatedPresent = Math.max(1, Math.floor(total * 0.9));
        present.value = calculatedPresent;
        
        // Обновляем статистику
        updateAttendanceStats();
    }
}

// Обновление статистики посещаемости
function updateAttendanceStats() {
    const total = parseInt(document.getElementById('totalStudents').value) || 0;
    const present = parseInt(document.getElementById('presentStudents').value) || 0;
    
    const percent = total > 0 ? Math.round((present / total) * 100) : 0;
    const absent = total - present;
    
    document.getElementById('attendancePercent').textContent = `${percent}%`;
    document.getElementById('absentCount').textContent = absent;
}

// Синхронизация количества учащихся
function syncStudentsCount() {
    // Здесь можно добавить логику синхронизации с реальным списком
    const total = parseInt(document.getElementById('totalStudents').value) || 25;
    document.getElementById('presentStudents').value = Math.max(1, total - 2);
    updateAttendanceStats();
    showNotification('Количество синхронизировано', 'success');
}

// Обновление прогресса
function updateProgress() {
    let progress = 0;
    
    // Прогресс зависит от текущего шага
    progress = ((appState.currentStep - 1) / appState.totalSteps) * 100;
    
    // Добавляем прогресс заполнения текущего шага
    switch(appState.currentStep) {
        case 1:
            progress += appState.workType ? 25 : 0;
            break;
        case 2:
            const step2Fields = ['subject', 'class', 'testDate', 'testTheme'];
            const filled2 = step2Fields.filter(id => {
                const field = document.getElementById(id);
                return field && field.value.trim();
            }).length;
            progress += (filled2 / step2Fields.length) * 25;
            break;
        case 3:
            const step3Fields = ['totalStudents', 'presentStudents'];
            const filled3 = step3Fields.filter(id => {
                const field = document.getElementById(id);
                return field && field.value && parseInt(field.value) > 0;
            }).length;
            progress += (filled3 / step3Fields.length) * 25;
            break;
        case 4:
            progress += 25; // Шаг критериев считается полностью заполненным
            break;
    }
    
    // Обновляем прогресс бар
    document.getElementById('setupProgress').style.width = `${progress}%`;
    
    // Обновляем текст
    const progressTexts = [
        'Выберите тип работы',
        'Заполните основную информацию',
        'Укажите данные об учащихся',
        'Настройте критерии оценивания',
        'Настройка завершена!'
    ];
    
    let textIndex = Math.min(appState.currentStep - 1, progressTexts.length - 1);
    document.getElementById('progressText').textContent = progressTexts[textIndex];
}

// Автосохранение
let saveTimeout1;
const SAVE_DELAY = 1500; // 1.5 секунды

function scheduleAutoSave() {
    // Сохраняем состояние текущей вкладки
    saveTabState(tabState.currentTab);
    
    // Откладываем глобальное сохранение
    clearTimeout(saveTimeout1);
    saveTimeout1 = setTimeout(() => {
        saveAllData();
        showNotification('Автосохранение выполнено', 'info', 2000);
    }, SAVE_DELAY);
}

// Сохраняем все данные
function saveAllData() {
    // Сохраняем настройки теста
    const testSettings = {};
    const setupFields = ['workType', 'subject', 'class', 'testDate', 'testTheme', 
                         'testGoals', 'workFormat', 'timeLimit', 'totalStudents', 
                         'presentStudents', 'absentReason'];
    
    setupFields.forEach(field => {
        const element = document.getElementById(field);
        if (element) testSettings[field] = element.value;
    });
    
    localStorage.setItem('testSettings', JSON.stringify(testSettings));
    
    // Сохраняем состояние вкладок
    localStorage.setItem('tabState', JSON.stringify(tabState));
    
    // Сохраняем критерии
    saveCriteriaSettings();
}

// Загружаем все данные при старте
function loadAllData() {
    // Загружаем настройки теста
    const savedTestSettings = localStorage.getItem('testSettings');
    if (savedTestSettings) {
        try {
            const settings = JSON.parse(savedTestSettings);
            Object.keys(settings).forEach(key => {
                const element = document.getElementById(key);
                if (element) element.value = settings[key];
            });
        } catch (e) {
            console.error('Ошибка загрузки настроек:', e);
        }
    }
    
    // Загружаем состояние вкладок
    const savedTabState = localStorage.getItem('tabState');
    if (savedTabState) {
        try {
            const state = JSON.parse(savedTabState);
            Object.assign(tabState, state);
        } catch (e) {
            console.error('Ошибка загрузки состояния вкладок:', e);
        }
    }
}

// Загрузка сохраненных данных
function loadSavedData() {
    const saved = localStorage.getItem('testSettings');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            
            // Восстанавливаем тип работы
            if (data.workType) {
                appState.workType = data.workType;
                updateWorkTypeInfo(data.workType);
                document.getElementById('nextStep1').disabled = false;
            }
            
            // Восстанавливаем другие поля
            Object.keys(data).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    element.value = data[key];
                }
            });
            
            showNotification('Данные восстановлены из автосохранения', 'info');
        } catch (e) {
            console.error('Ошибка загрузки сохраненных данных:', e);
        }
    }
    
    updateProgress();
}

// Сохранение настроек
function saveTestSettings() {
    const settings = {};
    
    // Собираем все значения полей
    const fields = [
        'workType', 'subject', 'class', 'testDate', 'testTheme',
        'testGoals', 'workFormat', 'timeLimit', 'totalStudents',
        'presentStudents', 'absentReason'
    ];
    
    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            settings[fieldId] = element.value;
        }
    });
    
    // Сохраняем в localStorage
    localStorage.setItem('testSettings', JSON.stringify(settings));
    
    // Показываем уведомление
    showNotification('Настройки сохранены автоматически', 'success');
}

// Загрузка примера
function loadSampleData() {
    const sample = {
        workType: 'current',
        subject: 'Математика',
        class: '5А',
        testDate: new Date().toISOString().split('T')[0],
        testTheme: 'Дроби и проценты',
        testGoals: '1. Сравнение дробей\n2. Перевод дробей в проценты\n3. Решение задач на проценты',
        workFormat: 'mixed',
        timeLimit: '45',
        totalStudents: '25',
        presentStudents: '23',
        absentReason: 'Иванов - болезнь, Петрова - семейные обстоятельства'
    };
    
    // Заполняем поля
    Object.keys(sample).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.value = sample[key];
        }
    });
    
    // Обновляем визуальные элементы
    selectWorkType('current');
    updateAttendanceStats();
    updateProgress();
    
    showNotification('Пример данных загружен', 'success');
}

// Управление модальными окнами
function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showResetDialog() {
    showModal('resetDialog');
}

function resetAllData() {
    // Сбрасываем все поля
    document.querySelectorAll('input, select, textarea').forEach(element => {
        element.value = '';
    });
    
    // Сбрасываем состояние
    appState.currentStep = 1;
    appState.workType = '';
    
    // Сбрасываем визуальное состояние
    document.querySelectorAll('.wizard-step').forEach((step, index) => {
        step.classList.remove('active');
        if (index === 0) step.classList.add('active');
    });
    
    document.getElementById('actionButtons').style.display = 'none';
    document.getElementById('worktypeInfo').style.display = 'none';
    document.querySelectorAll('.worktype-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Очищаем сохранения
    localStorage.removeItem('testSettings');
    
    closeModal('resetDialog');
    showNotification('Все данные сброшены', 'info');
    updateProgress();
}

// Уведомления
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Стили для уведомления
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#f39c12' : '#3498db'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Завершение настройки
function completeSetup() {
    if (validateCurrentStep()) {
        saveTestSettings();
        showModal('successModal');
        updateProgress();
    }
}

// Редактирование настроек
function editSetup() {
    appState.currentStep = 1;
    document.querySelectorAll('.wizard-step').forEach((step, index) => {
        step.classList.remove('active');
        if (index === 0) step.classList.add('active');
    });
    
    document.getElementById('actionButtons').style.display = 'none';
    updateProgress();
}

// Настройка слушателей событий
function setupEventListeners() {
    // Добавляем CSS анимации
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .notification {
            animation: slideInRight 0.3s ease;
        }
    `;
    document.head.appendChild(style);
    
    // Обработка Enter для перехода между полями
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            const form = e.target.closest('.form-group');
            if (form) {
                const next = form.nextElementSibling;
                if (next && next.querySelector('input, select')) {
                    next.querySelector('input, select').focus();
                }
            }
        }
    });
    
    // Автосохранение при потере фокуса
    document.addEventListener('blur', function(e) {
        if (e.target.matches('input, select, textarea')) {
            scheduleAutoSave();
        }
    }, true);
}
// Критерии оценивания
function loadCriteriaForWorkType(workType) {
    const criteriaContainer = document.getElementById('criteriaSettingsContainer');
    
    const criteriaTemplates = {
        'current': generateFivePointCriteria(),
        'milestone': generateFivePointCriteria(),
        'final': generateFivePointCriteria(),
        'oge': generateOgeCriteria(),
        'ege': generateEgeCriteria(),
        'vpr': generateVprCriteria(),
        'psychology': generatePsychologyCriteria()
    };
    
    criteriaContainer.innerHTML = criteriaTemplates[workType] || criteriaTemplates['current'];
    updateCriteriaPreview();
}

function generateFivePointCriteria() {
    return `
        <div class="criteria-grid">
            <div class="criteria-row header">
                <div class="criteria-grade">Оценка</div>
                <div class="criteria-range">Диапазон баллов</div>
                <div class="criteria-description">Критерии</div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge grade-5">5</span> Отлично</div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="85" min="0" max="100" onchange="updateCriteriaPreview()">
                    -
                    <input type="number" class="criteria-max" value="100" min="0" max="100" onchange="updateCriteriaPreview()">
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Выполнено 85-100% работы без ошибок" 
                           placeholder="Описание критерия" onchange="updateCriteriaPreview()">
                </div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge grade-4">4</span> Хорошо</div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="70" min="0" max="100" onchange="updateCriteriaPreview()">
                    -
                    <input type="number" class="criteria-max" value="84" min="0" max="100" onchange="updateCriteriaPreview()">
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Выполнено 70-84% работы, незначительные ошибки" 
                           placeholder="Описание критерия" onchange="updateCriteriaPreview()">
                </div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge grade-3">3</span> Удовлетворительно</div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="50" min="0" max="100" onchange="updateCriteriaPreview()">
                    -
                    <input type="number" class="criteria-max" value="69" min="0" max="100" onchange="updateCriteriaPreview()">
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Выполнено 50-69% работы, есть существенные ошибки" 
                           placeholder="Описание критерия" onchange="updateCriteriaPreview()">
                </div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge grade-2">2</span> Неудовлетворительно</div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="0" min="0" max="100" onchange="updateCriteriaPreview()">
                    -
                    <input type="number" class="criteria-max" value="49" min="0" max="100" onchange="updateCriteriaPreview()">
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Выполнено менее 50% работы" 
                           placeholder="Описание критерия" onchange="updateCriteriaPreview()">
                </div>
            </div>
        </div>
    `;
}

function updateCriteriaPreview() {
    const preview = document.getElementById('criteriaPreview');
    const rows = document.querySelectorAll('.criteria-row:not(.header)');
    
    let previewHTML = '<div class="criteria-preview-grid">';
    
    rows.forEach(row => {
        const grade = row.querySelector('.grade-badge').textContent;
        const min = row.querySelector('.criteria-min').value;
        const max = row.querySelector('.criteria-max').value;
        const desc = row.querySelector('.criteria-desc').value;
        
        previewHTML += `
            <div class="preview-item">
                <div class="preview-grade grade-${grade}">${grade}</div>
                <div class="preview-range">${min}-${max}</div>
                <div class="preview-desc">${desc}</div>
            </div>
        `;
    });
    
    previewHTML += '</div>';
    preview.innerHTML = previewHTML;
}

// Применение пресетов
function applyPreset(presetName) {
    const presets = {
        'standard_5': {
            ranges: [[85,100], [70,84], [50,69], [0,49]],
            descs: [
                'Отличное выполнение, ошибок нет',
                'Хорошее выполнение, незначительные ошибки',
                'Удовлетворительно, есть пробелы в знаниях',
                'Неудовлетворительно, требуется повторение'
            ]
        },
        'vpr_percent': {
            ranges: [[90,100], [75,89], [60,74], [0,59]],
            descs: [
                'Высокий уровень подготовки',
                'Повышенный уровень подготовки',
                'Базовый уровень подготовки',
                'Недостаточный уровень подготовки'
            ]
        }
    };
    
    const preset = presets[presetName];
    if (preset) {
        const rows = document.querySelectorAll('.criteria-row:not(.header)');
        rows.forEach((row, index) => {
            if (preset.ranges[index]) {
                row.querySelector('.criteria-min').value = preset.ranges[index][0];
                row.querySelector('.criteria-max').value = preset.ranges[index][1];
                if (preset.descs[index]) {
                    row.querySelector('.criteria-desc').value = preset.descs[index];
                }
            }
        });
        updateCriteriaPreview();
        showNotification(`Пресет "${presetName}" применен`, 'success');
    }
}
// Вставьте этот код в конец файла script.js, после всех существующих функций

// ========== ФУНКЦИИ ДЛЯ КРИТЕРИЕВ ОЦЕНИВАНИЯ ==========

function generateOgeCriteria() {
    return `
        <div class="criteria-grid">
            <div class="criteria-row header">
                <div class="criteria-grade">Уровень</div>
                <div class="criteria-range">Первичные баллы</div>
                <div class="criteria-range">Тестовые баллы</div>
                <div class="criteria-description">Оценка</div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge grade-5">5</span> Высокий</div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="22" min="0" max="32">
                    -
                    <input type="number" class="criteria-max" value="32" min="0" max="32">
                </div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="29" min="0" max="39" disabled>
                    -
                    <input type="number" class="criteria-max" value="39" min="0" max="39" disabled>
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Отлично освоил программу">
                </div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge grade-4">4</span> Повышенный</div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="15" min="0" max="32">
                    -
                    <input type="number" class="criteria-max" value="21" min="0" max="32">
                </div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="23" min="0" max="39" disabled>
                    -
                    <input type="number" class="criteria-max" value="28" min="0" max="39" disabled>
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Хорошо освоил программу">
                </div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge grade-3">3</span> Базовый</div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="8" min="0" max="32">
                    -
                    <input type="number" class="criteria-max" value="14" min="0" max="32">
                </div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="15" min="0" max="39" disabled>
                    -
                    <input type="number" class="criteria-max" value="22" min="0" max="39" disabled>
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Удовлетворительно освоил программу">
                </div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge grade-2">2</span> Недостаточный</div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="0" min="0" max="32">
                    -
                    <input type="number" class="criteria-max" value="7" min="0" max="32">
                </div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="0" min="0" max="39" disabled>
                    -
                    <input type="number" class="criteria-max" value="14" min="0" max="39" disabled>
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Не освоил программу">
                </div>
            </div>
        </div>
    `;
}

function generateEgeCriteria() {
    return `
        <div class="criteria-grid">
            <div class="criteria-row header">
                <div class="criteria-grade">Уровень</div>
                <div class="criteria-range">Первичные баллы</div>
                <div class="criteria-range">Тестовые баллы</div>
                <div class="criteria-description">Минимальный порог</div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge grade-5">100</span> Максимум</div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="31" min="0" max="31">
                    -
                    <input type="number" class="criteria-max" value="31" min="0" max="31">
                </div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="100" min="0" max="100" disabled>
                    -
                    <input type="number" class="criteria-max" value="100" min="0" max="100" disabled>
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Максимальный результат">
                </div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge grade-4">Высокий</span></div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="25" min="0" max="31">
                    -
                    <input type="number" class="criteria-max" value="30" min="0" max="31">
                </div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="80" min="0" max="100" disabled>
                    -
                    <input type="number" class="criteria-max" value="99" min="0" max="100" disabled>
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Высокий балл для вуза">
                </div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge grade-3">Проходной</span></div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="10" min="0" max="31">
                    -
                    <input type="number" class="criteria-max" value="24" min="0" max="31">
                </div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="36" min="0" max="100" disabled>
                    -
                    <input type="number" class="criteria-max" value="79" min="0" max="100" disabled>
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Минимальный балл для аттестата">
                </div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge grade-2">Незачет</span></div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="0" min="0" max="31">
                    -
                    <input type="number" class="criteria-max" value="9" min="0" max="31">
                </div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="0" min="0" max="100" disabled>
                    -
                    <input type="number" class="criteria-max" value="35" min="0" max="100" disabled>
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Не преодолен минимальный порог">
                </div>
            </div>
        </div>
    `;
}

function generateVprCriteria() {
    return `
        <div class="criteria-grid">
            <div class="criteria-row header">
                <div class="criteria-grade">Уровень</div>
                <div class="criteria-range">Проценты</div>
                <div class="criteria-range">Баллы</div>
                <div class="criteria-description">Интерпретация</div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge grade-5">Высокий</span></div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="85" min="0" max="100">
                    -
                    <input type="number" class="criteria-max" value="100" min="0" max="100">
                </div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="17" min="0" max="20" disabled>
                    -
                    <input type="number" class="criteria-max" value="20" min="0" max="20" disabled>
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Высокий уровень подготовки">
                </div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge grade-4">Повышенный</span></div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="70" min="0" max="100">
                    -
                    <input type="number" class="criteria-max" value="84" min="0" max="100">
                </div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="14" min="0" max="20" disabled>
                    -
                    <input type="number" class="criteria-max" value="16" min="0" max="20" disabled>
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Повышенный уровень подготовки">
                </div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge grade-3">Базовый</span></div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="50" min="0" max="100">
                    -
                    <input type="number" class="criteria-max" value="69" min="0" max="100">
                </div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="10" min="0" max="20" disabled>
                    -
                    <input type="number" class="criteria-max" value="13" min="0" max="20" disabled>
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Базовый уровень подготовки">
                </div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge grade-2">Недостаточный</span></div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="0" min="0" max="100">
                    -
                    <input type="number" class="criteria-max" value="49" min="0" max="100">
                </div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="0" min="0" max="20" disabled>
                    -
                    <input type="number" class="criteria-max" value="9" min="0" max="20" disabled>
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Недостаточный уровень подготовки">
                </div>
            </div>
        </div>
    `;
}

function generatePsychologyCriteria() {
    return `
        <div class="criteria-grid">
            <div class="criteria-row header">
                <div class="criteria-grade">Уровень</div>
                <div class="criteria-range">Баллы</div>
                <div class="criteria-description">Характеристика</div>
                <div class="criteria-description">Рекомендации</div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge level-high">Высокий</span></div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="18" min="0" max="24">
                    -
                    <input type="number" class="criteria-max" value="24" min="0" max="24">
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Высокий уровень развития качества">
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Поддержка и развитие сильных сторон">
                </div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge level-medium">Средний</span></div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="12" min="0" max="24">
                    -
                    <input type="number" class="criteria-max" value="17" min="0" max="24">
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Средний уровень развития качества">
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Развивающая работа, тренировка">
                </div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge level-low">Низкий</span></div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="0" min="0" max="24">
                    -
                    <input type="number" class="criteria-max" value="11" min="0" max="24">
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Низкий уровень развития качества">
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Коррекционная работа, поддержка">
                </div>
            </div>
        </div>
    `;
}

function changeCriteriaType() {
    const type = document.getElementById('criteriaType').value;
    const container = document.getElementById('criteriaSettingsContainer');
    
    switch(type) {
        case 'points':
            container.innerHTML = generateFivePointCriteria();
            break;
        case 'percent':
            container.innerHTML = generatePercentCriteria();
            break;
        case 'custom':
            container.innerHTML = generateCustomCriteria();
            break;
    }
    
    updateCriteriaPreview();
}

function generatePercentCriteria() {
    return `
        <div class="criteria-grid">
            <div class="criteria-row header">
                <div class="criteria-grade">Оценка</div>
                <div class="criteria-range">Проценты (%)</div>
                <div class="criteria-description">Критерии</div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge grade-5">5</span> Отлично</div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="90" min="0" max="100">
                    -
                    <input type="number" class="criteria-max" value="100" min="0" max="100">
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Выполнено 90-100% работы">
                </div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge grade-4">4</span> Хорошо</div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="75" min="0" max="100">
                    -
                    <input type="number" class="criteria-max" value="89" min="0" max="100">
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Выполнено 75-89% работы">
                </div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge grade-3">3</span> Удовлетворительно</div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="60" min="0" max="100">
                    -
                    <input type="number" class="criteria-max" value="74" min="0" max="100">
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Выполнено 60-74% работы">
                </div>
            </div>
            <div class="criteria-row">
                <div class="criteria-grade"><span class="grade-badge grade-2">2</span> Неудовлетворительно</div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="0" min="0" max="100">
                    -
                    <input type="number" class="criteria-max" value="59" min="0" max="100">
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" value="Выполнено менее 60% работы">
                </div>
            </div>
        </div>
    `;
}

function generateCustomCriteria() {
    return `
        <div class="criteria-grid">
            <div class="criteria-row header">
                <div class="criteria-grade">Уровень</div>
                <div class="criteria-range">Диапазон</div>
                <div class="criteria-description">Описание</div>
                <div class="criteria-action">
                    <button class="btn-icon small" onclick="addCustomLevel()">+</button>
                </div>
            </div>
            <div id="customLevelsContainer">
                <div class="criteria-row">
                    <div class="criteria-grade">
                        <input type="text" class="level-name" value="Уровень 1" placeholder="Название уровня">
                    </div>
                    <div class="criteria-range">
                        <input type="number" class="criteria-min" value="0" min="0">
                        -
                        <input type="number" class="criteria-max" value="10" min="0">
                    </div>
                    <div class="criteria-description">
                        <input type="text" class="criteria-desc" value="Начальный уровень">
                    </div>
                    <div class="criteria-action">
                        <button class="btn-icon small danger" onclick="removeLevel(this)">×</button>
                    </div>
                </div>
                <div class="criteria-row">
                    <div class="criteria-grade">
                        <input type="text" class="level-name" value="Уровень 2" placeholder="Название уровня">
                    </div>
                    <div class="criteria-range">
                        <input type="number" class="criteria-min" value="11" min="0">
                        -
                        <input type="number" class="criteria-max" value="20" min="0">
                    </div>
                    <div class="criteria-description">
                        <input type="text" class="criteria-desc" value="Средний уровень">
                    </div>
                    <div class="criteria-action">
                        <button class="btn-icon small danger" onclick="removeLevel(this)">×</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function addCustomLevel() {
    const container = document.getElementById('customLevelsContainer');
    const levelCount = container.children.length + 1;
    
    const newLevel = document.createElement('div');
    newLevel.className = 'criteria-row';
    newLevel.innerHTML = `
        <div class="criteria-grade">
            <input type="text" class="level-name" value="Уровень ${levelCount}" placeholder="Название уровня">
        </div>
        <div class="criteria-range">
            <input type="number" class="criteria-min" value="${levelCount * 10}" min="0">
            -
            <input type="number" class="criteria-max" value="${levelCount * 10 + 10}" min="0">
        </div>
        <div class="criteria-description">
            <input type="text" class="criteria-desc" value="Новый уровень" placeholder="Описание уровня">
        </div>
        <div class="criteria-action">
            <button class="btn-icon small danger" onclick="removeLevel(this)">×</button>
        </div>
    `;
    
    container.appendChild(newLevel);
    updateCriteriaPreview();
}

function removeLevel(button) {
    const row = button.closest('.criteria-row');
    if (row && document.querySelectorAll('.criteria-row').length > 1) {
        row.remove();
        updateCriteriaPreview();
    }
}

function saveCriteriaSettings() {
    const type = document.getElementById('criteriaType').value;
    const criteria = [];
    
    if (type === 'custom') {
        document.querySelectorAll('#customLevelsContainer .criteria-row').forEach(row => {
            const name = row.querySelector('.level-name').value;
            const min = parseInt(row.querySelector('.criteria-min').value) || 0;
            const max = parseInt(row.querySelector('.criteria-max').value) || 0;
            const desc = row.querySelector('.criteria-desc').value;
            
            criteria.push({
                name: name,
                min: min,
                max: max,
                description: desc
            });
        });
    } else {
        document.querySelectorAll('.criteria-grid .criteria-row:not(.header)').forEach(row => {
            const grade = row.querySelector('.grade-badge').textContent;
            const min = parseInt(row.querySelector('.criteria-min').value) || 0;
            const max = parseInt(row.querySelector('.criteria-max').value) || 0;
            const desc = row.querySelector('.criteria-desc').value;
            
            criteria.push({
                grade: grade,
                min: min,
                max: max,
                description: desc
            });
        });
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('criteriaSettings', JSON.stringify({
        type: type,
        criteria: criteria
    }));
    
    showNotification('Критерии сохранены', 'success');
}

function loadDefaultCriteria() {
    const type = document.getElementById('criteriaType').value;
    
    switch(type) {
        case 'points':
            document.getElementById('criteriaSettingsContainer').innerHTML = generateFivePointCriteria();
            break;
        case 'percent':
            document.getElementById('criteriaSettingsContainer').innerHTML = generatePercentCriteria();
            break;
        case 'custom':
            document.getElementById('criteriaSettingsContainer').innerHTML = generateCustomCriteria();
            break;
    }
    
    updateCriteriaPreview();
    showNotification('Стандартные критерии загружены', 'info');
}

function generateAutoCriteria() {
    const maxScore = parseInt(prompt('Введите максимальный балл работы:', '100')) || 100;
    const levels = parseInt(prompt('Сколько уровней оценивания? (2-5):', '4')) || 4;
    
    let criteriaHTML = '<div class="criteria-grid"><div class="criteria-row header">';
    criteriaHTML += '<div class="criteria-grade">Оценка</div>';
    criteriaHTML += '<div class="criteria-range">Диапазон</div>';
    criteriaHTML += '<div class="criteria-description">Критерии</div></div>';
    
    const levelNames = ['2', '3', '4', '5'];
    const levelDescriptions = [
        'Неудовлетворительно',
        'Удовлетворительно',
        'Хорошо',
        'Отлично'
    ];
    
    const step = Math.floor(maxScore / levels);
    
    for (let i = 0; i < levels; i++) {
        const minScore = i * step;
        const maxScoreLevel = (i === levels - 1) ? maxScore : (i + 1) * step - 1;
        
        criteriaHTML += `
            <div class="criteria-row">
                <div class="criteria-grade">
                    <span class="grade-badge grade-${levelNames[i]}">${levelNames[i]}</span>
                    ${levelDescriptions[i]}
                </div>
                <div class="criteria-range">
                    <input type="number" class="criteria-min" value="${minScore}" min="0" max="${maxScore}">
                    -
                    <input type="number" class="criteria-max" value="${maxScoreLevel}" min="0" max="${maxScore}">
                </div>
                <div class="criteria-description">
                    <input type="text" class="criteria-desc" 
                           value="${levelDescriptions[i]}: ${minScore}-${maxScoreLevel} баллов">
                </div>
            </div>
        `;
    }
    
    criteriaHTML += '</div>';
    
    document.getElementById('criteriaSettingsContainer').innerHTML = criteriaHTML;
    updateCriteriaPreview();
    showNotification('Критерии сгенерированы автоматически', 'success');
}

function restoreBackupDialog() {
    const backupData = prompt('Введите данные резервной копии (JSON):');
    
    if (backupData) {
        try {
            const data = JSON.parse(backupData);
            
            // Восстанавливаем настройки
            Object.keys(data.settings || {}).forEach(key => {
                const element = document.getElementById(key);
                if (element) element.value = data.settings[key];
            });
            
            // Восстанавливаем критерии
            if (data.criteria) {
                localStorage.setItem('criteriaSettings', JSON.stringify(data.criteria));
                loadCriteriaForWorkType(data.settings?.workType || 'current');
            }
            
            showNotification('Резервная копия восстановлена', 'success');
        } catch (e) {
            showNotification('Ошибка при восстановлении данных', 'error');
        }
    }
}

// CSS для критериев (добавьте в файл CSS)
const criteriaCSS = `
.criteria-grid {
    background: white;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #e9ecef;
    margin-bottom: 20px;
}

.criteria-row {
    display: grid;
    grid-template-columns: 150px 150px 1fr;
    gap: 15px;
    padding: 12px 15px;
    border-bottom: 1px solid #f1f1f1;
    align-items: center;
}

.criteria-row.header {
    background: #f8f9fa;
    font-weight: bold;
    color: #333;
}

.criteria-grade {
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
}

.criteria-range {
    display: flex;
    align-items: center;
    gap: 5px;
}

.criteria-range input {
    width: 70px;
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.criteria-range input:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
}

.criteria-description input {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.grade-badge {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
}

.grade-5 { background: #4CAF50; }
.grade-4 { background: #8BC34A; }
.grade-3 { background: #FFC107; }
.grade-2 { background: #F44336; }
.level-high { background: #4CAF50; }
.level-medium { background: #FFC107; }
.level-low { background: #F44336; }

.criteria-action {
    display: flex;
    gap: 5px;
}

.btn-icon.small {
    padding: 4px 8px;
    font-size: 12px;
}

.btn-icon.small.danger {
    background: #F44336;
}

.preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-top: 15px;
}

.preview-item {
    background: white;
    border-radius: 8px;
    padding: 15px;
    border: 2px solid #e9ecef;
    text-align: center;
    transition: all 0.3s ease;
}

.preview-item:hover {
    border-color: #667eea;
    transform: translateY(-2px);
}

.preview-grade {
    font-size: 1.8em;
    font-weight: bold;
    margin-bottom: 5px;
}

.preview-range {
    color: #666;
    font-size: 0.9em;
    margin-bottom: 10px;
}

.preview-desc {
    font-size: 0.85em;
    color: #333;
    line-height: 1.4;
}

.input-with-button {
    display: flex;
    gap: 10px;
}

.input-with-button input {
    flex: 1;
}

.form-control-large {
    padding: 12px;
    font-size: 16px;
    width: 100%;
}

@media (max-width: 768px) {
    .criteria-row {
        grid-template-columns: 1fr;
        gap: 10px;
    }
    
    .preview-grid {
        grid-template-columns: 1fr;
    }
}
`;

// Добавляем CSS в документ
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = criteriaCSS;
    document.head.appendChild(style);
});

// Инициализация при загрузке
window.addEventListener('load', function() {
    // Загружаем сохраненные критерии
    const savedCriteria = localStorage.getItem('criteriaSettings');
    if (savedCriteria) {
        try {
            const criteria = JSON.parse(savedCriteria);
            document.getElementById('criteriaType').value = criteria.type;
            changeCriteriaType();
        } catch (e) {
            console.error('Error loading criteria:', e);
        }
    }
    
    // Инициализируем предпросмотр
    updateCriteriaPreview();
});
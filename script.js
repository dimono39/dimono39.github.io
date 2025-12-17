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
// Закрытие модальных окон при клике вне контента
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем обработчик клика вне модального окна
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // Закрытие по клавише Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.show').forEach(modal => {
                modal.classList.remove('show');
                document.body.style.overflow = 'auto';
            });
        }
    });
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
    
	const progressBar = document.getElementById('setupProgress');
    const progressText = document.getElementById('progressText');

    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    
    if (progressText) {
        const progressTexts = [
            'Выберите тип работы',
            'Заполните основную информацию',
            'Укажите данные об учащихся',
            'Настройте критерии оценивания',
            'Настройка завершена!'
        ];
        let textIndex = Math.min(appState.currentStep - 1, progressTexts.length - 1);
        progressText.textContent = progressTexts[textIndex];
    }
}


// Обновление прогресса
function updateProgresss() {
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
    
	const progressBar = document.getElementById('setupProgress');
    const progressText = document.getElementById('progressText');

    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    
    if (progressText) {
        const progressTexts = [
            'Выберите тип работы',
            'Заполните основную информацию',
            'Укажите данные об учащихся',
            'Настройте критерии оценивания',
            'Настройка завершена!'
        ];
        let textIndex = Math.min(appState.currentStep - 1, progressTexts.length - 1);
        progressText.textContent = progressTexts[textIndex];
    }
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
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        // Блокируем прокрутку страницы
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        // Восстанавливаем прокрутку страницы
        document.body.style.overflow = 'auto';
    }
}

// Обновите функции showResetDialog и другие, которые используют модальные окна:
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

// ==================== ОБНОВЛЕННАЯ ФУНКЦИЯ ПРЕДПРОСМОТРА КРИТЕРИЕВ ====================

function updateCriteriaPreview() {
    const preview = document.getElementById('criteriaPreview');
    if (!preview) {
        console.warn('Элемент criteriaPreview не найден - возможно, это новая версия интерфейса');
        return;
    }
    
    const criteria = appData.test.criteria;
    if (!criteria || Object.keys(criteria).length === 0) {
        preview.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">Критерии не настроены</div>';
        return;
    }
    
    const maxScore = calculateMaxScore();
    let previewHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">';
    
    Object.entries(criteria).forEach(([grade, data]) => {
        const percentageMin = Math.round((data.min / maxScore) * 100);
        const percentageMax = Math.round((data.max / maxScore) * 100);
        const gradeColor = data.color || getGradeColor(grade);
        
        previewHTML += `
            <div class="preview-card" style="
                background: white; 
                border-radius: 10px; 
                padding: 15px; 
                text-align: center;
                border: 3px solid ${gradeColor};
                box-shadow: 0 3px 10px rgba(0,0,0,0.1);
                transition: transform 0.3s;
                cursor: pointer;
            " onclick="editGradeCard(${grade})" title="Нажмите для редактирования">
                <div style="
                    width: 50px; 
                    height: 50px; 
                    background: ${gradeColor}; 
                    color: white; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-weight: bold; 
                    font-size: 20px;
                    margin: 0 auto 10px;
                ">
                    ${grade}
                </div>
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">
                    ${data.name || getDefaultGradeName(grade)}
                </div>
                <div style="color: #666; font-size: 14px; margin-bottom: 10px;">
                    ${data.min} - ${data.max} баллов
                </div>
                <div style="font-size: 12px; color: #999;">
                    (${percentageMin}% - ${percentageMax}%)
                </div>
                ${data.description ? `
                <div style="
                    margin-top: 10px; 
                    padding-top: 10px; 
                    border-top: 1px dashed #eee; 
                    font-size: 11px; 
                    color: #666;
                    text-align: left;
                ">
                    ${data.description.substring(0, 60)}${data.description.length > 60 ? '...' : ''}
                </div>
                ` : ''}
            </div>
        `;
    });
    
    previewHTML += '</div>';
    
    // Добавляем статистику
    previewHTML += `
        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>Статистика критериев:</strong>
                    <div style="font-size: 12px; color: #666;">
                        ${Object.keys(criteria).length} градаций • 
                        Максимальный балл: ${maxScore} • 
                        Охват: 0-${maxScore} баллов
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-primary" onclick="switchCriteriaMode('visual')">
                    🎨 Настроить визуально
                </button>
            </div>
            
            <!-- Прогресс-бар распределения -->
            <div style="margin-top: 10px;">
                <div style="height: 10px; background: #e9ecef; border-radius: 5px; overflow: hidden; position: relative;">
                    ${Object.entries(criteria).map(([grade, data], index) => {
                        const width = ((data.max - data.min + 1) / maxScore) * 100;
                        const left = (data.min / maxScore) * 100;
                        const gradeColor = data.color || getGradeColor(grade);
                        return `
                            <div style="
                                position: absolute;
                                left: ${left}%;
                                width: ${width}%;
                                height: 100%;
                                background: ${gradeColor};
                                ${index === 0 ? 'border-top-left-radius: 5px; border-bottom-left-radius: 5px;' : ''}
                                ${index === Object.keys(criteria).length - 1 ? 'border-top-right-radius: 5px; border-bottom-right-radius: 5px;' : ''}
                            " title="${grade}: ${data.min}-${data.max}"></div>
                        `;
                    }).join('')}
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: #666; margin-top: 5px;">
                    <span>0</span>
                    <span>${Math.round(maxScore/2)}</span>
                    <span>${maxScore}</span>
                </div>
            </div>
        </div>
    `;
    
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
function updateCriteriaPreviewLegacy() {
    // Эта функция для совместимости со старым интерфейсом
    const preview = document.getElementById('criteriaPreview');
    if (!preview) return;
    
    const rows = document.querySelectorAll('.criteria-row:not(.header)');
    if (rows.length === 0) {
        // Используем новые данные если старых элементов нет
        updateCriteriaPreview();
        return;
    }
    
    let previewHTML = '<div class="preview-grid" id="previewGridContainer">';
    
    rows.forEach(row => {
        const gradeElement = row.querySelector('.grade-badge');
        const minInput = row.querySelector('.criteria-min');
        const maxInput = row.querySelector('.criteria-max');
        const descInput = row.querySelector('.criteria-desc input');
        
        if (!gradeElement || !minInput || !maxInput) {
            console.warn('Не найден элемент критериев');
            return;
        }
        
        const grade = gradeElement.textContent;
        const min = minInput.value;
        const max = maxInput.value;
        const desc = descInput ? descInput.value : '';
        
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
    
    // Добавляем стили если их нет
    if (!document.querySelector('#previewStyles')) {
        const styles = `
            <style id="previewStyles">
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
                
                .grade-5 { color: #4CAF50; }
                .grade-4 { color: #8BC34A; }
                .grade-3 { color: #FFC107; }
                .grade-2 { color: #F44336; }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}
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
// 📦 Инициализация модулей
document.addEventListener('DOMContentLoaded', function() {
  // Инициализируем обработчик ошибок
  if (!window.ErrorHandler) {
    console.error('ErrorHandler не загружен');
  }
  
  // Инициализируем рендерер таблиц
  if (!window.TableRenderer) {
    console.error('TableRenderer не загружен');
  }
  
  // Заменяем старые функции рендеринга таблиц
  replaceLegacyTableFunctions();
});

/**
 * Заменяет старые функции рендеринга на новые
 */
function replaceLegacyTableFunctions() {
  // Сохраняем старые функции для обратной совместимости
  window.legacyRenderResults = window.renderResults;
  window.legacyRenderTasks = window.renderTasks;
  
  // Переопределяем функции
  window.renderResults = function() {
    const container = document.getElementById('resultsContainer');
    if (!container || !window.TableRenderer) {
      // Fallback на старую реализацию
      if (window.legacyRenderResults) {
        return window.legacyRenderResults();
      }
      return;
    }
    
    try {
      window.TableRenderer.renderResultsTable(
        container,
        appData.results,
        appData.students,
        appData.tasks
      );
    } catch (error) {
      window.ErrorHandler.handle(error, 'renderResults');
      // Fallback
      container.innerHTML = '<div class="alert alert-danger">Ошибка при отображении результатов</div>';
    }
  };
  
  window.renderTasks = function() {
    const container = document.getElementById('tasksContainer');
    if (!container || !window.TableRenderer) {
      if (window.legacyRenderTasks) {
        return window.legacyRenderTasks();
      }
      return;
    }
    
    try {
      const columns = [
        { field: 'number', title: '№', width: '50px' },
        { field: 'type', title: 'Тип' },
        { field: 'text', title: 'Текст задания', render: (text) => 
          `<div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${text}</div>`
        },
        { field: 'maxScore', title: 'Макс. балл', width: '100px', align: 'center' },
        { field: 'level', title: 'Уровень', width: '100px', align: 'center',
          render: (level) => `<span class="badge" style="background-color: ${complexityLevels[level]?.color || '#ccc'}">${level}</span>`
        }
      ];
      
      window.TableRenderer.renderTable(
        container,
        appData.tasks,
        columns,
        { sortable: true, searchable: true }
      );
    } catch (error) {
      window.ErrorHandler.handle(error, 'renderTasks');
    }
  };
}


//============ тут для анализа где заполняется

// ==================== RENDER STUDENTS ANALYSIS ====================

function renderStudentsAnalysis() {
    const analysis = window.currentAnalysis || {};
    const students = analysis.byStudent || [];
    const summary = analysis.summary || {};
    
    let html = `
        <h4 style="margin-top: 0;">👥 Анализ успеваемости учащихся</h4>
        <p style="color: #666; margin-bottom: 15px;">${students.length} учащихся, отсортированных по рейтингу</p>
        
        <!-- Фильтры и сортировка -->
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <select id="studentSort" onchange="sortStudentsAnalysis()" style="padding: 5px; border-radius: 4px; border: 1px solid #ddd;">
                <option value="rank">По рейтингу</option>
                <option value="score">По баллам</option>
                <option value="percentage">По % выполнения</option>
                <option value="stability">По стабильности</option>
            </select>
            
            <input type="text" id="studentSearch" placeholder="Поиск по имени..." 
                   oninput="searchStudents()" style="flex: 1; padding: 5px; border-radius: 4px; border: 1px solid #ddd;">
            
            <button class="btn btn-sm btn-outline" onclick="exportStudentList()">
                📥 Экспорт списка
            </button>
        </div>
        
        <div style="max-height: 400px; overflow-y: auto;">
            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <thead style="position: sticky; top: 0; background: white; z-index: 10;">
                    <tr>
                        <th style="padding: 10px; background: #f8f9fa; text-align: center; width: 50px;">Ранг</th>
                        <th style="padding: 10px; background: #f8f9fa;">Учащийся</th>
                        <th style="padding: 10px; background: #f8f9fa; text-align: center; width: 80px;">Баллы</th>
                        <th style="padding: 10px; background: #f8f9fa; text-align: center; width: 80px;">%</th>
                        <th style="padding: 10px; background: #f8f9fa; text-align: center; width: 60px;">Оценка</th>
                        <th style="padding: 10px; background: #f8f9fa; text-align: center; width: 80px;">Стабильность</th>
                        <th style="padding: 10px; background: #f8f9fa; text-align: center; width: 100px;">Сильные/слабые</th>
                        <th style="padding: 10px; background: #f8f9fa; text-align: center; width: 80px;">Действия</th>
                    </tr>
                </thead>
                <tbody id="studentsAnalysisBody">
    `;
    
    // Рендерим таблицу
    students.forEach(student => {
        const gradeColor = getGradeColor(student.grade);
        const stabilityColor = student.stability >= 80 ? '#27ae60' :
                             student.stability >= 60 ? '#3498db' :
                             student.stability >= 40 ? '#f39c12' : '#e74c3c';
        
        html += `
            <tr data-student-id="${student.id}" data-student-name="${student.name.toLowerCase()}">
                <td style="padding: 8px; text-align: center; font-weight: bold;">
                    <span style="display: inline-block; width: 25px; height: 25px; background: ${student.rank <= 3 ? '#f39c12' : '#3498db'}; color: white; border-radius: 50%; line-height: 25px;">
                        ${student.rank}
                    </span>
                </td>
                <td style="padding: 8px;">
                    <div style="font-weight: 500;">${student.name}</div>
                    <div style="font-size: 10px; color: #666;">Выполнено: ${student.completedTasks}/${appData.tasks.length}</div>
                </td>
                <td style="padding: 8px; text-align: center;">
                    <div style="font-weight: bold;">${student.totalScore}</div>
                    <div style="font-size: 10px; color: #666;">/${student.maxPossible}</div>
                </td>
                <td style="padding: 8px; text-align: center;">
                    <div style="font-weight: bold; color: ${getPercentageColor(student.percentage)};">
                        ${student.percentage}%
                    </div>
                    <div style="font-size: 10px; color: #666;">${student.percentile} перцентиль</div>
                </td>
                <td style="padding: 8px; text-align: center;">
                    <div style="width: 30px; height: 30px; background: ${gradeColor}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin: 0 auto;">
                        ${student.grade}
                    </div>
                </td>
                <td style="padding: 8px; text-align: center;">
                    <div style="color: ${stabilityColor}; font-weight: bold;">${student.stability}</div>
                    <div style="font-size: 10px; color: #666;">из 100</div>
                </td>
                <td style="padding: 8px; text-align: center;">
                    <div style="font-size: 10px;">
                        <span style="color: #27ae60;">Сильные: ${student.strengths.length > 0 ? student.strengths.join(',') : '-'}</span><br>
                        <span style="color: #e74c3c;">Слабые: ${student.weaknesses.length > 0 ? student.weaknesses.join(',') : '-'}</span>
                    </div>
                </td>
                <td style="padding: 8px; text-align: center;">
                    <button class="btn-icon small" onclick="showStudentDetails(${student.index})" title="Детальный анализ">
                        📊
                    </button>
                    <button class="btn-icon small" onclick="generateStudentReport(${student.index})" title="Отчет">
                        📄
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        
        <!-- Групповой анализ -->
        <div style="margin-top: 20px;">
            <h5>📊 Групповые показатели</h5>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 10px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <strong>Распределение оценок:</strong>
                    <div style="margin-top: 10px;">
    `;
    
    // Распределение оценок
    const gradeDistribution = {2: 0, 3: 0, 4: 0, 5: 0};
    students.forEach(student => {
        const grade = Math.floor(student.grade);
        if (gradeDistribution[grade] !== undefined) {
            gradeDistribution[grade]++;
        }
    });
    
    Object.entries(gradeDistribution).forEach(([grade, count]) => {
        const percentage = (count / students.length * 100).toFixed(1);
        html += `
            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                <span>Оценка ${grade}:</span>
                <span>${count} (${percentage}%)</span>
            </div>
        `;
    });
    
    html += `
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <strong>Категории учащихся:</strong>
                    <div style="margin-top: 10px;">
    `;
    
    // Категории успеваемости
    const categories = {
        excellent: students.filter(s => s.percentage >= 80).length,
        good: students.filter(s => s.percentage >= 60 && s.percentage < 80).length,
        average: students.filter(s => s.percentage >= 40 && s.percentage < 60).length,
        weak: students.filter(s => s.percentage >= 20 && s.percentage < 40).length,
        critical: students.filter(s => s.percentage < 20).length
    };
    
    Object.entries(categories).forEach(([category, count]) => {
        const names = {
            excellent: 'Отличники',
            good: 'Хорошисты', 
            average: 'Средние',
            weak: 'Слабые',
            critical: 'Критические'
        };
        const percentage = (count / students.length * 100).toFixed(1);
        html += `
            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                <span>${names[category]}:</span>
                <span>${count} (${percentage}%)</span>
            </div>
        `;
    });
    
    html += `
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <strong>Статистика:</strong>
                    <div style="margin-top: 10px;">
                        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Макс. балл:</span>
                            <span>${summary.maxScore}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Мин. балл:</span>
                            <span>${summary.minScore}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Разброс:</span>
                            <span>${summary.scoreRange}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Медиана:</span>
                            <span>${summary.medianScore}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return html;
}

function sortStudentsAnalysis() {
    const sortBy = document.getElementById('studentSort').value;
    const students = window.currentAnalysis?.byStudent || [];
    
    const sorted = [...students].sort((a, b) => {
        switch(sortBy) {
            case 'score': return b.totalScore - a.totalScore;
            case 'percentage': return b.percentage - a.percentage;
            case 'stability': return b.stability - a.stability;
            default: return a.rank - b.rank;
        }
    });
    
    // Обновляем таблицу
    const tbody = document.getElementById('studentsAnalysisBody');
    if (tbody) {
        tbody.innerHTML = '';
        
        sorted.forEach(student => {
            const gradeColor = getGradeColor(student.grade);
            const stabilityColor = student.stability >= 80 ? '#27ae60' :
                                 student.stability >= 60 ? '#3498db' :
                                 student.stability >= 40 ? '#f39c12' : '#e74c3c';
            
            const row = document.createElement('tr');
            row.dataset.studentId = student.id;
            row.dataset.studentName = student.name.toLowerCase();
            row.innerHTML = `
                <td style="padding: 8px; text-align: center; font-weight: bold;">
                    <span style="display: inline-block; width: 25px; height: 25px; background: ${student.rank <= 3 ? '#f39c12' : '#3498db'}; color: white; border-radius: 50%; line-height: 25px;">
                        ${student.rank}
                    </span>
                </td>
                <td style="padding: 8px;">
                    <div style="font-weight: 500;">${student.name}</div>
                    <div style="font-size: 10px; color: #666;">Выполнено: ${student.completedTasks}/${appData.tasks.length}</div>
                </td>
                <td style="padding: 8px; text-align: center;">
                    <div style="font-weight: bold;">${student.totalScore}</div>
                    <div style="font-size: 10px; color: #666;">/${student.maxPossible}</div>
                </td>
                <td style="padding: 8px; text-align: center;">
                    <div style="font-weight: bold; color: ${getPercentageColor(student.percentage)};">
                        ${student.percentage}%
                    </div>
                    <div style="font-size: 10px; color: #666;">${student.percentile} перцентиль</div>
                </td>
                <td style="padding: 8px; text-align: center;">
                    <div style="width: 30px; height: 30px; background: ${gradeColor}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin: 0 auto;">
                        ${student.grade}
                    </div>
                </td>
                <td style="padding: 8px; text-align: center;">
                    <div style="color: ${stabilityColor}; font-weight: bold;">${student.stability}</div>
                    <div style="font-size: 10px; color: #666;">из 100</div>
                </td>
                <td style="padding: 8px; text-align: center;">
                    <div style="font-size: 10px;">
                        <span style="color: #27ae60;">Сильные: ${student.strengths.length > 0 ? student.strengths.join(',') : '-'}</span><br>
                        <span style="color: #e74c3c;">Слабые: ${student.weaknesses.length > 0 ? student.weaknesses.join(',') : '-'}</span>
                    </div>
                </td>
                <td style="padding: 8px; text-align: center;">
                    <button class="btn-icon small" onclick="showStudentDetails(${student.index})" title="Детальный анализ">
                        📊
                    </button>
                    <button class="btn-icon small" onclick="generateStudentReport(${student.index})" title="Отчет">
                        📄
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }
}

function searchStudents() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#studentsAnalysisBody tr');
    
    rows.forEach(row => {
        const studentName = row.dataset.studentName || '';
        if (studentName.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// ==================== RENDER LEVELS ANALYSIS ====================

function renderLevelsAnalysis() {
    const analysis = window.currentAnalysis || {};
    const levels = analysis.byLevel || {};
    
    let html = `
        <h4 style="margin-top: 0;">🎯 Анализ по уровням сложности</h4>
        <p style="color: #666; margin-bottom: 15px;">Выполнение заданий по таксономии Блума</p>
        
        <!-- Визуализация -->
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 20px;">
            <!-- График -->
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
                <h5 style="margin-top: 0;">Процент выполнения по уровням</h5>
                <div id="levelsChart" style="height: 200px; position: relative;">
    `;
    
    // Создаем график
    const levelData = Object.values(levels);
    if (levelData.length > 0) {
        const maxPercentage = Math.max(...levelData.map(l => parseFloat(l.avgPercentage))) || 100;
        
        levelData.forEach(level => {
            const percentage = parseFloat(level.avgPercentage);
            const barWidth = (percentage / maxPercentage * 100) + '%';
            const deviation = parseFloat(level.deviation);
            
            html += `
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="font-weight: 500;">${level.levelName}</span>
                        <span style="font-weight: bold; color: ${level.color}">${percentage}%</span>
                    </div>
                    <div style="height: 20px; background: #f8f9fa; border-radius: 10px; overflow: hidden; position: relative;">
                        <div style="height: 100%; width: ${barWidth}; background: ${level.color}; transition: width 1s;"></div>
                        <div style="position: absolute; left: ${level.expectedPercentage / maxPercentage * 100}%; top: 0; bottom: 0; width: 2px; background: #2c3e50;"></div>
                    </div>
                    <div style="font-size: 11px; color: #666; margin-top: 3px;">
                        <span>Ожидалось: ${level.expectedPercentage}%</span>
                        <span style="margin-left: 10px; color: ${deviation >= 0 ? '#27ae60' : '#e74c3c'}">
                            ${deviation >= 0 ? '+' : ''}${deviation}%
                        </span>
                    </div>
                </div>
            `;
        });
    }
    
    html += `
                </div>
            </div>
            
            <!-- Легенда и статистика -->
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                <h5 style="margin-top: 0;">Статистика по уровням</h5>
                <div style="margin-top: 10px;">
    `;
    
    Object.entries(levels).forEach(([level, data]) => {
        const deviation = parseFloat(data.deviation);
        const performanceIcon = deviation >= 10 ? '🚀' :
                              deviation >= 0 ? '✅' :
                              deviation >= -10 ? '⚠️' : '🔻';
        
        html += `
            <div style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid ${data.color};">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                    <span style="font-size: 20px;">${performanceIcon}</span>
                    <strong>${data.levelName}</strong>
                </div>
                <div style="font-size: 12px;">
                    <div>Заданий: ${data.taskCount}</div>
                    <div>Выполнение: ${data.avgPercentage}%</div>
                    <div>Ожидалось: ${data.expectedPercentage}%</div>
                    <div style="color: ${deviation >= 0 ? '#27ae60' : '#e74c3c'};">
                        Отклонение: ${deviation >= 0 ? '+' : ''}${deviation}%
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
        </div>
        
        <!-- Детальная таблица -->
        <h5>📊 Детальный анализ по уровням</h5>
        <div style="max-height: 300px; overflow-y: auto; margin-top: 10px;">
            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="padding: 10px; background: #f8f9fa; text-align: center;">Уровень</th>
                        <th style="padding: 10px; background: #f8f9fa; text-align: center;">Заданий</th>
                        <th style="padding: 10px; background: #f8f9fa; text-align: center;">% выполнения</th>
                        <th style="padding: 10px; background: #f8f9fa; text-align: center;">Ожидалось</th>
                        <th style="padding: 10px; background: #f8f9fa; text-align: center;">Отклонение</th>
                        <th style="padding: 10px; background: #f8f9fa; text-align: center;">Статус</th>
                        <th style="padding: 10px; background: #f8f9fa; text-align: center;">Рекомендации</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    Object.entries(levels).forEach(([level, data]) => {
        const deviation = parseFloat(data.deviation);
        let status = '';
        let recommendation = '';
        
        if (deviation >= 15) {
            status = '<span style="color: #27ae60;">✅ Выше нормы</span>';
            recommendation = 'Можно добавить более сложные задания этого уровня';
        } else if (deviation >= 0) {
            status = '<span style="color: #3498db;">👍 Норма</span>';
            recommendation = 'Уровень сложности соответствует группе';
        } else if (deviation >= -15) {
            status = '<span style="color: #f39c12;">⚠️ Ниже нормы</span>';
            recommendation = 'Требуется дополнительная отработка';
        } else {
            status = '<span style="color: #e74c3c;">🔻 Критично</span>';
            recommendation = 'Необходимо повторное объяснение темы';
        }
        
        html += `
            <tr>
                <td style="padding: 8px; text-align: center;">
                    <span style="display: inline-block; padding: 5px 10px; background: ${data.color}; color: white; border-radius: 15px; font-weight: bold;">
                        ${level}. ${data.levelName}
                    </span>
                </td>
                <td style="padding: 8px; text-align: center;">${data.taskCount}</td>
                <td style="padding: 8px; text-align: center; font-weight: bold;">${data.avgPercentage}%</td>
                <td style="padding: 8px; text-align: center;">${data.expectedPercentage}%</td>
                <td style="padding: 8px; text-align: center; color: ${deviation >= 0 ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
                    ${deviation >= 0 ? '+' : ''}${deviation}%
                </td>
                <td style="padding: 8px; text-align: center;">${status}</td>
                <td style="padding: 8px; font-size: 11px;">${recommendation}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        
        <!-- Рекомендации -->
        <div style="margin-top: 20px; padding: 15px; background: #e8f4fc; border-radius: 8px;">
            <h5 style="margin-top: 0;">💡 Общие рекомендации</h5>
            <ul style="margin: 10px 0 0 20px; font-size: 13px;">
                <li>Если отклонение положительное - группа хорошо усвоила материал этого уровня</li>
                <li>Отрицательное отклонение более 10% требует коррекционной работы</li>
                <li>Равномерное распределение по уровням обеспечивает объективную оценку</li>
                <li>Для подготовки к экзаменам увеличивайте долю заданий 2-3 уровня</li>
            </ul>
        </div>
    `;
    
    return html;
}

// ==================== RENDER ERRORS ANALYSIS ====================

function renderErrorsAnalysis() {
    const analysis = window.currentAnalysis || {};
    const errors = analysis.byErrorType || {};
    
    let html = `
        <h4 style="margin-top: 0;">🔍 Анализ по типам ошибок</h4>
        <p style="color: #666; margin-bottom: 15px;">${Object.keys(errors).length} типов ошибок, выявленных в заданиях</p>
        
        <!-- Круговая диаграмма -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #eee; text-align: center;">
                <h5 style="margin-top: 0;">Распределение ошибок</h5>
                <div id="errorsPieChart" style="height: 200px; display: flex; align-items: center; justify-content: center;">
                    <div style="position: relative; width: 150px; height: 150px;">
    `;
    
    // Создаем круговую диаграмму
    const errorEntries = Object.entries(errors);
    if (errorEntries.length > 0) {
        let startAngle = 0;
        const totalTasks = errorEntries.reduce((sum, [_, data]) => sum + data.count, 0);
        
        errorEntries.forEach(([errorKey, data], index) => {
            const percentage = (data.count / totalTasks * 100).toFixed(1);
            const angle = (data.count / totalTasks * 360).toFixed(1);
            
            html += `
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
                    <div style="position: absolute; top: 50%; left: 50%; width: 150px; height: 150px; border-radius: 50%; 
                          background: conic-gradient(${data.color} ${startAngle}deg ${parseFloat(startAngle) + parseFloat(angle)}deg, transparent ${parseFloat(startAngle) + parseFloat(angle)}deg); 
                          transform: translate(-50%, -50%) rotate(-90deg);">
                    </div>
                </div>
            `;
            
            startAngle += parseFloat(angle);
        });
        
        // Центр
        html += `
                        <div style="position: absolute; top: 50%; left: 50%; width: 70px; height: 70px; background: white; border-radius: 50%; transform: translate(-50%, -50%);"></div>
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                            <div style="font-size: 24px; font-weight: bold;">${totalTasks}</div>
                            <div style="font-size: 10px; color: #666;">заданий</div>
                        </div>
        `;
    } else {
        html += `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">
                Нет данных по типам ошибок
            </div>
        `;
    }
    
    html += `
                    </div>
                </div>
            </div>
            
            <!-- Легенда -->
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                <h5 style="margin-top: 0;">Типы ошибок</h5>
                <div style="margin-top: 10px; max-height: 180px; overflow-y: auto;">
    `;
    
    errorEntries.forEach(([errorKey, data]) => {
        const percentage = (data.count / appData.tasks.length * 100).toFixed(1);
        
        html += `
            <div style="display: flex; align-items: center; gap: 10px; padding: 8px; border-bottom: 1px solid #eee;">
                <div style="width: 15px; height: 15px; background: ${data.color}; border-radius: 3px;"></div>
                <div style="flex: 1; font-size: 13px;">
                    <div style="font-weight: 500;">${data.name}</div>
                    <div style="font-size: 11px; color: #666;">
                        ${data.count} заданий (${percentage}%) | ${data.percentage}% выполнения
                    </div>
                </div>
                <div style="font-size: 12px; font-weight: bold; color: ${parseFloat(data.percentage) >= 50 ? '#27ae60' : '#e74c3c'}">
                    ${data.percentage}%
                </div>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
        </div>
        
        <!-- Детальная таблица -->
        <h5>📊 Эффективность по типам ошибок</h5>
        <div style="max-height: 300px; overflow-y: auto; margin-top: 10px;">
            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="padding: 10px; background: #f8f9fa;">Тип ошибки</th>
                        <th style="padding: 10px; background: #f8f9fa; text-align: center;">Заданий</th>
                        <th style="padding: 10px; background: #f8f9fa; text-align: center;">Учащихся</th>
                        <th style="padding: 10px; background: #f8f9fa; text-align: center;">% выполнения</th>
                        <th style="padding: 10px; background: #f8f9fa; text-align: center;">Ср. балл/уч</th>
                        <th style="padding: 10px; background: #f8f9fa; text-align: center;">Статус</th>
                        <th style="padding: 10px; background: #f8f9fa;">Задания</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    errorEntries.forEach(([errorKey, data]) => {
        const percentage = parseFloat(data.percentage);
        let status = '';
        
        if (percentage >= 70) {
            status = '<span style="color: #27ae60;">✅ Хорошо</span>';
        } else if (percentage >= 50) {
            status = '<span style="color: #3498db;">⚠️ Средне</span>';
        } else if (percentage >= 30) {
            status = '<span style="color: #f39c12;">🔻 Проблемно</span>';
        } else {
            status = '<span style="color: #e74c3c;">🚨 Критично</span>';
        }
        
        // Формируем список заданий
        const taskNumbers = data.tasks.map(t => t.number).slice(0, 3);
        const tasksText = taskNumbers.length > 0 ? 
            `Задания: ${taskNumbers.join(', ')}${data.tasks.length > 3 ? '...' : ''}` : 
            'Нет заданий';
        
        html += `
            <tr>
                <td style="padding: 8px;">
                    <span style="display: inline-block; width: 12px; height: 12px; background: ${data.color}; border-radius: 2px; margin-right: 8px;"></span>
                    ${data.name}
                </td>
                <td style="padding: 8px; text-align: center; font-weight: bold;">${data.count}</td>
                <td style="padding: 8px; text-align: center;">${data.studentCount}</td>
                <td style="padding: 8px; text-align: center; font-weight: bold; color: ${percentage >= 50 ? '#27ae60' : '#e74c3c'}">
                    ${data.percentage}%
                </td>
                <td style="padding: 8px; text-align: center;">${data.avgPerStudent}</td>
                <td style="padding: 8px; text-align: center;">${status}</td>
                <td style="padding: 8px; font-size: 11px;">${tasksText}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        
        <!-- Рекомендации -->
        <div style="margin-top: 20px; padding: 15px; background: ${errorEntries.length > 0 ? '#fff8e1' : '#e8f4fc'}; border-radius: 8px;">
            <h5 style="margin-top: 0;">💡 Методические рекомендации</h5>
            <ul style="margin: 10px 0 0 20px; font-size: 13px;">
    `;
    
    if (errorEntries.length === 0) {
        html += `
                <li>Типы ошибок не указаны в заданиях</li>
                <li>Рекомендуется заполнить поле "Тип ошибки" для каждого задания</li>
                <li>Это позволит проводить более точный анализ затруднений учащихся</li>
        `;
    } else {
        const worstError = errorEntries.sort((a, b) => a[1].percentage - b[1].percentage)[0];
        const bestError = errorEntries.sort((a, b) => b[1].percentage - a[1].percentage)[0];
        
        html += `
                <li>Наиболее проблемный тип: <strong>${worstError[1].name}</strong> (${worstError[1].percentage}%)</li>
                <li>Лучше всего усвоен: <strong>${bestError[1].name}</strong> (${bestError[1].percentage}%)</li>
                <li>Рекомендуется разработать дополнительные задания для отработки проблемных типов ошибок</li>
                <li>Используйте задания с высоким процентом выполнения как примеры успешного обучения</li>
        `;
    }
    
    html += `
            </ul>
        </div>
    `;
    
    return html;
}

function renderCorrelationsAnalysis() {
    const analysis = window.currentAnalysis || {};
    const correlations = analysis.correlations || [];
    
    let html = `
        <h4 style="margin-top: 0;">🔗 Корреляционный анализ</h4>
        <p style="color: #666; margin-bottom: 15px;">
            Анализ взаимосвязей между заданиями. 
            Положительная корреляция означает, что задания выполняются сходным образом.
            Отрицательная корреляция указывает на обратную зависимость.
        </p>
        
        <div style="display: grid; grid-template-columns: 1fr 300px; gap: 20px;">
            <!-- Основная таблица -->
            <div>
                <div style="font-size: 11px; color: #666; margin-bottom: 10px;">
                    Показаны только значимые корреляции (|r| > 0.5)
                </div>
                
                <div style="max-height: 400px; overflow-y: auto;">
                    <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="padding: 10px; background: #f8f9fa; text-align: center;">Задание 1</th>
                                <th style="padding: 10px; background: #f8f9fa; text-align: center;">Задание 2</th>
                                <th style="padding: 10px; background: #f8f9fa; text-align: center;">Коэффициент (r)</th>
                                <th style="padding: 10px; background: #f8f9fa; text-align: center;">Сила связи</th>
                                <th style="padding: 10px; background: #f8f9fa; text-align: center;">Тип</th>
                                <th style="padding: 10px; background: #f8f9fa; text-align: center;">Интерпретация</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    if (correlations.length === 0) {
        html += `
            <tr>
                <td colspan="6" style="padding: 30px; text-align: center; color: #999;">
                    <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
                    <div>Нет значимых корреляций между заданиями</div>
                    <div style="font-size: 11px; margin-top: 5px;">
                        (корреляции обнаружатся при |r| > 0.5)
                    </div>
                </td>
            </tr>
        `;
    } else {
        correlations.forEach((corr, index) => {
            // Получаем описания заданий
            const task1 = appData.tasks[corr.task1 - 1];
            const task2 = appData.tasks[corr.task2 - 1];
            
            const task1Desc = task1?.description ? 
                task1.description.substring(0, 30) + (task1.description.length > 30 ? '...' : '') : 
                `Задание ${corr.task1}`;
                
            const task2Desc = task2?.description ? 
                task2.description.substring(0, 30) + (task2.description.length > 30 ? '...' : '') : 
                `Задание ${corr.task2}`;
            
            // Определяем цвет и иконку
            let color, icon, interpretation;
            const r = parseFloat(corr.correlation);
            
            if (r > 0.7) {
                color = '#27ae60';
                icon = '↗️';
                interpretation = 'Сильная прямая связь';
            } else if (r > 0.5) {
                color = '#3498db';
                icon = '↗️';
                interpretation = 'Умеренная прямая связь';
            } else if (r < -0.7) {
                color = '#e74c3c';
                icon = '↘️';
                interpretation = 'Сильная обратная связь';
            } else if (r < -0.5) {
                color = '#f39c12';
                icon = '↘️';
                interpretation = 'Умеренная обратная связь';
            }
            
            html += `
                <tr style="${index % 2 === 0 ? 'background: #f8f9fa;' : ''}">
                    <td style="padding: 8px; text-align: center;">
                        <div style="font-weight: bold;">${corr.task1}</div>
                        <div style="font-size: 10px; color: #666;">${task1Desc}</div>
                    </td>
                    <td style="padding: 8px; text-align: center;">
                        <div style="font-weight: bold;">${corr.task2}</div>
                        <div style="font-size: 10px; color: #666;">${task2Desc}</div>
                    </td>
                    <td style="padding: 8px; text-align: center;">
                        <div style="font-weight: bold; color: ${color}; font-size: 14px;">
                            ${icon} ${corr.correlation}
                        </div>
                    </td>
                    <td style="padding: 8px; text-align: center;">
                        <span style="display: inline-block; padding: 3px 8px; background: ${color}; color: white; border-radius: 10px; font-size: 11px;">
                            ${corr.strength === 'strong' ? 'Сильная' : 
                              corr.strength === 'moderate' ? 'Умеренная' : 'Слабая'}
                        </span>
                    </td>
                    <td style="padding: 8px; text-align: center;">
                        <span style="color: ${corr.type === 'positive' ? '#27ae60' : '#e74c3c'}">
                            ${corr.type === 'positive' ? 'Прямая' : 'Обратная'}
                        </span>
                    </td>
                    <td style="padding: 8px; font-size: 11px;">
                        ${interpretation}
                    </td>
                </tr>
            `;
        });
    }
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Боковая панель с объяснениями -->
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; height: fit-content;">
                <h5 style="margin-top: 0;">📖 Объяснение корреляций</h5>
                
                <div style="margin-bottom: 15px;">
                    <strong>Коэффициент корреляции Пирсона (r):</strong>
                    <ul style="font-size: 11px; margin: 5px 0 0 15px; color: #666;">
                        <li>+1.0: идеальная прямая связь</li>
                        <li>+0.7 до +1.0: сильная прямая связь</li>
                        <li>+0.5 до +0.7: умеренная прямая связь</li>
                        <li>+0.3 до +0.5: слабая прямая связь</li>
                        <li>0.0 до ±0.3: отсутствие связи</li>
                        <li>-0.3 до -0.5: слабая обратная связь</li>
                        <li>-0.5 до -0.7: умеренная обратная связь</li>
                        <li>-0.7 до -1.0: сильная обратная связь</li>
                        <li>-1.0: идеальная обратная связь</li>
                    </ul>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong>📈 Прямая корреляция (r > 0):</strong>
                    <p style="font-size: 11px; margin: 5px 0; color: #666;">
                        Учащиеся, хорошо выполнившие одно задание, 
                        также хорошо выполняют другое. Может указывать на схожие 
                        проверяемые умения или общую тему.
                    </p>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong>📉 Обратная корреляция (r < 0):</strong>
                    <p style="font-size: 11px; margin: 5px 0; color: #666;">
                        Учащиеся, хорошо выполнившие одно задание, 
                        плохо выполняют другое. Может указывать на разные 
                        типы мышления или компенсаторные стратегии.
                    </p>
                </div>
                
                <div>
                    <strong>🎯 Практическое применение:</strong>
                    <p style="font-size: 11px; margin: 5px 0; color: #666;">
                        • Выявление заданий-дубликатов<br>
                        • Определение общих проблемных зон<br>
                        • Планирование дифференцированного подхода<br>
                        • Оптимизация структуры работы
                    </p>
                </div>
            </div>
        </div>
        
        <!-- Матрица корреляций (если нужно) -->
        ${correlations.length > 0 ? `
            <div style="margin-top: 20px;">
                <h5>📊 Матрица корреляций (фрагмент)</h5>
                <div style="overflow-x: auto;">
                    <div style="display: inline-block; padding: 10px; background: white; border-radius: 5px;">
                        ${renderCorrelationMatrix(6)} <!-- Показываем 6x6 матрицу -->
                    </div>
                </div>
            </div>
        ` : ''}
        
        <!-- Кнопки действий -->
        <div style="margin-top: 20px; display: flex; gap: 10px;">
            <button class="btn btn-sm btn-outline" onclick="showDetailedCorrelationAnalysis()">
                🔍 Детальный анализ
            </button>
            <button class="btn btn-sm btn-outline" onclick="exportCorrelationMatrix()">
                📥 Экспорт матрицы
            </button>
        </div>
    `;
    
    return html;
}

function renderCorrelationMatrix(size = 6) {
    const tasksCount = Math.min(size, appData.tasks.length);
    let html = '<table style="border-collapse: collapse; font-size: 10px;">';
    
    // Заголовок
    html += '<tr><th style="padding: 5px; background: #f8f9fa; min-width: 30px;"></th>';
    for (let i = 0; i < tasksCount; i++) {
        html += `<th style="padding: 5px; background: #f8f9fa; text-align: center; min-width: 30px;">${i + 1}</th>`;
    }
    html += '</tr>';
    
    // Данные
    for (let i = 0; i < tasksCount; i++) {
        html += `<tr><td style="padding: 5px; background: #f8f9fa; font-weight: bold; text-align: center;">${i + 1}</td>`;
        
        for (let j = 0; j < tasksCount; j++) {
            if (i === j) {
                html += '<td style="padding: 5px; text-align: center; background: #f8f9fa;">1.0</td>';
            } else {
                // Находим корреляцию между заданиями i+1 и j+1
                const correlation = findCorrelationValue(i + 1, j + 1);
                const color = getCorrelationColor(correlation);
                
                html += `
                    <td style="padding: 5px; text-align: center; background: ${color}; color: ${Math.abs(correlation) > 0.5 ? 'white' : '#333'};">
                        ${correlation.toFixed(2)}
                    </td>
                `;
            }
        }
        html += '</tr>';
    }
    
    html += '</table>';
    return html;
}

function findCorrelationValue(task1, task2) {
    const analysis = window.currentAnalysis || {};
    const correlations = analysis.correlations || [];
    
    const found = correlations.find(corr => 
        (corr.task1 === task1 && corr.task2 === task2) ||
        (corr.task1 === task2 && corr.task2 === task1)
    );
    
    return found ? parseFloat(found.correlation) : 0;
}

function getCorrelationColor(correlation) {
    const absCorr = Math.abs(correlation);
    
    if (absCorr > 0.7) return correlation > 0 ? '#27ae60' : '#e74c3c';
    if (absCorr > 0.5) return correlation > 0 ? '#7bed9f' : '#ff6b81';
    if (absCorr > 0.3) return correlation > 0 ? '#d1f2eb' : '#ffcccc';
    return '#f8f9fa';
}

function exportAnalysisReport(analysis) {
    console.log('📤 Экспорт отчета анализа...');
    
    const report = {
        metadata: {
            generated: new Date().toISOString(),
            system: 'Анализ образовательных результатов',
            version: '1.0',
            subject: appData.test.subject,
            class: appData.test.class,
            theme: appData.test.theme,
            workType: appData.test.workType,
            date: appData.test.testDate
        },
        summary: analysis.summary,
        tasksAnalysis: analysis.byTask,
        studentsAnalysis: analysis.byStudent,
        levelsAnalysis: analysis.byLevel,
        errorsAnalysis: analysis.byErrorType,
        correlations: analysis.correlations,
        insights: analysis.insights,
        recommendations: generateDetailedRecommendations(analysis)
    };
    
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const fileName = `Анализ_${appData.test.subject || 'результатов'}_${appData.test.class || 'класс'}_${new Date().toLocaleDateString('ru-RU')}.json`;
    
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`✅ Отчет экспортирован (${(dataStr.length / 1024).toFixed(1)} КБ)`, 'success');
}

function generateDetailedRecommendations(analysis) {
    const recommendations = [];
    
    // Рекомендации на основе статистики
    if (analysis.summary.completionRate < 70) {
        recommendations.push({
            type: 'completion',
            priority: 'high',
            title: 'Низкий процент выполнения работы',
            description: `Только ${analysis.summary.completionRate}% учащихся выполнили все задания`,
            actions: [
                'Проверить адекватность времени выполнения',
                'Рассмотреть возможность продления сроков',
                'Организовать дополнительные консультации'
            ]
        });
    }
    
    // Рекомендации по заданиям
    const criticalTasks = analysis.byTask.filter(task => task.zone === 'critical');
    if (criticalTasks.length > 0) {
        recommendations.push({
            type: 'tasks',
            priority: 'high',
            title: 'Критические задания',
            description: `${criticalTasks.length} заданий выполнены менее чем на 20%`,
            actions: [
                `Пересмотреть задания: ${criticalTasks.map(t => t.number).join(', ')}`,
                'Повторно объяснить соответствующие темы',
                'Разработать дополнительные тренировочные материалы'
            ]
        });
    }
    
    // Рекомендации по уровням сложности
    Object.entries(analysis.byLevel).forEach(([level, data]) => {
        if (data.deviation < -10) {
            recommendations.push({
                type: 'levels',
                priority: 'medium',
                title: `Слабые результаты по ${data.levelName}`,
                description: `Выполнение на ${data.percentage}% при ожидаемых ${data.expectedPercentage}%`,
                actions: [
                    `Уделить больше внимания заданиям уровня ${level}`,
                    'Разработать дифференцированные задания',
                    'Организовать групповую работу по данной теме'
                ]
            });
        }
    });
    
    // Рекомендации по типам ошибок
    const weakErrorTypes = Object.entries(analysis.byErrorType)
        .filter(([_, data]) => data.percentage < 50);
    
    if (weakErrorTypes.length > 0) {
        const worst = weakErrorTypes.sort((a, b) => a[1].percentage - b[1].percentage)[0];
        recommendations.push({
            type: 'errors',
            priority: 'medium',
            title: 'Проблемный тип ошибок',
            description: `Низкий процент выполнения по типу "${worst[1].name}"`,
            actions: [
                `Провести дополнительные занятия по теме "${worst[1].name}"`,
                'Использовать специальные методики коррекции',
                'Разработать индивидуальные задания'
            ]
        });
    }
    
    // Положительные результаты
    const excellentTasks = analysis.byTask.filter(task => task.zone === 'excellent');
    if (excellentTasks.length > appData.tasks.length * 0.3) {
        recommendations.push({
            type: 'positive',
            priority: 'low',
            title: 'Хорошие результаты',
            description: 'Группа хорошо усвоила основные темы',
            actions: [
                'Можно переходить к более сложным темам',
                'Организовать проектную деятельность',
                'Привлечь успешных учащихся к помощи отстающим'
            ]
        });
    }
    
    return recommendations;
}

function printAnalysisReport(analysis) {
    console.log('🖨️ Печать отчета анализа...');
    
    const printWindow = window.open('', '_blank');
    const date = new Date().toLocaleDateString('ru-RU');
    
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Аналитический отчет</title>
            <meta charset="UTF-8">
            <style>
                @page {
                    size: A4;
                    margin: 20mm;
                }
                
                body {
                    font-family: 'Arial', sans-serif;
                    margin: 0;
                    padding: 0;
                    color: #333;
                    font-size: 11pt;
                    line-height: 1.5;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #3498db;
                }
                
                .header h1 {
                    color: #2c3e50;
                    margin: 0 0 10px 0;
                    font-size: 18pt;
                }
                
                .metadata {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 10px;
                    margin-bottom: 25px;
                    font-size: 10pt;
                }
                
                .section {
                    margin-bottom: 25px;
                    page-break-inside: avoid;
                }
                
                .section-title {
                    background: #f8f9fa;
                    padding: 8px 12px;
                    border-left: 4px solid #3498db;
                    margin: 0 0 15px 0;
                    font-size: 14pt;
                }
                
                .summary-cards {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 15px;
                    margin-bottom: 20px;
                }
                
                .card {
                    text-align: center;
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid #e9ecef;
                }
                
                .card-value {
                    font-size: 20pt;
                    font-weight: bold;
                    margin: 10px 0;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                    font-size: 9pt;
                }
                
                th {
                    background: #f8f9fa;
                    padding: 8px;
                    text-align: left;
                    border: 1px solid #dee2e6;
                    font-weight: 600;
                }
                
                td {
                    padding: 8px;
                    border: 1px solid #dee2e6;
                }
                
                .insight {
                    margin: 10px 0;
                    padding: 10px;
                    border-left: 4px solid;
                    background: #f8f9fa;
                }
                
                .insight-warning { border-color: #f39c12; }
                .insight-danger { border-color: #e74c3c; }
                .insight-success { border-color: #27ae60; }
                .insight-info { border-color: #3498db; }
                
                .recommendation {
                    margin: 15px 0;
                    padding: 12px;
                    background: #e8f4fc;
                    border-radius: 5px;
                }
                
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #dee2e6;
                    font-size: 9pt;
                    color: #666;
                    text-align: center;
                }
                
                @media print {
                    .no-print { display: none; }
                    .page-break { page-break-before: always; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 Аналитический отчет по результатам работы</h1>
                <div style="color: #666;">Сгенерировано: ${date}</div>
            </div>
            
            <div class="metadata">
                <div><strong>Предмет:</strong> ${appData.test.subject || 'Не указан'}</div>
                <div><strong>Класс:</strong> ${appData.test.class || 'Не указан'}</div>
                <div><strong>Тема:</strong> ${appData.test.theme || 'Не указана'}</div>
                <div><strong>Тип работы:</strong> ${workTypes[appData.test.workType]?.name || appData.test.workType || 'Не указан'}</div>
                <div><strong>Дата проведения:</strong> ${appData.test.testDate || 'Не указана'}</div>
                <div><strong>Количество учащихся:</strong> ${analysis.summary.totalStudents}</div>
                <div><strong>Количество заданий:</strong> ${analysis.summary.totalTasks}</div>
                <div><strong>Макс. балл:</strong> ${analysis.summary.maxTotalScore}</div>
            </div>
            
            <div class="section">
                <h2 class="section-title">📈 Ключевые показатели</h2>
                
                <div class="summary-cards">
                    <div class="card">
                        <div>Средний %</div>
                        <div class="card-value" style="color: #3498db;">${analysis.summary.avgPercentage}%</div>
                        <div>выполнения</div>
                    </div>
                    
                    <div class="card">
                        <div>Средняя</div>
                        <div class="card-value" style="color: #2ecc71;">${analysis.summary.avgGrade}</div>
                        <div>оценка</div>
                    </div>
                    
                    <div class="card">
                        <div>Выполнили</div>
                        <div class="card-value" style="color: #f39c12;">${analysis.summary.completionRate}%</div>
                        <div>все задания</div>
                    </div>
                    
                    <div class="card">
                        <div>Разброс</div>
                        <div class="card-value" style="color: #e74c3c;">${analysis.summary.stdDev}</div>
                        <div>(σ)</div>
                    </div>
                </div>
                
                <div style="font-size: 10pt; color: #666;">
                    <strong>Дополнительная статистика:</strong>
                    Минимальный балл: ${analysis.summary.minScore} | 
                    Максимальный балл: ${analysis.summary.maxScore} | 
                    Размах: ${analysis.summary.scoreRange} | 
                    Медиана: ${analysis.summary.medianScore}
                </div>
            </div>
    `;
    
    // Ключевые выводы
    if (analysis.insights && analysis.insights.length > 0) {
        html += `
            <div class="section">
                <h2 class="section-title">💡 Ключевые выводы</h2>
        `;
        
        analysis.insights.forEach(insight => {
            const insightClass = insight.type === 'danger' ? 'insight-danger' :
                               insight.type === 'warning' ? 'insight-warning' :
                               insight.type === 'info' ? 'insight-info' : 'insight-success';
            
            html += `
                <div class="insight ${insightClass}">
                    <div style="font-weight: bold; margin-bottom: 5px;">${insight.title}</div>
                    <div style="margin-bottom: 5px;">${insight.message}</div>
                    <div style="font-size: 9pt; color: #666;">Рекомендация: ${insight.suggestion}</div>
                </div>
            `;
        });
        
        html += `</div>`;
    }
    
    // Анализ по заданиям (топ-10)
    if (analysis.byTask && analysis.byTask.length > 0) {
        html += `
            <div class="section page-break">
                <h2 class="section-title">📝 Анализ выполнения заданий (ТОП-10)</h2>
                
                <table>
                    <thead>
                        <tr>
                            <th>№</th>
                            <th>Описание</th>
                            <th>Уровень</th>
                            <th>% выполнения</th>
                            <th>Сложность</th>
                            <th>Зона</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        analysis.byTask
            .sort((a, b) => a.percentage - b.percentage)
            .slice(0, 10)
            .forEach(task => {
                const zoneColor = task.zone === 'excellent' ? '#27ae60' :
                                 task.zone === 'good' ? '#3498db' :
                                 task.zone === 'average' ? '#f39c12' :
                                 task.zone === 'weak' ? '#e67e22' : '#e74c3c';
                
                html += `
                    <tr>
                        <td>${task.number}</td>
                        <td>${task.description.substring(0, 40)}${task.description.length > 40 ? '...' : ''}</td>
                        <td>${task.level}</td>
                        <td style="font-weight: bold; color: ${zoneColor};">${task.percentage}%</td>
                        <td>${task.difficulty}</td>
                        <td style="color: ${zoneColor}; font-weight: bold;">
                            ${task.zone === 'excellent' ? 'Отлично' :
                              task.zone === 'good' ? 'Хорошо' :
                              task.zone === 'average' ? 'Средне' :
                              task.zone === 'weak' ? 'Слабо' : 'Критично'}
                        </td>
                    </tr>
                `;
            });
        
        html += `
                    </tbody>
                </table>
                
                <div style="font-size: 9pt; color: #666; margin-top: 10px;">
                    * Сложность: чем выше значение, тем сложнее задание (100 - % выполнения)
                </div>
            </div>
        `;
    }
    
    // Анализ по учащимся (топ-5)
    if (analysis.byStudent && analysis.byStudent.length > 0) {
        html += `
            <div class="section">
                <h2 class="section-title">👥 Рейтинг учащихся (ТОП-5)</h2>
                
                <table>
                    <thead>
                        <tr>
                            <th>Место</th>
                            <th>Учащийся</th>
                            <th>Баллы</th>
                            <th>%</th>
                            <th>Оценка</th>
                            <th>Рейтинг</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        analysis.byStudent
            .slice(0, 5)
            .forEach(student => {
                html += `
                    <tr>
                        <td>${student.rank}</td>
                        <td>${student.name}</td>
                        <td>${student.totalScore}/${student.maxPossible}</td>
                        <td>${student.percentage}%</td>
                        <td>${student.grade}</td>
                        <td>${student.percentile}%</td>
                    </tr>
                `;
            });
        
        html += `
                    </tbody>
                </table>
                
                <div style="font-size: 9pt; color: #666; margin-top: 10px;">
                    * Рейтинг: процент учащихся, которых данный ученик опережает
                </div>
            </div>
        `;
    }
    
    // Рекомендации
    const recommendations = generateDetailedRecommendations(analysis);
    if (recommendations.length > 0) {
        html += `
            <div class="section page-break">
                <h2 class="section-title">🎯 Рекомендации для учителя</h2>
        `;
        
        // Группируем по приоритету
        const highPriority = recommendations.filter(r => r.priority === 'high');
        const mediumPriority = recommendations.filter(r => r.priority === 'medium');
        const lowPriority = recommendations.filter(r => r.priority === 'low');
        
        const renderPriority = (priority, title) => {
            if (priority.length === 0) return '';
            
            return `
                <div style="margin-bottom: 20px;">
                    <h3 style="color: ${title === 'Высокий' ? '#e74c3c' : 
                                     title === 'Средний' ? '#f39c12' : '#27ae60'};
                           margin: 0 0 10px 0;">
                        ${title} приоритет
                    </h3>
                    ${priority.map(rec => `
                        <div class="recommendation">
                            <div style="font-weight: bold; margin-bottom: 8px;">${rec.title}</div>
                            <div style="margin-bottom: 8px;">${rec.description}</div>
                            <div style="font-size: 9pt;">
                                <strong>Действия:</strong>
                                <ul style="margin: 5px 0 0 20px;">
                                    ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        };
        
        html += renderPriority(highPriority, 'Высокий');
        html += renderPriority(mediumPriority, 'Средний');
        html += renderPriority(lowPriority, 'Низкий');
        
        html += `</div>`;
    }
    
    // Корреляции (если есть)
    if (analysis.correlations && analysis.correlations.length > 0) {
        html += `
            <div class="section">
                <h2 class="section-title">🔗 Значимые корреляции</h2>
                
                <div style="font-size: 9pt; color: #666; margin-bottom: 10px;">
                    Корреляции с коэффициентом |r| > 0.5
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Задание 1</th>
                            <th>Задание 2</th>
                            <th>Коэффициент (r)</th>
                            <th>Сила связи</th>
                            <th>Интерпретация</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        analysis.correlations
            .slice(0, 5)
            .forEach(corr => {
                const strength = corr.strength === 'strong' ? 'Сильная' :
                               corr.strength === 'moderate' ? 'Умеренная' : 'Слабая';
                
                const interpretation = corr.type === 'positive' ? 
                    'Прямая связь (задания выполняются сходно)' :
                    'Обратная связь (обратная зависимость)';
                
                html += `
                    <tr>
                        <td>${corr.task1}</td>
                        <td>${corr.task2}</td>
                        <td style="font-weight: bold; color: ${corr.type === 'positive' ? '#27ae60' : '#e74c3c'}">
                            ${corr.correlation}
                        </td>
                        <td>${strength}</td>
                        <td>${interpretation}</td>
                    </tr>
                `;
            });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // Подвал
    html += `
            <div class="footer">
                <div>Отчет сгенерирован системой "Анализ образовательных результатов"</div>
                <div>Дата генерации: ${new Date().toLocaleString('ru-RU')}</div>
                <div style="margin-top: 10px;">
                    <button class="no-print" onclick="window.print()" 
                            style="padding: 8px 16px; background: #3498db; color: white; 
                                   border: none; border-radius: 4px; cursor: pointer;">
                        🖨️ Печать отчета
                    </button>
                </div>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Автоматически открываем печать через 500мс
    setTimeout(() => {
        printWindow.print();
    }, 500);
    
    showNotification('🖨️ Отчет подготовлен для печати', 'info');
}
// ==================== DETAILED CORRELATION ANALYSIS ====================

function showDetailedCorrelationAnalysis() {
    console.log('🔍 Детальный корреляционный анализ...');
    
    const analysis = window.currentAnalysis || {};
    const correlations = analysis.correlations || [];
    
    if (correlations.length === 0) {
        showNotification('Нет значимых корреляций для анализа', 'info');
        return;
    }
    
    // Собираем полную матрицу корреляций
    const correlationMatrix = calculateFullCorrelationMatrix();
    
    let html = `
        <div style="max-width: 1200px; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0;">🔍 Детальный корреляционный анализ</h3>
                <button class="btn btn-sm btn-outline" onclick="hideModal()">
                    ✕ Закрыть
                </button>
            </div>
            
            <!-- Общая информация -->
            <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <h4 style="margin-top: 0;">📊 Общая статистика корреляций</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #3498db;">
                            ${correlations.length}
                        </div>
                        <div style="font-size: 12px; color: #666;">Значимых корреляций</div>
                    </div>
                    
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #27ae60;">
                            ${correlations.filter(c => c.type === 'positive').length}
                        </div>
                        <div style="font-size: 12px; color: #666;">Прямых связей</div>
                    </div>
                    
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">
                            ${correlations.filter(c => c.type === 'negative').length}
                        </div>
                        <div style="font-size: 12px; color: #666;">Обратных связей</div>
                    </div>
                    
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #f39c12;">
                            ${correlations.filter(c => c.strength === 'strong').length}
                        </div>
                        <div style="font-size: 12px; color: #666;">Сильных связей</div>
                    </div>
                </div>
            </div>
            
            <!-- Визуализация матрицы -->
            <div style="margin-bottom: 30px;">
                <h4>📈 Полная матрица корреляций</h4>
                <div style="overflow-x: auto; margin-top: 10px; background: white; padding: 10px; border-radius: 8px; border: 1px solid #eee;">
                    ${renderFullCorrelationMatrix(correlationMatrix)}
                </div>
            </div>
            
            <!-- Кластерный анализ -->
            <div style="margin-bottom: 30px;">
                <h4>🎯 Кластеры заданий</h4>
                <div id="correlationClusters" style="margin-top: 10px;">
                    ${renderCorrelationClusters(correlationMatrix)}
                </div>
            </div>
            
            <!-- Статистика по заданиям -->
            <div style="margin-bottom: 30px;">
                <h4>📊 Статистика корреляционной активности</h4>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="padding: 10px; background: #f8f9fa; text-align: center;">Задание</th>
                                <th style="padding: 10px; background: #f8f9fa; text-align: center;">Всего связей</th>
                                <th style="padding: 10px; background: #f8f9fa; text-align: center;">Сильных связей</th>
                                <th style="padding: 10px; background: #f8f9fa; text-align: center;">Ср. корреляция</th>
                                <th style="padding: 10px; background: #f8f9fa; text-align: center;">Макс. корреляция</th>
                                <th style="padding: 10px; background: #f8f9fa; text-align: center;">С парой</th>
                                <th style="padding: 10px; background: #f8f9fa; text-align: center;">Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderTaskCorrelationStats(correlationMatrix)}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Детализация по сильным корреляциям -->
            <div style="margin-bottom: 30px;">
                <h4>⭐ Самые сильные корреляции (|r| > 0.7)</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; margin-top: 10px;">
                    ${renderStrongCorrelations(correlations)}
                </div>
            </div>
            
            <!-- Выводы и рекомендации -->
            <div style="background: #e8f4fc; padding: 20px; border-radius: 10px; margin-top: 20px;">
                <h4 style="margin-top: 0;">💡 Выводы и рекомендации</h4>
                ${renderCorrelationInsights(correlationMatrix, correlations)}
            </div>
            
            <!-- Кнопки действий -->
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                <button class="btn btn-outline" onclick="exportCorrelationMatrix()">
                    📥 Экспорт матрицы
                </button>
                <button class="btn btn-outline" onclick="generateCorrelationReport()">
                    📄 Полный отчет
                </button>
            </div>
        </div>
    `;
    
    showModal('Детальный корреляционный анализ', html);
}

function calculateFullCorrelationMatrix() {
    const tasksCount = appData.tasks.length;
    const matrix = Array(tasksCount).fill().map(() => Array(tasksCount).fill(0));
    
    // Собираем баллы по заданиям
    const taskScores = [];
    for (let i = 0; i < tasksCount; i++) {
        const scores = [];
        const taskId = appData.tasks[i].id || i;
        
        appData.students.forEach(student => {
            const studentId = student.id;
            const results = appData.results[studentId] || {};
            scores.push(parseFloat(results[taskId]) || 0);
        });
        
        taskScores.push(scores);
    }
    
    // Рассчитываем корреляции
    for (let i = 0; i < tasksCount; i++) {
        matrix[i][i] = 1.0; // Диагональ
        
        for (let j = i + 1; j < tasksCount; j++) {
            const correlation = calculateCorrelation(taskScores[i], taskScores[j]);
            matrix[i][j] = correlation;
            matrix[j][i] = correlation;
        }
    }
    
    return matrix;
}

function renderFullCorrelationMatrix(matrix) {
    const tasksCount = matrix.length;
    const showAll = tasksCount <= 15; // Показывать все, если заданий <= 15
    
    const displayCount = showAll ? tasksCount : 10;
    
    let html = `
        <div style="font-size: 11px; color: #666; margin-bottom: 10px;">
            ${showAll ? `Матрица ${tasksCount}×${tasksCount}` : `Показаны первые ${displayCount} заданий`}
            ${!showAll ? '<span style="color: #f39c12; margin-left: 10px;">(для полной матрицы экспортируйте данные)</span>' : ''}
        </div>
        
        <table style="border-collapse: collapse; font-size: 10px;">
            <tr>
                <th style="padding: 5px; background: #f8f9fa; min-width: 30px; position: sticky; left: 0; z-index: 2;"></th>
    `;
    
    // Заголовки столбцов
    for (let i = 0; i < displayCount; i++) {
        html += `
            <th style="padding: 5px; background: #f8f9fa; text-align: center; min-width: 30px; 
                       position: sticky; top: 0; z-index: 1;">
                ${i + 1}
            </th>
        `;
    }
    html += '</tr>';
    
    // Данные
    for (let i = 0; i < displayCount; i++) {
        html += `<tr>
            <td style="padding: 5px; background: #f8f9fa; font-weight: bold; text-align: center;
                       position: sticky; left: 0; z-index: 1;">
                ${i + 1}
            </td>`;
        
        for (let j = 0; j < displayCount; j++) {
            const correlation = matrix[i][j];
            const color = getCorrelationColor(correlation);
            const textColor = Math.abs(correlation) > 0.5 ? 'white' : '#333';
            const fontWeight = Math.abs(correlation) > 0.7 ? 'bold' : 'normal';
            
            html += `
                <td style="padding: 5px; text-align: center; background: ${color}; 
                           color: ${textColor}; font-weight: ${fontWeight};
                           cursor: help;" 
                    title="Корреляция заданий ${i + 1} и ${j + 1}: ${correlation.toFixed(3)}">
                    ${correlation.toFixed(2)}
                </td>
            `;
        }
        html += '</tr>';
    }
    
    html += '</table>';
    
    if (!showAll) {
        html += `
            <div style="margin-top: 15px; padding: 10px; background: #fff8e1; border-radius: 5px; font-size: 11px;">
                <strong>⚠️ Матрица сокращена для отображения.</strong>
                Полная матрица содержит ${tasksCount}×${tasksCount} = ${tasksCount * tasksCount} значений корреляций.
                Для анализа всей матрицы используйте экспорт.
            </div>
        `;
    }
    
    return html;
}

function renderCorrelationClusters(matrix) {
    const tasksCount = matrix.length;
    const clusters = [];
    const visited = new Set();
    
    // Порог для включения в кластер
    const threshold = 0.6;
    
    // Находим кластеры сильных корреляций
    for (let i = 0; i < tasksCount; i++) {
        if (visited.has(i)) continue;
        
        const cluster = [i];
        visited.add(i);
        
        for (let j = i + 1; j < tasksCount; j++) {
            if (visited.has(j)) continue;
            
            // Проверяем сильные связи со всеми заданиями в кластере
            let strongConnection = true;
            for (const task of cluster) {
                if (Math.abs(matrix[task][j]) < threshold) {
                    strongConnection = false;
                    break;
                }
            }
            
            if (strongConnection) {
                cluster.push(j);
                visited.add(j);
            }
        }
        
        if (cluster.length > 1) {
            clusters.push(cluster);
        }
    }
    
    if (clusters.length === 0) {
        return `
            <div style="padding: 20px; text-align: center; color: #666; background: #f8f9fa; border-radius: 8px;">
                <div style="font-size: 48px; margin-bottom: 10px;">🔍</div>
                <div>Кластеры сильных корреляций не обнаружены</div>
                <div style="font-size: 11px; margin-top: 5px;">
                    (для образования кластера требуется минимум 2 задания с взаимной корреляцией > 0.6)
                </div>
            </div>
        `;
    }
    
    let html = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
    `;
    
    clusters.forEach((cluster, index) => {
        // Вычисляем среднюю корреляцию в кластере
        let totalCorrelation = 0;
        let correlationCount = 0;
        
        for (let i = 0; i < cluster.length; i++) {
            for (let j = i + 1; j < cluster.length; j++) {
                totalCorrelation += Math.abs(matrix[cluster[i]][cluster[j]]);
                correlationCount++;
            }
        }
        
        const avgCorrelation = correlationCount > 0 ? totalCorrelation / correlationCount : 0;
        const strength = avgCorrelation > 0.8 ? 'сильный' : avgCorrelation > 0.6 ? 'средний' : 'слабый';
        const strengthColor = avgCorrelation > 0.8 ? '#27ae60' : avgCorrelation > 0.6 ? '#f39c12' : '#3498db';
        
        // Находим наиболее тематически связанные задания
        const clusterTasks = cluster.map(taskIndex => {
            const task = appData.tasks[taskIndex];
            return {
                number: taskIndex + 1,
                description: task.description || `Задание ${taskIndex + 1}`,
                level: task.level || 1
            };
        });
        
        // Группируем по уровням
        const levelGroups = {};
        clusterTasks.forEach(task => {
            if (!levelGroups[task.level]) {
                levelGroups[task.level] = [];
            }
            levelGroups[task.level].push(task.number);
        });
        
        html += `
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #eee; border-top: 4px solid ${strengthColor};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="font-weight: bold; font-size: 14px;">
                        Кластер ${index + 1}
                    </div>
                    <div style="font-size: 11px; color: ${strengthColor}; font-weight: bold;">
                        ${(avgCorrelation * 100).toFixed(0)}% связанность
                    </div>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
                        Задания в кластере (${clusterTasks.length}):
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                        ${clusterTasks.map(task => `
                            <span style="padding: 3px 8px; background: ${complexityLevels[task.level]?.color || '#95a5a6'}; 
                                  color: white; border-radius: 10px; font-size: 11px;"
                                  title="${task.description}">
                                ${task.number}
                            </span>
                        `).join('')}
                    </div>
                </div>
                
                <div style="font-size: 11px; color: #666;">
                    <strong>Средняя корреляция:</strong> ${avgCorrelation.toFixed(3)} (${strength})<br>
                    <strong>Заданий:</strong> ${clusterTasks.length}<br>
                    <strong>Уровни:</strong> ${Object.entries(levelGroups).map(([level, tasks]) => 
                        `${level} (${tasks.join(',')})`).join(', ')}
                </div>
                
                <div style="margin-top: 10px; font-size: 10px; color: #999;">
                    ${clusterTasks.length >= 3 ? 
                        '✅ Кластер устойчив' : 
                        '⚠️ Мало заданий для устойчивого кластера'}
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    return html;
}

function renderTaskCorrelationStats(matrix) {
    const tasksCount = matrix.length;
    let html = '';
    
    // Считаем статистику для каждого задания
    const taskStats = [];
    
    for (let i = 0; i < tasksCount; i++) {
        let strongConnections = 0;
        let totalConnections = 0;
        let correlationSum = 0;
        let maxCorrelation = 0;
        let maxCorrelationWith = 0;
        
        for (let j = 0; j < tasksCount; j++) {
            if (i === j) continue;
            
            const correlation = Math.abs(matrix[i][j]);
            correlationSum += correlation;
            totalConnections++;
            
            if (correlation > 0.7) {
                strongConnections++;
            }
            
            if (correlation > maxCorrelation) {
                maxCorrelation = correlation;
                maxCorrelationWith = j + 1;
            }
        }
        
        const avgCorrelation = totalConnections > 0 ? correlationSum / totalConnections : 0;
        
        taskStats.push({
            taskNumber: i + 1,
            strongConnections,
            totalConnections,
            avgCorrelation,
            maxCorrelation,
            maxCorrelationWith
        });
    }
    
    // Сортируем по активности (количеству сильных связей)
    taskStats.sort((a, b) => b.strongConnections - a.strongConnections);
    
    // Рендерим топ-15 заданий
    taskStats.slice(0, 15).forEach(stat => {
        const activityLevel = stat.strongConnections >= 5 ? 'high' :
                             stat.strongConnections >= 3 ? 'medium' : 'low';
        
        const activityColor = activityLevel === 'high' ? '#e74c3c' :
                             activityLevel === 'medium' ? '#f39c12' : '#3498db';
        
        const activityText = activityLevel === 'high' ? 'Высокая' :
                            activityLevel === 'medium' ? 'Средняя' : 'Низкая';
        
        html += `
            <tr>
                <td style="padding: 8px; text-align: center; font-weight: bold;">${stat.taskNumber}</td>
                <td style="padding: 8px; text-align: center;">${stat.totalConnections}</td>
                <td style="padding: 8px; text-align: center;">
                    <span style="color: ${activityColor}; font-weight: bold;">
                        ${stat.strongConnections}
                    </span>
                </td>
                <td style="padding: 8px; text-align: center;">${stat.avgCorrelation.toFixed(3)}</td>
                <td style="padding: 8px; text-align: center; font-weight: bold;">
                    ${stat.maxCorrelation.toFixed(3)}
                </td>
                <td style="padding: 8px; text-align: center;">
                    с ${stat.maxCorrelationWith}
                </td>
                <td style="padding: 8px; text-align: center;">
                    <span style="padding: 3px 8px; background: ${activityColor}; color: white; border-radius: 10px; font-size: 10px;">
                        ${activityText}
                    </span>
                </td>
            </tr>
        `;
    });
    
    return html;
}

function renderStrongCorrelations(correlations) {
    const strongCorrelations = correlations.filter(c => Math.abs(parseFloat(c.correlation)) > 0.7);
    
    if (strongCorrelations.length === 0) {
        return `
            <div style="padding: 20px; text-align: center; color: #666; background: #f8f9fa; border-radius: 8px; grid-column: 1 / -1;">
                <div style="font-size: 36px; margin-bottom: 10px;">📊</div>
                <div>Сильных корреляций (|r| > 0.7) не обнаружено</div>
                <div style="font-size: 11px; margin-top: 5px;">
                    Самые сильные корреляции начинаются от |r| > 0.5
                </div>
            </div>
        `;
    }
    
    return strongCorrelations.map(corr => {
        const r = parseFloat(corr.correlation);
        const isPositive = r > 0;
        const color = isPositive ? '#27ae60' : '#e74c3c';
        const icon = isPositive ? '↗️' : '↘️';
        
        // Получаем описания заданий
        const task1 = appData.tasks[corr.task1 - 1];
        const task2 = appData.tasks[corr.task2 - 1];
        
        const task1Desc = task1?.description ? 
            task1.description.substring(0, 40) + (task1.description.length > 40 ? '...' : '') : 
            `Задание ${corr.task1}`;
            
        const task2Desc = task2?.description ? 
            task2.description.substring(0, 40) + (task2.description.length > 40 ? '...' : '') : 
            `Задание ${corr.task2}`;
        
        return `
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #eee; border-left: 4px solid ${color};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="font-weight: bold; font-size: 16px; color: ${color};">
                        ${icon} ${corr.correlation}
                    </div>
                    <div style="font-size: 11px; padding: 3px 8px; background: ${color}; color: white; border-radius: 10px;">
                        ${corr.strength === 'strong' ? 'Сильная' : 'Умеренная'}
                    </div>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <div style="font-size: 12px; margin-bottom: 3px;">
                        <strong>Задание ${corr.task1}:</strong>
                    </div>
                    <div style="font-size: 11px; color: #666; margin-bottom: 8px;">
                        ${task1Desc}
                    </div>
                    
                    <div style="font-size: 12px; margin-bottom: 3px;">
                        <strong>Задание ${corr.task2}:</strong>
                    </div>
                    <div style="font-size: 11px; color: #666; margin-bottom: 8px;">
                        ${task2Desc}
                    </div>
                </div>
                
                <div style="font-size: 11px; color: #666;">
                    <strong>Тип:</strong> ${isPositive ? 'Прямая корреляция' : 'Обратная корреляция'}<br>
                    <strong>Интерпретация:</strong> ${isPositive ? 
                        'Задания выполняются сходным образом' : 
                        'Обратная зависимость между выполнениями'}
                </div>
            </div>
        `;
    }).join('');
}

function renderCorrelationInsights(matrix, correlations) {
    const tasksCount = matrix.length;
    const strongCorrelations = correlations.filter(c => c.strength === 'strong');
    const positiveCorrelations = correlations.filter(c => c.type === 'positive');
    const negativeCorrelations = correlations.filter(c => c.type === 'negative');
    
    let html = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">';
    
    // Основные выводы
    html += `
        <div>
            <h5 style="margin-top: 0; color: #2c3e50;">📋 Основные выводы</h5>
            <ul style="font-size: 13px; margin: 10px 0 0 0; padding-left: 20px;">
                <li>Обнаружено <strong>${correlations.length}</strong> значимых корреляций</li>
                <li><strong>${strongCorrelations.length}</strong> из них являются сильными (|r| > 0.7)</li>
                <li><strong>${positiveCorrelations.length}</strong> прямых и <strong>${negativeCorrelations.length}</strong> обратных корреляций</li>
                <li>Средняя сила корреляций: <strong>${calculateAverageCorrelation(correlations).toFixed(3)}</strong></li>
            </ul>
        </div>
    `;
    
    // Рекомендации
    html += `
        <div>
            <h5 style="margin-top: 0; color: #2c3e50;">🎯 Рекомендации</h5>
            <ul style="font-size: 13px; margin: 10px 0 0 0; padding-left: 20px;">
    `;
    
    if (strongCorrelations.length > tasksCount * 0.2) {
        html += '<li>Много сильных корреляций - возможно, задания дублируют друг друга</li>';
    }
    
    if (negativeCorrelations.length > 0) {
        html += '<li>Обратные корреляции указывают на разные типы мышления</li>';
    }
    
    if (positiveCorrelations.length > negativeCorrelations.length * 2) {
        html += '<li>Преобладают прямые корреляции - работа хорошо структурирована</li>';
    }
    
    html += `
                <li>Используйте матрицу корреляций для оптимизации структуры теста</li>
                <li>Задания с низкой корреляцией с другими проверяют уникальные умения</li>
            </ul>
        </div>
    `;
    
    // Методические рекомендации
    html += `
        <div style="grid-column: 1 / -1; margin-top: 10px;">
            <h5 style="margin-top: 0; color: #2c3e50;">📚 Методические рекомендации</h5>
            <div style="font-size: 13px; margin: 10px 0;">
                <p><strong>Для сильных положительных корреляций (|r| > 0.8):</strong></p>
                <ul style="margin: 5px 0 15px 20px;">
                    <li>Задания проверяют схожие умения - можно оставить одно из них</li>
                    <li>Или разделить на подзадания с разными акцентами</li>
                </ul>
                
                <p><strong>Для сильных отрицательных корреляций (r < -0.7):</strong></p>
                <ul style="margin: 5px 0 15px 20px;">
                    <li>Учащиеся используют разные стратегии решения</li>
                    <li>Рассмотреть возможность дифференцированного подхода</li>
                </ul>
                
                <p><strong>Для заданий с низкой корреляцией со всеми другими:</strong></p>
                <ul style="margin: 5px 0 0 20px;">
                    <li>Проверяют уникальные, изолированные умения</li>
                    <li>Важны для комплексной оценки</li>
                </ul>
            </div>
        </div>
    `;
    
    html += '</div>';
    return html;
}

function calculateAverageCorrelation(correlations) {
    if (correlations.length === 0) return 0;
    
    const sum = correlations.reduce((total, corr) => {
        return total + Math.abs(parseFloat(corr.correlation));
    }, 0);
    
    return sum / correlations.length;
}

function exportCorrelationMatrix() {
    const matrix = calculateFullCorrelationMatrix();
    const tasksCount = matrix.length;
    
    // Создаем CSV
    let csv = 'Задание;' + Array.from({length: tasksCount}, (_, i) => i + 1).join(';') + '\n';
    
    for (let i = 0; i < tasksCount; i++) {
        const row = [i + 1, ...matrix[i].map(v => v.toFixed(3))];
        csv += row.join(';') + '\n';
    }
    
    // Добавляем статистику
    csv += '\n\nСтатистика корреляций:\n';
    csv += 'Задание;Сильных связей (|r|>0.7);Средняя корреляция;Максимальная корреляция;С парой\n';
    
    for (let i = 0; i < tasksCount; i++) {
        let strongConnections = 0;
        let correlationSum = 0;
        let maxCorrelation = 0;
        let maxCorrelationWith = 0;
        
        for (let j = 0; j < tasksCount; j++) {
            if (i === j) continue;
            
            const correlation = Math.abs(matrix[i][j]);
            correlationSum += correlation;
            
            if (correlation > 0.7) {
                strongConnections++;
            }
            
            if (correlation > maxCorrelation) {
                maxCorrelation = correlation;
                maxCorrelationWith = j + 1;
            }
        }
        
        const avgCorrelation = (tasksCount - 1) > 0 ? correlationSum / (tasksCount - 1) : 0;
        
        csv += `${i + 1};${strongConnections};${avgCorrelation.toFixed(3)};${maxCorrelation.toFixed(3)};${maxCorrelationWith}\n`;
    }
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const date = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');
    link.href = url;
    link.download = `correlation_matrix_${date}.csv`;
    link.click();
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    showNotification('✅ Матрица корреляций экспортирована в CSV', 'success');
}

function generateCorrelationReport() {
    const analysis = window.currentAnalysis || {};
    const correlations = analysis.correlations || [];
    const matrix = calculateFullCorrelationMatrix();
    
    const report = {
        metadata: {
            generated: new Date().toISOString(),
            subject: appData.test.subject,
            class: appData.test.class,
            totalTasks: appData.tasks.length,
            totalStudents: appData.students.length
        },
        summary: {
            totalCorrelations: correlations.length,
            strongCorrelations: correlations.filter(c => c.strength === 'strong').length,
            positiveCorrelations: correlations.filter(c => c.type === 'positive').length,
            negativeCorrelations: correlations.filter(c => c.type === 'negative').length,
            averageCorrelation: calculateAverageCorrelation(correlations)
        },
        topCorrelations: correlations.slice(0, 10).map(c => ({
            task1: c.task1,
            task2: c.task2,
            correlation: parseFloat(c.correlation),
            strength: c.strength,
            type: c.type
        })),
        taskStatistics: [],
        clusters: [],
        recommendations: []
    };
    
    // Статистика по заданиям
    const tasksCount = matrix.length;
    for (let i = 0; i < tasksCount; i++) {
        let strongConnections = 0;
        let correlationSum = 0;
        
        for (let j = 0; j < tasksCount; j++) {
            if (i === j) continue;
            const correlation = Math.abs(matrix[i][j]);
            correlationSum += correlation;
            if (correlation > 0.7) strongConnections++;
        }
        
        report.taskStatistics.push({
            taskNumber: i + 1,
            strongConnections,
            averageCorrelation: (tasksCount - 1) > 0 ? correlationSum / (tasksCount - 1) : 0
        });
    }
    
    // Кластеры
    const clusters = [];
    const visited = new Set();
    const threshold = 0.6;
    
    for (let i = 0; i < tasksCount; i++) {
        if (visited.has(i)) continue;
        
        const cluster = [i];
        visited.add(i);
        
        for (let j = i + 1; j < tasksCount; j++) {
            if (visited.has(j)) continue;
            
            let strongConnection = true;
            for (const task of cluster) {
                if (Math.abs(matrix[task][j]) < threshold) {
                    strongConnection = false;
                    break;
                }
            }
            
            if (strongConnection) {
                cluster.push(j);
                visited.add(j);
            }
        }
        
        if (cluster.length > 1) {
            clusters.push(cluster.map(task => task + 1));
        }
    }
    
    report.clusters = clusters;
    
    // Рекомендации
    if (correlations.length > tasksCount * 3) {
        report.recommendations.push({
            type: 'warning',
            message: 'Большое количество корреляций может указывать на дублирование заданий',
            suggestion: 'Проверьте, не проверяют ли разные задания одни и те же умения'
        });
    }
    
    if (correlations.filter(c => c.type === 'negative').length > 0) {
        report.recommendations.push({
            type: 'info',
            message: 'Обнаружены обратные корреляции',
            suggestion: 'Учтите разные стратегии решения при оценивании'
        });
    }
    
    // Экспорт отчета
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const fileName = `correlation_report_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}.json`;
    
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('✅ Отчет по корреляциям экспортирован', 'success');
}

// ==================== ДОПОЛНИТЕЛЬНЫЕ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function showTaskDetails(taskIndex) {
    const task = appData.tasks[taskIndex];
    const analysis = window.currentAnalysis || {};
    const taskAnalysis = analysis.byTask?.[taskIndex];
    
    if (!task) {
        showNotification('Задание не найдено', 'error');
        return;
    }
    
    let html = `
        <div style="max-width: 800px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0;">📝 Детальный анализ задания ${taskIndex + 1}</h3>
                <button class="btn btn-sm btn-outline" onclick="hideModal()">
                    ✕ Закрыть
                </button>
            </div>
            
            <!-- Основная информация -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h4 style="margin-top: 0;">📋 Информация о задании</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <strong>Описание:</strong><br>
                        <div style="margin-top: 5px; padding: 10px; background: white; border-radius: 5px;">
                            ${task.description || 'Без описания'}
                        </div>
                    </div>
                    
                    <div>
                        <div style="margin-bottom: 10px;">
                            <strong>Уровень сложности:</strong>
                            <span style="margin-left: 10px; padding: 5px 10px; background: ${complexityLevels[task.level]?.color || '#95a5a6'}; 
                                  color: white; border-radius: 15px;">
                                ${task.level}. ${complexityLevels[task.level]?.name || 'Не указан'}
                            </span>
                        </div>
                        
                        <div style="margin-bottom: 10px;">
                            <strong>Макс. балл:</strong> ${task.maxScore || 1}
                        </div>
                        
                        <div style="margin-bottom: 10px;">
                            <strong>Тип ошибки:</strong>
                            <span style="margin-left: 10px; padding: 5px 10px; background: ${errorTypes[task.errorType]?.color || '#95a5a6'}; 
                                  color: white; border-radius: 15px;">
                                ${errorTypes[task.errorType]?.name || 'Не указан'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
    `;
    
    // Статистика выполнения
    if (taskAnalysis) {
        const zoneColor = taskAnalysis.zone === 'excellent' ? '#27ae60' :
                         taskAnalysis.zone === 'good' ? '#3498db' :
                         taskAnalysis.zone === 'average' ? '#f39c12' :
                         taskAnalysis.zone === 'weak' ? '#e67e22' : '#e74c3c';
        
        html += `
            <div style="background: white; padding: 20px; border-radius: 10px; border: 1px solid #eee; margin-bottom: 20px;">
                <h4 style="margin-top: 0;">📊 Статистика выполнения</h4>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: ${zoneColor};">${taskAnalysis.percentage}%</div>
                        <div style="font-size: 12px; color: #666;">Процент выполнения</div>
                    </div>
                    
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #3498db;">${taskAnalysis.avgScore}/${task.maxScore}</div>
                        <div style="font-size: 12px; color: #666;">Средний балл</div>
                    </div>
                    
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #f39c12;">${taskAnalysis.completedBy}/${appData.students.length}</div>
                        <div style="font-size: 12px; color: #666;">Выполнили</div>
                    </div>
                    
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">${taskAnalysis.difficulty}</div>
                        <div style="font-size: 12px; color: #666;">Сложность</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong>Зона выполнения:</strong>
                    <span style="margin-left: 10px; padding: 5px 15px; background: ${zoneColor}; color: white; border-radius: 15px; font-weight: bold;">
                        ${taskAnalysis.zone === 'excellent' ? 'Отлично (>80%)' :
                          taskAnalysis.zone === 'good' ? 'Хорошо (60-80%)' :
                          taskAnalysis.zone === 'average' ? 'Средне (40-60%)' :
                          taskAnalysis.zone === 'weak' ? 'Слабо (20-40%)' : 'Критично (<20%)'}
                    </span>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong>Дискриминация:</strong> ${taskAnalysis.discrimination}
                    <div style="font-size: 11px; color: #666;">
                        (Разница между средними баллами лучших и худших учащихся)
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong>Стандартное отклонение:</strong> ${taskAnalysis.stdDev}
                    <div style="font-size: 11px; color: #666;">
                        (Мера разброса результатов)
                    </div>
                </div>
            </div>
        `;
    }
    
    // Распределение баллов
    html += `
        <div style="background: white; padding: 20px; border-radius: 10px; border: 1px solid #eee; margin-bottom: 20px;">
            <h4 style="margin-top: 0;">📈 Распределение баллов</h4>
            <div id="taskScoreDistribution" style="height: 200px; margin-top: 10px;">
                ${renderTaskScoreDistribution(taskIndex)}
            </div>
        </div>
    `;
    
    // Рекомендации
    html += `
        <div style="background: #e8f4fc; padding: 20px; border-radius: 10px;">
            <h4 style="margin-top: 0;">💡 Рекомендации</h4>
            ${renderTaskRecommendations(taskAnalysis)}
        </div>
    `;
    
    html += `</div>`;
    
    showModal(`Задание ${taskIndex + 1}`, html);
}

function renderTaskScoreDistribution(taskIndex) {
    const scores = [];
    const maxScore = appData.tasks[taskIndex]?.maxScore || 1;
    
    // Собираем баллы за это задание
    appData.students.forEach(student => {
        const studentId = student.id;
        const results = appData.results[studentId] || {};
        const taskId = appData.tasks[taskIndex].id || taskIndex;
        const score = parseFloat(results[taskId]) || 0;
        
        if (results[taskId] !== undefined) {
            scores.push(score);
        }
    });
    
    if (scores.length === 0) {
        return `
            <div style="text-align: center; padding: 40px; color: #999;">
                <div style="font-size: 36px; margin-bottom: 10px;">📊</div>
                <div>Нет данных о выполнении этого задания</div>
            </div>
        `;
    }
    
    // Создаем гистограмму
    const step = maxScore / 5;
    const bins = Array.from({length: 6}, (_, i) => ({
        range: i === 5 ? `${(i * step).toFixed(1)}+` : 
               `${(i * step).toFixed(1)}-${((i + 1) * step).toFixed(1)}`,
        min: i * step,
        max: i === 5 ? Infinity : (i + 1) * step,
        count: 0
    }));
    
    scores.forEach(score => {
        const bin = bins.find(b => score >= b.min && score < b.max);
        if (bin) bin.count++;
    });
    
    const maxCount = Math.max(...bins.map(b => b.count));
    
    let html = `
        <div style="display: flex; height: 150px; align-items: flex-end; gap: 10px; padding: 0 20px; border-bottom: 1px solid #eee;">
    `;
    
    bins.forEach(bin => {
        const height = maxCount > 0 ? (bin.count / maxCount * 100) + '%' : '0%';
        const percentage = scores.length > 0 ? (bin.count / scores.length * 100).toFixed(1) : 0;
        
        html += `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%;">
                <div style="width: 80%; background: ${percentage > 50 ? '#3498db' : '#f39c12'}; 
                      height: ${height}; border-radius: 5px 5px 0 0; position: relative;"
                      title="${bin.range} баллов: ${bin.count} учащихся (${percentage}%)">
                </div>
                <div style="margin-top: 5px; font-size: 10px; text-align: center;">
                    ${bin.range}<br>
                    <strong>${bin.count}</strong>
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
        <div style="text-align: center; margin-top: 10px; font-size: 11px; color: #666;">
            Всего выполнено: ${scores.length} из ${appData.students.length} учащихся
        </div>
    `;
    
    return html;
}

function renderTaskRecommendations(taskAnalysis) {
    if (!taskAnalysis) return '<p>Нет данных для рекомендаций</p>';
    
    const percentage = parseFloat(taskAnalysis.percentage);
    
    let recommendations = '';
    
    if (percentage >= 80) {
        recommendations = `
            <p><strong>✅ Задание хорошо усвоено группой:</strong></p>
            <ul>
                <li>Можно использовать как эталонный пример</li>
                <li>Рассмотреть возможность усложнения задания</li>
                <li>Привлечь успешных учащихся к помощи другим</li>
            </ul>
        `;
    } else if (percentage >= 60) {
        recommendations = `
            <p><strong>👍 Задание выполнено удовлетворительно:</strong></p>
            <ul>
                <li>Тема в целом усвоена</li>
                <li>Обратить внимание на типичные ошибки</li>
                <li>Провести небольшую коррекционную работу</li>
            </ul>
        `;
    } else if (percentage >= 40) {
        recommendations = `
            <p><strong>⚠️ Задание выполнено средне:</strong></p>
            <ul>
                <li>Требуется дополнительная отработка</li>
                <li>Выявить причины затруднений</li>
                <li>Использовать дифференцированный подход</li>
            </ul>
        `;
    } else if (percentage >= 20) {
        recommendations = `
            <p><strong>🔻 Задание выполнено слабо:</strong></p>
            <ul>
                <li>Необходимо повторное объяснение темы</li>
                <li>Разработать дополнительные материалы</li>
                <li>Организовать индивидуальные консультации</li>
            </ul>
        `;
    } else {
        recommendations = `
            <p><strong>🚨 Задание выполнено критично плохо:</strong></p>
            <ul>
                <li>Тема не усвоена большинством учащихся</li>
                <li>Требуется кардинальный пересмотр методики преподавания</li>
                <li>Рассмотреть возможность замены задания</li>
                <li>Провести дополнительные занятия</li>
            </ul>
        `;
    }
    
    return recommendations;
}

function showStudentDetails(studentIndex) {
    const student = appData.students[studentIndex];
    const analysis = window.currentAnalysis || {};
    const studentAnalysis = analysis.byStudent?.find(s => s.index === studentIndex);
    
    if (!student) {
        showNotification('Учащийся не найден', 'error');
        return;
    }
    
    let html = `
        <div style="max-width: 900px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0;">👤 Детальный анализ: ${student.lastName} ${student.firstName}</h3>
                <div>
                    <button class="btn btn-sm btn-outline" onclick="generateStudentReport(${studentIndex})">
                        📄 Отчет
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="hideModal()" style="margin-left: 10px;">
                        ✕ Закрыть
                    </button>
                </div>
            </div>
            
            <!-- Основная информация -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h4 style="margin-top: 0;">📋 Информация об учащемся</h4>
                        <div style="margin-bottom: 10px;">
                            <strong>ФИО:</strong> ${student.lastName} ${student.firstName}
                        </div>
                        <div style="margin-bottom: 10px;">
                            <strong>Логин:</strong> ${student.login || 'Не указан'}
                        </div>
                        <div style="margin-bottom: 10px;">
                            <strong>Группа:</strong> ${student.group || 'Не указана'}
                        </div>
                        ${student.notes ? `
                            <div style="margin-top: 15px;">
                                <strong>Заметки:</strong><br>
                                <div style="margin-top: 5px; padding: 10px; background: white; border-radius: 5px; font-size: 12px;">
                                    ${student.notes}
                                </div>
                            </div>
                        ` : ''}
                    </div>
    `;
    
    // Статистика выполнения
    if (studentAnalysis) {
        const gradeColor = getGradeColor(studentAnalysis.grade);
        
        html += `
                    <div>
                        <h4 style="margin-top: 0;">📊 Статистика выполнения</h4>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;">
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: bold; color: ${gradeColor};">${studentAnalysis.grade}</div>
                                <div style="font-size: 12px; color: #666;">Оценка</div>
                            </div>
                            
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: bold; color: ${getPercentageColor(studentAnalysis.percentage)};">${studentAnalysis.percentage}%</div>
                                <div style="font-size: 12px; color: #666;">Выполнение</div>
                            </div>
                            
                            <div style="text-align: center;">
                                <div style="font-size: 20px; font-weight: bold; color: #3498db;">${studentAnalysis.rank}</div>
                                <div style="font-size: 12px; color: #666;">Место в рейтинге</div>
                            </div>
                            
                            <div style="text-align: center;">
                                <div style="font-size: 20px; font-weight: bold; color: #f39c12;">${studentAnalysis.stability}</div>
                                <div style="font-size: 12px; color: #666;">Стабильность</div>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 10px;">
                            <strong>Баллы:</strong> ${studentAnalysis.totalScore} из ${studentAnalysis.maxPossible}
                        </div>
                        
                        <div style="margin-bottom: 10px;">
                            <strong>Выполнено заданий:</strong> ${studentAnalysis.completedTasks} из ${appData.tasks.length}
                        </div>
                        
                        <div style="margin-bottom: 10px;">
                            <strong>Рейтинг:</strong> Лучше чем ${studentAnalysis.percentile}% учащихся
                        </div>
                    </div>
        `;
    }
    
    html += `
                </div>
            </div>
    `;
    
    // Детали по заданиям
    if (studentAnalysis) {
        html += `
            <div style="margin-bottom: 20px;">
                <h4>📝 Выполнение по заданиям</h4>
                <div style="overflow-x: auto; max-height: 300px;">
                    <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="padding: 10px; background: #f8f9fa; text-align: center;">№</th>
                                <th style="padding: 10px; background: #f8f9fa;">Задание</th>
                                <th style="padding: 10px; background: #f8f9fa; text-align: center;">Балл</th>
                                <th style="padding: 10px; background: #f8f9fa; text-align: center;">Макс.</th>
                                <th style="padding: 10px; background: #f8f9fa; text-align: center;">%</th>
                                <th style="padding: 10px; background: #f8f9fa; text-align: center;">Уровень</th>
                                <th style="padding: 10px; background: #f8f9fa; text-align: center;">Групповой %</th>
                                <th style="padding: 10px; background: #f8f9fa; text-align: center;">Отклонение</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderStudentTaskDetails(studentIndex, studentAnalysis)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Анализ по уровням
        if (studentAnalysis.levelAnalysis) {
            html += `
                <div style="margin-bottom: 20px;">
                    <h4>🎯 Анализ по уровням сложности</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        ${renderStudentLevelAnalysis(studentAnalysis)}
                    </div>
                </div>
            `;
        }
        
        // Рекомендации
        html += `
            <div style="background: #e8f4fc; padding: 20px; border-radius: 10px;">
                <h4 style="margin-top: 0;">💡 Рекомендации для учащегося</h4>
                ${renderStudentRecommendations(studentAnalysis)}
            </div>
        `;
    }
    
    html += `</div>`;
    
    showModal(`Анализ: ${student.lastName} ${student.firstName}`, html);
}

function renderStudentTaskDetails(studentIndex, studentAnalysis) {
    const student = appData.students[studentIndex];
    const studentId = student.id;
    const results = appData.results[studentId] || {};
    
    let html = '';
    
    appData.tasks.forEach((task, taskIndex) => {
        const taskId = task.id || taskIndex;
        const score = parseFloat(results[taskId]) || 0;
        const maxScore = task.maxScore || 1;
        const percentage = maxScore > 0 ? (score / maxScore * 100) : 0;
        
        // Получаем групповой процент для этого задания
        const taskAnalysis = window.currentAnalysis?.byTask?.[taskIndex];
        const groupPercentage = taskAnalysis ? parseFloat(taskAnalysis.percentage) : 0;
        const deviation = percentage - groupPercentage;
        
        // Определяем цвет в зависимости от отклонения
        let deviationColor = '#666';
        let deviationIcon = '';
        
        if (results[taskId] === undefined) {
            deviationColor = '#999';
            deviationIcon = '−';
        } else if (deviation > 20) {
            deviationColor = '#27ae60';
            deviationIcon = '↑';
        } else if (deviation > 0) {
            deviationColor = '#3498db';
            deviationIcon = '↗';
        } else if (deviation > -20) {
            deviationColor = '#f39c12';
            deviationIcon = '↘';
        } else {
            deviationColor = '#e74c3c';
            deviationIcon = '↓';
        }
        
        html += `
            <tr style="${results[taskId] === undefined ? 'opacity: 0.6;' : ''}">
                <td style="padding: 8px; text-align: center; font-weight: bold;">${taskIndex + 1}</td>
                <td style="padding: 8px;">
                    ${task.description ? 
                        task.description.substring(0, 40) + (task.description.length > 40 ? '...' : '') : 
                        `Задание ${taskIndex + 1}`}
                </td>
                <td style="padding: 8px; text-align: center; font-weight: bold; 
                    color: ${score === maxScore ? '#27ae60' : score > 0 ? '#f39c12' : '#e74c3c'}">
                    ${score}
                </td>
                <td style="padding: 8px; text-align: center;">${maxScore}</td>
                <td style="padding: 8px; text-align: center; font-weight: bold; color: ${getPercentageColor(percentage)}">
                    ${percentage.toFixed(1)}%
                </td>
                <td style="padding: 8px; text-align: center;">
                    <span style="padding: 3px 8px; background: ${complexityLevels[task.level]?.color || '#95a5a6'}; 
                          color: white; border-radius: 10px; font-size: 11px;">
                        ${task.level}
                    </span>
                </td>
                <td style="padding: 8px; text-align: center;">${groupPercentage.toFixed(1)}%</td>
                <td style="padding: 8px; text-align: center; color: ${deviationColor}; font-weight: bold;">
                    ${deviationIcon} ${results[taskId] !== undefined ? deviation.toFixed(1) : '−'}%
                </td>
            </tr>
        `;
    });
    
    return html;
}

function renderStudentLevelAnalysis(studentAnalysis) {
    let html = '';
    
    Object.entries(studentAnalysis.levelAnalysis || {}).forEach(([level, data]) => {
        const levelInfo = complexityLevels[level] || { name: `Уровень ${level}` };
        const percentage = parseFloat(data.completionRate);
        const score = parseFloat(data.avgScore);
        
        html += `
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #eee; 
                  border-top: 4px solid ${levelInfo.color || '#95a5a6'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="font-weight: bold;">${levelInfo.name}</div>
                    <div style="font-size: 12px; color: #666;">${data.completionRate}% выполнено</div>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <div style="font-size: 11px; color: #666; margin-bottom: 3px;">Средний балл:</div>
                    <div style="font-size: 18px; font-weight: bold; color: ${score >= 80 ? '#27ae60' : score >= 60 ? '#3498db' : '#e74c3c'}">
                        ${data.avgScore}
                    </div>
                </div>
                
                <div style="height: 10px; background: #f8f9fa; border-radius: 5px; overflow: hidden;">
                    <div style="height: 100%; width: ${percentage}%; background: ${levelInfo.color || '#95a5a6'};"></div>
                </div>
                
                <div style="font-size: 10px; color: #666; margin-top: 5px;">
                    Эффективность на этом уровне
                </div>
            </div>
        `;
    });
    
    return html;
}

function renderStudentRecommendations(studentAnalysis) {
    const percentage = parseFloat(studentAnalysis.percentage);
    const stability = parseFloat(studentAnalysis.stability);
    
    let recommendations = '';
    
    // Оценка общего уровня
    if (percentage >= 80) {
        recommendations += `
            <p><strong>✅ Высокий уровень знаний:</strong></p>
            <ul>
                <li>Учащийся демонстрирует отличное понимание материала</li>
                <li>Рекомендуется участие в олимпиадах и конкурсах</li>
                <li>Можно привлекать к помощи другим учащимся</li>
            </ul>
        `;
    } else if (percentage >= 60) {
        recommendations += `
            <p><strong>👍 Хороший уровень знаний:</strong></p>
            <ul>
                <li>Материал усвоен удовлетворительно</li>
                <li>Рекомендуется обратить внимание на проблемные темы</li>
                <li>Полезны дополнительные тренировочные задания</li>
            </ul>
        `;
    } else if (percentage >= 40) {
        recommendations += `
            <p><strong>⚠️ Средний уровень знаний:</strong></p>
            <ul>
                <li>Требуется дополнительная работа над материалом</li>
                <li>Рекомендуются индивидуальные консультации</li>
                <li>Необходимо выявить и устранить пробелы в знаниях</li>
            </ul>
        `;
    } else {
        recommendations += `
            <p><strong>🔻 Низкий уровень знаний:</strong></p>
            <ul>
                <li>Требуется интенсивная коррекционная работа</li>
                <li>Рекомендуется индивидуальный образовательный маршрут</li>
                <li>Необходимо выяснить причины отставания</li>
            </ul>
        `;
    }
    
    // Рекомендации по стабильности
    if (stability >= 80) {
        recommendations += `
            <p><strong>📊 Стабильные результаты:</strong></p>
            <ul>
                <li>Учащийся демонстрирует последовательность в обучении</li>
                <li>Прогноз дальнейшего обучения благоприятный</li>
            </ul>
        `;
    } else if (stability >= 60) {
        recommendations += `
            <p><strong>📊 Удовлетворительная стабильность:</strong></p>
            <ul>
                <li>Результаты в целом предсказуемы</li>
                <li>Рекомендуется развивать системность мышления</li>
            </ul>
        `;
    } else {
        recommendations += `
            <p><strong>📊 Нестабильные результаты:</strong></p>
            <ul>
                <li>Знания фрагментарны, есть пробелы</li>
                <li>Требуется развитие навыков самоконтроля</li>
                <li>Полезны задания на повторение и закрепление</li>
            </ul>
        `;
    }
    
    // Рекомендации по сильным/слабым сторонам
    if (studentAnalysis.strengths && studentAnalysis.strengths.length > 0) {
        recommendations += `
            <p><strong>⭐ Сильные стороны:</strong></p>
            <ul>
                <li>Хорошо усвоены задания: ${studentAnalysis.strengths.join(', ')}</li>
                <li>Можно использовать как основу для дальнейшего развития</li>
            </ul>
        `;
    }
    
    if (studentAnalysis.weaknesses && studentAnalysis.weaknesses.length > 0) {
        recommendations += `
            <p><strong>🔧 Слабые стороны:</strong></p>
            <ul>
                <li>Требуют внимания задания: ${studentAnalysis.weaknesses.join(', ')}</li>
                <li>Рекомендуется дополнительная отработка этих тем</li>
            </ul>
        `;
    }
    
    return recommendations;
}

function generateStudentReport(studentIndex) {
    const student = appData.students[studentIndex];
    const analysis = window.currentAnalysis || {};
    const studentAnalysis = analysis.byStudent?.find(s => s.index === studentIndex);
    
    if (!student || !studentAnalysis) {
        showNotification('Нет данных для отчета', 'error');
        return;
    }
    
    const report = {
        metadata: {
            generated: new Date().toISOString(),
            studentName: `${student.lastName} ${student.firstName}`,
            studentLogin: student.login,
            studentGroup: student.group,
            subject: appData.test.subject,
            class: appData.test.class,
            theme: appData.test.theme,
            date: appData.test.testDate
        },
        performance: {
            totalScore: studentAnalysis.totalScore,
            maxPossible: studentAnalysis.maxPossible,
            percentage: studentAnalysis.percentage,
            grade: studentAnalysis.grade,
            rank: studentAnalysis.rank,
            percentile: studentAnalysis.percentile,
            stability: studentAnalysis.stability,
            completedTasks: studentAnalysis.completedTasks,
            totalTasks: appData.tasks.length
        },
        strengths: studentAnalysis.strengths,
        weaknesses: studentAnalysis.weaknesses,
        levelAnalysis: studentAnalysis.levelAnalysis,
        taskDetails: [],
        recommendations: []
    };
    
    // Собираем детали по заданиям
    const studentId = student.id;
    const results = appData.results[studentId] || {};
    
    appData.tasks.forEach((task, taskIndex) => {
        const taskId = task.id || taskIndex;
        const score = parseFloat(results[taskId]) || 0;
        const maxScore = task.maxScore || 1;
        const percentage = maxScore > 0 ? (score / maxScore * 100) : 0;
        
        const taskAnalysis = analysis.byTask?.[taskIndex];
        const groupPercentage = taskAnalysis ? parseFloat(taskAnalysis.percentage) : 0;
        const deviation = percentage - groupPercentage;
        
        report.taskDetails.push({
            taskNumber: taskIndex + 1,
            description: task.description || `Задание ${taskIndex + 1}`,
            level: task.level,
            score,
            maxScore,
            percentage,
            groupPercentage,
            deviation,
            completed: results[taskId] !== undefined
        });
    });
    
    // Генерируем рекомендации
    const percentage = parseFloat(studentAnalysis.percentage);
    
    if (percentage >= 80) {
        report.recommendations.push({
            type: 'success',
            text: 'Продолжать углубленное изучение предмета',
            priority: 'low'
        });
    } else if (percentage >= 60) {
        report.recommendations.push({
            type: 'info',
            text: 'Сконцентрироваться на проблемных темах',
            priority: 'medium'
        });
    } else {
        report.recommendations.push({
            type: 'warning',
            text: 'Требуется интенсивная коррекционная работа',
            priority: 'high'
        });
    }
    
    if (studentAnalysis.weaknesses.length > 0) {
        report.recommendations.push({
            type: 'warning',
            text: `Отработать задания: ${studentAnalysis.weaknesses.join(', ')}`,
            priority: 'high'
        });
    }
    
    // Экспорт отчета
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const fileName = `Отчет_${student.lastName}_${student.firstName}_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}.json`;
    
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`✅ Отчет по учащемуся экспортирован`, 'success');
}

function exportStudentList() {
    const analysis = window.currentAnalysis || {};
    const students = analysis.byStudent || [];
    
    // Создаем CSV
    let csv = 'Ранг;ФИО;Логин;Группа;Баллы;Макс.;%;Оценка;Рейтинг;Стабильность;Сильные стороны;Слабые стороны\n';
    
    students.forEach(student => {
        const row = [
            student.rank,
            `"${student.name}"`,
            student.login || '',
            student.group || '',
            student.totalScore,
            student.maxPossible,
            student.percentage,
            student.grade,
            student.percentile,
            student.stability,
            `"${student.strengths.join(',')}"`,
            `"${student.weaknesses.join(',')}"`
        ];
        
        csv += row.join(';') + '\n';
    });
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const date = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');
    link.href = url;
    link.download = `список_учащихся_${date}.csv`;
    link.click();
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    showNotification('✅ Список учащихся экспортирован в CSV', 'success');
}

function getGradeColor(grade) {
    if (grade >= 4.5) return '#27ae60';
    if (grade >= 3.5) return '#3498db';
    if (grade >= 2.5) return '#f39c12';
    return '#e74c3c';
}

// ==================== УТИЛИТЫ ====================

function calculateMaxScore() {
    let maxScore = 0;
    appData.tasks.forEach(task => {
        maxScore += task.maxScore || 1;
    });
    return maxScore;
}

function calculateGrade(totalScore) {
    const maxScore = calculateMaxScore();
    if (maxScore === 0) return 2;
    
    const percentage = (totalScore / maxScore) * 100;
    
    if (percentage >= 85) return 5;
    if (percentage >= 70) return 4;
    if (percentage >= 50) return 3;
    return 2;
}

// Инициализация глобальных переменных (если их еще нет)
if (!window.complexityLevels) {
    window.complexityLevels = {
        1: { name: 'Знание', color: '#3498db' },
        2: { name: 'Понимание', color: '#2ecc71' },
        3: { name: 'Применение', color: '#f39c12' },
        4: { name: 'Анализ', color: '#e74c3c' }
    };
}

if (!window.errorTypes) {
    window.errorTypes = {
        computational: { name: 'Вычислительная ошибка', color: '#e74c3c' },
        conceptual: { name: 'Концептуальная ошибка', color: '#3498db' },
        procedural: { name: 'Процедурная ошибка', color: '#f39c12' },
        notation: { name: 'Ошибка в записи', color: '#9b59b6' },
        reading: { name: 'Ошибка в чтении задания', color: '#1abc9c' },
        time: { name: 'Ошибка из-за нехватки времени', color: '#95a5a6' }
    };
}

if (!window.workTypes) {
    window.workTypes = {
        test: { name: 'Тест' },
        control: { name: 'Контрольная работа' },
        independent: { name: 'Самостоятельная работа' },
        homework: { name: 'Домашняя работа' },
        exam: { name: 'Экзамен' }
    };
}
// Основной объект настроек
const appState = {
    currentStep: 1,
    totalSteps: 4,
    workType: '',
    settings: {},
    criteria: {}
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadSavedData();
    updateProgress();
    setupEventListeners();
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
let autoSaveTimer;
function scheduleAutoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(saveTestSettings, 2000);
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
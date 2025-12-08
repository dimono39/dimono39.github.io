// ==================== БАЗОВЫЕ ФУНКЦИИ СИСТЕМЫ ====================

// Глобальные переменные
let appData = {
    test: {
        subject: "",
        class: "",
        testDate: new Date().toISOString().split('T')[0],
        theme: "",
        goals: "",
        workType: "current",
        workFormat: "mixed",
        timeLimit: 45,
        totalStudents: 25,
        presentStudents: 23,
        absentReason: "",
        criteria: {
            5: { min: 18, max: 20 },
            4: { min: 15, max: 17 },
            3: { min: 10, max: 14 },
            2: { min: 0, max: 9 }
        },
        criteriaType: 'points',
        criteriaSystem: 'standard',
        customCriteria: [],
        criteriaCount: 4,
        criteriaScale: '2-5'
    },
    tasks: [],
    students: [],
    results: [],
    errors: [],
    psychologyFeatures: []
};

// Константы
const complexityLevels = {
    1: { name: "Базовый/Репродуктивный", color: "#27ae60", desc: "воспроизведение фактов, правил, определений" },
    2: { name: "Применение", color: "#3498db", desc: "применение знаний в стандартной ситуации" },
    3: { name: "Анализ/Синтез", color: "#f39c12", desc: "анализ, сравнение, аргументация" },
    4: { name: "Творчество", color: "#e74c3c", desc: "решение нестандартных задач, творческие задания" }
};

const errorTypes = {
    factual: { name: "Фактические ошибки", color: "#e74c3c", desc: "неверные даты, имена, формулы" },
    conceptual: { name: "Концептуальные ошибки", color: "#9b59b6", desc: "непонимание теории, законов, принципов" },
    application: { name: "Ошибки применения", color: "#3498db", desc: "неверный выбор способа решения" },
    calculation: { name: "Вычислительные ошибки", color: "#f39c12", desc: "ошибки в вычислениях" },
    logical: { name: "Логические ошибки", color: "#d35400", desc: "нарушение логики в рассуждениях" },
    attention: { name: "Ошибки внимательности", color: "#16a085", desc: "неверно прочел условие, пропустил вопрос" },
    technical: { name: "Технические ошибки", color: "#7f8c8d", desc: "единицы измерения, оформление" }
};

// ==================== ФУНКЦИИ ХРАНЕНИЯ ДАННЫХ ====================

function saveData() {
    try {
        localStorage.setItem('testAnalyticsData', JSON.stringify(appData));
        console.log('Данные сохранены в localStorage');
    } catch (error) {
        console.error('Ошибка при сохранении данных:', error);
    }
}

function loadData() {
    try {
        const saved = localStorage.getItem('testAnalyticsData');
        if (saved) {
            const parsed = JSON.parse(saved);
            
            // Мерджим с сохранением новых полей
            appData = {
                ...appData,
                ...parsed,
                test: {
                    ...appData.test,
                    ...parsed.test
                }
            };
            
            // Гарантируем наличие обязательных полей
            if (!appData.test.criteriaType) appData.test.criteriaType = 'points';
            if (!appData.test.criteriaSystem) appData.test.criteriaSystem = 'standard';
            if (!appData.test.customCriteria) appData.test.customCriteria = [];
            if (!appData.test.criteriaCount) appData.test.criteriaCount = 4;
            if (!appData.test.criteriaScale) appData.test.criteriaScale = '2-5';
            if (!appData.psychologyFeatures) appData.psychologyFeatures = [];
            
            console.log('Данные загружены из localStorage');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        return false;
    }
}

function scheduleAutoSave() {
    clearTimeout(window.saveTimeout);
    window.saveTimeout = setTimeout(() => {
        saveData();
        showNotification('Данные автоматически сохранены', 'success');
    }, 2000);
}

// ==================== БАЗОВЫЕ ФУНКЦИИ РАСЧЕТОВ ====================

function calculateGrade(totalScore) {
    try {
        if (!appData.test.criteria) return 2;
        
        for (let grade of [5, 4, 3, 2]) {
            const criteria = appData.test.criteria[grade];
            if (criteria && totalScore >= criteria.min && totalScore <= criteria.max) {
                return grade;
            }
        }
        return 2;
    } catch (error) {
        console.error('Ошибка расчета оценки:', error);
        return 2;
    }
}

function calculateAverageScore() {
    if (appData.results.length === 0) return 0;
    const totalScores = appData.results.map(scores => scores.reduce((sum, score) => sum + score, 0));
    return totalScores.reduce((sum, score) => sum + score, 0) / totalScores.length;
}

function calculateSuccessRate() {
    if (appData.results.length === 0) return 0;
    const totalScores = appData.results.map(scores => scores.reduce((sum, score) => sum + score, 0));
    const grades = totalScores.map(score => calculateGrade(score));
    return (grades.filter(grade => grade >= 3).length / grades.length * 100);
}

function calculateQualityRate() {
    if (appData.results.length === 0) return 0;
    const totalScores = appData.results.map(scores => scores.reduce((sum, score) => sum + score, 0));
    const grades = totalScores.map(score => calculateGrade(score));
    return (grades.filter(grade => grade >= 4).length / grades.length * 100);
}

function calculateTaskCompletion(taskIndex) {
    if (appData.results.length === 0 || !appData.tasks[taskIndex]) return 0;
    
    const maxScore = appData.tasks[taskIndex].maxScore;
    const totalScore = appData.results.reduce((sum, studentScores) => 
        sum + (studentScores[taskIndex] || 0), 0);
    
    return maxScore > 0 ? (totalScore / (maxScore * appData.results.length)) * 100 : 0;
}

// ==================== ДОБАВЬТЕ ЭТИ ФУНКЦИИ В CORE.JS ====================

function updateCriteriaForWorkType() {
    try {
        const workType = appData.test.workType;
        const criteria = appData.test.criteria || {};
        
        switch(workType) {
            case 'oge':
                criteria[5] = { min: 22, max: 32 };
                criteria[4] = { min: 15, max: 21 };
                criteria[3] = { min: 8, max: 14 };
                criteria[2] = { min: 0, max: 7 };
                break;
            case 'ege':
                criteria[5] = { min: 27, max: 31 };
                criteria[4] = { min: 20, max: 26 };
                criteria[3] = { min: 12, max: 19 };
                criteria[2] = { min: 0, max: 11 };
                break;
            case 'vpr':
                criteria[5] = { min: 18, max: 20 };
                criteria[4] = { min: 15, max: 17 };
                criteria[3] = { min: 10, max: 14 };
                criteria[2] = { min: 0, max: 9 };
                break;
            case 'func_literacy':
                criteria[5] = { min: 90, max: 100 };
                criteria[4] = { min: 75, max: 89 };
                criteria[3] = { min: 50, max: 74 };
                criteria[2] = { min: 0, max: 49 };
                break;
            case 'psychology':
                criteria[5] = { min: 85, max: 100, label: "Очень высокий" };
                criteria[4] = { min: 70, max: 84, label: "Высокий" };
                criteria[3] = { min: 50, max: 69, label: "Средний" };
                criteria[2] = { min: 30, max: 49, label: "Низкий" };
                criteria[1] = { min: 0, max: 29, label: "Очень низкий" };
                break;
            default:
                // Стандартные критерии
                criteria[5] = { min: 18, max: 20 };
                criteria[4] = { min: 15, max: 17 };
                criteria[3] = { min: 10, max: 14 };
                criteria[2] = { min: 0, max: 9 };
        }
        
        appData.test.criteria = criteria;
        console.log(`Критерии обновлены для типа работы: ${workType}`);
        
    } catch (error) {
        console.error('Ошибка в updateCriteriaForWorkType:', error);
    }
}

function getDefaultTaskCount() {
    const workType = appData.test.workType || 'current';
    
    switch(workType) {
        case 'oge': return 15;
        case 'ege': return 19;
        case 'vpr': return 12;
        case 'func_literacy': return 8;
        case 'psychology': return 8;
        default: return 8;
    }
}

function updateTaskStatistics(taskIndex) {
    // Простая реализация - можно расширить
    console.log(`Обновлена статистика задания ${taskIndex}`);
}

function updateStudentStatistics(studentIndex) {
    // Простая реализация - можно расширить
    console.log(`Обновлена статистика учащегося ${studentIndex}`);
}

// ==================== ОБНОВЛЕННАЯ ИНИЦИАЛИЗАЦИЯ ====================

function initializeApp() {
    console.log('Инициализация приложения...');
    
    // Загружаем данные
    const hasData = loadData();
    
    // Если данных нет, загружаем пример
    if (!hasData || !appData.tasks || appData.tasks.length === 0) {
        console.log('Данные не найдены, загружаем пример...');
        loadStandardSample();
    }
    
    // Обновляем критерии для типа работы
    updateCriteriaForWorkType();
    
    // Рендерим интерфейс
    if (window.renderAll) {
        renderAll();
    } else {
        console.error('Функция renderAll не найдена!');
    }
    
    // Показываем первую вкладку
    if (window.showTab) {
        showTab('setup');
    }
    
    console.log('Приложение успешно инициализировано');
}


// ==================== ФУНКЦИИ ДЛЯ ЗАГРУЗКИ ПРИМЕРОВ ====================

function loadSampleData() {
    const workType = appData.test.workType || 'current';
    
    switch(workType) {
        case 'vpr':
            loadVPRSample();
            break;
        case 'func_literacy':
            loadLiteracySample();
            break;
        case 'oge':
            loadOGESample();
            break;
        case 'ege':
            loadEGESample();
            break;
        case 'psychology':
            loadPsychologySample();
            break;
        default:
            loadStandardSample();
    }
    
    saveData();
    renderAll();
    showNotification("Пример данных загружен!", "success");
}

function loadStandardSample() {
    appData = {
        test: {
            subject: "Математика",
            class: "5А",
            testDate: new Date().toISOString().split('T')[0],
            theme: "Дроби и проценты",
            goals: "1. Сложение и вычитание дробей\n2. Умножение и деление дробей\n3. Нахождение процентов от числа\n4. Решение текстовых задач на проценты",
            workType: "current",
            workFormat: "mixed",
            timeLimit: 45,
            totalStudents: 25,
            presentStudents: 23,
            absentReason: "2 учащихся - болезнь",
            criteria: {
                5: { min: 22, max: 24 },
                4: { min: 18, max: 21 },
                3: { min: 12, max: 17 },
                2: { min: 0, max: 11 }
            },
            criteriaType: 'points',
            criteriaSystem: 'standard'
        },
        tasks: [
            { type: "Сложение дробей", maxScore: 3, level: 1, knowledge: "правила сложения дробей", number: 1 },
            { type: "Вычитание дробей", maxScore: 2, level: 1, knowledge: "правила вычитания дробей", number: 2 },
            { type: "Умножение дробей", maxScore: 4, level: 2, knowledge: "умножение дробей", number: 3 },
            { type: "Деление дробей", maxScore: 3, level: 2, knowledge: "деление дробей", number: 4 },
            { type: "Проценты от числа", maxScore: 2, level: 2, knowledge: "нахождение процентов", number: 5 },
            { type: "Нахождение числа по %", maxScore: 3, level: 3, knowledge: "обратные задачи на проценты", number: 6 },
            { type: "Задачи на проценты", maxScore: 4, level: 3, knowledge: "текстовые задачи", number: 7 },
            { type: "Сложные задачи", maxScore: 3, level: 4, knowledge: "комбинированные задачи", number: 8 }
        ],
        students: [
            "Иванов Алексей", "Петрова Мария", "Сидоров Дмитрий",
            "Козлова Анна", "Николаев Иван", "Федорова Елена"
        ],
        results: [
            [3, 2, 4, 3, 2, 3, 4, 3],
            [2, 1, 3, 2, 2, 2, 3, 2],
            [3, 2, 4, 3, 1, 3, 4, 3],
            [1, 1, 2, 1, 1, 1, 2, 1],
            [3, 2, 3, 3, 2, 3, 3, 3],
            [2, 2, 3, 2, 2, 2, 3, 2]
        ],
        errors: []
    };
}

function loadPsychologySample() {
    appData = {
        test: {
            subject: "Психология",
            class: "10А",
            testDate: new Date().toISOString().split('T')[0],
            theme: "Диагностика эмоционального интеллекта",
            goals: "Оценка уровня развития эмоционального интеллекта",
            workType: "psychology",
            workFormat: "test",
            timeLimit: 40,
            totalStudents: 25,
            presentStudents: 6,
            absentReason: "Участие в олимпиаде",
            criteria: {
                5: { min: 85, max: 100, label: "Очень высокий" },
                4: { min: 70, max: 84, label: "Высокий" },
                3: { min: 50, max: 69, label: "Средний" },
                2: { min: 30, max: 49, label: "Низкий" },
                1: { min: 0, max: 29, label: "Очень низкий" }
            },
            psychologySettings: {
                scaleType: '1-5',
                usePercentages: true
            }
        },
        tasks: [
            { type: "Распознавание эмоций", maxScore: 10, level: 1, knowledge: "Восприятие эмоций", number: 1 },
            { type: "Идентификация эмоций", maxScore: 8, level: 2, knowledge: "Восприятие эмоций", number: 2 },
            { type: "Эмоции и решения", maxScore: 12, level: 3, knowledge: "Использование эмоций", number: 3 },
            { type: "Сложные эмоции", maxScore: 15, level: 3, knowledge: "Понимание эмоций", number: 4 }
        ],
        students: [
            "Иванова Анна", "Петров Максим", "Сидорова Екатерина",
            "Козлов Артем", "Николаева София", "Федоров Дмитрий"
        ],
        results: [
            [8, 6, 9, 12],
            [6, 5, 7, 8],
            [9, 7, 10, 14],
            [7, 5, 8, 10],
            [5, 4, 6, 7],
            [10, 8, 12, 15]
        ],
        errors: [],
        psychologyFeatures: []
    };
}

// ==================== ФУНКЦИИ УПРАВЛЕНИЯ ДАННЫМИ ====================

function updateResult(studentIndex, taskIndex, value) {
    if (!appData.results[studentIndex]) {
        appData.results[studentIndex] = [];
    }
    
    // Ограничиваем значение максимальным баллом
    const maxScore = appData.tasks[taskIndex]?.maxScore || 0;
    const validatedValue = Math.max(0, Math.min(value, maxScore));
    
    appData.results[studentIndex][taskIndex] = validatedValue;
    saveData();
    scheduleAutoSave();
    
    // Обновляем только связанные компоненты
    updateTaskStatistics(taskIndex);
    updateStudentStatistics(studentIndex);
}

function addStudent() {
    const newStudent = `Новый учащийся ${appData.students.length + 1}`;
    appData.students.push(newStudent);
    appData.results.push(new Array(appData.tasks.length).fill(0));
    
    saveData();
    renderStudents();
    showNotification(`Добавлен учащийся: ${newStudent}`, "success");
}

function removeStudent(index) {
    if (appData.students.length <= 1) {
        showNotification("Нельзя удалить последнего учащегося!", "error");
        return;
    }
    
    const studentName = appData.students[index];
    if (confirm(`Удалить учащегося "${studentName}"?`)) {
        appData.students.splice(index, 1);
        appData.results.splice(index, 1);
        
        // Обновляем индексы ошибок
        appData.errors = appData.errors.filter(error => error.studentIndex !== index);
        appData.errors.forEach(error => {
            if (error.studentIndex > index) {
                error.studentIndex--;
            }
        });
        
        saveData();
        renderStudents();
        renderResults();
        showNotification(`Учащийся "${studentName}" удален`, "success");
    }
}

function addTask() {
    const newTask = {
        type: `Новое задание ${appData.tasks.length + 1}`,
        maxScore: 1,
        level: 1,
        knowledge: "",
        number: appData.tasks.length + 1
    };
    
    appData.tasks.push(newTask);
    
    // Добавляем колонку для всех учащихся
    appData.results.forEach(studentResults => {
        studentResults.push(0);
    });
    
    saveData();
    renderTasks();
    renderResults();
    showNotification(`Добавлено задание №${newTask.number}`, "success");
}

function removeTask(taskIndex) {
    if (appData.tasks.length <= 1) {
        showNotification("Нельзя удалить последнее задание!", "error");
        return;
    }
    
    if (confirm(`Удалить задание №${taskIndex + 1}?`)) {
        appData.tasks.splice(taskIndex, 1);
        
        // Обновляем номера оставшихся заданий
        appData.tasks.forEach((task, index) => {
            task.number = index + 1;
        });
        
        // Удаляем колонку у всех учащихся
        appData.results.forEach(studentResults => {
            studentResults.splice(taskIndex, 1);
        });
        
        // Обновляем ошибки
        appData.errors = appData.errors.filter(error => error.taskIndex !== taskIndex);
        appData.errors.forEach(error => {
            if (error.taskIndex > taskIndex) {
                error.taskIndex--;
            }
        });
        
        saveData();
        renderTasks();
        renderResults();
        showNotification("Задание удалено", "success");
    }
}

// ==================== ФУНКЦИИ УВЕДОМЛЕНИЙ И МОДАЛЬНЫХ ОКОН ====================

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        z-index: 1000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    
    if (type === 'success') {
        notification.style.background = '#27ae60';
    } else if (type === 'error') {
        notification.style.background = '#e74c3c';
    } else if (type === 'warning') {
        notification.style.background = '#f39c12';
    }
    
    document.body.appendChild(notification);
    
    // Автоматическое удаление через 3 секунды
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// ==================== ФУНКЦИИ ДЛЯ РАБОТЫ С ВКЛАДКАМИ ====================

function showTab(tabName) {
    // Скрываем все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Убираем активный класс у всех кнопок
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показываем выбранную вкладку
    const tabElement = document.getElementById(tabName);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    // Обновляем содержимое вкладок при переключении
    switch(tabName) {
        case 'analytics':
            updateAnalytics();
            break;
        case 'visualization':
            updateVisualization();
            break;
        case 'recommendations':
            updateRecommendations();
            break;
        case 'export':
            updateReportPreview();
            break;
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

function initializeApp() {
    console.log('Инициализация приложения...');
    
    // Загружаем данные
    const hasData = loadData();
    
    // Если данных нет, загружаем пример
    if (!hasData || appData.tasks.length === 0) {
        console.log('Данные не найдены, загружаем пример...');
        loadStandardSample();
    }
    
    // Рендерим интерфейс
    renderAll();
    
    // Показываем первую вкладку
    showTab('setup');
    
    console.log('Приложение успешно инициализировано');
}
// Функции для модальных окон
function showModal(title, content) {
    const modalOverlay = document.getElementById('modalOverlay');
    const modalContent = document.getElementById('modalContent');
    
    if (!modalOverlay || !modalContent) {
        console.error('Модальные элементы не найдены!');
        return;
    }
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>${title}</h3>
            <button class="modal-close" onclick="hideModal()">×</button>
        </div>
        <div class="modal-body">
            ${content}
        </div>
    `;
    
    modalOverlay.style.display = 'flex';
    setTimeout(() => {
        modalOverlay.style.opacity = '1';
    }, 10);
}

function hideModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.style.opacity = '0';
        setTimeout(() => {
            modalOverlay.style.display = 'none';
        }, 300);
    }
}

// Глобальный экспорт
window.showModal = showModal;
window.hideModal = hideModal;
// Экспортируем функции в глобальную область видимости
window.appData = appData;
window.saveData = saveData;
window.loadData = loadData;
window.loadSampleData = loadSampleData;
window.calculateGrade = calculateGrade;
window.updateResult = updateResult;
window.addStudent = addStudent;
window.removeStudent = removeStudent;
window.addTask = addTask;
window.removeTask = removeTask;
window.showNotification = showNotification;
window.showTab = showTab;
window.initializeApp = initializeApp;
window.updateCriteriaForWorkType = updateCriteriaForWorkType;
window.getDefaultTaskCount = getDefaultTaskCount;
window.updateTaskStatistics = updateTaskStatistics;
window.updateStudentStatistics = updateStudentStatistics;

// Инициализируем при загрузке DOM
if (!window.appInitialized) {
    window.appInitialized = true;
    
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOMContentLoaded - запускаем инициализацию');
        
        // Даем время на загрузку всех скриптов
        setTimeout(function() {
            if (window.initializeApp) {
                initializeApp();
            } else {
                console.error('Функция initializeApp не найдена!');
                // Альтернативная инициализация
                if (window.loadData) loadData();
                if (window.renderAll) {
                    setTimeout(renderAll, 100);
                    setTimeout(() => {
                        if (window.showTab) showTab('setup');
                    }, 200);
                }
            }
        }, 100);
    });
}
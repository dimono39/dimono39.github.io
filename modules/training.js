// ============================
// ФУНКЦИИ ТРЕНАЖЕРОВ
// ============================

// Инициализация тренажеров при загрузке вкладки
function initializeTrainingTab() {
    updateTrainingStats();
    loadErrorBasedExercises();
    loadTrainingHistory();
}

// Обновление статистики
function updateTrainingStats() {
    const trainingData = JSON.parse(localStorage.getItem('trainingData') || '{}');
    
    document.getElementById('trainingLevel').textContent = trainingData.level || 1;
    document.getElementById('trainingPoints').textContent = trainingData.points || 0;
    document.getElementById('trainingStreak').textContent = trainingData.streak || 0;
    document.getElementById('trainingAccuracy').textContent = trainingData.accuracy || '0%';
}

// Загрузка упражнений на основе ошибок
function loadErrorBasedExercises() {
    const errorBasedExercises = document.getElementById('errorBasedExercises');
    
    // Проверяем, есть ли данные об ошибках
    const results = JSON.parse(localStorage.getItem('appData'))?.results || [];
    
    if (results.length === 0) {
        return; // Оставляем пустой блок
    }
    
    // Анализируем ошибки и создаем упражнения
    const errorAnalysis = analyzeErrorsForTraining();
    
    // Генерируем упражнения на основе анализа
    const exercisesHTML = errorAnalysis.map((error, index) => `
        <div class="exercise-card" style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid ${getErrorColor(error.type)};">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div>
                    <h5 style="margin: 0; color: #2c3e50;">${error.title}</h5>
                    <p style="color: #7f8c8d; font-size: 14px; margin: 5px 0;">${error.description}</p>
                </div>
                <span class="badge" style="background: ${getErrorColor(error.type)}; color: white; padding: 3px 10px; border-radius: 10px; font-size: 12px;">
                    ${error.count} ошибок
                </span>
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-sm btn-primary" onclick="startSpecificTraining('${error.type}')">
                    <i class="fas fa-play me-1"></i> Начать тренировку
                </button>
                <button class="btn btn-sm btn-outline" onclick="showErrorExamples('${error.type}')">
                    <i class="fas fa-eye me-1"></i> Примеры
                </button>
            </div>
        </div>
    `).join('');
    
    errorBasedExercises.innerHTML = exercisesHTML;
}

// Анализ ошибок для тренировок
function analyzeErrorsForTraining() {
    const appData = JSON.parse(localStorage.getItem('appData')) || {};
    const tasks = appData.tasks || [];
    const results = appData.results || [];
    
    // Группируем ошибки по типам
    const errorGroups = {};
    
    results.forEach(result => {
        if (result.errors && result.errors.length > 0) {
            result.errors.forEach(error => {
                if (!errorGroups[error.type]) {
                    errorGroups[error.type] = {
                        count: 0,
                        tasks: [],
                        students: []
                    };
                }
                errorGroups[error.type].count++;
                if (!errorGroups[error.type].tasks.includes(error.taskId)) {
                    errorGroups[error.type].tasks.push(error.taskId);
                }
                if (!errorGroups[error.type].students.includes(result.studentId)) {
                    errorGroups[error.type].students.push(result.studentId);
                }
            });
        }
    });
    
    // Преобразуем в массив для отображения
    const errorAnalysis = Object.keys(errorGroups).map(type => {
        const errorInfo = getErrorInfo(type);
        return {
            type: type,
            title: errorInfo.name,
            description: errorInfo.desc,
            count: errorGroups[type].count,
            tasks: errorGroups[type].tasks,
            students: errorGroups[type].students.length
        };
    });
    
    return errorAnalysis;
}

// Получение информации об ошибке
function getErrorInfo(type) {
    const errorTypes = {
        factual: { name: "Фактические ошибки", desc: "Неверные даты, имена, формулы" },
        conceptual: { name: "Концептуальные ошибки", desc: "Непонимание теории, законов, принципов" },
        application: { name: "Ошибки применения", desc: "Неверный выбор способа решения" },
        calculation: { name: "Вычислительные ошибки", desc: "Ошибки в вычислениях" },
        logical: { name: "Логические ошибки", desc: "Нарушение логики в рассуждениях" },
        attention: { name: "Ошибки внимательности", desc: "Неверно прочел условие, пропустил вопрос" }
    };
    
    return errorTypes[type] || { name: "Неизвестная ошибка", desc: "" };
}

// Получение цвета для типа ошибки
function getErrorColor(type) {
    const colorMap = {
        factual: "#e74c3c",
        conceptual: "#9b59b6",
        application: "#3498db",
        calculation: "#f39c12",
        logical: "#d35400",
        attention: "#16a085"
    };
    
    return colorMap[type] || "#7f8c8d";
}

// Загрузка истории тренировок
function loadTrainingHistory() {
    const historyList = document.getElementById('trainingHistoryList');
    const trainingHistory = JSON.parse(localStorage.getItem('trainingHistory') || '[]');
    
    if (trainingHistory.length === 0) {
        return; // Оставляем пустой блок
    }
    
    const historyHTML = trainingHistory.map((session, index) => `
        <div class="history-item" style="padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h6 style="margin: 0; color: #2c3e50;">${session.type}</h6>
                <p style="margin: 5px 0; color: #7f8c8d; font-size: 12px;">
                    ${new Date(session.date).toLocaleDateString()} | 
                    Правильно: ${session.correct}/${session.total} | 
                    Время: ${session.time} сек
                </p>
            </div>
            <div>
                <span class="badge" style="background: ${session.score > 80 ? '#27ae60' : session.score > 60 ? '#f39c12' : '#e74c3c'}; color: white; padding: 3px 10px; border-radius: 10px;">
                    ${session.score}%
                </span>
            </div>
        </div>
    `).join('');
    
    historyList.innerHTML = historyHTML;
}

// Функции запуска тренировок
function startAdaptiveTraining() {
    showNotification('Запускаем адаптивную тренировку...', 'info');
    // Здесь будет логика запуска адаптивных тренировок
}

function startGameTraining() {
    showNotification('Запускаем игровую тренировку...', 'info');
    // Здесь будет логика игровых тренировок
}

function startVisualTraining() {
    showNotification('Запускаем визуальную тренировку...', 'info');
    // Здесь будет логика визуальных симуляторов
}

function startSpecificTraining(errorType) {
    showNotification(`Запускаем тренировку по ошибкам типа: ${errorType}`, 'info');
    // Здесь будет логика специфических тренировок
}

function showErrorExamples(errorType) {
    const errorInfo = getErrorInfo(errorType);
    showModal(`
        <h3>Примеры ошибок: ${errorInfo.name}</h3>
        <p>${errorInfo.desc}</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h5>Типичные примеры:</h5>
            <ul>
                <li>Пример 1: Неверное применение формулы</li>
                <li>Пример 2: Ошибка в расчетах</li>
                <li>Пример 3: Неправильная интерпретация условия</li>
            </ul>
        </div>
        <button class="btn btn-primary" onclick="startSpecificTraining('${errorType}')">
            Начать тренировку по этим ошибкам
        </button>
    `);
}

function clearTrainingHistory() {
    if (confirm('Вы уверены, что хотите очистить историю тренировок?')) {
        localStorage.removeItem('trainingHistory');
        loadTrainingHistory();
        showNotification('История тренировок очищена', 'success');
    }
}

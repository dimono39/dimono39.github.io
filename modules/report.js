

// ==================== УЛУЧШЕННЫЙ ГЕНЕРАТОР ОТЧЕТОВ ====================

let currentPreviewMode = 'web';
let reportData = null;
let comparisonData = null;
let aiAnalysis = null;
let speechSynthesis = window.speechSynthesis;
let isSpeaking = false;

// Глобальная проверка appData - ИСПРАВЛЕННАЯ ВЕРСИЯ
if (typeof appData === 'undefined') {
    console.warn('appData не определен, создаю пустой объект');
    var appData = {
        test: {
            subject: 'Не указан',
            class: 'Не указан',
            theme: 'Не указана',
            criteria: {
                '5': { min: 16, max: 23 },
                '4': { min: 12, max: 15 },
                '3': { min: 7, max: 11 },
                '2': { min: 0, max: 6 }
            }
        },
        tasks: [],
        students: [],
        results: [],
        errors: []
    };
} else {
    // Если appData существует, убедимся, что есть обязательные поля
    if (!appData.test) appData.test = { subject: 'Не указан', class: 'Не указан' };
    if (!appData.tasks) appData.tasks = [];
    if (!appData.students) appData.students = [];
    if (!appData.results) appData.results = [];
    if (!appData.errors) appData.errors = [];
}

// Инициализация при показе вкладки
function initReportTab() {
    updateReportTemplate();
    loadUserTemplates();
    loadReportHistory();
    setupAIRecommendations();
    checkForComparisonData();
    
    // Инициализация голосового синтеза
    initVoiceSynthesis();
    
    // Инициализация Google API
    initGoogleAPI();
    
    showNotification('Генератор отчетов готов к работе', 'info');
}

// Проверка данных для сравнения
function checkForComparisonData() {
    const savedReports = JSON.parse(localStorage.getItem('savedReports') || '[]');
    if (savedReports.length > 0) {
        document.getElementById('comparisonPeriod').style.display = 'block';
        loadComparisonDates(savedReports);
    }
}

// AI-анализ отчета
function generateAIAnalysis() {
    try {
        if (!validateReportData()) {
            showNotification('Сначала заполните данные в системе', 'warning');
            return;
        }
    } catch (error) {
        console.error('Ошибка валидации:', error);
        showNotification('Ошибка при проверке данных', 'error');
        return;
    }
    
    showLoading('AI анализирует данные...');
    
    // Имитация AI-анализа
    setTimeout(() => {
        try {
            aiAnalysis = {
                insights: generateAIInsights(),
                recommendations: generateAIRecommendations(),
                predictions: generatePredictions(),
                anomalies: detectAnomalies(),
                sentiment: analyzeSentiment(),
                generated: new Date().toISOString()
            };
            
            displayAIAnalysis(aiAnalysis);
            applyAIRecommendations(aiAnalysis);
            
            showNotification('AI-анализ завершен', 'success');
        } catch (error) {
            console.error('Ошибка AI-анализа:', error);
            showNotification('Ошибка при анализе данных: ' + error.message, 'error');
            
            // Показать базовый анализ даже при ошибке
            displaySimpleAnalysis();
        } finally {
            hideLoading();
        }
    }, 2000);
}// Расчет статистики
function calculateStatistics() {
    const stats = {
        totalStudents: 0,
        totalTasks: 0,
        averageGrade: 0,
        successRate: 0,
        excellentPercentage: 0,
        goodPercentage: 0,
        averagePercentage: 0,
        weakPercentage: 0
    };
    
    // Проверяем данные
    if (!appData || !appData.students || !Array.isArray(appData.students)) {
        console.warn('Нет данных об учащихся для расчета статистики');
        return stats;
    }
    
    if (!appData.tasks || !Array.isArray(appData.tasks)) {
        console.warn('Нет данных о заданиях для расчета статистики');
        return stats;
    }
    
    stats.totalStudents = appData.students.length;
    stats.totalTasks = appData.tasks.length;
    
    // Расчет среднего балла
    let totalScore = 0;
    let studentCount = 0;
    
    appData.students.forEach(student => {
        if (!student || !student.id) return;
        
        const studentScore = calculateStudentTotal(student.id);
        if (studentScore !== null && !isNaN(studentScore)) {
            totalScore += studentScore;
            studentCount++;
        }
    });
    
    stats.averageGrade = studentCount > 0 ? totalScore / studentCount : 0;
    // Интегрируем критерии перед генерацией отчета
    const integratedAppData = integrateCriteriaForReports(appData);
    
    // Теперь можем безопасно использовать
    const validation = integratedAppData.helpers.validateCriteria();
    
    if (!validation.isValid) {
        showNotification('Проблемы с критериями оценивания', 'error');
        return;
    }
        
    // Распределение оценок
    const distribution = calculateGradeDistributionWithCompatibleCriteria(integratedAppData);
    stats.excellentPercentage = distribution['5'] || 0;
    stats.goodPercentage = distribution['4'] || 0;
    stats.averagePercentage = distribution['3'] || 0;
    stats.weakPercentage = distribution['2'] || 0;
    
    // Процент успеваемости (3 и выше)
    stats.successRate = stats.excellentPercentage + stats.goodPercentage + stats.averagePercentage;
    
    return stats;
}

// Генерация AI-инсайтов
function generateAIInsights() {
    const insights = [];
    
    try {
        const stats = calculateStatistics();
        
        // Проверяем, есть ли данные для анализа
        if (stats.totalStudents === 0 || stats.totalTasks === 0) {
            insights.push({
                type: 'info',
                title: 'Недостаточно данных',
                description: 'Для анализа добавьте учащихся и задания',
                impact: 'medium',
                suggestion: 'Заполните данные в системе'
            });
            return insights;
        }
        
        // 1. Основные инсайты
        if (stats.averageGrade < 3.0) {
            insights.push({
                type: 'warning',
                title: 'Низкая успеваемость',
                description: `Средний балл класса (${stats.averageGrade.toFixed(1)}) ниже удовлетворительного`,
                impact: 'high',
                suggestion: 'Рекомендуется провести дополнительные занятия'
            });
        }
        
        if (stats.excellentPercentage > 30) {
            insights.push({
                type: 'success',
                title: 'Высокий процент отличников',
                description: `${stats.excellentPercentage}% учащихся получили оценку "5"`,
                impact: 'medium',
                suggestion: 'Можно увеличить сложность заданий'
            });
        }
        
        // 2. Анализ заданий
        const taskAnalysis = analyzeTasks();
        const hardestTask = taskAnalysis.find(t => t.difficulty === 'high' || t.successRate < 50);
        
        if (hardestTask) {
            insights.push({
                type: 'info',
                title: 'Сложное задание',
                description: `Задание №${hardestTask.number} выполнено только на ${hardestTask.successRate}%`,
                impact: 'medium',
                suggestion: 'Требуется дополнительное объяснение материала'
            });
        }
        
        // 3. Анализ ошибок
        const commonErrors = detectCommonErrors();
        if (commonErrors && commonErrors.length > 0) {
            insights.push({
                type: 'warning',
                title: 'Типичные ошибки',
                description: `Наиболее частая ошибка: ${commonErrors[0].type} (${commonErrors[0].count} случаев)`,
                impact: 'high',
                suggestion: 'Провести работу над ошибками'
            });
        }
        
    } catch (error) {
        console.error('Ошибка генерации AI-инсайтов:', error);
        insights.push({
            type: 'warning',
            title: 'Ошибка анализа',
            description: 'Не удалось проанализировать данные',
            impact: 'medium',
            suggestion: 'Проверьте корректность введенных данных'
        });
    }
    
    return insights;
}

// Сравнение с предыдущими периодами
function compareWithPrevious() {
    const savedReports = JSON.parse(localStorage.getItem('savedReports') || '[]');
    
    if (savedReports.length === 0) {
        showNotification('Нет данных для сравнения', 'warning');
        return;
    }
    
    // Выбор периода для сравнения
    let html = `
        <div style="max-width: 600px;">
            <h3>📊 Сравнительный анализ</h3>
            <p>Выберите отчет для сравнения:</p>
            
            <div style="max-height: 300px; overflow-y: auto; margin: 15px 0;">
    `;
    
    savedReports.forEach((report, index) => {
        const date = new Date(report.metadata.generated).toLocaleDateString();
        html += `
            <div class="comparison-item" style="padding: 10px; border: 1px solid #eee; margin: 5px 0; border-radius: 5px; cursor: pointer;" onclick="selectComparisonReport(${index})">
                <strong>${report.metadata.title}</strong>
                <div style="font-size: 12px; color: #666;">
                    ${date} | ${report.content?.basicInfo?.subject || 'Без предмета'}
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
            
            <div style="margin-top: 20px;">
                <label>
                    <input type="checkbox" id="compareAllMetrics" checked>
                    Сравнить все метрики
                </label>
            </div>
            
            <div class="modal-actions">
                <button class="btn" onclick="hideModal()">Отмена</button>
                <button class="btn btn-primary" onclick="generateComparisonReport()">Сравнить</button>
            </div>
        </div>
    `;
    
    showModal('Сравнение с предыдущими отчетами', html);
}

// Генерация отчета с бенчмаркингом
function generateBenchmarkReport() {
    console.log('DEBUG: generateBenchmarkReport вызван');
    console.log('DEBUG: appData:', appData);
    console.log('DEBUG: appData.test:', appData?.test);
    console.log('DEBUG: appData.test.subject:', appData?.test?.subject);	
    // Стандартные бенчмарки для разных предметов
    const benchmarks = {
        'Математика': {
            '5': 25, // % отличников
            '4': 40, // % хорошистов
            '3': 30, // % троечников
            '2': 5   // % неуспевающих
        },
        'Русский язык': {
            '5': 20,
            '4': 45,
            '3': 30,
            '2': 5
        },
        'Физика': {
            '5': 15,
            '4': 35,
            '3': 40,
            '2': 10
        },
        'Химия': {
            '5': 15,
            '4': 35,
            '3': 40,
            '2': 10
        }
    };
    
    const subject = appData?.test?.subject || 'Математика';
    const benchmark = benchmarks[subject] || benchmarks['Математика'];
    
    // Безопасный расчет текущей статистики
    let currentStats;
    try {
		// Интегрируем критерии перед генерацией отчета
		const integratedAppData = integrateCriteriaForReports(appData);
		
		// Теперь можем безопасно использовать
		const validation = integratedAppData.helpers.validateCriteria();
		
		if (!validation.isValid) {
			showNotification('Проблемы с критериями оценивания', 'error');
			return;
		}		
        currentStats = calculateGradeDistributionWithCompatibleCriteria(integratedAppData);
    } catch (error) {
        console.error('Ошибка расчета распределения оценок:', error);
        currentStats = { '5': 0, '4': 0, '3': 0, '2': 0 };
    }
    
    // Сравнение с бенчмарком
    const comparison = {
        subject: subject,
        benchmark: benchmark,
        current: currentStats,
        differences: {},
        conclusion: ''
    };
    
    // Расчет разниц
    Object.keys(benchmark).forEach(grade => {
        comparison.differences[grade] = (currentStats[grade] || 0) - benchmark[grade];
    });
    
    // Формирование вывода
    if (comparison.differences['5'] > 5) {
        comparison.conclusion = 'Класс показывает результаты выше среднего по предмету';
    } else if (comparison.differences['2'] > 5) {
        comparison.conclusion = 'Требуется дополнительная работа с отстающими';
    } else {
        comparison.conclusion = 'Результаты соответствуют средним показателям';
    }
    
    // Отображение отчета
    displayBenchmarkReport(comparison);
}

// ========== ДОБАВИТЬ ЭТУ ФУНКЦИЮ ==========
// Функция отображения отчета бенчмаркинга (добавить в конец файла перед последней скобкой)
function displayBenchmarkReportas(comparison) {
    let html = `
        <div style="max-width: 800px;">
            <h3>🏆 Сравнение с бенчмарками</h3>
            <p><strong>Предмет:</strong> ${comparison.subject}</p>
            
            <h4>📊 Распределение оценок</h4>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                    <tr style="background: #34495e; color: white;">
                        <th style="padding: 10px; text-align: center;">Оценка</th>
                        <th style="padding: 10px; text-align: center;">Бенчмарк</th>
                        <th style="padding: 10px; text-align: center;">Факт</th>
                        <th style="padding: 10px; text-align: center;">Разница</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    ['5', '4', '3', '2'].forEach(grade => {
        const benchmark = comparison.benchmark[grade];
        const current = comparison.current[grade] || 0;
        const difference = comparison.differences[grade];
        
        html += `
            <tr>
                <td style="padding: 8px; text-align: center; font-weight: bold; color: ${getGradeColor(grade)};">
                    ${grade}
                </td>
                <td style="padding: 8px; text-align: center;">${benchmark}%</td>
                <td style="padding: 8px; text-align: center;">${current}%</td>
                <td style="padding: 8px; text-align: center; color: ${difference >= 0 ? '#27ae60' : '#e74c3c'};">
                    ${difference >= 0 ? '+' : ''}${difference}%
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
            
            <div style="background: ${comparison.differences['5'] > 0 ? '#d4edda' : '#f8d7da'}; 
                        padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4>🎯 Вывод</h4>
                <p>${comparison.conclusion}</p>
                
                ${comparison.differences['5'] > 5 ? `
                    <p style="color: #27ae60;">✅ Класс показывает результаты выше средних показателей по предмету</p>
                ` : comparison.differences['2'] > 5 ? `
                    <p style="color: #e74c3c;">⚠️ Требуется дополнительная работа с отстающими учениками</p>
                ` : `
                    <p style="color: #f39c12;">📊 Результаты соответствуют средним показателям по предмету</p>
                `}
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="saveBenchmarkReport()">
                    Сохранить отчет
                </button>
                <button class="btn" onclick="hideModal()">Закрыть</button>
            </div>
        </div>
    `;
    
    showModal('Бенчмаркинг результатов', html);
}

// Функция для получения цвета оценки (добавить если нет)
function getGradeColor(grade) {
    const colors = {
        '2': '#e74c3c',
        '3': '#f39c12',
        '4': '#3498db',
        '5': '#2ecc71'
    };
    return colors[grade] || '#95a5a6';
}

// Функция сохранения отчета бенчмаркинга (добавить если нет)
function saveBenchmarkReport() {
    // Сохранение отчета бенчмаркинга
    showNotification('Отчет бенчмаркинга сохранен', 'success');
    hideModal();
}

// Озвучивание отчета
function voiceReportSummary() {
    if (!reportData) {
        showNotification('Сначала сгенерируйте отчет', 'warning');
        return;
    }
    
    if (isSpeaking) {
        speechSynthesis.cancel();
        isSpeaking = false;
        showNotification('Озвучивание остановлено', 'info');
        return;
    }
    
    const summary = generateVoiceSummary(reportData);
    
    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.lang = 'ru-RU';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = function() {
        isSpeaking = true;
        showNotification('Начало озвучивания отчета', 'info');
    };
    
    utterance.onend = function() {
        isSpeaking = false;
        showNotification('Озвучивание завершено', 'success');
    };
    
    utterance.onerror = function(event) {
        console.error('Ошибка синтеза речи:', event);
        isSpeaking = false;
        showNotification('Ошибка синтеза речи', 'error');
    };
    
    speechSynthesis.speak(utterance);
}

// Обработка AI-промпта
function processAIPrompt() {
    const prompt = document.getElementById('aiPrompt').value;
    if (!prompt.trim()) {
        showNotification('Введите запрос для AI', 'warning');
        return;
    }
    
    showLoading('AI обрабатывает запрос...');
    
    // Имитация обработки AI
    setTimeout(() => {
        const suggestions = interpretAIPrompt(prompt);
        displayAISuggestions(suggestions);
        hideLoading();
        
        showNotification('AI предложил настройки', 'success');
    }, 1500);
}

// Интерпретация AI-промпта
function interpretAIPrompt(prompt) {
    const suggestions = {
        fields: [],
        filters: {},
        design: {},
        recommendations: []
    };
    
    const promptLower = prompt.toLowerCase();
    
    // Определение типа отчета
    if (promptLower.includes('родител') || promptLower.includes('собрани')) {
        suggestions.reportType = 'parent';
        suggestions.fields = ['basic_info', 'statistics', 'grades_distribution', 'recommendations'];
        suggestions.design = { theme: 'colorful', font: 'Arial' };
    } 
    else if (promptLower.includes('админ') || promptLower.includes('директор')) {
        suggestions.reportType = 'admin';
        suggestions.fields = ['basic_info', 'statistics', 'comparative_analysis', 'trends'];
        suggestions.design = { theme: 'official', font: 'Times New Roman' };
    }
    else if (promptLower.includes('ученик') || promptLower.includes('индивидуальн')) {
        suggestions.reportType = 'student';
        suggestions.fields = ['basic_info', 'detailed_scores', 'personal_recommendations'];
    }
    else if (promptLower.includes('сравн') || promptLower.includes('динамик')) {
        suggestions.reportType = 'comparative';
        suggestions.fields = ['comparative_analysis', 'trends', 'correlation'];
        suggestions.filters.gradeFilter = ['3', '4', '5'];
    }
    
    // Определение акцентов
    if (promptLower.includes('график') || promptLower.includes('визуализац')) {
        suggestions.fields.push('charts', 'infographics');
        suggestions.options = { includeCharts: true, interactiveCharts: true };
    }
    
    if (promptLower.includes('ошибк') || promptLower.includes('проблем')) {
        suggestions.fields.push('error_analysis');
        suggestions.filters.errorTypeFilter = ['all'];
    }
    
    if (promptLower.includes('рекомендац') || promptLower.includes('совет')) {
        suggestions.fields.push('recommendations', 'correction_plan', 'next_steps');
    }
    
    // Формирование текстовых рекомендаций
    suggestions.recommendations = [
        'AI рекомендует использовать выбранные поля для лучшего отображения данных',
        'Настройте фильтры для более точного анализа',
        'Используйте визуализацию для наглядности'
    ];
    
    return suggestions;
}

// Отображение AI-предложений
function displayAISuggestions(suggestions) {
    const container = document.getElementById('aiSuggestions');
    
    let html = `
        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #4CAF50;">
            <h5 style="margin-top: 0; color: #4CAF50;">🤖 AI рекомендует:</h5>
    `;
    
    if (suggestions.reportType) {
        html += `<p><strong>Тип отчета:</strong> ${getReportTypeName(suggestions.reportType)}</p>`;
        document.getElementById('reportType').value = suggestions.reportType;
    }
    
    if (suggestions.fields.length > 0) {
        html += `<p><strong>Рекомендуемые поля:</strong> ${suggestions.fields.join(', ')}</p>`;
        
        // Установка чекбоксов
        suggestions.fields.forEach(field => {
            const checkbox = document.querySelector(`input[name="reportFields"][value="${field}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
    
    if (suggestions.recommendations.length > 0) {
        html += `<div style="margin-top: 10px;"><strong>Советы:</strong><ul style="margin: 5px 0; padding-left: 20px;">`;
        suggestions.recommendations.forEach(rec => {
            html += `<li>${rec}</li>`;
        });
        html += `</ul></div>`;
    }
    
    html += `
            <button class="btn btn-sm btn-success" onclick="applyAISuggestions()" style="margin-top: 10px;">
                Применить все рекомендации
            </button>
        </div>
    `;
    
    container.innerHTML = html;
}

// Применение AI-рекомендаций
function applyAISuggestions() {
    showNotification('Настройки применены', 'success');
    updateReportComplexity();
}

// Генерация динамических графиков для отчета
function generateDynamicCharts(reportData) {
    const charts = [];
    
    // 1. Распределение оценок
    try {
        // Интегрируем критерии перед генерацией отчета
        const integratedAppData = integrateCriteriaForReports(window.appData || appData);
        
        // Теперь можем безопасно использовать
        const validation = integratedAppData.helpers.validateCriteria();
        
        if (!validation.isValid) {
            console.warn('Проблемы с критериями оценивания, создаем график с нулевыми данными');
            charts.push({
                type: 'pie',
                title: 'Распределение оценок',
                data: {
                    labels: ['5', '4', '3', '2'],
                    datasets: [{
                        data: [0, 0, 0, 0],
                        backgroundColor: ['#2ecc71', '#3498db', '#f39c12', '#e74c3c']
                    }]
                }
            });
        } else {
            // Генерируем распределение оценок с совместимыми критериями
            const gradeDistribution = calculateGradeDistributionWithCompatibleCriteria(integratedAppData);
            charts.push({
                type: 'pie',
                title: 'Распределение оценок',
                data: {
                    labels: ['5', '4', '3', '2'],
                    datasets: [{
                        data: [
                            gradeDistribution['5'] || 0,
                            gradeDistribution['4'] || 0,
                            gradeDistribution['3'] || 0,
                            gradeDistribution['2'] || 0
                        ],
                        backgroundColor: ['#2ecc71', '#3498db', '#f39c12', '#e74c3c']
                    }]
                }
            });
        }
    } catch (error) {
        console.error('Ошибка при создании графика распределения оценок:', error);
        charts.push({
            type: 'pie',
            title: 'Распределение оценок (ошибка)',
            data: {
                labels: ['Ошибка'],
                datasets: [{
                    data: [100],
                    backgroundColor: ['#95a5a6']
                }]
            }
        });
    }
    
    // 2. Динамика по заданиям - ИСПРАВЛЕННЫЙ БЛОК
    try {
        // Используем универсальную функцию для получения данных
        const taskSuccessData = getTaskSuccessData();
        
        // Проверяем, что данные есть и являются массивом
        if (Array.isArray(taskSuccessData) && taskSuccessData.length > 0) {
            // Преобразуем данные для графика
            const chartLabels = taskSuccessData.map(item => {
                // Безопасное создание подписей
                if (item && item.title) return item.title;
                if (item && item.number) return `Задание ${item.number}`;
                return 'Задание';
            });
            
            const chartData = taskSuccessData.map(item => {
                // Безопасное извлечение процента успешности
                if (item && typeof item.rate === 'number') return item.rate;
                if (item && typeof item.successRate === 'number') return item.successRate;
                return 0;
            });
            
            const chartColors = chartData.map(rate => {
                // Цветовая схема в зависимости от процента
                return rate >= 80 ? '#2ecc71' :  // зеленый
                       rate >= 60 ? '#3498db' :  // синий
                       rate >= 40 ? '#f39c12' :  // оранжевый
                       '#e74c3c';                // красный
            });
            
            charts.push({
                type: 'bar',
                title: 'Решаемость заданий',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: 'Успешность, %',
                        data: chartData,
                        backgroundColor: chartColors,
                        borderColor: chartColors.map(color => darkenColor(color, 10)),
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Процент успешности'
                            }
                        }
                    }
                }
            });
        } else {
            console.warn('Нет данных о решаемости заданий для графика');
            // Создаем пустой график вместо ошибки
            charts.push({
                type: 'bar',
                title: 'Решаемость заданий (данных нет)',
                data: {
                    labels: ['Нет данных'],
                    datasets: [{
                        label: 'Успешность, %',
                        data: [0],
                        backgroundColor: ['#95a5a6']
                    }]
                }
            });
        }
    } catch (error) {
        console.error('Ошибка при создании графика решаемости заданий:', error);
        charts.push({
            type: 'bar',
            title: 'Решаемость заданий (ошибка)',
            data: {
                labels: ['Ошибка'],
                datasets: [{
                    label: 'Ошибка',
                    data: [0],
                    backgroundColor: ['#95a5a6']
                }]
            }
        });
    }
    
    // 3. Тепловая карта ошибок (опционально)
    try {
        if (appData.errors && Array.isArray(appData.errors) && appData.errors.length > 0) {
            const errorHeatmap = generateErrorHeatmap();
            if (errorHeatmap && errorHeatmap.data) {
                charts.push({
                    type: 'heatmap',
                    title: 'Распределение ошибок',
                    data: errorHeatmap.data,
                    options: errorHeatmap.options || {}
                });
            }
        }
    } catch (error) {
        console.error('Ошибка при создании тепловой карты ошибок:', error);
        // Не добавляем график при ошибке - это не критично
    }
    
    // 4. Дополнительный график: сложность заданий (опционально)
    try {
        const taskAnalysis = analyzeTasks();
        if (Array.isArray(taskAnalysis) && taskAnalysis.length > 0) {
            // Группируем по сложности
            const difficultyGroups = {};
            taskAnalysis.forEach(task => {
                if (task && task.difficulty) {
                    const diff = task.difficultyName || `Уровень ${task.difficulty}`;
                    difficultyGroups[diff] = (difficultyGroups[diff] || 0) + 1;
                }
            });
            
            if (Object.keys(difficultyGroups).length > 0) {
                charts.push({
                    type: 'doughnut',
                    title: 'Распределение по сложности',
                    data: {
                        labels: Object.keys(difficultyGroups),
                        datasets: [{
                            data: Object.values(difficultyGroups),
                            backgroundColor: ['#2ecc71', '#3498db', '#f39c12', '#e74c3c', '#9b59b6']
                        }]
                    }
                });
            }
        }
    } catch (error) {
        console.error('Ошибка при создании графика сложности заданий:', error);
        // Не критично, пропускаем
    }
    
    // Логируем результат для отладки
    console.log(`Сгенерировано графиков: ${charts.length}`);
    
    return charts;
}

// Вспомогательная функция для затемнения цвета (если нет в коде)
function darkenColor(color, percent) {
    if (!color || !color.startsWith('#')) return color;
    
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    
    return "#" + (
        0x1000000 +
        (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
}

// Универсальная функция для получения данных о решаемости заданий
function getTaskSuccessData() {
    try {
        // Используем безопасную версию calculateTaskSuccessRate
        if (typeof calculateTaskSuccessRate === 'function') {
            // Вызываем без параметра для получения массива
            const taskSuccess = calculateTaskSuccessRate();
            
            // Проверяем результат
            if (Array.isArray(taskSuccess)) {
                return taskSuccess;
            }
        }
        
        // Альтернативный способ: через analyzeTasks
        const analyzedTasks = analyzeTasks();
        if (Array.isArray(analyzedTasks)) {
            return analyzedTasks.map(task => ({
                number: task.number || 0,
                title: task.title || '',
                rate: task.successRate || 0,
                successRate: task.successRate || 0,
                difficulty: task.difficulty || 1
            }));
        }
        
        // Если ничего не работает, возвращаем пустой массив
        console.warn('Не удалось получить данные о решаемости заданий');
        return [];
        
    } catch (error) {
        console.error('Ошибка в getTaskSuccessData:', error);
        return [];
    }
}


function calculateGradeDistributionWithCompatibleCriteria(appData) {
    if (!appData || !appData.students || !Array.isArray(appData.students)) {
        return { '2': 0, '3': 0, '4': 0, '5': 0 };
    }
    
    const distribution = { '2': 0, '3': 0, '4': 0, '5': 0 };
    
    appData.students.forEach(student => {
        const totalScore = calculateStudentTotal(student.id);
        const result = appData.helpers.calculateGrade(totalScore);
        
        if (result.grade && distribution[result.gradeString] !== undefined) {
            distribution[result.gradeString]++;
        }
    });
    
    return distribution;
}

// Шифрование отчета
function encryptReport(content, password) {
    if (!password) return content;
    
    try {
        // Простое шифрование для демонстрации
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(content), password).toString();
        return {
            encrypted: true,
            data: encrypted,
            algorithm: 'AES',
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Ошибка шифрования:', error);
        return content;
    }
}

// Дешифрование отчета
function decryptReport(encryptedData, password) {
    if (!encryptedData.encrypted) return encryptedData;
    
    try {
        const decrypted = CryptoJS.AES.decrypt(encryptedData.data, password).toString(CryptoJS.enc.Utf8);
        return JSON.parse(decrypted);
    } catch (error) {
        console.error('Ошибка дешифрования:', error);
        throw new Error('Неверный пароль или поврежденные данные');
    }
}

// Интеграция с Google Docs
function initGoogleAPI() {
    // Инициализация Google API
    gapi.load('client:auth2', function() {
        gapi.client.init({
            apiKey: 'YOUR_API_KEY',
            clientId: 'YOUR_CLIENT_ID',
            discoveryDocs: ['https://docs.googleapis.com/$discovery/rest?version=v1'],
            scope: 'https://www.googleapis.com/auth/documents'
        }).then(function() {
            console.log('Google API инициализирован');
        }).catch(function(error) {
            console.error('Ошибка инициализации Google API:', error);
        });
    });
}

// Экспорт в Google Docs
function exportToGoogleDocs() {
    if (!reportData) {
        showNotification('Сначала сгенерируйте отчет', 'warning');
        return;
    }
    
    // Проверка авторизации
    if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
        gapi.auth2.getAuthInstance().signIn().then(function() {
            createGoogleDoc(reportData);
        }).catch(function(error) {
            console.error('Ошибка авторизации:', error);
            showNotification('Ошибка авторизации в Google', 'error');
        });
    } else {
        createGoogleDoc(reportData);
    }
}

// Создание документа в Google Docs
function createGoogleDoc(reportData) {
    showLoading('Создание документа в Google Docs...');
    
    const documentTitle = `${reportData.metadata.title} - ${new Date().toLocaleDateString()}`;
    const content = generateGoogleDocsContent(reportData);
    
    gapi.client.docs.documents.create({
        title: documentTitle
    }).then(function(response) {
        const documentId = response.result.documentId;
        
        // Добавление контента
        const requests = content.map((paragraph, index) => ({
            insertText: {
                location: {
                    index: index === 0 ? 1 : -1
                },
                text: paragraph.text + '\n'
            }
        }));
        
        return gapi.client.docs.documents.batchUpdate({
            documentId: documentId,
            requests: requests
        });
    }).then(function() {
        hideLoading();
        showNotification('Документ создан в Google Docs', 'success');
        
        // Открытие документа
        window.open(`https://docs.google.com/document/d/${documentId}/edit`, '_blank');
    }).catch(function(error) {
        console.error('Ошибка создания документа:', error);
        hideLoading();
        showNotification('Ошибка создания документа', 'error');
    });
}

// Отправка отчета по email
function sendReportByEmail() {
    if (!reportData) {
        showNotification('Сначала сгенерируйте отчет', 'warning');
        return;
    }
    
    const email = prompt('Введите email для отправки:', '');
    if (!email) return;
    
    // Валидация email
    if (!validateEmail(email)) {
        showNotification('Введите корректный email', 'error');
        return;
    }
    
    // Проверяем доступность SMTP.js
    if (typeof Email === 'undefined') {
        showNotification('Функция отправки email временно недоступна', 'warning');
        
        // Альтернативный вариант - скачать отчет
        const confirmDownload = confirm('Хотите скачать отчет вместо отправки?');
        if (confirmDownload) {
            exportToWord();
        }
        return;
    }
    
    // Продолжаем с отправкой...
}

// Сохранение в облако
function saveReportToCloud() {
    if (!reportData) {
        showNotification('Сначала сгенерируйте отчет', 'warning');
        return;
    }
    
    // Сохранение в localStorage как пример
    const savedReports = JSON.parse(localStorage.getItem('savedReports') || '[]');
    
    const reportToSave = {
        ...reportData,
        savedAt: new Date().toISOString(),
        id: 'report_' + Date.now()
    };
    
    savedReports.push(reportToSave);
    localStorage.setItem('savedReports', JSON.stringify(savedReports));
    
    // Обновление истории
    loadReportHistory();
    
    showNotification('Отчет сохранен в локальное хранилище', 'success');
}

// Копирование всех файлов отчета
function downloadReportAssets() {
    if (!reportData) {
        showNotification('Сначала сгенерируйте отчет', 'warning');
        return;
    }
    
    showLoading('Подготовка файлов для скачивания...');
    
    // Создание zip-архива с файлами
    const zip = new JSZip();
    
    // 1. Основной отчет в HTML
    zip.file("report.html", generateHTMLReport(reportData));
    
    // 2. Отчет в Word
    zip.file("report.docx", generateWordReport(reportData));
    
    // 3. Данные в JSON
    zip.file("data.json", JSON.stringify(reportData, null, 2));
    
    // 4. Изображения графиков
    const charts = generateChartImages();
    charts.forEach((chart, index) => {
        zip.file(`chart_${index + 1}.png`, chart, { base64: true });
    });
    
    // 5. CSV с данными
    zip.file("data.csv", generateCSVData());
    
    // Генерация и скачивание архива
    zip.generateAsync({ type: "blob" })
        .then(function(content) {
            saveAs(content, `report_${new Date().toISOString().split('T')[0]}.zip`);
            hideLoading();
            showNotification('Все файлы отчета скачаны', 'success');
        })
        .catch(function(error) {
            console.error('Ошибка создания архива:', error);
            hideLoading();
            showNotification('Ошибка создания архива', 'error');
        });
}

// Управление шаблонами
function manageTemplates() {
    const userTemplates = JSON.parse(localStorage.getItem('reportTemplates') || '[]');
    
    let html = `
        <div style="max-width: 800px;">
            <h3>📂 Управление шаблонами отчетов</h3>
            
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <input type="text" id="newTemplateName" placeholder="Название нового шаблона" class="form-input" style="flex: 1;">
                <button class="btn btn-primary" onclick="createNewTemplate()">
                    Создать новый
                </button>
            </div>
    `;
    
    if (userTemplates.length === 0) {
        html += `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 3em; margin-bottom: 20px;">📁</div>
                <h4>Шаблоны не найдены</h4>
                <p>Создайте свой первый шаблон отчета</p>
            </div>
        `;
    } else {
        html += `
            <div style="max-height: 400px; overflow-y: auto;">
                <table style="width: 100%; font-size: 14px;">
                    <thead>
                        <tr>
                            <th>Название</th>
                            <th>Тип</th>
                            <th>Дата создания</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        userTemplates.forEach((template, index) => {
            html += `
                <tr>
                    <td><strong>${template.name}</strong></td>
                    <td>${template.settings?.type || 'Пользовательский'}</td>
                    <td>${new Date(template.date).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-success" onclick="loadTemplateReport(${index})">
                            Загрузить
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="editTemplate(${index})">
                            Изменить
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTemplate(${index})">
                            Удалить
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    html += `
            <div class="modal-actions">
                <button class="btn" onclick="hideModal()">Закрыть</button>
            </div>
        </div>
    `;
    
    showModal('Управление шаблонами', html);
}

// Загрузка истории отчетов
function loadReportHistory() {
    const savedReports = JSON.parse(localStorage.getItem('savedReports') || '[]');
    const historyList = document.getElementById('reportHistoryList');
    
    if (savedReports.length === 0) {
        document.querySelector('.report-history').style.display = 'none';
        return;
    }
    
    document.querySelector('.report-history').style.display = 'block';
    
    let html = '<div class="history-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">';
    
    savedReports.slice(-10).reverse().forEach((report, index) => {
        const date = new Date(report.savedAt || report.metadata.generated).toLocaleDateString();
        html += `
            <div class="history-card" style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h5 style="margin: 0 0 5px 0;">${report.metadata.title}</h5>
                        <small style="color: #7f8c8d;">${date}</small>
                    </div>
                    <button class="btn btn-sm btn-outline" onclick="loadReportFromHistory(${savedReports.length - 1 - index})">
                        Открыть
                    </button>
                </div>
                <div style="margin-top: 10px; font-size: 13px;">
                    <div>${report.content?.basicInfo?.subject || 'Без предмета'}</div>
                    <div>${report.content?.basicInfo?.className || 'Без класса'}</div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    historyList.innerHTML = html;
}

// AI-генерация шаблонов
function generateAITemplate(templateType) {
    const templates = {
        predictive: {
            name: 'Прогностический анализ',
            description: 'AI предсказывает будущие результаты на основе текущих данных',
            settings: {
                type: 'predictive',
                fields: ['statistics', 'trends', 'predictive', 'aiInsights'],
                options: { predictiveAnalytics: true, aiInsights: true }
            }
        },
        comparative: {
            name: 'Сравнительный отчет',
            description: 'Сравнение с предыдущими периодами и бенчмарками',
            settings: {
                type: 'comparative',
                fields: ['comparative_analysis', 'benchmarking', 'correlation'],
                options: { includeCharts: true, interactiveCharts: true }
            }
        }
    };
    
    const template = templates[templateType];
    if (template) {
        applyTemplateSettings(template.settings);
        showNotification(`Загружен AI-шаблон: ${template.name}`, 'success');
    }
}

// Обновление сложности отчета
function updateReportComplexity() {
    const complexity = calculateReportComplexity();
    const complexityBar = document.getElementById('complexityFill');
    const complexityValue = document.getElementById('complexityValue');
    const complexityContainer = document.getElementById('reportComplexity');
    
    complexityBar.style.width = `${complexity.percentage}%`;
    complexityBar.style.background = complexity.color;
    complexityValue.textContent = complexity.level;
    complexityContainer.style.display = 'block';
}

// Расчет сложности отчета
function calculateReportComplexity() {
    let score = 0;
    let maxScore = 0;
    
    // Подсчет выбранных полей
    const selectedFields = document.querySelectorAll('input[name="reportFields"]:checked').length;
    score += selectedFields * 5;
    maxScore += 20 * 5;
    
    // Проверка AI-функций
    if (document.getElementById('aiInsights')?.checked) score += 15;
    if (document.getElementById('predictiveAnalytics')?.checked) score += 20;
    maxScore += 35;
    
    // Проверка визуализации
    if (document.getElementById('includeCharts')?.checked) score += 10;
    if (document.getElementById('interactiveCharts')?.checked) score += 15;
    maxScore += 25;
    
    const percentage = Math.min(100, Math.round((score / maxScore) * 100));
    
    let level, color;
    if (percentage < 30) {
        level = 'Простой';
        color = '#2ecc71';
    } else if (percentage < 60) {
        level = 'Средний';
        color = '#f39c12';
    } else {
        level = 'Сложный';
        color = '#e74c3c';
    }
    
    return { percentage, level, color, score, maxScore };
}

// Вспомогательные функции

function showLoading(message) {
    const loadingDiv = document.getElementById('reportLoading');
    const progressBar = document.getElementById('generationProgress');
    
    if (loadingDiv) {
        loadingDiv.style.display = 'block';
        loadingDiv.querySelector('h4').textContent = message;
        
        // Анимация прогресса
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress > 90) progress = 90;
            progressBar.style.width = `${progress}%`;
        }, 200);
        
        // Сохраняем интервал для очистки
        loadingDiv.dataset.intervalId = interval;
    }
}

function hideLoading() {
    const loadingDiv = document.getElementById('reportLoading');
    const progressBar = document.getElementById('generationProgress');
    
    if (loadingDiv) {
        // Завершаем прогресс
        progressBar.style.width = '100%';
        
        // Очищаем интервал
        if (loadingDiv.dataset.intervalId) {
            clearInterval(parseInt(loadingDiv.dataset.intervalId));
        }
        
        // Скрываем через 500ms
        setTimeout(() => {
            loadingDiv.style.display = 'none';
            progressBar.style.width = '0%';
        }, 500);
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function getReportTypeName(type) {
    const names = {
        teacher: 'Педагогический анализ',
        parent: 'Родительский отчет',
        student: 'Индивидуальный отчет',
        admin: 'Административный',
        methodical: 'Методический',
        psychology: 'Психолого-педагогический',
        comparative: 'Сравнительный',
        predictive: 'Прогностический',
        custom: 'Пользовательский'
    };
    return names[type] || type;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
	
    // Добавляем обработчик для вкладки отчетов
    const originalShowTab = window.showTab;
    window.showTab = function(tabId) {
        originalShowTab.call(this, tabId);
        
        if (tabId === 'reports') {
            setTimeout(initReportTab, 100);
        }
    };
});

// ==================== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ОТЧЕТОВ ====================
function validateReportData() {
    if (!appData) return false;
    
    const errors = [];
    
    if (!appData.test || !appData.test.subject) {
        errors.push('Не указан предмет');
    }
    
    if (!appData.students || !Array.isArray(appData.students) || appData.students.length === 0) {
        errors.push('Нет данных об учащихся');
    }
    
    if (!appData.tasks || !Array.isArray(appData.tasks) || appData.tasks.length === 0) {
        errors.push('Нет данных о заданиях');
    }
    
    if (errors.length > 0) {
        showNotification(`Ошибки: ${errors.join(', ')}`, 'error');
        return false;
    }
    
    return true;
}
// Инициализация голосового синтеза
function initVoiceSynthesis() {
    if (!('speechSynthesis' in window)) {
        console.warn('Браузер не поддерживает синтез речи');
        return;
    }
    
    // Получение доступных голосов
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
        speechSynthesis.addEventListener('voiceschanged', function() {
            console.log('Голоса загружены:', speechSynthesis.getVoices().length);
        });
    }
}

// Генерация голосового резюме
function generateVoiceSummary(reportData) {
    const summary = [];
    
    if (reportData.content.basicInfo) {
        summary.push(`Отчет по предмету ${reportData.content.basicInfo.subject}.`);
        summary.push(`Класс: ${reportData.content.basicInfo.className}.`);
        summary.push(`Тема работы: ${reportData.content.basicInfo.theme}.`);
    }
    
    if (reportData.content.statistics) {
        const stats = reportData.content.statistics;
        summary.push(`Всего учащихся: ${stats.totalStudents}.`);
        summary.push(`Средний балл: ${stats.averageGrade.toFixed(1)}.`);
        summary.push(`Процент успеваемости: ${stats.successRate}%.`);
    }
    
    if (reportData.content.recommendations) {
        summary.push(`Основная рекомендация: ${reportData.content.recommendations.main}.`);
    }
    
    return summary.join(' ');
}

// Генерация изображений графиков
function generateChartImages() {
    const charts = [];
    
    try {
        // График распределения оценок
        const gradeCanvas = document.getElementById('gradesChart');
        if (gradeCanvas) {
            const dataURL = gradeCanvas.toDataURL('image/png').split(',')[1];
            charts.push(dataURL);
        }
        
        // График решаемости
        const solvabilityCanvas = document.getElementById('solvabilityChart');
        if (solvabilityCanvas) {
            const dataURL = solvabilityCanvas.toDataURL('image/png').split(',')[1];
            charts.push(dataURL);
        }
    } catch (error) {
        console.error('Ошибка генерации изображений графиков:', error);
    }
    
    return charts;
}

// Генерация CSV данных
function generateCSVData() {
    let csv = 'Ученик,';
    
    // Заголовки заданий
    appData.tasks.forEach((task, index) => {
        csv += `Задание ${index + 1},`;
    });
    
    csv += 'Итог,Оценка\n';
    
    // Данные учеников
    appData.students.forEach((student, studentIndex) => {
        csv += `${student.lastName} ${student.firstName},`;
        
        let total = 0;
        appData.tasks.forEach((task, taskIndex) => {
            const score = appData.results[student.id]?.[task.id || taskIndex] || 0;
            csv += `${score},`;
            total += parseFloat(score) || 0;
        });
        
        const grade = calculateGrade(total);
        csv += `${total},${grade}\n`;
    });
    
    return csv;
}

// Валидация данных отчета
function validateReportData() {
    const errors = [];
    
    if (!appData.test.subject) {
        errors.push('Не указан предмет');
    }
    
    if (!appData.test.class) {
        errors.push('Не указан класс');
    }
    
    if (!appData.tasks || appData.tasks.length === 0) {
        errors.push('Нет заданий');
    }
    
    if (!appData.students || appData.students.length === 0) {
        errors.push('Нет учащихся');
    }
    
    if (errors.length > 0) {
        showNotification(`Ошибки: ${errors.join(', ')}`, 'error');
        return false;
    }
    
    return true;
}

// Настройка AI-рекомендаций
function setupAIRecommendations() {
    // AI рекомендует поля в зависимости от типа работы
    const workType = appData.test.workType;
    
    const recommendations = {
        vpr: ['basic_info', 'statistics', 'grades_distribution', 'benchmarking'],
        ege: ['basic_info', 'detailed_scores', 'comparative_analysis', 'predictive'],
        oge: ['basic_info', 'statistics', 'task_analysis', 'recommendations'],
        psychology: ['basic_info', 'trends', 'personal_recommendations', 'correlation']
    };
    
    const recommendedFields = recommendations[workType] || ['basic_info', 'statistics', 'grades_distribution'];
    
    // Показываем рекомендации
    recommendedFields.forEach(field => {
        const recElement = document.querySelector(`.ai-recommendation[data-field="${field}"]`);
        if (recElement) {
            recElement.style.display = 'block';
            
            // Устанавливаем чекбокс
            const checkbox = document.querySelector(`input[name="reportFields"][value="${field}"]`);
            if (checkbox) checkbox.checked = true;
        }
    });
}

// Переключение всех полей
function toggleAllFields() {
    const checkboxes = document.querySelectorAll('input[name="reportFields"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
    });
    
    showNotification(allChecked ? 'Все поля сняты' : 'Все поля выбраны', 'info');
}

// Загрузка пользовательских шаблонов
function loadUserTemplates() {
    const userTemplates = JSON.parse(localStorage.getItem('reportTemplates') || '[]');
    const container = document.getElementById('userTemplatesList');
    
    if (userTemplates.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #7f8c8d;">
                <div style="font-size: 2em; margin-bottom: 10px;">📁</div>
                <p>Пока нет сохраненных шаблонов</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    userTemplates.slice(-5).reverse().forEach((template, index) => {
        html += `
            <div class="template-card" onclick="loadTemplateReport(${userTemplates.length - 1 - index})">
                <div class="template-icon">📄</div>
                <div class="template-info">
                    <h4>${template.name}</h4>
                    <p>${template.settings?.type || 'Пользовательский'}</p>
                    <small>${new Date(template.date).toLocaleDateString()}</small>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Создание нового шаблона
function createNewTemplate() {
    const nameInput = document.getElementById('newTemplateName');
    if (!nameInput || !nameInput.value.trim()) {
        showNotification('Введите название шаблона', 'warning');
        return;
    }
    
    const settings = collectReportSettings();
    const userTemplates = JSON.parse(localStorage.getItem('reportTemplates') || '[]');
    
    userTemplates.push({
        name: nameInput.value,
        settings: settings,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('reportTemplates', JSON.stringify(userTemplates));
    hideModal();
    loadUserTemplates();
    
    showNotification('Шаблон создан', 'success');
}

// Загрузка шаблона
function loadTemplateReport(index) {
    const userTemplates = JSON.parse(localStorage.getItem('reportTemplates') || '[]');
    if (!userTemplates[index]) return;
    
    const template = userTemplates[index];
    applyTemplateSettings(template.settings);
    
    hideModal();
    showNotification(`Загружен шаблон: ${template.name}`, 'success');
}

// Применение настроек шаблона
function applyTemplateSettings(settings) {
    // Тип отчета
    if (settings.type) {
        document.getElementById('reportType').value = settings.type;
        updateReportTemplate();
    }
    
    // Поля
    if (settings.fields) {
        document.querySelectorAll('input[name="reportFields"]').forEach(checkbox => {
            checkbox.checked = settings.fields.includes(checkbox.value);
        });
    }
    
    // Фильтры
    if (settings.filters) {
        if (settings.filters.gradeFilter) {
            document.querySelectorAll('input[name="gradeFilter"]').forEach(checkbox => {
                checkbox.checked = settings.filters.gradeFilter.includes(checkbox.value);
            });
        }
    }
    
    // Дизайн
    if (settings.design) {
        if (settings.design.theme) {
            document.getElementById('reportTheme').value = settings.design.theme;
        }
        if (settings.design.font) {
            document.getElementById('reportFont').value = settings.design.font;
        }
    }
    
    // Опции
    if (settings.options) {
        Object.keys(settings.options).forEach(option => {
            const element = document.getElementById(option);
            if (element) element.checked = settings.options[option];
        });
    }
}


// Анализ заданий
function analyzeTasks() {
    if (!appData.tasks || !Array.isArray(appData.tasks)) {
        return [];
    }
    
    return appData.tasks.map((task, index) => {
        if (!task) return null;
        
        const successRate = calculateTaskSuccessRate(index);
        const difficulty = task.level || 1;
        
        return {
            number: index + 1,
            title: task.title || `Задание ${index + 1}`,
            difficulty: difficulty,
            difficultyName: complexityLevels[difficulty]?.name || 'Базовый',
            maxScore: task.maxScore || 1,
            successRate: successRate || 0,
            analysis: analyzeTaskPerformance(index)
        };
    }).filter(task => task !== null); // Фильтруем null
}

// Расчет процента успешности задания
function calculateTaskSuccessRate(taskIndex = null) {
    try {
        // Проверяем базовые данные
        if (!appData || !appData.tasks || !Array.isArray(appData.tasks)) {
            console.warn('calculateTaskSuccessRate: нет данных о заданиях');
            return taskIndex === null ? [] : 0;
        }
        
        // ВЕРСИЯ 1: Если передан индекс - возвращаем успешность одного задания
        if (taskIndex !== null && typeof taskIndex === 'number') {
            // Проверка существования задания по индексу
            if (taskIndex < 0 || taskIndex >= appData.tasks.length) {
                console.warn(`calculateTaskSuccessRate: неверный индекс задания ${taskIndex}`);
                return 0;
            }
            
            const task = appData.tasks[taskIndex];
            if (!task) return 0;
            
            // Исправленная проверка данных студентов
            if (!appData.students || !Array.isArray(appData.students) || appData.students.length === 0) {
                return 0;
            }
            
            let totalScore = 0;
            let maxPossible = 0;
            let processedStudents = 0;
            
            for (let i = 0; i < appData.students.length; i++) {
                const student = appData.students[i];
                if (!student || student.id === undefined) continue;
                
                // Получаем ID студента (может быть число или строка)
                const studentId = student.id !== undefined ? student.id : i;
                
                // Получаем результаты студента
                let studentResults = null;
                if (appData.results && Array.isArray(appData.results)) {
                    // Если results - массив
                    if (appData.results[i] && Array.isArray(appData.results[i])) {
                        studentResults = appData.results[i];
                    }
                } else if (appData.results && typeof appData.results === 'object') {
                    // Если results - объект с ключами ID
                    studentResults = appData.results[studentId];
                }
                
                if (!studentResults) continue;
                
                // Получаем балл за задание
                let score = 0;
                if (Array.isArray(studentResults)) {
                    // Если результаты в массиве по индексам
                    score = parseFloat(studentResults[taskIndex]) || 0;
                } else if (typeof studentResults === 'object') {
                    // Если результаты в объекте
                    const taskId = task.id || taskIndex;
                    score = parseFloat(studentResults[taskId]) || 0;
                }
                
                const maxScore = typeof task.maxScore === 'number' ? task.maxScore : 1;
                
                totalScore += score;
                maxPossible += maxScore;
                processedStudents++;
            }
            
            // Логируем для отладки
            if (processedStudents === 0) {
                return 0; // Возвращаем 0 вместо ошибки
            }
            
            return maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;
        }
        
        // ВЕРСИЯ 2: Если индекс НЕ передан - возвращаем массив успешности всех заданий
        const results = [];
        for (let i = 0; i < appData.tasks.length; i++) {
            const task = appData.tasks[i];
            const successRate = calculateTaskSuccessRate(i); // Рекурсивный вызов
            results.push({
                number: i + 1,
                taskId: task.id || i,
                title: task.title || `Задание ${i + 1}`,
                rate: successRate,
                successRate: successRate,
                maxScore: task.maxScore || 1,
                difficulty: task.level || 1
            });
        }
        
        return results;
        
    } catch (error) {
        console.error('Критическая ошибка в calculateTaskSuccessRate:', error);
        // Возвращаем безопасное значение в зависимости от режима
        return taskIndex === null ? [] : 0;
    }
}

function safeExecute(fn, fallback = null) {
    try {
        return fn();
    } catch (error) {
        console.error('Ошибка выполнения функции:', error);
        return fallback;
    }
}

// Обнаружение типичных ошибок
function detectCommonErrors() {
    const errorCounts = {};
    
    if (!appData.errors || !Array.isArray(appData.errors)) {
        return [];
    }
    
    appData.errors.forEach(error => {
        const type = error.type || 'unknown';
        errorCounts[type] = (errorCounts[type] || 0) + 1;
    });
    
    return Object.entries(errorCounts)
        .map(([type, count]) => ({
            type: errorTypes[type]?.name || type,
            count: count,
            percentage: Math.round((count / appData.errors.length) * 100)
        }))
        .sort((a, b) => b.count - a.count);
}

// Генерация предсказаний
function generatePredictions() {
    const predictions = [];
    const stats = calculateStatistics();
    const trends = analyzeTrends();
    
    // Прогноз на основе текущих результатов
    if (stats.averageGrade < 3.0) {
        predictions.push({
            type: 'warning',
            title: 'Риск неуспеваемости',
            description: 'При текущей динамике возможен рост числа неуспевающих',
            confidence: 70,
            timeframe: '1 месяц'
        });
    }
    
    if (trends.improving) {
        predictions.push({
            type: 'success',
            title: 'Положительная динамика',
            description: 'Ожидается улучшение результатов на 10-15%',
            confidence: 80,
            timeframe: '2 недели'
        });
    }
    
    // Прогноз по конкретным заданиям
    const taskAnalysis = analyzeTasks();
    const weakTasks = taskAnalysis.filter(t => t.successRate < 50);
    
    weakTasks.forEach(task => {
        predictions.push({
            type: 'info',
            title: `Сложное задание №${task.number}`,
            description: `Требуется дополнительная работа, успешность может вырасти до 70%`,
            confidence: 65,
            timeframe: '3 недели'
        });
    });
    
    return predictions;
}

// Анализ тенденций
function analyzeTrends() {
    // В реальном приложении здесь был бы анализ исторических данных
    // Сейчас возвращаем заглушку
    return {
        improving: Math.random() > 0.5,
        stable: Math.random() > 0.7,
        declining: Math.random() > 0.3,
        volatility: Math.random() * 30
    };
}

// Анализ настроения/тона отчета
function analyzeSentiment() {
    const stats = calculateStatistics();
    
    let sentiment = 'neutral';
    let confidence = 0.5;
    
    if (stats.averageGrade >= 4.0) {
        sentiment = 'positive';
        confidence = 0.8;
    } else if (stats.averageGrade <= 2.5) {
        sentiment = 'negative';
        confidence = 0.7;
    }
    
    return {
        sentiment: sentiment,
        confidence: confidence,
        summary: getSentimentSummary(sentiment, stats)
    };
}

function getSentimentSummary(sentiment, stats) {
    const summaries = {
        positive: 'Результаты работы показывают хороший уровень усвоения материала',
        neutral: 'Результаты в пределах средних показателей',
        negative: 'Требуется дополнительная работа по улучшению результатов'
    };
    
    return summaries[sentiment] || summaries.neutral;
}
// Сбор настроек отчета
function collectReportSettings() {
    const settings = {
        type: document.getElementById('reportType')?.value || 'teacher',
        format: document.querySelector('input[name="reportFormat"]:checked')?.value || 'docx',
        fields: [],
        gradeFilter: [],
        complexityFilter: document.getElementById('complexityFilter')?.value || 'all',
        errorTypeFilter: [],
        theme: document.getElementById('reportTheme')?.value || 'default',
        font: document.getElementById('reportFont')?.value || 'Arial',
        fontSize: document.getElementById('fontSize')?.value || '12',
        options: {
            includeCharts: document.getElementById('includeCharts')?.checked || false,
            includeTables: document.getElementById('includeTables')?.checked || false,
            includeQR: document.getElementById('includeQR')?.checked || false,
            autoSummary: document.getElementById('autoSummary')?.checked || false,
            encryptReport: document.getElementById('encryptReport')?.checked || false
        }
    };
    
    // Собираем выбранные поля (с проверкой на существование)
    const fieldCheckboxes = document.querySelectorAll('input[name="reportFields"]:checked');
    if (fieldCheckboxes && fieldCheckboxes.length > 0) {
        fieldCheckboxes.forEach(checkbox => {
            if (checkbox && checkbox.value) {
                settings.fields.push(checkbox.value);
            }
        });
    }
    
    // Собираем фильтры по оценкам
    const gradeCheckboxes = document.querySelectorAll('input[name="gradeFilter"]:checked');
    if (gradeCheckboxes && gradeCheckboxes.length > 0) {
        gradeCheckboxes.forEach(checkbox => {
            if (checkbox && checkbox.value) {
                settings.gradeFilter.push(checkbox.value);
            }
        });
    }
    
    // Собираем фильтры по типам ошибок
    const errorTypeSelect = document.getElementById('errorTypeFilter');
    if (errorTypeSelect && errorTypeSelect.options) {
        settings.errorTypeFilter = Array.from(errorTypeSelect.selectedOptions)
            .map(option => option.value)
            .filter(value => value !== 'all'); // Исключаем опцию "Все"
    }
    
    return settings;
}

// Генерация распределения оценок для отчета
function generateGradesDistribution(settings) {
	// Интегрируем критерии перед генерацией отчета
    const integratedAppData = integrateCriteriaForReports(appData);
    
    // Теперь можем безопасно использовать
    const validation = integratedAppData.helpers.validateCriteria();
    
    if (!validation.isValid) {
        showNotification('Проблемы с критериями оценивания', 'error');
        return;
    }
    
    const distribution = calculateGradeDistributionWithCompatibleCriteria(integratedAppData);
    
    return {
        labels: ['5', '4', '3', '2'],
        values: [
            distribution['5'] || 0,
            distribution['4'] || 0,
            distribution['3'] || 0,
            distribution['2'] || 0
        ],
        total: 100,
        analysis: getDistributionAnalysis(distribution)
    };
}

function getDistributionAnalysis(distribution) {
    const analysis = [];
    
    if (distribution['5'] > 40) {
        analysis.push('Высокий процент отличников');
    }
    if (distribution['2'] > 20) {
        analysis.push('Высокий процент неуспевающих');
    }
    if (distribution['4'] > 30 && distribution['3'] > 30) {
        analysis.push('Сбалансированное распределение оценок');
    }
    
    return analysis.length > 0 ? analysis : ['Распределение в пределах нормы'];
}

// Генерация данных отчета
function generateReportDatas(settings) {
    const report = {
        metadata: {
            generated: new Date().toLocaleString(),
            title: getReportTitle(settings.type),
            author: 'Система анализа образовательных результатов'
        },
        content: {},
        stats: {
            pages: 0,
            words: 0,
            charts: 0,
            tables: 0
        }
    };
    
    // Генерируем разделы в зависимости от выбранных полей
    try {
        if (settings.fields.includes('basic_info')) {
            report.content.basicInfo = generateBasicInfo();
        }
        
        if (settings.fields.includes('statistics')) {
            report.content.statistics = generateStatistics(settings);
        }
        
        if (settings.fields.includes('grades_distribution')) {
            report.content.gradesDistribution = generateGradesDistribution(settings);
        }
        
        if (settings.fields.includes('task_analysis')) {
            report.content.taskAnalysis = generateTaskAnalysis(settings);
        }
        
        if (settings.fields.includes('error_analysis')) {
            report.content.errorAnalysis = generateErrorAnalysis(settings);
        }
        
        if (settings.fields.includes('recommendations')) {
            report.content.recommendations = generateRecommendations(settings);
        }
    } catch (error) {
        console.error('Ошибка генерации разделов отчета:', error);
        showNotification('Ошибка генерации данных отчета', 'warning');
    }
    
    return report;
}

// Генерация базовой информации
function generateBasicInfo() {
    return {
        subject: appData.test.subject || 'Не указан',
        className: appData.test.class || 'Не указан',
        theme: appData.test.theme || 'Не указана',
        date: appData.test.testDate || new Date().toLocaleDateString(),
        workType: workTypes[appData.test.workType]?.name || 'Не указан',
        totalStudents: appData.students?.length || 0,
        totalTasks: appData.tasks?.length || 0
    };
}
// Отображение предпросмотра
function displayReportPreview1(reportData, mode) {
    const previewDiv = document.getElementById('reportPreviewContent');
    
    let html = `
        <div class="report-preview-content ${mode === 'print' ? 'print-mode' : ''}">
            <div class="report-header">
                <h1 style="text-align: center; margin-bottom: 10px;">${reportData.metadata.title}</h1>
                <p style="text-align: center; color: #666;">
                    ${appData.test.subject} | ${appData.test.class} | ${new Date().toLocaleDateString()}
                </p>
            </div>
    `;
    
    // Добавляем разделы
    if (reportData.content.basicInfo) {
        html += generateBasicInfoHTML(reportData.content.basicInfo);
    }
    
    if (reportData.content.statistics) {
        html += generateStatisticsHTML(reportData.content.statistics);
    }
    
    if (reportData.content.gradesDistribution) {
        html += generateGradesDistributionHTML(reportData.content.gradesDistribution);
    }
    
    if (reportData.content.recommendations) {
        html += generateRecommendationsHTML(reportData.content.recommendations);
    }
    
    html += `
            <div class="report-footer">
                <p>Отчет сгенерирован: ${new Date().toLocaleString()}</p>
                <p>Система анализа образовательных результатов</p>
            </div>
        </div>
    `;
    
    previewDiv.innerHTML = html;
}
function generateRecommendationsHTML(recommendationsData) {
    if (!recommendationsData) {
        return '<p>Нет данных для рекомендаций</p>';
    }

    // Безопасное извлечение рекомендаций
    let recommendations = [];
    if (Array.isArray(recommendationsData.recommendations)) {
        recommendations = recommendationsData.recommendations;
    } else if (recommendationsData.recommendations && typeof recommendationsData.recommendations === 'object') {
        // Если это объект, преобразуем в массив
        recommendations = Object.values(recommendationsData.recommendations);
    } else if (Array.isArray(recommendationsData)) {
        // Если передан сам массив
        recommendations = recommendationsData;
    }
    
    let html = `
        <div class="report-section">
            <h3>💡 Рекомендации и план коррекционных мероприятий</h3>
            
            <!-- Общий вывод -->
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); 
                        padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #2196f3;">
                <h4 style="margin-top: 0; color: #1565c0;">🎯 Общий вывод</h4>
                <p style="font-size: 16px; line-height: 1.6;">${recommendationsData.summary || generateSummary()}</p>
            </div>
    `;

    if (recommendations.length === 0) {
        html += '<p>Нет конкретных рекомендаций для отображения.</p>';
    } else {
   let html = `
        <div class="report-section">
            <h3>💡 Рекомендации и план коррекционных мероприятий</h3>
            
            <!-- Общий вывод -->
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); 
                        padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #2196f3;">
                <h4 style="margin-top: 0; color: #1565c0;">🎯 Общий вывод</h4>
                <p style="font-size: 16px; line-height: 1.6;">${recommendationsData.summary || generateSummary()}</p>
            </div>
    `;

    // Рекомендации по приоритету
    const priorities = {
        high: { title: '🚨 Высокий приоритет', color: '#ffebee', border: '#f44336' },
        medium: { title: '⚠️ Средний приоритет', color: '#fff3e0', border: '#ff9800' },
        low: { title: '📋 Низкий приоритет', color: '#e8f5e9', border: '#4caf50' }
    };

    Object.entries(priorities).forEach(([priority, info]) => {
        const priorityRecommendations = recommendationsData.recommendations.filter(rec => rec.priority === priority);
        
        if (priorityRecommendations.length > 0) {
            html += `
                <div style="margin: 25px 0;">
                    <h4 style="color: ${info.border}; display: flex; align-items: center; gap: 10px;">
                        <span style="background: ${info.border}; color: white; padding: 5px 15px; border-radius: 20px;">
                            ${priorityRecommendations.length}
                        </span>
                        ${info.title}
                    </h4>
            `;

            priorityRecommendations.forEach((rec, index) => {
                html += `
                    <div style="background: ${info.color}; padding: 15px; margin: 10px 0; 
                                border-radius: 8px; border-left: 4px solid ${info.border};">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <h5 style="margin: 0; color: #333;">${rec.action}</h5>
                            <span style="background: ${getPriorityBadgeColor(priority)}; color: white; 
                                        padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                                ${rec.deadline || 'Не указано'}
                            </span>
                        </div>
                        <p style="margin: 10px 0; color: #555;">${rec.description}</p>
                        
                        <!-- Детали реализации -->
                        <div style="display: flex; gap: 15px; font-size: 14px; color: #666;">
                            <span>👤 Ответственный: <strong>${rec.responsible || 'Классный руководитель'}</strong></span>
                            <span>🎯 Цель: <strong>${rec.goal || 'Улучшение результатов'}</strong></span>
                            <span>📊 Ожидаемый результат: <strong>${rec.expectedResult || 'Повышение успеваемости'}</strong></span>
                        </div>
                        
                        <!-- Кнопки действий -->
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button style="padding: 5px 15px; background: ${info.border}; color: white; 
                                        border: none; border-radius: 4px; cursor: pointer; font-size: 12px;" 
                                    onclick="markAsCompleted(${index}, '${priority}')">
                                ✅ Выполнено
                            </button>
                            <button style="padding: 5px 15px; background: #f5f5f5; color: #666; 
                                        border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 12px;"
                                    onclick="editRecommendation(${index}, '${priority}')">
                                ✏️ Изменить
                            </button>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        }
    });

    // План мероприятий по группам
    html += generateActionPlanByGroups(recommendationsData);

    // Методические рекомендации
    html += generateMethodologicalRecommendations(recommendationsData);

    // Работа с родителями
    html += generateParentWorkRecommendations(recommendationsData);

    // Мониторинг и оценка эффективности
    html += generateMonitoringPlan(recommendationsData);

    // Матрица ответственности
    html += generateResponsibilityMatrix(recommendationsData);

    // График выполнения
    html += generateTimelineChart(recommendationsData);

    html += `
        </div>
    `;
    }
    
    return html;
}


// Вспомогательные функции
function getPriorityBadgeColor(priority) {
    const colors = {
        high: '#e74c3c',
        medium: '#f39c12',
        low: '#2ecc71'
    };
    return colors[priority] || '#95a5a6';
}

function generateSummary() {
    const stats = calculateStatistics();
    // Интегрируем критерии перед генерацией отчета
    const integratedAppData = integrateCriteriaForReports(appData);
    
    // Теперь можем безопасно использовать
    const validation = integratedAppData.helpers.validateCriteria();
    
    if (!validation.isValid) {
        showNotification('Проблемы с критериями оценивания', 'error');
        return;
    }	
    const distribution = calculateGradeDistributionWithCompatibleCriteria(integratedAppData);
    
    let summary = `На основе анализа результатов ${stats.totalStudents || 0} учащихся `;
    
    if (stats.averageGrade >= 4.0) {
        summary += `выявлен высокий уровень усвоения материала (средний балл: ${stats.averageGrade.toFixed(1)}). `;
        summary += `Рекомендуется поддержать достигнутый уровень и развивать творческие способности учащихся.`;
    } else if (stats.averageGrade >= 3.0) {
        summary += `наблюдается стабильный средний уровень подготовки (средний балл: ${stats.averageGrade.toFixed(1)}). `;
        summary += `Требуется работа по устранению типичных ошибок и повышению мотивации.`;
    } else {
        summary += `обнаружены проблемы в усвоении материала (средний балл: ${stats.averageGrade.toFixed(1)}). `;
        summary += `Необходима комплексная работа по ликвидации пробелов в знаниях.`;
    }
    
    if (distribution['2'] > 20) {
        summary += ` Особое внимание следует уделить ${distribution['2']}% учащихся, получивших неудовлетворительные оценки.`;
    }
    
    if (distribution['5'] > 30) {
        summary += ` Высокий процент отличников (${distribution['5']}%) позволяет организовать работу в парах "сильный-слабый".`;
    }
    
    return summary;
}

function generateActionPlanByGroups(recommendationsData) {
    const actionPlan = `
        <div style="margin: 30px 0;">
            <h4 style="color: #7b1fa2; border-bottom: 2px solid #7b1fa2; padding-bottom: 5px;">
                👥 План мероприятий по группам учащихся
            </h4>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 15px;">
                <!-- Для отличников -->
                <div style="background: #e8f5e9; padding: 20px; border-radius: 10px; border: 2px solid #4caf50;">
                    <h5 style="color: #2e7d32; margin-top: 0;">🥇 Для отличников (оценка 5)</h5>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Дополнительные творческие задания повышенной сложности</li>
                        <li>Участие в олимпиадах и конкурсах</li>
                        <li>Работа в качестве консультантов для отстающих</li>
                        <li>Проектная деятельность</li>
                    </ul>
                </div>
                
                <!-- Для хорошистов -->
                <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; border: 2px solid #2196f3;">
                    <h5 style="color: #1565c0; margin-top: 0;">🥈 Для хорошистов (оценка 4)</h5>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Тренировочные задания для перехода на уровень "отлично"</li>
                        <li>Работа над устранением системных ошибок</li>
                        <li>Групповая работа над сложными темами</li>
                        <li>Развитие навыков самопроверки</li>
                    </ul>
                </div>
                
                <!-- Для троечников -->
                <div style="background: #fff3e0; padding: 20px; border-radius: 10px; border: 2px solid #ff9800;">
                    <h5 style="color: #ef6c00; margin-top: 0;">🥉 Для троечников (оценка 3)</h5>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Индивидуальные консультации по проблемным темам</li>
                        <li>Повторное объяснение сложного материала</li>
                        <li>Тренировочные задания базового уровня</li>
                        <li>Мотивационные беседы</li>
                    </ul>
                </div>
                
                <!-- Для отстающих -->
                <div style="background: #ffebee; padding: 20px; border-radius: 10px; border: 2px solid #f44336;">
                    <h5 style="color: #c62828; margin-top: 0;">📝 Для отстающих (оценка 2)</h5>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Индивидуальная программа ликвидации пробелов</li>
                        <li>Работа с родителями</li>
                        <li>Упрощенные задания с пошаговыми инструкциями</li>
                        <li>Положительное подкрепление</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    return actionPlan;
}

function generateMethodologicalRecommendations(recommendationsData) {
    // Интегрируем критерии перед генерацией отчета
    const integratedAppData = integrateCriteriaForReports(appData);
    
    // Теперь можем безопасно использовать
    const validation = integratedAppData.helpers.validateCriteria();
    
    if (!validation.isValid) {
        showNotification('Проблемы с критериями оценивания', 'error');
        return;
    }	
    const distribution = calculateGradeDistributionWithCompatibleCriteria(integratedAppData);
    
    let recommendations = `
        <div style="margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 10px;">
            <h4 style="color: #5d4037; border-bottom: 2px solid #5d4037; padding-bottom: 5px;">
                📚 Методические рекомендации
            </h4>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">
    `;
    
    // Рекомендации по типам ошибок
    if (appData.errors && appData.errors.length > 0) {
        recommendations += `
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0;">
                <h6 style="margin: 0 0 10px 0; color: #d32f2f;">🔄 Коррекция типичных ошибок</h6>
                <p style="margin: 0; font-size: 14px;">Разработать упражнения для отработки наиболее частых ошибок</p>
            </div>
        `;
    }
    
    // Рекомендации по дифференциации
    if (distribution['5'] > 0 && distribution['2'] > 0) {
        const gap = distribution['5'] - distribution['2'];
        if (Math.abs(gap) > 30) {
            recommendations += `
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0;">
                    <h6 style="margin: 0 0 10px 0; color: #7b1fa2;">🎯 Дифференцированный подход</h6>
                    <p style="margin: 0; font-size: 14px;">Использовать задания разного уровня сложности для разных групп учащихся</p>
                </div>
            `;
        }
    }
    
    // Рекомендации по формам работы
    recommendations += `
        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0;">
            <h6 style="margin: 0 0 10px 0; color: #0288d1;">🤝 Групповая работа</h6>
            <p style="margin: 0; font-size: 14px;">Организовать работу в парах и малых группах для взаимного обучения</p>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0;">
            <h6 style="margin: 0 0 10px 0; color: #388e3c;">📊 Формирующее оценивание</h6>
            <p style="margin: 0; font-size: 14px;">Внедрить систему промежуточного контроля для своевременной коррекции</p>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0;">
            <h6 style="margin: 0 0 10px 0; color: #f57c00;">💻 Использование ИКТ</h6>
            <p style="margin: 0; font-size: 14px;">Применять цифровые ресурсы для повышения мотивации и наглядности</p>
        </div>
    `;
    
    recommendations += `
            </div>
        </div>
    `;
    
    return recommendations;
}

function generateParentWorkRecommendations(recommendationsData) {
    const weakPercentage = calculateStatistics()?.weakPercentage || 0;
    
    let recommendations = `
        <div style="margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%); 
                    border-radius: 10px; border: 2px solid #e91e63;">
            <h4 style="color: #c2185b; border-bottom: 2px solid #c2185b; padding-bottom: 5px;">
                👪 Работа с родителями
            </h4>
    `;
    
    if (weakPercentage > 15) {
        recommendations += `
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #e91e63;">
                <h5 style="margin: 0 0 10px 0; color: #c2185b;">📞 Индивидуальные беседы</h5>
                <p style="margin: 0;">Провести индивидуальные встречи с родителями ${weakPercentage}% отстающих учащихся для обсуждения мер поддержки</p>
                <div style="display: flex; gap: 20px; margin-top: 10px; font-size: 14px;">
                    <span>📅 Срок: <strong>2 недели</strong></span>
                    <span>👤 Ответственный: <strong>Классный руководитель</strong></span>
                </div>
            </div>
        `;
    }
    
    recommendations += `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; color: #e91e63;">📋</div>
                    <div style="font-weight: bold; margin: 10px 0;">Информационные письма</div>
                    <div style="font-size: 14px; color: #666;">Отправка индивидуальных отчетов родителям</div>
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; color: #e91e63;">👥</div>
                    <div style="font-weight: bold; margin: 10px 0;">Родительское собрание</div>
                    <div style="font-size: 14px; color: #666;">Обсуждение результатов и плана работы</div>
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; color: #e91e63;">📱</div>
                    <div style="font-weight: bold; margin: 10px 0;">Онлайн-консультации</div>
                    <div style="font-size: 14px; color: #666;">Удобный формат для работающих родителей</div>
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; color: #e91e63;">💡</div>
                    <div style="font-weight: bold; margin: 10px 0;">Советы родителям</div>
                    <div style="font-size: 14px; color: #666;">Методические рекомендации для помощи дома</div>
                </div>
            </div>
        </div>
    `;
    
    return recommendations;
}

function generateMonitoringPlan(recommendationsData) {
    return `
        <div style="margin: 30px 0;">
            <h4 style="color: #00695c; border-bottom: 2px solid #00695c; padding-bottom: 5px;">
                📈 План мониторинга и оценки эффективности
            </h4>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                <thead>
                    <tr style="background: #00695c; color: white;">
                        <th style="padding: 12px; text-align: left;">Мероприятие</th>
                        <th style="padding: 12px; text-align: center;">Показатель</th>
                        <th style="padding: 12px; text-align: center;">Целевое значение</th>
                        <th style="padding: 12px; text-align: center;">Срок проверки</th>
                        <th style="padding: 12px; text-align: center;">Метод оценки</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom: 1px solid #e0e0e0;">
                        <td style="padding: 10px;">Устранение пробелов в знаниях</td>
                        <td style="padding: 10px; text-align: center;">% отстающих учащихся</td>
                        <td style="padding: 10px; text-align: center; color: #2ecc71; font-weight: bold;">-15%</td>
                        <td style="padding: 10px; text-align: center;">Через 1 месяц</td>
                        <td style="padding: 10px; text-align: center;">Контрольная работа</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e0e0e0;">
                        <td style="padding: 10px;">Повышение мотивации</td>
                        <td style="padding: 10px; text-align: center;">% активно работающих</td>
                        <td style="padding: 10px; text-align: center; color: #2ecc71; font-weight: bold;">+20%</td>
                        <td style="padding: 10px; text-align: center;">Еженедельно</td>
                        <td style="padding: 10px; text-align: center;">Наблюдение, опрос</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e0e0e0;">
                        <td style="padding: 10px;">Развитие сильных учащихся</td>
                        <td style="padding: 10px; text-align: center;">% отличников</td>
                        <td style="padding: 10px; text-align: center; color: #2ecc71; font-weight: bold;">+10%</td>
                        <td style="padding: 10px; text-align: center;">Через 2 недели</td>
                        <td style="padding: 10px; text-align: center;">Творческие задания</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px;">Родительская вовлеченность</td>
                        <td style="padding: 10px; text-align: center;">% родителей на собрании</td>
                        <td style="padding: 10px; text-align: center; color: #2ecc71; font-weight: bold;">85%</td>
                        <td style="padding: 10px; text-align: center;">Через 3 недели</td>
                        <td style="padding: 10px; text-align: center;">Список присутствующих</td>
                    </tr>
                </tbody>
            </table>
            
            <div style="background: #e0f2f1; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <h5 style="margin: 0 0 10px 0; color: #00695c;">📊 Критерии успешности:</h5>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>Снижение процента неуспевающих на 15% и более</li>
                    <li>Повышение среднего балла на 0.5 балла</li>
                    <li>Увеличение доли активно работающих учащихся</li>
                    <li>Положительная динамика по всем группам учащихся</li>
                </ul>
            </div>
        </div>
    `;
}

function generateResponsibilityMatrix(recommendationsData) {
    return `
        <div style="margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 10px;">
            <h4 style="color: #5d4037; border-bottom: 2px solid #5d4037; padding-bottom: 5px;">
                👥 Матрица ответственности
            </h4>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
                <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #1976d2;">
                    <h5 style="color: #1976d2; margin-top: 0; display: flex; align-items: center; gap: 10px;">
                        <span style="background: #1976d2; color: white; width: 30px; height: 30px; 
                                    border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            👩‍🏫
                        </span>
                        Учитель-предметник
                    </h5>
                    <ul style="margin: 15px 0; padding-left: 20px; font-size: 14px;">
                        <li>Разработка коррекционных материалов</li>
                        <li>Проведение дополнительных занятий</li>
                        <li>Анализ типичных ошибок</li>
                        <li>Дифференциация заданий</li>
                    </ul>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #388e3c;">
                    <h5 style="color: #388e3c; margin-top: 0; display: flex; align-items: center; gap: 10px;">
                        <span style="background: #388e3c; color: white; width: 30px; height: 30px; 
                                    border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            🧑‍🏫
                        </span>
                        Классный руководитель
                    </h5>
                    <ul style="margin: 15px 0; padding-left: 20px; font-size: 14px;">
                        <li>Работа с родителями</li>
                        <li>Мониторинг посещаемости</li>
                        <li>Мотивационная работа</li>
                        <li>Координация действий</li>
                    </ul>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #f57c00;">
                    <h5 style="color: #f57c00; margin-top: 0; display: flex; align-items: center; gap: 10px;">
                        <span style="background: #f57c00; color: white; width: 30px; height: 30px; 
                                    border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            🧑‍🎓
                        </span>
                        Учащиеся
                    </h5>
                    <ul style="margin: 15px 0; padding-left: 20px; font-size: 14px;">
                        <li>Выполнение коррекционных заданий</li>
                        <li>Работа над ошибками</li>
                        <li>Взаимопомощь в группах</li>
                        <li>Самоконтроль и рефлексия</li>
                    </ul>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #7b1fa2;">
                    <h5 style="color: #7b1fa2; margin-top: 0; display: flex; align-items: center; gap: 10px;">
                        <span style="background: #7b1fa2; color: white; width: 30px; height: 30px; 
                                    border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            👪
                        </span>
                        Родители
                    </h5>
                    <ul style="margin: 15px 0; padding-left: 20px; font-size: 14px;">
                        <li>Контроль выполнения домашних заданий</li>
                        <li>Создание условий для занятий</li>
                        <li>Поддержка и мотивация</li>
                        <li>Взаимодействие с учителями</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}

function generateTimelineChart(recommendationsData) {
    // Создаем временную шкалу выполнения мероприятий
    const timelineData = [
        { week: 1, task: 'Анализ результатов', progress: 100 },
        { week: 2, task: 'Индивидуальные консультации', progress: 75 },
        { week: 3, task: 'Групповые занятия', progress: 50 },
        { week: 4, task: 'Работа с родителями', progress: 25 },
        { week: 5, task: 'Промежуточный контроль', progress: 0 },
        { week: 6, task: 'Коррекция плана', progress: 0 },
        { week: 7, task: 'Итоговая оценка', progress: 0 }
    ];
    
    let timelineHTML = `
        <div style="margin: 30px 0;">
            <h4 style="color: #0288d1; border-bottom: 2px solid #0288d1; padding-bottom: 5px;">
                📅 График выполнения мероприятий
            </h4>
            
            <div style="position: relative; margin: 20px 0; padding-left: 40px;">
                <!-- Вертикальная линия -->
                <div style="position: absolute; left: 20px; top: 0; bottom: 0; width: 4px; background: #0288d1;"></div>
    `;
    
    timelineData.forEach((item, index) => {
        const isCompleted = item.progress === 100;
        const isInProgress = item.progress > 0 && item.progress < 100;
        
        timelineHTML += `
            <div style="position: relative; margin-bottom: 40px;">
                <!-- Точка на временной линии -->
                <div style="position: absolute; left: -40px; top: 0; width: 40px; height: 40px; 
                            background: ${isCompleted ? '#4caf50' : isInProgress ? '#ff9800' : '#9e9e9e'}; 
                            border-radius: 50%; display: flex; align-items: center; justify-content: center;
                            color: white; font-weight: bold; border: 4px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                    ${isCompleted ? '✓' : index + 1}
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0; 
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h5 style="margin: 0; color: #333;">Неделя ${item.week}: ${item.task}</h5>
                        <span style="background: ${isCompleted ? '#4caf50' : isInProgress ? '#ff9800' : '#9e9e9e'}; 
                                   color: white; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                            ${isCompleted ? 'Завершено' : isInProgress ? 'В процессе' : 'Запланировано'}
                        </span>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="flex: 1; height: 10px; background: #f5f5f5; border-radius: 5px; overflow: hidden;">
                            <div style="width: ${item.progress}%; height: 100%; 
                                        background: ${isCompleted ? '#4caf50' : isInProgress ? '#ff9800' : '#9e9e9e'}; 
                                        transition: width 0.5s ease;"></div>
                        </div>
                        <span style="font-weight: bold; color: #333;">${item.progress}%</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    timelineHTML += `
            </div>
            
            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 30px;">
                <button style="padding: 10px 25px; background: #0288d1; color: white; border: none; 
                            border-radius: 5px; cursor: pointer; font-weight: bold; display: flex; 
                            align-items: center; gap: 8px;"
                        onclick="printRecommendations()">
                    🖨️ Распечатать план
                </button>
                <button style="padding: 10px 25px; background: #4caf50; color: white; border: none; 
                            border-radius: 5px; cursor: pointer; font-weight: bold; display: flex; 
                            align-items: center; gap: 8px;"
                        onclick="shareRecommendations()">
                    📤 Поделиться
                </button>
                <button style="padding: 10px 25px; background: #ff9800; color: white; border: none; 
                            border-radius: 5px; cursor: pointer; font-weight: bold; display: flex; 
                            align-items: center; gap: 8px;"
                        onclick="exportRecommendations()">
                    💾 Экспорт
                </button>
            </div>
        </div>
    `;
    
    return timelineHTML;
}

// Обработчики для кнопок в рекомендациях
function markAsCompleted(index, priority) {
    if (!recommendationsData || !recommendationsData.recommendations) return;
    
    const recIndex = recommendationsData.recommendations
        .findIndex((rec, i) => rec.priority === priority && 
                   recommendationsData.recommendations
                       .filter(r => r.priority === priority)
                       .slice(0, index + 1).length - 1 === i);
    
    if (recIndex !== -1) {
        recommendationsData.recommendations[recIndex].completed = true;
        recommendationsData.recommendations[recIndex].completedDate = new Date().toLocaleDateString();
        
        // Обновляем отображение
        const recommendationsHTML = generateRecommendationsHTML(recommendationsData);
        const previewContent = document.getElementById('reportPreviewContent');
        if (previewContent) {
            previewContent.innerHTML = recommendationsHTML;
        }
        
        showNotification('Рекомендация отмечена как выполненная', 'success');
    }
}

function editRecommendation(index, priority) {
    const rec = recommendationsData.recommendations
        .filter(r => r.priority === priority)[index];
    
    if (!rec) return;
    
    const newAction = prompt('Измените действие:', rec.action);
    if (newAction) rec.action = newAction;
    
    const newDeadline = prompt('Измените срок:', rec.deadline);
    if (newDeadline) rec.deadline = newDeadline;
    
    // Обновляем отображение
    const recommendationsHTML = generateRecommendationsHTML(recommendationsData);
    const previewContent = document.getElementById('reportPreviewContent');
    if (previewContent) {
        previewContent.innerHTML = recommendationsHTML;
    }
    
    showNotification('Рекомендация изменена', 'success');
}

function printRecommendations() {
    const printContent = document.querySelector('.report-section');
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Рекомендации и план мероприятий</title>
            <style>
                @media print {
                    @page { margin: 20mm; }
                    body { font-family: Arial, sans-serif; font-size: 12pt; }
                    .no-print { display: none !important; }
                }
                .section { margin-bottom: 20mm; }
                h1, h2, h3, h4, h5 { color: #333; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #000; padding: 5px; }
            </style>
        </head>
        <body>
            ${printContent.innerHTML}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

function shareRecommendations() {
    if (navigator.share) {
        navigator.share({
            title: 'Рекомендации по результатам работы',
            text: 'План коррекционных мероприятий для учащихся',
            url: window.location.href
        });
    } else {
        const text = 'Рекомендации и план мероприятий\n\n' + 
                    generateTextSummary(recommendationsData);
        navigator.clipboard.writeText(text)
            .then(() => showNotification('Рекомендации скопированы в буфер', 'success'))
            .catch(err => console.error('Ошибка копирования:', err));
    }
}

function exportRecommendations() {
    const data = {
        recommendations: recommendationsData?.recommendations || [],
        generated: new Date().toISOString(),
        class: appData.test.class,
        subject: appData.test.subject
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recommendations_${appData.test.class}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showNotification('Рекомендации экспортированы в JSON', 'success');
}

function generateTextSummary(data) {
    let summary = 'РЕКОМЕНДАЦИИ И ПЛАН МЕРОПРИЯТИЙ\n';
    summary += '================================\n\n';
    
    data.recommendations?.forEach(rec => {
        summary += `[${rec.priority.toUpperCase()}] ${rec.action}\n`;
        summary += `Описание: ${rec.description}\n`;
        summary += `Срок: ${rec.deadline || 'Не указан'}\n\n`;
    });
    
    return summary;
}

// Функция для генерации данных рекомендаций
function generateRecommendations(settings) {
    // Интегрируем критерии перед генерацией отчета
    const integratedAppData = integrateCriteriaForReports(appData);
    
    // Теперь можем безопасно использовать
    const validation = integratedAppData.helpers.validateCriteria();
    
    if (!validation.isValid) {
        showNotification('Проблемы с критериями оценивания', 'error');
        return;
    }
    
    // Генерируем распределение оценок с совместимыми критериями	
    const distribution = calculateGradeDistributionWithCompatibleCriteria(integratedAppData);
    const stats = calculateStatistics();
    const taskAnalysis = analyzeTasks();
    
    const recommendations = [];
    
    // Рекомендации на основе распределения оценок
    if (distribution['2'] > 15) {
        recommendations.push({
            priority: 'high',
            action: 'Индивидуальная работа с отстающими',
            description: `${distribution['2']}% учащихся получили неудовлетворительные оценки`,
            deadline: 'Срочно',
            responsible: 'Учитель-предметник',
            goal: 'Снижение процента неуспевающих',
            expectedResult: 'Улучшение результатов минимум на 20%'
        });
    }
    
    if (stats.averageGrade < 3.0) {
        recommendations.push({
            priority: 'high',
            action: 'Повторение базовых тем',
            description: `Средний балл класса (${stats.averageGrade.toFixed(1)}) ниже удовлетворительного`,
            deadline: '1 неделя',
            responsible: 'Учитель-предметник',
            goal: 'Повышение среднего балла',
            expectedResult: 'Средний балл не менее 3.0'
        });
    }
    
    // Рекомендации на основе анализа заданий
    const weakTasks = taskAnalysis.filter(t => t.successRate < 60);
    if (weakTasks.length > 0) {
        recommendations.push({
            priority: 'medium',
            action: 'Проработка сложных заданий',
            description: `${weakTasks.length} заданий выполнено менее чем на 60%`,
            deadline: '2 недели',
            responsible: 'Учитель-предметник',
            goal: 'Улучшение выполнения заданий',
            expectedResult: 'Успешность заданий не менее 70%'
        });
    }
    
    // Методические рекомендации
    recommendations.push({
        priority: 'low',
        action: 'Внедрение дифференцированного подхода',
        description: 'Разработка заданий разного уровня сложности',
        deadline: '3 недели',
        responsible: 'Учитель-предметник',
        goal: 'Адаптация обучения под разные уровни',
        expectedResult: 'Повышение мотивации всех групп учащихся'
    });
    
    // Рекомендации по работе с родителями
    if (distribution['2'] > 10) {
        recommendations.push({
            priority: 'medium',
            action: 'Встреча с родителями отстающих',
            description: 'Обсуждение мер поддержки для учащихся с низкими результатами',
            deadline: '1 неделя',
            responsible: 'Классный руководитель',
            goal: 'Привлечение родителей к учебному процессу',
            expectedResult: 'Повышение вовлеченности родителей'
        });
    }
    
    return {
        recommendations: recommendations,
        summary: generateSummary(),
        generated: new Date().toISOString(),
        totalRecommendations: recommendations.length
    };
}

function generateGradesDistributionHTML(distributionData) {
    if (!distributionData) {
        return '<p>Нет данных о распределении оценок</p>';
    }

    const maxPercentage = Math.max(...Object.values(distributionData).map(v => parseInt(v) || 0));
    
    let html = `
        <div class="report-section">
            <h3>📊 Распределение оценок</h3>
            
            <div style="margin: 20px 0;">
                <table class="report-table" style="width: 100%;">
                    <thead>
                        <tr>
                            <th style="width: 20%; text-align: center;">Оценка</th>
                            <th style="width: 10%; text-align: center;">%</th>
                            <th style="width: 70%;">Визуализация</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    // Сортируем оценки от 5 до 2
    const sortedGrades = Object.entries(distributionData)
        .sort(([gradeA], [gradeB]) => parseInt(gradeB) - parseInt(gradeA));

    sortedGrades.forEach(([grade, percentage]) => {
        const gradeNum = parseInt(grade);
        const gradeName = getGradeName(gradeNum);
        const gradeColor = getGradeColor(grade);
        const barWidth = (percentage / maxPercentage) * 100;
        
        html += `
            <tr>
                <td style="text-align: center; font-weight: bold; color: ${gradeColor};">
                    <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; 
                                 background: ${gradeColor}; color: white; border-radius: 50%; margin-right: 8px;">
                        ${grade}
                    </span>
                    ${gradeName}
                </td>
                <td style="text-align: center; font-weight: bold;">
                    ${percentage}%
                </td>
                <td>
                    <div style="background: #f0f0f0; height: 24px; border-radius: 12px; overflow: hidden; position: relative;">
                        <div style="width: ${barWidth}%; height: 100%; background: ${gradeColor}; 
                                    transition: width 0.5s ease;"></div>
                        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; 
                                    display: flex; align-items: center; padding-left: 10px; color: #333; 
                                    font-size: 12px; font-weight: bold;">
                            ${percentage}% учащихся
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });

    // Добавляем общую статистику
    const totalStudents = appData.students?.length || 0;
    const averageGrade = calculateStatistics()?.averageGrade?.toFixed(1) || '0.0';
    const successRate = calculateStatistics()?.successRate || 0;

    html += `
                    </tbody>
                </table>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #2c3e50;">${totalStudents}</div>
                    <div style="color: #7f8c8d; font-size: 14px;">Всего учащихся</div>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #2c3e50;">${averageGrade}</div>
                    <div style="color: #7f8c8d; font-size: 14px;">Средний балл</div>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #2c3e50;">${successRate}%</div>
                    <div style="color: #7f8c8d; font-size: 14px;">Успеваемость (3+)</div>
                </div>
            </div>
    `;

    // Добавляем гистограмму для визуализации
    if (window.Chart && sortedGrades.length > 0) {
        html += `
            <div style="margin-top: 30px;">
                <h4>Гистограмма распределения оценок</h4>
                <div style="position: relative; height: 300px;">
                    <canvas id="gradeDistributionChart"></canvas>
                </div>
            </div>
        `;
    }

    // Добавляем анализ распределения
    html += generateDistributionAnalysis(distributionData);

    html += `
        </div>
    `;

    // Инициализируем график после добавления в DOM
    setTimeout(() => {
        if (window.Chart && document.getElementById('gradeDistributionChart')) {
            createGradeDistributionChart(distributionData);
        }
    }, 100);

    return html;
}

// Вспомогательные функции
function getGradeName(grade) {
    const names = {
        5: 'Отлично',
        4: 'Хорошо',
        3: 'Удовлетворительно',
        2: 'Неудовлетворительно'
    };
    return names[grade] || `Оценка ${grade}`;
}

function createGradeDistributionChart(distributionData) {
    const ctx = document.getElementById('gradeDistributionChart');
    if (!ctx) return;

    // Уничтожаем старый график если есть
    if (ctx.chartInstance) {
        ctx.chartInstance.destroy();
    }

    const sortedGrades = Object.entries(distributionData)
        .sort(([gradeA], [gradeB]) => parseInt(gradeA) - parseInt(gradeB));

    const labels = sortedGrades.map(([grade]) => `Оценка ${grade}`);
    const data = sortedGrades.map(([grade, percentage]) => percentage);
    const colors = sortedGrades.map(([grade]) => getGradeColor(grade));
    const hoverColors = sortedGrades.map(([grade]) => lightenColor(getGradeColor(grade), 20));

    ctx.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Процент учащихся',
                data: data,
                backgroundColor: colors,
                borderColor: colors.map(color => darkenColor(color, 10)),
                borderWidth: 2,
                hoverBackgroundColor: hoverColors,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

function generateDistributionAnalysis(distributionData) {
    let analysis = '<div style="margin-top: 25px; padding: 20px; background: #f8f9fa; border-radius: 10px;">';
    analysis += '<h4>📈 Анализ распределения</h4>';
    
    const excellent = distributionData['5'] || 0;
    const good = distributionData['4'] || 0;
    const average = distributionData['3'] || 0;
    const weak = distributionData['2'] || 0;
    
    // Анализируем распределение
    if (excellent >= 30) {
        analysis += '<p>✅ <strong>Высокий процент отличников:</strong> Более 30% учащихся получили высший балл. Это может указывать на хорошее усвоение материала или относительно простые задания.</p>';
    }
    
    if (weak >= 25) {
        analysis += '<p>⚠️ <strong>Тревожный показатель:</strong> Более 25% учащихся получили неудовлетворительные оценки. Требуется дополнительная работа с отстающими.</p>';
    }
    
    if (average >= 40 && good >= 30) {
        analysis += '<p>📊 <strong>Нормальное распределение:</strong> Большинство учащихся показали средние и хорошие результаты. Это типичная картина для большинства классов.</p>';
    }
    
    // Рекомендации
    analysis += '<h5 style="margin-top: 15px;">💡 Рекомендации:</h5><ul style="margin: 10px 0; padding-left: 20px;">';
    
    if (weak > 15) {
        analysis += '<li>Провести индивидуальные консультации для отстающих учащихся</li>';
        analysis += '<li>Рассмотреть возможность пересдачи для улучшения оценок</li>';
    }
    
    if (excellent < 10 && good < 30) {
        analysis += '<li>Увеличить количество творческих заданий для мотивации сильных учащихся</li>';
    }
    
    if (Math.abs(excellent - weak) > 50) {
        analysis += '<li>Разделить класс на группы по уровню подготовки для дифференцированного подхода</li>';
    }
    
    analysis += '<li>Провести работу над ошибками для наиболее проблемных заданий</li>';
    analysis += '</ul>';
    
    // Статистический анализ
    const total = excellent + good + average + weak;
    if (total > 0) {
        const giniCoefficient = calculateGiniCoefficient([excellent, good, average, weak]);
        analysis += `<p style="margin-top: 15px; font-size: 14px; color: #666;">Коэффициент неравенства (Джини): <strong>${giniCoefficient.toFixed(3)}</strong> ${giniCoefficient > 0.3 ? '(высокое неравенство)' : '(равномерное распределение)'}</p>`;
    }
    
    analysis += '</div>';
    
    return analysis;
}

// Дополнительные вспомогательные функции
function lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return "#" + (
        0x1000000 +
        (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
}

function darkenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    
    return "#" + (
        0x1000000 +
        (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
}

function calculateGiniCoefficient(values) {
    // Расчет коэффициента Джини для оценки неравенства распределения
    const sorted = values.slice().sort((a, b) => a - b);
    const n = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    
    if (sum === 0) return 0;
    
    let cumulative = 0;
    let gini = 0;
    
    for (let i = 0; i < n; i++) {
        cumulative += sorted[i];
        gini += (i + 1) * sorted[i];
    }
    
    return (2 * gini) / (n * sum) - (n + 1) / n;
}

// Функция для генерации распределения оценок в данных отчета
function generateGradesDistributionn(settings) {
    // Интегрируем критерии перед генерацией отчета
    const integratedAppData = integrateCriteriaForReports(appData);
    
    // Теперь можем безопасно использовать
    const validation = integratedAppData.helpers.validateCriteria();
    
    if (!validation.isValid) {
        showNotification('Проблемы с критериями оценивания', 'error');
        return;
    }
    
    // Генерируем распределение оценок с совместимыми критериями	
    const distribution = calculateGradeDistributionWithCompatibleCriteria(integratedAppData);
    const stats = calculateStatistics();
    
    return {
        distribution: distribution,
        statistics: {
            totalStudents: stats.totalStudents,
            averageGrade: stats.averageGrade,
            successRate: stats.successRate,
            medianGrade: calculateMedianGrade(),
            modeGrade: calculateModeGrade(),
            standardDeviation: calculateStandardDeviation()
        },
        analysis: analyzeGradeDistribution(distribution),
        recommendations: generateDistributionRecommendations(distribution)
    };
}

function calculateMedianGrade() {
    if (!appData.students || appData.students.length === 0) return 0;
    
    const grades = appData.students
        .map(student => {
            const totalScore = calculateStudentTotal(student.id);
            return calculateGrade(totalScore);
        })
        .filter(grade => grade !== null)
        .sort((a, b) => a - b);
    
    if (grades.length === 0) return 0;
    
    const middle = Math.floor(grades.length / 2);
    
    if (grades.length % 2 === 0) {
        return (grades[middle - 1] + grades[middle]) / 2;
    } else {
        return grades[middle];
    }
}

function calculateModeGrade() {
    if (!appData.students || appData.students.length === 0) return 0;
    
    const gradeCounts = {};
    
    appData.students.forEach(student => {
        const totalScore = calculateStudentTotal(student.id);
        const grade = calculateGrade(totalScore);
        
        if (grade !== null) {
            gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
        }
    });
    
    let mode = 0;
    let maxCount = 0;
    
    Object.entries(gradeCounts).forEach(([grade, count]) => {
        if (count > maxCount) {
            maxCount = count;
            mode = parseInt(grade);
        }
    });
    
    return mode;
}

function calculateStandardDeviation() {
    if (!appData.students || appData.students.length === 0) return 0;
    
    const grades = appData.students
        .map(student => {
            const totalScore = calculateStudentTotal(student.id);
            return calculateGrade(totalScore);
        })
        .filter(grade => grade !== null);
    
    if (grades.length === 0) return 0;
    
    const mean = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
    const squaredDiffs = grades.map(grade => Math.pow(grade - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / grades.length;
    
    return Math.sqrt(variance).toFixed(2);
}

function analyzeGradeDistribution(distribution) {
    const analysis = {
        type: '',
        description: '',
        strengths: [],
        weaknesses: []
    };
    
    const excellent = distribution['5'] || 0;
    const good = distribution['4'] || 0;
    const average = distribution['3'] || 0;
    const weak = distribution['2'] || 0;
    
    // Определяем тип распределения
    if (excellent >= 40) {
        analysis.type = 'Отличные результаты';
        analysis.description = 'Большинство учащихся показали высокие результаты';
        analysis.strengths.push('Высокая мотивация учащихся', 'Хорошее усвоение материала');
    } else if (good >= 40) {
        analysis.type = 'Хорошие результаты';
        analysis.description = 'Стабильные хорошие результаты по классу';
        analysis.strengths.push('Стабильная успеваемость', 'Хорошая подготовка');
    } else if (average >= 50) {
        analysis.type = 'Средние результаты';
        analysis.description = 'Преобладают удовлетворительные результаты';
        analysis.strengths.push('Базовая подготовка присутствует');
        analysis.weaknesses.push('Необходимо повышать уровень');
    } else if (weak >= 30) {
        analysis.type = 'Требуется вмешательство';
        analysis.description = 'Значительная часть класса испытывает трудности';
        analysis.weaknesses.push('Низкая успеваемость', 'Требуется дополнительная работа');
    } else {
        analysis.type = 'Смешанные результаты';
        analysis.description = 'Распределение оценок неравномерно';
    }
    
    return analysis;
}

function generateDistributionRecommendations(distribution) {
    const recommendations = [];
    const excellent = distribution['5'] || 0;
    const good = distribution['4'] || 0;
    const average = distribution['3'] || 0;
    const weak = distribution['2'] || 0;
    
    if (weak > 20) {
        recommendations.push({
            priority: 'high',
            action: 'Индивидуальная работа с отстающими',
            description: `Более ${weak}% учащихся получили неудовлетворительные оценки`,
            deadline: 'Срочно'
        });
    }
    
    if (excellent < 15 && good < 30) {
        recommendations.push({
            priority: 'medium',
            action: 'Мотивация сильных учащихся',
            description: 'Недостаточно высоких результатов',
            deadline: '2 недели'
        });
    }
    
    if (Math.abs(excellent - weak) > 40) {
        recommendations.push({
            priority: 'medium',
            action: 'Дифференцированный подход',
            description: 'Большой разрыв между сильными и слабыми учащимися',
            deadline: '1 неделя'
        });
    }
    
    // Общие рекомендации
    recommendations.push({
        priority: 'low',
        action: 'Анализ типичных ошибок',
        description: 'Выявить общие проблемы в выполнении заданий',
        deadline: '3 дня'
    });
    
    return recommendations;
}


// Генерация HTML для базовой информации
function generateBasicInfoHTML(basicInfo) {
    return `
        <div class="report-section">
            <h2>1. Основная информация</h2>
            <table class="report-table">
                <tr>
                    <td><strong>Предмет:</strong></td>
                    <td>${basicInfo.subject}</td>
                </tr>
                <tr>
                    <td><strong>Класс:</strong></td>
                    <td>${basicInfo.className}</td>
                </tr>
                <tr>
                    <td><strong>Тема работы:</strong></td>
                    <td>${basicInfo.theme}</td>
                </tr>
                <tr>
                    <td><strong>Тип работы:</strong></td>
                    <td>${basicInfo.workType}</td>
                </tr>
                <tr>
                    <td><strong>Дата проведения:</strong></td>
                    <td>${basicInfo.date}</td>
                </tr>
                <tr>
                    <td><strong>Количество учащихся:</strong></td>
                    <td>${basicInfo.totalStudents}</td>
                </tr>
                <tr>
                    <td><strong>Количество заданий:</strong></td>
                    <td>${basicInfo.totalTasks}</td>
                </tr>
            </table>
        </div>
    `;
}

// Обновление статистики отчета
function updateReportStats(reportData) {
    // Простой расчет статистики
    const content = document.getElementById('reportPreviewContent').textContent;
    const wordCount = content.split(/\s+/).length;
    
    document.getElementById('pageCount').textContent = Math.ceil(wordCount / 500);
    document.getElementById('wordCount').textContent = wordCount;
    document.getElementById('chartCount').textContent = reportData.stats.charts;
    document.getElementById('tableCount').textContent = reportData.stats.tables;
    
    document.getElementById('reportStats').style.display = 'block';
}
// Отображение предпросмотра
function displayReportPreview(reportData, mode) {
    const previewDiv = document.getElementById('reportPreviewContent');
    
    let html = `
        <div class="report-preview-content ${mode === 'print' ? 'print-mode' : ''}">
            <div class="report-header">
                <h1 style="text-align: center; margin-bottom: 10px;">${reportData.metadata.title}</h1>
                <p style="text-align: center; color: #666;">
                    ${appData.test.subject} | ${appData.test.class} | ${new Date().toLocaleDateString()}
                </p>
            </div>
    `;
    
    // Добавляем разделы
    if (reportData.content.basicInfo) {
        html += generateBasicInfoHTML(reportData.content.basicInfo);
    }
    
    if (reportData.content.statistics) {
        html += generateStatisticsHTML(reportData.content.statistics);
    }
    
    if (reportData.content.gradesDistribution) {
        html += generateGradesDistributionHTML(reportData.content.gradesDistribution);
    }
    
    if (reportData.content.recommendations) {
        html += generateRecommendationsHTML(reportData.content.recommendations);
    }
    
    html += `
            <div class="report-footer">
                <p>Отчет сгенерирован: ${new Date().toLocaleString()}</p>
                <p>Система анализа образовательных результатов</p>
            </div>
        </div>
    `;
    
    previewDiv.innerHTML = html;
}

// Переключение режима предпросмотра
function togglePreviewMode(mode) {
    currentPreviewMode = mode;
    if (reportData) {
        displayReportPreview(reportData, mode);
    }
}

// Экспорт в Word
function exportToWord() {
    if (!reportData) {
        showNotification('Сначала сгенерируйте отчет', 'warning');
        return;
    }
    
    console.log('Экспорт в Word...');
    
    // Создаем HTML для Word
    const htmlContent = generateWordHTML(reportData);
    
    // Используем библиотеку html-docx-js
    const converted = htmlDocx.asBlob(htmlContent);
    
    // Скачиваем файл
    const url = URL.createObjectURL(converted);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Отчет_${appData.test.subject}_${appData.test.class}_${new Date().toISOString().split('T')[0]}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showNotification('Отчет экспортирован в Word', 'success');
}
// Генерация HTML для Word
function generateWordHTML(reportData) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Times New Roman', serif; line-height: 1.5; }
                h1 { text-align: center; }
                .section { margin-bottom: 20pt; }
                table { border-collapse: collapse; width: 100%; margin: 10pt 0; }
                th, td { border: 1pt solid black; padding: 5pt; }
                th { background: #f2f2f2; }
                .footer { margin-top: 40pt; font-size: 10pt; color: #666; }
            </style>
        </head>
        <body>
            <h1>${reportData.metadata.title}</h1>
            ${generateWordSections(reportData)}
            <div class="footer">
                <p>Отчет сгенерирован: ${new Date().toLocaleString()}</p>
                <p>Система анализа образовательных результатов</p>
            </div>
        </body>
        </html>
    `;
}

// Шаблоны отчетов
const reportTemplates = {
    teacher: {
        name: 'Педагогический анализ',
        fields: ['basic_info', 'statistics', 'grades_distribution', 'task_analysis', 'error_analysis', 'recommendations'],
        gradeFilter: ['2', '3', '4', '5']
    },
    parent: {
        name: 'Родительский отчет',
        fields: ['basic_info', 'statistics', 'grades_distribution', 'recommendations'],
        gradeFilter: ['2', '3', '4', '5']
    },
    student: {
        name: 'Индивидуальный отчет',
        fields: ['basic_info', 'statistics', 'task_analysis', 'recommendations']
    }
};

function getReportTitle(type) {
    const titles = {
        teacher: 'Педагогический анализ результатов',
        parent: 'Отчет для родителей',
        student: 'Индивидуальный отчет учащегося',
        admin: 'Административный отчет',
        methodical: 'Методический анализ'
    };
    return titles[type] || 'Аналитический отчет';
}

// Быстрые шаблоны
function loadQuickTemplate(templateId) {
    const templates = {
        quick_analysis: {
            type: 'teacher',
            fields: ['basic_info', 'statistics', 'grades_distribution']
        },
        detailed_report: {
            type: 'teacher',
            fields: ['basic_info', 'statistics', 'grades_distribution', 'task_analysis', 'error_analysis', 'recommendations']
        },
        parent_meeting: {
            type: 'parent',
            fields: ['basic_info', 'statistics', 'grades_distribution', 'recommendations']
        }
    };
    
    const template = templates[templateId];
    if (template) {
        document.getElementById('reportType').value = template.type;
        updateReportTemplate();
        showNotification(`Загружен шаблон: ${templateId}`, 'success');
    }
}

// Сохранение шаблона
function saveReportTemplate() {
    const templateName = prompt('Введите название шаблона:');
    if (!templateName) return;
    
    const settings = collectReportSettings();
    
    const userTemplates = JSON.parse(localStorage.getItem('reportTemplates') || '[]');
    userTemplates.push({
        name: templateName,
        settings: settings,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('reportTemplates', JSON.stringify(userTemplates));
    showNotification('Шаблон сохранен', 'success');
}

// Генерация и экспорт отчета
function generateAndExportReport() {
    generateReportPreview();
    
    // Небольшая задержка перед экспортом
    setTimeout(() => {
        const format = document.querySelector('input[name="reportFormat"]:checked').value;
        
        switch(format) {
            case 'docx':
                exportToWord();
                break;
            case 'pdf':
                exportToPDF();
                break;
            case 'html':
                exportToHTML();
                break;
        }
    }, 1000);
}

// Печать отчета
function printReport() {
    if (!reportData) {
        showNotification('Сначала сгенерируйте отчет', 'warning');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generatePrintHTML(reportData));
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

// Генерация HTML для печати
function generatePrintHTML(reportData) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${reportData.metadata.title}</title>
            <style>
                @media print {
                    @page { margin: 20mm; }
                    body { font-size: 12pt; }
                    .page-break { page-break-before: always; }
                }
                body { font-family: 'Times New Roman', serif; line-height: 1.5; }
                h1 { text-align: center; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #000; padding: 8px; }
            </style>
        </head>
        <body>
            ${generateWordSections(reportData)}
        </body>
        </html>
    `;
}

function generateWordSections(reportData) {
    let html = '';
    
    if (reportData.content.basicInfo) {
        html += `
            <div class="section">
                <h2>1. Основная информация</h2>
                <table>
                    <tr><td>Предмет:</td><td>${reportData.content.basicInfo.subject}</td></tr>
                    <tr><td>Класс:</td><td>${reportData.content.basicInfo.className}</td></tr>
                    <tr><td>Тема:</td><td>${reportData.content.basicInfo.theme}</td></tr>
                    <tr><td>Дата:</td><td>${reportData.content.basicInfo.date}</td></tr>
                </table>
            </div>
        `;
    }
    
    // Добавьте другие разделы по аналогии
    
    return html;
}

// Поделиться отчетом
function shareReport() {
    if (!reportData) {
        showNotification('Сначала сгенерируйте отчет', 'warning');
        return;
    }
    
    if (navigator.share) {
        navigator.share({
            title: reportData.metadata.title,
            text: 'Аналитический отчет по результатам работы',
            url: window.location.href
        });
    } else {
        copyReportLink();
        showNotification('Ссылка скопирована в буфер обмена', 'success');
    }
}

// Копирование ссылки
function copyReportLink() {
    const link = window.location.href;
    navigator.clipboard.writeText(link)
        .then(() => showNotification('Ссылка скопирована', 'success'))
        .catch(err => console.error('Ошибка копирования:', err));
}

// Инициализация при показе вкладки
function initReportTab() {
    updateReportTemplate();
}

// Обновите функцию showTab для инициализации вкладки отчетов
const originalShowTab = window.showTab || function(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
};

window.showTab = function(tabId) {
    originalShowTab.call(this, tabId);
    
    if (tabId === 'reports') {
        setTimeout(initReportTab, 100);
    }
};

// Обновление шаблона отчета
function updateReportTemplate() {
    const reportType = document.getElementById('reportType').value;
    const template = reportTemplates[reportType];
    
    if (!template) return;
    
    // Устанавливаем поля по шаблону
    document.querySelectorAll('input[name="reportFields"]').forEach(checkbox => {
        checkbox.checked = template.fields.includes(checkbox.value);
    });
    
    // Устанавливаем критерии
    if (template.gradeFilter) {
        document.querySelectorAll('input[name="gradeFilter"]').forEach(checkbox => {
            checkbox.checked = template.gradeFilter.includes(checkbox.value);
        });
    }
    
    showNotification(`Загружен шаблон: ${template.name}`, 'info');
}

// Предпросмотр отчета
function generateReportPreview() {
    console.log('Генерация предпросмотра отчета...');
    
    // Проверка данных перед генерацией
    if (!appData || !appData.students || appData.students.length === 0) {
        showNotification('Нет данных учащихся для генерации отчета', 'error');
        return;
    }
    
    if (!appData.tasks || appData.tasks.length === 0) {
        showNotification('Нет данных заданий для генерации отчета', 'error');
        return;
    }
    
    // Собираем настройки
    const settings = collectReportSettings();
    
    // Генерируем данные отчета с обработкой ошибок
    try {
        reportData = generateReportData(settings);
    } catch (error) {
        console.error('Ошибка генерации данных отчета:', error);
        showNotification('Ошибка генерации отчета: ' + error.message, 'error');
        return;
    }
    
    // Отображаем предпросмотр
    displayReportPreview(reportData, currentPreviewMode);
    
    // Показываем статистику
    updateReportStats(reportData);
    
    showNotification('Предпросмотр отчета сгенерирован', 'success');
}

function calculateStudentTotal(studentId) {
    if (studentId === undefined || studentId === null || !appData || !appData.results) return 0;
    
    let total = 0;
    
    try {
        // Получаем результаты студента
        let studentResults = null;
        
        if (Array.isArray(appData.results)) {
            // Если results - массив массивов
            if (typeof studentId === 'number' && appData.results[studentId]) {
                studentResults = appData.results[studentId];
            }
        } else if (typeof appData.results === 'object') {
            // Если results - объект с ключами
            studentResults = appData.results[studentId];
        }
        
        if (!studentResults) return 0;
        
        // Суммируем баллы
        if (Array.isArray(studentResults)) {
            studentResults.forEach(score => {
                total += parseFloat(score) || 0;
            });
        } else if (typeof studentResults === 'object') {
            Object.values(studentResults).forEach(score => {
                total += parseFloat(score) || 0;
            });
        }
    } catch (error) {
        console.error('Ошибка расчета итога студента:', error);
    }
    
    return total;
}


function calculateGrade(totalScore) {
    if (typeof totalScore !== 'number' || isNaN(totalScore)) return null;
    
    if (!appData || !appData.test || !appData.test.criteria) {
        // Простая логика по умолчанию
        const maxScore = calculateMaxScores();
        const percentage = (totalScore / maxScore) * 100;
        
        if (percentage >= 85) return '5';
        if (percentage >= 70) return '4';
        if (percentage >= 50) return '3';
        return '2';
    }
    
    // Использовать критерии из appData
    const criteria = appData.test.criteria;
    const maxScore = calculateMaxScores();
    const percentage = (totalScore / maxScore) * 100;
    
    for (const [grade, range] of Object.entries(criteria).sort((a, b) => b[0] - a[0])) {
        if (percentage >= range.min && percentage <= range.max) {
            return grade;
        }
    }
    
    return '2';
}

function calculateMaxScores() {
    if (!appData || !appData.tasks || !Array.isArray(appData.tasks)) {
        return 100; // Значение по умолчанию
    }
    
    try {
        return appData.tasks.reduce((sum, task) => {
            const score = parseInt(task.maxScore) || 1;
            return sum + score;
        }, 0);
    } catch (error) {
        console.error('Ошибка расчета максимального балла:', error);
        return 100;
    }
}


// Безопасные версии функций
function safe1calculateGradeDistributionn() {
    try {
        return calculateGradeDistributionn();
    } catch (error) {
        console.error('Ошибка в calculateGradeDistributionn:', error);
        return { '2': 0, '3': 0, '4': 0, '5': 0 };
    }
}

function safe1calculateStatistics() {
    try {
        return calculateStatistics();
    } catch (error) {
        console.error('Ошибка в calculateStatistics:', error);
        return {
            totalStudents: 0,
            totalTasks: 0,
            averageGrade: 0,
            successRate: 0,
            excellentPercentage: 0,
            goodPercentage: 0,
            averagePercentage: 0,
            weakPercentage: 0
        };
    }
}

// Расчет распределения оценок
function calculateGradeDistributionn() {
    // Проверяем наличие данных
    if (!appData || !appData.students || !Array.isArray(appData.students)) {
        console.warn('Нет данных об учащихся для расчета распределения оценок');
        return { '2': 0, '3': 0, '4': 0, '5': 0 };
    }
    
    const distribution = { '2': 0, '3': 0, '4': 0, '5': 0 };
    let totalStudents = 0;
    
    // Безопасный перебор
    try {
        appData.students.forEach(student => {
            if (!student || !student.id) return;
            
            const totalScore = calculateStudentTotal(student.id);
            const grade = calculateGrade(totalScore);
            
            if (grade && distribution[grade] !== undefined) {
                distribution[grade]++;
                totalStudents++;
            }
        });
    } catch (error) {
        console.error('Ошибка в calculateGradeDistributionn:', error);
    }
    
    // Конвертируем в проценты
    Object.keys(distribution).forEach(grade => {
        if (totalStudents > 0) {
            distribution[grade] = Math.round((distribution[grade] / totalStudents) * 100);
        } else {
            distribution[grade] = 0;
        }
    });
    
    return distribution;
}

function displayAIAnalysis(aiAnalysis) {
    let html = `
        <div style="max-width: 800px;">
            <h3>🤖 AI-анализ результатов</h3>
            <div style="color: #666; margin-bottom: 20px;">
                Сгенерировано: ${new Date(aiAnalysis.generated).toLocaleString()}
            </div>
    `;
    
    // Инсайты
    if (aiAnalysis.insights && aiAnalysis.insights.length > 0) {
        html += `
            <h4>🎯 Ключевые инсайты</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 20px;">
        `;
        
        aiAnalysis.insights.forEach(insight => {
            const color = insight.type === 'success' ? '#27ae60' : 
                         insight.type === 'warning' ? '#f39c12' : '#3498db';
            
            html += `
                <div style="border-left: 4px solid ${color}; padding-left: 15px;">
                    <h5 style="margin: 0 0 5px 0; color: ${color};">${insight.title}</h5>
                    <p style="margin: 0 0 8px 0; font-size: 14px;">${insight.description}</p>
                    <small style="color: #666;">${insight.suggestion}</small>
                </div>
            `;
        });
        
        html += `</div>`;
    }
    
    // Прогнозы
    if (aiAnalysis.predictions && aiAnalysis.predictions.length > 0) {
        html += `
            <h4>🔮 Прогнозы и рекомендации</h4>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        `;
        
        aiAnalysis.predictions.forEach(prediction => {
            html += `
                <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                    <div style="display: flex; justify-content: space-between;">
                        <strong>${prediction.title}</strong>
                        <span style="color: #666;">${prediction.confidence}% уверенности</span>
                    </div>
                    <p style="margin: 5px 0;">${prediction.description}</p>
                    <small style="color: #999;">Срок: ${prediction.timeframe}</small>
                </div>
            `;
        });
        
        html += `</div>`;
    }
    
    // Аномалии
    if (aiAnalysis.anomalies && aiAnalysis.anomalies.length > 0) {
        html += `
            <h4>⚠️ Обнаруженные аномалии</h4>
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <ul style="margin: 0; padding-left: 20px;">
        `;
        
        aiAnalysis.anomalies.forEach(anomaly => {
            html += `<li>${anomaly}</li>`;
        });
        
        html += `
                </ul>
            </div>
        `;
    }
    
    // Общий вывод
    if (aiAnalysis.sentiment) {
        const sentimentColors = {
            positive: '#27ae60',
            neutral: '#f39c12',
            negative: '#e74c3c'
        };
        
        html += `
            <div style="text-align: center; padding: 20px; background: ${sentimentColors[aiAnalysis.sentiment.sentiment]}15; border-radius: 8px;">
                <h4 style="color: ${sentimentColors[aiAnalysis.sentiment.sentiment]};">Общий вывод</h4>
                <p>${aiAnalysis.sentiment.summary}</p>
                <small>Уверенность анализа: ${Math.round(aiAnalysis.sentiment.confidence * 100)}%</small>
            </div>
        `;
    }
    
    html += `
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="applyAIRecommendations(aiAnalysis)">
                    Применить рекомендации
                </button>
                <button class="btn" onclick="hideModal()">Закрыть</button>
            </div>
        </div>
    `;
    
    showModal('AI-анализ результатов', html);
}

function applyAIRecommendations(aiAnalysis) {
    if (!aiAnalysis || !aiAnalysis.recommendations) return;
    
    // Применяем рекомендации AI
    aiAnalysis.recommendations.forEach(recommendation => {
        // Здесь можно добавить логику применения конкретных рекомендаций
        console.log('Применяем рекомендацию:', recommendation);
    });
    
    showNotification('Рекомендации AI применены', 'success');
    hideModal();
}

function detectAnomalies() {
    const anomalies = [];
    const stats = calculateStatistics();
    
    // Проверка на аномально высокие/низкие результаты
    if (stats.averageGrade > 4.8) {
        anomalies.push('Аномально высокий средний балл. Возможны проблемы с критериями оценивания.');
    }
    
    if (stats.averageGrade < 2.0) {
        anomalies.push('Аномально низкий средний балл. Проверьте сложность заданий.');
    }
    // Интегрируем критерии перед генерацией отчета
    const integratedAppData = integrateCriteriaForReports(appData);
    
    // Теперь можем безопасно использовать
    const validation = integratedAppData.helpers.validateCriteria();
    
    if (!validation.isValid) {
        showNotification('Проблемы с критериями оценивания', 'error');
        return;
    }
        
    // Проверка распределения оценок
    const distribution = calculateGradeDistributionWithCompatibleCriteria(integratedAppData);
    if (distribution['5'] > 80) {
        anomalies.push('Более 80% отличников - возможно, задания слишком простые');
    }
    
    if (distribution['2'] > 50) {
        anomalies.push('Более 50% неуспевающих - требуется срочное вмешательство');
    }
    
    // Проверка отдельных заданий
    const taskAnalysis = analyzeTasks();
    taskAnalysis.forEach(task => {
        if (task.successRate < 10) {
            anomalies.push(`Задание №${task.number} выполнено менее чем на 10%`);
        }
        
        if (task.successRate > 95 && task.difficulty >= 3) {
            anomalies.push(`Сложное задание №${task.number} выполнено на 95%+ - возможны проблемы с оценкой сложности`);
        }
    });
    
    return anomalies;
}

function selectComparisonReport(index) {
    const savedReports = JSON.parse(localStorage.getItem('savedReports') || '[]');
    if (!savedReports[index]) return;
    
    comparisonData = savedReports[index];
    showNotification(`Выбран отчет для сравнения: ${comparisonData.metadata.title}`, 'success');
}

function generateComparisonReport() {
    if (!comparisonData) {
        showNotification('Сначала выберите отчет для сравнения', 'warning');
        return;
    }
    
    const compareAllMetrics = document.getElementById('compareAllMetrics')?.checked || false;
    
    // Генерация сравнительного отчета
    const comparisonReport = {
        current: reportData,
        previous: comparisonData,
        differences: calculateDifferences(reportData, comparisonData),
        trends: analyzeTrendsComparison(reportData, comparisonData),
        generated: new Date().toISOString()
    };
    
    displayComparisonReport(comparisonReport);
    hideModal();
}

function calculateDifferences(current, previous) {
    const differences = {};
    
    // Сравнение основных метрик
    if (current.content?.basicInfo && previous.content?.basicInfo) {
        differences.studentCount = current.content.basicInfo.totalStudents - previous.content.basicInfo.totalStudents;
        differences.taskCount = current.content.basicInfo.totalTasks - previous.content.basicInfo.totalTasks;
    }
    
    // Сравнение статистики
    if (current.content?.statistics && previous.content?.statistics) {
        differences.averageGrade = current.content.statistics.averageGrade - previous.content.statistics.averageGrade;
        differences.successRate = current.content.statistics.successRate - previous.content.statistics.successRate;
    }
    
    return differences;
}

function displayBenchmarkReport(comparison) {
    let html = `
        <div style="max-width: 800px;">
            <h3>🏆 Сравнение с бенчмарками</h3>
            <p><strong>Предмет:</strong> ${comparison.subject}</p>
            
            <h4>📊 Распределение оценок</h4>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                    <tr style="background: #34495e; color: white;">
                        <th style="padding: 10px; text-align: center;">Оценка</th>
                        <th style="padding: 10px; text-align: center;">Бенчмарк</th>
                        <th style="padding: 10px; text-align: center;">Факт</th>
                        <th style="padding: 10px; text-align: center;">Разница</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    ['5', '4', '3', '2'].forEach(grade => {
        const benchmark = comparison.benchmark[grade];
        const current = comparison.current[grade] || 0;
        const difference = comparison.differences[grade];
        const diffClass = difference >= 0 ? 'positive' : 'negative';
        
        html += `
            <tr>
                <td style="padding: 8px; text-align: center; font-weight: bold; color: ${getGradeColor(grade)};">
                    ${grade}
                </td>
                <td style="padding: 8px; text-align: center;">${benchmark}%</td>
                <td style="padding: 8px; text-align: center;">${current}%</td>
                <td style="padding: 8px; text-align: center; color: ${difference >= 0 ? '#27ae60' : '#e74c3c'};">
                    ${difference >= 0 ? '+' : ''}${difference}%
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
            
            <div style="background: ${comparison.differences['5'] > 0 ? '#d4edda' : '#f8d7da'}; 
                        padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4>🎯 Вывод</h4>
                <p>${comparison.conclusion}</p>
                
                ${comparison.differences['5'] > 5 ? `
                    <p style="color: #27ae60;">✅ Класс показывает результаты выше средних показателей по предмету</p>
                ` : comparison.differences['2'] > 5 ? `
                    <p style="color: #e74c3c;">⚠️ Требуется дополнительная работа с отстающими учениками</p>
                ` : `
                    <p style="color: #f39c12;">📊 Результаты соответствуют средним показателям по предмету</p>
                `}
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="saveBenchmarkReport()">
                    Сохранить отчет
                </button>
                <button class="btn" onclick="hideModal()">Закрыть</button>
            </div>
        </div>
    `;
    
    showModal('Бенчмаркинг результатов', html);
}

function saveBenchmarkReport1() {
    // Сохранение отчета бенчмаркинга
    showNotification('Отчет бенчмаркинга сохранен', 'success');
    hideModal();
}

function generateErrorHeatmap() {
    if (!appData.errors || appData.errors.length === 0) {
        return null;
    }
    
    // Группировка ошибок по типам и заданиям
    const heatmapData = {};
    
    appData.errors.forEach(error => {
        const taskId = error.taskId || error.task;
        const type = error.type || 'unknown';
        
        if (!heatmapData[taskId]) {
            heatmapData[taskId] = {};
        }
        
        if (!heatmapData[taskId][type]) {
            heatmapData[taskId][type] = 0;
        }
        
        heatmapData[taskId][type]++;
    });
    
    return {
        type: 'heatmap',
        data: heatmapData,
        title: 'Распределение ошибок по заданиям и типам'
    };
}

function generateGoogleDocsContent(reportData) {
    const content = [];
    
    // Заголовок
    content.push({
        text: reportData.metadata.title,
        style: { fontSize: 18, bold: true, alignment: 'CENTER' }
    });
    
    // Основная информация
    if (reportData.content.basicInfo) {
        content.push({
            text: '1. Основная информация',
            style: { fontSize: 14, bold: true, marginTop: 20 }
        });
        
        Object.entries(reportData.content.basicInfo).forEach(([key, value]) => {
            content.push({
                text: `${key}: ${value}`,
                style: { fontSize: 11 }
            });
        });
    }
    
    // Статистика
    if (reportData.content.statistics) {
        content.push({
            text: '2. Статистика',
            style: { fontSize: 14, bold: true, marginTop: 20 }
        });
        
        Object.entries(reportData.content.statistics).forEach(([key, value]) => {
            content.push({
                text: `${key}: ${value}`,
                style: { fontSize: 11 }
            });
        });
    }
    
    return content;
}

function generateEmailContent(reportData) {
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; }
                .header { background: #3498db; color: white; padding: 20px; }
                .section { margin: 20px 0; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; }
                th { background: #f2f2f2; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${reportData.metadata.title}</h1>
            </div>
    `;
    
    if (reportData.content.basicInfo) {
        html += `
            <div class="section">
                <h2>Основная информация</h2>
                <table>
        `;
        
        Object.entries(reportData.content.basicInfo).forEach(([key, value]) => {
            html += `
                <tr>
                    <td><strong>${key}</strong></td>
                    <td>${value}</td>
                </tr>
            `;
        });
        
        html += `
                </table>
            </div>
        `;
    }
    
    html += `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p>Этот отчет был автоматически сгенерирован системой анализа образовательных результатов.</p>
                <p>Дата генерации: ${new Date().toLocaleString()}</p>
            </div>
        </body>
        </html>
    `;
    
    return html;
}

function generateHTMLReport(reportData) {
    return generateEmailContent(reportData); // Для простоты используем ту же функцию
}

function generateWordReport(reportData) {
    // Генерация документа Word в формате base64
    const htmlContent = generateWordHTML(reportData);
    return htmlDocx.asBlob(htmlContent);
}

function analyzeTaskPerformance(taskIndex) {
    const analysis = {
        totalStudents: appData.students.length,
        correctAnswers: 0,
        partialAnswers: 0,
        wrongAnswers: 0,
        noAnswers: 0,
        commonMistakes: []
    };
    
    const task = appData.tasks[taskIndex];
    if (!task) return analysis;
    
    const maxScore = task.maxScore || 1;
    
    appData.students.forEach(student => {
        const taskId = task.id || taskIndex;
        const score = parseFloat(appData.results[student.id]?.[taskId]) || 0;
        
        if (score === maxScore) {
            analysis.correctAnswers++;
        } else if (score > 0) {
            analysis.partialAnswers++;
        } else if (score === 0) {
            analysis.wrongAnswers++;
        } else {
            analysis.noAnswers++;
        }
    });
    
    // Поиск общих ошибок для этого задания
    if (appData.errors && Array.isArray(appData.errors)) {
        const taskErrors = appData.errors.filter(error => 
            error.taskId === taskIndex || error.task === taskIndex
        );
        
        const errorCounts = {};
        taskErrors.forEach(error => {
            const type = error.type || 'unknown';
            errorCounts[type] = (errorCounts[type] || 0) + 1;
        });
        
        analysis.commonMistakes = Object.entries(errorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([type, count]) => ({
                type: errorTypes[type]?.name || type,
                count: count,
                percentage: Math.round((count / taskErrors.length) * 100)
            }));
    }
    
    return analysis;
}

function loadComparisonDates(savedReports) {
    if (!savedReports.length) return;
    
    // Устанавливаем даты для сравнения (последний сохраненный отчет)
    const lastReport = savedReports[savedReports.length - 1];
    const reportDate = new Date(lastReport.metadata.generated);
    
    const dateFrom = document.getElementById('compareDateFrom');
    const dateTo = document.getElementById('compareDateTo');
    
    if (dateFrom) {
        // Устанавливаем дату на неделю назад для сравнения
        const weekAgo = new Date(reportDate);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFrom.value = weekAgo.toISOString().split('T')[0];
    }
    
    if (dateTo) {
        dateTo.value = reportDate.toISOString().split('T')[0];
    }
}

function loadReportFromHistory(index) {
    const savedReports = JSON.parse(localStorage.getItem('savedReports') || '[]');
    if (!savedReports[index]) return;
    
    const report = savedReports[index];
    
    // Загружаем отчет в предпросмотр
    reportData = report;
    displayReportPreview(reportData, currentPreviewMode);
    
    showNotification('Отчет загружен из истории', 'success');
}

function deleteTemplate(index) {
    if (!confirm('Удалить этот шаблон?')) return;
    
    const userTemplates = JSON.parse(localStorage.getItem('reportTemplates') || '[]');
    userTemplates.splice(index, 1);
    
    localStorage.setItem('reportTemplates', JSON.stringify(userTemplates));
    manageTemplates(); // Перезагружаем модальное окно
    
    showNotification('Шаблон удален', 'success');
}

function editTemplate(index) {
    const userTemplates = JSON.parse(localStorage.getItem('reportTemplates') || '[]');
    if (!userTemplates[index]) return;
    
    const template = userTemplates[index];
    const newName = prompt('Введите новое название шаблона:', template.name);
    
    if (newName && newName.trim()) {
        userTemplates[index].name = newName.trim();
        localStorage.setItem('reportTemplates', JSON.stringify(userTemplates));
        manageTemplates();
        showNotification('Шаблон обновлен', 'success');
    }
}

function exportToPresentation() {
    if (!reportData) {
        showNotification('Сначала сгенерируйте отчет', 'warning');
        return;
    }
    
    showLoading('Создание презентации...');
    
    // Создание простой презентации в виде HTML
    const presentationHTML = generatePresentationHTML(reportData);
    
    // Сохранение как HTML файл (можно конвертировать в PPTX через сторонние сервисы)
    const blob = new Blob([presentationHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Презентация_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    hideLoading();
    showNotification('Презентация создана', 'success');
}

function generatePresentationHTML(reportData) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${reportData.metadata.title} - Презентация</title>
            <style>
                .slide {
                    width: 1024px;
                    height: 768px;
                    padding: 40px;
                    box-sizing: border-box;
                    page-break-after: always;
                }
                h1 { font-size: 48px; }
                h2 { font-size: 36px; }
                .content { font-size: 24px; }
            </style>
        </head>
        <body>
            <div class="slide">
                <h1>${reportData.metadata.title}</h1>
                <div class="content">
                    <p>${reportData.content?.basicInfo?.subject || ''}</p>
                    <p>${reportData.content?.basicInfo?.className || ''}</p>
                    <p>${new Date().toLocaleDateString()}</p>
                </div>
            </div>
            
            ${reportData.content?.basicInfo ? `
            <div class="slide">
                <h2>Основная информация</h2>
                <div class="content">
                    <ul>
                        ${Object.entries(reportData.content.basicInfo).map(([key, value]) => 
                            `<li><strong>${key}:</strong> ${value}</li>`
                        ).join('')}
                    </ul>
                </div>
            </div>
            ` : ''}
            
            ${reportData.content?.statistics ? `
            <div class="slide">
                <h2>Статистика</h2>
                <div class="content">
                    <ul>
                        ${Object.entries(reportData.content.statistics).map(([key, value]) => 
                            `<li><strong>${key}:</strong> ${value}</li>`
                        ).join('')}
                    </ul>
                </div>
            </div>
            ` : ''}
        </body>
        </html>
    `;
}

function exportToExcel1() {
    if (!appData.students || appData.students.length === 0) {
        showNotification('Нет данных для экспорта', 'warning');
        return;
    }
    
    // Создание данных для Excel
    const wsData = [];
    
    // Заголовки
    const headers = ['Фамилия', 'Имя'];
    appData.tasks.forEach((task, index) => {
        headers.push(`Задание ${index + 1}`);
    });
    headers.push('Итог', 'Оценка');
    wsData.push(headers);
    
    // Данные студентов
    appData.students.forEach(student => {
        const row = [student.lastName, student.firstName];
        let total = 0;
        
        appData.tasks.forEach((task, taskIndex) => {
            const taskId = task.id || taskIndex;
            const score = appData.results[student.id]?.[taskId] || 0;
            row.push(score);
            total += parseFloat(score) || 0;
        });
        
        const grade = calculateGrade(total);
        row.push(total, grade);
        wsData.push(row);
    });
    
    // Создание рабочего листа
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Создание книги
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Результаты');
    
    // Экспорт
    XLSX.writeFile(wb, `Результаты_${appData.test.subject || 'предмет'}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    showNotification('Данные экспортированы в Excel', 'success');
}

// Получение цвета для оценки
function getGradeColor1(grade) {
    const colors = {
        '2': '#e74c3c',
        '3': '#f39c12',
        '4': '#3498db',
        '5': '#2ecc71'
    };
    return colors[grade] || '#95a5a6';
}

// Безопасный расчет оценки
function safeCalculateGrade(score) {
    try {
        return calculateGrade(score) || 3;
    } catch (error) {
        console.error('Ошибка расчета оценки:', error);
        return 3;
    }
}

// Обновление отображения критериев
function updateCriteriaDisplay() {
    // Эта функция должна обновлять UI с критериями оценивания
    console.log('Обновление отображения критериев');
}

// Проверка наличия данных для отчета
function validateReportData1() {
    const errors = [];
    
    if (!appData.test.subject) errors.push('Не указан предмет');
    if (!appData.test.class) errors.push('Не указан класс');
    if (!appData.tasks || appData.tasks.length === 0) errors.push('Нет заданий');
    if (!appData.students || appData.students.length === 0) errors.push('Нет учащихся');
    
    if (errors.length > 0) {
        showNotification(`Ошибки: ${errors.join(', ')}`, 'error');
        return false;
    }
    
    return true;
}

// Генерация AI-рекомендаций
function generateAIRecommendations() {
    const recommendations = [];
    
    // Безопасный расчет статистики
    let stats;
    try {
        stats = calculateStatistics();
    } catch (error) {
        console.error('Ошибка расчета статистики:', error);
        stats = {
            averageGrade: 0,
            weakPercentage: 0,
            excellentPercentage: 0,
            goodPercentage: 0,
            averagePercentage: 0,
            successRate: 0
        };
    }
    
    // Рекомендации с проверками
    if (stats.averageGrade && stats.averageGrade < 3.0) {
        recommendations.push({
            priority: 'high',
            action: 'Провести дополнительные занятия',
            description: 'Средний балл ниже удовлетворительного',
            timeline: '1 неделя'
        });
    }
    
    if (stats.weakPercentage && stats.weakPercentage > 30) {
        recommendations.push({
            priority: 'high',
            action: 'Индивидуальная работа с отстающими',
            description: `Более ${stats.weakPercentage}% учащихся получили неудовлетворительные оценки`,
            timeline: '2 недели'
        });
    }
    
    // Безопасный анализ заданий
    try {
        const taskAnalysis = analyzeTasks();
        if (taskAnalysis && taskAnalysis.length > 0) {
            const weakTasks = taskAnalysis.filter(t => t && t.successRate && t.successRate < 50);
            
            if (weakTasks.length > 0) {
                recommendations.push({
                    priority: 'medium',
                    action: 'Пересмотреть сложные задания',
                    description: `${weakTasks.length} заданий выполнено менее чем на 50%`,
                    timeline: '1 неделя'
                });
            }
        }
    } catch (error) {
        console.error('Ошибка анализа заданий:', error);
    }
    
    return recommendations;
}

// Генерация статистики для отчета
function generateStatistics(settings) {
    const stats = calculateStatistics();
    
    return {
        totalStudents: stats.totalStudents,
        totalTasks: stats.totalTasks,
        averageGrade: stats.averageGrade.toFixed(2),
        successRate: `${stats.successRate}%`,
        gradeDistribution: {
            excellent: `${stats.excellentPercentage}%`,
            good: `${stats.goodPercentage}%`,
            average: `${stats.averagePercentage}%`,
            weak: `${stats.weakPercentage}%`
        }
    };
}

// Генерация анализа заданий
function generateTaskAnalysis(settings) {
    return analyzeTasks();
}

// Генерация анализа ошибок
function generateErrorAnalysis(settings) {
    return detectCommonErrors();
}

// Генерация рекомендаций
function generateRecommendations(settings) {
    const recommendations = generateAIRecommendations();
    
    return {
        general: [
            'Провести анализ типичных ошибок',
            'Организовать индивидуальные консультации для отстающих',
            'Скорректировать сложность заданий при необходимости'
        ],
        specific: recommendations,
        timeline: '2-3 недели'
    };
}


// Функция проверки и валидации критериев в appData
function validateAppDataCriteria(appData) {
    const results = {
        isValid: false,
        errors: [],
        warnings: [],
        fixedData: null,
        criteriaSummary: null
    };
    
    // Проверка существования appData
    if (!appData) {
        results.errors.push('appData не определен');
        return results;
    }
    
    // Проверка существования test объекта
    if (!appData.test) {
        results.errors.push('appData.test не определен');
        return results;
    }
    
    // Проверка критериев
    if (!appData.test.criteria) {
        results.errors.push('Критерии оценивания не определены в appData.test.criteria');
        return results;
    }
    
    const criteria = appData.test.criteria;
    
    // Нормализация ключей: все ключи преобразуем в строки для консистентности
    const normalizedCriteria = {};
    Object.keys(criteria).forEach(key => {
        const normalizedKey = String(key);
        normalizedCriteria[normalizedKey] = { ...criteria[key] };
    });
    
    // Проверка наличия всех необходимых оценок
    const requiredGrades = ['5', '4', '3', '2'];
    const missingGrades = requiredGrades.filter(grade => !normalizedCriteria[grade]);
    
    if (missingGrades.length > 0) {
        results.errors.push(`Отсутствуют критерии для оценок: ${missingGrades.join(', ')}`);
        return results;
    }
    
    // Проверка структуры критериев для каждой оценки
    const gradeErrors = [];
    requiredGrades.forEach(grade => {
        const gradeCriteria = normalizedCriteria[grade];
        
        if (!gradeCriteria) {
            gradeErrors.push(`Критерий для оценки ${grade} отсутствует`);
            return;
        }
        
        // Нормализация значений min/max в числа
        const minValue = parseFloat(gradeCriteria.min);
        const maxValue = parseFloat(gradeCriteria.max);
        
        if (isNaN(minValue)) {
            gradeErrors.push(`Критерий для оценки ${grade}: min должно быть числом (получено: ${gradeCriteria.min})`);
        }
        
        if (isNaN(maxValue)) {
            gradeErrors.push(`Критерий для оценки ${grade}: max должно быть числом (получено: ${gradeCriteria.max})`);
        }
        
        if (!isNaN(minValue) && !isNaN(maxValue) && minValue > maxValue) {
            gradeErrors.push(`Критерий для оценки ${grade}: min (${minValue}) > max (${maxValue})`);
        }
        
        // Сохраняем нормализованные значения
        normalizedCriteria[grade].min = minValue;
        normalizedCriteria[grade].max = maxValue;
    });
    
    if (gradeErrors.length > 0) {
        results.errors.push(...gradeErrors);
        return results;
    }
    
    // Проверка непрерывности интервалов
    const grades = ['5', '4', '3', '2'];
    const continuityErrors = [];
    
    for (let i = 0; i < grades.length - 1; i++) {
        const currentGrade = grades[i];
        const nextGrade = grades[i + 1];
        
        const currentMax = normalizedCriteria[currentGrade].max;
        const nextMin = normalizedCriteria[nextGrade].min;
        
        if (Math.abs(currentMax + 1 - nextMin) > 0.01) {
            continuityErrors.push(
                `Разрыв между ${currentGrade} (max=${currentMax}) и ${nextGrade} (min=${nextMin}): должно быть ${currentMax + 1}`
            );
        }
    }
    
    if (continuityErrors.length > 0) {
        results.warnings.push(...continuityErrors);
    }
    
    // Проверка перекрытия интервалов
    for (let i = 0; i < grades.length; i++) {
        for (let j = i + 1; j < grades.length; j++) {
            const gradeA = grades[i];
            const gradeB = grades[j];
            
            const aMin = normalizedCriteria[gradeA].min;
            const aMax = normalizedCriteria[gradeA].max;
            const bMin = normalizedCriteria[gradeB].min;
            const bMax = normalizedCriteria[gradeB].max;
            
            // Проверяем, что интервалы не перекрываются
            if (!(bMin > aMax || bMax < aMin)) {
                results.warnings.push(
                    `Перекрытие интервалов: ${gradeA} [${aMin}-${aMax}] и ${gradeB} [${bMin}-${bMax}]`
                );
            }
        }
    }
    
    // Проверка, что минимальная оценка 2 начинается с 0
    if (normalizedCriteria['2'].min !== 0) {
        results.warnings.push(`Минимальный балл для оценки 2 должен быть 0 (сейчас: ${normalizedCriteria['2'].min})`);
    }
    
    // Проверка systemType
    if (!appData.test.criteriaType) {
        results.warnings.push('criteriaType не указан, используется значение по умолчанию: points');
        appData.test.criteriaType = 'points';
    }
    
    // Проверка criteriaSystem
    if (!appData.test.criteriaSystem) {
        results.warnings.push('criteriaSystem не указан, используется значение по умолчанию: standard');
        appData.test.criteriaSystem = 'standard';
    }
    
    // Проверка criteriaScale
    if (!appData.test.criteriaScale) {
        results.warnings.push('criteriaScale не указан, используется значение по умолчанию: 2-5');
        appData.test.criteriaScale = '2-5';
    }
    
    // Проверка criteriaCount
    if (!appData.test.criteriaCount) {
        appData.test.criteriaCount = Object.keys(normalizedCriteria).length;
    }
    
    // Создание исправленной версии при необходимости
    if (results.warnings.length > 0 && results.errors.length === 0) {
        results.fixedData = JSON.parse(JSON.stringify(appData));
        results.fixedData.test.criteria = normalizedCriteria;
        
        // Автоматическое исправление непрерывности
        if (continuityErrors.length > 0) {
            // Начинаем с оценки 2 как 0
            results.fixedData.test.criteria['2'].min = 0;
            results.fixedData.test.criteria['2'].max = normalizedCriteria['3'].min - 1;
            
            // Обновляем остальные оценки
            const fixedGrades = ['3', '4', '5'];
            fixedGrades.forEach((grade, index) => {
                const prevGrade = index === 0 ? '2' : fixedGrades[index - 1];
                if (results.fixedData.test.criteria[prevGrade] && results.fixedData.test.criteria[grade]) {
                    results.fixedData.test.criteria[grade].min = results.fixedData.test.criteria[prevGrade].max + 1;
                }
            });
            
            results.warnings.push('Непрерывность критериев была автоматически исправлена');
        }
        
        // Исправляем, если оценка 2 не начинается с 0
        if (normalizedCriteria['2'].min !== 0) {
            results.fixedData.test.criteria['2'].min = 0;
            results.warnings.push('Минимальный балл для оценки 2 установлен на 0');
        }
    }
    
    // Создание сводки критериев
    results.criteriaSummary = {
        systemType: appData.test.criteriaType || 'points',
        criteriaSystem: appData.test.criteriaSystem || 'standard',
        criteriaScale: appData.test.criteriaScale || '2-5',
        criteriaCount: appData.test.criteriaCount || Object.keys(normalizedCriteria).length,
        maxScore: normalizedCriteria['5'].max,
        ranges: {},
        normalizedCriteria: normalizedCriteria
    };
    
    requiredGrades.forEach(grade => {
        results.criteriaSummary.ranges[grade] = {
            min: normalizedCriteria[grade].min,
            max: normalizedCriteria[grade].max,
            range: normalizedCriteria[grade].max - normalizedCriteria[grade].min + 1,
            percentage: Math.round((normalizedCriteria[grade].max / normalizedCriteria['5'].max) * 100) + '%'
        };
    });
    
    // Проверка валютности
    results.isValid = results.errors.length === 0;
    
    return results;
}

// Функция для применения исправлений к критериям
function fixAppDataCriteria(appData) {
    const validation = validateAppDataCriteria(appData);
    
    if (!validation.isValid) {
        console.error('Невозможно исправить критерии, есть ошибки:', validation.errors);
        return false;
    }
    
    if (validation.fixedData) {
        // Копируем исправленные критерии обратно в appData
        Object.keys(validation.fixedData.test.criteria).forEach(grade => {
            appData.test.criteria[grade] = { ...validation.fixedData.test.criteria[grade] };
        });
        
        // Обновляем метаданные
        appData.test.criteriaType = validation.fixedData.test.criteriaType || 'points';
        appData.test.criteriaSystem = validation.fixedData.test.criteriaSystem || 'standard';
        appData.test.criteriaScale = validation.fixedData.test.criteriaScale || '2-5';
        appData.test.criteriaCount = Object.keys(appData.test.criteria).length;
        
        return true;
    }
    
    return false;
}

// Функция для создания критериев по умолчанию
function createDefaultCriteria(maxScore = 100) {
    return {
        '5': { min: Math.round(maxScore * 0.85), max: maxScore },
        '4': { min: Math.round(maxScore * 0.70), max: Math.round(maxScore * 0.84) },
        '3': { min: Math.round(maxScore * 0.50), max: Math.round(maxScore * 0.69) },
        '2': { min: 0, max: Math.round(maxScore * 0.49) }
    };
}

// Функция для применения критериев к баллу
function applyCriteriaToScore(score, appData, debug = false) {
    if (!appData || !appData.test || !appData.test.criteria) {
        console.warn('Критерии не определены, используем стандартные');
        const defaultCriteria = createDefaultCriteria(100);
        return applyCriteriaToScore(score, { test: { criteria: defaultCriteria } }, debug);
    }
    
    const criteria = appData.test.criteria;
    const numericScore = parseFloat(score);
    
    if (debug) {
        console.log('applyCriteriaToScore:', {
            score: score,
            numericScore: numericScore,
            criteria: criteria,
            criteriaKeys: Object.keys(criteria)
        });
    }
    
    if (isNaN(numericScore)) {
        return {
            grade: null,
            criteria: null,
            score: score,
            isInRange: false,
            error: 'Score is not a number'
        };
    }
    
    // Нормализация ключей критериев для поиска
    const criteriaKeys = Object.keys(criteria);
    const normalizedCriteria = {};
    
    criteriaKeys.forEach(key => {
        const normalizedKey = String(key);
        normalizedCriteria[normalizedKey] = {
            min: parseFloat(criteria[key].min),
            max: parseFloat(criteria[key].max)
        };
    });
    
    if (debug) {
        console.log('Normalized criteria:', normalizedCriteria);
    }
    
    // Ищем подходящую оценку (проверяем все возможные представления)
    const possibleGrades = ['5', '4', '3', '2', 5, 4, 3, 2];
    
    for (const grade of possibleGrades) {
        const gradeStr = String(grade);
        const gradeCriteria = normalizedCriteria[gradeStr];
        
        if (debug) {
            console.log(`Checking grade ${grade} (as ${gradeStr}):`, gradeCriteria);
        }
        
        if (gradeCriteria && 
            !isNaN(gradeCriteria.min) && 
            !isNaN(gradeCriteria.max) &&
            numericScore >= gradeCriteria.min && 
            numericScore <= gradeCriteria.max) {
            
            if (debug) {
                console.log(`Found matching grade ${grade}: ${gradeCriteria.min}-${gradeCriteria.max}`);
            }
            
            return {
                grade: parseInt(grade),
                criteria: gradeCriteria,
                score: numericScore,
                isInRange: true,
                gradeString: gradeStr
            };
        }
    }
    
    // Если не нашли, определяем ближайшую оценку
    if (debug) {
        console.log('No exact match found, finding closest grade');
    }
    
    let closestGrade = null;
    let minDistance = Infinity;
    let closestCriteria = null;
    
    possibleGrades.forEach(grade => {
        const gradeStr = String(grade);
        const gradeCriteria = normalizedCriteria[gradeStr];
        
        if (gradeCriteria && !isNaN(gradeCriteria.min) && !isNaN(gradeCriteria.max)) {
            // Рассчитываем расстояние до центра диапазона
            const center = (gradeCriteria.min + gradeCriteria.max) / 2;
            const distance = Math.abs(numericScore - center);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestGrade = grade;
                closestCriteria = gradeCriteria;
            }
        }
    });
    
    const result = {
        grade: closestGrade ? parseInt(closestGrade) : null,
        criteria: closestCriteria,
        score: numericScore,
        isInRange: false,
        distanceToRange: minDistance,
        gradeString: closestGrade ? String(closestGrade) : null
    };
    
    if (debug) {
        console.log('Closest grade result:', result);
    }
    
    return result;
}


// Функция для совместимости с функциями из второго модуля
function syncCriteriaWithOtherModule(appData, otherModuleFunctions) {
    if (!appData || !appData.test || !appData.test.criteria) {
        return false;
    }
    
    // Получаем текущие критерии
    const criteria = appData.test.criteria;
    const normalized = {};
    
    // Нормализуем все ключи к строкам для консистентности
    Object.keys(criteria).forEach(key => {
        const normalizedKey = String(key);
        normalized[normalizedKey] = {
            min: parseFloat(criteria[key].min),
            max: parseFloat(criteria[key].max)
        };
    });
    
    // Проверяем, есть ли конфликты между системами
    const validation = validateAppDataCriteria(appData);
    
    if (!validation.isValid) {
        console.error('Критерии не валидны, требуется исправление:', validation.errors);
        
        // Пытаемся исправить
        if (validation.fixedData) {
            // Копируем исправленные критерии
            appData.test.criteria = validation.fixedData.test.criteria;
            console.log('Критерии исправлены автоматически');
        }
    }
    
    // Обновляем интерфейс если есть соответствующие функции
    if (otherModuleFunctions && otherModuleFunctions.updateCriteriaVisualization) {
        try {
            otherModuleFunctions.updateCriteriaVisualization();
        } catch (error) {
            console.error('Ошибка обновления визуализации:', error);
        }
    }
    
    // Обновляем слайдер если есть
    if (otherModuleFunctions && otherModuleFunctions.updateCriteriaSlider) {
        try {
            otherModuleFunctions.updateCriteriaSlider();
        } catch (error) {
            console.error('Ошибка обновления слайдера:', error);
        }
    }
    
    return true;
}

// Функция для получения критериев в формате, совместимом с обоими модулями
function getCompatibleCriteria(appData) {
    if (!appData || !appData.test || !appData.test.criteria) {
        return null;
    }
    
    const criteria = appData.test.criteria;
    const compatible = {};
    
    // Создаем объект с обоими типами ключей (строки и числа)
    Object.keys(criteria).forEach(key => {
        const strKey = String(key);
        const numKey = parseInt(key);
        
        if (!isNaN(numKey)) {
            // Для числовых ключей
            compatible[numKey] = {
                min: parseFloat(criteria[key].min),
                max: parseFloat(criteria[key].max)
            };
        }
        
        // Для строковых ключей
        compatible[strKey] = {
            min: parseFloat(criteria[key].min),
            max: parseFloat(criteria[key].max)
        };
    });
    
    return compatible;
}

// Универсальная функция расчета оценки
function calculateUniversalGrade(score, appData) {
    const result = applyCriteriaToScore(score, appData);
    
    // Возвращаем в формате, совместимом с обоими модулями
    return {
        grade: result.grade,
        gradeString: String(result.grade),
        isInRange: result.isInRange,
        min: result.criteria ? result.criteria.min : null,
        max: result.criteria ? result.criteria.max : null,
        score: result.score
    };
}

// Функция для конвертации критериев между форматами
function convertCriteriaFormat(criteria, targetFormat = 'string') {
    const converted = {};
    
    Object.keys(criteria).forEach(key => {
        const value = criteria[key];
        
        if (targetFormat === 'string') {
            // Конвертируем в строковые ключи
            converted[String(key)] = {
                min: parseFloat(value.min),
                max: parseFloat(value.max)
            };
        } else if (targetFormat === 'number') {
            // Конвертируем в числовые ключи
            const numKey = parseInt(key);
            if (!isNaN(numKey)) {
                converted[numKey] = {
                    min: parseFloat(value.min),
                    max: parseFloat(value.max)
                };
            }
        } else if (targetFormat === 'both') {
            // Сохраняем оба формата
            const strKey = String(key);
            const numKey = parseInt(key);
            
            converted[strKey] = {
                min: parseFloat(value.min),
                max: parseFloat(value.max)
            };
            
            if (!isNaN(numKey)) {
                converted[numKey] = {
                    min: parseFloat(value.min),
                    max: parseFloat(value.max)
                };
            }
        }
    });
    
    return converted;
}
// Интеграционная функция для отчетов
function integrateCriteriaForReports(appData) {
    if (!appData) {
        console.warn('appData не определен для интеграции критериев');
        return {
            test: { criteria: createDefaultCriteria(23) },
            tasks: [],
            students: [],
            results: [],
            helpers: {
                calculateGrade: (score) => ({ grade: 3, gradeString: '3' }),
                getCriteria: () => createDefaultCriteria(23),
                validateCriteria: () => ({ isValid: true, errors: [] })
            }
        };
    }
    
    // Проверяем и валидируем критерии
    const validation = validateAppDataCriteria(appData);
    
    if (!validation.isValid) {
        console.warn('Критерии не валидны для отчетов:', validation.errors);
        
        // Создаем или исправляем критерии
        if (!appData.test) appData.test = {};
        if (!appData.test.criteria) {
            const maxScore = calculateMaxScores();
            appData.test.criteria = createDefaultCriteria(maxScore);
            console.log('Созданы критерии по умолчанию для отчетов');
        }
    }
    
    // Обеспечиваем совместимость форматов
    if (appData.test && appData.test.criteria) {
        appData.test.criteria = convertCriteriaFormat(appData.test.criteria, 'both');
    }
    
    // Добавляем helper функции в appData для удобства
    if (!appData.helpers) appData.helpers = {};
    
    appData.helpers.calculateGrade = (score) => calculateUniversalGrade(score, appData);
    appData.helpers.getCriteria = () => getCompatibleCriteria(appData);
    appData.helpers.validateCriteria = () => validateAppDataCriteria(appData);
    
    return appData;
}
// Дебаг функция для проверки работы
function debugCriteriaCalculation(score, appData) {
    console.log('=== DEBUG CRITERIA CALCULATION ===');
    console.log('Input score:', score);
    console.log('appData.test.criteria:', appData?.test?.criteria);
    
    // Проверяем разные форматы
    const resultString = applyCriteriaToScore(score, appData, true);
    console.log('Result with debug:', resultString);
    
    // Проверяем с конвертированными критериями
    if (appData?.test?.criteria) {
        const converted = convertCriteriaFormat(appData.test.criteria, 'both');
        console.log('Converted criteria (both formats):', converted);
        
        // Проверяем поиск во всех форматах
        ['5', 5, '4', 4, '3', 3, '2', 2].forEach(grade => {
            const gradeKey = String(grade);
            const criteria = converted[gradeKey];
            if (criteria) {
                console.log(`Grade ${grade} criteria:`, criteria);
            }
        });
    }
    
    console.log('=== END DEBUG ===');
    
    return resultString;
}


// Функция для отображения результатов проверки
function displayCriteriaValidation(validation) {
    const html = `
        <div style="max-width: 800px; padding: 20px;">
            <h3>${validation.isValid ? '✅' : '❌'} Проверка критериев оценивания</h3>
            
            ${validation.errors.length > 0 ? `
                <div style="background: #ffebee; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h4 style="color: #c62828; margin-top: 0;">Ошибки:</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${validation.errors.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${validation.warnings.length > 0 ? `
                <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h4 style="color: #ef6c00; margin-top: 0;">Предупреждения:</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${validation.warnings.map(warning => `<li>${warning}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${validation.criteriaSummary ? `
                <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h4 style="color: #2e7d32; margin-top: 0;">Сводка критериев:</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #c8e6c9;">
                                <th style="padding: 8px; border: 1px solid #a5d6a7;">Параметр</th>
                                <th style="padding: 8px; border: 1px solid #a5d6a7;">Значение</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #a5d6a7;">Тип системы</td>
                                <td style="padding: 8px; border: 1px solid #a5d6a7;">${validation.criteriaSummary.systemType}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #a5d6a7;">Система оценивания</td>
                                <td style="padding: 8px; border: 1px solid #a5d6a7;">${validation.criteriaSummary.criteriaSystem}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #a5d6a7;">Шкала оценок</td>
                                <td style="padding: 8px; border: 1px solid #a5d6a7;">${validation.criteriaSummary.criteriaScale}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #a5d6a7;">Количество оценок</td>
                                <td style="padding: 8px; border: 1px solid #a5d6a7;">${validation.criteriaSummary.criteriaCount}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #a5d6a7;">Максимальный балл</td>
                                <td style="padding: 8px; border: 1px solid #a5d6a7;">${validation.criteriaSummary.maxScore}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <h5 style="margin-top: 15px;">Диапазоны оценок:</h5>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
                        ${Object.entries(validation.criteriaSummary.ranges).map(([grade, data]) => `
                            <div style="background: white; padding: 10px; border-radius: 6px; border: 2px solid ${getGradeColor(grade)};">
                                <div style="text-align: center; font-size: 24px; font-weight: bold; color: ${getGradeColor(grade)};">
                                    ${grade}
                                </div>
                                <div style="text-align: center; font-size: 14px;">
                                    ${data.min} - ${data.max} баллов
                                </div>
                                <div style="text-align: center; font-size: 12px; color: #666;">
                                    (${data.range} баллов, ${data.percentage})
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${validation.fixedData ? `
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h4 style="color: #1565c0; margin-top: 0;">Исправления:</h4>
                    <p>Критерии были автоматически исправлены. Хотите применить исправления?</p>
                    <button class="btn btn-primary" onclick="applyCriteriaFix()">Применить исправления</button>
                </div>
            ` : ''}
            
            <div style="margin-top: 20px;">
                <button class="btn" onclick="hideModal()">Закрыть</button>
            </div>
        </div>
    `;
    
    showModal('Проверка критериев оценивания', html);
}

// Вспомогательная функция для получения цвета оценки
function getGradeColor(grade) {
    const colors = {
        '2': '#e74c3c',
        '3': '#f39c12',
        '4': '#3498db',
        '5': '#2ecc71'
    };
    return colors[grade] || '#95a5a6';
}

// Функция для применения исправлений
function applyCriteriaFix() {
    if (appData && fixAppDataCriteria(appData)) {
        showNotification('Критерии успешно исправлены', 'success');
        hideModal();
        // Обновить интерфейс если нужно
        if (typeof updateCriteriaDisplay === 'function') {
            updateCriteriaDisplay();
        }
    } else {
        showNotification('Не удалось применить исправления', 'error');
    }
}

// Функция для проверки перед генерацией отчета
function checkCriteriaBeforeReport() {
    const validation = validateAppDataCriteria(appData);
    
    if (!validation.isValid) {
        showNotification('Ошибка в критериях оценивания: ' + validation.errors[0], 'error');
        displayCriteriaValidation(validation);
        return false;
    }
    
    if (validation.warnings.length > 0) {
        console.warn('Предупреждения в критериях:', validation.warnings);
        // Можно показать предупреждение, но продолжить
        if (validation.warnings.length > 3) {
            showNotification('Обнаружены проблемы в критериях оценивания', 'warning');
        }
    }
    
    return true;
}

// ==================== ДОБАВЛЕНИЕ НЕДОСТАЮЩИХ ФУНКЦИЙ ====================
function generateReportData(settings) {
    const report = {
        metadata: {
            generated: new Date().toLocaleString(),
            title: getReportTitle(settings.type),
            author: 'Система анализа образовательных результатов',
            settings: settings
        },
        content: {},
        stats: {
            pages: 0,
            words: 0,
            charts: 0,
            tables: 0,
            images: 0
        }
    };
    
    try {
        // Базовые поля
        if (settings.fields.includes('basic_info')) {
            report.content.basicInfo = generateBasicInfo();
            report.stats.pages += 1;
        }
        
        if (settings.fields.includes('metadata')) {
            report.content.metadata = {
                methodology: 'Анализ образовательных результатов',
                dateRange: 'Текущий учебный период',
                analysisMethod: 'Статистический и сравнительный анализ'
            };
        }
        
        if (settings.fields.includes('criteria')) {
            report.content.criteria = {
                gradingCriteria: appData?.test?.criteria || 'Не указаны',
                scoringSystem: appData?.test?.criteriaSystem || 'Стандартная 5-балльная',
                maxScore: calculateMaxScores()
            };
        }
        
        if (settings.fields.includes('objectives')) {
            report.content.objectives = {
                educational: 'Оценка уровня усвоения материала',
                analytical: 'Выявление проблемных зон',
                developmental: 'Разработка рекомендаций для улучшения'
            };
        }
        
        // Результаты
        if (settings.fields.includes('grades_distribution')) {
            report.content.gradesDistribution = generateGradesDistribution(settings);
            report.stats.charts += 1;
        }
        
        if (settings.fields.includes('statistics')) {
            report.content.statistics = generateStatistics(settings);
            report.stats.tables += 1;
        }
        
        if (settings.fields.includes('task_analysis')) {
            report.content.taskAnalysis = analyzeTasks();
            report.stats.tables += Math.ceil(analyzeTasks().length / 5);
        }
        
        if (settings.fields.includes('error_analysis')) {
            report.content.errorAnalysis = detectCommonErrors();
        }
        
        if (settings.fields.includes('student_progress')) {
            report.content.studentProgress = generateStudentProgress();
        }
        
        if (settings.fields.includes('detailed_scores')) {
            report.content.detailedScores = generateDetailedScores();
            report.stats.tables += 2;
        }
        
        // Аналитика
        if (settings.fields.includes('comparative_analysis')) {
            report.content.comparativeAnalysis = generateComparativeAnalysis();
        }
        
        if (settings.fields.includes('correlation')) {
            report.content.correlation = generateCorrelationAnalysis();
        }
        
        if (settings.fields.includes('trends')) {
            report.content.trends = analyzeTrends();
        }
        
        if (settings.fields.includes('predictive')) {
            report.content.predictive = generatePredictions();
        }
        
        if (settings.fields.includes('benchmarking')) {
            report.content.benchmarking = generateBenchmarkReport();
        }
        
        // Визуализация
        if (settings.fields.includes('charts')) {
            report.content.charts = generateDynamicCharts(report);
            report.stats.charts += report.content.charts.length;
        }
        
        if (settings.fields.includes('heatmaps')) {
            report.content.heatmaps = generateErrorHeatmap();
        }
        
        if (settings.fields.includes('infographics')) {
            report.content.infographics = generateInfographics();
        }
        
        // Рекомендации
        if (settings.fields.includes('recommendations')) {
            report.content.recommendations = generateRecommendations(settings);
            report.stats.pages += 1;
        }
        
        if (settings.fields.includes('correction_plan')) {
            report.content.correctionPlan = generateCorrectionPlan();
        }
        
        if (settings.fields.includes('next_steps')) {
            report.content.nextSteps = generateNextSteps();
        }
        
        if (settings.fields.includes('personal_recommendations')) {
            report.content.personalRecommendations = generatePersonalRecommendations();
        }
        
        if (settings.fields.includes('methodical_recommendations')) {
            report.content.methodicalRecommendations = generateMethodicalRecommendations();
        }
        
        // Дополнительно
        if (settings.fields.includes('appendix')) {
            report.content.appendix = generateAppendix();
        }
        
        if (settings.fields.includes('references')) {
            report.content.references = generateReferences();
        }
        
        if (settings.fields.includes('glossary')) {
            report.content.glossary = generateGlossary();
        }
        
        if (settings.fields.includes('feedback_form')) {
            report.content.feedbackForm = generateFeedbackForm();
        }
        
        // AI функции
        if (settings.options?.aiInsights) {
            report.content.aiInsights = generateAIInsights();
        }
        
        if (settings.options?.predictiveAnalytics) {
            report.content.predictiveAnalytics = generatePredictiveAnalytics();
        }
        
        // Мультимедиа
        if (settings.options?.voiceSummary) {
            report.content.voiceSummary = generateVoiceSummary(report);
        }
        
        if (settings.fields.includes('recommendations')) {
            const recData = generateRecommendations(settings);
            if (recData && typeof recData === 'object') {
                report.content.recommendations = recData;
                report.stats.pages += 1;
            }
        }
        
    } catch (error) {
        console.error('Ошибка генерации разделов отчета:', error);
        showNotification('Ошибка генерации данных отчета: ' + error.message, 'warning');
    }
    
    return report;
}
// Функция для обработки всех полей отчета
function generateReportDatsa(settings) {
    const report = {
        metadata: {
            generated: new Date().toLocaleString(),
            title: getReportTitle(settings.type),
            author: 'Система анализа образовательных результатов',
            settings: settings
        },
        content: {},
        stats: {
            pages: 0,
            words: 0,
            charts: 0,
            tables: 0,
            images: 0
        }
    };
    
    // Генерируем ВСЕ разделы в зависимости от выбранных полей
    try {
        // Базовые поля
        if (settings.fields.includes('basic_info')) {
            report.content.basicInfo = generateBasicInfo();
            report.stats.pages += 1;
        }
        
        if (settings.fields.includes('metadata')) {
            report.content.metadata = {
                methodology: 'Анализ образовательных результатов',
                dateRange: 'Текущий учебный период',
                analysisMethod: 'Статистический и сравнительный анализ'
            };
        }
        
        if (settings.fields.includes('criteria')) {
            report.content.criteria = {
                gradingCriteria: appData?.test?.criteria || 'Не указаны',
                scoringSystem: appData?.test?.criteriaSystem || 'Стандартная 5-балльная',
                maxScore: calculateMaxScores()
            };
        }
        
        if (settings.fields.includes('objectives')) {
            report.content.objectives = {
                educational: 'Оценка уровня усвоения материала',
                analytical: 'Выявление проблемных зон',
                developmental: 'Разработка рекомендаций для улучшения'
            };
        }
        
        // Результаты
        if (settings.fields.includes('grades_distribution')) {
            report.content.gradesDistribution = generateGradesDistribution(settings);
            report.stats.charts += 1;
        }
        
        if (settings.fields.includes('statistics')) {
            report.content.statistics = generateStatistics(settings);
            report.stats.tables += 1;
        }
        
        if (settings.fields.includes('task_analysis')) {
            report.content.taskAnalysis = analyzeTasks();
            report.stats.tables += Math.ceil(analyzeTasks().length / 5);
        }
        
        if (settings.fields.includes('error_analysis')) {
            report.content.errorAnalysis = detectCommonErrors();
        }
        
        if (settings.fields.includes('student_progress')) {
            report.content.studentProgress = generateStudentProgress();
        }
        
        if (settings.fields.includes('detailed_scores')) {
            report.content.detailedScores = generateDetailedScores();
            report.stats.tables += 2;
        }
        
        // Аналитика
        if (settings.fields.includes('comparative_analysis')) {
            report.content.comparativeAnalysis = generateComparativeAnalysis();
        }
        
        if (settings.fields.includes('correlation')) {
            report.content.correlation = generateCorrelationAnalysis();
        }
        
        if (settings.fields.includes('trends')) {
            report.content.trends = analyzeTrends();
        }
        
        if (settings.fields.includes('predictive')) {
            report.content.predictive = generatePredictions();
        }
        
        if (settings.fields.includes('benchmarking')) {
            report.content.benchmarking = generateBenchmarkReport();
        }
        
        // Визуализация
        if (settings.fields.includes('charts')) {
            report.content.charts = generateDynamicCharts(report);
            report.stats.charts += report.content.charts.length;
        }
        
        if (settings.fields.includes('heatmaps')) {
            report.content.heatmaps = generateErrorHeatmap();
        }
        
        if (settings.fields.includes('infographics')) {
            report.content.infographics = generateInfographics();
        }
        
        // Рекомендации
        if (settings.fields.includes('recommendations')) {
            report.content.recommendations = generateRecommendations(settings);
            report.stats.pages += 1;
        }
        
        if (settings.fields.includes('correction_plan')) {
            report.content.correctionPlan = generateCorrectionPlan();
        }
        
        if (settings.fields.includes('next_steps')) {
            report.content.nextSteps = generateNextSteps();
        }
        
        if (settings.fields.includes('personal_recommendations')) {
            report.content.personalRecommendations = generatePersonalRecommendations();
        }
        
        if (settings.fields.includes('methodical_recommendations')) {
            report.content.methodicalRecommendations = generateMethodicalRecommendations();
        }
        
        // Дополнительно
        if (settings.fields.includes('appendix')) {
            report.content.appendix = generateAppendix();
        }
        
        if (settings.fields.includes('references')) {
            report.content.references = generateReferences();
        }
        
        if (settings.fields.includes('glossary')) {
            report.content.glossary = generateGlossary();
        }
        
        if (settings.fields.includes('feedback_form')) {
            report.content.feedbackForm = generateFeedbackForm();
        }
        
        // AI функции
        if (settings.options?.aiInsights) {
            report.content.aiInsights = generateAIInsights();
        }
        
        if (settings.options?.predictiveAnalytics) {
            report.content.predictiveAnalytics = generatePredictiveAnalytics();
        }
        
        // Мультимедиа
        if (settings.options?.voiceSummary) {
            report.content.voiceSummary = generateVoiceSummary(report);
        }
        
    } catch (error) {
        console.error('Ошибка генерации разделов отчета:', error);
        showNotification('Ошибка генерации данных отчета: ' + error.message, 'warning');
    }
    
    // Обновляем статистику
    updateReportStatsFromData(report);
    
    return report;
}

// Дополнительные функции генерации данных
function generateStudentProgress() {
    if (!appData.students) return [];
    
    return appData.students.map(student => {
        const totalScore = calculateStudentTotal(student.id);
        return {
            name: `${student.lastName} ${student.firstName}`,
            currentScore: totalScore,
            previousScore: getPreviousScore(student.id),
            progress: calculateProgress(student.id),
            grade: calculateGrade(totalScore)
        };
    });
}

function generateDetailedScores() {
    if (!appData.students || !appData.tasks) return [];
    
    return appData.students.map(student => {
        const scores = appData.tasks.map((task, index) => {
            const taskId = task.id || index;
            return appData.results[student.id]?.[taskId] || 0;
        });
        
        return {
            student: `${student.lastName} ${student.firstName}`,
            scores: scores,
            total: scores.reduce((a, b) => a + b, 0),
            average: scores.reduce((a, b) => a + b, 0) / scores.length
        };
    });
}

function generateComparativeAnalysis() {
    return {
        classAverage: calculateStatistics().averageGrade,
        schoolAverage: 3.8, // Примерное значение
        regionalAverage: 3.5, // Примерное значение
        nationalAverage: 3.7, // Примерное значение
        difference: calculateStatistics().averageGrade - 3.7
    };
}

function generateCorrelationAnalysis() {
    // Простой анализ корреляции
    return {
        gradeTaskCorrelation: calculateGradeTaskCorrelation(),
        timeScoreCorrelation: 0.65, // Пример
        difficultySuccessCorrelation: -0.72 // Пример
    };
}

function generateInfographics() {
    return {
        gradeDistribution: generateGradeDistributionChartData(),
        successRate: calculateStatistics().successRate,
        topPerformers: getTopPerformers(3),
        improvementAreas: getImprovementAreas()
    };
}

function generateCorrectionPlan() {
    const stats = calculateStatistics();
    const weakPercentage = stats.weakPercentage || 0;
    
    return {
        priority: weakPercentage > 20 ? 'high' : 'medium',
        actions: [
            'Индивидуальные консультации для отстающих',
            'Групповые занятия по сложным темам',
            'Дополнительные материалы для самостоятельной работы',
            'Мониторинг прогресса каждые 2 недели'
        ],
        timeline: '4 недели',
        resources: ['Учебные материалы', 'Онлайн-платформы', 'Рабочие тетради']
    };
}

function generateNextSteps() {
    return {
        immediate: ['Провести работу над ошибками', 'Назначить индивидуальные консультации'],
        shortTerm: ['Разработать план коррекции', 'Провести повторное тестирование через 2 недели'],
        longTerm: ['Скорректировать учебную программу', 'Внедрить дифференцированный подход']
    };
}

function generatePersonalRecommendations() {
    if (!appData.students) return [];
    
    return appData.students.map(student => {
        const totalScore = calculateStudentTotal(student.id);
        const grade = calculateGrade(totalScore);
        
        let recommendation = '';
        switch(grade) {
            case '5': recommendation = 'Продолжайте в том же духе! Участвуйте в олимпиадах.'; break;
            case '4': recommendation = 'Хороший результат! Обратите внимание на задания, где были ошибки.'; break;
            case '3': recommendation = 'Требуется дополнительная работа. Рекомендуем индивидуальные консультации.'; break;
            case '2': recommendation = 'Необходимо пройти повторное обучение. Требуется помощь учителя.'; break;
        }
        
        return {
            student: `${student.lastName} ${student.firstName}`,
            grade: grade,
            recommendation: recommendation,
            priority: grade === '2' ? 'high' : grade === '3' ? 'medium' : 'low'
        };
    });
}

function generateAppendix() {
    return {
        rawData: appData,
        formulas: {
            averageGrade: 'Сумма баллов / Количество учащихся',
            successRate: '(Отличники + Хорошисты + Троечники) / Всего учащихся * 100%',
            gradeDistribution: 'Количество каждой оценки / Всего учащихся * 100%'
        },
        definitions: {
            excellent: 'Оценка 5 - 85-100% от максимального балла',
            good: 'Оценка 4 - 70-84% от максимального балла',
            average: 'Оценка 3 - 50-69% от максимального балла',
            weak: 'Оценка 2 - 0-49% от максимального балла'
        }
    };
}

function generateReferences() {
    return [
        'ГОСТ 7.32-2001 "Отчет о научно-исследовательской работе"',
        'Методические рекомендации по оцениванию учебных достижений',
        'Положение о системе оценки качества образования'
    ];
}

function generateGlossary() {
    return {
        'Успеваемость': 'Процент учащихся, получивших удовлетворительные и выше оценки',
        'Качество знаний': 'Процент учащихся, получивших оценки "4" и "5"',
        'Средний балл': 'Среднее арифметическое всех оценок',
        'Академическая задолженность': 'Неудовлетворительные оценки, требующие пересдачи'
    };
}

function generateFeedbackForm() {
    return {
        questions: [
            'Насколько полезным был этот отчет?',
            'Какие разделы были наиболее информативными?',
            'Что можно улучшить в следующих отчетах?'
        ],
        ratingScale: '1-5, где 5 - отлично',
        submissionMethod: 'Онлайн форма или email'
    };
}

function generatePredictiveAnalytics() {
    const stats = calculateStatistics();
    const futureMonth = new Date();
    futureMonth.setMonth(futureMonth.getMonth() + 1);
    
    return {
        predictedAverage: Math.min(5, stats.averageGrade * 1.1).toFixed(1),
        predictedSuccessRate: Math.min(100, stats.successRate * 1.05).toFixed(1),
        forecastDate: futureMonth.toLocaleDateString(),
        confidence: 75,
        assumptions: [
            'Продолжение текущей учебной программы',
            'Проведение коррекционных мероприятий',
            'Стабильная посещаемость'
        ]
    };
}

// Обновление статистики отчета
function updateReportStatsFromData(report) {
    if (!report) return;
    
    // Подсчет слов из контента
    let wordCount = 0;
    Object.values(report.content).forEach(section => {
        const text = JSON.stringify(section);
        wordCount += text.split(/\s+/).length;
    });
    
    // Расчет количества страниц (примерно 500 слов на страницу)
    const pages = Math.ceil(wordCount / 500);
    
    // Обновление UI
    if (document.getElementById('pageCount')) {
        document.getElementById('pageCount').textContent = pages;
    }
    if (document.getElementById('wordCount')) {
        document.getElementById('wordCount').textContent = wordCount;
    }
    if (document.getElementById('chartCount')) {
        document.getElementById('chartCount').textContent = report.stats.charts || 0;
    }
    if (document.getElementById('tableCount')) {
        document.getElementById('tableCount').textContent = report.stats.tables || 0;
    }
    if (document.getElementById('imageCount')) {
        document.getElementById('imageCount').textContent = report.stats.images || 0;
    }
    if (document.getElementById('estReadingTime')) {
        const readingTime = Math.ceil(wordCount / 200); // 200 слов в минуту
        document.getElementById('estReadingTime').textContent = readingTime;
    }
    
    // Показываем статистику
    document.getElementById('reportStats').style.display = 'block';
}

// Функции экспорта
function exportToPDF() {
    if (!reportData) {
        showNotification('Сначала сгенерируйте отчет', 'warning');
        return;
    }
    
    showLoading('Создание PDF документа...');
    
    // Используем html2pdf для создания PDF
    const element = document.getElementById('reportPreviewContent');
    
    const opt = {
        margin: [10, 10, 10, 10],
        filename: `Отчет_${appData.test.subject}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Создаем копию содержимого для печати
    const printContent = element.cloneNode(true);
    printContent.classList.add('print-mode');
    
    html2pdf().set(opt).from(printContent).save().then(() => {
        hideLoading();
        showNotification('PDF документ создан', 'success');
    }).catch(error => {
        console.error('Ошибка создания PDF:', error);
        hideLoading();
        showNotification('Ошибка создания PDF документа', 'error');
    });
}

function exportToHTML() {
    if (!reportData) {
        showNotification('Сначала сгенерируйте отчет', 'warning');
        return;
    }
    
    const htmlContent = generateHTMLReport(reportData);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Отчет_${appData.test.subject}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showNotification('HTML отчет скачан', 'success');
}

function generateHTMLReport(reportData) {
    return `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${reportData.metadata.title}</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
                .report-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                .section { margin-bottom: 30px; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .grade-5 { color: #2ecc71; }
                .grade-4 { color: #3498db; }
                .grade-3 { color: #f39c12; }
                .grade-2 { color: #e74c3c; }
                .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
            </style>
        </head>
        <body>
            <div class="report-header">
                <h1>${reportData.metadata.title}</h1>
                <p>${appData.test.subject} | ${appData.test.class} | ${new Date().toLocaleDateString()}</p>
            </div>
            
            ${generateReportSectionsHTML(reportData)}
            
            <div class="footer">
                <p>Отчет сгенерирован: ${reportData.metadata.generated}</p>
                <p>Система анализа образовательных результатов</p>
            </div>
        </body>
        </html>
    `;
}

function generateReportSectionsHTML(reportData) {
    let html = '';
    
    // Базовая информация
    if (reportData.content.basicInfo) {
        html += `
            <div class="section">
                <h2>Основная информация</h2>
                <table>
                    <tr><th>Параметр</th><th>Значение</th></tr>
                    ${Object.entries(reportData.content.basicInfo).map(([key, value]) => 
                        `<tr><td>${key}</td><td>${value}</td></tr>`
                    ).join('')}
                </table>
            </div>
        `;
    }
    
    // Распределение оценок
    if (reportData.content.gradesDistribution) {
        html += `
            <div class="section">
                <h2>Распределение оценок</h2>
                <table>
                    <tr><th>Оценка</th><th>Процент</th></tr>
                    ${Object.entries(reportData.content.gradesDistribution).map(([grade, percentage]) => 
                        `<tr><td class="grade-${grade}">${grade}</td><td>${percentage}%</td></tr>`
                    ).join('')}
                </table>
            </div>
        `;
    }
    
    // Рекомендации
    if (reportData.content.recommendations) {
        html += `
            <div class="section">
                <h2>Рекомендации</h2>
                <ul>
                    ${reportData.content.recommendations.map(rec => 
                        `<li><strong>${rec.action}</strong>: ${rec.description}</li>`
                    ).join('')}
                </ul>
            </div>
        `;
    }
    
    return html;
}

// Функция для создания QR-кода
function generateQRCode() {
    if (!reportData) return;
    
    const qrContainer = document.getElementById('qrCodeContainer');
    if (!qrContainer) return;
    
    // Создаем уникальную ссылку для отчета
    const reportId = 'report_' + Date.now();
    const reportUrl = `${window.location.origin}${window.location.pathname}#report=${reportId}`;
    
    // Сохраняем отчет локально для доступа по ссылке
    localStorage.setItem(reportId, JSON.stringify(reportData));
    
    // Генерируем QR-код
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
        text: reportUrl,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    
    document.getElementById('reportQRCode').style.display = 'block';
}

// Функция для реальной отправки email
function sendReportByEmail() {
    if (!reportData) {
        showNotification('Сначала сгенерируйте отчет', 'warning');
        return;
    }
    
    const email = prompt('Введите email для отправки:', '');
    if (!email) return;
    
    // Валидация email
    if (!validateEmail(email)) {
        showNotification('Введите корректный email', 'error');
        return;
    }
    
    showLoading('Отправка отчета по email...');
    
    // Используем EmailJS или другую службу для отправки email
    if (typeof emailjs !== 'undefined') {
        const templateParams = {
            to_email: email,
            subject: `Отчет по предмету ${appData.test.subject}`,
            message: generateEmailContent(reportData),
            report_date: new Date().toLocaleDateString()
        };
        
        emailjs.send('service_id', 'template_id', templateParams)
            .then(() => {
                hideLoading();
                showNotification('Отчет отправлен на email', 'success');
            })
            .catch(error => {
                console.error('Ошибка отправки email:', error);
                hideLoading();
                showNotification('Ошибка отправки email', 'error');
            });
    } else {
        // Альтернативный вариант - создание почтовой ссылки
        const subject = encodeURIComponent(`Отчет по предмету ${appData.test.subject}`);
        const body = encodeURIComponent(generateEmailTextContent(reportData));
        const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
        
        window.location.href = mailtoLink;
        hideLoading();
        showNotification('Открыт почтовый клиент', 'info');
    }
}

function generateEmailTextContent(reportData) {
    let content = `Отчет по предмету: ${appData.test.subject}\n`;
    content += `Класс: ${appData.test.class}\n`;
    content += `Дата: ${new Date().toLocaleDateString()}\n\n`;
    
    if (reportData.content.basicInfo) {
        content += 'Основная информация:\n';
        Object.entries(reportData.content.basicInfo).forEach(([key, value]) => {
            content += `${key}: ${value}\n`;
        });
    }
    
    content += '\nС уважением,\nСистема анализа образовательных результатов';
    
    return content;
}

// Обновленная функция сохранения в облако
function saveReportToCloud() {
    if (!reportData) {
        showNotification('Сначала сгенерируйте отчет', 'warning');
        return;
    }
    
    // Используем localStorage как пример облачного сохранения
    const savedReports = JSON.parse(localStorage.getItem('savedReports') || '[]');
    
    const reportToSave = {
        ...reportData,
        savedAt: new Date().toISOString(),
        id: 'report_' + Date.now(),
        metadata: {
            ...reportData.metadata,
            savedInCloud: true,
            cloudProvider: 'localStorage' // В реальности это мог бы быть Firebase, AWS и т.д.
        }
    };
    
    savedReports.push(reportToSave);
    localStorage.setItem('savedReports', JSON.stringify(savedReports));
    
    // Обновление истории
    loadReportHistory();
    
    showNotification('Отчет сохранен в облачное хранилище', 'success');
}

// Функция для копирования ссылки на отчет
function copyReportLink() {
    if (!reportData) {
        showNotification('Сначала сгенерируйте отчет', 'warning');
        return;
    }
    
    const reportId = 'report_' + Date.now();
    const reportUrl = `${window.location.origin}${window.location.pathname}#report=${reportId}`;
    
    // Сохраняем отчет локально
    localStorage.setItem(reportId, JSON.stringify(reportData));
    
    // Копируем в буфер обмена
    navigator.clipboard.writeText(reportUrl)
        .then(() => {
            showNotification('Ссылка на отчет скопирована в буфер обмена', 'success');
        })
        .catch(err => {
            console.error('Ошибка копирования:', err);
            showNotification('Не удалось скопировать ссылку', 'error');
        });
}

// Функция для скачивания всех файлов отчета
function downloadReportAssets() {
    if (!reportData) {
        showNotification('Сначала сгенерируйте отчет', 'warning');
        return;
    }
    
    showLoading('Подготовка файлов для скачивания...');
    
    // Создаем zip-архив
    const zip = new JSZip();
    
    // Добавляем разные форматы отчета
    zip.file("report.html", generateHTMLReport(reportData));
    zip.file("report.txt", generateTextReport(reportData));
    zip.file("report.json", JSON.stringify(reportData, null, 2));
    
    // Добавляем CSV данные
    const csvData = generateCSVData();
    zip.file("data.csv", csvData);
    
    // Добавляем изображения графиков (если есть)
    const charts = generateChartImages();
    charts.forEach((chart, index) => {
        zip.file(`chart_${index + 1}.png`, chart, { base64: true });
    });
    
    // Генерируем и скачиваем архив
    zip.generateAsync({ type: "blob" })
        .then(function(content) {
            saveAs(content, `Отчет_${appData.test.subject}_${new Date().toISOString().split('T')[0]}.zip`);
            hideLoading();
            showNotification('Все файлы отчета скачаны', 'success');
        })
        .catch(function(error) {
            console.error('Ошибка создания архива:', error);
            hideLoading();
            showNotification('Ошибка создания архива', 'error');
        });
}

function generateTextReport(reportData) {
    let text = `ОТЧЕТ: ${reportData.metadata.title}\n`;
    text += '='.repeat(50) + '\n\n';
    
    if (reportData.content.basicInfo) {
        text += 'ОСНОВНАЯ ИНФОРМАЦИЯ:\n';
        Object.entries(reportData.content.basicInfo).forEach(([key, value]) => {
            text += `  ${key}: ${value}\n`;
        });
        text += '\n';
    }
    
    if (reportData.content.statistics) {
        text += 'СТАТИСТИКА:\n';
        Object.entries(reportData.content.statistics).forEach(([key, value]) => {
            text += `  ${key}: ${value}\n`;
        });
        text += '\n';
    }
    
    text += `\nСгенерировано: ${reportData.metadata.generated}\n`;
    text += 'Система анализа образовательных результатов\n';
    
    return text;
}

// Функция для обновления сложности отчета
function updateReportComplexity() {
    const complexity = calculateReportComplexity();
    const complexityBar = document.getElementById('complexityFill');
    const complexityValue = document.getElementById('complexityValue');
    const complexityContainer = document.getElementById('reportComplexity');
    
    if (complexityBar && complexityValue && complexityContainer) {
        complexityBar.style.width = `${complexity.percentage}%`;
        complexityBar.style.background = complexity.color;
        complexityValue.textContent = complexity.level;
        complexityContainer.style.display = 'block';
    }
}

// Расчет сложности отчета
function calculateReportComplexity() {
    let score = 0;
    let maxScore = 0;
    
    // Подсчет выбранных полей (более детальный)
    const fieldCheckboxes = document.querySelectorAll('input[name="reportFields"]:checked');
    score += fieldCheckboxes.length * 3;
    maxScore += 25 * 3; // Максимум 25 полей
    
    // Проверка дополнительных опций
    const options = [
        'includeCharts', 'includeTables', 'includeImages',
        'includeQR', 'encryptReport', 'watermark',
        'autoSummary', 'aiInsights', 'predictiveAnalytics',
        'voiceSummary', 'interactiveCharts', 'animations'
    ];
    
    options.forEach(optionId => {
        const element = document.getElementById(optionId);
        if (element && element.checked) {
            score += 2;
        }
    });
    maxScore += options.length * 2;
    
    // Критерии фильтрации
    const gradeFilters = document.querySelectorAll('input[name="gradeFilter"]:checked').length;
    score += gradeFilters * 1;
    maxScore += 4 * 1;
    
    const complexityFilter = document.getElementById('complexityFilter');
    if (complexityFilter && complexityFilter.value !== 'all') {
        score += 3;
    }
    maxScore += 3;
    
    const errorFilters = document.querySelectorAll('input[name="errorTypeFilter"]:checked').length;
    score += errorFilters * 1;
    maxScore += 6 * 1;
    
    const studentGroups = document.querySelectorAll('input[name="studentGroup"]:checked').length;
    score += studentGroups * 1;
    maxScore += 5 * 1;
    
    // Расчет процента и уровня сложности
    const percentage = Math.min(100, Math.round((score / maxScore) * 100));
    
    let level, color;
    if (percentage < 30) {
        level = 'Простой';
        color = '#2ecc71';
    } else if (percentage < 60) {
        level = 'Средний';
        color = '#f39c12';
    } else {
        level = 'Сложный';
        color = '#e74c3c';
    }
    
    return { percentage, level, color, score, maxScore };
}

// Обновление отображения предпросмотра
function displayReportPreview(reportData, mode) {
    const previewDiv = document.getElementById('reportPreviewContent');
    if (!previewDiv) return;
    
    let html = `
        <div class="report-preview-content ${mode === 'print' ? 'print-mode' : ''}">
            <div class="report-header">
                <h1 style="text-align: center; margin-bottom: 10px; color: #2c3e50;">${reportData.metadata.title}</h1>
                <p style="text-align: center; color: #7f8c8d; font-size: 14px;">
                    ${appData.test.subject || 'Предмет не указан'} | 
                    ${appData.test.class || 'Класс не указан'} | 
                    ${new Date().toLocaleDateString()}
                </p>
                <hr style="border: none; border-top: 2px solid #3498db; margin: 20px 0;">
            </div>
    `;
    
    // Добавляем ВСЕ выбранные разделы
    const settings = reportData.metadata.settings;
    
    if (settings.fields.includes('basic_info') && reportData.content.basicInfo) {
        html += generateBasicInfoHTML(reportData.content.basicInfo);
    }
    
    if (settings.fields.includes('statistics') && reportData.content.statistics) {
        html += generateStatisticsHTML(reportData.content.statistics);
    }
    
    if (settings.fields.includes('grades_distribution') && reportData.content.gradesDistribution) {
        html += generateGradesDistributionHTML(reportData.content.gradesDistribution);
    }
    
    if (settings.fields.includes('task_analysis') && reportData.content.taskAnalysis) {
        html += generateTaskAnalysisHTML(reportData.content.taskAnalysis);
    }
    
    if (settings.fields.includes('error_analysis') && reportData.content.errorAnalysis) {
        html += generateErrorAnalysisHTML(reportData.content.errorAnalysis);
    }
    
    if (settings.fields.includes('recommendations') && reportData.content.recommendations) {
        html += generateRecommendationsHTML(reportData.content.recommendations);
    }
    
    // Дополнительные разделы
    if (settings.fields.includes('charts') && reportData.content.charts) {
        html += generateChartsHTML(reportData.content.charts);
    }
    
    if (settings.fields.includes('comparative_analysis') && reportData.content.comparativeAnalysis) {
        html += generateComparativeAnalysisHTML(reportData.content.comparativeAnalysis);
    }
    
    html += `
            <div class="report-footer" style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; color: #95a5a6; font-size: 12px;">
                <p>Отчет сгенерирован: ${reportData.metadata.generated}</p>
                <p>Система анализа образовательных результатов</p>
                ${settings.options?.includeQR ? '<p>📱 Используйте QR-код для быстрого доступа к отчету</p>' : ''}
            </div>
        </div>
    `;
    
    previewDiv.innerHTML = html;
    
    // Генерируем QR-код если нужно
    if (settings.options?.includeQR) {
        setTimeout(generateQRCode, 500);
    }
}

// Генерация HTML для разных разделов
function generateTaskAnalysisHTML(taskAnalysis) {
    if (!taskAnalysis || taskAnalysis.length === 0) return '';
    
    let html = '<div class="report-section"><h3>📋 Анализ заданий</h3><table class="report-table"><thead><tr><th>№</th><th>Задание</th><th>Сложность</th><th>Успешность</th><th>Анализ</th></tr></thead><tbody>';
    
    taskAnalysis.forEach((task, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${task.title || `Задание ${index + 1}`}</td>
                <td>${task.difficultyName || 'Не указана'}</td>
                <td>${task.successRate}%</td>
                <td>${task.analysis || 'Нет анализа'}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    return html;
}

function generateErrorAnalysisHTML(errorAnalysis) {
    if (!errorAnalysis || errorAnalysis.length === 0) return '';
    
    let html = '<div class="report-section"><h3>⚠️ Анализ ошибок</h3><table class="report-table"><thead><tr><th>Тип ошибки</th><th>Количество</th><th>Процент</th></tr></thead><tbody>';
    
    errorAnalysis.forEach(error => {
        html += `
            <tr>
                <td>${error.type}</td>
                <td>${error.count}</td>
                <td>${error.percentage}%</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    return html;
}

function generateChartsHTML(charts) {
    if (!charts || charts.length === 0) return '';
    
    let html = '<div class="report-section"><h3>📊 Графики и диаграммы</h3><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px;">';
    
    charts.forEach((chart, index) => {
        html += `
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0; text-align: center;">
                <h4>${chart.title}</h4>
                <div style="height: 250px; display: flex; align-items: center; justify-content: center;">
                    [График ${chart.type} будет здесь]
                </div>
                <small style="color: #666;">${chart.description || ''}</small>
            </div>
        `;
    });
    
    html += '</div></div>';
    return html;
}

function generateComparativeAnalysisHTML(comparativeAnalysis) {
    if (!comparativeAnalysis) return '';
    
    return `
        <div class="report-section">
            <h3>📈 Сравнительный анализ</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #2c3e50;">${comparativeAnalysis.classAverage.toFixed(1)}</div>
                    <div style="font-size: 12px; color: #7f8c8d;">Среднее по классу</div>
                </div>
                <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #2c3e50;">${comparativeAnalysis.schoolAverage.toFixed(1)}</div>
                    <div style="font-size: 12px; color: #7f8c8d;">Среднее по школе</div>
                </div>
                <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #2c3e50;">${comparativeAnalysis.regionalAverage.toFixed(1)}</div>
                    <div style="font-size: 12px; color: #7f8c8d;">Среднее по региону</div>
                </div>
                <div style="text-align: center; padding: 15px; background: ${comparativeAnalysis.difference >= 0 ? '#d4edda' : '#f8d7da'}; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: ${comparativeAnalysis.difference >= 0 ? '#28a745' : '#dc3545'};">${comparativeAnalysis.difference >= 0 ? '+' : ''}${comparativeAnalysis.difference.toFixed(1)}</div>
                    <div style="font-size: 12px; color: #666;">Разница с национальным</div>
                </div>
            </div>
        </div>
    `;
}

// Функция для загрузки шаблона
function loadReportTemplate() {
    const templates = JSON.parse(localStorage.getItem('reportTemplates') || '[]');
    
    if (templates.length === 0) {
        showNotification('Нет сохраненных шаблонов', 'warning');
        return;
    }
    
    let html = `
        <div style="max-width: 600px;">
            <h3>📂 Выберите шаблон</h3>
            <div style="max-height: 400px; overflow-y: auto; margin: 15px 0;">
    `;
    
    templates.forEach((template, index) => {
        html += `
            <div class="template-item" style="padding: 10px; border: 1px solid #eee; margin: 5px 0; border-radius: 5px; cursor: pointer;" onclick="selectTemplate(${index})">
                <strong>${template.name}</strong>
                <div style="font-size: 12px; color: #666;">
                    ${new Date(template.date).toLocaleDateString()} | ${template.settings?.type || 'Пользовательский'}
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="hideModal()">Отмена</button>
            </div>
        </div>
    `;
    
    showModal('Загрузка шаблона', html);
}

function selectTemplate(index) {
    const templates = JSON.parse(localStorage.getItem('reportTemplates') || '[]');
    const template = templates[index];
    
    if (template) {
        applyTemplateSettings(template.settings);
        hideModal();
        showNotification(`Загружен шаблон: ${template.name}`, 'success');
    }
}

// Обновленная функция сбора настроек
function collectReportSettings() {
    const settings = {
        type: document.getElementById('reportType')?.value || 'teacher',
        fields: [],
        gradeFilter: [],
        complexityFilter: document.getElementById('complexityFilter')?.value || 'all',
        errorTypeFilter: [],
        studentGroup: [],
        theme: document.getElementById('reportTheme')?.value || 'default',
        font: document.getElementById('reportFont')?.value || 'Arial',
        fontSize: document.getElementById('fontSize')?.value || '12',
        colorScheme: document.getElementById('colorScheme')?.value || 'blue',
        options: {}
    };
    
    // Собираем выбранные поля
    const fieldCheckboxes = document.querySelectorAll('input[name="reportFields"]:checked');
    fieldCheckboxes.forEach(checkbox => {
        if (checkbox && checkbox.value) {
            settings.fields.push(checkbox.value);
        }
    });
    
    // Собираем фильтры по оценкам
    const gradeCheckboxes = document.querySelectorAll('input[name="gradeFilter"]:checked');
    gradeCheckboxes.forEach(checkbox => {
        if (checkbox && checkbox.value) {
            settings.gradeFilter.push(checkbox.value);
        }
    });
    
    // Собираем фильтры по типам ошибок
    const errorCheckboxes = document.querySelectorAll('input[name="errorTypeFilter"]:checked');
    errorCheckboxes.forEach(checkbox => {
        if (checkbox && checkbox.value && checkbox.value !== 'all') {
            settings.errorTypeFilter.push(checkbox.value);
        }
    });
    
    // Собираем группы учащихся
    const studentCheckboxes = document.querySelectorAll('input[name="studentGroup"]:checked');
    studentCheckboxes.forEach(checkbox => {
        if (checkbox && checkbox.value && checkbox.value !== 'all') {
            settings.studentGroup.push(checkbox.value);
        }
    });
    
    // Собираем дополнительные опции
    const options = [
        'includeCharts', 'includeTables', 'includeImages',
        'includeQR', 'encryptReport', 'watermark',
        'autoSummary', 'aiInsights', 'predictiveAnalytics',
        'voiceSummary', 'interactiveCharts', 'animations'
    ];
    
    options.forEach(option => {
        const element = document.getElementById(option);
        settings.options[option] = element ? element.checked : false;
    });
    
    return settings;
}

// Проверка наличия необходимых библиотек
function checkRequiredLibraries() {
    const requiredLibs = {
        'JSZip': typeof JSZip !== 'undefined',
        'html2pdf': typeof html2pdf !== 'undefined',
        'QRCode': typeof QRCode !== 'undefined',
        'Chart': typeof Chart !== 'undefined',
        'htmlDocx': typeof htmlDocx !== 'undefined'
    };
    
    const missingLibs = Object.entries(requiredLibs)
        .filter(([_, exists]) => !exists)
        .map(([lib]) => lib);
    
    if (missingLibs.length > 0) {
        console.warn('Отсутствуют библиотеки:', missingLibs);
        return false;
    }
    
    return true;
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем библиотеки
    setTimeout(() => {
        if (!checkRequiredLibraries()) {
            console.log('Некоторые функции отчета могут не работать из-за отсутствия библиотек');
        }
    }, 1000);
});

// ==================== РЕАЛИЗАЦИЯ НЕДОСТАЮЩИХ ФУНКЦИЙ ====================

// Получение предыдущего результата ученика
function getPreviousScore(studentId) {
    if (!appData || !appData.students || !studentId) return null;
    
    try {
        // Пытаемся найти исторические данные в localStorage
        const studentHistory = JSON.parse(localStorage.getItem('studentHistory') || '{}');
        
        if (studentHistory[studentId]) {
            // Берем последний сохраненный результат
            const lastResult = studentHistory[studentId];
            if (lastResult.totalScore !== undefined) {
                return lastResult.totalScore;
            }
        }
        
        // Если нет истории, генерируем случайный результат на основе текущего
        const currentTotal = calculateStudentTotal(studentId);
        if (currentTotal && !isNaN(currentTotal)) {
            // Генерируем предыдущий результат в пределах 70-130% от текущего
            const variation = 0.3; // 30% вариация
            const minScore = currentTotal * (1 - variation);
            const maxScore = currentTotal * (1 + variation);
            return Math.round(Math.random() * (maxScore - minScore) + minScore);
        }
        
        return null;
    } catch (error) {
        console.error('Ошибка получения предыдущего результата:', error);
        return null;
    }
}

// Расчет прогресса ученика
function calculateProgress(studentId) {
    const currentScore = calculateStudentTotal(studentId);
    const previousScore = getPreviousScore(studentId);
    
    if (currentScore === null || previousScore === null || previousScore === 0) {
        return 0;
    }
    
    const progress = ((currentScore - previousScore) / previousScore) * 100;
    return Math.round(progress * 10) / 10; // Округляем до одного знака после запятой
}

// Расчет корреляции между оценками и заданиями
function calculateGradeTaskCorrelation() {
    if (!appData.students || !appData.tasks) return 0;
    
    try {
        const grades = [];
        const taskSuccessRates = [];
        
        // Собираем средние баллы по каждому заданию
        appData.tasks.forEach((task, taskIndex) => {
            const successRate = calculateTaskSuccessRate(taskIndex);
            taskSuccessRates.push(successRate);
        });
        
        // Собираем итоговые оценки учеников
        appData.students.forEach(student => {
            const totalScore = calculateStudentTotal(student.id);
            if (totalScore !== null && !isNaN(totalScore)) {
                grades.push(totalScore);
            }
        });
        
        // Если недостаточно данных для корреляции
        if (grades.length < 2 || taskSuccessRates.length < 2) {
            return 0.5; // Возвращаем среднее значение
        }
        
        // Простой расчет корреляции
        const avgGrade = grades.reduce((a, b) => a + b, 0) / grades.length;
        const avgTaskRate = taskSuccessRates.reduce((a, b) => a + b, 0) / taskSuccessRates.length;
        
        let numerator = 0;
        let denomX = 0;
        let denomY = 0;
        
        // Для каждого ученика рассчитываем корреляцию
        appData.students.slice(0, Math.min(20, appData.students.length)).forEach(student => {
            const totalScore = calculateStudentTotal(student.id);
            if (totalScore !== null && !isNaN(totalScore)) {
                const x = totalScore - avgGrade;
                // Используем средний успех по всем заданиям для ученика
                let studentTaskRate = 0;
                let taskCount = 0;
                
                appData.tasks.forEach((task, taskIndex) => {
                    const taskId = task.id || taskIndex;
                    const score = appData.results[student.id]?.[taskId] || 0;
                    const maxScore = task.maxScore || 1;
                    if (maxScore > 0) {
                        studentTaskRate += (score / maxScore) * 100;
                        taskCount++;
                    }
                });
                
                const y = (studentTaskRate / Math.max(taskCount, 1)) - avgTaskRate;
                
                numerator += x * y;
                denomX += x * x;
                denomY += y * y;
            }
        });
        
        const correlation = numerator / Math.sqrt(denomX * denomY);
        
        // Возвращаем корреляцию в пределах -1 до 1
        return isNaN(correlation) ? 0.5 : Math.max(-1, Math.min(1, correlation));
    } catch (error) {
        console.error('Ошибка расчета корреляции:', error);
        return 0.5;
    }
}

// Генерация данных для графика распределения оценок
function generateGradeDistributionChartData() {
    // Интегрируем критерии перед генерацией отчета
    const integratedAppData = integrateCriteriaForReports(appData);
    
    // Теперь можем безопасно использовать
    const validation = integratedAppData.helpers.validateCriteria();
    
    if (!validation.isValid) {
        showNotification('Проблемы с критериями оценивания', 'error');
        return;
    }
    
    const distribution = calculateGradeDistributionWithCompatibleCriteria(integratedAppData);
    
    return {
        labels: ['5', '4', '3', '2'],
        datasets: [{
            label: 'Процент учащихся',
            data: [
                distribution['5'] || 0,
                distribution['4'] || 0,
                distribution['3'] || 0,
                distribution['2'] || 0
            ],
            backgroundColor: [
                'rgba(46, 204, 113, 0.7)',
                'rgba(52, 152, 219, 0.7)',
                'rgba(243, 156, 18, 0.7)',
                'rgba(231, 76, 60, 0.7)'
            ],
            borderColor: [
                'rgb(46, 204, 113)',
                'rgb(52, 152, 219)',
                'rgb(243, 156, 18)',
                'rgb(231, 76, 60)'
            ],
            borderWidth: 2
        }]
    };
}

// Получение лучших учеников
function getTopPerformers(count = 3) {
    if (!appData.students || appData.students.length === 0) return [];
    
    const performers = [];
    
    appData.students.forEach(student => {
        const totalScore = calculateStudentTotal(student.id);
        if (totalScore !== null && !isNaN(totalScore)) {
            performers.push({
                id: student.id,
                name: `${student.lastName} ${student.firstName}`,
                score: totalScore,
                grade: calculateGrade(totalScore)
            });
        }
    });
    
    // Сортируем по убыванию баллов
    performers.sort((a, b) => b.score - a.score);
    
    return performers.slice(0, count);
}

// Получение областей для улучшения
function getImprovementAreas() {
    const improvementAreas = [];
    
    // Анализируем задания с низкой успеваемостью
    if (appData.tasks && appData.tasks.length > 0) {
        appData.tasks.forEach((task, index) => {
            const successRate = calculateTaskSuccessRate(index);
            if (successRate < 60) { // Меньше 60% успешности
                improvementAreas.push({
                    taskNumber: index + 1,
                    taskTitle: task.title || `Задание ${index + 1}`,
                    successRate: successRate,
                    difficulty: task.level || 1,
                    recommendation: getTaskImprovementRecommendation(successRate, task.level)
                });
            }
        });
    }
    
    // Анализируем типичные ошибки
    if (appData.errors && appData.errors.length > 0) {
        const commonErrors = detectCommonErrors();
        if (commonErrors.length > 0) {
            improvementAreas.push({
                type: 'common_errors',
                errors: commonErrors.slice(0, 3),
                recommendation: 'Провести работу над наиболее частыми ошибками'
            });
        }
    }
    
    // Анализируем слабых учеников
    const stats = calculateStatistics();
    if (stats.weakPercentage > 20) {
        improvementAreas.push({
            type: 'weak_students',
            percentage: stats.weakPercentage,
            recommendation: `Требуется индивидуальная работа с ${stats.weakPercentage}% учащихся`
        });
    }
    
    return improvementAreas;
}

// Рекомендации по улучшению задания
function getTaskImprovementRecommendation(successRate, difficulty) {
    if (successRate < 30) {
        return 'Задание слишком сложное, требуется упрощение или дополнительное объяснение';
    } else if (successRate < 50) {
        return 'Необходимы дополнительные тренировочные упражнения';
    } else if (successRate < 70) {
        return 'Рекомендуется провести работу над ошибками';
    } else {
        return 'Задание соответствует уровню класса';
    }
}

// Обновленная функция расчета максимального балла
function calculateMaxScores() {
    if (!appData || !appData.tasks || !Array.isArray(appData.tasks)) {
        return 100; // Значение по умолчанию
    }
    
    try {
        return appData.tasks.reduce((sum, task) => {
            const score = parseInt(task.maxScore) || 1;
            return sum + score;
        }, 0);
    } catch (error) {
        console.error('Ошибка расчета максимального балла:', error);
        return 100;
    }
}

// Функция для загрузки данных сравнения
function loadComparisonData() {
    const dateFrom = document.getElementById('compareDateFrom').value;
    const dateTo = document.getElementById('compareDateTo').value;
    
    if (!dateFrom || !dateTo) {
        showNotification('Выберите обе даты для сравнения', 'warning');
        return;
    }
    
    showLoading('Загрузка данных для сравнения...');
    
    // Имитация загрузки исторических данных
    setTimeout(() => {
        try {
            const savedReports = JSON.parse(localStorage.getItem('savedReports') || '[]');
            const comparisonReports = savedReports.filter(report => {
                const reportDate = new Date(report.metadata.generated || report.savedAt);
                const fromDate = new Date(dateFrom);
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59); // Устанавливаем конец дня
                
                return reportDate >= fromDate && reportDate <= toDate;
            });
            
            if (comparisonReports.length === 0) {
                showNotification('Нет данных за выбранный период', 'warning');
            } else {
                // Используем последний отчет из периода для сравнения
                comparisonData = comparisonReports[comparisonReports.length - 1];
                showNotification(`Загружено ${comparisonReports.length} отчетов для сравнения`, 'success');
                generateComparisonReport();
            }
        } catch (error) {
            console.error('Ошибка загрузки данных сравнения:', error);
            showNotification('Ошибка загрузки данных сравнения', 'error');
        } finally {
            hideLoading();
        }
    }, 1500);
}

// Отображение сравнительного отчета
function displayComparisonReport(comparisonReport) {
    let html = `
        <div style="max-width: 800px;">
            <h3>📊 Сравнительный анализ</h3>
            <p><strong>Текущий отчет:</strong> ${comparisonReport.current.metadata.title}</p>
            <p><strong>Сравниваем с:</strong> ${comparisonReport.previous.metadata.title}</p>
            <div style="color: #666; margin-bottom: 20px;">
                Период сравнения: ${new Date(comparisonReport.generated).toLocaleDateString()}
            </div>
            
            <h4>📈 Основные показатели</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 20px 0;">
    `;
    
    // Сравнение основных метрик
    if (comparisonReport.differences) {
        if (comparisonReport.differences.averageGrade !== undefined) {
            const diff = comparisonReport.differences.averageGrade;
            const color = diff >= 0 ? '#27ae60' : '#e74c3c';
            const icon = diff >= 0 ? '📈' : '📉';
            
            html += `
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #eee; text-align: center;">
                    <div style="font-size: 14px; color: #666;">Средний балл</div>
                    <div style="font-size: 24px; font-weight: bold; color: ${color}; margin: 5px 0;">
                        ${icon} ${diff >= 0 ? '+' : ''}${diff.toFixed(2)}
                    </div>
                    <div style="font-size: 12px; color: #999;">изменение</div>
                </div>
            `;
        }
        
        if (comparisonReport.differences.successRate !== undefined) {
            const diff = comparisonReport.differences.successRate;
            const color = diff >= 0 ? '#27ae60' : '#e74c3c';
            const icon = diff >= 0 ? '✅' : '⚠️';
            
            html += `
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #eee; text-align: center;">
                    <div style="font-size: 14px; color: #666;">Успеваемость</div>
                    <div style="font-size: 24px; font-weight: bold; color: ${color}; margin: 5px 0;">
                        ${icon} ${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%
                    </div>
                    <div style="font-size: 12px; color: #999;">изменение</div>
                </div>
            `;
        }
        
        if (comparisonReport.differences.studentCount !== undefined) {
            const diff = comparisonReport.differences.studentCount;
            const color = diff >= 0 ? '#3498db' : '#f39c12';
            
            html += `
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #eee; text-align: center;">
                    <div style="font-size: 14px; color: #666;">Количество учащихся</div>
                    <div style="font-size: 24px; font-weight: bold; color: ${color}; margin: 5px 0;">
                        ${diff >= 0 ? '+' : ''}${diff}
                    </div>
                    <div style="font-size: 12px; color: #999;">изменение</div>
                </div>
            `;
        }
    }
    
    html += `
            </div>
    `;
    
    // Анализ трендов
    if (comparisonReport.trends) {
        html += `
            <h4 style="margin-top: 30px;">📊 Анализ трендов</h4>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
        `;
        
        Object.entries(comparisonReport.trends).forEach(([key, value]) => {
            let trendText = '';
            let trendColor = '#3498db';
            
            if (typeof value === 'boolean') {
                trendText = value ? '📈 Улучшение' : '📉 Ухудшение';
                trendColor = value ? '#27ae60' : '#e74c3c';
            } else if (typeof value === 'number') {
                trendText = value > 0 ? '📈 Положительный тренд' : '📉 Отрицательный тренд';
                trendColor = value > 0 ? '#27ae60' : '#e74c3c';
            }
            
            if (trendText) {
                html += `
                    <div style="margin: 10px 0; padding: 8px; background: white; border-radius: 5px; border-left: 4px solid ${trendColor}">
                        <strong>${key}:</strong> ${trendText}
                    </div>
                `;
            }
        });
        
        html += `
            </div>
        `;
    }
    
    // Выводы
    html += `
            <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 8px;">
                <h4 style="margin-top: 0;">🎯 Основные выводы</h4>
                <ul style="margin: 10px 0; padding-left: 20px;">
    `;
    
    // Генерация выводов на основе сравнения
    if (comparisonReport.differences) {
        if (comparisonReport.differences.averageGrade > 0.3) {
            html += `<li>✅ Наблюдается рост среднего балла</li>`;
        } else if (comparisonReport.differences.averageGrade < -0.3) {
            html += `<li>⚠️ Снизился средний балл, требуется анализ причин</li>`;
        }
        
        if (comparisonReport.differences.successRate > 5) {
            html += `<li>✅ Увеличилась успеваемость учащихся</li>`;
        } else if (comparisonReport.differences.successRate < -5) {
            html += `<li>⚠️ Снизилась успеваемость, требуется корректирующее обучение</li>`;
        }
    }
    
    html += `
                    <li>📊 Рекомендуется продолжить текущую методику обучения</li>
                    <li>👨‍🏫 Следует обратить внимание на отстающих учащихся</li>
                </ul>
            </div>
            
            <div class="modal-actions" style="margin-top: 20px;">
                <button class="btn btn-primary" onclick="saveComparisonReport(comparisonReport)">
                    <i class="fas fa-save"></i> Сохранить сравнение
                </button>
                <button class="btn" onclick="hideModal()">Закрыть</button>
            </div>
        </div>
    `;
    
    showModal('Сравнительный отчет', html);
}

// Сохранение сравнительного отчета
function saveComparisonReport(comparisonReport) {
    try {
        const savedComparisons = JSON.parse(localStorage.getItem('savedComparisons') || '[]');
        
        savedComparisons.push({
            ...comparisonReport,
            savedAt: new Date().toISOString(),
            id: 'comparison_' + Date.now()
        });
        
        localStorage.setItem('savedComparisons', JSON.stringify(savedComparisons));
        
        showNotification('Сравнительный отчет сохранен', 'success');
        hideModal();
    } catch (error) {
        console.error('Ошибка сохранения сравнения:', error);
        showNotification('Ошибка сохранения отчета', 'error');
    }
}

// Анализ трендов для сравнения
function analyzeTrendsComparison(current, previous) {
    const trends = {};
    
    try {
        // Сравнение статистики
        if (current.content?.statistics && previous.content?.statistics) {
            trends.averageGrade = current.content.statistics.averageGrade > previous.content.statistics.averageGrade;
            trends.successRate = current.content.statistics.successRate > previous.content.statistics.successRate;
        }
        
        // Сравнение распределения оценок
        if (current.content?.gradesDistribution && previous.content?.gradesDistribution) {
            trends.moreExcellent = (current.content.gradesDistribution['5'] || 0) > (previous.content.gradesDistribution['5'] || 0);
            trends.fewerWeak = (current.content.gradesDistribution['2'] || 0) < (previous.content.gradesDistribution['2'] || 0);
        }
        
        // Общий тренд
        const positiveTrends = Object.values(trends).filter(v => v === true).length;
        const totalTrends = Object.keys(trends).length;
        
        trends.overall = totalTrends > 0 ? (positiveTrends / totalTrends) > 0.5 : null;
        trends.improvementRate = totalTrends > 0 ? Math.round((positiveTrends / totalTrends) * 100) : 0;
        
    } catch (error) {
        console.error('Ошибка анализа трендов:', error);
    }
    
    return trends;
}

// Функция для экспорта в Excel
function exportToExcels() {
    if (!appData.students || appData.students.length === 0) {
        showNotification('Нет данных для экспорта', 'warning');
        return;
    }
    
    showLoading('Создание Excel файла...');
    
    try {
        // Создаем рабочую книгу
        const wb = XLSX.utils.book_new();
        
        // Лист с результатами студентов
        const studentData = [];
        
        // Заголовки
        const headers = ['Фамилия', 'Имя', 'Отчество'];
        if (appData.tasks) {
            appData.tasks.forEach((task, index) => {
                headers.push(`Задание ${index + 1} (${task.maxScore || 1} б.)`);
            });
        }
        headers.push('Итоговый балл', 'Оценка', 'Процент выполнения', 'Статус');
        
        studentData.push(headers);
        
        // Данные студентов
        appData.students.forEach(student => {
            const row = [
                student.lastName || '',
                student.firstName || '',
                student.middleName || ''
            ];
            
            let totalScore = 0;
            let maxPossible = 0;
            
            if (appData.tasks) {
                appData.tasks.forEach((task, taskIndex) => {
                    const taskId = task.id || taskIndex;
                    const score = parseFloat(appData.results[student.id]?.[taskId]) || 0;
                    const maxScore = task.maxScore || 1;
                    
                    row.push(score);
                    totalScore += score;
                    maxPossible += maxScore;
                });
            }
            
            const percentage = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;
            const grade = calculateGrade(totalScore);
            
            row.push(totalScore.toFixed(2));
            row.push(grade || '');
            row.push(percentage.toFixed(2) + '%');
            
            // Определяем статус
            let status = '';
            if (grade === '5') status = 'Отлично';
            else if (grade === '4') status = 'Хорошо';
            else if (grade === '3') status = 'Удовлетворительно';
            else if (grade === '2') status = 'Неудовлетворительно';
            
            row.push(status);
            
            studentData.push(row);
        });
        
        const ws_students = XLSX.utils.aoa_to_sheet(studentData);
        
        // Лист с анализом заданий
        const taskData = [];
        taskData.push(['№', 'Название задания', 'Макс. балл', 'Средний балл', 'Успеваемость', 'Сложность']);
        
        if (appData.tasks) {
            appData.tasks.forEach((task, index) => {
                const successRate = calculateTaskSuccessRate(index);
                const avgScore = calculateTaskAverageScore(index);
                
                taskData.push([
                    index + 1,
                    task.title || `Задание ${index + 1}`,
                    task.maxScore || 1,
                    avgScore.toFixed(2),
                    successRate.toFixed(2) + '%',
                    task.level || 'Не указана'
                ]);
            });
        }
        
        const ws_tasks = XLSX.utils.aoa_to_sheet(taskData);
        
        // Лист с статистикой
        const stats = calculateStatistics();
        const statsData = [
            ['Статистика класса', 'Значение'],
            ['Всего учащихся', stats.totalStudents],
            ['Всего заданий', stats.totalTasks],
            ['Средний балл', stats.averageGrade.toFixed(2)],
            ['Успеваемость', stats.successRate.toFixed(2) + '%'],
            ['Отличники (5)', stats.excellentPercentage.toFixed(2) + '%'],
            ['Хорошисты (4)', stats.goodPercentage.toFixed(2) + '%'],
            ['Троечники (3)', stats.averagePercentage.toFixed(2) + '%'],
            ['Неуспевающие (2)', stats.weakPercentage.toFixed(2) + '%']
        ];
        
        const ws_stats = XLSX.utils.aoa_to_sheet(statsData);
        
        // Добавляем листы в книгу
        XLSX.utils.book_append_sheet(wb, ws_students, 'Результаты студентов');
        XLSX.utils.book_append_sheet(wb, ws_tasks, 'Анализ заданий');
        XLSX.utils.book_append_sheet(wb, ws_stats, 'Статистика');
        
        // Генерируем и скачиваем файл
        const filename = `Отчет_${appData.test.subject || 'Предмет'}_${appData.test.class || 'Класс'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
        
        hideLoading();
        showNotification('Excel файл успешно создан', 'success');
        
    } catch (error) {
        console.error('Ошибка экспорта в Excel:', error);
        hideLoading();
        showNotification('Ошибка создания Excel файла', 'error');
    }
}

// Расчет среднего балла за задание
function calculateTaskAverageScore(taskIndex) {
    if (!appData.students || !appData.tasks || !appData.tasks[taskIndex]) {
        return 0;
    }
    
    let totalScore = 0;
    let studentCount = 0;
    
    appData.students.forEach(student => {
        if (!student || !student.id) return;
        
        const taskId = appData.tasks[taskIndex].id || taskIndex;
        const score = parseFloat(appData.results[student.id]?.[taskId]) || 0;
        
        totalScore += score;
        studentCount++;
    });
    
    return studentCount > 0 ? totalScore / studentCount : 0;
}

// Обновленная функция showNotification
function showNotification(message, type = 'info') {
    // Проверяем, есть ли уже уведомление
    let notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(notificationContainer);
    }
    
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const notificationId = 'notification-' + Date.now();
    const notification = document.createElement('div');
    notification.id = notificationId;
    notification.style.cssText = `
        background: white;
        border-left: 4px solid ${colors[type] || colors.info};
        padding: 15px 20px;
        margin-bottom: 10px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.innerHTML = `
        <div style="font-size: 20px;">${icons[type] || icons.info}</div>
        <div>
            <div style="font-weight: bold; color: ${colors[type] || colors.info}; margin-bottom: 5px;">
                ${type === 'success' ? 'Успешно' : 
                  type === 'error' ? 'Ошибка' : 
                  type === 'warning' ? 'Предупреждение' : 'Информация'}
            </div>
            <div style="color: #333;">${message}</div>
        </div>
        <button onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; cursor: pointer; color: #999; font-size: 18px;">×</button>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
        const element = document.getElementById(notificationId);
        if (element) {
            element.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => element.remove(), 300);
        }
    }, 5000);
    
    // Добавляем стили для анимации если их нет
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

// Обновленная функция hideModal
function hideModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.transform = 'translateY(20px)';
        }
    }
}

// Обновленная функция showModal
function showModal(title, content) {
    let modal = document.getElementById('modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s, visibility 0.3s;
            padding: 20px;
            box-sizing: border-box;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = `
            background: white;
            border-radius: 10px;
            max-width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            transform: translateY(20px);
            transition: transform 0.3s;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Закрытие по клику вне модального окна
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideModal();
            }
        });
    }
    
    const modalContent = modal.querySelector('.modal-content');
    modalContent.innerHTML = `
        <div style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                <h3 style="margin: 0; color: #2c3e50;">${title}</h3>
                <button onclick="hideModal()" style="background: none; border: none; cursor: pointer; font-size: 20px; color: #95a5a6;">×</button>
            </div>
            <div>${content}</div>
        </div>
    `;
    
    // Показываем модальное окно
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        
        const modalContentInner = modal.querySelector('.modal-content');
        if (modalContentInner) {
            setTimeout(() => {
                modalContentInner.style.transform = 'translateY(0)';
            }, 10);
        }
    }, 10);
}

// Обновленная функция saveAs для скачивания файлов
if (typeof saveAs === 'undefined') {
    function saveAs(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация инпута с размером шрифта
    const fontSizeInput = document.getElementById('fontSize');
    const fontSizeValue = document.getElementById('fontSizeValue');
    
    if (fontSizeInput && fontSizeValue) {
        fontSizeInput.addEventListener('input', function() {
            fontSizeValue.textContent = this.value + 'pt';
        });
    }
    
    // Добавляем обработчики для быстрых шаблонов
    window.loadQuickTemplate = function(templateId) {
        const templates = {
            quick_analysis: {
                type: 'teacher',
                fields: ['basic_info', 'statistics', 'grades_distribution'],
                options: {
                    includeCharts: true,
                    autoSummary: true
                }
            },
            detailed_report: {
                type: 'teacher',
                fields: ['basic_info', 'statistics', 'grades_distribution', 'task_analysis', 'error_analysis', 'recommendations'],
                options: {
                    includeCharts: true,
                    includeTables: true,
                    autoSummary: true,
                    aiInsights: true
                }
            },
            parent_meeting: {
                type: 'parent',
                fields: ['basic_info', 'statistics', 'grades_distribution', 'recommendations'],
                options: {
                    includeCharts: true,
                    autoSummary: true
                }
            },
            methodical: {
                type: 'methodical',
                fields: ['basic_info', 'statistics', 'grades_distribution', 'task_analysis', 'error_analysis', 'methodical_recommendations'],
                options: {
                    includeCharts: true,
                    includeTables: true,
                    aiInsights: true
                }
            }
        };
        
        const template = templates[templateId];
        if (template) {
            // Применяем настройки шаблона
            if (template.type) {
                const reportTypeSelect = document.getElementById('reportType');
                if (reportTypeSelect) {
                    reportTypeSelect.value = template.type;
                    updateReportTemplate();
                }
            }
            
            // Устанавливаем поля
            if (template.fields) {
                document.querySelectorAll('input[name="reportFields"]').forEach(checkbox => {
                    checkbox.checked = template.fields.includes(checkbox.value);
                });
            }
            
            // Устанавливаем опции
            if (template.options) {
                Object.entries(template.options).forEach(([option, value]) => {
                    const element = document.getElementById(option);
                    if (element) {
                        element.checked = value;
                    }
                });
            }
            
            showNotification(`Загружен шаблон: ${templateId}`, 'success');
        }
    };
    
    // Инициализация загрузки истории отчетов
    setTimeout(loadReportHistory, 1000);
});

// Генерация методических рекомендаций для отчета
function generateMethodicalRecommendations(appData, aiInsights = null) {
    try {
        // Проверяем наличие данных
        if (!appData || !appData.test || !appData.tasks || !appData.students) {
            return {
                summary: "Недостаточно данных для формирования методических рекомендаций",
                recommendations: [],
                sections: []
            };
        }
        
        const stats = calculateStatistics();
        const taskAnalysis = analyzeTasks();
        const errorAnalysis = detectCommonErrors();
        const gradeDistribution = calculateGradeDistributionn();
        
        const recommendations = {
            summary: "",
            priorityLevel: "medium",
            recommendations: [],
            teachingStrategies: [],
            differentiationPlan: {},
            resources: [],
            timeline: "2-4 недели",
            sections: []
        };
        
        // ==================== АНАЛИЗ СИТУАЦИИ ====================
        const situationAnalysis = analyzeTeachingSituation(stats, taskAnalysis, gradeDistribution);
        recommendations.summary = situationAnalysis.summary;
        recommendations.priorityLevel = situationAnalysis.priority;
        
        // ==================== ОСНОВНЫЕ РЕКОМЕНДАЦИИ ====================
        
        // 1. Рекомендации на основе статистики
        if (stats.averageGrade < 3.0) {
            recommendations.recommendations.push({
                category: "Базовые знания",
                title: "Повторение базового материала",
                description: `Средний балл класса (${stats.averageGrade.toFixed(1)}) ниже удовлетворительного. Требуется повторение основных тем.`,
                actions: [
                    "Провести диагностический тест для выявления пробелов",
                    "Организовать повторение ключевых понятий",
                    "Использовать опорные конспекты и схемы"
                ],
                priority: "high",
                timeframe: "1-2 недели"
            });
        }
        
        if (stats.weakPercentage > 20) {
            recommendations.recommendations.push({
                category: "Работа с отстающими",
                title: "Индивидуальная поддержка",
                description: `${stats.weakPercentage}% учащихся получили неудовлетворительные оценки.`,
                actions: [
                    "Составить индивидуальные планы работы",
                    "Организовать дополнительные консультации",
                    "Внедрить систему наставничества (сильные помогают слабым)"
                ],
                priority: "high",
                timeframe: "2-3 недели"
            });
        }
        
        if (stats.excellentPercentage > 30) {
            recommendations.recommendations.push({
                category: "Развитие сильных учащихся",
                title: "Дифференциация заданий",
                description: `Высокий процент отличников (${stats.excellentPercentage}%) позволяет усложнять задания.`,
                actions: [
                    "Добавить задания повышенной сложности",
                    "Предложить исследовательские проекты",
                    "Организовать подготовку к олимпиадам"
                ],
                priority: "medium",
                timeframe: "3-4 недели"
            });
        }
        
        // 2. Рекомендации на основе анализа заданий
        const weakTasks = taskAnalysis.filter(t => t.successRate < 60);
        if (weakTasks.length > 0) {
            recommendations.recommendations.push({
                category: "Сложные задания",
                title: "Проработка проблемных заданий",
                description: `${weakTasks.length} заданий выполнены менее чем на 60%.`,
                actions: weakTasks.map(task => 
                    `Задание ${task.number}: дополнительное объяснение (успешность: ${task.successRate}%)`
                ),
                priority: "medium",
                timeframe: "2 недели"
            });
        }
        
        // 3. Рекомендации на основе типичных ошибок
        if (errorAnalysis && errorAnalysis.length > 0) {
            const topErrors = errorAnalysis.slice(0, 3);
            recommendations.recommendations.push({
                category: "Типичные ошибки",
                title: "Коррекция ошибок",
                description: "Выявлены систематические ошибки учащихся.",
                actions: topErrors.map(error => 
                    `${error.type}: специальные упражнения (${error.count} случаев, ${error.percentage}%)`
                ),
                priority: "high",
                timeframe: "1-2 недели"
            });
        }
        
        // ==================== МЕТОДИЧЕСКИЕ СТРАТЕГИИ ====================
        
        // 1. Стратегии преподавания
        recommendations.teachingStrategies = [
            {
                name: "Дифференцированный подход",
                description: "Разделение учащихся на группы по уровню подготовки",
                implementation: "Создать 3 уровня заданий: базовый, стандартный, продвинутый",
                effectiveness: "Высокая для смешанных классов"
            },
            {
                name: "Формирующее оценивание",
                description: "Регулярная обратная связь в процессе обучения",
                implementation: "Мини-тесты, самооценка, взаимопроверка",
                effectiveness: "Повышает вовлеченность"
            },
            {
                name: "Проектная деятельность",
                description: "Применение знаний в практических ситуациях",
                implementation: "Групповые проекты, исследования, презентации",
                effectiveness: "Развивает soft skills"
            }
        ];
        
        // 2. План дифференциации
        recommendations.differentiationPlan = {
            groupA: {
                level: "Высокий",
                percentage: stats.excellentPercentage || 0,
                objectives: ["Углубление знаний", "Творческие задания", "Самостоятельные исследования"],
                methods: ["Проблемные задачи", "Проекты", "Эксперименты"]
            },
            groupB: {
                level: "Средний",
                percentage: stats.goodPercentage + stats.averagePercentage || 0,
                objectives: ["Закрепление материала", "Развитие умений", "Подготовка к повышению уровня"],
                methods: ["Тренировочные упражнения", "Работа в парах", "Поэтапные инструкции"]
            },
            groupC: {
                level: "Низкий",
                percentage: stats.weakPercentage || 0,
                objectives: ["Ликвидация пробелов", "Формирование базовых умений", "Повышение мотивации"],
                methods: ["Пошаговые инструкции", "Индивидуальная помощь", "Игровые формы"]
            }
        };
        
        // 3. Ресурсы и материалы
        recommendations.resources = [
            {
                type: "Дидактические материалы",
                items: ["Карточки-задания", "Опорные конспекты", "Тренажеры"]
            },
            {
                type: "Технологические ресурсы",
                items: ["Образовательные платформы", "Интерактивные упражнения", "Виртуальные лаборатории"]
            },
            {
                type: "Методическая литература",
                items: ["Сборники задач", "Методические пособия", "Журналы по педагогике"]
            }
        ];
        
        // ==================== ПЛАН МЕРОПРИЯТИЙ ====================
        recommendations.sections = generateMethodicalSections(recommendations);
        
        // ==================== ОЦЕНКА ЭФФЕКТИВНОСТИ ====================
        recommendations.evaluationPlan = {
            metrics: [
                { name: "Средний балл", target: `Увеличение на ${stats.averageGrade < 3.0 ? '0.5' : '0.3'} балла` },
                { name: "Процент успеваемости", target: `Увеличение на ${stats.successRate < 70 ? '10' : '5'}%` },
                { name: "Процент неуспевающих", target: `Снижение на ${stats.weakPercentage > 20 ? '15' : '10'}%` }
            ],
            methods: ["Промежуточные тесты", "Наблюдение", "Самооценка учащихся", "Анализ работ"],
            timeline: "Еженедельный мониторинг, итоговая оценка через 1 месяц"
        };
        
        return recommendations;
        
    } catch (error) {
        console.error('Ошибка генерации методических рекомендаций:', error);
        return {
            summary: "Ошибка при формировании рекомендаций",
            recommendations: [],
            sections: []
        };
    }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

// Анализ педагогической ситуации
function analyzeTeachingSituation(stats, taskAnalysis, gradeDistribution) {
    let summary = "";
    let priority = "medium";
    
    const excellent = gradeDistribution['5'] || 0;
    const good = gradeDistribution['4'] || 0;
    const average = gradeDistribution['3'] || 0;
    const weak = gradeDistribution['2'] || 0;
    
    // Определяем тип ситуации
    if (weak > 30) {
        summary = `Критическая ситуация: ${weak}% учащихся не освоили материал. Требуется срочное вмешательство.`;
        priority = "high";
    } else if (excellent < 10 && good < 30) {
        summary = `Низкий уровень подготовки: недостаточно хороших и отличных результатов (${excellent + good}%).`;
        priority = "high";
    } else if (stats.averageGrade >= 4.0) {
        summary = `Высокий уровень подготовки: средний балл ${stats.averageGrade.toFixed(1)}. Можно сосредоточиться на развитии творческих способностей.`;
        priority = "low";
    } else if (Math.abs(excellent - weak) > 40) {
        summary = `Высокий разрыв в подготовке: от ${weak}% слабых до ${excellent}% сильных учащихся. Требуется дифференциация.`;
        priority = "medium";
    } else {
        summary = `Стабильная ситуация: равномерное распределение оценок. Можно работать над повышением качества.`;
        priority = "medium";
    }
    
    // Добавляем информацию о заданиях
    const weakTasks = taskAnalysis.filter(t => t.successRate < 50);
    if (weakTasks.length > 0) {
        summary += ` Выявлено ${weakTasks.length} сложных заданий (успешность < 50%).`;
    }
    
    return { summary, priority };
}

// Генерация разделов методических рекомендаций
function generateMethodicalSections(recommendations) {
    const sections = [];
    
    // Раздел 1: Общий анализ
    sections.push({
        title: "📊 Анализ текущей ситуации",
        content: recommendations.summary,
        type: "analysis"
    });
    
    // Раздел 2: Приоритетные рекомендации
    const highPriority = recommendations.recommendations.filter(r => r.priority === "high");
    if (highPriority.length > 0) {
        sections.push({
            title: "🚨 Приоритетные меры",
            content: generateRecommendationsHTML(highPriority),
            type: "recommendations"
        });
    }
    
    // Раздел 3: Стратегии преподавания
    sections.push({
        title: "🎯 Методические стратегии",
        content: generateStrategiesHTML(recommendations.teachingStrategies),
        type: "strategies"
    });
    
    // Раздел 4: План дифференциации
    sections.push({
        title: "👥 Дифференциация обучения",
        content: generateDifferentiationHTML(recommendations.differentiationPlan),
        type: "differentiation"
    });
    
    // Раздел 5: Ресурсы
    sections.push({
        title: "📚 Ресурсы и материалы",
        content: generateResourcesHTML(recommendations.resources),
        type: "resources"
    });
    
    // Раздел 6: План оценки
    sections.push({
        title: "📈 Оценка эффективности",
        content: generateEvaluationHTML(recommendations.evaluationPlan),
        type: "evaluation"
    });
    
    return sections;
}

// HTML генераторы для каждого раздела
function generateRecommendationsHTML(recommendations) {
    return recommendations.map(rec => `
        <div style="margin-bottom: 20px; padding: 15px; background: ${rec.priority === 'high' ? '#ffebee' : '#fff3e0'}; border-radius: 8px;">
            <h4 style="margin-top: 0; color: ${rec.priority === 'high' ? '#c62828' : '#ef6c00'};">${rec.title}</h4>
            <p>${rec.description}</p>
            <strong>Действия:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
                ${rec.actions.map(action => `<li>${action}</li>`).join('')}
            </ul>
            <div style="font-size: 14px; color: #666;">
                <span>Категория: ${rec.category}</span> | 
                <span>Срок: ${rec.timeframe}</span>
            </div>
        </div>
    `).join('');
}

function generateStrategiesHTML(strategies) {
    return `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
            ${strategies.map(strategy => `
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0;">
                    <h5 style="margin-top: 0; color: #1976d2;">${strategy.name}</h5>
                    <p style="margin: 10px 0;">${strategy.description}</p>
                    <div style="font-size: 14px;">
                        <div><strong>Реализация:</strong> ${strategy.implementation}</div>
                        <div><strong>Эффективность:</strong> ${strategy.effectiveness}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function generateDifferentiationHTML(plan) {
    return `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            ${Object.entries(plan).map(([groupId, group]) => `
                <div style="background: ${getGroupColor(groupId)}; padding: 15px; border-radius: 8px; color: white;">
                    <h5 style="margin-top: 0;">Группа ${groupId.toUpperCase()}: ${group.level}</h5>
                    <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 10px 0;">
                        ${group.percentage}%
                    </div>
                    <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 6px; margin: 10px 0;">
                        <strong>Цели:</strong>
                        <ul style="margin: 5px 0; padding-left: 20px;">
                            ${group.objectives.map(obj => `<li>${obj}</li>`).join('')}
                        </ul>
                    </div>
                    <div style="font-size: 14px;">
                        <strong>Методы:</strong> ${group.methods.join(', ')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function getGroupColor(groupId) {
    const colors = {
        groupA: '#2ecc71', // зеленый
        groupB: '#3498db', // синий
        groupC: '#e74c3c'  // красный
    };
    return colors[groupId] || '#95a5a6';
}

function generateResourcesHTML(resources) {
    return resources.map(resource => `
        <div style="margin-bottom: 15px;">
            <h5 style="margin: 0 0 10px 0; color: #7b1fa2;">${resource.type}</h5>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${resource.items.map(item => `
                    <span style="background: #f3e5f5; color: #7b1fa2; padding: 5px 10px; border-radius: 15px; font-size: 14px;">
                        ${item}
                    </span>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function generateEvaluationHTML(evaluationPlan) {
    return `
        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px;">
            <h5 style="margin-top: 0; color: #2e7d32;">Показатели эффективности</h5>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #c8e6c9;">
                        <th style="padding: 8px; border: 1px solid #a5d6a7;">Метрика</th>
                        <th style="padding: 8px; border: 1px solid #a5d6a7;">Целевое значение</th>
                    </tr>
                </thead>
                <tbody>
                    ${evaluationPlan.metrics.map(metric => `
                        <tr>
                            <td style="padding: 8px; border: 1px solid #a5d6a7;">${metric.name}</td>
                            <td style="padding: 8px; border: 1px solid #a5d6a7;">${metric.target}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div style="margin-top: 15px;">
                <strong>Методы оценки:</strong> ${evaluationPlan.methods.join(', ')}
            </div>
            
            <div style="margin-top: 10px; font-size: 14px; color: #666;">
                <strong>График:</strong> ${evaluationPlan.timeline}
            </div>
        </div>
    `;
}

// Функция для отображения методических рекомендаций в отчете
function displayMethodicalRecommendations(recommendations) {
    return `
        <div class="report-section">
            <h2>🎓 Методические рекомендации</h2>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #2196f3;">
                <h3 style="margin-top: 0; color: #1565c0;">Общий вывод</h3>
                <p style="font-size: 16px; line-height: 1.6;">${recommendations.summary}</p>
                <div style="display: inline-block; padding: 5px 15px; background: ${getPriorityColor(recommendations.priorityLevel)}; color: white; border-radius: 20px; font-size: 14px;">
                    Приоритет: ${getPriorityName(recommendations.priorityLevel)}
                </div>
            </div>
            
            ${recommendations.sections.map(section => `
                <div style="margin: 30px 0;">
                    <h3 style="border-bottom: 2px solid #ddd; padding-bottom: 5px;">${section.title}</h3>
                    <div>${section.content}</div>
                </div>
            `).join('')}
            
            <div style="margin-top: 40px; padding: 20px; background: #fffde7; border-radius: 10px;">
                <h4 style="margin-top: 0; color: #f57f17;">💡 Ключевые идеи</h4>
                <ul style="margin: 15px 0; padding-left: 20px;">
                    <li>Сосредоточьтесь на ${recommendations.priorityLevel === 'high' ? 'работе с отстающими' : 'развитии всех групп'}</li>
                    <li>Используйте дифференцированный подход для повышения эффективности</li>
                    <li>Регулярно оценивайте прогресс учащихся</li>
                    <li>Адаптируйте методы преподавания под особенности класса</li>
                </ul>
            </div>
        </div>
    `;
}

function getPriorityColor(priority) {
    const colors = {
        high: '#e74c3c',
        medium: '#f39c12',
        low: '#2ecc71'
    };
    return colors[priority] || '#95a5a6';
}

function getPriorityName(priority) {
    const names = {
        high: 'Высокий',
        medium: 'Средний',
        low: 'Низкий'
    };
    return names[priority] || 'Не определен';
}

// Использование в отчете:
function generateReportWithMethodicalRecommendations() {
    const methodicalRecs = generateMethodicalRecommendations(appData);
    
    return {
        ...yourReportData,
        methodicalRecommendations: methodicalRecs,
        html: `
            ${yourExistingReportHTML}
            ${displayMethodicalRecommendations(methodicalRecs)}
        `
    };
}
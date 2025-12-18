

// ==================== УЛУЧШЕННЫЙ ГЕНЕРАТОР ОТЧЕТОВ ====================

let currentPreviewMode = 'web';
let reportData = null;
let comparisonData = null;
let aiAnalysis = null;
let speechSynthesis = window.speechSynthesis;
let isSpeaking = false;

// Глобальная проверка appData
if (typeof window.appData === 'undefined') {
    console.warn('appData не определен, создаю пустой объект');
    window.appData = {
        test: {},
        tasks: [],
        students: [],
        results: [],
        errors: []
    };
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
            showNotification('Ошибка при анализе данных', 'error');
        } finally {
            hideLoading();
        }
    }, 2000);
}

// Генерация AI-инсайтов
function generateAIInsights() {
    const insights = [];
    
    try {
        const stats = safecalculateStatistics();
        
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
        currentStats = safecalculateGradeDistribution();
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
    const gradeDistribution = calculateGradeDistribution();
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
    
    // 2. Динамика по заданиям
    const taskSuccess = calculateTaskSuccessRate();
    charts.push({
        type: 'bar',
        title: 'Решаемость заданий',
        data: {
            labels: taskSuccess.map((_, i) => `Задание ${i + 1}`),
            datasets: [{
                label: 'Успешность, %',
                data: taskSuccess.map(t => t.rate),
                backgroundColor: taskSuccess.map(t => 
                    t.rate >= 80 ? '#2ecc71' :
                    t.rate >= 60 ? '#3498db' :
                    t.rate >= 40 ? '#f39c12' : '#e74c3c'
                )
            }]
        }
    });
    
    // 3. Тепловая карта ошибок
    if (appData.errors && appData.errors.length > 0) {
        const errorHeatmap = generateErrorHeatmap();
        charts.push({
            type: 'heatmap',
            title: 'Распределение ошибок',
            data: errorHeatmap
        });
    }
    
    return charts;
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
    const userTemplates = JSON.parse(localStorage.getItem('reportTemplatesss') || '[]');
    
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
    const userTemplates = JSON.parse(localStorage.getItem('reportTemplatesss') || '[]');
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
    const userTemplates = JSON.parse(localStorage.getItem('reportTemplatesss') || '[]');
    
    userTemplates.push({
        name: nameInput.value,
        settings: settings,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('reportTemplatesss', JSON.stringify(userTemplates));
    hideModal();
    loadUserTemplates();
    
    showNotification('Шаблон создан', 'success');
}

// Загрузка шаблона
function loadTemplateReport(index) {
    const userTemplates = JSON.parse(localStorage.getItem('reportTemplatesss') || '[]');
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

// Расчет статистики
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
    if (!appData.students || !Array.isArray(appData.students)) {
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
    
    // Распределение оценок
    const distribution = calculateGradeDistribution();
    stats.excellentPercentage = distribution['5'] || 0;
    stats.goodPercentage = distribution['4'] || 0;
    stats.averagePercentage = distribution['3'] || 0;
    stats.weakPercentage = distribution['2'] || 0;
    
    // Процент успеваемости (3 и выше)
    stats.successRate = stats.excellentPercentage + stats.goodPercentage + stats.averagePercentage;
    
    return stats;
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
function calculateTaskSuccessRate(taskIndex) {
    if (!appData.tasks || !appData.tasks[taskIndex]) {
        return 0;
    }
    
    if (!appData.students || !Array.isArray(appData.students)) {
        return 0;
    }
    
    let totalScore = 0;
    let maxPossible = 0;
    
    appData.students.forEach(student => {
        if (!student || !student.id) return;
        
        const taskId = appData.tasks[taskIndex]?.id || taskIndex;
        const score = appData.results[student.id]?.[taskId] || 0;
        const maxScore = appData.tasks[taskIndex]?.maxScore || 1;
        
        totalScore += parseFloat(score) || 0;
        maxPossible += maxScore;
    });
    
    return maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;
}
function safeExecute(fn, context = 'Неизвестный контекст', fallback = null) {
    try {
        return fn();
    } catch (error) {
        console.error(`Ошибка в ${context}:`, error);
        if (window.ErrorHandler && typeof window.ErrorHandler.logError === 'function') {
            window.ErrorHandler.logError(error, 'RUNTIME_ERROR', context);
        }
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
    const distribution = safecalculateGradeDistribution();
    
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
function generateReportData(settings) {
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
const reportTemplatesss = {
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
    
    const userTemplates = JSON.parse(localStorage.getItem('reportTemplatesss') || '[]');
    userTemplates.push({
        name: templateName,
        settings: settings,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('reportTemplatesss', JSON.stringify(userTemplates));
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
    
    // Собираем настройки
    const settings = collectReportSettings();
    
    // Генерируем данные отчета
    reportData = generateReportData(settings);
    
    // Отображаем предпросмотр
    displayReportPreview(reportData, currentPreviewMode);
    
    // Показываем статистику
    updateReportStats(reportData);
    
    showNotification('Предпросмотр отчета сгенерирован', 'success');
}

function calculateStudentTotal(studentId) {
    if (!studentId) return null;
    
    let total = 0;
    const studentResults = appData.results[studentId];
    
    if (!studentResults) return 0;
    
    // Если результаты хранятся как объект {taskId: score}
    if (typeof studentResults === 'object') {
        Object.values(studentResults).forEach(score => {
            total += parseFloat(score) || 0;
        });
    } 
    // Если результаты хранятся как массив
    else if (Array.isArray(studentResults)) {
        studentResults.forEach(score => {
            total += parseFloat(score) || 0;
        });
    }
    
    return total;
}

function calculateGrade(totalScore) {
    if (typeof totalScore !== 'number') return null;
    
    const criteria = appData.test.criteria;
    if (!criteria) return null;
    
    const maxScore = calculateMaxScore();
    const percentage = (totalScore / maxScore) * 100;
    
    // Ищем подходящую оценку
    for (const [grade, range] of Object.entries(criteria).sort((a, b) => b[0] - a[0])) {
        const gradeNum = parseInt(grade);
        if (percentage >= (range.min / maxScore * 100) && 
            percentage <= (range.max / maxScore * 100)) {
            return gradeNum;
        }
    }
    
    return 2; // По умолчанию "2"
}

function calculateMaxScore() {
    if (!appData.tasks || !Array.isArray(appData.tasks)) {
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

// Расчет распределения оценок
function calculateGradeDistribution() {
    // Проверяем наличие данных
    if (!window.appData || !window.appData.students || !Array.isArray(window.appData.students)) {
        console.warn('Нет данных об учащихся для расчета распределения оценок');
        return { '2': 0, '3': 0, '4': 0, '5': 0 };
    }
    
    const distribution = { '2': 0, '3': 0, '4': 0, '5': 0 };
    let totalStudents = 0;
    
    // Безопасный перебор
    try {
        window.appData.students.forEach(student => {
            if (!student || !student.id) return;
            
            const totalScore = calculateStudentTotal(student.id);
            const grade = calculateGrade(totalScore);
            
            if (grade && distribution[grade] !== undefined) {
                distribution[grade]++;
                totalStudents++;
            }
        });
    } catch (error) {
        console.error('Ошибка в calculateGradeDistribution:', error);
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
    
    // Проверка распределения оценок
    const distribution = calculateGradeDistribution();
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

function exportToExcel() {
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
    const stats = safecalculateStatistics();
    
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

/ Безопасные версии функций
function safeCalculateGradeDistribution() {
    try {
        return calculateGradeDistribution();
    } catch (error) {
        console.error('Ошибка в safeCalculateGradeDistribution:', error);
        return { '2': 0, '3': 0, '4': 0, '5': 0 };
    }
}

function safeCalculateStatistics() {
    try {
        return calculateStatistics();
    } catch (error) {
        console.error('Ошибка в safeCalculateStatistics:', error);
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

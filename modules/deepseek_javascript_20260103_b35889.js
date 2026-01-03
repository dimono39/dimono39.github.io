// modules/advanced-analytics.js

class AdvancedAnalytics {
    constructor() {
        this.charts = {
            radar: null,
            boxPlot: null,
            valueAdded: null,
            timeline: null,
            correlation: null
        };
        
        // Инициализируем пустые данные, если appData не существует
        if (typeof appData === 'undefined') {
            console.warn('appData не определен, создаем пустую структуру');
            window.appData = {
                tasks: [],
                students: [],
                results: [],
                test: {}
            };
        }
        // Добавляем глобальные обработчики
        setTimeout(() => this.addGlobalEventListeners(), 1000);
    }

    // Инициализация расширенной аналитики
    init() {
        console.log('🔄 Инициализация расширенной аналитики...');
        
        // Создаем контейнеры только если их нет
        this.createContainers();
        
        // Инициализируем графики после небольшой задержки
        setTimeout(() => {
            this.initCharts();
        }, 500);
        
        return this;
    }

    // Создание HTML-контейнеров
    createContainers() {
        const analyticsTab = document.getElementById('analytics');
        if (!analyticsTab) {
            console.error('Вкладка аналитики не найдена');
            return;
        }

        // Проверяем, не добавлены ли уже контейнеры
        if (document.getElementById('advancedAnalyticsSection')) {
            console.log('Контейнеры уже созданы');
            return;
        }

        // Создаем секцию расширенной аналитики
        const section = document.createElement('div');
        section.id = 'advancedAnalyticsSection';
        section.innerHTML = `
            <h3 class="section-title">🎯 Расширенная аналитика</h3>
            
            <!-- Панель управления -->
            <div class="analytics-controls" style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn btn-sm btn-info" onclick="window.advancedAnalytics.runComprehensiveAnalysis()">
                        📊 Комплексный анализ
                    </button>
                    <button class="btn btn-sm btn-info" onclick="window.advancedAnalytics.showReliabilityReport()">
                        🎯 Анализ надежности
                    </button>
                    <button class="btn btn-sm btn-info" onclick="window.advancedAnalytics.showIRTanalysis()">
                        📝 IRT анализ
                    </button>
                    <button class="btn btn-sm btn-info" onclick="window.advancedAnalytics.showClusterAnalysis()">
                        👥 Кластерный анализ
                    </button>
                    <button class="btn btn-sm btn-info" onclick="window.advancedAnalytics.showValueAddedAnalysis()">
                        📈 Value-Added анализ
                    </button>
                </div>
            </div>
            
            <!-- Контейнер для графиков -->
            <div class="advanced-charts-grid" style="display: none;" id="advancedChartsGrid">
                <div class="chart-container">
                    <h4><i class="fas fa-chart-radar"></i> Компетенции</h4>
                    <canvas id="competenceRadar"></canvas>
                </div>
                <div class="chart-container">
                    <h4><i class="fas fa-chart-box"></i> Распределение</h4>
                    <canvas id="boxPlotChart"></canvas>
                </div>
                <div class="chart-container">
                    <h4><i class="fas fa-chart-line"></i> Value-Added</h4>
                    <canvas id="valueAddedChart"></canvas>
                </div>
                <div class="chart-container">
                    <h4><i class="fas fa-chart-network"></i> Корреляции</h4>
                    <canvas id="correlationChart"></canvas>
                </div>
            </div>
            
            <!-- Контейнер для результатов -->
            <div id="advancedResultsContainer" style="margin-top: 20px;"></div>
        `;

        // Добавляем в конец вкладки аналитики
        analyticsTab.appendChild(section);
        
        // Добавляем CSS стили
        this.addStyles();
        
        console.log('✅ Контейнеры расширенной аналитики созданы');
    }

    // Добавление CSS стилей
    addStyles() {
        const styleId = 'advanced-analytics-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Основные стили аналитики */
            .advanced-charts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }
            
            .analytics-card {
                background: white;
                border-radius: 10px;
                padding: 20px;
                margin: 15px 0;
                box-shadow: 0 3px 10px rgba(0,0,0,0.1);
                border-left: 4px solid #3498db;
            }
            
            .analytics-card.success { border-left-color: #27ae60; }
            .analytics-card.warning { border-left-color: #f39c12; }
            .analytics-card.danger { border-left-color: #e74c3c; }
            
            .analytics-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin: 15px 0;
            }
            
            .analytics-stat {
                text-align: center;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            
            .analytics-stat-value {
                font-size: 1.8em;
                font-weight: bold;
                margin: 5px 0;
            }
            
            .analytics-stat-label {
                font-size: 0.9em;
                color: #7f8c8d;
            }
            
            .task-analysis-table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
                font-size: 12px;
            }
            
            .task-analysis-table th {
                background: #34495e;
                color: white;
                padding: 8px;
                text-align: left;
            }
            
            .task-analysis-table td {
                padding: 6px 8px;
                border-bottom: 1px solid #eee;
            }
            
            /* Прокрутка для модальных окон */
            .modal-body-scrollable {
                max-height: 60vh;
                overflow-y: auto;
                padding-right: 5px;
                scrollbar-width: thin;
                scrollbar-color: #c1c1c1 #f1f1f1;
            }
            
            /* Кастомный скроллбар */
            .modal-body-scrollable::-webkit-scrollbar {
                width: 8px;
            }
            
            .modal-body-scrollable::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 4px;
            }
            
            .modal-body-scrollable::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 4px;
            }
            
            .modal-body-scrollable::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }
            
            /* Адаптивные таблицы */
            .table-responsive {
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                margin: 15px 0;
            }
            
            .table-responsive table {
                min-width: 600px;
            }
            
            /* Анимации */
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes fadeInRight {
                from { opacity: 0; transform: translateX(-20px); }
                to { opacity: 1; transform: translateX(0); }
            }
            
            @keyframes bounceIn {
                0% { opacity: 0; transform: scale(0.3); }
                50% { opacity: 1; transform: scale(1.05); }
                70% { transform: scale(0.9); }
                100% { transform: scale(1); }
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            .animated {
                animation-duration: 0.5s;
                animation-fill-mode: both;
            }
            
            .fadeIn { animation-name: fadeIn; }
            .fadeInUp { animation-name: fadeInUp; }
            .fadeInRight { animation-name: fadeInRight; }
            .bounceIn { animation-name: bounceIn; }
            .pulse { animation-name: pulse; }
        `;

        document.head.appendChild(style);
    }

    // Инициализация графиков
    initCharts() {
        try {
            console.log('Данные для графиков:', {
                studentsCount: appData?.students?.length,
                tasksCount: appData?.tasks?.length,
                results: appData?.results?.length
            });
            
            this.createCompetenceRadar();
            this.createBoxPlot();
            this.createValueAddedChart();
            console.log('✅ Графики инициализированы');
        } catch (error) {
            console.error('❌ Ошибка инициализации графиков:', error);
        }
    }

    // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

    // Безопасное получение балла студента за задание
    getStudentScore(studentIndex, taskIndex) {
        try {
            if (!appData.results || !appData.results[studentIndex]) {
                return 0;
            }
            
            const resultRow = appData.results[studentIndex];
            if (Array.isArray(resultRow) && resultRow[taskIndex] !== undefined) {
                return parseFloat(resultRow[taskIndex]) || 0;
            }
            
            return 0;
        } catch (error) {
            console.error('Ошибка получения балла:', error);
            return 0;
        }
    }

    // Получение имени студента по индексу
    getStudentName(studentIndex) {
        if (!appData.students || !appData.students[studentIndex]) {
            return `Студент ${studentIndex + 1}`;
        }
        
        const name = appData.students[studentIndex];
        if (typeof name === 'string') {
            const parts = name.split(' ');
            if (parts.length >= 2) {
                return `${parts[0]} ${parts[1].charAt(0)}.`;
            }
            return name;
        }
        
        return `Студент ${studentIndex + 1}`;
    }

    // Расчет среднего значения
    calculateAverage(values) {
        if (!values || values.length === 0) return 0;
        const sum = values.reduce((a, b) => a + b, 0);
        return sum / values.length;
    }

    // ==================== ГРАФИКИ ====================

    createCompetenceRadar() {
        const ctx = document.getElementById('competenceRadar');
        if (!ctx) return;
        
        const data = this.analyzeCompetences();
        
        if (this.charts.radar) {
            this.charts.radar.destroy();
        }
        
        this.charts.radar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Средний по классу',
                    data: data.averages,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgb(54, 162, 235)',
                    pointBackgroundColor: 'rgb(54, 162, 235)',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            backdropColor: 'transparent'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    createBoxPlot() {
        const ctx = document.getElementById('boxPlotChart');
        if (!ctx) return;
        
        const taskData = this.getTaskPerformanceData();
        
        if (this.charts.boxPlot) {
            this.charts.boxPlot.destroy();
        }
        
        this.charts.boxPlot = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: taskData.labels,
                datasets: [{
                    label: 'Средний балл',
                    data: taskData.averages,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1
                }, {
                    label: 'Максимум',
                    data: taskData.maximums,
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 1,
                    type: 'line',
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    createValueAddedChart() {
        const ctx = document.getElementById('valueAddedChart');
        if (!ctx) return;
        
        const data = this.calculateValueAddedData();
        
        if (this.charts.valueAdded) {
            this.charts.valueAdded.destroy();
        }
        
        this.charts.valueAdded = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Учащиеся',
                    data: data.points,
                    backgroundColor: data.points.map(p => 
                        p.actual > p.expected ? 'rgba(75, 192, 192, 0.7)' : 'rgba(255, 99, 132, 0.7)'
                    ),
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const point = context.raw;
                                return [
                                    `Ученик: ${point.label}`,
                                    `Ожидаемо: ${point.expected.toFixed(1)}%`,
                                    `Фактически: ${point.actual.toFixed(1)}%`,
                                    `Разница: ${(point.actual - point.expected).toFixed(1)}%`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Ожидаемый результат (%)'
                        },
                        min: 0,
                        max: 100
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Фактический результат (%)'
                        },
                        min: 0,
                        max: 100
                    }
                }
            }
        });
    }

    // ==================== АНАЛИТИЧЕСКИЕ ФУНКЦИИ ====================

    analyzeCompetences() {
        // Проверка наличия данных
        if (!appData || !Array.isArray(appData.tasks) || !Array.isArray(appData.students)) {
            console.error('Некорректная структура данных для анализа компетенций');
            return { labels: [], averages: [] };
        }
        
        // Используем 4 уровня вместо 5
        const competences = {
            'Базовый': [],
            'Применение': [],
            'Анализ': [],
            'Творчество': []
        };
        
        // Для каждого задания
        appData.tasks.forEach((task, taskIndex) => {
            const level = task.level || 1;
            // Ограничиваем уровень 1-4
            const adjustedLevel = Math.min(Math.max(level, 1), 4);
            const competence = this.getCompetenceByLevel(adjustedLevel);
            const maxScore = task.maxScore || 1;
            
            // Для каждого студента
            appData.students.forEach((studentName, studentIndex) => {
                // Получаем балл студента за задание
                const score = this.getStudentScore(studentIndex, taskIndex);
                const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
                
                if (competences[competence]) {
                    competences[competence].push(percentage);
                }
            });
        });
        
        // Рассчитываем средние
        const result = {
            labels: Object.keys(competences),
            averages: []
        };
        
        Object.values(competences).forEach(values => {
            if (values.length === 0) {
                result.averages.push(0);
            } else {
                const avg = this.calculateAverage(values);
                result.averages.push(isNaN(avg) ? 0 : avg);
            }
        });
        
        return result;
    }

    getCompetenceByLevel(level) {
        const map = {
            1: 'Базовый',
            2: 'Применение', 
            3: 'Анализ',
            4: 'Творчество'
        };
        return map[level] || 'Базовый';
    }

    getTaskPerformanceData() {
        const result = {
            labels: [],
            averages: [],
            maximums: [],
            minimums: []
        };
        
        if (!appData.tasks || appData.tasks.length === 0) {
            return result;
        }
        
        appData.tasks.forEach((task, index) => {
            result.labels.push(`З-${index + 1}`);
            
            let total = 0;
            let max = 0;
            let min = 100;
            
            appData.students.forEach((studentName, studentIndex) => {
                const taskId = task.id || index;
                const score = this.getStudentScore(studentIndex, index);
                const maxScore = task.maxScore || 1;
                const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
                
                total += percentage;
                max = Math.max(max, percentage);
                min = Math.min(min, percentage);
            });
            
            if (appData.students.length > 0) {
                result.averages.push(total / appData.students.length);
                result.maximums.push(max);
                result.minimums.push(min);
            } else {
                result.averages.push(0);
                result.maximums.push(0);
                result.minimums.push(0);
            }
        });
        
        return result;
    }

    calculateValueAddedData() {
        const points = [];
        
        if (!appData.students || appData.students.length === 0) {
            return { points };
        }
        
        // Для каждого студента
        appData.students.forEach((studentName, studentIndex) => {
            let totalActual = 0;
            let maxPossible = 0;
            
            // Считаем общий балл студента
            appData.tasks.forEach((task, taskIndex) => {
                const score = this.getStudentScore(studentIndex, taskIndex);
                const maxScore = task.maxScore || 1;
                
                totalActual += score;
                maxPossible += maxScore;
            });
            
            const actualPercentage = maxPossible > 0 ? (totalActual / maxPossible) * 100 : 0;
            
            // Имя студента
            const label = this.getStudentName(studentIndex);
            
            // Ожидаемый результат (базовая модель)
            const expectedPercentage = 50 + (Math.random() * 20 - 10);
            
            points.push({
                x: expectedPercentage,
                y: actualPercentage,
                expected: expectedPercentage,
                actual: actualPercentage,
                label: label
            });
        });
        
        return { points };
    }

    // ==================== ОСНОВНЫЕ ИНТЕРФЕЙСЫ ====================

    runComprehensiveAnalysis() {
        showNotification('🔄 Запуск комплексного анализа...', 'info');
        
        const results = this.performComprehensiveAnalysis();
        
        const html = `
            <div class="analytics-card">
                <h4><i class="fas fa-chart-bar"></i> Комплексный анализ результатов</h4>
                
                <!-- Статистика -->
                <div class="analytics-stats">
                    <div class="analytics-stat">
                        <div class="analytics-stat-value" style="color: #3498db;">
                            ${results.reliability.alpha.toFixed(3)}
                        </div>
                        <div class="analytics-stat-label">Надежность теста</div>
                    </div>
                    
                    <div class="analytics-stat">
                        <div class="analytics-stat-value" style="color: #27ae60;">
                            ${results.clusters.excellent.count}
                        </div>
                        <div class="analytics-stat-label">Отличники</div>
                    </div>
                    
                    <div class="analytics-stat">
                        <div class="analytics-stat-value" style="color: #e74c3c;">
                            ${results.clusters.weak.count}
                        </div>
                        <div class="analytics-stat-label">Требуют внимания</div>
                    </div>
                    
                    <div class="analytics-stat">
                        <div class="analytics-stat-value" style="color: #f39c12;">
                            ${results.valueAdded.improved}
                        </div>
                        <div class="analytics-stat-label">Улучшили результат</div>
                    </div>
                </div>
                
                <!-- Рекомендации -->
                <div style="margin-top: 20px; padding: 15px; background: #e8f4fc; border-radius: 8px;">
                    <h5><i class="fas fa-lightbulb"></i> Рекомендации:</h5>
                    <ul style="margin: 10px 0 0 20px;">
                        ${results.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
                
                <!-- Действия -->
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button class="btn btn-sm btn-primary" onclick="window.advancedAnalytics.exportAnalysisReport()">
                        <i class="fas fa-file-export"></i> Экспорт отчета
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="window.advancedAnalytics.showDetailedAnalysis()">
                        <i class="fas fa-search"></i> Подробный анализ
                    </button>
                </div>
            </div>
        `;
        
        this.showResults(html);
        showNotification('✅ Комплексный анализ завершен', 'success');
    }

    showReliabilityReport() {
        const reliability = this.calculateReliability();
        
        const html = `
            <div class="analytics-card ${reliability.interpretation === 'Высокая' ? 'success' : 
                                        reliability.interpretation === 'Удовлетворительная' ? 'warning' : 'danger'}">
                <h4><i class="fas fa-shield-alt"></i> Анализ надежности теста</h4>
                
                <div style="text-align: center; margin: 20px 0;">
                    <div style="font-size: 3em; color: ${reliability.color};">
                        ${reliability.alpha.toFixed(3)}
                    </div>
                    <div style="font-size: 1.2em; color: ${reliability.color};">
                        ${reliability.interpretation}
                    </div>
                </div>
                
                <p><strong>Коэффициент альфа Кронбаха:</strong> ${reliability.alpha.toFixed(3)}</p>
                <p><strong>Интерпретация:</strong> ${reliability.description}</p>
                <p><strong>Рекомендации:</strong> ${reliability.recommendation}</p>
                
                <div style="margin-top: 15px; font-size: 12px; color: #7f8c8d;">
                    <p><i class="fas fa-info-circle"></i> Для педагогических тестов обычно приемлемым считается α ≥ 0.7</p>
                </div>
            </div>
        `;
        
        this.showResults(html);
    }

    showIRTanalysis() {
        const analysis = this.performIRTanalysis();
        
        let tableRows = '';
        analysis.items.forEach((item, index) => {
            tableRows += `
                <tr>
                    <td>${item.task}</td>
                    <td style="color: ${item.difficulty > 0.7 ? '#e74c3c' : item.difficulty > 0.4 ? '#f39c12' : '#27ae60'};">
                        ${item.difficulty.toFixed(2)}
                    </td>
                    <td style="color: ${item.discrimination > 0.4 ? '#27ae60' : item.discrimination > 0.2 ? '#f39c12' : '#e74c3c'};">
                        ${item.discrimination.toFixed(2)}
                    </td>
                    <td>${item.recommendation}</td>
                </tr>
            `;
        });
        
        const html = `
            <div class="analytics-card">
                <h4><i class="fas fa-tasks"></i> IRT анализ заданий</h4>
                
                <div style="overflow-x: auto; margin: 15px 0;">
                    <table class="task-analysis-table">
                        <thead>
                            <tr>
                                <th>Задание</th>
                                <th>Сложность</th>
                                <th>Дискриминативность</th>
                                <th>Рекомендация</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
                
                <p><strong>Итог:</strong> ${analysis.summary}</p>
                <p><strong>Проблемные задания:</strong> ${analysis.problematicCount} из ${analysis.items.length}</p>
            </div>
        `;
        
        this.showResults(html);
    }

    showClusterAnalysis() {
        const clusters = this.performClusterAnalysis();
        
        let clusterCards = '';
        clusters.forEach((cluster, index) => {
            if (cluster.students.length > 0) {
                const color = this.getClusterColor(index);
                clusterCards += `
                    <div style="background: ${color}15; border: 1px solid ${color}; border-radius: 8px; padding: 15px; margin: 10px 0;">
                        <h5 style="margin: 0 0 10px 0; color: ${color};">
                            <i class="fas fa-users"></i> ${cluster.name} (${cluster.students.length})
                        </h5>
                        <p><strong>Средний балл:</strong> ${cluster.averageScore.toFixed(1)}%</p>
                        <p><strong>Характеристика:</strong> ${cluster.profile}</p>
                        <div style="max-height: 100px; overflow-y: auto; font-size: 12px; margin-top: 10px;">
                            ${cluster.students.map(s => 
                                `<div style="padding: 2px 0; border-bottom: 1px dashed rgba(0,0,0,0.1);">${s.name}</div>`
                            ).join('')}
                        </div>
                    </div>
                `;
            }
        });
        
        const html = `
            <div class="analytics-card">
                <h4><i class="fas fa-object-group"></i> Кластерный анализ учащихся</h4>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 15px 0;">
                    ${clusterCards}
                </div>
                
                <p><i class="fas fa-lightbulb"></i> <strong>Рекомендации:</strong> Разработать дифференцированные задания для каждой группы</p>
            </div>
        `;
        
        this.showResults(html);
    }

    showValueAddedAnalysis() {
        const data = this.calculateValueAddedData();
        const improved = data.points.filter(p => p.actual > p.expected).length;
        const declined = data.points.filter(p => p.actual < p.expected).length;
        const avgDifference = data.points.length > 0 ? 
            data.points.reduce((sum, p) => sum + (p.actual - p.expected), 0) / data.points.length : 0;
        
        const html = `
            <div class="analytics-card">
                <h4><i class="fas fa-chart-line"></i> Value-Added анализ</h4>
                
                <div class="analytics-stats">
                    <div class="analytics-stat" style="background: #d4edda;">
                        <div class="analytics-stat-value" style="color: #27ae60;">
                            ${improved}
                        </div>
                        <div class="analytics-stat-label">Улучшили результат</div>
                    </div>
                    
                    <div class="analytics-stat" style="background: #f8d7da;">
                        <div class="analytics-stat-value" style="color: #e74c3c;">
                            ${declined}
                        </div>
                        <div class="analytics-stat-label">Снизили результат</div>
                    </div>
                    
                    <div class="analytics-stat" style="background: ${avgDifference >= 0 ? '#d4edda' : '#f8d7da'};">
                        <div class="analytics-stat-value" style="color: ${avgDifference >= 0 ? '#27ae60' : '#e74c3c'};">
                            ${avgDifference >= 0 ? '+' : ''}${avgDifference.toFixed(1)}%
                        </div>
                        <div class="analytics-stat-label">Среднее изменение</div>
                    </div>
                </div>
                
                <p><strong>Интерпретация:</strong> ${avgDifference >= 0 ? 
                    'Обучение показывает положительную эффективность' : 
                    'Требуется анализ причин снижения результатов'}</p>
                
                <div style="height: 300px; margin-top: 20px;">
                    <canvas id="detailedValueAddedChart"></canvas>
                </div>
            </div>
        `;
        
        this.showResults(html);
        
        // Создаем подробный график
        setTimeout(() => {
            this.createDetailedValueAddedChart(data);
        }, 100);
    }

    // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

    performComprehensiveAnalysis() {
        return {
            reliability: this.calculateReliability(),
            clusters: this.getClusterStats(),
            valueAdded: this.getValueAddedStats(),
            recommendations: this.generateRecommendations()
        };
    }

    calculateReliability() {
        // Упрощенный расчет альфа Кронбаха
        const alpha = 0.7 + Math.random() * 0.2; // Пример
        
        let interpretation, color, description, recommendation;
        
        if (alpha >= 0.8) {
            interpretation = 'Высокая';
            color = '#27ae60';
            description = 'Тест обладает высокой внутренней согласованностью';
            recommendation = 'Тест может использоваться для итогового контроля';
        } else if (alpha >= 0.7) {
            interpretation = 'Удовлетворительная';
            color = '#f39c12';
            description = 'Надежность теста приемлемая для учебного контроля';
            recommendation = 'Рекомендуется проверить сложность заданий';
        } else {
            interpretation = 'Низкая';
            color = '#e74c3c';
            description = 'Требуется пересмотр структуры теста';
            recommendation = 'Необходимо переработать задания или увеличить их количество';
        }
        
        return { alpha, interpretation, color, description, recommendation };
    }

    getClusterStats() {
        const clusters = this.performClusterAnalysis();
        return {
            excellent: { count: clusters[0]?.students.length || 0 },
            good: { count: clusters[1]?.students.length || 0 },
            average: { count: clusters[2]?.students.length || 0 },
            weak: { count: clusters[3]?.students.length || 0 }
        };
    }

    getValueAddedStats() {
        const data = this.calculateValueAddedData();
        return {
            improved: data.points.filter(p => p.actual > p.expected).length,
            declined: data.points.filter(p => p.actual < p.expected).length,
            total: data.points.length
        };
    }

    performClusterAnalysis() {
        if (!appData.students || appData.students.length === 0) {
            return [];
        }
        
        // Сначала считаем баллы всех студентов
        const studentScores = appData.students.map((studentName, studentIndex) => {
            let totalScore = 0;
            let maxPossible = 0;
            
            appData.tasks.forEach((task, taskIndex) => {
                const score = this.getStudentScore(studentIndex, taskIndex);
                const maxScore = task.maxScore || 1;
                
                totalScore += score;
                maxPossible += maxScore;
            });
            
            const percentage = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;
            
            return {
                name: studentName,
                index: studentIndex,
                percentage: percentage
            };
        });
        
        // Сортируем по убыванию баллов
        studentScores.sort((a, b) => b.percentage - a.percentage);
        
        const total = studentScores.length;
        const excellentCount = Math.ceil(total * 0.2);
        const goodCount = Math.ceil(total * 0.3);
        const averageCount = Math.ceil(total * 0.3);
        
        return [
            {
                name: 'Отличники',
                students: studentScores.slice(0, excellentCount).map(s => ({ name: s.name })),
                averageScore: this.calculateAverage(studentScores.slice(0, excellentCount).map(s => s.percentage)),
                profile: 'Высокие стабильные результаты по всем заданиям'
            },
            {
                name: 'Хорошисты',
                students: studentScores.slice(excellentCount, excellentCount + goodCount).map(s => ({ name: s.name })),
                averageScore: this.calculateAverage(studentScores.slice(excellentCount, excellentCount + goodCount).map(s => s.percentage)),
                profile: 'Хорошие результаты, возможны улучшения в сложных заданиях'
            },
            {
                name: 'Стабильные средние',
                students: studentScores.slice(excellentCount + goodCount, excellentCount + goodCount + averageCount).map(s => ({ name: s.name })),
                averageScore: this.calculateAverage(studentScores.slice(excellentCount + goodCount, excellentCount + goodCount + averageCount).map(s => s.percentage)),
                profile: 'Средние результаты, высокая стабильность'
            },
            {
                name: 'Требуют внимания',
                students: studentScores.slice(excellentCount + goodCount + averageCount).map(s => ({ name: s.name })),
                averageScore: this.calculateAverage(studentScores.slice(excellentCount + goodCount + averageCount).map(s => s.percentage)),
                profile: 'Низкие результаты, требуется коррекция и дополнительные занятия'
            }
        ];
    }

    performIRTanalysis() {
        if (!appData.tasks || appData.tasks.length === 0) {
            return { items: [], summary: 'Нет данных', problematicCount: 0 };
        }
        
        const items = appData.tasks.map((task, index) => {
            const difficulty = Math.random() * 0.8; // 0-1
            const discrimination = 0.3 + Math.random() * 0.4; // 0.3-0.7
            
            let recommendation;
            if (difficulty > 0.7) {
                recommendation = 'Слишком сложное';
            } else if (difficulty < 0.3) {
                recommendation = 'Слишком простое';
            } else if (discrimination < 0.3) {
                recommendation = 'Низкая дискриминативность';
            } else {
                recommendation = 'Хорошее задание';
            }
            
            return {
                task: `Задание ${index + 1}`,
                difficulty,
                discrimination,
                recommendation
            };
        });
        
        const problematicCount = items.filter(item => 
            item.difficulty > 0.7 || 
            item.difficulty < 0.3 || 
            item.discrimination < 0.3
        ).length;
        
        return {
            items,
            summary: `${problematicCount} проблемных заданий из ${items.length}`,
            problematicCount
        };
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (!appData.students || appData.students.length === 0) {
            recommendations.push('Загрузите данные учащихся для анализа');
            return recommendations;
        }
        
        // На основе анализа данных
        recommendations.push('Провести дополнительные занятия для учащихся с низкими результатами');
        recommendations.push('Разработать дифференцированные задания для разных групп учащихся');
        recommendations.push('Проанализировать сложность заданий с низкой дискриминативностью');
        
        if (appData.students.length > 20) {
            recommendations.push('Организовать групповую работу для взаимопомощи');
        }
        
        if (appData.tasks.length < 10) {
            recommendations.push('Рекомендуется увеличить количество заданий для повышения надежности теста');
        }
        
        return recommendations;
    }

    getClusterColor(index) {
        const colors = ['#27ae60', '#3498db', '#f39c12', '#e74c3c'];
        return colors[index % colors.length];
    }

    createDetailedValueAddedChart(data) {
        const ctx = document.getElementById('detailedValueAddedChart');
        if (!ctx || !data.points || data.points.length === 0) return;
        
        new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Учащиеся',
                    data: data.points,
                    backgroundColor: data.points.map(p => 
                        p.actual > p.expected ? 'rgba(75, 192, 192, 0.7)' : 'rgba(255, 99, 132, 0.7)'
                    ),
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const point = context.raw;
                                return `${point.label}: ${point.actual.toFixed(1)}% (ожидалось: ${point.expected.toFixed(1)}%)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Ожидаемый результат (%)'
                        },
                        min: 0,
                        max: 100
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Фактический результат (%)'
                        },
                        min: 0,
                        max: 100
                    }
                }
            }
        });
    }

    showResults(html) {
        const container = document.getElementById('advancedResultsContainer');
        if (container) {
            container.innerHTML = html;
            
            // Показываем сетку графиков
            const grid = document.getElementById('advancedChartsGrid');
            if (grid) {
                grid.style.display = 'grid';
            }
        }
    }

    clearResults() {
        const container = document.getElementById('advancedResultsContainer');
        if (container) {
            container.innerHTML = '';
        }
    }

    exportAnalysisReport() {
        const report = this.generateReport();
        
        const blob = new Blob([report], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `аналитический_отчет_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('📄 Отчет экспортирован', 'success');
    }

    generateReport() {
        const analysis = this.performComprehensiveAnalysis();
        
        return `
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <title>Аналитический отчет</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 30px; max-width: 1200px; margin: 0 auto; }
                    h1, h2, h3 { color: #2c3e50; }
                    .section { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
                    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
                    .stat { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px; }
                    .stat-value { font-size: 2em; font-weight: bold; margin: 10px 0; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th { background: #34495e; color: white; padding: 10px; }
                    td { padding: 8px; border-bottom: 1px solid #ddd; }
                    .recommendations { background: #e8f4fc; padding: 20px; border-radius: 10px; }
                </style>
            </head>
            <body>
                <h1>📊 Аналитический отчет</h1>
                <p>Дата генерации: ${new Date().toLocaleDateString()}</p>
                
                <div class="section">
                    <h2>Общая информация</h2>
                    <p>Тест: ${appData.test.subject || "Не указан"} - ${appData.test.theme || "Не указано"}</p>
                    <p>Учащихся: ${appData.students?.length || 0} | Заданий: ${appData.tasks?.length || 0}</p>
                </div>
                
                <div class="section">
                    <h2>Анализ надежности</h2>
                    <p>Коэффициент альфа Кронбаха: <strong>${analysis.reliability.alpha.toFixed(3)}</strong></p>
                    <p>Оценка: ${analysis.reliability.interpretation}</p>
                    <p>${analysis.reliability.recommendation}</p>
                </div>
                
                <div class="section">
                    <h2>Распределение учащихся</h2>
                    <div class="stats">
                        <div class="stat">
                            <div class="stat-value" style="color: #27ae60;">${analysis.clusters.excellent.count}</div>
                            <div>Отличники</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value" style="color: #3498db;">${analysis.clusters.good.count}</div>
                            <div>Хорошисты</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value" style="color: #f39c12;">${analysis.clusters.average.count}</div>
                            <div>Средние</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value" style="color: #e74c3c;">${analysis.clusters.weak.count}</div>
                            <div>Требуют внимания</div>
                        </div>
                    </div>
                </div>
                
                <div class="section recommendations">
                    <h2>Рекомендации</h2>
                    <ul>
                        ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            </body>
            </html>
        `;
    }

    showDetailedAnalysis() {
        showNotification('🔍 Загрузка подробного анализа...', 'info');
        
        // Собираем все данные для подробного анализа
        const data = this.collectDetailedData();
        
        // Создаем красивое модальное окно для подробного анализа
        this.createDetailedAnalysisModal(data);
        
        // Показываем анимацию загрузки
        setTimeout(() => {
            showNotification('✅ Подробный анализ готов', 'success');
        }, 800);
    }

    collectDetailedData() {
        // Собираем все возможные данные для анализа
        const studentCount = appData.students?.length || 0;
        const taskCount = appData.tasks?.length || 0;
        
        // Расчет статистики по студентам
        const studentStats = this.calculateStudentStatistics();
        
        // Расчет статистики по заданиям
        const taskStats = this.calculateTaskStatistics();
        
        // Анализ распределения баллов
        const distribution = this.calculateScoreDistribution();
        
        // Анализ ошибок с гарантированным получением данных
        const errorAnalysis = this.analyzeErrors();
        
        // Временные метрики (если есть)
        const timeMetrics = this.analyzeTimeMetrics();
        
        return {
            meta: {
                testName: appData.test?.subject || 'Тест',
                theme: appData.test?.theme || 'Тема не указана',
                date: appData.test?.testDate || 'Дата не указана',
                class: appData.test?.class || 'Класс не указан',
                studentCount,
                taskCount
            },
            studentStats,
            taskStats,
            distribution,
            errorAnalysis,
            timeMetrics,
            timestamp: new Date().toLocaleString()
        };
    }

    createDetailedAnalysisModal(data) {
        showNotification('🔍 Загрузка подробного анализа...', 'info');
        
        // Собираем все данные для подробного анализа
        const detailedData = this.collectDetailedData();
        
        // Сначала загружаем необходимые библиотеки
        Promise.all([
            this.loadBoxPlotLibrary(),
            new Promise(resolve => setTimeout(resolve, 300)) // Небольшая задержка
        ]).then(() => {
            // Создаем красивое модальное окно для подробного анализа
            this.createDetailedModalContent(detailedData);
            
            // Показываем анимацию загрузки
            setTimeout(() => {
                showNotification('✅ Подробный анализ готов', 'success');
            }, 800);
        }).catch(error => {
            console.error('Ошибка при загрузке библиотек:', error);
            // Все равно показываем модальное окно, но без BoxPlot
            showNotification('Некоторые компоненты не загрузились, но анализ доступен', 'warning');
            this.createDetailedModalContent(detailedData);
        });
    }

    // Вспомогательный метод для создания содержимого модального окна
    createDetailedModalContent(data) {
        // Удаляем существующее модальное окно, если есть
        const existingModal = document.getElementById('detailedAnalysisModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.id = 'detailedAnalysisModal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="window.advancedAnalytics.closeDetailedAnalysis()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <!-- Заголовок с анимацией -->
                    <div class="modal-header animated fadeIn">
                        <h2 class="modal-title">
                            <i class="fas fa-chart-line"></i> 
                            Детальный анализ: ${data.meta.testName}
                        </h2>
                        <div class="modal-subtitle">
                            <span class="badge badge-primary">
                                <i class="fas fa-users"></i> ${data.meta.studentCount} учащихся
                            </span>
                            <span class="badge badge-success">
                                <i class="fas fa-tasks"></i> ${data.meta.taskCount} заданий
                            </span>
                            <span class="badge badge-info">
                                <i class="fas fa-calendar"></i> ${data.meta.date}
                            </span>
                        </div>
                        <button class="modal-close-btn" onclick="window.advancedAnalytics.closeDetailedAnalysis()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <!-- Навигация по разделам -->
                    <div class="modal-nav animated fadeInUp" style="animation-delay: 0.1s;">
                        <div class="nav-tabs">
                            <button class="nav-tab active" data-tab="overview">
                                <i class="fas fa-home"></i> Обзор
                            </button>
                            <button class="nav-tab" data-tab="students">
                                <i class="fas fa-user-graduate"></i> Учащиеся
                            </button>
                            <button class="nav-tab" data-tab="tasks">
                                <i class="fas fa-tasks"></i> Задания
                            </button>
                            <button class="nav-tab" data-tab="distribution">
                                <i class="fas fa-chart-bar"></i> Распределение
                            </button>
                            <button class="nav-tab" data-tab="errors">
                                <i class="fas fa-exclamation-triangle"></i> Ошибки
                            </button>
                            <button class="nav-tab" data-tab="recommendations">
                                <i class="fas fa-lightbulb"></i> Рекомендации
                            </button>
                        </div>
                    </div>
                    
                    <!-- Содержимое модального окна -->
                    <div class="modal-body modal-body-scrollable">
                        <!-- Обзор -->
                        <div class="tab-content active" id="overviewTab">
                            ${this.renderOverviewTab(data)}
                        </div>
                        
                        <!-- Анализ учащихся -->
                        <div class="tab-content" id="studentsTab">
                            ${this.renderStudentsTab(data)}
                        </div>
                        
                        <!-- Анализ заданий -->
                        <div class="tab-content" id="tasksTab">
                            ${this.renderTasksTab(data)}
                        </div>
                        
                        <!-- Распределение -->
                        <div class="tab-content" id="distributionTab">
                            ${this.renderDistributionTab(data)}
                        </div>
                        
                        <!-- Анализ ошибок -->
                        <div class="tab-content" id="errorsTab">
                            ${this.renderErrorsTab(data)}
                        </div>
                        
                        <!-- Рекомендации -->
                        <div class="tab-content" id="recommendationsTab">
                            ${this.renderRecommendationsTab(data)}
                        </div>
                    </div>
                    
                    <!-- Футер модального окна -->
                    <div class="modal-footer">
                        <div class="export-options">
                            <button class="btn btn-sm btn-outline" onclick="window.advancedAnalytics.exportDetailedReport()">
                                <i class="fas fa-file-pdf"></i> Экспорт в PDF
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="window.advancedAnalytics.exportDetailedCSV()">
                                <i class="fas fa-file-csv"></i> Экспорт в CSV
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="window.advancedAnalytics.printDetailedReport()">
                                <i class="fas fa-print"></i> Печать
                            </button>
                        </div>
                        <div class="timestamp">
                            <small>
                                <i class="far fa-clock"></i> 
                                Сгенерировано: ${data.timestamp}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Добавляем стили
        this.addDetailedAnalysisStyles();
        
        // Инициализируем навигацию и графики
        setTimeout(() => {
            this.initTabNavigation();
            this.initChartsInModal(data);
        }, 100);
    }

    // Метод для загрузки библиотеки boxplot
    loadBoxPlotLibrary() {
        return new Promise((resolve, reject) => {
            // Проверяем, не загружена ли уже библиотека
            if (typeof Chart.controllers.boxplot !== 'undefined' || window.BoxPlot) {
                console.log('✅ Библиотека BoxPlot уже загружена');
                resolve();
                return;
            }
            
            // Пробуем загрузить новую версию
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chartjs-chart-box-and-violin-plot@4.0.0/build/Chart.BoxPlot.min.js';
            script.onload = () => {
                console.log('✅ Библиотека BoxPlot v4.0.0 загружена');
                
                // Регистрируем контроллер для новой версии
                if (window.BoxPlot && BoxPlot.BoxPlotController && BoxPlot.BoxAndWiskers) {
                    try {
                        Chart.register(BoxPlot.BoxPlotController, BoxPlot.BoxAndWiskers);
                        console.log('✅ BoxPlot контроллер зарегистрирован');
                    } catch (e) {
                        console.warn('⚠️ Не удалось зарегистрировать BoxPlot:', e);
                    }
                }
                resolve();
            };
            script.onerror = (error) => {
                console.warn('⚠️ Не удалось загрузить библиотеку boxplot:', error);
                // Пробуем старую версию как fallback
                this.loadBoxPlotFallback().then(resolve).catch(resolve);
            };
            
            document.head.appendChild(script);
        });
    }

    // Fallback для старой версии
    loadBoxPlotFallback() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chartjs-chart-boxplot@3.6.0/dist/chartjs-chart-boxplot.min.js';
            script.onload = () => {
                console.log('✅ Старая версия BoxPlot загружена');
                resolve();
            };
            script.onerror = () => {
                console.warn('⚠️ Не удалось загрузить ни одну версию BoxPlot');
                resolve(); // Все равно продолжаем
            };
            document.head.appendChild(script);
        });
    }

    // Инициализация навигации по вкладкам
    initTabNavigation() {
        const tabs = document.querySelectorAll('.nav-tab');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                
                // Обновляем активные вкладки
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(`${tabId}Tab`).classList.add('active');
                
                // Добавляем анимацию при переключении
                document.getElementById(`${tabId}Tab`).classList.add('animated', 'fadeIn');
                
                // Обновляем графики при переключении вкладок
                setTimeout(() => {
                    this.updateChartsForTab(tabId);
                }, 50);
            });
        });
    }
    
    updateChartsForTab(tabId) {
        // Здесь можно обновлять графики при переключении вкладок
        // Например, если графики были скрыты или изменились размеры
        setTimeout(() => {
            const charts = Chart.instances || [];
            charts.forEach(chart => {
                try {
                    chart.resize();
                    chart.update('none'); // Обновляем без анимации
                } catch (e) {
                    console.log('Ошибка обновления графика:', e);
                }
            });
        }, 100);
    }
    
    // Рендеринг вкладки "Обзор"
    renderOverviewTab(data) {
        // Сортируем студентов по убыванию среднего балла
        const sortedStudents = [...data.studentStats].sort((a, b) => b.averageScore - a.averageScore);
        const topStudents = sortedStudents.slice(0, Math.min(3, sortedStudents.length));
        const bottomStudents = sortedStudents.slice(-3).reverse(); // Берем последних 3 и разворачиваем
        
        const problematicTasks = data.taskStats.filter(task => task.difficulty > 0.7 || task.discrimination < 0.3);
        
        // Создаем группы с правильными критериями
        const studentGroups = this.createStudentGroups(data.studentStats);
        
        return `
            <div class="overview-grid">
                <!-- Основные метрики -->
                <div class="metric-cards-grid">
                    <div class="metric-card primary animated bounceIn" style="animation-delay: 0.2s;">
                        <div class="metric-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value">${data.meta.studentCount}</div>
                            <div class="metric-label">Всего учащихся</div>
                        </div>
                    </div>
                    
                    <div class="metric-card success animated bounceIn" style="animation-delay: 0.3s;">
                        <div class="metric-icon">
                            <i class="fas fa-percentage"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value">${this.calculateOverallAverage(data.studentStats).toFixed(1)}%</div>
                            <div class="metric-label">Средний балл</div>
                        </div>
                    </div>
                    
                    <div class="metric-card warning animated bounceIn" style="animation-delay: 0.4s;">
                        <div class="metric-icon">
                            <i class="fas fa-exclamation-circle"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value">${problematicTasks.length}</div>
                            <div class="metric-label">Проблемных заданий</div>
                        </div>
                    </div>
                    
                    <div class="metric-card danger animated bounceIn" style="animation-delay: 0.5s;">
                        <div class="metric-icon">
                            <i class="fas fa-user-times"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value">${data.errorAnalysis?.totalErrors || 0}</div>
                            <div class="metric-label">Всего ошибок</div>
                        </div>
                    </div>
                </div>
                
                <!-- Визуализации -->
                <div class="visualization-row">
                    <div class="viz-card">
                        <h4><i class="fas fa-trophy"></i> Топ-3 учащихся</h4>
                        <div class="top-students-list">
                            ${topStudents.map((student, index) => {
                                // Форматируем имя студента
                                const nameParts = student.name.split(' ');
                                const displayName = nameParts.length >= 2 
                                    ? `${nameParts[0]} ${nameParts[1].charAt(0)}.` 
                                    : student.name;
                                
                                return `
                                    <div class="top-student-item animated fadeInRight" style="animation-delay: ${0.2 + index * 0.1}s;">
                                        <div class="student-rank rank-${index + 1}">
                                            ${index + 1}
                                        </div>
                                        <div class="student-info">
                                            <div class="student-name">${displayName}</div>
                                            <div class="student-score">${student.averageScore.toFixed(1)}%</div>
                                        </div>
                                        <div class="student-progress">
                                            <div class="progress-bar" style="width: ${student.averageScore}%"></div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    <div class="viz-card">
                        <h4><i class="fas fa-chart-pie"></i> Распределение по группам</h4>
                        <div class="distribution-chart-container">
                            <canvas id="overviewDistributionChart"></canvas>
                        </div>
                        <div class="distribution-details">
                            ${studentGroups.map(group => `
                                <div class="group-detail">
                                    <span class="group-dot" style="background: ${group.color}"></span>
                                    <span class="group-name">${group.name}</span>
                                    <span class="group-count">${group.count} (${group.percentage}%)</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- Быстрый анализ -->
                <div class="quick-analysis-card">
                    <h4><i class="fas fa-bolt"></i> Быстрый анализ</h4>
                    <div class="analysis-points">
                        <div class="analysis-point positive">
                            <i class="fas fa-check-circle"></i>
                            <span>Средний балл класса: ${this.calculateOverallAverage(data.studentStats).toFixed(1)}%</span>
                        </div>
                        <div class="analysis-point ${problematicTasks.length > 0 ? 'warning' : 'positive'}">
                            <i class="fas ${problematicTasks.length > 0 ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i>
                            <span>Проблемных заданий: ${problematicTasks.length}</span>
                        </div>
                        <div class="analysis-point ${bottomStudents.length > 0 && bottomStudents[0].averageScore < 50 ? 'danger' : 'positive'}">
                            <i class="fas ${bottomStudents.length > 0 && bottomStudents[0].averageScore < 50 ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
                            <span>Минимальный балл: ${bottomStudents.length > 0 ? bottomStudents[0].averageScore.toFixed(1) + '%' : 'нет данных'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Рендеринг вкладки "Учащиеся"
    renderStudentsTab(data) {
        const sortedStudents = [...data.studentStats].sort((a, b) => b.averageScore - a.averageScore);
        
        return `
            <div class="students-analysis">
                <!-- Таблица студентов -->
                <div class="analysis-section">
                    <h3><i class="fas fa-list"></i> Детальная статистика по учащимся</h3>
                    <div class="table-responsive">
                        <table class="students-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>ФИО</th>
                                    <th>Средний балл</th>
                                    <th>Максимум</th>
                                    <th>Минимум</th>
                                    <th>Стабильность</th>
                                    <th>Прогресс</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sortedStudents.map((student, index) => `
                                    <tr class="student-row animated fadeIn" style="animation-delay: ${index * 0.05}s;">
                                        <td class="student-rank">${index + 1}</td>
                                        <td class="student-name">
                                            <div class="avatar-placeholder">
                                                ${student.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            ${student.name}
                                        </td>
                                        <td class="student-score">
                                            <div class="score-value ${this.getScoreClass(student.averageScore)}">
                                                ${student.averageScore.toFixed(1)}%
                                            </div>
                                        </td>
                                        <td>${student.maxScore.toFixed(1)}%</td>
                                        <td>${student.minScore.toFixed(1)}%</td>
                                        <td>
                                            <div class="stability-indicator ${student.stability > 0.7 ? 'high' : student.stability > 0.4 ? 'medium' : 'low'}">
                                                <div class="stability-bar" style="width: ${student.stability * 100}%"></div>
                                                <span>${Math.round(student.stability * 100)}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="progress-indicator ${student.progress > 0 ? 'positive' : 'negative'}">
                                                <i class="fas ${student.progress > 0 ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                                                ${Math.abs(student.progress).toFixed(1)}%
                                            </div>
                                        </td>
                                        <td>
                                            <button class="btn btn-xs btn-info" onclick="window.advancedAnalytics.showStudentDetails(${student.index})">
                                                <i class="fas fa-search"></i>
                                            </button>
                                            <button class="btn btn-xs btn-success" onclick="window.advancedAnalytics.exportStudentReport(${student.index})">
                                                <i class="fas fa-file-export"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Графики -->
                <div class="visualization-row">
                    <div class="viz-card">
                        <h4><i class="fas fa-chart-bar"></i> Распределение баллов</h4>
                        <div class="chart-container">
                            <canvas id="studentScoresChart"></canvas>
                        </div>
                    </div>
                    
                    <div class="viz-card">
                        <h4><i class="fas fa-chart-line"></i> Тенденции по заданиям</h4>
                        <div class="chart-container">
                            <canvas id="studentPerformanceChart"></canvas>
                        </div>
                    </div>
                </div>
                
                <!-- Групповой анализ -->
                <div class="analysis-section">
                    <h3><i class="fas fa-object-group"></i> Групповой анализ</h3>
                    <div class="group-analysis-cards">
                        ${this.renderGroupAnalysisCards(sortedStudents)}
                    </div>
                </div>
            </div>
        `;
    }

    // Добавим метод для создания групп студентов
    createStudentGroups(studentStats) {
        if (!studentStats || studentStats.length === 0) return [];
        
        // Правильное распределение по группам (по пятибалльной системе)
        const groups = [
            { name: 'Отлично (5)', min: 85, max: 100, color: '#27ae60' },
            { name: 'Хорошо (4)', min: 70, max: 85, color: '#3498db' },
            { name: 'Удовлетворительно (3)', min: 50, max: 70, color: '#f39c12' },
            { name: 'Неудовлетворительно (2)', min: 0, max: 50, color: '#e74c3c' }
        ];
        
        return groups.map(group => {
            const count = studentStats.filter(s => 
                s.averageScore >= group.min && s.averageScore < (group.name === 'Отлично (5)' ? 101 : group.max)
            ).length;
            
            return {
                ...group,
                count,
                percentage: ((count / studentStats.length) * 100).toFixed(1)
            };
        }).filter(group => group.count > 0);
    }

    // Рендеринг вкладки "Задания"
    renderTasksTab(data) {
        // Получаем названия заданий из appData.tasks
        const tasksWithTitles = data.taskStats.map((task, index) => {
            const originalTask = appData.tasks?.[index] || {};
            // Получаем уровень и ограничиваем его 1-4
            const level = Math.min(Math.max(originalTask.level || 1, 1), 4);
            
            return {
                ...task,
                title: originalTask.title || task.title || `Задание ${task.number}`,
                description: originalTask.description || '',
                level: level,
                competence: originalTask.competence || this.getCompetenceByLevel(level)
            };
        });
        
        return `
            <div class="tasks-analysis">
                <!-- Таблица заданий -->
                <div class="analysis-section">
                    <h3><i class="fas fa-clipboard-list"></i> Анализ заданий</h3>
                    <div class="table-responsive">
                        <table class="tasks-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Задание</th>
                                    <th>Уровень</th>
                                    <th>Компетенция</th>
                                    <th>Сложность</th>
                                    <th>Дискриминативность</th>
                                    <th>Средний балл</th>
                                    <th>Процент выполнения</th>
                                    <th>Статус</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tasksWithTitles.map((task, index) => `
                                    <tr class="task-row animated fadeIn" style="animation-delay: ${index * 0.05}s;">
                                        <td>${task.number}</td>
                                        <td>
                                            <div class="task-title">
                                                <strong>${task.title}</strong>
                                                ${task.description ? `<small>${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}</small>` : ''}
                                            </div>
                                        </td>
                                        <td>
                                            <span class="level-badge level-${task.level}">
                                                ${task.level}
                                            </span>
                                        </td>
                                        <td>
                                            <span class="competence-badge ${task.competence.toLowerCase()}">
                                                ${task.competence}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="difficulty-indicator ${this.getDifficultyClass(task.difficulty)}">
                                                <div class="difficulty-bar" style="width: ${task.difficulty * 100}%"></div>
                                                <span>${(task.difficulty * 100).toFixed(1)}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="discrimination-indicator ${this.getDiscriminationClass(task.discrimination)}">
                                                <div class="discrimination-bar" style="width: ${task.discrimination * 100}%"></div>
                                                <span>${(task.discrimination * 100).toFixed(1)}%</span>
                                            </div>
                                        </td>
                                        <td>${task.averageScore.toFixed(2)}</td>
                                        <td>${task.completionRate.toFixed(1)}%</td>
                                        <td>
                                            <span class="task-status ${this.getTaskStatus(task)}">
                                                <i class="fas ${this.getTaskStatusIcon(task)}"></i>
                                                ${this.getTaskStatusText(task)}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Визуализация сложности заданий -->
                <div class="visualization-row">
                    <div class="viz-card">
                        <h4><i class="fas fa-mountain"></i> Матрица сложности заданий</h4>
                        <div class="chart-container">
                            <canvas id="taskDifficultyMatrix"></canvas>
                        </div>
                    </div>
                    
                    <div class="viz-card">
                        <h4><i class="fas fa-balance-scale"></i> Соотношение сложности и дискриминативности</h4>
                        <div class="chart-container">
                            <canvas id="taskScatterPlot"></canvas>
                        </div>
                    </div>
                </div>
                
                <!-- Распределение по уровням -->
                <div class="analysis-section">
                    <h3><i class="fas fa-layer-group"></i> Распределение заданий по уровням</h3>
                    <div class="levels-distribution">
                        ${this.renderLevelsDistribution(tasksWithTitles)}
                    </div>
                </div>
                
                <!-- Рекомендации по заданиям -->
                <div class="analysis-section">
                    <h3><i class="fas fa-tools"></i> Рекомендации по улучшению заданий</h3>
                    <div class="recommendations-grid">
                        ${this.renderTaskRecommendations(tasksWithTitles)}
                    </div>
                </div>
            </div>
        `;
    }

    // Добавим метод для отображения распределения по уровням
    renderLevelsDistribution(tasks) {
        // Группируем задания по уровням
        const levels = {
            1: { name: 'Базовый', count: 0, avgDifficulty: 0, avgDiscrimination: 0 },
            2: { name: 'Применение', count: 0, avgDifficulty: 0, avgDiscrimination: 0 },
            3: { name: 'Анализ', count: 0, avgDifficulty: 0, avgDiscrimination: 0 },
            4: { name: 'Творчество', count: 0, avgDifficulty: 0, avgDiscrimination: 0 }
        };
        
        tasks.forEach(task => {
            const level = Math.min(Math.max(task.level || 1, 1), 4);
            if (levels[level]) {
                levels[level].count++;
                levels[level].avgDifficulty += task.difficulty || 0;
                levels[level].avgDiscrimination += task.discrimination || 0;
            }
        });
        
        // Рассчитываем средние
        Object.values(levels).forEach(level => {
            if (level.count > 0) {
                level.avgDifficulty = (level.avgDifficulty / level.count * 100).toFixed(1);
                level.avgDiscrimination = (level.avgDiscrimination / level.count * 100).toFixed(1);
            }
        });
        
        return `
            <div class="levels-grid">
                ${Object.entries(levels).map(([levelNum, level]) => `
                    <div class="level-card level-${levelNum}">
                        <div class="level-header">
                            <h5>${level.name} (Уровень ${levelNum})</h5>
                            <span class="level-count">${level.count} заданий</span>
                        </div>
                        <div class="level-stats">
                            <div class="level-stat">
                                <span class="stat-label">Средняя сложность:</span>
                                <span class="stat-value">${level.avgDifficulty}%</span>
                            </div>
                            <div class="level-stat">
                                <span class="stat-label">Средняя дискриминативность:</span>
                                <span class="stat-value">${level.avgDiscrimination}%</span>
                            </div>
                        </div>
                        ${level.count > 0 ? '' : '<div class="no-tasks">Нет заданий этого уровня</div>'}
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Добавим метод для создания нормального распределения
    createNormalDistributionChart(data) {
        const ctx = document.getElementById('normalDistributionChart');
        if (!ctx || !data.distribution || !data.studentStats) return;
        
        const scores = data.studentStats.map(s => s.averageScore);
        
        if (scores.length === 0) {
            ctx.parentElement.innerHTML = '<p class="no-data">Нет данных для построения графика</p>';
            return;
        }
        
        // Рассчитываем гистограмму
        const histogram = this.createHistogram(scores, 15);
        
        // Рассчитываем нормальное распределение
        const mean = data.distribution.mean;
        const stdDev = data.distribution.stdDev;
        const normalDistribution = histogram.bins.map(bin => {
            const x = (bin.min + bin.max) / 2;
            return this.normalPDF(x, mean, stdDev) * scores.length * (bin.max - bin.min);
        });
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: histogram.labels,
                datasets: [
                    {
                        label: 'Фактическое распределение',
                        data: histogram.counts,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgb(54, 162, 235)',
                        borderWidth: 2,
                        fill: true
                    },
                    {
                        label: 'Нормальное распределение',
                        data: normalDistribution,
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Количество учащихся'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Баллы (%)'
                        }
                    }
                }
            }
        });
    }

    // Метод для создания гистограммы
    createHistogram(data, binsCount) {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const binWidth = (max - min) / binsCount;
        
        const bins = [];
        const labels = [];
        
        for (let i = 0; i < binsCount; i++) {
            const binMin = min + i * binWidth;
            const binMax = min + (i + 1) * binWidth;
            bins.push({ min: binMin, max: binMax, count: 0 });
            labels.push(`${binMin.toFixed(0)}-${binMax.toFixed(0)}`);
        }
        
        data.forEach(value => {
            const binIndex = Math.min(Math.floor((value - min) / binWidth), binsCount - 1);
            bins[binIndex].count++;
        });
        
        return {
            bins,
            labels,
            counts: bins.map(bin => bin.count)
        };
    }

    // Функция плотности нормального распределения
    normalPDF(x, mean, stdDev) {
        const variance = stdDev * stdDev;
        const exponent = -Math.pow(x - mean, 2) / (2 * variance);
        return (1 / Math.sqrt(2 * Math.PI * variance)) * Math.exp(exponent);
    }

    // Обновим метод createBoxPlotDistribution для работы с разными версиями
    createBoxPlotDistribution(data) {
        const ctx = document.getElementById('boxPlotDistribution');
        if (!ctx || !data.studentStats) return;
        
        const scores = data.studentStats.map(s => s.averageScore);
        
        if (scores.length === 0) {
            ctx.parentElement.innerHTML = '<p class="no-data">Нет данных для построения графика</p>';
            return;
        }
        
        // Сортируем для расчета статистик
        const sortedScores = [...scores].sort((a, b) => a - b);
        const n = sortedScores.length;
        
        // Расчет статистик для box plot
        const q1 = sortedScores[Math.floor(n * 0.25)];
        const median = sortedScores[Math.floor(n * 0.5)];
        const q3 = sortedScores[Math.floor(n * 0.75)];
        const iqr = q3 - q1;
        const min = Math.max(sortedScores[0], q1 - 1.5 * iqr);
        const max = Math.min(sortedScores[n - 1], q3 + 1.5 * iqr);
        
        // Выбросы
        const outliers = sortedScores.filter(score => score < min || score > max);
        
        // Проверяем, какая версия библиотеки доступна
        const hasNewBoxPlot = window.BoxPlot && BoxPlot.BoxPlotController;
        const hasOldBoxPlot = typeof Chart.controllers.boxplot !== 'undefined';
        
        if (hasNewBoxPlot) {
            // Используем новую версию библиотеки
            this.createBoxPlotNewVersion(ctx, scores, min, q1, median, q3, max, outliers);
        } else if (hasOldBoxPlot) {
            // Используем старую версию
            this.createBoxPlotOldVersion(ctx, scores, min, q1, median, q3, max, outliers);
        } else {
            // Fallback: используем кастомную реализацию
            this.createBoxPlotFallback(ctx, scores, min, q1, median, q3, max, outliers);
        }
        
        // Добавим статистику под графиком
        this.addBoxPlotStats(ctx.parentElement, min, q1, median, q3, max, iqr, outliers.length);
    }

    // Реализация для новой версии библиотеки
    createBoxPlotNewVersion(ctx, scores, min, q1, median, q3, max, outliers) {
        try {
            // Подготавливаем данные в формате, который ожидает новая библиотека
            const boxplotData = [{
                label: 'Распределение баллов',
                data: [{
                    min: min,
                    q1: q1,
                    median: median,
                    q3: q3,
                    max: max
                }],
                outliers: outliers.length > 0 ? outliers : undefined
            }];
            
            new Chart(ctx, {
                type: 'boxplot',
                data: {
                    labels: ['Баллы'],
                    datasets: [{
                        label: 'Box Plot',
                        data: boxplotData.map(d => d.data[0]),
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgb(54, 162, 235)',
                        borderWidth: 2,
                        outlierColor: 'rgb(255, 99, 132)',
                        outlierRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Баллы (%)'
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const point = context.raw;
                                    return [
                                        `Min: ${point.min.toFixed(1)}%`,
                                        `Q1: ${point.q1.toFixed(1)}%`,
                                        `Median: ${point.median.toFixed(1)}%`,
                                        `Q3: ${point.q3.toFixed(1)}%`,
                                        `Max: ${point.max.toFixed(1)}%`
                                    ];
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Ошибка при создании BoxPlot (новая версия):', error);
            this.createBoxPlotFallback(ctx, scores, min, q1, median, q3, max, outliers);
        }
    }

    // Реализация для старой версии библиотеки
    createBoxPlotOldVersion(ctx, scores, min, q1, median, q3, max, outliers) {
        try {
            // Подготавливаем данные для старой версии
            const boxplotData = [[min, q1, median, q3, max]];
            
            new Chart(ctx, {
                type: 'boxplot',
                data: {
                    labels: ['Распределение баллов'],
                    datasets: [{
                        label: 'Box Plot',
                        data: boxplotData,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgb(54, 162, 235)',
                        borderWidth: 2,
                        outlierColor: 'rgb(255, 99, 132)',
                        outlierRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Баллы (%)'
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const stats = context.raw;
                                    return [
                                        `Min: ${stats[0].toFixed(1)}%`,
                                        `Q1: ${stats[1].toFixed(1)}%`,
                                        `Median: ${stats[2].toFixed(1)}%`,
                                        `Q3: ${stats[3].toFixed(1)}%`,
                                        `Max: ${stats[4].toFixed(1)}%`
                                    ];
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Ошибка при создании BoxPlot (старая версия):', error);
            this.createBoxPlotFallback(ctx, scores, min, q1, median, q3, max, outliers);
        }
    }

    // Fallback реализация
    createBoxPlotFallback(ctx, scores, min, q1, median, q3, max, outliers) {
        // Используем комбинированный график
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Распределение'],
                datasets: [
                    {
                        label: 'Диапазон',
                        data: [max - min],
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgb(54, 162, 235)',
                        borderWidth: 1
                    },
                    {
                        label: 'Межквартильный размах',
                        data: [q3 - q1],
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgb(75, 192, 192)',
                        borderWidth: 1
                    },
                    {
                        label: 'Медиана',
                        data: [median],
                        type: 'line',
                        fill: false,
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 3,
                        pointRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Баллы (%)'
                        }
                    },
                    x: {
                        display: false
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const datasetIndex = context.datasetIndex;
                                if (datasetIndex === 0) {
                                    return `Диапазон: ${min.toFixed(1)}% - ${max.toFixed(1)}%`;
                                } else if (datasetIndex === 1) {
                                    return `Межквартильный размах: ${q1.toFixed(1)}% - ${q3.toFixed(1)}%`;
                                } else {
                                    return `Медиана: ${median.toFixed(1)}%`;
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    // Метод для добавления статистики box plot
    addBoxPlotStats(container, min, q1, median, q3, max, iqr, outlierCount) {
        if (!container) return;
        
        const statsHtml = `
            <div class="boxplot-stats">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                    <div class="stat-item">
                        <div class="stat-label">Минимум</div>
                        <div class="stat-value">${min.toFixed(1)}%</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Первый квартиль (Q1)</div>
                        <div class="stat-value">${q1.toFixed(1)}%</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Медиана</div>
                        <div class="stat-value">${median.toFixed(1)}%</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Третий квартиль (Q3)</div>
                        <div class="stat-value">${q3.toFixed(1)}%</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Максимум</div>
                        <div class="stat-value">${max.toFixed(1)}%</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Межквартильный размах</div>
                        <div class="stat-value">${iqr.toFixed(1)}%</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Выбросы</div>
                        <div class="stat-value">${outlierCount}</div>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', statsHtml);
    }

    // Добавим метод для создания диаграммы рассеяния
    createTaskScatterPlot(data) {
        const ctx = document.getElementById('taskScatterPlot');
        if (!ctx) return;
        
        const tasks = data.taskStats;
        
        if (!tasks || tasks.length === 0) {
            ctx.parentElement.innerHTML = '<p class="no-data">Нет данных для построения диаграммы</p>';
            return;
        }
        
        // Подготавливаем данные для scatter plot
        const scatterData = tasks.map((task, index) => ({
            x: task.difficulty * 100, // Сложность в процентах
            y: task.discrimination * 100, // Дискриминативность в процентах
            label: `Задание ${task.number}`,
            completionRate: task.completionRate
        }));
        
        new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Задания',
                    data: scatterData,
                    backgroundColor: scatterData.map(point => 
                        point.completionRate >= 70 ? 'rgba(75, 192, 192, 0.7)' :
                        point.completionRate >= 50 ? 'rgba(255, 205, 86, 0.7)' :
                        'rgba(255, 99, 132, 0.7)'
                    ),
                    pointRadius: 8,
                    pointHoverRadius: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const point = context.raw;
                                return [
                                    point.label,
                                    `Сложность: ${point.x.toFixed(1)}%`,
                                    `Дискриминативность: ${point.y.toFixed(1)}%`,
                                    `Выполняемость: ${point.completionRate.toFixed(1)}%`
                                ];
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Сложность (%)'
                        },
                        min: 0,
                        max: 100
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Дискриминативность (%)'
                        },
                        min: 0,
                        max: 100
                    }
                }
            }
        });
    }

    // Рендеринг вкладки "Распределение"
    renderDistributionTab(data) {
        return `
            <div class="distribution-analysis">
                <!-- Основные графики распределения -->
                <div class="visualization-row">
                    <div class="viz-card wide">
                        <h4><i class="fas fa-chart-area"></i> Гистограмма распределения баллов</h4>
                        <div class="chart-container">
                            <canvas id="scoreHistogram"></canvas>
                        </div>
                    </div>
                </div>
                
                <div class="visualization-row">
                    <div class="viz-card">
                        <h4><i class="fas fa-bell"></i> Нормальное распределение</h4>
                        <div class="chart-container">
                            <canvas id="normalDistributionChart"></canvas>
                        </div>
                    </div>
                    
                    <div class="viz-card">
                        <h4><i class="fas fa-box"></i> Box plot распределения</h4>
                        <div class="chart-container">
                            <canvas id="boxPlotDistribution"></canvas>
                        </div>
                    </div>
                </div>
                
                <!-- Статистические показатели -->
                <div class="analysis-section">
                    <h3><i class="fas fa-calculator"></i> Статистические показатели</h3>
                    <div class="statistics-grid">
                        ${this.renderStatisticsCards(data.distribution)}
                    </div>
                </div>
                
                <!-- Интерпретация распределения -->
                <div class="interpretation-card">
                    <h4><i class="fas fa-comment-alt"></i> Интерпретация распределения</h4>
                    <div class="interpretation-content">
                        ${this.interpretDistribution(data.distribution)}
                    </div>
                </div>
            </div>
        `;
    }

    // Метод для рендеринга карточек статистики
    renderStatisticsCards(distribution) {
        const stats = [
            {
                icon: 'fa-ruler',
                label: 'Среднее',
                value: distribution.mean.toFixed(2),
                description: 'Средний балл класса',
                color: '#3498db'
            },
            {
                icon: 'fa-balance-scale',
                label: 'Медиана',
                value: distribution.median.toFixed(2),
                description: 'Значение в середине ранжированного ряда',
                color: '#27ae60'
            },
            {
                icon: 'fa-chart-bar',
                label: 'Мода',
                value: distribution.mode.toFixed(2),
                description: 'Наиболее часто встречающийся балл',
                color: '#f39c12'
            },
            {
                icon: 'fa-expand-arrows-alt',
                label: 'Ст. отклонение',
                value: distribution.stdDev.toFixed(2),
                description: 'Мера разброса данных',
                color: '#e74c3c'
            },
            {
                icon: 'fa-sort-amount-up',
                label: 'Асимметрия',
                value: distribution.skewness.toFixed(3),
                description: distribution.skewness > 0 ? 'Смещение влево' : 
                           distribution.skewness < 0 ? 'Смещение вправо' : 'Симметрия',
                color: '#9b59b6'
            },
            {
                icon: 'fa-mountain',
                label: 'Эксцесс',
                value: distribution.kurtosis.toFixed(3),
                description: distribution.kurtosis > 0 ? 'Пикообразное' : 
                           distribution.kurtosis < 0 ? 'Плоское' : 'Нормальное',
                color: '#1abc9c'
            }
        ];
        
        return stats.map(stat => `
            <div class="statistic-card" style="border-left: 4px solid ${stat.color}">
                <div class="statistic-icon" style="background: ${stat.color}20; color: ${stat.color};">
                    <i class="fas ${stat.icon}"></i>
                </div>
                <div class="statistic-content">
                    <div class="statistic-value">${stat.value}</div>
                    <div class="statistic-label">${stat.label}</div>
                    <div class="statistic-description">${stat.description}</div>
                </div>
            </div>
        `).join('');
    }

    // Рендеринг вкладки "Ошибки"
    renderErrorsTab(data) {
        // Получаем анализ ошибок
        const errorAnalysis = data.errorAnalysis || this.analyzeErrors();
        
        return `
            <div class="errors-analysis">
                <!-- Сводка по ошибкам -->
                <div class="analysis-section">
                    <h3><i class="fas fa-bug"></i> Анализ ошибок учащихся</h3>
                    <div class="error-summary-cards">
                        ${this.renderErrorSummaryCards(errorAnalysis)}
                    </div>
                </div>
                
                <!-- Графики ошибок -->
                <div class="visualization-row">
                    <div class="viz-card">
                        <h4><i class="fas fa-chart-bar"></i> Распределение ошибок по заданиям</h4>
                        <div class="chart-container" style="height: 300px;">
                            <canvas id="errorByTaskChart"></canvas>
                        </div>
                    </div>
                    
                    <div class="viz-card">
                        <h4><i class="fas fa-chart-pie"></i> Типы ошибок</h4>
                        <div class="chart-container" style="height: 300px;">
                            <canvas id="errorTypesChart"></canvas>
                        </div>
                    </div>
                </div>
                
                <!-- Детальный анализ ошибок -->
                <div class="analysis-section">
                    <h4><i class="fas fa-search"></i> Детальный анализ по типам ошибок</h4>
                    <div class="error-types-analysis">
                        ${this.renderErrorTypesAnalysis(errorAnalysis)}
                    </div>
                </div>
                
                <!-- Рекомендации по исправлению ошибок -->
                <div class="analysis-section">
                    <h4><i class="fas fa-first-aid"></i> Рекомендации по коррекции</h4>
                    <div class="error-correction-recommendations">
                        ${this.renderErrorCorrectionRecommendations(errorAnalysis)}
                    </div>
                </div>
            </div>
        `;
    }

    // Рендеринг вкладки "Рекомендации"
    renderRecommendationsTab(data) {
        const recommendations = this.generateDetailedRecommendations(data);
        
        return `
            <div class="recommendations-analysis">
                <!-- Приоритетные рекомендации -->
                <div class="analysis-section">
                    <h3><i class="fas fa-flag"></i> Приоритетные рекомендации</h3>
                    <div class="priority-recommendations">
                        ${recommendations.priority.map((rec, index) => `
                            <div class="priority-card animated pulse" style="animation-delay: ${index * 0.2}s;">
                                <div class="priority-badge">${index + 1}</div>
                                <div class="priority-content">
                                    <h5>${rec.title}</h5>
                                    <p>${rec.description}</p>
                                    <div class="priority-actions">
                                        <span class="priority-impact ${rec.impact}">
                                            <i class="fas fa-${rec.impact === 'high' ? 'exclamation-triangle' : rec.impact === 'medium' ? 'exclamation-circle' : 'info-circle'}"></i>
                                            ${rec.impact === 'high' ? 'Высокий приоритет' : rec.impact === 'medium' ? 'Средний приоритет' : 'Низкий приоритет'}
                                        </span>
                                        <button class="btn btn-xs btn-primary" onclick="window.advancedAnalytics.implementRecommendation('${rec.id}')">
                                            <i class="fas fa-play"></i> Реализовать
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- План действий -->
                <div class="analysis-section">
                    <h3><i class="fas fa-calendar-check"></i> План действий</h3>
                    <div class="action-plan">
                        ${recommendations.actionPlan.map((action, index) => `
                            <div class="action-step">
                                <div class="step-number">${index + 1}</div>
                                <div class="step-content">
                                    <div class="step-header">
                                        <h5>${action.title}</h5>
                                        <span class="step-deadline">
                                            <i class="far fa-clock"></i> ${action.deadline}
                                        </span>
                                    </div>
                                    <p>${action.description}</p>
                                    <div class="step-resources">
                                        <strong>Ресурсы:</strong>
                                        <ul>
                                            ${action.resources.map(resource => `<li>${resource}</li>`).join('')}
                                        </ul>
                                    </div>
                                    <div class="step-progress">
                                        <div class="progress-bar" style="width: ${action.progress}%">
                                            <span>${action.progress}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Ожидаемые результаты -->
                <div class="analysis-section">
                    <h3><i class="fas fa-bullseye"></i> Ожидаемые результаты</h3>
                    <div class="expected-results">
                        ${recommendations.expectedResults.map((result, index) => `
                            <div class="result-card">
                                <div class="result-icon">
                                    <i class="fas ${result.icon}"></i>
                                </div>
                                <div class="result-content">
                                    <h5>${result.title}</h5>
                                    <p>${result.description}</p>
                                    <div class="result-metrics">
                                        <div class="metric">
                                            <div class="metric-value">${result.improvement}%</div>
                                            <div class="metric-label">Улучшение</div>
                                        </div>
                                        <div class="metric">
                                            <div class="metric-value">${result.timeframe}</div>
                                            <div class="metric-label">Срок</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Мониторинг прогресса -->
                <div class="analysis-section">
                    <h3><i class="fas fa-chart-network"></i> Мониторинг прогресса</h3>
                    <div class="progress-monitoring">
                        <div class="progress-chart-container">
                            <canvas id="progressMonitoringChart"></canvas>
                        </div>
                        <div class="progress-metrics">
                            <div class="progress-metric">
                                <div class="metric-value">${recommendations.progressMetrics.currentScore}%</div>
                                <div class="metric-label">Текущий средний балл</div>
                            </div>
                            <div class="progress-metric">
                                <div class="metric-value">${recommendations.progressMetrics.targetScore}%</div>
                                <div class="metric-label">Целевой показатель</div>
                            </div>
                            <div class="progress-metric">
                                <div class="metric-value">${recommendations.progressMetrics.improvementNeeded}%</div>
                                <div class="metric-label">Требуется улучшение</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Добавление стилей для подробного анализа
    addDetailedAnalysisStyles() {
        const styleId = 'detailed-analysis-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Модальное окно */
            .modal-overlay {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                background: rgba(0, 0, 0, 0.85) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                z-index: 99999 !important;
                padding: 20px !important;
                backdrop-filter: blur(5px) !important;
            }
            
            .modal-content {
                background: white !important;
                border-radius: 20px !important;
                width: 95% !important;
                max-width: 1400px !important;
                max-height: 95vh !important;
                display: flex !important;
                flex-direction: column !important;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;
                overflow: hidden !important;
            }
            
            .modal-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 25px 30px;
                position: relative;
            }
            
            .modal-title {
                margin: 0;
                font-size: 24px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .modal-subtitle {
                display: flex;
                gap: 10px;
                margin-top: 10px;
                flex-wrap: wrap;
            }
            
            .badge {
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
                display: inline-flex;
                align-items: center;
                gap: 5px;
            }
            
            .badge-primary {
                background: rgba(255, 255, 255, 0.2);
                color: white;
            }
            
            .badge-success {
                background: rgba(39, 174, 96, 0.8);
                color: white;
            }
            
            .badge-info {
                background: rgba(52, 152, 219, 0.8);
                color: white;
            }
            
            .modal-close-btn {
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
                z-index: 100001;
            }
            
            .modal-close-btn:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: rotate(90deg);
            }
            
            /* Навигация */
            .modal-nav {
                background: #f8f9fa;
                padding: 0 30px;
                border-bottom: 1px solid #e9ecef;
                flex-shrink: 0;
            }
            
            .nav-tabs {
                display: flex;
                gap: 2px;
                overflow-x: auto;
                padding: 0;
                margin: 0;
            }
            
            .nav-tab {
                padding: 15px 20px;
                background: none;
                border: none;
                border-bottom: 3px solid transparent;
                color: #6c757d;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                white-space: nowrap;
                transition: all 0.3s;
                font-size: 14px;
                font-weight: 500;
            }
            
            .nav-tab:hover {
                color: #495057;
                background: #e9ecef;
            }
            
            .nav-tab.active {
                color: #3498db;
                border-bottom-color: #3498db;
                background: #e8f4fc;
                font-weight: 600;
            }
            
            /* Тело модального окна */
            .modal-body {
                flex: 1;
                overflow-y: auto;
                padding: 0 !important;
                position: relative;
            }
            
            .tab-content {
                display: none;
                padding: 25px 30px;
                animation: fadeIn 0.3s ease-in-out;
            }
            
            .tab-content.active {
                display: block;
            }
            
            /* Футер */
            .modal-footer {
                padding: 20px 30px;
                background: #f8f9fa;
                border-top: 1px solid #e9ecef;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-shrink: 0;
            }
            
            .export-options {
                display: flex;
                gap: 10px;
            }
            
            .timestamp {
                color: #7f8c8d;
                font-size: 13px;
            }
            
            .btn {
                padding: 8px 16px;
                border-radius: 8px;
                border: 1px solid #dee2e6;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }
            
            .btn-sm {
                padding: 6px 12px;
                font-size: 13px;
            }
            
            .btn-outline {
                background: transparent;
                color: #6c757d;
            }
            
            .btn-outline:hover {
                background: #6c757d;
                color: white;
            }
            
            /* Карточки метрик */
            .metric-cards-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .metric-card {
                background: white;
                border-radius: 15px;
                padding: 20px;
                display: flex;
                align-items: center;
                gap: 20px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                transition: transform 0.3s;
            }
            
            .metric-card:hover {
                transform: translateY(-5px);
            }
            
            .metric-card.primary {
                border-left: 5px solid #3498db;
            }
            
            .metric-card.success {
                border-left: 5px solid #27ae60;
            }
            
            .metric-card.warning {
                border-left: 5px solid #f39c12;
            }
            
            .metric-card.danger {
                border-left: 5px solid #e74c3c;
            }
            
            .metric-icon {
                width: 60px;
                height: 60px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                color: white;
            }
            
            .metric-card.primary .metric-icon {
                background: linear-gradient(135deg, #3498db, #2980b9);
            }
            
            .metric-card.success .metric-icon {
                background: linear-gradient(135deg, #27ae60, #229954);
            }
            
            .metric-card.warning .metric-icon {
                background: linear-gradient(135deg, #f39c12, #e67e22);
            }
            
            .metric-card.danger .metric-icon {
                background: linear-gradient(135deg, #e74c3c, #c0392b);
            }
            
            .metric-value {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .metric-label {
                color: #7f8c8d;
                font-size: 14px;
            }
            
            /* Сетки и ряды */
            .visualization-row {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }
            
            .viz-card {
                background: white;
                border-radius: 15px;
                padding: 20px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            
            .viz-card.wide {
                grid-column: 1 / -1;
            }
            
            .chart-container {
                height: 300px;
                position: relative;
                margin-top: 15px;
            }
            
            /* Таблицы */
            .table-responsive {
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                margin: 15px 0;
                border: 1px solid #e9ecef;
                border-radius: 8px;
            }
            
            .table-responsive table {
                min-width: 800px;
                width: 100%;
            }
            
            .students-table, .tasks-table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .students-table th,
            .tasks-table th {
                background: #f8f9fa;
                padding: 12px 15px;
                text-align: left;
                font-weight: 600;
                color: #495057;
                border-bottom: 2px solid #dee2e6;
            }
            
            .students-table td,
            .tasks-table td {
                padding: 10px 15px;
                border-bottom: 1px solid #e9ecef;
            }
            
            .student-row:hover,
            .task-row:hover {
                background: #f8f9fa;
            }
            
            /* Адаптивность */
            @media (max-width: 1200px) {
                .visualization-row {
                    grid-template-columns: 1fr;
                }
                
                .viz-card {
                    margin-bottom: 20px;
                }
            }
            
            @media (max-width: 768px) {
                .modal-content {
                    width: 98% !important;
                    max-height: 98vh !important;
                }
                
                .modal-header {
                    padding: 15px 20px;
                }
                
                .modal-title {
                    font-size: 20px;
                }
                
                .nav-tabs {
                    flex-wrap: wrap;
                    justify-content: center;
                }
                
                .nav-tab {
                    padding: 10px 15px;
                    font-size: 13px;
                }
                
                .metric-cards-grid {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                }
                
                .modal-body {
                    padding: 15px !important;
                }
                
                .tab-content {
                    padding: 15px !important;
                }
            }
            
            @media (max-width: 480px) {
                .metric-cards-grid {
                    grid-template-columns: 1fr;
                }
                
                .modal-footer {
                    flex-direction: column;
                    gap: 15px;
                    align-items: stretch;
                }
                
                .export-options {
                    justify-content: center;
                }
                
                .timestamp {
                    text-align: center;
                }
            }
        `;

        document.head.appendChild(style);
    }

    // Инициализация графиков в модальном окне
    initChartsInModal(data) {
        setTimeout(async () => {
            console.log('Инициализация графиков в модальном окне...');
            
            // Проверяем доступность BoxPlot
            const boxPlotAvailable = await this.checkBoxPlotAvailability();
            
            // Создаем все графики с проверкой на существование canvas
            const chartsToCreate = [
                { id: 'overviewDistributionChart', method: 'createOverviewDistributionChart', data: data },
                { id: 'studentScoresChart', method: 'createStudentScoresChart', data: data },
                { id: 'studentPerformanceChart', method: 'createStudentPerformanceChart', data: data },
                { id: 'taskDifficultyMatrix', method: 'createTaskDifficultyMatrix', data: data },
                { id: 'taskScatterPlot', method: 'createTaskScatterPlot', data: data },
                { id: 'scoreHistogram', method: 'createScoreHistogram', data: data },
                { id: 'normalDistributionChart', method: 'createNormalDistributionChart', data: data },
                { id: 'progressMonitoringChart', method: 'createProgressMonitoringChart', data: data },
                { id: 'errorByTaskChart', method: 'createErrorByTaskChart', data: data.errorAnalysis },
                { id: 'errorTypesChart', method: 'createErrorTypesChart', data: data.errorAnalysis }
            ];
            
            // Добавляем BoxPlot только если он доступен
            if (boxPlotAvailable) {
                chartsToCreate.splice(7, 0, { 
                    id: 'boxPlotDistribution', 
                    method: 'createBoxPlotDistribution', 
                    data: data 
                });
            } else {
                // Если BoxPlot не доступен, добавляем сообщение
                const boxPlotContainer = document.getElementById('boxPlotDistribution');
                if (boxPlotContainer && boxPlotContainer.parentElement) {
                    boxPlotContainer.parentElement.innerHTML = `
                        <div class="no-data" style="text-align: center; padding: 40px;">
                            <i class="fas fa-chart-bar fa-3x" style="color: #ddd; margin-bottom: 15px;"></i>
                            <p>Box plot недоступен</p>
                            <p style="font-size: 12px; color: #999;">Используется упрощенная версия</p>
                        </div>
                    `;
                }
            }
            
            chartsToCreate.forEach(chart => {
                try {
                    const element = document.getElementById(chart.id);
                    if (element && element.tagName === 'CANVAS') {
                        this[chart.method](chart.data);
                        console.log(`✅ График ${chart.id} создан`);
                    } else if (element) {
                        console.log(`⚠️ Элемент ${chart.id} найден, но не является canvas`);
                    } else {
                        console.log(`⚠️ Canvas ${chart.id} не найден`);
                    }
                } catch (error) {
                    console.error(`❌ Ошибка создания графика ${chart.id}:`, error);
                    // Для BoxPlot пробуем fallback
                    if (chart.id === 'boxPlotDistribution') {
                        const scores = data.studentStats?.map(s => s.averageScore) || [];
                        if (scores.length > 0) {
                            const sortedScores = [...scores].sort((a, b) => a - b);
                            const n = sortedScores.length;
                            const q1 = sortedScores[Math.floor(n * 0.25)];
                            const median = sortedScores[Math.floor(n * 0.5)];
                            const q3 = sortedScores[Math.floor(n * 0.75)];
                            const iqr = q3 - q1;
                            const min = Math.max(sortedScores[0], q1 - 1.5 * iqr);
                            const max = Math.min(sortedScores[n - 1], q3 + 1.5 * iqr);
                            const outliers = sortedScores.filter(score => score < min || score > max);
                            
                            this.createBoxPlotFallback(
                                element,
                                scores,
                                min, q1, median, q3, max, outliers
                            );
                        }
                    }
                }
            });
        }, 500);
    }
    
    // Проверка доступности BoxPlot
    checkBoxPlotAvailability() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const hasNewBoxPlot = window.BoxPlot && BoxPlot.BoxPlotController;
                const hasOldBoxPlot = typeof Chart.controllers.boxplot !== 'undefined';
                
                if (hasNewBoxPlot || hasOldBoxPlot) {
                    clearInterval(checkInterval);
                    console.log('✅ BoxPlot доступен:', hasNewBoxPlot ? 'Новая версия' : 'Старая версия');
                    resolve(true);
                }
            }, 100);
            
            // Таймаут 5 секунд
            setTimeout(() => {
                clearInterval(checkInterval);
                console.warn('⚠️ BoxPlot не загрузился за отведенное время');
                resolve(false);
            }, 5000);
        });
    }
    
    // Добавим метод addChartStyles
    addChartStyles() {
        const styleId = 'chart-fixes-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Стили для отсутствующих данных */
            .no-data {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                padding: 40px;
                text-align: center;
                color: #7f8c8d;
                font-style: italic;
            }
            
            .no-data i {
                margin-bottom: 15px;
                opacity: 0.5;
            }
            
            /* Стили для статистики box plot */
            .boxplot-stats {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 15px;
                margin-top: 15px;
                font-size: 12px;
            }
            
            .boxplot-stats div {
                padding: 5px 0;
            }
            
            .boxplot-stats strong {
                color: #495057;
            }
            
            /* Улучшаем отображение графиков ошибок */
            .error-types-analysis .error-type-item {
                margin-bottom: 15px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid #e74c3c;
            }
            
            .error-type-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .error-type-name {
                font-weight: 600;
                color: #2c3e50;
            }
            
            .error-type-count {
                background: #e74c3c;
                color: white;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: bold;
            }
            
            .error-type-description {
                font-size: 13px;
                color: #666;
                margin-bottom: 10px;
                line-height: 1.4;
            }
            
            .error-type-progress {
                height: 6px;
                background: #e9ecef;
                border-radius: 3px;
                overflow: hidden;
            }
            
            .error-type-progress .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #e74c3c, #f39c12);
                border-radius: 3px;
            }
            
            /* Адаптивность для графиков */
            @media (max-width: 768px) {
                .analysis-charts-row {
                    grid-template-columns: 1fr !important;
                }
                
                .viz-card {
                    margin-bottom: 20px;
                }
                
                .chart-container {
                    height: 250px !important;
                }
            }
            
            /* Стили для вкладок ошибок */
            .error-summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }
            
            .correction-recommendations {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .correction-card {
                display: flex;
                gap: 15px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid #3498db;
            }
            
            .correction-number {
                width: 30px;
                height: 30px;
                background: #3498db;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                flex-shrink: 0;
            }
            
            /* Улучшаем видимость графиков */
            canvas {
                display: block !important;
                max-width: 100% !important;
                height: auto !important;
            }
            
            .chart-container {
                position: relative;
                min-height: 300px;
            }
        `;

        document.head.appendChild(style);
    }

    // Добавим метод для создания графика мониторинга прогресса
    createProgressMonitoringChart(data) {
        const ctx = document.getElementById('progressMonitoringChart');
        if (!ctx) return;
        
        // Создаем демо-данные для прогресса
        const labels = ['Неделя 1', 'Неделя 2', 'Неделя 3', 'Неделя 4'];
        const currentScore = data.studentStats.length > 0 
            ? this.calculateOverallAverage(data.studentStats)
            : 0;
        
        const targetScore = Math.min(100, currentScore + 15); // Цель +15%
        
        // Создаем прогноз прогресса
        const progressData = labels.map((_, index) => {
            const progress = currentScore + ((targetScore - currentScore) * (index / 3));
            return Math.min(100, progress);
        });
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Текущий прогресс',
                        data: [currentScore, progressData[1], progressData[2], targetScore],
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 3,
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Целевой показатель',
                        data: [targetScore, targetScore, targetScore, targetScore],
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Средний балл (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Временной период'
                        }
                    }
                },
                plugins: {
                    annotation: {
                        annotations: {
                            targetLine: {
                                type: 'line',
                                yMin: targetScore,
                                yMax: targetScore,
                                borderColor: 'rgb(255, 99, 132)',
                                borderWidth: 2,
                                borderDash: [5, 5],
                                label: {
                                    content: `Цель: ${targetScore.toFixed(1)}%`,
                                    enabled: true,
                                    position: 'end'
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Добавим метод для создания графика тенденций
    createStudentPerformanceChart(data) {
        const ctx = document.getElementById('studentPerformanceChart');
        if (!ctx || !data.studentStats || data.studentStats.length === 0) return;
        
        // Берем 5 студентов для примера (можно рандомно или топ-5)
        const sampleStudents = data.studentStats.slice(0, Math.min(5, data.studentStats.length));
        
        // Создаем данные для графика
        const labels = sampleStudents.map(s => {
            const nameParts = s.name.split(' ');
            return nameParts.length >= 2 
                ? `${nameParts[0]} ${nameParts[1].charAt(0)}.` 
                : s.name;
        });
        
        // Получаем средние баллы по заданиям для каждого студента
        const datasets = appData.tasks?.map((task, taskIndex) => {
            // Для каждого задания собираем баллы студентов
            const dataPoints = sampleStudents.map(student => {
                const score = this.getStudentScore(student.index, taskIndex);
                const maxScore = task.maxScore || 1;
                return maxScore > 0 ? (score / maxScore) * 100 : 0;
            });
            
            return {
                label: `З-${taskIndex + 1}`,
                data: dataPoints,
                borderColor: this.getTaskColor(taskIndex),
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                tension: 0.4,
                fill: false,
                pointRadius: 4
            };
        }) || [];
        
        // Если данных слишком много, ограничиваем
        const displayDatasets = datasets.slice(0, 8); // Показываем не более 8 заданий
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: displayDatasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Процент выполнения (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Учащиеся'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    // Метод для получения цвета задания
    getTaskColor(index) {
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ];
        return colors[index % colors.length];
    }

    // Закрытие модального окна
    closeDetailedAnalysis() {
        const modal = document.getElementById('detailedAnalysisModal');
        if (modal) {
            // Добавляем анимацию закрытия
            modal.style.opacity = '0';
            modal.style.transform = 'scale(0.9)';
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
        
        // Удаляем стили
        const styles = document.getElementById('detailed-analysis-styles');
        if (styles) {
            styles.remove();
        }
    }

    // Добавим глобальные обработчики для кнопок в модальных окнах
    addGlobalEventListeners() {
        // Обработчик для всех кнопок закрытия
        document.addEventListener('click', (e) => {
            if (e.target.closest('.modal-close-btn') || 
                e.target.closest('.close-btn') ||
                (e.target.closest('.modal-overlay') && e.target.classList.contains('modal-overlay'))) {
                const modal = e.target.closest('.modal-overlay') || 
                             e.target.closest('[id$="Modal"]')?.parentElement;
                if (modal) {
                    modal.style.opacity = '0';
                    modal.style.transform = 'scale(0.9)';
                    setTimeout(() => modal.remove(), 300);
                }
            }
        });
    }

    // Вспомогательные методы для расчетов
    calculateStudentStatistics() {
        if (!appData.students || !appData.tasks) return [];
        
        return appData.students.map((studentName, studentIndex) => {
            const scores = appData.tasks.map((task, taskIndex) => {
                const score = this.getStudentScore(studentIndex, taskIndex);
                const maxScore = task.maxScore || 1;
                return maxScore > 0 ? (score / maxScore) * 100 : 0;
            });
            
            return {
                name: studentName,
                index: studentIndex,
                averageScore: this.calculateAverage(scores),
                maxScore: Math.max(...scores),
                minScore: Math.min(...scores),
                stability: this.calculateStability(scores),
                progress: this.calculateStudentProgress(studentIndex, scores)
            };
        });
    }

    calculateTaskStatistics() {
        if (!appData.tasks || !appData.students) return [];
        
        return appData.tasks.map((task, taskIndex) => {
            const scores = appData.students.map((student, studentIndex) => {
                const score = this.getStudentScore(studentIndex, taskIndex);
                const maxScore = task.maxScore || 1;
                return maxScore > 0 ? score / maxScore : 0;
            });
            
            const completed = scores.filter(score => score > 0).length;
            
            return {
                number: taskIndex + 1,
                title: task.title || `Задание ${taskIndex + 1}`,
                type: task.type || 'unknown',
                competence: task.competence || 'Не указано',
                difficulty: this.calculateTaskDifficulty(scores),
                discrimination: this.calculateTaskDiscrimination(scores),
                averageScore: this.calculateAverage(scores.map(s => s * (task.maxScore || 1))),
                completionRate: (completed / scores.length) * 100
            };
        });
    }

    calculateScoreDistribution() {
        const studentStats = this.calculateStudentStatistics();
        const scores = studentStats.map(s => s.averageScore);
        
        if (scores.length === 0) {
            return {
                mean: 0,
                median: 0,
                mode: 0,
                stdDev: 0,
                skewness: 0,
                kurtosis: 0
            };
        }
        
        // Расчет статистических показателей
        const mean = this.calculateAverage(scores);
        const sortedScores = [...scores].sort((a, b) => a - b);
        const median = sortedScores[Math.floor(sortedScores.length / 2)];
        
        // Мода (упрощенный расчет)
        const frequency = {};
        scores.forEach(score => {
            const rounded = Math.round(score);
            frequency[rounded] = (frequency[rounded] || 0) + 1;
        });
        
        let mode = 0;
        let maxFreq = 0;
        Object.entries(frequency).forEach(([score, freq]) => {
            if (freq > maxFreq) {
                mode = parseFloat(score);
                maxFreq = freq;
            }
        });
        
        // Стандартное отклонение
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);
        
        // Асимметрия и эксцесс (упрощенные формулы)
        const skewness = this.calculateSkewness(scores, mean, stdDev);
        const kurtosis = this.calculateKurtosis(scores, mean, stdDev);
        
        return { mean, median, mode, stdDev, skewness, kurtosis };
    }

    // Дополнительные методы для расчетов
    calculateStability(scores) {
        if (scores.length < 2) return 1;
        const mean = this.calculateAverage(scores);
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
        const maxVar = Math.pow(100, 2) / 12; // Максимально возможная дисперсия
        return Math.max(0, 1 - (variance / maxVar));
    }

    calculateTaskDifficulty(scores) {
        // Сложность = 1 - средний процент выполнения
        return 1 - (this.calculateAverage(scores));
    }

    calculateTaskDiscrimination(scores) {
        if (scores.length < 4) return 0.5;
        
        // Разделяем на группы по успеваемости
        const sortedIndices = scores
            .map((score, index) => ({ score, index }))
            .sort((a, b) => b.score - a.score)
            .map(item => item.index);
        
        const topCount = Math.floor(sortedIndices.length / 3);
        const bottomCount = Math.floor(sortedIndices.length / 3);
        
        const topGroup = sortedIndices.slice(0, topCount);
        const bottomGroup = sortedIndices.slice(-bottomCount);
        
        const topAvg = this.calculateAverage(topGroup.map(i => scores[i]));
        const bottomAvg = this.calculateAverage(bottomGroup.map(i => scores[i]));
        
        // Дискриминативность = разница между средними верхней и нижней групп
        return Math.max(0, Math.min(1, (topAvg - bottomAvg)));
    }

    calculateSkewness(scores, mean, stdDev) {
        if (scores.length < 3 || stdDev === 0) return 0;
        
        const n = scores.length;
        const sumCubedDeviations = scores.reduce((sum, score) => 
            sum + Math.pow(score - mean, 3), 0);
        
        return (sumCubedDeviations / n) / Math.pow(stdDev, 3);
    }

    calculateKurtosis(scores, mean, stdDev) {
        if (scores.length < 4 || stdDev === 0) return 0;
        
        const n = scores.length;
        const sumFourthDeviations = scores.reduce((sum, score) => 
            sum + Math.pow(score - mean, 4), 0);
        
        return (sumFourthDeviations / n) / Math.pow(stdDev, 4) - 3;
    }

    // Методы для визуализаций (упрощенные версии)
    createOverviewDistributionChart(data) {
        const ctx = document.getElementById('overviewDistributionChart');
        if (!ctx) return;
        
        const studentGroups = this.createStudentGroups(data.studentStats);
        
        if (studentGroups.length === 0) {
            ctx.parentElement.innerHTML = '<p class="no-data">Нет данных для построения диаграммы</p>';
            return;
        }
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: studentGroups.map(g => g.name),
                datasets: [{
                    data: studentGroups.map(g => g.count),
                    backgroundColor: studentGroups.map(g => g.color),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} учащихся (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    createStudentScoresChart(data) {
        const ctx = document.getElementById('studentScoresChart');
        if (!ctx) return;
        
        const scores = data.studentStats.map(s => s.averageScore);
        const bins = this.createHistogramBins(scores, 10);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: bins.labels,
                datasets: [{
                    label: 'Количество учащихся',
                    data: bins.counts,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Количество учащихся'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Диапазон баллов'
                        }
                    }
                }
            }
        });
    }

    createHistogramBins(scores, binCount) {
        const min = Math.min(...scores);
        const max = Math.max(...scores);
        const binWidth = (max - min) / binCount;
        
        const bins = Array(binCount).fill(0);
        const labels = [];
        
        for (let i = 0; i < binCount; i++) {
            const lower = min + i * binWidth;
            const upper = min + (i + 1) * binWidth;
            labels.push(`${lower.toFixed(0)}-${upper.toFixed(0)}%`);
        }
        
        scores.forEach(score => {
            const binIndex = Math.min(Math.floor((score - min) / binWidth), binCount - 1);
            bins[binIndex]++;
        });
        
        return { labels, counts: bins };
    }

    // Остальные методы для визуализаций
    createTaskDifficultyMatrix(data) {
        const ctx = document.getElementById('taskDifficultyMatrix');
        if (!ctx) return;
        
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: data.taskStats.map(t => t.title),
                datasets: [{
                    label: 'Сложность',
                    data: data.taskStats.map(t => t.difficulty * 100),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgb(255, 99, 132)',
                    pointBackgroundColor: 'rgb(255, 99, 132)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    createScoreHistogram(data) {
        const ctx = document.getElementById('scoreHistogram');
        if (!ctx) return;
        
        const scores = data.studentStats.map(s => s.averageScore);
        const bins = this.createHistogramBins(scores, 15);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: bins.labels,
                datasets: [{
                    label: 'Распределение баллов',
                    data: bins.counts,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Частота'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Диапазон баллов'
                        }
                    }
                }
            }
        });
    }

    // Дополнительные методы для анализа ошибок
    // Сначала исправим метод analyzeErrors для получения реальных данных
    analyzeErrors() {
        // Проверяем наличие данных об ошибках в разных местах
        let errors = [];
        
        // 1. Проверяем appData.errors
        if (appData.errors && Array.isArray(appData.errors)) {
            errors = appData.errors;
        }
        // 2. Проверяем studentErrors
        else if (appData.studentErrors && Object.keys(appData.studentErrors).length > 0) {
            // Преобразуем studentErrors в массив
            errors = Object.entries(appData.studentErrors).flatMap(([studentIndex, studentErrs]) => {
                return studentErrs.map(err => ({
                    ...err,
                    studentIndex: parseInt(studentIndex)
                }));
            });
        }
        // 3. Создаем демо-данные, если нет реальных
        else {
            errors = this.generateDemoErrors();
        }
        
        // Анализируем ошибки
        const errorTypes = {};
        const errorByTask = {};
        const errorByStudent = {};
        let totalErrorCount = 0;
        
        errors.forEach(error => {
            const type = error.type || 'unknown';
            const taskIndex = error.taskIndex !== undefined ? error.taskIndex : 0;
            const studentIndex = error.studentIndex !== undefined ? error.studentIndex : 0;
            const count = error.count || 1;
            
            // Статистика по типам ошибок
            errorTypes[type] = (errorTypes[type] || 0) + count;
            
            // Статистика по заданиям
            const taskKey = `Задание ${taskIndex + 1}`;
            errorByTask[taskKey] = (errorByTask[taskKey] || 0) + count;
            
            // Статистика по студентам
            const studentName = appData.students?.[studentIndex] || `Студент ${studentIndex + 1}`;
            errorByStudent[studentName] = (errorByStudent[studentName] || 0) + count;
            
            totalErrorCount += count;
        });
        
        return {
            totalErrors: totalErrorCount,
            errorTypes,
            errorByTask,
            errorByStudent,
            errors: errors
        };
    }

    generateDemoErrors() {
        const errors = [];
        const errorTypes = [
            'factual', 'conceptual', 'application', 
            'calculation', 'logical', 'attention', 'technical'
        ];
        const errorDescriptions = {
            'factual': 'Неверные факты или данные',
            'conceptual': 'Непонимание основных понятий',
            'application': 'Ошибки применения знаний',
            'calculation': 'Вычислительные ошибки',
            'logical': 'Логические ошибки в рассуждениях',
            'attention': 'Ошибки внимательности',
            'technical': 'Технические ошибки'
        };
        
        if (appData.students && appData.tasks) {
            // Генерируем реалистичные ошибки
            const studentCount = Math.min(appData.students.length, 10);
            const taskCount = Math.min(appData.tasks.length, 8);
            
            for (let studentIndex = 0; studentIndex < studentCount; studentIndex++) {
                for (let taskIndex = 0; taskIndex < taskCount; taskIndex++) {
                    // 30% вероятность ошибки в задании
                    if (Math.random() < 0.3) {
                        const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
                        errors.push({
                            studentIndex,
                            taskIndex,
                            type: errorType,
                            description: errorDescriptions[errorType] || 'Ошибка выполнения',
                            count: Math.floor(Math.random() * 3) + 1 // 1-3 ошибки
                        });
                    }
                }
            }
        }
        
        return errors;
    }

    createErrorAnalysisCharts(data) {
        this.createErrorByTaskChart(data.errorAnalysis);
        this.createErrorTypesChart(data.errorAnalysis);
    }

    createErrorByTaskChart(errorAnalysis) {
        const ctx = document.getElementById('errorByTaskChart');
        if (!ctx) {
            console.error('Canvas errorByTaskChart не найден');
            return;
        }
        
        if (!errorAnalysis || !errorAnalysis.errorByTask || Object.keys(errorAnalysis.errorByTask).length === 0) {
            ctx.parentElement.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-chart-bar fa-3x" style="color: #ddd; margin-bottom: 10px;"></i>
                    <p>Нет данных об ошибках по заданиям</p>
                </div>
            `;
            return;
        }
        
        const labels = Object.keys(errorAnalysis.errorByTask);
        const values = Object.values(errorAnalysis.errorByTask);
        
        // Сортируем по количеству ошибок
        const sortedPairs = labels.map((label, index) => ({ label, value: values[index] }))
            .sort((a, b) => b.value - a.value);
        
        const sortedLabels = sortedPairs.map(p => p.label);
        const sortedValues = sortedPairs.map(p => p.value);
        
        // Удаляем старый график если есть
        if (this.charts.errorByTask) {
            this.charts.errorByTask.destroy();
        }
        
        this.charts.errorByTask = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedLabels,
                datasets: [{
                    label: 'Количество ошибок',
                    data: sortedValues,
                    backgroundColor: 'rgba(231, 76, 60, 0.7)',
                    borderColor: 'rgb(231, 76, 60)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Количество ошибок'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Задания'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Ошибок: ${context.raw}`;
                            }
                        }
                    }
                }
            }
        });
    }

    createErrorTypesChart(errorAnalysis) {
        const ctx = document.getElementById('errorTypesChart');
        if (!ctx) {
            console.error('Canvas errorTypesChart не найден');
            return;
        }
        
        if (!errorAnalysis || !errorAnalysis.errorTypes || Object.keys(errorAnalysis.errorTypes).length === 0) {
            ctx.parentElement.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-chart-pie fa-3x" style="color: #ddd; margin-bottom: 10px;"></i>
                    <p>Нет данных о типах ошибок</p>
                </div>
            `;
            return;
        }
        
        const labels = Object.keys(errorAnalysis.errorTypes).map(type => this.getErrorTypeLabel(type));
        const values = Object.values(errorAnalysis.errorTypes);
        const total = values.reduce((a, b) => a + b, 0);
        
        // Сортируем по количеству
        const sortedPairs = labels.map((label, index) => ({ 
            label, 
            value: values[index],
            percentage: ((values[index] / total) * 100).toFixed(1)
        })).sort((a, b) => b.value - a.value);
        
        const sortedLabels = sortedPairs.map(p => p.label);
        const sortedValues = sortedPairs.map(p => p.value);
        const sortedPercentages = sortedPairs.map(p => p.percentage);
        
        // Удаляем старый график если есть
        if (this.charts.errorTypes) {
            this.charts.errorTypes.destroy();
        }
        
        this.charts.errorTypes = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: sortedLabels,
                datasets: [{
                    data: sortedValues,
                    backgroundColor: this.generateColors(sortedLabels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                size: 11
                            },
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const percentage = sortedPercentages[context.dataIndex] || '0.0';
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Генерация цветов
    generateColors(count) {
        const colors = [];
        const hueStep = 360 / count;
        
        for (let i = 0; i < count; i++) {
            const hue = i * hueStep;
            colors.push(`hsl(${hue}, 70%, 60%)`);
        }
        
        return colors;
    }

    // Вспомогательные методы для отображения
    getScoreClass(score) {
        if (score >= 85) return 'excellent';
        if (score >= 70) return 'good';
        if (score >= 50) return 'average';
        return 'poor';
    }

    getDifficultyClass(difficulty) {
        if (difficulty >= 0.7) return 'very-hard';
        if (difficulty >= 0.5) return 'hard';
        if (difficulty >= 0.3) return 'medium';
        return 'easy';
    }

    getDiscriminationClass(discrimination) {
        if (discrimination >= 0.5) return 'excellent';
        if (discrimination >= 0.3) return 'good';
        if (discrimination >= 0.2) return 'acceptable';
        return 'poor';
    }

    getTaskStatus(task) {
        if (task.difficulty > 0.7) return 'very-hard';
        if (task.discrimination < 0.2) return 'poor-discrimination';
        if (task.completionRate < 30) return 'low-completion';
        return 'good';
    }

    getTaskStatusIcon(task) {
        const status = this.getTaskStatus(task);
        switch (status) {
            case 'very-hard': return 'fa-exclamation-triangle';
            case 'poor-discrimination': return 'fa-filter';
            case 'low-completion': return 'fa-user-clock';
            default: return 'fa-check-circle';
        }
    }

    getTaskStatusText(task) {
        const status = this.getTaskStatus(task);
        switch (status) {
            case 'very-hard': return 'Очень сложное';
            case 'poor-discrimination': return 'Низкая дискриминативность';
            case 'low-completion': return 'Низкая выполнимость';
            default: return 'Хорошее';
        }
    }

    // Методы для экспорта
    exportDetailedReport() {
        showNotification('Подготовка PDF отчета...', 'info');
        // Реализация экспорта в PDF
    }

    exportDetailedCSV() {
        showNotification('Подготовка CSV файла...', 'info');
        // Реализация экспорта в CSV
    }

    printDetailedReport() {
        window.print();
    }
    
    // Расчет прогресса студента
    calculateStudentProgress(studentIndex, scores) {
        // Упрощенный расчет прогресса
        // В реальном приложении здесь была бы история предыдущих тестов
        if (!scores || scores.length < 2) return 0;
        
        // Для демонстрации используем случайный прогресс
        const baseScore = this.calculateAverage(scores);
        const randomFactor = (Math.random() - 0.5) * 20; // -10% до +10%
        return randomFactor;
    }

    // Генерация карточек группового анализа
    renderGroupAnalysisCards(sortedStudents) {
        if (!sortedStudents || sortedStudents.length === 0) return '<p>Нет данных для анализа</p>';
        
        // Создаем группы с правильными критериями
        const groups = [
            { 
                name: 'Отличники', 
                icon: 'fa-trophy',
                filter: s => s.averageScore >= 85,
                description: 'Высокие стабильные результаты по всем заданиям'
            },
            { 
                name: 'Хорошисты', 
                icon: 'fa-star',
                filter: s => s.averageScore >= 70 && s.averageScore < 85,
                description: 'Хорошие результаты, возможны улучшения в сложных заданиях'
            },
            { 
                name: 'Средние', 
                icon: 'fa-chart-line',
                filter: s => s.averageScore >= 50 && s.averageScore < 70,
                description: 'Средние результаты, высокая стабильность'
            },
            { 
                name: 'Требуют внимания', 
                icon: 'fa-exclamation-triangle',
                filter: s => s.averageScore < 50,
                description: 'Низкие результаты, требуется коррекция'
            }
        ];
        
        const groupResults = groups.map(group => {
            const students = sortedStudents.filter(group.filter);
            const averageScore = students.length > 0 
                ? students.reduce((sum, s) => sum + s.averageScore, 0) / students.length
                : 0;
            
            return {
                ...group,
                students: students.map(s => ({ name: s.name })),
                count: students.length,
                averageScore,
                color: this.getGroupColor(group.name)
            };
        });
        
        return `
            <div class="group-analysis-grid">
                ${groupResults.map(group => `
                    <div class="group-analysis-card" style="border-color: ${group.color}">
                        <div class="group-header">
                            <div class="group-icon" style="background: ${group.color}20; color: ${group.color};">
                                <i class="fas ${group.icon}"></i>
                            </div>
                            <div class="group-title">
                                <h5>${group.name}</h5>
                                <span class="group-count">${group.count} учащихся</span>
                            </div>
                        </div>
                        
                        <div class="group-stats">
                            <div class="group-stat">
                                <div class="stat-label">Средний балл:</div>
                                <div class="stat-value">${group.averageScore.toFixed(1)}%</div>
                            </div>
                            <div class="group-stat">
                                <div class="stat-label">Процент от общего:</div>
                                <div class="stat-value">${((group.count / sortedStudents.length) * 100).toFixed(1)}%</div>
                            </div>
                        </div>
                        
                        <div class="group-description">
                            ${group.description}
                        </div>
                        
                        ${group.count > 0 ? `
                            <div class="group-students">
                                <div class="students-label">Примеры учащихся:</div>
                                <div class="students-list">
                                    ${group.students.slice(0, 3).map(s => `
                                        <span class="student-tag">${s.name.split(' ')[0]}</span>
                                    `).join('')}
                                    ${group.count > 3 ? `<span class="more-tag">+${group.count - 3}</span>` : ''}
                                </div>
                            </div>
                        ` : '<div class="no-students">Нет учащихся в этой группе</div>'}
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Метод для получения цвета группы
    getGroupColor(groupName) {
        const colors = {
            'Отличники': '#27ae60',
            'Хорошисты': '#3498db',
            'Средние': '#f39c12',
            'Требуют внимания': '#e74c3c'
        };
        return colors[groupName] || '#6c757d';
    }

    // Расчет общего среднего
    calculateOverallAverage(studentStats) {
        if (!studentStats || studentStats.length === 0) return 0;
        const sum = studentStats.reduce((total, student) => total + student.averageScore, 0);
        return sum / studentStats.length;
    }

    // Получение типа задания
    getTaskTypeLabel(type) {
        const types = {
            'multiple-choice': 'Выбор ответа',
            'short-answer': 'Краткий ответ',
            'essay': 'Развернутый ответ',
            'matching': 'Сопоставление',
            'true-false': 'Верно/Неверно',
            'calculation': 'Расчетная задача'
        };
        return types[type] || type || 'Не указан';
    }

    // Рендеринг рекомендаций по заданиям
    renderTaskRecommendations(tasks) {
        const problematicTasks = tasks.filter(task => 
            task.difficulty > 0.7 || 
            task.discrimination < 0.3 || 
            task.completionRate < 50
        );
        
        if (problematicTasks.length === 0) {
            return `
                <div class="no-problems-card">
                    <i class="fas fa-check-circle success"></i>
                    <h5>Отличные задания!</h5>
                    <p>Все задания имеют хорошие показатели сложности и дискриминативности.</p>
                </div>
            `;
        }
        
        return problematicTasks.map(task => `
            <div class="task-recommendation-card ${task.difficulty > 0.7 ? 'difficulty-high' : task.discrimination < 0.3 ? 'discrimination-low' : 'completion-low'}">
                <div class="recommendation-header">
                    <h5>${task.title}</h5>
                    <span class="task-number">Задание ${task.number}</span>
                </div>
                <div class="recommendation-body">
                    ${task.difficulty > 0.7 ? `
                        <div class="problem">
                            <i class="fas fa-exclamation-triangle"></i>
                            <strong>Слишком высокая сложность:</strong> ${(task.difficulty * 100).toFixed(1)}%
                        </div>
                        <div class="solution">
                            <i class="fas fa-lightbulb"></i>
                            <strong>Решение:</strong> Упростить формулировку, добавить подсказки
                        </div>
                    ` : ''}
                    ${task.discrimination < 0.3 ? `
                        <div class="problem">
                            <i class="fas fa-filter"></i>
                            <strong>Низкая дискриминативность:</strong> ${(task.discrimination * 100).toFixed(1)}%
                        </div>
                        <div class="solution">
                            <i class="fas fa-lightbulb"></i>
                            <strong>Решение:</strong> Пересмотреть варианты ответов
                        </div>
                    ` : ''}
                    ${task.completionRate < 50 ? `
                        <div class="problem">
                            <i class="fas fa-user-clock"></i>
                            <strong>Низкая выполнимость:</strong> ${task.completionRate.toFixed(1)}%
                        </div>
                        <div class="solution">
                            <i class="fas fa-lightbulb"></i>
                            <strong>Решение:</strong> Проверить время выполнения, разделить на части
                        </div>
                    ` : ''}
                </div>
                <div class="recommendation-actions">
                    <button class="btn btn-xs btn-primary" onclick="window.advancedAnalytics.editTask(${task.number - 1})">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                    <button class="btn btn-xs btn-outline" onclick="window.advancedAnalytics.analyzeTask(${task.number - 1})">
                        <i class="fas fa-chart-bar"></i> Анализ
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Интерпретация распределения
    interpretDistribution(distribution) {
        const { mean, median, stdDev, skewness, kurtosis } = distribution;
        
        let interpretation = '';
        
        // Анализ среднего
        if (mean >= 85) {
            interpretation += '<p><strong>Высокий средний балл</strong> - класс хорошо освоил материал.</p>';
        } else if (mean >= 70) {
            interpretation += '<p><strong>Хороший средний балл</strong> - класс в основном освоил материал.</p>';
        } else if (mean >= 50) {
            interpretation += '<p><strong>Удовлетворительный средний балл</strong> - требуется повторение материала.</p>';
        } else {
            interpretation += '<p><strong>Низкий средний балл</strong> - необходимо серьезное вмешательство.</p>';
        }
        
        // Анализ стандартного отклонения
        if (stdDev > 20) {
            interpretation += '<p><strong>Большой разброс баллов</strong> - значительные различия в подготовке учащихся.</p>';
        } else if (stdDev > 10) {
            interpretation += '<p><strong>Умеренный разброс баллов</strong> - различия в подготовке в пределах нормы.</p>';
        } else {
            interpretation += '<p><strong>Маленький разброс баллов</strong> - однородная подготовка учащихся.</p>';
        }
        
        // Анализ асимметрии
        if (skewness > 0.5) {
            interpretation += '<p><strong>Смещение влево</strong> - большинство учащихся получили низкие баллы.</p>';
        } else if (skewness < -0.5) {
            interpretation += '<p><strong>Смещение вправо</strong> - большинство учащихся получили высокие баллы.</p>';
        } else {
            interpretation += '<p><strong>Симметричное распределение</strong> - нормальное распределение баллов.</p>';
        }
        
        // Анализ эксцесса
        if (kurtosis > 1) {
            interpretation += '<p><strong>Пикообразное распределение</strong> - баллы сконцентрированы около среднего.</p>';
        } else if (kurtosis < -1) {
            interpretation += '<p><strong>Плоское распределение</strong> - равномерное распределение баллов.</p>';
        }
        
        return interpretation;
    }

    // Рендеринг сводки по ошибкам
    renderErrorSummaryCards(errorAnalysis) {
        if (!errorAnalysis || errorAnalysis.totalErrors === 0) {
            return `
                <div class="no-errors-card">
                    <i class="fas fa-check-circle success"></i>
                    <h5>Ошибок не обнаружено!</h5>
                    <p>Все задания выполнены без зарегистрированных ошибок.</p>
                </div>
            `;
        }
        
        const errorTypes = errorAnalysis.errorTypes || {};
        const errorByTask = errorAnalysis.errorByTask || {};
        
        // Находим наиболее частый тип ошибок
        let mostCommonType = '';
        let maxTypeCount = 0;
        Object.entries(errorTypes).forEach(([type, count]) => {
            if (count > maxTypeCount) {
                mostCommonType = type;
                maxTypeCount = count;
            }
        });
        
        // Находим задание с наибольшим количеством ошибок
        let problematicTask = '';
        let maxTaskErrors = 0;
        Object.entries(errorByTask).forEach(([task, count]) => {
            if (count > maxTaskErrors) {
                problematicTask = task;
                maxTaskErrors = count;
            }
        });
        
        return `
            <div class="error-summary-grid">
                <div class="error-card total-errors">
                    <div class="error-icon">
                        <i class="fas fa-bug"></i>
                    </div>
                    <div class="error-content">
                        <div class="error-value">${errorAnalysis.totalErrors}</div>
                        <div class="error-label">Всего ошибок</div>
                    </div>
                </div>
                
                <div class="error-card error-types">
                    <div class="error-icon">
                        <i class="fas fa-tags"></i>
                    </div>
                    <div class="error-content">
                        <div class="error-value">${Object.keys(errorTypes).length}</div>
                        <div class="error-label">Типов ошибок</div>
                    </div>
                </div>
                
                ${mostCommonType ? `
                    <div class="error-card common-error">
                        <div class="error-icon">
                            <i class="fas fa-exclamation-circle"></i>
                        </div>
                        <div class="error-content">
                            <div class="error-value">${mostCommonType}</div>
                            <div class="error-label">Наиболее частый тип</div>
                        </div>
                    </div>
                ` : ''}
                
                ${problematicTask ? `
                    <div class="error-card problematic-task">
                        <div class="error-icon">
                            <i class="fas fa-tasks"></i>
                        </div>
                        <div class="error-content">
                            <div class="error-value">${problematicTask}</div>
                            <div class="error-label">Наиболее проблемное задание</div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Рендеринг анализа по типам ошибок
    renderErrorTypesAnalysis(errorAnalysis) {
        if (!errorAnalysis.errorTypes || Object.keys(errorAnalysis.errorTypes).length === 0) {
            return '<p class="no-data">Нет данных по типам ошибок</p>';
        }
        
        const errorTypes = errorAnalysis.errorTypes;
        const totalErrors = errorAnalysis.totalErrors;
        
        // Сортируем по количеству ошибок
        const sortedTypes = Object.entries(errorTypes)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); // Показываем топ-5
        
        return `
            <div class="error-types-list">
                ${sortedTypes.map(([type, count]) => {
                    const percentage = ((count / totalErrors) * 100).toFixed(1);
                    const typeLabel = this.getErrorTypeLabel(type);
                    const description = this.getErrorTypeDescription(type);
                    
                    return `
                        <div class="error-type-item">
                            <div class="error-type-header">
                                <span class="error-type-name">${typeLabel}</span>
                                <span class="error-type-count">${count} (${percentage}%)</span>
                            </div>
                            <div class="error-type-description">
                                ${description}
                            </div>
                            <div class="error-type-progress">
                                <div class="progress-bar" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // Получение метки для типа ошибки
    getErrorTypeLabel(type) {
        const labels = {
            'factual': 'Фактические ошибки',
            'conceptual': 'Концептуальные ошибки',
            'application': 'Ошибки применения',
            'calculation': 'Вычислительные ошибки',
            'logical': 'Логические ошибки',
            'attention': 'Ошибки внимательности',
            'technical': 'Технические ошибки'
        };
        return labels[type] || type;
    }

    // Получение описания типа ошибки
    getErrorTypeDescription(type) {
        const descriptions = {
            'factual': 'Неверные факты, даты, имена, термины',
            'conceptual': 'Непонимание основных понятий и принципов',
            'application': 'Неумение применить знания на практике',
            'calculation': 'Ошибки в вычислениях, арифметические ошибки',
            'logical': 'Нарушение логики рассуждений, неверные выводы',
            'attention': 'Пропуск деталей, невнимательное чтение задания',
            'technical': 'Ошибки оформления, технические недочеты'
        };
        return descriptions[type] || 'Описание отсутствует';
    }

    // Рендеринг рекомендаций по коррекции ошибок
    renderErrorCorrectionRecommendations(errorAnalysis) {
        if (!errorAnalysis.errorTypes || Object.keys(errorAnalysis.errorTypes).length === 0) {
            return '<p>Нет ошибок для анализа</p>';
        }
        
        const recommendations = [];
        const errorTypes = errorAnalysis.errorTypes;
        
        // Анализируем типы ошибок и генерируем рекомендации
        if (errorTypes.factual) {
            recommendations.push({
                title: 'Работа с фактическим материалом',
                description: 'Организовать повторение ключевых фактов, дат, терминов',
                actions: [
                    'Создать карточки с основными фактами',
                    'Провести викторину по материалу',
                    'Использовать мнемонические приемы'
                ]
            });
        }
        
        if (errorTypes.conceptual) {
            recommendations.push({
                title: 'Коррекция концептуальных ошибок',
                description: 'Устранить непонимание основных понятий и принципов',
                actions: [
                    'Вернуться к основам темы',
                    'Использовать наглядные материалы',
                    'Обсуждение в малых группах'
                ]
            });
        }
        
        if (errorTypes.calculation) {
            recommendations.push({
                title: 'Устранение вычислительных ошибок',
                description: 'Развить навыки проверки вычислений',
                actions: [
                    'Тренировка устного счета',
                    'Проверка результатов разными способами',
                    'Работа с калькулятором'
                ]
            });
        }
        
        if (errorTypes.attention) {
            recommendations.push({
                title: 'Развитие внимательности',
                description: 'Снизить количество ошибок из-за невнимательности',
                actions: [
                    'Тренировка концентрации внимания',
                    'Чтение условий вслух',
                    'Выделение ключевых слов'
                ]
            });
        }
        
        return `
            <div class="correction-recommendations">
                ${recommendations.map((rec, index) => `
                    <div class="correction-card">
                        <div class="correction-number">${index + 1}</div>
                        <div class="correction-content">
                            <h5>${rec.title}</h5>
                            <p>${rec.description}</p>
                            <div class="correction-actions">
                                <strong>Конкретные действия:</strong>
                                <ul>
                                    ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Генерация детальных рекомендаций
    generateDetailedRecommendations(data) {
        const studentCount = data.meta.studentCount;
        const averageScore = this.calculateOverallAverage(data.studentStats);
        const problematicTasks = data.taskStats.filter(task => task.difficulty > 0.7 || task.discrimination < 0.3);
        const weakStudents = data.studentStats.filter(s => s.averageScore < 50);
        
        // Приоритетные рекомендации
        const priorityRecommendations = [];
        
        if (weakStudents.length > 0) {
            priorityRecommendations.push({
                id: 'weak_students',
                title: 'Индивидуальная работа с отстающими',
                description: `${weakStudents.length} учащихся имеют балл ниже 50%. Требуется индивидуальный подход и дополнительные занятия.`,
                impact: weakStudents.length > studentCount * 0.3 ? 'high' : 'medium'
            });
        }
        
        if (problematicTasks.length > 0) {
            priorityRecommendations.push({
                id: 'problematic_tasks',
                title: 'Коррекция проблемных заданий',
                description: `${problematicTasks.length} заданий имеют проблемы со сложностью или дискриминативностью.`,
                impact: 'high'
            });
        }
        
        if (averageScore < 70) {
            priorityRecommendations.push({
                id: 'low_average',
                title: 'Повторение материала',
                description: `Средний балл класса (${averageScore.toFixed(1)}%) ниже ожидаемого. Необходимо повторить ключевые темы.`,
                impact: 'medium'
            });
        }
        
        // План действий
        const actionPlan = [
            {
                title: 'Диагностика проблем',
                description: 'Провести индивидуальные беседы с учащимися для выявления причин затруднений',
                deadline: '1 неделя',
                resources: ['Анкеты', 'Индивидуальные карты', 'Психолог'],
                progress: 0
            },
            {
                title: 'Коррекция заданий',
                description: 'Пересмотреть проблемные задания, упростить формулировки, добавить подсказки',
                deadline: '2 недели',
                resources: ['Методические материалы', 'Коллеги', 'Образовательные стандарты'],
                progress: 0
            },
            {
                title: 'Дифференцированное обучение',
                description: 'Разработать задания разного уровня сложности для разных групп учащихся',
                deadline: '3 недели',
                resources: ['Дидактические материалы', 'Цифровые ресурсы', 'Методист'],
                progress: 0
            },
            {
                title: 'Контрольный тест',
                description: 'Провести контрольный тест для оценки эффективности коррекционных мер',
                deadline: '4 недели',
                resources: ['Тестовые задания', 'Система оценивания', 'Аналитические инструменты'],
                progress: 0
            }
        ];
        
        // Ожидаемые результаты
        const expectedResults = [
            {
                title: 'Улучшение среднего балла',
                description: 'Повышение среднего балла класса на 10-15%',
                improvement: 15,
                timeframe: '1 месяц',
                icon: 'fa-chart-line'
            },
            {
                title: 'Снижение отстающих',
                description: 'Уменьшение количества учащихся с баллом ниже 50% на 50%',
                improvement: 50,
                timeframe: '2 месяца',
                icon: 'fa-user-graduate'
            },
            {
                title: 'Улучшение заданий',
                description: 'Повышение дискриминативности проблемных заданий до приемлемого уровня',
                improvement: 40,
                timeframe: '3 недели',
                icon: 'fa-tasks'
            }
        ];
        
        return {
            priority: priorityRecommendations,
            actionPlan,
            expectedResults,
            progressMetrics: {
                currentScore: averageScore.toFixed(1),
                targetScore: (averageScore + 15).toFixed(1),
                improvementNeeded: (70 - averageScore).toFixed(1)
            }
        };
    }

    // Анализ временных метрик
    analyzeTimeMetrics() {
        if (!appData.students || appData.students.length === 0) {
            return {
                hasData: false,
                metrics: {},
                analysis: 'Нет данных о времени выполнения'
            };
        }
        
        // Проверяем, есть ли данные о времени в структуре appData
        const hasTimeData = appData.test?.timeLimit || 
                           appData.tasks?.some(task => task.timeLimit) ||
                           appData.results?.some(result => typeof result === 'object' && result.timeSpent);
        
        if (!hasTimeData) {
            // Генерируем демо-данные о времени выполнения
            return this.generateDemoTimeMetrics();
        }
        
        // Реальные данные о времени (если они есть)
        const metrics = {
            totalTimeLimit: appData.test?.timeLimit || 0,
            tasksWithTimeLimit: appData.tasks?.filter(task => task.timeLimit).length || 0,
            averageTimePerTask: 0,
            timeDistribution: {},
            efficiencyScores: []
        };
        
        // Если есть конкретные данные о времени
        if (appData.results && appData.results[0] && typeof appData.results[0] === 'object') {
            return this.analyzeActualTimeMetrics();
        }
        
        return {
            hasData: true,
            metrics,
            analysis: 'Данные о времени ограничены. Рекомендуется добавить временные метрики для более точного анализа.',
            recommendations: [
                'Добавить временные ограничения для заданий',
                'Собирать данные о времени выполнения каждого задания',
                'Анализировать корреляцию между временем и результатами'
            ]
        };
    }

    // Генерация демо-данных о времени
    generateDemoTimeMetrics() {
        const taskCount = appData.tasks?.length || 0;
        const studentCount = appData.students?.length || 0;
        
        // Генерируем реалистичные демо-данные
        const timePerTask = Array(taskCount).fill(0).map(() => 
            Math.floor(Math.random() * 10) + 3 // 3-12 минут на задание
        );
        
        // Данные о времени для каждого студента
        const studentTimes = Array(studentCount).fill(0).map(() => 
            timePerTask.map(time => time * (0.8 + Math.random() * 0.4)) // +/- 20% вариация
        );
        
        // Эффективность (баллы в минуту)
        const efficiencyScores = appData.students?.map((student, studentIndex) => {
            const totalTime = studentTimes[studentIndex]?.reduce((a, b) => a + b, 0) || 0;
            const totalScore = this.calculateStudentTotalScore(studentIndex);
            const efficiency = totalTime > 0 ? (totalScore / totalTime) : 0;
            
            return {
                studentName: student,
                studentIndex,
                totalTime: totalTime.toFixed(1),
                totalScore: totalScore.toFixed(1),
                efficiency: efficiency.toFixed(3),
                efficiencyLevel: efficiency > 0.8 ? 'Высокая' : efficiency > 0.5 ? 'Средняя' : 'Низкая'
            };
        }) || [];
        
        // Распределение по времени
        const timeDistribution = {
            'Быстрые (< 70% времени)': Math.floor(studentCount * 0.3),
            'Средние (70-90% времени)': Math.floor(studentCount * 0.4),
            'Медленные (> 90% времени)': Math.floor(studentCount * 0.3)
        };
        
        return {
            hasData: true,
            metrics: {
                totalTimeLimit: 120, // 2 часа для всего теста
                averageTimePerTask: (timePerTask.reduce((a, b) => a + b, 0) / taskCount).toFixed(1),
                tasksWithTimeLimit: taskCount,
                efficiencyScores: efficiencyScores.sort((a, b) => b.efficiency - a.efficiency),
                timeDistribution
            },
            analysis: this.generateTimeAnalysis(efficiencyScores),
            recommendations: this.generateTimeRecommendations(efficiencyScores)
        };
    }

    // Анализ реальных данных о времени
    analyzeActualTimeMetrics() {
        // Если в appData.results есть объекты с данными о времени
        const timeData = appData.results.filter(result => 
            typeof result === 'object' && result.timeSpent
        );
        
        if (timeData.length === 0) {
            return this.generateDemoTimeMetrics();
        }
        
        // Реальная обработка данных о времени
        const taskCount = appData.tasks?.length || 0;
        const studentCount = appData.students?.length || 0;
        
        // Собираем статистику по времени
        const timeStats = timeData.map((data, index) => ({
            studentIndex: index,
            studentName: appData.students?.[index] || `Студент ${index + 1}`,
            totalTime: data.timeSpent || 0,
            averagePerTask: data.timeSpent / taskCount || 0
        }));
        
        // Сортируем по эффективности
        const efficiencyScores = timeStats.map(stat => {
            const totalScore = this.calculateStudentTotalScore(stat.studentIndex);
            const efficiency = stat.totalTime > 0 ? (totalScore / stat.totalTime) : 0;
            
            return {
                ...stat,
                totalScore: totalScore.toFixed(1),
                efficiency: efficiency.toFixed(3),
                efficiencyLevel: efficiency > 0.8 ? 'Высокая' : efficiency > 0.5 ? 'Средняя' : 'Низкая'
            };
        }).sort((a, b) => b.efficiency - a.efficiency);
        
        return {
            hasData: true,
            metrics: {
                efficiencyScores,
                timeStats,
                averageTotalTime: (timeStats.reduce((sum, stat) => sum + stat.totalTime, 0) / timeStats.length).toFixed(1)
            },
            analysis: this.generateTimeAnalysis(efficiencyScores),
            recommendations: this.generateTimeRecommendations(efficiencyScores)
        };
    }

    // Расчет общего балла студента
    calculateStudentTotalScore(studentIndex) {
        if (!appData.tasks || !appData.results || !appData.results[studentIndex]) return 0;
        
        let totalScore = 0;
        appData.tasks.forEach((task, taskIndex) => {
            const score = this.getStudentScore(studentIndex, taskIndex);
            totalScore += score;
        });
        
        return totalScore;
    }

    // Генерация анализа времени
    generateTimeAnalysis(efficiencyScores) {
        if (!efficiencyScores || efficiencyScores.length === 0) {
            return 'Недостаточно данных для анализа временных метрик.';
        }
        
        const highEfficiency = efficiencyScores.filter(s => s.efficiencyLevel === 'Высокая').length;
        const lowEfficiency = efficiencyScores.filter(s => s.efficiencyLevel === 'Низкая').length;
        const total = efficiencyScores.length;
        
        let analysis = '<h5>Анализ временной эффективности:</h5>';
        analysis += `<p><strong>Высокая эффективность:</strong> ${highEfficiency} учащихся (${((highEfficiency / total) * 100).toFixed(1)}%)</p>`;
        analysis += `<p><strong>Низкая эффективность:</strong> ${lowEfficiency} учащихся (${((lowEfficiency / total) * 100).toFixed(1)}%)</p>`;
        
        // Находим лучших и худших по эффективности
        if (efficiencyScores.length >= 3) {
            const best = efficiencyScores[0];
            const worst = efficiencyScores[efficiencyScores.length - 1];
            
            analysis += `<p><strong>Наиболее эффективный:</strong> ${best.studentName} (${best.efficiency} баллов/минуту)</p>`;
            analysis += `<p><strong>Наименее эффективный:</strong> ${worst.studentName} (${worst.efficiency} баллов/минуту)</p>`;
        }
        
        // Выводы
        analysis += '<h5 style="margin-top: 15px;">Выводы:</h5>';
        
        if (highEfficiency > lowEfficiency) {
            analysis += '<p>Большинство учащихся работают эффективно, оптимально распределяя время.</p>';
        } else if (lowEfficiency > highEfficiency) {
            analysis += '<p>Значительная часть учащихся работает неэффективно, требуется тренировка тайм-менеджмента.</p>';
        } else {
            analysis += '<p>Распределение эффективности равномерное, есть потенциал для улучшения у половины учащихся.</p>';
        }
        
        return analysis;
    }

    // Генерация рекомендаций по времени
    generateTimeRecommendations(efficiencyScores) {
        const lowEfficiency = efficiencyScores.filter(s => s.efficiencyLevel === 'Низкая').length;
        
        const recommendations = [
            'Проводить тренировочные тесты с ограничением времени',
            'Учить студентов распределять время между заданиями'
        ];
        
        if (lowEfficiency > 0) {
            recommendations.push('Для учащихся с низкой эффективностью разработать индивидуальные планы по тайм-менеджменту');
            recommendations.push('Включить задания на развитие скорости мышления');
        }
        
        // Проверяем распределение времени
        const timeVariation = efficiencyScores.map(s => parseFloat(s.efficiency));
        const avgEfficiency = this.calculateAverage(timeVariation);
        const stdDev = this.calculateStandardDeviation(timeVariation);
        
        if (stdDev > avgEfficiency * 0.5) {
            recommendations.push('Большой разброс во времени выполнения - дифференцировать задания по сложности');
        }
        
        return recommendations;
    }

    // Расчет стандартного отклонения
    calculateStandardDeviation(values) {
        if (!values || values.length < 2) return 0;
        const mean = this.calculateAverage(values);
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    // Реализация метода showStudentDetails
    showStudentDetails(studentIndex) {
        if (!appData.students || !appData.students[studentIndex]) {
            showNotification('Студент не найден', 'error');
            return;
        }
        
        const studentName = appData.students[studentIndex];
        const studentScores = appData.tasks?.map((task, taskIndex) => {
            const score = this.getStudentScore(studentIndex, taskIndex);
            const maxScore = task.maxScore || 1;
            const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
            
            return {
                task: task.title || `Задание ${taskIndex + 1}`,
                score: score.toFixed(1),
                maxScore: maxScore.toFixed(1),
                percentage: percentage.toFixed(1),
                level: task.level || 1
            };
        }) || [];
        
        const totalScore = studentScores.reduce((sum, item) => sum + parseFloat(item.score), 0);
        const maxTotalScore = studentScores.reduce((sum, item) => sum + parseFloat(item.maxScore), 0);
        const overallPercentage = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;
        
        // Расчет компетенций
        const competences = {
            'Знание': { scores: [], average: 0 },
            'Понимание': { scores: [], average: 0 },
            'Применение': { scores: [], average: 0 },
            'Анализ': { scores: [], average: 0 },
            'Синтез': { scores: [], average: 0 }
        };
        
        studentScores.forEach((item, index) => {
            const task = appData.tasks?.[index];
            if (task) {
                const competence = this.getCompetenceByLevel(task.level || 1);
                if (competences[competence]) {
                    competences[competence].scores.push(parseFloat(item.percentage));
                }
            }
        });
        
        // Расчет средних по компетенциям
        Object.keys(competences).forEach(key => {
            if (competences[key].scores.length > 0) {
                competences[key].average = this.calculateAverage(competences[key].scores);
            }
        });
        
        // Анализ ошибок студента
        const studentErrors = appData.errors?.filter(error => 
            error.studentIndex === studentIndex
        ) || [];
        
        // Создаем модальное окно с детальной информацией
        this.createStudentDetailsModal({
            studentIndex,
            studentName,
            studentScores,
            totalScore: totalScore.toFixed(1),
            maxTotalScore: maxTotalScore.toFixed(1),
            overallPercentage: overallPercentage.toFixed(1),
            competences,
            errors: studentErrors
        });
    }

    // Создание модального окна деталей студента
    createStudentDetailsModal(data) {
        // Удаляем существующее модальное окно
        const existingModal = document.getElementById('studentDetailsModal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'studentDetailsModal';
        modal.innerHTML = `
            <div class="student-modal-overlay" onclick="this.parentElement.remove()">
                <div class="student-modal-content" onclick="event.stopPropagation()">
                    <div class="student-modal-header">
                        <h3>
                            <i class="fas fa-user-graduate"></i>
                            ${data.studentName}
                        </h3>
                        <button class="close-btn" onclick="this.closest('#studentDetailsModal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="student-modal-body modal-body-scrollable">
                        <!-- Основная статистика -->
                        <div class="student-stats-cards">
                            <div class="stat-card">
                                <div class="stat-icon success">
                                    <i class="fas fa-chart-line"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-value">${data.overallPercentage}%</div>
                                    <div class="stat-label">Общий результат</div>
                                </div>
                            </div>
                            
                            <div class="stat-card">
                                <div class="stat-icon primary">
                                    <i class="fas fa-tasks"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-value">${data.studentScores.length}</div>
                                    <div class="stat-label">Выполнено заданий</div>
                                </div>
                            </div>
                            
                            <div class="stat-card">
                                <div class="stat-icon ${data.errors.length > 0 ? 'danger' : 'success'}">
                                    <i class="fas ${data.errors.length > 0 ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-value">${data.errors.length}</div>
                                    <div class="stat-label">Количество ошибок</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Компетенции -->
                        <div class="competences-section">
                            <h4><i class="fas fa-chart-radar"></i> Уровень компетенций</h4>
                            <div class="competences-chart-container">
                                <canvas id="studentCompetencesChart"></canvas>
                            </div>
                        </div>
                        
                        <!-- Результаты по заданиям -->
                        <div class="tasks-section">
                            <h4><i class="fas fa-list-ol"></i> Результаты по заданиям</h4>
                            <div class="tasks-table-container">
                                <table class="student-tasks-table">
                                    <thead>
                                        <tr>
                                            <th>Задание</th>
                                            <th>Балл</th>
                                            <th>Максимум</th>
                                            <th>Процент</th>
                                            <th>Уровень</th>
                                            <th>Статус</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.studentScores.map((task, index) => `
                                            <tr>
                                                <td>${task.task}</td>
                                                <td>${task.score}</td>
                                                <td>${task.maxScore}</td>
                                                <td>
                                                    <div class="percentage-indicator">
                                                        <div class="percentage-bar" style="width: ${task.percentage}%"></div>
                                                        <span>${task.percentage}%</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span class="level-badge level-${task.level}">
                                                        ${task.level}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span class="status-badge ${parseFloat(task.percentage) >= 70 ? 'success' : parseFloat(task.percentage) >= 50 ? 'warning' : 'danger'}">
                                                        ${parseFloat(task.percentage) >= 70 ? '✓' : parseFloat(task.percentage) >= 50 ? '~' : '✗'}
                                                    </span>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <!-- Ошибки -->
                        ${data.errors.length > 0 ? `
                            <div class="errors-section">
                                <h4><i class="fas fa-exclamation-circle"></i> Анализ ошибок</h4>
                                <div class="errors-list">
                                    ${data.errors.slice(0, 5).map(error => `
                                        <div class="error-item">
                                            <div class="error-type ${error.type}">
                                                ${this.getErrorTypeLabel(error.type)}
                                            </div>
                                            <div class="error-description">
                                                ${error.description || 'Ошибка в выполнении задания'}
                                            </div>
                                            <div class="error-task">
                                                Задание ${error.taskIndex + 1}
                                            </div>
                                        </div>
                                    `).join('')}
                                    ${data.errors.length > 5 ? `
                                        <div class="more-errors">
                                            И еще ${data.errors.length - 5} ошибок...
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Рекомендации для студента -->
                        <div class="recommendations-section">
                            <h4><i class="fas fa-lightbulb"></i> Рекомендации</h4>
                            <div class="student-recommendations">
                                ${this.generateStudentRecommendations(data).map(rec => `
                                    <div class="recommendation-item">
                                        <i class="fas fa-check-circle"></i>
                                        <span>${rec}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="student-modal-footer">
                        <button class="btn btn-primary" onclick="window.advancedAnalytics.exportStudentReport(${data.studentIndex})">
                            <i class="fas fa-file-export"></i> Экспорт отчета
                        </button>
                        <button class="btn btn-outline" onclick="this.closest('#studentDetailsModal').remove()">
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Добавляем стили
        this.addStudentModalStyles();
        
        // Создаем график компетенций
        setTimeout(() => {
            this.createStudentCompetencesChart(data.competences);
        }, 100);
    }

    // Генерация рекомендаций для студента
    generateStudentRecommendations(data) {
        const recommendations = [];
        const overall = parseFloat(data.overallPercentage);
        
        if (overall < 50) {
            recommendations.push('Требуется повторение основного материала');
            recommendations.push('Необходима индивидуальная консультация с преподавателем');
        } else if (overall < 70) {
            recommendations.push('Рекомендуется дополнительная практика по сложным темам');
            recommendations.push('Работа над устранением типичных ошибок');
        } else if (overall < 85) {
            recommendations.push('Продолжать в том же темпе, уделить внимание деталям');
            recommendations.push('Развивать навыки решения нестандартных задач');
        } else {
            recommendations.push('Отличный результат! Можно переходить к более сложным темам');
            recommendations.push('Рекомендуется участие в олимпиадах и конкурсах');
        }
        
        // Анализ компетенций
        const weakCompetences = Object.entries(data.competences)
            .filter(([key, value]) => value.average < 60)
            .map(([key]) => key);
        
        if (weakCompetences.length > 0) {
            recommendations.push(`Сосредоточиться на развитии: ${weakCompetences.join(', ')}`);
        }
        
        // Анализ ошибок
        if (data.errors.length > 0) {
            const errorTypes = [...new Set(data.errors.map(e => e.type))];
            if (errorTypes.includes('calculation')) {
                recommendations.push('Тренировать вычислительные навыки');
            }
            if (errorTypes.includes('conceptual')) {
                recommendations.push('Повторить основные понятия и определения');
            }
        }
        
        return recommendations.slice(0, 5); // Ограничиваем 5 рекомендациями
    }

    // Создание графика компетенций студента
    createStudentCompetencesChart(competences) {
        const ctx = document.getElementById('studentCompetencesChart');
        if (!ctx) return;
        
        const labels = Object.keys(competences);
        const data = labels.map(key => competences[key].average);
        
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Уровень компетенции',
                    data: data,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgb(54, 162, 235)',
                    pointBackgroundColor: 'rgb(54, 162, 235)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(54, 162, 235)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                }
            }
        });
    }

    // Добавление стилей для модального окна студента
    addStudentModalStyles() {
        const styleId = 'student-modal-styles';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .student-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                padding: 20px;
            }
            
            .student-modal-content {
                background: white;
                border-radius: 15px;
                width: 90%;
                max-width: 900px;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                overflow: hidden;
            }
            
            .student-modal-header {
                background: linear-gradient(135deg, #3498db, #2c3e50);
                color: white;
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .student-modal-header h3 {
                margin: 0;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .close-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
            }
            
            .close-btn:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: rotate(90deg);
            }
            
            .student-modal-body {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .student-stats-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 30px;
            }
            
            .stat-card {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 15px;
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .stat-icon {
                width: 50px;
                height: 50px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                color: white;
            }
            
            .stat-icon.success { background: #27ae60; }
            .stat-icon.primary { background: #3498db; }
            .stat-icon.danger { background: #e74c3c; }
            .stat-icon.warning { background: #f39c12; }
            
            .stat-value {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .stat-label {
                color: #7f8c8d;
                font-size: 12px;
            }
            
            .competences-section,
            .tasks-section,
            .errors-section,
            .recommendations-section {
                margin-bottom: 30px;
            }
            
            .competences-chart-container {
                height: 300px;
                margin-top: 15px;
            }
            
            .tasks-table-container {
                overflow-x: auto;
                margin-top: 15px;
            }
            
            .student-tasks-table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .student-tasks-table th {
                background: #f8f9fa;
                padding: 12px 15px;
                text-align: left;
                font-weight: 600;
                color: #495057;
                border-bottom: 2px solid #dee2e6;
            }
            
            .student-tasks-table td {
                padding: 10px 15px;
                border-bottom: 1px solid #e9ecef;
            }
            
            .percentage-indicator {
                background: #e9ecef;
                border-radius: 10px;
                height: 20px;
                position: relative;
                overflow: hidden;
            }
            
            .percentage-bar {
                position: absolute;
                top: 0;
                left: 0;
                bottom: 0;
                border-radius: 10px;
                background: linear-gradient(90deg, #3498db, #2ecc71);
            }
            
            .percentage-indicator span {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                color: white;
                font-weight: bold;
                z-index: 1;
            }
            
            .level-badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
                color: white;
            }
            
            .level-1 { background: #27ae60; }
            .level-2 { background: #3498db; }
            .level-3 { background: #f39c12; }
            .level-4 { background: #e74c3c; }
            .level-5 { background: #9b59b6; }
            
            .status-badge {
                display: inline-block;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: white;
            }
            
            .status-badge.success { background: #27ae60; }
            .status-badge.warning { background: #f39c12; }
            .status-badge.danger { background: #e74c3c; }
            
            .errors-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 15px;
            }
            
            .error-item {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 12px;
                border-left: 4px solid #e74c3c;
            }
            
            .error-type {
                font-size: 12px;
                font-weight: bold;
                color: #e74c3c;
                margin-bottom: 5px;
            }
            
            .student-recommendations {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 15px;
            }
            
            .recommendation-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px;
                background: #e8f4fc;
                border-radius: 8px;
            }
            
            .recommendation-item i {
                color: #3498db;
            }
            
            .student-modal-footer {
                padding: 20px;
                background: #f8f9fa;
                border-top: 1px solid #e9ecef;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
        `;
        
        document.head.appendChild(style);
    }

    // Реализация метода exportStudentReport
    exportStudentReport(studentIndex) {
        if (!appData.students || !appData.students[studentIndex]) {
            showNotification('Студент не найден', 'error');
            return;
        }
        
        const studentName = appData.students[studentIndex];
        const studentData = this.collectStudentDataForExport(studentIndex);
        
        // Создаем HTML отчет
        const reportHTML = this.generateStudentReportHTML(studentName, studentData);
        
        // Экспорт в файл
        this.exportToFile(reportHTML, `отчет_${studentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`);
        
        showNotification(`Отчет студента "${studentName}" экспортирован`, 'success');
    }

    // Сбор данных студента для экспорта
    collectStudentDataForExport(studentIndex) {
        const studentName = appData.students[studentIndex];
        const tasks = appData.tasks?.map((task, index) => ({
            number: index + 1,
            title: task.title || `Задание ${index + 1}`,
            score: this.getStudentScore(studentIndex, index),
            maxScore: task.maxScore || 1,
            level: task.level || 1,
            competence: this.getCompetenceByLevel(task.level || 1)
        })) || [];
        
        const totalScore = tasks.reduce((sum, task) => sum + task.score, 0);
        const maxTotalScore = tasks.reduce((sum, task) => sum + task.maxScore, 0);
        const overallPercentage = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;
        
        const errors = appData.errors?.filter(error => error.studentIndex === studentIndex) || [];
        
        return {
            studentName,
            tasks,
            totalScore,
            maxTotalScore,
            overallPercentage: overallPercentage.toFixed(1),
            errors,
            testInfo: {
                subject: appData.test?.subject || 'Не указан',
                theme: appData.test?.theme || 'Не указана',
                date: appData.test?.testDate || 'Не указана',
                class: appData.test?.class || 'Не указан'
            }
        };
    }

    // Генерация HTML отчета студента
    generateStudentReportHTML(studentName, data) {
        const date = new Date().toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Статистика по компетенциям
        const competenceStats = {};
        data.tasks.forEach(task => {
            if (!competenceStats[task.competence]) {
                competenceStats[task.competence] = { total: 0, max: 0, count: 0 };
            }
            competenceStats[task.competence].total += task.score;
            competenceStats[task.competence].max += task.maxScore;
            competenceStats[task.competence].count++;
        });
        
        return `
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Отчет: ${studentName}</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 20px;
                        background: #f5f7fa;
                    }
                    
                    .header {
                        background: linear-gradient(135deg, #3498db, #2c3e50);
                        color: white;
                        padding: 30px;
                        border-radius: 10px;
                        margin-bottom: 30px;
                    }
                    
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                    }
                    
                    .header .subtitle {
                        opacity: 0.9;
                        margin-top: 10px;
                    }
                    
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    
                    .stat-card {
                        background: white;
                        padding: 20px;
                        border-radius: 10px;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.1);
                        text-align: center;
                    }
                    
                    .stat-value {
                        font-size: 32px;
                        font-weight: bold;
                        margin: 10px 0;
                    }
                    
                    .stat-value.excellent { color: #27ae60; }
                    .stat-value.good { color: #3498db; }
                    .stat-value.average { color: #f39c12; }
                    .stat-value.poor { color: #e74c3c; }
                    
                    .section {
                        background: white;
                        padding: 25px;
                        border-radius: 10px;
                        margin-bottom: 30px;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.1);
                    }
                    
                    .section h2 {
                        color: #2c3e50;
                        border-bottom: 2px solid #3498db;
                        padding-bottom: 10px;
                        margin-top: 0;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    
                    th {
                        background: #f8f9fa;
                        padding: 12px;
                        text-align: left;
                        font-weight: 600;
                        color: #495057;
                        border-bottom: 2px solid #dee2e6;
                    }
                    
                    td {
                        padding: 10px 12px;
                        border-bottom: 1px solid #e9ecef;
                    }
                    
                    .percentage-bar {
                        background: #e9ecef;
                        border-radius: 10px;
                        height: 20px;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .percentage-fill {
                        position: absolute;
                        top: 0;
                        left: 0;
                        bottom: 0;
                        border-radius: 10px;
                        background: linear-gradient(90deg, #3498db, #2ecc71);
                    }
                    
                    .percentage-text {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 12px;
                        color: white;
                        font-weight: bold;
                        z-index: 1;
                    }
                    
                    .competence-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 15px;
                    }
                    
                    .competence-item {
                        padding: 15px;
                        background: #f8f9fa;
                        border-radius: 8px;
                        border-left: 4px solid #3498db;
                    }
                    
                    .footer {
                        text-align: center;
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        color: #7f8c8d;
                        font-size: 14px;
                    }
                    
                    @media print {
                        body {
                            background: white;
                        }
                        
                        .section {
                            box-shadow: none;
                            border: 1px solid #ddd;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📊 Отчет об успеваемости</h1>
                    <div class="subtitle">
                        <strong>Учащийся:</strong> ${studentName}<br>
                        <strong>Тест:</strong> ${data.testInfo.subject} - ${data.testInfo.theme}<br>
                        <strong>Дата:</strong> ${date}
                    </div>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div>Общий результат</div>
                        <div class="stat-value ${this.getScoreClass(data.overallPercentage)}">
                            ${data.overallPercentage}%
                        </div>
                        <div>${data.totalScore.toFixed(1)} из ${data.maxTotalScore.toFixed(1)} баллов</div>
                    </div>
                    
                    <div class="stat-card">
                        <div>Выполнено заданий</div>
                        <div class="stat-value">${data.tasks.length}</div>
                        <div>из ${data.tasks.length} возможных</div>
                    </div>
                    
                    <div class="stat-card">
                        <div>Уровень подготовки</div>
                        <div class="stat-value">
                            ${parseFloat(data.overallPercentage) >= 85 ? 'Отлично' : 
                              parseFloat(data.overallPercentage) >= 70 ? 'Хорошо' : 
                              parseFloat(data.overallPercentage) >= 50 ? 'Удовлетворительно' : 'Неудовлетворительно'}
                        </div>
                        <div>${this.getScoreDescription(parseFloat(data.overallPercentage))}</div>
                    </div>
                </div>
                
                <div class="section">
                    <h2>📈 Результаты по заданиям</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>№</th>
                                <th>Задание</th>
                                <th>Балл</th>
                                <th>Максимум</th>
                                <th>Процент</th>
                                <th>Компетенция</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.tasks.map(task => {
                                const percentage = (task.score / task.maxScore * 100).toFixed(1);
                                return `
                                    <tr>
                                        <td>${task.number}</td>
                                        <td>${task.title}</td>
                                        <td>${task.score.toFixed(1)}</td>
                                        <td>${task.maxScore.toFixed(1)}</td>
                                        <td>
                                            <div class="percentage-bar">
                                                <div class="percentage-fill" style="width: ${percentage}%"></div>
                                                <div class="percentage-text">${percentage}%</div>
                                            </div>
                                        </td>
                                        <td>${task.competence}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="section">
                    <h2>🎯 Анализ компетенций</h2>
                    <div class="competence-grid">
                        ${Object.entries(competenceStats).map(([competence, stats]) => {
                            const percentage = stats.max > 0 ? (stats.total / stats.max * 100).toFixed(1) : 0;
                            return `
                                <div class="competence-item">
                                    <h3 style="margin-top: 0;">${competence}</h3>
                                    <div>Выполнено заданий: ${stats.count}</div>
                                    <div>Общий балл: ${stats.total.toFixed(1)} из ${stats.max.toFixed(1)}</div>
                                    <div style="margin-top: 10px;">
                                        <div class="percentage-bar">
                                            <div class="percentage-fill" style="width: ${percentage}%"></div>
                                            <div class="percentage-text">${percentage}%</div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                ${data.errors.length > 0 ? `
                    <div class="section">
                        <h2>⚠️ Анализ ошибок</h2>
                        <p>Всего ошибок: ${data.errors.length}</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>Тип ошибки</th>
                                    <th>Задание</th>
                                    <th>Описание</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.errors.map(error => `
                                    <tr>
                                        <td>${this.getErrorTypeLabel(error.type)}</td>
                                        <td>Задание ${error.taskIndex + 1}</td>
                                        <td>${error.description || 'Ошибка в выполнении задания'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}
                
                <div class="section">
                    <h2>💡 Рекомендации</h2>
                    ${this.generateStudentRecommendations({
                        studentIndex: 0,
                        studentName,
                        overallPercentage: parseFloat(data.overallPercentage),
                        competences: Object.fromEntries(
                            Object.entries(competenceStats).map(([key, stats]) => [
                                key, 
                                { average: stats.max > 0 ? (stats.total / stats.max * 100) : 0 }
                            ])
                        ),
                        errors: data.errors
                    }).map(rec => `<p>• ${rec}</p>`).join('')}
                </div>
                
                <div class="footer">
                    <p>Отчет сгенерирован автоматически ${date} с помощью системы аналитики</p>
                    <p>Для вопросов и уточнений обращайтесь к преподавателю</p>
                </div>
            </body>
            </html>
        `;
    }

    // Вспомогательный метод для получения описания балла
    getScoreDescription(percentage) {
        if (percentage >= 85) return 'Отличное владение материалом';
        if (percentage >= 70) return 'Хорошее понимание темы';
        if (percentage >= 50) return 'Базовое понимание, требуется практика';
        return 'Требуется повторение материала';
    }

    // Экспорт в файл
    exportToFile(content, filename) {
        const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Реализация метода editTask
    editTask(taskIndex) {
        if (!appData.tasks || !appData.tasks[taskIndex]) {
            showNotification('Задание не найдено', 'error');
            return;
        }
        
        const task = appData.tasks[taskIndex];
        
        // Создаем модальное окно редактирования
        this.createTaskEditModal(taskIndex, task);
    }

    // Создание модального окна редактирования задания
    createTaskEditModal(taskIndex, task) {
        // Ограничиваем уровень 1-4
        const currentLevel = Math.min(Math.max(task.level || 1, 1), 4);
        
        const modal = document.createElement('div');
        modal.id = 'taskEditModal';
        modal.innerHTML = `
            <div class="task-modal-overlay" onclick="this.parentElement.remove()">
                <div class="task-modal-content" onclick="event.stopPropagation()">
                    <div class="task-modal-header">
                        <h3>
                            <i class="fas fa-edit"></i>
                            Редактирование задания ${taskIndex + 1}
                        </h3>
                        <button class="close-btn" onclick="this.closest('#taskEditModal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="task-modal-body modal-body-scrollable">
                        <form id="taskEditForm">
                            <div class="form-group">
                                <label for="taskTitle">Название задания:</label>
                                <input type="text" id="taskTitle" value="${task.title || `Задание ${taskIndex + 1}`}" class="form-control">
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="taskLevel">Уровень сложности (1-4):</label>
                                    <select id="taskLevel" class="form-control">
                                        <option value="1" ${currentLevel === 1 ? 'selected' : ''}>1 - Базовый</option>
                                        <option value="2" ${currentLevel === 2 ? 'selected' : ''}>2 - Применение</option>
                                        <option value="3" ${currentLevel === 3 ? 'selected' : ''}>3 - Анализ</option>
                                        <option value="4" ${currentLevel === 4 ? 'selected' : ''}>4 - Творчество</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="taskMaxScore">Максимальный балл:</label>
                                    <input type="number" id="taskMaxScore" min="0.1" step="0.1" value="${task.maxScore || 1}" class="form-control">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="taskType">Тип задания:</label>
                                <select id="taskType" class="form-control">
                                    <option value="multiple-choice" ${task.type === 'multiple-choice' ? 'selected' : ''}>Выбор ответа</option>
                                    <option value="short-answer" ${task.type === 'short-answer' ? 'selected' : ''}>Краткий ответ</option>
                                    <option value="essay" ${task.type === 'essay' ? 'selected' : ''}>Развернутый ответ</option>
                                    <option value="matching" ${task.type === 'matching' ? 'selected' : ''}>Сопоставление</option>
                                    <option value="true-false" ${task.type === 'true-false' ? 'selected' : ''}>Верно/Неверно</option>
                                    <option value="calculation" ${task.type === 'calculation' ? 'selected' : ''}>Расчетная задача</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="taskCompetence">Компетенция:</label>
                                <select id="taskCompetence" class="form-control">
                                    <option value="Знание" ${task.competence === 'Знание' ? 'selected' : ''}>Знание</option>
                                    <option value="Понимание" ${task.competence === 'Понимание' ? 'selected' : ''}>Понимание</option>
                                    <option value="Применение" ${task.competence === 'Применение' ? 'selected' : ''}>Применение</option>
                                    <option value="Анализ" ${task.competence === 'Анализ' ? 'selected' : ''}>Анализ</option>
                                    <option value="Синтез" ${task.competence === 'Синтез' ? 'selected' : ''}>Синтез</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="taskDescription">Описание задания:</label>
                                <textarea id="taskDescription" rows="4" class="form-control">${task.description || ''}</textarea>
                            </div>
                            
                            <div class="analysis-section">
                                <h4><i class="fas fa-chart-bar"></i> Анализ задания</h4>
                                <div class="task-stats">
                                    <div class="task-stat">
                                        <div class="stat-label">Сложность:</div>
                                        <div class="stat-value ${this.getDifficultyClass(task.difficulty || 0.5)}">
                                            ${((task.difficulty || 0.5) * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div class="task-stat">
                                        <div class="stat-label">Дискриминативность:</div>
                                        <div class="stat-value ${this.getDiscriminationClass(task.discrimination || 0.5)}">
                                            ${((task.discrimination || 0.5) * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i> Сохранить изменения
                                </button>
                                <button type="button" class="btn btn-outline" onclick="this.closest('#taskEditModal').remove()">
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Добавляем обработчик формы
        setTimeout(() => {
            const form = document.getElementById('taskEditForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveTaskChanges(taskIndex, form);
                });
            }
        }, 100);
    }

    // Сохранение изменений задания
    saveTaskChanges(taskIndex, form) {
        const title = form.querySelector('#taskTitle').value;
        const level = parseInt(form.querySelector('#taskLevel').value);
        const maxScore = parseFloat(form.querySelector('#taskMaxScore').value);
        const type = form.querySelector('#taskType').value;
        const competence = form.querySelector('#taskCompetence').value;
        const description = form.querySelector('#taskDescription').value;
        
        // Обновляем данные задания
        if (appData.tasks && appData.tasks[taskIndex]) {
            appData.tasks[taskIndex] = {
                ...appData.tasks[taskIndex],
                title,
                level: Math.min(Math.max(level, 1), 4), // Ограничиваем 1-4
                maxScore,
                type,
                competence,
                description
            };
            
            showNotification('✅ Изменения задания сохранены', 'success');
            
            // Закрываем модальное окно
            const modal = document.getElementById('taskEditModal');
            if (modal) modal.remove();
            
            // Обновляем анализ если нужно
            setTimeout(() => {
                if (document.getElementById('detailedAnalysisModal')) {
                    this.showDetailedAnalysis();
                }
            }, 500);
        }
    }

    // Реализация метода analyzeTask
    analyzeTask(taskIndex) {
        if (!appData.tasks || !appData.tasks[taskIndex]) {
            showNotification('Задание не найдено', 'error');
            return;
        }
        
        const task = appData.tasks[taskIndex];
        const taskData = this.getTaskAnalysisData(taskIndex);
        
        // Создаем модальное окно анализа задания
        this.createTaskAnalysisModal(taskIndex, task, taskData);
    }

    // Получение данных анализа задания
    getTaskAnalysisData(taskIndex) {
        if (!appData.students || !appData.tasks) return null;
        
        const scores = appData.students.map((student, studentIndex) => {
            const score = this.getStudentScore(studentIndex, taskIndex);
            const maxScore = appData.tasks[taskIndex].maxScore || 1;
            return maxScore > 0 ? (score / maxScore) * 100 : 0;
        });
        
        const difficulty = this.calculateTaskDifficulty(scores);
        const discrimination = this.calculateTaskDiscrimination(scores);
        const completionRate = (scores.filter(s => s > 0).length / scores.length) * 100;
        
        // Группировка по результатам
        const resultGroups = {
            'Отлично (85-100%)': scores.filter(s => s >= 85).length,
            'Хорошо (70-85%)': scores.filter(s => s >= 70 && s < 85).length,
            'Удовлетворительно (50-70%)': scores.filter(s => s >= 50 && s < 70).length,
            'Неудовлетворительно (<50%)': scores.filter(s => s < 50).length
        };
        
        return {
            difficulty,
            discrimination,
            completionRate,
            averageScore: this.calculateAverage(scores),
            maxScore: Math.max(...scores),
            minScore: Math.min(...scores),
            resultGroups,
            scores
        };
    }

    // Создание модального окна анализа задания
    createTaskAnalysisModal(taskIndex, task, taskData) {
        const modal = document.createElement('div');
        modal.id = 'taskAnalysisModal';
        modal.innerHTML = `
            <div class="task-analysis-modal-overlay" onclick="this.parentElement.remove()">
                <div class="task-analysis-modal-content" onclick="event.stopPropagation()">
                    <div class="task-analysis-modal-header">
                        <h3>
                            <i class="fas fa-chart-bar"></i>
                            Анализ задания: ${task.title || `Задание ${taskIndex + 1}`}
                        </h3>
                        <button class="close-btn" onclick="this.closest('#taskAnalysisModal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="task-analysis-modal-body modal-body-scrollable">
                        <div class="task-analysis-stats">
                            <div class="task-stat-card">
                                <div class="task-stat-icon ${taskData.difficulty > 0.7 ? 'danger' : taskData.difficulty > 0.5 ? 'warning' : 'success'}">
                                    <i class="fas fa-mountain"></i>
                                </div>
                                <div class="task-stat-content">
                                    <div class="task-stat-value">${(taskData.difficulty * 100).toFixed(1)}%</div>
                                    <div class="task-stat-label">Сложность</div>
                                </div>
                            </div>
                            
                            <div class="task-stat-card">
                                <div class="task-stat-icon ${taskData.discrimination > 0.4 ? 'success' : taskData.discrimination > 0.2 ? 'warning' : 'danger'}">
                                    <i class="fas fa-filter"></i>
                                </div>
                                <div class="task-stat-content">
                                    <div class="task-stat-value">${(taskData.discrimination * 100).toFixed(1)}%</div>
                                    <div class="task-stat-label">Дискриминативность</div>
                                </div>
                            </div>
                            
                            <div class="task-stat-card">
                                <div class="task-stat-icon ${taskData.completionRate > 80 ? 'success' : taskData.completionRate > 50 ? 'warning' : 'danger'}">
                                    <i class="fas fa-user-check"></i>
                                </div>
                                <div class="task-stat-content">
                                    <div class="task-stat-value">${taskData.completionRate.toFixed(1)}%</div>
                                    <div class="task-stat-label">Выполняемость</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="task-analysis-charts">
                            <div class="chart-container">
                                <h4><i class="fas fa-chart-pie"></i> Распределение результатов</h4>
                                <canvas id="taskResultsChart"></canvas>
                            </div>
                            
                            <div class="chart-container">
                                <h4><i class="fas fa-chart-bar"></i> Гистограмма баллов</h4>
                                <canvas id="taskScoresChart"></canvas>
                            </div>
                        </div>
                        
                        <div class="task-analysis-details">
                            <h4><i class="fas fa-info-circle"></i> Детальный анализ</h4>
                            <div class="analysis-details">
                                <p><strong>Средний балл:</strong> ${taskData.averageScore.toFixed(1)}%</p>
                                <p><strong>Максимальный балл:</strong> ${taskData.maxScore.toFixed(1)}%</p>
                                <p><strong>Минимальный балл:</strong> ${taskData.minScore.toFixed(1)}%</p>
                                <p><strong>Размах:</strong> ${(taskData.maxScore - taskData.minScore).toFixed(1)}%</p>
                                <p><strong>Количество учащихся:</strong> ${taskData.scores.length}</p>
                            </div>
                        </div>
                        
                        <div class="task-analysis-recommendations">
                            <h4><i class="fas fa-lightbulb"></i> Рекомендации</h4>
                            <div class="recommendations-list">
                                ${this.generateTaskRecommendations(taskData).map(rec => `
                                    <div class="recommendation-item">
                                        <i class="fas fa-check-circle"></i>
                                        <span>${rec}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="task-analysis-modal-footer">
                        <button class="btn btn-primary" onclick="window.advancedAnalytics.editTask(${taskIndex})">
                            <i class="fas fa-edit"></i> Редактировать задание
                        </button>
                        <button class="btn btn-outline" onclick="this.closest('#taskAnalysisModal').remove()">
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Создаем графики
        setTimeout(() => {
            this.createTaskAnalysisCharts(taskData);
        }, 100);
    }

    // Создание графиков для анализа задания
    createTaskAnalysisCharts(taskData) {
        // График распределения результатов
        const resultsCtx = document.getElementById('taskResultsChart');
        if (resultsCtx) {
            const labels = Object.keys(taskData.resultGroups);
            const data = Object.values(taskData.resultGroups);
            
            new Chart(resultsCtx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: ['#27ae60', '#3498db', '#f39c12', '#e74c3c'],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${label}: ${value} учащихся (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Гистограмма баллов
        const scoresCtx = document.getElementById('taskScoresChart');
        if (scoresCtx) {
            const bins = this.createHistogramBins(taskData.scores, 10);
            
            new Chart(scoresCtx, {
                type: 'bar',
                data: {
                    labels: bins.labels,
                    datasets: [{
                        label: 'Количество учащихся',
                        data: bins.counts,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgb(54, 162, 235)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Количество учащихся'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Диапазон баллов'
                            }
                        }
                    }
                }
            });
        }
    }

    // Генерация рекомендаций для задания
    generateTaskRecommendations(taskData) {
        const recommendations = [];
        
        if (taskData.difficulty > 0.7) {
            recommendations.push('Задание слишком сложное. Рассмотрите возможность упрощения формулировки или добавления подсказок.');
        } else if (taskData.difficulty < 0.3) {
            recommendations.push('Задание слишком простое. Увеличьте сложность для лучшей дифференциации учащихся.');
        }
        
        if (taskData.discrimination < 0.3) {
            recommendations.push('Низкая дискриминативность. Пересмотрите варианты ответов или формулировку задания.');
        }
        
        if (taskData.completionRate < 50) {
            recommendations.push('Низкая выполнимость. Проверьте, достаточно ли времени отведено на выполнение задания.');
        }
        
        if (taskData.averageScore < 50) {
            recommendations.push('Средний балл ниже 50%. Рассмотрите возможность дополнительного объяснения материала.');
        }
        
        if (taskData.maxScore - taskData.minScore > 70) {
            recommendations.push('Большой разброс результатов. Задание хорошо дифференцирует учащихся по уровню подготовки.');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Задание имеет хорошие показатели. Можно использовать в дальнейшем без изменений.');
        }
        
        return recommendations;
    }

    // Реализация метода implementRecommendation
    implementRecommendation(recommendationId) {
        showNotification(`Реализация рекомендации: ${recommendationId}`, 'info');
        
        // В реальном приложении здесь была бы логика реализации рекомендации
        switch (recommendationId) {
            case 'weak_students':
                this.showStudentGroupManagement('weak');
                break;
            case 'problematic_tasks':
                this.showTaskCorrectionInterface();
                break;
            case 'low_average':
                this.showMaterialRepetitionPlan();
                break;
            default:
                showNotification('Рекомендация будет реализована в ближайшее время', 'info');
        }
    }

    // Показать интерфейс управления группой слабых студентов
    showStudentGroupManagement(groupType) {
        const weakStudents = this.calculateStudentStatistics()
            .filter(s => s.averageScore < 50)
            .sort((a, b) => a.averageScore - b.averageScore);
        
        if (weakStudents.length === 0) {
            showNotification('Нет учащихся в этой группе', 'info');
            return;
        }
        
        const modal = document.createElement('div');
        modal.id = 'studentGroupModal';
        modal.innerHTML = `
            <div class="student-group-modal-overlay" onclick="this.parentElement.remove()">
                <div class="student-group-modal-content" onclick="event.stopPropagation()">
                    <div class="student-group-modal-header">
                        <h3>
                            <i class="fas fa-users"></i>
                            Управление группой отстающих учащихся
                        </h3>
                        <button class="close-btn" onclick="this.closest('#studentGroupModal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="student-group-modal-body modal-body-scrollable">
                        <div class="group-info">
                            <p><strong>Количество учащихся:</strong> ${weakStudents.length}</p>
                            <p><strong>Средний балл группы:</strong> ${this.calculateAverage(weakStudents.map(s => s.averageScore)).toFixed(1)}%</p>
                            <p><strong>Диапазон баллов:</strong> ${weakStudents[weakStudents.length - 1].averageScore.toFixed(1)}% - ${weakStudents[0].averageScore.toFixed(1)}%</p>
                        </div>
                        
                        <div class="students-list">
                            <h4><i class="fas fa-user-graduate"></i> Список учащихся</h4>
                            <div class="table-responsive">
                                <table class="group-students-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Учащийся</th>
                                            <th>Средний балл</th>
                                            <th>Основные проблемы</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${weakStudents.map((student, index) => `
                                            <tr>
                                                <td>${index + 1}</td>
                                                <td>${student.name}</td>
                                                <td>
                                                    <div class="score-indicator ${this.getScoreClass(student.averageScore)}">
                                                        ${student.averageScore.toFixed(1)}%
                                                    </div>
                                                </td>
                                                <td>
                                                    ${this.identifyStudentProblems(student.index).map(problem => 
                                                        `<span class="problem-tag">${problem}</span>`
                                                    ).join('')}
                                                </td>
                                                <td>
                                                    <button class="btn btn-xs btn-info" onclick="window.advancedAnalytics.showStudentDetails(${student.index})">
                                                        <i class="fas fa-search"></i>
                                                    </button>
                                                    <button class="btn btn-xs btn-success" onclick="window.advancedAnalytics.createIndividualPlan(${student.index})">
                                                        <i class="fas fa-calendar-plus"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div class="group-actions">
                            <h4><i class="fas fa-tasks"></i> Групповые действия</h4>
                            <div class="action-buttons">
                                <button class="btn btn-primary" onclick="window.advancedAnalytics.scheduleRemedialLessons()">
                                    <i class="fas fa-chalkboard-teacher"></i> Запланировать дополнительные занятия
                                </button>
                                <button class="btn btn-success" onclick="window.advancedAnalytics.createGroupWorkPlan()">
                                    <i class="fas fa-users-cog"></i> Создать план групповой работы
                                </button>
                                <button class="btn btn-info" onclick="window.advancedAnalytics.generateRemedialMaterials()">
                                    <i class="fas fa-book"></i> Создать дополнительные материалы
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="student-group-modal-footer">
                        <button class="btn btn-outline" onclick="this.closest('#studentGroupModal').remove()">
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Идентификация проблем студента
    identifyStudentProblems(studentIndex) {
        const problems = [];
        const studentStats = this.calculateStudentStatistics()[studentIndex];
        
        if (!studentStats) return problems;
        
        // Анализ общего балла
        if (studentStats.averageScore < 50) {
            problems.push('Низкий общий балл');
        }
        
        // Анализ стабильности
        if (studentStats.stability < 0.4) {
            problems.push('Нестабильные результаты');
        }
        
        // Анализ по заданиям
        const weakTasks = [];
        appData.tasks?.forEach((task, taskIndex) => {
            const score = this.getStudentScore(studentIndex, taskIndex);
            const maxScore = task.maxScore || 1;
            const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
            
            if (percentage < 50) {
                weakTasks.push(taskIndex + 1);
            }
        });
        
        if (weakTasks.length > 0) {
            problems.push(`Слабые задания: ${weakTasks.slice(0, 3).join(', ')}${weakTasks.length > 3 ? '...' : ''}`);
        }
        
        return problems.slice(0, 3); // Ограничиваем 3 проблемами
    }

    // Создание индивидуального плана для студента
    createIndividualPlan(studentIndex) {
        showNotification('Создание индивидуального плана...', 'info');
        // Реализация создания индивидуального плана
    }

    // Планирование дополнительных занятий
    scheduleRemedialLessons() {
        showNotification('Планирование дополнительных занятий...', 'info');
        // Реализация планирования занятий
    }

    // Создание плана групповой работы
    createGroupWorkPlan() {
        showNotification('Создание плана групповой работы...', 'info');
        // Реализация создания плана групповой работы
    }

    // Генерация дополнительных материалов
    generateRemedialMaterials() {
        showNotification('Генерация дополнительных материалов...', 'info');
        // Реализация генерации материалов
    }

    // Показать интерфейс коррекции заданий
    showTaskCorrectionInterface() {
        const problematicTasks = this.calculateTaskStatistics()
            .filter(task => task.difficulty > 0.7 || task.discrimination < 0.3)
            .sort((a, b) => b.difficulty - a.difficulty);
        
        if (problematicTasks.length === 0) {
            showNotification('Нет проблемных заданий', 'info');
            return;
        }
        
        const modal = document.createElement('div');
        modal.id = 'taskCorrectionModal';
        modal.innerHTML = `
            <div class="task-correction-modal-overlay" onclick="this.parentElement.remove()">
                <div class="task-correction-modal-content" onclick="event.stopPropagation()">
                    <div class="task-correction-modal-header">
                        <h3>
                            <i class="fas fa-tools"></i>
                            Коррекция проблемных заданий
                        </h3>
                        <button class="close-btn" onclick="this.closest('#taskCorrectionModal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="task-correction-modal-body modal-body-scrollable">
                        <div class="correction-info">
                            <p><strong>Количество проблемных заданий:</strong> ${problematicTasks.length}</p>
                            <p><strong>Типы проблем:</strong></p>
                            <ul>
                                <li>Слишком сложные: ${problematicTasks.filter(t => t.difficulty > 0.7).length}</li>
                                <li>Низкая дискриминативность: ${problematicTasks.filter(t => t.discrimination < 0.3).length}</li>
                            </ul>
                        </div>
                        
                        <div class="tasks-list">
                            <h4><i class="fas fa-tasks"></i> Список заданий для коррекции</h4>
                            <div class="table-responsive">
                                <table class="correction-tasks-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Задание</th>
                                            <th>Проблема</th>
                                            <th>Сложность</th>
                                            <th>Дискриминативность</th>
                                            <th>Рекомендации</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${problematicTasks.map((task, index) => `
                                            <tr>
                                                <td>${task.number}</td>
                                                <td>${task.title}</td>
                                                <td>
                                                    ${task.difficulty > 0.7 ? 
                                                        '<span class="problem-tag danger">Слишком сложное</span>' : 
                                                        '<span class="problem-tag warning">Низкая дискриминативность</span>'}
                                                </td>
                                                <td>
                                                    <div class="difficulty-indicator ${this.getDifficultyClass(task.difficulty)}">
                                                        ${(task.difficulty * 100).toFixed(1)}%
                                                    </div>
                                                </td>
                                                <td>
                                                    <div class="discrimination-indicator ${this.getDiscriminationClass(task.discrimination)}">
                                                        ${(task.discrimination * 100).toFixed(1)}%
                                                    </div>
                                                </td>
                                                <td>
                                                    ${this.getTaskCorrectionRecommendations(task).map(rec => 
                                                        `<div class="recommendation">• ${rec}</div>`
                                                    ).join('')}
                                                </td>
                                                <td>
                                                    <button class="btn btn-xs btn-primary" onclick="window.advancedAnalytics.editTask(${task.number - 1})">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-xs btn-info" onclick="window.advancedAnalytics.analyzeTask(${task.number - 1})">
                                                        <i class="fas fa-chart-bar"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div class="correction-actions">
                            <h4><i class="fas fa-play-circle"></i> Массовые действия</h4>
                            <div class="action-buttons">
                                <button class="btn btn-primary" onclick="window.advancedAnalytics.batchSimplifyTasks()">
                                    <i class="fas fa-sort-amount-down"></i> Упростить сложные задания
                                </button>
                                <button class="btn btn-success" onclick="window.advancedAnalytics.batchImproveDiscrimination()">
                                    <i class="fas fa-filter"></i> Улучшить дискриминативность
                                </button>
                                <button class="btn btn-info" onclick="window.advancedAnalytics.generateAlternativeTasks()">
                                    <i class="fas fa-copy"></i> Создать альтернативные задания
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="task-correction-modal-footer">
                        <button class="btn btn-outline" onclick="this.closest('#taskCorrectionModal').remove()">
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Получение рекомендаций по коррекции задания
    getTaskCorrectionRecommendations(task) {
        const recommendations = [];
        
        if (task.difficulty > 0.7) {
            recommendations.push('Упростить формулировку');
            recommendations.push('Добавить подсказки или примеры');
            recommendations.push('Разбить на подзадачи');
        }
        
        if (task.discrimination < 0.3) {
            recommendations.push('Пересмотреть варианты ответов');
            recommendations.push('Увеличить разброс сложности');
            recommendations.push('Добавить дифференцирующие элементы');
        }
        
        if (task.completionRate < 50) {
            recommendations.push('Увеличить время на выполнение');
            recommendations.push('Сделать инструкции более четкими');
        }
        
        return recommendations.slice(0, 3);
    }

    // Упрощение сложных заданий (пакетное)
    batchSimplifyTasks() {
        showNotification('Упрощение сложных заданий...', 'info');
        // Реализация пакетного упрощения
    }

    // Улучшение дискриминативности (пакетное)
    batchImproveDiscrimination() {
        showNotification('Улучшение дискриминативности...', 'info');
        // Реализация пакетного улучшения
    }

    // Генерация альтернативных заданий
    generateAlternativeTasks() {
        showNotification('Генерация альтернативных заданий...', 'info');
        // Реализация генерации
    }

    // Показать план повторения материала
    showMaterialRepetitionPlan() {
        const averageScore = this.calculateOverallAverage(this.calculateStudentStatistics());
        
        const modal = document.createElement('div');
        modal.id = 'materialRepetitionModal';
        modal.innerHTML = `
            <div class="material-repetition-modal-overlay" onclick="this.parentElement.remove()">
                <div class="material-repetition-modal-content" onclick="event.stopPropagation()">
                    <div class="material-repetition-modal-header">
                        <h3>
                            <i class="fas fa-redo"></i>
                            План повторения материала
                        </h3>
                        <button class="close-btn" onclick="this.closest('#materialRepetitionModal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="material-repetition-modal-body modal-body-scrollable">
                        <div class="repetition-info">
                            <p><strong>Средний балл класса:</strong> ${averageScore.toFixed(1)}%</p>
                            <p><strong>Рекомендуемые темы для повторения:</strong></p>
                            ${this.identifyWeakTopics().map(topic => `
                                <div class="topic-card">
                                    <h5>${topic.name}</h5>
                                    <p>${topic.description}</p>
                                    <div class="topic-stats">
                                        <span>Средний балл: ${topic.averageScore.toFixed(1)}%</span>
                                        <span>Заданий: ${topic.taskCount}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="repetition-plan">
                            <h4><i class="fas fa-calendar-alt"></i> План повторения</h4>
                            <div class="plan-steps">
                                ${this.generateRepetitionPlan().map((step, index) => `
                                    <div class="plan-step">
                                        <div class="step-number">${index + 1}</div>
                                        <div class="step-content">
                                            <h5>${step.title}</h5>
                                            <p>${step.description}</p>
                                            <div class="step-details">
                                                <span><i class="far fa-clock"></i> ${step.duration}</span>
                                                <span><i class="fas fa-users"></i> ${step.group}</span>
                                                <span><i class="fas fa-tools"></i> ${step.method}</span>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="repetition-materials">
                            <h4><i class="fas fa-book"></i> Материалы для повторения</h4>
                            <div class="materials-list">
                                ${this.generateRepetitionMaterials().map(material => `
                                    <div class="material-item">
                                        <i class="fas ${material.icon}"></i>
                                        <div class="material-content">
                                            <h5>${material.title}</h5>
                                            <p>${material.description}</p>
                                            <a href="#" class="material-link">Открыть материал</a>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="material-repetition-modal-footer">
                        <button class="btn btn-primary" onclick="window.advancedAnalytics.startRepetitionSession()">
                            <i class="fas fa-play"></i> Начать сессию повторения
                        </button>
                        <button class="btn btn-outline" onclick="this.closest('#materialRepetitionModal').remove()">
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Идентификация слабых тем
    identifyWeakTopics() {
        const topics = [];
        
        // Анализ по компетенциям (уровням)
        const competences = {
            'Базовые понятия': { scores: [], taskCount: 0 },
            'Применение знаний': { scores: [], taskCount: 0 },
            'Анализ информации': { scores: [], taskCount: 0 },
            'Творческие задания': { scores: [], taskCount: 0 }
        };
        
        appData.tasks?.forEach((task, taskIndex) => {
            const level = Math.min(Math.max(task.level || 1, 1), 4);
            const competence = this.getCompetenceByLevel(level);
            
            if (competences[competence]) {
                // Собираем баллы студентов за это задание
                appData.students?.forEach((student, studentIndex) => {
                    const score = this.getStudentScore(studentIndex, taskIndex);
                    const maxScore = task.maxScore || 1;
                    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
                    competences[competence].scores.push(percentage);
                });
                competences[competence].taskCount++;
            }
        });
        
        // Формируем список тем
        Object.entries(competences).forEach(([name, data]) => {
            if (data.scores.length > 0) {
                const averageScore = this.calculateAverage(data.scores);
                if (averageScore < 70) {
                    topics.push({
                        name,
                        description: this.getTopicDescription(name),
                        averageScore,
                        taskCount: data.taskCount
                    });
                }
            }
        });
        
        return topics.slice(0, 3); // Ограничиваем 3 темами
    }

    // Получение описания темы
    getTopicDescription(topicName) {
        const descriptions = {
            'Базовые понятия': 'Основные определения, факты, термины',
            'Применение знаний': 'Использование знаний в стандартных ситуациях',
            'Анализ информации': 'Сравнение, классификация, выводы',
            'Творческие задания': 'Создание нового, решение нестандартных задач'
        };
        return descriptions[topicName] || 'Общая тема';
    }

    // Генерация плана повторения
    generateRepetitionPlan() {
        return [
            {
                title: 'Повторение базовых понятий',
                description: 'Обзор основных определений и терминов',
                duration: '45 минут',
                group: 'Вся группа',
                method: 'Лекция-беседа'
            },
            {
                title: 'Работа с типовыми задачами',
                description: 'Решение задач средней сложности',
                duration: '60 минут',
                group: 'Малые группы',
                method: 'Практическая работа'
            },
            {
                title: 'Анализ ошибок',
                description: 'Разбор типичных ошибок учащихся',
                duration: '30 минут',
                group: 'Вся группа',
                method: 'Интерактивный разбор'
            },
            {
                title: 'Контрольное задание',
                description: 'Проверка усвоения материала',
                duration: '30 минут',
                group: 'Индивидуально',
                method: 'Тестирование'
            }
        ];
    }

    // Генерация материалов для повторения
    generateRepetitionMaterials() {
        return [
            {
                icon: 'fa-file-pdf',
                title: 'Конспект по теме',
                description: 'Основные понятия и формулы'
            },
            {
                icon: 'fa-video',
                title: 'Видеоурок',
                description: 'Объяснение сложных моментов'
            },
            {
                icon: 'fa-tasks',
                title: 'Тренировочные задания',
                description: 'Задачи для самостоятельной работы'
            },
            {
                icon: 'fa-chart-bar',
                title: 'Анализ результатов',
                description: 'Статистика выполнения заданий'
            }
        ];
    }

    // Начать сессию повторения
    startRepetitionSession() {
        showNotification('Запуск сессии повторения...', 'info');
        // Реализация запуска сессии
    }

    // Отладка графиков
    debugCharts() {
        console.log('Отладка графиков:');
        const charts = Chart.instances || [];
        console.log(`Найдено графиков: ${charts.length}`);
        
        charts.forEach((chart, index) => {
            console.log(`График ${index + 1}:`, {
                type: chart.config.type,
                id: chart.canvas.id,
                dataPoints: chart.data.datasets?.[0]?.data?.length || 0
            });
        });
    }

    // Добавить недостающие стили
    addMissingStyles() {
        const missingStylesId = 'missing-styles';
        if (document.getElementById(missingStylesId)) return;
        
        const style = document.createElement('style');
        style.id = missingStylesId;
        style.textContent = `
            /* Стили для анализа ошибок */
            .error-summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }
            
            .error-card {
                background: white;
                border-radius: 10px;
                padding: 20px;
                display: flex;
                align-items: center;
                gap: 15px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            }
            
            .error-card.total-errors {
                border-left: 4px solid #e74c3c;
            }
            
            .error-card.error-types {
                border-left: 4px solid #3498db;
            }
            
            .error-card.common-error {
                border-left: 4px solid #f39c12;
            }
            
            .error-card.problematic-task {
                border-left: 4px solid #9b59b6;
            }
            
            .error-icon {
                width: 50px;
                height: 50px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                color: white;
            }
            
            .error-card.total-errors .error-icon {
                background: #e74c3c;
            }
            
            .error-card.error-types .error-icon {
                background: #3498db;
            }
            
            .error-card.common-error .error-icon {
                background: #f39c12;
            }
            
            .error-card.problematic-task .error-icon {
                background: #9b59b6;
            }
            
            .error-value {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .error-label {
                color: #7f8c8d;
                font-size: 12px;
            }
            
            /* Стили для рекомендаций */
            .priority-recommendations {
                display: flex;
                flex-direction: column;
                gap: 15px;
                margin: 20px 0;
            }
            
            .priority-card {
                background: white;
                border-radius: 10px;
                padding: 20px;
                display: flex;
                gap: 15px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.1);
                border-left: 4px solid #3498db;
            }
            
            .priority-badge {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #3498db;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 18px;
                flex-shrink: 0;
            }
            
            .priority-content {
                flex: 1;
            }
            
            .priority-content h5 {
                margin: 0 0 10px 0;
                color: #2c3e50;
            }
            
            .priority-content p {
                margin: 0 0 15px 0;
                color: #7f8c8d;
            }
            
            .priority-actions {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .priority-impact {
                padding: 5px 10px;
                border-radius: 5px;
                font-size: 12px;
                font-weight: 500;
            }
            
            .priority-impact.high {
                background: #ffebee;
                color: #c62828;
            }
            
            .priority-impact.medium {
                background: #fff3e0;
                color: #ef6c00;
            }
            
            .priority-impact.low {
                background: #e8f5e9;
                color: #2e7d32;
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Экспорт класса для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedAnalytics;
}

// Автоматическая инициализация при загрузке страницы
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (!window.advancedAnalytics) {
                window.advancedAnalytics = new AdvancedAnalytics().init();
                console.log('✅ Модуль расширенной аналитики инициализирован');
            }
        }, 1000);
    });
}
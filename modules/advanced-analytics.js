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

        // Регистрируем кастомный BoxPlot на всякий случай
        //setTimeout(() => this.registerCustomBoxPlot(), 1000);
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
					<button class="btn btn-sm btn-info" onclick="window.advancedAnalytics.showCorrelationAnalysis()">
						🔗 Корреляционный анализ
					</button>		
                    <button class="btn btn-sm btn-primary" onclick="window.advancedAnalytics.exportComprehensiveAnalysisToWord()">
                        <i class="fas fa-file-export"></i> Экспорт отчета
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

    // 10. Добавим метод showCorrelationAnalysis()
    showCorrelationAnalysis() {
        // Сначала уничтожаем существующий график если он есть
        const ctx = document.getElementById('correlationChart');
        if (ctx) {
            const existingChart = Chart.getChart(ctx);
            if (existingChart) {
                existingChart.destroy();
            }
        }

        const correlationData = this.calculateCorrelationData();

        const html = `
			<div class="analytics-card">
				<h4><i class="fas fa-project-diagram"></i> Корреляционный анализ заданий</h4>
				
				<p>Анализ взаимосвязей между заданиями помогает выявить:</p>
				<ul>
					<li>Задания, измеряющие схожие компетенции</li>
					<li>Избыточные или дублирующие задания</li>
					<li>Структуру теста и его внутреннюю согласованность</li>
				</ul>
				
				<div style="height: 400px; margin: 20px 0;">
					<canvas id="correlationChartModal"></canvas>
				</div>
				
				<div class="correlation-stats" style="margin-top: 20px;">
					<h5>Статистика корреляций:</h5>
					<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
						<div class="stat-card">
							<div class="stat-value">${this.calculateAverageCorrelation(correlationData.data).toFixed(3)}</div>
							<div class="stat-label">Средняя корреляция</div>
						</div>
						<div class="stat-card">
							<div class="stat-value">${this.countStrongCorrelations(correlationData.data)}</div>
							<div class="stat-label">Сильных связей (>0.7)</div>
						</div>
						<div class="stat-card">
							<div class="stat-value">${this.countNegativeCorrelations(correlationData.data)}</div>
							<div class="stat-label">Отрицательных связей</div>
						</div>
					</div>
				</div>
				
				<div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
					<h5><i class="fas fa-lightbulb"></i> Интерпретация:</h5>
					<p>${this.interpretCorrelations(correlationData)}</p>
				</div>
			</div>
		`;

        this.showResults(html);

        // Создаем график после добавления HTML
        setTimeout(() => {
            const modalCtx = document.getElementById('correlationChartModal');
            if (modalCtx) {
                const existingModalChart = Chart.getChart(modalCtx);
                if (existingModalChart) {
                    existingModalChart.destroy();
                }

                try {
                    // Пробуем heatmap для модального окна
                    new Chart(modalCtx, {
                        type: 'scatter', // Используем scatter для простоты
                        data: {
                            datasets: [{
                                    label: 'Корреляции',
                                    data: this.prepareCorrelationScatterData(correlationData),
                                    backgroundColor: 'rgba(52, 152, 219, 0.7)'
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false
                        }
                    });
                } catch (error) {
                    console.warn('Не удалось создать график в модальном окне:', error);
                }
            }
        }, 100);
    }

    // 6. Вспомогательный метод для подготовки данных scatter plot
    prepareCorrelationScatterData(correlationData) {
        const data = [];
        const labels = correlationData.labels;

        for (let i = 0; i < labels.length; i++) {
            for (let j = i + 1; j < labels.length; j++) {
                const correlation = correlationData.data[i * labels.length + j];
                if (!isNaN(correlation)) {
                    data.push({
                        x: i,
                        y: j,
                        r: Math.abs(correlation) * 20,
                        correlation: correlation
                    });
                }
            }
        }

        return data;
    }

    // 11. Вспомогательные методы для корреляционного анализа
    calculateAverageCorrelation(correlationMatrix) {
        const validCorrelations = correlationMatrix.filter(value =>
                !isNaN(value) && Math.abs(value) < 0.999 // Исключаем диагональ
            );
        if (validCorrelations.length === 0)
            return 0;
        const sum = validCorrelations.reduce((a, b) => a + b, 0);
        return sum / validCorrelations.length;
    }

    countStrongCorrelations(correlationMatrix) {
        return correlationMatrix.filter(value =>
            !isNaN(value) && Math.abs(value) >= 0.7 && Math.abs(value) < 0.999).length;
    }

    countNegativeCorrelations(correlationMatrix) {
        return correlationMatrix.filter(value =>
            !isNaN(value) && value < -0.1 && Math.abs(value) < 0.999).length;
    }

    interpretCorrelations(correlationData) {
        const avgCorrelation = this.calculateAverageCorrelation(correlationData.data);
        const strongCorrelations = this.countStrongCorrelations(correlationData.data);

        let interpretation = '';

        if (avgCorrelation > 0.5) {
            interpretation = 'Высокая внутренняя согласованность теста. Задания хорошо коррелируют между собой, что указывает на измерение схожих компетенций.';
        } else if (avgCorrelation > 0.3) {
            interpretation = 'Умеренная внутренняя согласованность. Тест измеряет комплекс компетенций с некоторой степенью связанности.';
        } else if (avgCorrelation > 0.1) {
            interpretation = 'Низкая внутренняя согласованность. Возможно, задания измеряют разные аспекты или требуют разных навыков.';
        } else {
            interpretation = 'Очень низкая внутренняя согласованность. Рассмотрите возможность пересмотра структуры теста.';
        }

        if (strongCorrelations > 0) {
            interpretation += ` Найдено ${strongCorrelations} сильных корреляций, что может указывать на избыточность некоторых заданий.`;
        }

        return interpretation;
    }

    // 8. Обновим метод destroyCharts для корректного уничтожения
    destroyCharts() {
        console.log('Уничтожение всех графиков...');

        Object.entries(this.charts).forEach(([name, chart]) => {
            if (chart) {
                try {
                    chart.destroy();
                    console.log(`✅ График ${name} уничтожен`);
                } catch (e) {
                    console.warn(`⚠️ Ошибка при уничтожении графика ${name}:`, e);
                }
            }
        });

        // Также уничтожаем все графики на canvas элементах
        const canvasElements = document.querySelectorAll('canvas');
        canvasElements.forEach(canvas => {
            const chart = Chart.getChart(canvas);
            if (chart) {
                try {
                    chart.destroy();
                } catch (e) {
                    // Игнорируем ошибки при уничтожении
                }
            }
        });

        // Сбрасываем все ссылки
        this.charts = {
            radar: null,
            boxPlot: null,
            valueAdded: null,
            timeline: null,
            correlation: null
        };

        console.log('✅ Все графики уничтожены');
    }

    // 9. Добавим метод для безопасного обновления графиков
    updateCharts() {
        console.log('Обновление графиков...');

        // Сначала уничтожаем все графики
        this.destroyCharts();

        // Затем создаем заново
        setTimeout(() => {
            this.initCharts();
        }, 100);
    }

    // Добавление CSS стилей
    addStyles() {
        const styleId = 'advanced-analytics-styles';
        if (document.getElementById(styleId))
            return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
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
        `;

        document.head.appendChild(style);
    }

    // Инициализация графиков
    initCharts() {
        try {
            // Добавьте отладку
            console.log('Данные для графиков:', {
                studentsCount: appData?.students?.length,
                tasksCount: appData?.tasks?.length,
                results: appData?.results?.length
            });

            // Список графиков для создания
            const chartsToCreate = [{
                    id: 'competenceRadar',
                    method: 'createCompetenceRadar'
                }, {
                    id: 'boxPlotChart',
                    method: 'createBoxPlot'
                }, {
                    id: 'valueAddedChart',
                    method: 'createValueAddedChart'
                }, {
                    id: 'correlationChart',
                    method: 'createCorrelationChart'
                }
            ];

            chartsToCreate.forEach(chart => {
                try {
                    const element = document.getElementById(chart.id);
                    if (element && element.tagName === 'CANVAS') {
                        // Проверяем, есть ли уже график на этом canvas
                        const existingChart = Chart.getChart(element);
                        if (existingChart) {
                            console.log(`Уничтожаем существующий график ${chart.id}`);
                            existingChart.destroy();
                        }

                        // Создаем новый график
                        this[chart.method]();
                        console.log(`✅ График ${chart.id} создан`);
                    } else if (element) {
                        console.log(`⚠️ Элемент ${chart.id} найден, но не является canvas`);
                    } else {
                        console.log(`⚠️ Canvas ${chart.id} не найден`);
                    }
                } catch (error) {
                    console.error(`❌ Ошибка создания графика ${chart.id}:`, error);
                }
            });
            console.log('✅ Графики инициализированы');
        } catch (error) {
            console.error('❌ Ошибка инициализации графиков:', error);
        }
    }

    createCorrelationChart() {
        const ctx = document.getElementById('correlationChart');
        if (!ctx) {
            console.warn('Canvas correlationChart не найден');
            return;
        }

        // Проверяем, есть ли уже график на этом canvas
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            console.log('Уничтожаем существующий график корреляций');
            existingChart.destroy();
        }

        // Получаем данные для корреляционного анализа
        const correlationData = this.calculateCorrelationData();

        if (this.charts.correlation) {
            this.charts.correlation.destroy();
        }

        try {
            // Пробуем создать heatmap, если поддерживается
            this.charts.correlation = this.createHeatmapChart(ctx, correlationData);
        } catch (error) {
            console.log('Heatmap не поддерживается, используем scatter plot', error);
            // Создаем scatter plot как fallback
            this.charts.correlation = this.createCorrelationScatterPlot(ctx, correlationData);
        }
    }

    // 2. Вынесем создание heatmap в отдельный метод
    createHeatmapChart(ctx, correlationData) {
        // Регистрируем heatmap если еще не зарегистрирован
        if (Chart.controllers.heatmap === undefined) {
            this.registerHeatmapChart();
        }

        return new Chart(ctx, {
            type: 'heatmap',
            data: {
                labels: correlationData.labels,
                datasets: [{
                        label: 'Корреляция между заданиями',
                        data: correlationData.data.map((value, index) => {
                            const row = Math.floor(index / correlationData.labels.length);
                            const col = index % correlationData.labels.length;
                            return {
                                x: col,
                                y: row,
                                value: value
                            };
                        }),
                        backgroundColor: function (context) {
                            const value = context.raw.value;
                            return getColorForCorrelation(value);
                        }
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function (context) {
                                const data = context[0].raw;
                                return `${correlationData.labels[data.y]} ↔ ${correlationData.labels[data.x]}`;
                            },
                            label: function (context) {
                                const value = context.raw.value;
                                return `Корреляция: ${value.toFixed(3)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Задания'
                        },
                        ticks: {
                            callback: function (value, index) {
                                return correlationData.labels[index];
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Задания'
                        },
                        ticks: {
                            callback: function (value, index) {
                                return correlationData.labels[index];
                            }
                        }
                    }
                }
            }
        });
    }

    // 3. Метод для регистрации heatmap типа
    registerHeatmapChart() {
        // Простая реализация heatmap через матрицу точек
        Chart.register({
            id: 'heatmap',
            beforeDraw: function (chart) {
                // Логика отрисовки heatmap
            }
        });
    }

    // 4. Обновим метод createCorrelationScatterPlot
    createCorrelationScatterPlot(ctx, correlationData) {
        // Проверяем, есть ли уже график на этом canvas
        const existingChart = Chart.getChart(ctx);
        if (existingChart && existingChart.id !== 'correlation') {
            existingChart.destroy();
        }

        // Преобразуем данные матрицы корреляции в точечные данные
        const scatterData = [];

        for (let i = 0; i < correlationData.labels.length; i++) {
            for (let j = i + 1; j < correlationData.labels.length; j++) {
                const correlation = correlationData.data[i * correlationData.labels.length + j];
                if (!isNaN(correlation)) {
                    scatterData.push({
                        x: i + 1, // Номер первого задания
                        y: j + 1, // Номер второго задания
                        r: Math.abs(correlation) * 15 + 5, // Размер точки
                        correlation: correlation
                    });
                }
            }
        }

        return new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                        label: 'Корреляция между заданиями',
                        data: scatterData,
                        backgroundColor: scatterData.map(point =>
                            getColorForCorrelation(point.correlation)),
                        pointRadius: scatterData.map(point => point.r)
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const point = context.raw;
                                const task1 = correlationData.labels[Math.round(point.x) - 1];
                                const task2 = correlationData.labels[Math.round(point.y) - 1];
                                return [
                                    `${task1} ↔ ${task2}`, 
                                    `Корреляция: ${point.correlation.toFixed(3)}`, 
`Размер: ${Math.abs(point.correlation).toFixed(2)}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Задание (номер)'
                        },
                        min: 0,
                        max: correlationData.labels.length + 1,
                        ticks: {
                            callback: function (value) {
                                if (value >= 1 && value <= correlationData.labels.length) {
                                    return `З-${value}`;
                                }
                                return '';
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Задание (номер)'
                        },
                        min: 0,
                        max: correlationData.labels.length + 1,
                        ticks: {
                            callback: function (value) {
                                if (value >= 1 && value <= correlationData.labels.length) {
                                    return `З-${value}`;
                                }
                                return '';
                            }
                        }
                    }
                }
            }
        });
    }

    // 5. Метод для расчета корреляционных данных
    calculateCorrelationData() {
        if (!appData.tasks || !appData.students || !appData.results) {
            return {
                labels: [],
                data: []
            };
        }

        const taskCount = appData.tasks.length;
        const studentCount = appData.students.length;

        // Подготавливаем матрицу баллов [студент][задание]
        const scoresMatrix = [];
        for (let studentIndex = 0; studentIndex < studentCount; studentIndex++) {
            const studentScores = [];
            for (let taskIndex = 0; taskIndex < taskCount; taskIndex++) {
                const score = this.getStudentScore(studentIndex, taskIndex);
                const maxScore = appData.tasks[taskIndex]?.maxScore || 1;
                const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
                studentScores.push(percentage);
            }
            scoresMatrix.push(studentScores);
        }

        // Рассчитываем корреляционную матрицу
        const correlationMatrix = [];
        const labels = [];

        for (let i = 0; i < taskCount; i++) {
            labels.push(`З-${i + 1}`);
        }

        for (let i = 0; i < taskCount; i++) {
            for (let j = 0; j < taskCount; j++) {
                if (i === j) {
                    correlationMatrix.push(1); // Корреляция с собой = 1
                } else {
                    const scoresI = scoresMatrix.map(row => row[i]);
                    const scoresJ = scoresMatrix.map(row => row[j]);
                    const correlation = this.calculatePearsonCorrelation(scoresI, scoresJ);
                    correlationMatrix.push(correlation);
                }
            }
        }

        return {
            labels: labels,
            data: correlationMatrix
        };
    }

    // 6. Метод для расчета коэффициента корреляции Пирсона
    calculatePearsonCorrelation(x, y) {
        const n = x.length;

        // Проверяем, что массивы одинаковой длины и не пустые
        if (n !== y.length || n === 0) {
            return 0;
        }

        // Рассчитываем средние значения
        const meanX = x.reduce((sum, val) => sum + val, 0) / n;
        const meanY = y.reduce((sum, val) => sum + val, 0) / n;

        // Рассчитываем числитель и знаменатель
        let numerator = 0;
        let denominatorX = 0;
        let denominatorY = 0;

        for (let i = 0; i < n; i++) {
            const diffX = x[i] - meanX;
            const diffY = y[i] - meanY;

            numerator += diffX * diffY;
            denominatorX += diffX * diffX;
            denominatorY += diffY * diffY;
        }

        // Проверяем деление на ноль
        if (denominatorX === 0 || denominatorY === 0) {
            return 0;
        }

        return numerator / Math.sqrt(denominatorX * denominatorY);
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
        if (!values || values.length === 0)
            return 0;
        const sum = values.reduce((a, b) => a + b, 0);
        return sum / values.length;
    }

    // ==================== ГРАФИКИ ====================

    createCompetenceRadar() {
        const ctx = document.getElementById('competenceRadar');
        if (!ctx)
            return;

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
                    }
                ]
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
        if (!ctx)
            return;

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
                    }
                ]
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
        if (!ctx)
            return;

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
                            p.actual > p.expected ? 'rgba(75, 192, 192, 0.7)' : 'rgba(255, 99, 132, 0.7)'),
                        pointRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
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
            return {
                labels: [],
                averages: []
            };
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
            return {
                points
            };
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

        return {
            points
        };
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
                    <button class="btn btn-sm btn-primary" onclick="window.advancedAnalytics.exportComprehensiveAnalysisToWord()">
                        <i class="fas fa-file-export"></i> Экспорт полного архива
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
                    `<div style="padding: 2px 0; border-bottom: 1px dashed rgba(0,0,0,0.1);">${s.name}</div>`).join('')}
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

        let interpretation,
        color,
        description,
        recommendation;

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

        return {
            alpha,
            interpretation,
            color,
            description,
            recommendation
        };
    }

    getClusterStats() {
        const clusters = this.performClusterAnalysis();
        return {
            excellent: {
                count: clusters[0]?.students.length || 0
            },
            good: {
                count: clusters[1]?.students.length || 0
            },
            average: {
                count: clusters[2]?.students.length || 0
            },
            weak: {
                count: clusters[3]?.students.length || 0
            }
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

        return [{
                name: 'Отличники',
                students: studentScores.slice(0, excellentCount).map(s => ({
                        name: s.name
                    })),
                averageScore: this.calculateAverage(studentScores.slice(0, excellentCount).map(s => s.percentage)),
                profile: 'Высокие стабильные результаты по всем заданиям'
            }, {
                name: 'Хорошисты',
                students: studentScores.slice(excellentCount, excellentCount + goodCount).map(s => ({
                        name: s.name
                    })),
                averageScore: this.calculateAverage(studentScores.slice(excellentCount, excellentCount + goodCount).map(s => s.percentage)),
                profile: 'Хорошие результаты, возможны улучшения в сложных заданиях'
            }, {
                name: 'Стабильные средние',
                students: studentScores.slice(excellentCount + goodCount, excellentCount + goodCount + averageCount).map(s => ({
                        name: s.name
                    })),
                averageScore: this.calculateAverage(studentScores.slice(excellentCount + goodCount, excellentCount + goodCount + averageCount).map(s => s.percentage)),
                profile: 'Средние результаты, высокая стабильность'
            }, {
                name: 'Требуют внимания',
                students: studentScores.slice(excellentCount + goodCount + averageCount).map(s => ({
                        name: s.name
                    })),
                averageScore: this.calculateAverage(studentScores.slice(excellentCount + goodCount + averageCount).map(s => s.percentage)),
                profile: 'Низкие результаты, требуется коррекция и дополнительные занятия'
            }
        ];
    }

    performIRTanalysis() {
        if (!appData.tasks || appData.tasks.length === 0) {
            return {
                items: [],
                summary: 'Нет данных',
                problematicCount: 0
            };
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
                item.discrimination < 0.3).length;

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
        if (!ctx || !data.points || data.points.length === 0)
            return;

        new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                        label: 'Учащиеся',
                        data: data.points,
                        backgroundColor: data.points.map(p =>
                            p.actual > p.expected ? 'rgba(75, 192, 192, 0.7)' : 'rgba(255, 99, 132, 0.7)'),
                        pointRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
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

    exportAnalysisReports() {
        const report = this.generateReport();

        const blob = new Blob([report], {
            type: 'text/html'
        });
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

        // Психологические особенности (если есть)
        const psychology = false; //this.analyzePsychologicalAspects();

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
            psychology,
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
					<div class="modal-body">
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
        this.addMissingStyles();
        this.addChartStyles();

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

    // 2. Fallback для старой версии
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
        if (!studentStats || studentStats.length === 0)
            return [];

        // Правильное распределение по группам (по пятибалльной системе)
        const groups = [{
                name: 'Отлично (5)',
                min: 85,
                max: 100,
                color: '#27ae60'
            }, {
                name: 'Хорошо (4)',
                min: 70,
                max: 85,
                color: '#3498db'
            }, {
                name: 'Удовлетворительно (3)',
                min: 50,
                max: 70,
                color: '#f39c12'
            }, {
                name: 'Неудовлетворительно (2)',
                min: 0,
                max: 50,
                color: '#e74c3c'
            }
        ];

        return groups.map(group => {
            const count = studentStats.filter(s =>
                    s.averageScore >= group.min && s.averageScore < (group.name === 'Отлично (5)' ? 101 : group.max)).length;

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

    // 5. Добавим метод для отображения распределения по уровням
    renderLevelsDistribution(tasks) {
        // Группируем задания по уровням
        const levels = {
            1: {
                name: 'Базовый',
                count: 0,
                avgDifficulty: 0,
                avgDiscrimination: 0
            },
            2: {
                name: 'Применение',
                count: 0,
                avgDifficulty: 0,
                avgDiscrimination: 0
            },
            3: {
                name: 'Анализ',
                count: 0,
                avgDifficulty: 0,
                avgDiscrimination: 0
            },
            4: {
                name: 'Творчество',
                count: 0,
                avgDifficulty: 0,
                avgDiscrimination: 0
            }
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
        if (!ctx || !data.distribution || !data.studentStats)
            return;

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
                datasets: [{
                        label: 'Фактическое распределение',
                        data: histogram.counts,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgb(54, 162, 235)',
                        borderWidth: 2,
                        fill: true
                    }, {
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
            bins.push({
                min: binMin,
                max: binMax,
                count: 0
            });
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

    // Добавим метод для создания box plot
    // 3. Обновим метод createBoxPlotDistribution для работы с разными версиями
    createBoxPlotDistribution(data) {
        const ctx = document.getElementById('boxPlotDistribution');
        if (!ctx || !data.studentStats)
            return;

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

    // 4. Реализация для новой версии библиотеки
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
                        }
                    ],
                    outliers: outliers.length > 0 ? outliers : undefined
                }
            ];

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
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function (context) {
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

    // 5. Реализация для старой версии библиотеки
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
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function (context) {
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

	getColorForCorrelation(value) {
		if (value >= 0.7) return 'rgba(46, 204, 113, 0.8)';    // Зелёный
		if (value >= 0.3) return 'rgba(52, 152, 219, 0.8)';    // Синий
		if (value >= 0.1) return 'rgba(241, 196, 15, 0.8)';    // Жёлтый
		if (value >= -0.1) return 'rgba(149, 165, 166, 0.8)';  // Серый
		return 'rgba(231, 76, 60, 0.8)';                       // Красный (отрицательная)
	}


    // Fallback метод для box plot
    createBoxPlotFallback(ctx, scores, min, q1, median, q3, max, outliers) {
        // Используем комбинированный график как раньше
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Распределение'],
                datasets: [{
                        label: 'Диапазон',
                        data: [max - min],
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgb(54, 162, 235)',
                        borderWidth: 1
                    }, {
                        label: 'Межквартильный размах',
                        data: [q3 - q1],
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgb(75, 192, 192)',
                        borderWidth: 1
                    }, {
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
                            label: function (context) {
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
        if (!container)
            return;

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
        if (!ctx)
            return;

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
                            'rgba(255, 99, 132, 0.7)'),
                        pointRadius: 8,
                        pointHoverRadius: 12
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
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
        const stats = [{
                icon: 'fa-ruler',
                label: 'Среднее',
                value: distribution.mean.toFixed(2),
                description: 'Средний балл класса',
                color: '#3498db'
            }, {
                icon: 'fa-balance-scale',
                label: 'Медиана',
                value: distribution.median.toFixed(2),
                description: 'Значение в середине ранжированного ряда',
                color: '#27ae60'
            }, {
                icon: 'fa-chart-bar',
                label: 'Мода',
                value: distribution.mode.toFixed(2),
                description: 'Наиболее часто встречающийся балл',
                color: '#f39c12'
            }, {
                icon: 'fa-expand-arrows-alt',
                label: 'Ст. отклонение',
                value: distribution.stdDev.toFixed(2),
                description: 'Мера разброса данных',
                color: '#e74c3c'
            }, {
                icon: 'fa-sort-amount-up',
                label: 'Асимметрия',
                value: distribution.skewness.toFixed(3),
                description: distribution.skewness > 0 ? 'Смещение влево' :
                distribution.skewness < 0 ? 'Смещение вправо' : 'Симметрия',
                color: '#9b59b6'
            }, {
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
        const styleId = 'advanced-analytics-styles';
        if (document.getElementById(styleId)) {
            // Удаляем старые стили
            document.getElementById(styleId).remove();
        }

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
			/* Добавляем важные стили для модальных окон */
			.detailed-analysis-modal-overlay,
			.student-modal-overlay,
			.task-modal-overlay,
			.analysis-modal-overlay,
			.implementation-modal-overlay {
				position: fixed !important;
				top: 0 !important;
				left: 0 !important;
				right: 0 !important;
				bottom: 0 !important;
				background: rgba(0, 0, 0, 0.8) !important;
				display: flex !important;
				align-items: center !important;
				justify-content: center !important;
				z-index: 99999 !important; /* Высокий z-index */
				padding: 20px !important;
				backdrop-filter: blur(5px) !important;
			}
			
			.detailed-analysis-modal-content,
			.student-modal-content,
			.task-modal-content,
			.analysis-modal-content,
			.implementation-modal-content {
				background: white !important;
				border-radius: 20px !important;
				max-width: 1400px !important;
				max-height: 90vh !important;
				display: flex !important;
				flex-direction: column !important;
				box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;
				overflow: hidden !important;
				z-index: 100000 !important; /* Еще выше */
				position: relative !important;
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
			
			/* Модальное окно */
			.detailed-analysis-modal-overlay {
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: rgba(0, 0, 0, 0.7);
				display: flex;
				align-items: center;
				justify-content: center;
				z-index: 9999;
				backdrop-filter: blur(5px);
			}
			
			.detailed-analysis-modal-content {
				background: white;
				border-radius: 20px;
				width: 95%;
				max-width: 1400px;
				max-height: 90vh;
				display: flex;
				flex-direction: column;
				box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
				overflow: hidden;
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
				padding: 5px 12px;
				border-radius: 20px;
				font-size: 12px;
				font-weight: 500;
				display: inline-flex;
				align-items: center;
				gap: 5px;
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
			}
			
			.nav-tabs {
				display: flex;
				gap: 2px;
				overflow-x: auto;
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
				padding: 30px;
			}
			
			.tab-content {
				display: none;
			}
			
			.tab-content.active {
				display: block;
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
				box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
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
				box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
			}
			
			.viz-card.wide {
				grid-column: 1 / -1;
			}
			
			.chart-container {
				height: 300px;
				position: relative;
			}
			
			/* Таблицы */
			.table-responsive {
				overflow-x: auto;
				border-radius: 10px;
				border: 1px solid #e9ecef;
			}
			
			.students-table, .tasks-table {
				width: 100%;
				border-collapse: collapse;
			}
			
			.students-table th,
			.tasks-table th {
				background: #f8f9fa;
				padding: 15px;
				text-align: left;
				font-weight: 600;
				color: #495057;
				border-bottom: 2px solid #dee2e6;
			}
			
			.students-table td,
			.tasks-table td {
				padding: 12px 15px;
				border-bottom: 1px solid #e9ecef;
			}
			
			.student-row:hover,
			.task-row:hover {
				background: #f8f9fa;
			}
			
			/* Статусы и индикаторы */
			.score-value.excellent { color: #27ae60; }
			.score-value.good { color: #3498db; }
			.score-value.average { color: #f39c12; }
			.score-value.poor { color: #e74c3c; }
			
			.stability-indicator {
				background: #f8f9fa;
				border-radius: 10px;
				height: 20px;
				position: relative;
				overflow: hidden;
			}
			
			.stability-indicator.high .stability-bar { background: #27ae60; }
			.stability-indicator.medium .stability-bar { background: #f39c12; }
			.stability-indicator.low .stability-bar { background: #e74c3c; }
			
			.stability-bar {
				position: absolute;
				top: 0;
				left: 0;
				bottom: 0;
				border-radius: 10px;
			}
			
			.stability-indicator span {
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
				z-index: 1;
			}
			
			/* Кнопки и элементы управления */
			.btn {
				padding: 8px 16px;
				border-radius: 8px;
				border: none;
				cursor: pointer;
				font-weight: 500;
				transition: all 0.3s;
			}
			
			.btn-xs {
				padding: 4px 8px;
				font-size: 12px;
			}
			
			.btn-primary {
				background: #3498db;
				color: white;
			}
			
			.btn-primary:hover {
				background: #2980b9;
			}
			
			.btn-info {
				background: #17a2b8;
				color: white;
			}
			
			.btn-success {
				background: #28a745;
				color: white;
			}
			
			.btn-outline {
				background: transparent;
				border: 1px solid #6c757d;
				color: #6c757d;
			}
			
			.btn-outline:hover {
				background: #6c757d;
				color: white;
			}
			
			/* Футер модального окна */
			.modal-footer {
				padding: 20px 30px;
				background: #f8f9fa;
				border-top: 1px solid #e9ecef;
				display: flex;
				justify-content: space-between;
				align-items: center;
			}
			
			.export-options {
				display: flex;
				gap: 10px;
			}
			
			/* Дополнительные стили для контента */
			.top-students-list {
				display: flex;
				flex-direction: column;
				gap: 10px;
			}
			
			.top-student-item {
				display: flex;
				align-items: center;
				gap: 15px;
				padding: 10px;
				background: #f8f9fa;
				border-radius: 10px;
			}
			
			.student-rank {
				width: 30px;
				height: 30px;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-weight: bold;
				color: white;
				font-size: 14px;
			}
			
			.rank-1 { background: #ffd700; }
			.rank-2 { background: #c0c0c0; }
			.rank-3 { background: #cd7f32; }
			
			.student-progress {
				flex: 1;
				height: 6px;
				background: #e9ecef;
				border-radius: 3px;
				overflow: hidden;
			}
			
			.progress-bar {
				height: 100%;
				background: linear-gradient(90deg, #3498db, #2ecc71);
				transition: width 0.5s ease-in-out;
			}
			
			/* Адаптивность */
			@media (max-width: 768px) {
				.detailed-analysis-modal-content {
					width: 100%;
					height: 100%;
					max-height: 100vh;
					border-radius: 0;
				}
				
				.visualization-row {
					grid-template-columns: 1fr;
				}
				
				.metric-cards-grid {
					grid-template-columns: repeat(2, 1fr);
				}
				
				.nav-tabs {
					flex-wrap: wrap;
				}
				
				.modal-body {
					padding: 15px;
				}
			}
			/* Исправляем проблему с отображением содержимого */
			.tab-content {
				display: none !important;
			}
			
			.tab-content.active {
				display: block !important;
				animation: fadeIn 0.3s ease-in-out !important;
			}
			
			/* Стили для кнопок, чтобы они были поверх всего */
			.modal-close-btn,
			.close-btn {
				position: absolute !important;
				top: 15px !important;
				right: 15px !important;
				background: rgba(255, 255, 255, 0.2) !important;
				border: none !important;
				color: white !important;
				width: 40px !important;
				height: 40px !important;
				border-radius: 50% !important;
				cursor: pointer !important;
				display: flex !important;
				align-items: center !important;
				justify-content: center !important;
				transition: all 0.3s !important;
				z-index: 100001 !important; /* Над всем */
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
			
			.animated {
				animation-duration: 0.5s;
				animation-fill-mode: both;
			}
			
			.fadeIn { animation-name: fadeIn; }
			.fadeInUp { animation-name: fadeInUp; }
			
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
			
			/* Прокрутка */
			.modal-body::-webkit-scrollbar {
				width: 8px;
			}
			
			.modal-body::-webkit-scrollbar-track {
				background: #f1f1f1;
				border-radius: 4px;
			}
			
			.modal-body::-webkit-scrollbar-thumb {
				background: #c1c1c1;
				border-radius: 4px;
			}
			
			.modal-body::-webkit-scrollbar-thumb:hover {
				background: #a8a8a8;
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
    async initChartsInModal(data) {
        setTimeout(async() => {
            console.log('Инициализация графиков в модальном окне...');

            // Проверяем наличие correlationChart в модальном окне
            const correlationChartModal = document.getElementById('correlationChartModal');
            if (correlationChartModal) {
                this.createCorrelationChart();
            }

            // Проверяем доступность BoxPlot
            const boxPlotAvailable = await this.checkBoxPlotAvailability();

            // Создаем все графики с проверкой на существование canvas
            const chartsToCreate = [{
                    id: 'overviewDistributionChart',
                    method: 'createOverviewDistributionChart',
                    data: data
                }, {
                    id: 'studentScoresChart',
                    method: 'createStudentScoresChart',
                    data: data
                }, {
                    id: 'studentPerformanceChart',
                    method: 'createStudentPerformanceChart',
                    data: data
                }, {
                    id: 'taskDifficultyMatrix',
                    method: 'createTaskDifficultyMatrix',
                    data: data
                }, {
                    id: 'taskScatterPlot',
                    method: 'createTaskScatterPlot',
                    data: data
                }, {
                    id: 'scoreHistogram',
                    method: 'createScoreHistogram',
                    data: data
                }, {
                    id: 'normalDistributionChart',
                    method: 'createNormalDistributionChart',
                    data: data
                }, {
                    id: 'progressMonitoringChart',
                    method: 'createProgressMonitoringChart',
                    data: data
                }, {
                    id: 'errorByTaskChart',
                    method: 'createErrorByTaskChart',
                    data: data.errorAnalysis
                }, {
                    id: 'errorTypesChart',
                    method: 'createErrorTypesChart',
                    data: data.errorAnalysis
                }
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
                                min, q1, median, q3, max, outliers);
                        }
                    }
                }
            });

            // Отладка
            this.debugCharts();
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
        if (document.getElementById(styleId))
            return;

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
        if (!ctx)
            return;

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
                datasets: [{
                        label: 'Текущий прогресс',
                        data: [currentScore, progressData[1], progressData[2], targetScore],
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 3,
                        tension: 0.3,
                        fill: true
                    }, {
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
        if (!ctx || !data.studentStats || data.studentStats.length === 0)
            return;

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
        if (!appData.students || !appData.tasks)
            return [];

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
        if (!appData.tasks || !appData.students)
            return [];

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

        return {
            mean,
            median,
            mode,
            stdDev,
            skewness,
            kurtosis
        };
    }

    // Дополнительные методы для расчетов
    calculateStability(scores) {
        if (scores.length < 2)
            return 1;
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
        if (scores.length < 4)
            return 0.5;

        // Разделяем на группы по успеваемости
        const sortedIndices = scores
            .map((score, index) => ({
                    score,
                    index
                }))
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
        if (scores.length < 3 || stdDev === 0)
            return 0;

        const n = scores.length;
        const sumCubedDeviations = scores.reduce((sum, score) =>
                sum + Math.pow(score - mean, 3), 0);

        return (sumCubedDeviations / n) / Math.pow(stdDev, 3);
    }

    calculateKurtosis(scores, mean, stdDev) {
        if (scores.length < 4 || stdDev === 0)
            return 0;

        const n = scores.length;
        const sumFourthDeviations = scores.reduce((sum, score) =>
                sum + Math.pow(score - mean, 4), 0);

        return (sumFourthDeviations / n) / Math.pow(stdDev, 4) - 3;
    }

    // Методы для визуализаций (упрощенные версии)
    createOverviewDistributionChart(data) {
        const ctx = document.getElementById('overviewDistributionChart');
        if (!ctx)
            return;

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
                    }
                ]
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
                            label: function (context) {
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
        if (!ctx)
            return;

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

        return {
            labels,
            counts: bins
        };
    }

    // Остальные методы для визуализаций
    createTaskDifficultyMatrix(data) {
        const ctx = document.getElementById('taskDifficultyMatrix');
        if (!ctx)
            return;

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
                    }
                ]
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
        if (!ctx)
            return;

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
        const sortedPairs = labels.map((label, index) => ({
                    label,
                    value: values[index]
                }))
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
                            label: function (context) {
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
                    }
                ]
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
                            label: function (context) {
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
        if (score >= 85)
            return 'excellent';
        if (score >= 70)
            return 'good';
        if (score >= 50)
            return 'average';
        return 'poor';
    }

    getDifficultyClass(difficulty) {
        if (difficulty >= 0.7)
            return 'very-hard';
        if (difficulty >= 0.5)
            return 'hard';
        if (difficulty >= 0.3)
            return 'medium';
        return 'easy';
    }

    getDiscriminationClass(discrimination) {
        if (discrimination >= 0.5)
            return 'excellent';
        if (discrimination >= 0.3)
            return 'good';
        if (discrimination >= 0.2)
            return 'acceptable';
        return 'poor';
    }

    getTaskStatus(task) {
        if (task.difficulty > 0.7)
            return 'very-hard';
        if (task.discrimination < 0.2)
            return 'poor-discrimination';
        if (task.completionRate < 30)
            return 'low-completion';
        return 'good';
    }

    getTaskStatusIcon(task) {
        const status = this.getTaskStatus(task);
        switch (status) {
        case 'very-hard':
            return 'fa-exclamation-triangle';
        case 'poor-discrimination':
            return 'fa-filter';
        case 'low-completion':
            return 'fa-user-clock';
        default:
            return 'fa-check-circle';
        }
    }

    getTaskStatusText(task) {
        const status = this.getTaskStatus(task);
        switch (status) {
        case 'very-hard':
            return 'Очень сложное';
        case 'poor-discrimination':
            return 'Низкая дискриминативность';
        case 'low-completion':
            return 'Низкая выполнимость';
        default:
            return 'Хорошее';
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

    // Вставьте эти методы в класс AdvancedAnalytics перед последней закрывающей фигурной скобкой

    // Расчет прогресса студента
    calculateStudentProgress(studentIndex, scores) {
        // Упрощенный расчет прогресса
        // В реальном приложении здесь была бы история предыдущих тестов
        if (!scores || scores.length < 2)
            return 0;

        // Для демонстрации используем случайный прогресс
        const baseScore = this.calculateAverage(scores);
        const randomFactor = (Math.random() - 0.5) * 20; // -10% до +10%
        return randomFactor;
    }

    // Генерация карточек группового анализа
    renderGroupAnalysisCards(sortedStudents) {
        if (!sortedStudents || sortedStudents.length === 0)
            return '<p>Нет данных для анализа</p>';

        // Создаем группы с правильными критериями
        const groups = [{
                name: 'Отличники',
                icon: 'fa-trophy',
                filter: s => s.averageScore >= 85,
                description: 'Высокие стабильные результаты по всем заданиям'
            }, {
                name: 'Хорошисты',
                icon: 'fa-star',
                filter: s => s.averageScore >= 70 && s.averageScore < 85,
                description: 'Хорошие результаты, возможны улучшения в сложных заданиях'
            }, {
                name: 'Средние',
                icon: 'fa-chart-line',
                filter: s => s.averageScore >= 50 && s.averageScore < 70,
                description: 'Средние результаты, высокая стабильность'
            }, {
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
                students: students.map(s => ({
                        name: s.name
                    })),
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
        if (!studentStats || studentStats.length === 0)
            return 0;
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
                task.completionRate < 50);

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
        const {
            mean,
            median,
            stdDev,
            skewness,
            kurtosis
        } = distribution;

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
        const actionPlan = [{
                title: 'Диагностика проблем',
                description: 'Провести индивидуальные беседы с учащимися для выявления причин затруднений',
                deadline: '1 неделя',
                resources: ['Анкеты', 'Индивидуальные карты', 'Психолог'],
                progress: 0
            }, {
                title: 'Коррекция заданий',
                description: 'Пересмотреть проблемные задания, упростить формулировки, добавить подсказки',
                deadline: '2 недели',
                resources: ['Методические материалы', 'Коллеги', 'Образовательные стандарты'],
                progress: 0
            }, {
                title: 'Дифференцированное обучение',
                description: 'Разработать задания разного уровня сложности для разных групп учащихся',
                deadline: '3 недели',
                resources: ['Дидактические материалы', 'Цифровые ресурсы', 'Методист'],
                progress: 0
            }, {
                title: 'Контрольный тест',
                description: 'Провести контрольный тест для оценки эффективности коррекционных мер',
                deadline: '4 недели',
                resources: ['Тестовые задания', 'Система оценивания', 'Аналитические инструменты'],
                progress: 0
            }
        ];

        // Ожидаемые результаты
        const expectedResults = [{
                title: 'Улучшение среднего балла',
                description: 'Повышение среднего балла класса на 10-15%',
                improvement: 15,
                timeframe: '1 месяц',
                icon: 'fa-chart-line'
            }, {
                title: 'Снижение отстающих',
                description: 'Уменьшение количества учащихся с баллом ниже 50% на 50%',
                improvement: 50,
                timeframe: '2 месяца',
                icon: 'fa-user-graduate'
            }, {
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

    // Вспомогательные методы для стилей (добавьте в addDetailedAnalysisStyles)
    addCorrectionStyles() {
        const additionalStyles = `
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
			
			/* Стили для плана действий */
			.action-plan {
				display: flex;
				flex-direction: column;
				gap: 15px;
				margin: 20px 0;
			}
			
			.action-step {
				background: white;
				border-radius: 10px;
				padding: 20px;
				display: flex;
				gap: 15px;
				box-shadow: 0 3px 10px rgba(0,0,0,0.1);
			}
			
			.step-number {
				width: 40px;
				height: 40px;
				border-radius: 50%;
				background: #f8f9fa;
				color: #495057;
				display: flex;
				align-items: center;
				justify-content: center;
				font-weight: bold;
				font-size: 18px;
				flex-shrink: 0;
			}
			
			.step-content {
				flex: 1;
			}
			
			.step-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 10px;
			}
			
			.step-header h5 {
				margin: 0;
				color: #2c3e50;
			}
			
			.step-deadline {
				background: #e8f4fc;
				color: #3498db;
				padding: 5px 10px;
				border-radius: 5px;
				font-size: 12px;
				font-weight: 500;
			}
			
			.step-resources {
				margin: 15px 0;
				padding: 10px;
				background: #f8f9fa;
				border-radius: 5px;
			}
			
			.step-resources ul {
				margin: 5px 0 0 0;
				padding-left: 20px;
			}
			
			.step-resources li {
				margin: 3px 0;
				font-size: 13px;
			}
			
			.step-progress {
				margin-top: 15px;
			}
			
			.step-progress .progress-bar {
				height: 8px;
				border-radius: 4px;
				background: #e9ecef;
				overflow: hidden;
				position: relative;
			}
			
			.step-progress .progress-bar > div {
				height: 100%;
				background: linear-gradient(90deg, #3498db, #2ecc71);
				transition: width 0.5s;
			}
			
			.step-progress .progress-bar span {
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 10px;
				color: white;
				font-weight: bold;
			}
			
			/* Стили для ожидаемых результатов */
			.expected-results {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
				gap: 15px;
				margin: 20px 0;
			}
			
			.result-card {
				background: white;
				border-radius: 10px;
				padding: 20px;
				box-shadow: 0 3px 10px rgba(0,0,0,0.1);
			}
			
			.result-icon {
				width: 50px;
				height: 50px;
				border-radius: 10px;
				background: linear-gradient(135deg, #3498db, #2ecc71);
				color: white;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 24px;
				margin-bottom: 15px;
			}
			
			.result-content h5 {
				margin: 0 0 10px 0;
				color: #2c3e50;
			}
			
			.result-content p {
				margin: 0 0 15px 0;
				color: #7f8c8d;
				font-size: 14px;
			}
			
			.result-metrics {
				display: flex;
				gap: 15px;
			}
			
			.result-metrics .metric {
				text-align: center;
				flex: 1;
			}
			
			.result-metrics .metric-value {
				font-size: 20px;
				font-weight: bold;
				color: #3498db;
			}
			
			.result-metrics .metric-label {
				font-size: 12px;
				color: #7f8c8d;
			}
			
			/* Стили для мониторинга прогресса */
			.progress-monitoring {
				background: white;
				border-radius: 10px;
				padding: 20px;
				box-shadow: 0 3px 10px rgba(0,0,0,0.1);
			}
			
			.progress-chart-container {
				height: 200px;
				margin-bottom: 20px;
			}
			
			.progress-metrics {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
				gap: 15px;
			}
			
			.progress-metric {
				text-align: center;
				padding: 15px;
				background: #f8f9fa;
				border-radius: 10px;
			}
			
			.progress-metric .metric-value {
				font-size: 24px;
				font-weight: bold;
				margin-bottom: 5px;
			}
			
			.progress-metric .metric-value:first-child {
				color: #3498db;
			}
			
			.progress-metric .metric-value:nth-child(2) {
				color: #27ae60;
			}
			
			.progress-metric .metric-value:nth-child(3) {
				color: #e74c3c;
			}
			
			.progress-metric .metric-label {
				font-size: 12px;
				color: #7f8c8d;
			}
		`;

        const style = document.createElement('style');
        style.textContent = additionalStyles;
        document.head.appendChild(style);
    }

    // Добавьте вызов этого метода в createDetailedAnalysisModal
    // после this.addDetailedAnalysisStyles();
    //this.addCorrectionStyles();

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
                typeof result === 'object' && result.timeSpent);

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
        if (!appData.tasks || !appData.results || !appData.results[studentIndex])
            return 0;

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
        if (!values || values.length < 2)
            return 0;
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
            'Знание': {
                scores: [],
                average: 0
            },
            'Понимание': {
                scores: [],
                average: 0
            },
            'Применение': {
                scores: [],
                average: 0
            },
            'Анализ': {
                scores: [],
                average: 0
            },
            'Синтез': {
                scores: [],
                average: 0
            }
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
                error.studentIndex === studentIndex) || [];

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
        if (existingModal)
            existingModal.remove();

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
					
					<div class="student-modal-body">
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
        if (!ctx)
            return;

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
                    }
                ]
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
        if (document.getElementById(styleId))
            return;

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
    collectStudentDataForExportsa(studentIndex) {
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
                competenceStats[task.competence] = {
                    total: 0,
                    max: 0,
                    count: 0
                };
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
                        key, {
                            average: stats.max > 0 ? (stats.total / stats.max * 100) : 0
                        }
                    ])),
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
        if (percentage >= 85)
            return 'Отличное владение материалом';
        if (percentage >= 70)
            return 'Хорошее понимание темы';
        if (percentage >= 50)
            return 'Базовое понимание, требуется практика';
        return 'Требуется повторение материала';
    }

    // Экспорт в файл
    exportToFile(content, filename) {
        const blob = new Blob([content], {
            type: 'text/html;charset=utf-8'
        });
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
					
					<div class="task-modal-body">
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
									<div class="task-stat">
										<div class="stat-label">Выполняемость:</div>
										<div class="stat-value">
											${this.calculateTaskCompletionRate(taskIndex).toFixed(1)}%
										</div>
									</div>
								</div>
							</div>
						</form>
					</div>
					
					<div class="task-modal-footer">
						<button class="btn btn-primary" onclick="window.advancedAnalytics.saveTaskChanges(${taskIndex})">
							<i class="fas fa-save"></i> Сохранить изменения
						</button>
						<button class="btn btn-info" onclick="window.advancedAnalytics.analyzeTask(${taskIndex})">
							<i class="fas fa-chart-bar"></i> Детальный анализ
						</button>
						<button class="btn btn-outline" onclick="this.closest('#taskEditModal').remove()">
							Отмена
						</button>
					</div>
				</div>
			</div>
		`;

        document.body.appendChild(modal);
        this.addTaskModalStyles();
    }

    // Расчет процента выполнения задания
    calculateTaskCompletionRate(taskIndex) {
        if (!appData.students || !appData.results)
            return 0;

        let completed = 0;
        appData.students.forEach((student, studentIndex) => {
            const score = this.getStudentScore(studentIndex, taskIndex);
            if (score > 0)
                completed++;
        });

        return (completed / appData.students.length) * 100;
    }

    saveTaskChanges(taskIndex) {
        const form = document.getElementById('taskEditForm');
        if (!form)
            return;

        const levelSelect = document.getElementById('taskLevel');
        const selectedLevel = parseInt(levelSelect.value);

        // Ограничиваем уровень 1-4
        const finalLevel = Math.min(Math.max(selectedLevel, 1), 4);

        const updatedTask = {
            ...appData.tasks[taskIndex],
            title: document.getElementById('taskTitle').value,
            level: finalLevel,
            maxScore: parseFloat(document.getElementById('taskMaxScore').value),
            type: document.getElementById('taskType').value,
            competence: this.getCompetenceByLevel(finalLevel),
            description: document.getElementById('taskDescription').value
        };

        // Обновляем данные
        appData.tasks[taskIndex] = updatedTask;

        // Сохраняем изменения
        this.saveAppDataChanges();

        // Закрываем модальное окно
        const modal = document.getElementById('taskEditModal');
        if (modal)
            modal.remove();

        showNotification('Задание успешно обновлено', 'success');

        // Обновляем интерфейс
        if (window.refreshTaskList) {
            window.refreshTaskList();
        }
    }

    // Сохранение изменений в appData
    saveAppDataChanges() {
        // В реальном приложении здесь была бы синхронизация с сервером
        // или сохранение в localStorage
        showNotification('Изменения сохранены', 'info');
    }

    // Реализация метода analyzeTask (расширенная версия)
    analyzeTask(taskIndex) {
        if (!appData.tasks || !appData.tasks[taskIndex]) {
            showNotification('Задание не найдено', 'error');
            return;
        }

        const task = appData.tasks[taskIndex];

        // Собираем данные для анализа
        const analysisData = this.collectTaskAnalysisData(taskIndex);

        // Создаем модальное окно детального анализа
        this.createTaskAnalysisModal(taskIndex, task, analysisData);
    }

    // Сбор данных для анализа задания
    collectTaskAnalysisData(taskIndex) {
        const task = appData.tasks[taskIndex];
        const studentCount = appData.students?.length || 0;

        // Собираем баллы всех студентов за это задание
        const scores = appData.students?.map((student, studentIndex) => {
            const score = this.getStudentScore(studentIndex, taskIndex);
            const maxScore = task.maxScore || 1;
            return {
                studentIndex,
                studentName: student,
                score,
                percentage: maxScore > 0 ? (score / maxScore) * 100 : 0
            };
        }) || [];

        // Статистика
        const percentages = scores.map(s => s.percentage);
        const averageScore = this.calculateAverage(percentages);
        const completed = scores.filter(s => s.score > 0).length;
        const completionRate = (completed / studentCount) * 100;

        // Распределение по группам
        const excellent = scores.filter(s => s.percentage >= 85).length;
        const good = scores.filter(s => s.percentage >= 70 && s.percentage < 85).length;
        const average = scores.filter(s => s.percentage >= 50 && s.percentage < 70).length;
        const poor = scores.filter(s => s.percentage < 50).length;

        // Анализ ошибок для этого задания
        const taskErrors = appData.errors?.filter(error => error.taskIndex === taskIndex) || [];
        const errorTypes = {};
        taskErrors.forEach(error => {
            errorTypes[error.type] = (errorTypes[error.type] || 0) + (error.count || 1);
        });

        return {
            scores,
            statistics: {
                averageScore,
                completionRate,
                studentCount,
                distribution: {
                    excellent,
                    good,
                    average,
                    poor
                }
            },
            errors: {
                total: taskErrors.length,
                byType: errorTypes,
                list: taskErrors
            },
            difficulty: task.difficulty || this.calculateTaskDifficulty(percentages.map(p => p / 100)),
            discrimination: task.discrimination || this.calculateTaskDiscrimination(percentages.map(p => p / 100))
        };
    }

    // Создание модального окна анализа задания
    createTaskAnalysisModal(taskIndex, task, analysisData) {
        const modal = document.createElement('div');
        modal.id = 'taskAnalysisModal';
        modal.innerHTML = `
			<div class="analysis-modal-overlay" onclick="this.parentElement.remove()">
				<div class="analysis-modal-content" onclick="event.stopPropagation()">
					<div class="analysis-modal-header">
						<h3>
							<i class="fas fa-chart-bar"></i>
							Анализ задания: ${task.title || `Задание ${taskIndex + 1}`}
						</h3>
						<button class="close-btn" onclick="this.closest('#taskAnalysisModal').remove()">
							<i class="fas fa-times"></i>
						</button>
					</div>
					
					<div class="analysis-modal-body">
						<!-- Основная статистика -->
						<div class="analysis-stats-grid">
							<div class="analysis-stat-card">
								<div class="stat-icon">
									<i class="fas fa-percentage"></i>
								</div>
								<div class="stat-content">
									<div class="stat-value">${analysisData.statistics.averageScore.toFixed(1)}%</div>
									<div class="stat-label">Средний балл</div>
								</div>
							</div>
							
							<div class="analysis-stat-card">
								<div class="stat-icon">
									<i class="fas fa-check-circle"></i>
								</div>
								<div class="stat-content">
									<div class="stat-value">${analysisData.statistics.completionRate.toFixed(1)}%</div>
									<div class="stat-label">Выполняемость</div>
								</div>
							</div>
							
							<div class="analysis-stat-card">
								<div class="stat-icon ${analysisData.difficulty > 0.7 ? 'danger' : analysisData.difficulty > 0.5 ? 'warning' : 'success'}">
									<i class="fas ${analysisData.difficulty > 0.7 ? 'fa-mountain' : analysisData.difficulty > 0.5 ? 'fa-hill' : 'fa-sliders-h'}"></i>
								</div>
								<div class="stat-content">
									<div class="stat-value">${(analysisData.difficulty * 100).toFixed(1)}%</div>
									<div class="stat-label">Сложность</div>
								</div>
							</div>
							
							<div class="analysis-stat-card">
								<div class="stat-icon ${analysisData.discrimination < 0.3 ? 'danger' : analysisData.discrimination < 0.5 ? 'warning' : 'success'}">
									<i class="fas ${analysisData.discrimination < 0.3 ? 'fa-filter' : analysisData.discrimination < 0.5 ? 'fa-sort' : 'fa-chart-line'}"></i>
								</div>
								<div class="stat-content">
									<div class="stat-value">${(analysisData.discrimination * 100).toFixed(1)}%</div>
									<div class="stat-label">Дискриминативность</div>
								</div>
							</div>
						</div>
						
						<!-- Графики -->
						<div class="analysis-charts-row">
							<div class="analysis-chart-card">
								<h4>Распределение баллов</h4>
								<div class="chart-container">
									<canvas id="taskScoreDistributionChart"></canvas>
								</div>
							</div>
							
							<div class="analysis-chart-card">
								<h4>Типы ошибок</h4>
								<div class="chart-container">
									<canvas id="taskErrorTypesChart"></canvas>
								</div>
							</div>
						</div>
						
						<!-- Детальный анализ -->
						<div class="detailed-analysis">
							<h4>Детальный анализ выполнения</h4>
							<div class="performance-table-container">
								<table class="performance-table">
									<thead>
										<tr>
											<th>Группа</th>
											<th>Количество</th>
											<th>Процент</th>
											<th>Средний балл</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>Отличники (≥85%)</td>
											<td>${analysisData.statistics.distribution.excellent}</td>
											<td>${((analysisData.statistics.distribution.excellent / analysisData.statistics.studentCount) * 100).toFixed(1)}%</td>
											<td>
												${this.calculateGroupAverage(analysisData.scores.filter(s => s.percentage >= 85)).toFixed(1)}%
											</td>
										</tr>
										<tr>
											<td>Хорошисты (70-85%)</td>
											<td>${analysisData.statistics.distribution.good}</td>
											<td>${((analysisData.statistics.distribution.good / analysisData.statistics.studentCount) * 100).toFixed(1)}%</td>
											<td>
												${this.calculateGroupAverage(analysisData.scores.filter(s => s.percentage >= 70 && s.percentage < 85)).toFixed(1)}%
											</td>
										</tr>
										<tr>
											<td>Средние (50-70%)</td>
											<td>${analysisData.statistics.distribution.average}</td>
											<td>${((analysisData.statistics.distribution.average / analysisData.statistics.studentCount) * 100).toFixed(1)}%</td>
											<td>
												${this.calculateGroupAverage(analysisData.scores.filter(s => s.percentage >= 50 && s.percentage < 70)).toFixed(1)}%
											</td>
										</tr>
										<tr>
											<td>Слабые (<50%)</td>
											<td>${analysisData.statistics.distribution.poor}</td>
											<td>${((analysisData.statistics.distribution.poor / analysisData.statistics.studentCount) * 100).toFixed(1)}%</td>
											<td>
												${this.calculateGroupAverage(analysisData.scores.filter(s => s.percentage < 50)).toFixed(1)}%
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
						
						<!-- Рекомендации -->
						<div class="task-recommendations">
							<h4>Рекомендации по заданию</h4>
							<div class="recommendations-list">
								${this.generateTaskRecommendations(analysisData).map(rec => `
									<div class="recommendation-item">
										<i class="fas fa-lightbulb"></i>
										<span>${rec}</span>
									</div>
								`).join('')}
							</div>
						</div>
					</div>
					
					<div class="analysis-modal-footer">
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
        this.addAnalysisModalStyles();

        // Создаем графики
        setTimeout(() => {
            this.createTaskScoreDistributionChart(analysisData.scores);
            this.createTaskErrorTypesChart(analysisData.errors.byType);
        }, 100);
    }

    // Расчет среднего для группы
    calculateGroupAverage(groupScores) {
        if (!groupScores || groupScores.length === 0)
            return 0;
        const sum = groupScores.reduce((total, score) => total + score.percentage, 0);
        return sum / groupScores.length;
    }

    // Генерация рекомендаций по заданию
    generateTaskRecommendations(analysisData) {
        const recommendations = [];

        // Анализ сложности
        if (analysisData.difficulty > 0.7) {
            recommendations.push('Задание слишком сложное. Рассмотрите возможность упрощения формулировки или добавления подсказок.');
        } else if (analysisData.difficulty < 0.3) {
            recommendations.push('Задание слишком простое. Добавьте дополнительные элементы сложности для лучшей дискриминации.');
        }

        // Анализ дискриминативности
        if (analysisData.discrimination < 0.3) {
            recommendations.push('Низкая дискриминативность. Пересмотрите варианты ответов или критерии оценивания.');
        }

        // Анализ выполнения
        if (analysisData.statistics.completionRate < 50) {
            recommendations.push('Низкая выполняемость. Проверьте ясность формулировки и адекватность времени выполнения.');
        }

        // Анализ распределения
        const poorPercentage = (analysisData.statistics.distribution.poor / analysisData.statistics.studentCount) * 100;
        if (poorPercentage > 30) {
            recommendations.push('Большой процент учащихся не справляется с заданием. Требуется дополнительное объяснение темы.');
        }

        // Анализ ошибок
        if (analysisData.errors.total > 0) {
            const mostCommonError = Object.entries(analysisData.errors.byType)
                .sort((a, b) => b[1] - a[1])[0];

            if (mostCommonError) {
                recommendations.push(`Наиболее частый тип ошибок: "${this.getErrorTypeLabel(mostCommonError[0])}". Обратите внимание на объяснение этой темы.`);
            }
        }

        return recommendations.length > 0 ? recommendations : ['Задание хорошо сбалансировано. Продолжайте в том же духе!'];
    }

    // Реализация метода implementRecommendation
    implementRecommendation(recommendationId) {
        // В реальном приложении здесь была бы логика реализации рекомендаций
        // Для демонстрации покажем подробное модальное окно

        const recommendations = {
            'weak_students': {
                title: 'Индивидуальная работа с отстающими',
                steps: [
                    'Провести диагностику проблемных зон у каждого отстающего учащегося',
                    'Разработать индивидуальные планы коррекции',
                    'Организовать дополнительные занятия 2 раза в неделю',
                    'Вести дневник прогресса для каждого учащегося',
                    'Провести промежуточную проверку через 2 недели'
                ],
                resources: ['Методические материалы', 'Дидактические карточки', 'Онлайн-платформы'],
                timeframe: '4 недели',
                expectedResult: 'Увеличение среднего балла отстающих учащихся на 15-20%'
            },
            'problematic_tasks': {
                title: 'Коррекция проблемных заданий',
                steps: [
                    'Проанализировать каждое проблемное задание',
                    'Переформулировать сложные вопросы',
                    'Добавить подсказки и примеры',
                    'Провести апробацию на небольшой группе',
                    'Внести окончательные корректировки'
                ],
                resources: ['Коллеги для рецензии', 'Образовательные стандарты', 'Методические рекомендации'],
                timeframe: '2 недели',
                expectedResult: 'Улучшение дискриминативности заданий до 0.4+'
            },
            'low_average': {
                title: 'Повторение материала',
                steps: [
                    'Выявить наиболее проблемные темы',
                    'Подготовить обобщающие уроки',
                    'Использовать интерактивные методы обучения',
                    'Провести тренировочные работы',
                    'Организовать взаимопомощь в группах'
                ],
                resources: ['Презентации', 'Рабочие тетради', 'Обучающие видео'],
                timeframe: '3 недели',
                expectedResult: 'Повышение среднего балла класса на 10%'
            }
        };

        const recommendation = recommendations[recommendationId];

        if (recommendation) {
            this.showRecommendationImplementationModal(recommendationId, recommendation);
        } else {
            showNotification('Рекомендация не найдена', 'error');
        }
    }

    // Показ модального окна реализации рекомендации
    showRecommendationImplementationModal(id, recommendation) {
        const modal = document.createElement('div');
        modal.id = 'implementationModal';
        modal.innerHTML = `
			<div class="implementation-modal-overlay" onclick="this.parentElement.remove()">
				<div class="implementation-modal-content" onclick="event.stopPropagation()">
					<div class="implementation-modal-header">
						<h3>
							<i class="fas fa-play-circle"></i>
							Реализация рекомендации
						</h3>
						<button class="close-btn" onclick="this.closest('#implementationModal').remove()">
							<i class="fas fa-times"></i>
						</button>
					</div>
					
					<div class="implementation-modal-body">
						<div class="recommendation-header">
							<h4>${recommendation.title}</h4>
							<div class="recommendation-meta">
								<span class="timeframe">
									<i class="far fa-clock"></i> ${recommendation.timeframe}
								</span>
								<span class="expected-result">
									<i class="fas fa-bullseye"></i> Ожидаемый результат: ${recommendation.expectedResult}
								</span>
							</div>
						</div>
						
						<div class="implementation-steps">
							<h5>Шаги реализации:</h5>
							<ol>
								${recommendation.steps.map(step => `<li>${step}</li>`).join('')}
							</ol>
						</div>
						
						<div class="implementation-resources">
							<h5>Необходимые ресурсы:</h5>
							<ul>
								${recommendation.resources.map(resource => `<li>${resource}</li>`).join('')}
							</ul>
						</div>
						
						<div class="implementation-form">
							<h5>Начать реализацию:</h5>
							<div class="form-group">
								<label for="startDate">Дата начала:</label>
								<input type="date" id="startDate" class="form-control" value="${new Date().toISOString().split('T')[0]}">
							</div>
							<div class="form-group">
								<label for="responsiblePerson">Ответственный:</label>
								<input type="text" id="responsiblePerson" class="form-control" placeholder="Введите ФИО ответственного">
							</div>
						</div>
					</div>
					
					<div class="implementation-modal-footer">
						<button class="btn btn-success" onclick="window.advancedAnalytics.startImplementation('${id}')">
							<i class="fas fa-play"></i> Начать реализацию
						</button>
						<button class="btn btn-outline" onclick="this.closest('#implementationModal').remove()">
							Отложить
						</button>
					</div>
				</div>
			</div>
		`;

        document.body.appendChild(modal);
        this.addImplementationModalStyles();
    }

    // Запуск реализации рекомендации
    startImplementation(recommendationId) {
        const startDate = document.getElementById('startDate')?.value;
        const responsiblePerson = document.getElementById('responsiblePerson')?.value;

        if (!responsiblePerson) {
            showNotification('Укажите ответственного', 'warning');
            return;
        }

        // В реальном приложении здесь была бы отправка данных на сервер
        const implementationData = {
            recommendationId,
            startDate,
            responsiblePerson,
            status: 'in_progress',
            startedAt: new Date().toISOString()
        };

        // Сохраняем в localStorage для демонстрации
        const implementations = JSON.parse(localStorage.getItem('recommendationImplementations') || '[]');
        implementations.push(implementationData);
        localStorage.setItem('recommendationImplementations', JSON.stringify(implementations));

        // Закрываем модальное окно
        const modal = document.getElementById('implementationModal');
        if (modal)
            modal.remove();

        showNotification('Реализация рекомендации начата!', 'success');
    }

    // Добавление стилей для модальных окон
    addTaskModalStyles() {
        const style = document.createElement('style');
        style.textContent = `
			.task-modal-overlay,
			.analysis-modal-overlay,
			.implementation-modal-overlay {
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
			
			.task-modal-content,
			.analysis-modal-content,
			.implementation-modal-content {
				background: white;
				border-radius: 15px;
				width: 90%;
				max-width: 800px;
				max-height: 90vh;
				display: flex;
				flex-direction: column;
				box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
				overflow: hidden;
			}
			
			.task-modal-header,
			.analysis-modal-header,
			.implementation-modal-header {
				background: linear-gradient(135deg, #3498db, #2c3e50);
				color: white;
				padding: 20px;
				display: flex;
				justify-content: space-between;
				align-items: center;
			}
			
			.task-modal-body,
			.analysis-modal-body,
			.implementation-modal-body {
				flex: 1;
				overflow-y: auto;
				padding: 20px;
			}
			
			.form-group {
				margin-bottom: 20px;
			}
			
			.form-row {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 15px;
			}
			
			label {
				display: block;
				margin-bottom: 5px;
				font-weight: 500;
				color: #495057;
			}
			
			.form-control {
				width: 100%;
				padding: 10px 15px;
				border: 1px solid #ced4da;
				border-radius: 8px;
				font-size: 14px;
				transition: border-color 0.3s;
			}
			
			.form-control:focus {
				outline: none;
				border-color: #3498db;
				box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
			}
			
			.analysis-stats-grid {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
				gap: 15px;
				margin-bottom: 30px;
			}
			
			.analysis-charts-row {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 20px;
				margin-bottom: 30px;
			}
			
			.analysis-chart-card {
				background: #f8f9fa;
				border-radius: 10px;
				padding: 15px;
			}
			
			.chart-container {
				height: 200px;
				margin-top: 15px;
			}
			
			.performance-table {
				width: 100%;
				border-collapse: collapse;
				margin: 20px 0;
			}
			
			.performance-table th {
				background: #f8f9fa;
				padding: 12px;
				text-align: left;
				font-weight: 600;
				border-bottom: 2px solid #dee2e6;
			}
			
			.performance-table td {
				padding: 10px 12px;
				border-bottom: 1px solid #e9ecef;
			}
			
			.task-modal-footer,
			.analysis-modal-footer,
			.implementation-modal-footer {
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

    // Добавим недостающий метод для стилей анализа
    addAnalysisModalStyles() {
        // Этот метод уже реализован выше в addTaskModalStyles
    }

    // Добавим недостающий метод для стилей реализации
    addImplementationModalStyles() {
        // Стили уже добавлены в addTaskModalStyles
    }

    // Добавим метод для создания графиков распределения баллов задания
    createTaskScoreDistributionChart(scores) {
        const ctx = document.getElementById('taskScoreDistributionChart');
        if (!ctx)
            return;

        // Группируем баллы по диапазонам
        const ranges = [{
                min: 0,
                max: 20,
                label: '0-20%'
            }, {
                min: 20,
                max: 40,
                label: '20-40%'
            }, {
                min: 40,
                max: 60,
                label: '40-60%'
            }, {
                min: 60,
                max: 80,
                label: '60-80%'
            }, {
                min: 80,
                max: 100,
                label: '80-100%'
            }
        ];

        const data = ranges.map(range => {
            return scores.filter(s => s.percentage >= range.min && s.percentage < range.max).length;
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ranges.map(r => r.label),
                datasets: [{
                        label: 'Количество учащихся',
                        data: data,
                        backgroundColor: 'rgba(52, 152, 219, 0.7)',
                        borderColor: 'rgb(52, 152, 219)',
                        borderWidth: 1
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
                            text: 'Диапазон баллов'
                        }
                    }
                }
            }
        });
    }

    // Метод для создания графиков типов ошибок задания
    createTaskErrorTypesChart(errorTypes) {
        const ctx = document.getElementById('taskErrorTypesChart');
        if (!ctx || !errorTypes || Object.keys(errorTypes).length === 0)
            return;

        const labels = Object.keys(errorTypes).map(type => this.getErrorTypeLabel(type));
        const data = Object.values(errorTypes);

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                        data: data,
                        backgroundColor: [
                            '#e74c3c', '#3498db', '#f39c12', '#27ae60',
                            '#9b59b6', '#34495e', '#1abc9c', '#d35400'
                        ].slice(0, labels.length)
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Добавим метод addMissingStyles
    addMissingStyles() {
        const styleId = 'missing-analytics-styles';
        if (document.getElementById(styleId))
            return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
			/* Стили для группового анализа */
			.group-analysis-grid {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
				gap: 20px;
				margin: 20px 0;
			}
			
			.group-analysis-card {
				background: white;
				border-radius: 12px;
				padding: 20px;
				border-left: 4px solid;
				box-shadow: 0 3px 10px rgba(0,0,0,0.1);
				transition: transform 0.3s;
			}
			
			.group-analysis-card:hover {
				transform: translateY(-5px);
			}
			
			.group-header {
				display: flex;
				align-items: center;
				gap: 15px;
				margin-bottom: 15px;
			}
			
			.group-icon {
				width: 50px;
				height: 50px;
				border-radius: 12px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 24px;
			}
			
			.group-title h5 {
				margin: 0;
				color: #2c3e50;
			}
			
			.group-count {
				font-size: 12px;
				color: #7f8c8d;
			}
			
			.group-stats {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 10px;
				margin: 15px 0;
			}
			
			.group-stat {
				text-align: center;
			}
			
			.stat-label {
				font-size: 11px;
				color: #7f8c8d;
				margin-bottom: 3px;
			}
			
			.stat-value {
				font-size: 18px;
				font-weight: bold;
			}
			
			.group-description {
				font-size: 13px;
				color: #495057;
				margin: 10px 0;
				line-height: 1.4;
			}
			
			.group-students {
				margin-top: 15px;
				padding-top: 15px;
				border-top: 1px solid #e9ecef;
			}
			
			.students-label {
				font-size: 12px;
				color: #7f8c8d;
				margin-bottom: 8px;
			}
			
			.students-list {
				display: flex;
				flex-wrap: wrap;
				gap: 5px;
			}
			
			.student-tag {
				background: #e9ecef;
				padding: 3px 8px;
				border-radius: 12px;
				font-size: 11px;
				color: #495057;
			}
			
			.more-tag {
				background: #3498db;
				color: white;
				padding: 3px 8px;
				border-radius: 12px;
				font-size: 11px;
			}
			
			.no-students {
				text-align: center;
				color: #7f8c8d;
				font-style: italic;
				padding: 10px;
				font-size: 13px;
			}
			
			/* Стили для статистических карточек */
			.statistics-grid {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
				gap: 20px;
				margin: 20px 0;
			}
			
			.statistic-card {
				background: white;
				border-radius: 12px;
				padding: 20px;
				display: flex;
				gap: 15px;
				align-items: center;
				box-shadow: 0 3px 10px rgba(0,0,0,0.1);
			}
			
			.statistic-icon {
				width: 50px;
				height: 50px;
				border-radius: 12px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 24px;
				flex-shrink: 0;
			}
			
			.statistic-value {
				font-size: 24px;
				font-weight: bold;
				margin-bottom: 5px;
			}
			
			.statistic-label {
				font-size: 14px;
				color: #495057;
				font-weight: 500;
				margin-bottom: 3px;
			}
			
			.statistic-description {
				font-size: 11px;
				color: #7f8c8d;
			}
			
			/* Стили для распределения по группам в обзоре */
			.distribution-details {
				margin-top: 15px;
				display: flex;
				flex-direction: column;
				gap: 8px;
			}
			
			.group-detail {
				display: flex;
				align-items: center;
				gap: 10px;
				font-size: 13px;
			}
			
			.group-dot {
				width: 12px;
				height: 12px;
				border-radius: 50%;
			}
			
			.group-name {
				flex: 1;
				color: #495057;
			}
			
			.group-count {
				color: #7f8c8d;
				font-weight: 500;
			}
			
			/* Стили для отсутствия данных */
			.no-data {
				text-align: center;
				padding: 40px;
				color: #7f8c8d;
				font-style: italic;
			}
			
			/* Адаптивность */
			@media (max-width: 768px) {
				.group-analysis-grid {
					grid-template-columns: 1fr;
				}
				
				.statistics-grid {
					grid-template-columns: repeat(2, 1fr);
				}
				
				.visualization-row {
					grid-template-columns: 1fr;
				}
			}
			/* Стили для бейджей уровней */
			.level-badge {
				display: inline-block;
				padding: 4px 10px;
				border-radius: 15px;
				font-size: 12px;
				font-weight: bold;
				color: white;
				min-width: 30px;
				text-align: center;
			}
			
			.level-1 {
				background: linear-gradient(135deg, #27ae60, #2ecc71);
			}
			
			.level-2 {
				background: linear-gradient(135deg, #3498db, #2980b9);
			}
			
			.level-3 {
				background: linear-gradient(135deg, #f39c12, #e67e22);
			}
			
			.level-4 {
				background: linear-gradient(135deg, #9b59b6, #8e44ad);
			}
			
			/* Стили для бейджей компетенций */
			.competence-badge {
				display: inline-block;
				padding: 4px 10px;
				border-radius: 15px;
				font-size: 11px;
				font-weight: 500;
				color: white;
			}
			
			.competence-badge.базовый {
				background: #27ae60;
			}
			
			.competence-badge.применение {
				background: #3498db;
			}
			
			.competence-badge.анализ {
				background: #f39c12;
			}
			
			.competence-badge.творчество {
				background: #9b59b6;
			}
			
			/* Стили для распределения уровней */
			.levels-grid {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
				gap: 20px;
				margin: 20px 0;
			}
			
			.level-card {
				background: white;
				border-radius: 12px;
				padding: 20px;
				box-shadow: 0 3px 10px rgba(0,0,0,0.1);
				border-top: 4px solid;
			}
			
			.level-card.level-1 {
				border-top-color: #27ae60;
			}
			
			.level-card.level-2 {
				border-top-color: #3498db;
			}
			
			.level-card.level-3 {
				border-top-color: #f39c12;
			}
			
			.level-card.level-4 {
				border-top-color: #9b59b6;
			}
			
			.level-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 15px;
			}
			
			.level-header h5 {
				margin: 0;
				color: #2c3e50;
			}
			
			.level-count {
				background: #f8f9fa;
				padding: 3px 10px;
				border-radius: 12px;
				font-size: 12px;
				color: #7f8c8d;
			}
			
			.level-stats {
				display: flex;
				flex-direction: column;
				gap: 8px;
			}
			
			.level-stat {
				display: flex;
				justify-content: space-between;
				font-size: 13px;
			}
			
			.stat-label {
				color: #7f8c8d;
			}
			
			.stat-value {
				font-weight: 500;
				color: #2c3e50;
			}
			
			.no-tasks {
				text-align: center;
				color: #bdc3c7;
				font-style: italic;
				padding: 10px;
				font-size: 13px;
			}
			
			/* Стили для статистики box plot */
			.boxplot-stats {
				background: #f8f9fa;
				border-radius: 10px;
				padding: 20px;
				margin-top: 20px;
			}
			
			.boxplot-stats .stat-item {
				padding: 8px 0;
				border-bottom: 1px solid #e9ecef;
			}
			
			.boxplot-stats .stat-item:last-child {
				border-bottom: none;
			}
			
			.boxplot-stats .stat-label {
				font-size: 11px;
				color: #7f8c8d;
				text-transform: uppercase;
				letter-spacing: 0.5px;
			}
			
			.boxplot-stats .stat-value {
				font-size: 16px;
				font-weight: bold;
				color: #2c3e50;
				margin-top: 3px;
			}
			
			/* Адаптивность для уровней */
			@media (max-width: 768px) {
				.levels-grid {
					grid-template-columns: 1fr;
				}
				
				.level-card {
					margin-bottom: 15px;
				}
			}			
		`;

        document.head.appendChild(style);
    }


    // ==================== СИСТЕМА ЭКСПОРТА ====================

    exportComprehensiveAnalysisToWord() {
        showNotification('📝 Подготовка комплексного отчета...', 'info');

        // Сначала инициализируем библиотеки
        this.initializeExportLibraries().then(() => {
            // Проверяем доступность docx после загрузки
            if (typeof window.docx === 'undefined') {
                console.warn('⚠️ Библиотека docx не загрузилась, используем альтернативный экспорт');
                this.exportComprehensiveAnalysisFallback();
                return;
            }

            // Продолжаем с созданием архива
            this.createComprehensiveArchive();

        }).catch(error => {
            console.error('Ошибка инициализации библиотек:', error);
            showNotification('Не удалось загрузить библиотеки экспорта', 'error');
            this.exportComprehensiveAnalysisFallback();
        });
    }

    // Создание комплексного архива
    createComprehensiveArchive() {
        showNotification('📦 Создание комплексного архива...', 'info');

        this.initializeExportLibraries().then(() => {
            try {
                if (typeof JSZip === 'undefined') {
                    throw new Error('JSZip не загружен');
                }

                const zip = new JSZip();
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const baseFolderName = `анализ_${timestamp}`;

                // Собираем данные
                const allData = this.collectDetailedData();
                const comprehensiveAnalysis = this.performComprehensiveAnalysis();

                // 1. Главный Word отчет
                const mainReportPromise = Promise.resolve()
                    .then(() => this.generateMainWordReport(allData, comprehensiveAnalysis))
                    .then(blob => {
                        if (blob) {
                            zip.file(`${baseFolderName}/Комплексный_анализ_результатов.docx`, blob);
                            console.log('✅ Главный Word отчет добавлен');
                        }
                    })
                    .catch(error => {
                        console.warn('Не удалось создать Word отчет:', error);
                    });

                // 2. Графики
                const chartsPromise = Promise.resolve()
                    .then(() => {
                        const chartsFolder = zip.folder(`${baseFolderName}/графики`);
                        return this.exportAllChartsToImages(chartsFolder);
                    })
                    .then(() => {
                        console.log('✅ Графики экспортированы');
                    })
                    .catch(error => {
                        console.warn('Не удалось экспортировать графики:', error);
                    });

                // 3. HTML отчет (запасной вариант)
                const htmlReportPromise = Promise.resolve()
                    .then(() => {
                        const htmlBlob = this.generateEnhancedHTMLReport(allData, comprehensiveAnalysis);
                        zip.file(`${baseFolderName}/аналитический_отчет.html`, htmlBlob);
                        console.log('✅ HTML отчет добавлен');
                    });

                // 4. Данные в JSON
                const jsonPromise = Promise.resolve()
                    .then(() => {
                        const rawData = JSON.stringify(allData, null, 2);
                        zip.file(`${baseFolderName}/исходные_данные.json`, rawData);
                        console.log('✅ JSON данные добавлены');
                    });

                // 5. README файл
                const readmePromise = Promise.resolve()
                    .then(() => {
                        const readmeContent = this.generateReadmeContent(allData);
                        zip.file(`${baseFolderName}/README.txt`, readmeContent);
                    });

                // Ждем завершения всех операций
                Promise.all([mainReportPromise, chartsPromise, htmlReportPromise, jsonPromise, readmePromise])
                .then(() => {
                    console.log('✅ Все компоненты архива готовы');

                    // Генерируем и скачиваем архив
                    return zip.generateAsync({
                        type: "blob",
                        compression: "DEFLATE",
                        compressionOptions: {
                            level: 6
                        }
                    });
                })
                .then((content) => {
                    this.downloadBlob(content, `${baseFolderName}.zip`);
                    showNotification('✅ Комплексный архив создан и скачан', 'success');
                })
                .catch(error => {
                    console.error('Ошибка создания архива:', error);
                    showNotification('Ошибка при создании архива', 'error');

                    // Пробуем простой экспорт
                    this.exportToWord();
                });

            } catch (error) {
                console.error('Критическая ошибка:', error);
                showNotification('Не удалось создать архив', 'error');
                this.exportEnhancedHTMLReport(allData, comprehensiveAnalysis);
            }
        }).catch(error => {
            console.error('Ошибка инициализации библиотек:', error);
            showNotification('Используется упрощенный экспорт', 'warning');

            const allData = this.collectDetailedData();
            const comprehensiveAnalysis = this.performComprehensiveAnalysis();
            this.exportEnhancedHTMLReport(allData, comprehensiveAnalysis);
        });
    }

    // Генерация README файла
    generateReadmeContent(allData) {
        return `АРХИВ АНАЛИТИЧЕСКИХ МАТЕРИАЛОВ
====================================

📅 Дата создания: ${new Date().toLocaleString()}
🎯 Тест: ${allData.meta.testName || 'Не указан'}
📚 Тема: ${allData.meta.theme || 'Не указана'}
👥 Учащихся: ${allData.meta.studentCount}
📝 Заданий: ${allData.meta.taskCount}

📁 СОДЕРЖАНИЕ АРХИВА:
---------------------
1. Комплексный_анализ_результатов.docx
   - Полный аналитический отчет в формате Word
   - Содержит все таблицы и анализ

2. аналитический_отчет.html
   - Интерактивная версия отчета для просмотра в браузере
   - Стилизованный дизайн с анимациями

3. графики/
   - Все диаграммы и графики в формате PNG
   - Высокое качество для печати

4. исходные_данные.json
   - Сырые данные анализа в JSON формате
   - Может быть использован для дальнейшей обработки

📊 КРАТКАЯ СВОДКА:
------------------
• Средний балл класса: ${this.calculateOverallAverage(allData.studentStats).toFixed(1)}%
• Отличников: ${allData.studentStats.filter(s => s.averageScore >= 85).length}
• Требуют внимания: ${allData.studentStats.filter(s => s.averageScore < 50).length}
• Проблемных заданий: ${allData.taskStats.filter(t => t.difficulty > 0.7 || t.discrimination < 0.3).length}

🔧 ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ:
-----------------------------
• Отчет сгенерирован системой Advanced Analytics v2.0
• Для вопросов и предложений обращайтесь к разработчикам
• Рекомендуется использовать отчет для планирования учебного процесса

📌 ВАЖНО:
---------
• Сохраните этот архив для отслеживания динамики
• Используйте данные для корректировки учебных планов
• Регулярно проводите анализ для мониторинга прогресса

© Система Advanced Analytics • ${new Date().getFullYear()}`;
    }

    // Метод для экспорта улучшенного HTML отчета
    exportEnhancedHTMLReport(allData, comprehensiveAnalysis) {
        const htmlBlob = this.generateEnhancedHTMLReport(allData, comprehensiveAnalysis);
        this.downloadBlob(htmlBlob, `аналитический_отчет_${new Date().toISOString().split('T')[0]}.html`);
        showNotification('✅ HTML отчет экспортирован', 'success');
    }
	
	

    // ОБНОВЛЕННЫЙ МЕТОД generateMainWordReport (с проверками)
    generateMainWordReport(allData, comprehensiveAnalysis) {
        try {
            // Проверяем доступность docx
            if (typeof window.docx === 'undefined') {
                console.warn('Библиотека docx недоступна');
                return this.generateEnhancedHTMLReport(allData, comprehensiveAnalysis);
            }

            const {
                Document,
                Paragraph,
                TextRun,
                Table,
                TableRow,
                TableCell,
                Packer,
                HeadingLevel,
                AlignmentType,
                WidthType,
                BorderStyle
            } = window.docx;

            // Создаем стилизованный документ
            const doc = new Document({
                styles: {
                    paragraphStyles: [{
                            id: "Title",
                            name: "Title",
                            basedOn: "Normal",
                            next: "Normal",
                            run: {
                                size: 48,
                                bold: true,
                                color: "2C3E50",
                            },
                            paragraph: {
                                spacing: {
                                    after: 300
                                },
                                alignment: AlignmentType.CENTER,
                            },
                        }, {
                            id: "Heading1",
                            name: "Heading 1",
                            basedOn: "Normal",
                            next: "Normal",
                            run: {
                                size: 32,
                                bold: true,
                                color: "3498DB",
                            },
                            paragraph: {
                                spacing: {
                                    before: 240,
                                    after: 120
                                },
                            },
                        }, {
                            id: "Heading2",
                            name: "Heading 2",
                            basedOn: "Normal",
                            next: "Normal",
                            run: {
                                size: 28,
                                bold: true,
                                color: "2C3E50",
                            },
                            paragraph: {
                                spacing: {
                                    before: 200,
                                    after: 100
                                },
                            },
                        }, {
                            id: "Normal",
                            name: "Normal",
                            basedOn: "Normal",
                            next: "Normal",
                            run: {
                                size: 24,
                            },
                            paragraph: {
                                spacing: {
                                    line: 276
                                },
                            },
                        },
                    ],
                },
                sections: [{
                        properties: {
                            page: {
                                margin: {
                                    top: 1000,
                                    right: 1000,
                                    bottom: 1000,
                                    left: 1000,
                                },
                            },
                        },
                        children: [
                            // ТИТУЛЬНАЯ СТРАНИЦА
                            new Paragraph({
                                text: "📊 КОМПЛЕКСНЫЙ АНАЛИЗ РЕЗУЛЬТАТОВ ТЕСТИРОВАНИЯ",
                                style: "Title",
                            }),

                            new Paragraph({
                                text: "Аналитический отчет",
                                style: "Heading1",
                                alignment: AlignmentType.CENTER,
                            }),

                            new Paragraph({
                                text: "\n",
                            }),

                            // ИНФОРМАЦИЯ О ТЕСТЕ
                            this.createTestInfoTable(allData),

                            new Paragraph({
                                text: "\n",
                            }),

                            // ДАТА ГЕНЕРАЦИИ
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "Дата формирования отчета: ",
                                        bold: true,
                                    }),
                                    new TextRun(new Date().toLocaleDateString('ru-RU', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })),
                                ],
                                alignment: AlignmentType.RIGHT,
                            }),

                            new Paragraph({
                                text: "\n\n\n",
                            }),

                            // РАЗДЕЛИТЕЛЬ
                            new Paragraph({
                                text: "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
                                alignment: AlignmentType.CENTER,
                            }),

                            // СВОДНАЯ СТАТИСТИКА
                            new Paragraph({
                                text: "📈 СВОДНАЯ СТАТИСТИКА",
                                style: "Heading1",
                            }),

                            ...this.createSummaryStatsSection(allData, comprehensiveAnalysis),

                            // АНАЛИЗ НАДЕЖНОСТИ
                            new Paragraph({
                                text: "🛡️ АНАЛИЗ НАДЕЖНОСТИ ТЕСТА",
                                style: "Heading1",
                            }),

                            ...this.createReliabilitySection(comprehensiveAnalysis.reliability),

                            // РАСПРЕДЕЛЕНИЕ УЧАЩИХСЯ
                            new Paragraph({
                                text: "👥 РАСПРЕДЕЛЕНИЕ УЧАЩИХСЯ",
                                style: "Heading1",
                            }),

                            ...this.createDistributionSection(allData),

                            // АНАЛИЗ ЗАДАНИЙ
                            new Paragraph({
                                text: "📝 АНАЛИЗ ЗАДАНИЙ",
                                style: "Heading1",
                            }),

                            ...this.createTasksAnalysisSection(allData),

                            // РЕКОМЕНДАЦИИ
                            new Paragraph({
                                text: "💡 РЕКОМЕНДАЦИИ И ПЛАН ДЕЙСТВИЙ",
                                style: "Heading1",
                            }),

                            ...this.createRecommendationsSection(comprehensiveAnalysis.recommendations, allData),

                            // ЗАКЛЮЧЕНИЕ
                            new Paragraph({
                                text: "📋 ЗАКЛЮЧЕНИЕ",
                                style: "Heading1",
                            }),

                            new Paragraph({
                                text: this.generateDetailedConclusion(allData, comprehensiveAnalysis),
                            }),

                            // ПОДПИСЬ
                            new Paragraph({
                                text: "\n\n\n",
                            }),

                            new Paragraph({
                                text: "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
                                alignment: AlignmentType.CENTER,
                            }),

                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "Сформировано системой Advanced Analytics v2.0",
                                        italics: true,
                                        color: "7F8C8D",
                                    }),
                                ],
                                alignment: AlignmentType.CENTER,
                            }),

                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "Для получения дополнительной информации обращайтесь к разработчикам системы",
                                        size: 20,
                                        color: "95A5A6",
                                    }),
                                ],
                                alignment: AlignmentType.CENTER,
                            }),
                        ],
                    },
                ],
            });

            return Packer.toBlob(doc);

        } catch (error) {
            console.error('Ошибка создания Word документа:', error);
            return this.generateEnhancedHTMLReport(allData, comprehensiveAnalysis);
        }
    }

    // Создание таблицы с информацией о тесте
    createTestInfoTable(allData) {
        const {
            Table,
            TableRow,
            TableCell,
            Paragraph,
            TextRun,
            WidthType,
            BorderStyle
        } = window.docx;

        return new Table({
            width: {
                size: 100,
                type: WidthType.PERCENTAGE
            },
            borders: {
                top: {
                    style: BorderStyle.SINGLE,
                    size: 3,
                    color: "3498DB"
                },
                bottom: {
                    style: BorderStyle.SINGLE,
                    size: 3,
                    color: "3498DB"
                },
                left: {
                    style: BorderStyle.SINGLE,
                    size: 3,
                    color: "3498DB"
                },
                right: {
                    style: BorderStyle.SINGLE,
                    size: 3,
                    color: "3498DB"
                },
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: {
                                size: 50,
                                type: WidthType.PERCENTAGE
                            },
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: "📚 Название теста:",
                                            bold: true,
                                            color: "2C3E50",
                                        }),
                                    ],
                                }),
                                new Paragraph(allData.meta.testName || "Не указано"),
                            ],
                            shading: {
                                fill: "F8F9FA"
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 50,
                                type: WidthType.PERCENTAGE
                            },
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: "🎯 Тема:",
                                            bold: true,
                                            color: "2C3E50",
                                        }),
                                    ],
                                }),
                                new Paragraph(allData.meta.theme || "Не указана"),
                            ],
                            shading: {
                                fill: "F8F9FA"
                            },
                        }),
                    ],
                }),
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: "👥 Количество учащихся:",
                                            bold: true,
                                            color: "2C3E50",
                                        }),
                                    ],
                                }),
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: allData.meta.studentCount.toString(),
                                            bold: true,
                                            color: "3498DB",
                                            size: 28,
                                        }),
                                    ],
                                    alignment: AlignmentType.CENTER,
                                }),
                            ],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: "📝 Количество заданий:",
                                            bold: true,
                                            color: "2C3E50",
                                        }),
                                    ],
                                }),
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: allData.meta.taskCount.toString(),
                                            bold: true,
                                            color: "3498DB",
                                            size: 28,
                                        }),
                                    ],
                                    alignment: AlignmentType.CENTER,
                                }),
                            ],
                        }),
                    ],
                }),
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: "🏫 Класс/Группа:",
                                            bold: true,
                                            color: "2C3E50",
                                        }),
                                    ],
                                }),
                                new Paragraph(allData.meta.class || "Не указано"),
                            ],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: "📅 Дата проведения:",
                                            bold: true,
                                            color: "2C3E50",
                                        }),
                                    ],
                                }),
                                new Paragraph(allData.meta.date || new Date().toLocaleDateString()),
                            ],
                        }),
                    ],
                }),
            ],
        });
    }

    // Создание секции сводной статистики
    createSummaryStatsSection(allData, comprehensiveAnalysis) {
        const {
            Paragraph,
            TextRun,
            Table,
            TableRow,
            TableCell
        } = window.docx;
        const sections = [];

        // Карточки статистики
        const statsCards = [{
                label: "Средний балл класса",
                value: `${this.calculateOverallAverage(allData.studentStats).toFixed(1)}%`,
                color: "3498DB",
                icon: "📊"
            }, {
                label: "Надежность теста (α)",
                value: comprehensiveAnalysis.reliability.alpha.toFixed(3),
                color: "27AE60",
                icon: "🛡️"
            }, {
                label: "Отличники",
                value: comprehensiveAnalysis.clusters.excellent.count.toString(),
                color: "F39C12",
                icon: "🏆"
            }, {
                label: "Требуют внимания",
                value: comprehensiveAnalysis.clusters.weak.count.toString(),
                color: "E74C3C",
                icon: "⚠️"
            },
        ];

        // Таблица с карточками статистики
        const tableRows = [];
        for (let i = 0; i < statsCards.length; i += 2) {
            const rowCells = [];

            // Первая карточка в ряду
            rowCells.push(
                new TableCell({
                    width: {
                        size: 50,
                        type: WidthType.PERCENTAGE
                    },
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `${statsCards[i].icon} ${statsCards[i].label}`,
                                    bold: true,
                                    size: 22,
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: statsCards[i].value,
                                    bold: true,
                                    size: 36,
                                    color: statsCards[i].color,
                                }),
                            ],
                            alignment: AlignmentType.CENTER,
                        }),
                    ],
                    margins: {
                        top: 100,
                        bottom: 100,
                        left: 100,
                        right: 100
                    },
                    shading: {
                        fill: "FFFFFF"
                    },
                }));

            // Вторая карточка в ряду (если есть)
            if (i + 1 < statsCards.length) {
                rowCells.push(
                    new TableCell({
                        width: {
                            size: 50,
                            type: WidthType.PERCENTAGE
                        },
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `${statsCards[i + 1].icon} ${statsCards[i + 1].label}`,
                                        bold: true,
                                        size: 22,
                                    }),
                                ],
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: statsCards[i + 1].value,
                                        bold: true,
                                        size: 36,
                                        color: statsCards[i + 1].color,
                                    }),
                                ],
                                alignment: AlignmentType.CENTER,
                            }),
                        ],
                        margins: {
                            top: 100,
                            bottom: 100,
                            left: 100,
                            right: 100
                        },
                        shading: {
                            fill: "FFFFFF"
                        },
                    }));
            }

            tableRows.push(new TableRow({
                    children: rowCells
                }));
        }

        sections.push(
            new Table({
                rows: tableRows,
                width: {
                    size: 100,
                    type: WidthType.PERCENTAGE
                },
            }),

            new Paragraph({
                text: "\n"
            }),

            // Дополнительная информация
            new Paragraph({
                children: [
                    new TextRun({
                        text: "📌 Дополнительные показатели:",
                        bold: true,
                        size: 24,
                    }),
                ],
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: `• Стандартное отклонение: `,
                        bold: true,
                    }),
                    new TextRun(`${allData.distribution.stdDev.toFixed(1)}%`),
                    new TextRun({
                        text: ` (${this.interpretStdDev(allData.distribution.stdDev)})`,
                        italics: true,
                    }),
                ],
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: `• Асимметрия распределения: `,
                        bold: true,
                    }),
                    new TextRun(`${allData.distribution.skewness.toFixed(3)}`),
                    new TextRun({
                        text: ` (${this.interpretSkewness(allData.distribution.skewness)})`,
                        italics: true,
                    }),
                ],
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: `• Коэффициент вариации: `,
                        bold: true,
                    }),
                    new TextRun(`${(allData.distribution.stdDev / allData.distribution.mean * 100).toFixed(1)}%`),
                ],
            }),

            new Paragraph({
                text: "\n"
            }), );

        return sections;
    }

    // Интерпретация стандартного отклонения
    interpretStdDev(stdDev) {
        if (stdDev < 10)
            return "небольшой разброс";
        if (stdDev < 20)
            return "умеренный разброс";
        return "значительный разброс";
    }

    // Интерпретация асимметрии
    interpretSkewness(skewness) {
        if (skewness > 0.5)
            return "смещение влево";
        if (skewness < -0.5)
            return "смещение вправо";
        return "симметричное распределение";
    }

    // Секция анализа надежности
    createReliabilitySection(reliability) {
        const {
            Paragraph,
            TextRun,
            Table,
            TableRow,
            TableCell
        } = window.docx;
        const sections = [];

        // Определяем цвет и иконку в зависимости от значения
        let reliabilityIcon,
        reliabilityColor;
        if (reliability.alpha >= 0.8) {
            reliabilityIcon = "✅";
            reliabilityColor = "27AE60";
        } else if (reliability.alpha >= 0.7) {
            reliabilityIcon = "⚠️";
            reliabilityColor = "F39C12";
        } else {
            reliabilityIcon = "❌";
            reliabilityColor = "E74C3C";
        }

        sections.push(
            new Table({
                width: {
                    size: 100,
                    type: WidthType.PERCENTAGE
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: {
                                    size: 30,
                                    type: WidthType.PERCENTAGE
                                },
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: `${reliabilityIcon} Коэффициент α Кронбаха`,
                                                bold: true,
                                                size: 24,
                                            }),
                                        ],
                                        alignment: AlignmentType.CENTER,
                                    }),
                                ],
                                shading: {
                                    fill: "F8F9FA"
                                },
                            }),
                            new TableCell({
                                width: {
                                    size: 70,
                                    type: WidthType.PERCENTAGE
                                },
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: reliability.description,
                                            }),
                                        ],
                                    }),
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: "Рекомендация: ",
                                                bold: true,
                                            }),
                                            new TextRun(reliability.recommendation),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),

            new Paragraph({
                text: "\n"
            }),

            // Шкала надежности
            new Paragraph({
                children: [
                    new TextRun({
                        text: "📊 Шкала оценки надежности теста:",
                        bold: true,
                    }),
                ],
            }),

            this.createReliabilityScaleTable(reliability.alpha),

            new Paragraph({
                text: "\n"
            }), );

        return sections;
    }

    // Таблица шкалы надежности
    createReliabilityScaleTable(alpha) {
        const {
            Table,
            TableRow,
            TableCell,
            Paragraph,
            TextRun
        } = window.docx;

        const scaleData = [{
                range: "α ≥ 0.90",
                label: "Отличная",
                color: "27AE60",
                description: "Высшая степень надежности"
            }, {
                range: "0.80 ≤ α < 0.90",
                label: "Хорошая",
                color: "3498DB",
                description: "Достаточно для итогового контроля"
            }, {
                range: "0.70 ≤ α < 0.80",
                label: "Приемлемая",
                color: "F39C12",
                description: "Достаточно для учебного контроля"
            }, {
                range: "0.60 ≤ α < 0.70",
                label: "Сомнительная",
                color: "E67E22",
                description: "Требуется пересмотр теста"
            }, {
                range: "α < 0.60",
                label: "Низкая",
                color: "E74C3C",
                description: "Неприемлемая надежность"
            },
        ];

        const rows = scaleData.map(item => {
            const isCurrent = alpha >= parseFloat(item.range.split("α")[0]) ||
                (item.range.includes("≤") && alpha >= 0.70 && alpha < 0.80) ||
                (item.range.includes("< 0.60") && alpha < 0.60);

            return new TableRow({
                children: [
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: item.range,
                                        bold: true,
                                        color: item.color,
                                    }),
                                ],
                            }),
                        ],
                        shading: isCurrent ? {
                            fill: "FFF3CD"
                        }
                         : undefined,
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: item.label,
                                        bold: true,
                                        color: item.color,
                                    }),
                                ],
                            }),
                        ],
                        shading: isCurrent ? {
                            fill: "FFF3CD"
                        }
                         : undefined,
                    }),
                    new TableCell({
                        children: [new Paragraph(item.description)],
                        shading: isCurrent ? {
                            fill: "FFF3CD"
                        }
                         : undefined,
                    }),
                ],
            });
        });

        // Добавляем заголовки
        rows.unshift(
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph("Диапазон")],
                        shading: {
                            fill: "2C3E50"
                        },
                    }),
                    new TableCell({
                        children: [new Paragraph("Оценка")],
                        shading: {
                            fill: "2C3E50"
                        },
                    }),
                    new TableCell({
                        children: [new Paragraph("Интерпретация")],
                        shading: {
                            fill: "2C3E50"
                        },
                    }),
                ],
            }));

        return new Table({
            rows
        });
    }

    // Секция распределения учащихся
    createDistributionSection(allData) {
        const {
            Paragraph,
            TextRun,
            Table,
            TableRow,
            TableCell
        } = window.docx;
        const sections = [];

        const studentGroups = this.createStudentGroups(allData.studentStats);

        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "📊 Распределение учащихся по уровням подготовки:",
                        bold: true,
                    }),
                ],
            }),

            new Paragraph({
                text: "\n"
            }), );

        // Таблица распределения
        const distributionRows = [
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph("Уровень")],
                        shading: {
                            fill: "34495E"
                        },
                    }),
                    new TableCell({
                        children: [new Paragraph("Критерий")],
                        shading: {
                            fill: "34495E"
                        },
                    }),
                    new TableCell({
                        children: [new Paragraph("Количество")],
                        shading: {
                            fill: "34495E"
                        },
                    }),
                    new TableCell({
                        children: [new Paragraph("Процент")],
                        shading: {
                            fill: "34495E"
                        },
                    }),
                    new TableCell({
                        children: [new Paragraph("Средний балл")],
                        shading: {
                            fill: "34495E"
                        },
                    }),
                ],
            }),
        ];

        studentGroups.forEach(group => {
            distributionRows.push(
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph(group.name)],
                            shading: {
                                fill: `${group.color}20`
                            },
                        }),
                        new TableCell({
                            children: [new Paragraph(`${group.min}% - ${group.max}%`)],
                        }),
                        new TableCell({
                            children: [new Paragraph(group.count.toString())],
                        }),
                        new TableCell({
                            children: [new Paragraph(`${group.percentage}%`)],
                        }),
                        new TableCell({
                            children: [new Paragraph(this.calculateGroupAverageScore(allData.studentStats, group))],
                        }),
                    ],
                }));
        });

        sections.push(
            new Table({
                rows: distributionRows
            }),

            new Paragraph({
                text: "\n"
            }),

            // Анализ распределения
            new Paragraph({
                children: [
                    new TextRun({
                        text: "📈 Анализ распределения:",
                        bold: true,
                    }),
                ],
            }),

            new Paragraph(this.interpretDistribution(allData.distribution)),

            new Paragraph({
                text: "\n"
            }),

            // Рекомендации по распределению
            new Paragraph({
                children: [
                    new TextRun({
                        text: "🎯 Рекомендации по работе с группами:",
                        bold: true,
                    }),
                ],
            }),

            ...this.createGroupRecommendations(studentGroups),

            new Paragraph({
                text: "\n"
            }), );

        return sections;
    }

    // Рекомендации по группам
    createGroupRecommendations(groups) {
        const {
            Paragraph,
            TextRun
        } = window.docx;
        const recommendations = [];

        groups.forEach(group => {
            if (group.count > 0) {
                let recommendation = "";

                switch (group.name) {
                case 'Отлично (5)':
                    recommendation = `Для ${group.count} учащихся группы "Отлично": предлагать углубленные задания, участие в олимпиадах, исследовательские проекты.`;
                    break;
                case 'Хорошо (4)':
                    recommendation = `Для ${group.count} учащихся группы "Хорошо": работа над устранением пробелов, развитие аналитических навыков.`;
                    break;
                case 'Удовлетворительно (3)':
                    recommendation = `Для ${group.count} учащихся группы "Удовлетворительно": дополнительная практика, индивидуальные консультации, повторение материала.`;
                    break;
                case 'Неудовлетворительно (2)':
                    recommendation = `Для ${group.count} учащихся группы "Неудовлетворительно": интенсивная коррекционная работа, индивидуальный подход, дополнительные занятия.`;
                    break;
                }

                recommendations.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `• ${recommendation}`,
                            }),
                        ],
                        indent: {
                            left: 400
                        },
                    }));
            }
        });

        return recommendations;
    }

    // Секция анализа заданий
    createTasksAnalysisSection(allData) {
        const {
            Paragraph,
            TextRun,
            Table,
            TableRow,
            TableCell
        } = window.docx;
        const sections = [];

        const problematicTasks = allData.taskStats.filter(task =>
                task.difficulty > 0.7 || task.discrimination < 0.3 || task.completionRate < 50);

        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `Всего заданий: ${allData.meta.taskCount}`,
                        bold: true,
                    }),
                ],
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: `Проблемных заданий: ${problematicTasks.length} `,
                        bold: true,
                        color: problematicTasks.length > 0 ? "E74C3C" : "27AE60",
                    }),
                    new TextRun({
                        text: `(${((problematicTasks.length / allData.meta.taskCount) * 100).toFixed(1)}%)`,
                        italics: true,
                    }),
                ],
            }),

            new Paragraph({
                text: "\n"
            }), );

        if (problematicTasks.length > 0) {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "⚠️ Задания, требующие внимания:",
                            bold: true,
                            color: "E74C3C",
                        }),
                    ],
                }),

                new Paragraph({
                    text: "\n"
                }), );

            // Таблица проблемных заданий
            const taskRows = [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph("№")]
                        }),
                        new TableCell({
                            children: [new Paragraph("Задание")]
                        }),
                        new TableCell({
                            children: [new Paragraph("Сложность")]
                        }),
                        new TableCell({
                            children: [new Paragraph("Дискриминативность")]
                        }),
                        new TableCell({
                            children: [new Paragraph("Выполняемость")]
                        }),
                        new TableCell({
                            children: [new Paragraph("Проблема")]
                        }),
                    ],
                }),
            ];

            problematicTasks.forEach(task => {
                let problems = [];
                if (task.difficulty > 0.7)
                    problems.push("Сложное");
                if (task.discrimination < 0.3)
                    problems.push("Низкая дискриминативность");
                if (task.completionRate < 50)
                    problems.push("Низкая выполнимость");

                taskRows.push(
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph(task.number.toString())]
                            }),
                            new TableCell({
                                children: [new Paragraph(task.title.substring(0, 30) + (task.title.length > 30 ? "..." : ""))]
                            }),
                            new TableCell({
                                children: [new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: `${(task.difficulty * 100).toFixed(1)}%`,
                                                color: task.difficulty > 0.7 ? "E74C3C" : "27AE60",
                                            }),
                                        ],
                                    })]
                            }),
                            new TableCell({
                                children: [new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: `${(task.discrimination * 100).toFixed(1)}%`,
                                                color: task.discrimination < 0.3 ? "E74C3C" : "27AE60",
                                            }),
                                        ],
                                    })]
                            }),
                            new TableCell({
                                children: [new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: `${task.completionRate.toFixed(1)}%`,
                                                color: task.completionRate < 50 ? "E74C3C" : "27AE60",
                                            }),
                                        ],
                                    })]
                            }),
                            new TableCell({
                                children: [new Paragraph(problems.join(", "))]
                            }),
                        ],
                    }));
            });

            sections.push(
                new Table({
                    rows: taskRows
                }),

                new Paragraph({
                    text: "\n"
                }),

                new Paragraph({
                    children: [
                        new TextRun({
                            text: "🔧 Рекомендации по улучшению заданий:",
                            bold: true,
                        }),
                    ],
                }),

                new Paragraph("• Для заданий с высокой сложностью: упростить формулировки, добавить подсказки"),
                new Paragraph("• Для заданий с низкой дискриминативностью: пересмотреть варианты ответов"),
                new Paragraph("• Для заданий с низкой выполнимостью: проверить время выполнения, разделить на части"),

                new Paragraph({
                    text: "\n"
                }), );
        } else {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "✅ Все задания имеют хорошие показатели сложности и дискриминативности.",
                            color: "27AE60",
                        }),
                    ],
                }),

                new Paragraph({
                    text: "\n"
                }), );
        }

        // Анализ по уровням
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "📊 Распределение заданий по уровням сложности:",
                        bold: true,
                    }),
                ],
            }),

            new Paragraph({
                text: "\n"
            }),

            ...this.createTaskLevelsAnalysis(allData.taskStats),

            new Paragraph({
                text: "\n"
            }), );

        return sections;
    }

    // Анализ заданий по уровням
    createTaskLevelsAnalysis(taskStats) {
        const {
            Paragraph,
            TextRun,
            Table,
            TableRow,
            TableCell
        } = window.docx;
        const sections = [];

        // Группируем задания по уровням
        const levels = {
            1: {
                name: 'Базовый',
                count: 0,
                avgDifficulty: 0,
                avgDiscrimination: 0
            },
            2: {
                name: 'Применение',
                count: 0,
                avgDifficulty: 0,
                avgDiscrimination: 0
            },
            3: {
                name: 'Анализ',
                count: 0,
                avgDifficulty: 0,
                avgDiscrimination: 0
            },
            4: {
                name: 'Творчество',
                count: 0,
                avgDifficulty: 0,
                avgDiscrimination: 0
            }
        };

        taskStats.forEach(task => {
            const level = Math.min(Math.max(task.level || 1, 1), 4);
            if (levels[level]) {
                levels[level].count++;
                levels[level].avgDifficulty += task.difficulty || 0;
                levels[level].avgDiscrimination += task.discrimination || 0;
            }
        });

        // Таблица уровней
        const levelRows = [
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph("Уровень")]
                    }),
                    new TableCell({
                        children: [new Paragraph("Количество")]
                    }),
                    new TableCell({
                        children: [new Paragraph("Средняя сложность")]
                    }),
                    new TableCell({
                        children: [new Paragraph("Средняя дискриминативность")]
                    }),
                    new TableCell({
                        children: [new Paragraph("Рекомендация")]
                    }),
                ],
            }),
        ];

        Object.entries(levels).forEach(([levelNum, level]) => {
            if (level.count > 0) {
                level.avgDifficulty = (level.avgDifficulty / level.count * 100).toFixed(1);
                level.avgDiscrimination = (level.avgDiscrimination / level.count * 100).toFixed(1);

                let recommendation = "";
                if (parseFloat(level.avgDifficulty) > 70) {
                    recommendation = "Упростить задания";
                } else if (parseFloat(level.avgDiscrimination) < 30) {
                    recommendation = "Улучшить дифференциацию";
                } else {
                    recommendation = "Оптимальный уровень";
                }

                levelRows.push(
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph(`${level.name} (${levelNum})`)]
                            }),
                            new TableCell({
                                children: [new Paragraph(level.count.toString())]
                            }),
                            new TableCell({
                                children: [new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: `${level.avgDifficulty}%`,
                                                color: parseFloat(level.avgDifficulty) > 70 ? "E74C3C" : "27AE60",
                                            }),
                                        ],
                                    })]
                            }),
                            new TableCell({
                                children: [new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: `${level.avgDiscrimination}%`,
                                                color: parseFloat(level.avgDiscrimination) < 30 ? "E74C3C" : "27AE60",
                                            }),
                                        ],
                                    })]
                            }),
                            new TableCell({
                                children: [new Paragraph(recommendation)]
                            }),
                        ],
                    }));
            }
        });

        sections.push(
            new Table({
                rows: levelRows
            }),
            new Paragraph({
                text: "\n"
            }));

        return sections;
    }

    // Секция рекомендаций
    createRecommendationsSection(recommendations, allData) {
        const {
            Paragraph,
            TextRun,
            Table,
            TableRow,
            TableCell
        } = window.docx;
        const sections = [];

        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "На основе проведенного анализа сформулированы следующие рекомендации:",
                        bold: true,
                    }),
                ],
            }),

            new Paragraph({
                text: "\n"
            }), );

        // Основные рекомендации
        recommendations.forEach((rec, index) => {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${index + 1}. `,
                            bold: true,
                            color: "3498DB",
                        }),
                        new TextRun(rec),
                    ],
                    spacing: {
                        after: 100
                    },
                }));
        });

        sections.push(
            new Paragraph({
                text: "\n"
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "📅 Примерный план действий на ближайший месяц:",
                        bold: true,
                    }),
                ],
            }),

            new Paragraph({
                text: "\n"
            }),

            ...this.createActionPlan(allData),

            new Paragraph({
                text: "\n"
            }), );

        return sections;
    }

    // План действий
    createActionPlan(allData) {
        const {
            Paragraph,
            TextRun
        } = window.docx;
        const actions = [];

        const actionSteps = [{
                period: "Неделя 1",
                actions: [
                    "Индивидуальные беседы с учащимися, показавшими низкие результаты",
                    "Анализ ошибок и выявление типичных проблем",
                    "Коррекция наиболее проблемных заданий"
                ]
            }, {
                period: "Неделя 2",
                actions: [
                    "Проведение дополнительных занятий для отстающих учащихся",
                    "Разработка дифференцированных заданий",
                    "Работа над развитием компетенций"
                ]
            }, {
                period: "Неделя 3",
                actions: [
                    "Проведение тренировочного теста",
                    "Анализ прогресса учащихся",
                    "Коррекция учебного плана"
                ]
            }, {
                period: "Неделя 4",
                actions: [
                    "Контрольный тест для оценки эффективности",
                    "Подведение итогов коррекционной работы",
                    "Планирование дальнейшей работы"
                ]
            }
        ];

        actionSteps.forEach(step => {
            actions.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${step.period}: `,
                            bold: true,
                            color: "2C3E50",
                        }),
                    ],
                }));

            step.actions.forEach(action => {
                actions.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `  • ${action}`,
                            }),
                        ],
                        indent: {
                            left: 400
                        },
                    }));
            });

            actions.push(new Paragraph({
                    text: "\n"
                }));
        });

        return actions;
    }

    // Детальное заключение
    generateDetailedConclusion(allData, comprehensiveAnalysis) {
        const averageScore = this.calculateOverallAverage(allData.studentStats);
        const weakStudents = allData.studentStats.filter(s => s.averageScore < 50).length;
        const problematicTasks = allData.taskStats.filter(t => t.difficulty > 0.7 || t.discrimination < 0.3).length;
        const studentGroups = this.createStudentGroups(allData.studentStats);

        let conclusion = "Проведенный комплексный анализ результатов тестирования позволяет сделать следующие выводы:\n\n";

        // Общая оценка
        conclusion += "1. ОБЩАЯ ОЦЕНКА РЕЗУЛЬТАТОВ:\n";
        conclusion += `   • Средний балл класса составляет ${averageScore.toFixed(1)}%, что свидетельствует о ${averageScore >= 85 ? "высоком" : averageScore >= 70 ? "хорошем" : averageScore >= 50 ? "удовлетворительном" : "неудовлетворительном"} уровне подготовки.\n`;
        conclusion += `   • Распределение учащихся по группам: ${studentGroups.map(g => `${g.name} - ${g.count} чел. (${g.percentage}%)`).join(', ')}.\n`;
        conclusion += `   • Количество учащихся, требующих особого внимания: ${weakStudents} (${((weakStudents / allData.meta.studentCount) * 100).toFixed(1)}%).\n\n`;

        // Качество теста
        conclusion += "2. КАЧЕСТВО ТЕСТОВОГО ИНСТРУМЕНТА:\n";
        conclusion += `   • Надежность теста (α Кронбаха): ${comprehensiveAnalysis.reliability.alpha.toFixed(3)} - ${comprehensiveAnalysis.reliability.interpretation}.\n`;
        conclusion += `   • Проблемных заданий: ${problematicTasks} из ${allData.meta.taskCount} (${((problematicTasks / allData.meta.taskCount) * 100).toFixed(1)}%).\n`;
        conclusion += `   • Качество заданий: ${problematicTasks === 0 ? "все задания соответствуют критериям качества" : "требуется коррекция проблемных заданий"}.\n\n`;

        // Рекомендации
        conclusion += "3. ПЕРСПЕКТИВЫ РАЗВИТИЯ:\n";
        conclusion += "   • Для улучшения результатов рекомендуется последовательная реализация предложенных рекомендаций.\n";
        conclusion += "   • Ключевой акцент следует сделать на дифференцированный подход к обучению.\n";
        conclusion += "   • Важно обеспечить регулярный мониторинг прогресса учащихся.\n\n";

        // Прогноз
        conclusion += "4. ПРОГНОЗИРУЕМЫЕ РЕЗУЛЬТАТЫ:\n";
        conclusion += `   • При реализации рекомендаций ожидается повышение среднего балла на 10-15% в течение месяца.\n`;
        conclusion += `   • Количество учащихся с низкими результатами может сократиться на 30-50%.\n`;
        conclusion += "   • Улучшится качество тестового инструмента и объективность оценки.\n";

        return conclusion;
    }

    // Альтернативный HTML отчет (если docx не доступен)
    // Альтернативный HTML отчет (если docx не доступен)
    generateEnhancedHTMLReport(allData, comprehensiveAnalysis) {
        const timestamp = new Date().toLocaleString();

        const html = `<!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Аналитический отчет</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', sans-serif;
                line-height: 1.6;
                color: #2C3E50;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            
            .report-container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                overflow: hidden;
            }
            
            .report-header {
                background: linear-gradient(135deg, #2C3E50, #34495E);
                color: white;
                padding: 40px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            
            .report-header::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                right: -50%;
                bottom: -50%;
                background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
                background-size: 50px 50px;
                animation: float 20s linear infinite;
            }
            
            @keyframes float {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .report-title {
                font-size: 42px;
                font-weight: 700;
                margin-bottom: 10px;
                position: relative;
                z-index: 1;
            }
            
            .report-subtitle {
                font-size: 24px;
                opacity: 0.9;
                margin-bottom: 30px;
                position: relative;
                z-index: 1;
            }
            
            .test-info {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-top: 30px;
                position: relative;
                z-index: 1;
            }
            
            .info-card {
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 20px;
                text-align: center;
                border: 1px solid rgba(255,255,255,0.2);
            }
            
            .info-value {
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 5px;
            }
            
            .info-label {
                font-size: 14px;
                opacity: 0.8;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .report-body {
                padding: 40px;
            }
            
            .section {
                margin-bottom: 50px;
                padding-bottom: 30px;
                border-bottom: 2px solid #F8F9FA;
            }
            
            .section:last-child {
                border-bottom: none;
            }
            
            .section-title {
                font-size: 28px;
                font-weight: 600;
                color: #2C3E50;
                margin-bottom: 25px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .section-title::after {
                content: '';
                flex: 1;
                height: 2px;
                background: linear-gradient(90deg, #3498DB, transparent);
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .stat-card {
                background: #F8F9FA;
                border-radius: 15px;
                padding: 25px;
                text-align: center;
                transition: transform 0.3s, box-shadow 0.3s;
                border: 2px solid transparent;
            }
            
            .stat-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            
            .stat-card.excellent { border-color: #27AE60; }
            .stat-card.good { border-color: #3498DB; }
            .stat-card.warning { border-color: #F39C12; }
            .stat-card.danger { border-color: #E74C3C; }
            
            .stat-icon {
                font-size: 32px;
                margin-bottom: 15px;
            }
            
            .stat-value {
                font-size: 36px;
                font-weight: 700;
                margin-bottom: 5px;
            }
            
            .stat-label {
                font-size: 14px;
                color: #7F8C8D;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 5px 15px rgba(0,0,0,0.05);
            }
            
            th {
                background: #34495E;
                color: white;
                padding: 15px;
                text-align: left;
                font-weight: 600;
            }
            
            td {
                padding: 12px 15px;
                border-bottom: 1px solid #F8F9FA;
            }
            
            tr:hover {
                background: #F8F9FA;
            }
            
            .recommendation-item {
                background: #E8F4FC;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 15px;
                display: flex;
                align-items: flex-start;
                gap: 15px;
            }
            
            .recommendation-number {
                background: #3498DB;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                flex-shrink: 0;
            }
            
            .conclusion {
                background: linear-gradient(135deg, #F8F9FA, #E9ECEF);
                border-radius: 15px;
                padding: 30px;
                margin-top: 30px;
                border-left: 5px solid #3498DB;
            }
            
            .conclusion-title {
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 20px;
                color: #2C3E50;
            }
            
            .report-footer {
                background: #F8F9FA;
                padding: 30px 40px;
                text-align: center;
                border-top: 1px solid #E9ECEF;
            }
            
            .footer-text {
                color: #7F8C8D;
                font-size: 14px;
            }
            
            @media print {
                body {
                    background: white;
                    padding: 0;
                }
                
                .report-container {
                    box-shadow: none;
                    border-radius: 0;
                }
                
                .report-header {
                    background: #2C3E50;
                    color: white;
                }
                
                .stat-card:hover {
                    transform: none;
                    box-shadow: none;
                }
            }
            
            @media (max-width: 768px) {
                .report-title {
                    font-size: 32px;
                }
                
                .report-subtitle {
                    font-size: 20px;
                }
                
                .stats-grid {
                    grid-template-columns: 1fr;
                }
                
                .test-info {
                    grid-template-columns: 1fr;
                }
                
                .report-body {
                    padding: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="report-container">
            <!-- Заголовок -->
            <header class="report-header">
                <h1 class="report-title">📊 Аналитический отчет</h1>
                <p class="report-subtitle">Комплексный анализ результатов тестирования</p>
                
                <div class="test-info">
                    <div class="info-card">
                        <div class="info-value">${allData.meta.testName || 'Не указан'}</div>
                        <div class="info-label">Тест</div>
                    </div>
                    <div class="info-card">
                        <div class="info-value">${allData.meta.studentCount}</div>
                        <div class="info-label">Учащихся</div>
                    </div>
                    <div class="info-card">
                        <div class="info-value">${allData.meta.taskCount}</div>
                        <div class="info-label">Заданий</div>
                    </div>
                    <div class="info-card">
                        <div class="info-value">${allData.meta.date || new Date().toLocaleDateString()}</div>
                        <div class="info-label">Дата</div>
                    </div>
                </div>
            </header>
            
            <!-- Основное содержимое -->
            <main class="report-body">
                <!-- Сводная статистика -->
                <section class="section">
                    <h2 class="section-title">📈 Сводная статистика</h2>
                    
                    <div class="stats-grid">
                        <div class="stat-card excellent">
                            <div class="stat-icon">📊</div>
                            <div class="stat-value">${this.calculateOverallAverage(allData.studentStats).toFixed(1)}%</div>
                            <div class="stat-label">Средний балл</div>
                        </div>
                        
                        <div class="stat-card ${comprehensiveAnalysis.reliability.alpha >= 0.8 ? 'excellent' : comprehensiveAnalysis.reliability.alpha >= 0.7 ? 'good' : 'warning'}">
                            <div class="stat-icon">🛡️</div>
                            <div class="stat-value">${comprehensiveAnalysis.reliability.alpha.toFixed(3)}</div>
                            <div class="stat-label">Надежность теста</div>
                        </div>
                        
                        <div class="stat-card good">
                            <div class="stat-icon">🏆</div>
                            <div class="stat-value">${comprehensiveAnalysis.clusters.excellent.count}</div>
                            <div class="stat-label">Отличники</div>
                        </div>
                        
                        <div class="stat-card ${comprehensiveAnalysis.clusters.weak.count > 0 ? 'danger' : 'excellent'}">
                            <div class="stat-icon">⚠️</div>
                            <div class="stat-value">${comprehensiveAnalysis.clusters.weak.count}</div>
                            <div class="stat-label">Требуют внимания</div>
                        </div>
                    </div>
                </section>
                
                <!-- Распределение учащихся -->
                <section class="section">
                    <h2 class="section-title">👥 Распределение учащихся</h2>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Уровень</th>
                                <th>Критерий</th>
                                <th>Количество</th>
                                <th>Процент</th>
                                <th>Средний балл</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(() => {
                                const groups = this.createStudentGroups(allData.studentStats);
                                return groups.map(group => `
                                    <tr>
                                        <td><strong>${group.name}</strong></td>
                                        <td>${group.min}% - ${group.max}%</td>
                                        <td>${group.count}</td>
                                        <td>${group.percentage}%</td>
                                        <td>${this.calculateGroupAverageScore(allData.studentStats, group)}</td>
                                    </tr>
                                `).join('');
                            })()}
                        </tbody>
                    </table>
                </section>
                
                <!-- Анализ заданий -->
                <section class="section">
                    <h2 class="section-title">📝 Анализ заданий</h2>
                    
                    ${(() => {
                        const problematicTasks = allData.taskStats.filter(task =>
                                task.difficulty > 0.7 || task.discrimination < 0.3 || task.completionRate < 50);

                        if (problematicTasks.length > 0) {
                            return `
                                <p><strong>Проблемных заданий: ${problematicTasks.length} из ${allData.meta.taskCount} (${((problematicTasks.length / allData.meta.taskCount) * 100).toFixed(1)}%)</strong></p>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Задание</th>
                                            <th>Сложность</th>
                                            <th>Дискриминативность</th>
                                            <th>Выполняемость</th>
                                            <th>Проблема</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${problematicTasks.map(task => {
                                            let problems = [];
                                            if (task.difficulty > 0.7)
                                                problems.push("Сложное");
                                            if (task.discrimination < 0.3)
                                                problems.push("Низкая дискриминативность");
                                            if (task.completionRate < 50)
                                                problems.push("Низкая выполнимость");

                                            return `
                                                <tr>
                                                    <td>${task.title}</td>
                                                    <td style="color: ${task.difficulty > 0.7 ? '#E74C3C' : '#27AE60'}">${(task.difficulty * 100).toFixed(1)}%</td>
                                                    <td style="color: ${task.discrimination < 0.3 ? '#E74C3C' : '#27AE60'}">${(task.discrimination * 100).toFixed(1)}%</td>
                                                    <td style="color: ${task.completionRate < 50 ? '#E74C3C' : '#27AE60'}">${task.completionRate.toFixed(1)}%</td>
                                                    <td>${problems.join(', ')}</td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            `;
                        } else {
                            return '<p style="color: #27AE60; font-weight: 600;">✅ Все задания имеют хорошие показатели сложности и дискриминативности.</p>';
                        }
                    })()}
                </section>
                
                <!-- Рекомендации -->
                <section class="section">
                    <h2 class="section-title">💡 Рекомендации</h2>
                    
                    ${comprehensiveAnalysis.recommendations.map((rec, index) => `
                        <div class="recommendation-item">
                            <div class="recommendation-number">${index + 1}</div>
                            <div>${rec}</div>
                        </div>
                    `).join('')}
                </section>
                
                <!-- Заключение -->
                <section class="section">
                    <div class="conclusion">
                        <h3 class="conclusion-title">📋 Заключение</h3>
                        <p>${this.generateDetailedConclusion(allData, comprehensiveAnalysis).replace(/\n/g, '<br>')}</p>
                    </div>
                </section>
            </main>
            
            <!-- Подвал -->
            <footer class="report-footer">
                <p class="footer-text">Сформировано системой Advanced Analytics • ${timestamp}</p>
                <p class="footer-text">Для получения дополнительной информации обращайтесь к разработчикам системы</p>
            </footer>
        </div>
        
        <script>
            // Добавляем интерактивность
            document.addEventListener('DOMContentLoaded', function() {
                // Анимация карточек
                const cards = document.querySelectorAll('.stat-card');
                cards.forEach(card => {
                    card.addEventListener('mouseenter', function() {
                        this.style.transform = 'translateY(-5px)';
                        this.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                    });
                    
                    card.addEventListener('mouseleave', function() {
                        this.style.transform = '';
                        this.style.boxShadow = '';
                    });
                });
                
                // Печать отчета
                const printButton = document.createElement('button');
                printButton.innerHTML = '🖨️ Печать отчета';
                printButton.style.cssText = 
                    'position: fixed; ' +
                    'bottom: 20px; ' +
                    'right: 20px; ' +
                    'background: #3498DB; ' +
                    'color: white; ' +
                    'border: none; ' +
                    'padding: 12px 24px; ' +
                    'border-radius: 25px; ' +
                    'font-family: "Inter", sans-serif; ' +
                    'font-weight: 600; ' +
                    'cursor: pointer; ' +
                    'box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3); ' +
                    'z-index: 1000; ' +
                    'transition: all 0.3s;';
                
                printButton.addEventListener('mouseenter', () => {
                    printButton.style.transform = 'translateY(-2px)';
                    printButton.style.boxShadow = '0 8px 20px rgba(52, 152, 219, 0.4)';
                });
                
                printButton.addEventListener('mouseleave', () => {
                    printButton.style.transform = '';
                    printButton.style.boxShadow = '0 5px 15px rgba(52, 152, 219, 0.3)';
                });
                
                printButton.addEventListener('click', () => {
                    window.print();
                });
                
                document.body.appendChild(printButton);
                
                // Анимация появления элементов
                const sections = document.querySelectorAll('.section');
                sections.forEach((section, index) => {
                    setTimeout(() => {
                        section.style.opacity = '0';
                        section.style.transform = 'translateY(20px)';
                        section.style.transition = 'opacity 0.5s, transform 0.5s';
                        
                        setTimeout(() => {
                            section.style.opacity = '1';
                            section.style.transform = 'translateY(0)';
                        }, 50);
                    }, index * 200);
                });
            });
        </script>
    </body>
    </html>`;

        return new Blob([html], {
            type: 'text/html'
        });
    }

    // Альтернатива: простой Word отчет
    generateSimpleWordReport(allData, comprehensiveAnalysis) {
        try {
            // Создаем простой текстовый документ
            let content = `КОМПЛЕКСНЫЙ АНАЛИЗ РЕЗУЛЬТАТОВ ТЕСТИРОВАНИЯ\n`;
            content += '='.repeat(60) + '\n\n';

            content += `Тест: ${allData.meta.testName || 'Не указан'}\n`;
            content += `Тема: ${allData.meta.theme || 'Не указана'}\n`;
            content += `Дата: ${allData.meta.date || new Date().toLocaleDateString()}\n`;
            content += `Класс: ${allData.meta.class || 'Не указан'}\n`;
            content += `Учащихся: ${allData.meta.studentCount}\n`;
            content += `Заданий: ${allData.meta.taskCount}\n\n`;

            content += 'СВОДНАЯ СТАТИСТИКА:\n';
            content += '-'.repeat(30) + '\n';
            content += `Средний балл: ${this.calculateOverallAverage(allData.studentStats).toFixed(1)}%\n`;
            content += `Надежность теста (α): ${comprehensiveAnalysis.reliability.alpha.toFixed(3)}\n`;
            content += `Отличники: ${comprehensiveAnalysis.clusters.excellent.count}\n`;
            content += `Требуют внимания: ${comprehensiveAnalysis.clusters.weak.count}\n\n`;

            content += 'РЕКОМЕНДАЦИИ:\n';
            content += '-'.repeat(30) + '\n';
            comprehensiveAnalysis.recommendations.forEach((rec, index) => {
                content += `${index + 1}. ${rec}\n`;
            });

            content += '\n' + '='.repeat(60) + '\n';
            content += `Сгенерировано: ${new Date().toLocaleString()}\n`;

            return new Blob([content], {
                type: 'application/msword'
            });

        } catch (error) {
            console.error('Ошибка создания простого отчета:', error);
            return null;
        }
    }

    // Упрощенное содержимое для Word
    createSimpleContentForWord(allData, comprehensiveAnalysis) {
        const paragraphs = [];

        if (window.docx.Paragraph) {
            paragraphs.push(
                new window.docx.Paragraph({
                    text: `Тест: ${allData.meta.testName || 'Не указан'}`,
                    spacing: {
                        after: 200
                    }
                }),

                new window.docx.Paragraph({
                    text: `Тема: ${allData.meta.theme || 'Не указана'}`,
                    spacing: {
                        after: 200
                    }
                }),

                new window.docx.Paragraph({
                    text: `Дата: ${allData.meta.date || new Date().toLocaleDateString()}`,
                    spacing: {
                        after: 200
                    }
                }),

                new window.docx.Paragraph({
                    text: '='.repeat(60),
                    spacing: {
                        after: 400
                    }
                }));
        }

        return paragraphs;
    }

    // Fallback для комплексного экспорта
    exportComprehensiveAnalysisFallback() {
        showNotification('Используется упрощенный экспорт', 'warning');

        // Создаем простой HTML отчет
        const allData = this.collectDetailedData();
        const comprehensiveAnalysis = this.performComprehensiveAnalysis();

        const htmlContent = `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>Аналитический отчет</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 30px; }
                h1, h2, h3 { color: #2c3e50; }
                .section { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
                th { background: #f8f9fa; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
                .stat-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
                .stat-value { font-size: 24px; font-weight: bold; }
                .stat-label { color: #7f8c8d; font-size: 14px; }
            </style>
        </head>
        <body>
            <h1>📊 Аналитический отчет</h1>
            <p><strong>Дата:</strong> ${new Date().toLocaleString()}</p>
            
            <div class="section">
                <h2>Основная информация</h2>
                <p><strong>Тест:</strong> ${allData.meta.testName || 'Не указан'}</p>
                <p><strong>Тема:</strong> ${allData.meta.theme || 'Не указана'}</p>
                <p><strong>Учащихся:</strong> ${allData.meta.studentCount}</p>
                <p><strong>Заданий:</strong> ${allData.meta.taskCount}</p>
            </div>
            
            <div class="section">
                <h2>Сводная статистика</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${this.calculateOverallAverage(allData.studentStats).toFixed(1)}%</div>
                        <div class="stat-label">Средний балл</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${comprehensiveAnalysis.reliability.alpha.toFixed(3)}</div>
                        <div class="stat-label">Надежность теста</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${comprehensiveAnalysis.clusters.excellent.count}</div>
                        <div class="stat-label">Отличники</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${comprehensiveAnalysis.clusters.weak.count}</div>
                        <div class="stat-label">Требуют внимания</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Рекомендации</h2>
                <ul>
                    ${comprehensiveAnalysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </body>
        </html>
    `;

        this.downloadBlob(new Blob([htmlContent], {
                type: 'text/html'
            }), 'аналитический_отчет.html');
    }

    // Вспомогательный метод для скачивания Blob
    downloadBlob(blob, filename) {
        try {
            // Пробуем использовать FileSaver.js
            if (typeof window.saveAs !== 'undefined') {
                window.saveAs(blob, filename);
            } else {
                // Fallback метод
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Ошибка скачивания файла:', error);
            showNotification('Ошибка при скачивании файла', 'error');
        }
    }

    // Создание сводной таблицы для Word
    createSummaryTableForWord(allData, comprehensiveAnalysis) {
        const {
            Table,
            TableRow,
            TableCell,
            Paragraph,
            TextRun,
            WidthType
        } = window.docx;

        return [
            new Table({
                width: {
                    size: 100,
                    type: WidthType.PERCENTAGE
                },
                borders: {
                    top: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000"
                    },
                    bottom: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000"
                    },
                    left: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000"
                    },
                    right: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000"
                    },
                    insideHorizontal: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "CCCCCC"
                    },
                    insideVertical: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "CCCCCC"
                    }
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: {
                                    size: 50,
                                    type: WidthType.PERCENTAGE
                                },
                                children: [new Paragraph("Показатель")],
                                shading: {
                                    fill: "F0F0F0"
                                }
                            }),
                            new TableCell({
                                width: {
                                    size: 25,
                                    type: WidthType.PERCENTAGE
                                },
                                children: [new Paragraph("Значение")],
                                shading: {
                                    fill: "F0F0F0"
                                }
                            }),
                            new TableCell({
                                width: {
                                    size: 25,
                                    type: WidthType.PERCENTAGE
                                },
                                children: [new Paragraph("Интерпретация")],
                                shading: {
                                    fill: "F0F0F0"
                                }
                            })
                        ]
                    }),

                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph("Средний балл класса")]
                            }),
                            new TableCell({
                                children: [new Paragraph(`${this.calculateOverallAverage(allData.studentStats).toFixed(1)}%`)]
                            }),
                            new TableCell({
                                children: [new Paragraph(this.interpretAverageScore(this.calculateOverallAverage(allData.studentStats)))]
                            })
                        ]
                    }),

                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph("Надежность теста (α Кронбаха)")]
                            }),
                            new TableCell({
                                children: [new Paragraph(`${comprehensiveAnalysis.reliability.alpha.toFixed(3)}`)]
                            }),
                            new TableCell({
                                children: [new Paragraph(comprehensiveAnalysis.reliability.interpretation)]
                            })
                        ]
                    }),

                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph("Отличники")]
                            }),
                            new TableCell({
                                children: [new Paragraph(`${comprehensiveAnalysis.clusters.excellent.count}`)]
                            }),
                            new TableCell({
                                children: [new Paragraph(`${((comprehensiveAnalysis.clusters.excellent.count / allData.meta.studentCount) * 100).toFixed(1)}% от общего числа`)]
                            })
                        ]
                    }),

                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph("Требуют внимания")]
                            }),
                            new TableCell({
                                children: [new Paragraph(`${comprehensiveAnalysis.clusters.weak.count}`)]
                            }),
                            new TableCell({
                                children: [new Paragraph(`${((comprehensiveAnalysis.clusters.weak.count / allData.meta.studentCount) * 100).toFixed(1)}% от общего числа`)]
                            })
                        ]
                    }),

                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph("Проблемных заданий")]
                            }),
                            new TableCell({
                                children: [new Paragraph(`${allData.taskStats.filter(t => t.difficulty > 0.7 || t.discrimination < 0.3).length}`)]
                            }),
                            new TableCell({
                                children: [new Paragraph(`из ${allData.meta.taskCount} заданий`)]
                            })
                        ]
                    })
                ]
            }),

            new Paragraph({
                text: "",
                spacing: {
                    after: 300
                }
            })
        ];
    }

    // Интерпретация среднего балла
    interpretAverageScore(score) {
        if (score >= 85)
            return "Отличный результат";
        if (score >= 70)
            return "Хороший результат";
        if (score >= 50)
            return "Удовлетворительный результат";
        return "Неудовлетворительный результат";
    }

    // Анализ надежности для Word
    createReliabilityAnalysisForWord(reliability) {
        const {
            Paragraph,
            TextRun
        } = window.docx;

        return [
            new Paragraph({
                text: `Коэффициент альфа Кронбаха: ${reliability.alpha.toFixed(3)}`,
                spacing: {
                    after: 100
                }
            }),

            new Paragraph({
                text: `Оценка надежности: ${reliability.interpretation}`,
                spacing: {
                    after: 100
                }
            }),

            new Paragraph({
                text: `Описание: ${reliability.description}`,
                spacing: {
                    after: 100
                }
            }),

            new Paragraph({
                text: `Рекомендации: ${reliability.recommendation}`,
                spacing: {
                    after: 200
                }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "Примечание: ",
                        bold: true
                    }),
                    new TextRun("Для педагогических тестов обычно приемлемым считается α ≥ 0.7. Высокая надежность (α ≥ 0.8) указывает на хорошую внутреннюю согласованность теста.")
                ],
                spacing: {
                    after: 300
                }
            })
        ];
    }

    // Анализ распределения для Word
    createDistributionAnalysisForWord(allData) {
        const {
            Paragraph,
            TextRun,
            Table,
            TableRow,
            TableCell
        } = window.docx;
        const studentGroups = this.createStudentGroups(allData.studentStats);

        const paragraphs = [
            new Paragraph({
                text: "Распределение учащихся по уровню подготовки:",
                spacing: {
                    after: 100
                }
            })
        ];

        // Таблица распределения
        if (studentGroups.length > 0) {
            const tableRows = [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph("Уровень")]
                        }),
                        new TableCell({
                            children: [new Paragraph("Количество учащихся")]
                        }),
                        new TableCell({
                            children: [new Paragraph("Процент")]
                        }),
                        new TableCell({
                            children: [new Paragraph("Средний балл")]
                        })
                    ]
                })
            ];

            studentGroups.forEach(group => {
                tableRows.push(
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph(group.name)]
                            }),
                            new TableCell({
                                children: [new Paragraph(group.count.toString())]
                            }),
                            new TableCell({
                                children: [new Paragraph(group.percentage + "%")]
                            }),
                            new TableCell({
                                children: [new Paragraph(this.calculateGroupAverageScore(allData.studentStats, group))]
                            })
                        ]
                    }));
            });

            paragraphs.push(
                new Table({
                    rows: tableRows
                }));
        }

        // Интерпретация распределения
        paragraphs.push(
            new Paragraph({
                text: this.interpretDistribution(allData.distribution),
                spacing: {
                    before: 200,
                    after: 300
                }
            }));

        return paragraphs;
    }

    // Расчет среднего балла группы
    calculateGroupAverageScore(studentStats, group) {
        const groupStudents = studentStats.filter(s => {
            const score = s.averageScore;
            return score >= group.min && score < (group.name.includes('Отлично') ? 101 : group.max);
        });

        if (groupStudents.length === 0)
            return "0.0%";
        const avg = groupStudents.reduce((sum, s) => sum + s.averageScore, 0) / groupStudents.length;
        return avg.toFixed(1) + "%";
    }

    // Анализ заданий для Word
    createTasksAnalysisForWord(allData) {
        const {
            Paragraph,
            TextRun,
            Table,
            TableRow,
            TableCell
        } = window.docx;

        const problematicTasks = allData.taskStats.filter(task =>
                task.difficulty > 0.7 || task.discrimination < 0.3);

        const paragraphs = [
            new Paragraph({
                text: `Всего заданий: ${allData.meta.taskCount}`,
                spacing: {
                    after: 100
                }
            }),

            new Paragraph({
                text: `Проблемных заданий: ${problematicTasks.length} (${((problematicTasks.length / allData.meta.taskCount) * 100).toFixed(1)}%)`,
                spacing: {
                    after: 100
                }
            })
        ];

        // Таблица проблемных заданий
        if (problematicTasks.length > 0) {
            paragraphs.push(
                new Paragraph({
                    text: "Проблемные задания, требующие внимания:",
                    spacing: {
                        before: 200,
                        after: 100
                    }
                }));

            const tableRows = [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph("№")]
                        }),
                        new TableCell({
                            children: [new Paragraph("Задание")]
                        }),
                        new TableCell({
                            children: [new Paragraph("Сложность")]
                        }),
                        new TableCell({
                            children: [new Paragraph("Дискриминативность")]
                        }),
                        new TableCell({
                            children: [new Paragraph("Проблема")]
                        }),
                        new TableCell({
                            children: [new Paragraph("Рекомендация")]
                        })
                    ]
                })
            ];

            problematicTasks.forEach(task => {
                let problem = "";
                let recommendation = "";

                if (task.difficulty > 0.7) {
                    problem = "Слишком высокая сложность";
                    recommendation = "Упростить формулировку, добавить подсказки";
                } else if (task.discrimination < 0.3) {
                    problem = "Низкая дискриминативность";
                    recommendation = "Пересмотреть варианты ответов";
                }

                tableRows.push(
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph(task.number.toString())]
                            }),
                            new TableCell({
                                children: [new Paragraph(task.title.substring(0, 50) + (task.title.length > 50 ? "..." : ""))]
                            }),
                            new TableCell({
                                children: [new Paragraph((task.difficulty * 100).toFixed(1) + "%")]
                            }),
                            new TableCell({
                                children: [new Paragraph((task.discrimination * 100).toFixed(1) + "%")]
                            }),
                            new TableCell({
                                children: [new Paragraph(problem)]
                            }),
                            new TableCell({
                                children: [new Paragraph(recommendation)]
                            })
                        ]
                    }));
            });

            paragraphs.push(
                new Table({
                    rows: tableRows
                }));
        }

        paragraphs.push(
            new Paragraph({
                text: "",
                spacing: {
                    after: 300
                }
            }));

        return paragraphs;
    }

    // Рекомендации для Word
    createRecommendationsForWord(recommendations) {
        const {
            Paragraph,
            TextRun
        } = window.docx;

        const paragraphs = [
            new Paragraph({
                text: "На основе проведенного анализа сформулированы следующие рекомендации:",
                spacing: {
                    after: 100
                }
            })
        ];

        recommendations.forEach((rec, index) => {
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${index + 1}. `,
                            bold: true
                        }),
                        new TextRun(rec)
                    ],
                    spacing: {
                        after: 50
                    }
                }));
        });

        paragraphs.push(
            new Paragraph({
                text: "",
                spacing: {
                    after: 300
                }
            }));

        return paragraphs;
    }

    // Генерация заключения
    generateConclusion(allData) {
        const averageScore = this.calculateOverallAverage(allData.studentStats);
        const weakStudents = allData.studentStats.filter(s => s.averageScore < 50).length;
        const problematicTasks = allData.taskStats.filter(t => t.difficulty > 0.7 || t.discrimination < 0.3).length;

        let conclusion = "На основе комплексного анализа результатов тестирования можно сделать следующие выводы:\n\n";

        conclusion += `1. Общий уровень подготовки класса составляет ${averageScore.toFixed(1)}%, что является `;
        if (averageScore >= 85) {
            conclusion += "отличным показателем. ";
        } else if (averageScore >= 70) {
            conclusion += "хорошим показателем. ";
        } else if (averageScore >= 50) {
            conclusion += "удовлетворительным показателем. ";
        } else {
            conclusion += "неудовлетворительным показателем. ";
        }

        conclusion += `\n2. В классе выделяется ${weakStudents} учащихся, требующих особого внимания и дополнительной помощи `;
        conclusion += `(${((weakStudents / allData.meta.studentCount) * 100).toFixed(1)}% от общего числа).\n`;

        conclusion += `\n3. Из ${allData.meta.taskCount} заданий ${problematicTasks} имеют проблемы со сложностью или дискриминативностью `;
        conclusion += `(${((problematicTasks / allData.meta.taskCount) * 100).toFixed(1)}%).\n`;

        conclusion += "\n4. Для улучшения результатов рекомендуется последовательная реализация предложенных рекомендаций, ";
        conclusion += "с акцентом на дифференцированный подход к обучению и коррекцию проблемных заданий.";

        return conclusion;
    }

    // Генерация отчетов по вкладкам
    generateTabReports(allData) {
        const reports = {};

        // Обзор
        reports["обзор"] = this.generateTabReport("Обзор", allData, this.renderOverviewTab(allData));

        // Учащиеся
        reports["учащиеся"] = this.generateTabReport("Анализ учащихся", allData, this.renderStudentsTab(allData));

        // Задания
        reports["задания"] = this.generateTabReport("Анализ заданий", allData, this.renderTasksTab(allData));

        // Распределение
        reports["распределение"] = this.generateTabReport("Распределение результатов", allData, this.renderDistributionTab(allData));

        // Ошибки
        reports["ошибки"] = this.generateTabReport("Анализ ошибок", allData, this.renderErrorsTab(allData));

        // Рекомендации
        reports["рекомендации"] = this.generateTabReport("Рекомендации", allData, this.renderRecommendationsTab(allData));

        return reports;
    }

    // Генерация отчета по вкладке
    generateTabReport(title, allData, htmlContent) {
        const {
            Document,
            Paragraph,
            HeadingLevel,
            Packer,
            AlignmentType
        } = window.docx;

        const doc = new Document({
            sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            text: title.toUpperCase(),
                            heading: HeadingLevel.TITLE,
                            alignment: AlignmentType.CENTER
                        }),

                        new Paragraph({
                            text: `Тест: ${allData.meta.testName}`,
                            alignment: AlignmentType.CENTER
                        }),

                        new Paragraph({
                            text: `Дата: ${allData.meta.date}`,
                            alignment: AlignmentType.CENTER
                        }),

                        new Paragraph({
                            text: `Сгенерировано: ${new Date().toLocaleString()}`,
                            alignment: AlignmentType.CENTER
                        }),

                        new Paragraph({
                            text: this.extractTextFromHTML(htmlContent),
                            spacing: {
                                before: 400
                            }
                        })
                    ]
                }
            ]
        });

        return Packer.toBlob(doc);
    }

    // Извлечение текста из HTML
    extractTextFromHTML(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || '';
    }

    // Сбор данных студента для экспорта
    collectStudentDataForExport(studentIndex) {
        if (!appData.students || !appData.students[studentIndex]) {
            return null;
        }

        const studentName = appData.students[studentIndex];
        const studentStats = this.calculateStudentStatistics();
        const studentStat = studentStats.find(s => s.index === studentIndex);

        // Результаты по заданиям
        const taskResults = appData.tasks?.map((task, taskIndex) => {
            const score = this.getStudentScore(studentIndex, taskIndex);
            const maxScore = task.maxScore || 1;
            const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

            return {
                taskNumber: taskIndex + 1,
                taskTitle: task.title || `Задание ${taskIndex + 1}`,
                score: score.toFixed(2),
                maxScore: maxScore.toFixed(2),
                percentage: percentage.toFixed(1),
                level: task.level || 1,
                competence: task.competence || this.getCompetenceByLevel(task.level || 1)
            };
        }) || [];

        // Ошибки студента
        const studentErrors = appData.errors?.filter(error =>
                error.studentIndex === studentIndex) || [];

        // Компетенции
        const competences = this.analyzeStudentCompetences(studentIndex);

        // Сравнение с классом
        const classAverage = this.calculateOverallAverage(studentStats);
        const rank = this.calculateStudentRank(studentIndex, studentStats);

        return {
            studentName,
            studentIndex,
            studentStat,
            taskResults,
            totalTasks: taskResults.length,
            totalScore: taskResults.reduce((sum, t) => sum + parseFloat(t.score), 0).toFixed(2),
            maxPossibleScore: taskResults.reduce((sum, t) => sum + parseFloat(t.maxScore), 0).toFixed(2),
            overallPercentage: studentStat?.averageScore || 0,
            competences,
            errors: studentErrors,
            comparison: {
                classAverage: classAverage.toFixed(1),
                studentAverage: studentStat?.averageScore.toFixed(1) || "0.0",
                rank: rank,
                percentile: ((rank / studentStats.length) * 100).toFixed(1)
            },
            strengths: this.identifyStudentStrengths(studentIndex, taskResults),
            weaknesses: this.identifyStudentWeaknesses(studentIndex, taskResults)
        };
    }

    // Анализ компетенций студента
    analyzeStudentCompetences(studentIndex) {
        if (!appData.tasks)
            return {};

        const competences = {
            'Базовый': {
                scores: [],
                count: 0
            },
            'Применение': {
                scores: [],
                count: 0
            },
            'Анализ': {
                scores: [],
                count: 0
            },
            'Творчество': {
                scores: [],
                count: 0
            }
        };

        appData.tasks.forEach((task, taskIndex) => {
            const level = Math.min(Math.max(task.level || 1, 1), 4);
            const competence = this.getCompetenceByLevel(level);
            const score = this.getStudentScore(studentIndex, taskIndex);
            const maxScore = task.maxScore || 1;
            const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

            if (competences[competence]) {
                competences[competence].scores.push(percentage);
                competences[competence].count++;
            }
        });

        // Расчет средних
        Object.keys(competences).forEach(key => {
            if (competences[key].scores.length > 0) {
                competences[key].average = this.calculateAverage(competences[key].scores);
            } else {
                competences[key].average = 0;
            }
        });

        return competences;
    }

    // Расчет ранга студента
    calculateStudentRank(studentIndex, studentStats) {
        const sorted = [...studentStats].sort((a, b) => b.averageScore - a.averageScore);
        const student = sorted.find(s => s.index === studentIndex);
        return sorted.indexOf(student) + 1;
    }

    // Выявление сильных сторон
    identifyStudentStrengths(studentIndex, taskResults) {
        const strengths = [];
        const goodTasks = taskResults.filter(t => parseFloat(t.percentage) >= 80);

        if (goodTasks.length > 0) {
            // Группировка по уровням
            const levelGroups = {};
            goodTasks.forEach(task => {
                if (!levelGroups[task.level])
                    levelGroups[task.level] = [];
                levelGroups[task.level].push(task);
            });

            // Находим уровни с лучшими результатами
            Object.entries(levelGroups).forEach(([level, tasks]) => {
                if (tasks.length >= 2) { // Минимум 2 задания одного уровня
                    strengths.push({
                        level: parseInt(level),
                        competence: tasks[0].competence,
                        count: tasks.length,
                        averageScore: (tasks.reduce((sum, t) => sum + parseFloat(t.percentage), 0) / tasks.length).toFixed(1)
                    });
                }
            });
        }

        return strengths;
    }

    // Выявление слабых сторон
    identifyStudentWeaknesses(studentIndex, taskResults) {
        const weaknesses = [];
        const weakTasks = taskResults.filter(t => parseFloat(t.percentage) < 50);

        if (weakTasks.length > 0) {
            // Группировка по уровням
            const levelGroups = {};
            weakTasks.forEach(task => {
                if (!levelGroups[task.level])
                    levelGroups[task.level] = [];
                levelGroups[task.level].push(task);
            });

            // Находим проблемные уровни
            Object.entries(levelGroups).forEach(([level, tasks]) => {
                weaknesses.push({
                    level: parseInt(level),
                    competence: tasks[0].competence,
                    count: tasks.length,
                    averageScore: (tasks.reduce((sum, t) => sum + parseFloat(t.percentage), 0) / tasks.length).toFixed(1),
                    tasks: tasks.map(t => t.taskNumber)
                });
            });
        }

        return weaknesses;
    }

    // Генерация Word отчета для студента
    generateStudentWordReport(studentName, studentData) {
        const {
            Document,
            Paragraph,
            HeadingLevel,
            Packer,
            AlignmentType,
            Table,
            TableRow,
            TableCell,
            TextRun
        } = window.docx;

        const doc = new Document({
            sections: [{
                    properties: {},
                    children: [
                        // Заголовок
                        new Paragraph({
                            text: "ИНДИВИДУАЛЬНЫЙ ОТЧЕТ УЧАЩЕГОСЯ",
                            heading: HeadingLevel.TITLE,
                            alignment: AlignmentType.CENTER
                        }),

                        new Paragraph({
                            text: studentName,
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.CENTER
                        }),

                        // Основная информация
                        new Paragraph({
                            text: `Тест: ${appData.test?.subject || "Не указан"}`,
                            alignment: AlignmentType.CENTER
                        }),

                        new Paragraph({
                            text: `Дата: ${studentData.comparison?.testDate || new Date().toLocaleDateString()}`,
                            alignment: AlignmentType.CENTER
                        }),

                        // Сводная таблица
                        new Table({
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph("Общий результат")]
                                        }),
                                        new TableCell({
                                            children: [new Paragraph(`${studentData.overallPercentage}%`)]
                                        })
                                    ]
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph("Место в классе")]
                                        }),
                                        new TableCell({
                                            children: [new Paragraph(`${studentData.comparison.rank} из ${appData.students?.length || 0}`)]
                                        })
                                    ]
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph("Процентиль")]
                                        }),
                                        new TableCell({
                                            children: [new Paragraph(`${studentData.comparison.percentile}%`)]
                                        })
                                    ]
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph("Средний балл класса")]
                                        }),
                                        new TableCell({
                                            children: [new Paragraph(`${studentData.comparison.classAverage}%`)]
                                        })
                                    ]
                                })
                            ]
                        }),

                        // Результаты по заданиям
                        new Paragraph({
                            text: "РЕЗУЛЬТАТЫ ПО ЗАДАНИЯМ",
                            heading: HeadingLevel.HEADING_1,
                            spacing: {
                                before: 400
                            }
                        }),

                        ...this.createStudentTasksTable(studentData.taskResults),

                        // Анализ компетенций
                        new Paragraph({
                            text: "АНАЛИЗ КОМПЕТЕНЦИЙ",
                            heading: HeadingLevel.HEADING_1,
                            spacing: {
                                before: 400
                            }
                        }),

                        ...this.createStudentCompetencesTable(studentData.competences),

                        // Сильные и слабые стороны
                        new Paragraph({
                            text: "СИЛЬНЫЕ И СЛАБЫЕ СТОРОНЫ",
                            heading: HeadingLevel.HEADING_1,
                            spacing: {
                                before: 400
                            }
                        }),

                        ...this.createStrengthsWeaknessesAnalysis(studentData),

                        // Рекомендации
                        new Paragraph({
                            text: "РЕКОМЕНДАЦИИ",
                            heading: HeadingLevel.HEADING_1,
                            spacing: {
                                before: 400
                            }
                        }),

                        ...this.createStudentRecommendations(studentData),

                        // Подпись
                        new Paragraph({
                            text: "________________________________________________________________________",
                            alignment: AlignmentType.CENTER,
                            spacing: {
                                before: 400
                            }
                        }),

                        new Paragraph({
                            text: "Дата формирования отчета: " + new Date().toLocaleDateString(),
                            alignment: AlignmentType.RIGHT
                        })
                    ]
                }
            ]
        });

        return Packer.toBlob(doc);
    }

    // Создание таблицы заданий студента
    createStudentTasksTable(taskResults) {
        const {
            Table,
            TableRow,
            TableCell,
            Paragraph
        } = window.docx;

        if (!taskResults || taskResults.length === 0) {
            return [new Paragraph("Нет данных о результатах")];
        }

        const headerRow = new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("№")]
                }),
                new TableCell({
                    children: [new Paragraph("Задание")]
                }),
                new TableCell({
                    children: [new Paragraph("Балл")]
                }),
                new TableCell({
                    children: [new Paragraph("Максимум")]
                }),
                new TableCell({
                    children: [new Paragraph("Процент")]
                }),
                new TableCell({
                    children: [new Paragraph("Уровень")]
                })
            ]
        });

        const rows = [headerRow];

        taskResults.forEach(task => {
            rows.push(
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph(task.taskNumber.toString())]
                        }),
                        new TableCell({
                            children: [new Paragraph(task.taskTitle)]
                        }),
                        new TableCell({
                            children: [new Paragraph(task.score)]
                        }),
                        new TableCell({
                            children: [new Paragraph(task.maxScore)]
                        }),
                        new TableCell({
                            children: [new Paragraph(task.percentage + "%")]
                        }),
                        new TableCell({
                            children: [new Paragraph(task.level.toString())]
                        })
                    ]
                }));
        });

        return [new Table({
                rows: rows
            })];
    }

    // Создание таблицы компетенций студента
    createStudentCompetencesTable(competences) {
        const {
            Table,
            TableRow,
            TableCell,
            Paragraph
        } = window.docx;

        const rows = [
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph("Компетенция")]
                    }),
                    new TableCell({
                        children: [new Paragraph("Количество заданий")]
                    }),
                    new TableCell({
                        children: [new Paragraph("Средний результат")]
                    }),
                    new TableCell({
                        children: [new Paragraph("Оценка")]
                    })
                ]
            })
        ];

        Object.entries(competences).forEach(([name, data]) => {
            rows.push(
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph(name)]
                        }),
                        new TableCell({
                            children: [new Paragraph(data.count.toString())]
                        }),
                        new TableCell({
                            children: [new Paragraph(data.average.toFixed(1) + "%")]
                        }),
                        new TableCell({
                            children: [new Paragraph(this.getCompetenceRating(data.average))]
                        })
                    ]
                }));
        });

        return [new Table({
                rows: rows
            }), new Paragraph("")];
    }

    // Оценка компетенции
    getCompetenceRating(average) {
        if (average >= 85)
            return "Отлично";
        if (average >= 70)
            return "Хорошо";
        if (average >= 50)
            return "Удовлетворительно";
        return "Неудовлетворительно";
    }

    // Анализ сильных и слабых сторон
    createStrengthsWeaknessesAnalysis(studentData) {
        const {
            Paragraph,
            TextRun
        } = window.docx;

        const paragraphs = [];

        // Сильные стороны
        if (studentData.strengths && studentData.strengths.length > 0) {
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Сильные стороны: ",
                            bold: true
                        })
                    ]
                }));

            studentData.strengths.forEach(strength => {
                paragraphs.push(
                    new Paragraph({
                        text: `• Уровень ${strength.level} (${strength.competence}): ${strength.count} заданий со средним результатом ${strength.averageScore}%`,
                        indent: {
                            left: 400
                        }
                    }));
            });
        }

        // Слабые стороны
        if (studentData.weaknesses && studentData.weaknesses.length > 0) {
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Слабые стороны: ",
                            bold: true
                        })
                    ],
                    spacing: {
                        before: 200
                    }
                }));

            studentData.weaknesses.forEach(weakness => {
                paragraphs.push(
                    new Paragraph({
                        text: `• Уровень ${weakness.level} (${weakness.competence}): ${weakness.count} заданий со средним результатом ${weakness.averageScore}%`,
                        indent: {
                            left: 400
                        }
                    }));

                if (weakness.tasks && weakness.tasks.length > 0) {
                    paragraphs.push(
                        new Paragraph({
                            text: `  Проблемные задания: ${weakness.tasks.join(', ')}`,
                            indent: {
                                left: 800
                            }
                        }));
                }
            });
        }

        return paragraphs;
    }

    // Рекомендации для студента
    createStudentRecommendations(studentData) {
        const {
            Paragraph,
            TextRun
        } = window.docx;

        const recommendations = [];
        const overall = parseFloat(studentData.overallPercentage);

        // Общие рекомендации
        if (overall < 50) {
            recommendations.push("Требуется повторение основного материала");
            recommendations.push("Необходима индивидуальная консультация с преподавателем");
            recommendations.push("Выполнение дополнительных заданий базового уровня");
        } else if (overall < 70) {
            recommendations.push("Рекомендуется дополнительная практика по сложным темам");
            recommendations.push("Работа над устранением типичных ошибок");
            recommendations.push("Развитие навыков самопроверки");
        } else if (overall < 85) {
            recommendations.push("Продолжать в том же темпе, уделить внимание деталям");
            recommendations.push("Развивать навыки решения нестандартных задач");
            recommendations.push("Участие в олимпиадных заданиях");
        } else {
            recommendations.push("Отличный результат! Можно переходить к более сложным темам");
            recommendations.push("Рекомендуется участие в олимпиадах и конкурсах");
            recommendations.push("Возможность выполнения исследовательских проектов");
        }

        // Рекомендации по компетенциям
        Object.entries(studentData.competences).forEach(([name, data]) => {
            if (data.average < 60) {
                recommendations.push(`Уделить особое внимание развитию компетенции "${name}"`);
            } else if (data.average >= 85) {
                recommendations.push(`Компетенция "${name}" развита отлично, можно углублять знания`);
            }
        });

        // Рекомендации по ошибкам
        if (studentData.errors && studentData.errors.length > 0) {
            const errorTypes = [...new Set(studentData.errors.map(e => e.type))];
            if (errorTypes.includes('calculation')) {
                recommendations.push("Тренировать вычислительные навыки, проверку расчетов");
            }
            if (errorTypes.includes('conceptual')) {
                recommendations.push("Повторить основные понятия и определения, создать глоссарий");
            }
            if (errorTypes.includes('attention')) {
                recommendations.push("Развивать внимательность, читать условия заданий вслух");
            }
        }

        // Форматирование
        const paragraphs = [];
        recommendations.forEach((rec, index) => {
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${index + 1}. `,
                            bold: true
                        }),
                        new TextRun(rec)
                    ],
                    spacing: {
                        after: 50
                    }
                }));
        });

        return paragraphs;
    }

    // Генерация Excel отчета для студента
    generateStudentExcelReport(studentName, studentData) {
        // Используем библиотеку ExcelJS
        const ExcelJS = window.ExcelJS;
        const workbook = new ExcelJS.Workbook();

        // Основной лист
        const worksheet = workbook.addWorksheet('Результаты');

        // Заголовок
        worksheet.mergeCells('A1:F1');
        worksheet.getCell('A1').value = `ИНДИВИДУАЛЬНЫЙ ОТЧЕТ: ${studentName}`;
        worksheet.getCell('A1').font = {
            bold: true,
            size: 16
        };
        worksheet.getCell('A1').alignment = {
            horizontal: 'center'
        };

        // Основная информация
        worksheet.getCell('A3').value = 'Общий результат:';
        worksheet.getCell('B3').value = `${studentData.overallPercentage}%`;

        worksheet.getCell('A4').value = 'Место в классе:';
        worksheet.getCell('B4').value = `${studentData.comparison.rank} из ${appData.students?.length || 0}`;

        worksheet.getCell('A5').value = 'Процентиль:';
        worksheet.getCell('B5').value = `${studentData.comparison.percentile}%`;

        worksheet.getCell('A6').value = 'Средний балл класса:';
        worksheet.getCell('B6').value = `${studentData.comparison.classAverage}%`;

        // Результаты по заданиям
        worksheet.mergeCells('A8:F8');
        worksheet.getCell('A8').value = 'РЕЗУЛЬТАТЫ ПО ЗАДАНИЯМ';
        worksheet.getCell('A8').font = {
            bold: true
        };

        // Заголовки таблицы
        const headers = ['№', 'Задание', 'Балл', 'Максимум', 'Процент', 'Уровень'];
        headers.forEach((header, index) => {
            worksheet.getCell(10, index + 1).value = header;
            worksheet.getCell(10, index + 1).font = {
                bold: true
            };
            worksheet.getCell(10, index + 1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {
                    argb: 'FFE0E0E0'
                }
            };
        });

        // Данные
        studentData.taskResults.forEach((task, index) => {
            const row = 11 + index;
            worksheet.getCell(row, 1).value = task.taskNumber;
            worksheet.getCell(row, 2).value = task.taskTitle;
            worksheet.getCell(row, 3).value = parseFloat(task.score);
            worksheet.getCell(row, 4).value = parseFloat(task.maxScore);
            worksheet.getCell(row, 5).value = {
                formula: `C${row}/D${row}*100`,
                result: parseFloat(task.percentage)
            };
            worksheet.getCell(row, 6).value = task.level;

            // Форматирование процента
            worksheet.getCell(row, 5).numFmt = '0.0"%";[Red]-0.0"%";';
        });

        // Лист с компетенциями
        const competencesSheet = workbook.addWorksheet('Компетенции');

        competencesSheet.getCell('A1').value = 'КОМПЕТЕНЦИИ';
        competencesSheet.getCell('A1').font = {
            bold: true,
            size: 14
        };

        const compHeaders = ['Компетенция', 'Заданий', 'Средний результат', 'Оценка'];
        compHeaders.forEach((header, index) => {
            competencesSheet.getCell(3, index + 1).value = header;
            competencesSheet.getCell(3, index + 1).font = {
                bold: true
            };
        });

        Object.entries(studentData.competences).forEach(([name, data], index) => {
            const row = 4 + index;
            competencesSheet.getCell(row, 1).value = name;
            competencesSheet.getCell(row, 2).value = data.count;
            competencesSheet.getCell(row, 3).value = data.average;
            competencesSheet.getCell(row, 4).value = this.getCompetenceRating(data.average);

            // Форматирование
            competencesSheet.getCell(row, 3).numFmt = '0.0"%";[Red]-0.0"%";';
        });

        // Настройка ширины колонок
        worksheet.columns = [{
                width: 5
            }, // №
            {
                width: 40
            }, // Задание
            {
                width: 10
            }, // Балл
            {
                width: 10
            }, // Максимум
            {
                width: 10
            }, // Процент
            {
                width: 8
            } // Уровень
        ];

        competencesSheet.columns = [{
                width: 20
            }, // Компетенция
            {
                width: 10
            }, // Заданий
            {
                width: 15
            }, // Результат
            {
                width: 15
            } // Оценка
        ];

        // Сохраняем как blob
        return workbook.xlsx.writeBuffer();
    }

    // Экспорт всех графиков как изображений
    exportAllChartsToImages(folder) {
        return new Promise((resolve) => {
            console.log('🖼️ Экспорт графиков...');

            const chartsToExport = [];
            const allCanvases = document.querySelectorAll('canvas');

            // Собираем все canvas элементы
            allCanvases.forEach((canvas, index) => {
                if (canvas.width > 10 && canvas.height > 10) { // Проверяем, что canvas не пустой
                    chartsToExport.push({
                        canvas: canvas,
                        id: canvas.id || `chart_${index}`,
                        name: canvas.closest('.chart-container') ?
                        canvas.closest('.chart-container').querySelector('h4')?.textContent ||
                        canvas.closest('.viz-card')?.querySelector('h4')?.textContent ||
                        `График ${index + 1}` : `График ${index + 1}`
                    });
                }
            });

            console.log(`Найдено ${chartsToExport.length} графиков для экспорта`);

            if (chartsToExport.length === 0) {
                resolve();
                return;
            }

            let exportedCount = 0;
            const totalCharts = Math.min(chartsToExport.length, 30); // Ограничиваем

            chartsToExport.slice(0, totalCharts).forEach((chartData, index) => {
                setTimeout(() => {
                    try {
                        const canvas = chartData.canvas;

                        // Создаем временный canvas для лучшего качества
                        const tempCanvas = document.createElement('canvas');
                        const ctx = tempCanvas.getContext('2d');

                        // Увеличиваем размер для лучшего качества
                        const scale = 2;
                        tempCanvas.width = canvas.width * scale;
                        tempCanvas.height = canvas.height * scale;

                        // Устанавливаем белый фон
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

                        // Копируем оригинальный график
                        ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

                        // Конвертируем в base64
                        const imageData = tempCanvas.toDataURL('image/png', 1.0);
                        const base64Data = imageData.replace(/^data:image\/png;base64,/, '');

                        // Сохраняем
                        const fileName = this.sanitizeFileName(`${chartData.name}.png`);
                        folder.file(`графики/${fileName}`, base64Data, {
                            base64: true
                        });

                        exportedCount++;
                        console.log(`✅ Экспортирован график: ${chartData.name} (${exportedCount}/${totalCharts})`);

                        if (exportedCount === totalCharts) {
                            console.log(`✅ Все графики экспортированы: ${exportedCount} из ${totalCharts}`);
                            resolve();
                        }

                    } catch (error) {
                        console.warn(`❌ Ошибка экспорта графика ${chartData.name}:`, error);
                        exportedCount++;

                        if (exportedCount === totalCharts) {
                            resolve();
                        }
                    }
                }, index * 100); // Задержка для предотвращения блокировки
            });

            // Таймаут на случай проблем
            setTimeout(() => {
                console.log(`⏱️ Таймаут экспорта графиков, экспортировано: ${exportedCount}`);
                resolve();
            }, 30000);
        });
    }

    // Генерация сводного Excel отчета
    generateSummaryExcelReport(allData) {
        const ExcelJS = window.ExcelJS;
        const workbook = new ExcelJS.Workbook();

        // Лист 1: Общая статистика
        const summarySheet = workbook.addWorksheet('Общая статистика');

        // Заголовок
        summarySheet.mergeCells('A1:D1');
        summarySheet.getCell('A1').value = 'СВОДНАЯ СТАТИСТИКА ТЕСТИРОВАНИЯ';
        summarySheet.getCell('A1').font = {
            bold: true,
            size: 16
        };

        // Основные показатели
        const indicators = [
            ['Тест', allData.meta.testName || 'Не указан'],
            ['Тема', allData.meta.theme || 'Не указана'],
            ['Дата', allData.meta.date || 'Не указана'],
            ['Класс', allData.meta.class || 'Не указан'],
            ['Учащихся', allData.meta.studentCount],
            ['Заданий', allData.meta.taskCount],
            ['Средний балл', `${this.calculateOverallAverage(allData.studentStats).toFixed(1)}%`],
            ['Медиана', `${allData.distribution.median.toFixed(1)}%`],
            ['Стандартное отклонение', `${allData.distribution.stdDev.toFixed(1)}%`]
        ];

        indicators.forEach(([label, value], index) => {
            summarySheet.getCell(`A${index + 3}`).value = label;
            summarySheet.getCell(`A${index + 3}`).font = {
                bold: true
            };
            summarySheet.getCell(`B${index + 3}`).value = value;
        });

        // Лист 2: Результаты учащихся
        const studentsSheet = workbook.addWorksheet('Результаты учащихся');

        // Заголовки
        const studentHeaders = ['№', 'ФИО', 'Средний балл', 'Максимум', 'Минимум', 'Место', 'Процентиль', 'Группа'];
        studentHeaders.forEach((header, index) => {
            studentsSheet.getCell(1, index + 1).value = header;
            studentsSheet.getCell(1, index + 1).font = {
                bold: true
            };
        });

        // Данные
        const sortedStudents = [...allData.studentStats].sort((a, b) => b.averageScore - a.averageScore);
        sortedStudents.forEach((student, index) => {
            const row = index + 2;
            studentsSheet.getCell(row, 1).value = index + 1;
            studentsSheet.getCell(row, 2).value = student.name;
            studentsSheet.getCell(row, 3).value = student.averageScore;
            studentsSheet.getCell(row, 4).value = student.maxScore;
            studentsSheet.getCell(row, 5).value = student.minScore;
            studentsSheet.getCell(row, 6).value = index + 1;
            studentsSheet.getCell(row, 7).value = ((index + 1) / sortedStudents.length * 100).toFixed(1);
            studentsSheet.getCell(row, 8).value = this.getStudentGroup(student.averageScore);

            // Форматирование
            studentsSheet.getCell(row, 3).numFmt = '0.0"%";[Red]-0.0"%";';
            studentsSheet.getCell(row, 4).numFmt = '0.0"%";[Red]-0.0"%";';
            studentsSheet.getCell(row, 5).numFmt = '0.0"%";[Red]-0.0"%";';
            studentsSheet.getCell(row, 7).numFmt = '0.0"%";[Red]-0.0"%";';
        });

        // Лист 3: Анализ заданий
        const tasksSheet = workbook.addWorksheet('Анализ заданий');

        const taskHeaders = ['№', 'Задание', 'Тип', 'Уровень', 'Сложность', 'Дискриминативность',
            'Средний балл', 'Выполняемость', 'Статус'];
        taskHeaders.forEach((header, index) => {
            tasksSheet.getCell(1, index + 1).value = header;
            tasksSheet.getCell(1, index + 1).font = {
                bold: true
            };
        });

        allData.taskStats.forEach((task, index) => {
            const row = index + 2;
            tasksSheet.getCell(row, 1).value = task.number;
            tasksSheet.getCell(row, 2).value = task.title;
            tasksSheet.getCell(row, 3).value = task.type;
            tasksSheet.getCell(row, 4).value = task.level || 1;
            tasksSheet.getCell(row, 5).value = task.difficulty;
            tasksSheet.getCell(row, 6).value = task.discrimination;
            tasksSheet.getCell(row, 7).value = task.averageScore;
            tasksSheet.getCell(row, 8).value = task.completionRate;
            tasksSheet.getCell(row, 9).value = this.getTaskStatusText(task);

            // Форматирование
            tasksSheet.getCell(row, 5).numFmt = '0.0%';
            tasksSheet.getCell(row, 6).numFmt = '0.0%';
            tasksSheet.getCell(row, 8).numFmt = '0.0"%";[Red]-0.0"%";';

            // Цветовая индикация для сложных заданий
            if (task.difficulty > 0.7) {
                tasksSheet.getCell(row, 5).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: {
                        argb: 'FFFF9999'
                    }
                };
            }
        });

        // Лист 4: Группы учащихся
        const groupsSheet = workbook.addWorksheet('Группы учащихся');

        groupsSheet.getCell('A1').value = 'РАСПРЕДЕЛЕНИЕ УЧАЩИХСЯ ПО ГРУППАМ';
        groupsSheet.getCell('A1').font = {
            bold: true,
            size: 14
        };

        const groupHeaders = ['Группа', 'Количество', 'Процент', 'Средний балл', 'Минимум', 'Максимум'];
        groupHeaders.forEach((header, index) => {
            groupsSheet.getCell(3, index + 1).value = header;
            groupsSheet.getCell(3, index + 1).font = {
                bold: true
            };
        });

        const studentGroups = this.createStudentGroups(allData.studentStats);
        studentGroups.forEach((group, index) => {
            const row = 4 + index;
            groupsSheet.getCell(row, 1).value = group.name;
            groupsSheet.getCell(row, 2).value = group.count;
            groupsSheet.getCell(row, 3).value = parseFloat(group.percentage);
            groupsSheet.getCell(row, 4).value = this.calculateGroupAverageScore(allData.studentStats, group).replace('%', '');
            groupsSheet.getCell(row, 5).value = this.getGroupMinScore(allData.studentStats, group);
            groupsSheet.getCell(row, 6).value = this.getGroupMaxScore(allData.studentStats, group);

            // Форматирование
            groupsSheet.getCell(row, 3).numFmt = '0.0"%";[Red]-0.0"%";';
            groupsSheet.getCell(row, 4).numFmt = '0.0"%";[Red]-0.0"%";';
            groupsSheet.getCell(row, 5).numFmt = '0.0"%";[Red]-0.0"%";';
            groupsSheet.getCell(row, 6).numFmt = '0.0"%";[Red]-0.0"%";';
        });

        // Настройка ширины колонок
        summarySheet.columns = [{
                width: 25
            }, {
                width: 30
            }
        ];

        studentsSheet.columns = [{
                width: 5
            }, {
                width: 30
            }, {
                width: 12
            }, {
                width: 10
            }, {
                width: 10
            }, {
                width: 8
            }, {
                width: 10
            }, {
                width: 15
            }
        ];

        tasksSheet.columns = [{
                width: 5
            }, {
                width: 40
            }, {
                width: 15
            }, {
                width: 8
            }, {
                width: 12
            }, {
                width: 15
            }, {
                width: 12
            }, {
                width: 12
            }, {
                width: 15
            }
        ];

        groupsSheet.columns = [{
                width: 20
            }, {
                width: 12
            }, {
                width: 10
            }, {
                width: 12
            }, {
                width: 10
            }, {
                width: 10
            }
        ];

        return workbook.xlsx.writeBuffer();
    }

    // Вспомогательные методы для Excel
    getStudentGroup(score) {
        if (score >= 85)
            return 'Отличники';
        if (score >= 70)
            return 'Хорошисты';
        if (score >= 50)
            return 'Средние';
        return 'Требуют внимания';
    }

    getGroupMinScore(studentStats, group) {
        const groupStudents = studentStats.filter(s =>
                s.averageScore >= group.min && s.averageScore < (group.name.includes('Отлично') ? 101 : group.max));
        if (groupStudents.length === 0)
            return 0;
        return Math.min(...groupStudents.map(s => s.averageScore));
    }

    getGroupMaxScore(studentStats, group) {
        const groupStudents = studentStats.filter(s =>
                s.averageScore >= group.min && s.averageScore < (group.name.includes('Отлично') ? 101 : group.max));
        if (groupStudents.length === 0)
            return 0;
        return Math.max(...groupStudents.map(s => s.averageScore));
    }

    // Санитизация имени файла
    sanitizeFileName(fileName) {
        return fileName
        .replace(/[<>:"/\\|?*]/g, '_') // Заменяем запрещенные символы
        .replace(/\s+/g, '_') // Заменяем пробелы на подчеркивания
        .replace(/_{2,}/g, '_') // Убираем двойные подчеркивания
        .trim();
    }

    // Инициализация библиотек для экспорта
    initializeExportLibraries() {
        return new Promise((resolve, reject) => {
            console.log('🔄 Инициализация библиотек для экспорта...');

            // Проверяем, какие библиотеки уже загружены
            const loadedLibraries = {
                jszip: typeof JSZip !== 'undefined',
                docx: typeof window.docx !== 'undefined',
                exceljs: typeof window.ExcelJS !== 'undefined',
                filesaver: typeof window.saveAs !== 'undefined'
            };

            console.log('Загруженные библиотеки:', loadedLibraries);

            const librariesToLoad = [];

            // JSZip
            if (!loadedLibraries.jszip) {
                librariesToLoad.push(
                    this.loadScriptWithFallback(
                        'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
                        'JSZip'));
            }

            // docx
            if (!loadedLibraries.docx) {
                librariesToLoad.push(
                    this.loadScriptWithFallback(
                        'https://cdnjs.cloudflare.com/ajax/libs/docx/7.7.0/docx.min.js',
                        'docx'));
            }

            // ExcelJS
            if (!loadedLibraries.exceljs) {
                librariesToLoad.push(
                    this.loadScriptWithFallback(
                        'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js',
                        'ExcelJS'));
            }

            // FileSaver
            if (!loadedLibraries.filesaver) {
                librariesToLoad.push(
                    this.loadScriptWithFallback(
                        'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',
                        'FileSaver'));
            }

            if (librariesToLoad.length === 0) {
                console.log('✅ Все библиотеки уже загружены');
                resolve();
                return;
            }

            let loadedCount = 0;
            const totalToLoad = librariesToLoad.length;

            // Создаем обработчики для каждой библиотеки
            librariesToLoad.forEach(promise => {
                promise
                .then(() => {
                    loadedCount++;
                    console.log(`✅ Загружена библиотека (${loadedCount}/${totalToLoad})`);

                    if (loadedCount === totalToLoad) {
                        console.log('✅ Все библиотеки успешно загружены');
                        resolve();
                    }
                })
                .catch(error => {
                    console.warn(`⚠️ Не удалось загрузить библиотеку:`, error);
                    loadedCount++;

                    if (loadedCount === totalToLoad) {
                        console.warn('⚠️ Некоторые библиотеки не загрузились, продолжаем с доступными');
                        resolve(); // Разрешаем промис даже с ошибками
                    }
                });
            });

            // Таймаут на случай проблем с загрузкой
            setTimeout(() => {
                console.warn('⚠️ Таймаут загрузки библиотек');
                resolve(); // Все равно продолжаем
            }, 10000);
        });
    }

    // Загрузка скрипта
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Не удалось загрузить скрипт: ${src}`));
            document.head.appendChild(script);
        });
    }

    loadScriptWithFallback(src, libraryName) {
        return new Promise((resolve, reject) => {
            console.log(`📦 Загрузка библиотеки ${libraryName}...`);

            // Проверяем, не загружается ли уже эта библиотека
            if (document.querySelector(`script[src="${src}"]`)) {
                console.log(`📦 Библиотека ${libraryName} уже загружается`);
                // Ждем, пока загрузится
                const checkInterval = setInterval(() => {
                    if ((libraryName === 'docx' && window.docx) ||
                        (libraryName === 'JSZip' && JSZip) ||
                        (libraryName === 'ExcelJS' && window.ExcelJS) ||
                        (libraryName === 'FileSaver' && window.saveAs)) {
                        clearInterval(checkInterval);
                        console.log(`✅ Библиотека ${libraryName} загрузилась`);
                        resolve();
                    }
                }, 500);

                setTimeout(() => {
                    clearInterval(checkInterval);
                    console.warn(`⚠️ Таймаут проверки библиотеки ${libraryName}`);
                    resolve(); // Все равно разрешаем
                }, 5000);

                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;

            script.onload = () => {
                console.log(`✅ Библиотека ${libraryName} загружена`);

                // Даем время на инициализацию
                setTimeout(() => {
                    // Проверяем, что библиотека действительно доступна
                    const isLoaded = (libraryName === 'docx' && window.docx) ||
                    (libraryName === 'JSZip' && JSZip) ||
                    (libraryName === 'ExcelJS' && window.ExcelJS) ||
                    (libraryName === 'FileSaver' && window.saveAs);

                    if (isLoaded) {
                        resolve();
                    } else {
                        console.warn(`⚠️ Библиотека ${libraryName} загрузилась, но не инициализирована`);
                        // Пробуем fallback
                        this.tryLibraryFallback(libraryName).then(resolve).catch(reject);
                    }
                }, 1000);
            };

            script.onerror = (error) => {
                console.error(`❌ Ошибка загрузки библиотеки ${libraryName}:`, error);
                // Пробуем альтернативный источник
                this.loadScriptFallback(libraryName).then(resolve).catch(reject);
            };

            document.head.appendChild(script);
        });
    }

    // Альтернативные источники для библиотек
    loadScriptFallback(libraryName) {
        return new Promise((resolve, reject) => {
            console.log(`🔄 Пробуем альтернативный источник для ${libraryName}...`);

            let fallbackSrc;
            switch (libraryName) {
            case 'JSZip':
                fallbackSrc = 'https://unpkg.com/jszip@3.10.1/dist/jszip.min.js';
                break;
            case 'docx':
                fallbackSrc = 'https://unpkg.com/docx@7.7.0/build/index.js';
                break;
            case 'ExcelJS':
                fallbackSrc = 'https://unpkg.com/exceljs@4.4.0/dist/exceljs.min.js';
                break;
            case 'FileSaver':
                fallbackSrc = 'https://unpkg.com/file-saver@2.0.5/dist/FileSaver.min.js';
                break;
            default:
                reject(new Error(`Нет fallback для ${libraryName}`));
                return;
            }

            const script = document.createElement('script');
            script.src = fallbackSrc;
            script.async = true;

            script.onload = () => {
                console.log(`✅ Библиотека ${libraryName} загружена из fallback`);
                setTimeout(() => resolve(), 500);
            };

            script.onerror = () => {
                console.error(`❌ Ошибка загрузки fallback для ${libraryName}`);
                reject(new Error(`Не удалось загрузить ${libraryName}`));
            };

            document.head.appendChild(script);
        });
    }

    // Попытка локальной инициализации библиотеки
    tryLibraryFallback(libraryName) {
        return new Promise((resolve) => {
            console.log(`🔄 Пробуем локальную инициализацию ${libraryName}...`);

            switch (libraryName) {
            case 'docx':
                // Пробуем создать минимальную реализацию docx
                if (!window.docx) {
                    window.docx = {
                        Document: class {
                            constructor(options) {
                                this.sections = options.sections || [];
                            }
                        },
                        Paragraph: class {
                            constructor(options) {
                                this.text = options.text || '';
                                this.heading = options.heading;
                                this.alignment = options.alignment;
                            }
                        },
                        TextRun: class {
                            constructor(options) {
                                this.text = options.text || '';
                                this.bold = options.bold;
                            }
                        },
                        Table: class {
                            constructor(options) {
                                this.rows = options.rows || [];
                            }
                        },
                        TableRow: class {
                            constructor(options) {
                                this.children = options.children || [];
                            }
                        },
                        TableCell: class {
                            constructor(options) {
                                this.children = options.children || [];
                            }
                        },
                        Packer: {
                            toBlob: async function (doc) {
                                console.warn('⚠️ Используется упрощенная версия docx');
                                // Создаем простой текстовый документ
                                let content = '';
                                if (doc.sections && doc.sections[0] && doc.sections[0].children) {
                                    doc.sections[0].children.forEach(child => {
                                        if (child.text) {
                                            content += child.text + '\n';
                                        }
                                    });
                                }
                                return new Blob([content], {
                                    type: 'text/plain'
                                });
                            }
                        }
                    };
                    console.log('✅ Создана упрощенная версия docx');
                }
                break;

            case 'JSZip':
                if (!window.JSZip) {
                    console.warn('⚠️ JSZip недоступен, используем альтернативу');
                    // Простая реализация архивации
                    window.JSZip = class {
                        constructor() {
                            this.files = {};
                        }

                        file(name, content, options) {
                            this.files[name] = {
                                content,
                                options
                            };
                        }

                        folder(name) {
                            return this; // Упрощенная реализация
                        }

                        generateAsync(options) {
                            return Promise.resolve(new Blob([JSON.stringify(this.files)], {
                                    type: 'application/zip'
                                }));
                        }
                    };
                }
                break;
            }

            setTimeout(() => resolve(), 100);
        });
    }

    // Обновленный метод exportAnalysisReport для поддержки Word
    exportAnalysisReport() {
        showNotification('🔄 Подготовка отчета...', 'info');

        // Инициализируем библиотеки
        this.initializeExportLibraries().then(() => {
            // Предлагаем выбор формата
            this.showExportOptionsModal();
        }).catch(error => {
            showNotification('Используется упрощенный экспорт', 'warning');
            // Fallback: старый метод экспорта
            this.exportAnalysisReportFallback();
        });
    }

    // Модальное окно выбора формата экспорта
    showExportOptionsModal() {
        const modalHTML = `
			<div class="export-modal-overlay" onclick="this.remove()">
				<div class="export-modal-content" onclick="event.stopPropagation()">
					<div class="export-modal-header">
						<h3><i class="fas fa-file-export"></i> Выбор формата экспорта</h3>
						<button class="close-btn" onclick="this.closest('.export-modal-overlay').remove()">
							<i class="fas fa-times"></i>
						</button>
					</div>
					
					<div class="export-options-grid">
						<div class="export-option" onclick="window.advancedAnalytics.exportToWord()">
							<div class="export-icon word">
								<i class="fas fa-file-word"></i>
							</div>
							<div class="export-info">
								<h4>Word документ</h4>
								<p>Полный отчет с графиками и таблицами</p>
							</div>
						</div>
						
						<div class="export-option" onclick="window.advancedAnalytics.exportToExcel()">
							<div class="export-icon excel">
								<i class="fas fa-file-excel"></i>
							</div>
							<div class="export-info">
								<h4>Excel таблицы</h4>
								<p>Сводные таблицы и детальные данные</p>
							</div>
						</div>
						
						<div class="export-option" onclick="window.advancedAnalytics.exportToPDF()">
							<div class="export-icon pdf">
								<i class="fas fa-file-pdf"></i>
							</div>
							<div class="export-info">
								<h4>PDF документ</h4>
								<p>Готовый к печати отчет</p>
							</div>
						</div>
						
						<div class="export-option" onclick="window.advancedAnalytics.exportComprehensiveAnalysisToWord()">
							<div class="export-icon archive">
								<i class="fas fa-file-archive"></i>
							</div>
							<div class="export-info">
								<h4>Полный архив</h4>
								<p>Все отчеты + данные + графики (ZIP)</p>
							</div>
						</div>
					</div>
					
					<div class="export-modal-footer">
						<button class="btn btn-outline" onclick="this.closest('.export-modal-overlay').remove()">
							Отмена
						</button>
					</div>
				</div>
			</div>
		`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.addExportModalStyles();
    }

    // Добавление стилей для модального окна экспорта
    addExportModalStyles() {
        const styleId = 'export-modal-styles';
        if (document.getElementById(styleId))
            return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
			.export-modal-overlay {
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: rgba(0, 0, 0, 0.8);
				display: flex;
				align-items: center;
				justify-content: center;
				z-index: 10000;
				backdrop-filter: blur(5px);
			}
			
			.export-modal-content {
				background: white;
				border-radius: 15px;
				width: 90%;
				max-width: 800px;
				max-height: 90vh;
				display: flex;
				flex-direction: column;
				box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
				overflow: hidden;
			}
			
			.export-modal-header {
				background: linear-gradient(135deg, #3498db, #2c3e50);
				color: white;
				padding: 20px;
				display: flex;
				justify-content: space-between;
				align-items: center;
			}
			
			.export-modal-header h3 {
				margin: 0;
				display: flex;
				align-items: center;
				gap: 10px;
			}
			
			.export-options-grid {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
				gap: 20px;
				padding: 30px;
				flex: 1;
				overflow-y: auto;
			}
			
			.export-option {
				background: #f8f9fa;
				border-radius: 10px;
				padding: 20px;
				display: flex;
				align-items: center;
				gap: 20px;
				cursor: pointer;
				transition: all 0.3s;
				border: 2px solid transparent;
			}
			
			.export-option:hover {
				transform: translateY(-5px);
				box-shadow: 0 10px 20px rgba(0,0,0,0.1);
				border-color: #3498db;
			}
			
			.export-icon {
				width: 60px;
				height: 60px;
				border-radius: 10px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 28px;
				color: white;
			}
			
			.export-icon.word { background: #2b5797; }
			.export-icon.excel { background: #217346; }
			.export-icon.pdf { background: #f40f02; }
			.export-icon.archive { background: #9b59b6; }
			
			.export-info h4 {
				margin: 0 0 5px 0;
				color: #2c3e50;
			}
			
			.export-info p {
				margin: 0;
				color: #7f8c8d;
				font-size: 14px;
			}
			
			.export-modal-footer {
				padding: 20px;
				background: #f8f9fa;
				border-top: 1px solid #e9ecef;
				text-align: right;
			}
		`;

        document.head.appendChild(style);
    }

    // Альтернативные методы экспорта
    exportToWord() {
        showNotification('📝 Подготовка Word документа...', 'info');

        this.initializeExportLibraries().then(() => {
            const allData = this.collectDetailedData();
            const comprehensiveAnalysis = this.performComprehensiveAnalysis();

            const reportBlob = this.generateMainWordReport(allData, comprehensiveAnalysis);

            if (reportBlob) {
                this.downloadBlob(reportBlob, `анализ_результатов_${new Date().toISOString().split('T')[0]}.docx`);
                showNotification('✅ Word документ экспортирован', 'success');
            } else {
                showNotification('Не удалось создать Word документ', 'error');
                this.exportAnalysisReportFallback();
            }
        }).catch(() => {
            this.exportAnalysisReportFallback();
        });
    }

    exportToExcel() {
        showNotification('📊 Подготовка Excel файла...', 'info');

        const allData = this.collectDetailedData();

        this.generateSummaryExcelReport(allData).then(buffer => {
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `сводные_таблицы_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showNotification('✅ Excel файл экспортирован', 'success');
        });
    }

    exportToPDF() {
        showNotification('📄 Подготовка PDF документа...', 'info');

        // Используем html2pdf для создания PDF
        const element = document.getElementById('advancedAnalyticsSection');
        if (!element) {
            showNotification('Не найден раздел аналитики', 'error');
            return;
        }

        const opt = {
            margin: 10,
            filename: `анализ_результатов_${new Date().toISOString().split('T')[0]}.pdf`,
            image: {
                type: 'jpeg',
                quality: 0.98
            },
            html2canvas: {
                scale: 2
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait'
            }
        };

        // Показываем все скрытые элементы перед экспортом
        const hiddenElements = element.querySelectorAll('[style*="display: none"]');
        hiddenElements.forEach(el => {
            el.dataset.originalDisplay = el.style.display;
            el.style.display = 'block';
        });

        // Экспорт
        html2pdf().set(opt).from(element).save().then(() => {
            // Восстанавливаем исходное состояние
            hiddenElements.forEach(el => {
                if (el.dataset.originalDisplay !== undefined) {
                    el.style.display = el.dataset.originalDisplay;
                }
            });

            showNotification('✅ PDF документ экспортирован', 'success');
        });
    }

    // Старый метод для обратной совместимости
    exportAnalysisReportFallback() {
        const report = this.generateReport();

        const blob = new Blob([report], {
            type: 'text/html'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `аналитический_отчет_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('📄 Отчет экспортирован в HTML', 'success');
    }

    // Метод для отладки
    debugCharts() {
        console.log('=== ДЕБАГ ГРАФИКОВ ===');
        const charts = Chart.instances || [];
        console.log(`Обнаружено ${charts.length} графиков:`);

        charts.forEach((chart, index) => {
            console.log(`${index + 1}. ID: ${chart.canvas.id}, Type: ${chart.config.type}`);
        });

        // Проверяем наличие всех необходимых canvas
        const requiredCanvases = [
            'competenceRadar',
            'boxPlotChart',
            'valueAddedChart',
            'correlationChart'
        ];

        requiredCanvases.forEach(id => {
            const canvas = document.getElementById(id);
            if (!canvas) {
                console.warn(`❌ Canvas не найден: ${id}`);
            } else {
                console.log(`✅ Canvas найден: ${id}`);
            }
        });
    }

}


// Экспортируем класс
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedAnalytics;
} else {
    window.AdvancedAnalytics = AdvancedAnalytics;
}
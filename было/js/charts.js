/**
 * Модуль для работы с графиками и визуализацией данных
 */

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================

// Хранилище экземпляров графиков
const chartInstances = new Map();

// Цветовые палитры
const CHART_COLORS = {
    primary: '#3498db',
    success: '#27ae60',
    warning: '#f39c12',
    danger: '#e74c3c',
    info: '#9b59b6',
    dark: '#2c3e50',
    light: '#ecf0f1'
};

const COMPLEXITY_COLORS = {
    1: CHART_COLORS.success,
    2: CHART_COLORS.primary,
    3: CHART_COLORS.warning,
    4: CHART_COLORS.danger
};

// ==================== ОСНОВНЫЕ ФУНКЦИИ ГРАФИКОВ ====================

/**
 * Инициализация всех графиков
 */
function initAllCharts() {
    console.log('📊 Инициализация графиков...');
    
    try {
        // Основные графики
        initGradesChart();
        initComplexityChart();
        initSolvabilityChart();
        
        // Тепловая карта
        updateHeatmap();
        
        // Специализированные графики по типу работы
        switch(app.data.test.workType) {
            case 'vpr':
                initVPRCharts();
                break;
            case 'func_literacy':
                initLiteracyCharts();
                break;
            case 'psychology':
                initPsychologyCharts();
                break;
            case 'oge':
            case 'ege':
                initGIACharts();
                break;
        }
        
        console.log('✅ Графики инициализированы');
    } catch (error) {
        console.error('❌ Ошибка инициализации графиков:', error);
    }
}

/**
 * Уничтожение всех графиков
 */
function destroyAllCharts() {
    chartInstances.forEach((chart, id) => {
        try {
            chart.destroy();
        } catch (error) {
            console.warn(`Не удалось уничтожить график ${id}:`, error);
        }
    });
    chartInstances.clear();
}

/**
 * Обновление всех графиков
 */
function updateAllCharts() {
    destroyAllCharts();
    initAllCharts();
}

/**
 * Обновление визуализации (вызывается при переключении на вкладку)
 */
function updateVisualization() {
    setTimeout(() => {
        updateAllCharts();
    }, 100);
}

// ==================== ГРАФИК РАСПРЕДЕЛЕНИЯ ОЦЕНОК ====================

/**
 * Инициализация графика распределения оценок
 */
function initGradesChart() {
    const canvas = document.getElementById('gradesChart');
    if (!canvas) {
        console.warn('Canvas gradesChart не найден, откладываем инициализацию');
        return;
    }
    
    // Уничтожаем старый график если есть
    if (chartInstances.has('gradesChart')) {
        chartInstances.get('gradesChart').destroy();
    }
    
    // Подготавливаем данные
    const grades = calculateGradeDistribution();
    const labels = ['5 (отлично)', '4 (хорошо)', '3 (удовлетв.)', '2 (неудовл.)'];
    const data = [grades[5] || 0, grades[4] || 0, grades[3] || 0, grades[2] || 0];
    const colors = [
        CHART_COLORS.success,
        CHART_COLORS.primary,
        CHART_COLORS.warning,
        CHART_COLORS.danger
    ];
    
    // Создаем график
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Количество учащихся',
                data: data,
                backgroundColor: colors.map(color => color + 'CC'),
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 12,
                            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                            return `${context.dataset.label}: ${context.raw} (${percentage}%)`;
                        },
                        afterLabel: function(context) {
                            const grade = context.dataIndex === 0 ? 5 : 
                                         context.dataIndex === 1 ? 4 :
                                         context.dataIndex === 2 ? 3 : 2;
                            return getGradeDescription(grade);
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 13 },
                    bodyFont: { size: 12 },
                    padding: 12
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Количество учащихся',
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            size: 11
                        },
                        stepSize: 1
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Оценки',
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
    
    // Сохраняем экземпляр графика
    chartInstances.set('gradesChart', chart);
}

/**
 * Расчет распределения оценок
 * @returns {Object} Распределение оценок
 */
function calculateGradeDistribution() {
    if (!app.data.results || app.data.results.length === 0) {
        return { 5: 0, 4: 0, 3: 0, 2: 0 };
    }
    
    const grades = { 5: 0, 4: 0, 3: 0, 2: 0 };
    
    app.data.results.forEach(scores => {
        const total = scores.reduce((sum, score) => sum + (score || 0), 0);
        const grade = app.calculateGrade(total);
        if (grades[grade] !== undefined) {
            grades[grade]++;
        }
    });
    
    return grades;
}

/**
 * Получение описания оценки
 * @param {number} grade - Оценка
 * @returns {string} Описание
 */
function getGradeDescription(grade) {
    const descriptions = {
        5: 'Высокий уровень усвоения материала',
        4: 'Хороший уровень знаний',
        3: 'Удовлетворительный уровень',
        2: 'Необходима дополнительная работа'
    };
    return descriptions[grade] || '';
}

// ==================== ГРАФИК СЛОЖНОСТИ ЗАДАНИЙ ====================

/**
 * Инициализация графика сложности заданий
 */
function initComplexityChart() {
    const canvas = document.getElementById('complexityChart');
    if (!canvas) return;
    
    if (chartInstances.has('complexityChart')) {
        chartInstances.get('complexityChart').destroy();
    }
    
    // Собираем данные по уровням сложности
    const levelData = {};
    Object.keys(COMPLEXITY_COLORS).forEach(level => {
        levelData[level] = {
            tasks: [],
            completion: 0,
            avgScore: 0
        };
    });
    
    // Заполняем данные
    app.data.tasks.forEach((task, taskIndex) => {
        const level = task.level.toString();
        if (!levelData[level]) return;
        
        const maxScore = task.maxScore || 0;
        const scores = app.data.results.map(student => student[taskIndex] || 0);
        const totalScore = scores.reduce((sum, score) => sum + score, 0);
        const completion = maxScore > 0 ? (totalScore / (maxScore * scores.length)) * 100 : 0;
        
        levelData[level].tasks.push(taskIndex + 1);
        levelData[level].completion += completion;
        levelData[level].avgScore += totalScore / scores.length;
    });
    
    // Подготавливаем данные для графика
    const labels = [];
    const completionData = [];
    const avgScoreData = [];
    const colors = [];
    
    Object.entries(levelData).forEach(([level, data]) => {
        if (data.tasks.length > 0) {
            const levelInfo = COMPLEXITY_LEVELS[level];
            labels.push(`${level}. ${levelInfo?.name || 'Уровень ' + level}`);
            completionData.push(data.completion / data.tasks.length);
            avgScoreData.push(data.avgScore / data.tasks.length);
            colors.push(COMPLEXITY_COLORS[level] || CHART_COLORS.primary);
        }
    });
    
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Процент выполнения (%)',
                    data: completionData,
                    backgroundColor: colors.map(color => color + '99'),
                    borderColor: colors,
                    borderWidth: 2,
                    yAxisID: 'y'
                },
                {
                    label: 'Средний балл',
                    data: avgScoreData,
                    type: 'line',
                    borderColor: CHART_COLORS.dark,
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    pointRadius: 6,
                    pointBackgroundColor: CHART_COLORS.dark,
                    pointBorderColor: 'white',
                    pointBorderWidth: 2,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.datasetIndex === 0) {
                                label += context.parsed.y.toFixed(1) + '%';
                            } else {
                                label += context.parsed.y.toFixed(2);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Процент выполнения (%)'
                    },
                    min: 0,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: function(context) {
                            const value = context.tick.value;
                            if (value === 30 || value === 60 || value === 90) {
                                return 'rgba(0, 0, 0, 0.3)';
                            }
                            return 'rgba(0, 0, 0, 0.1)';
                        },
                        lineWidth: function(context) {
                            const value = context.tick.value;
                            if (value === 30 || value === 60 || value === 90) {
                                return 2;
                            }
                            return 1;
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Средний балл'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
    
    chartInstances.set('complexityChart', chart);
}

// ==================== ГРАФИК КОРИДОРА РЕШАЕМОСТИ ====================

/**
 * Инициализация графика коридора решаемости
 */
function initSolvabilityChart() {
    const canvas = document.getElementById('solvabilityChart');
    if (!canvas) return;
    
    if (chartInstances.has('solvabilityChart')) {
        chartInstances.get('solvabilityChart').destroy();
    }
    
    // Рассчитываем решаемость каждого задания
    const tasksData = [];
    const taskLabels = [];
    
    app.data.tasks.forEach((task, index) => {
        const maxScore = task.maxScore || 0;
        const scores = app.data.results.map(student => student[index] || 0);
        const totalScore = scores.reduce((sum, score) => sum + score, 0);
        const completion = maxScore > 0 ? (totalScore / (maxScore * scores.length)) * 100 : 0;
        
        tasksData.push({
            index: index,
            number: index + 1,
            completion: completion,
            level: task.level,
            type: task.type
        });
        
        taskLabels.push(`${index + 1}`);
    });
    
    // Сортируем по проценту выполнения
    tasksData.sort((a, b) => a.completion - b.completion);
    
    const completionData = tasksData.map(task => task.completion);
    const levelColors = tasksData.map(task => COMPLEXITY_COLORS[task.level] || CHART_COLORS.primary);
    
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: tasksData.map(task => task.number.toString()),
            datasets: [{
                label: 'Процент выполнения',
                data: completionData,
                backgroundColor: levelColors.map(color => color + 'CC'),
                borderColor: levelColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const task = tasksData[context[0].dataIndex];
                            return `Задание ${task.number}: ${task.type}`;
                        },
                        label: function(context) {
                            const task = tasksData[context.dataIndex];
                            const zone = getSolvabilityZone(task.completion);
                            return [
                                `Выполнение: ${task.completion.toFixed(1)}%`,
                                `Уровень: ${task.level} (${COMPLEXITY_LEVELS[task.level]?.name || 'Неизвестно'})`,
                                `Зона: ${zone.name}`
                            ];
                        },
                        footer: function(context) {
                            const task = tasksData[context[0].dataIndex];
                            return getSolvabilityZone(task.completion).recommendation;
                        }
                    }
                },
                annotation: {
                    annotations: {
                        zone1: {
                            type: 'box',
                            yMin: 0,
                            yMax: 30,
                            backgroundColor: 'rgba(231, 76, 60, 0.1)',
                            borderColor: 'rgba(231, 76, 60, 0.3)',
                            borderWidth: 1,
                            label: {
                                display: true,
                                content: 'Красная зона (<30%)',
                                position: 'center',
                                backgroundColor: 'rgba(231, 76, 60, 0.8)',
                                color: 'white',
                                font: {
                                    size: 11
                                }
                            }
                        },
                        zone2: {
                            type: 'box',
                            yMin: 30,
                            yMax: 60,
                            backgroundColor: 'rgba(243, 156, 18, 0.1)',
                            borderColor: 'rgba(243, 156, 18, 0.3)',
                            borderWidth: 1,
                            label: {
                                display: true,
                                content: 'Желтая зона (30-60%)',
                                position: 'center',
                                backgroundColor: 'rgba(243, 156, 18, 0.8)',
                                color: 'white',
                                font: {
                                    size: 11
                                }
                            }
                        },
                        zone3: {
                            type: 'box',
                            yMin: 60,
                            yMax: 90,
                            backgroundColor: 'rgba(46, 204, 113, 0.1)',
                            borderColor: 'rgba(46, 204, 113, 0.3)',
                            borderWidth: 1,
                            label: {
                                display: true,
                                content: 'Зеленая зона (60-90%)',
                                position: 'center',
                                backgroundColor: 'rgba(46, 204, 113, 0.8)',
                                color: 'white',
                                font: {
                                    size: 11
                                }
                            }
                        },
                        zone4: {
                            type: 'box',
                            yMin: 90,
                            yMax: 100,
                            backgroundColor: 'rgba(39, 174, 96, 0.1)',
                            borderColor: 'rgba(39, 174, 96, 0.3)',
                            borderWidth: 1,
                            label: {
                                display: true,
                                content: 'Отличная зона (>90%)',
                                position: 'center',
                                backgroundColor: 'rgba(39, 174, 96, 0.8)',
                                color: 'white',
                                font: {
                                    size: 11
                                }
                            }
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Процент выполнения (%)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Номер задания'
                    }
                }
            }
        }
    });
    
    chartInstances.set('solvabilityChart', chart);
}

/**
 * Определение зоны решаемости
 * @param {number} percentage - Процент выполнения
 * @returns {Object} Информация о зоне
 */
function getSolvabilityZone(percentage) {
    if (percentage < 30) {
        return {
            name: 'Красная зона',
            color: '#e74c3c',
            recommendation: 'Требуется повторное объяснение материала'
        };
    } else if (percentage < 60) {
        return {
            name: 'Желтая зона',
            color: '#f39c12',
            recommendation: 'Требуются коррекционные мероприятия'
        };
    } else if (percentage < 90) {
        return {
            name: 'Зеленая зона',
            color: '#27ae60',
            recommendation: 'Материал усвоен хорошо'
        };
    } else {
        return {
            name: 'Отличная зона',
            color: '#2ecc71',
            recommendation: 'Высокий уровень усвоения'
        };
    }
}

// ==================== ТЕПЛОВАЯ КАРТА ====================

/**
 * Обновление тепловой карты
 */
function updateHeatmap() {
    const container = document.getElementById('heatmapContainer');
    if (!container) return;
    
    if (app.data.students.length === 0 || app.data.tasks.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Нет данных для тепловой карты</p>';
        return;
    }
    
    // Создаем таблицу тепловой карты
    let html = '<table style="width: 100%; border-collapse: collapse; font-size: 11px;">';
    
    // Заголовок с номерами заданий
    html += '<thead><tr><th style="padding: 8px; background: #34495e; color: white;">Учащийся</th>';
    app.data.tasks.forEach((task, i) => {
        html += `<th style="padding: 8px; background: #34495e; color: white; text-align: center;" 
                      title="Задание ${i+1}: ${task.type}">${i+1}</th>`;
    });
    html += '<th style="padding: 8px; background: #34495e; color: white; text-align: center;">Итог</th></tr></thead>';
    
    // Данные по учащимся
    html += '<tbody>';
    
    app.data.students.forEach((student, studentIndex) => {
        const scores = app.data.results[studentIndex] || [];
        const totalScore = scores.reduce((sum, score) => sum + (score || 0), 0);
        const maxPossible = app.data.tasks.reduce((sum, task) => sum + (task.maxScore || 0), 0);
        const totalPercentage = maxPossible > 0 ? (totalScore / maxPossible * 100) : 0;
        
        html += '<tr>';
        html += `<td style="padding: 8px; background: #f8f9fa; font-weight: bold; white-space: nowrap;">${student}</td>`;
        
        // Ячейки с баллами за задания
        scores.forEach((score, taskIndex) => {
            const task = app.data.tasks[taskIndex];
            const maxScore = task?.maxScore || 0;
            const percentage = maxScore > 0 ? (score / maxScore * 100) : 0;
            const heatmapClass = getHeatmapClass(percentage);
            const title = `Задание ${taskIndex+1}: ${score}/${maxScore} (${percentage.toFixed(1)}%)`;
            
            html += `<td class="heatmap-cell ${heatmapClass}" style="padding: 8px; text-align: center;" title="${title}">${score}</td>`;
        });
        
        // Итоговая ячейка
        const totalHeatmapClass = getHeatmapClass(totalPercentage);
        html += `<td class="heatmap-cell ${totalHeatmapClass}" style="padding: 8px; text-align: center; font-weight: bold;" 
                     title="Итог: ${totalScore}/${maxPossible} (${totalPercentage.toFixed(1)}%)">
                    ${totalScore}
                 </td>`;
        
        html += '</tr>';
    });
    
    // Строка со средними значениями по заданиям
    html += '<tr style="background: #f1f8ff;">';
    html += '<td style="padding: 8px; font-weight: bold; color: #2c3e50;">Среднее</td>';
    
    app.data.tasks.forEach((task, taskIndex) => {
        const maxScore = task.maxScore || 0;
        const scores = app.data.results.map(student => student[taskIndex] || 0);
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const percentage = maxScore > 0 ? (avgScore / maxScore * 100) : 0;
        const heatmapClass = getHeatmapClass(percentage);
        
        html += `<td class="heatmap-cell ${heatmapClass}" style="padding: 8px; text-align: center; font-weight: bold;" 
                     title="Среднее: ${avgScore.toFixed(1)}/${maxScore} (${percentage.toFixed(1)}%)">
                    ${avgScore.toFixed(1)}
                 </td>`;
    });
    
    // Итоговое среднее
    const totalScores = app.data.results.map(scores => 
        scores.reduce((sum, score) => sum + (score || 0), 0)
    );
    const avgTotalScore = totalScores.reduce((a, b) => a + b, 0) / totalScores.length;
    const maxPossibleTotal = app.data.tasks.reduce((sum, task) => sum + (task.maxScore || 0), 0);
    const avgTotalPercentage = maxPossibleTotal > 0 ? (avgTotalScore / maxPossibleTotal * 100) : 0;
    const totalHeatmapClass = getHeatmapClass(avgTotalPercentage);
    
    html += `<td class="heatmap-cell ${totalHeatmapClass}" style="padding: 8px; text-align: center; font-weight: bold;" 
                 title="Средний итог: ${avgTotalScore.toFixed(1)}/${maxPossibleTotal} (${avgTotalPercentage.toFixed(1)}%)">
                ${avgTotalScore.toFixed(1)}
             </td>`;
    
    html += '</tr></tbody></table>';
    
    container.innerHTML = html;
}

/**
 * Получение класса для тепловой карты по проценту
 * @param {number} percentage - Процент выполнения
 * @returns {string} CSS класс
 */
function getHeatmapClass(percentage) {
    if (percentage >= 90) return 'heatmap-100';
    if (percentage >= 80) return 'heatmap-80';
    if (percentage >= 60) return 'heatmap-60';
    if (percentage >= 40) return 'heatmap-40';
    if (percentage >= 20) return 'heatmap-20';
    return 'heatmap-0';
}

// ==================== СПЕЦИАЛИЗИРОВАННЫЕ ГРАФИКИ ====================

/**
 * Инициализация графиков для ВПР
 */
function initVPRCharts() {
    const container = document.getElementById('specializedCharts');
    if (!container) return;
    
    container.innerHTML = `
        <div class="chart-row">
            <div class="chart-container">
                <h3>📊 Компетенции ВПР</h3>
                <canvas id="vprCompetenciesChart" height="300"></canvas>
            </div>
            <div class="chart-container">
                <h3>🎯 Уровни ВПР</h3>
                <canvas id="vprLevelsChart" height="300"></canvas>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        initVPRCompetenciesChart();
        initVPRLevelsChart();
    }, 100);
}

/**
 * График компетенций ВПР
 */
function initVPRCompetenciesChart() {
    const canvas = document.getElementById('vprCompetenciesChart');
    if (!canvas) return;
    
    // Собираем данные по компетенциям
    const competencies = {
        text_work: { name: 'Работа с текстом', total: 0, max: 0 },
        calculations: { name: 'Вычисления', total: 0, max: 0 },
        logic: { name: 'Логика', total: 0, max: 0 },
        graphics: { name: 'Графика', total: 0, max: 0 },
        data_work: { name: 'Данные', total: 0, max: 0 }
    };
    
    app.data.tasks.forEach((task, taskIndex) => {
        const competence = task.competence;
        if (competence && competencies[competence]) {
            const maxScore = task.maxScore || 0;
            const scores = app.data.results.map(student => student[taskIndex] || 0);
            const totalScore = scores.reduce((sum, score) => sum + score, 0);
            
            competencies[competence].total += totalScore;
            competencies[competence].max += maxScore * scores.length;
        }
    });
    
    // Фильтруем только использованные компетенции
    const usedCompetencies = Object.entries(competencies)
        .filter(([_, data]) => data.max > 0)
        .map(([key, data]) => ({
            key,
            name: data.name,
            percentage: (data.total / data.max) * 100
        }));
    
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: usedCompetencies.map(c => c.name),
            datasets: [{
                label: 'Выполнение компетенций (%)',
                data: usedCompetencies.map(c => c.percentage),
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderColor: CHART_COLORS.primary,
                pointBackgroundColor: CHART_COLORS.primary,
                pointBorderColor: '#fff',
                pointHoverRadius: 8,
                borderWidth: 2
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
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    pointLabels: {
                        font: {
                            size: 11
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toFixed(1)}%`;
                        }
                    }
                }
            }
        }
    });
    
    chartInstances.set('vprCompetenciesChart', chart);
}

// ==================== ЭКСПОРТ ГРАФИКОВ ====================

/**
 * Экспорт графика как изображение
 * @param {string} chartId - ID canvas элемента
 * @param {string} filename - Имя файла
 */
function exportChartAsImage(chartId, filename = 'chart.png') {
    const canvas = document.getElementById(chartId);
    if (!canvas) {
        showNotification('График не найден', 'error');
        return;
    }
    
    try {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`График экспортирован как ${filename}`, 'success');
    } catch (error) {
        console.error('Ошибка экспорта графика:', error);
        showNotification('Ошибка экспорта графика', 'error');
    }
}

/**
 * Экспорт всех графиков как изображения
 */
function exportAllChartsAsImages() {
    const chartIds = ['gradesChart', 'complexityChart', 'solvabilityChart'];
    let exported = 0;
    
    chartIds.forEach((chartId, index) => {
        setTimeout(() => {
            exportChartAsImage(chartId, `${chartId}_${new Date().toISOString().slice(0, 10)}.png`);
            exported++;
            
            if (exported === chartIds.length) {
                showNotification('Все графики экспортированы', 'success');
            }
        }, index * 500); // Задержка между экспортами
    });
}

/**
 * Сохранение графиков в PDF
 */
function saveChartsToPDF() {
    if (typeof exportModule !== 'undefined' && exportModule.exportToPDF) {
        exportModule.exportToPDF();
    } else {
        showNotification('Модуль экспорта PDF не загружен', 'error');
    }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Проверка и обновление размеров графиков при изменении размера окна
 */
function handleWindowResize() {
    chartInstances.forEach(chart => {
        try {
            chart.resize();
        } catch (error) {
            // Игнорируем ошибки при изменении размера
        }
    });
}

// Инициализация обработчика изменения размера окна
window.addEventListener('resize', utils.debounce(handleWindowResize, 250));

/**
 * Получение информации о графике
 * @param {string} chartId - ID графика
 * @returns {Object} Информация о графике
 */
function getChartInfo(chartId) {
    const chart = chartInstances.get(chartId);
    if (!chart) return null;
    
    return {
        id: chartId,
        type: chart.config.type,
        dataPoints: chart.data.datasets[0]?.data?.length || 0,
        isVisible: chart.canvas.offsetParent !== null
    };
}

/**
 * Получение статистики по всем графикам
 * @returns {Object} Статистика
 */
function getChartsStats() {
    const stats = {
        total: chartInstances.size,
        types: {},
        active: 0
    };
    
    chartInstances.forEach((chart, id) => {
        const type = chart.config.type;
        stats.types[type] = (stats.types[type] || 0) + 1;
        
        if (chart.canvas.offsetParent !== null) {
            stats.active++;
        }
    });
    
    return stats;
}

// ==================== ЭКСПОРТ ФУНКЦИЙ ====================

// Экспорт всех функций
window.charts = {
    // Основные функции
    initAllCharts,
    destroyAllCharts,
    updateAllCharts,
    updateVisualization,
    
    // Функции отдельных графиков
    initGradesChart,
    initComplexityChart,
    initSolvabilityChart,
    updateHeatmap,
    
    // Специализированные графики
    initVPRCharts,
    initVPRCompetenciesChart,
    
    // Экспорт
    exportChartAsImage,
    exportAllChartsAsImages,
    saveChartsToPDF,
    
    // Вспомогательные функции
    getChartInfo,
    getChartsStats,
    handleWindowResize,
    
    // Данные
    colors: CHART_COLORS,
    complexityColors: COMPLEXITY_COLORS
};

console.log('✅ charts.js загружен');
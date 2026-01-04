// Этот модуль принимает данные как параметр и генерирует отчёт

// Цвета для визуализаций
const colors = {
    grades: {
        5: '#27ae60',
        4: '#3498db', 
        3: '#f39c12',
        2: '#e74c3c'
    },
    stats: {
        present: '#3498db',
        total: '#2c3e50',
        absent: '#7f8c8d',
        maxScore: '#9b59b6'
    },
    complexity: {
        1: '#27ae60',
        2: '#3498db',
        3: '#f39c12',
        4: '#e74c3c'
    }
};

// Основная функция генерации HTML отчёта
export function generateReportHTML(data) {
    if (!data || !data.test || !data.students || !data.tasks || !data.results) {
        return '<h1>❌ Ошибка: Недостаточно данных для генерации отчёта</h1>';
    }
    
    // Вычисляем статистику
    const stats = calculateStatistics(data);
    
    // Генерируем полный HTML отчёт
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Аналитический отчёт - ${data.test.subject}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 10mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', 'Roboto', sans-serif;
        }
        
        body {
            background: white;
            padding: 0;
            width: 297mm;
            height: 210mm;
            margin: 0 auto;
            font-size: 9px;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        .report-container {
            display: grid;
            grid-template-columns: 1.4fr 0.6fr;
            gap: 12px;
            height: 100%;
            padding: 8px 10px;
        }
        
        .left-column, .right-column {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .header-compact {
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
            gap: 12px;
            padding: 8px 10px;
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            border-radius: 6px;
            border-left: 4px solid #3498db;
        }
        
        .work-title-compact h1 {
            font-size: 15px;
            color: #2c3e50;
            font-weight: 700;
            line-height: 1.2;
            margin-bottom: 3px;
        }
        
        .work-subtitle-compact {
            font-size: 10px;
            color: #7f8c8d;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .stats-circle-container {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 5px;
        }
        
        .stat-circle {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .stat-value-circle {
            font-size: 11px;
            font-weight: 700;
            color: white;
        }
        
        .stat-label-circle {
            font-size: 7px;
            color: white;
            text-align: center;
            margin-top: 1px;
        }
        
        .table-container {
            flex: 1;
            overflow: hidden;
            border: 1px solid #ddd;
            border-radius: 5px;
            background: white;
        }
        
        .results-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            table-layout: fixed;
        }
        
        .results-table th {
            background: linear-gradient(to bottom, #3498db, #2980b9);
            color: white;
            font-weight: 600;
            padding: 4px 2px;
            text-align: center;
            border: 1px solid #ddd;
            position: sticky;
            top: 0;
            z-index: 10;
            height: 20px;
            vertical-align: middle;
        }
        
        .results-table td {
            padding: 2px 1px;
            text-align: center;
            border: 1px solid #eee;
            height: 16px;
            vertical-align: middle;
        }
        
        .student-cell {
            text-align: left;
            padding-left: 4px !important;
            font-size: 7.5px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 60px;
        }
        
        .total-score {
            font-weight: 700;
            background-color: #f8f9fa;
        }
        
        .grade-cell {
            font-weight: 700;
            font-size: 9px;
        }
        
        .grade-5 { color: #27ae60; background-color: rgba(39, 174, 96, 0.08); }
        .grade-4 { color: #3498db; background-color: rgba(52, 152, 219, 0.08); }
        .grade-3 { color: #f39c12; background-color: rgba(243, 156, 18, 0.08); }
        .grade-2 { color: #e74c3c; background-color: rgba(231, 76, 60, 0.08); }
        
        .percentage-row td {
            background-color: #e8f4fc !important;
            font-weight: 600;
            font-size: 7.5px;
            padding: 1px !important;
            color: #2c3e50;
        }
        
        .right-section {
            background: white;
            border-radius: 6px;
            padding: 8px;
            border: 1px solid #e0e0e0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .section-title {
            font-size: 10px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 6px;
            padding-bottom: 4px;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .date-time-box {
            background: linear-gradient(135deg, #2c3e50, #34495e);
            color: white;
            padding: 6px;
            border-radius: 5px;
            text-align: center;
        }
        
        .date-value {
            font-size: 11px;
            font-weight: 700;
            margin-top: 2px;
        }
        
        /* КОМПАКТНЫЕ ВИЗУАЛИЗАЦИИ ДЛЯ ВТОРОЙ СТРАНИЦЫ */
        .compact-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            padding: 10px;
        }
        
        .compact-chart {
            background: white;
            border-radius: 6px;
            padding: 10px;
            border: 1px solid #e0e0e0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .compact-title {
            font-size: 11px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 8px;
            padding-bottom: 5px;
            border-bottom: 2px solid #3498db;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        /* КОРИДОР РЕШАЕМОСТИ - КОМПАКТНАЯ ВЕРСИЯ */
        .compact-corridor {
            height: 80px;
            position: relative;
            margin-top: 10px;
        }
        
        .corridor-mini {
            display: flex;
            align-items: flex-end;
            height: 100%;
            gap: 3px;
            padding: 0 5px;
        }
        
        .corridor-bar-mini {
            flex: 1;
            background: #ecf0f1;
            border-radius: 2px 2px 0 0;
            position: relative;
            min-height: 10px;
        }
        
        .corridor-fill-mini {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            border-radius: 2px 2px 0 0;
            background: linear-gradient(to top, #3498db, #2980b9);
        }
        
        /* ТЕПЛОВАЯ КАРТА - КОМПАКТНАЯ ВЕРСИЯ */
        .compact-heatmap {
            height: 80px;
            overflow: auto;
            margin-top: 10px;
        }
        
        .heatmap-grid {
            display: grid;
            grid-template-columns: repeat(${Math.min(data.tasks.length, 9)}, 1fr);
            gap: 1px;
        }
        
        .heatmap-cell-mini {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 6px;
            font-weight: 600;
            border: 1px solid #eee;
            cursor: pointer;
        }
        
        /* ДРУГИЕ КОМПАКТНЫЕ ДИАГРАММЫ */
        .mini-donut {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
        }
        
        .mini-donut-inner {
            width: 40px;
            height: 40px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 700;
            color: #2c3e50;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 5px;
        }
        
        .stat-item {
            text-align: center;
            padding: 5px;
            background: #f8f9fa;
            border-radius: 3px;
        }
        
        .stat-value {
            font-size: 12px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 2px;
        }
        
        .stat-label {
            font-size: 7px;
            color: #7f8c8d;
        }
        
        /* РЕКОМЕНДАЦИИ */
        .recommendations {
            padding: 5px;
        }
        
        .recommendation-item {
            margin-bottom: 4px;
            font-size: 8px;
            display: flex;
            align-items: flex-start;
            gap: 4px;
        }
        
        .rec-bullet {
            color: #3498db;
            font-size: 10px;
            line-height: 1;
            margin-top: 1px;
        }
        
        @media print {
            body {
                width: 100%;
                height: 100%;
                padding: 0;
                margin: 0;
            }
            
            .report-container {
                padding: 5px;
            }
            
            .right-section, .header-compact, .table-container, .compact-chart {
                border: 1px solid #000;
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <!-- СТРАНИЦА 1 -->
    <div class="report-container">
        <!-- ЛЕВАЯ КОЛОНКА -->
        <div class="left-column">
            <!-- Заголовок -->
            <div class="header-compact">
                <div class="work-title-compact">
                    <h1>${data.test.subject}, ${data.test.class} класс</h1>
                    <div class="work-subtitle-compact">
                        <span>${data.test.theme.substring(0, 35)}${data.test.theme.length > 35 ? '...' : ''}</span>
                        <span>•</span>
                        <span>${data.tasks.length} заданий</span>
                    </div>
                </div>
                
                <div class="stats-circle-container">
                    ${generateStatsCircles(data, stats.maxScore)}
                </div>
            </div>
            
            <!-- Таблица результатов -->
            <div class="table-container">
                <table class="results-table">
                    <thead>
                        <tr>
                            <th style="width: 20px">№</th>
                            <th style="width: 60px">Фамилия Имя</th>
                            ${data.tasks.map(task => `<th title="Задание ${task.number}: ${task.description}">${task.number}</th>`).join('')}
                            <th style="width: 25px">∑</th>
                            <th style="width: 25px">Оц.</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateStudentsTable(data, stats)}
                        <!-- Строка с процентами -->
                        <tr class="percentage-row">
                            <td></td>
                            <td class="student-cell">Процент выполнения:</td>
                            ${stats.taskPercentages.map(p => `<td>${Math.round(p.percentage)}%</td>`).join('')}
                            <td>${Math.round(stats.overallPercentage)}%</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- ПРАВАЯ КОЛОНКА -->
        <div class="right-column">
            <!-- Дата -->
            <div class="right-section date-time-box">
                <div class="section-title" style="border-bottom-color: rgba(255,255,255,0.3); color: white;">
                    <span>📅</span> Дата выполнения
                </div>
                <div class="date-value">${formatDate(data.test.testDate)}</div>
            </div>
            
            <!-- Анализ заданий -->
            <div class="right-section">
                <div class="section-title">
                    <span>📊</span> Анализ выполнения заданий
                </div>
                <div style="max-height: 120px; overflow-y: auto; padding-right: 2px;">
                    ${generateTaskAnalysis(stats.taskPercentages)}
                </div>
            </div>
            
            <!-- Распределение оценок -->
            <div class="right-section">
                <div class="section-title">
                    <span>🎯</span> Распределение оценок
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="mini-donut" style="background: ${getDonutGradient(stats)};">
                        <div class="mini-donut-inner">${stats.averageScore.toFixed(1)}</div>
                    </div>
                    <div style="flex: 1;">
                        ${generateGradesLegend(stats.gradeCounts)}
                    </div>
                </div>
            </div>
            
            <!-- Критерии оценивания -->
            <div class="right-section">
                <div class="section-title">
                    <span>📈</span> Критерии оценивания
                </div>
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    ${generateCriteriaLadder(data.test.criteria)}
                </div>
            </div>
            
            <!-- Сложные задания -->
            <div class="right-section">
                <div class="section-title">
                    <span>⚠️</span> Сложные задания
                </div>
                <div style="display: flex; flex-direction: column; gap: 3px;">
                    ${generateDifficultTasks(stats.taskPercentages, stats.overallPercentage)}
                </div>
            </div>
        </div>
    </div>
    
    <!-- СТРАНИЦА 2 -->
    <div class="page-break"></div>
    
    <div class="compact-grid">
        <!-- Коридор решаемости -->
        <div class="compact-chart" style="grid-column: span 2;">
            <div class="compact-title">
                <span>📊</span> Коридор решаемости заданий
            </div>
            <div class="compact-corridor">
                <div class="corridor-mini">
                    ${generateCompactCorridor(stats.taskPercentages)}
                </div>
            </div>
        </div>
        
        <!-- Тепловая карта -->
        <div class="compact-chart" style="grid-column: span 2;">
            <div class="compact-title">
                <span>🎯</span> Тепловая карта выполнения
            </div>
            <div class="compact-heatmap">
                <div class="heatmap-grid">
                    ${generateCompactHeatmap(data, stats)}
                </div>
            </div>
        </div>
        
        <!-- Статистика -->
        <div class="compact-chart">
            <div class="compact-title">
                <span>📈</span> Ключевые показатели
            </div>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${stats.quality}%</div>
                    <div class="stat-label">Качество знаний</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.success}%</div>
                    <div class="stat-label">Успеваемость</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.averageScore.toFixed(1)}</div>
                    <div class="stat-label">Средний балл</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${Math.round(stats.overallPercentage)}%</div>
                    <div class="stat-label">Выполнение</div>
                </div>
            </div>
        </div>
        
        <!-- Уровни сложности -->
        <div class="compact-chart">
            <div class="compact-title">
                <span>🏔️</span> Уровни сложности
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 10px;">
                ${generateComplexityChart(data.tasks)}
            </div>
        </div>
        
        <!-- Анализ ошибок -->
        <div class="compact-chart">
            <div class="compact-title">
                <span>🔍</span> Типичные ошибки
            </div>
            <div style="max-height: 80px; overflow-y: auto; margin-top: 5px;">
                ${generateErrorsTable(data.errors)}
            </div>
        </div>
        
        <!-- Рекомендации -->
        <div class="compact-chart">
            <div class="compact-title">
                <span>💡</span> Выводы и рекомендации
            </div>
            <div class="recommendations">
                ${generateRecommendations(stats, data)}
            </div>
        </div>
    </div>
</body>
</html>`;
}

// Вспомогательные функции
function calculateStatistics(data) {
    const maxScore = data.tasks.reduce((sum, task) => sum + task.maxScore, 0);
    const taskTotals = new Array(data.tasks.length).fill(0);
    let totalScoreAll = 0;
    const gradeCounts = {2: 0, 3: 0, 4: 0, 5: 0};
    
    // Обрабатываем результаты
    data.results.forEach((studentResults) => {
        let studentTotal = 0;
        studentResults.forEach((score, taskIndex) => {
            studentTotal += score;
            taskTotals[taskIndex] += score;
        });
        totalScoreAll += studentTotal;
        
        // Вычисляем оценку
        const grade = calculateGrade(studentTotal, data.test.criteria);
        gradeCounts[grade]++;
    });
    
    // Проценты выполнения заданий
    const taskPercentages = data.tasks.map((task, index) => {
        const percentage = (taskTotals[index] / (data.students.length * task.maxScore)) * 100;
        return {
            number: task.number,
            percentage: percentage,
            description: task.description
        };
    });
    
    // Общий процент выполнения
    const overallPercentage = (totalScoreAll / (data.students.length * maxScore)) * 100;
    
    // Средний балл
    const averageScore = totalScoreAll / data.students.length;
    
    // Качество знаний и успеваемость
    const quality = ((gradeCounts[4] + gradeCounts[5]) / data.students.length * 100).toFixed(1);
    const success = ((gradeCounts[3] + gradeCounts[4] + gradeCounts[5]) / data.students.length * 100).toFixed(1);
    
    return {
        maxScore,
        taskTotals,
        totalScoreAll,
        gradeCounts,
        taskPercentages,
        overallPercentage,
        averageScore,
        quality,
        success
    };
}

function calculateGrade(score, criteria) {
    if (score >= criteria[5].min && score <= criteria[5].max) return 5;
    if (score >= criteria[4].min && score <= criteria[4].max) return 4;
    if (score >= criteria[3].min && score <= criteria[3].max) return 3;
    return 2;
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('ru-RU', options);
    } catch {
        return dateString;
    }
}

function getDonutGradient(stats) {
    const percentages = stats.gradeCounts;
    const total = stats.taskPercentages.length;
    
    const p5 = (percentages[5] || 0) / total * 100;
    const p4 = (percentages[4] || 0) / total * 100;
    const p3 = (percentages[3] || 0) / total * 100;
    const p2 = (percentages[2] || 0) / total * 100;
    
    return `conic-gradient(
        #27ae60 0% ${p5}%,
        #3498db ${p5}% ${p5 + p4}%,
        #f39c12 ${p5 + p4}% ${p5 + p4 + p3}%,
        #e74c3c ${p5 + p4 + p3}% 100%
    )`;
}

function generateStatsCircles(data, maxScore) {
    const stats = [
        { label: 'Писали', value: data.test.presentStudents, color: colors.stats.present },
        { label: 'Всего', value: data.test.totalStudents, color: colors.stats.total },
        { label: 'Отсут.', value: data.test.totalStudents - data.test.presentStudents, color: colors.stats.absent },
        { label: 'Макс. балл', value: maxScore, color: colors.stats.maxScore }
    ];
    
    return stats.map(stat => `
        <div class="stat-circle" style="background: linear-gradient(135deg, ${stat.color}, ${adjustColor(stat.color, -20)});">
            <div class="stat-value-circle">${stat.value}</div>
            <div class="stat-label-circle">${stat.label}</div>
        </div>
    `).join('');
}

function adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => 
        ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

function generateStudentsTable(data, stats) {
    return data.students.map((studentName, studentIndex) => {
        const studentResults = data.results[studentIndex] || new Array(data.tasks.length).fill(0);
        const studentTotal = studentResults.reduce((sum, score) => sum + score, 0);
        const grade = calculateGrade(studentTotal, data.test.criteria);
        const shortName = studentName.length > 10 ? studentName.substring(0, 9) + '..' : studentName;
        
        return `
            <tr>
                <td>${studentIndex + 1}</td>
                <td class="student-cell" title="${studentName}">${shortName}</td>
                ${studentResults.map((score, index) => `<td>${score.toFixed(1)}</td>`).join('')}
                <td class="total-score">${studentTotal.toFixed(1)}</td>
                <td class="grade-cell grade-${grade}">${grade}</td>
            </tr>
        `;
    }).join('');
}

function generateTaskAnalysis(taskPercentages) {
    const sorted = [...taskPercentages].sort((a, b) => a.number - b.number);
    
    return sorted.map(task => `
        <div style="display: flex; align-items: center; margin-bottom: 3px; height: 14px;">
            <div style="width: 18px; font-weight: 600; font-size: 7px; color: #2c3e50;">${task.number}</div>
            <div style="flex: 1; height: 8px; background: #ecf0f1; border-radius: 4px; overflow: hidden; margin: 0 5px;">
                <div style="height: 100%; border-radius: 4px; background: linear-gradient(90deg, #3498db, #2980b9); width: ${task.percentage}%"></div>
            </div>
            <div style="width: 25px; font-size: 7px; font-weight: 600; text-align: right; color: #2c3e50;">${Math.round(task.percentage)}%</div>
        </div>
    `).join('');
}

function generateGradesLegend(gradeCounts) {
    return [5, 4, 3, 2].map(grade => {
        const count = gradeCounts[grade] || 0;
        if (count === 0) return '';
        return `
            <div style="display: flex; align-items: center; margin-bottom: 3px; font-size: 7px;">
                <div style="width: 8px; height: 8px; border-radius: 2px; margin-right: 3px; background: ${colors.grades[grade]}"></div>
                <span>${grade}</span>
                <div style="font-weight: 700; margin-left: auto; font-size: 8px;">${count}</div>
            </div>
        `;
    }).join('');
}

function generateCriteriaLadder(criteria) {
    return [5, 4, 3, 2].map(grade => {
        const criterion = criteria[grade];
        const borderColor = colors.grades[grade];
        
        return `
            <div style="display: flex; align-items: center; padding: 3px 5px; border-radius: 3px; background: #f8f9fa; position: relative; border-left: 3px solid ${borderColor};">
                <div style="font-weight: 700; font-size: 11px; width: 16px; text-align: center;">${grade}</div>
                <div style="font-size: 8px; margin-left: 6px; flex: 1;">${criterion.min} - ${criterion.max} баллов</div>
                <div style="font-size: 7px; color: #7f8c8d; margin-left: 6px;">${grade === 5 ? 'Отлично' : grade === 4 ? 'Хорошо' : grade === 3 ? 'Удовл.' : 'Неуд.'}</div>
            </div>
        `;
    }).join('');
}

function generateDifficultTasks(taskPercentages, overallPercentage) {
    const sorted = [...taskPercentages].sort((a, b) => a.percentage - b.percentage);
    const top3 = sorted.slice(0, 3);
    
    let html = top3.map(task => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 3px 5px; background: #f8f9fa; border-radius: 3px; font-size: 8px;">
            <div style="font-weight: 600; color: #2c3e50;">Задание ${task.number}</div>
            <div style="font-weight: 700; color: #e74c3c;">${Math.round(task.percentage)}%</div>
        </div>
    `).join('');
    
    html += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 3px 5px; background: #e8f4fc; border-radius: 3px; font-size: 8px;">
            <div style="font-size: 7px;">Общий % выполнения:</div>
            <div style="font-weight: 700; color: #3498db; font-size: 9px;">${Math.round(overallPercentage)}%</div>
        </div>
    `;
    
    return html;
}

function generateCompactCorridor(taskPercentages) {
    const sorted = [...taskPercentages].sort((a, b) => a.number - b.number);
    
    return sorted.map(task => `
        <div class="corridor-bar-mini" title="Задание ${task.number}: ${Math.round(task.percentage)}%">
            <div class="corridor-fill-mini" style="height: ${task.percentage}%"></div>
        </div>
    `).join('');
}

function generateCompactHeatmap(data, stats) {
    let html = '';
    
    // Используем проценты выполнения из статистики
    stats.taskPercentages.forEach((task, taskIndex) => {
        const taskData = data.tasks[taskIndex];
        const percentage = task.percentage;
        
        // Определяем цвет
        let color;
        if (percentage >= 90) color = '#27ae60';
        else if (percentage >= 70) color = '#2ecc71';
        else if (percentage >= 50) color = '#3498db';
        else if (percentage >= 30) color = '#f39c12';
        else color = '#e74c3c';
        
        html += `
            <div class="heatmap-cell-mini" style="background: ${color}; color: ${percentage > 50 ? 'white' : '#2c3e50'};" 
                 title="Задание ${taskData.number}: ${taskData.description}
Средний % выполнения: ${percentage.toFixed(1)}%">
                ${taskData.number}
            </div>
        `;
    });
    
    return html;
}

function generateComplexityChart(tasks) {
    const levelCounts = {1: 0, 2: 0, 3: 0, 4: 0};
    tasks.forEach(task => {
        levelCounts[task.level] = (levelCounts[task.level] || 0) + 1;
    });
    
    return [1, 2, 3, 4].map(level => {
        const count = levelCounts[level] || 0;
        if (count === 0) return '';
        
        const levelNames = {
            1: 'Базовый',
            2: 'Применение', 
            3: 'Анализ/Синтез',
            4: 'Творчество'
        };
        
        return `
            <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 10px; height: 10px; border-radius: 2px; background: ${colors.complexity[level]}"></div>
                <div style="font-size: 8px; color: #2c3e50; flex: 1;">${levelNames[level]}</div>
                <div style="font-size: 9px; font-weight: 700; color: #2c3e50;">${count} зад.</div>
            </div>
        `;
    }).join('');
}

function generateErrorsTable(errors) {
    if (!errors || errors.length === 0) {
        return '<div style="text-align: center; color: #7f8c8d; padding: 10px;">Данные об ошибках отсутствуют</div>';
    }
    
    const errorTypeNames = {
        factual: 'Фактические',
        conceptual: 'Концептуальные',
        application: 'Применения',
        calculation: 'Вычислительные',
        logical: 'Логические',
        attention: 'Внимания',
        technical: 'Технические'
    };
    
    const errorCounts = {};
    errors.forEach(error => {
        errorCounts[error.type] = (errorCounts[error.type] || 0) + (error.count || 1);
    });
    
    const totalErrors = Object.values(errorCounts).reduce((a, b) => a + b, 0);
    const sortedErrors = Object.entries(errorCounts).sort(([, a], [, b]) => b - a).slice(0, 3);
    
    return sortedErrors.map(([type, count]) => {
        const percentage = ((count / totalErrors) * 100).toFixed(1);
        return `
            <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #eee;">
                <div style="font-size: 7px;">${errorTypeNames[type] || type}</div>
                <div style="font-size: 7px; font-weight: 600;">${count} (${percentage}%)</div>
            </div>
        `;
    }).join('');
}

function generateRecommendations(stats, data) {
    const sortedTasks = [...stats.taskPercentages].sort((a, b) => a.percentage - b.percentage);
    const hardestTasks = sortedTasks.slice(0, 3).map(t => t.number).join(', ');
    
    // Определяем самые частые ошибки
    const errorCounts = {};
    if (data.errors) {
        data.errors.forEach(error => {
            errorCounts[error.type] = (errorCounts[error.type] || 0) + (error.count || 1);
        });
    }
    
    let mostCommonError = 'не определены';
    if (Object.keys(errorCounts).length > 0) {
        const maxType = Object.entries(errorCounts).reduce((max, [type, count]) => 
            count > max.count ? {type, count} : max, {type: '', count: 0}).type;
        
        const errorTypeNames = {
            factual: 'фактические',
            conceptual: 'концептуальные',
            application: 'применения',
            calculation: 'вычислительные',
            logical: 'логические',
            attention: 'внимания',
            technical: 'технические'
        };
        
        mostCommonError = errorTypeNames[maxType] || maxType;
    }
    
    return `
        <div class="recommendation-item">
            <span class="rec-bullet">•</span>
            <span>Сосредоточиться на заданиях: ${hardestTasks}</span>
        </div>
        <div class="recommendation-item">
            <span class="rec-bullet">•</span>
            <span>Проработать ${mostCommonError} ошибки</span>
        </div>
        <div class="recommendation-item">
            <span class="rec-bullet">•</span>
            <span>Индивидуальная работа с ${stats.gradeCounts[2] || 0} учащимися</span>
        </div>
        <div class="recommendation-item">
            <span class="rec-bullet">•</span>
            <span>Провести работу над внимательностью</span>
        </div>
    `;
}

// Экспортируемые функции для управления отчётом
export function generateReportModule(data) {
    if (!data) {
        console.error('Нет данных для генерации отчёта');
        alert('Ошибка: нет данных для генерации отчёта');
        return;
    }
    
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
        alert('Пожалуйста, разрешите всплывающие окна для генерации отчёта');
        return;
    }
    
    reportWindow.document.write(generateReportHTML(data));
    reportWindow.document.close();
    reportWindow.focus();
}

export function previewReportModule(data) {
    if (!data) {
        console.error('Нет данных для предпросмотра отчёта');
        alert('Ошибка: нет данных для предпросмотра отчёта');
        return;
    }
    
    const reportWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    if (!reportWindow) {
        alert('Пожалуйста, разрешите всплывающие окна для предпросмотра отчёта');
        return;
    }
    
    reportWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Предпросмотр отчёта</title>
            <style>
                body { margin: 20px; background: #f5f5f5; }
                .preview-container { 
                    background: white; 
                    padding: 20px; 
                    border-radius: 10px; 
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .controls { 
                    margin-bottom: 20px; 
                    display: flex; 
                    gap: 10px; 
                    flex-wrap: wrap;
                }
                button { 
                    padding: 10px 20px; 
                    background: #3498db; 
                    color: white; 
                    border: none; 
                    border-radius: 5px; 
                    cursor: pointer;
                }
                button:hover { background: #2980b9; }
                iframe { 
                    width: 100%; 
                    height: 600px; 
                    border: 2px solid #ddd; 
                    border-radius: 5px;
                }
            </style>
        </head>
        <body>
            <div class="preview-container">
                <h2>📊 Предпросмотр аналитического отчёта</h2>
                <div class="controls">
                    <button onclick="printReport()">🖨️ Печать</button>
                    <button onclick="window.close()">✖️ Закрыть</button>
                </div>
                <iframe id="reportFrame" srcdoc="${encodeURIComponent(generateReportHTML(data))}"></iframe>
            </div>
            <script>
                function printReport() {
                    const iframe = document.getElementById('reportFrame');
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                }
            </script>
        </body>
        </html>
    `);
    reportWindow.document.close();
}

export function printReportModule(data) {
    if (!data) {
        console.error('Нет данных для печати отчёта');
        alert('Ошибка: нет данных для печати отчёта');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Пожалуйста, разрешите всплывающие окна для печати отчёта');
        return;
    }
    
    printWindow.document.write(generateReportHTML(data));
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }, 500);
}
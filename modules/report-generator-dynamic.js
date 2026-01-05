// report-generator-dynamic.js
// Глобальный модуль генерации отчётов с оптимизированным вторым листом

(function(global) {
    'use strict';
    
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

    // Типы ошибок
    const errorTypes = {
        factual: { name: "Фактические", color: "#e74c3c", desc: "неверные даты, имена, формулы" },
        conceptual: { name: "Концептуальные", color: "#9b59b6", desc: "непонимание теории, законов" },
        application: { name: "Применения", color: "#3498db", desc: "неверный выбор способа решения" },
        calculation: { name: "Вычислительные", color: "#f39c12", desc: "ошибки в вычислениях" },
        logical: { name: "Логические", color: "#d35400", desc: "нарушение логики в рассуждениях" },
        attention: { name: "Внимательности", color: "#16a085", desc: "неверно прочел условие" },
        technical: { name: "Технические", color: "#7f8c8d", desc: "единицы измерения, оформление" }
    };

    // Основная функция генерации HTML отчёта
    function generateReportHTML(data) {
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
            display: flex;
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
        
        /* ОПТИМИЗИРОВАННЫЙ ВТОРОЙ ЛИСТ */
        .compact-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            grid-template-rows: auto auto;
            gap: 10px;
            padding: 10px;
            height: calc(210mm - 20px);
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
        
        /* КОРИДОР РЕШАЕМОСТИ - СТОЛБЧАТАЯ ДИАГРАММА */
        .corridor-chart-container {
            grid-column: 1;
            grid-row: 1;
        }
        
        .corridor-graph {
            height: 150px;
            position: relative;
            margin-top: 10px;
            display: flex;
            align-items: flex-end;
            gap: 2px;
            padding: 0 5px;
        }
        
        .corridor-bar {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            min-height: 5px;
        }
        
        .bar-fill {
            width: 80%;
            border-radius: 3px 3px 0 0;
            position: relative;
            transition: height 0.3s ease;
            background: #3498db; /* Дефолтный цвет для печати */
        }
        
        .bar-label {
            font-size: 7px;
            margin-top: 3px;
            color: #7f8c8d;
            text-align: center;
            font-weight: 600;
        }
        
        .bar-value {
            position: absolute;
            top: -15px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 7px;
            font-weight: 700;
            color: #2c3e50;
        }
        
        /* Горизонтальные линии для диаграммы коридора */
        .threshold-line {
            position: absolute;
            left: 0;
            right: 0;
            height: 1px;
            border-top: 1px dashed rgba(0,0,0,0.3);
            z-index: 1;
        }
        
        .threshold-label {
            position: absolute;
            right: 5px;
            font-size: 6px;
            color: #95a5a6;
            background: white;
            padding: 1px 3px;
            border-radius: 2px;
            z-index: 2;
        }
        
        /* КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ - КОМПАКТНЫЙ ФОРМАТ */
        .stats-container {
            grid-column: 2;
            grid-row: 1;
        }
        
        .compact-stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(2, 1fr);
            gap: 5px;
            height: 150px;
        }
        
        .compact-stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 5px;
            background: #f8f9fa;
            border-radius: 5px;
            text-align: center;
        }
        
        .compact-stat-value {
            font-size: 16px;
            font-weight: 800;
            color: #2c3e50;
            line-height: 1.2;
        }
        
        .compact-stat-label {
            font-size: 8px;
            color: #7f8c8d;
            margin-top: 2px;
        }
        
        /* УРОВНИ СЛОЖНОСТИ - ГОРИЗОНТАЛЬНАЯ ВЕРСИЯ */
        .complexity-container {
            grid-column: 3;
            grid-row: 1;
        }
        
        .complexity-chart-horizontal {
            display: flex;
            height: 150px;
            margin-top: 10px;
            align-items: flex-end;
            justify-content: space-between;
            gap: 3px;
        }
        
        .complexity-level {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            height: 100%;
        }
        
        .level-bar {
            width: 70%;
            border-radius: 3px 3px 0 0;
            position: relative;
            background: #3498db; /* Дефолтный цвет для печати */
        }
        
        .level-label {
            font-size: 7px;
            margin-top: 3px;
            color: #2c3e50;
            font-weight: 600;
            text-align: center;
        }
        
        .level-count {
            position: absolute;
            top: -15px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 7px;
            font-weight: 700;
            color: white;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
        
        /* ТИПИЧНЫЕ ОШИБКИ - ДВА СТОЛБИКА */
        .errors-container {
            grid-column: 1;
            grid-row: 2;
        }
        
        .two-column-errors {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px;
            margin-top: 10px;
            max-height: 140px;
            overflow-y: auto;
            padding-right: 2px;
        }
        
        .error-column {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .compact-error-item {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 3px 5px;
            background: #f8f9fa;
            border-radius: 3px;
            border-left: 2px solid #ccc;
        }
        
        .error-color-small {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        
        .error-name-small {
            font-size: 7px;
            color: #2c3e50;
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .error-count-small {
            font-size: 8px;
            font-weight: 700;
            color: #2c3e50;
            min-width: 12px;
            text-align: right;
        }
        
        /* ТЕПЛОВАЯ КАРТА */
        .heatmap-container {
            grid-column: 2;
            grid-row: 2;
        }
        
        .compact-heatmap {
            height: 140px;
            overflow: auto;
            margin-top: 10px;
        }
        
        .heatmap-grid {
            display: grid;
            grid-template-columns: 80px repeat(${data.tasks.length}, 1fr);
            grid-template-rows: repeat(${Math.min(data.students.length, 10)}, 1fr);
            gap: 1px;
            font-size: 7px;
        }
        
        .heatmap-header {
            background: #2c3e50;
            color: white;
            font-weight: 600;
            text-align: center;
            padding: 3px 1px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .heatmap-student {
            background: #f8f9fa;
            padding: 3px 2px;
            text-align: left;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            border-right: 1px solid #ddd;
        }
        
        .heatmap-cell {
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            border: 1px solid #eee;
            position: relative;
            background: #f8f9fa; /* Дефолтный фон для печати */
        }
        
        .heatmap-cell:hover::after {
            content: attr(title);
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #2c3e50;
            color: white;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 8px;
            white-space: nowrap;
            z-index: 100;
            pointer-events: none;
        }
        
        /* РЕКОМЕНДАЦИИ */
        .recommendations-container {
            grid-column: 3;
            grid-row: 2;
        }
        
        .recommendations {
            padding: 5px;
            max-height: 140px;
            overflow-y: auto;
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
        
        /* ДРУГИЕ ЭЛЕМЕНТЫ */
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
        
        .task-desc-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 4px;
            font-size: 7.5px;
            line-height: 1.2;
        }
        
        .task-number {
            font-weight: 600;
            color: #2c3e50;
            min-width: 18px;
            margin-right: 4px;
        }
        
        .task-description {
            color: #2c3e50;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }
        
        .task-percentage {
            font-weight: 600;
            color: #2c3e50;
            min-width: 25px;
            text-align: right;
            margin-left: 4px;
        }
        
        /* ИСПРАВЛЕННЫЕ СТИЛИ ДЛЯ ПЕЧАТИ */
        @media print {
            body {
                width: 100%;
                height: 100%;
                padding: 0;
                margin: 0;
                overflow: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            
            .report-container {
                padding: 5px;
                overflow: visible !important;
            }
            
            .right-section, .header-compact, .table-container, .compact-chart {
                border: 1px solid #000 !important;
                box-shadow: none !important;
                overflow: visible !important;
                page-break-inside: avoid;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            .compact-grid {
                height: auto !important;
                min-height: calc(100% - 20px);
                overflow: visible !important;
                page-break-inside: avoid;
            }
            
            /* ВАЖНО: Сохраняем цвета при печати */
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            
            /* Коридор решаемости - сохраняем высоту столбцов */
            .corridor-graph {
                height: 150px !important;
                display: flex !important;
                position: relative !important;
                margin-top: 10px !important;
            }
            
            .corridor-bar {
                display: flex !important;
                flex-direction: column !important;
            }
            
            .bar-fill {
                height: 100px !important; /* Фиксированная высота при печати */
                background: #cccccc !important; /* Серый цвет для черно-белой печати */
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
            
            .bar-value {
                display: block !important;
                visibility: visible !important;
            }
            
            .threshold-line {
                display: block !important;
                visibility: visible !important;
                border-top: 1px dashed #000 !important;
            }
            
            .threshold-label {
                display: block !important;
                visibility: visible !important;
                background: white !important;
                color: #000 !important;
            }
            
            /* Уровни сложности - сохраняем высоту столбцов */
            .complexity-chart-horizontal {
                display: flex !important;
                height: 150px !important;
            }
            
            .level-bar {
                height: 100px !important; /* Фиксированная высота при печати */
                background: #cccccc !important; /* Серый цвет для черно-белой печати */
                display: block !important;
                visibility: visible !important;
            }
            
            .level-count {
                display: block !important;
                visibility: visible !important;
                color: #000 !important;
                text-shadow: none !important;
            }
            
            /* Убираем прокрутку у всех контейнеров при печати */
            .compact-heatmap,
            .two-column-errors,
            .recommendations,
            [style*="overflow"],
            [style*="max-height"] {
                height: auto !important;
                max-height: none !important;
                overflow: visible !important;
                position: relative !important;
            }
            
            /* Тепловая карта - полное отображение */
            .heatmap-grid {
                display: grid !important;
                grid-template-columns: 80px repeat(${data.tasks.length}, 1fr) !important;
                grid-template-rows: repeat(${data.students.length}, 1fr) !important;
                max-height: none !important;
                height: auto !important;
                overflow: visible !important;
                page-break-inside: avoid;
            }
            
            .compact-heatmap {
                height: auto !important;
                max-height: none !important;
                overflow: visible !important;
                page-break-inside: avoid;
            }
            
            .heatmap-cell {
                background: #f8f9fa !important;
                color: #000 !important;
                border: 1px solid #ddd !important;
                display: flex !important;
            }
            
            /* Типичные ошибки - полное отображение */
            .two-column-errors {
                display: grid !important;
                max-height: none !important;
                height: auto !important;
                overflow: visible !important;
                page-break-inside: avoid;
            }
            
            /* Рекомендации - полное отображение */
            .recommendations {
                max-height: none !important;
                height: auto !important;
                overflow: visible !important;
            }
            
            /* Ключевые показатели - сохраняем фон */
            .compact-stat-item {
                background: #f8f9fa !important;
                border: 1px solid #ddd !important;
            }
            
            /* Убираем ховер-эффекты при печати */
            .heatmap-cell:hover::after {
                display: none !important;
            }
            
            /* Увеличиваем шрифт для читаемости при печати */
            .heatmap-cell, .heatmap-student, .compact-error-item, .recommendation-item {
                font-size: 9px !important;
            }
            
            /* Убираем page-break перед вторым листом если осталось место */
            .page-break {
                page-break-before: auto;
            }
            
            /* Принудительный перенос страницы если контент не помещается */
            .compact-chart {
                break-inside: avoid;
                page-break-inside: avoid;
            }
            
            /* Сохраняем градиенты и цвета */
            .stat-circle {
                background: #3498db !important;
            }
            
            .grade-5 { background-color: rgba(39, 174, 96, 0.08) !important; }
            .grade-4 { background-color: rgba(52, 152, 219, 0.08) !important; }
            .grade-3 { background-color: rgba(243, 156, 18, 0.08) !important; }
            .grade-2 { background-color: rgba(231, 76, 60, 0.08) !important; }
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
                    ${generateTaskAnalysis(stats.taskPercentages, data.tasks)}
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
        <!-- Коридор решаемости - СТОЛБЧАТАЯ ДИАГРАММА -->
        <div class="compact-chart corridor-chart-container">
            <div class="compact-title">
                <span>📊</span> Решаемость заданий
            </div>
            <div class="corridor-graph">
                ${generateCorridorBarChart(stats.taskPercentages)}
            </div>
        </div>
        
        <!-- Ключевые показатели - КОМПАКТНАЯ ВЕРСИЯ -->
        <div class="compact-chart stats-container">
            <div class="compact-title">
                <span>📈</span> Ключевые показатели
            </div>
            <div class="compact-stats-grid">
                <div class="compact-stat-item" style="background: linear-gradient(135deg, #e8f4fc, #d4e6f1);">
                    <div class="compact-stat-value">${stats.quality}%</div>
                    <div class="compact-stat-label">Качество знаний</div>
                </div>
                <div class="compact-stat-item" style="background: linear-gradient(135deg, #e8f6f3, #d1f2eb);">
                    <div class="compact-stat-value">${stats.success}%</div>
                    <div class="compact-stat-label">Успеваемость</div>
                </div>
                <div class="compact-stat-item" style="background: linear-gradient(135deg, #fef9e7, #fcf3cf);">
                    <div class="compact-stat-value">${stats.averageScore.toFixed(1)}</div>
                    <div class="compact-stat-label">Средний балл</div>
                </div>
                <div class="compact-stat-item" style="background: linear-gradient(135deg, #e8daef, #d7bde2);">
                    <div class="compact-stat-value">${Math.round(stats.overallPercentage)}%</div>
                    <div class="compact-stat-label">Выполнение</div>
                </div>
            </div>
        </div>
        
        <!-- Уровни сложности - ГОРИЗОНТАЛЬНАЯ ВЕРСИЯ -->
        <div class="compact-chart complexity-container">
            <div class="compact-title">
                <span>🏔️</span> Уровни сложности
            </div>
            <div class="complexity-chart-horizontal">
                ${generateComplexityHorizontal(data.tasks)}
            </div>
        </div>
        
        <!-- Типичные ошибки - ДВА СТОЛБИКА -->
        <div class="compact-chart errors-container">
            <div class="compact-title">
                <span>🔍</span> Типичные ошибки
            </div>
            <div class="two-column-errors">
                ${generateTwoColumnErrors(data.errors)}
            </div>
        </div>
        
        <!-- Тепловая карта -->
        <div class="compact-chart heatmap-container">
            <div class="compact-title">
                <span>🎯</span> Тепловая карта
            </div>
            <div class="compact-heatmap">
                ${generateHeatmapGrid(data, stats)}
            </div>
        </div>
        
        <!-- Рекомендации -->
        <div class="compact-chart recommendations-container">
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
        const total = Object.values(percentages).reduce((a, b) => a + b, 0);
        
        if (total === 0) {
            return 'linear-gradient(135deg, #ecf0f1, #bdc3c7)';
        }
        
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
        if (!color || !color.startsWith('#')) return color;
        
        try {
            return '#' + color.replace(/^#/, '').replace(/../g, color => {
                const newColor = Math.min(255, Math.max(0, parseInt(color, 16) + amount));
                return ('0' + newColor.toString(16)).slice(-2);
            });
        } catch {
            return color;
        }
    }

    function generateStudentsTable(data, stats) {
        if (!data.students || data.students.length === 0) {
            return '<tr><td colspan="' + (data.tasks.length + 4) + '" style="text-align: center; padding: 20px;">Нет данных об учениках</td></tr>';
        }
        
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

    function generateTaskAnalysis(taskPercentages, tasks) {
        if (!taskPercentages || taskPercentages.length === 0) {
            return '<div style="text-align: center; color: #7f8c8d; padding: 10px;">Нет данных</div>';
        }
        
        // Сортируем по номеру задания
        const taskData = taskPercentages.map((task, index) => ({
            ...task,
            description: tasks[index]?.description || 'Описание отсутствует'
        })).sort((a, b) => a.number - b.number);
        
        return taskData.map(task => {
            const shortDesc = task.description.length > 40 ? 
                task.description.substring(0, 37) + '...' : 
                task.description;
            
            return `
                <div class="task-desc-item">
                    <div class="task-number">${task.number}.</div>
                    <div class="task-description" title="${task.description}">${shortDesc}</div>
                    <div class="task-percentage">${Math.round(task.percentage)}%</div>
                </div>
            `;
        }).join('');
    }

    function generateGradesLegend(gradeCounts) {
        const grades = [5, 4, 3, 2];
        let hasGrades = false;
        let html = '';
        
        grades.forEach(grade => {
            const count = gradeCounts[grade] || 0;
            if (count > 0) {
                hasGrades = true;
                html += `
                    <div style="display: flex; align-items: center; margin-bottom: 3px; font-size: 7px;">
                        <div style="width: 8px; height: 8px; border-radius: 2px; margin-right: 3px; background: ${colors.grades[grade]}"></div>
                        <span>${grade}</span>
                        <div style="font-weight: 700; margin-left: auto; font-size: 8px;">${count}</div>
                    </div>
                `;
            }
        });
        
        if (!hasGrades) {
            return '<div style="text-align: center; color: #7f8c8d; font-size: 8px;">Нет оценок</div>';
        }
        
        return html;
    }

    function generateCriteriaLadder(criteria) {
        if (!criteria) {
            return '<div style="text-align: center; color: #7f8c8d; padding: 5px;">Критерии не указаны</div>';
        }
        
        return [5, 4, 3, 2].map(grade => {
            const criterion = criteria[grade];
            if (!criterion) return '';
            
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
        if (!taskPercentages || taskPercentages.length === 0) {
            return '<div style="text-align: center; color: #7f8c8d; padding: 5px;">Нет данных</div>';
        }
        
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

    function generateCorridorBarChart(taskPercentages) {
        if (!taskPercentages || taskPercentages.length === 0) {
            return '<div style="text-align: center; color: #7f8c8d; padding: 20px;">Нет данных</div>';
        }
        
        const sorted = [...taskPercentages].sort((a, b) => a.number - b.number);
        const maxPercentage = Math.max(...sorted.map(t => t.percentage), 100);
        
        let html = `
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;">
                <!-- Пороговые линии -->
                <div class="threshold-line" style="top: 10%;">
                    <div class="threshold-label">90%</div>
                </div>
                <div class="threshold-line" style="top: 40%;">
                    <div class="threshold-label">60%</div>
                </div>
                <div class="threshold-line" style="top: 70%;">
                    <div class="threshold-label">30%</div>
                </div>
            </div>
        `;
        
        // Создаем столбцы
        sorted.forEach((task, index) => {
            const heightPercent = (task.percentage / maxPercentage) * 100;
            
            // Определяем цвет столбца
            let color;
            if (task.percentage >= 90) color = '#27ae60';
            else if (task.percentage >= 70) color = '#2ecc71';
            else if (task.percentage >= 50) color = '#3498db';
            else if (task.percentage >= 30) color = '#f39c12';
            else if (task.percentage >= 10) color = '#e74c3c';
            else color = '#c0392b';
            
            // Добавляем инлайн стили для печати
            const inlineStyle = `height: ${heightPercent}%; background: ${color};`;
            
            html += `
                <div class="corridor-bar">
                    <div class="bar-fill" style="${inlineStyle}" data-height="${heightPercent}" data-color="${color}">
                        <div class="bar-value">${Math.round(task.percentage)}%</div>
                    </div>
                    <div class="bar-label">${task.number}</div>
                </div>
            `;
        });
        
        return html;
    }

    function generateHeatmapGrid(data, stats) {
        if (!data.students || data.students.length === 0 || !data.tasks || data.tasks.length === 0) {
            return '<div style="text-align: center; color: #7f8c8d; padding: 20px;">Нет данных</div>';
        }
        
        // Ограничиваем количество отображаемых учеников для компактности
        const maxStudents = 10;
        const displayStudents = data.students.slice(0, maxStudents);
        
        let html = '<div class="heatmap-grid">';
        
        // Заголовки заданий
        html += '<div class="heatmap-header">Ученик / Задание</div>';
        data.tasks.forEach(task => {
            html += `<div class="heatmap-header" title="Задание ${task.number}: ${task.description}">${task.number}</div>`;
        });
        
        // Данные учеников
        displayStudents.forEach((student, studentIndex) => {
            const studentResults = data.results[studentIndex] || new Array(data.tasks.length).fill(0);
            
            // Имя ученика
            const shortName = student.length > 8 ? student.substring(0, 7) + '..' : student;
            html += `<div class="heatmap-student" title="${student}">${shortName}</div>`;
            
            // Результаты по заданиям
            studentResults.forEach((score, taskIndex) => {
                const task = data.tasks[taskIndex];
                const maxScore = task.maxScore;
                const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
                
                // Определяем цвет ячейки
                let bgColor, textColor = '#2c3e50';
                if (percentage >= 90) {
                    bgColor = '#27ae60';
                    textColor = 'white';
                } else if (percentage >= 70) {
                    bgColor = '#2ecc71';
                    textColor = 'white';
                } else if (percentage >= 50) {
                    bgColor = '#3498db';
                    textColor = 'white';
                } else if (percentage >= 30) {
                    bgColor = '#f39c12';
                } else if (percentage >= 10) {
                    bgColor = '#e74c3c';
                    textColor = 'white';
                } else {
                    bgColor = '#c0392b';
                    textColor = 'white';
                }
                
                // Добавляем инлайн стили для печати
                const inlineStyle = `background: ${bgColor}; color: ${textColor};`;
                
                html += `
                    <div class="heatmap-cell" 
                         style="${inlineStyle}"
                         title="${student}, Задание ${task.number}: ${score}/${maxScore} баллов (${percentage.toFixed(0)}%)"
                         data-bg="${bgColor}" data-color="${textColor}">
                        ${score.toFixed(0)}
                    </div>
                `;
            });
        });
        
        // Если учеников больше, чем отображается, показываем сообщение
        if (data.students.length > maxStudents) {
            const remaining = data.students.length - maxStudents;
            html += `<div class="heatmap-student" style="font-style: italic; color: #7f8c8d;">...и еще ${remaining} уч.</div>`;
            for (let i = 0; i < data.tasks.length; i++) {
                html += '<div class="heatmap-cell" style="background: #f8f9fa; color: #7f8c8d;">...</div>';
            }
        }
        
        html += '</div>';
        return html;
    }

    function generateComplexityHorizontal(tasks) {
        if (!tasks || tasks.length === 0) {
            return '<div style="text-align: center; color: #7f8c8d; padding: 10px;">Нет данных</div>';
        }
        
        const levelCounts = {1: 0, 2: 0, 3: 0, 4: 0};
        tasks.forEach(task => {
            if (task.level) {
                levelCounts[task.level] = (levelCounts[task.level] || 0) + 1;
            }
        });
        
        const levelNames = {
            1: 'Баз',
            2: 'Прим', 
            3: 'Анализ',
            4: 'Творч'
        };
        
        const maxCount = Math.max(...Object.values(levelCounts), 1);
        
        return [1, 2, 3, 4].map(level => {
            const count = levelCounts[level] || 0;
            const heightPercent = (count / maxCount) * 100;
            const percentage = (count / tasks.length * 100).toFixed(0);
            
            // Добавляем инлайн стили для печати
            const inlineStyle = `height: ${heightPercent}%; background: ${colors.complexity[level]};`;
            
            return `
                <div class="complexity-level">
                    <div class="level-bar" style="${inlineStyle}" data-height="${heightPercent}" data-color="${colors.complexity[level]}">
                        <div class="level-count">${count}</div>
                    </div>
                    <div class="level-label">
                        ${levelNames[level] || level}<br>
                        <span style="color: #7f8c8d; font-size: 6px;">${percentage}%</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    function generateTwoColumnErrors(errors) {
        if (!errors || errors.length === 0) {
            return '<div style="grid-column: 1 / span 2; text-align: center; color: #7f8c8d; padding: 20px;">Данные об ошибках отсутствуют</div>';
        }
        
        // Группируем ошибки по типам
        const errorCounts = {};
        errors.forEach(error => {
            if (error && error.type) {
                errorCounts[error.type] = (errorCounts[error.type] || 0) + (error.count || 1);
            }
        });
        
        const totalErrors = Object.values(errorCounts).reduce((a, b) => a + b, 0);
        if (totalErrors === 0) {
            return '<div style="grid-column: 1 / span 2; text-align: center; color: #7f8c8d; padding: 20px;">Нет данных об ошибках</div>';
        }
        
        // Сортируем по количеству ошибок
        const sortedErrors = Object.entries(errorCounts)
            .map(([type, count]) => ({
                type,
                count,
                percentage: (count / totalErrors * 100).toFixed(1)
            }))
            .sort((a, b) => b.count - a.count);
        
        let html = '<div class="error-column">';
        
        sortedErrors.forEach((error, index) => {
            const errorType = errorTypes[error.type];
            if (!errorType) return;
            
            // Разбиваем на две колонки
            if (index === Math.ceil(sortedErrors.length / 2)) {
                html += '</div><div class="error-column">';
            }
            
            html += `
                <div class="compact-error-item" style="border-left-color: ${errorType.color}">
                    <div class="error-color-small" style="background: ${errorType.color}"></div>
                    <div class="error-name-small" title="${errorType.desc}">${errorType.name}</div>
                    <div class="error-count-small">${error.count}</div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Добавляем общее количество ошибок
        html += `
            <div style="grid-column: 1 / span 2; text-align: center; margin-top: 5px; padding: 4px; background: #f8f9fa; border-radius: 3px; font-size: 8px;">
                <span style="font-weight: 600;">Всего ошибок:</span> ${totalErrors}
            </div>
        `;
        
        return html;
    }

    function generateRecommendations(stats, data) {
        let recommendations = '';
        
        // Рекомендация по сложным заданиям
        if (stats.taskPercentages && stats.taskPercentages.length > 0) {
            const sortedTasks = [...stats.taskPercentages].sort((a, b) => a.percentage - b.percentage);
            const hardestTasks = sortedTasks.slice(0, 3).map(t => t.number).join(', ');
            if (hardestTasks) {
                recommendations += `
                    <div class="recommendation-item">
                        <span class="rec-bullet">•</span>
                        <span>Сосредоточиться на заданиях: ${hardestTasks}</span>
                    </div>
                `;
            }
        }
        
        // Рекомендация по ошибкам
        if (data.errors && data.errors.length > 0) {
            const errorCounts = {};
            data.errors.forEach(error => {
                if (error && error.type) {
                    errorCounts[error.type] = (errorCounts[error.type] || 0) + (error.count || 1);
                }
            });
            
            if (Object.keys(errorCounts).length > 0) {
                const maxType = Object.entries(errorCounts).reduce((max, [type, count]) => 
                    count > max.count ? {type, count} : max, {type: '', count: 0}).type;
                
                if (maxType && errorTypes[maxType]) {
                    recommendations += `
                        <div class="recommendation-item">
                            <span class="rec-bullet">•</span>
                            <span>Проработать ${errorTypes[maxType].name.toLowerCase()}</span>
                        </div>
                    `;
                }
            }
        }
        
        // Рекомендация по ученикам с неуд
        if (stats.gradeCounts && stats.gradeCounts[2] > 0) {
            recommendations += `
                <div class="recommendation-item">
                    <span class="rec-bullet">•</span>
                    <span>Индивидуальная работа с ${stats.gradeCounts[2]} учащимися</span>
                </div>
            `;
        }
        
        // Рекомендации по качеству
        if (parseFloat(stats.quality) < 60) {
            recommendations += `
                <div class="recommendation-item">
                    <span class="rec-bullet">•</span>
                    <span>Повысить качество знаний (сейчас ${stats.quality}%)</span>
                </div>
            `;
        }
        
        // Общие рекомендации
        recommendations += `
            <div class="recommendation-item">
                <span class="rec-bullet">•</span>
                <span>Провести работу над внимательностью</span>
            </div>
            <div class="recommendation-item">
                <span class="rec-bullet">•</span>
                <span>Разобрать типичные ошибки на уроке</span>
            </div>
        `;
        
        return recommendations;
    }

    // Экспортируемые функции для управления отчётом
    function generateReportModule(data) {
        if (!data) {
            console.error('ReportGenerator: Нет данных для генерации отчёта');
            alert('Ошибка: нет данных для генерации отчёта');
            return;
        }
        
        try {
            const reportWindow = window.open('', '_blank');
            if (!reportWindow) {
                alert('Пожалуйста, разрешите всплывающие окна для генерации отчёта');
                return;
            }
            
            reportWindow.document.write(generateReportHTML(data));
            reportWindow.document.close();
            reportWindow.focus();
            
            return reportWindow;
        } catch (error) {
            console.error('ReportGenerator: Ошибка при открытии отчёта:', error);
            alert('Ошибка при создании отчёта: ' + error.message);
        }
    }

    function previewReportModule(data) {
        if (!data) {
            console.error('ReportGenerator: Нет данных для предпросмотра отчёта');
            alert('Ошибка: нет данных для предпросмотра отчёта');
            return;
        }
        
        try {
            const reportWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
            if (!reportWindow) {
                alert('Пожалуйста, разрешите всплывающие окна для предпросмотра отчёта');
                return;
            }
            
            const htmlContent = generateReportHTML(data);
            const encodedHTML = encodeURIComponent(htmlContent);
            
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
                        <iframe id="reportFrame" srcdoc="${encodedHTML}"></iframe>
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
            
            return reportWindow;
        } catch (error) {
            console.error('ReportGenerator: Ошибка при предпросмотре отчёта:', error);
            alert('Ошибка при предпросмотре отчёта: ' + error.message);
        }
    }

    function printReportModule(data) {
        if (!data) {
            console.error('ReportGenerator: Нет данных для печати отчёта');
            alert('Ошибка: нет данных для печати отчёта');
            return;
        }
        
        try {
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                alert('Пожалуйста, разрешите всплывающие окна для печати отчёта');
                return;
            }
            
            printWindow.document.write(generateReportHTML(data));
            printWindow.document.close();
            
            // Даем время на загрузку стилей перед печатью
            setTimeout(() => {
                printWindow.focus();
                
                // Перед печатью исправляем возможные проблемы с отображением
                printWindow.document.querySelectorAll('.bar-fill, .level-bar').forEach(el => {
                    if (el.style.height) {
                        // Сохраняем высоту для печати
                        el.style.height = el.style.height;
                        el.style.display = 'block';
                        el.style.visibility = 'visible';
                        el.style.opacity = '1';
                    }
                });
                
                printWindow.print();
                // Не закрываем окно сразу, даем пользователю возможность отменить печать
                setTimeout(() => {
                    if (!printWindow.closed) {
                        printWindow.close();
                    }
                }, 1000);
            }, 500);
        } catch (error) {
            console.error('ReportGenerator: Ошибка при печати отчёта:', error);
            alert('Ошибка при печати отчёта: ' + error.message);
        }
    }

    // Создаём глобальный объект с публичным API
    const ReportGenerator = {
        // Основные функции
        generateReport: generateReportModule,
        previewReport: previewReportModule,
        printReport: printReportModule,
        
        // Утилиты
        generateHTML: generateReportHTML,
        calculateStatistics: calculateStatistics,
        calculateGrade: calculateGrade,
        
        // Константы
        colors: colors,
        errorTypes: errorTypes,
        
        // Вспомогательные функции
        formatDate: formatDate,
        
        // Версия
        version: '1.2.1'
    };

    // Экспортируем в глобальную область видимости
    if (typeof global.ReportGenerator === 'undefined') {
        global.ReportGenerator = ReportGenerator;
        
        // Также делаем функции доступными по старым именам для обратной совместимости
        global.generateReportModule = generateReportModule;
        global.previewReportModule = previewReportModule;
        global.printReportModule = printReportModule;
    }

})(window || global || this);

// Добавляем обработчик для автоматической инициализации при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('ReportGenerator v1.2.1 загружен и готов к использованию');
        console.log('Доступен как: window.ReportGenerator');
    });
} else {
    console.log('ReportGenerator v1.2.1 загружен и готов к использованию');
    console.log('Доступен как: window.ReportGenerator');
}
// report-generator-premium-print-fixed.js
// Премиум модуль генерации отчётов с расширенной аналитикой - ИСПРАВЛЕНА ПЕЧАТЬ

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
            primary: '#3498db',
            secondary: '#2c3e50',
            success: '#27ae60',
            warning: '#f39c12',
            danger: '#e74c3c',
            info: '#9b59b6',
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
        },
        spectrum: [
            '#27ae60', '#2ecc71', '#3498db', '#9b59b6', 
            '#f39c12', '#e74c3c', '#e74c3c', '#c0392b'
        ]
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
        
        // Вычисляем расширенную статистику
        const stats = calculateExtendedStatistics(data);
        
        // Генерируем полный HTML отчёт
        return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Расширенный аналитический отчёт - ${data.test.subject}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 10mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 0;
            width: 297mm;
            height: 210mm;
            margin: 0 auto;
            font-size: 9px;
        }
        
        .page-break {
            page-break-before: always;
            page-break-inside: avoid;
        }
        
        /* СТРАНИЦА 1 - ОСНОВНЫЕ РЕЗУЛЬТАТЫ */
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
            background: linear-gradient(135deg, #2c3e50, #34495e);
            border-radius: 8px;
            color: white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .work-title-compact h1 {
            font-size: 16px;
            color: white;
            font-weight: 700;
            line-height: 1.2;
            margin-bottom: 3px;
        }
        
        .work-subtitle-compact {
            font-size: 10px;
            color: rgba(255,255,255,0.8);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .stats-circle-container {
            display: flex;
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
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1));
            border: 1px solid rgba(255,255,255,0.3);
        }
        
        .stat-value-circle {
            font-size: 11px;
            font-weight: 700;
            color: white;
        }
        
        .stat-label-circle {
            font-size: 7px;
            color: rgba(255,255,255,0.9);
            text-align: center;
            margin-top: 1px;
        }
        
        .table-container {
            flex: 1;
            overflow: hidden;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
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
            border: 1px solid #2980b9;
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
            border-radius: 3px;
        }
        
        .grade-5 { color: #27ae60; background-color: rgba(39, 174, 96, 0.1); }
        .grade-4 { color: #3498db; background-color: rgba(52, 152, 219, 0.1); }
        .grade-3 { color: #f39c12; background-color: rgba(243, 156, 18, 0.1); }
        .grade-2 { color: #e74c3c; background-color: rgba(231, 76, 60, 0.1); }
        
        .percentage-row td {
            background-color: #e8f4fc !important;
            font-weight: 600;
            font-size: 7.5px;
            padding: 1px !important;
            color: #2c3e50;
        }
        
        .right-section {
            background: white;
            border-radius: 8px;
            padding: 10px;
            border: 1px solid #e0e0e0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .section-title {
            font-size: 10px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 8px;
            padding-bottom: 6px;
            border-bottom: 2px solid #3498db;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .date-time-box {
            background: linear-gradient(135deg, #2c3e50, #34495e);
            color: white;
            padding: 8px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .date-value {
            font-size: 12px;
            font-weight: 700;
            margin-top: 3px;
            color: white;
        }
        
        /* СТИЛИ ДЛЯ АНАЛИЗА ЗАДАНИЙ */
        .task-desc-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 3px 4px;
            border-radius: 4px;
            background: #f8f9fa;
            margin-bottom: 3px;
            transition: background-color 0.2s;
            border-left: 3px solid transparent;
            page-break-inside: avoid;
        }
        
        .task-desc-item:hover {
            background: #e8f4fc;
        }
        
        .task-number {
            font-size: 9px;
            font-weight: 700;
            color: #3498db;
            min-width: 16px;
            text-align: center;
        }
        
        .task-description {
            font-size: 7.5px;
            color: #2c3e50;
            flex: 1;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .task-percentage {
            font-size: 8px;
            font-weight: 700;
            min-width: 30px;
            text-align: center;
            padding: 1px 4px;
            border-radius: 3px;
            background: white;
            border: 1px solid #e0e0e0;
        }
        
        /* МИНИ-ДОНУТ ДЛЯ ОЦЕНОК */
        .mini-donut {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            position: relative;
            overflow: hidden;
        }
        
        .mini-donut::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 50%;
            background: conic-gradient(
                #27ae60 0% var(--grade-5, 0%),
                #3498db var(--grade-5, 0%) var(--grade-4, 0%),
                #f39c12 var(--grade-4, 0%) var(--grade-3, 0%),
                #e74c3c var(--grade-3, 0%) 100%
            );
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
            position: relative;
            z-index: 2;
        }
        
        /* СТРАНИЦА 2 - РАСШИРЕННАЯ АНАЛИТИКА */
        .analytics-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            grid-template-rows: auto auto auto;
            gap: 12px;
            padding: 12px;
            height: calc(210mm - 24px);
        }
        
        .analytics-card {
            background: white;
            border-radius: 10px;
            padding: 12px;
            border: 1px solid #e0e0e0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.07);
            position: relative;
            overflow: hidden;
            page-break-inside: avoid;
        }
        
        .analytics-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #3498db, #2c3e50);
        }
        
        .analytics-title {
            font-size: 12px;
            font-weight: 800;
            color: #2c3e50;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e8f4fc;
            display: flex;
            align-items: center;
            gap: 8px;
            letter-spacing: 0.3px;
        }
        
        /* 1. КОРИДОР РЕШАЕМОСТИ - ИСПРАВЛЕННЫЙ ДЛЯ ПЕЧАТИ */
        .corridor-card {
            grid-column: 1;
            grid-row: 1;
        }
        
        .corridor-chart {
            height: 140px;
            position: relative;
            margin-top: 5px;
        }
        
        .corridor-axes {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
        }
        
        .y-axis {
            width: 25px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding-right: 5px;
            font-size: 7px;
            color: #7f8c8d;
            font-weight: 600;
        }
        
        .chart-area {
            flex: 1;
            position: relative;
            border-left: 1px solid #e0e0e0;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .threshold-zone {
            position: absolute;
            left: 0;
            right: 0;
        }
        
        .zone-high { 
            height: 20%; 
            top: 0; 
            background: linear-gradient(to bottom, rgba(39, 174, 96, 0.1), rgba(39, 174, 96, 0.05));
            border-bottom: 1px dashed rgba(39, 174, 96, 0.3);
        }
        
        .zone-medium { 
            height: 40%; 
            top: 20%; 
            background: linear-gradient(to bottom, rgba(52, 152, 219, 0.1), rgba(52, 152, 219, 0.05));
            border-bottom: 1px dashed rgba(52, 152, 219, 0.3);
        }
        
        .zone-low { 
            height: 40%; 
            top: 60%; 
            background: linear-gradient(to bottom, rgba(243, 156, 18, 0.1), rgba(231, 76, 60, 0.05));
        }
        
        .zone-label {
            position: absolute;
            right: 5px;
            font-size: 6px;
            font-weight: 700;
            padding: 2px 5px;
            border-radius: 3px;
            color: white;
        }
        
        .zone-high .zone-label { 
            top: 5px; 
            background: #27ae60; 
        }
        .zone-medium .zone-label { 
            top: 5px; 
            background: #3498db; 
        }
        .zone-low .zone-label { 
            top: 5px; 
            background: #e74c3c; 
        }
        
        .bar-container {
            position: absolute;
            bottom: 0;
            width: 30px;
            display: flex;
            flex-direction: column;
            align-items: center;
            transform: translateX(-50%);
        }
        
        .performance-bar {
            width: 20px;
            border-radius: 4px 4px 0 0;
            position: relative;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            min-height: 5px;
        }
        
        .bar-label {
            font-size: 7px;
            margin-top: 3px;
            color: #2c3e50;
            font-weight: 700;
            text-align: center;
        }
        
        .bar-value {
            position: absolute;
            top: -18px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 7px;
            font-weight: 800;
            color: #2c3e50;
            white-space: nowrap;
        }
        
        /* 2. КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ - КОМПАКТНЫЕ КАРТОЧКИ */
        .metrics-card {
            grid-column: 2;
            grid-row: 1;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(4, 1fr);
            gap: 6px;
            height: 140px;
        }
        
        .metric-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 6px;
            border-radius: 6px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .metric-value {
            font-size: 14px;
            font-weight: 800;
            color: white;
            line-height: 1.2;
            margin-bottom: 2px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        
        .metric-label {
            font-size: 7px;
            color: rgba(255,255,255,0.95);
            font-weight: 600;
            line-height: 1.1;
        }
        
        /* 3. НОРМАЛЬНОЕ РАСПРЕДЕЛЕНИЕ БАЛЛОВ - ИСПРАВЛЕННОЕ ДЛЯ ПЕЧАТИ */
        .distribution-card {
            grid-column: 3;
            grid-row: 1;
        }
        
        .distribution-chart {
            height: 140px;
            position: relative;
            margin-top: 5px;
        }
        
        .distribution-area {
            position: absolute;
            top: 0;
            left: 25px;
            right: 0;
            bottom: 20px;
            border-left: 1px solid #e0e0e0;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            align-items: flex-end;
            justify-content: space-around;
        }
        
        .distribution-y-axis {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 20px;
            width: 25px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: flex-end;
            padding-right: 5px;
            font-size: 7px;
            color: #7f8c8d;
            font-weight: 600;
        }
        
        .distribution-x-axis {
            position: absolute;
            left: 25px;
            right: 0;
            bottom: 0;
            height: 20px;
            display: flex;
            justify-content: space-around;
            align-items: center;
            font-size: 7px;
            color: #7f8c8d;
        }
        
        .distribution-bar {
            flex: 1;
            margin: 0 2px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            height: 100%;
        }
        
        .score-bar {
            width: 80%;
            border-radius: 3px 3px 0 0;
            position: relative;
            box-shadow: 0 2px 3px rgba(0,0,0,0.1);
        }
        
        .score-label {
            font-size: 7px;
            margin-top: 3px;
            color: #2c3e50;
            font-weight: 700;
            text-align: center;
        }
        
        .score-count {
            position: absolute;
            top: -16px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 7px;
            font-weight: 800;
            color: #2c3e50;
        }
        
        .mean-line {
            position: absolute;
            left: 25px;
            right: 0;
            height: 2px;
            background: #e74c3c;
            z-index: 10;
            bottom: 20px;
            transform: translateY(50%);
        }
        
        .mean-label {
            position: absolute;
            right: 5px;
            font-size: 6px;
            color: #e74c3c;
            font-weight: 700;
            background: white;
            padding: 1px 4px;
            border-radius: 2px;
            border: 1px solid #e74c3c;
            bottom: 20px;
            transform: translateY(50%);
        }
        
        /* 4. УРОВНИ СЛОЖНОСТИ - РАДИАЛЬНАЯ ДИАГРАММА */
        .complexity-card {
            grid-column: 1;
            grid-row: 2;
        }
        
        .radial-chart {
            height: 140px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            margin-top: 5px;
        }
        
        .radial-svg {
            width: 120px;
            height: 120px;
        }
        
        .radial-center {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }
        
        .radial-total {
            font-size: 14px;
            font-weight: 800;
            color: #2c3e50;
        }
        
        .radial-label {
            font-size: 7px;
            color: #7f8c8d;
            font-weight: 600;
        }
        
        .complexity-legend {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 4px;
            margin-top: 5px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 7px;
            padding: 3px;
            border-radius: 3px;
            background: #f8f9fa;
        }
        
        .legend-color {
            width: 10px;
            height: 10px;
            border-radius: 50%;
        }
        
        /* 5. ТИПИЧНЫЕ ОШИБКИ - ВИЗУАЛИЗАЦИЯ */
        .errors-card {
            grid-column: 2;
            grid-row: 2;
        }
        
        .errors-visual {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            height: 140px;
            margin-top: 5px;
        }
        
        .error-category {
            display: flex;
            flex-direction: column;
            padding: 6px;
            border-radius: 6px;
            background: #f8f9fa;
            position: relative;
            overflow: hidden;
        }
        
        .error-header {
            display: flex;
            align-items: center;
            gap: 5px;
            margin-bottom: 5px;
        }
        
        .error-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
        }
        
        .error-name {
            font-size: 8px;
            font-weight: 700;
            color: #2c3e50;
            flex: 1;
        }
        
        .error-count {
            font-size: 10px;
            font-weight: 800;
            color: #2c3e50;
        }
        
        .error-bar {
            height: 6px;
            background: rgba(0,0,0,0.1);
            border-radius: 3px;
            overflow: hidden;
            margin-top: auto;
        }
        
        .error-fill {
            height: 100%;
            border-radius: 3px;
        }
        
        /* 6. КОРРЕЛЯЦИЯ СЛОЖНОСТИ И ВЫПОЛНЕНИЯ */
        .correlation-card {
            grid-column: 3;
            grid-row: 2;
        }
        
        .scatter-chart {
            height: 140px;
            position: relative;
            margin-top: 5px;
        }
        
        .scatter-plot {
            position: absolute;
            top: 0;
            left: 25px;
            right: 0;
            bottom: 20px;
            border-left: 1px solid #e0e0e0;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .scatter-y-axis {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 20px;
            width: 25px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: flex-end;
            padding-right: 5px;
            font-size: 7px;
            color: #7f8c8d;
            font-weight: 600;
        }
        
        .scatter-x-axis {
            position: absolute;
            left: 25px;
            right: 0;
            bottom: 0;
            height: 20px;
            display: flex;
            justify-content: space-around;
            align-items: center;
            font-size: 7px;
            color: #7f8c8d;
        }
        
        .x-label, .y-label {
            position: absolute;
            font-size: 6px;
            color: #7f8c8d;
            font-weight: 600;
        }
        
        .x-label {
            bottom: -15px;
            left: 50%;
            transform: translateX(-50%);
        }
        
        .y-label {
            top: 50%;
            left: -30px;
            transform: translateY(-50%) rotate(-90deg);
            white-space: nowrap;
        }
        
        .scatter-point {
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            transform: translate(-50%, 50%);
        }
        
        .trend-line {
            position: absolute;
            height: 2px;
            background: #e74c3c;
            opacity: 0.7;
            transform-origin: 0 0;
        }
        
        /* 7. РЕКОМЕНДАЦИИ С ПРИОРИТЕТАМИ */
        .recommendations-card {
            grid-column: 2;
            grid-row: 3;
        }
        
        .priority-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
            height: 140px;
            margin-top: 5px;
            overflow-y: auto;
            padding-right: 5px;
        }
        
        .priority-item {
            display: flex;
            align-items: flex-start;
            gap: 6px;
            padding: 5px;
            border-radius: 5px;
            background: #f8f9fa;
            border-left: 4px solid #3498db;
            page-break-inside: avoid;
        }
        
        .priority-high { border-left-color: #e74c3c; background: linear-gradient(to right, rgba(231, 76, 60, 0.05), #f8f9fa); }
        .priority-medium { border-left-color: #f39c12; background: linear-gradient(to right, rgba(243, 156, 18, 0.05), #f8f9fa); }
        .priority-low { border-left-color: #3498db; background: linear-gradient(to right, rgba(52, 152, 219, 0.05), #f8f9fa); }
        
        .priority-badge {
            font-size: 8px;
            font-weight: 800;
            color: white;
            padding: 1px 4px;
            border-radius: 3px;
            min-width: 40px;
            text-align: center;
        }
        
        .badge-high { background: #e74c3c; }
        .badge-medium { background: #f39c12; }
        .badge-low { background: #3498db; }
        
        .priority-text {
            font-size: 8px;
            color: #2c3e50;
            line-height: 1.3;
            flex: 1;
        }
        
        /* 8. СРАВНЕНИЕ С НОРМАТИВАМИ */
        .standards-card {
            grid-column: 3;
            grid-row: 3;
        }
        
        .standards-chart {
            height: 140px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            margin-top: 5px;
        }
        
        .gauge-chart {
            width: 120px;
            height: 120px;
            position: relative;
        }
        
        .gauge-background {
            fill: none;
            stroke: #ecf0f1;
            stroke-width: 8;
        }
        
        .gauge-fill {
            fill: none;
            stroke: #3498db;
            stroke-width: 8;
            stroke-linecap: round;
        }
        
        .gauge-value {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }
        
        .gauge-number {
            font-size: 16px;
            font-weight: 800;
            color: #2c3e50;
        }
        
        .gauge-label {
            font-size: 7px;
            color: #7f8c8d;
            font-weight: 600;
        }
        
        /* СТРАНИЦА 3 - ПРОГНОЗЫ И СТРАТЕГИИ */
        .strategy-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            grid-template-rows: auto auto;
            gap: 12px;
            padding: 12px;
            height: calc(210mm - 24px);
        }
        
        .strategy-card {
            background: white;
            border-radius: 10px;
            padding: 12px;
            border: 1px solid #e0e0e0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.07);
            position: relative;
            overflow: hidden;
            page-break-inside: avoid;
        }
        
        .strategy-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #9b59b6, #8e44ad);
        }
        
        /* ОСОБЫЕ СТИЛИ ДЛЯ БЛОКОВ С ПРОКРУТКОЙ */
        .scrollable-content {
            height: 140px;
            margin-top: 10px;
            overflow-y: auto;
            padding-right: 5px;
        }
        
        /* СТИЛИ ДЛЯ ПЕЧАТИ - ИСПРАВЛЕННЫЕ */
        @media print {
            body {
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
                width: 100% !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            
            .page-break {
                page-break-before: always;
                break-before: page;
            }
            
            .report-container, .analytics-grid, .strategy-grid {
                height: auto !important;
                min-height: 180mm;
                page-break-inside: avoid;
                break-inside: avoid;
            }
            
            .analytics-card, .strategy-card {
                box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
                border: 1px solid #ddd !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                overflow: visible !important;
            }
            
            .analytics-card::before {
                background: #3498db !important;
            }
            
            .strategy-card::before {
                background: #9b59b6 !important;
            }
            
            /* ВАЖНОЕ ИСПРАВЛЕНИЕ: убираем прокрутку при печати */
            .scrollable-content, 
            .priority-list,
            div[style*="overflow-y: auto"],
            div[style*="overflow-y: scroll"] {
                overflow: visible !important;
                height: auto !important;
                max-height: none !important;
                padding-right: 0 !important;
            }
            
            /* Обеспечиваем видимость всех элементов */
            .task-desc-item,
            .priority-item,
            .goal-item,
            .resource-item {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            
            /* ИСПРАВЛЕНИЕ ДЛЯ ГРАФИКОВ: убираем transition и animation */
            .performance-bar,
            .score-bar,
            .error-fill {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
                transition: none !important;
                animation: none !important;
            }
            
            /* Для donut chart */
            .mini-donut::before {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            
            .metric-card {
                box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            
            /* Скрываем ненужные элементы */
            .task-desc-item:hover {
                background: #f8f9fa !important;
            }
            
            /* Увеличиваем читаемость при печати */
            .analytics-title {
                font-size: 11px !important;
            }
            
            .priority-text, .task-description {
                font-size: 8px !important;
            }
        }
    </style>
</head>
<body>
    <!-- СТРАНИЦА 1 - ОСНОВНЫЕ РЕЗУЛЬТАТЫ -->
    <div class="report-container">
        <!-- ЛЕВАЯ КОЛОНКА -->
        <div class="left-column">
            <!-- Заголовок -->
            <div class="header-compact">
                <div class="work-title-compact">
                    <h1>${data.test.subject}, ${data.test.class} класс</h1>
                    <div class="work-subtitle-compact">
                        <span>${data.test.theme.substring(0, 40)}${data.test.theme.length > 40 ? '...' : ''}</span>
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
                <div class="scrollable-content">
                    ${generateTaskAnalysis(stats.taskPercentages, data.tasks)}
                </div>
            </div>
            
            <!-- Распределение оценок -->
            <div class="right-section">
                <div class="section-title">
                    <span>🎯</span> Распределение оценок
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="mini-donut" style="${getDonutStyles(stats)}">
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
    
    <!-- СТРАНИЦА 2 - РАСШИРЕННАЯ АНАЛИТИКА -->
    <div class="page-break"></div>
    
    <div class="analytics-grid">
        <!-- 1. КОРИДОР РЕШАЕМОСТИ -->
        <div class="analytics-card corridor-card">
            <div class="analytics-title">
                <span>📊</span> Коридор решаемости заданий
            </div>
            <div class="corridor-chart">
                ${generateEnhancedCorridorChart(stats.taskPercentages, true)}
            </div>
        </div>
        
        <!-- 2. КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ -->
        <div class="analytics-card metrics-card">
            <div class="analytics-title">
                <span>📈</span> Ключевые показатели
            </div>
            <div class="metrics-grid">
                ${generateMetricsGrid(stats)}
            </div>
        </div>
        
        <!-- 3. НОРМАЛЬНОЕ РАСПРЕДЕЛЕНИЕ БАЛЛОВ -->
        <div class="analytics-card distribution-card">
            <div class="analytics-title">
                <span>📊</span> Распределение баллов
            </div>
            <div class="distribution-chart">
                ${generateDistributionChart(stats, true)}
            </div>
        </div>
        
        <!-- 4. УРОВНИ СЛОЖНОСТИ -->
        <div class="analytics-card complexity-card">
            <div class="analytics-title">
                <span>🏔️</span> Распределение по сложности
            </div>
            <div class="radial-chart">
                ${generateRadialComplexityChart(data.tasks)}
            </div>
            <div class="complexity-legend">
                ${generateComplexityLegend(data.tasks)}
            </div>
        </div>
        
        <!-- 5. ТИПИЧНЫЕ ОШИБКИ -->
        <div class="analytics-card errors-card">
            <div class="analytics-title">
                <span>🔍</span> Типичные ошибки
            </div>
            <div class="errors-visual">
                ${generateErrorsVisualization(data.errors)}
            </div>
        </div>
        
        <!-- 6. КОРРЕЛЯЦИЯ СЛОЖНОСТИ И ВЫПОЛНЕНИЯ -->
        <div class="analytics-card correlation-card">
            <div class="analytics-title">
                <span>📐</span> Сложность vs Выполнение
            </div>
            <div class="scatter-chart">
                ${generateCorrelationChart(data.tasks, stats.taskPercentages)}
            </div>
        </div>
        
        <!-- 7. РЕКОМЕНДАЦИИ С ПРИОРИТЕТАМИ -->
        <div class="analytics-card recommendations-card">
            <div class="analytics-title">
                <span>🎯</span> Приоритетные рекомендации
            </div>
            <div class="priority-list">
                ${generatePriorityRecommendations(stats, data)}
            </div>
        </div>
        
        <!-- 8. СРАВНЕНИЕ С НОРМАТИВАМИ -->
        <div class="analytics-card standards-card">
            <div class="analytics-title">
                <span>📏</span> Соответствие нормативам
            </div>
            <div class="standards-chart">
                ${generateStandardsGauge(stats)}
            </div>
        </div>
    </div>
    
    <!-- СТРАНИЦА 3 - ПРОГНОЗЫ И СТРАТЕГИИ -->
    <div class="page-break"></div>
    
    <div class="strategy-grid">
        <!-- Прогноз улучшений -->
        <div class="strategy-card" style="grid-column: 1; grid-row: 1;">
            <div class="analytics-title">
                <span>🔮</span> Прогноз улучшений
            </div>
            <div style="height: 140px; margin-top: 10px;">
                ${generateImprovementForecast(stats, data)}
            </div>
        </div>
        
        <!-- Цели на следующий тест -->
        <div class="strategy-card" style="grid-column: 2; grid-row: 1;">
            <div class="analytics-title">
                <span>🎯</span> Цели на следующий тест
            </div>
            <div class="scrollable-content">
                ${generateNextTestGoals(stats)}
            </div>
        </div>
        
        <!-- Индивидуальные траектории -->
        <div class="strategy-card" style="grid-column: 3; grid-row: 1;">
            <div class="analytics-title">
                <span>👥</span> Группы учащихся
            </div>
            <div style="height: 140px; margin-top: 10px;">
                ${generateStudentGroups(stats, data)}
            </div>
        </div>
        
        <!-- Матрица компетенций -->
        <div class="strategy-card" style="grid-column: 1; grid-row: 2;">
            <div class="analytics-title">
                <span>🧩</span> Матрица компетенций
            </div>
            <div style="height: 140px; margin-top: 10px;">
                ${generateCompetencyMatrix(data.tasks)}
            </div>
        </div>
        
        <!-- Точки роста -->
        <div class="strategy-card" style="grid-column: 2; grid-row: 2;">
            <div class="analytics-title">
                <span>📈</span> Точки роста
            </div>
            <div class="scrollable-content">
                ${generateGrowthPoints(stats.taskPercentages, data.tasks)}
            </div>
        </div>
        
        <!-- Ресурсы и материалы -->
        <div class="strategy-card" style="grid-column: 3; grid-row: 2;">
            <div class="analytics-title">
                <span>📚</span> Рекомендуемые ресурсы
            </div>
            <div class="scrollable-content">
                ${generateRecommendedResources(stats, data)}
            </div>
        </div>
    </div>
</body>
</html>`;
    }

    // РАСШИРЕННАЯ СТАТИСТИКА
    function calculateExtendedStatistics(data) {
        const maxScore = data.tasks.reduce((sum, task) => sum + task.maxScore, 0);
        const taskTotals = new Array(data.tasks.length).fill(0);
        let totalScoreAll = 0;
        const gradeCounts = {2: 0, 3: 0, 4: 0, 5: 0};
        const studentScores = [];
        
        // Обрабатываем результаты
        data.results.forEach((studentResults) => {
            let studentTotal = 0;
            studentResults.forEach((score, taskIndex) => {
                studentTotal += score;
                taskTotals[taskIndex] += score;
            });
            totalScoreAll += studentTotal;
            studentScores.push(studentTotal);
            
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
                description: task.description,
                level: task.level || 1
            };
        });
        
        // Общий процент выполнения
        const overallPercentage = (totalScoreAll / (data.students.length * maxScore)) * 100;
        
        // Средний балл
        const averageScore = totalScoreAll / data.students.length;
        
        // Стандартное отклонение
        const variance = studentScores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / studentScores.length;
        const standardDeviation = Math.sqrt(variance);
        
        // Медиана
        const sortedScores = [...studentScores].sort((a, b) => a - b);
        const median = sortedScores.length % 2 === 0 
            ? (sortedScores[sortedScores.length/2 - 1] + sortedScores[sortedScores.length/2]) / 2
            : sortedScores[Math.floor(sortedScores.length/2)];
        
        // Мода
        const frequencyMap = {};
        studentScores.forEach(score => {
            frequencyMap[score] = (frequencyMap[score] || 0) + 1;
        });
        let mode = 0;
        let maxFrequency = 0;
        Object.entries(frequencyMap).forEach(([score, freq]) => {
            if (freq > maxFrequency) {
                mode = parseFloat(score);
                maxFrequency = freq;
            }
        });
        
        // Качество знаний и успеваемость
        const quality = ((gradeCounts[4] + gradeCounts[5]) / data.students.length * 100).toFixed(1);
        const success = ((gradeCounts[3] + gradeCounts[4] + gradeCounts[5]) / data.students.length * 100).toFixed(1);
        
        // Коэффициент вариации
        const coefficientOfVariation = (standardDeviation / averageScore * 100).toFixed(1);
        
        // Асимметрия
        const skewness = studentScores.reduce((sum, score) => sum + Math.pow((score - averageScore) / standardDeviation, 3), 0) / studentScores.length;
        
        // Эксцесс
        const kurtosis = studentScores.reduce((sum, score) => sum + Math.pow((score - averageScore) / standardDeviation, 4), 0) / studentScores.length - 3;
        
        return {
            maxScore,
            taskTotals,
            totalScoreAll,
            gradeCounts,
            taskPercentages,
            overallPercentage,
            averageScore,
            standardDeviation: standardDeviation.toFixed(2),
            median: median.toFixed(1),
            mode: mode.toFixed(1),
            quality,
            success,
            coefficientOfVariation,
            skewness: skewness.toFixed(2),
            kurtosis: kurtosis.toFixed(2),
            studentScores,
            studentCount: data.students.length
        };
    }

    // УЛУЧШЕННЫЙ КОРИДОР РЕШАЕМОСТИ - ИСПРАВЛЕННЫЙ ДЛЯ ПЕЧАТИ
    function generateEnhancedCorridorChart(taskPercentages, forPrint = false) {
        if (!taskPercentages || taskPercentages.length === 0) {
            return '<div style="text-align: center; color: #7f8c8d; padding: 40px 0;">Нет данных</div>';
        }
        
        const sorted = [...taskPercentages].sort((a, b) => a.number - b.number);
        
        let html = `
            <div class="corridor-axes">
                <div class="y-axis">
                    <span>100%</span>
                    <span>80%</span>
                    <span>60%</span>
                    <span>40%</span>
                    <span>20%</span>
                    <span>0%</span>
                </div>
                <div class="chart-area">
                    <div class="threshold-zone zone-high"></div>
                    <div class="threshold-zone zone-medium"></div>
                    <div class="threshold-zone zone-low"></div>
        `;
        
        // Создаем столбцы
        sorted.forEach((task, index) => {
            // ВАЖНОЕ ИСПРАВЛЕНИЕ: правильный расчет высоты
            const heightPercent = Math.max(1, (task.percentage / 100) * 100); // От 1% до 100%
            const heightPx = (heightPercent / 100) * 110; // 110px - максимальная высота
            const leftPercent = (index / (sorted.length - 1)) * 100;
            
            // Определяем цвет столбца
            let color;
            if (task.percentage >= 90) color = '#27ae60';
            else if (task.percentage >= 70) color = '#2ecc71';
            else if (task.percentage >= 50) color = '#3498db';
            else if (task.percentage >= 30) color = '#f39c12';
            else if (task.percentage >= 10) color = '#e74c3c';
            else color = '#c0392b';
            
            // Для печати добавляем inline стиль с фиксированной высотой
            const style = forPrint 
                ? `style="height: ${heightPx}px; background: ${color}; min-height: 1px;"`
                : `style="height: ${heightPx}px; background: ${color};"`;
            
            html += `
                <div class="bar-container" style="left: ${leftPercent}%;">
                    <div class="performance-bar" ${style}>
                        <div class="bar-value">${Math.round(task.percentage)}%</div>
                    </div>
                    <div class="bar-label">${task.number}</div>
                </div>
            `;
        });
        
        html += '</div></div>';
        return html;
    }

    // КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ - КОМПАКТНЫЕ КАРТОЧКИ
    function generateMetricsGrid(stats) {
        const metrics = [
            { 
                label: 'Общее выполнение', 
                value: `${Math.round(stats.overallPercentage)}%`,
                color: '#3498db',
                bg: 'linear-gradient(135deg, #3498db, #2980b9)'
            },
            { 
                label: 'Средний балл', 
                value: stats.averageScore.toFixed(1),
                color: '#27ae60',
                bg: 'linear-gradient(135deg, #27ae60, #219653)'
            },
            { 
                label: 'Качество знаний', 
                value: `${stats.quality}%`,
                color: '#9b59b6',
                bg: 'linear-gradient(135deg, #9b59b6, #8e44ad)'
            },
            { 
                label: 'Успеваемость', 
                value: `${stats.success}%`,
                color: '#2ecc71',
                bg: 'linear-gradient(135deg, #2ecc71, #27ae60)'
            },
            { 
                label: 'Станд. отклонение', 
                value: stats.standardDeviation,
                color: '#f39c12',
                bg: 'linear-gradient(135deg, #f39c12, #e67e22)'
            },
            { 
                label: 'Медиана баллов', 
                value: stats.median,
                color: '#e74c3c',
                bg: 'linear-gradient(135deg, #e74c3c, #c0392b)'
            },
            { 
                label: 'Мода оценок', 
                value: stats.mode,
                color: '#1abc9c',
                bg: 'linear-gradient(135deg, #1abc9c, #16a085)'
            },
            { 
                label: 'Коэф. вариации', 
                value: `${stats.coefficientOfVariation}%`,
                color: '#34495e',
                bg: 'linear-gradient(135deg, #34495e, #2c3e50)'
            }
        ];
        
        return metrics.map(metric => `
            <div class="metric-card" style="background: ${metric.bg};">
                <div class="metric-value">${metric.value}</div>
                <div class="metric-label">${metric.label}</div>
            </div>
        `).join('');
    }

    // НОРМАЛЬНОЕ РАСПРЕДЕЛЕНИЕ БАЛЛОВ - ИСПРАВЛЕННОЕ ДЛЯ ПЕЧАТИ
    function generateDistributionChart(stats, forPrint = false) {
        if (!stats.studentScores || stats.studentScores.length === 0) {
            return '<div style="text-align: center; color: #7f8c8d; padding: 40px 0;">Нет данных</div>';
        }
        
        // Группируем баллы
        const scoreGroups = {};
        const maxScore = Math.max(...stats.studentScores);
        const minScore = Math.min(...stats.studentScores);
        const range = maxScore - minScore;
        const groupSize = Math.max(1, Math.ceil(range / 6));
        
        stats.studentScores.forEach(score => {
            const group = Math.floor(score / groupSize) * groupSize;
            scoreGroups[group] = (scoreGroups[group] || 0) + 1;
        });
        
        // Создаем массив групп
        const groups = [];
        for (let i = minScore; i <= maxScore; i += groupSize) {
            const groupKey = Math.floor(i / groupSize) * groupSize;
            groups.push({
                score: groupKey,
                count: scoreGroups[groupKey] || 0,
                label: `${groupKey}`
            });
        }
        
        const maxCount = Math.max(...groups.map(g => g.count), 1);
        
        let html = `
            <div class="distribution-y-axis">
                <span>${maxCount}</span>
                <span>${Math.round(maxCount * 0.75)}</span>
                <span>${Math.round(maxCount * 0.5)}</span>
                <span>${Math.round(maxCount * 0.25)}</span>
                <span>0</span>
            </div>
            
            <div class="distribution-x-axis">
                ${groups.map(g => `<span>${g.label}</span>`).join('')}
            </div>
            
            <div class="distribution-area">
        `;
        
        groups.forEach((group, index) => {
            const heightPercent = (group.count / maxCount) * 100;
            
            // Определяем цвет по позиции в распределении
            let color;
            const position = index / groups.length;
            if (position < 0.25) color = '#e74c3c';
            else if (position < 0.5) color = '#f39c12';
            else if (position < 0.75) color = '#3498db';
            else color = '#27ae60';
            
            // ВАЖНОЕ ИСПРАВЛЕНИЕ: для печати гарантируем высоту
            const style = forPrint 
                ? `style="height: ${heightPercent}%; background: ${color}; min-height: ${group.count > 0 ? '5px' : '1px'};"`
                : `style="height: ${heightPercent}%; background: ${color};"`;
            
            html += `
                <div class="distribution-bar">
                    <div class="score-bar" ${style}>
                        <div class="score-count">${group.count}</div>
                    </div>
                    <div class="score-label">${group.label}</div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    // КОРРЕЛЯЦИЯ СЛОЖНОСТИ И ВЫПОЛНЕНИЯ
    function generateCorrelationChart(tasks, taskPercentages) {
        if (!tasks || tasks.length === 0 || !taskPercentages || taskPercentages.length === 0) {
            return '<div style="text-align: center; color: #7f8c8d; padding: 40px 0;">Нет данных</div>';
        }
        
        // Сопоставляем сложность и выполнение
        const points = tasks.map((task, index) => ({
            level: task.level || 1,
            percentage: taskPercentages[index]?.percentage || 0,
            number: task.number
        }));
        
        // Находим min и max для масштабирования
        const minLevel = Math.min(...points.map(p => p.level));
        const maxLevel = Math.max(...points.map(p => p.level));
        const minPercentage = Math.min(...points.map(p => p.percentage));
        const maxPercentage = Math.max(...points.map(p => p.percentage));
        
        let html = `
            <div class="scatter-y-axis">
                <span>${Math.round(maxPercentage)}%</span>
                <span>${Math.round(maxPercentage * 0.75)}%</span>
                <span>${Math.round(maxPercentage * 0.5)}%</span>
                <span>${Math.round(maxPercentage * 0.25)}%</span>
                <span>0%</span>
            </div>
            
            <div class="scatter-x-axis">
                ${[1, 2, 3, 4].map(level => `<span>Ур.${level}</span>`).join('')}
            </div>
            
            <div class="x-label">Уровень сложности</div>
            <div class="y-label">Процент выполнения</div>
            
            <div class="scatter-plot">
        `;
        
        // Точки данных
        points.forEach(point => {
            const x = ((point.level - minLevel) / (maxLevel - minLevel || 1)) * 100;
            const y = 100 - ((point.percentage - minPercentage) / (maxPercentage - minPercentage || 1)) * 100;
            
            // Цвет в зависимости от уровня сложности
            let color = colors.complexity[point.level] || '#3498db';
            
            html += `
                <div class="scatter-point" 
                     style="left: ${x}%; bottom: ${y}%; background: ${color};"
                     title="Задание ${point.number}: Ур.${point.level}, ${Math.round(point.percentage)}%"></div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    // ИСПРАВЛЕННАЯ ФУНКЦИЯ ДЛЯ DONUT CHART
    function getDonutStyles(stats) {
        const percentages = stats.gradeCounts;
        const total = Object.values(percentages).reduce((a, b) => a + b, 0);
        
        if (total === 0) {
            return '--grade-5: 0%; --grade-4: 0%; --grade-3: 0%;';
        }
        
        const p5 = (percentages[5] || 0) / total * 100;
        const p4 = (percentages[4] || 0) / total * 100;
        const p3 = (percentages[3] || 0) / total * 100;
        
        return `--grade-5: ${p5}%; --grade-4: ${p5 + p4}%; --grade-3: ${p5 + p4 + p3}%;`;
    }

    // ОСНОВНЫЕ ФУНКЦИИ
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

    // ФУНКЦИИ ДЛЯ СТРАНИЦЫ 1
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
        
        const taskData = taskPercentages.map((task, index) => ({
            ...task,
            description: tasks[index]?.description || 'Описание отсутствует'
        })).sort((a, b) => a.number - b.number);
        
        return taskData.map(task => {
            const shortDesc = task.description.length > 40 ? 
                task.description.substring(0, 37) + '...' : 
                task.description;
            
            // Определяем цвет границы в зависимости от процента выполнения
            let borderColor = '#e0e0e0';
            if (task.percentage >= 80) borderColor = '#27ae60';
            else if (task.percentage >= 60) borderColor = '#3498db';
            else if (task.percentage >= 40) borderColor = '#f39c12';
            else borderColor = '#e74c3c';
            
            return `
                <div class="task-desc-item" style="border-left-color: ${borderColor};">
                    <div class="task-number">${task.number}.</div>
                    <div class="task-description" title="${task.description}">${shortDesc}</div>
                    <div class="task-percentage" style="color: ${borderColor};">${Math.round(task.percentage)}%</div>
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

    // ФУНКЦИИ ДЛЯ СТРАНИЦЫ 2
    function generateRadialComplexityChart(tasks) {
        if (!tasks || tasks.length === 0) {
            return '<div style="text-align: center; color: #7f8c8d; padding: 40px 0;">Нет данных</div>';
        }
        
        const levelCounts = {1: 0, 2: 0, 3: 0, 4: 0};
        tasks.forEach(task => {
            if (task.level) {
                levelCounts[task.level] = (levelCounts[task.level] || 0) + 1;
            }
        });
        
        const total = tasks.length;
        const percentages = {};
        let cumulative = 0;
        
        // Рассчитываем проценты и углы
        [1, 2, 3, 4].forEach(level => {
            percentages[level] = (levelCounts[level] / total) * 100;
        });
        
        // Создаем SVG диаграмму
        let svg = `
            <svg class="radial-svg" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#ecf0f1" stroke-width="15"/>
        `;
        
        [1, 2, 3, 4].forEach(level => {
            const percentage = percentages[level];
            if (percentage > 0) {
                const angle = (percentage / 100) * 360;
                const startAngle = cumulative;
                const endAngle = cumulative + angle;
                
                // Конвертируем углы в радианы
                const startRad = (startAngle - 90) * Math.PI / 180;
                const endRad = (endAngle - 90) * Math.PI / 180;
                
                // Рассчитываем точки дуги
                const x1 = 60 + 50 * Math.cos(startRad);
                const y1 = 60 + 50 * Math.sin(startRad);
                const x2 = 60 + 50 * Math.cos(endRad);
                const y2 = 60 + 50 * Math.sin(endRad);
                
                // Флаг большой дуги
                const largeArcFlag = angle > 180 ? 1 : 0;
                
                svg += `
                    <path d="M ${x1} ${y1} 
                            A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}"
                          fill="none" 
                          stroke="${colors.complexity[level]}" 
                          stroke-width="15" 
                          stroke-linecap="round"/>
                `;
                
                cumulative += angle;
            }
        });
        
        svg += '</svg>';
        
        return svg + `
            <div class="radial-center">
                <div class="radial-total">${total}</div>
                <div class="radial-label">заданий</div>
            </div>
        `;
    }

    function generateComplexityLegend(tasks) {
        if (!tasks || tasks.length === 0) return '';
        
        const levelCounts = {1: 0, 2: 0, 3: 0, 4: 0};
        tasks.forEach(task => {
            if (task.level) {
                levelCounts[task.level] = (levelCounts[task.level] || 0) + 1;
            }
        });
        
        const levelNames = {
            1: 'Базовый',
            2: 'Применение', 
            3: 'Анализ',
            4: 'Творческий'
        };
        
        return [1, 2, 3, 4].map(level => {
            const count = levelCounts[level] || 0;
            if (count === 0) return '';
            
            const percentage = (count / tasks.length * 100).toFixed(0);
            
            return `
                <div class="legend-item">
                    <div class="legend-color" style="background: ${colors.complexity[level]}"></div>
                    <div style="flex: 1; font-weight: 600;">${levelNames[level]}</div>
                    <div style="font-weight: 700;">${count} (${percentage}%)</div>
                </div>
            `;
        }).join('');
    }

    function generateErrorsVisualization(errors) {
        if (!errors || errors.length === 0) {
            return '<div style="grid-column: 1 / span 2; text-align: center; color: #7f8c8d; padding: 40px 0;">Данные об ошибках отсутствуют</div>';
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
            return '<div style="grid-column: 1 / span 2; text-align: center; color: #7f8c8d; padding: 40px 0;">Нет данных об ошибках</div>';
        }
        
        // Сортируем по количеству ошибок и берем топ-4
        const topErrors = Object.entries(errorCounts)
            .map(([type, count]) => ({
                type,
                count,
                percentage: (count / totalErrors * 100).toFixed(0)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 4);
        
        let html = '';
        
        topErrors.forEach((error, index) => {
            const errorType = errorTypes[error.type];
            if (!errorType) return;
            
            html += `
                <div class="error-category">
                    <div class="error-header">
                        <div class="error-dot" style="background: ${errorType.color}"></div>
                        <div class="error-name">${errorType.name}</div>
                        <div class="error-count">${error.count}</div>
                    </div>
                    <div style="font-size: 7px; color: #7f8c8d; margin-bottom: 8px; line-height: 1.2;">
                        ${errorType.desc}
                    </div>
                    <div class="error-bar">
                        <div class="error-fill" style="width: ${error.percentage}%; background: ${errorType.color};"></div>
                    </div>
                    <div style="font-size: 6px; color: #7f8c8d; text-align: right; margin-top: 2px;">
                        ${error.percentage}% от всех ошибок
                    </div>
                </div>
            `;
        });
        
        return html;
    }

    function generatePriorityRecommendations(stats, data) {
        let recommendations = [];
        
        // Приоритет HIGH: Ученики с неудовлетворительными оценками
        if (stats.gradeCounts && stats.gradeCounts[2] > 0) {
            recommendations.push({
                priority: 'high',
                text: `Индивидуальная работа с ${stats.gradeCounts[2]} учащимся (оценка "2")`
            });
        }
        
        // Приоритет HIGH: Очень низкое выполнение (< 30%)
        if (stats.taskPercentages && stats.taskPercentages.length > 0) {
            const veryHardTasks = stats.taskPercentages.filter(t => t.percentage < 30);
            if (veryHardTasks.length > 0) {
                const taskNumbers = veryHardTasks.map(t => t.number).join(', ');
                recommendations.push({
                    priority: 'high',
                    text: `Срочно разобрать задания: ${taskNumbers} (выполнение < 30%)`
                });
            }
        }
        
        // Приоритет MEDIUM: Низкое качество знаний
        if (parseFloat(stats.quality) < 60) {
            recommendations.push({
                priority: 'medium',
                text: `Повысить качество знаний с ${stats.quality}% до 70%+`
            });
        }
        
        // Приоритет MEDIUM: Высокое стандартное отклонение
        if (parseFloat(stats.standardDeviation) > stats.averageScore * 0.3) {
            recommendations.push({
                priority: 'medium',
                text: 'Снизить разброс результатов между учащимися'
            });
        }
        
        // Приоритет LOW: Общие рекомендации
        recommendations.push({
            priority: 'low',
            text: 'Провести работу над внимательностью при чтении условий'
        });
        
        recommendations.push({
            priority: 'low',
            text: 'Разобрать типичные ошибки на обобщающем уроке'
        });
        
        // Ограничиваем количество рекомендаций
        const limitedRecs = recommendations.slice(0, 5);
        
        return limitedRecs.map(rec => {
            const priorityClass = `priority-${rec.priority}`;
            const badgeClass = `badge-${rec.priority}`;
            const badgeText = rec.priority === 'high' ? 'ВЫСОКИЙ' : rec.priority === 'medium' ? 'СРЕДНИЙ' : 'НИЗКИЙ';
            
            return `
                <div class="priority-item ${priorityClass}">
                    <div class="priority-badge ${badgeClass}">${badgeText}</div>
                    <div class="priority-text">${rec.text}</div>
                </div>
            `;
        }).join('');
    }

    function generateStandardsGauge(stats) {
        const percentage = parseFloat(stats.overallPercentage);
        let color, label;
        
        if (percentage >= 80) {
            color = '#27ae60';
            label = 'Отлично';
        } else if (percentage >= 60) {
            color = '#3498db';
            label = 'Хорошо';
        } else if (percentage >= 40) {
            color = '#f39c12';
            label = 'Удовлетворительно';
        } else {
            color = '#e74c3c';
            label = 'Требует работы';
        }
        
        // Рассчитываем угол для дуги
        const angle = (percentage / 100) * 180;
        const dashArray = (angle * 251.2 / 180).toFixed(1);
        
        return `
            <div class="gauge-chart">
                <svg viewBox="0 0 120 60">
                    <path class="gauge-background" d="M 20 60 A 40 40 0 0 1 100 60" />
                    <path class="gauge-fill" 
                          d="M 20 60 A 40 40 0 0 1 100 60"
                          stroke="${color}"
                          stroke-dasharray="${dashArray}, 251.2" />
                </svg>
                <div class="gauge-value">
                    <div class="gauge-number">${Math.round(percentage)}%</div>
                    <div class="gauge-label">${label}</div>
                </div>
            </div>
        `;
    }

    // ФУНКЦИИ ДЛЯ СТРАНИЦЫ 3
    function generateImprovementForecast(stats, data) {
        const currentQuality = parseFloat(stats.quality);
        const currentSuccess = parseFloat(stats.success);
        const currentAverage = parseFloat(stats.averageScore);
        
        // Прогноз улучшений
        const forecastQuality = Math.min(100, currentQuality * 1.15).toFixed(1);
        const forecastSuccess = Math.min(100, currentSuccess * 1.08).toFixed(1);
        const forecastAverage = (currentAverage * 1.1).toFixed(1);
        
        return `
            <div style="display: flex; flex-direction: column; gap: 8px; padding: 5px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 60%;">
                        <div style="font-size: 7px; color: #7f8c8d; margin-bottom: 2px;">Качество знаний</div>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <div style="font-size: 9px; font-weight: 700; color: #e74c3c;">${currentQuality}%</div>
                            <div style="font-size: 8px; color: #7f8c8d;">→</div>
                            <div style="font-size: 9px; font-weight: 700; color: #27ae60;">${forecastQuality}%</div>
                        </div>
                    </div>
                    <div style="flex: 1; height: 8px; background: #ecf0f1; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${currentQuality}%; background: #e74c3c; border-radius: 4px;"></div>
                        <div style="height: 100%; width: ${Math.max(0, forecastQuality - currentQuality)}%; background: #27ae60; border-radius: 4px; margin-left: ${currentQuality}%;"></div>
                    </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 60%;">
                        <div style="font-size: 7px; color: #7f8c8d; margin-bottom: 2px;">Успеваемость</div>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <div style="font-size: 9px; font-weight: 700; color: #f39c12;">${currentSuccess}%</div>
                            <div style="font-size: 8px; color: #7f8c8d;">→</div>
                            <div style="font-size: 9px; font-weight: 700; color: #2ecc71;">${forecastSuccess}%</div>
                        </div>
                    </div>
                    <div style="flex: 1; height: 8px; background: #ecf0f1; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${currentSuccess}%; background: #f39c12; border-radius: 4px;"></div>
                        <div style="height: 100%; width: ${Math.max(0, forecastSuccess - currentSuccess)}%; background: #2ecc71; border-radius: 4px; margin-left: ${currentSuccess}%;"></div>
                    </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 60%;">
                        <div style="font-size: 7px; color: #7f8c8d; margin-bottom: 2px;">Средний балл</div>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <div style="font-size: 9px; font-weight: 700; color: #3498db;">${currentAverage}</div>
                            <div style="font-size: 8px; color: #7f8c8d;">→</div>
                            <div style="font-size: 9px; font-weight: 700; color: #9b59b6;">${forecastAverage}</div>
                        </div>
                    </div>
                    <div style="flex: 1; height: 8px; background: #ecf0f1; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${(currentAverage / stats.maxScore * 100)}%; background: #3498db; border-radius: 4px;"></div>
                        <div style="height: 100%; width: ${Math.max(0, (forecastAverage - currentAverage) / stats.maxScore * 100)}%; background: #9b59b6; border-radius: 4px; margin-left: ${(currentAverage / stats.maxScore * 100)}%;"></div>
                    </div>
                </div>
            </div>
        `;
    }

    function generateNextTestGoals(stats) {
        const goals = [
            { text: 'Увеличить качество знаний на 10%', priority: 'high' },
            { text: 'Снизить количество оценок "2" на 30%', priority: 'high' },
            { text: 'Повысить выполнение сложных заданий на 15%', priority: 'medium' },
            { text: 'Улучшить средний балл на 0.5 пункта', priority: 'medium' },
            { text: 'Провести 2 дополнительные консультации', priority: 'low' },
            { text: 'Создать банк типовых задач по слабым темам', priority: 'low' }
        ];
        
        return goals.map(goal => `
            <div class="goal-item" style="display: flex; align-items: flex-start; gap: 5px; margin-bottom: 5px; padding: 4px; background: #f8f9fa; border-radius: 4px; page-break-inside: avoid;">
                <div style="width: 6px; height: 6px; border-radius: 50%; background: ${goal.priority === 'high' ? '#e74c3c' : goal.priority === 'medium' ? '#f39c12' : '#3498db'}; margin-top: 3px;"></div>
                <div style="font-size: 8px; color: #2c3e50; line-height: 1.3; flex: 1;">${goal.text}</div>
            </div>
        `).join('');
    }

    function generateStudentGroups(stats, data) {
        // Группируем учащихся по результатам
        const groups = [
            { name: 'Отличники', min: 4.5, color: '#27ae60', count: 0 },
            { name: 'Хорошисты', min: 3.5, color: '#3498db', count: 0 },
            { name: 'Удовлетворительно', min: 2.5, color: '#f39c12', count: 0 },
            { name: 'Требуют внимания', min: 0, color: '#e74c3c', count: 0 }
        ];
        
        // Считаем учащихся в группах
        data.results.forEach((studentResults, index) => {
            const total = studentResults.reduce((sum, score) => sum + score, 0);
            const maxScore = data.tasks.reduce((sum, task) => sum + task.maxScore, 0);
            const percentage = (total / maxScore) * 100;
            
            if (percentage >= 85) groups[0].count++;
            else if (percentage >= 70) groups[1].count++;
            else if (percentage >= 50) groups[2].count++;
            else groups[3].count++;
        });
        
        const totalStudents = groups.reduce((sum, g) => sum + g.count, 0);
        
        return `
            <div style="display: flex; flex-direction: column; gap: 6px; padding: 5px;">
                ${groups.map(group => {
                    const percentage = totalStudents > 0 ? (group.count / totalStudents * 100).toFixed(0) : 0;
                    return `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${group.color};"></div>
                            <div style="font-size: 8px; color: #2c3e50; font-weight: 600; flex: 1;">${group.name}</div>
                            <div style="font-size: 9px; font-weight: 800; color: ${group.color};">${group.count}</div>
                            <div style="width: 50px; height: 6px; background: #ecf0f1; border-radius: 3px; overflow: hidden;">
                                <div style="height: 100%; width: ${percentage}%; background: ${group.color}; border-radius: 3px;"></div>
                            </div>
                            <div style="font-size: 7px; color: #7f8c8d; min-width: 20px; text-align: right;">${percentage}%</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function generateCompetencyMatrix(tasks) {
        // Анализ типов компетенций
        const competencies = {
            knowledge: { name: 'Знание', count: 0, color: '#3498db' },
            application: { name: 'Применение', count: 0, color: '#2ecc71' },
            analysis: { name: 'Анализ', count: 0, color: '#f39c12' },
            synthesis: { name: 'Синтез', count: 0, color: '#9b59b6' }
        };
        
        // Простой анализ по уровням сложности
        tasks.forEach(task => {
            const level = task.level || 1;
            if (level === 1) competencies.knowledge.count++;
            else if (level === 2) competencies.application.count++;
            else if (level === 3) competencies.analysis.count++;
            else competencies.synthesis.count++;
        });
        
        return `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); gap: 6px; height: 100%; padding: 5px;">
                ${Object.values(competencies).map(comp => {
                    const percentage = tasks.length > 0 ? (comp.count / tasks.length * 100).toFixed(0) : 0;
                    return `
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: ${comp.color}; border-radius: 6px; padding: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="font-size: 14px; font-weight: 800; color: white; margin-bottom: 3px;">${comp.count}</div>
                            <div style="font-size: 7px; color: rgba(255,255,255,0.95); font-weight: 600; text-align: center; line-height: 1.1;">${comp.name}</div>
                            <div style="font-size: 6px; color: rgba(255,255,255,0.8); margin-top: 2px;">${percentage}%</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function generateGrowthPoints(taskPercentages, tasks) {
        if (!taskPercentages || taskPercentages.length === 0) {
            return '<div style="text-align: center; color: #7f8c8d; padding: 40px 0;">Нет данных</div>';
        }
        
        // Находим задания с наибольшим потенциалом роста
        const growthTasks = [...taskPercentages]
            .filter(t => t.percentage > 30 && t.percentage < 70)
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 5);
        
        return growthTasks.map(task => {
            const taskDesc = tasks.find(t => t.number === task.number)?.description || 'Задание';
            const shortDesc = taskDesc.length > 50 ? taskDesc.substring(0, 47) + '...' : taskDesc;
            const growthPotential = Math.max(0, (70 - task.percentage)).toFixed(0);
            
            return `
                <div class="goal-item" style="display: flex; align-items: center; gap: 6px; margin-bottom: 5px; padding: 4px; background: #f8f9fa; border-radius: 4px; page-break-inside: avoid;">
                    <div style="font-size: 9px; font-weight: 800; color: #3498db; min-width: 20px; text-align: center;">${task.number}</div>
                    <div style="font-size: 7px; color: #2c3e50; flex: 1; line-height: 1.2;">${shortDesc}</div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end;">
                        <div style="font-size: 8px; font-weight: 700; color: #e74c3c;">${Math.round(task.percentage)}%</div>
                        <div style="font-size: 6px; color: #27ae60;">+${growthPotential}% потенциал</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function generateRecommendedResources(stats, data) {
        const resources = [
            { type: '📚', text: 'Сборник задач повышенной сложности' },
            { type: '🎥', text: 'Видеоуроки по темам с низким выполнением' },
            { type: '📝', text: 'Тренировочные тесты с автоматической проверкой' },
            { type: '👥', text: 'Групповые консультации для отстающих' },
            { type: '📊', text: 'Аналитические материалы по типичным ошибкам' },
            { type: '🎯', text: 'Индивидуальные карточки-тренажеры' }
        ];
        
        return resources.map(res => `
            <div class="resource-item" style="display: flex; align-items: flex-start; gap: 6px; margin-bottom: 5px; padding: 4px; background: #f8f9fa; border-radius: 4px; page-break-inside: avoid;">
                <div style="font-size: 10px;">${res.type}</div>
                <div style="font-size: 7px; color: #2c3e50; line-height: 1.3; flex: 1;">${res.text}</div>
            </div>
        `).join('');
    }

    // ЭКСПОРТИРУЕМЫЕ ФУНКЦИИ
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
            
            // Добавляем обработчик для печати после загрузки
            reportWindow.onload = function() {
                // Даем время на рендеринг графиков
                setTimeout(() => {
                    // Автоматически запускаем диалог печати
                    reportWindow.print();
                }, 500);
            };
            
            return reportWindow;
        } catch (error) {
            console.error('ReportGenerator: Ошибка при открытии отчёта:', error);
            alert('Ошибка при создании отчёта: ' + error.message);
        }
    }

    // Создаём глобальный объект с публичным API
    const ReportGeneratorPremium = {
        // Основные функции
        generateReport: generateReportModule,
        generateHTML: generateReportHTML,
        calculateExtendedStatistics: calculateExtendedStatistics,
        
        // Константы
        colors: colors,
        errorTypes: errorTypes,
        
        // Версия
        version: '3.1.0'
    };

    // Экспортируем в глобальную область видимости
    if (typeof global.ReportGenerator === 'undefined') {
        global.ReportGenerator = ReportGeneratorPremium;
    }

})(window || global || this);

console.log('ReportGenerator Premium v3.1.0 загружен и готов к использованию');
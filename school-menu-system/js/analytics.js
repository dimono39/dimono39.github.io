// ============================================
// Модуль аналитики и отчётов
// ============================================

let caloriesChart = null;
let bjuChart = null;

// Обновление аналитики
function updateAnalytics() {
    if (!dailyMenus.length) {
        document.getElementById('analyticsStats').innerHTML = '<div class="empty-state">Нет данных для анализа</div>';
        return;
    }
    
    // Общая статистика
    let totalCalories = 0, totalProteins = 0, totalFats = 0, totalCarbs = 0;
    let totalDishes = 0;
    const uniqueDishes = new Set();
    
    for (const menu of dailyMenus) {
        for (const mealType of MEAL_TYPES) {
            const items = menu[mealType]?.items || [];
            totalDishes += items.length;
            for (const item of items) {
                totalCalories += item.calories || 0;
                totalProteins += item.proteins || 0;
                totalFats += item.fats || 0;
                totalCarbs += item.carbs || 0;
                if (item.name) uniqueDishes.add(item.name);
            }
        }
    }
    
    const avgCalories = Math.round(totalCalories / dailyMenus.length);
    const varietyScore = uniqueDishes.size;
    
    document.getElementById('analyticsStats').innerHTML = `
        <div class="stat-item"><div class="stat-value">${dailyMenus.length}</div><div class="stat-label">Всего дней</div></div>
        <div class="stat-item"><div class="stat-value">${totalDishes}</div><div class="stat-label">Всего блюд</div></div>
        <div class="stat-item"><div class="stat-value">${avgCalories}</div><div class="stat-label">Ср. ккал/день</div></div>
        <div class="stat-item"><div class="stat-value">${varietyScore}</div><div class="stat-label">Уникальных блюд</div></div>
    `;
    
    // График калорийности
    const dates = dailyMenus.map(m => formatDateShort(m.date));
    const caloriesData = dailyMenus.map(m => {
        let total = 0;
        for (const mealType of MEAL_TYPES) {
            const items = m[mealType]?.items || [];
            for (const item of items) total += item.calories || 0;
        }
        return total;
    });
    
    const ctxCalories = document.getElementById('caloriesChart')?.getContext('2d');
    if (ctxCalories) {
        if (caloriesChart) caloriesChart.destroy();
        caloriesChart = new Chart(ctxCalories, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Калорийность (ккал)',
                    data: caloriesData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { position: 'top' } }
            }
        });
    }
    
    // График БЖУ
    const avgProteins = Math.round(totalProteins / dailyMenus.length);
    const avgFats = Math.round(totalFats / dailyMenus.length);
    const avgCarbs = Math.round(totalCarbs / dailyMenus.length);
    
    const ctxBJU = document.getElementById('bjuChart')?.getContext('2d');
    if (ctxBJU) {
        if (bjuChart) bjuChart.destroy();
        bjuChart = new Chart(ctxBJU, {
            type: 'bar',
            data: {
                labels: ['Белки', 'Жиры', 'Углеводы'],
                datasets: [{
                    label: 'Среднее значение (г)',
                    data: [avgProteins, avgFats, avgCarbs],
                    backgroundColor: ['#3b82f6', '#f59e0b', '#10b981'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { position: 'top' } }
            }
        });
    }
    
    // Отчёт по правилам
    updateRulesReport();
}

// Отчёт по правилам
function updateRulesReport() {
    if (!currentTemplateData) {
        document.getElementById('rulesReport').innerHTML = '<div class="empty-state">Загрузите типовое меню</div>';
        return;
    }
    
    const violations = runAllRules(currentTemplateData);
    const rulesMap = {
        1: 'Завтрак ≥500г', 2: 'Обед ≥700г', 3: 'Гор.блюдо ≥150г', 4: 'Закуска ≥60г',
        5: '1 блюдо ≥200г', 6: '2 блюдо ≥90г', 8: 'Гарнир ≥150г', 9: '2 завтрак ≥200г',
        10: 'Полдник ≥300г', 11: 'Ужин ≥500г', 12: '2 ужин ≥200г', 13: 'Калории завтрака ≥470',
        14: 'Калории обеда ≥705', 15: 'БЖУ ≤ вес', 16: 'Фрукты ≥100г', 17: 'Без дубликатов'
    };
    
    const violationsByRule = {};
    for (const v of violations) {
        violationsByRule[v.code] = (violationsByRule[v.code] || 0) + 1;
    }
    
    let html = '<table style="width:100%; border-collapse: collapse;">';
    for (const [code, name] of Object.entries(rulesMap)) {
        const count = violationsByRule[code] || 0;
        const status = count === 0 ? '✅' : '❌';
        const color = count === 0 ? '#10b981' : '#ef4444';
        html += `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px;"><span style="color: ${color};">${status}</span></td>
                <td style="padding: 10px;"><strong>${code}</strong></td>
                <td style="padding: 10px;">${name}</td>
                <td style="padding: 10px; text-align: right;">${count > 0 ? count + ' нарушений' : '✓'}</td>
            </tr>
        `;
    }
    html += '</table>';
    
    document.getElementById('rulesReport').innerHTML = html;
}

function formatDateShort(date) {
    return `${date.getDate()}.${date.getMonth() + 1}`;
}

// Генерация полного отчёта
function generateFullReport() {
    if (!dailyMenus.length) {
        showStatus('Нет данных для отчёта', 'error');
        return;
    }
    
    let totalCalories = 0, totalProteins = 0, totalFats = 0, totalCarbs = 0;
    let totalDishes = 0;
    const dishFrequency = {};
    
    for (const menu of dailyMenus) {
        for (const mealType of MEAL_TYPES) {
            const items = menu[mealType]?.items || [];
            totalDishes += items.length;
            for (const item of items) {
                totalCalories += item.calories || 0;
                totalProteins += item.proteins || 0;
                totalFats += item.fats || 0;
                totalCarbs += item.carbs || 0;
                dishFrequency[item.name] = (dishFrequency[item.name] || 0) + 1;
            }
        }
    }
    
    const mostFrequent = Object.entries(dishFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const report = {
        generated: new Date().toLocaleString(),
        totalDays: dailyMenus.length,
        totalDishes: totalDishes,
        avgCalories: Math.round(totalCalories / dailyMenus.length),
        avgProteins: Math.round(totalProteins / dailyMenus.length),
        avgFats: Math.round(totalFats / dailyMenus.length),
        avgCarbs: Math.round(totalCarbs / dailyMenus.length),
        mostFrequentDishes: mostFrequent,
        violations: runAllRules(currentTemplateData).length
    };
    
    return report;
}

// Экспорт отчёта
function exportAnalyticsReport() {
    const report = generateFullReport();
    if (!report) return;
    
    const wsData = [
        ['Отчёт по питанию', `Дата: ${report.generated}`],
        ['Школа', schoolInfo.name || 'Не указана'],
        ['Возрастная категория', schoolInfo.ageCategory || '7-11'],
        [],
        ['Показатель', 'Значение'],
        ['Всего дней', report.totalDays],
        ['Всего блюд', report.totalDishes],
        ['Средняя калорийность (ккал/день)', report.avgCalories],
        ['Средние белки (г/день)', report.avgProteins],
        ['Средние жиры (г/день)', report.avgFats],
        ['Средние углеводы (г/день)', report.avgCarbs],
        ['Нарушений правил', report.violations],
        [],
        ['Самые частые блюда', 'Количество'],
        ...report.mostFrequentDishes.map(([name, count]) => [name, count])
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Отчёт');
    XLSX.writeFile(wb, `report_${new Date().toISOString().slice(0,19)}.xlsx`);
    showStatus('Отчёт экспортирован', 'success');
}

// Инициализация аналитики
function initAnalytics() {
    document.getElementById('generateReportBtn')?.addEventListener('click', () => {
        updateAnalytics();
        showStatus('Отчёт обновлён', 'success');
    });
    document.getElementById('exportReportBtn')?.addEventListener('click', exportAnalyticsReport);
}
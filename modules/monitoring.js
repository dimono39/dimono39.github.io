// ============================
// ШКОЛЬНЫЙ МОНИТОРИНГ
// ============================

let monitoringData = {
    filters: {
        dateFrom: null,
        dateTo: null,
        parallels: [],
        subjects: []
    },
    reports: []
};

// Инициализация вкладки мониторинга
function initMonitoring() {
    // Устанавливаем даты по умолчанию
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(today.getMonth() - 1);
    
    document.getElementById('monitoringDateFrom').value = monthAgo.toISOString().split('T')[0];
    document.getElementById('monitoringDateTo').value = today.toISOString().split('T')[0];
    
    // Обновляем данные при загрузке
    updateMonitoringData();
    
    // Загружаем списки параллелей и предметов
    loadParallelsList();
    loadSubjectsList();
    
    // Инициализируем графики
    initMonitoringCharts();
}

// Обновление данных мониторинга
function updateMonitoringData() {
    monitoringData.filters.dateFrom = document.getElementById('monitoringDateFrom').value;
    monitoringData.filters.dateTo = document.getElementById('monitoringDateTo').value;
    
    // Собираем данные из всех проектов
    collectMonitoringData();
    
    // Обновляем UI
    updateMetricsDashboard();
    updateMonitoringTable();
    updateMonitoringCharts();
}

// Сбор данных для мониторинга
function collectMonitoringData() {
    const allProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    monitoringData.reports = [];
    
    allProjects.forEach(project => {
        // Проверяем фильтры по дате
        const projectDate = project.test?.testDate || project.createdAt;
        if (monitoringData.filters.dateFrom && projectDate < monitoringData.filters.dateFrom) return;
        if (monitoringData.filters.dateTo && projectDate > monitoringData.filters.dateTo) return;
        
        // Проверяем фильтры по параллелям
        const projectParallel = project.test?.class?.match(/\d+/)?.[0] || '';
        if (monitoringData.filters.parallels.length > 0 && 
            !monitoringData.filters.parallels.includes(projectParallel)) return;
        
        // Проверяем фильтры по предметам
        const projectSubject = project.test?.subject || '';
        if (monitoringData.filters.subjects.length > 0 && 
            !monitoringData.filters.subjects.includes(projectSubject)) return;
        
        // Добавляем проект в отчет
        monitoringData.reports.push({
            id: project.id,
            name: project.name,
            subject: project.test?.subject || 'Не указан',
            class: project.test?.class || 'Не указан',
            parallel: projectParallel,
            date: projectDate,
            teacher: project.test?.teacher || 'Не указан',
            totalStudents: project.test?.totalStudents || 0,
            averageScore: calculateAverageScore(project),
            quality: calculateQuality(project),
            performance: calculatePerformance(project)
        });
    });
}

// Расчет средней оценки по проекту
function calculateAverageScore(project) {
    if (!project.results || project.results.length === 0) return 0;
    
    let total = 0;
    let count = 0;
    
    project.results.forEach(result => {
        const scores = Object.values(result.scores || {});
        scores.forEach(score => {
            if (typeof score === 'number') {
                total += score;
                count++;
            }
        });
    });
    
    return count > 0 ? (total / count).toFixed(1) : 0;
}

// Расчет качества знаний (% хороших и отличных оценок)
function calculateQuality(project) {
    if (!project.results || project.results.length === 0) return 0;
    
    let goodCount = 0;
    let totalCount = 0;
    
    project.results.forEach(result => {
        const finalGrade = result.finalGrade || result.grade;
        if (finalGrade >= 4) goodCount++;
        totalCount++;
    });
    
    return totalCount > 0 ? Math.round((goodCount / totalCount) * 100) : 0;
}

// Расчет успеваемости (% неудовлетворительных оценок)
function calculatePerformance(project) {
    if (!project.results || project.results.length === 0) return 100;
    
    let failCount = 0;
    let totalCount = 0;
    
    project.results.forEach(result => {
        const finalGrade = result.finalGrade || result.grade;
        if (finalGrade === 2) failCount++;
        totalCount++;
    });
    
    return totalCount > 0 ? Math.round(((totalCount - failCount) / totalCount) * 100) : 100;
}

// Загрузка списка параллелей
function loadParallelsList() {
    const allProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    const parallelsSet = new Set();
    
    allProjects.forEach(project => {
        const parallel = project.test?.class?.match(/\d+/)?.[0];
        if (parallel) parallelsSet.add(parallel);
    });
    
    const parallels = Array.from(parallelsSet).sort();
    const container = document.getElementById('parallelList');
    container.innerHTML = '';
    
    parallels.forEach(parallel => {
        const label = document.createElement('label');
        label.style.display = 'block';
        label.style.margin = '5px 0';
        label.innerHTML = `
            <input type="checkbox" value="${parallel}" class="parallel-checkbox" checked>
            ${parallel} классы
        `;
        container.appendChild(label);
    });
    
    // Настройка переключения "Все параллели"
    document.getElementById('parallelAll').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.parallel-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
}

// Загрузка списка предметов
function loadSubjectsList() {
    const allProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    const subjectsSet = new Set();
    
    allProjects.forEach(project => {
        const subject = project.test?.subject;
        if (subject) subjectsSet.add(subject);
    });
    
    const subjects = Array.from(subjectsSet).sort();
    const container = document.getElementById('subjectList');
    container.innerHTML = '';
    
    subjects.forEach(subject => {
        const label = document.createElement('label');
        label.style.display = 'block';
        label.style.margin = '5px 0';
        label.innerHTML = `
            <input type="checkbox" value="${subject}" class="subject-checkbox" checked>
            ${subject}
        `;
        container.appendChild(label);
    });
    
    // Настройка переключения "Все предметы"
    document.getElementById('subjectAll').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.subject-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
}

// Применение фильтров
function applyMonitoringFilters() {
    // Собираем выбранные параллели
    const parallelCheckboxes = document.querySelectorAll('.parallel-checkbox:checked');
    monitoringData.filters.parallels = Array.from(parallelCheckboxes).map(cb => cb.value);
    
    // Собираем выбранные предметы
    const subjectCheckboxes = document.querySelectorAll('.subject-checkbox:checked');
    monitoringData.filters.subjects = Array.from(subjectCheckboxes).map(cb => cb.value);
    
    // Обновляем данные
    updateMonitoringData();
    
    showNotification('Фильтры применены', 'success');
}

// Сброс фильтров
function resetMonitoringFilters() {
    document.getElementById('monitoringDateFrom').value = '';
    document.getElementById('monitoringDateTo').value = '';
    
    document.getElementById('parallelAll').checked = true;
    document.querySelectorAll('.parallel-checkbox').forEach(cb => cb.checked = true);
    
    document.getElementById('subjectAll').checked = true;
    document.querySelectorAll('.subject-checkbox').forEach(cb => cb.checked = true);
    
    monitoringData.filters = {
        dateFrom: null,
        dateTo: null,
        parallels: [],
        subjects: []
    };
    
    updateMonitoringData();
    showNotification('Фильтры сброшены', 'info');
}

// Обновление дашборда метрик
function updateMetricsDashboard() {
    if (monitoringData.reports.length === 0) return;
    
    let totalAverage = 0;
    let totalQuality = 0;
    let totalPerformance = 100;
    let totalProjects = monitoringData.reports.length;
    
    monitoringData.reports.forEach(report => {
        totalAverage += parseFloat(report.averageScore) || 0;
        totalQuality += report.quality || 0;
    });
    
    const avgScore = totalProjects > 0 ? (totalAverage / totalProjects).toFixed(1) : 0;
    const avgQuality = totalProjects > 0 ? Math.round(totalQuality / totalProjects) : 0;
    
    // Обновляем значения на странице
    const metricCards = document.querySelectorAll('.metric-value');
    if (metricCards[0]) metricCards[0].textContent = `${avgScore}`;
    if (metricCards[1]) metricCards[1].textContent = `${avgQuality}%`;
    if (metricCards[2]) metricCards[2].textContent = `${totalProjects}`;
    
    // Рассчитываем процент неуспевающих
    let failCount = 0;
    let totalStudents = 0;
    
    monitoringData.reports.forEach(report => {
        const project = JSON.parse(localStorage.getItem('projects') || '[]')
            .find(p => p.id === report.id);
        
        if (project && project.results) {
            totalStudents += project.results.length;
            project.results.forEach(result => {
                const grade = result.finalGrade || result.grade;
                if (grade === 2) failCount++;
            });
        }
    });
    
    const failPercentage = totalStudents > 0 ? ((failCount / totalStudents) * 100).toFixed(1) : 0;
    if (metricCards[3]) metricCards[3].textContent = `${failPercentage}%`;
}

// Инициализация графиков
function initMonitoringCharts() {
    // Уничтожаем старые графики, если они есть
    if (window.parallelChartInstance) window.parallelChartInstance.destroy();
    if (window.subjectChartInstance) window.subjectChartInstance.destroy();
    
    // Создаем контексты для canvas
    const parallelCtx = document.getElementById('parallelChart')?.getContext('2d');
    const subjectCtx = document.getElementById('subjectChart')?.getContext('2d');
    
    if (!parallelCtx || !subjectCtx) return;
    
    // График по параллелям
    window.parallelChartInstance = new Chart(parallelCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Средний балл',
                data: [],
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5
                }
            }
        }
    });
    
    // График по предметам
    window.subjectChartInstance = new Chart(subjectCtx, {
        type: 'horizontalBar',
        data: {
            labels: [],
            datasets: [{
                label: 'Качество знаний, %',
                data: [],
                backgroundColor: '#2ecc71',
                borderColor: '#27ae60',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Обновление графиков
function updateMonitoringCharts() {
    if (!window.parallelChartInstance || !window.subjectChartInstance) return;
    
    // Группируем данные по параллелям
    const parallelData = {};
    monitoringData.reports.forEach(report => {
        if (!parallelData[report.parallel]) {
            parallelData[report.parallel] = {
                totalScore: 0,
                count: 0
            };
        }
        parallelData[report.parallel].totalScore += parseFloat(report.averageScore) || 0;
        parallelData[report.parallel].count++;
    });
    
    // Подготавливаем данные для графика по параллелям
    const parallels = Object.keys(parallelData).sort();
    const parallelScores = parallels.map(p => 
        (parallelData[p].totalScore / parallelData[p].count).toFixed(1)
    );
    
    // Группируем данные по предметам
    const subjectData = {};
    monitoringData.reports.forEach(report => {
        if (!subjectData[report.subject]) {
            subjectData[report.subject] = {
                totalQuality: 0,
                count: 0
            };
        }
        subjectData[report.subject].totalQuality += report.quality || 0;
        subjectData[report.subject].count++;
    });
    
    // Подготавливаем данные для графика по предметам
    const subjects = Object.keys(subjectData).sort();
    const subjectQualities = subjects.map(s => 
        Math.round(subjectData[s].totalQuality / subjectData[s].count)
    );
    
    // Обновляем график по параллелям
    window.parallelChartInstance.data.labels = parallels.map(p => `${p} класс`);
    window.parallelChartInstance.data.datasets[0].data = parallelScores;
    window.parallelChartInstance.update();
    
    // Обновляем график по предметам
    window.subjectChartInstance.data.labels = subjects;
    window.subjectChartInstance.data.datasets[0].data = subjectQualities;
    window.subjectChartInstance.update();
}

// Обновление таблицы мониторинга
function updateMonitoringTable() {
    const container = document.getElementById('monitoringTableContainer');
    if (!container) return;
    
    if (monitoringData.reports.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                <div style="font-size: 3em; margin-bottom: 20px;">📊</div>
                <h4>Нет данных для отображения</h4>
                <p>Измените фильтры или добавьте проекты</p>
            </div>
        `;
        return;
    }
    
    let tableHTML = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                    <tr style="background: #34495e; color: white;">
                        <th style="padding: 12px; text-align: left;">Предмет</th>
                        <th style="padding: 12px; text-align: left;">Класс</th>
                        <th style="padding: 12px; text-align: left;">Учитель</th>
                        <th style="padding: 12px; text-align: left;">Дата</th>
                        <th style="padding: 12px; text-align: left;">Средний балл</th>
                        <th style="padding: 12px; text-align: left;">Качество, %</th>
                        <th style="padding: 12px; text-align: left;">Успев., %</th>
                        <th style="padding: 12px; text-align: left;">Действия</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    monitoringData.reports.forEach((report, index) => {
        const rowClass = index % 2 === 0 ? 'style="background: #f8f9fa;"' : '';
        
        tableHTML += `
            <tr ${rowClass}>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <strong>${report.subject}</strong><br>
                    <small style="color: #7f8c8d;">${report.name}</small>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${report.class}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${report.teacher}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDate(report.date)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <span style="font-weight: bold; color: ${getScoreColor(report.averageScore)};">
                        ${report.averageScore}
                    </span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <span style="font-weight: bold; color: ${getQualityColor(report.quality)};">
                        ${report.quality}%
                    </span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <span style="font-weight: bold; color: ${getPerformanceColor(report.performance)};">
                        ${report.performance}%
                    </span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <button class="btn-icon small" onclick="openProjectReport('${report.id}')" title="Открыть отчет">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon small" onclick="exportProjectReport('${report.id}')" title="Экспорт">
                        <i class="fas fa-download"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
        <div style="padding: 15px; background: #f8f9fa; border-top: 1px solid #eee;">
            <strong>Всего записей:</strong> ${monitoringData.reports.length}
        </div>
    `;
    
    container.innerHTML = tableHTML;
}

// Форматирование даты
function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

// Цвета для оценок
function getScoreColor(score) {
    const numScore = parseFloat(score);
    if (numScore >= 4.5) return '#27ae60';
    if (numScore >= 3.5) return '#3498db';
    if (numScore >= 2.5) return '#f39c12';
    return '#e74c3c';
}

// Цвета для качества знаний
function getQualityColor(quality) {
    if (quality >= 80) return '#27ae60';
    if (quality >= 60) return '#3498db';
    if (quality >= 40) return '#f39c12';
    return '#e74c3c';
}

// Цвета для успеваемости
function getPerformanceColor(performance) {
    if (performance >= 95) return '#27ae60';
    if (performance >= 85) return '#3498db';
    if (performance >= 70) return '#f39c12';
    return '#e74c3c';
}

// ============================
// ФУНКЦИИ ГЕНЕРАЦИИ ОТЧЕТОВ
// ============================

// Отчет по параллелям
function generateParallelReport() {
    if (monitoringData.reports.length === 0) {
        showNotification('Нет данных для отчета', 'warning');
        return;
    }
    
    // Группируем по параллелям
    const parallelGroups = {};
    monitoringData.reports.forEach(report => {
        if (!parallelGroups[report.parallel]) {
            parallelGroups[report.parallel] = [];
        }
        parallelGroups[report.parallel].push(report);
    });
    
    // Формируем отчет
    let reportHTML = `
        <div style="padding: 30px; max-width: 800px; margin: 0 auto;">
            <h1 style="text-align: center; color: #2c3e50; margin-bottom: 30px;">
                Отчет по параллелям
            </h1>
            <p style="text-align: center; color: #7f8c8d; margin-bottom: 40px;">
                Период: ${formatDate(monitoringData.filters.dateFrom)} - ${formatDate(monitoringData.filters.dateTo)}
            </p>
    `;
    
    Object.keys(parallelGroups).sort().forEach(parallel => {
        const reports = parallelGroups[parallel];
        const avgScore = reports.reduce((sum, r) => sum + parseFloat(r.averageScore), 0) / reports.length;
        const avgQuality = reports.reduce((sum, r) => sum + r.quality, 0) / reports.length;
        
        reportHTML += `
            <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                <h3 style="color: #34495e; margin-bottom: 15px;">
                    ${parallel} классы
                </h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #3498db;">${reports.length}</div>
                        <div style="font-size: 0.9em; color: #7f8c8d;">Работ</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #2ecc71;">${avgScore.toFixed(1)}</div>
                        <div style="font-size: 0.9em; color: #7f8c8d;">Средний балл</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #f39c12;">${Math.round(avgQuality)}%</div>
                        <div style="font-size: 0.9em; color: #7f8c8d;">Качество знаний</div>
                    </div>
                </div>
                <div style="font-size: 0.9em; color: #7f8c8d;">
                    Предметы: ${[...new Set(reports.map(r => r.subject))].join(', ')}
                </div>
            </div>
        `;
    });
    
    reportHTML += `</div>`;
    
    // Показываем отчет в модальном окне
    showModal('Отчет по параллелям', reportHTML, {
        large: true,
        showExport: true,
        onExport: () => exportAsPDF('Отчет по параллелям', reportHTML)
    });
}

// Отчет по предметам
function generateSubjectReport() {
    if (monitoringData.reports.length === 0) {
        showNotification('Нет данных для отчета', 'warning');
        return;
    }
    
    // Группируем по предметам
    const subjectGroups = {};
    monitoringData.reports.forEach(report => {
        if (!subjectGroups[report.subject]) {
            subjectGroups[report.subject] = [];
        }
        subjectGroups[report.subject].push(report);
    });
    
    // Формируем отчет
    let reportHTML = `
        <div style="padding: 30px; max-width: 800px; margin: 0 auto;">
            <h1 style="text-align: center; color: #2c3e50; margin-bottom: 30px;">
                Отчет по предметам
            </h1>
            <p style="text-align: center; color: #7f8c8d; margin-bottom: 40px;">
                Период: ${formatDate(monitoringData.filters.dateFrom)} - ${formatDate(monitoringData.filters.dateTo)}
            </p>
    `;
    
    Object.keys(subjectGroups).sort().forEach(subject => {
        const reports = subjectGroups[subject];
        const avgScore = reports.reduce((sum, r) => sum + parseFloat(r.averageScore), 0) / reports.length;
        const avgQuality = reports.reduce((sum, r) => sum + r.quality, 0) / reports.length;
        
        reportHTML += `
            <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                <h3 style="color: #34495e; margin-bottom: 15px;">
                    ${subject}
                </h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #3498db;">${reports.length}</div>
                        <div style="font-size: 0.9em; color: #7f8c8d;">Работ</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #2ecc71;">${avgScore.toFixed(1)}</div>
                        <div style="font-size: 0.9em; color: #7f8c8d;">Средний балл</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #f39c12;">${Math.round(avgQuality)}%</div>
                        <div style="font-size: 0.9em; color: #7f8c8d;">Качество знаний</div>
                    </div>
                </div>
                <div style="font-size: 0.9em; color: #7f8c8d;">
                    Классы: ${[...new Set(reports.map(r => r.class))].join(', ')}
                </div>
            </div>
        `;
    });
    
    reportHTML += `</div>`;
    
    // Показываем отчет в модальном окне
    showModal('Отчет по предметам', reportHTML, {
        large: true,
        showExport: true,
        onExport: () => exportAsPDF('Отчет по предметам', reportHTML)
    });
}

// Мониторинг педагогов
function showTeacherMonitoring() {
    if (monitoringData.reports.length === 0) {
        showNotification('Нет данных для отчета', 'warning');
        return;
    }
    
    // Группируем по учителям
    const teacherGroups = {};
    monitoringData.reports.forEach(report => {
        if (!teacherGroups[report.teacher]) {
            teacherGroups[report.teacher] = [];
        }
        teacherGroups[report.teacher].push(report);
    });
    
    let tableHTML = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                    <tr style="background: #34495e; color: white;">
                        <th style="padding: 12px; text-align: left;">Учитель</th>
                        <th style="padding: 12px; text-align: left;">Предметы</th>
                        <th style="padding: 12px; text-align: left;">Кол-во работ</th>
                        <th style="padding: 12px; text-align: left;">Средний балл</th>
                        <th style="padding: 12px; text-align: left;">Качество, %</th>
                        <th style="padding: 12px; text-align: left;">Успев., %</th>
                        <th style="padding: 12px; text-align: left;">Рейтинг</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    const teacherStats = [];
    Object.keys(teacherGroups).forEach(teacher => {
        const reports = teacherGroups[teacher];
        const avgScore = reports.reduce((sum, r) => sum + parseFloat(r.averageScore), 0) / reports.length;
        const avgQuality = reports.reduce((sum, r) => sum + r.quality, 0) / reports.length;
        const avgPerformance = reports.reduce((sum, r) => sum + r.performance, 0) / reports.length;
        
        teacherStats.push({
            teacher,
            avgScore,
            avgQuality,
            avgPerformance,
            subjectCount: new Set(reports.map(r => r.subject)).size
        });
    });
    
    // Сортируем по рейтингу
    teacherStats.sort((a, b) => {
        const ratingA = (a.avgScore + a.avgQuality + a.avgPerformance) / 3;
        const ratingB = (b.avgScore + b.avgQuality + b.avgPerformance) / 3;
        return ratingB - ratingA;
    });
    
    teacherStats.forEach((stat, index) => {
        const rating = ((stat.avgScore + stat.avgQuality + stat.avgPerformance) / 3).toFixed(1);
        
        tableHTML += `
            <tr style="${index % 2 === 0 ? 'background: #f8f9fa;' : ''}">
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <strong>${stat.teacher}</strong>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${stat.subjectCount}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${teacherGroups[stat.teacher].length}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <span style="font-weight: bold; color: ${getScoreColor(stat.avgScore)};">
                        ${stat.avgScore.toFixed(1)}
                    </span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <span style="font-weight: bold; color: ${getQualityColor(stat.avgQuality)};">
                        ${Math.round(stat.avgQuality)}%
                    </span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <span style="font-weight: bold; color: ${getPerformanceColor(stat.avgPerformance)};">
                        ${Math.round(stat.avgPerformance)}%
                    </span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <span style="font-weight: bold; color: #9b59b6;">${rating}</span>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    showModal('Мониторинг педагогов', tableHTML, {
        large: true,
        showExport: true,
        onExport: () => exportTeacherReportExcel(teacherStats)
    });
}

// Отчет для органов
function generateRegulatoryReport() {
    if (monitoringData.reports.length === 0) {
        showNotification('Нет данных для отчета', 'warning');
        return;
    }
    
    // Формируем структурированный отчет
    let reportHTML = `
        <div style="padding: 30px; max-width: 800px; margin: 0 auto; font-family: 'Times New Roman', serif;">
            <div style="text-align: center; margin-bottom: 40px;">
                <h2 style="margin-bottom: 10px;">Отчет о качестве образования</h2>
                <p style="margin-bottom: 5px;">за период с ${formatDate(monitoringData.filters.dateFrom)} по ${formatDate(monitoringData.filters.dateTo)}</p>
                <hr style="border: 1px solid #333; margin: 20px 0;">
            </div>
            
            <div style="margin-bottom: 30px;">
                <h3>1. Общая характеристика</h3>
                <ul>
                    <li>Общее количество контрольных работ: <strong>${monitoringData.reports.length}</strong></li>
                    <li>Количество задействованных педагогов: <strong>${new Set(monitoringData.reports.map(r => r.teacher)).size}</strong></li>
                    <li>Количество предметов: <strong>${new Set(monitoringData.reports.map(r => r.subject)).size}</strong></li>
                    <li>Количество параллелей: <strong>${new Set(monitoringData.reports.map(r => r.parallel)).size}</strong></li>
                </ul>
            </div>
            
            <div style="margin-bottom: 30px;">
                <h3>2. Основные показатели</h3>
    `;
    
    // Рассчитываем общие показатели
    const totalScore = monitoringData.reports.reduce((sum, r) => sum + parseFloat(r.averageScore), 0);
    const totalQuality = monitoringData.reports.reduce((sum, r) => sum + r.quality, 0);
    const avgScore = (totalScore / monitoringData.reports.length).toFixed(1);
    const avgQuality = Math.round(totalQuality / monitoringData.reports.length);
    
    reportHTML += `
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="background: #f8f9fa;">
                        <td style="padding: 10px; border: 1px solid #ddd;">Средний балл по всем предметам</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><strong>${avgScore}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">Качество знаний (средний показатель)</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><strong>${avgQuality}%</strong></td>
                    </tr>
                </table>
            </div>
            
            <div style="margin-bottom: 30px;">
                <h3>3. Выводы и рекомендации</h3>
                <p>На основе проведенного анализа можно сделать следующие выводы:</p>
                <ul>
                    <li>Система оценки качества образования функционирует стабильно</li>
                    <li>Показатели качества знаний соответствуют установленным требованиям</li>
                    <li>Необходимо продолжить работу по повышению качества образовательных результатов</li>
                </ul>
            </div>
            
            <div style="margin-top: 50px; text-align: right;">
                <p>Директор школы</p>
                <p>_________________</p>
                <p style="font-style: italic;">(ФИО)</p>
            </div>
        </div>
    `;
    
    showModal('Отчет для вышестоящих органов', reportHTML, {
        large: true,
        showExport: true,
        onExport: () => exportRegulatoryReportPDF(reportHTML)
    });
}

// Дашборд качества
function showQualityDashboard() {
    const dashboardHTML = `
        <div style="max-width: 1000px; margin: 0 auto;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">
                        <i class="fas fa-chart-line me-2"></i>Динамика качества
                    </h4>
                    <canvas id="qualityTrendChart" height="150"></canvas>
                </div>
                <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">
                        <i class="fas fa-balance-scale me-2"></i>Сравнение параллелей
                    </h4>
                    <canvas id="parallelComparisonChart" height="150"></canvas>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">
                        <i class="fas fa-exclamation-triangle me-2"></i>Рисковые показатели
                    </h4>
                    <div id="riskIndicators"></div>
                </div>
                <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">
                        <i class="fas fa-trophy me-2"></i>Топ-5 предметов
                    </h4>
                    <div id="topSubjects"></div>
                </div>
            </div>
        </div>
    `;
    
    showModal('Дашборд качества образования', dashboardHTML, {
        large: true,
        onOpen: () => {
            initQualityDashboardCharts();
            updateRiskIndicators();
            updateTopSubjects();
        }
    });
}

// Инициализация графиков дашборда
function initQualityDashboardCharts() {
    // График тренда качества
    const trendCtx = document.getElementById('qualityTrendChart')?.getContext('2d');
    if (trendCtx) {
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май'],
                datasets: [{
                    label: 'Качество знаний, %',
                    data: [75, 78, 82, 85, 88],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    // График сравнения параллелей
    const parallelCtx = document.getElementById('parallelComparisonChart')?.getContext('2d');
    if (parallelCtx) {
        new Chart(parallelCtx, {
            type: 'radar',
            data: {
                labels: ['5 кл', '6 кл', '7 кл', '8 кл', '9 кл', '10 кл', '11 кл'],
                datasets: [{
                    label: 'Качество знаний',
                    data: [82, 85, 78, 88, 76, 90, 92],
                    backgroundColor: 'rgba(46, 204, 113, 0.2)',
                    borderColor: '#2ecc71'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

// Обновление показателей риска
function updateRiskIndicators() {
    const container = document.getElementById('riskIndicators');
    if (!container) return;
    
    container.innerHTML = `
        <div style="margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>Предметы с низким качеством:</span>
                <span style="color: #e74c3c; font-weight: bold;">2</span>
            </div>
            <div class="progress" style="height: 10px; background: #eee; border-radius: 5px;">
                <div style="width: 15%; height: 100%; background: #e74c3c; border-radius: 5px;"></div>
            </div>
        </div>
        
        <div style="margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>Педагоги с низким рейтингом:</span>
                <span style="color: #f39c12; font-weight: bold;">3</span>
            </div>
            <div class="progress" style="height: 10px; background: #eee; border-radius: 5px;">
                <div style="width: 20%; height: 100%; background: #f39c12; border-radius: 5px;"></div>
            </div>
        </div>
        
        <div style="margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>Классы требующие внимания:</span>
                <span style="color: #3498db; font-weight: bold;">4</span>
            </div>
            <div class="progress" style="height: 10px; background: #eee; border-radius: 5px;">
                <div style="width: 25%; height: 100%; background: #3498db; border-radius: 5px;"></div>
            </div>
        </div>
    `;
}

// Обновление топ-5 предметов
function updateTopSubjects() {
    const container = document.getElementById('topSubjects');
    if (!container) return;
    
    container.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
            <div style="width: 30px; height: 30px; background: #f1c40f; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">1</div>
            <div style="flex: 1;">
                <div style="font-weight: bold;">Математика</div>
                <div style="font-size: 12px; color: #7f8c8d;">Качество: 92%</div>
            </div>
            <div style="font-weight: bold; color: #2ecc71;">4.8</div>
        </div>
        
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
            <div style="width: 30px; height: 30px; background: #95a5a6; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">2</div>
            <div style="flex: 1;">
                <div style="font-weight: bold;">Физика</div>
                <div style="font-size: 12px; color: #7f8c8d;">Качество: 89%</div>
            </div>
            <div style="font-weight: bold; color: #2ecc71;">4.6</div>
        </div>
        
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
            <div style="width: 30px; height: 30px; background: #e67e22; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">3</div>
            <div style="flex: 1;">
                <div style="font-weight: bold;">Русский язык</div>
                <div style="font-size: 12px; color: #7f8c8d;">Качество: 88%</div>
            </div>
            <div style="font-weight: bold; color: #2ecc71;">4.5</div>
        </div>
        
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
            <div style="width: 30px; height: 30px; background: #7f8c8d; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">4</div>
            <div style="flex: 1;">
                <div style="font-weight: bold;">История</div>
                <div style="font-size: 12px; color: #7f8c8d;">Качество: 87%</div>
            </div>
            <div style="font-weight: bold; color: #2ecc71;">4.4</div>
        </div>
        
        <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
            <div style="width: 30px; height: 30px; background: #95a5a6; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">5</div>
            <div style="flex: 1;">
                <div style="font-weight: bold;">Химия</div>
                <div style="font-size: 12px; color: #7f8c8d;">Качество: 86%</div>
            </div>
            <div style="font-weight: bold; color: #2ecc71;">4.3</div>
        </div>
    `;
}

// ============================
// ФУНКЦИИ ЭКСПОРТА
// ============================

// Экспорт Excel по параллелям
function exportParallelExcel() {
    const data = monitoringData.reports.map(report => ({
        'Предмет': report.subject,
        'Класс': report.class,
        'Учитель': report.teacher,
        'Дата': formatDate(report.date),
        'Средний балл': report.averageScore,
        'Качество знаний %': report.quality,
        'Успеваемость %': report.performance
    }));
    
    exportToExcel(data, `Отчет_по_параллелям_${new Date().toISOString().slice(0,10)}`);
    showNotification('Отчет экспортирован в Excel', 'success');
}

// Экспорт PDF по предметам
function exportSubjectPDF() {
    // Используем существующую функцию экспорта PDF
    const content = document.getElementById('modalContent').innerHTML;
    exportAsPDF('Отчет_по_предметам', content);
}

// Экспорт отчета по педагогам в Excel
function exportTeacherReportExcel(teacherStats) {
    const data = teacherStats.map((stat, index) => ({
        'Место': index + 1,
        'Учитель': stat.teacher,
        'Предметов': stat.subjectCount,
        'Средний балл': stat.avgScore.toFixed(1),
        'Качество знаний %': Math.round(stat.avgQuality),
        'Успеваемость %': Math.round(stat.avgPerformance),
        'Рейтинг': ((stat.avgScore + stat.avgQuality + stat.avgPerformance) / 3).toFixed(1)
    }));
    
    exportToExcel(data, `Рейтинг_педагогов_${new Date().toISOString().slice(0,10)}`);
    showNotification('Рейтинг педагогов экспортирован', 'success');
}

// Экспорт данных для органов в PDF
function exportRegulatoryReportPDF(content) {
    exportAsPDF('Отчет_для_органов', content);
}

// Экспорт в Excel
function exportToExcel(data, filename) {
    // Используем библиотеку XLSX
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Отчет");
    
    XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Экспорт в PDF
function exportAsPDF(title, content) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Добавляем заголовок
    doc.setFontSize(16);
    doc.text(title, 105, 20, { align: 'center' });
    
    // Добавляем дату
    doc.setFontSize(10);
    doc.text(`Сформировано: ${new Date().toLocaleDateString('ru-RU')}`, 105, 30, { align: 'center' });
    
    // Добавляем содержание
    doc.setFontSize(12);
    const splitContent = doc.splitTextToSize(stripHTML(content), 180);
    doc.text(splitContent, 15, 45);
    
    // Сохраняем
    doc.save(`${title}_${new Date().toISOString().slice(0,10)}.pdf`);
}

// Удаление HTML-тегов
function stripHTML(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

// Открытие отчета проекта
function openProjectReport(projectId) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find(p => p.id === projectId);
    
    if (project) {
        // Переходим в соответствующий проект
        loadProject(projectId);
        showTab('analytics');
        showNotification('Проект загружен', 'success');
    } else {
        showNotification('Проект не найден', 'error');
    }
}

// Экспорт отчета проекта
function exportProjectReport(projectId) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find(p => p.id === projectId);
    
    if (project && window.generateReportPreview) {
        loadProject(projectId);
        showTab('reports');
        
        // Даем время на загрузку, затем открываем экспорт
        setTimeout(() => {
            const exportBtn = document.querySelector('.report-preview .export-buttons button');
            if (exportBtn) {
                exportBtn.click();
            }
        }, 500);
    }
}

// ============================
// ИНИЦИАЛИЗАЦИЯ И ПОКАЗ ВКЛАДКИ
// ============================

// Функция для показа вкладки мониторинга
function showMonitoringTab() {
    initMonitoring();
}

// Добавляем обработчик загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    // Находим кнопку вкладки мониторинга и добавляем обработчик
    const monitoringBtn = document.querySelector('.tab-btn[onclick*="monitoring"]');
    if (monitoringBtn) {
        monitoringBtn.addEventListener('click', function() {
            // Даем время на анимацию переключения вкладок
            setTimeout(initMonitoring, 100);
        });
    }
});

// Функция для добавления тестовых данных (для демонстрации)
function addTestMonitoringData() {
    const testProjects = [
        {
            id: 'test1',
            name: 'Контрольная по математике',
            test: {
                subject: 'Математика',
                class: '5А',
                testDate: '2024-03-15',
                teacher: 'Иванова А.П.'
            },
            results: [
                { studentId: '1', finalGrade: 5 },
                { studentId: '2', finalGrade: 4 },
                { studentId: '3', finalGrade: 3 }
            ]
        },
        {
            id: 'test2',
            name: 'Диктант по русскому языку',
            test: {
                subject: 'Русский язык',
                class: '6Б',
                testDate: '2024-03-18',
                teacher: 'Петрова С.И.'
            },
            results: [
                { studentId: '4', finalGrade: 4 },
                { studentId: '5', finalGrade: 3 },
                { studentId: '6', finalGrade: 5 }
            ]
        }
    ];
    
    // Сохраняем тестовые данные
    localStorage.setItem('test_monitoring_projects', JSON.stringify(testProjects));
    showNotification('Тестовые данные добавлены', 'info');
}
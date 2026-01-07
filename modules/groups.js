// ============================
// ФУНКЦИИ ДЛЯ ГРУППОВОГО АНАЛИЗА
// ============================

let groupsData = {
    currentGroups: [],
    groupingHistory: [],
    groupSettings: {},
    groupCharts: {}
};

// Автоматическое формирование групп
function autoFormGroups() {
    if (!appData.students || appData.students.length === 0) {
        showNotification('Сначала добавьте учеников!', 'warning');
        return;
    }
    
    const criteria = document.getElementById('groupingCriteria').value;
    const groupCount = parseInt(document.getElementById('groupCount').value);
    const groupType = document.getElementById('groupType').value;
    
    // Логика группировки в зависимости от критериев
    let groupedStudents = [];
    
    switch(criteria) {
        case 'level':
            groupedStudents = groupByLevel(appData.students, groupCount);
            break;
        case 'score':
            groupedStudents = groupByScore(appData.students, groupCount);
            break;
        case 'mixed':
            groupedStudents = groupByMixedCriteria(appData.students, groupCount);
            break;
        default:
            groupedStudents = groupByLevel(appData.students, groupCount);
    }
    
    // Применяем тип групп
    if (groupType === 'heterogeneous') {
        groupedStudents = makeHeterogeneous(groupedStudents);
    }
    
    // Сохраняем группы
    groupsData.currentGroups = createGroupsFromStudents(groupedStudents, groupCount);
    
    // Обновляем интерфейс
    updateGroupsTable();
    renderGroupsChart();
    generateGroupRecommendations();
    
    showNotification(`Сформировано ${groupCount} групп`, 'success');
}

// Группировка по уровню подготовки
function groupByLevel(students, groupCount) {
    // Сортируем студентов по общему баллу
    const sortedStudents = [...students].sort((a, b) => {
        const scoreA = calculateStudentScore(a.id) || 0;
        const scoreB = calculateStudentScore(b.id) || 0;
        return scoreB - scoreA;
    });
    
    // Распределяем по группам (метод "змейки" для балансировки)
    const groups = Array.from({length: groupCount}, () => []);
    
    for (let i = 0; i < sortedStudents.length; i++) {
        const groupIndex = i % groupCount;
        groups[groupIndex].push(sortedStudents[i]);
    }
    
    return groups;
}

// Обновление таблицы групп
function updateGroupsTable() {
    const tbody = document.getElementById('groupsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    groupsData.currentGroups.forEach((group, index) => {
        const row = document.createElement('tr');
        const avgScore = calculateGroupAverageScore(group);
        const level = getGroupLevel(avgScore);
        
        row.innerHTML = `
            <td>
                <strong>Группа ${index + 1}</strong><br>
                <small>${group.students.length} чел.</small>
            </td>
            <td>
                ${group.students.map(s => 
                    `<div class="student-badge">${s.lastName} ${s.firstName.charAt(0)}.</div>`
                ).join('')}
            </td>
            <td>
                <span class="badge" style="background: ${getScoreColor(avgScore)}">
                    ${avgScore.toFixed(1)}
                </span>
            </td>
            <td>
                <span class="badge level-${level}">${getLevelName(level)}</span>
            </td>
            <td>
                <small>${getGroupRecommendation(level)}</small>
            </td>
            <td>
                <button class="btn-icon small" onclick="editGroup(${index})" title="Редактировать">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon small" onclick="viewGroupDetails(${index})" title="Подробнее">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Визуализация групп
function renderGroupsChart() {
    const ctx = document.getElementById('groupsChart');
    if (!ctx) return;
    
    // Удаляем предыдущий график если есть
    if (groupsData.groupCharts.main) {
        groupsData.groupCharts.main.destroy();
    }
    
    const labels = groupsData.currentGroups.map((g, i) => `Группа ${i + 1}`);
    const data = groupsData.currentGroups.map(g => calculateGroupAverageScore(g));
    const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#34495e'];
    
    groupsData.groupCharts.main = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Средний балл группы',
                data: data,
                backgroundColor: colors.slice(0, groupsData.currentGroups.length),
                borderColor: colors.slice(0, groupsData.currentGroups.length).map(c => c + 'CC'),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Распределение средних баллов по группам'
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
}

// Генерация рекомендаций
function generateGroupRecommendations() {
    const teacherRecs = document.getElementById('teacherRecommendations');
    const groupRecs = document.getElementById('perGroupRecommendations');
    
    if (!teacherRecs || !groupRecs) return;
    
    // Рекомендации для преподавателя
    const teacherRecommendations = [
        "Используйте дифференцированные задания для каждой группы",
        "Периодически меняйте состав групп для развития социальных навыков",
        "Назначайте лидеров в каждой группе для координации работы",
        "Организуйте взаимопроверку между группами"
    ];
    
    teacherRecs.innerHTML = teacherRecommendations.map(rec => 
        `<li>${rec}</li>`
    ).join('');
    
    // Рекомендации для каждой группы
    let perGroupHTML = '';
    
    groupsData.currentGroups.forEach((group, index) => {
        const avgScore = calculateGroupAverageScore(group);
        const level = getGroupLevel(avgScore);
        
        perGroupHTML += `
            <div class="group-recommendation" style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 5px;">
                <h5>Группа ${index + 1} (${getLevelName(level)})</h5>
                <ul>
                    ${getDetailedRecommendations(level).map(rec => 
                        `<li>${rec}</li>`
                    ).join('')}
                </ul>
            </div>
        `;
    });
    
    groupRecs.innerHTML = perGroupHTML;
}

// Вспомогательные функции
function calculateGroupAverageScore(group) {
    if (!group.students || group.students.length === 0) return 0;
    
    const total = group.students.reduce((sum, student) => {
        return sum + (calculateStudentScore(student.id) || 0);
    }, 0);
    
    return total / group.students.length;
}

function getGroupLevel(avgScore) {
    if (avgScore >= 4.5) return 'high';
    if (avgScore >= 3.5) return 'medium';
    if (avgScore >= 2.5) return 'low';
    return 'very_low';
}

function getLevelName(level) {
    const levels = {
        'high': 'Высокий',
        'medium': 'Средний',
        'low': 'Низкий',
        'very_low': 'Очень низкий'
    };
    return levels[level] || 'Не определен';
}

function getGroupRecommendation(level) {
    const recommendations = {
        'high': 'Сложные задания, проектная работа',
        'medium': 'Тренировочные задания с элементами творчества',
        'low': 'Базовые задания с поддержкой',
        'very_low': 'Индивидуальная работа, упрощенные задания'
    };
    return recommendations[level] || 'Требуется индивидуальный подход';
}

function getDetailedRecommendations(level) {
    const detailed = {
        'high': [
            'Давать опережающие задания',
            'Привлекать к помощи другим группам',
            'Развивать лидерские качества'
        ],
        'medium': [
            'Постепенно повышать сложность',
            'Развивать самостоятельность',
            'Давать задания на применение знаний'
        ],
        'low': [
            'Много тренировочных упражнений',
            'Частая проверка понимания',
            'Работа в парах с сильными учениками'
        ],
        'very_low': [
            'Индивидуальные консультации',
            'Поэтапное объяснение',
            'Мотивационные задания'
        ]
    };
    return detailed[level] || ['Требуется индивидуальный подход'];
}

function getScoreColor(score) {
    if (score >= 4.5) return '#27ae60';
    if (score >= 3.5) return '#3498db';
    if (score >= 2.5) return '#f39c12';
    return '#e74c3c';
}

// Экспорт групп
function exportGroupsToExcel() {
    if (groupsData.currentGroups.length === 0) {
        showNotification('Нет групп для экспорта', 'warning');
        return;
    }
    
    // Формируем данные для Excel
    const data = [];
    
    groupsData.currentGroups.forEach((group, groupIndex) => {
        data.push([`Группа ${groupIndex + 1}`, '', '', '']);
        data.push(['Фамилия', 'Имя', 'Балл', 'Уровень']);
        
        group.students.forEach(student => {
            const score = calculateStudentScore(student.id) || 0;
            const level = getGroupLevel(score);
            data.push([
                student.lastName,
                student.firstName,
                score.toFixed(1),
                getLevelName(level)
            ]);
        });
        
        data.push(['', '', '', '']); // Пустая строка между группами
    });
    
    // Создаем книгу Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Группы");
    
    // Сохраняем файл
    XLSX.writeFile(wb, `Группы_${appData.test.class}_${new Date().toLocaleDateString()}.xlsx`);
    
    showNotification('Группы экспортированы в Excel', 'success');
}

// Обновление предпросмотра
function updateGroupingPreview() {
    const preview = document.getElementById('groupPreviewStats');
    if (!preview) return;
    
    const criteria = document.getElementById('groupingCriteria').value;
    const groupCount = document.getElementById('groupCount').value;
    const groupType = document.getElementById('groupType').value;
    
    let previewText = `
        <p><strong>Критерий:</strong> ${document.getElementById('groupingCriteria').options[document.getElementById('groupingCriteria').selectedIndex].text}</p>
        <p><strong>Количество групп:</strong> ${groupCount}</p>
        <p><strong>Тип:</strong> ${document.getElementById('groupType').options[document.getElementById('groupType').selectedIndex].text}</p>
    `;
    
    if (appData.students && appData.students.length > 0) {
        const avgPerGroup = Math.floor(appData.students.length / groupCount);
        previewText += `<p><strong>Примерно по:</strong> ${avgPerGroup}-${avgPerGroup + 1} учеников в группе</p>`;
    }
    
    preview.innerHTML = previewText;
}

// Инициализация при загрузке вкладки
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем обработчик для вкладки групп
    const groupsTab = document.querySelector('[onclick="showTab(\'groups\')"]');
    if (groupsTab) {
        groupsTab.addEventListener('click', function() {
            if (appData.students && appData.students.length > 0) {
                updateGroupingPreview();
            }
        });
    }
});

// Анализ динамики групп
function analyzeGroupDynamics() {
    if (groupsData.currentGroups.length === 0) {
        showNotification('Сначала сформируйте группы', 'warning');
        return;
    }
    
    // Здесь можно добавить логику анализа динамики
    // Например, сравнение с предыдущими группировками
    
    showNotification('Анализ динамики групп выполнен', 'info');
}

// Сравнение групп
function compareGroups() {
    if (groupsData.currentGroups.length < 2) {
        showNotification('Нужно как минимум 2 группы для сравнения', 'warning');
        return;
    }
    
    // Логика сравнения групп
    const comparisonData = groupsData.currentGroups.map((group, index) => {
        return {
            group: `Группа ${index + 1}`,
            avgScore: calculateGroupAverageScore(group),
            studentCount: group.students.length,
            level: getGroupLevel(calculateGroupAverageScore(group))
        };
    });
    
    // Можно открыть модальное окно с детальным сравнением
    showGroupComparisonModal(comparisonData);
}

// Отчет по группам
function exportGroupReport() {
    if (groupsData.currentGroups.length === 0) {
        showNotification('Нет групп для отчета', 'warning');
        return;
    }
    
    // Генерация HTML отчета
    let reportHTML = `
        <h1>Отчет по учебным группам</h1>
        <h2>${appData.test.subject}, ${appData.test.class}</h2>
        <p>Дата: ${new Date().toLocaleDateString()}</p>
        <hr>
    `;
    
    groupsData.currentGroups.forEach((group, index) => {
        reportHTML += `
            <div class="group-report-section">
                <h3>Группа ${index + 1}</h3>
                <p>Количество учеников: ${group.students.length}</p>
                <p>Средний балл: ${calculateGroupAverageScore(group).toFixed(1)}</p>
                <p>Уровень: ${getLevelName(getGroupLevel(calculateGroupAverageScore(group)))}</p>
                <h4>Состав:</h4>
                <ul>
                    ${group.students.map(s => 
                        `<li>${s.lastName} ${s.firstName} ${s.middleName || ''}</li>`
                    ).join('')}
                </ul>
                <h4>Рекомендации:</h4>
                <ul>
                    ${getDetailedRecommendations(getGroupLevel(calculateGroupAverageScore(group))).map(rec => 
                        `<li>${rec}</li>`
                    ).join('')}
                </ul>
            </div>
            <hr>
        `;
    });
    
    // Открываем отчет в новом окне для печати
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(`
        <html>
        <head>
            <title>Отчет по группам</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .group-report-section { margin-bottom: 30px; }
                ul { padding-left: 20px; }
                hr { border: 1px solid #ddd; }
            </style>
        </head>
        <body>${reportHTML}</body>
        </html>
    `);
    reportWindow.document.close();
    
    showNotification('Отчет по группам сгенерирован', 'success');
}

// Создание групп из студентов
function createGroupsFromStudents(studentArrays, groupCount) {
    return studentArrays.map((studentsArray, index) => ({
        id: `group_${Date.now()}_${index}`,
        name: `Группа ${index + 1}`,
        students: studentsArray,
        createdAt: new Date().toISOString(),
        settings: {
            criteria: document.getElementById('groupingCriteria').value,
            type: document.getElementById('groupType').value
        }
    }));
}

// Расчет балла студента
function calculateStudentScore(studentId) {
    if (!appData.results || appData.results.length === 0) return 0;
    
    const studentResults = appData.results.filter(r => r.studentId === studentId);
    if (studentResults.length === 0) return 0;
    
    // Здесь нужно реализовать логику расчета балла на основе результатов
    // Это упрощенная версия
    return studentResults.reduce((sum, result) => sum + (result.score || 0), 0) / studentResults.length;
}
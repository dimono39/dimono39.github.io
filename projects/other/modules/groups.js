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

// ============================================
// МОДУЛЬ ГРУППОВОГО АНАЛИЗА
// ============================================

// Глобальные данные групп
window.groupsData = {
    currentGroups: [],
    groupingHistory: [],
    groupSettings: {},
    groupCharts: {},
    previousGroupings: [],
    groupAssignments: {}
};

// Класс Группы
class StudentGroup {
    constructor(name, id = null) {
        this.id = id || `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.name = name;
        this.students = [];
        this.settings = {
            criteria: 'level',
            type: 'homogeneous',
            balance: 'equal_size',
            color: this.getRandomColor()
        };
        this.metrics = {
            avgScore: 0,
            avgComplexity: 0,
            errorRate: 0,
            progressRate: 0,
            cohesion: 0
        };
        this.recommendations = [];
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    getRandomColor() {
        const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    addStudent(student) {
        if (!this.students.find(s => s.id === student.id)) {
            this.students.push({
                ...student,
                addedAt: new Date().toISOString()
            });
            this.updateMetrics();
            return true;
        }
        return false;
    }

    removeStudent(studentId) {
        const index = this.students.findIndex(s => s.id === studentId);
        if (index !== -1) {
            this.students.splice(index, 1);
            this.updateMetrics();
            return true;
        }
        return false;
    }

    updateMetrics() {
        if (this.students.length === 0) {
            this.metrics = {
                avgScore: 0,
                avgComplexity: 0,
                errorRate: 0,
                progressRate: 0,
                cohesion: 0
            };
            return;
        }

        // Рассчитываем средний балл
        const scores = this.students.map(s => {
            const score = calculateStudentScore(s.id);
            return score !== null ? score : 0;
        }).filter(s => s > 0);

        this.metrics.avgScore = scores.length > 0 ?
            scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        // Рассчитываем среднюю сложность
        this.metrics.avgComplexity = this.calculateAverageComplexity();

        // Рассчитываем уровень ошибок
        this.metrics.errorRate = this.calculateErrorRate();

        // Рассчитываем сплоченность группы (условно)
        this.metrics.cohesion = this.calculateCohesion();

        this.updatedAt = new Date().toISOString();
    }

    calculateAverageComplexity() {
        // Здесь можно добавить логику расчета средней сложности
        // на основе выполненных заданий студентов
        return this.students.length > 0 ?
        this.students.reduce((sum, student) => {
            const complexity = getStudentComplexityLevel(student.id);
            return sum + complexity;
        }, 0) / this.students.length : 0;
    }

    calculateErrorRate() {
        // Рассчитываем процент ошибок в группе
        const totalTasks = this.students.length * 10; // условно 10 заданий на студента
        if (totalTasks === 0)
            return 0;

        const errorCount = this.students.reduce((count, student) => {
            return count + (getStudentErrorCount(student.id) || 0);
        }, 0);

        return (errorCount / totalTasks) * 100;
    }

    calculateCohesion() {
        // Простая оценка сплоченности на основе разнообразия баллов
        const scores = this.students.map(s => calculateStudentScore(s.id) || 0);
        if (scores.length < 2)
            return 0;

        const avg = scores.reduce((a, b) => a + b) / scores.length;
        const variance = scores.reduce((sum, score) => {
            return sum + Math.pow(score - avg, 2);
        }, 0) / scores.length;

        // Чем меньше дисперсия, тем выше сплоченность
        return Math.max(0, 100 - (variance * 20));
    }

    generateRecommendations() {
        const level = getGroupLevel(this.metrics.avgScore);
        const recommendations = {
            high: [
                "Использовать проектное обучение",
                "Давать задания повышенной сложности",
                "Развивать лидерские качества",
                "Привлекать к помощи другим группам"
            ],
            medium: [
                "Практиковать групповые дискуссии",
                "Использовать взаимопроверку",
                "Развивать самостоятельность",
                "Постепенно повышать сложность заданий"
            ],
            low: [
                "Частая поддержка и обратная связь",
                "Использовать наглядные материалы",
                "Работа в парах с сильными учениками",
                "Много тренировочных упражнений"
            ],
            very_low: [
                "Индивидуальные консультации",
                "Упрощенные задания с пошаговыми инструкциями",
                "Работа под постоянным контролем",
                "Мотивационные задания"
            ]
        };

        this.recommendations = recommendations[level] || ["Требуется индивидуальный подход"];
        return this.recommendations;
    }
}

// ============================
// ОСНОВНЫЕ ФУНКЦИИ
// ============================

// Автоматическое формирование групп
function autoFormGroups() {
    if (!window.appData || !window.appData.students || window.appData.students.length === 0) {
        showNotification('Сначала добавьте учеников!', 'warning');
        return;
    }

    const criteria = document.getElementById('groupingCriteria')?.value || 'level';
    const groupCount = parseInt(document.getElementById('groupCount')?.value || 3);
    const groupType = document.getElementById('groupType')?.value || 'homogeneous';
    const balance = document.getElementById('groupBalance')?.value || 'equal_size';

    // Сбрасываем текущие группы
    groupsData.currentGroups = [];

    // Создаем группы
    for (let i = 0; i < groupCount; i++) {
        const group = new StudentGroup(`Группа ${i + 1}`);
        group.settings = {
            criteria,
            type: groupType,
            balance,
            color: group.getRandomColor()
        };
        groupsData.currentGroups.push(group);
    }

    // Распределяем студентов
    distributeStudents(criteria, groupType, balance);

    // Обновляем интерфейс
    updateGroupsTable();
    renderGroupsChart();
    generateGroupRecommendations();
    updateGroupPreview();

    showNotification(`Сформировано ${groupCount} групп по критерию: ${getCriteriaName(criteria)}`, 'success');

    // Сохраняем в историю
    saveToGroupingHistory();
}

// Распределение студентов по группам
function distributeStudents(criteria, groupType, balance) {
    const students = [...window.appData.students];

    switch (criteria) {
    case 'level':
        distributeByLevel(students, groupType);
        break;
    case 'score':
        distributeByScore(students, groupType);
        break;
    case 'taxonomy':
        distributeByTaxonomy(students);
        break;
    case 'errors':
        distributeByErrors(students);
        break;
    case 'mixed':
        distributeByMixedCriteria(students);
        break;
    default:
        distributeByLevel(students, groupType);
    }

    // Применяем балансировку
    applyBalance(balance);
}

// Распределение по уровню
function distributeByLevel(students, groupType) {
    // Сортируем студентов по баллам
    const sortedStudents = students.sort((a, b) => {
        const scoreA = calculateStudentScore(a.id) || 0;
        const scoreB = calculateStudentScore(b.id) || 0;
        return groupType === 'homogeneous' ? scoreB - scoreA : scoreA - scoreB;
    });

    // Распределяем методом змейки
    for (let i = 0; i < sortedStudents.length; i++) {
        const groupIndex = i % groupsData.currentGroups.length;
        groupsData.currentGroups[groupIndex].addStudent(sortedStudents[i]);
    }
}

// Распределение по баллам
function distributeByScore(students) {
    // Группируем по диапазонам баллов
    const scoreRanges = {
        high: {
            min: 4,
            max: 5
        },
        medium: {
            min: 3,
            max: 4
        },
        low: {
            min: 0,
            max: 3
        }
    };

    const groupedByScore = {
        high: students.filter(s => {
            const score = calculateStudentScore(s.id) || 0;
            return score >= scoreRanges.high.min && score <= scoreRanges.high.max;
        }),
        medium: students.filter(s => {
            const score = calculateStudentScore(s.id) || 0;
            return score >= scoreRanges.medium.min && score < scoreRanges.medium.max;
        }),
        low: students.filter(s => {
            const score = calculateStudentScore(s.id) || 0;
            return score >= scoreRanges.low.min && score < scoreRanges.low.max;
        })
    };

    // Распределяем для разнородных групп
    let groupIndex = 0;
    ['high', 'medium', 'low'].forEach(level => {
        groupedByScore[level].forEach(student => {
            groupsData.currentGroups[groupIndex].addStudent(student);
            groupIndex = (groupIndex + 1) % groupsData.currentGroups.length;
        });
    });
}

// Распределение по таксономии
function distributeByTaxonomy(students) {
    // Анализируем сильные стороны студентов по таксономическим уровням
    students.forEach(student => {
        const taxonomyProfile = analyzeStudentTaxonomy(student.id);

        // Находим группу, которой не хватает этого навыка
        const groupIndex = findGroupWithWeakness(taxonomyProfile);
        if (groupIndex !== -1) {
            groupsData.currentGroups[groupIndex].addStudent(student);
        } else {
            // Распределяем равномерно
            const smallestGroup = groupsData.currentGroups.reduce((smallest, group, index) => {
                return group.students.length < smallest.size ? {
                    size: group.students.length,
                    index
                }
                 : smallest;
            }, {
                size: Infinity,
                index: 0
            });

            groupsData.currentGroups[smallestGroup.index].addStudent(student);
        }
    });
}

// Распределение по ошибкам
function distributeByErrors(students) {
    // Группируем студентов по типам ошибок
    const errorTypes = ['factual', 'conceptual', 'application', 'calculation'];

    errorTypes.forEach(errorType => {
        const studentsWithError = students.filter(student => {
            const errors = getStudentErrors(student.id);
            return errors && errors.some(e => e.type === errorType);
        });

        // Распределяем студентов с одинаковыми ошибками по разным группам
        studentsWithError.forEach((student, index) => {
            const groupIndex = index % groupsData.currentGroups.length;
            groupsData.currentGroups[groupIndex].addStudent(student);
        });
    });

    // Оставшихся студентов распределяем равномерно
    const remainingStudents = students.filter(s =>
            !groupsData.currentGroups.some(g => g.students.find(gs => gs.id === s.id)));

    remainingStudents.forEach((student, index) => {
        const groupIndex = index % groupsData.currentGroups.length;
        groupsData.currentGroups[groupIndex].addStudent(student);
    });
}

// Распределение по смешанным критериям
function distributeByMixedCriteria(students) {
    // Используем комбинацию критериев
    students.forEach(student => {
        const criteriaScores = {
            level: calculateStudentScore(student.id) || 0,
            taxonomy: analyzeStudentTaxonomyScore(student.id),
            errors: getStudentErrorCount(student.id) || 0
        };

        // Находим группу с наименьшим сходством (для разнородности)
        let bestGroupIndex = 0;
        let maxDifference = -1;

        groupsData.currentGroups.forEach((group, index) => {
            const groupAvgScore = group.metrics.avgScore || 0;
            const difference = Math.abs(criteriaScores.level - groupAvgScore);

            if (difference > maxDifference) {
                maxDifference = difference;
                bestGroupIndex = index;
            }
        });

        groupsData.currentGroups[bestGroupIndex].addStudent(student);
    });
}

// Применение балансировки
function applyBalance(balanceType) {
    switch (balanceType) {
    case 'equal_size':
        balanceGroupSizes();
        break;
    case 'equal_level':
        balanceGroupLevels();
        break;
    case 'mixed_ability':
        ensureMixedAbilities();
        break;
    case 'leader_each':
        ensureLeaderInEachGroup();
        break;
    }
}

// Балансировка размеров групп
function balanceGroupSizes() {
    const allStudents = [];

    // Собираем всех студентов
    groupsData.currentGroups.forEach(group => {
        allStudents.push(...group.students);
        group.students = [];
    });

    // Перераспределяем равномерно
    allStudents.forEach((student, index) => {
        const groupIndex = index % groupsData.currentGroups.length;
        groupsData.currentGroups[groupIndex].addStudent(student);
    });
}

// Балансировка уровней
function balanceGroupLevels() {
    // Перераспределяем студентов для выравнивания средних баллов
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
        // Находим группы с самым высоким и низким средним баллом
        let highestGroup = null;
        let lowestGroup = null;
        let maxDiff = 0;

        for (let j = 0; j < groupsData.currentGroups.length; j++) {
            for (let k = j + 1; k < groupsData.currentGroups.length; k++) {
                const diff = Math.abs(
                        groupsData.currentGroups[j].metrics.avgScore -
                        groupsData.currentGroups[k].metrics.avgScore);

                if (diff > maxDiff) {
                    maxDiff = diff;
                    highestGroup = groupsData.currentGroups[j].metrics.avgScore >
                        groupsData.currentGroups[k].metrics.avgScore ? j : k;
                    lowestGroup = groupsData.currentGroups[j].metrics.avgScore >
                        groupsData.currentGroups[k].metrics.avgScore ? k : j;
                }
            }
        }

        if (highestGroup !== null && lowestGroup !== null && maxDiff > 0.5) {
            // Перемещаем студента из высокой группы в низкую
            const studentToMove = findStudentToMove(
                    groupsData.currentGroups[highestGroup],
                    groupsData.currentGroups[lowestGroup]);

            if (studentToMove) {
                groupsData.currentGroups[highestGroup].removeStudent(studentToMove.id);
                groupsData.currentGroups[lowestGroup].addStudent(studentToMove);
            }
        }
    }
}

// ============================
// ИНТЕРФЕЙСНЫЕ ФУНКЦИИ
// ============================

// Обновление таблицы групп
function updateGroupsTable() {
    const tbody = document.getElementById('groupsTableBody');
    if (!tbody)
        return;

    tbody.innerHTML = '';

    groupsData.currentGroups.forEach((group, index) => {
        const row = document.createElement('tr');
        const level = getGroupLevel(group.metrics.avgScore);

        row.innerHTML = `
            <td style="vertical-align: top;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 12px; height: 12px; background: ${group.settings.color}; border-radius: 50%;"></div>
                    <strong>${group.name}</strong>
                </div>
                <small style="display: block; margin-top: 5px;">
                    ${group.students.length} чел. | 
                    ${getCriteriaName(group.settings.criteria)} | 
                    ${getGroupTypeName(group.settings.type)}
                </small>
            </td>
            <td style="vertical-align: top;">
                <div style="max-height: 120px; overflow-y: auto; padding-right: 5px;">
                    ${group.students.map(s => `
                        <div class="student-badge" style="
                            display: inline-flex;
                            align-items: center;
                            gap: 5px;
                            padding: 4px 8px;
                            margin: 2px;
                            background: #f8f9fa;
                            border-radius: 12px;
                            font-size: 12px;
                        ">
                            <span>${s.lastName} ${s.firstName.charAt(0)}.</span>
                            <span style="
                                width: 16px;
                                height: 16px;
                                border-radius: 50%;
                                background: ${getStudentScoreColor(s.id)};
                                display: inline-flex;
                                align-items: center;
                                justify-content: center;
                                color: white;
                                font-size: 10px;
                                font-weight: bold;
                            " title="Балл: ${calculateStudentScore(s.id)?.toFixed(1) || 0}">
                                ${getStudentScoreBadge(s.id)}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </td>
            <td style="vertical-align: top; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: ${getScoreColor(group.metrics.avgScore)}">
                    ${group.metrics.avgScore.toFixed(1)}
                </div>
                <div style="font-size: 11px; color: #7f8c8d;">
                    Средний балл
                </div>
                <div style="margin-top: 5px; font-size: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                        <span>Сложность:</span>
                        <span>${group.metrics.avgComplexity.toFixed(1)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                        <span>Ошибки:</span>
                        <span>${group.metrics.errorRate.toFixed(1)}%</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Сплоченность:</span>
                        <span>${group.metrics.cohesion.toFixed(0)}%</span>
                    </div>
                </div>
            </td>
            <td style="vertical-align: top;">
                <span class="badge level-${level}" style="
                    display: block;
                    padding: 6px 12px;
                    margin-bottom: 10px;
                    text-align: center;
                    background: ${getLevelColor(level)};
                    color: white;
                    border-radius: 6px;
                ">
                    ${getLevelName(level)}
                </span>
                <div style="font-size: 12px; line-height: 1.4;">
                    <strong>Сильные стороны:</strong><br>
                    ${getGroupStrengths(group).join(', ')}
                </div>
            </td>
            <td style="vertical-align: top;">
                <div style="font-size: 12px; max-height: 100px; overflow-y: auto;">
                    ${group.generateRecommendations().map(rec => `
                        <div style="
                            padding: 5px 8px;
                            margin-bottom: 4px;
                            background: #f0f7ff;
                            border-left: 3px solid #3498db;
                            border-radius: 3px;
                        ">
                            ${rec}
                        </div>
                    `).join('')}
                </div>
            </td>
            <td style="vertical-align: top;">
                <div class="btn-group" style="display: flex; flex-direction: column; gap: 5px;">
                    <button class="btn-icon small" onclick="editGroup(${index})" title="Редактировать группу">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon small" onclick="viewGroupDetails(${index})" title="Подробная информация">
                        <i class="fas fa-chart-bar"></i>
                    </button>
                    <button class="btn-icon small" onclick="manageGroupStudents(${index})" title="Управление составом">
                        <i class="fas fa-users-cog"></i>
                    </button>
                    <button class="btn-icon small" onclick="exportGroup(${index})" title="Экспорт группы">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn-icon small danger" onclick="deleteGroup(${index})" title="Удалить группу">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// Визуализация групп
function renderGroupsChart() {
    const ctx = document.getElementById('groupsChart');
    if (!ctx)
        return;

    // Удаляем предыдущий график
    if (groupsData.groupCharts.main) {
        groupsData.groupCharts.main.destroy();
    }

    const labels = groupsData.currentGroups.map(g => g.name);
    const avgScores = groupsData.currentGroups.map(g => g.metrics.avgScore);
    const colors = groupsData.currentGroups.map(g => g.settings.color);
    const studentCounts = groupsData.currentGroups.map(g => g.students.length);

    groupsData.groupCharts.main = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                    label: 'Средний балл',
                    data: avgScores,
                    backgroundColor: colors,
                    borderColor: colors.map(c => c + 'CC'),
                    borderWidth: 1,
                    yAxisID: 'y'
                }, {
                    label: 'Количество учеников',
                    data: studentCounts,
                    backgroundColor: colors.map(c => c + '44'),
                    borderColor: colors,
                    borderWidth: 1,
                    type: 'line',
                    yAxisID: 'y1',
                    tension: 0.4
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
                title: {
                    display: true,
                    text: 'Анализ учебных групп',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const groupIndex = context.dataIndex;
                            const group = groupsData.currentGroups[groupIndex];
                            if (context.datasetIndex === 0) {
                                return `Средний балл: ${group.metrics.avgScore.toFixed(2)}`;
                            } else {
                                return `Учеников: ${group.students.length}`;
                            }
                        },
                        afterLabel: function (context) {
                            const groupIndex = context.dataIndex;
                            const group = groupsData.currentGroups[groupIndex];
                            return [
                                `Уровень: ${getLevelName(getGroupLevel(group.metrics.avgScore))}`, 
                                `Ошибки: ${group.metrics.errorRate.toFixed(1)}%`, 
`Сплоченность: ${group.metrics.cohesion.toFixed(0)}%`
                            ];
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
                        text: 'Средний балл'
                    },
                    min: 0,
                    max: 5
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Количество учеников'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

// Генерация рекомендаций для всех групп
function generateGroupRecommendations() {
    const teacherRecs = document.getElementById('teacherRecommendations');
    const groupRecs = document.getElementById('perGroupRecommendations');

    if (!teacherRecs || !groupRecs)
        return;

    // Общие рекомендации для преподавателя
    const overallMetrics = calculateOverallGroupMetrics();
    const teacherRecommendations = generateTeacherRecommendations(overallMetrics);

    teacherRecs.innerHTML = teacherRecommendations.map(rec =>
`<li>${rec}</li>`).join('');

    // Рекомендации для каждой группы
    let perGroupHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">';

    groupsData.currentGroups.forEach((group, index) => {
        const recommendations = group.generateRecommendations();

        perGroupHTML += `
            <div class="group-recommendation-card" style="
                padding: 15px;
                background: white;
                border-radius: 8px;
                border-left: 4px solid ${group.settings.color};
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="margin: 0; color: ${group.settings.color};">${group.name}</h4>
                    <span class="badge" style="background: ${getLevelColor(getGroupLevel(group.metrics.avgScore))}; color: white;">
                        ${getLevelName(getGroupLevel(group.metrics.avgScore))}
                    </span>
                </div>
                <div style="margin-bottom: 10px; font-size: 12px;">
                    <strong>${group.students.length}</strong> учеников | 
                    Средний балл: <strong>${group.metrics.avgScore.toFixed(1)}</strong>
                </div>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
                    ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
                <div style="margin-top: 10px; font-size: 11px; color: #7f8c8d;">
                    <i class="fas fa-lightbulb"></i> Нажмите "Сгенерировать задания" для этой группы
                </div>
            </div>
        `;
    });

    perGroupHTML += '</div>';
    groupRecs.innerHTML = perGroupHTML;
}

// ============================
// ФУНКЦИИ АНАЛИЗА И СРАВНЕНИЯ
// ============================

// Анализ динамики групп
function analyzeGroupDynamics() {
    if (groupsData.currentGroups.length === 0) {
        showNotification('Сначала сформируйте группы', 'warning');
        return;
    }

    // Сравниваем с предыдущими группировками
    if (groupsData.previousGroupings.length > 0) {
        const lastGrouping = groupsData.previousGroupings[groupsData.previousGroupings.length - 1];
        showGroupDynamicsModal(lastGrouping);
    } else {
        // Анализ текущего состояния
        const dynamics = calculateGroupDynamics();
        showGroupDynamicsModal(dynamics);
    }
}

// Сравнение групп
function compareGroups() {
    if (groupsData.currentGroups.length < 2) {
        showNotification('Нужно как минимум 2 группы для сравнения', 'warning');
        return;
    }

    const comparisonData = groupsData.currentGroups.map((group, index) => {
        return {
            name: group.name,
            color: group.settings.color,
            metrics: group.metrics,
            strengths: getGroupStrengths(group),
            weaknesses: getGroupWeaknesses(group),
            students: group.students.length
        };
    });

    showGroupComparisonModal(comparisonData);
}

// Анализ прогресса групп
function showGroupProgress() {
    if (groupsData.currentGroups.length === 0) {
        showNotification('Сначала сформируйте группы', 'warning');
        return;
    }

    // Рендерим график прогресса
    renderGroupProgressChart();
}

// ============================
// ЭКСПОРТ И ИМПОРТ
// ============================

// Экспорт групп в Excel
function exportGroupsToExcel() {
    if (groupsData.currentGroups.length === 0) {
        showNotification('Нет групп для экспорта', 'warning');
        return;
    }

    try {
        const data = [];

        // Заголовок
        data.push(['Отчет по учебным группам']);
        data.push([`${window.appData.test?.subject || 'Предмет'}, ${window.appData.test?.class || 'Класс'}`]);
        data.push([`Дата формирования: ${new Date().toLocaleDateString()}`]);
        data.push([]);

        // Данные по группам
        groupsData.currentGroups.forEach((group, groupIndex) => {
            data.push([`Группа ${groupIndex + 1}: ${group.name}`]);
            data.push(['Параметр', 'Значение']);
            data.push(['Количество учеников', group.students.length]);
            data.push(['Средний балл', group.metrics.avgScore.toFixed(2)]);
            data.push(['Уровень сложности', group.metrics.avgComplexity.toFixed(2)]);
            data.push(['Процент ошибок', `${group.metrics.errorRate.toFixed(1)}%`]);
            data.push(['Сплоченность группы', `${group.metrics.cohesion.toFixed(0)}%`]);
            data.push(['Тип группы', getGroupTypeName(group.settings.type)]);
            data.push(['Критерий группировки', getCriteriaName(group.settings.criteria)]);
            data.push([]);

            data.push(['Состав группы:']);
            data.push(['№', 'Фамилия', 'Имя', 'Балл', 'Уровень', 'Основные ошибки']);

            group.students.forEach((student, studentIndex) => {
                const score = calculateStudentScore(student.id) || 0;
                const errors = getStudentErrorTypes(student.id);

                data.push([
                        studentIndex + 1,
                        student.lastName,
                        student.firstName,
                        score.toFixed(1),
                        getLevelName(getStudentLevel(score)),
                        errors.length > 0 ? errors.join(', ') : 'нет'
                    ]);
            });

            data.push([]);
            data.push(['Рекомендации для работы с группой:']);
            group.recommendations.forEach(rec => {
                data.push([rec]);
            });

            data.push([]);
            data.push(['='.repeat(50)]);
            data.push([]);
        });

        // Создаем книгу Excel
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);

        // Настраиваем ширину колонок
        const colWidths = [{
                wch: 5
            }, // №
            {
                wch: 15
            }, // Фамилия
            {
                wch: 15
            }, // Имя
            {
                wch: 8
            }, // Балл
            {
                wch: 12
            }, // Уровень
            {
                wch: 25
            } // Ошибки
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, "Учебные группы");

        // Сохраняем файл
        const fileName = `Группы_${window.appData.test?.class || 'класс'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        showNotification('Группы успешно экспортированы в Excel', 'success');
    } catch (error) {
        console.error('Ошибка экспорта:', error);
        showNotification('Ошибка при экспорте групп', 'error');
    }
}

// Экспорт отчета по группам
function exportGroupReport() {
    if (groupsData.currentGroups.length === 0) {
        showNotification('Нет групп для отчета', 'warning');
        return;
    }

    // Генерация HTML отчета
    let reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Отчет по учебным группам</title>
            <style>
                body {
                    font-family: 'DejaVu Sans', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    padding: 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #3498db;
                }
                .group-section {
                    margin-bottom: 40px;
                    page-break-inside: avoid;
                }
                .group-header {
                    background: #f8f9fa;
                    padding: 15px;
                    border-left: 5px solid #3498db;
                    margin-bottom: 20px;
                }
                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }
                .metric-card {
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .metric-value {
                    font-size: 24px;
                    font-weight: bold;
                    margin: 10px 0;
                }
                .students-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .students-table th, .students-table td {
                    padding: 10px;
                    border: 1px solid #ddd;
                    text-align: left;
                }
                .students-table th {
                    background: #34495e;
                    color: white;
                }
                .recommendations {
                    background: #e8f4fc;
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 20px;
                }
                @media print {
                    .no-print { display: none; }
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 Отчет по учебным группам</h1>
                <h2>${window.appData.test?.subject || 'Предмет'}, ${window.appData.test?.class || 'Класс'}</h2>
                <p>Дата формирования: ${new Date().toLocaleDateString()}</p>
            </div>
    `;

    groupsData.currentGroups.forEach((group, index) => {
        const level = getGroupLevel(group.metrics.avgScore);

        reportHTML += `
            <div class="group-section">
                <div class="group-header">
                    <h2 style="color: ${group.settings.color}; margin: 0 0 10px 0;">
                        👥 ${group.name} - ${getLevelName(level)}
                    </h2>
                    <p style="margin: 0; color: #666;">
                        Критерий: ${getCriteriaName(group.settings.criteria)} | 
                        Тип: ${getGroupTypeName(group.settings.type)} | 
                        Учеников: ${group.students.length}
                    </p>
                </div>
                
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div>Средний балл</div>
                        <div class="metric-value" style="color: ${getScoreColor(group.metrics.avgScore)}">
                            ${group.metrics.avgScore.toFixed(2)}
                        </div>
                    </div>
                    <div class="metric-card">
                        <div>Уровень сложности</div>
                        <div class="metric-value">${group.metrics.avgComplexity.toFixed(2)}</div>
                    </div>
                    <div class="metric-card">
                        <div>Процент ошибок</div>
                        <div class="metric-value">${group.metrics.errorRate.toFixed(1)}%</div>
                    </div>
                    <div class="metric-card">
                        <div>Сплоченность</div>
                        <div class="metric-value">${group.metrics.cohesion.toFixed(0)}%</div>
                    </div>
                </div>
                
                <h3>👤 Состав группы</h3>
                <table class="students-table">
                    <thead>
                        <tr>
                            <th>№</th>
                            <th>Фамилия</th>
                            <th>Имя</th>
                            <th>Балл</th>
                            <th>Уровень</th>
                            <th>Основные ошибки</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${group.students.map((student, studentIndex) => {
            const score = calculateStudentScore(student.id) || 0;
            const errors = getStudentErrorTypes(student.id);

            return `
                                <tr>
                                    <td>${studentIndex + 1}</td>
                                    <td>${student.lastName}</td>
                                    <td>${student.firstName}</td>
                                    <td style="text-align: center;">${score.toFixed(1)}</td>
                                    <td style="text-align: center;">${getLevelName(getStudentLevel(score))}</td>
                                    <td>${errors.length > 0 ? errors.join(', ') : 'нет'}</td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
                
                <div class="recommendations">
                    <h3>💡 Рекомендации для работы с группой</h3>
                    <ul>
                        ${group.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    });

    reportHTML += `
            <div class="no-print" style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p>Сгенерировано системой анализа образовательных результатов</p>
                <button onclick="window.print()" style="
                    padding: 10px 20px;
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 10px;
                ">
                    🖨️ Печать отчета
                </button>
            </div>
        </body>
        </html>
    `;

    // Открываем отчет в новом окне
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();

    showNotification('Отчет по группам сгенерирован', 'success');
}

// ============================
// УПРАВЛЕНИЕ ГРУППАМИ
// ============================

// Редактирование группы
function editGroup(groupIndex) {
    const group = groupsData.currentGroups[groupIndex];
    if (!group)
        return;

    showModal(`
        <h2>✏️ Редактирование группы: ${group.name}</h2>
        
        <div class="form-group">
            <label>Название группы:</label>
            <input type="text" id="editGroupName" value="${group.name}" class="form-input">
        </div>
        
        <div class="form-group">
            <label>Цвет группы:</label>
            <input type="color" id="editGroupColor" value="${group.settings.color}" class="form-input">
        </div>
        
        <div class="form-group">
            <label>Тип группы:</label>
            <select id="editGroupType" class="form-select">
                <option value="homogeneous" ${group.settings.type === 'homogeneous' ? 'selected' : ''}>Однородная</option>
                <option value="heterogeneous" ${group.settings.type === 'heterogeneous' ? 'selected' : ''}>Разнородная</option>
                <option value="dynamic" ${group.settings.type === 'dynamic' ? 'selected' : ''}>Динамическая</option>
                <option value="project" ${group.settings.type === 'project' ? 'selected' : ''}>Проектная</option>
            </select>
        </div>
        
        <div class="modal-actions">
            <button class="btn" onclick="closeModal()">Отмена</button>
            <button class="btn btn-primary" onclick="saveGroupChanges(${groupIndex})">Сохранить</button>
        </div>
    `);
}

// Сохранение изменений группы
function saveGroupChanges(groupIndex) {
    const group = groupsData.currentGroups[groupIndex];
    if (!group)
        return;

    group.name = document.getElementById('editGroupName').value;
    group.settings.color = document.getElementById('editGroupColor').value;
    group.settings.type = document.getElementById('editGroupType').value;
    group.updatedAt = new Date().toISOString();

    updateGroupsTable();
    renderGroupsChart();
    closeModal();

    showNotification('Изменения группы сохранены', 'success');
}

// Просмотр деталей группы
function viewGroupDetails(groupIndex) {
    const group = groupsData.currentGroups[groupIndex];
    if (!group)
        return;

    showModal(`
        <h2 style="color: ${group.settings.color};">📊 Детальный анализ: ${group.name}</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
            <div>
                <h4>📈 Метрики группы</h4>
                <table style="width: 100%;">
                    <tr><td>Средний балл:</td><td><strong>${group.metrics.avgScore.toFixed(2)}</strong></td></tr>
                    <tr><td>Уровень сложности:</td><td>${group.metrics.avgComplexity.toFixed(2)}</td></tr>
                    <tr><td>Процент ошибок:</td><td>${group.metrics.errorRate.toFixed(1)}%</td></tr>
                    <tr><td>Сплоченность:</td><td>${group.metrics.cohesion.toFixed(0)}%</td></tr>
                    <tr><td>Учеников:</td><td>${group.students.length}</td></tr>
                </table>
            </div>
            
            <div>
                <h4>🎯 Сильные стороны</h4>
                <ul>
                    ${getGroupStrengths(group).map(strength => `<li>${strength}</li>`).join('')}
                </ul>
                
                <h4>⚠️ Слабые стороны</h4>
                <ul>
                    ${getGroupWeaknesses(group).map(weakness => `<li>${weakness}</li>`).join('')}
                </ul>
            </div>
        </div>
        
        <div>
            <h4>👥 Состав группы</h4>
            <div style="max-height: 300px; overflow-y: auto;">
                <table style="width: 100%; font-size: 12px;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th>Фамилия</th>
                            <th>Имя</th>
                            <th>Балл</th>
                            <th>Уровень</th>
                            <th>Ошибки</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${group.students.map(student => {
            const score = calculateStudentScore(student.id) || 0;
            const errors = getStudentErrorTypes(student.id);

            return `
                                <tr>
                                    <td>${student.lastName}</td>
                                    <td>${student.firstName}</td>
                                    <td style="text-align: center;">${score.toFixed(1)}</td>
                                    <td style="text-align: center;">${getLevelName(getStudentLevel(score))}</td>
                                    <td>${errors.length > 0 ? errors.join(', ') : 'нет'}</td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="modal-actions">
            <button class="btn" onclick="closeModal()">Закрыть</button>
            <button class="btn btn-primary" onclick="generateGroupTasks(${groupIndex})">
                📝 Сгенерировать задания
            </button>
        </div>
    `);
}

// Управление составом группы
function manageGroupStudents(groupIndex) {
    const group = groupsData.currentGroups[groupIndex];
    if (!group)
        return;

    // Список всех студентов, не входящих в группу
    const allStudents = window.appData.students || [];
    const availableStudents = allStudents.filter(student =>
            !group.students.some(s => s.id === student.id));

    showModal(`
        <h2>👥 Управление составом: ${group.name}</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; height: 500px;">
            <!-- Доступные студенты -->
            <div>
                <h4>Доступные студенты (${availableStudents.length})</h4>
                <div style="border: 1px solid #ddd; border-radius: 5px; padding: 10px; height: 400px; overflow-y: auto;">
                    ${availableStudents.map(student => `
                        <div style="
                            padding: 8px;
                            margin-bottom: 5px;
                            background: #f8f9fa;
                            border-radius: 4px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        ">
                            <span>${student.lastName} ${student.firstName}</span>
                            <button class="btn btn-sm btn-success" onclick="addStudentToGroup('${student.id}', ${groupIndex})">
                                <i class="fas fa-plus"></i> Добавить
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Текущий состав -->
            <div>
                <h4>Текущий состав (${group.students.length})</h4>
                <div style="border: 1px solid #ddd; border-radius: 5px; padding: 10px; height: 400px; overflow-y: auto;">
                    ${group.students.map(student => `
                        <div style="
                            padding: 8px;
                            margin-bottom: 5px;
                            background: #e8f4fc;
                            border-radius: 4px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        ">
                            <span>${student.lastName} ${student.firstName}</span>
                            <button class="btn btn-sm btn-danger" onclick="removeStudentFromGroup('${student.id}', ${groupIndex})">
                                <i class="fas fa-times"></i> Удалить
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
            <button class="btn" onclick="autoBalanceGroup(${groupIndex})">
                ⚖️ Автобалансировка
            </button>
            <button class="btn btn-primary" onclick="saveGroupComposition(${groupIndex})">
                💾 Сохранить изменения
            </button>
        </div>
    `);
}

// Добавление студента в группу
function addStudentToGroup(studentId, groupIndex) {
    const student = window.appData.students.find(s => s.id === studentId);
    if (!student)
        return;

    const group = groupsData.currentGroups[groupIndex];
    if (!group)
        return;

    if (group.addStudent(student)) {
        updateGroupsTable();
        showNotification(`Студент ${student.lastName} добавлен в группу`, 'success');
    }
}

// Удаление студента из группы
function removeStudentFromGroup(studentId, groupIndex) {
    const group = groupsData.currentGroups[groupIndex];
    if (!group)
        return;

    if (group.removeStudent(studentId)) {
        updateGroupsTable();
        showNotification('Студент удален из группы', 'info');
    }
}

// Удаление группы
function deleteGroup(groupIndex) {
    if (!confirm('Вы уверены, что хотите удалить эту группу?')) {
        return;
    }

    const group = groupsData.currentGroups[groupIndex];
    groupsData.currentGroups.splice(groupIndex, 1);

    updateGroupsTable();
    renderGroupsChart();

    showNotification(`Группа "${group.name}" удалена`, 'info');
}

// ============================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================

// Вспомогательные функции для работы со студентами
function getStudentScoreColor(studentId) {
    const score = calculateStudentScore(studentId) || 0;
    return getScoreColor(score);
}

function getStudentScoreBadge(studentId) {
    const score = calculateStudentScore(studentId) || 0;
    return Math.floor(score);
}

function getStudentLevel(score) {
    if (score >= 4.5)
        return 'high';
    if (score >= 3.5)
        return 'medium';
    if (score >= 2.5)
        return 'low';
    return 'very_low';
}

function getScoreColor(score) {
    if (score >= 4.5)
        return '#27ae60';
    if (score >= 3.5)
        return '#3498db';
    if (score >= 2.5)
        return '#f39c12';
    return '#e74c3c';
}

function getLevelColor(level) {
    const colors = {
        'high': '#27ae60',
        'medium': '#3498db',
        'low': '#f39c12',
        'very_low': '#e74c3c'
    };
    return colors[level] || '#7f8c8d';
}

function getLevelName(level) {
    const names = {
        'high': 'Высокий',
        'medium': 'Средний',
        'low': 'Низкий',
        'very_low': 'Очень низкий'
    };
    return names[level] || 'Не определен';
}

function getCriteriaName(criteria) {
    const names = {
        'level': 'Уровень подготовки',
        'score': 'Баллы за работу',
        'taxonomy': 'Таксономические уровни',
        'errors': 'Тип ошибок',
        'mixed': 'Смешанный критерий'
    };
    return names[criteria] || criteria;
}

function getGroupTypeName(type) {
    const names = {
        'homogeneous': 'Однородная',
        'heterogeneous': 'Разнородная',
        'dynamic': 'Динамическая',
        'project': 'Проектная'
    };
    return names[type] || type;
}

// Расчет балла студента (заглушка - нужно интегрировать с основным модулем)
function calculateStudentScore(studentId) {
    if (!window.appData || !window.appData.results)
        return 0;

    const studentResults = window.appData.results.filter(r => r.studentId === studentId);
    if (studentResults.length === 0)
        return 0;

    // Упрощенный расчет среднего балла
    const total = studentResults.reduce((sum, result) => {
        return sum + (result.score || 0);
    }, 0);

    return total / studentResults.length;
}

// Получение ошибок студента (заглушка)
function getStudentErrors(studentId) {
    if (!window.appData || !window.appData.studentErrors)
        return [];
    return window.appData.studentErrors[studentId] || [];
}

function getStudentErrorCount(studentId) {
    return getStudentErrors(studentId).length;
}

function getStudentErrorTypes(studentId) {
    const errors = getStudentErrors(studentId);
    const types = [...new Set(errors.map(e => e.type))];
    return types.map(type => window.errorTypes?.[type]?.name || type);
}

// Анализ таксономии студента (заглушка)
function analyzeStudentTaxonomy(studentId) {
    return {
        level1: Math.random() * 100,
        level2: Math.random() * 100,
        level3: Math.random() * 100,
        level4: Math.random() * 100
    };
}

function analyzeStudentTaxonomyScore(studentId) {
    const profile = analyzeStudentTaxonomy(studentId);
    return (profile.level1 + profile.level2 + profile.level3 + profile.level4) / 4;
}

// Нахождение группы со слабым навыком
function findGroupWithWeakness(taxonomyProfile) {
    if (groupsData.currentGroups.length === 0)
        return -1;

    let weakestGroup = 0;
    let weakestScore = Infinity;

    groupsData.currentGroups.forEach((group, index) => {
        const groupTaxonomy = calculateGroupTaxonomyScore(group);
        const score = Object.keys(taxonomyProfile).reduce((sum, level) => {
            return sum + Math.abs(taxonomyProfile[level] - (groupTaxonomy[level] || 0));
        }, 0);

        if (score < weakestScore) {
            weakestScore = score;
            weakestGroup = index;
        }
    });

    return weakestGroup;
}

function calculateGroupTaxonomyScore(group) {
    if (group.students.length === 0) {
        return {
            level1: 0,
            level2: 0,
            level3: 0,
            level4: 0
        };
    }

    const total = {
        level1: 0,
        level2: 0,
        level3: 0,
        level4: 0
    };

    group.students.forEach(student => {
        const profile = analyzeStudentTaxonomy(student.id);
        Object.keys(total).forEach(level => {
            total[level] += profile[level] || 0;
        });
    });

    Object.keys(total).forEach(level => {
        total[level] = total[level] / group.students.length;
    });

    return total;
}

// Определение сильных и слабых сторон группы
function getGroupStrengths(group) {
    const strengths = [];
    const metrics = group.metrics;

    if (metrics.avgScore >= 4.0)
        strengths.push('Высокий средний балл');
    if (metrics.cohesion >= 70)
        strengths.push('Хорошая сплоченность');
    if (metrics.errorRate <= 20)
        strengths.push('Мало ошибок');
    if (group.students.length >= 5)
        strengths.push('Оптимальный размер');

    // Анализ состава
    const highLevelStudents = group.students.filter(s => {
        const score = calculateStudentScore(s.id) || 0;
        return score >= 4.5;
    }).length;

    if (highLevelStudents >= 2)
        strengths.push('Есть лидеры');

    return strengths.length > 0 ? strengths : ['Требуется индивидуальный подход'];
}

function getGroupWeaknesses(group) {
    const weaknesses = [];
    const metrics = group.metrics;

    if (metrics.avgScore < 2.5)
        weaknesses.push('Низкий средний балл');
    if (metrics.cohesion < 40)
        weaknesses.push('Низкая сплоченность');
    if (metrics.errorRate >= 40)
        weaknesses.push('Много ошибок');
    if (group.students.length < 3)
        weaknesses.push('Слишком маленькая группа');
    if (group.students.length > 8)
        weaknesses.push('Слишком большая группа');

    return weaknesses;
}

// Обновление предпросмотра групп
function updateGroupPreview() {
    const preview = document.getElementById('groupPreviewStats');
    if (!preview)
        return;

    if (groupsData.currentGroups.length === 0) {
        preview.innerHTML = '<p style="color: #7f8c8d; text-align: center;">Группы не сформированы</p>';
        return;
    }

    const totalStudents = groupsData.currentGroups.reduce((sum, group) => sum + group.students.length, 0);
    const avgGroupSize = (totalStudents / groupsData.currentGroups.length).toFixed(1);
    const avgGroupScore = groupsData.currentGroups.reduce((sum, group) => sum + group.metrics.avgScore, 0) / groupsData.currentGroups.length;

    let previewHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
            <div style="text-align: center; padding: 10px; background: white; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: #3498db;">${groupsData.currentGroups.length}</div>
                <div style="font-size: 12px; color: #7f8c8d;">Групп</div>
            </div>
            <div style="text-align: center; padding: 10px; background: white; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: #2ecc71;">${totalStudents}</div>
                <div style="font-size: 12px; color: #7f8c8d;">Учеников</div>
            </div>
            <div style="text-align: center; padding: 10px; background: white; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: #f39c12;">${avgGroupSize}</div>
                <div style="font-size: 12px; color: #7f8c8d;">Средний размер</div>
            </div>
            <div style="text-align: center; padding: 10px; background: white; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: ${getScoreColor(avgGroupScore)}">${avgGroupScore.toFixed(1)}</div>
                <div style="font-size: 12px; color: #7f8c8d;">Средний балл</div>
            </div>
        </div>
        <div style="margin-top: 10px; font-size: 12px; color: #666;">
            <strong>Распределение:</strong>
            ${groupsData.currentGroups.map(group => 
            `${group.name}: ${group.students.length} чел. (${group.metrics.avgScore.toFixed(1)})`).join(' | ')}
        </div>
    `;

    preview.innerHTML = previewHTML;
}

// Сохранение в историю группировок
function saveToGroupingHistory() {
    const snapshot = {
        id: `grouping_${Date.now()}`,
        timestamp: new Date().toISOString(),
        groups: JSON.parse(JSON.stringify(groupsData.currentGroups)),
        settings: {
            criteria: document.getElementById('groupingCriteria')?.value,
            groupCount: document.getElementById('groupCount')?.value,
            groupType: document.getElementById('groupType')?.value,
            balance: document.getElementById('groupBalance')?.value
        },
        stats: {
            totalGroups: groupsData.currentGroups.length,
            totalStudents: groupsData.currentGroups.reduce((sum, group) => sum + group.students.length, 0),
            avgScore: groupsData.currentGroups.reduce((sum, group) => sum + group.metrics.avgScore, 0) / groupsData.currentGroups.length
        }
    };

    groupsData.groupingHistory.push(snapshot);

    // Сохраняем в localStorage
    try {
        localStorage.setItem('groupingHistory', JSON.stringify(groupsData.groupingHistory.slice(-10))); // Последние 10
    } catch (e) {
        console.error('Ошибка сохранения истории группировок:', e);
    }
}

// Загрузка истории из localStorage
function loadGroupingHistory() {
    try {
        const saved = localStorage.getItem('groupingHistory');
        if (saved) {
            groupsData.groupingHistory = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Ошибка загрузки истории группировок:', e);
    }
}

// Инициализация модуля
function initGroupsModule() {
    console.log('Инициализация модуля группового анализа...');

    // Загружаем историю
    loadGroupingHistory();

    // Инициализируем интерфейс если вкладка активна
    if (document.getElementById('groups')?.classList.contains('active')) {
        updateGroupPreview();
    }

    // Добавляем обработчики для обновления предпросмотра
    ['groupingCriteria', 'groupCount', 'groupType', 'groupBalance'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updateGroupPreview);
        }
    });

    // Обработчик изменения количества групп
    const groupCountInput = document.getElementById('groupCount');
    if (groupCountInput) {
        groupCountInput.addEventListener('input', function () {
            document.getElementById('groupCountValue').textContent = this.value;
            updateGroupPreview();
        });
    }

    console.log('Модуль группового анализа инициализирован');
}

// Экспорт функций в глобальную область видимости
window.autoFormGroups = autoFormGroups;
window.analyzeGroupDynamics = analyzeGroupDynamics;
window.compareGroups = compareGroups;
window.showGroupProgress = showGroupProgress;
window.exportGroupsToExcel = exportGroupsToExcel;
window.exportGroupReport = exportGroupReport;
window.editGroup = editGroup;
window.viewGroupDetails = viewGroupDetails;
window.manageGroupStudents = manageGroupStudents;
window.addStudentToGroup = addStudentToGroup;
window.removeStudentFromGroup = removeStudentFromGroup;
window.deleteGroup = deleteGroup;
window.saveGroupChanges = saveGroupChanges;
window.updateGroupPreview = updateGroupPreview;

// Инициализация при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGroupsModule);
} else {
    initGroupsModule();
}

// Экспорт модуля

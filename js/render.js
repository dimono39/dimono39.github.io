// ==================== ОСНОВНАЯ ФУНКЦИЯ RENDERALL ====================
function renderAll() {
    console.log('Начинаем рендеринг всех компонентов...');
    
    try {
        // 1. Рендерим настройки теста
        renderTestSettings();
        
        // 2. Рендерим задания
        renderTasks();
        
        // 3. Рендерим список учащихся
        renderStudents();
        
        // 4. Рендерим результаты и ошибки
        renderResults();
        
        // 5. Рендерим настройки критериев оценивания
        renderCriteriaSettings();
        
        // 6. Обновляем аналитику (если на соответствующей вкладке)
        if (document.getElementById('analytics')?.classList.contains('active')) {
            updateAnalytics();
        }
        
        // 7. Обновляем визуализацию (если на соответствующей вкладке)
        if (document.getElementById('visualization')?.classList.contains('active')) {
            updateVisualization();
        }
        
        // 8. Обновляем рекомендации (если на соответствующей вкладке)
        if (document.getElementById('recommendations')?.classList.contains('active')) {
            updateRecommendations();
        }
        
        // 9. Обновляем предпросмотр отчета (если на вкладке экспорта)
        if (document.getElementById('export')?.classList.contains('active')) {
            updateReportPreview();
        }
        
        // 10. Обновляем специализированный анализ в зависимости от типа работы
        const workType = appData.test.workType;
        const specializedContainer = document.getElementById('specializedAnalysis');
        
        if (specializedContainer) {
            switch(workType) {
                case 'vpr':
                    updateVPRAnalysis();
                    break;
                case 'func_literacy':
                    updateLiteracyAnalysis();
                    break;
                case 'oge':
                case 'ege':
                    updateGIAnalysis();
                    break;
                case 'psychology':
                    updatePsychologyAnalysis();
                    break;
                case 'final':
                    updateFinalAnalysis();
                    break;
                default:
                    specializedContainer.innerHTML = '';
            }
        }
        
        // 11. Инициализируем графики, если они есть на странице
        if (document.getElementById('gradesChart') || 
            document.getElementById('complexityChart') || 
            document.getElementById('psychologyProfileChart')) {
            setTimeout(() => {
                updateAllCharts();
            }, 100);
        }
        
        console.log('Рендеринг всех компонентов завершен успешно');
        
    } catch (error) {
        console.error('Критическая ошибка в renderAll:', error);
        showNotification(`Ошибка при отображении данных: ${error.message}`, 'error');
        
        // Пытаемся восстановить базовый функционал
        try {
            renderTestSettings();
            renderStudents();
        } catch (e) {
            console.error('Не удалось восстановить даже базовый функционал:', e);
        }
    }
}

// ==================== ОБНОВЛЕННЫЕ КОМПОНЕНТНЫЕ ФУНКЦИИ ====================

// 1. РЕНДЕР НАСТРОЕК ТЕСТА (улучшенная с защитой от ошибок)
function renderTestSettings() {
    try {
        const settingsToRender = {
            'subject': appData.test.subject,
            'class': appData.test.class,
            'testDate': appData.test.testDate,
            'testTheme': appData.test.theme,
            'testGoals': appData.test.goals,
            'workType': appData.test.workType,
            'workFormat': appData.test.workFormat,
            'timeLimit': appData.test.timeLimit,
            'totalStudents': appData.test.totalStudents,
            'presentStudents': appData.test.presentStudents,
            'absentReason': appData.test.absentReason,
            'criteria5min': appData.test.criteria?.[5]?.min || 0,
            'criteria5max': appData.test.criteria?.[5]?.max || 0,
            'criteria4min': appData.test.criteria?.[4]?.min || 0,
            'criteria4max': appData.test.criteria?.[4]?.max || 0,
            'criteria3min': appData.test.criteria?.[3]?.min || 0,
            'criteria3max': appData.test.criteria?.[3]?.max || 0,
            'criteria2min': appData.test.criteria?.[2]?.min || 0,
            'criteria2max': appData.test.criteria?.[2]?.max || 0
        };
        
        Object.entries(settingsToRender).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value !== undefined) {
                element.value = value;
            }
        });
        
        // Обновляем критерии оценивания для типа работы
        updateCriteriaForWorkType();
        
    } catch (error) {
        console.error('Ошибка в renderTestSettings:', error);
    }
}

// 2. РЕНДЕР ЗАДАНИЙ (с управлением через UI)
function renderTasks() {
    const container = document.getElementById('tasksContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Панель управления заданиями
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'task-controls-panel';
    controlsDiv.innerHTML = `
        <h4>📝 Управление заданиями</h4>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;">
            <button class="btn btn-success" onclick="addTask()">
                ➕ Добавить задание
            </button>
            <button class="btn btn-danger" onclick="removeLastTask()">
                ➖ Удалить последнее
            </button>
            <button class="btn" onclick="showTasksQuickEdit()">
                ⚡ Быстрое редактирование
            </button>
            <button class="btn" onclick="duplicateSelectedTasks()">
                📋 Дублировать выбранные
            </button>
        </div>
        <div class="task-stats">
            <small>Заданий: <strong>${appData.tasks.length}</strong> | 
            Макс. баллов: <strong>${appData.tasks.reduce((sum, task) => sum + (task.maxScore || 0), 0)}</strong> |
            Уровней: <strong>${new Set(appData.tasks.map(t => t.level)).size}</strong></small>
        </div>
    `;
    container.appendChild(controlsDiv);
    
    // Если заданий нет - создаем по умолчанию
    if (appData.tasks.length === 0) {
        const defaultTaskCount = getDefaultTaskCount();
        for (let i = 0; i < defaultTaskCount; i++) {
            appData.tasks.push({
                type: `Задание ${i + 1}`,
                maxScore: 1,
                level: 1,
                knowledge: "",
                number: i + 1
            });
        }
    }
    
    // Рендерим каждое задание
    appData.tasks.forEach((task, index) => {
        const taskDiv = document.createElement('div');
        taskDiv.className = `task-card level-${task.level}`;
        taskDiv.dataset.taskIndex = index;
        
        // Динамические поля в зависимости от типа работы
        let additionalFields = '';
        const workType = appData.test.workType;
        
        switch(workType) {
            case 'vpr':
                additionalFields = renderVPRTaskFields(task, index);
                break;
            case 'func_literacy':
                additionalFields = renderLiteracyTaskFields(task, index);
                break;
            case 'oge':
            case 'ege':
                additionalFields = renderGITaskFields(task, index);
                break;
            case 'psychology':
                additionalFields = renderPsychologyTaskFields(task, index);
                break;
            default:
                additionalFields = renderStandardTaskFields(task, index);
        }
        
        taskDiv.innerHTML = `
            <div class="task-header">
                <h4>📄 Задание ${task.number || index + 1}</h4>
                <div class="task-actions">
                    <button class="btn btn-sm" onclick="moveTaskUp(${index})" title="Переместить вверх" ${index === 0 ? 'disabled' : ''}>⬆️</button>
                    <button class="btn btn-sm" onclick="moveTaskDown(${index})" title="Переместить вниз" ${index === appData.tasks.length - 1 ? 'disabled' : ''}>⬇️</button>
                    <button class="btn btn-sm btn-danger" onclick="removeTask(${index})" title="Удалить">🗑️</button>
                </div>
            </div>
            
            <div class="task-fields">
                <div class="form-group">
                    <label>Тип задания:</label>
                    <input type="text" value="${escapeHtml(task.type)}" 
                           onchange="updateTask(${index}, 'type', this.value)" 
                           placeholder="Например: Теория, Практика...">
                </div>
                
                <div class="form-group">
                    <label>Максимальный балл:</label>
                    <input type="number" value="${task.maxScore}" min="1" max="20" 
                           onchange="updateTask(${index}, 'maxScore', parseInt(this.value) || 1)">
                </div>
                
                <div class="form-group">
                    <label>Уровень сложности:</label>
                    <select onchange="updateTask(${index}, 'level', parseInt(this.value))">
                        ${Object.entries(complexityLevels).map(([level, data]) => `
                            <option value="${level}" ${task.level == level ? 'selected' : ''}>
                                ${level}. ${data.name}
                            </option>
                        `).join('')}
                    </select>
                    <small class="level-description">${complexityLevels[task.level]?.desc || ''}</small>
                </div>
                
                <div class="form-group">
                    <label>Проверяемый элемент:</label>
                    <input type="text" value="${escapeHtml(task.knowledge)}" 
                           onchange="updateTask(${index}, 'knowledge', this.value)" 
                           placeholder="Что проверяет это задание?">
                </div>
                
                ${additionalFields}
                
                <div class="task-stats" style="margin-top: 10px; font-size: 12px; color: #666;">
                    <span>Выполнение: <strong id="taskCompletion${index}">0%</strong></span> |
                    <span>Ошибок: <strong id="taskErrors${index}">0</strong></span>
                </div>
            </div>
        `;
        
        container.appendChild(taskDiv);
    });
    
    // Обновляем статистику заданий
    updateTasksStatistics();
}

// 3. РЕНДЕР СПИСКА УЧАЩИХСЯ (с улучшенным управлением)
function renderStudents() {
    const container = document.getElementById('studentsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Панель управления учащимися
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'students-controls-panel';
    controlsDiv.innerHTML = `
        <h4>👥 Управление списком учащихся</h4>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;">
            <button class="btn btn-success" onclick="addStudent()">
                ➕ Добавить учащегося
            </button>
            <button class="btn btn-danger" onclick="removeLastStudent()">
                ➖ Удалить последнего
            </button>
            <button class="btn" onclick="showMassImportDialog()">
                📝 Импорт из текста
            </button>
            <button class="btn" onclick="generateRandomStudents()">
                🎲 Сгенерировать случайные
            </button>
            <button class="btn btn-warning" onclick="showStudentsQuickEdit()">
                ⚡ Быстрое редактирование
            </button>
        </div>
        <div class="students-stats">
            <small>Учащихся: <strong>${appData.students.length}</strong> | 
            Писали работу: <strong>${appData.test.presentStudents || appData.students.length}</strong> |
            Отсутствовали: <strong>${(appData.test.totalStudents || 0) - (appData.test.presentStudents || 0)}</strong></small>
        </div>
    `;
    container.appendChild(controlsDiv);
    
    // Если список пуст - создаем по умолчанию
    if (appData.students.length === 0) {
        const studentCount = appData.test.presentStudents || 5;
        for (let i = 0; i < studentCount; i++) {
            appData.students.push(`Учащийся ${i + 1}`);
            appData.results.push(new Array(appData.tasks.length).fill(0));
        }
    }
    
    // Рендерим каждого учащегося
    const studentsList = document.createElement('div');
    studentsList.className = 'students-list';
    
    appData.students.forEach((student, index) => {
        const studentDiv = document.createElement('div');
        studentDiv.className = 'student-card';
        studentDiv.dataset.studentIndex = index;
        
        // Рассчитываем статистику для учащегося
        const totalScore = (appData.results[index] || []).reduce((sum, score) => sum + score, 0);
        const maxPossible = appData.tasks.reduce((sum, task) => sum + task.maxScore, 0);
        const percentage = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;
        const grade = calculateGrade(totalScore);
        const studentErrors = appData.errors.filter(e => e.studentIndex === index);
        
        studentDiv.innerHTML = `
            <div class="student-header">
                <div class="student-info">
                    <h5>👤 ${escapeHtml(student)}</h5>
                    <div class="student-badges">
                        <span class="badge grade-${grade}">${getGradeDisplay(grade)}</span>
                        <span class="badge">${totalScore} баллов</span>
                        <span class="badge">${percentage.toFixed(1)}%</span>
                        ${studentErrors.length > 0 ? 
                            `<span class="badge badge-error">${studentErrors.length} ошибок</span>` : 
                            `<span class="badge badge-success">Без ошибок</span>`
                        }
                    </div>
                </div>
                <div class="student-actions">
                    <button class="btn btn-sm" onclick="showStudentDetails(${index})" title="Подробнее">
                        🔍
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="removeStudent(${index})" title="Удалить">
                        🗑️
                    </button>
                </div>
            </div>
            
            <div class="student-edit">
                <div class="form-group">
                    <label>ФИО учащегося:</label>
                    <div style="display: flex; gap: 5px;">
                        <input type="text" value="${escapeHtml(student)}" 
                               onchange="updateStudent(${index}, this.value)" 
                               placeholder="Фамилия Имя Отчество"
                               style="flex: 1;">
                        <button class="btn btn-sm" onclick="autoFormatName(${index})" title="Форматировать имя">
                            ✏️
                        </button>
                    </div>
                </div>
                
                ${studentErrors.length > 0 ? `
                    <div class="student-errors">
                        <small><strong>Типы ошибок:</strong> 
                        ${studentErrors.map(e => `
                            <span class="error-tag error-${e.type}">
                                ${errorTypes[e.type]?.name || e.type}
                            </span>
                        `).join('')}
                        </small>
                    </div>
                ` : ''}
            </div>
        `;
        
        studentsList.appendChild(studentDiv);
    });
    
    container.appendChild(studentsList);
    
    // Кнопка массового редактирования в конце
    const bulkEditDiv = document.createElement('div');
    bulkEditDiv.style.marginTop = '20px';
    bulkEditDiv.style.padding = '15px';
    bulkEditDiv.style.background = '#f8f9fa';
    bulkEditDiv.style.borderRadius = '8px';
    bulkEditDiv.innerHTML = `
        <h5>⚡ Массовые операции</h5>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-sm" onclick="addMultipleStudents()">
                ➕ Добавить нескольких
            </button>
            <button class="btn btn-sm" onclick="sortStudentsAlphabetically()">
                🔤 Сортировать по алфавиту
            </button>
            <button class="btn btn-sm btn-warning" onclick="showBulkEditScores()">
                📝 Массовое редактирование оценок
            </button>
            <button class="btn btn-sm" onclick="exportStudentsList()">
                📥 Экспорт списка
            </button>
        </div>
    `;
    container.appendChild(bulkEditDiv);
}

// 4. РЕНДЕР РЕЗУЛЬТАТОВ И ОШИБОК (полная версия с управлением)
function renderResults() {
    const container = document.getElementById('resultsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Проверяем и инициализируем результаты, если их нет
    if (appData.results.length === 0) {
        for (let i = 0; i < appData.students.length; i++) {
            appData.results.push(new Array(appData.tasks.length).fill(0));
        }
    }
    
    // Проверяем, что массив результатов соответствует количеству учащихся
    while (appData.results.length < appData.students.length) {
        appData.results.push(new Array(appData.tasks.length).fill(0));
    }
    
    while (appData.results.length > appData.students.length) {
        appData.results.pop();
    }
    
    // Панель управления результатами
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'results-controls-panel';
    controlsDiv.innerHTML = `
        <h4>📊 Управление результатами и ошибками</h4>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;">
            <button class="btn btn-success" onclick="showResultsSummary()">
                📈 Сводка результатов
            </button>
            <button class="btn btn-warning" onclick="showBulkEditScores()">
                📝 Массовое редактирование
            </button>
            <button class="btn" onclick="showErrorsManagement()">
                ⚙️ Управление ошибками
            </button>
            <button class="btn btn-danger" onclick="showBulkDeleteErrors()">
                🗑️ Массовое удаление ошибок
            </button>
            <button class="btn" onclick="autoCalculateMissingScores()">
                🧮 Автозаполнение пропусков
            </button>
        </div>
        <div class="results-stats">
            <small>Всего ошибок: <strong>${appData.errors.length}</strong> | 
            Учащихся с ошибками: <strong>${new Set(appData.errors.map(e => e.studentIndex)).size}</strong> |
            Заданий с ошибками: <strong>${new Set(appData.errors.map(e => e.taskIndex)).size}</strong></small>
        </div>
    `;
    container.appendChild(controlsDiv);
    
    // Основная таблица результатов
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    
    let tableHTML = `
        <table class="results-table">
            <thead>
                <tr>
                    <th rowspan="2">Учащийся</th>
                    <th colspan="${appData.tasks.length}">Задания</th>
                    <th rowspan="2">∑</th>
                    <th rowspan="2">Оценка</th>
                    <th rowspan="2">%</th>
                    <th rowspan="2">Ошибки</th>
                    <th rowspan="2">Действия</th>
                </tr>
                <tr>
                    ${appData.tasks.map((task, i) => `
                        <th title="Ур. ${task.level}: ${task.type} (макс: ${task.maxScore})">
                            ${i+1}
                        </th>
                    `).join('')}
                </tr>
            </thead>
            <tbody>
    `;
    
    // Строки для каждого учащегося
    appData.students.forEach((student, studentIndex) => {
        const scores = appData.results[studentIndex] || new Array(appData.tasks.length).fill(0);
        const totalScore = scores.reduce((sum, score) => sum + score, 0);
        const maxPossible = appData.tasks.reduce((sum, task) => sum + task.maxScore, 0);
        const percentage = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;
        const grade = calculateGrade(totalScore);
        const studentErrors = appData.errors.filter(e => e.studentIndex === studentIndex);
        
        tableHTML += `
            <tr class="student-row" data-student-index="${studentIndex}">
                <td class="student-name">
                    <strong>${escapeHtml(student)}</strong>
                    <div class="student-quick-info">
                        <small>ID: ${studentIndex + 1}</small>
                    </div>
                </td>
        `;
        
        // Ячейки с баллами за задания
        appData.tasks.forEach((task, taskIndex) => {
            const maxScore = task.maxScore;
            const score = scores[taskIndex] || 0;
            const scorePercentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
            const heatmapClass = `heatmap-${Math.floor(scorePercentage / 20) * 20}`;
            
            // Проверяем, есть ли ошибки по этому заданию
            const taskErrors = studentErrors.filter(e => e.taskIndex === taskIndex);
            const hasError = taskErrors.length > 0;
            const errorTooltip = hasError ? 
                `title="Ошибки: ${taskErrors.map(e => errorTypes[e.type]?.name).join(', ')}"` : '';
            
            tableHTML += `
                <td class="score-cell ${heatmapClass} ${hasError ? 'has-error' : ''}" 
                    ${errorTooltip}
                    onclick="quickEditScore(${studentIndex}, ${taskIndex})">
                    <div class="score-input-container">
                        <input type="number" 
                               min="0" 
                               max="${maxScore}" 
                               value="${score}"
                               data-student="${studentIndex}"
                               data-task="${taskIndex}"
                               onchange="updateResult(${studentIndex}, ${taskIndex}, this.value)"
                               class="score-input">
                        <div class="score-max">/${maxScore}</div>
                    </div>
                    ${hasError ? `
                        <div class="error-indicator" 
                             onclick="event.stopPropagation(); showTaskErrors(${studentIndex}, ${taskIndex})">
                            ⚠️
                        </div>
                    ` : ''}
                </td>
            `;
        });
        
        // Итоговые колонки
        tableHTML += `
                <td class="total-score">
                    <strong>${totalScore}</strong>
                    <small>/${maxPossible}</small>
                </td>
                <td class="grade-cell grade-${grade}">
                    <strong>${getGradeDisplay(grade)}</strong>
                </td>
                <td class="percentage-cell">
                    <div class="percentage-bar">
                        <div class="percentage-fill" style="width: ${percentage}%"></div>
                        <span class="percentage-text">${percentage.toFixed(1)}%</span>
                    </div>
                </td>
                <td class="errors-cell">
                    ${studentErrors.length > 0 ? `
                        <div class="errors-list">
                            ${studentErrors.slice(0, 3).map((error, idx) => `
                                <span class="error-badge error-${error.type}"
                                      title="${error.description || errorTypes[error.type]?.desc}"
                                      onclick="editError(${appData.errors.findIndex(e => 
                                        e.studentIndex === error.studentIndex && 
                                        e.taskIndex === error.taskIndex && 
                                        e.type === error.type
                                      )})">
                                    ${errorTypes[error.type]?.name || error.type}
                                    <small>(${error.taskIndex + 1})</small>
                                </span>
                            `).join('')}
                            ${studentErrors.length > 3 ? `
                                <span class="more-errors" 
                                      onclick="showStudentErrors(${studentIndex})">
                                    +${studentErrors.length - 3} ещё
                                </span>
                            ` : ''}
                        </div>
                    ` : '—'}
                </td>
                <td class="actions-cell">
                    <div class="action-buttons">
                        <button class="btn btn-sm" 
                                onclick="showStudentErrors(${studentIndex})"
                                title="Просмотреть ошибки">
                            📊
                        </button>
                        <button class="btn btn-sm" 
                                onclick="quickAddError(${studentIndex})"
                                title="Добавить ошибку">
                            ➕
                        </button>
                        ${studentErrors.length > 0 ? `
                            <button class="btn btn-sm btn-danger" 
                                    onclick="deleteAllStudentErrors(${studentIndex})"
                                    title="Удалить все ошибки">
                                🗑️
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
            <tfoot>
                <tr class="summary-row">
                    <td><strong>Среднее / Максимум</strong></td>
                    ${appData.tasks.map((task, taskIndex) => {
                        const maxScore = task.maxScore;
                        const avgScore = appData.results.reduce((sum, studentScores) => 
                            sum + (studentScores[taskIndex] || 0), 0) / appData.results.length;
                        const avgPercentage = maxScore > 0 ? (avgScore / maxScore) * 100 : 0;
                        return `
                            <td class="average-cell">
                                <div>${avgScore.toFixed(1)}</div>
                                <small>${avgPercentage.toFixed(0)}%</small>
                            </td>
                        `;
                    }).join('')}
                    <td colspan="4">
                        <div class="footer-stats">
                            <span>Средний балл: <strong>${calculateAverageScore().toFixed(1)}</strong></span>
                            <span>Успеваемость: <strong>${calculateSuccessRate().toFixed(1)}%</strong></span>
                            <span>Качество: <strong>${calculateQualityRate().toFixed(1)}%</strong></span>
                        </div>
                    </td>
                </tr>
            </tfoot>
        </table>
    `;
    
    tableContainer.innerHTML = tableHTML;
    container.appendChild(tableContainer);
    
    // Форма добавления ошибок
    const errorFormDiv = document.createElement('div');
    errorFormDiv.className = 'error-form-container';
    errorFormDiv.innerHTML = `
        <h5>➕ Добавить новую ошибку</h5>
        <div class="error-form-grid">
            <div class="form-group">
                <label>Учащийся:</label>
                <select id="newErrorStudent" class="error-student-select">
                    ${appData.students.map((student, index) => 
                        `<option value="${index}">${escapeHtml(student)}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label>Задание:</label>
                <select id="newErrorTask" class="error-task-select">
                    ${appData.tasks.map((task, index) => 
                        `<option value="${index}">${index + 1}. ${escapeHtml(task.type)}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label>Тип ошибки:</label>
                <select id="newErrorType" class="error-type-select">
                    ${Object.entries(errorTypes).map(([key, data]) => 
                        `<option value="${key}">${data.name}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label>Описание:</label>
                <input type="text" id="newErrorDescription" 
                       class="error-description-input"
                       placeholder="Подробное описание ошибки...">
            </div>
            
            <div class="form-group">
                <label>Количество:</label>
                <input type="number" id="newErrorCount" 
                       class="error-count-input"
                       min="1" value="1">
            </div>
            
            <div class="form-group form-group-full">
                <button class="btn btn-warning" onclick="addNewError()">
                    ➕ Добавить ошибку
                </button>
                <button class="btn" onclick="showQuickErrorAdd()">
                    ⚡ Быстрое добавление
                </button>
                <button class="btn" onclick="clearErrorForm()">
                    🗑️ Очистить форму
                </button>
            </div>
        </div>
        
        <div class="error-type-info" id="errorTypeInfo">
            <!-- Информация о выбранном типе ошибки будет обновляться динамически -->
        </div>
    `;
    
    container.appendChild(errorFormDiv);
    
    // Инициализируем обновление информации о типе ошибки
    updateErrorTypeInfo();
    document.getElementById('newErrorType').addEventListener('change', updateErrorTypeInfo);
    
    // Обновляем статистику ошибок в реальном времени
    updateErrorsStats();
}

/**
 * Рендерит настройки критериев по баллам
 * @returns {string} HTML-разметка блока критериев по баллам
 */
function renderPointsCriteria() {
    console.log('📊 Рендеринг критериев по баллам');
    return `
        <div class="criteria-settings">
            <h4>Критерии по баллам</h4>
            <div class="criteria-content">
                <p>Настройте пороговые значения для оценки по количеству баллов:</p>
                <div class="form-group">
                    <label for="points-excellent">Отлично (от):</label>
                    <input type="number" id="points-excellent" class="form-control" min="0" value="85">
                </div>
                <div class="form-group">
                    <label for="points-good">Хорошо (от):</label>
                    <input type="number" id="points-good" class="form-control" min="0" value="70">
                </div>
                <div class="form-group">
                    <label for="points-satisfactory">Удовлетворительно (от):</label>
                    <input type="number" id="points-satisfactory" class="form-control" min="0" value="50">
                </div>
                <button class="btn btn-primary btn-sm mt-2" onclick="savePointsCriteria()">Сохранить настройки</button>
            </div>
        </div>
    `;
}

/**
 * Рендерит настройки критериев по процентам
 * @returns {string} HTML-разметка блока критериев по процентам
 */
function renderPercentageCriteria() {
    console.log('📈 Рендеринг критериев по процентам');
    return `
        <div class="criteria-settings">
            <h4>Критерии по процентам</h4>
            <div class="criteria-content">
                <p>Настройте процентные пороги для оценивания:</p>
                <div class="form-group">
                    <label for="percentage-excellent">Отлично (≥ %):</label>
                    <input type="range" id="percentage-excellent" class="form-control-range" min="0" max="100" value="90">
                    <span id="percentage-excellent-value">90%</span>
                </div>
                <div class="form-group">
                    <label for="percentage-good">Хорошо (≥ %):</label>
                    <input type="range" id="percentage-good" class="form-control-range" min="0" max="100" value="75">
                    <span id="percentage-good-value">75%</span>
                </div>
                <div class="form-group">
                    <label for="percentage-satisfactory">Удовлетворительно (≥ %):</label>
                    <input type="range" id="percentage-satisfactory" class="form-control-range" min="0" max="100" value="60">
                    <span id="percentage-satisfactory-value">60%</span>
                </div>
                <div class="alert alert-info mt-2">
                    <small>Значения будут применяться ко всем заданиям автоматически</small>
                </div>
            </div>
        </div>
    `;
}

/**
 * Рендерит пользовательские критерии оценивания
 * @returns {string} HTML-разметка блока пользовательских критериев
 */
function renderCustomCriteria() {
    console.log('🎨 Рендеринг пользовательских критериев');
    return `
        <div class="criteria-settings">
            <h4>Пользовательские критерии</h4>
            <div class="criteria-content">
                <p>Создайте собственные критерии оценивания:</p>
                <div id="custom-criteria-list">
                    <div class="custom-criterion mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <input type="text" class="form-control form-control-sm" placeholder="Название критерия" value="Качество выполнения">
                            <select class="form-control form-control-sm ml-2">
                                <option value="points">Баллы</option>
                                <option value="percentage">Проценты</option>
                                <option value="text">Текстовый</option>
                            </select>
                            <input type="number" class="form-control form-control-sm ml-2" placeholder="Вес" value="1" min="0.1" step="0.1">
                            <button class="btn btn-danger btn-sm ml-2" onclick="removeCriterion(this)">×</button>
                        </div>
                    </div>
                </div>
                <button class="btn btn-success btn-sm" onclick="addCustomCriterion()">+ Добавить критерий</button>
                <div class="mt-3">
                    <label>Способ агрегации:</label>
                    <select class="form-control form-control-sm">
                        <option value="average">Среднее значение</option>
                        <option value="weighted">Взвешенная сумма</option>
                        <option value="min">Минимальное значение</option>
                        <option value="max">Максимальное значение</option>
                    </select>
                </div>
            </div>
        </div>
    `;
}

/**
 * Рендерит стандартные критерии оценивания
 * @returns {string} HTML-разметка блока стандартных критериев
 */
function renderStandardCriteria() {
    console.log('🏛️ Рендеринг стандартных критериев');
    return `
        <div class="criteria-settings">
            <h4>Стандартные критерии</h4>
            <div class="criteria-content">
                <p>Используются стандартные настройки оценивания.</p>
                <ul class="list-group">
                    <li class="list-group-item">5-балльная система (2-5)</li>
                    <li class="list-group-item">Порог успешности: 60%</li>
                    <li class="list-group-item">Автоматический пересчет в оценки</li>
                    <li class="list-group-item">Учет веса заданий</li>
                </ul>
                <div class="alert alert-warning mt-3">
                    <small><strong>Примечание:</strong> Эти настройки рекомендованы для большинства учебных курсов</small>
                </div>
            </div>
        </div>
    `;
}

/**
 * Инициализирует настройки критериев оценивания
 * @returns {void}
 */
function initCriteriaSettings() {
    console.log('⚙️ Инициализация настроек критериев...');
    
    // Инициализация обработчиков событий
    const initPercentageSliders = () => {
        const sliders = ['percentage-excellent', 'percentage-good', 'percentage-satisfactory'];
        sliders.forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            const valueSpan = document.getElementById(sliderId + '-value');
            if (slider && valueSpan) {
                slider.addEventListener('input', function() {
                    valueSpan.textContent = this.value + '%';
                });
            }
        });
    };
    
    // Инициализация после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPercentageSliders);
    } else {
        initPercentageSliders();
    }
    
    // Загрузка сохраненных настроек
    setTimeout(() => {
        const savedCriteria = localStorage.getItem('educationAnalytics_criteriaSettings');
        if (savedCriteria) {
            console.log('📂 Загружены сохраненные настройки критериев');
            try {
                const settings = JSON.parse(savedCriteria);
                // Применение загруженных настроек
                applyCriteriaSettings(settings);
            } catch (e) {
                console.error('Ошибка при загрузке настроек:', e);
            }
        }
    }, 100);
}

// Вспомогательные функции для работы с критериями
function savePointsCriteria() {
    const excellent = document.getElementById('points-excellent')?.value || 85;
    const good = document.getElementById('points-good')?.value || 70;
    const satisfactory = document.getElementById('points-satisfactory')?.value || 50;
    
    const settings = {
        type: 'points',
        values: { excellent, good, satisfactory },
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('educationAnalytics_criteriaSettings', JSON.stringify(settings));
    console.log('💾 Настройки критериев по баллам сохранены:', settings);
    showNotification('Настройки сохранены успешно!', 'success');
}

function addCustomCriterion() {
    const container = document.getElementById('custom-criteria-list');
    if (!container) return;
    
    const newCriterion = document.createElement('div');
    newCriterion.className = 'custom-criterion mb-3';
    newCriterion.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <input type="text" class="form-control form-control-sm" placeholder="Название критерия">
            <select class="form-control form-control-sm ml-2">
                <option value="points">Баллы</option>
                <option value="percentage">Проценты</option>
                <option value="text">Текстовый</option>
            </select>
            <input type="number" class="form-control form-control-sm ml-2" placeholder="Вес" value="1" min="0.1" step="0.1">
            <button class="btn btn-danger btn-sm ml-2" onclick="removeCriterion(this)">×</button>
        </div>
    `;
    
    container.appendChild(newCriterion);
}

function removeCriterion(button) {
    const criterion = button.closest('.custom-criterion');
    if (criterion) {
        criterion.remove();
    }
}

function applyCriteriaSettings(settings) {
    console.log('Применение настроек критериев:', settings);
    // Здесь можно добавить логику применения настроек
}

function showNotification(message, type = 'info') {
    // Простая реализация уведомлений
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="close" onclick="this.parentElement.remove()">
            <span>&times;</span>
        </button>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// 5. РЕНДЕР НАСТРОЕК КРИТЕРИЕВ (новая функция)
function renderCriteriaSettings() {
    const container = document.getElementById('criteriaSettingsContainer');
    if (!container) return;
    
    // Определяем тип системы оценивания
    const criteriaType = appData.test.criteriaType || 'points';
    const criteriaSystem = appData.test.criteriaSystem || 'standard';
    
    let html = '';
    
    switch(criteriaType) {
        case 'percentage':
            html = renderPercentageCriteria();
            break;
        case 'points':
            html = renderPointsCriteria();
            break;
        case 'custom':
            html = renderCustomCriteria();
            break;
        default:
            html = renderStandardCriteria();
    }
    
    container.innerHTML = html;
    
    // Инициализируем взаимодействие
    initCriteriaSettings();
}

// 6. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ RENDERALL

// Обновление всей аналитики
function updateAnalytics() {
    try {
        updateKPIDashboard();
        updateTaxonomyAnalysis();
        updateErrorsAnalysis();
        updatePersonalAnalysis();
        showSmartRecommendations();
        
        const workType = appData.test.workType;
        switch(workType) {
            case 'vpr':
                updateVPRAnalysis();
                break;
            case 'func_literacy':
                updateLiteracyAnalysis();
                break;
            case 'oge':
            case 'ege':
                updateGIAnalysis();
                break;
            case 'psychology':
                updatePsychologyAnalysis();
                break;
        }
    } catch (error) {
        console.error('Ошибка в updateAnalytics:', error);
    }
}

// Обновление всей визуализации
function updateVisualization() {
    try {
        // Обновляем основные графики
        updateGradesChart();
        updateComplexityChart();
        updateSolvabilityChart();
        updateHeatmap();
        
        // Обновляем специализированные графики
        const workType = appData.test.workType;
        if (workType === 'psychology' && document.getElementById('psychologyProfileChart')) {
            updatePsychologyVisualization();
        }
    } catch (error) {
        console.error('Ошибка в updateVisualization:', error);
    }
}

// Обновление всех графиков
function updateAllCharts() {
    if (window.gradesChartInstance) {
        window.gradesChartInstance.destroy();
    }
    if (window.complexityChartInstance) {
        window.complexityChartInstance.destroy();
    }
    if (window.solvabilityChartInstance) {
        window.solvabilityChartInstance.destroy();
    }
    
    setTimeout(() => {
        try {
            initGradesChart();
            initComplexityChart();
            initSolvabilityChart();
            initHeatmap();
        } catch (error) {
            console.error('Ошибка при инициализации графиков:', error);
        }
    }, 300);
}

// ==================== УТИЛИТЫ ДЛЯ РЕНДЕРИНГА ====================

// Экранирование HTML для безопасности
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Получение отображения оценки с учетом системы
function getGradeDisplay(gradeValue) {
    const system = appData.test.criteriaSystem || 'standard';
    
    if (system === 'custom' && appData.test.customCriteria) {
        const customGrade = appData.test.customCriteria.find(c => 
            gradeValue >= c.min && gradeValue <= c.max
        );
        return customGrade ? customGrade.name : gradeValue;
    }
    
    const descriptions = {
        '1': '1 (Очень плохо)',
        '2': '2 (Неудовлетворительно)',
        '3': '3 (Удовлетворительно)',
        '4': '4 (Хорошо)',
        '5': '5 (Отлично)'
    };
    
    return descriptions[gradeValue] || gradeValue;
}

// Обновление статистики заданий
function updateTasksStatistics() {
    appData.tasks.forEach((task, taskIndex) => {
        const completionElement = document.getElementById(`taskCompletion${taskIndex}`);
        const errorsElement = document.getElementById(`taskErrors${taskIndex}`);
        
        if (completionElement) {
            const maxScore = task.maxScore;
            const totalScore = appData.results.reduce((sum, studentScores) => 
                sum + (studentScores[taskIndex] || 0), 0);
            const completion = maxScore > 0 ? 
                (totalScore / (maxScore * appData.results.length)) * 100 : 0;
            
            completionElement.textContent = `${completion.toFixed(1)}%`;
            completionElement.style.color = 
                completion >= 80 ? '#27ae60' : 
                completion >= 60 ? '#f39c12' : '#e74c3c';
        }
        
        if (errorsElement) {
            const taskErrors = appData.errors.filter(e => e.taskIndex === taskIndex);
            errorsElement.textContent = taskErrors.length;
            errorsElement.style.color = taskErrors.length > 0 ? '#e74c3c' : '#27ae60';
        }
    });
}

// Обновление статистики ошибок
function updateErrorsStats() {
    const errorStats = document.querySelectorAll('.error-stats-indicator');
    errorStats.forEach(element => {
        const studentIndex = parseInt(element.dataset.studentIndex);
        const taskIndex = parseInt(element.dataset.taskIndex);
        
        if (!isNaN(studentIndex) && !isNaN(taskIndex)) {
            const errors = appData.errors.filter(e => 
                e.studentIndex === studentIndex && e.taskIndex === taskIndex
            );
            element.textContent = errors.length > 0 ? '⚠️' : '';
            element.title = errors.length > 0 ? 
                `${errors.length} ошибок` : 'Нет ошибок';
        }
    });
}
// render.js

class Renderer {
    /**
     * Генерация полей стандартного задания
     * @param {Object} options - Настройки задания
     * @param {string} options.taskType - Тип задания (multiple_choice, single_choice, matching)
     * @param {string} options.question - Вопрос
     * @param {Array} options.options - Варианты ответов (для multiple/single choice)
     * @param {Array} options.pairs - Пары для сопоставления (для matching)
     * @param {string} options.correctAnswer - Правильный ответ
     * @returns {HTMLElement} Контейнер с полями
     */
    renderStandardTaskFields(options = {}) {
        const container = document.createElement('div');
        container.className = 'standard-task-fields';
        
        // Общие поля для всех типов заданий
        const typeSelect = this.createSelectField('taskType', 'Тип задания', [
            {value: 'multiple_choice', text: 'Множественный выбор'},
            {value: 'single_choice', text: 'Одиночный выбор'},
            {value: 'matching', text: 'Сопоставление'}
        ], options.taskType);
        
        const questionField = this.createTextField(
            'question', 
            'Вопрос', 
            options.question || ''
        );
        
        container.appendChild(typeSelect);
        container.appendChild(questionField);
        
        // Динамические поля в зависимости от типа задания
        const dynamicContainer = document.createElement('div');
        dynamicContainer.className = 'dynamic-fields';
        container.appendChild(dynamicContainer);
        
        // Обработчик изменения типа задания
        typeSelect.querySelector('select').addEventListener('change', (e) => {
            this.updateDynamicFields(e.target.value, dynamicContainer, options);
        });
        
        // Инициализация полей при первой загрузке
        const initialType = options.taskType || 'multiple_choice';
        this.updateDynamicFields(initialType, dynamicContainer, options);
        
        return container;
    }
    
    /**
     * Обновление динамических полей в зависимости от типа задания
     * @private
     */
    updateDynamicFields(taskType, container, options) {
        container.innerHTML = '';
        
        switch(taskType) {
            case 'multiple_choice':
            case 'single_choice':
                this.renderChoiceFields(container, options);
                break;
            case 'matching':
                this.renderMatchingFields(container, options);
                break;
        }
    }
    
    /**
     * Генерация полей для заданий с выбором ответа
     * @private
     */
    renderChoiceFields(container, options) {
        const optionsLabel = document.createElement('label');
        optionsLabel.textContent = 'Варианты ответов (каждый с новой строки):';
        
        const optionsTextarea = document.createElement('textarea');
        optionsTextarea.name = 'options';
        optionsTextarea.rows = 5;
        optionsTextarea.placeholder = 'Вариант 1\nВариант 2\nВариант 3';
        
        if (options.options && Array.isArray(options.options)) {
            optionsTextarea.value = options.options.join('\n');
        }
        
        const answerLabel = document.createElement('label');
        answerLabel.textContent = 'Правильный ответ:';
        
        const answerInput = document.createElement('input');
        answerInput.type = 'text';
        answerInput.name = 'correctAnswer';
        answerInput.placeholder = 'Введите правильный вариант';
        answerInput.value = options.correctAnswer || '';
        
        container.appendChild(optionsLabel);
        container.appendChild(optionsTextarea);
        container.appendChild(answerLabel);
        container.appendChild(answerInput);
    }
    
    /**
     * Генерация полей для заданий на сопоставление
     * @private
     */
    renderMatchingFields(container, options) {
        const pairsLabel = document.createElement('label');
        pairsLabel.textContent = 'Пары для сопоставления (формат: ключ=значение, каждая пара с новой строки):';
        
        const pairsTextarea = document.createElement('textarea');
        pairsTextarea.name = 'pairs';
        pairsTextarea.rows = 5;
        pairsTextarea.placeholder = 'Термин1=Определение1\nТермин2=Определение2';
        
        if (options.pairs && Array.isArray(options.pairs)) {
            pairsTextarea.value = options.pairs.map(pair => `${pair.key}=${pair.value}`).join('\n');
        }
        
        container.appendChild(pairsLabel);
        pairsTextarea.appendChild(pairsTextarea);
    }
    
    /**
     * Создание поля выбора (select)
     * @private
     */
    createSelectField(name, label, items, selectedValue) {
        const container = document.createElement('div');
        container.className = 'form-field';
        
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        
        const select = document.createElement('select');
        select.name = name;
        
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.value;
            option.textContent = item.text;
            if (item.value === selectedValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        container.appendChild(labelEl);
        container.appendChild(select);
        
        return container;
    }
    
    /**
     * Создание текстового поля
     * @private
     */
    createTextField(name, label, value) {
        const container = document.createElement('div');
        container.className = 'form-field';
        
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.name = name;
        input.value = value;
        
        container.appendChild(labelEl);
        container.appendChild(input);
        
        return container;
    }
    
    /**
     * Получение данных из сгенерированных полей
     * @param {HTMLElement} container - Контейнер с полями
     * @returns {Object} Данные задания
     */
    getStandardTaskData(container) {
        const data = {
            taskType: container.querySelector('[name="taskType"]').value,
            question: container.querySelector('[name="question"]').value
        };
        
        const taskType = data.taskType;
        
        if (taskType === 'multiple_choice' || taskType === 'single_choice') {
            const optionsText = container.querySelector('[name="options"]').value;
            data.options = optionsText.split('\n').filter(opt => opt.trim() !== '');
            data.correctAnswer = container.querySelector('[name="correctAnswer"]').value;
        } else if (taskType === 'matching') {
            const pairsText = container.querySelector('[name="pairs"]').value;
            data.pairs = pairsText.split('\n')
                .filter(pair => pair.trim() !== '')
                .map(pair => {
                    const [key, value] = pair.split('=');
                    return {key: key?.trim(), value: value?.trim()};
                });
        }
        
        return data;
    }
}

// Экспорт Renderer, если используется модульная система
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}

// Глобальная функция для совместимости
function renderStandardTaskFields(task, index) {
    // Простая заглушка для совместимости
    const renderer = new Renderer();
    const container = renderer.renderStandardTaskFields({
        taskType: task.taskType || 'multiple_choice',
        question: task.question || '',
        options: task.options || [],
        correctAnswer: task.correctAnswer || '',
        pairs: task.pairs || []
    });
    return container.outerHTML;
}

// Экспортируем остальные нужные функции
window.renderStandardTaskFields = renderStandardTaskFields;
window.renderAll = renderAll;
window.renderTestSettings = renderTestSettings;
window.renderTasks = renderTasks;
window.renderStudents = renderStudents;
window.renderResults = renderResults;

// Экспортируем функцию для глобального использования
window.renderAll = renderAll;
// =============================================
// МОДУЛЬ КОНСТРУКТОРА ЗАДАНИЙ (Task Builder)
// =============================================

class TaskBuilder {
    constructor() {
        this.currentTask = null;
        this.taskType = 'choice';
        this.taskLibrary = [];
        this.categories = [];
        this.currentCategory = 'all';
        this.previewMode = 'desktop';
        this.aiSuggestions = [];
        this.variants = [];
        
        this.init();
    }
    
    init() {
        this.loadLibrary();
        this.loadCategories();
        this.setupEventListeners();
        this.setupMathEditor();
        this.initializeEditor();
        this.updateStats();
    }
    
    setupEventListeners() {
        // Слушатели для редактора
        document.getElementById('taskContent')?.addEventListener('input', () => {
            this.updatePreview();
            this.updateStats();
            this.autoSave();
        });
        
        document.getElementById('taskTitle')?.addEventListener('input', () => {
            this.updatePreview();
            this.updateStats();
            this.autoSave();
        });
        
        // Слушатели для сложности
        document.getElementById('complexitySlider')?.addEventListener('input', (e) => {
            this.updateComplexity(e.target.value);
        });
        
        // Слушатель для поиска
        document.getElementById('librarySearch')?.addEventListener('input', () => {
            this.searchTasks();
        });
        
        // Слушатель для фильтров
        document.getElementById('subjectFilter')?.addEventListener('change', () => {
            this.filterTasks();
        });
        
        document.getElementById('gradeFilter')?.addEventListener('change', () => {
            this.filterTasks();
        });
    }
    
    setupMathEditor() {
        // Инициализация математического редактора
        if (typeof MathJax !== 'undefined') {
            MathJax.Hub.Config({
                tex2jax: {
                    inlineMath: [['$', '$'], ['\\(', '\\)']],
                    displayMath: [['$$', '$$'], ['\\[', '\\]']],
                    processEscapes: true
                },
                CommonHTML: { linebreaks: { automatic: true } },
                "HTML-CSS": { linebreaks: { automatic: true } },
                SVG: { linebreaks: { automatic: true } }
            });
        }
    }
    
    initializeEditor() {
        this.currentTask = {
            id: this.generateId(),
            title: '',
            content: '',
            type: 'choice',
            complexity: 2,
            maxScore: 1,
            timeLimit: 5,
            taxonomyLevel: 2,
            subject: '',
            grade: '',
            topic: '',
            keywords: [],
            options: [],
            correctAnswers: [],
            matchingPairs: [],
            sequenceItems: [],
            explanation: '',
            hints: [],
            metadata: {
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                version: '1.0',
                author: '',
                license: 'CC BY-NC-SA'
            },
            statistics: {
                views: 0,
                uses: 0,
                avgScore: 0,
                difficulty: 0
            }
        };
        
        // Инициализируем редактор по умолчанию
        this.selectTaskType('choice');
        this.updatePreview();
    }
    
    // ==================== ОСНОВНЫЕ ФУНКЦИИ ====================
    
    selectTaskType(type) {
        this.taskType = type;
        this.currentTask.type = type;
        
        // Обновляем UI
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.type-btn[data-type="${type}"]`)?.classList.add('active');
        
        // Обновляем мета-информацию
        document.getElementById('taskType').textContent = `Тип: ${this.getTypeName(type)}`;
        
        // Показываем/скрываем соответствующие поля
        this.updateDynamicFields();
        
        // Добавляем пример для выбранного типа
        this.addExampleForType(type);
    }
    
    getTypeName(type) {
        const names = {
            'choice': 'Выбор ответа',
            'short': 'Краткий ответ',
            'extended': 'Развернутый ответ',
            'matching': 'Соответствие',
            'sequence': 'Последовательность',
            'open': 'Открытый вопрос'
        };
        return names[type] || 'Неизвестный';
    }
    
    updateDynamicFields() {
        const dynamicFields = document.getElementById('dynamicFields');
        if (!dynamicFields) return;
        
        let html = '';
        
        switch (this.taskType) {
            case 'choice':
                html = `
                    <div class="options-section active">
                        <div class="section-header">
                            <h4><i class="fas fa-list-ul"></i> Варианты ответов</h4>
                            <button class="btn btn-sm btn-outline" onclick="taskBuilder.addOption()">
                                <i class="fas fa-plus"></i> Добавить вариант
                            </button>
                        </div>
                        <div class="options-container" id="optionsContainer">
                            ${this.renderOptions()}
                        </div>
                        <div class="options-settings">
                            <label class="setting-item">
                                <input type="checkbox" id="shuffleOptions" checked onchange="taskBuilder.updateSettings()">
                                Перемешивать варианты
                            </label>
                            <label class="setting-item">
                                <input type="checkbox" id="multipleAnswers" onchange="taskBuilder.toggleMultipleAnswers()">
                                Несколько правильных ответов
                            </label>
                        </div>
                    </div>
                `;
                document.getElementById('optionsSection')?.style.setProperty('display', 'block');
                document.getElementById('matchingSection')?.style.setProperty('display', 'none');
                document.getElementById('sequenceSection')?.style.setProperty('display', 'none');
                break;
                
            case 'matching':
                html = `
                    <div class="matching-section active">
                        <div class="section-header">
                            <h4><i class="fas fa-exchange-alt"></i> Пары соответствия</h4>
                            <button class="btn btn-sm btn-outline" onclick="taskBuilder.addMatchingPair()">
                                <i class="fas fa-plus"></i> Добавить пару
                            </button>
                        </div>
                        <div class="matching-container" id="matchingContainer">
                            ${this.renderMatchingPairs()}
                        </div>
                    </div>
                `;
                document.getElementById('optionsSection')?.style.setProperty('display', 'none');
                document.getElementById('matchingSection')?.style.setProperty('display', 'block');
                document.getElementById('sequenceSection')?.style.setProperty('display', 'none');
                break;
                
            case 'sequence':
                html = `
                    <div class="sequence-section active">
                        <div class="section-header">
                            <h4><i class="fas fa-list-ol"></i> Элементы последовательности</h4>
                            <button class="btn btn-sm btn-outline" onclick="taskBuilder.addSequenceItem()">
                                <i class="fas fa-plus"></i> Добавить элемент
                            </button>
                        </div>
                        <div class="sequence-container" id="sequenceContainer">
                            ${this.renderSequenceItems()}
                        </div>
                    </div>
                `;
                document.getElementById('optionsSection')?.style.setProperty('display', 'none');
                document.getElementById('matchingSection')?.style.setProperty('display', 'none');
                document.getElementById('sequenceSection')?.style.setProperty('display', 'block');
                break;
                
            default:
                document.getElementById('optionsSection')?.style.setProperty('display', 'none');
                document.getElementById('matchingSection')?.style.setProperty('display', 'none');
                document.getElementById('sequenceSection')?.style.setProperty('display', 'none');
        }
        
        dynamicFields.innerHTML = html;
    }
    
    addExampleForType(type) {
        const editor = document.getElementById('taskContent');
        if (!editor || editor.textContent.trim() !== '') return;
        
        const examples = {
            'choice': `<p>Выберите правильный ответ:</p>
                      <p>Сколько будет 2 + 2?</p>`,
            'short': `<p>Решите уравнение: 3x + 5 = 17</p>
                     <p>Ответ: x = _____</p>`,
            'extended': `<p>Объясните, почему вода кипит при 100°C при нормальном атмосферном давлении.</p>
                        <p>В ответе укажите физические законы и принципы.</p>`,
            'matching': `<p>Установите соответствие между учеными и их открытиями:</p>
                        <p>Соедините левый и правый столбцы.</p>`,
            'sequence': `<p>Расположите события в хронологическом порядке:</p>
                        <p>Пронумеруйте события от 1 до 5.</p>`,
            'open': `<p>Как вы думаете, какое влияние оказало изобретение интернета на современное общество?</p>
                    <p>Приведите аргументы и примеры.</p>`
        };
        
        if (examples[type]) {
            editor.innerHTML = examples[type];
            this.updatePreview();
        }
    }
    
    // ==================== РАБОТА С ВАРИАНТАМИ ====================
    
    addOption() {
        const optionId = this.generateId();
        this.currentTask.options.push({
            id: optionId,
            text: '',
            isCorrect: false,
            explanation: ''
        });
        
        this.updateDynamicFields();
        this.updatePreview();
    }
    
    renderOptions() {
        return this.currentTask.options.map((option, index) => `
            <div class="option-item" data-id="${option.id}">
                <input type="${this.currentTask.type === 'choice' ? 'radio' : 'checkbox'}" 
                       name="correctAnswer" 
                       ${option.isCorrect ? 'checked' : ''}
                       onchange="taskBuilder.toggleCorrectAnswer('${option.id}')">
                <input type="text" 
                       class="option-text" 
                       value="${option.text}"
                       placeholder="Вариант ответа ${index + 1}"
                       oninput="taskBuilder.updateOptionText('${option.id}', this.value)">
                <button class="btn btn-sm btn-danger" onclick="taskBuilder.removeOption('${option.id}')">
                    <i class="fas fa-times"></i>
                </button>
                <button class="btn btn-sm btn-outline" onclick="taskBuilder.addExplanation('${option.id}')" 
                        title="Добавить объяснение">
                    <i class="fas fa-comment"></i>
                </button>
            </div>
        `).join('');
    }
    
    updateOptionText(optionId, text) {
        const option = this.currentTask.options.find(o => o.id === optionId);
        if (option) {
            option.text = text;
            this.updatePreview();
        }
    }
    
    toggleCorrectAnswer(optionId) {
        const option = this.currentTask.options.find(o => o.id === optionId);
        if (option) {
            // Если одиночный выбор, сбрасываем все остальные
            if (this.currentTask.type === 'choice') {
                this.currentTask.options.forEach(o => o.isCorrect = false);
            }
            option.isCorrect = !option.isCorrect;
            this.updatePreview();
        }
    }
    
    removeOption(optionId) {
        this.currentTask.options = this.currentTask.options.filter(o => o.id !== optionId);
        this.updateDynamicFields();
        this.updatePreview();
    }
    
    // ==================== СООТВЕТСТВИЯ ====================
    
    addMatchingPair() {
        this.currentTask.matchingPairs.push({
            id: this.generateId(),
            left: '',
            right: ''
        });
        this.updateDynamicFields();
    }
    
    renderMatchingPairs() {
        return this.currentTask.matchingPairs.map((pair, index) => `
            <div class="matching-pair" data-id="${pair.id}">
                <input type="text" 
                       value="${pair.left}"
                       placeholder="Левое значение ${index + 1}"
                       oninput="taskBuilder.updateMatchingPair('${pair.id}', 'left', this.value)">
                <div class="pair-arrow">↔</div>
                <input type="text" 
                       value="${pair.right}"
                       placeholder="Правое значение ${index + 1}"
                       oninput="taskBuilder.updateMatchingPair('${pair.id}', 'right', this.value)">
                <button class="btn btn-sm btn-danger" onclick="taskBuilder.removeMatchingPair('${pair.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
    
    updateMatchingPair(pairId, side, value) {
        const pair = this.currentTask.matchingPairs.find(p => p.id === pairId);
        if (pair) {
            pair[side] = value;
            this.updatePreview();
        }
    }
    
    removeMatchingPair(pairId) {
        this.currentTask.matchingPairs = this.currentTask.matchingPairs.filter(p => p.id !== pairId);
        this.updateDynamicFields();
        this.updatePreview();
    }
    
    // ==================== ПОСЛЕДОВАТЕЛЬНОСТЬ ====================
    
    addSequenceItem() {
        this.currentTask.sequenceItems.push({
            id: this.generateId(),
            text: '',
            correctPosition: this.currentTask.sequenceItems.length + 1
        });
        this.updateDynamicFields();
    }
    
    renderSequenceItems() {
        return this.currentTask.sequenceItems.map((item, index) => `
            <div class="sequence-item" data-id="${item.id}">
                <div class="item-number">${index + 1}</div>
                <input type="text" 
                       class="item-content"
                       value="${item.text}"
                       placeholder="Элемент последовательности ${index + 1}"
                       oninput="taskBuilder.updateSequenceItem('${item.id}', this.value)">
                <button class="btn btn-sm btn-danger" onclick="taskBuilder.removeSequenceItem('${item.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
    
    updateSequenceItem(itemId, text) {
        const item = this.currentTask.sequenceItems.find(i => i.id === itemId);
        if (item) {
            item.text = text;
            this.updatePreview();
        }
    }
    
    removeSequenceItem(itemId) {
        this.currentTask.sequenceItems = this.currentTask.sequenceItems.filter(i => i.id !== itemId);
        // Обновляем позиции
        this.currentTask.sequenceItems.forEach((item, index) => {
            item.correctPosition = index + 1;
        });
        this.updateDynamicFields();
        this.updatePreview();
    }
    
    // ==================== ПРЕДПРОСМОТР ====================
    
    updatePreview() {
        const previewContent = document.getElementById('previewContent');
        if (!previewContent) return;
        
        const title = document.getElementById('taskTitle')?.value || 'Без названия';
        const content = document.getElementById('taskContent')?.innerHTML || '';
        const complexity = this.currentTask.complexity;
        const maxScore = document.getElementById('maxScore')?.value || 1;
        const timeLimit = document.getElementById('timeLimit')?.value || 5;
        
        let previewHtml = `
            <div class="preview-task">
                <div class="preview-header">
                    <h4>${this.escapeHtml(title)}</h4>
                    <div class="preview-meta">
                        <span class="preview-complexity" style="background: ${this.getComplexityColor(complexity)}">
                            Уровень ${complexity}
                        </span>
                        <span class="preview-score">${maxScore} баллов</span>
                        <span class="preview-time">${timeLimit} мин</span>
                    </div>
                </div>
                <div class="preview-body">
                    ${content}
        `;
        
        // Добавляем динамические элементы в зависимости от типа
        previewHtml += this.renderPreviewElements();
        
        previewHtml += `
                </div>
                <div class="preview-footer">
                    <div class="preview-stats">
                        <span>Символов: <strong>${this.countCharacters()}</strong></span>
                        <span>Слов: <strong>${this.countWords()}</strong></span>
                    </div>
                </div>
            </div>
        `;
        
        previewContent.innerHTML = previewHtml;
        
        // Обновляем MathJax
        if (typeof MathJax !== 'undefined') {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, previewContent]);
        }
        
        // Обновляем мета-информацию
        this.updateTaskMeta();
    }
    
    renderPreviewElements() {
        let html = '';
        
        switch (this.taskType) {
            case 'choice':
                if (this.currentTask.options.length > 0) {
                    html += '<div class="preview-options">';
                    this.currentTask.options.forEach((option, index) => {
                        html += `
                            <div class="preview-option ${option.isCorrect ? 'correct' : ''}">
                                <span class="option-marker">${String.fromCharCode(65 + index)}</span>
                                <span class="option-text">${this.escapeHtml(option.text)}</span>
                                ${option.isCorrect ? '<span class="correct-badge">✓</span>' : ''}
                            </div>
                        `;
                    });
                    html += '</div>';
                }
                break;
                
            case 'matching':
                if (this.currentTask.matchingPairs.length > 0) {
                    html += '<div class="preview-matching">';
                    html += '<div class="matching-table">';
                    html += '<div class="matching-header"><div>Левая колонка</div><div>Правая колонка</div></div>';
                    
                    this.currentTask.matchingPairs.forEach(pair => {
                        html += `
                            <div class="matching-row">
                                <div class="matching-left">${this.escapeHtml(pair.left)}</div>
                                <div class="matching-arrow">→</div>
                                <div class="matching-right">${this.escapeHtml(pair.right)}</div>
                            </div>
                        `;
                    });
                    
                    html += '</div></div>';
                }
                break;
                
            case 'sequence':
                if (this.currentTask.sequenceItems.length > 0) {
                    html += '<div class="preview-sequence">';
                    html += '<p>Расположите в правильном порядке:</p>';
                    html += '<div class="sequence-list">';
                    
                    this.currentTask.sequenceItems.forEach((item, index) => {
                        html += `
                            <div class="sequence-item">
                                <span class="sequence-number">${index + 1}</span>
                                <span class="sequence-text">${this.escapeHtml(item.text)}</span>
                            </div>
                        `;
                    });
                    
                    html += '</div></div>';
                }
                break;
        }
        
        return html;
    }
    
    updateTaskMeta() {
        document.getElementById('taskComplexity').textContent = `Сложность: ${this.currentTask.complexity}`;
        document.getElementById('taskScore').textContent = `Баллы: ${document.getElementById('maxScore')?.value || 1}`;
        document.getElementById('taskTime').textContent = `Время: ${document.getElementById('timeLimit')?.value || 5} мин`;
        
        // Обновляем индикатор сложности
        const complexityIndicator = document.getElementById('complexityIndicator');
        if (complexityIndicator) {
            const dot = complexityIndicator.querySelector('.complexity-dot');
            const text = complexityIndicator.querySelector('span');
            if (dot) dot.style.background = this.getComplexityColor(this.currentTask.complexity);
            if (text) text.textContent = this.getComplexityName(this.currentTask.complexity);
        }
    }
    
    // ==================== СЛОЖНОСТЬ ====================
    
    updateComplexity(value) {
        this.currentTask.complexity = parseInt(value);
        
        // Обновляем описание сложности
        const descriptions = {
            1: 'Простой уровень - проверка базовых знаний и воспроизведения',
            2: 'Средний уровень - применение знаний в стандартных ситуациях',
            3: 'Сложный уровень - анализ, синтез и решение нестандартных задач',
            4: 'Высший уровень - творческие задания, оценка и прогнозирование'
        };
        
        const descElement = document.getElementById('complexityDescription');
        if (descElement) {
            descElement.textContent = descriptions[value] || 'Не указано';
        }
        
        this.updatePreview();
        this.updateTaskMeta();
    }
    
    getComplexityColor(level) {
        const colors = {
            1: '#27ae60',
            2: '#3498db',
            3: '#f39c12',
            4: '#e74c3c'
        };
        return colors[level] || '#3498db';
    }
    
    getComplexityName(level) {
        const names = {
            1: 'Простая',
            2: 'Средняя',
            3: 'Сложная',
            4: 'Очень сложная'
        };
        return names[level] || 'Не указана';
    }
    
    // ==================== ТАКСОНОМИЯ ====================
    
    setTaxonomyLevel(level) {
        this.currentTask.taxonomyLevel = level;
        
        // Обновляем UI
        document.querySelectorAll('.taxonomy-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.taxonomy-btn[data-level="${level}"]`)?.classList.add('active');
        
        // Автоматически обновляем сложность на основе таксономии
        if (level >= 5) this.updateComplexity(4);
        else if (level >= 4) this.updateComplexity(3);
        else if (level >= 3) this.updateComplexity(2);
        else this.updateComplexity(1);
    }
    
    // ==================== БИБЛИОТЕКА ====================
    
    loadLibrary() {
        try {
            const saved = localStorage.getItem('taskBuilderLibrary');
            if (saved) {
                this.taskLibrary = JSON.parse(saved);
                this.renderTaskList();
            }
        } catch (e) {
            console.error('Ошибка загрузки библиотеки:', e);
            this.taskLibrary = [];
        }
    }
    
    saveLibrary() {
        try {
            localStorage.setItem('taskBuilderLibrary', JSON.stringify(this.taskLibrary));
        } catch (e) {
            console.error('Ошибка сохранения библиотеки:', e);
        }
    }
    
    renderTaskList() {
        const taskList = document.getElementById('taskList');
        if (!taskList) return;
        
        if (this.taskLibrary.length === 0) {
            taskList.innerHTML = `
                <div class="empty-library">
                    <i class="fas fa-book-open" style="font-size: 3em; color: rgba(255,255,255,0.3); margin-bottom: 10px;"></i>
                    <p style="color: rgba(255,255,255,0.5); text-align: center;">Библиотека пуста</p>
                </div>
            `;
            return;
        }
        
        // Фильтруем задачи по категории и поиску
        let filteredTasks = this.taskLibrary;
        
        if (this.currentCategory !== 'all') {
            filteredTasks = filteredTasks.filter(task => 
                task.category === this.currentCategory
            );
        }
        
        const searchTerm = document.getElementById('librarySearch')?.value.toLowerCase();
        if (searchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(searchTerm) ||
                task.content.toLowerCase().includes(searchTerm) ||
                task.keywords?.some(kw => kw.toLowerCase().includes(searchTerm))
            );
        }
        
        // Фильтруем по предмету
        const subjectFilter = document.getElementById('subjectFilter')?.value;
        if (subjectFilter && subjectFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.subject === subjectFilter);
        }
        
        // Фильтруем по классу
        const gradeFilter = document.getElementById('gradeFilter')?.value;
        if (gradeFilter && gradeFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.grade === gradeFilter);
        }
        
        taskList.innerHTML = filteredTasks.map(task => `
            <div class="task-item" onclick="taskBuilder.loadTask('${task.id}')">
                <h5>${this.escapeHtml(task.title)}</h5>
                <p>${this.stripHtml(task.content).substring(0, 100)}...</p>
                <div class="task-meta">
                    <span>${this.getTypeName(task.type)}</span>
                    <span>Ур. ${task.complexity}</span>
                    <span>${task.maxScore} баллов</span>
                </div>
                <div class="task-actions">
                    <span class="task-date">${new Date(task.metadata.created).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
        
        // Обновляем статистику
        document.getElementById('totalTasks').textContent = this.taskLibrary.length;
        document.getElementById('usedTasks').textContent = this.taskLibrary.filter(t => t.statistics.uses > 0).length;
    }
    
    loadTask(taskId) {
        const task = this.taskLibrary.find(t => t.id === taskId);
        if (task) {
            this.currentTask = JSON.parse(JSON.stringify(task));
            
            // Загружаем данные в форму
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskContent').innerHTML = task.content;
            document.getElementById('maxScore').value = task.maxScore;
            document.getElementById('timeLimit').value = task.timeLimit;
            document.getElementById('taskSubject').value = task.subject;
            document.getElementById('taskGrade').value = task.grade;
            document.getElementById('taskTopic').value = task.topic;
            document.getElementById('taskKeywords').value = task.keywords?.join(', ') || '';
            
            // Обновляем сложность
            this.updateComplexity(task.complexity);
            
            // Обновляем таксономию
            this.setTaxonomyLevel(task.taxonomyLevel);
            
            // Выбираем тип задания
            this.selectTaskType(task.type);
            
            // Обновляем UI
            document.getElementById('editorTitle').textContent = task.title;
            
            showNotification('Задание загружено', 'success');
        }
    }
    
    // ==================== СОХРАНЕНИЕ ====================
    
    saveTask() {
        // Собираем данные из формы
        this.currentTask.title = document.getElementById('taskTitle')?.value || '';
        this.currentTask.content = document.getElementById('taskContent')?.innerHTML || '';
        this.currentTask.maxScore = parseInt(document.getElementById('maxScore')?.value) || 1;
        this.currentTask.timeLimit = parseInt(document.getElementById('timeLimit')?.value) || 5;
        this.currentTask.subject = document.getElementById('taskSubject')?.value || '';
        this.currentTask.grade = document.getElementById('taskGrade')?.value || '';
        this.currentTask.topic = document.getElementById('taskTopic')?.value || '';
        
        const keywords = document.getElementById('taskKeywords')?.value || '';
        this.currentTask.keywords = keywords.split(',').map(k => k.trim()).filter(k => k);
        
        // Проверяем обязательные поля
        if (!this.currentTask.title.trim()) {
            showNotification('Введите название задания', 'warning');
            return;
        }
        
        if (!this.currentTask.content.trim()) {
            showNotification('Введите текст задания', 'warning');
            return;
        }
        
        // Обновляем метаданные
        this.currentTask.metadata.modified = new Date().toISOString();
        
        // Проверяем, новое ли это задание
        const existingIndex = this.taskLibrary.findIndex(t => t.id === this.currentTask.id);
        
        if (existingIndex !== -1) {
            // Обновляем существующее
            this.taskLibrary[existingIndex] = this.currentTask;
            showNotification('Задание обновлено', 'success');
        } else {
            // Добавляем новое
            this.currentTask.id = this.generateId();
            this.currentTask.metadata.created = new Date().toISOString();
            this.taskLibrary.unshift(this.currentTask);
            showNotification('Задание сохранено в библиотеку', 'success');
        }
        
        // Сохраняем библиотеку
        this.saveLibrary();
        
        // Обновляем список
        this.renderTaskList();
        
        // Обновляем статистику
        this.updateStats();
        
        // Генерируем новое задание для редактирования
        this.initializeEditor();
    }
    
    saveTaskDraft() {
        // Автосохранение черновика
        this.currentTask.title = document.getElementById('taskTitle')?.value || '';
        this.currentTask.content = document.getElementById('taskContent')?.innerHTML || '';
        
        localStorage.setItem('taskBuilderDraft', JSON.stringify(this.currentTask));
        showNotification('Черновик сохранен', 'info');
    }
    
    autoSave() {
        // Дебаунс автосохранения
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => {
            this.saveTaskDraft();
        }, 3000);
    }
    
    // ==================== ПОИСК И ФИЛЬТРАЦИЯ ====================
    
    searchTasks() {
        this.renderTaskList();
    }
    
    filterTasks() {
        this.renderTaskList();
    }
    
    // ==================== ГЕНЕРАЦИЯ ВАРИАНТОВ ====================
    
    generateVariants() {
        const count = parseInt(document.getElementById('variantCount')?.value) || 10;
        const shuffleQuestions = document.getElementById('shuffleQuestions')?.checked;
        const shuffleAnswers = document.getElementById('shuffleAnswers')?.checked;
        const randomizeNumbers = document.getElementById('randomizeNumbers')?.checked;
        
        if (count > 100) {
            showNotification('Максимальное количество вариантов: 100', 'warning');
            return;
        }
        
        this.variants = [];
        
        for (let i = 0; i < count; i++) {
            const variant = JSON.parse(JSON.stringify(this.currentTask));
            variant.id = this.generateId();
            variant.variantNumber = i + 1;
            
            // Применяем настройки
            if (shuffleQuestions && variant.type === 'choice') {
                this.shuffleArray(variant.options);
            }
            
            if (shuffleAnswers && variant.type === 'choice') {
                variant.options.forEach(opt => {
                    if (opt.text.includes('{n}') && randomizeNumbers) {
                        const randomNum = Math.floor(Math.random() * 100) + 1;
                        opt.text = opt.text.replace(/{n}/g, randomNum);
                    }
                });
            }
            
            this.variants.push(variant);
        }
        
        showNotification(`Сгенерировано ${count} вариантов`, 'success');
        this.showVariantsPreview();
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    showVariantsPreview() {
        showModal('Предпросмотр вариантов', `
            <div style="max-height: 400px; overflow-y: auto;">
                <h4>Сгенерировано ${this.variants.length} вариантов</h4>
                <div class="variants-list">
                    ${this.variants.map(v => `
                        <div class="variant-item">
                            <h5>Вариант ${v.variantNumber}</h5>
                            <p>${v.title}</p>
                            <div class="variant-meta">
                                <span>${v.type}</span>
                                <span>${v.complexity} ур.</span>
                                <span>${v.maxScore} баллов</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="closeModal()">Закрыть</button>
                <button class="btn btn-primary" onclick="taskBuilder.exportVariants('docx')">Экспорт в Word</button>
                <button class="btn btn-success" onclick="taskBuilder.exportVariants('pdf')">Экспорт в PDF</button>
            </div>
        `);
    }
    
    // ==================== ЭКСПОРТ ====================
    
    exportTask(format) {
        const task = this.currentTask;
        
        switch (format) {
            case 'docx':
                this.exportToDocx(task);
                break;
            case 'pdf':
                this.exportToPdf(task);
                break;
            case 'html':
                this.exportToHtml(task);
                break;
            case 'json':
                this.exportToJson(task);
                break;
            case 'google':
                this.exportToGoogleDocs(task);
                break;
            case 'moodle':
                this.exportToMoodle(task);
                break;
        }
    }
    
    exportVariants(format) {
        if (this.variants.length === 0) {
            showNotification('Сначала сгенерируйте варианты', 'warning');
            return;
        }
        
        switch (format) {
            case 'docx':
                this.exportVariantsToDocx();
                break;
            case 'pdf':
                this.exportVariantsToPdf();
                break;
        }
    }
    
    exportToDocx(task) {
        // Генерация DOCX через html-docx-js
        const content = this.generateExportContent(task);
        const converted = htmlDocx.asBlob(content);
        
        const url = URL.createObjectURL(converted);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${task.title || 'задание'}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Задание экспортировано в DOCX', 'success');
    }
    
    exportToPdf(task) {
        // Генерация PDF через html2pdf
        const element = document.getElementById('previewContent');
        const opt = {
            margin: 1,
            filename: `${task.title || 'задание'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        html2pdf().set(opt).from(element).save();
        showNotification('Задание экспортировано в PDF', 'success');
    }
    
    generateExportContent(task) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${this.escapeHtml(task.title)}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .task-title { font-size: 18pt; font-weight: bold; margin-bottom: 20px; }
                    .task-content { margin-bottom: 20px; }
                    .task-meta { color: #666; font-size: 10pt; margin-bottom: 10px; }
                    .options-list { margin-left: 20px; }
                    .option-item { margin-bottom: 5px; }
                    .correct { font-weight: bold; color: #27ae60; }
                </style>
            </head>
            <body>
                <div class="task-title">${this.escapeHtml(task.title)}</div>
                <div class="task-meta">
                    Предмет: ${task.subject} | Класс: ${task.grade} | 
                    Сложность: ${task.complexity} | Баллов: ${task.maxScore}
                </div>
                <div class="task-content">${task.content}</div>
                ${this.generateExportElements(task)}
                ${task.explanation ? `<div class="explanation"><strong>Объяснение:</strong> ${task.explanation}</div>` : ''}
            </body>
            </html>
        `;
    }
    
    // ==================== AI АНАЛИЗ ====================
    
    runAIAnalysis() {
        const content = document.getElementById('taskContent')?.innerHTML || '';
        const text = this.stripHtml(content);
        
        if (!text.trim()) {
            showNotification('Введите текст задания для анализа', 'warning');
            return;
        }
        
        showLoading('AI анализирует задание...');
        
        // Имитация AI анализа
        setTimeout(() => {
            const analysis = this.performAIAnalysis(text);
            this.displayAIAnalysis(analysis);
            hideLoading();
        }, 1500);
    }
    
    performAIAnalysis(text) {
        // Простой анализ текста
        const wordCount = this.countWords(text);
        const charCount = this.countCharacters(text);
        const sentenceCount = text.split(/[.!?]+/).length - 1;
        const avgSentenceLength = wordCount / Math.max(sentenceCount, 1);
        
        let complexityScore = 1;
        let readability = 'Высокая';
        let suggestions = [];
        
        // Анализ сложности
        if (avgSentenceLength > 25) complexityScore = 3;
        else if (avgSentenceLength > 15) complexityScore = 2;
        
        // Анализ читаемости
        if (avgSentenceLength > 20) readability = 'Средняя';
        if (avgSentenceLength > 30) readability = 'Низкая';
        
        // Рекомендации
        if (wordCount < 20) {
            suggestions.push('Добавьте больше деталей в формулировку');
        }
        
        if (sentenceCount < 2) {
            suggestions.push('Разбейте на несколько предложений для лучшего понимания');
        }
        
        // Проверка на наличие чисел в задачах
        if (this.taskType === 'short' && !/\d/.test(text)) {
            suggestions.push('Добавьте числовые данные для решения');
        }
        
        return {
            wordCount,
            charCount,
            sentenceCount,
            avgSentenceLength,
            complexityScore,
            readability,
            suggestions,
            estimatedTime: Math.ceil(wordCount / 20) * 2, // Оценка времени выполнения
            qualityScore: Math.min(100, 80 + Math.random() * 20)
        };
    }
    
    displayAIAnalysis(analysis) {
        const aiContent = document.getElementById('aiAnalysis');
        if (!aiContent) return;
        
        aiContent.innerHTML = `
            <div class="ai-results">
                <div class="ai-metrics">
                    <div class="ai-metric">
                        <span class="metric-label">Читаемость:</span>
                        <span class="metric-value ${analysis.readability === 'Высокая' ? 'good' : analysis.readability === 'Средняя' ? 'warning' : 'bad'}">
                            ${analysis.readability}
                        </span>
                    </div>
                    <div class="ai-metric">
                        <span class="metric-label">Время выполнения:</span>
                        <span class="metric-value">~${analysis.estimatedTime} мин</span>
                    </div>
                    <div class="ai-metric">
                        <span class="metric-label">Качество:</span>
                        <span class="metric-value good">${analysis.qualityScore.toFixed(0)}/100</span>
                    </div>
                </div>
                
                <div class="ai-suggestions">
                    <h5>Рекомендации:</h5>
                    <ul>
                        ${analysis.suggestions.map(s => `<li>${s}</li>`).join('')}
                        ${analysis.suggestions.length === 0 ? '<li>Задание хорошо сформулировано!</li>' : ''}
                    </ul>
                </div>
                
                <div class="ai-stats">
                    <div class="stat">
                        <span>Слов:</span>
                        <strong>${analysis.wordCount}</strong>
                    </div>
                    <div class="stat">
                        <span>Предложений:</span>
                        <strong>${analysis.sentenceCount}</strong>
                    </div>
                    <div class="stat">
                        <span>Средняя длина:</span>
                        <strong>${analysis.avgSentenceLength.toFixed(1)} слов</strong>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ==================== СТАТИСТИКА ====================
    
    updateStats() {
        // Обновляем счетчики символов и слов
        const content = document.getElementById('taskContent')?.innerHTML || '';
        const text = this.stripHtml(content);
        
        document.getElementById('charCount').textContent = this.countCharacters(text);
        document.getElementById('wordCount').textContent = this.countWords(text);
        
        // Обновляем общую статистику
        const tasksCreated = this.taskLibrary.length;
        const avgComplexity = tasksCreated > 0 
            ? (this.taskLibrary.reduce((sum, t) => sum + t.complexity, 0) / tasksCreated).toFixed(1)
            : 0;
        
        document.getElementById('tasksCreated').textContent = tasksCreated;
        document.getElementById('avgComplexity').textContent = avgComplexity;
        
        // Обновляем график популярности
        this.updateStatsChart();
    }
    
    updateStatsChart() {
        const ctx = document.getElementById('taskStatsChart')?.getContext('2d');
        if (!ctx) return;
        
        // Уничтожаем предыдущий график если существует
        if (this.statsChart) {
            this.statsChart.destroy();
        }
        
        const complexityData = [0, 0, 0, 0];
        this.taskLibrary.forEach(task => {
            if (task.complexity >= 1 && task.complexity <= 4) {
                complexityData[task.complexity - 1]++;
            }
        });
        
        this.statsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Простая', 'Средняя', 'Сложная', 'Очень сложная'],
                datasets: [{
                    label: 'Количество заданий',
                    data: complexityData,
                    backgroundColor: [
                        '#27ae60',
                        '#3498db',
                        '#f39c12',
                        '#e74c3c'
                    ],
                    borderColor: [
                        '#219653',
                        '#2980b9',
                        '#e67e22',
                        '#c0392b'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
    
    // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
    
    generateId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }
    
    countCharacters(text) {
        return text.replace(/\s/g, '').length;
    }
    
    countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
    
    loadCategories() {
        // Загружаем категории из localStorage или создаем стандартные
        const saved = localStorage.getItem('taskBuilderCategories');
        if (saved) {
            this.categories = JSON.parse(saved);
        } else {
            this.categories = [
                { id: 'all', name: 'Все задания', count: 0 },
                { id: 'math', name: 'Математика', count: 0 },
                { id: 'physics', name: 'Физика', count: 0 },
                { id: 'chemistry', name: 'Химия', count: 0 },
                { id: 'biology', name: 'Биология', count: 0 },
                { id: 'literature', name: 'Литература', count: 0 },
                { id: 'history', name: 'История', count: 0 },
                { id: 'favorites', name: 'Избранное', count: 0 }
            ];
            this.saveCategories();
        }
        
        this.renderCategories();
    }
    
    renderCategories() {
        const categoryList = document.getElementById('categoryList');
        if (!categoryList) return;
        
        // Обновляем счетчики
        this.categories.forEach(category => {
            if (category.id === 'all') {
                category.count = this.taskLibrary.length;
            } else if (category.id === 'favorites') {
                category.count = this.taskLibrary.filter(t => t.metadata.favorite).length;
            } else {
                category.count = this.taskLibrary.filter(t => t.subject === category.id).length;
            }
        });
        
        categoryList.innerHTML = this.categories.map(category => `
            <div class="category-item ${this.currentCategory === category.id ? 'active' : ''}" 
                 onclick="taskBuilder.selectCategory('${category.id}')">
                <span>${category.name}</span>
                <span class="category-count">${category.count}</span>
            </div>
        `).join('');
    }
    
    selectCategory(categoryId) {
        this.currentCategory = categoryId;
        this.renderCategories();
        this.renderTaskList();
    }
    
    addNewCategory() {
        const name = prompt('Введите название новой категории:');
        if (name && name.trim()) {
            const id = name.toLowerCase().replace(/\s+/g, '_');
            this.categories.push({
                id,
                name: name.trim(),
                count: 0
            });
            this.saveCategories();
            this.renderCategories();
            showNotification('Категория добавлена', 'success');
        }
    }
    
    saveCategories() {
        localStorage.setItem('taskBuilderCategories', JSON.stringify(this.categories));
    }
    
    // ==================== UI ФУНКЦИИ ====================
    
    editorCommand(command) {
        document.execCommand(command, false, null);
        this.updatePreview();
    }
    
    insertMath() {
        const math = prompt('Введите математическую формулу (используйте LaTeX):\nПример: \\frac{1}{2} или x^{2} + y^{2} = r^{2}', '\\frac{1}{2}');
        if (math) {
            document.execCommand('insertHTML', false, `$$${math}$`);
            this.updatePreview();
        }
    }
    
    insertTable() {
        const rows = parseInt(prompt('Количество строк:', '3'));
        const cols = parseInt(prompt('Количество столбцов:', '3'));
        
        if (rows > 0 && cols > 0) {
            let table = '<table border="1" style="border-collapse: collapse; width: 100%;">';
            for (let i = 0; i < rows; i++) {
                table += '<tr>';
                for (let j = 0; j < cols; j++) {
                    table += `<td style="padding: 5px;">&nbsp;</td>`;
                }
                table += '</tr>';
            }
            table += '</table>';
            
            document.execCommand('insertHTML', false, table);
            this.updatePreview();
        }
    }
    
    insertImage() {
        const url = prompt('Введите URL изображения:', 'https://via.placeholder.com/400x200');
        if (url) {
            const alt = prompt('Введите описание изображения:', 'Изображение');
            const html = `<img src="${url}" alt="${alt}" style="max-width: 100%; height: auto; border-radius: 5px;">`;
            document.execCommand('insertHTML', false, html);
            this.updatePreview();
        }
    }
    
    togglePreviewMode() {
        const previewContent = document.getElementById('previewContent');
        if (!previewContent) return;
        
        this.previewMode = this.previewMode === 'desktop' ? 'mobile' : 'desktop';
        
        if (this.previewMode === 'mobile') {
            previewContent.style.maxWidth = '400px';
            previewContent.style.margin = '0 auto';
            previewContent.style.border = '1px solid #ddd';
            previewContent.style.borderRadius = '10px';
            previewContent.style.padding = '15px';
        } else {
            previewContent.style.maxWidth = 'none';
            previewContent.style.margin = '0';
            previewContent.style.border = 'none';
            previewContent.style.borderRadius = '0';
            previewContent.style.padding = '0';
        }
    }
    
    // ==================== AI WIZARD ====================
    
    showAIWizard() {
        document.getElementById('aiWizardModal').style.display = 'flex';
        this.currentAIStep = 1;
        this.updateAIWizard();
    }
    
    updateAIWizard() {
        document.querySelectorAll('.ai-step').forEach(step => {
            step.classList.remove('active');
        });
        
        const currentStep = document.querySelector(`.ai-step[data-step="${this.currentAIStep}"]`);
        if (currentStep) {
            currentStep.classList.add('active');
        }
    }
    
    nextAIStep() {
        if (this.currentAIStep < 3) {
            this.currentAIStep++;
            this.updateAIWizard();
            this.updateAIPreview();
        }
    }
    
    prevAIStep() {
        if (this.currentAIStep > 1) {
            this.currentAIStep--;
            this.updateAIWizard();
            this.updateAIPreview();
        }
    }
    
    updateAIPreview() {
        const goal = document.getElementById('aiGoal')?.value;
        const type = document.querySelector('.ai-type-btn.active')?.dataset.type;
        const complexity = document.getElementById('aiComplexity')?.value;
        
        let preview = '<h4>Предпросмотр задания:</h4>';
        
        if (goal) {
            preview += `<p><strong>Цель:</strong> ${goal}</p>`;
        }
        
        if (type) {
            preview += `<p><strong>Тип:</strong> ${this.getTypeName(type)}</p>`;
        }
        
        if (complexity) {
            preview += `<p><strong>Сложность:</strong> Уровень ${complexity}</p>`;
        }
        
        if (goal && type) {
            // Генерируем пример задания на основе цели и типа
            preview += '<hr>';
            preview += '<p><strong>Пример задания:</strong></p>';
            preview += this.generateAIExample(goal, type, complexity);
        }
        
        document.getElementById('aiPreview').innerHTML = preview;
    }
    
    generateAIExample(goal, type, complexity) {
        // Простая генерация примера на основе цели
        const examples = {
            'choice': `На основе цели "${goal}", сформулирован вопрос с выбором ответа.`,
            'short': `Решите задачу на тему "${goal}". Ответ должен быть кратким.`,
            'extended': `Проанализируйте и объясните: "${goal}". Ответ должен быть развернутым.`
        };
        
        return examples[type] || `Создайте задание на тему: "${goal}"`;
    }
    
    applyAISuggestion() {
        const goal = document.getElementById('aiGoal')?.value;
        const type = document.querySelector('.ai-type-btn.active')?.dataset.type;
        const complexity = document.getElementById('aiComplexity')?.value;
        
        if (goal) {
            document.getElementById('taskContent').innerHTML = `
                <p>${goal}</p>
                <p>${this.generateAIExample(goal, type, complexity)}</p>
            `;
        }
        
        if (type) {
            this.selectTaskType(type);
        }
        
        if (complexity) {
            this.updateComplexity(complexity);
        }
        
        this.closeAIModal();
        showNotification('AI-предложение применено', 'success');
    }
    
    closeAIModal() {
        document.getElementById('aiWizardModal').style.display = 'none';
    }
    
    // ==================== БЫСТРЫЕ ШАБЛОНЫ ====================
    
    quickTaskTemplate(template) {
        const templates = {
            'test': {
                title: 'Тест по теме',
                content: '<p>Выберите правильные ответы:</p>',
                type: 'choice',
                complexity: 2,
                options: [
                    { text: 'Первый вариант', isCorrect: true },
                    { text: 'Второй вариант', isCorrect: false },
                    { text: 'Третий вариант', isCorrect: false },
                    { text: 'Четвертый вариант', isCorrect: false }
                ]
            },
            'problem': {
                title: 'Задача для решения',
                content: '<p>Решите задачу:</p>',
                type: 'short',
                complexity: 3
            },
            'essay': {
                title: 'Эссе на тему',
                content: '<p>Напишите эссе на заданную тему:</p>',
                type: 'extended',
                complexity: 4
            }
        };
        
        const tpl = templates[template];
        if (tpl) {
            document.getElementById('taskTitle').value = tpl.title;
            document.getElementById('taskContent').innerHTML = tpl.content;
            this.selectTaskType(tpl.type);
            this.updateComplexity(tpl.complexity);
            
            if (tpl.options) {
                this.currentTask.options = tpl.options;
                this.updateDynamicFields();
            }
            
            showNotification('Шаблон загружен', 'success');
        }
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

let taskBuilder;

document.addEventListener('DOMContentLoaded', function() {
    taskBuilder = new TaskBuilder();
    
    // Глобальные функции для вызова из HTML
    window.taskBuilder = taskBuilder;
    

});
// Функции для конструктора заданий
function initializeTaskBuilder() {
    console.log('Инициализация конструктора заданий');
    // Инициализация редактора
    const editor = document.getElementById('taskEditor');
    if (editor) {
        editor.innerHTML = '<p>Введите текст задания здесь...</p>';
    }
    
    // Загрузка библиотеки заданий
    loadTaskLibrary();
}

function selectTaskType(type) {
    const answerOptions = document.getElementById('answerOptions');
    if (type === 'choice' || type === 'matching') {
        answerOptions.style.display = 'block';
        // Инициализация опций для выбора
        initializeOptions(type);
    } else {
        answerOptions.style.display = 'none';
    }
    
    // Обновляем предпросмотр
    updateTaskPreview();
}

function createNewTask() {
    // Сброс формы
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskEditor').innerHTML = '<p>Введите текст задания здесь...</p>';
    document.getElementById('maxScore').value = 1;
    document.getElementById('taskTags').value = '';
    
    // Показать редактор
    document.getElementById('taskPreview').style.display = 'none';
    
    showNotification('Создано новое задание', 'success');
}

function saveTask() {
    const taskData = {
        title: document.getElementById('taskTitle').value,
        content: document.getElementById('taskEditor').innerHTML,
        complexity: document.querySelector('input[name="complexity"]:checked').value,
        maxScore: parseInt(document.getElementById('maxScore').value),
        tags: document.getElementById('taskTags').value.split(',').map(tag => tag.trim()),
        type: getSelectedTaskType(),
        createdAt: new Date().toISOString()
    };
    
    // Сохраняем в локальное хранилище
    let tasks = JSON.parse(localStorage.getItem('taskLibrary') || '[]');
    tasks.push(taskData);
    localStorage.setItem('taskLibrary', JSON.stringify(tasks));
    
    showNotification('Задание сохранено в библиотеку', 'success');
    loadTaskLibrary(); // Обновляем библиотеку
}

function previewTask() {
    const previewContent = document.getElementById('previewContent');
    const title = document.getElementById('taskTitle').value || 'Без названия';
    const content = document.getElementById('taskEditor').innerHTML;
    const complexity = document.querySelector('input[name="complexity"]:checked').value;
    
    previewContent.innerHTML = `
        <h5>${title}</h5>
        <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 5px;">
            ${content}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="task-tag">Уровень ${complexity}</span>
            <span>Макс. баллов: ${document.getElementById('maxScore').value}</span>
        </div>
    `;
    
    document.getElementById('taskPreview').style.display = 'block';
}

function generateVariants() {
    document.getElementById('variantGenerator').style.display = 'block';
}

function loadTaskLibrary() {
    const libraryContent = document.getElementById('libraryContent');
    if (!libraryContent) return;
    
    const tasks = JSON.parse(localStorage.getItem('taskLibrary') || '[]');
    
    if (tasks.length === 0) {
        libraryContent.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #7f8c8d;">
                <div style="font-size: 3em; margin-bottom: 20px;">📚</div>
                <h4>Библиотека пуста</h4>
                <p>Создайте первое задание или импортируйте из файла</p>
            </div>
        `;
        return;
    }
    
    libraryContent.innerHTML = tasks.map((task, index) => `
        <div class="task-card" onclick="editTask(${index})">
            <h4>${task.title || 'Без названия'}</h4>
            <div style="font-size: 13px; color: #666; margin-bottom: 10px;">
                ${task.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
            </div>
            <div class="task-meta">
                <span class="task-tag">Уровень ${task.complexity}</span>
                <span class="task-tag">${task.type || 'тип не указан'}</span>
                <span class="task-tag">${task.maxScore} баллов</span>
            </div>
        </div>
    `).join('');
}

function editTask(index) {
    const tasks = JSON.parse(localStorage.getItem('taskLibrary') || '[]');
    const task = tasks[index];
    
    if (task) {
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskEditor').innerHTML = task.content;
        document.getElementById('maxScore').value = task.maxScore;
        document.getElementById('taskTags').value = task.tags.join(', ');
        
        // Устанавливаем уровень сложности
        const radio = document.querySelector(`input[name="complexity"][value="${task.complexity}"]`);
        if (radio) radio.checked = true;
        
        showNotification('Задание загружено для редактирования', 'info');
    }
}

function getSelectedTaskType() {
    // Определяем тип задания на основе контента
    const content = document.getElementById('taskEditor').innerHTML;
    if (content.includes('<input type="radio"')) return 'choice';
    if (content.includes('<table')) return 'matching';
    if (content.length > 500) return 'extended';
    return 'short';
}

function addOption() {
    const container = document.getElementById('optionsContainer');
    const optionCount = container.children.length + 1;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-item';
    optionDiv.innerHTML = `
        <input type="radio" name="correctAnswer" value="${optionCount}">
        <input type="text" class="form-input option-text" placeholder="Вариант ответа ${optionCount}" style="flex: 1;">
        <button class="btn btn-sm btn-danger" onclick="removeOption(this)">×</button>
    `;
    
    container.appendChild(optionDiv);
}

function removeOption(button) {
    const optionDiv = button.parentElement;
    optionDiv.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => {
        optionDiv.remove();
    }, 300);
}

// Добавьте эти функции в конец script.js
function importFromLibrary() {
    // Показать модальное окно с библиотекой
    showModal('Импорт из библиотеки', `
        <div style="max-height: 400px; overflow-y: auto;">
            <h4>Доступные задания</h4>
            <div id="importLibraryList"></div>
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="closeModal()">Отмена</button>
            <button class="btn btn-primary" onclick="confirmImport()">Импортировать</button>
        </div>
    `);
}

function analyzeTaskComplexity() {
    const content = document.getElementById('taskEditor').innerHTML;
    const text = content.replace(/<[^>]*>/g, '');
    
    // Простой анализ сложности
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).length - 1;
    const avgSentenceLength = wordCount / Math.max(sentenceCount, 1);
    
    let complexityLevel = 1;
    if (avgSentenceLength > 25) complexityLevel = 3;
    else if (avgSentenceLength > 15) complexityLevel = 2;
    
    // Обновляем выбранный уровень
    const radio = document.querySelector(`input[name="complexity"][value="${complexityLevel}"]`);
    if (radio) radio.checked = true;
    
    showNotification(`Анализ сложности: уровень ${complexityLevel} (${wordCount} слов, ${sentenceCount} предложений)`, 'info');
}
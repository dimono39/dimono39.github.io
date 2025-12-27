// Модуль управления проектами
class ProjectManager {
    constructor() {
        this.projects = this.loadProjects();
        this.currentProjectId = null;
        this.initialize();
    }

    initialize() {
        this.renderProjectsList();
        this.setupEventListeners();
        
        // Автосохранение каждые 30 секунд
        setInterval(() => this.autoSaveCurrentProject(), 30000);
        
        // Загрузка последнего активного проекта
        this.loadLastActiveProject();
    }

    // Загрузка проектов из localStorage
    loadProjects() {
        try {
            const saved = localStorage.getItem('analysis_projects');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Ошибка загрузки проектов:', error);
            return [];
        }
    }

    // Сохранение проектов в localStorage
    saveProjects() {
        try {
            localStorage.setItem('analysis_projects', JSON.stringify(this.projects));
        } catch (error) {
            console.error('Ошибка сохранения проектов:', error);
        }
    }

    // Загрузка последнего активного проекта
    loadLastActiveProject() {
        const lastProjectId = localStorage.getItem('last_active_project');
        if (lastProjectId) {
            const project = this.projects.find(p => p.id === lastProjectId);
            if (project) {
                setTimeout(() => {
                    if (confirm('Восстановить последний активный проект?')) {
                        this.switchToProject(lastProjectId);
                    }
                }, 1000);
            }
        }
    }

    // Создание нового проекта
    createNewProject(name = null, template = null) {
        const projectId = 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const project = {
            id: projectId,
            name: name || `Новый проект ${this.projects.length + 1}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
            data: this.getCurrentAppData(),
            metadata: {
                subject: '',
                class: '',
                type: 'current',
                studentCount: 0,
                taskCount: 0
            }
        };

        // Если задан шаблон, применяем его
        if (template) {
            this.applyTemplate(project, template);
        }

        this.projects.unshift(project);
        this.saveProjects();
        this.renderProjectsList();
        this.switchToProject(projectId);

        showNotification(`Проект "${project.name}" создан`, 'success');
        return project;
    }

    // Применение шаблона к проекту
    applyTemplate(project, templateName) {
        const templates = this.getAvailableTemplates();
        const template = templates[templateName];
        
        if (template) {
            // Сохраняем текущие данные appData
            const currentData = this.getCurrentAppData();
            
            // Применяем шаблон
            project.data = { ...project.data, ...template.data };
            project.metadata = { ...project.metadata, ...template.metadata };
            project.name = template.name || project.name;
            
            // Восстанавливаем аналитику, если есть
            if (currentData.test && currentData.test.id) {
                project.data.test.id = currentData.test.id;
            }
        }
    }

    // Получение доступных шаблонов
    getAvailableTemplates() {
        return {
            'current_test': {
                name: 'Контрольная работа',
                data: {
                    test: {
                        id: 'current_' + Date.now(),
                        workType: 'current',
                        workFormat: 'traditional',
                        timeLimit: 45,
                        subject: 'Математика',
                        class: '8',
                        date: new Date().toISOString().split('T')[0],
                        criteria: {
                            5: { min: 18, max: 20 },
                            4: { min: 15, max: 17 },
                            3: { min: 10, max: 14 },
                            2: { min: 0, max: 9 }
                        }
                    },
                    tasks: this.generateSampleTasks(15, [1, 2]),
                    students: this.generateSampleStudents(25),
                    results: [],
                    errors: [],
                    studentErrors: {},
                    psychologyFeatures: [],
                    templates: {}
                },
                metadata: {
                    type: 'current',
                    taskCount: 15,
                    studentCount: 25,
                    subject: 'Математика',
                    class: '8'
                }
            },
            'vpr': {
                name: 'ВПР диагностика',
                data: {
                    test: {
                        id: 'vpr_' + Date.now(),
                        workType: 'vpr',
                        workFormat: 'test',
                        timeLimit: 60,
                        subject: 'Математика',
                        class: '6',
                        date: new Date().toISOString().split('T')[0],
                        criteria: {
                            5: { min: 85, max: 100 },
                            4: { min: 70, max: 84 },
                            3: { min: 50, max: 69 },
                            2: { min: 0, max: 49 }
                        }
                    },
                    tasks: this.generateSampleTasks(20, [1, 2], true),
                    students: this.generateSampleStudents(30),
                    results: [],
                    errors: [],
                    studentErrors: {},
                    psychologyFeatures: [],
                    templates: {}
                },
                metadata: {
                    type: 'vpr',
                    taskCount: 20,
                    studentCount: 30,
                    subject: 'Математика',
                    class: '6'
                }
            },
            'oge_ege': {
                name: 'ОГЭ/ЕГЭ тренировка',
                data: {
                    test: {
                        id: 'oge_' + Date.now(),
                        workType: 'oge',
                        workFormat: 'mixed',
                        timeLimit: 180,
                        subject: 'Математика',
                        class: '9',
                        date: new Date().toISOString().split('T')[0],
                        criteria: {
                            5: { min: 22, max: 26 },
                            4: { min: 18, max: 21 },
                            3: { min: 12, max: 17 },
                            2: { min: 0, max: 11 }
                        }
                    },
                    tasks: this.generateSampleTasks(26, [1, 2, 3, 4]),
                    students: this.generateSampleStudents(20),
                    results: [],
                    errors: [],
                    studentErrors: {},
                    psychologyFeatures: [],
                    templates: {}
                },
                metadata: {
                    type: 'oge',
                    taskCount: 26,
                    studentCount: 20,
                    subject: 'Математика',
                    class: '9'
                }
            },
            'literacy': {
                name: 'Функциональная грамотность',
                data: {
                    test: {
                        id: 'literacy_' + Date.now(),
                        workType: 'func_literacy',
                        workFormat: 'mixed',
                        timeLimit: 90,
                        subject: 'Функциональная грамотность',
                        class: '7',
                        date: new Date().toISOString().split('T')[0],
                        criteria: {
                            'высокий': { min: 80, max: 100 },
                            'средний': { min: 50, max: 79 },
                            'низкий': { min: 0, max: 49 }
                        }
                    },
                    tasks: this.generateLiteracyTasks(15),
                    students: this.generateSampleStudents(25),
                    results: [],
                    errors: [],
                    studentErrors: {},
                    psychologyFeatures: [],
                    templates: {}
                },
                metadata: {
                    type: 'literacy',
                    taskCount: 15,
                    studentCount: 25,
                    subject: 'Функциональная грамотность',
                    class: '7'
                }
            }
        };
    }

    // Генерация примерных заданий
    generateSampleTasks(count, levels = [1, 2, 3, 4], isVPR = false) {
        const tasks = [];
        for (let i = 1; i <= count; i++) {
            const level = levels[Math.floor(Math.random() * levels.length)];
            tasks.push({
                id: i,
                number: i,
                text: `Задание ${i}: ${isVPR ? 'ВПР ' : ''}Уровень ${level}`,
                level: level,
                maxScore: isVPR ? 1 : (level <= 2 ? 1 : 2),
                topic: ['Алгебра', 'Геометрия', 'Анализ'][i % 3],
                category: ['Знание', 'Понимание', 'Применение', 'Анализ'][level - 1] || 'Знание'
            });
        }
        return tasks;
    }

    // Генерация заданий для грамотности
    generateLiteracyTasks(count) {
        const literacyTypes = ['reading', 'math', 'science', 'financial', 'global', 'digital'];
        const contexts = ['personal', 'educational', 'professional', 'social', 'global'];
        
        const tasks = [];
        for (let i = 1; i <= count; i++) {
            const type = literacyTypes[i % literacyTypes.length];
            const context = contexts[i % contexts.length];
            
            tasks.push({
                id: i,
                number: i,
                text: `Задание ${i}: ${this.getLiteracyTypeName(type)} (${this.getContextName(context)})`,
                level: Math.floor(Math.random() * 4) + 1,
                maxScore: 2,
                type: type,
                context: context,
                topic: 'Грамотность',
                category: 'Функциональная грамотность'
            });
        }
        return tasks;
    }

    getLiteracyTypeName(type) {
        const names = {
            'reading': 'Читательская грамотность',
            'math': 'Математическая грамотность',
            'science': 'Естественнонаучная грамотность',
            'financial': 'Финансовая грамотность',
            'global': 'Глобальные компетенции',
            'digital': 'Цифровая грамотность'
        };
        return names[type] || type;
    }

    getContextName(context) {
        const names = {
            'personal': 'Личный контекст',
            'educational': 'Учебный контекст',
            'professional': 'Профессиональный контекст',
            'social': 'Общественный контекст',
            'global': 'Глобальный контекст'
        };
        return names[context] || context;
    }

    // Генерация примерных учеников
    generateSampleStudents(count) {
        const students = [];
        const surnames = ['Иванов', 'Петров', 'Сидоров', 'Кузнецов', 'Смирнов', 'Попов', 'Васильев', 'Федоров'];
        const names = ['Алексей', 'Дмитрий', 'Сергей', 'Андрей', 'Михаил', 'Егор', 'Артем', 'Иван'];
        
        for (let i = 1; i <= count; i++) {
            const surname = surnames[Math.floor(Math.random() * surnames.length)];
            const name = names[Math.floor(Math.random() * names.length)];
            
            students.push({
                id: i,
                lastName: surname,
                firstName: name,
                middleName: '',
                class: '8А',
                isPresent: Math.random() > 0.1,
                hasSpecialNeeds: Math.random() > 0.85
            });
        }
        return students;
    }

    // Получение текущих данных приложения
    getCurrentAppData() {
        // Проверяем наличие глобальных переменных
        if (typeof appData === 'undefined') {
            // Создаем базовую структуру, если appData не определена
            return {
                test: {},
                tasks: [],
                students: [],
                results: [],
                errors: [],
                studentErrors: {},
                psychologyFeatures: [],
                templates: {}
            };
        }
        
        return {
            test: { ...(appData.test || {}) },
            tasks: [...(appData.tasks || [])],
            students: [...(appData.students || [])],
            results: [...(appData.results || [])],
            errors: [...(appData.errors || [])],
            studentErrors: { ...(appData.studentErrors || {}) },
            psychologyFeatures: [...(appData.psychologyFeatures || [])],
            templates: { ...(appData.templates || {}) }
        };
    }

    // Переключение на проект
    switchToProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            showNotification('Проект не найден', 'error');
            return;
        }

        this.currentProjectId = projectId;
        localStorage.setItem('last_active_project', projectId);
        
        // Обновляем глобальные данные приложения
        if (typeof appData !== 'undefined') {
            Object.assign(appData, project.data);
        } else {
            // Инициализируем appData, если она не определена
            window.appData = project.data;
        }
        
        // Обновляем интерфейс
        this.updateProjectStatus();
        this.renderProjectsList();
        
        // Перерисовываем основные компоненты, если функции существуют
        setTimeout(() => {
            if (typeof renderSetup === 'function') {
                try { renderSetup(); } catch(e) { console.warn('renderSetup не доступен:', e); }
            }
            if (typeof renderTasks === 'function') {
                try { renderTasks(); } catch(e) { console.warn('renderTasks не доступен:', e); }
            }
            if (typeof renderStudents === 'function') {
                try { renderStudents(); } catch(e) { console.warn('renderStudents не доступен:', e); }
            }
            if (typeof updateTestInfo === 'function') {
                try { updateTestInfo(); } catch(e) { console.warn('updateTestInfo не доступен:', e); }
            }
        }, 100);
        
        showNotification(`Загружен проект: "${project.name}"`, 'success');
    }

    // Обновление текущего проекта
    updateCurrentProject() {
        if (!this.currentProjectId) return;
        
        const project = this.projects.find(p => p.id === this.currentProjectId);
        if (project) {
            project.data = this.getCurrentAppData();
            project.updatedAt = new Date().toISOString();
            project.metadata = this.generateMetadata();
            this.saveProjects();
            this.renderProjectsList();
        }
    }

    // Генерация метаданных проекта
    generateMetadata() {
        const test = (typeof appData !== 'undefined' && appData.test) ? appData.test : {};
        const tasks = (typeof appData !== 'undefined' && appData.tasks) ? appData.tasks : [];
        const students = (typeof appData !== 'undefined' && appData.students) ? appData.students : [];
        
        return {
            subject: test.subject || '',
            class: test.class || '',
            type: test.workType || 'current',
            studentCount: students.length || 0,
            taskCount: tasks.length || 0,
            lastUpdate: new Date().toLocaleString()
        };
    }

    // Автосохранение текущего проекта
    autoSaveCurrentProject() {
        if (this.currentProjectId && typeof appData !== 'undefined') {
            this.updateCurrentProject();
        }
    }

    // Экспорт проекта в файл
    exportProject(projectId = null) {
        const project = projectId ? 
            this.projects.find(p => p.id === projectId) : 
            this.projects.find(p => p.id === this.currentProjectId);
        
        if (!project) {
            showNotification('Нет активного проекта для экспорта', 'warning');
            return;
        }

        const dataStr = JSON.stringify(project, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `проект_${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification(`Проект "${project.name}" экспортирован`, 'success');
    }

    // Импорт проекта из файла
    importProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedProject = JSON.parse(event.target.result);
                    
                    // Проверяем структуру
                    if (!importedProject.id || !importedProject.name) {
                        throw new Error('Некорректный формат файла проекта');
                    }
                    
                    // Проверяем наличие данных
                    if (!importedProject.data) {
                        importedProject.data = this.getCurrentAppData();
                    }
                    
                    // Обновляем ID, чтобы избежать конфликтов
                    importedProject.id = 'imported_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    importedProject.updatedAt = new Date().toISOString();
                    
                    this.projects.unshift(importedProject);
                    this.saveProjects();
                    this.renderProjectsList();
                    
                    showNotification(`Проект "${importedProject.name}" импортирован`, 'success');
                } catch (error) {
                    console.error('Ошибка импорта:', error);
                    showNotification('Ошибка при импорте файла', 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    // Удаление проекта
    deleteProject(projectId) {
        if (!confirm('Удалить проект? Это действие нельзя отменить.')) return;
        
        const projectIndex = this.projects.findIndex(p => p.id === projectId);
        if (projectIndex === -1) return;
        
        const projectName = this.projects[projectIndex].name;
        this.projects.splice(projectIndex, 1);
        this.saveProjects();
        
        if (this.currentProjectId === projectId) {
            this.currentProjectId = null;
            localStorage.removeItem('last_active_project');
            this.updateProjectStatus();
        }
        
        this.renderProjectsList();
        showNotification(`Проект "${projectName}" удален`, 'warning');
    }

    // Визуализация списка проектов
    renderProjectsList() {
        const container = document.getElementById('projectsList');
        const emptyContainer = document.getElementById('emptyProjects');
        
        if (!container) return;
        
        if (this.projects.length === 0) {
            container.innerHTML = '';
            if (emptyContainer) emptyContainer.style.display = 'block';
            return;
        }
        
        if (emptyContainer) emptyContainer.style.display = 'none';
        
        container.innerHTML = this.projects.map(project => `
            <div class="project-item ${this.currentProjectId === project.id ? 'active' : ''}" 
                 onclick="projectManager.switchToProject('${project.id}')"
                 oncontextmenu="event.preventDefault(); showProjectContextMenu(event, '${project.id}')">
                <div class="project-icon">
                    ${this.getProjectIcon(project.metadata?.type)}
                </div>
                <div class="project-info">
                    <div class="project-name">${project.name}</div>
                    <div class="project-meta">
                        ${this.formatProjectMetadata(project)}
                    </div>
                    <div class="project-dates">
                        <small>${new Date(project.updatedAt).toLocaleDateString()}</small>
                        <span class="project-status status-${project.status}">${this.getStatusText(project.status)}</span>
                    </div>
                </div>
                <button class="project-pin-btn" onclick="event.stopPropagation(); projectManager.togglePinProject('${project.id}')">
                    <i class="fas fa-thumbtack ${project.pinned ? 'pinned' : ''}"></i>
                </button>
            </div>
        `).join('');
    }

    getProjectIcon(type) {
        const icons = {
            'current': '📝',
            'vpr': '📊',
            'oge': '📘',
            'ege': '📗',
            'literacy': '🧠',
            'psychology': '💭'
        };
        return icons[type] || '📁';
    }

    formatProjectMetadata(project) {
        const meta = project.metadata || {};
        const parts = [];
        
        if (meta.subject) parts.push(meta.subject);
        if (meta.class) parts.push(`${meta.class} класс`);
        if (meta.taskCount) parts.push(`${meta.taskCount} зад.`);
        if (meta.studentCount) parts.push(`${meta.studentCount} уч.`);
        
        return parts.join(' • ') || 'Нет метаданных';
    }

    getStatusText(status) {
        const texts = {
            'draft': 'черновик',
            'active': 'активен',
            'completed': 'завершен',
            'archived': 'архив'
        };
        return texts[status] || status;
    }

    // Переключение закрепления проекта
    togglePinProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            project.pinned = !project.pinned;
            project.updatedAt = new Date().toISOString();
            
            // Сортируем: сначала закрепленные, потом по дате
            this.projects.sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            });
            
            this.saveProjects();
            this.renderProjectsList();
        }
    }

    // Обновление статуса в футере
    updateProjectStatus() {
        const statusElement = document.getElementById('projectStatus');
        if (!statusElement) return;
        
        if (this.currentProjectId) {
            const project = this.projects.find(p => p.id === this.currentProjectId);
            statusElement.textContent = `Активный проект: ${project?.name || 'неизвестен'}`;
            statusElement.title = `Обновлено: ${new Date(project?.updatedAt || '').toLocaleString()}`;
        } else {
            statusElement.textContent = 'Активный проект: нет';
            statusElement.title = '';
        }
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Перехватываем сохранение данных для обновления проекта
        if (typeof window.saveData === 'function') {
            const originalSaveData = window.saveData;
            window.saveData = function(...args) {
                const result = originalSaveData.apply(this, args);
                projectManager.updateCurrentProject();
                return result;
            };
        }
        
        // Обработка закрытия вкладки
        window.addEventListener('beforeunload', (e) => {
            if (projectManager.currentProjectId) {
                projectManager.updateCurrentProject();
            }
        });
    }
}

// Глобальные утилиты
function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Простая реализация уведомлений
    if (typeof alert === 'function') {
        alert(message);
    }
}

// Глобальный экземпляр менеджера проектов
let projectManager;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    projectManager = new ProjectManager();
});

// Глобальные функции для доступа из HTML
function createNewProject() {
    const name = prompt('Введите название нового проекта:', 'Новый проект');
    if (name) {
        projectManager.createNewProject(name);
    }
}

function importProject() {
    projectManager.importProject();
}

function exportProject() {
    projectManager.exportProject();
}

function loadTemplate(templateName) {
    if (confirm('Создать новый проект на основе шаблона? Текущие несохраненные данные будут потеряны.')) {
        projectManager.createNewProject(null, templateName);
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('projectsSidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (sidebar && mainContent) {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
        
        // Сохраняем состояние
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebar_collapsed', isCollapsed);
        
        // Обновляем иконку
        const icon = document.querySelector('.projects-sidebar .fa-chevron-left');
        if (icon) {
            icon.classList.toggle('fa-chevron-right', isCollapsed);
            icon.classList.toggle('fa-chevron-left', !isCollapsed);
        }
    }
}

function showProjectContextMenu(event, projectId) {
    event.preventDefault();
    
    // Удаляем существующее меню
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) existingMenu.remove();
    
    // Создаем новое меню
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.position = 'fixed';
    menu.style.background = 'white';
    menu.style.border = '1px solid #ccc';
    menu.style.borderRadius = '4px';
    menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    menu.style.zIndex = '10000';
    menu.style.minWidth = '180px';
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    
    menu.innerHTML = `
        <div class="context-menu-item" onclick="projectManager.switchToProject('${projectId}'); this.parentNode.remove()" 
             style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;">
            <i class="fas fa-folder-open me-2"></i> Открыть
        </div>
        <div class="context-menu-item" onclick="projectManager.exportProject('${projectId}'); this.parentNode.remove()" 
             style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;">
            <i class="fas fa-download me-2"></i> Экспорт
        </div>
        <div class="context-menu-item" onclick="renameProject('${projectId}'); this.parentNode.remove()" 
             style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;">
            <i class="fas fa-edit me-2"></i> Переименовать
        </div>
        <div class="context-menu-item delete" onclick="projectManager.deleteProject('${projectId}'); this.parentNode.remove()" 
             style="padding: 8px 12px; cursor: pointer; color: #dc3545;">
            <i class="fas fa-trash me-2"></i> Удалить
        </div>
    `;
    
    document.body.appendChild(menu);
    
    // Закрытие меню при клике вне его
    setTimeout(() => {
        const closeMenu = (e) => {
            if (menu && !menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        document.addEventListener('click', closeMenu);
    }, 100);
}

function renameProject(projectId) {
    const project = projectManager.projects.find(p => p.id === projectId);
    if (!project) return;
    
    const newName = prompt('Введите новое название проекта:', project.name);
    if (newName && newName.trim()) {
        project.name = newName.trim();
        project.updatedAt = new Date().toISOString();
        projectManager.saveProjects();
        projectManager.renderProjectsList();
        showNotification('Проект переименован', 'success');
    }
}
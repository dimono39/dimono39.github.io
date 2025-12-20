// modules/projects.js
class ProjectManager {
    constructor() {
        this.currentProjectId = null;
        this.projects = [];
        this.recentProjects = [];
        this.templates = [];
        this.isInitialized = false;
        
        // Состояние UI
        this.ui = {
            sidebarVisible: true,
            currentView: 'list', // list, grid, timeline
            filter: {
                search: '',
                subject: '',
                status: '',
                dateFrom: '',
                dateTo: ''
            },
            sortBy: 'updatedAt',
            sortOrder: 'desc'
        };
        
        // События
        this.events = {
            onProjectChange: [],
            onProjectSave: [],
            onProjectDelete: [],
            onProjectSwitch: []
        };
    }
    
    // Инициализация
    async init() {
        if (this.isInitialized) return;
        
        try {
            // Загружаем проекты из хранилища
            await this.loadProjects();
            
            // Загружаем последнюю активную работу
            await this.loadLastActiveProject();
            
            // Инициализируем UI
            this.initUI();
            
            // Запускаем автосохранение
            this.initAutoSave();
            
            // Загружаем шаблоны
            await this.loadTemplates();
            
            this.isInitialized = true;
            console.log('✅ ProjectManager initialized');
            
            // Отправляем событие
            this.triggerEvent('initialized', { projectsCount: this.projects.length });
            
        } catch (error) {
            console.error('❌ Failed to initialize ProjectManager:', error);
            this.showError('Ошибка загрузки проектов', error.message);
        }
    }
    
    // СОЗДАНИЕ ПРОЕКТОВ
    
    createNewProject(options = {}) {
        const project = new Project({
            name: options.name || `Новая работа ${this.projects.length + 1}`,
            type: options.type || 'current',
            subject: options.subject || '',
            class: options.class || '',
            theme: options.theme || '',
            color: options.color || this.getRandomColor(),
            icon: options.icon || this.getDefaultIcon(options.type)
        });
        
        // Если переданы настройки из текущей работы
        if (options.copyFromCurrent) {
            project.settings = { ...appData.test };
            project.tasks = [...appData.tasks];
            project.students = [...appData.students];
            project.results = { ...appData.results };
        }
        
        // Добавляем проект
        this.addProject(project);
        
        // Открываем новый проект
        this.openProject(project.id);
        
        return project;
    }
    
    // ЗАГРУЗКА/СОХРАНЕНИЕ
    
    async loadProjects() {
        try {
            const saved = await ProjectStorage.loadProjects();
            this.projects = saved.projects || [];
            this.recentProjects = saved.recentProjects || [];
            
            // Восстанавливаем связи
            this.projects.forEach(project => {
                this.validateProject(project);
            });
            
            console.log(`📁 Loaded ${this.projects.length} projects`);
            return this.projects;
            
        } catch (error) {
            console.error('Failed to load projects:', error);
            this.projects = [];
            return [];
        }
    }
    
    async saveProjects() {
        try {
            await ProjectStorage.saveProjects({
                projects: this.projects,
                recentProjects: this.recentProjects
            });
            
            console.log(`💾 Saved ${this.projects.length} projects`);
            this.triggerEvent('projectsSaved', { count: this.projects.length });
            
        } catch (error) {
            console.error('Failed to save projects:', error);
            this.showError('Ошибка сохранения', error.message);
        }
    }
    
    // РАБОТА С ПРОЕКТАМИ
    
    async openProject(projectId) {
        // Если уже открыт этот проект
        if (this.currentProjectId === projectId) return;
        
        // Сохраняем текущий проект перед переключением
        if (this.currentProjectId) {
            await this.saveCurrentProject();
        }
        
        // Находим проект
        const project = this.getProject(projectId);
        if (!project) {
            this.showError('Проект не найден', `ID: ${projectId}`);
            return;
        }
        
        // Загружаем данные проекта в основное приложение
        await this.loadProjectData(project);
        
        // Обновляем состояние
        this.currentProjectId = projectId;
        project.lastOpened = new Date().toISOString();
        
        // Добавляем в недавние
        this.addToRecent(projectId);
        
        // Обновляем UI
        this.updateUI();
        
        // Отправляем события
        this.triggerEvent('projectOpened', { project });
        this.triggerEvent('projectSwitch', { 
            from: this.currentProjectId, 
            to: projectId 
        });
        
        // Показываем уведомление
        this.showNotification(`📂 Открыта работа: ${project.name}`, 'success');
        
        // Сохраняем изменения
        await this.saveProjects();
        
        return project;
    }
    
    async loadProjectData(project) {
        return new Promise((resolve) => {
            // Загружаем данные в глобальное состояние
            appData.tasks = project.tasks || [];
            appData.students = project.students || [];
            appData.results = project.results || {};
            appData.errors = project.errors || {};
            appData.test = project.settings || {};
            appData.psychologyFeatures = project.psychologyFeatures || [];
            
            // Обновляем все вкладки
            if (typeof updateAllTabs === 'function') {
                setTimeout(() => {
                    updateAllTabs();
                    resolve();
                }, 100);
            } else {
                resolve();
            }
        });
    }
    
    async saveCurrentProject() {
        if (!this.currentProjectId) return;
        
        const project = this.getProject(this.currentProjectId);
        if (!project) return;
        
        // Сохраняем текущие данные в проект
        project.tasks = [...appData.tasks];
        project.students = [...appData.students];
        project.results = { ...appData.results };
        project.errors = { ...appData.errors };
        project.settings = { ...appData.test };
        project.psychologyFeatures = [...appData.psychologyFeatures];
        
        // Обновляем статистику
        project.stats = this.calculateProjectStats(project);
        project.updatedAt = new Date().toISOString();
        
        // Сохраняем
        await this.saveProjects();
        
        // Отправляем событие
        this.triggerEvent('projectSaved', { project });
        
        return project;
    }
    
    // ПОИСК И ФИЛЬТРАЦИЯ
    
    searchProjects(query) {
        if (!query) return this.projects;
        
        const searchTerm = query.toLowerCase();
        return this.projects.filter(project => {
            return (
                project.name.toLowerCase().includes(searchTerm) ||
                project.subject?.toLowerCase().includes(searchTerm) ||
                project.theme?.toLowerCase().includes(searchTerm) ||
                project.class?.toLowerCase().includes(searchTerm) ||
                project.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        });
    }
    
    filterProjects(filters = {}) {
        let filtered = [...this.projects];
        
        // Поиск по тексту
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(searchTerm) ||
                p.subject?.toLowerCase().includes(searchTerm) ||
                p.theme?.toLowerCase().includes(searchTerm)
            );
        }
        
        // По предмету
        if (filters.subject) {
            filtered = filtered.filter(p => p.subject === filters.subject);
        }
        
        // По статусу
        if (filters.status) {
            filtered = filtered.filter(p => p.status === filters.status);
        }
        
        // По дате
        if (filters.dateFrom) {
            const dateFrom = new Date(filters.dateFrom);
            filtered = filtered.filter(p => new Date(p.updatedAt) >= dateFrom);
        }
        
        if (filters.dateTo) {
            const dateTo = new Date(filters.dateTo);
            filtered = filtered.filter(p => new Date(p.updatedAt) <= dateTo);
        }
        
        // Сортировка
        filtered.sort((a, b) => {
            let valA = a[this.ui.sortBy];
            let valB = b[this.ui.sortBy];
            
            // Для дат преобразуем в timestamp
            if (this.ui.sortBy.includes('At') || this.ui.sortBy.includes('Date')) {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            }
            
            if (this.ui.sortOrder === 'asc') {
                return valA > valB ? 1 : -1;
            } else {
                return valA < valB ? 1 : -1;
            }
        });
        
        return filtered;
    }
    
    // СТАТИСТИКА
    
    calculateProjectStats(project) {
        const stats = {
            totalStudents: project.students?.length || 0,
            totalTasks: project.tasks?.length || 0,
            completionPercent: 0,
            avgGrade: 0,
            gradesDistribution: { 5: 0, 4: 0, 3: 0, 2: 0 }
        };
        
        // Рассчитываем проценты выполнения
        if (project.results && project.tasks) {
            let totalPossible = 0;
            let totalAchieved = 0;
            let gradedStudents = 0;
            
            project.students?.forEach(student => {
                const studentResults = project.results[student.id];
                if (studentResults) {
                    let studentTotal = 0;
                    let studentMax = 0;
                    
                    project.tasks.forEach((task, index) => {
                        const taskId = task.id || index;
                        const score = parseFloat(studentResults[taskId]) || 0;
                        const maxScore = task.maxScore || 1;
                        
                        studentTotal += score;
                        studentMax += maxScore;
                    });
                    
                    if (studentMax > 0) {
                        const percent = (studentTotal / studentMax) * 100;
                        totalAchieved += percent;
                        gradedStudents++;
                        
                        // Определяем оценку
                        const grade = this.calculateGrade(percent, project.settings?.criteria);
                        if (grade) {
                            stats.gradesDistribution[grade] = (stats.gradesDistribution[grade] || 0) + 1;
                        }
                    }
                    totalPossible += 100;
                }
            });
            
            if (gradedStudents > 0) {
                stats.avgGrade = totalAchieved / gradedStudents;
                stats.completionPercent = (totalAchieved / (gradedStudents * 100)) * 100;
            }
        }
        
        return stats;
    }
    
    calculateGrade(percent, criteria) {
        if (!criteria) return null;
        
        const entries = Object.entries(criteria).sort((a, b) => b[1].min - a[1].min);
        
        for (const [grade, range] of entries) {
            if (percent >= range.min && percent <= range.max) {
                return parseInt(grade);
            }
        }
        
        return null;
    }
    
    // УТИЛИТЫ
    
    getProject(projectId) {
        return this.projects.find(p => p.id === projectId);
    }
    
    getCurrentProject() {
        return this.getProject(this.currentProjectId);
    }
    
    addProject(project) {
        // Проверяем уникальность имени
        let name = project.name;
        let counter = 1;
        
        while (this.projects.some(p => p.name === name && p.id !== project.id)) {
            name = `${project.name} (${counter})`;
            counter++;
        }
        
        project.name = name;
        this.projects.push(project);
        
        this.triggerEvent('projectAdded', { project });
        return project;
    }
    
    async deleteProject(projectId, confirm = true) {
        const project = this.getProject(projectId);
        if (!project) return false;
        
        if (confirm) {
            const confirmed = await this.showConfirmDialog(
                'Удалить работу?',
                `Вы уверены, что хотите удалить работу "${project.name}"? Это действие нельзя отменить.`,
                'Удалить',
                'Отмена'
            );
            
            if (!confirmed) return false;
        }
        
        // Удаляем проект
        const index = this.projects.findIndex(p => p.id === projectId);
        if (index !== -1) {
            this.projects.splice(index, 1);
        }
        
        // Удаляем из недавних
        this.recentProjects = this.recentProjects.filter(id => id !== projectId);
        
        // Если удаляем текущий проект, открываем другой
        if (this.currentProjectId === projectId) {
            this.currentProjectId = null;
            
            // Открываем последний проект или создаем новый
            if (this.projects.length > 0) {
                const lastProject = this.projects[this.projects.length - 1];
                await this.openProject(lastProject.id);
            } else {
                // Создаем новый пустой проект
                this.createNewProject();
            }
        }
        
        // Сохраняем изменения
        await this.saveProjects();
        
        // Отправляем событие
        this.triggerEvent('projectDeleted', { projectId });
        
        // Показываем уведомление
        this.showNotification(`🗑️ Работа "${project.name}" удалена`, 'info');
        
        return true;
    }
    
    async duplicateProject(projectId) {
        const original = this.getProject(projectId);
        if (!original) return null;
        
        // Создаем глубокую копию
        const duplicate = new Project({
            ...original,
            id: null, // Генерируем новый ID
            name: `${original.name} (копия)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastOpened: null
        });
        
        // Сбрасываем некоторые поля
        duplicate.stats = { totalStudents: 0, avgGrade: 0, completionPercent: 0 };
        
        // Добавляем проект
        this.addProject(duplicate);
        
        // Сохраняем
        await this.saveProjects();
        
        // Показываем уведомление
        this.showNotification(`📋 Создана копия: ${duplicate.name}`, 'success');
        
        return duplicate;
    }
    
    async exportProject(projectId, format = 'json') {
        const project = this.getProject(projectId);
        if (!project) return;
        
        const data = {
            ...project,
            exportInfo: {
                exportedAt: new Date().toISOString(),
                version: '1.0',
                system: 'Education Analytics System'
            }
        };
        
        let blob, filename;
        
        switch (format) {
            case 'json':
                blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                filename = `работа_${project.name}_${new Date().toISOString().split('T')[0]}.json`;
                break;
                
            case 'html':
                const html = this.generateProjectHTML(project);
                blob = new Blob([html], { type: 'text/html' });
                filename = `отчет_${project.name}.html`;
                break;
                
            case 'zip':
                // TODO: Реализовать создание ZIP архива
                return this.exportProjectAsZip(project);
        }
        
        // Скачиваем файл
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification(`📤 Экспортировано: ${project.name}`, 'success');
    }
    
    async importProjects(files) {
        const importedProjects = [];
        
        for (const file of files) {
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                // Валидируем данные
                const project = this.validateImportedProject(data);
                if (project) {
                    // Проверяем дубликаты
                    const existing = this.projects.find(p => 
                        p.name === project.name && 
                        p.subject === project.subject &&
                        p.class === project.class &&
                        Math.abs(new Date(p.createdAt) - new Date(project.createdAt)) < 1000
                    );
                    
                    if (!existing) {
                        this.addProject(project);
                        importedProjects.push(project);
                    }
                }
            } catch (error) {
                console.error(`Failed to import file ${file.name}:`, error);
            }
        }
        
        if (importedProjects.length > 0) {
            await this.saveProjects();
            this.showNotification(`📥 Импортировано ${importedProjects.length} работ`, 'success');
        }
        
        return importedProjects;
    }
    
    // ВАЛИДАЦИЯ
    
    validateProject(project) {
        // Устанавливаем значения по умолчанию
        if (!project.id) project.id = 'project_' + Date.now() + Math.random().toString(36).substr(2, 9);
        if (!project.createdAt) project.createdAt = new Date().toISOString();
        if (!project.updatedAt) project.updatedAt = project.createdAt;
        if (!project.status) project.status = 'draft';
        if (!project.color) project.color = this.getRandomColor();
        if (!project.icon) project.icon = '📊';
        if (!project.settings) project.settings = {};
        if (!project.tasks) project.tasks = [];
        if (!project.students) project.students = [];
        if (!project.results) project.results = {};
        if (!project.errors) project.errors = {};
        if (!project.stats) project.stats = {};
        
        return project;
    }
    
    validateImportedProject(data) {
        try {
            // Базовые проверки
            if (!data.name || typeof data.name !== 'string') {
                throw new Error('Invalid project name');
            }
            
            // Создаем новый проект на основе импортированных данных
            const project = new Project(data);
            
            // Валидируем
            return this.validateProject(project);
            
        } catch (error) {
            console.error('Invalid project data:', error);
            return null;
        }
    }
    
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    
    addToRecent(projectId) {
        // Удаляем если уже есть
        this.recentProjects = this.recentProjects.filter(id => id !== projectId);
        
        // Добавляем в начало
        this.recentProjects.unshift(projectId);
        
        // Ограничиваем количество
        if (this.recentProjects.length > 10) {
            this.recentProjects = this.recentProjects.slice(0, 10);
        }
    }
    
    getRandomColor() {
        const colors = [
            '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
            '#1abc9c', '#34495e', '#e67e22', '#27ae60', '#2980b9'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    getDefaultIcon(type) {
        const icons = {
            current: '📝',
            milestone: '🎯',
            final: '🏆',
            oge: '📘',
            ege: '📗',
            vpr: '📙',
            func_literacy: '🧠',
            psychology: '💭',
            diagnostic: '🔍'
        };
        return icons[type] || '📊';
    }
    
    // СОБЫТИЯ
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
    
    triggerEvent(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} handler:`, error);
                }
            });
        }
    }
    
    // UI ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    
    showNotification(message, type = 'info') {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
    
    showError(title, message) {
        if (typeof showModal === 'function') {
            showModal(title, `<div class="alert alert-danger">${message}</div>`);
        } else {
            console.error(`${title}: ${message}`);
            alert(`${title}: ${message}`);
        }
    }
    
    async showConfirmDialog(title, message, confirmText = 'Да', cancelText = 'Отмена') {
        return new Promise((resolve) => {
            if (typeof showModal === 'function') {
                const modalContent = `
                    <div class="confirm-dialog">
                        <h4>${title}</h4>
                        <p>${message}</p>
                        <div class="modal-actions">
                            <button class="btn btn-outline" onclick="window.__confirmResult = false; closeModal();">${cancelText}</button>
                            <button class="btn btn-danger" onclick="window.__confirmResult = true; closeModal();">${confirmText}</button>
                        </div>
                    </div>
                `;
                
                showModal(title, modalContent);
                
                // Ждем закрытия модального окна
                const checkInterval = setInterval(() => {
                    const modal = document.getElementById('modalOverlay');
                    if (!modal || modal.style.display === 'none') {
                        clearInterval(checkInterval);
                        resolve(window.__confirmResult || false);
                        delete window.__confirmResult;
                    }
                }, 100);
                
            } else {
                const result = confirm(`${title}\n\n${message}`);
                resolve(result);
            }
        });
    }
    
    // СИНХРОНИЗАЦИЯ С ТЕКУЩЕЙ СИСТЕМОЙ
    
    updateFromCurrentAppData() {
        if (!this.currentProjectId) return;
        
        const project = this.getProject(this.currentProjectId);
        if (!project) return;
        
        // Обновляем данные из глобального состояния
        project.tasks = [...appData.tasks];
        project.students = [...appData.students];
        project.results = { ...appData.results };
        project.errors = { ...appData.errors };
        project.settings = { ...appData.test };
        project.psychologyFeatures = [...appData.psychologyFeatures];
        
        // Обновляем статистику
        project.stats = this.calculateProjectStats(project);
        project.updatedAt = new Date().toISOString();
        
        return project;
    }
    
    // ТЕСТИРОВАНИЕ
    
    async runTests() {
        console.log('🧪 Running ProjectManager tests...');
        
        try {
            // Тест 1: Создание проекта
            const testProject = this.createNewProject({ name: 'Тестовая работа' });
            console.assert(testProject.id, '❌ Project should have an ID');
            console.log('✅ Test 1: Project creation passed');
            
            // Тест 2: Сохранение
            await this.saveProjects();
            console.log('✅ Test 2: Project saving passed');
            
            // Тест 3: Загрузка
            const loaded = await this.loadProjects();
            console.assert(loaded.length > 0, '❌ Should have loaded projects');
            console.log('✅ Test 3: Project loading passed');
            
            // Тест 4: Поиск
            const found = this.searchProjects('Тестовая');
            console.assert(found.length > 0, '❌ Should find test project');
            console.log('✅ Test 4: Project search passed');
            
            // Тест 5: Удаление
            await this.deleteProject(testProject.id, false);
            console.log('✅ Test 5: Project deletion passed');
            
            console.log('🎉 All tests passed!');
            
        } catch (error) {
            console.error('❌ Test failed:', error);
        }
    }
}

// Класс проекта
class Project {
    constructor(data = {}) {
        this.id = data.id || 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.name = data.name || 'Новая работа';
        this.type = data.type || 'current';
        this.subject = data.subject || '';
        this.class = data.class || '';
        this.theme = data.theme || '';
        this.description = data.description || '';
        
        this.icon = data.icon || '📊';
        this.color = data.color || '#3498db';
        this.tags = data.tags || [];
        this.status = data.status || 'draft'; // draft, active, completed, archived
        
        // Даты
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || this.createdAt;
        this.lastOpened = data.lastOpened || null;
        
        // Данные работы
        this.settings = data.settings || {};
        this.tasks = data.tasks || [];
        this.students = data.students || [];
        this.results = data.results || {};
        this.errors = data.errors || {};
        this.psychologyFeatures = data.psychologyFeatures || [];
        
        // Метаданные
        this.stats = data.stats || {};
        this.reports = data.reports || [];
        this.version = data.version || '1.0';
        
        // Настройки отображения
        this.viewSettings = data.viewSettings || {
            defaultTab: 'analytics',
            chartTypes: {},
            visibleColumns: []
        };
    }
    
    // Геттеры для удобства
    get displayName() {
        return `${this.icon} ${this.name}`;
    }
    
    get fullInfo() {
        return `${this.subject || 'Без предмета'} | ${this.class || 'Без класса'} | ${this.theme || 'Без темы'}`;
    }
    
    get isActive() {
        return this.status === 'active';
    }
    
    get isArchived() {
        return this.status === 'archived';
    }
    
    get lastModified() {
        return new Date(this.updatedAt).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Методы
    updateStats() {
        // Обновляем статистику
        // Реализация зависит от логики приложения
    }
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            subject: this.subject,
            class: this.class,
            theme: this.theme,
            description: this.description,
            icon: this.icon,
            color: this.color,
            tags: this.tags,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastOpened: this.lastOpened,
            settings: this.settings,
            tasks: this.tasks,
            students: this.students,
            results: this.results,
            errors: this.errors,
            psychologyFeatures: this.psychologyFeatures,
            stats: this.stats,
            reports: this.reports,
            version: this.version,
            viewSettings: this.viewSettings
        };
    }
}

// Создаем глобальный экземпляр
window.projectManager = new ProjectManager();

// Экспортируем для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProjectManager, Project };
}
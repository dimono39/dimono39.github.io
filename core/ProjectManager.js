// core/ProjectManager.js
import { Project } from './Project.js';
import { ProjectStorage } from './ProjectStorage.js';

export class ProjectManager {
    constructor() {
        // Защита от дублирования
        if (window.projectManager && !window._projectManagerOverride) {
            return window.projectManager;
        }
        
        this.projects = [];
        this.recentProjects = [];
        this.currentProjectId = null;
        this.isInitialized = false;
        
        // События
        this.events = {
            projectAdded: [],
            projectUpdated: [],
            projectDeleted: [],
            projectSwitched: [],
            projectsLoaded: []
        };
        
        window._projectManagerOverride = true;
        window.projectManager = this;
    }
    
    async init() {
        if (this.isInitialized) return;
        
        console.log('🚀 Инициализация ProjectManager...');
        
        try {
            // Загружаем проекты из хранилища
            await this.loadProjects();
            
            // Загружаем последний активный проект
            await this.loadLastActiveProject();
            
            this.isInitialized = true;
            this.triggerEvent('projectsLoaded', { count: this.projects.length });
            
            console.log('✅ ProjectManager инициализирован');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            throw error;
        }
    }
    
    async loadProjects() {
        const data = await ProjectStorage.loadProjects();
        this.projects = data.projects.map(projectData => new Project(projectData));
        this.recentProjects = data.recentProjects || [];
        return this.projects;
    }
    
    async loadLastActiveProject() {
        try {
            const lastActiveId = localStorage.getItem('lastActiveProject');
            
            if (lastActiveId) {
                const project = this.getProject(lastActiveId);
                
                if (project) {
                    // Проверяем, не слишком ли старый проект
                    const lastOpened = project.lastOpened ? 
                        new Date(project.lastOpened) : 
                        new Date(project.updatedAt);
                    
                    const daysSince = (Date.now() - lastOpened.getTime()) / (1000 * 60 * 60 * 24);
                    
                    if (daysSince <= 30) { // Не старше 30 дней
                        console.log(`📂 Загрузка последней работы: ${project.name}`);
                        await this.openProject(project.id);
                        return project;
                    }
                }
            }
            
            // Если нет последней работы, пробуем первую активную
            const activeProject = this.projects.find(p => p.status === 'active');
            if (activeProject) {
                await this.openProject(activeProject.id);
                return activeProject;
            }
            
            // Если нет вообще проектов, создаем новый
            if (this.projects.length === 0) {
                const newProject = this.createProject({
                    name: 'Моя первая работа',
                    subject: '',
                    class: ''
                });
                await this.openProject(newProject.id);
                return newProject;
            }
            
            return null;
            
        } catch (error) {
            console.error('Ошибка загрузки последней работы:', error);
            return null;
        }
    }
    
    async saveProjects() {
        await ProjectStorage.saveProjects(this.projects, this.recentProjects);
        this.triggerEvent('projectsSaved', { count: this.projects.length });
    }
    
    createProject(options = {}) {
        const project = new Project({
            name: options.name || `Новая работа ${this.projects.length + 1}`,
            type: options.type || 'current',
            subject: options.subject || '',
            class: options.class || '',
            theme: options.theme || '',
            color: options.color,
            icon: options.icon
        });
        
        this.addProject(project);
        return project;
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
    
    async openProject(projectId) {
        if (this.currentProjectId === projectId) return;
        
        const project = this.getProject(projectId);
        if (!project) {
            throw new Error(`Проект не найден: ${projectId}`);
        }
        
        // Сохраняем текущий проект перед переключением
        if (this.currentProjectId) {
            await this.saveCurrentProject();
        }
        
        // Загружаем данные проекта в appData
        await this.loadProjectData(project);
        
        // Обновляем состояние
        this.currentProjectId = projectId;
        project.lastOpened = new Date().toISOString();
        project.status = 'active';
        
        // Добавляем в недавние
        this.addToRecent(projectId);
        
        // Обновляем статистику
        project.updateStats();
        
        // Сохраняем
        await this.saveProjects();
        
        // Сохраняем ID последнего активного проекта
        localStorage.setItem('lastActiveProject', projectId);
        
        this.triggerEvent('projectSwitched', { 
            oldProjectId: this.currentProjectId, 
            newProjectId: projectId 
        });
        
        console.log(`✅ Открыт проект: ${project.name}`);
        return project;
    }
    
    async loadProjectData(project) {
        return new Promise((resolve) => {
            try {
                console.log(`📥 Загрузка данных проекта: ${project.name}`);
                
                // 1. Настройки
                if (project.settings) {
                    Object.assign(appData.test, project.settings);
                }
                
                // 2. Задания и студенты
                appData.tasks = [...(project.tasks || [])];
                appData.students = [...(project.students || [])];
                
                // 3. Результаты - преобразуем в формат appData
                appData.results = [];
                for (let i = 0; i < appData.students.length; i++) {
                    appData.results[i] = new Array(appData.tasks.length).fill(0);
                }
                
                if (project.results && typeof project.results === 'object') {
                    Object.entries(project.results).forEach(([studentKey, taskScores]) => {
                        const studentIndex = parseInt(studentKey);
                        
                        if (studentIndex >= 0 && studentIndex < appData.students.length) {
                            Object.entries(taskScores).forEach(([taskKey, score]) => {
                                // Находим индекс задачи
                                let taskIndex = -1;
                                
                                // Пробуем найти по ID
                                taskIndex = appData.tasks.findIndex(task => 
                                    task.id && task.id === taskKey
                                );
                                
                                // Если не нашли, пробуем по формату task_0
                                if (taskIndex === -1 && taskKey.startsWith('task_')) {
                                    const possibleIndex = parseInt(taskKey.replace('task_', ''));
                                    if (!isNaN(possibleIndex) && possibleIndex < appData.tasks.length) {
                                        taskIndex = possibleIndex;
                                    }
                                }
                                
                                // Если все еще не нашли, используем индекс в массиве
                                if (taskIndex === -1) {
                                    taskIndex = appData.tasks.findIndex(task => 
                                        `task_${appData.tasks.indexOf(task)}` === taskKey
                                    );
                                }
                                
                                if (taskIndex !== -1 && appData.results[studentIndex]) {
                                    const numericScore = parseFloat(score);
                                    if (!isNaN(numericScore)) {
                                        appData.results[studentIndex][taskIndex] = numericScore;
                                    }
                                }
                            });
                        }
                    });
                }
                
                // 4. Ошибки
                appData.errors = {};
                if (project.errors && typeof project.errors === 'object') {
                    appData.errors = { ...project.errors };
                }
                
                // 5. Другие данные
                appData.psychologyFeatures = [...(project.psychologyFeatures || [])];
                
                console.log('✅ Данные загружены:', {
                    студентов: appData.students.length,
                    задач: appData.tasks.length,
                    результатов: appData.results.length
                });
                
                // Обновляем UI
                if (typeof updateAllTabs === 'function') {
                    setTimeout(() => {
                        updateAllTabs();
                        resolve();
                    }, 100);
                } else {
                    resolve();
                }
                
            } catch (error) {
                console.error('❌ Ошибка загрузки данных:', error);
                resolve();
            }
        });
    }
    
    async saveCurrentProject() {
        if (!this.currentProjectId) return null;
        
        const project = this.getCurrentProject();
        if (!project) return null;
        
        console.log('💾 Сохранение текущего проекта...');
        
        try {
            // 1. Сохраняем настройки
            project.settings = { ...appData.test };
            
            // 2. Задания и студенты
            project.tasks = [...appData.tasks];
            project.students = [...appData.students];
            
            // 3. Сохраняем результаты в правильном формате
            const resultsObj = {};
            
            if (Array.isArray(appData.results)) {
                appData.students.forEach((student, studentIndex) => {
                    if (appData.results[studentIndex]) {
                        const studentResults = {};
                        appData.tasks.forEach((task, taskIndex) => {
                            const score = appData.results[studentIndex][taskIndex];
                            if (score !== undefined && score !== null) {
                                const taskKey = task.id || `task_${taskIndex}`;
                                studentResults[taskKey] = parseFloat(score) || 0;
                            }
                        });
                        
                        if (Object.keys(studentResults).length > 0) {
                            resultsObj[studentIndex] = studentResults;
                        }
                    }
                });
            }
            
            project.results = resultsObj;
            
            // 4. Ошибки
            if (appData.errors && typeof appData.errors === 'object') {
                project.errors = { ...appData.errors };
            } else {
                project.errors = {};
            }
            
            // 5. Обновляем статистику и дату
            project.updateStats();
            project.updatedAt = new Date().toISOString();
            
            console.log('✅ Проект подготовлен к сохранению:', {
                название: project.name,
                студентов: project.students.length,
                задач: project.tasks.length,
                результатов: Object.keys(project.results).length
            });
            
            // 6. Сохраняем все проекты
            await this.saveProjects();
            
            this.triggerEvent('projectUpdated', { project });
            
            return project;
            
        } catch (error) {
            console.error('❌ Ошибка сохранения проекта:', error);
            throw error;
        }
    }
    
    getProject(projectId) {
        return this.projects.find(p => p.id === projectId);
    }
    
    getCurrentProject() {
        return this.getProject(this.currentProjectId);
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
        
        const index = this.projects.findIndex(p => p.id === projectId);
        if (index !== -1) {
            this.projects.splice(index, 1);
        }
        
        // Удаляем из недавних
        this.recentProjects = this.recentProjects.filter(id => id !== projectId);
        
        // Если удаляем текущий проект
        if (this.currentProjectId === projectId) {
            this.currentProjectId = null;
            localStorage.removeItem('lastActiveProject');
            
            // Открываем другой проект если есть
            if (this.projects.length > 0) {
                const lastProject = this.projects[this.projects.length - 1];
                await this.openProject(lastProject.id);
            }
        }
        
        await this.saveProjects();
        this.triggerEvent('projectDeleted', { projectId });
        
        console.log(`🗑️ Удален проект: ${project.name}`);
        return true;
    }
    
    async duplicateProject(projectId) {
        const original = this.getProject(projectId);
        if (!original) return null;
        
        const duplicate = new Project({
            ...original.toJSON(),
            id: null, // Новый ID будет сгенерирован
            name: `${original.name} (копия)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastOpened: null
        });
        
        this.addProject(duplicate);
        await this.saveProjects();
        
        console.log(`📋 Создана копия: ${duplicate.name}`);
        return duplicate;
    }
    
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
        
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(searchTerm) ||
                p.subject?.toLowerCase().includes(searchTerm)
            );
        }
        
        if (filters.subject) {
            filtered = filtered.filter(p => p.subject === filters.subject);
        }
        
        if (filters.status) {
            filtered = filtered.filter(p => p.status === filters.status);
        }
        
        if (filters.type) {
            filtered = filtered.filter(p => p.type === filters.type);
        }
        
        // Сортировка по дате изменения (новые сначала)
        filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        return filtered;
    }
    
    addToRecent(projectId) {
        this.recentProjects = this.recentProjects.filter(id => id !== projectId);
        this.recentProjects.unshift(projectId);
        
        if (this.recentProjects.length > 10) {
            this.recentProjects = this.recentProjects.slice(0, 10);
        }
    }
    
    async exportProject(projectId) {
        const project = this.getProject(projectId);
        if (!project) return;
        
        await ProjectStorage.exportProjects([project]);
    }
    
    async exportAllProjects() {
        await ProjectStorage.exportProjects(this.projects);
    }
    
    async importProjects(files) {
        const importedProjects = [];
        
        for (const file of files) {
            try {
                const result = await ProjectStorage.importFromFile(file);
                
                result.projects.forEach(projectData => {
                    const project = new Project(projectData);
                    
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
                });
                
            } catch (error) {
                console.error(`Ошибка импорта ${file.name}:`, error);
            }
        }
        
        if (importedProjects.length > 0) {
            await this.saveProjects();
            console.log(`📥 Импортировано ${importedProjects.length} проектов`);
        }
        
        return importedProjects;
    }
    
    // События
    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
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
                    console.error(`Ошибка в обработчике ${event}:`, error);
                }
            });
        }
    }
    
    // Вспомогательные методы
    async showConfirmDialog(title, message, confirmText = 'Да', cancelText = 'Отмена') {
        return new Promise((resolve) => {
            if (typeof showModal === 'function') {
                const modalContent = `
                    <div class="confirm-dialog">
                        <h4>${title}</h4>
                        <p>${message}</p>
                        <div class="modal-actions">
                            <button class="btn btn-outline" onclick="window.__confirmResult = false; closeModal();">
                                ${cancelText}
                            </button>
                            <button class="btn btn-danger" onclick="window.__confirmResult = true; closeModal();">
                                ${confirmText}
                            </button>
                        </div>
                    </div>
                `;
                
               
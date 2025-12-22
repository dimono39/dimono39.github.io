// index.js - Главная точка входа
import { ProjectManager } from './core/ProjectManager.js';
import { ProjectsSidebar } from './ui/ProjectsSidebar.js';
import { AutoSaveManager } from './features/AutoSaveManager.js';
import { Helpers } from './utils/Helpers.js';

class ProjectSystem {
    constructor() {
        this.projectManager = null;
        this.sidebar = null;
        this.autoSave = null;
        this.isInitialized = false;
    }
    
    async init() {
        if (this.isInitialized) {
            console.warn('⚠️ ProjectSystem уже инициализирован');
            return;
        }
        
        console.log('🚀 Инициализация системы проектов...');
        
        try {
            // 1. Создаем менеджер проектов
            this.projectManager = new ProjectManager();
            await this.projectManager.init();
            
            // 2. Создаем и инициализируем сайдбар
            this.sidebar = new ProjectsSidebar(this.projectManager);
            this.sidebar.init();
            
            // 3. Настраиваем автосохранение
            this.autoSave = new AutoSaveManager(this.projectManager);
            this.autoSave.init();
            
            // 4. Экспортируем глобальные функции
            this.setupGlobalFunctions();
            
            // 5. Настраиваем интеграцию с существующей системой
            this.setupIntegration();
            
            this.isInitialized = true;
            
            console.log('🎉 Система проектов успешно инициализирована!');
            console.log(`📊 Загружено проектов: ${this.projectManager.projects.length}`);
            
            // Показываем уведомление
            Helpers.showToast('Система проектов готова к работе', 'success');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации системы проектов:', error);
            Helpers.showToast('Ошибка инициализации системы проектов', 'error');
        }
    }
    
    setupGlobalFunctions() {
        // Экспортируем полезные функции
        window.Projects = {
            create: (options) => this.projectManager.createProject(options),
            open: (id) => this.projectManager.openProject(id),
            save: () => this.projectManager.saveCurrentProject(),
            delete: (id) => this.projectManager.deleteProject(id),
            export: (id) => this.projectManager.exportProject(id),
            import: (files) => this.projectManager.importProjects(files),
            getCurrent: () => this.projectManager.getCurrentProject(),
            getAll: () => this.projectManager.projects,
            search: (query) => this.projectManager.searchProjects(query)
        };
        
        // Экспортируем менеджеры для отладки
        window.projectManager = this.projectManager;
        window.projectsUI = this.sidebar;
        window.autoSaveManager = this.autoSave;
        
        // Глобальные функции
        window.createNewProject = () => this.sidebar.createNewProject();
        window.toggleProjectsSidebar = () => this.sidebar.toggle();
        window.showProjectsManager = () => this.sidebar.showProjectsManager();
        window.saveCurrentProject = () => this.projectManager.saveCurrentProject();
    }
    
    setupIntegration() {
        // Переопределяем saveData если она существует
        if (typeof window.saveData === 'function') {
            const originalSaveData = window.saveData;
            window.saveData = async function() {
                // Сохраняем в проектную систему
                if (window.projectManager && window.projectManager.currentProjectId) {
                    try {
                        await window.projectManager.saveCurrentProject();
                    } catch (error) {
                        console.error('Ошибка сохранения проекта:', error);
                    }
                }
                
                // Вызываем оригинальную функцию
                return originalSaveData();
            };
            
            console.log('✅ Интегрировано с saveData');
        }
        
        // Автосинхронизация при изменениях
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('score-input') && 
                this.projectManager.currentProjectId) {
                this.autoSave.markAsChanged();
            }
        });
        
        // Синхронизация настроек предмета/класса
        const syncSettings = () => {
            if (this.projectManager.currentProjectId) {
                this.autoSave.markAsChanged();
            }
        };
        
        ['subject', 'class', 'workType'].forEach(name => {
            const input = document.querySelector(`[name="${name}"], #${name}`);
            if (input) {
                input.addEventListener('change', syncSettings);
            }
        });
        
        console.log('✅ Интеграция с системой настроена');
    }
    
    getStats() {
        if (!this.isInitialized) return null;
        
        return {
            projects: this.projectManager.getStats(),
            autoSave: this.autoSave.getStatus(),
            storage: this.projectManager.storageStats
        };
    }
    
    async runTests() {
        console.log('🧪 Запуск тестов системы проектов...');
        
        try {
            // Тест 1: Создание проекта
            const testProject = this.projectManager.createProject({ 
                name: 'Тестовая работа' 
            });
            console.assert(testProject.id, '❌ Проект должен иметь ID');
            console.log('✅ Тест 1: Создание проекта пройдено');
            
            // Тест 2: Сохранение
            await this.projectManager.saveProjects();
            console.log('✅ Тест 2: Сохранение пройдено');
            
            // Тест 3: Открытие проекта
            await this.projectManager.openProject(testProject.id);
            console.assert(this.projectManager.currentProjectId === testProject.id, 
                '❌ Должен быть открыт тестовый проект');
            console.log('✅ Тест 3: Открытие проекта пройдено');
            
            // Тест 4: Поиск
            const found = this.projectManager.searchProjects('Тестовая');
            console.assert(found.length > 0, '❌ Должен найти тестовый проект');
            console.log('✅ Тест 4: Поиск пройден');
            
            // Тест 5: Удаление
            await this.projectManager.deleteProject(testProject.id, false);
            console.assert(!this.projectManager.getProject(testProject.id), 
                '❌ Проект должен быть удален');
            console.log('✅ Тест 5: Удаление пройдено');
            
            console.log('🎉 Все тесты пройдены успешно!');
            
        } catch (error) {
            console.error('❌ Тест не пройден:', error);
        }
    }
}

// Создаем и экспортируем глобальный экземпляр
const projectSystem = new ProjectSystem();

// Автоматическая инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => projectSystem.init(), 1000);
});

export { projectSystem, ProjectManager, ProjectsSidebar, AutoSaveManager, Helpers };
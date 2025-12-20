// modules/projects-init.js
async function initializeProjectSystem() {
    console.log('🚀 Initializing Project Management System...');
    
    try {
        // Инициализируем менеджер проектов
        if (!window.projectManager) {
            window.projectManager = new ProjectManager();
        }
        
        if (!window.projectsUI) {
            window.projectsUI = new ProjectsUI(window.projectManager);
        }
        
        if (!window.autoSaveManager) {
            window.autoSaveManager = new AutoSaveManager(window.projectManager);
        }
        
        // Загружаем проекты
        await window.projectManager.init();
        
        // Инициализируем UI
        window.projectsUI.init();
        
        // Инициализируем автосохранение
        window.autoSaveManager.init();
        
        // Интегрируем с существующей системой
        integrateWithExistingSystem();
        
        // Запускаем тесты
        if (window.location.hash === '#test') {
            await window.projectManager.runTests();
        }
        
        console.log('✅ Project Management System initialized successfully!');
        
        // Показываем приветственное сообщение
        setTimeout(() => {
            if (window.projectManager.projects.length === 0) {
                showModal('Добро пожаловать!', `
                    <div class="welcome-message">
                        <h3>🎉 Добро пожаловать в систему анализа результатов!</h3>
                        <p>Теперь вы можете:</p>
                        <ul>
                            <li>Создавать несколько работ по разным темам</li>
                            <li>Быстро переключаться между работами</li>
                            <li>Автоматически сохранять изменения</li>
                            <li>Импортировать и экспортировать работы</li>
                        </ul>
                        <p>Начните с создания новой работы или импортируйте существующую.</p>
                        <div class="modal-actions">
                            <button class="btn" onclick="closeModal()">Позже</button>
                            <button class="btn btn-primary" onclick="closeModal(); projectsUI.createNewProject()">
                                Создать первую работу
                            </button>
                        </div>
                    </div>
                `);
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Failed to initialize Project Management System:', error);
        showNotification('Ошибка инициализации системы проектов', 'error');
    }
}

function integrateWithExistingSystem() {
    // Переопределяем глобальные функции
    const originalFunctions = {
        saveData: window.saveData,
        scheduleAutoSave: window.scheduleAutoSave,
        exportAppData: window.exportAppData,
        handleFileImport: window.handleFileImport
    };
    
    // Сохранение данных
    window.saveData = function() {
        if (window.projectManager && window.projectManager.currentProjectId) {
            window.projectManager.saveCurrentProject();
        }
        if (originalFunctions.saveData) {
            originalFunctions.saveData();
        }
    };
    
    // Автосохранение
    window.scheduleAutoSave = function() {
        if (window.autoSaveManager) {
            window.autoSaveManager.markAsChanged();
        }
        if (originalFunctions.scheduleAutoSave) {
            originalFunctions.scheduleAutoSave();
        }
    };
    
    // Экспорт
    window.exportAppData = function(format = 'json') {
        if (window.projectManager && window.projectManager.currentProjectId) {
            return window.projectManager.exportProject(
                window.projectManager.currentProjectId, 
                format
            );
        }
        if (originalFunctions.exportAppData) {
            return originalFunctions.exportAppData(format);
        }
    };
    
    // Импорт
    window.handleFileImport = function(event) {
        if (window.projectManager) {
            const files = Array.from(event.target.files);
            if (files.length > 0) {
                window.projectManager.importProjects(files);
            }
        }
        if (originalFunctions.handleFileImport) {
            originalFunctions.handleFileImport(event);
        }
        event.target.value = '';
    };
    
    // Глобальные функции для доступа из HTML
    window.createNewProject = () => window.projectsUI?.createNewProject();
    window.showProjectsManager = () => window.projectsUI?.showProjectsManager();
    window.toggleProjectsSidebar = () => window.projectsUI?.toggleSidebar();
    
    console.log('🔗 Project system integrated with existing functions');
}

// Запускаем инициализацию при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProjectSystem);
} else {
    initializeProjectSystem();
}
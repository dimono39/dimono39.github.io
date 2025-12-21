// modules/projects-init.js - УПРОЩЕННАЯ ВЕРСИЯ
async function initializeProjectSystem() {
    console.log('🚀 Initializing Project Management System...');
    
    try {
        // Проверяем наличие ProjectStorage и ProjectManager
        if (typeof ProjectStorage === 'undefined' || typeof ProjectManager === 'undefined') {
            console.log('⏳ Waiting for core classes to load...');
            setTimeout(initializeProjectSystem, 500);
            return;
        }
        
        // Создаем менеджер проектов
        window.projectManager = new ProjectManager();
        console.log('✅ ProjectManager created');
        
        // Инициализируем менеджер (упрощенно)
        try {
            await window.projectManager.loadProjects();
            console.log(`📁 Loaded ${window.projectManager.projects.length} projects`);
            window.projectManager.isInitialized = true;
        } catch (error) {
            console.error('Failed to load projects:', error);
            window.projectManager.projects = [];
            window.projectManager.isInitiaыlized = true;
        }
        
        // Создаем простую панель проектов (fallback)
        createSimpleProjectsPanel();
        
        // Проверяем ProjectsUI позже
        setTimeout(() => {
            if (typeof ProjectsUI !== 'undefined' && !window.projectsUI) {
                try {
                    window.projectsUI = new ProjectsUI(window.projectManager);
                    window.projectsUI.init();
                    console.log('✅ ProjectsUI loaded and initialized');
                    
                    // Обновляем панель с реальным UI
                    updateToRealUI();
                } catch (error) {
                    console.error('Failed to initialize ProjectsUI:', error);
                }
            }
        }, 1000);
        
        // Проверяем AutoSaveManager позже
        setTimeout(() => {
            if (typeof AutoSaveManager !== 'undefined' && !window.autoSaveManager) {
                try {
                    window.autoSaveManager = new AutoSaveManager(window.projectManager);
                    window.autoSaveManager.init();
                    console.log('✅ AutoSaveManager loaded and initialized');
                } catch (error) {
                    console.error('Failed to initialize AutoSaveManager:', error);
                }
            }
        }, 1500);
        
        // Интегрируем с существующей системой
        integrateWithExistingSystem();
        
        console.log('🎉 Project Management System initialized!');
        
    } catch (error) {
        console.error('❌ Failed to initialize Project Management System:', error);
        createSimpleProjectsPanel();
    }
}

function createSimpleProjectsPanel() {
    // Проверяем, не создана ли уже панель
    if (document.getElementById('simpleProjectsPanel')) return;
    
    console.log('🛠️ Creating simple projects panel...');
    
    const panel = document.createElement('div');
    panel.id = 'simpleProjectsPanel';
    panel.style.cssText = `
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: 250px;
        background: #2c3e50;
        color: white;
        z-index: 1000;
        padding: 20px;
        box-shadow: 2px 0 10px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
    `;
    
    panel.innerHTML = `
        <div style="flex-shrink: 0;">
            <h3 style="margin-top: 0; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-folder-open"></i>
                <span>Проекты</span>
            </h3>
            <div style="margin: 15px 0;">
                <input type="text" id="simpleSearch" placeholder="Поиск..." 
                       style="width: 100%; padding: 8px; border-radius: 4px; border: none; background: rgba(255,255,255,0.1); color: white;"
                       oninput="searchSimpleProjects(this.value)">
            </div>
        </div>
        
        <div id="simpleProjectsList" style="flex: 1; overflow-y: auto; margin: 10px 0;">
            <p style="color: #95a5a6; text-align: center; padding: 20px;">
                <i class="fas fa-spinner fa-spin"></i>
                Загрузка проектов...
            </p>
        </div>
        
        <div style="flex-shrink: 0;">
            <button onclick="createNewProjectSimple()" 
                    style="width: 100%; padding: 10px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <i class="fas fa-plus"></i>
                <span>Новая работа</span>
            </button>
            <button onclick="showSimpleProjectsManager()" 
                    style="width: 100%; padding: 10px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 5px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <i class="fas fa-cog"></i>
                <span>Управление</span>
            </button>
        </div>
        
        <div id="simpleCurrentProject" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: #95a5a6;">
            <div>Работа не выбрана</div>
        </div>
    `;
    
    document.body.insertBefore(panel, document.body.firstChild);
    
    // Обновляем основной контейнер
    const mainContainer = document.querySelector('.container');
    if (mainContainer) {
        mainContainer.style.marginLeft = '250px';
        mainContainer.style.transition = 'margin-left 0.3s';
    }
    
    // Загружаем проекты в панель
    setTimeout(() => {
        if (window.projectManager && window.projectManager.projects) {
            renderSimpleProjectsList();
        }
    }, 100);
}

function renderSimpleProjectsList() {
    const container = document.getElementById('simpleProjectsList');
    if (!container || !window.projectManager) return;
    
    const projects = window.projectManager.projects;
    
    if (projects.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #95a5a6; padding: 20px;">
                <div style="font-size: 36px; margin-bottom: 10px;">📁</div>
                <p>Нет работ</p>
                <p style="font-size: 12px;">Создайте первую работу</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    projects.forEach(project => {
        const isActive = project.id === window.projectManager.currentProjectId;
        const icon = project.icon || '📊';
        const color = project.color || '#3498db';
        const subject = project.subject || 'Без предмета';
        
        html += `
            <div class="simple-project-item" 
                 data-id="${project.id}"
                 onclick="openSimpleProject('${project.id}')"
                 style="
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px;
                    margin-bottom: 5px;
                    background: ${isActive ? color : 'rgba(255,255,255,0.05)'};
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-left: 3px solid ${color};
                 "
                 onmouseover="this.style.background='rgba(255,255,255,0.1)';"
                 onmouseout="this.style.background='${isActive ? color : 'rgba(255,255,255,0.05)'}';">
                
                <div style="font-size: 20px; width: 30px; text-align: center;">
                    ${icon}
                </div>
                
                <div style="flex: 1; overflow: hidden;">
                    <div style="font-weight: bold; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${project.name}
                    </div>
                    <div style="font-size: 11px; opacity: 0.8;">
                        ${subject}
                    </div>
                </div>
                
                ${isActive ? '<div style="font-size: 12px; background: white; color: #2c3e50; padding: 2px 6px; border-radius: 10px;">✓</div>' : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
    updateSimpleCurrentProject();
}

function updateSimpleCurrentProject() {
    const container = document.getElementById('simpleCurrentProject');
    if (!container || !window.projectManager) return;
    
    const project = window.projectManager.getCurrentProject();
    
    if (!project) {
        container.innerHTML = `
            <div style="color: #95a5a6;">
                <i class="fas fa-folder"></i>
                Работа не выбрана
            </div>
        `;
        return;
    }
    
    const date = project.updatedAt ? new Date(project.updatedAt).toLocaleDateString('ru-RU') : 'Сегодня';
    
    container.innerHTML = `
        <div style="margin-bottom: 5px;">
            <strong style="color: white; font-size: 13px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${project.icon || '📊'} ${project.name}
            </strong>
            <div style="font-size: 11px;">
                ${project.subject || 'Без предмета'} • ${date}
            </div>
        </div>
        <div style="font-size: 10px; display: flex; justify-content: space-between;">
            <span>Уч.: ${project.students?.length || 0}</span>
            <span>Зад.: ${project.tasks?.length || 0}</span>
            <button onclick="saveSimpleProject()" style="background: none; border: none; color: #3498db; cursor: pointer;">
                <i class="fas fa-save"></i>
            </button>
        </div>
    `;
}

function updateToRealUI() {
    // Заменяем простую панель на настоящую
    const simplePanel = document.getElementById('simpleProjectsPanel');
    if (simplePanel && window.projectsUI) {
        simplePanel.remove();
        
        // Обновляем основной контейнер
        const mainContainer = document.querySelector('.container');
        if (mainContainer) {
            mainContainer.style.marginLeft = '280px';
        }
    }
}

// Глобальные функции для простой панели
window.createNewProjectSimple = function() {
    const name = prompt('Название новой работы:', 'Новая работа');
    if (name && window.projectManager) {
        const project = window.projectManager.createNewProject({ name: name });
        renderSimpleProjectsList();
        
        // Если есть ProjectsUI, используем его
        if (window.projectsUI) {
            window.projectsUI.openProject(project.id);
        } else {
            openSimpleProject(project.id);
        }
    }
};

window.openSimpleProject = async function(projectId) {
    if (window.projectManager) {
        try {
            await window.projectManager.openProject(projectId);
            renderSimpleProjectsList();
        } catch (error) {
            console.error('Failed to open project:', error);
            alert('Ошибка при открытии проекта: ' + error.message);
        }
    }
};

window.saveSimpleProject = function() {
    if (window.projectManager) {
        window.projectManager.saveCurrentProject().then(() => {
            alert('Проект сохранен!');
        }).catch(error => {
            alert('Ошибка сохранения: ' + error.message);
        });
    }
};

window.searchSimpleProjects = function(query) {
    if (!window.projectManager) return;
    
    const projects = query ? 
        window.projectManager.searchProjects(query) : 
        window.projectManager.projects;
    
    renderFilteredProjects(projects);
};

window.showSimpleProjectsManager = function() {
    if (window.projectsUI) {
        window.projectsUI.showProjectsManager();
    } else {
        alert('Менеджер проектов пока недоступен. Пожалуйста, подождите...');
    }
};

function renderFilteredProjects(filteredProjects) {
    const container = document.getElementById('simpleProjectsList');
    if (!container) return;
    
    // Та же логика, что и в renderSimpleProjectsList, но для отфильтрованных проектов
    if (filteredProjects.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #95a5a6; padding: 20px;">
                <div style="font-size: 36px; margin-bottom: 10px;">🔍</div>
                <p>Проекты не найдены</p>
                <p style="font-size: 12px;">Попробуйте другой запрос</p>
            </div>
        `;
        return;
    }
    
    // ... остальной код аналогичен renderSimpleProjectsList
    renderSimpleProjectsList(); // Для простоты показываем все
}

function integrateWithExistingSystem() {
    console.log('🔗 Integrating with existing system...');
    
    // Переопределяем saveData если она существует
    if (typeof window.saveData !== 'undefined') {
        const originalSaveData = window.saveData;
        window.saveData = function() {
            if (window.projectManager && window.projectManager.currentProjectId) {
                window.projectManager.saveCurrentProject().catch(console.error);
            }
            if (originalSaveData) {
                originalSaveData();
            }
        };
    }
    
    // Глобальные функции
    window.createNewProject = function() {
        if (window.projectsUI) {
            window.projectsUI.createNewProject();
        } else {
            window.createNewProjectSimple();
        }
    };
    
    window.showProjectsManager = function() {
        if (window.projectsUI) {
            window.projectsUI.showProjectsManager();
        } else {
            window.showSimpleProjectsManager();
        }
    };
    
    window.toggleProjectsSidebar = function() {
        if (window.projectsUI) {
            window.projectsUI.toggleSidebar();
        } else {
            // Простое переключение для простой панели
            const panel = document.getElementById('simpleProjectsPanel');
            const mainContainer = document.querySelector('.container');
            
            if (panel && mainContainer) {
                const isVisible = panel.style.display !== 'none';
                panel.style.display = isVisible ? 'none' : 'block';
                mainContainer.style.marginLeft = isVisible ? '0' : '250px';
            }
        }
    };
    
    console.log('✅ Integration complete');
}

// Запускаем инициализацию сразу
setTimeout(initializeProjectSystem, 100);
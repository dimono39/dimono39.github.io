// modules/projects-init-fixed.js - Исправленная версия
async function initializeProjectSystem() {
    console.log('🚀 Initializing Project Management System (FIXED)...');
    
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
        
        // Инициализируем менеджер
        try {
            await window.projectManager.loadProjects();
            console.log(`📁 Loaded ${window.projectManager.projects.length} projects`);
            window.projectManager.isInitialized = true;
            
            // Пытаемся открыть последний проект
            const lastActive = await window.projectManager.loadLastActiveProject();
            if (lastActive) {
                console.log(`📂 Opening last active project: ${lastActive.name}`);
                await window.projectManager.openProject(lastActive.id);
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
            window.projectManager.projects = [];
            window.projectManager.isInitialized = true;
        }
        
        // Создаем простую панель проектов
        createSimpleProjectsPanel();
        
        // Проверяем ProjectsUI позже
        setTimeout(() => {
            if (typeof ProjectsUI !== 'undefined' && !window.projectsUI) {
                try {
                    window.projectsUI = new ProjectsUI(window.projectManager);
                    window.projectsUI.init();
                    console.log('✅ ProjectsUI loaded and initialized');
                    
                    updateToRealUI();
                } catch (error) {
                    console.error('Failed to initialize ProjectsUI:', error);
                }
            }
        }, 1000);
        
        // Интегрируем с существующей системой
        integrateWithExistingSystem();
        
        // Устанавливаем автосинхронизацию
        setupProjectAutoSync();
        
        console.log('🎉 Project Management System initialized!');
        
    } catch (error) {
        console.error('❌ Failed to initialize Project Management System:', error);
        createSimpleProjectsPanel();
    }
}

function setupProjectAutoSync() {
    // Автосохранение при изменении результатов
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('score-input') || 
            e.target.closest('.score-input')) {
            if (window.projectManager && window.projectManager.currentProjectId) {
                setTimeout(() => {
                    window.syncAppDataToProject && window.syncAppDataToProject();
                }, 1000);
            }
        }
    });
    
    // Автосохранение при изменении предмета/класса
    const settingsInputs = ['subject', 'class', 'workType', 'theme'];
    settingsInputs.forEach(name => {
        const input = document.querySelector(`[name="${name}"], #${name}`);
        if (input) {
            input.addEventListener('change', function() {
                if (window.projectManager && window.projectManager.currentProjectId) {
                    setTimeout(() => {
                        window.syncAppDataToProject && window.syncAppDataToProject();
                    }, 500);
                }
            });
        }
    });
}

// ... остальной код createSimpleProjectsPanel и функций из предыдущего файла ...
// (используйте ваш существующий код с кнопками управления)


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
        width: 280px;
        background: #2c3e50;
        color: white;
        z-index: 1000;
        padding: 20px;
        box-shadow: 2px 0 10px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    panel.innerHTML = `
        <div style="flex-shrink: 0;">
            <h3 style="margin-top: 0; display: flex; align-items: center; gap: 10px; color: #ecf0f1;">
                <i class="fas fa-folder-open"></i>
                <span style="font-weight: 600;">Мои работы</span>
                <button id="togglePanelBtn" style="margin-left: auto; background: none; border: none; color: #bdc3c7; cursor: pointer; font-size: 16px;" onclick="toggleSimpleProjectsPanel()">
                    <i class="fas fa-chevron-left"></i>
                </button>
            </h3>
            <div style="margin: 15px 0;">
                <div style="position: relative;">
                    <i class="fas fa-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #7f8c8d;"></i>
                    <input type="text" id="simpleSearch" placeholder="Поиск работ..." 
                           style="width: 100%; padding: 10px 10px 10px 35px; border-radius: 6px; border: 1px solid #34495e; background: #34495e; color: white; font-size: 14px;"
                           oninput="searchSimpleProjects(this.value)">
                </div>
            </div>
        </div>
        
        <div id="simpleProjectsList" style="flex: 1; overflow-y: auto; margin: 10px 0; padding-right: 5px;">
            <p style="color: #95a5a6; text-align: center; padding: 20px;">
                <i class="fas fa-spinner fa-spin"></i>
                Загрузка проектов...
            </p>
        </div>
        
        <div style="flex-shrink: 0; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
            <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                <button onclick="createNewProjectSimple()" 
                        style="flex: 1; padding: 10px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s;"
                        onmouseover="this.style.background='#2980b9'"
                        onmouseout="this.style.background='#3498db'">
                    <i class="fas fa-plus"></i>
                    <span>Новая работа</span>
                </button>
                <button onclick="importSimpleProject()" 
                        style="padding: 10px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s;"
                        onmouseover="this.style.background='rgba(255,255,255,0.2)'"
                        onmouseout="this.style.background='rgba(255,255,255,0.1)'"
                        title="Импортировать проект">
                    <i class="fas fa-file-import"></i>
                </button>
            </div>
            
            <div style="display: flex; gap: 8px;">
                <button onclick="showSimpleProjectsManager()" 
                        style="flex: 1; padding: 10px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s;"
                        onmouseover="this.style.background='rgba(255,255,255,0.2)'"
                        onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                    <i class="fas fa-cog"></i>
                    <span>Управление</span>
                </button>
                <button onclick="exportAllSimpleProjects()" 
                        style="padding: 10px; background: rgba(46, 204, 113, 0.2); color: #2ecc71; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s;"
                        onmouseover="this.style.background='rgba(46, 204, 113, 0.3)'"
                        onmouseout="this.style.background='rgba(46, 204, 113, 0.2)'"
                        title="Экспорт всех работ">
                    <i class="fas fa-file-export"></i>
                </button>
            </div>
        </div>
        
        <div id="simpleCurrentProject" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 13px; color: #bdc3c7;">
            <div style="color: #ecf0f1; font-weight: 600; margin-bottom: 5px;">
                <i class="fas fa-folder"></i>
                Работа не выбрана
            </div>
            <div style="font-size: 12px; color: #95a5a6;">
                Нажмите на работу из списка для открытия
            </div>
        </div>
    `;
    
    document.body.insertBefore(panel, document.body.firstChild);
    
    // Обновляем основной контейнер
    const mainContainer = document.querySelector('.container');
    if (mainContainer) {
        mainContainer.style.marginLeft = '280px';
        mainContainer.style.transition = 'margin-left 0.3s';
    }
    
    // Добавляем CSS для скроллбара
    addCustomScrollbarStyles();
    
    // Загружаем проекты в панель
    setTimeout(() => {
        if (window.projectManager && window.projectManager.projects) {
            renderSimpleProjectsList();
        }
    }, 100);
}

function addCustomScrollbarStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #simpleProjectsList::-webkit-scrollbar {
            width: 6px;
        }
        #simpleProjectsList::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.05);
            border-radius: 3px;
        }
        #simpleProjectsList::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.2);
            border-radius: 3px;
        }
        #simpleProjectsList::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.3);
        }
    `;
    document.head.appendChild(style);
}

function renderSimpleProjectsList() {
    const container = document.getElementById('simpleProjectsList');
    if (!container || !window.projectManager) return;
    
    const projects = window.projectManager.projects;
    
    if (projects.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #95a5a6; padding: 20px;">
                <div style="font-size: 36px; margin-bottom: 10px;">📁</div>
                <p style="margin-bottom: 8px; color: #ecf0f1; font-weight: 600;">Нет работ</p>
                <p style="font-size: 13px;">Создайте первую работу</p>
                <button onclick="createNewProjectSimple()" 
                        style="margin-top: 15px; padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-plus"></i> Создать работу
                </button>
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
        const date = project.updatedAt ? 
            new Date(project.updatedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }) : 
            'Недавно';
        
        // Статус проекта
        const statusText = getStatusText(project.status);
        const statusClass = `status-${project.status}`;
        
        html += `
            <div class="simple-project-item" 
                 data-id="${project.id}"
                 style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    margin-bottom: 8px;
                    background: ${isActive ? color : 'rgba(255,255,255,0.05)'};
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-left: 4px solid ${color};
                    position: relative;
                 "
                 onmouseover="this.style.background='${isActive ? color : 'rgba(255,255,255,0.1)'}';"
                 onmouseout="this.style.background='${isActive ? color : 'rgba(255,255,255,0.05)'}';">
                
                <div style="font-size: 20px; width: 32px; text-align: center; flex-shrink: 0;">
                    ${icon}
                </div>
                
                <div style="flex: 1; overflow: hidden; min-width: 0;" onclick="openSimpleProject('${project.id}')">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <div style="font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: ${isActive ? 'white' : '#ecf0f1'};">
                            ${project.name}
                        </div>
                        <span class="project-status ${statusClass}" style="
                            display: inline-block;
                            padding: 2px 8px;
                            border-radius: 12px;
                            font-size: 10px;
                            font-weight: bold;
                            white-space: nowrap;
                            margin-left: auto;
                        ">
                            ${statusText}
                        </span>
                    </div>
                    
                    <div style="font-size: 12px; color: ${isActive ? 'rgba(255,255,255,0.9)' : '#95a5a6'}; display: flex; justify-content: space-between; align-items: center;">
                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${subject}
                        </span>
                        <span style="font-size: 11px; opacity: 0.8; margin-left: 8px; flex-shrink: 0;">
                            ${date}
                        </span>
                    </div>
                </div>
                
                <div class="project-actions" style="display: none; position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: #2c3e50; border-radius: 6px; padding: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                    <button onclick="event.stopPropagation(); renameSimpleProject('${project.id}')" 
                            style="background: none; border: none; color: #3498db; cursor: pointer; padding: 6px 10px; border-radius: 4px; transition: background 0.2s;"
                            onmouseover="this.style.background='rgba(52, 152, 219, 0.1)'"
                            onmouseout="this.style.background='transparent'"
                            title="Переименовать">
                        <i class="fas fa-edit fa-sm"></i>
                    </button>
                    <button onclick="event.stopPropagation(); duplicateSimpleProject('${project.id}')" 
                            style="background: none; border: none; color: #2ecc71; cursor: pointer; padding: 6px 10px; border-radius: 4px; transition: background 0.2s;"
                            onmouseover="this.style.background='rgba(46, 204, 113, 0.1)'"
                            onmouseout="this.style.background='transparent'"
                            title="Дублировать">
                        <i class="fas fa-copy fa-sm"></i>
                    </button>
                    <button onclick="event.stopPropagation(); deleteSimpleProject('${project.id}')" 
                            style="background: none; border: none; color: #e74c3c; cursor: pointer; padding: 6px 10px; border-radius: 4px; transition: background 0.2s;"
                            onmouseover="this.style.background='rgba(231, 76, 60, 0.1)'"
                            onmouseout="this.style.background='transparent'"
                            title="Удалить">
                        <i class="fas fa-trash fa-sm"></i>
                    </button>
                </div>
                
                ${isActive ? '<div style="font-size: 12px; background: white; color: #2c3e50; padding: 3px 8px; border-radius: 12px; font-weight: 600; margin-left: 8px; flex-shrink: 0;">✓</div>' : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Добавляем обработчики для показа кнопок действий
    document.querySelectorAll('.simple-project-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            const actions = this.querySelector('.project-actions');
            if (actions) actions.style.display = 'block';
        });
        
        item.addEventListener('mouseleave', function() {
            const actions = this.querySelector('.project-actions');
            if (actions) actions.style.display = 'none';
        });
    });
    
    updateSimpleCurrentProject();
}

function getStatusText(status) {
    const statusMap = {
        'draft': 'Черновик',
        'active': 'Активна',
        'completed': 'Завершена',
        'archived': 'Архив'
    };
    return statusMap[status] || status;
}

function updateSimpleCurrentProject() {
    const container = document.getElementById('simpleCurrentProject');
    if (!container || !window.projectManager) return;
    
    const project = window.projectManager.getCurrentProject();
    
    if (!project) {
        container.innerHTML = `
            <div style="color: #ecf0f1; font-weight: 600; margin-bottom: 5px;">
                <i class="fas fa-folder"></i>
                Работа не выбрана
            </div>
            <div style="font-size: 12px; color: #95a5a6;">
                Нажмите на работу из списка для открытия
            </div>
        `;
        return;
    }
    
    const date = project.updatedAt ? 
        new Date(project.updatedAt).toLocaleDateString('ru-RU', { 
            day: '2-digit', 
            month: 'long',
            year: 'numeric'
        }) : 'Сегодня';
    
    container.innerHTML = `
        <div style="margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <div style="font-size: 18px; color: ${project.color || '#3498db'}">
                    ${project.icon || '📊'}
                </div>
                <strong style="color: #ecf0f1; font-size: 14px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${project.name}
                </strong>
            </div>
            <div style="font-size: 12px; color: #bdc3c7;">
                ${project.subject || 'Без предмета'} • ${project.class || 'Без класса'} • ${date}
            </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
            <div style="display: flex; gap: 10px;">
                <span title="Учеников">
                    <i class="fas fa-user-graduate"></i> ${project.students?.length || 0}
                </span>
                <span title="Заданий">
                    <i class="fas fa-tasks"></i> ${project.tasks?.length || 0}
                </span>
                <span title="Средний балл">
                    <i class="fas fa-chart-line"></i> ${project.stats?.avgGrade ? project.stats.avgGrade.toFixed(1) : '0.0'}
                </span>
            </div>
            <div style="display: flex; gap: 5px;">
                <button onclick="event.stopPropagation(); renameSimpleProject('${project.id}')" 
                        style="background: none; border: none; color: #3498db; cursor: pointer; padding: 4px 8px; border-radius: 4px; font-size: 12px;"
                        title="Переименовать">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="saveSimpleProject()" 
                        style="background: rgba(52, 152, 219, 0.2); color: #3498db; border: none; cursor: pointer; padding: 4px 12px; border-radius: 4px; font-weight: 600; font-size: 12px; transition: background 0.2s;"
                        onmouseover="this.style.background='rgba(52, 152, 219, 0.3)'"
                        onmouseout="this.style.background='rgba(52, 152, 219, 0.2)'"
                        title="Сохранить">
                    <i class="fas fa-save"></i> Сохранить
                </button>
            </div>
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
    const name = prompt('Введите название новой работы:', 'Новая работа');
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
            showNotification(`📂 Открыта работа`, 'success');
        } catch (error) {
            console.error('Failed to open project:', error);
            alert('Ошибка при открытии проекта: ' + error.message);
        }
    }
};

window.saveSimpleProject = function() {
    if (window.projectManager) {
        window.projectManager.saveCurrentProject().then(() => {
            showNotification('💾 Проект сохранен!', 'success');
            renderSimpleProjectsList();
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
        showSimpleProjectsManagerModal();
    }
};

function showSimpleProjectsManagerModal() {
    const projects = window.projectManager.projects;
    
    let modalContent = `
        <div style="max-width: 800px; max-height: 70vh; overflow: auto;">
            <h4 style="margin-top: 0; color: #2c3e50;">Управление работами (${projects.length})</h4>
            
            <div style="margin-bottom: 20px; display: flex; gap: 10px;">
                <input type="text" id="managerSearchInput" placeholder="Поиск по названию, предмету..." 
                       style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"
                       oninput="filterManagerProjects()">
                <select id="managerStatusFilter" onchange="filterManagerProjects()" 
                        style="padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                    <option value="">Все статусы</option>
                    <option value="draft">Черновики</option>
                    <option value="active">Активные</option>
                    <option value="completed">Завершенные</option>
                    <option value="archived">Архив</option>
                </select>
            </div>
            
            <div id="managerProjectsList" style="margin-bottom: 20px;">
                ${projects.map(project => {
                    const date = new Date(project.updatedAt).toLocaleDateString('ru-RU');
                    return `
                        <div style="display: flex; align-items: center; padding: 12px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 8px; background: #f8f9fa;">
                            <div style="font-size: 24px; color: ${project.color}; margin-right: 15px; width: 40px; text-align: center;">
                                ${project.icon}
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #2c3e50; margin-bottom: 4px;">${project.name}</div>
                                <div style="font-size: 13px; color: #7f8c8d;">
                                    ${project.subject || 'Без предмета'} • ${project.class || 'Без класса'} • ${date}
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px; margin-left: 15px;">
                                <button onclick="openSimpleProject('${project.id}'); closeModal();" 
                                        style="padding: 6px 12px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
                                    Открыть
                                </button>
                                <button onclick="renameSimpleProject('${project.id}')" 
                                        style="padding: 6px 12px; background: #f39c12; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
                                    Переименовать
                                </button>
                                <button onclick="deleteSimpleProject('${project.id}')" 
                                        style="padding: 6px 12px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
                                    Удалить
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px solid #eee;">
                <div>
                    <button onclick="createNewProjectSimple(); closeModal();" 
                            style="padding: 10px 20px; background: #2ecc71; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-plus"></i> Новая работа
                    </button>
                    <button onclick="exportAllSimpleProjects();" 
                            style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; margin-left: 10px;">
                        <i class="fas fa-file-export"></i> Экспорт всех
                    </button>
                </div>
                <button onclick="closeModal()" 
                        style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    Закрыть
                </button>
            </div>
        </div>
    `;
    
    if (typeof showModal === 'function') {
        showModal('Управление работами', modalContent, 'large');
    } else {
        // Fallback
        const modal = window.open('', '_blank', 'width=900,height=600');
        modal.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Управление работами</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
                    .project-item { background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
                </style>
            </head>
            <body>
                ${modalContent}
            </body>
            </html>
        `);
    }
}

function filterManagerProjects() {
    const searchInput = document.getElementById('managerSearchInput');
    const statusFilter = document.getElementById('managerStatusFilter');
    
    if (!searchInput || !statusFilter) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    
    const projects = window.projectManager.projects.filter(project => {
        const matchesSearch = !searchTerm || 
            project.name.toLowerCase().includes(searchTerm) ||
            (project.subject && project.subject.toLowerCase().includes(searchTerm)) ||
            (project.class && project.class.toLowerCase().includes(searchTerm));
        
        const matchesStatus = !status || project.status === status;
        
        return matchesSearch && matchesStatus;
    });
    
    const container = document.getElementById('managerProjectsList');
    if (container) {
        container.innerHTML = projects.map(project => {
            const date = new Date(project.updatedAt).toLocaleDateString('ru-RU');
            return `
                <div style="display: flex; align-items: center; padding: 12px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 8px; background: #f8f9fa;">
                    <div style="font-size: 24px; color: ${project.color}; margin-right: 15px; width: 40px; text-align: center;">
                        ${project.icon}
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #2c3e50; margin-bottom: 4px;">${project.name}</div>
                        <div style="font-size: 13px; color: #7f8c8d;">
                            ${project.subject || 'Без предмета'} • ${project.class || 'Без класса'} • ${date}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; margin-left: 15px;">
                        <button onclick="window.opener.openSimpleProject('${project.id}'); window.close();" 
                                style="padding: 6px 12px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
                            Открыть
                        </button>
                        <button onclick="window.opener.renameSimpleProject('${project.id}')" 
                                style="padding: 6px 12px; background: #f39c12; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
                            Переименовать
                        </button>
                        <button onclick="window.opener.deleteSimpleProject('${project.id}')" 
                                style="padding: 6px 12px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
                            Удалить
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Новые функции управления проектами

window.renameSimpleProject = async function(projectId) {
    const project = window.projectManager.getProject(projectId);
    if (!project) return;
    
    const newName = prompt('Введите новое название для работы:', project.name);
    if (newName && newName.trim() && newName !== project.name) {
        project.name = newName.trim();
        project.updatedAt = new Date().toISOString();
        
        await window.projectManager.saveProjects();
        renderSimpleProjectsList();
        
        showNotification('✅ Название изменено', 'success');
    }
};

window.duplicateSimpleProject = async function(projectId) {
    const original = window.projectManager.getProject(projectId);
    if (!original) return;
    
    const duplicate = await window.projectManager.duplicateProject(projectId);
    if (duplicate) {
        renderSimpleProjectsList();
        showNotification(`📋 Создана копия: ${duplicate.name}`, 'success');
    }
};

window.deleteSimpleProject = async function(projectId) {
    const project = window.projectManager.getProject(projectId);
    if (!project) return;
    
    if (confirm(`Вы уверены, что хотите удалить работу "${project.name}"?\nЭто действие нельзя отменить.`)) {
        const success = await window.projectManager.deleteProject(projectId, false);
        if (success) {
            renderSimpleProjectsList();
            showNotification(`🗑️ Работа "${project.name}" удалена`, 'info');
        }
    }
};

window.importSimpleProject = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.multiple = true;
    
    input.onchange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        try {
            const importedProjects = await window.projectManager.importProjects(files);
            if (importedProjects.length > 0) {
                renderSimpleProjectsList();
                showNotification(`✅ Импортировано ${importedProjects.length} работ`, 'success');
            }
        } catch (error) {
            alert('Ошибка импорта: ' + error.message);
        }
    };
    
    input.click();
};

window.exportAllSimpleProjects = async function() {
    if (window.projectManager.projects.length === 0) {
        alert('Нет работ для экспорта');
        return;
    }
    
    if (confirm(`Экспортировать все ${window.projectManager.projects.length} работ в один файл?`)) {
        try {
            const data = await ProjectStorage.exportAllProjects();
            showNotification(`✅ Экспортировано ${data.projects.length} работ`, 'success');
        } catch (error) {
            alert('Ошибка экспорта: ' + error.message);
        }
    }
};

window.toggleSimpleProjectsPanel = function() {
    const panel = document.getElementById('simpleProjectsPanel');
    const mainContainer = document.querySelector('.container');
    const toggleBtn = document.getElementById('togglePanelBtn');
    
    if (panel && mainContainer) {
        if (panel.style.transform === 'translateX(-280px)') {
            // Показываем
            panel.style.transform = 'translateX(0)';
            mainContainer.style.marginLeft = '280px';
            if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        } else {
            // Скрываем
            panel.style.transform = 'translateX(-280px)';
            mainContainer.style.marginLeft = '0';
            if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        }
    }
};

function renderFilteredProjects(filteredProjects) {
    const container = document.getElementById('simpleProjectsList');
    if (!container) return;
    
    if (filteredProjects.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #95a5a6; padding: 20px;">
                <div style="font-size: 36px; margin-bottom: 10px;">🔍</div>
                <p style="margin-bottom: 8px; color: #ecf0f1; font-weight: 600;">Проекты не найдены</p>
                <p style="font-size: 13px;">Попробуйте другой запрос</p>
                <button onclick="document.getElementById('simpleSearch').value=''; searchSimpleProjects('');" 
                        style="margin-top: 15px; padding: 8px 16px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-times"></i> Сбросить поиск
                </button>
            </div>
        `;
        return;
    }
    
    // Для простоты пока перерисовываем весь список
    renderSimpleProjectsList();
}

function showNotification(message, type = 'info') {
    // Используем существующую систему уведомлений или создаем простую
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        console.log(`${type}: ${message}`);
        // Простое уведомление
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }
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
    
    // Глобальные функции для быстрого доступа
    window.createNewProject = function() {
        window.createNewProjectSimple();
    };
    
    window.showProjectsManager = function() {
        window.showSimpleProjectsManager();
    };
    
    window.toggleProjectsSidebar = function() {
        window.toggleSimpleProjectsPanel();
    };
    
    console.log('✅ Integration complete');
}

// Запускаем инициализацию сразу
//setTimeout(initializeProjectSystem, 100);
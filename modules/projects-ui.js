// modules/projects-ui.js
class ProjectsUI {
    constructor(projectManager) {
        this.projectManager = projectManager;
        this.isSidebarVisible = true;
        this.currentView = 'list'; // list, grid, timeline
    }
    
    // ИНИЦИАЛИЗАЦИЯ
    
    init() {
        this.createSidebar();
        this.createProjectsManagerModal();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.renderProjectsList();
        
        console.log('✅ ProjectsUI initialized');
    }
    
    // СОЗДАНИЕ ИНТЕРФЕЙСА
    
    createSidebar() {
        // Проверяем, не создан ли уже сайдбар
        if (document.getElementById('projectsSidebar')) {
            return;
        }
        
        const sidebar = document.createElement('div');
        sidebar.id = 'projectsSidebar';
        sidebar.className = 'projects-sidebar';
        sidebar.innerHTML = `
            <div class="sidebar-header">
                <div class="header-content">
                    <h3>
                        <i class="fas fa-folder-open"></i>
                        <span>Мои работы</span>
                    </h3>
                    <button class="btn-icon sidebar-toggle" onclick="projectsUI.toggleSidebar()" 
                            title="Скрыть/показать панель">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                </div>
                
                <div class="sidebar-search">
                    <div class="search-input">
                        <i class="fas fa-search"></i>
                        <input type="text" id="projectSearchInput" 
                               placeholder="Поиск работы..." 
                               oninput="projectsUI.searchProjects(this.value)">
                    </div>
                    <button class="btn-icon search-clear" onclick="projectsUI.clearSearch()" 
                            title="Очистить поиск">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div class="sidebar-tabs">
                <button class="tab-btn active" onclick="projectsUI.switchView('list')" 
                        data-view="list">
                    <i class="fas fa-list"></i>
                </button>
                <button class="tab-btn" onclick="projectsUI.switchView('grid')" 
                        data-view="grid">
                    <i class="fas fa-th-large"></i>
                </button>
                <button class="tab-btn" onclick="projectsUI.switchView('timeline')" 
                        data-view="timeline">
                    <i class="fas fa-stream"></i>
                </button>
            </div>
            
            <div class="sidebar-content">
                <div class="projects-list" id="projectsListContainer">
                    <!-- Список проектов будет здесь -->
                </div>
                
                <div class="quick-stats" id="quickStats">
                    <!-- Быстрая статистика -->
                </div>
            </div>
            
            <div class="sidebar-footer">
                <div class="footer-actions">
                    <button class="btn btn-primary" onclick="projectsUI.createNewProject()">
                        <i class="fas fa-plus"></i>
                        <span>Новая работа</span>
                    </button>
                    <button class="btn-icon" onclick="projectsUI.showProjectsManager()" 
                            title="Управление работами">
                        <i class="fas fa-cog"></i>
                    </button>
                </div>
                
                <div class="footer-info">
                    <div class="current-project" id="currentProjectInfo">
                        <!-- Информация о текущем проекте -->
                    </div>
                </div>
            </div>
        `;
        
        // Вставляем сайдбар в начало body
        document.body.insertBefore(sidebar, document.body.firstChild);
        
        // Добавляем стили
        this.addSidebarStyles();
        
        // Обновляем основной контейнер
        const mainContainer = document.querySelector('.container');
        if (mainContainer) {
            mainContainer.style.marginLeft = '280px';
            mainContainer.style.transition = 'margin-left 0.3s ease';
        }
    }
    
    addSidebarStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* СТИЛИ САЙДБАРА */
            .projects-sidebar {
                position: fixed;
                left: 0;
                top: 0;
                bottom: 0;
                width: 280px;
                background: #2c3e50;
                color: white;
                z-index: 1000;
                box-shadow: 2px 0 10px rgba(0,0,0,0.1);
                transition: transform 0.3s ease;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
            }
            
            .projects-sidebar.collapsed {
                transform: translateX(-280px);
            }
            
            .sidebar-header {
                padding: 20px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                background: rgba(0,0,0,0.2);
            }
            
            .header-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            
            .header-content h3 {
                margin: 0;
                font-size: 18px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .sidebar-toggle {
                background: transparent;
                color: white;
                border: none;
                font-size: 16px;
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
                transition: background 0.3s;
            }
            
            .sidebar-toggle:hover {
                background: rgba(255,255,255,0.1);
            }
            
            .sidebar-search {
                display: flex;
                gap: 8px;
                align-items: center;
            }
            
            .search-input {
                flex: 1;
                position: relative;
            }
            
            .search-input i {
                position: absolute;
                left: 10px;
                top: 50%;
                transform: translateY(-50%);
                color: #95a5a6;
            }
            
            .search-input input {
                width: 100%;
                padding: 8px 8px 8px 35px;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 4px;
                color: white;
                font-size: 14px;
            }
            
            .search-input input::placeholder {
                color: #95a5a6;
            }
            
            .search-clear {
                background: transparent;
                color: #95a5a6;
                border: none;
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
                transition: all 0.3s;
            }
            
            .search-clear:hover {
                color: white;
                background: rgba(255,255,255,0.1);
            }
            
            .sidebar-tabs {
                display: flex;
                padding: 10px 20px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                background: rgba(0,0,0,0.1);
            }
            
            .sidebar-tabs .tab-btn {
                flex: 1;
                background: transparent;
                border: none;
                color: #95a5a6;
                padding: 8px;
                cursor: pointer;
                border-radius: 4px;
                transition: all 0.3s;
                font-size: 16px;
            }
            
            .sidebar-tabs .tab-btn:hover {
                color: white;
                background: rgba(255,255,255,0.1);
            }
            
            .sidebar-tabs .tab-btn.active {
                color: #3498db;
                background: rgba(52, 152, 219, 0.1);
            }
            
            .sidebar-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .projects-list {
                margin-bottom: 20px;
            }
            
            .project-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 15px;
                margin-bottom: 8px;
                background: rgba(255,255,255,0.05);
                border: 1px solid transparent;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
                user-select: none;
            }
            
            .project-item:hover {
                background: rgba(255,255,255,0.1);
                border-color: rgba(255,255,255,0.2);
                transform: translateX(5px);
            }
            
            .project-item.active {
                background: #3498db;
                border-color: #2980b9;
                box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
            }
            
            .project-icon {
                font-size: 20px;
                min-width: 30px;
                text-align: center;
            }
            
            .project-info {
                flex: 1;
                overflow: hidden;
            }
            
            .project-name {
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 3px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .project-meta {
                font-size: 12px;
                opacity: 0.8;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .project-subject {
                font-size: 11px;
                opacity: 0.7;
            }
            
            .project-status {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: bold;
                margin-left: auto;
            }
            
            .status-draft {
                background: #f39c12;
                color: white;
            }
            
            .status-active {
                background: #2ecc71;
                color: white;
            }
            
            .status-completed {
                background: #3498db;
                color: white;
            }
            
            .status-archived {
                background: #95a5a6;
                color: white;
            }
            
            .quick-stats {
                background: rgba(0,0,0,0.2);
                border-radius: 8px;
                padding: 15px;
                margin-top: 20px;
            }
            
            .quick-stats h4 {
                margin: 0 0 10px 0;
                font-size: 14px;
                opacity: 0.9;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
            
            .stat-item {
                text-align: center;
            }
            
            .stat-value {
                font-size: 18px;
                font-weight: bold;
                color: #3498db;
            }
            
            .stat-label {
                font-size: 11px;
                opacity: 0.7;
            }
            
            .sidebar-footer {
                border-top: 1px solid rgba(255,255,255,0.1);
                padding: 15px 20px;
                background: rgba(0,0,0,0.2);
            }
            
            .footer-actions {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .footer-actions .btn {
                flex: 1;
                padding: 10px;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            .current-project {
                font-size: 12px;
                opacity: 0.8;
                text-align: center;
            }
            
            .current-project strong {
                display: block;
                font-size: 13px;
                margin-bottom: 3px;
                opacity: 0.9;
            }
            
            /* АНИМАЦИИ */
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .project-item {
                animation: fadeIn 0.3s ease-out;
            }
            
            /* АДАПТИВНОСТЬ */
            @media (max-width: 1200px) {
                .projects-sidebar {
                    width: 250px;
                }
                
                .main-content {
                    margin-left: 250px !important;
                }
            }
            
            @media (max-width: 768px) {
                .projects-sidebar {
                    transform: translateX(-280px);
                }
                
                .projects-sidebar:not(.collapsed) {
                    transform: translateX(0);
                    width: 100%;
                    z-index: 10000;
                }
                
                .main-content {
                    margin-left: 0 !important;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    createProjectsManagerModal() {
        // Создаем модальное окно для управления проектами
        // Оно будет создаваться при открытии
    }
    
    // РЕНДЕРИНГ
    
    renderProjectsList() {
        const container = document.getElementById('projectsListContainer');
        if (!container) return;
        
        const projects = this.projectManager.filterProjects(this.projectManager.ui.filter);
        
        if (projects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 48px; margin-bottom: 15px;">📁</div>
                    <h4>Нет работ</h4>
                    <p>Создайте первую работу или импортируйте существующую</p>
                    <button class="btn btn-outline" onclick="projectsUI.createNewProject()" 
                            style="margin-top: 10px;">
                        Создать работу
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        projects.forEach(project => {
            const isActive = project.id === this.projectManager.currentProjectId;
            const lastModified = project.updatedAt ? 
                new Date(project.updatedAt).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit'
                }) : '';
            
            html += `
                <div class="project-item ${isActive ? 'active' : ''}" 
                     data-id="${project.id}"
                     onclick="projectsUI.openProject('${project.id}')"
                     oncontextmenu="projectsUI.showProjectContextMenu(event, '${project.id}')">
                    
                    <div class="project-icon" style="color: ${project.color}">
                        ${project.icon}
                    </div>
                    
                    <div class="project-info">
                        <div class="project-name" title="${project.name}">
                            ${project.name}
                        </div>
                        
                        <div class="project-meta">
                            <span class="project-subject">
                                ${project.subject || 'Без предмета'}
                            </span>
                            <span class="project-date">
                                ${lastModified}
                            </span>
                        </div>
                    </div>
                    
                    <span class="project-status status-${project.status}">
                        ${this.getStatusText(project.status)}
                    </span>
                </div>
            `;
        });
        
        container.innerHTML = html;
        this.updateQuickStats();
        this.updateCurrentProjectInfo();
    }
    
    updateQuickStats() {
        const container = document.getElementById('quickStats');
        if (!container) return;
        
        const projects = this.projectManager.projects;
        const stats = {
            total: projects.length,
            active: projects.filter(p => p.status === 'active').length,
            completed: projects.filter(p => p.status === 'completed').length,
            totalStudents: projects.reduce((sum, p) => sum + (p.stats?.totalStudents || 0), 0)
        };
        
        container.innerHTML = `
            <h4>📊 Быстрая статистика</h4>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${stats.total}</div>
                    <div class="stat-label">Всего работ</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.active}</div>
                    <div class="stat-label">Активных</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.completed}</div>
                    <div class="stat-label">Завершено</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.totalStudents}</div>
                    <div class="stat-label">Учеников</div>
                </div>
            </div>
        `;
    }
    
    updateCurrentProjectInfo() {
        const container = document.getElementById('currentProjectInfo');
        if (!container) return;
        
        const project = this.projectManager.getCurrentProject();
        
        if (!project) {
            container.innerHTML = `
                <div class="no-project">
                    <span>Работа не выбрана</span>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <strong title="${project.name}">${this.truncateText(project.name, 20)}</strong>
            <div>${project.subject || 'Без предмета'} • ${project.class || 'Без класса'}</div>
            <div style="font-size: 11px; opacity: 0.7; margin-top: 3px;">
                Изменено: ${project.lastModified || 'Сегодня'}
            </div>
        `;
    }
    
    // ОБРАБОТЧИКИ СОБЫТИЙ
    
    setupEventListeners() {
        // События перетаскивания для сайдбара
        this.setupDragAndDrop();
        
        // Ресайз окна
        window.addEventListener('resize', () => this.handleResize());
        
        // Клик вне контекстного меню
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                this.hideContextMenu();
            }
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+N - Новая работа
            if (e.ctrlKey && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                this.createNewProject();
            }
            
            // Ctrl+P - Менеджер проектов
            if (e.ctrlKey && e.key === 'P') {
                e.preventDefault();
                this.showProjectsManager();
            }
            
            // Ctrl+Tab - Переключение между проектами
            if (e.ctrlKey && e.key === 'Tab') {
                e.preventDefault();
                this.cycleProjects(e.shiftKey);
            }
            
            // Esc - Закрыть контекстное меню
            if (e.key === 'Escape') {
                this.hideContextMenu();
            }
        });
    }
    
    // МЕТОДЫ ДЛЯ ВЗАИМОДЕЙСТВИЯ
    
    toggleSidebar() {
        const sidebar = document.getElementById('projectsSidebar');
        const mainContent = document.querySelector('.container');
        
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
            this.isSidebarVisible = !sidebar.classList.contains('collapsed');
            
            // Обновляем иконку кнопки
            const toggleBtn = sidebar.querySelector('.sidebar-toggle i');
            if (toggleBtn) {
                toggleBtn.className = this.isSidebarVisible ? 
                    'fas fa-chevron-left' : 'fas fa-chevron-right';
            }
            
            // Обновляем отступ основного контента
            if (mainContent) {
                if (this.isSidebarVisible) {
                    mainContent.style.marginLeft = '280px';
                } else {
                    mainContent.style.marginLeft = '0';
                }
            }
        }
    }
    
    searchProjects(query) {
        this.projectManager.ui.filter.search = query;
        this.renderProjectsList();
        
        // Показываем/скрываем кнопку очистки
        const clearBtn = document.querySelector('.search-clear');
        if (clearBtn) {
            clearBtn.style.opacity = query ? '1' : '0';
            clearBtn.style.pointerEvents = query ? 'all' : 'none';
        }
    }
    
    clearSearch() {
        const searchInput = document.getElementById('projectSearchInput');
        if (searchInput) {
            searchInput.value = '';
            this.searchProjects('');
        }
    }
    
    switchView(view) {
        this.currentView = view;
        
        // Обновляем активные кнопки
        document.querySelectorAll('.sidebar-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Перерисовываем список
        this.renderProjectsList();
    }
    
    async openProject(projectId) {
        await this.projectManager.openProject(projectId);
        this.renderProjectsList();
    }
    
    async createNewProject() {
        // Показываем диалог создания
        const modalContent = `
            <div class="create-project-dialog">
                <div class="form-group">
                    <label for="projectName">Название работы *</label>
                    <input type="text" id="projectName" class="form-input" 
                           placeholder="Например: Контрольная по математике" 
                           value="Новая работа">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="projectSubject">Предмет</label>
                        <input type="text" id="projectSubject" class="form-input" 
                               placeholder="Математика">
                    </div>
                    
                    <div class="form-group">
                        <label for="projectClass">Класс</label>
                        <input type="text" id="projectClass" class="form-input" 
                               placeholder="5А">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="projectType">Тип работы</label>
                    <select id="projectType" class="form-select">
                        <option value="current">Текущая контрольная</option>
                        <option value="milestone">Рубежная</option>
                        <option value="final">Итоговая</option>
                        <option value="oge">ОГЭ</option>
                        <option value="ege">ЕГЭ</option>
                        <option value="vpr">ВПР</option>
                        <option value="func_literacy">Функциональная грамотность</option>
                        <option value="psychology">Психологическая диагностика</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="copyCurrent" checked>
                        Копировать настройки из текущей работы
                    </label>
                </div>
                
                <div class="modal-actions">
                    <button class="btn" onclick="closeModal()">Отмена</button>
                    <button class="btn btn-primary" onclick="projectsUI.createProjectFromForm()">
                        Создать
                    </button>
                </div>
            </div>
        `;
        
        showModal('Создать новую работу', modalContent);
    }
    
    async createProjectFromForm() {
        const name = document.getElementById('projectName')?.value;
        const subject = document.getElementById('projectSubject')?.value;
        const className = document.getElementById('projectClass')?.value;
        const type = document.getElementById('projectType')?.value;
        const copyCurrent = document.getElementById('copyCurrent')?.checked;
        
        if (!name) {
            this.showNotification('Введите название работы', 'error');
            return;
        }
        
        const project = this.projectManager.createNewProject({
            name,
            subject,
            class: className,
            type,
            copyFromCurrent: copyCurrent
        });
        
        closeModal();
        await this.projectManager.openProject(project.id);
        this.renderProjectsList();
    }
    
    showProjectsManager() {
        const projects = this.projectManager.projects;
        const subjects = [...new Set(projects.map(p => p.subject).filter(Boolean))];
        
        const modalContent = `
            <div class="projects-manager-modal">
                <div class="manager-header">
                    <div class="header-controls">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" id="managerSearch" 
                                   placeholder="Поиск по названию, предмету, теме..." 
                                   oninput="projectsUI.managerSearch(this.value)">
                        </div>
                        
                        <div class="filter-controls">
                            <select id="filterSubject" onchange="projectsUI.managerFilter()">
                                <option value="">Все предметы</option>
                                ${subjects.map(subject => `
                                    <option value="${subject}">${subject}</option>
                                `).join('')}
                            </select>
                            
                            <select id="filterStatus" onchange="projectsUI.managerFilter()">
                                <option value="">Все статусы</option>
                                <option value="draft">Черновик</option>
                                <option value="active">Активные</option>
                                <option value="completed">Завершенные</option>
                                <option value="archived">Архив</option>
                            </select>
                            
                            <select id="sortBy" onchange="projectsUI.managerFilter()">
                                <option value="updatedAt">По дате изменения</option>
                                <option value="name">По названию</option>
                                <option value="subject">По предмету</option>
                                <option value="stats.totalStudents">По количеству учеников</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="manager-content">
                    <div class="projects-grid" id="projectsManagerGrid">
                        <!-- Проекты будут здесь -->
                    </div>
                </div>
                
                <div class="manager-footer">
                    <div class="footer-stats" id="managerStats">
                        <!-- Статистика -->
                    </div>
                    
                    <div class="footer-actions">
                        <button class="btn btn-primary" onclick="projectsUI.createNewProject()">
                            <i class="fas fa-plus"></i> Новая работа
                        </button>
                        <button class="btn" onclick="projectsUI.exportAllProjects()">
                            <i class="fas fa-file-export"></i> Экспорт всех
                        </button>
                        <button class="btn" onclick="projectsUI.importProjects()">
                            <i class="fas fa-file-import"></i> Импорт
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        showModal('Управление работами', modalContent, 'xlarge');
        this.renderProjectsManagerGrid();
        this.updateManagerStats();
    }
    
    renderProjectsManagerGrid() {
        const container = document.getElementById('projectsManagerGrid');
        if (!container) return;
        
        const projects = this.projectManager.filterProjects(this.projectManager.ui.filter);
        
        if (projects.length === 0) {
            container.innerHTML = `
                <div class="empty-state-large">
                    <div style="font-size: 64px; margin-bottom: 20px;">📁</div>
                    <h3>Работы не найдены</h3>
                    <p>Попробуйте изменить параметры поиска или создайте новую работу</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = projects.map(project => {
            const stats = project.stats || {};
            const date = new Date(project.updatedAt);
            
            return `
                <div class="project-card" data-id="${project.id}">
                    <div class="card-header" style="background: ${project.color}">
                        <div class="card-icon">${project.icon}</div>
                        <div class="card-actions">
                            <button class="btn-icon" onclick="projectsUI.openProject('${project.id}')" 
                                    title="Открыть">
                                <i class="fas fa-folder-open"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="card-body">
                        <h4 class="card-title" title="${project.name}">
                            ${this.truncateText(project.name, 30)}
                        </h4>
                        
                        <div class="card-info">
                            <div class="info-item">
                                <i class="fas fa-book"></i>
                                <span>${project.subject || '—'}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-users"></i>
                                <span>${project.class || '—'}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-calendar-alt"></i>
                                <span>${date.toLocaleDateString('ru-RU')}</span>
                            </div>
                        </div>
                        
                        <div class="card-stats">
                            <div class="stat">
                                <div class="stat-value">${stats.totalStudents || 0}</div>
                                <div class="stat-label">учеников</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">${stats.avgGrade ? stats.avgGrade.toFixed(1) : '—'}</div>
                                <div class="stat-label">средний балл</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">${stats.completionPercent ? Math.round(stats.completionPercent) + '%' : '—'}</div>
                                <div class="stat-label">выполнено</div>
                            </div>
                        </div>
                        
                        <div class="card-tags">
                            ${project.tags?.map(tag => `
                                <span class="tag">${tag}</span>
                            `).join('') || ''}
                        </div>
                    </div>
                    
                    <div class="card-footer">
                        <span class="project-status status-${project.status}">
                            ${this.getStatusText(project.status)}
                        </span>
                        
                        <div class="card-actions">
                            <button class="btn-icon" onclick="projectsUI.duplicateProject('${project.id}')" 
                                    title="Дублировать">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button class="btn-icon" onclick="projectsUI.exportProject('${project.id}')" 
                                    title="Экспорт">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="btn-icon danger" 
                                    onclick="projectsUI.deleteProject('${project.id}')" 
                                    title="Удалить">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Добавляем стили для грида
        this.addGridStyles();
    }
    
    addGridStyles() {
        const styleId = 'projects-grid-styles';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .projects-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 20px;
                max-height: 60vh;
                overflow-y: auto;
                padding: 10px;
            }
            
            .project-card {
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                transition: all 0.3s;
                border: 2px solid transparent;
            }
            
            .project-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                border-color: #3498db;
            }
            
            .card-header {
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: white;
            }
            
            .card-icon {
                font-size: 24px;
            }
            
            .card-actions .btn-icon {
                background: rgba(255,255,255,0.2);
                color: white;
                border: none;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background 0.3s;
            }
            
            .card-actions .btn-icon:hover {
                background: rgba(255,255,255,0.3);
            }
            
            .card-body {
                padding: 15px;
            }
            
            .card-title {
                margin: 0 0 10px 0;
                font-size: 16px;
                color: #2c3e50;
            }
            
            .card-info {
                margin-bottom: 15px;
            }
            
            .info-item {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 5px;
                font-size: 13px;
                color: #7f8c8d;
            }
            
            .info-item i {
                width: 16px;
                text-align: center;
                color: #3498db;
            }
            
            .card-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                margin: 15px 0;
            }
            
            .card-stats .stat {
                text-align: center;
                padding: 8px;
                background: #f8f9fa;
                border-radius: 6px;
            }
            
            .stat-value {
                font-weight: bold;
                font-size: 14px;
                color: #2c3e50;
            }
            
            .stat-label {
                font-size: 11px;
                color: #7f8c8d;
            }
            
            .card-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                margin-top: 10px;
            }
            
            .tag {
                background: #e8f4fc;
                color: #3498db;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 11px;
            }
            
            .card-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                border-top: 1px solid #eee;
                background: #f8f9fa;
            }
            
            .empty-state-large {
                grid-column: 1 / -1;
                text-align: center;
                padding: 40px 20px;
                color: #7f8c8d;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // КОНТЕКСТНОЕ МЕНЮ
    
    showProjectContextMenu(event, projectId) {
        event.preventDefault();
        
        // Удаляем существующее меню
        this.hideContextMenu();
        
        const project = this.projectManager.getProject(projectId);
        if (!project) return;
        
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${event.clientX}px;
            top: ${event.clientY}px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 10000;
            min-width: 200px;
            overflow: hidden;
        `;
        
        menu.innerHTML = `
            <div class="context-menu-header" style="padding: 10px 15px; background: #3498db; color: white;">
                <strong>${this.truncateText(project.name, 25)}</strong>
            </div>
            
            <div class="context-menu-items">
                <button onclick="projectsUI.openProject('${projectId}'); projectsUI.hideContextMenu()">
                    <i class="fas fa-folder-open"></i> Открыть
                </button>
                
                <button onclick="projectsUI.renameProject('${projectId}'); projectsUI.hideContextMenu()">
                    <i class="fas fa-edit"></i> Переименовать
                </button>
                
                <button onclick="projectsUI.changeProjectColor('${projectId}'); projectsUI.hideContextMenu()">
                    <i class="fas fa-palette"></i> Изменить цвет
                </button>
                
                <hr style="margin: 5px 0; border: none; border-top: 1px solid #eee;">
                
                <button onclick="projectsUI.exportProject('${projectId}'); projectsUI.hideContextMenu()">
                    <i class="fas fa-download"></i> Экспорт
                </button>
                
                <button onclick="projectsUI.duplicateProject('${projectId}'); projectsUI.hideContextMenu()">
                    <i class="fas fa-copy"></i> Дублировать
                </button>
                
                <hr style="margin: 5px 0; border: none; border-top: 1px solid #eee;">
                
                <button onclick="projectsUI.archiveProject('${projectId}'); projectsUI.hideContextMenu()" 
                        style="color: #f39c12;">
                    <i class="fas fa-archive"></i> ${project.status === 'archived' ? 'Разархивировать' : 'Архивировать'}
                </button>
                
                <button onclick="projectsUI.deleteProject('${projectId}'); projectsUI.hideContextMenu()" 
                        style="color: #e74c3c;">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Добавляем стили для меню
        this.addContextMenuStyles();
        
        // Закрываем меню при клике вне его
        setTimeout(() => {
            document.addEventListener('click', () => this.hideContextMenu(), { once: true });
        }, 100);
    }
    
    addContextMenuStyles() {
        const styleId = 'context-menu-styles';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .context-menu-items button {
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
                padding: 10px 15px;
                background: none;
                border: none;
                text-align: left;
                cursor: pointer;
                font-size: 14px;
                color: #2c3e50;
                transition: background 0.2s;
            }
            
            .context-menu-items button:hover {
                background: #f8f9fa;
            }
            
            .context-menu-items button i {
                width: 16px;
                text-align: center;
            }
            
            .context-menu-items hr {
                margin: 5px 0;
                border: none;
                border-top: 1px solid #eee;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    hideContextMenu() {
        const menu = document.querySelector('.context-menu');
        if (menu) {
            menu.remove();
        }
    }
    
    // УПРАВЛЕНИЕ ПРОЕКТАМИ
    
    async renameProject(projectId) {
        const project = this.projectManager.getProject(projectId);
        if (!project) return;
        
        const newName = prompt('Введите новое название:', project.name);
        if (newName && newName.trim() && newName !== project.name) {
            project.name = newName.trim();
            project.updatedAt = new Date().toISOString();
            
            await this.projectManager.saveProjects();
            this.renderProjectsList();
            
            this.showNotification('✅ Название изменено', 'success');
        }
    }
    
    async changeProjectColor(projectId) {
        const project = this.projectManager.getProject(projectId);
        if (!project) return;
        
        const colors = [
            '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
            '#1abc9c', '#34495e', '#e67e22', '#27ae60', '#2980b9'
        ];
        
        const modalContent = `
            <div class="color-picker-modal">
                <h4>Выберите цвет для "${project.name}"</h4>
                <div class="color-grid">
                    ${colors.map(color => `
                        <div class="color-option ${color === project.color ? 'selected' : ''}" 
                             style="background: ${color}"
                             onclick="projectsUI.setProjectColor('${projectId}', '${color}')">
                            ${color === project.color ? '✓' : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="modal-actions">
                    <button class="btn" onclick="closeModal()">Отмена</button>
                </div>
            </div>
        `;
        
        showModal('Выбор цвета', modalContent);
    }
    
    async setProjectColor(projectId, color) {
        const project = this.projectManager.getProject(projectId);
        if (project) {
            project.color = color;
            project.updatedAt = new Date().toISOString();
            
            await this.projectManager.saveProjects();
            this.renderProjectsList();
            
            closeModal();
            this.showNotification('✅ Цвет изменен', 'success');
        }
    }
    
    async archiveProject(projectId) {
        const project = this.projectManager.getProject(projectId);
        if (!project) return;
        
        const newStatus = project.status === 'archived' ? 'active' : 'archived';
        
        project.status = newStatus;
        project.updatedAt = new Date().toISOString();
        
        await this.projectManager.saveProjects();
        this.renderProjectsList();
        
        const action = newStatus === 'archived' ? 'архивирована' : 'разархивирована';
        this.showNotification(`✅ Работа ${action}`, 'success');
    }
    
    async duplicateProject(projectId) {
        await this.projectManager.duplicateProject(projectId);
        this.renderProjectsList();
    }
    
    async exportProject(projectId) {
        await this.projectManager.exportProject(projectId);
    }
    
    async exportAllProjects() {
        if (confirm('Экспортировать все работы в один файл?')) {
            const data = await ProjectStorage.exportAllProjects();
            this.showNotification(`✅ Экспортировано ${data.projects.length} работ`, 'success');
        }
    }
    
    async importProjects() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.multiple = true;
        
        input.onchange = async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;
            
            const result = await this.projectManager.importProjects(files);
            if (result.length > 0) {
                this.renderProjectsList();
                this.showNotification(`✅ Импортировано ${result.length} работ`, 'success');
            }
        };
        
        input.click();
    }
    
    async deleteProject(projectId) {
        const confirmed = await this.projectManager.showConfirmDialog(
            'Удалить работу?',
            'Вы уверены, что хотите удалить эту работу? Это действие нельзя отменить.',
            'Удалить',
            'Отмена'
        );
        
        if (confirmed) {
            await this.projectManager.deleteProject(projectId, false);
            this.renderProjectsList();
        }
    }
    
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    
    getStatusText(status) {
        const texts = {
            draft: 'Черновик',
            active: 'Активна',
            completed: 'Завершена',
            archived: 'Архив'
        };
        return texts[status] || status;
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }
    
    showNotification(message, type = 'info') {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
    
    handleResize() {
        // Адаптивное поведение на мобильных
        if (window.innerWidth < 768 && this.isSidebarVisible) {
            this.toggleSidebar();
        }
    }
    
    setupDragAndDrop() {
        // TODO: Реализовать drag & drop для перестановки проектов
    }
    
    cycleProjects(reverse = false) {
        const projects = this.projectManager.projects;
        if (projects.length < 2) return;
        
        const currentIndex = projects.findIndex(p => p.id === this.projectManager.currentProjectId);
        let nextIndex;
        
        if (reverse) {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : projects.length - 1;
        } else {
            nextIndex = currentIndex < projects.length - 1 ? currentIndex + 1 : 0;
        }
        
        this.openProject(projects[nextIndex].id);
    }
    
    managerSearch(query) {
        this.projectManager.ui.filter.search = query;
        this.renderProjectsManagerGrid();
        this.updateManagerStats();
    }
    
    managerFilter() {
        const subject = document.getElementById('filterSubject')?.value || '';
        const status = document.getElementById('filterStatus')?.value || '';
        const sortBy = document.getElementById('sortBy')?.value || 'updatedAt';
        
        this.projectManager.ui.filter.subject = subject;
        this.projectManager.ui.filter.status = status;
        this.projectManager.ui.sortBy = sortBy;
        
        this.renderProjectsManagerGrid();
        this.updateManagerStats();
    }
    
    updateManagerStats() {
        const container = document.getElementById('managerStats');
        if (!container) return;
        
        const projects = this.projectManager.filterProjects(this.projectManager.ui.filter);
        const totalStudents = projects.reduce((sum, p) => sum + (p.stats?.totalStudents || 0), 0);
        const totalTasks = projects.reduce((sum, p) => sum + (p.tasks?.length || 0), 0);
        
        container.innerHTML = `
            <div style="font-size: 14px; color: #7f8c8d;">
                Найдено: <strong>${projects.length}</strong> работ • 
                Учеников: <strong>${totalStudents}</strong> • 
                Заданий: <strong>${totalTasks}</strong>
            </div>
        `;
    }
}

// Создаем глобальный экземпляр
window.projectsUI = new ProjectsUI(window.projectManager);

// Проверяем, не объявлен ли класс уже
if (typeof ProjectsUI === 'undefined') {
    // Создаем глобальный экземпляр
    window.projectsUI = new ProjectsUI(window.projectManager);
}

// Экспортируем только если не в браузере
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProjectsUI };
}
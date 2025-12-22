// ui/ProjectsSidebar.js
import { ProjectManager } from '../core/ProjectManager.js';

export class ProjectsSidebar {
    constructor(projectManager) {
        this.projectManager = projectManager;
        this.isVisible = true;
        this.currentView = 'list'; // list, grid
        
        this.projectManager.on('projectSwitched', () => this.render());
        this.projectManager.on('projectsSaved', () => this.render());
    }
    
    init() {
        this.createSidebar();
        this.setupEventListeners();
        this.render();
        
        console.log('✅ ProjectsSidebar инициализирован');
    }
    
    createSidebar() {
        if (document.getElementById('projectsSidebar')) return;
        
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
                    <button class="btn-icon sidebar-toggle" title="Скрыть/показать панель">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                </div>
                
                <div class="sidebar-search">
                    <div class="search-input">
                        <i class="fas fa-search"></i>
                        <input type="text" placeholder="Поиск работы..." />
                    </div>
                    <button class="btn-icon search-clear" title="Очистить поиск">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div class="sidebar-tabs">
                <button class="tab-btn active" data-view="list">
                    <i class="fas fa-list"></i>
                </button>
                <button class="tab-btn" data-view="grid">
                    <i class="fas fa-th-large"></i>
                </button>
            </div>
            
            <div class="sidebar-content">
                <div class="projects-list" id="projectsListContainer">
                    <!-- Список проектов -->
                </div>
                
                <div class="quick-stats" id="quickStats">
                    <!-- Быстрая статистика -->
                </div>
            </div>
            
            <div class="sidebar-footer">
                <div class="footer-actions">
                    <button class="btn btn-primary btn-new-project">
                        <i class="fas fa-plus"></i>
                        <span>Новая работа</span>
                    </button>
                    <button class="btn-icon btn-manage" title="Управление работами">
                        <i class="fas fa-cog"></i>
                    </button>
                </div>
                
                <div class="footer-info" id="currentProjectInfo">
                    <!-- Информация о текущем проекте -->
                </div>
            </div>
        `;
        
        document.body.insertBefore(sidebar, document.body.firstChild);
        this.addStyles();
        this.adjustMainContent();
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .projects-sidebar {
                position: fixed;
                left: 0;
                top: 0;
                bottom: 0;
                width: 280px;
                background: linear-gradient(180deg, #2c3e50 0%, #1a252f 100%);
                color: white;
                z-index: 1000;
                box-shadow: 2px 0 10px rgba(0,0,0,0.2);
                transition: transform 0.3s ease;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .projects-sidebar.collapsed {
                transform: translateX(-280px);
            }
            
            .sidebar-header {
                padding: 20px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                background: rgba(0,0,0,0.2);
                flex-shrink: 0;
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
                color: #ecf0f1;
            }
            
            .sidebar-toggle {
                background: transparent;
                color: white;
                border: none;
                font-size: 16px;
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
                transition: all 0.2s;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .sidebar-toggle:hover {
                background: rgba(255,255,255,0.1);
                transform: scale(1.1);
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
                font-size: 14px;
            }
            
            .search-input input {
                width: 100%;
                padding: 8px 8px 8px 35px;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 6px;
                color: white;
                font-size: 14px;
                transition: all 0.2s;
            }
            
            .search-input input:focus {
                outline: none;
                border-color: #3498db;
                box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
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
                transition: all 0.2s;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.5;
                pointer-events: none;
            }
            
            .search-clear:hover {
                color: white;
                background: rgba(255,255,255,0.1);
            }
            
            .search-clear.visible {
                opacity: 1;
                pointer-events: all;
            }
            
            .sidebar-tabs {
                display: flex;
                padding: 10px 20px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                background: rgba(0,0,0,0.1);
                flex-shrink: 0;
            }
            
            .sidebar-tabs .tab-btn {
                flex: 1;
                background: transparent;
                border: none;
                color: #95a5a6;
                padding: 8px;
                cursor: pointer;
                border-radius: 6px;
                transition: all 0.2s;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .sidebar-tabs .tab-btn:hover {
                color: white;
                background: rgba(255,255,255,0.1);
            }
            
            .sidebar-tabs .tab-btn.active {
                color: #3498db;
                background: rgba(52, 152, 219, 0.1);
                box-shadow: inset 0 0 0 1px rgba(52, 152, 219, 0.3);
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
                margin-bottom: 10px;
                background: rgba(255,255,255,0.05);
                border: 1px solid transparent;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                user-select: none;
                position: relative;
            }
            
            .project-item:hover {
                background: rgba(255,255,255,0.1);
                border-color: rgba(255,255,255,0.2);
                transform: translateX(5px);
            }
            
            .project-item.active {
                background: linear-gradient(135deg, #3498db, #2980b9);
                border-color: #2980b9;
                box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
            }
            
            .project-item.active:hover {
                background: linear-gradient(135deg, #2980b9, #2573a7);
            }
            
            .project-icon {
                font-size: 20px;
                min-width: 30px;
                text-align: center;
                transition: transform 0.2s;
            }
            
            .project-item:hover .project-icon {
                transform: scale(1.1);
            }
            
            .project-info {
                flex: 1;
                overflow: hidden;
                min-width: 0;
            }
            
            .project-name {
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 4px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                color: #ecf0f1;
            }
            
            .project-item.active .project-name {
                color: white;
                font-weight: 700;
            }
            
            .project-meta {
                font-size: 12px;
                opacity: 0.8;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .project-subject, .project-date {
                color: #bdc3c7;
            }
            
            .project-item.active .project-subject,
            .project-item.active .project-date {
                color: rgba(255,255,255,0.9);
            }
            
            .project-status {
                display: inline-block;
                padding: 3px 10px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-left: auto;
                flex-shrink: 0;
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
                border-radius: 10px;
                padding: 15px;
                margin-top: 20px;
                border: 1px solid rgba(255,255,255,0.1);
            }
            
            .quick-stats h4 {
                margin: 0 0 10px 0;
                font-size: 14px;
                opacity: 0.9;
                color: #ecf0f1;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
            
            .stat-item {
                text-align: center;
                padding: 8px;
                background: rgba(255,255,255,0.05);
                border-radius: 6px;
                transition: background 0.2s;
            }
            
            .stat-item:hover {
                background: rgba(255,255,255,0.1);
            }
            
            .stat-value {
                font-size: 18px;
                font-weight: bold;
                color: #3498db;
                margin-bottom: 2px;
            }
            
            .stat-label {
                font-size: 11px;
                opacity: 0.7;
                color: #bdc3c7;
            }
            
            .sidebar-footer {
                border-top: 1px solid rgba(255,255,255,0.1);
                padding: 15px 20px;
                background: rgba(0,0,0,0.2);
                flex-shrink: 0;
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
                border: none;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
                font-weight: 600;
            }
            
            .btn-primary {
                background: linear-gradient(135deg, #3498db, #2980b9);
                color: white;
            }
            
            .btn-primary:hover {
                background: linear-gradient(135deg, #2980b9, #2573a7);
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
            }
            
            .btn-icon {
                background: rgba(255,255,255,0.1);
                color: white;
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            .btn-icon:hover {
                background: rgba(255,255,255,0.2);
                transform: translateY(-1px);
            }
            
            .current-project {
                text-align: center;
                font-size: 12px;
                color: #bdc3c7;
            }
            
            .current-project strong {
                display: block;
                font-size: 13px;
                margin-bottom: 4px;
                color: #ecf0f1;
                font-weight: 600;
            }
            
            /* Анимации */
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .project-item {
                animation: fadeIn 0.3s ease-out;
            }
            
            /* Адаптивность */
            @media (max-width: 1200px) {
                .projects-sidebar {
                    width: 250px;
                }
            }
            
            @media (max-width: 768px) {
                .projects-sidebar {
                    transform: translateX(-280px);
                    width: 280px;
                    z-index: 10000;
                }
                
                .projects-sidebar:not(.collapsed) {
                    transform: translateX(0);
                    box-shadow: 0 0 0 100vmax rgba(0,0,0,0.5);
                }
                
                .sidebar-toggle {
                    position: absolute;
                    right: 15px;
                    top: 15px;
                    background: rgba(0,0,0,0.5);
                }
            }
            
            /* Скроллбар */
            .projects-sidebar::-webkit-scrollbar {
                width: 6px;
            }
            
            .projects-sidebar::-webkit-scrollbar-track {
                background: rgba(255,255,255,0.05);
            }
            
            .projects-sidebar::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.2);
                border-radius: 3px;
            }
            
            .projects-sidebar::-webkit-scrollbar-thumb:hover {
                background: rgba(255,255,255,0.3);
            }
            
            /* Состояние пустого списка */
            .empty-state {
                text-align: center;
                padding: 40px 20px;
                color: #95a5a6;
            }
            
            .empty-state i {
                font-size: 48px;
                margin-bottom: 15px;
                opacity: 0.5;
            }
            
            .empty-state h4 {
                margin: 0 0 8px 0;
                color: #ecf0f1;
                font-size: 16px;
            }
            
            .empty-state p {
                margin: 0 0 15px 0;
                font-size: 13px;
            }
            
            .btn-outline {
                background: transparent;
                border: 1px solid #3498db;
                color: #3498db;
            }
            
            .btn-outline:hover {
                background: rgba(52, 152, 219, 0.1);
            }
        `;
        
        document.head.appendChild(style);
    }
    
    setupEventListeners() {
        const sidebar = document.getElementById('projectsSidebar');
        
        // Переключение сайдбара
        sidebar.querySelector('.sidebar-toggle').addEventListener('click', () => this.toggle());
        
        // Поиск
        const searchInput = sidebar.querySelector('.search-input input');
        const searchClear = sidebar.querySelector('.search-clear');
        
        searchInput.addEventListener('input', (e) => {
            this.searchProjects(e.target.value);
            searchClear.classList.toggle('visible', e.target.value.length > 0);
        });
        
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            this.searchProjects('');
            searchClear.classList.remove('visible');
        });
        
        // Переключение вида
        sidebar.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });
        
        // Кнопки действий
        sidebar.querySelector('.btn-new-project').addEventListener('click', () => this.createNewProject());
        sidebar.querySelector('.btn-manage').addEventListener('click', () => this.showProjectsManager());
        
        // Ресайз окна
        window.addEventListener('resize', () => this.handleResize());
    }
    
    render() {
        this.renderProjectsList();
        this.renderQuickStats();
        this.renderCurrentProjectInfo();
    }
    
    renderProjectsList() {
        const container = document.getElementById('projectsListContainer');
        if (!container) return;
        
        const projects = this.projectManager.projects;
        
        if (projects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 48px; margin-bottom: 15px;">📁</div>
                    <h4>Нет работ</h4>
                    <p>Создайте первую работу или импортируйте существующую</p>
                    <button class="btn btn-outline" style="margin-top: 10px;">
                        Создать работу
                    </button>
                </div>
            `;
            
            // Добавляем обработчик на кнопку
            const btn = container.querySelector('.btn-outline');
            if (btn) {
                btn.addEventListener('click', () => this.createNewProject());
            }
            
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
                     data-id="${project.id}">
                    
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
        
        // Добавляем обработчики кликов
        container.querySelectorAll('.project-item').forEach(item => {
            const projectId = item.dataset.id;
            
            item.addEventListener('click', () => this.openProject(projectId));
            
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e, projectId);
            });
        });
    }
    
    renderQuickStats() {
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
            <h4><i class="fas fa-chart-bar"></i> Быстрая статистика</h4>
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
    
    renderCurrentProjectInfo() {
        const container = document.getElementById('currentProjectInfo');
        if (!container) return;
        
        const project = this.projectManager.getCurrentProject();
        
        if (!project) {
            container.innerHTML = `
                <div class="current-project">
                    <div style="color: #95a5a6; font-size: 13px;">
                        <i class="fas fa-info-circle"></i> Работа не выбрана
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="current-project">
                <strong title="${project.name}">${this.truncateText(project.name, 20)}</strong>
                <div>${project.subject || 'Без предмета'} • ${project.class || 'Без класса'}</div>
                <div style="font-size: 11px; opacity: 0.7; margin-top: 4px;">
                    <i class="far fa-clock"></i> Изменено: ${project.lastModified || 'Сегодня'}
                </div>
            </div>
        `;
    }
    
    async openProject(projectId) {
        try {
            await this.projectManager.openProject(projectId);
            this.showNotification('✅ Работа открыта');
        } catch (error) {
            console.error('Ошибка открытия проекта:', error);
            this.showNotification('❌ Ошибка открытия', 'error');
        }
    }
    
    async createNewProject() {
        const name = prompt('Введите название новой работы:', 'Новая работа');
        if (!name) return;
        
        try {
            const project = this.projectManager.createProject({ name });
            await this.projectManager.openProject(project.id);
            this.showNotification('✅ Новая работа создана');
        } catch (error) {
            console.error('Ошибка создания проекта:', error);
            this.showNotification('❌ Ошибка создания', 'error');
        }
    }
    
    async showProjectsManager() {
        // TODO: Реализовать менеджер проектов
        alert('Менеджер проектов будет реализован в отдельном модуле');
    }
    
    searchProjects(query) {
        // TODO: Реализовать фильтрацию в реальном времени
        console.log('Поиск:', query);
        this.render();
    }
    
    switchView(view) {
        this.currentView = view;
        
        const tabs = document.querySelectorAll('.sidebar-tabs .tab-btn');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === view);
        });
        
        // TODO: Реализовать переключение между list и grid видами
        this.render();
    }
    
    toggle() {
        const sidebar = document.getElementById('projectsSidebar');
        const mainContent = document.querySelector('.container');
        
        sidebar.classList.toggle('collapsed');
        this.isVisible = !sidebar.classList.contains('collapsed');
        
        // Обновляем иконку кнопки
        const toggleBtn = sidebar.querySelector('.sidebar-toggle i');
        if (toggleBtn) {
            toggleBtn.className = this.isVisible ? 
                'fas fa-chevron-left' : 'fas fa-chevron-right';
        }
        
        // Обновляем отступ основного контента
        if (mainContent) {
            mainContent.style.marginLeft = this.isVisible ? '280px' : '0';
        }
    }
    
    showContextMenu(event, projectId) {
        // TODO: Реализовать контекстное меню
        console.log('Контекстное меню для проекта:', projectId);
        
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
            <div style="padding: 10px 15px; background: #3498db; color: white; font-weight: 600;">
                Действия
            </div>
            <div style="padding: 5px 0;">
                <button style="width: 100%; padding: 10px 15px; border: none; background: none; text-align: left; cursor: pointer;">
                    <i class="fas fa-folder-open"></i> Открыть
                </button>
                <button style="width: 100%; padding: 10px 15px; border: none; background: none; text-align: left; cursor: pointer;">
                    <i class="fas fa-edit"></i> Переименовать
                </button>
                <button style="width: 100%; padding: 10px 15px; border: none; background: none; text-align: left; cursor: pointer; color: #e74c3c;">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Закрываем меню при клике вне его
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 100);
    }
    
    adjustMainContent() {
        const mainContainer = document.querySelector('.container');
        if (mainContainer) {
            mainContainer.style.marginLeft = '280px';
            mainContainer.style.transition = 'margin-left 0.3s ease';
        }
    }
    
    handleResize() {
        if (window.innerWidth < 768 && this.isVisible) {
            this.toggle();
        }
    }
    
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
            console.log(`${type}: ${message}`);
        }
    }
}
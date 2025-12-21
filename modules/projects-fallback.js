// modules/projects-fallback.js
console.log('🛠️ Loading projects fallback system...');

// Простой ProjectManager для быстрого старта
class SimpleProjectManager {
    constructor() {
        this.currentProjectId = null;
        this.projects = [];
        this.recentProjects = [];
    }
    
    async init() {
        console.log('🚀 SimpleProjectManager initializing...');
        
        // Загружаем из localStorage
        const saved = localStorage.getItem('education_analytics_projects');
        if (saved) {
            try {
                this.projects = JSON.parse(saved) || [];
                console.log(`📂 Loaded ${this.projects.length} projects`);
            } catch (e) {
                console.error('Failed to parse projects:', e);
                this.projects = [];
            }
        }
        
        // Если нет проектов, создаем пример
        if (this.projects.length === 0) {
            this.createExampleProject();
        }
        
        // Открываем первый проект
        if (this.projects.length > 0) {
            this.currentProjectId = this.projects[0].id;
            console.log('✅ SimpleProjectManager ready');
        }
        
        // Создаем простой сайдбар
        this.createSimpleSidebar();
        
        return this;
    }
    
    createExampleProject() {
        const project = {
            id: 'project_1',
            name: 'Пример работы по математике',
            subject: 'Математика',
            class: '5А',
            theme: 'Дроби',
            icon: '📊',
            color: '#3498db',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.projects.push(project);
        this.currentProjectId = project.id;
        this.saveToStorage();
        
        console.log('📝 Created example project');
    }
    
    saveToStorage() {
        localStorage.setItem('education_analytics_projects', JSON.stringify(this.projects));
    }
    
    createSimpleSidebar() {
        if (document.getElementById('simpleProjectsSidebar')) return;
        
        const sidebar = document.createElement('div');
        sidebar.id = 'simpleProjectsSidebar';
        sidebar.innerHTML = `
            <div style="padding: 20px; background: #2c3e50; color: white; height: 100vh;">
                <h3 style="margin-top: 0;">📁 Мои работы</h3>
                <div id="simpleProjectsList">
                    ${this.projects.map(p => `
                        <div style="padding: 10px; margin: 5px 0; background: ${p.color}; border-radius: 5px; cursor: pointer;">
                            ${p.icon} ${p.name}
                        </div>
                    `).join('')}
                </div>
                <button onclick="window.simpleProjectManager?.createNewProject()" 
                        style="width: 100%; padding: 10px; margin-top: 20px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Новая работа
                </button>
            </div>
        `;
        
        sidebar.style.cssText = `
            position: fixed;
            left: 0;
            top: 0;
            width: 250px;
            height: 100vh;
            z-index: 1000;
        `;
        
        document.body.appendChild(sidebar);
        
        // Обновляем основной контейнер
        const mainContainer = document.querySelector('.container');
        if (mainContainer) {
            mainContainer.style.marginLeft = '250px';
        }
    }
    
    createNewProject() {
        const name = prompt('Название новой работы:', 'Новая работа');
        if (name) {
            const project = {
                id: 'project_' + Date.now(),
                name: name,
                subject: '',
                class: '',
                theme: '',
                icon: '📝',
                color: this.getRandomColor(),
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            this.projects.push(project);
            this.saveToStorage();
            this.createSimpleSidebar();
            
            alert(`Создана новая работа: ${name}`);
        }
    }
    
    getRandomColor() {
        const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

// Инициализируем сразу
window.simpleProjectManager = new SimpleProjectManager();
window.simpleProjectManager.init();

console.log('✅ Simple projects system loaded');
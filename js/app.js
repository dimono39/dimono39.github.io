// ==================== ГЛАВНЫЙ МОДУЛЬ ПРИЛОЖЕНИЯ ====================

class EducationAnalyticsApp {
    constructor() {
        this.appContainer = null;
        this.isInitialized = false;
        console.log('📊 Инициализация EducationAnalyticsApp');
    }
    
    // Загрузка HTML-шаблонов
    async loadTemplates() {
        console.log('🔄 Загрузка HTML-шаблонов...');
        
        const templates = {
            'header': 'parts/header.html',
            'tabs': 'parts/tabs.html',
            'setup': 'parts/tab-setup.html',
            'tasks': 'parts/tab-tasks.html',
            'students': 'parts/tab-students.html',
            'results': 'parts/tab-results.html',
            'analytics': 'parts/tab-analytics.html',
            'visualization': 'parts/tab-viz.html',
            'recommendations': 'parts/tab-recommend.html',
            'export': 'parts/tab-export.html',
            'modals': 'parts/modals.html'
        };
        
        try {
            // Загружаем все шаблоны параллельно
            const promises = Object.entries(templates).map(async ([name, path]) => {
                try {
                    const response = await fetch(path);
                    if (!response.ok) throw new Error(`Не удалось загрузить ${path}`);
                    const html = await response.text();
                    return { name, html };
                } catch (error) {
                    console.warn(`⚠️ Не удалось загрузить ${path}:`, error);
                    return { name, html: this.getFallbackTemplate(name) };
                }
            });
            
            const loadedTemplates = await Promise.all(promises);
            
            // Сохраняем шаблоны
            this.templates = {};
            loadedTemplates.forEach(({ name, html }) => {
                this.templates[name] = html;
            });
            
            console.log('✅ Все шаблоны загружены');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка при загрузке шаблонов:', error);
            this.templates = this.getAllFallbackTemplates();
            return false;
        }
    }
    
    // Резервные шаблоны на случай ошибки загрузки
    getFallbackTemplate(name) {
        const fallbacks = {
            'header': `
                <div class="header">
                    <h1>📊 Система анализа образовательных результатов</h1>
                    <p>Профессиональный анализ результатов контрольных, ВПР, ОГЭ, ЕГЭ и функциональной грамотности</p>
                </div>
            `,
            'tabs': `
                <div class="tabs no-print">
                    <button class="tab-btn active" onclick="showTab('setup')">🎯 Настройки</button>
                    <button class="tab-btn" onclick="showTab('tasks')">📝 Задания</button>
                    <button class="tab-btn" onclick="showTab('students')">👥 Учащиеся</button>
                    <button class="tab-btn" onclick="showTab('results')">📊 Результаты</button>
                    <button class="tab-btn" onclick="showTab('analytics')">📈 Аналитика</button>
                    <button class="tab-btn" onclick="showTab('visualization')">📊 Визуализация</button>
                    <button class="tab-btn" onclick="showTab('recommendations')">💡 Рекомендации</button>
                    <button class="tab-btn" onclick="showTab('export')">💾 Экспорт</button>
                </div>
            `,
            'setup': `<div id="setup-content">Загрузка вкладки настроек...</div>`,
            'modals': `
                <div class="modal-overlay" id="modalOverlay">
                    <div class="modal-content" id="modalContent"></div>
                </div>
                <div class="notification" id="notification"></div>
            `
        };
        
        return fallbacks[name] || `<div>Шаблон "${name}" не загружен</div>`;
    }
    
    getAllFallbackTemplates() {
        return {
            header: this.getFallbackTemplate('header'),
            tabs: this.getFallbackTemplate('tabs'),
            setup: this.getFallbackTemplate('setup'),
            tasks: this.getFallbackTemplate('tasks'),
            students: this.getFallbackTemplate('students'),
            results: this.getFallbackTemplate('results'),
            analytics: this.getFallbackTemplate('analytics'),
            visualization: this.getFallbackTemplate('visualization'),
            recommendations: this.getFallbackTemplate('recommendations'),
            export: this.getFallbackTemplate('export'),
            modals: this.getFallbackTemplate('modals')
        };
    }
    
    // Сборка HTML-структуры
    buildAppStructure() {
        console.log('🏗️ Сборка HTML-структуры...');
        
        const container = document.getElementById('app-container');
        if (!container) {
            console.error('❌ Контейнер приложения не найден');
            return false;
        }
        
        this.appContainer = container;
        
        // Создаем основную структуру
        container.innerHTML = `
            ${this.templates.modals || ''}
            
            <div class="container">
                ${this.templates.header || ''}
                ${this.templates.tabs || ''}
                
                <div id="setup" class="tab-content active">
                    ${this.templates.setup || ''}
                </div>
                
                <div id="tasks" class="tab-content">
                    ${this.templates.tasks || ''}
                </div>
                
                <div id="students" class="tab-content">
                    ${this.templates.students || ''}
                </div>
                
                <div id="results" class="tab-content">
                    ${this.templates.results || ''}
                </div>
                
                <div id="analytics" class="tab-content">
                    ${this.templates.analytics || ''}
                </div>
                
                <div id="visualization" class="tab-content">
                    ${this.templates.visualization || ''}
                </div>
                
                <div id="recommendations" class="tab-content">
                    ${this.templates.recommendations || ''}
                </div>
                
                <div id="export" class="tab-content">
                    ${this.templates.export || ''}
                </div>
            </div>
        `;
        
        console.log('✅ HTML-структура собрана');
        return true;
    }
    
    // Инициализация приложения
    async initialize() {
        console.log('🚀 Запуск инициализации приложения...');
        
        try {
            // 1. Загружаем шаблоны
            await this.loadTemplates();
            
            // 2. Собираем HTML-структуру
            if (!this.buildAppStructure()) {
                throw new Error('Не удалось собрать HTML-структуру');
            }
            
            // 3. Инициализируем базовые функции
            if (typeof window.initializeApp === 'function') {
                window.initializeApp();
            } else {
                console.warn('⚠️ Функция initializeApp не найдена, используем альтернативную инициализацию');
                this.alternativeInitialize();
            }
            
            // 4. Показываем приложение
            this.showApp();
            
            this.isInitialized = true;
            console.log('🎉 Приложение успешно инициализировано!');
            
        } catch (error) {
            console.error('❌ Критическая ошибка при инициализации:', error);
            this.showError(error);
        }
    }
    
    // Альтернативная инициализация (если core.js не загрузился)
    alternativeInitialize() {
        console.log('🔄 Альтернативная инициализация...');
        
        // Инициализируем базовые данные
        if (!window.appData) {
            window.appData = {
                test: { 
                    subject: "Математика", 
                    class: "5А",
                    criteria: {
                        5: { min: 18, max: 20 },
                        4: { min: 15, max: 17 },
                        3: { min: 10, max: 14 },
                        2: { min: 0, max: 9 }
                    }
                },
                tasks: [],
                students: [],
                results: [],
                errors: []
            };
        }
        
        // Загружаем данные
        if (typeof window.loadData === 'function') {
            window.loadData();
        }
        
        // Рендерим интерфейс
        if (typeof window.renderAll === 'function') {
            setTimeout(() => {
                window.renderAll();
                window.showTab('setup');
            }, 100);
        }
    }
    
    // Показываем приложение (скрываем загрузку)
    showApp() {
        const loading = document.getElementById('loading');
        const appContainer = document.getElementById('app-container');
        
        if (loading) loading.style.display = 'none';
        if (appContainer) appContainer.style.display = 'block';
        
        console.log('👁️ Приложение отображено');
    }
    
    // Показываем ошибку
    showError(error) {
        const loading = document.getElementById('loading');
        
        if (loading) {
            loading.innerHTML = `
                <div style="color: #e74c3c; margin-bottom: 20px;">
                    <h3>❌ Ошибка загрузки приложения</h3>
                    <p>${error.message || 'Неизвестная ошибка'}</p>
                </div>
                <button onclick="location.reload()" style="
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                ">
                    🔄 Перезагрузить страницу
                </button>
            `;
        }
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ====================

// Глобальный экземпляр приложения
window.EducationAnalytics = new EducationAnalyticsApp();

// Запускаем при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM загружен, запускаем приложение...');
    window.EducationAnalytics.initialize();
});

// Запускаем при полной загрузке страницы
window.addEventListener('load', () => {
    console.log('🔄 Страница полностью загружена');
});

// Экспортируем для глобального использования
window.app = window.EducationAnalytics;
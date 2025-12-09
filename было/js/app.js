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
		const templates = {
			'header.html': `
<header class="app-header">
    <div class="container">
        <div class="row align-items-center">
            <div class="col-md-4">
                <h1 class="app-title">📊 Education Analytics</h1>
            </div>
            <div class="col-md-8 text-md-end">
                <nav class="main-nav">
                    <a href="#" class="btn-nav" data-tab="setup">⚙️ Настройка</a>
                    <a href="#" class="btn-nav" data-tab="tasks">📝 Задания</a>
                    <a href="#" class="btn-nav" data-tab="students">👥 Учащиеся</a>
                    <a href="#" class="btn-nav" data-tab="results">📊 Результаты</a>
                    <a href="#" class="btn-nav" data-tab="analytics">📈 Аналитика</a>
                    <a href="#" class="btn-nav" data-tab="viz">🎨 Визуализация</a>
                    <a href="#" class="btn-nav" data-tab="recommend">💡 Рекомендации</a>
                    <a href="#" class="btn-nav" data-tab="export">📤 Экспорт</a>
                </nav>
            </div>
        </div>
    </div>
</header>`,

			'tabs.html': `
<div class="tabs-container">
    <div class="tabs-header">
        <div class="container">
            <ul class="nav nav-tabs" id="mainTabs">
                <li class="nav-item"><a class="nav-link active" data-tab="setup" href="#">⚙️ Настройка</a></li>
                <li class="nav-item"><a class="nav-link" data-tab="tasks" href="#">📝 Задания</a></li>
                <li class="nav-item"><a class="nav-link" data-tab="students" href="#">👥 Учащиеся</a></li>
                <li class="nav-item"><a class="nav-link" data-tab="results" href="#">📊 Результаты</a></li>
                <li class="nav-item"><a class="nav-link" data-tab="analytics" href="#">📈 Аналитика</a></li>
                <li class="nav-item"><a class="nav-link" data-tab="viz" href="#">🎨 Визуализация</a></li>
                <li class="nav-item"><a class="nav-link" data-tab="recommend" href="#">💡 Рекомендации</a></li>
                <li class="nav-item"><a class="nav-link" data-tab="export" href="#">📤 Экспорт</a></li>
            </ul>
        </div>
    </div>
    <div class="tab-content container mt-4" id="tabContent"></div>
</div>`,

			'tab-setup.html': `
<div class="tab-pane fade show active" id="tab-setup" role="tabpanel">
    <h2>⚙️ Настройка анализа</h2>
    <div class="card">
        <div class="card-body">
            <form id="setupForm">
                <div class="mb-3">
                    <label class="form-label">Название курса</label>
                    <input type="text" class="form-control" placeholder="Введите название курса">
                </div>
                <div class="mb-3">
                    <label class="form-label">Количество учащихся</label>
                    <input type="number" class="form-control" value="25" min="1" max="100">
                </div>
                <button type="submit" class="btn btn-primary">Сохранить настройки</button>
            </form>
        </div>
    </div>
</div>`,

			'tab-tasks.html': `
<div class="tab-pane fade" id="tab-tasks" role="tabpanel">
    <h2>📝 Управление заданиями</h2>
    <div class="card">
        <div class="card-body">
            <button class="btn btn-success mb-3">+ Добавить задание</button>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Название</th>
                            <th>Тип</th>
                            <th>Макс. балл</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody id="tasksList">
                        <tr><td colspan="5" class="text-center">Задания не добавлены</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>`,

			'tab-students.html': `
<div class="tab-pane fade" id="tab-students" role="tabpanel">
    <h2>👥 Список учащихся</h2>
    <div class="card">
        <div class="card-body">
            <div class="mb-3">
                <input type="text" class="form-control" placeholder="Поиск по имени или email...">
            </div>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Имя</th>
                            <th>Email</th>
                            <th>Группа</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody id="studentsList">
                        <tr><td colspan="5" class="text-center">Учащиеся не загружены</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>`,

			'tab-results.html': `
<div class="tab-pane fade" id="tab-results" role="tabpanel">
    <h2>📊 Результаты выполнения</h2>
    <div class="card">
        <div class="card-body">
            <div class="row mb-3">
                <div class="col-md-4">
                    <select class="form-select">
                        <option>Все задания</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <select class="form-select">
                        <option>Все учащиеся</option>
                    </select>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Учащийся</th>
                            <th>Задание</th>
                            <th>Баллы</th>
                            <th>Статус</th>
                        </tr>
                    </thead>
                    <tbody id="resultsTable">
                        <tr><td colspan="4" class="text-center">Нет данных для отображения</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>`,

			'tab-analytics.html': `
<div class="tab-pane fade" id="tab-analytics" role="tabpanel">
    <h2>📈 Аналитика успеваемости</h2>
    <div class="card">
        <div class="card-body">
            <div class="row">
                <div class="col-md-8">
                    <div class="chart-container">
                        <canvas id="performanceChart"></canvas>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body">
                            <h5>Статистика</h5>
                            <ul class="list-unstyled">
                                <li>Средний балл: <strong>--</strong></li>
                                <li>Медиана: <strong>--</strong></li>
                                <li>Завершено заданий: <strong>--</strong></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`,

			'tab-viz.html': `
<div class="tab-pane fade" id="tab-viz" role="tabpanel">
    <h2>🎨 Визуализация данных</h2>
    <div class="card">
        <div class="card-body">
            <div class="row">
                <div class="col-md-6">
                    <div class="chart-container">
                        <canvas id="distributionChart"></canvas>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="chart-container">
                        <canvas id="progressChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`,

			'tab-recommend.html': `
<div class="tab-pane fade" id="tab-recommend" role="tabpanel">
    <h2>💡 Персонализированные рекомендации</h2>
    <div class="card">
        <div class="card-body">
            <div class="alert alert-info">
                <strong>Система рекомендаций</strong> анализирует успеваемость и предлагает индивидуальные задания.
            </div>
            <div id="recommendationsList">
                <div class="card mb-2">
                    <div class="card-body">
                        <p class="mb-0">Загрузите данные учащихся и результаты для генерации рекомендаций.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`,

			'tab-export.html': `
<div class="tab-pane fade" id="tab-export" role="tabpanel">
    <h2>📤 Экспорт данных и отчетов</h2>
    <div class="card">
        <div class="card-body">
            <div class="row">
                <div class="col-md-4 mb-3">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <h5>📄 CSV</h5>
                            <p>Экспорт табличных данных</p>
                            <button class="btn btn-outline-primary">Экспорт CSV</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <h5>📊 Excel</h5>
                            <p>Полный отчет в Excel</p>
                            <button class="btn btn-outline-success">Экспорт Excel</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <h5>📈 Графики</h5>
                            <p>Изображения диаграмм</p>
                            <button class="btn btn-outline-info">Экспорт PNG</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`,

			'modals.html': `
<div class="modal fade" id="mainModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Модальное окно</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p>Содержимое модального окна</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                <button type="button" class="btn btn-primary">Сохранить</button>
            </div>
        </div>
    </div>
</div>`
		};
		
		return templates[name] || `<div class="alert alert-warning">Шаблон ${name} не найден</div>`;
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
        
        const container = document.querySelector('.container');
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
window.app = window.EducationAnalytics || {};
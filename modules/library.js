// ============================
// БИБЛИОТЕКА МАТЕРИАЛОВ
// ============================

let currentLibraryCategory = 'all';
let currentLibraryPage = 1;

function showLibrary() {
    loadLibraryContent();
    updateLibraryStats();
}

function loadLibraryContent() {
    // Здесь можно загружать данные из localStorage или API
    const libraryData = JSON.parse(localStorage.getItem('library_materials')) || [];
    
    if (libraryData.length === 0) {
        // Показать примерные данные
        document.getElementById('emptyLibrary').style.display = 'none';
        document.getElementById('materialsGrid').style.display = 'grid';
    }
    
    updateMaterialCounts();
}

function selectCategory(category) {
    currentLibraryCategory = category;
    
    // Обновить активный элемент в боковой панели
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    // Обновить хлебные крошки
    const categoryNames = {
        'all': 'Все материалы',
        'work_templates': 'Шаблоны работ',
        'criteria': 'Критерии оценивания',
        'tasks_bank': 'Банк заданий',
        'methodical': 'Методические материалы',
        'subject_resources': 'По предметам',
        'external_resources': 'Полезные ресурсы'
    };
    document.getElementById('currentCategory').textContent = categoryNames[category] || category;
    
    // Фильтровать материалы
    filterMaterialsByCategory(category);
}

function filterMaterialsByCategory(category) {
    const materials = document.querySelectorAll('.material-card');
    
    materials.forEach(material => {
        if (category === 'all' || material.dataset.category === category) {
            material.style.display = 'block';
        } else {
            material.style.display = 'none';
        }
    });
}

function searchLibrary() {
    const searchTerm = document.getElementById('librarySearch').value.toLowerCase();
    const materials = document.querySelectorAll('.material-card');
    
    materials.forEach(material => {
        const title = material.querySelector('h4').textContent.toLowerCase();
        const description = material.querySelector('p').textContent.toLowerCase();
        const tags = Array.from(material.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase());
        
        const matches = title.includes(searchTerm) || 
                       description.includes(searchTerm) || 
                       tags.some(tag => tag.includes(searchTerm));
        
        if (matches && (currentLibraryCategory === 'all' || material.dataset.category === currentLibraryCategory)) {
            material.style.display = 'block';
        } else {
            material.style.display = 'none';
        }
    });
}

function filterLibrary(type) {
    // Обновить активные фильтры
    document.querySelectorAll('.search-filters .btn').forEach(btn => {
        btn.classList.remove('active-filter');
    });
    event.target.classList.add('active-filter');
    
    // Здесь можно добавить дополнительную логику фильтрации
}

function useTemplate(button) {
    const card = button.closest('.material-card');
    const templateName = card.querySelector('h4').textContent;
    
    showNotification(`Шаблон "${templateName}" загружается...`, 'info');
    
    // Здесь можно добавить логику загрузки шаблона в текущую работу
    setTimeout(() => {
        showNotification(`Шаблон "${templateName}" успешно применен!`, 'success');
    }, 1000);
}

function useCriteria(button) {
    const card = button.closest('.material-card');
    const criteriaName = card.querySelector('h4').textContent;
    
    showNotification(`Критерии "${criteriaName}" применяются...`, 'info');
    
    // Здесь можно добавить логику применения критериев
    setTimeout(() => {
        showNotification(`Критерии "${criteriaName}" успешно применены!`, 'success');
    }, 1000);
}

function addToTest(button) {
    const card = button.closest('.material-card');
    const taskName = card.querySelector('h4').textContent;
    
    showNotification(`Задание "${taskName}" добавляется в работу...`, 'info');
    
    // Здесь можно добавить логику добавления задания в текущую работу
    setTimeout(() => {
        showNotification(`Задание "${taskName}" успешно добавлено!`, 'success');
    }, 1000);
}

function uploadNewMaterial() {
    showModal(`
        <h3>📤 Загрузка нового материала</h3>
        <div class="form-group">
            <label>Название материала:</label>
            <input type="text" id="materialName" class="form-input" placeholder="Введите название">
        </div>
        <div class="form-group">
            <label>Тип материала:</label>
            <select id="materialType" class="form-select">
                <option value="work_template">Шаблон работы</option>
                <option value="criteria">Критерии оценивания</option>
                <option value="task">Задание</option>
                <option value="methodical">Методический материал</option>
                <option value="resource">Ресурс</option>
            </select>
        </div>
        <div class="form-group">
            <label>Предмет:</label>
            <select id="materialSubject" class="form-select">
                <option value="all">Все предметы</option>
                <option value="mathematics">Математика</option>
                <option value="russian">Русский язык</option>
                <option value="literature">Литература</option>
                <option value="physics">Физика</option>
                <option value="chemistry">Химия</option>
                <option value="biology">Биология</option>
                <option value="history">История</option>
                <option value="geography">География</option>
            </select>
        </div>
        <div class="form-group">
            <label>Загрузить файл:</label>
            <input type="file" id="materialFile" class="form-input">
        </div>
        <div class="form-group">
            <label>Описание:</label>
            <textarea id="materialDescription" class="form-textarea" rows="3"></textarea>
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="hideModal()">Отмена</button>
            <button class="btn btn-primary" onclick="saveNewMaterial()">Сохранить</button>
        </div>
    `);
}

function saveNewMaterial() {
    // Логика сохранения нового материала
    showNotification('Материал успешно сохранен в библиотеку!', 'success');
    hideModal();
}

function importFromExternal() {
    showModal(`
        <h3>🌐 Импорт материалов из сети</h3>
        <div class="form-group">
            <label>Источник:</label>
            <select id="importSource" class="form-select">
                <option value="fipi">ФИПИ (fipi.ru)</option>
                <option value="reshuege">РешуЕГЭ (sdamgia.ru)</option>
                <option value="yaklass">ЯКласс (yaklass.ru)</option>
                <option value="other">Другой источник</option>
            </select>
        </div>
        <div class="form-group">
            <label>Ссылка:</label>
            <input type="url" id="importUrl" class="form-input" placeholder="https://...">
        </div>
        <div class="form-group">
            <label>Тип материала:</label>
            <select id="importType" class="form-select">
                <option value="tasks">Задания</option>
                <option value="criteria">Критерии</option>
                <option value="test">Тест целиком</option>
            </select>
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="hideModal()">Отмена</button>
            <button class="btn btn-primary" onclick="startImport()">Импортировать</button>
        </div>
    `);
}

function startImport() {
    showNotification('Импорт материалов начат...', 'info');
    hideModal();
    // Здесь можно добавить логику импорта
}

function exportLibrary() {
    // Логика экспорта всей библиотеки
    showNotification('Библиотека экспортирована в ZIP архив', 'success');
}

function updateMaterialCounts() {
    // Обновление счетчиков в категориях
    const counts = {
        work_templates: document.querySelectorAll('[data-category="work_templates"]').length,
        criteria: document.querySelectorAll('[data-category="criteria"]').length,
        tasks_bank: document.querySelectorAll('[data-category="tasks_bank"]').length,
        methodical: document.querySelectorAll('[data-category="methodical"]').length,
        subject_resources: document.querySelectorAll('[data-category="subject_resources"]').length,
        external_resources: document.querySelectorAll('[data-category="external_resources"]').length
    };
    
    // Обновить текст в категориях
    Object.keys(counts).forEach(category => {
        const element = document.querySelector(`[data-category="${category}"] small`);
        if (element) {
            element.textContent = `${counts[category]} ${getCategoryLabel(category, counts[category])}`;
        }
    });
}

function getCategoryLabel(category, count) {
    const labels = {
        work_templates: ['шаблон', 'шаблона', 'шаблонов'],
        criteria: ['набор', 'набора', 'наборов'],
        tasks_bank: ['задание', 'задания', 'заданий'],
        methodical: ['файл', 'файла', 'файлов'],
        subject_resources: ['предмет', 'предмета', 'предметов'],
        external_resources: ['ссылка', 'ссылки', 'ссылок']
    };
    
    const forms = labels[category] || ['элемент', 'элемента', 'элементов'];
    return getPluralForm(count, forms[0], forms[1], forms[2]);
}

function getPluralForm(n, form1, form2, form5) {
    n = Math.abs(n) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return form5;
    if (n1 > 1 && n1 < 5) return form2;
    if (n1 === 1) return form1;
    return form5;
}

function updateLibraryStats() {
    // Обновление статистики библиотеки
    // Здесь можно добавить запрос к серверу или расчет статистики
}

function changePage(page) {
    currentLibraryPage = page;
    // Здесь можно добавить логику пагинации
    document.querySelectorAll('.page-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Инициализация библиотеки при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация поиска
    const searchInput = document.getElementById('librarySearch');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                searchLibrary();
            }
        });
    }
});

// ============================
// СИСТЕМА БИБЛИОТЕКИ МАТЕРИАЛОВ
// ============================

// Конфигурация библиотеки
const libraryConfig = {
    version: '1.0.0',
    catalogFileName: 'library_catalog.json',
    folders: {
        templates: 'templates/',
        criteria: 'criteria/',
        tasks: 'tasks/',
        methodical: 'methodical/',
        subject_resources: 'subjects/',
        external: 'external/',
        images: 'images/',
        docs: 'documents/'
    },
    supportedExtensions: {
        templates: ['.json', '.template'],
        criteria: ['.json', '.criteria'],
        tasks: ['.json', '.task'],
        methodical: ['.pdf', '.doc', '.docx', '.txt', '.md'],
        images: ['.jpg', '.jpeg', '.png', '.gif', '.svg'],
        docs: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
    }
};

// Структура каталога библиотеки
window.libraryCatalog = {
    meta: {
        version: libraryConfig.version,
        lastUpdated: new Date().toISOString(),
        totalItems: 0,
        totalSize: '0 MB',
        generatedBy: 'Система анализа результатов'
    },
    categories: {
        work_templates: [],
        criteria: [],
        tasks_bank: [],
        methodical: [],
        subject_resources: [],
        external_resources: []
    },
    fileIndex: {}, // Для быстрого поиска файлов по ID
    statistics: {
        bySubject: {},
        byGrade: {},
        byComplexity: {},
        byType: {}
    }
};

// Инициализация библиотеки
function initLibrary() {
    console.log('📚 Инициализация библиотеки материалов...');
    
    // Пробуем загрузить из localStorage
    const cachedCatalog = localStorage.getItem('library_catalog_cache');
    const cacheInfo = localStorage.getItem('library_cache_info');
    
    if (cachedCatalog && cacheInfo) {
        try {
            const info = JSON.parse(cacheInfo);
            const catalog = JSON.parse(cachedCatalog);
            
            // Проверяем версию
            if (catalog.meta && catalog.meta.version === libraryConfig.version) {
                window.libraryCatalog = catalog;
                console.log('📚 Библиотека загружена из кеша:', catalog.meta.totalItems, 'материалов');
                
                // Обновляем UI
                updateLibraryInfo(info);
                return true;
            }
        } catch (e) {
            console.error('Ошибка загрузки кеша библиотеки:', e);
        }
    }
    
    // Если кеша нет или он устарел, создаем пустую библиотеку
    createDefaultLibrary();
    return false;
}

// Создание базовой библиотеки
function createDefaultLibrary() {
    console.log('📚 Создание базовой библиотеки...');
    
    // Примерные данные для демонстрации
    const defaultMaterials = {
        work_templates: [
            {
                id: 'template_math_001',
                title: 'Шаблон контрольной по математике',
                description: 'Стандартный шаблон для текущей контрольной работы',
                category: 'work_templates',
                subject: 'mathematics',
                grade: '5-6',
                file: 'templates/math_control.json',
                size: '15 KB',
                tags: ['математика', 'контрольная', 'шаблон'],
                added: '2024-01-12',
                complexity: 'all',
                thumbnail: 'images/math_template.png'
            }
        ],
        criteria: [
            {
                id: 'criteria_vpr_001',
                title: 'Критерии ВПР 4 класс',
                description: 'Официальные критерии оценивания ВПР',
                category: 'criteria',
                subject: 'world_around',
                grade: '4',
                file: 'criteria/vpr_4.json',
                size: '8 KB',
                tags: ['ВПР', 'критерии', 'официальные'],
                added: '2024-01-15'
            }
        ],
        tasks_bank: [
            {
                id: 'task_analysis_001',
                title: 'Задания на анализ',
                description: '25 заданий на анализ и синтез информации',
                category: 'tasks_bank',
                subject: 'all',
                grade: '7-9',
                file: 'tasks/analysis_set.json',
                size: '45 KB',
                tags: ['анализ', 'уровень 3', 'задания'],
                added: '2024-01-10',
                complexity: 3,
                taskCount: 25
            }
        ]
    };
    
    // Заполняем каталог
    Object.keys(defaultMaterials).forEach(category => {
        libraryCatalog.categories[category] = defaultMaterials[category];
        defaultMaterials[category].forEach(item => {
            libraryCatalog.fileIndex[item.id] = item;
        });
    });
    
    // Обновляем метаданные
    updateCatalogMetadata();
    
    // Сохраняем в кеш
    saveLibraryCache();
    
    console.log('📚 Базовая библиотека создана');
}

// Обновление метаданных каталога
function updateCatalogMetadata() {
    let totalItems = 0;
    let totalSize = 0;
    
    // Считаем статистику
    Object.keys(libraryCatalog.categories).forEach(category => {
        const items = libraryCatalog.categories[category];
        totalItems += items.length;
        
        items.forEach(item => {
            // Парсим размер файла
            if (item.size) {
                const match = item.size.match(/([\d.]+)\s*(KB|MB|GB)/i);
                if (match) {
                    const value = parseFloat(match[1]);
                    const unit = match[2].toUpperCase();
                    
                    if (unit === 'KB') totalSize += value * 1024;
                    else if (unit === 'MB') totalSize += value * 1024 * 1024;
                    else if (unit === 'GB') totalSize += value * 1024 * 1024 * 1024;
                }
            }
            
            // Обновляем статистику по предметам
            if (item.subject) {
                if (!libraryCatalog.statistics.bySubject[item.subject]) {
                    libraryCatalog.statistics.bySubject[item.subject] = 0;
                }
                libraryCatalog.statistics.bySubject[item.subject]++;
            }
        });
    });
    
    // Форматируем общий размер
    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    };
    
    // Обновляем метаданные
    libraryCatalog.meta = {
        version: libraryConfig.version,
        lastUpdated: new Date().toISOString(),
        totalItems: totalItems,
        totalSize: formatSize(totalSize),
        generatedBy: 'Система анализа результатов'
    };
}

// Сохранение кеша библиотеки
function saveLibraryCache() {
    try {
        const catalogString = JSON.stringify(libraryCatalog, null, 2);
        const cacheInfo = {
            savedAt: new Date().toISOString(),
            version: libraryConfig.version,
            itemsCount: libraryCatalog.meta.totalItems,
            size: libraryCatalog.meta.totalSize
        };
        
        localStorage.setItem('library_catalog_cache', catalogString);
        localStorage.setItem('library_cache_info', JSON.stringify(cacheInfo));
        
        console.log('📚 Кеш библиотеки сохранен:', cacheInfo.itemsCount, 'материалов');
        updateLibraryInfo(cacheInfo);
        
        return true;
    } catch (e) {
        console.error('Ошибка сохранения кеша библиотеки:', e);
        return false;
    }
}

// Обновление информации о библиотеке в UI
function updateLibraryInfo(cacheInfo) {
    const infoElement = document.getElementById('libraryInfo');
    if (!infoElement) return;
    
    const pathSpan = document.getElementById('libraryPath');
    const statusSpan = document.getElementById('cacheStatus');
    const updateSpan = document.getElementById('lastUpdate');
    
    if (pathSpan) {
        const libraryPath = localStorage.getItem('library_path') || 'Не указан';
        pathSpan.textContent = libraryPath;
    }
    
    if (statusSpan && updateSpan && cacheInfo) {
        const savedDate = new Date(cacheInfo.savedAt);
        const now = new Date();
        const diffHours = (now - savedDate) / (1000 * 60 * 60);
        
        if (diffHours > 24) {
            statusSpan.textContent = '⚠️ Устаревший';
            statusSpan.style.color = '#f39c12';
        } else {
            statusSpan.textContent = '✅ Актуальный';
            statusSpan.style.color = '#27ae60';
        }
        
        updateSpan.textContent = savedDate.toLocaleString();
    }
}

// Сканирование папки библиотеки
function scanLibraryFolder() {
    const libraryPath = localStorage.getItem('library_path');
    
    if (!libraryPath) {
        // Если путь не указан, предлагаем выбрать папку
        changeLibraryPath();
        return;
    }
    
    // Показываем модальное окно сканирования
    showScanModal();
    
    // Имитируем процесс сканирования (в реальном приложении здесь будет работа с файловой системой)
    simulateFolderScan(libraryPath);
}

// Имитация сканирования папки (для демонстрации)
function simulateFolderScan(path) {
    let progress = 0;
    let processedFiles = 0;
    const totalFiles = 150; // Примерное количество файлов
    
    const progressBar = document.getElementById('scanProgressBar');
    const currentFile = document.getElementById('scanCurrentFile');
    const scanStats = document.getElementById('scanStats');
    
    const scanInterval = setInterval(() => {
        progress += 100 / totalFiles;
        processedFiles++;
        
        if (progressBar) progressBar.style.width = progress + '%';
        if (currentFile) currentFile.textContent = `Файл: template_${processedFiles}.json`;
        if (scanStats) scanStats.textContent = `Обработано: ${processedFiles} из ${totalFiles} файлов`;
        
        if (processedFiles >= totalFiles) {
            clearInterval(scanInterval);
            
            // Обновляем библиотеку новыми данными
            updateLibraryFromScan();
            
            // Показываем результаты
            showScanResults();
        }
    }, 50);
}

// Обновление библиотеки после сканирования
function updateLibraryFromScan() {
    // Здесь в реальном приложении будет парсинг файлов
    // Для демонстрации добавляем несколько новых материалов
    
    const newMaterials = {
        id: 'new_' + Date.now(),
        title: 'Новый материал из сканирования',
        description: 'Добавлен автоматически при сканировании папки',
        category: 'work_templates',
        subject: 'mathematics',
        grade: '7-8',
        file: 'templates/new_scan.json',
        size: '12 KB',
        tags: ['автосканирование', 'математика', 'новый'],
        added: new Date().toISOString().split('T')[0]
    };
    
    // Добавляем в каталог
    libraryCatalog.categories.work_templates.push(newMaterials);
    libraryCatalog.fileIndex[newMaterials.id] = newMaterials;
    
    // Обновляем метаданные
    updateCatalogMetadata();
    
    // Сохраняем в кеш
    saveLibraryCache();
    
    // Обновляем отображение
    loadLibraryContent();
}

// Показать модальное окно сканирования
function showScanModal() {
    document.getElementById('scanModal').style.display = 'flex';
    document.getElementById('scanProgress').style.display = 'block';
    document.getElementById('scanResults').style.display = 'none';
    document.getElementById('scanProgressBar').style.width = '0%';
}

// Показать результаты сканирования
function showScanResults() {
    document.getElementById('scanProgress').style.display = 'none';
    document.getElementById('scanResults').style.display = 'block';
    
    const resultsContent = document.getElementById('scanResultsContent');
    resultsContent.innerHTML = `
        <p>✅ Сканирование завершено успешно!</p>
        <div style="margin-top: 15px;">
            <p><strong>Результаты:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Найдено новых материалов: <strong>5</strong></li>
                <li>Обновлено материалов: <strong>12</strong></li>
                <li>Удалено устаревших: <strong>3</strong></li>
                <li>Общий размер библиотеки: <strong>${libraryCatalog.meta.totalSize}</strong></li>
            </ul>
        </div>
        <p style="color: #27ae60; margin-top: 15px;">
            <i class="fas fa-info-circle"></i> Каталог библиотеки обновлен и сохранен в кеш
        </p>
    `;
}

// Закрыть модальное окно сканирования
function closeScanModal() {
    document.getElementById('scanModal').style.display = 'none';
}

// Отмена сканирования
function cancelScan() {
    // В реальном приложении здесь остановка процесса сканирования
    closeScanModal();
}

// Изменение пути к библиотеке
function changeLibraryPath() {
    showModal(`
        <h3>📁 Изменение пути к библиотеке</h3>
        <div class="form-group">
            <label>Путь к папке библиотеки:</label>
            <input type="text" id="newLibraryPath" class="form-input" 
                   placeholder="C:/Учебные материалы/Библиотека" 
                   value="${localStorage.getItem('library_path') || ''}">
            <small class="form-hint">Укажите абсолютный путь к папке с материалами</small>
        </div>
        <div class="form-group">
            <label>Тип библиотеки:</label>
            <select id="libraryType" class="form-select">
                <option value="local">Локальная папка</option>
                <option value="network">Сетевая папка</option>
                <option value="cloud">Облачное хранилище</option>
            </select>
        </div>
        <div class="form-group">
            <label>
                <input type="checkbox" id="autoScan" checked> Автоматическое сканирование при изменении
            </label>
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="hideModal()">Отмена</button>
            <button class="btn btn-primary" onclick="saveLibraryPath()">Сохранить</button>
        </div>
    `);
}

// Сохранение пути к библиотеке
function saveLibraryPath() {
    const newPath = document.getElementById('newLibraryPath').value;
    const libraryType = document.getElementById('libraryType').value;
    const autoScan = document.getElementById('autoScan').checked;
    
    if (!newPath) {
        showNotification('Укажите путь к библиотеке!', 'error');
        return;
    }
    
    localStorage.setItem('library_path', newPath);
    localStorage.setItem('library_type', libraryType);
    localStorage.setItem('library_auto_scan', autoScan);
    
    showNotification('Путь к библиотеке сохранен!', 'success');
    updateLibraryInfo();
    hideModal();
    
    // Предлагаем просканировать
    if (autoScan) {
        setTimeout(() => {
            if (confirm('Выполнить сканирование библиотеки сейчас?')) {
                scanLibraryFolder();
            }
        }, 500);
    }
}

// Импорт каталога из файла
function importLibraryCatalog() {
    // Создаем скрытый input для выбора файла
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.catalog';
    input.style.display = 'none';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const importedCatalog = JSON.parse(event.target.result);
                
                // Проверяем структуру
                if (!importedCatalog.meta || !importedCatalog.categories) {
                    throw new Error('Неверный формат каталога');
                }
                
                // Проверяем версию
                if (importedCatalog.meta.version !== libraryConfig.version) {
                    if (!confirm(`Версия каталога (${importedCatalog.meta.version}) отличается от текущей (${libraryConfig.version}). Продолжить импорт?`)) {
                        return;
                    }
                }
                
                // Заменяем каталог
                window.libraryCatalog = importedCatalog;
                
                // Обновляем метаданные
                updateCatalogMetadata();
                
                // Сохраняем в кеш
                saveLibraryCache();
                
                // Обновляем отображение
                loadLibraryContent();
                
                showNotification(`Каталог успешно импортирован! ${importedCatalog.meta.totalItems} материалов`, 'success');
                
            } catch (error) {
                console.error('Ошибка импорта каталога:', error);
                showNotification('Ошибка импорта каталога: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

// Экспорт каталога в файл
function exportLibraryCatalog() {
    // Создаем Blob с каталогом
    const catalogData = JSON.stringify(libraryCatalog, null, 2);
    const blob = new Blob([catalogData], { type: 'application/json' });
    
    // Создаем ссылку для скачивания
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library_catalog_${new Date().toISOString().split('T')[0]}.json`;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    // Очистка
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
    
    showNotification('Каталог библиотеки экспортирован!', 'success');
}

// Перестроение кеша библиотеки
function rebuildLibraryCache() {
    if (confirm('Перестроить кеш библиотеки? Существующий кеш будет очищен.')) {
        // Очищаем старый кеш
        localStorage.removeItem('library_catalog_cache');
        localStorage.removeItem('library_cache_info');
        
        // Пересоздаем библиотеку
        createDefaultLibrary();
        
        // Обновляем отображение
        loadLibraryContent();
        
        showNotification('Кеш библиотеки перестроен!', 'success');
    }
}

// Настройки библиотеки
function showLibrarySettings() {
    showModal(`
        <h3>⚙️ Настройки библиотеки</h3>
        
        <div class="form-group">
            <label>Автообновление:</label>
            <select id="autoUpdateInterval" class="form-select">
                <option value="0">Никогда</option>
                <option value="1" selected>Каждый день</option>
                <option value="7">Раз в неделю</option>
                <option value="30">Раз в месяц</option>
            </select>
        </div>
        
        <div class="form-group">
            <label>Макс. размер кеша:</label>
            <select id="maxCacheSize" class="form-select">
                <option value="10">10 MB</option>
                <option value="50" selected>50 MB</option>
                <option value="100">100 MB</option>
                <option value="500">500 MB</option>
                <option value="1000">1 GB</option>
            </select>
        </div>
        
        <div class="form-group">
            <label>
                <input type="checkbox" id="previewImages" checked> Показывать превью изображений
            </label>
        </div>
        
        <div class="form-group">
            <label>
                <input type="checkbox" id="autoCategorize" checked> Автоматическая категоризация
            </label>
        </div>
        
        <div class="form-group">
            <label>
                <input type="checkbox" id="backupCatalog" checked> Создавать резервные копии
            </label>
        </div>
        
        <hr>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
            <h4 style="margin-top: 0;">📊 Информация о библиотеке</h4>
            <div style="font-size: 14px;">
                <div>Версия: <strong>${libraryCatalog.meta.version}</strong></div>
                <div>Материалов: <strong>${libraryCatalog.meta.totalItems}</strong></div>
                <div>Общий размер: <strong>${libraryCatalog.meta.totalSize}</strong></div>
                <div>Последнее обновление: <strong>${new Date(libraryCatalog.meta.lastUpdated).toLocaleString()}</strong></div>
            </div>
        </div>
        
        <div class="modal-actions">
            <button class="btn" onclick="hideModal()">Отмена</button>
            <button class="btn btn-primary" onclick="saveLibrarySettings()">Сохранить</button>
            <button class="btn btn-danger" onclick="clearLibraryCache()" style="margin-left: auto;">
                <i class="fas fa-trash"></i> Очистить кеш
            </button>
        </div>
    `);
    
    // Устанавливаем текущие значения
    setTimeout(() => {
        const interval = localStorage.getItem('library_auto_update') || '1';
        const cacheSize = localStorage.getItem('library_max_cache') || '50';
        const previewImages = localStorage.getItem('library_preview') !== 'false';
        const autoCategorize = localStorage.getItem('library_auto_cat') !== 'false';
        const backupCatalog = localStorage.getItem('library_backup') !== 'false';
        
        document.getElementById('autoUpdateInterval').value = interval;
        document.getElementById('maxCacheSize').value = cacheSize;
        document.getElementById('previewImages').checked = previewImages;
        document.getElementById('autoCategorize').checked = autoCategorize;
        document.getElementById('backupCatalog').checked = backupCatalog;
    }, 10);
}

// Сохранение настроек библиотеки
function saveLibrarySettings() {
    const interval = document.getElementById('autoUpdateInterval').value;
    const cacheSize = document.getElementById('maxCacheSize').value;
    const previewImages = document.getElementById('previewImages').checked;
    const autoCategorize = document.getElementById('autoCategorize').checked;
    const backupCatalog = document.getElementById('backupCatalog').checked;
    
    localStorage.setItem('library_auto_update', interval);
    localStorage.setItem('library_max_cache', cacheSize);
    localStorage.setItem('library_preview', previewImages);
    localStorage.setItem('library_auto_cat', autoCategorize);
    localStorage.setItem('library_backup', backupCatalog);
    
    showNotification('Настройки библиотеки сохранены!', 'success');
    hideModal();
}

// Очистка кеша библиотеки
function clearLibraryCache() {
    if (confirm('Вы уверены, что хотите полностью очистить кеш библиотеки? Все загруженные материалы будут удалены.')) {
        localStorage.removeItem('library_catalog_cache');
        localStorage.removeItem('library_cache_info');
        
        // Создаем пустую библиотеку
        createDefaultLibrary();
        
        showNotification('Кеш библиотеки очищен!', 'success');
        hideModal();
    }
}

// Обновление функции loadLibraryContent
function loadLibraryContent() {
    // Используем данные из каталога
    const grid = document.getElementById('materialsGrid');
    if (!grid) return;
    
    // Очищаем сетку
    grid.innerHTML = '';
    
    // Получаем текущую категорию
    const category = currentLibraryCategory === 'all' ? null : currentLibraryCategory;
    
    // Счетчики для статистики
    let displayedCount = 0;
    
    // Рендерим материалы из каталога
    if (category) {
        // Рендерим только выбранную категорию
        const materials = libraryCatalog.categories[category] || [];
        materials.forEach(material => {
            grid.appendChild(createMaterialCard(material));
            displayedCount++;
        });
    } else {
        // Рендерим все материалы
        Object.keys(libraryCatalog.categories).forEach(cat => {
            const materials = libraryCatalog.categories[cat];
            materials.forEach(material => {
                grid.appendChild(createMaterialCard(material));
                displayedCount++;
            });
        });
    }
    
    // Показываем пустую библиотеку, если нет материалов
    const emptyLib = document.getElementById('emptyLibrary');
    if (emptyLib) {
        emptyLib.style.display = displayedCount === 0 ? 'block' : 'none';
    }
    
    // Обновляем счетчики в категориях
    updateMaterialCounts();
}

// Создание карточки материала из данных каталога
function createMaterialCard(material) {
    const card = document.createElement('div');
    card.className = 'material-card';
    card.dataset.id = material.id;
    
    // Добавляем обработчик клика на всю карточку
    card.onclick = function(e) {
        // Не открываем просмотр если кликнули на кнопки действий
        if (!e.target.closest('.material-actions')) {
            viewMaterial(material.id);
        }
    };
    
    // Остальной код создания карточки остается таким же...
    const iconMap = {
        'work_templates': '📝',
        'criteria': '📊',
        'tasks_bank': '🧩',
        'methodical': '📚',
        'subject_resources': '🔬',
        'external_resources': '🌐'
    };
    
    const icon = iconMap[material.category] || '📄';
    
    card.innerHTML = `
        <div class="material-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
            <div>
                <div style="font-size: 24px; margin-bottom: 5px;">${icon}</div>
                <h4 style="margin: 0; color: #2c3e50;">${material.title}</h4>
                <small style="color: #7f8c8d;">${getSubjectName(material.subject)} ${material.grade ? '· ' + material.grade + ' класс' : ''}</small>
            </div>
            <div class="material-actions" onclick="event.stopPropagation()">
                ${material.file ? `<button class="btn-icon" onclick="downloadMaterial('${material.id}')" title="Скачать">
                    <i class="fas fa-download"></i>
                </button>` : ''}
                ${material.url ? `<button class="btn-icon" onclick="window.open('${material.url}', '_blank')" title="Открыть ссылку">
                    <i class="fas fa-external-link-alt"></i>
                </button>` : ''}
                <button class="btn-icon" onclick="quickUseMaterial('${material.id}')" title="Быстро использовать">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        </div>
        <p style="color: #5a6268; font-size: 14px; margin-bottom: 15px;">
            ${material.description || 'Нет описания'}
        </p>
        <div class="material-tags" style="display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 15px;">
            ${(material.tags || []).map(tag => `
                <span class="tag" style="background: #e8f4fc; color: #3498db; padding: 3px 8px; border-radius: 12px; font-size: 12px;">
                    ${tag}
                </span>
            `).join('')}
            ${material.complexity && material.complexity !== 'all' ? `
                <span class="tag" style="background: #fdedec; color: #e74c3c; padding: 3px 8px; border-radius: 12px; font-size: 12px;">
                    Уровень ${material.complexity}
                </span>
            ` : ''}
        </div>
        <div class="material-footer" style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #95a5a6;">
            <div>
                ${material.size ? `<i class="fas fa-hdd"></i> ${material.size}` : ''}
                ${material.taskCount ? `<span style="margin: 0 10px;">|</span><i class="fas fa-tasks"></i> ${material.taskCount} заданий` : ''}
                ${material.pages ? `<span style="margin: 0 10px;">|</span><i class="fas fa-file-alt"></i> ${material.pages} стр.` : ''}
            </div>
            <div>Добавлено: ${formatDate(material.added)}</div>
        </div>
    `;
    
    return card;
}

// Открытие материала
function openMaterial(materialId) {
    const material = libraryCatalog.fileIndex[materialId];
    if (!material) {
        showNotification('Материал не найден!', 'error');
        return;
    }
    
    // В зависимости от типа файла открываем по-разному
    if (material.file) {
        const extension = material.file.split('.').pop().toLowerCase();
        
        switch (extension) {
            case 'pdf':
                // Открываем PDF
                window.open(material.file, '_blank');
                break;
                
            case 'json':
            case 'template':
                // Загружаем и применяем шаблон
                loadMaterialTemplate(material);
                break;
                
            default:
                // Для остальных файлов предлагаем скачать
                downloadMaterial(material);
        }
    } else {
        showNotification('Файл материала не указан', 'warning');
    }
}

// Использование материала
function useMaterial(materialId) {
    const material = libraryCatalog.fileIndex[materialId];
    if (!material) return;
    
    showNotification(`Материал "${material.title}" применяется...`, 'info');
    
    // В зависимости от категории применяем по-разному
    switch (material.category) {
        case 'work_templates':
            applyWorkTemplate(material);
            break;
            
        case 'criteria':
            applyCriteriaTemplate(material);
            break;
            
        case 'tasks_bank':
            addTasksToTest(material);
            break;
            
        default:
            showNotification(`Материал "${material.title}" применен!`, 'success');
    }
}

// Применение шаблона работы
function applyWorkTemplate(material) {
    // Здесь будет логика применения шаблона работы
    setTimeout(() => {
        showNotification(`Шаблон "${material.title}" успешно применен!`, 'success');
        // Переключаемся на вкладку настройки
        showTab('setup');
    }, 1000);
}

// Инициализация библиотеки при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем библиотеку
    initLibrary();
    
    // Обновляем информацию о библиотеке
    updateLibraryInfo();
    
    // Загружаем содержимое библиотеки
    loadLibraryContent();
    
    console.log('📚 Библиотека материалов инициализирована');
});

// ============================
// СИСТЕМА ПАГИНАЦИИ И ДОБАВЛЕНИЯ МАТЕРИАЛОВ
// ============================

// Глобальные переменные для пагинации
let currentPage = 1;
let pageSize = 12;
let totalPages = 1;
let filteredMaterials = [];
let paginationTimeout = null;

// Инициализация пагинации
function initPagination() {
    // Получаем сохраненные настройки
    const savedPageSize = localStorage.getItem('library_page_size');
    if (savedPageSize) {
        pageSize = parseInt(savedPageSize);
        document.getElementById('pageSize').value = pageSize;
    }
    
    // Рассчитываем материалы для текущей страницы
    calculatePagination();
}

// Расчет пагинации
function calculatePagination() {
    // Получаем все материалы для текущей категории
    if (currentLibraryCategory === 'all') {
        // Собираем все материалы из всех категорий
        filteredMaterials = [];
        Object.keys(libraryCatalog.categories).forEach(category => {
            filteredMaterials = filteredMaterials.concat(libraryCatalog.categories[category]);
        });
    } else {
        filteredMaterials = libraryCatalog.categories[currentLibraryCategory] || [];
    }
    
    // Фильтруем по поиску (если есть)
    const searchTerm = document.getElementById('librarySearch')?.value.toLowerCase();
    if (searchTerm) {
        filteredMaterials = filteredMaterials.filter(material => {
            const title = material.title?.toLowerCase() || '';
            const desc = material.description?.toLowerCase() || '';
            const tags = material.tags?.join(' ').toLowerCase() || '';
            const subject = getSubjectName(material.subject)?.toLowerCase() || '';
            
            return title.includes(searchTerm) || 
                   desc.includes(searchTerm) || 
                   tags.includes(searchTerm) ||
                   subject.includes(searchTerm);
        });
    }
    
    // Сортируем материалы (по дате добавления)
    filteredMaterials.sort((a, b) => {
        const dateA = new Date(a.added || '2000-01-01');
        const dateB = new Date(b.added || '2000-01-01');
        return dateB - dateA; // Новые сначала
    });
    
    // Рассчитываем общее количество страниц
    totalPages = Math.max(1, Math.ceil(filteredMaterials.length / pageSize));
    
    // Проверяем текущую страницу
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    
    // Обновляем UI пагинации
    updatePaginationUI();
    
    // Отображаем материалы для текущей страницы
    displayCurrentPage();
}

// Обновление UI пагинации
function updatePaginationUI() {
    const currentPageEl = document.getElementById('currentPage');
    const totalPagesEl = document.getElementById('totalPages');
    const totalItemsEl = document.getElementById('totalItems');
    const shownItemsEl = document.getElementById('shownItems');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (currentPageEl) currentPageEl.textContent = currentPage;
    if (totalPagesEl) totalPagesEl.textContent = totalPages;
    if (totalItemsEl) totalItemsEl.textContent = filteredMaterials.length;
    
    // Рассчитываем отображаемые элементы
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredMaterials.length);
    if (shownItemsEl) shownItemsEl.textContent = `${startIndex + 1}-${endIndex}`;
    
    // Обновляем состояние кнопок
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    
    // Обновляем номера страниц
    updatePageNumbers();
}

// Обновление номеров страниц
function updatePageNumbers() {
    const paginationContainer = document.querySelector('.pagination-numbers');
    if (!paginationContainer) return;
    
    // Создаем массив номеров страниц для отображения
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
        // Показываем все страницы
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        // Сложная логика отображения с точками
        pages.push(1);
        
        if (currentPage > 3) pages.push('...');
        
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        
        if (currentPage < totalPages - 2) pages.push('...');
        
        if (totalPages > 1) pages.push(totalPages);
    }
    
    // Рендерим номера страниц
    paginationContainer.innerHTML = pages.map(page => {
        if (page === '...') {
            return `<span class="page-number dots">...</span>`;
        }
        return `<button class="page-number ${page === currentPage ? 'active' : ''}" 
                        onclick="goToPage(${page})">${page}</button>`;
    }).join('');
}

// Отображение материалов текущей страницы
function displayCurrentPage() {
    const grid = document.getElementById('materialsGrid');
    if (!grid) return;
    
    // Очищаем сетку
    grid.innerHTML = '';
    
    // Получаем материалы для текущей страницы
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredMaterials.length);
    const pageMaterials = filteredMaterials.slice(startIndex, endIndex);
    
    if (pageMaterials.length === 0) {
        // Показываем сообщение, что материалов нет
        const emptyLib = document.getElementById('emptyLibrary');
        if (emptyLib) {
            emptyLib.style.display = 'block';
            grid.style.display = 'none';
        }
        return;
    }
    
    // Скрываем сообщение о пустой библиотеке
    const emptyLib = document.getElementById('emptyLibrary');
    if (emptyLib) emptyLib.style.display = 'none';
    grid.style.display = 'grid';
    
    // Рендерим материалы
    pageMaterials.forEach(material => {
        grid.appendChild(createMaterialCard(material));
    });
}

// Навигация по страницам
function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    currentPage = page;
    calculatePagination();
    
    // Плавная прокрутка к началу сетки
    const grid = document.getElementById('materialsGrid');
    if (grid) {
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function prevPage() {
    if (currentPage > 1) {
        goToPage(currentPage - 1);
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        goToPage(currentPage + 1);
    }
}

function changePageSize() {
    const newSize = parseInt(document.getElementById('pageSize').value);
    if (newSize !== pageSize) {
        pageSize = newSize;
        currentPage = 1; // Сбрасываем на первую страницу
        
        // Сохраняем настройку
        localStorage.setItem('library_page_size', pageSize);
        
        calculatePagination();
    }
}

// Поиск с дебаунсом
function searchLibrary() {
    // Сбрасываем таймер, если он уже есть
    if (paginationTimeout) {
        clearTimeout(paginationTimeout);
    }
    
    // Устанавливаем новый таймер
    paginationTimeout = setTimeout(() => {
        currentPage = 1; // Возвращаемся на первую страницу при поиске
        calculatePagination();
        paginationTimeout = null;
    }, 300); // Задержка 300ms
}

// Фильтрация по категории с пагинацией
function selectCategory(category) {
    currentLibraryCategory = category;
    currentPage = 1; // Сбрасываем на первую страницу
    
    // Обновить активный элемент в боковой панели
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    // Обновить хлебные крошки
    const categoryNames = {
        'all': 'Все материалы',
        'work_templates': 'Шаблоны работ',
        'criteria': 'Критерии оценивания',
        'tasks_bank': 'Банк заданий',
        'methodical': 'Методические материалы',
        'subject_resources': 'По предметам',
        'external_resources': 'Полезные ресурсы'
    };
    const currentCategoryEl = document.getElementById('currentCategory');
    if (currentCategoryEl) {
        currentCategoryEl.textContent = categoryNames[category] || category;
    }
    
    // Пересчитываем пагинацию
    calculatePagination();
}

// ============================
// ФОРМА ДОБАВЛЕНИЯ МАТЕРИАЛОВ
// ============================

let uploadedFiles = [];

// Показать форму добавления материала
function showAddMaterialForm() {
    showModal(`
        <div class="tabbed-form">
            <div class="form-tabs">
                <button class="form-tab active" onclick="switchFormTab('upload')">📤 Загрузка файла</button>
                <button class="form-tab" onclick="switchFormTab('link')">🔗 По ссылке</button>
                <button class="form-tab" onclick="switchFormTab('manual')">✍️ Вручную</button>
            </div>
            
            <!-- Вкладка загрузки файла -->
            <div class="form-tab-content active" id="uploadTab">
                <h4 style="margin-top: 0;">Загрузите файл</h4>
                <div class="upload-area" id="uploadArea" 
                     onclick="document.getElementById('fileInput').click()"
                     ondrop="handleFileDrop(event)"
                     ondragover="handleDragOver(event)"
                     ondragleave="handleDragLeave(event)">
                    <div style="font-size: 48px; margin-bottom: 15px;">📁</div>
                    <h5>Перетащите файлы сюда</h5>
                    <p style="color: #7f8c8d; margin: 10px 0;">или нажмите для выбора файлов</p>
                    <small style="color: #95a5a6;">Поддерживаются: PDF, DOC, DOCX, JSON, PNG, JPG, ZIP</small>
                </div>
                
                <input type="file" id="fileInput" multiple style="display: none;" 
                       onchange="handleFileSelect(event)">
                
                <div id="filePreviews"></div>
                
                <div class="form-group" style="margin-top: 20px;">
                    <label>Категория:</label>
                    <select id="materialCategory" class="form-select">
                        <option value="">-- Выберите категорию --</option>
                        <option value="work_templates">Шаблоны работ</option>
                        <option value="criteria">Критерии оценивания</option>
                        <option value="tasks_bank">Банк заданий</option>
                        <option value="methodical">Методические материалы</option>
                        <option value="subject_resources">Ресурсы по предметам</option>
                        <option value="external_resources">Полезные ресурсы</option>
                    </select>
                </div>
            </div>
            
            <!-- Вкладка добавления по ссылке -->
            <div class="form-tab-content" id="linkTab">
                <h4 style="margin-top: 0;">Добавить по ссылке</h4>
                <div class="form-group">
                    <label>URL ресурса:</label>
                    <input type="url" id="resourceUrl" class="form-input" 
                           placeholder="https://example.com/resource">
                </div>
                <div class="form-group">
                    <label>Тип ресурса:</label>
                    <select id="resourceType" class="form-select">
                        <option value="website">Веб-сайт</option>
                        <option value="video">Видео (YouTube, Vimeo)</option>
                        <option value="document">Документ (Google Docs)</option>
                        <option value="presentation">Презентация</option>
                        <option value="interactive">Интерактивное задание</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Название:</label>
                    <input type="text" id="resourceTitle" class="form-input" 
                           placeholder="Введите название ресурса">
                </div>
            </div>
            
            <!-- Вкладка ручного ввода -->
            <div class="form-tab-content" id="manualTab">
                <h4 style="margin-top: 0;">Создать материал вручную</h4>
                <div class="form-group">
                    <label>Название материала:</label>
                    <input type="text" id="manualTitle" class="form-input" 
                           placeholder="Введите название">
                </div>
                <div class="form-group">
                    <label>Категория:</label>
                    <select id="manualCategory" class="form-select">
                        <option value="">-- Выберите категорию --</option>
                        <option value="work_templates">Шаблон работы</option>
                        <option value="tasks_bank">Задание</option>
                        <option value="methodical">Методический материал</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Предмет:</label>
                    <select id="manualSubject" class="form-select">
                        <option value="">-- Выберите предмет --</option>
                        <option value="mathematics">Математика</option>
                        <option value="russian">Русский язык</option>
                        <option value="literature">Литература</option>
                        <option value="physics">Физика</option>
                        <option value="chemistry">Химия</option>
                        <option value="biology">Биология</option>
                        <option value="history">История</option>
                        <option value="geography">География</option>
                        <option value="english">Английский язык</option>
                        <option value="informatics">Информатика</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Уровень сложности:</label>
                    <select id="manualComplexity" class="form-select">
                        <option value="all">Все уровни</option>
                        <option value="1">1 - Базовый</option>
                        <option value="2">2 - Применение</option>
                        <option value="3">3 - Анализ</option>
                        <option value="4">4 - Творчество</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Класс:</label>
                    <input type="text" id="manualGrade" class="form-input" 
                           placeholder="Например: 5-6, 9, 10-11">
                </div>
                <div class="form-group">
                    <label>Описание:</label>
                    <textarea id="manualDescription" class="form-textarea" rows="3" 
                              placeholder="Опишите материал..."></textarea>
                </div>
                <div class="form-group">
                    <label>Теги (через запятую):</label>
                    <input type="text" id="manualTags" class="form-input" 
                           placeholder="математика, алгебра, уравнения">
                </div>
            </div>
            
            <!-- Общие поля -->
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                <div class="form-group">
                    <label>Автор (необязательно):</label>
                    <input type="text" id="materialAuthor" class="form-input" 
                           placeholder="Ваше имя или источник">
                </div>
                <div class="form-group">
                    <label>Лицензия:</label>
                    <select id="materialLicense" class="form-select">
                        <option value="free">Свободное использование</option>
                        <option value="cc-by">Creative Commons (CC BY)</option>
                        <option value="cc-by-sa">CC BY-SA</option>
                        <option value="cc-by-nc">CC BY-NC</option>
                        <option value="copyright">Авторское право</option>
                        <option value="unknown">Не указано</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="materialPublic" checked> Сделать материал общедоступным
                    </label>
                </div>
            </div>
        </div>
        
        <div class="modal-actions" style="margin-top: 20px;">
            <button class="btn" onclick="hideModal(); uploadedFiles = [];">Отмена</button>
            <button class="btn btn-success" onclick="saveNewMaterial()">
                <i class="fas fa-save"></i> Сохранить материал
            </button>
        </div>
    `, 'modal-lg');
    
    // Инициализируем превью файлов
    uploadedFiles = [];
    updateFilePreviews();
}

// Переключение вкладок формы
function switchFormTab(tabName) {
    // Убираем активный класс со всех вкладок
    document.querySelectorAll('.form-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.form-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Активируем выбранную вкладку
    document.querySelector(`.form-tab[onclick*="${tabName}"]`).classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
}

// Обработка выбора файлов
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    addFilesToUpload(files);
    event.target.value = ''; // Сбрасываем input
}

// Обработка перетаскивания файлов
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('uploadArea').classList.add('drag-over');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('uploadArea').classList.remove('drag-over');
}

function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('uploadArea').classList.remove('drag-over');
    
    const files = Array.from(event.dataTransfer.files);
    addFilesToUpload(files);
}

// Добавление файлов для загрузки
function addFilesToUpload(files) {
    files.forEach(file => {
        // Проверяем тип файла
        const fileType = getFileType(file);
        if (!fileType) {
            showNotification(`Файл "${file.name}" не поддерживается`, 'warning');
            return;
        }
        
        // Читаем превью для изображений
        const reader = new FileReader();
        
        uploadedFiles.push({
            file: file,
            type: fileType,
            preview: null,
            size: formatFileSize(file.size)
        });
        
        if (fileType === 'image') {
            reader.onload = function(e) {
                const fileIndex = uploadedFiles.findIndex(f => f.file === file);
                if (fileIndex > -1) {
                    uploadedFiles[fileIndex].preview = e.target.result;
                    updateFilePreviews();
                }
            };
            reader.readAsDataURL(file);
        } else {
            updateFilePreviews();
        }
    });
    
    // Автоматически выбираем категорию по типу первого файла
    if (uploadedFiles.length === 1) {
        const fileType = uploadedFiles[0].type;
        const categoryMap = {
            'template': 'work_templates',
            'criteria': 'criteria',
            'task': 'tasks_bank',
            'document': 'methodical',
            'image': 'subject_resources'
        };
        
        if (categoryMap[fileType]) {
            document.getElementById('materialCategory').value = categoryMap[fileType];
        }
    }
}

// Определение типа файла по расширению
function getFileType(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    
    // Шаблоны
    if (['json', 'template'].includes(extension)) {
        // Пытаемся определить подтип по содержимому имени
        if (file.name.toLowerCase().includes('template') || 
            file.name.toLowerCase().includes('шаблон')) {
            return 'template';
        } else if (file.name.toLowerCase().includes('criteria') ||
                  file.name.toLowerCase().includes('критерии')) {
            return 'criteria';
        } else if (file.name.toLowerCase().includes('task') ||
                  file.name.toLowerCase().includes('задание')) {
            return 'task';
        }
        return 'template';
    }
    
    // Критерии
    if (['criteria'].includes(extension)) {
        return 'criteria';
    }
    
    // Задания
    if (['task'].includes(extension)) {
        return 'task';
    }
    
    // Документы
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md'].includes(extension)) {
        return 'document';
    }
    
    // Изображения
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp'].includes(extension)) {
        return 'image';
    }
    
    // Архивы
    if (['zip', 'rar', '7z'].includes(extension)) {
        return 'archive';
    }
    
    return null;
}

// Форматирование размера файла
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Обновление превью файлов
function updateFilePreviews() {
    const container = document.getElementById('filePreviews');
    if (!container) return;
    
    if (uploadedFiles.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = '<h5 style="margin-top: 20px;">Выбранные файлы:</h5>';
    
    uploadedFiles.forEach((fileData, index) => {
        const file = fileData.file;
        const icon = getFileIcon(fileData.type);
        
        const preview = document.createElement('div');
        preview.className = 'file-preview';
        preview.innerHTML = `
            <div class="file-icon">${icon}</div>
            <div class="file-info">
                <div><strong>${file.name}</strong></div>
                <div class="file-size">${fileData.size} · ${fileData.type}</div>
            </div>
            <button class="remove-file" onclick="removeUploadedFile(${index})" title="Удалить">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(preview);
    });
}

// Получение иконки для типа файла
function getFileIcon(fileType) {
    const icons = {
        'template': '📝',
        'criteria': '📊',
        'task': '🧩',
        'document': '📄',
        'image': '🖼️',
        'archive': '📦'
    };
    return icons[fileType] || '📎';
}

// Удаление файла из списка загрузки
function removeUploadedFile(index) {
    uploadedFiles.splice(index, 1);
    updateFilePreviews();
}

// Сохранение нового материала
function saveNewMaterial() {
    // Проверяем, какой способ добавления выбран
    const activeTab = document.querySelector('.form-tab.active').textContent;
    
    let materialData = {
        id: 'material_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        added: new Date().toISOString().split('T')[0],
        author: document.getElementById('materialAuthor').value || 'Не указан',
        license: document.getElementById('materialLicense').value,
        isPublic: document.getElementById('materialPublic').checked
    };
    
    if (activeTab.includes('Загрузка')) {
        // Способ 1: Загрузка файла
        if (uploadedFiles.length === 0) {
            showNotification('Выберите файл для загрузки!', 'error');
            return;
        }
        
        const category = document.getElementById('materialCategory').value;
        if (!category) {
            showNotification('Выберите категорию для материала!', 'error');
            return;
        }
        
        materialData.category = category;
        materialData.title = uploadedFiles[0].file.name.replace(/\.[^/.]+$/, ""); // Убираем расширение
        materialData.file = `uploads/${Date.now()}_${uploadedFiles[0].file.name}`;
        materialData.size = uploadedFiles[0].size;
        materialData.type = uploadedFiles[0].type;
        
    } else if (activeTab.includes('ссылка')) {
        // Способ 2: По ссылке
        const url = document.getElementById('resourceUrl').value;
        const title = document.getElementById('resourceTitle').value;
        
        if (!url || !title) {
            showNotification('Заполните URL и название ресурса!', 'error');
            return;
        }
        
        materialData.category = 'external_resources';
        materialData.title = title;
        materialData.url = url;
        materialData.resourceType = document.getElementById('resourceType').value;
        materialData.description = `Внешний ресурс: ${url}`;
        
    } else {
        // Способ 3: Вручную
        const title = document.getElementById('manualTitle').value;
        const category = document.getElementById('manualCategory').value;
        const subject = document.getElementById('manualSubject').value;
        
        if (!title || !category) {
            showNotification('Заполните название и категорию!', 'error');
            return;
        }
        
        materialData.category = category;
        materialData.title = title;
        materialData.subject = subject;
        materialData.complexity = document.getElementById('manualComplexity').value;
        materialData.grade = document.getElementById('manualGrade').value;
        materialData.description = document.getElementById('manualDescription').value;
        materialData.tags = document.getElementById('manualTags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);
    }
    
    // Добавляем материал в каталог
    libraryCatalog.categories[materialData.category].push(materialData);
    libraryCatalog.fileIndex[materialData.id] = materialData;
    
    // Обновляем метаданные
    updateCatalogMetadata();
    
    // Сохраняем в кеш
    saveLibraryCache();
    
    // Обновляем отображение
    calculatePagination();
    
    // Сбрасываем форму
    uploadedFiles = [];
    
    // Показываем уведомление
    showNotification(`Материал "${materialData.title}" успешно добавлен в библиотеку!`, 'success');
    
    // Закрываем модальное окно
    hideModal();
    
    // Показываем добавленный материал (переходим на его страницу)
    setTimeout(() => {
        // Если материал добавлен в текущую категорию, перезагружаем
        if (currentLibraryCategory === 'all' || currentLibraryCategory === materialData.category) {
            goToPage(1); // Возвращаемся на первую страницу
        } else {
            // Переключаемся на категорию материала
            selectCategory(materialData.category);
        }
        
        // Прокручиваем к началу сетки
        const grid = document.getElementById('materialsGrid');
        if (grid) {
            grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 500);
}

// ============================
// ОБНОВЛЕНИЕ ФУНКЦИЙ ЗАГРУЗКИ
// ============================

// Обновляем функцию loadLibraryContent
function loadLibraryContent() {
    // Инициализируем пагинацию
    initPagination();
    
    // Рассчитываем и отображаем материалы
    calculatePagination();
    
    // Обновляем счетчики
    updateMaterialCounts();
}

// Обновляем функцию updateMaterialCounts
function updateMaterialCounts() {
    // Обновляем счетчики в боковой панели
    Object.keys(libraryCatalog.categories).forEach(category => {
        const count = libraryCatalog.categories[category].length;
        const element = document.querySelector(`[data-category="${category}"] small`);
        
        if (element && count > 0) {
            const label = getCategoryLabel(category, count);
            element.textContent = `${count} ${label}`;
        }
    });
    
    // Обновляем общий счетчик
    const allCount = Object.values(libraryCatalog.categories)
        .reduce((sum, items) => sum + items.length, 0);
    const allElement = document.querySelector('[data-category="all"] small');
    if (allElement) {
        allElement.textContent = `${allCount} материалов`;
    }
}

// Обновляем функцию filterLibrary (поиск с пагинацией)
function filterLibrary(type) {
    // Просто меняем активную кнопку фильтра
    document.querySelectorAll('.search-filters .btn').forEach(btn => {
        btn.classList.remove('active-filter');
    });
    event.target.classList.add('active-filter');
    
    // Здесь можно добавить дополнительную фильтрацию
    // Например, фильтр по типу материала
    calculatePagination();
}

// Инициализируем все при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем библиотеку
    initLibrary();
    
    // Инициализируем пагинацию
    initPagination();
    
    // Обновляем информацию
    updateLibraryInfo();
    
    // Устанавливаем обработчики событий для поиска
    const searchInput = document.getElementById('librarySearch');
    if (searchInput) {
        searchInput.addEventListener('input', searchLibrary);
    }
    
    console.log('📚 Библиотека материалов с пагинацией инициализирована');
});

// Получение имени предмета по коду
function getSubjectName(subjectCode) {
    const subjects = {
        'mathematics': 'Математика',
        'russian': 'Русский язык',
        'literature': 'Литература',
        'physics': 'Физика',
        'chemistry': 'Химия',
        'biology': 'Биология',
        'history': 'История',
        'geography': 'География',
        'english': 'Английский язык',
        'informatics': 'Информатика',
        'world_around': 'Окружающий мир',
        'art': 'ИЗО',
        'music': 'Музыка',
        'technology': 'Технология',
        'pe': 'Физкультура',
        'all': 'Все предметы'
    };
    
    return subjects[subjectCode] || subjectCode;
}

// Модальное окно с большим размером
function showModalLarge(content) {
    showModal(content);
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.maxWidth = '800px';
        modalContent.style.width = '90%';
    }
}

// Получение превью для материала
function getMaterialPreview(material) {
    if (material.thumbnail) {
        return `<img src="${material.thumbnail}" alt="${material.title}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 5px; margin-bottom: 10px;">`;
    }
    
    const previews = {
        'work_templates': '📝',
        'criteria': '📊',
        'tasks_bank': '🧩',
        'methodical': '📚',
        'subject_resources': '🔬',
        'external_resources': '🌐'
    };
    
    return `<div style="font-size: 48px; text-align: center; margin: 20px 0;">${previews[material.category] || '📄'}</div>`;
}

// Быстрое добавление материала (контекстное меню)
function addToLibraryFromContext(materialType, data) {
    let materialData = {
        id: 'quick_' + Date.now(),
        title: 'Быстро добавленный материал',
        added: new Date().toISOString().split('T')[0],
        author: 'Пользователь',
        license: 'free',
        isPublic: true
    };
    
    switch (materialType) {
        case 'template':
            materialData.category = 'work_templates';
            materialData.title = data.title || 'Шаблон работы';
            materialData.subject = data.subject || 'all';
            materialData.grade = data.grade || '';
            materialData.description = 'Добавлено из текущей работы';
            break;
            
        case 'criteria':
            materialData.category = 'criteria';
            materialData.title = data.title || 'Критерии оценивания';
            materialData.subject = data.subject || 'all';
            materialData.description = 'Текущие критерии оценивания';
            break;
            
        case 'task':
            materialData.category = 'tasks_bank';
            materialData.title = data.title || 'Задание';
            materialData.subject = data.subject || 'all';
            materialData.complexity = data.complexity || 'all';
            materialData.description = data.description || 'Задание из работы';
            break;
    }
    
    // Добавляем в библиотеку
    libraryCatalog.categories[materialData.category].push(materialData);
    updateCatalogMetadata();
    saveLibraryCache();
    
    showNotification(`Материал добавлен в библиотеку!`, 'success');
}

// Экспорт выбранных материалов
function exportSelectedMaterials() {
    const selectedIds = Array.from(document.querySelectorAll('.material-select:checked'))
        .map(checkbox => checkbox.closest('.material-card').dataset.id);
    
    if (selectedIds.length === 0) {
        showNotification('Выберите материалы для экспорта!', 'warning');
        return;
    }
    
    const selectedMaterials = selectedIds.map(id => libraryCatalog.fileIndex[id]).filter(Boolean);
    
    const exportData = {
        meta: {
            exportedAt: new Date().toISOString(),
            count: selectedMaterials.length,
            version: libraryConfig.version
        },
        materials: selectedMaterials
    };
    
    // Создаем файл для скачивания
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showNotification(`Экспортировано ${selectedMaterials.length} материалов`, 'success');
}

// Импорт материалов в существующую библиотеку
function importToLibrary() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const importData = JSON.parse(event.target.result);
                
                if (!importData.materials || !Array.isArray(importData.materials)) {
                    throw new Error('Неверный формат файла импорта');
                }
                
                let importedCount = 0;
                let skippedCount = 0;
                
                importData.materials.forEach(material => {
                    // Проверяем, нет ли уже такого материала
                    const exists = libraryCatalog.categories[material.category]?.some(
                        m => m.id === material.id || m.title === material.title
                    );
                    
                    if (!exists) {
                        // Генерируем новый ID
                        material.id = 'imported_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                        
                        // Добавляем в соответствующую категорию
                        if (!libraryCatalog.categories[material.category]) {
                            libraryCatalog.categories[material.category] = [];
                        }
                        
                        libraryCatalog.categories[material.category].push(material);
                        libraryCatalog.fileIndex[material.id] = material;
                        importedCount++;
                    } else {
                        skippedCount++;
                    }
                });
                
                // Обновляем каталог
                updateCatalogMetadata();
                saveLibraryCache();
                calculatePagination();
                
                showNotification(
                    `Импорт завершен! Добавлено: ${importedCount}, пропущено (дубликаты): ${skippedCount}`,
                    'success'
                );
                
            } catch (error) {
                showNotification('Ошибка импорта: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

// ============================
// ПРОСМОТР И РАБОТА С МАТЕРИАЛАМИ
// ============================

let currentViewingMaterial = null;

// Открыть просмотр материала
function viewMaterial(materialId) {
    const material = libraryCatalog.fileIndex[materialId];
    if (!material) {
        showNotification('Материал не найден!', 'error');
        return;
    }
    
    currentViewingMaterial = material;
    
    // Загружаем контент в модальное окно
    const modalContent = document.getElementById('materialViewContent');
    if (!modalContent) return;
    
    modalContent.innerHTML = generateMaterialViewHTML(material);
    
    // Показываем модальное окно
    document.getElementById('materialViewModal').style.display = 'flex';
    
    // Загружаем дополнительную информацию если нужно
    loadMaterialPreview(material);
}

// Генерация HTML для просмотра материала
function generateMaterialViewHTML(material) {
    const iconMap = {
        'work_templates': '📝',
        'criteria': '📊',
        'tasks_bank': '🧩',
        'methodical': '📚',
        'subject_resources': '🔬',
        'external_resources': '🌐'
    };
    
    const icon = iconMap[material.category] || '📄';
    
    return `
        <div style="display: flex; gap: 30px; margin-bottom: 20px;">
            <!-- Левая колонка - основная информация -->
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                    <div style="font-size: 48px;">${icon}</div>
                    <div>
                        <h2 style="margin: 0; color: #2c3e50;">${material.title}</h2>
                        <div style="color: #7f8c8d;">
                            ${getCategoryName(material.category)} · 
                            ${getSubjectName(material.subject)} · 
                            ${material.grade ? material.grade + ' класс' : 'Все классы'}
                        </div>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h4 style="margin-top: 0; color: #2c3e50;">📝 Описание</h4>
                    <p style="margin: 0; line-height: 1.6;">${material.description || 'Описание отсутствует'}</p>
                </div>
                
                <div id="materialPreview" style="margin-bottom: 20px;">
                    <!-- Превью будет загружено отдельно -->
                </div>
                
                <!-- Детальная информация -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                    ${material.size ? `
                        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                            <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 5px;">Размер</div>
                            <div style="font-weight: bold; color: #2c3e50;">${material.size}</div>
                        </div>
                    ` : ''}
                    
                    ${material.complexity && material.complexity !== 'all' ? `
                        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                            <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 5px;">Сложность</div>
                            <div style="font-weight: bold; color: #2c3e50;">
                                Уровень ${material.complexity} - ${getComplexityName(material.complexity)}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${material.taskCount ? `
                        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                            <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 5px;">Заданий</div>
                            <div style="font-weight: bold; color: #2c3e50;">${material.taskCount}</div>
                        </div>
                    ` : ''}
                    
                    <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                        <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 5px;">Добавлен</div>
                        <div style="font-weight: bold; color: #2c3e50;">${formatDate(material.added)}</div>
                    </div>
                </div>
            </div>
            
            <!-- Правая колонка - метаданные и действия -->
            <div style="width: 300px;">
                <!-- Метаданные -->
                <div style="background: #e8f4fc; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h4 style="margin-top: 0; color: #2c3e50;">📋 Метаданные</h4>
                    
                    <div style="margin-bottom: 10px;">
                        <div style="font-size: 12px; color: #7f8c8d;">Автор</div>
                        <div>${material.author || 'Не указан'}</div>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <div style="font-size: 12px; color: #7f8c8d;">Лицензия</div>
                        <div>${getLicenseName(material.license)}</div>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <div style="font-size: 12px; color: #7f8c8d;">Доступ</div>
                        <div>${material.isPublic ? '🔓 Общедоступный' : '🔒 Только для меня'}</div>
                    </div>
                    
                    ${material.file ? `
                        <div style="margin-bottom: 10px;">
                            <div style="font-size: 12px; color: #7f8c8d;">Файл</div>
                            <div style="word-break: break-all;">${material.file}</div>
                        </div>
                    ` : ''}
                    
                    ${material.url ? `
                        <div style="margin-bottom: 10px;">
                            <div style="font-size: 12px; color: #7f8c8d;">Ссылка</div>
                            <a href="${material.url}" target="_blank" style="color: #3498db; word-break: break-all;">
                                ${material.url}
                            </a>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Теги -->
                ${material.tags && material.tags.length > 0 ? `
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h4 style="margin-top: 0; color: #2c3e50;">🏷️ Теги</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                            ${material.tags.map(tag => `
                                <span style="background: #e9ecef; color: #495057; padding: 5px 10px; border-radius: 15px; font-size: 12px;">
                                    ${tag}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Быстрые действия -->
                <div style="background: white; padding: 20px; border-radius: 10px; border: 2px solid #3498db;">
                    <h4 style="margin-top: 0; color: #2c3e50;">⚡ Быстрые действия</h4>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <button class="btn btn-primary" onclick="useMaterialFromView('${material.id}')" style="width: 100%;">
                            <i class="fas fa-play"></i> Использовать сейчас
                        </button>
                        
                        ${material.file ? `
                            <button class="btn btn-outline" onclick="downloadMaterial('${material.id}')" style="width: 100%;">
                                <i class="fas fa-download"></i> Скачать файл
                            </button>
                        ` : ''}
                        
                        ${material.url ? `
                            <button class="btn btn-outline" onclick="window.open('${material.url}', '_blank')" style="width: 100%;">
                                <i class="fas fa-external-link-alt"></i> Открыть в браузере
                            </button>
                        ` : ''}
                        
                        <button class="btn btn-outline" onclick="duplicateMaterial('${material.id}')" style="width: 100%;">
                            <i class="fas fa-copy"></i> Создать копию
                        </button>
                        
                        <button class="btn btn-outline" onclick="shareMaterial('${material.id}')" style="width: 100%;">
                            <i class="fas fa-share-alt"></i> Поделиться
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Дополнительные вкладки -->
        <div class="material-tabs" style="margin-top: 30px;">
            <div style="display: flex; border-bottom: 2px solid #e9ecef; margin-bottom: 20px;">
                <button class="material-tab-btn active" onclick="switchMaterialTab('content', '${material.id}')">📄 Содержание</button>
                <button class="material-tab-btn" onclick="switchMaterialTab('usage', '${material.id}')">📊 Использование</button>
                <button class="material-tab-btn" onclick="switchMaterialTab('related', '${material.id}')">🔗 Похожие</button>
                <button class="material-tab-btn" onclick="switchMaterialTab('info', '${material.id}')">ℹ️ Тех. информация</button>
            </div>
            
            <div id="materialTabContent">
                <!-- Контент вкладок будет загружен динамически -->
            </div>
        </div>
    `;
}

// Загрузка превью материала
function loadMaterialPreview(material) {
    const previewContainer = document.getElementById('materialPreview');
    if (!previewContainer) return;
    
    // Очищаем контейнер
    previewContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #7f8c8d;">Загрузка превью...</div>';
    
    setTimeout(() => {
        if (material.file) {
            const extension = material.file.split('.').pop().toLowerCase();
            
            if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) {
                // Превью изображения
                previewContainer.innerHTML = `
                    <h4 style="color: #2c3e50; margin-bottom: 10px;">🖼️ Превью</h4>
                    <div style="text-align: center;">
                        <img src="${material.file}" alt="Превью" 
                             style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.1);">
                    </div>
                `;
            } else if (extension === 'pdf') {
                // Превью PDF
                previewContainer.innerHTML = `
                    <h4 style="color: #2c3e50; margin-bottom: 10px;">📄 PDF документ</h4>
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 15px;">📄</div>
                        <div>PDF документ: ${material.file.split('/').pop()}</div>
                        <div style="margin-top: 10px;">
                            <button class="btn btn-primary" onclick="window.open('${material.file}', '_blank')">
                                <i class="fas fa-external-link-alt"></i> Открыть PDF
                            </button>
                        </div>
                    </div>
                `;
            } else if (['doc', 'docx'].includes(extension)) {
                // Документ Word
                previewContainer.innerHTML = `
                    <h4 style="color: #2c3e50; margin-bottom: 10px;">📝 Документ Word</h4>
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 15px;">📝</div>
                        <div>Документ Microsoft Word</div>
                        <div style="margin-top: 10px;">
                            <button class="btn btn-primary" onclick="downloadMaterial('${material.id}')">
                                <i class="fas fa-download"></i> Скачать
                            </button>
                        </div>
                    </div>
                `;
            } else if (extension === 'json') {
                // JSON файл - показываем содержимое
                previewContainer.innerHTML = `
                    <h4 style="color: #2c3e50; margin-bottom: 10px;">📊 Структура данных</h4>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 12px;">
                        <div>JSON файл: ${material.file.split('/').pop()}</div>
                        <div style="margin-top: 10px; color: #7f8c8d;">
                            Нажмите "Использовать" чтобы применить этот шаблон
                        </div>
                    </div>
                `;
            } else {
                // Общий превью для других типов файлов
                previewContainer.innerHTML = `
                    <h4 style="color: #2c3e50; margin-bottom: 10px;">📎 Файл</h4>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 15px;">${getFileIcon(material.type)}</div>
                        <div>${material.file.split('/').pop()}</div>
                        <div style="color: #7f8c8d; margin-top: 5px;">${material.size}</div>
                    </div>
                `;
            }
        } else if (material.url) {
            // Ссылка на внешний ресурс
            previewContainer.innerHTML = `
                <h4 style="color: #2c3e50; margin-bottom: 10px;">🔗 Внешний ресурс</h4>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <div style="font-size: 24px;">🌐</div>
                        <div>
                            <div><strong>${material.resourceType ? getResourceTypeName(material.resourceType) : 'Веб-ресурс'}</strong></div>
                            <a href="${material.url}" target="_blank" style="color: #3498db; word-break: break-all;">
                                ${material.url}
                            </a>
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="window.open('${material.url}', '_blank')" style="width: 100%;">
                        <i class="fas fa-external-link-alt"></i> Перейти к ресурсу
                    </button>
                </div>
            `;
        } else {
            // Материал без файла
            previewContainer.innerHTML = `
                <h4 style="color: #2c3e50; margin-bottom: 10px;">📋 Ручной материал</h4>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 15px;">✍️</div>
                    <div>Материал создан вручную</div>
                    <div style="color: #7f8c8d; margin-top: 5px;">Используйте кнопки ниже для работы с ним</div>
                </div>
            `;
        }
        
        // Загружаем контент первой вкладки
        loadMaterialTabContent('content', material);
    }, 300);
}

// Загрузка контента вкладки
function loadMaterialTabContent(tabName, material) {
    const tabContent = document.getElementById('materialTabContent');
    if (!tabContent) return;
    
    switch (tabName) {
        case 'content':
            loadContentTab(material, tabContent);
            break;
        case 'usage':
            loadUsageTab(material, tabContent);
            break;
        case 'related':
            loadRelatedTab(material, tabContent);
            break;
        case 'info':
            loadInfoTab(material, tabContent);
            break;
    }
}

// Вкладка "Содержание"
function loadContentTab(material, container) {
    let content = '';
    
    if (material.category === 'tasks_bank' && material.taskCount) {
        content = `
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
                <h4 style="margin-top: 0;">🧩 Содержание заданий (${material.taskCount})</h4>
                <div style="max-height: 200px; overflow-y: auto;">
                    ${generateTaskList(material)}
                </div>
            </div>
        `;
    } else if (material.file && material.file.endsWith('.json')) {
        content = `
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
                <h4 style="margin-top: 0;">📊 Структура данных</h4>
                <pre style="background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 12px;">
${JSON.stringify(getMaterialStructure(material), null, 2)}
                </pre>
            </div>
        `;
    } else {
        content = `
            <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                <div style="font-size: 48px; margin-bottom: 15px;">📄</div>
                <div>Откройте файл для просмотра содержимого</div>
                ${material.file ? `
                    <button class="btn btn-primary" onclick="openMaterialFile('${material.id}')" style="margin-top: 15px;">
                        <i class="fas fa-external-link-alt"></i> Открыть файл
                    </button>
                ` : ''}
            </div>
        `;
    }
    
    container.innerHTML = content;
}

// Вкладка "Использование"
function loadUsageTab(material, container) {
    const usageStats = getMaterialUsageStats(material.id);
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 10px;">📊</div>
                <div style="font-size: 12px; color: #7f8c8d;">Использований</div>
                <div style="font-size: 24px; font-weight: bold; color: #2c3e50;">${usageStats.totalUses || 0}</div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 10px;">👥</div>
                <div style="font-size: 12px; color: #7f8c8d;">Пользователей</div>
                <div style="font-size: 24px; font-weight: bold; color: #2c3e50;">${usageStats.uniqueUsers || 1}</div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 10px;">⭐</div>
                <div style="font-size: 12px; color: #7f8c8d;">Рейтинг</div>
                <div style="font-size: 24px; font-weight: bold; color: #f39c12;">${usageStats.rating || '—'}</div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 10px;">📅</div>
                <div style="font-size: 12px; color: #7f8c8d;">Последнее</div>
                <div style="font-size: 14px; color: #2c3e50;">${usageStats.lastUsed || 'Никогда'}</div>
            </div>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
            <h4 style="margin-top: 0;">📈 История использования</h4>
            ${usageStats.history && usageStats.history.length > 0 ? `
                <div style="max-height: 200px; overflow-y: auto;">
                    <table style="width: 100%; font-size: 14px;">
                        <thead>
                            <tr>
                                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e9ecef;">Дата</th>
                                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e9ecef;">Действие</th>
                                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e9ecef;">Пользователь</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${usageStats.history.map(record => `
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #f8f9fa;">${formatDate(record.date)}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #f8f9fa;">${record.action}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #f8f9fa;">${record.user || 'Вы'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div style="text-align: center; padding: 20px; color: #7f8c8d;">
                    <div style="font-size: 48px; margin-bottom: 15px;">📊</div>
                    <div>Еще никто не использовал этот материал</div>
                    <div style="color: #95a5a6; margin-top: 5px;">Будьте первым!</div>
                </div>
            `}
        </div>
    `;
}

// Вкладка "Похожие"
function loadRelatedTab(material, container) {
    const relatedMaterials = findRelatedMaterials(material);
    
    container.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
            <h4 style="margin-top: 0;">🔗 Похожие материалы</h4>
            
            ${relatedMaterials.length > 0 ? `
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">
                    ${relatedMaterials.slice(0, 4).map(related => `
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; cursor: pointer;" 
                             onclick="viewMaterial('${related.id}')">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                <div style="font-size: 20px;">${getCategoryIcon(related.category)}</div>
                                <div style="font-weight: bold; color: #2c3e50;">${related.title}</div>
                            </div>
                            <div style="font-size: 12px; color: #7f8c8d;">
                                ${getSubjectName(related.subject)} · 
                                ${related.grade ? related.grade + ' класс' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div style="text-align: center; padding: 20px; color: #7f8c8d;">
                    <div style="font-size: 48px; margin-bottom: 15px;">🔍</div>
                    <div>Похожие материалы не найдены</div>
                </div>
            `}
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                <h5 style="margin-top: 0;">🎯 Поиск похожих</h5>
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="searchSimilar" class="form-input" 
                           placeholder="Введите ключевые слова..." style="flex: 1;">
                    <button class="btn btn-primary" onclick="searchSimilarMaterials('${material.id}')">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Вкладка "Тех. информация"
function loadInfoTab(material, container) {
    container.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
            <h4 style="margin-top: 0;">ℹ️ Техническая информация</h4>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <div>
                    <h5 style="color: #2c3e50; margin-bottom: 10px;">📋 Основные данные</h5>
                    <table style="width: 100%; font-size: 14px;">
                        <tr>
                            <td style="padding: 8px; color: #7f8c8d;">ID материала:</td>
                            <td style="padding: 8px; font-family: monospace;">${material.id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; color: #7f8c8d;">Категория:</td>
                            <td style="padding: 8px;">${getCategoryName(material.category)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; color: #7f8c8d;">Версия:</td>
                            <td style="padding: 8px;">${material.version || '1.0'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; color: #7f8c8d;">Создан:</td>
                            <td style="padding: 8px;">${formatDateTime(material.added)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; color: #7f8c8d;">Изменен:</td>
                            <td style="padding: 8px;">${material.modified ? formatDateTime(material.modified) : 'Не изменялся'}</td>
                        </tr>
                    </table>
                </div>
                
                <div>
                    <h5 style="color: #2c3e50; margin-bottom: 10px;">🔧 Системная информация</h5>
                    <table style="width: 100%; font-size: 14px;">
                        <tr>
                            <td style="padding: 8px; color: #7f8c8d;">В каталоге:</td>
                            <td style="padding: 8px;">${material.category}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; color: #7f8c8d;">Индекс в каталоге:</td>
                            <td style="padding: 8px;">${libraryCatalog.categories[material.category]?.indexOf(material) + 1 || '—'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; color: #7f8c8d;">Статус:</td>
                            <td style="padding: 8px;">
                                <span style="color: ${material.isPublic ? '#27ae60' : '#e74c3c'};">
                                    ${material.isPublic ? '✅ Опубликован' : '🔒 Черновик'}
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; color: #7f8c8d;">Проверен:</td>
                            <td style="padding: 8px;">
                                ${material.verified ? '✅ Проверен' : '⚠️ Не проверен'}
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                <h5 style="color: #2c3e50; margin-bottom: 10px;">🛠️ Действия</h5>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn btn-sm btn-outline" onclick="validateMaterial('${material.id}')">
                        <i class="fas fa-check-circle"></i> Проверить
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="exportMaterialJSON('${material.id}')">
                        <i class="fas fa-code"></i> Экспорт JSON
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="showMaterialRaw('${material.id}')">
                        <i class="fas fa-eye"></i> Исходные данные
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMaterialPermanently('${material.id}')">
                        <i class="fas fa-trash"></i> Удалить навсегда
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Переключение вкладок материала
function switchMaterialTab(tabName, materialId) {
    // Обновляем активную кнопку
    document.querySelectorAll('.material-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Загружаем контент вкладки
    const material = libraryCatalog.fileIndex[materialId];
    if (material) {
        loadMaterialTabContent(tabName, material);
    }
}

// Закрыть просмотр материала
function closeMaterialView() {
    document.getElementById('materialViewModal').style.display = 'none';
    currentViewingMaterial = null;
}

// Использовать материал из просмотра
function useMaterialFromView(materialId) {
    const material = libraryCatalog.fileIndex[materialId];
    if (!material) return;
    
    closeMaterialView();
    
    // В зависимости от типа материала, используем по-разному
    switch (material.category) {
        case 'work_templates':
            useWorkTemplate(material);
            break;
        case 'criteria':
            useCriteriaTemplate(material);
            break;
        case 'tasks_bank':
            useTasksBank(material);
            break;
        default:
            quickUseMaterial(materialId);
    }
}

// Быстрое использование (без открытия просмотра)
function quickUseMaterial(materialId) {
    const material = libraryCatalog.fileIndex[materialId];
    if (!material) return;
    
    showNotification(`Материал "${material.title}" применяется...`, 'info');
    
    // Регистрируем использование
    registerMaterialUsage(materialId, 'quick_use');
    
    // В зависимости от категории
    switch (material.category) {
        case 'work_templates':
            setTimeout(() => {
                showNotification(`Шаблон "${material.title}" загружен!`, 'success');
                // Здесь можно добавить логику применения шаблона
            }, 1000);
            break;
            
        case 'criteria':
            setTimeout(() => {
                showNotification(`Критерии "${material.title}" применены!`, 'success');
                // Здесь можно добавить логику применения критериев
            }, 1000);
            break;
            
        case 'tasks_bank':
            setTimeout(() => {
                showNotification(`Задания "${material.title}" добавлены в работу!`, 'success');
                // Здесь можно добавить логику добавления заданий
            }, 1000);
            break;
            
        default:
            setTimeout(() => {
                showNotification(`Материал "${material.title}" использован!`, 'success');
            }, 1000);
    }
}

// Открыть файл материала
function openMaterialFile(materialId) {
    const material = libraryCatalog.fileIndex[materialId];
    if (!material || !material.file) return;
    
    // В зависимости от типа файла открываем по-разному
    const extension = material.file.split('.').pop().toLowerCase();
    
    if (['pdf', 'jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
        // Открываем в новой вкладке
        window.open(material.file, '_blank');
    } else if (extension === 'json') {
        // Показываем содержимое JSON
        showJSONContent(material);
    } else {
        // Предлагаем скачать
        downloadMaterial(materialId);
    }
}

// Показать содержимое JSON
function showJSONContent(material) {
    showModal(`
        <h3>📊 Содержимое файла: ${material.file?.split('/').pop() || material.title}</h3>
        <div style="max-height: 500px; overflow-y: auto; background: #f8f9fa; padding: 15px; border-radius: 5px;">
            <pre style="margin: 0; font-family: monospace; font-size: 12px;">
${JSON.stringify(getMaterialContent(material), null, 2)}
            </pre>
        </div>
        <div class="modal-actions" style="margin-top: 15px;">
            <button class="btn" onclick="hideModal()">Закрыть</button>
            <button class="btn btn-primary" onclick="useMaterialContent('${material.id}')">
                Использовать эти данные
            </button>
        </div>
    `, 'modal-lg');
}

// Скачать материал
function downloadMaterial(materialId) {
    const material = libraryCatalog.fileIndex[materialId];
    if (!material) return;
    
    if (material.file) {
        // Создаем ссылку для скачивания
        const link = document.createElement('a');
        link.href = material.file;
        link.download = material.file.split('/').pop();
        link.click();
        
        showNotification(`Файл "${material.file.split('/').pop()}" скачивается...`, 'info');
    } else if (material.url) {
        // Открываем ссылку
        window.open(material.url, '_blank');
    } else {
        // Экспортируем JSON с данными материала
        exportMaterialAsJSON(material);
    }
    
    // Регистрируем использование
    registerMaterialUsage(materialId, 'download');
}

// Экспорт материала как JSON
function exportMaterialAsJSON(material) {
    const exportData = {
        material: material,
        exportedAt: new Date().toISOString(),
        system: 'Анализ образовательных результатов',
        version: libraryConfig.version
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${material.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showNotification(`Материал экспортирован как JSON`, 'success');
}

// Редактировать материал
function editCurrentMaterial() {
    if (!currentViewingMaterial) return;
    
    closeMaterialView();
    
    // Показываем форму редактирования
    showEditMaterialForm(currentViewingMaterial.id);
}

// Удалить материал
function deleteCurrentMaterial() {
    if (!currentViewingMaterial) return;
    
    if (confirm(`Вы уверены, что хотите удалить материал "${currentViewingMaterial.title}"?`)) {
        deleteMaterial(currentViewingMaterial.id);
        closeMaterialView();
    }
}

// ============================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================

// Получение имени категории
function getCategoryName(category) {
    const names = {
        'work_templates': 'Шаблоны работ',
        'criteria': 'Критерии оценивания',
        'tasks_bank': 'Банк заданий',
        'methodical': 'Методические материалы',
        'subject_resources': 'Ресурсы по предметам',
        'external_resources': 'Полезные ресурсы'
    };
    return names[category] || category;
}

// Получение иконки категории
function getCategoryIcon(category) {
    const icons = {
        'work_templates': '📝',
        'criteria': '📊',
        'tasks_bank': '🧩',
        'methodical': '📚',
        'subject_resources': '🔬',
        'external_resources': '🌐'
    };
    return icons[category] || '📄';
}

// Получение имени уровня сложности
function getComplexityName(level) {
    const names = {
        '1': 'Базовый',
        '2': 'Применение',
        '3': 'Анализ',
        '4': 'Творчество'
    };
    return names[level] || level;
}

// Получение имени лицензии
function getLicenseName(license) {
    const names = {
        'free': 'Свободное использование',
        'cc-by': 'Creative Commons (CC BY)',
        'cc-by-sa': 'CC BY-SA',
        'cc-by-nc': 'CC BY-NC',
        'copyright': 'Авторское право',
        'unknown': 'Не указано'
    };
    return names[license] || license;
}

// Получение имени типа ресурса
function getResourceTypeName(type) {
    const names = {
        'website': 'Веб-сайт',
        'video': 'Видео',
        'document': 'Документ',
        'presentation': 'Презентация',
        'interactive': 'Интерактивное задание'
    };
    return names[type] || type;
}

// Форматирование даты
function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

// Форматирование даты и времени
function formatDateTime(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
}

// Генерация списка заданий
function generateTaskList(material) {
    // Для демонстрации создаем фиктивные задания
    const tasks = [];
    const count = Math.min(material.taskCount || 5, 10);
    
    for (let i = 1; i <= count; i++) {
        tasks.push(`Задание ${i}: Пример задания по теме`);
    }
    
    return tasks.map(task => `
        <div style="padding: 8px; border-bottom: 1px solid #e9ecef; display: flex; align-items: center; gap: 10px;">
            <span style="color: #3498db;">${i}</span>
            <span>${task}</span>
        </div>
    `).join('');
}

// Получение структуры материала
function getMaterialStructure(material) {
    return {
        title: material.title,
        category: material.category,
        subject: material.subject,
        grade: material.grade,
        complexity: material.complexity,
        size: material.size,
        hasFile: !!material.file,
        hasUrl: !!material.url,
        tags: material.tags || [],
        metadata: {
            author: material.author,
            license: material.license,
            isPublic: material.isPublic
        }
    };
}

// Получение содержимого материала
function getMaterialContent(material) {
    // Здесь можно добавить реальную загрузку содержимого файла
    return {
        info: "Содержимое файла будет загружено при необходимости",
        material: getMaterialStructure(material),
        note: "Для реальных файлов здесь будет их содержимое"
    };
}

// Регистрация использования материала
function registerMaterialUsage(materialId, action) {
    const usageKey = 'material_usage_' + materialId;
    let usage = JSON.parse(localStorage.getItem(usageKey)) || {
        totalUses: 0,
        lastUsed: new Date().toISOString(),
        history: []
    };
    
    usage.totalUses++;
    usage.lastUsed = new Date().toISOString();
    usage.history.unshift({
        date: new Date().toISOString(),
        action: action,
        user: 'current'
    });
    
    // Ограничиваем историю 50 записями
    if (usage.history.length > 50) {
        usage.history = usage.history.slice(0, 50);
    }
    
    localStorage.setItem(usageKey, JSON.stringify(usage));
}

// Получение статистики использования
function getMaterialUsageStats(materialId) {
    const usageKey = 'material_usage_' + materialId;
    const usage = JSON.parse(localStorage.getItem(usageKey)) || {
        totalUses: 0,
        lastUsed: null,
        history: []
    };
    
    return {
        totalUses: usage.totalUses,
        uniqueUsers: new Set(usage.history.map(h => h.user)).size,
        rating: usage.totalUses > 10 ? '4.5' : '—',
        lastUsed: usage.lastUsed ? formatDate(usage.lastUsed) : 'Никогда',
        history: usage.history
    };
}

// Поиск похожих материалов
function findRelatedMaterials(material) {
    const related = [];
    
    Object.keys(libraryCatalog.categories).forEach(category => {
        libraryCatalog.categories[category].forEach(item => {
            if (item.id === material.id) return; // Пропускаем сам материал
            
            let score = 0;
            
            // Совпадение категории
            if (item.category === material.category) score += 3;
            
            // Совпадение предмета
            if (item.subject === material.subject) score += 2;
            
            // Совпадение класса
            if (item.grade === material.grade) score += 1;
            
            // Совпадение тегов
            if (item.tags && material.tags) {
                const commonTags = item.tags.filter(tag => material.tags.includes(tag));
                score += commonTags.length;
            }
            
            if (score > 2) {
                related.push({ ...item, relevance: score });
            }
        });
    });
    
    // Сортируем по релевантности
    return related.sort((a, b) => b.relevance - a.relevance);
}

// Поиск похожих материалов по запросу
function searchSimilarMaterials(materialId) {
    const material = libraryCatalog.fileIndex[materialId];
    const query = document.getElementById('searchSimilar').value;
    
    if (!query) return;
    
    // Ищем материалы с похожими ключевыми словами
    const results = findRelatedMaterials(material).filter(item => {
        const searchText = (item.title + ' ' + (item.description || '') + ' ' + (item.tags?.join(' ') || '')).toLowerCase();
        return searchText.includes(query.toLowerCase());
    });
    
    if (results.length > 0) {
        // Обновляем вкладку с результатами
        const container = document.getElementById('materialTabContent');
        if (container) {
            container.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
                    <h4 style="margin-top: 0;">🔍 Результаты поиска: "${query}"</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">
                        ${results.slice(0, 6).map(item => `
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; cursor: pointer;" 
                                 onclick="viewMaterial('${item.id}')">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                    <div style="font-size: 20px;">${getCategoryIcon(item.category)}</div>
                                    <div style="font-weight: bold; color: #2c3e50;">${item.title}</div>
                                </div>
                                <div style="font-size: 12px; color: #7f8c8d;">
                                    ${getSubjectName(item.subject)} · 
                                    ${item.grade ? item.grade + ' класс' : ''}
                                </div>
                                <div style="margin-top: 5px; font-size: 11px; color: #95a5a6;">
                                    Релевантность: ${item.relevance}/5
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    } else {
        showNotification('Похожие материалы не найдены', 'info');
    }
}
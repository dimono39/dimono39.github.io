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
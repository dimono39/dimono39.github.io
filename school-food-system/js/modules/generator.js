import { MEAL_STRUCTURE, SEASONAL_PRODUCTS, MEAL_NORMS } from '../core/constants.js';
import { getState, setState } from '../core/state-manager.js';
import { formatDate, escapeHtml, formatFileSize, showToast, deepClone, checkSeasonality } from '../core/utils.js';

let calendarData = null;
let templateMenuData = null;
let dailyMenus = [];
let currentMenuIndex = 0;
let isGridView = true;
let nutritionChart = null;

// HTML шаблон генератора
export async function renderGenerator(container) {
    container.innerHTML = `
        <div class="generator-module">
            <div class="app-container">
                <!-- Левая колонка -->
                <div class="card">
                    <h2 class="card-title"><i class="fas fa-upload"></i> Загрузка файлов ФЦМПО</h2>
                    
                    <div id="statusMessage" class="status-message"></div>
                    
                    <div class="file-upload-area" id="dropArea">
                        <i class="fas fa-file-excel floating"></i>
                        <h3>Перетащите файлы Excel ФЦМПО сюда</h3>
                        <p>или нажмите для выбора файлов</p>
                        <p class="file-size" style="margin-top: 10px;">Требуемые файлы: kp2026.xlsx (календарь), tm2026-sm.xlsx (типовое меню)</p>
                        <input type="file" id="fileInput" class="file-input" multiple accept=".xlsx,.xls">
                    </div>
                    
                    <div class="file-list" id="fileList"></div>
                    
                    <div class="stored-data-info" id="storedDataInfo">
                        <h3><i class="fas fa-database"></i> Данные в памяти</h3>
                        <p id="storedDataText"></p>
                        <div class="buttons-container">
                            <button id="loadFromStorageBtn" class="btn btn-secondary">
                                <i class="fas fa-download"></i> Загрузить из памяти
                            </button>
                            <button id="clearStorageBtn" class="btn btn-warning">
                                <i class="fas fa-trash"></i> Очистить память
                            </button>
                        </div>
                    </div>
                    
                    <div class="config-section">
                        <h2 class="card-title"><i class="fas fa-cog"></i> Настройки генерации</h2>
                        
                        <div class="year-selector">
                            <div class="year-badge" id="calendarYear">2026</div>
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fas fa-calendar-alt"></i> Начальная дата</label>
                            <input type="date" id="startDate" value="2026-01-01">
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fas fa-calendar-alt"></i> Конечная дата</label>
                            <input type="date" id="endDate" value="2026-01-31">
                        </div>
                        
                        <div class="buttons-container">
                            <button id="generateBtn" class="btn btn-primary" disabled>
                                <i class="fas fa-magic"></i> Создать ежедневные меню
                            </button>
                            <button id="analyzeBtn" class="btn btn-info">
                                <i class="fas fa-chart-line"></i> Аналитика
                            </button>
                            <button id="searchBtn" class="btn btn-secondary">
                                <i class="fas fa-search"></i> Поиск блюд
                            </button>
                        </div>
                        
                        <div class="export-options" style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
                            <button id="exportAllBtn" class="btn btn-success" disabled>
                                <i class="fas fa-download"></i> Экспорт всех меню (ZIP)
                            </button>
                            <button id="exportCurrentBtn" class="btn btn-secondary" disabled>
                                <i class="fas fa-file-excel"></i> Экспорт текущего
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Правая колонка -->
                <div class="card">
                    <h2 class="card-title"><i class="fas fa-eye"></i> Предпросмотр данных</h2>
                    
                    <div class="data-preview" id="calendarPreview">
                        <div class="preview-title">Календарь питания</div>
                        <div id="calendarData">Загрузите файл календаря</div>
                    </div>
                    
                    <div class="data-preview" id="menuPreview">
                        <div class="preview-title">Типовое меню</div>
                        <div id="menuData">Загрузите файл типового меню</div>
                    </div>
                </div>
            </div>
            
            <!-- Результаты генерации -->
            <div class="daily-menu" id="dailyMenuContainer">
                <div class="menu-navigation" id="menuNavigation" style="display: none;">
                    <div class="nav-buttons">
                        <button id="prevMenuBtn" class="btn btn-secondary">
                            <i class="fas fa-chevron-left"></i> Предыдущее
                        </button>
                        <button id="nextMenuBtn" class="btn btn-secondary">
                            Следующее <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div class="menu-counter" id="menuCounter"></div>
                </div>
                
                <div id="menuGrid" class="menu-grid" style="display: none;"></div>
                
                <div id="dailyMenuContent">
                    <div style="text-align: center; color: #6c757d; padding: 60px;">
                        <i class="fas fa-clipboard-list fa-4x floating" style="margin-bottom: 30px;"></i>
                        <h3>Готовые ежедневные меню</h3>
                        <p>Загрузите файлы и нажмите "Создать ежедневные меню"</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Инициализация генератора
export function initGenerator() {
    const state = getState();
    calendarData = state.calendarData;
    templateMenuData = state.templateMenuData;
    dailyMenus = state.dailyMenus || [];
    
    attachGeneratorEvents();
    updateFileList();
    updateCalendarPreview();
    updateMenuPreview();
    updateUI();
    
    console.log('Generator module initialized');
}

function attachGeneratorEvents() {
    // Drag & Drop
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    
    if (dropArea) {
        dropArea.addEventListener('click', () => fileInput?.click());
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.classList.add('dragover');
        });
        dropArea.addEventListener('dragleave', () => dropArea.classList.remove('dragover'));
        dropArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropArea.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            await handleFiles(files);
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            await handleFiles(files);
        });
    }
    
    // Кнопки
    document.getElementById('generateBtn')?.addEventListener('click', generateDailyMenus);
    document.getElementById('analyzeBtn')?.addEventListener('click', showAnalytics);
    document.getElementById('searchBtn')?.addEventListener('click', showSearch);
    document.getElementById('exportAllBtn')?.addEventListener('click', exportAllMenus);
    document.getElementById('exportCurrentBtn')?.addEventListener('click', exportCurrentMenu);
    document.getElementById('loadFromStorageBtn')?.addEventListener('click', () => loadFromStorage());
    document.getElementById('clearStorageBtn')?.addEventListener('click', () => clearStorage());
    
    // Навигация
    document.getElementById('prevMenuBtn')?.addEventListener('click', () => navigateMenus(-1));
    document.getElementById('nextMenuBtn')?.addEventListener('click', () => navigateMenus(1));
}

async function handleFiles(files) {
    for (const file of files) {
        const fileName = file.name.toLowerCase();
        
        if (fileName.includes('kp') && fileName.match(/\d{4}/)) {
            await processCalendarFile(file);
        } else if (fileName.includes('tm') && fileName.includes('-sm')) {
            await processTemplateFile(file);
        } else {
            showToast(`Неизвестный тип файла: ${file.name}`, 'warning');
        }
    }
    
    updateUI();
}

async function processCalendarFile(file) {
    try {
        const data = await readExcelFile(file);
        // Парсинг календаря (логика из progen1.html)
        calendarData = parseCalendarData(data, file.name);
        setState({ calendarData });
        updateCalendarPreview();
        showToast(`Календарь загружен: ${file.name}`, 'success');
    } catch (error) {
        showToast(`Ошибка загрузки календаря: ${error.message}`, 'error');
    }
}

async function processTemplateFile(file) {
    try {
        const data = await readExcelFile(file);
        // Парсинг типового меню
        templateMenuData = parseTemplateData(data, file.name);
        setState({ templateMenuData });
        updateMenuPreview();
        showToast(`Типовое меню загружено: ${file.name}`, 'success');
    } catch (error) {
        showToast(`Ошибка загрузки меню: ${error.message}`, 'error');
    }
}

function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                resolve(json);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function parseCalendarData(data, fileName) {
    // Логика парсинга календаря из progen1.html
    // Возвращаем объект calendarData
    const calendar = {
        months: {},
        year: 2026,
        schoolName: ''
    };
    
    // ... (код парсинга из progen1.html)
    
    return calendar;
}

function parseTemplateData(data, fileName) {
    // Логика парсинга типового меню
    const template = {
        weeks: {},
        schoolName: '',
        ageCategory: ''
    };
    
    // ... (код парсинга из progen1.html)
    
    return template;
}

async function generateDailyMenus() {
    if (!calendarData || !templateMenuData) {
        showToast('Загрузите оба файла', 'warning');
        return;
    }
    
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    
    if (startDate > endDate) {
        showToast('Начальная дата не может быть позже конечной', 'error');
        return;
    }
    
    showToast('Генерация меню...', 'info');
    
    const menus = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const menu = generateMenuForDate(currentDate);
        if (menu) menus.push(menu);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    dailyMenus = menus;
    setState({ dailyMenus: menus });
    
    if (menus.length > 0) {
        showToast(`Сгенерировано ${menus.length} меню`, 'success');
        renderMenus();
    } else {
        showToast('Не удалось сгенерировать меню для выбранного периода', 'warning');
    }
}

function generateMenuForDate(date) {
    // Логика генерации меню на конкретную дату
    // Используем calendarData и templateMenuData
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    const monthNames = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 
                       'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
    const monthName = monthNames[month];
    
    const menuType = calendarData?.months?.[monthName]?.[day];
    if (!menuType) return null;
    
    // Вычисляем неделю и день в меню
    const maxDayNumber = getMaxDayNumber();
    const weekNum = Math.ceil(menuType / maxDayNumber);
    const dayNum = menuType - (weekNum - 1) * maxDayNumber;
    
    const templateDay = templateMenuData?.weeks?.[weekNum]?.[dayNum];
    if (!templateDay) return null;
    
    return {
        date: new Date(date),
        dateString: formatDate(date),
        menuType: menuType,
        weekNumber: weekNum,
        dayNumber: dayNum,
        ...deepClone(templateDay)
    };
}

function getMaxDayNumber() {
    if (!templateMenuData?.weeks) return 5;
    let max = 0;
    for (const week of Object.values(templateMenuData.weeks)) {
        const days = Object.keys(week).map(Number);
        max = Math.max(max, ...days);
    }
    return max || 5;
}

function renderMenus() {
    const menuGrid = document.getElementById('menuGrid');
    const navigation = document.getElementById('menuNavigation');
    
    if (!dailyMenus.length) {
        menuGrid.style.display = 'none';
        navigation.style.display = 'none';
        return;
    }
    
    menuGrid.style.display = 'grid';
    navigation.style.display = 'flex';
    
    let html = '';
    dailyMenus.forEach((menu, index) => {
        const breakfastCount = menu.breakfast?.items?.length || 0;
        const lunchCount = menu.lunch?.items?.length || 0;
        
        html += `
            <div class="menu-card" data-index="${index}" onclick="window.selectMenu && window.selectMenu(${index})">
                <div class="menu-card-header">
                    <div class="menu-card-date">${menu.dateString}</div>
                    <div class="menu-card-type">Меню ${menu.menuType}</div>
                </div>
                <div class="menu-card-content">
                    <div>Завтрак: ${breakfastCount} блюд</div>
                    <div>Обед: ${lunchCount} блюд</div>
                </div>
            </div>
        `;
    });
    
    menuGrid.innerHTML = html;
    
    // Обновляем счётчик
    document.getElementById('menuCounter').textContent = `1 из ${dailyMenus.length}`;
    
    // Делаем функции глобальными для onclick
    window.selectMenu = selectMenu;
}

function selectMenu(index) {
    currentMenuIndex = index;
    showMenuDetails();
}

function showMenuDetails() {
    const menu = dailyMenus[currentMenuIndex];
    if (!menu) return;
    
    // Показываем детали меню
    const menuGrid = document.getElementById('menuGrid');
    const detailsContainer = document.getElementById('dailyMenuContent');
    
    let html = `
        <div style="padding: 20px;">
            <h2>${menu.dateString} (Меню ${menu.menuType})</h2>
            
            <div class="section-title">🌅 Завтрак</div>
            ${renderMealItems(menu.breakfast?.items || [])}
            
            <div class="section-title">🍲 Обед</div>
            ${renderMealItems(menu.lunch?.items || [])}
            
            <div class="section-title">🌙 Ужин</div>
            ${renderMealItems(menu.dinner?.items || [])}
        </div>
    `;
    
    menuGrid.style.display = 'none';
    detailsContainer.innerHTML = html;
}

function renderMealItems(items) {
    if (!items.length) {
        return '<div style="color: #999;">Нет блюд</div>';
    }
    
    return `
        <table class="preview-table">
            <thead>
                <tr><th>Раздел</th><th>Блюдо</th><th>Вес, г</th><th>Ккал</th></tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${escapeHtml(item.section || '')}</td>
                        <td>${escapeHtml(item.name)}</td>
                        <td>${item.weight || 0}</td>
                        <td>${item.calories || 0}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function navigateMenus(direction) {
    if (!dailyMenus.length) return;
    currentMenuIndex = (currentMenuIndex + direction + dailyMenus.length) % dailyMenus.length;
    selectMenu(currentMenuIndex);
    document.getElementById('menuCounter').textContent = `${currentMenuIndex + 1} из ${dailyMenus.length}`;
}

function showAnalytics() {
    if (!dailyMenus.length) {
        showToast('Нет данных для анализа', 'warning');
        return;
    }
    
    let totalCalories = 0;
    let totalDishes = 0;
    const uniqueDishes = new Set();
    
    dailyMenus.forEach(menu => {
        ['breakfast', 'lunch', 'dinner'].forEach(meal => {
            (menu[meal]?.items || []).forEach(item => {
                totalCalories += item.calories || 0;
                totalDishes++;
                uniqueDishes.add(item.name);
            });
        });
    });
    
    const avgCalories = Math.round(totalCalories / dailyMenus.length);
    
    alert(`📊 Аналитика меню:
    
Всего меню: ${dailyMenus.length}
Всего блюд: ${totalDishes}
Уникальных блюд: ${uniqueDishes.size}
Средняя калорийность: ${avgCalories} ккал/день
`);
}

function showSearch() {
    if (!dailyMenus.length) {
        showToast('Нет меню для поиска', 'warning');
        return;
    }
    
    const searchTerm = prompt('Введите название блюда для поиска:');
    if (!searchTerm) return;
    
    const results = [];
    dailyMenus.forEach((menu, idx) => {
        ['breakfast', 'lunch', 'dinner'].forEach(meal => {
            (menu[meal]?.items || []).forEach(item => {
                if (item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                    results.push({ date: menu.dateString, meal, name: item.name, index: idx });
                }
            });
        });
    });
    
    if (results.length) {
        let message = `Найдено ${results.length} совпадений:\n\n`;
        results.forEach(r => {
            message += `${r.date} - ${r.meal}: ${r.name}\n`;
        });
        alert(message);
        
        // Предлагаем перейти к первому результату
        if (results.length > 0 && confirm('Перейти к первому найденному меню?')) {
            selectMenu(results[0].index);
        }
    } else {
        alert('Блюдо не найдено');
    }
}

async function exportAllMenus() {
    if (!dailyMenus.length) {
        showToast('Нет меню для экспорта', 'warning');
        return;
    }
    
    try {
        const JSZip = window.JSZip;
        const zip = new JSZip();
        
        for (let i = 0; i < dailyMenus.length; i++) {
            const menu = dailyMenus[i];
            const wsData = createExcelData(menu);
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Меню');
            const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
            zip.file(menu.fileName || `menu_${i + 1}.xlsx`, buffer);
        }
        
        const content = await zip.generateAsync({ type: "blob" });
        const fileName = `school-menus-${formatDate(new Date(), 'file')}.zip`;
        saveAs(content, fileName);
        showToast(`Создан архив ${fileName}`, 'success');
    } catch (error) {
        showToast(`Ошибка: ${error.message}`, 'error');
    }
}

function exportCurrentMenu() {
    if (!dailyMenus.length || currentMenuIndex >= dailyMenus.length) {
        showToast('Нет текущего меню', 'warning');
        return;
    }
    
    const menu = dailyMenus[currentMenuIndex];
    const wsData = createExcelData(menu);
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Меню');
    XLSX.writeFile(wb, menu.fileName || `menu_${currentMenuIndex + 1}.xlsx`);
    showToast('Меню экспортировано', 'success');
}

function createExcelData(menu) {
    const data = [];
    data.push(['Дата', menu.dateString]);
    data.push(['Тип меню', menu.menuType]);
    data.push([]);
    data.push(['Прием пищи', 'Раздел', 'Блюдо', 'Вес, г', 'Ккал', 'Белки', 'Жиры', 'Углеводы']);
    
    const addMeal = (mealName, items) => {
        (items || []).forEach(item => {
            data.push([
                mealName,
                item.section || '',
                item.name,
                item.weight || 0,
                item.calories || 0,
                item.proteins || 0,
                item.fats || 0,
                item.carbs || 0
            ]);
        });
        if (items?.length) data.push([]);
    };
    
    addMeal('Завтрак', menu.breakfast?.items);
    addMeal('Обед', menu.lunch?.items);
    addMeal('Ужин', menu.dinner?.items);
    
    return data;
}

function updateFileList() {
    // Обновляем отображение загруженных файлов
    const fileList = document.getElementById('fileList');
    if (!fileList) return;
    
    const state = getState();
    const files = state.uploadedFiles || [];
    
    if (!files.length) {
        fileList.innerHTML = '<p style="text-align: center; color: #6c757d;">Файлы не загружены</p>';
        return;
    }
    
    let html = '';
    files.forEach(file => {
        html += `
            <div class="file-item success">
                <div class="file-info">
                    <i class="fas ${file.type === 'calendar' ? 'fa-calendar-alt' : 'fa-utensils'}"></i>
                    <div>
                        <div><strong>${escapeHtml(file.name)}</strong></div>
                        <div class="file-size">${file.type === 'calendar' ? 'Календарь' : 'Типовое меню'} • ${formatFileSize(file.size)}</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    fileList.innerHTML = html;
}

function updateCalendarPreview() {
    const container = document.getElementById('calendarData');
    if (!container) return;
    
    if (!calendarData) {
        container.innerHTML = '<p style="color: #e74c3c;">Календарь не загружен</p>';
        return;
    }
    
    let html = `<p><strong>Год:</strong> ${calendarData.year || 2026}</p>`;
    html += `<p><strong>Месяцев с данными:</strong> ${Object.keys(calendarData.months || {}).length}</p>`;
    
    let daysWithMenu = 0;
    for (const month of Object.values(calendarData.months || {})) {
        daysWithMenu += Object.keys(month).length;
    }
    html += `<p><strong>Дней с меню:</strong> ${daysWithMenu}</p>`;
    
    container.innerHTML = html;
}

function updateMenuPreview() {
    const container = document.getElementById('menuData');
    if (!container) return;
    
    if (!templateMenuData) {
        container.innerHTML = '<p style="color: #e74c3c;">Меню не загружено</p>';
        return;
    }
    
    let weeksCount = Object.keys(templateMenuData.weeks || {}).length;
    let totalDishes = 0;
    
    for (const week of Object.values(templateMenuData.weeks || {})) {
        for (const day of Object.values(week)) {
            for (const meal of Object.values(day)) {
                totalDishes += meal?.items?.length || 0;
            }
        }
    }
    
    let html = `<p><strong>Недель в меню:</strong> ${weeksCount}</p>`;
    html += `<p><strong>Всего блюд:</strong> ${totalDishes}</p>`;
    
    container.innerHTML = html;
}

function updateUI() {
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.disabled = !(calendarData && templateMenuData);
    }
    
    const exportBtns = ['exportAllBtn', 'exportCurrentBtn'];
    exportBtns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = !dailyMenus.length;
    });
}

function loadFromStorage() {
    const state = getState();
    calendarData = state.calendarData;
    templateMenuData = state.templateMenuData;
    dailyMenus = state.dailyMenus || [];
    
    updateCalendarPreview();
    updateMenuPreview();
    updateFileList();
    updateUI();
    
    if (dailyMenus.length) {
        renderMenus();
    }
    
    showToast('Данные загружены из памяти', 'success');
}

function clearStorage() {
    if (confirm('Очистить все данные?')) {
        calendarData = null;
        templateMenuData = null;
        dailyMenus = [];
        setState({ calendarData: null, templateMenuData: null, dailyMenus: [] });
        updateCalendarPreview();
        updateMenuPreview();
        updateFileList();
        updateUI();
        showToast('Данные очищены', 'info');
    }
}
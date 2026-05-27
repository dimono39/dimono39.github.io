import { getState, setState } from '../core/state-manager.js';
import { formatDate, escapeHtml, formatFileSize, showToast, deepClone } from '../core/utils.js';

let calendarData = null;
let templateMenuData = null;
let dailyMenus = [];
let currentMenuIndex = 0;

// HTML шаблон генератора
export async function renderGenerator(container) {
    container.innerHTML = `
        <div class="generator-module" style="animation: fadeIn 0.5s ease;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
                <!-- Левая колонка -->
                <div class="card">
                    <h2 class="card-title"><i class="fas fa-upload"></i> Загрузка файлов ФЦМПО</h2>
                    
                    <div id="statusMessage" style="padding: 10px; border-radius: 8px; margin-bottom: 20px; display: none;"></div>
                    
                    <div id="dropArea" style="border: 3px dashed #bdc3c7; border-radius: 10px; padding: 50px 30px; text-align: center; cursor: pointer; transition: all 0.3s ease;">
                        <i class="fas fa-file-excel" style="font-size: 4rem; color: #3498db; margin-bottom: 20px;"></i>
                        <h3>Перетащите файлы Excel ФЦМПО сюда</h3>
                        <p>или нажмите для выбора файлов</p>
                        <p style="font-size: 0.9rem; color: #6c757d; margin-top: 10px;">Требуемые файлы: kp2026.xlsx (календарь), tm2026-sm.xlsx (типовое меню)</p>
                        <input type="file" id="fileInput" class="file-input" multiple accept=".xlsx,.xls" style="display: none;">
                    </div>
                    
                    <div id="fileList" style="margin-top: 25px;"></div>
                    
                    <div class="config-section" style="margin-top: 30px;">
                        <h2 class="card-title"><i class="fas fa-cog"></i> Настройки генерации</h2>
                        
                        <div class="form-group">
                            <label><i class="fas fa-calendar-alt"></i> Начальная дата</label>
                            <input type="date" id="startDate" value="2026-01-01">
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fas fa-calendar-alt"></i> Конечная дата</label>
                            <input type="date" id="endDate" value="2026-01-31">
                        </div>
                        
                        <div style="display: flex; gap: 15px; flex-wrap: wrap;">
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
                        
                        <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
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
                    
                    <div class="data-preview" style="margin-bottom: 30px;">
                        <div class="preview-title" style="font-weight: 700; margin-bottom: 15px;">Календарь питания</div>
                        <div id="calendarData" style="padding: 15px; background: #f8f9fa; border-radius: 8px;">Загрузите файл календаря</div>
                    </div>
                    
                    <div class="data-preview">
                        <div class="preview-title" style="font-weight: 700; margin-bottom: 15px;">Типовое меню</div>
                        <div id="menuData" style="padding: 15px; background: #f8f9fa; border-radius: 8px;">Загрузите файл типового меню</div>
                    </div>
                </div>
            </div>
            
            <!-- Результаты генерации -->
            <div class="card" id="resultsCard" style="display: none;">
                <h2 class="card-title"><i class="fas fa-clipboard-list"></i> Сгенерированные меню</h2>
                
                <div id="menuNavigation" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                        <button id="prevMenuBtn" class="btn btn-secondary btn-sm">
                            <i class="fas fa-chevron-left"></i> Предыдущее
                        </button>
                        <button id="nextMenuBtn" class="btn btn-secondary btn-sm">
                            Следующее <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div id="menuCounter" style="font-weight: 700;"></div>
                </div>
                
                <div id="menuGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px;"></div>
            </div>
        </div>
    `;
    
    attachGeneratorEvents();
}

function attachGeneratorEvents() {
    // Drag & Drop
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    
    if (dropArea) {
        dropArea.addEventListener('click', () => fileInput?.click());
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.style.borderColor = '#3498db';
            dropArea.style.background = 'rgba(52, 152, 219, 0.05)';
        });
        dropArea.addEventListener('dragleave', () => {
            dropArea.style.borderColor = '#bdc3c7';
            dropArea.style.background = 'transparent';
        });
        dropArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropArea.style.borderColor = '#bdc3c7';
            dropArea.style.background = 'transparent';
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
    document.getElementById('prevMenuBtn')?.addEventListener('click', () => navigateMenus(-1));
    document.getElementById('nextMenuBtn')?.addEventListener('click', () => navigateMenus(1));
}

export function initGenerator() {
    const state = getState();
    calendarData = state.calendarData;
    templateMenuData = state.templateMenuData;
    dailyMenus = state.dailyMenus || [];
    
    updateFileList();
    updateCalendarPreview();
    updateMenuPreview();
    updateUI();
    
    if (dailyMenus.length) {
        renderMenus();
        document.getElementById('resultsCard').style.display = 'block';
    }
    
    console.log('Generator module initialized');
}

async function handleFiles(files) {
    for (const file of files) {
        const fileName = file.name.toLowerCase();
        
        if (fileName.includes('kp') && fileName.match(/\d{4}/)) {
            await processCalendarFile(file);
        } else if (fileName.includes('tm') && fileName.includes('-sm')) {
            await processTemplateFile(file);
        } else {
            showStatus(`Неизвестный тип файла: ${file.name}`, 'warning');
        }
    }
    
    updateUI();
}

async function processCalendarFile(file) {
    try {
        const data = await readExcelFile(file);
        calendarData = parseCalendarData(data, file.name);
        setState({ calendarData });
        updateCalendarPreview();
        showStatus(`Календарь загружен: ${file.name}`, 'success');
    } catch (error) {
        console.error('Calendar error:', error);
        showStatus(`Ошибка загрузки календаря: ${error.message}`, 'error');
    }
}

async function processTemplateFile(file) {
    try {
        const data = await readExcelFile(file);
        templateMenuData = parseTemplateData(data, file.name);
        setState({ templateMenuData });
        updateMenuPreview();
        showStatus(`Типовое меню загружено: ${file.name}`, 'success');
    } catch (error) {
        console.error('Template error:', error);
        showStatus(`Ошибка загрузки меню: ${error.message}`, 'error');
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
    const calendar = {
        months: {},
        year: 2026,
        schoolName: ''
    };
    
    // Простой парсинг: ищем строки с месяцами
    const monthNames = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 
                       'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
    
    for (let i = 0; i < Math.min(data.length, 50); i++) {
        const row = data[i];
        if (!row || !row[0]) continue;
        
        const cellValue = row[0].toString().toLowerCase();
        const monthIndex = monthNames.findIndex(m => cellValue.includes(m));
        
        if (monthIndex !== -1) {
            const monthName = monthNames[monthIndex];
            calendar.months[monthName] = {};
            
            // Парсим дни недели
            for (let j = 1; j < row.length && j <= 32; j++) {
                const dayValue = row[j];
                if (dayValue && !isNaN(parseInt(dayValue))) {
                    calendar.months[monthName][j] = parseInt(dayValue);
                }
            }
        }
    }
    
    // Извлекаем год из имени файла
    const yearMatch = fileName.match(/\d{4}/);
    if (yearMatch) {
        calendar.year = parseInt(yearMatch[0]);
    }
    
    return calendar;
}

function parseTemplateData(data, fileName) {
    const template = { weeks: {} };
    
    // Ищем строку с заголовками
    let headerRow = -1;
    for (let i = 0; i < Math.min(30, data.length); i++) {
        const row = data[i];
        if (row && row[0] === 'Неделя' || row[1] === 'День') {
            headerRow = i;
            break;
        }
    }
    
    if (headerRow === -1) {
        // Создаём демо-данные
        return createDemoData();
    }
    
    // Парсим данные
    for (let i = headerRow + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 3) continue;
        
        const week = parseInt(row[0]);
        const day = parseInt(row[1]);
        const mealName = row[2] ? row[2].toString().toLowerCase() : '';
        const section = row[3] || '';
        const dishName = row[4] || '';
        const weight = parseFloat(row[5]) || 0;
        const proteins = parseFloat(row[6]) || 0;
        const fats = parseFloat(row[7]) || 0;
        const carbs = parseFloat(row[8]) || 0;
        const calories = parseFloat(row[9]) || 0;
        
        // Определяем тип приёма пищи
        let meal = null;
        if (mealName.includes('завтрак') && !mealName.includes('2')) meal = 'breakfast';
        else if (mealName.includes('завтрак 2') || mealName.includes('второй завтрак')) meal = 'breakfast2';
        else if (mealName.includes('обед')) meal = 'lunch';
        else if (mealName.includes('полдник')) meal = 'afternoonSnack';
        else if (mealName.includes('ужин') && !mealName.includes('2')) meal = 'dinner';
        else if (mealName.includes('ужин 2') || mealName.includes('второй ужин')) meal = 'dinner2';
        
        if (week && day && meal && dishName && !dishName.toLowerCase().includes('итого')) {
            if (!template.weeks[week]) template.weeks[week] = {};
            if (!template.weeks[week][day]) {
                template.weeks[week][day] = {
                    breakfast: { items: [] },
                    breakfast2: { items: [] },
                    lunch: { items: [] },
                    afternoonSnack: { items: [] },
                    dinner: { items: [] },
                    dinner2: { items: [] }
                };
            }
            
            template.weeks[week][day][meal].items.push({
                section: section,
                name: dishName,
                weight: weight,
                calories: calories,
                proteins: proteins,
                fats: fats,
                carbs: carbs,
                recipeId: row[10] || '',
                price: parseFloat(row[11]) || 0
            });
        }
    }
    
    return template;
}

function createDemoData() {
    const template = { weeks: {} };
    
    for (let week = 1; week <= 2; week++) {
        template.weeks[week] = {};
        for (let day = 1; day <= 5; day++) {
            template.weeks[week][day] = {
                breakfast: {
                    items: [
                        { section: 'гор.блюдо', name: 'Каша рисовая молочная', weight: 200, calories: 220, proteins: 5, fats: 6, carbs: 35, price: 25 },
                        { section: 'гор.напиток', name: 'Какао с молоком', weight: 200, calories: 120, proteins: 4, fats: 4, carbs: 16, price: 15 },
                        { section: 'хлеб', name: 'Хлеб пшеничный', weight: 30, calories: 80, proteins: 2, fats: 1, carbs: 16, price: 5 },
                        { section: 'фрукты', name: 'Яблоко', weight: 100, calories: 52, proteins: 0.3, fats: 0.2, carbs: 14, price: 20 }
                    ]
                },
                breakfast2: { items: [] },
                lunch: {
                    items: [
                        { section: 'закуска', name: 'Салат овощной', weight: 80, calories: 45, proteins: 1.5, fats: 2, carbs: 5, price: 30 },
                        { section: '1 блюдо', name: 'Суп куриный', weight: 250, calories: 180, proteins: 12, fats: 8, carbs: 15, price: 35 },
                        { section: '2 блюдо', name: 'Котлета куриная', weight: 90, calories: 200, proteins: 18, fats: 12, carbs: 5, price: 45 },
                        { section: 'гарнир', name: 'Рис отварной', weight: 150, calories: 180, proteins: 4, fats: 1, carbs: 38, price: 20 },
                        { section: 'напиток', name: 'Компот', weight: 200, calories: 90, proteins: 0.5, fats: 0, carbs: 22, price: 15 },
                        { section: 'хлеб бел.', name: 'Хлеб пшеничный', weight: 30, calories: 80, proteins: 2, fats: 1, carbs: 16, price: 5 }
                    ]
                },
                afternoonSnack: { items: [] },
                dinner: {
                    items: [
                        { section: 'гор.блюдо', name: 'Рыба запечённая', weight: 120, calories: 180, proteins: 20, fats: 10, carbs: 2, price: 50 },
                        { section: 'гарнир', name: 'Картофельное пюре', weight: 150, calories: 160, proteins: 3, fats: 5, carbs: 26, price: 20 },
                        { section: 'напиток', name: 'Чай', weight: 200, calories: 60, proteins: 0, fats: 0, carbs: 15, price: 10 }
                    ]
                },
                dinner2: { items: [] }
            };
        }
    }
    
    return template;
}

async function generateDailyMenus() {
    if (!calendarData || !templateMenuData) {
        showStatus('Загрузите оба файла', 'warning');
        return;
    }
    
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    
    if (startDate > endDate) {
        showStatus('Начальная дата не может быть позже конечной', 'error');
        return;
    }
    
    showStatus('Генерация меню...', 'info');
    
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
        showStatus(`Сгенерировано ${menus.length} меню`, 'success');
        renderMenus();
        document.getElementById('resultsCard').style.display = 'block';
        updateUI();
    } else {
        showStatus('Не удалось сгенерировать меню для выбранного периода', 'warning');
    }
}

function generateMenuForDate(date) {
    const monthNames = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 
                       'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
    const monthName = monthNames[date.getMonth()];
    const day = date.getDate();
    
    const menuType = calendarData?.months?.[monthName]?.[day];
    if (!menuType) return null;
    
    // Определяем неделю и день в меню
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
    if (!menuGrid) return;
    
    if (!dailyMenus.length) {
        menuGrid.innerHTML = '<div style="text-align: center; padding: 40px;">Нет сгенерированных меню</div>';
        return;
    }
    
    let html = '';
    dailyMenus.forEach((menu, index) => {
        const breakfastCount = menu.breakfast?.items?.length || 0;
        const lunchCount = menu.lunch?.items?.length || 0;
        
        html += `
            <div class="menu-card" data-index="${index}" style="border: 2px solid #e0e6ed; border-radius: 10px; overflow: hidden; cursor: pointer; transition: all 0.3s ease;">
                <div style="background: linear-gradient(135deg, #3498db, #2980b9); color: white; padding: 15px; display: flex; justify-content: space-between;">
                    <div style="font-weight: 600;">${menu.dateString}</div>
                    <div style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px;">Меню ${menu.menuType}</div>
                </div>
                <div style="padding: 15px;">
                    <div><i class="fas fa-sun"></i> Завтрак: ${breakfastCount} блюд</div>
                    <div style="margin-top: 8px;"><i class="fas fa-utensils"></i> Обед: ${lunchCount} блюд</div>
                </div>
            </div>
        `;
    });
    
    menuGrid.innerHTML = html;
    
    // Добавляем обработчики
    document.querySelectorAll('.menu-card').forEach(card => {
        card.addEventListener('click', () => {
            const index = parseInt(card.dataset.index);
            selectMenu(index);
        });
    });
    
    updateMenuCounter();
}

function selectMenu(index) {
    currentMenuIndex = index;
    showMenuDetails();
    updateMenuCounter();
}

function showMenuDetails() {
    const menu = dailyMenus[currentMenuIndex];
    if (!menu) return;
    
    const menuGrid = document.getElementById('menuGrid');
    if (!menuGrid) return;
    
    const breakfastItems = menu.breakfast?.items || [];
    const lunchItems = menu.lunch?.items || [];
    const dinnerItems = menu.dinner?.items || [];
    
    let html = `
        <div style="margin-bottom: 20px;">
            <button onclick="document.getElementById('menuGrid').innerHTML = this.parentElement.parentElement.querySelector('.menu-cards').innerHTML" class="btn btn-secondary btn-sm">
                <i class="fas fa-arrow-left"></i> Назад к списку
            </button>
        </div>
        <div class="menu-cards">
            <h3>${menu.dateString} (Меню ${menu.menuType})</h3>
            
            <div style="margin-top: 20px;">
                <h4><i class="fas fa-sun"></i> Завтрак</h4>
                ${renderMealTable(breakfastItems)}
            </div>
            
            <div style="margin-top: 20px;">
                <h4><i class="fas fa-utensils"></i> Обед</h4>
                ${renderMealTable(lunchItems)}
            </div>
            
            <div style="margin-top: 20px;">
                <h4><i class="fas fa-moon"></i> Ужин</h4>
                ${renderMealTable(dinnerItems)}
            </div>
        </div>
    `;
    
    // Сохраняем исходное содержимое и показываем детали
    const originalContent = menuGrid.innerHTML;
    menuGrid.innerHTML = html;
    
    // Добавляем кнопку назад
    const backBtn = menuGrid.querySelector('.btn-secondary');
    if (backBtn) {
        backBtn.onclick = () => {
            menuGrid.innerHTML = originalContent;
            // Восстанавливаем обработчики
            document.querySelectorAll('.menu-card').forEach(card => {
                card.addEventListener('click', () => {
                    const index = parseInt(card.dataset.index);
                    selectMenu(index);
                });
            });
        };
    }
}

function renderMealTable(items) {
    if (!items.length) {
        return '<div style="color: #999; padding: 10px;">Нет блюд</div>';
    }
    
    return `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="border: 1px solid #e0e6ed; padding: 8px; text-align: left;">Раздел</th>
                    <th style="border: 1px solid #e0e6ed; padding: 8px; text-align: left;">Блюдо</th>
                    <th style="border: 1px solid #e0e6ed; padding: 8px;">Вес, г</th>
                    <th style="border: 1px solid #e0e6ed; padding: 8px;">Ккал</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td style="border: 1px solid #e0e6ed; padding: 8px;">${escapeHtml(item.section || '')}</td>
                        <td style="border: 1px solid #e0e6ed; padding: 8px;">${escapeHtml(item.name)}</td>
                        <td style="border: 1px solid #e0e6ed; padding: 8px; text-align: center;">${item.weight || 0}</td>
                        <td style="border: 1px solid #e0e6ed; padding: 8px; text-align: center;">${item.calories || 0}</td>
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
}

function updateMenuCounter() {
    const counter = document.getElementById('menuCounter');
    if (counter && dailyMenus.length) {
        counter.textContent = `${currentMenuIndex + 1} из ${dailyMenus.length}`;
    }
}

function showAnalytics() {
    if (!dailyMenus.length) {
        showStatus('Нет данных для анализа', 'warning');
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
    
    alert(`📊 Аналитика меню:\n\n` +
          `Всего меню: ${dailyMenus.length}\n` +
          `Всего блюд: ${totalDishes}\n` +
          `Уникальных блюд: ${uniqueDishes.size}\n` +
          `Средняя калорийность: ${avgCalories} ккал/день`);
}

function showSearch() {
    if (!dailyMenus.length) {
        showStatus('Нет меню для поиска', 'warning');
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
        results.slice(0, 10).forEach(r => {
            message += `${r.date} - ${r.meal}: ${r.name}\n`;
        });
        if (results.length > 10) message += `\n... и ещё ${results.length - 10}`;
        
        if (confirm(message + '\n\nПерейти к первому найденному меню?')) {
            selectMenu(results[0].index);
        }
    } else {
        alert('Блюдо не найдено');
    }
}

async function exportAllMenus() {
    if (!dailyMenus.length) {
        showStatus('Нет меню для экспорта', 'warning');
        return;
    }
    
    try {
        showStatus('Создание ZIP архива...', 'info');
        
        const zip = new JSZip();
        
        for (let i = 0; i < dailyMenus.length; i++) {
            const menu = dailyMenus[i];
            const wsData = createExcelData(menu);
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Меню');
            const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
            zip.file(`menu_${i + 1}_${menu.dateString}.xlsx`, buffer);
        }
        
        const content = await zip.generateAsync({ type: "blob" });
        const fileName = `school-menus-${formatDate(new Date(), 'file')}.zip`;
        saveAs(content, fileName);
        showStatus(`Создан архив ${fileName}`, 'success');
    } catch (error) {
        console.error('Export error:', error);
        showStatus(`Ошибка: ${error.message}`, 'error');
    }
}

function exportCurrentMenu() {
    if (!dailyMenus.length || currentMenuIndex >= dailyMenus.length) {
        showStatus('Нет текущего меню', 'warning');
        return;
    }
    
    const menu = dailyMenus[currentMenuIndex];
    const wsData = createExcelData(menu);
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Меню');
    XLSX.writeFile(wb, `menu_${menu.dateString}.xlsx`);
    showStatus(`Меню экспортировано`, 'success');
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
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid #27ae60;">
                <div>
                    <i class="fas ${file.type === 'calendar' ? 'fa-calendar-alt' : 'fa-utensils'}"></i>
                    <strong>${escapeHtml(file.name)}</strong>
                    <div style="font-size: 0.85rem; color: #6c757d;">${file.type === 'calendar' ? 'Календарь' : 'Типовое меню'} • ${formatFileSize(file.size)}</div>
                </div>
                <i class="fas fa-check-circle" style="color: #27ae60;"></i>
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
    
    const exportAllBtn = document.getElementById('exportAllBtn');
    const exportCurrentBtn = document.getElementById('exportCurrentBtn');
    if (exportAllBtn) exportAllBtn.disabled = !dailyMenus.length;
    if (exportCurrentBtn) exportCurrentBtn.disabled = !dailyMenus.length;
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('statusMessage');
    if (!statusDiv) {
        showToast(message, type);
        return;
    }
    
    statusDiv.textContent = message;
    statusDiv.className = `status-${type}`;
    statusDiv.style.display = 'block';
    
    if (type === 'success') statusDiv.style.background = '#d4edda';
    else if (type === 'error') statusDiv.style.background = '#f8d7da';
    else if (type === 'warning') statusDiv.style.background = '#fff3cd';
    else statusDiv.style.background = '#d1ecf1';
    
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 3000);
}
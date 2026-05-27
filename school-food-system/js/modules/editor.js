import { MEAL_STRUCTURE, VALID_SECTIONS, MEAL_NORMS } from '../core/constants.js';
import { getState, setState } from '../core/state-manager.js';
import { escapeHtml, escapeAttr, showToast, deepClone, normalizeSection } from '../core/utils.js';

let currentTemplateData = null;
let flatItems = [];
let allViolations = [];
let historyStack = [];
let historyIndex = -1;

// HTML шаблон редактора
export async function renderEditor(container) {
    container.innerHTML = `
        <div class="editor-module">
            <div class="card">
                <h2 class="card-title"><i class="fas fa-cloud-upload-alt"></i> Загрузка файла меню</h2>
                
                <div class="file-zone" id="dropZone">
                    <i class="fas fa-file-excel fa-4x" style="color:#10b981;"></i>
                    <h3>Перетащите файл <span style="color:#059669;">tm2026-sm.xlsx</span></h3>
                    <p>или кликните для выбора</p>
                    <input type="file" id="fileInput" accept=".xlsx,.xls" style="display:none">
                </div>
                
                <!-- Информация о школе -->
                <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border-radius: 20px;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
                        <i class="fas fa-school" style="color: #059669;"></i>
                        <strong>Информация об организации</strong>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                        <div>
                            <label style="font-size: 12px;">Название школы</label>
                            <input type="text" id="schoolNameInput" placeholder="МОУ «Сказочная СОШ»">
                        </div>
                        <div>
                            <label style="font-size: 12px;">Должность утверждающего</label>
                            <input type="text" id="approvalPositionInput" placeholder="Директор">
                        </div>
                        <div>
                            <label style="font-size: 12px;">ФИО утверждающего</label>
                            <input type="text" id="approvalNameInput" placeholder="Иванова И.И.">
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h2 class="card-title"><i class="fas fa-table-list"></i> Редактор меню</h2>
                
                <!-- Панель инструментов -->
                <div class="toolbar">
                    <button id="addWeekBtn" class="btn btn-success">
                        <i class="fas fa-calendar-plus"></i> Добавить неделю
                    </button>
                    <button id="copyDayBtn" class="btn btn-info">
                        <i class="fas fa-copy"></i> Копировать день
                    </button>
                    <button id="validateBtn" class="btn btn-warning">
                        <i class="fas fa-check-double"></i> Проверить
                    </button>
                    <button id="exportExcelBtn" class="btn btn-primary">
                        <i class="fas fa-download"></i> Экспорт
                    </button>
                </div>
                
                <!-- Статистика -->
                <div class="stats-panel" id="statsPanel"></div>
                
                <!-- Таблица редактора -->
                <div class="editor-wrapper" id="editorWrapper">
                    <div class="empty-state">
                        <p>Загрузите файл типового меню</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function initEditor() {
    const state = getState();
    currentTemplateData = state.templateMenuData ? deepClone(state.templateMenuData) : null;
    
    attachEditorEvents();
    
    if (currentTemplateData) {
        flatItems = buildFlatFromTemplate(currentTemplateData);
        renderEditorTable();
    }
    
    console.log('Editor module initialized');
}

function attachEditorEvents() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    
    if (dropZone) {
        dropZone.addEventListener('click', () => fileInput?.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files[0]) {
                await loadTemplateFile(e.dataTransfer.files[0]);
            }
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            if (e.target.files[0]) {
                await loadTemplateFile(e.target.files[0]);
            }
        });
    }
    
    document.getElementById('addWeekBtn')?.addEventListener('click', addNewWeek);
    document.getElementById('copyDayBtn')?.addEventListener('click', showCopyModal);
    document.getElementById('validateBtn')?.addEventListener('click', () => validateMenu());
    document.getElementById('exportExcelBtn')?.addEventListener('click', exportToExcel);
}

async function loadTemplateFile(file) {
    try {
        const data = await readExcelFile(file);
        currentTemplateData = parseTemplateData(data);
        setState({ templateMenuData: currentTemplateData });
        
        flatItems = buildFlatFromTemplate(currentTemplateData);
        renderEditorTable();
        
        // Сохраняем в историю для undo
        saveToHistory();
        
        showToast(`Файл "${file.name}" загружен`, 'success');
    } catch (error) {
        showToast(`Ошибка: ${error.message}`, 'error');
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

function parseTemplateData(data) {
    const template = { weeks: {} };
    
    // Ищем заголовки
    let headerRow = -1;
    for (let i = 0; i < Math.min(20, data.length); i++) {
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
    
    // Парсим строки
    for (let i = headerRow + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 4) continue;
        
        const week = parseInt(row[0]);
        const day = parseInt(row[1]);
        const meal = getMealType(row[2]);
        const section = row[3];
        const dishName = row[4];
        const weight = parseFloat(row[5]) || 0;
        const calories = parseFloat(row[9]) || 0;
        const proteins = parseFloat(row[6]) || 0;
        const fats = parseFloat(row[7]) || 0;
        const carbs = parseFloat(row[8]) || 0;
        
        if (week && day && meal && dishName && dishName !== 'итого') {
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
                section: section || '',
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

function getMealType(mealName) {
    if (!mealName) return null;
    const name = mealName.toString().toLowerCase();
    if (name.includes('завтрак') && !name.includes('2')) return 'breakfast';
    if (name.includes('завтрак 2') || name.includes('второй завтрак')) return 'breakfast2';
    if (name.includes('обед')) return 'lunch';
    if (name.includes('полдник')) return 'afternoonSnack';
    if (name.includes('ужин') && !name.includes('2')) return 'dinner';
    if (name.includes('ужин 2') || name.includes('второй ужин')) return 'dinner2';
    return null;
}

function createDemoData() {
    const template = { weeks: {} };
    
    for (let week = 1; week <= 2; week++) {
        template.weeks[week] = {};
        for (let day = 1; day <= 5; day++) {
            template.weeks[week][day] = {
                breakfast: {
                    items: [
                        { section: 'гор.блюдо', name: 'Каша рисовая молочная', weight: 200, calories: 220, proteins: 5, fats: 6, carbs: 35, recipeId: '', price: 25 },
                        { section: 'гор.напиток', name: 'Какао с молоком', weight: 200, calories: 120, proteins: 4, fats: 4, carbs: 16, recipeId: '', price: 15 },
                        { section: 'хлеб', name: 'Хлеб пшеничный', weight: 30, calories: 80, proteins: 2, fats: 1, carbs: 16, recipeId: '', price: 5 },
                        { section: 'фрукты', name: 'Яблоко', weight: 100, calories: 52, proteins: 0.3, fats: 0.2, carbs: 14, recipeId: '', price: 20 }
                    ]
                },
                breakfast2: { items: [] },
                lunch: {
                    items: [
                        { section: 'закуска', name: 'Салат овощной', weight: 80, calories: 45, proteins: 1.5, fats: 2, carbs: 5, recipeId: '', price: 30 },
                        { section: '1 блюдо', name: 'Суп куриный', weight: 250, calories: 180, proteins: 12, fats: 8, carbs: 15, recipeId: '', price: 35 },
                        { section: '2 блюдо', name: 'Котлета куриная', weight: 90, calories: 200, proteins: 18, fats: 12, carbs: 5, recipeId: '', price: 45 },
                        { section: 'гарнир', name: 'Рис отварной', weight: 150, calories: 180, proteins: 4, fats: 1, carbs: 38, recipeId: '', price: 20 },
                        { section: 'напиток', name: 'Компот', weight: 200, calories: 90, proteins: 0.5, fats: 0, carbs: 22, recipeId: '', price: 15 },
                        { section: 'хлеб бел.', name: 'Хлеб пшеничный', weight: 30, calories: 80, proteins: 2, fats: 1, carbs: 16, recipeId: '', price: 5 }
                    ]
                },
                afternoonSnack: { items: [] },
                dinner: {
                    items: [
                        { section: 'гор.блюдо', name: 'Рыба запечённая', weight: 120, calories: 180, proteins: 20, fats: 10, carbs: 2, recipeId: '', price: 50 },
                        { section: 'гарнир', name: 'Картофельное пюре', weight: 150, calories: 160, proteins: 3, fats: 5, carbs: 26, recipeId: '', price: 20 },
                        { section: 'напиток', name: 'Чай', weight: 200, calories: 60, proteins: 0, fats: 0, carbs: 15, recipeId: '', price: 10 }
                    ]
                },
                dinner2: { items: [] }
            };
        }
    }
    
    return template;
}

function buildFlatFromTemplate(template) {
    const flat = [];
    
    for (const week in template.weeks) {
        for (const day in template.weeks[week]) {
            for (const meal of ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2']) {
                const items = template.weeks[week][day][meal]?.items || [];
                items.forEach((item, idx) => {
                    flat.push({
                        id: `${week}_${day}_${meal}_${idx}`,
                        week: parseInt(week),
                        day: parseInt(day),
                        meal: meal,
                        ...item
                    });
                });
            }
        }
    }
    
    return flat;
}

function renderEditorTable() {
    const wrapper = document.getElementById('editorWrapper');
    if (!wrapper) return;
    
    if (!flatItems.length) {
        wrapper.innerHTML = '<div class="empty-state"><p>Нет данных для отображения</p></div>';
        return;
    }
    
    // Группируем по неделям и дням
    const grouped = {};
    flatItems.forEach(item => {
        const key = `${item.week}_${item.day}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
    });
    
    let html = `<table class="editor-table">
        <thead>
            <tr>
                <th>Неделя</th><th>День</th><th>Приём пищи</th><th>Раздел</th>
                <th>Блюдо</th><th>Вес (г)</th><th>Ккал</th>
                <th>Белки</th><th>Жиры</th><th>Углеводы</th><th></th>
            </tr>
        </thead>
        <tbody>`;
    
    const sortedKeys = Object.keys(grouped).sort();
    
    for (const key of sortedKeys) {
        const items = grouped[key];
        const [week, day] = key.split('_');
        let firstRow = true;
        
        for (const item of items) {
            const mealName = MEAL_STRUCTURE[item.meal]?.name || item.meal;
            
            html += `<tr data-id="${item.id}">`;
            
            if (firstRow) {
                html += `<td rowspan="${items.length}">${week}</td>`;
                html += `<td rowspan="${items.length}">${day}</td>`;
                firstRow = false;
            }
            
            html += `
                <td>${mealName}</td>
                <td>
                    <select data-field="section" data-id="${item.id}">
                        ${VALID_SECTIONS.map(s => `<option value="${s}" ${item.section === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </td>
                <td><input type="text" value="${escapeHtml(item.name)}" data-field="name" data-id="${item.id}"></td>
                <td><input type="number" value="${item.weight}" data-field="weight" data-id="${item.id}" step="1"></td>
                <td><input type="number" value="${item.calories}" data-field="calories" data-id="${item.id}" step="1"></td>
                <td><input type="number" value="${item.proteins}" data-field="proteins" data-id="${item.id}" step="0.1"></td>
                <td><input type="number" value="${item.fats}" data-field="fats" data-id="${item.id}" step="0.1"></td>
                <td><input type="number" value="${item.carbs}" data-field="carbs" data-id="${item.id}" step="0.1"></td>
                <td><button class="btn btn-danger btn-sm" data-delete="${item.id}"><i class="fas fa-trash"></i></button></td>
            </tr>`;
        }
    }
    
    html += `</tbody></table>`;
    wrapper.innerHTML = html;
    
    // Привязываем обработчики
    attachTableEvents();
    updateStats();
    validateMenu();
}

function attachTableEvents() {
    // Обработчики изменения полей
    document.querySelectorAll('#editorWrapper input, #editorWrapper select').forEach(el => {
        el.removeEventListener('change', handleFieldChange);
        el.addEventListener('change', handleFieldChange);
    });
    
    // Обработчики удаления
    document.querySelectorAll('[data-delete]').forEach(btn => {
        btn.removeEventListener('click', handleDelete);
        btn.addEventListener('click', handleDelete);
    });
}

function handleFieldChange(e) {
    const id = e.target.dataset.id;
    const field = e.target.dataset.field;
    let value = e.target.value;
    
    const [week, day, meal, idx] = id.split('_');
    
    if (currentTemplateData?.weeks[week]?.[day]?.[meal]?.items[parseInt(idx)]) {
        const item = currentTemplateData.weeks[week][day][meal].items[parseInt(idx)];
        
        if (field === 'weight' || field === 'calories' || field === 'proteins' || field === 'fats' || field === 'carbs') {
            value = parseFloat(value) || 0;
        }
        
        item[field] = value;
        
        // Обновляем flatItems
        const flatIndex = flatItems.findIndex(i => i.id === id);
        if (flatIndex !== -1) {
            flatItems[flatIndex][field] = value;
        }
        
        saveToHistory();
        updateStats();
        validateMenu();
    }
}

function handleDelete(e) {
    const id = e.currentTarget.dataset.delete;
    const [week, day, meal, idx] = id.split('_');
    
    if (currentTemplateData?.weeks[week]?.[day]?.[meal]?.items) {
        currentTemplateData.weeks[week][day][meal].items.splice(parseInt(idx), 1);
        
        // Обновляем flatItems
        const flatIndex = flatItems.findIndex(i => i.id === id);
        if (flatIndex !== -1) {
            flatItems.splice(flatIndex, 1);
        }
        
        renderEditorTable();
        saveToHistory();
        showToast('Блюдо удалено', 'info');
    }
}

function addNewWeek() {
    if (!currentTemplateData) {
        currentTemplateData = { weeks: {} };
    }
    
    const weeks = Object.keys(currentTemplateData.weeks).map(Number);
    const newWeekNum = weeks.length > 0 ? Math.max(...weeks) + 1 : 1;
    
    currentTemplateData.weeks[newWeekNum] = {};
    
    // Создаём 5 дней
    for (let day = 1; day <= 5; day++) {
        currentTemplateData.weeks[newWeekNum][day] = {
            breakfast: { items: [] },
            breakfast2: { items: [] },
            lunch: { items: [] },
            afternoonSnack: { items: [] },
            dinner: { items: [] },
            dinner2: { items: [] }
        };
    }
    
    flatItems = buildFlatFromTemplate(currentTemplateData);
    renderEditorTable();
    saveToHistory();
    showToast(`Добавлена неделя ${newWeekNum}`, 'success');
}

function showCopyModal() {
    if (!currentTemplateData) {
        showToast('Нет данных для копирования', 'warning');
        return;
    }
    
    const weeks = Object.keys(currentTemplateData.weeks).map(Number);
    const days = [1, 2, 3, 4, 5];
    
    const modalHtml = `
        <div id="copyModal" class="modal-overlay" style="display: flex;">
            <div class="modal-content">
                <h3>Копирование дня</h3>
                <div class="form-group">
                    <label>Источник:</label>
                    <select id="copySourceWeek">${weeks.map(w => `<option value="${w}">Неделя ${w}</option>`).join('')}</select>
                    <select id="copySourceDay">${days.map(d => `<option value="${d}">День ${d}</option>`).join('')}</select>
                </div>
                <div class="form-group">
                    <label>Цель:</label>
                    <select id="copyTargetWeek">${weeks.map(w => `<option value="${w}">Неделя ${w}</option>`).join('')}</select>
                    <select id="copyTargetDay">${days.map(d => `<option value="${d}">День ${d}</option>`).join('')}</select>
                </div>
                <div class="buttons-container">
                    <button id="copyConfirmBtn" class="btn btn-primary">Копировать</button>
                    <button id="copyCancelBtn" class="btn btn-secondary">Отмена</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    document.getElementById('copyConfirmBtn').addEventListener('click', () => {
        const sourceWeek = parseInt(document.getElementById('copySourceWeek').value);
        const sourceDay = parseInt(document.getElementById('copySourceDay').value);
        const targetWeek = parseInt(document.getElementById('copyTargetWeek').value);
        const targetDay = parseInt(document.getElementById('copyTargetDay').value);
        
        copyDay(sourceWeek, sourceDay, targetWeek, targetDay);
        document.getElementById('copyModal').remove();
    });
    
    document.getElementById('copyCancelBtn').addEventListener('click', () => {
        document.getElementById('copyModal').remove();
    });
}

function copyDay(sourceWeek, sourceDay, targetWeek, targetDay) {
    if (!currentTemplateData?.weeks[sourceWeek]?.[sourceDay]) {
        showToast('Источник не найден', 'error');
        return;
    }
    
    const sourceDayData = currentTemplateData.weeks[sourceWeek][sourceDay];
    
    if (!currentTemplateData.weeks[targetWeek]) {
        currentTemplateData.weeks[targetWeek] = {};
    }
    
    currentTemplateData.weeks[targetWeek][targetDay] = deepClone(sourceDayData);
    
    flatItems = buildFlatFromTemplate(currentTemplateData);
    renderEditorTable();
    saveToHistory();
    showToast(`День скопирован: ${sourceWeek}/${sourceDay} → ${targetWeek}/${targetDay}`, 'success');
}

function validateMenu() {
    allViolations = [];
    
    for (const week in currentTemplateData?.weeks || {}) {
        for (const day in currentTemplateData.weeks[week]) {
            const dayData = currentTemplateData.weeks[week][day];
            
            for (const meal of Object.keys(MEAL_STRUCTURE)) {
                const items = dayData[meal]?.items || [];
                const totalWeight = items.reduce((sum, i) => sum + (i.weight || 0), 0);
                const totalCalories = items.reduce((sum, i) => sum + (i.calories || 0), 0);
                
                const weightNorm = MEAL_NORMS[meal]?.weight;
                const caloriesNorm = MEAL_NORMS[meal]?.calories;
                
                if (weightNorm && totalWeight > 0 && totalWeight < weightNorm) {
                    allViolations.push({
                        week, day, meal,
                        message: `${MEAL_STRUCTURE[meal].name}: вес ${totalWeight}г < ${weightNorm}г`
                    });
                }
                
                if (caloriesNorm && totalCalories > 0 && totalCalories < caloriesNorm) {
                    allViolations.push({
                        week, day, meal,
                        message: `${MEAL_STRUCTURE[meal].name}: калории ${totalCalories} < ${caloriesNorm}`
                    });
                }
                
                // Проверка БЖУ
                items.forEach(item => {
                    const bjuSum = (item.proteins || 0) + (item.fats || 0) + (item.carbs || 0);
                    if (bjuSum > (item.weight || 0) && (item.weight || 0) > 0) {
                        allViolations.push({
                            week, day, meal,
                            message: `"${item.name}": БЖУ (${bjuSum}г) > вес (${item.weight}г)`
                        });
                    }
                });
            }
        }
    }
    
    updateViolationsDisplay();
}

function updateViolationsDisplay() {
    const statsPanel = document.getElementById('statsPanel');
    if (!statsPanel) return;
    
    const errors = allViolations.filter(v => v.message.includes('БЖУ')).length;
    const warnings = allViolations.length - errors;
    
    statsPanel.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${flatItems.length}</div>
            <div class="stat-label">Блюд</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" style="color: ${errors > 0 ? '#e74c3c' : '#27ae60'}">${errors}</div>
            <div class="stat-label">Ошибок</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" style="color: ${warnings > 0 ? '#f39c12' : '#27ae60'}">${warnings}</div>
            <div class="stat-label">Предупреждений</div>
        </div>
    `;
    
    // Подсвечиваем проблемные строки
    document.querySelectorAll('#editorWrapper tr[data-id]').forEach(row => {
        const id = row.dataset.id;
        const violation = allViolations.find(v => {
            const [week, day, meal, idx] = id.split('_');
            return v.week == week && v.day == day && v.meal === meal;
        });
        
        if (violation) {
            row.style.backgroundColor = violation.message.includes('БЖУ') ? '#fee2e2' : '#fef3c7';
        } else {
            row.style.backgroundColor = '';
        }
    });
}

function updateStats() {
    const totalDishes = flatItems.length;
    const totalWeeks = Object.keys(currentTemplateData?.weeks || {}).length;
    let totalDays = 0;
    
    for (const week of Object.values(currentTemplateData?.weeks || {})) {
        totalDays += Object.keys(week).length;
    }
    
    const statsPanel = document.getElementById('statsPanel');
    if (statsPanel && !statsPanel.querySelector('.stat-card')) {
        // statsPanel уже обновляется в updateViolationsDisplay
    }
}

function saveToHistory() {
    if (!currentTemplateData) return;
    
    const newState = deepClone(currentTemplateData);
    historyStack = historyStack.slice(0, historyIndex + 1);
    historyStack.push(newState);
    historyIndex++;
    
    if (historyStack.length > 50) {
        historyStack.shift();
        historyIndex--;
    }
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        currentTemplateData = deepClone(historyStack[historyIndex]);
        flatItems = buildFlatFromTemplate(currentTemplateData);
        renderEditorTable();
        showToast('Отменено', 'info');
    }
}

function redo() {
    if (historyIndex < historyStack.length - 1) {
        historyIndex++;
        currentTemplateData = deepClone(historyStack[historyIndex]);
        flatItems = buildFlatFromTemplate(currentTemplateData);
        renderEditorTable();
        showToast('Повторено', 'info');
    }
}

async function exportToExcel() {
    if (!currentTemplateData) {
        showToast('Нет данных для экспорта', 'warning');
        return;
    }
    
    try {
        const ExcelJS = window.ExcelJS;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Типовое меню');
        
        // Заголовки
        worksheet.columns = [
            { header: 'Неделя', key: 'week', width: 10 },
            { header: 'День', key: 'day', width: 10 },
            { header: 'Прием пищи', key: 'meal', width: 15 },
            { header: 'Раздел', key: 'section', width: 15 },
            { header: 'Блюдо', key: 'name', width: 40 },
            { header: 'Вес (г)', key: 'weight', width: 12 },
            { header: 'Белки', key: 'proteins', width: 10 },
            { header: 'Жиры', key: 'fats', width: 10 },
            { header: 'Углеводы', key: 'carbs', width: 10 },
            { header: 'Калории', key: 'calories', width: 12 },
            { header: 'Цена', key: 'price', width: 10 }
        ];
        
        // Заполняем данными
        flatItems.forEach(item => {
            worksheet.addRow({
                week: item.week,
                day: item.day,
                meal: MEAL_STRUCTURE[item.meal]?.name || item.meal,
                section: item.section,
                name: item.name,
                weight: item.weight,
                proteins: item.proteins,
                fats: item.fats,
                carbs: item.carbs,
                calories: item.calories,
                price: item.price
            });
        });
        
        // Стилизация
        worksheet.getRow(1).font = { bold: true };
        
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `template-menu-${new Date().toISOString().slice(0, 10)}.xlsx`);
        
        showToast('Экспорт завершён', 'success');
    } catch (error) {
        showToast(`Ошибка экспорта: ${error.message}`, 'error');
    }
}
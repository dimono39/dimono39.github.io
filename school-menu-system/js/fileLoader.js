// ============================================
// Модуль загрузки файлов XLSX
// Поддержка kp2026.xlsx и tm2026-sm.xlsx
// ============================================

let calendarData = null;
let templateMenuData = null;
let uploadedFiles = [];

// Структура приёмов пищи (СанПиН)
const MEAL_STRUCTURE = {
    'breakfast': { name: 'Завтрак', sections: ['гор.блюдо', 'гор.напиток', 'хлеб', 'фрукты'] },
    'breakfast2': { name: 'Завтрак 2', sections: ['фрукты'] },
    'lunch': { name: 'Обед', sections: ['закуска', '1 блюдо', '2 блюдо', 'гарнир', 'напиток', 'хлеб бел.', 'хлеб черн.'] },
    'afternoonSnack': { name: 'Полдник', sections: ['булочное', 'напиток'] },
    'dinner': { name: 'Ужин', sections: ['гор.блюдо', 'гарнир', 'напиток', 'хлеб'] },
    'dinner2': { name: 'Ужин 2', sections: ['кисломол.', 'булочное', 'напиток', 'фрукты'] }
};

const MEAL_TYPES = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];

// Нормализация названия раздела
function normalizeSection(section) {
    if (!section) return '';
    const s = section.toString().toLowerCase().trim();
    
    const map = {
        'горячее блюдо': 'гор.блюдо',
        'горячий напиток': 'гор.напиток',
        'первое блюдо': '1 блюдо',
        'второе блюдо': '2 блюдо',
        'хлеб белый': 'хлеб бел.',
        'хлеб черный': 'хлеб черн.',
        'булочные изделия': 'булочное',
        'кисломолочный напиток': 'кисломол.',
        'свежие фрукты': 'фрукты'
    };
    
    if (map[s]) return map[s];
    
    const standards = ['гор.блюдо', 'гор.напиток', 'хлеб', 'фрукты', 'напиток', 
                       'закуска', '1 блюдо', '2 блюдо', 'гарнир', 'хлеб бел.', 
                       'хлеб черн.', 'булочное', 'кисломол.', 'сладкое', '3 блюдо'];
    
    for (const std of standards) {
        if (s.includes(std.replace('.', '')) || s === std) return std;
    }
    
    return s;
}

// Обработка файлов
function handleFiles(files) {
    const filesArray = Array.from(files);
    
    filesArray.forEach(file => {
        if (!file.name.match(/\.(xls|xlsx)$/)) {
            showStatus(`Файл ${file.name} не является Excel файлом`, 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const fileName = file.name.toLowerCase();
                
                if (fileName.includes('kp') && fileName.match(/\d{4}/)) {
                    processCalendarFile(workbook, file);
                } else if (fileName.includes('tm') && fileName.includes('-sm')) {
                    processTemplateFile(workbook, file);
                } else {
                    showStatus(`Не удалось определить тип файла ${file.name}. Ожидаются kp2026.xlsx и tm2026-sm.xlsx`, 'error');
                }
            } catch (error) {
                showStatus(`Ошибка при чтении ${file.name}: ${error.message}`, 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

// Обработка календаря питания
function processCalendarFile(workbook, file) {
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    
    if (!data || data.length < 10) {
        showStatus(`Файл ${file.name} имеет неверную структуру`, 'error');
        return;
    }
    
    // Извлекаем название школы
    let schoolName = '';
    for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i];
        if (row && row.some(cell => cell && cell.toString().toLowerCase().includes('школ'))) {
            for (let j = 0; j < row.length; j++) {
                if (row[j] && row[j].toString().toLowerCase().includes('школ') && j + 1 < row.length) {
                    schoolName = row[j + 1]?.toString().trim() || '';
                    break;
                }
            }
            if (schoolName) break;
        }
    }
    
    if (schoolName && !schoolInfo.name) {
        schoolInfo.name = schoolName;
        document.getElementById('schoolName').value = schoolName;
    }
    
    // Парсим месяцы и дни
    const monthNames = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 
                        'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
    
    let monthRowIndex = -1;
    for (let i = 0; i < Math.min(50, data.length); i++) {
        if (data[i] && data[i][0]) {
            const cell = data[i][0].toString().toLowerCase();
            if (monthNames.some(month => cell.includes(month))) {
                monthRowIndex = i;
                break;
            }
        }
    }
    
    if (monthRowIndex === -1) {
        showStatus(`Не удалось найти данные календаря в файле ${file.name}`, 'error');
        return;
    }
    
    // Получаем дни месяца
    const dayHeaders = data[monthRowIndex - 1] || [];
    const dayNumbers = [];
    for (let i = 1; i < dayHeaders.length; i++) {
        const day = parseInt(dayHeaders[i]);
        if (!isNaN(day) && day >= 1 && day <= 31) {
            dayNumbers.push(day);
        }
    }
    
    // Извлекаем год
    let year = 2026;
    const yearMatch = file.name.match(/\d{4}/);
    if (yearMatch) year = parseInt(yearMatch[0]);
    
    calendarData = {
        schoolName: schoolName,
        year: year,
        months: {}
    };
    
    // Парсим меню по месяцам
    for (let i = monthRowIndex; i < Math.min(monthRowIndex + 12, data.length); i++) {
        const row = data[i];
        if (!row || !row[0]) continue;
        
        const monthName = row[0].toString().toLowerCase().trim();
        if (!monthNames.includes(monthName)) continue;
        
        calendarData.months[monthName] = {};
        
        for (let d = 0; d < dayNumbers.length; d++) {
            const dayNum = dayNumbers[d];
            const menuType = row[d + 1];
            
            if (menuType !== undefined && menuType !== null && menuType !== '') {
                const numValue = parseInt(menuType);
                if (!isNaN(numValue) && numValue >= 1 && numValue <= 10) {
                    calendarData.months[monthName][dayNum] = numValue;
                }
            }
        }
    }
    
    currentCalendarData = calendarData;
    
    showStatus(`✅ Календарь питания загружен: ${file.name} (${year} год)`, 'success');
    updateCalendarDisplay();
    saveToLocalStorage();
}

// Обработка типового меню
function processTemplateFile(workbook, file) {
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    
    if (!data || data.length < 5) {
        showStatus(`Файл ${file.name} имеет неверную структуру`, 'error');
        return;
    }
    
    // Ищем строку с заголовками
    let headerRow = -1;
    for (let i = 0; i < Math.min(20, data.length); i++) {
        const row = data[i];
        if (row && row[0] && row[1]) {
            const col0 = row[0].toString().toLowerCase();
            const col1 = row[1].toString().toLowerCase();
            if ((col0 === 'неделя' || col0.includes('нед')) && 
                (col1 === 'день' || col1.includes('день') || col1.includes('недели'))) {
                headerRow = i;
                break;
            }
        }
    }
    
    if (headerRow === -1) {
        showStatus(`Не удалось найти заголовки в файле ${file.name}`, 'error');
        return;
    }
    
    templateMenuData = {
        weeks: {}
    };
    
    let currentWeek = null;
    let currentDay = null;
    let currentMeal = null;
    
    for (let i = headerRow + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 3) continue;
        
        const weekVal = row[0];
        const dayVal = row[1];
        
        // Проверяем новую неделю/день
        if (weekVal !== undefined && weekVal !== null && weekVal !== '') {
            const weekNum = parseInt(weekVal);
            if (!isNaN(weekNum)) currentWeek = weekNum;
        }
        
        if (dayVal !== undefined && dayVal !== null && dayVal !== '') {
            const dayNum = parseInt(dayVal);
            if (!isNaN(dayNum)) currentDay = dayNum;
        }
        
        // Инициализируем структуру
        if (currentWeek && currentDay) {
            if (!templateMenuData.weeks[currentWeek]) templateMenuData.weeks[currentWeek] = {};
            if (!templateMenuData.weeks[currentWeek][currentDay]) {
                templateMenuData.weeks[currentWeek][currentDay] = {
                    breakfast: { items: [] },
                    breakfast2: { items: [] },
                    lunch: { items: [] },
                    afternoonSnack: { items: [] },
                    dinner: { items: [] },
                    dinner2: { items: [] }
                };
            }
        }
        
        // Определяем приём пищи
        const mealCell = row[2] ? row[2].toString().trim() : '';
        if (mealCell && !mealCell.toLowerCase().includes('итого')) {
            const mealLower = mealCell.toLowerCase();
            if (mealLower.includes('завтрак') && !mealLower.includes('2')) {
                currentMeal = 'breakfast';
            } else if (mealLower.includes('завтрак 2')) {
                currentMeal = 'breakfast2';
            } else if (mealLower.includes('обед')) {
                currentMeal = 'lunch';
            } else if (mealLower.includes('полдник')) {
                currentMeal = 'afternoonSnack';
            } else if (mealLower.includes('ужин') && !mealLower.includes('2')) {
                currentMeal = 'dinner';
            } else if (mealLower.includes('ужин 2')) {
                currentMeal = 'dinner2';
            }
        }
        
        // Добавляем блюдо
        if (currentWeek && currentDay && currentMeal) {
            const dishName = row[4] ? row[4].toString().trim() : '';
            if (dishName && dishName !== '' && !dishName.toLowerCase().includes('итого')) {
                
                let weight = 0;
                const weightRaw = row[5] ? row[5].toString().trim() : '0';
                if (weightRaw.includes('/')) {
                    const parts = weightRaw.split('/');
                    for (const part of parts) {
                        const val = parseFloat(part);
                        if (!isNaN(val)) weight += val;
                    }
                } else {
                    weight = parseFloat(weightRaw) || 0;
                }
                
                const dish = {
                    section: normalizeSection(row[3]),
                    originalSection: row[3] || '',
                    name: dishName,
                    weight: weight,
                    originalWeight: weightRaw,
                    calories: parseFloat(row[9]) || 0,
                    proteins: parseFloat(row[6]) || 0,
                    fats: parseFloat(row[7]) || 0,
                    carbs: parseFloat(row[8]) || 0,
                    recipeId: row[10] ? row[10].toString().trim() : '',
                    price: parseFloat(row[11]) || 0
                };
                
                if (dish.name && dish.name !== '') {
                    templateMenuData.weeks[currentWeek][currentDay][currentMeal].items.push(dish);
                }
            }
        }
    }
    
    currentTemplateData = templateMenuData;
    originalTemplateData = JSON.parse(JSON.stringify(templateMenuData));
    
    // Сохраняем в историю
    historyStack = [JSON.parse(JSON.stringify(templateMenuData))];
    historyIndex = 0;
    
    showStatus(`✅ Типовое меню загружено: ${file.name}`, 'success');
    updateMenuDisplay();
    saveToLocalStorage();
    
    // Обновляем редактор
    if (typeof buildFlatFromTemplate === 'function') {
        flatItems = buildFlatFromTemplate(currentTemplateData);
    }
    if (typeof renderEditor === 'function') {
        renderEditor();
    }
}

// Отображение календаря
function updateCalendarDisplay() {
    const container = document.getElementById('calendarPreview');
    const fileInfo = document.getElementById('calendarFileInfo');
    
    if (!calendarData) {
        if (container) container.innerHTML = '<p style="color: #64748b;">Календарь не загружен</p>';
        fileInfo?.classList.remove('active');
        return;
    }
    
    fileInfo.classList.add('active');
    fileInfo.innerHTML = `
        <i class="fas fa-check-circle" style="color: #10b981;"></i>
        <strong>${calendarData.year} год</strong> — 
        ${Object.keys(calendarData.months || {}).length} месяцев с данными
    `;
    
    let html = '<div style="font-size: 0.8rem;">';
    if (calendarData.months) {
        for (const [month, days] of Object.entries(calendarData.months)) {
            const daysWithMenu = Object.keys(days).length;
            if (daysWithMenu > 0) {
                html += `<div><strong>${month}</strong>: ${daysWithMenu} дней с меню</div>`;
            }
        }
    }
    html += '</div>';
    
    if (container) container.innerHTML = html;
}

// Отображение информации о меню
function updateMenuDisplay() {
    const container = document.getElementById('menuPreview');
    const fileInfo = document.getElementById('menuFileInfo');
    
    if (!templateMenuData) {
        if (container) container.innerHTML = '<p style="color: #64748b;">Типовое меню не загружено</p>';
        fileInfo?.classList.remove('active');
        return;
    }
    
    let totalDishes = 0;
    let totalDays = 0;
    
    for (const week in templateMenuData.weeks) {
        for (const day in templateMenuData.weeks[week]) {
            totalDays++;
            const dayData = templateMenuData.weeks[week][day];
            for (const meal of MEAL_TYPES) {
                if (dayData[meal] && dayData[meal].items) {
                    totalDishes += dayData[meal].items.length;
                }
            }
        }
    }
    
    fileInfo.classList.add('active');
    fileInfo.innerHTML = `
        <i class="fas fa-check-circle" style="color: #10b981;"></i>
        <strong>${Object.keys(templateMenuData.weeks).length} недель</strong> — 
        ${totalDays} дней, ${totalDishes} блюд
    `;
    
    if (container) {
        container.innerHTML = `
            <div><strong>Недель:</strong> ${Object.keys(templateMenuData.weeks).length}</div>
            <div><strong>Дней:</strong> ${totalDays}</div>
            <div><strong>Блюд:</strong> ${totalDishes}</div>
        `;
    }
}

// Инициализация загрузчиков
function initFileLoaders() {
    // Календарь
    const calendarZone = document.getElementById('calendarDropZone');
    const calendarInput = document.getElementById('calendarFileInput');
    
    if (calendarZone) {
        calendarZone.addEventListener('click', () => calendarInput.click());
        calendarZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            calendarZone.classList.add('dragover');
        });
        calendarZone.addEventListener('dragleave', () => {
            calendarZone.classList.remove('dragover');
        });
        calendarZone.addEventListener('drop', (e) => {
            e.preventDefault();
            calendarZone.classList.remove('dragover');
            if (e.dataTransfer.files[0]) handleFiles([e.dataTransfer.files[0]]);
        });
    }
    
    if (calendarInput) {
        calendarInput.addEventListener('change', (e) => {
            if (e.target.files[0]) handleFiles([e.target.files[0]]);
        });
    }
    
    // Типовое меню
    const menuZone = document.getElementById('menuDropZone');
    const menuInput = document.getElementById('menuFileInput');
    
    if (menuZone) {
        menuZone.addEventListener('click', () => menuInput.click());
        menuZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            menuZone.classList.add('dragover');
        });
        menuZone.addEventListener('dragleave', () => {
            menuZone.classList.remove('dragover');
        });
        menuZone.addEventListener('drop', (e) => {
            e.preventDefault();
            menuZone.classList.remove('dragover');
            if (e.dataTransfer.files[0]) handleFiles([e.dataTransfer.files[0]]);
        });
    }
    
    if (menuInput) {
        menuInput.addEventListener('change', (e) => {
            if (e.target.files[0]) handleFiles([e.target.files[0]]);
        });
    }
}
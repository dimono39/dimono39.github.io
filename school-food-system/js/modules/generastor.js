// generator.js - Полноценная PRO версия генератора меню
// Совмещает модульную структуру с расширенным функционалом

import { getState, setState } from '../core/state-manager.js';
import { formatDate, escapeHtml, formatFileSize, showToast, deepClone } from '../core/utils.js';

// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let calendarData = null;
let templateMenuData = null;
let dailyMenus = [];
let currentMenuIndex = 0;
let currentYear = 2026;
let isGridView = true;
let currentMealFilter = 'all';
let nutritionChart = null;
let uploadedFiles = [];
let detailedViewVisible = false;

const STORAGE_KEY = 'schoolMenuGeneratorPro';

// ========== СТРУКТУРА ПРИЁМОВ ПИЩИ (СанПиН-3590) ==========
const MEAL_STRUCTURE = {
    'breakfast': { name: 'Завтрак', sections: ['гор.блюдо', 'гор.напиток', 'хлеб', 'фрукты'] },
    'breakfast2': { name: 'Завтрак 2', sections: ['фрукты'] },
    'lunch': { name: 'Обед', sections: ['закуска', '1 блюдо', '2 блюдо', 'гарнир', 'напиток', 'хлеб бел.', 'хлеб черн.'] },
    'afternoonSnack': { name: 'Полдник', sections: ['булочное', 'напиток'] },
    'dinner': { name: 'Ужин', sections: ['гор.блюдо', 'гарнир', 'напиток', 'хлеб'] },
    'dinner2': { name: 'Ужин 2', sections: ['кисломол.', 'булочное', 'напиток', 'фрукты'] }
};

const MEAL_TYPES = {
    'breakfast': 'Завтрак',
    'breakfast2': 'Завтрак 2',
    'lunch': 'Обед',
    'afternoonSnack': 'Полдник',
    'dinner': 'Ужин',
    'dinner2': 'Ужин 2'
};

// ========== ЦВЕТА ДЛЯ ТИПОВ МЕНЮ ==========
const MENU_TYPE_COLORS = {
    1: '#3498db', 2: '#2ecc71', 3: '#9b59b6', 4: '#e67e22', 5: '#1abc9c',
    6: '#34495e', 7: '#d35400', 8: '#16a085', 9: '#8e44ad', 10: '#27ae60',
    11: '#2980b9', 12: '#27ae60', 13: '#f39c12', 14: '#e74c3c', 15: '#1abc9c'
};

// ========== СЕЗОННЫЕ ПРОДУКТЫ ==========
const SEASONAL_PRODUCTS = {
    'январь': ['капуста', 'морковь', 'свекла', 'картофель', 'яблоки', 'цитрусовые'],
    'февраль': ['капуста', 'морковь', 'свекла', 'картофель', 'яблоки', 'цитрусовые'],
    'март': ['капуста', 'морковь', 'свекла', 'картофель', 'цитрусовые'],
    'апрель': ['капуста', 'морковь', 'свекла', 'редис', 'салат', 'зелень'],
    'май': ['редис', 'салат', 'зелень', 'шпинат', 'щавель'],
    'июнь': ['огурцы', 'помидоры', 'клубника', 'зелень', 'редис', 'кабачки'],
    'июль': ['огурцы', 'помидоры', 'кабачки', 'баклажаны', 'перец', 'ягоды', 'вишня'],
    'август': ['огурцы', 'помидоры', 'кабачки', 'баклажаны', 'перец', 'яблоки', 'груши', 'сливы', 'арбуз'],
    'сентябрь': ['кабачки', 'баклажаны', 'перец', 'яблоки', 'груши', 'виноград', 'тыква', 'морковь'],
    'октябрь': ['капуста', 'морковь', 'свекла', 'тыква', 'яблоки', 'груши', 'картофель'],
    'ноябрь': ['капуста', 'морковь', 'свекла', 'тыква', 'картофель', 'цитрусовые'],
    'декабрь': ['капуста', 'морковь', 'свекла', 'картофель', 'цитрусовые', 'яблоки']
};

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function adjustColor(color, amount) {
    let usePound = false;
    if (color[0] === "#") {
        color = color.slice(1);
        usePound = true;
    }
    const num = parseInt(color, 16);
    let r = (num >> 16) + amount;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amount;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amount;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}

function getMealIcon(mealType) {
    const icons = {
        'breakfast': 'fa-sun',
        'breakfast2': 'fa-coffee',
        'lunch': 'fa-utensils',
        'afternoonSnack': 'fa-cookie-bite',
        'dinner': 'fa-moon',
        'dinner2': 'fa-glass-whiskey'
    };
    return icons[mealType] || 'fa-utensils';
}

function getMealColor(mealType) {
    const colors = {
        'breakfast': '#f39c12',
        'breakfast2': '#e67e22',
        'lunch': '#e74c3c',
        'afternoonSnack': '#2ecc71',
        'dinner': '#9b59b6',
        'dinner2': '#3498db'
    };
    return colors[mealType] || '#3498db';
}

function checkSeasonality(dishName, date) {
    if (!date) return false;
    const monthNames = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 
                       'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
    const month = monthNames[date.getMonth()];
    const seasonal = SEASONAL_PRODUCTS[month] || [];
    const dishLower = dishName.toLowerCase();
    
    const isSeasonal = seasonal.some(s => dishLower.includes(s));
    return !isSeasonal && seasonal.length > 0;
}

function normalizeSectionName(section) {
    if (!section) return '';
    const sectionLower = section.toLowerCase().trim();
    
    const sectionMap = {
        'горячее блюдо': 'гор.блюдо',
        'горячий напиток': 'гор.напиток',
        'первое блюдо': '1 блюдо',
        'второе блюдо': '2 блюдо',
        'хлеб белый': 'хлеб бел.',
        'хлеб черный': 'хлеб черн.',
        'булочные изделия': 'булочное',
        'кисломолочный напиток': 'кисломол.',
        'кисломолочные продукты': 'кисломол.',
        'свежие фрукты': 'фрукты',
        'фрукт свежий': 'фрукты'
    };
    
    if (sectionMap[sectionLower]) return sectionMap[sectionLower];
    
    const standardSections = ['гор.блюдо', 'гор.напиток', 'хлеб', 'фрукты', 'напиток', 
                              'закуска', '1 блюдо', '2 блюдо', 'гарнир', 'хлеб бел.', 
                              'хлеб черн.', 'булочное', 'кисломол.'];
    
    for (const standard of standardSections) {
        const cleanStandard = standard.replace(/\./g, '').replace(/\s/g, '');
        if (sectionLower.includes(cleanStandard)) return standard;
    }
    
    return sectionLower;
}

function sortMealItemsByStructure(items, mealType) {
    if (!items || items.length === 0) return [];
    
    const structure = MEAL_STRUCTURE[mealType];
    if (!structure) return items;
    
    const normalizedItems = items.map(item => ({
        ...item,
        normalizedSection: normalizeSectionName(item.section || '')
    }));
    
    const sortedItems = [];
    for (const section of structure.sections) {
        const sectionItems = normalizedItems.filter(item => item.normalizedSection === section);
        sortedItems.push(...sectionItems);
    }
    
    const otherItems = normalizedItems.filter(item => !structure.sections.includes(item.normalizedSection));
    sortedItems.push(...otherItems);
    
    return sortedItems;
}

// ========== ПАРСИНГ ФАЙЛОВ ==========
async function readExcelFile(file) {
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

async function processCalendarFile(file) {
    try {
        const data = await readExcelFile(file);
        
        let schoolName = '';
        for (let i = 0; i < Math.min(10, data.length); i++) {
            if (data[i] && data[i].some(cell => cell && cell.toString().toLowerCase().includes('школ'))) {
                const row = data[i];
                for (let j = 0; j < row.length; j++) {
                    if (row[j] && row[j].toString().toLowerCase().includes('школ')) {
                        if (j + 1 < row.length && row[j + 1]) {
                            schoolName = row[j + 1].toString().trim();
                            break;
                        }
                    }
                }
                if (schoolName) break;
            }
        }
        
        let monthRowIndex = -1;
        const monthNames = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 
                           'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
        
        for (let i = 0; i < Math.min(50, data.length); i++) {
            if (data[i] && data[i][0] && typeof data[i][0] === 'string') {
                const cellValue = data[i][0].toString().toLowerCase();
                if (monthNames.some(month => cellValue.includes(month))) {
                    monthRowIndex = i;
                    break;
                }
            }
        }
        
        if (monthRowIndex === -1) {
            showToast('Не удалось найти данные календаря', 'error');
            return false;
        }
        
        const dayHeaders = data[monthRowIndex - 1] || [];
        const dayNumbers = [];
        
        for (let i = 1; i < dayHeaders.length; i++) {
            const cell = dayHeaders[i];
            if (cell !== undefined && cell !== null && cell !== '') {
                const num = parseInt(cell);
                if (!isNaN(num) && num >= 1 && num <= 31) {
                    dayNumbers.push(num);
                }
            }
        }
        
        if (dayNumbers.length === 0) {
            for (let i = 1; i <= 31; i++) dayNumbers.push(i);
        }
        
        let yearFromData = currentYear;
        const yearMatch = file.name.match(/\d{4}/);
        if (yearMatch) {
            yearFromData = parseInt(yearMatch[0]);
        }
        
        currentYear = yearFromData;
        
        calendarData = {
            schoolName: schoolName,
            months: {},
            year: currentYear
        };
        
        for (let i = monthRowIndex; i < Math.min(monthRowIndex + 12, data.length); i++) {
            const row = data[i];
            if (!row || !row[0]) continue;
            
            const monthName = row[0].toString().toLowerCase().trim();
            if (!monthNames.includes(monthName)) continue;
            
            calendarData.months[monthName] = {};
            
            for (let dayIdx = 0; dayIdx < dayNumbers.length; dayIdx++) {
                const dayNum = dayNumbers[dayIdx];
                if (dayNum >= 1 && dayNum <= 31) {
                    const menuType = row[dayIdx + 1];
                    if (menuType !== undefined && menuType !== null && menuType !== '') {
                        const numValue = parseInt(menuType);
                        if (!isNaN(numValue) && numValue > 0) {
                            calendarData.months[monthName][dayNum] = numValue;
                        }
                    }
                }
            }
        }
        
        setState({ calendarData });
        showToast(`Календарь загружен: ${file.name} (${currentYear} год)`, 'success');
        return true;
        
    } catch (error) {
        console.error('Calendar error:', error);
        showToast(`Ошибка загрузки календаря: ${error.message}`, 'error');
        return false;
    }
}

async function processTemplateFile(file) {
    try {
        const data = await readExcelFile(file);
        
        let schoolName = '';
        let ageCategory = '';
        
        for (let i = 0; i < Math.min(10, data.length); i++) {
            const row = data[i];
            if (!row) continue;
            
            for (let j = 0; j < row.length; j++) {
                const cell = row[j];
                if (cell && typeof cell === 'string') {
                    const cellLower = cell.toLowerCase();
                    
                    if (cellLower.includes('школ')) {
                        for (let k = j + 1; k < row.length; k++) {
                            if (row[k] && typeof row[k] === 'string' && row[k].trim().length > 2) {
                                schoolName = row[k].toString().trim();
                                break;
                            }
                        }
                    }
                    
                    if (cellLower.includes('7-11') || cellLower.includes('12-18') || 
                        cellLower.includes('1-3') || cellLower.includes('4-6')) {
                        ageCategory = cell.trim();
                    }
                }
            }
        }
        
        let headerRowIndex = -1;
        let weekColumn = -1, dayColumn = -1, mealColumn = -1;
        let sectionColumn = -1, dishColumn = -1, weightColumn = -1;
        
        for (let i = 0; i < Math.min(30, data.length); i++) {
            const row = data[i];
            if (!row) continue;
            
            for (let j = 0; j < row.length; j++) {
                const cell = row[j] ? row[j].toString().toLowerCase().trim() : '';
                
                if (cell === 'неделя' || cell.includes('неделя')) {
                    headerRowIndex = i;
                    weekColumn = j;
                } else if (cell === 'день' || cell.includes('день недели')) {
                    headerRowIndex = i;
                    dayColumn = j;
                } else if (cell === 'прием пищи' || cell.includes('прием')) {
                    headerRowIndex = i;
                    mealColumn = j;
                } else if (cell === 'раздел' || cell.includes('раздел')) {
                    headerRowIndex = i;
                    sectionColumn = j;
                } else if (cell === 'блюдо' || cell.includes('наименование')) {
                    headerRowIndex = i;
                    dishColumn = j;
                } else if (cell === 'выход' || cell.includes('вес') || cell.includes('масса')) {
                    headerRowIndex = i;
                    weightColumn = j;
                }
            }
            
            if (headerRowIndex !== -1 && weekColumn !== -1 && dayColumn !== -1) break;
        }
        
        if (headerRowIndex === -1) {
            for (let i = 0; i < Math.min(50, data.length); i++) {
                const row = data[i];
                if (row && row.length >= 2) {
                    const col0 = row[0] ? row[0].toString().trim() : '';
                    const col1 = row[1] ? row[1].toString().trim() : '';
                    
                    if (!isNaN(parseInt(col0)) && !isNaN(parseInt(col1)) && parseInt(col0) > 0 && parseInt(col0) < 53) {
                        headerRowIndex = i - 1;
                        weekColumn = 0;
                        dayColumn = 1;
                        mealColumn = 2;
                        sectionColumn = 3;
                        dishColumn = 4;
                        weightColumn = 5;
                        break;
                    }
                }
            }
        }
        
        if (headerRowIndex === -1) {
            showToast('Не удалось найти структуру меню в файле', 'error');
            return false;
        }
        
        templateMenuData = {
            schoolName: schoolName,
            ageCategory: ageCategory,
            weeks: {},
            maxWeekNumber: 0,
            maxDayNumber: 0
        };
        
        let currentWeek = null, currentDay = null, currentMeal = null;
        let foundBreakfast = false;
        
        for (let i = headerRowIndex + 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length < 3) continue;
            
            let weekNum = null, dayNum = null;
            
            if (weekColumn !== -1 && row[weekColumn] !== undefined && row[weekColumn] !== '') {
                weekNum = parseInt(row[weekColumn]);
            }
            if (dayColumn !== -1 && row[dayColumn] !== undefined && row[dayColumn] !== '') {
                dayNum = parseInt(row[dayColumn]);
            }
            
            if (!isNaN(weekNum) && !isNaN(dayNum) && weekNum > 0 && dayNum > 0) {
                if (currentWeek !== weekNum || currentDay !== dayNum) {
                    currentWeek = weekNum;
                    currentDay = dayNum;
                    currentMeal = null;
                    foundBreakfast = false;
                    
                    if (weekNum > templateMenuData.maxWeekNumber) templateMenuData.maxWeekNumber = weekNum;
                    if (dayNum > templateMenuData.maxDayNumber) templateMenuData.maxDayNumber = dayNum;
                    
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
            }
            
            let mealCell = '';
            if (mealColumn !== -1 && row[mealColumn] !== undefined && row[mealColumn] !== null) {
                mealCell = row[mealColumn].toString().trim();
            }
            
            if (mealCell && mealCell !== '') {
                const mealLower = mealCell.toLowerCase();
                
                if (mealLower.includes('завтрак')) {
                    if (foundBreakfast) {
                        currentMeal = 'breakfast2';
                    } else {
                        currentMeal = 'breakfast';
                        foundBreakfast = true;
                    }
                } else if (mealLower.includes('обед')) {
                    currentMeal = 'lunch';
                } else if (mealLower.includes('полдник')) {
                    currentMeal = 'afternoonSnack';
                } else if (mealLower.includes('ужин')) {
                    if (mealLower.includes('2') || mealLower.includes('второй')) {
                        currentMeal = 'dinner2';
                    } else {
                        currentMeal = 'dinner';
                    }
                } else if (mealLower.includes('итого') || mealLower.includes('среднее')) {
                    currentMeal = null;
                    continue;
                }
            }
            
            if (currentWeek && currentDay && currentMeal && currentMeal !== null) {
                let dishName = '';
                if (dishColumn !== -1 && row[dishColumn] !== undefined && row[dishColumn] !== null) {
                    dishName = row[dishColumn].toString().trim();
                }
                
                let section = '';
                if (sectionColumn !== -1 && row[sectionColumn] !== undefined && row[sectionColumn] !== null) {
                    section = row[sectionColumn].toString().trim();
                }
                
                if ((!dishName && !section) || 
                    (dishName && (dishName === '' || dishName.toLowerCase().includes('итого')))) {
                    continue;
                }
                
                if (dishName || section) {
                    let weightValue = '0';
                    let totalWeight = 0;
                    
                    if (weightColumn !== -1 && row[weightColumn] !== undefined && row[weightColumn] !== null) {
                        weightValue = row[weightColumn].toString().trim();
                        
                        if (weightValue.includes('/')) {
                            const weightParts = weightValue.split('/').map(part => {
                                const cleaned = part.trim();
                                return isNaN(parseFloat(cleaned)) ? 0 : parseFloat(cleaned);
                            });
                            totalWeight = weightParts.reduce((sum, part) => sum + part, 0);
                        } else {
                            totalWeight = isNaN(parseFloat(weightValue)) ? 0 : parseFloat(weightValue);
                        }
                    }
                    
                    const dish = {
                        section: normalizeSectionName(section),
                        originalSection: section,
                        name: dishName || section || 'Без названия',
                        weight: totalWeight,
                        originalWeight: weightValue,
                        proteins: parseFloat(row[6]) || 0,
                        fats: parseFloat(row[7]) || 0,
                        carbs: parseFloat(row[8]) || 0,
                        calories: parseFloat(row[9]) || 0,
                        recipeId: row[10] ? row[10].toString().trim() : '',
                        price: parseFloat(row[11]) || 0
                    };
                    
                    if (dish.name && dish.name.trim() !== '') {
                        if (templateMenuData.weeks[currentWeek] && 
                            templateMenuData.weeks[currentWeek][currentDay] &&
                            templateMenuData.weeks[currentWeek][currentDay][currentMeal]) {
                            
                            const existingItems = templateMenuData.weeks[currentWeek][currentDay][currentMeal].items;
                            const isDuplicate = existingItems.some(item => 
                                item.name === dish.name && item.section === dish.section
                            );
                            
                            if (!isDuplicate) {
                                templateMenuData.weeks[currentWeek][currentDay][currentMeal].items.push(dish);
                            }
                        }
                    }
                }
            }
        }
        
        for (const weekNum in templateMenuData.weeks) {
            const week = templateMenuData.weeks[weekNum];
            for (const dayNum in week) {
                const day = week[dayNum];
                for (const mealType in day) {
                    if (day[mealType] && day[mealType].items) {
                        day[mealType].items = sortMealItemsByStructure(day[mealType].items, mealType);
                    }
                }
            }
        }
        
        setState({ templateMenuData });
        showToast(`Типовое меню загружено: ${file.name}`, 'success');
        return true;
        
    } catch (error) {
        console.error('Template error:', error);
        showToast(`Ошибка загрузки меню: ${error.message}`, 'error');
        return false;
    }
}

// ========== ГЕНЕРАЦИЯ МЕНЮ ==========
function generateMenuForDate(date) {
    if (!calendarData || !templateMenuData) return null;
    
    const monthNames = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 
                       'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
    const monthName = monthNames[date.getMonth()];
    const day = date.getDate();
    
    const menuType = calendarData?.months?.[monthName]?.[day];
    if (!menuType) return null;
    
    const maxDayNumber = templateMenuData.maxDayNumber || 5;
    let weekNum = Math.ceil(menuType / maxDayNumber);
    let dayNum = menuType - (weekNum - 1) * maxDayNumber;
    
    if (!templateMenuData.weeks[weekNum] || !templateMenuData.weeks[weekNum][dayNum]) {
        if (templateMenuData.weeks[weekNum]) {
            const availableDays = Object.keys(templateMenuData.weeks[weekNum]).map(Number);
            if (availableDays.length > 0) {
                dayNum = availableDays.reduce((prev, curr) => {
                    return (Math.abs(curr - dayNum) < Math.abs(prev - dayNum) ? curr : prev);
                });
            } else {
                weekNum = 1;
                dayNum = 1;
            }
        } else {
            weekNum = 1;
            dayNum = 1;
        }
    }
    
    const templateDay = templateMenuData.weeks[weekNum]?.[dayNum];
    if (!templateDay) return null;
    
    const sortedDay = {};
    for (const mealType in templateDay) {
        if (templateDay[mealType] && templateDay[mealType].items) {
            sortedDay[mealType] = { items: [...templateDay[mealType].items] };
        } else {
            sortedDay[mealType] = { items: [] };
        }
    }
    
    return {
        date: new Date(date),
        dateString: formatDate(date),
        fileName: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-sm.xlsx`,
        schoolName: templateMenuData.schoolName || '',
        ageCategory: templateMenuData.ageCategory || '',
        weekNumber: weekNum,
        dayNumber: dayNum,
        menuType: menuType,
        ...sortedDay
    };
}

async function generateDailyMenus(startDate, endDate, onProgress) {
    if (!calendarData || !templateMenuData) {
        showToast('Загрузите оба файла', 'warning');
        return [];
    }
    
    const menus = [];
    let currentDate = new Date(startDate);
    let generatedCount = 0;
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    let processedDays = 0;
    
    while (currentDate <= endDate) {
        const menu = generateMenuForDate(currentDate);
        if (menu) {
            menus.push(menu);
            generatedCount++;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
        processedDays++;
        
        if (onProgress) {
            onProgress(processedDays, totalDays, generatedCount);
        }
    }
    
    return menus;
}

// ========== ЭКСПОРТ ==========
function createExcelData(menu) {
    const data = [];
    data.push(['Школа', menu.schoolName || '', '', '', 'Отд./корп', '', '', '', 'День', menu.dateString]);
    data.push(['', '', '', '', '', '', '', '', '', '']);
    data.push(['Прием пищи', 'Раздел', '№ рец.', 'Блюдо', 'Выход, г', 'Цена', 'Калорийность', 'Белки', 'Жиры', 'Углеводы']);
    
    const addMeal = (mealName, items) => {
        const mealItems = items || [];
        let isFirst = true;
        mealItems.forEach(item => {
            if (item.name && item.name.trim()) {
                data.push([
                    isFirst ? mealName : '',
                    item.originalSection || item.section || '',
                    item.recipeId || '',
                    item.name,
                    item.originalWeight || item.weight,
                    item.price || '',
                    item.calories || '',
                    item.proteins || '',
                    item.fats || '',
                    item.carbs || ''
                ]);
                isFirst = false;
            }
        });
        if (!isFirst) data.push(['', '', '', '', '', '', '', '', '', '']);
    };
    
    addMeal('Завтрак', menu.breakfast?.items);
    addMeal('Завтрак 2', menu.breakfast2?.items);
    addMeal('Обед', menu.lunch?.items);
    addMeal('Полдник', menu.afternoonSnack?.items);
    addMeal('Ужин', menu.dinner?.items);
    addMeal('Ужин 2', menu.dinner2?.items);
    
    return data;
}

async function exportAllMenusAsZip(menus) {
    if (!menus.length) {
        showToast('Нет меню для экспорта', 'warning');
        return;
    }
    
    try {
        showToast(`Создание ZIP архива с ${menus.length} файлами...`, 'info');
        
        const zip = new JSZip();
        for (let i = 0; i < menus.length; i++) {
            const menu = menus[i];
            const wsData = createExcelData(menu);
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            ws['!cols'] = [{wch:12},{wch:15},{wch:8},{wch:35},{wch:10},{wch:10},{wch:15},{wch:8},{wch:8},{wch:10}];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Меню');
            const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
            zip.file(menu.fileName, buffer);
        }
        
        const content = await zip.generateAsync({ type: "blob" });
        const zipFileName = `school-menus-${currentYear}-${formatDate(new Date(), 'file')}.zip`;
        saveAs(content, zipFileName);
        showToast(`ZIP архив "${zipFileName}" успешно создан`, 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast(`Ошибка: ${error.message}`, 'error');
    }
}

function exportCurrentMenuAsExcel(menu) {
    if (!menu) {
        showToast('Нет текущего меню', 'warning');
        return;
    }
    
    const wsData = createExcelData(menu);
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{wch:12},{wch:15},{wch:8},{wch:35},{wch:10},{wch:10},{wch:15},{wch:8},{wch:8},{wch:10}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Меню');
    XLSX.writeFile(wb, menu.fileName);
    showToast(`Меню экспортировано в файл ${menu.fileName}`, 'success');
}

function downloadTemplate() {
    const templateData = [
        ['Школа', 'МОУ "Примерная школа"', '', '', 'Отд./корп', 'Основной', '', '', 'День', formatDate(new Date(), 'excel')],
        ['', '', '', '', '', '', '', '', '', ''],
        ['Прием пищи', 'Раздел', '№ рец.', 'Блюдо', 'Выход, г', 'Цена', 'Калорийность', 'Белки', 'Жиры', 'Углеводы'],
        ['Завтрак', 'гор.блюдо', '123', 'Каша молочная рисовая', '200', '45.50', '150', '5', '3', '25'],
        ['', 'гор.напиток', '456', 'Чай с сахаром', '200', '10.00', '30', '0', '0', '8'],
        ['', 'хлеб', '789', 'Хлеб пшеничный', '50', '5.00', '120', '4', '1', '24'],
        ['', 'фрукты', '012', 'Яблоко', '100', '15.00', '52', '0', '0', '14'],
        ['Завтрак 2', 'фрукты', '345', 'Банан', '100', '20.00', '89', '1', '0', '23'],
        ['', '', '', '', '', '', '', '', '', ''],
        ['Обед', 'закуска', '678', 'Салат из свеклы', '100', '25.00', '60', '1', '3', '8'],
        ['', '1 блюдо', '901', 'Щи из свежей капусты', '250', '35.00', '80', '3', '4', '9'],
        ['', '2 блюдо', '234', 'Котлета мясная', '80', '45.00', '180', '15', '10', '8'],
        ['', 'гарнир', '567', 'Картофельное пюре', '150', '20.00', '130', '3', '5', '20'],
        ['', 'напиток', '890', 'Компот из сухофруктов', '200', '15.00', '85', '0', '0', '21'],
        ['', 'хлеб бел.', '789', 'Хлеб пшеничный', '50', '5.00', '120', '4', '1', '24'],
        ['', 'хлеб черн.', '789', 'Хлеб ржаной', '50', '5.00', '115', '4', '1', '23']
    ];
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    ws['!cols'] = [{wch:12},{wch:15},{wch:8},{wch:40},{wch:10},{wch:10},{wch:15},{wch:10},{wch:10},{wch:12}];
    XLSX.utils.book_append_sheet(wb, ws, 'Шаблон меню');
    XLSX.writeFile(wb, 'шаблон-ежедневного-меню.xlsx');
    showToast('Шаблон скачан', 'success');
}

// ========== АНАЛИТИКА ==========
function getAnalyticsData(menus) {
    if (!menus.length) return null;
    
    let totalCalories = 0, totalProteins = 0, totalFats = 0, totalCarbs = 0;
    const uniqueDishes = new Set();
    const dailyData = [];
    
    menus.forEach((menu) => {
        let dayCal = 0, dayProt = 0, dayFat = 0, dayCarb = 0;
        ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'].forEach(meal => {
            (menu[meal]?.items || []).forEach(item => {
                dayCal += item.calories || 0;
                dayProt += item.proteins || 0;
                dayFat += item.fats || 0;
                dayCarb += item.carbs || 0;
                uniqueDishes.add(item.name);
            });
        });
        totalCalories += dayCal;
        totalProteins += dayProt;
        totalFats += dayFat;
        totalCarbs += dayCarb;
        dailyData.push({ date: menu.dateString, calories: dayCal });
    });
    
    return {
        menuCount: menus.length,
        avgCalories: Math.round(totalCalories / menus.length),
        avgProteins: Math.round(totalProteins / menus.length),
        avgFats: Math.round(totalFats / menus.length),
        avgCarbs: Math.round(totalCarbs / menus.length),
        uniqueDishesCount: uniqueDishes.size,
        dailyData: dailyData,
        varietyScore: uniqueDishes.size / menus.length
    };
}

// ========== ПОИСК ==========
function searchDishes(menus, searchTerm) {
    if (!menus.length || !searchTerm) return [];
    
    const term = searchTerm.toLowerCase();
    const results = [];
    
    menus.forEach((menu, idx) => {
        ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'].forEach(meal => {
            (menu[meal]?.items || []).forEach(item => {
                if (item.name.toLowerCase().includes(term)) {
                    results.push({
                        date: menu.dateString,
                        meal: MEAL_TYPES[meal],
                        name: item.name,
                        menuIdx: idx
                    });
                }
            });
        });
    });
    
    return results;
}

// ========== ХРАНЕНИЕ ==========
function saveToLocalStorage(data) {
    const saveData = {
        calendarData,
        templateMenuData,
        dailyMenus: data.dailyMenus,
        uploadedFiles: data.uploadedFiles,
        currentYear,
        savedAt: new Date().toISOString()
    };
    
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
        return true;
    } catch (error) {
        console.error('Save error:', error);
        return false;
    }
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) return null;
        
        const parsed = JSON.parse(savedData);
        return {
            calendarData: parsed.calendarData,
            templateMenuData: parsed.templateMenuData,
            dailyMenus: parsed.dailyMenus || [],
            uploadedFiles: parsed.uploadedFiles || [],
            currentYear: parsed.currentYear || 2026
        };
    } catch (error) {
        console.error('Load error:', error);
        return null;
    }
}

function clearLocalStorage() {
    localStorage.removeItem(STORAGE_KEY);
}

// ========== ОСНОВНОЙ МОДУЛЬ ==========
export async function renderGenerator(container) {
    container.innerHTML = `
        <div class="generator-module">
            <!-- Верхняя панель -->
            <div class="app-container">
                <!-- Левая колонка -->
                <div class="card">
                    <h2 class="card-title"><i class="fas fa-upload"></i> Загрузка файлов ФЦМПО</h2>
                    
                    <div id="statusMessage" class="status-message" style="display: none;"></div>
                    
                    <div id="dropArea" class="file-upload-area">
                        <i class="fas fa-file-excel floating"></i>
                        <h3>Перетащите файлы Excel ФЦМПО сюда</h3>
                        <p>или нажмите для выбора файлов</p>
                        <p class="file-size">Требуемые файлы: kp2026.xlsx (календарь), tm2026-sm.xlsx (типовое меню)</p>
                        <input type="file" id="fileInput" class="file-input" multiple accept=".xlsx,.xls">
                    </div>
                    
                    <div id="fileList" class="file-list"></div>
                    
                    <div id="storedDataInfo" class="stored-data-info">
                        <h3><i class="fas fa-database"></i> Данные в памяти</h3>
                        <p id="storedDataText"></p>
                        <div class="buttons-container">
                            <button id="loadFromStorageBtn" class="btn btn-secondary btn-sm">
                                <i class="fas fa-download"></i> Загрузить
                            </button>
                            <button id="clearStorageBtn" class="btn btn-warning btn-sm">
                                <i class="fas fa-trash"></i> Очистить
                            </button>
                        </div>
                    </div>
                    
                    <div class="config-section">
                        <h2 class="card-title"><i class="fas fa-cog"></i> Настройки генерации</h2>
                        
                        <div class="year-selector">
                            <div class="year-badge" id="calendarYear">2026</div>
                            <div>Выберите период в пределах календарного года</div>
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fas fa-calendar-alt"></i> Начальная дата</label>
                            <input type="date" id="startDate" value="2026-01-01">
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fas fa-calendar-alt"></i> Конечная дата</label>
                            <input type="date" id="endDate" value="2026-01-31">
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fas fa-school"></i> Название школы</label>
                            <input type="text" id="schoolName" placeholder="Введите название школы">
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fas fa-user-friends"></i> Возрастная категория</label>
                            <select id="ageCategory">
                                <option value="7-11">7-11 лет</option>
                                <option value="12-18">12-18 лет</option>
                                <option value="1-3">1-3 года</option>
                                <option value="4-6">4-6 лет</option>
                            </select>
                        </div>
                        
                        <div class="buttons-container">
                            <button id="generateBtn" class="btn btn-primary" disabled>
                                <i class="fas fa-magic"></i> Создать меню
                            </button>
                            <button id="analyzeBtn" class="btn btn-info">
                                <i class="fas fa-chart-line"></i> Аналитика
                            </button>
                            <button id="searchBtn" class="btn btn-secondary">
                                <i class="fas fa-search"></i> Поиск
                            </button>
                        </div>
                        
                        <div class="export-options">
                            <button id="exportAllBtn" class="btn btn-success" disabled>
                                <i class="fas fa-download"></i> Экспорт всех (ZIP)
                            </button>
                            <button id="exportCurrentBtn" class="btn btn-secondary" disabled>
                                <i class="fas fa-file-excel"></i> Экспорт текущего
                            </button>
                            <button id="downloadTemplateBtn" class="btn btn-warning">
                                <i class="fas fa-file-download"></i> Шаблон
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Правая колонка -->
                <div class="card">
                    <h2 class="card-title"><i class="fas fa-eye"></i> Предпросмотр данных</h2>
                    
                    <div class="data-preview">
                        <div class="preview-title">Календарь питания</div>
                        <div id="calendarData">Загрузите файл календаря</div>
                    </div>
                    
                    <div class="data-preview">
                        <div class="preview-title">Типовое меню</div>
                        <div id="menuData">Загрузите файл типового меню</div>
                    </div>
                    
                    <div class="meal-structure-info">
                        <div class="preview-title"><i class="fas fa-list-ol"></i> Структура приемов пищи (СанПиН-3590)</div>
                        <div class="meal-structure-grid">
                            <div>🍳 Завтрак: гор.блюдо, гор.напиток, хлеб, фрукты</div>
                            <div>🍎 Завтрак 2: фрукты</div>
                            <div>🍲 Обед: закуска, 1 блюдо, 2 блюдо, гарнир, напиток, хлеб</div>
                            <div>🥨 Полдник: булочное, напиток</div>
                            <div>🌙 Ужин: гор.блюдо, гарнир, напиток, хлеб</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Результаты -->
            <div class="card" id="resultsCard" style="display: none;">
                <h2 class="card-title"><i class="fas fa-clipboard-list"></i> Сгенерированные меню</h2>
                
                <div id="menuNavigation" class="menu-navigation" style="display: none;">
                    <div class="nav-buttons">
                        <button id="prevMenuBtn" class="btn btn-secondary btn-sm">
                            <i class="fas fa-chevron-left"></i> Предыдущее
                        </button>
                        <button id="nextMenuBtn" class="btn btn-secondary btn-sm">
                            Следующее <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div id="menuCounter" class="menu-counter"></div>
                    <div class="nav-buttons">
                        <button id="toggleViewBtn" class="btn btn-info btn-sm">
                            <i class="fas fa-list"></i> Детальный вид
                        </button>
                        <button id="duplicateDayBtn" class="btn btn-warning btn-sm">
                            <i class="fas fa-copy"></i> Дублировать
                        </button>
                    </div>
                </div>
                
                <div id="menuStats" class="menu-stats" style="display: none;"></div>
                
                <div id="menuGrid" class="menu-grid"></div>
                
                <div id="dailyMenuContent" style="display: none;"></div>
            </div>
            
            <!-- Детальный просмотр -->
            <div id="detailedView" class="detailed-view" style="display: none;">
                <div class="detailed-view-header">
                    <h3 id="detailMenuDate"></h3>
                    <button id="closeDetailView" class="btn btn-secondary btn-sm">
                        <i class="fas fa-times"></i> Закрыть
                    </button>
                </div>
                
                <div class="meal-options" id="mealOptions">
                    <button class="meal-option-btn active" data-meal="all">Все приемы</button>
                    <button class="meal-option-btn" data-meal="breakfast">Завтрак</button>
                    <button class="meal-option-btn" data-meal="breakfast2">Завтрак 2</button>
                    <button class="meal-option-btn" data-meal="lunch">Обед</button>
                    <button class="meal-option-btn" data-meal="afternoonSnack">Полдник</button>
                    <button class="meal-option-btn" data-meal="dinner">Ужин</button>
                    <button class="meal-option-btn" data-meal="dinner2">Ужин 2</button>
                </div>
                
                <div id="detailMeals"></div>
                
                <div class="section-title"><i class="fas fa-chart-line"></i> Пищевая ценность</div>
                <canvas id="nutritionChart" style="max-height: 250px; width: 100%;"></canvas>
                
                <div class="section-title"><i class="fas fa-exchange-alt"></i> Калькулятор замены блюда</div>
                <div id="replacementCalculator" class="replacement-calc"></div>
            </div>
            
            <!-- Модальные окна -->
            <div id="searchModal" class="modal-overlay" style="display: none;"></div>
            <div id="editModal" class="modal-overlay" style="display: none;"></div>
            
            <!-- Прогресс -->
            <div id="progressContainer" class="progress-container" style="display: none;">
                <div class="progress-bar">
                    <div id="progressFill" class="progress-fill" style="width: 0%;"></div>
                </div>
                <div id="progressText" class="progress-text"></div>
            </div>
        </div>
    `;
    
    // Добавляем стили
    addStyles();
    
    // Инициализация
    attachEvents();
    loadStoredDataInfo();
}

function addStyles() {
    if (document.getElementById('generator-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'generator-styles';
    style.textContent = `
        .generator-module {
            animation: fadeIn 0.5s ease;
        }
        
        .app-container {
            display: grid;
            grid-template-columns: 1fr 1.2fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        @media (max-width: 1200px) {
            .app-container {
                grid-template-columns: 1fr;
            }
        }
        
        .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            padding: 25px;
            transition: all 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .card-title {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
            color: #2c3e50;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 12px;
        }
        
        .card-title i {
            font-size: 1.5rem;
            color: #3498db;
        }
        
        .file-upload-area {
            border: 3px dashed #bdc3c7;
            border-radius: 10px;
            padding: 40px 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        }
        
        .file-upload-area:hover, .file-upload-area.dragover {
            border-color: #3498db;
            background: rgba(52,152,219,0.05);
            transform: scale(1.02);
        }
        
        .file-upload-area i {
            font-size: 3rem;
            color: #3498db;
            margin-bottom: 15px;
        }
        
        .file-list {
            margin-top: 20px;
        }
        
        .file-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 8px;
            border-left: 4px solid #27ae60;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 6px;
            font-weight: 600;
            color: #2c3e50;
        }
        
        .form-group input, .form-group select {
            width: 100%;
            padding: 10px 12px;
            border: 2px solid #e0e6ed;
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        
        .form-group input:focus, .form-group select:focus {
            outline: none;
            border-color: #3498db;
        }
        
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(52,152,219,0.4);
        }
        
        .btn-success {
            background: linear-gradient(135deg, #27ae60, #219653);
            color: white;
        }
        
        .btn-success:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(39,174,96,0.4);
        }
        
        .btn-secondary {
            background: linear-gradient(135deg, #6c757d, #5a6268);
            color: white;
        }
        
        .btn-info {
            background: linear-gradient(135deg, #17a2b8, #138496);
            color: white;
        }
        
        .btn-warning {
            background: linear-gradient(135deg, #f39c12, #e67e22);
            color: white;
        }
        
        .btn-danger {
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
        }
        
        .btn-sm {
            padding: 6px 12px;
            font-size: 12px;
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .buttons-container, .export-options {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 15px;
        }
        
        .data-preview {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e0e6ed;
        }
        
        .preview-title {
            font-weight: 700;
            margin-bottom: 10px;
            color: #2c3e50;
        }
        
        .meal-structure-info {
            margin-top: 20px;
            padding: 15px;
            background: #e8f4fc;
            border-radius: 8px;
        }
        
        .meal-structure-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 8px;
            font-size: 13px;
        }
        
        .status-message {
            padding: 12px 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            animation: slideIn 0.3s ease;
        }
        
        .status-success {
            background: #d4edda;
            color: #155724;
            border-left: 4px solid #27ae60;
        }
        
        .status-error {
            background: #f8d7da;
            color: #721c24;
            border-left: 4px solid #e74c3c;
        }
        
        .status-info {
            background: #d1ecf1;
            color: #0c5460;
            border-left: 4px solid #17a2b8;
        }
        
        .status-warning {
            background: #fff3cd;
            color: #856404;
            border-left: 4px solid #f39c12;
        }
        
        .menu-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .menu-card {
            border: 2px solid #e0e6ed;
            border-radius: 10px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.3s ease;
            background: white;
        }
        
        .menu-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            border-color: #3498db;
        }
        
        .menu-card.active {
            border-color: #3498db;
            box-shadow: 0 0 0 3px rgba(52,152,219,0.2);
        }
        
        .menu-card-header {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .menu-card-date {
            font-weight: 600;
        }
        
        .menu-card-type {
            background: rgba(255,255,255,0.2);
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
        }
        
        .menu-card-content {
            padding: 15px;
        }
        
        .menu-navigation {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        
        .nav-buttons {
            display: flex;
            gap: 10px;
        }
        
        .menu-counter {
            font-weight: 700;
            color: #2c3e50;
        }
        
        .menu-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .stat-item {
            background: linear-gradient(135deg, #f0f7ff, #e1f0ff);
            padding: 12px 15px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }
        
        .stat-label {
            font-size: 12px;
            color: #6c757d;
            margin-bottom: 5px;
        }
        
        .stat-value {
            font-weight: 700;
            font-size: 18px;
            color: #2c3e50;
        }
        
        .detailed-view {
            margin-top: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            border: 2px solid #e0e6ed;
        }
        
        .detailed-view-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #e0e6ed;
        }
        
        .meal-options {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 20px;
        }
        
        .meal-option-btn {
            padding: 8px 16px;
            background: #e8f4fc;
            border: 1px solid #b6d4fe;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .meal-option-btn.active {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            border-color: #3498db;
        }
        
        .menu-items {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .menu-item {
            border: 1px solid #e0e6ed;
            border-radius: 8px;
            padding: 12px;
            background: white;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        
        .menu-item:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            border-color: #3498db;
        }
        
        .item-name {
            font-weight: 600;
            margin-bottom: 8px;
            color: #2c3e50;
        }
        
        .item-details {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #6c757d;
            margin-top: 5px;
        }
        
        .section-title {
            background: #f8f9fa;
            padding: 10px 15px;
            border-radius: 8px;
            margin: 15px 0;
            font-weight: 600;
            color: #2c3e50;
            border-left: 4px solid #3498db;
        }
        
        .season-badge {
            background: #27ae60;
            color: white;
            border-radius: 20px;
            padding: 2px 8px;
            font-size: 10px;
            margin-left: 8px;
        }
        
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        }
        
        .modal-content {
            background: white;
            border-radius: 12px;
            padding: 25px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .progress-container {
            margin-top: 20px;
        }
        
        .progress-bar {
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #27ae60, #3498db);
            width: 0%;
            transition: width 0.3s ease;
        }
        
        .progress-text {
            text-align: center;
            margin-top: 8px;
            font-size: 13px;
            color: #6c757d;
        }
        
        .replacement-calc {
            padding: 15px;
            background: white;
            border-radius: 8px;
            margin-top: 10px;
        }
        
        .year-selector {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .year-badge {
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: 600;
        }
        
        .stored-data-info {
            background: #e8f4fc;
            border: 1px solid #b6d4fe;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            display: none;
        }
        
        .floating {
            animation: floating 3s ease-in-out infinite;
        }
        
        @keyframes floating {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
}

function attachEvents() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    
    if (dropArea) {
        dropArea.addEventListener('click', () => fileInput?.click());
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.classList.add('dragover');
        });
        dropArea.addEventListener('dragleave', () => {
            dropArea.classList.remove('dragover');
        });
        dropArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropArea.classList.remove('dragover');
            await handleFiles(Array.from(e.dataTransfer.files));
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            await handleFiles(Array.from(e.target.files));
        });
    }
    
    document.getElementById('generateBtn')?.addEventListener('click', startGeneration);
    document.getElementById('analyzeBtn')?.addEventListener('click', showAnalytics);
    document.getElementById('searchBtn')?.addEventListener('click', showSearch);
    document.getElementById('exportAllBtn')?.addEventListener('click', () => exportAllMenusAsZip(dailyMenus));
    document.getElementById('exportCurrentBtn')?.addEventListener('click', () => exportCurrentMenuAsExcel(dailyMenus[currentMenuIndex]));
    document.getElementById('downloadTemplateBtn')?.addEventListener('click', downloadTemplate);
    document.getElementById('loadFromStorageBtn')?.addEventListener('click', loadStoredData);
    document.getElementById('clearStorageBtn')?.addEventListener('click', clearStoredData);
    document.getElementById('prevMenuBtn')?.addEventListener('click', () => navigateMenus(-1));
    document.getElementById('nextMenuBtn')?.addEventListener('click', () => navigateMenus(1));
    document.getElementById('toggleViewBtn')?.addEventListener('click', toggleView);
    document.getElementById('duplicateDayBtn')?.addEventListener('click', duplicateCurrentMenu);
    document.getElementById('closeDetailView')?.addEventListener('click', closeDetailedView);
    
    const mealOptions = document.getElementById('mealOptions');
    if (mealOptions) {
        mealOptions.addEventListener('click', (e) => {
            const btn = e.target.closest('.meal-option-btn');
            if (btn) {
                document.querySelectorAll('#mealOptions .meal-option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentMealFilter = btn.dataset.meal;
                if (detailedViewVisible && dailyMenus[currentMenuIndex]) {
                    updateMealsDisplay(dailyMenus[currentMenuIndex]);
                }
            }
        });
    }
}

async function handleFiles(files) {
    for (const file of files) {
        if (!file.name.match(/\.(xls|xlsx)$/)) {
            showStatus(`Файл ${file.name} не является Excel`, 'error');
            continue;
        }
        
        const fileName = file.name.toLowerCase();
        let success = false;
        
        if (fileName.includes('kp') && file.name.match(/\d{4}/)) {
            success = await processCalendarFile(file);
            if (success) uploadedFiles.push({ name: file.name, size: file.size, type: 'calendar' });
        } else if (fileName.includes('tm') && fileName.includes('-sm')) {
            success = await processTemplateFile(file);
            if (success) uploadedFiles.push({ name: file.name, size: file.size, type: 'template' });
        } else {
            showStatus(`Неизвестный тип: ${file.name}`, 'warning');
        }
    }
    
    updateFileList();
    updateCalendarPreview();
    updateMenuPreview();
    updateUI();
    saveCurrentState();
}

function updateFileList() {
    const container = document.getElementById('fileList');
    if (!container) return;
    
    if (uploadedFiles.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d;">Файлы не загружены</p>';
        return;
    }
    
    container.innerHTML = uploadedFiles.map(file => `
        <div class="file-item">
            <div>
                <i class="fas ${file.type === 'calendar' ? 'fa-calendar-alt' : 'fa-utensils'}"></i>
                <strong>${escapeHtml(file.name)}</strong>
                <div style="font-size: 12px; color: #6c757d;">${file.type === 'calendar' ? 'Календарь' : 'Типовое меню'} • ${formatFileSize(file.size)}</div>
            </div>
            <i class="fas fa-check-circle" style="color: #27ae60;"></i>
        </div>
    `).join('');
}

function updateCalendarPreview() {
    const container = document.getElementById('calendarData');
    if (!container) return;
    
    if (!calendarData) {
        container.innerHTML = '<p style="color: #e74c3c;">Календарь не загружен</p>';
        return;
    }
    
    let daysWithMenu = 0;
    for (const month of Object.values(calendarData.months || {})) {
        daysWithMenu += Object.keys(month).length;
    }
    
    container.innerHTML = `
        <p><strong>Год:</strong> ${calendarData.year || 2026}</p>
        <p><strong>Месяцев:</strong> ${Object.keys(calendarData.months || {}).length}</p>
        <p><strong>Дней с меню:</strong> ${daysWithMenu}</p>
        ${calendarData.schoolName ? `<p><strong>Школа:</strong> ${escapeHtml(calendarData.schoolName)}</p>` : ''}
    `;
}

function updateMenuPreview() {
    const container = document.getElementById('menuData');
    if (!container) return;
    
    if (!templateMenuData) {
        container.innerHTML = '<p style="color: #e74c3c;">Меню не загружено</p>';
        return;
    }
    
    let totalDishes = 0;
    for (const week of Object.values(templateMenuData.weeks || {})) {
        for (const day of Object.values(week)) {
            for (const meal of Object.values(day)) {
                totalDishes += meal?.items?.length || 0;
            }
        }
    }
    
    container.innerHTML = `
        <p><strong>Недель:</strong> ${Object.keys(templateMenuData.weeks || {}).length}</p>
        <p><strong>Всего блюд:</strong> ${totalDishes}</p>
        ${templateMenuData.schoolName ? `<p><strong>Школа:</strong> ${escapeHtml(templateMenuData.schoolName)}</p>` : ''}
        ${templateMenuData.ageCategory ? `<p><strong>Возраст:</strong> ${escapeHtml(templateMenuData.ageCategory)}</p>` : ''}
    `;
}

function updateUI() {
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) generateBtn.disabled = !(calendarData && templateMenuData);
    
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
    statusDiv.className = `status-message status-${type}`;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 4000);
}

async function startGeneration() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    
    if (startDate > endDate) {
        showStatus('Начальная дата не может быть позже конечной', 'error');
        return;
    }
    
    const generateBtn = document.getElementById('generateBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="loading"></span> Генерация...';
    progressContainer.style.display = 'block';
    
    const menus = await generateDailyMenus(startDate, endDate, (processed, total, generated) => {
        const percent = (processed / total) * 100;
        progressFill.style.width = `${percent}%`;
        progressText.textContent = `Обработано ${processed} из ${total} дней. Сгенерировано: ${generated} меню`;
    });
    
    dailyMenus = menus;
    setState({ dailyMenus: menus });
    
    progressContainer.style.display = 'none';
    generateBtn.innerHTML = '<i class="fas fa-magic"></i> Создать меню';
    generateBtn.disabled = false;
    
    if (dailyMenus.length > 0) {
        showStatus(`Сгенерировано ${dailyMenus.length} меню`, 'success');
        renderResults();
        saveCurrentState();
    } else {
        showStatus('Не удалось сгенерировать меню', 'warning');
    }
}

function renderResults() {
    const resultsCard = document.getElementById('resultsCard');
    const menuNavigation = document.getElementById('menuNavigation');
    const menuStats = document.getElementById('menuStats');
    const menuGrid = document.getElementById('menuGrid');
    
    resultsCard.style.display = 'block';
    menuNavigation.style.display = 'flex';
    menuStats.style.display = 'flex';
    menuGrid.style.display = 'grid';
    detailedViewVisible = false;
    document.getElementById('detailedView').style.display = 'none';
    
    updateMenuGrid();
    updateMenuStats();
    updateUI();
}

function updateMenuGrid() {
    const menuGrid = document.getElementById('menuGrid');
    if (!menuGrid) return;
    
    if (dailyMenus.length === 0) {
        menuGrid.innerHTML = '<div style="text-align: center; padding: 40px;">Нет сгенерированных меню</div>';
        return;
    }
    
    menuGrid.innerHTML = dailyMenus.map((menu, index) => {
        const breakfastCount = menu.breakfast?.items?.length || 0;
        const lunchCount = menu.lunch?.items?.length || 0;
        const headerColor = MENU_TYPE_COLORS[menu.menuType] || '#3498db';
        
        return `
            <div class="menu-card ${index === currentMenuIndex ? 'active' : ''}" data-index="${index}" onclick="window.selectMenu && window.selectMenu(${index})">
                <div class="menu-card-header" style="background: linear-gradient(135deg, ${headerColor}, ${adjustColor(headerColor, -20)});">
                    <div class="menu-card-date">${menu.dateString}</div>
                    <div class="menu-card-type">Меню ${menu.menuType}</div>
                </div>
                <div class="menu-card-content">
                    <div><i class="fas fa-sun"></i> Завтрак: ${breakfastCount} блюд</div>
                    <div style="margin-top: 8px;"><i class="fas fa-utensils"></i> Обед: ${lunchCount} блюд</div>
                    <div style="margin-top: 8px;"><i class="fas fa-chart-line"></i> Неделя ${menu.weekNumber}, День ${menu.dayNumber}</div>
                </div>
            </div>
        `;
    }).join('');
    
    window.selectMenu = (index) => {
        currentMenuIndex = index;
        document.querySelectorAll('.menu-card').forEach(card => card.classList.remove('active'));
        const selectedCard = document.querySelector(`.menu-card[data-index="${index}"]`);
        if (selectedCard) selectedCard.classList.add('active');
        showDetailedView();
    };
}

function showDetailedView() {
    if (dailyMenus.length === 0 || currentMenuIndex >= dailyMenus.length) return;
    
    const menu = dailyMenus[currentMenuIndex];
    const detailMenuDate = document.getElementById('detailMenuDate');
    const detailedView = document.getElementById('detailedView');
    const menuGrid = document.getElementById('menuGrid');
    
    detailMenuDate.textContent = `${menu.dateString} (Меню ${menu.menuType}) | Школа: ${menu.schoolName || '—'} | ${menu.ageCategory || '—'} лет`;
    
    updateMealsDisplay(menu);
    updateNutritionChart(menu);
    updateReplacementCalculator(menu);
    
    menuGrid.style.display = 'none';
    detailedView.style.display = 'block';
    detailedViewVisible = true;
}

function updateMealsDisplay(menu) {
    const detailMeals = document.getElementById('detailMeals');
    if (!detailMeals) return;
    
    const mealsToShow = currentMealFilter === 'all' ? Object.keys(MEAL_TYPES) : [currentMealFilter];
    
    let html = '';
    for (const mealType of mealsToShow) {
        const mealTitle = MEAL_TYPES[mealType];
        const items = menu[mealType]?.items || [];
        const icon = getMealIcon(mealType);
        const color = getMealColor(mealType);
        
        let itemsHtml = '';
        items.forEach(item => {
            const seasonAlert = checkSeasonality(item.name, menu.date);
            itemsHtml += `
                <div class="menu-item" ondblclick="window.editDish && window.editDish(${currentMenuIndex}, '${mealType}', '${escapeHtml(item.name)}')">
                    <div class="item-name">
                        ${escapeHtml(item.name)}
                        ${seasonAlert ? `<span class="season-badge"><i class="fas fa-leaf"></i> Не сезон!</span>` : ''}
                    </div>
                    <div class="item-details">
                        <span>${escapeHtml(item.section || 'Блюдо')}</span>
                        <span>${item.weight} г</span>
                    </div>
                    <div class="item-details">
                        <span>Б: ${item.proteins || 0}г</span>
                        <span>Ж: ${item.fats || 0}г</span>
                        <span>У: ${item.carbs || 0}г</span>
                        <span>${item.calories || 0} ккал</span>
                    </div>
                    <div class="item-details">
                        <span>${item.price || 0} ₽</span>
                        <span><i class="fas fa-edit" style="cursor:pointer; color:#3498db;"></i></span>
                    </div>
                </div>
            `;
        });
        
        if (itemsHtml === '') {
            itemsHtml = '<div style="padding: 20px; text-align: center; color: #6c757d;">Нет блюд</div>';
        }
        
        html += `
            <div style="margin-bottom: 25px;">
                <div class="section-title" style="display: flex; justify-content: space-between; align-items: center;">
                    <span><i class="fas ${icon}" style="color: ${color};"></i> ${mealTitle}</span>
                    <button class="btn btn-secondary btn-sm" onclick="window.addDishToMeal && window.addDishToMeal(${currentMenuIndex}, '${mealType}')">
                        <i class="fas fa-plus"></i> Добавить
                    </button>
                </div>
                <div class="menu-items">
                    ${itemsHtml}
                </div>
            </div>
        `;
    }
    
    detailMeals.innerHTML = html;
}

function updateNutritionChart(menu) {
    const canvas = document.getElementById('nutritionChart');
    if (!canvas) return;
    
    let calories = 0, proteins = 0, fats = 0, carbs = 0;
    
    ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'].forEach(meal => {
        (menu[meal]?.items || []).forEach(item => {
            calories += item.calories || 0;
            proteins += item.proteins || 0;
            fats += item.fats || 0;
            carbs += item.carbs || 0;
        });
    });
    
    if (nutritionChart) nutritionChart.destroy();
    
    const ctx = canvas.getContext('2d');
    nutritionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Калории, ккал', 'Белки, г', 'Жиры, г', 'Углеводы, г'],
            datasets: [{
                label: 'Пищевая ценность',
                data: [calories, proteins, fats, carbs],
                backgroundColor: ['rgba(52,152,219,0.6)', 'rgba(46,204,113,0.6)', 'rgba(241,196,15,0.6)', 'rgba(231,76,60,0.6)']
            }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
}

function updateReplacementCalculator(menu) {
    const container = document.getElementById('replacementCalculator');
    if (!container) return;
    
    let options = '<option value="">Выберите блюдо для замены</option>';
    ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'].forEach(meal => {
        (menu[meal]?.items || []).forEach(item => {
            options += `<option value="${meal}|${escapeHtml(item.name)}">${MEAL_TYPES[meal]}: ${escapeHtml(item.name)} (${item.weight}г, ${item.calories}ккал)</option>`;
        });
    });
    
    container.innerHTML = `
        <select id="replaceSelect" style="width:100%; padding:8px; margin:10px 0; border-radius:6px; border:1px solid #ddd;">
            ${options}
        </select>
        <input type="text" id="newDishName" placeholder="Название нового блюда" style="width:100%; padding:8px; margin:10px 0; border-radius:6px; border:1px solid #ddd;">
        <input type="number" id="newDishWeight" placeholder="Вес, г" style="width:100%; padding:8px; margin:10px 0; border-radius:6px; border:1px solid #ddd;">
        <button class="btn btn-primary" onclick="window.calculateReplacement()" style="width:100%;">Рассчитать изменения</button>
        <div id="replacementResult" style="margin-top:10px;"></div>
    `;
}

window.calculateReplacement = function() {
    const select = document.getElementById('replaceSelect');
    const newName = document.getElementById('newDishName').value;
    const newWeight = parseFloat(document.getElementById('newDishWeight').value);
    
    if (!select.value || !newName || !newWeight) {
        document.getElementById('replacementResult').innerHTML = '<div class="status-error">Заполните все поля</div>';
        return;
    }
    
    const [mealType, oldName] = select.value.split('|');
    const menu = dailyMenus[currentMenuIndex];
    const oldItem = menu[mealType]?.items?.find(i => i.name === oldName);
    
    if (oldItem) {
        const oldCalories = oldItem.calories || 0;
        const newCalories = (newWeight / (oldItem.weight || 1)) * oldCalories;
        const weightChange = ((newWeight - oldItem.weight) / oldItem.weight * 100).toFixed(1);
        const calorieChange = ((newCalories - oldCalories) / oldCalories * 100).toFixed(1);
        
        document.getElementById('replacementResult').innerHTML = `
            <div class="status-success">
                <strong>Изменения:</strong><br>
                Вес: ${oldItem.weight}г → ${newWeight}г (${weightChange}%)<br>
                Калории: ${oldCalories} → ${newCalories.toFixed(0)} ккал (${calorieChange}%)<br>
                <button class="btn btn-primary" style="margin-top:10px" onclick="window.applyReplacement('${mealType}','${escapeHtml(oldName)}','${escapeHtml(newName)}',${newWeight})">
                    Применить замену
                </button>
            </div>
        `;
    }
};

window.applyReplacement = function(mealType, oldName, newName, newWeight) {
    const menu = dailyMenus[currentMenuIndex];
    const item = menu[mealType]?.items?.find(i => i.name === oldName);
    if (item) {
        item.name = newName;
        item.weight = newWeight;
        item.calories = (newWeight / (item.weight || 1)) * (item.calories || 0);
        saveCurrentState();
        updateMealsDisplay(menu);
        updateNutritionChart(menu);
        showStatus('Блюдо заменено', 'success');
        document.getElementById('replacementResult').innerHTML = '';
    }
};

window.editDish = function(menuIdx, mealType, dishName) {
    const menu = dailyMenus[menuIdx];
    const dish = menu[mealType]?.items?.find(d => d.name === dishName);
    if (!dish) return;
    
    const modal = document.getElementById('editModal');
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header" style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <h3><i class="fas fa-edit"></i> Редактирование</h3>
                <button class="close-btn" onclick="window.closeModal('editModal')" style="background:none; border:none; font-size:24px; cursor:pointer;">&times;</button>
            </div>
            <label>Название:</label>
            <input type="text" id="editName" value="${escapeHtml(dish.name)}" style="width:100%; padding:8px; margin:8px 0; border-radius:6px; border:1px solid #ddd;">
            <label>Раздел:</label>
            <input type="text" id="editSection" value="${escapeHtml(dish.section || '')}" style="width:100%; padding:8px; margin:8px 0; border-radius:6px; border:1px solid #ddd;">
            <label>Вес (г):</label>
            <input type="number" id="editWeight" value="${dish.weight}" style="width:100%; padding:8px; margin:8px 0; border-radius:6px; border:1px solid #ddd;">
            <label>Калории:</label>
            <input type="number" id="editCalories" value="${dish.calories || 0}" style="width:100%; padding:8px; margin:8px 0; border-radius:6px; border:1px solid #ddd;">
            <label>Белки:</label>
            <input type="number" id="editProteins" value="${dish.proteins || 0}" style="width:100%; padding:8px; margin:8px 0; border-radius:6px; border:1px solid #ddd;">
            <label>Жиры:</label>
            <input type="number" id="editFats" value="${dish.fats || 0}" style="width:100%; padding:8px; margin:8px 0; border-radius:6px; border:1px solid #ddd;">
            <label>Углеводы:</label>
            <input type="number" id="editCarbs" value="${dish.carbs || 0}" style="width:100%; padding:8px; margin:8px 0; border-radius:6px; border:1px solid #ddd;">
            <label>Цена:</label>
            <input type="number" id="editPrice" value="${dish.price || 0}" style="width:100%; padding:8px; margin:8px 0; border-radius:6px; border:1px solid #ddd;">
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn btn-primary" onclick="window.saveDishEdit(${menuIdx}, '${mealType}', '${escapeHtml(dishName)}')">Сохранить</button>
                <button class="btn btn-danger" onclick="window.deleteDish(${menuIdx}, '${mealType}', '${escapeHtml(dishName)}')">Удалить</button>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
};

window.saveDishEdit = function(menuIdx, mealType, oldName) {
    const menu = dailyMenus[menuIdx];
    const dish = menu[mealType]?.items?.find(d => d.name === oldName);
    if (dish) {
        dish.name = document.getElementById('editName').value;
        dish.section = document.getElementById('editSection').value;
        dish.weight = parseFloat(document.getElementById('editWeight').value);
        dish.calories = parseFloat(document.getElementById('editCalories').value);
        dish.proteins = parseFloat(document.getElementById('editProteins').value);
        dish.fats = parseFloat(document.getElementById('editFats').value);
        dish.carbs = parseFloat(document.getElementById('editCarbs').value);
        dish.price = parseFloat(document.getElementById('editPrice').value);
        
        saveCurrentState();
        updateMealsDisplay(menu);
        updateNutritionChart(menu);
        window.closeModal('editModal');
        showStatus('Блюдо сохранено', 'success');
    }
};

window.deleteDish = function(menuIdx, mealType, dishName) {
    if (confirm('Удалить это блюдо?')) {
        const menu = dailyMenus[menuIdx];
        const index = menu[mealType]?.items?.findIndex(d => d.name === dishName);
        if (index !== undefined && index !== -1) {
            menu[mealType].items.splice(index, 1);
            saveCurrentState();
            updateMealsDisplay(menu);
            updateNutritionChart(menu);
            window.closeModal('editModal');
            showStatus('Блюдо удалено', 'success');
        }
    }
};

window.addDishToMeal = function(menuIdx, mealType) {
    const newDish = {
        name: 'Новое блюдо',
        section: '',
        weight: 100,
        calories: 150,
        proteins: 5,
        fats: 5,
        carbs: 20,
        price: 0,
        recipeId: ''
    };
    if (!dailyMenus[menuIdx][mealType]) dailyMenus[menuIdx][mealType] = { items: [] };
    dailyMenus[menuIdx][mealType].items.push(newDish);
    saveCurrentState();
    updateMealsDisplay(dailyMenus[menuIdx]);
    updateNutritionChart(dailyMenus[menuIdx]);
    window.editDish(menuIdx, mealType, 'Новое блюдо');
};

window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
};

function closeDetailedView() {
    const detailedView = document.getElementById('detailedView');
    const menuGrid = document.getElementById('menuGrid');
    
    detailedView.style.display = 'none';
    menuGrid.style.display = 'grid';
    detailedViewVisible = false;
}

function navigateMenus(direction) {
    if (!dailyMenus.length) return;
    currentMenuIndex = (currentMenuIndex + direction + dailyMenus.length) % dailyMenus.length;
    if (detailedViewVisible) {
        showDetailedView();
    } else {
        updateMenuGrid();
    }
    updateMenuStats();
}

function toggleView() {
    const toggleBtn = document.getElementById('toggleViewBtn');
    
    if (detailedViewVisible) {
        closeDetailedView();
        toggleBtn.innerHTML = '<i class="fas fa-list"></i> Детальный вид';
    } else if (dailyMenus.length) {
        showDetailedView();
        toggleBtn.innerHTML = '<i class="fas fa-th"></i> Сетка';
    }
}

function duplicateCurrentMenu() {
    if (!dailyMenus.length) return;
    
    const newMenu = deepClone(dailyMenus[currentMenuIndex]);
    const newDate = new Date(newMenu.date);
    newDate.setDate(newDate.getDate() + 1);
    newMenu.date = newDate;
    newMenu.dateString = formatDate(newDate);
    newMenu.fileName = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}-sm.xlsx`;
    
    dailyMenus.splice(currentMenuIndex + 1, 0, newMenu);
    saveCurrentState();
    updateMenuGrid();
    updateMenuStats();
    showStatus('Меню дублировано', 'success');
}

function updateMenuStats() {
    if (!dailyMenus.length) {
        const menuStats = document.getElementById('menuStats');
        if (menuStats) menuStats.style.display = 'none';
        return;
    }
    
    const menuCounterSpan = document.getElementById('menuCounter');
    const menuStatsDiv = document.getElementById('menuStats');
    
    if (menuCounterSpan) menuCounterSpan.textContent = `${currentMenuIndex + 1} из ${dailyMenus.length}`;
    
    if (menuStatsDiv) {
        const firstDate = dailyMenus[0].dateString;
        const lastDate = dailyMenus[dailyMenus.length - 1].dateString;
        menuStatsDiv.innerHTML = `
            <div class="stat-item"><div class="stat-label">Всего меню</div><div class="stat-value">${dailyMenus.length}</div></div>
            <div class="stat-item"><div class="stat-label">Период</div><div class="stat-value">${firstDate} - ${lastDate}</div></div>
            <div class="stat-item"><div class="stat-label">Школа</div><div class="stat-value">${escapeHtml(dailyMenus[0].schoolName || '—')}</div></div>
        `;
    }
}

function showAnalytics() {
    if (!dailyMenus.length) {
        showStatus('Нет данных для анализа', 'warning');
        return;
    }
    
    const analytics = getAnalyticsData(dailyMenus);
    if (!analytics) return;
    
    const modal = document.getElementById('searchModal');
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header" style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <h3><i class="fas fa-chart-line"></i> Аналитика</h3>
                <button class="close-btn" onclick="window.closeModal('searchModal')" style="background:none; border:none; font-size:24px; cursor:pointer;">&times;</button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-bottom: 15px;">
                <div class="stat-item"><div class="stat-label">Всего меню</div><div class="stat-value">${analytics.menuCount}</div></div>
                <div class="stat-item"><div class="stat-label">Средняя калорийность</div><div class="stat-value">${analytics.avgCalories} ккал</div></div>
                <div class="stat-item"><div class="stat-label">Уникальных блюд</div><div class="stat-value">${analytics.uniqueDishesCount}</div></div>
                <div class="stat-item"><div class="stat-label">Белки/Жиры/Углеводы</div><div class="stat-value">${analytics.avgProteins}/${analytics.avgFats}/${analytics.avgCarbs} г</div></div>
            </div>
            ${analytics.varietyScore < 3 ? '<div class="status-warning">⚠️ Низкое разнообразие блюд!</div>' : ''}
            <div class="section-title"><i class="fas fa-leaf"></i> Сезонные рекомендации</div>
            <div style="padding: 10px; background: #f8f9fa; border-radius: 8px;">
                <ul style="margin: 0; padding-left: 20px;">
                    <li>Используйте сезонные овощи и фрукты</li>
                    <li>Зимой увеличьте витамин С (цитрусовые)</li>
                    <li>Летом добавляйте свежую зелень и ягоды</li>
                </ul>
            </div>
            <button class="btn btn-primary" style="width:100%; margin-top:15px;" onclick="window.closeModal('searchModal')">Закрыть</button>
        </div>
    `;
    modal.style.display = 'flex';
}

function showSearch() {
    if (!dailyMenus.length) {
        showStatus('Нет меню для поиска', 'warning');
        return;
    }
    
    const modal = document.getElementById('searchModal');
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header" style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <h3><i class="fas fa-search"></i> Поиск блюд</h3>
                <button class="close-btn" onclick="window.closeModal('searchModal')" style="background:none; border:none; font-size:24px; cursor:pointer;">&times;</button>
            </div>
            <input type="text" id="searchInput" placeholder="Введите название блюда..." style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd; margin-bottom: 15px;">
            <div id="searchResults"></div>
        </div>
    `;
    modal.style.display = 'flex';
    
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const term = e.target.value;
        if (term.length < 2) {
            document.getElementById('searchResults').innerHTML = '<div class="status-info">Введите минимум 2 символа</div>';
            return;
        }
        
        const results = searchDishes(dailyMenus, term);
        const resultsDiv = document.getElementById('searchResults');
        
        if (results.length) {
            resultsDiv.innerHTML = results.map(r => `
                <div style="cursor:pointer; padding: 10px; margin-bottom: 8px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #3498db;" onclick="window.selectMenu && window.selectMenu(${r.menuIdx}); window.closeModal('searchModal');">
                    <div><strong>${r.date}</strong> - ${r.meal}</div>
                    <div>${escapeHtml(r.name)}</div>
                </div>
            `).join('');
        } else {
            resultsDiv.innerHTML = '<div class="status-info">Ничего не найдено</div>';
        }
    });
}

function saveCurrentState() {
    saveToLocalStorage({
        dailyMenus: dailyMenus,
        uploadedFiles: uploadedFiles
    });
    loadStoredDataInfo();
}

function loadStoredDataInfo() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const storedInfo = document.getElementById('storedDataInfo');
    const storedText = document.getElementById('storedDataText');
    
    if (savedData && storedInfo && storedText) {
        try {
            const parsed = JSON.parse(savedData);
            storedInfo.style.display = 'block';
            storedText.textContent = `Сохранено ${parsed.savedAt ? new Date(parsed.savedAt).toLocaleString() : 'ранее'}. ${parsed.dailyMenus?.length || 0} меню.`;
        } catch (e) {
            storedInfo.style.display = 'none';
        }
    } else if (storedInfo) {
        storedInfo.style.display = 'none';
    }
}

function loadStoredData() {
    const data = loadFromLocalStorage();
    if (data) {
        calendarData = data.calendarData;
        templateMenuData = data.templateMenuData;
        dailyMenus = data.dailyMenus || [];
        uploadedFiles = data.uploadedFiles || [];
        currentYear = data.currentYear || 2026;
        
        updateFileList();
        updateCalendarPreview();
        updateMenuPreview();
        updateUI();
        
        if (dailyMenus.length) renderResults();
        
        showStatus('Данные загружены', 'success');
    } else {
        showStatus('Нет сохранённых данных', 'info');
    }
}

function clearStoredData() {
    if (confirm('Очистить все сохранённые данные?')) {
        clearLocalStorage();
        uploadedFiles = [];
        dailyMenus = [];
        updateFileList();
        updateUI();
        loadStoredDataInfo();
        showStatus('Данные очищены', 'info');
    }
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
    loadStoredDataInfo();
    
    if (dailyMenus.length) renderResults();
    
    console.log('Generator PRO module initialized');
}
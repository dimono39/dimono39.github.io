import { getState, setState } from '../core/state-manager.js';
import { escapeHtml, escapeAttr, deepClone, normalizeSection as utilsNormalizeSection, showToast } from '../core/utils.js';

// Глобальные переменные модуля
let currentTemplateData = null;
let originalTemplateData = null;
let flatItems = [];
let allViolations = [];
let schoolInfo = { name: "", ageCategory: "7-11 лет", approval: { position: "Директор", name: "", date: "12.01.2026" } };
let historyStack = [];
let historyIndex = -1;
let isUndoRedo = false;
let autoSaveInterval = null;
let currentSearchTerm = '';
let currentMealFilter = '';
let currentStatusFilter = '';

// Константы
const VALID_SECTIONS = [
    'гор.блюдо', 'гор.напиток', 'хлеб', 'фрукты', 'закуска',
    '1 блюдо', '2 блюдо', 'гарнир', 'напиток', 'хлеб бел.',
    'хлеб черн.', 'булочное', 'кисломол.', 'сладкое', '3 блюдо'
];

const MEAL_TYPES = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];

const MEAL_STRUCTURE = {
    'breakfast': { name: 'Завтрак', sections: ['гор.блюдо', 'гор.напиток', 'хлеб', 'фрукты'] },
    'breakfast2': { name: 'Завтрак 2', sections: ['фрукты'] },
    'lunch': { name: 'Обед', sections: ['закуска', '1 блюдо', '2 блюдо', 'гарнир', 'напиток', 'хлеб бел.', 'хлеб черн.'] },
    'afternoonSnack': { name: 'Полдник', sections: ['булочное', 'напиток'] },
    'dinner': { name: 'Ужин', sections: ['гор.блюдо', 'гарнир', 'напиток', 'хлеб'] },
    'dinner2': { name: 'Ужин 2', sections: ['кисломол.', 'булочное', 'напиток', 'фрукты'] }
};

const VALID_SECTIONS_SET = new Set(VALID_SECTIONS);

// Локальная версия normalizeSection (используем импортированную как fallback)
function normalizeSection(s) {
    return utilsNormalizeSection(s) || s;
}

// Шаблоны блюд для приёмов пищи
const mealTemplates = {
    breakfast: {
        name: 'Завтрак',
        items: [
            { section: 'гор.блюдо', name: 'Каша молочная рисовая', weight: 200, calories: 220, proteins: 5, fats: 6, carbs: 35, recipeId: 'B001', price: 25 },
            { section: 'гор.напиток', name: 'Какао с молоком', weight: 200, calories: 120, proteins: 4, fats: 4, carbs: 16, recipeId: 'B002', price: 15 },
            { section: 'хлеб', name: 'Хлеб пшеничный', weight: 30, calories: 80, proteins: 2, fats: 1, carbs: 16, recipeId: 'B003', price: 5 },
            { section: 'фрукты', name: 'Яблоко свежее', weight: 100, calories: 52, proteins: 0.3, fats: 0.2, carbs: 14, recipeId: 'B004', price: 20 }
        ]
    },
    breakfast2: {
        name: 'Второй завтрак',
        items: [
            { section: 'фрукты', name: 'Банан', weight: 120, calories: 105, proteins: 1.3, fats: 0.4, carbs: 27, recipeId: 'B2001', price: 25 },
            { section: 'напиток', name: 'Сок яблочный', weight: 200, calories: 90, proteins: 0.5, fats: 0, carbs: 22, recipeId: 'B2002', price: 15 }
        ]
    },
    lunch: {
        name: 'Обед',
        items: [
            { section: 'закуска', name: 'Салат овощной', weight: 80, calories: 45, proteins: 1.5, fats: 2, carbs: 5, recipeId: 'L001', price: 30 },
            { section: '1 блюдо', name: 'Суп куриный с лапшой', weight: 250, calories: 180, proteins: 12, fats: 8, carbs: 15, recipeId: 'L002', price: 35 },
            { section: '2 блюдо', name: 'Котлета куриная', weight: 90, calories: 200, proteins: 18, fats: 12, carbs: 5, recipeId: 'L003', price: 45 },
            { section: 'гарнир', name: 'Рис отварной', weight: 150, calories: 180, proteins: 4, fats: 1, carbs: 38, recipeId: 'L004', price: 20 },
            { section: 'напиток', name: 'Компот из сухофруктов', weight: 200, calories: 90, proteins: 0.5, fats: 0, carbs: 22, recipeId: 'L005', price: 15 },
            { section: 'хлеб бел.', name: 'Хлеб пшеничный', weight: 30, calories: 80, proteins: 2, fats: 1, carbs: 16, recipeId: 'L006', price: 5 }
        ]
    },
    afternoonSnack: {
        name: 'Полдник',
        items: [
            { section: 'булочное', name: 'Булочка сдобная', weight: 70, calories: 250, proteins: 6, fats: 8, carbs: 38, recipeId: 'S001', price: 25 },
            { section: 'напиток', name: 'Кефир', weight: 200, calories: 120, proteins: 6, fats: 5, carbs: 9, recipeId: 'S002', price: 20 }
        ]
    },
    dinner: {
        name: 'Ужин',
        items: [
            { section: 'гор.блюдо', name: 'Рыба запечённая', weight: 120, calories: 180, proteins: 20, fats: 10, carbs: 2, recipeId: 'D001', price: 50 },
            { section: 'гарнир', name: 'Картофельное пюре', weight: 150, calories: 160, proteins: 3, fats: 5, carbs: 26, recipeId: 'D002', price: 20 },
            { section: 'напиток', name: 'Чай с сахаром', weight: 200, calories: 60, proteins: 0, fats: 0, carbs: 15, recipeId: 'D003', price: 10 },
            { section: 'хлеб', name: 'Хлеб ржаной', weight: 30, calories: 70, proteins: 2, fats: 0.5, carbs: 14, recipeId: 'D004', price: 5 }
        ]
    },
    dinner2: {
        name: 'Второй ужин',
        items: [
            { section: 'кисломол.', name: 'Йогурт питьевой', weight: 200, calories: 140, proteins: 5, fats: 4, carbs: 20, recipeId: 'N001', price: 35 },
            { section: 'булочное', name: 'Печенье', weight: 30, calories: 130, proteins: 2, fats: 5, carbs: 19, recipeId: 'N002', price: 10 }
        ]
    }
};

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function showStatus(msg, type) {
    // Используем глобальный showToast или создаём локальный
    if (typeof showToast === 'function') {
        showToast(msg, type);
    } else {
        const toast = document.createElement('div');
        toast.className = `status-toast status-${type}`;
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${msg}`;
        toast.style.cssText = 'position:fixed;top:20px;right:20px;padding:12px 24px;border-radius:40px;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:10000;animation:slideInRight 0.3s ease;display:flex;align-items:center;gap:10px;';
        if (type === 'success') toast.style.background = '#10b981';
        if (type === 'error') toast.style.background = '#ef4444';
        if (type === 'info') toast.style.background = '#3b82f6';
        toast.style.color = 'white';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

function getSectionSum(items, targetSection) {
    return items.reduce((sum, item) => {
        if (normalizeSection(item.section) === targetSection) {
            return sum + (parseFloat(item.weight) || 0);
        }
        return sum;
    }, 0);
}

function getMealTotalWeight(items) {
    return items.reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0);
}

function getMealTotalCalories(items) {
    return items.reduce((sum, i) => sum + (parseFloat(i.calories) || 0), 0);
}

// ========== ИСТОРИЯ (UNDO/REDO) ==========
function saveToHistory() {
    if (isUndoRedo || !currentTemplateData) return;
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
    if (historyIndex > 0 && currentTemplateData) {
        historyIndex--;
        isUndoRedo = true;
        currentTemplateData = deepClone(historyStack[historyIndex]);
        flatItems = buildFlatFromTemplate(currentTemplateData);
        renderEditorContent();
        showStatus('Отменено', 'info');
        isUndoRedo = false;
    }
}

function redo() {
    if (historyIndex < historyStack.length - 1 && currentTemplateData) {
        historyIndex++;
        isUndoRedo = true;
        currentTemplateData = deepClone(historyStack[historyIndex]);
        flatItems = buildFlatFromTemplate(currentTemplateData);
        renderEditorContent();
        showStatus('Повторено', 'info');
        isUndoRedo = false;
    }
}

// ========== ПОСТРОЕНИЕ ПЛОСКОГО МАССИВА ==========
function buildFlatFromTemplate(template) {
    if (!template || !template.weeks) return [];
    const flat = [];
    for (let w in template.weeks) {
        for (let d in template.weeks[w]) {
            for (let mt of MEAL_TYPES) {
                const meal = template.weeks[w][d][mt];
                if (meal && meal.items && meal.items.length) {
                    for (let idx = 0; idx < meal.items.length; idx++) {
                        const item = meal.items[idx];
                        flat.push({
                            id: `${w}_${d}_${mt}_${idx}`,
                            week: parseInt(w),
                            day: parseInt(d),
                            meal: mt,
                            section: item.section || '',
                            name: item.name || '',
                            weight: item.weight || 0,
                            calories: item.calories || 0,
                            proteins: item.proteins || 0,
                            fats: item.fats || 0,
                            carbs: item.carbs || 0,
                            recipeId: item.recipeId || '',
                            price: item.price || 0
                        });
                    }
                }
            }
        }
    }
    return flat;
}

// ========== ПРОВЕРКИ (16 ПРАВИЛ) ==========
function checkDuplicateDishes(template) {
    if (!template || !template.weeks) return [];
    const duplicates = [];
    for (let w in template.weeks) {
        for (let d in template.weeks[w]) {
            const allDishNames = [];
            for (let mt of MEAL_TYPES) {
                const meal = template.weeks[w][d][mt];
                if (meal && meal.items) {
                    for (let item of meal.items) {
                        if (item.name && item.name.trim() &&
                            !item.name.toLowerCase().includes('булоч') &&
                            !item.name.toLowerCase().includes('напиток') &&
                            !item.name.toLowerCase().includes('хлеб')) {
                            if (allDishNames.includes(item.name) &&
                                !item.name.includes('чай') &&
                                !item.name.includes('компот')) {
                                duplicates.push({ week: w, day: d, dishName: item.name });
                            }
                            allDishNames.push(item.name);
                        }
                    }
                }
            }
        }
    }
    return duplicates;
}

function runAllRules(template) {
    if (!template || !template.weeks) return [];
    const violations = [];

    for (let w in template.weeks) {
        for (let d in template.weeks[w]) {
            const day = template.weeks[w][d];
            let dayFruitWeight = 0;

            for (let mt of MEAL_TYPES) {
                const meal = day[mt];
                if (!meal || !meal.items || !meal.items.length) continue;

                const items = meal.items;
                const totalWeight = getMealTotalWeight(items);
                const totalCalories = getMealTotalCalories(items);
                const hotWeight = getSectionSum(items, 'гор.блюдо');
                const zakuskaWeight = getSectionSum(items, 'закуска');
                const firstWeight = getSectionSum(items, '1 блюдо');
                const secondWeight = getSectionSum(items, '2 блюдо');
                const garnishWeight = getSectionSum(items, 'гарнир');
                const fruitWeight = getSectionSum(items, 'фрукты');
                dayFruitWeight += fruitWeight;

                if (mt === 'breakfast' && totalWeight > 0 && totalWeight < 500) violations.push({ rule: 1, code: 1, week: w, day: d, meal: mt, itemIndex: 0, details: `Завтрак: ${totalWeight}г < 500г` });
                if (mt === 'lunch' && totalWeight > 0 && totalWeight < 700) violations.push({ rule: 2, code: 2, week: w, day: d, meal: mt, itemIndex: 0, details: `Обед: ${totalWeight}г < 700г` });
                if (mt === 'breakfast' && hotWeight > 0 && hotWeight < 150) violations.push({ rule: 3, code: 3, week: w, day: d, meal: mt, itemIndex: 0, details: `гор.блюдо: ${hotWeight}г < 150г` });
                if (mt === 'lunch' && zakuskaWeight > 0 && zakuskaWeight < 60) violations.push({ rule: 4, code: 4, week: w, day: d, meal: mt, itemIndex: 0, details: `закуска: ${zakuskaWeight}г < 60г` });
                if (mt === 'lunch' && firstWeight > 0 && firstWeight < 200) violations.push({ rule: 5, code: 5, week: w, day: d, meal: mt, itemIndex: 0, details: `1 блюдо: ${firstWeight}г < 200г` });
                if (mt === 'lunch' && secondWeight > 0 && secondWeight < 90) violations.push({ rule: 6, code: 6, week: w, day: d, meal: mt, itemIndex: 0, details: `2 блюдо: ${secondWeight}г < 90г` });
                if (mt === 'lunch' && garnishWeight > 0 && garnishWeight < 150) violations.push({ rule: 8, code: 8, week: w, day: d, meal: mt, itemIndex: 0, details: `гарнир: ${garnishWeight}г < 150г` });
                if (mt === 'breakfast2' && totalWeight > 0 && totalWeight < 200) violations.push({ rule: 9, code: 9, week: w, day: d, meal: mt, itemIndex: 0, details: `2 завтрак: ${totalWeight}г < 200г` });
                if (mt === 'afternoonSnack' && totalWeight > 0 && totalWeight < 300) violations.push({ rule: 10, code: 10, week: w, day: d, meal: mt, itemIndex: 0, details: `Полдник: ${totalWeight}г < 300г` });
                if (mt === 'dinner' && totalWeight > 0 && totalWeight < 500) violations.push({ rule: 11, code: 11, week: w, day: d, meal: mt, itemIndex: 0, details: `Ужин: ${totalWeight}г < 500г` });
                if (mt === 'dinner2' && totalWeight > 0 && totalWeight < 200) violations.push({ rule: 12, code: 12, week: w, day: d, meal: mt, itemIndex: 0, details: `2 ужин: ${totalWeight}г < 200г` });
                if (mt === 'breakfast' && totalCalories > 0 && totalCalories < 470) violations.push({ rule: 13, code: 13, week: w, day: d, meal: mt, itemIndex: 0, details: `Калории завтрака: ${totalCalories}ккал < 470ккал` });
                if (mt === 'lunch' && totalCalories > 0 && totalCalories < 705) violations.push({ rule: 14, code: 14, week: w, day: d, meal: mt, itemIndex: 0, details: `Калории обеда: ${totalCalories}ккал < 705ккал` });

                for (let idx = 0; idx < items.length; idx++) {
                    const item = items[idx];
                    const bju = (parseFloat(item.proteins) || 0) + (parseFloat(item.fats) || 0) + (parseFloat(item.carbs) || 0);
                    const weight = parseFloat(item.weight) || 0;
                    if (bju > weight && weight > 0) {
                        violations.push({ rule: 15, code: 15, week: w, day: d, meal: mt, itemIndex: idx, details: `"${item.name}": БЖУ=${bju}г > вес=${weight}г` });
                    }
                }
            }

            if (dayFruitWeight > 0 && dayFruitWeight < 100) {
                violations.push({ rule: 16, code: 16, week: w, day: d, itemIndex: 0, details: `Фруктов за день: ${dayFruitWeight}г < 100г` });
            }
        }
    }

    const duplicates = checkDuplicateDishes(template);
    for (let d of duplicates) {
        violations.push({ rule: 17, code: 17, week: d.week, day: d.day, itemIndex: 0, details: `Повтор блюда: "${d.dishName}"` });
    }

    return violations;
}

function getCellClass(field, item, mealType, mealItems, duplicates) {
    const sectionNorm = normalizeSection(item.section);
    const sectionSum = getSectionSum(mealItems, sectionNorm);

    if (field === 'section') {
        if (item.section && !VALID_SECTIONS_SET.has(sectionNorm)) return 'cell-error';
        return '';
    }
    if (field === 'name') {
        if (duplicates.some(d => d.dishName === item.name && parseInt(d.week) === item.week && parseInt(d.day) === item.day)) return 'cell-duplicate';
        return '';
    }
    if (field === 'weight') {
        if (item.weight === 0 && item.name && item.name.trim() !== '') return 'cell-error';
        if (mealType === 'breakfast' && sectionNorm === 'гор.блюдо' && sectionSum > 0 && sectionSum < 150) return 'cell-warning';
        if (mealType === 'lunch' && sectionNorm === 'закуска' && sectionSum > 0 && sectionSum < 60) return 'cell-warning';
        if (mealType === 'lunch' && sectionNorm === '1 блюдо' && sectionSum > 0 && sectionSum < 200) return 'cell-warning';
        if (mealType === 'lunch' && sectionNorm === '2 блюдо' && sectionSum > 0 && sectionSum < 90) return 'cell-warning';
        if (mealType === 'lunch' && sectionNorm === 'гарнир' && sectionSum > 0 && sectionSum < 150) return 'cell-warning';
        if (sectionNorm === 'фрукты') {
            const fruitSum = getSectionSum(mealItems, 'фрукты');
            if (fruitSum > 0 && fruitSum < 100) return 'cell-warning';
        }
        return '';
    }
    if (field === 'calories') {
        if (item.calories === 0 && item.name && item.name.trim() !== '') return 'cell-warning';
        return '';
    }
    return '';
}

function getCellTooltip(field, item, mealType, mealItems, duplicates) {
    const sectionNorm = normalizeSection(item.section);
    const sectionSum = getSectionSum(mealItems, sectionNorm);
    const messages = [];

    if (field === 'section') {
        if (item.section && !VALID_SECTIONS_SET.has(sectionNorm)) {
            messages.push(`❌ Недопустимый раздел: "${item.section}"`);
            messages.push(`Допустимые разделы: ${VALID_SECTIONS.join(', ')}`);
        }
        return messages.join('\n');
    }
    if (field === 'name') {
        if (duplicates.some(d => d.dishName === item.name && parseInt(d.week) === item.week && parseInt(d.day) === item.day)) {
            messages.push(`⚠️ Дубликат блюда`);
            messages.push(`Блюдо "${item.name}" уже встречается в этот день`);
        }
        if (!item.name || item.name.trim() === '') {
            messages.push(`⚠️ Пустое название`);
        }
        return messages.join('\n');
    }
    if (field === 'weight') {
        const totalMealWeight = getMealTotalWeight(mealItems);
        if (item.weight === 0 && item.name && item.name.trim() !== '') messages.push(`❌ Вес = 0 г`);
        if (mealType === 'breakfast' && totalMealWeight > 0 && totalMealWeight < 500) messages.push(`⚠️ Правило 1: Вес завтрака ${totalMealWeight}г < 500г`);
        if (mealType === 'lunch' && totalMealWeight > 0 && totalMealWeight < 700) messages.push(`⚠️ Правило 2: Вес обеда ${totalMealWeight}г < 700г`);
        if (mealType === 'breakfast' && sectionNorm === 'гор.блюдо' && sectionSum > 0 && sectionSum < 150) messages.push(`⚠️ Правило 3: гор.блюдо ${sectionSum}г < 150г`);
        if (mealType === 'lunch' && sectionNorm === 'закуска' && sectionSum > 0 && sectionSum < 60) messages.push(`⚠️ Правило 4: закуска ${sectionSum}г < 60г`);
        if (mealType === 'lunch' && sectionNorm === '1 блюдо' && sectionSum > 0 && sectionSum < 200) messages.push(`⚠️ Правило 5: 1 блюдо ${sectionSum}г < 200г`);
        if (mealType === 'lunch' && sectionNorm === '2 блюдо' && sectionSum > 0 && sectionSum < 90) messages.push(`⚠️ Правило 6: 2 блюдо ${sectionSum}г < 90г`);
        if (mealType === 'lunch' && sectionNorm === 'гарнир' && sectionSum > 0 && sectionSum < 150) messages.push(`⚠️ Правило 8: гарнир ${sectionSum}г < 150г`);
        if (mealType === 'breakfast2' && totalMealWeight > 0 && totalMealWeight < 200) messages.push(`⚠️ Правило 9: 2 завтрак ${totalMealWeight}г < 200г`);
        if (mealType === 'afternoonSnack' && totalMealWeight > 0 && totalMealWeight < 300) messages.push(`⚠️ Правило 10: полдник ${totalMealWeight}г < 300г`);
        if (mealType === 'dinner' && totalMealWeight > 0 && totalMealWeight < 500) messages.push(`⚠️ Правило 11: ужин ${totalMealWeight}г < 500г`);
        if (mealType === 'dinner2' && totalMealWeight > 0 && totalMealWeight < 200) messages.push(`⚠️ Правило 12: 2 ужин ${totalMealWeight}г < 200г`);
        if (sectionNorm === 'фрукты') {
            const fruitSum = getSectionSum(mealItems, 'фрукты');
            if (fruitSum > 0 && fruitSum < 100) messages.push(`⚠️ Правило 16: фрукты ${fruitSum}г < 100г`);
        }
        return messages.join('\n');
    }
    if (field === 'calories') {
        const totalMealCalories = getMealTotalCalories(mealItems);
        if (item.calories === 0 && item.name && item.name.trim() !== '') messages.push(`⚠️ Калорийность = 0`);
        if (mealType === 'breakfast' && totalMealCalories > 0 && totalMealCalories < 470) messages.push(`⚠️ Правило 13: калории завтрака ${totalMealCalories}ккал < 470ккал`);
        if (mealType === 'lunch' && totalMealCalories > 0 && totalMealCalories < 705) messages.push(`⚠️ Правило 14: калории обеда ${totalMealCalories}ккал < 705ккал`);
        return messages.join('\n');
    }
    return '';
}

function filterItems(items) {
    return items.filter(item => {
        let match = true;
        if (currentSearchTerm) {
            match = match && item.name.toLowerCase().includes(currentSearchTerm.toLowerCase());
        }
        if (currentMealFilter) {
            match = match && item.meal === currentMealFilter;
        }
        if (currentStatusFilter === 'error') {
            const violations = allViolations.filter(v => v.week == item.week && v.day == item.day && v.code === 15);
            match = match && violations.length > 0;
        } else if (currentStatusFilter === 'warning') {
            const violations = allViolations.filter(v => v.week == item.week && v.day == item.day && v.code !== 15);
            match = match && violations.length > 0;
        }
        return match;
    });
}

// ========== ОСНОВНАЯ ОТРИСОВКА ТАБЛИЦЫ ==========
function renderEditorContent() {
    const container = document.getElementById('editorContent');
    if (!container) return;

    if (!currentTemplateData || !flatItems.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-folder-open"></i></div>
                <h3>Загрузите файл типового меню</h3>
                <p>Поддерживаются форматы .xlsx и .xls</p>
                <button id="emptyStateUploadBtn" class="btn-primary" style="margin-top:20px;"><i class="fas fa-cloud-upload-alt"></i> Выбрать файл</button>
            </div>
        `;
        const emptyBtn = document.getElementById('emptyStateUploadBtn');
        if (emptyBtn) emptyBtn.addEventListener('click', () => document.getElementById('fileInput')?.click());
        return;
    }

    allViolations = runAllRules(currentTemplateData);
    const duplicates = checkDuplicateDishes(currentTemplateData);

    const grouped = {};
    const filteredItems = filterItems(flatItems);
    for (let item of filteredItems) {
        const key = `${item.week}_${item.day}_${item.meal}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
    }

    const mealTotals = {};
    const mealCalories = {};
    for (let item of flatItems) {
        const key = `${item.week}_${item.day}_${item.meal}`;
        mealTotals[key] = (mealTotals[key] || 0) + item.weight;
        mealCalories[key] = (mealCalories[key] || 0) + item.calories;
    }

    let totalErrors = 0, totalWarnings = 0;
    const violationsByRule = {};
    for (let v of allViolations) {
        violationsByRule[v.code] = (violationsByRule[v.code] || 0) + 1;
        if (v.code === 15) totalErrors++;
        else totalWarnings++;
    }

    const mealOrder = { 'breakfast': 1, 'breakfast2': 2, 'lunch': 3, 'afternoonSnack': 4, 'dinner': 5, 'dinner2': 6 };
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
        const [weekA, dayA, mealA] = a.split('_');
        const [weekB, dayB, mealB] = b.split('_');
        if (weekA !== weekB) return parseInt(weekA) - parseInt(weekB);
        if (dayA !== dayB) return parseInt(dayA) - parseInt(dayB);
        return (mealOrder[mealA] || 99) - (mealOrder[mealB] || 99);
    });

    let html = `<table class="editor-table"><thead><tr>
        <th class="checkbox-col"><input type="checkbox" id="selectAllCheckbox"></th>
        <th>Неделя</th><th>День</th><th>Приём пищи</th><th>Раздел</th><th>Блюдо</th>
        <th>Вес (г)</th><th>Ккал</th><th>Белки</th><th>Жиры</th><th>Углеводы</th>
        <th>№ рец.</th><th>Цена (руб)</th><th></th>
    </thead><tbody>`;

    for (let key of sortedKeys) {
        const items = grouped[key];
        const mealType = items[0].meal;
        const mealTotal = mealTotals[key] || 0;
        const mealKcal = mealCalories[key] || 0;

        const mealItemsForPrice = (currentTemplateData.weeks[items[0].week] && 
            currentTemplateData.weeks[items[0].week][items[0].day] && 
            currentTemplateData.weeks[items[0].week][items[0].day][mealType]) ? 
            currentTemplateData.weeks[items[0].week][items[0].day][mealType].items : [];
        const mealPrice = mealItemsForPrice.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0);

        const ruleMin = { breakfast: 500, lunch: 700, breakfast2: 200, afternoonSnack: 300, dinner: 500, dinner2: 200 }[mealType] || 0;
        const kcalMin = { breakfast: 470, lunch: 705 }[mealType] || 0;
        const mealOk = mealTotal >= ruleMin || mealTotal === 0;
        const kcalOk = mealKcal >= kcalMin || mealKcal === 0;

        let firstRow = true;
        const rowspan = items.length;

        for (let idx = 0; idx < items.length; idx++) {
            const item = items[idx];
            const mealItems = (currentTemplateData.weeks[item.week] && 
                currentTemplateData.weeks[item.week][item.day] && 
                currentTemplateData.weeks[item.week][item.day][item.meal]) ? 
                currentTemplateData.weeks[item.week][item.day][item.meal].items : [];

            html += `<tr data-week="${item.week}" data-day="${item.day}" data-meal="${item.meal}">`;

            if (firstRow) {
                html += `<td rowspan="${rowspan}" class="checkbox-col" style="vertical-align:middle; text-align:center;"><input type="checkbox" class="item-checkbox" data-id="${item.id}"></td>`;
                html += `<td rowspan="${rowspan}" style="vertical-align:middle;"><strong>${item.week}</strong></td>`;
                html += `<td rowspan="${rowspan}" style="vertical-align:middle;"><strong>${item.day}</strong></td>`;
                html += `<td rowspan="${rowspan}" style="vertical-align:middle;">
                    ${MEAL_STRUCTURE[mealType]?.name || mealType}
                    <div style="margin-top: 8px;">
                        <span class="meal-badge ${mealOk ? 'ok' : 'warning'}">⚖️ ${mealTotal}/${ruleMin}г</span>
                        ${kcalMin > 0 ? `<span class="meal-badge ${kcalOk ? 'ok' : 'warning'}">🔥 ${mealKcal}/${kcalMin}ккал</span>` : ''}
                        <span class="meal-badge meal-price-badge">💰 ${mealPrice.toFixed(2)} ₽</span>
                    </div>
                </td>`;
                firstRow = false;
            }

            const sectionClass = getCellClass('section', item, mealType, mealItems, duplicates);
            const nameClass = getCellClass('name', item, mealType, mealItems, duplicates);
            const weightClass = getCellClass('weight', item, mealType, mealItems, duplicates);
            const caloriesClass = getCellClass('calories', item, mealType, mealItems, duplicates);
            const sectionTip = getCellTooltip('section', item, mealType, mealItems, duplicates);
            const nameTip = getCellTooltip('name', item, mealType, mealItems, duplicates);
            const weightTip = getCellTooltip('weight', item, mealType, mealItems, duplicates);
            const caloriesTip = getCellTooltip('calories', item, mealType, mealItems, duplicates);

            html += `
                <td class="tooltip-cell ${sectionClass}" title="${escapeAttr(sectionTip)}">
                    <select data-id="${item.id}" data-field="section">
                        <option value="">-- выбрать --</option>
                        ${VALID_SECTIONS.map(s => `<option value="${s}" ${item.section === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </td>
                <td class="tooltip-cell ${nameClass}" title="${escapeAttr(nameTip)}"><input type="text" value="${escapeHtml(item.name)}" data-id="${item.id}" data-field="name"></td>
                <td class="cell-weight ${weightClass}" title="${escapeAttr(weightTip)}"><input type="number" value="${item.weight}" data-id="${item.id}" data-field="weight" step="1"></td>
                <td class="cell-calories ${caloriesClass}" title="${escapeAttr(caloriesTip)}"><input type="number" value="${item.calories}" data-id="${item.id}" data-field="calories" step="1"></td>
                <td class="cell-proteins"><input type="number" value="${item.proteins}" data-id="${item.id}" data-field="proteins" step="0.1"></td>
                <td class="cell-fats"><input type="number" value="${item.fats}" data-id="${item.id}" data-field="fats" step="0.1"></td>
                <td class="cell-carbs"><input type="number" value="${item.carbs}" data-id="${item.id}" data-field="carbs" step="0.1"></td>
                <td><input type="text" value="${item.recipeId || ''}" data-id="${item.id}" data-field="recipeId"></td>
				<td><input type="number" value="${(item.price || 0).toFixed(2)}" data-id="${item.id}" data-field="price" step="0.01" min="0" style="width:80px;"></td>
                <td><button class="btn btn-secondary" style="padding:4px 12px;" data-del="${item.id}"><i class="fas fa-trash"></i></button></td>
            `;
            html += `</tr>`;
        }

        const sampleId = items[0]?.id;
        if (sampleId) {
            const [week, day, meal] = sampleId.split('_');
            html += `<tr class="add-row-btn"><td colspan="3"></td><td colspan="11">
                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                    <button class="btn btn-secondary" style="padding:6px 14px;" data-add="${week}|${day}|${meal}">
                        <i class="fas fa-plus-circle"></i> Добавить блюдо
                    </button>
                    <select class="add-section-select" data-add-select="${week}|${day}|${meal}" style="width:auto; padding:6px 12px;">
                        <option value="">-- выбрать раздел --</option>
                        ${VALID_SECTIONS.map(s => `<option value="${s}">${s}</option>`).join('')}
                    </select>
                    <div class="action-divider" style="width:1px; height:30px; background:#e2e8f0; margin:0 8px;"></div>
                    <button class="btn btn-info quick-add-meal-btn" style="padding:6px 14px;" data-week="${week}" data-day="${day}">
                        <i class="fas fa-plus-circle"></i> Добавить приём пищи в этот день
                    </button>
                </div>
            </td></tr>`;
        }
    }
    html += `</tbody></table>`;
    container.innerHTML = html;

    // Обновляем статистику
    const totalDays = Object.keys(currentTemplateData.weeks).reduce((sum, w) => sum + Object.keys(currentTemplateData.weeks[w]).length, 0);
    const totalDishes = flatItems.length;
    const avgWeightPerDay = totalDays > 0 ? (flatItems.reduce((s, i) => s + i.weight, 0) / totalDays).toFixed(0) : 0;

    const statsHtml = `
        <div class="stat-card"><div class="stat-number" style="color:#dc2626">${totalErrors}</div><div class="stat-label">❌ Ошибки</div></div>
        <div class="stat-card"><div class="stat-number" style="color:#f59e0b">${totalWarnings}</div><div class="stat-label">⚠️ Нарушения</div></div>
        <div class="stat-card"><div class="stat-number">${totalDishes}</div><div class="stat-label">🍽️ Блюд</div></div>
        <div class="stat-card"><div class="stat-number">${totalDays}</div><div class="stat-label">📅 Дней</div></div>
        <div class="stat-card"><div class="stat-number">${avgWeightPerDay}</div><div class="stat-label">⚖️ Ср. вес/день</div></div>
    `;
    const statsPanel = document.getElementById('statsPanel');
    if (statsPanel) statsPanel.innerHTML = statsHtml;

    // Панель правил
    const rulesMap = {
        1: 'Завтрак ≥500г', 2: 'Обед ≥700г', 3: 'Гор.блюдо ≥150г', 4: 'Закуска ≥60г',
        5: '1 блюдо ≥200г', 6: '2 блюдо ≥90г', 8: 'Гарнир ≥150г', 9: '2 завтрак ≥200г',
        10: 'Полдник ≥300г', 11: 'Ужин ≥500г', 12: '2 ужин ≥200г', 13: 'Калории завтрака ≥470',
        14: 'Калории обеда ≥705', 15: 'БЖУ ≤ вес', 16: 'Фрукты ≥100г', 17: 'Без дубликатов'
    };
    const rulesHtml = Object.entries(rulesMap).map(([code, name]) => {
        const count = violationsByRule[code] || 0;
        const statusClass = count > 0 ? 'warning' : 'ok';
        const violationsForRule = allViolations.filter(v => v.code === parseInt(code));
        return `<div class="rule-badge ${statusClass}" data-rule-code="${code}" data-violations='${JSON.stringify(violationsForRule)}'>${code}. ${name} ${count > 0 ? `(${count})` : '✓'}</div>`;
    }).join('');
    const rulesPanel = document.getElementById('rulesPanel');
    if (rulesPanel) rulesPanel.innerHTML = `<i class="fas fa-list"></i> <strong>Правила контроля качества</strong> ${rulesHtml}`;

    attachEditorEvents();
}

function attachEditorEvents() {
    // Обработчики для полей ввода
    for (let el of document.querySelectorAll('#editorContent input, #editorContent select')) {
        el.removeEventListener('change', handleInputChange);
        el.addEventListener('change', handleInputChange);
    }
    // Удаление блюд
    for (let btn of document.querySelectorAll('[data-del]')) {
        btn.removeEventListener('click', handleDelete);
        btn.addEventListener('click', handleDelete);
    }
    // Добавление блюда
    for (let btn of document.querySelectorAll('[data-add]')) {
        btn.removeEventListener('click', () => handleAdd(btn.dataset.add, null));
        btn.addEventListener('click', () => handleAdd(btn.dataset.add, null));
    }
    // Добавление с выбором раздела
    for (let select of document.querySelectorAll('.add-section-select')) {
        select.removeEventListener('change', handleAddWithSection);
        select.addEventListener('change', handleAddWithSection);
    }
    // Чекбоксы
    for (let cb of document.querySelectorAll('.item-checkbox')) {
        cb.removeEventListener('change', updateSelectedCount);
        cb.addEventListener('change', updateSelectedCount);
    }
    const selectAll = document.getElementById('selectAllCheckbox');
    if (selectAll) {
        selectAll.removeEventListener('change', handleSelectAll);
        selectAll.addEventListener('change', handleSelectAll);
    }
    // Быстрое добавление приёма пищи
    for (let btn of document.querySelectorAll('.quick-add-meal-btn')) {
        btn.removeEventListener('click', handleQuickAddMeal);
        btn.addEventListener('click', handleQuickAddMeal);
    }
    // Правила
    for (let badge of document.querySelectorAll('.rule-badge')) {
        badge.removeEventListener('click', handleRuleClick);
        badge.addEventListener('click', handleRuleClick);
    }
}

function handleRuleClick(e) {
    const badge = e.currentTarget;
    const violations = JSON.parse(badge.dataset.violations || '[]');
    if (violations.length > 0) {
        scrollToViolation(violations[0]);
        showStatus(`⚠️ ${violations[0].details}`, 'info');
    } else {
        showStatus(`✅ Правило выполняется`, 'success');
    }
}

function updateSelectedCount() {
    const count = document.querySelectorAll('.item-checkbox:checked').length;
    const selectedSpan = document.getElementById('selectedCount');
    if (selectedSpan) selectedSpan.innerText = count;
    const batchPanel = document.getElementById('batchActions');
    if (batchPanel) batchPanel.style.display = document.querySelectorAll('.item-checkbox').length > 0 ? 'flex' : 'none';
}

function handleSelectAll(e) {
    for (let cb of document.querySelectorAll('.item-checkbox')) cb.checked = e.target.checked;
    updateSelectedCount();
}

function handleInputChange(e) {
    const id = e.target.dataset.id;
    const field = e.target.dataset.field;
    let value = e.target.value;
    const item = flatItems.find(i => i.id === id);
    if (!item) return;

    if (field === 'weight' || field === 'calories' || field === 'proteins' || field === 'fats' || field === 'carbs' || field === 'price') {
        value = parseFloat(value) || 0;
    }
    item[field] = value;

    const [week, day, meal, idx] = id.split('_');
    if (currentTemplateData.weeks[week] && currentTemplateData.weeks[week][day] && currentTemplateData.weeks[week][day][meal]) {
        const targetItem = currentTemplateData.weeks[week][day][meal].items[parseInt(idx)];
        if (targetItem) targetItem[field] = value;
    }
    saveToHistory();
    renderEditorContent();
}

function handleDelete(e) {
    const id = e.currentTarget.dataset.del;
    const [week, day, meal, idx] = id.split('_');
    if (currentTemplateData.weeks[week] && currentTemplateData.weeks[week][day] && currentTemplateData.weeks[week][day][meal]) {
        currentTemplateData.weeks[week][day][meal].items.splice(parseInt(idx), 1);
        saveToHistory();
        flatItems = buildFlatFromTemplate(currentTemplateData);
        renderEditorContent();
        showStatus('🗑️ Блюдо удалено', 'info');
    }
}

function handleAdd(addData, presetSection) {
    const [week, day, meal] = addData.split('|');
    if (currentTemplateData.weeks[week] && currentTemplateData.weeks[week][day] && currentTemplateData.weeks[week][day][meal]) {
        const defaultSection = presetSection || MEAL_STRUCTURE[meal]?.sections[0] || 'раздел';
        currentTemplateData.weeks[week][day][meal].items.push({
            section: defaultSection,
            name: 'Новое блюдо',
            weight: 100,
            calories: 150,
            proteins: 5,
            fats: 5,
            carbs: 20,
            recipeId: '',
            price: 30
        });
        saveToHistory();
        flatItems = buildFlatFromTemplate(currentTemplateData);
        renderEditorContent();
        showStatus(`✨ Добавлено блюдо в раздел "${defaultSection}"`, 'success');
    }
}

function handleAddWithSection(e) {
    const addData = e.target.dataset.addSelect;
    const section = e.target.value;
    if (section) {
        handleAdd(addData, section);
        e.target.value = '';
    }
}

function handleQuickAddMeal(e) {
    const week = e.currentTarget.dataset.week;
    const day = e.currentTarget.dataset.day;
    if (!week || !day) return;
    openAddMealModal(parseInt(week), parseInt(day));
}

// ========== ПРОКРУТКА К НАРУШЕНИЮ ==========
function scrollToViolation(violation) {
    let allRows = violation.meal 
        ? document.querySelectorAll(`tr[data-week="${violation.week}"][data-day="${violation.day}"][data-meal="${violation.meal}"]`)
        : document.querySelectorAll(`tr[data-week="${violation.week}"][data-day="${violation.day}"]`);
    
    if (!allRows.length) return;
    const itemIndex = violation.itemIndex || 0;
    const targetRow = allRows[Math.min(itemIndex, allRows.length - 1)];
    if (!targetRow) return;
    
    targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => flashElement(targetRow), 400);
}

function flashElement(element) {
    if (!element) return;
    const originalBg = element.style.backgroundColor;
    let count = 0;
    const interval = setInterval(() => {
        if (count >= 4) {
            clearInterval(interval);
            element.style.backgroundColor = originalBg;
            return;
        }
        element.style.backgroundColor = count % 2 === 0 ? '#fef08a' : originalBg;
        count++;
    }, 300);
}

// ========== МАССОВЫЕ ОПЕРАЦИИ ==========
function batchDelete() {
    const selectedIds = Array.from(document.querySelectorAll('.item-checkbox:checked')).map(cb => cb.dataset.id);
    for (let id of selectedIds) {
        const [week, day, meal, idx] = id.split('_');
        if (currentTemplateData.weeks[week] && currentTemplateData.weeks[week][day] && currentTemplateData.weeks[week][day][meal]) {
            currentTemplateData.weeks[week][day][meal].items.splice(parseInt(idx), 1);
        }
    }
    saveToHistory();
    flatItems = buildFlatFromTemplate(currentTemplateData);
    renderEditorContent();
    showStatus(`🗑️ Удалено ${selectedIds.length} блюд`, 'success');
}

function batchApplySection() {
    const newSection = document.getElementById('batchSectionSelect')?.value;
    if (!newSection) return;
    const selectedIds = Array.from(document.querySelectorAll('.item-checkbox:checked')).map(cb => cb.dataset.id);
    for (let id of selectedIds) {
        const [week, day, meal, idx] = id.split('_');
        if (currentTemplateData.weeks[week] && currentTemplateData.weeks[week][day] && currentTemplateData.weeks[week][day][meal]) {
            currentTemplateData.weeks[week][day][meal].items[parseInt(idx)].section = newSection;
        }
    }
    saveToHistory();
    flatItems = buildFlatFromTemplate(currentTemplateData);
    renderEditorContent();
    showStatus(`📂 Раздел изменён у ${selectedIds.length} блюд`, 'success');
}

function batchMultiplyWeight() {
    const multiplier = parseFloat(document.getElementById('batchMultiplier')?.value);
    if (isNaN(multiplier)) return;
    const selectedIds = Array.from(document.querySelectorAll('.item-checkbox:checked')).map(cb => cb.dataset.id);
    for (let id of selectedIds) {
        const [week, day, meal, idx] = id.split('_');
        if (currentTemplateData.weeks[week] && currentTemplateData.weeks[week][day] && currentTemplateData.weeks[week][day][meal]) {
            const item = currentTemplateData.weeks[week][day][meal].items[parseInt(idx)];
            item.weight = Math.round((item.weight || 0) * multiplier);
            item.calories = Math.round((item.calories || 0) * multiplier);
            item.proteins = Math.round((item.proteins || 0) * multiplier * 10) / 10;
            item.fats = Math.round((item.fats || 0) * multiplier * 10) / 10;
            item.carbs = Math.round((item.carbs || 0) * multiplier * 10) / 10;
            item.price = Math.round((item.price || 0) * multiplier * 100) / 100;
        }
    }
    saveToHistory();
    flatItems = buildFlatFromTemplate(currentTemplateData);
    renderEditorContent();
    showStatus(`✖️ Вес умножен на ${multiplier} у ${selectedIds.length} блюд`, 'success');
}

// ========== ОБЪЕДИНЕНИЕ РАЗДЕЛОВ ==========
function mergeDuplicateSections() {
    if (!currentTemplateData) return;
    for (let w in currentTemplateData.weeks) {
        for (let d in currentTemplateData.weeks[w]) {
            for (let mt of MEAL_TYPES) {
                const meal = currentTemplateData.weeks[w][d][mt];
                if (meal && meal.items && meal.items.length) {
                    const merged = {};
                    for (let item of meal.items) {
                        const rawSection = item.section || '';
                        if (!merged[rawSection]) {
                            merged[rawSection] = { ...item };
                        } else {
                            merged[rawSection].weight = (merged[rawSection].weight || 0) + (item.weight || 0);
                            merged[rawSection].calories = (merged[rawSection].calories || 0) + (item.calories || 0);
                            merged[rawSection].proteins = (merged[rawSection].proteins || 0) + (item.proteins || 0);
                            merged[rawSection].fats = (merged[rawSection].fats || 0) + (item.fats || 0);
                            merged[rawSection].carbs = (merged[rawSection].carbs || 0) + (item.carbs || 0);
                        }
                    }
                    meal.items = Object.values(merged);
                }
            }
        }
    }
    saveToHistory();
    flatItems = buildFlatFromTemplate(currentTemplateData);
    renderEditorContent();
    showStatus('✅ Разделы объединены', 'success');
}

// ========== КОПИРОВАНИЕ ДНЯ ==========
function copyDay(sourceWeek, sourceDay, targetWeek, targetDay, onlyStructure) {
    if (!currentTemplateData.weeks[sourceWeek] || !currentTemplateData.weeks[sourceWeek][sourceDay]) {
        showStatus('Источник не найден', 'error');
        return;
    }
    const sourceDayData = currentTemplateData.weeks[sourceWeek][sourceDay];
    if (!currentTemplateData.weeks[targetWeek]) currentTemplateData.weeks[targetWeek] = {};
    const existingTargetDay = currentTemplateData.weeks[targetWeek][targetDay] || {};
    const newDayData = {};
    for (let mt of MEAL_TYPES) {
        if (sourceDayData[mt]) {
            if (onlyStructure) {
                newDayData[mt] = { items: [] };
                for (let item of sourceDayData[mt].items) {
                    newDayData[mt].items.push({
                        section: item.section,
                        name: '',
                        weight: 0,
                        calories: 0,
                        proteins: 0,
                        fats: 0,
                        carbs: 0,
                        recipeId: '',
                        price: 0
                    });
                }
            } else {
                newDayData[mt] = deepClone(sourceDayData[mt]);
            }
        } else {
            newDayData[mt] = existingTargetDay[mt] || { items: [] };
        }
    }
    currentTemplateData.weeks[targetWeek][targetDay] = newDayData;
    saveToHistory();
    flatItems = buildFlatFromTemplate(currentTemplateData);
    renderEditorContent();
    showStatus(`📋 Скопировано: неделя ${sourceWeek}, день ${sourceDay} → неделя ${targetWeek}, день ${targetDay}`, 'success');
}

// ========== ДОБАВЛЕНИЕ НЕДЕЛИ ==========
function addNewWeek() {
    if (!currentTemplateData) {
        showStatus('Сначала загрузите файл', 'error');
        return;
    }
    const weeks = Object.keys(currentTemplateData.weeks).map(Number);
    const newWeekNum = weeks.length > 0 ? Math.max(...weeks) + 1 : 1;
    currentTemplateData.weeks[newWeekNum] = {};

    const breakfastTemplate = {
        items: [
            { section: 'гор.блюдо', name: '', weight: 200, calories: 220, proteins: 5, fats: 6, carbs: 35, recipeId: '', price: 0 },
            { section: 'гор.напиток', name: '', weight: 200, calories: 120, proteins: 4, fats: 4, carbs: 16, recipeId: '', price: 0 },
            { section: 'хлеб', name: '', weight: 30, calories: 80, proteins: 2, fats: 1, carbs: 16, recipeId: '', price: 0 },
            { section: 'фрукты', name: '', weight: 100, calories: 52, proteins: 0.3, fats: 0.2, carbs: 14, recipeId: '', price: 0 }
        ]
    };
    const lunchTemplate = {
        items: [
            { section: 'закуска', name: '', weight: 0, calories: 0, proteins: 1.5, fats: 2, carbs: 5, recipeId: '', price: 0 },
            { section: '1 блюдо', name: '', weight: 0, calories: 0, proteins: 12, fats: 8, carbs: 15, recipeId: '', price: 0 },
            { section: '2 блюдо', name: '', weight: 0, calories: 0, proteins: 18, fats: 12, carbs: 5, recipeId: '', price: 0 },
            { section: 'гарнир', name: '', weight: 0, calories: 0, proteins: 4, fats: 1, carbs: 38, recipeId: '', price: 0 },
            { section: 'напиток', name: '', weight: 0, calories: 0, proteins: 0.5, fats: 0, carbs: 22, recipeId: '', price: 0 },
            { section: 'хлеб бел.', name: '', weight: 0, calories: 0, proteins: 2, fats: 1, carbs: 16, recipeId: '', price: 0 },
            { section: 'хлеб черн.', name: '', weight: 0, calories: 0, proteins: 2, fats: 1, carbs: 16, recipeId: '', price: 0 }
        ]
    };

    for (let day = 1; day <= 5; day++) {
        currentTemplateData.weeks[newWeekNum][day] = {
            breakfast: deepClone(breakfastTemplate),
            breakfast2: { items: [] },
            lunch: deepClone(lunchTemplate),
            afternoonSnack: { items: [] },
            dinner: { items: [] },
            dinner2: { items: [] }
        };
    }
    flatItems = buildFlatFromTemplate(currentTemplateData);
    saveToHistory();
    renderEditorContent();
    showStatus(`✨ Добавлена неделя ${newWeekNum} (5 дней) с шаблонными разделами завтрака и обеда`, 'success');
}

// ========== ДОБАВЛЕНИЕ ПРИЁМА ПИЩИ ==========
function openAddMealModal(presetWeek = null, presetDay = null) {
    const modal = document.getElementById('addMealModal');
    if (!modal) return;

    if (presetWeek) {
        const weekSelect = document.getElementById('addMealWeek');
        if (weekSelect) weekSelect.value = presetWeek;
    }
    if (presetDay) {
        const daySelect = document.getElementById('addMealDay');
        if (daySelect) daySelect.value = presetDay;
    }

    updateAddMealWeekSelect();
    updateWeekCheckboxes();
    updateMassPreview();
    modal.style.display = 'flex';
}

function updateAddMealWeekSelect() {
    if (!currentTemplateData) return;
    const weeks = Object.keys(currentTemplateData.weeks).map(Number).sort((a, b) => a - b);
    const select = document.getElementById('addMealWeek');
    if (select) {
        select.innerHTML = weeks.map(w => `<option value="${w}">Неделя ${w}</option>`).join('');
    }
}

function updateWeekCheckboxes() {
    if (!currentTemplateData) return;
    const weeks = Object.keys(currentTemplateData.weeks).map(Number).sort((a, b) => a - b);
    const container = document.getElementById('weekCheckboxes');
    if (container) {
        container.innerHTML = weeks.map(w => `
            <label style="display:inline-flex; align-items:center; gap:6px; padding:6px 12px; background:#f1f5f9; border-radius:20px;">
                <input type="checkbox" value="${w}" checked> Неделя ${w}
            </label>
        `).join('');
    }
}

function updateMassPreview() {
    const previewDiv = document.getElementById('massPreview');
    const previewText = document.getElementById('previewText');
    const isSingleMode = document.getElementById('mealSinglePanel')?.style.display !== 'none';
    
    if (isSingleMode) {
        if (previewDiv) previewDiv.style.display = 'none';
        return;
    }
    
    const scope = document.querySelector('input[name="massScope"]:checked')?.value || 'currentWeek';
    const selectedDays = Array.from(document.querySelectorAll('#dayCheckboxes input:checked')).map(cb => parseInt(cb.value));
    const mealType = document.getElementById('addMealType')?.value || 'breakfast';
    const mealName = mealTemplates[mealType]?.name || mealType;
    const withTemplate = document.getElementById('addMealWithTemplate')?.checked;
    const overwrite = document.getElementById('overwriteExisting')?.checked;
    
    let weekInfo = '';
    if (scope === 'currentWeek') {
        const weeks = Object.keys(currentTemplateData?.weeks || {}).map(Number).sort((a, b) => a - b);
        const currentWeek = weeks[weeks.length - 1] || 1;
        weekInfo = `текущую неделю (${currentWeek})`;
    } else if (scope === 'allWeeks') {
        const weeks = Object.keys(currentTemplateData?.weeks || {}).length;
        weekInfo = `все ${weeks} недель`;
    } else {
        const selectedWeeks = Array.from(document.querySelectorAll('#weekCheckboxes input:checked')).map(cb => cb.value);
        weekInfo = `${selectedWeeks.length} выбранных недель`;
    }
    
    const daysInfo = selectedDays.map(d => { const dayNames = {1:'Пн',2:'Вт',3:'Ср',4:'Чт',5:'Пт'}; return dayNames[d]; }).join(', ');
    const templateInfo = withTemplate ? 'с шаблонными блюдами' : 'без блюд (пустой)';
    const overwriteInfo = overwrite ? ' (существующие будут заменены)' : ' (существующие будут пропущены)';
    
    if (previewText) previewText.innerHTML = `Будет добавлен приём пищи "${mealName}" ${templateInfo} на ${weekInfo} по дням: ${daysInfo}${overwriteInfo}`;
    if (previewDiv) previewDiv.style.display = 'block';
}

function addMealToDay(week, day, mealType, withTemplate, overwrite) {
    if (!currentTemplateData.weeks[week]) currentTemplateData.weeks[week] = {};
    if (!currentTemplateData.weeks[week][day]) {
        currentTemplateData.weeks[week][day] = {
            breakfast: { items: [] }, breakfast2: { items: [] }, lunch: { items: [] },
            afternoonSnack: { items: [] }, dinner: { items: [] }, dinner2: { items: [] }
        };
    }
    const exists = currentTemplateData.weeks[week][day][mealType] && currentTemplateData.weeks[week][day][mealType].items && currentTemplateData.weeks[week][day][mealType].items.length > 0;
    if (exists && !overwrite) return false;
    
    if (withTemplate && mealTemplates[mealType]) {
        currentTemplateData.weeks[week][day][mealType] = { items: deepClone(mealTemplates[mealType].items) };
    } else {
        currentTemplateData.weeks[week][day][mealType] = { items: [] };
    }
    return true;
}

function addMealMass(mealType, withTemplate, overwrite, scope, selectedWeeks, selectedDays) {
    if (!currentTemplateData) return { success: 0, skipped: 0, total: 0 };
    
    let weeks = [];
    if (scope === 'currentWeek') {
        const allWeeks = Object.keys(currentTemplateData.weeks).map(Number).sort((a, b) => a - b);
        weeks = [allWeeks[allWeeks.length - 1] || 1];
    } else if (scope === 'allWeeks') {
        weeks = Object.keys(currentTemplateData.weeks).map(Number);
    } else {
        weeks = selectedWeeks;
    }
    
    let successCount = 0, skippedCount = 0, totalCount = 0;
    for (let week of weeks) {
        for (let day of selectedDays) {
            totalCount++;
            if (!currentTemplateData.weeks[week]) currentTemplateData.weeks[week] = {};
            if (!currentTemplateData.weeks[week][day]) {
                currentTemplateData.weeks[week][day] = {
                    breakfast: { items: [] }, breakfast2: { items: [] }, lunch: { items: [] },
                    afternoonSnack: { items: [] }, dinner: { items: [] }, dinner2: { items: [] }
                };
            }
            const exists = currentTemplateData.weeks[week][day][mealType] && currentTemplateData.weeks[week][day][mealType].items && currentTemplateData.weeks[week][day][mealType].items.length > 0;
            if (exists && !overwrite) {
                skippedCount++;
                continue;
            }
            if (withTemplate && mealTemplates[mealType]) {
                currentTemplateData.weeks[week][day][mealType] = { items: deepClone(mealTemplates[mealType].items) };
            } else {
                currentTemplateData.weeks[week][day][mealType] = { items: [] };
            }
            successCount++;
        }
    }
    return { success: successCount, skipped: skippedCount, total: totalCount };
}

function handleAddMealConfirm() {
    const mealType = document.getElementById('addMealType').value;
    const withTemplate = document.getElementById('addMealWithTemplate').checked;
    const overwrite = document.getElementById('overwriteExisting').checked;
    const isSingleMode = document.getElementById('mealSinglePanel')?.style.display !== 'none';
    
    if (isSingleMode) {
        const week = parseInt(document.getElementById('addMealWeek').value);
        const day = parseInt(document.getElementById('addMealDay').value);
        if (!week || !day) { showStatus('Заполните все поля', 'error'); return; }
        const result = addMealToDay(week, day, mealType, withTemplate, overwrite);
        if (result) {
            saveToHistory();
            flatItems = buildFlatFromTemplate(currentTemplateData);
            renderEditorContent();
            showStatus(`✅ Добавлен приём пищи "${mealTemplates[mealType]?.name || mealType}" в Неделя ${week}, День ${day}`, 'success');
        } else {
            showStatus(`ℹ️ Приём пищи уже существует. Включите "Заменять существующие" для обновления.`, 'info');
        }
    } else {
        const scope = document.querySelector('input[name="massScope"]:checked')?.value || 'currentWeek';
        let selectedWeeks = [];
        if (scope === 'selectedWeeks') {
            selectedWeeks = Array.from(document.querySelectorAll('#weekCheckboxes input:checked')).map(cb => parseInt(cb.value));
            if (selectedWeeks.length === 0) { showStatus('Выберите хотя бы одну неделю', 'error'); return; }
        }
        const selectedDays = Array.from(document.querySelectorAll('#dayCheckboxes input:checked')).map(cb => parseInt(cb.value));
        if (selectedDays.length === 0) { showStatus('Выберите хотя бы один день', 'error'); return; }
        
        const result = addMealMass(mealType, withTemplate, overwrite, scope, selectedWeeks, selectedDays);
        if (result.success > 0) {
            saveToHistory();
            flatItems = buildFlatFromTemplate(currentTemplateData);
            renderEditorContent();
            showStatus(`✅ Добавлен приём пищи "${mealTemplates[mealType]?.name || mealType}" в ${result.success} из ${result.total} дней (пропущено: ${result.skipped})`, 'success');
        } else if (result.skipped > 0) {
            showStatus(`ℹ️ Все ${result.skipped} дней уже содержат этот приём пищи. Включите "Заменять существующие" для обновления.`, 'info');
        } else {
            showStatus('Не удалось добавить приёмы пищи', 'error');
        }
    }
    document.getElementById('addMealModal').style.display = 'none';
}

// ========== СОЗДАНИЕ ТИПОВОГО МЕНЮ ==========
// ========== СОЗДАНИЕ ТИПОВОГО МЕНЮ ==========
function createStandardMenu() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);z-index:20000;display:flex;justify-content:center;align-items:center;';
    
    modal.innerHTML = `
        <div style="background:white;border-radius:32px;padding:32px;max-width:600px;width:90%;max-height:85vh;overflow-y:auto;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
                <i class="fas fa-calendar-alt" style="font-size:32px;color:#8b5cf6;"></i>
                <h2 style="color:#0f172a;">Создание типового меню</h2>
            </div>
            
            <div style="margin-bottom:24px;">
                <label style="display:block;margin-bottom:12px;font-weight:600;">Количество дней:</label>
                <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;">
                    <button data-days="10" class="menu-days-btn" style="padding:12px;border:2px solid #e2e8f0;border-radius:16px;background:white;cursor:pointer;transition:all 0.2s;">
                        <div style="font-size:24px;font-weight:bold;">10</div>
                        <div style="font-size:11px;color:#64748b;">2 нед. × 5 дн.</div>
                    </button>
                    <button data-days="12" class="menu-days-btn" style="padding:12px;border:2px solid #e2e8f0;border-radius:16px;background:white;cursor:pointer;transition:all 0.2s;">
                        <div style="font-size:24px;font-weight:bold;">12</div>
                        <div style="font-size:11px;color:#64748b;">2 нед. × 6 дн.</div>
                    </button>
                    <button data-days="14" class="menu-days-btn" style="padding:12px;border:2px solid #e2e8f0;border-radius:16px;background:white;cursor:pointer;transition:all 0.2s;">
                        <div style="font-size:24px;font-weight:bold;">14</div>
                        <div style="font-size:11px;color:#64748b;">2 нед. × 7 дн.</div>
                    </button>
                    <button data-days="15" class="menu-days-btn" style="padding:12px;border:2px solid #e2e8f0;border-radius:16px;background:white;cursor:pointer;transition:all 0.2s;">
                        <div style="font-size:24px;font-weight:bold;">15</div>
                        <div style="font-size:11px;color:#64748b;">3 нед. × 5 дн.</div>
                    </button>
                    <button data-days="20" class="menu-days-btn" style="padding:12px;border:2px solid #e2e8f0;border-radius:16px;background:white;cursor:pointer;transition:all 0.2s;">
                        <div style="font-size:24px;font-weight:bold;">20</div>
                        <div style="font-size:11px;color:#64748b;">4 нед. × 5 дн.</div>
                    </button>
                </div>
            </div>
            
            <div style="margin-bottom:24px;">
                <label style="display:block;margin-bottom:12px;font-weight:600;">Дополнительные приёмы пищи:</label>
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
                    <label style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#f8fafc;border-radius:12px;cursor:pointer;">
                        <input type="checkbox" value="breakfast2" class="meal-checkbox"> <span>🍎 Второй завтрак</span>
                    </label>
                    <label style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#f8fafc;border-radius:12px;cursor:pointer;">
                        <input type="checkbox" value="afternoonSnack" class="meal-checkbox"> <span>🍪 Полдник</span>
                    </label>
                    <label style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#f8fafc;border-radius:12px;cursor:pointer;">
                        <input type="checkbox" value="dinner" class="meal-checkbox" checked> <span>🌙 Ужин</span>
                    </label>
                    <label style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#f8fafc;border-radius:12px;cursor:pointer;">
                        <input type="checkbox" value="dinner2" class="meal-checkbox"> <span>🥛 Второй ужин</span>
                    </label>
                </div>
                <p style="font-size:11px;color:#64748b;margin-top:8px;">
                    <i class="fas fa-info-circle"></i> Завтрак и обед добавляются всегда
                </p>
            </div>
            
            <div class="modal-buttons" style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px;">
                <button id="cancelMenuCreate" class="btn btn-secondary">Отмена</button>
                <button id="confirmMenuCreate" class="btn btn-primary" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);">
                    <i class="fas fa-check"></i> Создать меню
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    let selectedDays = 10;
    const dayButtons = modal.querySelectorAll('.menu-days-btn');
    
    // Функция обновления выделения
    function updateSelectedButton() {
        dayButtons.forEach(btn => {
            if (parseInt(btn.dataset.days) === selectedDays) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }
    
    // Обработчики для кнопок дней
    dayButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedDays = parseInt(btn.dataset.days);
            updateSelectedButton();
        });
    });
    
    // Выделяем кнопку 10 дней по умолчанию
    updateSelectedButton();
    
    modal.querySelector('#cancelMenuCreate').addEventListener('click', () => modal.remove());
    modal.querySelector('#confirmMenuCreate').addEventListener('click', () => {
        const selectedMeals = Array.from(modal.querySelectorAll('.meal-checkbox:checked')).map(cb => cb.value);
        if (!selectedMeals.includes('breakfast')) selectedMeals.push('breakfast');
        if (!selectedMeals.includes('lunch')) selectedMeals.push('lunch');
        createMenuStructure(selectedDays, selectedMeals);
        modal.remove();
    });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

function createMenuStructure(totalDays, selectedMeals) {
    let weeksCount = 0, daysPerWeek = 5;
    if (totalDays === 10) { weeksCount = 2; daysPerWeek = 5; }
    else if (totalDays === 12) { weeksCount = 2; daysPerWeek = 6; }
    else if (totalDays === 14) { weeksCount = 2; daysPerWeek = 7; }
    else if (totalDays === 15) { weeksCount = 3; daysPerWeek = 5; }
    else if (totalDays === 20) { weeksCount = 4; daysPerWeek = 5; }
    else { weeksCount = Math.ceil(totalDays / 5); daysPerWeek = 5; }
    
    // Полная структура с пустыми названиями, но с правильными разделами
    const createEmptyItems = (sections) => {
        return sections.map(s => ({ 
            section: s, 
            name: '', 
            weight: 0, 
            calories: 0, 
            proteins: 0, 
            fats: 0, 
            carbs: 0, 
            recipeId: '', 
            price: 0 
        }));
    };
    
    const templates = {
        breakfast: { items: createEmptyItems(['гор.блюдо', 'гор.напиток', 'хлеб', 'фрукты']) },
        breakfast2: { items: createEmptyItems(['фрукты', 'напиток']) },
        lunch: { items: createEmptyItems(['закуска', '1 блюдо', '2 блюдо', 'гарнир', 'напиток', 'хлеб бел.']) },
        afternoonSnack: { items: createEmptyItems(['булочное', 'напиток']) },
        dinner: { items: createEmptyItems(['гор.блюдо', 'гарнир', 'напиток', 'хлеб']) },
        dinner2: { items: createEmptyItems(['кисломол.', 'булочное']) }
    };
    
    const newTemplate = { weeks: {} };
    
    for (let week = 1; week <= weeksCount; week++) {
        newTemplate.weeks[week] = {};
        for (let day = 1; day <= daysPerWeek; day++) {
            newTemplate.weeks[week][day] = {
                breakfast: deepClone(templates.breakfast),
                breakfast2: selectedMeals.includes('breakfast2') ? deepClone(templates.breakfast2) : { items: [] },
                lunch: deepClone(templates.lunch),
                afternoonSnack: selectedMeals.includes('afternoonSnack') ? deepClone(templates.afternoonSnack) : { items: [] },
                dinner: selectedMeals.includes('dinner') ? deepClone(templates.dinner) : { items: [] },
                dinner2: selectedMeals.includes('dinner2') ? deepClone(templates.dinner2) : { items: [] }
            };
        }
    }
    
    currentTemplateData = newTemplate;
    originalTemplateData = deepClone(newTemplate);
    historyStack = [deepClone(newTemplate)];
    historyIndex = 0;
    flatItems = buildFlatFromTemplate(currentTemplateData);
    renderEditorContent();
    
    const mealNames = { breakfast2: '2-й завтрак', afternoonSnack: 'полдник', dinner: 'ужин', dinner2: '2-й ужин' };
    const enabledMeals = selectedMeals.filter(m => m !== 'breakfast' && m !== 'lunch').map(m => mealNames[m]);
    const mealsText = enabledMeals.length > 0 ? ` + ${enabledMeals.join(', ')}` : '';
    
    showStatus(`✨ Создано типовое меню: ${totalDays} дней (${weeksCount} нед. × ${daysPerWeek} дн.)${mealsText}`, 'success');
}



// ========== ПЕЧАТЬ ==========
function printView() {
    if (!currentTemplateData || flatItems.length === 0) {
        showStatus('Нет данных для печати', 'error');
        return;
    }
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-1000px';
    printFrame.style.left = '-1000px';
    document.body.appendChild(printFrame);
    const doc = printFrame.contentWindow.document;
    const editorContent = document.querySelector('#editorContent .editor-table')?.cloneNode(true);
    const now = new Date();
    const dateStr = now.toLocaleString('ru-RU');
    const totalWeight = flatItems.reduce((s, i) => s + i.weight, 0);
    const totalCalories = flatItems.reduce((s, i) => s + i.calories, 0);
    const totalDays = Object.keys(currentTemplateData.weeks).reduce((sum, w) => sum + Object.keys(currentTemplateData.weeks[w]).length, 0);
    
    doc.write(`
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8"><title>Печать меню</title>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; font-family:'Segoe UI',Arial,sans-serif; }
            body { padding:20px; background:white; }
            @page { size: A4 landscape; margin:1.5cm; }
            .print-header { text-align:center; margin-bottom:30px; padding-bottom:20px; border-bottom:2px solid #059669; }
            .print-header h1 { color:#059669; font-size:18pt; }
            table { width:100%; border-collapse:collapse; font-size:8pt; margin-bottom:20px; }
            th, td { border:1px solid #cbd5e1; padding:6px 8px; text-align:left; }
            th { background:#f1f5f9; font-weight:bold; }
            .meal-badge { display:inline-block; padding:2px 6px; border-radius:12px; font-size:7pt; }
            @media print { body { padding:0; } }
        </style>
        </head><body>
        <div class="print-header">
            <h1>📋 ТИПОВОЕ МЕНЮ ДЛЯ ОБУЧАЮЩИХСЯ</h1>
            <div><strong>${escapeHtml(schoolInfo.name || 'МОУ "Сказочная СОШ"')}</strong><br>Дата печати: ${dateStr}</div>
        </div>
        <div style="margin-bottom:20px;">
            <p><strong>Всего блюд:</strong> ${flatItems.length} | <strong>Дней:</strong> ${totalDays} | <strong>Общий вес:</strong> ${totalWeight} г | <strong>Общая калорийность:</strong> ${totalCalories} ккал</p>
        </div>
        ${editorContent ? editorContent.outerHTML : '<p>Нет данных</p>'}
        </body></html>
    `);
    doc.close();
    printFrame.contentWindow.onload = () => {
        setTimeout(() => {
            printFrame.contentWindow.print();
            setTimeout(() => document.body.removeChild(printFrame), 1000);
        }, 300);
    };
}

// ========== ЭКСПОРТ В EXCEL ==========
async function exportToExcel() {
    if (!currentTemplateData) {
        showStatus('Нет данных для экспорта', 'error');
        return;
    }
    try {
        const ExcelJS = window.ExcelJS;
        if (!ExcelJS) throw new Error('ExcelJS не загружен');
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Лист1');
        
        const weeks = Object.keys(currentTemplateData.weeks).map(Number).sort((a, b) => a - b);
        const daysPerWeek = {};
        for (let w of weeks) daysPerWeek[w] = Object.keys(currentTemplateData.weeks[w]).map(Number).sort((a, b) => a - b);
        
        const goldFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
        const borderStyle = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        
        // Шапка
        worksheet.getCell('A1').value = 'Школа';
        worksheet.getCell('C1').value = schoolInfo.name || 'МОУ "Сказочная СОШ"';
        worksheet.getCell('F1').value = 'Утвердил:';
        worksheet.getCell('G1').value = 'должность';
        worksheet.getCell('H1').value = schoolInfo.approval.position || 'Директор';
        worksheet.mergeCells('C1:E1');
        worksheet.mergeCells('H1:K1');
        ['C1','D1','E1','H1','I1','J1','K1'].forEach(c => worksheet.getCell(c).fill = goldFill);
        
        worksheet.getCell('A2').value = 'Типовое примерное меню приготавливаемых блюд';
        worksheet.getCell('G2').value = 'фамилия';
        worksheet.getCell('H2').value = schoolInfo.approval.name || 'Иванова И.И.';
        worksheet.mergeCells('H2:K2');
        ['H2','I2','J2','K2'].forEach(c => worksheet.getCell(c).fill = goldFill);
        
        worksheet.getCell('A3').value = 'Возрастная категория';
        worksheet.getCell('E3').value = schoolInfo.ageCategory || '7-11 лет';
        worksheet.getCell('G3').value = 'дата';
        const dateParts = (schoolInfo.approval.date || '12.01.2026').split('.');
        worksheet.getCell('H3').value = parseInt(dateParts[0]) || 12;
        worksheet.getCell('I3').value = parseInt(dateParts[1]) || 1;
        worksheet.getCell('J3').value = parseInt(dateParts[2]) || 2026;
        ['H3','I3','J3'].forEach(c => worksheet.getCell(c).fill = goldFill);
        worksheet.getCell('H4').value = 'день';
        worksheet.getCell('I4').value = 'месяц';
        worksheet.getCell('J4').value = 'год';
        
        // Заголовки таблицы
        const headers = ['Неделя', 'День недели', 'Прием пищи', 'Раздел меню', 'Блюда', 'Вес блюда, г', 'Белки', 'Жиры', 'Углеводы', 'Калорийность', '№ рецептуры', 'Цена'];
        headers.forEach((h, i) => {
            const cell = worksheet.getCell(5, i + 1);
            cell.value = h;
            cell.font = { bold: true, size: 10 };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = borderStyle;
        });
        
        const mealTemplate = {
            breakfast: { name: 'Завтрак', sections: ['гор.блюдо', '', 'гор.напиток', 'хлеб', 'фрукты', '', ''] },
            breakfast2: { name: 'Завтрак 2', sections: ['фрукты'] },
            lunch: { name: 'Обед', sections: ['закуска', '1 блюдо', '2 блюдо', 'гарнир', 'напиток', 'хлеб бел.', 'хлеб черн.', '', ''] },
            afternoonSnack: { name: 'Полдник', sections: ['булочное', 'напиток'] },
            dinner: { name: 'Ужин', sections: ['гор.блюдо', '', 'гор.напиток', 'хлеб', 'фрукты', '', ''] },
            dinner2: { name: 'Ужин 2', sections: ['кисломол.', 'булочное', 'напиток', 'фрукты'] }
        };
        
        const activeMeals = MEAL_TYPES.filter(mt => {
            for (let w of weeks) for (let d of daysPerWeek[w]) 
                if (currentTemplateData.weeks[w]?.[d]?.[mt]?.items?.length) return true;
            return false;
        });
        
        let currentRow = 6;
        const dayTotalRows = [];
        const editableCols = [5,6,7,8,9,10,11,12];
        
        for (let w of weeks) {
            for (let d of daysPerWeek[w]) {
                const currentDayMealTotalRows = [];
                for (let mt of activeMeals) {
                    const meal = currentTemplateData.weeks[w]?.[d]?.[mt];
                    const template = mealTemplate[mt];
                    if (!template) continue;
                    
                    const mealStartRow = currentRow;
                    let isFirstRowOfMeal = true;
                    const existingItems = (meal && meal.items) ? [...meal.items] : [];
                    
                    const itemsWithSection = {};
                    const itemsWithoutSection = [];
                    for (let item of existingItems) {
                        const section = normalizeSection(item.section);
                        if (section && section.trim()) {
                            if (!itemsWithSection[section]) itemsWithSection[section] = [];
                            itemsWithSection[section].push(item);
                        } else itemsWithoutSection.push(item);
                    }
                    
                    const dataSections = Object.keys(itemsWithSection);
                    const templateSections = template.sections.filter(s => s);
                    const extraSections = dataSections.filter(s => !templateSections.includes(s));
                    let allSections = [...template.sections];
                    for (let extra of extraSections) {
                        let insertPos = allSections.length;
                        for (let i = allSections.length - 1; i >= 0; i--) {
                            if (allSections[i] !== '') { insertPos = i + 1; break; }
                        }
                        allSections.splice(insertPos, 0, extra);
                    }
                    
                    const freeSlotIndices = allSections.reduce((acc, s, i) => { if (s === '') acc.push(i); return acc; }, []);
                    let freeSlotUsed = 0;
                    const orphanItemsBySlot = {};
                    for (let item of itemsWithoutSection) {
                        if (freeSlotUsed < freeSlotIndices.length) {
                            const slotIdx = freeSlotIndices[freeSlotUsed];
                            if (!orphanItemsBySlot[slotIdx]) orphanItemsBySlot[slotIdx] = [];
                            orphanItemsBySlot[slotIdx].push(item);
                            freeSlotUsed++;
                        } else {
                            const newSlotIdx = allSections.length;
                            allSections.push('');
                            if (!orphanItemsBySlot[newSlotIdx]) orphanItemsBySlot[newSlotIdx] = [];
                            orphanItemsBySlot[newSlotIdx].push(item);
                        }
                    }
                    
                    let rowsInThisMeal = 0;
                    for (let sectionIdx = 0; sectionIdx < allSections.length; sectionIdx++) {
                        const sectionName = allSections[sectionIdx];
                        const orphanItems = orphanItemsBySlot[sectionIdx] || [];
                        
                        if (sectionName === '' && orphanItems.length === 0) {
                            if (isFirstRowOfMeal) {
                                worksheet.getCell(`A${currentRow}`).value = w;
                                worksheet.getCell(`B${currentRow}`).value = d;
                                worksheet.getCell(`C${currentRow}`).value = template.name;
                                isFirstRowOfMeal = false;
                            } else {
                                worksheet.getCell(`A${currentRow}`).value = '';
                                worksheet.getCell(`B${currentRow}`).value = '';
                                worksheet.getCell(`C${currentRow}`).value = '';
                            }
                            for (let col = 1; col <= 12; col++) {
                                worksheet.getCell(currentRow, col).border = borderStyle;
                                if (editableCols.includes(col)) worksheet.getCell(currentRow, col).fill = goldFill;
                            }
                            rowsInThisMeal++;
                            currentRow++;
                            continue;
                        }
                        
                        if (sectionName === '' && orphanItems.length > 0) {
                            for (let item of orphanItems) {
                                if (isFirstRowOfMeal) {
                                    worksheet.getCell(`A${currentRow}`).value = w;
                                    worksheet.getCell(`B${currentRow}`).value = d;
                                    worksheet.getCell(`C${currentRow}`).value = template.name;
                                    isFirstRowOfMeal = false;
                                } else {
                                    worksheet.getCell(`A${currentRow}`).value = '';
                                    worksheet.getCell(`B${currentRow}`).value = '';
                                    worksheet.getCell(`C${currentRow}`).value = '';
                                }
                                worksheet.getCell(`D${currentRow}`).value = '';
                                worksheet.getCell(`D${currentRow}`).fill = goldFill;
                                for (let col of editableCols) worksheet.getCell(currentRow, col).fill = goldFill;
                                if (item.name && item.name.trim()) {
                                    worksheet.getCell(`E${currentRow}`).value = item.name;
                                    worksheet.getCell(`F${currentRow}`).value = item.weight || 0;
                                    worksheet.getCell(`G${currentRow}`).value = item.proteins || 0;
                                    worksheet.getCell(`H${currentRow}`).value = item.fats || 0;
                                    worksheet.getCell(`I${currentRow}`).value = item.carbs || 0;
                                    worksheet.getCell(`J${currentRow}`).value = item.calories || 0;
                                    worksheet.getCell(`K${currentRow}`).value = item.recipeId || '';
                                    worksheet.getCell(`L${currentRow}`).value = item.price || 0;
                                }
                                for (let col = 1; col <= 12; col++) worksheet.getCell(currentRow, col).border = borderStyle;
                                rowsInThisMeal++;
                                currentRow++;
                            }
                            continue;
                        }
                        
                        const sectionItems = itemsWithSection[sectionName] || [];
                        if (sectionItems.length === 0) {
                            if (isFirstRowOfMeal) {
                                worksheet.getCell(`A${currentRow}`).value = w;
                                worksheet.getCell(`B${currentRow}`).value = d;
                                worksheet.getCell(`C${currentRow}`).value = template.name;
                                isFirstRowOfMeal = false;
                            } else {
                                worksheet.getCell(`A${currentRow}`).value = '';
                                worksheet.getCell(`B${currentRow}`).value = '';
                                worksheet.getCell(`C${currentRow}`).value = '';
                            }
                            worksheet.getCell(`D${currentRow}`).value = sectionName;
                            worksheet.getCell(`D${currentRow}`).fill = goldFill;
                            for (let col of editableCols) worksheet.getCell(currentRow, col).fill = goldFill;
                            for (let col = 1; col <= 12; col++) worksheet.getCell(currentRow, col).border = borderStyle;
                            rowsInThisMeal++;
                            currentRow++;
                        } else {
                            for (let item of sectionItems) {
                                if (isFirstRowOfMeal) {
                                    worksheet.getCell(`A${currentRow}`).value = w;
                                    worksheet.getCell(`B${currentRow}`).value = d;
                                    worksheet.getCell(`C${currentRow}`).value = template.name;
                                    isFirstRowOfMeal = false;
                                } else {
                                    worksheet.getCell(`A${currentRow}`).value = '';
                                    worksheet.getCell(`B${currentRow}`).value = '';
                                    worksheet.getCell(`C${currentRow}`).value = '';
                                }
                                worksheet.getCell(`D${currentRow}`).value = sectionName;
                                worksheet.getCell(`D${currentRow}`).fill = goldFill;
                                for (let col of editableCols) worksheet.getCell(currentRow, col).fill = goldFill;
                                if (item.name && item.name.trim()) {
                                    worksheet.getCell(`E${currentRow}`).value = item.name;
                                    worksheet.getCell(`F${currentRow}`).value = item.weight || 0;
                                    worksheet.getCell(`G${currentRow}`).value = item.proteins || 0;
                                    worksheet.getCell(`H${currentRow}`).value = item.fats || 0;
                                    worksheet.getCell(`I${currentRow}`).value = item.carbs || 0;
                                    worksheet.getCell(`J${currentRow}`).value = item.calories || 0;
                                    worksheet.getCell(`K${currentRow}`).value = item.recipeId || '';
                                    worksheet.getCell(`L${currentRow}`).value = item.price || 0;
                                }
                                for (let col = 1; col <= 12; col++) worksheet.getCell(currentRow, col).border = borderStyle;
                                rowsInThisMeal++;
                                currentRow++;
                            }
                        }
                    }
                    
                    const mealEndRow = currentRow - 1;
                    worksheet.getCell(`C${currentRow}`).value = 'итого';
                    if (rowsInThisMeal > 0) {
                        worksheet.getCell(`F${currentRow}`).value = { formula: `SUM(F${mealStartRow}:F${mealEndRow})` };
                        worksheet.getCell(`G${currentRow}`).value = { formula: `SUM(G${mealStartRow}:G${mealEndRow})` };
                        worksheet.getCell(`H${currentRow}`).value = { formula: `SUM(H${mealStartRow}:H${mealEndRow})` };
                        worksheet.getCell(`I${currentRow}`).value = { formula: `SUM(I${mealStartRow}:I${mealEndRow})` };
                        worksheet.getCell(`J${currentRow}`).value = { formula: `SUM(J${mealStartRow}:J${mealEndRow})` };
                        worksheet.getCell(`L${currentRow}`).value = { formula: `SUM(L${mealStartRow}:L${mealEndRow})` };
                    }
                    for (let col = 1; col <= 12; col++) {
                        worksheet.getCell(currentRow, col).border = borderStyle;
                        worksheet.getCell(currentRow, col).font = { bold: true };
                    }
                    currentDayMealTotalRows.push(currentRow);
                    currentRow++;
                }
                
                if (currentDayMealTotalRows.length > 0) {
                    worksheet.getCell(`C${currentRow}`).value = 'Итого за день:';
                    ['F','G','H','I','J','L'].forEach(col => {
                        worksheet.getCell(`${col}${currentRow}`).value = { formula: currentDayMealTotalRows.map(r => `${col}${r}`).join('+') };
                    });
                    for (let col = 1; col <= 12; col++) {
                        worksheet.getCell(currentRow, col).border = borderStyle;
                        worksheet.getCell(currentRow, col).font = { bold: true };
                        if (editableCols.includes(col)) worksheet.getCell(currentRow, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
                    }
                    dayTotalRows.push(currentRow);
                    currentRow++;
                }
            }
        }
        
        if (dayTotalRows.length > 0) {
            currentRow++;
            worksheet.getCell(`C${currentRow}`).value = 'Среднее значение за период:';
            const countNonZeroParts = dayTotalRows.map(r => `IF(F${r}=0,0,1)`).join('+');
            ['F','G','H','I','J','L'].forEach(col => {
                const sumDays = dayTotalRows.map(r => `${col}${r}`).join('+');
                worksheet.getCell(`${col}${currentRow}`).value = { formula: `(${sumDays})/(${countNonZeroParts})` };
            });
            for (let col = 1; col <= 12; col++) {
                worksheet.getCell(currentRow, col).border = borderStyle;
                worksheet.getCell(currentRow, col).font = { bold: true };
                if (editableCols.includes(col)) worksheet.getCell(currentRow, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E8F5' } };
            }
        }
        
        // Ширина столбцов
        const colWidths = [3.89, 4.56, 8.33, 10.78, 51.78, 8.56, 9.22, 6.78, 6.11, 7.33, 9.22, 8.33];
        colWidths.forEach((w, i) => worksheet.getColumn(i + 1).width = w);
        worksheet.getRow(5).height = 52.8;
        for (let row = 1; row <= 4; row++) worksheet.getRow(row).height = 20;
        for (let row = 6; row <= currentRow; row++) worksheet.getRow(row).height = 18;
        
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `tm2026-sm_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`);
        showStatus('📥 Excel файл сгенерирован по шаблону', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showStatus(`Ошибка экспорта: ${error.message}`, 'error');
    }
}

// ========== ПАРСИНГ ФАЙЛА ==========
async function loadTemplateFile(file) {
    try {
        const data = await readExcelFile(file);
        const { template, schoolInfo: parsedSchool } = parseRealTemplateFile(data);
        
        if (template && template.weeks && Object.keys(template.weeks).length > 0) {
            currentTemplateData = template;
            originalTemplateData = deepClone(template);
            schoolInfo = parsedSchool;
            
            localStorage.setItem('schoolInfo', JSON.stringify(schoolInfo));
            updateSchoolInfoUI();
            
            historyStack = [deepClone(template)];
            historyIndex = 0;
            flatItems = buildFlatFromTemplate(currentTemplateData);
            renderEditorContent();
            showStatus(`✅ Файл "${file.name}" загружен! Найдено ${flatItems.length} блюд.`, 'success');
        } else {
            showStatus('❌ Не удалось прочитать меню из файла. Проверьте структуру.', 'error');
        }
    } catch (error) {
        console.error('Load error:', error);
        showStatus(`❌ Ошибка: ${error.message}`, 'error');
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
            } catch (error) { reject(error); }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function parseRealTemplateFile(data) {
    if (!data || !data.length) return { template: { weeks: {} }, schoolInfo: { name: "", ageCategory: "7-11 лет", approval: { position: "Директор", name: "", date: "12.01.2026" } } };
    
    let schoolName = "", approvalPosition = "Директор", approvalName = "", approvalDay = "12", approvalMonth = "1", approvalYear = "2026";
    
    const getCellValue = (row, colIndex, def = "") => (row && row.length > colIndex && row[colIndex] !== undefined && row[colIndex] !== null && row[colIndex] !== "") ? row[colIndex] : def;
    const extractNumber = (val, def = null) => {
        if (val === null || val === undefined || val === "") return def;
        if (typeof val === 'number') return val;
        if (typeof val === 'string') { const num = parseInt(val.trim()); if (!isNaN(num)) return num; }
        return def;
    };
    
    if (data[0] && data[0][2]) schoolName = data[0][2].toString().trim();
    if (data[0] && data[0][7]) approvalPosition = data[0][7].toString().trim();
    if (data[1] && data[1][7]) approvalName = data[1][7].toString().trim();
    
    if (data[2]) {
        const dayVal = getCellValue(data[2], 7, null);
        const monthVal = getCellValue(data[2], 8, null);
        const yearVal = getCellValue(data[2], 9, null);
        const dayNum = extractNumber(dayVal, null);
        const monthNum = extractNumber(monthVal, null);
        const yearNum = extractNumber(yearVal, null);
        if (dayNum !== null && dayNum >= 1 && dayNum <= 31) approvalDay = dayNum.toString();
        if (monthNum !== null && monthNum >= 1 && monthNum <= 12) approvalMonth = monthNum.toString();
        if (yearNum !== null && yearNum >= 2000 && yearNum <= 2100) approvalYear = yearNum.toString();
    }
    
    const approvalDate = `${approvalDay.padStart(2,'0')}.${approvalMonth.padStart(2,'0')}.${approvalYear}`;
    const schoolInfoParsed = {
        name: schoolName || "МОУ \"Сказочная СОШ\"",
        ageCategory: "7-11 лет",
        approval: { position: approvalPosition || "Директор", name: approvalName || "", date: approvalDate }
    };
    
    const template = { weeks: {} };
    let currentWeek = null, currentDay = null, currentMealType = null;
    
    for (let i = 5; i < Math.min(data.length, 2000); i++) {
        const row = data[i];
        if (!row || row.length < 4) continue;
        
        const weekVal = row[0] && row[0].toString().trim();
        const dayVal = row[1] && row[1].toString().trim();
        
        if (weekVal && weekVal !== '' && !isNaN(parseInt(weekVal))) currentWeek = parseInt(weekVal);
        if (dayVal && dayVal !== '' && !isNaN(parseInt(dayVal))) currentDay = parseInt(dayVal);
        
        if (currentWeek && currentDay) {
            if (!template.weeks[currentWeek]) template.weeks[currentWeek] = {};
            if (!template.weeks[currentWeek][currentDay]) {
                template.weeks[currentWeek][currentDay] = {
                    breakfast: { items: [] }, breakfast2: { items: [] }, lunch: { items: [] },
                    afternoonSnack: { items: [] }, dinner: { items: [] }, dinner2: { items: [] }
                };
            }
        }
        
        const mealRaw = row[2] ? row[2].toString().trim() : '';
        let newMealType = null;
        if (!mealRaw.toLowerCase().includes('итого')) {
            if (mealRaw.includes('Завтрак') && !mealRaw.includes('2')) newMealType = 'breakfast';
            else if (mealRaw.includes('Завтрак 2')) newMealType = 'breakfast2';
            else if (mealRaw.includes('Обед')) newMealType = 'lunch';
            else if (mealRaw.includes('Полдник')) newMealType = 'afternoonSnack';
            else if (mealRaw.includes('Ужин') && !mealRaw.includes('2')) newMealType = 'dinner';
            else if (mealRaw.includes('Ужин 2')) newMealType = 'dinner2';
            if (newMealType) currentMealType = newMealType;
        }
        
        const dishName = row[4] ? row[4].toString().trim() : '';
        if (dishName && dishName !== '' && !dishName.startsWith('=') && !dishName.toLowerCase().includes('итого') && !mealRaw.toLowerCase().includes('итого')) {
            if (currentWeek && currentDay && currentMealType && template.weeks[currentWeek] && template.weeks[currentWeek][currentDay]) {
                const mealObj = template.weeks[currentWeek][currentDay][currentMealType];
                if (mealObj) {
                    let weightRaw = row[5] ? row[5].toString().trim() : '0';
                    let totalWeight = 0;
                    if (weightRaw.includes('/')) {
                        for (let p of weightRaw.split('/')) { let v = parseFloat(p); if (!isNaN(v)) totalWeight += v; }
                    } else totalWeight = parseFloat(weightRaw) || 0;
                    
                    mealObj.items.push({
                        section: row[3] ? row[3].toString().trim() : '',
                        name: dishName,
                        weight: totalWeight,
                        calories: parseFloat(row[9]) || 0,
                        proteins: parseFloat(row[6]) || 0,
                        fats: parseFloat(row[7]) || 0,
                        carbs: parseFloat(row[8]) || 0,
                        recipeId: row[10] ? row[10].toString() : '',
                        price: parseFloat(row[11]) || 0
                    });
                }
            }
        }
    }
    
    if (Object.keys(template.weeks).length === 0) {
        for (let w = 1; w <= 2; w++) {
            template.weeks[w] = {};
            for (let d = 1; d <= 5; d++) {
                template.weeks[w][d] = {
                    breakfast: { items: [{ section: 'гор.блюдо', name: 'Каша рисовая', weight: 200, calories: 220, proteins: 5, fats: 6, carbs: 35, recipeId: '001', price: 15 }] },
                    breakfast2: { items: [{ section: 'фрукты', name: 'Яблоко', weight: 100, calories: 52, proteins: 0.3, fats: 0.2, carbs: 14, recipeId: '003', price: 20 }] },
                    lunch: { items: [{ section: '1 блюдо', name: 'Суп куриный', weight: 250, calories: 120, proteins: 8, fats: 5, carbs: 10, recipeId: '004', price: 25 }] },
                    afternoonSnack: { items: [] },
                    dinner: { items: [{ section: 'гор.блюдо', name: 'Котлета', weight: 100, calories: 250, proteins: 15, fats: 18, carbs: 10, recipeId: '005', price: 30 }] },
                    dinner2: { items: [] }
                };
            }
        }
    }
    
    return { template, schoolInfo: schoolInfoParsed };
}

// ========== УПРАВЛЕНИЕ ИНФОРМАЦИЕЙ О ШКОЛЕ ==========
function updateSchoolInfoUI() {
    const schoolNameInput = document.getElementById('schoolNameInput');
    const positionInput = document.getElementById('approvalPositionInput');
    const nameInput = document.getElementById('approvalNameInput');
    const dateInput = document.getElementById('approvalDateInput');
    
    if (schoolNameInput) schoolNameInput.value = schoolInfo.name || '';
    if (positionInput) positionInput.value = schoolInfo.approval?.position || 'Директор';
    if (nameInput) nameInput.value = schoolInfo.approval?.name || '';
    if (dateInput && schoolInfo.approval?.date) {
        const dateParts = schoolInfo.approval.date.split('.');
        if (dateParts.length === 3) dateInput.value = `${dateParts[2]}-${dateParts[1].padStart(2,'0')}-${dateParts[0].padStart(2,'0')}`;
    }
}

function saveSchoolInfo() {
    const schoolNameInput = document.getElementById('schoolNameInput');
    const positionInput = document.getElementById('approvalPositionInput');
    const nameInput = document.getElementById('approvalNameInput');
    const dateInput = document.getElementById('approvalDateInput');
    
    let newDate = '12.01.2026';
    if (dateInput?.value) {
        const dateParts = dateInput.value.split('-');
        if (dateParts.length === 3) newDate = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;
    }
    
    schoolInfo = {
        name: schoolNameInput?.value || '',
        ageCategory: schoolInfo.ageCategory || "7-11 лет",
        approval: {
            position: positionInput?.value || 'Директор',
            name: nameInput?.value || '',
            date: newDate
        }
    };
    localStorage.setItem('schoolInfo', JSON.stringify(schoolInfo));
    showStatus('✅ Информация об организации сохранена', 'success');
    if (currentTemplateData) renderEditorContent();
}

function loadSchoolInfoFromStorage() {
    const saved = localStorage.getItem('schoolInfo');
    if (saved) {
        try {
            const savedInfo = JSON.parse(saved);
            schoolInfo = {
                name: savedInfo.name || "",
                ageCategory: savedInfo.ageCategory || "7-11 лет",
                approval: {
                    position: savedInfo.approval?.position || "Директор",
                    name: savedInfo.approval?.name || "",
                    date: savedInfo.approval?.date || "12.01.2026"
                }
            };
        } catch(e) {}
    }
    updateSchoolInfoUI();
}

// ========== ОТЧЁТ ==========
// ========== ОТЧЁТ ==========
function showReport() {
    if (!currentTemplateData) { 
        showStatus('Нет данных для анализа', 'error'); 
        return; 
    }
    allViolations = runAllRules(currentTemplateData);
    
    const totalWeight = flatItems.reduce((s, i) => s + i.weight, 0);
    const totalCalories = flatItems.reduce((s, i) => s + i.calories, 0);
    const totalDays = Object.keys(currentTemplateData.weeks).reduce((sum, w) => sum + Object.keys(currentTemplateData.weeks[w]).length, 0);
    const totalWeeks = Object.keys(currentTemplateData.weeks).length;
    const avgWeightPerDay = totalDays > 0 ? (totalWeight / totalDays).toFixed(0) : 0;
    
    const errorsCount = allViolations.filter(v => v.code === 15).length;
    const warningsCount = allViolations.filter(v => v.code !== 15 && v.code !== 17).length;
    const duplicatesCount = allViolations.filter(v => v.code === 17).length;
    
    let html = `
        <style>
            .report-section { margin-bottom: 24px; }
            .report-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
            .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }
            .stat-item { background: #f8fafc; padding: 12px; border-radius: 16px; text-align: center; }
            .stat-value { font-size: 1.4rem; font-weight: 800; color: #0f172a; }
            .stat-label { font-size: 0.7rem; color: #64748b; margin-top: 4px; }
            .violation-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; margin-bottom: 16px; }
            .violation-table th, .violation-table td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; vertical-align: top; }
            .violation-table th { background: #f1f5f9; font-weight: 700; }
            .violation-critical { background: #fef2f2; border-left: 3px solid #ef4444; }
            .violation-warning { background: #fffbeb; border-left: 3px solid #f59e0b; }
            .violation-duplicate { background: #fdf2f8; border-left: 3px solid #ec4899; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 0.65rem; font-weight: 600; }
            .badge-error { background: #fee2e2; color: #dc2626; }
            .badge-warning { background: #fef3c7; color: #d97706; }
            .summary-box { background: linear-gradient(135deg, #f0fdf4, #dcfce7); padding: 16px; border-radius: 16px; margin-bottom: 20px; }
        </style>
        
        <div class="report-section">
            <div class="report-title"><i class="fas fa-chart-pie"></i> Общая статистика</div>
            <div class="stat-grid">
                <div class="stat-item"><div class="stat-value">${flatItems.length}</div><div class="stat-label">🍽️ Всего блюд</div></div>
                <div class="stat-item"><div class="stat-value">${totalWeeks}</div><div class="stat-label">📅 Недель</div></div>
                <div class="stat-item"><div class="stat-value">${totalDays}</div><div class="stat-label">📆 Дней</div></div>
                <div class="stat-item"><div class="stat-value">${avgWeightPerDay}</div><div class="stat-label">⚖️ Средний вес/день (г)</div></div>
                <div class="stat-item"><div class="stat-value">${totalWeight}</div><div class="stat-label">🏋️ Общий вес (г)</div></div>
                <div class="stat-item"><div class="stat-value">${totalCalories}</div><div class="stat-label">🔥 Общая калорийность</div></div>
            </div>
        </div>
        
        <div class="summary-box" style="border-left: 4px solid ${allViolations.length === 0 ? '#10b981' : (errorsCount > 0 ? '#ef4444' : '#f59e0b')};">
            <strong>📊 Статус проверки:</strong> 
            ${allViolations.length === 0 ? '✅ Все правила выполнены' : `⚠️ Найдено ${allViolations.length} нарушений (${errorsCount} критических, ${warningsCount} предупреждений, ${duplicatesCount} дубликатов)`}
        </div>
    `;
    
    if (allViolations.length > 0) {
        html += `
            <div class="report-section">
                <div class="report-title"><i class="fas fa-list"></i> Детальный список нарушений</div>
                <table class="violation-table">
                    <thead><tr><th>День</th><th>Приём пищи</th><th>Раздел</th><th>Блюдо</th><th>Нарушение</th><th>Значение</th><th>Норма</th></tr></thead>
                    <tbody>
        `;
        
        for (let v of allViolations.slice(0, 50)) {
            let mealName = '', sectionName = '', dishName = '';
            const mealNames = { 'breakfast':'Завтрак','breakfast2':'2-й завтрак','lunch':'Обед','afternoonSnack':'Полдник','dinner':'Ужин','dinner2':'2-й ужин' };
            mealName = (v.meal && mealNames[v.meal]) || (v.meal || 'Весь день');
            
            if (v.itemIndex !== undefined && v.meal) {
                const mealData = currentTemplateData.weeks[v.week]?.[v.day]?.[v.meal];
                if (mealData && mealData.items && mealData.items[v.itemIndex]) {
                    const item = mealData.items[v.itemIndex];
                    dishName = item.name || '—';
                    sectionName = item.section || '—';
                }
            }
            
            let violationText = '', currentValue = '', normValue = '';
            switch(v.code) {
                case 1: violationText='Вес завтрака'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥500г'; break;
                case 2: violationText='Вес обеда'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥700г'; break;
                case 3: violationText='Вес гор.блюда'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥150г'; break;
                case 4: violationText='Вес закуски'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥60г'; break;
                case 5: violationText='Вес 1 блюда'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥200г'; break;
                case 6: violationText='Вес 2 блюда'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥90г'; break;
                case 8: violationText='Вес гарнира'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥150г'; break;
                case 9: violationText='Вес 2 завтрака'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥200г'; break;
                case 10: violationText='Вес полдника'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥300г'; break;
                case 11: violationText='Вес ужина'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥500г'; break;
                case 12: violationText='Вес 2 ужина'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥200г'; break;
                case 13: violationText='Калории завтрака'; currentValue=v.details.match(/(\d+)ккал/)?.[1]||'?'; normValue='≥470ккал'; break;
                case 14: violationText='Калории обеда'; currentValue=v.details.match(/(\d+)ккал/)?.[1]||'?'; normValue='≥705ккал'; break;
                case 15: violationText='БЖУ > веса'; currentValue=v.details; normValue='БЖУ ≤ вес'; break;
                case 16: violationText='Фрукты за день'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥100г'; break;
                case 17: violationText='Дубликат блюда'; currentValue=v.details.replace('Повтор блюда: "','').replace('"',''); normValue='Уникальные блюда'; break;
                default: violationText=v.details; currentValue='—'; normValue='—';
            }
            
            const statusClass = v.code === 15 ? 'violation-critical' : (v.code === 17 ? 'violation-duplicate' : 'violation-warning');
            html += `<tr class="${statusClass}">
                <td>Неделя ${v.week}, День ${v.day}</td>
                <td>${mealName}</td>
                <td>${escapeHtml(sectionName)}</td>
                <td>${escapeHtml(dishName)}</td>
                <td>${violationText}</td>
                <td>${escapeHtml(currentValue)}</td>
                <td>${normValue}</td>
            </tr>`;
        }
        
        if (allViolations.length > 50) {
            html += `<tr><td colspan="7">... и ещё ${allViolations.length - 50} нарушений</td></tr>`;
        }
        
        html += `</tbody></table></div>`;
    }
    
    document.getElementById('reportContent').innerHTML = html;
    document.getElementById('reportModal').style.display = 'flex';
}

// ========== ВАЛИДАЦИЯ ==========
function validateMenu() {
    renderEditorContent();
    showStatus('✅ Проверка выполнена. Посмотрите панель правил и статистику.', 'success');
}

// ========== СБРОС К ОРИГИНАЛУ ==========
function resetToOriginal() {
    if (originalTemplateData) {
        currentTemplateData = deepClone(originalTemplateData);
        saveToHistory();
        flatItems = buildFlatFromTemplate(currentTemplateData);
        renderEditorContent();
        showStatus('🔄 Сброшено к оригинальному файлу', 'success');
    }
}

// ========== ОБНОВЛЕНИЕ ТАБЛИЦЫ ==========
function refreshTable() {
    if (!currentTemplateData) return;
    flatItems = buildFlatFromTemplate(currentTemplateData);
    renderEditorContent();
    showStatus('Таблица обновлена', 'info');
}

// ========== СОХРАНЕНИЕ В STORAGE ==========
function saveToStorage() {
    if (currentTemplateData) {
        localStorage.setItem('autoSavedMenu', JSON.stringify(currentTemplateData));
        const badge = document.getElementById('autoSaveBadge');
        if (badge) {
            badge.style.opacity = '1';
            setTimeout(() => badge.style.opacity = '0.7', 1000);
        }
    }
}

function loadFromStorage() {
    const saved = localStorage.getItem('autoSavedMenu');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Проверяем и восстанавливаем структуру
            if (parsed && parsed.weeks) {
                // Убеждаемся, что у каждого дня есть все приёмы пищи
                for (let w in parsed.weeks) {
                    for (let d in parsed.weeks[w]) {
                        for (let mt of MEAL_TYPES) {
                            if (!parsed.weeks[w][d][mt]) {
                                parsed.weeks[w][d][mt] = { items: [] };
                            }
                        }
                    }
                }
                currentTemplateData = parsed;
                flatItems = buildFlatFromTemplate(currentTemplateData);
                renderEditorContent();
                showStatus('💾 Загружено автосохранение', 'info');
                return true;
            }
        } catch(e) { console.error('Load from storage error:', e); }
    }
    return false;
}

// ========== УМНЫЙ ПОМОЩНИК ==========
// ========== УМНЫЙ ПОМОЩНИК ==========
function showAssistant() {
    const modal = document.getElementById('assistantModal');
    const content = document.getElementById('assistantContent');
    if (!modal || !content) return;
    
    content.innerHTML = `
        <div class="assistant-message assistant-ai">
            <div class="assistant-avatar">
                <i class="fas fa-robot" style="color: #7c3aed;"></i>
                <span>🤖 Помощник</span>
            </div>
            <div>Здравствуйте! Я ваш персональный помощник по работе с меню.</div>
        </div>
        
        <div class="quick-actions">
            <button class="quick-btn" data-action="check-all"><i class="fas fa-check-double"></i> Проверить всё меню</button>
            <button class="quick-btn" data-action="fix-bju"><i class="fas fa-calculator"></i> Как исправить БЖУ?</button>
            <button class="quick-btn" data-action="weight-norms"><i class="fas fa-weight-hanging"></i> Нормы веса</button>
            <button class="quick-btn" data-action="calories-norms"><i class="fas fa-fire"></i> Нормы калорий</button>
            <button class="quick-btn" data-action="duplicates"><i class="fas fa-copy"></i> Как избежать дубликатов?</button>
        </div>
        
        <div class="assistant-message assistant-tip">
            <div class="assistant-avatar">
                <i class="fas fa-lightbulb"></i>
                <span>💡 Полезные советы</span>
            </div>
            <ul style="margin-left: 20px;">
                <li>Используйте массовые операции для быстрого изменения веса блюд</li>
                <li>Правило 15 (БЖУ) — самое важное! Сумма белков, жиров и углеводов не должна превышать вес</li>
                <li>Для проверки соответствия нормам используйте кнопку "Проверить"</li>
                <li>Автосохранение работает каждые 30 секунд</li>
                <li>Нажмите на любое правило в панели правил — помощник покажет где ошибка</li>
            </ul>
        </div>
        
        <div class="assistant-message assistant-ai">
            <div class="assistant-avatar">
                <i class="fas fa-question-circle"></i>
                <span>❓ Частые вопросы</span>
            </div>
            <div>
                <details>
                    <summary><strong>Что делать, если БЖУ превышает вес блюда?</strong></summary>
                    <div style="margin-top: 8px; padding-left: 16px;">
                        Это критическая ошибка! Есть два способа исправления:<br>
                        1. Уменьшить значения белков, жиров или углеводов<br>
                        2. Увеличить вес блюда (используйте кнопку "Умножить вес")
                    </div>
                </details>
                <details style="margin-top: 8px;">
                    <summary><strong>Как добавить новое блюдо?</strong></summary>
                    <div style="margin-top: 8px; padding-left: 16px;">
                        Нажмите кнопку "Добавить блюдо" в конце каждой группы приёма пищи.
                    </div>
                </details>
                <details style="margin-top: 8px;">
                    <summary><strong>Какие блюда обязательно должны быть на завтрак?</strong></summary>
                    <div style="margin-top: 8px; padding-left: 16px;">
                        Обязательно: горячее блюдо (каша, омлет, запеканка). Рекомендуется: горячий напиток, хлеб, фрукты.
                    </div>
                </details>
            </div>
        </div>
    `;
    
    // Добавляем обработчики быстрых действий
    content.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = btn.dataset.action;
            handleAssistantAction(action, content);
        });
    });
    
    modal.style.display = 'flex';
}

function handleAssistantAction(action, content) {
    switch(action) {
        case 'check-all':
            renderEditorContent();
            showStatus('✅ Проверка выполнена', 'success');
            break;
        case 'fix-bju':
            content.innerHTML += `
                <div class="assistant-message assistant-ai">
                    <div class="assistant-avatar"><i class="fas fa-calculator"></i><span>Как исправить БЖУ > вес</span></div>
                    <div>
                        <strong>Пошаговая инструкция:</strong>
                        <ol style="margin-left: 20px; margin-top: 8px;">
                            <li>Найдите блюда с красной подсветкой (правило 15)</li>
                            <li>Проверьте правильность данных</li>
                            <li>Исправьте одно из двух: уменьшите БЖУ или увеличьте вес блюда</li>
                            <li>После исправления нажмите "Проверить"</li>
                        </ol>
                    </div>
                </div>
            `;
            break;
        case 'weight-norms':
            content.innerHTML += `
                <div class="assistant-message assistant-tip">
                    <div class="assistant-avatar"><i class="fas fa-weight-hanging"></i><span>Нормы веса по приёмам пищи</span></div>
                    <div>
                        <ul style="margin-left: 20px;">
                            <li>🌅 Завтрак: ≥500г</li>
                            <li>🍎 2-й завтрак: ≥200г</li>
                            <li>🍲 Обед: ≥700г</li>
                            <li>🍪 Полдник: ≥300г</li>
                            <li>🌙 Ужин: ≥500г</li>
                            <li>🥛 2-й ужин: ≥200г</li>
                        </ul>
                    </div>
                </div>
            `;
            break;
        case 'calories-norms':
            content.innerHTML += `
                <div class="assistant-message assistant-tip">
                    <div class="assistant-avatar"><i class="fas fa-fire"></i><span>Нормы калорийности</span></div>
                    <div>
                        <ul style="margin-left: 20px;">
                            <li>🌅 Завтрак: ≥470 ккал</li>
                            <li>🍲 Обед: ≥705 ккал</li>
                        </ul>
                    </div>
                </div>
            `;
            break;
        case 'duplicates':
            content.innerHTML += `
                <div class="assistant-message assistant-ai">
                    <div class="assistant-avatar"><i class="fas fa-copy"></i><span>Как избежать дубликатов блюд</span></div>
                    <div>
                        <strong>Правило 17 запрещает одинаковые блюда в один день.</strong><br><br>
                        <strong>Способы избежать:</strong>
                        <ol style="margin-left: 20px;">
                            <li>Используйте разные названия для похожих блюд</li>
                            <li>Разнообразьте меню — не повторяйте блюда в течение дня</li>
                            <li>При копировании дня меняйте названия блюд</li>
                        </ol>
                    </div>
                </div>
            `;
            break;
    }
    content.scrollTop = content.scrollHeight;
}

// ========== ЭКСПОРТ ОТЧЁТА ==========

function getReportDataForExport() {
    allViolations = runAllRules(currentTemplateData);
    
    const totalWeight = flatItems.reduce((s, i) => s + i.weight, 0);
    const totalCalories = flatItems.reduce((s, i) => s + i.calories, 0);
    const totalDays = Object.keys(currentTemplateData.weeks).reduce((sum, w) => sum + Object.keys(currentTemplateData.weeks[w]).length, 0);
    const totalWeeks = Object.keys(currentTemplateData.weeks).length;
    const avgWeightPerDay = totalDays > 0 ? (totalWeight / totalDays).toFixed(0) : 0;
    
    const errorsCount = allViolations.filter(v => v.code === 15).length;
    const warningsCount = allViolations.filter(v => v.code !== 15 && v.code !== 17).length;
    const duplicatesCount = allViolations.filter(v => v.code === 17).length;
    
    const violationsList = [];
    for (let v of allViolations) {
        let mealName = '', sectionName = '', dishName = '';
        const mealNames = { 'breakfast':'Завтрак','breakfast2':'2-й завтрак','lunch':'Обед','afternoonSnack':'Полдник','dinner':'Ужин','dinner2':'2-й ужин' };
        mealName = (v.meal && mealNames[v.meal]) || (v.meal || 'Весь день');
        
        if (v.itemIndex !== undefined && v.meal) {
            const mealData = currentTemplateData.weeks[v.week]?.[v.day]?.[v.meal];
            if (mealData && mealData.items && mealData.items[v.itemIndex]) {
                const item = mealData.items[v.itemIndex];
                dishName = item.name || '—';
                sectionName = item.section || '—';
            }
        }
        
        let violationText = '', currentValue = '', normValue = '';
        switch(v.code) {
            case 1: violationText='Вес завтрака'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥500г'; break;
            case 2: violationText='Вес обеда'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥700г'; break;
            case 3: violationText='Вес гор.блюда'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥150г'; break;
            case 4: violationText='Вес закуски'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥60г'; break;
            case 5: violationText='Вес 1 блюда'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥200г'; break;
            case 6: violationText='Вес 2 блюда'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥90г'; break;
            case 8: violationText='Вес гарнира'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥150г'; break;
            case 9: violationText='Вес 2 завтрака'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥200г'; break;
            case 10: violationText='Вес полдника'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥300г'; break;
            case 11: violationText='Вес ужина'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥500г'; break;
            case 12: violationText='Вес 2 ужина'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥200г'; break;
            case 13: violationText='Калории завтрака'; currentValue=v.details.match(/(\d+)ккал/)?.[1]||'?'; normValue='≥470ккал'; break;
            case 14: violationText='Калории обеда'; currentValue=v.details.match(/(\d+)ккал/)?.[1]||'?'; normValue='≥705ккал'; break;
            case 15: violationText='БЖУ > веса (крит.)'; currentValue=v.details; normValue='БЖУ ≤ вес'; break;
            case 16: violationText='Фрукты за день'; currentValue=v.details.match(/(\d+)г/)?.[1]||'?'; normValue='≥100г'; break;
            case 17: violationText='Дубликат блюда'; currentValue=v.details.replace('Повтор блюда: "','').replace('"',''); normValue='Уникальные блюда'; break;
            default: violationText=v.details; currentValue='—'; normValue='—';
        }
        
        violationsList.push({
            week: v.week, day: v.day, meal: mealName, section: sectionName, dish: dishName,
            violation: violationText, currentValue: currentValue, norm: normValue, code: v.code
        });
    }
    
    return {
        stats: {
            totalDishes: flatItems.length, totalWeeks: totalWeeks, totalDays: totalDays,
            avgWeightPerDay: avgWeightPerDay, totalWeight: totalWeight, totalCalories: totalCalories,
            errorsCount: errorsCount, warningsCount: warningsCount, duplicatesCount: duplicatesCount,
            totalViolations: allViolations.length,
            schoolName: schoolInfo.name || '—', approvalDate: schoolInfo.approval.date || '—'
        },
        violations: violationsList
    };
}

function exportReportToHTML() {
    const data = getReportDataForExport();
    const now = new Date();
    const dateStr = now.toLocaleString('ru-RU');
    
    let violationsHtml = '';
    for (let v of data.violations) {
        const criticalClass = v.code === 15 ? 'critical' : (v.code === 17 ? 'duplicate' : 'warning');
        violationsHtml += `
            <tr class="violation-${criticalClass}">
                <td>Неделя ${v.week}, День ${v.day}</td>
                <td>${v.meal}</td>
                <td>${escapeHtml(v.section)}</td>
                <td>${escapeHtml(v.dish)}</td>
                <td>${v.violation}</td>
                <td>${escapeHtml(v.currentValue)}</td>
                <td>${v.norm}</td>
            </tr>
        `;
    }
    
    const html = `<!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <title>Отчёт по меню от ${dateStr}</title>
        <style>
            * { font-family: 'Segoe UI', Arial, sans-serif; }
            body { padding: 40px; background: #f5f5f5; }
            .container { max-width: 1400px; margin: 0 auto; background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            h1 { color: #059669; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
            .stat-card { background: #f8fafc; padding: 15px; border-radius: 12px; text-align: center; border-left: 4px solid #059669; }
            .stat-value { font-size: 24px; font-weight: bold; }
            .violation-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .violation-table th, .violation-table td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
            .violation-table th { background: #f1f5f9; }
            .violation-critical { background: #fef2f2; }
            .violation-warning { background: #fffbeb; }
            .violation-duplicate { background: #fdf2f8; }
            .summary { background: #fef3c7; padding: 15px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            @media print { body { padding: 0; background: white; } }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📊 Детальный аналитический отчёт по типовому меню</h1>
            <p><strong>${escapeHtml(data.stats.schoolName)}</strong> | Дата утверждения: ${data.stats.approvalDate} | Сформирован: ${dateStr}</p>
            
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-value">${data.stats.totalDishes}</div><div>🍽️ Блюд</div></div>
                <div class="stat-card"><div class="stat-value">${data.stats.totalWeeks}</div><div>📅 Недель</div></div>
                <div class="stat-card"><div class="stat-value">${data.stats.totalDays}</div><div>📆 Дней</div></div>
                <div class="stat-card"><div class="stat-value">${data.stats.avgWeightPerDay}</div><div>⚖️ Ср. вес/день (г)</div></div>
                <div class="stat-card"><div class="stat-value">${data.stats.totalWeight}</div><div>🏋️ Общий вес (г)</div></div>
            </div>
            
            <div class="summary">
                <strong>📊 Статус проверки:</strong> 
                ${data.stats.totalViolations === 0 ? '✅ Все правила выполнены' : 
                  `⚠️ Найдено ${data.stats.totalViolations} нарушений (${data.stats.errorsCount} критических, ${data.stats.warningsCount} предупреждений, ${data.stats.duplicatesCount} дубликатов)`}
            </div>
            
            ${data.violations.length > 0 ? `
                <h2>📋 Список нарушений</h2>
                <table class="violation-table">
                    <thead><tr><th>День</th><th>Приём пищи</th><th>Раздел</th><th>Блюдо</th><th>Нарушение</th><th>Значение</th><th>Норма</th></tr></thead>
                    <tbody>${violationsHtml}</tbody>
                </table>
            ` : '<div style="text-align:center;padding:40px;">🎉 Отлично! Все правила соблюдены.</div>'}
            
            <div style="margin-top:30px; text-align:center; color:#94a3b8; font-size:12px;">
                Отчёт сгенерирован автоматически | PRO Редактор типового меню ФЦМПО
            </div>
        </div>
    </body>
    </html>`;
    
    const blob = new Blob([html], { type: 'text/html' });
    saveAs(blob, `report_menu_${now.toISOString().slice(0, 19).replace(/:/g, '-')}.html`);
    showStatus('📄 Отчёт сохранён в формате HTML', 'success');
}

function exportReportToTXT() {
    const data = getReportDataForExport();
    const now = new Date();
    const dateStr = now.toLocaleString('ru-RU');
    
    let lines = [];
    lines.push('=' .repeat(80));
    lines.push(`ДЕТАЛЬНЫЙ АНАЛИТИЧЕСКИЙ ОТЧЁТ ПО ТИПОВОМУ МЕНЮ`);
    lines.push(`Сформирован: ${dateStr}`);
    lines.push(`Организация: ${data.stats.schoolName}`);
    lines.push(`Дата утверждения: ${data.stats.approvalDate}`);
    lines.push('=' .repeat(80));
    lines.push('');
    lines.push('📊 ОБЩАЯ СТАТИСТИКА');
    lines.push('-'.repeat(80));
    lines.push(`Всего блюд: ${data.stats.totalDishes}`);
    lines.push(`Недель: ${data.stats.totalWeeks}`);
    lines.push(`Дней: ${data.stats.totalDays}`);
    lines.push(`Средний вес на день: ${data.stats.avgWeightPerDay} г`);
    lines.push(`Общий вес: ${data.stats.totalWeight} г`);
    lines.push('');
    lines.push('📊 СТАТУС ПРОВЕРКИ');
    lines.push('-'.repeat(80));
    
    if (data.stats.totalViolations === 0) {
        lines.push('✅ Все правила выполнены!');
    } else {
        lines.push(`⚠️ Найдено нарушений: ${data.stats.totalViolations}`);
        lines.push(`   - Критические ошибки: ${data.stats.errorsCount}`);
        lines.push(`   - Предупреждения: ${data.stats.warningsCount}`);
        lines.push(`   - Дубликаты: ${data.stats.duplicatesCount}`);
    }
    lines.push('');
    
    if (data.violations.length > 0) {
        lines.push('📋 ДЕТАЛЬНЫЙ СПИСОК НАРУШЕНИЙ');
        lines.push('-'.repeat(80));
        for (let v of data.violations) {
            lines.push(`[${v.code === 15 ? 'КРИТИЧНО' : (v.code === 17 ? 'ДУБЛИКАТ' : 'ПРЕДУПРЕЖДЕНИЕ')}]`);
            lines.push(`  День: Неделя ${v.week}, День ${v.day}`);
            lines.push(`  Приём пищи: ${v.meal}`);
            lines.push(`  Блюдо: ${v.dish}`);
            lines.push(`  Нарушение: ${v.violation} | Значение: ${v.currentValue} | Норма: ${v.norm}`);
            lines.push('');
        }
    }
    
    lines.push('=' .repeat(80));
    lines.push('Отчёт сгенерирован автоматически | PRO Редактор типового меню ФЦМПО');
    
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `report_menu_${now.toISOString().slice(0, 19).replace(/:/g, '-')}.txt`);
    showStatus('📄 Отчёт сохранён в формате TXT', 'success');
}

function exportReportToCSV() {
    const data = getReportDataForExport();
    const now = new Date();
    
    let csvRows = [['Тип', 'Неделя', 'День', 'Приём пищи', 'Раздел', 'Блюдо', 'Нарушение', 'Значение', 'Норма']];
    
    for (let v of data.violations) {
        let type = '';
        if (v.code === 15) type = 'Критическая ошибка';
        else if (v.code === 17) type = 'Дубликат';
        else type = 'Предупреждение';
        
        csvRows.push([
            type, v.week, v.day, v.meal, v.section, v.dish,
            v.violation, v.currentValue, v.norm
        ]);
    }
    
    csvRows.push([]);
    csvRows.push(['СТАТИСТИКА', '', '', '', '', '', '', '', '']);
    csvRows.push(['Всего блюд', data.stats.totalDishes]);
    csvRows.push(['Всего недель', data.stats.totalWeeks]);
    csvRows.push(['Всего дней', data.stats.totalDays]);
    csvRows.push(['Средний вес/день', data.stats.avgWeightPerDay]);
    csvRows.push(['Общий вес', data.stats.totalWeight]);
    csvRows.push(['Всего нарушений', data.stats.totalViolations]);
    
    const csvContent = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `report_menu_${now.toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
    showStatus('📄 Отчёт сохранён в формате CSV', 'success');
}

// ========== ИНИЦИАЛИЗАЦИЯ МОДУЛЯ ==========
export async function renderEditor(container) {
    container.innerHTML = `
        <div class="editor-module" style="animation:fadeIn 0.5s ease;">
            <div class="card">
                <div class="card-title"><i class="fas fa-cloud-upload-alt"></i> Редактор типового меню</div>
                <div id="dropZone" class="file-zone">
                    <i class="fas fa-file-excel fa-4x" style="color:#10b981; margin-bottom:16px;"></i>
                    <h3>Перетащите файл <span style="color:#059669;">tm2026-sm.xlsx</span></h3>
                    <p>или кликните для выбора</p>
                    <input type="file" id="fileInput" accept=".xlsx,.xls" style="display:none">
                </div>
                
                <div style="margin-top:20px; padding:16px; background:#f8fafc; border-radius:20px;">
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
                        <i class="fas fa-school" style="color:#059669;"></i>
                        <strong>Информация об организации</strong>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px;">
                        <div><label style="font-size:12px; color:#64748b;">Название школы</label><input type="text" id="schoolNameInput" class="search-input-premium" style="width:100%;"></div>
                        <div><label style="font-size:12px; color:#64748b;">Должность</label><input type="text" id="approvalPositionInput" class="search-input-premium" style="width:100%;"></div>
                        <div><label style="font-size:12px; color:#64748b;">ФИО</label><input type="text" id="approvalNameInput" class="search-input-premium" style="width:100%;"></div>
                        <div><label style="font-size:12px; color:#64748b;">Дата утверждения</label><input type="date" id="approvalDateInput" class="search-input-premium" style="width:100%;"></div>
                    </div>
                    <div style="margin-top:12px; text-align:right;">
                        <button id="updateSchoolInfoBtn" class="btn btn-primary" style="padding:6px 16px;"><i class="fas fa-save"></i> Сохранить</button>
                    </div>
                </div>
                
                <div class="actions-grid-premium" style="display:flex; flex-wrap:wrap; gap:8px; margin-top:20px;">
                    <button id="undoBtn" class="action-btn secondary"><i class="fas fa-undo-alt"></i> Отменить</button>
                    <button id="redoBtn" class="action-btn secondary"><i class="fas fa-redo-alt"></i> Повторить</button>
                    <button id="mergeSectionsBtn" class="action-btn info"><i class="fas fa-compress-alt"></i> Объединить разделы</button>
                    <button id="copyDayBtn" class="action-btn purple"><i class="fas fa-copy"></i> Копировать день</button>
                    <button id="addWeekBtn" class="action-btn success"><i class="fas fa-calendar-plus"></i> Добавить неделю</button>
                    <button id="refreshTableBtn" class="action-btn warning"><i class="fas fa-sync-alt"></i> Обновить</button>
                    <button id="printViewBtn" class="action-btn secondary"><i class="fas fa-print"></i> Печать</button>
                    <button id="createStandardMenuBtn" class="action-btn" style="background:linear-gradient(135deg,#10b981,#059669);color:white;"><i class="fas fa-magic"></i> Создать меню</button>
                    <button id="saveChangesBtn" class="action-btn primary"><i class="fas fa-save"></i> Сохранить</button>
                    <button id="exportExcelBtn" class="action-btn success"><i class="fas fa-download"></i> Экспорт</button>
                    <button id="validateOnlyBtn" class="action-btn warning"><i class="fas fa-check-double"></i> Проверить</button>
                    <button id="compareBtn" class="action-btn info"><i class="fas fa-chart-line"></i> Отчёт</button>
                    <button id="resetToOriginalBtn" class="action-btn danger"><i class="fas fa-undo-alt"></i> Сброс</button>
                </div>
                
                <div style="margin-top:20px;">
                    <div class="search-bar" style="display:flex; gap:12px; flex-wrap:wrap;">
                        <input type="text" id="searchInput" placeholder="Поиск по названию..." class="search-input-premium" style="flex:1;">
                        <select id="filterMealSelect" class="filter-select-premium">
                            <option value="">Все приёмы пищи</option>
                            <option value="breakfast">Завтрак</option>
                            <option value="breakfast2">2-й завтрак</option>
                            <option value="lunch">Обед</option>
                            <option value="afternoonSnack">Полдник</option>
                            <option value="dinner">Ужин</option>
                            <option value="dinner2">2-й ужин</option>
                        </select>
                        <select id="filterStatusSelect" class="filter-select-premium">
                            <option value="">Все блюда</option>
                            <option value="error">С ошибками</option>
                            <option value="warning">С предупреждениями</option>
                        </select>
                        <button id="clearFiltersBtn" class="btn-filter-clear"><i class="fas fa-times"></i> Сбросить</button>
                    </div>
                    <div id="activeFilters" class="active-filters"></div>
                </div>
                
                <div id="statsPanel" class="stats-grid-premium" style="margin-top:20px;"></div>
                <div class="rules-container-premium"><div class="rules-header"><i class="fas fa-gavel"></i><span>Контроль качества (16 правил)</span><button id="toggleRulesBtn" class="toggle-rules"><i class="fas fa-chevron-up"></i></button></div><div id="rulesPanel" class="rules-panel-premium"></div></div>
                <div id="batchActions" class="batch-panel-premium" style="display:none; margin-top:16px;">
                    <div class="batch-header"><i class="fas fa-check-square"></i><span>Массовые операции</span><span id="selectedCount">0</span></div>
                    <div class="batch-controls">
                        <button id="batchDeleteBtn" class="batch-btn danger"><i class="fas fa-trash-alt"></i> Удалить</button>
                        <select id="batchSectionSelect" class="batch-select"><option value="">Сменить раздел...</option>${VALID_SECTIONS.map(s => `<option value="${s}">${s}</option>`).join('')}</select>
                        <button id="batchApplySectionBtn" class="batch-btn primary"><i class="fas fa-check"></i> Применить</button>
                        <input type="number" id="batchMultiplier" placeholder="1.2" step="0.1" value="1.2" style="width:70px;">
                        <button id="batchMultiplyBtn" class="batch-btn success"><i class="fas fa-times"></i> Умножить вес</button>
                    </div>
                </div>
                
                <div id="editorContent" style="margin-top:20px;"></div>
            </div>
        </div>
        
        <div id="addMealModal" class="modal" style="display:none;"><div class="modal-content" style="max-width:600px;"><div class="card-title"><i class="fas fa-plus-circle"></i> Добавить приём пищи</div>
            <div style="display:flex; gap:8px; margin-bottom:20px;"><button id="mealTabSingle" class="tab-btn active" data-tab="single" style="padding:8px 16px; background:none; border:none; cursor:pointer; font-weight:600; color:#059669; border-bottom:2px solid #059669;">Один день</button><button id="mealTabMultiple" class="tab-btn" data-tab="multiple" style="padding:8px 16px; background:none; border:none; cursor:pointer; font-weight:600; color:#64748b;">Неделя/Все дни</button></div>
            <div id="mealSinglePanel"><div style="margin-bottom:20px;"><label>Неделя</label><select id="addMealWeek" style="width:100%; padding:10px;"></select></div><div><label>День</label><select id="addMealDay" style="width:100%; padding:10px;"><option value="1">Пн</option><option value="2">Вт</option><option value="3">Ср</option><option value="4">Чт</option><option value="5">Пт</option></select></div></div>
            <div id="mealMultiplePanel" style="display:none;"><div><label>Область применения</label><div><label><input type="radio" name="massScope" value="currentWeek" checked> Только текущая неделя</label><label><input type="radio" name="massScope" value="allWeeks"> Все недели</label><label><input type="radio" name="massScope" value="selectedWeeks"> Выбранные недели</label></div></div><div id="selectedWeeksContainer" style="display:none;"><label>Выберите недели</label><div id="weekCheckboxes"></div></div><div><label>Дни</label><div id="dayCheckboxes"><label><input type="checkbox" value="1" checked> Пн</label><label><input type="checkbox" value="2" checked> Вт</label><label><input type="checkbox" value="3" checked> Ср</label><label><input type="checkbox" value="4" checked> Чт</label><label><input type="checkbox" value="5" checked> Пт</label></div></div></div>
            <div><label>Тип приёма пищи</label><select id="addMealType" style="width:100%; padding:10px;"><option value="breakfast">Завтрак</option><option value="breakfast2">2-й завтрак</option><option value="lunch">Обед</option><option value="afternoonSnack">Полдник</option><option value="dinner">Ужин</option><option value="dinner2">2-й ужин</option></select></div>
            <div><label><input type="checkbox" id="addMealWithTemplate" checked> Добавить с шаблонными блюдами</label></div>
            <div><label><input type="checkbox" id="overwriteExisting"> Заменять существующие</label></div>
            <div id="massPreview" style="background:#f8fafc; padding:12px; border-radius:12px; margin-bottom:20px; font-size:13px; display:none;"><i class="fas fa-info-circle"></i> <span id="previewText"></span></div>
            <div class="modal-buttons" style="display:flex; gap:12px; justify-content:flex-end;"><button id="cancelAddMealBtn" class="btn btn-secondary">Отмена</button><button id="confirmAddMealBtn" class="btn btn-primary">Добавить</button></div>
        </div></div>
        
        <div id="copyModal" class="modal" style="display:none;"><div class="modal-content"><div class="card-title"><i class="fas fa-copy"></i> Копирование дня</div>
            <p>Источник:</p><select id="copySourceWeek" style="width:100%; padding:10px;"></select><select id="copySourceDay" style="width:100%; padding:10px; margin-top:8px;"><option value="1">Пн</option><option value="2">Вт</option><option value="3">Ср</option><option value="4">Чт</option><option value="5">Пт</option></select>
            <p>Цель:</p><select id="copyTargetWeek" style="width:100%; padding:10px;"></select><select id="copyTargetDay" style="width:100%; padding:10px; margin-top:8px;"><option value="1">Пн</option><option value="2">Вт</option><option value="3">Ср</option><option value="4">Чт</option><option value="5">Пт</option></select>
            <label><input type="checkbox" id="copyOnlyStructure"> Только структуру</label>
            <div class="modal-buttons" style="margin-top:20px;"><button id="copyConfirmBtn" class="btn btn-primary">Копировать</button><button id="copyCancelBtn" class="btn btn-secondary">Отмена</button></div>
        </div></div>
        
		<div id="reportModal" class="modal" style="display:none;">
			<div class="modal-content" style="max-width:1400px; width:95%;">
				<div class="card-title" style="margin-bottom:20px; justify-content:space-between; display:flex; align-items:center;">
					<div><i class="fas fa-chart-line"></i> <span>Детальный аналитический отчёт по меню</span></div>
					<div style="display:flex; gap:8px;">
						<button id="exportHtmlReportBtn" class="btn btn-primary" style="padding:6px 12px; font-size:0.7rem;"><i class="fas fa-file-code"></i> HTML</button>
						<button id="exportTxtReportBtn" class="btn btn-secondary" style="padding:6px 12px; font-size:0.7rem;"><i class="fas fa-file-alt"></i> TXT</button>
						<button id="exportCsvReportBtn" class="btn btn-info" style="padding:6px 12px; font-size:0.7rem;"><i class="fas fa-file-csv"></i> CSV</button>
					</div>
				</div>
				<div id="reportContent" style="overflow-x:auto;"></div>
				<div class="modal-buttons" style="display:flex; gap:12px; justify-content:flex-end; margin-top:20px;">
					<button id="reportCloseBtn" class="btn btn-primary">Закрыть</button>
				</div>
			</div>
		</div>
		
		
		
        <div id="assistantModal" class="modal" style="display:none;"><div class="modal-content"><div class="card-title"><i class="fas fa-robot"></i> Умный помощник</div><div id="assistantContent"></div><div class="modal-buttons"><button id="closeAssistantBtn" class="btn btn-secondary">Закрыть</button></div></div></div>
        
        <button id="assistantFloatingBtn" class="floating-btn" style="position:fixed; bottom:90px; right:24px; background:linear-gradient(135deg,#7c3aed,#8b5cf6);"><i class="fas fa-robot"></i></button>
        <div id="autoSaveBadge" class="auto-save-badge" style="position:fixed; bottom:24px; left:24px;"><i class="fas fa-save"></i> <span>Автосохранение</span></div>
    `;
    
    attachGlobalEvents();
    loadSchoolInfoFromStorage();
    
    if (!loadFromStorage()) {
        // Создаём демо-данные
        currentTemplateData = { weeks: {} };
        for (let w = 1; w <= 2; w++) {
            currentTemplateData.weeks[w] = {};
            for (let d = 1; d <= 5; d++) {
                currentTemplateData.weeks[w][d] = {
                    breakfast: { items: [{ section: 'гор.блюдо', name: 'Каша рисовая', weight: 200, calories: 220, proteins: 5, fats: 6, carbs: 35, recipeId: '001', price: 15 }] },
                    breakfast2: { items: [{ section: 'фрукты', name: 'Яблоко', weight: 100, calories: 52, proteins: 0.3, fats: 0.2, carbs: 14, recipeId: '003', price: 20 }] },
                    lunch: { items: [{ section: '1 блюдо', name: 'Суп куриный', weight: 250, calories: 120, proteins: 8, fats: 5, carbs: 10, recipeId: '004', price: 25 }] },
                    afternoonSnack: { items: [] },
                    dinner: { items: [{ section: 'гор.блюдо', name: 'Котлета', weight: 100, calories: 250, proteins: 15, fats: 18, carbs: 10, recipeId: '005', price: 30 }] },
                    dinner2: { items: [] }
                };
            }
        }
        originalTemplateData = deepClone(currentTemplateData);
        flatItems = buildFlatFromTemplate(currentTemplateData);
        historyStack = [deepClone(currentTemplateData)];
        historyIndex = 0;
        renderEditorContent();
        showStatus('🎯 Загружены демо-данные. Нажмите на поле для загрузки файла.', 'info');
    }
    
    function attachGlobalEvents() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        dropZone?.addEventListener('click', () => fileInput?.click());
        dropZone?.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = '#10b981'; dropZone.style.background = '#f0fdf4'; });
        dropZone?.addEventListener('dragleave', () => { dropZone.style.borderColor = '#cbd5e1'; dropZone.style.background = 'transparent'; });
        dropZone?.addEventListener('drop', async (e) => { e.preventDefault(); dropZone.style.borderColor = '#cbd5e1'; dropZone.style.background = 'transparent'; if (e.dataTransfer.files[0]) await loadTemplateFile(e.dataTransfer.files[0]); });
        fileInput?.addEventListener('change', async (e) => { if (e.target.files[0]) await loadTemplateFile(e.target.files[0]); });
        
        document.getElementById('undoBtn')?.addEventListener('click', undo);
        document.getElementById('redoBtn')?.addEventListener('click', redo);
        document.getElementById('mergeSectionsBtn')?.addEventListener('click', mergeDuplicateSections);
        document.getElementById('addWeekBtn')?.addEventListener('click', addNewWeek);
        document.getElementById('refreshTableBtn')?.addEventListener('click', refreshTable);
        document.getElementById('printViewBtn')?.addEventListener('click', printView);
        document.getElementById('saveChangesBtn')?.addEventListener('click', () => { saveToStorage(); showStatus('💾 Сохранено', 'success'); });
        document.getElementById('exportExcelBtn')?.addEventListener('click', exportToExcel);
        document.getElementById('validateOnlyBtn')?.addEventListener('click', validateMenu);
        document.getElementById('compareBtn')?.addEventListener('click', showReport);
        document.getElementById('resetToOriginalBtn')?.addEventListener('click', resetToOriginal);
        document.getElementById('createStandardMenuBtn')?.addEventListener('click', createStandardMenu);
		// Экспорт отчёта
		document.getElementById('exportHtmlReportBtn')?.addEventListener('click', exportReportToHTML);
		document.getElementById('exportTxtReportBtn')?.addEventListener('click', exportReportToTXT);
		document.getElementById('exportCsvReportBtn')?.addEventListener('click', exportReportToCSV);
        
        document.getElementById('copyDayBtn')?.addEventListener('click', () => {
            if (!currentTemplateData) { showStatus('Сначала загрузите файл', 'error'); return; }
            const weeks = Object.keys(currentTemplateData.weeks);
            const weeksHtml = weeks.map(w => `<option value="${w}">Неделя ${w}</option>`).join('');
            document.getElementById('copySourceWeek').innerHTML = weeksHtml;
            document.getElementById('copyTargetWeek').innerHTML = weeksHtml;
            document.getElementById('copyModal').style.display = 'flex';
        });
        document.getElementById('copyConfirmBtn')?.addEventListener('click', () => {
            const sourceWeek = parseInt(document.getElementById('copySourceWeek').value);
            const sourceDay = parseInt(document.getElementById('copySourceDay').value);
            const targetWeek = parseInt(document.getElementById('copyTargetWeek').value);
            const targetDay = parseInt(document.getElementById('copyTargetDay').value);
            const onlyStructure = document.getElementById('copyOnlyStructure').checked;
            copyDay(sourceWeek, sourceDay, targetWeek, targetDay, onlyStructure);
            document.getElementById('copyModal').style.display = 'none';
        });
        document.getElementById('copyCancelBtn')?.addEventListener('click', () => document.getElementById('copyModal').style.display = 'none');
        document.getElementById('reportCloseBtn')?.addEventListener('click', () => document.getElementById('reportModal').style.display = 'none');
        
        document.getElementById('searchInput')?.addEventListener('input', (e) => { currentSearchTerm = e.target.value; renderEditorContent(); });
        document.getElementById('filterMealSelect')?.addEventListener('change', (e) => { currentMealFilter = e.target.value; renderEditorContent(); });
        document.getElementById('filterStatusSelect')?.addEventListener('change', (e) => { currentStatusFilter = e.target.value; renderEditorContent(); });
        document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
            document.getElementById('searchInput').value = '';
            document.getElementById('filterMealSelect').value = '';
            document.getElementById('filterStatusSelect').value = '';
            currentSearchTerm = ''; currentMealFilter = ''; currentStatusFilter = '';
            renderEditorContent();
        });
        
        document.getElementById('batchDeleteBtn')?.addEventListener('click', batchDelete);
        document.getElementById('batchApplySectionBtn')?.addEventListener('click', batchApplySection);
        document.getElementById('batchMultiplyBtn')?.addEventListener('click', batchMultiplyWeight);
        
        document.getElementById('updateSchoolInfoBtn')?.addEventListener('click', saveSchoolInfo);
        
        // Модальные окна
        document.getElementById('cancelAddMealBtn')?.addEventListener('click', () => document.getElementById('addMealModal').style.display = 'none');
        document.getElementById('confirmAddMealBtn')?.addEventListener('click', handleAddMealConfirm);
        document.getElementById('mealTabSingle')?.addEventListener('click', () => {
            document.getElementById('mealSinglePanel').style.display = 'block';
            document.getElementById('mealMultiplePanel').style.display = 'none';
            document.getElementById('mealTabSingle').style.color = '#059669';
            document.getElementById('mealTabMultiple').style.color = '#64748b';
            updateMassPreview();
        });
        document.getElementById('mealTabMultiple')?.addEventListener('click', () => {
            document.getElementById('mealSinglePanel').style.display = 'none';
            document.getElementById('mealMultiplePanel').style.display = 'block';
            document.getElementById('mealTabMultiple').style.color = '#059669';
            document.getElementById('mealTabSingle').style.color = '#64748b';
            updateWeekCheckboxes();
            updateMassPreview();
        });
        document.querySelectorAll('input[name="massScope"]')?.forEach(radio => radio.addEventListener('change', () => {
            document.getElementById('selectedWeeksContainer').style.display = radio.value === 'selectedWeeks' ? 'block' : 'none';
            updateMassPreview();
        }));
        document.querySelectorAll('#dayCheckboxes input')?.forEach(cb => cb.addEventListener('change', updateMassPreview));
        document.getElementById('addMealWithTemplate')?.addEventListener('change', updateMassPreview);
        document.getElementById('overwriteExisting')?.addEventListener('change', updateMassPreview);
        document.getElementById('addMealType')?.addEventListener('change', updateMassPreview);
        
        document.getElementById('assistantFloatingBtn')?.addEventListener('click', showAssistant);
        document.getElementById('closeAssistantBtn')?.addEventListener('click', () => document.getElementById('assistantModal').style.display = 'none');
        
        document.addEventListener('keydown', (e) => { if (e.key === 'F1') { e.preventDefault(); showAssistant(); } });
        
        document.getElementById('scrollTopBtn')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        
        window.onclick = (event) => { if (event.target.classList && event.target.classList.contains('modal')) event.target.style.display = 'none'; };
    }
    
    setInterval(() => { if (currentTemplateData) saveToStorage(); }, 30000);
}

export function initEditor() {
    const state = getState();
    currentTemplateData = state.templateMenuData ? deepClone(state.templateMenuData) : null;
    if (currentTemplateData) {
        flatItems = buildFlatFromTemplate(currentTemplateData);
        renderEditorContent();
    }
}
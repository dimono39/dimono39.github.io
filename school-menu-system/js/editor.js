// ============================================
// Модуль редактора типового меню
// Правила 1-17, подсветка ошибок, переход к ячейкам
// ============================================

let flatItems = [];
let allViolations = [];

// Валидные разделы
const VALID_SECTIONS = [
    'гор.блюдо', 'гор.напиток', 'хлеб', 'фрукты', 'закуска',
    '1 блюдо', '2 блюдо', 'гарнир', 'напиток', 'хлеб бел.',
    'хлеб черн.', 'булочное', 'кисломол.', 'сладкое', '3 блюдо'
];

// Построение плоского списка из шаблона
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

// Подсчёт суммы по разделу
function getSectionSum(items, targetSection) {
    return items.reduce((sum, item) => {
        if (normalizeSection(item.section) === targetSection) {
            return sum + (parseFloat(item.weight) || 0);
        }
        return sum;
    }, 0);
}

// Общий вес приёма пищи
function getMealTotalWeight(items) {
    return items.reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0);
}

// Общая калорийность приёма пищи
function getMealTotalCalories(items) {
    return items.reduce((sum, i) => sum + (parseFloat(i.calories) || 0), 0);
}

// Проверка дубликатов блюд
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
                            if (allDishNames.includes(item.name)) {
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

// Запуск всех правил проверки
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
                
                // Правила по весу приёмов пищи
                if (mt === 'breakfast' && totalWeight > 0 && totalWeight < 500) 
                    violations.push({ rule: 1, code: 1, week: w, day: d, meal: mt, details: `Завтрак: ${totalWeight}г < 500г` });
                if (mt === 'lunch' && totalWeight > 0 && totalWeight < 700) 
                    violations.push({ rule: 2, code: 2, week: w, day: d, meal: mt, details: `Обед: ${totalWeight}г < 700г` });
                if (mt === 'breakfast' && hotWeight > 0 && hotWeight < 150) 
                    violations.push({ rule: 3, code: 3, week: w, day: d, meal: mt, details: `гор.блюдо: ${hotWeight}г < 150г` });
                if (mt === 'lunch' && zakuskaWeight > 0 && zakuskaWeight < 60) 
                    violations.push({ rule: 4, code: 4, week: w, day: d, meal: mt, details: `закуска: ${zakuskaWeight}г < 60г` });
                if (mt === 'lunch' && firstWeight > 0 && firstWeight < 200) 
                    violations.push({ rule: 5, code: 5, week: w, day: d, meal: mt, details: `1 блюдо: ${firstWeight}г < 200г` });
                if (mt === 'lunch' && secondWeight > 0 && secondWeight < 90) 
                    violations.push({ rule: 6, code: 6, week: w, day: d, meal: mt, details: `2 блюдо: ${secondWeight}г < 90г` });
                if (mt === 'lunch' && garnishWeight > 0 && garnishWeight < 150) 
                    violations.push({ rule: 8, code: 8, week: w, day: d, meal: mt, details: `гарнир: ${garnishWeight}г < 150г` });
                if (mt === 'breakfast2' && totalWeight > 0 && totalWeight < 200) 
                    violations.push({ rule: 9, code: 9, week: w, day: d, meal: mt, details: `2 завтрак: ${totalWeight}г < 200г` });
                if (mt === 'afternoonSnack' && totalWeight > 0 && totalWeight < 300) 
                    violations.push({ rule: 10, code: 10, week: w, day: d, meal: mt, details: `Полдник: ${totalWeight}г < 300г` });
                if (mt === 'dinner' && totalWeight > 0 && totalWeight < 500) 
                    violations.push({ rule: 11, code: 11, week: w, day: d, meal: mt, details: `Ужин: ${totalWeight}г < 500г` });
                if (mt === 'dinner2' && totalWeight > 0 && totalWeight < 200) 
                    violations.push({ rule: 12, code: 12, week: w, day: d, meal: mt, details: `2 ужин: ${totalWeight}г < 200г` });
                if (mt === 'breakfast' && totalCalories > 0 && totalCalories < 470) 
                    violations.push({ rule: 13, code: 13, week: w, day: d, meal: mt, details: `Калории завтрака: ${totalCalories}ккал < 470ккал` });
                if (mt === 'lunch' && totalCalories > 0 && totalCalories < 705) 
                    violations.push({ rule: 14, code: 14, week: w, day: d, meal: mt, details: `Калории обеда: ${totalCalories}ккал < 705ккал` });
                
                // Правило БЖУ
                for (let idx = 0; idx < items.length; idx++) {
                    const item = items[idx];
                    const bju = (parseFloat(item.proteins) || 0) + (parseFloat(item.fats) || 0) + (parseFloat(item.carbs) || 0);
                    const weight = parseFloat(item.weight) || 0;
                    if (bju > weight && weight > 0) {
                        violations.push({ rule: 15, code: 15, week: w, day: d, meal: mt, itemIndex: idx, details: `"${item.name}": БЖУ=${bju}г > вес=${weight}г` });
                    }
                }
            }
            
            // Правило 16: фрукты за день
            if (dayFruitWeight > 0 && dayFruitWeight < 100) {
                violations.push({ rule: 16, code: 16, week: w, day: d, details: `Фруктов за день: ${dayFruitWeight}г < 100г` });
            }
        }
    }
    
    // Правило 17: дубликаты
    const duplicates = checkDuplicateDishes(template);
    for (let d of duplicates) {
        violations.push({ rule: 17, code: 17, week: d.week, day: d.day, details: `Повтор блюда: "${d.dishName}"` });
    }
    
    return violations;
}

// Функция перехода к нарушению с подсветкой
function scrollToViolation(violation) {
    // Находим строку с нужной неделей и днём
    let targetRow = null;
    
    if (violation.meal) {
        // Ищем строки с конкретным приёмом пищи
        const rows = document.querySelectorAll(`tr[data-week="${violation.week}"][data-day="${violation.day}"][data-meal="${violation.meal}"]`);
        const itemIndex = violation.itemIndex || 0;
        targetRow = rows[Math.min(itemIndex, rows.length - 1)];
    } else {
        // Для правил без приёма пищи (правило 16)
        const rows = document.querySelectorAll(`tr[data-week="${violation.week}"][data-day="${violation.day}"]`);
        targetRow = rows[0];
    }
    
    if (!targetRow) return;
    
    // Скролл к строке
    targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Подсветка ячейки
    setTimeout(() => {
        let cellsToHighlight = [];
        
        switch(violation.code) {
            case 1: case 2: case 9: case 10: case 11: case 12:
                // Подсвечиваем все ячейки веса в приёме пищи
                cellsToHighlight = targetRow.querySelectorAll('td:nth-child(7)');
                break;
            case 3: case 4: case 5: case 6: case 8:
                // Подсвечиваем ячейку веса
                cellsToHighlight = [targetRow.querySelector('td:nth-child(7)')];
                break;
            case 13: case 14:
                // Подсвечиваем ячейку калорий
                cellsToHighlight = [targetRow.querySelector('td:nth-child(8)')];
                break;
            case 15:
                // Подсвечиваем вес, белки, жиры, углеводы
                cellsToHighlight = [
                    targetRow.querySelector('td:nth-child(7)'),
                    targetRow.querySelector('td:nth-child(9)'),
                    targetRow.querySelector('td:nth-child(10)'),
                    targetRow.querySelector('td:nth-child(11)')
                ];
                break;
            case 16:
                // Подсвечиваем все фрукты в дне
                const fruitRows = document.querySelectorAll(`tr[data-week="${violation.week}"][data-day="${violation.day}"]`);
                fruitRows.forEach(row => {
                    const fruitSection = row.querySelector('td:nth-child(5) select');
                    if (fruitSection && fruitSection.value === 'фрукты') {
                        cellsToHighlight.push(row.querySelector('td:nth-child(7)'));
                    }
                });
                break;
            case 17:
                // Подсвечиваем название блюда
                cellsToHighlight = [targetRow.querySelector('td:nth-child(6)')];
                break;
        }
        
        cellsToHighlight.forEach(cell => {
            if (cell) flashCell(cell);
        });
    }, 400);
    
    showStatus(`⚠️ ${violation.details}`, 'info');
}

// Функция подсветки ячейки
function flashCell(cell) {
    if (!cell) return;
    
    const originalBg = cell.style.backgroundColor;
    let count = 0;
    const flashCount = 6;
    
    const interval = setInterval(() => {
        if (count >= flashCount) {
            clearInterval(interval);
            cell.style.backgroundColor = originalBg;
            cell.style.transition = '';
            return;
        }
        
        cell.style.transition = 'background-color 0.15s ease';
        if (count % 2 === 0) {
            cell.style.backgroundColor = '#fef08a';
        } else {
            cell.style.backgroundColor = originalBg;
        }
        count++;
    }, 200);
}

// Экспорт типового меню в формате как в оригинале
function exportTemplateMenuOriginal() {
    if (!currentTemplateData) {
        showStatus('Нет данных для экспорта', 'error');
        return;
    }
    
    const wsData = [];
    
    // Шапка как в оригинальном файле
    wsData.push(['Неделя', 'День недели', 'Прием пищи', 'Раздел меню', 'Блюда', 
                 'Вес блюда, г', 'Белки', 'Жиры', 'Углеводы', 'Калорийность', '№ рецептуры', 'Цена']);
    
    // Сортируем недели и дни
    const weeks = Object.keys(currentTemplateData.weeks).map(Number).sort((a, b) => a - b);
    
    for (const weekNum of weeks) {
        const week = currentTemplateData.weeks[weekNum];
        const days = Object.keys(week).map(Number).sort((a, b) => a - b);
        
        for (const dayNum of days) {
            const day = week[dayNum];
            
            for (const mealType of MEAL_TYPES) {
                const meal = day[mealType];
                if (!meal || !meal.items || meal.items.length === 0) continue;
                
                const mealName = MEAL_STRUCTURE[mealType]?.name || mealType;
                let isFirstRow = true;
                
                for (const item of meal.items) {
                    wsData.push([
                        isFirstRow ? weekNum : '',
                        isFirstRow ? dayNum : '',
                        isFirstRow ? mealName : '',
                        item.section || '',
                        item.name || '',
                        item.weight || 0,
                        item.proteins || 0,
                        item.fats || 0,
                        item.carbs || 0,
                        item.calories || 0,
                        item.recipeId || '',
                        item.price || 0
                    ]);
                    isFirstRow = false;
                }
                
                // Пустая строка между приёмами пищи для читаемости
                wsData.push(['', '', '', '', '', '', '', '', '', '', '', '']);
            }
        }
    }
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{wch:8}, {wch:10}, {wch:12}, {wch:15}, {wch:35}, {wch:10}, {wch:8}, {wch:8}, {wch:8}, {wch:10}, {wch:10}, {wch:8}];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Типовое меню');
    XLSX.writeFile(wb, `tm2026-sm_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.xlsx`);
    showStatus('✅ Типовое меню экспортировано', 'success');
}

// Отрисовка редактора (полная версия с обработчиками правил)
function renderEditor() {
    if (!currentTemplateData || !flatItems.length) {
        document.getElementById('editorWrapper').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open fa-4x"></i>
                <p>Загрузите файл типового меню для начала редактирования</p>
            </div>
        `;
        document.getElementById('statsPanel').innerHTML = '';
        document.getElementById('rulesPanel').innerHTML = '';
        return;
    }
    
    allViolations = runAllRules(currentTemplateData);
    const duplicates = checkDuplicateDishes(currentTemplateData);
    
    // Фильтрация
    const searchTerm = document.getElementById('searchInput')?.value || '';
    const mealFilter = document.getElementById('filterMealSelect')?.value || '';
    const statusFilter = document.getElementById('filterStatusSelect')?.value || '';
    
    let filteredItems = flatItems;
    if (searchTerm) {
        filteredItems = filteredItems.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (mealFilter) {
        filteredItems = filteredItems.filter(i => i.meal === mealFilter);
    }
    if (statusFilter === 'error') {
        filteredItems = filteredItems.filter(i => allViolations.some(v => v.week == i.week && v.day == i.day && v.code === 15));
    } else if (statusFilter === 'warning') {
        filteredItems = filteredItems.filter(i => allViolations.some(v => v.week == i.week && v.day == i.day && v.code !== 15));
    }
    
    // Группировка
    const grouped = {};
    for (let item of filteredItems) {
        const key = `${item.week}_${item.day}_${item.meal}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
    }
    
    // Подсчёт статистики
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
    
    // Статистика
    const totalDays = Object.keys(currentTemplateData.weeks).reduce((sum, w) => sum + Object.keys(currentTemplateData.weeks[w]).length, 0);
    document.getElementById('statsPanel').innerHTML = `
        <div class="stat-card"><div class="stat-number" style="color:#ef4444">${totalErrors}</div><div class="stat-label">Ошибки</div></div>
        <div class="stat-card"><div class="stat-number" style="color:#f59e0b">${totalWarnings}</div><div class="stat-label">Нарушения</div></div>
        <div class="stat-card"><div class="stat-number">${flatItems.length}</div><div class="stat-label">Блюд</div></div>
        <div class="stat-card"><div class="stat-number">${totalDays}</div><div class="stat-label">Дней</div></div>
    `;
    
    // Панель правил с обработчиками
    const rulesMap = {
        1: 'Завтрак ≥500г', 2: 'Обед ≥700г', 3: 'Гор.блюдо ≥150г', 4: 'Закуска ≥60г',
        5: '1 блюдо ≥200г', 6: '2 блюдо ≥90г', 8: 'Гарнир ≥150г', 9: '2 завтрак ≥200г',
        10: 'Полдник ≥300г', 11: 'Ужин ≥500г', 12: '2 ужин ≥200г', 13: 'Калории завтрака ≥470',
        14: 'Калории обеда ≥705', 15: 'БЖУ ≤ вес', 16: 'Фрукты ≥100г', 17: 'Без дубликатов'
    };
    
    let rulesHtml = '<strong>📋 Правила контроля (кликните для перехода):</strong><div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">';
    for (let [code, name] of Object.entries(rulesMap)) {
        const count = violationsByRule[code] || 0;
        const statusClass = count > 0 ? 'warning' : 'ok';
        rulesHtml += `<div class="rule-badge ${statusClass}" data-rule-code="${code}" style="cursor: pointer;">${code}. ${name} ${count > 0 ? `(${count})` : '✓'}</div>`;
    }
    rulesHtml += '</div>';
    document.getElementById('rulesPanel').innerHTML = rulesHtml;
    
    // Прикрепляем обработчики к правилам
    document.querySelectorAll('.rule-badge[data-rule-code]').forEach(badge => {
        badge.addEventListener('click', () => {
            const ruleCode = parseInt(badge.dataset.ruleCode);
            const violationsForRule = allViolations.filter(v => v.code === ruleCode);
            if (violationsForRule.length > 0) {
                scrollToViolation(violationsForRule[0]);
            } else {
                showStatus(`✅ Правило ${ruleCode} выполняется`, 'success');
            }
        });
    });
    
    // Таблица
    const sortedKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    
    let html = `<table class="editor-table"><thead><tr>
        <th class="checkbox-col"><input type="checkbox" id="selectAllCheckbox"></th>
        <th>Неделя</th><th>День</th><th>Приём пищи</th><th>Раздел</th><th>Блюдо</th><th>Вес (г)</th>
        <th>Ккал</th><th>Белки</th><th>Жиры</th><th>Углеводы</th><th>№ рец.</th><th></th>
    </tr></thead><tbody>`;
    
    for (let key of sortedKeys) {
        const items = grouped[key];
        const mealType = items[0].meal;
        const mealTotal = mealTotals[key] || 0;
        const mealKcal = mealCalories[key] || 0;
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
                html += `<td rowspan="${rowspan}" style="vertical-align:middle;"><input type="checkbox" class="item-checkbox" data-id="${item.id}"></td>`;
                html += `<td rowspan="${rowspan}"><strong>${item.week}</strong></td>`;
                html += `<td rowspan="${rowspan}"><strong>${item.day}</strong></td>`;
                html += `<td rowspan="${rowspan}">
                    ${MEAL_STRUCTURE[mealType]?.name || mealType}
                    <div style="margin-top: 6px;">
                        <span class="rule-badge ${mealOk ? 'ok' : 'warning'}" style="font-size: 10px; padding: 2px 6px;">⚖️ ${mealTotal}/${ruleMin}г</span>
                        ${kcalMin > 0 ? `<span class="rule-badge ${kcalOk ? 'ok' : 'warning'}" style="font-size: 10px; padding: 2px 6px;">🔥 ${mealKcal}/${kcalMin}ккал</span>` : ''}
                    </div>
                 </div></td>`;
            }
            
            const sectionClass = getCellClass('section', item, mealType, mealItems, duplicates);
            const nameClass = getCellClass('name', item, mealType, mealItems, duplicates);
            const weightClass = getCellClass('weight', item, mealType, mealItems, duplicates);
            const caloriesClass = getCellClass('calories', item, mealType, mealItems, duplicates);
            
            html += `
                <td><select data-id="${item.id}" data-field="section" class="${sectionClass}">
                    <option value="">-- выбрать --</option>
                    ${VALID_SECTIONS.map(s => `<option value="${s}" ${item.section === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select></td>
                <td><input type="text" value="${escapeHtml(item.name)}" data-id="${item.id}" data-field="name" class="${nameClass}"></td>
                <td><input type="number" value="${item.weight}" data-id="${item.id}" data-field="weight" step="1" class="${weightClass}"></td>
                <td><input type="number" value="${item.calories}" data-id="${item.id}" data-field="calories" step="1" class="${caloriesClass}"></td>
                <td><input type="number" value="${item.proteins}" data-id="${item.id}" data-field="proteins" step="0.1"></td>
                <td><input type="number" value="${item.fats}" data-id="${item.id}" data-field="fats" step="0.1"></td>
                <td><input type="number" value="${item.carbs}" data-id="${item.id}" data-field="carbs" step="0.1"></td>
                <td><input type="text" value="${item.recipeId || ''}" data-id="${item.id}" data-field="recipeId"></td>
                <td><button class="btn btn-secondary" style="padding: 4px 12px;" data-del="${item.id}"><i class="fas fa-trash"></i></button></td>
            `;
            html += `</tr>`;
            firstRow = false;
        }
        
        // Кнопка добавления
        const sampleId = items[0]?.id;
        if (sampleId) {
            const [week, day, meal] = sampleId.split('_');
            html += `<tr class="add-row"><td colspan="2"></td><td colspan="11">
                <button class="btn btn-secondary" data-add="${week}|${day}|${meal}"><i class="fas fa-plus"></i> Добавить блюдо</button>
                <select class="add-section-select" data-add-select="${week}|${day}|${meal}" style="width: auto; margin-left: 8px;">
                    <option value="">-- выбрать раздел --</option>
                    ${VALID_SECTIONS.map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
            </div></td></tr>`;
        }
    }
    
    html += `</tbody></table>`;
    document.getElementById('editorWrapper').innerHTML = html;
    
    // Прикрепляем обработчики
    attachEditorEvents();
    updateSelectedCount();
}

// Инициализация редактора
function initEditor() {
    // Кнопки
    document.getElementById('undoBtn')?.addEventListener('click', undo);
    document.getElementById('redoBtn')?.addEventListener('click', redo);
    document.getElementById('mergeSectionsBtn')?.addEventListener('click', mergeDuplicateSections);
    document.getElementById('addWeekBtn')?.addEventListener('click', addNewWeek);
    document.getElementById('exportTemplateBtn')?.addEventListener('click', exportTemplateMenuOriginal);
    document.getElementById('batchDeleteBtn')?.addEventListener('click', batchDelete);
    document.getElementById('batchApplySectionBtn')?.addEventListener('click', batchApplySection);
    document.getElementById('batchMultiplyBtn')?.addEventListener('click', batchMultiplyWeight);
    
    // Поиск и фильтры
    document.getElementById('searchInput')?.addEventListener('input', () => renderEditor());
    document.getElementById('filterMealSelect')?.addEventListener('change', () => renderEditor());
    document.getElementById('filterStatusSelect')?.addEventListener('change', () => renderEditor());
    document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('filterMealSelect').value = '';
        document.getElementById('filterStatusSelect').value = '';
        renderEditor();
    });
    
    // Копирование дня
    document.getElementById('copyDayBtn')?.addEventListener('click', () => {
        if (!currentTemplateData) {
            showStatus('Сначала загрузите файл', 'error');
            return;
        }
        const weeks = Object.keys(currentTemplateData.weeks);
        const days = [1, 2, 3, 4, 5];
        
        const sourceWeek = document.getElementById('copySourceWeek');
        const sourceDay = document.getElementById('copySourceDay');
        const targetWeek = document.getElementById('copyTargetWeek');
        const targetDay = document.getElementById('copyTargetDay');
        
        if (sourceWeek) {
            sourceWeek.innerHTML = weeks.map(w => `<option value="${w}">Неделя ${w}</option>`).join('');
            sourceDay.innerHTML = days.map(d => `<option value="${d}">День ${d}</option>`).join('');
            targetWeek.innerHTML = weeks.map(w => `<option value="${w}">Неделя ${w}</option>`).join('');
            targetDay.innerHTML = days.map(d => `<option value="${d}">День ${d}</option>`).join('');
        }
        
        document.getElementById('copyModal').classList.add('active');
    });
    
    document.getElementById('copyConfirmBtn')?.addEventListener('click', () => {
        const sourceWeek = parseInt(document.getElementById('copySourceWeek').value);
        const sourceDay = parseInt(document.getElementById('copySourceDay').value);
        const targetWeek = parseInt(document.getElementById('copyTargetWeek').value);
        const targetDay = parseInt(document.getElementById('copyTargetDay').value);
        const onlyStructure = document.getElementById('copyOnlyStructure').checked;
        copyDay(sourceWeek, sourceDay, targetWeek, targetDay, onlyStructure);
        document.getElementById('copyModal').classList.remove('active');
    });
    
    document.getElementById('copyCancelBtn')?.addEventListener('click', () => {
        document.getElementById('copyModal').classList.remove('active');
    });
    
    // Закрытие модалки
    document.querySelectorAll('.modal .modal-close, .modal .close-btn').forEach(btn => {
        btn?.addEventListener('click', () => {
            btn.closest('.modal')?.classList.remove('active');
        });
    });
}
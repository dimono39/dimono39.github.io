// ============================================
// Модуль экспорта файлов
// Экспорт tm2026-sm.xlsx, kp2026.xlsx, ежедневных меню
// ============================================

// Экспорт типового меню (tm2026-sm.xlsx)
function exportTemplateMenu() {
    if (!currentTemplateData) {
        showStatus('Нет данных для экспорта', 'error');
        return;
    }
    
    const wsData = [];
    
    // Заголовки
    wsData.push(['Неделя', 'День недели', 'Прием пищи', 'Раздел меню', 'Блюда', 
                 'Вес блюда, г', 'Белки', 'Жиры', 'Углеводы', 'Калорийность', '№ рецептуры', 'Цена']);
    
    // Проходим по всем неделям и дням
    for (const weekNum in currentTemplateData.weeks) {
        const week = currentTemplateData.weeks[weekNum];
        const days = Object.keys(week).sort((a, b) => a - b);
        
        for (const dayNum of days) {
            const day = week[dayNum];
            
            for (const mealType of MEAL_TYPES) {
                const meal = day[mealType];
                if (!meal || !meal.items || meal.items.length === 0) continue;
                
                const mealName = MEAL_STRUCTURE[mealType]?.name || mealType;
                let isFirst = true;
                
                for (const item of meal.items) {
                    wsData.push([
                        isFirst ? weekNum : '',
                        isFirst ? dayNum : '',
                        isFirst ? mealName : '',
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
                    isFirst = false;
                }
                
                // Пустая строка между приёмами пищи
                wsData.push(['', '', '', '', '', '', '', '', '', '', '', '']);
            }
        }
    }
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{wch:8}, {wch:10}, {wch:12}, {wch:15}, {wch:35}, {wch:10}, {wch:8}, {wch:8}, {wch:8}, {wch:10}, {wch:10}, {wch:8}];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Типовое меню');
    XLSX.writeFile(wb, `tm2026-sm_${new Date().toISOString().slice(0,19)}.xlsx`);
    showStatus('✅ Типовое меню экспортировано', 'success');
}

// Экспорт ежедневного меню в Excel
function exportCurrentMenu() {
    if (!dailyMenus.length || currentMenuIndex >= dailyMenus.length) {
        showStatus('Нет меню для экспорта', 'error');
        return;
    }
    
    const menu = dailyMenus[currentMenuIndex];
    const wsData = [];
    
    // Шапка
    wsData.push(['Школа', menu.schoolName || schoolInfo.name || '']);
    wsData.push(['Дата', menu.dateString]);
    wsData.push(['Возрастная категория', menu.ageCategory || schoolInfo.ageCategory || '7-11']);
    wsData.push([]);
    wsData.push(['Прием пищи', 'Раздел', 'Блюдо', 'Вес (г)', 'Ккал', 'Белки', 'Жиры', 'Углеводы', 'Цена']);
    
    for (const mealType of MEAL_TYPES) {
        const items = menu[mealType]?.items || [];
        if (items.length === 0) continue;
        
        const mealName = MEAL_STRUCTURE[mealType]?.name || mealType;
        let isFirst = true;
        
        for (const item of items) {
            wsData.push([
                isFirst ? mealName : '',
                item.section || '',
                item.name || '',
                item.weight || 0,
                item.calories || 0,
                item.proteins || 0,
                item.fats || 0,
                item.carbs || 0,
                item.price || 0
            ]);
            isFirst = false;
        }
        
        wsData.push([]); // Пустая строка
    }
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ежедневное меню');
    XLSX.writeFile(wb, menu.fileName);
    showStatus(`✅ Экспортировано: ${menu.fileName}`, 'success');
}

// Экспорт всех меню в ZIP архив
async function exportAllMenusZip() {
    if (!dailyMenus.length) {
        showStatus('Нет меню для экспорта', 'error');
        return;
    }
    
    try {
        showStatus(`Создание ZIP архива (${dailyMenus.length} файлов)...`, 'info');
        
        const zip = new JSZip();
        
        for (let i = 0; i < dailyMenus.length; i++) {
            const menu = dailyMenus[i];
            const wsData = [];
            
            wsData.push(['Школа', menu.schoolName || schoolInfo.name || '']);
            wsData.push(['Дата', menu.dateString]);
            wsData.push(['Возрастная категория', menu.ageCategory || schoolInfo.ageCategory || '7-11']);
            wsData.push([]);
            wsData.push(['Прием пищи', 'Раздел', 'Блюдо', 'Вес (г)', 'Ккал', 'Белки', 'Жиры', 'Углеводы']);
            
            for (const mealType of MEAL_TYPES) {
                const items = menu[mealType]?.items || [];
                if (items.length === 0) continue;
                
                const mealName = MEAL_STRUCTURE[mealType]?.name || mealType;
                let isFirst = true;
                
                for (const item of items) {
                    wsData.push([
                        isFirst ? mealName : '',
                        item.section || '',
                        item.name || '',
                        item.weight || 0,
                        item.calories || 0,
                        item.proteins || 0,
                        item.fats || 0,
                        item.carbs || 0
                    ]);
                    isFirst = false;
                }
                wsData.push([]);
            }
            
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Меню');
            const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
            zip.file(menu.fileName, buffer);
        }
        
        const content = await zip.generateAsync({ type: 'blob' });
        const zipFileName = `daily_menus_${new Date().toISOString().slice(0,10)}.zip`;
        saveAs(content, zipFileName);
        showStatus(`✅ ZIP архив создан: ${zipFileName}`, 'success');
        
    } catch (error) {
        console.error('Ошибка:', error);
        showStatus('Ошибка при создании ZIP архива', 'error');
    }
}

// Скачать шаблоны ФЦМПО
function downloadTemplates() {
    // Шаблон календаря
    const calendarTemplate = [
        ['Школа', 'МОУ "Примерная школа"', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
        ['', 'январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'],
        ['1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1'],
        ['2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2'],
        ['3', '3', '3', '3', '3', '3', '3', '3', '3', '3', '3', '3', '3'],
        ['4', '4', '4', '4', '4', '4', '4', '4', '4', '4', '4', '4', '4'],
        ['5', '5', '5', '5', '5', '5', '5', '5', '5', '5', '5', '5', '5'],
    ];
    
    const wbCalendar = XLSX.utils.book_new();
    const wsCalendar = XLSX.utils.aoa_to_sheet(calendarTemplate);
    XLSX.utils.book_append_sheet(wbCalendar, wsCalendar, 'Календарь');
    XLSX.writeFile(wbCalendar, 'kp2026-template.xlsx');
    
    // Шаблон меню
    const menuTemplate = [
        ['Неделя', 'День недели', 'Прием пищи', 'Раздел меню', 'Блюда', 'Вес блюда, г', 'Белки', 'Жиры', 'Углеводы', 'Калорийность', '№ рецептуры', 'Цена'],
        ['1', '1', 'Завтрак', 'гор.блюдо', 'Каша рисовая молочная', '200', '5', '6', '35', '220', '001', '45'],
        ['', '', '', 'гор.напиток', 'Чай с сахаром', '200', '0', '0', '8', '30', '002', '10'],
        ['', '', '', 'хлеб', 'Хлеб пшеничный', '50', '4', '1', '24', '120', '003', '5'],
        ['', '', '', 'фрукты', 'Яблоко', '100', '0.3', '0.2', '14', '52', '004', '20'],
        ['', '', 'Обед', '1 блюдо', 'Суп куриный с лапшой', '250', '8', '5', '10', '120', '005', '35'],
        ['', '', '', '2 блюдо', 'Котлета мясная', '80', '15', '10', '8', '180', '006', '45'],
        ['', '', '', 'гарнир', 'Картофельное пюре', '150', '3', '5', '20', '130', '007', '20'],
        ['', '', '', 'напиток', 'Компот из сухофруктов', '200', '0', '0', '21', '85', '008', '15'],
    ];
    
    const wbMenu = XLSX.utils.book_new();
    const wsMenu = XLSX.utils.aoa_to_sheet(menuTemplate);
    XLSX.utils.book_append_sheet(wbMenu, wsMenu, 'Типовое меню');
    XLSX.writeFile(wbMenu, 'tm2026-sm-template.xlsx');
    
    showStatus('Шаблоны скачаны', 'success');
}

// Инициализация экспорта
function initExport() {
    document.getElementById('exportTemplateBtn')?.addEventListener('click', exportTemplateMenu);
    document.getElementById('exportAllZipBtn')?.addEventListener('click', exportAllMenusZip);
    document.getElementById('exportCurrentExcelBtn')?.addEventListener('click', exportCurrentMenu);
    document.getElementById('downloadTemplateBtn')?.addEventListener('click', downloadTemplates);
}
// ============================================
// Модуль генератора ежедневных меню
// ============================================

let dailyMenus = [];
let currentMenuIndex = 0;
let isGridView = true;

// Формирование данных для экспорта в формате ФЦМПО
function createExportData(menu) {
    const wsData = [];
    
    // Шапка как в оригинале
    wsData.push(['Неделя', 'День недели', 'Прием пищи', 'Раздел меню', 'Блюда', 
                 'Вес блюда, г', 'Белки', 'Жиры', 'Углеводы', 'Калорийность', '№ рецептуры', 'Цена']);
    
    // Определяем неделю и день из даты
    const weekNum = menu.weekNumber || 1;
    const dayNum = menu.dayNumber || 1;
    
    // Завтрак
    if (menu.breakfast && menu.breakfast.items && menu.breakfast.items.length) {
        let isFirst = true;
        for (const item of menu.breakfast.items) {
            wsData.push([
                isFirst ? weekNum : '',
                isFirst ? dayNum : '',
                isFirst ? 'Завтрак' : '',
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
        wsData.push(['', '', '', '', '', '', '', '', '', '', '', '']);
    }
    
    // Завтрак 2
    if (menu.breakfast2 && menu.breakfast2.items && menu.breakfast2.items.length) {
        let isFirst = true;
        for (const item of menu.breakfast2.items) {
            wsData.push([
                isFirst ? weekNum : '',
                isFirst ? dayNum : '',
                isFirst ? 'Завтрак 2' : '',
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
        wsData.push(['', '', '', '', '', '', '', '', '', '', '', '']);
    }
    
    // Обед
    if (menu.lunch && menu.lunch.items && menu.lunch.items.length) {
        let isFirst = true;
        for (const item of menu.lunch.items) {
            wsData.push([
                isFirst ? weekNum : '',
                isFirst ? dayNum : '',
                isFirst ? 'Обед' : '',
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
        wsData.push(['', '', '', '', '', '', '', '', '', '', '', '']);
    }
    
    // Полдник
    if (menu.afternoonSnack && menu.afternoonSnack.items && menu.afternoonSnack.items.length) {
        let isFirst = true;
        for (const item of menu.afternoonSnack.items) {
            wsData.push([
                isFirst ? weekNum : '',
                isFirst ? dayNum : '',
                isFirst ? 'Полдник' : '',
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
        wsData.push(['', '', '', '', '', '', '', '', '', '', '', '']);
    }
    
    // Ужин
    if (menu.dinner && menu.dinner.items && menu.dinner.items.length) {
        let isFirst = true;
        for (const item of menu.dinner.items) {
            wsData.push([
                isFirst ? weekNum : '',
                isFirst ? dayNum : '',
                isFirst ? 'Ужин' : '',
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
        wsData.push(['', '', '', '', '', '', '', '', '', '', '', '']);
    }
    
    // Ужин 2
    if (menu.dinner2 && menu.dinner2.items && menu.dinner2.items.length) {
        let isFirst = true;
        for (const item of menu.dinner2.items) {
            wsData.push([
                isFirst ? weekNum : '',
                isFirst ? dayNum : '',
                isFirst ? 'Ужин 2' : '',
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
    }
    
    return wsData;
}

// Генерация ежедневных меню
function generateDailyMenus() {
    if (!currentCalendarData || !currentTemplateData) {
        showStatus('Загрузите календарь и типовое меню', 'error');
        return;
    }
    
    const startDate = new Date(document.getElementById('startDate').value);
    let endDate = new Date(document.getElementById('endDate').value);
    
    // Если конечная дата в прошлом, подставляем текущую
    const today = new Date();
    if (endDate < today) {
        endDate = today;
        document.getElementById('endDate').value = endDate.toISOString().slice(0, 10);
    }
    
    if (startDate > endDate) {
        showStatus('Начальная дата не может быть позже конечной', 'error');
        return;
    }
    
    const monthNames = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 
                        'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
    
    dailyMenus = [];
    let currentDate = new Date(startDate);
    let generatedCount = 0;
    
    const generateBtn = document.getElementById('generateMenusBtn');
    const originalText = generateBtn.innerHTML;
    generateBtn.innerHTML = '<span class="loading"></span> Генерация...';
    generateBtn.disabled = true;
    
    // Используем setTimeout для плавной генерации без зависания
    setTimeout(() => {
        while (currentDate <= endDate) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const day = currentDate.getDate();
            const monthName = monthNames[month];
            
            let menuType = null;
            if (currentCalendarData.months && currentCalendarData.months[monthName] && 
                currentCalendarData.months[monthName][day]) {
                menuType = currentCalendarData.months[monthName][day];
            }
            
            if (menuType !== null) {
                let weekNum, dayNum;
                if (menuType <= 5) {
                    weekNum = 1;
                    dayNum = menuType;
                } else {
                    weekNum = 2;
                    dayNum = menuType - 5;
                }
                
                if (currentTemplateData.weeks[weekNum] && currentTemplateData.weeks[weekNum][dayNum]) {
                    const templateDay = currentTemplateData.weeks[weekNum][dayNum];
                    const sortedDay = {};
                    
                    // Глубокое копирование данных
                    for (const mealType of MEAL_TYPES) {
                        if (templateDay[mealType] && templateDay[mealType].items) {
                            sortedDay[mealType] = { items: JSON.parse(JSON.stringify(templateDay[mealType].items)) };
                        } else {
                            sortedDay[mealType] = { items: [] };
                        }
                    }
                    
                    dailyMenus.push({
                        date: new Date(currentDate),
                        dateString: formatDateDisplay(currentDate),
                        fileName: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}-sm.xlsx`,
                        schoolName: schoolInfo.name || currentCalendarData.schoolName || '',
                        ageCategory: schoolInfo.ageCategory || '7-11',
                        weekNumber: weekNum,
                        dayNumber: dayNum,
                        menuType: menuType,
                        ...sortedDay
                    });
                    generatedCount++;
                }
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
        
        if (dailyMenus.length > 0) {
            currentMenuIndex = 0;
            updateMenuGridDisplay();
            updateGeneratorStats();
            
            document.getElementById('menuNavigation').style.display = 'flex';
            document.getElementById('menuGrid').style.display = 'grid';
            document.getElementById('dailyMenuContent').style.display = 'none';
            document.getElementById('detailedView').classList.remove('active');
            
            document.getElementById('exportAllZipBtn').disabled = false;
            document.getElementById('exportCurrentExcelBtn').disabled = false;
            
            showStatus(`✅ Сгенерировано ${dailyMenus.length} ежедневных меню`, 'success');
            saveToLocalStorage();
        } else {
            showStatus('Нет меню для выбранного периода. Проверьте календарь.', 'error');
        }
    }, 50);
}

// Экспорт текущего меню в формате ФЦМПО
function exportCurrentMenuAsFCPO() {
    if (!dailyMenus.length || currentMenuIndex >= dailyMenus.length) {
        showStatus('Нет меню для экспорта', 'error');
        return;
    }
    
    const menu = dailyMenus[currentMenuIndex];
    const wsData = createExportData(menu);
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{wch:8}, {wch:10}, {wch:12}, {wch:15}, {wch:35}, {wch:10}, {wch:8}, {wch:8}, {wch:8}, {wch:10}, {wch:10}, {wch:8}];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ежедневное меню');
    XLSX.writeFile(wb, menu.fileName);
    showStatus(`✅ Экспортировано: ${menu.fileName}`, 'success');
}

// Экспорт всех меню в ZIP
async function exportAllMenusAsZip() {
    if (!dailyMenus.length) {
        showStatus('Нет меню для экспорта', 'error');
        return;
    }
    
    try {
        showStatus(`Создание ZIP архива (${dailyMenus.length} файлов)...`, 'info');
        
        const zip = new JSZip();
        
        for (let i = 0; i < dailyMenus.length; i++) {
            const menu = dailyMenus[i];
            const wsData = createExportData(menu);
            
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            ws['!cols'] = [{wch:8}, {wch:10}, {wch:12}, {wch:15}, {wch:35}, {wch:10}, {wch:8}, {wch:8}, {wch:8}, {wch:10}, {wch:10}, {wch:8}];
            
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Ежедневное меню');
            const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
            zip.file(menu.fileName, buffer);
        }
        
        const content = await zip.generateAsync({ type: 'blob' });
        const zipFileName = `daily_menus_${new Date().toISOString().slice(0, 10)}.zip`;
        saveAs(content, zipFileName);
        showStatus(`✅ ZIP архив создан: ${zipFileName}`, 'success');
        
    } catch (error) {
        console.error('Ошибка:', error);
        showStatus('Ошибка при создании ZIP архива', 'error');
    }
}

// Обновление сетки меню
function updateMenuGridDisplay() {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;
    
    if (dailyMenus.length === 0) {
        grid.innerHTML = '';
        return;
    }
    
    let html = '';
    dailyMenus.forEach((menu, index) => {
        let breakfastCount = menu.breakfast?.items?.length || 0;
        let lunchCount = menu.lunch?.items?.length || 0;
        let totalDishes = breakfastCount + lunchCount + (menu.breakfast2?.items?.length || 0) + 
                         (menu.afternoonSnack?.items?.length || 0) + (menu.dinner?.items?.length || 0);
        
        const menuTypeColors = {
            1: '#10b981', 2: '#3b82f6', 3: '#8b5cf6', 4: '#f59e0b', 5: '#ef4444',
            6: '#06b6d4', 7: '#ec4899', 8: '#84cc16', 9: '#14b8a6', 10: '#6366f1'
        };
        const color = menuTypeColors[menu.menuType] || '#10b981';
        
        html += `
            <div class="menu-card ${index === currentMenuIndex ? 'active' : ''}" data-index="${index}" onclick="window.selectMenu && window.selectMenu(${index})">
                <div class="menu-card-header" style="background: linear-gradient(135deg, ${color}, ${adjustColor(color, -20)});">
                    <div class="menu-card-date">${menu.dateString}</div>
                    <div class="menu-card-type">Меню ${menu.menuType}</div>
                </div>
                <div class="menu-card-content">
                    <div class="menu-card-meal">
                        <div class="meal-title"><i class="fas fa-sun"></i> Завтрак (${breakfastCount})</div>
                    </div>
                    <div class="menu-card-meal">
                        <div class="meal-title"><i class="fas fa-utensils"></i> Обед (${lunchCount})</div>
                    </div>
                    <div class="menu-card-footer" style="margin-top: 12px; font-size: 0.75rem; color: #64748b;">
                        Всего блюд: ${totalDishes}
                    </div>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

// Детальный просмотр меню
function showDetailedView() {
    if (dailyMenus.length === 0 || currentMenuIndex >= dailyMenus.length) return;
    
    const menu = dailyMenus[currentMenuIndex];
    const detailDate = document.getElementById('detailMenuDate');
    if (detailDate) {
        detailDate.textContent = `${menu.dateString} | Школа: ${menu.schoolName || '—'} | Возраст: ${menu.ageCategory || '7-11'} лет`;
    }
    
    let mealsHtml = '';
    
    for (const mealType of MEAL_TYPES) {
        const items = menu[mealType]?.items || [];
        const mealName = MEAL_STRUCTURE[mealType]?.name || mealType;
        
        if (items.length === 0) continue;
        
        let itemsHtml = '';
        for (const item of items) {
            itemsHtml += `
                <div class="menu-item">
                    <div class="item-name"><strong>${escapeHtml(item.name)}</strong></div>
                    <div class="item-details">
                        <span>📂 ${escapeHtml(item.section || 'Блюдо')}</span>
                        <span>⚖️ ${item.weight || 0} г</span>
                        <span>🔥 ${item.calories || 0} ккал</span>
                    </div>
                    <div class="item-details">
                        <span>🥩 Б: ${item.proteins || 0}г</span>
                        <span>🧈 Ж: ${item.fats || 0}г</span>
                        <span>🍚 У: ${item.carbs || 0}г</span>
                        ${item.recipeId ? `<span>📋 №${item.recipeId}</span>` : ''}
                    </div>
                </div>
            `;
        }
        
        mealsHtml += `
            <div style="margin-bottom: 24px;">
                <div class="section-title"><i class="fas fa-utensils"></i> ${mealName}</div>
                <div class="menu-items">${itemsHtml}</div>
            </div>
        `;
    }
    
    if (mealsHtml === '') {
        mealsHtml = '<div class="empty-state">Нет блюд в этом меню</div>';
    }
    
    const detailMeals = document.getElementById('detailMeals');
    if (detailMeals) detailMeals.innerHTML = mealsHtml;
    
    const detailedView = document.getElementById('detailedView');
    const menuGrid = document.getElementById('menuGrid');
    if (detailedView) detailedView.classList.add('active');
    if (menuGrid) menuGrid.style.display = 'none';
}

// Инициализация генератора
function initGenerator() {
    const generateBtn = document.getElementById('generateMenusBtn');
    const prevBtn = document.getElementById('prevMenuBtn');
    const nextBtn = document.getElementById('nextMenuBtn');
    const toggleViewBtn = document.getElementById('toggleViewBtn');
    const closeDetailBtn = document.getElementById('closeDetailView');
    const exportAllBtn = document.getElementById('exportAllZipBtn');
    const exportCurrentBtn = document.getElementById('exportCurrentExcelBtn');
    
    if (generateBtn) generateBtn.addEventListener('click', generateDailyMenus);
    if (prevBtn) prevBtn.addEventListener('click', () => navigateMenus(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigateMenus(1));
    if (toggleViewBtn) toggleViewBtn.addEventListener('click', toggleView);
    if (closeDetailBtn) closeDetailBtn.addEventListener('click', closeDetailedView);
    if (exportAllBtn) exportAllBtn.addEventListener('click', exportAllMenusAsZip);
    if (exportCurrentBtn) exportCurrentBtn.addEventListener('click', exportCurrentMenuAsFCPO);
    
    // Устанавливаем конечную дату по умолчанию на текущую
    const endDateInput = document.getElementById('endDate');
    if (endDateInput) {
        const today = new Date();
        endDateInput.value = today.toISOString().slice(0, 10);
    }
}

function navigateMenus(direction) {
    if (dailyMenus.length === 0) return;
    currentMenuIndex = (currentMenuIndex + direction + dailyMenus.length) % dailyMenus.length;
    
    const counter = document.getElementById('menuCounter');
    if (counter) counter.textContent = `${currentMenuIndex + 1} из ${dailyMenus.length}`;
    
    if (isGridView) {
        updateMenuGridDisplay();
    } else {
        showDetailedView();
    }
}

function toggleView() {
    isGridView = !isGridView;
    const toggleBtn = document.getElementById('toggleViewBtn');
    const menuGrid = document.getElementById('menuGrid');
    const detailedView = document.getElementById('detailedView');
    
    if (isGridView) {
        if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-list"></i> Детальный вид';
        if (menuGrid) menuGrid.style.display = 'grid';
        if (detailedView) detailedView.classList.remove('active');
    } else {
        if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-th"></i> Сетка';
        if (menuGrid) menuGrid.style.display = 'none';
        showDetailedView();
    }
}

function closeDetailedView() {
    const detailedView = document.getElementById('detailedView');
    const menuGrid = document.getElementById('menuGrid');
    
    if (detailedView) detailedView.classList.remove('active');
    if (menuGrid && isGridView) menuGrid.style.display = 'grid';
}

function updateGeneratorStats() {
    const statsContainer = document.getElementById('generatorStats');
    const statsGrid = document.getElementById('generatorStatsGrid');
    
    if (dailyMenus.length === 0) {
        if (statsContainer) statsContainer.style.display = 'none';
        return;
    }
    
    if (statsContainer) statsContainer.style.display = 'block';
    
    let totalCalories = 0;
    let totalDishes = 0;
    
    for (const menu of dailyMenus) {
        for (const mealType of MEAL_TYPES) {
            const items = menu[mealType]?.items || [];
            totalDishes += items.length;
            for (const item of items) {
                totalCalories += item.calories || 0;
            }
        }
    }
    
    if (statsGrid) {
        statsGrid.innerHTML = `
            <div class="stat-item"><div class="stat-value">${dailyMenus.length}</div><div class="stat-label">Дней</div></div>
            <div class="stat-item"><div class="stat-value">${totalDishes}</div><div class="stat-label">Всего блюд</div></div>
            <div class="stat-item"><div class="stat-value">${Math.round(totalCalories / dailyMenus.length)}</div><div class="stat-label">Ср. ккал/день</div></div>
        `;
    }
}

function formatDateDisplay(date) {
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function adjustColor(color, amount) {
    let usePound = false;
    if (color[0] === '#') {
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
    return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}
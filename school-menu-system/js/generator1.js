// ============================================
// Модуль генератора ежедневных меню
// ============================================

let dailyMenus = [];
let currentMenuIndex = 0;
let isGridView = true;

// Генерация ежедневных меню
function generateDailyMenus() {
    if (!currentCalendarData || !currentTemplateData) {
        showStatus('Загрузите календарь и типовое меню', 'error');
        return;
    }
    
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    
    if (startDate > endDate) {
        showStatus('Начальная дата не может быть позже конечной', 'error');
        return;
    }
    
    const monthNames = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 
                        'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
    
    dailyMenus = [];
    let currentDate = new Date(startDate);
    
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
                
                for (const mealType of MEAL_TYPES) {
                    if (templateDay[mealType] && templateDay[mealType].items) {
                        sortedDay[mealType] = { items: [...templateDay[mealType].items] };
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
            }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
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
        showStatus('Нет меню для выбранного периода', 'error');
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
        let totalDishes = breakfastCount + lunchCount;
        
        const menuTypeColors = {
            1: '#10b981', 2: '#3b82f6', 3: '#8b5cf6', 4: '#f59e0b', 5: '#ef4444',
            6: '#06b6d4', 7: '#ec4899', 8: '#84cc16', 9: '#14b8a6', 10: '#6366f1'
        };
        const color = menuTypeColors[menu.menuType] || '#10b981';
        
        html += `
            <div class="menu-card ${index === currentMenuIndex ? 'active' : ''}" data-index="${index}" onclick="selectMenu(${index})">
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
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

function selectMenu(index) {
    currentMenuIndex = index;
    updateMenuGridDisplay();
    showDetailedView();
}

window.selectMenu = selectMenu;

function showDetailedView() {
    if (dailyMenus.length === 0 || currentMenuIndex >= dailyMenus.length) return;
    
    const menu = dailyMenus[currentMenuIndex];
    document.getElementById('detailMenuDate').textContent = 
        `${menu.dateString} | Школа: ${menu.schoolName || '—'} | Возраст: ${menu.ageCategory || '—'} лет`;
    
    let mealsHtml = '';
    for (const mealType of MEAL_TYPES) {
        const items = menu[mealType]?.items || [];
        const mealName = MEAL_STRUCTURE[mealType]?.name || mealType;
        
        let itemsHtml = '';
        for (const item of items) {
            itemsHtml += `
                <div class="menu-item">
                    <div class="item-name">${escapeHtml(item.name)}</div>
                    <div class="item-details">
                        <span>${escapeHtml(item.section || 'Блюдо')}</span>
                        <span>${item.weight} г</span>
                        <span>${item.calories || 0} ккал</span>
                    </div>
                    <div class="item-details">
                        <span>Б: ${item.proteins || 0}г</span>
                        <span>Ж: ${item.fats || 0}г</span>
                        <span>У: ${item.carbs || 0}г</span>
                    </div>
                </div>
            `;
        }
        
        if (itemsHtml === '') {
            itemsHtml = '<div style="padding: 20px; text-align: center; color: #94a3b8;">Нет блюд</div>';
        }
        
        mealsHtml += `
            <div style="margin-bottom: 24px;">
                <div class="section-title"><i class="fas fa-utensils"></i> ${mealName}</div>
                <div class="menu-items">${itemsHtml}</div>
            </div>
        `;
    }
    
    document.getElementById('detailMeals').innerHTML = mealsHtml;
    document.getElementById('detailedView').classList.add('active');
    document.getElementById('menuGrid').style.display = 'none';
}

function updateGeneratorStats() {
    const statsContainer = document.getElementById('generatorStats');
    const statsGrid = document.getElementById('generatorStatsGrid');
    
    if (dailyMenus.length === 0) {
        statsContainer.style.display = 'none';
        return;
    }
    
    statsContainer.style.display = 'block';
    
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
    
    statsGrid.innerHTML = `
        <div class="stat-item"><div class="stat-value">${dailyMenus.length}</div><div class="stat-label">Дней</div></div>
        <div class="stat-item"><div class="stat-value">${totalDishes}</div><div class="stat-label">Всего блюд</div></div>
        <div class="stat-item"><div class="stat-value">${Math.round(totalCalories / dailyMenus.length)}</div><div class="stat-label">Ср. ккал/день</div></div>
    `;
}

function toggleView() {
    isGridView = !isGridView;
    const toggleBtn = document.getElementById('toggleViewBtn');
    const grid = document.getElementById('menuGrid');
    const detailed = document.getElementById('detailedView');
    
    if (isGridView) {
        toggleBtn.innerHTML = '<i class="fas fa-list"></i> Детальный вид';
        grid.style.display = 'grid';
        detailed.classList.remove('active');
    } else {
        toggleBtn.innerHTML = '<i class="fas fa-th"></i> Сетка';
        grid.style.display = 'none';
        showDetailedView();
    }
}

function navigateMenus(direction) {
    if (dailyMenus.length === 0) return;
    currentMenuIndex = (currentMenuIndex + direction + dailyMenus.length) % dailyMenus.length;
    
    if (isGridView) {
        updateMenuGridDisplay();
    } else {
        showDetailedView();
    }
    
    document.getElementById('menuCounter').textContent = `${currentMenuIndex + 1} из ${dailyMenus.length}`;
}

function formatDateDisplay(date) {
    const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
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

// Инициализация генератора
function initGenerator() {
    document.getElementById('generateMenusBtn')?.addEventListener('click', generateDailyMenus);
    document.getElementById('prevMenuBtn')?.addEventListener('click', () => navigateMenus(-1));
    document.getElementById('nextMenuBtn')?.addEventListener('click', () => navigateMenus(1));
    document.getElementById('toggleViewBtn')?.addEventListener('click', toggleView);
    document.getElementById('closeDetailView')?.addEventListener('click', () => {
        document.getElementById('detailedView').classList.remove('active');
        if (isGridView) {
            document.getElementById('menuGrid').style.display = 'grid';
        }
    });
}
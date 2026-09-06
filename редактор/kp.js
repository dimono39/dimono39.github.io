// ============================================================
// МОДУЛЬ КАЛЕНДАРЯ ПИТАНИЯ
// ============================================================

// В начале файла kp.js, перед объявлением CalendarModule, добавьте:
function showStatus(msg, type) {
    const el = document.getElementById('statusArea');
    if (el) {
        el.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${msg}`;
        el.className = `status-message status-${type}`;
        el.style.display = 'flex';
        clearTimeout(el._timeout);
        el._timeout = setTimeout(() => { el.style.display = 'none'; }, 4000);
    }
}

// В начале kp.js, после showStatus:
if (typeof saveAs === 'undefined') {
    window.saveAs = function(blob, filename) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };
}

const CalendarModule = (function() {
    'use strict';

    // Состояние
    let state = {
        calendarData: null,        // Данные календаря (матрица)
        calendarMeta: null,        // Метаданные (месяцы, годы и т.д.)
        calendarMap: {},           // Карта: "месяц_день" -> номер меню
        selectedCell: null,        // Выбранная ячейка { month, day }
        isLoaded: false
    };

    const STORAGE_KEY = 'calendarData_v1';

    // Месяцы
    const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
                    'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

    // ============================================================
    // ЗАГРУЗКА / СОХРАНЕНИЕ
    // ============================================================

    function loadFromStorage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                state.calendarData = data.calendarData;
                state.calendarMeta = data.calendarMeta;
                state.calendarMap = data.calendarMap || {};
                state.isLoaded = true;
                console.log('📅 Календарь загружен из localStorage');
                return true;
            }
        } catch(e) {
            console.warn('Ошибка загрузки календаря:', e);
        }
        return false;
    }

    function saveToStorage() {
        try {
            const data = {
                calendarData: state.calendarData,
                calendarMeta: state.calendarMeta,
                calendarMap: state.calendarMap,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            console.log('📅 Календарь сохранён в localStorage');
            return true;
        } catch(e) {
            console.warn('Ошибка сохранения календаря:', e);
            return false;
        }
    }

    // ============================================================
    // ПАРСИНГ КАЛЕНДАРЯ ИЗ EXCEL
    // ============================================================

    function parseCalendarFromExcel(workbook) {
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!sheet) return null;

        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (!data || data.length < 4) {
            console.error('❌ Недостаточно данных в календаре');
            return null;
        }

        // Определяем структуру
        // Строка 0: "Школа", "МОУ ...", ..., "Календарь питания", ..., "Год", "2026"
        // Строка 1: пустая
        // Строка 2: "Месяц", 1, 2, 3, ... (дни месяца)
        // Строка 3+: месяц, данные

        let schoolName = '';
        let year = '2026';

        // Читаем название школы и год
        if (data[0]) {
            for (let i = 0; i < data[0].length; i++) {
                const val = String(data[0][i] || '').trim();
                if (val.includes('Школа') && data[0][i+1]) {
                    schoolName = String(data[0][i+1]).trim();
                }
                if (val === 'Год' && data[0][i+1]) {
                    year = String(data[0][i+1]).trim();
                }
            }
        }

        // Находим строку с днями (обычно строка 2)
        let dayRowIndex = -1;
        let monthRowIndex = -1;
        let dataStartIndex = -1;

        for (let i = 0; i < Math.min(data.length, 20); i++) {
            const row = data[i];
            if (!row) continue;
            const firstCell = String(row[0] || '').trim().toLowerCase();
            if (firstCell === 'месяц') {
                monthRowIndex = i;
                // Следующая строка обычно содержит дни
                if (i + 1 < data.length) {
                    dayRowIndex = i + 1;
                    dataStartIndex = i + 2;
                }
                break;
            }
        }

        if (monthRowIndex === -1 || dayRowIndex === -1) {
            console.error('❌ Не найдена структура календаря');
            return null;
        }

        // Читаем дни (строка с числами)
        const dayRow = data[dayRowIndex] || [];
        const days = [];
        for (let i = 1; i < dayRow.length; i++) {
            const val = parseInt(dayRow[i]);
            if (!isNaN(val) && val > 0 && val <= 31) {
                days.push(val);
            } else {
                days.push(null);
            }
        }

        // Читаем данные по месяцам
        const calendarData = {};
        const monthNames = [];

        for (let i = dataStartIndex; i < data.length; i++) {
            const row = data[i];
            if (!row || !row[0]) continue;

            const monthName = String(row[0]).trim().toLowerCase();
            if (!monthName) continue;

            // Проверяем, что это месяц
            const monthIndex = MONTHS.findIndex(m => m === monthName);
            if (monthIndex === -1) continue;

            monthNames.push(monthName);

            const monthData = [];
            for (let j = 1; j < row.length && j - 1 < days.length; j++) {
                const val = String(row[j] || '').trim();
                // Если значение - число, это номер меню
                const numVal = parseInt(val);
                monthData.push({
                    raw: val,
                    value: !isNaN(numVal) && numVal > 0 ? numVal : null,
                    day: days[j - 1] || null
                });
            }

            calendarData[monthName] = monthData;
        }

        // Строим карту для быстрого доступа
        const calendarMap = {};
        for (const month of monthNames) {
            const monthData = calendarData[month] || [];
            for (const entry of monthData) {
                if (entry.day && entry.value) {
                    const key = `${month}_${entry.day}`;
                    calendarMap[key] = entry.value;
                }
            }
        }

        const meta = {
            schoolName: schoolName || 'МОУ "Рудновская ООШ"',
            year: year || '2026',
            months: monthNames,
            days: days,
            totalDays: days.filter(d => d !== null).length,
            totalMonths: monthNames.length
        };

        state.calendarData = calendarData;
        state.calendarMeta = meta;
        state.calendarMap = calendarMap;
        state.isLoaded = true;

        saveToStorage();

        console.log('✅ Календарь загружен:', meta);
        return { calendarData, meta, calendarMap };
    }

    // ============================================================
    // СОЗДАНИЕ КАЛЕНДАРЯ (ПУСТОГО)
    // ============================================================

    function generateEmptyCalendar() {
        // Создаём календарь на 2026 год с 5-дневной учебной неделей
        const calendarData = {};
        const calendarMap = {};
        const days = [];

        // Определяем дни для каждого месяца (учебные дни)
        // Для простоты: 1-5, 7-11, 14-18, 21-25, 28-30
        const monthDays = {
            'январь': [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28, 29, 30, 31],
            'февраль': [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28],
            'март': [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28, 29, 30, 31],
            'апрель': [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28, 29, 30],
            'май': [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28, 29, 30, 31],
            'июнь': [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28, 29, 30],
            'июль': [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28, 29, 30, 31],
            'август': [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28, 29, 30, 31],
            'сентябрь': [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28, 29, 30],
            'октябрь': [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28, 29, 30, 31],
            'ноябрь': [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28, 29, 30],
            'декабрь': [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28, 29, 30, 31]
        };

        // Находим максимальное количество дней
        let maxDays = 0;
        for (const days of Object.values(monthDays)) {
            if (days.length > maxDays) maxDays = days.length;
        }

        // Строим структуру
        for (const month of MONTHS) {
            const monthDayList = monthDays[month] || [];
            const monthData = [];
            for (const day of monthDayList) {
                monthData.push({
                    day: day,
                    value: null,
                    raw: ''
                });
            }
            calendarData[month] = monthData;
        }

        const meta = {
            schoolName: 'МОУ "Рудновская ООШ"',
            year: '2026',
            months: MONTHS,
            days: Object.values(monthDays).reduce((max, arr) => Math.max(max, arr.length), 0),
            totalDays: Object.values(monthDays).reduce((sum, arr) => sum + arr.length, 0),
            totalMonths: 12
        };

        state.calendarData = calendarData;
        state.calendarMeta = meta;
        state.calendarMap = {};
        state.isLoaded = true;

        saveToStorage();

        return { calendarData, meta };
    }

    // ============================================================
    // ПОЛУЧЕНИЕ ИНФОРМАЦИИ О ДНЕ
    // ============================================================

    function getDayInfo(month, day) {
        if (!state.calendarData || !state.calendarData[month]) return null;

        const monthData = state.calendarData[month];
        const entry = monthData.find(e => e.day === day);
        if (!entry) return null;

        const menuNumber = entry.value;
        const menuData = menuNumber ? getMenuForDay(menuNumber) : null;

        return {
            month,
            day,
            menuNumber: menuNumber || null,
            menuData: menuData,
            isEmpty: !menuNumber
        };
    }

    function getMenuForDay(menuNumber) {
        if (!window.currentTemplateData) return null;

        const dayInfo = getDayFromMenuNumber(menuNumber);
        if (!dayInfo) return null;

        const { week, day } = dayInfo;
        const dayData = window.currentTemplateData.weeks[week]?.[day];
        if (!dayData) return null;

        // Собираем все блюда
        const meals = {};
        const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];
        const mealNames = {
            'breakfast': 'Завтрак',
            'breakfast2': 'Второй завтрак',
            'lunch': 'Обед',
            'afternoonSnack': 'Полдник',
            'dinner': 'Ужин',
            'dinner2': 'Второй ужин'
        };

        let totalDishes = 0;
        let allItems = [];

        for (const mt of mealTypes) {
            const meal = dayData[mt];
            if (meal && meal.items && meal.items.length > 0) {
                const items = meal.items.filter(i => i.name && i.name.trim() !== '');
                if (items.length > 0) {
                    meals[mt] = {
                        name: mealNames[mt] || mt,
                        items: items
                    };
                    allItems = allItems.concat(items);
                    totalDishes += items.length;
                }
            }
        }

        return {
            menuNumber,
            week,
            day,
            meals,
            totalDishes,
            allItems
        };
    }

    function getDayFromMenuNumber(menuNumber) {
        const data = window.currentTemplateData;
        if (!data || !data.weeks) return null;

        const allDays = [];
        for (const w in data.weeks) {
            for (const d in data.weeks[w]) {
                allDays.push({ week: parseInt(w), day: parseInt(d) });
            }
        }
        allDays.sort((a, b) => a.week - b.week || a.day - a.day);

        if (menuNumber >= 1 && menuNumber <= allDays.length) {
            return allDays[menuNumber - 1];
        }
        return null;
    }

    // ============================================================
    // ОТОБРАЖЕНИЕ КАЛЕНДАРЯ
    // ============================================================

    function renderCalendar() {
        const container = document.getElementById('calendarContainer');
        if (!container) return;

        if (!state.isLoaded || !state.calendarData) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #94a3b8;">
                    <i class="fas fa-calendar-plus fa-4x" style="margin-bottom: 16px; color: #cbd5e1;"></i>
                    <h3 style="color: #0f172a; margin-bottom: 8px;">Загрузите календарь питания</h3>
                    <p style="font-size: 0.9rem; color: #64748b;">
                        Нажмите <strong>«Загрузить календарь»</strong> и выберите файл Excel с календарём
                    </p>
                    <div style="display: flex; gap: 12px; justify-content: center; margin-top: 20px; flex-wrap: wrap;">
                        <button id="calendarUploadBtn2" class="btn btn-primary">
                            <i class="fas fa-upload"></i> Загрузить
                        </button>
                        <button id="calendarGenerateBtn" class="btn btn-purple" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">
                            <i class="fas fa-magic"></i> Создать календарь
                        </button>
                    </div>
                </div>
            `;
            updateStats();
            return;
        }

        const meta = state.calendarMeta;
        const calendarData = state.calendarData;

        let html = `
            <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div>
                    <span style="font-weight: 600; color: #0f172a; font-size: 1rem;">
                        <i class="fas fa-calendar-alt" style="color: #8b5cf6;"></i>
                        Календарь питания на ${meta.year} год
                    </span>
                    <span style="font-size: 0.8rem; color: #64748b; margin-left: 12px;">
                        ${meta.schoolName || 'МОУ "Рудновская ООШ"'}
                    </span>
                </div>
                <div style="display: flex; gap: 12px; font-size: 0.75rem; color: #64748b;">
                    <span><span style="display: inline-block; width: 12px; height: 12px; background: #10b981; border-radius: 3px;"></span> С меню</span>
                    <span><span style="display: inline-block; width: 12px; height: 12px; background: #fef3c7; border-radius: 3px;"></span> Выходной</span>
                    <span><span style="display: inline-block; width: 12px; height: 12px; background: white; border: 1px solid #e2e8f0; border-radius: 3px;"></span> Пусто</span>
                </div>
            </div>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; min-width: 800px;">
                    <thead>
                        <tr>
                            <th style="padding: 8px 12px; background: #f1f5f9; border: 1px solid #e2e8f0; position: sticky; left: 0; z-index: 2; min-width: 80px;">Месяц</th>
        `;

        // Заголовки дней
        const maxDays = meta.days || 31;
        for (let d = 1; d <= maxDays; d++) {
            html += `<th style="padding: 8px 4px; background: #f1f5f9; border: 1px solid #e2e8f0; text-align: center; min-width: 30px;">${d}</th>`;
        }
        html += `</tr></thead><tbody>`;

        // Данные по месяцам
        for (const month of meta.months) {
            const monthData = calendarData[month] || [];
            html += `<tr>`;
            html += `<td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; background: #f8fafc; position: sticky; left: 0; z-index: 1;">${month}</td>`;

            // Заполняем ячейки
            let dayIndex = 0;
            for (let d = 1; d <= maxDays; d++) {
                const entry = monthData[dayIndex] || null;
                const hasValue = entry && entry.value !== null && entry.value !== undefined;
                const day = entry ? entry.day : null;

                if (day === d && hasValue) {
                    // Есть значение меню
                    const menuNum = entry.value;
                    html += `
                        <td style="padding: 4px; border: 1px solid #e2e8f0; text-align: center; cursor: pointer; background: #dcfce7; transition: all 0.2s;"
                            data-month="${month}" data-day="${d}" data-value="${menuNum}"
                            onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 2px 8px rgba(16,185,129,0.3)';"
                            onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';"
                            onclick="CalendarModule.openDayModal('${month}', ${d})">
                            <span style="font-weight: 600; color: #16a34a;">${menuNum}</span>
                            <div style="font-size: 0.5rem; color: #16a34a; margin-top: 2px;">🍽️</div>
                        </td>
                    `;
                    dayIndex++;
                } else if (day === d && !hasValue) {
                    // Выходной (пустая ячейка)
                    html += `
                        <td style="padding: 4px; border: 1px solid #e2e8f0; text-align: center; cursor: pointer; background: #fef3c7; transition: all 0.2s;"
                            data-month="${month}" data-day="${d}" data-value=""
                            onmouseover="this.style.transform='scale(1.05)';"
                            onmouseout="this.style.transform='scale(1)';"
                            onclick="CalendarModule.openDayModal('${month}', ${d})">
                            <span style="color: #d97706; font-size: 0.7rem;">🏖️</span>
                        </td>
                    `;
                    dayIndex++;
                } else {
                    // Нет данных для этого дня
                    html += `
                        <td style="padding: 4px; border: 1px solid #e2e8f0; text-align: center; background: white; cursor: default;">
                            <span style="color: #e2e8f0;">·</span>
                        </td>
                    `;
                }
            }

            html += `</tr>`;
        }

        html += `</tbody></table></div>`;

        // Легенда с цветами
        html += `
            <div style="margin-top: 16px; padding: 12px 16px; background: #f8fafc; border-radius: 12px; display: flex; gap: 20px; flex-wrap: wrap; font-size: 0.75rem; color: #64748b;">
                <span><span style="display: inline-block; width: 16px; height: 16px; background: #dcfce7; border: 1px solid #10b981; border-radius: 4px; vertical-align: middle;"></span> С меню (клик для изменения)</span>
                <span><span style="display: inline-block; width: 16px; height: 16px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px; vertical-align: middle;"></span> Выходной (клик для добавления меню)</span>
                <span><span style="display: inline-block; width: 16px; height: 16px; background: white; border: 1px solid #e2e8f0; border-radius: 4px; vertical-align: middle;"></span> Нет данных</span>
            </div>
        `;

        container.innerHTML = html;
        updateStats();

        // Добавляем обработчики для кнопок в пустом состоянии
        document.getElementById('calendarUploadBtn2')?.addEventListener('click', () => {
            document.getElementById('calendarFileInput').click();
        });

        document.getElementById('calendarGenerateBtn')?.addEventListener('click', () => {
            generateEmptyCalendar();
            renderCalendar();
            showStatus('📅 Пустой календарь создан! Заполните ячейки кликом.', 'success');
        });
    }

    // ============================================================
    // ОБНОВЛЕНИЕ СТАТИСТИКИ
    // ============================================================

    function updateStats() {
        const totalDaysEl = document.getElementById('calendarTotalDays');
        const totalCellsEl = document.getElementById('calendarTotalCells');
        const filledEl = document.getElementById('calendarFilled');
        const statusEl = document.getElementById('calendarStatus');

        if (!state.isLoaded || !state.calendarData) {
            if (statusEl) statusEl.textContent = 'Календарь не загружен';
            if (totalDaysEl) totalDaysEl.textContent = '0';
            if (totalCellsEl) totalCellsEl.textContent = '0';
            if (filledEl) filledEl.textContent = '0';
            return;
        }

        const meta = state.calendarMeta;
        let totalDays = 0;
        let totalCells = 0;
        let filled = 0;

        for (const month of meta.months) {
            const monthData = state.calendarData[month] || [];
            totalCells += monthData.length;
            for (const entry of monthData) {
                if (entry.value) filled++;
            }
        }

        if (statusEl) statusEl.textContent = `✅ Календарь загружен (${meta.schoolName || 'МОУ "Рудновская ООШ"'})`;
        if (totalDaysEl) totalDaysEl.textContent = totalCells;
        if (totalCellsEl) totalCellsEl.textContent = totalCells;
        if (filledEl) filledEl.textContent = filled;
    }

    // ============================================================
    // МОДАЛЬНОЕ ОКНО ВЫБОРА МЕНЮ
    // ============================================================

    function openDayModal(month, day) {
        const modal = document.getElementById('calendarDayModal');
        const infoEl = document.getElementById('modalDayInfo');
        const currentValueEl = document.getElementById('modalCurrentValue');

        // Сохраняем выбранную ячейку
        state.selectedCell = { month, day };

        // Обновляем информацию
        const dayInfo = getDayInfo(month, day);
        const monthDisplay = month.charAt(0).toUpperCase() + month.slice(1);
        infoEl.textContent = `${monthDisplay}, ${day} число`;

        const currentValue = dayInfo?.menuNumber || null;
        currentValueEl.textContent = currentValue ? `Меню #${currentValue}` : 'Не выбрано';
        currentValueEl.style.background = currentValue ? '#dcfce7' : '#fef3c7';
        currentValueEl.style.color = currentValue ? '#16a34a' : '#d97706';

        // Загружаем список доступных меню
        loadDayMenuList(month, day);

        modal.style.display = 'flex';
    }

    function loadDayMenuList(month, day) {
        const container = document.getElementById('calendarDayList');
        const searchInput = document.getElementById('calendarDaySearch');

        // Получаем все доступные меню (дни из типового меню)
        const menuDays = getAllMenuDays();

        // Фильтруем по поиску
        const searchTerm = searchInput?.value?.toLowerCase() || '';
        const filter = document.querySelector('.calendar-filter-btn.active')?.dataset.filter || 'all';

        let filteredDays = menuDays;

        if (searchTerm) {
            filteredDays = filteredDays.filter(item => {
                const searchStr = `${item.menuNumber} ${item.dishes.join(' ')}`.toLowerCase();
                return searchStr.includes(searchTerm);
            });
        }

        if (filter === 'weekend') {
            // Показываем опцию "Выходной"
            filteredDays = [{ isWeekend: true }];
        } else if (filter !== 'all') {
            filteredDays = filteredDays.filter(item => {
                // Фильтр по приёму пищи
                const mealFilter = filter;
                const mealNames = {
                    'breakfast': 'Завтрак',
                    'lunch': 'Обед',
                    'dinner': 'Ужин'
                };
                return item.mealNames?.some(m => m === mealNames[mealFilter]);
            });
        }

        renderDayList(filteredDays, month, day);
    }

    function getAllMenuDays() {
        const data = window.currentTemplateData;
        if (!data || !data.weeks) return [];

        const result = [];
        const allDays = [];

        for (const w in data.weeks) {
            for (const d in data.weeks[w]) {
                allDays.push({ week: parseInt(w), day: parseInt(d) });
            }
        }
        allDays.sort((a, b) => a.week - b.week || a.day - a.day);

        for (let i = 0; i < allDays.length; i++) {
            const { week, day } = allDays[i];
            const menuNumber = i + 1;
            const dayData = data.weeks[week]?.[day];
            if (!dayData) continue;

            const dishes = [];
            const mealNames = [];
            const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];
            const mealNameMap = {
                'breakfast': 'Завтрак',
                'breakfast2': 'Второй завтрак',
                'lunch': 'Обед',
                'afternoonSnack': 'Полдник',
                'dinner': 'Ужин',
                'dinner2': 'Второй ужин'
            };

            for (const mt of mealTypes) {
                const meal = dayData[mt];
                if (meal && meal.items) {
                    for (const item of meal.items) {
                        if (item.name && item.name.trim() !== '') {
                            dishes.push(item.name);
                            if (!mealNames.includes(mealNameMap[mt])) {
                                mealNames.push(mealNameMap[mt]);
                            }
                        }
                    }
                }
            }

            if (dishes.length > 0) {
                result.push({
                    menuNumber,
                    week,
                    day,
                    dishes: dishes.slice(0, 10), // Ограничиваем для отображения
                    dishCount: dishes.length,
                    mealNames: mealNames,
                    preview: dishes.slice(0, 5).join(', ') + (dishes.length > 5 ? ` ... (+${dishes.length - 5})` : '')
                });
            }
        }

        return result;
    }

    function renderDayList(items, currentMonth, currentDay) {
        const container = document.getElementById('calendarDayList');

        if (items.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #94a3b8; grid-column: 1 / -1;">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 8px; display: block;"></i>
                    <p>Нет подходящих вариантов меню</p>
                    <p style="font-size: 0.8rem; color: #cbd5e1;">Попробуйте изменить фильтр или поиск</p>
                </div>
            `;
            return;
        }

        // Проверяем, есть ли среди элементов "выходной"
        const hasWeekend = items.some(item => item.isWeekend);

        let html = '';

        // Если есть опция "Выходной", добавляем её первой
        if (hasWeekend) {
            html += `
                <div style="padding: 12px; border: 2px solid #f59e0b; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: #fef3c7; text-align: center;"
                     onclick="CalendarModule.setDayValue('${currentMonth}', ${currentDay}, null)"
                     onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 4px 12px rgba(245,158,11,0.3)';"
                     onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                    <div style="font-size: 1.2rem;">🏖️</div>
                    <div style="font-weight: 600; color: #d97706;">Выходной</div>
                    <div style="font-size: 0.7rem; color: #92400e;">Очистить ячейку</div>
                </div>
            `;
        }

        // Добавляем варианты меню
        for (const item of items) {
            if (item.isWeekend) continue;

            const isCurrent = state.calendarMap[`${currentMonth}_${currentDay}`] === item.menuNumber;

            html += `
                <div style="padding: 12px; border: 2px solid ${isCurrent ? '#10b981' : '#e2e8f0'}; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: ${isCurrent ? '#dcfce7' : 'white'};"
                     onclick="CalendarModule.setDayValue('${currentMonth}', ${currentDay}, ${item.menuNumber})"
                     onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)';"
                     onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; color: ${isCurrent ? '#16a34a' : '#0f172a'};">
                            Меню #${item.menuNumber}
                            ${isCurrent ? '<span style="font-size: 0.6rem; background: #10b981; color: white; padding: 1px 8px; border-radius: 10px;">✓</span>' : ''}
                        </span>
                        <span style="font-size: 0.65rem; color: #64748b;">
                            Неделя ${item.week}, День ${item.day}
                        </span>
                    </div>
                    <div style="font-size: 0.7rem; color: #64748b; margin-top: 4px;">
                        ${item.mealNames.join(' · ')} · ${item.dishCount} блюд
                    </div>
                    <div style="font-size: 0.65rem; color: #94a3b8; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${item.preview}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    // ============================================================
    // УСТАНОВКА ЗНАЧЕНИЯ ДЛЯ ДНЯ
    // ============================================================

    function setDayValue(month, day, value) {
        if (!state.calendarData || !state.calendarData[month]) {
            showStatus('Ошибка: календарь не загружен', 'error');
            return;
        }

        const monthData = state.calendarData[month];
        const entry = monthData.find(e => e.day === day);

        if (!entry) {
            showStatus(`Ошибка: день ${day} не найден в месяце ${month}`, 'error');
            return;
        }

        // Обновляем значение
        entry.value = value;
        entry.raw = value ? String(value) : '';

        // Обновляем карту
        const key = `${month}_${day}`;
        if (value) {
            state.calendarMap[key] = value;
        } else {
            delete state.calendarMap[key];
        }

        // Сохраняем
        saveToStorage();

        // Перерисовываем календарь
        renderCalendar();

        // Закрываем модалку
        document.getElementById('calendarDayModal').style.display = 'none';

        const message = value ? `✅ Установлено меню #${value} на ${month} ${day}` : `🗑️ Очищен день ${month} ${day}`;
        showStatus(message, 'success');
    }

    // ============================================================
    // ЭКСПОРТ КАЛЕНДАРЯ В EXCEL
    // ============================================================

    async function exportCalendarToExcel() {
        if (!state.isLoaded || !state.calendarData) {
            showStatus('Сначала загрузите или создайте календарь', 'error');
            return;
        }

        try {
            showStatus('📊 Создание Excel-файла календаря...', 'info');

            const meta = state.calendarMeta;
            const calendarData = state.calendarData;

            // Используем ExcelJS
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Календарь питания');

            // Шапка
            worksheet.mergeCells('A1:B1');
            worksheet.getCell('A1').value = 'Школа';
            worksheet.getCell('C1').value = meta.schoolName || 'МОУ "Рудновская ООШ"';
            worksheet.mergeCells('C1:E1');

            worksheet.mergeCells('L1:M1');
            worksheet.getCell('L1').value = 'Календарь питания';
            worksheet.mergeCells('N1:P1');

            worksheet.mergeCells('AD1:AE1');
            worksheet.getCell('AD1').value = 'Год';
            worksheet.getCell('AF1').value = meta.year || '2026';

            // Пустая строка
            worksheet.addRow([]);

            // Заголовок "Месяц" и дни
            const headerRow = ['Месяц'];
            const maxDays = meta.days || 31;
            for (let d = 1; d <= maxDays; d++) {
                headerRow.push(d);
            }
            worksheet.addRow(headerRow);

            // Данные по месяцам
            const monthNames = meta.months || MONTHS;
            for (const month of monthNames) {
                const monthData = calendarData[month] || [];
                const row = [month];
                for (let d = 1; d <= maxDays; d++) {
                    const entry = monthData.find(e => e.day === d);
                    row.push(entry?.value || '');
                }
                worksheet.addRow(row);
            }

            // Настройка столбцов
            worksheet.getColumn('A').width = 15;
            for (let i = 2; i <= maxDays + 1; i++) {
                worksheet.getColumn(i).width = 6;
            }

            // Стилизация
            // Заголовок
            worksheet.getRow(1).height = 25;
            worksheet.getRow(3).height = 20;
            worksheet.getRow(3).font = { bold: true };

            // Сохраняем
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const fileName = `Календарь_питания_${meta.year || '2026'}.xlsx`;
            saveAs(blob, fileName);

            showStatus(`📥 Календарь сохранён как "${fileName}"`, 'success');

        } catch (error) {
            console.error('Ошибка экспорта календаря:', error);
            showStatus(`Ошибка: ${error.message}`, 'error');
        }
    }

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ
    // ============================================================

    function init() {
        console.log('📅 Модуль календаря питания инициализируется...');

        // Загружаем сохранённые данные
        const hasSaved = loadFromStorage();

        // Если есть данные, отображаем
        if (hasSaved) {
            renderCalendar();
        }

        // Настройка событий
        setupEvents();

        console.log('✅ Модуль календаря питания готов');
    }

    function setupEvents() {
        // Загрузка файла
        document.getElementById('calendarFileInput')?.addEventListener('change', function(e) {
            if (this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const wb = XLSX.read(data, { type: 'array' });
                        const result = parseCalendarFromExcel(wb);
                        if (result) {
                            renderCalendar();
                            showStatus(`✅ Календарь загружен из "${this.files[0].name}"`, 'success');
                        } else {
                            showStatus('❌ Не удалось прочитать календарь. Проверьте структуру файла.', 'error');
                        }
                    } catch(err) {
                        console.error(err);
                        showStatus('❌ Ошибка чтения файла', 'error');
                    }
                };
                reader.readAsArrayBuffer(this.files[0]);
                this.value = '';
            }
        });

        // Кнопки загрузки
        document.getElementById('calendarUploadBtn')?.addEventListener('click', () => {
            document.getElementById('calendarFileInput').click();
        });

        document.getElementById('calendarUploadBtn2')?.addEventListener('click', () => {
            document.getElementById('calendarFileInput').click();
        });

        // Кнопка создания календаря
        document.getElementById('calendarGenerateBtn')?.addEventListener('click', () => {
            generateEmptyCalendar();
            renderCalendar();
            showStatus('📅 Пустой календарь создан! Заполните ячейки кликом.', 'success');
        });

        // Кнопка скачивания
        document.getElementById('calendarDownloadBtn')?.addEventListener('click', exportCalendarToExcel);

        // Кнопка сброса
        document.getElementById('calendarResetBtn')?.addEventListener('click', function() {
            if (confirm('Сбросить календарь? Все данные будут удалены.')) {
                localStorage.removeItem(STORAGE_KEY);
                state.calendarData = null;
                state.calendarMeta = null;
                state.calendarMap = {};
                state.isLoaded = false;
                renderCalendar();
                showStatus('🗑️ Календарь сброшен', 'info');
            }
        });

        // Модальное окно - поиск
        document.getElementById('calendarDaySearch')?.addEventListener('input', function() {
            const month = state.selectedCell?.month;
            const day = state.selectedCell?.day;
            if (month && day) {
                loadDayMenuList(month, day);
            }
        });

        // Модальное окно - фильтры
        document.querySelectorAll('.calendar-filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.calendar-filter-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'white';
                    b.style.color = '#64748b';
                    b.style.borderColor = '#e2e8f0';
                });
                this.classList.add('active');
                this.style.background = '#ede9fe';
                this.style.color = '#5b21b6';
                this.style.borderColor = '#8b5cf6';

                const month = state.selectedCell?.month;
                const day = state.selectedCell?.day;
                if (month && day) {
                    loadDayMenuList(month, day);
                }
            });
        });

        // Модальное окно - закрытие
        document.getElementById('calendarDayModalClose')?.addEventListener('click', () => {
            document.getElementById('calendarDayModal').style.display = 'none';
        });

        document.getElementById('calendarDayModalClose2')?.addEventListener('click', () => {
            document.getElementById('calendarDayModal').style.display = 'none';
        });

        document.getElementById('calendarDayModalClear')?.addEventListener('click', function() {
            const month = state.selectedCell?.month;
            const day = state.selectedCell?.day;
            if (month && day) {
                setDayValue(month, day, null);
                document.getElementById('calendarDayModal').style.display = 'none';
            }
        });

        // Закрытие по клику на фон
        document.getElementById('calendarDayModal')?.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    }

    // ============================================================
    // ПУБЛИЧНОЕ API
    // ============================================================

    return {
        init: init,
        render: renderCalendar,
        openDayModal: openDayModal,
        setDayValue: setDayValue,
        getState: function() { return state; },
        exportCalendar: exportCalendarToExcel,
        loadFromStorage: loadFromStorage,
        saveToStorage: saveToStorage,
        generateEmpty: generateEmptyCalendar,
        parseExcel: parseCalendarFromExcel
    };

})();

// ============================================================
// АВТОЗАПУСК МОДУЛЯ
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем календарь с небольшой задержкой
    setTimeout(function() {
        CalendarModule.init();
        console.log('✅ Модуль календаря инициализирован');
    }, 300);
});

// Делаем модуль глобальным
window.CalendarModule = CalendarModule;
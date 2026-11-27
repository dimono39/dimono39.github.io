// ============================================================
// МОДУЛЬ КАЛЕНДАРЯ ПИТАНИЯ
// ============================================================

// В начале файла kp.js, перед объявлением CalendarModule, добавьте:
function showStatus(msg, type) {
    if (window.showToast) { window.showToast(msg, type); return; }
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

// В начале CalendarModule, добавим состояние истории:
let historyState = {
    calendarHistory: [],
    historyIndex: -1,
    maxHistory: 30
};

// Функция сохранения состояния календаря в историю
function saveCalendarHistory() {
    if (!state.calendarData) return;
    
    const snapshot = {
        calendarData: JSON.parse(JSON.stringify(state.calendarData)),
        calendarMap: JSON.parse(JSON.stringify(state.calendarMap)),
        timestamp: Date.now()
    };
    
    // Обрезаем историю, если она слишком длинная
    historyState.calendarHistory = historyState.calendarHistory.slice(0, historyState.historyIndex + 1);
    historyState.calendarHistory.push(snapshot);
    historyState.historyIndex = historyState.calendarHistory.length - 1;
    
    // Ограничиваем максимальное количество записей
    if (historyState.calendarHistory.length > historyState.maxHistory) {
        historyState.calendarHistory.shift();
        historyState.historyIndex--;
    }
    
    // Обновляем индикаторы
    updateCalendarUndoButtons();
}

// Функция отмены (Undo)
function calendarUndo() {
    if (historyState.historyIndex > 0) {
        historyState.historyIndex--;
        restoreCalendarState(historyState.historyIndex);
        showStatus('↩️ Отменено действие в календаре', 'info');
    } else {
        showStatus('⚠️ Нет действий для отмены', 'info');
    }
}

// Функция повтора (Redo)
function calendarRedo() {
    if (historyState.historyIndex < historyState.calendarHistory.length - 1) {
        historyState.historyIndex++;
        restoreCalendarState(historyState.historyIndex);
        showStatus('↪️ Повторено действие в календаре', 'info');
    } else {
        showStatus('⚠️ Нет действий для повтора', 'info');
    }
}

// Восстановление состояния из истории
function restoreCalendarState(index) {
    const snapshot = historyState.calendarHistory[index];
    if (!snapshot) return;
    
    state.calendarData = JSON.parse(JSON.stringify(snapshot.calendarData));
    state.calendarMap = JSON.parse(JSON.stringify(snapshot.calendarMap));
    state.isLoaded = true;
    
    saveToStorage();
    renderCalendar();
    updateCalendarUndoButtons();
}

// Обновление кнопок Undo/Redo
function updateCalendarUndoButtons() {
    const undoBtn = document.getElementById('calendarUndoBtn');
    const redoBtn = document.getElementById('calendarRedoBtn');
    
    if (undoBtn) {
        undoBtn.disabled = historyState.historyIndex <= 0;
        undoBtn.style.opacity = historyState.historyIndex > 0 ? '1' : '0.5';
        undoBtn.title = historyState.historyIndex > 0 ? 'Отменить (Ctrl+Z)' : 'Нет действий для отмены';
    }
    if (redoBtn) {
        redoBtn.disabled = historyState.historyIndex >= historyState.calendarHistory.length - 1;
        redoBtn.style.opacity = historyState.historyIndex < historyState.calendarHistory.length - 1 ? '1' : '0.5';
        redoBtn.title = historyState.historyIndex < historyState.calendarHistory.length - 1 ? 'Повторить (Ctrl+Y)' : 'Нет действий для повтора';
    }
}

// Добавляем кнопки Undo/Redo в интерфейс календаря
function addCalendarUndoButtons() {
    const container = document.querySelector('#calendarContainer .calendar-toolbar') || 
                     document.querySelector('#calendarContainer');
    if (!container) return;
    
    if (document.getElementById('calendarUndoBtn')) return;
    
    const toolbar = document.createElement('div');
    toolbar.style.cssText = `
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
        align-items: center;
        flex-wrap: wrap;
        padding: 8px 12px;
        background: #f8fafc;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
    `;
    
    toolbar.innerHTML = `
        <span style="font-size: 0.75rem; color: #64748b; font-weight: 600;">
            <i class="fas fa-history"></i> История:
        </span>
        <button id="calendarUndoBtn" class="btn btn-secondary" style="padding: 4px 12px; font-size: 0.7rem;" disabled>
            <i class="fas fa-undo-alt"></i> Отменить
        </button>
        <button id="calendarRedoBtn" class="btn btn-secondary" style="padding: 4px 12px; font-size: 0.7rem;" disabled>
            <i class="fas fa-redo-alt"></i> Повторить
        </button>
        <span style="font-size: 0.6rem; color: #94a3b8; margin-left: auto;">
            ${historyState.calendarHistory.length} записей в истории
        </span>
    `;
    
    // Вставляем в начало контейнера
    container.insertBefore(toolbar, container.firstChild);
    
    // Обработчики
    document.getElementById('calendarUndoBtn')?.addEventListener('click', calendarUndo);
    document.getElementById('calendarRedoBtn')?.addEventListener('click', calendarRedo);
    
    // Глобальные хоткеи Ctrl+Z/Y теперь обрабатываются единым AppUndo (app-core.js)
}

// Модифицируем функции, которые изменяют календарь, чтобы они сохраняли историю
// В setDayValue, autoFillCalendar, generateCalendarFromMenu и других — добавляем:
// saveCalendarHistory(); // Перед изменением
// ... изменения ...
// saveCalendarHistory(); // После изменения




	// В CalendarModule, добавим функцию для получения проблемных дней:

	function getProblemDays() {
		const problems = [];
		
		if (!state.calendarData || !state.calendarMeta) return problems;
		
		// Получаем все нарушения из редактора
		const violations = window.allViolations || [];
		const violationDays = new Set();
		
		for (const v of violations) {
			const key = `${v.week}_${v.day}`;
			violationDays.add(key);
		}
		
		// Проверяем дни календаря
		for (const month of state.calendarMeta.months) {
			const monthData = state.calendarData[month] || [];
			for (const entry of monthData) {
				if (entry.value) {
					// Проверяем, есть ли нарушения для этого меню
					const dayInfo = getDayInfo(month, entry.day);
					if (dayInfo && dayInfo.menuData) {
						// Проверяем количество блюд
						const totalDishes = dayInfo.menuData.totalDishes || 0;
						if (totalDishes < 5) {
							problems.push({
								month: month,
								day: entry.day,
								menuNumber: entry.value,
								type: 'few_dishes',
								severity: 'warning',
								message: `Меню #${entry.value} содержит всего ${totalDishes} блюд`
							});
						}
						
						// Проверяем дубликаты в меню
						const dishes = dayInfo.menuData.allItems || [];
						const dishNames = dishes.map(d => d.name);
						const duplicates = dishNames.filter((name, idx) => dishNames.indexOf(name) !== idx);
						if (duplicates.length > 0) {
							problems.push({
								month: month,
								day: entry.day,
								menuNumber: entry.value,
								type: 'duplicates',
								severity: 'error',
								message: `Меню #${entry.value} содержит дубликаты: ${duplicates.join(', ')}`
							});
						}
					}
				} else {
					// Пустой день - тоже проблема
					problems.push({
						month: month,
						day: entry.day,
						menuNumber: null,
						type: 'empty',
						severity: 'error',
						message: `День ${month} ${entry.day} не заполнен`
					});
				}
			}
		}
		
		return problems;
	}

	// Добавим кнопку "Показать проблемы" в календарь
	function addProblemsButton() {
		const container = document.querySelector('#calendarContainer');
		if (!container) return;
		
		if (document.getElementById('calendarProblemsBtn')) return;
		
		const btn = document.createElement('button');
		btn.id = 'calendarProblemsBtn';
		btn.className = 'btn btn-danger';
		btn.style.cssText = `
			padding: 6px 16px;
			font-size: 0.75rem;
			background: linear-gradient(135deg, #dc2626, #ef4444);
			color: white;
			border: none;
			border-radius: 40px;
			cursor: pointer;
			display: inline-flex;
			align-items: center;
			gap: 6px;
		`;
		btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Проблемы';
		btn.addEventListener('click', showProblemsModal);
		
		// Добавляем рядом с другими кнопками
		const toolbar = container.querySelector('.calendar-toolbar') || container;
		toolbar.appendChild(btn);
	}

	// Модальное окно проблем
	function showProblemsModal() {
		const problems = getProblemDays();
		
		const modal = document.createElement('div');
		modal.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0,0,0,0.7);
			backdrop-filter: blur(8px);
			z-index: 20000;
			display: flex;
			justify-content: center;
			align-items: center;
		`;
		
		const problemCount = problems.length;
		const errorCount = problems.filter(p => p.severity === 'error').length;
		const warningCount = problems.filter(p => p.severity === 'warning').length;
		
		modal.innerHTML = `
			<div style="background: white; border-radius: 24px; padding: 28px; max-width: 700px; width: 95%; max-height: 80vh; overflow-y: auto;">
				<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
					<div>
						<h3 style="color: #0f172a; margin: 0;">
							<i class="fas fa-exclamation-triangle" style="color: ${problemCount > 0 ? '#dc2626' : '#10b981'};"></i>
							Проблемы в календаре
						</h3>
						<p style="color: #64748b; font-size: 14px; margin: 4px 0 0;">
							${problemCount === 0 ? '✅ Все дни заполнены корректно!' : 
							  `Найдено ${problemCount} проблем: ${errorCount} ошибок, ${warningCount} предупреждений`}
						</p>
					</div>
					<button id="closeProblemsBtn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8;">&times;</button>
				</div>
				
				${problemCount === 0 ? `
					<div style="text-align: center; padding: 40px 20px;">
						<i class="fas fa-check-circle" style="font-size: 48px; color: #10b981;"></i>
						<p style="margin-top: 16px; color: #16a34a; font-size: 1.1rem;">Все дни заполнены корректно!</p>
					</div>
				` : `
					<div style="display: flex; flex-direction: column; gap: 8px;">
						${problems.map(p => `
							<div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: ${p.severity === 'error' ? '#fef2f2' : '#fffbeb'}; border-radius: 12px; border-left: 4px solid ${p.severity === 'error' ? '#dc2626' : '#f59e0b'};">
								<div>
									<div style="font-weight: 600; color: #0f172a;">
										${p.month} ${p.day}
										${p.menuNumber ? `<span style="font-weight: 400; color: #64748b;">— Меню #${p.menuNumber}</span>` : ''}
									</div>
									<div style="font-size: 0.85rem; color: ${p.severity === 'error' ? '#dc2626' : '#d97706'};">
										${p.message}
									</div>
								</div>
								<button class="go-to-problem-btn" data-month="${p.month}" data-day="${p.day}" style="padding: 4px 16px; background: #3b82f6; color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 0.75rem; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
									<i class="fas fa-arrow-right"></i> Перейти
								</button>
							</div>
						`).join('')}
					</div>
				`}
				
				<div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; gap: 8px; justify-content: flex-end;">
					${problemCount > 0 ? `
						<button id="fixAllProblemsBtn" class="btn btn-primary" style="background: linear-gradient(135deg, #10b981, #059669);">
							<i class="fas fa-magic"></i> Исправить всё
						</button>
					` : ''}
					<button id="closeProblemsBtn2" class="btn btn-secondary">Закрыть</button>
				</div>
			</div>
		`;
		
		document.body.appendChild(modal);
		
		// Обработчики
		modal.querySelector('#closeProblemsBtn')?.addEventListener('click', () => modal.remove());
		modal.querySelector('#closeProblemsBtn2')?.addEventListener('click', () => modal.remove());
		
		modal.querySelectorAll('.go-to-problem-btn').forEach(btn => {
			btn.addEventListener('click', function() {
				const month = this.dataset.month;
				const day = parseInt(this.dataset.day);
				modal.remove();
				
				// Переключаемся на календарь
				const tab = document.querySelector('.tab-btn[data-tab="calendar"]');
				if (tab) tab.click();
				
				setTimeout(() => {
					// Ищем и подсвечиваем ячейку
					const cells = document.querySelectorAll(`td[data-month="${month}"][data-day="${day}"]`);
					for (const cell of cells) {
						cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
						flashElement(cell, 4);
						setTimeout(() => cell.click(), 500);
						break;
					}
				}, 300);
			});
		});
		
		modal.querySelector('#fixAllProblemsBtn')?.addEventListener('click', function() {
			if (confirm('Автоматически исправить все проблемы?')) {
				const problems = getProblemDays();
				let fixed = 0;
				
				// Заполняем пустые дни
				const emptyDays = problems.filter(p => p.type === 'empty');
				const menuOptions = getAvailableMenuOptions();
				
				for (const p of emptyDays) {
					if (menuOptions.length > 0) {
						const menu = menuOptions[fixed % menuOptions.length];
						setDayValue(p.month, p.day, menu.menuNumber);
						fixed++;
					}
				}
				
				// Для дубликатов и малого количества блюд — просто отмечаем
				showStatus(`✅ Исправлено ${fixed} проблем. Остальные требуют ручной проверки.`, 'success');
				modal.remove();
				renderCalendar();
			}
		});
		
		modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
	}

    const STORAGE_KEY = 'calendarData_v1';

    // Месяцы
    const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
                    'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

    const MONTH_INDEX = {
        'январь': 0, 'февраль': 1, 'март': 2, 'апрель': 3,
        'май': 4, 'июнь': 5, 'июль': 6, 'август': 7,
        'сентябрь': 8, 'октябрь': 9, 'ноябрь': 10, 'декабрь': 11
    };

    const HOLIDAYS_STORAGE_KEY = 'calendarHolidays_v1';

    // Встроенный список праздников и нерабочих дней (автоопределение выходных и праздников)
    const BUILTIN_HOLIDAYS = [
        { month: 'январь', day: 1, name: 'Новый год' },
        { month: 'январь', day: 2, name: 'Новогодние каникулы' },
        { month: 'январь', day: 3, name: 'Новогодние каникулы' },
        { month: 'январь', day: 4, name: 'Новогодние каникулы' },
        { month: 'январь', day: 5, name: 'Новогодние каникулы' },
        { month: 'январь', day: 6, name: 'Новогодние каникулы' },
        { month: 'январь', day: 7, name: 'Рождество Христово' },
        { month: 'январь', day: 8, name: 'Новогодние каникулы' },
        { month: 'февраль', day: 23, name: 'День защитника Отечества' },
        { month: 'март', day: 8, name: 'Международный женский день' },
        { month: 'май', day: 1, name: 'Праздник Весны и Труда' },
        { month: 'май', day: 9, name: 'День Победы' },
        { month: 'июнь', day: 12, name: 'День России' },
        { month: 'сентябрь', day: 1, name: 'День знаний' },
        { month: 'ноябрь', day: 4, name: 'День народного единства' }
    ];

    function getCalendarYear() {
        let year = parseInt(state.calendarMeta?.year);
        if (isNaN(year) || year < 2000 || year > 2100) year = 2026;
        return year;
    }

    function getDaysInMonth(month, year) {
        const idx = MONTH_INDEX[month];
        if (idx === undefined) return 31;
        return new Date(year, idx + 1, 0).getDate();
    }

    function getCustomHolidays() {
        try {
            const saved = localStorage.getItem(HOLIDAYS_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) {
            console.warn('Ошибка чтения списка нерабочих дней:', e);
        }
        return [];
    }

    function saveCustomHolidays(list) {
        try {
            localStorage.setItem(HOLIDAYS_STORAGE_KEY, JSON.stringify(list));
        } catch (e) {
            console.warn('Ошибка сохранения списка нерабочих дней:', e);
        }
    }

    // Объединённый список: встроенные праздники + свои нерабочие дни.
    // Отключённые встроенные праздники хранятся как { disabled: true }.
    function getAllHolidays() {
        const custom = getCustomHolidays();
        const disabled = new Set(
            custom.filter(h => h && h.disabled).map(h => `${h.month}_${h.day}`)
        );
        const result = [];
        for (const h of BUILTIN_HOLIDAYS) {
            if (!disabled.has(`${h.month}_${h.day}`)) {
                result.push({ month: h.month, day: h.day, name: h.name, builtin: true });
            }
        }
        for (const h of custom) {
            if (!h || h.disabled || !h.month || !h.day) continue;
            result.push({ month: h.month, day: parseInt(h.day), name: h.name || 'Нерабочий день', builtin: false });
        }
        return result;
    }

    function getHolidayName(month, day) {
        const found = getAllHolidays().find(h => h.month === month && h.day === day);
        return found ? found.name : null;
    }

    function isHoliday(month, day) {
        return !!getHolidayName(month, day);
    }

    function isWeekendDate(month, day, year) {
        const idx = MONTH_INDEX[month];
        if (idx === undefined) return false;
        const y = year || getCalendarYear();
        const dow = new Date(y, idx, day).getDay();
        return dow === 0 || dow === 6;
    }

    function isNonWorking(month, day) {
        return isWeekendDate(month, day) || isHoliday(month, day);
    }

    function getWeekdayName(month, day) {
        const idx = MONTH_INDEX[month];
        if (idx === undefined) return '';
        const names = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
        return names[new Date(getCalendarYear(), idx, day).getDay()];
    }

    // Гарантирует наличие записи дня в месяце (сортирует по дню)
    function ensureDayEntry(month, day) {
        if (!state.calendarData || !state.calendarData[month]) return false;
        const monthData = state.calendarData[month];
        let entry = monthData.find(e => e.day === day);
        if (!entry) {
            entry = { day: day, value: null, raw: '' };
            monthData.push(entry);
            monthData.sort((a, b) => a.day - b.day);
        }
        return true;
    }

    // Ограниченная палитра календаря: цвет зависит от недели типового меню,
    // а не от каждого номера меню (иначе календарь становится «радужным»).
    const CALENDAR_WEEK_PALETTE = [
        { primary: '#4338ca', light: '#eef2ff', name: 'Неделя 1' },
        { primary: '#0f766e', light: '#ccfbf1', name: 'Неделя 2' },
        { primary: '#b45309', light: '#fef3c7', name: 'Неделя 3' },
        { primary: '#9d174d', light: '#fce7f3', name: 'Неделя 4' },
        { primary: '#475569', light: '#f1f5f9', name: 'Неделя 5' }
    ];

    // Количество дней в неделе типового меню (по умолчанию 5)
    function getDaysPerWeekInTemplate() {
        const data = window.templateMenuData || window.currentTemplateData;
        const firstWeek = data && data.weeks ? data.weeks[1] : null;
        const count = firstWeek ? Object.keys(firstWeek).length : 0;
        return count > 0 ? count : 5;
    }

    // Возвращает цветовую маркировку номера меню (цвет = неделя меню)
    function getMenuNumberColor(menuNumber) {
        const num = parseInt(menuNumber, 10);
        if (!num || num < 1) {
            return { primary: '#64748b', light: '#f1f5f9', name: 'Без меню' };
        }
        const week = Math.ceil(num / getDaysPerWeekInTemplate());
        return CALENDAR_WEEK_PALETTE[(week - 1) % CALENDAR_WEEK_PALETTE.length];
    }

    // Короткое имя дня недели для ячейки календаря
    function getWeekdayShort(month, day) {
        const idx = MONTH_INDEX[month];
        if (idx === undefined) return '';
        const names = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        return names[new Date(getCalendarYear(), idx, day).getDay()];
    }

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

    const data = XLSX.utils.sheet_to_json(sheet, { 
        header: 1, 
        defval: '',
        raw: true
    });

    if (!data || data.length < 4) {
        console.error('❌ Недостаточно данных в календаре');
        return null;
    }

    console.log('📊 Данные из Excel:', data.length, 'строк');

    // ===== 1. ЧИТАЕМ ШАПКУ =====
    let schoolName = 'МОУ "Рудновская ООШ"';
    let year = '2026';
    
    for (let i = 0; i < Math.min(data.length, 5); i++) {
        const row = data[i];
        if (!row) continue;
        for (let j = 0; j < row.length; j++) {
            const val = String(row[j] || '').trim();
            if (val.includes('Школа') && row[j + 1]) {
                schoolName = String(row[j + 1]).trim();
            }
            if (val === 'Год' && row[j + 1]) {
                year = String(row[j + 1]).trim();
            }
        }
    }

    // ===== 2. НАХОДИМ СТРОКУ "Месяц" =====
    let monthRowIndex = -1;
    let dayRowIndex = -1;
    let dataStartIndex = -1;

    for (let i = 0; i < Math.min(data.length, 20); i++) {
        const row = data[i];
        if (!row || !row[0]) continue;
        const firstCell = String(row[0]).trim().toLowerCase();
        
        if (firstCell === 'месяц' || firstCell.includes('месяц')) {
            monthRowIndex = i;
            dayRowIndex = i + 1;
            dataStartIndex = i + 1; // Строка после "Месяц" и дней
            console.log(`✅ Найдена строка "Месяц" на индексе ${i}`);
            break;
        }
    }

    if (monthRowIndex === -1) {
        console.error('❌ Не найдена строка "Месяц"');
        return null;
    }

    // ===== 3. ОПРЕДЕЛЯЕМ КОЛИЧЕСТВО СТОЛБЦОВ =====
    let maxCols = 0;
    for (let i = dataStartIndex; i < data.length; i++) {
        const row = data[i];
        if (row && row.length > maxCols) {
            maxCols = row.length;
        }
    }
    
    const daysCount = Math.min(maxCols - 1, 31);
    console.log(`📅 Найдено столбцов с данными: ${daysCount}`);
    
    const days = [];
    for (let d = 1; d <= daysCount; d++) {
        days.push(d);
    }
    console.log(`📅 Итого дней: ${days.length}`);

    // ===== 4. СОЗДАЁМ ВСЕ МЕСЯЦЫ С ПУСТЫМИ ДАННЫМИ =====
    const calendarData = {};
    const monthList = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 
                       'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

    for (const month of monthList) {
        calendarData[month] = [];
        for (let d = 1; d <= 31; d++) {
            calendarData[month].push({
                day: d,
                value: null,
                raw: ''
            });
        }
    }

    // ===== 5. ЧИТАЕМ ВСЕ СТРОКИ, НАЧИНАЯ С dataStartIndex =====
    let monthsFound = 0;
    
    for (let i = dataStartIndex; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[0]) {
            console.log(`⚠️ Пропущена пустая строка ${i}`);
            continue;
        }

        let monthName = String(row[0]).trim().toLowerCase();
        monthName = monthName.replace(/[^а-яё]/g, '').trim();
        
        // Проверяем, является ли это название месяца
        let matchedMonth = null;
        for (const m of monthList) {
            if (m === monthName || m.startsWith(monthName.substring(0, 3))) {
                matchedMonth = m;
                break;
            }
        }
        
        if (!matchedMonth) {
            console.log(`⚠️ Пропущена строка ${i}: "${row[0]}" (не является месяцем)`);
            continue;
        }

        monthsFound++;
        console.log(`📊 Чтение месяца: ${matchedMonth} (строка ${i})`);

        // Читаем данные для каждого дня
        for (let j = 0; j < days.length; j++) {
            const day = days[j];
            const colIdx = j + 1; // пропускаем первый столбец (название месяца)
            
            let val = '';
            if (row.length > colIdx) {
                const cell = row[colIdx];
                if (typeof cell === 'number') {
                    val = String(cell);
                } else if (typeof cell === 'string') {
                    val = cell.trim();
                } else if (cell && typeof cell === 'object' && cell.v !== undefined) {
                    val = String(cell.v).trim();
                } else {
                    val = String(cell || '').trim();
                }
            }
            
            const numVal = parseInt(val);
            
            // Находим запись для этого дня
            const existingEntry = calendarData[matchedMonth].find(e => e.day === day);
            if (existingEntry) {
                if (!isNaN(numVal) && numVal > 0 && numVal <= 20) {
                    existingEntry.value = numVal;
                    existingEntry.raw = val;
                }
            }
        }
        
        const filledCount = calendarData[matchedMonth].filter(d => d.value !== null).length;
        console.log(`📊 ${matchedMonth}: ${filledCount} записей с меню из ${days.length} дней`);
    }

    console.log(`📌 Найдено месяцев в файле: ${monthsFound} из 12`);

    // ===== 6. ФОРМИРУЕМ РЕЗУЛЬТАТ =====
    const meta = {
        schoolName: schoolName || 'МОУ "Рудновская ООШ"',
        year: year || '2026',
        months: monthList,
        days: 31,
        totalDays: 31 * 12,
        totalMonths: 12
    };

    state.calendarData = calendarData;
    state.calendarMeta = meta;
    state.calendarMap = {};
    state.isLoaded = true;

    saveToStorage();

    console.log('✅ Календарь загружен:', {
        school: meta.schoolName,
        year: meta.year,
        months: meta.months.length,
        daysPerMonth: meta.days,
        totalDays: meta.totalDays
    });

    return { calendarData, meta, calendarMap: {} };
}

    // ============================================================
    // СОЗДАНИЕ КАЛЕНДАРЯ (ПУСТОГО)
    // ============================================================

    function generateEmptyCalendar() {
        // Создаём календарь на учебный год: все календарные дни месяца.
        // Выходные и праздники определяются автоматически при отображении.
        const calendarData = {};
        const year = getCalendarYear();

        for (const month of MONTHS) {
            const daysCount = getDaysInMonth(month, year);
            const monthData = [];
            for (let d = 1; d <= daysCount; d++) {
                monthData.push({ day: d, value: null, raw: '' });
            }
            calendarData[month] = monthData;
        }

        const meta = {
            schoolName: state.calendarMeta?.schoolName || 'МОУ "Рудновская ООШ"',
            year: String(year),
            months: MONTHS,
            days: 31,
            totalDays: 31 * 12,
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

            for (let d = 1; d <= maxDays; d++) {
                const entry = monthData.find(e => e.day === d);
                const hasValue = entry && entry.value !== null && entry.value !== undefined;
                const holidayName = getHolidayName(month, d);
                const weekend = isWeekendDate(month, d, parseInt(meta.year) || undefined);
                const contextAttrs = `data-month="${month}" data-day="${d}" oncontextmenu="CalendarModule.showDayContextMenu(event, '${month}', ${d}); return false;"`;

                if (hasValue) {
                    const menuNum = entry.value;
                    const color = getMenuNumberColor(menuNum);
                    const weekendNote = holidayName ? ` · 🎉 ${holidayName}` : (weekend ? ' · 🏖️ выходной' : '');
                    html += `
                        <td class="cal-cell cal-cell-filled" style="padding: 5px 3px; border: 1px solid #e2e8f0; text-align: center; cursor: pointer; background: ${color.light}; transition: all 0.15s;"
                            ${contextAttrs} data-value="${menuNum}" data-menu="${menuNum}"
                            title="Меню #${menuNum} · ${getWeekdayShort(month, d)}${weekendNote} — клик: изменить меню, правый клик: действия"
                            onclick="CalendarModule.openDayPicker(event, '${month}', ${d})">
                            <div style="font-weight: 800; font-size: 0.95rem; color: ${color.primary}; line-height: 1.1;">${menuNum}</div>
                            <div style="font-size: 0.55rem; color: ${color.primary}; opacity: 0.75;">${getWeekdayShort(month, d)}</div>
                        </td>
                    `;
                } else if (holidayName) {
                    html += `
                        <td class="cal-cell" style="padding: 5px 3px; border: 1px solid #e2e8f0; text-align: center; cursor: pointer; background: #e2e8f0; transition: all 0.15s;"
                            ${contextAttrs} data-value=""
                            title="${holidayName} — нерабочий день (клик — назначить меню, правый клик — действия)"
                            onclick="CalendarModule.openDayPicker(event, '${month}', ${d})">
                            <div style="font-size: 0.8rem;">🎉</div>
                            <div style="font-size: 0.55rem; color: #64748b;">${getWeekdayShort(month, d)}</div>
                        </td>
                    `;
                } else if (weekend) {
                    html += `
                        <td class="cal-cell" style="padding: 5px 3px; border: 1px solid #e2e8f0; text-align: center; cursor: pointer; background: #fef3c7; transition: all 0.15s;"
                            ${contextAttrs} data-value=""
                            title="Выходной (клик — назначить меню, правый клик — действия)"
                            onclick="CalendarModule.openDayPicker(event, '${month}', ${d})">
                            <div style="font-size: 0.8rem;">🏖️</div>
                            <div style="font-size: 0.55rem; color: #b45309;">${getWeekdayShort(month, d)}</div>
                        </td>
                    `;
                } else {
                    html += `
                        <td class="cal-cell" style="padding: 5px 3px; border: 1px solid #e2e8f0; text-align: center; background: white; cursor: pointer; transition: all 0.15s;"
                            ${contextAttrs} data-value=""
                            title="Свободный день (клик — назначить меню, правый клик — действия)"
                            onclick="CalendarModule.openDayPicker(event, '${month}', ${d})">
                            <div style="color: #cbd5e1; font-size: 0.9rem;">+</div>
                            <div style="font-size: 0.55rem; color: #94a3b8;">${getWeekdayShort(month, d)}</div>
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
                <span><span style="display: inline-block; width: 16px; height: 16px; background: #eef2ff; border: 1px solid #4338ca; border-radius: 4px; vertical-align: middle;"></span> С меню (цвет = неделя меню)</span>
                <span><span style="display: inline-block; width: 16px; height: 16px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px; vertical-align: middle;"></span> 🏖️ Выходной</span>
                <span><span style="display: inline-block; width: 16px; height: 16px; background: #e2e8f0; border: 1px solid #94a3b8; border-radius: 4px; vertical-align: middle;"></span> 🎉 Праздник</span>
                <span><span style="display: inline-block; width: 16px; height: 16px; background: white; border: 1px solid #e2e8f0; border-radius: 4px; vertical-align: middle;"></span> Свободный день</span>
                <span style="color: #94a3b8;">Клик по дню — быстро выбрать или заменить меню, правый клик — копировать / вставить / очистить</span>
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
	// ПОЛУЧЕНИЕ ДОСТУПНЫХ МЕНЮ
	// ============================================================

	function getAvailableMenuOptions() {
		const data = window.currentTemplateData || window.templateMenuData;
		if (!data || !data.weeks) {
			console.warn('⚠️ Нет данных типового меню');
			return [];
		}

		const result = [];
		const allDays = [];

		// Собираем все дни
		for (const w in data.weeks) {
			for (const d in data.weeks[w]) {
				allDays.push({ week: parseInt(w), day: parseInt(d) });
			}
		}
		allDays.sort((a, b) => a.week - b.week || a.day - a.day);

		// Для каждого дня собираем информацию
		for (let i = 0; i < allDays.length; i++) {
			const { week, day } = allDays[i];
			const menuNumber = i + 1;
			const dayData = data.weeks[week]?.[day];
			if (!dayData) continue;

			const dishes = [];
			const mealNames = [];
			const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];
			const mealNameMap = {
				'breakfast': '🌅 Завтрак',
				'breakfast2': '🍎 2-й завтрак',
				'lunch': '🍲 Обед',
				'afternoonSnack': '🍪 Полдник',
				'dinner': '🌙 Ужин',
				'dinner2': '🥛 2-й ужин'
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
					menuNumber: menuNumber,
					week: week,
					day: day,
					dishes: dishes.slice(0, 10),
					dishCount: dishes.length,
					mealNames: mealNames,
					preview: dishes.slice(0, 5).join(', ') + (dishes.length > 5 ? ` ... (+${dishes.length - 5})` : '')
				});
			}
		}

		return result;
	}

    // ============================================================
    // БЫСТРЫЙ ВЫБОР / ЗАМЕНА МЕНЮ ПРЯМО В ЯЧЕЙКЕ КАЛЕНДАРЯ
    // ============================================================
    let dayPickerEl = null;

    function closeDayPicker() {
        if (dayPickerEl) { dayPickerEl.remove(); dayPickerEl = null; }
        document.removeEventListener('click', onDayPickerOutside, true);
        document.removeEventListener('keydown', onDayPickerKey, true);
    }

    function onDayPickerOutside(e) {
        if (dayPickerEl && !dayPickerEl.contains(e.target)) closeDayPicker();
    }

    function onDayPickerKey(e) {
        if (e.key === 'Escape') closeDayPicker();
    }

    function openDayPicker(event, month, day) {
        if (event) event.stopPropagation();
        closeDayPicker();

        const cell = event && event.currentTarget ? event.currentTarget : null;
        const rect = cell ? cell.getBoundingClientRect() : null;
        const options = getAvailableMenuOptions();
        const entry = (state.calendarData && state.calendarData[month])
            ? state.calendarData[month].find(e => e.day === day)
            : null;
        const current = entry ? entry.value : null;
        const weekday = getWeekdayName(month, day);
        const maxMenu = options.length ? options[options.length - 1].menuNumber : 25;
        const currentColor = current ? getMenuNumberColor(current) : null;

        let gridHtml = '';
        if (!options.length) {
            gridHtml = `<div style="grid-column: 1 / -1; padding: 14px; text-align: center; color: #94a3b8; font-size: 0.82rem;">
                Типовое меню не загружено — нечего выбирать
            </div>`;
        } else {
            const byWeek = {};
            options.forEach(o => { (byWeek[o.week] = byWeek[o.week] || []).push(o); });
            Object.keys(byWeek).map(Number).sort((a, b) => a - b).forEach(week => {
                gridHtml += `<div class="cal-picker-week">Неделя ${week}</div>`;
                byWeek[week].forEach(o => {
                    const color = getMenuNumberColor(o.menuNumber);
                    const active = current === o.menuNumber;
                    gridHtml += `<button type="button" class="cal-picker-opt ${active ? 'active' : ''}"
                        data-menu="${o.menuNumber}"
                        title="Меню ${o.menuNumber} · Неделя ${o.week}, День ${o.day} · ${o.dishCount} блюд"
                        style="--c:${color.primary}; --cl:${color.light};">
                        <span class="cal-picker-num">${o.menuNumber}</span>
                        <span class="cal-picker-meta">Д${o.day} · ${o.dishCount} бл.</span>
                    </button>`;
                });
            });
        }

        const panel = document.createElement('div');
        panel.className = 'cal-picker';
        panel.id = 'calendarDayPicker';
        panel.innerHTML = `
            <div class="cal-picker-head">
                <div>
                    <div class="cal-picker-title">${month}, ${day} · ${weekday}</div>
                    <div class="cal-picker-sub">${current
                        ? `Сейчас: Меню #${current}${currentColor ? ' · ' + currentColor.name : ''}`
                        : 'Меню не назначено'}</div>
                </div>
                <button type="button" class="cal-picker-close" id="calPickerClose" title="Закрыть">&times;</button>
            </div>
            <div class="cal-picker-body">${gridHtml}</div>
            <div class="cal-picker-foot">
                <input type="number" id="calPickerInput" min="1" max="${maxMenu}" placeholder="№ меню" value="${current || ''}">
                <button type="button" class="cal-picker-btn" id="calPickerApply">OK</button>
                <button type="button" class="cal-picker-btn ghost" id="calPickerClear">Очистить</button>
                ${current ? '<button type="button" class="cal-picker-btn ghost" id="calPickerOpen">Открыть день</button>' : ''}
            </div>
        `;
        document.body.appendChild(panel);
        dayPickerEl = panel;

        if (rect) {
            const pw = panel.offsetWidth;
            const ph = panel.offsetHeight;
            let left = rect.left + rect.width / 2 - pw / 2;
            let top = rect.bottom + 8;
            left = Math.min(Math.max(left, 8), Math.max(8, window.innerWidth - pw - 8));
            if (top + ph > window.innerHeight - 8) top = Math.max(8, rect.top - ph - 8);
            panel.style.left = left + 'px';
            panel.style.top = top + 'px';
        }

        panel.querySelector('#calPickerClose').addEventListener('click', closeDayPicker);

        panel.querySelectorAll('.cal-picker-opt').forEach(btn => {
            btn.addEventListener('click', () => {
                setDayValue(month, day, parseInt(btn.dataset.menu, 10));
                closeDayPicker();
            });
        });

        panel.querySelector('#calPickerClear').addEventListener('click', () => {
            setDayValue(month, day, null);
            closeDayPicker();
        });

        const applyInput = () => {
            const input = panel.querySelector('#calPickerInput');
            const n = parseInt(input.value, 10);
            if (!n || n < 1) { input.focus(); return; }
            if (!options.some(o => o.menuNumber === n)) {
                showStatus(`Меню #${n} нет в типовом меню`, 'warning');
                input.focus();
                return;
            }
            setDayValue(month, day, n);
            closeDayPicker();
        };
        panel.querySelector('#calPickerApply').addEventListener('click', applyInput);
        panel.querySelector('#calPickerInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); applyInput(); }
        });

        const openBtn = panel.querySelector('#calPickerOpen');
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                closeDayPicker();
                CalendarModule.openInDailyMenu(month, day, current);
            });
        }

        setTimeout(() => {
            document.addEventListener('click', onDayPickerOutside, true);
            document.addEventListener('keydown', onDayPickerKey, true);
        }, 0);
    }

    // ============================================================
    // МОДАЛЬНОЕ ОКНО ВЫБОРА МЕНЮ
    // ============================================================

	// ============================================================
	// МОДАЛЬНОЕ ОКНО ВЫБОРА МЕНЮ (С ДНЁМ НЕДЕЛИ)
	// ============================================================

	function openDayModal(month, day) {
		console.log('📅 Открытие модалки для:', month, day);
		
		const modal = document.getElementById('calendarDayModal');
		const infoEl = document.getElementById('modalDayInfo');
		const weekdayEl = document.getElementById('modalDayWeekday');
		const currentValueEl = document.getElementById('modalCurrentValue');
		const listContainer = document.getElementById('calendarDayList');

		if (!modal) {
			console.error('❌ Модалка не найдена');
			return;
		}

		// Сохраняем выбранную ячейку
		state.selectedCell = { month, day };

		// Обновляем информацию
		const monthData = state.calendarData[month] || [];
		const entry = monthData.find(e => e.day === day);
		const currentValue = entry?.value || null;

		const monthDisplay = month.charAt(0).toUpperCase() + month.slice(1);
		
		// ===== ОПРЕДЕЛЯЕМ ДЕНЬ НЕДЕЛИ (НАДЁЖНАЯ ВЕРСИЯ) =====
		// Получаем год из meta, если нет — из текущей даты
		let year = parseInt(state.calendarMeta?.year);
		if (isNaN(year) || year < 2000 || year > 2100) {
			year = new Date().getFullYear();
			console.log('📅 Год не найден в meta, используем текущий:', year);
		}

		// Создаём карту месяцев для правильного определения
		const monthMap = {
			'январь': 0, 'февраль': 1, 'март': 2, 'апрель': 3,
			'май': 4, 'июнь': 5, 'июль': 6, 'август': 7,
			'сентябрь': 8, 'октябрь': 9, 'ноябрь': 10, 'декабрь': 11
		};

		const monthIndex = monthMap[month];
		if (monthIndex === undefined) {
			console.warn('⚠️ Неизвестный месяц:', month);
			// Пробуем определить по первой букве
			const found = Object.keys(monthMap).find(m => m.startsWith(month.substring(0, 3)));
			if (found) {
				const idx = monthMap[found];
				const dateObj2 = new Date(year, idx, day);
				const weekdays2 = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
				const weekdayName2 = weekdays2[dateObj2.getDay()];
				weekdayEl.textContent = weekdayName2;
				// ... остальной код
			}
			return;
		}

		const dateObj = new Date(year, monthIndex, day);
		const weekdays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
		const weekdayName = weekdays[dateObj.getDay()];

		// Цвет для дня недели
		const weekdayColors = {
			'Понедельник': '#3b82f6',
			'Вторник': '#3b82f6',
			'Среда': '#3b82f6',
			'Четверг': '#3b82f6',
			'Пятница': '#3b82f6',
			'Суббота': '#10b981',
			'Воскресенье': '#ef4444'
		};
		const weekdayColor = weekdayColors[weekdayName] || '#64748b';

		// Определяем, выходной ли это
		const isWeekend = weekdayName === 'Суббота' || weekdayName === 'Воскресенье';
		const weekendLabel = isWeekend ? ' 🏖️ Выходной' : '';

		console.log(`📅 ${month} ${day}, ${year} → ${weekdayName}`);

		// Обновляем элементы
		infoEl.textContent = `${monthDisplay}, ${day} число${weekendLabel}`;
		
		if (weekdayEl) {
			weekdayEl.textContent = weekdayName;
			weekdayEl.style.background = isWeekend ? '#fef3c7' : '#f1f5f9';
			weekdayEl.style.color = weekdayColor;
			weekdayEl.style.border = isWeekend ? '1px solid #f59e0b' : '1px solid #e2e8f0';
		}

		currentValueEl.textContent = currentValue ? `Меню #${currentValue}` : 'Не выбрано';
		currentValueEl.style.background = currentValue ? '#dcfce7' : '#fef3c7';
		currentValueEl.style.color = currentValue ? '#16a34a' : '#d97706';

		// Получаем список доступных меню
		const menuOptions = getAvailableMenuOptions();
		
		// Рендерим список
		if (menuOptions.length === 0) {
			listContainer.innerHTML = `
				<div style="text-align: center; padding: 40px 20px; color: #94a3b8; grid-column: 1 / -1;">
					<i class="fas fa-utensils" style="font-size: 2rem; margin-bottom: 8px; display: block;"></i>
					<p>Нет доступных меню</p>
					<p style="font-size: 0.8rem; color: #cbd5e1;">Загрузите типовое меню на вкладке «Редактор меню»</p>
				</div>
			`;
		} else {
			let html = '';
			
			// Опция "Выходной" (очистить)
			html += `
				<div style="padding: 12px; border: 2px solid #f59e0b; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: #fef3c7; text-align: center;"
					 onclick="CalendarModule.setDayValue('${month}', ${day}, null)"
					 onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 4px 12px rgba(245,158,11,0.3)';"
					 onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
					<div style="font-size: 1.2rem;">🏖️</div>
					<div style="font-weight: 600; color: #d97706;">Выходной</div>
					<div style="font-size: 0.7rem; color: #92400e;">Очистить ячейку</div>
				</div>
			`;

			// Варианты меню
			for (const option of menuOptions) {
				const isCurrent = currentValue === option.menuNumber;
				const color = window.DailyMenuModule?.getMenuColor?.(option.menuNumber) || { primary: '#10b981', light: '#dcfce7' };
				
				html += `
					<div style="padding: 12px; border: 2px solid ${isCurrent ? '#10b981' : '#e2e8f0'}; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: ${isCurrent ? '#dcfce7' : 'white'};"
						 onclick="CalendarModule.setDayValue('${month}', ${day}, ${option.menuNumber})"
						 onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)';"
						 onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
						<div style="display: flex; justify-content: space-between; align-items: center;">
							<span style="font-weight: 700; color: ${isCurrent ? '#16a34a' : '#0f172a'};">
								<span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${color.primary}; margin-right: 8px;"></span>
								Меню #${option.menuNumber}
								${isCurrent ? '<span style="font-size: 0.6rem; background: #10b981; color: white; padding: 1px 8px; border-radius: 10px; margin-left: 8px;">✓</span>' : ''}
							</span>
							<span style="font-size: 0.65rem; color: #64748b;">
								${option.week ? `Неделя ${option.week}` : ''} ${option.day ? `День ${option.day}` : ''}
							</span>
						</div>
						<div style="font-size: 0.7rem; color: #64748b; margin-top: 4px;">
							${option.mealNames?.join(' · ') || ''} 
							${option.dishCount ? `· ${option.dishCount} блюд` : ''}
						</div>
						${option.preview ? `
							<div style="font-size: 0.6rem; color: #94a3b8; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
								${option.preview}
							</div>
						` : ''}
					</div>
				`;
			}

			listContainer.innerHTML = html;
		}

		// ===== ДОБАВЛЯЕМ КНОПКУ "ОТКРЫТЬ В ЕЖЕДНЕВНОМ МЕНЮ" =====
		// Создаём контейнер для кнопок, если его нет
		let buttonContainer = document.querySelector('#calendarDayModal .modal-actions');
		if (!buttonContainer) {
			buttonContainer = document.createElement('div');
			buttonContainer.className = 'modal-actions';
			buttonContainer.style.cssText = `
				display: flex;
				gap: 12px;
				justify-content: flex-end;
				flex-wrap: wrap;
				margin-top: 16px;
				padding-top: 16px;
				border-top: 1px solid #e2e8f0;
			`;
			
			// Вставляем перед футером или в конец модалки
			const modalContent = document.querySelector('#calendarDayModal .modal-content');
			if (modalContent) {
				modalContent.appendChild(buttonContainer);
			}
		}

		// Кнопка "Открыть в ежедневном меню"
		const openInDailyBtn = document.createElement('button');
		openInDailyBtn.className = 'btn btn-purple';
		openInDailyBtn.style.cssText = `
			padding: 8px 20px;
			font-size: 0.8rem;
			background: linear-gradient(135deg, #8b5cf6, #7c3aed);
			color: white;
			border: none;
			border-radius: 40px;
			cursor: pointer;
			display: inline-flex;
			align-items: center;
			gap: 8px;
			transition: all 0.2s;
			box-shadow: 0 2px 8px rgba(139,92,246,0.3);
		`;
		openInDailyBtn.innerHTML = `
			<i class="fas fa-calendar-day"></i> 
			Открыть в ежедневном меню
		`;
		openInDailyBtn.onmouseover = function() {
			this.style.transform = 'scale(1.03)';
			this.style.boxShadow = '0 4px 16px rgba(139,92,246,0.4)';
		};
		openInDailyBtn.onmouseout = function() {
			this.style.transform = 'scale(1)';
			this.style.boxShadow = '0 2px 8px rgba(139,92,246,0.3)';
		};
		openInDailyBtn.onclick = function() {
			const month = state.selectedCell?.month;
			const day = state.selectedCell?.day;
			if (month && day) {
				// Находим номер меню для этого дня
				const key = `${month}_${day}`;
				const menuNumber = state.calendarMap?.[key];
				if (menuNumber) {
					// Закрываем модалку календаря
					document.getElementById('calendarDayModal').style.display = 'none';
					
					// Переключаемся на вкладку ежедневного меню
					const dailyTab = document.querySelector('.tab-btn[data-tab="daily"]');
					if (dailyTab) {
						dailyTab.click();
					}
					
					// Загружаем меню
					setTimeout(() => {
						if (window.DailyMenuModule && window.DailyMenuModule.loadDailyMenu) {
							window.DailyMenuModule.loadDailyMenu(menuNumber);
							// Обновляем дату в ежедневном меню
							const dateInput = document.getElementById('dailyMenuDate');
							if (dateInput) {
								// Устанавливаем дату на основе месяца и дня
								const year = state.calendarMeta?.year || new Date().getFullYear();
								const monthMap = {
									'январь': 0, 'февраль': 1, 'март': 2, 'апрель': 3,
									'май': 4, 'июнь': 5, 'июль': 6, 'август': 7,
									'сентябрь': 8, 'октябрь': 9, 'ноябрь': 10, 'декабрь': 11
								};
								const monthIndex = monthMap[month];
								if (monthIndex !== undefined) {
									const date = new Date(parseInt(year), monthIndex, day);
									const dateStr = date.toISOString().slice(0, 10);
									dateInput.value = dateStr;
									// Триггерим событие изменения
									dateInput.dispatchEvent(new Event('change', { bubbles: true }));
								}
							}
							// Обновляем имя файла
							const variantNameInput = document.getElementById('variantNameInput');
							if (variantNameInput) {
								const date = new Date();
								const dateStr = date.toISOString().slice(0, 10);
								variantNameInput.value = `${dateStr}-sm.xlsx`;
							}
							showStatus(`📅 Открыто меню #${menuNumber} для ${month} ${day}`, 'success');
						} else {
							showStatus('⚠️ Модуль ежедневного меню не загружен', 'error');
						}
					}, 400);
				} else {
					showStatus('⚠️ Для этого дня не назначено меню', 'warning');
				}
			}
		};

		// Добавляем кнопку в контейнер
		// Очищаем контейнер от старых кнопок (если они есть)
		const existingBtn = buttonContainer.querySelector('.open-in-daily-btn');
		if (existingBtn) existingBtn.remove();
		openInDailyBtn.classList.add('open-in-daily-btn');
		buttonContainer.appendChild(openInDailyBtn);

		// Показываем модалку
		modal.style.display = 'flex';
		console.log('✅ Модалка открыта');
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
	// УСТАНОВКА ЗНАЧЕНИЯ ДЛЯ ДНЯ (ИСПРАВЛЕННАЯ ВЕРСИЯ)
	// ============================================================

	function setDayValue(month, day, value) {
		console.log('📝 Установка значения:', month, day, value);
		
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
		
		saveCalendarHistory();
		
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

		saveCalendarHistory();

		// Сохраняем
		saveToStorage();

		// Перерисовываем календарь
		renderCalendar();

		// Закрываем модалку
		const modal = document.getElementById('calendarDayModal');
		if (modal) modal.style.display = 'none';

		const message = value ? `✅ Установлено меню #${value} на ${month} ${day}` : `🗑️ Очищен день ${month} ${day}`;
		showStatus(message, 'success');
	}

	// ============================================================
	// ЭКСПОРТ КАЛЕНДАРЯ В EXCEL (С ПРАВИЛЬНОЙ ШАПКОЙ)
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
			const year = parseInt(meta.year) || 2026;

			const workbook = new ExcelJS.Workbook();
			const worksheet = workbook.addWorksheet('Календарь питания');

			// ===== ШАПКА (ПРАВИЛЬНАЯ СТРУКТУРА) =====
			
			// Строка 1: Школа | Название школы (объединено B1:J1) | Календарь питания (L1:P1) | Год (AD1) | значение (AE1)
			worksheet.getCell('A1').value = 'Школа';
			worksheet.getCell('A1').font = { bold: true };
			
			// Объединяем B1:J1 для названия школы
			worksheet.mergeCells('B1:J1');
			worksheet.getCell('B1').value = meta.schoolName || 'МОУ "Рудновская ООШ"';
			worksheet.getCell('B1').alignment = { horizontal: 'left', vertical: 'middle' };
			// Заливка #FFF2CC
			worksheet.getCell('B1').fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFF2CC' }
			};
			
			// Объединяем L1:P1 для "Календарь питания"
			worksheet.mergeCells('L1:P1');
			worksheet.getCell('L1').value = 'Календарь питания';
			worksheet.getCell('L1').alignment = { horizontal: 'center', vertical: 'middle' };
			worksheet.getCell('L1').font = { bold: true };
			
			// Год
			worksheet.getCell('AC1').value = 'Год';
			worksheet.getCell('AC1').font = { bold: true };
			worksheet.getCell('AC1').alignment = { horizontal: 'right', vertical: 'middle' };
			
			worksheet.getCell('AD1').value = year;
			worksheet.getCell('AD1').alignment = { horizontal: 'left', vertical: 'middle' };
			worksheet.getCell('AD1').font = { bold: true };
			worksheet.getCell('AE1').alignment = { horizontal: 'left', vertical: 'middle' };
			worksheet.getCell('AE1').font = { bold: true };

			// Строка 2: пустая (или можно использовать для дополнительной информации)
			worksheet.addRow([]);

			// ===== ЗАГОЛОВОК ТАБЛИЦЫ (строка 3) =====
			// "Месяц" и дни (1, 2, 3, ...)
			const maxDays = meta.days || 31;
			const headerRow = ['Месяц'];
			for (let d = 1; d <= maxDays; d++) {
				headerRow.push(d);
			}
			const headerRowIndex = 3;
			worksheet.addRow(headerRow);
			
			// Стилизация заголовка
			const headerExcelRow = worksheet.getRow(headerRowIndex);
			headerExcelRow.height = 20;
			headerExcelRow.font = { bold: true };
			headerExcelRow.alignment = { horizontal: 'center', vertical: 'middle' };
			
			// Заливка заголовка
			for (let i = 1; i <= maxDays + 1; i++) {
				const cell = worksheet.getCell(headerRowIndex, i);
				cell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'D9E1F2' }
				};
				cell.border = {
					top: { style: 'thin', color: { argb: 'FFD4D4D4' } },
					left: { style: 'thin', color: { argb: 'FFD4D4D4' } },
					bottom: { style: 'thin', color: { argb: 'FFD4D4D4' } },
					right: { style: 'thin', color: { argb: 'FFD4D4D4' } }
				};
			}

			// ===== ДАННЫЕ ПО МЕСЯЦАМ =====
			const monthNames = meta.months || MONTHS;
			
			const monthMap = {
				'январь': 0, 'февраль': 1, 'март': 2, 'апрель': 3,
				'май': 4, 'июнь': 5, 'июль': 6, 'август': 7,
				'сентябрь': 8, 'октябрь': 9, 'ноябрь': 10, 'декабрь': 11
			};

			// Определяем первый день с меню в январе
			let firstDayWithMenu = null;
			if (calendarData['январь']) {
				for (const entry of calendarData['январь']) {
					if (entry.value !== null && entry.value !== undefined) {
						firstDayWithMenu = entry.day;
						break;
					}
				}
			}
			if (!firstDayWithMenu) firstDayWithMenu = 15;

			// Добавляем данные по месяцам
			const dataStartRow = 4;
			for (const month of monthNames) {
				const monthData = calendarData[month] || [];
				const row = [month];
				const monthIndex = monthMap[month];
				
				for (let d = 1; d <= maxDays; d++) {
					const entry = monthData.find(e => e.day === d);
					const value = entry?.value || '';
					row.push(value);
				}
				worksheet.addRow(row);
			}

			// ===== НАСТРОЙКА ШИРИНЫ СТОЛБЦОВ =====
			worksheet.getColumn('A').width = 15;
			for (let i = 2; i <= maxDays + 1; i++) {
				worksheet.getColumn(i).width = 6;
			}

			// ===== ВЫСОТА СТРОК =====
			worksheet.getRow(1).height = 25;
			worksheet.getRow(2).height = 5; // пустая строка-разделитель

			// ===== ПРИМЕНЯЕМ ЦВЕТА К ЯЧЕЙКАМ С ДАННЫМИ =====
			const colors = {
				NEW_YEAR: 'FF8080',
				WEEKEND: 'F4B084',
				WITH_MEAL: 'FFF2CC',
				WEEKDAY_NO_MEAL: 'C6E0B4',
				EMPTY: 'FFFFFF'
			};

			for (let rowIdx = 0; rowIdx < monthNames.length; rowIdx++) {
				const month = monthNames[rowIdx];
				const excelRow = dataStartRow + rowIdx;
				const monthData = calendarData[month] || [];
				const monthIndex = monthMap[month];
				
				// Заливка названия месяца
				const monthCell = worksheet.getCell(excelRow, 1);
				monthCell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'D9E1F2' }
				};
				monthCell.font = { bold: true };
				monthCell.border = {
					top: { style: 'thin', color: { argb: 'FFD4D4D4' } },
					left: { style: 'thin', color: { argb: 'FFD4D4D4' } },
					bottom: { style: 'thin', color: { argb: 'FFD4D4D4' } },
					right: { style: 'thin', color: { argb: 'FFD4D4D4' } }
				};
				
				for (let d = 1; d <= maxDays; d++) {
					const colIdx = d + 1;
					const cell = worksheet.getCell(excelRow, colIdx);
					
					const entry = monthData.find(e => e.day === d);
					const hasValue = entry && entry.value !== null && entry.value !== undefined;
					
					let dayOfWeek = -1;
					let isWeekend = false;
					let isNewYearHoliday = false;
					
					if (monthIndex !== undefined) {
						const dateObj = new Date(year, monthIndex, d);
						dayOfWeek = dateObj.getDay();
						isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
						
						if (month === 'январь' && d >= 1 && d < firstDayWithMenu) {
							isNewYearHoliday = true;
						}
					}
					
					let fillColor = colors.EMPTY;
					let borderColor = 'FFD4D4D4';
					
					if (isNewYearHoliday) {
						fillColor = colors.NEW_YEAR;
					} else if (isWeekend) {
						fillColor = colors.WEEKEND;
					} else if (hasValue) {
						fillColor = colors.WITH_MEAL;
					} else {
						fillColor = colors.WEEKDAY_NO_MEAL;
					}
					
					cell.fill = {
						type: 'pattern',
						pattern: 'solid',
						fgColor: { argb: fillColor }
					};
					
					cell.border = {
						top: { style: 'thin', color: { argb: borderColor } },
						left: { style: 'thin', color: { argb: borderColor } },
						bottom: { style: 'thin', color: { argb: borderColor } },
						right: { style: 'thin', color: { argb: borderColor } }
					};
					
					cell.alignment = { horizontal: 'center', vertical: 'middle' };
				}
			}

			const totalRows = monthNames.length + 3; // +3 за заголовок и пустую строку
			const totalCols = maxDays + 1;

			for (let row = 3; row <= totalRows; row++) {
				for (let col = 1; col <= totalCols; col++) {
					const cell = worksheet.getCell(row, col);
					cell.border = {
						top: { style: 'thin', color: { argb: 'FF000000' } },
						left: { style: 'thin', color: { argb: 'FF000000' } },
						bottom: { style: 'thin', color: { argb: 'FF000000' } },
						right: { style: 'thin', color: { argb: 'FF000000' } }
					};
				}
			}





			// ===== СОХРАНЯЕМ =====
			const buffer = await workbook.xlsx.writeBuffer();
			const blob = new Blob([buffer], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			});

			const fileName = `kp${year}.xlsx`;
			saveAs(blob, fileName);

			showStatus(`📥 Календарь сохранён как "${fileName}"`, 'success');

		} catch (error) {
			console.error('Ошибка экспорта календаря:', error);
			showStatus(`Ошибка: ${error.message}`, 'error');
		}
	}

    // ============================================================
    // 2.1 МАССОВОЕ ЗАПОЛНЕНИЕ ПЕРИОДА
    // ============================================================

    // Перебор всех календарных дней от (month1, day1) до (month2, day2)
    function eachDayInRange(month1, day1, month2, day2, callback) {
        const startMonth = MONTH_INDEX[month1];
        const endMonth = MONTH_INDEX[month2];
        if (startMonth === undefined || endMonth === undefined) return 0;

        const year = getCalendarYear();
        const start = new Date(year, startMonth, day1);
        const end = new Date(year, endMonth, day2);
        if (end < start) return 0;

        let count = 0;
        const cursor = new Date(start);
        while (cursor <= end) {
            const m = MONTHS[cursor.getMonth()];
            const d = cursor.getDate();
            callback(m, d);
            count++;
            cursor.setDate(cursor.getDate() + 1);
        }
        return count;
    }

    // Разбирает строку вида "1,2,3", "1-5", "1 2 3" в массив номеров меню
    function parseMenuSequence(str) {
        const result = [];
        if (!str) return result;
        const parts = String(str).split(/[,\s]+/).filter(Boolean);
        for (const part of parts) {
            const range = part.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
            if (range) {
                let a = parseInt(range[1]);
                let b = parseInt(range[2]);
                if (a > b) { const t = a; a = b; b = t; }
                for (let i = a; i <= b; i++) result.push(i);
            } else {
                const n = parseInt(part);
                if (!isNaN(n) && n > 0) result.push(n);
            }
        }
        return result;
    }

    function getIsoWeek(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    function openFillPeriodModal() {
        if (!state.isLoaded || !state.calendarData) {
            showStatus('Сначала создайте или загрузите календарь', 'error');
            return;
        }
        document.getElementById('calendarFillPeriodModal')?.remove();

        const monthOptions = MONTHS.map(m => `<option value="${m}">${m}</option>`).join('');
        const modal = document.createElement('div');
        modal.id = 'calendarFillPeriodModal';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(4px); z-index: 20000; display: flex; align-items: center; justify-content: center; padding: 20px;';
        modal.innerHTML = `
            <div style="background: white; border-radius: 24px; padding: 28px; max-width: 560px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
                    <h3 style="color: #0f172a; margin: 0; font-size: 1.2rem;">
                        <i class="fas fa-fill-drip" style="color: #8b5cf6;"></i> Заполнить период
                    </h3>
                    <button type="button" data-close style="background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8;">&times;</button>
                </div>

                <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                    <div style="flex: 1;">
                        <label style="display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 4px; font-weight: 600;">Начало периода</label>
                        <div style="display: flex; gap: 6px;">
                            <select id="fpStartMonth" style="flex: 1; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.85rem;">${monthOptions}</select>
                            <input type="number" id="fpStartDay" value="1" min="1" max="31" style="width: 64px; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.85rem;">
                        </div>
                    </div>
                    <div style="flex: 1;">
                        <label style="display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 4px; font-weight: 600;">Конец периода</label>
                        <div style="display: flex; gap: 6px;">
                            <select id="fpEndMonth" style="flex: 1; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.85rem;">${monthOptions}</select>
                            <input type="number" id="fpEndDay" value="31" min="1" max="31" style="width: 64px; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.85rem;">
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 4px; font-weight: 600;">Номера меню (по кругу)</label>
                    <input type="text" id="fpSequence" value="1,2,3,4,5" placeholder="Например: 1,2,3,4,5 или 1-5"
                        style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.9rem;">
                    <p style="font-size: 0.72rem; color: #94a3b8; margin: 6px 0 0;">Укажите номера меню через запятую. Они будут расставлены по дням периода по кругу.</p>
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; font-size: 0.85rem; color: #334155;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="fpSkipWeekends" checked style="width: 16px; height: 16px;"> Пропускать выходные
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="fpSkipHolidays" checked style="width: 16px; height: 16px;"> Пропускать праздники
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="fpOnlyEmpty" style="width: 16px; height: 16px;"> Заполнять только пустые дни
                    </label>
                </div>

                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" data-close class="btn btn-secondary" style="padding: 10px 20px;">Отмена</button>
                    <button type="button" id="fpApplyBtn" class="btn btn-primary" style="padding: 10px 22px; background: linear-gradient(135deg, #8b5cf6, #7c3aed);">
                        <i class="fas fa-check"></i> Заполнить
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => modal.remove()));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        modal.querySelector('#fpApplyBtn').addEventListener('click', () => {
            applyFillPeriod();
            modal.remove();
        });
    }

    function applyFillPeriod() {
        const startMonth = document.getElementById('fpStartMonth')?.value;
        const endMonth = document.getElementById('fpEndMonth')?.value;
        const startDay = parseInt(document.getElementById('fpStartDay')?.value);
        const endDay = parseInt(document.getElementById('fpEndDay')?.value);
        const seq = parseMenuSequence(document.getElementById('fpSequence')?.value);
        const skipWeekends = document.getElementById('fpSkipWeekends')?.checked;
        const skipHolidays = document.getElementById('fpSkipHolidays')?.checked;
        const onlyEmpty = document.getElementById('fpOnlyEmpty')?.checked;

        if (isNaN(startDay) || isNaN(endDay)) { showStatus('Укажите корректные даты периода', 'error'); return; }
        if (!seq.length) { showStatus('Укажите хотя бы один номер меню', 'error'); return; }

        const total = eachDayInRange(startMonth, startDay, endMonth, endDay, () => {});
        if (!total) { showStatus('Конец периода раньше начала — проверьте даты', 'error'); return; }

        saveCalendarHistory();
        let counter = 0;
        let filled = 0;
        eachDayInRange(startMonth, startDay, endMonth, endDay, (m, d) => {
            if (skipWeekends && isWeekendDate(m, d)) return;
            if (skipHolidays && isHoliday(m, d)) return;
            ensureDayEntry(m, d);
            const entry = state.calendarData[m].find(e => e.day === d);
            if (!entry) return;
            if (onlyEmpty && entry.value !== null && entry.value !== undefined) return;
            entry.value = seq[counter % seq.length];
            entry.raw = String(entry.value);
            counter++;
            filled++;
        });

        saveToStorage();
        renderCalendar();
        showStatus(`✅ Заполнено ${filled} дней за период`, 'success');
    }

    // ============================================================
    // 2.2 АВТОЗАПОЛНЕНИЕ ПО ШАБЛОНУ УЧЕБНОЙ НЕДЕЛИ
    // ============================================================

    function openTemplateModal() {
        if (!state.isLoaded || !state.calendarData) {
            showStatus('Сначала создайте или загрузите календарь', 'error');
            return;
        }
        document.getElementById('calendarTemplateModal')?.remove();

        const modal = document.createElement('div');
        modal.id = 'calendarTemplateModal';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(4px); z-index: 20000; display: flex; align-items: center; justify-content: center; padding: 20px;';
        modal.innerHTML = `
            <div style="background: white; border-radius: 24px; padding: 28px; max-width: 560px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
                    <h3 style="color: #0f172a; margin: 0; font-size: 1.2rem;">
                        <i class="fas fa-wand-magic-sparkles" style="color: #8b5cf6;"></i> Автозаполнение по шаблону
                    </h3>
                    <button type="button" data-close style="background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8;">&times;</button>
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 6px; font-weight: 600;">Учебная неделя</label>
                    <div style="display: flex; gap: 10px;">
                        <label style="flex: 1; display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 12px; cursor: pointer; font-size: 0.85rem;">
                            <input type="radio" name="tplWeekType" value="5" checked style="width: 16px; height: 16px;"> 5 дней (Пн–Пт)
                        </label>
                        <label style="flex: 1; display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 12px; cursor: pointer; font-size: 0.85rem;">
                            <input type="radio" name="tplWeekType" value="6" style="width: 16px; height: 16px;"> 6 дней (Пн–Сб)
                        </label>
                    </div>
                </div>

                <div style="margin-bottom: 12px;">
                    <label style="display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 4px; font-weight: 600;">Номера меню для нечётных недель</label>
                    <input type="text" id="tplOdd" value="1,2,3,4,5" style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.9rem;">
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 4px; font-weight: 600;">Номера меню для чётных недель</label>
                    <input type="text" id="tplEven" value="1,2,3,4,5" style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.9rem;">
                    <p style="font-size: 0.72rem; color: #94a3b8; margin: 6px 0 0;">Укажите столько номеров, сколько дней в учебной неделе. Номера расставляются по дням недели по порядку.</p>
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; font-size: 0.85rem; color: #334155;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="tplSkipHolidays" checked style="width: 16px; height: 16px;"> Пропускать праздники
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="tplOnlyEmpty" style="width: 16px; height: 16px;"> Заполнять только пустые дни
                    </label>
                </div>

                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" data-close class="btn btn-secondary" style="padding: 10px 20px;">Отмена</button>
                    <button type="button" id="tplApplyBtn" class="btn btn-primary" style="padding: 10px 22px; background: linear-gradient(135deg, #8b5cf6, #7c3aed);">
                        <i class="fas fa-check"></i> Заполнить год
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => modal.remove()));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        modal.querySelector('#tplApplyBtn').addEventListener('click', () => {
            applyTemplateAutofill();
            modal.remove();
        });
    }

    function applyTemplateAutofill() {
        const weekType = parseInt(document.querySelector('input[name="tplWeekType"]:checked')?.value || '5');
        const seqOdd = parseMenuSequence(document.getElementById('tplOdd')?.value);
        const seqEven = parseMenuSequence(document.getElementById('tplEven')?.value);
        const skipHolidays = document.getElementById('tplSkipHolidays')?.checked;
        const onlyEmpty = document.getElementById('tplOnlyEmpty')?.checked;

        if (!seqOdd.length && !seqEven.length) { showStatus('Укажите номера меню для шаблона', 'error'); return; }

        const year = getCalendarYear();
        saveCalendarHistory();
        let filled = 0;

        for (const month of MONTHS) {
            const daysCount = getDaysInMonth(month, year);
            for (let d = 1; d <= daysCount; d++) {
                const date = new Date(year, MONTH_INDEX[month], d);
                const dow = date.getDay();
                if (dow === 0) continue;
                if (weekType === 5 && dow === 6) continue;
                if (skipHolidays && isHoliday(month, d)) continue;

                const seq = getIsoWeek(date) % 2 === 1 ? seqOdd : seqEven;
                if (!seq.length) continue;

                const idx = (dow + 6) % 7;
                const menuNum = seq[idx % seq.length];

                ensureDayEntry(month, d);
                const entry = state.calendarData[month].find(e => e.day === d);
                if (!entry) continue;
                if (onlyEmpty && entry.value !== null && entry.value !== undefined) continue;
                entry.value = menuNum;
                entry.raw = String(menuNum);
                filled++;
            }
        }

        saveToStorage();
        renderCalendar();
        showStatus(`✅ Заполнено ${filled} дней по шаблону`, 'success');
    }

    // ============================================================
    // 2.3 СПИСОК ПРАЗДНИКОВ И СВОИХ НЕРАБОЧИХ ДНЕЙ
    // ============================================================

    function addCustomHoliday(month, day, name) {
        const list = getCustomHolidays().filter(h => !h.disabled);
        if (list.some(h => h.month === month && parseInt(h.day) === day)) return false;
        const raw = getCustomHolidays();
        raw.push({ month, day, name: name || 'Нерабочий день' });
        saveCustomHolidays(raw);
        return true;
    }

    function removeCustomHoliday(month, day) {
        const raw = getCustomHolidays().filter(h => !(h.month === month && parseInt(h.day) === day && !h.disabled));
        saveCustomHolidays(raw);
    }

    function toggleBuiltinHoliday(month, day) {
        const raw = getCustomHolidays();
        const idx = raw.findIndex(h => h.month === month && parseInt(h.day) === day && h.disabled);
        if (idx >= 0) {
            raw.splice(idx, 1);
        } else {
            raw.push({ month, day, disabled: true });
        }
        saveCustomHolidays(raw);
    }

    function openHolidaysModal() {
        renderHolidaysModal();
    }

    function renderHolidaysModal() {
        document.getElementById('calendarHolidaysModal')?.remove();

        const disabledKeys = new Set(getCustomHolidays().filter(h => h.disabled).map(h => `${h.month}_${parseInt(h.day)}`));
        const custom = getCustomHolidays().filter(h => !h.disabled && h.month && h.day);
        const monthOptions = MONTHS.map(m => `<option value="${m}">${m}</option>`).join('');

        const builtinRows = BUILTIN_HOLIDAYS.map(h => {
            const off = disabledKeys.has(`${h.month}_${h.day}`);
            return `
                <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-bottom: 1px solid #f1f5f9;">
                    <span style="flex: 1; font-size: 0.85rem; color: ${off ? '#94a3b8' : '#0f172a'}; ${off ? 'text-decoration: line-through;' : ''}">
                        ${h.day} ${h.month} — ${h.name}
                    </span>
                    <button type="button" data-toggle="${h.month}|${h.day}"
                        style="font-size: 0.72rem; padding: 4px 12px; border-radius: 20px; border: 1px solid ${off ? '#e2e8f0' : '#10b981'}; background: ${off ? 'white' : '#dcfce7'}; color: ${off ? '#64748b' : '#16a34a'}; cursor: pointer;">
                        ${off ? 'Включить' : 'Отключить'}
                    </button>
                </div>
            `;
        }).join('');

        const customRows = custom.length ? custom.map(h => `
            <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-bottom: 1px solid #f1f5f9;">
                <span style="flex: 1; font-size: 0.85rem; color: #0f172a;">${parseInt(h.day)} ${h.month} — ${h.name || 'Нерабочий день'}</span>
                <button type="button" data-remove="${h.month}|${parseInt(h.day)}"
                    style="font-size: 0.72rem; padding: 4px 12px; border-radius: 20px; border: 1px solid #fecaca; background: #fef2f2; color: #dc2626; cursor: pointer;">
                    Удалить
                </button>
            </div>
        `).join('') : `<p style="font-size: 0.82rem; color: #94a3b8; padding: 10px 12px;">Свои нерабочие дни не добавлены.</p>`;

        const modal = document.createElement('div');
        modal.id = 'calendarHolidaysModal';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(4px); z-index: 20000; display: flex; align-items: center; justify-content: center; padding: 20px;';
        modal.innerHTML = `
            <div style="background: white; border-radius: 24px; padding: 28px; max-width: 620px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
                    <h3 style="color: #0f172a; margin: 0; font-size: 1.2rem;">
                        <i class="fas fa-calendar-xmark" style="color: #8b5cf6;"></i> Праздники и нерабочие дни
                    </h3>
                    <button type="button" data-close style="background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8;">&times;</button>
                </div>

                <p style="font-size: 0.82rem; color: #64748b; margin: 0 0 12px;">
                    Встроенный список праздников и выходные определяются автоматически. Отключите ненужные праздники или добавьте свои нерабочие дни.
                </p>

                <h4 style="font-size: 0.9rem; color: #334155; margin: 16px 0 4px;">Встроенные праздники</h4>
                <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; max-height: 240px; overflow-y: auto;">${builtinRows}</div>

                <h4 style="font-size: 0.9rem; color: #334155; margin: 20px 0 4px;">Свои нерабочие дни</h4>
                <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 14px;">${customRows}</div>

                <div style="background: #f8fafc; border-radius: 12px; padding: 14px;">
                    <div style="display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap;">
                        <div>
                            <label style="display: block; font-size: 0.72rem; color: #64748b; margin-bottom: 4px; font-weight: 600;">Месяц</label>
                            <select id="holMonth" style="padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.85rem;">${monthOptions}</select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.72rem; color: #64748b; margin-bottom: 4px; font-weight: 600;">День</label>
                            <input type="number" id="holDay" min="1" max="31" value="1" style="width: 70px; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.85rem;">
                        </div>
                        <div style="flex: 1; min-width: 140px;">
                            <label style="display: block; font-size: 0.72rem; color: #64748b; margin-bottom: 4px; font-weight: 600;">Название</label>
                            <input type="text" id="holName" placeholder="Например: каникулы" style="width: 100%; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.85rem;">
                        </div>
                        <button type="button" id="holAddBtn" class="btn btn-primary" style="padding: 9px 16px; background: linear-gradient(135deg, #8b5cf6, #7c3aed);">
                            <i class="fas fa-plus"></i> Добавить
                        </button>
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; margin-top: 18px;">
                    <button type="button" data-close class="btn btn-secondary" style="padding: 10px 20px;">Закрыть</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => modal.remove()));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        modal.querySelectorAll('[data-toggle]').forEach(btn => {
            btn.addEventListener('click', () => {
                const [m, d] = btn.dataset.toggle.split('|');
                toggleBuiltinHoliday(m, parseInt(d));
                renderHolidaysModal();
                renderCalendar();
            });
        });
        modal.querySelectorAll('[data-remove]').forEach(btn => {
            btn.addEventListener('click', () => {
                const [m, d] = btn.dataset.remove.split('|');
                removeCustomHoliday(m, parseInt(d));
                renderHolidaysModal();
                renderCalendar();
            });
        });
        modal.querySelector('#holAddBtn').addEventListener('click', () => {
            const m = document.getElementById('holMonth').value;
            const d = parseInt(document.getElementById('holDay').value);
            const name = document.getElementById('holName').value.trim();
            if (isNaN(d) || d < 1 || d > 31) { showStatus('Укажите корректный день', 'error'); return; }
            if (addCustomHoliday(m, d, name)) {
                showStatus(`✅ Добавлен нерабочий день: ${d} ${m}`, 'success');
            } else {
                showStatus('Этот день уже отмечен как нерабочий', 'warning');
            }
            renderHolidaysModal();
            renderCalendar();
        });
    }

    // ============================================================
    // 2.4 ПРОВЕРКА КАЛЕНДАРЯ
    // ============================================================

    function validateCalendar() {
        const problems = [];
        if (!state.isLoaded || !state.calendarData) return problems;

        const maxMenu = getAvailableMenuOptions().length;
        const year = getCalendarYear();

        for (const month of MONTHS) {
            const daysCount = getDaysInMonth(month, year);
            const monthData = state.calendarData[month] || [];

            for (let d = 1; d <= daysCount; d++) {
                const entry = monthData.find(e => e.day === d);
                const val = entry ? entry.value : null;
                const hasValue = val !== null && val !== undefined && val !== '';
                const holiday = isHoliday(month, d);
                const weekend = isWeekendDate(month, d, year);

                if (hasValue) {
                    if (maxMenu && val > maxMenu) {
                        problems.push({ month, day: d, severity: 'error', type: 'invalid_menu', message: `Меню #${val} не существует — доступно меню: ${maxMenu}` });
                    }
                    if (holiday) {
                        problems.push({ month, day: d, severity: 'warning', type: 'holiday_filled', message: `Праздник «${getHolidayName(month, d)}» заполнен меню #${val}` });
                    } else if (weekend) {
                        problems.push({ month, day: d, severity: 'warning', type: 'weekend_filled', message: `Выходной заполнен меню #${val}` });
                    }
                }
            }

            // Пропуски: 3 и более рабочих дней подряд без меню
            let run = [];
            const flushRun = () => {
                if (run.length >= 3) {
                    problems.push({
                        month,
                        day: run[0],
                        severity: 'warning',
                        type: 'gap',
                        message: `Пропуск ${run.length} рабочих дней подряд (${run[0]}–${run[run.length - 1]})`
                    });
                }
                run = [];
            };
            for (let d = 1; d <= daysCount; d++) {
                const entry = monthData.find(e => e.day === d);
                const val = entry ? entry.value : null;
                const empty = val === null || val === undefined || val === '';
                if (empty && !isNonWorking(month, d)) {
                    run.push(d);
                } else {
                    flushRun();
                }
            }
            flushRun();
        }

        return problems;
    }

    function openValidationModal() {
        if (!state.isLoaded || !state.calendarData) {
            showStatus('Сначала создайте или загрузите календарь', 'error');
            return;
        }
        const problems = validateCalendar();
        const errorCount = problems.filter(p => p.severity === 'error').length;
        const warningCount = problems.filter(p => p.severity === 'warning').length;

        document.getElementById('calendarValidationModal')?.remove();

        const listHtml = problems.length ? problems.slice(0, 300).map(p => `
            <div style="display: flex; gap: 10px; align-items: flex-start; padding: 8px 12px; border-bottom: 1px solid #f1f5f9;">
                <i class="fas ${p.severity === 'error' ? 'fa-circle-exclamation' : 'fa-triangle-exclamation'}"
                    style="margin-top: 3px; color: ${p.severity === 'error' ? '#dc2626' : '#d97706'};"></i>
                <div style="flex: 1;">
                    <span style="font-size: 0.85rem; color: #0f172a;">${p.month} ${p.day}: ${p.message}</span>
                </div>
                <button type="button" data-goto="${p.month}|${p.day}"
                    style="font-size: 0.72rem; padding: 3px 10px; border-radius: 20px; border: 1px solid #c7d2fe; background: #eef2ff; color: #4f46e5; cursor: pointer; white-space: nowrap;">К дню</button>
            </div>
        `).join('') : '';

        const modal = document.createElement('div');
        modal.id = 'calendarValidationModal';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(4px); z-index: 20000; display: flex; align-items: center; justify-content: center; padding: 20px;';
        modal.innerHTML = `
            <div style="background: white; border-radius: 24px; padding: 28px; max-width: 680px; width: 100%; max-height: 85vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h3 style="color: #0f172a; margin: 0; font-size: 1.2rem;">
                        <i class="fas fa-clipboard-check" style="color: ${problems.length ? '#dc2626' : '#10b981'};"></i> Проверка календаря
                    </h3>
                    <button type="button" data-close style="background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8;">&times;</button>
                </div>
                <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 16px;">
                    ${problems.length === 0
                        ? 'Проблем не найдено — календарь заполнен корректно.'
                        : `Найдено ${problems.length} замечаний: ${errorCount} ошибок, ${warningCount} предупреждений.`}
                </p>
                ${problems.length === 0 ? `
                    <div style="text-align: center; padding: 36px 20px;">
                        <i class="fas fa-check-circle" style="font-size: 48px; color: #10b981;"></i>
                        <p style="margin-top: 14px; color: #16a34a;">Всё в порядке!</p>
                    </div>
                ` : `<div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; max-height: 50vh; overflow-y: auto;">${listHtml}</div>`}
                <div style="display: flex; justify-content: flex-end; margin-top: 18px;">
                    <button type="button" data-close class="btn btn-secondary" style="padding: 10px 20px;">Закрыть</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => modal.remove()));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        modal.querySelectorAll('[data-goto]').forEach(btn => {
            btn.addEventListener('click', () => {
                const [m, d] = btn.dataset.goto.split('|');
                modal.remove();
                openDayModal(m, parseInt(d));
            });
        });
    }

    // ============================================================
    // 2.6 КОПИРОВАНИЕ / ВСТАВКА / ОЧИСТКА ПО ПРАВОМУ КЛИКУ
    // ============================================================

    let dayClipboard = null;

    function removeDayContextMenu() {
        document.getElementById('calendarDayContextMenu')?.remove();
    }

    function getWeekRange(month, day) {
        const year = getCalendarYear();
        const mIdx = MONTH_INDEX[month];
        if (mIdx === undefined) return [];
        const date = new Date(year, mIdx, day);
        const dow = date.getDay();
        const mondayOffset = dow === 0 ? -6 : 1 - dow;
        const monday = new Date(year, mIdx, day + mondayOffset);
        const range = [];
        for (let i = 0; i < 6; i++) {
            const cur = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
            range.push({ month: MONTHS[cur.getMonth()], day: cur.getDate() });
        }
        return range;
    }

    function ctxItem(icon, label, enabled, onClick) {
        const b = document.createElement('button');
        b.type = 'button';
        b.style.cssText = 'display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 12px; border: none; background: none; cursor: pointer; border-radius: 8px; font-size: 0.85rem; color: #0f172a; text-align: left;';
        if (!enabled) { b.style.opacity = '0.4'; b.style.cursor = 'not-allowed'; }
        b.innerHTML = `<i class="fas ${icon}" style="width: 16px; color: #8b5cf6;"></i> ${label}`;
        b.addEventListener('mouseenter', () => { if (enabled) b.style.background = '#f1f5f9'; });
        b.addEventListener('mouseleave', () => { b.style.background = 'none'; });
        if (enabled) b.addEventListener('click', () => { removeDayContextMenu(); onClick(); });
        return b;
    }

    function showDayContextMenu(e, month, day) {
        if (e && e.preventDefault) e.preventDefault();
        removeDayContextMenu();

        const menu = document.createElement('div');
        menu.id = 'calendarDayContextMenu';
        menu.style.cssText = 'position: fixed; z-index: 30000; background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 1px solid #e2e8f0; padding: 6px; min-width: 210px;';

        const entry = state.calendarData?.[month]?.find(x => x.day === day);
        const hasValue = entry && entry.value !== null && entry.value !== undefined;

        menu.appendChild(ctxItem('fa-copy', 'Копировать день', hasValue, () => copyDay(month, day)));
        menu.appendChild(ctxItem('fa-paste', 'Вставить', !!dayClipboard, () => pasteToDay(month, day)));
        menu.appendChild(ctxItem('fa-eraser', 'Очистить день', hasValue, () => clearDayValue(month, day)));

        const divider = document.createElement('div');
        divider.style.cssText = 'height: 1px; background: #f1f5f9; margin: 4px 6px;';
        menu.appendChild(divider);

        menu.appendChild(ctxItem('fa-clone', 'Копировать неделю', true, () => copyWeek(month, day)));
        menu.appendChild(ctxItem('fa-broom', 'Очистить неделю', true, () => clearWeek(month, day)));

        document.body.appendChild(menu);

        const x = Math.min((e?.clientX ?? 20), window.innerWidth - 230);
        const y = Math.min((e?.clientY ?? 20), window.innerHeight - 280);
        menu.style.left = Math.max(8, x) + 'px';
        menu.style.top = Math.max(8, y) + 'px';

        setTimeout(() => {
            document.addEventListener('click', removeDayContextMenu, { once: true });
            document.addEventListener('scroll', removeDayContextMenu, { once: true, capture: true });
        }, 0);
    }

    function copyDay(month, day) {
        const entry = state.calendarData?.[month]?.find(x => x.day === day);
        if (!entry || entry.value === null || entry.value === undefined) {
            showStatus('День пуст — нечего копировать', 'warning');
            return;
        }
        dayClipboard = { kind: 'day', value: entry.value };
        showStatus(`📋 Скопировано: меню #${entry.value} (${month} ${day})`, 'success');
    }

    function copyWeek(month, day) {
        const range = getWeekRange(month, day);
        const values = range.map(r => {
            const entry = state.calendarData?.[r.month]?.find(x => x.day === r.day);
            return entry ? entry.value ?? null : null;
        });
        if (values.every(v => v === null)) {
            showStatus('На этой неделе нет заполненных дней', 'warning');
            return;
        }
        dayClipboard = { kind: 'week', start: range[0] };
        showStatus('📋 Неделя скопирована', 'success');
    }

    function pasteToDay(month, day) {
        if (!dayClipboard) return;
        saveCalendarHistory();
        if (dayClipboard.kind === 'day') {
            ensureDayEntry(month, day);
            const entry = state.calendarData[month].find(x => x.day === day);
            if (entry) { entry.value = dayClipboard.value; entry.raw = String(dayClipboard.value); }
            showStatus(`📋 Вставлено меню #${dayClipboard.value} на ${month} ${day}`, 'success');
        } else if (dayClipboard.kind === 'week') {
            const start = dayClipboard.start;
            const target = getWeekRange(month, day);
            for (const t of target) {
                const src = state.calendarData?.[start.month]?.find(x => x.day === start.day);
                if (!src) continue;
                ensureDayEntry(t.month, t.day);
                const entry = state.calendarData[t.month].find(x => x.day === t.day);
                if (entry) { entry.value = src.value ?? null; entry.raw = src.value ? String(src.value) : ''; }
            }
            // сдвигаем источник на следующую неделю, чтобы можно было вставлять подряд
            const nextStart = new Date(getCalendarYear(), MONTH_INDEX[start.month], start.day + 7);
            dayClipboard.start = { month: MONTHS[nextStart.getMonth()], day: nextStart.getDate() };
            showStatus('📋 Неделя вставлена', 'success');
        }
        saveToStorage();
        renderCalendar();
    }

    function clearDayValue(month, day) {
        saveCalendarHistory();
        const entry = state.calendarData?.[month]?.find(x => x.day === day);
        if (entry) { entry.value = null; entry.raw = ''; }
        delete state.calendarMap[`${month}_${day}`];
        saveToStorage();
        renderCalendar();
        showStatus(`🗑️ Очищен день ${month} ${day}`, 'success');
    }

    function clearWeek(month, day) {
        saveCalendarHistory();
        for (const r of getWeekRange(month, day)) {
            const entry = state.calendarData?.[r.month]?.find(x => x.day === r.day);
            if (entry) { entry.value = null; entry.raw = ''; }
            delete state.calendarMap[`${r.month}_${r.day}`];
        }
        saveToStorage();
        renderCalendar();
        showStatus('🗑️ Неделя очищена', 'success');
    }

    // ============================================================
    // 2.7 ЭКСПОРТ В CSV И PDF
    // ============================================================

    function exportCalendarCsv() {
        if (!state.isLoaded || !state.calendarData) {
            showStatus('Сначала создайте или загрузите календарь', 'error');
            return;
        }
        const year = getCalendarYear();
        const maxDays = 31;
        const sep = ';';
        const lines = [];
        const header = ['Месяц'];
        for (let d = 1; d <= maxDays; d++) header.push(d);
        lines.push(header.join(sep));

        for (const month of MONTHS) {
            const row = [month];
            for (let d = 1; d <= maxDays; d++) {
                const entry = state.calendarData[month]?.find(e => e.day === d);
                row.push(entry && entry.value !== null && entry.value !== undefined ? entry.value : '');
            }
            lines.push(row.join(sep));
        }

        const csv = '\ufeff' + lines.join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `kp${year}.csv`);
        showStatus(`📥 Календарь сохранён как "kp${year}.csv"`, 'success');
    }

    async function exportCalendarPdf() {
        if (!state.isLoaded || !state.calendarData) {
            showStatus('Сначала создайте или загрузите календарь', 'error');
            return;
        }
        if (typeof html2canvas === 'undefined' || !window.jspdf?.jsPDF) {
            showStatus('Не удалось загрузить модуль экспорта в PDF', 'error');
            return;
        }
        showStatus('📄 Формирование PDF...', 'info');
        try {
            const year = getCalendarYear();
            const container = document.getElementById('calendarContainer');
            const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 24;
            const imgW = pageW - margin * 2;
            const imgH = canvas.height * imgW / canvas.width;
            const imgData = canvas.toDataURL('image/png');

            let heightLeft = imgH;
            let position = margin;
            pdf.addImage(imgData, 'PNG', margin, position, imgW, imgH);
            heightLeft -= (pageH - margin * 2);

            while (heightLeft > 0) {
                pdf.addPage();
                position = margin - (imgH - heightLeft);
                pdf.addImage(imgData, 'PNG', margin, position, imgW, imgH);
                heightLeft -= (pageH - margin * 2);
            }

            pdf.save(`kp${year}.pdf`);
            showStatus(`📥 Календарь сохранён как "kp${year}.pdf"`, 'success');
        } catch (error) {
            console.error('Ошибка экспорта в PDF:', error);
            showStatus(`Ошибка PDF: ${error.message}`, 'error');
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

		// Загрузка файла (обновлённая версия)
		document.getElementById('calendarFileInput')?.addEventListener('change', function(e) {
			const file = this.files[0];
			if (!file) return;
			
			const reader = new FileReader();
			reader.onload = function(e) {
				try {
					const data = new Uint8Array(e.target.result);
					const wb = XLSX.read(data, { type: 'array' });
					const result = parseCalendarFromExcel(wb);
					if (result) {
						renderCalendar();
						showStatus(`✅ Календарь загружен из "${file.name}"`, 'success');
					} else {
						showStatus('⚠️ Не удалось прочитать календарь', 'warning');
						generateEmptyCalendar();
						renderCalendar();
					}
				} catch(err) {
					console.error('Ошибка чтения файла:', err);
					showStatus('❌ Ошибка чтения файла', 'error');
					generateEmptyCalendar();
					renderCalendar();
				}
			};
			reader.onerror = function() {
				showStatus('❌ Ошибка при чтении файла', 'error');
				generateEmptyCalendar();
				renderCalendar();
			};
			reader.readAsArrayBuffer(file);
			this.value = '';
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

        // Кнопки расширенных возможностей календаря (2.1–2.8)
        document.getElementById('calendarFillPeriodBtn')?.addEventListener('click', openFillPeriodModal);
        document.getElementById('calendarTemplateBtn')?.addEventListener('click', openTemplateModal);
        document.getElementById('calendarHolidaysBtn')?.addEventListener('click', openHolidaysModal);
        document.getElementById('calendarValidateBtn')?.addEventListener('click', openValidationModal);
        document.getElementById('calendarExportCsvBtn')?.addEventListener('click', exportCalendarCsv);
        document.getElementById('calendarExportPdfBtn')?.addEventListener('click', exportCalendarPdf);

        // Модальное окно - поиск
		document.getElementById('calendarDaySearch')?.addEventListener('input', function() {
			const month = state.selectedCell?.month;
			const day = state.selectedCell?.day;
			if (!month || !day) return;

			const searchTerm = this.value.toLowerCase().trim();
			const allOptions = getAvailableMenuOptions();
			
			// Фильтруем по поисковому запросу
			let filtered = allOptions;
			if (searchTerm) {
				filtered = allOptions.filter(opt => 
					String(opt.menuNumber).includes(searchTerm) ||
					opt.dishes?.some(d => d.toLowerCase().includes(searchTerm)) ||
					opt.mealNames?.some(m => m.toLowerCase().includes(searchTerm)) ||
					(opt.preview && opt.preview.toLowerCase().includes(searchTerm))
				);
			}

			// Получаем текущее значение
			const monthData = state.calendarData[month] || [];
			const entry = monthData.find(e => e.day === day);
			const currentValue = entry?.value || null;

			// Рендерим отфильтрованный список
			const listContainer = document.getElementById('calendarDayList');
			if (!listContainer) return;

			if (filtered.length === 0) {
				listContainer.innerHTML = `
					<div style="text-align: center; padding: 40px 20px; color: #94a3b8; grid-column: 1 / -1;">
						<i class="fas fa-search" style="font-size: 2rem; margin-bottom: 8px; display: block;"></i>
						<p>Ничего не найдено</p>
						<p style="font-size: 0.8rem; color: #cbd5e1;">Попробуйте изменить поисковый запрос</p>
					</div>
				`;
				return;
			}

			let html = '';

			// Опция "Выходной" (всегда показываем)
			html += `
				<div style="padding: 12px; border: 2px solid #f59e0b; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: #fef3c7; text-align: center;"
					 onclick="CalendarModule.setDayValue('${month}', ${day}, null)"
					 onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 4px 12px rgba(245,158,11,0.3)';"
					 onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
					<div style="font-size: 1.2rem;">🏖️</div>
					<div style="font-weight: 600; color: #d97706;">Выходной</div>
					<div style="font-size: 0.7rem; color: #92400e;">Очистить ячейку</div>
				</div>
			`;

			// Варианты меню (отфильтрованные)
			for (const option of filtered) {
				const isCurrent = currentValue === option.menuNumber;
				const color = window.DailyMenuModule?.getMenuColor?.(option.menuNumber) || { primary: '#10b981', light: '#dcfce7' };
				
				html += `
					<div style="padding: 12px; border: 2px solid ${isCurrent ? '#10b981' : '#e2e8f0'}; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: ${isCurrent ? '#dcfce7' : 'white'};"
						 onclick="CalendarModule.setDayValue('${month}', ${day}, ${option.menuNumber})"
						 onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)';"
						 onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
						<div style="display: flex; justify-content: space-between; align-items: center;">
							<span style="font-weight: 700; color: ${isCurrent ? '#16a34a' : '#0f172a'};">
								<span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${color.primary}; margin-right: 8px;"></span>
								Меню #${option.menuNumber}
								${isCurrent ? '<span style="font-size: 0.6rem; background: #10b981; color: white; padding: 1px 8px; border-radius: 10px; margin-left: 8px;">✓</span>' : ''}
							</span>
							<span style="font-size: 0.65rem; color: #64748b;">
								${option.week ? `Неделя ${option.week}` : ''} ${option.day ? `День ${option.day}` : ''}
							</span>
						</div>
						<div style="font-size: 0.7rem; color: #64748b; margin-top: 4px;">
							${option.mealNames?.join(' · ') || ''} 
							${option.dishCount ? `· ${option.dishCount} блюд` : ''}
						</div>
						${option.preview ? `
							<div style="font-size: 0.6rem; color: #94a3b8; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
								${option.preview}
							</div>
						` : ''}
					</div>
				`;
			}

			listContainer.innerHTML = html;
		});

		// Модальное окно - фильтры (ОБНОВЛЁННЫЙ)
		document.querySelectorAll('.calendar-filter-btn').forEach(btn => {
			btn.addEventListener('click', function() {
				// Обновляем активный класс
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
				if (!month || !day) return;

				const filter = this.dataset.filter;
				const allOptions = getAvailableMenuOptions();
				
				// Фильтруем по типу приёма пищи
				let filtered = allOptions;
				if (filter === 'breakfast') {
					filtered = allOptions.filter(opt => opt.mealNames?.some(m => m.includes('Завтрак')));
				} else if (filter === 'lunch') {
					filtered = allOptions.filter(opt => opt.mealNames?.some(m => m.includes('Обед')));
				} else if (filter === 'dinner') {
					filtered = allOptions.filter(opt => opt.mealNames?.some(m => m.includes('Ужин')));
				} else if (filter === 'weekend') {
					// Показываем только опцию "Выходной"
					filtered = [];
				}
				// 'all' — показываем всё

				// Получаем текущее значение
				const monthData = state.calendarData[month] || [];
				const entry = monthData.find(e => e.day === day);
				const currentValue = entry?.value || null;

				// Рендерим отфильтрованный список
				const listContainer = document.getElementById('calendarDayList');
				if (!listContainer) return;

				let html = '';

				// Опция "Выходной" (всегда показываем)
				html += `
					<div style="padding: 12px; border: 2px solid #f59e0b; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: #fef3c7; text-align: center;"
						 onclick="CalendarModule.setDayValue('${month}', ${day}, null)"
						 onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 4px 12px rgba(245,158,11,0.3)';"
						 onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
						<div style="font-size: 1.2rem;">🏖️</div>
						<div style="font-weight: 600; color: #d97706;">Выходной</div>
						<div style="font-size: 0.7rem; color: #92400e;">Очистить ячейку</div>
					</div>
				`;

				// Если фильтр "Выходной" — показываем только его
				if (filter === 'weekend') {
					listContainer.innerHTML = html;
					return;
				}

				// Варианты меню
				for (const option of filtered) {
					const isCurrent = currentValue === option.menuNumber;
					const color = window.DailyMenuModule?.getMenuColor?.(option.menuNumber) || { primary: '#10b981', light: '#dcfce7' };
					
					html += `
						<div style="padding: 12px; border: 2px solid ${isCurrent ? '#10b981' : '#e2e8f0'}; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: ${isCurrent ? '#dcfce7' : 'white'};"
							 onclick="CalendarModule.setDayValue('${month}', ${day}, ${option.menuNumber})"
							 onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)';"
							 onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
							<div style="display: flex; justify-content: space-between; align-items: center;">
								<span style="font-weight: 700; color: ${isCurrent ? '#16a34a' : '#0f172a'};">
									<span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${color.primary}; margin-right: 8px;"></span>
									Меню #${option.menuNumber}
									${isCurrent ? '<span style="font-size: 0.6rem; background: #10b981; color: white; padding: 1px 8px; border-radius: 10px; margin-left: 8px;">✓</span>' : ''}
								</span>
								<span style="font-size: 0.65rem; color: #64748b;">
									${option.week ? `Неделя ${option.week}` : ''} ${option.day ? `День ${option.day}` : ''}
								</span>
							</div>
							<div style="font-size: 0.7rem; color: #64748b; margin-top: 4px;">
								${option.mealNames?.join(' · ') || ''} 
								${option.dishCount ? `· ${option.dishCount} блюд` : ''}
							</div>
							${option.preview ? `
								<div style="font-size: 0.6rem; color: #94a3b8; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
									${option.preview}
								</div>
							` : ''}
						</div>
					`;
				}

				listContainer.innerHTML = html;
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
				if (confirm(`Очистить день ${month} ${day}?`)) {
					setDayValue(month, day, null);
					document.getElementById('calendarDayModal').style.display = 'none';
				}
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
		openDayPicker: openDayPicker,
		closeDayPicker: closeDayPicker,
		setDayValue: setDayValue,
		getState: function() { return state; },
		exportCalendar: exportCalendarToExcel,
		loadFromStorage: loadFromStorage,
		saveToStorage: saveToStorage,
		generateEmpty: generateEmptyCalendar,
		parseExcel: parseCalendarFromExcel,
		getAvailableMenuOptions: getAvailableMenuOptions,

		// ===== 2.1–2.8 РАСШИРЕННЫЕ ВОЗМОЖНОСТИ КАЛЕНДАРЯ =====
		openFillPeriod: openFillPeriodModal,
		openTemplate: openTemplateModal,
		openHolidays: openHolidaysModal,
		openValidation: openValidationModal,
		showDayContextMenu: showDayContextMenu,
		exportCsv: exportCalendarCsv,
		exportPdf: exportCalendarPdf,
		getMenuNumberColor: getMenuNumberColor,

		// ===== НОВАЯ ФУНКЦИЯ =====
		// ============================================================
		// openInDailyMenu — ОТКРЫТИЕ В ЕЖЕДНЕВНОМ МЕНЮ (С ДАТОЙ)
		// ============================================================

		openInDailyMenu: function(month, day, menuNumber) {
			if (!menuNumber) {
				showStatus('⚠️ Для этого дня не назначено меню', 'warning');
				return;
			}
			
			console.log(`📅 Открытие меню #${menuNumber} для ${month} ${day} в ежедневном меню...`);
			
			// 1. Закрываем модалку календаря
			const modal = document.getElementById('calendarDayModal');
			if (modal) modal.style.display = 'none';
			
			// 2. Переключаемся на вкладку ежедневного меню
			const dailyTab = document.querySelector('.tab-btn[data-tab="daily"]');
			if (dailyTab) {
				dailyTab.click();
			}
			
			// 3. Ждём переключения вкладки
			setTimeout(() => {
				// 4. Проверяем, загружен ли модуль
				if (!window.DailyMenuModule) {
					console.error('❌ DailyMenuModule не загружен!');
					showStatus('⚠️ Модуль ежедневного меню не загружен', 'error');
					return;
				}
				
				const module = window.DailyMenuModule;
				const state = module.getState();
				
				// 5. Обновляем данные в модуле
				if (state) {
					state.templateMenuData = window.currentTemplateData || window.templateMenuData;
					state.schoolInfo = window.schoolInfo || null;
					state.selectedMenuNumber = menuNumber;
				}
				
				// 6. Загружаем меню
				if (module.loadDailyMenu) {
					module.loadDailyMenu(menuNumber);
				}
				
				// 7. Обновляем селектор
				if (module.updateMenuSelectorUI) {
					module.updateMenuSelectorUI();
				}
				
				// 8. ✅ УСТАНАВЛИВАЕМ ДАТУ (БЕЗ ПРОБЛЕМ С ЧАСОВЫМ ПОЯСОМ)
				const dateInput = document.getElementById('dailyMenuDate');
				if (dateInput) {
					// Берём год из календаря
					let year = 2026;
					if (state && state.calendarMeta && state.calendarMeta.year) {
						year = parseInt(state.calendarMeta.year);
					} else if (this.getState && this.getState().calendarMeta) {
						year = parseInt(this.getState().calendarMeta.year);
					} else if (window.CalendarModule && window.CalendarModule.getState) {
						const calState = window.CalendarModule.getState();
						if (calState && calState.calendarMeta && calState.calendarMeta.year) {
							year = parseInt(calState.calendarMeta.year);
						}
					}
					
					// Карта месяцев
					const monthMap = {
						'январь': 0, 'февраль': 1, 'март': 2, 'апрель': 3,
						'май': 4, 'июнь': 5, 'июль': 6, 'август': 7,
						'сентябрь': 8, 'октябрь': 9, 'ноябрь': 10, 'декабрь': 11
					};
					
					const monthIndex = monthMap[month];
					if (monthIndex !== undefined) {
						// ✅ ПРАВИЛЬНОЕ ФОРМИРОВАНИЕ ДАТЫ БЕЗ UTC СМЕЩЕНИЯ
						const yearStr = String(year);
						const monthStr = String(monthIndex + 1).padStart(2, '0');
						const dayStr = String(day).padStart(2, '0');
						const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
						
						dateInput.value = dateStr;
						// Триггерим событие изменения
						dateInput.dispatchEvent(new Event('change', { bubbles: true }));
						console.log(`✅ Дата установлена: ${dateStr} (${month} ${day}, ${year})`);
					} else {
						console.warn(`⚠️ Неизвестный месяц: ${month}`);
					}
				}
				
				// 9. Обновляем имя файла
				const variantNameInput = document.getElementById('variantNameInput');
				if (variantNameInput && dateInput && dateInput.value) {
					const dateStr = dateInput.value;
					variantNameInput.value = `${dateStr}-sm.xlsx`;
				}
				
				// 10. Обновляем статусную строку
				if (module.updateStatusBarMenu) {
					module.updateStatusBarMenu();
				}
				
				// 11. Обновляем предпросмотр
				if (module.renderDailyPreview) {
					module.renderDailyPreview();
				}
				
				showStatus(`📅 Открыто меню #${menuNumber} для ${month} ${day}`, 'success');
				
			}, 500);
		}
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
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

		// ===== ЧИТАЕМ С raw: true, чтобы получить сырые данные (включая формулы) =====
		const data = XLSX.utils.sheet_to_json(sheet, { 
			header: 1, 
			defval: '',
			raw: true  // <-- ВАЖНО: читаем сырые данные
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

		// ===== 2. НАХОДИМ СТРОКУ С МЕСЯЦАМИ =====
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
				dataStartIndex = i + 2;
				break;
			}
		}

		if (monthRowIndex === -1) {
			const monthNames = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 
								'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
			for (let i = 0; i < Math.min(data.length, 20); i++) {
				const row = data[i];
				if (!row || !row[0]) continue;
				const firstCell = String(row[0]).trim().toLowerCase();
				if (monthNames.includes(firstCell)) {
					monthRowIndex = i - 1;
					if (monthRowIndex >= 0) {
						dayRowIndex = i;
						dataStartIndex = i + 1;
					}
					break;
				}
			}
		}

		if (monthRowIndex === -1 || dayRowIndex === -1) {
			console.error('❌ Не найдена структура календаря');
			return null;
		}

		// ===== 3. ЧИТАЕМ ДНИ (С ПОДДЕРЖКОЙ ФОРМУЛ) =====
		const dayRow = data[dayRowIndex] || [];
		const days = [];
		
		// Первое значение всегда 1 (или B3)
		// Дальше идём по ячейкам и извлекаем числа из формул
		for (let i = 1; i < dayRow.length; i++) {
			const val = dayRow[i];
			let numVal = null;
			
			if (typeof val === 'number') {
				// Если это число —直接用
				numVal = val;
			} else if (typeof val === 'string') {
				// Если это строка — пробуем извлечь число
				const trimmed = val.trim();
				
				// Пробуем распарсить как число
				const num = parseFloat(trimmed);
				if (!isNaN(num)) {
					numVal = num;
				} else {
					// Если не число, пробуем извлечь из формулы (например, "=B3+1")
					const match = trimmed.match(/(\d+)/);
					if (match) {
						numVal = parseInt(match[1]);
					}
				}
			} else if (val && typeof val === 'object' && val.t) {
				// Если это объект ExcelJS (формула)
				// Пробуем получить вычисленное значение
				if (val.v !== undefined && typeof val.v === 'number') {
					numVal = val.v;
				} else if (val.f) {
					// Пробуем извлечь число из формулы
					const match = val.f.match(/(\d+)/);
					if (match) {
						numVal = parseInt(match[1]);
					}
				}
			}
			
			// Если нашли число от 1 до 31 — добавляем
			if (numVal !== null && numVal > 0 && numVal <= 31) {
				days.push(numVal);
			} else {
				// Если не нашли число, но это день — пытаемся определить по порядку
				// Проверяем, есть ли дальше числа
				let hasMoreNumbers = false;
				for (let j = i + 1; j < Math.min(i + 5, dayRow.length); j++) {
					const nextVal = dayRow[j];
					let nextNum = null;
					if (typeof nextVal === 'number') nextNum = nextVal;
					else if (typeof nextVal === 'string') {
						const m = nextVal.match(/(\d+)/);
						if (m) nextNum = parseInt(m[1]);
					}
					if (nextNum !== null && nextNum > 0 && nextNum <= 31) {
						hasMoreNumbers = true;
						break;
					}
				}
				
				if (hasMoreNumbers) {
					// Если дальше есть числа — значит это пропущенный день
					// Определяем по предыдущему значению
					const lastDay = days[days.length - 1] || 0;
					days.push(lastDay + 1);
				} else {
					// Если дальше нет чисел — это конец строки
					break;
				}
			}
		}
		
		// Проверяем, что все дни идут по порядку (1, 2, 3, ...)
		// Если где-то пропуск — восстанавливаем
		const finalDays = [];
		let expectedDay = 1;
		for (const d of days) {
			if (d === expectedDay) {
				finalDays.push(d);
				expectedDay++;
			} else if (d > expectedDay) {
				// Пропущены дни — добавляем их
				while (expectedDay < d) {
					finalDays.push(expectedDay);
					expectedDay++;
				}
				finalDays.push(d);
				expectedDay++;
			}
		}
		
		// Если дней меньше 31 — добавляем недостающие
		while (finalDays.length < 31) {
			finalDays.push(finalDays.length + 1);
		}
		
		// Если дней больше 31 — обрезаем
		const maxDays = Math.min(finalDays.length, 31);
		const resultDays = finalDays.slice(0, maxDays);
		
		console.log(`📅 Найдено дней: ${resultDays.length} (с 1 по ${resultDays[resultDays.length - 1] || '?'})`);

		// ===== 4. ЧИТАЕМ ДАННЫЕ ПО МЕСЯЦАМ =====
		const calendarData = {};
		const monthList = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 
						   'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

		for (let i = dataStartIndex; i < data.length; i++) {
			const row = data[i];
			if (!row || !row[0]) continue;

			const monthName = String(row[0]).trim().toLowerCase();
			if (!monthName || !monthList.includes(monthName)) continue;

			const monthData = [];

			for (let j = 0; j < resultDays.length; j++) {
				const day = resultDays[j];
				const colIdx = j + 1;
				
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
				
				if (day !== null && !isNaN(numVal) && numVal > 0 && numVal <= 20) {
					monthData.push({
						day: day,
						value: numVal,
						raw: val
					});
				} else if (day !== null) {
					monthData.push({
						day: day,
						value: null,
						raw: ''
					});
				}
			}

			calendarData[monthName] = monthData;
			console.log(`📊 ${monthName}: ${monthData.length} записей, из них с меню: ${monthData.filter(d => d.value !== null).length}`);
		}

		// Добавляем пропущенные месяцы
		for (const month of monthList) {
			if (!calendarData[month]) {
				const monthData = [];
				for (let d = 1; d <= 31; d++) {
					monthData.push({
						day: d,
						value: null,
						raw: ''
					});
				}
				calendarData[month] = monthData;
				console.log(`⚠️ Добавлен пустой месяц: ${month}`);
			}
		}

		// ===== 5. ФОРМИРУЕМ РЕЗУЛЬТАТ =====
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
	function parseCalendarFromExcel(workbook) {
		const sheet = workbook.Sheets[workbook.SheetNames[0]];
		if (!sheet) return null;

		// ===== ЧИТАЕМ С raw: true, чтобы получить сырые данные (включая формулы) =====
		const data = XLSX.utils.sheet_to_json(sheet, { 
			header: 1, 
			defval: '',
			raw: true  // <-- ВАЖНО: читаем сырые данные
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

		// ===== 2. НАХОДИМ СТРОКУ С МЕСЯЦАМИ =====
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
				dataStartIndex = i + 2;
				break;
			}
		}

		if (monthRowIndex === -1) {
			const monthNames = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 
								'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
			for (let i = 0; i < Math.min(data.length, 20); i++) {
				const row = data[i];
				if (!row || !row[0]) continue;
				const firstCell = String(row[0]).trim().toLowerCase();
				if (monthNames.includes(firstCell)) {
					monthRowIndex = i - 1;
					if (monthRowIndex >= 0) {
						dayRowIndex = i;
						dataStartIndex = i + 1;
					}
					break;
				}
			}
		}

		if (monthRowIndex === -1 || dayRowIndex === -1) {
			console.error('❌ Не найдена структура календаря');
			return null;
		}

		// ===== 3. ЧИТАЕМ ДНИ (С ПОДДЕРЖКОЙ ФОРМУЛ) =====
		const dayRow = data[dayRowIndex] || [];
		const days = [];
		
		// Первое значение всегда 1 (или B3)
		// Дальше идём по ячейкам и извлекаем числа из формул
		for (let i = 1; i < dayRow.length; i++) {
			const val = dayRow[i];
			let numVal = null;
			
			if (typeof val === 'number') {
				// Если это число —直接用
				numVal = val;
			} else if (typeof val === 'string') {
				// Если это строка — пробуем извлечь число
				const trimmed = val.trim();
				
				// Пробуем распарсить как число
				const num = parseFloat(trimmed);
				if (!isNaN(num)) {
					numVal = num;
				} else {
					// Если не число, пробуем извлечь из формулы (например, "=B3+1")
					const match = trimmed.match(/(\d+)/);
					if (match) {
						numVal = parseInt(match[1]);
					}
				}
			} else if (val && typeof val === 'object' && val.t) {
				// Если это объект ExcelJS (формула)
				// Пробуем получить вычисленное значение
				if (val.v !== undefined && typeof val.v === 'number') {
					numVal = val.v;
				} else if (val.f) {
					// Пробуем извлечь число из формулы
					const match = val.f.match(/(\d+)/);
					if (match) {
						numVal = parseInt(match[1]);
					}
				}
			}
			
			// Если нашли число от 1 до 31 — добавляем
			if (numVal !== null && numVal > 0 && numVal <= 31) {
				days.push(numVal);
			} else {
				// Если не нашли число, но это день — пытаемся определить по порядку
				// Проверяем, есть ли дальше числа
				let hasMoreNumbers = false;
				for (let j = i + 1; j < Math.min(i + 5, dayRow.length); j++) {
					const nextVal = dayRow[j];
					let nextNum = null;
					if (typeof nextVal === 'number') nextNum = nextVal;
					else if (typeof nextVal === 'string') {
						const m = nextVal.match(/(\d+)/);
						if (m) nextNum = parseInt(m[1]);
					}
					if (nextNum !== null && nextNum > 0 && nextNum <= 31) {
						hasMoreNumbers = true;
						break;
					}
				}
				
				if (hasMoreNumbers) {
					// Если дальше есть числа — значит это пропущенный день
					// Определяем по предыдущему значению
					const lastDay = days[days.length - 1] || 0;
					days.push(lastDay + 1);
				} else {
					// Если дальше нет чисел — это конец строки
					break;
				}
			}
		}
		
		// Проверяем, что все дни идут по порядку (1, 2, 3, ...)
		// Если где-то пропуск — восстанавливаем
		const finalDays = [];
		let expectedDay = 1;
		for (const d of days) {
			if (d === expectedDay) {
				finalDays.push(d);
				expectedDay++;
			} else if (d > expectedDay) {
				// Пропущены дни — добавляем их
				while (expectedDay < d) {
					finalDays.push(expectedDay);
					expectedDay++;
				}
				finalDays.push(d);
				expectedDay++;
			}
		}
		
		// Если дней меньше 31 — добавляем недостающие
		while (finalDays.length < 31) {
			finalDays.push(finalDays.length + 1);
		}
		
		// Если дней больше 31 — обрезаем
		const maxDays = Math.min(finalDays.length, 31);
		const resultDays = finalDays.slice(0, maxDays);
		
		console.log(`📅 Найдено дней: ${resultDays.length} (с 1 по ${resultDays[resultDays.length - 1] || '?'})`);

		// ===== 4. ЧИТАЕМ ДАННЫЕ ПО МЕСЯЦАМ =====
		const calendarData = {};
		const monthList = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 
						   'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

		for (let i = dataStartIndex; i < data.length; i++) {
			const row = data[i];
			if (!row || !row[0]) continue;

			const monthName = String(row[0]).trim().toLowerCase();
			if (!monthName || !monthList.includes(monthName)) continue;

			const monthData = [];

			for (let j = 0; j < resultDays.length; j++) {
				const day = resultDays[j];
				const colIdx = j + 1;
				
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
				
				if (day !== null && !isNaN(numVal) && numVal > 0 && numVal <= 20) {
					monthData.push({
						day: day,
						value: numVal,
						raw: val
					});
				} else if (day !== null) {
					monthData.push({
						day: day,
						value: null,
						raw: ''
					});
				}
			}

			calendarData[monthName] = monthData;
			console.log(`📊 ${monthName}: ${monthData.length} записей, из них с меню: ${monthData.filter(d => d.value !== null).length}`);
		}

		// Добавляем пропущенные месяцы
		for (const month of monthList) {
			if (!calendarData[month]) {
				const monthData = [];
				for (let d = 1; d <= 31; d++) {
					monthData.push({
						day: d,
						value: null,
						raw: ''
					});
				}
				calendarData[month] = monthData;
				console.log(`⚠️ Добавлен пустой месяц: ${month}`);
			}
		}

		// ===== 5. ФОРМИРУЕМ РЕЗУЛЬТАТ =====
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
			worksheet.getCell('AD1').value = 'Год';
			worksheet.getCell('AD1').font = { bold: true };
			worksheet.getCell('AD1').alignment = { horizontal: 'right', vertical: 'middle' };
			
			worksheet.getCell('AE1').value = year;
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

			// ===== ЛЕГЕНДА =====
			const legendStartRow = dataStartRow + monthNames.length + 2;
			
			worksheet.mergeCells(`A${legendStartRow}:C${legendStartRow}`);
			worksheet.getCell(`A${legendStartRow}`).value = '📌 Легенда:';
			worksheet.getCell(`A${legendStartRow}`).font = { bold: true };
			
			const legendData = [
				{ color: colors.NEW_YEAR, label: 'Новогодние каникулы' },
				{ color: colors.WITH_MEAL, label: 'Будни с питанием' },
				{ color: colors.WEEKDAY_NO_MEAL, label: 'Будни без питания' },
				{ color: colors.WEEKEND, label: 'Выходные дни' },
				{ color: colors.EMPTY, label: 'Нет данных' }
			];
			
			for (let i = 0; i < legendData.length; i++) {
				const row = legendStartRow + 1 + i;
				const item = legendData[i];
				
				const colorCell = worksheet.getCell(row, 1);
				colorCell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: item.color }
				};
				colorCell.border = {
					top: { style: 'thin', color: { argb: 'FFD4D4D4' } },
					left: { style: 'thin', color: { argb: 'FFD4D4D4' } },
					bottom: { style: 'thin', color: { argb: 'FFD4D4D4' } },
					right: { style: 'thin', color: { argb: 'FFD4D4D4' } }
				};
				colorCell.alignment = { horizontal: 'center', vertical: 'middle' };
				
				const labelCell = worksheet.getCell(row, 2);
				labelCell.value = item.label;
				labelCell.alignment = { horizontal: 'left', vertical: 'middle' };
			}



			// ===== СОХРАНЯЕМ =====
			const buffer = await workbook.xlsx.writeBuffer();
			const blob = new Blob([buffer], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			});

			const fileName = `Календарь_питания_${year}.xlsx`;
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
        setDayValue: setDayValue,
        getState: function() { return state; },
        exportCalendar: exportCalendarToExcel,
        loadFromStorage: loadFromStorage,
        saveToStorage: saveToStorage,
        generateEmpty: generateEmptyCalendar,
        parseExcel: parseCalendarFromExcel,
		getAvailableMenuOptions: getAvailableMenuOptions  // <-- ЭТОЙ СТРОКИ НЕ ХВАТАЕТ
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
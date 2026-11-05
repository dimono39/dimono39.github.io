/**
 * ============================================================
 * МОДУЛЬ "ГЕНЕРАТОР ЕЖЕДНЕВНЫХ МЕНЮ (ФЦМПО)" v1.1 (Упрощенный)
 * ============================================================
 */

const GeneratorModule = (function () {
    'use strict';

    const STORAGE_KEY = 'schoolMenuGeneratorData_v3_fcmpo';

    const GEN_REQUIRED_FILES = {
        calendar: 'kp2026.xlsx',
        template: 'tm2026-sm.xlsx'
    };

    const GEN_MEAL_STRUCTURE = {
        'breakfast': { name: 'Завтрак', sections: ['гор.блюдо', 'гор.напиток', 'хлеб', 'фрукты'] },
        'breakfast2': { name: 'Завтрак 2', sections: ['фрукты'] },
        'lunch': { name: 'Обед', sections: ['закуска', '1 блюдо', '2 блюдо', 'гарнир', 'напиток', 'хлеб бел.', 'хлеб черн.'] },
        'afternoonSnack': { name: 'Полдник', sections: ['булочное', 'напиток'] },
        'dinner': { name: 'Ужин', sections: ['гор.блюдо', 'гарнир', 'напиток', 'хлеб'] },
        'dinner2': { name: 'Ужин 2', sections: ['кисломол.', 'булочное', 'напиток', 'фрукты'] }
    };

    const GEN_MEAL_TYPES = {
        'breakfast': 'Завтрак', 'breakfast2': 'Завтрак 2', 'lunch': 'Обед',
        'afternoonSnack': 'Полдник', 'dinner': 'Ужин', 'dinner2': 'Ужин 2'
    };

    const GEN_MONTH_NAMES = [
        'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
        'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
    ];

    let state = {
        calendarData: null,
        templateMenuData: null,
        dailyMenus: [],
        uploadedFiles: [],
        currentMenuIndex: 0,
        currentYear: 2026,
        isGridView: true,
        isMenuGridView: false,
        currentMealFilter: 'all',
        isInitialized: false,
        elements: {}
    };

    // ============================================================
    // УТИЛИТЫ
    // ============================================================

    function GEN_formatFileSize(bytes) {
        if (bytes === 0) return '0 Б';
        const k = 1024;
        const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function GEN_formatDate(date, format = 'display') {
        if (!date) return '';
        if (typeof date === 'string') date = new Date(date);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        if (format === 'file') return `${year}-${month}-${day}`;
        if (format === 'excel') return `${day}.${month}.${year}`;
        if (format === 'short') return `${day}.${month}.${year}`;
        const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        return `${day} ${monthNames[date.getMonth()]} ${year} г.`;
    }

    function GEN_showStatus(message, type = 'info') {
        if (typeof window.showStatus === 'function') {
            window.showStatus(message, type);
            return;
        }
        const el = document.getElementById('genStatusMessage');
        if (el) {
            el.textContent = message;
            el.className = `gen-status-message gen-status-${type}`;
            el.style.display = 'block';
            clearTimeout(el._timeout);
            if (type === 'success') {
                el._timeout = setTimeout(() => { el.style.display = 'none'; }, 5000);
            }
        }
    }

    function GEN_hexToArgb(hexColor) {
        if (!hexColor) return 'FFFFFFFF';
        let hex = hexColor.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        return 'FF' + hex.toUpperCase();
    }

    function GEN_normalizeSectionName(section) {
        if (!section) return '';
        const s = section.toLowerCase().trim();
        if (s.includes('фрукт') || s === 'фрукты') return 'фрукты';
        const map = {
            'горячее блюдо': 'гор.блюдо', 'горячий напиток': 'гор.напиток',
            'первое блюдо': '1 блюдо', 'второе блюдо': '2 блюдо',
            'хлеб белый': 'хлеб бел.', 'хлеб черный': 'хлеб черн.',
            'хлеб ржаной': 'хлеб черн.', 'булочные изделия': 'булочное',
            'кисломолочный напиток': 'кисломол.', 'кисломолочные продукты': 'кисломол.',
            'свежие фрукты': 'фрукты', 'фрукт свежий': 'фрукты', 'фрукт': 'фрукты',
            'овощи': 'закуска', 'салат': 'закуска'
        };
        if (map[s]) return map[s];
        for (const [k, v] of Object.entries(map)) { if (s.includes(k)) return v; }
        return s;
    }

    function GEN_sortMealItemsByStructure(items, mealType) {
        if (!items || items.length === 0) return [];
        const structure = GEN_MEAL_STRUCTURE[mealType];
        if (!structure) return items;
        const normalized = items.map(i => ({ ...i, normalizedSection: GEN_normalizeSectionName(i.section || '') }));
        const sorted = [];
        for (const sec of structure.sections) {
            sorted.push(...normalized.filter(i => i.normalizedSection === sec));
        }
        sorted.push(...normalized.filter(i => !structure.sections.includes(i.normalizedSection)));
        return sorted;
    }

    function GEN_adjustColor(color, amount) {
        let usePound = false;
        if (color[0] === '#') { color = color.slice(1); usePound = true; }
        const num = parseInt(color, 16);
        let r = (num >> 16) + amount; if (r > 255) r = 255; else if (r < 0) r = 0;
        let b = ((num >> 8) & 0x00FF) + amount; if (b > 255) b = 255; else if (b < 0) b = 0;
        let g = (num & 0x0000FF) + amount; if (g > 255) g = 255; else if (g < 0) g = 0;
        return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
    }

    function GEN_getMealIcon(m) {
        return { breakfast: 'fa-sun', breakfast2: 'fa-coffee', lunch: 'fa-utensils', afternoonSnack: 'fa-cookie-bite', dinner: 'fa-moon', dinner2: 'fa-glass-whiskey' }[m] || 'fa-utensils';
    }

    function GEN_getMealColor(m) {
        return { breakfast: '#f39c12', breakfast2: '#e67e22', lunch: '#e74c3c', afternoonSnack: '#2ecc71', dinner: '#9b59b6', dinner2: '#3498db' }[m] || '#3498db';
    }

    function GEN_getMealTypeFromName(name) {
        return { 'Завтрак': 'breakfast', 'Завтрак 2': 'breakfast2', 'Обед': 'lunch', 'Полдник': 'afternoonSnack', 'Ужин': 'dinner', 'Ужин 2': 'dinner2' }[name] || null;
    }

    function GEN_getColorScheme(scheme) {
        const s = {
            default: { school: 'cfe2f3', header: 'e0e0e0', breakfast: 'fff2cc', breakfast2: 'ffe699', lunch: 'd9d2e9', afternoonSnack: 'd0e0e3', dinner: 'f4cccc', dinner2: 'e6ccff' },
            bright: { school: 'd5e8f7', header: 'f0f0f0', breakfast: 'fff9cc', breakfast2: 'ffe6cc', lunch: 'e6d9f2', afternoonSnack: 'd0e8e3', dinner: 'ffcccc', dinner2: 'f2ccff' },
            pastel: { school: 'e8f2fb', header: 'f8f8f8', breakfast: 'fffde6', breakfast2: 'fff2e6', lunch: 'f2e6fa', afternoonSnack: 'e6f5f2', dinner: 'ffe6e6', dinner2: 'f7e6ff' }
        };
        return s[scheme] || s.default;
    }

    function GEN_formatDateForInput(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ ЭЛЕМЕНТОВ
    // ============================================================

    function cacheElements() {
        const ids = [
            'genStatusMessage', 'genFileInput', 'genDropArea', 'genFileList',
            'genGenerateBtn', 'genExportAllBtn', 'genExportCurrentBtn', 'genExportContainer',
            'genStoredDataInfo', 'genStoredDataText', 'genLoadFromStorageBtn', 'genClearStorageBtn',
            'genStartDate', 'genEndDate', 'genCalendarYearBadge', 'genToggleAdvanced',
            'genSchoolName', 'genAgeCategory', 'genColorScheme',
            'genMenuNavigation', 'genMenuCounter', 'genCurrentMenuDate', 'genPrevMenuBtn', 'genNextMenuBtn',
            'genToggleViewBtn', 'genMenuGrid', 'genDetailedView', 'genDetailMenuDate', 'genCloseDetailView',
            'genMealOptions', 'genDetailMeals', 'genExcelPreview', 'genToggleMenuView'
        ];
        
        state.elements = {};
        ids.forEach(id => {
            state.elements[id.replace('gen', '').charAt(0).toLowerCase() + id.replace('gen', '').slice(1)] = document.getElementById(id);
        });

        // Специфичные селекторы
        state.elements.advancedPanel = document.querySelector('.gen-advanced-panel');
        state.elements.advancedIcon = document.querySelector('#genToggleAdvanced .fa-chevron-down');
    }

    function setDefaultDates() {
        const y = state.currentYear;
        const today = new Date();
        if (!state.elements.startDate || !state.elements.endDate) return;

        state.elements.startDate.min = `${y}-01-01`;
        state.elements.startDate.max = `${y}-12-31`;
        state.elements.endDate.min = `${y}-01-01`;
        state.elements.endDate.max = `${y}-12-31`;

        state.elements.startDate.value = GEN_formatDateForInput(new Date(today.getFullYear(), today.getMonth(), 1));
        state.elements.endDate.value = GEN_formatDateForInput(new Date(today.getFullYear(), today.getMonth() + 1, 0));

        if (state.elements.calendarYear) state.elements.calendarYear.textContent = y;
    }

    // ============================================================
    // ЛОГИКА РАБОТЫ С ФАЙЛАМИ
    // ============================================================

    function handleFiles(files) {
        files.forEach(file => {
            if (!file.name.match(/\.(xls|xlsx)$/)) {
                GEN_showStatus(`Файл ${file.name} не является Excel файлом`, 'error');
                return;
            }
            if (state.uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
                GEN_showStatus(`Файл ${file.name} уже загружен`, 'info');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const fileNameLower = file.name.toLowerCase();
                    let fileType = '';

                    if (fileNameLower.includes('kp') && file.name.match(/\d{4}/)) {
                        fileType = 'calendar';
                        processCalendarFile(workbook, file.name);
                    } else if (fileNameLower.includes('tm') && fileNameLower.includes('-sm')) {
                        fileType = 'template';
                        processTemplateFile(workbook, file.name);
                    } else {
                        const sheet = workbook.Sheets[workbook.SheetNames[0]];
                        const cellA = sheet['A1'] ? sheet['A1'].v.toString().toLowerCase() : '';
                        const cellA3 = sheet['A3'] ? sheet['A3'].v.toString().toLowerCase() : '';
                        
                        if (cellA.includes('календарь') || cellA.includes('январь')) {
                            fileType = 'calendar';
                            processCalendarFile(workbook, file.name);
                        } else if (cellA3.includes('прием пищи')) {
                            fileType = 'template';
                            processTemplateFile(workbook, file.name);
                        } else {
                            GEN_showStatus(`Не удалось определить тип файла ${file.name}`, 'error');
                            return;
                        }
                    }

                    state.uploadedFiles.push({
                        name: file.name,
                        size: file.size,
                        type: fileType,
                        date: new Date().toLocaleTimeString(),
                        valid: true
                    });

                    updateFileList();
                    checkFilesLoaded();
                    saveToLocalStorage();
                } catch (error) {
                    GEN_showStatus(`Ошибка при чтении файла ${file.name}`, 'error');
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    function updateFileList() {
        const el = state.elements.fileList;
        if (!el) return;
        el.innerHTML = '';

        if (state.uploadedFiles.length === 0) return;

        state.uploadedFiles.forEach(file => {
            const div = document.createElement('div');
            div.className = `gen-file-item ${file.valid ? '' : 'gen-error'}`;
            
            const icon = file.type === 'calendar' ? 'fa-calendar-alt' : 'fa-utensils';
            const label = file.type === 'calendar' ? 'Календарь ФЦМПО' : 'Типовое меню ФЦМПО';

            div.innerHTML = `
                <div class="gen-file-info">
                    <i class="fas ${icon}"></i>
                    <div>
                        <div style="font-weight:600; color:#0f172a; font-size:0.9rem;">${file.name}</div>
                        <div class="gen-file-size">${label} • ${GEN_formatFileSize(file.size)}</div>
                    </div>
                </div>
                <i class="fas fa-check-circle" style="color:#10b981; font-size:1.2rem;"></i>
            `;
            el.appendChild(div);
        });
    }

    function checkFilesLoaded() {
        const hasCal = state.uploadedFiles.some(f => f.type === 'calendar');
        const hasTpl = state.uploadedFiles.some(f => f.type === 'template');
        
        if (state.elements.generateBtn) {
            state.elements.generateBtn.disabled = !(hasCal && hasTpl);
            if (hasCal && hasTpl) {
                state.elements.generateBtn.classList.add('pulse');
            } else {
                state.elements.generateBtn.classList.remove('pulse');
            }
        }
    }

    // ============================================================
    // ПАРСИНГ
    // ============================================================

    function processCalendarFile(workbook, fileName) {
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        let schoolName = '';
        
        for (let i = 0; i < Math.min(10, data.length); i++) {
            if (data[i] && data[i].some(c => c && c.toString().toLowerCase().includes('школ'))) {
                const row = data[i];
                for (let j = 0; j < row.length; j++) {
                    if (row[j] && row[j].toString().toLowerCase().includes('школ') && j + 1 < row.length && row[j + 1]) {
                        schoolName = row[j + 1].toString().trim();
                        break;
                    }
                }
                if (schoolName) break;
            }
        }
        if (schoolName && state.elements.schoolName && !state.elements.schoolName.value) {
            state.elements.schoolName.value = schoolName;
        }

        let monthRowIdx = -1;
        for (let i = 0; i < Math.min(50, data.length); i++) {
            if (data[i] && data[i][0] && typeof data[i][0] === 'string' && GEN_MONTH_NAMES.some(m => data[i][0].toLowerCase().includes(m))) {
                monthRowIdx = i; break;
            }
        }
        if (monthRowIdx === -1) {
            GEN_showStatus(`Не удалось найти данные календаря`, 'error'); return;
        }

        let year = state.currentYear;
        for (let i = 0; i < Math.min(10, data.length); i++) {
            if (data[i] && data[i].some(c => c && c.toString().includes('Год'))) {
                const yCell = data[i].find(c => c && !isNaN(c) && c > 2000 && c < 2100);
                if (yCell) { year = parseInt(yCell); break; }
            }
        }
        state.currentYear = year;
        setDefaultDates();

        state.calendarData = { schoolName, months: {}, year };
        const dayHeaders = data[monthRowIdx - 1] || [];
        const dayNumbers = [];
        for (let i = 1; i < dayHeaders.length; i++) {
            const num = parseInt(dayHeaders[i]);
            if (!isNaN(num) && num >= 1 && num <= 31) dayNumbers.push(num);
        }
        if (dayNumbers.length === 0) for (let i = 1; i <= 31; i++) dayNumbers.push(i);

        for (let i = monthRowIdx; i < Math.min(monthRowIdx + 12, data.length); i++) {
            const row = data[i];
            if (!row || !row[0]) continue;
            const mName = row[0].toString().toLowerCase().trim();
            if (!GEN_MONTH_NAMES.includes(mName)) continue;
            
            state.calendarData.months[mName] = {};
            for (let dIdx = 0; dIdx < dayNumbers.length; dIdx++) {
                const dNum = dayNumbers[dIdx];
                const val = row[dIdx + 1];
                if (val !== undefined && val !== null && val !== '') {
                    const numVal = parseInt(val);
                    if (!isNaN(numVal) && numVal > 0) state.calendarData.months[mName][dNum] = numVal;
                }
            }
        }
    }

    function processTemplateFile(workbook, fileName) {
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let headerIdx = -1;
        for (let i = 0; i < Math.min(20, data.length); i++) {
            if (data[i] && data[i][0] && data[i][0].toString().toLowerCase() === 'неделя') {
                headerIdx = i; break;
            }
        }
        if (headerIdx === -1) { GEN_showStatus(`Не найдены заголовки`, 'error'); return; }

        state.templateMenuData = { weeks: {} };
        let currWeek = null, currDay = null, currMeal = null, foundB = false;

        for (let i = headerIdx + 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length < 3) continue;

            const wNum = parseInt(row[0]), dNum = parseInt(row[1]);
            if (!isNaN(wNum) && !isNaN(dNum)) {
                currWeek = wNum; currDay = dNum; currMeal = null; foundB = false;
                if (!state.templateMenuData.weeks[currWeek]) state.templateMenuData.weeks[currWeek] = {};
                if (!state.templateMenuData.weeks[currWeek][currDay]) {
                    state.templateMenuData.weeks[currWeek][currDay] = {
                        breakfast: { items: [] }, breakfast2: { items: [] }, lunch: { items: [] },
                        afternoonSnack: { items: [] }, dinner: { items: [] }, dinner2: { items: [] }
                    };
                }
            }

            const mCell = row[2] ? row[2].toString().toLowerCase() : '';
            if (mCell) {
                if (mCell.includes('завтрак')) {
                    if (foundB) currMeal = 'breakfast2'; else { currMeal = 'breakfast'; foundB = true; }
                } else if (mCell.includes('обед')) currMeal = 'lunch';
                else if (mCell.includes('полдник')) currMeal = 'afternoonSnack';
                else if (mCell.includes('ужин 2')) currMeal = 'dinner2';
                else if (mCell.includes('ужин')) currMeal = 'dinner';
                else if (mCell.includes('итого')) currMeal = null;
            }

            if (currWeek && currDay && currMeal) {
                const sec = row[3] ? row[3].toString().trim() : '';
                const name = row[4] ? row[4].toString().trim() : '';
                if (name && !name.startsWith('[') && !name.includes('итого')) {
                    const dish = {
                        section: GEN_normalizeSectionName(sec),
                        originalSection: sec,
                        name: name,
                        weight: parseFloat(row[5]) || 0,
                        proteins: parseFloat(row[6]) || 0,
                        fats: parseFloat(row[7]) || 0,
                        carbs: parseFloat(row[8]) || 0,
                        calories: parseFloat(row[9]) || 0,
                        recipeId: row[10] ? row[10].toString() : '',
                        price: parseFloat(row[11]) || 0
                    };
                    state.templateMenuData.weeks[currWeek][currDay][currMeal].items.push(dish);
                }
            }
        }

        for (let w in state.templateMenuData.weeks) {
            for (let d in state.templateMenuData.weeks[w]) {
                for (let m in state.templateMenuData.weeks[w][d]) {
                    state.templateMenuData.weeks[w][d][m].items = GEN_sortMealItemsByStructure(state.templateMenuData.weeks[w][d][m].items, m);
                }
            }
        }
    }

    // ============================================================
    // ГЕНЕРАЦИЯ
    // ============================================================

    function generateDailyMenus() {
        if (!state.calendarData || !state.templateMenuData) {
            GEN_showStatus('Загрузите оба файла', 'error'); return;
        }

        const start = new Date(state.elements.startDate.value);
        const end = new Date(state.elements.endDate.value);

        if (start > end) { GEN_showStatus('Дата начала позже конца', 'error'); return; }

        state.dailyMenus = [];
        let currDate = new Date(start);
        let generatedCount = 0;

        const btn = state.elements.generateBtn;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Генерация...';
        btn.disabled = true;

        // Имитация задержки для визуального эффекта
        setTimeout(() => {
            while (currDate <= end) {
                const y = currDate.getFullYear();
                const m = currDate.getMonth();
                const d = currDate.getDate();
                const mName = GEN_MONTH_NAMES[m];

                let menuType = null;
                if (state.calendarData.months[mName] && state.calendarData.months[mName][d]) {
                    menuType = state.calendarData.months[mName][d];
                }

                if (menuType !== null) {
                    let maxDay = 5;
                    for (let w in state.templateMenuData.weeks) {
                        for (let dNum in state.templateMenuData.weeks[w]) {
                            const dn = parseInt(dNum);
                            if (dn > maxDay) maxDay = dn;
                        }
                    }
                    const weekNum = Math.ceil(menuType / maxDay);
                    const dayNum = menuType - (weekNum - 1) * maxDay;

                    if (state.templateMenuData.weeks[weekNum] && state.templateMenuData.weeks[weekNum][dayNum]) {
                        const tpl = state.templateMenuData.weeks[weekNum][dayNum];
                        state.dailyMenus.push({
                            date: new Date(currDate),
                            dateString: GEN_formatDate(currDate),
                            fileName: `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}-sm.xlsx`,
                            schoolName: state.elements.schoolName.value || 'Школа',
                            weekNumber: weekNum, dayNumber: dayNum, menuType: menuType,
                            breakfast: tpl.breakfast, breakfast2: tpl.breakfast2,
                            lunch: tpl.lunch, afternoonSnack: tpl.afternoonSnack,
                            dinner: tpl.dinner, dinner2: tpl.dinner2
                        });
                        generatedCount++;
                    }
                }
                currDate.setDate(currDate.getDate() + 1);
            }

            btn.innerHTML = originalText;
            btn.disabled = false;

            if (generatedCount > 0) {
                // СКРЫВАЕМ кнопку генерации и ПОКАЗЫВАЕМ блок скачивания
                btn.style.display = 'none';
                if (state.elements.exportContainer) {
                    state.elements.exportContainer.style.display = 'block';
                }

                // Показываем навигацию и сетку
                state.currentMenuIndex = 0;
                if (state.elements.menuNavigation) state.elements.menuNavigation.style.display = 'flex';
                if (state.elements.menuGrid) {
                    state.elements.menuGrid.style.display = 'grid';
                    updateMenuGrid();
                }
                if (state.elements.menuCounter) {
                    state.elements.menuCounter.textContent = `1 из ${state.dailyMenus.length}`;
                }
                if (state.elements.currentMenuDate) {
                    state.elements.currentMenuDate.textContent = state.dailyMenus[0].dateString;
                }

                GEN_showStatus(`Успешно сгенерировано ${generatedCount} меню!`, 'success');
            } else {
                GEN_showStatus('Нет данных для выбранного периода', 'error');
            }
        }, 300);
    }

    function exportCurrentMenuAsExcel() {
        if (state.dailyMenus.length === 0) return;
        const menu = state.dailyMenus[state.currentMenuIndex] || state.dailyMenus[0];
        
        const data = createExcelDataWithProperStructure(menu);
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Меню');
        XLSX.writeFile(wb, menu.fileName);
        
        GEN_showStatus(`Файл ${menu.fileName} сохранен`, 'success');
    }

    async function exportAllMenusAsZip() {
        if (state.dailyMenus.length === 0) return;
        const btn = state.elements.exportAllBtn;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Архивация...';
        btn.disabled = true;

        try {
            const zip = new JSZip();
            for (let menu of state.dailyMenus) {
                const data = createExcelDataWithProperStructure(menu);
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.aoa_to_sheet(data);
                XLSX.utils.book_append_sheet(wb, ws, 'Меню');
                const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
                zip.file(menu.fileName, buffer);
            }
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `Меню_${state.currentYear}.zip`);
            GEN_showStatus('Архив успешно скачан', 'success');
        } catch (e) {
            GEN_showStatus('Ошибка при создании архива', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    // ============================================================
    // СЕТКА И ДЕТАЛЬНЫЙ ВИД
    // ============================================================

    function updateMenuGrid() {
        const el = state.elements.menuGrid;
        if (!el) return;
        el.innerHTML = '';

        state.dailyMenus.forEach((menu, idx) => {
            const total = (menu.breakfast?.items?.length || 0) + (menu.lunch?.items?.length || 0) + (menu.dinner?.items?.length || 0);
            const card = document.createElement('div');
            card.className = `gen-menu-card ${idx === state.currentMenuIndex ? 'gen-active' : ''}`;
            card.innerHTML = `
                <div class="gen-menu-card-header" style="background: linear-gradient(135deg, #3b82f6, #2563eb);">
                    <div>${menu.dateString}</div>
                    <div class="gen-menu-card-type">Меню #${menu.menuType}</div>
                </div>
                <div class="gen-menu-card-content">
                    <div style="font-size: 0.9rem; margin-bottom: 8px;"><i class="fas fa-utensils"></i> Блюд: <b>${total}</b></div>
                    <div style="font-size: 0.8rem; color: #64748b;">Школа: ${menu.schoolName}</div>
                </div>
            `;
            card.addEventListener('click', () => {
                state.currentMenuIndex = idx;
                updateMenuGrid();
                if (state.elements.menuCounter) state.elements.menuCounter.textContent = `${idx + 1} из ${state.dailyMenus.length}`;
                if (state.elements.currentMenuDate) state.elements.currentMenuDate.textContent = menu.dateString;
                showDetailedView(menu);
            });
            el.appendChild(card);
        });
    }

    function showDetailedView(menu) {
        if (state.elements.menuGrid) state.elements.menuGrid.style.display = 'none';
        if (state.elements.detailedView) state.elements.detailedView.classList.add('gen-active');
        if (state.elements.detailMenuDate) state.elements.detailMenuDate.textContent = menu.dateString;

        updateMealsDisplay(menu);
    }

    function updateMealsDisplay(menu) {
        const el = state.elements.detailMeals;
        if (!el) return;
        
        let html = '';
        const meals = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];

        meals.forEach(m => {
            const data = menu[m];
            if (!data || !data.items || data.items.length === 0) return;

            html += `<div style="margin-bottom: 20px;">
                <h4 style="color: ${GEN_getMealColor(m)}; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">
                    <i class="fas ${GEN_getMealIcon(m)}"></i> ${GEN_MEAL_TYPES[m]}
                </h4>
                <ul style="list-style: none; padding: 0; margin: 0; display: grid; gap: 8px;">`;

            data.items.forEach(item => {
                html += `<li style="background: #f8fafc; padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between;">
                    <span><b>${item.name}</b> <small style="color:#64748b;">(${item.weight}г)</small></span>
                    <span style="color: #64748b; font-size: 0.85rem;">${item.calories} ккал</span>
                </li>`;
            });
            html += `</ul></div>`;
        });

        el.innerHTML = html || '<p style="color:#64748b;">Нет данных</p>';
    }

    function createExcelDataWithProperStructure(menu) {
        // Упрощенная версия для скачивания (без цветов, только данные)
        const data = [
            ['Школа', menu.schoolName, '', '', 'Отд./корп', '', '', '', 'День', GEN_formatDate(menu.date, 'excel')],
            ['', '', '', '', '', '', '', '', '', ''],
            ['Прием пищи', 'Раздел', '№ рец.', 'Блюдо', 'Выход, г', 'Цена', 'Калорийность', 'Белки', 'Жиры', 'Углеводы']
        ];

        const addMeal = (name, type, items) => {
            if (!items || items.length === 0) return;
            let first = true;
            items.forEach(item => {
                data.push([first ? name : '', item.originalSection || item.section || '', item.recipeId || '', item.name, item.weight, item.price || 0, item.calories, item.proteins, item.fats, item.carbs]);
                first = false;
            });
            data.push(['', '', '', '', '', '', '', '', '', '']);
        };

        addMeal('Завтрак', 'breakfast', menu.breakfast?.items);
        addMeal('Завтрак 2', 'breakfast2', menu.breakfast2?.items);
        addMeal('Обед', 'lunch', menu.lunch?.items);
        addMeal('Полдник', 'afternoonSnack', menu.afternoonSnack?.items);
        addMeal('Ужин', 'dinner', menu.dinner?.items);
        addMeal('Ужин 2', 'dinner2', menu.dinner2?.items);

        return data;
    }

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ
    // ============================================================

    function init() {
        cacheElements();
        if (!state.elements.generateBtn) return;

        if (!state.isInitialized) {
            setupEvents();
            setDefaultDates();
            state.isInitialized = true;
        }
    }

    function setupEvents() {
        const e = state.elements;

        // Загрузка файлов
        if (e.dropArea && e.fileInput) {
            e.dropArea.addEventListener('click', () => e.fileInput.click());
            e.dropArea.addEventListener('dragover', ev => { ev.preventDefault(); e.dropArea.classList.add('gen-dragover'); });
            e.dropArea.addEventListener('dragleave', () => e.dropArea.classList.remove('gen-dragover'));
            e.dropArea.addEventListener('drop', ev => {
                ev.preventDefault(); e.dropArea.classList.remove('gen-dragover');
                handleFiles(Array.from(ev.dataTransfer.files));
            });
        }
        if (e.fileInput) {
            e.fileInput.addEventListener('change', ev => {
                handleFiles(Array.from(ev.target.files));
                ev.target.value = '';
            });
        }

        // Дополнительные настройки
        if (e.toggleAdvanced && e.advancedPanel) {
            e.toggleAdvanced.addEventListener('click', () => {
                const isOpen = e.advancedPanel.style.display === 'block';
                e.advancedPanel.style.display = isOpen ? 'none' : 'block';
                if (e.advancedIcon) e.advancedIcon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
            });
        }

        // Кнопки
        e.generateBtn?.addEventListener('click', generateDailyMenus);
        e.exportAllBtn?.addEventListener('click', exportAllMenusAsZip);
        e.exportCurrentBtn?.addEventListener('click', exportCurrentMenuAsExcel);

        // Закрыть детальный вид
        e.closeDetailView?.addEventListener('click', () => {
            e.detailedView?.classList.remove('gen-active');
            if (e.menuGrid) e.menuGrid.style.display = 'grid';
        });

        // Навигация
        e.prevMenuBtn?.addEventListener('click', () => {
            if (state.currentMenuIndex > 0) {
                state.currentMenuIndex--;
                updateMenuGrid();
                if (e.menuCounter) e.menuCounter.textContent = `${state.currentMenuIndex + 1} из ${state.dailyMenus.length}`;
                if (e.currentMenuDate) e.currentMenuDate.textContent = state.dailyMenus[state.currentMenuIndex].dateString;
            }
        });
        e.nextMenuBtn?.addEventListener('click', () => {
            if (state.currentMenuIndex < state.dailyMenus.length - 1) {
                state.currentMenuIndex++;
                updateMenuGrid();
                if (e.menuCounter) e.menuCounter.textContent = `${state.currentMenuIndex + 1} из ${state.dailyMenus.length}`;
                if (e.currentMenuDate) e.currentMenuDate.textContent = state.dailyMenus[state.currentMenuIndex].dateString;
            }
        });
    }

    function saveToLocalStorage() {
        // Заглушка, если не нужно сохранять состояние
    }

    return {
        init,
        getState: () => state
    };
})();

window.GeneratorModule = GeneratorModule;
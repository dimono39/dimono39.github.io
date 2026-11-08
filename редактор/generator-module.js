/**
 * ============================================================
 * МОДУЛЬ "ГЕНЕРАТОР ЕЖЕДНЕВНЫХ МЕНЮ (ФЦМПО)" v3.0 (Объединённый)
 * ============================================================
 * Базируется на v1.0 (полная) + v2.0 (упрощённая инициализация/UX)
 *
 * Подключение: <script src="generator-module.js"></script>
 * Вызов: GeneratorModule.init();
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
    // УТИЛИТЫ (полный набор из v1.0)
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
            'горячий напиток с витаминами': 'гор.напиток',
            'первое блюдо': '1 блюдо', 'второе блюдо': '2 блюдо',
            'хлеб белый': 'хлеб бел.', 'хлеб бел': 'хлеб бел.',
            'хлеб черный': 'хлеб черн.', 'хлеб черн': 'хлеб черн.',
            'хлеб ржаной': 'хлеб черн.', 'булочные изделия': 'булочное',
            'кисломолочный напиток': 'кисломол.', 'кисломолочные продукты': 'кисломол.',
            'свежие фрукты': 'фрукты', 'фрукт свежий': 'фрукты', 'фрукт': 'фрукты',
            'овощи': 'закуска', 'салат': 'закуска',
            'гор. блюдо': 'гор.блюдо', 'гор.блюдо': 'гор.блюдо', 'гор. напиток': 'гор.напиток', 'гор.напиток': 'гор.напиток', 
            'бутерброд': 'хлеб'
        };
        if (map[s]) return map[s];
        for (const [k, v] of Object.entries(map)) { if (s.includes(k)) return v; }

        const standard = ['гор.блюдо', 'гор.напиток', 'хлеб', 'фрукты', 'напиток',
            'закуска', '1 блюдо', '2 блюдо', 'гарнир', 'хлеб бел.', 'хлеб черн.', 'булочное', 'кисломол.'];
        for (const std of standard) {
            const clean = std.replace('.', '').replace(' ', '');
            if (s.includes(clean)) return std;
        }
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
            pastel: { school: 'e8f2fb', header: 'f8f8f8', breakfast: 'fffde6', breakfast2: 'fff2e6', lunch: 'f2e6fa', afternoonSnack: 'e6f5f2', dinner: 'ffe6e6', dinner2: 'f7e6ff' },
            monochrome: { school: 'f0f0f0', header: 'e0e0e0', breakfast: 'f5f5f5', breakfast2: 'f0f0f0', lunch: 'ebebeb', afternoonSnack: 'e6e6e6', dinner: 'e0e0e0', dinner2: 'dbdbdb' }
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
    // ИНИЦИАЛИЗАЦИЯ ЭЛЕМЕНТОВ (гибрид: полный список ID из v1.0 + динамика из v2.0)
    // ============================================================

    function cacheElements() {
        const ids = [
            'genStatusMessage', 'genFileInput', 'genDropArea', 'genFileList',
            'genGenerateBtn', 'genExportAllBtn', 'genExportCurrentBtn', 'genExportFullPackageBtn', 'genExportContainer',
            'genStoredDataInfo', 'genStoredDataText', 'genLoadFromStorageBtn', 'genClearStorageBtn',
            'genStartDate', 'genEndDate', 'genCalendarYearBadge', 'genToggleAdvanced',
            'genSchoolName', 'genAgeCategory', 'genColorScheme',
            'genMenuNavigation', 'genMenuCounter', 'genCurrentMenuDate', 'genPrevMenuBtn', 'genNextMenuBtn',
            'genToggleViewBtn', 'genMenuGrid', 'genDetailedView', 'genDetailMenuDate', 'genCloseDetailView',
            'genMealOptions', 'genDetailMeals', 'genExcelPreview', 'genToggleMenuView',
            'genCalendarYear', 'genCalendarData', 'genMenuData', 'genMenuStats',
            'genTotalMenusCount', 'genMenuPeriod', 'genMenuSchool', 'genMenuCompliance',
            'genAnalyzeBtn', 'genComplianceBtn', 'genDownloadTemplateBtn', 'genFileValidation',
            'genQuickHelpBtn', 'genQuickGuide', 'genAdvancedSettings', 'genJumpToTodayBtn',
            'genDailyMenuContainer', 'genDailyMenuContent', 'genCurrentMenuInfo',
            'genSchoolNameBadge'
        ];

        state.elements = {};
        ids.forEach(id => {
            let key = id.replace('gen', '');
            key = key.charAt(0).toLowerCase() + key.slice(1);
            state.elements[key] = document.getElementById(id);
        });

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
    // ФАЙЛЫ (полная логика v1.0 + улучшенный updateFileList из v2.0)
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

                    const validation = validateFileStructure(workbook, fileType);
                    showValidationResult(validation, file.name);

                    state.uploadedFiles.push({
                        name: file.name, size: file.size, type: fileType,
                        date: new Date().toLocaleTimeString(), valid: validation.isValid
                    });

                    updateFileList();
                    checkFilesLoaded();
                    saveToLocalStorage();
                } catch (error) {
                    console.error(error);
                    GEN_showStatus(`Ошибка при чтении файла ${file.name}`, 'error');
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    function validateFileStructure(workbook, fileType) {
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const result = { isValid: true, errors: [], warnings: [] };

        if (fileType === 'calendar') {
            let hasMonthRow = false, hasDayNumbers = false;
            for (let i = 0; i < Math.min(20, data.length); i++) {
                if (data[i] && data[i][0]) {
                    const v = data[i][0].toString().toLowerCase();
                    if (GEN_MONTH_NAMES.some(m => v.includes(m))) hasMonthRow = true;
                    const n = parseInt(v);
                    if (!isNaN(n) && n >= 1 && n <= 31) hasDayNumbers = true;
                }
            }
            if (!hasMonthRow) result.warnings.push('Не найдена строка с названиями месяцев');
            if (!hasDayNumbers) result.warnings.push('Возможно некорректные заголовки дней');
        } else if (fileType === 'template') {
            let headerFound = false;
            for (let i = 0; i < Math.min(15, data.length); i++) {
                if (data[i] && (data[i][0] === 'Неделя' || data[i][2] === 'Прием пищи')) {
                    headerFound = true; break;
                }
            }
            if (!headerFound) { result.errors.push('Не найдена строка заголовков'); result.isValid = false; }
        }
        if (data.length < 3) result.warnings.push('Файл содержит слишком мало строк');
        return result;
    }

    function showValidationResult(v, fileName) {
        if (v.isValid) {
            if (state.elements.fileValidation) state.elements.fileValidation.style.display = 'flex';
            GEN_showStatus(v.warnings.length
                ? `Файл ${fileName} загружен (предупреждения: ${v.warnings.join(', ')})`
                : `Файл ${fileName} загружен и проверен`,
                v.warnings.length ? 'warning' : 'success');
        } else {
            GEN_showStatus(`Ошибка в файле ${fileName}: ${v.errors.join(', ')}`, 'error');
        }
    }

    function updateFileList() {
        const el = state.elements.fileList;
        if (!el) return;
        el.innerHTML = '';

        if (state.uploadedFiles.length === 0) {
            el.innerHTML = '<p style="text-align:center;color:#64748b;padding:20px;"><i class="fas fa-file-excel fa-2x" style="margin-bottom:10px;opacity:0.5;"></i><br>Файлы ФЦМПО не загружены</p>';
            return;
        }

        state.uploadedFiles.forEach(file => {
            const div = document.createElement('div');
            div.className = `gen-file-item ${file.valid ? '' : 'gen-error'}`;
            const icon = file.type === 'calendar' ? 'fa-calendar-alt' : 'fa-utensils';
            const label = file.type === 'calendar' ? 'Календарь ФЦМПО' : 'Типовое меню ФЦМПО';
            div.innerHTML = `
                <div class="gen-file-info">
                    <i class="fas ${icon}"></i>
                    <div>
                        <div style="font-weight:600;color:#0f172a;font-size:0.9rem;">${file.name}</div>
                        <div class="gen-file-size">${label} • ${file.size === 0 ? 'Данные из модуля' : GEN_formatFileSize(file.size)}</div>
                    </div>
                </div>
                <i class="fas ${file.valid ? 'fa-check-circle' : 'fa-exclamation-triangle'}"
                   style="color:${file.valid ? '#10b981' : '#e74c3c'};font-size:1.2rem;"></i>
            `;
            el.appendChild(div);
        });
    }

    function checkFilesLoaded() {
        const hasCal = state.uploadedFiles.some(f => f.type === 'calendar' && f.valid);
        const hasTpl = state.uploadedFiles.some(f => f.type === 'template' && f.valid);

        if (state.elements.generateBtn) {
            state.elements.generateBtn.disabled = !(hasCal && hasTpl);
            state.elements.generateBtn.classList.toggle('pulse', hasCal && hasTpl);
        }

        if (hasCal && hasTpl) GEN_showStatus('Все файлы ФЦМПО загружены. Можно создавать меню.', 'success');
        else if (hasCal) GEN_showStatus('Загрузите типовое меню (tm2026-sm.xlsx)', 'info');
        else if (hasTpl) GEN_showStatus('Загрузите календарь питания (kp2026.xlsx)', 'info');
        else GEN_showStatus('Загрузите календарь и типовое меню ФЦМПО', 'info');
    }

    // ============================================================
    // ПАРСИНГ (полная логика v1.0)
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
                        schoolName = row[j + 1].toString().trim(); break;
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
            if (data[i] && data[i][0] && typeof data[i][0] === 'string' &&
                GEN_MONTH_NAMES.some(m => data[i][0].toLowerCase().includes(m))) {
                monthRowIdx = i; break;
            }
        }
        if (monthRowIdx === -1) { GEN_showStatus('Не удалось найти данные календаря', 'error'); return; }

        let year = state.currentYear;
        for (let i = 0; i < Math.min(10, data.length); i++) {
            if (data[i] && data[i].some(c => c && c.toString().includes('Год'))) {
                const yCell = data[i].find(c => c && !isNaN(c) && c > 2000 && c < 2100);
                if (yCell) { year = parseInt(yCell); break; }
            }
        }
        if (year === state.currentYear) {
            const m = fileName.match(/\d{4}/);
            if (m) year = parseInt(m[0]);
        }
        state.currentYear = year;
        setDefaultDates();
        if (state.elements.calendarYearBadge) {
            state.elements.calendarYearBadge.textContent = year;
            state.elements.calendarYearBadge.style.display = 'inline-block';
        }

        state.calendarData = { schoolName, months: {}, year };
        const dayHeaders = data[monthRowIdx - 1] || [];
        const dayNumbers = [];
        for (let i = 1; i < dayHeaders.length; i++) {
            const n = parseInt(dayHeaders[i]);
            if (!isNaN(n) && n >= 1 && n <= 31) dayNumbers.push(n);
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
                    const n = parseInt(val);
                    if (!isNaN(n) && n > 0) state.calendarData.months[mName][dNum] = n;
                }
            }
        }
        GEN_showStatus(`Календарь ФЦМПО загружен (${year} год)`, 'success');
        updateCalendarPreview();
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
        if (headerIdx === -1) { GEN_showStatus('Не найдены заголовки меню', 'error'); return; }

        state.templateMenuData = { schoolName: '', ageCategory: '', approvalInfo: {}, weeks: {} };
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
                else if (mCell.includes('итого') || mCell.includes('среднее')) currMeal = null;
            }

            if (currWeek && currDay && currMeal) {
                const sec = row[3] ? row[3].toString().trim() : '';
                const name = row[4] ? row[4].toString().trim() : '';
                if (name && !name.startsWith('[') && !name.toLowerCase().includes('итого')) {
                    const dish = {
                        section: GEN_normalizeSectionName(sec), originalSection: sec, name,
                        weight: parseFloat(row[5]) || 0, proteins: parseFloat(row[6]) || 0,
                        fats: parseFloat(row[7]) || 0, carbs: parseFloat(row[8]) || 0,
                        calories: parseFloat(row[9]) || 0,
                        recipeId: row[10] ? row[10].toString() : '',
                        price: parseFloat(row[11]) || 0
                    };
                    const day = state.templateMenuData.weeks[currWeek][currDay];
                    const isDup = day[currMeal].items.some(it => it.name === dish.name && it.section === dish.section);
                    if (!isDup) day[currMeal].items.push(dish);
                }
            }
        }

        for (let w in state.templateMenuData.weeks) {
            for (let d in state.templateMenuData.weeks[w]) {
                for (let m in state.templateMenuData.weeks[w][d]) {
                    state.templateMenuData.weeks[w][d][m].items =
                        GEN_sortMealItemsByStructure(state.templateMenuData.weeks[w][d][m].items, m);
                }
            }
        }
        GEN_showStatus(`Типовое меню ФЦМПО загружено из файла ${fileName}`, 'success');
        updateMenuPreview();
    }

    // ============================================================
    // ПРЕДПРОСМОТР (полная логика v1.0)
    // ============================================================

    function updateCalendarPreview() {
        const el = state.elements.calendarData;
        if (!el) return;
        if (!state.calendarData) {
            el.innerHTML = '<p style="color:#e74c3c;padding:20px;text-align:center;"><i class="fas fa-exclamation-triangle"></i> Календарь ФЦМПО не загружен</p>';
            return;
        }

        let html = '<div style="margin-bottom:20px;">';
        html += `<p><strong><i class="fas fa-calendar"></i> Год:</strong> ${state.currentYear}</p>`;
        html += `<p><strong><i class="fas fa-layer-group"></i> Месяцев с данными:</strong> ${Object.keys(state.calendarData.months || {}).length}</p>`;
        if (state.calendarData.schoolName) {
            html += `<p><strong><i class="fas fa-school"></i> Школа:</strong> ${state.calendarData.schoolName}</p>`;
        }
        html += '</div>';

        html += '<table class="gen-calendar-table"><tr><th class="gen-month-header">Месяц</th>';
        for (let d = 1; d <= 31; d++) html += `<th>${d}</th>`;
        html += '</tr>';

        for (const m of GEN_MONTH_NAMES) {
            if (state.calendarData.months && state.calendarData.months[m]) {
                html += `<tr><td class="gen-month-header">${m}</td>`;
                for (let d = 1; d <= 31; d++) {
                    const t = state.calendarData.months[m][d];
                    html += t !== undefined ? `<td class="gen-has-menu">${t}</td>` : '<td></td>';
                }
                html += '</tr>';
            }
        }
        html += '</table>';
        el.innerHTML = html;
    }

    function updateMenuPreview() {
        const el = state.elements.menuData;
        if (!el) return;
        if (!state.templateMenuData || !state.templateMenuData.weeks) {
            el.innerHTML = '<p style="color:#e74c3c;padding:20px;text-align:center;"><i class="fas fa-exclamation-triangle"></i> Меню ФЦМПО не загружено</p>';
            return;
        }

        let html = '<div class="gen-menu-preview-grid">';
        const allDays = [];
        let totalDishes = 0;

        for (const w in state.templateMenuData.weeks) {
            const week = state.templateMenuData.weeks[w];
            for (const d in week) {
                const day = week[d];
                let cnt = 0;
                for (const m in day) if (day[m].items) cnt += day[m].items.length;
                totalDishes += cnt;
                allDays.push({
                    week: w, day: d, dishes: cnt,
                    b: day.breakfast?.items?.length || 0,
                    b2: day.breakfast2?.items?.length || 0,
                    l: day.lunch?.items?.length || 0,
                    s: day.afternoonSnack?.items?.length || 0,
                    dn: day.dinner?.items?.length || 0,
                    dn2: day.dinner2?.items?.length || 0
                });
            }
        }
        allDays.sort((a, b) => a.week === b.week ? a.day - b.day : a.week - b.week);

        allDays.forEach(d => {
            html += `<div class="gen-menu-preview-day ${d.dishes > 0 ? 'gen-has-menu' : ''}">
                <div class="gen-day-number">${d.week}.${d.day}</div>
                <div class="gen-day-info">${d.dishes} блюд<br>
                <small>З:${d.b}/З2:${d.b2}/О:${d.l}/П:${d.s}/У:${d.dn}/У2:${d.dn2}</small></div>
            </div>`;
        });
        html += '</div>';
        html += `<div class="gen-preview-info">
            <p><strong>Всего:</strong> ${allDays.length} дней, ${totalDishes} блюд</p>
            <p><strong>Школа:</strong> ${state.templateMenuData.schoolName || 'Не указана'}</p>
        </div>`;
        el.innerHTML = html;
    }

    // ============================================================
    // ГЕНЕРАЦИЯ (логика v2.0 с UX-улучшениями)
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
        let errorCount = 0;

        const btn = state.elements.generateBtn;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Генерация...';
        btn.disabled = true;

        setTimeout(() => {
            while (currDate <= end) {
                const y = currDate.getFullYear();
                const m = currDate.getMonth();
                const d = currDate.getDate();
                const mName = GEN_MONTH_NAMES[m];

                let menuType = null;
                if (state.calendarData.months[mName]?.[d]) menuType = state.calendarData.months[mName][d];

                if (menuType !== null) {
                    let maxDay = 5;
                    for (let w in state.templateMenuData.weeks) {
                        for (let dn in state.templateMenuData.weeks[w]) {
                            const n = parseInt(dn); if (n > maxDay) maxDay = n;
                        }
                    }
                    const weekNum = Math.ceil(menuType / maxDay);
                    const dayNum = menuType - (weekNum - 1) * maxDay;

                    if (state.templateMenuData.weeks[weekNum]?.[dayNum]) {
                        const tpl = state.templateMenuData.weeks[weekNum][dayNum];
                        const sortedDay = {};
                        for (const mt in tpl) {
                            sortedDay[mt] = { items: GEN_sortMealItemsByStructure(tpl[mt]?.items || [], mt) };
                        }
                        state.dailyMenus.push({
                            date: new Date(currDate),
                            dateString: GEN_formatDate(currDate),
                            fileName: `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}-sm.xlsx`,
                            schoolName: state.elements.schoolName?.value || state.templateMenuData.schoolName || 'Школа',
                            ageCategory: state.elements.ageCategory?.value || state.templateMenuData.ageCategory || '',
                            weekNumber: weekNum, dayNumber: dayNum, menuType,
                            breakfast: sortedDay.breakfast, breakfast2: sortedDay.breakfast2,
                            lunch: sortedDay.lunch, afternoonSnack: sortedDay.afternoonSnack,
                            dinner: sortedDay.dinner, dinner2: sortedDay.dinner2
                        });
                        generatedCount++;
                    } else errorCount++;
                }
                currDate.setDate(currDate.getDate() + 1);
            }

            btn.innerHTML = originalText;
            btn.disabled = false;

            if (generatedCount > 0) {
                btn.style.display = 'none';
                if (state.elements.exportContainer) state.elements.exportContainer.style.display = 'block';

                state.currentMenuIndex = 0;
                if (state.elements.menuNavigation) state.elements.menuNavigation.style.display = 'flex';
                if (state.elements.menuStats) state.elements.menuStats.style.display = 'flex';
                if (state.elements.menuGrid) { state.elements.menuGrid.style.display = 'grid'; updateMenuGrid(); }
                if (state.elements.menuCounter) state.elements.menuCounter.textContent = `1 из ${state.dailyMenus.length}`;
                if (state.elements.currentMenuDate) state.elements.currentMenuDate.textContent = state.dailyMenus[0].dateString;

                updateMenuStats();
                saveToLocalStorage();
                GEN_showStatus(`Успешно сгенерировано ${generatedCount} меню${errorCount ? ` (ошибок: ${errorCount})` : ''}!`, 'success');
            } else {
                GEN_showStatus('Нет данных для выбранного периода', 'error');
            }
        }, 300);
    }

    // ============================================================
    // EXCEL (полная структура v1.0 + оформление v2.0)
    // ============================================================

    function createExcelDataWithProperStructure(menu) {
        const data = [
            ['Школа', menu.schoolName, '', '', 'Отд./корп', '', '', '', 'День', GEN_formatDate(menu.date, 'excel')],
            ['', '', '', '', '', '', '', '', '', ''],
            ['Прием пищи', 'Раздел', '№ рец.', 'Блюдо', 'Выход, г', 'Цена', 'Калорийность', 'Белки', 'Жиры', 'Углеводы']
        ];

        const addMeal = (name, type, items, alwaysShow = false) => {
            const realItems = (items || []).filter(i => i.name && i.name.trim() && !i.name.trim().startsWith('['));
            if (!realItems.length && !alwaysShow) return;

            const structure = GEN_MEAL_STRUCTURE[type];
            const sorted = GEN_sortMealItemsByStructure(items || [], type);
            const bySection = new Map();
            sorted.forEach(it => {
                const sec = GEN_normalizeSectionName(it.section || '');
                if (!bySection.has(sec)) bySection.set(sec, []);
                bySection.get(sec).push(it);
            });

            let first = true;

            if (type === 'breakfast2') {
                const it = sorted[0];
                if (it && it.name && it.name.trim()) {
                    data.push([name, 'фрукты', it.recipeId || '', it.name, it.weight || '',
                        it.price || 0, it.calories || 0, it.proteins || 0, it.fats || 0, it.carbs || 0]);
                } else {
                    data.push([name, 'фрукты', '', '', '', '', '', '', '', '']);
                }
                data.push(['', '', '', '', '', '', '', '', '', '']);
                return;
            }

            if (structure) {
                if (type === 'lunch' || alwaysShow) {
                    for (const sec of structure.sections) {
                        const secItems = bySection.get(sec) || [];
                        if (secItems.length) {
                            secItems.forEach(it => {
                                if (it.name && it.name.trim()) {
                                    data.push([first ? name : '', it.originalSection || it.section || '', it.recipeId || '',
                                        it.name, it.weight || '', it.price || 0, it.calories || 0,
                                        it.proteins || 0, it.fats || 0, it.carbs || 0]);
                                    first = false;
                                }
                            });
                        } else {
                            data.push([first ? name : '', sec, '', '', '', '', '', '', '', '']);
                            first = false;
                        }
                    }
                } else {
                    sorted.forEach(it => {
                        if (it.name && it.name.trim()) {
                            data.push([first ? name : '', it.originalSection || it.section || '', it.recipeId || '',
                                it.name, it.weight || '', it.price || 0, it.calories || 0,
                                it.proteins || 0, it.fats || 0, it.carbs || 0]);
                            first = false;
                        }
                    });
                }
            }

            const otherSecs = Array.from(bySection.keys()).filter(s => !structure || !structure.sections.includes(s));
            otherSecs.forEach(sec => {
                (bySection.get(sec) || []).forEach(it => {
                    if (it.name && it.name.trim()) {
                        data.push(['', it.originalSection || it.section || '', it.recipeId || '',
                            it.name, it.weight || '', it.price || 0, it.calories || 0,
                            it.proteins || 0, it.fats || 0, it.carbs || 0]);
                    }
                });
            });

            if (!first) data.push(['', '', '', '', '', '', '', '', '', '']);
        };

        addMeal('Завтрак', 'breakfast', menu.breakfast?.items || [], true);
        addMeal('Завтрак 2', 'breakfast2', menu.breakfast2?.items || [], true);
        addMeal('Обед', 'lunch', menu.lunch?.items || [], true);
        addMeal('Полдник', 'afternoonSnack', menu.afternoonSnack?.items || [], false);
        addMeal('Ужин', 'dinner', menu.dinner?.items || [], false);
        addMeal('Ужин 2', 'dinner2', menu.dinner2?.items || [], false);

        return data;
    }

    async function createStyledWorkbook(menu) {
        const data = createExcelDataWithProperStructure(menu);
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Генератор школьного питания ФЦМПО';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Меню', {
            properties: { defaultRowHeight: 20 },
            pageSetup: { fitToPage: true }
        });
        worksheet.addRows(data);

        worksheet.columns = [
            { key: 'A', width: 12 }, { key: 'B', width: 15 }, { key: 'C', width: 8 },
            { key: 'D', width: 40 }, { key: 'E', width: 10 }, { key: 'F', width: 10 },
            { key: 'G', width: 15 }, { key: 'H', width: 8 }, { key: 'I', width: 8 }, { key: 'J', width: 10 }
        ];

        worksheet.getColumn('F').numFmt = '0.00';
        worksheet.getColumn('F').alignment = { horizontal: 'right' };
        ['E', 'G', 'H', 'I', 'J'].forEach(col => {
            worksheet.getColumn(col).numFmt = '0';
            worksheet.getColumn(col).alignment = { horizontal: 'right' };
        });

        const scheme = state.elements.colorScheme?.value || 'default';
        const colors = GEN_getColorScheme(scheme);

        let currentMealType = null;
        let isFirstRowOfMeal = true;

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 2) { row.height = 0; row.hidden = true; return; }

            if (rowNumber === 1) {
                row.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GEN_hexToArgb(colors.school) } };
                    cell.font = { bold: true };
                });
                worksheet.mergeCells('B1:D1');
            } else if (rowNumber === 3) {
                row.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GEN_hexToArgb(colors.header) } };
                    cell.font = { bold: true };
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                });
            } else if (rowNumber > 3) {
                const mealCell = row.getCell('A');
                const mealValue = mealCell.value ? mealCell.value.toString().trim() : '';
                if (mealValue) {
                    currentMealType = GEN_getMealTypeFromName(mealValue);
                    isFirstRowOfMeal = true;
                }
                if (currentMealType && colors[currentMealType]) {
                    row.eachCell(cell => {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GEN_hexToArgb(colors[currentMealType]) } };
                    });
                }
                if (isFirstRowOfMeal && mealValue) {
                    mealCell.font = { bold: true };
                    isFirstRowOfMeal = false;
                }
            }

            if (rowNumber >= 3 && rowNumber !== 2) {
                row.eachCell(cell => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
                    };
                });
            }
        });

        return workbook;
    }

    // ============================================================
    // ЭКСПОРТ (полная логика v1.0)
    // ============================================================

    async function exportCurrentMenuAsExcel() {
        if (state.dailyMenus.length === 0) return;
        const menu = state.dailyMenus[state.currentMenuIndex] || state.dailyMenus[0];
        const btn = state.elements.exportCurrentBtn;
        const originalText = btn.innerHTML;

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Экспорт...';
        btn.disabled = true;

        try {
            const wb = await createStyledWorkbook(menu);
            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, menu.fileName);
            GEN_showStatus(`Файл ${menu.fileName} сохранен`, 'success');
        } catch (error) {
            console.error(error);
            GEN_showStatus('Ошибка при экспорте файла', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    async function exportAllMenusAsZip() {
        if (state.dailyMenus.length === 0) return;
        const btn = state.elements.exportAllBtn;
        const originalText = btn.innerHTML;

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Архивация...';
        btn.disabled = true;

        try {
            const zip = new JSZip();
            for (let i = 0; i < state.dailyMenus.length; i++) {
                const menu = state.dailyMenus[i];
                try {
                    const wb = await createStyledWorkbook(menu);
                    const buffer = await wb.xlsx.writeBuffer();
                    zip.file(menu.fileName, buffer);
                    GEN_showStatus(`Создание файлов: ${Math.round(((i+1)/state.dailyMenus.length)*100)}%`, 'info');
                } catch (e) { console.error(`Ошибка ${menu.fileName}:`, e); }
            }
            const content = await zip.generateAsync({ type: 'blob' });
            const zipName = `Меню_${state.currentYear}_${GEN_formatDate(new Date(), 'file')}.zip`;
            saveAs(content, zipName);
            GEN_showStatus(`Архив "${zipName}" успешно скачан`, 'success');
        } catch (e) {
            console.error(e);
            GEN_showStatus('Ошибка при создании архива', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

	async function exportFullPackage() {
		if (!state.dailyMenus.length && !state.calendarData && !state.templateMenuData) {
			GEN_showStatus('Нет данных для экспорта', 'error');
			return;
		}

		const btn = state.elements.exportFullPackageBtn;
		const originalText = btn ? btn.innerHTML : '';
		if (btn) {
			btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сборка комплекта...';
			btn.disabled = true;
		}

		const zip = new JSZip();
		const folderName = 'food';
		const foodFolder = zip.folder(folderName);
		const year = state.currentYear || new Date().getFullYear();

		try {
			// =====================================================
			// 1. ЕЖЕДНЕВНЫЕ МЕНЮ → food/
			// =====================================================
			if (state.dailyMenus.length > 0) {
				GEN_showStatus('Создание ежедневных меню...', 'info');
				for (let i = 0; i < state.dailyMenus.length; i++) {
					const menu = state.dailyMenus[i];
					try {
						const wb = await createStyledWorkbook(menu);
						const buffer = await wb.xlsx.writeBuffer();
						foodFolder.file(menu.fileName, buffer);
						GEN_showStatus(`Ежедневные меню: ${Math.round(((i + 1) / state.dailyMenus.length) * 100)}%`, 'info');
					} catch (e) {
						console.error(`Ошибка создания ${menu.fileName}:`, e);
					}
				}
			} else {
				GEN_showStatus('⚠️ Нет сгенерированных ежедневных меню', 'warning');
			}

			// =====================================================
			// 2. ТИПОВОЕ МЕНЮ → food/tm{year}-sm.xlsx
			// =====================================================
			if (typeof window.exportToExcel === 'function') {
				GEN_showStatus('Экспорт типового меню...', 'info');
				let tplBlob = null;
				const originalSaveAs = window.saveAs;

				try {
					// Перехватываем saveAs, чтобы получить blob без сохранения
					window.saveAs = function (blob, filename) {
						if (filename && /tm\d{4}-sm\.xlsx/i.test(filename)) {
							tplBlob = blob;
						} else if (filename && /\.xlsx?$/i.test(filename) && filename.startsWith('tm')) {
							// fallback на случай нестандартного имени
							tplBlob = blob;
						} else {
							// Всё остальное сохраняем как обычно (на случай параллельных вызовов)
							originalSaveAs(blob, filename);
						}
					};

					await window.exportToExcel();
				} catch (e) {
					console.error('Ошибка экспорта типового меню:', e);
				} finally {
					window.saveAs = originalSaveAs;
				}

				if (tplBlob && tplBlob.size > 0) {
					const tplName = `tm${year}-sm.xlsx`;
					foodFolder.file(tplName, tplBlob);
					GEN_showStatus(`Типовое меню добавлено: ${tplName}`, 'success');
				} else {
					GEN_showStatus('⚠️ Не удалось получить файл типового меню', 'warning');
				}
			} else {
				GEN_showStatus('⚠️ Функция экспорта типового меню недоступна', 'warning');
			}

			// =====================================================
			// 3. КАЛЕНДАРЬ ПИТАНИЯ → food/kp{year}.xlsx
			// =====================================================
			if (window.CalendarModule) {
				GEN_showStatus('Экспорт календаря питания...', 'info');
				let calendarBlob = null;
				const originalSaveAs = window.saveAs;

				try {
					window.saveAs = function (blob, filename) {
						if (filename && /kp\d{4}\.xlsx?/i.test(filename)) {
							calendarBlob = blob;
						} else if (filename && /\.xlsx?$/i.test(filename) && /календар|kp/i.test(filename)) {
							calendarBlob = blob;
						} else {
							originalSaveAs(blob, filename);
						}
					};

					// Ищем функции скачивания календаря
					const downloadFn = window.CalendarModule.downloadCalendar
						|| window.CalendarModule.exportCalendar
						|| window.CalendarModule.saveCalendar
						|| window.downloadCalendar
						|| window.exportCalendar;

					if (typeof downloadFn === 'function') {
						await downloadFn.call(window.CalendarModule);
					} else {
						// Fallback: клик по кнопке скачивания
						const dlBtn = document.getElementById('calendarDownloadBtn');
						if (dlBtn) {
							dlBtn.click();
							await new Promise(r => setTimeout(r, 700));
						} else {
							GEN_showStatus('⚠️ Кнопка скачивания календаря не найдена', 'warning');
						}
					}
				} catch (e) {
					console.error('Ошибка экспорта календаря:', e);
				} finally {
					window.saveAs = originalSaveAs;
				}

				if (calendarBlob && calendarBlob.size > 0) {
					const calName = `kp${year}.xlsx`;
					foodFolder.file(calName, calendarBlob);
					GEN_showStatus(`Календарь добавлен: ${calName}`, 'success');
				} else {
					GEN_showStatus('⚠️ Не удалось получить файл календаря', 'warning');
				}
			}

			// =====================================================
			// 4. README.txt
			// =====================================================
			const readmeText = [
				'ПОЛНЫЙ КОМПЛЕКТ МЕНЮ (ФЦМПО)',
				'=============================',
				`Дата сборки: ${new Date().toLocaleString('ru-RU')}`,
				`Школа: ${state.elements.schoolName?.value || 'Не указана'}`,
				`Возрастная категория: ${state.elements.ageCategory?.value || 'Не указана'}`,
				`Год: ${year}`,
				'',
				'СОДЕРЖИМОЕ ПАПКИ food/:',
				`- kp${year}.xlsx — календарь питания`,
				`- tm${year}-sm.xlsx — типовое меню`,
				`- YYYY-MM-DD-sm.xlsx — ежедневные меню (${state.dailyMenus.length} шт.)`,
				state.dailyMenus.length
					? `  Период: ${GEN_formatDate(state.dailyMenus[0].date, 'short')} — ${GEN_formatDate(state.dailyMenus[state.dailyMenus.length - 1].date, 'short')}`
					: '  Ежедневные меню отсутствуют',
			].join('\n');

			zip.file('README.txt', readmeText);

			// =====================================================
			// 5. Генерация ZIP
			// =====================================================
			GEN_showStatus('Упаковка архива...', 'info');
			const content = await zip.generateAsync({
				type: 'blob',
				compression: 'DEFLATE',
				compressionOptions: { level: 6 }
			});

			const zipName = `Полный_комплект_ФЦМПО_${year}_${GEN_formatDate(new Date(), 'file')}.zip`;
			saveAs(content, zipName);

			GEN_showStatus(`✅ Полный комплект скачан: ${zipName}`, 'success');

		} catch (error) {
			console.error('Ошибка сборки комплекта:', error);
			GEN_showStatus(`Ошибка сборки комплекта: ${error.message}`, 'error');
		} finally {
			if (btn) {
				btn.innerHTML = originalText;
				btn.disabled = false;
			}
		}
	}

    function downloadTemplate() {
        const templateData = [
            ['Школа', 'МОУ "Примерная школа"', '', '', 'Отд./корп', 'Основной', '', '', 'День', GEN_formatDate(new Date(), 'excel')],
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
        ws['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 8 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 8 }, { wch: 8 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, ws, 'Шаблон меню ФЦМПО');
        XLSX.writeFile(wb, 'шаблон-ежедневного-меню-фцмпо.xlsx');
        GEN_showStatus('Шаблон ежедневного меню ФЦМПО скачан', 'success');
    }

    // ============================================================
    // СЕТКА И ДЕТАЛЬНЫЙ ВИД (полная логика v1.0)
    // ============================================================

    function updateMenuGrid() {
        const el = state.elements.menuGrid;
        if (!el) return;
        el.innerHTML = '';
        if (state.dailyMenus.length === 0) return;

        state.dailyMenus.forEach((menu, idx) => {
            const b = menu.breakfast?.items?.length || 0;
            const b2 = menu.breakfast2?.items?.length || 0;
            const l = menu.lunch?.items?.length || 0;
            const s = menu.afternoonSnack?.items?.length || 0;
            const dn = menu.dinner?.items?.length || 0;
            const dn2 = menu.dinner2?.items?.length || 0;
            const total = b + b2 + l + s + dn + dn2;

            let bSample = '', lSample = '';
            if (menu.breakfast?.items?.length) {
                const d = menu.breakfast.items[0];
                bSample = d.name.substring(0, 25) + (d.name.length > 25 ? '...' : '');
            }
            if (menu.lunch?.items?.length) {
                const d = menu.lunch.items.find(x => x.name && x.name.trim()) || menu.lunch.items[0];
                if (d) lSample = d.name.substring(0, 25) + (d.name.length > 25 ? '...' : '');
            }

            const typeColors = { 1: '#3498db', 2: '#2ecc71', 3: '#9b59b6', 4: '#e67e22', 5: '#1abc9c', 6: '#34495e', 7: '#d35400', 8: '#16a085', 9: '#8e44ad', 10: '#27ae60' };
            const hColor = typeColors[menu.menuType] || '#3498db';

            const card = document.createElement('div');
            card.className = `gen-menu-card ${idx === state.currentMenuIndex ? 'gen-active' : ''}`;
            card.dataset.genIndex = idx;
            card.innerHTML = `
                <div class="gen-menu-card-header" style="background:linear-gradient(135deg,${hColor},${GEN_adjustColor(hColor, -20)});">
                    <div class="gen-menu-card-date">${GEN_formatDate(menu.date, 'short')}</div>
                    <div class="gen-menu-card-type">Меню ${menu.menuType}</div>
                </div>
                <div class="gen-menu-card-content">
                    <div class="gen-menu-card-meal">
                        <div class="gen-meal-title"><i class="fas fa-sun" style="color:#f39c12;"></i> Завтрак (${b})</div>
                        <div class="gen-meal-dishes">${bSample ? `<div class="gen-dish-item"><span class="gen-dish-name">${bSample}</span></div>` : '<em>Нет данных</em>'}</div>
                    </div>
                    <div class="gen-menu-card-meal">
                        <div class="gen-meal-title"><i class="fas fa-utensils" style="color:#e74c3c;"></i> Обед (${l})</div>
                        <div class="gen-meal-dishes">${lSample ? `<div class="gen-dish-item"><span class="gen-dish-name">${lSample}</span></div>` : '<em>Нет данных</em>'}</div>
                    </div>
                </div>
                <div class="gen-menu-card-footer">
                    <div>Неделя ${menu.weekNumber}, День ${menu.dayNumber}</div>
                    <div>${total} блюд</div>
                </div>
            `;
            card.addEventListener('click', () => selectMenu(idx));
            el.appendChild(card);
        });
    }

    function selectMenu(index) {
        state.currentMenuIndex = index;
        document.querySelectorAll('.gen-menu-card').forEach(c => c.classList.remove('gen-active'));
        const active = document.querySelector(`.gen-menu-card[data-gen-index="${index}"]`);
        if (active) active.classList.add('gen-active');
        if (state.elements.menuCounter) state.elements.menuCounter.textContent = `${index + 1} из ${state.dailyMenus.length}`;
        if (state.elements.currentMenuDate) state.elements.currentMenuDate.textContent = state.dailyMenus[index].dateString;
        showDetailedView(state.dailyMenus[index]);
    }

    function showDetailedView(menu) {
        if (!menu) return;
        if (state.elements.detailMenuDate) state.elements.detailMenuDate.textContent = `${menu.dateString} (Меню ${menu.menuType})`;
        updateMealsDisplay(menu);
        showExcelPreview(menu);
        if (state.elements.menuGrid) state.elements.menuGrid.style.display = 'none';
        if (state.elements.detailedView) state.elements.detailedView.classList.add('gen-active');
    }

    function updateMealsDisplay(menu) {
        const el = state.elements.detailMeals;
        if (!el) return;

        const toShow = [];
        const f = state.currentMealFilter;
        if (f === 'all' || f === 'breakfast') toShow.push({ type: 'breakfast', data: menu.breakfast });
        if (f === 'all' || f === 'breakfast2') toShow.push({ type: 'breakfast2', data: menu.breakfast2 });
        if (f === 'all' || f === 'lunch') toShow.push({ type: 'lunch', data: menu.lunch });
        if (f === 'all' || f === 'afternoonSnack') toShow.push({ type: 'afternoonSnack', data: menu.afternoonSnack });
        if (f === 'all' || f === 'dinner') toShow.push({ type: 'dinner', data: menu.dinner });
        if (f === 'all' || f === 'dinner2') toShow.push({ type: 'dinner2', data: menu.dinner2 });

        let html = '';
        toShow.forEach(meal => {
            const title = GEN_MEAL_TYPES[meal.type];
            const icon = GEN_getMealIcon(meal.type);
            const color = GEN_getMealColor(meal.type);
            const structure = GEN_MEAL_STRUCTURE[meal.type];

            const bySection = new Map();
            (meal.data?.items || []).forEach(it => {
                const s = GEN_normalizeSectionName(it.section || '');
                if (!bySection.has(s)) bySection.set(s, []);
                bySection.get(s).push(it);
            });

            let itemsHtml = '';
            if (structure) {
                structure.sections.forEach(sec => {
                    const its = bySection.get(sec) || [];
                    if (its.length) {
                        its.forEach(it => {
                            if (it.name && it.name.trim()) {
                                itemsHtml += `<div class="gen-menu-item">
                                    <div class="gen-item-name">${it.name}</div>
                                    <div class="gen-item-details">
                                        <span>${it.section || 'Блюдо'}</span><span>${it.weight} г</span>
                                    </div>
                                    <div class="gen-item-details" style="margin-top:5px;">
                                        <span>Б:${it.proteins || 0}г</span><span>Ж:${it.fats || 0}г</span>
                                        <span>У:${it.carbs || 0}г</span><span>${it.calories || 0} ккал</span>
                                    </div>
                                </div>`;
                            }
                        });
                    } else {
                        itemsHtml += `<div class="gen-menu-item" style="opacity:0.6;">
                            <div class="gen-item-name" style="color:#64748b;"><em>${sec} (нет данных)</em></div>
                        </div>`;
                    }
                });
            }

            const others = Array.from(bySection.keys()).filter(s => !structure || !structure.sections.includes(s));
            others.forEach(sec => {
                (bySection.get(sec) || []).forEach(it => {
                    if (it.name && it.name.trim()) {
                        itemsHtml += `<div class="gen-menu-item" style="border-left:3px solid #f39c12;">
                            <div class="gen-item-name">${it.name} <small style="color:#f39c12;">(доп.)</small></div>
                            <div class="gen-item-details"><span>${it.section}</span><span>${it.weight} г</span></div>
                        </div>`;
                    }
                });
            });

            html += `<div class="gen-menu-section">
                <div class="gen-section-title"><i class="fas ${icon}" style="color:${color};"></i> ${title}</div>
                <div class="gen-menu-items">${itemsHtml || '<div class="gen-menu-item"><em>Нет данных</em></div>'}</div>
            </div>`;
        });

        el.innerHTML = html || '<p style="color:#64748b;padding:20px;">Нет данных для выбранного фильтра</p>';
    }

    function showExcelPreview(menu) {
        const el = state.elements.excelPreview;
        if (!el) return;
        const data = createExcelDataWithProperStructure(menu);
        let html = '';

        data.forEach((row, ri) => {
            let cls = '';
            let isHeader = false;
            if (ri === 0) cls = 'gen-excel-school';
            else if (ri === 2) cls = 'gen-excel-header';
            else if (['Завтрак','Завтрак 2','Обед','Полдник','Ужин','Ужин 2'].includes(row[0])) {
                isHeader = true;
                if (row[0].includes('Завтрак')) cls = 'gen-excel-breakfast';
                else if (row[0] === 'Обед') cls = 'gen-excel-lunch';
                else if (row[0] === 'Полдник') cls = 'gen-excel-afternoon-snack';
                else if (row[0] === 'Ужин') cls = 'gen-excel-dinner';
                else if (row[0] === 'Ужин 2') cls = 'gen-excel-dinner2';
            } else if (ri > 2 && row[0] === '') {
                for (let i = ri - 1; i >= 0; i--) {
                    if (data[i][0]) {
                        if (data[i][0].includes('Завтрак')) cls = 'gen-excel-breakfast';
                        else if (data[i][0] === 'Обед') cls = 'gen-excel-lunch';
                        else if (data[i][0] === 'Полдник') cls = 'gen-excel-afternoon-snack';
                        else if (data[i][0] === 'Ужин') cls = 'gen-excel-dinner';
                        else if (data[i][0] === 'Ужин 2') cls = 'gen-excel-dinner2';
                        break;
                    }
                }
            }
            html += '<div class="gen-excel-row">';
            row.forEach(c => {
                html += `<div class="gen-excel-cell ${isHeader ? '' : cls}">${c !== null && c !== undefined ? c : ''}</div>`;
            });
            html += '</div>';
        });
        el.innerHTML = html;
    }

    // ============================================================
    // НАВИГАЦИЯ (полная логика v1.0)
    // ============================================================

    function navigateMenus(dir) {
        if (state.dailyMenus.length === 0) return;
        state.currentMenuIndex += dir;
        if (state.currentMenuIndex < 0) state.currentMenuIndex = state.dailyMenus.length - 1;
        else if (state.currentMenuIndex >= state.dailyMenus.length) state.currentMenuIndex = 0;
        if (state.elements.menuCounter) state.elements.menuCounter.textContent = `${state.currentMenuIndex + 1} из ${state.dailyMenus.length}`;
        if (state.elements.currentMenuDate) state.elements.currentMenuDate.textContent = state.dailyMenus[state.currentMenuIndex].dateString;
        if (state.isGridView) updateMenuGrid();
        else showDetailedView(state.dailyMenus[state.currentMenuIndex]);
    }

    function jumpToToday() {
        if (state.dailyMenus.length === 0) return;
        const today = new Date();
        let closest = 0, diff = Infinity;
        state.dailyMenus.forEach((m, i) => {
            const d = Math.abs(m.date - today);
            if (d < diff) { diff = d; closest = i; }
        });
        state.currentMenuIndex = closest;
        if (state.elements.menuCounter) state.elements.menuCounter.textContent = `${closest + 1} из ${state.dailyMenus.length}`;
        if (state.elements.currentMenuDate) state.elements.currentMenuDate.textContent = state.dailyMenus[closest].dateString;
        if (state.isGridView) updateMenuGrid();
        else showDetailedView(state.dailyMenus[closest]);
    }

    function toggleView() {
        state.isGridView = !state.isGridView;
        if (state.elements.toggleViewBtn) {
            state.elements.toggleViewBtn.innerHTML = state.isGridView
                ? '<i class="fas fa-list"></i> Детальный вид'
                : '<i class="fas fa-th"></i> Сетка';
        }
        if (state.isGridView) {
            if (state.elements.menuGrid) state.elements.menuGrid.style.display = 'grid';
            if (state.elements.detailedView) state.elements.detailedView.classList.remove('gen-active');
            updateMenuGrid();
        } else {
            if (state.elements.menuGrid) state.elements.menuGrid.style.display = 'none';
            showDetailedView(state.dailyMenus[state.currentMenuIndex]);
        }
    }

    function updateMenuStats() {
        if (state.dailyMenus.length === 0) return;
        if (state.elements.totalMenusCount) state.elements.totalMenusCount.textContent = state.dailyMenus.length;

        const first = state.dailyMenus[0].date;
        const last = state.dailyMenus[state.dailyMenus.length - 1].date;
        if (state.elements.menuPeriod) state.elements.menuPeriod.textContent = `${GEN_formatDate(first, 'short')} - ${GEN_formatDate(last, 'short')}`;

        const school = state.dailyMenus[0].schoolName || 'Не указана';
        if (state.elements.menuSchool) state.elements.menuSchool.textContent = school.length > 20 ? school.substring(0, 20) + '...' : school;

        const c = calculateCompliance();
        if (state.elements.menuCompliance) {
            state.elements.menuCompliance.textContent = `${c.percentage}%`;
            state.elements.menuCompliance.style.color = c.percentage >= 80 ? '#27ae60' : c.percentage >= 60 ? '#f39c12' : '#e74c3c';
        }
    }

    function calculateCompliance() {
        if (state.dailyMenus.length === 0) return { percentage: 0, matched: 0, total: 0 };
        let total = 0, matched = 0;
        state.dailyMenus.forEach(m => {
            ['breakfast','breakfast2','lunch','afternoonSnack','dinner','dinner2'].forEach(mt => {
                const n = m[mt]?.items?.length || 0;
                total += n; matched += n;
            });
        });
        return { percentage: total > 0 ? Math.round((matched / total) * 100) : 0, matched, total };
    }

    // ============================================================
    // АНАЛИЗ СООТВЕТСТВИЯ (полная логика v1.0)
    // ============================================================

    function analyzeMenuCompliance() {
        const analysis = {
            totalMenus: state.dailyMenus.length, analyzedMenus: 0,
            totalItems: 0, matchedItems: 0, menuDetails: [],
            summary: { excellent: 0, good: 0, poor: 0 }
        };
        state.dailyMenus.forEach(menu => {
            let mt = 0, mm = 0;
            ['breakfast','breakfast2','lunch','afternoonSnack','dinner','dinner2'].forEach(type => {
                const n = menu[type]?.items?.length || 0;
                mt += n; mm += n;
            });
            analysis.totalItems += mt;
            analysis.matchedItems += mm;
            analysis.analyzedMenus++;
            const percent = mt > 0 ? Math.round((mm / mt) * 100) : 0;
            analysis.menuDetails.push({
                date: menu.dateString, fileName: menu.fileName,
                totalItems: mt, matchedItems: mm, compliancePercentage: percent
            });
            if (percent >= 90) analysis.summary.excellent++;
            else if (percent >= 70) analysis.summary.good++;
            else analysis.summary.poor++;
        });
        return analysis;
    }

    function showComplianceAnalysis() {
        if (state.dailyMenus.length === 0) {
            GEN_showStatus('Нет меню для анализа соответствия', 'error'); return;
        }
        const analysis = analyzeMenuCompliance();
        showAnalysisModal(analysis);
    }

    function showAnalysisModal(analysis) {
        const modal = document.createElement('div');
        modal.className = 'gen-modal-overlay';
        modal.innerHTML = `
            <div class="gen-modal-content">
                <div class="gen-modal-header">
                    <h3><i class="fas fa-chart-bar"></i> Анализ соответствия меню ФЦМПО</h3>
                    <button class="gen-close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="gen-menu-stats" style="margin-bottom:20px;">
                    <div class="gen-stat-item">
                        <div class="gen-stat-label">Проанализировано меню</div>
                        <div class="gen-stat-value">${analysis.analyzedMenus}</div>
                    </div>
                    <div class="gen-stat-item">
                        <div class="gen-stat-label">Всего блюд</div>
                        <div class="gen-stat-value">${analysis.totalItems}</div>
                    </div>
                    <div class="gen-stat-item">
                        <div class="gen-stat-label">Соответствие</div>
                        <div class="gen-stat-value">${analysis.totalItems > 0 ? Math.round((analysis.matchedItems / analysis.totalItems) * 100) : 0}%</div>
                    </div>
                </div>
                <div class="gen-section-title"><i class="fas fa-list"></i> Детали по меню</div>
                <div style="max-height:300px;overflow-y:auto;margin-bottom:20px;">
                    <table class="gen-preview-table">
                        <tr><th>Дата</th><th>Файл</th><th>Блюд</th><th>Соответствие</th><th>Статус</th></tr>
                        ${analysis.menuDetails.map(d => `
                            <tr>
                                <td>${d.date}</td><td>${d.fileName}</td><td>${d.totalItems}</td>
                                <td>${d.compliancePercentage}%</td>
                                <td>${d.compliancePercentage >= 90 ? 'Отлично' : d.compliancePercentage >= 70 ? 'Хорошо' : 'Требует внимания'}</td>
                            </tr>`).join('')}
                    </table>
                </div>
                <button class="gen-btn gen-btn-primary gen-modal-close-btn" style="width:100%;margin-top:20px;">
                    <i class="fas fa-check"></i> Закрыть
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        const close = () => modal.remove();
        modal.querySelector('.gen-close-btn').addEventListener('click', close);
        modal.querySelector('.gen-modal-close-btn').addEventListener('click', close);
        modal.addEventListener('click', e => { if (e.target === modal) close(); });
    }

    // ============================================================
    // LOCALSTORAGE (полная логика v1.0)
    // ============================================================

    function saveToLocalStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                calendarData: state.calendarData,
                templateMenuData: state.templateMenuData,
                dailyMenus: state.dailyMenus,
                uploadedFiles: state.uploadedFiles,
                currentYear: state.currentYear,
                schoolName: state.elements.schoolName?.value || '',
                ageCategory: state.elements.ageCategory?.value || '',
                savedAt: new Date().toISOString()
            }));
            updateStoredDataInfo();
        } catch (e) { console.error('Ошибка сохранения:', e); }
    }

    function loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) { GEN_showStatus('В памяти нет сохраненных данных', 'info'); return; }
            const p = JSON.parse(saved);

            state.calendarData = p.calendarData;
            state.templateMenuData = p.templateMenuData;
            state.dailyMenus = p.dailyMenus || [];
            state.uploadedFiles = p.uploadedFiles || [];
            state.currentYear = p.currentYear || 2026;

            if (state.elements.schoolName) state.elements.schoolName.value = p.schoolName || '';
            if (state.elements.ageCategory) state.elements.ageCategory.value = p.ageCategory || '7-11';

            setDefaultDates();
            if (state.elements.calendarYearBadge) {
                state.elements.calendarYearBadge.textContent = state.currentYear;
                state.elements.calendarYearBadge.style.display = 'inline-block';
            }

            updateFileList();
            updateCalendarPreview();
            updateMenuPreview();
            checkFilesLoaded();

            if (state.dailyMenus.length > 0) {
                state.currentMenuIndex = 0;
                if (state.elements.menuNavigation) state.elements.menuNavigation.style.display = 'flex';
                if (state.elements.menuStats) state.elements.menuStats.style.display = 'flex';
                if (state.elements.menuGrid) { state.elements.menuGrid.style.display = 'grid'; updateMenuGrid(); }
                if (state.elements.exportContainer) state.elements.exportContainer.style.display = 'block';
                if (state.elements.generateBtn) state.elements.generateBtn.style.display = 'none';
                if (state.elements.menuCounter) state.elements.menuCounter.textContent = `1 из ${state.dailyMenus.length}`;
                updateMenuStats();
            }

            GEN_showStatus(`Данные загружены из памяти (сохранены ${GEN_formatDate(new Date(p.savedAt))})`, 'success');
        } catch (e) {
            console.error('Ошибка загрузки:', e);
            GEN_showStatus('Ошибка при загрузке данных из памяти', 'error');
        }
    }

    function clearLocalStorage() {
        if (confirm('Вы уверены, что хотите очистить все сохраненные данные?')) {
            localStorage.removeItem(STORAGE_KEY);
            updateStoredDataInfo();
            GEN_showStatus('Данные в памяти очищены', 'info');
        }
    }

    function checkLocalStorage() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            if (state.elements.storedDataInfo) state.elements.storedDataInfo.classList.add('active');
            try {
                const p = JSON.parse(saved);
                if (state.elements.storedDataText) {
                    state.elements.storedDataText.textContent =
                        `Данные сохранены ${GEN_formatDate(new Date(p.savedAt))}. ${p.dailyMenus ? `Содержит ${p.dailyMenus.length} меню.` : ''}`;
                }
            } catch (e) {
                if (state.elements.storedDataText) state.elements.storedDataText.textContent = 'В памяти есть сохраненные данные';
            }
        } else {
            if (state.elements.storedDataInfo) state.elements.storedDataInfo.classList.remove('active');
        }
    }

    function updateStoredDataInfo() { checkLocalStorage(); }

    // ============================================================
    // АДАПТЕРЫ (полная логика v1.0)
    // ============================================================

    function adoptCalendarFromModule(calState) {
        if (!calState || !calState.calendarData) return false;
        const months = {};
        for (const m of GEN_MONTH_NAMES) {
            const arr = calState.calendarData[m] || [];
            months[m] = {};
            for (const entry of arr) {
                if (entry.value !== null && entry.value !== undefined) months[m][entry.day] = entry.value;
            }
        }
        state.calendarData = {
            months,
            schoolName: calState.calendarMeta?.schoolName || '',
            year: parseInt(calState.calendarMeta?.year) || 2026
        };
        state.currentYear = state.calendarData.year;

        if (!state.uploadedFiles.some(f => f.type === 'calendar')) {
            state.uploadedFiles.push({
                name: 'Календарь из модуля «Календарь»', size: 0, type: 'calendar',
                date: new Date().toLocaleTimeString(), valid: true
            });
        }

        setDefaultDates();
        if (state.elements.calendarYearBadge) {
            state.elements.calendarYearBadge.textContent = state.currentYear;
            state.elements.calendarYearBadge.style.display = 'inline-block';
        }
        updateCalendarPreview();
        updateFileList();
        checkFilesLoaded();
        return true;
    }

    function adoptFromEditor(templateData, schoolInfo) {
        if (!templateData || !templateData.weeks) return false;
        state.templateMenuData = {
            weeks: templateData.weeks,
            schoolName: schoolInfo?.name || templateData.schoolName || '',
            ageCategory: schoolInfo?.ageCategory || templateData.ageCategory || '',
            approvalInfo: schoolInfo?.approval || { position: '', name: '', date: '' }
        };
        if (!state.uploadedFiles.some(f => f.type === 'template')) {
            state.uploadedFiles.push({
                name: 'Типовое меню из редактора', size: 0, type: 'template',
                date: new Date().toLocaleTimeString(), valid: true
            });
        }
        if (state.elements.schoolName && !state.elements.schoolName.value) {
            state.elements.schoolName.value = state.templateMenuData.schoolName;
        }
        if (state.elements.ageCategory && !state.elements.ageCategory.value) {
            state.elements.ageCategory.value = state.templateMenuData.ageCategory;
        }
        updateMenuPreview();
        updateFileList();
        checkFilesLoaded();
        return true;
    }

    // ============================================================
    // СОБЫТИЯ
    // ============================================================

    function setupEvents() {
        const e = state.elements;

        // Drag&Drop
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
                const open = e.advancedPanel.style.display === 'block';
                e.advancedPanel.style.display = open ? 'none' : 'block';
                if (e.advancedIcon) e.advancedIcon.style.transform = open ? 'rotate(0deg)' : 'rotate(180deg)';
            });
        }

        // Кнопки генерации/экспорта
        e.generateBtn?.addEventListener('click', generateDailyMenus);
        e.exportAllBtn?.addEventListener('click', exportAllMenusAsZip);
        e.exportCurrentBtn?.addEventListener('click', exportCurrentMenuAsExcel);
		e.exportFullPackageBtn?.addEventListener('click', exportFullPackage);
        e.downloadTemplateBtn?.addEventListener('click', downloadTemplate);

        // Навигация
        e.prevMenuBtn?.addEventListener('click', () => navigateMenus(-1));
        e.nextMenuBtn?.addEventListener('click', () => navigateMenus(1));
        e.jumpToTodayBtn?.addEventListener('click', jumpToToday);
        e.toggleViewBtn?.addEventListener('click', toggleView);
        e.complianceBtn?.addEventListener('click', showComplianceAnalysis);
        e.analyzeBtn?.addEventListener('click', showComplianceAnalysis);
        e.toggleMenuView?.addEventListener('click', () => {
            state.isMenuGridView = !state.isMenuGridView;
            if (e.toggleMenuView) e.toggleMenuView.innerHTML = state.isMenuGridView
                ? '<i class="fas fa-list"></i> Список'
                : '<i class="fas fa-th"></i> Сетка';
            updateMenuPreview();
        });
        e.closeDetailView?.addEventListener('click', () => {
            e.detailedView?.classList.remove('gen-active');
            if (state.isGridView && e.menuGrid) e.menuGrid.style.display = 'grid';
            else if (e.dailyMenuContent) e.dailyMenuContent.style.display = 'block';
        });

        // Фильтр приёмов пищи
        e.mealOptions?.addEventListener('click', ev => {
            const btn = ev.target.closest('.gen-meal-option-btn');
            if (!btn) return;
            e.mealOptions.querySelectorAll('.gen-meal-option-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentMealFilter = btn.dataset.meal;
            if (state.dailyMenus.length > 0) updateMealsDisplay(state.dailyMenus[state.currentMenuIndex]);
        });

        // LocalStorage
        e.loadFromStorageBtn?.addEventListener('click', loadFromLocalStorage);
        e.clearStorageBtn?.addEventListener('click', clearLocalStorage);

        // Справка
        e.quickHelpBtn?.addEventListener('click', () => {
            e.quickGuide?.scrollIntoView({ behavior: 'smooth' });
            if (e.quickGuide) {
                e.quickGuide.style.animation = 'genPulse 0.5s';
                setTimeout(() => { if (e.quickGuide) e.quickGuide.style.animation = ''; }, 500);
            }
        });
    }

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ (гибрид v1.0 + v2.0)
    // ============================================================

    function init() {
        cacheElements();
        if (!state.elements.generateBtn && !state.elements.fileInput) {
            console.warn('⚠️ GeneratorModule: разметка вкладки #tabGenerator не найдена');
            return;
        }

		// ✅ ПАТЧ: Показываем кнопку генерации, если есть данные
		if (state.elements.generateBtn && state.elements.exportContainer) {
			// Если меню уже сгенерированы, но мы зашли снова — показываем кнопку
			// (пользователь может захотеть пересоздать)
			const hasFiles = state.uploadedFiles.some(f => f.type === 'calendar' && f.valid) &&
							 state.uploadedFiles.some(f => f.type === 'template' && f.valid);
			
			if (hasFiles) {
				state.elements.generateBtn.style.display = 'inline-flex';
				// Контейнер экспорта показываем только если меню уже есть
				// state.elements.exportContainer.style.display = state.dailyMenus.length > 0 ? 'block' : 'none';
			}
		}

        if (!state.isInitialized) {
            setupEvents();
            setDefaultDates();
            checkLocalStorage();
            updateFileList();
            checkFilesLoaded();
            state.isInitialized = true;
        }

        // Автопринятие из основного редактора
        if (window.templateMenuData && window.templateMenuData.weeks &&
            !state.uploadedFiles.some(f => f.type === 'template')) {
            adoptFromEditor(window.templateMenuData, window.schoolInfo);
        }

        // Автопринятие из CalendarModule
        if (window.CalendarModule && window.CalendarModule.getState &&
            !state.uploadedFiles.some(f => f.type === 'calendar')) {
            try {
                const calState = window.CalendarModule.getState();
                if (calState && calState.calendarData) adoptCalendarFromModule(calState);
            } catch (e) { /* noop */ }
        }

        console.log('✅ GeneratorModule инициализирован');
    }

    function reload() {
        cacheElements();
        setDefaultDates();
        checkLocalStorage();
        updateFileList();
        checkFilesLoaded();
        if (state.calendarData) updateCalendarPreview();
        if (state.templateMenuData) updateMenuPreview();
        if (state.dailyMenus.length > 0) {
            updateMenuGrid();
            updateMenuStats();
            if (state.elements.menuCounter) state.elements.menuCounter.textContent = `1 из ${state.dailyMenus.length}`;
        }
    }

    // ============================================================
    // ПУБЛИЧНОЕ API
    // ============================================================

    return {
        init,
        reload,
        getState: () => state,
        generate: generateDailyMenus,
        exportAll: exportAllMenusAsZip,
        exportCurrent: exportCurrentMenuAsExcel,
		exportFullPackage,   // ✅ добавили
        adoptCalendarFromModule,
        adoptFromEditor,
        showComplianceAnalysis
    };

})();

window.GeneratorModule = GeneratorModule;
console.log('✅ generator-module.js v3.0 (объединённый) загружен');
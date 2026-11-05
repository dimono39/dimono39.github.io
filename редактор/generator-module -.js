/**
 * ============================================================
 * МОДУЛЬ "ГЕНЕРАТОР ЕЖЕДНЕВНЫХ МЕНЮ (ФЦМПО)" v1.0
 * Подключаемый файл для PRO Редактора типового меню
 * ============================================================
 *
 * Подключение в testtm2.html (после daily-menu-module.js, до mobile-module-v3.js):
 *   <script src="generator-module.js"></script>
 *
 * Инициализация (в switchTab при переходе на #tabGenerator):
 *   GeneratorModule.init();
 *
 * Все ID элементов в разметке имеют префикс "gen-":
 *   genFileInput, genDropArea, genGenerateBtn, genMenuGrid, ...
 *
 * Все CSS-классы изолированы через #tabGenerator { ... }
 * ============================================================
 */

const GeneratorModule = (function () {
    'use strict';

    // ============================================================
    // КОНСТАНТЫ
    // ============================================================

    const STORAGE_KEY = 'schoolMenuGeneratorData_v3_fcmpo';

    // Требуемые имена файлов ФЦМПО (для подсказок)
    const GEN_REQUIRED_FILES = {
        calendar: 'kp2026.xlsx',
        template: 'tm2026-sm.xlsx'
    };

    // Структура приёмов пищи (отдельная от MEAL_STRUCTURE из testtm2.html!)
    const GEN_MEAL_STRUCTURE = {
        'breakfast': {
            name: 'Завтрак',
            sections: ['гор.блюдо', 'гор.напиток', 'хлеб', 'фрукты']
        },
        'breakfast2': {
            name: 'Завтрак 2',
            sections: ['фрукты']
        },
        'lunch': {
            name: 'Обед',
            sections: ['закуска', '1 блюдо', '2 блюдо', 'гарнир', 'напиток', 'хлеб бел.', 'хлеб черн.']
        },
        'afternoonSnack': {
            name: 'Полдник',
            sections: ['булочное', 'напиток']
        },
        'dinner': {
            name: 'Ужин',
            sections: ['гор.блюдо', 'гарнир', 'напиток', 'хлеб']
        },
        'dinner2': {
            name: 'Ужин 2',
            sections: ['кисломол.', 'булочное', 'напиток', 'фрукты']
        }
    };

    // Человекочитаемые названия приёмов пищи
    const GEN_MEAL_TYPES = {
        'breakfast': 'Завтрак',
        'breakfast2': 'Завтрак 2',
        'lunch': 'Обед',
        'afternoonSnack': 'Полдник',
        'dinner': 'Ужин',
        'dinner2': 'Ужин 2'
    };

    const GEN_MONTH_NAMES = [
        'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
        'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
    ];

    // ============================================================
    // СОСТОЯНИЕ
    // ============================================================

    let state = {
        calendarData: null,       // { schoolName, months: { month: { day: menuType } }, year }
        templateMenuData: null,   // { weeks: {...}, schoolName, ageCategory, approvalInfo }
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

        const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        return `${day} ${monthNames[date.getMonth()]} ${year} г.`;
    }

    function GEN_showStatus(message, type = 'info') {
        // Используем глобальный showStatus, если он есть (из testtm2.html)
        if (typeof window.showStatus === 'function') {
            window.showStatus(message, type);
            return;
        }
        // Fallback — локальная зона в модуле
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
        const sectionLower = section.toLowerCase().trim();

        if (sectionLower.includes('фрукт') || sectionLower === 'фрукты') return 'фрукты';

        const sectionMap = {
            'горячее блюдо': 'гор.блюдо',
            'горячий напиток': 'гор.напиток',
            'горячий напиток с витаминами': 'гор.напиток',
            'первое блюдо': '1 блюдо',
            'второе блюдо': '2 блюдо',
            'хлеб белый': 'хлеб бел.',
            'хлеб бел': 'хлеб бел.',
            'хлеб черный': 'хлеб черн.',
            'хлеб черн': 'хлеб черн.',
            'хлеб ржаной': 'хлеб черн.',
            'булочные изделия': 'булочное',
            'кисломолочный напиток': 'кисломол.',
            'кисломолочные продукты': 'кисломол.',
            'бутерброд': 'хлеб',
            'свежие фрукты': 'фрукты',
            'фрукт свежий': 'фрукты',
            'фрукт': 'фрукты',
            'овощи': 'закуска',
            'салат': 'закуска',
            'напиток': 'напиток',
            'гарнир': 'гарнир',
            'гор. блюдо': 'гор.блюдо',
            'гор. напиток': 'гор.напиток',
            'гор.напиток': 'гор.напиток',
            'гор.блюдо': 'гор.блюдо',
            '1 блюдо': '1 блюдо',
            '2 блюдо': '2 блюдо',
            'закуска': 'закуска',
            'хлеб': 'хлеб',
            'фрукты': 'фрукты'
        };

        if (sectionMap[sectionLower]) return sectionMap[sectionLower];

        for (const [key, value] of Object.entries(sectionMap)) {
            if (sectionLower.includes(key)) return value;
        }

        const standardSections = ['гор.блюдо', 'гор.напиток', 'хлеб', 'фрукты', 'напиток',
            'закуска', '1 блюдо', '2 блюдо', 'гарнир', 'хлеб бел.',
            'хлеб черн.', 'булочное', 'кисломол.'];

        for (const standard of standardSections) {
            const cleanStandard = standard.replace('.', '').replace(' ', '');
            if (sectionLower.includes(cleanStandard)) return standard;
        }

        return sectionLower;
    }

    function GEN_sortMealItemsByStructure(items, mealType) {
        if (!items || items.length === 0) return [];
        const structure = GEN_MEAL_STRUCTURE[mealType];
        if (!structure) return items;

        const normalizedItems = items.map(item => ({
            ...item,
            normalizedSection: GEN_normalizeSectionName(item.section || '')
        }));

        const sortedItems = [];
        for (const section of structure.sections) {
            const sectionItems = normalizedItems.filter(item => item.normalizedSection === section);
            sortedItems.push(...sectionItems);
        }

        const otherItems = normalizedItems.filter(item =>
            !structure.sections.includes(item.normalizedSection)
        );
        sortedItems.push(...otherItems);

        return sortedItems;
    }

    function GEN_adjustColor(color, amount) {
        let usePound = false;
        if (color[0] === '#') { color = color.slice(1); usePound = true; }

        const num = parseInt(color, 16);
        let r = (num >> 16) + amount;
        if (r > 255) r = 255; else if (r < 0) r = 0;
        let b = ((num >> 8) & 0x00FF) + amount;
        if (b > 255) b = 255; else if (b < 0) b = 0;
        let g = (num & 0x0000FF) + amount;
        if (g > 255) g = 255; else if (g < 0) g = 0;

        return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
    }

    function GEN_getMealIcon(mealType) {
        switch (mealType) {
            case 'breakfast': return 'fa-sun';
            case 'breakfast2': return 'fa-coffee';
            case 'lunch': return 'fa-utensils';
            case 'afternoonSnack': return 'fa-cookie-bite';
            case 'dinner': return 'fa-moon';
            case 'dinner2': return 'fa-glass-whiskey';
            default: return 'fa-utensils';
        }
    }

    function GEN_getMealColor(mealType) {
        switch (mealType) {
            case 'breakfast': return '#f39c12';
            case 'breakfast2': return '#e67e22';
            case 'lunch': return '#e74c3c';
            case 'afternoonSnack': return '#2ecc71';
            case 'dinner': return '#9b59b6';
            case 'dinner2': return '#3498db';
            default: return '#3498db';
        }
    }

    function GEN_getMealTypeFromName(mealName) {
        switch (mealName) {
            case 'Завтрак': return 'breakfast';
            case 'Завтрак 2': return 'breakfast2';
            case 'Обед': return 'lunch';
            case 'Полдник': return 'afternoonSnack';
            case 'Ужин': return 'dinner';
            case 'Ужин 2': return 'dinner2';
            default: return null;
        }
    }

    function GEN_getColorScheme(schemeName) {
        const schemes = {
            default: {
                school: 'cfe2f3', header: 'e0e0e0',
                breakfast: 'fff2cc', breakfast2: 'ffe699', lunch: 'd9d2e9',
                afternoonSnack: 'd0e0e3', dinner: 'f4cccc', dinner2: 'e6ccff'
            },
            bright: {
                school: 'd5e8f7', header: 'f0f0f0',
                breakfast: 'fff9cc', breakfast2: 'ffe6cc', lunch: 'e6d9f2',
                afternoonSnack: 'd0e8e3', dinner: 'ffcccc', dinner2: 'f2ccff'
            },
            pastel: {
                school: 'e8f2fb', header: 'f8f8f8',
                breakfast: 'fffde6', breakfast2: 'fff2e6', lunch: 'f2e6fa',
                afternoonSnack: 'e6f5f2', dinner: 'ffe6e6', dinner2: 'f7e6ff'
            },
            monochrome: {
                school: 'f0f0f0', header: 'e0e0e0',
                breakfast: 'f5f5f5', breakfast2: 'f0f0f0', lunch: 'ebebeb',
                afternoonSnack: 'e6e6e6', dinner: 'e0e0e0', dinner2: 'dbdbdb'
            }
        };
        return schemes[schemeName] || schemes.default;
    }

    function GEN_formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // ============================================================
    // DOM-ЭЛЕМЕНТЫ
    // ============================================================

    function cacheElements() {
        state.elements = {
            statusMessage: document.getElementById('genStatusMessage'),
            fileInput: document.getElementById('genFileInput'),
            dropArea: document.getElementById('genDropArea'),
            fileList: document.getElementById('genFileList'),
            generateBtn: document.getElementById('genGenerateBtn'),
            exportAllBtn: document.getElementById('genExportAllBtn'),
            exportCurrentBtn: document.getElementById('genExportCurrentBtn'),
            downloadTemplateBtn: document.getElementById('genDownloadTemplateBtn'),
            loadFromStorageBtn: document.getElementById('genLoadFromStorageBtn'),
            clearStorageBtn: document.getElementById('genClearStorageBtn'),
            storedDataInfo: document.getElementById('genStoredDataInfo'),
            storedDataText: document.getElementById('genStoredDataText'),
            calendarPreview: document.getElementById('genCalendarData'),
            menuPreview: document.getElementById('genMenuData'),
            calendarYearBadge: document.getElementById('genCalendarYearBadge'),
            toggleMenuViewBtn: document.getElementById('genToggleMenuView'),
            dailyMenuContent: document.getElementById('genDailyMenuContent'),
            currentMenuDate: document.getElementById('genCurrentMenuDate'),
            currentMenuInfo: document.getElementById('genCurrentMenuInfo'),
            menuNavigation: document.getElementById('genMenuNavigation'),
            prevMenuBtn: document.getElementById('genPrevMenuBtn'),
            nextMenuBtn: document.getElementById('genNextMenuBtn'),
            jumpToTodayBtn: document.getElementById('genJumpToTodayBtn'),
            toggleViewBtn: document.getElementById('genToggleViewBtn'),
            complianceBtn: document.getElementById('genComplianceBtn'),
            menuCounter: document.getElementById('genMenuCounter'),
            menuGrid: document.getElementById('genMenuGrid'),
            menuStats: document.getElementById('genMenuStats'),
            totalMenusCount: document.getElementById('genTotalMenusCount'),
            menuPeriod: document.getElementById('genMenuPeriod'),
            menuSchool: document.getElementById('genMenuSchool'),
            menuCompliance: document.getElementById('genMenuCompliance'),
            detailedView: document.getElementById('genDetailedView'),
            detailMenuDate: document.getElementById('genDetailMenuDate'),
            mealOptions: document.getElementById('genMealOptions'),
            detailMeals: document.getElementById('genDetailMeals'),
            excelPreview: document.getElementById('genExcelPreview'),
            closeDetailView: document.getElementById('genCloseDetailView'),
            startDateInput: document.getElementById('genStartDate'),
            endDateInput: document.getElementById('genEndDate'),
            calendarYear: document.getElementById('genCalendarYear'),
            analyzeBtn: document.getElementById('genAnalyzeBtn'),
            quickHelpBtn: document.getElementById('genQuickHelpBtn'),
            advancedSettings: document.getElementById('genAdvancedSettings'),
            fileValidation: document.getElementById('genFileValidation'),
            schoolNameInput: document.getElementById('genSchoolName'),
            ageCategoryInput: document.getElementById('genAgeCategory'),
            colorSchemeInput: document.getElementById('genColorScheme'),
            quickGuide: document.getElementById('genQuickGuide'),
            schoolNameBadge: document.getElementById('genSchoolNameBadge')
        };
    }

    // ============================================================
    // ДАТЫ
    // ============================================================

    function setDefaultDates() {
        const year = state.currentYear;
        const today = new Date();

        const start = state.elements.startDateInput;
        const end = state.elements.endDateInput;

        if (!start || !end) return;

        start.min = `${year}-01-01`;
        start.max = `${year}-12-31`;
        end.min = `${year}-01-01`;
        end.max = `${year}-12-31`;

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        start.value = GEN_formatDateForInput(firstDayOfMonth);

        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        end.value = GEN_formatDateForInput(lastDayOfMonth);

        if (state.elements.calendarYear) {
            state.elements.calendarYear.textContent = year;
        }
    }

    // ============================================================
    // ОБРАБОТКА ФАЙЛОВ
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

                    let fileType = '';
                    const fileNameLower = file.name.toLowerCase();

                    if (fileNameLower.includes('kp') && file.name.match(/\d{4}/)) {
                        fileType = 'calendar';
                        processCalendarFile(workbook, file.name);
                    } else if (fileNameLower.includes('tm') && fileNameLower.includes('-sm')) {
                        fileType = 'template';
                        processTemplateFile(workbook, file.name);
                    } else {
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                        const range = XLSX.utils.decode_range(firstSheet['!ref']);

                        let hasCalendarStructure = false;
                        let hasTemplateStructure = false;

                        for (let row = 0; row <= Math.min(5, range.e.r); row++) {
                            const cellA = firstSheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
                            if (cellA && cellA.v) {
                                const cellValue = cellA.v.toString().toLowerCase();
                                if (cellValue.includes('календарь') || cellValue.includes('январь') || cellValue.includes('февраль')) {
                                    hasCalendarStructure = true;
                                }
                                if (cellValue.includes('прием пищи') && cellValue.includes('раздел')) {
                                    hasTemplateStructure = true;
                                }
                            }
                        }

                        if (hasCalendarStructure) {
                            fileType = 'calendar';
                            processCalendarFile(workbook, file.name);
                        } else if (hasTemplateStructure) {
                            fileType = 'template';
                            processTemplateFile(workbook, file.name);
                        } else {
                            GEN_showStatus(`Не удалось определить тип файла ${file.name}`, 'error');
                            return;
                        }
                    }

                    if (fileType === 'calendar' && !fileNameLower.includes('kp')) {
                        GEN_showStatus(`Рекомендуемое имя файла календаря: ${GEN_REQUIRED_FILES.calendar}`, 'warning');
                    }
                    if (fileType === 'template' && !fileNameLower.includes('tm')) {
                        GEN_showStatus(`Рекомендуемое имя файла типового меню: ${GEN_REQUIRED_FILES.template}`, 'warning');
                    }

                    const validationResult = validateFileStructure(workbook, fileType);
                    showValidationResult(validationResult, file.name);

                    state.uploadedFiles.push({
                        name: file.name,
                        size: file.size,
                        type: fileType,
                        date: new Date().toLocaleTimeString(),
                        valid: validationResult.isValid
                    });

                    updateFileList();
                    checkFilesLoaded();
                    saveToLocalStorage();
                } catch (error) {
                    console.error('Ошибка при чтении файла:', error);
                    GEN_showStatus(`Ошибка при чтении файла ${file.name}: ${error.message}`, 'error');
                }
            };
            reader.onerror = () => GEN_showStatus(`Ошибка при чтении файла ${file.name}`, 'error');
            reader.readAsArrayBuffer(file);
        });
    }

    function validateFileStructure(workbook, fileType) {
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        const result = { isValid: true, errors: [], warnings: [] };

        if (fileType === 'calendar') {
            let hasMonthRow = false;
            let hasDayNumbers = false;

            for (let i = 0; i < Math.min(20, data.length); i++) {
                if (data[i] && data[i][0]) {
                    const cellValue = data[i][0].toString().toLowerCase();
                    if (GEN_MONTH_NAMES.some(m => cellValue.includes(m))) hasMonthRow = true;
                    if (!isNaN(parseInt(cellValue)) && parseInt(cellValue) >= 1 && parseInt(cellValue) <= 31) {
                        hasDayNumbers = true;
                    }
                }
            }

            if (!hasMonthRow) result.warnings.push('Не найдена строка с названиями месяцев');
            if (!hasDayNumbers) result.warnings.push('Возможно некорректные заголовки дней');

            let hasSchoolInfo = false;
            for (let i = 0; i < Math.min(5, data.length); i++) {
                if (data[i] && data[i].some(cell => cell && cell.toString().toLowerCase().includes('школ'))) {
                    hasSchoolInfo = true;
                    break;
                }
            }
            if (!hasSchoolInfo) result.warnings.push('Не найдена информация о школе');

        } else if (fileType === 'template') {
            let headerRowIndex = -1;
            for (let i = 0; i < Math.min(15, data.length); i++) {
                if (data[i] && data[i][2] === 'Прием пищи' && data[i][3] === 'Раздел меню') {
                    headerRowIndex = i;
                    break;
                }
            }
            if (headerRowIndex === -1) {
                for (let i = 0; i < Math.min(15, data.length); i++) {
                    if (data[i] && data[i][0] === 'Неделя' && data[i][1] === 'День недели') {
                        headerRowIndex = i;
                        break;
                    }
                }
            }
            if (headerRowIndex === -1) {
                result.errors.push('Не найдена строка заголовков типового меню');
                result.isValid = false;
            }

            let hasMealData = false;
            for (let i = 0; i < Math.min(30, data.length); i++) {
                if (data[i] && data[i][0] &&
                    ['Завтрак', 'Обед', 'Ужин', 'Полдник'].includes(data[i][0].toString().trim())) {
                    hasMealData = true;
                    break;
                }
            }
            if (!hasMealData) result.warnings.push('Не найдены данные о приемах пищи');

            let hasApprovalInfo = false;
            for (let i = 0; i < Math.min(10, data.length); i++) {
                if (data[i] && data[i].some(cell => cell && cell.toString().toLowerCase().includes('утвержд'))) {
                    hasApprovalInfo = true;
                    break;
                }
            }
            if (!hasApprovalInfo) result.warnings.push('Не найдена информация об утверждении меню');
        }

        if (data.length < 3) result.warnings.push('Файл содержит слишком мало строк');

        return result;
    }

    function showValidationResult(validationResult, fileName) {
        if (validationResult.isValid) {
            if (state.elements.fileValidation) {
                state.elements.fileValidation.style.display = 'flex';
            }
            if (validationResult.warnings.length > 0) {
                GEN_showStatus(`Файл ${fileName} загружен (есть предупреждения: ${validationResult.warnings.join(', ')})`, 'warning');
            } else {
                GEN_showStatus(`Файл ${fileName} загружен и проверен`, 'success');
            }
        } else {
            GEN_showStatus(`Ошибка в файле ${fileName}: ${validationResult.errors.join(', ')}`, 'error');
        }
    }

    function updateFileList() {
        const el = state.elements.fileList;
        if (!el) return;

        el.innerHTML = '';

        if (state.uploadedFiles.length === 0) {
            el.innerHTML = '<p style="text-align:center;color:#6c757d;padding:20px;"><i class="fas fa-file-excel fa-2x" style="margin-bottom:10px;"></i><br>Файлы ФЦМПО не загружены</p>';
            return;
        }

        state.uploadedFiles.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = `gen-file-item ${file.valid ? 'gen-success' : 'gen-error'}`;

            let fileTypeIcon = 'fa-file';
            let fileTypeText = 'Файл';

            if (file.type === 'calendar') { fileTypeIcon = 'fa-calendar-alt'; fileTypeText = 'Календарь питания ФЦМПО'; }
            else if (file.type === 'template') { fileTypeIcon = 'fa-utensils'; fileTypeText = 'Типовое меню ФЦМПО'; }

            fileItem.innerHTML = `
                <div class="gen-file-info">
                    <i class="fas ${fileTypeIcon}"></i>
                    <div>
                        <div><strong>${file.name}</strong></div>
                        <div class="gen-file-size">${fileTypeText} • ${GEN_formatFileSize(file.size)} • ${file.date}</div>
                    </div>
                </div>
                <i class="fas ${file.valid ? 'fa-check-circle' : 'fa-exclamation-triangle'}"
                   style="color:${file.valid ? '#27ae60' : '#e74c3c'};"></i>
            `;
            el.appendChild(fileItem);
        });
    }

    function checkFilesLoaded() {
        const hasCalendar = state.uploadedFiles.some(f => f.type === 'calendar' && f.valid);
        const hasTemplate = state.uploadedFiles.some(f => f.type === 'template' && f.valid);

        if (state.elements.generateBtn) {
            state.elements.generateBtn.disabled = !(hasCalendar && hasTemplate);
        }

        if (hasCalendar && hasTemplate) {
            GEN_showStatus('Все необходимые файлы ФЦМПО загружены. Теперь можно создать ежедневные меню.', 'success');
        } else if (hasCalendar && !hasTemplate) {
            GEN_showStatus('Загрузите файл типового меню ФЦМПО (tm2026-sm.xlsx)', 'info');
        } else if (!hasCalendar && hasTemplate) {
            GEN_showStatus('Загрузите файл календаря питания ФЦМПО (kp2026.xlsx)', 'info');
        } else {
            GEN_showStatus('Загрузите файлы календаря питания и типового меню ФЦМПО', 'info');
        }
    }

    // ============================================================
    // ПАРСИНГ КАЛЕНДАРЯ
    // ============================================================

    function processCalendarFile(workbook, fileName) {
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        // Название школы
        let schoolName = '';
        for (let i = 0; i < Math.min(10, data.length); i++) {
            if (data[i] && data[i].some(cell => cell && cell.toString().toLowerCase().includes('школ'))) {
                const row = data[i];
                for (let j = 0; j < row.length; j++) {
                    if (row[j] && row[j].toString().toLowerCase().includes('школ')) {
                        if (j + 1 < row.length && row[j + 1]) {
                            schoolName = row[j + 1].toString().trim();
                            break;
                        }
                    }
                }
                if (schoolName) break;
            }
        }

        if (schoolName && state.elements.schoolNameInput &&
            (!state.elements.schoolNameInput.value || state.elements.schoolNameInput.value === '')) {
            state.elements.schoolNameInput.value = schoolName;
        }

        // Строка с месяцами
        let monthRowIndex = -1;
        for (let i = 0; i < Math.min(50, data.length); i++) {
            if (data[i] && data[i][0] && typeof data[i][0] === 'string') {
                const cellValue = data[i][0].toString().toLowerCase();
                if (GEN_MONTH_NAMES.some(m => cellValue.includes(m))) {
                    monthRowIndex = i;
                    break;
                }
            }
        }

        if (monthRowIndex === -1) {
            for (let i = 0; i < Math.min(50, data.length); i++) {
                if (data[i] && data[i][1] === 1 && data[i][2] === 2) {
                    monthRowIndex = i + 1;
                    break;
                }
            }
        }

        if (monthRowIndex === -1) {
            GEN_showStatus(`Не удалось найти данные календаря в файле ${fileName}`, 'error');
            return;
        }

        // Номера дней из заголовков
        const dayHeaders = data[monthRowIndex - 1] || [];
        const dayNumbers = [];
        for (let i = 1; i < dayHeaders.length; i++) {
            const cell = dayHeaders[i];
            if (cell !== undefined && cell !== null && cell !== '') {
                const num = parseInt(cell);
                if (!isNaN(num) && num >= 1 && num <= 31) dayNumbers.push(num);
            }
        }
        if (dayNumbers.length === 0) {
            for (let i = 1; i <= 31; i++) dayNumbers.push(i);
        }

        // Год
        let yearFromData = state.currentYear;
        for (let i = 0; i < Math.min(10, data.length); i++) {
            if (data[i] && data[i].some(cell => cell && cell.toString().includes('Год'))) {
                const yearRow = data[i];
                const yearCell = yearRow.find(cell => cell && !isNaN(cell) && cell > 2000 && cell < 2100);
                if (yearCell) { yearFromData = parseInt(yearCell); break; }
            }
        }
        if (yearFromData === state.currentYear) {
            const yearMatch = fileName.match(/\d{4}/);
            if (yearMatch) yearFromData = parseInt(yearMatch[0]);
        }

        state.currentYear = yearFromData;
        setDefaultDates();
        if (state.elements.calendarYearBadge) {
            state.elements.calendarYearBadge.textContent = state.currentYear;
            state.elements.calendarYearBadge.style.display = 'inline-block';
        }

        state.calendarData = {
            schoolName: schoolName,
            months: {},
            year: state.currentYear
        };

        for (let i = monthRowIndex; i < Math.min(monthRowIndex + 12, data.length); i++) {
            const row = data[i];
            if (!row || !row[0]) continue;

            const monthName = row[0].toString().toLowerCase().trim();
            if (!GEN_MONTH_NAMES.includes(monthName)) continue;

            state.calendarData.months[monthName] = {};

            for (let dayIdx = 0; dayIdx < dayNumbers.length; dayIdx++) {
                const dayNum = dayNumbers[dayIdx];
                if (dayNum >= 1 && dayNum <= 31) {
                    const menuType = row[dayIdx + 1];
                    if (menuType !== undefined && menuType !== null && menuType !== '') {
                        const numValue = parseInt(menuType);
                        if (!isNaN(numValue) && numValue > 0) {
                            state.calendarData.months[monthName][dayNum] = numValue;
                        }
                    }
                }
            }
        }

        GEN_showStatus(`Календарь питания ФЦМПО загружен из файла ${fileName} (${state.currentYear} год)`, 'success');
        updateCalendarPreview();
    }

    // ============================================================
    // ПАРСИНГ ТИПОВОГО МЕНЮ
    // ============================================================

    function processTemplateFile(workbook, fileName) {
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        const approvalInfo = { position: '', name: '', date: '' };
        let schoolName = '';
        let ageCategory = '';

        for (let i = 0; i < Math.min(10, data.length); i++) {
            const row = data[i];
            if (!row) continue;
            for (let j = 0; j < row.length; j++) {
                const cell = row[j];
                if (cell && typeof cell === 'string') {
                    const cellLower = cell.toLowerCase();
                    if (cellLower.includes('утвержд') || cellLower.includes('согласован')) {
                        if (j + 1 < row.length && row[j + 1]) approvalInfo.position = row[j + 1].toString().trim();
                        if (j + 2 < row.length && row[j + 2]) approvalInfo.name = row[j + 2].toString().trim();
                        if (j + 3 < row.length && row[j + 3]) approvalInfo.date = row[j + 3].toString().trim();
                    }
                    if (cellLower.includes('школ')) {
                        for (let k = j + 1; k < row.length; k++) {
                            if (row[k] && typeof row[k] === 'string' && row[k].trim().length > 2) {
                                schoolName = row[k].toString().trim();
                                break;
                            }
                        }
                    }
                    if (cellLower.includes('7-11') || cellLower.includes('12-18') ||
                        cellLower.includes('1-3') || cellLower.includes('4-6')) {
                        ageCategory = cell.trim();
                    }
                }
            }
        }

        if (schoolName && state.elements.schoolNameInput &&
            (!state.elements.schoolNameInput.value || state.elements.schoolNameInput.value === '')) {
            state.elements.schoolNameInput.value = schoolName;
        }
        if (ageCategory && state.elements.ageCategoryInput) {
            state.elements.ageCategoryInput.value = ageCategory;
        }

        // Заголовки
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(20, data.length); i++) {
            const row = data[i];
            if (row && row.length >= 3) {
                const col0 = row[0] ? row[0].toString().toLowerCase().trim() : '';
                const col1 = row[1] ? row[1].toString().toLowerCase().trim() : '';
                if (col0 === 'неделя' && (col1.includes('день') || col1.includes('недели'))) {
                    headerRowIndex = i;
                    break;
                }
            }
        }
        if (headerRowIndex === -1) {
            GEN_showStatus(`Не удалось найти заголовки меню в файле ${fileName}`, 'error');
            return;
        }

        state.templateMenuData = {
            schoolName: schoolName || (state.elements.schoolNameInput?.value || ''),
            ageCategory: ageCategory || (state.elements.ageCategoryInput?.value || ''),
            approvalInfo: approvalInfo,
            weeks: {}
        };

        let currentWeek = null;
        let currentDay = null;
        let currentMeal = null;
        let foundBreakfast = false;

        for (let i = headerRowIndex + 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length < 3) continue;

            const weekNum = parseInt(row[0]);
            const dayNum = parseInt(row[1]);

            if (!isNaN(weekNum) && !isNaN(dayNum)) {
                currentWeek = weekNum;
                currentDay = dayNum;
                currentMeal = null;
                foundBreakfast = false;

                if (!state.templateMenuData.weeks[currentWeek]) {
                    state.templateMenuData.weeks[currentWeek] = {};
                }
                if (!state.templateMenuData.weeks[currentWeek][currentDay]) {
                    state.templateMenuData.weeks[currentWeek][currentDay] = {
                        breakfast: { items: [] },
                        breakfast2: { items: [] },
                        lunch: { items: [] },
                        afternoonSnack: { items: [] },
                        dinner: { items: [] },
                        dinner2: { items: [] }
                    };
                }
            }

            const mealCell = row[2] ? row[2].toString().trim() : '';
            if (mealCell && mealCell !== '') {
                const mealLower = mealCell.toLowerCase();
                if (mealLower.includes('завтрак')) {
                    if (foundBreakfast) currentMeal = 'breakfast2';
                    else { currentMeal = 'breakfast'; foundBreakfast = true; }
                } else if (mealLower.includes('обед')) {
                    currentMeal = 'lunch';
                } else if (mealLower.includes('полдник')) {
                    currentMeal = 'afternoonSnack';
                } else if (mealLower.includes('ужин 2') || mealLower.includes('второй ужин')) {
                    currentMeal = 'dinner2';
                } else if (mealLower.includes('ужин')) {
                    currentMeal = 'dinner';
                } else if (mealLower.includes('итого') || mealLower.includes('среднее')) {
                    currentMeal = null;
                    continue;
                }
            }

            if (currentWeek && currentDay && currentMeal) {
                const section = row[3] ? row[3].toString().trim() : '';
                const dishName = row[4] ? row[4].toString().trim() : '';

                if ((!section && !dishName) ||
                    (section && section.toLowerCase().includes('итого')) ||
                    (dishName && dishName.toLowerCase().includes('итого'))) {
                    continue;
                }

                if (dishName && (dishName.trim() === '' || dishName.trim().startsWith('[') || dishName.trim() === '[')) {
                    continue;
                }

                if (dishName || section) {
                    const dish = {
                        section: GEN_normalizeSectionName(section),
                        originalSection: section,
                        name: dishName || '',
                        weight: parseFloat(row[5]) || 0,
                        proteins: parseFloat(row[6]) || 0,
                        fats: parseFloat(row[7]) || 0,
                        carbs: parseFloat(row[8]) || 0,
                        calories: parseFloat(row[9]) || 0,
                        recipeId: row[10] ? row[10].toString().trim() : '',
                        price: parseFloat(row[11]) || 0
                    };

                    if (!dish.name || dish.name.trim() === '') continue;

                    const day = state.templateMenuData.weeks[currentWeek]?.[currentDay];
                    if (day && day[currentMeal]) {
                        const isDuplicate = day[currentMeal].items.some(item =>
                            item.name === dish.name && item.section === dish.section
                        );
                        if (!isDuplicate) {
                            day[currentMeal].items.push(dish);
                        }
                    }
                }
            }
        }

        // Сортировка
        for (const weekNum in state.templateMenuData.weeks) {
            const week = state.templateMenuData.weeks[weekNum];
            for (const dayNum in week) {
                const day = week[dayNum];
                for (const mealType in day) {
                    if (day[mealType] && day[mealType].items) {
                        day[mealType].items = GEN_sortMealItemsByStructure(day[mealType].items, mealType);
                    }
                }
            }
        }

        GEN_showStatus(`Типовое меню ФЦМПО загружено из файла ${fileName}`, 'success');
        updateMenuPreview();
    }

    // ============================================================
    // ПРЕДПРОСМОТР
    // ============================================================

    function updateCalendarPreview() {
        const el = state.elements.calendarPreview;
        if (!el) return;

        if (!state.calendarData) {
            el.innerHTML = '<p style="color:#e74c3c;padding:20px;text-align:center;"><i class="fas fa-exclamation-triangle"></i> Календарь ФЦМПО не загружен</p>';
            return;
        }

        let html = '<div style="margin-bottom:20px;">';
        html += `<p><strong><i class="fas fa-calendar"></i> Год:</strong> ${state.currentYear}</p>`;
        html += `<p><strong><i class="fas fa-layer-group"></i> Месяцев с данными:</strong> ${Object.keys(state.calendarData.months || {}).length}</p>`;

        let daysWithMenu = 0;
        let totalPossibleDays = 0;
        if (state.calendarData.months) {
            for (const month in state.calendarData.months) {
                for (const day in state.calendarData.months[month]) {
                    totalPossibleDays++;
                    if (state.calendarData.months[month][day] !== undefined) daysWithMenu++;
                }
            }
        }
        html += `<p><strong><i class="fas fa-check-circle"></i> Дней с меню:</strong> ${daysWithMenu} из ${totalPossibleDays}</p>`;
        if (state.calendarData.schoolName) {
            html += `<p><strong><i class="fas fa-school"></i> Школа:</strong> ${state.calendarData.schoolName}</p>`;
        }
        html += '</div>';

        html += '<table class="gen-calendar-table">';
        html += '<tr><th class="gen-month-header">Месяц</th>';
        for (let day = 1; day <= 31; day++) html += `<th>${day}</th>`;
        html += '</tr>';

        for (const monthName of GEN_MONTH_NAMES) {
            if (state.calendarData.months && state.calendarData.months[monthName]) {
                html += `<tr><td class="gen-month-header">${monthName}</td>`;
                for (let day = 1; day <= 31; day++) {
                    const menuType = state.calendarData.months[monthName][day];
                    html += menuType !== undefined
                        ? `<td class="gen-has-menu">${menuType}</td>`
                        : '<td></td>';
                }
                html += '</tr>';
            }
        }
        html += '</table>';

        html += `
            <div class="gen-calendar-legend">
                <div class="gen-legend-item">
                    <div class="gen-legend-color" style="background:linear-gradient(135deg,#d5f4e6,#c1eed8);"></div>
                    <span>День с меню (цифра - тип меню 1-10)</span>
                </div>
                <div class="gen-legend-item">
                    <div class="gen-legend-color" style="background:white;border:2px solid #e0e6ed;"></div>
                    <span>Нет меню (0 или пусто)</span>
                </div>
            </div>
        `;

        el.innerHTML = html;
    }

    function toggleMenuPreviewView() {
        state.isMenuGridView = !state.isMenuGridView;
        if (state.elements.toggleMenuViewBtn) {
            state.elements.toggleMenuViewBtn.innerHTML = state.isMenuGridView
                ? '<i class="fas fa-list"></i> Список'
                : '<i class="fas fa-th"></i> Сетка';
        }
        updateMenuPreview();
    }

    function updateMenuPreview() {
        const el = state.elements.menuPreview;
        if (!el) return;

        if (!state.templateMenuData || !state.templateMenuData.weeks) {
            el.innerHTML = '<p style="color:#e74c3c;padding:20px;text-align:center;"><i class="fas fa-exclamation-triangle"></i> Меню ФЦМПО не загружено</p>';
            return;
        }

        if (state.isMenuGridView) {
            let html = '<div class="gen-menu-preview-grid">';

            const allDays = [];
            let totalDishes = 0;

            for (const weekNum in state.templateMenuData.weeks) {
                const week = state.templateMenuData.weeks[weekNum];
                for (const dayNum in week) {
                    const day = week[dayNum];
                    let dayDishes = 0;
                    for (const mealType in day) {
                        if (day[mealType] && day[mealType].items) {
                            dayDishes += day[mealType].items.length;
                        }
                    }
                    totalDishes += dayDishes;

                    allDays.push({
                        week: weekNum,
                        day: dayNum,
                        dishes: dayDishes,
                        breakfastCount: day.breakfast?.items?.length || 0,
                        breakfast2Count: day.breakfast2?.items?.length || 0,
                        lunchCount: day.lunch?.items?.length || 0,
                        afternoonSnackCount: day.afternoonSnack?.items?.length || 0,
                        dinnerCount: day.dinner?.items?.length || 0,
                        dinner2Count: day.dinner2?.items?.length || 0
                    });
                }
            }

            allDays.sort((a, b) => a.week === b.week ? a.day - b.day : a.week - b.week);

            allDays.forEach(d => {
                html += `
                    <div class="gen-menu-preview-day ${d.dishes > 0 ? 'gen-has-menu' : ''}">
                        <div class="gen-day-number">${d.week}.${d.day}</div>
                        <div class="gen-day-info">
                            ${d.dishes} блюд<br>
                            <small>З:${d.breakfastCount}/З2:${d.breakfast2Count}/О:${d.lunchCount}/П:${d.afternoonSnackCount}/У:${d.dinnerCount}/У2:${d.dinner2Count}</small>
                        </div>
                    </div>
                `;
            });
            html += '</div>';

            html += `
                <div class="gen-preview-info">
                    <p><strong><i class="fas fa-chart-bar"></i> Всего:</strong> ${Object.keys(state.templateMenuData.weeks).length} недель, ${allDays.length} дней, ${totalDishes} блюд</p>
                    <p><strong><i class="fas fa-school"></i> Школа:</strong> ${state.templateMenuData.schoolName || 'Не указана'}</p>
                    <p><strong><i class="fas fa-user-friends"></i> Возрастная категория:</strong> ${state.templateMenuData.ageCategory || 'Не указана'}</p>
                </div>
            `;
            el.innerHTML = html;
        } else {
            let html = '<table class="gen-preview-table">';
            html += '<tr><th>Неделя</th><th>День</th><th>З</th><th>З2</th><th>О</th><th>П</th><th>У</th><th>У2</th><th>Всего</th><th>Пример блюда</th></tr>';

            let count = 0;
            for (const weekNum in state.templateMenuData.weeks) {
                if (count >= 10) break;
                const week = state.templateMenuData.weeks[weekNum];
                for (const dayNum in week) {
                    if (count >= 10) break;
                    const day = week[dayNum];
                    const breakfastCount = day.breakfast?.items?.length || 0;
                    const breakfast2Count = day.breakfast2?.items?.length || 0;
                    const lunchCount = day.lunch?.items?.length || 0;
                    const afternoonSnackCount = day.afternoonSnack?.items?.length || 0;
                    const dinnerCount = day.dinner?.items?.length || 0;
                    const dinner2Count = day.dinner2?.items?.length || 0;
                    const total = breakfastCount + breakfast2Count + lunchCount + afternoonSnackCount + dinnerCount + dinner2Count;

                    let sampleDish = '-';
                    for (const mealType in day) {
                        if (day[mealType] && day[mealType].items && day[mealType].items.length > 0) {
                            sampleDish = day[mealType].items[0].name.substring(0, 30) +
                                (day[mealType].items[0].name.length > 30 ? '...' : '');
                            break;
                        }
                    }

                    html += `<tr>
                        <td>${weekNum}</td><td>${dayNum}</td>
                        <td>${breakfastCount}</td><td>${breakfast2Count}</td>
                        <td>${lunchCount}</td><td>${afternoonSnackCount}</td>
                        <td>${dinnerCount}</td><td>${dinner2Count}</td>
                        <td>${total}</td><td title="${sampleDish}">${sampleDish}</td>
                    </tr>`;
                    count++;
                }
            }
            html += '</table>';

            html += `
                <div class="gen-preview-info">
                    <p><strong><i class="fas fa-school"></i> Школа:</strong> ${state.templateMenuData.schoolName || 'Не указана'}</p>
                    <p><strong><i class="fas fa-user-friends"></i> Возрастная категория:</strong> ${state.templateMenuData.ageCategory || 'Не указана'}</p>
                    <p><strong><i class="fas fa-calendar-week"></i> Количество недель:</strong> ${Object.keys(state.templateMenuData.weeks).length}</p>
                </div>
            `;
            el.innerHTML = html;
        }
    }

    // ============================================================
    // ГЕНЕРАЦИЯ ЕЖЕДНЕВНЫХ МЕНЮ
    // ============================================================

    function generateDailyMenus() {
        if (!state.calendarData || !state.templateMenuData) {
            GEN_showStatus('Не загружены необходимые файлы ФЦМПО', 'error');
            return;
        }

        const startDate = new Date(state.elements.startDateInput.value);
        const endDate = new Date(state.elements.endDateInput.value);

        if (startDate > endDate) {
            GEN_showStatus('Начальная дата не может быть позже конечной', 'error');
            return;
        }
        if (startDate.getFullYear() !== state.currentYear || endDate.getFullYear() !== state.currentYear) {
            GEN_showStatus(`Даты должны быть в пределах ${state.currentYear} года`, 'error');
            return;
        }

        state.dailyMenus = [];

        let currentDate = new Date(startDate);
        let generatedCount = 0;
        let errorCount = 0;

        const btn = state.elements.generateBtn;
        btn.innerHTML = '<span class="gen-loading"></span> Генерация...';
        btn.disabled = true;

        const progressBar = document.createElement('div');
        progressBar.className = 'gen-progress-bar';
        const progressFill = document.createElement('div');
        progressFill.className = 'gen-progress-fill';
        progressBar.appendChild(progressFill);
        if (state.elements.statusMessage) {
            state.elements.statusMessage.parentNode.insertBefore(progressBar, state.elements.statusMessage.nextSibling);
        }

        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        let processedDays = 0;

        const interval = setInterval(() => {
            if (currentDate > endDate) {
                clearInterval(interval);

                if (state.dailyMenus.length > 0) {
                    state.currentMenuIndex = 0;
                    if (state.elements.menuNavigation) state.elements.menuNavigation.style.display = 'flex';
                    if (state.elements.menuStats) state.elements.menuStats.style.display = 'flex';
                    if (state.elements.menuGrid) state.elements.menuGrid.style.display = 'grid';
                    if (state.elements.dailyMenuContent) state.elements.dailyMenuContent.style.display = 'none';
                    if (state.elements.detailedView) state.elements.detailedView.classList.remove('active');

                    if (state.elements.exportAllBtn) state.elements.exportAllBtn.disabled = false;
                    if (state.elements.exportCurrentBtn) state.elements.exportCurrentBtn.disabled = false;

                    updateMenuGrid();
                    updateMenuStats();
                    saveToLocalStorage();

                    state.isGridView = true;
                    if (state.elements.toggleViewBtn) {
                        state.elements.toggleViewBtn.innerHTML = '<i class="fas fa-list"></i> Детальный вид';
                    }
                    progressBar.remove();
                } else {
                    if (state.elements.menuNavigation) state.elements.menuNavigation.style.display = 'none';
                    if (state.elements.menuStats) state.elements.menuStats.style.display = 'none';
                    if (state.elements.menuGrid) state.elements.menuGrid.style.display = 'none';
                    if (state.elements.dailyMenuContent) state.elements.dailyMenuContent.style.display = 'block';
                    if (state.elements.exportAllBtn) state.elements.exportAllBtn.disabled = true;
                    if (state.elements.exportCurrentBtn) state.elements.exportCurrentBtn.disabled = true;
                    progressBar.remove();
                }

                if (generatedCount > 0) {
                    GEN_showStatus(`Сгенерировано ${generatedCount} ежедневных меню${errorCount > 0 ? ` (ошибок: ${errorCount})` : ''}`, 'success');
                } else {
                    GEN_showStatus('Не удалось сгенерировать ни одного меню для выбранного периода', 'error');
                }

                btn.innerHTML = '<i class="fas fa-magic"></i> Создать ежедневные меню';
                btn.disabled = false;
                return;
            }

            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const day = currentDate.getDate();
            const monthName = GEN_MONTH_NAMES[month];

            let menuType = null;
            if (state.calendarData?.months?.[monthName]?.[day]) {
                menuType = state.calendarData.months[monthName][day];
            }

            if (menuType !== null) {
                let maxDayInWeek = 5;
                if (state.templateMenuData && state.templateMenuData.weeks) {
                    for (const week in state.templateMenuData.weeks) {
                        for (const d in state.templateMenuData.weeks[week]) {
                            const dn = parseInt(d);
                            if (dn > maxDayInWeek) maxDayInWeek = dn;
                        }
                    }
                }

                const weekNum = Math.ceil(menuType / maxDayInWeek);
                const dayNum = menuType - (weekNum - 1) * maxDayInWeek;

                if (state.templateMenuData.weeks[weekNum]?.[dayNum]) {
                    const templateDay = state.templateMenuData.weeks[weekNum][dayNum];
                    const sortedDay = {};

                    for (const mealType in templateDay) {
                        if (templateDay[mealType] && templateDay[mealType].items) {
                            sortedDay[mealType] = { items: GEN_sortMealItemsByStructure(templateDay[mealType].items, mealType) };
                        } else {
                            sortedDay[mealType] = { items: [] };
                        }
                    }

                    state.dailyMenus.push({
                        date: new Date(currentDate),
                        dateString: GEN_formatDate(currentDate),
                        fileName: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}-sm.xlsx`,
                        schoolName: state.elements.schoolNameInput?.value || state.templateMenuData.schoolName,
                        ageCategory: state.elements.ageCategoryInput?.value || state.templateMenuData.ageCategory,
                        weekNumber: weekNum,
                        dayNumber: dayNum,
                        menuType: menuType,
                        breakfast: sortedDay.breakfast,
                        breakfast2: sortedDay.breakfast2,
                        lunch: sortedDay.lunch,
                        afternoonSnack: sortedDay.afternoonSnack,
                        dinner: sortedDay.dinner,
                        dinner2: sortedDay.dinner2
                    });
                    generatedCount++;
                } else {
                    errorCount++;
                }
            }

            currentDate.setDate(currentDate.getDate() + 1);
            processedDays++;
            progressFill.style.width = `${(processedDays / totalDays) * 100}%`;
        }, 50);
    }

    // ============================================================
    // EXCEL СТРУКТУРА
    // ============================================================

    function createExcelDataWithProperStructure(menu) {
        const data = [];

        const schoolName = menu.schoolName || '';
        data.push(['Школа', schoolName, '', '', 'Отд./корп', '', '', '', 'День',
            `${String(menu.date.getDate()).padStart(2, '0')}.${String(menu.date.getMonth() + 1).padStart(2, '0')}.${menu.date.getFullYear()}`]);

        data.push(['', '', '', '', '', '', '', '', '', '']);

        data.push(['Прием пищи', 'Раздел', '№ рец.', 'Блюдо', 'Выход, г', 'Цена', 'Калорийность', 'Белки', 'Жиры', 'Углеводы']);

        const addMeal = (mealName, mealType, items, alwaysShow = false) => {
            const mealItems = items || [];
            const realItems = mealItems.filter(item => {
                const name = item.name || '';
                return name && name.trim() !== '' && !name.trim().startsWith('[') && name.trim() !== '[';
            });

            const hasRealItems = realItems.length > 0;

            if (hasRealItems || alwaysShow) {
                const structure = GEN_MEAL_STRUCTURE[mealType];

                if (mealType === 'breakfast2') {
                    const sortedItems = GEN_sortMealItemsByStructure(mealItems, mealType);
                    const section = 'фрукты';

                    if (sortedItems.length > 0 && sortedItems[0].name && sortedItems[0].name.trim() !== '') {
                        const item = sortedItems[0];
                        data.push([mealName, section, item.recipeId || '', item.name || '',
                            item.weight || '', item.price || '', item.calories || '',
                            item.proteins || '', item.fats || '', item.carbs || '']);
                    } else {
                        data.push([mealName, section, '', '', '', '', '', '', '', '']);
                    }
                    data.push(['', '', '', '', '', '', '', '', '', '']);
                    return;
                }

                const sortedItems = GEN_sortMealItemsByStructure(mealItems, mealType);
                const itemsBySection = new Map();
                sortedItems.forEach(item => {
                    const section = GEN_normalizeSectionName(item.section || '');
                    if (!itemsBySection.has(section)) itemsBySection.set(section, []);
                    itemsBySection.get(section).push(item);
                });

                let isFirstItem = true;

                if (structure) {
                    if (mealType === 'lunch' || alwaysShow) {
                        for (const section of structure.sections) {
                            const sectionItems = itemsBySection.get(section) || [];

                            if (sectionItems.length > 0) {
                                sectionItems.forEach(item => {
                                    if (item.name && item.name.trim() !== '') {
                                        data.push([isFirstItem ? mealName : '', item.originalSection || item.section || '',
                                            item.recipeId || '', item.name || '', item.weight || '',
                                            item.price || '', item.calories || '', item.proteins || '',
                                            item.fats || '', item.carbs || '']);
                                        isFirstItem = false;
                                    }
                                });
                            } else {
                                data.push([isFirstItem ? mealName : '', section, '', '', '', '', '', '', '', '']);
                                isFirstItem = false;
                            }
                        }
                    } else {
                        sortedItems.forEach(item => {
                            if (item.name && item.name.trim() !== '') {
                                data.push([isFirstItem ? mealName : '', item.originalSection || item.section || '',
                                    item.recipeId || '', item.name || '', item.weight || '',
                                    item.price || '', item.calories || '', item.proteins || '',
                                    item.fats || '', item.carbs || '']);
                                isFirstItem = false;
                            }
                        });
                    }
                }

                // Блюда из разделов, которых нет в структуре
                const allSections = Array.from(itemsBySection.keys());
                const otherSections = allSections.filter(section =>
                    !structure || !structure.sections.includes(section)
                );

                for (const section of otherSections) {
                    const sectionItems = itemsBySection.get(section) || [];
                    sectionItems.forEach(item => {
                        if (item.name && item.name.trim() !== '') {
                            data.push(['', item.originalSection || item.section || '',
                                item.recipeId || '', item.name || '', item.weight || '',
                                item.price || '', item.calories || '', item.proteins || '',
                                item.fats || '', item.carbs || '']);
                        }
                    });
                }

                if (!isFirstItem) {
                    data.push(['', '', '', '', '', '', '', '', '', '']);
                }
            }
        };

        addMeal('Завтрак', 'breakfast', menu.breakfast?.items || [], true);
        addMeal('Завтрак 2', 'breakfast2', menu.breakfast2?.items || [], true);
        addMeal('Обед', 'lunch', menu.lunch?.items || [], true);
        addMeal('Полдник', 'afternoonSnack', menu.afternoonSnack?.items || [], false);
        addMeal('Ужин', 'dinner', menu.dinner?.items || [], false);
        addMeal('Ужин 2', 'dinner2', menu.dinner2?.items || [], false);

        return data;
    }

    // ============================================================
    // EXCELJS — СОЗДАНИЕ РАБОЧЕЙ КНИГИ
    // ============================================================

    async function createDailyMenuWorkbookWithFormatting(menu) {
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
            { key: 'D', width: 35 }, { key: 'E', width: 10 }, { key: 'F', width: 10 },
            { key: 'G', width: 15 }, { key: 'H', width: 8 }, { key: 'I', width: 8 }, { key: 'J', width: 10 }
        ];

        worksheet.getColumn('F').numFmt = '0.00';
        worksheet.getColumn('F').alignment = { horizontal: 'right' };

        ['E', 'G', 'H', 'I', 'J'].forEach(col => {
            worksheet.getColumn(col).numFmt = '0';
            worksheet.getColumn(col).alignment = { horizontal: 'right' };
        });

        const colorScheme = state.elements.colorSchemeInput?.value || 'default';
        const colors = GEN_getColorScheme(colorScheme);

        let currentMealType = null;
        let isFirstRowOfMeal = true;

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 2) {
                row.height = 0;
                row.hidden = true;
                return;
            }

            if (rowNumber === 1) {
                row.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GEN_hexToArgb(colors.school || '#cfe2f3') } };
                    cell.font = { bold: true };
                });
                worksheet.mergeCells('B1:D1');
            } else if (rowNumber === 3) {
                row.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GEN_hexToArgb(colors.header || '#e0e0e0') } };
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
    // СЕТКА И ДЕТАЛЬНЫЙ ВИД
    // ============================================================

    function updateMenuGrid() {
        const el = state.elements.menuGrid;
        if (!el) return;
        if (state.dailyMenus.length === 0) { el.innerHTML = ''; return; }

        let html = '';

        state.dailyMenus.forEach((menu, index) => {
            const breakfastCount = menu.breakfast?.items?.length || 0;
            const breakfast2Count = menu.breakfast2?.items?.length || 0;
            const lunchCount = menu.lunch?.items?.length || 0;
            const afternoonSnackCount = menu.afternoonSnack?.items?.length || 0;
            const dinnerCount = menu.dinner?.items?.length || 0;
            const dinner2Count = menu.dinner2?.items?.length || 0;
            const totalDishes = breakfastCount + breakfast2Count + lunchCount + afternoonSnackCount + dinnerCount + dinner2Count;

            let breakfastSample = '';
            let lunchSample = '';
            if (menu.breakfast?.items?.length > 0) {
                const d = menu.breakfast.items[0];
                breakfastSample = d.name.substring(0, 25) + (d.name.length > 25 ? '...' : '');
            }
            if (menu.lunch?.items?.length > 0) {
                const d = menu.lunch.items.find(x => x.name && x.name.trim() !== '') || menu.lunch.items[0];
                if (d) lunchSample = d.name.substring(0, 25) + (d.name.length > 25 ? '...' : '');
            }

            const menuTypeColors = {
                1: '#3498db', 2: '#2ecc71', 3: '#9b59b6', 4: '#e67e22', 5: '#1abc9c',
                6: '#34495e', 7: '#d35400', 8: '#16a085', 9: '#8e44ad', 10: '#27ae60'
            };
            const headerColor = menuTypeColors[menu.menuType] || '#3498db';

            html += `
                <div class="gen-menu-card ${index === state.currentMenuIndex ? 'gen-active' : ''}"
                     data-gen-index="${index}">
                    <div class="gen-menu-card-header" style="background:linear-gradient(135deg,${headerColor},${GEN_adjustColor(headerColor, -20)});">
                        <div class="gen-menu-card-date">${GEN_formatDate(menu.date, 'short')}</div>
                        <div class="gen-menu-card-type">Меню ${menu.menuType}</div>
                    </div>
                    <div class="gen-menu-card-content">
                        <div class="gen-menu-card-meal">
                            <div class="gen-meal-title"><i class="fas fa-sun" style="color:#f39c12;"></i> Завтрак (${breakfastCount})</div>
                            <div class="gen-meal-dishes">
                                ${breakfastSample ? `<div class="gen-dish-item"><span class="gen-dish-name">${breakfastSample}</span></div>` : '<em>Нет данных</em>'}
                            </div>
                        </div>
                        <div class="gen-menu-card-meal">
                            <div class="gen-meal-title"><i class="fas fa-utensils" style="color:#e74c3c;"></i> Обед (${lunchCount})</div>
                            <div class="gen-meal-dishes">
                                ${lunchSample ? `<div class="gen-dish-item"><span class="gen-dish-name">${lunchSample}</span></div>` : '<em>Нет данных</em>'}
                            </div>
                        </div>
                    </div>
                    <div class="gen-menu-card-footer">
                        <div>Неделя ${menu.weekNumber}, День ${menu.dayNumber}</div>
                        <div>${totalDishes} блюд</div>
                    </div>
                </div>
            `;
        });

        el.innerHTML = html;

        // Делегирование кликов
        el.querySelectorAll('.gen-menu-card').forEach(card => {
            card.addEventListener('click', function () {
                const idx = parseInt(this.dataset.genIndex);
                if (!isNaN(idx)) selectMenu(idx);
            });
        });
    }

    function selectMenu(index) {
        state.currentMenuIndex = index;
        document.querySelectorAll('.gen-menu-card').forEach(c => c.classList.remove('gen-active'));
        const active = document.querySelector(`.gen-menu-card[data-gen-index="${index}"]`);
        if (active) active.classList.add('gen-active');
        showDetailedView();
    }

    function showDetailedView() {
        if (state.dailyMenus.length === 0 || state.currentMenuIndex >= state.dailyMenus.length) return;

        const menu = state.dailyMenus[state.currentMenuIndex];
        if (state.elements.detailMenuDate) {
            state.elements.detailMenuDate.textContent = `${menu.dateString} (Меню ${menu.menuType})`;
        }

        updateMealsDisplay(menu);
        showExcelPreview(menu);

        if (state.elements.menuGrid) state.elements.menuGrid.style.display = 'none';
        if (state.elements.detailedView) state.elements.detailedView.classList.add('active');
    }

    function updateMealsDisplay(menu) {
        const el = state.elements.detailMeals;
        if (!el) return;

        const mealsToShow = [];
        const filter = state.currentMealFilter;

        if (filter === 'all' || filter === 'breakfast') mealsToShow.push({ type: 'breakfast', data: menu.breakfast });
        if (filter === 'all' || filter === 'breakfast2') mealsToShow.push({ type: 'breakfast2', data: menu.breakfast2 });
        if (filter === 'all' || filter === 'lunch') mealsToShow.push({ type: 'lunch', data: menu.lunch });
        if (filter === 'all' || filter === 'afternoonSnack') mealsToShow.push({ type: 'afternoonSnack', data: menu.afternoonSnack });
        if (filter === 'all' || filter === 'dinner') mealsToShow.push({ type: 'dinner', data: menu.dinner });
        if (filter === 'all' || filter === 'dinner2') mealsToShow.push({ type: 'dinner2', data: menu.dinner2 });

        let mealsHtml = '';

        if (mealsToShow.length === 0) {
            mealsHtml = `<div style="padding:40px;text-align:center;color:#6c757d;">
                <i class="fas fa-utensils fa-3x" style="margin-bottom:20px;color:#bdc3c7;"></i><br>
                <h4>Нет данных для выбранного фильтра</h4>
            </div>`;
        } else {
            mealsToShow.forEach(meal => {
                const mealTitle = GEN_MEAL_TYPES[meal.type] || meal.type;
                const icon = GEN_getMealIcon(meal.type);
                const color = GEN_getMealColor(meal.type);
                const structure = GEN_MEAL_STRUCTURE[meal.type];

                let mealItemsHtml = '';

                const itemsBySection = new Map();
                if (meal.data?.items?.length > 0) {
                    meal.data.items.forEach(item => {
                        const section = GEN_normalizeSectionName(item.section || '');
                        if (!itemsBySection.has(section)) itemsBySection.set(section, []);
                        itemsBySection.get(section).push(item);
                    });
                }

                if (structure) {
                    structure.sections.forEach(section => {
                        const sectionItems = itemsBySection.get(section) || [];
                        if (sectionItems.length > 0) {
                            sectionItems.forEach(item => {
                                if (item.name && item.name.trim() !== '') {
                                    mealItemsHtml += `
                                        <div class="gen-menu-item">
                                            <div class="gen-item-name">${item.name}</div>
                                            <div class="gen-item-details">
                                                <span>${item.section || 'Блюдо'}</span>
                                                <span>${item.weight} г</span>
                                            </div>
                                            <div class="gen-item-details" style="margin-top:5px;">
                                                <span>Б: ${item.proteins || 0}г</span>
                                                <span>Ж: ${item.fats || 0}г</span>
                                                <span>У: ${item.carbs || 0}г</span>
                                                <span>${item.calories || 0} ккал</span>
                                            </div>
                                            <div class="gen-item-details">
                                                <span>${item.price || 0} ₽</span>
                                                <span>${item.recipeId ? `Рец. ${item.recipeId}` : ''}</span>
                                            </div>
                                        </div>
                                    `;
                                }
                            });
                        } else {
                            mealItemsHtml += `
                                <div class="gen-menu-item" style="opacity:0.6;">
                                    <div class="gen-item-name" style="color:#6c757d;"><em>${section} (нет данных)</em></div>
                                    <div class="gen-item-details"><span>Раздел отсутствует</span><span>0 г</span></div>
                                </div>
                            `;
                        }
                    });
                }

                const otherSections = Array.from(itemsBySection.keys()).filter(section =>
                    !structure || !structure.sections.includes(section)
                );
                otherSections.forEach(section => {
                    const sectionItems = itemsBySection.get(section) || [];
                    sectionItems.forEach(item => {
                        if (item.name && item.name.trim() !== '') {
                            mealItemsHtml += `
                                <div class="gen-menu-item" style="border-left:3px solid #f39c12;">
                                    <div class="gen-item-name">${item.name} <small style="color:#f39c12;">(доп. раздел)</small></div>
                                    <div class="gen-item-details">
                                        <span>${item.section || 'Блюдо'}</span>
                                        <span>${item.weight} г</span>
                                    </div>
                                    <div class="gen-item-details" style="margin-top:5px;">
                                        <span>Б: ${item.proteins || 0}г</span>
                                        <span>Ж: ${item.fats || 0}г</span>
                                        <span>У: ${item.carbs || 0}г</span>
                                        <span>${item.calories || 0} ккал</span>
                                    </div>
                                </div>
                            `;
                        }
                    });
                });

                mealsHtml += `
                    <div class="gen-menu-section">
                        <div class="gen-section-title">
                            <i class="fas ${icon}" style="color:${color};"></i> ${mealTitle}
                        </div>
                        <div class="gen-menu-items">
                            ${mealItemsHtml || '<div class="gen-menu-item"><em>Нет данных в меню</em></div>'}
                        </div>
                    </div>
                `;
            });
        }

        el.innerHTML = mealsHtml;
    }

    function showExcelPreview(menu) {
        const el = state.elements.excelPreview;
        if (!el) return;

        const excelData = createExcelDataWithProperStructure(menu);
        let previewHtml = '';

        excelData.forEach((row, rowIndex) => {
            let rowClass = '';
            let isMealHeader = false;

            if (rowIndex === 0) rowClass = 'gen-excel-school';
            else if (rowIndex === 2) rowClass = 'gen-excel-header';
            else if (['Завтрак', 'Завтрак 2', 'Обед', 'Полдник', 'Ужин', 'Ужин 2'].includes(row[0])) {
                isMealHeader = true;
                if (row[0] === 'Завтрак' || row[0] === 'Завтрак 2') rowClass = 'gen-excel-breakfast';
                else if (row[0] === 'Обед') rowClass = 'gen-excel-lunch';
                else if (row[0] === 'Полдник') rowClass = 'gen-excel-afternoon-snack';
                else if (row[0] === 'Ужин') rowClass = 'gen-excel-dinner';
                else if (row[0] === 'Ужин 2') rowClass = 'gen-excel-dinner2';
            } else if (rowIndex > 2 && row[0] === '') {
                for (let i = rowIndex - 1; i >= 0; i--) {
                    if (excelData[i][0] && excelData[i][0] !== '') {
                        if (excelData[i][0] === 'Завтрак' || excelData[i][0] === 'Завтрак 2') rowClass = 'gen-excel-breakfast';
                        else if (excelData[i][0] === 'Обед') rowClass = 'gen-excel-lunch';
                        else if (excelData[i][0] === 'Полдник') rowClass = 'gen-excel-afternoon-snack';
                        else if (excelData[i][0] === 'Ужин') rowClass = 'gen-excel-dinner';
                        else if (excelData[i][0] === 'Ужин 2') rowClass = 'gen-excel-dinner2';
                        break;
                    }
                }
            }

            previewHtml += '<div class="gen-excel-row">';
            row.forEach(cell => {
                const content = cell !== null && cell !== undefined ? cell.toString() : '';
                previewHtml += `<div class="gen-excel-cell ${isMealHeader ? '' : rowClass}">${content}</div>`;
            });
            previewHtml += '</div>';
        });

        el.innerHTML = previewHtml;
    }

    // ============================================================
    // НАВИГАЦИЯ
    // ============================================================

    function navigateMenus(direction) {
        if (state.dailyMenus.length === 0) return;
        state.currentMenuIndex += direction;
        if (state.currentMenuIndex < 0) state.currentMenuIndex = state.dailyMenus.length - 1;
        else if (state.currentMenuIndex >= state.dailyMenus.length) state.currentMenuIndex = 0;

        if (state.isGridView) updateMenuGrid();
        else updateDetailedView();
        updateMenuCounter();
    }

    function toggleView() {
        state.isGridView = !state.isGridView;

        if (state.isGridView) {
            if (state.elements.toggleViewBtn) state.elements.toggleViewBtn.innerHTML = '<i class="fas fa-list"></i> Детальный вид';
            if (state.elements.menuGrid) state.elements.menuGrid.style.display = 'grid';
            if (state.elements.detailedView) state.elements.detailedView.classList.remove('active');
            if (state.elements.dailyMenuContent) state.elements.dailyMenuContent.style.display = 'none';
        } else {
            if (state.elements.toggleViewBtn) state.elements.toggleViewBtn.innerHTML = '<i class="fas fa-th"></i> Сетка';
            if (state.elements.menuGrid) state.elements.menuGrid.style.display = 'none';
            if (state.elements.detailedView) state.elements.detailedView.classList.remove('active');
            if (state.elements.dailyMenuContent) state.elements.dailyMenuContent.style.display = 'none';
            showDetailedView();
        }
    }

    function updateDetailedView() {
        if (!state.elements.detailedView?.classList.contains('active')) return;
        showDetailedView();
    }

    function jumpToToday() {
        if (state.dailyMenus.length === 0) return;
        const today = new Date();
        let closest = 0;
        let diff = Infinity;
        state.dailyMenus.forEach((m, i) => {
            const d = Math.abs(m.date - today);
            if (d < diff) { diff = d; closest = i; }
        });
        state.currentMenuIndex = closest;
        if (state.isGridView) updateMenuGrid();
        else updateDetailedView();
        updateMenuCounter();
    }

    function updateMenuStats() {
        if (state.dailyMenus.length === 0) return;

        if (state.elements.totalMenusCount) state.elements.totalMenusCount.textContent = state.dailyMenus.length;

        const first = state.dailyMenus[0].date;
        const last = state.dailyMenus[state.dailyMenus.length - 1].date;
        if (state.elements.menuPeriod) {
            state.elements.menuPeriod.textContent = `${GEN_formatDate(first, 'short')} - ${GEN_formatDate(last, 'short')}`;
        }

        const school = state.dailyMenus[0].schoolName || 'Не указана';
        if (state.elements.menuSchool) {
            state.elements.menuSchool.textContent = school.length > 20 ? school.substring(0, 20) + '...' : school;
        }

        const compliance = calculateCompliance();
        if (state.elements.menuCompliance) {
            state.elements.menuCompliance.textContent = `${compliance.percentage}%`;
            state.elements.menuCompliance.style.color = compliance.percentage >= 80 ? '#27ae60'
                : compliance.percentage >= 60 ? '#f39c12' : '#e74c3c';
        }
    }

    function calculateCompliance() {
        if (state.dailyMenus.length === 0) return { percentage: 0, matched: 0, total: 0 };
        let totalItems = 0, matchedItems = 0;
        state.dailyMenus.forEach(menu => {
            ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'].forEach(mealType => {
                const items = menu[mealType]?.items || [];
                totalItems += items.length;
                matchedItems += items.length;
            });
        });
        return {
            percentage: totalItems > 0 ? Math.round((matchedItems / totalItems) * 100) : 0,
            matched: matchedItems,
            total: totalItems
        };
    }

    function updateMenuCounter() {
        if (!state.elements.menuCounter) return;
        if (state.dailyMenus.length === 0) {
            state.elements.menuCounter.textContent = '';
            return;
        }
        state.elements.menuCounter.textContent = `${state.currentMenuIndex + 1} из ${state.dailyMenus.length}`;
    }

    // ============================================================
    // АНАЛИЗ СООТВЕТСТВИЯ
    // ============================================================

    function analyzeMenuCompliance() {
        const analysis = {
            totalMenus: state.dailyMenus.length,
            analyzedMenus: 0,
            totalItems: 0,
            matchedItems: 0,
            menuDetails: [],
            summary: { excellent: 0, good: 0, poor: 0 }
        };

        state.dailyMenus.forEach(menu => {
            let menuTotal = 0;
            let menuMatched = 0;
            ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'].forEach(mealType => {
                const items = menu[mealType]?.items || [];
                menuTotal += items.length;
                menuMatched += items.length;
            });

            analysis.totalItems += menuTotal;
            analysis.matchedItems += menuMatched;
            analysis.analyzedMenus++;

            const percent = menuTotal > 0 ? Math.round((menuMatched / menuTotal) * 100) : 0;
            analysis.menuDetails.push({
                date: menu.dateString,
                fileName: menu.fileName,
                totalItems: menuTotal,
                matchedItems: menuMatched,
                compliancePercentage: percent
            });

            if (percent >= 90) analysis.summary.excellent++;
            else if (percent >= 70) analysis.summary.good++;
            else analysis.summary.poor++;
        });

        return analysis;
    }

    function showComplianceAnalysis() {
        if (state.dailyMenus.length === 0) {
            GEN_showStatus('Нет меню для анализа соответствия', 'error');
            return;
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
                            </tr>
                        `).join('')}
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
    // ЭКСПОРТ
    // ============================================================

    async function exportAllMenusAsZip() {
        if (state.dailyMenus.length === 0) {
            GEN_showStatus('Нет меню для экспорта', 'error');
            return;
        }

        const btn = state.elements.exportAllBtn;
        try {
            GEN_showStatus(`Создание ZIP архива с ${state.dailyMenus.length} файлами...`, 'info');
            btn.innerHTML = '<span class="gen-loading"></span> Архивация...';
            btn.disabled = true;

            const zip = new JSZip();

            for (let i = 0; i < state.dailyMenus.length; i++) {
                const menu = state.dailyMenus[i];
                try {
                    const wb = await createDailyMenuWorkbookWithFormatting(menu);
                    const buffer = await wb.xlsx.writeBuffer();
                    zip.file(menu.fileName, buffer);
                    GEN_showStatus(`Создание файлов: ${Math.round(((i + 1) / state.dailyMenus.length) * 100)}%`, 'info');
                } catch (error) {
                    console.error(`Ошибка при создании файла ${menu.fileName}:`, error);
                }
            }

            const content = await zip.generateAsync({ type: 'blob' });
            const zipFileName = `school-menus-${state.currentYear}-${GEN_formatDate(new Date(), 'file')}.zip`;
            saveAs(content, zipFileName);
            GEN_showStatus(`ZIP архив "${zipFileName}" успешно создан`, 'success');
        } catch (error) {
            console.error('Ошибка при создании ZIP архива:', error);
            GEN_showStatus(`Ошибка при создании архива: ${error.message}`, 'error');
        } finally {
            btn.innerHTML = '<i class="fas fa-download"></i> Экспорт всех меню (ZIP)';
            btn.disabled = false;
        }
    }

    async function exportCurrentMenuAsExcel() {
        if (state.dailyMenus.length === 0 || state.currentMenuIndex >= state.dailyMenus.length) {
            GEN_showStatus('Нет текущего меню для экспорта', 'error');
            return;
        }

        const btn = state.elements.exportCurrentBtn;
        try {
            const menu = state.dailyMenus[state.currentMenuIndex];
            GEN_showStatus('Создание Excel файла...', 'info');
            btn.innerHTML = '<span class="gen-loading"></span> Экспорт...';
            btn.disabled = true;

            const wb = await createDailyMenuWorkbookWithFormatting(menu);
            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, menu.fileName);

            GEN_showStatus(`Меню экспортировано в файл ${menu.fileName}`, 'success');
        } catch (error) {
            console.error('Ошибка экспорта:', error);
            GEN_showStatus(`Ошибка экспорта: ${error.message}`, 'error');
        } finally {
            btn.innerHTML = '<i class="fas fa-file-excel"></i> Экспорт текущего меню';
            btn.disabled = false;
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
        ws['!cols'] = [
            { wch: 12 }, { wch: 15 }, { wch: 8 }, { wch: 40 },
            { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 8 }, { wch: 8 }, { wch: 10 }
        ];
        XLSX.utils.book_append_sheet(wb, ws, 'Шаблон меню ФЦМПО');
        XLSX.writeFile(wb, 'шаблон-ежедневного-меню-фцмпо.xlsx');
        GEN_showStatus('Шаблон ежедневного меню ФЦМПО скачан', 'success');
    }

    // ============================================================
    // LOCALSTORAGE
    // ============================================================

    function saveToLocalStorage() {
        const data = {
            calendarData: state.calendarData,
            templateMenuData: state.templateMenuData,
            dailyMenus: state.dailyMenus,
            uploadedFiles: state.uploadedFiles,
            currentYear: state.currentYear,
            schoolName: state.elements.schoolNameInput?.value || '',
            ageCategory: state.elements.ageCategoryInput?.value || '',
            savedAt: new Date().toISOString()
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            updateStoredDataInfo();
        } catch (e) {
            console.error('Ошибка сохранения в LocalStorage:', e);
        }
    }

    function loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) {
                GEN_showStatus('В памяти нет сохраненных данных', 'info');
                return;
            }
            const parsed = JSON.parse(saved);

            state.calendarData = parsed.calendarData;
            state.templateMenuData = parsed.templateMenuData;
            state.dailyMenus = parsed.dailyMenus || [];
            state.uploadedFiles = parsed.uploadedFiles || [];
            state.currentYear = parsed.currentYear || 2026;

            if (state.elements.schoolNameInput) state.elements.schoolNameInput.value = parsed.schoolName || '';
            if (state.elements.ageCategoryInput) state.elements.ageCategoryInput.value = parsed.ageCategory || '7-11';

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
                if (state.elements.menuGrid) state.elements.menuGrid.style.display = 'grid';
                if (state.elements.dailyMenuContent) state.elements.dailyMenuContent.style.display = 'none';
                if (state.elements.exportAllBtn) state.elements.exportAllBtn.disabled = false;
                if (state.elements.exportCurrentBtn) state.elements.exportCurrentBtn.disabled = false;
                updateMenuGrid();
                updateMenuStats();
                updateMenuCounter();
            }

            GEN_showStatus(`Данные загружены из памяти (сохранены ${GEN_formatDate(new Date(parsed.savedAt))})`, 'success');
        } catch (e) {
            console.error('Ошибка загрузки из LocalStorage:', e);
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
                const parsed = JSON.parse(saved);
                const savedDate = new Date(parsed.savedAt);
                if (state.elements.storedDataText) {
                    state.elements.storedDataText.textContent = `Данные сохранены ${GEN_formatDate(savedDate)}. ${parsed.dailyMenus ? `Содержит ${parsed.dailyMenus.length} меню.` : ''}`;
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
                ev.preventDefault();
                e.dropArea.classList.remove('gen-dragover');
                handleFiles(Array.from(ev.dataTransfer.files));
            });
        }
        if (e.fileInput) {
            e.fileInput.addEventListener('change', ev => {
                handleFiles(Array.from(ev.target.files));
                ev.target.value = '';
            });
        }

        // Навигация
        e.prevMenuBtn?.addEventListener('click', () => navigateMenus(-1));
        e.nextMenuBtn?.addEventListener('click', () => navigateMenus(1));
        e.jumpToTodayBtn?.addEventListener('click', jumpToToday);
        e.toggleViewBtn?.addEventListener('click', toggleView);
        e.toggleMenuViewBtn?.addEventListener('click', toggleMenuPreviewView);
        e.complianceBtn?.addEventListener('click', showComplianceAnalysis);
        e.closeDetailView?.addEventListener('click', () => {
            e.detailedView?.classList.remove('active');
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
            updateDetailedView();
        });

        // Данные
        e.loadFromStorageBtn?.addEventListener('click', loadFromLocalStorage);
        e.clearStorageBtn?.addEventListener('click', clearLocalStorage);
        e.generateBtn?.addEventListener('click', generateDailyMenus);
        e.analyzeBtn?.addEventListener('click', showComplianceAnalysis);
        e.exportAllBtn?.addEventListener('click', exportAllMenusAsZip);
        e.exportCurrentBtn?.addEventListener('click', exportCurrentMenuAsExcel);
        e.downloadTemplateBtn?.addEventListener('click', downloadTemplate);

        // Справка
        e.quickHelpBtn?.addEventListener('click', () => {
            e.quickGuide?.scrollIntoView({ behavior: 'smooth' });
            if (e.quickGuide) {
                e.quickGuide.style.animation = 'genPulse 0.5s';
                setTimeout(() => { if (e.quickGuide) e.quickGuide.style.animation = ''; }, 500);
            }
        });

        // Аккордеон
        e.advancedSettings?.addEventListener('click', function () {
            this.classList.toggle('gen-active');
        });
    }

    // ============================================================
    // АДАПТЕРЫ ДЛЯ ДАННЫХ ИЗ ДРУГИХ МОДУЛЕЙ
    // ============================================================

    /**
     * Принимает календарь из CalendarModule (kp.js).
     * Формат CalendarModule: { calendarData: { [month]: [{day, value, raw}] }, calendarMeta: {year, schoolName} }
     */
    function adoptCalendarFromModule(calState) {
        if (!calState || !calState.calendarData) return false;

        const months = {};
        for (const m of GEN_MONTH_NAMES) {
            const arr = calState.calendarData[m] || [];
            months[m] = {};
            for (const entry of arr) {
                if (entry.value !== null && entry.value !== undefined) {
                    months[m][entry.day] = entry.value;
                }
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
                name: 'Календарь из модуля «Календарь»',
                size: 0,
                type: 'calendar',
                date: new Date().toLocaleTimeString(),
                valid: true
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

    /**
     * Принимает типовое меню из основного редактора (testtm2.html).
     * Формат: { weeks: {...}, schoolName, ageCategory }
     */
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
                name: 'Типовое меню из редактора',
                size: 0,
                type: 'template',
                date: new Date().toLocaleTimeString(),
                valid: true
            });
        }

        if (state.elements.schoolNameInput && !state.elements.schoolNameInput.value) {
            state.elements.schoolNameInput.value = state.templateMenuData.schoolName;
        }
        if (state.elements.ageCategoryInput && !state.elements.ageCategoryInput.value) {
            state.elements.ageCategoryInput.value = state.templateMenuData.ageCategory;
        }

        updateMenuPreview();
        updateFileList();
        checkFilesLoaded();
        return true;
    }

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ
    // ============================================================

    function init() {
        cacheElements();

        if (!state.elements.fileInput) {
            console.warn('⚠️ GeneratorModule: разметка вкладки #tabGenerator не найдена');
            return;
        }

        if (!state.isInitialized) {
            setupEvents();
            setDefaultDates();
            checkLocalStorage();
            updateFileList();
            checkFilesLoaded();
            state.isInitialized = true;
        }

        // Если основной редактор уже загрузил типовое меню — автоматически принимаем
        if (window.templateMenuData && window.templateMenuData.weeks &&
            !state.uploadedFiles.some(f => f.type === 'template')) {
            adoptFromEditor(window.templateMenuData, window.schoolInfo);
        }

        // Если CalendarModule уже загрузил календарь — принимаем
        if (window.CalendarModule && window.CalendarModule.getState &&
            !state.uploadedFiles.some(f => f.type === 'calendar')) {
            try {
                const calState = window.CalendarModule.getState();
                if (calState && calState.calendarData) {
                    adoptCalendarFromModule(calState);
                }
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
            updateMenuCounter();
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
        adoptCalendarFromModule,
        adoptFromEditor,
        showComplianceAnalysis
    };

})();

window.GeneratorModule = GeneratorModule;
console.log('✅ generator-module.js загружен');
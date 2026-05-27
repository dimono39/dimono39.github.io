// Форматирование даты
export function formatDate(date, format = 'display') {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    if (format === 'file') return `${year}-${month}-${day}`;
    if (format === 'excel') return `${day}.${month}.${year}`;
    if (format === 'short') return `${day}.${month}.${year}`;
    
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                       'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return `${day} ${monthNames[d.getMonth()]} ${year} г.`;
}

// Форматирование размера файла
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Экранирование HTML
export function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Экранирование для атрибутов
export function escapeAttr(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Показ глобального уведомления
export function showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('global-toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast-notification ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Дебаунс для оптимизации
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Глубокая копия объекта
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Проверка сезонности блюда
export function checkSeasonality(dishName, date) {
    const monthNames = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 
                       'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
    const month = monthNames[date.getMonth()];
    const seasonal = SEASONAL_PRODUCTS[month] || [];
    const dishLower = dishName.toLowerCase();
    
    const isSeasonal = seasonal.some(s => dishLower.includes(s));
    return !isSeasonal && seasonal.length > 0;
}

// Нормализация названия раздела
export function normalizeSection(section) {
    if (!section) return '';
    const low = section.toString().toLowerCase().trim();
    
    const sectionMap = {
        'горячее блюдо': 'гор.блюдо',
        'горячий напиток': 'гор.напиток',
        'первое блюдо': '1 блюдо',
        'второе блюдо': '2 блюдо',
        'хлеб белый': 'хлеб бел.',
        'хлеб черный': 'хлеб черн.',
        'булочные изделия': 'булочное',
        'кисломолочный напиток': 'кисломол.',
        'кисломолочные продукты': 'кисломол.',
        'свежие фрукты': 'фрукты',
        'фрукт свежий': 'фрукты'
    };
    
    if (sectionMap[low]) return sectionMap[low];
    
    const standardSections = ['гор.блюдо', 'гор.напиток', 'хлеб', 'фрукты', 'напиток', 
                              'закуска', '1 блюдо', '2 блюдо', 'гарнир', 'хлеб бел.', 
                              'хлеб черн.', 'булочное', 'кисломол.'];
    
    for (const standard of standardSections) {
        const cleanStandard = standard.replace(/\./g, '').replace(/\s/g, '');
        if (low.includes(cleanStandard)) return standard;
    }
    
    return low;
}
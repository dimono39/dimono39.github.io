/**
 * Вспомогательные функции для системы анализа образовательных результатов
 */

// ==================== РАБОТА С ДАННЫМИ ====================

/**
 * Безопасное получение значения из объекта по пути
 * @param {Object} obj - Исходный объект
 * @param {string} path - Путь вида 'prop.subprop'
 * @param {any} defaultValue - Значение по умолчанию
 * @returns {any}
 */
function safeGet(obj, path, defaultValue = null) {
    try {
        const value = path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
        return value !== undefined ? value : defaultValue;
    } catch (error) {
        console.warn(`Ошибка безопасного доступа по пути "${path}":`, error);
        return defaultValue;
    }
}

/**
 * Глубокое клонирование объекта
 * @param {Object} obj - Объект для клонирования
 * @returns {Object}
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    
    const cloned = {};
    Object.keys(obj).forEach(key => {
        cloned[key] = deepClone(obj[key]);
    });
    return cloned;
}

/**
 * Проверка на пустой объект/массив
 * @param {any} value - Значение для проверки
 * @returns {boolean}
 */
function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * Форматирование числа с разделителями тысяч
 * @param {number} num - Число для форматирования
 * @returns {string}
 */
function formatNumber(num) {
    if (typeof num !== 'number') return '0';
    return num.toLocaleString('ru-RU');
}

/**
 * Форматирование процентов
 * @param {number} value - Значение от 0 до 100
 * @param {number} decimals - Количество знаков после запятой
 * @returns {string}
 */
function formatPercent(value, decimals = 1) {
    if (typeof value !== 'number') return '0%';
    return value.toFixed(decimals) + '%';
}

// ==================== РАБОТА С ДАТАМИ ====================

/**
 * Форматирование даты
 * @param {string|Date} date - Дата
 * @param {string} format - Формат ('ru', 'iso', 'time')
 * @returns {string}
 */
function formatDate(date, format = 'ru') {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    switch(format) {
        case 'iso':
            return d.toISOString().split('T')[0];
        case 'time':
            return d.toLocaleTimeString('ru-RU');
        case 'full':
            return d.toLocaleString('ru-RU');
        case 'ru':
        default:
            return d.toLocaleDateString('ru-RU');
    }
}

/**
 * Получение текущей даты в формате для input[type="date"]
 * @returns {string}
 */
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Разница между датами в днях
 * @param {Date|string} date1 - Первая дата
 * @param {Date|string} date2 - Вторая дата
 * @returns {number}
 */
function getDateDiffInDays(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diff = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ==================== РАБОТА С МАССИВАМИ ====================

/**
 * Группировка массива объектов по ключу
 * @param {Array} array - Массив объектов
 * @param {string} key - Ключ для группировки
 * @returns {Object}
 */
function groupBy(array, key) {
    return array.reduce((result, item) => {
        const groupKey = item[key];
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
}

/**
 * Уникальные значения массива
 * @param {Array} array - Исходный массив
 * @returns {Array}
 */
function unique(array) {
    return [...new Set(array)];
}

/**
 * Сортировка объектов по свойству
 * @param {Array} array - Массив объектов
 * @param {string} prop - Свойство для сортировки
 * @param {boolean} descending - По убыванию
 * @returns {Array}
 */
function sortBy(array, prop, descending = false) {
    return [...array].sort((a, b) => {
        const valA = safeGet(a, prop, 0);
        const valB = safeGet(b, prop, 0);
        
        if (valA < valB) return descending ? 1 : -1;
        if (valA > valB) return descending ? -1 : 1;
        return 0;
    });
}

/**
 * Сумма значений свойства объектов массива
 * @param {Array} array - Массив объектов
 * @param {string} prop - Свойство для суммирования
 * @returns {number}
 */
function sumBy(array, prop) {
    return array.reduce((sum, item) => {
        const value = Number(safeGet(item, prop, 0)) || 0;
        return sum + value;
    }, 0);
}

// ==================== РАБОТА СО СТРОКАМИ ====================

/**
 * Обрезание строки с добавлением многоточия
 * @param {string} str - Исходная строка
 * @param {number} maxLength - Максимальная длина
 * @returns {string}
 */
function truncate(str, maxLength = 50) {
    if (typeof str !== 'string') return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
}

/**
 * Преобразование строки в camelCase
 * @param {string} str - Исходная строка
 * @returns {string}
 */
function toCamelCase(str) {
    return str
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase());
}

/**
 * Экранирование HTML символов
 * @param {string} str - Исходная строка
 * @returns {string}
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ==================== ВАЛИДАЦИЯ ====================

/**
 * Проверка email
 * @param {string} email - Email для проверки
 * @returns {boolean}
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Проверка номера телефона (русский формат)
 * @param {string} phone - Номер телефона
 * @returns {boolean}
 */
function isValidPhone(phone) {
    const re = /^[\+]?[78][\-\(]?\d{3}\)?[\-]?\d{3}[\-]?\d{2}[\-]?\d{2}$/;
    return re.test(phone.replace(/\s/g, ''));
}

/**
 * Проверка ИНН
 * @param {string} inn - ИНН для проверки
 * @returns {boolean}
 */
function isValidINN(inn) {
    if (!/^\d{10}$/.test(inn) && !/^\d{12}$/.test(inn)) return false;
    
    // Для 10-значного ИНН
    if (inn.length === 10) {
        const weights = [2, 4, 10, 3, 5, 9, 4, 6, 8];
        const sum = weights.reduce((s, w, i) => s + w * parseInt(inn[i]), 0);
        const control = (sum % 11) % 10;
        return control === parseInt(inn[9]);
    }
    
    // Для 12-значного ИНН
    if (inn.length === 12) {
        const weights1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
        const weights2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
        
        const sum1 = weights1.reduce((s, w, i) => s + w * parseInt(inn[i]), 0);
        const control1 = (sum1 % 11) % 10;
        
        const sum2 = weights2.reduce((s, w, i) => s + w * parseInt(inn[i]), 0);
        const control2 = (sum2 % 11) % 10;
        
        return control1 === parseInt(inn[10]) && control2 === parseInt(inn[11]);
    }
    
    return false;
}

// ==================== РАБОТА С ФАЙЛАМИ ====================

/**
 * Скачивание файла
 * @param {string} content - Содержимое файла
 * @param {string} filename - Имя файла
 * @param {string} type - MIME-тип
 */
function downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Чтение файла как текста
 * @param {File} file - Файл
 * @returns {Promise<string>}
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

/**
 * Чтение файла как DataURL
 * @param {File} file - Файл
 * @returns {Promise<string>}
 */
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ==================== РАБОТА С DOM ====================

/**
 * Создание HTML элемента
 * @param {string} tag - Тег элемента
 * @param {Object} attributes - Атрибуты
 * @param {string|HTMLElement} content - Содержимое
 * @returns {HTMLElement}
 */
function createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    // Установка атрибутов
    Object.entries(attributes).forEach(([key, value]) => {
        if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.substring(2).toLowerCase(), value);
        } else if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // Добавление содержимого
    if (typeof content === 'string') {
        element.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        element.appendChild(content);
    } else if (Array.isArray(content)) {
        content.forEach(child => {
            if (child instanceof HTMLElement) {
                element.appendChild(child);
            }
        });
    }
    
    return element;
}

/**
 * Удаление всех дочерних элементов
 * @param {HTMLElement} element - Родительский элемент
 */
function removeAllChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Проверка видимости элемента
 * @param {HTMLElement} element - Элемент
 * @returns {boolean}
 */
function isElementVisible(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= windowHeight &&
        rect.right <= windowWidth &&
        getComputedStyle(element).display !== 'none' &&
        getComputedStyle(element).visibility !== 'hidden'
    );
}

/**
 * Прокрутка к элементу с плавностью
 * @param {HTMLElement|string} element - Элемент или его ID
 * @param {Object} options - Опции прокрутки
 */
function scrollToElement(element, options = {}) {
    const target = typeof element === 'string' 
        ? document.getElementById(element) 
        : element;
    
    if (!target) return;
    
    const defaultOptions = {
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
    };
    
    target.scrollIntoView({ ...defaultOptions, ...options });
}

// ==================== МАТЕМАТИЧЕСКИЕ ФУНКЦИИ ====================

/**
 * Генерация случайного числа в диапазоне
 * @param {number} min - Минимальное значение
 * @param {number} max - Максимальное значение
 * @param {boolean} integer - Целое число
 * @returns {number}
 */
function random(min, max, integer = true) {
    const value = min + Math.random() * (max - min);
    return integer ? Math.floor(value) : value;
}

/**
 * Округление числа
 * @param {number} value - Число для округления
 * @param {number} decimals - Количество знаков после запятой
 * @returns {number}
 */
function round(value, decimals = 0) {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
}

/**
 * Линейная интерполяция
 * @param {number} a - Начальное значение
 * @param {number} b - Конечное значение
 * @param {number} t - Коэффициент (0-1)
 * @returns {number}
 */
function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Нормализация значения в диапазоне
 * @param {number} value - Значение
 * @param {number} min - Минимум диапазона
 * @param {number} max - Максимум диапазона
 * @returns {number} Нормализованное значение (0-1)
 */
function normalize(value, min, max) {
    if (max === min) return 0;
    return (value - min) / (max - min);
}

// ==================== ЦВЕТА ====================

/**
 * Генерация случайного цвета
 * @param {number} alpha - Прозрачность (0-1)
 * @returns {string}
 */
function randomColor(alpha = 1) {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return alpha < 1 
        ? `rgba(${r}, ${g}, ${b}, ${alpha})` 
        : `rgb(${r}, ${g}, ${b})`;
}

/**
 * Преобразование HEX в RGB
 * @param {string} hex - HEX цвет
 * @returns {Object} {r, g, b}
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

/**
 * Осветление/затемнение цвета
 * @param {string} hex - HEX цвет
 * @param {number} percent - Процент (-100 до 100)
 * @returns {string}
 */
function adjustColor(hex, percent) {
    const rgb = hexToRgb(hex);
    
    const adjust = (value) => {
        const adjusted = value + (value * percent / 100);
        return Math.min(255, Math.max(0, Math.round(adjusted)));
    };
    
    const r = adjust(rgb.r);
    const g = adjust(rgb.g);
    const b = adjust(rgb.b);
    
    return `rgb(${r}, ${g}, ${b})`;
}

// ==================== ОПТИМИЗАЦИЯ ====================

/**
 * Дебаунс функции
 * @param {Function} func - Функция
 * @param {number} wait - Время ожидания (мс)
 * @returns {Function}
 */
function debounce(func, wait) {
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

/**
 * Троттлинг функции
 * @param {Function} func - Функция
 * @param {number} limit - Лимит времени (мс)
 * @returns {Function}
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Ленивая загрузка функции
 * @param {Function} func - Функция для ленивой загрузки
 * @returns {Function}
 */
function lazy(func) {
    let loaded = false;
    let result;
    
    return function() {
        if (!loaded) {
            result = func();
            loaded = true;
        }
        return result;
    };
}

// ==================== РАБОТА С LOCALSTORAGE ====================

/**
 * Улучшенное сохранение в localStorage
 * @param {string} key - Ключ
 * @param {any} value - Значение
 * @param {number} ttl - Время жизни в секундах
 */
function setLocalStorage(key, value, ttl = null) {
    try {
        const item = {
            value: value,
            timestamp: Date.now(),
            ttl: ttl
        };
        localStorage.setItem(key, JSON.stringify(item));
        return true;
    } catch (error) {
        console.error('Ошибка сохранения в localStorage:', error);
        return false;
    }
}

/**
 * Улучшенное чтение из localStorage
 * @param {string} key - Ключ
 * @param {any} defaultValue - Значение по умолчанию
 * @returns {any}
 */
function getLocalStorage(key, defaultValue = null) {
    try {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return defaultValue;
        
        const item = JSON.parse(itemStr);
        
        // Проверка TTL
        if (item.ttl && Date.now() - item.timestamp > item.ttl * 1000) {
            localStorage.removeItem(key);
            return defaultValue;
        }
        
        return item.value;
    } catch (error) {
        console.error('Ошибка чтения из localStorage:', error);
        return defaultValue;
    }
}

/**
 * Очистка устаревших данных localStorage
 */
function cleanupLocalStorage() {
    const now = Date.now();
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('backup_')) {
            try {
                const item = JSON.parse(localStorage.getItem(key));
                if (item && item.timestamp) {
                    const age = now - item.timestamp;
                    // Удаляем бэкапы старше 30 дней
                    if (age > 30 * 24 * 60 * 60 * 1000) {
                        localStorage.removeItem(key);
                    }
                }
            } catch (error) {
                console.warn(`Не удалось обработать ключ ${key}:`, error);
            }
        }
    }
}

// ==================== ЭКСПОРТ ====================

// Экспорт всех функций
window.utils = {
    // Работа с данными
    safeGet,
    deepClone,
    isEmpty,
    formatNumber,
    formatPercent,
    
    // Работа с датами
    formatDate,
    getTodayDate,
    getDateDiffInDays,
    
    // Работа с массивами
    groupBy,
    unique,
    sortBy,
    sumBy,
    
    // Работа со строками
    truncate,
    toCamelCase,
    escapeHtml,
    
    // Валидация
    isValidEmail,
    isValidPhone,
    isValidINN,
    
    // Работа с файлами
    downloadFile,
    readFileAsText,
    readFileAsDataURL,
    
    // Работа с DOM
    createElement,
    removeAllChildren,
    isElementVisible,
    scrollToElement,
    
    // Математические функции
    random,
    round,
    lerp,
    normalize,
    
    // Цвета
    randomColor,
    hexToRgb,
    adjustColor,
    
    // Оптимизация
    debounce,
    throttle,
    lazy,
    
    // LocalStorage
    setLocalStorage,
    getLocalStorage,
    cleanupLocalStorage
};

console.log('✅ utils.js загружен');
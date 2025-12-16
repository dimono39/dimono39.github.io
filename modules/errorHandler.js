/**
 * 🛡️ Централизованная обработка ошибок
 * Стандартизирует обработку ошибок во всем приложении
 */

class ErrorHandler {
  constructor() {
    this.errorTypes = {
      VALIDATION: 'VALIDATION_ERROR',
      NETWORK: 'NETWORK_ERROR',
      PARSING: 'PARSING_ERROR',
      RUNTIME: 'RUNTIME_ERROR',
      UNKNOWN: 'UNKNOWN_ERROR'
    };
    
    this.init();
  }

  init() {
    // Глобальный обработчик ошибок
    window.addEventListener('error', (event) => {
      this.handleGlobalError(event.error);
    });
    
    // Обработчик необработанных промисов
    window.addEventListener('unhandledrejection', (event) => {
      this.handlePromiseRejection(event.reason);
    });
  }

  /**
   * Обрабатывает ошибку
   * @param {Error|string} error - Ошибка или сообщение
   * @param {string} context - Контекст ошибки
   * @param {Object} metadata - Дополнительные данные
   */
  handle(error, context = 'Unknown', metadata = {}) {
    const errorObj = this.normalizeError(error);
    const errorId = this.generateErrorId();
    
    // Логируем ошибку
    this.logError(errorObj, context, metadata, errorId);
    
    // Показываем пользователю (если нужно)
    if (this.shouldShowToUser(errorObj)) {
      this.showUserNotification(errorObj, context, errorId);
    }
    
    // Отправляем в аналитику (если настроена)
    this.sendToAnalytics(errorObj, context, metadata, errorId);
    
    return errorId;
  }

  /**
   * Нормализует ошибку к стандартному формату
   */
  normalizeError(error) {
    if (error instanceof Error) {
      return {
        type: this.errorTypes.RUNTIME,
        message: error.message,
        stack: error.stack,
        name: error.name,
        originalError: error
      };
    }
    
    if (typeof error === 'string') {
      return {
        type: this.errorTypes.RUNTIME,
        message: error,
        stack: new Error(error).stack
      };
    }
    
    return {
      type: this.errorTypes.UNKNOWN,
      message: 'Неизвестная ошибка',
      originalError: error
    };
  }

  /**
   * Логирует ошибку
   */
  logError(error, context, metadata, errorId) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      errorId,
      context,
      error: {
        message: error.message,
        type: error.type,
        stack: error.stack
      },
      metadata,
      userAgent: navigator.userAgent,
      url: window.location.href,
      appState: this.getAppStateSnapshot()
    };
    
    console.group(`❌ Ошибка [${errorId}] в ${context}`);
    console.error('Сообщение:', error.message);
    console.error('Тип:', error.type);
    console.error('Контекст:', context);
    console.error('Метаданные:', metadata);
    console.error('Полная запись:', logEntry);
    
    if (error.stack) {
      console.error('Стек вызовов:', error.stack);
    }
    
    console.groupEnd();
    
    // Сохраняем в localStorage для отладки
    this.saveToErrorLog(logEntry);
  }

  /**
   * Показывает уведомление пользователю
   */
  showUserNotification(error, context, errorId) {
    const message = this.getUserFriendlyMessage(error, context);
    
    // Используем существующую систему уведомлений
    if (window.showNotification) {
      window.showNotification(`${message} (Код: ${errorId})`, 'error');
    } else {
      // Fallback
      alert(`Ошибка: ${message}\nКод ошибки: ${errorId}`);
    }
  }

  /**
   * Генерирует понятное сообщение для пользователя
   */
  getUserFriendlyMessage(error, context) {
    const messages = {
      [this.errorTypes.VALIDATION]: 'Ошибка проверки данных',
      [this.errorTypes.NETWORK]: 'Проблемы с соединением. Проверьте интернет.',
      [this.errorTypes.PARSING]: 'Ошибка чтения данных',
      [this.errorTypes.RUNTIME]: 'Произошла ошибка в приложении'
    };
    
    const baseMessage = messages[error.type] || 'Произошла ошибка';
    
    // Добавляем контекст
    const contextMessages = {
      'saveData': 'при сохранении данных',
      'loadData': 'при загрузке данных',
      'renderChart': 'при построении графика',
      'exportReport': 'при экспорте отчета',
      'importTemplate': 'при импорте шаблона'
    };
    
    const contextText = contextMessages[context] || '';
    
    return `${baseMessage} ${contextText}`.trim();
  }

  /**
   * Валидирует данные по схеме
   */
  validate(data, schema, context = 'validation') {
    try {
      const errors = [];
      
      // Простая валидация по типам
      if (schema.required && Array.isArray(schema.required)) {
        schema.required.forEach(field => {
          if (data[field] === undefined || data[field] === null || data[field] === '') {
            errors.push(`Поле "${field}" обязательно для заполнения`);
          }
        });
      }
      
      // Валидация чисел
      if (schema.numbers && Array.isArray(schema.numbers)) {
        schema.numbers.forEach(field => {
          if (data[field] !== undefined && isNaN(parseFloat(data[field]))) {
            errors.push(`Поле "${field}" должно быть числом`);
          }
        });
      }
      
      if (errors.length > 0) {
        const error = new Error(errors.join(', '));
        error.type = this.errorTypes.VALIDATION;
        error.validationErrors = errors;
        throw error;
      }
      
      return true;
    } catch (error) {
      this.handle(error, context, { data, schema });
      throw error;
    }
  }

  /**
   * Безопасное выполнение функции с обработкой ошибок
   */
  async safeExecute(fn, context, ...args) {
    try {
      return await fn(...args);
    } catch (error) {
      const errorId = this.handle(error, context, { args });
      
      // Возвращаем fallback значение в зависимости от контекста
      return this.getFallbackValue(context, error);
    }
  }

  getFallbackValue(context, error) {
    const fallbacks = {
      'calculateGrade': 2,
      'calculatePercentage': 0,
      'loadData': null,
      'renderChart': '<div class="error">Не удалось построить график</div>',
      'exportReport': false
    };
    
    return fallbacks[context] !== undefined ? fallbacks[context] : null;
  }

  /**
   * Вспомогательные методы
   */
  generateErrorId() {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  saveToErrorLog(entry) {
    try {
      const errorLog = JSON.parse(localStorage.getItem('errorLog') || '[]');
      errorLog.push(entry);
      
      // Храним только последние 100 ошибок
      if (errorLog.length > 100) {
        errorLog.splice(0, errorLog.length - 100);
      }
      
      localStorage.setItem('errorLog', JSON.stringify(errorLog));
    } catch (e) {
      console.error('Не удалось сохранить ошибку в лог:', e);
    }
  }

  getAppStateSnapshot() {
    try {
      return {
        dataSize: localStorage.getItem('testAnalyticsData')?.length || 0,
        tasksCount: window.appData?.tasks?.length || 0,
        studentsCount: window.appData?.students?.length || 0
      };
    } catch {
      return {};
    }
  }

  shouldShowToUser(error) {
    // Не показываем пользователю ошибки валидации (они обрабатываются в форме)
    if (error.type === this.errorTypes.VALIDATION) return false;
    
    // Показываем все остальные
    return true;
  }

  sendToAnalytics(error, context, metadata, errorId) {
    // Метод для отправки в аналитику (Google Analytics, Yandex.Metrica и т.д.)
    if (typeof gtag !== 'undefined') {
      gtag('event', 'exception', {
        description: `${context}: ${error.message}`,
        fatal: false
      });
    }
  }

  handleGlobalError(error) {
    this.handle(error, 'Global');
  }

  handlePromiseRejection(reason) {
    this.handle(reason, 'UnhandledPromiseRejection');
  }

  /**
   * Получить историю ошибок для отладки
   */
  getErrorLog() {
    try {
      return JSON.parse(localStorage.getItem('errorLog') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Очистить историю ошибок
   */
  clearErrorLog() {
    localStorage.removeItem('errorLog');
  }
}

// Экспорт синглтона
window.ErrorHandler = new ErrorHandler();
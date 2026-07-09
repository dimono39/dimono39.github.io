// ============================================
// dataImportExport.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
// Поддержка XLSX и переменных максимальных баллов
// ============================================

// Основной класс модуля
class DataImportExport {
  constructor(config = {}) {
    this.config = {
      appData: null,
      debug: false,
      defaultDecimalSeparator: '.',
      autoInitUI: true,
      onImport: null,
      onExport: null,
      useXLSX: true, // Использовать XLSX вместо CSV
      ...config
    };
    
    // Инициализируем данные
    this.initializeData();
    
    this.importers = {
      xlsx: new XLSXImporter(),
      csv: new CSVImporter(),
      clipboard: new ClipboardImporter(),
      json: new JSONImporter()
    };
    
    this.exporters = {
      full: new FullTemplateExporter({ useXLSX: this.config.useXLSX }),
      simple: new SimpleTemplateExporter({ useXLSX: this.config.useXLSX }),
      csv: new CSVTemplateExporter(),
      googleForms: new GoogleFormsExporter()
    };
    
    this.currentImportData = null;
    this.currentValidation = null;
    
    if (this.config.autoInitUI) {
      this.initUI();
    }
    
    if (this.config.debug) {
      console.log('✅ DataImportExport инициализирован с данными:', this.config.appData);
    }
  }

  // Инициализация данных
  initializeData() {
    // Если данные не переданы, пытаемся найти их
    if (!this.config.appData) {
      this.config.appData = this.findAppData();
    }
    
    if (this.config.debug) {
      console.log('🔍 Найденные данные:', this.config.appData);
    }
  }

  // Поиск данных приложения
  findAppData() {
    // Проверяем различные возможные места хранения данных
    
    // 1. Глобальная переменная window.appData
    if (typeof window !== 'undefined' && window.appData) {
      if (this.config.debug) console.log('📊 Данные найдены в window.appData');
      return window.appData;
    }
    
    // 2. Данные из диагностики (из вашего примера)
    if (typeof window !== 'undefined') {
      // Проверяем localStorage
      try {
        // Пробуем разные ключи, которые могут содержать данные
        const possibleKeys = [
          'appData',
          'testAnalyticsData',
          'diagnosticData',
          'educationData',
          'studentsData',
          'tasksData'
        ];
        
        for (const key of possibleKeys) {
          const savedData = localStorage.getItem(key);
          if (savedData) {
            try {
              const parsedData = JSON.parse(savedData);
              if (parsedData && (parsedData.students || parsedData.tasks || parsedData.results)) {
                if (this.config.debug) console.log(`📊 Данные найдены в localStorage.${key}`);
                return parsedData;
              }
            } catch (e) {
              // Пропускаем невалидный JSON
            }
          }
        }
      } catch (e) {
        console.warn('⚠️ Ошибка при чтении данных из localStorage:', e);
      }
    }
    
    // 3. Создаем базовую структуру на основе диагностики
    if (this.config.debug) console.log('📝 Создаем базовую структуру данных');
    return {
      test: {},
      tasks: [],
      students: [],
      results: [],
      errors: [],
      studentErrors: {},
      psychologyFeatures: [],
      templates: {}
    };
  }

  // Обновление данных модуля
  updateAppData(newData) {
    this.config.appData = {
      ...this.config.appData,
      ...newData
    };
    
    if (this.config.debug) {
      console.log('🔄 Данные модуля обновлены:', this.config.appData);
    }
  }

  // Инициализация пользовательского интерфейса
  initUI() {
    if (typeof window === 'undefined' || document.getElementById('data-import-export-ui')) {
      return;
    }
    
    this.createUI();
  }

  // Создание интерфейса
  createUI() {
    const uiHTML = `
      <div id="data-import-export-ui" class="data-import-ui" style="display: none; font-family: Arial, sans-serif; max-width: 900px; margin: 20px auto; padding: 25px; border: 1px solid #ddd; border-radius: 10px; background: linear-gradient(135deg, #f9f9f9 0%, #f0f4f8 100%); box-shadow: 0 8px 25px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #3498db;">
          <h2 style="color: #2c3e50; margin: 0; font-size: 24px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 28px;">📊</span> Импорт/экспорт данных
          </h2>
          <button id="close-import-export-ui" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #7f8c8d; padding: 5px; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; transition: background 0.3s;">×</button>
        </div>
        
        <!-- Шаг 1: Экспорт шаблона -->
        <div class="step" style="margin-bottom: 30px; padding: 25px; background: white; border-radius: 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.08); border-left: 4px solid #3498db;">
          <h3 style="color: #2c3e50; margin-top: 0; margin-bottom: 20px; font-size: 18px; display: flex; align-items: center; gap: 10px;">
            <span style="background: #3498db; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">1</span>
            Скачайте шаблон для заполнения
          </h3>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 20px;">
            <button class="export-btn" data-type="full" style="padding: 14px; background: linear-gradient(135deg, #3498db, #2980b9); color: white; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: transform 0.2s, box-shadow 0.2s; text-align: left;">
              <span style="font-size: 20px;">📋</span>
              <div>
                <div style="font-weight: bold; font-size: 14px;">Полный шаблон</div>
                <div style="font-size: 11px; opacity: 0.9;">С инструкциями (XLSX)</div>
              </div>
            </button>
            
            <button class="export-btn" data-type="simple" style="padding: 14px; background: linear-gradient(135deg, #2ecc71, #27ae60); color: white; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: transform 0.2s, box-shadow 0.2s; text-align: left;">
              <span style="font-size: 20px;">📄</span>
              <div>
                <div style="font-weight: bold; font-size: 14px;">Простой шаблон</div>
                <div style="font-size: 11px; opacity: 0.9;">Для быстрого заполнения (XLSX)</div>
              </div>
            </button>
            
            <button class="export-btn" data-type="csv" style="padding: 14px; background: linear-gradient(135deg, #9b59b6, #8e44ad); color: white; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: transform 0.2s, box-shadow 0.2s; text-align: left;">
              <span style="font-size: 20px;">📝</span>
              <div>
                <div style="font-weight: bold; font-size: 14px;">Для Google Forms</div>
                <div style="font-size: 11px; opacity: 0.9;">CSV формат</div>
              </div>
            </button>
            
            <button class="export-btn" data-type="current" style="padding: 14px; background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: transform 0.2s, box-shadow 0.2s; text-align: left;">
              <span style="font-size: 20px;">💾</span>
              <div>
                <div style="font-weight: bold; font-size: 14px;">Экспорт данных</div>
                <div style="font-size: 11px; opacity: 0.9;">Текущие данные (CSV)</div>
              </div>
            </button>
          </div>
          
          <div style="padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #f39c12;">
            <div style="font-size: 12px; color: #7f8c8d; display: flex; align-items: flex-start; gap: 8px;">
              <span style="font-size: 16px;">💡</span>
              <div>
                <strong>Полный шаблон (XLSX)</strong> содержит инструкции и несколько листов. 
                <strong>Простой шаблон (XLSX)</strong> - одна таблица для быстрого заполнения. 
                Для оценок используйте числа от 0 до максимального балла задания.
              </div>
            </div>
          </div>
        </div>
        
        <!-- Шаг 2: Импорт данных -->
        <div class="step" style="margin-bottom: 30px; padding: 25px; background: white; border-radius: 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.08); border-left: 4px solid #2ecc71;">
          <h3 style="color: #2c3e50; margin-top: 0; margin-bottom: 20px; font-size: 18px; display: flex; align-items: center; gap: 10px;">
            <span style="background: #2ecc71; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">2</span>
            Импорт заполненных данных
          </h3>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 10px; font-weight: bold; color: #2c3e50; font-size: 14px;">Выберите источник данных:</label>
            <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 10px 15px; background: #f8f9fa; border-radius: 6px; transition: background 0.3s; flex: 1; min-width: 150px;">
                <input type="radio" name="import-source" value="file" checked style="accent-color: #3498db;">
                <div>
                  <div style="font-weight: bold; font-size: 14px;">📁 Файл</div>
                  <div style="font-size: 12px; color: #7f8c8d;">Excel/CSV</div>
                </div>
              </label>
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 10px 15px; background: #f8f9fa; border-radius: 6px; transition: background 0.3s; flex: 1; min-width: 150px;">
                <input type="radio" name="import-source" value="clipboard" style="accent-color: #3498db;">
                <div>
                  <div style="font-weight: bold; font-size: 14px;">📋 Буфер обмена</div>
                  <div style="font-size: 12px; color: #7f8c8d;">Копировать из таблиц</div>
                </div>
              </label>
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 10px 15px; background: #f8f9fa; border-radius: 6px; transition: background 0.3s; flex: 1; min-width: 150px;">
                <input type="radio" name="import-source" value="json" style="accent-color: #3498db;">
                <div>
                  <div style="font-weight: bold; font-size: 14px;">🔧 JSON файл</div>
                  <div style="font-size: 12px; color: #7f8c8d;">Специальный формат</div>
                </div>
              </label>
            </div>
          </div>
          
          <!-- Загрузка файла -->
          <div id="file-import-section">
            <div style="margin-bottom: 20px;">
              <input type="file" id="import-file" accept=".xlsx,.xls,.csv,.json" style="display: none;" multiple>
              <div id="drop-zone" style="border: 2px dashed #3498db; border-radius: 8px; padding: 40px 20px; text-align: center; cursor: pointer; background: #f8fafc; transition: all 0.3s; position: relative;">
                <div style="position: absolute; top: 15px; left: 15px; background: #3498db; color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                  📁 ФАЙЛЫ
                </div>
                <div style="font-size: 64px; margin-bottom: 15px; color: #3498db;">📤</div>
                <div style="font-size: 18px; color: #2c3e50; font-weight: bold; margin-bottom: 8px;">Перетащите файлы сюда</div>
                <div style="font-size: 14px; color: #7f8c8d; margin-bottom: 15px;">или нажмите для выбора файлов</div>
                <div style="font-size: 12px; color: #95a5a6; background: #f0f0f0; padding: 8px 15px; border-radius: 20px; display: inline-block;">
                  Поддерживаются: .xlsx, .xls, .csv, .json
                </div>
                <div id="selected-files" style="margin-top: 25px;"></div>
              </div>
            </div>
            
            <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 6px; border: 1px solid #e9ecef;">
              <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" id="batch-import" style="accent-color: #3498db; transform: scale(1.2);">
                <div>
                  <div style="font-weight: bold; color: #2c3e50; font-size: 14px;">Пакетный импорт нескольких файлов</div>
                  <div style="font-size: 12px; color: #7f8c8d; margin-top: 3px;">
                    Каждый файл будет обработан отдельно, данные объединятся автоматически
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          <!-- Импорт из буфера -->
          <div id="clipboard-import-section" style="display: none;">
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <label style="font-weight: bold; color: #2c3e50; font-size: 14px;">Вставьте данные из таблицы:</label>
                <button id="clear-clipboard" style="padding: 5px 10px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; cursor: pointer;">Очистить</button>
              </div>
              <textarea id="clipboard-data" placeholder="Пример данных:
ФИО            Задание 1   Задание 2   Задание 3
Иванов И.И.       5           8           10
Петрова А.С.      7           9           8
Сидоров П.А.      6           7           9

Или из Excel/Google таблиц:
ФИО    | Зад1 | Зад2 | Зад3
Иванов | 0.5  | 0.8  | 1
Петрова| 1    | 0.6  | 0.9" 
                style="width: 100%; height: 220px; padding: 15px; border: 1px solid #ddd; border-radius: 6px; font-family: 'Consolas', 'Monaco', monospace; font-size: 13px; resize: vertical; line-height: 1.4; background: #fcfcfc;"></textarea>
            </div>
            <div style="padding: 12px; background: #e8f4fc; border-radius: 6px; border-left: 3px solid #3498db;">
              <div style="font-size: 13px; color: #2c3e50; display: flex; align-items: flex-start; gap: 10px;">
                <span style="font-size: 18px;">💡</span>
                <div>
                  <strong>Как использовать:</strong> Выделите данные в Excel/Google Таблицах → Скопируйте (Ctrl+C) → Вставьте сюда (Ctrl+V)
                </div>
              </div>
            </div>
          </div>
          
          <div style="margin-top: 25px; text-align: center;">
            <button id="start-import" style="padding: 14px 40px; background: linear-gradient(135deg, #2ecc71, #27ae60); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3); transition: transform 0.2s, box-shadow 0.2s; display: inline-flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px;">🚀</span>
              Начать импорт данных
            </button>
          </div>
        </div>
        
        <!-- Шаг 3: Предпросмотр -->
        <div id="preview-section" class="step" style="display: none; margin-bottom: 30px; padding: 25px; background: white; border-radius: 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.08); border-left: 4px solid #f39c12;">
          <h3 style="color: #2c3e50; margin-top: 0; margin-bottom: 20px; font-size: 18px; display: flex; align-items: center; gap: 10px;">
            <span style="background: #f39c12; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">3</span>
            Проверка данных перед импортом
          </h3>
          
          <div id="preview-info" style="margin-bottom: 25px;">
            <div id="import-stats" style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #dee2e6;"></div>
            <div id="validation-errors" style="margin-bottom: 20px;"></div>
          </div>
          
          <div style="overflow-x: auto; max-height: 400px; border: 1px solid #dee2e6; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <table id="preview-table" style="width: 100%; border-collapse: collapse; font-size: 13px; min-width: 700px;">
              <thead style="background: linear-gradient(135deg, #34495e, #2c3e50); color: white; position: sticky; top: 0;">
                <tr id="preview-headers"></tr>
              </thead>
              <tbody id="preview-body"></tbody>
            </table>
          </div>
          
          <div style="margin-top: 30px; display: flex; gap: 12px; justify-content: flex-end; padding-top: 20px; border-top: 1px solid #eee;">
            <button id="cancel-import" style="padding: 12px 25px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; transition: background 0.3s; min-width: 120px;">
              Отмена
            </button>
            <button id="confirm-import" style="padding: 12px 25px; background: linear-gradient(135deg, #2ecc71, #27ae60); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3); transition: transform 0.2s; min-width: 180px; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <span style="font-size: 16px;">✅</span>
              Подтвердить импорт
            </button>
          </div>
        </div>
        
        <!-- Результат -->
        <div id="result-section" style="display: none; padding: 30px; background: white; border-radius: 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.08); text-align: center;">
          <div style="margin-bottom: 25px;">
            <div style="font-size: 64px; color: #2ecc71; margin-bottom: 20px;">🎉</div>
            <h3 style="color: #2ecc71; margin-top: 0; margin-bottom: 15px; font-size: 22px;">Импорт успешно завершен!</h3>
            <div id="result-message" style="margin-bottom: 25px;"></div>
          </div>
          <button id="close-result" style="padding: 12px 30px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; transition: background 0.3s; display: inline-flex; align-items: center; gap: 8px;">
            <span>➡️</span>
            Продолжить работу
          </button>
        </div>
        
        <!-- Инструкции -->
        <div class="instructions" style="margin-top: 35px; padding: 25px; background: linear-gradient(135deg, #e8f4fc, #d4e6f1); border-radius: 8px; border-left: 5px solid #3498db;">
          <h4 style="color: #2c3e50; margin-top: 0; margin-bottom: 20px; font-size: 16px; display: flex; align-items: center; gap: 12px;">
            <span style="background: #3498db; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px;">📌</span>
            Краткие инструкции для учителей
          </h4>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 25px;">
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: transform 0.2s;">
              <div style="font-weight: bold; color: #3498db; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <span>1.</span> Скачайте шаблон
              </div>
              <div style="font-size: 13px; color: #5d6d7e; line-height: 1.5;">
                Выберите подходящий формат шаблона и скачайте его
              </div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: transform 0.2s;">
              <div style="font-weight: bold; color: #3498db; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <span>2.</span> Заполните данные
              </div>
              <div style="font-size: 13px; color: #5d6d7e; line-height: 1.5;">
                Откройте файл в Excel и заполните оценки учеников
              </div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: transform 0.2s;">
              <div style="font-weight: bold; color: #3498db; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <span>3.</span> Загрузите файл
              </div>
              <div style="font-size: 13px; color: #5d6d7e; line-height: 1.5;">
                Выберите заполненный файл или вставьте данные из буфера
              </div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: transform 0.2s;">
              <div style="font-weight: bold; color: #3498db; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <span>4.</span> Проверьте и подтвердите
              </div>
              <div style="font-size: 13px; color: #5d6d7e; line-height: 1.5;">
                Проверьте данные в предпросмотре и подтвердите импорт
              </div>
            </div>
          </div>
          
          <div style="padding: 20px; background: #d1ecf1; border-radius: 8px; border-left: 4px solid #0c5460;">
            <div style="font-weight: bold; color: #0c5460; margin-bottom: 12px; font-size: 15px; display: flex; align-items: center; gap: 10px;">
              <span>⚠️</span> Важная информация о формате оценок
            </div>
            <div style="font-size: 13px; color: #0c5460; line-height: 1.6;">
              • <strong>Максимальный балл</strong> у каждого задания свой (указан в шаблоне)<br>
              • Используйте числа от 0 до максимального балла задания<br>
              • Пример: если макс. балл = 10, то оценки от 0 до 10<br>
              • Для десятичных чисел используйте точку (8.5) или запятую (8,5)<br>
              • Не изменяйте названия столбцов в полном шаблоне<br>
              • Сохраняйте файл в формате Excel (.xlsx) или CSV
            </div>
          </div>
        </div>
      </div>
    `;
    
    const container = document.createElement('div');
    container.innerHTML = uiHTML;
    document.body.appendChild(container.firstElementChild);
    
    this.bindEvents();
    
    // Добавляем стили для hover эффектов
    this.addHoverStyles();
  }

  // Добавление hover стилей
  addHoverStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .export-btn:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 20px rgba(0,0,0,0.15) !important;
      }
      
      #close-import-export-ui:hover {
        background: #f8f9fa !important;
      }
      
      #start-import:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 25px rgba(46, 204, 113, 0.4) !important;
      }
      
      #confirm-import:hover:not([disabled]) {
        transform: translateY(-2px) !important;
      }
      
      #cancel-import:hover {
        background: #7b8a8b !important;
      }
      
      #close-result:hover {
        background: #2980b9 !important;
      }
      
      .instructions > div > div:hover {
        transform: translateY(-3px) !important;
      }
      
      label[for^="import"]:hover {
        background: #e9ecef !important;
      }
      
      #drop-zone:hover {
        background: #f0f7ff !important;
        border-color: #2980b9 !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Привязка событий
  bindEvents() {
    // Кнопки экспорта
    document.querySelectorAll('.export-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.dataset.type || e.target.closest('.export-btn').dataset.type;
        this.exportTemplate(type);
      });
    });
    
    // Переключение источника импорта
    document.querySelectorAll('input[name="import-source"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.toggleImportSource(e.target.value);
      });
    });
    
    // Загрузка файла
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('import-file');
    
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    
    // Drag & drop
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.background = '#e3f2fd';
      dropZone.style.borderColor = '#2980b9';
      dropZone.style.boxShadow = '0 0 20px rgba(52, 152, 219, 0.3)';
    });
    
    dropZone.addEventListener('dragleave', () => {
      dropZone.style.background = '#f8fafc';
      dropZone.style.borderColor = '#3498db';
      dropZone.style.boxShadow = 'none';
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.background = '#f8fafc';
      dropZone.style.borderColor = '#3498db';
      dropZone.style.boxShadow = 'none';
      this.handleFileDrop(e.dataTransfer.files);
    });
    
    // Начало импорта
    document.getElementById('start-import').addEventListener('click', () => {
      this.startImport();
    });
    
    // Кнопки предпросмотра
    document.getElementById('cancel-import').addEventListener('click', () => {
      this.hidePreview();
    });
    
    document.getElementById('confirm-import').addEventListener('click', () => {
      this.confirmImport();
    });
    
    // Закрытие результата
    document.getElementById('close-result').addEventListener('click', () => {
      document.getElementById('result-section').style.display = 'none';
    });
    
    // Закрытие всего UI
    document.getElementById('close-import-export-ui').addEventListener('click', () => {
      this.hideUI();
    });
    
    // Очистка буфера обмена
    document.getElementById('clear-clipboard').addEventListener('click', () => {
      document.getElementById('clipboard-data').value = '';
    });
  }

  // Показать UI
  showUI() {
    const ui = document.getElementById('data-import-export-ui');
    if (ui) {
      ui.style.display = 'block';
      setTimeout(() => {
        ui.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      this.createUI();
    }
  }

  // Скрыть UI
  hideUI() {
    const ui = document.getElementById('data-import-export-ui');
    if (ui) {
      ui.style.display = 'none';
    }
  }

  // Переключение источника импорта
  toggleImportSource(source) {
    document.getElementById('file-import-section').style.display = 
      source === 'file' ? 'block' : 'none';
    document.getElementById('clipboard-import-section').style.display = 
      source === 'clipboard' ? 'block' : 'none';
  }

  // ============================================
  // ЭКСПОРТ ШАБЛОНОВ
  // ============================================

  // Экспорт шаблона
  async exportTemplate(type) {
    try {
      // Всегда используем текущие данные
      const currentData = this.config.appData || this.findAppData();
      
      if (this.config.debug) {
        console.log(`📤 Экспорт шаблона "${type}", данные:`, currentData);
      }
      
      let data;
      switch (type) {
        case 'full':
          data = await this.exporters.full.generate(currentData);
          break;
        case 'simple':
          data = await this.exporters.simple.generate(currentData);
          break;
        case 'csv':
          data = await this.exporters.csv.generate(currentData);
          break;
        case 'googleForms':
          data = await this.exporters.googleForms.generate(currentData);
          break;
        case 'current':
          data = await this.exportCurrentData();
          break;
        default:
          throw new Error(`Неизвестный тип шаблона: ${type}`);
      }
      
      this.downloadFile(data);
      
      // Вызываем callback
      if (this.config.onExport) {
        this.config.onExport({ type, data });
      }
      
    } catch (error) {
      console.error('❌ Ошибка экспорта:', error);
      this.showError(`Ошибка экспорта: ${error.message}`);
    }
  }

  // Экспорт текущих данных
  async exportCurrentData() {
    const currentData = this.config.appData || this.findAppData();
    
    if (!currentData) {
      throw new Error('Нет данных для экспорта');
    }
    
    const tasks = currentData.tasks || [];
    const students = currentData.students || [];
    const results = currentData.results || currentData.resultsSample || [];
    
    if (tasks.length === 0 && students.length === 0 && results.length === 0) {
      throw new Error('Нет данных для экспорта (пустые задачи, студенты и результаты)');
    }
    
    // Определяем максимальный балл для каждого задания
    const taskMaxScores = tasks.map(task => task.maxScore || 1);
    
    // Если нет студентов, но есть результаты, создаем временных студентов
    const exportStudents = students.length > 0 ? students : 
      results.map((_, index) => ({ 
        id: index + 1, 
        name: `Ученик ${index + 1}`,
        class: 'Не указан'
      }));
    
    // Если нет задач, но есть результаты, создаем временные задачи
    const exportTasks = tasks.length > 0 ? tasks : 
      (results[0] || []).map((_, index) => ({ 
        id: index + 1, 
        number: index + 1, 
        level: 1, 
        maxScore: 1 
      }));
    
    // Создаем CSV с текущими данными
    let csv = 'ID,ФИО,Класс,Группа,Примечание';
    exportTasks.forEach((task, index) => {
      csv += `,Задание ${task.number || index + 1} (макс: ${task.maxScore || 1})`;
    });
    csv += '\n';
    
    exportStudents.forEach((student, studentIndex) => {
      const studentId = student.id || studentIndex + 1;
      const studentName = student.name || `Ученик ${studentIndex + 1}`;
      const studentClass = student.class || student.grade || '';
      const studentGroup = student.group || '';
      const studentNote = student.note || student.comment || '';
      
      csv += `${studentId},"${studentName}","${studentClass}","${studentGroup}","${studentNote}"`;
      
      exportTasks.forEach((task, taskIndex) => {
        let score = '';
        
        if (results[studentIndex]) {
          if (Array.isArray(results[studentIndex])) {
            score = results[studentIndex][taskIndex] !== undefined ? results[studentIndex][taskIndex] : '';
          } else if (typeof results[studentIndex] === 'object') {
            const taskKey = `task_${taskIndex + 1}`;
            score = results[studentIndex][taskKey] || results[studentIndex][task.id] || '';
          }
        }
        
        // Форматируем число (заменяем точку на запятую для Excel в русской локали)
        if (score !== '' && !isNaN(score)) {
          score = parseFloat(score).toString().replace('.', ',');
        }
        
        csv += `,${score}`;
      });
      
      csv += '\n';
    });
    
    const timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g, '-');
    
    return {
      filename: `экспорт_данных_${timestamp}.csv`,
      content: csv,
      type: 'text/csv;charset=utf-8;'
    };
  }

  // Скачивание файла
  downloadFile(fileData) {
    try {
      // Если это XLSX, используем библиотеку SheetJS
      if (fileData.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && window.XLSX) {
        this.downloadXLSX(fileData);
      } else {
        // Обычное скачивание для CSV
        const blob = new Blob([fileData.content], { 
          type: fileData.type || 'text/csv;charset=utf-8;' 
        });
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileData.filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        
        // Очистка
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);
      }
      
      this.showSuccess(`Файл "${fileData.filename}" успешно скачан!`);
      
    } catch (error) {
      console.error('❌ Ошибка при скачивании файла:', error);
      this.showError(`Ошибка скачивания: ${error.message}`);
    }
  }

  // Скачивание XLSX файла
  downloadXLSX(fileData) {
    if (!window.XLSX) {
      this.showError('Библиотека XLSX не загружена. Файл будет скачан в формате CSV.');
      this.downloadFile({
        ...fileData,
        type: 'text/csv;charset=utf-8;',
        filename: fileData.filename.replace('.xlsx', '.csv')
      });
      return;
    }
    
    try {
      const wb = fileData.workbook;
      XLSX.writeFile(wb, fileData.filename);
    } catch (error) {
      console.error('Ошибка создания XLSX:', error);
      this.showError(`Ошибка создания Excel файла: ${error.message}`);
    }
  }

  // ============================================
  // ИМПОРТ ДАННЫХ
  // ============================================

  // Начало импорта
  async startImport() {
    const source = document.querySelector('input[name="import-source"]:checked').value;
    
    if (this.config.debug) {
      console.log(`📥 Начало импорта из источника: ${source}`);
    }
    
    try {
      let data;
      
      switch (source) {
        case 'file':
          const fileInput = document.getElementById('import-file');
          if (!fileInput.files || fileInput.files.length === 0) {
            throw new Error('Выберите файл для импорта');
          }
          
          const isBatchImport = document.getElementById('batch-import').checked;
          
          if (isBatchImport) {
            data = await this.importMultipleFiles(fileInput.files);
          } else {
            data = await this.importSingleFile(fileInput.files[0]);
          }
          break;
          
        case 'clipboard':
          const clipboardData = document.getElementById('clipboard-data').value;
          if (!clipboardData.trim()) {
            throw new Error('Вставьте данные в текстовое поле');
          }
          data = await this.importers.clipboard.import(clipboardData);
          break;
          
        case 'json':
          const fileInputJson = document.getElementById('import-file');
          if (!fileInputJson.files || fileInputJson.files.length === 0) {
            throw new Error('Выберите JSON файл');
          }
          data = await this.importers.json.import(fileInputJson.files[0]);
          break;
          
        default:
          throw new Error('Неизвестный источник данных');
      }
      
      // Преобразуем в стандартный формат
      const standardizedData = this.standardizeImportedData(data);
      
      // Валидация с учетом максимальных баллов
      const validation = this.validateImportedData(standardizedData);
      
      // Показываем предпросмотр
      this.showPreview(standardizedData, validation);
      
    } catch (error) {
      console.error('❌ Ошибка импорта:', error);
      this.showError(`Ошибка импорта: ${error.message}`);
    }
  }

  // Импорт одного файла
  async importSingleFile(file) {
    if (!file) {
      throw new Error('Файл не выбран');
    }
    
    const extension = file.name.split('.').pop().toLowerCase();
    
    // Определяем импортер по расширению
    let importer;
    if (['xlsx', 'xls'].includes(extension)) {
      importer = this.importers.xlsx;
    } else if (extension === 'csv') {
      importer = this.importers.csv;
    } else if (extension === 'json') {
      importer = this.importers.json;
    } else {
      throw new Error(`Формат .${extension} не поддерживается. Используйте .xlsx, .xls, .csv или .json`);
    }
    
    return await importer.import(file);
  }

  // Импорт нескольких файлов
  async importMultipleFiles(files) {
    if (!files || files.length === 0) {
      throw new Error('Файлы не выбраны');
    }
    
    const results = [];
    const errors = [];
    
    for (const file of files) {
      try {
        const data = await this.importSingleFile(file);
        results.push({
          filename: file.name,
          data: data,
          size: file.size,
          type: file.type
        });
      } catch (error) {
        errors.push({
          filename: file.name,
          error: error.message
        });
      }
    }
    
    if (results.length === 0) {
      throw new Error('Не удалось импортировать ни один файл');
    }
    
    // Объединяем данные из всех файлов
    const mergedData = this.mergeMultipleFiles(results);
    
    if (errors.length > 0) {
      console.warn('⚠️ Ошибки при импорте некоторых файлов:', errors);
      
      // Показываем предупреждение
      this.showWarning(`Успешно импортировано ${results.length} из ${files.length} файлов. ${errors.length} файлов содержали ошибки.`);
    }
    
    return mergedData;
  }

  // Объединение данных из нескольких файлов
  mergeMultipleFiles(fileResults) {
    const merged = {
      students: [],
      results: [],
      tasks: [],
      metadata: {
        sourceFiles: fileResults.map(f => f.filename),
        mergedAt: new Date().toISOString(),
        totalFiles: fileResults.length
      }
    };
    
    // Собираем уникальные задачи из всех файлов
    const uniqueTasks = new Map();
    
    fileResults.forEach(result => {
      if (result.data && result.data.tasks) {
        result.data.tasks.forEach(task => {
          const key = `${task.id}_${task.number}`;
          if (!uniqueTasks.has(key)) {
            uniqueTasks.set(key, task);
          }
        });
      }
    });
    
    merged.tasks = Array.from(uniqueTasks.values());
    
    // Объединяем студентов и результаты
    let studentCounter = 1;
    
    fileResults.forEach(result => {
      if (result.data && result.data.students) {
        result.data.students.forEach((student, index) => {
          // Создаем уникальный ID для студента
          const mergedStudent = {
            ...student,
            id: studentCounter++,
            originalFile: result.filename,
            originalIndex: index
          };
          
          merged.students.push(mergedStudent);
          
          // Добавляем соответствующие результаты
          if (result.data.results && result.data.results[index]) {
            merged.results.push(result.data.results[index]);
          } else {
            // Если результатов нет, создаем пустой массив
            merged.results.push(new Array(merged.tasks.length).fill(0));
          }
        });
      }
    });
    
    return merged;
  }

  // Стандартизация импортированных данных
  standardizeImportedData(data) {
    const standardized = {
      students: [],
      results: [],
      tasks: this.config.appData?.tasks || [],
      metadata: data.metadata || {},
      originalData: data
    };
    
    // Определяем структуру данных
    if (Array.isArray(data)) {
      // Данные в виде массива строк
      this.processArrayData(data, standardized);
    } else if (data.rows && data.headers) {
      // Данные с заголовками
      this.processRowData(data, standardized);
    } else if (data.students && data.results) {
      // Уже структурированные данные
      standardized.students = data.students;
      standardized.results = data.results;
      standardized.tasks = data.tasks || standardized.tasks;
    } else if (data.data && Array.isArray(data.data)) {
      // Вложенные данные
      this.processNestedData(data, standardized);
    } else if (typeof data === 'object') {
      // Пробуем извлечь данные из объекта
      this.processObjectData(data, standardized);
    }
    
    // Если студентов нет, но есть строки результатов, создаем студентов
    if (standardized.students.length === 0 && standardized.results.length > 0) {
      standardized.students = standardized.results.map((_, index) => ({
        id: index + 1,
        name: `Ученик ${index + 1}`,
        imported: true
      }));
    }
    
    // Если задач нет, но есть результаты, создаем задачи
    if (standardized.tasks.length === 0 && standardized.results.length > 0) {
      const maxTasks = Math.max(...standardized.results.map(r => r.length));
      standardized.tasks = Array.from({ length: maxTasks }, (_, i) => ({
        id: i + 1,
        number: i + 1,
        level: 1,
        maxScore: 1
      }));
    }
    
    return standardized;
  }

  // Обработка массива данных
  processArrayData(data, standardized) {
    if (data.length === 0) return;
    
    // Проверяем, первый элемент - это заголовки или данные
    const firstRow = data[0];
    
    if (typeof firstRow === 'object' && !Array.isArray(firstRow)) {
      // Массив объектов (например, из CSV)
      const headers = Object.keys(firstRow);
      
      // Определяем столбец с именем
      const nameColumn = headers.find(h => 
        h.toLowerCase().includes('фио') || 
        h.toLowerCase().includes('name') || 
        h.toLowerCase().includes('ученик')
      ) || headers[0];
      
      // Определяем столбцы с оценками
      const scoreColumns = headers.filter(h => 
        h.toLowerCase().includes('зад') || 
        h.toLowerCase().includes('task') || 
        h.match(/^\d+$/) ||
        h.toLowerCase().includes('балл') ||
        h.toLowerCase().includes('score')
      );
      
      data.forEach((row, index) => {
        const student = {
          id: index + 1,
          name: row[nameColumn] || `Ученик ${index + 1}`,
          rawData: row
        };
        
        standardized.students.push(student);
        
        // Извлекаем оценки
        const scores = scoreColumns.map(col => {
          const value = row[col];
          return this.parseNumericValue(value);
        }).filter(score => !isNaN(score));
        
        standardized.results.push(scores);
      });
    } else if (Array.isArray(firstRow)) {
      // Массив массивов (табличные данные)
      this.processRowData({ rows: data, headers: firstRow }, standardized);
    }
  }

  // Обработка данных с строками и заголовками
  processRowData(data, standardized) {
    const { rows, headers } = data;
    
    if (!rows || rows.length === 0) return;
    
    // Определяем индекс столбца с именем
    const nameIndex = headers.findIndex(h => 
      h.toLowerCase().includes('фио') || 
      h.toLowerCase().includes('name') || 
      h.toLowerCase().includes('ученик')
    );
    
    // Начинаем с 1, если первая строка - заголовки
    const startIndex = rows[0] === headers ? 1 : 0;
    
    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const student = {
        id: i + 1,
        name: row[nameIndex] || row[0] || `Ученик ${i + 1}`,
        rowData: row
      };
      
      standardized.students.push(student);
      
      // Извлекаем оценки (все столбцы после имени)
      const scores = [];
      for (let j = Math.max(nameIndex, 0) + 1; j < row.length; j++) {
        const value = this.parseNumericValue(row[j]);
        if (!isNaN(value)) {
          scores.push(value);
        }
      }
      
      standardized.results.push(scores);
    }
  }

  // Обработка вложенных данных
  processNestedData(data, standardized) {
    if (data.data && Array.isArray(data.data)) {
      this.processArrayData(data.data, standardized);
    }
    
    if (data.students && Array.isArray(data.students)) {
      standardized.students = data.students;
    }
    
    if (data.results && Array.isArray(data.results)) {
      standardized.results = data.results;
    }
    
    if (data.tasks && Array.isArray(data.tasks)) {
      standardized.tasks = data.tasks;
    }
  }

  // Обработка данных объекта
  processObjectData(data, standardized) {
    // Пробуем найти данные в разных форматах
    const possibleKeys = [
      'students', 'pupils', 'учащиеся', 'ученики',
      'results', 'оценки', 'scores', 'grades',
      'tasks', 'задания', 'exercises'
    ];
    
    for (const key of possibleKeys) {
      if (data[key] && Array.isArray(data[key])) {
        if (key.includes('student') || key.includes('pupil') || key.includes('уч')) {
          standardized.students = data[key];
        } else if (key.includes('result') || key.includes('score') || key.includes('grade') || key.includes('оцен')) {
          standardized.results = data[key];
        } else if (key.includes('task') || key.includes('задан')) {
          standardized.tasks = data[key];
        }
      }
    }
  }

  // Парсинг числового значения
  parseNumericValue(value) {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value === 'string') {
      // Удаляем пробелы
      let str = value.trim();
      
      // Заменяем запятые на точки для десятичных чисел
      str = str.replace(/,/g, '.');
      
      // Удаляем все нечисловые символы, кроме точки и минуса
      str = str.replace(/[^\d.-]/g, '');
      
      // Пробуем распарсить как число
      const num = parseFloat(str);
      
      if (!isNaN(num)) {
        return num;
      }
      
      // Пробуем распарсить дробь
      if (str.includes('/')) {
        const parts = str.split('/').map(p => parseFloat(p));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[1] !== 0) {
          return parts[0] / parts[1];
        }
      }
    }
    
    return 0;
  }

  // Валидация импортированных данных с учетом максимальных баллов
  validateImportedData(data) {
    const errors = [];
    const warnings = [];
    
    // Определяем максимальные баллы для заданий
    const taskMaxScores = data.tasks.map(task => task.maxScore || 1);
    
    // Проверяем наличие данных
    if (!data.students || data.students.length === 0) {
      errors.push('Не найдены данные об учениках');
    } else if (data.students.length > 1000) {
      warnings.push(`Обнаружено большое количество учеников (${data.students.length}). Это может замедлить работу системы.`);
    }
    
    if (!data.results || data.results.length === 0) {
      errors.push('Не найдены результаты заданий');
    }
    
    // Проверяем соответствие количества студентов и результатов
    if (data.students.length !== data.results.length) {
      warnings.push(`Количество учеников (${data.students.length}) не соответствует количеству результатов (${data.results.length})`);
    }
    
    // Проверяем оценки с учетом максимальных баллов
    data.results.forEach((scores, studentIndex) => {
      scores.forEach((score, taskIndex) => {
        const maxScore = taskMaxScores[taskIndex] || 1;
        
        if (score < 0) {
          errors.push(`Строка ${studentIndex + 1}, задание ${taskIndex + 1}: отрицательная оценка ${score}`);
        } else if (score > maxScore) {
          warnings.push(`Строка ${studentIndex + 1}, задание ${taskIndex + 1}: оценка ${score} превышает максимальный балл ${maxScore}`);
        }
        
        if (isNaN(score)) {
          errors.push(`Строка ${studentIndex + 1}, задание ${taskIndex + 1}: некорректное числовое значение`);
        }
      });
    });
    
    // Проверяем имена студентов
    const emptyNames = [];
    data.students.forEach((student, index) => {
      if (!student.name || student.name.trim() === '') {
        emptyNames.push(index + 1);
      }
    });
    
    if (emptyNames.length > 0) {
      warnings.push(`Строки ${emptyNames.join(', ')}: отсутствует имя ученика`);
    }
    
    // Проверяем задачи
    if (data.tasks && data.tasks.length > 0) {
      data.tasks.forEach((task, index) => {
        if (!task.id || !task.number) {
          warnings.push(`Задание ${index + 1}: отсутствует ID или номер`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      hasWarnings: warnings.length > 0,
      errors,
      warnings,
      stats: {
        students: data.students.length,
        tasks: data.results[0] ? data.results[0].length : 0,
        totalScores: data.results.reduce((sum, scores) => sum + scores.length, 0)
      }
    };
  }

  // ============================================
  // ПРЕДПРОСМОТР
  // ============================================

  // Показать предпросмотр
  showPreview(data, validation) {
    this.currentImportData = data;
    this.currentValidation = validation;
    
    const previewSection = document.getElementById('preview-section');
    const statsDiv = document.getElementById('import-stats');
    const errorsDiv = document.getElementById('validation-errors');
    const headersRow = document.getElementById('preview-headers');
    const bodyDiv = document.getElementById('preview-body');
    
    // Очищаем предыдущие данные
    headersRow.innerHTML = '';
    bodyDiv.innerHTML = '';
    
    // Получаем максимальные баллы для заданий
    const taskMaxScores = data.tasks.map(task => task.maxScore || 1);
    
    // Показываем статистику
    const taskCount = validation.stats.tasks;
    const studentCount = validation.stats.students;
    
    statsDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: bold; color: #2c3e50; margin-bottom: 8px; font-size: 15px;">📊 Статистика импорта:</div>
          <div style="display: flex; gap: 20px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: #3498db; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">👨‍🎓</span>
              <div>
                <div style="font-size: 11px; color: #7f8c8d;">Учеников</div>
                <div style="font-weight: bold; color: #2c3e50; font-size: 16px;">${studentCount}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: #2ecc71; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">📝</span>
              <div>
                <div style="font-size: 11px; color: #7f8c8d;">Заданий</div>
                <div style="font-weight: bold; color: #2c3e50; font-size: 16px;">${taskCount}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: #9b59b6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">📊</span>
              <div>
                <div style="font-size: 11px; color: #7f8c8d;">Оценок</div>
                <div style="font-weight: bold; color: #2c3e50; font-size: 16px;">${validation.stats.totalScores}</div>
              </div>
            </div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="padding: 8px 15px; background: ${validation.isValid ? '#d5f4e6' : '#fdeaea'}; border-radius: 20px; border: 2px solid ${validation.isValid ? '#2ecc71' : '#e74c3c'};">
            <div style="font-weight: bold; color: ${validation.isValid ? '#27ae60' : '#c0392b'}; margin-bottom: 3px; font-size: 14px;">
              ${validation.isValid ? '✅ Данные корректны' : '❌ Есть ошибки'}
            </div>
            <div style="font-size: 12px; color: ${validation.hasWarnings ? '#e67e22' : '#7f8c8d'}">
              ${validation.hasWarnings ? '⚠️ Есть предупреждения' : '✓ Предупреждений нет'}
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Показываем ошибки и предупреждения
    let errorsHTML = '';
    
    if (validation.errors.length > 0) {
      errorsHTML += '<div style="margin-bottom: 15px; padding: 15px; background: #fdeaea; border-radius: 8px; border-left: 4px solid #e74c3c;">';
      errorsHTML += '<strong style="color: #e74c3c; display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 14px;">❌ Ошибки:</strong>';
      validation.errors.forEach((error, index) => {
        if (index < 5) { // Показываем только первые 5 ошибок
          errorsHTML += `<div style="margin-left: 10px; font-size: 13px; color: #c0392b; padding: 5px 0; border-bottom: 1px solid #fadbd8; display: flex; align-items: center; gap: 8px;">
            <span style="color: #e74c3c; font-size: 10px;">●</span> ${error}
          </div>`;
        }
      });
      if (validation.errors.length > 5) {
        errorsHTML += `<div style="margin-left: 10px; font-size: 13px; color: #e74c3c; padding: 5px 0; font-weight: bold;">
          • ... и еще ${validation.errors.length - 5} ошибок
        </div>`;
      }
      errorsHTML += '</div>';
    }
    
    if (validation.warnings.length > 0) {
      errorsHTML += '<div style="padding: 15px; background: #fef9e7; border-radius: 8px; border-left: 4px solid #f39c12;">';
      errorsHTML += '<strong style="color: #f39c12; display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 14px;">⚠️ Предупреждения:</strong>';
      validation.warnings.forEach((warning, index) => {
        if (index < 5) { // Показываем только первые 5 предупреждений
          errorsHTML += `<div style="margin-left: 10px; font-size: 13px; color: #d35400; padding: 5px 0; border-bottom: 1px solid #fdebd0; display: flex; align-items: center; gap: 8px;">
            <span style="color: #f39c12; font-size: 10px;">●</span> ${warning}
          </div>`;
        }
      });
      if (validation.warnings.length > 5) {
        errorsHTML += `<div style="margin-left: 10px; font-size: 13px; color: #f39c12; padding: 5px 0; font-weight: bold;">
          • ... и еще ${validation.warnings.length - 5} предупреждений
        </div>`;
      }
      errorsHTML += '</div>';
    }
    
    errorsDiv.innerHTML = errorsHTML;
    
    // Создаем заголовки таблицы
    const headers = ['№', 'ФИО'];
    for (let i = 1; i <= taskCount; i++) {
      const maxScore = taskMaxScores[i-1] || 1;
      headers.push(`Зад. ${i}<br><small>макс: ${maxScore}</small>`);
    }
    
    headers.forEach(header => {
      const th = document.createElement('th');
      th.innerHTML = header;
      th.style.padding = '12px 8px';
      th.style.border = '1px solid #4a6572';
      th.style.textAlign = 'center';
      th.style.fontWeight = 'bold';
      th.style.background = 'linear-gradient(135deg, #34495e, #2c3e50)';
      th.style.color = 'white';
      th.style.position = 'sticky';
      th.style.top = '0';
      th.style.minWidth = '80px';
      headersRow.appendChild(th);
    });
    
    // Заполняем таблицу данными
    data.students.forEach((student, index) => {
      const row = document.createElement('tr');
      row.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : 'white';
      
      // Номер
      const cell1 = document.createElement('td');
      cell1.textContent = index + 1;
      cell1.style.padding = '10px 8px';
      cell1.style.border = '1px solid #dee2e6';
      cell1.style.textAlign = 'center';
      cell1.style.fontWeight = 'bold';
      cell1.style.background = index % 2 === 0 ? '#e9ecef' : 'white';
      row.appendChild(cell1);
      
      // Имя
      const cell2 = document.createElement('td');
      cell2.textContent = student.name || `Ученик ${index + 1}`;
      cell2.style.padding = '10px 8px';
      cell2.style.border = '1px solid #dee2e6';
      cell2.style.fontWeight = 'bold';
      row.appendChild(cell2);
      
      // Оценки
      const scores = data.results[index] || new Array(taskCount).fill(0);
      scores.forEach((score, scoreIndex) => {
        const cell = document.createElement('td');
        cell.textContent = score !== undefined && score !== '' ? score : '-';
        cell.style.padding = '10px 8px';
        cell.style.border = '1px solid #dee2e6';
        cell.style.textAlign = 'center';
        cell.style.fontFamily = "'Consolas', 'Monaco', monospace";
        cell.style.fontSize = '13px';
        
        const maxScore = taskMaxScores[scoreIndex] || 1;
        
        // Подсветка значений с учетом максимального балла
        if (score === undefined || score === '') {
          cell.style.background = '#f8f9fa';
          cell.style.color = '#95a5a6';
        } else if (score < 0) {
          cell.style.background = '#ffebee';
          cell.style.color = '#c62828';
          cell.style.fontWeight = 'bold';
          cell.title = 'Отрицательная оценка';
        } else if (score > maxScore) {
          cell.style.background = '#fff3e0';
          cell.style.color = '#ef6c00';
          cell.style.fontWeight = 'bold';
          cell.title = `Превышен максимальный балл (${maxScore})`;
        } else if (score >= maxScore * 0.8) {
          cell.style.background = '#e8f5e9';
          cell.style.color = '#2e7d32';
          cell.title = 'Высокий результат';
        } else if (score >= maxScore * 0.5) {
          cell.style.background = '#fff3e0';
          cell.style.color = '#ef6c00';
          cell.title = 'Средний результат';
        } else if (score > 0) {
          cell.style.background = '#fce4ec';
          cell.style.color = '#c2185b';
          cell.title = 'Низкий результат';
        } else {
          cell.style.background = '#f5f5f5';
          cell.style.color = '#757575';
          cell.title = 'Нулевая оценка';
        }
        
        row.appendChild(cell);
      });
      
      bodyDiv.appendChild(row);
    });
    
    // Показываем секцию предпросмотра
    previewSection.style.display = 'block';
    
    // Активируем/деактивируем кнопку подтверждения
    const confirmBtn = document.getElementById('confirm-import');
    confirmBtn.disabled = !validation.isValid;
    confirmBtn.style.opacity = validation.isValid ? '1' : '0.5';
    confirmBtn.style.cursor = validation.isValid ? 'pointer' : 'not-allowed';
    confirmBtn.title = validation.isValid ? 'Нажмите для подтверждения импорта' : 'Исправьте ошибки перед импортом';
    
    // Прокручиваем к предпросмотру
    setTimeout(() => {
      previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  // Скрыть предпросмотр
  hidePreview() {
    document.getElementById('preview-section').style.display = 'none';
    this.currentImportData = null;
    this.currentValidation = null;
    
    // Очищаем форму импорта
    document.getElementById('import-file').value = '';
    document.getElementById('clipboard-data').value = '';
    document.getElementById('selected-files').innerHTML = '';
    document.getElementById('drop-zone').innerHTML = `
      <div style="position: absolute; top: 15px; left: 15px; background: #3498db; color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold;">
        📁 ФАЙЛЫ
      </div>
      <div style="font-size: 64px; margin-bottom: 15px; color: #3498db;">📤</div>
      <div style="font-size: 18px; color: #2c3e50; font-weight: bold; margin-bottom: 8px;">Перетащите файлы сюда</div>
      <div style="font-size: 14px; color: #7f8c8d; margin-bottom: 15px;">или нажмите для выбора файлов</div>
      <div style="font-size: 12px; color: #95a5a6; background: #f0f0f0; padding: 8px 15px; border-radius: 20px; display: inline-block;">
        Поддерживаются: .xlsx, .xls, .csv, .json
      </div>
      <div id="selected-files" style="margin-top: 25px;"></div>
    `;
  }

  // Подтверждение импорта
  async confirmImport() {
    if (!this.currentImportData || !this.currentValidation || !this.currentValidation.isValid) {
      this.showError('Невозможно подтвердить импорт: данные не прошли валидацию');
      return;
    }
    
    try {
      // Преобразуем данные в формат вашего приложения
      const appData = this.convertToAppDataFormat(this.currentImportData);
      
      // Сохраняем данные
      await this.saveImportedData(appData);
      
      // Показываем результат
      this.showImportResult(appData);
      
      // Скрываем предпросмотр
      this.hidePreview();
      
    } catch (error) {
      console.error('❌ Ошибка при сохранении данных:', error);
      this.showError(`Ошибка сохранения: ${error.message}`);
    }
  }

  // Преобразование в формат appData
  convertToAppDataFormat(data) {
    // Определяем текущие задачи или используем импортированные
    const currentTasks = this.config.appData?.tasks || [];
    const tasks = data.tasks && data.tasks.length > 0 ? data.tasks : currentTasks;
    
    // Создаем структуру, совместимую с вашим appData
    const appData = {
      test: this.config.appData?.test || {},
      tasks: tasks,
      students: data.students.map((student, index) => ({
        id: student.id || index + 1,
        name: student.name,
        class: student.class || student.grade || '',
        group: student.group || '',
        note: student.note || student.comment || '',
        imported: true,
        importDate: new Date().toISOString(),
        ...(student.rawData || {})
      })),
      results: data.results,
      errors: [],
      studentErrors: {},
      psychologyFeatures: this.config.appData?.psychologyFeatures || [],
      templates: this.config.appData?.templates || {},
      metadata: {
        ...this.config.appData?.metadata,
        lastImport: new Date().toISOString(),
        importedStudents: data.students.length,
        importedTasks: tasks.length
      }
    };
    
    return appData;
  }

  // Сохранение импортированных данных
  async saveImportedData(appData) {
    // Вызываем callback если есть
    if (this.config.onImport) {
      await this.config.onImport(appData);
    }
    
    // Обновляем данные модуля
    this.updateAppData(appData);
    
    // Сохраняем в localStorage
    try {
      localStorage.setItem('appData', JSON.stringify(appData));
      if (this.config.debug) {
        console.log('💾 Данные сохранены в localStorage');
      }
    } catch (e) {
      console.error('❌ Ошибка сохранения в localStorage:', e);
    }
    
    // Обновляем глобальную переменную если существует
    if (typeof window !== 'undefined') {
      window.appData = appData;
    }
  }

  // Показать результат импорта
  showImportResult(appData) {
    const resultSection = document.getElementById('result-section');
    const resultMessage = document.getElementById('result-message');
    
    const studentCount = appData.students.length;
    const taskCount = appData.tasks.length;
    const scoreCount = appData.results.reduce((sum, scores) => sum + scores.length, 0);
    
    // Рассчитываем средние баллы
    const avgScores = [];
    if (appData.results.length > 0 && appData.results[0].length > 0) {
      for (let i = 0; i < appData.results[0].length; i++) {
        let sum = 0;
        let count = 0;
        for (let j = 0; j < appData.results.length; j++) {
          if (appData.results[j][i] !== undefined) {
            sum += appData.results[j][i];
            count++;
          }
        }
        avgScores.push(count > 0 ? (sum / count).toFixed(2) : '0');
      }
    }
    
    resultMessage.innerHTML = `
      <div style="margin-bottom: 25px; font-size: 16px; color: #2c3e50;">
        Данные успешно импортированы в систему и готовы для анализа!
      </div>
      
      <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 25px; border-radius: 10px; margin-bottom: 25px; box-shadow: 0 3px 10px rgba(0,0,0,0.05);">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center; margin-bottom: 25px;">
          <div style="padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <div style="font-size: 32px; color: #3498db; font-weight: bold; margin-bottom: 5px;">${studentCount}</div>
            <div style="font-size: 12px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px;">учеников</div>
          </div>
          <div style="padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <div style="font-size: 32px; color: #2ecc71; font-weight: bold; margin-bottom: 5px;">${taskCount}</div>
            <div style="font-size: 12px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px;">заданий</div>
          </div>
          <div style="padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <div style="font-size: 32px; color: #9b59b6; font-weight: bold; margin-bottom: 5px;">${scoreCount}</div>
            <div style="font-size: 12px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px;">оценок</div>
          </div>
        </div>
        
        ${avgScores.length > 0 ? `
        <div style="padding-top: 20px; border-top: 1px solid #dee2e6;">
          <div style="font-size: 14px; color: #2c3e50; margin-bottom: 10px; font-weight: bold;">Средние баллы по заданиям:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            ${avgScores.map((avg, index) => `
              <div style="padding: 8px 15px; background: ${avg >= (appData.tasks[index]?.maxScore || 1) * 0.8 ? '#e8f5e9' : avg >= (appData.tasks[index]?.maxScore || 1) * 0.5 ? '#fff3e0' : '#fce4ec'}; border-radius: 20px; border: 1px solid #dee2e6; font-size: 12px;">
                <span style="font-weight: bold; color: #2c3e50;">Зад. ${index + 1}:</span>
                <span style="color: #7f8c8d; margin-left: 5px;">${avg}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>
      
      <div style="font-size: 14px; color: #7f8c8d; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        Теперь вы можете анализировать результаты, строить графики и генерировать отчеты.
      </div>
    `;
    
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth' });
  }

  // ============================================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ============================================

  // Обработка выбора файла
  handleFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
      this.updateSelectedFiles(files);
    }
  }

  // Обработка перетаскивания файла
  handleFileDrop(files) {
    if (files.length > 0) {
      const fileInput = document.getElementById('import-file');
      
      // Создаем новый DataTransfer для множественного выбора
      const dataTransfer = new DataTransfer();
      for (const file of files) {
        dataTransfer.items.add(file);
      }
      
      fileInput.files = dataTransfer.files;
      this.updateSelectedFiles(files);
    }
  }

  // Обновление списка выбранных файлов
  updateSelectedFiles(files) {
    const selectedFilesDiv = document.getElementById('selected-files');
    const fileList = Array.from(files).map(file => {
      const size = file.size > 1024 * 1024 ? 
        `${(file.size / (1024 * 1024)).toFixed(1)} MB` : 
        `${(file.size / 1024).toFixed(0)} KB`;
      
      const icon = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? '📊' :
                   file.name.endsWith('.csv') ? '📝' :
                   file.name.endsWith('.json') ? '🔧' : '📄';
      
      return `
        <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: white; border-radius: 6px; margin-bottom: 8px; border: 1px solid #e9ecef; transition: transform 0.2s;">
          <div style="font-size: 20px;">${icon}</div>
          <div style="flex: 1;">
            <div style="font-weight: bold; font-size: 13px; color: #2c3e50; margin-bottom: 3px;">${file.name}</div>
            <div style="display: flex; gap: 15px; font-size: 11px; color: #7f8c8d;">
              <span>${size}</span>
              <span>${file.type || 'Неизвестный тип'}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    selectedFilesDiv.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold; color: #3498db; font-size: 14px; display: flex; align-items: center; gap: 8px;">
        <span>📁</span> Выбрано файлов: ${files.length}
      </div>
      ${fileList}
    `;
    
    // Обновляем текст в drop zone
    const dropZone = document.getElementById('drop-zone');
    const originalContent = dropZone.innerHTML;
    dropZone.innerHTML = `
      <div style="position: absolute; top: 15px; left: 15px; background: #2ecc71; color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold;">
        ✅ ГОТОВО
      </div>
      <div style="font-size: 48px; margin-bottom: 10px; color: #2ecc71;">✅</div>
      <div style="font-size: 16px; color: #27ae60; font-weight: bold; margin-bottom: 5px;">Файлы выбраны</div>
      <div style="font-size: 14px; color: #7f8c8d; margin-bottom: 15px;">${files.length} файл(ов) готово к импорту</div>
      ${selectedFilesDiv.outerHTML}
    `;
  }

  // Показать сообщение
  showMessage(message, type = 'info', duration = 3000) {
    const colors = {
      success: '#2ecc71',
      error: '#e74c3c',
      info: '#3498db',
      warning: '#f39c12'
    };
    
    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️'
    };
    
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      background: ${colors[type] || colors.info};
      color: white;
      border-radius: 8px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.2);
      z-index: 10000;
      max-width: 400px;
      display: flex;
      align-items: center;
      gap: 12px;
      opacity: 0;
      transform: translateX(100px);
      transition: opacity 0.3s, transform 0.3s;
      backdrop-filter: blur(10px);
    `;
    
    messageDiv.innerHTML = `
      <span style="font-size: 22px;">${icons[type] || icons.info}</span>
      <span style="font-size: 14px; line-height: 1.4;">${message}</span>
    `;
    
    document.body.appendChild(messageDiv);
    
    // Анимация появления
    setTimeout(() => {
      messageDiv.style.opacity = '1';
      messageDiv.style.transform = 'translateX(0)';
    }, 10);
    
    // Автоматическое скрытие
    setTimeout(() => {
      messageDiv.style.opacity = '0';
      messageDiv.style.transform = 'translateX(100px)';
      setTimeout(() => {
        if (messageDiv.parentNode) {
          document.body.removeChild(messageDiv);
        }
      }, 300);
    }, duration);
  }

  // Показать ошибку
  showError(message) {
    this.showMessage(message, 'error', 5000);
  }

  // Показать успех
  showSuccess(message) {
    this.showMessage(message, 'success');
  }

  // Показать предупреждение
  showWarning(message) {
    this.showMessage(message, 'warning', 4000);
  }
}

// ============================================
// ИМПОРТЕРЫ (остаются без изменений, как в предыдущей версии)
// ============================================

class BaseImporter {
  async import(source) {
    throw new Error('Метод import должен быть реализован');
  }
  
  parseValue(value) {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value === 'string') {
      value = value.trim().replace(/,/g, '.');
      
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return num;
      }
      
      if (value.includes('/')) {
        const parts = value.split('/').map(p => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[1] !== 0) {
          return parts[0] / parts[1];
        }
      }
      
      return value;
    }
    
    return value;
  }
}

class XLSXImporter extends BaseImporter {
  async import(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) {
            throw new Error('Файл пуст');
          }
          
          const firstLine = lines[0];
          const delimiter = firstLine.includes('\t') ? '\t' : 
                           firstLine.includes(';') ? ';' : ',';
          
          const headers = this.parseCSVLine(firstLine, delimiter)
            .map(h => h.trim().replace(/^"|"$/g, ''));
          
          const rows = [];
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
              const values = this.parseCSVLine(line, delimiter);
              const row = {};
              
              headers.forEach((header, index) => {
                row[header] = this.parseValue(values[index] || '');
              });
              
              rows.push(row);
            }
          }
          
          resolve({
            rows,
            headers,
            metadata: {
              type: 'excel',
              filename: file.name,
              size: file.size,
              rows: rows.length,
              columns: headers.length
            }
          });
          
        } catch (error) {
          reject(new Error(`Ошибка чтения Excel файла: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsText(file);
    });
  }
  
  parseCSVLine(line, delimiter) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current);
    return values.map(v => v.trim());
  }
}

class CSVImporter extends BaseImporter {
  async import(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) {
            throw new Error('Файл пуст');
          }
          
          const firstLine = lines[0];
          const delimiter = this.detectDelimiter(firstLine);
          
          const headers = this.parseCSVLine(firstLine, delimiter)
            .map(h => h.trim().replace(/^"|"$/g, ''));
          
          const rows = [];
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
              const values = this.parseCSVLine(line, delimiter);
              const row = {};
              
              headers.forEach((header, index) => {
                row[header] = this.parseValue(values[index] || '');
              });
              
              rows.push(row);
            }
          }
          
          resolve({
            rows,
            headers,
            metadata: {
              type: 'csv',
              filename: file.name,
              size: file.size,
              delimiter,
              rows: rows.length,
              columns: headers.length
            }
          });
          
        } catch (error) {
          reject(new Error(`Ошибка чтения CSV файла: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsText(file, 'UTF-8');
    });
  }
  
  detectDelimiter(line) {
    const delimiters = ['\t', ';', ','];
    const counts = delimiters.map(d => (line.match(new RegExp(d, 'g')) || []).length);
    const maxIndex = counts.indexOf(Math.max(...counts));
    return delimiters[maxIndex];
  }
  
  parseCSVLine(line, delimiter) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current);
    return values.map(v => v.trim().replace(/^"|"$/g, ''));
  }
}

class ClipboardImporter extends BaseImporter {
  async import(text) {
    try {
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('Буфер обмена пуст');
      }
      
      const delimiter = this.detectDelimiter(lines[0]);
      
      let headers, startIndex;
      
      const firstLineValues = this.parseLine(lines[0], delimiter);
      const hasHeaders = firstLineValues.some(val => 
        typeof val === 'string' && !this.isNumeric(val)
      );
      
      if (hasHeaders) {
        headers = firstLineValues.map(h => h.toString().trim());
        startIndex = 1;
      } else {
        headers = ['ФИО', ...firstLineValues.slice(1).map((_, i) => `Задание ${i + 1}`)];
        startIndex = 0;
      }
      
      const rows = [];
      
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const values = this.parseLine(line, delimiter);
          const row = {};
          
          headers.forEach((header, index) => {
            row[header] = this.parseValue(values[index] || '');
          });
          
          rows.push(row);
        }
      }
      
      return {
        rows,
        headers,
        metadata: {
          type: 'clipboard',
          rowsCount: rows.length,
          hasAutoHeaders: !hasHeaders
        }
      };
      
    } catch (error) {
      throw new Error(`Ошибка обработки данных из буфера: ${error.message}`);
    }
  }
  
  detectDelimiter(line) {
    const delimiters = ['\t', ';', ',', '|', ' '];
    let bestDelimiter = '\t';
    let maxCount = 0;
    
    for (const delimiter of delimiters) {
      const count = (line.match(new RegExp(delimiter, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delimiter;
      }
    }
    
    return bestDelimiter;
  }
  
  parseLine(line, delimiter) {
    return line.split(delimiter).map(v => v.trim());
  }
  
  isNumeric(value) {
    const str = value.toString().replace(/,/g, '.');
    return !isNaN(parseFloat(str)) && isFinite(str);
  }
}

class JSONImporter extends BaseImporter {
  async import(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          
          if (!this.isValidStructure(json)) {
            throw new Error('Неподдерживаемая структура JSON. Ожидается массив объектов или объект с полями students, results, tasks');
          }
          
          const standardized = this.standardizeStructure(json);
          
          resolve({
            ...standardized,
            metadata: {
              type: 'json',
              filename: file.name,
              size: file.size,
              originalType: Array.isArray(json) ? 'array' : 'object'
            }
          });
          
        } catch (error) {
          reject(new Error(`Ошибка чтения JSON файла: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsText(file);
    });
  }
  
  isValidStructure(data) {
    return Array.isArray(data) || 
           (data && typeof data === 'object' && 
            (data.students || data.results || data.tasks || data.data));
  }
  
  standardizeStructure(data) {
    if (Array.isArray(data)) {
      return { rows: data };
    } else if (data.rows && Array.isArray(data.rows)) {
      return data;
    } else if (data.students && Array.isArray(data.students)) {
      return data;
    } else if (data.data && Array.isArray(data.data)) {
      return { rows: data.data };
    } else {
      const rows = [];
      
      for (const key in data) {
        if (Array.isArray(data[key]) && data[key].length > 0 && 
            typeof data[key][0] === 'object') {
          rows.push(...data[key]);
        }
      }
      
      return { rows };
    }
  }
}

// ============================================
// ЭКСПОРТЕРЫ XLSX
// ============================================

class BaseExporter {
  constructor(config = {}) {
    this.useXLSX = config.useXLSX || false;
  }
  
  async generate(appData) {
    throw new Error('Метод generate должен быть реализован');
  }
  
  formatScore(score) {
    if (score === null || score === undefined || score === '') {
      return '';
    }
    
    const num = parseFloat(score);
    if (isNaN(num)) {
      return score.toString();
    }
    
    // Для XLSX используем числа, для CSV - строки с запятыми
    if (this.useXLSX) {
      return num;
    } else {
      return num.toFixed(2).replace('.', ',');
    }
  }
  
  // Создание XLSX workbook
  createWorkbook(sheets) {
    if (!window.XLSX) {
      throw new Error('Библиотека XLSX не загружена');
    }
    
    const wb = XLSX.utils.book_new();
    
    sheets.forEach(sheet => {
      const ws = XLSX.utils.aoa_to_sheet(sheet.data);
      
      // Настройка ширины столбцов
      if (sheet.colWidths) {
        ws['!cols'] = sheet.colWidths.map(width => ({ width }));
      }
      
      // Настройка стилей ячеек (если поддерживается)
      if (sheet.styles) {
        ws['!styles'] = sheet.styles;
      }
      
      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });
    
    return wb;
  }
}

// Полный шаблон с инструкциями (XLSX)
class FullTemplateExporter extends BaseExporter {
  async generate(appData) {
    const tasks = appData?.tasks || [];
    const currentDate = new Date();
    const timestamp = currentDate.toISOString().slice(0,19).replace(/[:T]/g, '-');
    const formattedDate = currentDate.toLocaleDateString('ru-RU');
    
    if (this.useXLSX) {
      return this.generateXLSX(appData, tasks, timestamp, formattedDate);
    } else {
      return this.generateCSV(appData, tasks, timestamp, formattedDate);
    }
  }
  
  generateCSV(appData, tasks, timestamp, formattedDate) {
    // Реализация CSV (резервный вариант)
    let csv = 'ИНСТРУКЦИЯ ПО ЗАПОЛНЕНИЮ ШАБЛОНА\n';
    csv += '================================\n\n';
    // ... (остальной код как раньше)
    
    return {
      filename: `полный_шаблон_${timestamp}.csv`,
      content: csv,
      type: 'text/csv;charset=utf-8;'
    };
  }
  
  generateXLSX(appData, tasks, timestamp, formattedDate) {
    // Создаем листы для XLSX
    
    // 1. Лист с инструкциями
    const instructionSheet = {
      name: 'ИНСТРУКЦИЯ',
      data: [
        ['ИНСТРУКЦИЯ ПО ЗАПОЛНЕНИЮ ШАБЛОНА'],
        [''],
        ['1. ЭТОТ ФАЙЛ СОДЕРЖИТ НЕСКОЛЬКО ЛИСТОВ:'],
        ['   - ИНСТРУКЦИЯ (этот лист)'],
        ['   - УЧЕНИКИ (список учеников)'],
        ['   - ЗАДАНИЯ (список заданий)'],
        ['   - РЕЗУЛЬТАТЫ (таблица для ввода оценок)'],
        [''],
        ['2. ПОРЯДОК ЗАПОЛНЕНИЯ:'],
        ['   a) В листе "УЧЕНИКИ" укажите данные учеников'],
        ['   b) В листе "РЕЗУЛЬТАТЫ" введите оценки от 0 до максимального балла'],
        ['   c) Максимальный балл для каждого задания указан в листе "ЗАДАНИЯ"'],
        ['   d) Для десятичных чисел используйте точку (8.5) или запятую (8,5)'],
        [''],
        ['3. СОХРАНЕНИЕ:'],
        ['   Сохраните файл в формате Excel (.xlsx)'],
        ['   и импортируйте обратно в систему'],
        [''],
        ['Дата создания шаблона: ' + formattedDate],
        [''],
        ['ВАЖНО: Не изменяйте структуру таблиц и названия столбцов!']
      ],
      colWidths: [60]
    };
    
    // 2. Лист с учениками
    const studentsData = [
      ['ID', 'ФИО', 'Класс', 'Группа', 'Примечание'],
      [1, 'Иванов Иван Иванович', '5А', 'Группа 1', 'Пример заполнения'],
      [2, 'Петрова Анна Сергеевна', '5А', 'Группа 2', 'Пример заполнения'],
      [3, 'Сидоров Петр Алексеевич', '5Б', 'Группа 1', 'Пример заполнения'],
      [4, '', '', '', ''],
      [5, '', '', '', ''],
      [6, '', '', '', ''],
      [7, '', '', '', ''],
      [8, '', '', '', ''],
      [9, '', '', '', ''],
      [10, '', '', '', '']
    ];
    
    const studentsSheet = {
      name: 'УЧЕНИКИ',
      data: studentsData,
      colWidths: [10, 30, 15, 15, 30]
    };
    
    // 3. Лист с заданиями
    const tasksData = [
      ['ID', 'Номер', 'Уровень сложности', 'Максимальный балл', 'Тема', 'Описание']
    ];
    
    if (tasks.length > 0) {
      tasks.forEach((task, index) => {
        tasksData.push([
          task.id || index + 1,
          task.number || index + 1,
          task.level || 1,
          task.maxScore || 1,
          task.topic || `Тема ${task.number || index + 1}`,
          task.description || `Задание №${task.number || index + 1}`
        ]);
      });
    } else {
      // Примерные задания
      for (let i = 1; i <= 10; i++) {
        tasksData.push([
          i,
          i,
          i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1,
          i % 4 === 0 ? 20 : i % 3 === 0 ? 15 : i % 2 === 0 ? 10 : 5,
          `Тема ${i}`,
          `Задание №${i}`
        ]);
      }
    }
    
    const tasksSheet = {
      name: 'ЗАДАНИЯ',
      data: tasksData,
      colWidths: [10, 10, 20, 20, 25, 40]
    };
    
    // 4. Лист с результатами
    const resultsHeader = ['ID ученика', 'ФИО', 'Класс'];
    
    // Добавляем заголовки для заданий
    const taskCount = Math.max(tasks.length, 10);
    for (let i = 1; i <= taskCount; i++) {
      const maxScore = tasks[i-1]?.maxScore || (i % 4 === 0 ? 20 : i % 3 === 0 ? 15 : i % 2 === 0 ? 10 : 5);
      resultsHeader.push(`Задание ${i} (макс: ${maxScore})`);
    }
    
    const resultsData = [resultsHeader];
    
    // Добавляем примеры данных
    const exampleStudents = [
      { id: 1, name: 'Иванов И.И.', class: '5А' },
      { id: 2, name: 'Петрова А.С.', class: '5А' },
      { id: 3, name: 'Сидоров П.А.', class: '5Б' }
    ];
    
    exampleStudents.forEach(student => {
      const row = [student.id, student.name, student.class];
      
      for (let i = 1; i <= taskCount; i++) {
        const maxScore = tasks[i-1]?.maxScore || (i % 4 === 0 ? 20 : i % 3 === 0 ? 15 : i % 2 === 0 ? 10 : 5);
        let score;
        
        if (student.id === 1) score = maxScore * 0.5; // 50%
        else if (student.id === 2) score = maxScore * 0.8; // 80%
        else score = maxScore * 1.0; // 100%
        
        row.push(score);
      }
      
      resultsData.push(row);
    });
    
    // Добавляем пустые строки для заполнения
    for (let i = 4; i <= 30; i++) {
      const row = [i, '', '', ...new Array(taskCount).fill('')];
      resultsData.push(row);
    }
    
    // Настраиваем ширину столбцов для результатов
    const resultsColWidths = [12, 30, 12];
    for (let i = 0; i < taskCount; i++) {
      resultsColWidths.push(15);
    }
    
    const resultsSheet = {
      name: 'РЕЗУЛЬТАТЫ',
      data: resultsData,
      colWidths: resultsColWidths
    };
    
    // Создаем workbook
    const wb = this.createWorkbook([
      instructionSheet,
      studentsSheet,
      tasksSheet,
      resultsSheet
    ]);
    
    return {
      filename: `полный_шаблон_${timestamp}.xlsx`,
      workbook: wb,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }
}

// Простой шаблон (XLSX)
class SimpleTemplateExporter extends BaseExporter {
  async generate(appData) {
    const tasks = appData?.tasks || [];
    const timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g, '-');
    
    if (this.useXLSX) {
      return this.generateXLSX(appData, tasks, timestamp);
    } else {
      return this.generateCSV(appData, tasks, timestamp);
    }
  }
  
  generateCSV(appData, tasks, timestamp) {
    // Реализация CSV (резервный вариант)
    let csv = 'ФИО,Класс';
    const taskCount = Math.max(tasks.length, 10);
    
    for (let i = 1; i <= taskCount; i++) {
      const maxScore = tasks[i-1]?.maxScore || (i % 4 === 0 ? 20 : i % 3 === 0 ? 15 : i % 2 === 0 ? 10 : 5);
      csv += `,Задание ${i} (макс: ${maxScore})`;
    }
    csv += ',Примечание\n';
    
    // ... (остальной код как раньше)
    
    return {
      filename: `простой_шаблон_${timestamp}.csv`,
      content: csv,
      type: 'text/csv;charset=utf-8;'
    };
  }
  
  generateXLSX(appData, tasks, timestamp) {
    // Создаем данные для простого шаблона
    
    // Заголовки
    const headers = ['ФИО', 'Класс', 'Группа'];
    
    // Добавляем задания
    const taskCount = Math.max(tasks.length, 15);
    for (let i = 1; i <= taskCount; i++) {
      const maxScore = tasks[i-1]?.maxScore || (i % 4 === 0 ? 20 : i % 3 === 0 ? 15 : i % 2 === 0 ? 10 : 5);
      headers.push(`Зад. ${i} (макс: ${maxScore})`);
    }
    
    headers.push('Примечание');
    
    const data = [headers];
    
    // Примеры данных
    const exampleStudents = [
      { name: 'Иванов Иван Иванович', class: '5А', group: 'Группа 1', note: 'Пример заполнения' },
      { name: 'Петрова Анна Сергеевна', class: '5А', group: 'Группа 2', note: 'Пример заполнения' },
      { name: 'Сидоров Петр Алексеевич', class: '5Б', group: 'Группа 1', note: 'Пример заполнения' },
      { name: 'Козлова Мария Сергеевна', class: '5А', group: 'Группа 2', note: 'Пример заполнения' },
      { name: 'Николаев Алексей Петрович', class: '5Б', group: 'Группа 1', note: 'Пример заполнения' }
    ];
    
    exampleStudents.forEach((student, studentIndex) => {
      const row = [student.name, student.class, student.group];
      
      for (let i = 1; i <= taskCount; i++) {
        const maxScore = tasks[i-1]?.maxScore || (i % 4 === 0 ? 20 : i % 3 === 0 ? 15 : i % 2 === 0 ? 10 : 5);
        let score;
        
        if (studentIndex === 0) score = maxScore * 0.5; // 50%
        else if (studentIndex === 1) score = maxScore * 0.8; // 80%
        else if (studentIndex === 2) score = maxScore * 1.0; // 100%
        else if (studentIndex === 3) score = maxScore * 0.6; // 60%
        else score = maxScore * 0.9; // 90%
        
        row.push(score);
      }
      
      row.push(student.note);
      data.push(row);
    });
    
    // Добавляем пустые строки для заполнения
    for (let i = 5; i <= 50; i++) {
      const row = ['', '', '', ...new Array(taskCount).fill(''), ''];
      data.push(row);
    }
    
    // Настраиваем ширину столбцов
    const colWidths = [30, 12, 15];
    for (let i = 0; i < taskCount; i++) {
      colWidths.push(15);
    }
    colWidths.push(30);
    
    const sheet = {
      name: 'Данные',
      data: data,
      colWidths: colWidths
    };
    
    const wb = this.createWorkbook([sheet]);
    
    return {
      filename: `простой_шаблон_${timestamp}.xlsx`,
      workbook: wb,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }
}

// CSV шаблон (остается без изменений)
class CSVTemplateExporter extends BaseExporter {
  async generate(appData) {
    const tasks = appData?.tasks || [];
    const timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g, '-');
    
    let csv = 'student_id,student_name,class,group';
    
    tasks.forEach((task, index) => {
      const taskNumber = task.number || index + 1;
      csv += `,task_${taskNumber}_max_${task.maxScore || 1}`;
    });
    
    if (tasks.length === 0) {
      for (let i = 1; i <= 5; i++) {
        csv += `,task_${i}_max_${i % 4 === 0 ? 20 : i % 3 === 0 ? 15 : i % 2 === 0 ? 10 : 5}`;
      }
    }
    
    csv += '\n';
    
    // Примеры данных
    csv += '1,"Иванов И.И.","5А","группа1"';
    const taskCount = Math.max(tasks.length, 5);
    for (let i = 0; i < taskCount; i++) {
      const maxScore = tasks[i]?.maxScore || (i % 4 === 0 ? 20 : i % 3 === 0 ? 15 : i % 2 === 0 ? 10 : 5);
      csv += ',' + this.formatScore(maxScore * 0.5);
    }
    csv += '\n';
    
    csv += '2,"Петрова А.С.","5А","группа2"';
    for (let i = 0; i < taskCount; i++) {
      const maxScore = tasks[i]?.maxScore || (i % 4 === 0 ? 20 : i % 3 === 0 ? 15 : i % 2 === 0 ? 10 : 5);
      csv += ',' + this.formatScore(maxScore * 1.0);
    }
    csv += '\n';
    
    return {
      filename: `шаблон_csv_${timestamp}.csv`,
      content: csv,
      type: 'text/csv;charset=utf-8;'
    };
  }
}

// Google Forms экспортер (остается без изменений)
class GoogleFormsExporter extends BaseExporter {
  async generate(appData) {
    const tasks = appData?.tasks || [];
    const timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g, '-');
    
    let csv = 'Timestamp,Email Address,Full Name,Class,Group';
    
    tasks.forEach((task, index) => {
      const taskNumber = task.number || index + 1;
      const maxScore = task.maxScore || 1;
      csv += `,Task ${taskNumber} (0-${maxScore})`;
    });
    
    if (tasks.length === 0) {
      for (let i = 1; i <= 5; i++) {
        csv += `,Task ${i} (0-${i % 4 === 0 ? 20 : i % 3 === 0 ? 15 : i % 2 === 0 ? 10 : 5})`;
      }
    }
    
    csv += '\n';
    
    const currentDate = new Date().toISOString();
    const taskCount = Math.max(tasks.length, 5);
    
    const examples = [
      {
        email: 'student1@school.ru',
        name: 'Иванов Иван Иванович',
        class: '5А',
        group: 'Группа 1'
      },
      {
        email: 'student2@school.ru',
        name: 'Петрова Анна Сергеевна',
        class: '5А',
        group: 'Группа 2'
      }
    ];
    
    examples.forEach((example, index) => {
      csv += `${currentDate},${example.email},"${example.name}","${example.class}","${example.group}"`;
      
      for (let i = 0; i < taskCount; i++) {
        const maxScore = tasks[i]?.maxScore || (i % 4 === 0 ? 20 : i % 3 === 0 ? 15 : i % 2 === 0 ? 10 : 5);
        const score = index === 0 ? maxScore * 0.5 : maxScore * 1.0;
        csv += ',' + this.formatScore(score);
      }
      
      csv += '\n';
    });
    
    return {
      filename: `google_forms_шаблон_${timestamp}.csv`,
      content: csv,
      type: 'text/csv;charset=utf-8;'
    };
  }
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ И ЭКСПОРТ МОДУЛЯ
// ============================================

function initDataImportExport(config = {}) {
  try {
    return new DataImportExport(config);
  } catch (error) {
    console.error('❌ Ошибка инициализации DataImportExport:', error);
    return null;
  }
}

// Проверяем наличие библиотеки XLSX и загружаем при необходимости
function loadXLSXLibrary() {
  if (typeof window === 'undefined') return;
  
  if (!window.XLSX) {
    console.log('📚 Загрузка библиотеки XLSX...');
    
    // Создаем скрипт для загрузки SheetJS
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js';
    script.integrity = 'sha256-JmY8dwmVSXXeH7GtL1cXycM/NvWpUtFKGkz8x0mDlFE=';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      console.log('✅ Библиотека XLSX загружена');
      if (window.dataImportExportModule) {
        // Переинициализируем экспортеры с поддержкой XLSX
        window.dataImportExportModule.exporters = {
          full: new FullTemplateExporter({ useXLSX: true }),
          simple: new SimpleTemplateExporter({ useXLSX: true }),
          csv: new CSVTemplateExporter(),
          googleForms: new GoogleFormsExporter()
        };
      }
    };
    script.onerror = () => {
      console.warn('⚠️ Не удалось загрузить библиотеку XLSX. Будут использоваться CSV файлы.');
    };
    
    document.head.appendChild(script);
  }
}

if (typeof window !== 'undefined') {
  // Экспортируем классы в глобальную область видимости
  window.DataImportExport = DataImportExport;
  window.initDataImportExport = initDataImportExport;
  
  // Загружаем библиотеку XLSX
  loadXLSXLibrary();
  
  // Автоинициализация при наличии данных
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (window.appData || localStorage.getItem('appData')) {
        console.log('🚀 Автоинициализация DataImportExport...');
        window.dataImportExportModule = initDataImportExport({
          debug: true,
          autoInitUI: false,
          useXLSX: true
        });
        
        if (window.dataImportExportModule) {
          console.log('✅ DataImportExport готов к использованию');
          
          // Добавляем кнопку в интерфейс
          if (!document.getElementById('show-import-export-btn')) {
            const btn = document.createElement('button');
            btn.id = 'show-import-export-btn';
            btn.innerHTML = '📊 Импорт/Экспорт';
            btn.style.cssText = `
              position: fixed;
              bottom: 20px;
              right: 20px;
              padding: 14px 22px;
              background: linear-gradient(135deg, #3498db, #2980b9);
              color: white;
              border: none;
              border-radius: 30px;
              cursor: pointer;
              font-weight: bold;
              box-shadow: 0 6px 20px rgba(52, 152, 219, 0.3);
              z-index: 9999;
              font-size: 14px;
              display: flex;
              align-items: center;
              gap: 8px;
              transition: transform 0.2s, box-shadow 0.2s;
            `;
            btn.onmouseenter = () => {
              btn.style.transform = 'translateY(-2px)';
              btn.style.boxShadow = '0 8px 25px rgba(52, 152, 219, 0.4)';
            };
            btn.onmouseleave = () => {
              btn.style.transform = 'translateY(0)';
              btn.style.boxShadow = '0 6px 20px rgba(52, 152, 219, 0.3)';
            };
            btn.onclick = () => {
              if (window.dataImportExportModule) {
                window.dataImportExportModule.showUI();
              }
            };
            document.body.appendChild(btn);
          }
        }
      }
    }, 2000);
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DataImportExport,
    initDataImportExport,
    FullTemplateExporter,
    SimpleTemplateExporter,
    CSVTemplateExporter,
    GoogleFormsExporter
  };
}
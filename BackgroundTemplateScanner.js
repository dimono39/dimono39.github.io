// ============ BackgroundTemplateScanner.js ============
class BackgroundTemplateScanner {
    constructor() {
        this.storage = new TemplateStorage();
        this.directoryHandle = null;
        this.isWatching = false;
        this.watchInterval = 60000; // 1 минута
        this.watchTimer = null;
        this.cachedTemplates = new Map(); // Быстрый кэш в памяти
        this.statusCallbacks = [];
        this.scanProgressCallbacks = [];
        
        // Конфигурация
        this.config = {
            autoScan: true,
            notifyOnChanges: true,
            deepScan: true, // Рекурсивное сканирование подпапок
            scanInterval: 60000,
            maxFileSize: 10 * 1024 * 1024 // 10MB
        };
        
        // Состояние
        this.state = {
            lastScanTime: null,
            lastChangeTime: null,
            totalScanned: 0,
            scanning: false
        };
    }

    // Инициализация
    async initialize() {
        try {
            await this.storage.init();
            console.log('✅ BackgroundTemplateScanner инициализирован');
            
            // Загружаем кэшированные шаблоны в память
            await this.loadCachedTemplates();
            
            // Восстанавливаем предыдущий доступ к папке если есть
            await this.restorePreviousAccess();
            
            // Создаем UI элементы
            this.createUI();
            
            return true;
        } catch (error) {
            console.error('❌ Ошибка инициализации сканера:', error);
            return false;
        }
    }

    // Создание элементов интерфейса
    createUI() {
        // Создаем контейнер если его нет
        let container = document.getElementById('templateScannerUI');
        if (!container) {
            container = document.createElement('div');
            container.id = 'templateScannerUI';
            container.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                background: white;
                border: 1px solid #ddd;
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                padding: 15px;
                min-width: 300px;
                max-width: 400px;
                font-family: Arial, sans-serif;
                transition: all 0.3s;
            `;
            document.body.appendChild(container);
        }
        
        // Обновляем содержимое контейнера
        this.updateUI();
    }

    // Обновление интерфейса
    updateUI() {
        const container = document.getElementById('templateScannerUI');
        if (!container) return;
        
        const hasAccess = !!this.directoryHandle;
        const templatesCount = this.cachedTemplates.size;
        const lastScan = this.state.lastScanTime 
            ? new Date(this.state.lastScanTime).toLocaleTimeString()
            : 'никогда';
        
        container.innerHTML = `
            <div style="margin-bottom: 10px;">
                <h4 style="margin: 0 0 10px 0; color: #2c3e50;">
                    📁 Сканер шаблонов
                    <span style="float: right; font-size: 0.8em; color: #7f8c8d;">
                        ${templatesCount} шт
                    </span>
                </h4>
                
                <div style="margin-bottom: 10px; font-size: 0.9em;">
                    <div style="margin: 5px 0;">
                        <strong>Статус:</strong> 
                        <span id="scannerStatus">
                            ${hasAccess ? '✅ Активен' : '⏸️ Остановлен'}
                        </span>
                    </div>
                    <div style="margin: 5px 0;">
                        <strong>Последнее сканирование:</strong> ${lastScan}
                    </div>
                    ${this.state.scanning ? `
                        <div style="margin: 5px 0; color: #3498db;">
                            ⏳ Сканирование...
                        </div>
                    ` : ''}
                </div>
                
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 15px;">
                    <button id="selectFolderBtn" class="btn btn-sm ${hasAccess ? 'btn-outline-primary' : 'btn-primary'}"
                            style="flex: 1; min-width: 120px;">
                        ${hasAccess ? '🔄 Сменить папку' : '📁 Выбрать папку'}
                    </button>
                    
                    ${hasAccess ? `
                        <button id="scanNowBtn" class="btn btn-sm btn-info" 
                                style="flex: 1; min-width: 120px;" ${this.state.scanning ? 'disabled' : ''}>
                            ${this.state.scanning ? '⏳ Сканирую...' : '🔍 Сканировать'}
                        </button>
                        <button id="toggleWatchBtn" class="btn btn-sm ${this.isWatching ? 'btn-warning' : 'btn-success'}"
                                style="flex: 1; min-width: 120px;">
                            ${this.isWatching ? '⏸️ Пауза' : '▶️ Наблюдать'}
                        </button>
                    ` : ''}
                    
                    <button id="showTemplatesBtn" class="btn btn-sm btn-secondary"
                            style="flex: 1; min-width: 120px;" ${templatesCount === 0 ? 'disabled' : ''}>
                        📋 Шаблоны (${templatesCount})
                    </button>
                </div>
                
                <div style="margin-top: 15px; font-size: 0.8em; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 10px;">
                    <label style="display: block; margin: 5px 0;">
                        <input type="checkbox" id="autoScanCheckbox" ${this.config.autoScan ? 'checked' : ''}>
                        Автосканирование
                    </label>
                    <label style="display: block; margin: 5px 0;">
                        <input type="checkbox" id="notifyChangesCheckbox" ${this.config.notifyOnChanges ? 'checked' : ''}>
                        Уведомлять об изменениях
                    </label>
                </div>
            </div>
        `;
        
        // Назначаем обработчики событий
        this.bindUIEvents();
    }

    // Привязка событий UI
    bindUIEvents() {
        document.getElementById('selectFolderBtn')?.addEventListener('click', () => this.selectFolder());
        document.getElementById('scanNowBtn')?.addEventListener('click', () => this.scanNow());
        document.getElementById('toggleWatchBtn')?.addEventListener('click', () => this.toggleWatching());
        document.getElementById('showTemplatesBtn')?.addEventListener('click', () => this.showTemplates());
        
        const autoScanCheckbox = document.getElementById('autoScanCheckbox');
        const notifyCheckbox = document.getElementById('notifyChangesCheckbox');
        
        if (autoScanCheckbox) {
            autoScanCheckbox.addEventListener('change', (e) => {
                this.config.autoScan = e.target.checked;
                this.saveConfig();
            });
        }
        
        if (notifyCheckbox) {
            notifyCheckbox.addEventListener('change', (e) => {
                this.config.notifyOnChanges = e.target.checked;
                this.saveConfig();
            });
        }
    }

    // Сохранение конфигурации
    saveConfig() {
        localStorage.setItem('templateScannerConfig', JSON.stringify(this.config));
    }

    // Загрузка конфигурации
    loadConfig() {
        const saved = localStorage.getItem('templateScannerConfig');
        if (saved) {
            this.config = { ...this.config, ...JSON.parse(saved) };
        }
    }

    // Восстановление предыдущего доступа к папке
    async restorePreviousAccess() {
        try {
            // Проверяем сохраненный handle (только для современных браузеров)
            if ('getAll' in window && 'indexedDB' in window) {
                const handles = await navigator.storage.getDirectory();
                // Этот API ограничен, лучше запрашивать доступ заново
            }
            
            // Восстанавливаем только настройки
            this.loadConfig();
            
        } catch (error) {
            console.warn('Не удалось восстановить доступ к папке:', error);
        }
    }

    // Выбор папки пользователем
    async selectFolder() {
        try {
            // Используем File System Access API если доступен
            if ('showDirectoryPicker' in window) {
                this.directoryHandle = await window.showDirectoryPicker({
                    id: 'templateFolder',
                    mode: 'read'
                });
                
                // Пытаемся сохранить разрешение
                if (this.directoryHandle && 'persist' in this.directoryHandle) {
                    const persisted = await this.directoryHandle.persist();
                    console.log('Разрешение сохранено:', persisted);
                }
                
                // Сохраняем имя папки
                localStorage.setItem('templateFolderName', this.directoryHandle.name);
                
            } else {
                // Fallback для старых браузеров
                alert('Ваш браузер не поддерживает автоматическое сканирование папок.\nИспользуйте ручной выбор файлов.');
                return;
            }
            
            // Сразу выполняем сканирование
            await this.scanNow();
            
            // Запускаем наблюдение если включено автосканирование
            if (this.config.autoScan) {
                this.startWatching();
            }
            
            this.updateStatus('✅ Папка выбрана и просканирована');
            this.updateUI();
            
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Ошибка выбора папки:', error);
                this.updateStatus('❌ Ошибка выбора папки', 'error');
            }
        }
    }

    // Ручное сканирование
    async scanNow() {
        if (this.state.scanning) {
            console.log('Сканирование уже выполняется');
            return;
        }
        
        if (!this.directoryHandle) {
            this.updateStatus('⚠️ Сначала выберите папку', 'warning');
            return;
        }
        
        this.state.scanning = true;
        this.updateUI();
        
        try {
            this.updateStatus('⏳ Сканирование папки...', 'info');
            
            // Вызываем колбэки прогресса
            this.notifyProgress({ status: 'start', total: 0 });
            
            // Выполняем сканирование
            const changes = await this.performScan();
            
            // Обновляем состояние
            this.state.lastScanTime = Date.now();
            this.state.totalScanned = this.cachedTemplates.size;
            
            // Показываем результат
            let message = `✅ Сканирование завершено`;
            if (changes.added.length > 0 || changes.updated.length > 0 || changes.removed.length > 0) {
                message += `. Обнаружены изменения: `;
                const changesList = [];
                if (changes.added.length) changesList.push(`+${changes.added.length}`);
                if (changes.updated.length) changesList.push(`↻${changes.updated.length}`);
                if (changes.removed.length) changesList.push(`-${changes.removed.length}`);
                message += changesList.join(', ');
                
                // Уведомление об изменениях
                if (this.config.notifyOnChanges && (changes.added.length > 0 || changes.removed.length > 0)) {
                    this.showChangeNotification(changes);
                }
            } else {
                message += `. Изменений не обнаружено`;
            }
            
            this.updateStatus(message, 'success');
            
            // Вызываем колбэки завершения
            this.notifyProgress({ 
                status: 'complete', 
                changes: changes,
                total: this.cachedTemplates.size
            });
            
        } catch (error) {
            console.error('❌ Ошибка сканирования:', error);
            this.updateStatus(`❌ Ошибка сканирования: ${error.message}`, 'error');
        } finally {
            this.state.scanning = false;
            this.updateUI();
        }
    }

    // Основная функция сканирования
    async performScan() {
        const changes = {
            added: [],
            updated: [],
            removed: [],
            errors: []
        };
        
        // Создаем карту текущих файлов
        const currentFiles = new Map();
        
        // Рекурсивное сканирование
        const scanDir = async (dirHandle, path = '') => {
            for await (const [name, handle] of dirHandle.entries()) {
                const fullPath = path ? `${path}/${name}` : name;
                
                if (handle.kind === 'file') {
                    if (name.endsWith('.json')) {
                        try {
                            const file = await handle.getFile();
                            
                            // Проверяем размер файла
                            if (file.size > this.config.maxFileSize) {
                                changes.errors.push({
                                    path: fullPath,
                                    error: 'Файл слишком большой',
                                    size: file.size
                                });
                                continue;
                            }
                            
                            // Читаем и парсим файл
                            const content = await this.readAndParseTemplate(file, fullPath);
                            if (content) {
                                currentFiles.set(fullPath, {
                                    handle,
                                    file,
                                    content,
                                    lastModified: file.lastModified
                                });
                            }
                            
                        } catch (error) {
                            changes.errors.push({
                                path: fullPath,
                                error: error.message
                            });
                        }
                    }
                } else if (handle.kind === 'directory' && this.config.deepScan) {
                    // Рекурсивный обход подпапок
                    await scanDir(handle, fullPath);
                }
            }
        };
        
        // Выполняем сканирование
        await scanDir(this.directoryHandle);
        
        // Сравниваем с кэшированными шаблонами
        for (const [fullPath, fileData] of currentFiles.entries()) {
            const cached = this.cachedTemplates.get(fullPath);
            
            if (!cached) {
                // Новый файл
                await this.saveTemplateToCache(fullPath, fileData);
                changes.added.push({
                    path: fullPath,
                    name: fileData.file.name,
                    ...fileData.content.metadata
                });
            } else if (fileData.lastModified > cached.lastModified) {
                // Обновленный файл
                await this.saveTemplateToCache(fullPath, fileData);
                changes.updated.push({
                    path: fullPath,
                    name: fileData.file.name,
                    ...fileData.content.metadata
                });
            }
        }
        
        // Проверяем удаленные файлы
        for (const [fullPath, cached] of this.cachedTemplates.entries()) {
            if (!currentFiles.has(fullPath)) {
                // Файл удален
                await this.storage.deleteTemplate(fullPath);
                this.cachedTemplates.delete(fullPath);
                changes.removed.push({
                    path: fullPath,
                    name: cached.name,
                    ...cached.metadata
                });
            }
        }
        
        return changes;
    }

    // Чтение и парсинг шаблона
    async readAndParseTemplate(file, fullPath) {
        try {
            const text = await file.text();
            const cleaned = cleanJSON(text);
            const data = JSON.parse(cleaned);
            
            // Валидация структуры шаблона
            if (!data.test || !data.tasks) {
                throw new Error('Неверный формат шаблона');
            }
            
            // Извлекаем метаданные
            const metadata = {
                name: file.name,
                fullPath: fullPath,
                subject: data.test.subject || 'Не указан',
                class: data.test.class || 'Не указан',
                workType: data.test.workType || 'current',
                theme: data.test.theme || 'Без названия',
                taskCount: data.tasks.length,
                lastModified: file.lastModified
            };
            
            return {
                metadata,
                data: data
            };
            
        } catch (error) {
            console.error(`Ошибка парсинга файла ${file.name}:`, error);
            return null;
        }
    }

    // Сохранение шаблона в кэш
    async saveTemplateToCache(fullPath, fileData) {
        const template = {
            fullPath: fullPath,
            name: fileData.file.name,
            subject: fileData.content.metadata.subject,
            class: fileData.content.metadata.class,
            workType: fileData.content.metadata.workType,
            theme: fileData.content.metadata.theme,
            data: fileData.content.data,
            lastModified: fileData.lastModified,
            taskCount: fileData.content.metadata.taskCount,
            addedDate: Date.now()
        };
        
        // Сохраняем в IndexedDB
        await this.storage.saveTemplate(template);
        
        // Обновляем кэш в памяти
        this.cachedTemplates.set(fullPath, template);
    }

    // Загрузка кэшированных шаблонов из БД
    async loadCachedTemplates() {
        try {
            const templates = await this.storage.getAllTemplates();
            
            // Загружаем в память
            this.cachedTemplates.clear();
            templates.forEach(template => {
                this.cachedTemplates.set(template.fullPath, template);
            });
            
            console.log(`📁 Загружено ${templates.length} шаблонов из кэша`);
            
            // Обновляем глобальную переменную для совместимости
            window.templateFilesData = templates.map(t => ({
                file: { name: t.name },
                data: t.data,
                workType: t.workType,
                subject: t.subject,
                class: t.class,
                taskCount: t.taskCount,
                date: t.data.test?.testDate || 'Не указано'
            }));
            
            return templates.length;
            
        } catch (error) {
            console.error('Ошибка загрузки кэшированных шаблонов:', error);
            return 0;
        }
    }

    // Запуск фонового наблюдения
    startWatching() {
        if (this.isWatching) return;
        
        this.isWatching = true;
        this.updateStatus('👁️ Наблюдение за папкой активно', 'info');
        
        // Периодическое сканирование
        this.watchTimer = setInterval(async () => {
            if (!this.state.scanning) {
                await this.scanNow();
            }
        }, this.config.scanInterval);
        
        // Слушаем события видимости страницы
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        this.updateUI();
    }

    // Остановка наблюдения
    stopWatching() {
        if (!this.isWatching) return;
        
        this.isWatching = false;
        
        if (this.watchTimer) {
            clearInterval(this.watchTimer);
            this.watchTimer = null;
        }
        
        document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        this.updateStatus('⏸️ Наблюдение приостановлено', 'warning');
        this.updateUI();
    }

    // Переключение режима наблюдения
    toggleWatching() {
        if (this.isWatching) {
            this.stopWatching();
        } else {
            this.startWatching();
        }
    }

    // Обработчик изменения видимости страницы
    handleVisibilityChange() {
        if (!document.hidden && this.isWatching && !this.state.scanning) {
            // При возвращении на страницу проверяем изменения
            setTimeout(() => this.scanNow(), 1000);
        }
    }

    // Показать уведомление об изменениях
    showChangeNotification(changes) {
        const totalChanges = changes.added.length + changes.removed.length;
        if (totalChanges === 0) return;
        
        // Используем существующую функцию showNotification
        if (typeof showNotification === 'function') {
            let message = 'Обновлены шаблоны: ';
            const parts = [];
            
            if (changes.added.length) parts.push(`добавлено ${changes.added.length}`);
            if (changes.removed.length) parts.push(`удалено ${changes.removed.length}`);
            
            showNotification(message + parts.join(', '), 'info');
        } else {
            // Fallback уведомление
            console.log('📢 Изменения в шаблонах:', changes);
        }
    }

    // Показать список шаблонов
    async showTemplates() {
        if (this.cachedTemplates.size === 0) {
            this.updateStatus('📭 Шаблоны не найдены', 'warning');
            return;
        }
        
        // Преобразуем кэш в массив для отображения
        const templates = Array.from(this.cachedTemplates.values()).map(t => ({
            file: { name: t.name },
            data: t.data,
            workType: t.workType,
            subject: t.subject,
            class: t.class,
            taskCount: t.taskCount,
            date: t.data.test?.testDate || 'Не указано'
        }));
        
        // Используем существующую функцию для отображения
        window.templateFilesData = templates;
        showTemplateSelection(); // Покажем модальное окно с шаблонами
    }

    // Обновление статуса в UI
    updateStatus(message, type = 'info') {
        const statusEl = document.getElementById('scannerStatus');
        if (statusEl) {
            statusEl.textContent = message;
            
            // Цвет в зависимости от типа
            const colors = {
                info: '#3498db',
                success: '#2ecc71',
                warning: '#f39c12',
                error: '#e74c3c'
            };
            
            statusEl.style.color = colors[type] || '#2c3e50';
            
            // Автоочистка через 5 секунд если это информационное сообщение
            if (type === 'info') {
                setTimeout(() => {
                    if (statusEl.textContent === message) {
                        const hasAccess = !!this.directoryHandle;
                        statusEl.textContent = hasAccess ? '✅ Активен' : '⏸️ Остановлен';
                        statusEl.style.color = '#2c3e50';
                    }
                }, 5000);
            }
        }
        
        // Вызываем колбэки статуса
        this.statusCallbacks.forEach(callback => callback(message, type));
    }

    // Уведомление о прогрессе
    notifyProgress(data) {
        this.scanProgressCallbacks.forEach(callback => callback(data));
    }

    // Добавление колбэков
    onStatusChange(callback) {
        this.statusCallbacks.push(callback);
    }
    
    onScanProgress(callback) {
        this.scanProgressCallbacks.push(callback);
    }

    // Получение статистики
    async getStatistics() {
        return {
            cached: this.cachedTemplates.size,
            lastScan: this.state.lastScanTime,
            directory: this.directoryHandle?.name || 'Не выбрана',
            isWatching: this.isWatching,
            scanning: this.state.scanning
        };
    }

    // Экспорт кэша
    async exportCache() {
        const templates = await this.storage.getAllTemplates();
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            count: templates.length,
            templates: templates.map(t => ({
                name: t.name,
                subject: t.subject,
                class: t.class,
                workType: t.workType,
                theme: t.theme,
                taskCount: t.taskCount,
                lastModified: t.lastModified
                // Не экспортируем сами данные для экономии места
            }))
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    // Очистка кэша
    async clearCache() {
        if (confirm('Вы уверены, что хотите очистить кэш шаблонов?')) {
            await this.storage.clearAll();
            this.cachedTemplates.clear();
            this.updateStatus('🗑️ Кэш очищен', 'warning');
            this.updateUI();
        }
    }
}
// modules/projects-autosave.js
class AutoSaveManager {
    constructor(projectManager) {
        this.projectManager = projectManager;
        this.autoSaveInterval = 30000; // 30 секунд
        this.autoSaveTimer = null;
        this.isEnabled = true;
        this.lastSaveTime = null;
        this.unsavedChanges = false;
    }
    
    // ИНИЦИАЛИЗАЦИЯ
    
    init() {
        // Загружаем настройки
        this.loadSettings();
        
        // Запускаем автосохранение
        this.startAutoSave();
        
        // Настраиваем отслеживание изменений
        this.setupChangeTracking();
        
        // Предупреждение при закрытии страницы
        this.setupBeforeUnload();
        
        console.log('✅ AutoSaveManager initialized');
    }
    
    // АВТОСОХРАНЕНИЕ
    
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        if (this.isEnabled) {
            this.autoSaveTimer = setInterval(() => {
                this.autoSave();
            }, this.autoSaveInterval);
            
            console.log(`🔁 AutoSave started (${this.autoSaveInterval/1000}s interval)`);
        }
    }
    
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
            console.log('⏹️ AutoSave stopped');
        }
    }
    
    async autoSave() {
        if (!this.projectManager.currentProjectId) {
            return;
        }
        
        if (!this.unsavedChanges) {
            return;
        }
        
        try {
            // Сохраняем текущий проект
            await this.projectManager.saveCurrentProject();
            
            this.lastSaveTime = new Date();
            this.unsavedChanges = false;
            
            // Показываем индикатор сохранения
            this.showSaveIndicator();
            
            console.log('💾 AutoSave completed');
            
        } catch (error) {
            console.error('AutoSave failed:', error);
            this.showSaveError(error);
        }
    }
    
    // ОТСЛЕЖИВАНИЕ ИЗМЕНЕНИЙ
    
    setupChangeTracking() {
        // Отслеживаем изменения в формах
        const trackableElements = [
            'input', 'textarea', 'select',
            '.form-input', '.form-textarea', '.form-select',
            '.score-input', '.worktype-card', '.criteria-range input'
        ];
        
        trackableElements.forEach(selector => {
            document.addEventListener('input', (e) => {
                if (e.target.matches(selector)) {
                    this.markAsChanged();
                }
            });
            
            document.addEventListener('change', (e) => {
                if (e.target.matches(selector)) {
                    this.markAsChanged();
                }
            });
        });
        
        // Отслеживаем клики по кнопкам сохранения
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn-success, .btn-primary') || 
                e.target.closest('.btn-success, .btn-primary')) {
                if (e.target.textContent.includes('Сохранить') || 
                    e.target.textContent.includes('💾')) {
                    this.triggerImmediateSave();
                }
            }
        });
    }
    
    markAsChanged() {
        this.unsavedChanges = true;
        
        // Показываем индикатор несохраненных изменений
        this.showUnsavedChangesIndicator();
        
        // Запускаем отложенное сохранение (дебаунс)
        this.scheduleDelayedSave();
    }
    
    scheduleDelayedSave() {
        // Очищаем предыдущий таймер
        if (this.delayedSaveTimer) {
            clearTimeout(this.delayedSaveTimer);
        }
        
        // Запускаем сохранение через 2 секунды после последнего изменения
        this.delayedSaveTimer = setTimeout(() => {
            if (this.unsavedChanges) {
                this.autoSave();
            }
        }, 2000);
    }
    
    async triggerImmediateSave() {
        if (!this.projectManager.currentProjectId) {
            return;
        }
        
        try {
            await this.projectManager.saveCurrentProject();
            
            this.lastSaveTime = new Date();
            this.unsavedChanges = false;
            
            this.showSaveIndicator(true);
            console.log('💾 Manual save completed');
            
        } catch (error) {
            console.error('Manual save failed:', error);
            this.showSaveError(error);
        }
    }
    
    // ИНДИКАТОРЫ
    
    showSaveIndicator(manual = false) {
        let indicator = document.getElementById('saveIndicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'saveIndicator';
            indicator.className = 'save-indicator';
            document.body.appendChild(indicator);
            
            // Добавляем стили
            this.addIndicatorStyles();
        }
        
        const timeStr = this.lastSaveTime?.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }) || '--:--:--';
        
        indicator.innerHTML = `
            <div class="indicator-content">
                <i class="fas fa-check-circle"></i>
                <span>${manual ? 'Сохранено' : 'Автосохранено'} ${timeStr}</span>
            </div>
        `;
        
        indicator.classList.add('visible');
        
        // Скрываем через 2 секунды
        setTimeout(() => {
            indicator.classList.remove('visible');
        }, 2000);
    }
    
    showUnsavedChangesIndicator() {
        const title = document.querySelector('title');
        if (title && !title.textContent.includes('*')) {
            title.textContent = title.textContent + ' *';
        }
        
        // Можно добавить более заметный индикатор
        const existingIndicator = document.getElementById('unsavedIndicator');
        if (!existingIndicator) {
            const indicator = document.createElement('div');
            indicator.id = 'unsavedIndicator';
            indicator.className = 'unsaved-indicator';
            indicator.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                <span>Есть несохраненные изменения</span>
                <button onclick="autoSaveManager.triggerImmediateSave()">
                    Сохранить
                </button>
            `;
            
            const container = document.querySelector('.container');
            if (container) {
                container.appendChild(indicator);
            }
        }
    }
    
    hideUnsavedChangesIndicator() {
        const title = document.querySelector('title');
        if (title) {
            title.textContent = title.textContent.replace(' *', '');
        }
        
        const indicator = document.getElementById('unsavedIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    showSaveError(error) {
        const errorIndicator = document.createElement('div');
        errorIndicator.className = 'save-error-indicator';
        errorIndicator.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Ошибка сохранения: ${error.message}</span>
                <button onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(errorIndicator);
        
        // Автоматически скрываем через 5 секунд
        setTimeout(() => {
            if (errorIndicator.parentElement) {
                errorIndicator.remove();
            }
        }, 5000);
    }
    
    addIndicatorStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .save-indicator {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #2ecc71;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 10000;
                transform: translateY(100px);
                opacity: 0;
                transition: all 0.3s ease;
            }
            
            .save-indicator.visible {
                transform: translateY(0);
                opacity: 1;
            }
            
            .indicator-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .unsaved-indicator {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f39c12;
                color: white;
                padding: 10px 15px;
                border-radius: 6px;
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 10px;
                animation: pulse 2s infinite;
            }
            
            .unsaved-indicator button {
                background: white;
                color: #f39c12;
                border: none;
                padding: 4px 10px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                margin-left: 10px;
            }
            
            .save-error-indicator {
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: #e74c3c;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 10000;
            }
            
            .error-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .error-content button {
                background: transparent;
                border: none;
                color: white;
                cursor: pointer;
                margin-left: 10px;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // ПРЕДУПРЕЖДЕНИЕ ПРИ ЗАКРЫТИИ
    
    setupBeforeUnload() {
        window.addEventListener('beforeunload', (e) => {
            if (this.unsavedChanges && this.isEnabled) {
                e.preventDefault();
                e.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите уйти?';
                return e.returnValue;
            }
        });
    }
    
    // НАСТРОЙКИ
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('autoSaveSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.isEnabled = settings.enabled !== false;
                this.autoSaveInterval = settings.interval || 30000;
            }
        } catch (error) {
            console.error('Failed to load auto-save settings:', error);
        }
    }
    
    saveSettings() {
        const settings = {
            enabled: this.isEnabled,
            interval: this.autoSaveInterval,
            lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem('autoSaveSettings', JSON.stringify(settings));
    }
    
    // УПРАВЛЕНИЕ
    
    enable() {
        this.isEnabled = true;
        this.startAutoSave();
        this.saveSettings();
        this.showNotification('Автосохранение включено', 'success');
    }
    
    disable() {
        this.isEnabled = false;
        this.stopAutoSave();
        this.saveSettings();
        this.showNotification('Автосохранение выключено', 'warning');
    }
    
    setInterval(intervalMs) {
        this.autoSaveInterval = intervalMs;
        this.saveSettings();
        
        if (this.isEnabled) {
            this.startAutoSave();
        }
        
        this.showNotification(`Интервал автосохранения: ${intervalMs/1000} сек`, 'info');
    }
    
    // СТАТИСТИКА
    
    getStats() {
        return {
            enabled: this.isEnabled,
            interval: this.autoSaveInterval,
            lastSaveTime: this.lastSaveTime,
            unsavedChanges: this.unsavedChanges,
            totalProjects: this.projectManager.projects.length,
            currentProject: this.projectManager.currentProjectId
        };
    }
    
    // УТИЛИТЫ
    
    showNotification(message, type = 'info') {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Создаем глобальный экземпляр
window.autoSaveManager = new AutoSaveManager(window.projectManager);

// Экспортируем
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AutoSaveManager };
}
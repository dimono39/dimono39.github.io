// features/AutoSaveManager.js
export class AutoSaveManager {
    constructor(projectManager) {
        this.projectManager = projectManager;
        this.interval = 30000; // 30 секунд
        this.timer = null;
        this.enabled = true;
        this.lastSave = null;
        this.hasUnsavedChanges = false;
        this.debounceTimer = null;
    }
    
    init() {
        console.log('🔄 Инициализация AutoSaveManager...');
        
        this.loadSettings();
        this.setupChangeTracking();
        this.setupBeforeUnload();
        this.start();
        
        console.log('✅ AutoSaveManager инициализирован');
    }
    
    start() {
        if (this.timer) clearInterval(this.timer);
        
        if (this.enabled) {
            this.timer = setInterval(() => this.autoSave(), this.interval);
            console.log(`⏱️ Автосохранение запущено (каждые ${this.interval/1000} сек)`);
        }
    }
    
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            console.log('⏹️ Автосохранение остановлено');
        }
    }
    
    async autoSave() {
        if (!this.projectManager.currentProjectId || !this.hasUnsavedChanges) {
            return;
        }
        
        try {
            await this.projectManager.saveCurrentProject();
            
            this.lastSave = new Date();
            this.hasUnsavedChanges = false;
            
            this.showSaveIndicator();
            console.log('💾 Автосохранение выполнено');
            
        } catch (error) {
            console.error('❌ Ошибка автосохранения:', error);
        }
    }
    
    markAsChanged() {
        this.hasUnsavedChanges = true;
        this.showUnsavedIndicator();
        this.scheduleDebouncedSave();
    }
    
    scheduleDebouncedSave() {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        
        this.debounceTimer = setTimeout(() => {
            if (this.hasUnsavedChanges) {
                this.autoSave();
            }
        }, 2000); // Сохраняем через 2 секунды после последнего изменения
    }
    
    async saveNow() {
        if (!this.projectManager.currentProjectId) return;
        
        try {
            await this.projectManager.saveCurrentProject();
            
            this.lastSave = new Date();
            this.hasUnsavedChanges = false;
            
            this.showSaveIndicator(true);
            console.log('💾 Ручное сохранение выполнено');
            
        } catch (error) {
            console.error('❌ Ошибка сохранения:', error);
            throw error;
        }
    }
    
    setupChangeTracking() {
        // Отслеживаем изменения в основных полях
        const trackableSelectors = [
            'input[type="text"]',
            'input[type="number"]',
            'textarea',
            'select',
            '.score-input',
            '.form-input',
            '.form-select',
            '.criteria-range input'
        ];
        
        const handler = () => this.markAsChanged();
        
        trackableSelectors.forEach(selector => {
            document.addEventListener('input', (e) => {
                if (e.target.matches(selector)) {
                    handler();
                }
            });
            
            document.addEventListener('change', (e) => {
                if (e.target.matches(selector)) {
                    handler();
                }
            });
        });
        
        // Отслеживаем клики по кнопкам сохранения
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn-save, .btn-primary') && 
                (e.target.textContent.includes('Сохранить') || 
                 e.target.textContent.includes('💾'))) {
                this.saveNow();
            }
        });
    }
    
    setupBeforeUnload() {
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges && this.enabled) {
                e.preventDefault();
                e.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите уйти?';
                return e.returnValue;
            }
        });
    }
    
    showSaveIndicator(manual = false) {
        let indicator = document.getElementById('saveIndicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'saveIndicator';
            indicator.style.cssText = `
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
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 14px;
            `;
            document.body.appendChild(indicator);
        }
        
        const timeStr = this.lastSave ? 
            this.lastSave.toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
            }) : '--:--:--';
        
        indicator.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${manual ? 'Сохранено' : 'Автосохранено'} ${timeStr}</span>
        `;
        
        indicator.style.transform = 'translateY(0)';
        indicator.style.opacity = '1';
        
        setTimeout(() => {
            indicator.style.transform = 'translateY(100px)';
            indicator.style.opacity = '0';
        }, 2000);
    }
    
    showUnsavedIndicator() {
        // Добавляем звездочку к заголовку
        const title = document.querySelector('title');
        if (title && !title.textContent.includes('*')) {
            title.textContent = title.textContent + ' *';
        }
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('autoSaveSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.enabled = settings.enabled !== false;
                this.interval = settings.interval || 30000;
            }
        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
        }
    }
    
    saveSettings() {
        const settings = {
            enabled: this.enabled,
            interval: this.interval,
            lastSave: new Date().toISOString()
        };
        
        localStorage.setItem('autoSaveSettings', JSON.stringify(settings));
    }
    
    enable() {
        this.enabled = true;
        this.saveSettings();
        this.start();
        this.showNotification('Автосохранение включено', 'success');
    }
    
    disable() {
        this.enabled = false;
        this.saveSettings();
        this.stop();
        this.showNotification('Автосохранение выключено', 'warning');
    }
    
    setInterval(ms) {
        this.interval = ms;
        this.saveSettings();
        
        if (this.enabled) {
            this.start();
        }
        
        this.showNotification(`Интервал автосохранения: ${ms/1000} сек`, 'info');
    }
    
    getStatus() {
        return {
            enabled: this.enabled,
            interval: this.interval,
            lastSave: this.lastSave,
            hasUnsavedChanges: this.hasUnsavedChanges,
            currentProject: this.projectManager.currentProjectId
        };
    }
    
    showNotification(message, type = 'info') {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`${type}: ${message}`);
        }
    }
}
// ============ TemplateStorage.js ============
class TemplateStorage {
    constructor() {
        this.dbName = 'TestMakerTemplatesDB';
        this.storeName = 'templates';
        this.version = 1;
        this.db = null;
    }

    // Инициализация базы данных
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                
                // Создаем хранилище если его нет
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'fullPath' });
                    
                    // Создаем индексы для быстрого поиска
                    store.createIndex('subject', 'subject', { unique: false });
                    store.createIndex('workType', 'workType', { unique: false });
                    store.createIndex('lastModified', 'lastModified', { unique: false });
                    store.createIndex('class', 'class', { unique: false });
                }
            };
            
            request.onsuccess = (e) => {
                this.db = e.target.result;
                console.log('✅ TemplateStorage инициализирован');
                resolve();
            };
            
            request.onerror = (e) => {
                console.error('❌ Ошибка инициализации TemplateStorage:', e.target.error);
                reject(e.target.error);
            };
        });
    }

    // Сохранение/обновление шаблона
    async saveTemplate(templateData) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('База данных не инициализирована'));
                return;
            }
            
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const template = {
                fullPath: templateData.fullPath,
                name: templateData.name,
                subject: templateData.subject,
                class: templateData.class,
                workType: templateData.workType,
                theme: templateData.theme,
                data: templateData.data,
                lastModified: templateData.lastModified || Date.now(),
                taskCount: templateData.taskCount,
                addedDate: templateData.addedDate || Date.now()
            };
            
            const request = store.put(template);
            
            request.onsuccess = () => {
                console.log(`💾 Шаблон сохранен: ${templateData.name}`);
                resolve();
            };
            
            request.onerror = (e) => {
                console.error('❌ Ошибка сохранения шаблона:', e.target.error);
                reject(e.target.error);
            };
        });
    }

    // Получение всех шаблонов
    async getAllTemplates() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('База данных не инициализирована'));
                return;
            }
            
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = (e) => {
                resolve(e.target.result || []);
            };
            
            request.onerror = (e) => {
                reject(e.target.error);
            };
        });
    }

    // Поиск шаблонов по предмету
    async getTemplatesBySubject(subject) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('База данных не инициализирована'));
                return;
            }
            
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('subject');
            const request = index.getAll(subject);
            
            request.onsuccess = (e) => resolve(e.target.result || []);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    // Поиск шаблонов по типу работы
    async getTemplatesByWorkType(workType) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('База данных не инициализирована'));
                return;
            }
            
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('workType');
            const request = index.getAll(workType);
            
            request.onsuccess = (e) => resolve(e.target.result || []);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    // Удаление шаблона
    async deleteTemplate(fullPath) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('База данных не инициализирована'));
                return;
            }
            
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(fullPath);
            
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    }

    // Очистка всех шаблонов
    async clearAll() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('База данных не инициализирована'));
                return;
            }
            
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    }

    // Получение статистики
    async getStats() {
        const templates = await this.getAllTemplates();
        
        return {
            total: templates.length,
            bySubject: templates.reduce((acc, t) => {
                acc[t.subject] = (acc[t.subject] || 0) + 1;
                return acc;
            }, {}),
            byClass: templates.reduce((acc, t) => {
                acc[t.class] = (acc[t.class] || 0) + 1;
                return acc;
            }, {}),
            byWorkType: templates.reduce((acc, t) => {
                acc[t.workType] = (acc[t.workType] || 0) + 1;
                return acc;
            }, {}),
            lastUpdate: templates.length > 0 
                ? new Date(Math.max(...templates.map(t => t.lastModified)))
                : null
        };
    }
}
// core/ProjectStorage.js
export class ProjectStorage {
    static STORAGE_KEY = 'education_analytics_projects_v2';
    static RECENT_KEY = 'education_analytics_recent_v2';
    static DB_NAME = 'EducationAnalyticsDB_v2';
    static DB_VERSION = 2;
    static STORE_NAME = 'projects_v2';
    
    static async saveProjects(projects, recentProjects = []) {
        console.log('💾 Сохранение проектов...');
        
        const data = {
            projects: projects.map(p => p.toJSON ? p.toJSON() : p),
            recentProjects,
            metadata: {
                savedAt: new Date().toISOString(),
                version: '2.0',
                totalProjects: projects.length
            }
        };
        
        try {
            // Сохраняем в localStorage (основное хранилище)
            this.saveToLocalStorage(data);
            
            // Пробуем сохранить в IndexedDB как резерв
            if (this.supportsIndexedDB) {
                try {
                    await this.saveToIndexedDB(data);
                } catch (idbError) {
                    console.warn('IndexedDB сохранение не удалось:', idbError);
                }
            }
            
            console.log(`✅ Сохранено ${projects.length} проектов`);
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка сохранения:', error);
            throw error;
        }
    }
    
    static async loadProjects() {
        console.log('📂 Загрузка проектов...');
        
        try {
            let data = null;
            
            // 1. Пробуем загрузить из localStorage
            data = this.loadFromLocalStorage();
            
            // 2. Если нет данных, пробуем IndexedDB
            if (!data || !data.projects || data.projects.length === 0) {
                if (this.supportsIndexedDB) {
                    data = await this.loadFromIndexedDB();
                }
            }
            
            // 3. Миграция данных если нужно
            if (data && data.projects) {
                data.projects = this.migrateData(data.projects);
            }
            
            return data || { projects: [], recentProjects: [] };
            
        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            return { projects: [], recentProjects: [] };
        }
    }
    
    static saveToLocalStorage(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.projects || []));
            localStorage.setItem(this.RECENT_KEY, JSON.stringify(data.recentProjects || []));
            
            // Сохраняем метаданные
            const metadata = {
                lastSave: new Date().toISOString(),
                totalProjects: data.projects?.length || 0,
                version: '2.0'
            };
            localStorage.setItem(`${this.STORAGE_KEY}_meta`, JSON.stringify(metadata));
            
        } catch (error) {
            console.error('LocalStorage ошибка:', error);
            
            // Если переполнено, чистим старые данные
            if (error.name === 'QuotaExceededError') {
                this.cleanupStorage();
                throw new Error('LocalStorage переполнен. Удалены старые данные.');
            }
            throw error;
        }
    }
    
    static loadFromLocalStorage() {
        try {
            const projectsJson = localStorage.getItem(this.STORAGE_KEY);
            const recentJson = localStorage.getItem(this.RECENT_KEY);
            
            return {
                projects: projectsJson ? JSON.parse(projectsJson) : [],
                recentProjects: recentJson ? JSON.parse(recentJson) : []
            };
            
        } catch (error) {
            console.error('LocalStorage загрузка:', error);
            return { projects: [], recentProjects: [] };
        }
    }
    
    static async saveToIndexedDB(data) {
        return new Promise((resolve, reject) => {
            if (!this.supportsIndexedDB) {
                resolve(false);
                return;
            }
            
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = () => {
                const db = request.result;
                
                try {
                    const transaction = db.transaction([this.STORE_NAME], 'readwrite');
                    const store = transaction.objectStore(this.STORE_NAME);
                    
                    // Сохраняем как единый объект
                    store.put(data, 'projects_data');
                    
                    transaction.oncomplete = () => {
                        db.close();
                        resolve(true);
                    };
                    
                    transaction.onerror = () => {
                        db.close();
                        resolve(false);
                    };
                    
                } catch (error) {
                    db.close();
                    resolve(false);
                }
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME);
                }
            };
        });
    }
    
    static async loadFromIndexedDB() {
        return new Promise((resolve) => {
            if (!this.supportsIndexedDB) {
                resolve(null);
                return;
            }
            
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = () => resolve(null);
            
            request.onsuccess = () => {
                const db = request.result;
                
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.close();
                    resolve(null);
                    return;
                }
                
                const transaction = db.transaction([this.STORE_NAME], 'readonly');
                const store = transaction.objectStore(this.STORE_NAME);
                const getRequest = store.get('projects_data');
                
                getRequest.onsuccess = () => {
                    db.close();
                    resolve(getRequest.result || null);
                };
                
                getRequest.onerror = () => {
                    db.close();
                    resolve(null);
                };
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME);
                }
            };
        });
    }
    
    static migrateData(projects) {
        return projects.map(project => {
            // Миграция с версии 1.0 на 2.0
            if (!project.version || project.version === '1.0') {
                console.log(`🔄 Миграция проекта: ${project.name}`);
                
                // Исправляем формат результатов
                if (project.results && Array.isArray(project.results)) {
                    const resultsObj = {};
                    project.results.forEach((result, index) => {
                        if (result && result.studentId) {
                            const { studentId, ...rest } = result;
                            resultsObj[studentId] = rest;
                        } else if (result && typeof result === 'object') {
                            resultsObj[index] = result;
                        }
                    });
                    project.results = resultsObj;
                }
                
                // Гарантируем наличие полей
                project.version = '2.0';
                if (!project.errors) project.errors = {};
                if (!project.stats) project.stats = {};
                if (!project.schoolData) project.schoolData = {};
            }
            
            return project;
        });
    }
    
    static cleanupStorage() {
        // Оставляем только последние 20 проектов
        const projectsJson = localStorage.getItem(this.STORAGE_KEY);
        if (projectsJson) {
            const projects = JSON.parse(projectsJson);
            const recentProjects = projects
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .slice(0, 20);
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentProjects));
        }
        
        // Удаляем старые ключи
        const keysToKeep = [this.STORAGE_KEY, this.RECENT_KEY, `${this.STORAGE_KEY}_meta`];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('education_analytics') && !keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        }
    }
    
    static async exportProjects(projects) {
        const data = {
            projects: projects.map(p => p.toJSON ? p.toJSON() : p),
            exportInfo: {
                exportedAt: new Date().toISOString(),
                version: '2.0',
                system: 'Education Analytics System'
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `education_projects_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return data;
    }
    
    static async importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (!data.projects || !Array.isArray(data.projects)) {
                        throw new Error('Неверный формат файла');
                    }
                    
                    resolve({
                        success: true,
                        projects: data.projects,
                        count: data.projects.length
                    });
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }
    
    static get supportsIndexedDB() {
        return 'indexedDB' in window;
    }
    
    static getStorageStats() {
        try {
            let localStorageSize = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                localStorageSize += (key.length + value.length) * 2;
            }
            
            return {
                localStorage: {
                    totalKeys: localStorage.length,
                    sizeKB: Math.round(localStorageSize / 1024),
                    quotaMB: 5,
                    usedPercent: Math.round((localStorageSize / (5 * 1024 * 1024)) * 100)
                },
                supportsIndexedDB: this.supportsIndexedDB
            };
            
        } catch (error) {
            console.error('Ошибка статистики:', error);
            return null;
        }
    }
}
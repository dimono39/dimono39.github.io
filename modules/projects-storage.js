// modules/projects-storage.js
class ProjectStorage {
    static STORAGE_KEY = 'education_analytics_projects';
    static RECENT_KEY = 'education_analytics_recent';
    static SETTINGS_KEY = 'education_analytics_settings';
    
    // IndexedDB для больших проектов
    static DB_NAME = 'EducationAnalyticsDB';
    static DB_VERSION = 2;
    static STORE_NAME = 'projects';
    
    // Проверяем поддержку IndexedDB
    static get supportsIndexedDB() {
        return 'indexedDB' in window;
    }
    
    // ОСНОВНЫЕ МЕТОДЫ
    
    static async saveProjects(data) {
        try {
            // Сохраняем в IndexedDB если поддерживается
            if (this.supportsIndexedDB) {
                await this.saveToIndexedDB(data);
            }
            
            // Всегда сохраняем в localStorage для быстрого доступа
            this.saveToLocalStorage(data);
            
            console.log('💾 Projects saved to storage');
            return true;
            
        } catch (error) {
            console.error('Failed to save projects:', error);
            
            // Fallback: сохраняем только в localStorage
            try {
                this.saveToLocalStorage(data);
                return true;
            } catch (fallbackError) {
                console.error('Fallback save failed:', fallbackError);
                throw error;
            }
        }
    }
    
    static async loadProjects() {
        try {
            let data = null;
            
            // Пробуем загрузить из IndexedDB
            if (this.supportsIndexedDB) {
                data = await this.loadFromIndexedDB();
            }
            
            // Если в IndexedDB нет данных, пробуем localStorage
            if (!data || !data.projects || data.projects.length === 0) {
                data = this.loadFromLocalStorage();
            }
            
            // Миграция старых данных
            if (data) {
                data = this.migrateData(data);
            }
            
            return data || { projects: [], recentProjects: [] };
            
        } catch (error) {
            console.error('Failed to load projects:', error);
            
            // Fallback: загружаем из localStorage
            try {
                const fallbackData = this.loadFromLocalStorage();
                return fallbackData || { projects: [], recentProjects: [] };
            } catch (fallbackError) {
                console.error('Fallback load failed:', fallbackError);
                return { projects: [], recentProjects: [] };
            }
        }
    }
    
    // LOCALSTORAGE
    
    static saveToLocalStorage(data) {
        try {
            // Сохраняем проекты
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.projects || []));
            
            // Сохраняем недавние проекты
            localStorage.setItem(this.RECENT_KEY, JSON.stringify(data.recentProjects || []));
            
            // Сохраняем метаданные
            const metadata = {
                lastSave: new Date().toISOString(),
                totalProjects: data.projects?.length || 0,
                version: '2.0'
            };
            localStorage.setItem(`${this.STORAGE_KEY}_meta`, JSON.stringify(metadata));
            
        } catch (error) {
            console.error('LocalStorage save error:', error);
            
            // Если localStorage переполнен, чистим старые данные
            if (error.name === 'QuotaExceededError') {
                this.cleanupLocalStorage();
                // Пробуем снова с уменьшенным объемом
                this.saveToLocalStorage({
                    projects: data.projects.slice(0, 10),
                    recentProjects: data.recentProjects.slice(0, 5)
                });
            } else {
                throw error;
            }
        }
    }
    
    static loadFromLocalStorage() {
        try {
            const projectsJson = localStorage.getItem(this.STORAGE_KEY);
            const recentJson = localStorage.getItem(this.RECENT_KEY);
            
            const projects = projectsJson ? JSON.parse(projectsJson) : [];
            const recentProjects = recentJson ? JSON.parse(recentJson) : [];
            
            return {
                projects: projects,
                recentProjects: recentProjects
            };
            
        } catch (error) {
            console.error('LocalStorage load error:', error);
            return { projects: [], recentProjects: [] };
        }
    }
    
    // INDEXEDDB
    
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
                const transaction = db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                
                // Сохраняем проекты
                const projectsRequest = store.put(data.projects, 'projects');
                
                // Сохраняем недавние проекты
                const recentRequest = store.put(data.recentProjects, 'recent');
                
                transaction.oncomplete = () => {
                    db.close();
                    resolve(true);
                };
                
                transaction.onerror = () => reject(transaction.error);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Создаем хранилище если не существует
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    const store = db.createObjectStore(this.STORE_NAME);
                    console.log('🆕 Created IndexedDB store:', this.STORE_NAME);
                }
            };
        });
    }
    
    static async loadFromIndexedDB() {
        return new Promise((resolve, reject) => {
            if (!this.supportsIndexedDB) {
                resolve(null);
                return;
            }
            
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction([this.STORE_NAME], 'readonly');
                const store = transaction.objectStore(this.STORE_NAME);
                
                // Загружаем проекты
                const projectsRequest = store.get('projects');
                const recentRequest = store.get('recent');
                
                let projects = [];
                let recentProjects = [];
                
                projectsRequest.onsuccess = () => {
                    projects = projectsRequest.result || [];
                };
                
                recentRequest.onsuccess = () => {
                    recentProjects = recentRequest.result || [];
                };
                
                transaction.oncomplete = () => {
                    db.close();
                    resolve({
                        projects: projects,
                        recentProjects: recentProjects
                    });
                };
                
                transaction.onerror = () => reject(transaction.error);
            };
        });
    }
    
    // МИГРАЦИЯ ДАННЫХ
    
    static migrateData(data) {
        // Версия 1.0 → 2.0
        if (data.projects && Array.isArray(data.projects)) {
            data.projects = data.projects.map(project => {
                // Добавляем отсутствующие поля
                if (!project.id) {
                    project.id = 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                }
                
                if (!project.createdAt) {
                    project.createdAt = new Date().toISOString();
                }
                
                if (!project.updatedAt) {
                    project.updatedAt = project.createdAt;
                }
                
                if (!project.status) {
                    project.status = 'draft';
                }
                
                if (!project.icon) {
                    project.icon = '📊';
                }
                
                if (!project.color) {
                    const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12'];
                    project.color = colors[Math.floor(Math.random() * colors.length)];
                }
                
                return project;
            });
        }
        
        return data;
    }
    
    // ОЧИСТКА
    
    static cleanupLocalStorage() {
        console.log('🧹 Cleaning up localStorage...');
        
        // Сохраняем только последние 20 проектов
        const projectsJson = localStorage.getItem(this.STORAGE_KEY);
        if (projectsJson) {
            const projects = JSON.parse(projectsJson);
            const recentProjects = projects
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .slice(0, 20);
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentProjects));
        }
        
        // Очищаем старые метаданные
        const keysToKeep = [
            this.STORAGE_KEY,
            this.RECENT_KEY,
            `${this.STORAGE_KEY}_meta`
        ];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('education_analytics') && !keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        }
    }
    
    // ЭКСПОРТ/ИМПОРТ
    
    static async exportAllProjects() {
        const data = await this.loadProjects();
        
        const exportData = {
            ...data,
            exportInfo: {
                exportedAt: new Date().toISOString(),
                version: '2.0',
                system: 'Education Analytics System',
                totalProjects: data.projects.length
            }
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `education_analytics_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return exportData;
    }
    
    static async importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    // Валидируем данные
                    if (!data.projects || !Array.isArray(data.projects)) {
                        throw new Error('Invalid backup file format');
                    }
                    
                    // Сохраняем импортированные данные
                    await this.saveProjects(data);
                    
                    resolve({
                        success: true,
                        projectsImported: data.projects.length,
                        recentProjects: data.recentProjects?.length || 0
                    });
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }
    
    // СТАТИСТИКА
    
    static getStorageStats() {
        try {
            // LocalStorage статистика
            let localStorageSize = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                localStorageSize += (key.length + value.length) * 2; // UTF-16
            }
            
            const stats = {
                localStorage: {
                    totalKeys: localStorage.length,
                    approximateSize: Math.round(localStorageSize / 1024) + ' KB',
                    quota: 5 * 1024 * 1024, // 5MB
                    usedPercent: Math.round((localStorageSize / (5 * 1024 * 1024)) * 100)
                },
                supportsIndexedDB: this.supportsIndexedDB,
                lastBackup: localStorage.getItem(`${this.STORAGE_KEY}_lastBackup`) || 'Never'
            };
            
            return stats;
            
        } catch (error) {
            console.error('Failed to get storage stats:', error);
            return null;
        }
    }
    
    // РЕЗЕРВНОЕ КОПИРОВАНИЕ
    
    static async createBackup() {
        try {
            const data = await this.loadProjects();
            
            // Создаем backup в localStorage
            const backupKey = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;
            localStorage.setItem(backupKey, JSON.stringify(data));
            
            // Сохраняем время последнего backup
            localStorage.setItem(`${this.STORAGE_KEY}_lastBackup`, new Date().toISOString());
            
            // Удаляем старые backups (оставляем последние 5)
            this.cleanupOldBackups();
            
            return {
                success: true,
                backupKey: backupKey,
                timestamp: new Date().toISOString(),
                projectsCount: data.projects.length
            };
            
        } catch (error) {
            console.error('Backup creation failed:', error);
            throw error;
        }
    }
    
    static cleanupOldBackups() {
        const backupKeys = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('backup_')) {
                backupKeys.push(key);
            }
        }
        
        // Сортируем по дате (новые первые)
        backupKeys.sort((a, b) => b.localeCompare(a));
        
        // Удаляем все кроме последних 5
        backupKeys.slice(5).forEach(key => {
            localStorage.removeItem(key);
        });
    }
    
    static async restoreFromBackup(backupKey) {
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                throw new Error('Backup not found');
            }
            
            const data = JSON.parse(backupData);
            await this.saveProjects(data);
            
            return {
                success: true,
                projectsRestored: data.projects?.length || 0,
                backupKey: backupKey
            };
            
        } catch (error) {
            console.error('Backup restore failed:', error);
            throw error;
        }
    }
}

// Экспортируем
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProjectStorage };
}
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
    
	// УПРОЩЕННЫЙ МЕТОД СОХРАНЕНИЯ проектов
	static async saveProjects(data) {
		console.log('💾 Saving projects...');
		
		try {
			// Сохраняем в localStorage (основное хранилище)
			this.saveToLocalStorage(data);
			
			// Пробуем сохранить в IndexedDB, но не критично если не получится
			if (this.supportsIndexedDB) {
				try {
					await this.saveToIndexedDB(data);
					console.log('✅ Saved to both localStorage and IndexedDB');
				} catch (indexedDBError) {
					console.warn('⚠️ Failed to save to IndexedDB, using localStorage only:', indexedDBError);
					console.log('✅ Saved to localStorage only');
				}
			} else {
				console.log('✅ Saved to localStorage (IndexedDB not supported)');
			}
			
			return true;
			
		} catch (error) {
			console.error('❌ Failed to save projects:', error);
			
			// Fallback: пробуем сохранить хотя бы в localStorage
			try {
				this.saveToLocalStorage(data);
				console.log('✅ Saved to localStorage as fallback');
				return true;
			} catch (fallbackError) {
				console.error('❌ Fallback save failed:', fallbackError);
				throw error;
			}
		}
	}
	// УПРОЩЕННЫЙ МЕТОД СОХРАНЕНИЯ проектов
	static async saveProjects(data) {
		console.log('💾 Saving projects...');
		
		try {
			// Сохраняем в localStorage (основное хранилище)
			this.saveToLocalStorage(data);
			
			// Пробуем сохранить в IndexedDB, но не критично если не получится
			if (this.supportsIndexedDB) {
				try {
					await this.saveToIndexedDB(data);
					console.log('✅ Saved to both localStorage and IndexedDB');
				} catch (indexedDBError) {
					console.warn('⚠️ Failed to save to IndexedDB, using localStorage only:', indexedDBError);
					console.log('✅ Saved to localStorage only');
				}
			} else {
				console.log('✅ Saved to localStorage (IndexedDB not supported)');
			}
			
			return true;
			
		} catch (error) {
			console.error('❌ Failed to save projects:', error);
			
			// Fallback: пробуем сохранить хотя бы в localStorage
			try {
				this.saveToLocalStorage(data);
				console.log('✅ Saved to localStorage as fallback');
				return true;
			} catch (fallbackError) {
				console.error('❌ Fallback save failed:', fallbackError);
				throw error;
			}
		}
	}
		
	static async loadProjects() {
		console.log('📂 Loading projects...');
		
		try {
			let data = null;
			
			// Пробуем загрузить из localStorage (основной источник)
			data = this.loadFromLocalStorage();
			
			// Если в localStorage нет данных, пробуем IndexedDB
			if ((!data.projects || data.projects.length === 0) && this.supportsIndexedDB) {
				try {
					const indexedDBData = await this.loadFromIndexedDB();
					if (indexedDBData && indexedDBData.projects && indexedDBData.projects.length > 0) {
						console.log('📦 Loaded from IndexedDB (localStorage was empty)');
						data = indexedDBData;
					}
				} catch (indexedDBError) {
					console.warn('⚠️ Failed to load from IndexedDB:', indexedDBError);
				}
			}
			
			// Миграция старых данных
			if (data) {
				data = this.migrateData(data);
			}
			
			console.log(`📊 Loaded ${data?.projects?.length || 0} projects`);
			return data || { projects: [], recentProjects: [] };
			
		} catch (error) {
			console.error('❌ Failed to load projects:', error);
			return { projects: [], recentProjects: [] };
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
				console.log('IndexedDB not supported, skipping...');
				resolve(false);
				return;
			}
			
			const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
			
			request.onerror = (event) => {
				console.error('IndexedDB open error:', event.target.error);
				resolve(false); // Не отклоняем, просто возвращаем false
			};
			
			request.onsuccess = (event) => {
				const db = event.target.result;
				
				try {
					// Проверяем существование store
					if (!db.objectStoreNames.contains(this.STORE_NAME)) {
						console.log('Creating object store...');
						
						// Закрываем и открываем снова для обновления версии
						db.close();
						this.createObjectStore()
							.then(() => this.saveToIndexedDB(data))
							.then(resolve)
							.catch(reject);
						return;
					}
					
					const transaction = db.transaction([this.STORE_NAME], 'readwrite');
					const store = transaction.objectStore(this.STORE_NAME);
					
					// Сохраняем данные
					const projectsRequest = store.put(data.projects, 'projects');
					const recentRequest = store.put(data.recentProjects, 'recent');
					
					transaction.oncomplete = () => {
						db.close();
						console.log('💾 Saved to IndexedDB');
						resolve(true);
					};
					
					transaction.onerror = (event) => {
						console.error('Transaction error:', event.target.error);
						db.close();
						resolve(false);
					};
					
				} catch (error) {
					console.error('Error in IndexedDB operation:', error);
					db.close();
					resolve(false);
				}
			};
			
			request.onupgradeneeded = (event) => {
				const db = event.target.result;
				this.createObjectStoreInDB(db);
			};
		});
	}
  
	// Вспомогательный метод для создания store
	static createObjectStoreInDB(db) {
		if (!db.objectStoreNames.contains(this.STORE_NAME)) {
			console.log('🆕 Creating IndexedDB store:', this.STORE_NAME);
			db.createObjectStore(this.STORE_NAME);
		}
	}

	// Создание store при необходимости
	static async createObjectStore() {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.DB_NAME, this.DB_VERSION + 1);
			
			request.onerror = (event) => {
				console.error('Failed to create object store:', event.target.error);
				reject(event.target.error);
			};
			
			request.onsuccess = (event) => {
				const db = event.target.result;
				db.close();
				console.log('✅ Object store created');
				resolve();
			};
			
			request.onupgradeneeded = (event) => {
				const db = event.target.result;
				this.createObjectStoreInDB(db);
			};
		});
	}
  
	static async loadFromIndexedDB() {
		return new Promise((resolve, reject) => {
			if (!this.supportsIndexedDB) {
				console.log('IndexedDB not supported');
				resolve(null);
				return;
			}
			
			const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
			
			request.onerror = (event) => {
				console.error('IndexedDB open error (load):', event.target.error);
				resolve(null); // Не отклоняем, возвращаем null
			};
			
			request.onsuccess = (event) => {
				const db = event.target.result;
				
				// Проверяем существование store
				if (!db.objectStoreNames.contains(this.STORE_NAME)) {
					console.log('Store not found in IndexedDB');
					db.close();
					resolve(null);
					return;
				}
				
				try {
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
					
					projectsRequest.onerror = () => {
						console.error('Failed to load projects:', projectsRequest.error);
					};
					
					recentRequest.onsuccess = () => {
						recentProjects = recentRequest.result || [];
					};
					
					recentRequest.onerror = () => {
						console.error('Failed to load recent:', recentRequest.error);
					};
					
					transaction.oncomplete = () => {
						db.close();
						console.log(`📂 Loaded from IndexedDB: ${projects.length} projects`);
						resolve({
							projects: projects,
							recentProjects: recentProjects
						});
					};
					
					transaction.onerror = (event) => {
						console.error('Transaction error (load):', event.target.error);
						db.close();
						resolve(null);
					};
					
				} catch (error) {
					console.error('Error loading from IndexedDB:', error);
					db.close();
					resolve(null);
				}
			};
			
			request.onupgradeneeded = (event) => {
				const db = event.target.result;
				this.createObjectStoreInDB(db);
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
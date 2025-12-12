// ============ ServerTemplateScanner.js ============
class ServerTemplateScanner {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl || window.location.origin;
        this.templates = new Map();
        this.isScanning = false;
        this.templateFolder = 'templates'; // Имя папки на сервере
    }

    async scanServerFolder() {
        this.isScanning = true;
        
        try {
            // 1. Попробуем получить список файлов через специальный endpoint
            const fileList = await this.getTemplateList();
            
            // 2. Или попробуем получить файл listings (если сервер поддерживает)
            if (!fileList || fileList.length === 0) {
                return await this.scanViaDirectoryListing();
            }
            
            // 3. Загружаем каждый файл
            const templates = [];
            
            for (const fileName of fileList) {
                if (fileName.endsWith('.json')) {
                    try {
                        const template = await this.loadTemplateFile(fileName);
                        if (template) {
                            templates.push(template);
                        }
                    } catch (error) {
                        console.error(`Ошибка загрузки ${fileName}:`, error);
                    }
                }
            }
            
            this.templates = new Map(templates.map(t => [t.name, t]));
            return templates;
            
        } catch (error) {
            console.error('Ошибка сканирования сервера:', error);
            throw error;
        } finally {
            this.isScanning = false;
        }
    }

    // Метод 1: Через специальный API endpoint (лучший способ)
    async getTemplateList() {
        try {
            // Если у вас есть endpoint для получения списка файлов
            const response = await fetch(`${this.baseUrl}/api/templates/list`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('API endpoint не доступен, пробуем другие методы');
        }
        
        // Пробуем получить список из файла manifest
        try {
            const response = await fetch(`${this.baseUrl}/${this.templateFolder}/manifest.json`);
            if (response.ok) {
                const manifest = await response.json();
                return manifest.files || [];
            }
        } catch (error) {
            // Продолжаем пробовать другие методы
        }
        
        return null;
    }

    // Метод 2: Через directory listing (если сервер его показывает)
    async scanViaDirectoryListing() {
        try {
            const response = await fetch(`${this.baseUrl}/${this.templateFolder}/`);
            
            if (response.ok) {
                const html = await response.text();
                return this.parseDirectoryListing(html);
            }
            
        } catch (error) {
            console.log('Directory listing не доступен');
        }
        
        return [];
    }

    // Метод 3: Пробуем известные имена файлов
    async scanKnownFiles() {
        const knownFiles = [
            'oge.json', 'ege.json', 'vpr.json', 'diagnostika.json',
            'math.json', 'russian.json', 'physics.json',
            'test1.json', 'test2.json', 'template.json'
        ];
        
        const templates = [];
        
        for (const fileName of knownFiles) {
            try {
                const template = await this.loadTemplateFile(fileName);
                if (template) {
                    templates.push(template);
                }
            } catch (error) {
                // Файл не найден - это нормально
            }
        }
        
        return templates;
    }

    // Загрузка конкретного файла
    async loadTemplateFile(fileName) {
        const response = await fetch(`${this.baseUrl}/${this.templateFolder}/${fileName}`);
        
        if (!response.ok) {
            throw new Error(`Файл ${fileName} не найден: ${response.status}`);
        }
        
        const text = await response.text();
        const cleaned = cleanJSON(text);
        const data = JSON.parse(cleaned);
        
        return {
            name: fileName,
            data: data,
            subject: data.test?.subject || 'Не указан',
            class: data.test?.class || 'Не указан',
            workType: data.test?.workType || 'current',
            theme: data.test?.theme || 'Без названия',
            taskCount: data.tasks?.length || 0,
            lastModified: Date.now()
        };
    }

    // Парсинг HTML directory listing
    parseDirectoryListing(html) {
        const files = [];
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Ищем все ссылки на файлы
        const links = doc.querySelectorAll('a[href]');
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href.endsWith('.json') && !href.includes('?')) {
                files.push(href);
            }
        });
        
        return files;
    }

    // Получение всех шаблонов
    getTemplates() {
        return Array.from(this.templates.values());
    }

    // Поиск шаблона по имени
    getTemplate(name) {
        return this.templates.get(name);
    }

    // Статистика
    getStats() {
        return {
            total: this.templates.size,
            folder: this.templateFolder,
            lastScan: this.lastScanTime,
            serverUrl: this.baseUrl
        };
    }
}

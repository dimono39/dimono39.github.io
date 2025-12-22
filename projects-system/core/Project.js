// core/Project.js
export class Project {
    constructor(data = {}) {
        // Идентификатор
        this.id = data.id || this.generateId();
        
        // Основная информация
        this.name = data.name || 'Новая работа';
        this.type = data.type || 'current';
        this.subject = data.subject || '';
        this.class = data.class || '';
        this.theme = data.theme || '';
        this.description = data.description || '';
        
        // Визуальные настройки
        this.icon = data.icon || '📊';
        this.color = data.color || this.getRandomColor();
        this.tags = data.tags || [];
        
        // Статус
        this.status = data.status || 'draft'; // draft, active, completed, archived
        
        // Даты
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || this.createdAt;
        this.lastOpened = data.lastOpened || null;
        
        // Данные работы
        this.settings = this.normalizeSettings(data.settings || {});
        this.tasks = data.tasks || [];
        this.students = data.students || [];
        this.results = this.normalizeResults(data.results || {});
        this.errors = data.errors || {};
        this.psychologyFeatures = data.psychologyFeatures || [];
        
        // Метаданные
        this.stats = data.stats || this.calculateInitialStats();
        this.version = data.version || '2.0';
        this.schoolData = data.schoolData || {};
    }
    
    generateId() {
        return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getRandomColor() {
        const colors = [
            '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
            '#1abc9c', '#34495e', '#e67e22', '#27ae60', '#2980b9'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    normalizeSettings(settings) {
        return {
            subject: settings.subject || '',
            class: settings.class || '',
            workType: settings.workType || '',
            criteria: settings.criteria || {
                5: { min: 85, max: 100 },
                4: { min: 70, max: 84 },
                3: { min: 50, max: 69 },
                2: { min: 0, max: 49 }
            },
            ...settings
        };
    }
    
    normalizeResults(results) {
        // Гарантируем, что results - это объект {studentId: {taskId: score}}
        if (Array.isArray(results)) {
            const normalized = {};
            results.forEach((studentResults, studentIndex) => {
                if (studentResults && typeof studentResults === 'object') {
                    normalized[studentIndex] = { ...studentResults };
                }
            });
            return normalized;
        }
        return typeof results === 'object' ? results : {};
    }
    
    calculateInitialStats() {
        return {
            totalStudents: this.students.length,
            totalTasks: this.tasks.length,
            avgGrade: 0,
            completionPercent: 0,
            gradesDistribution: { 5: 0, 4: 0, 3: 0, 2: 0 }
        };
    }
    
    updateStats() {
        const stats = this.calculateInitialStats();
        
        if (this.results && this.tasks.length > 0) {
            let totalScore = 0;
            let gradedCount = 0;
            
            Object.values(this.results).forEach(studentResults => {
                if (studentResults && typeof studentResults === 'object') {
                    let studentTotal = 0;
                    let maxPossible = 0;
                    
                    this.tasks.forEach((task, taskIndex) => {
                        const taskId = task.id || `task_${taskIndex}`;
                        const score = studentResults[taskId] || 0;
                        const maxScore = task.maxScore || 1;
                        
                        studentTotal += score;
                        maxPossible += maxScore;
                    });
                    
                    if (maxPossible > 0) {
                        const percent = (studentTotal / maxPossible) * 100;
                        totalScore += percent;
                        gradedCount++;
                        
                        // Определяем оценку
                        const grade = this.calculateGrade(percent);
                        if (grade) {
                            stats.gradesDistribution[grade] = (stats.gradesDistribution[grade] || 0) + 1;
                        }
                    }
                }
            });
            
            if (gradedCount > 0) {
                stats.avgGrade = totalScore / gradedCount;
                stats.completionPercent = (totalScore / (gradedCount * 100)) * 100;
            }
        }
        
        this.stats = stats;
        return stats;
    }
    
    calculateGrade(percent) {
        const criteria = this.settings.criteria || {};
        const entries = Object.entries(criteria).sort((a, b) => b[1].min - a[1].min);
        
        for (const [grade, range] of entries) {
            if (percent >= range.min && percent <= range.max) {
                return parseInt(grade);
            }
        }
        return null;
    }
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            subject: this.subject,
            class: this.class,
            theme: this.theme,
            description: this.description,
            icon: this.icon,
            color: this.color,
            tags: this.tags,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastOpened: this.lastOpened,
            settings: this.settings,
            tasks: this.tasks,
            students: this.students,
            results: this.results,
            errors: this.errors,
            psychologyFeatures: this.psychologyFeatures,
            stats: this.stats,
            version: this.version,
            schoolData: this.schoolData
        };
    }
    
    // Геттеры для удобства
    get displayName() {
        return `${this.icon} ${this.name}`;
    }
    
    get fullInfo() {
        return `${this.subject || 'Без предмета'} | ${this.class || 'Без класса'} | ${this.theme || 'Без темы'}`;
    }
    
    get isActive() {
        return this.status === 'active';
    }
    
    get isArchived() {
        return this.status === 'archived';
    }
    
    get lastModified() {
        return new Date(this.updatedAt).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
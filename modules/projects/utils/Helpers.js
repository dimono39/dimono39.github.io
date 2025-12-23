// utils/Helpers.js
export class Helpers {
    static getRandomColor() {
        const colors = [
            '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
            '#1abc9c', '#34495e', '#e67e22', '#27ae60', '#2980b9',
            '#8e44ad', '#d35400', '#c0392b', '#16a085', '#2c3e50'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    static getIconForType(type) {
        const icons = {
            current: '📝',
            milestone: '🎯',
            final: '🏆',
            oge: '📘',
            ege: '📗',
            vpr: '📙',
            func_literacy: '🧠',
            psychology: '💭',
            diagnostic: '🔍'
        };
        return icons[type] || '📊';
    }
    
    static truncateText(text, maxLength, suffix = '...') {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + suffix;
    }
    
    static formatDate(dateString, options = {}) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const defaultOptions = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        };
        
        return date.toLocaleDateString('ru-RU', { ...defaultOptions, ...options });
    }
    
    static formatDateTime(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    static getStatusText(status) {
        const statusMap = {
            draft: 'Черновик',
            active: 'Активная',
            completed: 'Завершена',
            archived: 'Архив'
        };
        return statusMap[status] || status;
    }
    
    static calculateGrade(percent, criteria) {
        if (!criteria) return null;
        
        const entries = Object.entries(criteria).sort((a, b) => b[1].min - a[1].min);
        
        for (const [grade, range] of entries) {
            if (percent >= range.min && percent <= range.max) {
                return parseInt(grade);
            }
        }
        
        return null;
    }
    
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    static generateId(prefix = '') {
        return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    static isValidJSON(str) {
        try {
            JSON.parse(str);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    static fileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    static async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    static showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}
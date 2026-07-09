// training.js - Продвинутая система тренажеров с элементами геймификации
// Version 2.1.0 - Исправлены ошибки, добавлены улучшения

// ============================
// КОНСТАНТЫ И НАСТРОЙКИ
// ============================

const TRAINING_CONFIG = {
    // Настройки прогресса
    XP_PER_CORRECT: 10,
    XP_PER_LEVEL: 100,
    STREAK_BONUS: 5,
    
    // Настройки сложности
    DIFFICULTY_LEVELS: {
        easy: { name: 'Легко', color: '#27ae60', multiplier: 1 },
        medium: { name: 'Средне', color: '#3498db', multiplier: 1.2 },
        hard: { name: 'Сложно', color: '#e74c3c', multiplier: 1.5 },
        expert: { name: 'Эксперт', color: '#9b59b6', multiplier: 2 }
    },
    
    // Типы тренировок
    TRAINING_TYPES: {
        ADAPTIVE: { id: 'adaptive', name: 'Адаптивная', icon: '🔄', color: '#3498db' },
        GAME: { id: 'game', name: 'Игровая', icon: '🎮', color: '#e74c3c' },
        VISUAL: { id: 'visual', name: 'Визуальная', icon: '🎨', color: '#9b59b6' },
        QUIZ: { id: 'quiz', name: 'Викторина', icon: '🧠', color: '#f39c12' },
        PRACTICE: { id: 'practice', name: 'Практика', icon: '📝', color: '#2ecc71' },
        PUZZLE: { id: 'puzzle', name: 'Головоломки', icon: '🧩', color: '#1abc9c' },
        RACE: { id: 'race', name: 'Гонка', icon: '⚡', color: '#e67e22' }
    },
    
    // Достижения - компактные квадратики
    ACHIEVEMENTS: [
        { id: 'first_step', name: 'Первый шаг', icon: '🏁', xp: 50, description: 'Выполните первую тренировку', color: '#3498db' },
        { id: 'perfect_10', name: 'Идеально', icon: '💎', xp: 100, description: '10 правильных ответов подряд', color: '#9b59b6' },
        { id: 'speed_demon', name: 'Скорость', icon: '⚡', xp: 80, description: 'Ответ за <3 секунды', color: '#f39c12' },
        { id: 'streak_5', name: 'Серия 5', icon: '🔥', xp: 75, description: '5 дней тренировок подряд', color: '#e74c3c' },
        { id: 'level_5', name: 'Уровень 5', icon: '⭐', xp: 150, description: 'Достигните 5 уровня', color: '#f1c40f' },
        { id: 'error_master', name: 'Мастер', icon: '🔧', xp: 90, description: 'Исправьте 50 ошибок', color: '#34495e' },
        { id: 'quiz_champ', name: 'Эрудит', icon: '🧠', xp: 120, description: 'Пройдите 10 викторин', color: '#16a085' },
        { id: 'visual_genius', name: 'Визуал', icon: '🎨', xp: 110, description: 'Решите 20 визуальных задач', color: '#8e44ad' },
        { id: 'game_guru', name: 'Геймер', icon: '🎮', xp: 130, description: 'Выиграйте 15 игр', color: '#d35400' },
        { id: 'puzzle_master', name: 'Головоломка', icon: '🧩', xp: 95, description: 'Решите 30 головоломок', color: '#27ae60' },
        { id: 'marathon', name: 'Марафон', icon: '🏃', xp: 200, description: '50 тренировок всего', color: '#c0392b' },
        { id: 'perfectionist', name: 'Перфекционист', icon: '👑', xp: 250, description: '100% точность в сложной тренировке', color: '#f1c40f' }
    ],
    
    // Визуальные темы
    THEMES: {
        DEFAULT: { id: 'default', name: 'Стандартная', bg: '#f8f9fa', text: '#2c3e50' },
        DARK: { id: 'dark', name: 'Темная', bg: '#1a1a2e', text: '#e6e6e6' },
        COLORFUL: { id: 'colorful', name: 'Цветная', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: 'white' },
        MINIMAL: { id: 'minimal', name: 'Минимализм', bg: '#ffffff', text: '#2c3e50' }
    }
};

// ============================
// КЛАССЫ И СТРУКТУРЫ ДАННЫХ
// ============================

class TrainingSession {
    constructor(type, difficulty = 'medium') {
        this.id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.type = type;
        this.difficulty = difficulty;
        this.startTime = new Date();
        this.questions = [];
        this.responses = [];
        this.score = 0;
        this.timeSpent = 0;
        this.completed = false;
        this.streak = 0;
        this.maxStreak = 0;
        this.questionStartTimes = new Map();
    }
    
    addQuestion(question) {
        this.questions.push({
            id: `q_${this.questions.length + 1}_${Date.now()}`,
            ...question,
            answered: false,
            correct: null,
            timeSpent: 0
        });
    }
    
    submitAnswer(questionId, answer, timeSpent) {
        const question = this.questions.find(q => q.id === questionId);
        if (!question) return false;
        
        const isCorrect = this.checkAnswer(question, answer);
        
        question.answered = true;
        question.correct = isCorrect;
        question.timeSpent = timeSpent;
        question.userAnswer = answer;
        
        this.responses.push({
            questionId,
            answer,
            correct: isCorrect,
            timestamp: new Date(),
            timeSpent
        });
        
        if (isCorrect) {
            this.score++;
            this.streak++;
            if (this.streak > this.maxStreak) {
                this.maxStreak = this.streak;
            }
        } else {
            this.streak = 0;
        }
        
        return isCorrect;
    }
    
    checkAnswer(question, userAnswer) {
        // Расширенная проверка ответов
        switch(question.type) {
            case 'multiple_choice':
                return String(question.correctAnswer) === String(userAnswer);
                
            case 'true_false':
                return question.correctAnswer === (userAnswer === 'true');
                
            case 'fill_blank':
                return question.correctAnswer.toString().toLowerCase().trim() === 
                       userAnswer.toString().toLowerCase().trim();
                
            case 'matching':
                try {
                    const userArray = typeof userAnswer === 'string' ? 
                        JSON.parse(userAnswer) : userAnswer;
                    return JSON.stringify(question.correctAnswer) === JSON.stringify(userArray);
                } catch (e) {
                    return false;
                }
                
            case 'sequence':
                return String(question.correctAnswer) === String(userAnswer);
                
            case 'puzzle':
                return String(question.correctAnswer) === String(userAnswer);
                
            case 'race':
                return userAnswer === 'correct';
                
            default:
                return false;
        }
    }
    
    complete() {
        this.endTime = new Date();
        this.timeSpent = Math.round((this.endTime - this.startTime) / 1000);
        this.completed = true;
        
        // Рассчет точности
        this.accuracy = this.questions.length > 0 
            ? Math.round((this.score / this.questions.length) * 100) 
            : 0;
            
        // Расчет очков XP
        this.xpEarned = this.calculateXP();
        
        // Рассчет рейтинга
        this.rating = this.calculateRating();
        
        return this;
    }
    
    calculateXP() {
        if (this.questions.length === 0) return 0;
        
        let baseXP = this.score * TRAINING_CONFIG.XP_PER_CORRECT;
        const difficulty = TRAINING_CONFIG.DIFFICULTY_LEVELS[this.difficulty];
        
        // Множитель сложности
        baseXP *= difficulty.multiplier;
        
        // Бонус за скорость (быстрее = больше XP)
        const avgTimePerQuestion = this.timeSpent / this.questions.length;
        if (avgTimePerQuestion < 5) baseXP *= 1.5;
        else if (avgTimePerQuestion < 10) baseXP *= 1.3;
        else if (avgTimePerQuestion < 20) baseXP *= 1.1;
        
        // Бонус за точность
        if (this.accuracy === 100) baseXP *= 2;
        else if (this.accuracy >= 90) baseXP *= 1.5;
        else if (this.accuracy >= 80) baseXP *= 1.2;
        
        // Бонус за серию правильных ответов
        if (this.maxStreak >= 5) baseXP *= 1.2;
        if (this.maxStreak >= 10) baseXP *= 1.5;
        
        return Math.max(Math.round(baseXP), 1);
    }
    
    calculateRating() {
        if (this.questions.length === 0) return 0;
        
        let rating = 0;
        
        // Базовый рейтинг за точность
        rating += this.accuracy * 0.5;
        
        // Бонус за скорость
        const avgTime = this.timeSpent / this.questions.length;
        if (avgTime < 5) rating += 30;
        else if (avgTime < 10) rating += 20;
        else if (avgTime < 20) rating += 10;
        
        // Бонус за сложность
        const difficultyBonus = {
            easy: 0,
            medium: 10,
            hard: 20,
            expert: 30
        };
        rating += difficultyBonus[this.difficulty] || 0;
        
        // Бонус за серию
        rating += this.maxStreak * 2;
        
        return Math.min(Math.round(rating), 100);
    }
    
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            difficulty: this.difficulty,
            startTime: this.startTime.toISOString(),
            endTime: this.endTime?.toISOString(),
            questions: this.questions.length,
            score: this.score,
            accuracy: this.accuracy || 0,
            timeSpent: this.timeSpent,
            xpEarned: this.xpEarned || 0,
            rating: this.rating || 0,
            streak: this.maxStreak
        };
    }
}

class TrainingProgress {
    constructor() {
        this.level = 1;
        this.xp = 0;
        this.totalXP = 0;
        this.streak = 0;
        this.lastTrainingDate = null;
        this.achievements = [];
        this.trainingHistory = [];
        this.errorStats = {};
        this.typeStats = {};
        this.dailyStats = {};
        this.stats = {
            totalSessions: 0,
            totalQuestions: 0,
            correctAnswers: 0,
            totalTime: 0,
            bestScore: 0,
            bestAccuracy: 0,
            fastestSession: Infinity,
            bestRating: 0,
            longestStreak: 0
        };
        
        this.initializeTypeStats();
    }
    
    initializeTypeStats() {
        Object.values(TRAINING_CONFIG.TRAINING_TYPES).forEach(type => {
            this.typeStats[type.id] = {
                count: 0,
                totalScore: 0,
                totalQuestions: 0,
                bestScore: 0,
                totalTime: 0
            };
        });
    }
    
    addSession(session) {
        const sessionData = typeof session.toJSON === 'function' ? session.toJSON() : session;
        this.trainingHistory.push(sessionData);
        
        // Обновление основной статистики
        this.stats.totalSessions++;
        this.stats.totalQuestions += sessionData.questions || 0;
        this.stats.correctAnswers += sessionData.score || 0;
        this.stats.totalTime += sessionData.timeSpent || 0;
        this.stats.bestScore = Math.max(this.stats.bestScore, sessionData.score || 0);
        this.stats.bestAccuracy = Math.max(this.stats.bestAccuracy, sessionData.accuracy || 0);
        this.stats.fastestSession = Math.min(this.stats.fastestSession, sessionData.timeSpent || Infinity);
        this.stats.bestRating = Math.max(this.stats.bestRating, sessionData.rating || 0);
        this.stats.longestStreak = Math.max(this.stats.longestStreak, sessionData.streak || 0);
        
        // Обновление статистики по типам тренировок
        if (sessionData.type && this.typeStats[sessionData.type]) {
            this.typeStats[sessionData.type].count++;
            this.typeStats[sessionData.type].totalScore += sessionData.score || 0;
            this.typeStats[sessionData.type].totalQuestions += sessionData.questions || 0;
            this.typeStats[sessionData.type].totalTime += sessionData.timeSpent || 0;
            this.typeStats[sessionData.type].bestScore = Math.max(
                this.typeStats[sessionData.type].bestScore, 
                sessionData.score || 0
            );
        }
        
        // Добавление XP и проверка уровня
        this.addXP(sessionData.xpEarned || 0);
        
        // Обновление серии
        this.updateStreak();
        
        // Обновление дневной статистики
        this.updateDailyStats(sessionData);
        
        // Проверка достижений
        this.checkAchievements(sessionData);
        
        // Сохраняем новые достижения
        this.achievements.forEach(ach => {
            if (ach.isNew) {
                ach.isNew = false; // Снимаем флаг "новое"
            }
        });
        
        this.save();
        
        return sessionData;
    }
    
    addXP(xp) {
        this.xp += xp;
        this.totalXP += xp;
        
        // Проверка повышения уровня
        const xpNeeded = this.level * TRAINING_CONFIG.XP_PER_LEVEL;
        if (this.xp >= xpNeeded) {
            this.xp -= xpNeeded;
            this.level++;
            
            if (this.level >= 5) {
                this.unlockAchievement('level_5', true);
            }
            
            if (typeof showNotification === 'function') {
                showNotification(`🎉 Уровень повышен! Теперь вы ${this.level} уровня`, 'success');
            }
        }
    }
    
    updateStreak() {
        const today = new Date().toDateString();
        const lastDate = this.lastTrainingDate ? new Date(this.lastTrainingDate).toDateString() : null;
        
        if (lastDate === today) {
            return; // Уже тренировались сегодня
        }
        
        if (!lastDate || this.isConsecutiveDay(lastDate)) {
            this.streak++;
            this.unlockAchievement('streak_5', this.streak >= 5);
        } else {
            this.streak = 1;
        }
        
        this.lastTrainingDate = new Date().toISOString();
    }
    
    updateDailyStats(sessionData) {
        const today = new Date().toDateString();
        if (!this.dailyStats[today]) {
            this.dailyStats[today] = {
                sessions: 0,
                questions: 0,
                correct: 0,
                xp: 0,
                date: today
            };
        }
        
        this.dailyStats[today].sessions++;
        this.dailyStats[today].questions += sessionData.questions || 0;
        this.dailyStats[today].correct += sessionData.score || 0;
        this.dailyStats[today].xp += sessionData.xpEarned || 0;
    }
    
    checkAchievements(session) {
        // Проверка достижения за первую тренировку
        if (this.stats.totalSessions === 1) {
            this.unlockAchievement('first_step');
        }
        
        // Проверка достижения за идеальную точность
        if (session.accuracy === 100 && session.questions >= 10) {
            this.unlockAchievement('perfectionist');
        }
        
        // Проверка достижения за скорость
        const avgTime = session.timeSpent / (session.questions || 1);
        if (avgTime < 3) {
            this.unlockAchievement('speed_demon');
        }
        
        // Проверка достижения за серию
        if (session.streak >= 10) {
            this.unlockAchievement('perfect_10');
        }
        
        // Проверка достижений по типам тренировок
        Object.entries(this.typeStats).forEach(([type, stats]) => {
            if (stats.count >= 10) {
                const achievementMap = {
                    'quiz': 'quiz_champ',
                    'visual': 'visual_genius',
                    'game': 'game_guru',
                    'puzzle': 'puzzle_master',
                    'adaptive': 'error_master'
                };
                if (achievementMap[type]) {
                    this.unlockAchievement(achievementMap[type]);
                }
            }
        });
        
        // Проверка достижения за количество тренировок
        if (this.stats.totalSessions >= 50) {
            this.unlockAchievement('marathon');
        }
    }
    
    unlockAchievement(achievementId, condition = true) {
        if (!condition) return;
        
        const achievement = TRAINING_CONFIG.ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!achievement) return;
        
        const alreadyEarned = this.achievements.some(a => a.id === achievementId);
        if (alreadyEarned) return;
        
        const newAchievement = {
            ...achievement,
            earnedAt: new Date().toISOString(),
            isNew: true
        };
        
        this.achievements.push(newAchievement);
        
        this.addXP(achievement.xp);
        
        if (typeof showAchievementNotification === 'function') {
            showAchievementNotification(achievement);
        } else {
            console.log(`🏆 Достижение получено: ${achievement.name}`);
        }
    }
    
    isConsecutiveDay(lastDate) {
        try {
            const last = new Date(lastDate);
            const today = new Date();
            
            // Устанавливаем время на 00:00 для сравнения только дат
            last.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            
            const diffTime = today - last;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            
            return diffDays === 1;
        } catch (e) {
            return false;
        }
    }
    
    getProgress() {
        const xpNeeded = this.level * TRAINING_CONFIG.XP_PER_LEVEL;
        const progress = xpNeeded > 0 ? (this.xp / xpNeeded) * 100 : 0;
        
        return {
            level: this.level,
            xp: this.xp,
            xpNeeded: xpNeeded,
            progress: Math.min(progress, 100),
            streak: this.streak,
            accuracy: this.getAccuracy(),
            totalTime: this.formatTime(this.stats.totalTime),
            rating: this.stats.bestRating,
            totalXP: this.totalXP,
            totalSessions: this.stats.totalSessions
        };
    }
    
    getAccuracy() {
        return this.stats.totalQuestions > 0 
            ? Math.round((this.stats.correctAnswers / this.stats.totalQuestions) * 100)
            : 0;
    }
    
    getTypeStats(typeId) {
        const stats = this.typeStats[typeId] || { count: 0, accuracy: 0 };
        stats.accuracy = stats.totalQuestions > 0 
            ? Math.round((stats.totalScore / stats.totalQuestions) * 100)
            : 0;
        return stats;
    }
    
    formatTime(seconds) {
        if (seconds < 60) return `${seconds}с`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}м ${seconds % 60}с`;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}ч ${minutes}м`;
    }
    
    save() {
        try {
            const data = {
                level: this.level,
                xp: this.xp,
                totalXP: this.totalXP,
                streak: this.streak,
                lastTrainingDate: this.lastTrainingDate,
                achievements: this.achievements,
                trainingHistory: this.trainingHistory,
                typeStats: this.typeStats,
                dailyStats: this.dailyStats,
                stats: this.stats,
                errorStats: this.errorStats
            };
            localStorage.setItem('trainingProgress', JSON.stringify(data));
        } catch (e) {
            console.error('Error saving training progress:', e);
        }
    }
    
    static load() {
        try {
            const saved = localStorage.getItem('trainingProgress');
            if (saved) {
                const data = JSON.parse(saved);
                const progress = new TrainingProgress();
                
                // Восстанавливаем все свойства
                Object.keys(data).forEach(key => {
                    if (key in progress) {
                        progress[key] = data[key];
                    }
                });
                
                // Убедимся, что все свойства инициализированы
                progress.initializeTypeStats();
                
                // Синхронизируем typeStats с загруженными данными
                if (data.typeStats) {
                    Object.keys(data.typeStats).forEach(key => {
                        progress.typeStats[key] = { ...progress.typeStats[key], ...data.typeStats[key] };
                    });
                }
                
                return progress;
            }
        } catch (e) {
            console.error('Error loading training progress:', e);
        }
        return new TrainingProgress();
    }
}

// ============================
// РАСШИРЕННЫЙ ГЕНЕРАТОР ЗАДАНИЙ
// ============================

class AdvancedExerciseGenerator {
    constructor() {
        this.mathProblems = this.generateMathProblems();
        this.visualProblems = this.generateVisualProblems();
        this.gameProblems = this.generateGameProblems();
        this.puzzleProblems = this.generatePuzzleProblems();
        this.quizProblems = this.generateQuizProblems();

        this.ensureQuestionStructures();
    }
    
    ensureQuestionStructures() {
        // Проверяем и исправляем все вопросы во всех пулах
        [this.mathProblems, this.visualProblems, this.gameProblems, this.puzzleProblems, this.quizProblems].forEach(pool => {
            pool.forEach(question => {
                this.fixQuestionStructure(question);
            });
        });
    }
    
    fixQuestionStructure(question) {
		// Гарантируем наличие type
		if (!question.type) {
			// Определяем тип по наличию полей
			if (question.options && Array.isArray(question.options)) {
				if (question.options.length === 2 && question.options.includes('true') && question.options.includes('false')) {
					question.type = 'true_false';
				} else {
					question.type = 'multiple_choice';
				}
			} else if (question.correctAnswer && typeof question.correctAnswer === 'string') {
				question.type = 'fill_blank';
			} else {
				question.type = 'multiple_choice';
			}
		}
		
		// Для вопросов типа word, logic, riddle - устанавливаем как multiple_choice
		if (question.type === 'word' || question.type === 'logic' || question.type === 'riddle') {
			question.type = 'multiple_choice';
		}
		
		// Гарантируем наличие options для вопросов с выбором
		if (question.type === 'multiple_choice' || question.type === 'true_false') {
			if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
				question.options = this.generateOptions(question.correctAnswer, 4);
			}
		}
		
		// Гарантируем наличие correctAnswer
		if (question.correctAnswer === undefined || question.correctAnswer === null) {
			console.warn('Question missing correctAnswer:', question);
			question.correctAnswer = question.options ? question.options[0] : 'Ответ';
		}
		
		// Гарантируем наличие text
		if (!question.text && question.question) {
			question.text = question.question;
		}
		
		return question;
	}
    // ГЕНЕРАЦИЯ РАЗЛИЧНЫХ ТИПОВ ВОПРОСОВ
    
    generateQuestions(type, count, difficulty) {
        const questions = [];
        
        for (let i = 0; i < count; i++) {
            let question;
            
            switch(type) {
                case 'adaptive':
                    question = this.generateAdaptiveQuestion(difficulty);
                    break;
                case 'game':
                    question = this.generateGameQuestion(difficulty);
                    break;
                case 'visual':
                    question = this.generateVisualQuestion(difficulty);
                    break;
                case 'quiz':
                    question = this.generateQuizQuestion(difficulty);
                    break;
                case 'puzzle':
                    question = this.generatePuzzleQuestion(difficulty);
                    break;
                case 'race':
                    question = this.generateRaceQuestion(difficulty);
                    break;
                default:
                    question = this.generateRandomQuestion(difficulty);
            }
            
            if (question) {
                // Фиксируем структуру вопроса
                question = this.fixQuestionStructure({...question});
                
                questions.push({
                    id: `q_${i + 1}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                    ...question,
                    difficulty,
                    points: this.getQuestionPoints(difficulty)
                });
            }
        }
        
        return questions;
    }
    
    // НОВЫЕ ВОПРОСЫ (добавлено 30+ новых вопросов)
    
    // МАТЕМАТИЧЕСКИЕ ВОПРОСЫ (дополнено)
    generateMathProblems() {
        return [
            // Арифметика
            {
                type: 'multiple_choice',
                text: "Решите: 15 × (8 - 3) ÷ 5 = ?",
                options: ["15", "12", "10", "18"],
                correctAnswer: "15",
                explanation: "Сначала скобки: 8-3=5, затем 15×5=75, 75÷5=15",
                category: 'arithmetic'
            },
            {
                type: 'fill_blank',
                text: "Сумма чисел 47 и 28 равна __",
                correctAnswer: "75",
                explanation: "47 + 28 = 75",
                category: 'addition'
            },
            {
                type: 'multiple_choice',
                text: "Какое число следует за 2, 4, 8, 16, ...?",
                options: ["20", "24", "32", "30"],
                correctAnswer: "32",
                explanation: "Каждое следующее число умножается на 2",
                category: 'sequence'
            },
            {
                type: 'multiple_choice',
                text: "Сколько будет 3/4 от 100?",
                options: ["25", "50", "75", "100"],
                correctAnswer: "75",
                explanation: "100 × 3/4 = 75",
                category: 'fractions'
            },
            {
                type: 'multiple_choice',
                text: "20% от 250 это:",
                options: ["25", "50", "75", "100"],
                correctAnswer: "50",
                explanation: "250 × 0.20 = 50",
                category: 'percentages'
            },
            {
                type: 'multiple_choice',
                text: "Периметр квадрата со стороной 5 см равен:",
                options: ["10 см", "15 см", "20 см", "25 см"],
                correctAnswer: "20 см",
                explanation: "Периметр квадрата = 4 × сторона = 4 × 5 = 20 см",
                category: 'geometry'
            },
            // Новые математические вопросы
            {
                type: 'multiple_choice',
                text: "√144 = ?",
                options: ["10", "11", "12", "13"],
                correctAnswer: "12",
                explanation: "12 × 12 = 144",
                category: 'algebra'
            },
            {
                type: 'multiple_choice',
                text: "Сколько градусов в прямом углу?",
                options: ["45°", "90°", "180°", "360°"],
                correctAnswer: "90°",
                explanation: "Прямой угол равен 90 градусам",
                category: 'geometry'
            },
            {
                type: 'fill_blank',
                text: "Площадь прямоугольника 6×4 = __ кв.см",
                correctAnswer: "24",
                explanation: "6 × 4 = 24 квадратных сантиметра",
                category: 'geometry'
            },
            {
                type: 'multiple_choice',
                text: "Какое число является простым?",
                options: ["9", "15", "17", "21"],
                correctAnswer: "17",
                explanation: "17 делится только на 1 и на себя",
                category: 'numbers'
            },
            {
                type: 'multiple_choice',
                text: "Среднее арифметическое чисел 10, 20, 30 равно:",
                options: ["15", "20", "25", "30"],
                correctAnswer: "20",
                explanation: "(10 + 20 + 30) ÷ 3 = 20",
                category: 'statistics'
            },
            {
                type: 'multiple_choice',
                text: "2³ × 2² = ?",
                options: ["2⁵", "2⁶", "4⁵", "8²"],
                correctAnswer: "2⁵",
                explanation: "2³ = 8, 2² = 4, 8×4=32, 2⁵=32",
                category: 'exponents'
            }
        ];
    }
    
    // ВИЗУАЛЬНЫЕ ВОПРОСЫ (дополнено)
    generateVisualProblems() {
        return [
            {
                type: 'multiple_choice',
                text: "🎨 Сколько треугольников на этой фигуре? (▽▽)",
                options: ["2", "3", "4", "5"],
                correctAnswer: "4",
                explanation: "Два маленьких и два больших треугольника",
                category: 'shapes'
            },
            {
                type: 'sequence',
                text: "🔳 🔲 🔳 🔲 ? (продолжите последовательность)",
                options: ["🔳", "🔲", "⬜", "⬛"],
                correctAnswer: "🔳",
                explanation: "Чередование черного и белого квадратов",
                category: 'patterns'
            },
            {
                type: 'multiple_choice',
                text: "🎯 Какая фигура лишняя: ● ■ ▲ ◆ ?",
                options: ["●", "■", "▲", "◆"],
                correctAnswer: "◆",
                explanation: "Ромб - единственная фигура без прямых углов",
                category: 'shapes'
            },
            {
                type: 'puzzle',
                text: "🧩 Если повернуть ♠ на 90°, какую фигуру получим?",
                options: ["♣", "♥", "♦", "♠"],
                correctAnswer: "♠",
                explanation: "Пиковая масть симметрична",
                category: 'rotation'
            },
            {
                type: 'matching',
                text: "🔤 Сопоставьте фигуры: 1-▲, 2-■, 3-●, 4-★",
                options: ["Треугольник-1", "Квадрат-2", "Круг-3", "Звезда-4"],
                correctAnswer: ["▲-1", "■-2", "●-3", "★-4"],
                explanation: "Прямое соответствие",
                category: 'matching'
            },
            // Новые визуальные вопросы
            {
                type: 'multiple_choice',
                text: "🎨 Какая фигура следующая? ◯ △ □ ◯ △ ?",
                options: ["□", "△", "◯", "☆"],
                correctAnswer: "□",
                explanation: "Последовательность: круг, треугольник, квадрат",
                category: 'patterns'
            },
            {
                type: 'multiple_choice',
                text: "🔄 Сколько осей симметрии у квадрата?",
                options: ["2", "4", "6", "8"],
                correctAnswer: "4",
                explanation: "Квадрат имеет 4 оси симметрии",
                category: 'symmetry'
            },
            {
                type: 'multiple_choice',
                text: "🎯 Какая фигура получится из двух треугольников?",
                options: ["Квадрат", "Ромб", "Параллелограмм", "Шестиугольник"],
                correctAnswer: "Параллелограмм",
                explanation: "Два треугольника образуют параллелограмм",
                category: 'shapes'
            },
            {
                type: 'multiple_choice',
                text: "🔍 Сколько кубиков в фигуре 3×3×3?",
                options: ["9", "18", "27", "36"],
                correctAnswer: "27",
                explanation: "3 × 3 × 3 = 27 кубиков",
                category: '3d'
            }
        ];
    }
    
    // ИГРОВЫЕ ВОПРОСЫ (дополнено)
    generateGameProblems() {
        return [
            {
                type: 'true_false',
                text: "🎮 В игре 'тетрис' фигуры падают снизу вверх?",
                options: ["true", "false"],
                correctAnswer: false,
                explanation: "В тетрисе фигуры падают сверху вниз",
                category: 'games'
            },
            {
                type: 'multiple_choice',
                text: "🏆 Сколько клеток на шахматной доске?",
                options: ["32", "48", "64", "72"],
                correctAnswer: "64",
                explanation: "8 × 8 = 64 клеток",
                category: 'chess'
            },
            {
                type: 'multiple_choice',
                text: "🎲 Какая сумма на противоположных сторонах игрального кубика?",
                options: ["5", "6", "7", "8"],
                correctAnswer: "7",
                explanation: "1+6, 2+5, 3+4 = всегда 7",
                category: 'dice'
            },
            {
                type: 'race',
                text: "⚡ Быстрая реакция: нажмите когда увидите 'GO!'",
                options: ["Готов", "Жду", "Внимание", "Старт"],
                correctAnswer: "GO!",
                explanation: "Тест на скорость реакции",
                category: 'reaction',
                timeLimit: 2
            },
            {
                type: 'memory',
                text: "🧠 Запомните последовательность: ▲ ● ■",
                options: ["▲ ■ ●", "● ▲ ■", "▲ ● ■", "■ ● ▲"],
                correctAnswer: "▲ ● ■",
                explanation: "Проверка памяти",
                category: 'memory',
                delay: 3
            },
            // Новые игровые вопросы
            {
                type: 'multiple_choice',
                text: "🎮 Сколько полосок у классического змейки в игре 'Змейка'?",
                options: ["3", "4", "5", "6"],
                correctAnswer: "3",
                explanation: "Классическая змейка начинается с 3 сегментов",
                category: 'games'
            },
            {
                type: 'multiple_choice',
                text: "♟️ Сколько фигур у каждого игрока в начале шахматной партии?",
                options: ["14", "15", "16", "17"],
                correctAnswer: "16",
                explanation: "8 пешек + 8 фигур = 16 фигур",
                category: 'chess'
            },
            {
                type: 'true_false',
                text: "🎯 В дартс максимальное количество очков за один бросок - 60",
                options: ["true", "false"],
                correctAnswer: true,
                explanation: "Тройное 20 дает 60 очков",
                category: 'darts'
            },
            {
                type: 'multiple_choice',
                text: "🎲 Сколько точек на стандартном домино?",
                options: ["126", "148", "168", "182"],
                correctAnswer: "168",
                explanation: "Сумма всех точек в доминошном наборе",
                category: 'domino'
            }
        ];
    }
    
    // ГОЛОВОЛОМКИ (дополнено)
    generatePuzzleProblems() {
        return [
            {
                type: 'riddle',
                text: "❓ Что можно сломать, даже не касаясь?",
                options: ["Стекло", "Обещание", "Сердце", "Молчание"],
                correctAnswer: "Обещание",
                explanation: "Обещание можно нарушить, не касаясь его",
                category: 'riddles'
            },
            {
                type: 'logic',
                text: "🧩 Если все вороны черные, а эта птица черная, значит ли это, что это ворона?",
                options: ["Да", "Нет", "Не всегда", "Не знаю"],
                correctAnswer: "Не всегда",
                explanation: "Есть и другие черные птицы",
                category: 'logic'
            },
            {
                type: 'sequence',
                text: "📊 Продолжите: 1, 1, 2, 3, 5, 8, ...",
                options: ["11", "12", "13", "14"],
                correctAnswer: "13",
                explanation: "Числа Фибоначчи: каждое следующее - сумма двух предыдущих",
                category: 'sequences'
            },
            {
                type: 'word',
                text: "🔤 Какое слово лишнее: стол, стул, диван, кровать?",
                options: ["стол", "стул", "диван", "кровать"],
                correctAnswer: "стол",
                explanation: "Только стол не для сидения/лежания",
                category: 'word_puzzles'
            },
            // Новые головоломки
            {
                type: 'logic',
                text: "🧠 Что тяжелее: 1 кг железа или 1 кг ваты?",
                options: ["Железо", "Вата", "Одинаково", "Зависит"],
                correctAnswer: "Одинаково",
                explanation: "Оба весят 1 килограмм",
                category: 'logic'
            },
            {
                type: 'riddle',
                text: "❓ Чем больше берешь, тем больше становится. Что это?",
                options: ["Яма", "Дыра", "Сумка", "Знания"],
                correctAnswer: "Яма",
                explanation: "Когда копаешь яму, она становится больше",
                category: 'riddles'
            },
            {
                type: 'sequence',
                text: "🔢 Продолжите: 2, 3, 5, 7, 11, ...",
                options: ["13", "15", "17", "19"],
                correctAnswer: "13",
                explanation: "Простые числа в порядке возрастания",
                category: 'sequences'
            },
            {
                type: 'logic',
                text: "💡 Если у Маши 3 яблока, а у Пети 5, сколько у них вместе?",
                options: ["8", "7", "6", "5"],
                correctAnswer: "8",
                explanation: "3 + 5 = 8 яблок",
                category: 'logic'
            }
        ];
    }
    
    // НОВЫЕ ВИКТОРИНЫ
    generateQuizProblems() {
        return [
            {
                type: 'multiple_choice',
                text: "🧪 Какой газ мы выдыхаем?",
                options: ["Кислород", "Азот", "Углекислый", "Водород"],
                correctAnswer: "Углекислый",
                explanation: "В процессе дыхания выделяется CO2",
                category: 'science'
            },
            {
                type: 'multiple_choice',
                text: "🌍 Самая большая планета Солнечной системы?",
                options: ["Земля", "Сатурн", "Юпитер", "Марс"],
                correctAnswer: "Юпитер",
                explanation: "Юпитер - газовый гигант, самая большая планета",
                category: 'astronomy'
            },
            {
                type: 'multiple_choice',
                text: "📚 Кто написал 'Войну и мир'?",
                options: ["Достоевский", "Толстой", "Пушкин", "Чехов"],
                correctAnswer: "Толстой",
                explanation: "Лев Толстой - автор 'Войны и мира'",
                category: 'literature'
            },
            // Новые викторины
            {
                type: 'multiple_choice',
                text: "🎨 Кто написал картину 'Мона Лиза'?",
                options: ["Ван Гог", "Рембрандт", "Да Винчи", "Пикассо"],
                correctAnswer: "Да Винчи",
                explanation: "Леонардо да Винчи - автор Джоконды",
                category: 'art'
            },
            {
                type: 'multiple_choice',
                text: "🎵 Сколько нот в октаве?",
                options: ["7", "8", "9", "10"],
                correctAnswer: "8",
                explanation: "До, ре, ми, фа, соль, ля, си, до - 8 нот",
                category: 'music'
            },
            {
                type: 'true_false',
                text: "🐋 Синий кит - самое большое животное на Земле",
                options: ["true", "false"],
                correctAnswer: true,
                explanation: "Синий кит достигает 30 метров в длину",
                category: 'biology'
            },
            {
                type: 'multiple_choice',
                text: "🌡️ Нормальная температура тела человека?",
                options: ["36.0°C", "36.6°C", "37.0°C", "37.5°C"],
                correctAnswer: "36.6°C",
                explanation: "Средняя нормальная температура - 36.6°C",
                category: 'medicine'
            },
            {
                type: 'multiple_choice',
                text: "⚽ Сколько игроков в футбольной команде?",
                options: ["9", "10", "11", "12"],
                correctAnswer: "11",
                explanation: "Футбольная команда состоит из 11 игроков",
                category: 'sports'
            }
        ];
    }
    
    // ГЕНЕРАТОРЫ КОНКРЕТНЫХ ВОПРОСОВ
    
    generateAdaptiveQuestion(difficulty) {
        // Анализ ошибок пользователя
        const userErrors = this.analyzeUserErrors();
        
        if (userErrors.length > 0) {
            const errorType = userErrors[0].type;
            return this.generateQuestionForError(errorType, difficulty);
        }
        
        // Случайный вопрос если нет ошибок
        const categories = ['math', 'visual', 'logic', 'quiz'];
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        switch(category) {
            case 'math': return this.getRandomQuestion(this.mathProblems, difficulty);
            case 'visual': return this.getRandomQuestion(this.visualProblems, difficulty);
            case 'logic': return this.getRandomQuestion(this.puzzleProblems, difficulty);
            case 'quiz': return this.getRandomQuestion(this.quizProblems, difficulty);
            default: return this.getRandomQuestion(this.mathProblems, difficulty);
        }
    }
    
    generateGameQuestion(difficulty) {
        const games = ['memory', 'reaction', 'timing', 'puzzle'];
        const gameType = games[Math.floor(Math.random() * games.length)];
        
        switch(gameType) {
            case 'memory':
                const symbols = ['🔴', '🟢', '🔵', '🟡', '🟣', '🟠'];
                const memorySeq = [...Array(4)].map(() => symbols[Math.floor(Math.random() * symbols.length)]);
                return {
                    type: 'memory',
                    text: `🎮 Запомните цвета: ${memorySeq.join(' ')}`,
                    options: [
                        memorySeq.join(' '),
                        [...memorySeq].reverse().join(' '),
                        [...memorySeq].sort(() => Math.random() - 0.5).join(' '),
                        symbols.slice(0, 4).join(' ')
                    ],
                    correctAnswer: memorySeq.join(' '),
                    explanation: "Проверка зрительной памяти",
                    timeLimit: difficulty === 'hard' ? 2 : difficulty === 'expert' ? 1 : 3,
                    delay: difficulty === 'easy' ? 4 : difficulty === 'medium' ? 3 : 2
                };
                
            case 'reaction':
                return {
                    type: 'race',
                    text: "⚡ Нажмите когда цвет изменится на ЗЕЛЕНЫЙ",
                    options: ["Жду...", "Готов!", "Внимание", "Старт"],
                    correctAnswer: "GO!",
                    explanation: "Тест скорости реакции",
                    timeLimit: difficulty === 'easy' ? 5 : difficulty === 'medium' ? 4 : difficulty === 'hard' ? 3 : 2
                };
                
            case 'timing':
                const targetTime = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 7 : difficulty === 'hard' ? 10 : 15;
                return {
                    type: 'timing',
                    text: `⏱️ Нажмите точно через ${targetTime} секунд после старта`,
                    options: ["Старт!", "Жду", "Готов", "Вперед"],
                    correctAnswer: "NOW!",
                    explanation: `Нужно было нажать через ${targetTime} секунд`,
                    targetTime: targetTime
                };
                
            default:
                return this.getRandomQuestion(this.gameProblems, difficulty);
        }
    }
    
    generateVisualQuestion(difficulty) {
        const visualTypes = ['patterns', 'shapes', 'rotation', 'symmetry'];
        const visualType = visualTypes[Math.floor(Math.random() * visualTypes.length)];
        
        switch(visualType) {
            case 'patterns':
                const patterns = [
                    { seq: "▲ ■ ● ▲ ■ ?", answer: "●" },
                    { seq: "🔴 🔵 🔴 🔵 ?", answer: "🔴" },
                    { seq: "1 4 9 16 ?", answer: "25" },
                    { seq: "→ ↑ ← ?", answer: "↓" }
                ];
                const pattern = patterns[Math.floor(Math.random() * patterns.length)];
                return {
                    type: 'multiple_choice',
                    text: `🔤 Продолжите последовательность: ${pattern.seq}`,
                    options: this.generateOptions(pattern.answer, 4),
                    correctAnswer: pattern.answer,
                    explanation: "Найдите закономерность в последовательности"
                };
                
            case 'rotation':
                const shapes = ['▲', '■', '●', '◆', '★', '⬡'];
                const shape = shapes[Math.floor(Math.random() * shapes.length)];
                const rotations = ['90°', '180°', '270°'];
                const rotation = rotations[Math.floor(Math.random() * rotations.length)];
                
                return {
                    type: 'multiple_choice',
                    text: `🔄 Как будет выглядеть ${shape} после поворота на ${rotation}?`,
                    options: shapes,
                    correctAnswer: shape,
                    explanation: "Некоторые фигуры выглядят одинаково при повороте"
                };
                
            default:
                return this.getRandomQuestion(this.visualProblems, difficulty);
        }
    }
    
    generateQuizQuestion(difficulty) {
        return this.getRandomQuestion(this.quizProblems, difficulty);
    }
    
    generatePuzzleQuestion(difficulty) {
        return this.getRandomQuestion(this.puzzleProblems, difficulty);
    }
    
    generateRaceQuestion(difficulty) {
        const operations = [
            { q: "15 + 25 = ?", a: "40" },
            { q: "100 - 47 = ?", a: "53" },
            { q: "12 × 8 = ?", a: "96" },
            { q: "81 ÷ 9 = ?", a: "9" },
            { q: "7² + 3 = ?", a: "52" }
        ];
        
        const op = operations[Math.floor(Math.random() * operations.length)];
        const timeLimit = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 4 : difficulty === 'hard' ? 3 : 2;
        
        return {
            type: 'race',
            text: `🏎️ Быстрый ответ: ${op.q}`,
            options: this.generateOptions(op.a, 4),
            correctAnswer: op.a,
            explanation: op.q.replace('?', op.a),
            timeLimit: timeLimit
        };
    }
    
    generateRandomQuestion(difficulty) {
        const pools = [
            ...this.mathProblems,
            ...this.visualProblems,
            ...this.gameProblems,
            ...this.puzzleProblems,
            ...this.quizProblems
        ];
        
        return this.getRandomQuestion(pools, difficulty);
    }
    
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    
    getRandomQuestion(pool, difficulty) {
        if (!pool || pool.length === 0) {
            console.error('Question pool is empty');
            return this.createFallbackQuestion();
        }
        
        // Фильтрация по сложности
        const filtered = pool.filter(q => {
            if (!q.category) return true;
            
            if (difficulty === 'easy') {
                return ['easy', 'basic', 'simple', 'addition'].includes(q.category) || 
                       !['hard', 'expert', 'complex'].includes(q.category);
            }
            if (difficulty === 'medium') {
                return !q.category.includes('expert');
            }
            if (difficulty === 'hard') {
                return !q.category.includes('easy');
            }
            if (difficulty === 'expert') {
                return ['hard', 'expert', 'complex'].includes(q.category) || !q.category;
            }
            return true;
        });
        
        const availablePool = filtered.length > 0 ? filtered : pool;
        const question = availablePool[Math.floor(Math.random() * availablePool.length)];
        
        return this.fixQuestionStructure({...question});
    }
    
    createFallbackQuestion() {
        return {
            type: 'multiple_choice',
            text: "2 + 2 = ?",
            options: ["3", "4", "5", "6"],
            correctAnswer: "4",
            explanation: "2 + 2 = 4",
            category: 'basic'
        };
    }
    
    generateOptions(correctAnswer, count) {
        // Преобразуем correctAnswer в строку
        const answerStr = String(correctAnswer);
        
        // Создаем массив для вариантов ответов
        const options = [answerStr];
        
        // Генерируем неправильные варианты
        if (typeof correctAnswer === 'number') {
            // Для числовых ответов
            while (options.length < count) {
                const deviation = Math.floor(Math.random() * 5) + 1;
                const direction = Math.random() > 0.5 ? 1 : -1;
                const wrongNum = correctAnswer + (deviation * direction);
                
                if (wrongNum > 0 && wrongNum < 1000) {
                    const wrongStr = wrongNum.toString();
                    if (!options.includes(wrongStr)) {
                        options.push(wrongStr);
                    }
                }
                
                // Защита от бесконечного цикла
                if (options.length >= count * 2) break;
            }
        } else if (Array.isArray(correctAnswer)) {
            // Для массивов (matching вопросы)
            while (options.length < count) {
                const shuffled = [...correctAnswer].sort(() => Math.random() - 0.5);
                const optionStr = JSON.stringify(shuffled);
                if (!options.includes(optionStr)) {
                    options.push(optionStr);
                }
            }
        } else {
            // Для текстовых ответов
            const similarAnswers = {
                "15": ["12", "18", "20", "25"],
                "32": ["28", "30", "34", "36"],
                "75": ["70", "72", "78", "80"],
                "50": ["45", "48", "52", "55"],
                "4": ["3", "5", "6", "7"],
                "Углекислый": ["Кислород", "Азот", "Водород"],
                "Юпитер": ["Сатурн", "Марс", "Венера"],
                "Толстой": ["Достоевский", "Пушкин", "Чехов"],
                "Да Винчи": ["Ван Гог", "Рембрандт", "Пикассо"]
            };
            
            if (similarAnswers[answerStr]) {
                const similar = similarAnswers[answerStr];
                for (let i = 0; i < similar.length && options.length < count; i++) {
                    if (!options.includes(similar[i])) {
                        options.push(similar[i]);
                    }
                }
            }
            
            // Добавляем общие варианты если не хватает
            while (options.length < count) {
                const generic = `Вариант ${options.length}`;
                if (!options.includes(generic)) {
                    options.push(generic);
                }
            }
        }
        
        // Перемешиваем и возвращаем нужное количество
        return this.shuffleArray(options).slice(0, count);
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    analyzeUserErrors() {
        try {
            // Пробуем получить данные из localStorage
            const progressData = localStorage.getItem('trainingProgress');
            if (!progressData) return [];
            
            const progress = JSON.parse(progressData);
            const history = progress.trainingHistory || [];
            
            // Собираем статистику ошибок
            const errorStats = {};
            
            history.forEach(session => {
                if (session.accuracy !== undefined && session.accuracy < 70) {
                    const type = session.type || 'unknown';
                    errorStats[type] = (errorStats[type] || 0) + 1;
                }
            });
            
            return Object.entries(errorStats)
                .map(([type, count]) => ({ type, count }))
                .sort((a, b) => b.count - a.count);
        } catch (e) {
            console.error('Error analyzing user errors:', e);
            return [];
        }
    }
    
    generateQuestionForError(errorType, difficulty) {
        const errorMap = {
            'math': () => this.getRandomQuestion(this.mathProblems, difficulty),
            'visual': () => this.getRandomQuestion(this.visualProblems, difficulty),
            'logic': () => this.getRandomQuestion(this.puzzleProblems, difficulty),
            'game': () => this.getRandomQuestion(this.gameProblems, difficulty),
            'quiz': () => this.getRandomQuestion(this.quizProblems, difficulty)
        };
        
        const generator = errorMap[errorType] || (() => this.getRandomQuestion(this.mathProblems, difficulty));
        return generator();
    }
    
    getQuestionPoints(difficulty) {
        const points = {
            'easy': 1,
            'medium': 2,
            'hard': 3,
            'expert': 5
        };
        return points[difficulty] || 1;
    }
}

// ============================
// УЛУЧШЕННЫЙ ИНТЕРФЕЙС
// ============================

class EnhancedTrainingUI {
    constructor() {
        this.generator = new AdvancedExerciseGenerator();
        this.progress = TrainingProgress.load();
        this.currentSession = null;
        this.currentQuestionIndex = 0;
        this.questionTimer = null;
        this.sessionTimer = null;
        this.theme = localStorage.getItem('trainingTheme') || 'default';
        this.difficulty = localStorage.getItem('trainingDifficulty') || 'medium';
        this.questionCount = parseInt(localStorage.getItem('trainingQuestionCount') || '10');
        this.isInitialized = false;
    }
    
    // ИНИЦИАЛИЗАЦИЯ И РЕНДЕРИНГ
    initialize() {
        if (this.isInitialized) return;
        
        this.renderTrainingTab();
        this.updateStats();
        this.loadErrorBasedExercises();
        this.loadAchievements();
        this.loadTrainingHistory();
        this.setupEventListeners();
        this.applyTheme();
        
        if (this.progress.stats.totalSessions === 0) {
            setTimeout(() => this.showWelcomeTour(), 1500);
        }
        
        this.isInitialized = true;
    }
    
    renderTrainingTab() {
        const trainingTab = document.getElementById('training');
        if (!trainingTab) {
            console.error('Training tab element not found');
            return;
        }
        
        const progress = this.progress.getProgress();
        const difficulty = TRAINING_CONFIG.DIFFICULTY_LEVELS[this.difficulty] || TRAINING_CONFIG.DIFFICULTY_LEVELS.medium;
        
        trainingTab.innerHTML = `
            <div class="training-container" id="trainingContainer">
                <!-- Хедер с прогрессом -->
                <div class="training-header">
                    <div class="header-main">
                        <h1><i class="fas fa-gamepad"></i> Интерактивные тренажеры</h1>
                        <p class="subtitle">Адаптивное обучение через игру и практику</p>
                    </div>
                    
                    <div class="progress-section">
                        <div class="level-display">
                            <div class="level-badge">
                                <span class="level-number">${progress.level}</span>
                                <span class="level-text">уровень</span>
                            </div>
                            <div class="xp-display">
                                <div class="xp-bar">
                                    <div class="xp-fill" style="width: ${progress.progress}%"></div>
                                </div>
                                <div class="xp-text">${progress.xp} / ${progress.xpNeeded} XP</div>
                            </div>
                        </div>
                        
                        <div class="quick-stats">
                            <div class="stat-item">
                                <div class="stat-icon">🔥</div>
                                <div class="stat-info">
                                    <div class="stat-value">${progress.streak}</div>
                                    <div class="stat-label">дней</div>
                                </div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-icon">🎯</div>
                                <div class="stat-info">
                                    <div class="stat-value">${progress.accuracy}%</div>
                                    <div class="stat-label">точность</div>
                                </div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-icon">⏱️</div>
                                <div class="stat-info">
                                    <div class="stat-value">${progress.totalTime}</div>
                                    <div class="stat-label">время</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Быстрый старт -->
                <div class="quick-start-section">
                    <h3><i class="fas fa-bolt"></i> Быстрый старт</h3>
                    <div class="quick-actions-grid" id="quickActionsGrid">
                        <!-- Заполнится динамически -->
                    </div>
                </div>
                
                <!-- Основной контент в две колонки -->
                <div class="main-content-grid">
                    <!-- Левая колонка: Активная тренировка -->
                    <div class="left-column">
                        <div class="card training-active" id="activeTrainingSection">
                            <div class="card-header">
                                <h4><i class="fas fa-play-circle"></i> Активная тренировка</h4>
                                <div class="difficulty-indicator" style="background: ${difficulty.color}">
                                    ${difficulty.name}
                                </div>
                            </div>
                            <div class="card-body" id="trainingContent">
                                <div class="empty-training-state">
                                    <div class="empty-icon">🎯</div>
                                    <h4>Выберите тип тренировки</h4>
                                    <p>Начните с быстрого старта или выберите из списка</p>
                                    <button class="btn btn-primary" onclick="trainingUI.startRandomTraining()">
                                        <i class="fas fa-random"></i> Случайная тренировка
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Рекомендации -->
                        <div class="card recommendations-card">
                            <div class="card-header">
                                <h4><i class="fas fa-bullseye"></i> Рекомендации</h4>
                            </div>
                            <div class="card-body" id="recommendationsContent">
                                <!-- Заполнится динамически -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Правая колонка: Статистика и достижения -->
                    <div class="right-column">
                        <!-- Статистика -->
                        <div class="card stats-card">
                            <div class="card-header">
                                <h4><i class="fas fa-chart-line"></i> Статистика</h4>
                                <button class="btn-refresh" onclick="trainingUI.updateStats()" title="Обновить">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="stats-grid" id="statsGrid">
                                    <!-- Заполнится динамически -->
                                </div>
                            </div>
                        </div>
                        
                        <!-- Достижения -->
                        <div class="card achievements-card">
                            <div class="card-header">
                                <h4><i class="fas fa-trophy"></i> Достижения</h4>
                                <span class="badge">${this.progress.achievements.length}/${TRAINING_CONFIG.ACHIEVEMENTS.length}</span>
                            </div>
                            <div class="card-body">
                                <div class="achievements-grid" id="achievementsGrid">
                                    <!-- Заполнится динамически -->
                                </div>
                            </div>
                        </div>
                        
                        <!-- Настройки -->
                        <div class="card settings-card">
                            <div class="card-header">
                                <h4><i class="fas fa-cog"></i> Настройки</h4>
                            </div>
                            <div class="card-body">
                                <div class="settings-group">
                                    <label>Сложность:</label>
                                    <div class="difficulty-selector">
                                        ${Object.entries(TRAINING_CONFIG.DIFFICULTY_LEVELS).map(([id, level]) => `
                                            <button class="difficulty-option ${this.difficulty === id ? 'active' : ''}" 
                                                    style="--color: ${level.color}"
                                                    onclick="trainingUI.setDifficulty('${id}')">
                                                ${level.name}
                                            </button>
                                        `).join('')}
                                    </div>
                                </div>
                                
                                <div class="settings-group">
                                    <label>Количество вопросов:</label>
                                    <select class="form-select" id="questionCountSelect" onchange="trainingUI.updateQuestionCount()">
                                        <option value="5" ${this.questionCount === 5 ? 'selected' : ''}>5 вопросов (быстро)</option>
                                        <option value="10" ${this.questionCount === 10 ? 'selected' : ''}>10 вопросов (стандарт)</option>
                                        <option value="15" ${this.questionCount === 15 ? 'selected' : ''}>15 вопросов (продвинуто)</option>
                                        <option value="20" ${this.questionCount === 20 ? 'selected' : ''}>20 вопросов (интенсив)</option>
                                    </select>
                                </div>
                                
                                <div class="settings-group">
                                    <label>Тема:</label>
                                    <select class="form-select" id="themeSelect" onchange="trainingUI.changeTheme(this.value)">
                                        ${Object.values(TRAINING_CONFIG.THEMES).map(theme => `
                                            <option value="${theme.id}" ${this.theme === theme.id ? 'selected' : ''}>
                                                ${theme.name}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                                
                                <div class="settings-group">
                                    <button class="btn-sm btn-warning" onclick="trainingUI.exportData()">
                                        <i class="fas fa-download"></i> Экспорт данных
                                    </button>
                                    <button class="btn-sm btn-danger" onclick="trainingUI.resetProgress()">
                                        <i class="fas fa-trash"></i> Сбросить прогресс
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- История тренировок -->
                <div class="card history-card">
                    <div class="card-header">
                        <h4><i class="fas fa-history"></i> История тренировок</h4>
                        <div class="header-actions">
                            <button class="btn-sm" onclick="trainingUI.toggleHistoryView()">
                                <i class="fas fa-chart-bar"></i> График
                            </button>
                            <button class="btn-sm btn-danger" onclick="trainingUI.clearHistory()">
                                <i class="fas fa-trash"></i> Очистить
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="history-container" id="historyContainer">
                            <!-- Заполнится динамически -->
                        </div>
                    </div>
                </div>
                
                <!-- Панель быстрого доступа -->
                <div class="quick-access-bar">
                    <button class="quick-access-btn" onclick="trainingUI.startDailyChallenge()">
                        <i class="fas fa-calendar-day"></i> Задание дня
                    </button>
                    <button class="quick-access-btn" onclick="trainingUI.showLeaderboard()">
                        <i class="fas fa-crown"></i> Таблица лидеров
                    </button>
                    <button class="quick-access-btn" onclick="trainingUI.showHelp()">
                        <i class="fas fa-question-circle"></i> Помощь
                    </button>
                </div>
            </div>
        `;
        
        // Заполняем динамические части
        this.renderQuickActions();
        this.updateStatsGrid();
        this.renderAchievementsGrid();
        this.loadTrainingHistory();
        this.loadRecommendations();
        
        // Добавляем стили
        this.addStyles();
    }
    
    renderQuickActions() {
        const grid = document.getElementById('quickActionsGrid');
        if (!grid) return;
        
        const actions = Object.values(TRAINING_CONFIG.TRAINING_TYPES).map(type => `
            <div class="quick-action" onclick="trainingUI.startTraining('${type.id}')">
                <div class="action-icon" style="background: ${type.color}">
                    ${type.icon}
                </div>
                <div class="action-info">
                    <div class="action-title">${type.name}</div>
                    <div class="action-stats">
                        <small>${this.progress.getTypeStats(type.id).count} тренировок</small>
                    </div>
                </div>
            </div>
        `).join('');
        
        grid.innerHTML = actions;
    }
    
    updateStatsGrid() {
        const grid = document.getElementById('statsGrid');
        if (!grid) return;
        
        const stats = [
            { icon: '📊', label: 'Всего тренировок', value: this.progress.stats.totalSessions },
            { icon: '❓', label: 'Вопросов решено', value: this.progress.stats.totalQuestions },
            { icon: '✅', label: 'Правильных ответов', value: this.progress.stats.correctAnswers },
            { icon: '⏱️', label: 'Общее время', value: this.progress.formatTime(this.progress.stats.totalTime) },
            { icon: '⭐', label: 'Лучший рейтинг', value: this.progress.stats.bestRating },
            { icon: '🏆', label: 'Рекорд', value: this.progress.stats.bestScore },
            { icon: '📈', label: 'Средняя точность', value: `${this.progress.getAccuracy()}%` },
            { icon: '⚡', label: 'XP всего', value: this.progress.totalXP },
            { icon: '🔥', label: 'Лучшая серия', value: this.progress.stats.longestStreak },
            { icon: '📅', label: 'Текущая серия', value: this.progress.streak }
        ];
        
        grid.innerHTML = stats.map(stat => `
            <div class="stat-card">
                <div class="stat-icon">${stat.icon}</div>
                <div class="stat-content">
                    <div class="stat-value">${stat.value}</div>
                    <div class="stat-label">${stat.label}</div>
                </div>
            </div>
        `).join('');
    }
    
    renderAchievementsGrid() {
        const grid = document.getElementById('achievementsGrid');
        if (!grid) return;
        
        const earnedIds = new Set(this.progress.achievements.map(a => a.id));
        
        grid.innerHTML = TRAINING_CONFIG.ACHIEVEMENTS.map(achievement => {
            const isEarned = earnedIds.has(achievement.id);
            const earnedData = this.progress.achievements.find(a => a.id === achievement.id);
            
            return `
                <div class="achievement-square ${isEarned ? 'earned' : 'locked'}" 
                     title="${achievement.name}: ${achievement.description}"
                     onclick="trainingUI.showAchievementDetails('${achievement.id}')">
                    <div class="achievement-icon" style="background: ${achievement.color}">
                        ${achievement.icon}
                    </div>
                    ${isEarned && earnedData?.isNew ? `
                        <div class="new-badge">NEW</div>
                    ` : ''}
                    ${!isEarned ? `
                        <div class="locked-overlay">🔒</div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }
    
    // ОСНОВНЫЕ ФУНКЦИИ ТРЕНИРОВОК
    
    startRandomTraining() {
        const types = Object.keys(TRAINING_CONFIG.TRAINING_TYPES);
        const randomType = types[Math.floor(Math.random() * types.length)];
        this.startTraining(randomType);
    }
    
    startTraining(type = 'adaptive', customCount = null) {
        const countSelect = document.getElementById('questionCountSelect');
        const questionCount = customCount || (countSelect ? parseInt(countSelect.value) : 10);
        
        this.currentSession = new TrainingSession(type, this.difficulty);
        this.currentQuestionIndex = 0;
        
        // Генерируем вопросы
        const questions = this.generator.generateQuestions(type, questionCount, this.difficulty);
        questions.forEach(q => this.currentSession.addQuestion(q));
        
        // Показываем интерфейс тренировки
        this.showTrainingInterface();
        
        // Начинаем первый вопрос
        setTimeout(() => this.showNextQuestion(), 500);
    }
    
    showTrainingInterface() {
        const trainingContent = document.getElementById('trainingContent');
        if (!trainingContent || !this.currentSession) return;
        
        const type = TRAINING_CONFIG.TRAINING_TYPES[this.currentSession.type] || 
                    { name: 'Тренировка', icon: '🎯', color: '#3498db' };
        
        trainingContent.innerHTML = `
            <div class="session-interface">
                <div class="session-header">
                    <div class="session-title">
                        <div class="session-icon" style="background: ${type.color}">
                            ${type.icon}
                        </div>
                        <div>
                            <h5>${type.name}</h5>
                            <div class="session-subtitle">
                                <span class="difficulty-tag" style="background: ${TRAINING_CONFIG.DIFFICULTY_LEVELS[this.currentSession.difficulty].color}">
                                    ${TRAINING_CONFIG.DIFFICULTY_LEVELS[this.currentSession.difficulty].name}
                                </span>
                                <span>• ${this.currentSession.questions.length} вопросов</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="session-controls">
                        <div class="session-timer" id="sessionTimer">00:00</div>
                        <button class="btn-danger btn-sm" onclick="trainingUI.endTraining()">
                            <i class="fas fa-stop"></i> Стоп
                        </button>
                    </div>
                </div>
                
                <div class="progress-section">
                    <div class="progress-info">
                        <span id="currentQuestionNum">1</span> / ${this.currentSession.questions.length}
                        <span class="score" id="currentScore">0</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="questionProgress" style="width: 0%"></div>
                    </div>
                </div>
                
                <div class="question-area" id="questionArea">
                    <!-- Вопрос появится здесь -->
                </div>
            </div>
        `;
        
        // Запускаем таймер сессии
        this.startSessionTimer();
    }
    
    showNextQuestion() {
        if (!this.currentSession || this.currentQuestionIndex >= this.currentSession.questions.length) {
            this.completeTraining();
            return;
        }
        
        const question = this.currentSession.questions[this.currentQuestionIndex];
        this.questionStartTime = Date.now();
        
        const questionArea = document.getElementById('questionArea');
        if (!questionArea) return;
        
        questionArea.innerHTML = this.renderQuestion(question);
        
        // Обновляем прогресс
        this.updateProgress();
        
        // Запускаем таймер вопроса если есть
        if (question.timeLimit) {
            this.startQuestionTimer(question.timeLimit);
        }
    }
    
    renderQuestion(question) {
        let optionsHTML = '';
        
        switch(question.type) {
            case 'multiple_choice':
                if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
                    console.error('Invalid options for multiple_choice question:', question);
                    question.options = ['Вариант А', 'Вариант Б', 'Вариант В', 'Вариант Г'];
                }
                
                optionsHTML = question.options.map((option, index) => {
                    // Экранируем кавычки для onclick
                    const safeOption = String(option).replace(/"/g, '&quot;').replace(/'/g, '&#039;');
                    return `
                        <button class="option-btn" 
                                onclick="trainingUI.submitAnswer('${question.id}', '${safeOption}')"
                                data-index="${index}">
                            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                            <span class="option-text">${option}</span>
                        </button>
                    `;
                }).join('');
                break;
                
            case 'true_false':
                optionsHTML = `
                    <button class="option-btn wide" onclick="trainingUI.submitAnswer('${question.id}', 'true')">
                        <i class="fas fa-check"></i> Верно
                    </button>
                    <button class="option-btn wide" onclick="trainingUI.submitAnswer('${question.id}', 'false')">
                        <i class="fas fa-times"></i> Неверно
                    </button>
                `;
                break;
                
            case 'fill_blank':
                optionsHTML = `
                    <div class="input-group">
                        <input type="text" id="answerInput" class="form-control" 
                               placeholder="Введите ответ..." 
                               onkeypress="if(event.key === 'Enter') trainingUI.submitTextAnswer('${question.id}')">
                        <button class="btn-primary" onclick="trainingUI.submitTextAnswer('${question.id}')">
                            <i class="fas fa-paper-plane"></i> Отправить
                        </button>
                    </div>
                `;
                break;
                
            case 'race':
                optionsHTML = `
                    <div class="race-question">
                        <div class="race-text">${question.text || 'Быстрая реакция!'}</div>
                        <div class="race-timer" id="raceTimer">${question.timeLimit || 5}</div>
                        <button class="btn-race" id="raceButton" onclick="trainingUI.submitRaceAnswer('${question.id}')">
                            <i class="fas fa-flag-checkered"></i> ГОТОВ!
                        </button>
                    </div>
                `;
                break;
                
            case 'memory':
                const displayText = question.text || "Запомните последовательность";
                const memoryOptions = question.options || ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"];
                
                optionsHTML = `
                    <div class="memory-question">
                        <div class="memory-display" id="memoryDisplay">${displayText}</div>
                        <div class="memory-options">
                            ${memoryOptions.map((option, index) => {
                                const safeOption = String(option).replace(/"/g, '&quot;').replace(/'/g, '&#039;');
                                return `
                                    <button class="memory-option" onclick="trainingUI.submitAnswer('${question.id}', '${safeOption}')">
                                        ${option}
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
                
                // Показываем последовательность на несколько секунд
                setTimeout(() => {
                    const display = document.getElementById('memoryDisplay');
                    if (display) display.textContent = "❓ Что вы запомнили?";
                }, question.delay || 3000);
                break;
                
			case 'word': // ДОБАВЛЕНО: обработка словесных вопросов
			case 'logic': // ДОБАВЛЕНО: обработка логических вопросов
				if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
					console.error('Invalid options for word/logic question:', question);
					question.options = ['Вариант А', 'Вариант Б', 'Вариант В', 'Вариант Г'];
				}
				
				optionsHTML = question.options.map((option, index) => {
					const safeOption = String(option).replace(/"/g, '&quot;').replace(/'/g, '&#039;');
					return `
						<button class="option-btn" 
								onclick="trainingUI.submitAnswer('${question.id}', '${safeOption}')"
								data-index="${index}">
							<span class="option-letter">${String.fromCharCode(65 + index)}</span>
							<span class="option-text">${option}</span>
						</button>
					`;
				}).join('');
				break;
				
            case 'matching':
                if (question.options && Array.isArray(question.options) && question.correctAnswer) {
                    optionsHTML = question.options.map((option, index) => {
                        const safeOption = String(option).replace(/"/g, '&quot;').replace(/'/g, '&#039;');
                        return `
                            <div class="matching-option">
                                <span class="match-item">${option}</span>
                                <select class="match-select" data-id="${question.id}" data-index="${index}">
                                    <option value="">Выберите...</option>
                                    ${question.correctAnswer.map((_, i) => `
                                        <option value="${i}">Вариант ${i + 1}</option>
                                    `).join('')}
                                </select>
                            </div>
                        `;
                    }).join('');
                    
                    optionsHTML += `
                        <button class="btn-primary" onclick="trainingUI.submitMatchingAnswer('${question.id}')">
                            Проверить
                        </button>
                    `;
                }
                break;
                
            default:
				console.warn('Unknown question type:', question.type, 'for question:', question);
				// Пытаемся показать имеющиеся опции или генерируем запасные
				if (question.options && Array.isArray(question.options) && question.options.length > 0) {
					// Используем реальные опции вопроса
					optionsHTML = question.options.map((option, index) => {
						const safeOption = String(option).replace(/"/g, '&quot;').replace(/'/g, '&#039;');
						return `
							<button class="option-btn" 
									onclick="trainingUI.submitAnswer('${question.id}', '${safeOption}')"
									data-index="${index}">
								<span class="option-letter">${String.fromCharCode(65 + index)}</span>
								<span class="option-text">${option}</span>
							</button>
						`;
					}).join('');
				} else {
					// Запасной вариант
					optionsHTML = `
						<div class="fallback-options">
							<p>Выберите правильный ответ:</p>
							${['А', 'Б', 'В', 'Г'].map((letter, index) => `
								<button class="option-btn" onclick="trainingUI.submitAnswer('${question.id}', '${letter}')">
									<span class="option-letter">${letter}</span>
									<span class="option-text">Вариант ${letter}</span>
								</button>
							`).join('')}
						</div>
					`;
				}
        }
        
        return `
            <div class="question-card">
                <div class="question-header">
                    <h5>Вопрос ${this.currentQuestionIndex + 1}</h5>
                    ${question.points ? `
                        <span class="points-badge">${question.points} XP</span>
                    ` : ''}
                    ${question.difficulty ? `
                        <span class="difficulty-badge-small" style="background: ${TRAINING_CONFIG.DIFFICULTY_LEVELS[question.difficulty]?.color || '#7f8c8d'}">
                            ${TRAINING_CONFIG.DIFFICULTY_LEVELS[question.difficulty]?.name || question.difficulty}
                        </span>
                    ` : ''}
                </div>
                
                <div class="question-body">
                    <div class="question-text">${question.text || 'Вопрос'}</div>
                    
                    ${question.image ? `
                        <div class="question-image">
                            <img src="${question.image}" alt="Изображение вопроса">
                        </div>
                    ` : ''}
                    
                    <div class="question-options">
                        ${optionsHTML}
                    </div>
                </div>
                
                ${question.hint ? `
                    <div class="question-hint">
                        <i class="fas fa-lightbulb"></i> ${question.hint}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    submitMatchingAnswer(questionId) {
        const selects = document.querySelectorAll(`.match-select[data-id="${questionId}"]`);
        const answers = Array.from(selects).map(select => select.value);
        
        // Проверяем, что все выбраны
        if (answers.some(answer => answer === "")) {
            if (typeof showNotification === 'function') {
                showNotification('Выберите все варианты!', 'warning');
            }
            return;
        }
        
        this.submitAnswer(questionId, JSON.stringify(answers));
    }
    
    submitAnswer(questionId, answer) {
        if (!this.currentSession || !this.questionStartTime) return;
        
        // Останавливаем таймер вопроса
        if (this.questionTimer) {
            clearInterval(this.questionTimer);
            this.questionTimer = null;
        }
        
        const timeSpent = (Date.now() - this.questionStartTime) / 1000;
        const isCorrect = this.currentSession.submitAnswer(questionId, answer, timeSpent);
        
        // Показываем результат
        this.showAnswerResult(isCorrect, answer);
        
        // Обновляем счет
        this.updateScore();
        
        // Ждем и показываем следующий вопрос
        setTimeout(() => {
            this.currentQuestionIndex++;
            this.showNextQuestion();
        }, isCorrect ? 1000 : 2000);
    }
    
    submitTextAnswer(questionId) {
        const input = document.getElementById('answerInput');
        if (!input || !input.value.trim()) {
            if (typeof showNotification === 'function') {
                showNotification('Введите ответ!', 'warning');
            }
            return;
        }
        
        this.submitAnswer(questionId, input.value.trim());
    }
    
    submitRaceAnswer(questionId) {
        const button = document.getElementById('raceButton');
        const timer = document.getElementById('raceTimer');
        
        if (button && timer) {
            const timeLeft = parseInt(timer.textContent);
            const isCorrect = timeLeft > 0;
            
            button.disabled = true;
            button.innerHTML = isCorrect ? '✅ Успех!' : '❌ Слишком поздно';
            
            this.submitAnswer(questionId, isCorrect ? 'correct' : 'timeout');
        }
    }
    
    showAnswerResult(isCorrect, answer) {
        const questionArea = document.getElementById('questionArea');
        if (!questionArea) return;
        
        const question = this.currentSession.questions[this.currentQuestionIndex];
        const feedback = document.createElement('div');
        feedback.className = `feedback-overlay ${isCorrect ? 'correct' : 'incorrect'}`;
        
        feedback.innerHTML = `
            <div class="feedback-content">
                <div class="feedback-icon">
                    ${isCorrect ? '✅' : '❌'}
                </div>
                <h4>${isCorrect ? 'Правильно!' : 'Неверно'}</h4>
                ${!isCorrect && question.correctAnswer ? `
                    <div class="explanation">
                        <strong>Правильный ответ:</strong> ${question.correctAnswer}
                    </div>
                ` : ''}
                ${question.explanation ? `
                    <div class="explanation">
                        <strong>Объяснение:</strong> ${question.explanation}
                    </div>
                ` : ''}
                ${isCorrect ? `
                    <div class="xp-earned">
                        <i class="fas fa-star"></i> +${question.points || 10} XP
                        ${this.currentSession.streak > 1 ? `
                            <span class="streak-badge">Серия x${this.currentSession.streak}</span>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
        
        questionArea.appendChild(feedback);
        
        // Удаляем через время
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, isCorrect ? 1500 : 2500);
    }
    
    completeTraining() {
        if (!this.currentSession) return;
        
        // Останавливаем таймеры
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
            this.sessionTimer = null;
        }
        if (this.questionTimer) {
            clearInterval(this.questionTimer);
            this.questionTimer = null;
        }
        
        this.currentSession.complete();
        const sessionData = this.progress.addSession(this.currentSession);
        
        // Показываем результаты
        this.showTrainingResults(sessionData);
        
        // Обновляем все компоненты
        setTimeout(() => {
            this.updateStats();
            this.loadTrainingHistory();
            this.loadRecommendations();
            this.renderAchievementsGrid();
            this.renderQuickActions();
        }, 500);
    }
    
    showTrainingResults(sessionData) {
        const trainingContent = document.getElementById('trainingContent');
        if (!trainingContent) return;
        
        const type = TRAINING_CONFIG.TRAINING_TYPES[sessionData.type] || 
                    { name: 'Тренировка', icon: '🎯', color: '#3498db' };
        
        trainingContent.innerHTML = `
            <div class="results-screen">
                <div class="results-header">
                    <div class="results-icon" style="background: ${type.color}">
                        ${type.icon}
                    </div>
                    <div>
                        <h4>Тренировка завершена!</h4>
                        <p>${type.name} • ${TRAINING_CONFIG.DIFFICULTY_LEVELS[sessionData.difficulty].name}</p>
                    </div>
                </div>
                
                <div class="results-grid">
                    <div class="result-card main">
                        <div class="result-value">${sessionData.accuracy}%</div>
                        <div class="result-label">Точность</div>
                    </div>
                    
                    <div class="result-card">
                        <div class="result-value">${sessionData.score}/${sessionData.questions}</div>
                        <div class="result-label">Результат</div>
                    </div>
                    
                    <div class="result-card">
                        <div class="result-value">${sessionData.timeSpent}с</div>
                        <div class="result-label">Время</div>
                    </div>
                    
                    <div class="result-card highlight">
                        <div class="result-value">+${sessionData.xpEarned}</div>
                        <div class="result-label">Опыт</div>
                    </div>
                </div>
                
                <div class="rating-section">
                    <div class="rating-label">Рейтинг:</div>
                    <div class="rating-stars">
                        ${'★'.repeat(Math.floor(sessionData.rating / 20)).padEnd(5, '☆')}
                    </div>
                    <div class="rating-value">${sessionData.rating}/100</div>
                </div>
                
                ${sessionData.streak > 5 ? `
                    <div class="streak-celebration">
                        <i class="fas fa-fire"></i> Отличная серия: ${sessionData.streak} правильных ответов подряд!
                    </div>
                ` : ''}
                
                <div class="results-actions">
                    <button class="btn-primary" onclick="trainingUI.startTraining('${sessionData.type}')">
                        <i class="fas fa-redo"></i> Повторить
                    </button>
                    <button class="btn-secondary" onclick="trainingUI.returnToMain()">
                        <i class="fas fa-home"></i> На главную
                    </button>
                    <button class="btn-success" onclick="trainingUI.shareResults(${JSON.stringify(sessionData).replace(/"/g, '&quot;')})">
                        <i class="fas fa-share"></i> Поделиться
                    </button>
                </div>
                
                ${sessionData.accuracy < 70 ? `
                    <div class="suggestion-box">
                        <i class="fas fa-lightbulb"></i>
                        <strong>Совет:</strong> Попробуйте тренироваться на более легкой сложности
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // ТАЙМЕРЫ И ПРОГРЕСС
    
    startSessionTimer() {
        let seconds = 0;
        this.sessionTimer = setInterval(() => {
            seconds++;
            const timerEl = document.getElementById('sessionTimer');
            if (timerEl) {
                const minutes = Math.floor(seconds / 60);
                const secs = seconds % 60;
                timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
    
    startQuestionTimer(seconds) {
        let timeLeft = seconds;
        const timerEl = document.getElementById('raceTimer');
        
        if (timerEl) {
            this.questionTimer = setInterval(() => {
                timeLeft--;
                timerEl.textContent = timeLeft;
                
                if (timeLeft <= 0) {
                    clearInterval(this.questionTimer);
                    this.questionTimer = null;
                    
                    // Автоматически отправляем неправильный ответ при таймауте
                    const questionId = this.currentSession?.questions[this.currentQuestionIndex]?.id;
                    if (questionId) {
                        this.submitAnswer(questionId, 'timeout');
                    }
                }
                
                // Меняем цвет при малом времени
                if (timeLeft <= 3) {
                    timerEl.style.color = '#e74c3c';
                    timerEl.style.animation = 'pulse 0.5s infinite';
                }
            }, 1000);
        }
    }
    
    updateProgress() {
        if (!this.currentSession) return;
        
        const progress = ((this.currentQuestionIndex) / this.currentSession.questions.length) * 100;
        const progressFill = document.getElementById('questionProgress');
        const questionNum = document.getElementById('currentQuestionNum');
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        if (questionNum) {
            questionNum.textContent = this.currentQuestionIndex + 1;
        }
    }
    
    updateScore() {
        const scoreEl = document.getElementById('currentScore');
        if (scoreEl && this.currentSession) {
            scoreEl.textContent = this.currentSession.score;
        }
    }
    
    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    
    updateStats() {
        this.updateStatsGrid();
        
        // Обновляем быстрые статистики в хедере
        const progress = this.progress.getProgress();
        
        // Обновляем XP бар
        const xpFill = document.querySelector('.xp-fill');
        if (xpFill) {
            xpFill.style.width = `${progress.progress}%`;
        }
        
        // Обновляем цифры в хедере
        const updateElement = (selector, value) => {
            const el = document.querySelector(selector);
            if (el) el.textContent = value;
        };
        
        updateElement('.level-number', progress.level);
        updateElement('.xp-text', `${progress.xp} / ${progress.xpNeeded} XP`);
        
        const statValues = document.querySelectorAll('.stat-value');
        if (statValues[0]) statValues[0].textContent = progress.streak;
        if (statValues[1]) statValues[1].textContent = `${progress.accuracy}%`;
        if (statValues[2]) statValues[2].textContent = progress.totalTime;
    }
    
    loadErrorBasedExercises() {
        const recommendationsContent = document.getElementById('recommendationsContent');
        if (!recommendationsContent) return;
        
        const commonErrors = this.generator.analyzeUserErrors();
        
        if (commonErrors.length === 0) {
            recommendationsContent.innerHTML = `
                <div class="no-recommendations">
                    <div class="no-rec-icon">🎉</div>
                    <p>Отличная работа! Пока нет рекомендаций.</p>
                    <p>Продолжайте тренироваться для поддержания уровня.</p>
                </div>
            `;
            return;
        }
        
        const recommendationsHTML = commonErrors.slice(0, 3).map(error => `
            <div class="recommendation-item">
                <div class="rec-header">
                    <span class="error-type">${error.type}</span>
                    <span class="error-count">${error.count} раз</span>
                </div>
                <p class="rec-description">${this.getErrorDescription(error.type)}</p>
                <button class="btn-sm btn-primary" onclick="trainingUI.startErrorTraining('${error.type}')">
                    <i class="fas fa-dumbbell"></i> Тренировать
                </button>
            </div>
        `).join('');
        
        recommendationsContent.innerHTML = recommendationsHTML;
    }
    
    loadRecommendations() {
        // Рекомендации на основе статистики
        const stats = this.progress.getProgress();
        const recommendations = [];
        
        if (stats.accuracy < 60) {
            recommendations.push({
                type: 'warning',
                text: 'Низкая точность. Попробуйте тренировки на легкой сложности.',
                action: "trainingUI.setDifficulty('easy')"
            });
        }
        
        if (this.progress.streak === 0) {
            recommendations.push({
                type: 'info',
                text: 'Начните серию тренировок! Тренируйтесь ежедневно для бонусов.',
                action: "trainingUI.startTraining('adaptive', 5)"
            });
        }
        
        if (this.progress.level >= 3 && stats.accuracy > 80) {
            recommendations.push({
                type: 'success',
                text: 'Отличные результаты! Попробуйте более сложные тренировки.',
                action: "trainingUI.setDifficulty('hard')"
            });
        }
        
        // Проверяем редко используемые типы тренировок
        Object.entries(this.progress.typeStats).forEach(([type, typeStat]) => {
            if (typeStat.count === 0) {
                const typeName = this.getTrainingTypeName(type);
                recommendations.push({
                    type: 'info',
                    text: `Вы еще не пробовали тренировку "${typeName}"`,
                    action: `trainingUI.startTraining('${type}', 5)`
                });
            }
        });
        
        // Показываем рекомендации если есть
        if (recommendations.length > 0) {
            const recHTML = recommendations.map(rec => `
                <div class="rec-alert ${rec.type}">
                    <p>${rec.text}</p>
                    <button class="btn-sm" onclick="${rec.action}">
                        Принять
                    </button>
                </div>
            `).join('');
            
            // Добавляем к существующим рекомендациям
            const recContent = document.getElementById('recommendationsContent');
            if (recContent) {
                recContent.insertAdjacentHTML('afterbegin', recHTML);
            }
        }
    }
    
    loadTrainingHistory() {
        const container = document.getElementById('historyContainer');
        if (!container) return;
        
        const history = this.progress.trainingHistory.slice(-10).reverse();
        
        if (history.length === 0) {
            container.innerHTML = `
                <div class="empty-history">
                    <div class="empty-icon">📝</div>
                    <p>История тренировок пуста</p>
                    <p>Начните первую тренировку!</p>
                </div>
            `;
            return;
        }
        
        const historyHTML = history.map(session => {
            const type = TRAINING_CONFIG.TRAINING_TYPES[session.type] || 
                        { icon: '🎯', color: '#3498db' };
            const difficulty = TRAINING_CONFIG.DIFFICULTY_LEVELS[session.difficulty] || 
                              { name: 'Средне', color: '#3498db' };
            
            const date = new Date(session.endTime || session.startTime);
            const formattedDate = date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <div class="history-item">
                    <div class="history-icon" style="background: ${type.color}">
                        ${type.icon}
                    </div>
                    <div class="history-content">
                        <div class="history-header">
                            <span class="history-type">${this.getTrainingTypeName(session.type)}</span>
                            <span class="history-date">${formattedDate}</span>
                        </div>
                        <div class="history-stats">
                            <span class="stat">${session.score || 0}/${session.questions || 0}</span>
                            <span class="stat">${session.accuracy || 0}%</span>
                            <span class="stat">${session.timeSpent || 0}с</span>
                            <span class="difficulty-badge" style="background: ${difficulty.color}">
                                ${difficulty.name}
                            </span>
                        </div>
                    </div>
                    <div class="history-xp">
                        <span class="xp-badge">+${session.xpEarned || 0}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = historyHTML;
    }
    
    // НАСТРОЙКИ И УПРАВЛЕНИЕ
    
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        localStorage.setItem('trainingDifficulty', difficulty);
        
        // Обновляем интерфейс
        const difficultyOptions = document.querySelectorAll('.difficulty-option');
        difficultyOptions.forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('onclick')?.includes(`'${difficulty}'`)) {
                option.classList.add('active');
            }
        });
        
        if (typeof showNotification === 'function') {
            showNotification(`Сложность установлена: ${TRAINING_CONFIG.DIFFICULTY_LEVELS[difficulty].name}`, 'info');
        }
    }
    
    changeTheme(theme) {
        this.theme = theme;
        localStorage.setItem('trainingTheme', theme);
        this.applyTheme();
    }
    
    applyTheme() {
        const container = document.getElementById('trainingContainer');
        if (!container) return;
        
        // Удаляем предыдущие темы
        container.classList.remove('theme-dark', 'theme-colorful', 'theme-minimal');
        
        if (this.theme !== 'default') {
            container.classList.add(`theme-${this.theme}`);
        }
        
        // Применяем стили темы
        const theme = TRAINING_CONFIG.THEMES[this.theme];
        if (theme && theme.bg) {
            container.style.background = theme.bg;
            container.style.color = theme.text;
        }
    }
    
    updateQuestionCount() {
        const select = document.getElementById('questionCountSelect');
        if (select) {
            this.questionCount = parseInt(select.value);
            localStorage.setItem('trainingQuestionCount', this.questionCount);
        }
    }
    
    // НОВЫЕ ФУНКЦИИ (ДОБАВЛЕНО)
    
    startDailyChallenge() {
        const today = new Date().toDateString();
        const lastChallenge = localStorage.getItem('lastDailyChallenge');
        
        if (lastChallenge === today) {
            if (typeof showNotification === 'function') {
                showNotification('Вы уже выполнили задание дня!', 'info');
            }
            return;
        }
        
        // Специальная тренировка дня
        const challenges = [
            { type: 'quiz', count: 10, difficulty: 'medium', name: 'Викторина дня' },
            { type: 'puzzle', count: 8, difficulty: 'medium', name: 'Головоломки дня' },
            { type: 'game', count: 5, difficulty: 'easy', name: 'Игра дня' },
            { type: 'visual', count: 7, difficulty: 'medium', name: 'Визуальный тест дня' }
        ];
        
        const challenge = challenges[Math.floor(Math.random() * challenges.length)];
        
        if (confirm(`Задание дня: ${challenge.name}\nВопросов: ${challenge.count}\nНаграда: 50 XP\nНачать?`)) {
            localStorage.setItem('lastDailyChallenge', today);
            this.startTraining(challenge.type, challenge.count);
        }
    }
    
    exportData() {
        const data = {
            progress: this.progress,
            exportDate: new Date().toISOString(),
            version: '2.1.0'
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `training-data-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (typeof showNotification === 'function') {
            showNotification('Данные экспортированы!', 'success');
        }
    }
    
    resetProgress() {
        if (confirm('Вы уверены, что хотите сбросить весь прогресс? Это действие нельзя отменить.')) {
            localStorage.removeItem('trainingProgress');
            this.progress = new TrainingProgress();
            this.initialize();
            
            if (typeof showNotification === 'function') {
                showNotification('Прогресс сброшен!', 'success');
            }
        }
    }
    
    showLeaderboard() {
        // В реальном приложении здесь была бы загрузка с сервера
        const leaderboardData = [
            { name: 'Алексей', level: 15, xp: 2450, accuracy: 94 },
            { name: 'Мария', level: 12, xp: 1890, accuracy: 91 },
            { name: 'Иван', level: 10, xp: 1560, accuracy: 88 },
            { name: 'Вы', level: this.progress.level, xp: this.progress.totalXP, accuracy: this.progress.getAccuracy() },
            { name: 'Ольга', level: 8, xp: 1200, accuracy: 85 }
        ];
        
        const modalContent = `
            <div class="leaderboard-modal">
                <h3><i class="fas fa-crown"></i> Таблица лидеров</h3>
                <div class="leaderboard-table">
                    <div class="leaderboard-header">
                        <div class="rank">#</div>
                        <div class="name">Имя</div>
                        <div class="level">Уровень</div>
                        <div class="xp">XP</div>
                        <div class="accuracy">Точность</div>
                    </div>
                    ${leaderboardData.map((player, index) => `
                        <div class="leaderboard-row ${player.name === 'Вы' ? 'current-user' : ''}">
                            <div class="rank">${index + 1}</div>
                            <div class="name">${player.name}</div>
                            <div class="level">${player.level}</div>
                            <div class="xp">${player.xp}</div>
                            <div class="accuracy">${player.accuracy}%</div>
                        </div>
                    `).join('')}
                </div>
                <p class="leaderboard-note">Таблица обновляется ежедневно</p>
            </div>
        `;
        
        this.showModal(modalContent, 'Таблица лидеров');
    }
    
    showHelp() {
        const helpContent = `
            <div class="help-modal">
                <h3><i class="fas fa-question-circle"></i> Помощь по тренажерам</h3>
                
                <div class="help-section">
                    <h4>🎮 Типы тренировок:</h4>
                    <ul>
                        <li><strong>Адаптивная</strong> - вопросы на основе ваших ошибок</li>
                        <li><strong>Игровая</strong> - тесты на память и реакцию</li>
                        <li><strong>Визуальная</strong> - задачи с фигурами и паттернами</li>
                        <li><strong>Викторина</strong> - проверка общих знаний</li>
                        <li><strong>Головоломки</strong> - логические задачи и загадки</li>
                        <li><strong>Гонка</strong> - вопросы на скорость</li>
                    </ul>
                </div>
                
                <div class="help-section">
                    <h4>🏆 Система прогресса:</h4>
                    <ul>
                        <li><strong>XP</strong> - получайте за правильные ответы</li>
                        <li><strong>Уровни</strong> - повышайте уровень, набирая XP</li>
                        <li><strong>Достижения</strong> - выполняйте условия для получения</li>
                        <li><strong>Серия</strong> - тренируйтесь ежедневно для бонусов</li>
                    </ul>
                </div>
                
                <div class="help-section">
                    <h4>⚡ Горячие клавиши:</h4>
                    <ul>
                        <li><strong>Цифры 1-4</strong> - выбор варианта ответа</li>
                        <li><strong>Ctrl+Enter</strong> - быстрый старт тренировки</li>
                        <li><strong>Пробел</strong> - пропуск вопроса</li>
                        <li><strong>Enter</strong> - отправка текстового ответа</li>
                    </ul>
                </div>
                
                <div class="help-tip">
                    <i class="fas fa-lightbulb"></i> <strong>Совет:</strong> Регулярные короткие тренировки эффективнее редких длинных!
                </div>
            </div>
        `;
        
        this.showModal(helpContent, 'Помощь');
    }
    
    showModal(content, title = '') {
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'training-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                border-radius: 12px;
                padding: 25px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                animation: slideIn 0.3s ease;
            ">
                ${title ? `<h3 style="margin-top: 0;">${title}</h3>` : ''}
                ${content}
                <div style="text-align: center; margin-top: 20px;">
                    <button class="btn-primary" onclick="this.closest('.training-modal').remove()">
                        Закрыть
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Закрытие по клику на фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    
    getTrainingTypeName(typeId) {
        const type = TRAINING_CONFIG.TRAINING_TYPES[typeId];
        return type ? type.name : typeId;
    }
    
    getErrorDescription(type) {
        const descriptions = {
            'math': 'Ошибки в вычислениях и арифметике',
            'visual': 'Проблемы с визуальным восприятием',
            'logic': 'Проблемы с логическим мышлением',
            'game': 'Ошибки в игровых тренировках',
            'quiz': 'Неверные факты и знания',
            'adaptive': 'Повторяющиеся ошибки',
            'puzzle': 'Сложности с головоломками',
            'race': 'Проблемы со скоростью реакции'
        };
        return descriptions[type] || 'Повторяющиеся ошибки';
    }
    
    startErrorTraining(errorType) {
        // Запускаем адаптивную тренировку с фокусом на ошибках
        this.startTraining('adaptive', 8);
        if (typeof showNotification === 'function') {
            showNotification(`Тренировка с фокусом на: ${errorType}`, 'info');
        }
    }
    
    endTraining() {
        if (this.currentSession && !this.currentSession.completed) {
            if (confirm('Завершить тренировку? Прогресс будет сохранен.')) {
                this.currentSession.complete();
                this.progress.addSession(this.currentSession);
                this.returnToMain();
            }
        } else {
            this.returnToMain();
        }
    }
    
    returnToMain() {
        this.currentSession = null;
        this.currentQuestionIndex = 0;
        
        // Очищаем таймеры
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
            this.sessionTimer = null;
        }
        if (this.questionTimer) {
            clearInterval(this.questionTimer);
            this.questionTimer = null;
        }
        
        // Возвращаем основной интерфейс
        this.renderTrainingTab();
    }
    
    clearHistory() {
        if (confirm('Очистить всю историю тренировок? Это действие нельзя отменить.')) {
            this.progress.trainingHistory = [];
            this.progress.save();
            this.loadTrainingHistory();
            if (typeof showNotification === 'function') {
                showNotification('История тренировок очищена', 'success');
            }
        }
    }
    
    toggleHistoryView() {
        // Переключение между табличным и графическим видом истории
        const container = document.getElementById('historyContainer');
        if (!container) return;
        
        if (container.classList.contains('chart-view')) {
            container.classList.remove('chart-view');
            this.loadTrainingHistory();
        } else {
            container.classList.add('chart-view');
            this.showHistoryChart();
        }
    }
    
    showHistoryChart() {
        const container = document.getElementById('historyContainer');
        if (!container) return;
        
        const history = this.progress.trainingHistory.slice(-7); // Последние 7 дней
        
        if (history.length < 2) {
            container.innerHTML = `
                <div class="empty-chart">
                    <p>Недостаточно данных для графика</p>
                    <p>Пройдите несколько тренировок</p>
                </div>
            `;
            return;
        }
        
        const dates = history.map(s => {
            const date = new Date(s.endTime || s.startTime);
            return date.getDate() + '.' + (date.getMonth() + 1);
        });
        
        const scores = history.map(s => s.accuracy || 0);
        
        // Простой SVG график
        const maxScore = Math.max(...scores, 100);
        const height = 150;
        const width = 300;
        
        const points = scores.map((score, i) => {
            const x = (i / (scores.length - 1 || 1)) * width;
            const y = height - (score / maxScore) * height;
            return `${x},${y}`;
        }).join(' ');
        
        container.innerHTML = `
            <div class="history-chart">
                <h5>Прогресс за неделю</h5>
                <svg width="100%" height="160" viewBox="0 0 ${width} ${height + 20}">
                    <!-- Сетка -->
                    <line x1="0" y1="${height}" x2="${width}" y2="${height}" stroke="#e0e0e0" stroke-width="1"/>
                    
                    <!-- График -->
                    <polyline points="${points}" fill="none" stroke="#3498db" stroke-width="2"/>
                    
                    <!-- Точки -->
                    ${scores.map((score, i) => {
                        const x = (i / (scores.length - 1 || 1)) * width;
                        const y = height - (score / maxScore) * height;
                        return `<circle cx="${x}" cy="${y}" r="3" fill="#3498db"/>`;
                    }).join('')}
                    
                    <!-- Подписи -->
                    ${dates.map((date, i) => {
                        const x = (i / (dates.length - 1 || 1)) * width;
                        return `<text x="${x}" y="${height + 15}" text-anchor="middle" font-size="10">${date}</text>`;
                    }).join('')}
                </svg>
                <div class="chart-legend">
                    <span class="legend-item"><span class="legend-color" style="background: #3498db"></span> Точность (%)</span>
                </div>
            </div>
        `;
    }
    
    showAchievementDetails(achievementId) {
        const achievement = TRAINING_CONFIG.ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!achievement) return;
        
        const earned = this.progress.achievements.find(a => a.id === achievementId);
        
        const modalContent = `
            <div class="achievement-modal">
                <div class="achievement-icon-large" style="background: ${achievement.color}">
                    ${achievement.icon}
                </div>
                <h3>${achievement.name}</h3>
                <p>${achievement.description}</p>
                
                <div class="achievement-details">
                    <div class="detail-item">
                        <span class="detail-label">Награда:</span>
                        <span class="detail-value">${achievement.xp} XP</span>
                    </div>
                    
                    ${earned ? `
                        <div class="detail-item">
                            <span class="detail-label">Получено:</span>
                            <span class="detail-value">${new Date(earned.earnedAt).toLocaleDateString()}</span>
                        </div>
                    ` : `
                        <div class="detail-item">
                            <span class="detail-label">Статус:</span>
                            <span class="detail-value">Не получено</span>
                        </div>
                    `}
                </div>
                
                ${!earned ? `
                    <div class="achievement-progress">
                        <p><em>Как получить:</em></p>
                        <p>${this.getAchievementHint(achievementId)}</p>
                    </div>
                ` : ''}
            </div>
        `;
        
        this.showModal(modalContent, 'Достижение');
    }
    
    getAchievementHint(achievementId) {
        const hints = {
            'first_step': 'Выполните любую тренировку',
            'perfect_10': 'Дайте 10 правильных ответов подряд в одной тренировке',
            'speed_demon': 'Отвечайте на вопросы быстрее 3 секунд',
            'streak_5': 'Тренируйтесь 5 дней подряд',
            'level_5': 'Повысьте уровень до 5',
            'error_master': 'Исправьте 50 ошибок в адаптивных тренировках',
            'quiz_champ': 'Пройдите 10 викторин',
            'visual_genius': 'Решите 20 визуальных задач',
            'game_guru': 'Выиграйте 15 игровых тренировок',
            'puzzle_master': 'Решите 30 головоломок',
            'marathon': 'Пройдите 50 тренировок всего',
            'perfectionist': 'Получите 100% точность в сложной тренировке'
        };
        
        return hints[achievementId] || 'Продолжайте тренироваться!';
    }
    
    shareResults(sessionData) {
        const type = TRAINING_CONFIG.TRAINING_TYPES[sessionData.type] || { name: 'Тренировка' };
        const text = `🎮 Я только что завершил(а) тренировку "${type.name}" с результатом ${sessionData.accuracy}% точности! Получил(а) ${sessionData.xpEarned} XP. Попробуйте и вы!`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Мой результат тренировки',
                text: text,
                url: window.location.href
            }).catch(() => {
                // Fallback если share отменен
                navigator.clipboard.writeText(text).then(() => {
                    if (typeof showNotification === 'function') {
                        showNotification('Результат скопирован в буфер обмена!', 'success');
                    }
                });
            });
        } else {
            // Fallback для копирования в буфер обмена
            navigator.clipboard.writeText(text).then(() => {
                if (typeof showNotification === 'function') {
                    showNotification('Результат скопирован в буфер обмена!', 'success');
                }
            });
        }
    }
    
    setupEventListeners() {
        // Горячие клавиши
        document.addEventListener('keydown', (e) => {
            // Ctrl+Enter для быстрого старта тренировки
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.startRandomTraining();
            }
            
            // Цифры 1-4 для выбора вариантов ответа
            if (this.currentSession && e.key >= '1' && e.key <= '4') {
                const index = parseInt(e.key) - 1;
                const options = document.querySelectorAll('.option-btn[data-index]');
                if (options[index]) {
                    options[index].click();
                }
            }
            
            // Пробел для пропуска вопроса
            if (e.key === ' ' && this.currentSession) {
                e.preventDefault();
                this.skipQuestion();
            }
            
            // Escape для возврата в меню
            if (e.key === 'Escape' && this.currentSession) {
                e.preventDefault();
                this.endTraining();
            }
        });
        
        // Автосохранение при закрытии
        window.addEventListener('beforeunload', () => {
            if (this.currentSession && !this.currentSession.completed) {
                this.currentSession.complete();
                this.progress.addSession(this.currentSession);
            }
        });
        
        // Периодическое автосохранение
        setInterval(() => {
            if (this.currentSession && !this.currentSession.completed) {
                this.progress.save();
            }
        }, 30000); // Каждые 30 секунд
    }
    
    showWelcomeTour() {
        if (this.progress.stats.totalSessions > 0) return;
        
        const tourContent = `
            <div class="welcome-tour">
                <h2>🎮 Добро пожаловать в тренажеры!</h2>
                <p>Эта система поможет вам улучшить знания через увлекательные тренировки:</p>
                
                <div class="tour-features">
                    <div class="feature">
                        <div class="feature-icon">🔄</div>
                        <div class="feature-text">
                            <strong>Адаптивные тренировки</strong><br>
                            На основе ваших ошибок
                        </div>
                    </div>
                    
                    <div class="feature">
                        <div class="feature-icon">🎮</div>
                        <div class="feature-text">
                            <strong>Игровые режимы</strong><br>
                            Гонки, память, головоломки
                        </div>
                    </div>
                    
                    <div class="feature">
                        <div class="feature-icon">🏆</div>
                        <div class="feature-text">
                            <strong>Система достижений</strong><br>
                            Уровни, награды, рейтинги
                        </div>
                    </div>
                    
                    <div class="feature">
                        <div class="feature-icon">📊</div>
                        <div class="feature-text">
                            <strong>Детальная статистика</strong><br>
                            Отслеживайте прогресс
                        </div>
                    </div>
                </div>
                
                <p>Начните с быстрой тренировки или выберите специфический тип!</p>
                
                <div class="tour-actions">
                    <button class="btn btn-primary" onclick="trainingUI.startTraining('adaptive', 5)">
                        <i class="fas fa-play"></i> Быстрый старт (5 вопросов)
                    </button>
                    <button class="btn btn-outline" onclick="this.closest('.training-modal').remove()">
                        Позже
                    </button>
                </div>
            </div>
        `;
        
        this.showModal(tourContent, 'Добро пожаловать!');
    }
    
    skipQuestion() {
        if (!this.currentSession) return;
        
        this.currentQuestionIndex++;
        this.showNextQuestion();
        if (typeof showNotification === 'function') {
            showNotification('Вопрос пропущен', 'warning');
        }
    }
    
    // СТИЛИ
    addStyles() {
        const existingStyle = document.querySelector('#training-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        const style = document.createElement('style');
        style.id = 'training-styles';
        style.textContent = `
            .training-container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 20px;
                min-height: 100vh;
                background: #f8f9fa;
                color: #2c3e50;
                transition: all 0.3s ease;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            /* Хедер */
            .training-header {
                background: white;
                border-radius: 15px;
                padding: 25px;
                margin-bottom: 25px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            
            .header-main h1 {
                margin: 0 0 10px 0;
                color: #2c3e50;
                font-size: 2.2em;
            }
            
            .subtitle {
                color: #7f8c8d;
                margin-bottom: 20px;
                font-size: 1.1em;
            }
            
            .progress-section {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 30px;
                flex-wrap: wrap;
            }
            
            .level-display {
                display: flex;
                align-items: center;
                gap: 20px;
                flex: 1;
                min-width: 300px;
            }
            
            .level-badge {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                width: 80px;
                height: 80px;
                border-radius: 50%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }
            
            .level-number {
                font-size: 1.8em;
                font-weight: bold;
                line-height: 1;
            }
            
            .level-text {
                font-size: 0.8em;
                opacity: 0.9;
            }
            
            .xp-display {
                flex: 1;
            }
            
            .xp-bar {
                height: 12px;
                background: #e9ecef;
                border-radius: 6px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            
            .xp-fill {
                height: 100%;
                background: linear-gradient(90deg, #4CAF50, #8BC34A);
                border-radius: 6px;
                transition: width 0.5s ease;
            }
            
            .xp-text {
                font-size: 0.9em;
                color: #7f8c8d;
                text-align: center;
            }
            
            .quick-stats {
                display: flex;
                gap: 20px;
            }
            
            .stat-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px 15px;
                background: #f8f9fa;
                border-radius: 10px;
                min-width: 100px;
            }
            
            .stat-icon {
                font-size: 1.5em;
            }
            
            .stat-info {
                display: flex;
                flex-direction: column;
            }
            
            .stat-value {
                font-weight: bold;
                font-size: 1.2em;
                color: #2c3e50;
            }
            
            .stat-label {
                font-size: 0.8em;
                color: #7f8c8d;
            }
            
            /* Быстрый старт */
            .quick-start-section {
                background: white;
                border-radius: 15px;
                padding: 25px;
                margin-bottom: 25px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            
            .quick-start-section h3 {
                margin: 0 0 20px 0;
                color: #2c3e50;
            }
            
            .quick-actions-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 15px;
            }
            
            .quick-action {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s;
                border: 2px solid transparent;
            }
            
            .quick-action:hover {
                transform: translateY(-3px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                border-color: #3498db;
            }
            
            .action-icon {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5em;
                color: white;
            }
            
            .action-title {
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 5px;
            }
            
            .action-stats {
                font-size: 0.8em;
                color: #7f8c8d;
            }
            
            /* Основной контент */
            .main-content-grid {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 25px;
                margin-bottom: 25px;
            }
            
            @media (max-width: 992px) {
                .main-content-grid {
                    grid-template-columns: 1fr;
                }
            }
            
            .card {
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                margin-bottom: 25px;
            }
            
            .card-header {
                padding: 20px;
                border-bottom: 1px solid #e9ecef;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .card-header h4 {
                margin: 0;
                color: #2c3e50;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .card-body {
                padding: 20px;
            }
            
            /* Статистика */
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
            }
            
            .stat-card {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            
            .stat-card .stat-icon {
                font-size: 1.2em;
                opacity: 0.8;
            }
            
            .stat-content {
                flex: 1;
            }
            
            .stat-content .stat-value {
                font-size: 1.1em;
                margin-bottom: 2px;
            }
            
            .stat-content .stat-label {
                font-size: 0.75em;
            }
            
            /* ДОСТИЖЕНИЯ - КВАДРАТИКИ */
            .achievements-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 10px;
            }
            
            @media (max-width: 768px) {
                .achievements-grid {
                    grid-template-columns: repeat(3, 1fr);
                }
            }
            
            .achievement-square {
                position: relative;
                aspect-ratio: 1;
                background: #f8f9fa;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s;
                border: 2px solid transparent;
            }
            
            .achievement-square.earned {
                border-color: #3498db;
                background: white;
            }
            
            .achievement-square.locked {
                opacity: 0.7;
                background: #e9ecef;
            }
            
            .achievement-square:hover {
                transform: scale(1.05);
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            
            .achievement-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2em;
                color: white;
            }
            
            .locked-overlay {
                position: absolute;
                top: 5px;
                right: 5px;
                font-size: 0.8em;
                opacity: 0.7;
            }
            
            .new-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #e74c3c;
                color: white;
                font-size: 0.6em;
                padding: 2px 6px;
                border-radius: 10px;
                animation: pulse 1s infinite;
            }
            
            /* История */
            .history-item {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px;
                border-bottom: 1px solid #e9ecef;
                transition: background 0.3s;
            }
            
            .history-item:last-child {
                border-bottom: none;
            }
            
            .history-item:hover {
                background: #f8f9fa;
            }
            
            .history-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 1.2em;
            }
            
            .history-content {
                flex: 1;
            }
            
            .history-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }
            
            .history-type {
                font-weight: bold;
                color: #2c3e50;
            }
            
            .history-date {
                font-size: 0.8em;
                color: #7f8c8d;
            }
            
            .history-stats {
                display: flex;
                gap: 10px;
                font-size: 0.8em;
            }
            
            .history-stats .stat {
                background: #f1f1f1;
                padding: 2px 8px;
                border-radius: 4px;
            }
            
            .difficulty-badge {
                font-size: 0.7em;
                padding: 2px 6px;
                border-radius: 4px;
                color: white;
            }
            
            .xp-badge {
                background: #27ae60;
                color: white;
                padding: 3px 8px;
                border-radius: 10px;
                font-size: 0.8em;
                font-weight: bold;
            }
            
            /* Рекомендации */
            .recommendation-item {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 10px;
            }
            
            .rec-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            
            .error-type {
                font-weight: bold;
                color: #2c3e50;
            }
            
            .error-count {
                font-size: 0.8em;
                background: #e74c3c;
                color: white;
                padding: 2px 6px;
                border-radius: 10px;
            }
            
            .rec-description {
                font-size: 0.9em;
                color: #7f8c8d;
                margin-bottom: 10px;
            }
            
            /* Настройки */
            .settings-group {
                margin-bottom: 15px;
            }
            
            .settings-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: #2c3e50;
            }
            
            .difficulty-selector {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            }
            
            .difficulty-option {
                padding: 8px 12px;
                border: 2px solid #e9ecef;
                background: white;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s;
                color: var(--color);
                font-weight: 500;
            }
            
            .difficulty-option.active {
                background: var(--color);
                color: white;
                border-color: var(--color);
            }
            
            .form-select {
                width: 100%;
                padding: 8px 12px;
                border: 2px solid #e9ecef;
                border-radius: 6px;
                background: white;
                color: #2c3e50;
                font-size: 14px;
            }
            
            /* Активная тренировка */
            .session-interface {
                animation: fadeIn 0.5s ease;
            }
            
            .session-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .session-title {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .session-icon {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5em;
                color: white;
            }
            
            .difficulty-tag {
                font-size: 0.8em;
                padding: 3px 8px;
                border-radius: 10px;
                color: white;
            }
            
            .session-timer {
                font-family: monospace;
                font-size: 1.2em;
                background: #2c3e50;
                color: white;
                padding: 5px 15px;
                border-radius: 20px;
            }
            
            .progress-section {
                margin-bottom: 20px;
            }
            
            .progress-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 0.9em;
                color: #7f8c8d;
            }
            
            .progress-info .score {
                font-weight: bold;
                color: #2c3e50;
            }
            
            .question-card {
                background: white;
                border-radius: 12px;
                padding: 25px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                animation: slideIn 0.3s ease;
            }
            
            .question-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid #e9ecef;
            }
            
            .points-badge {
                background: #f39c12;
                color: white;
                padding: 3px 10px;
                border-radius: 10px;
                font-size: 0.8em;
                font-weight: bold;
            }
            
            .question-text {
                font-size: 1.1em;
                line-height: 1.5;
                margin-bottom: 25px;
                color: #2c3e50;
            }
            
            .question-options {
                display: grid;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .option-btn {
                padding: 15px;
                border: 2px solid #e9ecef;
                background: white;
                border-radius: 10px;
                cursor: pointer;
                text-align: left;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .option-btn:hover {
                border-color: #3498db;
                background: #f0f7ff;
                transform: translateX(5px);
            }
            
            .option-letter {
                width: 30px;
                height: 30px;
                background: #f8f9fa;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: #7f8c8d;
            }
            
            .option-text {
                flex: 1;
            }
            
            /* Результаты */
            .results-screen {
                text-align: center;
                padding: 20px;
            }
            
            .results-header {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .results-icon {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2em;
                color: white;
            }
            
            .results-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin-bottom: 30px;
            }
            
            .result-card {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 10px;
                transition: all 0.3s;
            }
            
            .result-card.main {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
            }
            
            .result-card.highlight {
                background: linear-gradient(135deg, #4CAF50, #8BC34A);
                color: white;
            }
            
            .result-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            }
            
            .result-value {
                font-size: 2em;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .result-label {
                font-size: 0.9em;
                opacity: 0.9;
            }
            
            /* Панель быстрого доступа */
            .quick-access-bar {
                display: flex;
                gap: 10px;
                margin-top: 20px;
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .quick-access-btn {
                padding: 10px 20px;
                background: #3498db;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
            }
            
            .quick-access-btn:hover {
                background: #2980b9;
                transform: translateY(-2px);
            }
            
            /* Кнопки */
            .btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            
            .btn-primary {
                background: #3498db;
                color: white;
            }
            
            .btn-primary:hover {
                background: #2980b9;
            }
            
            .btn-secondary {
                background: #7f8c8d;
                color: white;
            }
            
            .btn-secondary:hover {
                background: #5d6c6d;
            }
            
            .btn-success {
                background: #27ae60;
                color: white;
            }
            
            .btn-success:hover {
                background: #219653;
            }
            
            .btn-danger {
                background: #e74c3c;
                color: white;
            }
            
            .btn-danger:hover {
                background: #c0392b;
            }
            
            .btn-warning {
                background: #f39c12;
                color: white;
            }
            
            .btn-warning:hover {
                background: #d68910;
            }
            
            .btn-sm {
                padding: 6px 12px;
                font-size: 12px;
            }
            
            /* Анимации */
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(-20px); }
                to { opacity: 1; transform: translateX(0); }
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            /* Темы */
            .theme-dark .card,
            .theme-dark .quick-start-section,
            .theme-dark .training-header {
                background: #2c3e50;
                color: #e6e6e6;
            }
            
            .theme-dark .stat-item,
            .theme-dark .quick-action,
            .theme-dark .recommendation-item,
            .theme-dark .result-card:not(.main):not(.highlight) {
                background: #34495e;
                color: #e6e6e6;
            }
            
            .theme-colorful {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .theme-colorful .card,
            .theme-colorful .quick-start-section,
            .theme-colorful .training-header {
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(10px);
            }
            
            .theme-minimal .card,
            .theme-minimal .quick-start-section,
            .theme-minimal .training-header {
                background: white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                border: 1px solid #e9ecef;
            }
            
            /* Адаптивность */
            @media (max-width: 768px) {
                .training-header {
                    padding: 15px;
                }
                
                .level-display {
                    min-width: 100%;
                    margin-bottom: 20px;
                }
                
                .quick-stats {
                    width: 100%;
                    justify-content: space-between;
                }
                
                .stat-item {
                    flex: 1;
                    min-width: 0;
                    padding: 10px;
                }
                
                .quick-actions-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .stats-grid {
                    grid-template-columns: 1fr;
                }
                
                .achievements-grid {
                    grid-template-columns: repeat(3, 1fr);
                }
                
                .results-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .quick-access-bar {
                    flex-direction: column;
                }
                
                .quick-access-btn {
                    width: 100%;
                    justify-content: center;
                }
            }
            
            @media (max-width: 480px) {
                .quick-actions-grid {
                    grid-template-columns: 1fr;
                }
                
                .achievements-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .results-grid {
                    grid-template-columns: 1fr;
                }
            }
            
            /* Модальные окна */
            .leaderboard-modal,
            .help-modal,
            .achievement-modal {
                max-width: 100%;
            }
            
            .leaderboard-table {
                width: 100%;
                margin: 20px 0;
                border-collapse: collapse;
            }
            
            .leaderboard-header,
            .leaderboard-row {
                display: grid;
                grid-template-columns: 50px 1fr 80px 80px 80px;
                gap: 10px;
                padding: 10px;
                border-bottom: 1px solid #eee;
            }
            
            .leaderboard-header {
                font-weight: bold;
                background: #f8f9fa;
            }
            
            .leaderboard-row.current-user {
                background: #e3f2fd;
                font-weight: bold;
            }
            
            .help-section {
                margin-bottom: 20px;
            }
            
            .help-section h4 {
                margin-bottom: 10px;
                color: #2c3e50;
            }
            
            .help-section ul {
                padding-left: 20px;
                color: #555;
            }
            
            .help-section li {
                margin-bottom: 5px;
            }
            
            .help-tip {
                background: #e3f2fd;
                padding: 15px;
                border-radius: 8px;
                margin-top: 20px;
                border-left: 4px solid #2196f3;
            }
            
            /* Обратная связь */
            .feedback-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255,255,255,0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
                z-index: 10;
                border-radius: 12px;
            }
            
            .feedback-overlay.correct {
                background: rgba(46, 204, 113, 0.95);
            }
            
            .feedback-overlay.incorrect {
                background: rgba(231, 76, 60, 0.95);
            }
            
            .feedback-content {
                text-align: center;
                padding: 30px;
                color: white;
            }
            
            .feedback-icon {
                font-size: 3em;
                margin-bottom: 20px;
            }
            
            .explanation {
                margin: 15px 0;
                padding: 10px;
                background: rgba(255,255,255,0.2);
                border-radius: 8px;
                text-align: left;
            }
            
            .xp-earned {
                font-size: 1.2em;
                margin-top: 15px;
                font-weight: bold;
            }
            
            .streak-badge {
                display: inline-block;
                background: rgba(0,0,0,0.3);
                padding: 3px 8px;
                border-radius: 10px;
                margin-left: 10px;
                font-size: 0.8em;
            }
        `;
        document.head.appendChild(style);
    }
}

// ============================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ
// ============================

let trainingUI = null;

function initializeTrainingModule() {
    if (!trainingUI) {
        trainingUI = new EnhancedTrainingUI();
    }
    return trainingUI;
}

function showTrainingTab() {
    if (!trainingUI) {
        trainingUI = initializeTrainingModule();
    }
    
    // Предполагаем, что функция showTab существует
    if (typeof showTab === 'function') {
        showTab('training');
    }
    
    setTimeout(() => {
        trainingUI.initialize();
    }, 100);
}

function integrateWithMainSystem() {
    // Добавляем кнопку в навигацию
    const tabsContainer = document.querySelector('.tabs');
    if (tabsContainer && !document.querySelector('.tab-btn[onclick*="showTrainingTab"]')) {
        const trainingTabBtn = document.createElement('button');
        trainingTabBtn.className = 'tab-btn';
        trainingTabBtn.innerHTML = '🎮 Тренажеры';
        trainingTabBtn.onclick = showTrainingTab;
        
        // Вставляем перед последней кнопкой (обратная связь)
        const lastBtn = tabsContainer.querySelector('.tab-btn:last-child');
        if (lastBtn) {
            tabsContainer.insertBefore(trainingTabBtn, lastBtn);
        } else {
            tabsContainer.appendChild(trainingTabBtn);
        }
    }
    
    // Синхронизация данных
    const originalSaveResults = window.saveResults;
    if (originalSaveResults) {
        window.saveResults = function() {
            const result = originalSaveResults.apply(this, arguments);
            if (trainingUI) {
                setTimeout(() => trainingUI.loadErrorBasedExercises(), 1000);
            }
            return result;
        };
    }
}

// Вспомогательные функции для уведомлений
function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, ${achievement.color}, #ffffff);
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInRight 0.5s ease, fadeOut 0.5s ease 4.5s forwards;
        max-width: 300px;
        border: 3px solid ${achievement.color};
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
            <div style="font-size: 2em; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${achievement.icon}</div>
            <div>
                <h4 style="margin: 0 0 5px 0; color: #2c3e50;">🏆 Новое достижение!</h4>
                <p style="margin: 0; font-weight: bold; color: #2c3e50;">${achievement.name}</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #7f8c8d;">+${achievement.xp} опыта • ${achievement.description}</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Звуковое оповещение (опционально)
    if (window.Audio) {
        try {
            // Создаем простой звук достижения
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // До
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // Ми
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // Соль
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            // Игнорируем ошибки аудио
        }
    }
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Функция уведомления (запасная если нет в основной системе)
if (typeof showNotification !== 'function') {
    window.showNotification = function(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 9999;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    };
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        integrateWithMainSystem();
        
        // Автозапуск при определенных условиях
        const params = new URLSearchParams(window.location.search);
        if (params.get('training') === 'start') {
            showTrainingTab();
        }
        
        // Проверяем, не пора ли показать напоминание о тренировке
        const lastVisit = localStorage.getItem('lastTrainingVisit');
        const today = new Date().toDateString();
        
        if (lastVisit !== today) {
            localStorage.setItem('lastTrainingVisit', today);
            
            // Если пользователь не тренировался сегодня
            const progress = TrainingProgress.load();
            if (progress.lastTrainingDate) {
                const lastTraining = new Date(progress.lastTrainingDate).toDateString();
                if (lastTraining !== today && progress.streak > 0) {
                    // Показываем напоминание о поддержании серии
                    setTimeout(() => {
                        if (typeof showNotification === 'function') {
                            showNotification('🔥 Не забудьте поддержать свою серию тренировок!', 'info');
                        }
                    }, 5000);
                }
            }
        }
    }, 1000);
});

// Экспорт
window.trainingUI = null;
window.initializeTrainingModule = initializeTrainingModule;
window.showTrainingTab = showTrainingTab;
window.TrainingSession = TrainingSession;
window.TrainingProgress = TrainingProgress;
window.AdvancedExerciseGenerator = AdvancedExerciseGenerator;

console.log('Enhanced Training Module v2.1.0 loaded successfully!');

// Функция для отладки
function debugTrainingQuestions() {
    if (!trainingUI) {
        console.error('Training UI not initialized');
        return;
    }
    
    console.group('🎮 Training Debug Information');
    
    // Проверяем генератор
    const generator = trainingUI.generator;
    console.log('Generator pools:');
    console.log('- Math problems:', generator.mathProblems.length);
    console.log('- Visual problems:', generator.visualProblems.length);
    console.log('- Game problems:', generator.gameProblems.length);
    console.log('- Puzzle problems:', generator.puzzleProblems.length);
    console.log('- Quiz problems:', generator.quizProblems.length);
    
    // Генерируем тестовые вопросы
    console.log('\nTest question generation:');
    const testTypes = ['adaptive', 'game', 'visual', 'quiz', 'puzzle', 'race'];
    
    testTypes.forEach(type => {
        console.log(`\n--- ${type.toUpperCase()} ---`);
        const questions = generator.generateQuestions(type, 2, 'medium');
        questions.forEach((q, i) => {
            console.log(`Q${i+1}:`, {
                type: q.type,
                hasText: !!q.text,
                textLength: q.text?.length || 0,
                hasOptions: !!q.options,
                optionsCount: q.options?.length || 0,
                hasCorrectAnswer: !!q.correctAnswer
            });
        });
    });
    
    console.groupEnd();
}

// Функция для тестирования системы
function testTrainingSystem() {
    console.group('🧪 Testing Training System');
    
    // Создаем тестовую сессию
    const testSession = new TrainingSession('quiz', 'medium');
    
    // Добавляем тестовые вопросы
    testSession.addQuestion({
        type: 'multiple_choice',
        text: 'Тестовый вопрос 1',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A'
    });
    
    testSession.addQuestion({
        type: 'true_false',
        text: 'Тестовый вопрос 2',
        options: ['true', 'false'],
        correctAnswer: true
    });
    
    // Отвечаем на вопросы
    console.log('Submitting answers...');
    testSession.submitAnswer(testSession.questions[0].id, 'A', 2);
    testSession.submitAnswer(testSession.questions[1].id, 'true', 1);
    
    // Завершаем сессию
    testSession.complete();
    console.log('Session completed:', testSession.toJSON());
    
    // Тестируем прогресс
    const testProgress = new TrainingProgress();
    testProgress.addSession(testSession);
    console.log('Progress after test:', testProgress.getProgress());
    
    console.groupEnd();
}

// Экспортируем для отладки
window.debugTrainingQuestions = debugTrainingQuestions;
window.testTrainingSystem = testTrainingSystem;

console.log('Для отладки выполните: debugTrainingQuestions() или testTrainingSystem()');
console.log('Для начала тренировки выполните: showTrainingTab()');
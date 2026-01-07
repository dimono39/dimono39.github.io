// ============================
// ФУНКЦИИ ДЛЯ МОБИЛЬНОЙ СТАТИСТИКИ
// ============================

// Инициализация мобильной панели
function initMobileDashboard() {
    loadStudentsForMobile();
    updateMobileStatistics();
}

// Загрузка списка учеников для выбора
function loadStudentsForMobile() {
    const selector = document.getElementById('studentSelector');
    if (!selector) return;
    
    selector.innerHTML = '<option value="">-- Выберите ученика --</option>';
    
    if (appData.students && appData.students.length > 0) {
        appData.students.forEach((student, index) => {
            const option = document.createElement('option');
            option.value = student.id || index;
            option.textContent = `${student.lastName || ''} ${student.firstName || ''}`.trim() || `Ученик ${index + 1}`;
            selector.appendChild(option);
        });
    }
}

// Загрузка дашборда ученика
function loadStudentDashboard() {
    const selector = document.getElementById('studentSelector');
    const dashboard = document.getElementById('studentDashboard');
    
    if (!selector || !dashboard || !selector.value) {
        dashboard.innerHTML = `
            <div style="text-align: center; padding: 50px 20px; color: #7f8c8d;">
                <i class="fas fa-user-graduate" style="font-size: 3em; margin-bottom: 15px;"></i>
                <h4>Выберите ученика для просмотра статистики</h4>
                <p>Отобразятся оценки, прогресс и рекомендации</p>
            </div>
        `;
        return;
    }
    
    const studentId = selector.value;
    const student = appData.students.find(s => (s.id || s.tempId) == studentId);
    const results = appData.results || [];
    const studentResults = results.find(r => r.studentId == studentId);
    
    // Формируем дашборд
    let dashboardHTML = `
        <div class="student-header" style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2em;">
                ${getStudentInitials(student)}
            </div>
            <div>
                <h3 style="margin: 0;">${getStudentName(student)}</h3>
                <p style="color: #7f8c8d; margin: 5px 0;">${appData.test.class || 'Класс не указан'}</p>
            </div>
        </div>
    `;
    
    // Статистика ученика
    if (studentResults && studentResults.grades) {
        const avgGrade = calculateAverageGrade(studentResults.grades);
        const totalTasks = appData.tasks?.length || 0;
        const completedTasks = Object.keys(studentResults.grades).length;
        
        dashboardHTML += `
            <div class="student-stats" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                <div class="stat-card" style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <div class="stat-value" style="font-size: 1.8em; font-weight: bold; color: #2c3e50;">${avgGrade.toFixed(1)}</div>
                    <div class="stat-label" style="color: #7f8c8d;">Средний балл</div>
                </div>
                <div class="stat-card" style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <div class="stat-value" style="font-size: 1.8em; font-weight: bold; color: #2c3e50;">${completedTasks}/${totalTasks}</div>
                    <div class="stat-label" style="color: #7f8c8d;">Выполнено заданий</div>
                </div>
            </div>
        `;
        
        // Оценки по заданиям
        dashboardHTML += `
            <h4>📊 Оценки по заданиям:</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0;">
        `;
        
        Object.entries(studentResults.grades).forEach(([taskId, grade]) => {
            const task = appData.tasks?.find(t => t.id == taskId);
            const gradeColor = getGradeColor(grade);
            
            dashboardHTML += `
                <div style="background: ${gradeColor}; color: white; padding: 8px 12px; border-radius: 20px; font-size: 14px;">
                    ${task?.number || taskId}: ${grade}
                </div>
            `;
        });
        
        dashboardHTML += `</div>`;
    } else {
        dashboardHTML += `
            <div style="background: #fff8e1; padding: 20px; border-radius: 10px; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2em; color: #f39c12; margin-bottom: 10px;"></i>
                <h4>Нет данных об оценках</h4>
                <p>Результаты для этого ученика не найдены</p>
            </div>
        `;
    }
    
    // Рекомендации для ученика
    dashboardHTML += `
        <div class="student-recommendations" style="margin-top: 20px; padding: 15px; background: #e8f4fc; border-radius: 8px;">
            <h5>💡 Рекомендации для улучшения:</h5>
            <ul id="studentRecommendations" style="margin: 10px 0 0 20px;">
                ${generateStudentRecommendations(studentId)}
            </ul>
        </div>
    `;
    
    dashboard.innerHTML = dashboardHTML;
}

// Обновление общей статистики
function updateMobileStatistics() {
    if (!appData.students || appData.students.length === 0) return;
    
    const totalStudents = appData.students.length;
    const results = appData.results || [];
    
    // Рассчитываем статистику
    let totalGrade = 0;
    let excellentCount = 0;
    let needHelpCount = 0;
    let gradedStudents = 0;
    
    results.forEach(result => {
        if (result.grades && Object.keys(result.grades).length > 0) {
            const avgGrade = calculateAverageGrade(result.grades);
            totalGrade += avgGrade;
            gradedStudents++;
            
            if (avgGrade >= 4.5) excellentCount++;
            if (avgGrade < 3) needHelpCount++;
        }
    });
    
    const avgClassGrade = gradedStudents > 0 ? (totalGrade / gradedStudents).toFixed(1) : 0;
    const performancePercent = gradedStudents > 0 ? Math.round((gradedStudents / totalStudents) * 100) : 0;
    
    // Обновляем статистику для родителей
    document.querySelectorAll('.class-stats .stat-value').forEach((el, index) => {
        switch(index) {
            case 0: el.textContent = `${performancePercent}%`; break;
            case 1: el.textContent = avgClassGrade; break;
            case 2: el.textContent = excellentCount; break;
            case 3: el.textContent = needHelpCount; break;
        }
    });
    
    // Обновляем рекомендации для родителей
    const recommendationsList = document.getElementById('parentRecommendations');
    if (recommendationsList) {
        recommendationsList.innerHTML = '';
        
        if (needHelpCount > 0) {
            recommendationsList.innerHTML += `<li>${needHelpCount} ученикам требуется дополнительная помощь</li>`;
        }
        
        if (performancePercent < 80) {
            recommendationsList.innerHTML += `<li>Организуйте дополнительные занятия для класса</li>`;
        }
        
        if (excellentCount > totalStudents * 0.3) {
            recommendationsList.innerHTML += `<li>Класс показывает хорошие результаты. Продолжайте в том же духе!</li>`;
        }
        
        if (recommendationsList.children.length === 0) {
            recommendationsList.innerHTML = `<li>Загрузите данные об учениках для получения рекомендаций</li>`;
        }
    }
}

// Генерация QR-кода для ученика
function generateStudentQR() {
    const selector = document.getElementById('studentSelector');
    if (!selector || !selector.value) {
        alert('Выберите ученика для генерации QR-кода');
        return;
    }
    
    const studentId = selector.value;
    const student = appData.students.find(s => (s.id || s.tempId) == studentId);
    const qrData = JSON.stringify({
        type: 'student',
        studentId: studentId,
        studentName: getStudentName(student),
        class: appData.test.class,
        timestamp: new Date().toISOString()
    });
    
    generateQRCode('mobileQrCode', qrData);
    showNotification('QR-код для ученика сгенерирован', 'success');
}

// Генерация QR-кода для родителя
function generateParentQR() {
    const selector = document.getElementById('studentSelector');
    if (!selector || !selector.value) {
        alert('Выберите ученика для генерации QR-кода родителя');
        return;
    }
    
    const studentId = selector.value;
    const student = appData.students.find(s => (s.id || s.tempId) == studentId);
    const qrData = JSON.stringify({
        type: 'parent',
        studentId: studentId,
        studentName: getStudentName(student),
        class: appData.test.class,
        accessCode: generateAccessCode(),
        timestamp: new Date().toISOString()
    });
    
    generateQRCode('mobileQrCode', qrData);
    showNotification('QR-код для родителя сгенерирован', 'success');
}

// Создание ссылки доступа для родителей
function generateParentAccess() {
    const selector = document.getElementById('studentSelector');
    if (!selector || !selector.value) {
        alert('Выберите ученика для создания ссылки доступа');
        return;
    }
    
    const studentId = selector.value;
    const student = appData.students.find(s => (s.id || s.tempId) == studentId);
    const accessCode = generateAccessCode();
    
    // Сохраняем код доступа в localStorage
    const parentAccess = JSON.parse(localStorage.getItem('parentAccess') || '{}');
    parentAccess[studentId] = {
        code: accessCode,
        studentName: getStudentName(student),
        generated: new Date().toISOString(),
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 дней
    };
    localStorage.setItem('parentAccess', JSON.stringify(parentAccess));
    
    // Создаем ссылку
    const link = `${window.location.origin}${window.location.pathname}?parent=${studentId}&code=${accessCode}`;
    
    showModal(`
        <h3>🔗 Ссылка доступа для родителей</h3>
        <p>Ссылка для ${getStudentName(student)}:</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; word-break: break-all; margin: 15px 0;">
            <code>${link}</code>
        </div>
        <p><small>Ссылка действительна 30 дней</small></p>
        <div class="modal-actions">
            <button class="btn btn-outline" onclick="copyToClipboard('${link}')">
                📋 Копировать ссылку
            </button>
            <button class="btn btn-primary" onclick="closeModal()">
                Закрыть
            </button>
        </div>
    `);
}

// Генерация кода доступа
function generateAccessCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Тестовое уведомление
function testNotification() {
    if (!("Notification" in window)) {
        alert("Этот браузер не поддерживает уведомления");
        return;
    }
    
    if (Notification.permission === "granted") {
        showTestNotification();
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                showTestNotification();
            }
        });
    }
}

// Показать тестовое уведомление
function showTestNotification() {
    new Notification("📊 Система анализа результатов", {
        body: "Тестовое уведомление: Новая оценка добавлена!",
        icon: "https://cdn.jsdelivr.net/npm/twemoji@latest/assets/svg/1f4ca.svg",
        badge: "https://cdn.jsdelivr.net/npm/twemoji@latest/assets/svg/1f4ca.svg"
    });
    
    showNotification('Тестовое уведомление отправлено', 'success');
}

// Отправка уведомлений всем
function sendBulkNotifications() {
    const students = appData.students || [];
    if (students.length === 0) {
        alert('Нет данных об учениках');
        return;
    }
    
    showModal(`
        <h3>📤 Отправка уведомлений</h3>
        <p>Выберите тип уведомления для отправки родителям и ученикам:</p>
        
        <div style="margin: 20px 0;">
            <label style="display: block; margin-bottom: 10px;">
                <input type="radio" name="notificationType" value="grades" checked> 
                Новые оценки
            </label>
            <label style="display: block; margin-bottom: 10px;">
                <input type="radio" name="notificationType" value="report"> 
                Новый отчет
            </label>
            <label style="display: block; margin-bottom: 10px;">
                <input type="radio" name="notificationType" value="reminder"> 
                Напоминание о задании
            </label>
        </div>
        
        <p>Будет отправлено: <strong>${students.length}</strong> уведомлений</p>
        
        <div class="modal-actions">
            <button class="btn btn-primary" onclick="confirmBulkNotifications()">
                📤 Отправить
            </button>
            <button class="btn btn-outline" onclick="closeModal()">
                Отмена
            </button>
        </div>
    `);
}

function confirmBulkNotifications() {
    const type = document.querySelector('input[name="notificationType"]:checked').value;
    const students = appData.students || [];
    
    // В реальном приложении здесь была бы отправка через API
    showNotification(`Уведомления отправлены ${students.length} получателям`, 'success');
    closeModal();
}

// Вспомогательные функции
function getStudentInitials(student) {
    if (!student) return "?";
    const first = student.firstName ? student.firstName[0] : '';
    const last = student.lastName ? student.lastName[0] : '';
    return (first + last).toUpperCase() || "?";
}

function getStudentName(student) {
    if (!student) return "Неизвестный ученик";
    return `${student.lastName || ''} ${student.firstName || ''}`.trim() || "Ученик";
}

function calculateAverageGrade(grades) {
    if (!grades || Object.keys(grades).length === 0) return 0;
    const sum = Object.values(grades).reduce((a, b) => a + b, 0);
    return sum / Object.keys(grades).length;
}

function getGradeColor(grade) {
    if (grade >= 4.5) return "#2ecc71";
    if (grade >= 3.5) return "#3498db";
    if (grade >= 2.5) return "#f39c12";
    return "#e74c3c";
}

function generateStudentRecommendations(studentId) {
    const results = appData.results?.find(r => r.studentId == studentId);
    if (!results || !results.grades) return '<li>Нет данных для рекомендаций</li>';
    
    const avgGrade = calculateAverageGrade(results.grades);
    let recommendations = '';
    
    if (avgGrade < 3) {
        recommendations += '<li>Рекомендуется дополнительная подготовка</li>';
        recommendations += '<li>Обратитесь к учителю за консультацией</li>';
    } else if (avgGrade < 4) {
        recommendations += '<li>Повторите основные темы</li>';
        recommendations += '<li>Решайте больше практических заданий</li>';
    } else {
        recommendations += '<li>Продолжайте в том же духе!</li>';
        recommendations += '<li>Можете перейти к более сложным задачам</li>';
    }
    
    return recommendations;
}

// Генерация QR-кода
function generateQRCode(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    new QRCode(container, {
        text: data,
        width: 180,
        height: 180,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

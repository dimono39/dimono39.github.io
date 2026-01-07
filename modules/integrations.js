// Добавьте в секцию <script> в конце файла перед закрывающим тегом </script>
// Функции для работы с вкладкой интеграций

function connectMESH() {
    showModal('Подключение к МЭШ', `
        <div style="padding: 20px;">
            <p>Для подключения к Московской электронной школе потребуется:</p>
            <ol style="margin-left: 20px; margin-bottom: 20px;">
                <li>API ключ от администратора МЭШ</li>
                <li>Идентификатор вашей школы в системе</li>
                <li>Доступ к журналу вашего класса</li>
            </ol>
            <div class="form-group">
                <label>API ключ МЭШ:</label>
                <input type="password" id="meshApiKey" class="form-input" placeholder="Введите API ключ">
            </div>
            <div class="form-group">
                <label>ID школы:</label>
                <input type="text" id="meshSchoolId" class="form-input" placeholder="Введите ID школы">
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="saveMESHConnection()">Подключить</button>
                <button class="btn" onclick="closeModal()">Отмена</button>
            </div>
        </div>
    `);
}

function saveMESHConnection() {
    const apiKey = document.getElementById('meshApiKey').value;
    const schoolId = document.getElementById('meshSchoolId').value;
    
    if (!apiKey || !schoolId) {
        showNotification('Заполните все поля', 'error');
        return;
    }
    
    // Здесь будет реальная логика подключения к API МЭШ
    document.getElementById('diaryStatus').textContent = 'Подключено';
    document.getElementById('diaryStatus').style.color = '#27ae60';
    
    addToConnectionLog('Подключение к МЭШ', 'Успешно');
    closeModal();
    showNotification('Успешно подключено к МЭШ', 'success');
}

function connectDnevnik() {
    showModal('Подключение к Дневник.ру', `
        <div style="padding: 20px;">
            <p>Для подключения потребуется авторизация через OAuth 2.0</p>
            <p style="margin-bottom: 20px;">Вы будете перенаправлены на страницу авторизации Дневник.ру</p>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="startDnevnikOAuth()">Авторизоваться</button>
                <button class="btn" onclick="closeModal()">Отмена</button>
            </div>
        </div>
    `);
}

function startDnevnikOAuth() {
    // В реальном приложении здесь будет редирект на OAuth страницу
    // Для демо просто показываем успех
    setTimeout(() => {
        document.getElementById('diaryStatus').textContent = 'Подключено';
        document.getElementById('diaryStatus').style.color = '#27ae60';
        addToConnectionLog('Подключение к Дневник.ру', 'Успешно');
        closeModal();
        showNotification('Успешно подключено к Дневник.ру', 'success');
    }, 1000);
}

function configureAutoSync() {
    showModal('Настройки автосинхронизации', `
        <div style="padding: 20px;">
            <div class="form-group">
                <label style="display: block; margin-bottom: 10px;">
                    <input type="checkbox" id="syncGrades" checked> Синхронизировать оценки
                </label>
                <label style="display: block; margin-bottom: 10px;">
                    <input type="checkbox" id="syncAttendance" checked> Синхронизировать посещаемость
                </label>
                <label style="display: block; margin-bottom: 10px;">
                    <input type="checkbox" id="syncComments"> Синхронизировать комментарии
                </label>
            </div>
            <div class="form-group">
                <label>Максимальное количество попыток при ошибке:</label>
                <input type="number" id="maxRetries" min="1" max="10" value="3" class="form-input">
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="saveAutoSyncSettings()">Сохранить</button>
                <button class="btn" onclick="closeModal()">Отмена</button>
            </div>
        </div>
    `);
}

function saveAutoSyncSettings() {
    showNotification('Настройки автосинхронизации сохранены', 'success');
    closeModal();
}

function connectGoogleClassroom() {
    showModal('Подключение к Google Classroom', `
        <div style="padding: 20px;">
            <p>Интеграция с Google Classroom позволяет:</p>
            <ul style="margin-left: 20px; margin-bottom: 20px;">
                <li>Создавать задания в Classroom</li>
                <li>Импортировать результаты тестирования</li>
                <li>Выставлять оценки в Classroom Gradebook</li>
            </ul>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="authenticateGoogle()">Авторизоваться через Google</button>
                <button class="btn" onclick="closeModal()">Отмена</button>
            </div>
        </div>
    `);
}

function authenticateGoogle() {
    // В реальном приложении здесь будет Google OAuth
    setTimeout(() => {
        document.getElementById('lmsStatus').textContent = 'Подключено';
        document.getElementById('lmsStatus').style.color = '#27ae60';
        addToConnectionLog('Подключение к Google Classroom', 'Успешно');
        closeModal();
        showNotification('Успешно подключено к Google Classroom', 'success');
    }, 1500);
}

function generateApiKey() {
    const apiKey = 'sk_' + Math.random().toString(36).substring(2) + '_' + Date.now().toString(36);
    
    showModal('API ключ создан', `
        <div style="padding: 20px;">
            <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <h4 style="margin-top: 0;">Ваш новый API ключ:</h4>
                <code style="background: #e9ecef; padding: 10px; border-radius: 5px; display: block; word-break: break-all; font-family: monospace;">
                    ${apiKey}
                </code>
                <p style="color: #e74c3c; font-size: 0.9em; margin-top: 10px;">
                    ⚠️ Сохраните этот ключ! Он больше не будет показан.
                </p>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="copyToClipboard('${apiKey}')">
                    <i class="fas fa-copy"></i> Копировать ключ
                </button>
                <button class="btn" onclick="closeModal()">Закрыть</button>
            </div>
        </div>
    `);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('API ключ скопирован в буфер обмена', 'success');
    });
}

function showApiDocumentation() {
    showModal('Документация API', `
        <div style="padding: 20px; max-height: 500px; overflow-y: auto;">
            <h3>REST API Документация</h3>
            <p>Базовый URL: <code>https://ваш-домен/api/v1/</code></p>
            
            <h4 style="margin-top: 20px;">Эндпоинты:</h4>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <code style="color: #e74c3c;">GET</code> <strong>/grades</strong> - Получить все оценки
                <p style="margin: 5px 0 0 0; color: #7f8c8d;">Возвращает список всех оценок</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <code style="color: #27ae60;">POST</code> <strong>/grades</strong> - Добавить новую оценку
                <p style="margin: 5px 0 0 0; color: #7f8c8d;">Добавляет оценку в систему</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <code style="color: #3498db;">GET</code> <strong>/students</strong> - Получить список учащихся
                <p style="margin: 5px 0 0 0; color: #7f8c8d;">Возвращает всех учащихся класса</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                <code style="color: #f39c12;">GET</code> <strong>/analytics</strong> - Получить аналитику
                <p style="margin: 5px 0 0 0; color: #7f8c8d;">Статистика и аналитика результатов</p>
            </div>
            
            <p style="margin-top: 20px;">Для аутентификации используйте заголовок:</p>
            <code style="background: #e9ecef; padding: 5px 10px; border-radius: 5px; display: block; margin-bottom: 20px;">
                Authorization: Bearer ваш_api_ключ
            </code>
            
            <div class="modal-actions">
                <button class="btn" onclick="closeModal()">Закрыть</button>
            </div>
        </div>
    `);
}

function saveSyncSettings() {
    const autoSync = document.getElementById('autoSync').checked;
    const syncInterval = document.getElementById('syncInterval').value;
    const dataFormat = document.getElementById('dataFormat').value;
    
    // Сохранение настроек
    localStorage.setItem('syncSettings', JSON.stringify({
        autoSync,
        syncInterval,
        dataFormat
    }));
    
    showNotification('Настройки синхронизации сохранены', 'success');
}

function forceSyncNow() {
    showNotification('Синхронизация началась...', 'info');
    
    // Имитация синхронизации
    setTimeout(() => {
        addToConnectionLog('Принудительная синхронизация', 'Завершено успешно');
        showNotification('Синхронизация завершена', 'success');
    }, 2000);
}

function addToConnectionLog(action, status) {
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.style.cssText = 'padding: 10px; border-bottom: 1px solid #e9ecef;';
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    logEntry.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
            <span><strong>${timeString}</strong> - ${action}</span>
            <span style="color: ${status.includes('Успешно') ? '#27ae60' : '#f39c12'};">${status}</span>
        </div>
    `;
    
    const logContainer = document.getElementById('connectionLog');
    logContainer.insertBefore(logEntry, logContainer.firstChild);
}

function clearConnectionLog() {
    if (confirm('Очистить всю историю подключений?')) {
        document.getElementById('connectionLog').innerHTML = '';
        showNotification('История подключений очищена', 'info');
    }
}

// Другие функции интеграций (для демо)
function connectYaClass() {
    showNotification('Функция подключения к ЯКласс в разработке', 'info');
}

function connectUchiRu() {
    showNotification('Функция подключения к Учи.ру в разработке', 'info');
}

function connectMicrosoftTeams() {
    showNotification('Функция подключения к Microsoft Teams в разработке', 'info');
}

function testApiConnection() {
    showNotification('Проверка соединения API...', 'info');
    setTimeout(() => {
        showNotification('Соединение с API успешно установлено', 'success');
    }, 1000);
}
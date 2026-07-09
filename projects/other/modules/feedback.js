
// ============================
// ОБРАТНАЯ СВЯЗЬ В TELEGRAM dimono39_bot
// ============================

// Настройки Telegram (ЗАМЕНИТЕ НА СВОИ!)
const TELEGRAM_BOT_TOKEN = '8466560666:AAFzgcHA0lEAqPsUswsDgWdGijcEyYJbYBc'; // Пример: '6285051364:AAH7lJ3mKmK6s8Q0...'
const TELEGRAM_CHAT_ID = '754606674'; // Пример: '123456789'

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    // Инициализация счетчика символов
    const messageTextarea = document.getElementById('feedbackMessage');
    if (messageTextarea) {
        messageTextarea.addEventListener('input', function () {
            const charCount = this.value.length;
            document.getElementById('charCount').textContent = charCount;

            // Изменение цвета при превышении лимита
            const counter = document.querySelector('.textarea-counter');
            if (charCount > 1000) {
                counter.style.color = '#e74c3c';
            } else {
                counter.style.color = '#7f8c8d';
            }
        });
    }

    // Инициализация выбора типа
    document.querySelectorAll('.type-option').forEach(option => {
        option.addEventListener('click', function () {
            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;

                // Сбрасываем стили у всех
                document.querySelectorAll('.type-content').forEach(content => {
                    content.style.background = '';
                    content.style.transform = '';
                    content.style.boxShadow = '';
                });

                // Устанавливаем стили для выбранного
                const selectedContent = this.querySelector('.type-content');
                selectedContent.style.background = getTypeBackground(radio.value);
                selectedContent.style.transform = 'translateY(-5px)';
                selectedContent.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
            }
        });
    });

    // Инициализация выбора приоритета
    document.querySelectorAll('.priority-option').forEach(option => {
        option.addEventListener('click', function () {
            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;

                // Сбрасываем стили у всех
                document.querySelectorAll('.priority-content').forEach(content => {
                    content.style.transform = '';
                    content.style.boxShadow = '';
                });

                // Устанавливаем стили для выбранного
                const selectedContent = this.querySelector('.priority-content');
                selectedContent.style.transform = 'translateY(-5px)';
                selectedContent.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
            }
        });
    });

    // Инициализация переключателя конфиденциальности
    const privacyToggle = document.querySelector('.privacy-toggle');
    if (privacyToggle) {
        privacyToggle.addEventListener('click', function () {
            const toggleSwitch = this.querySelector('.toggle-switch');
            const toggleCircle = this.querySelector('.toggle-circle');
            const checkbox = this.querySelector('input[type="checkbox"]');

            checkbox.checked = !checkbox.checked;

            if (checkbox.checked) {
                toggleSwitch.style.background = '#27ae60';
                toggleCircle.style.left = '33px';
            } else {
                toggleSwitch.style.background = '#ddd';
                toggleCircle.style.left = '3px';
            }
        });
    }

    // Загружаем историю
    loadFeedbackHistory();
    updateStats();

    // Анимация фокуса для полей ввода
    const inputs = document.querySelectorAll('.form-input, .form-textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function () {
            this.style.borderColor = '#3498db';
            this.style.background = 'white';
            this.parentElement.querySelector('.input-focus-line').style.width = '100%';
        });

        input.addEventListener('blur', function () {
            if (!this.value) {
                this.style.borderColor = '#e9ecef';
                this.style.background = '#f8f9fa';
                this.parentElement.querySelector('.input-focus-line').style.width = '0';
            }
        });
    });
});

// Функция отправки в Telegram
async function sendToTelegram(event) {
    event.preventDefault();
    
    console.log('🚀 === НАЧАЛО ОТПРАВКИ ФОРМЫ С ФАЙЛОМ ===');
    
    // Показываем индикатор
    showSendingIndicator();
    
    // Собираем данные формы
    const name = document.getElementById('feedbackName').value.trim() || 'Анонимный пользователь';
    const message = document.getElementById('feedbackMessage').value.trim();
    const type = document.querySelector('input[name="feedbackType"]:checked')?.value || 'other';
    const priority = document.querySelector('input[name="priority"]:checked')?.value || 'low';
    const allowContact = document.getElementById('allowContact').checked;
    
    // ВАЛИДАЦИЯ
    if (!message && !selectedFile) {
        showNotification('❌ Введите сообщение или прикрепите файл', 'error');
        hideSendingIndicator();
        return;
    }
    
    try {
        // 1. ОТПРАВЛЯЕМ ТЕКСТОВОЕ СООБЩЕНИЕ С ИНФОРМАЦИЕЙ
        const infoMessage = await sendInfoMessage(name, type, priority, allowContact, message);
        
        // 2. ЕСЛИ ЕСТЬ ФАЙЛ - ОТПРАВЛЯЕМ ЕГО КАК ФАЙЛ
        if (selectedFile) {
            console.log('📁 Отправляю файл как документ:', selectedFile.name);
            await sendFileAsDocument(selectedFile, infoMessage.message_id);
        }
        
        // 3. УСПЕШНОЕ ЗАВЕРШЕНИЕ
        hideSendingIndicator();
        showNotification('✅ Сообщение и файл отправлены в Telegram!', 'success');
        
        // 4. СОХРАНЯЕМ В ИСТОРИЮ
        saveFeedbackToStorage({
            id: 'fb_' + Date.now(),
            timestamp: new Date().toISOString(),
            name: name,
            type: type,
            message: message,
            priority: priority,
            hasFile: !!selectedFile,
            fileName: selectedFile?.name,
            fileType: selectedFile ? await getFileDataType(selectedFile) : null,
            telegramMessageId: infoMessage.message_id,
            status: 'sent_to_telegram'
        });
        
        // 5. ОЧИЩАЕМ ФОРМУ
        clearFeedbackForm();
        removeFile();
        
        // 6. ОБНОВЛЯЕМ UI
        loadFeedbackHistory();
        updateStats();
        
    } catch (error) {
        console.error('❌ Ошибка отправки:', error);
        hideSendingIndicator();
        
        // Определяем тип ошибки для пользователя
        let userMessage = 'Ошибка отправки';
        if (error.message.includes('file is too big')) {
            userMessage = 'Файл слишком большой (макс. 50MB)';
        } else if (error.message.includes('network')) {
            userMessage = 'Ошибка сети. Проверьте соединение';
        }
        
        showNotification(`❌ ${userMessage}`, 'error');
        
        // Сохраняем с ошибкой
        saveFeedbackToStorage({
            id: 'fb_' + Date.now(),
            timestamp: new Date().toISOString(),
            name: name,
            type: type,
            message: message,
            priority: priority,
            hasFile: !!selectedFile,
            fileName: selectedFile?.name,
            status: 'failed_to_send',
            error: error.message
        });
        
        loadFeedbackHistory();
        updateStats();
    }
}

// ФУНКЦИЯ ОТПРАВКИ ИНФОРМАЦИОННОГО СООБЩЕНИЯ
async function sendInfoMessage(name, type, priority, allowContact, message) {
    const telegramMessage = `
📬 *НОВОЕ ОБРАЩЕНИЕ С САЙТА*

📌 *Тип:* ${getTypeText(type)}
🚨 *Приоритет:* ${getPriorityText(priority)}
👤 *От:* ${name}
📞 *Контакты:* ${allowContact ? 'Разрешены ✅' : 'Не разрешены ❌'}

💬 *Сообщение:*
${message || '(без текстового сообщения)'}

⏰ *Отправлено:* ${new Date().toLocaleString('ru-RU')}
    `.trim();
    
    const apiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: telegramMessage,
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        })
    });
    
    const result = await response.json();
    
    if (!result.ok) {
        throw new Error(result.description || 'Ошибка отправки сообщения');
    }
    
    console.log('✅ Инфо-сообщение отправлено. ID:', result.result.message_id);
    return result.result;
}

// ФУНКЦИЯ ОТПРАВКИ ФАЙЛА КАК ДОКУМЕНТА
async function sendFileAsDocument(file, replyToMessageId = null) {
    console.log('📤 Подготавливаю файл для отправки:', file.name);
    
    // Создаем FormData для отправки файла
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('document', file);
    
    // Если нужно, добавляем caption (подпись к файлу)
    const fileInfo = await getFileInfo(file);
    if (fileInfo.caption) {
        formData.append('caption', fileInfo.caption);
    }
    
    // Если это ответ на сообщение
    if (replyToMessageId) {
        formData.append('reply_to_message_id', replyToMessageId);
    }
    
    // Отправляем файл через специальный endpoint для документов
    const apiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`;
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData
        // НЕ УКАЗЫВАЕМ Content-Type - браузер сам установит multipart/form-data
    });
    
    const result = await response.json();
    
    if (!result.ok) {
        console.error('❌ Ошибка отправки файла:', result);
        
        // Если файл слишком большой для отправки как документ,
        // попробуем отправить как сжатый архив
        if (result.description && result.description.includes('too big')) {
            console.log('🔄 Файл слишком большой, пробую сжать...');
            await sendCompressedFile(file, replyToMessageId);
        } else {
            throw new Error(result.description || 'Ошибка отправки файла');
        }
    } else {
        console.log('✅ Файл отправлен успешно. ID:', result.result.message_id);
        return result.result;
    }
}

// ФУНКЦИЯ ПОЛУЧЕНИЯ ИНФОРМАЦИИ О ФАЙЛЕ
async function getFileInfo(file) {
    const content = await readFileAsText(file);
    let jsonData;
    
    try {
        jsonData = JSON.parse(content);
    } catch (e) {
        jsonData = null;
    }
    
    const dataType = jsonData ? detectDataType(jsonData) : 'Неизвестный формат';
    const summary = jsonData ? getDataSummary(jsonData) : '';
    
    // Создаем подпись для файла (макс 1024 символа)
    let caption = `📁 ${file.name}\n`;
    caption += `📊 Тип: ${dataType}\n`;
    caption += `📏 Размер: ${formatFileSize(file.size)}\n`;
    
    if (summary) {
        caption += `📈 ${summary}\n`;
    }
    
    caption += `\n#json #данные #обработка`;
    
    // Обрезаем до 1024 символов (ограничение Telegram)
    if (caption.length > 1024) {
        caption = caption.substring(0, 1020) + '...';
    }
    
    return {
        caption: caption,
        dataType: dataType,
        summary: summary,
        isValidJson: !!jsonData
    };
}

// ФУНКЦИЯ ОТПРАВКИ СЖАТОГО ФАЙЛА
async function sendCompressedFile(file, replyToMessageId) {
    console.log('🗜️ Создаю сжатую версию файла...');
    
    // Показываем уведомление о сжатии
    showNotification('📦 Сжимаю файл для отправки...', 'info');
    
    // Создаем Blob с сжатыми данными
    const content = await readFileAsText(file);
    const jsonData = JSON.parse(content);
    
    // Убираем форматирование для уменьшения размера
    const minifiedJson = JSON.stringify(jsonData);
    
    // Если все еще слишком большой - отправляем только метаданные
    if (minifiedJson.length > 45 * 1024 * 1024) { // 45MB
        console.warn('⚠️ Файл очень большой, отправляю только метаданные');
        
        const metadata = {
            fileName: file.name,
            originalSize: file.size,
            dataType: detectDataType(jsonData),
            structure: getFileStructure(jsonData),
            note: 'Файл слишком большой для отправки. Запросите отдельно.'
        };
        
        const metadataBlob = new Blob(
            [JSON.stringify(metadata, null, 2)], 
            { type: 'application/json' }
        );
        
        const metadataFile = new File(
            [metadataBlob], 
            `${file.name}.meta.json`,
            { type: 'application/json' }
        );
        
        return await sendFileAsDocument(metadataFile, replyToMessageId);
    }
    
    // Создаем сжатый файл
    const compressedBlob = new Blob([minifiedJson], { type: 'application/json' });
    const compressedFile = new File(
        [compressedBlob], 
        `${file.name.replace('.json', '')}_compressed.json`,
        { type: 'application/json' }
    );
    
    console.log(`🗜️ Сжато с ${formatFileSize(file.size)} до ${formatFileSize(compressedBlob.size)}`);
    
    return await sendFileAsDocument(compressedFile, replyToMessageId);
}

// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
async function getFileDataType(file) {
    try {
        const content = await readFileAsText(file);
        const jsonData = JSON.parse(content);
        return detectDataType(jsonData);
    } catch (error) {
        return 'Невалидный JSON';
    }
}

// Вспомогательные функции для работы с файлами
async function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function getFileStructure(data) {
    if (Array.isArray(data)) {
        return {
            type: 'array',
            length: data.length,
            sampleItem: data[0] ? Object.keys(data[0]) : 'empty'
        };
    } else if (typeof data === 'object') {
        const structure = {
            type: 'object',
            keys: Object.keys(data)
        };
        
        // Добавляем информацию о вложенных данных
        structure.keys.forEach(key => {
            if (Array.isArray(data[key])) {
                structure[key] = `array[${data[key].length}]`;
            } else if (typeof data[key] === 'object') {
                structure[key] = `object[${Object.keys(data[key]).length} keys]`;
            }
        });
        
        return structure;
    }
    return { type: typeof data };
}

function saveFileToStorage(file, content, dataType) {
    try {
        const fileData = {
            id: 'file_' + Date.now(),
            name: file.name,
            type: dataType,
            size: file.size,
            timestamp: new Date().toISOString(),
            content: JSON.parse(content), // Парсим для компактности
            canBeImported: checkIfImportable(JSON.parse(content))
        };
        
        // Сохраняем в отдельное хранилище
        let fileHistory = JSON.parse(localStorage.getItem('fileHistory')) || [];
        fileHistory.unshift(fileData);
        
        // Ограничиваем историю 20 файлами
        if (fileHistory.length > 20) {
            fileHistory = fileHistory.slice(0, 20);
        }
        
        localStorage.setItem('fileHistory', JSON.stringify(fileHistory));
        console.log('💾 Файл сохранен в истории:', fileData.id);
        
    } catch (error) {
        console.error('❌ Ошибка сохранения файла:', error);
    }
}

function checkIfImportable(data) {
    // Проверяем, можно ли импортировать эти данные
    const requiredKeys = ['students', 'tasks', 'results'];
    
    if (typeof data === 'object') {
        const hasAllKeys = requiredKeys.every(key => key in data);
        return hasAllKeys ? 'full_app_data' : 'partial_data';
    }
    
    return 'unknown';
}

async function sendFileContent(file, replyToMessageId) {
    try {
        const content = await readFileAsText(file);
        const jsonData = JSON.parse(content);
        
        // Формируем компактное представление данных
        const preview = {
            fileName: file.name,
            size: file.size,
            dataType: detectDataType(jsonData),
            summary: getDataSummary(jsonData)
        };
        
        const previewMessage = `
📁 *СОДЕРЖИМОЕ ФАЙЛА ${file.name}*

📊 ${preview.dataType}
📈 ${preview.summary}

_Для автоматической обработки используйте команду /import_
        `.trim();
        
        // Отправляем превью
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: previewMessage,
                parse_mode: 'Markdown',
                reply_to_message_id: replyToMessageId
            })
        });
        
    } catch (error) {
        console.error('❌ Ошибка отправки содержимого файла:', error);
    }
}

function getDataSummary(data) {
    if (data.students && data.tasks) {
        return `👥 ${data.students.length} студентов | 📝 ${data.tasks.length} заданий`;
    } else if (Array.isArray(data)) {
        return `📋 ${data.length} записей`;
    }
    return `${Object.keys(data).length} ключей`;
}

// Вспомогательные функции
function getTypeText(type) {
    const types = {
        'suggestion': '💡 Предложение',
        'bug': '🐛 Ошибка',
        'feature': '✨ Новая функция',
        'question': '❓ Вопрос',
        'other': '📝 Другое'
    };
    return types[type] || types.other;
}

function getPriorityText(priority) {
    const priorities = {
        'low': '🟢 Низкий',
        'medium': '🟡 Средний',
        'high': '🔴 Высокий'
    };
    return priorities[priority] || priorities.low;
}

function getTypeBackground(type) {
    const backgrounds = {
        'suggestion': '#e8f4fc',
        'bug': '#fdedec',
        'feature': '#f0ebf9',
        'question': '#fff8e1',
        'other': '#f8f9fa'
    };
    return backgrounds[type] || backgrounds.other;
}

function saveFeedbackToStorage(feedback) {
    try {
        let feedbackHistory = JSON.parse(localStorage.getItem('feedbackHistory')) || [];
        feedbackHistory.unshift(feedback); // Добавляем в начало

        // Ограничиваем историю 50 сообщениями
        if (feedbackHistory.length > 50) {
            feedbackHistory = feedbackHistory.slice(0, 50);
        }

        localStorage.setItem('feedbackHistory', JSON.stringify(feedbackHistory));
        return true;
    } catch (error) {
        console.error('Ошибка сохранения в историю:', error);
        return false;
    }
}

function loadFeedbackHistory() {
    try {
        const feedbackHistory = JSON.parse(localStorage.getItem('feedbackHistory')) || [];
        const container = document.getElementById('feedbackHistoryList');

        if (!container)
            return;

        if (feedbackHistory.length === 0) {
            container.innerHTML = `
						<div class="empty-history" style="text-align: center; padding: 60px 20px; color: #bdc3c7;">
							<div style="font-size: 4em; margin-bottom: 20px;">📭</div>
							<h3 style="color: #95a5a6; margin-bottom: 10px;">История пуста</h3>
							<p>Здесь будут отображаться ваши отправленные сообщения</p>
						</div>
					`;
            return;
        }

        container.innerHTML = feedbackHistory.map((item, index) => `
					<div class="history-item" style="padding: 20px; margin-bottom: 15px; background: #f8f9fa; border-radius: 15px; border-left: 4px solid ${getStatusColor(item.status)}; transition: all 0.3s; cursor: pointer;" onclick="showFeedbackDetails(${index})">
						<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
							<div style="display: flex; align-items: center; gap: 12px;">
								<div style="width: 40px; height: 40px; background: ${getTypeBackground(item.type)}; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px;">
									${item.type === 'suggestion' ? '💡' : item.type === 'bug' ? '🐛' : item.type === 'feature' ? '✨' : '❓'}
								</div>
								<div>
									<div style="font-weight: 600; color: #2c3e50;">${item.name}</div>
									<div style="font-size: 14px; color: #7f8c8d;">${getTypeText(item.type)} • ${getPriorityText(item.priority)}</div>
								</div>
							</div>
							<div style="text-align: right;">
								<div style="font-size: 12px; color: #95a5a6;">${new Date(item.timestamp).toLocaleDateString('ru-RU')}</div>
								<div style="font-size: 11px; padding: 3px 8px; background: ${getStatusColor(item.status)}; color: white; border-radius: 10px; margin-top: 5px;">
									${getStatusText(item.status)}
								</div>
							</div>
						</div>
						<div style="color: #34495e; font-size: 14px; line-height: 1.5; max-height: 60px; overflow: hidden; text-overflow: ellipsis;">
							${item.message.substring(0, 150)}${item.message.length > 150 ? '...' : ''}
						</div>
					</div>
				`).join('');

    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
    }
}

function getStatusColor(status) {
    switch (status) {
    case 'sent_to_telegram':
        return '#27ae60';
    case 'saved_locally':
        return '#3498db';
    case 'failed_to_send':
        return '#e74c3c';
    default:
        return '#95a5a6';
    }
}

function getStatusText(status) {
    switch (status) {
    case 'sent_to_telegram':
        return 'Отправлено';
    case 'saved_locally':
        return 'Сохранено';
    case 'failed_to_send':
        return 'Ошибка';
    default:
        return 'Неизвестно';
    }
}

function updateStats() {
    try {
        const feedbackHistory = JSON.parse(localStorage.getItem('feedbackHistory')) || [];
        const sentCount = feedbackHistory.filter(item => item.status === 'sent_to_telegram').length;

        document.getElementById('sentCount').textContent = sentCount;
    } catch (error) {
        console.error('Ошибка обновления статистики:', error);
    }
}

function clearFeedbackForm() {
    if (confirm('Очистить форму обратной связи?')) {
        document.getElementById('feedbackForm').reset();
        document.getElementById('charCount').textContent = '0';

        // Сброс стилей выбора типа
        document.querySelectorAll('.type-content').forEach(content => {
            content.style.background = '';
            content.style.transform = '';
            content.style.boxShadow = '';
        });

        // Сброс стилей выбора приоритета
        document.querySelectorAll('.priority-content').forEach(content => {
            content.style.transform = '';
            content.style.boxShadow = '';
        });

        showNotification('Форма очищена', 'info');
    }
}

function clearAllFeedback() {
    if (confirm('Вы уверены, что хотите удалить всю историю обращений?')) {
        localStorage.removeItem('feedbackHistory');
        loadFeedbackHistory();
        updateStats();
        showNotification('История очищена', 'info');
    }
}

function exportFeedbackHistory() {
    try {
        const feedbackHistory = JSON.parse(localStorage.getItem('feedbackHistory')) || [];

        if (feedbackHistory.length === 0) {
            showNotification('Нет данных для экспорта', 'warning');
            return;
        }

        const dataStr = JSON.stringify(feedbackHistory, null, 2);
        const dataBlob = new Blob([dataStr], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `feedback_history_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showNotification('История экспортирована в JSON', 'success');
    } catch (error) {
        console.error('Ошибка экспорта:', error);
        showNotification('Ошибка экспорта', 'error');
    }
}

function showFeedbackDetails(index) {
    try {
        const feedbackHistory = JSON.parse(localStorage.getItem('feedbackHistory')) || [];
        const item = feedbackHistory[index];

        if (!item)
            return;

        const modalContent = `
					<div style="max-width: 600px; padding: 30px;">
						<h2 style="color: #2c3e50; margin-bottom: 25px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
							<i class="fas fa-info-circle me-2"></i>Детали обращения
						</h2>
						
						<div style="margin-bottom: 25px;">
							<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
								<div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
									<div style="font-size: 12px; color: #7f8c8d; margin-bottom: 5px;">Отправитель</div>
									<div style="font-weight: 600; color: #2c3e50;">${item.name}</div>
								</div>
								<div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
									<div style="font-size: 12px; color: #7f8c8d; margin-bottom: 5px;">Дата</div>
									<div style="font-weight: 600; color: #2c3e50;">${new Date(item.timestamp).toLocaleString('ru-RU')}</div>
								</div>
							</div>
							
							<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
								<div style="background: ${getTypeBackground(item.type)}; padding: 15px; border-radius: 10px;">
									<div style="font-size: 12px; color: #7f8c8d; margin-bottom: 5px;">Тип</div>
									<div style="font-weight: 600; color: #2c3e50;">${getTypeText(item.type)}</div>
								</div>
								<div style="background: ${item.priority === 'high' ? '#fdedec' : item.priority === 'medium' ? '#fff8e1' : '#e8f6f3'}; padding: 15px; border-radius: 10px;">
									<div style="font-size: 12px; color: #7f8c8d; margin-bottom: 5px;">Приоритет</div>
									<div style="font-weight: 600; color: #2c3e50;">${getPriorityText(item.priority)}</div>
								</div>
							</div>
							
							<div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
								<div style="font-size: 12px; color: #7f8c8d; margin-bottom: 10px;">Сообщение</div>
								<div style="color: #34495e; line-height: 1.6; white-space: pre-wrap;">${item.message}</div>
							</div>
							
							<div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; background: ${getStatusColor(item.status)}; color: white; border-radius: 10px;">
								<div>
									<div style="font-size: 12px; opacity: 0.9;">Статус</div>
									<div style="font-weight: 600;">${getStatusText(item.status)}</div>
								</div>
								<div style="font-size: 24px;">
									${item.status === 'sent_to_telegram' ? '✅' : item.status === 'failed_to_send' ? '❌' : '💾'}
								</div>
							</div>
						</div>
						
						<div style="display: flex; gap: 15px;">
							<button onclick="closeModal()" class="btn" style="flex: 1; padding: 15px; background: #f8f9fa; color: #34495e; border: 2px solid #ddd; border-radius: 10px; font-weight: 600; cursor: pointer;">
								Закрыть
							</button>
							<button onclick="deleteFeedback(${index})" class="btn" style="flex: 1; padding: 15px; background: #fdedec; color: #e74c3c; border: 2px solid #fadbd8; border-radius: 10px; font-weight: 600; cursor: pointer;">
								<i class="fas fa-trash me-2"></i> Удалить
							</button>
						</div>
					</div>
				`;

        showModal('📄 Детали обращения', modalContent);

    } catch (error) {
        console.error('Ошибка показа деталей:', error);
    }
}

function deleteFeedback(index) {
    if (confirm('Удалить это обращение из истории?')) {
        try {
            const feedbackHistory = JSON.parse(localStorage.getItem('feedbackHistory')) || [];
            feedbackHistory.splice(index, 1);
            localStorage.setItem('feedbackHistory', JSON.stringify(feedbackHistory));

            closeModal();
            loadFeedbackHistory();
            updateStats();
            showNotification('Обращение удалено', 'success');
        } catch (error) {
            console.error('Ошибка удаления:', error);
            showNotification('Ошибка удаления', 'error');
        }
    }
}

// ======================
// ФУНКЦИИ ДЛЯ ИНДИКАТОРА
// ======================

// Показать индикатор
function showSendingIndicator() {
    const indicator = document.getElementById('sendingIndicator');
    if (indicator) {
        indicator.style.display = 'flex';
        console.log('📊 Индикатор показан');
    } else {
        console.error('❌ Индикатор не найден!');
    }
}

// Скрыть индикатор
function hideSendingIndicator() {
    const indicator = document.getElementById('sendingIndicator');
    if (indicator) {
        indicator.style.display = 'none';
        console.log('📊 Индикатор скрыт');
    }
}

// Принудительное скрытие через 10 секунд (на всякий случай)
function forceHideIndicator() {
    setTimeout(() => {
        const indicator = document.getElementById('sendingIndicator');
        if (indicator && indicator.style.display !== 'none') {
            console.warn('⚠️ Принудительно скрываю индикатор (таймаут 10с)');
            hideSendingIndicator();
            showNotification('Индикатор скрыт принудительно', 'warning');
        }
    }, 10000); // 10 секунд
}

// ============================
// РАБОТА С JSON-ФАЙЛАМИ
// ============================

let selectedFile = null;

// Обработка выбора файла
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file)
        return;

    // Проверка типа файла
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
        showNotification('❌ Выберите JSON-файл', 'error');
        resetFileInput();
        return;
    }

    // Проверка размера (5 MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('❌ Файл слишком большой (макс. 5 MB)', 'error');
        resetFileInput();
        return;
    }

    selectedFile = file;
    showFilePreview(file);
}

// Показ превью файла
function showFilePreview(file) {
    const uploadArea = document.getElementById('fileUploadArea');
    const uploadContent = document.getElementById('fileUploadContent');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileValidation = document.getElementById('fileValidation');

    // Обновляем информацию
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);

    // Прячем зону загрузки, показываем превью
    uploadContent.style.display = 'none';
    fileInfo.style.display = 'block';

    // Изменяем стиль зоны загрузки
    uploadArea.style.borderStyle = 'solid';
    uploadArea.style.borderColor = '#2ecc71';
    uploadArea.style.background = '#f0fff4';

    // Проверяем содержимое файла
    validateJsonFile(file)
    .then(validation => {
        if (validation.isValid) {
            fileValidation.innerHTML = `
                    <i class="fas fa-check-circle me-2" style="color: #27ae60;"></i>
                    <span style="color: #27ae60;">✅ Валидный JSON (${validation.dataType})</span>
                `;

            // Показываем превью содержимого
            showJsonPreview(validation.preview);
        } else {
            fileValidation.innerHTML = `
                    <i class="fas fa-exclamation-triangle me-2" style="color: #f39c12;"></i>
                    <span style="color: #f39c12;">⚠️ ${validation.error}</span>
                `;
        }
    })
    .catch(error => {
        console.error('Ошибка валидации:', error);
        fileValidation.innerHTML = `
                <i class="fas fa-times-circle me-2" style="color: #e74c3c;"></i>
                <span style="color: #e74c3c;">❌ Ошибка чтения файла</span>
            `;
    });
}

// Валидация JSON файла
async function validateJsonFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const content = e.target.result;
                const jsonData = JSON.parse(content);

                // Определяем тип данных
                const dataType = detectDataType(jsonData);

                resolve({
                    isValid: true,
                    dataType: dataType,
                    preview: jsonData,
                    size: content.length,
                    keys: Object.keys(jsonData)
                });

            } catch (error) {
                resolve({
                    isValid: false,
                    error: 'Невалидный JSON: ' + error.message
                });
            }
        };

        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// Определение типа данных в JSON
function detectDataType(json) {
    if (json.students && json.tasks && json.results) {
        return 'Полные данные системы (appData)';
    } else if (Array.isArray(json) && json[0] && json[0].lastName) {
        return 'Список студентов';
    } else if (Array.isArray(json) && json[0] && json[0].number) {
        return 'Задания';
    } else if (json.test || json.settings) {
        return 'Настройки теста';
    } else if (json.feedbackHistory) {
        return 'История обращений';
    } else {
        return 'Пользовательские данные';
    }
}

// Показ превью JSON
function showJsonPreview(data) {
    const preview = document.getElementById('filePreview');

    // Ограничиваем показ данных
    const previewData = limitJsonPreview(data);

    preview.innerHTML = `
        <div style="text-align: left; max-height: 200px; overflow-y: auto; background: white; padding: 15px; border-radius: 8px; border: 1px solid #eee; margin-top: 15px;">
            <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 10px;">
                <i class="fas fa-code me-1"></i>Превью данных:
            </div>
            <pre style="font-size: 11px; color: #34495e; margin: 0; white-space: pre-wrap; word-break: break-all;">
${JSON.stringify(previewData, null, 2)}
            </pre>
        </div>
    `;
    preview.style.display = 'block';
}

// Ограничение превью JSON (чтобы не показывать все)
function limitJsonPreview(data) {
    if (Array.isArray(data)) {
        // Для массивов показываем только первые 3 элемента
        return data.slice(0, 3);
    } else if (typeof data === 'object') {
        // Для объектов ограничиваем вложенные массивы
        const limited = {};
        for (const key in data) {
            if (Array.isArray(data[key])) {
                limited[key] = data[key].slice(0, 3);
            } else {
                limited[key] = data[key];
            }
        }
        return limited;
    }
    return data;
}

// Удаление выбранного файла
function removeFile() {
    selectedFile = null;
    resetFileInput();
}

// Сброс поля файла
function resetFileInput() {
    const input = document.getElementById('jsonFile');
    input.value = '';

    const uploadArea = document.getElementById('fileUploadArea');
    const uploadContent = document.getElementById('fileUploadContent');
    const fileInfo = document.getElementById('fileInfo');
    const preview = document.getElementById('filePreview');

    uploadContent.style.display = 'block';
    fileInfo.style.display = 'none';
    preview.style.display = 'none';

    uploadArea.style.borderStyle = 'dashed';
    uploadArea.style.borderColor = '#3498db';
    uploadArea.style.background = '#f8f9fa';
}

// Форматирование размера файла
function formatFileSize(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Drag & Drop поддержка
document.addEventListener('DOMContentLoaded', function () {
    const dropArea = document.getElementById('fileUploadArea');

    // Предотвращаем стандартное поведение
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Подсветка при перетаскивании
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.style.borderColor = '#9b59b6';
        dropArea.style.background = '#f5eef8';
    }

    function unhighlight() {
        dropArea.style.borderColor = '#3498db';
        dropArea.style.background = '#f8f9fa';
    }

    // Обработка drop
    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            // Создаем искусственное событие для input
            const input = document.getElementById('jsonFile');
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(files[0]);
            input.files = dataTransfer.files;

            // Запускаем обработку
            handleFileSelect({
                target: input
            });
        }
    }
});

// ============================
// ЭКСПОРТ/ИМПОРТ ДАННЫХ
// ============================

// Экспорт полных данных приложения
function exportFullAppData() {
    try {
        // Собираем все данные
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            appName: 'Система анализа образовательных результатов',
            appData: window.appData || {},
            feedbackHistory: JSON.parse(localStorage.getItem('feedbackHistory')) || [],
            fileHistory: JSON.parse(localStorage.getItem('fileHistory')) || [],
            statistics: {
                studentsCount: window.appData?.students?.length || 0,
                tasksCount: window.appData?.tasks?.length || 0,
                feedbackCount: JSON.parse(localStorage.getItem('feedbackHistory'))?.length || 0
            },
            metadata: {
                telegramConfigured: !!TELEGRAM_BOT_TOKEN && TELEGRAM_BOT_TOKEN !== 'ВАШ_ТОКЕН_БОТА',
                exportMethod: 'manual',
                format: 'json'
            }
        };
        
        // Показываем превью перед экспортом
        showExportPreview(exportData)
            .then(userConfirmed => {
                if (userConfirmed) {
                    // Создаем JSON с красивым форматированием
                    const jsonData = JSON.stringify(exportData, null, 2);
                    downloadJsonFile(jsonData, `eras_analytics_backup_${getCurrentDateString()}.json`);
                    
                    showNotification('✅ Все данные экспортированы как файл', 'success');
                    
                    // Предлагаем отправить файл в Telegram
                    setTimeout(() => {
                        if (confirm('Хотите отправить этот файл в Telegram для архивации?')) {
                            uploadExportedFile(jsonData);
                        }
                    }, 1000);
                }
            })
            .catch(error => {
                console.error('❌ Ошибка превью:', error);
                // Экспортируем без превью
                const jsonData = JSON.stringify(exportData, null, 2);
                downloadJsonFile(jsonData, `eras_analytics_backup_${getCurrentDateString()}.json`);
            });
        
    } catch (error) {
        console.error('❌ Ошибка экспорта:', error);
        showNotification('❌ Ошибка экспорта данных', 'error');
    }
}

// ФУНКЦИЯ АВТОМАТИЧЕСКОЙ ЗАГРУЗКИ В TELEGRAM
async function uploadExportedFile(jsonData) {
    try {
        // Создаем Blob из JSON
        const blob = new Blob([jsonData], { type: 'application/json' });
        const fileName = `eras_backup_auto_${getCurrentDateString()}.json`;
        const file = new File([blob], fileName, { type: 'application/json' });
        
        // Отправляем информационное сообщение
        const infoMessage = await sendInfoMessage(
            'Система (автоэкспорт)',
            'backup',
            'low',
            false,
            '📊 Автоматический экспорт данных системы'
        );
        
        // Отправляем файл
        await sendFileAsDocument(file, infoMessage.message_id);
        
        showNotification('✅ Файл отправлен в Telegram для архивации', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка отправки в Telegram:', error);
        showNotification('❌ Не удалось отправить файл в Telegram', 'warning');
    }
}

// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
function downloadJsonFile(jsonData, fileName) {
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function getCurrentDateString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
}

// ФУНКЦИЯ ПОКАЗА ПРЕВЬЮ ЭКСПОРТА
function showExportPreview(data) {
    return new Promise((resolve, reject) => {
        // Создаем компактное превью
        const preview = {
            appName: data.appName,
            exportedAt: new Date(data.exportedAt).toLocaleString('ru-RU'),
            statistics: data.statistics,
            sizeEstimate: JSON.stringify(data).length + ' байт'
        };
        
        const previewHtml = `
            <div style="max-width: 700px; padding: 25px;">
                <h3 style="color: #2c3e50; margin-bottom: 20px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                    <i class="fas fa-file-export me-2"></i>Превью экспорта
                </h3>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                        <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #3498db;">
                            <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 5px;">Приложение</div>
                            <div style="font-weight: 600; color: #2c3e50;">${preview.appName}</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #2ecc71;">
                            <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 5px;">Дата экспорта</div>
                            <div style="font-weight: 600; color: #2c3e50;">${preview.exportedAt}</div>
                        </div>
                    </div>
                    
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">📊 Статистика данных:</h4>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
                        <div style="text-align: center; padding: 15px; background: #e8f4fc; border-radius: 8px;">
                            <div style="font-size: 24px; color: #3498db; margin-bottom: 5px;">👥</div>
                            <div style="font-weight: bold; color: #2c3e50;">${preview.statistics.studentsCount}</div>
                            <div style="font-size: 12px; color: #7f8c8d;">Студентов</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #f0ebf9; border-radius: 8px;">
                            <div style="font-size: 24px; color: #9b59b6; margin-bottom: 5px;">📝</div>
                            <div style="font-weight: bold; color: #2c3e50;">${preview.statistics.tasksCount}</div>
                            <div style="font-size: 12px; color: #7f8c8d;">Заданий</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #e8f6f3; border-radius: 8px;">
                            <div style="font-size: 24px; color: #27ae60; margin-bottom: 5px;">💬</div>
                            <div style="font-weight: bold; color: #2c3e50;">${preview.statistics.feedbackCount}</div>
                            <div style="font-size: 12px; color: #7f8c8d;">Обращений</div>
                        </div>
                    </div>
                    
                    <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 5px;">Примерный размер файла</div>
                        <div style="font-weight: 600; color: #2c3e50; font-size: 18px;">${preview.sizeEstimate}</div>
                    </div>
                    
                    <div style="background: #fff8e1; padding: 15px; border-radius: 8px; border-left: 4px solid #f39c12;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                            <div style="font-size: 20px; color: #f39c12;">
                                <i class="fas fa-info-circle"></i>
                            </div>
                            <div style="font-weight: 600; color: #2c3e50;">Файл будет содержать:</div>
                        </div>
                        <ul style="margin: 0; padding-left: 20px; color: #34495e;">
                            <li>Все настройки системы</li>
                            <li>Данные студентов и заданий</li>
                            <li>Результаты тестирования</li>
                            <li>Историю обратной связи</li>
                            <li>Метаданные и статистику</li>
                        </ul>
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px; margin-top: 20px;">
                    <button onclick="closeModal(); resolve(false)" 
                            style="flex: 1; padding: 15px; background: #f8f9fa; color: #34495e; border: 2px solid #ddd; border-radius: 10px; font-weight: 600; cursor: pointer;">
                        Отмена
                    </button>
                    <button onclick="closeModal(); resolve(true)" 
                            style="flex: 1; padding: 15px; background: linear-gradient(135deg, #3498db, #2980b9); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">
                        <i class="fas fa-download me-2"></i> Экспортировать
                    </button>
                </div>
            </div>
        `;
        
        showModal('📊 Превью экспорта данных', previewHtml);
    });
}

// Импорт данных
async function importAppData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const content = await readFileAsText(file);
        const data = JSON.parse(content);
        
        // Проверяем структуру
        if (!data.appData) {
            throw new Error('Некорректный формат файла');
        }
        
        // Показываем превью импортируемых данных
        const preview = `
📊 *ПРЕВЬЮ ИМПОРТИРУЕМЫХ ДАННЫХ*

👥 Студентов: ${data.appData.students?.length || 0}
📝 Заданий: ${data.appData.tasks?.length || 0}
📊 Результатов: ${data.appData.results?.length || 'массив'}
🕰️ Экспортировано: ${data.exportedAt ? new Date(data.exportedAt).toLocaleString('ru-RU') : 'неизвестно'}
        `.trim();
        
        // Запрашиваем подтверждение
        if (confirm(`Импортировать данные из файла ${file.name}?\n\n${preview}`)) {
            // Импортируем данные
            window.appData = data.appData;
            
            // Сохраняем в localStorage
            localStorage.setItem('appData', JSON.stringify(window.appData));
            
            // Обновляем UI
            showNotification('✅ Данные успешно импортированы!', 'success');
            
            // Предлагаем перезагрузить страницу
            if (confirm('Данные импортированы. Перезагрузить страницу для применения?')) {
                location.reload();
            }
        }
        
    } catch (error) {
        console.error('❌ Ошибка импорта:', error);
        showNotification('❌ Ошибка импорта: ' + error.message, 'error');
    }
    
    // Сбрасываем input
    event.target.value = '';
}

// Показ истории файлов
function showFileHistory() {
    try {
        const fileHistory = JSON.parse(localStorage.getItem('fileHistory')) || [];
        const container = document.getElementById('fileHistoryList');
        const panel = document.getElementById('fileHistoryPanel');
        
        if (!container) return;
        
        if (fileHistory.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #bdc3c7;">
                    <div style="font-size: 3em; margin-bottom: 20px;">📭</div>
                    <p>История файлов пуста</p>
                </div>
            `;
        } else {
            container.innerHTML = fileHistory.map((file, index) => `
                <div style="padding: 15px; margin-bottom: 10px; background: white; border-radius: 10px; border-left: 4px solid #3498db;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 40px; height: 40px; background: #e8f4fc; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-file-code" style="color: #3498db;"></i>
                            </div>
                            <div>
                                <div style="font-weight: 600; color: #2c3e50;">${file.name}</div>
                                <div style="font-size: 12px; color: #7f8c8d;">${file.type} • ${formatFileSize(file.size)}</div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 11px; color: #95a5a6;">${new Date(file.timestamp).toLocaleDateString('ru-RU')}</div>
                            <div style="display: flex; gap: 5px; margin-top: 5px;">
                                <button onclick="downloadFileFromHistory(${index})" style="background: #e8f4fc; color: #2980b9; border: none; padding: 3px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
                                    <i class="fas fa-download"></i>
                                </button>
                                <button onclick="deleteFileFromHistory(${index})" style="background: #fdedec; color: #e74c3c; border: none; padding: 3px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div style="font-size: 12px; color: #34495e;">
                        ${file.canBeImported === 'full_app_data' ? 
                          '<span style="color: #27ae60;">✅ Может быть импортирован</span>' : 
                          '<span style="color: #f39c12;">⚠️ Требует проверки</span>'}
                    </div>
                </div>
            `).join('');
        }
        
        // Показываем панель
        panel.style.display = 'block';
        
    } catch (error) {
        console.error('❌ Ошибка загрузки истории файлов:', error);
    }
}

// Информация об автоматизации
function showAutomationInfo() {
    const info = `
🤖 *ПЛАНЫ НА БУДУЩЕЕ: АВТОМАТИЧЕСКАЯ ОБРАБОТКА*

*1. Telegram-бот с командами:*
   • /import — автоматический импорт данных из JSON
   • /status — статус системы
   • /backup — создание резервной копии

*2. Автоматическое определение типа данных:*
   • Определение структуры файла
   • Валидация перед импортом
   • Конвертация форматов

*3. Обратная связь с обработкой:*
   • Автоматический ответ на типовые запросы
   • Уведомления об ошибках в данных
   • Рекомендации по исправлению

*4. API для интеграций:*
   • REST API для внешних систем
   • Webhooks для уведомлений
   • Пакетная обработка данных
    `.trim();
    
    showModal('🤖 Автоматизация в будущем', `
        <div style="max-width: 600px; padding: 20px;">
            <div style="white-space: pre-line; font-family: monospace; font-size: 14px; line-height: 1.5; color: #34495e;">
                ${info}
            </div>
            <div style="margin-top: 25px; text-align: center;">
                <button onclick="closeModal()" class="btn" style="padding: 12px 30px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Понятно
                </button>
            </div>
        </div>
    `);
}

// ФУНКЦИЯ БЫСТРОЙ ОТПРАВКИ ТЕКУЩИХ ДАННЫХ
async function sendCurrentDataToTelegram() {
    if (!confirm('Отправить текущие данные системы в Telegram как файл?')) {
        return;
    }
    
    showNotification('📤 Подготавливаю данные для отправки...', 'info');
    
    try {
        // Собираем данные
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            appName: 'Система анализа образовательных результатов',
            appData: window.appData || {},
            statistics: {
                studentsCount: window.appData?.students?.length || 0,
                tasksCount: window.appData?.tasks?.length || 0
            }
        };
        
        // Создаем JSON
        const jsonData = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const fileName = `eras_current_data_${getCurrentDateString()}.json`;
        const file = new File([blob], fileName, { type: 'application/json' });
        
        // Отправляем информационное сообщение
        const infoMessage = await sendInfoMessage(
            'Система (данные)',
            'data_export',
            'low',
            false,
            '📊 Текущие данные системы для анализа'
        );
        
        // Отправляем файл
        await sendFileAsDocument(file, infoMessage.message_id);
        
        showNotification('✅ Данные отправлены в Telegram как файл', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка отправки данных:', error);
        showNotification('❌ Ошибка отправки данных в Telegram', 'error');
    }
}

// ПРОВЕРКА ОГРАНИЧЕНИЙ TELEGRAM
function checkTelegramLimits(file) {
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB для ботов
    
    if (file.size > MAX_FILE_SIZE) {
        return {
            canSend: false,
            reason: `Файл слишком большой (${formatFileSize(file.size)} > ${formatFileSize(MAX_FILE_SIZE)})`,
            suggestion: 'Разделите данные на несколько файлов или используйте сжатие'
        };
    }
    
    // Для текстовых сообщений проверяем длину
    const MAX_MESSAGE_LENGTH = 4096;
    if (file.size < 10000) { // Маленький файл можно отправить текстом
        return {
            canSend: true,
            method: file.size < 1000 ? 'text_or_file' : 'file_recommended'
        };
    }
    
    return {
        canSend: true,
        method: 'file_only',
        note: 'Будет отправлен как документ'
    };
}

// ФУНКЦИЯ АВТОВЫБОРА СПОСОБА ОТПРАВКИ
async function autoSelectSendMethod(file) {
    const limits = checkTelegramLimits(file);
    
    if (!limits.canSend) {
        throw new Error(limits.reason);
    }
    
    // Если файл маленький, предлагаем выбор
    if (limits.method === 'text_or_file') {
        const content = await readFileAsText(file);
        
        // Проверяем, можно ли отправить как текст (с учетом форматирования)
        const formattedJson = JSON.stringify(JSON.parse(content), null, 2);
        
        if (formattedJson.length < 3500) { // Оставляем запас для текста сообщения
            const sendAsText = confirm(
                `Файл небольшой (${formatFileSize(file.size)}).\n` +
                `Отправить как:\n` +
                `• Текст — можно сразу просмотреть в Telegram\n` +
                `• Файл — сохранит форматирование\n\n` +
                `Выберите "OK" для отправки текстом, "Отмена" для отправки файлом`
            );
            
            return sendAsText ? 'text' : 'file';
        }
    }
    
    return 'file'; // По умолчанию отправляем как файл
}


// ========================================
// МОДУЛЬ ОБРАБОТКИ JSON С СЛУЖЕБНЫМИ СЛОВАМИ
// ========================================

/**
 * Обрабатывает JSON-файл с командой
 * @param {File} jsonFile - JSON файл для обработки
 * @param {string} command - Служебное слово/команда
 * @returns {Promise<Object>} - Результат обработки
 */
async function processJsonWithCommand(jsonFile, command) {
    console.log(`🚀 Обработка файла с командой: ${command}`);
    
    try {
        // 1. ВАЛИДАЦИЯ ВХОДНЫХ ДАННЫХ
        validateInput(jsonFile, command);
        
        // 2. ЧТЕНИЕ И ПАРСИНГ JSON
        const jsonData = await parseJsonFile(jsonFile);
        console.log(`📊 Файл прочитан: ${jsonFile.name}, тип: ${detectDataType(jsonData)}`);
        
        // 3. ОБРАБОТКА В ЗАВИСИМОСТИ ОТ КОМАНДЫ
        const result = await processByCommand(jsonData, command, jsonFile.name);
        
        // 4. ЛОГИРОВАНИЕ И ВОЗВРАТ РЕЗУЛЬТАТА
        logProcessingResult(result, command);
        
        return result;
        
    } catch (error) {
        console.error(`❌ Ошибка обработки (${command}):`, error);
        throw error;
    }
}

// ========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ========================================

/**
 * Валидация входных данных
 */
function validateInput(jsonFile, command) {
    if (!jsonFile) {
        throw new Error('Файл не предоставлен');
    }
    
    if (!command || typeof command !== 'string') {
        throw new Error('Команда не указана или неверного типа');
    }
    
    if (!jsonFile.name.endsWith('.json') && jsonFile.type !== 'application/json') {
        throw new Error('Файл должен быть в формате JSON');
    }
    
    // Проверка размера файла (макс 50MB)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (jsonFile.size > MAX_SIZE) {
        throw new Error(`Файл слишком большой (${formatFileSize(jsonFile.size)} > ${formatFileSize(MAX_SIZE)})`);
    }
}

/**
 * Чтение и парсинг JSON файла
 */
async function parseJsonFile(jsonFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                const jsonData = JSON.parse(content);
                resolve(jsonData);
            } catch (error) {
                reject(new Error(`Невалидный JSON: ${error.message}`));
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Ошибка чтения файла'));
        };
        
        reader.readAsText(jsonFile);
    });
}

/**
 * Обработка данных в зависимости от команды
 */
async function processByCommand(jsonData, command, fileName) {
    const commandHandlers = {
        // ============ ИМПОРТ ДАННЫХ ============
        'import': async () => await importData(jsonData),
        'import_students': async () => await importStudents(jsonData.students || jsonData),
        'import_tasks': async () => await importTasks(jsonData.tasks || jsonData),
        'import_results': async () => await importResults(jsonData.results || jsonData),
        
        // ============ ЭКСПОРТ ДАННЫХ ============
        'export': async () => await exportData(jsonData),
        'export_backup': async () => await createBackup(jsonData),
        
        // ============ ВАЛИДАЦИЯ ============
        'validate': async () => await validateData(jsonData),
        'check_errors': async () => await checkForErrors(jsonData),
        'validate_schema': async () => await validateSchema(jsonData),
        
        // ============ АНАЛИЗ ============
        'analyze': async () => await analyzeData(jsonData),
        'statistics': async () => await getStatistics(jsonData),
        'find_issues': async () => await findIssues(jsonData),
        
        // ============ КОНВЕРТАЦИЯ ============
        'convert': async () => await convertFormat(jsonData),
        'normalize': async () => await normalizeData(jsonData),
        'merge': async () => await mergeWithCurrent(jsonData),
        
        // ============ СЛУЖЕБНЫЕ ============
        'ping': async () => ({ status: 'ok', message: 'Сервис работает', timestamp: new Date().toISOString() }),
        'test': async () => ({ 
            status: 'test_success', 
            fileName: fileName,
            dataType: detectDataType(jsonData),
            size: Object.keys(jsonData).length,
            sample: getDataSample(jsonData)
        }),
        
        // ============ ДЛЯ TELEGRAM БОТА ============
        'telegram_import': async () => await telegramImport(jsonData),
        'auto_process': async () => await autoProcess(jsonData),
        'quick_update': async () => await quickUpdate(jsonData),
		
		'predict': async () => await predictTrends(jsonData),
		'cluster': async () => await clusterStudents(jsonData),
		'export_pdf': async () => await exportToPdf(jsonData),
		'sync_google': async () => await syncWithGoogle(jsonData),
		'ai_analyze': async () => await aiAnalysis(jsonData)
    };
    
    // Ищем обработчик для команды
    const handler = commandHandlers[command.toLowerCase()];
    
    if (!handler) {
        throw new Error(`Неизвестная команда: ${command}. Доступные: ${Object.keys(commandHandlers).join(', ')}`);
    }
    
    // Выполняем обработчик
    const result = await handler();
    
    return {
        command: command,
        fileName: fileName,
        timestamp: new Date().toISOString(),
        dataType: detectDataType(jsonData),
        ...result
    };
}

// ========================================
// РЕАЛИЗАЦИЯ ОБРАБОТЧИКОВ КОМАНД
// ========================================

/**
 * Импорт данных в систему
 */
async function importData(jsonData) {
    console.log('📥 Импорт данных...');
    
    // Проверяем, что это полные данные системы
    if (!jsonData.students || !jsonData.tasks) {
        throw new Error('Неполные данные для импорта');
    }
    
    // Сохраняем в глобальную переменную appData
    window.appData = {
        ...window.appData,
        ...jsonData,
        importedAt: new Date().toISOString()
    };
    
    // Сохраняем в localStorage
    localStorage.setItem('appData', JSON.stringify(window.appData));
    
    return {
        status: 'imported',
        imported: {
            students: jsonData.students?.length || 0,
            tasks: jsonData.tasks?.length || 0,
            results: Array.isArray(jsonData.results) ? jsonData.results.length : 'object'
        },
        message: 'Данные успешно импортированы',
        nextStep: 'Перезагрузите страницу для применения изменений'
    };
}

/**
 * Импорт только студентов
 */
async function importStudents(studentsData) {
    const students = Array.isArray(studentsData) ? studentsData : studentsData.students || [];
    
    if (!students.length) {
        throw new Error('Нет данных о студентах');
    }
    
    // Обновляем студентов
    window.appData.students = students;
    
    return {
        status: 'students_imported',
        count: students.length,
        sample: students.slice(0, 3).map(s => `${s.lastName} ${s.firstName}`)
    };
}

/**
 * Импорт только заданий
 */
async function importTasks(tasksData) {
    const tasks = Array.isArray(tasksData) ? tasksData : tasksData.tasks || [];
    
    if (!tasks.length) {
        throw new Error('Нет данных о заданиях');
    }
    
    // Обновляем задания
    window.appData.tasks = tasks;
    
    return {
        status: 'tasks_imported',
        count: tasks.length,
        sample: tasks.slice(0, 3).map(t => `№${t.number}: ${t.text.substring(0, 50)}...`)
    };
}

/**
 * Валидация данных
 */
async function validateData(jsonData) {
    const errors = [];
    const warnings = [];
    
    // Проверка структуры
    if (jsonData.students && !Array.isArray(jsonData.students)) {
        errors.push('Студенты должны быть массивом');
    }
    
    if (jsonData.tasks && !Array.isArray(jsonData.tasks)) {
        errors.push('Задания должны быть массивом');
    }
    
    // Проверка студентов
    if (jsonData.students) {
        jsonData.students.forEach((student, index) => {
            if (!student.id) warnings.push(`Студент ${index} не имеет ID`);
            if (!student.lastName || !student.firstName) {
                errors.push(`Студент ${index} не имеет полного имени`);
            }
        });
    }
    
    // Проверка заданий
    if (jsonData.tasks) {
        jsonData.tasks.forEach((task, index) => {
            if (!task.id) warnings.push(`Задание ${index} не имеет ID`);
            if (task.maxScore === undefined) {
                errors.push(`Задание ${index} не имеет maxScore`);
            }
        });
    }
    
    return {
        status: errors.length > 0 ? 'invalid' : 'valid',
        errors: errors,
        warnings: warnings,
        summary: {
            students: jsonData.students?.length || 0,
            tasks: jsonData.tasks?.length || 0,
            results: jsonData.results ? (Array.isArray(jsonData.results) ? jsonData.results.length : 'object') : 0
        }
    };
}

/**
 * Анализ данных
 */
async function analyzeData(jsonData) {
    const analysis = {
        dataType: detectDataType(jsonData),
        statistics: {},
        recommendations: []
    };
    
    // Статистика по студентам
    if (jsonData.students) {
        analysis.statistics.students = {
            count: jsonData.students.length,
            withFullName: jsonData.students.filter(s => s.lastName && s.firstName).length,
            withId: jsonData.students.filter(s => s.id).length,
            presentCount: jsonData.students.filter(s => s.isPresent !== false).length
        };
    }
    
    // Статистика по заданиям
    if (jsonData.tasks) {
        const levels = {};
        jsonData.tasks.forEach(task => {
            levels[task.level] = (levels[task.level] || 0) + 1;
        });
        
        analysis.statistics.tasks = {
            count: jsonData.tasks.length,
            byLevel: levels,
            withMaxScore: jsonData.tasks.filter(t => t.maxScore !== undefined).length
        };
    }
    
    // Рекомендации
    if (jsonData.students && jsonData.students.length > 30) {
        analysis.recommendations.push('Большое количество студентов. Рассмотрите разделение на группы.');
    }
    
    if (jsonData.tasks && jsonData.tasks.filter(t => t.level >= 3).length === 0) {
        analysis.recommendations.push('Нет заданий высокого уровня сложности. Добавьте аналитические задачи.');
    }
    
    return analysis;
}

/**
 * Создание резервной копии
 */
async function createBackup(jsonData) {
    const backup = {
        version: '1.0',
        backupDate: new Date().toISOString(),
        data: jsonData,
        metadata: {
            dataType: detectDataType(jsonData),
            size: JSON.stringify(jsonData).length,
            checksum: simpleChecksum(JSON.stringify(jsonData))
        }
    };
    
    // Генерируем имя файла
    const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    // Создаем и скачиваем файл
    downloadJsonFile(JSON.stringify(backup, null, 2), fileName);
    
    return {
        status: 'backup_created',
        fileName: fileName,
        size: backup.metadata.size,
        checksum: backup.metadata.checksum
    };
}

/**
 * Автоматическая обработка (интеллектуальная)
 */
async function autoProcess(jsonData) {
    const dataType = detectDataType(jsonData);
    
    // Определяем что делать с данными
    let action = 'unknown';
    let message = '';
    
    if (dataType.includes('Полные данные')) {
        action = 'import';
        message = 'Обнаружены полные данные системы. Рекомендуется импорт.';
    } else if (dataType.includes('Список студентов')) {
        action = 'import_students';
        message = 'Обнаружен список студентов. Можно импортировать.';
    } else if (dataType.includes('Задания')) {
        action = 'import_tasks';
        message = 'Обнаружены задания. Можно импортировать.';
    } else if (dataType.includes('Настройки')) {
        action = 'merge';
        message = 'Обнаружены настройки. Можно объединить с текущими.';
    }
    
    // Выполняем рекомендованное действие
    let result = {};
    if (action !== 'unknown') {
        try {
            result = await processByCommand(jsonData, action, 'auto_detected');
        } catch (error) {
            action = 'validate';
            result = await processByCommand(jsonData, 'validate', 'auto_detected');
            message = `Не удалось выполнить ${action}: ${error.message}. Валидация выполнена.`;
        }
    }
    
    return {
        status: 'auto_processed',
        detectedType: dataType,
        recommendedAction: action,
        performedAction: action,
        message: message,
        result: result
    };
}

// ========================================
// УТИЛИТЫ
// ========================================

/**
 * Простая контрольная сумма
 */
function simpleChecksum(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Преобразование в 32-битное целое
    }
    return Math.abs(hash).toString(16).substring(0, 8);
}

/**
 * Получение образца данных
 */
function getDataSample(jsonData, limit = 3) {
    if (Array.isArray(jsonData)) {
        return jsonData.slice(0, limit);
    } else if (typeof jsonData === 'object') {
        const sample = {};
        Object.keys(jsonData).slice(0, limit).forEach(key => {
            if (Array.isArray(jsonData[key])) {
                sample[key] = jsonData[key].slice(0, 2);
            } else {
                sample[key] = jsonData[key];
            }
        });
        return sample;
    }
    return jsonData;
}

/**
 * Логирование результата обработки
 */
function logProcessingResult(result, command) {
    console.group(`✅ Обработка команды "${command}" завершена`);
    console.log('Результат:', result);
    
    if (result.status === 'error' || result.errors) {
        console.warn('⚠️ Были обнаружены ошибки:', result.errors);
    }
    
    if (result.warnings && result.warnings.length > 0) {
        console.warn('⚠️ Предупреждения:', result.warnings);
    }
    
    console.groupEnd();
}

// ========================================
// ИНТЕГРАЦИЯ С ФОРМОЙ ОБРАТНОЙ СВЯЗИ
// ========================================

/**
 * Расширенная функция отправки с командой
 */
async function sendJsonWithCommand(event, command = 'auto_process') {
    event.preventDefault();
    
    if (!selectedFile) {
        showNotification('❌ Выберите JSON файл для отправки', 'error');
        return;
    }
    
    showSendingIndicator();
    
    try {
        // 1. Обрабатываем файл локально
        const processingResult = await processJsonWithCommand(selectedFile, command);
        
        // 2. Отправляем информационное сообщение в Telegram
        const infoMessage = await sendInfoMessage(
            document.getElementById('feedbackName').value.trim() || 'Система',
            'data_processing',
            'medium',
            true,
            `Обработка JSON с командой: ${command}\n\nСтатус: ${processingResult.status}`
        );
        
        // 3. Отправляем результат обработки как файл
        const resultFile = new File(
            [JSON.stringify(processingResult, null, 2)],
            `processing_result_${command}_${new Date().getTime()}.json`,
            { type: 'application/json' }
        );
        
        await sendFileAsDocument(resultFile, infoMessage.message_id);
        
        // 4. Отправляем оригинальный файл
        await sendFileAsDocument(selectedFile, infoMessage.message_id);
        
        // 5. Успех
        hideSendingIndicator();
        showNotification(`✅ Файл обработан командой "${command}" и отправлен`, 'success');
        
        // 6. Сохраняем в историю
        saveFeedbackToStorage({
            id: 'fb_' + Date.now(),
            timestamp: new Date().toISOString(),
            name: document.getElementById('feedbackName').value.trim() || 'Аноним',
            type: 'data_processing',
            command: command,
            fileName: selectedFile.name,
            processingResult: processingResult.status,
            status: 'processed_and_sent'
        });
        
        // 7. Очищаем форму
        clearFeedbackForm();
        removeFile();
        
        // 8. Обновляем UI
        loadFeedbackHistory();
        updateStats();
        
    } catch (error) {
        hideSendingIndicator();
        console.error('❌ Ошибка обработки с командой:', error);
        showNotification(`❌ Ошибка обработки: ${error.message}`, 'error');
    }
}

// ========================================
// ИНТЕРФЕЙС ДЛЯ ВЫБОРА КОМАНД
// ========================================

/**
 * Показывает диалог выбора команды
 */
function showCommandSelector() {
    const commands = [
        { value: 'import', label: '📥 Импорт данных', description: 'Полный импорт в систему' },
        { value: 'validate', label: '✅ Валидация', description: 'Проверка структуры данных' },
        { value: 'analyze', label: '📊 Анализ', description: 'Статистика и рекомендации' },
        { value: 'export_backup', label: '💾 Резервная копия', description: 'Создание бэкапа' },
        { value: 'auto_process', label: '🤖 Автообработка', description: 'Интеллектуальная обработка' },
        { value: 'test', label: '🧪 Тест', description: 'Проверка работы' }
    ];
    
    const modalHtml = `
        <div style="max-width: 600px; padding: 25px;">
            <h3 style="color: #2c3e50; margin-bottom: 20px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                <i class="fas fa-terminal me-2"></i>Выберите команду обработки
            </h3>
            
            <p style="color: #7f8c8d; margin-bottom: 25px;">
                Выберите действие для обработки JSON файла. Команда будет передана вместе с файлом.
            </p>
            
            <div id="commandList" style="margin-bottom: 25px;">
                ${commands.map(cmd => `
                    <label class="command-option" 
                           style="display: block; margin-bottom: 12px; cursor: pointer;">
                        <input type="radio" name="processingCommand" value="${cmd.value}" 
                               style="margin-right: 10px;">
                        <div style="display: inline-block; padding: 15px; background: #f8f9fa; border: 2px solid #ddd; border-radius: 10px; width: 100%; transition: all 0.3s;">
                            <div style="font-weight: 600; color: #2c3e50; margin-bottom: 5px;">
                                ${cmd.label}
                            </div>
                            <div style="font-size: 13px; color: #7f8c8d;">
                                ${cmd.description}
                            </div>
                        </div>
                    </label>
                `).join('')}
            </div>
            
            <div style="display: flex; gap: 15px;">
                <button onclick="closeModal()" 
                        style="flex: 1; padding: 15px; background: #f8f9fa; color: #34495e; border: 2px solid #ddd; border-radius: 10px; font-weight: 600; cursor: pointer;">
                    Отмена
                </button>
                <button onclick="executeSelectedCommand()" 
                        style="flex: 1; padding: 15px; background: linear-gradient(135deg, #3498db, #2980b9); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">
                    <i class="fas fa-play me-2"></i> Выполнить
                </button>
            </div>
        </div>
    `;
    
    showModal('🎯 Команда обработки JSON', modalHtml);
    
    // Добавляем обработчики для выбора команд
    setTimeout(() => {
        document.querySelectorAll('.command-option').forEach(option => {
            option.addEventListener('click', function() {
                const radio = this.querySelector('input[type="radio"]');
                radio.checked = true;
                
                // Сбрасываем стили
                document.querySelectorAll('.command-option div').forEach(div => {
                    div.style.background = '#f8f9fa';
                    div.style.borderColor = '#ddd';
                });
                
                // Подсвечиваем выбранную
                const selectedDiv = this.querySelector('div');
                selectedDiv.style.background = '#e8f4fc';
                selectedDiv.style.borderColor = '#3498db';
            });
        });
    }, 100);
}

/**
 * Выполняет выбранную команду
 */
function executeSelectedCommand() {
    const selectedCommand = document.querySelector('input[name="processingCommand"]:checked');
    
    if (!selectedCommand) {
        showNotification('❌ Выберите команду обработки', 'error');
        return;
    }
    
    if (!selectedFile) {
        showNotification('❌ Выберите JSON файл', 'error');
        closeModal();
        return;
    }
    
    closeModal();
    
    // Создаем искусственное событие для отправки
    const fakeEvent = {
        preventDefault: () => {}
    };
    
    // Вызываем функцию отправки с командой
    sendJsonWithCommand(fakeEvent, selectedCommand.value);
}

// Обработка файла с командой
// const file = document.getElementById('jsonFile').files[0];
// const result = await processJsonWithCommand(file, 'import');

// Результат содержит:
// {
//   command: 'import',
//   status: 'imported',
//   fileName: 'data.json',
//   imported: { students: 25, tasks: 15 },
//   timestamp: '2024-12-20T10:30:00.000Z'
// }
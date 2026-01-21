const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors({
    origin: ['https://dimono39.github.io', 'http://localhost:8000'], // Разрешаем ваш домен GitHub Pages
    credentials: true
}));
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Роут для Yandex GPT API
app.post('/api/yandex-gpt', async (req, res) => {
    console.log('Получен запрос к Yandex GPT API');
    
    try {
        const { apiKey, folderId, model, prompt, systemPrompt, maxTokens } = req.body;
        
        if (!apiKey || !folderId || !model || !prompt) {
            return res.status(400).json({ 
                error: 'Отсутствуют обязательные параметры: apiKey, folderId, model, prompt' 
            });
        }

        const requestBody = {
            modelUri: `gpt://${folderId}/${model}`,
            completionOptions: {
                stream: false,
                temperature: 0.6,
                maxTokens: maxTokens || 2000
            },
            messages: [
                {
                    role: "system",
                    text: systemPrompt || "Ты полезный помощник для учителей, специализирующийся на создании образовательных материалов, структурировании информации и генерации идей для уроков."
                },
                {
                    role: "user",
                    text: prompt
                }
            ]
        };

        const response = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Api-Key ${apiKey}`,
                'x-data-logging-enabled': 'false'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('Ошибка Yandex API:', data);
            return res.status(response.status).json({ 
                error: data.message || 'Ошибка Yandex GPT API',
                details: data
            });
        }

        res.json(data);
        
    } catch (error) {
        console.error('Ошибка прокси:', error);
        res.status(500).json({ 
            error: 'Внутренняя ошибка сервера',
            message: error.message 
        });
    }
});

// Тестовый роут для проверки работы
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        message: 'Прокси-сервер работает',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`Прокси-сервер запущен на порту ${PORT}`);
    console.log(`Доступные роуты:`);
    console.log(`- GET  /api/health - проверка работы сервера`);
    console.log(`- POST /api/yandex-gpt - прокси для Yandex GPT API`);
});
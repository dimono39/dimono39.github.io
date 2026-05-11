from flask import Flask, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)
CORS(app)  # Разрешаем запросы с вашего сайта

@app.route('/api/food/<code>')
def get_food_data(code):
    # Загружаем страницу с сервера (без CORS ограничений)
    url = f'https://мониторингпитание.рф/#/profile?id={code}'
    response = requests.get(url)
    
    # Парсим HTML
    soup = BeautifulSoup(response.text, 'html.parser')
    # Извлекаем нужные данные...
    
    return jsonify({'code': code, 'data': '...'})

if __name__ == '__main__':
    app.run(port=5000)
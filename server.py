from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import re
import json
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)  # Разрешаем запросы с любого домена

# Хранилище для кэширования данных (чтобы не грузить сервер каждую секунду)
cache = {}

def extract_menu_from_html(html_content):
    """Извлекает данные меню из HTML"""
    soup = BeautifulSoup(html_content, 'html.parser')
    
    menu_data = {
        'basic_info': {},
        'daily_menu': [],
        'errors': [],
        'statistics': {}
    }
    
    # 1. Ищем основную информацию
    info_cells = soup.find_all('td', string=re.compile('Код|Наименование|Район|Регион|Сайт'))
    for cell in info_cells:
        label = cell.get_text(strip=True)
        value_cell = cell.find_next('td')
        if value_cell:
            value = value_cell.get_text(strip=True)
            if 'Код' in label:
                menu_data['basic_info']['code'] = value
            elif 'Наименование' in label:
                menu_data['basic_info']['name'] = value
            elif 'Район' in label:
                menu_data['basic_info']['district'] = value
            elif 'Регион' in label:
                menu_data['basic_info']['region'] = value
            elif 'Сайт' in label:
                menu_data['basic_info']['website'] = value
    
    # 2. Ищем данные по пищеблоку из выпадающих списков
    region_field = soup.find('div', {'id': 'Region'})
    if region_field:
        region_value = region_field.find('div', {'class': 'dx-lookup-field'})
        if region_value:
            menu_data['basic_info']['selected_region'] = region_value.get_text(strip=True)
    
    pisheblok_field = soup.find('div', {'id': 'Pisheblok'})
    if pisheblok_field:
        pisheblok_value = pisheblok_field.find('div', {'class': 'dx-lookup-field'})
        if pisheblok_value:
            menu_data['basic_info']['selected_school'] = pisheblok_value.get_text(strip=True)
    
    # 3. Ищем таблицу с меню
    tables = soup.find_all('table', {'class': re.compile('dx-datagrid-table')})
    
    for table in tables:
        rows = table.find_all('tr', {'class': 'dx-data-row'})
        for row in rows:
            cells = row.find_all('td')
            if len(cells) >= 3:
                menu_item = {
                    'date': cells[0].get_text(strip=True) if len(cells) > 0 else '',
                    'meal_type': cells[1].get_text(strip=True) if len(cells) > 1 else '',
                    'weight': cells[2].get_text(strip=True) if len(cells) > 2 else '',
                    'price': cells[3].get_text(strip=True) if len(cells) > 3 else '',
                    'calories': cells[4].get_text(strip=True) if len(cells) > 4 else '',
                    'proteins': cells[5].get_text(strip=True) if len(cells) > 5 else '',
                    'fats': cells[6].get_text(strip=True) if len(cells) > 6 else '',
                    'carbs': cells[7].get_text(strip=True) if len(cells) > 7 else '',
                    'errors': cells[8].get_text(strip=True) if len(cells) > 8 else ''
                }
                # Добавляем только если есть дата
                if menu_item['date'] and menu_item['date'] not in ['', '-']:
                    menu_data['daily_menu'].append(menu_item)
    
    # 4. Ищем ошибки в меню
    error_tables = soup.find_all('div', {'class': 'dx-datagrid'})
    for table in error_tables:
        error_rows = table.find_all('tr', {'class': 'dx-data-row'})
        for row in error_rows:
            cells = row.find_all('td')
            if len(cells) >= 3:
                error = {
                    'date': cells[0].get_text(strip=True) if len(cells) > 0 else '',
                    'meal': cells[1].get_text(strip=True) if len(cells) > 1 else '',
                    'error_type': cells[2].get_text(strip=True) if len(cells) > 2 else '',
                    'description': cells[3].get_text(strip=True) if len(cells) > 3 else ''
                }
                if error['date']:
                    menu_data['errors'].append(error)
    
    # 5. Собираем статистику
    menu_data['statistics'] = {
        'total_days': len(set(item['date'] for item in menu_data['daily_menu'])),
        'total_meals': len(menu_data['daily_menu']),
        'total_errors': len(menu_data['errors']),
        'last_update': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    return menu_data

@app.route('/api/food/<code>', methods=['GET'])
def get_food_data(code):
    """Главный API эндпоинт для получения данных о пищеблоке"""
    
    # Проверяем кэш (данные актуальны 5 минут)
    if code in cache and (datetime.now() - cache[code]['time']).seconds < 300:
        return jsonify({
            'success': True,
            'cached': True,
            'data': cache[code]['data'],
            'message': 'Данные из кэша (обновлены менее 5 минут назад)'
        })
    
    # URL страницы с данными
    urls = [
        f'https://xn--80afhjabb0ajcdecrl4ah.xn--p1ai/#/profile?id={code}',
        f'https://мониторингпитание.рф/#/profile?id={code}'
    ]
    
    for url in urls:
        try:
            print(f"Пробуем загрузить: {url}")
            
            # Добавляем заголовки, чтобы имитировать реальный браузер
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                'Connection': 'keep-alive',
            }
            
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                # Парсим HTML
                menu_data = extract_menu_from_html(response.text)
                menu_data['basic_info']['requested_code'] = code
                menu_data['source_url'] = url
                
                # Сохраняем в кэш
                cache[code] = {
                    'data': menu_data,
                    'time': datetime.now()
                }
                
                return jsonify({
                    'success': True,
                    'cached': False,
                    'data': menu_data,
                    'message': f'Данные успешно загружены с {url}'
                })
            else:
                print(f"Ошибка {response.status_code} от {url}")
                
        except requests.exceptions.Timeout:
            print(f"Таймаут при загрузке {url}")
        except requests.exceptions.RequestException as e:
            print(f"Ошибка при запросе к {url}: {str(e)}")
    
    return jsonify({
        'success': False,
        'message': 'Не удалось загрузить данные. Сервер временно недоступен или код пищеблока не существует.',
        'code': code
    }), 404

@app.route('/api/search', methods=['GET'])
def search_schools():
    """Поиск школ по названию"""
    query = request.args.get('q', '')
    if not query:
        return jsonify({'success': False, 'message': 'Укажите поисковый запрос'})
    
    # Здесь можно добавить логику поиска, если найдете API поиска
    return jsonify({
        'success': False,
        'message': 'Поиск пока не реализован. Используйте прямой ввод кода.'
    })

@app.route('/')
def serve_index():
    """Сервер главной страницы"""
    return send_from_directory('.', 'client.html')

@app.route('/test')
def test():
    """Тестовый эндпоинт"""
    return jsonify({
        'status': 'ok',
        'message': 'Сервер работает!',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("=" * 50)
    print("🍽️ Сервер мониторинга питания запущен!")
    print("=" * 50)
    print(f"📍 Локальный адрес: http://localhost:5000")
    print(f"📍 Тестовый эндпоинт: http://localhost:5000/test")
    print(f"📍 API для пищеблока: http://localhost:5000/api/food/28605")
    print("=" * 50)
    print("Нажмите Ctrl+C для остановки сервера")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5000, debug=True)
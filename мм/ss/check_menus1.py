import pandas as pd
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import re
import time
import sys
from datetime import datetime

# Настройки
INPUT_FILE = "ss.xlsx"
OUTPUT_FILE = "ss_checked.xlsx"
REQUEST_TIMEOUT = 15  # секунд
DELAY_BETWEEN_REQUESTS = 1  # секунда, чтобы не заблокировали
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Регулярные выражения для поиска файлов
PATTERNS = {
    "tm": re.compile(r"tm\d{4}\.xlsx?$", re.IGNORECASE),
    "kp": re.compile(r"kp\d{4}\.xlsx?$", re.IGNORECASE),
    "daily": re.compile(r"\d{4}-\d{2}-\d{2}-sm\.xlsx?$", re.IGNORECASE),
}

def get_html(url, session):
    try:
        response = session.get(url, timeout=REQUEST_TIMEOUT, headers={"User-Agent": USER_AGENT})
        response.raise_for_status()
        return response.text
    except Exception as e:
        return None

def check_url_availability(url, session):
    """Проверяет, доступен ли файл по ссылке (HEAD-запрос, при неудаче GET)."""
    try:
        response = session.head(url, timeout=REQUEST_TIMEOUT, headers={"User-Agent": USER_AGENT}, allow_redirects=True)
        if response.status_code in (200, 403): # 403 часто означает, что файл есть, но доступ ограничен (иногда так отдают S3)
            return True
        # Если HEAD не поддерживается, пробуем GET
        response = session.get(url, timeout=REQUEST_TIMEOUT, headers={"User-Agent": USER_AGENT}, stream=True, allow_redirects=True)
        if response.status_code == 200:
            return True
        return False
    except Exception:
        return False

def extract_links(html, base_url):
    """Извлекает все ссылки на .xlsx из HTML."""
    soup = BeautifulSoup(html, "html.parser")
    links = set()
    for a_tag in soup.find_all("a", href=True):
        href = a_tag["href"]
        # Абсолютный URL
        abs_url = urljoin(base_url, href)
        # Очищаем от якорей и параметров
        clean_url = abs_url.split("#")[0].split("?")[0]
        if clean_url.lower().endswith((".xlsx", ".xls")):
            links.add(abs_url)
    return list(links)

def classify_file(filename):
    for file_type, pattern in PATTERNS.items():
        if pattern.search(filename):
            return file_type
    return "other"

def main():
    print("="*60)
    print("ЗАПУСК ПРОВЕРКИ ФАЙЛОВ МЕНЮ")
    print("="*60)

    # 1. Читаем Excel
    try:
        df = pd.read_excel(INPUT_FILE)
    except Exception as e:
        print(f"❌ Ошибка чтения файла {INPUT_FILE}: {e}")
        sys.exit(1)

    print(f"📄 Загружено строк: {len(df)}")
    
    # Приводим названия колонок к нижнему регистру для удобства
    df.columns = [str(c).strip().lower() for c in df.columns]
    
    # Ищем нужные колонки (или берем по индексу, если не нашли)
    # Ваш файл: Пищеблок, Район, Ссылка, Код пищеблока
    col_name = next((c for c in df.columns if "пищеблок" in c or "наимен" in c), df.columns[0])
    col_url = next((c for c in df.columns if "ссылк" in c or "url" in c or "сайт" in c), df.columns[2])
    col_code = next((c for c in df.columns if "код" in c), df.columns[3])

    session = requests.Session()
    
    # Добавляем колонки для результатов
    df["Статус страницы"] = ""
    df["Файлы (тип: имя)"] = ""
    df["Всего файлов"] = 0
    df["Доступно"] = 0
    df["Недоступно"] = 0

    total_rows = len(df)
    for idx, row in df.iterrows():
        code = str(row[col_code]).strip()
        name = str(row[col_name]).strip()
        url = str(row[col_url]).strip()

        print(f"\n[{idx+1}/{total_rows}] Пищеблок {code} — {name[:50]}...")
        
        if not url.startswith("http"):
            print(f"  ⚠ Пропуск: нет валидной ссылки ({url})")
            df.at[idx, "Статус страницы"] = "Нет ссылки"
            continue

        # 2. Загружаем страницу
        html = get_html(url, session)
        if not html:
            print(f"  ❌ Не удалось загрузить страницу {url}")
            df.at[idx, "Статус страницы"] = "Ошибка загрузки"
            continue
        
        print(f"  ✅ Страница загружена, ищем ссылки...")
        df.at[idx, "Статус страницы"] = "OK"

        # 3. Извлекаем ссылки
        all_links = extract_links(html, url)
        
        # Фильтруем по типам
        found_files = []
        for link in all_links:
            filename = link.split("/")[-1]
            ftype = classify_file(filename)
            if ftype in ("tm", "kp", "daily"):
                found_files.append((ftype, filename, link))
        
        if not found_files:
            print(f"  ⚠ Ссылок на файлы не найдено")
            df.at[idx, "Файлы (тип: имя)"] = "Не найдено"
            continue

        print(f"  Найдено файлов: {len(found_files)}. Проверяем доступность...")
        
        available_count = 0
        unavailable_count = 0
        file_details = []

        for ftype, filename, link in found_files:
            # Проверяем доступность
            is_available = check_url_availability(link, session)
            status_icon = "✅" if is_available else "❌"
            print(f"    {status_icon} [{ftype}] {filename}")
            
            if is_available:
                available_count += 1
            else:
                unavailable_count += 1
            
            file_details.append(f"{ftype}:{filename}:{'OK' if is_available else 'FAIL'}")
            
            # Небольшая пауза между запросами к файлам
            time.sleep(0.3)

        df.at[idx, "Всего файлов"] = len(found_files)
        df.at[idx, "Доступно"] = available_count
        df.at[idx, "Недоступно"] = unavailable_count
        df.at[idx, "Файлы (тип: имя)"] = ", ".join(file_details)

        # Пауза между пищеблоками
        time.sleep(DELAY_BETWEEN_REQUESTS)

    # 4. Сохраняем результат
    print("\n" + "="*60)
    print("СОХРАНЕНИЕ РЕЗУЛЬТАТОВ...")
    try:
        df.to_excel(OUTPUT_FILE, index=False)
        print(f"✅ Результаты сохранены в файл: {OUTPUT_FILE}")
    except Exception as e:
        print(f"❌ Ошибка сохранения: {e}")

    # Итоговая статистика
    total_files = df["Всего файлов"].sum()
    total_available = df["Доступно"].sum()
    total_unavailable = df["Недоступно"].sum()
    
    print("\n" + "="*60)
    print("ИТОГОВАЯ СТАТИСТИКА")
    print("="*60)
    print(f"Всего пищеблоков: {total_rows}")
    print(f"Всего найдено файлов: {total_files}")
    print(f"✅ Доступно: {total_available}")
    print(f"❌ Недоступно: {total_unavailable}")

if __name__ == "__main__":
    main()
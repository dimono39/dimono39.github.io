import pandas as pd
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import re
import time
import sys
from datetime import datetime, timedelta

# Настройки
INPUT_FILE = "ss.xlsx"
OUTPUT_FILE = "ss_checked.xlsx"
REQUEST_TIMEOUT = 15
DELAY_BETWEEN_REQUESTS = 1.0  # пауза между пищеблоками (сек)
DELAY_BETWEEN_FILES = 0.3     # пауза между файлами (сек)
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Вычисляем нужные даты
TODAY = datetime.now().date()
TOMORROW = TODAY + timedelta(days=1)
TARGET_DATES = {
    TODAY.strftime("%Y-%m-%d"),
    TOMORROW.strftime("%Y-%m-%d")
}

# Регулярные выражения
PATTERN_TM = re.compile(r"^tm\d{4}\.xlsx?$", re.IGNORECASE)
PATTERN_KP = re.compile(r"^kp\d{4}\.xlsx?$", re.IGNORECASE)
PATTERN_DAILY = re.compile(r"^(\d{4}-\d{2}-\d{2})-sm\.xlsx?$", re.IGNORECASE)

def get_html(url, session):
    try:
        response = session.get(url, timeout=REQUEST_TIMEOUT, headers={"User-Agent": USER_AGENT})
        response.raise_for_status()
        return response.text
    except Exception as e:
        return None

def check_url_availability(url, session):
    """Проверяет доступность файла (HEAD, затем GET)."""
    try:
        response = session.head(url, timeout=REQUEST_TIMEOUT, headers={"User-Agent": USER_AGENT}, allow_redirects=True)
        if response.status_code in (200, 403):
            return True
        response = session.get(url, timeout=REQUEST_TIMEOUT, headers={"User-Agent": USER_AGENT}, stream=True, allow_redirects=True)
        if response.status_code == 200:
            return True
        return False
    except Exception:
        return False

def extract_file_links(html, base_url):
    """Извлекает ссылки на .xlsx из HTML."""
    soup = BeautifulSoup(html, "html.parser")
    links = set()
    for a_tag in soup.find_all("a", href=True):
        href = a_tag["href"]
        abs_url = urljoin(base_url, href)
        clean_url = abs_url.split("#")[0].split("?")[0]
        if clean_url.lower().endswith((".xlsx", ".xls")):
            links.add(abs_url)
    return list(links)

def classify_and_filter(filename):
    """
    Возвращает тип файла, если он нам нужен, иначе None.
    - tm2026.xlsx, kp2026.xlsx — всегда
    - ежедневные — только если дата = сегодня или завтра
    """
    # Имя файла без пути
    base_name = filename.split("/")[-1]
    
    if PATTERN_TM.match(base_name):
        return "tm"
    if PATTERN_KP.match(base_name):
        return "kp"
    
    match = PATTERN_DAILY.match(base_name)
    if match:
        date_str = match.group(1)
        if date_str in TARGET_DATES:
            return "daily"
    
    return None

def main():
    print("="*60)
    print("ПРОВЕРКА ФАЙЛОВ МЕНЮ (СЕГОДНЯ + ЗАВТРА)")
    print("="*60)
    print(f"📅 Сегодня: {TODAY.strftime('%d.%m.%Y')}")
    print(f"📅 Завтра:  {TOMORROW.strftime('%d.%m.%Y')}")
    print()

    # 1. Читаем Excel
    try:
        df = pd.read_excel(INPUT_FILE)
    except Exception as e:
        print(f"❌ Ошибка чтения {INPUT_FILE}: {e}")
        sys.exit(1)

    print(f"📄 Загружено строк: {len(df)}")
    
    df.columns = [str(c).strip().lower() for c in df.columns]
    
    # Ищем колонки (или берем по позиции)
    col_name = next((c for c in df.columns if "пищеблок" in c or "наимен" in c), df.columns[0])
    col_url = next((c for c in df.columns if "ссылк" in c or "url" in c), df.columns[2])
    col_code = next((c for c in df.columns if "код" in c), df.columns[3])

    session = requests.Session()
    
    # Добавляем колонки для результатов
    df["Статус страницы"] = ""
    df["tm2026"] = ""
    df["kp2026"] = ""
    df["Меню сегодня"] = ""
    df["Меню завтра"] = ""
    df["Доп. файлы"] = ""

    total_rows = len(df)
    for idx, row in df.iterrows():
        code = str(row[col_code]).strip()
        name = str(row[col_name]).strip()
        url = str(row[col_url]).strip()

        print(f"\n[{idx+1}/{total_rows}] {code} — {name[:60]}...")
        
        if not url.startswith("http"):
            print(f"  ⚠ Пропуск: нет ссылки")
            df.at[idx, "Статус страницы"] = "Нет ссылки"
            continue

        # 2. Загружаем страницу
        html = get_html(url, session)
        if not html:
            print(f"  ❌ Не удалось загрузить страницу")
            df.at[idx, "Статус страницы"] = "Ошибка загрузки"
            continue
        
        print(f"  ✅ Страница загружена")
        df.at[idx, "Статус страницы"] = "OK"

        # 3. Извлекаем ссылки
        all_links = extract_file_links(html, url)
        
        # Группируем по типу: tm, kp, daily_today, daily_tomorrow, other
        results = {
            "tm": [],
            "kp": [],
            "daily_today": [],
            "daily_tomorrow": [],
            "other": []
        }

        for link in all_links:
            filename = link.split("/")[-1]
            ftype = classify_and_filter(filename)
            
            if ftype == "tm":
                results["tm"].append((filename, link))
            elif ftype == "kp":
                results["kp"].append((filename, link))
            elif ftype == "daily":
                # Определяем, сегодня или завтра
                m = PATTERN_DAILY.match(filename)
                if m:
                    date_str = m.group(1)
                    if date_str == TODAY.strftime("%Y-%m-%d"):
                        results["daily_today"].append((filename, link))
                    elif date_str == TOMORROW.strftime("%Y-%m-%d"):
                        results["daily_tomorrow"].append((filename, link))
            else:
                # Прочие .xlsx — на всякий случай запомним
                results["other"].append((filename, link))

        # 4. Проверяем доступность нужных файлов
        def check_and_report(items, label):
            if not items:
                print(f"  ⚠ {label}: не найден")
                return "Не найден"
            statuses = []
            for filename, link in items:
                is_ok = check_url_availability(link, session)
                icon = "✅" if is_ok else "❌"
                print(f"    {icon} [{label}] {filename}")
                statuses.append(f"{filename}:{'OK' if is_ok else 'FAIL'}")
                time.sleep(DELAY_BETWEEN_FILES)
            return ", ".join(statuses)

        df.at[idx, "tm2026"] = check_and_report(results["tm"], "tm")
        df.at[idx, "kp2026"] = check_and_report(results["kp"], "kp")
        df.at[idx, "Меню сегодня"] = check_and_report(results["daily_today"], "сегодня")
        df.at[idx, "Меню завтра"] = check_and_report(results["daily_tomorrow"], "завтра")
        
        if results["other"]:
            df.at[idx, "Доп. файлы"] = ", ".join(f[0] for f in results["other"])

        time.sleep(DELAY_BETWEEN_REQUESTS)

    # 5. Сохраняем
    print("\n" + "="*60)
    print("СОХРАНЕНИЕ...")
    try:
        df.to_excel(OUTPUT_FILE, index=False)
        print(f"✅ Сохранено: {OUTPUT_FILE}")
    except Exception as e:
        print(f"❌ Ошибка сохранения: {e}")

    print("\n" + "="*60)
    print("ГОТОВО")
    print("="*60)

if __name__ == "__main__":
    main()
// ============================================================
// i18n — ЛОКАЛИЗАЦИЯ ИНТЕРФЕЙСА
// ============================================================
// Все строки единого каркаса приложения вынесены сюда.
// Использование:  t('save.success')  ->  "Меню сохранено"
//                 t('save.success', 'en') -> "Menu saved"
// ============================================================

const MESSAGES = {
  ru: {
    // --- Общее ---
    'app.title': 'PRO Редактор типового меню',
    'app.close': 'Закрыть',
    'app.cancel': 'Отмена',
    'app.confirm': 'Подтвердить',
    'app.ok': 'ОК',
    'app.yes': 'Да',
    'app.no': 'Нет',

    // --- Хлебные крошки ---
    'bc.editor': 'Редактор',
    'bc.menu': 'Меню {n}',
    'bc.week': 'Неделя {n}',
    'bc.day': 'День {n}',
    'bc.meal': '{meal}',

    // --- Горячие клавиши ---
    'hk.title': 'Горячие клавиши',
    'hk.switchTab': 'Переключить вкладку {n}',
    'hk.save': 'Сохранить (Ctrl+S)',
    'hk.undo': 'Отменить (Ctrl+Z)',
    'hk.redo': 'Повторить (Ctrl+Y)',
    'hk.search': 'Поиск (Ctrl+F)',
    'hk.generate': 'Сгенерировать (Ctrl+G)',
    'hk.export': 'Экспорт (Ctrl+Shift+E)',
    'hk.help': 'Помощь (F1)',
    'hk.allKeys': 'Все клавиши (?)',
    'hk.hint': 'Нажмите ? для списка всех клавиш',

    // --- Toast ---
    'toast.save': 'Меню сохранено',
    'toast.nothingToSave': 'Нет изменений для сохранения',
    'toast.undo': 'Действие отменено',
    'toast.redo': 'Действие повторено',
    'toast.noUndo': 'Нет действий для отмены',
    'toast.noRedo': 'Нет действий для повтора',
    'toast.exported': 'Экспорт выполнен',
    'toast.imported': 'Импорт выполнен',
    'toast.copied': 'Скопировано в буфер обмена',
    'toast.autosaved': 'Сессия автосохранена',
    'toast.restored': 'Сессия восстановлена',
    'toast.tourDone': 'Тур завершён',
    'toast.themeLight': 'Светлая тема',
    'toast.themeDark': 'Тёмная тема',

    // --- Тёмная тема ---
    'theme.toggle': 'Переключить тему',
    'theme.light': 'Светлая',
    'theme.dark': 'Тёмная',

    // --- Онбординг-тур ---
    'tour.welcome': 'Добро пожаловать! Этот тур познакомит с основами.',
    'tour.skip': 'Пропустить тур',
    'tour.next': 'Далее',
    'tour.prev': 'Назад',
    'tour.finish': 'Завершить',
    'tour.step1': 'Здесь находятся основные вкладки приложения.',
    'tour.step2': 'В редакторе меню вы составляете блюда по приёмам пищи.',
    'tour.step3': 'Календарь позволяет распределить меню по дням месяца.',
    'tour.step4': 'Аналитика показывает соответствие нормам СанПиН.',
    'tour.step5': 'Генератор автоматически создаёт меню по шаблонам.',
    'tour.step6': 'Ежедневное меню — детальный просмотр одного дня.',
    'tour.step7': 'Хлебные крошки показывают текущее положение в меню.',
    'tour.step8': 'Переключатель темы и экспорт сессии — в правом углу шапки.',

    // --- Сессия ---
    'session.export': 'Экспорт сессии',
    'session.import': 'Импорт сессии',
    'session.exported': 'Файл сессии сохранён',
    'session.imported': 'Сессия восстановлена из файла',
    'session.importError': 'Не удалось прочитать файл сессии',
    'session.confirmOverwrite': 'Импорт перезапишет текущие данные. Продолжить?',

    // --- Автосохранение ---
    'autosave.on': 'Автосохранение включено',
    'autosave.off': 'Автосохранение выключено',
    'autosave.saved': 'Сессия сохранена автоматически',

    // --- Журнал действий ---
    'log.title': 'Журнал действий',
    'log.empty': 'Действий пока не записано',
    'log.clear': 'Очистить журнал',

    // --- Вкладки ---
    'tab.main': 'Редактор',
    'tab.calendar': 'Календарь',
    'tab.daily': 'Ежедневное',
    'tab.generator': 'Генератор',
    'tab.analytics': 'Аналитика',
  },

  en: {
    'app.title': 'PRO Menu Template Editor',
    'app.close': 'Close',
    'app.cancel': 'Cancel',
    'app.confirm': 'Confirm',
    'app.ok': 'OK',
    'app.yes': 'Yes',
    'app.no': 'No',

    'bc.editor': 'Editor',
    'bc.menu': 'Menu {n}',
    'bc.week': 'Week {n}',
    'bc.day': 'Day {n}',
    'bc.meal': '{meal}',

    'hk.title': 'Keyboard shortcuts',
    'hk.switchTab': 'Switch to tab {n}',
    'hk.save': 'Save (Ctrl+S)',
    'hk.undo': 'Undo (Ctrl+Z)',
    'hk.redo': 'Redo (Ctrl+Y)',
    'hk.search': 'Search (Ctrl+F)',
    'hk.generate': 'Generate (Ctrl+G)',
    'hk.export': 'Export (Ctrl+Shift+E)',
    'hk.help': 'Help (F1)',
    'hk.allKeys': 'All keys (?)',
    'hk.hint': 'Press ? for the full key list',

    'toast.save': 'Menu saved',
    'toast.nothingToSave': 'Nothing to save',
    'toast.undo': 'Action undone',
    'toast.redo': 'Action redone',
    'toast.noUndo': 'Nothing to undo',
    'toast.noRedo': 'Nothing to redo',
    'toast.exported': 'Export complete',
    'toast.imported': 'Import complete',
    'toast.copied': 'Copied to clipboard',
    'toast.autosaved': 'Session auto-saved',
    'toast.restored': 'Session restored',
    'toast.tourDone': 'Tour finished',
    'toast.themeLight': 'Light theme',
    'toast.themeDark': 'Dark theme',

    'theme.toggle': 'Toggle theme',
    'theme.light': 'Light',
    'theme.dark': 'Dark',

    'tour.welcome': 'Welcome! This tour covers the basics.',
    'tour.skip': 'Skip tour',
    'tour.next': 'Next',
    'tour.prev': 'Back',
    'tour.finish': 'Finish',
    'tour.step1': 'These are the main tabs of the app.',
    'tour.step2': 'In the menu editor you compose dishes by meal.',
    'tour.step3': 'The calendar distributes menus across the month.',
    'tour.step4': 'Analytics shows SanPiN compliance.',
    'tour.step5': 'The generator builds menus from templates.',
    'tour.step6': 'Daily menu — a detailed view of one day.',
    'tour.step7': 'Breadcrumbs show your current position.',
    'tour.step8': 'Theme toggle and session export are in the top-right.',

    'session.export': 'Export session',
    'session.import': 'Import session',
    'session.exported': 'Session file saved',
    'session.imported': 'Session restored from file',
    'session.importError': 'Could not read session file',
    'session.confirmOverwrite': 'Import will overwrite current data. Continue?',

    'autosave.on': 'Autosave enabled',
    'autosave.off': 'Autosave disabled',
    'autosave.saved': 'Session saved automatically',

    'log.title': 'Activity log',
    'log.empty': 'No actions recorded yet',
    'log.clear': 'Clear log',

    'tab.main': 'Editor',
    'tab.calendar': 'Calendar',
    'tab.daily': 'Daily',
    'tab.generator': 'Generator',
    'tab.analytics': 'Analytics',
  }
};

// Текущая локаль
let _locale = 'ru';

function t(key, locale) {
  const loc = MESSAGES[locale || _locale] || MESSAGES['ru'];
  let str = loc[key];
  if (str === undefined) str = MESSAGES['ru'][key];
  if (str === undefined) return key;
  // Подстановка {name} -> args
  return str;
}

function tFormat(key, params, locale) {
  let str = t(key, locale);
  if (params && typeof params === 'object') {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), v);
    }
  }
  return str;
}

function setLocale(loc) {
  if (MESSAGES[loc]) {
    _locale = loc;
    try { localStorage.setItem('appLocale', loc); } catch (e) {}
    document.dispatchEvent(new CustomEvent('app:localeChanged', { detail: { locale: loc } }));
  }
}

function getLocale() {
  return _locale;
}

// Восстановление локали из localStorage
(function() {
  try {
    const saved = localStorage.getItem('appLocale');
    if (saved && MESSAGES[saved]) _locale = saved;
  } catch (e) {}
})();

window.AppI18n = { t: t, tf: tFormat, setLocale: setLocale, getLocale: getLocale, messages: MESSAGES };

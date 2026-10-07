// content.js
(function() {
    const script = document.createElement('script');
    // Получаем URL файла inject.js внутри расширения
    script.src = chrome.runtime.getURL('inject.js');
    
    // Удаляем тег <script> после загрузки, чтобы не засорять DOM
    script.onload = function() {
        this.remove();
    };
    
    // Добавляем тег на страницу
    (document.head || document.documentElement).appendChild(script);
})();
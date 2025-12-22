// main-project-system.js
async function loadProjectSystem() {
    // 1. Загружаем ядро
    await loadScript('projects-storage.js');
    await loadScript('projects.js');
    
    // 2. Загружаем исправления
    await loadScript('projects-results-fix.js');
    await loadScript('errors-fix.js');
    
    // 3. Инициализируем менеджер
    window.projectManager = new ProjectManager();
    await window.projectManager.init();
    
    // 4. Загружаем UI
    await loadScript('projects-ui.js');
    window.projectsUI = new ProjectsUI(window.projectManager);
    window.projectsUI.init();
    
    // 5. Автосохранение
    await loadScript('projects-autosave.js');
    window.autoSaveManager = new AutoSaveManager(window.projectManager);
    window.autoSaveManager.init();
}
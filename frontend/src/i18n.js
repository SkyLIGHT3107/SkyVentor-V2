// Internationalization

const translations = {
    ru: {
        // Navigation
        'nav.converter': 'Конвертер',
        'nav.rates': 'Таблица курсов',
        'nav.settings': 'Настройки',
        'nav.about': 'О проекте',
        
        // Converter
        'converter.title': 'Конвертер валют',
        'converter.button': 'Конвертировать',
        'converter.rate': '{from} = {to}',
        'converter.updated': 'Обновлено: {time}',
        
        // Rates
        'rates.title': 'Таблица курсов',
        'rates.multiplier': 'Множитель',
        
        // Settings
        'settings.title': 'Настройки',
        'settings.theme': 'Тема оформления',
        'settings.theme.dark': 'Темная',
        'settings.theme.light': 'Светлая',
        'settings.theme.auto': 'Авто',
        'settings.language': 'Язык интерфейса',
        'settings.language.ru': 'Русский',
        'settings.language.en': 'English',
        'settings.language.auto': 'Авто',
        'settings.info': 'Настройки автоматически сохраняются',
        
        // About
        'about.title': 'О проекте',
        'about.version': 'Версия {version} (Stable)',
        'about.author': 'Автор:',
        'about.tech': 'Используемые технологии:',
        'about.github': 'GitHub репозиторий',
        
        // Footer
        'footer.text': 'SkyVentor // 2026 V2 (Stable)',
        
        // Toast
        'toast.success': 'Успешно!',
        'toast.error': 'Ошибка!',
        'toast.converted': 'Конвертация выполнена',
        'toast.settings_saved': 'Настройки сохранены',
        
        // Errors
        'error.amount': 'Введите корректную сумму',
        'error.network': 'Ошибка сети. Проверьте подключение.',
        'error.api': 'Не удалось получить курс валют',
    },
    
    en: {
        // Navigation
        'nav.converter': 'Converter',
        'nav.rates': 'Rates Table',
        'nav.settings': 'Settings',
        'nav.about': 'About',
        
        // Converter
        'converter.title': 'Currency Converter',
        'converter.button': 'Convert',
        'converter.rate': '{from} = {to}',
        'converter.updated': 'Updated: {time}',
        
        // Rates
        'rates.title': 'Exchange Rates',
        'rates.multiplier': 'Multiplier',
        
        // Settings
        'settings.title': 'Settings',
        'settings.theme': 'Theme',
        'settings.theme.dark': 'Dark',
        'settings.theme.light': 'Light',
        'settings.theme.auto': 'Auto',
        'settings.language': 'Language',
        'settings.language.ru': 'Русский',
        'settings.language.en': 'English',
        'settings.language.auto': 'Auto',
        'settings.info': 'Settings are saved automatically',
        
        // About
        'about.title': 'About',
        'about.version': 'Version {version} (Stable)',
        'about.author': 'Author:',
        'about.tech': 'Technologies used:',
        'about.github': 'GitHub Repository',
        
        // Footer
        'footer.text': 'SkyVentor // 2026 V2 (Stable)',
        
        // Toast
        'toast.success': 'Success!',
        'toast.error': 'Error!',
        'toast.converted': 'Conversion completed',
        'toast.settings_saved': 'Settings saved',
        
        // Errors
        'error.amount': 'Enter valid amount',
        'error.network': 'Network error. Check your connection.',
        'error.api': 'Failed to fetch exchange rate',
    }
};

let currentLang = 'ru';

export function setLanguage(lang) {
    currentLang = lang;
    updatePageTexts();
}

export function t(key, params = {}) {
    let text = translations[currentLang][key] || key;
    
    // Replace parameters
    Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
}

function updatePageTexts() {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach((item, index) => {
        const keys = ['nav.converter', 'nav.rates', 'nav.settings', 'nav.about'];
        const textEl = item.querySelector('.nav-text');
        if (textEl) {
            textEl.textContent = t(keys[index]);
        }
    });
    
    // Update page titles
    const converterTitle = document.querySelector('#page-converter .page-title');
    if (converterTitle) converterTitle.textContent = t('converter.title');
    
    const ratesTitle = document.querySelector('#page-rates .page-title');
    if (ratesTitle) ratesTitle.textContent = t('rates.title');
    
    const settingsTitle = document.querySelector('#page-settings .page-title');
    if (settingsTitle) settingsTitle.textContent = t('settings.title');
    
    const aboutTitle = document.querySelector('#page-about .page-title');
    if (aboutTitle) aboutTitle.textContent = t('about.title');
    
    // Update converter button
    const convertBtn = document.querySelector('#convert-button span');
    if (convertBtn) {
        convertBtn.textContent = t('converter.button');
    }
    
    // Update rates table header
    const multiplierHeader = document.querySelector('#rates-table th:first-child');
    if (multiplierHeader) {
        multiplierHeader.textContent = t('rates.multiplier');
    }
    
    // Update settings
    const settingLabels = document.querySelectorAll('.setting-label span');
    if (settingLabels[0]) settingLabels[0].textContent = t('settings.theme');
    if (settingLabels[1]) settingLabels[1].textContent = t('settings.language');
    
    // Update theme options
    const themeOptions = document.querySelectorAll('[data-theme] .option-text');
    if (themeOptions[0]) themeOptions[0].textContent = t('settings.theme.dark');
    if (themeOptions[1]) themeOptions[1].textContent = t('settings.theme.light');
    if (themeOptions[2]) themeOptions[2].textContent = t('settings.theme.auto');
    
    // Update language options  
    const langOptions = document.querySelectorAll('[data-lang] .option-text');
    if (langOptions[0]) langOptions[0].textContent = t('settings.language.ru');
    if (langOptions[1]) langOptions[1].textContent = t('settings.language.en');
    if (langOptions[2]) langOptions[2].textContent = t('settings.language.auto');
    
    const settingsInfo = document.querySelector('.settings-info');
    if (settingsInfo) {
        settingsInfo.textContent = t('settings.info');
    }
    
    // Update about page
    const aboutAuthor = document.querySelector('.author-label');
    if (aboutAuthor) {
        aboutAuthor.textContent = t('about.author');
    }
    
    const techTitle = document.querySelector('.tech-title');
    if (techTitle) {
        techTitle.textContent = t('about.tech');
    }
    
    const githubLink = document.querySelector('.github-link span');
    if (githubLink) {
        githubLink.textContent = t('about.github');
    }
}

export function getCurrentLanguage() {
    return currentLang;
}

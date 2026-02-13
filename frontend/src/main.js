import { setLanguage, t, getCurrentLanguage } from './i18n.js';

// Global state
let currentPage = 'converter';
let currencies = [];
let settings = {
    theme: 'dark',
    language: 'ru'
};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    console.log('SkyVentor V2 initializing...');
    
    // Load settings
    await loadSettings();
    
    // Load currencies
    await loadCurrencies();
    
    // Initialize UI
    initSidebar();
    initNavigation();
    initConverter();
    initRates();
    initSettings();
    initFooter();
    
    console.log('SkyVentor V2 ready!');
});

// Settings Management
async function loadSettings() {
    try {
        const result = await window.go.main.App.LoadSettingsData();
        settings = result;
        applyTheme(settings.theme);
        setLanguage(settings.language);
    } catch (error) {
        console.error('Failed to load settings:', error);
        // Use defaults
        applyTheme('dark');
        setLanguage('ru');
    }
}

async function saveSettings() {
    try {
        await window.go.main.App.SaveSettings(settings.theme, settings.language);
        showToast('success', t('toast.settings_saved'));
    } catch (error) {
        console.error('Failed to save settings:', error);
        showToast('error', t('toast.error'));
    }
}

function applyTheme(theme) {
    let actualTheme = theme;
    
    if (theme === 'auto') {
        // Use system theme
        actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.body.setAttribute('data-theme', actualTheme);
}

// Currencies Management
async function loadCurrencies() {
    try {
        currencies = await window.go.main.App.GetCurrencyList();
        populateCurrencySelects();
    } catch (error) {
        console.error('Failed to load currencies:', error);
        showToast('error', 'Failed to load currencies');
    }
}

function populateCurrencySelects() {
    const selects = ['from-currency', 'to-currency', 'rates-from', 'rates-to'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = '';
        
        currencies.forEach(currency => {
            const option = document.createElement('option');
            option.value = currency.code;
            // Only show currency code
            option.textContent = currency.code;
            select.appendChild(option);
        });
        
        // Set defaults
        if (selectId === 'from-currency' || selectId === 'rates-from') {
            select.value = 'USD';
        } else {
            select.value = 'RUB';
        }
    });
}

// Sidebar
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        sidebar.classList.toggle('expanded');
    });
}

// Navigation
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.getAttribute('data-page');
            navigateToPage(page);
        });
    });
}

function navigateToPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    
    // Show selected page
    const selectedPage = document.getElementById(`page-${page}`);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === page) {
            item.classList.add('active');
        }
    });
    
    currentPage = page;
}

// Converter
function initConverter() {
    const fromCurrency = document.getElementById('from-currency');
    const toCurrency = document.getElementById('to-currency');
    const fromAmount = document.getElementById('from-amount');
    const toAmount = document.getElementById('to-amount');
    const convertBtn = document.getElementById('convert-button');
    const swapBtn = document.getElementById('swap-button');
    const fromFlag = document.getElementById('from-flag');
    const toFlag = document.getElementById('to-flag');
    
    // Update flags on currency change
    fromCurrency.addEventListener('change', () => {
        updateCurrencyFlag(fromCurrency.value, fromFlag);
    });
    
    toCurrency.addEventListener('change', () => {
        updateCurrencyFlag(toCurrency.value, toFlag);
    });
    
    // Initial flags
    updateCurrencyFlag('USD', fromFlag);
    updateCurrencyFlag('RUB', toFlag);
    
    // Swap button
    swapBtn.addEventListener('click', () => {
        const tempValue = fromCurrency.value;
        fromCurrency.value = toCurrency.value;
        toCurrency.value = tempValue;
        
        updateCurrencyFlag(fromCurrency.value, fromFlag);
        updateCurrencyFlag(toCurrency.value, toFlag);
        
        // Auto convert
        convertCurrency();
    });
    
    // Convert button
    convertBtn.addEventListener('click', convertCurrency);
    
    // Auto convert on amount change
    fromAmount.addEventListener('input', () => {
        if (fromAmount.value) {
            convertCurrency();
        }
    });
    
    // Initial conversion
    convertCurrency();
}

function updateCurrencyFlag(code, flagImg) {
    const currency = currencies.find(c => c.code === code);
    if (currency) {
        if (currency.type === 'fiat' && currency.flag) {
            // Show fiat flag
            flagImg.src = currency.flag;
            flagImg.style.display = 'block';
        } else if (currency.type === 'crypto' && currency.icon) {
            // Show crypto icon
            flagImg.src = currency.icon;
            flagImg.style.display = 'block';
        } else {
            // Hide if no image available
            flagImg.style.display = 'none';
        }
    } else {
        flagImg.style.display = 'none';
    }
}

async function convertCurrency() {
    const fromCurrency = document.getElementById('from-currency').value;
    const toCurrency = document.getElementById('to-currency').value;
    const fromAmount = parseFloat(document.getElementById('from-amount').value);
    const toAmount = document.getElementById('to-amount');
    const convertBtn = document.getElementById('convert-button');
    const spinner = convertBtn.querySelector('.button-spinner');
    const conversionInfo = document.getElementById('conversion-info');
    
    if (!fromAmount || fromAmount <= 0) {
        showToast('error', t('error.amount'));
        return;
    }
    
    // Show loading
    spinner.classList.remove('hidden');
    convertBtn.disabled = true;
    
    try {
        const result = await window.go.main.App.Convert(fromAmount, fromCurrency, toCurrency);
        
        if (result.success) {
            // Format with max 2 decimal places
            toAmount.value = result.result.toFixed(2);
            
            // Update info with better formatting
            const rate = `1 ${fromCurrency} = ${result.rate.toFixed(2)} ${toCurrency}`;
            const time = result.lastUpdate;
            
            conversionInfo.innerHTML = `
                <span class="conversion-rate">${rate}</span>
                <span class="conversion-time">${t('converter.updated', { time })}</span>
            `;
            
            showToast('success', t('toast.converted'));
        } else {
            showToast('error', result.errorMessage || t('error.api'));
        }
    } catch (error) {
        console.error('Conversion error:', error);
        showToast('error', t('error.network'));
    } finally {
        spinner.classList.add('hidden');
        convertBtn.disabled = false;
    }
}

// Rates Table
function initRates() {
    const fromSelect = document.getElementById('rates-from');
    const toSelect = document.getElementById('rates-to');
    
    fromSelect.addEventListener('change', updateRatesTable);
    toSelect.addEventListener('change', updateRatesTable);
    
    // Initial load
    updateRatesTable();
}

async function updateRatesTable() {
    const fromCurrency = document.getElementById('rates-from').value;
    const toCurrency = document.getElementById('rates-to').value;
    const tbody = document.getElementById('rates-tbody');
    const fromHeader = document.getElementById('rates-from-header');
    const toHeader = document.getElementById('rates-to-header');
    
    // Update headers
    fromHeader.textContent = fromCurrency;
    toHeader.textContent = toCurrency;
    
    try {
        const rates = await window.go.main.App.GetRates(fromCurrency, toCurrency);
        
        tbody.innerHTML = '';
        
        rates.forEach(row => {
            const tr = document.createElement('tr');
            // Format with proper decimal places
            const fromAmountStr = row.multiplier === 1 ? '1' : row.fromAmount.toFixed(0);
            const toAmountStr = row.toAmount.toFixed(2);
            
            tr.innerHTML = `
                <td>${row.multiplier}×</td>
                <td>${fromAmountStr} ${fromCurrency}</td>
                <td>${toAmountStr} ${toCurrency}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Failed to load rates:', error);
        showToast('error', t('error.api'));
    }
}

// Settings
function initSettings() {
    // Theme options
    const themeOptions = document.querySelectorAll('[data-theme]');
    themeOptions.forEach(option => {
        if (option.closest('.setting-option')) {
            option.addEventListener('click', () => {
                const theme = option.getAttribute('data-theme');
                settings.theme = theme;
                applyTheme(theme);
                
                // Update active state
                themeOptions.forEach(opt => {
                    if (opt.closest('.setting-option')) {
                        opt.classList.remove('active');
                    }
                });
                option.classList.add('active');
                
                saveSettings();
            });
            
            // Set initial active state
            if (option.getAttribute('data-theme') === settings.theme) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        }
    });
    
    // Language options
    const langOptions = document.querySelectorAll('[data-lang]');
    langOptions.forEach(option => {
        if (option.closest('.setting-option')) {
            option.addEventListener('click', () => {
                const lang = option.getAttribute('data-lang');
                settings.language = lang;
                setLanguage(lang);
                
                // Update active state
                langOptions.forEach(opt => {
                    if (opt.closest('.setting-option')) {
                        opt.classList.remove('active');
                    }
                });
                option.classList.add('active');
                
                saveSettings();
            });
            
            // Set initial active state
            if (option.getAttribute('data-lang') === settings.language) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        }
    });
}

// Footer
function initFooter() {
    const footer = document.getElementById('footer');
    const toggleBtn = document.getElementById('footer-toggle');
    
    toggleBtn.addEventListener('click', () => {
        footer.classList.toggle('hidden');
    });
    
    // Click on footer content to hide
    footer.querySelector('.footer-content').addEventListener('click', () => {
        footer.classList.add('hidden');
    });
}

// Toast Notifications
function showToast(type, message) {
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✓' : '✕';
    
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+, for settings
    if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        navigateToPage('settings');
    }
    
    // Ctrl+R for refresh rates
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        if (currentPage === 'converter') {
            convertCurrency();
        } else if (currentPage === 'rates') {
            updateRatesTable();
        }
    }
    
    // Ctrl+S for swap
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (currentPage === 'converter') {
            document.getElementById('swap-button').click();
        }
    }
});

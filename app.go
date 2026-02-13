package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// App struct
type App struct {
	ctx      context.Context
	settings *Settings
	cache    *CacheManager
}

// ConvertResult represents conversion result
type ConvertResult struct {
	Amount       float64 `json:"amount"`
	From         string  `json:"from"`
	To           string  `json:"to"`
	Result       float64 `json:"result"`
	Rate         float64 `json:"rate"`
	LastUpdate   string  `json:"lastUpdate"`
	Success      bool    `json:"success"`
	ErrorMessage string  `json:"errorMessage,omitempty"`
}

// RateRow represents a row in rates table
type RateRow struct {
	Multiplier int     `json:"multiplier"`
	FromAmount float64 `json:"fromAmount"`
	ToAmount   float64 `json:"toAmount"`
}

// Currency represents a currency
type Currency struct {
	Code   string `json:"code"`
	Name   string `json:"name"`
	Type   string `json:"type"` // "fiat" or "crypto"
	Symbol string `json:"symbol,omitempty"`
	Flag   string `json:"flag,omitempty"`
	Icon   string `json:"icon,omitempty"`
}

// CacheManager manages API response cache
type CacheManager struct {
	rates     map[string]CachedRate
	timestamp map[string]time.Time
}

// CachedRate stores cached exchange rate
type CachedRate struct {
	Rate float64
	Time time.Time
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		cache: &CacheManager{
			rates:     make(map[string]CachedRate),
			timestamp: make(map[string]time.Time),
		},
	}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.settings = LoadSettings()
}

// Convert converts amount from one currency to another
func (a *App) Convert(amount float64, from, to string) ConvertResult {
	if amount <= 0 {
		return ConvertResult{
			Success:      false,
			ErrorMessage: "Amount must be greater than 0",
		}
	}

	rate, err := a.getExchangeRate(from, to)
	if err != nil {
		return ConvertResult{
			Success:      false,
			ErrorMessage: err.Error(),
		}
	}

	result := amount * rate

	return ConvertResult{
		Amount:     amount,
		From:       from,
		To:         to,
		Result:     result,
		Rate:       rate,
		LastUpdate: time.Now().Format("15:04:05"),
		Success:    true,
	}
}

// GetRates returns rate table for multipliers
func (a *App) GetRates(from, to string) []RateRow {
	rate, err := a.getExchangeRate(from, to)
	if err != nil {
		return []RateRow{}
	}

	multipliers := []int{1, 10, 100, 1000}
	rows := make([]RateRow, len(multipliers))

	for i, mult := range multipliers {
		rows[i] = RateRow{
			Multiplier: mult,
			FromAmount: float64(mult),
			ToAmount:   float64(mult) * rate,
		}
	}

	return rows
}

// GetCurrencyList returns list of supported currencies
func (a *App) GetCurrencyList() []Currency {
	return []Currency{
		// Fiat currencies
		{Code: "USD", Name: "US Dollar", Type: "fiat", Symbol: "$", Flag: "https://flagcdn.com/w40/us.png"},
		{Code: "EUR", Name: "Euro", Type: "fiat", Symbol: "€", Flag: "https://flagcdn.com/w40/eu.png"},
		{Code: "RUB", Name: "Russian Ruble", Type: "fiat", Symbol: "₽", Flag: "https://flagcdn.com/w40/ru.png"},
		{Code: "KZT", Name: "Kazakhstani Tenge", Type: "fiat", Symbol: "₸", Flag: "https://flagcdn.com/w40/kz.png"},
		{Code: "CNY", Name: "Chinese Yuan", Type: "fiat", Symbol: "¥", Flag: "https://flagcdn.com/w40/cn.png"},
		{Code: "GBP", Name: "British Pound", Type: "fiat", Symbol: "£", Flag: "https://flagcdn.com/w40/gb.png"},
		{Code: "JPY", Name: "Japanese Yen", Type: "fiat", Symbol: "¥", Flag: "https://flagcdn.com/w40/jp.png"},
		{Code: "CHF", Name: "Swiss Franc", Type: "fiat", Symbol: "Fr", Flag: "https://flagcdn.com/w40/ch.png"},
		{Code: "CAD", Name: "Canadian Dollar", Type: "fiat", Symbol: "$", Flag: "https://flagcdn.com/w40/ca.png"},
		{Code: "AUD", Name: "Australian Dollar", Type: "fiat", Symbol: "$", Flag: "https://flagcdn.com/w40/au.png"},
		
		// Cryptocurrencies with icons
		{Code: "BTC", Name: "Bitcoin", Type: "crypto", Symbol: "₿", Icon: "https://cryptologos.cc/logos/bitcoin-btc-logo.png"},
		{Code: "ETH", Name: "Ethereum", Type: "crypto", Symbol: "Ξ", Icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png"},
		{Code: "USDT", Name: "Tether", Type: "crypto", Symbol: "₮", Icon: "https://cryptologos.cc/logos/tether-usdt-logo.png"},
		{Code: "TON", Name: "Toncoin", Type: "crypto", Symbol: "💎", Icon: "https://cryptologos.cc/logos/toncoin-ton-logo.png"},
		{Code: "SOL", Name: "Solana", Type: "crypto", Symbol: "◎", Icon: "https://cryptologos.cc/logos/solana-sol-logo.png"},
		{Code: "XRP", Name: "Ripple", Type: "crypto", Symbol: "✕", Icon: "https://cryptologos.cc/logos/xrp-xrp-logo.png"},
		{Code: "BNB", Name: "Binance Coin", Type: "crypto", Symbol: "BNB", Icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png"},
		{Code: "DOGE", Name: "Dogecoin", Type: "crypto", Symbol: "Ð", Icon: "https://cryptologos.cc/logos/dogecoin-doge-logo.png"},
	}
}

// getExchangeRate fetches exchange rate with caching
func (a *App) getExchangeRate(from, to string) (float64, error) {
	if from == to {
		return 1.0, nil
	}

	// Check cache
	cacheKey := from + "-" + to
	if cached, ok := a.cache.rates[cacheKey]; ok {
		if time.Since(cached.Time) < 5*time.Minute {
			return cached.Rate, nil
		}
	}

	// Determine currency types
	currencies := a.GetCurrencyList()
	fromType := getCurrencyType(from, currencies)
	toType := getCurrencyType(to, currencies)

	var rate float64
	var err error

	// Both crypto
	if fromType == "crypto" && toType == "crypto" {
		rate, err = a.getCryptoRate(from, to)
	} else if fromType == "crypto" || toType == "crypto" {
		// Crypto to fiat or fiat to crypto
		rate, err = a.getCryptoToFiatRate(from, to)
	} else {
		// Both fiat
		rate, err = a.getFiatRate(from, to)
	}

	if err != nil {
		// Try to use cached rate even if expired
		if cached, ok := a.cache.rates[cacheKey]; ok {
			return cached.Rate, nil
		}
		return 0, err
	}

	// Cache the rate
	a.cache.rates[cacheKey] = CachedRate{
		Rate: rate,
		Time: time.Now(),
	}

	return rate, nil
}

// getFiatRate fetches fiat exchange rate from API
func (a *App) getFiatRate(from, to string) (float64, error) {
	url := fmt.Sprintf("https://api.exchangerate-api.com/v4/latest/%s", from)
	
	resp, err := http.Get(url)
	if err != nil {
		return 0, fmt.Errorf("failed to fetch rate: %v", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return 0, fmt.Errorf("failed to read response: %v", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return 0, fmt.Errorf("failed to parse response: %v", err)
	}

	rates, ok := result["rates"].(map[string]interface{})
	if !ok {
		return 0, fmt.Errorf("invalid response format")
	}

	// Handle both float64 and string rate values
	rateValue, ok := rates[to]
	if !ok {
		return 0, fmt.Errorf("currency %s not found", to)
	}

	// Try to convert to float64
	switch v := rateValue.(type) {
	case float64:
		return v, nil
	case string:
		// Try to parse string as float
		rate, err := strconv.ParseFloat(v, 64)
		if err != nil {
			return 0, fmt.Errorf("invalid rate format for %s", to)
		}
		return rate, nil
	default:
		return 0, fmt.Errorf("unexpected rate type for %s", to)
	}
}

// getCryptoRate fetches crypto exchange rate
func (a *App) getCryptoRate(from, to string) (float64, error) {
	// For crypto-to-crypto, convert both to USD first
	fromId := getCryptoId(from)
	toId := getCryptoId(to)

	url := fmt.Sprintf("https://api.coingecko.com/api/v3/simple/price?ids=%s,%s&vs_currencies=usd", fromId, toId)
	
	resp, err := http.Get(url)
	if err != nil {
		return 0, fmt.Errorf("failed to fetch crypto rate: %v", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return 0, fmt.Errorf("failed to read response: %v", err)
	}

	var result map[string]map[string]float64
	if err := json.Unmarshal(body, &result); err != nil {
		return 0, fmt.Errorf("failed to parse response: %v", err)
	}

	fromRate, ok1 := result[fromId]["usd"]
	toRate, ok2 := result[toId]["usd"]
	
	if ok1 && ok2 && toRate != 0 {
		return fromRate / toRate, nil
	}

	return 0, fmt.Errorf("crypto rate not found")
}

// getCryptoToFiatRate fetches crypto to fiat rate
func (a *App) getCryptoToFiatRate(from, to string) (float64, error) {
	currencies := a.GetCurrencyList()
	fromType := getCurrencyType(from, currencies)
	
	var cryptoCode, fiatCode string
	var inverse bool

	if fromType == "crypto" {
		cryptoCode = from
		fiatCode = to
		inverse = false
	} else {
		cryptoCode = to
		fiatCode = from
		inverse = true
	}

	cryptoId := getCryptoId(cryptoCode)
	fiatLower := strings.ToLower(fiatCode)
	url := fmt.Sprintf("https://api.coingecko.com/api/v3/simple/price?ids=%s&vs_currencies=%s", cryptoId, fiatLower)
	
	resp, err := http.Get(url)
	if err != nil {
		return 0, fmt.Errorf("failed to fetch rate: %v", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return 0, fmt.Errorf("failed to read response: %v", err)
	}

	var result map[string]map[string]float64
	if err := json.Unmarshal(body, &result); err != nil {
		return 0, fmt.Errorf("failed to parse response: %v", err)
	}

	if cryptoRates, ok := result[cryptoId]; ok {
		if rate, ok := cryptoRates[fiatLower]; ok {
			if inverse {
				return 1.0 / rate, nil
			}
			return rate, nil
		}
	}

	return 0, fmt.Errorf("rate not found")
}

// Helper functions

func getCurrencyType(code string, currencies []Currency) string {
	for _, c := range currencies {
		if c.Code == code {
			return c.Type
		}
	}
	return "fiat"
}

func getCryptoId(code string) string {
	cryptoIds := map[string]string{
		"BTC":  "bitcoin",
		"ETH":  "ethereum",
		"USDT": "tether",
		"TON":  "the-open-network",
		"SOL":  "solana",
		"XRP":  "ripple",
		"BNB":  "binancecoin",
		"DOGE": "dogecoin",
	}
	
	if id, ok := cryptoIds[code]; ok {
		return id
	}
	return code
}

// SaveSettings saves application settings
func (a *App) SaveSettings(theme, language string) error {
	a.settings.Theme = theme
	a.settings.Language = language
	return a.settings.Save()
}

// LoadSettingsData loads current settings
func (a *App) LoadSettingsData() Settings {
	return *a.settings
}

// GetSystemTheme returns system theme preference
func (a *App) GetSystemTheme() string {
	// For now return dark as default
	// In production, this would detect OS theme
	return "dark"
}

// GetSystemLanguage returns system language
func (a *App) GetSystemLanguage() string {
	// For now return ru as default
	// In production, this would detect OS language
	return "ru"
}

// ParseFloat safely parses float from string
func ParseFloat(s string) float64 {
	f, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0
	}
	return f
}

// Settings struct and methods

// Settings represents app settings
type Settings struct {
	Theme    string `json:"theme"`    // "dark" | "light" | "auto"
	Language string `json:"language"` // "ru" | "en" | "auto"
}

// LoadSettings loads settings from file
func LoadSettings() *Settings {
	settings := &Settings{
		Theme:    "dark",
		Language: "ru",
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return settings
	}

	configPath := filepath.Join(homeDir, ".skyventor", "settings.json")
	data, err := ioutil.ReadFile(configPath)
	if err != nil {
		return settings
	}

	json.Unmarshal(data, settings)
	return settings
}

// Save saves settings to file
func (s *Settings) Save() error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	configDir := filepath.Join(homeDir, ".skyventor")
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return err
	}

	configPath := filepath.Join(configDir, "settings.json")
	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}

	return ioutil.WriteFile(configPath, data, 0644)
}

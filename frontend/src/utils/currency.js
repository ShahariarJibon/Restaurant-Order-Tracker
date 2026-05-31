const CACHE_KEY = 'currency_rates';
const CACHE_TTL = 3600000; // 1 hour

export const CURRENCIES = [
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', flag: '🇧🇩' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar', flag: '🇰🇼' },
  { code: 'BHD', symbol: 'BD', name: 'Bahraini Dinar', flag: '🇧🇭' },
  { code: 'OMR', symbol: '﷼', name: 'Omani Rial', flag: '🇴🇲' },
  { code: 'JOD', symbol: 'JD', name: 'Jordanian Dinar', flag: '🇯🇴' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'GIP', symbol: '£', name: 'Gibraltar Pound', flag: '🇬🇮' },
  { code: 'KYD', symbol: '$', name: 'Cayman Islands Dollar', flag: '🇰🇾' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭' },
];

export function getSelectedCurrency() {
  return localStorage.getItem('currency') || 'BDT';
}

export function getCurrencyInfo(code) {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[1];
}

export async function fetchRates() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const { rates, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL) return rates;
  }
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    const rates = data.rates;
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, timestamp: Date.now() }));
    return rates;
  } catch {
    if (cached) return JSON.parse(cached).rates;
    return { USD: 1, BDT: 109.5, KWD: 0.31, BHD: 0.38, OMR: 0.38, JOD: 0.71, GBP: 0.79, GIP: 0.79, KYD: 0.82, CHF: 0.89 };
  }
}

export function convertPrice(amountUSD, targetCurrency, rates) {
  const rate = rates[targetCurrency];
  if (!rate) return amountUSD;
  return amountUSD * rate;
}

export function toUSD(amount, sourceCurrency, rates) {
  const rate = rates[sourceCurrency];
  if (!rate) return amount;
  return amount / rate;
}

export function formatPrice(amountUSD, currencyCode, rates) {
  const converted = convertPrice(amountUSD, currencyCode, rates);
  const info = getCurrencyInfo(currencyCode);
  return `${info.symbol}${converted.toFixed(2)}`;
}

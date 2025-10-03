// Currency symbols and conversion rates
export const CURRENCY_SYMBOLS: { [key: string]: string } = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'GHS': '₵',
  'JPY': '¥',
  'INR': '₹',
  'NGN': '₦',
  'ZAR': 'R',
  'KES': 'KSh',
  'CAD': 'C$'
};

// Exchange rates to USD (updated regularly)
export const EXCHANGE_RATES: { [key: string]: number } = {
  'USD': 1.0,
  'EUR': 0.92,
  'GBP': 0.79,
  'GHS': 12.05,
  'JPY': 149.50,
  'INR': 83.25,
  'NGN': 775.00,
  'ZAR': 18.75,
  'KES': 129.50,
  'CAD': 1.36
};

export const getCurrencySymbol = (currency: string): string => {
  return CURRENCY_SYMBOLS[currency] || currency;
};

export const convertToUSD = (amount: number, fromCurrency: string): number => {
  const rate = EXCHANGE_RATES[fromCurrency] || 1;
  return amount / rate;
};

export const formatCurrency = (amount: number, currency: string): string => {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${parseFloat(amount.toString()).toFixed(2)}`;
};
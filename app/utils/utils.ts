export const fetchCurrencyData = async (currency: string) => {
  const response = await fetch(
    `${process.env.EXCHANGE_RATE_BASE_URL}/${currency.toUpperCase()}`
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data;
};

export const fetchCurrenciesList = async () => {
  const response = await fetch(`${process.env.EXCHANGE_RATE_BASE_URL}/USD`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();

  const currencies = Object.keys(data.rates);
  return currencies;
};

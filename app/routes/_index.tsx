import type { ActionFunctionArgs, MetaFunction } from '@remix-run/node';
import {
  ShouldRevalidateFunction,
  useFetcher,
  useLoaderData,
} from '@remix-run/react';
import { eq } from 'drizzle-orm';
import { ChangeEvent, useEffect, useState } from 'react';
import { db } from '~/drizzle/config.server';
import { currencies, currencyCodes } from '~/drizzle/schema.server';
import { fetchCurrenciesList, fetchCurrencyData } from '~/utils/utils';

// only need to fetch currencies once per load
export const shouldRevalidate: ShouldRevalidateFunction = () => {
  return false;
};
export const meta: MetaFunction = () => {
  return [
    { title: 'Currency Converter' },
    { name: 'description', content: 'Welcome to Remix!' },
  ];
};

// fetch currencies
export const loader = async () => {
  const now = new Date().getTime();
  const id = 'currencyCodes';
  const currencyCodesResult = await db
    .select()
    .from(currencyCodes)
    .where(eq(currencyCodes.id, id))
    .get();

  if (currencyCodesResult) {
    const updateDifference = now - currencyCodesResult.lastUpdated;

    if (updateDifference > 604800000) {
      console.log('Currencies out of date, updating...');
      const currencies = await fetchCurrenciesList();
      const [insertedCurrencyCodes] = await db
        .update(currencyCodes)
        .set({
          currencyCodes: currencies,
          lastUpdated: now,
        })
        .where(eq(currencyCodes.id, id))
        .returning();
      return insertedCurrencyCodes;
    }

    return currencyCodesResult;
  }

  // Populate the database with currencies to convert to
  if (!currencyCodesResult) {
    const currencies = await fetchCurrenciesList();
    const [insertedCurrencyCodes] = await db
      .insert(currencyCodes)
      .values({
        id,
        currencyCodes: currencies,
        lastUpdated: now,
      })
      .returning();

    return insertedCurrencyCodes;
  }
};

export async function action({ request }: ActionFunctionArgs) {
  const now = new Date().getTime();

  const fetchCurrencyRates = async (currency: string) => {
    const currencyEntry = await db
      .select()
      .from(currencies)
      .where(eq(currencies.currencyCode, currency))
      .get();

    if (!currencyEntry) {
      const currencyData = await fetchCurrencyData(currency);
      const [insertedCurrency] = await db
        .insert(currencies)
        .values({
          currencyCode: currency,
          rates: JSON.stringify(currencyData.rates),
          lastUpdated: now,
        })
        .returning();

      return insertedCurrency;
    }

    // update every 12 hours
    const updateDifference = now - currencyEntry.lastUpdated;
    if (updateDifference > 43200000) {
      const currencyData = await fetchCurrencyData(currency);
      const [updatedCurrency] = await db
        .update(currencies)
        .set({
          rates: JSON.stringify(currencyData.rates),
          lastUpdated: now,
        })
        .where(eq(currencies.currencyCode, currency))
        .returning();

      return updatedCurrency;
    }
    return currencyEntry;
  };

  const formData = await request.formData();

  const fromCurrency = formData.get('fromCurrency') as string | undefined;
  const toCurrency = formData.get('toCurrency') as string | undefined;

  if (!fromCurrency || !toCurrency) {
    throw 'No currency provided!';
  }

  const fromCurrencyData = await fetchCurrencyRates(fromCurrency);

  const fromCurrencyRates = JSON.parse(fromCurrencyData.rates) as Record<
    string,
    number
  >;

  const newCurrencyRate = fromCurrencyRates[toCurrency.toUpperCase()] as number;

  if (!newCurrencyRate) {
    throw `No currency conversion for ${fromCurrency} and ${toCurrency}`;
  }

  return {
    newCurrencyRate,
  };
}

export default function Index() {
  // const initialData = useLoaderData<typeof loader>();
  const currencies = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('GBP');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [lastEdited, setLastEdited] = useState('from');

  useEffect(() => {
    if (fromCurrency && toCurrency) {
      fetcher.submit({ fromCurrency, toCurrency }, { method: 'post' });
    }
  }, [fromCurrency, toCurrency]);

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      setExchangeRate(fetcher.data.newCurrencyRate);
    }
  }, [fetcher]);

  useEffect(() => {
    if (lastEdited === 'from' && fromAmount) {
      const calculated = (parseFloat(fromAmount) * exchangeRate).toFixed(2);
      setToAmount(isNaN(parseFloat(calculated)) ? '' : calculated);
    } else if (lastEdited === 'to' && toAmount) {
      const calculated = (parseFloat(toAmount) / exchangeRate).toFixed(2);
      setFromAmount(isNaN(parseFloat(calculated)) ? '' : calculated);
    }
  }, [fromAmount, toAmount, exchangeRate, lastEdited]);

  const handleFromAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFromAmount(e.target.value);
    setLastEdited('from');
  };

  const handleToAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setToAmount(e.target.value);
    setLastEdited('to');
  };

  const handleFromCurrencyChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFromCurrency(e.target.value);
    setLastEdited('from');
  };

  const handleToCurrencyChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setToCurrency(e.target.value);
    setLastEdited('from');
  };

  return (
    <div className='max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl'>
      <h1 className='text-2xl font-bold mb-6 text-center'>
        Currency Converter
      </h1>
      <div className='space-y-4'>
        <div className='flex items-center space-x-4'>
          <div className='flex-1'>
            <label
              htmlFor='fromAmount'
              className='block text-sm font-medium text-gray-700'
            >
              From Amount
            </label>
            <input
              type='number'
              id='fromAmount'
              value={fromAmount}
              onChange={handleFromAmountChange}
              className='mt-1 p-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50'
            />
          </div>
          <div className='flex-1'>
            <label
              htmlFor='fromCurrency'
              className='block text-sm font-medium text-gray-700'
            >
              From Currency
            </label>
            <select
              id='fromCurrency'
              value={fromCurrency}
              onChange={handleFromCurrencyChange}
              className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50'
            >
              {currencies?.currencyCodes?.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className='flex items-center space-x-4'>
          <div className='flex-1'>
            <label
              htmlFor='toAmount'
              className='block text-sm font-medium text-gray-700'
            >
              To Amount
            </label>
            <input
              type='number'
              id='toAmount'
              value={toAmount}
              onChange={handleToAmountChange}
              className='mt-1 p-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50'
            />
          </div>
          <div className='flex-1'>
            <label
              htmlFor='toCurrency'
              className='block text-sm font-medium text-gray-700'
            >
              To Currency
            </label>
            <select
              id='toCurrency'
              value={toCurrency}
              onChange={handleToCurrencyChange}
              className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50'
            >
              {currencies?.currencyCodes?.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className='mt-6 p-4 bg-green-100 rounded-md'>
        <p className='text-sm text-green-600'>
          Exchange Rate: 1 {fromCurrency} = {exchangeRate.toFixed(4)}{' '}
          {toCurrency}
        </p>
      </div>
    </div>
  );
}

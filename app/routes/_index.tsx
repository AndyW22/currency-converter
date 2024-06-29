import type { MetaFunction } from '@remix-run/node';
import { Form, json, useLoaderData } from '@remix-run/react';
import { db } from '~/drizzle/config.server';
import { currencies } from '~/drizzle/schema.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Currency Converter' },
    { name: 'description', content: 'Welcome to Remix!' },
  ];
};

export async function action() {
  db.insert(currencies)
    .values({ currencyCode: 'USD', rates: JSON.stringify('hey!') })
    .run();
  return {
    success: true,
  };
}

export async function loader() {
  // use drizzle to get the data
  const data = db.select().from(currencies).all();
  return json({
    data,
  });
}

export default function Index() {
  const { data } = useLoaderData<typeof loader>();

  return (
    <div className='font-sans p-4'>
      <h1> Items </h1>
      <ul>
        {data.map((item) => (
          <li key={item.currencyCode}>{item.rates}</li>
        ))}
      </ul>
      <h1 className='text-3xl'>Welcome to Remix</h1>
      <Form method='POST'>
        <input type='submit' value='Submit' />
      </Form>
    </div>
  );
}

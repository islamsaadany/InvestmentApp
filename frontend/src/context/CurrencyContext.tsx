import { createContext, useContext, useState, type ReactNode } from 'react';

type CurrencyPref = 'USD' | 'EGP' | 'both';

interface CurrencyContextType {
  currency: CurrencyPref;
  setCurrency: (c: CurrencyPref) => void;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  setCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyPref>(
    () => (localStorage.getItem('currency_pref') as CurrencyPref) || 'USD'
  );

  const handleSet = (c: CurrencyPref) => {
    setCurrency(c);
    localStorage.setItem('currency_pref', c);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: handleSet }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

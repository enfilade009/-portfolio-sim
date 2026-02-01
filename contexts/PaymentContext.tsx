import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PaymentContextType {
  isPaid: boolean;
  setIsPaid: (paid: boolean) => void;
  isLoading: boolean;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPaid, setIsPaidState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for payment status
    const paid = localStorage.getItem('portfolio_sim_paid');
    if (paid === 'true') {
      setIsPaidState(true);
    }
    setIsLoading(false);
  }, []);

  const setIsPaid = (paid: boolean) => {
    setIsPaidState(paid);
    localStorage.setItem('portfolio_sim_paid', paid ? 'true' : 'false');
  };

  return (
    <PaymentContext.Provider value={{ isPaid, setIsPaid, isLoading }}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within PaymentProvider');
  }
  return context;
};
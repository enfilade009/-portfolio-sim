import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Lock, Zap, Check, Sparkles } from 'lucide-react';
import { usePayment } from '../contexts/PaymentContext';

const stripePromise = loadStripe('pk_test_51Sw7mEIaFhEaRFuTYbMXmfYmjE6AhidJxvuird2NcomU3pfXYAU1rofOtzoJwkHIAe3PfUZOeNTZYpU5p4cFeD8l007xJKDCKM');

interface PaywallProps {
  feature: string;
}

export const Paywall: React.FC<PaywallProps> = ({ feature }) => {
  const { setIsPaid } = usePayment();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    setIsProcessing(true);
    
    const stripe = await stripePromise;
    if (!stripe) {
      alert('Payment system unavailable');
      setIsProcessing(false);
      return;
    }

    const { error } = await stripe.redirectToCheckout({
      lineItems: [{ price: 'price_1Sw7uFIaFhEaRFuTrrtS1mUV', quantity: 1 }],
      mode: 'payment',
      successUrl: window.location.origin + '?payment=success',
      cancelUrl: window.location.origin + '?payment=cancelled',
    });

    if (error) {
      console.error('Stripe error:', error);
      alert('Payment failed. Please try again.');
    }
    setIsProcessing(false);
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setIsPaid(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [setIsPaid]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200 dark:border-slate-700">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Unlock {feature}
        </h2>
        
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Get lifetime access to all premium features
        </p>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6 text-left">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-2">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-sm">AI Wealth Coach insights</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-2">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-sm">Dividend Ladder analysis</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-2">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-sm">Market Dashboard</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-sm">Strategy & Tax optimizer</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={isProcessing}
          className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Sparkles className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Unlock for $5
            </>
          )}
        </button>

        <p className="text-xs text-slate-500 dark:text-slate-500 mt-4">
          One-time payment • Lifetime access • Secure checkout
        </p>
      </div>
    </div>
  );
};
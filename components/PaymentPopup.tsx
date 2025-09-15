import React, { useEffect, useRef, useState } from 'react';

// This is to inform TypeScript about the paypal object on the window
declare global {
  interface Window {
    paypal: any;
  }
}

interface PaymentPopupProps {
  onPaymentSuccess: () => void;
}

export const PaymentPopup: React.FC<PaymentPopupProps> = ({ onPaymentSuccess }) => {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPayPalSDK = () => {
      const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'sb';
      
      if (clientId === 'YOUR_PAYPAL_CLIENT_ID') {
        setError('PayPal client ID not configured');
        setIsLoading(false);
        return;
      }

      // Check if PayPal SDK is already loaded
      if (window.paypal) {
        renderPayPalButtons();
        return;
      }

      // Create script element to load PayPal SDK
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
      script.async = true;
      
      script.onload = () => {
        renderPayPalButtons();
      };
      
      script.onerror = () => {
        setError('Failed to load PayPal SDK');
        setIsLoading(false);
      };

      document.head.appendChild(script);
    };

    const renderPayPalButtons = () => {
      if (!paypalRef.current) return;

      const paypalContainer = paypalRef.current;
      
      // Clear the container to ensure a clean slate
      paypalContainer.innerHTML = '';

      try {
        // Render the PayPal buttons
        window.paypal.Buttons({
          createOrder: (_data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                description: 'Unlock unlimited plays for Tic Tac Toe.',
                amount: {
                  currency_code: 'USD',
                  value: '1.00',
                },
              }],
            });
          },
          onApprove: async (_data: any, actions: any) => {
            // This function is called when the user approves the payment.
            return actions.order.capture().then(() => {
              onPaymentSuccess();
            });
          },
          onError: (err: any) => {
            console.error("PayPal Checkout onError", err);
            setError('Payment error occurred. Please try again.');
          },
        }).render(paypalContainer).then(() => {
          setIsLoading(false);
        }).catch((err: any) => {
          console.error("PayPal render error", err);
          setError('Could not render payment button.');
          setIsLoading(false);
        });
      } catch (err) {
        console.error("PayPal setup error", err);
        setError('Failed to initialize PayPal.');
        setIsLoading(false);
      }
    };

    loadPayPalSDK();
  }, [onPaymentSuccess]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" aria-modal="true" role="dialog">
      <div className="bg-black/30 backdrop-blur-sm border border-gray-700 rounded-lg p-8 text-center max-w-sm mx-4 shadow-2xl shadow-gray-900/50">
        <h2 className="text-3xl font-bold text-white mb-4">Unlock Unlimited Plays!</h2>
        <p className="text-gray-300 mb-6">
          Thanks for playing! Please make a one-time payment of $1 to continue.
        </p>
        <div ref={paypalRef} className="min-h-[100px] flex items-center justify-center">
          {isLoading && !error && (
            <p className="text-gray-400">Loading Payment Options...</p>
          )}
          {error && (
            <p className="text-red-400">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};
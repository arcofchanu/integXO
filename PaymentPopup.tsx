import React, { useEffect, useRef, useState, useCallback } from 'react';

// PayPal SDK types
declare global {
  interface Window {
    paypal: any;
  }
}

interface PaymentPopupProps {
  onPaymentSuccess: () => void;
  onClose: () => void;
}

export const PaymentPopup: React.FC<PaymentPopupProps> = ({ onPaymentSuccess, onClose }) => {
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const sdkLoadedRef = useRef(false);
  const buttonsRenderedRef = useRef(false);
  const [currentStep, setCurrentStep] = useState<'intro' | 'payment'>('intro');
  const [isSDKLoading, setIsSDKLoading] = useState(false);
  const [isButtonsLoading, setIsButtonsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Clean up function
  const cleanup = useCallback(() => {
    if (paypalContainerRef.current) {
      paypalContainerRef.current.innerHTML = '';
    }
    buttonsRenderedRef.current = false;
    setIsButtonsLoading(false);
    setError(null);
  }, []);

  // Load PayPal SDK
  const loadPayPalSDK = useCallback(() => {
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    const environment = import.meta.env.VITE_PAYPAL_ENVIRONMENT || 'sandbox';
    
    console.log('PayPal Client ID:', clientId ? `${clientId.substring(0, 10)}...` : 'Not set');
    console.log('PayPal Environment:', environment);
    
    if (!clientId || clientId === 'YOUR_SANDBOX_CLIENT_ID_HERE' || clientId.length < 10) {
      const errorMsg = 'PayPal Client ID not properly configured. Please check your environment variables.';
      console.error(errorMsg);
      setError(errorMsg);
      return Promise.reject('No client ID');
    }

    // Check if already loaded
    if (window.paypal && sdkLoadedRef.current) {
      console.log('PayPal SDK already loaded');
      return Promise.resolve();
    }

    // Remove existing scripts
    const existingScripts = document.querySelectorAll('script[src*="paypal.com/sdk/js"]');
    existingScripts.forEach(script => script.remove());

    return new Promise((resolve, reject) => {
      setIsSDKLoading(true);
      
      const script = document.createElement('script');
      // Use sandbox environment with proper parameters
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&environment=${environment}&debug=true`;
      script.async = true;
      
      console.log('Loading PayPal SDK...');
      
      script.onload = () => {
        console.log('PayPal SDK loaded successfully', !!window.paypal);
        sdkLoadedRef.current = true;
        setIsSDKLoading(false);
        resolve(undefined);
      };
      
      script.onerror = (error) => {
        console.error('Failed to load PayPal SDK:', error);
        setIsSDKLoading(false);
        setError('Failed to load PayPal SDK. Please check your internet connection and try again.');
        reject('SDK load failed');
      };

      document.head.appendChild(script);
    });
  }, []);

  // Render PayPal buttons
  const renderPayPalButtons = useCallback(async () => {
    console.log('Attempting to render PayPal buttons...');
    
    if (!paypalContainerRef.current || buttonsRenderedRef.current) {
      console.log('Container not ready or buttons already rendered');
      return;
    }
    
    // Ensure container is clean
    cleanup();
    
    if (!window.paypal) {
      console.error('PayPal SDK not available on window object');
      setError('PayPal SDK not loaded. Please refresh and try again.');
      return;
    }

    console.log('PayPal object available:', !!window.paypal.Buttons);
    setIsButtonsLoading(true);
    
    try {
      await window.paypal.Buttons({
        style: {
          color: 'blue',
          shape: 'rect',
          label: 'pay',
          height: 45,
          tagline: false,
          layout: 'vertical'
        },
        
        createOrder: function() {
          console.log('Creating PayPal order...');
          
          // Use relative path for API calls (works on both localhost and Vercel)
          return fetch('/api/create-paypal-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              amount: '1.00',
              currency: 'USD',
              description: 'Unlock unlimited Tic Tac Toe plays'
            })
          }).then(response => {
            if (!response.ok) {
              throw new Error(`Failed to create order: ${response.status}`);
            }
            return response.json();
          }).then(data => {
            console.log('Order created:', data.orderID);
            return data.orderID;
          }).catch((error: any) => {
            console.error('Order creation failed:', error);
            // Fallback to client-side order creation if server is not available
            return window.paypal.request({
              url: '/v2/checkout/orders',
              method: 'POST',
              json: {
                intent: 'CAPTURE',
                purchase_units: [{
                  amount: {
                    currency_code: 'USD',
                    value: '1.00'
                  },
                  description: 'Unlock unlimited Tic Tac Toe plays'
                }]
              }
            }).then((res: any) => {
              console.log('Fallback order created:', res.id);
              return res.id;
            });
          });
        },

        onApprove: function(data: any) {
          console.log('Payment approved, order ID:', data.orderID);
          setPaymentProcessing(true);
          
          return fetch('/api/capture-paypal-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              orderID: data.orderID
            })
          }).then(response => {
            if (!response.ok) {
              throw new Error(`Failed to capture payment: ${response.status}`);
            }
            return response.json();
          }).then(details => {
            console.log('Payment captured:', details);
            if (details.status === 'COMPLETED') {
              onPaymentSuccess();
            } else {
              setError('Payment was not completed successfully');
            }
          }).catch((error: any) => {
            console.error('Payment capture failed:', error);
            // Fallback to client-side capture
            return window.paypal.request({
              url: `/v2/checkout/orders/${data.orderID}/capture`,
              method: 'POST'
            }).then((details: any) => {
              console.log('Payment captured via fallback:', details);
              if (details.status === 'COMPLETED') {
                onPaymentSuccess();
              } else {
                setError('Payment was not completed successfully');
              }
            }).catch(() => {
              setError('Payment capture failed. Please try again.');
            });
          }).finally(() => {
            setPaymentProcessing(false);
          });
        },

        onCancel: function(data: any) {
          console.log('Payment cancelled:', data);
          setError('Payment was cancelled. You can try again anytime.');
          setPaymentProcessing(false);
        },

        onError: function(err: any) {
          console.error('PayPal Error:', err);
          setError('An error occurred during payment. Please try again.');
          setPaymentProcessing(false);
        }
        
      }).render(paypalContainerRef.current);
      
      buttonsRenderedRef.current = true;
      setIsButtonsLoading(false);
      console.log('PayPal buttons rendered successfully');
      
    } catch (error) {
      console.error('Error rendering PayPal buttons:', error);
      setError('Failed to load payment options. Please try again.');
      setIsButtonsLoading(false);
    }
  }, [onPaymentSuccess, cleanup]);

  // Handle step change to payment
  const handleShowPayment = useCallback(async () => {
    setCurrentStep('payment');
    setError(null);
    
    try {
      await loadPayPalSDK();
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        renderPayPalButtons();
      }, 100);
    } catch (error) {
      console.error('Error loading PayPal:', error);
      setError('Failed to load PayPal. Please try again.');
    }
  }, [loadPayPalSDK, renderPayPalButtons]);

  // Handle back to intro
  const handleBackToIntro = useCallback(() => {
    cleanup();
    setCurrentStep('intro');
    setError(null);
    setPaymentProcessing(false);
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md mx-auto shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Unlock Unlimited Plays!</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'intro' ? (
            /* Intro Step */
            <div className="text-center">
              <div className="text-6xl mb-4">🎮</div>
              <p className="text-gray-300 mb-6">
                Enjoy unlimited gaming for just <span className="font-bold text-green-400">$1.00</span>
              </p>
              
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <h3 className="text-white font-semibold mb-3">Premium Features:</h3>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Unlimited games
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    No interruptions
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    One-time payment
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Instant activation
                  </li>
                </ul>
              </div>
              
              <button
                onClick={handleShowPayment}
                disabled={isSDKLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-3"
              >
                <img 
                  src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" 
                  alt="PayPal" 
                  className="h-6 w-auto"
                />
                <span>{isSDKLoading ? 'Loading...' : 'Pay with PayPal'}</span>
              </button>
              
              <p className="text-xs text-gray-500 mt-4">
                🔒 Secure payment processed by PayPal
              </p>
            </div>
          ) : (
            /* Payment Step */
            <div>
              {/* Back button */}
              <button
                onClick={handleBackToIntro}
                disabled={paymentProcessing}
                className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors disabled:opacity-50"
              >
                ← Back
              </button>

              <div className="text-center mb-6">
                <h3 className="text-white font-semibold mb-2">Complete Payment</h3>
                <p className="text-gray-300 text-sm">
                  Click the PayPal button below to complete your $1.00 payment
                </p>
              </div>

              {/* Payment processing overlay */}
              {paymentProcessing && (
                <div className="absolute inset-0 bg-gray-900 bg-opacity-95 flex items-center justify-center rounded-xl z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-white font-semibold">Processing Payment...</p>
                    <p className="text-gray-400 text-sm">Please wait, do not close this window</p>
                  </div>
                </div>
              )}

              {/* PayPal Buttons Container */}
              <div 
                ref={paypalContainerRef} 
                className="min-h-[80px] flex items-center justify-center bg-gray-800 rounded-lg p-4"
                style={{ minHeight: '80px' }}
              >
                {(isSDKLoading || isButtonsLoading) && !error && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-gray-400 text-sm">
                      {isSDKLoading ? 'Loading PayPal SDK...' : 'Loading payment options...'}
                    </p>
                  </div>
                )}
                
                {error && (
                  <div className="text-center">
                    <p className="text-red-400 mb-3 text-sm">{error}</p>
                    <button 
                      onClick={() => {
                        setError(null);
                        handleShowPayment();
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  🔒 Your payment is secured by PayPal's encryption
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
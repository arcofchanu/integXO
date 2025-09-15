// Environment check API route for debugging
export default function handler(req, res) {
  const paypalClientId = process.env.VITE_PAYPAL_CLIENT_ID;
  const paypalSecret = process.env.VITE_PAYPAL_SECRET;
  const environment = process.env.VITE_PAYPAL_ENVIRONMENT || 'sandbox';
  
  res.json({
    timestamp: new Date().toISOString(),
    environment: environment,
    paypalClientIdSet: !!paypalClientId,
    paypalSecretSet: !!paypalSecret,
    clientIdLength: paypalClientId ? paypalClientId.length : 0,
    // Don't expose actual values for security
    clientIdPreview: paypalClientId ? `${paypalClientId.substring(0, 10)}...` : 'Not set'
  });
}
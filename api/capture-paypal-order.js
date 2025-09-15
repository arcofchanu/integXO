// Vercel API route for capturing PayPal orders
// This replaces the Express server for Vercel deployment

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderID } = req.body;
    
    if (!orderID) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    // Get PayPal credentials from environment variables
    const PAYPAL_CLIENT_ID = process.env.VITE_PAYPAL_CLIENT_ID;
    const PAYPAL_SECRET = process.env.VITE_PAYPAL_SECRET;
    const PAYPAL_BASE_URL = process.env.VITE_PAYPAL_ENVIRONMENT === 'production' 
      ? 'https://api.paypal.com' 
      : 'https://api.sandbox.paypal.com';

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      return res.status(500).json({ error: 'PayPal credentials not configured' });
    }

    // Get PayPal access token
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
    
    const tokenResponse = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('PayPal token error:', tokenData);
      return res.status(400).json({ error: 'Failed to get PayPal access token' });
    }

    // Capture PayPal order
    const captureResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const captureData = await captureResponse.json();
    
    if (captureResponse.ok) {
      res.json(captureData);
    } else {
      console.error('PayPal capture failed:', captureData);
      res.status(400).json({ error: 'Failed to capture PayPal order', details: captureData });
    }
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
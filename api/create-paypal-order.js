// Vercel API route for creating PayPal orders
// This replaces the Express server for Vercel deployment

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'USD', description } = req.body;
    
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

    // Create PayPal order
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount
        },
        description: description || 'Unlock unlimited Tic Tac Toe plays'
      }],
      application_context: {
        return_url: `${req.headers.origin || 'https://your-app.vercel.app'}/success`,
        cancel_url: `${req.headers.origin || 'https://your-app.vercel.app'}/cancel`,
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW'
      }
    };

    const orderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify(orderData),
    });

    const order = await orderResponse.json();
    
    if (orderResponse.ok) {
      res.json({ orderID: order.id });
    } else {
      console.error('PayPal order creation failed:', order);
      res.status(400).json({ error: 'Failed to create PayPal order', details: order });
    }
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
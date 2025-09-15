// Simple Express server for PayPal API calls
// Run this with: node server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// PayPal API configuration
const PAYPAL_CLIENT_ID = process.env.VITE_PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.VITE_PAYPAL_SECRET;
const PAYPAL_BASE_URL = process.env.VITE_PAYPAL_ENVIRONMENT === 'production' 
  ? 'https://api.paypal.com' 
  : 'https://api.sandbox.paypal.com';

// Get PayPal access token
async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

// Create PayPal order
app.post('/api/create-paypal-order', async (req, res) => {
  try {
    const { amount, currency = 'USD', description } = req.body;
    
    const accessToken = await getPayPalAccessToken();
    
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
        return_url: `${req.headers.origin}/success`,
        cancel_url: `${req.headers.origin}/cancel`,
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW'
      }
    };

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderData),
    });

    const order = await response.json();
    
    if (response.ok) {
      res.json({ orderID: order.id });
    } else {
      console.error('PayPal order creation failed:', order);
      res.status(400).json({ error: 'Failed to create PayPal order', details: order });
    }
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Capture PayPal order
app.post('/api/capture-paypal-order', async (req, res) => {
  try {
    const { orderID } = req.body;
    
    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const captureData = await response.json();
    
    if (response.ok) {
      res.json(captureData);
    } else {
      console.error('PayPal capture failed:', captureData);
      res.status(400).json({ error: 'Failed to capture PayPal order', details: captureData });
    }
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    paypalConfigured: !!(PAYPAL_CLIENT_ID && PAYPAL_SECRET),
    environment: process.env.VITE_PAYPAL_ENVIRONMENT || 'sandbox'
  });
});

app.listen(PORT, () => {
  console.log(`PayPal API server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.VITE_PAYPAL_ENVIRONMENT || 'sandbox'}`);
  console.log(`PayPal configured: ${!!(PAYPAL_CLIENT_ID && PAYPAL_SECRET)}`);
});
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  const handleSubmit = async (authAction: 'sign_in' | 'sign_up') => {
    setLoading(true);
    setMessage(null);

    const action = authAction === 'sign_in' 
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });

    const { error } = await action;

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else if (authAction === 'sign_up') {
      setMessage({ type: 'success', text: 'Check your email for the verification link!' });
    }
    // On successful sign-in, the onAuthStateChange listener in App.tsx will handle the UI switch.

    setLoading(false);
  };

  return (
    <div className="relative z-10 w-full max-w-md backdrop-blur-sm bg-black/30 p-8 rounded-lg text-gray-200">
      <div className="text-center">
          <h1 className="text-4xl font-bold tracking-widest text-white mb-2 animate-pulse">
            TIC TAC TOE
          </h1>
          <p className="text-gray-400 mb-6">Sign in or create an account to play</p>
      </div>
      <div className="space-y-4">
        <input
          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-300"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <input
          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-300"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
      </div>
      {message && (
        <p className={`mt-4 text-center ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
          {message.text}
        </p>
      )}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => handleSubmit('sign_in')}
          disabled={loading || !email || !password}
          className="flex-1 px-6 py-3 bg-white/5 border border-white/20 text-gray-300 rounded-md text-lg font-semibold hover:bg-white hover:text-black transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
        <button
          onClick={() => handleSubmit('sign_up')}
          disabled={loading || !email || !password}
          className="flex-1 px-6 py-3 bg-white/10 border border-white/20 text-gray-300 rounded-md text-lg font-semibold hover:bg-white hover:text-black transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </div>
    </div>
  );
};

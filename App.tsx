import React, { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Board } from './components/Board';
import { LiveBackground } from './components/LiveBackground';
import { useTicTacToe } from './hooks/useTicTacToe';
import { PaymentPopup } from './components/PaymentPopup';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabaseClient';

const Game: React.FC<{ userEmail: string, onSignOut: () => void }> = ({ userEmail, onSignOut }) => {
  const { board, status, winner, winningLine, handleClick, resetGame, scores, totalMatches } = useTicTacToe();
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);

  useEffect(() => {
    // Show popup after 3 matches if user hasn't paid
    if (totalMatches >= 1 && !hasPaid) {
      setShowPaymentPopup(true);
    }
  }, [totalMatches, hasPaid]);

  const handlePaymentSuccess = useCallback(() => {
    setHasPaid(true);
    setShowPaymentPopup(false);
  }, []);

  const handleClosePayment = useCallback(() => {
    setShowPaymentPopup(false);
    // Allow user to close popup, but it will reappear when they play again
  }, []);

  return (
    <div className="relative z-10 flex flex-col items-center backdrop-blur-sm bg-black/30 p-8 rounded-lg transition-all duration-300">
      <header className="mb-4 text-center w-full">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-400 truncate max-w-[200px]" title={userEmail}>{userEmail}</p>
          <button onClick={onSignOut} className="text-sm text-gray-400 hover:text-white transition-colors">
            Sign Out
          </button>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-widest text-white animate-pulse">
          TIC TAC TOE
        </h1>
      </header>
      
      <main className="flex flex-col items-center">
        <div className="flex justify-center space-x-4 sm:space-x-6 mb-4 text-lg sm:text-xl w-full max-w-sm sm:max-w-md">
          <div className="text-center"><span className="font-bold text-white block">You</span> {scores.X}</div>
          <div className="text-center"><span className="font-bold text-white block">Draw</span> {scores.draw}</div>
          <div className="text-center"><span className="font-bold text-white block">CPU</span> {scores.O}</div>
          <div className="text-center"><span className="font-bold text-white block">Total</span> {totalMatches}</div>
        </div>
        <div className="mb-6 text-2xl h-8 text-gray-300 transition-all duration-300">
          {status}
        </div>
        <Board 
          squares={board} 
          onClick={handleClick} 
          winningLine={winningLine} 
          isGameOver={!!winner}
        />
        <button
          onClick={() => resetGame(true)}
          className="mt-8 px-8 py-3 bg-white/5 border border-white/20 text-gray-300 rounded-md text-lg font-semibold hover:bg-white hover:text-black transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Reset Scores
        </button>
      </main>
      {showPaymentPopup && (
        <PaymentPopup 
          onPaymentSuccess={handlePaymentSuccess} 
          onClose={handleClosePayment}
        />
      )}
    </div>
  );
};


const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (e) {
        console.error("Error getting session:", e);
      } finally {
        setLoading(false);
      }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // The onAuthStateChange listener will handle setting session to null
  }

  return (
    <div className="relative min-h-screen text-gray-200 font-sans flex flex-col items-center justify-center p-4 overflow-hidden">
      <LiveBackground />
      {!loading && (
        !session ? <Auth /> : <Game userEmail={session.user.email!} onSignOut={handleSignOut} />
      )}
    </div>
  );
};

export default App;

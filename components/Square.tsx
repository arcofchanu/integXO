
import React from 'react';
import type { SquareValue } from '../types';

interface SquareProps {
  value: SquareValue;
  onClick: () => void;
  isWinning: boolean;
  isGameOver: boolean;
}

export const Square: React.FC<SquareProps> = ({ value, onClick, isWinning, isGameOver }) => {
  const valueColor = value === 'X' ? 'text-gray-100' : 'text-gray-400';
  const winningStyle = isWinning ? 'bg-white/20' : 'bg-white/5';
  const hoverStyle = !value && !isGameOver ? 'hover:bg-white/10' : 'cursor-not-allowed';

  return (
    <button
      className={`w-24 h-24 md:w-32 md:h-32 flex items-center justify-center border-2 border-white/20 text-6xl font-bold transition-all duration-200 rounded-md ${valueColor} ${winningStyle} ${hoverStyle}`}
      onClick={onClick}
      disabled={!!value || isGameOver}
    >
      {value}
    </button>
  );
};
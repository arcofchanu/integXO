
import React from 'react';
import { Square } from './Square';
import type { SquareValue } from '../types';

interface BoardProps {
  squares: SquareValue[];
  onClick: (i: number) => void;
  winningLine: number[] | null;
  isGameOver: boolean;
}

export const Board: React.FC<BoardProps> = ({ squares, onClick, winningLine, isGameOver }) => {
  const renderSquare = (i: number) => {
    const isWinning = winningLine?.includes(i) ?? false;
    return (
      <Square
        key={i}
        value={squares[i]}
        onClick={() => onClick(i)}
        isWinning={isWinning}
        isGameOver={isGameOver}
      />
    );
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {squares.map((_, i) => renderSquare(i))}
    </div>
  );
};

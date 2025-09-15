import { useState, useCallback, useMemo, useEffect } from 'react';
import type { SquareValue } from '../types';

const calculateWinner = (squares: SquareValue[]): { winner: 'X' | 'O' | null; line: number[] | null } => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: lines[i] };
    }
  }
  return { winner: null, line: null };
};

export const useTicTacToe = () => {
  const [board, setBoard] = useState<SquareValue[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true); // Player 'X' always starts
  const [scores, setScores] = useState({ X: 0, O: 0, draw: 0 });
  const [totalMatches, setTotalMatches] = useState(0);

  const { winner, line: winningLine } = useMemo(() => calculateWinner(board), [board]);
  
  const isDraw = useMemo(() => board.every(square => square !== null) && !winner, [board, winner]);

  const resetGame = useCallback((resetScoresAndMatches = false) => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    if (resetScoresAndMatches) {
      setScores({ X: 0, O: 0, draw: 0 });
      setTotalMatches(0);
    }
  }, []);

  useEffect(() => {
    if (winner || isDraw) {
      // Update scores
      if (winner) {
        setScores(prevScores => ({
          ...prevScores,
          [winner]: prevScores[winner] + 1,
        }));
      } else if (isDraw) {
        setScores(prevScores => ({
          ...prevScores,
          draw: prevScores.draw + 1,
        }));
      }
      setTotalMatches(prevTotal => prevTotal + 1);

      // Automatically reset the game after a delay
      const timer = setTimeout(() => {
        resetGame(false); // Only reset the board, not scores
      }, 2000); // 2-second delay

      // Cleanup the timer
      return () => clearTimeout(timer);
    }
  }, [winner, isDraw, resetGame]);

  const status = useMemo(() => {
    if (winner) {
      return winner === 'X' ? 'You Win!' : 'CPU Wins!';
    }
    if (isDraw) {
      return 'Result: Draw';
    }
    return isXNext ? 'Your turn (X)' : 'Computer is thinking...';
  }, [winner, isDraw, isXNext]);

  const handleClick = useCallback((i: number) => {
    // Player can't click if game is over, square is taken, or it's not their turn
    if (winner || board[i] || !isXNext) {
      return;
    }
    const newBoard = board.slice();
    newBoard[i] = 'X'; // Player is always 'X'
    setBoard(newBoard);
    setIsXNext(false); // Set to computer's turn
  }, [board, isXNext, winner]);

  useEffect(() => {
    // Computer's turn logic
    if (!isXNext && !winner && !isDraw) {
      const findBestMove = (currentBoard: SquareValue[]): number => {
        const emptyIndices = currentBoard
          .map((val, index) => (val === null ? index : null))
          .filter((val): val is number => val !== null);

        // 1. Check for a winning move for 'O'
        for (const index of emptyIndices) {
          const tempBoard = [...currentBoard];
          tempBoard[index] = 'O';
          if (calculateWinner(tempBoard).winner === 'O') {
            return index;
          }
        }

        // 2. Check to block 'X' from winning
        for (const index of emptyIndices) {
          const tempBoard = [...currentBoard];
          tempBoard[index] = 'X';
          if (calculateWinner(tempBoard).winner === 'X') {
            return index;
          }
        }
        
        // 3. Take the center if available
        if (emptyIndices.includes(4)) {
          return 4;
        }

        // 4. Take a random corner
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(index => emptyIndices.includes(index));
        if (availableCorners.length > 0) {
          return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }

        // 5. Take any remaining square
        return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      };
      
      const timeoutId = setTimeout(() => {
        const computerMove = findBestMove(board);
        if (computerMove !== undefined) {
          const newBoard = board.slice();
          newBoard[computerMove] = 'O';
          setBoard(newBoard);
          setIsXNext(true); // Set back to player's turn
        }
      }, 800);

      return () => clearTimeout(timeoutId);
    }
  }, [board, isXNext, winner, isDraw]);

  return {
    board,
    status,
    winner: winner || (isDraw ? 'draw' : null),
    winningLine,
    handleClick,
    resetGame,
    scores,
    totalMatches,
  };
};
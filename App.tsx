import React, { useState, useEffect, useCallback } from 'react';
import { BoardData, GameStatus, Difficulty, DIFFICULTIES, HighScores, Theme, THEMES } from './types';
import { 
  createEmptyBoard, 
  initializeBoardWithMines, 
  revealCell, 
  toggleFlag, 
  checkWin, 
  revealAllMines,
  getHighScores,
  saveHighScore
} from './utils/gameLogic';
import { initAudio, playClick, playFlag, playUnflag, playExplosion, playWin } from './utils/sound';
import Cell from './components/Cell';
import Controls from './components/Controls';
import Leaderboard from './components/Leaderboard';
import confetti from 'canvas-confetti';

const App: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTIES[0]);
  const [theme, setTheme] = useState<Theme>(THEMES[0]);
  const [zoomLevel, setZoomLevel] = useState<number>(35); // Default size in px

  const [board, setBoard] = useState<BoardData>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [flagsCount, setFlagsCount] = useState(0);
  
  const [highScores, setHighScores] = useState<HighScores>({});
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [newRecord, setNewRecord] = useState(false);

  // Init audio context on first interaction
  useEffect(() => {
    const handleInteraction = () => {
        initAudio();
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    return () => {
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const initGame = useCallback(() => {
    // Ensure inputs are valid before creation
    const validRows = Math.max(5, Math.min(50, difficulty.rows));
    const validCols = Math.max(5, Math.min(50, difficulty.cols));
    
    // Safety check: mines must be less than total cells
    const maxMines = (validRows * validCols) - 1;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const validMines = Math.min(difficulty.mines, maxMines);
    
    setBoard(createEmptyBoard(validRows, validCols));
    setGameStatus('idle');
    setTimeElapsed(0);
    setFlagsCount(0);
    setNewRecord(false);
    setHighScores(getHighScores());
  }, [difficulty]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (gameStatus === 'playing') {
      timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStatus]);

  const handleUpdateCustomSettings = (key: keyof Difficulty, value: number) => {
    if (difficulty.name !== 'Настраиваемый') return;

    setDifficulty(prev => {
        const newDiff = { ...prev, [key]: value };
        
        // Strict Clamping for inputs
        if (key === 'rows' || key === 'cols') {
             // Limit grid size to between 5 and 50 to prevent browser crash
             if (value > 50) newDiff[key] = 50;
             if (value < 5) newDiff[key] = 5;
        }

        // Auto-adjust mines if they exceed new capacity
        const maxMines = (newDiff.rows * newDiff.cols) - 1;
        if (newDiff.mines > maxMines) {
            newDiff.mines = maxMines;
        }
        if (key === 'mines' && value < 1) {
            newDiff.mines = 1;
        }

        return newDiff;
    });
  };

  const handleWin = (finalTime: number) => {
    setGameStatus('won');
    playWin();
    
    const currentBest = highScores[difficulty.name];
    if (currentBest === undefined || finalTime < currentBest) {
      const updatedScores = saveHighScore(difficulty.name, finalTime);
      setHighScores(updatedScores);
      setNewRecord(true);
      
      const end = Date.now() + 1000;
      const colors = ['#bb0000', '#ffffff'];
      (function frame() {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    } else {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
        });
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (gameStatus === 'won' || gameStatus === 'lost') return;
    if (board[row][col].status === 'flagged') return;

    let newBoard = board;

    if (gameStatus === 'idle') {
      setGameStatus('playing');
      const boardWithMines = initializeBoardWithMines(board, difficulty, row, col);
      newBoard = boardWithMines;
    }

    const { board: nextBoard, exploded } = revealCell(newBoard, row, col);
    setBoard(nextBoard);

    if (exploded) {
      playExplosion();
      setGameStatus('lost');
      setBoard(revealAllMines(nextBoard, false));
    } else {
      playClick();
      if (checkWin(nextBoard, difficulty)) {
        setBoard(revealAllMines(nextBoard, true));
        handleWin(timeElapsed);
      }
    }
  };

  const handleRightClick = (row: number, col: number) => {
    if (gameStatus === 'won' || gameStatus === 'lost') return;
    
    const cell = board[row][col];
    if (cell.status === 'revealed') return;

    if (cell.status === 'hidden') {
        setFlagsCount(prev => prev + 1);
        playFlag();
    }
    else if (cell.status === 'flagged') {
        setFlagsCount(prev => prev - 1);
        playUnflag();
    }

    const newBoard = toggleFlag(board, row, col);
    setBoard(newBoard);
  };

  // Grid style uses fixed pixel sizes now to allow scrolling and proper zooming
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${difficulty.cols}, ${zoomLevel}px)`,
    gridTemplateRows: `repeat(${difficulty.rows}, ${zoomLevel}px)`,
    gap: '1px',
    padding: '2px',
  };

  return (
    <div className={`flex flex-col lg:flex-row h-screen w-screen overflow-hidden transition-colors duration-300 ${theme.appBg}`}>
      
      {/* SIDEBAR */}
      <div className={`w-full lg:w-96 border-r shadow-2xl z-20 flex flex-col shrink-0 h-auto lg:h-full overflow-y-auto transition-colors duration-300 ${theme.panelBg} ${theme.panelBorder}`}>
        <div className="p-6 md:p-8 flex flex-col gap-6">
          <div>
            <h1 className={`text-4xl font-extrabold tracking-tight drop-shadow-sm ${theme.textMain}`}>
                Сапёр
            </h1>
            <p className={`text-sm mt-1 ${theme.textSecondary}`}>Классическая головоломка</p>
          </div>

          <Controls 
              minesLeft={difficulty.mines - flagsCount}
              timeElapsed={timeElapsed}
              onReset={initGame}
              currentDifficulty={difficulty}
              onChangeDifficulty={setDifficulty}
              onUpdateCustomSettings={handleUpdateCustomSettings}
              currentTheme={theme}
              onChangeTheme={setTheme}
              zoomLevel={zoomLevel}
              onChangeZoom={setZoomLevel}
              onOpenLeaderboard={() => setShowLeaderboard(true)}
          />

          <div className={`mt-auto pt-6 text-xs font-medium opacity-60 border-t ${theme.id === 'retro' ? 'border-gray-500' : 'border-white/10'} ${theme.textSecondary}`}>
             <div className="flex justify-between mb-2">
               <span>Открыть</span>
               <span>Левый клик</span>
             </div>
             <div className="flex justify-between">
               <span>Флаг</span>
               <span>Правый клик</span>
             </div>
          </div>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className={`flex-1 relative overflow-hidden flex flex-col ${theme.boardBg}`}>
        
        {/* Scrollable Container */}
        <div className="flex-1 w-full h-full overflow-auto flex items-center justify-center p-4">
             {/* The grid wrapper */}
             <div className={`shadow-2xl rounded-sm ${theme.id === 'retro' ? 'bg-gray-400' : 'bg-slate-700/20'}`} style={{display: 'inline-block'}}>
                <div style={gridStyle}>
                  {board.map((row, rIndex) => (
                      row.map((cell, cIndex) => (
                      <Cell 
                          key={`${rIndex}-${cIndex}`}
                          data={cell}
                          theme={theme}
                          onClick={handleCellClick}
                          onRightClick={handleRightClick}
                          disabled={gameStatus === 'won' || gameStatus === 'lost'}
                      />
                      ))
                  ))}
                </div>
            </div>
        </div>

        {/* Overlay for Game Over / Win */}
        {(gameStatus === 'won' || gameStatus === 'lost') && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-[2px] animate-fade-in p-4">
                <div className={`p-8 rounded-2xl border text-center shadow-2xl transform scale-100 transition-transform max-w-sm w-full ${theme.panelBg} ${theme.panelBorder} ${theme.textMain}`}>
                    <h2 className={`text-4xl font-black mb-2 ${gameStatus === 'won' ? 'text-green-500' : 'text-red-500'}`}>
                        {gameStatus === 'won' ? 'ПОБЕДА!' : 'БА-БАХ!'}
                    </h2>
                    <div className={`mb-8 space-y-1 ${theme.textSecondary}`}>
                        <p className="text-lg">
                            {gameStatus === 'won' 
                                ? `Время: ${timeElapsed} сек.` 
                                : 'Мина взорвалась!'}
                        </p>
                        {newRecord && (
                            <p className="text-yellow-400 font-bold animate-pulse mt-2">
                                🏆 НОВЫЙ РЕКОРД! 🏆
                            </p>
                        )}
                    </div>
                    <button 
                        onClick={initGame}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all active:scale-95"
                    >
                        Играть снова
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Leaderboard Modal */}
      <Leaderboard 
        isOpen={showLeaderboard} 
        onClose={() => setShowLeaderboard(false)}
        scores={highScores}
      />
    </div>
  );
};

export default App;
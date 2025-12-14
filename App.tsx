import React, { useState, useEffect, useCallback } from 'react';
import { BoardData, GameStatus, Difficulty, DIFFICULTIES, HighScores, Theme, THEMES, GameMode, NetworkAction } from './types';
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
import { network } from './utils/network';
import Cell from './components/Cell';
import Controls from './components/Controls';
import Leaderboard from './components/Leaderboard';
import Lobby from './components/Lobby';
import confetti from 'canvas-confetti';
import { Wifi, WifiOff } from 'lucide-react';

const App: React.FC = () => {
  // --- Game Config State ---
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTIES[0]);
  const [theme, setTheme] = useState<Theme>(THEMES[0]);
  const [zoomLevel, setZoomLevel] = useState<number>(35);

  // --- Game Play State ---
  const [board, setBoard] = useState<BoardData>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [flagsCount, setFlagsCount] = useState(0);
  
  // --- UI/System State ---
  const [highScores, setHighScores] = useState<HighScores>({});
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [newRecord, setNewRecord] = useState(false);

  // --- Multiplayer State ---
  const [gameMode, setGameMode] = useState<GameMode | 'menu'>('menu');
  const [lobbyError, setLobbyError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [guestConnected, setGuestConnected] = useState(false);
  const [waitingForHost, setWaitingForHost] = useState(false);

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

  // --- Core Game Logic ---

  const initGame = useCallback(() => {
    // Single player init logic (also used by Host before sync)
    const validRows = Math.max(5, Math.min(50, difficulty.rows));
    const validCols = Math.max(5, Math.min(50, difficulty.cols));
    
    setBoard(createEmptyBoard(validRows, validCols));
    setGameStatus('idle');
    setTimeElapsed(0);
    setFlagsCount(0);
    setNewRecord(false);
    setHighScores(getHighScores());
  }, [difficulty]);

  // Initial setup for single player
  useEffect(() => {
     if (gameMode === 'single') {
         initGame();
     }
  }, [initGame, gameMode]);

  // Timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (gameStatus === 'playing') {
      timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStatus]);

  // --- Networking & Synchronization ---

  const syncStateToGuest = useCallback((currentBoard: BoardData, status: GameStatus, time: number, flags: number) => {
      if (gameMode === 'multi_host') {
          network.send({
              type: 'SYNC_BOARD',
              board: currentBoard,
              status,
              time,
              flags
          } as NetworkAction);
      }
  }, [gameMode]);

  useEffect(() => {
      // Network Data Listener
      network.onData = (data: NetworkAction) => {
          if (gameMode === 'multi_guest' || waitingForHost) {
              if (data.type === 'START_GAME') {
                  setDifficulty(data.difficulty);
                  setWaitingForHost(false);
                  setGameMode('multi_guest');
                  setTimeout(() => initGame(), 50);
              }
              if (data.type === 'SYNC_BOARD') {
                  setBoard(data.board);
                  setGameStatus(data.status);
                  setTimeElapsed(data.time);
                  setFlagsCount(data.flags);
                  
                  // Trigger sounds based on status change
                  if (data.status === 'lost') playExplosion();
                  if (data.status === 'won') playWin();
              }
          } else if (gameMode === 'multi_host') {
              // Host receives actions from guest
              if (data.type === 'CLICK_CELL') {
                  handleCellClick(data.row, data.col);
              }
              if (data.type === 'RIGHT_CLICK_CELL') {
                  handleRightClick(data.row, data.col);
              }
              if (data.type === 'RESTART') {
                  setDifficulty(data.difficulty);
                  // Use timeout to allow state to settle before re-init
                  setTimeout(() => initGame(), 50);
                  // Need to force sync after restart
                  setTimeout(() => {
                      const validRows = Math.max(5, Math.min(50, data.difficulty.rows));
                      const validCols = Math.max(5, Math.min(50, data.difficulty.cols));
                      syncStateToGuest(createEmptyBoard(validRows, validCols), 'idle', 0, 0);
                  }, 100);
              }
          }
      };

      network.onError = (err) => {
          setLobbyError(err);
          setIsConnecting(false);
          setWaitingForHost(false);
          if (gameMode !== 'menu') {
              alert(err);
              setGameMode('menu');
              network.destroy();
          }
      };
      
      return () => {
          network.onData = null;
          network.onError = null;
      };
  }); 

  // --- Lobby Handlers ---

  const handleSinglePlayer = () => {
      setGameMode('single');
      initGame();
  };

  const handleHostGame = (code: string) => {
      setLobbyError(null);
      setIsConnecting(true);
      setGuestConnected(false);
      
      network.initialize(true, code);
      
      network.onOpen = () => {
          setIsConnecting(false);
      };

      network.onConnect = () => {
          setGuestConnected(true);
      };
  };

  const handleStartMultiplayer = () => {
      if (!guestConnected) return;
      
      // Notify guest to start
      network.send({ type: 'START_GAME', difficulty });
      setGameMode('multi_host');
      initGame();
      
      // Initial Sync
      setTimeout(() => {
          const rows = difficulty.rows;
          const cols = difficulty.cols;
          const empty = createEmptyBoard(rows, cols);
          syncStateToGuest(empty, 'idle', 0, 0);
      }, 100);
  };

  const handleJoinGame = (code: string) => {
      setLobbyError(null);
      setIsConnecting(true);
      setWaitingForHost(false);
      
      network.initialize(false);
      network.connectToHost(code);
      
      network.onConnect = () => {
          setIsConnecting(false);
          setWaitingForHost(true);
      };
  };

  const handleBackToMenu = () => {
      network.destroy();
      setGameMode('menu');
      setIsConnecting(false);
      setLobbyError(null);
      setGuestConnected(false);
      setWaitingForHost(false);
  };


  // --- Game Interaction Handlers ---

  const handleWin = (finalTime: number) => {
    setGameStatus('won');
    playWin();
    
    // Confetti logic
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

    // Save score only in single player
    if (gameMode === 'single') {
        const currentBest = highScores[difficulty.name];
        if (currentBest === undefined || finalTime < currentBest) {
          const updatedScores = saveHighScore(difficulty.name, finalTime);
          setHighScores(updatedScores);
          setNewRecord(true);
        }
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (gameStatus === 'won' || gameStatus === 'lost') return;
    if (board[row] && board[row][col].status === 'flagged') return;

    // Guest Logic: Forward click to host
    if (gameMode === 'multi_guest') {
        network.send({ type: 'CLICK_CELL', row, col });
        return; 
    }

    // Host/Single Logic
    let newBoard = board;
    let newStatus = gameStatus;

    if (gameStatus === 'idle') {
      newStatus = 'playing';
      setGameStatus('playing');
      const boardWithMines = initializeBoardWithMines(board, difficulty, row, col);
      newBoard = boardWithMines;
    }

    const { board: nextBoard, exploded } = revealCell(newBoard, row, col);
    setBoard(nextBoard);
    playClick();

    if (exploded) {
      playExplosion();
      newStatus = 'lost';
      setGameStatus('lost');
      const finalBoard = revealAllMines(nextBoard, false);
      setBoard(finalBoard);
      syncStateToGuest(finalBoard, 'lost', timeElapsed, flagsCount);
    } else {
      if (checkWin(nextBoard, difficulty)) {
        newStatus = 'won';
        const finalBoard = revealAllMines(nextBoard, true);
        setBoard(finalBoard);
        handleWin(timeElapsed);
        syncStateToGuest(finalBoard, 'won', timeElapsed, flagsCount);
      } else {
          // Just a normal update
          syncStateToGuest(nextBoard, newStatus, timeElapsed, flagsCount);
      }
    }
  };

  const handleRightClick = (row: number, col: number) => {
    if (gameStatus === 'won' || gameStatus === 'lost') return;
    
    // Guest Logic
    if (gameMode === 'multi_guest') {
        network.send({ type: 'RIGHT_CLICK_CELL', row, col });
        return;
    }

    // Host/Single Logic
    const cell = board[row][col];
    if (cell.status === 'revealed') return;

    let newFlags = flagsCount;
    if (cell.status === 'hidden') {
        newFlags++;
        playFlag();
    }
    else if (cell.status === 'flagged') {
        newFlags--;
        playUnflag();
    }
    setFlagsCount(newFlags);

    const newBoard = toggleFlag(board, row, col);
    setBoard(newBoard);
    syncStateToGuest(newBoard, gameStatus, timeElapsed, newFlags);
  };

  const handleReset = () => {
      if (gameMode === 'multi_guest') {
          // Request restart from host
          network.send({ type: 'RESTART', difficulty });
      } else {
          initGame();
          if (gameMode === 'multi_host') {
             setTimeout(() => {
                 const rows = difficulty.rows;
                 const cols = difficulty.cols;
                 const empty = createEmptyBoard(rows, cols);
                 syncStateToGuest(empty, 'idle', 0, 0);
             }, 50);
          }
      }
  };

  const handleUpdateCustomSettings = (key: keyof Difficulty, value: number) => {
    if (difficulty.name !== 'Настраиваемый') return;
    if (gameMode === 'multi_guest') return;

    setDifficulty(prev => {
        const newDiff = { ...prev, [key]: value };
        if (key === 'rows' || key === 'cols') {
             if (value > 50) newDiff[key] = 50;
             if (value < 5) newDiff[key] = 5;
        }
        const maxMines = (newDiff.rows * newDiff.cols) - 1;
        if (newDiff.mines > maxMines) newDiff.mines = maxMines;
        if (key === 'mines' && value < 1) newDiff.mines = 1;
        return newDiff;
    });
  };

  // --- Grid Style ---
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${difficulty.cols}, ${zoomLevel}px)`,
    gridTemplateRows: `repeat(${difficulty.rows}, ${zoomLevel}px)`,
    gap: '1px',
    padding: '2px',
  };


  // --- Render ---

  if (gameMode === 'menu') {
      return (
         <div className={`flex flex-col h-screen w-screen items-center justify-center transition-colors duration-300 ${theme.appBg}`}>
            <Lobby 
                theme={theme}
                onSinglePlayer={handleSinglePlayer}
                onHostGame={handleHostGame}
                onJoinGame={handleJoinGame}
                onStartGame={handleStartMultiplayer}
                isConnecting={isConnecting}
                error={lobbyError}
                onBack={handleBackToMenu}
                guestConnected={guestConnected}
                waitingForHost={waitingForHost}
            />
            {/* Theme toggle in menu */}
             <div className="absolute bottom-4 right-4 flex gap-2">
                {THEMES.map(t => (
                    <button key={t.id} onClick={() => setTheme(t)} className="w-6 h-6 rounded-full border border-white/20" style={{backgroundColor: t.appBg}}></button>
                ))}
             </div>
         </div>
      );
  }

  // --- Game Render ---

  return (
    <div className={`flex flex-col lg:flex-row h-screen w-screen overflow-hidden transition-colors duration-300 ${theme.appBg}`}>
      
      {/* SIDEBAR */}
      <div className={`w-full lg:w-96 border-r shadow-2xl z-20 flex flex-col shrink-0 h-auto lg:h-full overflow-y-auto transition-colors duration-300 ${theme.panelBg} ${theme.panelBorder}`}>
        <div className="p-6 md:p-8 flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div>
                <h1 className={`text-4xl font-extrabold tracking-tight drop-shadow-sm ${theme.textMain}`}>
                    Сапёр
                </h1>
                <p className={`text-sm mt-1 ${theme.textSecondary}`}>
                    {gameMode === 'single' && 'Одиночная игра'}
                    {gameMode === 'multi_host' && 'Онлайн (Хост)'}
                    {gameMode === 'multi_guest' && 'Онлайн (Игрок)'}
                </p>
            </div>
            {gameMode !== 'single' && (
                <div title={gameMode === 'multi_host' ? "Вы сервер" : "Подключено"} className="text-green-500 animate-pulse">
                    <Wifi size={24} />
                </div>
            )}
          </div>

          <Controls 
              minesLeft={difficulty.mines - flagsCount}
              timeElapsed={timeElapsed}
              onReset={handleReset}
              currentDifficulty={difficulty}
              onChangeDifficulty={gameMode === 'multi_guest' ? () => {} : setDifficulty}
              onUpdateCustomSettings={handleUpdateCustomSettings}
              currentTheme={theme}
              onChangeTheme={setTheme}
              zoomLevel={zoomLevel}
              onChangeZoom={setZoomLevel}
              onOpenLeaderboard={() => setShowLeaderboard(true)}
          />

          <div className="flex flex-col gap-2">
               <button onClick={handleBackToMenu} className={`w-full py-2 rounded-lg border text-sm opacity-60 hover:opacity-100 transition-opacity ${theme.textSecondary} ${theme.panelBorder}`}>
                   Выйти в меню
               </button>
          </div>

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
             {board.length > 0 ? (
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
             ) : (
                 <div className="flex items-center justify-center text-white/50">
                     <div className="animate-spin mr-2"><WifiOff/></div> Загрузка поля...
                 </div>
             )}
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
                        {newRecord && gameMode === 'single' && (
                            <p className="text-yellow-400 font-bold animate-pulse mt-2">
                                🏆 НОВЫЙ РЕКОРД! 🏆
                            </p>
                        )}
                        {gameMode !== 'single' && (
                            <p className="text-sm mt-2 opacity-70">
                                {gameMode === 'multi_host' ? 'Вы управляете перезапуском' : 'Хост должен перезапустить игру'}
                            </p>
                        )}
                    </div>
                    <button 
                        onClick={handleReset}
                        disabled={gameMode === 'multi_guest'}
                        className={`w-full text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all active:scale-95 ${
                            gameMode === 'multi_guest' 
                            ? 'bg-gray-600 cursor-wait' 
                            : 'bg-blue-600 hover:bg-blue-500'
                        }`}
                    >
                        {gameMode === 'multi_guest' ? 'Ожидание хоста...' : 'Играть снова'}
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
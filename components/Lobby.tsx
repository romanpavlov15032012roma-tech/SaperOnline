import React, { useState } from 'react';
import { Users, UserPlus, Play, Copy, ArrowLeft, CheckCircle2, Loader2, Gamepad2, Settings, User } from 'lucide-react';
import { generateShortId } from '../utils/network';
import { Theme, Difficulty, DIFFICULTIES } from '../types';

interface LobbyProps {
  theme: Theme;
  onSinglePlayer: () => void;
  onHostGame: (code: string) => void;
  onJoinGame: (code: string) => void;
  onStartGame: () => void;
  isConnecting: boolean;
  error: string | null;
  onBack: () => void;
  guestConnected: boolean;
  waitingForHost: boolean;
  currentDifficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
}

const Lobby: React.FC<LobbyProps> = ({ 
    theme, 
    onSinglePlayer, 
    onHostGame, 
    onJoinGame, 
    onStartGame,
    isConnecting, 
    error, 
    onBack,
    guestConnected,
    waitingForHost,
    currentDifficulty,
    onDifficultyChange
}) => {
  const [mode, setMode] = useState<'menu' | 'host' | 'join'>('menu');
  const [joinCode, setJoinCode] = useState('');
  // Use state to hold the code, but update it when hosting starts
  const [generatedCode, setGeneratedCode] = useState(generateShortId());

  const cardStyle = `p-6 rounded-2xl border-2 transition-all ${theme.panelBg} ${theme.panelBorder} ${theme.textMain}`;

  if (mode === 'menu') {
      return (
        <div className="flex flex-col gap-6 w-full max-w-md mx-auto p-8 animate-fade-in relative z-10">
             <div className="text-center mb-4 opacity-0 animate-slide-up" style={{ animationDelay: '0ms' }}>
                 <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl mb-4 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                    <Gamepad2 size={48} className="text-white" />
                 </div>
                 <h2 className={`text-3xl font-black tracking-tight ${theme.textMain}`}>Сапёр Online</h2>
                 <p className={`text-sm mt-2 opacity-70 ${theme.textSecondary}`}>Классическая игра в новом формате</p>
             </div>
             
             <button 
                onClick={onSinglePlayer}
                className="opacity-0 animate-slide-up w-full group relative overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 px-6 rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95"
                style={{ animationDelay: '100ms' }}
             >
                 <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                 <div className="relative flex items-center justify-center gap-4">
                     <Play size={28} className="fill-current" />
                     <span className="text-xl">Одиночная игра</span>
                 </div>
             </button>

             <div className="flex items-center gap-4 opacity-0 animate-slide-up" style={{ animationDelay: '200ms' }}>
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
                <span className={`text-xs uppercase font-bold tracking-widest opacity-50 ${theme.textSecondary}`}>Мультиплеер</span>
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
             </div>

             <div className="grid grid-cols-2 gap-4 opacity-0 animate-slide-up" style={{ animationDelay: '300ms' }}>
                 <button 
                    onClick={() => {
                        const newCode = generateShortId();
                        setGeneratedCode(newCode);
                        setMode('host');
                        onHostGame(newCode);
                    }}
                    className={`group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all hover:bg-opacity-10 ${theme.panelBg} ${theme.panelBorder} ${theme.textMain} hover:border-blue-400 hover:-translate-y-1 active:translate-y-0`}
                 >
                     <div className="p-3 rounded-full bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                        <UserPlus size={32} className="text-green-400" />
                     </div>
                     <span className="font-bold">Создать</span>
                 </button>

                 <button 
                    onClick={() => setMode('join')}
                    className={`group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all hover:bg-opacity-10 ${theme.panelBg} ${theme.panelBorder} ${theme.textMain} hover:border-blue-400 hover:-translate-y-1 active:translate-y-0`}
                 >
                     <div className="p-3 rounded-full bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors">
                        <Users size={32} className="text-yellow-400" />
                     </div>
                     <span className="font-bold">Войти</span>
                 </button>
             </div>
        </div>
      );
  }

  if (mode === 'host' || (mode === 'join' && waitingForHost)) {
      const isHost = mode === 'host';
      return (
          <div className="flex flex-col gap-6 w-full max-w-lg mx-auto p-6 animate-scale-in">
              {/* Header with Code */}
              <div className="text-center">
                  <h2 className={`text-sm uppercase font-bold tracking-widest opacity-60 mb-2 ${theme.textSecondary}`}>
                      Код Лобби
                  </h2>
                  <div className={`p-6 rounded-2xl border-2 border-dashed ${theme.textMain} border-white/20 bg-black/20 relative overflow-hidden group`}>
                       {isConnecting && !isHost ? (
                           <Loader2 className="animate-spin mx-auto" />
                       ) : (
                        <div className="flex items-center justify-center gap-3 relative z-10">
                            <span className="text-5xl font-mono font-black tracking-widest text-blue-400 select-all drop-shadow-sm">
                                {isHost ? generatedCode : joinCode}
                            </span>
                            <button 
                                onClick={() => navigator.clipboard.writeText(isHost ? generatedCode : joinCode)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-all"
                            >
                                <Copy size={20} />
                            </button>
                        </div>
                       )}
                  </div>
              </div>

              {/* Lobby Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Player List */}
                  <div className={cardStyle}>
                      <h3 className={`text-sm font-bold uppercase mb-4 flex items-center gap-2 ${theme.textSecondary}`}>
                          <Users size={16} /> Игроки
                      </h3>
                      <div className="space-y-3">
                          {/* Host */}
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                               <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white shadow-lg">
                                    <User size={20} />
                               </div>
                               <div>
                                   <div className={`font-bold ${theme.textMain}`}>Хост</div>
                                   <div className="text-xs text-green-400 flex items-center gap-1">
                                       <div className="w-2 h-2 rounded-full bg-green-500"></div> В сети
                                   </div>
                               </div>
                          </div>
                          
                          {/* Guest */}
                          <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                              guestConnected 
                              ? 'bg-white/5 border-white/10' 
                              : 'bg-transparent border-dashed border-white/20 opacity-50'
                          }`}>
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                                   guestConnected ? 'bg-purple-500' : 'bg-gray-600'
                               }`}>
                                    {guestConnected ? <User size={20} /> : <Loader2 size={20} className={!guestConnected ? 'animate-spin' : ''} />}
                               </div>
                               <div>
                                   <div className={`font-bold ${theme.textMain}`}>Гость</div>
                                   <div className={`text-xs flex items-center gap-1 ${guestConnected ? 'text-green-400' : theme.textSecondary}`}>
                                       {guestConnected ? (
                                           <><div className="w-2 h-2 rounded-full bg-green-500"></div> Готов к игре</>
                                       ) : (
                                           'Ожидание...'
                                       )}
                                   </div>
                               </div>
                          </div>
                      </div>
                  </div>

                  {/* Settings (Host Only) or Info (Guest) */}
                  <div className={cardStyle}>
                       <h3 className={`text-sm font-bold uppercase mb-4 flex items-center gap-2 ${theme.textSecondary}`}>
                          <Settings size={16} /> Настройки
                      </h3>
                      {isHost ? (
                          <div className="space-y-4">
                              <div>
                                  <label className={`text-xs block mb-1 opacity-70 ${theme.textSecondary}`}>Сложность</label>
                                  <select 
                                      value={currentDifficulty.name}
                                      onChange={(e) => {
                                          const d = DIFFICULTIES.find(diff => diff.name === e.target.value);
                                          if(d) onDifficultyChange(d);
                                      }}
                                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm font-bold focus:outline-none focus:border-blue-500"
                                  >
                                      {DIFFICULTIES.filter(d => d.name !== 'Настраиваемый').map(d => (
                                          <option key={d.name} value={d.name}>{d.name}</option>
                                      ))}
                                  </select>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-center">
                                  <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                                      <div className={`text-xs ${theme.textSecondary}`}>Поле</div>
                                      <div className="font-mono font-bold">{currentDifficulty.rows}x{currentDifficulty.cols}</div>
                                  </div>
                                  <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                                      <div className={`text-xs ${theme.textSecondary}`}>Мины</div>
                                      <div className="font-mono font-bold text-red-400">{currentDifficulty.mines}</div>
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="h-full flex flex-col justify-center items-center text-center space-y-2 opacity-80">
                               <p className="text-sm">Хост выбирает настройки...</p>
                               <div className="text-xs opacity-50">Сложность: {currentDifficulty.name}</div>
                               <div className="text-xs opacity-50">{currentDifficulty.rows}x{currentDifficulty.cols}, {currentDifficulty.mines} мин</div>
                          </div>
                      )}
                  </div>
              </div>

              {/* Start Button Area */}
              <div className="mt-2">
                  {isHost ? (
                      <button 
                        onClick={onStartGame}
                        disabled={!guestConnected}
                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                            guestConnected 
                            ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white active:scale-95'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                        }`}
                      >
                          {guestConnected ? <><Play fill="currentColor" /> ЗАПУСТИТЬ ИГРУ</> : 'Ожидание игрока...'}
                      </button>
                  ) : (
                       <div className="w-full py-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 animate-pulse text-sm font-medium">
                           <Loader2 className="animate-spin" /> Ожидание запуска игры хостом...
                       </div>
                  )}
              </div>
              
              <button 
                 onClick={() => {
                     setMode('menu');
                     onBack();
                 }}
                 className={`mx-auto flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium opacity-50 hover:opacity-100 transition-all ${theme.textSecondary}`}
              >
                  <ArrowLeft size={16} /> Покинуть лобби
              </button>
          </div>
      );
  }

  if (mode === 'join') {
      return (
          <div className="flex flex-col gap-6 w-full max-w-md mx-auto p-6 animate-scale-in text-center">
              <h2 className={`text-xl font-bold ${theme.textMain}`}>Вход в лобби</h2>
              
              <div className="flex flex-col gap-2 text-left">
                    <label className={`text-sm font-semibold ${theme.textSecondary}`}>Введите код лобби</label>
                    <input 
                        type="text" 
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="XXXXXX"
                        maxLength={6}
                        disabled={isConnecting}
                        autoFocus
                        className={`w-full p-6 text-center text-4xl font-mono tracking-widest rounded-2xl outline-none border-4 focus:border-blue-500 transition-colors uppercase ${theme.panelBg} ${theme.textMain} ${theme.panelBorder} placeholder:opacity-20`}
                    />
                </div>

                {error && (
                    <div className="text-red-400 bg-red-900/20 p-3 rounded-lg text-sm border border-red-900/50 animate-pop-in">
                        {error}
                    </div>
                )}

                <button 
                    onClick={() => onJoinGame(joinCode)}
                    disabled={joinCode.length < 6 || isConnecting}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
                        joinCode.length < 6 || isConnecting
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
                    }`}
                >
                    {isConnecting ? (
                        <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> Подключение...</span>
                    ) : 'Подключиться'}
                </button>

              <button 
                 onClick={() => {
                     setMode('menu');
                     onBack();
                 }}
                 className={`mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium opacity-60 hover:opacity-100 hover:bg-white/5 transition-all ${theme.textSecondary}`}
              >
                  <ArrowLeft size={16} /> Назад
              </button>
          </div>
      );
  }

  return null;
};

export default Lobby;
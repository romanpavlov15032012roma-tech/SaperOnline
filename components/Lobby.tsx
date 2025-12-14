import React, { useState } from 'react';
import { Users, UserPlus, Play, Copy, ArrowLeft } from 'lucide-react';
import { generateShortId } from '../utils/network';
import { Theme } from '../types';

interface LobbyProps {
  theme: Theme;
  onSinglePlayer: () => void;
  onHostGame: (code: string) => void;
  onJoinGame: (code: string) => void;
  isConnecting: boolean;
  error: string | null;
  onBack: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ theme, onSinglePlayer, onHostGame, onJoinGame, isConnecting, error, onBack }) => {
  const [mode, setMode] = useState<'menu' | 'host' | 'join'>('menu');
  const [joinCode, setJoinCode] = useState('');
  const [generatedCode] = useState(generateShortId());

  if (mode === 'menu') {
      return (
        <div className="flex flex-col gap-4 w-full max-w-md mx-auto p-6 animate-fade-in">
             <h2 className={`text-2xl font-bold text-center mb-6 ${theme.textMain}`}>Меню Игры</h2>
             
             <button 
                onClick={onSinglePlayer}
                className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-transform active:scale-95"
             >
                 <Play size={24} />
                 Одиночная игра
             </button>

             <div className={`h-px w-full my-2 bg-white/10`}></div>

             <div className="grid grid-cols-2 gap-4">
                 <button 
                    onClick={() => {
                        setMode('host');
                        onHostGame(generatedCode);
                    }}
                    className={`flex flex-col items-center gap-2 p-6 rounded-xl border-2 transition-all hover:bg-opacity-10 ${theme.panelBg} ${theme.panelBorder} ${theme.textMain} hover:border-blue-400`}
                 >
                     <UserPlus size={32} className="text-green-400" />
                     <span className="font-bold">Создать Лобби</span>
                 </button>

                 <button 
                    onClick={() => setMode('join')}
                    className={`flex flex-col items-center gap-2 p-6 rounded-xl border-2 transition-all hover:bg-opacity-10 ${theme.panelBg} ${theme.panelBorder} ${theme.textMain} hover:border-blue-400`}
                 >
                     <Users size={32} className="text-yellow-400" />
                     <span className="font-bold">Войти по коду</span>
                 </button>
             </div>
        </div>
      );
  }

  if (mode === 'host') {
      return (
          <div className="flex flex-col gap-6 w-full max-w-md mx-auto p-6 animate-fade-in text-center">
              <h2 className={`text-xl font-bold ${theme.textSecondary}`}>Ожидание игрока...</h2>
              
              <div className={`p-8 rounded-2xl border-2 border-dashed ${theme.textMain} border-white/20 bg-black/20`}>
                  <p className="text-sm mb-2 opacity-70">Код лобби</p>
                  <div className="flex items-center justify-center gap-3">
                      <span className="text-5xl font-mono font-black tracking-widest text-blue-400 select-all">
                          {generatedCode}
                      </span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(generatedCode)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        title="Копировать"
                      >
                          <Copy size={20} />
                      </button>
                  </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm opacity-60 animate-pulse">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Ожидание подключения...
              </div>

              <button 
                 onClick={onBack}
                 className={`mt-4 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium opacity-70 hover:opacity-100 ${theme.textSecondary}`}
              >
                  <ArrowLeft size={16} /> Отмена
              </button>
          </div>
      );
  }

  if (mode === 'join') {
      return (
          <div className="flex flex-col gap-6 w-full max-w-md mx-auto p-6 animate-fade-in text-center">
              <h2 className={`text-xl font-bold ${theme.textMain}`}>Вход в лобби</h2>
              
              <div className="flex flex-col gap-2 text-left">
                <label className={`text-sm font-semibold ${theme.textSecondary}`}>Введите код лобби</label>
                <input 
                    type="text" 
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="XXXXXX"
                    maxLength={6}
                    className={`w-full p-4 text-center text-3xl font-mono tracking-widest rounded-xl outline-none border-2 focus:border-blue-500 transition-colors uppercase ${theme.panelBg} ${theme.textMain} ${theme.panelBorder}`}
                />
              </div>

              {error && (
                  <div className="text-red-400 bg-red-900/20 p-3 rounded-lg text-sm border border-red-900/50">
                      {error}
                  </div>
              )}

              <button 
                  onClick={() => onJoinGame(joinCode)}
                  disabled={joinCode.length < 6 || isConnecting}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
                      joinCode.length < 6 || isConnecting
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-500 text-white active:scale-95'
                  }`}
              >
                  {isConnecting ? 'Подключение...' : 'Подключиться'}
              </button>

              <button 
                 onClick={() => {
                     setMode('menu');
                     onBack();
                 }}
                 className={`mt-2 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium opacity-70 hover:opacity-100 ${theme.textSecondary}`}
              >
                  <ArrowLeft size={16} /> Назад
              </button>
          </div>
      );
  }

  return null;
};

export default Lobby;
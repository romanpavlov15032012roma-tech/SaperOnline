import React, { useState } from 'react';
import { Bomb, Clock, Trophy, Play, Settings, Palette, ZoomIn, Volume2, VolumeX } from 'lucide-react';
import { Difficulty, DIFFICULTIES, Theme, THEMES } from '../types';
import { toggleMute, getMutedState } from '../utils/sound';

interface ControlsProps {
  minesLeft: number;
  timeElapsed: number;
  onReset: () => void;
  currentDifficulty: Difficulty;
  onChangeDifficulty: (diff: Difficulty) => void;
  onUpdateCustomSettings: (key: keyof Difficulty, value: number) => void;
  currentTheme: Theme;
  onChangeTheme: (theme: Theme) => void;
  zoomLevel: number;
  onChangeZoom: (zoom: number) => void;
  onOpenLeaderboard: () => void;
}

const Controls: React.FC<ControlsProps> = ({ 
  minesLeft, 
  timeElapsed, 
  onReset, 
  currentDifficulty,
  onChangeDifficulty,
  onUpdateCustomSettings,
  currentTheme,
  onChangeTheme,
  zoomLevel,
  onChangeZoom,
  onOpenLeaderboard
}) => {
  const [isMuted, setIsMuted] = useState(getMutedState());

  const handleToggleSound = () => {
    const newState = toggleMute();
    setIsMuted(newState);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCustom = currentDifficulty.name === 'Настраиваемый';

  const inputStyle = `w-full p-2 rounded-lg text-sm font-bold border outline-none transition-colors ${
    currentTheme.id === 'retro' 
      ? 'bg-white border-gray-400 text-black focus:border-blue-500' 
      : 'bg-black/20 border-white/10 text-white focus:bg-black/30 focus:border-white/30'
  }`;

  const labelStyle = `text-xs font-semibold mb-1 block ${currentTheme.textSecondary}`;

  return (
    <div className="flex flex-col gap-5 w-full">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`flex flex-col items-center justify-center p-4 rounded-xl border shadow-inner ${currentTheme.id === 'retro' ? 'bg-black text-red-500 border-gray-500' : 'bg-black/20 border-white/10'}`}>
          <div className={`flex items-center gap-2 mb-1 text-sm font-medium uppercase tracking-wider ${currentTheme.textSecondary}`}>
            <Bomb size={16} />
            <span>Мины</span>
          </div>
          <span className={`text-3xl font-mono font-bold ${currentTheme.id === 'retro' ? 'text-red-500' : 'text-red-400'}`}>
            {Math.max(0, minesLeft).toString().padStart(3, '0')}
          </span>
        </div>
        
        <div className={`flex flex-col items-center justify-center p-4 rounded-xl border shadow-inner ${currentTheme.id === 'retro' ? 'bg-black text-red-500 border-gray-500' : 'bg-black/20 border-white/10'}`}>
          <div className={`flex items-center gap-2 mb-1 text-sm font-medium uppercase tracking-wider ${currentTheme.textSecondary}`}>
            <Clock size={16} />
            <span>Время</span>
          </div>
          <span className={`text-3xl font-mono font-bold ${currentTheme.id === 'retro' ? 'text-red-500' : 'text-blue-400'}`}>
            {formatTime(timeElapsed)}
          </span>
        </div>
      </div>

      <div className={`h-px w-full ${currentTheme.id === 'retro' ? 'bg-gray-500' : 'bg-white/10'}`}></div>

      {/* Settings Grid */}
      <div className="space-y-4">
        
        {/* Difficulty Selector */}
        <div className="flex flex-col gap-2">
            <label className={`text-sm font-semibold uppercase tracking-wider ml-1 flex items-center gap-2 ${currentTheme.textSecondary}`}>
                <Settings size={14} /> Сложность
            </label>
            <div className="relative group w-full">
                <select 
                    className={`w-full appearance-none py-3 pl-4 pr-10 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium text-lg border shadow-sm ${currentTheme.id === 'retro' ? 'bg-white text-black border-gray-600' : 'bg-black/20 hover:bg-black/30 text-white border-white/10'}`}
                    value={currentDifficulty.name}
                    onChange={(e) => {
                        const diff = DIFFICULTIES.find(d => d.name === e.target.value);
                        if (diff) onChangeDifficulty(diff);
                    }}
                >
                    {DIFFICULTIES.map(d => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* Custom Difficulty Inputs */}
        {isCustom && (
            <div className={`p-3 rounded-xl border ${currentTheme.id === 'retro' ? 'bg-gray-200 border-gray-400' : 'bg-white/5 border-white/10'} animate-fade-in`}>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className={labelStyle}>Ширина</label>
                        <input 
                            type="number" 
                            min="5" max="50"
                            value={currentDifficulty.cols}
                            onChange={(e) => onUpdateCustomSettings('cols', parseInt(e.target.value) || 5)}
                            className={inputStyle}
                        />
                    </div>
                    <div>
                        <label className={labelStyle}>Высота</label>
                        <input 
                            type="number" 
                            min="5" max="50"
                            value={currentDifficulty.rows}
                            onChange={(e) => onUpdateCustomSettings('rows', parseInt(e.target.value) || 5)}
                            className={inputStyle}
                        />
                    </div>
                    <div>
                        <label className={labelStyle}>Мины</label>
                        <input 
                            type="number" 
                            min="1"
                            max={(currentDifficulty.rows * currentDifficulty.cols) - 1}
                            value={currentDifficulty.mines}
                            onChange={(e) => onUpdateCustomSettings('mines', parseInt(e.target.value) || 1)}
                            className={inputStyle}
                        />
                    </div>
                </div>
            </div>
        )}

        {/* Theme Selector */}
        <div className="flex flex-col gap-2">
            <label className={`text-sm font-semibold uppercase tracking-wider ml-1 flex items-center gap-2 ${currentTheme.textSecondary}`}>
                <Palette size={14} /> Тема
            </label>
            <div className="flex gap-2">
                {THEMES.map(theme => (
                    <button
                        key={theme.id}
                        onClick={() => onChangeTheme(theme)}
                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all border-2 ${
                            currentTheme.id === theme.id 
                            ? 'border-blue-500 scale-105 shadow-lg' 
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: theme.id === 'modern' ? '#1e293b' : theme.id === 'retro' ? '#c0c0c0' : '#164e63', color: theme.id === 'retro' ? 'black' : 'white' }}
                    >
                        {theme.name.split(' ')[0]}
                    </button>
                ))}
            </div>
        </div>

        {/* Zoom & Sound Control Row */}
        <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-2">
                <label className={`text-sm font-semibold uppercase tracking-wider ml-1 flex items-center gap-2 ${currentTheme.textSecondary}`}>
                    <ZoomIn size={14} /> Размер
                </label>
                <div className="flex items-center gap-3 bg-black/10 p-2 rounded-lg border border-white/5 h-[42px]">
                    <span className={`text-xs ${currentTheme.textSecondary}`}>-</span>
                    <input 
                        type="range" 
                        min="20" 
                        max="60" 
                        value={zoomLevel} 
                        onChange={(e) => onChangeZoom(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-400 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <span className={`text-xs ${currentTheme.textSecondary}`}>+</span>
                </div>
            </div>
            
             <div className="flex flex-col gap-2 w-1/4">
                <label className={`text-sm font-semibold uppercase tracking-wider ml-1 flex items-center gap-2 ${currentTheme.textSecondary}`}>
                    Звук
                </label>
                <button 
                    onClick={handleToggleSound}
                    className={`h-[42px] flex items-center justify-center rounded-lg border transition-all ${
                        currentTheme.id === 'retro' 
                        ? 'bg-white border-gray-400 text-black hover:bg-gray-100' 
                        : 'bg-black/20 border-white/10 text-white hover:bg-black/30'
                    }`}
                >
                    {isMuted ? <VolumeX size={20} className="text-red-400" /> : <Volume2 size={20} />}
                </button>
            </div>
        </div>

      </div>

      <div className={`h-px w-full ${currentTheme.id === 'retro' ? 'bg-gray-500' : 'bg-white/10'}`}></div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <button 
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-900/30 text-lg group"
        >
            <Play size={24} fill="currentColor" className="group-hover:scale-110 transition-transform" />
            <span>Начать игру</span>
        </button>

        <button 
            onClick={onOpenLeaderboard}
            className={`w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl transition-all active:scale-95 shadow border ${currentTheme.id === 'retro' ? 'bg-white text-black border-gray-400 hover:bg-gray-100' : 'bg-slate-700 hover:bg-slate-600 text-yellow-400 border-slate-600'}`}
        >
            <Trophy size={18} />
            <span>Таблица рекордов</span>
        </button>
      </div>
    </div>
  );
};

export default Controls;
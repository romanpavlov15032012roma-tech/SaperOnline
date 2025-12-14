import React from 'react';
import { X, Trophy } from 'lucide-react';
import { HighScores, DIFFICULTIES } from '../types';

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  scores: HighScores;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ isOpen, onClose, scores }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-600 shadow-2xl overflow-hidden transform transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900/50">
          <div className="flex items-center gap-3 text-yellow-500">
            <Trophy size={28} />
            <h2 className="text-2xl font-bold text-white tracking-tight">Рекорды</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-3">
          {DIFFICULTIES.map((diff) => (
            <div 
              key={diff.name} 
              className="flex items-center justify-between p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl border border-slate-700/50 transition-colors"
            >
              <div className="flex flex-col">
                <span className="font-semibold text-lg text-slate-200">{diff.name}</span>
                <span className="text-xs text-slate-500">{diff.rows}x{diff.cols}, {diff.mines} мин</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-2xl font-bold ${scores[diff.name] ? 'text-blue-400' : 'text-slate-600'}`}>
                    {scores[diff.name] !== undefined ? scores[diff.name] : '--'}
                </span>
                <span className="text-sm text-slate-500 pt-1">сек</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-slate-900/30 text-center">
            <p className="text-slate-500 text-xs">Пройдите уровень быстрее всех, чтобы попасть сюда!</p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
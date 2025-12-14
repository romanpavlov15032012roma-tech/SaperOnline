import React, { useRef } from 'react';
import { CellData, Theme } from '../types';
import { Flag, Bomb } from 'lucide-react';

interface CellProps {
  data: CellData;
  theme: Theme;
  onClick: (row: number, col: number) => void;
  onRightClick: (row: number, col: number) => void;
  disabled: boolean;
}

const NUMBER_COLORS = [
  '',
  'text-blue-600',   // 1
  'text-emerald-600',// 2
  'text-red-600',    // 3
  'text-indigo-800', // 4
  'text-red-800',    // 5
  'text-teal-600',   // 6
  'text-black',      // 7
  'text-gray-600',   // 8
];

const Cell: React.FC<CellProps> = React.memo(({ data, theme, onClick, onRightClick, disabled }) => {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTouch = useRef<boolean>(false);

  const handlePointerDown = () => {
    if (disabled || data.status === 'revealed') return;
    isTouch.current = false;
    
    // Start long press timer
    longPressTimer.current = setTimeout(() => {
        isTouch.current = true;
        // Trigger right click logic for flagging
        onRightClick(data.row, data.col);
        // Provide haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(50);
    }, 500); // 500ms for long press
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handlePointerLeave = () => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isTouch.current) return;
    if (disabled) return;
    onClick(data.row, data.col);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    onRightClick(data.row, data.col);
  };

  // Base styles including theme borders
  const baseClasses = `w-full h-full flex items-center justify-center font-bold text-lg select-none transition-all duration-75 overflow-hidden ${theme.cell.border}`;
  
  // Dynamic styling based on state
  let statusClasses = "";
  let content = null;

  if (data.status === 'hidden') {
    statusClasses = `${theme.cell.hidden} ${theme.cell.hover} cursor-pointer z-10`;
  } else if (data.status === 'flagged') {
    statusClasses = `${theme.cell.hidden} cursor-pointer z-10`;
    content = <Flag className={`w-3/5 h-3/5 animate-pop-in ${theme.icons.flag}`} />;
  } else if (data.status === 'revealed') {
    if (data.isMine) {
      statusClasses = data.exploded 
        ? `${theme.icons.explosion} ${theme.cell.border} animate-pop-in` 
        : `${theme.cell.revealed} animate-pop-in`; 
      content = <Bomb className={`w-3/4 h-3/4 ${data.exploded ? 'text-white fill-white' : theme.icons.mine}`} />;
    } else {
      statusClasses = `${theme.cell.revealed} cursor-default animate-pop-in`;
      if (data.neighborMines > 0) {
        content = (
          <span className={`${NUMBER_COLORS[data.neighborMines] || 'text-gray-800'}`}>
            {data.neighborMines}
          </span>
        );
      }
    }
  }

  return (
    <div
      className={`${baseClasses} ${statusClasses}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      {content}
    </div>
  );
});

export default Cell;
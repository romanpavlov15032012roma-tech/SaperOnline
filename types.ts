export type CellStatus = 'hidden' | 'revealed' | 'flagged';

export interface CellData {
  row: number;
  col: number;
  isMine: boolean;
  status: CellStatus;
  neighborMines: number;
  exploded?: boolean; // True if this specific mine caused the loss
}

export type BoardData = CellData[][];

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

export interface Difficulty {
  name: string;
  rows: number;
  cols: number;
  mines: number;
}

export const DIFFICULTIES: Difficulty[] = [
  { name: 'Новичок', rows: 10, cols: 10, mines: 15 },
  { name: 'Любитель', rows: 16, cols: 16, mines: 40 },
  { name: 'Профи', rows: 16, cols: 30, mines: 99 },
  { name: 'Настраиваемый', rows: 20, cols: 20, mines: 50 },
];

export type HighScores = Record<string, number>;

export interface Theme {
  id: string;
  name: string;
  appBg: string;
  panelBg: string;
  panelBorder: string;
  textMain: string;
  textSecondary: string;
  boardBg: string;
  cell: {
    hidden: string;
    revealed: string;
    hover: string;
    border: string; // For border structure (rounded, thickness)
  };
  icons: {
    flag: string;
    mine: string;
    explosion: string;
  };
}

export const THEMES: Theme[] = [
  {
    id: 'modern',
    name: 'Модерн (Тёмный)',
    appBg: 'bg-slate-900',
    panelBg: 'bg-slate-800',
    panelBorder: 'border-slate-700',
    textMain: 'text-slate-100',
    textSecondary: 'text-slate-400',
    boardBg: 'bg-slate-950',
    cell: {
      hidden: 'bg-slate-300 border-slate-400 shadow-inner',
      revealed: 'bg-slate-100 border-slate-200',
      hover: 'hover:brightness-110',
      border: 'border-b-[3px] border-r-[3px] rounded-[2px]',
    },
    icons: {
      flag: 'text-red-600 fill-red-600',
      mine: 'text-slate-800',
      explosion: 'bg-red-500',
    }
  },
  {
    id: 'retro',
    name: 'Ретро 95',
    appBg: 'bg-[#008080]',
    panelBg: 'bg-[#c0c0c0]',
    panelBorder: 'border-white border-t-white border-l-white border-b-gray-800 border-r-gray-800 border-2 shadow-xl',
    textMain: 'text-black font-mono',
    textSecondary: 'text-gray-700 font-mono',
    boardBg: 'bg-white',
    cell: {
      hidden: 'bg-[#c0c0c0] border-t-white border-l-white border-b-gray-800 border-r-gray-800',
      revealed: 'bg-[#c0c0c0] border-gray-400 border-[1px]',
      hover: '',
      border: 'border-[3px]',
    },
    icons: {
      flag: 'text-red-600 fill-red-600',
      mine: 'text-black fill-black',
      explosion: 'bg-red-600',
    }
  },
  {
    id: 'ocean',
    name: 'Океан',
    appBg: 'bg-cyan-950',
    panelBg: 'bg-cyan-900/90',
    panelBorder: 'border-cyan-700',
    textMain: 'text-cyan-50',
    textSecondary: 'text-cyan-300',
    boardBg: 'bg-cyan-950',
    cell: {
      hidden: 'bg-cyan-600 border-cyan-500 shadow-md',
      revealed: 'bg-cyan-100 border-cyan-200',
      hover: 'hover:bg-cyan-500',
      border: 'border-b-[3px] border-r-[3px] rounded-lg',
    },
    icons: {
      flag: 'text-yellow-400 fill-yellow-400',
      mine: 'text-cyan-900',
      explosion: 'bg-orange-500',
    }
  }
];
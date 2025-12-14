import { BoardData, CellData, Difficulty, HighScores } from '../types';

// Directions for neighbor checking (Top, TR, Right, BR, Bottom, BL, Left, TL)
const DIRECTIONS = [
  [-1, 0], [-1, 1], [0, 1], [1, 1],
  [1, 0], [1, -1], [0, -1], [-1, -1]
];

export const createEmptyBoard = (rows: number, cols: number): BoardData => {
  const board: BoardData = [];
  for (let r = 0; r < rows; r++) {
    const row: CellData[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        isMine: false,
        status: 'hidden',
        neighborMines: 0,
      });
    }
    board.push(row);
  }
  return board;
};

export const initializeBoardWithMines = (
  initialBoard: BoardData,
  difficulty: Difficulty,
  firstClickRow: number,
  firstClickCol: number
): BoardData => {
  // Deep copy to avoid mutation issues during setup
  const board = JSON.parse(JSON.stringify(initialBoard)) as BoardData;
  const { rows, cols, mines } = difficulty;

  let minesPlaced = 0;
  
  while (minesPlaced < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);

    // Don't place mine on existing mine
    if (board[r][c].isMine) continue;

    // Don't place mine on the first clicked cell OR its immediate neighbors (Safe start)
    const isFirstClick = r === firstClickRow && c === firstClickCol;
    
    // Check neighbors of first click to ensure they are also safe (safe start area)
    let isNeighborOfFirstClick = false;
    for(const [dr, dc] of DIRECTIONS) {
        if(r === firstClickRow + dr && c === firstClickCol + dc) {
            isNeighborOfFirstClick = true;
            break;
        }
    }

    if (isFirstClick || isNeighborOfFirstClick) continue;

    board[r][c].isMine = true;
    minesPlaced++;
  }

  // Calculate neighbor numbers
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c].isMine) {
        let count = 0;
        DIRECTIONS.forEach(([dr, dc]) => {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
            count++;
          }
        });
        board[r][c].neighborMines = count;
      }
    }
  }

  return board;
};

// Returns new board and list of revealed cells
export const revealCell = (
  currentBoard: BoardData,
  row: number,
  col: number
): { board: BoardData; exploded: boolean } => {
  const board = JSON.parse(JSON.stringify(currentBoard)) as BoardData;
  const cell = board[row][col];

  // Guard clauses
  if (cell.status !== 'hidden') {
    return { board, exploded: false };
  }

  // Hit a mine
  if (cell.isMine) {
    cell.status = 'revealed';
    cell.exploded = true;
    return { board, exploded: true };
  }

  // Flood fill (BFS)
  const queue: [number, number][] = [[row, col]];
  
  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const current = board[r][c];

    if (current.status !== 'hidden') continue;

    current.status = 'revealed';

    // If it's a "0" cell, add neighbors to queue
    if (current.neighborMines === 0) {
      DIRECTIONS.forEach(([dr, dc]) => {
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr >= 0 && nr < board.length && 
          nc >= 0 && nc < board[0].length &&
          board[nr][nc].status === 'hidden'
        ) {
            // Check if already in queue to avoid duplicates (optional optimization)
            queue.push([nr, nc]);
        }
      });
    }
  }

  return { board, exploded: false };
};

export const toggleFlag = (currentBoard: BoardData, row: number, col: number): BoardData => {
  const board = JSON.parse(JSON.stringify(currentBoard)) as BoardData;
  const cell = board[row][col];

  if (cell.status === 'hidden') {
    cell.status = 'flagged';
  } else if (cell.status === 'flagged') {
    cell.status = 'hidden';
  }
  
  return board;
};

export const checkWin = (board: BoardData, difficulty: Difficulty): boolean => {
  let revealedCount = 0;
  const totalCells = difficulty.rows * difficulty.cols;
  const safeCells = totalCells - difficulty.mines;

  for (let r = 0; r < difficulty.rows; r++) {
    for (let c = 0; c < difficulty.cols; c++) {
      if (board[r][c].status === 'revealed' && !board[r][c].isMine) {
        revealedCount++;
      }
    }
  }

  return revealedCount === safeCells;
};

export const revealAllMines = (currentBoard: BoardData, won: boolean): BoardData => {
  const board = JSON.parse(JSON.stringify(currentBoard)) as BoardData;
  board.forEach(row => {
    row.forEach(cell => {
      if (cell.isMine) {
        if (won) {
             cell.status = 'flagged'; // Auto flag on win
        } else if (cell.status !== 'flagged') {
            cell.status = 'revealed'; // Show mines on loss
        }
      }
    });
  });
  return board;
};

export const getSmartHint = (board: BoardData): { row: number; col: number; action: 'reveal' | 'flag' } | null => {
  const rows = board.length;
  const cols = board[0].length;

  // 1. Try to find a logical move
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (cell.status !== 'revealed') continue;
      if (cell.neighborMines === 0) continue;

      let hiddenNeighbors: {r:number, c:number}[] = [];
      let flaggedNeighbors = 0;

      DIRECTIONS.forEach(([dr, dc]) => {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          const nCell = board[nr][nc];
          if (nCell.status === 'hidden') hiddenNeighbors.push({r: nr, c: nc});
          if (nCell.status === 'flagged') flaggedNeighbors++;
        }
      });

      if (hiddenNeighbors.length === 0) continue;

      // Logic A: All hidden neighbors must be mines
      if (cell.neighborMines === flaggedNeighbors + hiddenNeighbors.length) {
        return { row: hiddenNeighbors[0].r, col: hiddenNeighbors[0].c, action: 'flag' };
      }

      // Logic B: All mines are flagged, remaining are safe
      if (cell.neighborMines === flaggedNeighbors) {
        return { row: hiddenNeighbors[0].r, col: hiddenNeighbors[0].c, action: 'reveal' };
      }
    }
  }

  // 2. Fallback: Pick a random safe cell or mine if logic fails
  const hiddenCells: {r:number, c:number, isMine: boolean}[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].status === 'hidden') {
        hiddenCells.push({r, c, isMine: board[r][c].isMine});
      }
    }
  }

  if (hiddenCells.length === 0) return null;

  // Prefer revealing a safe cell
  const safeCells = hiddenCells.filter(c => !c.isMine);
  if (safeCells.length > 0) {
    const target = safeCells[Math.floor(Math.random() * safeCells.length)];
    return { row: target.r, col: target.c, action: 'reveal' };
  }

  // Otherwise flag a mine (should be rare/endgame)
  const mineCells = hiddenCells.filter(c => c.isMine);
  if (mineCells.length > 0) {
    const target = mineCells[Math.floor(Math.random() * mineCells.length)];
    return { row: target.r, col: target.c, action: 'flag' };
  }

  return null;
};

const STORAGE_KEY = 'minesweeper_highscores';

export const getHighScores = (): HighScores => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error('Failed to parse high scores', e);
    return {};
  }
};

export const saveHighScore = (difficultyName: string, time: number): HighScores => {
  const scores = getHighScores();
  // If no score exists or new time is lower (better), update it
  if (!scores[difficultyName] || time < scores[difficultyName]) {
    scores[difficultyName] = time;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  }
  return scores;
};
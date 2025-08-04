// 游戏配置和类型定义
export interface Point {
  x: number;
  y: number;
  value: number;
}

export interface GameState {
  board: number[][];
  score: number;
  timeElapsed: number;
  difficulty: string;
}

export interface GameRecord {
  score: number;
  time: number;
  date: string;
  difficulty: string;
}

export enum PropType {
  HINT = 'hint',
  SHUFFLE = 'shuffle',
  UNDO = 'undo'
}

export const DIFFICULTY_CONFIGS = {
  easy: {
    width: 2,
    height: 2,
    timeLimit: 300, // 5分钟
    types: 6
  },
  normal: {
    width: 10,
    height: 10,
    timeLimit: 240, // 4分钟
    types: 8
  },
  hard: {
    width: 12,
    height: 12,
    timeLimit: 180, // 3分钟
    types: 10
  }
} as const;

// 游戏核心逻辑
export function generateBoard(width: number, height: number): number[][] {
  const board: number[][] = Array(height).fill(0).map(() => Array(width).fill(0));
  const totalPairs = Math.floor((width * height) / 2);
  const config = Object.values(DIFFICULTY_CONFIGS).find(c => c.width === width) || DIFFICULTY_CONFIGS.normal;
  
  // 生成配对的数字
  const numbers: number[] = [];
  for (let i = 0; i < totalPairs; i++) {
    const value = (i % config.types) + 1;
    numbers.push(value, value);
  }
  
  // 随机放置数字
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  
  // 填充棋盘
  let index = 0;
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      board[i][j] = numbers[index++];
    }
  }
  
  return board;
}

export function canConnect(p1: Point, p2: Point, board: number[][]): boolean {
  if (p1.value !== p2.value) return false;
  
  // 检查直线连接
  if (checkStraightLine(p1, p2, board)) return true;
  
  // 检查一次转弯
  if (checkOneCorner(p1, p2, board)) return true;
  
  // 检查两次转弯
  return checkTwoCorners(p1, p2, board);
}

// 找出一个可能的匹配
export interface GameStatusResult {
  isComplete: boolean;     // 游戏是否结束
  isVictory: boolean;      // 是否胜利
  reason: string;          // 游戏结束原因
  canContinue: boolean;    // 是否可以继续（通过使用道具）
}

export function findPossibleMatch(board: number[][]): [Point, Point] | null {
  const height = board.length;
  const width = board[0].length;
  
  // 遍历所有非空格子
  for (let x1 = 0; x1 < height; x1++) {
    for (let y1 = 0; y1 < width; y1++) {
      if (board[x1][y1] === 0) continue;
      
      const p1: Point = { x: x1, y: y1, value: board[x1][y1] };
      
      // 寻找匹配的第二个点
      for (let x2 = 0; x2 < height; x2++) {
        for (let y2 = 0; y2 < width; y2++) {
          if (x1 === x2 && y1 === y2) continue;
          if (board[x2][y2] !== board[x1][y1]) continue;
          
          const p2: Point = { x: x2, y: y2, value: board[x2][y2] };
          
          if (canConnect(p1, p2, board)) {
            return [p1, p2];
          }
        }
      }
    }
  }
  
  return null;
}

export function shuffleBoard(board: number[][]): number[][] {
  const height = board.length;
  const width = board[0].length;
  
  // 收集所有非空值
  const numbers: number[] = [];
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      if (board[i][j] !== 0) {
        numbers.push(board[i][j]);
      }
    }
  }
  
  // 打乱数组
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  
  // 重新填充棋盘
  const newBoard = Array(height).fill(0).map(() => Array(width).fill(0));
  let index = 0;
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      if (board[i][j] !== 0) {
        newBoard[i][j] = numbers[index++];
      }
    }
  }
  
  return newBoard;
}

export function checkGameComplete(
  board: number[][],
  timeLeft: number,
  props: Record<PropType, number>
): GameStatusResult {
  // 检查时间是否耗尽
  if (timeLeft <= 0) {
    return {
      isComplete: true,
      isVictory: false,
      reason: '时间耗尽',
      canContinue: false
    };
  }

  // 检查是否所有方块都已消除（胜利）
  const hasRemainingTiles = board.some(row => row.some(cell => cell !== 0));
  if (!hasRemainingTiles) {
    return {
      isComplete: true,
      isVictory: true,
      reason: '恭喜通关！',
      canContinue: false
    };
  }

  // 检查是否还有可能的移动
  const hasPossibleMatch = findPossibleMatch(board) !== null;
  if (hasPossibleMatch) {
    return {
      isComplete: false,
      isVictory: false,
      reason: '',
      canContinue: true
    };
  }

  // 检查是否还有可用的道具
  const hasUsableProps = props[PropType.SHUFFLE] > 0 || props[PropType.HINT] > 0;
  
  if (!hasUsableProps) {
    return {
      isComplete: true,
      isVictory: false,
      reason: '无可用移动且没有可用道具',
      canContinue: false
    };
  }

  // 还有道具可用，游戏可以继续
  return {
    isComplete: false,
    isVictory: false,
    reason: '需要使用道具继续游戏',
    canContinue: true
  };
}

function checkStraightLine(p1: Point, p2: Point, board: number[][]): boolean {
  if (p1.x !== p2.x && p1.y !== p2.y) return false;
  
  const start = p1.x === p2.x ? Math.min(p1.y, p2.y) : Math.min(p1.x, p2.x);
  const end = p1.x === p2.x ? Math.max(p1.y, p2.y) : Math.max(p1.x, p2.x);
  
  for (let i = start + 1; i < end; i++) {
    if (p1.x === p2.x && board[p1.x][i] !== 0) return false;
    if (p1.y === p2.y && board[i][p1.y] !== 0) return false;
  }
  
  return true;
}

function checkOneCorner(p1: Point, p2: Point, board: number[][]): boolean {
  // 检查两个可能的转角点
  const corners = [
    { x: p1.x, y: p2.y },
    { x: p2.x, y: p1.y }
  ];
  
  for (const corner of corners) {
    if (board[corner.x][corner.y] !== 0) continue;
    
    if (checkStraightLine(p1, { ...corner, value: p1.value }, board) &&
        checkStraightLine({ ...corner, value: p1.value }, p2, board)) {
      return true;
    }
  }
  
  return false;
}

function checkTwoCorners(p1: Point, p2: Point, board: number[][]): boolean {
  const height = board.length;
  const width = board[0].length;
  
  // 检查所有可能的两次转角路径
  for (let i = 0; i < width; i++) {
    // 检查经过 (p1.x, i) 和 (p2.x, i) 的路径
    const corner1 = { x: p1.x, y: i, value: p1.value };
    const corner2 = { x: p2.x, y: i, value: p1.value };
    
    if (board[corner1.x][corner1.y] === 0 &&
        board[corner2.x][corner2.y] === 0 &&
        checkStraightLine(p1, corner1, board) &&
        checkStraightLine(corner1, corner2, board) &&
        checkStraightLine(corner2, p2, board)) {
      return true;
    }
  }
  
  for (let i = 0; i < height; i++) {
    // 检查经过 (i, p1.y) 和 (i, p2.y) 的路径
    const corner1 = { x: i, y: p1.y, value: p1.value };
    const corner2 = { x: i, y: p2.y, value: p1.value };
    
    if (board[corner1.x][corner1.y] === 0 &&
        board[corner2.x][corner2.y] === 0 &&
        checkStraightLine(p1, corner1, board) &&
        checkStraightLine(corner1, corner2, board) &&
        checkStraightLine(corner2, p2, board)) {
      return true;
    }
  }
  
  return false;
}

// 游戏记录管理
const STORAGE_KEY = 'lianliankan_records';

export function saveGameRecord(record: GameRecord): void {
  const records = getGameRecords();
  records.push(record);
  records.sort((a, b) => b.score - a.score);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 10)));
}

export function getGameRecords(): GameRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
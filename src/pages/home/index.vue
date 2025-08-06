<template>
  <div class="game-container">
    <div class="game-header">
      <div class="stats">
        <div class="score">得分: {{ score }}</div>
        <div class="timer" :class="{ warning: timeLeft < 30 }">
          剩余时间: {{ formatTime(timeLeft) }}
        </div>
      </div>
      <div class="difficulty-selector">
        <CButton
          v-for="diff in Object.keys(DIFFICULTY_CONFIGS)"
          :key="diff"
          :is-active="difficulty === diff"
          @click="changeDifficulty(diff)"
        >
          {{ getDifficultyName(diff) }}
        </CButton>
      </div>
    </div>

    <div class="game-board" :style="boardStyle">
      <div v-for="(row, x) in board" :key="x" class="board-row">
        <div
          v-for="(cell, y) in row"
          :key="`${x}-${y}`"
          class="cell"
          :class="{
            selected: isSelected(x, y),
            empty: cell === 0,
            highlighted: isHighlighted(x, y)
          }"
          @click="handleCellClick(x, y)"
        >
          <template v-if="cell !== 0">
            <div class="cell-content">
              {{ getEmoji(cell) }}
            </div>
          </template>
        </div>
      </div>

      <!-- 连线效果 -->
      <div
        v-for="(segment, index) in connectionSegments"
        :key="index"
        class="connection-line"
        :style="getSegmentStyle(segment)"
      ></div>
    </div>

    <div class="game-controls">
      <div class="props">
        <CButton
          @click="useProp(PropType.HINT)"
          :disabled="!canUseProp(PropType.HINT)"
        >
          提示 ({{ props[PropType.HINT] }})
        </CButton>
        <CButton
          @click="useProp(PropType.SHUFFLE)"
          :disabled="!canUseProp(PropType.SHUFFLE)"
        >
          打乱 ({{ props[PropType.SHUFFLE] }})
        </CButton>
        <CButton
          @click="useProp(PropType.UNDO)"
          :disabled="!canUseProp(PropType.UNDO)"
        >
          撤销 ({{ props[PropType.UNDO] }})
        </CButton>
      </div>
      <CButton @click="startNewGame" isActive> 新游戏 </CButton>
    </div>

    <!-- 排行榜 -->
    <div class="leaderboard">
      <h3>排行榜</h3>
      <div class="leaderboard-filters">
        <CTabs :tabs="rankTabs" v-model:activeTab="leaderboardDifficulty">
        </CTabs>
      </div>
      <div class="leaderboard-content">
        <div
          v-for="(record, index) in filteredRecords"
          :key="index"
          class="record-item"
        >
          <span class="rank">{{ index + 1 }}</span>
          <span class="record-score">{{ record.score }}</span>
          <span class="record-time">{{ formatTime(record.time) }}</span>
          <span class="record-date">{{ formatDate(record.date) }}</span>
        </div>
      </div>
    </div>

    <!-- 游戏结束弹窗 -->
    <div v-if="showGameOver" class="game-over-modal">
      <div class="modal-content">
        <h2>{{ gameOverMessage }}</h2>
        <div class="game-stats">
          <p>得分：{{ score }}</p>
          <p>用时：{{ formatTime(timeElapsed) }}</p>
        </div>
        <button @click="startNewGame">再来一局</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import {
  generateBoard,
  canConnect,
  findPossibleMatch,
  shuffleBoard,
  saveGameRecord,
  getGameRecords,
  formatTime,
  type Point,
  type GameState,
  DIFFICULTY_CONFIGS,
  PropType,
  checkGameComplete
} from '@/utils';
import CButton from '@/components/c-button.vue';
import CTabs from '@/components/c-tabs.vue';
import { type Option } from '@/utils/index.ts';

// 状态管理
const board = ref<number[][]>([]);
const score = ref(0);
const timeElapsed = ref(0); // 游戏用时
const timer = ref<number | null>(null);
const selectedPoint = ref<Point | null>(null);
const difficulty = ref('normal');
const showGameOver = ref(false);
const gameOverMessage = ref('');
const connectionSegments = ref<{ start: Point; end: Point }[]>([]);
const highlightedCells = ref<Point[]>([]);
const leaderboardDifficulty = ref('normal');
const gameHistory = ref<GameState[]>([]);
const boardPadding = ref(10);
const rankTabs = ref<Option[]>([]);

Object.keys(DIFFICULTY_CONFIGS).forEach((diff) => {
  rankTabs.value.push({
    label: getDifficultyName(diff),
    value: diff
  });
});
// 道具系统
const props = ref({
  [PropType.HINT]: 3,
  [PropType.SHUFFLE]: 3,
  [PropType.UNDO]: 3
});

// 计算属性
const boardStyle = computed(() => {
  const config =
    DIFFICULTY_CONFIGS[difficulty.value as keyof typeof DIFFICULTY_CONFIGS];
  return {
    padding: `${boardPadding.value}px`,
    gridTemplateColumns: `repeat(${config.width}, 1fr)`
  };
});

const timeLeft = computed(() => {
  const config =
    DIFFICULTY_CONFIGS[difficulty.value as keyof typeof DIFFICULTY_CONFIGS];
  return Math.max(0, config.timeLimit - timeElapsed.value);
});

const filteredRecords = computed(() => {
  return getGameRecords().filter(
    (record) => record.difficulty === leaderboardDifficulty.value
  );
});

// 计算连接线段样式
function getSegmentStyle(segment: { start: Point; end: Point }) {
  const cellElement = document.querySelector('.cell') as HTMLElement;
  if (!cellElement) return {};

  const cellRect = cellElement.getBoundingClientRect();
  const cellSize = cellRect.width;
  const gap = 4; // 与 CSS 中的 gap 值保持一致

  // 计算起点和终点的坐标
  const x1 =
    boardPadding.value + segment.start.x * (cellSize + gap) + cellSize / 2;
  const y1 =
    boardPadding.value + segment.start.y * (cellSize + gap) + cellSize / 2;
  const x2 =
    boardPadding.value + segment.end.x * (cellSize + gap) + cellSize / 2;
  const y2 =
    boardPadding.value + segment.end.y * (cellSize + gap) + cellSize / 2;

  // 计算线段长度和角度
  const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

  return {
    width: `${length}px`,
    height: '4px',
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    position: 'absolute',
    left: `${x1}px`,
    top: `${y1}px`,
    transform: `rotate(${angle}deg)`,
    transformOrigin: '0 50%',
    borderRadius: '2px',
    boxShadow: '0 0 4px rgba(76, 175, 80, 0.5)',
    zIndex: '1'
    // opacity: 1,
    // animation: 'fadeInOut 1s ease-in-out forwards'
  };
}

// 检查两点间是否可以直线连接
function checkStraightLine(p1: Point, p2: Point, board: number[][]): boolean {
  // 如果两点在同一行
  if (p1.x === p2.x) {
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);
    // 检查两点之间的所有格子是否为空
    for (let y = minY + 1; y < maxY; y++) {
      if (board[p1.x][y] !== 0) {
        return false;
      }
    }
    return true;
  }

  // 如果两点在同一列
  if (p1.y === p2.y) {
    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    // 检查两点之间的所有格子是否为空
    for (let x = minX + 1; x < maxX; x++) {
      if (board[x][p1.y] !== 0) {
        return false;
      }
    }
    return true;
  }

  return false;
}

// 计算连接路径点
function findConnectionPath(p1: Point, p2: Point, board: number[][]): Point[] {
  // 直线连接
  if (checkStraightLine(p1, p2, board)) {
    return [p1, p2];
  }

  // 一次转角
  const corners = [
    { x: p1.x, y: p2.y, value: p1.value },
    { x: p2.x, y: p1.y, value: p1.value }
  ];

  for (const corner of corners) {
    if (
      board[corner.x][corner.y] === 0 &&
      checkStraightLine(p1, corner, board) &&
      checkStraightLine(corner, p2, board)
    ) {
      return [p1, corner, p2];
    }
  }

  // 两次转角
  const height = board.length;
  const width = board[0].length;

  // 水平方向寻找路径
  for (let i = 0; i < width; i++) {
    const corner1 = { x: p1.x, y: i, value: p1.value };
    const corner2 = { x: p2.x, y: i, value: p1.value };

    if (
      board[corner1.x][corner1.y] === 0 &&
      board[corner2.x][corner2.y] === 0 &&
      checkStraightLine(p1, corner1, board) &&
      checkStraightLine(corner1, corner2, board) &&
      checkStraightLine(corner2, p2, board)
    ) {
      return [p1, corner1, corner2, p2];
    }
  }

  // 垂直方向寻找路径
  for (let i = 0; i < height; i++) {
    const corner1 = { x: i, y: p1.y, value: p1.value };
    const corner2 = { x: i, y: p2.y, value: p1.value };

    if (
      board[corner1.x][corner1.y] === 0 &&
      board[corner2.x][corner2.y] === 0 &&
      checkStraightLine(p1, corner1, board) &&
      checkStraightLine(corner1, corner2, board) &&
      checkStraightLine(corner2, p2, board)
    ) {
      return [p1, corner1, corner2, p2];
    }
  }

  return [p1, p2];
}

// 开始新游戏
function startNewGame() {
  const config =
    DIFFICULTY_CONFIGS[difficulty.value as keyof typeof DIFFICULTY_CONFIGS];
  board.value = generateBoard(config.width, config.height);
  score.value = 0;
  timeElapsed.value = 0;
  selectedPoint.value = null;
  showGameOver.value = false;
  gameHistory.value = [];
  highlightedCells.value = [];

  // 重置道具
  props.value = {
    [PropType.HINT]: 3,
    [PropType.SHUFFLE]: 3,
    [PropType.UNDO]: 3
  };

  // 重置计时器
  if (timer.value) {
    clearInterval(timer.value);
  }
  timer.value = setInterval(() => {
    timeElapsed.value++;
    if (timeElapsed.value >= config.timeLimit) {
      endGame('时间到！');
    }
  }, 1000);
}

function handleCellClick(x: number, y: number) {
  if (board.value[x][y] === 0) return;

  const currentPoint: Point = {
    x,
    y,
    value: board.value[x][y]
  };

  if (!selectedPoint.value) {
    selectedPoint.value = currentPoint;
    return;
  }

  if (x === selectedPoint.value.x && y === selectedPoint.value.y) {
    selectedPoint.value = null;
    return;
  }

  if (canConnect(selectedPoint.value, currentPoint, board.value)) {
    // 保存当前状态用于撤销
    saveGameState();

    // 显示连线动画
    showConnection(selectedPoint.value, currentPoint);

    // 消除匹配的方块
    board.value[selectedPoint.value.x][selectedPoint.value.y] = 0;
    board.value[x][y] = 0;
    score.value += calculateScore();
    selectedPoint.value = null;

    // 检查游戏状态
    checkGameState();
  } else {
    selectedPoint.value = currentPoint;
  }
}

function calculateScore(): number {
  // 基础分数
  let baseScore = 10;

  // 根据难度增加分数
  const difficultyMultiplier = {
    easy: 1,
    normal: 1.5,
    hard: 2
  };

  // 根据剩余时间增加分数
  const timeBonus = Math.floor(timeLeft.value / 10);

  return Math.floor(
    baseScore *
      difficultyMultiplier[
        difficulty.value as keyof typeof difficultyMultiplier
      ] +
      timeBonus
  );
}

function showConnection(point1: Point, point2: Point) {
  // 获取连接路径
  const path = findConnectionPath(point1, point2, board.value);

  // 创建连接线段
  connectionSegments.value = [];
  for (let i = 0; i < path.length - 1; i++) {
    connectionSegments.value.push({
      start: path[i],
      end: path[i + 1]
    });
  }

  // 清除连接线
  setTimeout(() => {
    connectionSegments.value = [];
  }, 500);
}

function checkGameState() {
  const gameStatus = checkGameComplete(
    board.value,
    timeLeft.value,
    props.value
  );

  if (gameStatus.isComplete) {
    endGame(gameStatus.reason);
    if (gameStatus.isVictory) {
      score.value += calculateTimeBonus(); // 给予额外的时间奖励
    }
  }
}

function calculateTimeBonus(): number {
  // 根据剩余时间给予额外奖励分数
  const timeBonus = Math.floor(timeLeft.value * 2);
  return timeBonus;
}

function endGame(message: string) {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }

  gameOverMessage.value = message;
  showGameOver.value = true;

  // 保存记录
  if (score.value > 0) {
    saveGameRecord({
      score: score.value,
      time: timeElapsed.value,
      date: new Date().toISOString(),
      difficulty: difficulty.value
    });
  }
}

function useProp(type: PropType) {
  if (!canUseProp(type)) return;

  props.value[type]--;

  switch (type) {
    case PropType.HINT: {
      const match = findPossibleMatch(board.value);
      if (match) {
        highlightedCells.value = match;
        setTimeout(() => {
          highlightedCells.value = [];
        }, 3000);
      }
      break;
    }
    case PropType.SHUFFLE:
      board.value = shuffleBoard(board.value);
      break;
    case PropType.UNDO:
      if (gameHistory.value.length > 0) {
        const previousState = gameHistory.value.pop()!;
        board.value = previousState.board;
        score.value = previousState.score;
        selectedPoint.value = null;
      }
      break;
  }
}

function canUseProp(type: PropType): boolean {
  return props.value[type] > 0;
}

function saveGameState() {
  gameHistory.value.push({
    board: JSON.parse(JSON.stringify(board.value)),
    score: score.value,
    timeElapsed: timeElapsed.value,
    difficulty: difficulty.value
  });
}

function changeDifficulty(diff: string) {
  if (timer.value) {
    const confirm = window.confirm('更换难度将重新开始游戏，确定要继续吗？');
    if (!confirm) return;
  }
  difficulty.value = diff;
  startNewGame();
}

function getDifficultyName(diff: string): string {
  return (
    {
      easy: '简单',
      normal: '普通',
      hard: '困难'
    }[diff] || diff
  );
}

function isSelected(x: number, y: number): boolean {
  return selectedPoint.value?.x === x && selectedPoint.value?.y === y;
}

function isHighlighted(x: number, y: number): boolean {
  return highlightedCells.value.some((cell) => cell.x === x && cell.y === y);
}

function getEmoji(value: number): string {
  // const emojis = [
  //   '🐶',
  //   '🐱',
  //   '🐭',
  //   '🐹',
  //   '🐰',
  //   '🦊',
  //   '🐻',
  //   '🐼',
  //   '🐨',
  //   '🐯',
  //   '🦁',
  //   '🐮'
  // ];
  const emojis = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12'
  ];
  return emojis[(value - 1) % emojis.length];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

// 生命周期
onMounted(() => {
  startNewGame();
});

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value);
  }
});

// 监听游戏状态
watch(timeLeft, (newValue) => {
  if (newValue === 0) {
    endGame('时间到！');
  }
});
</script>

<style scoped lang="scss">
.game-container {
  width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats {
  display: flex;
  gap: 20px;
  font-size: 0.16rem;
}

.timer.warning {
  color: red;
  animation: blink 1s infinite;
}

.difficulty-selector {
  display: flex;
  gap: 10px;
  &-button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.16rem;
    background-color: var(--primary-color);
    &.active {
      background-color: var(--primary-active-color);
      color: white;
    }
  }
}
.game-board {
  display: grid;
  gap: 4px;
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 8px;
  position: relative;
}

.board-row {
  display: flex;
  flex-direction: column;
  row-gap: 4px;
}

.cell {
  aspect-ratio: 1;
  background-color: #fff;
  color: #000;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 0.4rem;
  transition: all 0.2s ease;
  line-height: 1;
  &.empty {
    background-color: transparent;
    cursor: default;
  }
  &.selected {
    background-color: var(--primary-active-color);
    color: white;
    //transform: scale(0.95);
  }
  &.highlighted {
    animation: pulse 1s infinite;
  }
  &-content {
    transition: all 0.2s ease;
  }
}

.connection-line {
  position: absolute;
  background-color: rgba(76, 175, 80, 0.8);
  pointer-events: none;
  will-change: transform, opacity;
}

.game-controls {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.16rem;
}

.props {
  display: flex;
  gap: 10px;
}

.leaderboard {
  margin-top: 30px;
  padding: 20px;
  background-color: #f8f8f8;
  border-radius: 8px;
  font-size: 0.16rem;
  h3 {
    margin: 0 0 15px 0;
    color: #000;
  }
}

.leaderboard-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.record-item {
  display: grid;
  grid-template-columns: 40px 1fr 1fr 2fr;
  padding: 8px;
  border-bottom: 1px solid #eee;
  color: #000;
}

.game-over-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: white;
  color: #000;
  padding: 30px;
  border-radius: 8px;
  text-align: center;
}

@keyframes blink {
  50% {
    opacity: 0.5;
  }
}

@keyframes pulse {
  50% {
    transform: scale(0.95);
    background-color: var(--primary-active-color);
  }
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@media (max-width: 840px) {
  .game-container {
    width: 100vw;
    padding: 10px;
  }
}
</style>

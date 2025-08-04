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
        <button
          v-for="diff in Object.keys(DIFFICULTY_CONFIGS)"
          :key="diff"
          :class="{ active: difficulty === diff }"
          @click="changeDifficulty(diff)"
        >
          {{ getDifficultyName(diff) }}
        </button>
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
        v-if="connectionPath.length > 0"
        class="connection-line"
        :style="connectionLineStyle"
      ></div>
    </div>

    <div class="game-controls">
      <div class="props">
        <button
          @click="useProp(PropType.HINT)"
          :disabled="!canUseProp(PropType.HINT)"
          class="prop-button"
        >
          提示 ({{ props[PropType.HINT] }})
        </button>
        <button
          @click="useProp(PropType.SHUFFLE)"
          :disabled="!canUseProp(PropType.SHUFFLE)"
          class="prop-button"
        >
          打乱 ({{ props[PropType.SHUFFLE] }})
        </button>
        <button
          @click="useProp(PropType.UNDO)"
          :disabled="!canUseProp(PropType.UNDO)"
          class="prop-button"
        >
          撤销 ({{ props[PropType.UNDO] }})
        </button>
      </div>
      <button @click="startNewGame" class="new-game-btn">新游戏</button>
    </div>

    <!-- 排行榜 -->
    <div class="leaderboard">
      <h3>排行榜</h3>
      <div class="leaderboard-filters">
        <button
          v-for="diff in Object.keys(DIFFICULTY_CONFIGS)"
          :key="diff"
          :class="{ active: leaderboardDifficulty === diff }"
          @click="leaderboardDifficulty = diff"
        >
          {{ getDifficultyName(diff) }}
        </button>
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

// 状态管理
const board = ref<number[][]>([]);
const score = ref(0);
const timeElapsed = ref(0);
const timer = ref<number | null>(null);
const selectedPoint = ref<Point | null>(null);
const difficulty = ref('normal');
const showGameOver = ref(false);
const gameOverMessage = ref('');
const connectionPath = ref<Point[]>([]);
const highlightedCells = ref<Point[]>([]);
const leaderboardDifficulty = ref('normal');
const gameHistory = ref<GameState[]>([]);

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

const connectionLineStyle = computed(() => {
  if (connectionPath.value.length < 2) return {};
  // 计算连线样式...
  return {};
});

// 方法
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
  connectionPath.value = [];

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
  connectionPath.value = [point1, point2];
  setTimeout(() => {
    connectionPath.value = [];
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
    case PropType.HINT:
      const match = findPossibleMatch(board.value);
      if (match) {
        highlightedCells.value = match;
        setTimeout(() => {
          highlightedCells.value = [];
        }, 3000);
      }
      break;
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
  const emojis = [
    '🐶',
    '🐱',
    '🐭',
    '🐹',
    '🐰',
    '🦊',
    '🐻',
    '🐼',
    '🐨',
    '🐯',
    '🦁',
    '🐮'
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

<style scoped>
.game-container {
  max-width: 800px;
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
  font-size: 1.2em;
}

.timer.warning {
  color: red;
  animation: blink 1s infinite;
}

.difficulty-selector {
  display: flex;
  gap: 10px;
}

.difficulty-selector button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.difficulty-selector button.active {
  background-color: #4caf50;
  color: white;
}

.game-board {
  display: grid;
  gap: 4px;
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 8px;
  position: relative;
}

.cell {
  aspect-ratio: 1;
  background-color: #fff;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 1.5em;
  transition: all 0.3s ease;
}

.cell.empty {
  background-color: transparent;
  cursor: default;
}

.cell.selected {
  background-color: #4caf50;
  color: white;
  transform: scale(0.95);
}

.cell.highlighted {
  animation: pulse 1s infinite;
}

.cell-content {
  transition: all 0.3s ease;
}

.connection-line {
  position: absolute;
  background-color: rgba(76, 175, 80, 0.5);
  pointer-events: none;
  transition: all 0.3s ease;
}

.game-controls {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.props {
  display: flex;
  gap: 10px;
}

.prop-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #2196f3;
  color: white;
  cursor: pointer;
}

.prop-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.new-game-btn {
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1em;
}

.leaderboard {
  margin-top: 30px;
  padding: 20px;
  background-color: #f8f8f8;
  border-radius: 8px;
}

.leaderboard h3 {
  margin: 0 0 15px 0;
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
    background-color: #81c784;
  }
}
</style>

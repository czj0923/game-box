export interface GameRecord {
  score: number;
  time: number;
  date: string;
  difficulty: string;
}
// 游戏记录管理
const STORAGE_KEY = 'link_game_records';
import { useStorage } from '@vueuse/core';

const records = useStorage<GameRecord[]>(STORAGE_KEY, []);
// 保存游戏记录到localStorage
export function saveGameRecord(record: GameRecord): void {
  records.value.push(record);
  records.value.sort((a, b) => b.score - a.score);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value.slice(0, 10)));
}

// 从localStorage获取游戏记录
export function getGameRecords(): GameRecord[] {
  return records.value;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
}

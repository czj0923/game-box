import { defineStore } from 'pinia';

export const useMainStore = defineStore('main', {
  state: () => ({
    ratio: 1, // 缩小画布比例
    screenWidth: 840 // 屏幕宽度阈值，小于此值为小屏模式
  })
});

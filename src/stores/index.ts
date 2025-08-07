import { defineStore } from 'pinia';

export const useMainStore = defineStore('main', {
  state: () => ({
    ratio: 1 // 屏幕宽度在840px以下时，缩小画布比例
  })
});

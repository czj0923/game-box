<template>
  <div class="tabs">
    <div
      class="tab"
      :class="{ active: activeTab == tab.value }"
      @click="handleClick(tab)"
      v-for="tab in tabs"
      :key="tab.value"
    >
      {{ tab.label }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { type PropType } from 'vue';
import { type Option } from '@/utils/index.ts';

defineProps({
  tabs: Array as PropType<Option[]>,
  activeTab: [String, Number]
});

const emit = defineEmits(['update:activeTab']);
const handleClick = (tab: Option) => {
  emit('update:activeTab', tab.value);
};
</script>

<style lang="scss" scoped>
.tabs {
  background-color: #ebebeb;
  border-radius: 0.06rem;
  display: flex;
  align-items: center;
  padding: 0.04rem;
  height: 0.4rem;
  .tab {
    cursor: pointer;
    line-height: 0.32rem;
    text-align: center;
    padding: 0 0.12rem;
    color: #000;
    &.active {
      color: var(--primary-color);
      background-color: #fff;
      border-radius: 0.06rem;
    }
  }
}
</style>

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
  border-radius: 6px;
  display: flex;
  align-items: center;
  padding: 4px;
  height: 40px;
  .tab {
    cursor: pointer;
    line-height: 32px;
    text-align: center;
    padding: 0 12px;
    color: #000;
    &.active {
      color: var(--primary-color);
      background-color: #fff;
      border-radius: 6px;
    }
  }
}
</style>

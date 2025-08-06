<script setup lang="ts">
defineProps({
  type: {
    type: String,
    default: 'primary'
  },
  isActive: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
});
const emit = defineEmits(['click']);
const handleClick = (e: Event) => {
  emit('click', e);
};
</script>

<template>
  <div
    class="button"
    @click="handleClick"
    :class="{ active: isActive, disabled }"
  >
    <slot></slot>
  </div>
</template>

<style lang="scss" scope>
.button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.16rem;
  background-color: var(--primary-color);
  transition: all ease 0.2s;
  color: #fff;
  &.active {
    background-color: var(--primary-active-color);
  }
  &.disabled {
    background-color: var(--disabled-bg-color);
    color: var(--disabled-color);
    cursor: not-allowed;
  }
  &:hover {
    opacity: 0.8;
  }
}
</style>

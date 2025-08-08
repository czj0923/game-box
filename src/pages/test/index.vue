<template>
  <div>{{ state }}</div>
</template>
<script lang="ts" setup>
import { useStorage } from '@vueuse/core';
const state = useStorage('link_game_records', []);
</script>

<template>
  <div>111</div>
  <c-button @click="handleClick">change</c-button>
</template>
<script lang="ts" setup>
import { useDark, useSupported } from '@vueuse/core';
import { computed, toValue, ref } from 'vue';

const isDark = useDark();
const handleClick = () => {};
</script>

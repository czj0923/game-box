<script setup lang="ts">
import { useMainStore } from './stores';
const store = useMainStore();
import { watch } from 'vue';
import { px2remTransformer } from 'ant-design-vue';
import { useWindowSize, useDark } from '@vueuse/core';
import zhCN from 'ant-design-vue/es/locale/zh_CN';

const { width } = useWindowSize();

watch(
  width,
  (newV) => {
    if (newV < store.screenWidth) {
      store.$patch((state) => {
        state.ratio = newV / store.screenWidth;
      });
    } else {
      store.$patch((state) => {
        state.ratio = 1;
      });
    }
  },
  { immediate: true }
);

const px2rem = px2remTransformer({
  rootValue: 100
});
</script>

<template>
  <a-style-provider :transformers="[px2rem]">
    <a-config-provider
      :locale="zhCN"
      :theme="{
        token: {
          colorPrimary: '#46b7b9'
        }
      }"
    >
      <router-view></router-view>
    </a-config-provider>
  </a-style-provider>
</template>

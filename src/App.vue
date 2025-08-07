<script setup lang="ts">
import { useMainStore } from './stores';
const store = useMainStore();
import { onMounted, onUnmounted } from 'vue';
import { px2remTransformer } from 'ant-design-vue';

const px2rem = px2remTransformer({
  rootValue: 100
});

const handleResize = () => {
  if (window.innerWidth < 840) {
    store.$patch((state) => {
      state.ratio = window.innerWidth / 840;
    });
  } else {
    store.$patch((state) => {
      state.ratio = 1;
    });
  }
};
handleResize();
onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <a-style-provider :transformers="[px2rem]">
    <a-config-provider
      :theme="{
        token: {
          colorPrimary: '#00b96b'
        }
      }"
    >
      <router-view></router-view>
    </a-config-provider>
  </a-style-provider>
</template>

<template>
  <div class="home">
    <swiper
      :slides-per-view="1"
      :space-between="50"
      @swiper="onSwiper"
      @slideChange="onSlideChange"
    >
      <swiper-slide
        @click="goToGame(item.url)"
        v-for="item in gameList"
        :key="item.id"
      >
        <div class="game-item">
          <img :src="item.coverImg" class="game-item-img" />
          <div class="game-item-name">{{ item.name }}</div>
        </div>
      </swiper-slide>
    </swiper>
  </div>
</template>
<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue';
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';

const router = useRouter();
console.log(import.meta.env.VITE_BASE_URL);

interface Game {
  id: number;
  name: string;
  coverImg: string;
  url: string;
}
const gameList: Game[] = reactive([
  { id: 1, name: '连连看', coverImg: '/img/link-game.jpg', url: '/link-game' },
  { id: 2, name: '消消乐', coverImg: '', url: '' }
]);

const goToGame = (url: string) => {
  if (!url) {
    return message.error('暂未开发');
  }
  router.push({
    path: url
  });
};
const onSwiper = (swiper: any) => {
  console.log(swiper);
};
const onSlideChange = () => {
  console.log('slide change');
};
//definePage({
//  redirect: '/link-game'
//});
</script>
<style lang="scss" scoped>
.home {
  padding-top: 1rem;
}
.game-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  &-img {
    height: 4.5rem;
  }
  &-name {
    color: #fff;
    font-size: 0.4rem;
    font-weight: 600;
  }
}
</style>

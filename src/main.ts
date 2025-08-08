import { createApp } from 'vue';
import 'swiper/css';
import 'ant-design-vue/dist/reset.css';
import './assets/style.css';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';

const store = createPinia();
const app = createApp(App);
app.use(router).use(store);

app.mount('#app');

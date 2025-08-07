import { createApp } from 'vue';
import './assets/style.css';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import { message } from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';

const store = createPinia();
const app = createApp(App);
app.use(router).use(store);

app.mount('#app');
//app.config.globalProperties.$message = message;

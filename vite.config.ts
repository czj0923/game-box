import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import VueRouter from 'unplugin-vue-router/vite';
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(process.cwd(), 'environment'), '');
  return {
    base: env.VITE_BASE_URL,
    plugins: [
      VueRouter({}),
      vue(),
      Components({
        resolvers: [
          AntDesignVueResolver({
            importStyle: false,
            resolveIcons: true
          })
        ]
      })
    ],
    envDir: 'environment',
    resolve: {
      alias: {
        '@': '/src'
      }
    },
    define: {
      APP_VERSION: JSON.stringify('1.0.0')
    },
    server: {
      // 局域网服务
      host: true,
      port: 3000,
      hmr: true
    }
  };
});

import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import VueRouter from 'unplugin-vue-router/vite';
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import path from 'node:path';

// eslint-disable-next-line no-control-regex
const INVALID_CHAR_REGEX = /[\u0000-\u001F"#$&*+,:;<=>?[\]^`{|}\u007F]/g;
const DRIVE_LETTER_REGEX = /^[a-z]:/i;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(process.cwd(), 'environment'), '');
  return {
    base: '/game-box/',
    build: {
      rollupOptions: {
        output: {
          // https:///rollup/rollup/blob/master/src/utils/sanitizeFileName.ts
          sanitizeFileName(name) {
            const match = DRIVE_LETTER_REGEX.exec(name);
            const driveLetter = match ? match[0] : '';
            // A `:` is only allowed as part of a windows drive letter (ex: C:\foo)
            // Otherwise, avoid them because they can refer to NTFS alternate data streams.
            return (
              driveLetter +
              name.slice(driveLetter.length).replace(INVALID_CHAR_REGEX, '')
            );
          }
        }
      }
    },
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

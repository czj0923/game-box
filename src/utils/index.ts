import { Modal } from 'ant-design-vue';
import { createVNode } from 'vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { useMediaQuery } from '@vueuse/core';
import { useMainStore } from '@/stores/index.ts';
const store = useMainStore();

export interface Option {
  label: string;
  value: string | number;
}

const isSmallScreen = () => {
  return store.ratio < 1;
};

function confirm(content: string = '是否重新开始游戏？') {
  if (isSmallScreen()) {
    return new Promise((resolve, reject) => {
      const isConfirmed = window.confirm(content);
      if (isConfirmed) {
        resolve(true);
      } else {
        reject();
      }
    });
  } else {
    return new Promise((resolve, reject) => {
      Modal.confirm({
        title: '确认提示',
        icon: createVNode(ExclamationCircleOutlined),
        content,
        onOk() {
          resolve(true);
        },
        onCancel() {
          reject();
        }
      });
    });
  }
}
export { confirm, isSmallScreen };

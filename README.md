## vite+vue3的项目模板
### 介绍
该项目是基于vite7+vue3的模板，集成了`vue-router`,`axios`,`sass`,`eslint`,`prettier`等常用库，同时使用`lint-staged`+`husky`进行commit前代码格式化。
同时集成`unplugin-vue-router/vite`插件，页面放在pages目录下，无需手动配置路由文件。
具体配置可以查看[官方文档](https://uvr.esm.is/guide/configuration.html)

### 注意
本项目使用的vite7要求node版本`20.19+`或`22.12+`，在vscode中使用`Vue(Official)`插件

### 使用方法
1. 使用脚手架安装：
```bash
pnpm add -g @caozhijie/czj-cli
czj-cli create
```
或者直接clone
```bash
git clone https://github.com/czj0923/vite-vue-template.git
```
2. 进入项目目录并安装依赖：
```bash
cd vite-vue-template
pnpm install
```
3. 启动开发服务器：
```bash
pnpm run dev
```
4. 构建生产环境代码：
```bash
pnpm run build
```
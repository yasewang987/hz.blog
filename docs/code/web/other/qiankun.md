# qiankun创建微应用

## 开发前置准备

1. 安装nvm，并安装 npm，具体可以参考 [npm安装资料](../npm/install.md)
1. 安装 yarn：`npm install -g yarn`
1. 安装 vue-cli: `yarn global add @vue/cli`

## 创建应用示例

使用 vue3+vue-cli4+ts+qiankun

参考地址：https://github.com/gongshun/qiankun-vue-demo

### 创建主应用

* 创建应用 `vue create main`,这里选择`vue3,ts,vue-router,vue-store`等
* 添加qiankun：`cd main && yarn add qiankun`
* 修改`src/store/index.ts`，内容如下：
```ts
import { createStore } from "vuex";

export default createStore({
  state: {
    commonData: {
      parent: 0
    }
  },
  mutations: {
    setCommonData(state, val) {
      state.commonData = val
    }
  },
  actions: {},
  modules: {},
});
```
* 添加`src/shims-vuex.d.ts`,用于在vue文件的中识别`this.$store`
```ts
/**
 * vuex扩充模块
 */
 import { Store } from '@/store';

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $store: Store;
    }
}
```
* 修改`src/main.ts`内容如下
```ts
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { registerMicroApps, start } from "qiankun";

const app = createApp(App)

registerMicroApps([
    {
        name: "login",
        entry: "//localhost:11111",
        container: "#appContainer",
        activeRule: "/login",
        props: { data: { store, router } }
    },
    {
        name: "search",
        entry: "//localhost:11112",
        container: "#appContainer",
        activeRule: "/search",
        props: { data : store }
    }
]);

start();

app.use(store).use(router).mount("#app");
```
* 修改`src/app.vue`内容如下：
```js
<template>
  <div id="app">
    <header>
      <router-link to="/login">login</router-link>
      <router-link to="/search">search</router-link>
      <router-link to="/about">About</router-link>
      <span @click="changeParentData">主项目数据：{{ commonData.parent }}, 点击变回1</span>
    </header>
    <div id="appContainer"></div>
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  computed: {
    commonData() {
      return this.$store.state.commonData
    }
  },
  methods: {
    changeParentData() {
      this.$store.commit('setCommonData', { parent: 1 })
    }
  },
})
</script>

<style>
#app{
  height: 100vh;
  text-align: center;
  position: relative;
}

header>a{
  margin: 0 20px;
}
.appContainer{
  background: #ccc;
  padding: 20px;
}
</style>
```
* 添加`src/vue.config.ts`，内容如下：
```ts
const path = require('path');

module.exports = {
  transpileDependencies: ['single-spa','qiankun','import-html-entry'],
};
```

* 主项目添加多项目启动 `yarn add npm-run-all`,并修改`package.json`：
```json
{
    "scripts": {
    "serve": "vue-cli-service serve",
    "build": "vue-cli-service build",
    "lint": "vue-cli-service lint",
    "install:main": "npm install",
    "install:login": "cd ../../box.login && npm install",
    "install-all": "npm-run-all install:*",
    "start:main": "npm run serve",
    "start:login": "cd ../../box.login && npm run serve",
    "start-all": "npm-run-all --parallel start:*",
    "build:main": "npm run build",
    "build:login": "cd ../../box.login && npm run build",
    "build-all": "npm-run-all --parallel build:*"
    },
}
```

### 创建微应用

* 创建应用：`vue create search`，选择`vue3,ts,vue-router,vue-store等`
* 修改`public/index.html`,中的 `<div id="login"></div>`
* 修改`src/router/index.ts`：
```ts
import { RouteRecordRaw } from "vue-router";
import Home from "../views/Home.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/about",
    name: "About",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/About.vue"),
  },
];
// const router = createRouter({
//   history: createWebHistory(process.env.BASE_URL),
//   routes,
// });
export default routes;
```
* 添加`src/public-path.ts`:
```ts
if ((window as any).__POWERED_BY_QIANKUN__) {
  __webpack_public_path__ = (window as any).__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}
```
* 添加`src/shims-vuex.d.ts`,用于在vue文件中识别`this.$store`：
```ts
/**
 * vuex扩充模块
 */
import { Store } from "@/store";

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $store: Store;
  }
}
```
* 修改`tsconfig.json`,添加`json`文件解析支持。
```json
{
  "compilerOptions": {
      "resolveJsonModule": true,
  }
}
```
* 修改`src/app.vue`内容如下：
```ts
<template>
  <div id="nav">
    <router-link to="/">Home</router-link> |
    <router-link to="/about">About</router-link>
  </div>
  <h1>{{ commonData.parent }}</h1>
  <router-view />
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  computed: {
    commonData() {
      return this.$store.state.commonData;
    },
  },
});
</script>
```
* 修改`src/main.ts`内容如下：
```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApp, App } from "vue";
import AppCom from "./App.vue";
import routes from "./router";
import {
  createRouter,
  createWebHistory,
  RouterHistory,
  Router,
} from "vue-router";
import storeLocal from "./store";
import "./public-path";

import { name } from "../package.json";

interface IRenderProps {
  container: Element | string;
  data: any;
}

let router: Router;
let instance: App<Element>;
let history: RouterHistory;

function render(props: IRenderProps) {
  const { container, data } = props;
  history = createWebHistory(
    (window as any).__POWERED_BY_QIANKUN__ ? `/${name}` : "/"
  );
  router = createRouter({
    history,
    routes,
  });
  instance = createApp(AppCom);
  instance
    .use(data.store, storeLocal)
    .use(router)
    .mount(
      typeof container === "string"
        ? container
        : (container.querySelector("#login") as Element)
    );
}

if (!(window as any).__POWERED_BY_QIANKUN__) {
  render({ container: "#login", data: {} });
}

/**
 * bootstrap ： 在微应用初始化的时候调用一次，之后的生命周期里不再调用
 */
export async function bootstrap() {
  console.log("bootstrap");
}

/**
 * mount ： 在应用每次进入时调用
 */
export async function mount(props: any) {
  console.log("mount", props);
  render(props);
}

/**
 * unmount ：应用每次 切出/卸载 均会调用
 */
export async function unmount() {
  instance.unmount();
  if (instance._container) {
    instance._container.innerHTML = "";
  }
  history.destroy();
}
```
* 添加`src/vue.config.js`内容如下：
```js
/* eslint-disable @typescript-eslint/no-var-requires */
const APP_NAME = require("./package.json").name;
const path = require("path");

module.exports = {
  devServer: {
    // 监听端口
    port: 11111,
    // 关闭主机检查，使微应用可以被 fetch
    disableHostCheck: true,
    // 配置跨域请求头，解决开发环境的跨域问题
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  configureWebpack: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    output: {
      // 微应用的包名，这里与主应用中注册的微应用名称一致
      library: APP_NAME,
      // 将你的 library 暴露为所有的模块定义下都可运行的方式
      libraryTarget: "umd",
      // 按需加载相关，设置为 webpackJsonp_微应用名称 即可
      jsonpFunction: `webpackJsonp_${APP_NAME}`,
    },
  },
};
```
# Micro-app创建微应用

## 参考资料

* 官方文档：https://cangdu.org/micro-app/docs.html#/
* demo地址：https://github.com/hz-microservices/demo.microapp

## 简单示例创建


### 创建基座应用

* 创建基座应用,这里建议创建`histrory`模式的`vue`应用

```bash
vue create main && cd main

# 安装依赖
npm i @micro-zoe/micro-app --save
```

* 修改入口文件`main.js`

```js
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

// 添加下面这两行
import microApp from '@micro-zoe/micro-app';
microApp.start();

createApp(App).use(store).use(router).mount("#app");
```

* 修改路由 `router/index.js`

```js
  {
    path: "/mypage/:page*",
    name: "mypage",
    component: () =>
      import(/* webpackChunkName: "mypage" */ "../pages/mypage.vue"),
  }
```

* 创建子应用的承载页面`pages/mypage.vue`

```html
<!-- my-page.vue -->
<template>
  <div>
    <h1>子应用</h1>
    <!-- 
      name(必传)：应用名称，每个`name`都对应一个应用，必须以字母开头，且不可以带有 `.`、`#` 等特殊符号
      url(必传)：页面html的地址
      baseroute(可选)：基座应用分配给子应用的路由前缀，就是上面的my-page
     -->
    <micro-app name='app1' url='http://localhost:3000/'></micro-app>
  </div>
</template>
```

### 创建子应用

* 创建子应用，这里推荐创建`hash`模式路由的`vue`应用

```bash
vue create mypage && cd mypage
```

* 添加应用启动配置文件`vue.config.js`

```js
module.exports = {
    // publicPath: '/micro-app/mypage/',
    devServer: {
      disableHostCheck: true,
      port: 3000,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
}
```
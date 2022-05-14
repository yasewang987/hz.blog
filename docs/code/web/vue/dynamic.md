# Vue动态页面

## vue2

* 准备

```bash
# 安装依赖
yarn add -g @vue/cli-init
# 创建项目
vue init webpack my-project
```

* 直接复制 `HelloWorld.vue`,改为 `HelloWorld2.vue`，在里面加入一些区分的字符

* 新建一个模拟退出逻辑页面`Logic.vue` ,内容如下

```html
<template>
  <div class="hello">
    <router-link :to="{ name: 'firstpage'}">跳转到首页</router-link>
  </div>
</template>

<script>
export default {
  name: 'Logic'
}
</script>
```

* 修改路由配置 `router/index.js`

```js
import Vue from 'vue'
import Router, { createWebHistory } from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import HelloWorld2 from '@/components/HelloWorld2'
import Logic from '@/components/Logic'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'firstpage',
      component: HelloWorld
    },
    {
      path: '/hello',
      name: 'HelloWorld',
      component: HelloWorld
    },
    {
      path: '/hello2',
      name: 'HelloWorld2',
      component: HelloWorld2
    },
    {
      path: '/logic',
      name: 'Logic',
      component: Logic
    }
  ]
})
```

* 准备 nginx 配置

```conf
server {
    listen 11111;
    server_name _;
    location / {
        root   /data/;
        index  index.html index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

* 使用容器启动应用

```bash
docker run -d -p 11111:11111 -v $PWD/dist:/data -v $PWD/nginx:/etc/nginx/conf.d --name mytest nginx
```

* 第一次测试的时候默认访问的是 `HelloWorld` 作为首页。

* 要修改 `HelloWorld2` 作为首页，则需要在生成的 `dist/static/js/app.xxxx.js` 文件查找 `firstpage` 关键字，然后将对应的 `component` 替换成 `HelloWorld2` 对应的 `component` 值，保存。

* 刷新页面再访问会发现首页已经变成了 `HelloWorld2`
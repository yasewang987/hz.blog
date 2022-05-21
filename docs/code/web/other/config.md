# 自定义配置文件

确保配置文件不会被 `vue` 等框架改变, 参考如下操作

```conf
# vue3 - 将配置文件放到public目录下 config.json
{
  "my": "hello hz"
}
```

在首页 `index.html` 中加入如下代码，需要注意如果是 `vue` 等项目，需要把这段代码放在其他 `script` 前面：

```js
function init() {
  var url = "/config.json"
  var request = new XMLHttpRequest();
  request.open("get", url);
  request.send(null);
  request.onload = function () {
    if (request.status == 200) {
      var json = JSON.parse(request.responseText);
      console.log(json.my);
      window.localStorage.setItem('my', json.my)
    }
  }
}
init();
```

在其他页面或组件中使用

```html
<!--vue3示例-->
<script setup lang="ts">
import { ref } from 'vue'
const myvalue = ref<string | null>('')
myvalue.value = window.localStorage.getItem('my')
setInterval(() => {
  myvalue.value = 'aaaaaaa'
}, 1000*3)
</script>
<template>
  <h1>{{ myvalue }}</h1>
</template>
```
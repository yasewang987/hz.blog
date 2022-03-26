# VueUse

`VueUse` 是一个基于 `Composition API` 的实用函数集合。通俗的来说，这就是一个工具函数包，它可以帮助你快速实现一些常见的功能，免得你自己去写，解决重复的工作内容。以及进行了基于 `Composition API` 的封装。让你在 `vue3` 中更加得心应手。

## 安装

```bash
npm i @vueuse/core
```

## 使用示例

### 防抖、节流

```ts
import { throttleFilter, debounceFilter, useLocalStorage, useMouse } from  @vueuse/core 

// 以节流的方式去改变 localStorage 的值
const storage = useLocalStorage( my-key , { foo:  bar  }, { eventFilter: throttleFilter(1000) })

// 100ms后更新鼠标的位置
const { x, y } = useMouse({ eventFilter: debounceFilter(100) })
```
还有在 component 中使用的函数

```html
<script setup>
import { ref } from  vue 
import { onClickOutside } from  @vueuse/core 

const el = ref()

function close () {
  /* ... */
}

onClickOutside(el, close)
</script>

<template>
  <section ref="el">
    Click Outside of Me
  </section>
</template>
```
上面例子中，使用了 `onClickOutside` 函数，这个函数会在点击元素外部时触发一个回调函数。也就是这里的 `close` 函数。在 `component` 中就是这么使用

这里的 `OnClickOutside` 函数是一个组件，不是一个函数。需要`package.json` 中安装了 `@vueuse/components`

```html
<script setup>
import { OnClickOutside } from  @vueuse/components 

function close () {
  /* ... */
}
</script>

<template>
  <OnClickOutside @trigger="close">
    <section>
      Click Outside of Me
    </section>
  </OnClickOutside>
</template>
```

### 全局状态共享

```js
// store.js
import { createGlobalState, useStorage } from  @vueuse/core 

export const useGlobalState = createGlobalState(
  () => useStorage( vue-use-local-storage ),
)
```

```js
// component.js
import { useGlobalState } from  ./store 

export default defineComponent({
  setup() {
    const state = useGlobalState()
    return { state }
  },
})
```

### 简单请求fetch

```ts
import { useFetch } from  @vueuse/core 

const { isFetching, error, data } = useFetch(url)
```

很多的 `option` 参数，可以自定义。

```ts
// 100ms超时
const { data } = useFetch(url, { timeout: 100 })
// 请求拦截
const { data } = useFetch(url, {
  async beforeFetch({ url, options, cancel }) {
    const myToken = await getMyToken()

    if (!myToken)
      cancel()

    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${myToken}`,
    }

    return {
      options
    }
  }
})
// 响应拦截
const { data } = useFetch(url, {
  afterFetch(ctx) {
    if (ctx.data.title ===  HxH )
      ctx.data.title =  Hunter x Hunter  // Modifies the resposne data

    return ctx
  },
})
```
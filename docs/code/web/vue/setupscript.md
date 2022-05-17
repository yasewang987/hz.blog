# Vue3 Setup Script

`Vue3.2` 中 只需要在 `script` 标签上加上 `setup` 属性，组件在编译的过程中代码运行的上下文是在 `setup()` 函数中，无需`return`，`template`可直接使用。

## 基础示例

```ts
<template>
  // 调用方法
  <button @click='changeName'>按钮</button>  
</template>
<script setup>
  import { reactive, ref, toRefs, computed, watch, nextTick } from 'vue'
  import { useRoute, useRouter, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
  import { useStore } from 'vuex'
  import { key } from '../store/index'

  // ref声明响应式数据，用于声明基本数据类型
  const name = ref('Jerry')
  // 修改
  name.value = 'Tom'

  // reactive声明响应式数据，用于声明引用数据类型
  const state = reactive({
    name: 'Jerry',
    sex: '男',
    count: 1,
    color: 'red'
  })
  // 修改
  state.name = 'Tom'
  
  // 使用toRefs解构
  const {name, sex} = toRefs(state)
  // template可直接使用{{name}}、{{sex}}

  ////// methods
  // 声明method方法
  const changeName = () => {
    state.name = 'Tom'
  }

  //// computed
  const count = ref(1)

  // 通过computed获得doubleCount
  const doubleCount = computed(() => {
    return count.value * 2
  })

  ////// watch
  // 监听count
  watch(
    () => state.count,
    (newVal, oldVal) => {
      console.log(state.count)
      console.log(`watch监听变化前的数据：${oldVal}`)
      console.log(`watch监听变化后的数据：${newVal}`)
    },
    {
      immediate: true, // 立即执行
      deep: true // 深度监听
    }
  )
  // 侦听多个数据源(数组)
  const state = reactive({count: 1});
  const num = ref(0);
  // 监听一个数组
  watch([()=>state.count,num],([newCount,newNum],[oldCount,oldNum])=>{
    console.log('new:',newCount,newNum);
    console.log('old:',oldCount,oldNum);
  })

  // 侦听复杂的嵌套对象
  const state = reactive({
    person: {
      name: '张三',
      fav: ['帅哥','美女','音乐']
    },
  });
  watch(
    () => state.person,
    (newType, oldType) => {
      console.log("新值:", newType, "老值:", oldType);
    },
    { deep: true }, // 立即监听，如果不设置是无法监听的
  );

  ////// nextTick
  nextTick(() => {
    // ...
  })

  ////// route,router
  // 必须先声明调用
  const route = useRoute()
  const router = useRouter()
	
  // 路由信息
  console.log(route.query)

  // 路由跳转
  router.push('/newPage')
  // 添加一个导航守卫，在当前组件将要离开时触发。
  onBeforeRouteLeave((to, from, next) => {
    next()
  })

  // 添加一个导航守卫，在当前组件更新时触发。
  // 在当前路由改变，但是该组件被复用时调用。
  onBeforeRouteUpdate((to, from, next) => {
    next()
  })

  ////// store
  // 必须先声明调用
  const store = useStore(key)
	
  // 获取Vuex的state
  store.state.xxx

  // 触发mutations的方法
  store.commit('fnName')

  // 触发actions的方法
  store.dispatch('fnName')

  // 获取Getters
  store.getters.xxx

  ///// await
  <script>
    const post = await fetch('/api').then(() => {})
  </script>
  <style scoped>
    span {
      // 使用v-bind绑定state中的变量
      color: v-bind('state.color');
    }  
  </style>
```
## watchEffect

立即执行传入的一个函数，并响应式追踪其依赖，并在其依赖变更时重新运行该函数。

```js
const num = ref(0)

watchEffect(() => console.log(count.value))
// -> 打印出 0

setTimeout(() => {
  count.value++
  // -> 打印出 1
}, 100)

///// 停止监听
const stop = watchEffect(()=>{
  /*...*/
})
//停止侦听
stop()

////// 清除副作用
watchEffect((onInvalidate) => {
  const token = performAsyncOperation(id.value)
  onInvalidate(() => {
    // id 改变时 或 停止侦听时
    // 取消之前的异步操作
    token.cancel()
  })
})
```

## 生命周期

```bash
onBeforeMount
onMounted
onBeforeUpdate
onUpdated
onBeforeUnmount
onUnmount
onErrorCaptured
onRenderTraced
onRenderTriggered
onActivated
onDeactivated
```

```html
<template>
  <div id="test">
    <h3>{{a}}</h3>
    <button @click="handleClick">更改</button>
  </div>
</template>

<script>
import {
  ref,
  onMounted,
  onBeforeMount,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
} from "vue";
export default {
  // 初始化数据阶段的生命周期，介于beforeCreate和created之间
  setup() {
    const a = ref(0);
    console.log("👌");
    function handleClick() {
      a.value += 1;
    }
    onBeforeMount(() => {
      console.log("组件挂载之前");
    });
    onMounted(() => {
      console.log("DOM挂载完成");
    });
    onBeforeUpdate(() => {
      console.log("DOM更新之前", document.getElementById("test").innerHTML);
    });
    onUpdated(() => {
      console.log("DOM更新完成", document.getElementById("test").innerHTML);
    });
    onBeforeUnmount(() => {
      console.log("实例卸载之前");
    });
    onUnmounted(() => {
      console.log("实例卸载之后");
    });
    return { a, handleClick };
  }
};
</script>
```

## props,emit父传子

* 子组件
```ts
<template>
  <span>{{props.name}}</span>
  // 可省略【props.】
  <span>{{name}}</span>
  <button @click='changeName'>更名</button>
</template>

<script setup>
  import { defineProps } from 'vue'
  // defineProps在<script setup>中自动可用，无需导入
  // 需在.eslintrc.js文件中【globals】下配置【defineProps: true】

  // 声明props
  const props = defineProps({
    name: {
      type: String,
      default: ''
    }
  })
  // 声明事件
  const emit = defineEmits(['updateName'])
  
  const changeName = () => {
    // 执行
    emit('updateName', 'Tom')
  }
</script>
```
* 父组件
```ts
<template>
  <child :name='state.name' @updateName='updateName'/>  
</template>

<script setup>
  import { reactive } from 'vue'
  // 引入子组件
  import child from './child.vue'

  const state = reactive({
    name: 'Jerry'
  })
  
  // 接收子组件触发的方法
  const updateName = (name) => {
    state.name = name
  }
</script>
```

## v-model
* 子组件
```ts
<template>
  <span @click="changeInfo">我叫{{ modelValue }}，今年{{ age }}岁</span>
</template>

<script setup>
  import { defineEmits, defineProps } from 'vue'
  // defineEmits和defineProps在<script setup>中自动可用，无需导入
  // 需在.eslintrc.js文件中【globals】下配置【defineEmits: true】、【defineProps: true】

  defineProps({
    modelValue: String,
    age: Number,
    list: {
      type: Array,
      default: () => [],
    },
  })

  const emit = defineEmits(['update:modelValue', 'update:age'])
  const changeInfo = () => {
    // 触发父组件值更新
    emit('update:modelValue', 'Tom')
    emit('update:age', 30)
  }
</script>
```
* 父组件
```ts
<template>
  // v-model:modelValue简写为v-model
  // 可绑定多个v-model
  <child
    v-model="state.name"
    v-model:age="state.age"
  />
</template>

<script setup>
  import { reactive } from 'vue'
  // 引入子组件
  import child from './child.vue'

  const state = reactive({
    name: 'Jerry',
    age: 20
  })
</script>
```

## 子组件ref变量和defineExpose
* 在标准组件写法里，子组件的数据都是默认隐式暴露给父组件的，但在 `script-setup` 模式下，所有数据只是默认 `return` 给 `template` 使用，不会暴露到组件外，所以父组件是无法直接通过挂载 ref 变量获取子组件的数据。
* 如果要调用子组件的数据，需要先在子组件显示的暴露出来，才能够正确的拿到，这个操作，就是由 `defineExpose` 来完成.

* 子组件
```ts
<template>
  <span>{{state.name}}</span>
</template>

<script setup>
  import { defineExpose, reactive, toRefs } from 'vue'
	
  // 声明state
  const state = reactive({
    name: 'Jerry'
  }) 
	
  // 声明方法
  const changeName = () => {
    // 执行
    state.name = 'Tom'
  }
  
  // 将方法、变量暴露给父组件使用，父组见才可通过ref API拿到子组件暴露的数据
  defineExpose({
    // 解构state
    ...toRefs(state),
    changeName
  })
</script>
```
* 父组件
```ts
<template>
  <child ref='childRef'/>  
</template>

<script setup>
  import { ref, nextTick } from 'vue'
  // 引入子组件
  import child from './child.vue'

  // 子组件ref
  const childRef = ref('childRef')
  
  // nextTick
  nextTick(() => {
    // 获取子组件name
    console.log(childRef.value.name)
    // 执行子组件方法
    childRef.value.changeName()
  })
</script>
```

## 原型绑定与组件内使用

* `main.js`
```js
import { createApp } from 'vue'
import App from './App.vue'
const app = createApp(App)

// 获取原型
const prototype = app.config.globalProperties

// 绑定参数
prototype.name = 'Jerry'
```
* 组件内使用
```ts
<script setup>
  import { getCurrentInstance } from 'vue'

  // 获取原型
  const { proxy } = getCurrentInstance()
  
  // 输出
  console.log(proxy.name)
</script>
```

## 定义组件的name

```ts
<script>
  export default {
    name: 'ComponentName',
  }
</script>
```

## provide和inject(依赖注入)
* 父组件
```ts
<template>
  <child/>
</template>

<script setup>
  import { provide } from 'vue'
  import { ref, watch } from 'vue'
  // 引入子组件
  import child from './child.vue'

  let name = ref('Jerry')
  // 声明provide
  provide('provideState', {
    name,
    changeName: () => {
      name.value = 'Tom'
    }
  })

  // 监听name改变
  watch(name, () => {
    console.log(`name变成了${name}`)
    setTimeout(() => {
      console.log(name.value) // Tom
    }, 1000)
  })
</script>
```
* 子组件
```ts
<script setup>
  import { inject } from 'vue'
	// 注入
  const provideState = inject('provideState')
  
  // 子组件触发name改变
  provideState.changeName()
</script>
```


## 渲染函数API

```js
import { h } from 'vue'

export default {
  render() {
    return h('div')
  }
}
```

## 自定义指令

必须以 `vNameOfDirective` 的形式来命名本地自定义指令

```html
<script setup>
const vMyDirective = {
  beforeMount: (el) => {
    // 在元素上做些操作
  }
}
</script>
<template>
  <h1 v-my-directive>This is a Heading</h1>
</template>
```
```html
<script setup>
  // 导入的指令同样能够工作，并且能够通过重命名来使其符合命名规范
  import { myDirective as vMyDirective } from './MyDirective.js'
</script>
```


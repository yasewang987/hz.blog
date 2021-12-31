# Vue3 Setup Script

`<script setup>` 中的代码会在每次组件`实例被创建`的时候执行。

## 属性、方法
```ts
<template>
  <MyComponent :num="num" @click="addNum" />
  <h1 v-for="(n, i) in state.nodes" :key="i">{{ n.nodeName }} + {{ n.nodeIp }} + {{ n.health }}</h1>
  <h2 v-for="(n, i) in nodes" :key="i">{{ n.nodeName }} + {{ n.nodeIp }} + {{ n.health }}</h2>
</template>

<script setup>
  import { ref, reactive, toRefs, onMounted } from 'vue'
  import MyComponent from './MyComponent .vue'
  import nodeApis, { NodeModel, NodeStatusModel } from '@/https/node'

  // 数组
  const state = reactive({
    nodes: [] as NodeModel[],
  })
  onMounted(() => {
    init()
  })
  // 在template中直接可以用nodes
  const { nodes } = toRefs(state)

  // 像在平常的setup中一样的写,但是不需要返回任何变量
  const num= ref(0)       //在此处定义的 num 可以直接使用
  const addNum= () => {   //函数也可以直接引用,不用在return中返回
    num.value++
  }
</script>
```

## props，emit

* 父组件
```ts
<template>
  <h3>父组件</h3>
  <ziHello :name="name" @updata="fupdata"></ziHello>
</template>

<script setup>
  import ziHello from './ziHello'
  
  import {ref} from 'vue'
  let name = ref('name111')
  const fupdata = (data) => {
    console.log(data); //我是子组件的值
  }
</script>
```
* 子组件
```ts
<template>
  <h1>子组件{{name}}<h1>
  <button @click="ziupdata">按钮</button>
</template>

<script setup>
  import {defineProps} from 'vue'
  import {defineEmits} from 'vue'

  defineProps({
   name:{
     type:String,
     default:'默认值'
   }
 })
 //自定义函数，父组件可以触发
  const em=defineEmits(['updata'])
  const ziupdata=()=>{
    em("updata",'子组件的值')
  }
</script>
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


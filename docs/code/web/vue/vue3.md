# Vue3基础知识

## 安装

### CDN

生产环境需要指定版本号。

```html
<script src="https://unpkg.com/vue@next"></script>
```

如果是离线环境，可以通过 `https://unpkg.com/browse/vue@next/dist/` 下载之后，通过本地文件方式引用。里面的版本区别参考：`https://v3.cn.vuejs.org/guide/installation.html#%E5%AF%B9%E4%B8%8D%E5%90%8C%E6%9E%84%E5%BB%BA%E7%89%88%E6%9C%AC%E7%9A%84%E8%A7%A3%E9%87%8A`

### 使用vue-cli安装

```bash
yarn global add @vue/cli
# 或者
npm install -g @vue/cli

## 升级
vue upgrade --next
```

## 常用模版语法

### 文本

```html
<span>Message: {{ msg }}</span>

<!--一次性插入之后不变更-->
<span v-once>这个将不会改变: {{ msg }}</span>

<!--多元表达式-->
{{ number + 1 }}
{{ ok ? 'YES' : 'NO' }}
{{ message.split('').reverse().join('') }}
<div v-bind:id="'list-' + id"></div>
```

### 属性绑定v-bind

```html
<div id="bind-attribute">
  <span v-bind:title="message">
    鼠标悬停几秒钟查看此处动态绑定的提示信息！
  </span>
</div>
```
```js
const AttributeBinding = {
  data() {
    return {
      message: 'You loaded this page on ' + new Date().toLocaleString()
    }
  }
}

Vue.createApp(AttributeBinding).mount('#bind-attribute')
```
其他
```html
<!-- 缩写 -->
<a :href="url"> ... </a>
<!--动态绑定-->
<a v-bind:[attributeName]="url"> ... </a>
<!-- 动态参数的缩写 -->
<a :[key]="url"> ... </a>
```

### 事件绑定v-on

```html
<div id="event-handling">
  <p>{{ message }}</p>
  <button v-on:click="reverseMessage">反转 Message</button>
</div>
```
```js
const EventHandling = {
  data() {
    return {
      message: 'Hello Vue.js!'
    }
  },
  methods: {
    reverseMessage(event) {
      this.message = this.message
        .split('')
        .reverse()
        .join('')
      // `event` 是原生 DOM event
      if (event) {
        alert(event.target.tagName)
      }
    }
  }
}
Vue.createApp(EventHandling).mount('#event-handling')
```
其他
```html
<!-- 缩写 -->
<a @click="doSomething('A',$event)"> ... </a>
<!--动态绑定-->
<a v-on:[eventName]="doSomething"> ... </a>
<!-- 动态参数的缩写 (2.6.0+) -->
<a @[event]="doSomething"> ... </a>
<!--多事件处理-->
<button @click="one($event), two($event)">Submit</button>

<!--事件修饰符 .stop,.prevent,.capture,.self,.once,.passive -->
<!-- 阻止单击事件继续传播 -->
<a @click.stop="doThis"></a>
<!-- 提交事件不再重载页面 -->
<form @submit.prevent="onSubmit"></form>
<!-- 修饰符可以串联 -->
<a @click.stop.prevent="doThat"></a>
<!-- 只有修饰符 -->
<form @submit.prevent></form>
<!-- 添加事件监听器时使用事件捕获模式 -->
<!-- 即内部元素触发的事件先在此处理，然后才交由内部元素进行处理 -->
<div @click.capture="doThis">...</div>
<!-- 只当在 event.target 是当前元素自身时触发处理函数 -->
<!-- 即事件不是从内部元素触发的 -->
<div @click.self="doThat">...</div>
<!-- 点击事件将只会触发一次 -->
<a @click.once="doThis"></a>
<!-- 滚动事件的默认行为 (即滚动行为) 将会立即触发   -->
<!-- 而不会等待 `onScroll` 完成                   -->
<!-- 这其中包含 `event.preventDefault()` 的情况   -->
<div @scroll.passive="onScroll">...</div>

<!--
    按键修饰符,参考下面任意有效按键名转换为 kebab-case 来作为修饰符
    https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
    常用按键别名
    .enter，.tab，.delete，.esc，.space，.up，.down，.left，.right
-->
<!-- 只有在 `key` 是 `Enter` 时调用 `vm.submit()` -->
<input @keyup.enter="submit" />
<input @keyup.page-down="onPageDown" />

<!--
    系统修饰键.ctrl,.alt,.shift,.meta
-->
<!-- Alt + Enter -->
<input @keyup.alt.enter="clear" />
<!-- Ctrl + Click -->
<div @click.ctrl="doSomething">Do something</div>

<!--.exact 修饰符,控制由精确的系统修饰符组合触发的事件。-->
<!-- 即使 Alt 或 Shift 被一同按下时也会触发 -->
<button @click.ctrl="onClick">A</button>
<!-- 有且只有 Ctrl 被按下的时候才触发 -->
<button @click.ctrl.exact="onCtrlClick">A</button>
<!-- 没有任何系统修饰符被按下的时候才触发 -->
<button @click.exact="onClick">A</button>

<!--鼠标按钮修饰符 .left,.right,.middle-->
```

### 双向绑定v-model

(如中文、日文、韩文等) 的语言，你会发现 `v-model` 不会在输入法组织文字过程中得到更新。如果你也想响应这些更新，请使用 `input` 事件监听器和 `value` 绑定，而不是使用 `v-model`。

```html
<div id="two-way-binding">
  <p>{{ message }}</p>
  <input v-model="message" />
</div>
```
```js
const TwoWayBinding = {
  data() {
    return {
      message: 'Hello Vue!'
    }
  }
}

Vue.createApp(TwoWayBinding).mount('#two-way-binding')
```

其他
```html
<!-- 在“change”时而非“input”时更新 -->
<input v-model.lazy="msg" />
<!--自动将用户的输入值转为数值类型-->
<input v-model.number="age" type="number" />
<!--自动过滤用户输入的首尾空白字符-->
<input v-model.trim="msg" />
```

### 条件v-if

一般来说，`v-if` 有更高的切换开销，而 `v-show` 有更高的初始渲染开销。因此，如果需要非常频繁地切换，则使用 `v-show` 较好；如果在运行时条件很少改变，则使用 `v-if` 较好。

不建议与 `v-if` 一起使用。

```html
<div id="conditional-rendering">
  <span v-if="seen === 'A'">现在你看到我了-A</span>
  <span v-else-if="seen === 'B'">现在你看到我了-B</span>
  <span v-else>现在你看到我了-C</span>
</div>
```
```js
const ConditionalRendering = {
  data() {
    return {
      seen: "A"
    }
  }
}

Vue.createApp(ConditionalRendering).mount('#conditional-rendering')
```

`v-show` 元素始终会被渲染并保留在 DOM 中,只是简单地切换元素的 CSS property `display`:

```html
<h1 v-show="ok">Hello!</h1>
```

### 循环v-for

列表示例：

```html
<ul id="array-with-index">
  <li v-for="(item, index) in items" :key="index">
    {{ parentMessage }} - {{ index }} - {{ item.message }}
  </li>
</ul>
```
```js
Vue.createApp({
  data() {
    return {
      parentMessage: 'Parent',
      items: [{ message: 'Foo' }, { message: 'Bar' }]
    }
  }
}).mount('#array-with-index')
```
如下的数组变更方法也会触发视图更新 `push(),pop(),shift(),unshift(),splice(),sort(),reverse()`。
```js
example1.items.push({ message: 'Baz' })
```
替换数组 `filter(),concat(),slice()`
```js
example1.items = example1.items.filter(item => item.message.match(/Foo/))
```

对象示例：

```html
<li v-for="(value, name, index) in myObject" :key="index">
  {{ index }}. {{ name }}: {{ value }}
</li>
```
```js
Vue.createApp({
  data() {
    return {
      myObject: {
        title: 'How to do lists in Vue',
        author: 'Jane Doe',
        publishedAt: '2016-04-10'
      }
    }
  }
}).mount('#v-for-object')
```

### v-html

```html
<div id="example1" class="demo">
    <p>Using mustaches: {{ rawHtml }}</p>
    <p>Using v-html directive: <span v-html="rawHtml"></span></p>
</div>
```
```js
const RenderHtmlApp = {
  data() {
    return {
      rawHtml: '<span style="color: red">This should be red.</span>'
    }
  }
}

Vue.createApp(RenderHtmlApp).mount('#example1')
```

### class绑定

```html
<div
  class="static"
  :class="{ active: isActive, 'text-danger': hasError }"
></div>
```
```js
data() {
  return {
    isActive: true,
    hasError: false
  }
}
```

绑定不在“内联定义”

```html
<div :class="classObject"></div>
```
```js
data() {
  return {
    classObject: {
      active: true,
      'text-danger': false
    }
  }
}
// 使用计算属性方式
computed: {
  classObject() {
    return {
      active: this.isActive && !this.error,
      'text-danger': this.error && this.error.type === 'fatal'
    }
  }
}
```
其他
```html
<!--数组语法-->
<div :class="[activeClass, errorClass]"></div>
data() {
  return {
    activeClass: 'active',
    errorClass: 'text-danger'
  }
}
<!--渲染结果-->
<div class="active text-danger"></div>
<!--也可以使用这种方式-->
<div :class="[{ active: isActive }, errorClass]"></div>
data() {
  return {
    isActive: true,
    errorClass: 'text-danger'
  }
}
```

### style绑定

```html
<div :style="{ color: activeColor, fontSize: fontSize + 'px' }"></div>
```
```js
data() {
  return {
    activeColor: 'red',
    fontSize: 30
  }
}
```

直接绑定到一个样式对象通常更好，这会让模板更清晰

```html
<div :style="styleObject"></div>
```
```js
data() {
  return {
    styleObject: {
      color: 'red',
      fontSize: '13px'
    }
  }
}
```

数组语法

```html
<div :style="[baseStyles, overridingStyles]"></div>
```

### 数据定义data

```js
const app = Vue.createApp({
  data() {
    return { count: 4 }
  }
})

const vm = app.mount('#app')

console.log(vm.$data.count) // => 4
console.log(vm.count)       // => 4

// 修改 vm.count 的值也会更新 $data.count
vm.count = 5
console.log(vm.$data.count) // => 5

// 反之亦然
vm.$data.count = 6
console.log(vm.count) // => 6
```

### 方法methods
在定义 `methods` 时应避免使用箭头函数，因为这会阻止 Vue 绑定恰当的 `this` 指向。
```js
const app = Vue.createApp({
  data() {
    return { count: 4 }
  },
  methods: {
    increment() {
      // `this` 指向该组件实例
      this.count++
    }
  }
})

const vm = app.mount('#app')

console.log(vm.count) // => 4

vm.increment()

console.log(vm.count) // => 5
```

组件防抖(使用 `Lodash` 等库来实现)
```js
<script src="https://unpkg.com/lodash@4.17.20/lodash.min.js"></script>
app.component('save-button', {
  created() {
    // 用 Lodash 的防抖函数
    this.debouncedClick = _.debounce(this.click, 500)
  },
  unmounted() {
    // 移除组件时，取消定时器
    this.debouncedClick.cancel()
  },
  methods: {
    click() {
      // ... 响应点击 ...
    }
  },
  template: `
    <button @click="debouncedClick">
      Save
    </button>
  `
})
```

### 计算属性computed
计算属性是基于它们的响应依赖关系缓存的。
```html
<div id="computed-basics">
  <p>Has published books:</p>
  <span>{{ publishedBooksMessage }}</span>
</div>
```
```js
Vue.createApp({
  data() {
    return {
      author: {
        name: 'John Doe',
        books: [
          'Vue 2 - Advanced Guide',
          'Vue 3 - Basic Guide',
          'Vue 4 - The Mystery'
        ]
      }
    }
  },
  computed: {
    // 计算属性的 getter
    publishedBooksMessage() {
      // `this` 指向 vm 实例
      return this.author.books.length > 0 ? 'Yes' : 'No'
    }
  }
}).mount('#computed-basics')
```

计算属性默认只有 `getter`，不过在需要时你也可以提供一个 `setter`, 下面例子中运行 `vm.fullName = 'John Doe'` 时，`setter` 会被调用，`vm.firstName` 和 `vm.lastName` 也会相应地被更新。

```js
computed: {
  fullName: {
    // getter
    get() {
      return this.firstName + ' ' + this.lastName
    },
    // setter
    set(newValue) {
      const names = newValue.split(' ')
      this.firstName = names[0]
      this.lastName = names[names.length - 1]
    }
  }
}
```

### 侦听器watch

当需要在数据变化时执行异步或开销较大的操作时，使用侦听器方式比较合适。

示例中，使用 `watch` 选项允许我们执行异步操作 (访问一个 API)，限制我们执行该操作的频率，并在我们得到最终结果前，设置中间状态。这些都是计算属性无法做到的。

```html
<div id="watch-example">
  <p>
    Ask a yes/no question:
    <input v-model="question" />
  </p>
  <p>{{ answer }}</p>
</div>
```
```js
<script src="https://cdn.jsdelivr.net/npm/axios@0.12.0/dist/axios.min.js"></script>
<script>
  const watchExampleVM = Vue.createApp({
    data() {
      return {
        question: '',
        answer: 'Questions usually contain a question mark. ;-)'
      }
    },
    watch: {
      // whenever question changes, this function will run
      question(newQuestion, oldQuestion) {
        if (newQuestion.indexOf('?') > -1) {
          this.getAnswer()
        }
      }
    },
    methods: {
      getAnswer() {
        this.answer = 'Thinking...'
        axios
          .get('https://yesno.wtf/api')
          .then(response => {
            this.answer = response.data.answer
          })
          .catch(error => {
            this.answer = 'Error! Could not reach the API. ' + error
          })
      }
    }
  }).mount('#watch-example')
</script>
```


## 生命周期

![1](http://cdn.go99.top/docs/code/web/vue/lifecycle.svg)

## 组件

### 组件组册

全局注册：`app.component('my-component-name')`

局部注册：`const ComponentB = { components: { 'component-a': ComponentA } }`
```js
import ComponentA from './ComponentA'
import ComponentC from './ComponentC'

export default {
  components: {
    ComponentA,
    ComponentC
  }
  // ...
}
```

> 注意：在HTML则是横线字符分割（post-title）, 在JavaScript中的驼峰（postTitle）

### 基础示例

```html
<div id="todo-list-app">
  <ol :style="{ fontSize: postFontSize + 'em' }">
     <!--
      现在我们为每个 todo-item 提供 todo 对象
      todo 对象是变量，即其内容可以是动态的。
      我们也需要为每个组件提供一个“key”，稍后再
      作详细解释。
    -->
    <todo-item
      v-for="item in groceryList"
      v-bind:todo="item"
      v-bind:key="item.id"
      @enlarge-text="onEnlargeText"
    ></todo-item>
  </ol>
</div>
```
```js
const TodoList = {
  data() {
    return {
      groceryList: [
        { id: 0, text: 'Vegetables' },
        { id: 1, text: 'Cheese' },
        { id: 2, text: 'Whatever else humans are supposed to eat' }
      ],
      postFontSize: 1
    }
  }
  methods: {
    onEnlargeText(enlargeAmount) {
      this.postFontSize += enlargeAmount
    }
  }
}

const app = Vue.createApp(TodoList)

app.component('todo-item', {
  props: ['todo'],
  emits: ['enlargeText'],
  template: `
  <li>{{ todo.text }}</li>
  <button @click="$emit('enlargeText', 0.1)">
    Enlarge text
  </button>
  `
})

app.mount('#todo-list-app')
```
### 组件传参数prop

```js
// 数组形式
props: ['title', 'likes', 'isPublished', 'commentIds', 'author']

// 对象形式
app.component('my-component', {
  props: {
    // 基础的类型检查 (`null` 和 `undefined` 会通过任何类型验证)
    propA: Number,
    // 多个可能的类型
    propB: [String, Number],
    // 必填的字符串
    propC: {
      type: String,
      required: true
    },
    // 带有默认值的数字
    propD: {
      type: Number,
      default: 100
    },
    // 带有默认值的对象
    propE: {
      type: Object,
      // 对象或数组默认值必须从一个工厂函数获取
      default() {
        return { message: 'hello' }
      }
    },
    // 自定义验证函数
    propF: {
      validator(value) {
        // 这个值必须匹配下列字符串中的一个
        return ['success', 'warning', 'danger'].includes(value)
      }
    },
    // 具有默认值的函数
    propG: {
      type: Function,
      // 与对象或数组默认值不同，这不是一个工厂函数 —— 这是一个用作默认值的函数
      default() {
        return 'Default function'
      }
    }
  }
})
```

* 传入一个对象的所有 property（看起来有点像传入一个props对象的语法糖）

```js
post: {
  id: 1,
  title: 'My Journey with Vue'
}
```
```html
<blog-post v-bind="post"></blog-post>
<!--等价于-->
<blog-post v-bind:id="post.id" v-bind:title="post.title"></blog-post>
```

* prop 用来传递一个初始值；这个子组件接下来希望将其作为一个本地的 prop 数据来使用

```js
props: ['initialCounter'],
data() {
  return {
    counter: this.initialCounter
  }
}
```

* prop 以一种原始的值传入且需要进行转换

```js
props: ['size'],
computed: {
  normalizedSize() {
    return this.size.trim().toLowerCase()
  }
}
```


### 组件自定义事件emits

```js
// 返回一个布尔值以指示事件是否有效
app.component('custom-form', {
  emits: {
    // 没有验证
    click: null,

    // 验证submit 事件
    submit: ({ email, password }) => {
      if (email && password) {
        return true
      } else {
        console.warn('Invalid submit event payload!')
        return false
      }
    }
  },
  methods: {
    submitForm(email, password) {
      this.$emit('submit', { email, password })
    }
  }
})
```
### 非 Prop 的 Attribute

* 单个根节点时,非 prop attribute 将自动添加到根节点的 attribute 中。
```js
app.component('date-picker', {
  template: `
    <div class="date-picker">
      <input type="datetime-local" />
    </div>
  `
})
```
```html
<!-- 具有非prop attribute的Date-picker组件-->
<date-picker data-status="activated"></date-picker>

<!-- 渲染 date-picker 组件 -->
<div class="date-picker" data-status="activated">
  <input type="datetime-local" />
</div>
```
* 事件监听器
```js
app.component('date-picker', {
  template: `
    <select>
      <option value="1">Yesterday</option>
      <option value="2">Today</option>
      <option value="3">Tomorrow</option>
    </select>
  `
})
```
```html
<div id="date-picker" class="demo">
  <date-picker @change="showChange"></date-picker>
</div>
```
```js
const app = Vue.createApp({
  methods: {
    showChange(event) {
      console.log(event.target.value) // 将记录所选选项的值
    }
  }
})
```
* 禁用 Attribute 继承

通过将 `inheritAttrs` 选项设置为 `false`，你可以访问组件的 `$attrs` property，该 property 包括组件 `props` 和 `emits` property 中未包含的所有属性 (例如，`class、style、v-on` 监听器等)。

```js
app.component('date-picker', {
  // 设置这个参数金庸
  inheritAttrs: false, 
  // 将所有 attribute 将应用于 input 元素
  template: `
    <div class="date-picker">
      <input type="datetime-local" v-bind="$attrs" />
    </div>
  `
})
```
* 多个根结点必须指定 `$attrs`

```js
// 这将发出警告
app.component('custom-layout', {
  template: `
    <header>...</header>
    <main>...</main>
    <footer>...</footer>
  `
})

// 没有警告，$attrs被传递到<main>元素
app.component('custom-layout', {
  template: `
    <header>...</header>
    <main v-bind="$attrs">...</main>
    <footer>...</footer>
  `
})
```

### 自定义组件v-model

* 原始组件使用
```html
<custom-input
  :model-value="searchText"
  @update:model-value="searchText = $event"
></custom-input>
```
* 组件改造
```js
app.component('custom-input', {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: `
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    >
  `
})
```
* 改造之后直接使用v-model
```html
<custom-input v-model="searchText"></custom-input>
```
* 使用计算属性 computed 实现 v-model
```js
app.component('custom-input', {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: `
    <input v-model="value">
  `,
  computed: {
    value: {
      get() {
        return this.modelValue
      },
      set(value) { 
        this.$emit('update:modelValue', value)
      }
    }
  }
})
```

* 多个v-model

```html
<user-name
  v-model:first-name="firstName"
  v-model:last-name="lastName"
></user-name>
```
```js
app.component('user-name', {
  props: {
    firstName: String,
    lastName: String
  },
  emits: ['update:firstName', 'update:lastName'],
  template: `
    <input 
      type="text"
      :value="firstName"
      @input="$emit('update:firstName', $event.target.value)">

    <input
      type="text"
      :value="lastName"
      @input="$emit('update:lastName', $event.target.value)">
  `
})
```

* v-model修饰符

组件的 `created` 生命周期钩子触发时，`modelModifiers prop` 会包含 `capitalize`，且其值为 `true`。
```html
<div id="app">
  <my-component v-model.capitalize="myText"></my-component>
  {{ myText }}
</div>
```
```js
const app = Vue.createApp({
  data() {
    return {
      myText: ''
    }
  }
})

app.component('my-component', {
  props: {
    modelValue: String,
    modelModifiers: {
      default: () => ({})
    }
  },
  emits: ['update:modelValue'],
  methods: {
    emitValue(e) {
      let value = e.target.value
      if (this.modelModifiers.capitalize) {
        value = value.charAt(0).toUpperCase() + value.slice(1)
      }
      this.$emit('update:modelValue', value)
    }
  },
  template: `<input
    type="text"
    :value="modelValue"
    @input="emitValue">`
})

app.mount('#app')
```

带参数的 `v-model` 绑定，生成的 prop 名称将为 `arg + "Modifiers"`

```html
<my-component v-model:description.capitalize="myText"></my-component>
```
```js
app.component('my-component', {
  props: ['description', 'descriptionModifiers'],
  emits: ['update:description'],
  template: `
    <input type="text"
      :value="description"
      @input="$emit('update:description', $event.target.value)">
  `,
  created() {
    console.log(this.descriptionModifiers) // { capitalize: true }
  }
})
```

### 组件插槽slot

```html
<button type="submit">
  <slot>Submit</slot>
</button>

<submit-button></submit-button>
<!--渲染结果-->
<button type="submit">
  Submit
</button>

<submit-button>
  Save
</submit-button>
<!--渲染结果-->
<button type="submit">
  Save
</button>
```

* 具名插槽

```html
<div class="container">
  <header>
    <slot name="header"></slot>
  </header>
  <main>
    <slot></slot>
  </main>
  <footer>
    <slot name="footer"></slot>
  </footer>
</div>
```
* `v-slot` 只能添加在 `<template>` 上
```html
<base-layout>
  <template v-slot:header>
    <h1>Here might be a page title</h1>
  </template>

  <template v-slot:default>
    <p>A paragraph for the main content.</p>
    <p>And another one.</p>
  </template>

  <template v-slot:footer>
    <p>Here's some contact info</p>
  </template>
</base-layout>

<!--缩写 #-->
<base-layout>
  <template #header>
    <h1>Here might be a page title</h1>
  </template>

  <template #default>
    <p>A paragraph for the main content.</p>
    <p>And another one.</p>
  </template>

  <template #footer>
    <p>Here's some contact info</p>
  </template>
</base-layout>
```
* 作用域插槽（和props的传入一个对象的所有 property有点类似）

```html
<todo-list>
  <template v-slot:default="slotProps">
    <i class="fas fa-check"></i>
    <span class="green">{{ slotProps.item }}</span>
  </template>
</todo-list>
```



### 深层组件数据传递 Provide/Inject

`provide/inject` 绑定并不是响应式的，我们可以通过传递一个 `ref property` 或 `reactive` 对象给 `provide` 来改变这种行为,如果 `provide` 的是一个对象或者数组，可以不用通过计算属性就可以将改动反应到子组件
```js
app.component('todo-list', {
  // ...
  provide() {
    return {
      todoLength: Vue.computed(() => this.todos.length)
    }
  }
})

app.component('todo-list-statistics', {
  inject: ['todoLength'],
  created() {
    console.log(`Injected property: ${this.todoLength.value}`) // > Injected property: 5
  }
})
```
### 动态组件 & 异步组件

* 动态组件
```html
<div id="dynamic-component-demo" class="demo">
  <button
     v-for="tab in tabs"
     v-bind:key="tab"
     v-bind:class="['tab-button', { active: currentTab === tab }]"
     v-on:click="currentTab = tab"
   >
    {{ tab }}
  </button>
  <!-- 失活的组件将会被缓存！-->
  <keep-alive>
    <component v-bind:is="currentTabComponent" class="tab"></component>
  </keep-alive>
</div>
```
```js
const app = Vue.createApp({
  data() {
    return {
      currentTab: 'Home',
      tabs: ['Home', 'Posts', 'Archive']
    }
  },
  computed: {
    currentTabComponent() {
      return 'tab-' + this.currentTab.toLowerCase()
    }
  }
})

app.component('tab-home', {
  template: `<div class="demo-tab">Home component</div>`
})
app.component('tab-posts', {
  template: `<div class="demo-tab">Posts component</div>`
})
app.component('tab-archive', {
  template: `<div class="demo-tab">Archive component</div>`
})

app.mount('#dynamic-component-demo')
```

* 异步组件

```js
// 全局组册
const { createApp, defineAsyncComponent } = Vue

const app = createApp({})

const AsyncComp = defineAsyncComponent(
  () =>
    new Promise((resolve, reject) => {
      resolve({
        template: '<div>I am async!</div>'
      })
    })
)

app.component('async-example', AsyncComp)

// 动态导入
import { defineAsyncComponent } from 'vue'

const AsyncComp = defineAsyncComponent(() =>
  import('./components/AsyncComponent.vue')
)

app.component('async-component', AsyncComp)

// 局部注册
import { createApp, defineAsyncComponent } from 'vue'

createApp({
  // ...
  components: {
    AsyncComponent: defineAsyncComponent(() =>
      import('./components/AsyncComponent.vue')
    )
  }
})
```

### 模版引用refs
避免在模板或计算属性中访问 `$refs`（尽量不要使用）。
```js
const app = Vue.createApp({})

app.component('base-input', {
  template: `
    <input ref="input" />
  `,
  methods: {
    focusInput() {
      this.$refs.input.focus()
    }
  },
  mounted() {
    this.focusInput()
  }
})

// 可以向组件本身添加另一个 ref，并使用它从父组件触发 focusInput 事件
<base-input ref="usernameInput"></base-input>
this.$refs.usernameInput.focusInput()
```
### 解析 DOM 模板时的注意事项

错误示例

```html
<table>
  <blog-post-row></blog-post-row>
</table>
```
这个自定义组件 `<blog-post-row>` 会被作为无效的内容提升到外部，并导致最终渲染结果出错。我们可以使用特殊的 `is attribute` 作为一个变通的办法：

```html
<table>
  <tr is="vue:blog-post-row"></tr>
</table>
```

## 过渡 & 动画
最常用的 `过渡` 是 `out-in` 和 `in-out`。
```html
<transition name="fade" mode="out-in">
  <!-- ... the buttons ... -->
</transition>
```

数字更新例子：

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.2.4/gsap.min.js"></script>

<div id="animated-number-demo">
  <input v-model.number="number" type="number" step="20" />
  <p>{{ animatedNumber }}</p>
</div>
```
```js
const Demo = {
  data() {
    return {
      number: 0,
      tweenedNumber: 0
    }
  },
  computed: {
    animatedNumber() {
      return this.tweenedNumber.toFixed(0)
    }
  },
  watch: {
    number(newValue) {
      gsap.to(this.$data, { duration: 0.5, tweenedNumber: newValue })
    }
  }
}

Vue.createApp(Demo).mount('#animated-number-demo')
```

## 组合式API
### 常规组件组合式api

* 将所有自定义组件的逻辑关注点分离到单独的文件中，其他组件只需要在 `setup` 中使用即可。 只能接收 `props`,`context`两个参数。

* 如果需要解构 `prop`，可以在 `setup` 函数中使用 `toRefs` 函数来完成此操作

* 在 `setup()` 内部，`this` 不是该活跃实例的引用

用户仓库列表
```js
// src/composables/useUserRepositories.js

import { fetchUserRepositories } from '@/api/repositories'
import { ref, onMounted, watch } from 'vue'

export default function useUserRepositories(user) {
  const repositories = ref([])
  const getUserRepositories = async () => {
    repositories.value = await fetchUserRepositories(user.value)
  }

  onMounted(getUserRepositories)
  watch(user, getUserRepositories)

  return {
    repositories,
    getUserRepositories
  }
}
```
搜索功能
```js
// src/composables/useRepositoryNameSearch.js

import { ref, computed } from 'vue'

export default function useRepositoryNameSearch(repositories) {
  const searchQuery = ref('')
  const repositoriesMatchingSearchQuery = computed(() => {
    return repositories.value.filter(repository => {
      return repository.name.includes(searchQuery.value)
    })
  })

  return {
    searchQuery,
    repositoriesMatchingSearchQuery
  }
}
```
组合使用
```js
// src/components/UserRepositories.vue
import useUserRepositories from '@/composables/useUserRepositories'
import useRepositoryNameSearch from '@/composables/useRepositoryNameSearch'
import { toRefs } from 'vue'

export default {
  components: { RepositoriesFilters, RepositoriesSortBy, RepositoriesList },
  props: {
    user: {
      type: String,
      required: true
    }
  },
  setup (props) {
    const { user } = toRefs(props)
    // 可选的 prop，则传入的 props 中可能没有,这种情况下，toRefs 将不会为 title 创建一个 ref 。你需要使用 toRef 替代它
    // const title = toRef(props, 'title')

    const { repositories, getUserRepositories } = useUserRepositories(user)

    const {
      searchQuery,
      repositoriesMatchingSearchQuery
    } = useRepositoryNameSearch(repositories)

    return {
      // 因为我们并不关心未经过滤的仓库
      // 我们可以在 `repositories` 名称下暴露过滤后的结果
      repositories: repositoriesMatchingSearchQuery,
      getUserRepositories,
      searchQuery,
    }
  },
  data () {
    return {
      filters: { ... }, // 3
    }
  },
  computed: {
    filteredRepositories () { ... }, // 3
  },
  methods: {
    updateFilters () { ... }, // 3
  }
}
```

### 组合式api Provide / Inject

* 建议尽可能将对响应式 `property` 的所有修改限制在定义 `provide` 的组件内部。

* 要确保通过 `provide` 传递的数据不会被 `inject` 的组件更改，我们建议对提供者的 `property` 使用 `readonly`。

例如，在需要更改用户位置的情况下，我们最好在 `MyMap` 组件中执行此操作。

```html
<!-- src/components/MyMap.vue -->
<template>
  <MyMarker />
</template>

<script>
import { provide, reactive, ref } from 'vue'
import MyMarker from './MyMarker.vue'

export default {
  components: {
    MyMarker
  },
  setup() {
    const location = ref('North Pole')
    const geolocation = reactive({
      longitude: 90,
      latitude: 135
    })

    provide('location', location)
    provide('geolocation', geolocation)

    return {
      location
    }
  },
  methods: {
    updateLocation() {
      this.location = 'South Pole'
    }
  }
}
</script>
```
然而，有时我们需要在注入数据的组件内部更新 `inject` 的数据。在这种情况下，我们建议 `provide` 一个方法来负责改变响应式 property。

```html
<!-- src/components/MyMap.vue -->
<template>
  <MyMarker />
</template>

<script>
import { provide, reactive, readonly, ref } from 'vue'
import MyMarker from './MyMarker.vue'

export default {
  components: {
    MyMarker
  },
  setup() {
    const location = ref('North Pole')
    const geolocation = reactive({
      longitude: 90,
      latitude: 135
    })

    const updateLocation = () => {
      location.value = 'South Pole'
    }

    provide('location', readonly(location))
    provide('geolocation', readonly(geolocation))
    provide('updateLocation', updateLocation)
  }
}
</script>
```
```html
<!-- src/components/MyMarker.vue -->
<script>
import { inject } from 'vue'

export default {
  setup() {
    const userLocation = inject('location', 'The Universe')
    const userGeolocation = inject('geolocation')
    const updateUserLocation = inject('updateLocation')

    return {
      userLocation,
      userGeolocation,
      updateUserLocation
    }
  }
}
</script>
```


## Mixin

**一般建议使用常规的组合式api替代mixin**

* 每个 `mixin` 可以拥有自己的 `data` 函数。每个 `data` 函数都会被调用，并将返回结果合并。在数据的 `property` 发生冲突时，会以组件自身的数据为优先。
```js
const myMixin = {
  data() {
    return {
      message: 'hello',
      foo: 'abc'
    }
  }
}

const app = Vue.createApp({
  mixins: [myMixin],
  data() {
    return {
      message: 'goodbye',
      bar: 'def'
    }
  },
  created() {
    console.log(this.$data) // => { message: "goodbye", foo: "abc", bar: "def" }
  }
})
```
* 同名钩子函数将合并为一个数组，因此都将被调用。另外，`mixin` 对象的钩子将在组件自身钩子之前调用。
```js
const myMixin = {
  created() {
    console.log('mixin 对象的钩子被调用')
  }
}

const app = Vue.createApp({
  mixins: [myMixin],
  created() {
    console.log('组件钩子被调用')
  }
})

// => "mixin 对象的钩子被调用"
// => "组件钩子被调用"
```
* 值为对象的选项，例如 `methods`、`components` 和 `directives`，将被合并为同一个对象。两个对象键名冲突时，取组件对象的键值对。
```js
const myMixin = {
  methods: {
    foo() {
      console.log('foo')
    },
    conflicting() {
      console.log('from mixin')
    }
  }
}

const app = Vue.createApp({
  mixins: [myMixin],
  methods: {
    bar() {
      console.log('bar')
    },
    conflicting() {
      console.log('from self')
    }
  }
})

const vm = app.mount('#mixins-basic')

vm.foo() // => "foo"
vm.bar() // => "bar"
vm.conflicting() // => "from self"
```
* 全局注册（不建议使用）
```js
const app = Vue.createApp({
  myOption: 'hello!'
})

// 为自定义的选项 'myOption' 注入一个处理器。
app.mixin({
  created() {
    const myOption = this.$options.myOption
    if (myOption) {
      console.log(myOption)
    }
  }
})
```

### 组件自定义指令

```html
<div id="dynamicexample">
  <h3>Scroll down inside this section ↓</h3>
  <p v-pin:[direction]="200">I am pinned onto the page at 200px to the left.</p>
</div>
```
```js
const app = Vue.createApp({
  data() {
    return {
      direction: 'right'
    }
  }
})

app.directive('pin', {
  mounted(el, binding) {
    el.style.position = 'fixed'
    // binding.arg 是我们传递给指令的参数
    const s = binding.arg || 'top'
    el.style[s] = binding.value + 'px'
  }
})

app.mount('#dynamic-arguments-example')
```
### teleport

(感觉不常用)`Teleport` 提供了一种干净的方法，允许我们控制在 DOM 中哪个父节点下渲染了 HTML，而不必求助于全局状态或将其拆分为两个组件。

这种情况下，即使在不同的地方渲染 `child-component`，它仍将是 `parent-component` 的子级，并将从中接收 `name` prop。
```js
const app = Vue.createApp({
  template: `
    <h1>Root instance</h1>
    <parent-component />
  `
})

app.component('parent-component', {
  template: `
    <h2>This is a parent component</h2>
    <teleport to="#endofbody">
      <child-component name="John" />
    </teleport>
  `
})

app.component('child-component', {
  props: ['name'],
  template: `
    <div>Hello, {{ name }}</div>
  `
})
```

### 渲染函数

```js
const { createApp, h } = Vue

const app = createApp({})

app.component('anchored-heading', {
  render() {
    return h(
      'h' + this.level, // 标签名
      {}, // prop 或 attribute
      this.$slots.default() // 包含其子节点的数组
    )
  },
  props: {
    level: {
      type: Number,
      required: true
    }
  }
})
```
* `h()` 函数定义
```js
// @returns {VNode}
h(
  // {String | Object | Function} tag
  // 一个 HTML 标签名、一个组件、一个异步组件、或
  // 一个函数式组件。
  //
  // 必需的。
  'div',

  // {Object} props
  // 与 attribute、prop 和事件相对应的对象。
  // 这会在模板中用到。
  //
  // 可选的。
  {},

  // {String | Array | Object} children
  // 子 VNodes, 使用 `h()` 构建,
  // 或使用字符串获取 "文本 VNode" 或者
  // 有插槽的对象。
  //
  // 可选的。
  [
    'Some text comes first.',
    h('h1', 'A headline'),
    h(MyComponent, {
      someProp: 'foobar'
    })
  ]
)
```

* v-if 和 v-for

```html
<ul v-if="items.length">
  <li v-for="item in items">{{ item.name }}</li>
</ul>
<p v-else>No items found.</p>
```
```js
props: ['items'],
render() {
  if (this.items.length) {
    return h('ul', this.items.map((item) => {
      return h('li', item.name)
    }))
  } else {
    return h('p', 'No items found.')
  }
}
```
* v-model

```js
props: ['modelValue'],
emits: ['update:modelValue'],
render() {
  return h(SomeComponent, {
    modelValue: this.modelValue,
    'onUpdate:modelValue': value => this.$emit('update:modelValue', value)
  })
}
```

* v-on

```js
render() {
  return h('div', {
    onClick: $event => console.log('clicked', $event.target)
  })
}
```

* jsx

```js
import AnchoredHeading from './AnchoredHeading.vue'

const app = createApp({
  render() {
    return (
      <AnchoredHeading level={1}>
        <span>Hello</span> world!
      </AnchoredHeading>
    )
  }
})

app.mount('#demo')
```

### 插件

定义插件
```js
// plugins/i18n.js
export default {
  install: (app, options) => {
    app.config.globalProperties.$translate = (key) => {
      return key.split('.')
        .reduce((o, i) => { if (o) return o[i] }, options)
    }

    app.provide('i18n', options)

    app.directive('my-directive', {
      mounted (el, binding, vnode, oldVnode) {
        // some logic ...
      }
      ...
    })

    app.mixin({
      created() {
        // some logic ...
      }
      ...
    })
  }
}
```
使用插件
```js
import { createApp } from 'vue'
import Root from './App.vue'
import i18nPlugin from './plugins/i18n'

const app = createApp(Root)
const i18nStrings = {
  greetings: {
    hi: 'Hallo!'
  }
}

app.use(i18nPlugin, i18nStrings)
app.mount('#app')
```

## TS相关配置

```ts
<script lang="ts">
import { defineComponent } from 'vue'
interface Book {
  title: string
  author: string
  year: number
}
interface Book {
  title: string
  year?: number
}
export default defineComponent({
  setup() {
    const year = ref<string | number>('2020') // year's type: Ref<string | number>
    year.value = 2020 // ok!
    const book = reactive<Book>({ title: 'Vue 3 Guide' })
    // or
    const book: Book = reactive({ title: 'Vue 3 Guide' })
    // or
    const book = reactive({ title: 'Vue 3 Guide' }) as Book
  }
  data() {
    return {
      book: {
        title: 'Vue 3 Guide',
        author: 'Vue Team',
        year: 2020
      } as Book
    }
  }
})
</script>
```

### 全局定义

```ts
// 用户定义
import axios from 'axios'
const app = Vue.createApp({})
app.config.globalProperties.$http = axios
// 验证数据的插件
export default {
  install(app, options) {
    app.config.globalProperties.$validate = (data: object, rule: object) => {
      // 检查对象是否合规
    }
  }
}
```

(建议)也可以统一到一个ts文件配置全局定义

```ts
import axios from 'axios'
declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $http: typeof axios
    $validate: (data: object, rule: object) => boolean
  }
}
```

## 路由v-router
### 安装
```bash
npm install vue-router@4
```
### 路由导航-常规
```html
<div id="app">
  <p>
    <!--使用 router-link 组件进行导航 -->
    <!--通过传递 `to` 来指定链接 -->
    <!--`<router-link>` 将呈现一个带有正确 `href` 属性的 `<a>` 标签-->
    <router-link to="/">Go to Home</router-link>
    <router-link to="/about">Go to About</router-link>
  </p>
  <!-- 路由出口 -->
  <!-- 路由匹配到的组件将渲染在这里 -->
  <router-view></router-view>
</div>
```

### 路由导航-编程式

```js
// Home.vue
export default {
  methods: {
    goToDashboard() {
      if (isAuthenticated) {
        this.$router.push('/dashboard')
      } else {
        this.$router.push('/login')
        // 带有路径的对象
        router.push({ path: '/users/eduardo' })
        const username = 'eduardo'
        // 我们可以手动建立 url，但我们必须自己处理编码
        router.push(`/user/${username}`) // -> /user/eduardo
        // 同样
        router.push({ path: `/user/${username}` }) // -> /user/eduardo
        // 命名的路由，并加上参数，让路由建立 url
        router.push({ name: 'user', params: { username: 'eduardo' } })
        // 如果提供了 path，params 会被忽略
        // 带查询参数，结果是 /register?plan=private
        router.push({ path: '/register', query: { plan: 'private' } })
        // 带 hash，结果是 /about#team
        router.push({ path: '/about', hash: '#team' })
        /////导航时不会向 history 添加新记录
        router.push({ path: '/home', replace: true })
        // 相当于
        router.replace({ path: '/home' })

        ///// 向前移动一条记录，与 router.forward() 相同
        router.go(1)
        // 返回一条记录，与router.back() 相同
        router.go(-1)
        // 前进 3 条记录
        router.go(3)
        // 如果没有那么多记录，静默失败
        router.go(-100)
        router.go(100)
      }
    },
  },
}
```

### 路由定义-动态（带参数）
```js
//// 常规例子
const User = {
  props: ['id'],
  template: '<div>User {{ id }}</div>'
}
const routes = [{ path: '/user/:id', component: User, props: true }]

// 多组件
const routes = [
  {
    path: '/user/:id',
    components: { default: User, sidebar: Sidebar },
    props: { default: true, sidebar: false }
  }
]

// 这些都会传递给 `createRouter`
const routes = [
  // 动态段以冒号开始
  { path: '/users/:id', component: User },
  // 匹配 /users 和 /users/posva
  { path: '/users/:userId?' },
]

//// 捕获所有路由或 404 Not found 路由
const routes = [
  // 将匹配所有内容并将其放在 `$route.params.pathMatch` 下
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
  // 将匹配以 `/user-` 开头的所有内容，并将其放在 `$route.params.afterUser` 下
  { path: '/user-:afterUser(.*)', component: UserGeneric },
  // 匹配 /users 和 /users/42
  { path: '/users/:userId(\\d+)?' },
]

// URL /search?q=vue 将传递 {query: 'vue'} 作为 props 传给 SearchUser 组件
const routes = [
  {
    path: '/search',
    component: SearchUser,
    props: route => ({ query: route.query.q })
  }
]
```
### 路由定义-嵌套
```js
const routes = [
  {
    path: '/user/:id',
    component: User,
    children: [
      {
        // 当 /user/:id/profile 匹配成功 
        // UserProfile 将被渲染到 User 的 <router-view> 内部
        path: 'profile',
        component: UserProfile,
      },
      {
        // 当 /user/:id/posts 匹配成功
        // UserPosts 将被渲染到 User 的 <router-view> 内部
        path: 'posts',
        component: UserPosts,
      },
    ],
  },
]
```

### 路由定义-多视图

```html
<router-view class="view left-sidebar" name="LeftSidebar"></router-view>
<router-view class="view main-content"></router-view>
<router-view class="view right-sidebar" name="RightSidebar"></router-view>
```
```js
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      // 多个视图就需要多个组件这里的参数是复数
      components: {
        default: Home,
        // LeftSidebar: LeftSidebar 的缩写
        LeftSidebar,
        // 它们与 `<router-view>` 上的 `name` 属性匹配
        RightSidebar,
      },
    },
  ],
})
```
嵌套多视图
```html
<!-- UserSettings.vue -->
<div>
  <h1>User Settings</h1>
  <NavBar />
  <router-view />
  <router-view name="helper" />
</div>
```
```js
{
  path: '/settings',
  // 你也可以在顶级路由就配置命名视图
  component: UserSettings,
  children: [{
    path: 'emails',
    component: UserEmailsSubscriptions
  }, {
    path: 'profile',
    components: {
      default: UserProfile,
      helper: UserProfilePreview
    }
  }]
}
```
### 路由定义-重定向
```js
// redirect 的时候，可以省略 component 配置，因为它从来没有被直接访问过，所以没有组件要渲染。
const routes = [{ path: '/home', redirect: '/' }]
// 重定向的目标也可以是一个命名的路由
const routes = [{ path: '/home', redirect: { name: 'homepage' } }]
const routes = [
  {
    // /search/screens -> /search?q=screens
    path: '/search/:searchText',
    redirect: to => {
      // 方法接收目标路由作为参数
      // return 重定向的字符串路径/路径对象
      return { path: '/search', query: { q: to.params.searchText } }
    },
  },
  {
    path: '/search',
    // ...
  },
]
```
### 路由定义-别名
```js
// 将 / 别名为 /home，意味着当用户访问 /home 时，URL 仍然是 /home，但会被匹配为用户正在访问 /。
const routes = [{ path: '/', component: Homepage, alias: '/home' }]
//
const routes = [
  {
    path: '/users',
    component: UsersLayout,
    children: [
      // 为这 3 个 URL 呈现 UserList
      // - /users
      // - /users/list
      // - /people
      { path: '', component: UserList, alias: ['/people', 'list'] },
    ],
  },
]
```
### 路由模式定义（hash、history）
```js
// Hash
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    //...
  ],
})

// History
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    //...
  ],
})
// History模式对应的nginx配置
location / {
  try_files $uri $uri/ /index.html;
}
```
### 导航守卫
完整流程：

1. 导航被触发。
1. 在失活的组件里调用 `beforeRouteLeave` 守卫。
1. 调用全局的 `beforeEach` 守卫。
1. 在重用的组件里调用 `beforeRouteUpdate` 守卫(2.2+)。
1. 在路由配置里调用 `beforeEnter`。
1. 解析异步路由组件。
1. 在被激活的组件里调用 `beforeRouteEnter`。
1. 调用全局的 `beforeResolve` 守卫(2.5+)。
1. 导航被确认。
1. 调用全局的 `afterEach` 钩子。
1. 触发 DOM 更新。
1. 调用 `beforeRouteEnter` 守卫中传给 `next` 的回调函数，创建好的组件实例会作为回调函数的参数传入。

```html
<router-view v-slot="{ Component, route }">
  <!-- 使用任何自定义过渡和回退到 `fade` -->
  <transition :name="route.meta.transition || 'fade'">
    <component :is="Component" />
  </transition>
</router-view>
```
```js
// 这样做就是懒加载
const UserDetails = () => import('./views/UserDetails')
// 把组件按组分块
const UserDetails = () =>
  import(/* webpackChunkName: "group-user" */ './UserDetails.vue')
// 全局前置守卫
const routes = [
  {
    path: '/users/:id',
    component: UserDetails,
    // 只有经过身份验证的用户才能创建帖子
    meta: { requiresAuth: true, transition: 'slide-right' }
    beforeEnter: (to, from) => {
      // reject the navigation
      return false
    },
  },
]
/// beforeEnter也接受数组形式
function removeQueryParams(to) {
  if (Object.keys(to.query).length)
    return { path: to.path, query: {}, hash: to.hash }
}

function removeHash(to) {
  if (to.hash) return { path: to.path, query: to.query, hash: '' }
}

const routes = [
  {
    path: '/users/:id',
    component: UserDetails,
    beforeEnter: [removeQueryParams, removeHash],
  },
  {
    path: '/about',
    component: UserDetails,
    beforeEnter: [removeQueryParams],
  },
]

//// 使用
router.beforeEach((to, from) => {
  // 而不是去检查每条路由记录
  // to.matched.some(record => record.meta.requiresAuth)
  if (to.meta.requiresAuth && !auth.isLoggedIn()) {
    // 此路由需要授权，请检查是否已登录
    // 如果没有，则重定向到登录页面
    return {
      path: '/login',
      // 保存我们所在的位置，以便以后再来
      query: { redirect: to.fullPath },
    }
  }
})
// 异步
router.beforeEach(async (to, from) => {
  // canUserAccess() 返回 `true` 或 `false`
  return await canUserAccess(to)
})
// 登录示例（但是不推荐用next，因为没有必要）
// GOOD
router.beforeEach((to, from, next) => {
  if (to.name !== 'Login' && !isAuthenticated) next({ name: 'Login' })
  else next()
})
```
## 状态管理v-strore

### 安装

```bash
# npm安装
npm install vuex@next --save
# yarn
yarn add vuex@next --save
# cdn
https://unpkg.com/vuex@4.0.0/dist/vuex.global.js
```

### 实例

```js
import { createApp } from 'vue'
import { createStore } from 'vuex'

// 创建一个新的 store 实例
const store = createStore({
  state () {
    return {
      count: 0
    }
  },
  mutations: {
    increment (state) {
      state.count++
    }
  }
})

const app = createApp({ /* 根组件 */ })

// 将 store 实例作为插件安装
app.use(store)

///// 使用
methods: {
  increment() {
    this.$store.commit('increment')
    console.log(this.$store.state.count)
  }
}
computed: mapState({
  // 映射 this.count 为 store.state.count
  'count'
  // 箭头函数可使代码更简练
  count: state => state.count,
  // 传字符串参数 'count' 等同于 `state => state.count`
  countAlias: 'count',
  // 为了能够使用 `this` 获取局部状态，必须使用常规函数
  countPlusLocalState (state) {
    return state.count + this.localCount
  }
})
```
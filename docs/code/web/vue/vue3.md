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
props: {
  title: String,
  likes: Number,
  isPublished: Boolean,
  commentIds: Array,
  author: Object,
  callback: Function,
  contactsPromise: Promise // 或任何其他构造函数
}
```

### 自定义组件v-model

原始组件使用
```html
<custom-input
  :model-value="searchText"
  @update:model-value="searchText = $event"
></custom-input>
```
组件改造
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
改造之后直接使用v-model
```html
<custom-input v-model="searchText"></custom-input>
```
使用计算属性 computed 实现 v-model
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

### 组件插槽slot

```js
app.component('alert-box', {
  template: `
    <div class="demo-alert-box">
      <strong>Error!</strong>
      <slot></slot>
    </div>
  `
})
```

### 动态组件

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

  <component v-bind:is="currentTabComponent" class="tab"></component>
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

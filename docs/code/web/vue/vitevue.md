# Vite + Vue3 + Vue-Router4 + TS + Pinia + SCSS + ElementPlus

## 开发工具准备

`VSCode`: 需要安装插件 `Volar`, `Vue3 Snippets`

`Node 12.0.0` 以上 & `Npm`

## Vite相关

[官网链接](https://cn.vitejs.dev/guide/#overview)

### Vite项目创建

```bash
yarn create vite

# 接下去按照提示选择即可, 我选的是 vue，vue-ts

# 安装依赖项
cd yourproject && yarn
# 启动
yarn dev
```

### Vite常用配置

* 安装依赖项

```bash
# gzip压缩
yarn add --dev vite-plugin-compression
```

* 修改 `vite.config.ts`

```ts
import viteCompression from 'vite-plugin-compression'
export default defineConfig({
  plugins: [
    // gzip压缩 生产环境生成 .gz 文件，服务端需要启动gzip压缩
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    }),
  ]
  // 配置代理,一般在开发的时候会有跨域问题，需要配置代理
  server: {
    host: '0.0.0.0',
    port: 18080,
    proxy: {
      // 只要匹配到 xxxx:18080/api 的地址就自动代理到 xxx:9999，并将path中的/api/去掉
      '/api': {
        target: 'http://localhost:9999',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  // 生产环境打包配置，去除 console debugger
  build: {
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
})
```

## 代码风格约束

### ESLint支持

* 安装依赖
```bash
# eslint 安装
yarn add eslint --dev
# eslint 插件安装
yarn add eslint-plugin-vue --dev

yarn add @typescript-eslint/eslint-plugin --dev

yarn add eslint-plugin-prettier --dev

# typescript parser
yarn add @typescript-eslint/parser --dev

#### 如果 eslint 安装报错,执行如下命令
yarn config set ignore-engines true
```

* 项目下新建 `.eslintrc.js`,内容如下

```js
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  parser: 'vue-eslint-parser',
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    // eslint-config-prettier 的缩写
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 12,
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  // eslint-plugin-vue @typescript-eslint/eslint-plugin eslint-plugin-prettier的缩写
  plugins: ['vue', '@typescript-eslint', 'prettier'],
  rules: {
    '@typescript-eslint/ban-ts-ignore': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'no-var': 'error',
    'prettier/prettier': 'error',
    // 禁止出现console
    'no-console': 'warn',
    // 禁用debugger
    'no-debugger': 'warn',
    // 禁止出现重复的 case 标签
    'no-duplicate-case': 'warn',
    // 禁止出现空语句块
    'no-empty': 'warn',
    // 禁止不必要的括号
    'no-extra-parens': 'off',
    // 禁止对 function 声明重新赋值
    'no-func-assign': 'warn',
    // 禁止在 return、throw、continue 和 break 语句之后出现不可达代码
    'no-unreachable': 'warn',
    // 强制所有控制语句使用一致的括号风格
    curly: 'warn',
    // 要求 switch 语句中有 default 分支
    'default-case': 'warn',
    // 强制尽可能地使用点号
    'dot-notation': 'warn',
    // 要求使用 === 和 !==
    eqeqeq: 'warn',
    // 禁止 if 语句中 return 语句之后有 else 块
    'no-else-return': 'warn',
    // 禁止出现空函数
    'no-empty-function': 'warn',
    // 禁用不必要的嵌套块
    'no-lone-blocks': 'warn',
    // 禁止使用多个空格
    'no-multi-spaces': 'warn',
    // 禁止多次声明同一变量
    'no-redeclare': 'warn',
    // 禁止在 return 语句中使用赋值语句
    'no-return-assign': 'warn',
    // 禁用不必要的 return await
    'no-return-await': 'warn',
    // 禁止自我赋值
    'no-self-assign': 'warn',
    // 禁止自身比较
    'no-self-compare': 'warn',
    // 禁止不必要的 catch 子句
    'no-useless-catch': 'warn',
    // 禁止多余的 return 语句
    'no-useless-return': 'warn',
    // 禁止变量声明与外层作用域的变量同名
    'no-shadow': 'off',
    // 允许delete变量
    'no-delete-var': 'off',
    // 强制数组方括号中使用一致的空格
    'array-bracket-spacing': 'warn',
    // 强制在代码块中使用一致的大括号风格
    'brace-style': 'warn',
    // 强制使用骆驼拼写法命名约定
    camelcase: 'warn',
    // 强制使用一致的缩进
    indent: 'off',
    // 强制在 JSX 属性中一致地使用双引号或单引号
    // 'jsx-quotes': 'warn',
    // 强制可嵌套的块的最大深度4
    'max-depth': 'warn',
    // 强制最大行数 300
    // "max-lines": ["warn", { "max": 1200 }],
    // 强制函数最大代码行数 50
    // 'max-lines-per-function': ['warn', { max: 70 }],
    // 强制函数块最多允许的的语句数量20
    'max-statements': ['warn', 100],
    // 强制回调函数最大嵌套深度
    'max-nested-callbacks': ['warn', 3],
    // 强制函数定义中最多允许的参数数量
    'max-params': ['warn', 3],
    // 强制每一行中所允许的最大语句数量
    'max-statements-per-line': ['warn', { max: 1 }],
    // 要求方法链中每个调用都有一个换行符
    'newline-per-chained-call': ['warn', { ignoreChainWithDepth: 3 }],
    // 禁止 if 作为唯一的语句出现在 else 语句中
    'no-lonely-if': 'warn',
    // 禁止空格和 tab 的混合缩进
    'no-mixed-spaces-and-tabs': 'warn',
    // 禁止出现多行空行
    'no-multiple-empty-lines': 'warn',
    // 禁止出现;
    semi: ['warn', 'never'],
    // 强制在块之前使用一致的空格
    'space-before-blocks': 'warn',
    // 强制在 function的左括号之前使用一致的空格
    // 'space-before-function-paren': ['warn', 'never'],
    // 强制在圆括号内使用一致的空格
    'space-in-parens': 'warn',
    // 要求操作符周围有空格
    'space-infix-ops': 'warn',
    // 强制在一元操作符前后使用一致的空格
    'space-unary-ops': 'warn',
    // 强制在注释中 // 或 /* 使用一致的空格
    // "spaced-comment": "warn",
    // 强制在 switch 的冒号左右有空格
    'switch-colon-spacing': 'warn',
    // 强制箭头函数的箭头前后使用一致的空格
    'arrow-spacing': 'warn',
    // eslint-disable-next-line no-dupe-keys
    'no-var': 'warn',
    'prefer-const': 'warn',
    'prefer-rest-params': 'warn',
    'no-useless-escape': 'warn',
    'no-irregular-whitespace': 'warn',
    'no-prototype-builtins': 'warn',
    'no-fallthrough': 'warn',
    'no-extra-boolean-cast': 'warn',
    'no-case-declarations': 'warn',
    'no-async-promise-executor': 'warn',
  },
  globals: {
    defineProps: 'readonly',
    defineEmits: 'readonly',
    defineExpose: 'readonly',
    withDefaults: 'readonly',
  },
}
```

* 添加忽略项 `.eslintignore`

```bash
# eslint 忽略检查 (根据项目需要自行添加)
node_modules
dist
```

### Prettier支持

* 安装依赖

```bash
# 安装 prettier
yarn add prettier --dev
```
* 解决 `eslint` 和 `prettier` 冲突，以 `prettier` 的样式规范为准

```bash
# 安装插件 eslint-config-prettier
yarn add eslint-config-prettier --dev
```
* 项目下新建 `.prettierrc.js`，内容如下:

```js
module.exports = {
  tabWidth: 2,
  jsxSingleQuote: true,
  jsxBracketSameLine: true,
  printWidth: 100,
  singleQuote: true,
  semi: false,
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 200,
      },
    },
  ],
  arrowParens: 'always',
}
```

* 添加忽略项 `.prettierignore`

```bash
# 忽略格式化文件 (根据项目需要自行添加)
node_modules
dist
```

### 修改 package.json 支持格式检查

```json
{
  "script": {
    "lint": "eslint src --fix --ext .ts,.tsx,.vue,.js,.jsx",
    "prettier": "prettier --write ."
  }
}
```

调整完之后，使用如下命令测试 `格式化` 效果:

```bash
# eslint 检查
yarn lint
# prettier 自动格式化
yarn prettier
```

## 配置 husky + lint-staged

> 使用`husky` + `lint-staged`助力团队编码规范, `husky&lint-staged` 安装推荐使用 `mrm`, 它将根据 `package.json` 依赖项中的代码质量工具来安装和配置 `husky` 和 `lint-staged`，因此请确保在此之前安装并配置所有代码质量工具，如 `Prettier` 和 `ESlint`

`husky` 是一个为 `git` 客户端增加 `hook` 的工具。安装后，它会自动在仓库中的 `.git/` 目录下增加相应的钩子；比如 `pre-commit` 钩子就会在你执行 `git commit` 的触发。

那么我们可以在 `pre-commit` 中实现一些比如 `lint` 检查、单元测试、代码美化等操作。当然，`pre-commit` 阶段执行的命令当然要保证其速度不要太慢，每次 `commit` 都等很久也不是什么好的体验。

`lint-staged`，一个仅仅过滤出 `Git` 代码暂存区文件(被 `git add` 的文件)的工具；这个很实用，因为我们如果对整个项目的代码做一个检查，可能耗时很长，如果是老项目，要对之前的代码做一个代码规范检查并修改的话，这可能就麻烦了呀，可能导致项目改动很大。

所以这个 `lint-staged`，对团队项目和开源项目来说，是一个很好的工具，它是对个人要提交的代码的一个规范和约束。

* 安装 `mrm`

```bash
yarn add mrm --dev --registry=https://registry.npm.taobao.org
```

* 安装 `lint-staged`

```bash
# mrm 安装 lint-staged 会自动把 husky 一起安装下来
npx mrm lint-staged
```

* 安装成功后会发现 `package.json` 中多了一下几个配置:

```json
{
  "scripts": {
    // 这里需要注意一下，如果.git文件夹的目录不在前端项目的根目录，那需要调整
    // 先 cd 到 .git 文件夹所在位置，再设置 husky install 到前端项目的.husky目录
    "prepare": "cd .. && husky install front/.husky"
  },
  "devDependencies": {
    "husky": ">=6",
    "lint-staged": ">=10",
    "mrm": "^3.0.10",
  },
  "lint-staged": {
    "*.{ts,tsx,vue,js,jsx}": "eslint --cache --fix"
  }
}
```

* 结合 `prettier` 代码格式化，修改 `package.json` 如下配置

```json
{
  // 增加
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  // 修改
  "lint-staged": {
    "*.{ts,tsx,vue,js,jsx}": [
      "yarn lint",
      "prettier --write",
      "git add"
    ]
  }
}
```

* 配置完成之后，在代码 `git commit` 提交时会自动格式化代码。


## 配置文件引用别名 alias

* 修改 `vite.config.ts`:

```ts
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
}
```

* 修改 `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "esnext",
    // "useDefineForClassFields": true,
    "module": "esnext",
    "moduleResolution": "node",
    "strict": true,
    "jsx": "preserve",
    "sourceMap": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "lib": ["esnext", "dom"],
    "baseUrl": ".",
    "paths": {
      "@/*":["src/*"]
    },
    "types": ["element-plus/global"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

## 配置 css 预处理器 scss

* 安装依赖项

```bash
yarn add dart-sass --dev
yarn add sass --dev
```
* 配置全局 `scss` 样式文件, 在 `src/assets` 下增加 `style` 文件夹，并新建 `main.scss`

```scss
$test-color: red;
```

* 将样式文件`全局`注入`vite`:

```js
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "@/assets/style/main.scss" as *;',
      },
    },
  },
})
```

* 在组件中使用

```scss
.test{
  color: $test-color;
}
```

## 添加路由Vue-Router4

[官网链接](https://next.router.vuejs.org/zh/introduction.html)

* 安装依赖

```bash
# 安装路由
yarn add vue-router@4
```

* 新增 `src/router` 文件夹，在文件夹中新建 `index.ts`,内容如下：

```ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    props: true, // 如果需要在路由中传递props参数需要开启
    component: () => import('@/pages/HelloWorld.vue'),
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/pages/auth.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
```

* 修改 `main.ts` 使用路由

```ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

const app = createApp(App)
app.use(router)
app.use(createPinia())
app.mount('#app')
```

* 路由在 `vue` 文件中的使用

```ts
import { ref } from 'vue'
import apis from '@/https/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const token = ref('')

async function submit1() {
  await apis.auth(token.value)
  router.push({
    name: 'Home',
    // 路由中开启props时，可以使用params传递参数
    params: {
      msg: 'From the AuthPage',
    },
  })
}

// 路由参数接收方
defineProps<{ msg: string }>()
```

## 添加ElementPlus

[官网链接](https://element-plus.gitee.io/zh-CN/guide/design.html)

* 安装依赖项

```bash
# 安装element-plus
yarn add element-plus

# 按需导入
npm install -D unplugin-vue-components unplugin-auto-import
```

* 修改 `vite.config.ts`

```ts
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
export default defineConfig({
  AutoImport({
    resolvers: [ElementPlusResolver()],
  }),
  Components({
    resolvers: [ElementPlusResolver()],
  }),
})
```

* 在 `vue` 文件中就不需要再引入对应的组件了。 如果使用 `vscode` 时没有智能提示，需要关闭`vscode`重开。

> 注意事项：按需加载 `ElMessageBox, ElLoading` 等组件时，需要 `import` 对应的 `scss` 样式文件，不然会没有样式。

## 统一请求axios封装

* 安装依赖项

```bash
yarn add axios
```
* 新建 `src/https/http.ts` 文件，内容如下

```ts
import axios, { AxiosRequestConfig } from 'axios'
import { ElLoading, ElMessageBox } from 'element-plus'
// 下面几个样式文件一定需要单独引用
import 'element-plus/theme-chalk/src/message-box.scss'
import 'element-plus/theme-chalk/src/overlay.scss'
import 'element-plus/theme-chalk/src/loading.scss'
import { serverUrl } from '@/config.json'

const loadingOption = {
  text: '拼命加载中....',
  lock: true,
  background: 'rgba(0, 0, 0, 0.8)',
}

axios.defaults.baseURL = serverUrl
axios.defaults.timeout = 10 * 1000
axios.defaults.headers.post['Content-Type'] = 'application/json;charset=UTF-8'
axios.interceptors.request.use(
  (config): AxiosRequestConfig<any> => {
    const token = window.localStorage.getItem('token')
    // 请求头中带上token
    if (token) {
      //@ts-ignore
      config.headers.token = token
    }
    return config
  },
  (error) => {
    return error
  }
)
axios.interceptors.response.use((res) => {
  // 展示错误信息
  if (res.data.code > 0) {
    ElMessageBox.alert(res.data.message, '请求出错', {
      confirmButtonText: '确定',
    })
  }
  return res
})

interface ResModel<T> {
  code: number
  data: T
  message: string
}

interface Http {
  get<T>(url: string, params?: unknown): Promise<ResModel<T>>
  post<T>(url: string, params?: unknown): Promise<ResModel<T>>
  upload<T>(url: string, params?: unknown): Promise<ResModel<T>>
  download(url: string): void
}

const http: Http = {
  get(url, params) {
    return new Promise((resolve, reject) => {
      const loading = ElLoading.service(loadingOption)
      axios
        .get(url, { params })
        .then((res) => {
          loading.close()
          resolve(res.data)
        })
        .catch((err) => {
          loading.close()
          reject(err.data)
        })
    })
  },
  post(url, params) {
    return new Promise((resolve, reject) => {
      const loading = ElLoading.service(loadingOption)
      axios
        .post(url, JSON.stringify(params))
        .then((res) => {
          loading.close()
          resolve(res.data)
        })
        .catch((err) => {
          loading.close()
          reject(err.data)
        })
    })
  },
  upload(url, file) {
    return new Promise((resolve, reject) => {
      const loading = ElLoading.service(loadingOption)
      axios
        .post(url, file, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((res) => {
          loading.close()
          resolve(res.data)
        })
        .catch((err) => {
          loading.close()
          reject(err.data)
        })
    })
  },
  download(url) {
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = url
    iframe.onload = function () {
      document.body.removeChild(iframe)
    }
    document.body.appendChild(iframe)
  },
}

export default http
```

* 添加`src/https/auth.ts`，使用封装好的请求

```ts
import http from './http'

// 接口集合
export interface IAuthApis {
  auth: (token: string) => Promise<any>
}

const authApis: IAuthApis = {
  async auth(token) {
    const res = await http.post<string>('validateToken', { token })
    if (res.code === 0) {
      window.localStorage.setItem('token', res.data)
    }
  },
}

export default authApis
```

## 状态管理Pinia

* 安装依赖项

```bash
yarn add pinia@next
```

* 修改 `main.ts` 增加状态管理

```ts
import { createPinia } from 'pinia'
const app = createApp(App)
app.use(createPinia())
```

* 创建 `src/store/main.ts`，内容如下:

```ts
import { defineStore } from 'pinia'

export const useMainStore = defineStore({
  id: 'main',
  // 设置属性
  state: () => ({
    name: '管理员',
  }),
  // 相当于计算属性
  getters: {
    nameLength: (state) => state.name.length,
  },
  // 可以通过组件或其他 action 调用
  // 可以从其他 store 的 action 中调用
  // 直接在 store 实例上调用
  // 支持同步或异步，有任意数量的参数
  // 可以包含有关如何更改状态的逻辑
  // 可以 $patch 方法直接更改状态属性
  actions: {
    async changeName(data: string) {
      this.name = data
    },
  },
})
```

* 在组件中使用

```ts
import { useMainStore } from '@/store/main'
const mainStore = useMainStore()
mainStore.changeName('aaa')
```

```html
<template>
  <div>{{mainStore.name}}</div>
  <div>{{mainStore.nameLength}}</div>
</template>
```
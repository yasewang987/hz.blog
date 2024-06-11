# Tailwindcss资料记录

## 插件安装

vscode或者其他开发工具查找 `Tailwindcss IntelliSense`，安装插件，然后找到配置文件中的`classRegex`，增加如下内容

```js
// 在 cva 函数中使用 ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
// 在 clsx 函数中使用 ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
// 在普通 js 变量中使用 "(?:const|let|var)\\s+[\\w$_][_\\w\\d]*\\s*=\\s*['\\\"](.*?)['\\\"]"
// 在特定的元素参数中使用 "(?:enter|leave)(?:From|To)?=\\s*(?:\"|'|{`)([^(?:\"|'|`})]*)"
"experimental": {
    "classRegex": [
      ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
      ["classnames\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
      ["classNames\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
      ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
      "(?:enter|leave)(?:From|To)?=\\s*(?:\"|')([^(?:\"|')]*)",
      "(?:enter|leave)(?:From|To)?=\\s*(?:\"|'|{`)([^(?:\"|'|`})]*)",
      ":\\s*?[\"'`]([^\"'`]*).*?,",
      ["(?:twMerge|twJoin)\\(([^;]*)[\\);]", "[`'\"`]([^'\"`;]*)[`'\"`]"],
      "tailwind\\('([^)]*)\\')", "(?:'|\"|`)([^\"'`]*)(?:'|\"|`)",
      "(?:const|let|var)\\s+[\\w$_][_\\w\\d]*\\s*=\\s*['\\\"](.*?)['\\\"]"
    ]
  }
```

## 配置文件说明

```js
// tailwind.confing.js
@tailwind base;
@tailwind components;
@tailwind utilities;
const plugin = require('tailwindcss/plugin')

/** @type {import('tailwindcss').Config} */
module.exports = {
  // content 选项是一个数组，用于指定 tailwindcss 语法生效的文件集合
  // * 匹配任意字符，** 匹配 0 个或者多个目录，{js, jsx} 匹配多个值
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  // 【不推荐】自定义任意语法
  // 完整配置：https://github.com/tailwindlabs/tailwindcss/blob/master/stubs/config.full.js#L5
  theme: {
    // space-0.5
    spacing: {
      px: '1px',
      0: '0px',
      0.5: '0.125rem',
      1: '0.25rem',
    },
    // margin 写法后面跟的数字，就是我们约定的 spacing 中具体的值
    // m-0.5
    margin: ({ theme }) => ({
      auto: 'auto',
      ...theme('spacing'),
    }),
  }
  // 【推荐】自定义语法更好的方式是使用 extend 配置去覆盖原有配置项
  // 针对 background-color 定义一个语法写法如下：bg-heise-1
  extend: {
    backgroundColor: {
      heise: {
        0: 'rgba(0, 0, 0, 0)',
        1: 'rgba(0, 0, 0, 0.1)',
        2: 'rgba(0, 0, 0, 0.2)',
        3: 'rgba(0, 0, 0, 0.3)',
        4: 'rgba(0, 0, 0, 0.4)',
      },
    },
  },
  // tailwindcss 有三个模块
  // base:样式重置模块
  // components:组件模块
  // utilities:功能模块
  plugins: [
    plugin(function({ addBase, theme }) {
      addBase({
        'button': { color: theme('colors.orange.700') }
      })
    }),
    plugin(({addComponents, theme}) => {
      addComponents({
        '.card': {
          display: 'inline-block',
          padding: '1rem',
          border: '1px solid',
          borderRadius: '4px',
          borderColor: theme('colors.red.400'),
          margin: '1rem'
        }
      })
    }),
  ],
}
```

```html
<div className='card'>
  <button>自定义button默认样式</button>
</div>
```


## 元素class名冗长处理

```js
// 建议
var clx = 'flex items-center text-gray-700 bg-white px-8 py-5 transition hover:bg-amber-100'

// 不建议单独新建css文件，使用apply
.btn {
  @apply rounded-md border border-solid border-transparent py-2 px-4 text-sm font-medium bg-gray-100
    cursor-pointer transition
}
```

```html
<div className={clx}></div>
<div className={clx}></div>
<div className={clx}></div>
```

一些全局的、共用的可以单独提炼出来放到一个单独的文件中去

```js
export const center = 'flex items-center justify-center'
export const card = 'border rounded-md p-4'
```

## 组件封装-参数布尔化

在组件的内部封装也很简单，这些属性都被设计成为了布尔型，那么在内部我们是否需要将一段属性加入到元素中，只需要简单判断就可以了。

这里依赖了小工具`twMerge, clsx, cva`

```html
<!-- 建议 -->
<Button danger>Danger</Button>
<Button primary sm>Primary SM</Button>

<!-- 不推荐 -->
<Button type="primary" size="lg">he</Button>
```

```js
// 结合 clsx 和 twMerge
// 先用 classnames/clsx 拼接字符串逻辑，然后再用 twMerge 清理掉冗余的 classNames，最后得到的字符串就是最理想的结果
npm i clsx

import {twMerge} from 'tailwind-merge'

export default function Button(props) {
  const {className, primary, danger, sm, lg, success, ...other} = props
  const base = 'rounded-xl border border-transparent font-medium cursor-pointer transition'

  // type
  const normal = 'bg-gray-100 hover:bg-gra

  // size
  const md = 'text-sm py-2 px-4'
  
  const cls = twMerge(clsx(base, normal, md, {
    // type
    ['bg-blue-500 text-white hover:bg-blue-600']: primary,
    ['bg-red-500 text-white hover:bg-red-600']: danger,
    ['bg-green-500 text-white hover:bg-green-600']: success,

    // size
    ['text-xs py-1.5 px-3']: sm,
    ['text-lg py-2 px-6']: lg,
  }))

  return (
    <button className={cls} {...other}>{props.children}</button>
  )
}
```

但是并不是所有的 `props` 都能处理成布尔值传入，或者有的时候你也并不喜欢这种方式，还是更喜欢使用传统的 `key=value` 的方式传参，那么这个时候，我们可以借助 `cva` 来实现目标

```js
// cva 可以帮助我们轻松处理一个属性对应多个值，每个值又对应多个 className 的情况
import {cva} from 'class-variance-authority'

const cvacss = cva(
  'rounded-md border border-transparent font-medium cursor-pointer transition', {
    variants: {
      type: {
        normal: 'bg-gray-100 hover:bg-gray-200',
        primary: 'bg-blue-500 text-white hover:bg-blue-600',
        danger: 'bg-red-500 text-white hover:bg-red-600'
      },
      danger: {
        true: 'bg-red-500 text-white hover:bg-red-600',
        false: 'bg-red-500 text-white hover:bg-red-600'
      }
    },
    defaultVariants: {
      type: 'normal',
      danger: false
    }
  }
)
const cls = twMerge(cvacss({type, size}))
```


# 常用操作集合

## iframe滚动条

`iframe`设置了`height: 100%`时有滚动条

```css
/* 通过设置display为block解决 */
#frame {
  margin: 0;
  padding: 0;
  display: block;
}
```

## css变量定义

最佳实践是定义在根伪类 `:root` 下，这样就可以在 `HTML` 文档的任何地方访问到它了

自定义属性名是大小写敏感的，`--my-color` 和 `--My-color` 会被认为是两个不同的自定义属性。

```css
/* 声明一个变量： */
:root{
  --bgColor: #000;
}


/* 使用变量 */
.main{
  background:var(--bgColor);
}
```

在 JavaScript 中获取或者修改 CSS 变量和操作普通 CSS 属性是一样的：

```js
// 获取一个 Dom 节点上的 CSS 变量
element.style.getPropertyValue("--my-var");

// 获取任意 Dom 节点上的 CSS 变量
getComputedStyle(element).getPropertyValue("--my-var");

// 修改一个 Dom 节点上的 CSS 变量
element.style.setProperty("--my-var", jsVar + 4);
```
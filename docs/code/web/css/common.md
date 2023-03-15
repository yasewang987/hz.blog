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

## 滚动条样式设置

```css
::-webkit-scrollbar {
  position: absolute;
  width: 6px;
  height: 6px;
  margin-left: -10px;
}
::-webkit-scrollbar-thumb {
  cursor: pointer;
  background-color: #f0f1f5;
  background-clip: content-box;
  border-color: transparent;
  border-style: solid;
  border-width: 1px 2px;
  border-radius: 7px;
}
::-webkit-scrollbar-track {
  background-color: transparent;
  border-right: none;
  border-left: none;
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

## input,textarea文本样式不一致

通过以下配置统一
```css
input,
textarea,
input::-webkit-input-placeholder,
textarea::-webkit-input-placeholder
{
  font-family: "微软雅黑"!important;
  font-size: 14px!important;
}
```

## 滚动条置顶

```js
document.getElementById('speechSceneId').scrollTo({
  top:0,
  behavior:'smooth'
})
```

## 浮动按钮等实现

使用固定定位,如果同时设置了 `top`和 `bottom`，则元素的高度会根据父元素的高度自适应；如果同时设置了 `left` 和 `right`，则元素的宽度也会根据父元素的宽度自适应。

```css
element {
  position: fixed;
  top: value;
  right: value;
  bottom: value;
  left: value;
  z-index: 9999;
}
```
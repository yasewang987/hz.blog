# 常用操作集合

## iframe滚动条问题

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

## 滚动条置顶

```js
document.getElementById('speechSceneId').scrollTo({
  top:0,
  behavior:'smooth'
})
```

## 滚动加载

```html
<script>
import infiniteScroll from 'vue-infinite-scroll'
loadMoreRelatedArticleDisabled() {
  return this.recentArticleResult.loadmore == 0 || this.loading
},
async loadMoreRelatedArticle() {
  this.loading = true
  let res = await api.queryRelatedArticleListByScroll({
    scrollid: this.relatedArticleResult.scrollId,
    terms: this.normalResult.relatedqueryinfo.terms
  })
  this.relatedArticleResult.loadmore = res.loadmore
  this.relatedArticleResult.scrollid = res.scrollid
  this.relatedArticleResult.list = this.relatedArticleResult.list.concat(res.list)
  this.loading = false
}
</script>
<template>
  <div class="card-container2"
    v-infinite-scroll="loadMoreRelatedArticle" 
    infinite-scroll-disabled="loadMoreRelatedArticleDisabled"
    infinite-scroll-distance="30">
    <el-card v-for="article,index in relatedArticleResult.list" :key="index">
      <div class="card-text" v-html="article.title" :title="cleanContent(article.title)">
      </div>
      <div class="card-footer">
        <div>
          <span>{{ getDate(article.pubdate) }}</span>
          <span>{{ article.source }}</span>
        </div>
        <div>
          <el-link @click="click_LookDetail(article.uid)">查看详情</el-link>
        </div>
      </div>
    </el-card>
    <div class="nomore" v-if="relatedArticleResult.loadmore == 0">没有更多数据</div>
  </div>
</template>
<style>
.card-container2 {
  height: calc(97vh - 209px);
  overflow-x: hidden;
  overflow-y: scroll;
  margin-left: 5px;
}
.card-text {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  font-size: 14px;
  font-weight: 700;
  color: #2d3237;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 3;
}
.card-footer {
  display: flex;
  padding-top: 8px;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 400;
  color: #b9b9b9;
}
.nomore {
  color: #93959a;
  font-size: 14px;
  text-align: center;
  padding: 10px 0;
}
</style>
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

## `\n`等空白符自动换行

`white-space`:属性表明了两件事

* 空白字符是否以及如何它们该如何合并。
* 行是否采用软换行。

值|换行符|空格和制表符|文字换行|行尾空格
---|----|----|---|---
normal|合并|合并|换行|删除
nowrap|合并|合并|不换行|删除
pre|保留|保留|不换行|保留
pre-wrap|保留|保留|换行|挂起
pre-line|保留|合并|换行|删除
break-spaces|保留|保留|换行|换行

```css
body {
  white-space: pre-line;
}
```

## box-sizing

* `content-box`: 默认值，标准盒子模型。`width` 与 `height` 只包括内容的宽和高，不包括边框（border），内边距（padding），外边距（margin）。
    * `width` = 内容的宽度
    * `height` = 内容的高度
* `border-box`: `width` 和 `height` 属性包括内容，内边距和边框，但不包括外边距。
    * `width` = border + padding + 内容的宽度
    * `height` = border + padding + 内容的高度

## 文字溢出显示省略号

```html
<html lang="en">
<head>
  <style>
    .test {
      background-color:darkgrey;
      font-size: 16px;
      width: 100px;

      text-overflow: ellipsis;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div class="test">
    aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
  </div>
</body>
</html>
```
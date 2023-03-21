# Flex布局

* 设为 Flex 布局以后，子元素的`float`、`clear`和`vertical-align`属性将失效。

## 容器css属性

容器主要有六大属性：

* 方向：`flex-direction`
* 换行：`flex-wrap`
* 方向及换行：`flex-flow`
* 项目在主轴项目对齐方式：`justify-content`
* 项目在交叉轴项目对齐方式：`align-items`
* 多根主轴线的对齐方式：`align-content`

```css
/* 指定容器采用flex布局 */
.box{
  display: flex;
  gap: 10px; /**元素间距 */
}

/* 行内元素 Flex 布局 */
.box {
  display: inline-flex;
}

/**Webkit 内核的浏览器，必须加上-webkit前缀 */
.box{
  display: -webkit-flex; /* Safari */
  display: flex;
}

/**
flex-direction属性
flex-direction属性决定主轴的方向（即项目的排列方向）
row（默认值）：主轴为水平方向，起点在左端。
row-reverse：主轴为水平方向，起点在右端。
column：主轴为垂直方向，起点在上沿。
column-reverse：主轴为垂直方向，起点在下沿。
*/
.box {
  flex-direction: row | row-reverse | column | column-reverse;
}

/**
flex-wrap属性
flex-wrap属性定义，如果一条轴线排不下，如何换行。
nowrap（默认）：不换行。
wrap：换行，第一行在上方。
wrap-reverse：换行，第一行在下方
*/
.box{
  flex-wrap: nowrap | wrap | wrap-reverse;
}

/**
flex-flow属性是flex-direction属性和flex-wrap属性的简写形式，默认值为row nowrap。
*/
.box {
  flex-flow: <flex-direction> || <flex-wrap>;
}

/**
justify-content属性
justify-content属性定义了项目在主轴上的对齐方式。
flex-start（默认值）：左对齐
flex-end：右对齐
center： 居中
space-between：两端对齐，项目之间的间隔都相等。
space-around：每个项目两侧的间隔相等。所以，项目之间的间隔比项目与边框的间隔大一倍。
*/
.box {
  justify-content: flex-start | flex-end | center | space-between | space-around;
}

/**
align-items属性
align-items属性定义项目在交叉轴上如何对齐。
flex-start：交叉轴的起点对齐。
flex-end：交叉轴的终点对齐。
center：交叉轴的中点对齐。
baseline: 项目的第一行文字的基线对齐。
stretch（默认值）：如果项目未设置高度或设为auto，将占满整个容器的高度。
*/
.box {
  align-items: flex-start | flex-end | center | baseline | stretch;
}

/**
align-content属性
align-content属性定义了多根轴线的对齐方式。如果项目只有一根轴线，该属性不起作用。
flex-start：与交叉轴的起点对齐。
flex-end：与交叉轴的终点对齐。
center：与交叉轴的中点对齐。
space-between：与交叉轴两端对齐，轴线之间的间隔平均分布。
space-around：每根轴线两侧的间隔都相等。所以，轴线之间的间隔比轴线与边框的间隔大一倍。
stretch（默认值）：轴线占满整个交叉轴。
*/
.box {
  align-content: flex-start | flex-end | center | space-between | space-around | stretch;
}
```

## 子项目css属性

项目六大属性：

* 显示顺序：`order`
* 放大：`flex-grow`
* 缩小：`flex-shrink`
* 占据的空间：`flex-basis`
* 放大、缩小、空间的集合：`flex`
* 交叉轴的对齐方式：`align-self`

```css
/** order属性定义项目的排列顺序。数值越小，排列越靠前，默认为0。 */
.item {
  order: <integer>;
}

/** 
flex-grow属性定义项目的放大比例，默认为0，即如果存在剩余空间，也不放大。
如果所有项目的flex-grow属性都为1，则它们将等分剩余空间（如果有的话）。如果一个项目的flex-grow属性为2，其他项目都为1，则前者占据的剩余空间将比其他项多一倍。
*/
.item {
  flex-grow: <number>; /* default 0 */
}

/**
flex-shrink属性定义了项目的缩小比例，默认为1，即如果空间不足，该项目将缩小。
如果所有项目的flex-shrink属性都为1，当空间不足时，都将等比例缩小。如果一个项目的flex-shrink属性为0，其他项目都为1，则空间不足时，前者不缩小。
*/
.item {
  flex-shrink: <number>; /* default 1 */
}

/**
flex-basis相当于width/height，可以是300px类似的固定值
用来指定Flex子项的基础占据的空间，不可以为负数。设置 flex-grow 进行分配剩余空间，或者使用 flex-shrink 进行收缩都是在 flex-basis 的基础上进行的（在 设定的 flex-basis基础上 进行 等比例的扩展和收缩）
flex-basis属性定义了在分配多余空间之前，项目占据的主轴空间（main size）。浏览器根据这个属性，计算主轴是否有多余空间。它的默认值为auto，即项目的本来大小。
*/
.item {
  flex-basis: <length> | auto; /* default auto */
}

/**
flex属性是flex-grow, flex-shrink 和 flex-basis的简写，默认值为0 1 auto。后两个属性可选。
该属性有两个快捷值：auto (1 1 auto) 和 none (0 0 auto)。
flex 1 == 1 1 0% ：这个值比较特殊可以等分上层容器空间。auto这个属性不会等分，只会根据内容本身大小决定。
建议优先使用这个属性，而不是单独写三个分离的属性，因为浏览器会推算相关值。
*/
.item {
  flex: none | [ <'flex-grow'> <'flex-shrink'>? || <'flex-basis'> ]
}

/**
align-self属性允许单个项目有与其他项目不一样的对齐方式，可覆盖align-items属性。默认值为auto，表示继承父元素的align-items属性，如果没有父元素，则等同于stretch。
*/
.item {
  align-self: auto | flex-start | flex-end | center | baseline | stretch;
}
```

## demo

### 圣杯布局

```html
<!DOCTYPE html>
<html lang="en" style="font-size: 62.5%;">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="./my.css">
  <title>Document</title>
</head>
<body>
  <div class="container">
    <div class="header">
      <button onclick="mybtnClick()">三</button>
    </div>
    <div class="content">
      <div class="left"></div>
      <div class="center"></div>
      <div class="right"></div>
    </div>
    <div class="footer"></div>
  </div>
</body>
<script>
  function mybtnClick() {
    let left = document.getElementsByClassName('left')[0]
    left.style.display=''
    console.log(display)
    left.setAttribute('display', display === '' ? 'none': '')
  }
</script>
</html>
```

```css
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: aquamarine;
}

.footer,
.header {
  flex-basis: 10rem;
  background-color: darkgray;
}

.content {
  display: flex;
  flex: 1 1 0%;
  background-color:burlywood;
}

.left,
.right {
  flex-basis: 10rem;
  background-color:brown;
}

.center {
  flex: auto;
  background-color: blue;
}
```
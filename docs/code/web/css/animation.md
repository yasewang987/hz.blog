# CSS动画


## 电影效果

滤镜中的`brightness`用于调整图像的明暗度。默认值是1；小于1时图像变暗，为0时显示为全黑图像；大于1时图像显示比原图更明亮。

我们可以通过调整 背景图的明暗度 和 文字的透明度 ，来模拟电影谢幕的效果。

我们可以通过调整 `背景图的明暗度` 和 `文字的透明度` ，来模拟电影谢幕的效果。

![1](http://cdn.go99.top/docs/code/web/css/animation1.awebp)

```html
<div class="container">
  <div class="pic"></div>
  <div class="text">
    <p>如果生活中有什么使你感到快乐，那就去做吧</p>
    <br>
    <p>不要管别人说什么</p>
  </div>
</div>
```

```css
.pic{
    height: 100%;
    width: 100%;
    position: absolute;
    background: url('./images/movie.webp') no-repeat;
    background-size: cover;
    animation: fade-away 2.5s linear forwards;    //forwards当动画完成后，保持最后一帧的状态
}
.text{
    position: absolute;
    line-height: 55px;
    color: #fff;
    font-size: 36px;
    text-align: center;
    left: 50%;
    top: 50%;
    transform: translate(-50%,-50%);
    opacity: 0;
    animation: show 2s cubic-bezier(.74,-0.1,.86,.83) forwards;
}
    
@keyframes fade-away {    //背景图的明暗度动画
    30%{
        filter: brightness(1);
    }
    100%{
        filter: brightness(0);
    }
}
@keyframes show{         //文字的透明度动画
    20%{
        opacity: 0;
    }
    100%{
        opacity: 1;
    }
}
```

## 模糊效果

在下面的单词卡片中，当鼠标`hover`到某一张卡片上时，其他卡片背景模糊，使用户焦点集中到当前卡片。

![2](http://cdn.go99.top/docs/code/web/css/animation2.awebp)

```html
<ul class="cards">
    <li class="card">
      <p class="title">Flower</p>
      <p class="content">The flowers mingle to form a blaze of color.</p>
    </li>
    <li class="card">
      <p class="title">Sunset</p>
      <p class="content">The sunset glow tinted the sky red.</p>
    </li>
    <li class="card">
      <p class="title">Plain</p>
      <p class="content">The winds came from the north, across the plains, funnelling down the valley. </p>
    </li>
 </ul>
```
实现的方式，是将背景加在`.card`元素的伪类上，当元素不是焦点时，为该元素的伪类加上滤镜。
```css
.card:before{
    z-index: -1;
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    border-radius: 20px;
    filter: blur(0px) opacity(1);
    transition: filter 200ms linear, transform 200ms linear;
}
/*
     这里不能将滤镜直接加在.card元素，而是将背景和滤镜都加在伪类上。
     因为，父元素加了滤镜，它的子元素都会一起由该滤镜改变。
     如果滤镜直接加在.card元素上，会导致上面的文字也变模糊。
*/

// 通过css选择器选出非hover的.card元素，给其伪类添加模糊、透明度和明暗度的滤镜 
.cards:hover > .card:not(:hover):before{    
  filter: blur(5px) opacity(0.8) brightness(0.8);
}

// 对于hover的元素，其伪类增强饱和度，尺寸放大
.card:hover:before{
  filter: saturate(1.2);  
  transform: scale(1.05);
}
```

## 褪色效果

褪色效果可以打造出一种怀旧的风格。下面这组照片墙，我们通过`sepia`滤镜将图像基调转换为深褐色，再通过降低 饱和度`saturate` 和 色相旋转`hue-rotate` 微调，模拟老照片的效果。

![3](http://cdn.go99.top/docs/code/web/css/animation3.awebp)

```css
.pic{
    border: 3px solid #fff;
    box-shadow: 0 10px 50px #5f2f1182;
    filter: sepia(30%) saturate(40%) hue-rotate(5deg);
    transition: transform 1s;
}
.pic:hover{
    filter: none;
    transform: scale(1.2) translateX(10px);
    z-index: 1;
}
```

## 灰度效果

怎样让网站变成灰色？在html元素上加上`filter: grayscale(100%)`即可。

`grayscale(amount)`函数将改变输入图像灰度。`amount` 的值定义了灰度转换的比例。值为 `100%` 则完全转为灰度图像，值为 `0%` 图像无变化。若未设置值，默认值是 `0`。

![4](http://cdn.go99.top/docs/code/web/css/animation4.awebp)

## 融合效果

要使两个相交的元素产生下面这种融合的效果，需要用到的滤镜是`blur`和`contrast`。

![5](http://cdn.go99.top/docs/code/web/css/animation5.awebp)

```html
<div class="container">
  <div class="circle circle-1"></div>
  <div class="circle circle-2"></div>
</div>
```

```css
.container{
  margin: 50px auto;
  height: 140px;
  width: 400px;
  background: #fff;   //给融合元素的父元素设置背景色
  display: flex;
  align-items: center;
  justify-content: center;
  filter: contrast(30);    //给融合元素的父元素设置contrast
}
.circle{
  border-radius: 50%;
  position: absolute;
  filter: blur(10px);    //给融合元素设置blur
}
.circle-1{
  height: 90px;
  width: 90px;
  background: #03a9f4;
  transform: translate(-50px);
  animation: 2s moving linear infinite alternate-reverse;
}
.circle-2{
  height: 60px;
  width: 60px;
  background: #0000ff;
  transform: translate(50px);
  animation: 2s moving linear infinite alternate;
}
 @keyframes moving {    //两个元素的移动
  0%{
    transform: translate(50px)
  }
  100%{
    transform: translate(-50px)
  }
}
```

**实现融合效果的技术要点：**

1. `contrast`滤镜应用在融合元素的父元素（`.container`）上，且父元素必须设置`background`。
1. `blur`滤镜应用在融合元素（`.circle`）上

`blur`设置图像的模糊程度，`contrast`设置图像的对比度。当两者像上面那样组合时，就会产生神奇的融合效果，你可以像使用公式一样使用这种写法。

在这种融合效果的基础上，我们可以做一些有趣的交互设计。

## 加载动画

html和css如下所示，这个动画主要通过控制子元素`.circle`的尺寸和位移来实现，但是由于父元素和子元素都满足 “融合公式” ，所以当子元素相交时，就出现了融合的效果。

![6](http://cdn.go99.top/docs/code/web/css/animation6.awebp)

```html
<div class="container">
  <div class="circle"></div>
  <div class="circle"></div>
  <div class="circle"></div>
  <div class="circle"></div>
  <div class="circle"></div>
</div>
```

```css
.container {
  margin: 10px auto;
  height: 140px;
  width: 300px;
  background: #fff;       //父元素设置背景色
  display: flex;
  align-items: center;
  filter: contrast(30);   //父元素设置contrast
}
.circle {
  height: 50px;
  width: 60px;
  background: #1aa7ff;
  border-radius: 50%;
  position: absolute;
  filter: blur(20px);    //子元素设置blur
  transform: scale(0.1);
  transform-origin: left top;
}
.circle{
  animation: move 4s cubic-bezier(.44,.79,.83,.96) infinite;
}
.circle:nth-child(2) {
  animation-delay: .4s;
}
.circle:nth-child(3) {
  animation-delay: .8s;
}
.circle:nth-child(4) {
  animation-delay: 1.2s;
}
.circle:nth-child(5) {
  animation-delay: 1.6s;
}
@keyframes move{     //子元素的位移和尺寸动画
  0%{
    transform: translateX(10px) scale(0.3);
  }
  45%{
    transform: translateX(135px) scale(0.8);
  }
  85%{
    transform: translateX(270px) scale(0.1);
  }
}
```

## 酷炫的文字出场方式

![7](http://cdn.go99.top/docs/code/web/css/animation7.awebp)

主要通过不断改变`letter-spacing`和`blur`的值，使文字从融合到分开：

```html
<div class="container">
  <span class="text">fantastic</span>
</div>
```

```css
.container{
  margin-top: 50px;
  text-align: center;
  background-color: #000;
  filter: contrast(30);
}
.text{
  font-size: 100px;
  font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
  letter-spacing: -40px;
  color: #fff;
  animation: move-letter 4s linear forwards;  //forwards当动画完成后，保持最后一帧的状态
}
@keyframes move-letter{
  0% {
    opacity: 0;
    letter-spacing: -40px;
    filter: blur(10px);
  }
  25% {
    opacity: 1;
  }
  50% {
    filter: blur(5px);
  }
  100% {
    letter-spacing: 20px;
    filter: blur(2px);
  }
}
```
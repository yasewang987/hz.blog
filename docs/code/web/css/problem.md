# 问题集合

* `iframe`设置了`height: 100%`时有滚动条

```css
/* 通过设置display为block解决 */
#frame {
  margin: 0;
  padding: 0;
  display: block;
}
```
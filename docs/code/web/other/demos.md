# 常用Demos
## 富文本编辑器

编辑器：https://github.com/Hufe921/canvas-editor

插件（支持文件导入导出docx）：https://github.com/Hufe921/canvas-editor-plugin

## JS打印

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  <button onclick="printTag()">测试打印</button>
</body>
<script>
  function printTag() {
    // 创建iframe
    let iframe = document.createElement('IFRAME')
    iframe.setAttribute(
      'style',
      'position:absolute;width:0px;height:0px;left:-500px;top:-500px;'
    )
    document.body.appendChild(iframe)
    let doc = iframe.contentWindow.document
    // 打印时去掉页眉页脚
    doc.write('<style media="print">@page {size: auto;  margin: 0mm; }</style>')
    // 打印内容放入iframe中
    doc.write('<div style="margin-top:20px; margin-left:10px">姓名：周周周</div>')
    doc.write('<div style="margin-top:10px; margin-left:10px;">电话: 112233445566</div>')
    doc.write('<div style="margin-top:10px; margin-left:10px; white-space:normal; word-break:break-all; overflow:hidden;">地址: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA</div>')
    doc.write('<div style="margin-top:20px; font-weight:bold; text-align:center;">贴数: 7</div>')
    let ys = 'html,body{height:auto}'
    let style = document.createElement('style')
    style.innerText = ys
    doc.getElementsByTagName('head')[0].appendChild(style)
    doc.close()
    // 开始打印iframe内容
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
    if (navigator.userAgent.indexOf('MSIE') > 0) {
      //打印完删除iframe
      document.body.removeChild(iframe)
    }
  }
</script>
</html>
```

## weboffice

参考阿里网盘里的 `soft/weboffice` 里的 `README.md`
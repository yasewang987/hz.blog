# Go爬虫demo

使用了 `colly` 框架 `github.com/gocolly/colly`，本质上也可以使用http请求，加上正则来实现。

```go
package main

import (
	"log"
	"strings"
	"time"

	"github.com/gocolly/colly"
	"github.com/gocolly/colly/debug"
)

// demo陕西省政府信息公开>政府公报>2022>16期
func main() {
	//// 爬取文章列表
	// 创建采集器
	c := colly.NewCollector(
		colly.UserAgent("Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36"),
		colly.MaxDepth(1),
		colly.Debugger(&debug.LogDebugger{}))
	// 限速
	c.Limit(&colly.LimitRule{
		DomainRegexp: "",
		DomainGlob:   "*.shaanxi.gov.cn/zfxxgk/zfgb/2022/*",
		Delay:        5 * time.Second,
		RandomDelay:  0,
		Parallelism:  1,
	})
	//// 爬取详情页
	c2 := c.Clone()
	// 异步
	c2.Async = true
	c2.Limit(&colly.LimitRule{
		DomainRegexp: "",
		DomainGlob:   "*.shaanxi.gov.cn/zfxxgk/zfgb/2022/*",
		Delay:        5 * time.Second,
		RandomDelay:  0,
		Parallelism:  1,
	})
	// 注册回调函数
	c.OnRequest(func(r *colly.Request) {
		log.Println("Vist-c:", r.URL)
	})
	c.OnHTML("div[class='gb_cont']", func(h *colly.HTMLElement) {
		h.ForEach("a", func(i int, item *colly.HTMLElement) {
			title := strings.Trim(item.Text, "\n")
			href := strings.Trim(item.Attr("href"), ".")
			ctx := colly.NewContext()
			ctx.Put("title", title)
			ctx.Put("href", href)
			// 通过Context上下文对象将采集器1采集到的数据传递到采集器2
			c2.Request("GET", "http://www.shaanxi.gov.cn/zfxxgk/zfgb/2022/d16q"+href, nil, ctx, nil)
		})
	})
	c2.OnRequest(func(r *colly.Request) {
		log.Println("Vist-c2:", r.URL)
	})
	c2.OnHTML("div[class='gb_detail-article']", func(h *colly.HTMLElement) {
		detail := h.ChildText("div[class='view TRS_UEDITOR trs_paper_default trs_web']")
		href := h.Request.Ctx.Get("href")
		title := h.Request.Ctx.Get("title")
		log.Println("----------------爬取文章------------")
		log.Println(title)
		log.Println(href)
		log.Println(detail)
	})
	// 访问网站
	c.Visit("http://www.shaanxi.gov.cn/zfxxgk/zfgb/2022/d16q")
	c2.Wait()
}
```
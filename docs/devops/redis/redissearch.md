# RedisSearch

[参考文档](https://redis.io/docs/data-types/json/)

`RedisSearch` 属于 `RedisMod` 增强模块中的其中一个模块。通过RediSearch模块，Redis可以变成一个功能强大的全文搜索引擎，并且原生支持中文搜索.

下面操作都是使用 `RedisInsight` 操作，其他redis客户端也可以操作。

## 数据准备RedisJson

RedisJson主要用来在Redis中直接存储Json格式的数据。

通过`JSON.SET`命令向Redis中添加JSON类型键值对，几个商品对象数据，由于JSON是树形结构的，使用`$`符号代表往JSON的根节点中添加数据。

```bash
JSON.SET product:1 $ '{"id":1,"productSn":"7437788","name":"小米8","subTitle":"全面屏游戏智能手机 6GB+64GB 黑色 全网通4G 双卡双待","brandName":"小米","price":2699,"count":1}'
JSON.SET product:2 $ '{"id":2,"productSn":"7437789","name":"红米5A","subTitle":"全网通版 3GB+32GB 香槟金 移动联通电信4G手机 双卡双待","brandName":"小米","price":649,"count":5}'
JSON.SET product:3 $ '{"id":3,"productSn":"7437799","name":"Apple iPhone 8 Plus","subTitle":"64GB 红色特别版 移动联通电信4G手机","brandName":"苹果","price":5499,"count":10}'
```

数据插入成功后，在RedisInsight中查看信息

```bash
#### 获取数据
# 获取整个json对象
JSON.GET product:1
# 获取部分信息（name，subTitle）
JSON.GET product:1 .name .subTitle
# 获取JSON对象类型
JSON.TYPE product:1 .
"object"

#### 删除数据
JSON.DEL product:1
```

* 常见例子参考

```bash
> JSON.SET example $ '[ true, { "answer": 42 }, null ]'
OK
> JSON.GET example $
"[[true,{\"answer\":42},null]]"
> JSON.GET example $[1].answer
"[42]"
> JSON.DEL example $[-1]
(integer) 1
> JSON.GET example $
"[[true,{\"answer\":42}]]"
```

## RedisSearch使用

### 创建索引

RedisSearch建立索引的语法:

```bash
# 模板
FT.CREATE {index}
  [ON {data_type}]
     [PREFIX {count} {prefix} [{prefix} ..]
     [LANGUAGE {default_lang}]
  SCHEMA {identifier} [AS {attribute}]
      [TEXT | NUMERIC | GEO | TAG ] [CASESENSITIVE]
      [SORTABLE] [NOINDEX]] ...

# 实际例子
FT.CREATE productIdx
  ON JSON 
    PREFIX 1 "product:" 
    LANGUAGE chinese 
  SCHEMA 
    $.id AS id NUMERIC
    $.name AS name TEXT 
    $.subTitle AS subTitle TEXT 
    $.price AS price NUMERIC SORTABLE 
    $.brandName AS brandName TAG
```

使用`FT.CREATE`命令可以建立索引，语法中的参数意义如下:

* `index`：索引名称；
* `data_typ`e：建立索引的数据类型，目前支持`JSON`或者`HASH`两种；
* `PREFIX`：通过它可以选择需要建立索引的数据前缀，比如`PREFIX 1 "product:"`表示为键中以`product:`为前缀的数据建立索引；
* `LANGUAGE`：指定`TEXT`类型属性的默认语言，使用`chinese`可以设置为中文；
* `identifier`：指定属性名称；
* `attribute`：指定属性别名；
* `TEXT | NUMERIC | GEO | TAG`：这些都是属性可选的类型；
* `SORTABLE`：指定属性可以进行排序。

### 使用索引查询信息

建立完索引后，我们就可以使用`FT.SEARCH`对数据进行查看了

```bash
# 查询全部
FT.SEARCH productIdx *

# 以price降序返回商品信息
FT.SEARCH productIdx * SORTBY price DESC

# 指定返回的字段
FT.SEARCH productIdx * RETURN 3 name subTitle price

# brandName设置为了TAG类型，我们可以使用如下语句查询品牌为小米或苹果的商品
FT.SEARCH productIdx '@brandName:{小米 | 苹果}'

# price是NUMERIC类型，我们可以使用如下语句查询价格在500~1000的商品
FT.SEARCH productIdx '@price:[500 1000]'

# 通过前缀进行模糊查询，类似于SQL中的LIKE，使用*表示
FT.SEARCH productIdx '@name:小米*'

# 所有TEXT类型的属性进行全局搜索，支持中文搜索，比如我们搜索下包含黑色字段的商品
FT.SEARCH productIdx '黑色'

# 可以指定搜索的字段，比如搜索副标题中带有红色字段的商品
FT.SEARCH productIdx '@subTitle:红色'
```

### 删除、查看索引

```bash
# 删除
FT.DROPINDEX productIdx
# 查看
FT.INFO productIdx
```

### SQL比对

RediSearch的搜索语法比较复杂，不过我们可以对比SQL来使用它，具体可以参考下表。

![redissearch1](http://cdn.go99.top/docs/devops/redis/redissearch1.awebp)

# MySql执行计划

## id

表示一个查询中各个子查询的执行顺序

* id相同执行顺序由上至下
* id不同，id值越大优先级越高，越先被执行
* id为null时表示一个结果集，不需要使用它查询，常出现在包含union等查询语句中

## select_type

每个子查询的查询类型。

常见查询类型：

1. SIMPLE：不包含任何子查询或 `union` 等查询
1. PRIMARY：包含子查询最外层查询就显示为 `PRIMARY`
1. SUBQUERY：在`select`或 `where` 字句中包含的查询
1. DERIVED：`from` 字句中包含的查询
1. UNION：出现在 `union` 后的查询语句中
1. UNION RESULT：从UNION中获取结果集

## table

查询的数据表，当从衍生表中查数据时会显示 `<derivedx>`, `x` 表示对应的执行计划`id`

## type

* `ALL` 扫描全表数据
* `index` 遍历索引
* `range` 索引范围查找
* `index_subquery` 在子查询中使用 `ref`
* `unique_subquery` 在子查询中使用 `eq_ref`
* `ref_or_null` 对Null进行索引的优化的 `ref`
* `fulltext` 使用全文索引
* `ref` 使用非唯一索引查找数据
* `eq_ref` 在`join`查询中使用`PRIMARY KEY`or`UNIQUE NOT NULL`索引关联
* `const` 使用主键或者唯一索引，且匹配的结果只有一条记录
* `system` 连接类型的特例，查询的表为系统表

越往下面越好，一般sql至少需要达到 `index` 级别

## possible_keys

可能使用的索引，注意不一定会使用。查询涉及到的字段上若存在索引，则该索引将被列出来。当该列为 NULL时就要考虑当前的SQL是否需要优化了

## key

显示MySQL在查询中实际使用的索引，若没有使用索引，显示为NULL。

* 查询中若使用了覆盖索引(覆盖索引：索引的数据覆盖了需要查询的所有数据)，则该索引仅出现在key列表中

## key_length

索引长度 char()、varchar()索引长度的计算公式：

```text
(Character Set：utf8mb4=4,utf8=3,gbk=2,latin1=1) * 列长度 + 1(允许null) + 2(变长列)
```

其他类型索引长度的计算公式: ex:

```sql
CREATE TABLE `student` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL DEFAULT '',
  `age` int(11),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx` (`name`),
  KEY `idx_age` (`age`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
```

name 索引长度为： 编码为utf8mb4,列长为128,不允许为NULL,字段类型为varchar(128)。key_length = 128 * 4 + 0 + 2 = 514;

age 索引长度：int类型占4位，允许null,索引长度为5。

## ref

表示上述表的连接匹配条件，即哪些列或常量被用于查找索引列上的值

## rows

返回估算的结果集数目，并不是一个准确的值。

## extra

extra的信息非常丰富，常见的有：

1. `Using index` 使用覆盖索引
1. `Using where` 使用了用where子句来过滤结果集
1. `Using filesort` 使用文件排序，使用非索引列进行排序时出现，非常消耗性能，尽量优化。
1. `Using temporary` 使用了临时表

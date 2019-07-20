# SqlServer常用操作记录

## 跨库操作数据库

#### 方式1

```sql
--创建链接服务器 
exec sp_addlinkedserver 'srv_lnk', '', 'SQLOLEDB', '远程服务器名或ip地址' 
exec sp_addlinkedsrvlogin 'srv_lnk', 'false ',null, '用户名', '密码'
go
--查询示例 
select * from srv_lnk.数据库名.dbo.表名 
--导入示例 
select * into 表 from srv_lnk.数据库名.dbo.表名 
--以后不再使用时删除链接服务器 
exec sp_dropserver 'srv_lnk', 'droplogins'
go
```
<!-- more -->
#### 方式2
```sql
--连接远程/局域网数据(openrowset/openquery/opendatasource) 
--1、openrowset （比较推荐这种做法）

--查询示例 
select * from openrowset( 'SQLOLEDB ', 'sql服务器名 '; '用户名 '; '密码 ',数据库名.dbo.表名) 

--生成本地表 
select * into 表 from openrowset( 'SQLOLEDB ', 'sql服务器名 '; '用户名 '; '密码 ',数据库名.dbo.表名) 

--把本地表导入远程表 
insert openrowset( 'SQLOLEDB ', 'sql服务器名 '; '用户名 '; '密码 ',数据库名.dbo.表名) 
select *from 本地表 

--更新本地表 
update b 
set b.列A=a.列A 
from openrowset('SQLOLEDB ', 'sql服务器名 '; '用户名 '; '密码 ',数据库名.dbo.表名)as a inner join 本地表 b 
on a.column1=b.column1 

--openquery用法需要创建一个连接 

--首先创建一个连接创建链接服务器 
exec sp_addlinkedserver 'ITSV ', ' ', 'SQLOLEDB ', '远程服务器名或ip地址 ' 
--查询 
select * FROM openquery(ITSV,  'SELECT *  FROM 数据库.dbo.表名 ') 
--把本地表导入远程表 
insert openquery(ITSV,  'SELECT *  FROM 数据库.dbo.表名 ') 
select * from 本地表 
--更新本地表 
update b 
set b.列B=a.列B 
FROM openquery(ITSV,  'SELECT * FROM 数据库.dbo.表名 ') as a  
inner join 本地表 b on a.列A=b.列A 
--3、opendatasource/openrowset 
SELECT * FROM   opendatasource( 'SQLOLEDB ',  'Data Source=ip/ServerName;User ID=登陆名;Password=密码 ').test.dbo.roy_ta 
--把本地表导入远程表 
insert opendatasource( 'SQLOLEDB ',  'Data Source=ip/ServerName;User ID=登陆名;Password=密码 ').数据库.dbo.表名 
select * from

---跨库取数使用示例(注意做判断)：
IF EXISTS(SELECT 1 FROM sys.synonyms WHERE name='SYN305_ys_CostAndCashSet')
DROP SYNONYM SYN305_ys_CostAndCashSet
GO
CREATE SYNONYM SYN305_ys_CostAndCashSet FOR [dotnet_erp305_hnjy].dbo.ys_CostAndCashSet
GO

--不允许远程访问出现异常解决方案：
exec sp_configure 'show advanced options',1
reconfigure

exec sp_configure 'Ad Hoc Distributed Queries',1
reconfigure
```
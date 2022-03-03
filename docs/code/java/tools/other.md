# Java其他操作

## linux中替换jar包里的文件

```bash
# 查找对应目标
jar tvf test.jar | grep aaa.class
### 输出如下信息
BOOT-INF/classes/common/faw/api/service/aaa.class

# 解压目标文件
jar -xvf test.jar BOOT-INF/classes/common/faw/api/service/aaa.class

# 覆盖指定文件
cp aaa.class BOOT-INF/classes/common/faw/api/service/

# 按照路径覆盖到jar包
jar -uvf test.jar BOOT-INF/classes/common/faw/api/service/aaa.class
```
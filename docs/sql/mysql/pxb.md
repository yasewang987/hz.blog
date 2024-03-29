# PXB - MySQL热备

## 原理介绍

`InnoDB`的崩溃恢复过程

1. `redo log`操作：保证已提交事务影响的最新数据刷到数据页里。
    * 从`redo log`中读取`checkpoint lsn`，它记录的是最后一次刷盘的页，对应日志的`LSN`【`Log Sequeue Number`，直译过来叫日志序列号】；
    * 如果`redo log`中记录的日志`LSN`小于`checkpoint`，说明相关数据已经被刷盘，不用额外操作；
    * 如果`redo log`中记录的日志`LSN`大于`checkpoint`，说明相关数据只写了`redo log`，没来得及刷盘，就需要对相关数据页重做日志
1. `undo log`操作：保证未提交事务影响的数据页回滚。
1. 写缓冲(`change buffer`)合并。
1. `purge`操作(`InnoDB`的一种垃圾收集机制，使用单独的后台线程周期性处理索引中标记删除的数据)。

`redo log`有两个特性：

1. 幂等性，同一条`redo log`执行多次，不影响数据的恢复。
1. 崩溃恢复时，从比`checkpoint`更早的`LSN`开始执行恢复，也不影响数据最终的一致性，因为一个数据页，最终一定会被更大值的`LSN`日志恢复到最新的数据上来；

`PXB`在线热备原理

1. `PXB`启动一个线程，并不断监听并复制`redo log`的增量到另外的文件，不能直接备份`redo log`的原因是，`redo log`循环使用的，`PXB`则必须记录下`checkpoint LSN`之后的所有`redo log`。
1. `PXB`启动另一个线程，然后开始复制数据文件，复制数据文件过程可能会比较长，整个过程中数据文件可能在不停的修改，导致数据不一致。但没有关系，所有的修改都已经记录在了第一步中，额外记录的`redo log`里。
1. 通过备份的数据文件，重放`redo log`，执行类似于`MySQL`崩溃恢复过程中的动作，就能够使得数据文件恢复到能保证一致性的`checkpoint`检查点。


## 简单实践



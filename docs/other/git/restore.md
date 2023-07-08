# Git回退操作

## git区域划分

git是分布式管理代码的工具，分为4个工作区域。

* 工作区: 日常开发操作的区域
* 暂存区: 通过命令`git add`将工作区的内容添加到暂存区
* 本地仓库: 通过命令`git commit`将暂存区的内容添加到本地仓库，本地仓库可以在`.git`目录下查看，git的所有数据信息都保存在该目录下
* 远程仓库: 通过`git push`可以将本地仓库的修改提交到远程仓库，达到可以团队成员共享代码的目的。

![1](http://cdn.go99.top/docs/other/git/restore1.webp)

## reset回退代码

* 主要用于本地仓库操作，禁止在远程仓库使用

### HEAD指针

git仓库初始化之后，默认会创建一个master分支，即主分支。分支是git对版本进行管理的时间线，记录着每次提交，自动把它们串成一条时间线。
在master这条分支时间线上有很多版本的时间节点【commit-id】，而HEAD指针指向的是当前分支最新一次的版本时间节点。

```bash
* 63cd517 (HEAD -> master) v3
* 678c5a5 v2
* c34a6ba v1
```

![2](http://cdn.go99.top/docs/other/git/restore2.webp)

**HEAD可以表示相对位置：**

* 单独`HEAD`表示当前工作分支的最新提交版本
* 使用`^`表示前一个版本，例如`HEAD^` ，如果要表示前2个版本，`HEAD^^`，依此类推。
* 如果版本跨度大，使用 `^`就不科学，可使用 `~` 加数字表示当前版本之前的第几个版本。使用`HEAD~10`表示为最新版本往前第10个版本。
* 也可以使用`HEAD@{num}`的方式表示。`HEAD@{0}`就相当于`HEAD`，`HEAD@{1}`相当于`HEAD^`。

![3](http://cdn.go99.top/docs/other/git/restore3.webp)

### soft软回退

`git reset --soft commit-id`, 回退到指定的版本。soft软回退，仅仅修改分支中HEAD指针的位置，不改变工作区和暂存区代码。实际只是移动了本地仓库`HEAD`指针的指向。

* 工作区和暂存区无差异
* 暂存区 和 仓库中有差异
* 工作区和仓库中 有差异

在本地创建测试项目，并添加readme.md文件，添加内容并提交，目的是回退到该版本。

```bash
# 使用git log查看历史版本记录
reset shuai$ git log --oneline
* 63cd517 (HEAD -> master) v3
* 678c5a5 v2
* c34a6ba v1

# 使用reflog查看历史版本记录
reset shuai$ git reflog
63cd517 (HEAD -> master) HEAD@{0}: commit: v3
678c5a5 HEAD@{1}: commit: v2
c34a6ba HEAD@{2}: commit (initial): v1

# 查看readme.md文件内容
reset shuai$ cat readme.md 
v3

### 向readme文件添加一行数据，并提交到本地仓库
reset shuai$ echo "new line" >> readme.md
reset shuai$ cat readme.md 
v3new line
reset shuai$ git commit -a -m "commit new line v4"
[master a5e5191] commit new line v4
 1 file changed, 1 insertion(+), 1 deletion(-)
reset shuai$ git log --oneline
a5e5191 (HEAD -> master) commit new line v4
63cd517 v3
678c5a5 v2
c34a6ba v1

### 可以对比工作区、暂存区、本地仓库中代码的差异。此时他们三个并无差异
# 对比工作区和暂存区中，差异
reset shuai$ git diff readme.md 

# 对比 暂存区 和本地仓库中内容差异
reset shuai$ git diff --cached readme.md 


### 执行reset回退
# 回退到上一个提交记录
reset shuai$ git reset --soft HEAD^
# 对比工作区和暂存区文件差异，此时并无差异
reset shuai$ git diff readme.md 

# 对比暂存区和仓库中文件差异
reset shuai$ git diff --cached readme.md 
diff --git a/readme.md b/readme.md
index 04d0d54..6f67266 100644
--- a/readme.md
+++ b/readme.md
@@ -1 +1 @@
-v3
\ No newline at end of file
+v3new line

# 对比工作区和仓库中文件的差异
reset shuai$ git diff HEAD readme.md 
diff --git a/readme.md b/readme.md
index 04d0d54..6f67266 100644
--- a/readme.md
+++ b/readme.md
@@ -1 +1 @@
-v3
\ No newline at end of file
+v3new line

### 查看提交日志(reflog能看到所有记录)
# 使用log查看历史版本记录
reset shuai$ git log --oneline
63cd517 (HEAD -> master) v3
678c5a5 v2
c34a6ba v1

# 使用reflog查看历史记录
reset shuai$ git reflog
63cd517 (HEAD -> master) HEAD@{0}: reset: moving to HEAD^
a5e5191 HEAD@{1}: commit: commit new line v4
63cd517 (HEAD -> master) HEAD@{2}: commit: v3
678c5a5 HEAD@{3}: commit: v2
c34a6ba HEAD@{4}: commit (initial): v1


### 恢复到回退前版本
# 查看工作目录中文件状态
reset shuai$ git status
On branch master
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        modified:   readme.md
# 此时将文件退回了暂存区中，通过commit提交即可。

# 提交记录
reset shuai$ git commit -m "append newline v5"
[master d352dd8] append newline v5
 1 file changed, 1 insertion(+), 1 deletion(-)
 
 # 查看目录中文件状态
reset shuai$ git status
On branch master
nothing to commit, working tree clean

# 使用log查看历史记录
reset shuai$ git log --oneline
d352dd8 (HEAD -> master) append newline v5
63cd517 v3
678c5a5 v2
c34a6ba v1
# 已经看不到第4次提交

# 使用reflog查看历史记录，可以查看到所有历史记录
reset shuai$ git reflog
d352dd8 (HEAD -> master) HEAD@{0}: commit: append newline v5
63cd517 HEAD@{1}: reset: moving to HEAD^
a5e5191 HEAD@{2}: commit: commit new line v4
63cd517 HEAD@{3}: commit: v3
678c5a5 HEAD@{4}: commit: v2
c34a6ba HEAD@{5}: commit (initial): v1

# 通过回退 a5e5191，还有回退到第4次提交
reset shuai$ git reset --soft a5e5191

reset shuai$ git log --oneline
a5e5191 (HEAD -> master) commit new line v4
63cd517 v3
678c5a5 v2
c34a6ba v1

# 会生成一条新的commit提交日志，可以看出a5e5191和第4次提交的commit一样，说明已经回退到第4次
reset shuai$ git reflog
a5e5191 (HEAD -> master) HEAD@{0}: reset: moving to a5e5191
d352dd8 HEAD@{1}: commit: append newline v5
63cd517 HEAD@{2}: reset: moving to HEAD^
a5e5191 (HEAD -> master) HEAD@{3}: commit: commit new line v4
63cd517 HEAD@{4}: commit: v3
678c5a5 HEAD@{5}: commit: v2
c34a6ba HEAD@{6}: commit (initial): v1
```

### mixed混合回退

mixed是混合的，中等的回退。该命令不仅修改仓库的HEAD指针，还将暂存区的数据进行了回退。但是工作区的代码状态不变

* 工作区和暂存区的内容出现了差异
* 暂存区和仓库中没有差异
* 工作区和仓库中 出现了差异

创建本地测试文件，新建readme.md文件，并添加内容

```bash
# 使用log查看提交历史记录
rest shuai$ git log --oneline
c45fa60 (HEAD -> master) v3
86d8436 v2
d5030ef v1

# 使用reflog查看历史记录
rest shuai$ git reflog
c45fa60 (HEAD -> master) HEAD@{0}: commit: v3
86d8436 HEAD@{1}: commit: v2
d5030ef HEAD@{2}: commit (initial): v1

### 新增一行数据，并提交到仓库中
# 新增一行数据
rest shuai$ echo "new line " >> readme.md 

# 提交数据
rest shuai$ git commit -a -m "第4次提交，add new line"
[master 7bce542] 第4次提交，add new line
 1 file changed, 1 insertion(+)
 
 # 查看此时仓库的日志
rest shuai$ git log --oneline
7bce542 (HEAD -> master) 第4次提交，add new line
c45fa60 v3
86d8436 v2
d5030ef v1

### 现在对比工作区、暂存区、本地仓库中文件的差异。此时3者并无差异
# 对比工作区和暂存区文件差异
rest shuai$ git diff readme.md 
# 对比暂存区和仓库文件的差异
rest shuai$ git diff --cached readme.md 
# 对比工作区和仓库文件的差异
rest shuai$ git diff HEAD readme.md 

### 执行回退操作，退回v3版本
rest shuai$ git reset --mixed HEAD^
# 说明回退后，有未被追踪的文件
Unstaged changes after reset:
# 表示readme.md文件修改后，未被追踪。即修改后，文件未添加到暂存区的状态
M       readme.md


### 回退后，对比文件差异
# 对比工作区和暂存区中文件差异
rest shuai$ git diff readme.md 
diff --git a/readme.md b/readme.md
index 46b68dc..36125a4 100644
--- a/readme.md
+++ b/readme.md
@@ -1 +1,2 @@
 hello world v3
+new line 

# 对比暂存区和仓库中文件差异
rest shuai$ git diff --cached readme.md 

#对比工作区和仓库中文件差异
rest shuai$ git diff HEAD readme.md 
diff --git a/readme.md b/readme.md
index 46b68dc..36125a4 100644
--- a/readme.md
+++ b/readme.md
@@ -1 +1,2 @@
 hello world v3
+new line 


### 查看提交日志
# 使用log查看历史提交记录，第4次提交记录已经不存在
rest shuai$ git log --oneline
c45fa60 (HEAD -> master) v3
86d8436 v2
d5030ef v1

# 使用reflog查看提交记录，第4次提交记录仍然存在
rest shuai$ git reflog
c45fa60 (HEAD -> master) HEAD@{0}: reset: moving to HEAD^
7bce542 HEAD@{1}: commit: 第4次提交，add new line
c45fa60 (HEAD -> master) HEAD@{2}: commit: v3
86d8436 HEAD@{3}: commit: v2
d5030ef HEAD@{4}: commit (initial): v1


### 恢复到回退之前版本
rest shuai$ git status
On branch master
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   readme.md

no changes added to commit (use "git add" and/or "git commit -a")
# 添加到暂存区
rest shuai$ git add .
#提交到仓库
rest shuai$ git commit -m "append new line v5"

# 使用log查看提交历史
rest shuai$ git log --oneline
ead44f4 (HEAD -> master) append new line v5
c45fa60 v3
86d8436 v2
d5030ef v1

#使用reflog查看提交历史
rest shuai$ git reflog
ead44f4 (HEAD -> master) HEAD@{0}: commit: append new line v5
c45fa60 HEAD@{1}: reset: moving to HEAD^
7bce542 HEAD@{2}: commit: 第4次提交，add new line
c45fa60 HEAD@{3}: commit: v3
86d8436 HEAD@{4}: commit: v2
d5030ef HEAD@{5}: commit (initial): v1

# 执行回退到第四次提交7bce542
rest shuai$ git reset --mixed 7bce542
# 查看文件状态
rest shuai$ git status
On branch master
nothing to commit, working tree clean

# log查看版本提交历史
rest shuai$ git log --oneline
7bce542 (HEAD -> master) 第4次提交，add new line
c45fa60 v3
86d8436 v2
d5030ef v1

# 使用reflog查看提交的历史
rest shuai$ git reflog
7bce542 (HEAD -> master) HEAD@{0}: reset: moving to 7bce542
ead44f4 HEAD@{1}: commit: append new line v5
c45fa60 HEAD@{2}: reset: moving to HEAD^
7bce542 (HEAD -> master) HEAD@{3}: commit: 第4次提交，add new line
c45fa60 HEAD@{4}: commit: v3
86d8436 HEAD@{5}: commit: v2
d5030ef HEAD@{6}: commit (initial): v1
```

### hard强回退

`git reset --hard commit-id`回退到指定版本，hard强硬的，严格的回退。该参数的回退，会把工作区和暂存区中的数据都回退到指定版本。【该命令谨慎使用】

* 移动HEAD执行，回退仓库中的记录
* 暂存区内容的回退到HEAD指针指向的版本
* 工作区内容，回退到HEAD指针指向的版本

本地创建测试代码库，创建出readme.md文件，git init初始化项目

```bash
# 使用log查看历史记录
reset shuai$ git log --oneline
229cc1f (HEAD -> master) v3
be516b5 v2
04b38f8 v1

#使用reflog查看历史记录
reset shuai$ git reflog
229cc1f (HEAD -> master) HEAD@{0}: commit: v3
be516b5 HEAD@{1}: commit: v2
04b38f8 HEAD@{2}: commit (initial): v1

# 向readme.md文件新增数据new line
$ echo "new line" >> readme.md 

# 提交到本地仓库
reset shuai$ git commit -a -m "第4次提交，新增内容new line "
[master 6804892] 第4次提交，新增内容new line
 1 file changed, 1 insertion(+), 1 deletion(-)

# 查看历史日志
reset shuai$ git log --oneline
6804892 (HEAD -> master) 第4次提交，新增内容new line
229cc1f v3
be516b5 v2
04b38f8 v1

### 执行回退操作，退回到v3版本
# 回退到前一个提交记录的版本
reset shuai$ git reset --hard HEAD^
# HEAD现在位于 229cc1f 提交记录
HEAD is now at 229cc1f v3

### 回退后对比文件差异
# 对比工作区和暂存区
reset shuai$ git diff readme.md 
# 对比暂存区和仓库
reset shuai$ git diff --cached readme.md 
# 对比工作区和仓库
reset shuai$ git diff HEAD readme.md 

### 查看提交日志记录
# 使用log查看提交历史记录
reset shuai$ git log --oneline
229cc1f (HEAD -> master) v3
be516b5 v2
04b38f8 v1

# 使用reflog查看提交历史记录
reset shuai$ git reflog
229cc1f (HEAD -> master) HEAD@{0}: reset: moving to HEAD^
6804892 HEAD@{1}: commit: 第4次提交，新增内容new line
229cc1f (HEAD -> master) HEAD@{2}: commit: v3
be516b5 HEAD@{3}: commit: v2
04b38f8 HEAD@{4}: commit (initial): v1

### 恢复到回退前版本（如果要恢复到回退之前的版本，也只能使用git reset --hard命令操作）
# 查看文件状态，工作目录是非常干净
reset shuai$ git status
On branch master
nothing to commit, working tree clean

# 1查看下可以回退的历史版本
reset shuai$ git reflog
229cc1f (HEAD -> master) HEAD@{0}: reset: moving to HEAD^
6804892 HEAD@{1}: commit: 第4次提交，新增内容new line
229cc1f (HEAD -> master) HEAD@{2}: commit: v3
be516b5 HEAD@{3}: commit: v2
04b38f8 HEAD@{4}: commit (initial): v1

# 2，执行回退，回退到第4次提交，即6804892
reset shuai$ git reset --hard 6804892
HEAD is now at 6804892 第4次提交，新增内容new line

# 3 查看文件状态
reset shuai$ git status
On branch master
nothing to commit, working tree clean

# 4使用log命令查看版本历史
reset shuai$ git log --oneline
6804892 (HEAD -> master) 第4次提交，新增内容new line
229cc1f v3
be516b5 v2
04b38f8 v1

#5使用reflog命令查看可回退的版本历史
reset shuai$ git reflog
6804892 (HEAD -> master) HEAD@{0}: reset: moving to 6804892
229cc1f HEAD@{1}: reset: moving to HEAD^
6804892 (HEAD -> master) HEAD@{2}: commit: 第4次提交，新增内容new line
229cc1f HEAD@{3}: commit: v3
be516b5 HEAD@{4}: commit: v2
04b38f8 HEAD@{5}: commit (initial): v1
```

## revert回退代码

* 撤销远程仓库的一定要使用revert，如果使用reset需要强制推送，会丢失部分提交记录，影响其他人

`revert` 命令会在历史中增加一条`commit`记录，用来撤销之前的`commit`提交记录。 `git revert`命令用来撤销之前提交的版本记录，来达到修改的目的。

![4](http://cdn.go99.top/docs/other/git/restore4.webp)

新建一个测试代码git仓库，提交记录如下

```bash
revert shuai$ git alog
* ec2ab45 (HEAD -> master) v4 w
* 00e34c1 v3 w
* cb4a3c0 v2
* 6988773 v1
```

![5](http://cdn.go99.top/docs/other/git/restore5.webp)

此时head指针在v4，即`ec2ab45`的commit上。需要把head指向v2即可达到目的。

> 根据之前的reset，可以很容易操作`git reset --hard ec2ab45`但是这样存在弊端，会把v3和v4的提交给隐藏掉，如果有天突然觉得v3和v4版本是正确的需要恢复，就不那么容易操作，【当然也可通过reflog可以查看，然后恢复】
由于会撤销掉一些commit记录，很多公司是禁止使用reset命令。这时就必须是revert。

```bash
# 撤销v4提交记录，然后会出现一个编辑文本框，如下面编辑框
revert shuai$ git revert ec2ab45
[master cf8a19a] Revert "v4 w"
 1 file changed, 1 insertion(+), 2 deletions(-)
 
# 撤销v3提交记录，然后会出现一个编辑文本框，如下面编辑框
revert shuai$ git revert 00e34c1
[master 1788aaa] Revert "v3 w"
 1 file changed, 1 insertion(+), 2 deletions(-)

# 查看历史，可以看到新增了revert v4和revert v3
revert shuai$ git log --oneline
1788aaa (HEAD -> master) Revert "v3 w"
cf8a19a Revert "v4 w"
ec2ab45 v4 w
00e34c1 v3 w
cb4a3c0 v2
6988773 v1
```

revert命令后的编辑弹出框，可以进行编辑后保存 revert命令的作用是通过创建一个新的版本commit，来回退到目标版本，HEAD指针指向了新生成的commit，而不是原来的目标commit。

**一次revert多个记录**

第一种方式：`git revert`   ，顺序是从后向前，否次会多次冲突。
第二种方式：`git revert ...`，该操作只是回退了5和6，不包括开头的4。并且要注意中间是3个点
第三种方式：`git revert ^..`, 该操作回退了4、5、6三个提交记录。中间使用2个点。

假如当前 git commit 链是 `A -> B -> C -> D`

如果想把`B，C，D`都给`revert`，除了一个一个revert之外，还可以使用range revert `git revert B^..D` 等价于 `git revert A...D`

用法：

`B^..D` 代表区间`[B,D]`,包括B也包括D，其中B提交在前，D提交在后，D为起点commit。

`A...D` 代表一个左开右闭区间`(A,D]`,不包括A,包括D. 其中D为起点commit，A为终点commit的下一个commit

这样就把B,C,D都给revert了，变成：

`A-> B ->C -> D -> D'-> C' -> B'`

如果我们想把这三个revert不自动生成三个新的commit，而是用一个commit完成，可以这样：

```bash
$ git revert -n BEFORE_COMMIT^..AFTER_COMMIT  
$ git commit -m "revert BEFORE_COMMIT to AFTER_COMMIT"
```

## restore回退代码

`git restore <filename>` 撤销 工作区的内容
`git restore --staged <filename>` 撤销 暂存区的内容回退到工作区

**从暂存区回退内容**

创建一个项目，新建readme.txt文件。新建readme.txt文件
```bash
# log查看提交历史记录，进行了4次提交
MacBook-Pro:restore shuai$ git log --oneline
d9531bd (HEAD -> master) add file
4cff528 v3
bdaa5d3 v2
2688ed0 v1

### 然后又在readme.txt文件中增加一行
# 1.对文件readme新增一行内容，这是错误内容。操作目的是从暂存区撤销，并在本地也撤销
restore shuai$ echo "this is wrong!  " >> readme.txt

# 2.将内容添加到暂存区。【因为这时还不知道是错的内容】
restore shuai$ git add .

# 3.查看文件状态，以及提交到了暂存区
restore shuai$ git status
On branch master
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        modified:   readme.txt

# 4.通过restore --staged可以将暂存区内容回退到工作区
restore shuai$ git restore --staged .

# 5.查看文件状态，已经把添加的错误内容退回到了工作区
restore shuai$ git status
On branch master
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   readme.txt

no changes added to commit (use "git add" and/or "git commit -a")

# 6. 将工作区的内容撤销
restore shuai$ git restore .
```

**从仓库中回退内容**

```bash
# 1.对文件readme新增一行内容，这是错误内容。
restore shuai$ echo "this is wrong!  " >> readme.txt

# 2.将内容添加到暂存区
restore shuai$ git add .

# 3.将暂存区的内容，提交到本地仓库
restore shuai$ git commit -m "add wrong content"
[master cda7c9b] add wrong content
 1 file changed, 1 insertion(+)
 
# 4.查看git状态
restore shuai$ git status
On branch master
nothing to commit, working tree clean

# 5.查看提交记录
restore shuai$ git log --oneline
cda7c9b (HEAD -> master) add wrong content
d9531bd add file
4cff528 v3
bdaa5d3 v2
2688ed0 v1

# 使用reset 默认参数【--mixed】，可以回退暂存区和本地仓库内容，这样还可以在工作区继续修改编辑
# 也可使用--soft参数，只回退暂存区内容
# 也可使用--hard参数，同时回退工作区，暂存区，本地仓库的内容。把修改的内容全部清空回退，无法再次编辑
# 6.使用reset可以回退本地仓库的记录，git reset head～n，表示回退n个提交记录
restore shuai$ git reset HEAD^
Unstaged changes after reset:
M       readme.txt
```
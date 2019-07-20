# Git常用操作

## Git删除分支

* 删除本地分支  
  正常删除：`git branch -d 分支`
  强制删除：`git branch -D 分支`
* 删除本地远程分支  
  正常删除：`git branch -rd 分支`
  强制删除：`git branch -rD 分支`
* 删除远程分支  
  `git push origin --delete 分支 `
---

## 修改提交记录内容

* **修改最近一次提交**  
  有时候我们提交完了才发现漏掉了几个文件没有添加，或者提交信息写错了。 此时，可以运行带有 `--amend` 选项的提交命令尝试重新提交：

  `$ git commit --amend`
  这个命令会将暂存区中的文件提交。 如果自上次提交以来你还未做任何修改（例如，在上次提交后马上执行了此命令），那么快照会保持不变，而你所修改的只是提交信息。
  文本编辑器启动后，可以看到之前的提交信息。 编辑后保存会覆盖原来的提交信息。
  例如，你提交后发现忘记了暂存某些需要的修改，可以像下面这样操作：
  ```
  $ git commit -m 'initial commit'
  $ git add forgotten_file
  $ git commit --amend
  ```
  最终你只会有一个提交 - 第二次提交将代替第一次提交的结果。

* **取消暂存文件**（修改撤回到工作区）  
  `HEAD`:当前版本，`HEAD^`：上一个版本,`HEAD~100`：前100个版本
  取消某个文件：`git reset HEAD <filename>`
  取消最近提交：`git reset HEAD^`(这里可以使用参数 `--soft`：保留修改，`--hard`：删除修改)
  备注：
  ```
  回退到上一个版本：$ git reset --hard HEAD^
  还原到删除的版本：$ git reset --hard 1094a
  ```
  如果之前的窗口已经关闭无法找到commit-id，可以通过`git reflog`（查看命令历史）命令找到

* **撤消对文件的修改**(这个命令要慎用，会删除工作区修改)  
  `git checkout -- <filename>`
  `git checkout .`撤销全部修改
---

## 操作远程分支

查看远程主机网址：`git remote -v`  
查看该主机的详细信息:`git remote show <主机名>`
查看远程主机上的所有分支：`git ls-remote -h <主机名>`  

---

### 版本回退

撤销某个提交的修改：`git revert commitid`,重新生成一条记录
回滚到某个提交：`git reset commitid`, 如果已经提交到远程仓库推送需要`-f`：`git push origin master -f`，删除之前的记录

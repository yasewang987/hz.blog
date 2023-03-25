# Git常用操作
## Git常用命令

```bash
# 从tag标签迁分支
git checkout -b branchname tagname

# 从commit签分支,commitid取前8位
git checkou -b branchname commid_id 
```
## Git删除分支

* 删除本地分支  
  正常删除：`git branch -d 分支`
  强制删除：`git branch -D 分支`
* 删除本地远程分支  
  正常删除：`git branch -rd 分支`
  强制删除：`git branch -rD 分支`
* 删除远程分支  
  `git push origin --delete 分支 `


### Git操作脚本-删除Git远程分支

脚本名称：del.sh

使用方法：调用del.sh脚本，输入2个参数：1.gitclone远程到本地的目录,2.需要保留的分支。

例子： ./del.sh schoolpal "develop,201906_develop" （这个例子中会进入schoolpal文件夹，删除除了`develop`和`201906_develop`的其他分支）。

```sh
#!/bin/bash
delpath="$1"
holdbranchstr="$2"
holdbranchs=${holdbranchstr//,/ }
cd $delpath;
allbranchs=`git branch -a`;
delarr=()
echo -e '\033[31m 下面远程仓库分支会被删除，请仔细核对！！！ \033[0m';
for br in $allbranchs;
do
    br_name=`echo $br | grep '/' | cut -d '/' -f3`
    if [[ "" != "$br_name" && "master" != "$br_name" && "HEAD" != "$br_name" ]]; then
        needel="Y";
        for hbr in $holdbranchs;
        do
            if [[ "$hbr" = "$br_name" ]];then
                needel="N";
                break;
            fi;
        done;
        if [[ "Y" = "$needel" ]];then
            echo "$br -->> $br_name"
            delarr[${#delarr[@]}]=$br_name
        fi;
    fi;
done;

read -p " 是否确认删除上面的远程仓库分支 (y/n)[n]: " answer

if [[ "$answer" = "Y" || "$answer" = "y" ]]; then 
    for dbr in ${delarr[@]};
    do
        git push origin --delete $dbr;
        echo "远程分支[ $dbr ]已经删除！";
    done;
else
    echo "已忽略！";
fi;

exit 0
```

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

## Git添加子仓库

```bash
# 添加子模块
git submodule add <submodule_url>

# 获取子模块内容
git submodule init
git submodule update --init --recursive
# 或者在拉代码时直接加上--recurse-submodules
git clone xxxx --recurse-submodules

# 更新子模块（或者可以直接进入子模块目录直接拉新代码）
git submodule foreach 'git pull origin master'

# 删除子模块
# 删除.git/config相关模块内容
git submodule deinit --force project-sub-1
# 删除.gitmodules相关模块内容
git rm project-sub-1
```

## Git删除未跟踪文件

```bash
# 删除 untracked files
git clean -f
 
# 连 untracked 的目录也一起删掉
git clean -fd
 
# 连 gitignore 的untrack 文件/目录也一起删掉 （慎用，一般这个是用来删掉编译出来的 .o之类的文件用的）
git clean -xfd
 
# 在用上述 git clean 前，建议加上 -n 参数来先看看会删掉哪些文件，防止重要文件被误删
git clean -nxfd
git clean -nf
git clean -nfd
```

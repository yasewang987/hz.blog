# Git命令钩子

git hooks 是git的一种钩子机制，可以让用户在git操作的各个阶段执行自定义的逻辑。

git hooks 在项目根目录的 .git/hooks 下面配置，配置文件的名称是固定的，使用shell语法编写

里面包含 pre-commit , pre-push , commit-msg等多种钩子，具体可以查看 [Git钩子](https://git-scm.com/book/zh/v2/%E8%87%AA%E5%AE%9A%E4%B9%89-Git-Git-%E9%92%A9%E5%AD%90)

## pre-commit 举例

```bash
#!/bin/bash
:set ff-unix

# 如果在commit时有未添加到暂存区的文件，拒绝提交
diff=$(git diff)
if [[ $diff !=0 ]];then
  echo "some files is changed but not add to stash, git commit denied"
  exit 1
fi

# 读取git暂存区的.js 和 .vue文件
files=$(git diff --cached --name-only | grep -E '\.js$|\.vue$')

# 在控制台打印文件列表
echo $files
# Prevent ESLint help message if no files matched

# 如果文件列表为空，退出执行环境，继续执行commit操作
if [[ $files = "" ]] ; then
    exit 0
fi

failed=0

# 循环文件列表
for file in ${files}; do
    # 判断文件是否存在(-e 表示 exists)
    if [ ! -e $file ] ; then
        continue
    fi
    
    # 在控制台打印该文件的eslint检验结果，如果通过，则返回空
    git show :$file | ./node_modules/.bin/eslint $file --color --fix
    
    # 文件未通过eslint检验，标记为失败
    if [[ $? != 0 ]] ; then
        failed=1
    fi
done;

# 有文件未通过检验，退出执行环境，中断commit操作
if [[ $failed != 0 ]] ; then
    echo "❌  ESLint failed, git commit denied"
    exit $failed
fi
```
从文件源码可以看出，git 将会在你将文件添加到暂存区后，执行eslint操作，通不过操作的时候，这次操作将被取消 (shell exit 1)。

* 注意，需要使用unix文件编码:git hooks 需要的 shell脚本,需要是unix文件格式才能正常运行，否则windows10系统会抛出换行符错误，而macOS则会抛出 pre-commit 不是文件或者文件夹的错误。

需要打开bash，使用如下命令修改，方可正常使用。

```bash
vi ./.git/hooks/pre-commit     # 打开配置文件
:set ff-unix                   # 设置文件格式为unix文件,(ff意为fileformat)
:wq                            # 保存修改并退出
```

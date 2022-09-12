# Git-Submodule

当我们`git clone`某一个git之后，在主目录下会有如下一个文件夹`.git`和文件`.gitmodules`(如果父仓下含有子仓),打开`.gitmodules`文件，可以看到父仓下所包含的所有的子仓库的信息，一般会有子仓名字，挂载路径，下载地址，有时也会写上`branch`。

```bash
# 初始化子仓库配置，会发现在.git文件夹下多了config
# git submodule init的作用就是将.gitmodules的内容复制一份到config,只不过其中path变成了active属性
# 有时候可能不需要clone所有的子仓，这时我们就可以对config文件进行手动的修改，不clone某些子仓的代码
git submodule init

# 以多次使用命令来添加需要clone的子仓
git submodule init <submodule name 1>  <submodule name 2>

# 拉去子仓库代码
git submodule update
```
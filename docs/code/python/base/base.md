# python基础资料

## conda和pip的区别

conda是一个通用的包管理器，意思是什么语言的包都可以用其进行管理，`Anaconda`作为Python的发行版，相当于在Python的基础上自带了常用第三方库，而`Miniconda`则相当于是一个conda环境的安装程序，只包含了conda及其依赖项，这样就可以减少一些不需要的第三方库的安装，所以`Miniconda`所占用的空间很小。

### conda和pip安装库的区别

在`conda`中，无论在哪个环境下，只要通过`conda install xxx`的方式安装的库都会放在`pkgs`目录下，如:`E:\python\anaconda\pkgs\numpy-1.18.1-py36h48dd78f_1`。这样的好处就是，当在某个环境下已经下载好了某个库，再在另一个环境中还需要这个库时，就可以直接从`pkgs`目录下将该库复制至新环境（将这个库的`Lib\site-packages中`的文件复制到当前新环境下`Lib`中的第三方库中，也即`Lib\site-packages`中，这个过程相当于通过`pip install xxx`进行了安装）而不用重复下载。

### conda和pip卸载库的区别

`pip`是在特定的环境中进行库的安装，所以卸载库也是一样的道理，通过`pip uninstall xxx`就可以将该环境下`Lib\site-packages`中对应的库进行卸载了。

如果通过`conda uninstall xxx`删除当前环境下某个库时，删除的只是当前环境下`site-packages`目录中该库的内容，它的效果和通过`pip uninstall xxx`是一样的。如果再到另一个环境中通过`conda install xxx`下载这个库，则还是通过将pkgs目录下的库复制到当前环境。若要清空这个`pkgs`下的已下载库，可以通过命令`conda clean -h`进行实现。
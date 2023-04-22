# Python安装相关

## python常用命令

```bash
# 豆瓣的源比清华的块很多
pip install -i https://pypi.douban.com/simple xxx

# 安装本地whl
pip install xxxx.whl

# 升级pip
python -m pip install --upgrade pip

# 能显示所有的依赖包及其子包，可以通过 pip install pipdeptree 安装
pipdeptree -p xxx
# 只能显示依赖的包
pip show xxx

# 下载whl文件
pip download shapely==2.0.1 -d /tmp
```

## miniconda安装管理

```bash
# 下载最新安装脚本：https://mirrors.bfsu.edu.cn/anaconda/miniconda
wget https://mirrors.bfsu.edu.cn/anaconda/miniconda/Miniconda3-py38_22.11.1-1-Linux-x86_64.sh

# 安装(默认会在安装在用户目录下 $HOME/miniconda3)
sh Miniconda3-py38_22.11.1-1-Linux-x86_64.sh

# 添加环境变量（WSL中不会自动添加）
export PATH=$HOME/miniconda3/bin:$PATH

# 环境列表查看
conda env list
# 新建虚拟环境
conda create -n myvenv python=3.8
# 克隆环境
conda create -n myvenv --clone base
# 进入环境
conda activate base
# 退出环境
conda deactivate
```

## virtualenv安装

`virtualenv`的作用是创建独立的python虚拟环境。

* 安装`virtualenv`

```bash
pip install virtualenv

# 其他
pip3 install virtualenv
```

* 创建虚拟环境

```bash
# 准备目录
mkdir -p /opt/mytest && cd /opt/mytest

# 创建虚拟环境
# 默认python版本
virtualenv venv
# 指定python版本
virtualenv -p /usr/bin/python2.7 venv
virtualenv -p /usr/bin/python3.6 venv
```

* 进入/退出 虚拟环境

```bash
# 进入
source venv/bin/activate
# 退出
deactivate
```

* 删除虚拟环境(直接删除虚拟环境文件夹即可)

```bash
rm -rf venv
```

* 迁移虚拟环境

```bash
# 导出本地虚拟环境依赖项
pip freeze > requirements.txt

# 到目标机器上还原依赖项
pip install -r requirements.txt
```

## venv虚拟环境

* python3.3之后自带venv的虚拟环境

```bash
# 创建虚拟环境
python3 -m venv /home/mypython/env3
python3 -m venv /home/mypython/env3 /home/mypython/env4

# 激活虚拟环境
source /home/mypython/env3/bin/activate

# 激活虚拟环境后安装依赖
(env3): pip install xxxx

# 退出虚拟环境
deactivate

# 未激活虚拟环境安装依赖
/home/mypython/env3/bin/pip install xxxx
```

## 安装pip

```bash
# 下载脚本
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
# 安装（用哪个版本的 Python 运行安装脚本，pip 就被关联到哪个版本）
python3.7 get-pip.py
# 多版本共存时安装包
python3.7 -m pip install xxxx
```

## pyinstaller打包应用

使用 pip 安装`pyinstaller`

```bash
pip install pyinstaller
```

打包python应用

```bash
pyinstaller -F app.py
```

如果上面的命令执行时出现提示：`PyInstaller does not include a pre-compiled bootloader for your platform`,那么代表你需要去安装`bootloader`, 安装参考地址：https://pyinstaller.readthedocs.io/en/stable/bootloader-building.html

简要安装流程

```bash
# 前置安装(debian,ubuntu)
apt-get install build-essential zlib1g-dev
# 前置安装(Fedora, RedHat)
sudo yum groupinstall "Development Tools"
sudo yum install zlib-devel

# 到 pypi 上下载 pyinstaller 源码，并解压，进入到解压的目录。
cd bootloader
python ./waf all
# 执行完上面的命令之后会在PyInstaller的安装目录中出现对应系统架构的bootloader，里面包含run，run_d
```

* 安装完上面的bootloader之后，如果打包的时候还是报错，主要一下打包时的提示信息中`Bootloader`的加载位置，目前在`mips64`平台上打包时会去`/usr/local/lib/python3.7/dist-packages/PyInstaller/bootloader/Linux-64bit-unknown/run` 找，但是上面安装的会生成 `Linux-64bit-mips`版本的bootloader，这个时候只需要将`Linux-64bit-mips`复制一份改成`Linux-64bit-unknown`即可

## python镜像无用内容清理

```bash
rm -rf ~/.cache
```

## VSCode相关

1. 安装 `python` 扩展
1. 创建任意 `test.py` 文件，写上测试代码
1. `ctrl + shift + p` 之后输入python，选择 `python:select interpreter` 选择对应的python环境

## torch包安装验证

1. 到 [pytorch官网](https://pytorch.org/get-started/locally/#windows-prerequisites) 找到对应的版本安装命令。
1. 安装完之后验证
    ```bash
    ### GPU
    import torch
    torch.cuda.is_available()
    # 验证gpu环境
    torch.zeros([2,5]).cuda()

    ### CPU
    import torch
    x = torch.rand(5,3)
    print(x)
    ```
# python基础资料

## 安装pip

```bash
# 下载脚本
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
# 安装（用哪个版本的 Python 运行安装脚本，pip 就被关联到哪个版本）
python3.7 get-pip.py
# 多版本共存时安装包
python3.7 -m pip install xxxx
```

## python常用命令

```bash
# 豆瓣的源比清华的块很多
pip install -i https://pypi.douban.com/simple xxx

# 升级pip
python -m pip install --upgrade pip
```
## python查看第三方库依赖的包

```bash
# 能显示所有的依赖包及其子包，可以通过 pip install pipdeptree 安装
pipdeptree -p xxx
# 只能显示依赖的包
pip show xxx
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

## python项目源码编译

```bash
# 直接编译安装
python setup.py install

# 编译生成whl包,在dist目录下
python setup.py bdist_wheel
```

## python镜像无用内容清理

```bash
rm -rf ~/.cache
```
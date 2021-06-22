# python相关资料

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
pip install -I -i http://pypi.douban.com/simple/ --trusted-host pypi.douban.com xxx

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
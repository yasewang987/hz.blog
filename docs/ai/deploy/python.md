# python相关资料

## python常用命令

```bash
# 豆瓣的源比清华的块很多
pip install xxx -I -i http://pypi.douban.com/simple/ --trusted-host pypi.douban.com

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
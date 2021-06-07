# python相关资料

## python查看第三方库依赖的包

```bash
# 能显示所有的依赖包及其子包，可以通过 pip install pipdeptree 安装
pipdeptree -p xxx
# 只能显示依赖的包
pip show xxx
```
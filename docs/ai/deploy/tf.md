# tensorflow 安装

## tensorflow常用镜像

`arrch64/arm64` 镜像：
1. https://github.com/richliu/tensorflow-aarch64/tree/master/files/tensorflow
1. https://github.com/lhelontra/tensorflow-on-arm/releases
## tensorflow正常安装

官网参考地址：https://www.tensorflow.org/install/pip?hl=zh-cn#system-install

```bash
sudo apt update
sudo apt install python3-dev python3-pip python3-venv

pip3 install --user --upgrade tensorflow

# 1.x版本
pip3 install --user --upgrade tensorflow==1.15
```

## 使用docker打包生成新的 whl 包

拉去镜像(也可以拉去对应的镜像版本)：

```bash
docker pull tensorflow/tensorflow:devel
```

`docker run` 命令会在 `/tensorflow_src` 目录（即源代码树的根目录）中启动 `shell`。它会在该容器的 `/mnt` 目录中装载主机的当前目录，并通过一个环境变量将主机用户的信息传递给该容器，该环境变量用来设置权限，Docker 会让此过程变得很复杂。

```bash
docker run -it -w /tensorflow_src -v $PWD:/mnt -e HOST_PERMS="$(id -u):$(id -g)" tensorflow/tensorflow:devel bash

git pull # 拉取最新代码

# 切换对应的分支
git checkout -b rc1.15 origin/rc1.15

# 切换bazel版本（下载对应版本脚本 https://github.com/bazelbuild/bazel/releases ）
BAZEL_VERSION="0.26.1"
wget https://github.com/bazelbuild/bazel/releases/download/${BAZEL_VERSION}/bazel-${BAZEL_VERSION}-installer-linux-x86_64.sh
chmod +x bazel-${BAZEL_VERSION}-installer-linux-x86_64.sh
./bazel-${BAZEL_VERSION}-installer-linux-x86_64.sh
bazel version
```

接下来执行如下命令

```bash
# 配置构建 - 此时会提示用户回答构建配置问题
./configure

# 构建用于创建 pip 软件包的工具。
bazel build --config=opt //tensorflow/tools/pip_package:build_pip_package
# 构建1.x的版本执行
bazel build --config=v1 //tensorflow/tools/pip_package:build_pip_package

# 运行该工具，以创建 pip 软件包。
./bazel-bin/tensorflow/tools/pip_package/build_pip_package /mnt

# 调整文件在容器外部的所有权。
chown $HOST_PERMS /mnt/tensorflow-version-tags.whl
```

### 安装过程报错

无法下载 `io_bazel_rules_docker` : 在 `WORKSPACE` 文件前面加上下面内容

```
http_archive(
    name = "io_bazel_rules_docker",
    sha256 = "87fc6a2b128147a0a3039a2fd0b53cc1f2ed5adb8716f50756544a572999ae9a",
    strip_prefix = "rules_docker-0.8.1",
    urls = ["https://github.com/bazelbuild/rules_docker/archive/v0.8.1.tar.gz"],
)
```

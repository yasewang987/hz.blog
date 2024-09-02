# 曙光DCU适配

* 开发者社区：https://developer.hpccube.com/tool/
* 【重要】快速上手教程：https://developer.hpccube.com/gitbook//dcu_tutorial/index.html
* pytorch镜像仓库：https://sourcefind.cn/#/image/dcu/pytorch?activeName=overview
* dtk下载：https://cancon.hpccube.com:65024/1/main/
* 固件驱动下载（一般根据dtk版本下载）：https://cancon.hpccube.com:65024/6/main

## 常用命令

```bash
# dcu卡检测
lspci | grep -i Display
# 验证驱动安装状态
lsmod | grep dcu
# 非root用户请务必加入39组，才能正确调用DCU加速卡
usermod -a -G 39 $USER
# 设置dcu卡可见
export HIP_VISIBLE_DEVICES=0
# 显存使用查看（可用显存）
hy-smi --showmemavailable
# 显存已使用情况（百分比）
hy-smi --showmemuse
# 查看跑在显卡上的进程
hy-smi --showpids
```

## 部署教程

```bash
# 下载固件驱动
wget https://cancon.hpccube.com:65024/directlink/6/dtk-24.04%E9%A9%B1%E5%8A%A8/rock-5.7.1-6.2.18-V1.1.2.aio.run
# 安装驱动
chmod +x rock-5.7.1-6.2.18-V1.1.2.aio.run
# 重启
reboot

# 安装docker
# 下载镜像
docker pull image.sourcefind.cn:5000/dcu/admin/base/pytorch:2.1.0-ubuntu20.04-dtk24.04.1-py3.10

# 运行
# 若出现libhsa-runtime相关报错，启动参数请加上*-v /opt/hyhal:/opt/hyhal**；若物理机无/opt/hyhal，请下载hyhal并解压放置容器/opt/下
# -v /opt/hyhal:/opt/hyhal  # dtk23.10以上版本镜像需要-v挂载物理机目录/opt/hyhal
# --group-add video  设置用户附加组（普通用户使用DCU需要）
# --cap-add=SYS_PTRACE  添加权限（SYS_PTRACE|NET_ADMIN
# --security-opt seccomp=unconfined 安全配置（seccomp=unconfined|label=disable...）
docker run -itd \
--network=host \
--ipc=host \
--shm-size=16G \
--device=/dev/kfd \
--device=/dev/mkfd \
--device=/dev/dri \
-v /opt/hyhal:/opt/hyhal \
--group-add video \
--cap-add=SYS_PTRACE \
--security-opt seccomp=unconfined \
image.sourcefind.cn:5000/dcu/admin/base/pytorch:2.1.0-ubuntu20.04-dtk24.04.1-py3.10 \
/bin/bash

# vllm直接运行glm3
python3 -m vllm.entrypoints.openai.api_server \
--model ../resource/model/chatglm3_6b \
--max-num-batched-tokens 10240 \
--max-num-seqs 16 \
--host 127.0.0.1 \
--port 8010 \
--max-model-len 8192 \
--gpu-memory-utilization 0.9 \
--tensor-parallel-size 1 \
--dtype float16 \
--enforce-eager \
--served-model-name chatglm3 \
--trust-remote-code
```
# PaddleOCR

* 编译注意事项
    * 修改 `requirements.txt` 中的 `opencv-contrib-python` 版本限制去掉

* `hubserving-cpu`版本(需要修改`deploy/hubserving/ocr_system`中的配置和代码)

## 制作镜像

```bash
# 下载python3.7镜像
docker pull python3.7

# 启动镜像
docker run -itd --name paddle-dev python3.7 bash

# 进入容器安装相关依赖
docker exec -it paddle-dev bash

# 安装paddle，注意arm服务器需要用源码编译出whl本地安装
pip install -i https://mirror.baidu.com/pypi/simple paddlepaddle

# 安装paddlehub, 注意arm服务器需要源码编译出whl，其中依赖的paddle2onnx中的onnx版本依赖需要改一下
pip install -i https://mirror.baidu.com/pypi/simple paddlehub

# 下载paddleOCR代码
git clone https://github.com/PaddlePaddle/PaddleOCR.git

# 下载要部署的推理模型，参考paddleOCR官网，放到 PaddleOCR的inference目录
mkdir -p PaddleOCR/inference

# 修改 `requirements.txt` 中的 `opencv-contrib-python` 版本限制去掉
# 安装依赖项
pip install -i https://mirror.baidu.com/pypi/simple -r requirements.txt

# 直接加载模型看看有报错跟着参考【问题】解决
hub install deploy/hubserving/ocr_system/
hub serving start -m ocr_system

# 上述步骤确认没问题，退出容器，生成镜像
docker commit paddle-dev mypaddleocr:1
```

* 运行容器及测试脚本如下

```bash
# 运行容器
docker run -d -p 18888:8866 -w /PaddleOCR --name my-ocr mypaddleocr:1 sh -c "hub install deploy/hubserving/ocr_system/ && hub serving start -m ocr_system"

# 将图片base64编码之后写入test.txt中,格式如下
{"images": ["填入图片Base64编码(需要删除'data:image/jpg;base64,'）"]}

# 调用ocr容器验证
cat test.txt | curl -H 'Content-Type:application/json' -X POST -d @- http://localhost:18888/predict/ocr_system
```

## 官方dockerfile

只支持 `amd` 架构的cpu

```dockerfile
FROM registry.baidubce.com/paddlepaddle/paddle:2.0.0

# PaddleOCR base on Python3.7
RUN pip3.7 install --upgrade pip -i https://mirror.baidu.com/pypi/simple

RUN pip3.7 install paddlehub --upgrade -i https://mirror.baidu.com/pypi/simple

RUN git clone https://github.com/PaddlePaddle/PaddleOCR.git /PaddleOCR

WORKDIR /PaddleOCR

RUN pip3.7 install -r requirements.txt -i https://mirror.baidu.com/pypi/simple

RUN mkdir -p /PaddleOCR/inference/
# Download orc detect model(light version). if you want to change normal version, you can change ch_ppocr_mobile_v2.0_det_infer to ch_ppocr_server_v2.0_det_infer, also remember change det_model_dir in deploy/hubserving/ocr_system/params.py）
ADD {link} /PaddleOCR/inference/
RUN tar xf /PaddleOCR/inference/{file} -C /PaddleOCR/inference/

# Download direction classifier(light version). If you want to change normal version, you can change ch_ppocr_mobile_v2.0_cls_infer to ch_ppocr_mobile_v2.0_cls_infer, also remember change cls_model_dir in deploy/hubserving/ocr_system/params.py）
ADD {link} /PaddleOCR/inference/
RUN tar xf /PaddleOCR/inference/{file}.tar -C /PaddleOCR/inference/

# Download orc recognition model(light version). If you want to change normal version, you can change ch_ppocr_mobile_v2.0_rec_infer to ch_ppocr_server_v2.0_rec_infer, also remember change rec_model_dir in deploy/hubserving/ocr_system/params.py）
ADD {link} /PaddleOCR/inference/
RUN tar xf /PaddleOCR/inference/{file}.tar -C /PaddleOCR/inference/

EXPOSE 8866

CMD ["/bin/bash","-c","hub install deploy/hubserving/ocr_system/ && hub serving start -m ocr_system"]
```

## 问题

* arm服务器PaddleHub安装报错，onnx编译无法通过（是因为依赖的 paddle2onnx 中限制了onnx的版本 `<=1.9.0`）

```bash
# 下载paddle2onnx
git clone https://github.com/PaddlePaddle/Paddle2ONNX.git

# 将 `requirements.txt` 和 `setup.py` 中的onnx版本限制去掉
onnx <= 1.9.0 改成 onnx

# 安装
python setup.py install
```

* `OSError: Could not find library geos_c or load any of its variants ['libgeos_c.so.1', 'libgeos_c.so']`

```bash
# debian/ubuntu
apt install libgeos-dev

# centos
yum install geos-devel
```

* `libGL.so.1: cannot open shared object file: No such file or directory`

```bash
# debian/ubuntu
apt install libgl1
```
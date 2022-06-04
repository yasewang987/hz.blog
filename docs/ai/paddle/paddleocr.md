# PaddleOCR

* 编译注意事项
    * 修改 `requirements.txt` 中的 `opencv-contrib-python` 版本限制去掉

* `hubserving-cpu`版本(需要修改`deploy/hubserving/ocr_system`中的配置和代码)

## 制作镜像-CPU-hubserving

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

# arm服务器修改 `requirements.txt` 中的 `opencv-contrib-python` 版本限制去掉
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

## 制作镜像-GPU-hubserving

* 查看要求：

```bash
PaddlePaddle >= 2.1.2
Python 3.7
CUDA 10.1 / CUDA 10.2
cuDNN 7.6
```

* 制作镜像(到dockerhub上查找 nvidia/cuda:10.2-cudnn7.6镜像)

```bash
# 拉取基础镜像
docker pull nvidia/cuda:10.2-cudnn7-dev

# 源码编译python，需要注意configure配置路径
./configure --prefix=/usr/local --enable-optimizations

# 安装paddle-gpu版本
pip3 install paddlepaddle-gpu -i https://mirror.baidu.com/pypi/simple

# 安装paddlehub, 注意arm服务器需要源码编译出whl，其中依赖的paddle2onnx中的onnx版本依赖需要改一下
pip3 install -i https://mirror.baidu.com/pypi/simple paddlehub

# 下载paddleOCR代码
git clone https://github.com/PaddlePaddle/PaddleOCR.git

# 下载要部署的推理模型，参考paddleOCR官网，放到 PaddleOCR的inference目录
mkdir -p PaddleOCR/inference

# 安装依赖项
pip3 install -i https://mirror.baidu.com/pypi/simple -r requirements.txt

# 直接加载模型看看有报错跟着参考【问题】解决
hub install deploy/hubserving/ocr_system/
hub serving start -m ocr_system

# 上述步骤确认没问题，退出容器，生成镜像
docker commit paddle-dev mypaddleocr-gpu:1
```

* 启动验证

```bash
# 启动容器,如果hub命令在环境变量中，则直接用hub命令即可不用完整路径
docker run --gpus all -e CUDA_VISIBLE_DEVICES=1 -d -p 18888:8868 -w /root/PaddleOCR --name fc-ocr mypaddleocr-gpu:1 sh -c "/opt/bin/hub install deploy/hubserving/ocr_system/ && /opt/bin/hub serving start -c deploy/hubserving/ocr_system/config.json"

# 将图片base64编码之后写入test.txt中,格式如下
{"images": ["填入图片Base64编码(需要删除'data:image/jpg;base64,'）"]}

# 调用ocr容器验证
cat test.txt | curl -H 'Content-Type:application/json' -X POST -d @- http://localhost:18888/predict/ocr_system
```

## 制作镜像-CPU-pdserving-py

* 参考文档：`https://github.com/PaddlePaddle/PaddleOCR/blob/release/2.4/deploy/pdserving/README_CN.md`

```bash
# 下载python3.7镜像
docker pull python3.7

# 启动镜像
docker run -itd --name paddle-dev python3.7 bash

# 进入容器安装相关依赖
docker exec -it paddle-dev bash

# 修改里面的apt源，安装vim等
apt install -y vim
mv /etc/source.list /etc/source.list.back

# 安装paddle，注意arm服务器需要用源码编译出whl本地安装
pip install -i https://mirror.baidu.com/pypi/simple paddlepaddle

# 下载paddleOCR代码
git clone https://github.com/PaddlePaddle/PaddleOCR.git

# arm服务器修改 `requirements.txt` 中的 `opencv-contrib-python` 版本限制去掉
# 安装依赖项
pip install -i https://mirror.baidu.com/pypi/simple -r requirements.txt

# 安装基础依赖项
apt install libgl1

# 安装PaddleServing的运行环境
# 最新版本查看 https://github.com/PaddlePaddle/Serving 的最新release分支
pip install https://paddle-serving.bj.bcebos.com/test-dev/whl/paddle_serving_server-0.9.0.post102-py3-none-any.whl
pip install https://paddle-serving.bj.bcebos.com/test-dev/whl/paddle_serving_client-0.9.0-cp37-none-any.whl
pip install https://paddle-serving.bj.bcebos.com/test-dev/whl/paddle_serving_app-0.9.0-py3-none-any.whl

# 进入到运行目录
cd PaddleOCR/deploy/pdserving
# 下载并解压 OCR 文本检测模型
wget https://paddleocr.bj.bcebos.com/PP-OCRv3/chinese/ch_PP-OCRv3_det_infer.tar -O ch_PP-OCRv3_det_infer.tar && tar -xf ch_PP-OCRv3_det_infer.tar
# 下载并解压 OCR 文本识别模型
wget https://paddleocr.bj.bcebos.com/PP-OCRv3/chinese/ch_PP-OCRv3_rec_infer.tar -O ch_PP-OCRv3_rec_infer.tar &&  tar -xf ch_PP-OCRv3_rec_infer.tar

# 用安装的paddle_serving_client把下载的inference模型转换成易于server部署的模型格式
# 转换检测模型，需要注意看一下config.yml文件里面的模型位置来确定serving_server
python3 -m paddle_serving_client.convert --dirname ./ch_PP-OCRv3_det_infer/ \
                                         --model_filename inference.pdmodel          \
                                         --params_filename inference.pdiparams       \
                                         --serving_server ./ppocr_det_v3_serving/ \
                                         --serving_client ./ppocr_det_v3_client/

# 转换识别模型
python3 -m paddle_serving_client.convert --dirname ./ch_PP-OCRv3_rec_infer/ \
                                         --model_filename inference.pdmodel          \
                                         --params_filename inference.pdiparams       \
                                         --serving_server ./ppocr_rec_v3_serving/  \
                                         --serving_client ./ppocr_rec_v3_client/

# 调整 config.yml 中的并发个数获得最大的QPS, 一般检测和识别的并发数为2：1
det:
    #并发数，is_thread_op=True时，为线程并发；否则为进程并发
    concurrency: 8
    ...
rec:
    #并发数，is_thread_op=True时，为线程并发；否则为进程并发
    concurrency: 4
    ...

# 启动服务，运行日志保存在log.txt
python3 web_service.py &>log.txt &

# 查看log文件信息内容如下：
I0518 09:04:34.550848  4064 naive_executor.cc:102] ---  skip [sigmoid_0.tmp_0], fetch -> fetch
I0518 09:04:34.557600  4077 analysis_predictor.cc:1007] ======= optimize end =======
I0518 09:04:34.560288  4077 naive_executor.cc:102] ---  skip [feed], feed -> x
I0518 09:04:34.564229  4077 naive_executor.cc:102] ---  skip [sigmoid_0.tmp_0], fetch -> fetch
I0518 09:04:34.570278  4104 analysis_predictor.cc:1007] ======= optimize end =======
I0518 09:04:34.572505  4104 naive_executor.cc:102] ---  skip [feed], feed -> x
I0518 09:04:34.576280  4104 naive_executor.cc:102] ---  skip [sigmoid_0.tmp_0], fetch -> fetch
I0518 09:04:34.578187  4135 analysis_predictor.cc:1007] ======= optimize end =======
I0518 09:04:34.580248  4135 naive_executor.cc:102] ---  skip [feed], feed -> x
I0518 09:04:34.583575  4135 naive_executor.cc:102] ---  skip [sigmoid_0.tmp_0], fetch -> fetch

# 发送服务请求
python3 pipeline_http_client.py

# 上述步骤确认没问题，退出容器，生成镜像
docker commit paddle-dev mypaddleocr:1
```

* 运行容器及测试脚本如下

```bash
# 运行容器
docker run -d -p 18888:9998 -w /PaddleOCR/deploy/pdserving --name my-ocr mypaddleocr:1 python3 web_service.py

# 将图片base64编码之后写入test.txt中,格式如下
{"key":["image"], "value": ["填入图片Base64编码(需要删除'data:image/jpg;base64,'）"]}

# 调用ocr容器验证
cat test.txt | curl -H 'Content-Type:application/json' -X POST -d @- http://localhost:18888/ocr/prediction
```

## 制作镜像-CPU-pdserving-c++

### 服务端

```bash
# 下载python3.7镜像
docker pull python3.7

# 启动镜像
docker run -itd --name paddle-dev python3.7 bash

# 将pdserveing源码编译出来的server-whl安装
docker cp paddle_serving_server-0.0.0-py3-none-any.whl paddle-dev:/data
# 将pdserving转换出来的模型拷贝进容器
docker cp ppocr_det_v3_serving paddle-dev:/data
docker cp ppocr_rec_v3_serving paddle-dev:/data

# 进入容器安装相关依赖
docker exec -it paddle-dev bash

# 修改里面的apt源，安装vim等
apt install -y vim
mv /etc/source.list /etc/source.list.back

# 安装paddle，注意arm服务器需要用源码编译出whl本地安装
pip install -i https://mirror.baidu.com/pypi/simple paddlepaddle

# 安装源码编译的server
pip install -i https://mirror.baidu.com/pypi/simple /data/paddle_serving_server-0.0.0-py3-none-any.whl

# 启动服务验证
python -m paddle_serving_server.serve --model ppocr_det_v3_serving ppocr_rec_v3_serving --op GeneralDetectionOp GeneralInferOp --port 9293

# 上一步启动之后没有问题则可以生成镜像
docker commit paddle-dev myocr2:1
```

* 正常部署验证

```bash
# 启动服务端
docker run -d -p 18890:9293 -v $PWD:/data -w /data/inference --name myocr2 myocr2:1 python -m paddle_serving_server.serve --model ppocr_det_v3_serving ppocr_rec_v3_serving --op GeneralDetectionOp GeneralInferOp --port 9293
# 客户端参考pdserving文档
# 注意事项：
export LD_LIBRARY_PATH=/usr/lib
cat test10.txt | curl -X POST -d @- http://localhost:18890/GeneralModelService/inference 
curl -X POST http://localhost:9293/GeneralModelService/inference -d '{"tensor":[{"string_data":["base64imge"],"elem_type":20,"name":"x","alias_name":"x","shape":[1]}],"log_id":0}'
```

### 客户端

```bash
# 下载python3.7镜像
docker pull python3.7

# 启动镜像
docker run -itd --name paddle-dev python3.7 bash

# 将openssl相关lib拷贝到容器
docker cp mypath/libssl.so.1.0.2k paddle-dev:/usr/lib/x86_64-linux-gnu
docker cp mypath/libcrypto.so.1.0.2k paddle-dev:/usr/lib/x86_64-linux-gnu
# 将ocr代码拷贝到容器（需要修改ocr_cpp_client.py里面对应的配置项）
docker cp PaddleOCR/deploy/pdserving paddle-dev:/data
docker cp PaddleOCR/doc/imgs paddle-dev:/data/pdserving
docker cp PaddleOCR/ppocr/utils/ppocr_keys_v1.txt :/data/pdserving
# 将pdserving转换出来的模型拷贝进容器
docker cp ppocr_det_v3_client paddle-dev:/data/pdserving
docker cp ppocr_rec_v3_client paddle-dev:/data/pdserving

# 进入容器安装相关依赖
docker exec -it paddle-dev bash

# 创建ssl软链接
ln -s /usr/lib/x86_64-linux-gnu/libssl.so.1.0.2k /usr/lib/x86_64-linux-gnu/libssl.so.10
ln -s /usr/lib/x86_64-linux-gnu/libcrypto.so.1.0.2k /usr/lib/x86_64-linux-gnu/libcrypto.so.10

# 安装libGL
apt install libgl1
# 安装paddlepaddle、client、app
pip install -i https://mirror.baidu.com/pypi/simple paddle-serving-client==0.9.0 paddle-serving-app==0.9.0 paddlepaddle
# 其他依赖项
pip install -i https://mirror.baidu.com/pypi/simple pyyaml

# C++Server部分进行前后处理，为了加速传入C++Server的仅仅是图片的base64编码的字符串，故需要手动修改 ppocr_det_v3_client/serving_client_conf.prototxt 中 feed_type 字段 和 shape 字段
 feed_var {
 name: "x"
 alias_name: "x"
 is_lod_tensor: false
 feed_type: 20
 shape: 1
 }

# 调用服务端验证
python ocr_cpp_client.py ppocr_det_v3_client ppocr_rec_v3_client

# 上一步启动之后没有问题则可以生成镜像
docker commit paddle-dev myocr2-client:1
```




## 制作镜像-GPU-pdserving-c++

### 服务端

```bash
# todo
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
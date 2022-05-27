# PaddleServing

## 依赖项

组件|版本要求
---|---
gcc|5.4.0(Cuda 10.1) and 8.2.0
gcc-c++|5.4.0(Cuda 10.1) and 8.2.0
cmake|3.2.0 and later
Python|3.6.0 and later
Go|1.17.2 and later
git|2.17.1 and later
glibc-static|2.17
openssl-devel|1.0.2k
bzip2-devel|1.0.6 and later
python-devel / python3-devel|3.6.0 and later
sqlite-devel|3.7.17 and later
patchelf|0.9
libXext|1.3.3
libSM|1.2.2
libXrender|0.9.10

## 源码编译安装opencv

```bash
# 下载源码
wget https://github.com/opencv/opencv/archive/3.4.7.tar.gz
tar -xf 3.4.7.tar.gz

root_path=/home/opencv3.7.4
install_path=${root_path}/opencv3

mkdir build && cd build

cmake .. \
    -DCMAKE_INSTALL_PREFIX=${install_path} \
    -DCMAKE_BUILD_TYPE=Release \
    -DBUILD_SHARED_LIBS=OFF \
    -DWITH_IPP=OFF \
    -DBUILD_IPP_IW=OFF \
    -DWITH_LAPACK=OFF \
    -DWITH_EIGEN=OFF \
    -DCMAKE_INSTALL_LIBDIR=lib64 \
    -DWITH_ZLIB=ON \
    -DBUILD_ZLIB=ON \
    -DWITH_JPEG=ON \
    -DBUILD_JPEG=ON \
    -DWITH_PNG=ON \
    -DBUILD_PNG=ON \
    -DWITH_TIFF=ON \
    -DBUILD_TIFF=ON

make -j
# 安装成功之后会在 opencv3 目录下生成 bin,include,lib,lib64,share 目录
make install
```

## 源码编译安装openssl

到 `https://github.com/openssl/openssl/tags` 查找符合要求的版本

```bash
# 下载源码包
wget https://github.com/openssl/openssl/releases/tag/OpenSSL_1_0_2p
tar xf OpenSSL_1_0_2p.tar.gz
cd openssl_OpenSSL_1_0_2p

# 安装
./config --prefix=/usr/local/openssl1.0.0
make && make install

# 查看版本
openssl version
```

* 生成OpenSSL1_0_0，如果只是需要该`so`库的话，就不一定非要执行`make install`操作了

```bash
# 在源码根目录创建一个链接脚本文件，添加OPENSSL_1.0.0的信息。
cat > openssl.ld << EOF
OPENSSL_1.0.0 {
    global:
    *;
};
OPENSSL_1.0.1 {
    global:
    *;
};
OPENSSL_1.0.1_EC {
    global:
    *;
};
OPENSSL_1.0.2 {
    global:
    *;
};
EOF

# 使用config的时候需要附加上刚才创建的链接脚本文件，该文件可使编译后生成的动态库文件中包含该版本信息
./config --prefix=/usr/local/ --openssldir=/usr/local/openssl shared -Wl,--version-script=openssl.ld -Wl,-Bsymbolic-functions

# 编译
make -j4

# 编译结束后，会生成一个libcrypto.so.1.0.0动态库文件，查看它是否包含“OPENSSL_1.0.0”信息
strings libcrypto.so.1.0.0 | grep OPENSSL_1
OPENSSL_1.0.0
OPENSSL_1.0.1
OPENSSL_1.0.1_EC
OPENSSL_1.0.2
OPENSSL_1.0.1
OPENSSL_1.0.1_EC
OPENSSL_1.0.0
OPENSSL_1.0.2

# 已经包含该版本,可以单独将libcrypto.so.1.0.0文件放置到系统库目录下了。
cp libcrypto.so.1.0.0 /usr/lib64/
```

## 源码编译验证-CPU

* 参考文档

```bash
# 拉取编译镜像
docker pull registry.baidubce.com/paddlepaddle/serving:0.9.0-devel
# 启动镜像
docker run -itd --name paddle-dev registry.baidubce.com/paddlepaddle/serving:0.9.0-devel bash
docker exec -it paddle-dev bash
# 下载还原代码
git clone https://github.com/PaddlePaddle/Serving
cd Serving && git submodule update --init --recursive
# 如果是 ocr或者其他的项目需要拷贝对应cpp文件
git clone https://github.com/PaddlePaddle/PaddleOCR
cp -rf PaddleOCR/deploy/pdserving/general_detection_op.cpp Serving/core/general-server/op
# 环境变量准备-PYTHON_INCLUDE_DIR
find / -name Python.h
# 取上一级的目录路径
export PYTHON_INCLUDE_DIR=/usr/local/include/python3.7m/
# 环境变量准备-PYTHON_LIBRARIES
find / -name libpython3.7.so
# 取上一级的目录路径
export PYTHON_LIBRARIES=/usr/local/lib
# 环境变量准备-PYTHON_EXECUTABLE
which python3.7
# 取全路径
export PYTHON_EXECUTABLE=/usr/local/bin/python3.7
# 安装Serving依赖包
pip3.7 install -i http://pypi.douban.com/simple --trusted-host pypi.douban.com -r python/requirements.txt
# 其他环境准备
pip3.7 install -i http://pypi.douban.com/simple --trusted-host pypi.douban.com requests
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin
go env -w GO111MODULE=on
go env -w GOPROXY=https://goproxy.cn,direct
go install github.com/grpc-ecosystem/grpc-gateway/protoc-gen-grpc-gateway@v1.15.2
go install github.com/grpc-ecosystem/grpc-gateway/protoc-gen-swagger@v1.15.2
go install github.com/golang/protobuf/protoc-gen-go@v1.4.3
go install google.golang.org/grpc@v1.33.0
go env -w GO111MODULE=auto
#### 如果是ocr需要提前源码编译opencv
#### 编译paddle-serving-server
mkdir build_server && cd build_server
cmake -DPYTHON_INCLUDE_DIR=$PYTHON_INCLUDE_DIR \
    -DPYTHON_LIBRARIES=$PYTHON_LIBRARIES \
    -DPYTHON_EXECUTABLE=$PYTHON_EXECUTABLE \
    -DWITH_GPU=OFF\
    -DOPENCV_DIR=/home/opencv-3.4.7/opencv3\
    -DWITH_OPENCV=ON \
    -DSERVER=ON ..
make -j20
cd ..
#### 编译paddle-serving-client
### 这里编译出来的client依赖的是openssh1.0.2的版本，在其他版本的openssl里面会有问题
mkdir build_client && cd build_client
cmake -DPYTHON_INCLUDE_DIR=$PYTHON_INCLUDE_DIR \
    -DPYTHON_LIBRARIES=$PYTHON_LIBRARIES \
    -DPYTHON_EXECUTABLE=$PYTHON_EXECUTABLE \
    -DCLIENT=ON ..
make -j10
cd ..
#### 编译paddle-serving-app
mkdir build_app && cd build_app
cmake -DPYTHON_INCLUDE_DIR=$PYTHON_INCLUDE_DIR \
    -DPYTHON_LIBRARIES=$PYTHON_LIBRARIES \
    -DPYTHON_EXECUTABLE=$PYTHON_EXECUTABLE \
    -DAPP=ON ..
make -j10
cd ..
# 安装编译出来的包
pip3.7 install build_server/python/dist/paddle_serving_server-0.0.0-py3-none-any.whl
pip3.7 install build_server/python/dist/paddle_serving_client-0.0.0-py3-none-any.whl
pip3.7 install build_server/python/dist/paddle_serving_app-0.0.0-py3-none-any.whl
# 运行python端Server时，会检查SERVING_BIN环境变量，如果想使用自己编译的二进制文件，请将设置该环境变量为对应二进制文件的路径，通常是export SERVING_BIN=${BUILD_DIR}/core/general-server/serving。 其中BUILD_DIR为build_server的绝对路径。 可以cd build_server路径下，执行export SERVING_BIN=${PWD}/core/general-server/serving
export SERVING_BIN=${PWD}/build_server/core/general-server/serving

# 安装paddle，注意arm服务器需要用源码编译出whl本地安装
pip install -i https://mirror.baidu.com/pypi/simple paddlepaddle

##### OCR服务相关
cd /home/PaddleOCR/deploy/pdserving
# 下载并解压 OCR 文本检测模型
wget https://paddleocr.bj.bcebos.com/PP-OCRv3/chinese/ch_PP-OCRv3_det_infer.tar -O ch_PP-OCRv3_det_infer.tar && tar -xf ch_PP-OCRv3_det_infer.tar
# 下载并解压 OCR 文本识别模型
wget https://paddleocr.bj.bcebos.com/PP-OCRv3/chinese/ch_PP-OCRv3_rec_infer.tar -O ch_PP-OCRv3_rec_infer.tar &&  tar -xf ch_PP-OCRv3_rec_infer.tar
# 转换检测模型
python3.7 -m paddle_serving_client.convert --dirname ./ch_PP-OCRv3_det_infer/ \
                                         --model_filename inference.pdmodel          \
                                         --params_filename inference.pdiparams       \
                                         --serving_server ./ppocr_det_v3_serving/ \
                                         --serving_client ./ppocr_det_v3_client/

# 转换识别模型
python3.7 -m paddle_serving_client.convert --dirname ./ch_PP-OCRv3_rec_infer/ \
                                         --model_filename inference.pdmodel          \
                                         --params_filename inference.pdiparams       \
                                         --serving_server ./ppocr_rec_v3_serving/  \
                                         --serving_client ./ppocr_rec_v3_client/

### ocr启动服务
python3.7 -m paddle_serving_server.serve --model ppocr_det_v3_serving ppocr_rec_v3_serving --op GeneralDetectionOp GeneralInferOp --port 9293

# C++Server部分进行前后处理，为了加速传入C++Server的仅仅是图片的base64编码的字符串，故需要手动修改 ppocr_det_v3_client/serving_client_conf.prototxt 中 feed_type 字段 和 shape 字段
 feed_var {
 name: "x"
 alias_name: "x"
 is_lod_tensor: false
 feed_type: 20
 shape: 1
 }
### ocr客户端验证
python3.7 ocr_cpp_client.py /home/models/ppocr_det_v3_client /home/models/ppocr_rec_v3_client
```

# PaddleSpeech

## 制作镜像

```bash
# 下载基础镜像
docker pull python:3.7

# 启动镜像
docker run -itd --name paddle-dev python3.7 bash

# 进入容器安装相关依赖
docker exec -it paddle-dev bash

# 将镜像中的源修改为清华源
vim /etc/apt/source.list

# 安装依赖项
apt install -y libsndfile bzip2 sox swig

# 安装gcc
# ubuntu
apt install build-essential
# centos
yum install gcc gcc-c++

# 安装paddlepaddle依赖
pip install pytest-runner -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install paddlepaddle -i https://mirror.baidu.com/pypi/simple

# 下载paddleSpeech
git clone https://github.com/PaddlePaddle/PaddleSpeech.git
cd PaddleSpeech

# 启动服务（这个过程会下载模型等，最后如果没有报错会提示启动了8090端口）
paddlespeech_server start --config_file ./paddlespeech/server/conf/application.yaml
# 测试验证
curl -X POST -H 'Content-Type: application/json' -d '{"text": "测试一下"}' http://127.0.0.1:8090/paddlespeech/tts
# 测试过没问题之后，修改配置，取消127.0.0.1限制（改成0.0.0.0）
./paddlespeech/server/conf/application.yaml

# 上述步骤确认没问题，退出容器，生成镜像
docker commit paddle-dev myspeech:1
```

## docker启动服务

```bash
# 启动服务
docker run -d -p 18889:8090 -w /PaddleSpeech --name mytest myspeech:1 paddlespeech_server start --config_file ./paddlespeech/server/conf/application.yaml

# 测试
curl -X POST -H 'Content-Type: application/json' -d '{"text": "测试一下"}' http://192.168.0.171:18889/paddlespeech/tts
```

## nginx代理配置

```bash
upstream mytest {
    server 192.168.0.171:18889 max_fails=3 fail_timeout=20s;
}

server {
    listen   18029;
    server_name  _;
    add_header 'Access-Control-Allow-Origin' *;
    add_header 'Access-Control-Allow-Credentials' 'true';
    add_header 'Access-Control-Allow-Methods' *;
    add_header 'Access-Control-Allow-Headers' *;
    if ( $request_method = 'OPTIONS' ) {
        return 200;
    }

    location / {
       proxy_pass  http://mytest;
    }
}
```

## speech接口定义

[官方接口文档地址](https://github.com/PaddlePaddle/PaddleSpeech/wiki/PaddleSpeech-Server-RESTful-API)

### tts

* 获取TTS服务使用方式: `GET /paddlespeech/tts/help`

```json
{
    "success": true,
    "code": 0,
    "message": {"global": "success" },
    "result": {
        "description"："",
        "input": <sentence to be synthesized>,
	"output": <wavfile>
    }
}
```

* 合成语音: `POST /paddlespeech/tts`

```json
// 请求
{
    "text": "你好，欢迎使用百度飞桨深度学习框架！", //待合成文本
    "spk_id": 0, // 发音人id，未使用到，默认：0
    "speed": 1.0, // 合成音频的语速，值范围：(0，3]，默认：1.0，windows 平台不支持变语速
    "volume": 1.0, // 合成音频的音量，值范围：(0，3]，默认：1.0，值过大可能会存在截幅现象
    "sample_rate": 0, // 合成音频的采样率，只支持下采样，值选择 [0, 8000, 16000]，默认:0，表示与模型采样率一致
    "save_path": "./tts.wav" // 通过此参数，可以在合成完成后在本地保存一个音频文件，默认值：None，表示不保存音频，保存音频格式支持wav和pcm
}

// 响应
{
    "success": true,
    "code": 0,
    "message": {"global": "success" },
    "result": {
        "lang": "zh", // 待合成文本语言（zh or en）
        "spk_id": 0, // 发音人id
        "speed": 1.0, // 合成音频的语速，值范围：[0，3]
        "volume": 1.0, // 合成音频的音量，值范围：[0，3]
        "sample_rate": 24000, // 合成音频的采样率
        "duration": 3.6125, // 合成音频的时长，单位为秒
        "save_path": "./tts.wav", // 保存的合成音频路径
        "audio": "LTI1OTIuNjI1OTUwMzQsOTk2OS41NDk4..." // 合成音频的base64
    }
}
```


## 前端页面

### tts

```html
<html>
  <head></head>
  <body>
    <audio id="autoid" autoplay></audio>
    <button type="button" onclick="test()">播放</button>
  </body>
  <script src="https://cdn.staticfile.org/jquery/1.10.2/jquery.min.js"></script>
  <script>
    var requestData = {
      "text": "测试一下"
    } 
    $.ajax({
      type: 'POST',
      contentType: 'application/json',
      url: 'http://192.168.0.171:18029/paddlespeech/tts',
      data: JSON.stringify(requestData),
      success: function (res) {
        document.getElementById('autoid').setAttribute('src', 'data:audio/wav;base64,'+res.result.audio)
      }
    })

    function test() {
      document.getElementById('autoid').play();
    }
  </script>
</html>
```
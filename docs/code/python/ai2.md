# 机器学习离线部署

总体是，将所需要的预训练模型、词典等文件下载至本地文件夹中 ，然后加载的时候model_name_or_path参数指向文件的路径即可。

## 下载与训练模型、词典等

如果不确定哪些需要下，哪些不需要的话，可以把文件全部下载下来。

打开模型网站：https://huggingface.co/models ，搜索需要的模型，然后进入文件页面，下载对应的文件，如下图

![1](todo)

通常我们需要保存的是三个文件及一些额外的文件，第一个是配置文件`config.json`。第二个是词典文件`vocab.json`。第三个是预训练模型文件，如果你使用`pytorch`则保存`pytorch_model.bin`文件，如果你使用`tensorflow2`，则保存`tf_model.h5`。

额外的文件，指的是`merges.txt、special_tokens_map.json、added_tokens.json、tokenizer_config.json、sentencepiece.bpe.model`等，这几类是`tokenizer`需要使用的文件，如果出现的话，也需要保存下来。没有的话，就不必在意。

## 使用下载好的文件

使用的时候，非常简单。`huggingface`的`transformers`框架主要有三个类`model`类、`configuration`类、`tokenizer`类，这三个类，所有相关的类都衍生自这三个类，他们都有`from_pretained()`方法和`save_pretrained()`方法。

`from_pretrained`方法的第一个参数都是`pretrained_model_name_or_path`，这个参数设置为我们下载的文件目录即可。

### gpt2样例一

下面的代码是使用GPT2去预测一句话的下一个单词的样例。这里的pytorch版本的，如果是`tensorflow2`版本的，`GPT2LMHeadModel.from_pretrained`的参数需要额外加入`from_tf=True`。

```py
import torch
from transformers import GPT2Tokenizer, GPT2LMHeadModel

# 从下载好的文件夹中加载tokenizer
# 这里你需要改为自己的实际文件夹路径
tokenizer = GPT2Tokenizer.from_pretrained('/dfsdata2/yucc1_data/models/huggingface/gpt2')
text = 'Who was Jim Henson ? Jim Henson was a'
# 编码一段文本
# 编码后为[8241, 373, 5395, 367, 19069, 5633, 5395, 367, 19069, 373, 257]
indexed_tokens = tokenizer.encode(text)
# 转换为pytorch tensor
# tensor([[ 8241,   373,  5395,   367, 19069,  5633,  5395,   367, 19069,   373, 257]])
# shape为 torch.Size([1, 11])
tokens_tensor = torch.tensor([indexed_tokens])
# 从下载好的文件夹中加载预训练模型
model = GPT2LMHeadModel.from_pretrained('/dfsdata2/yucc1_data/models/huggingface/gpt2')

# 设置为evaluation模式，去取消激活dropout等模块。
# 在huggingface/transformers框架中，默认就是eval模式
model.eval()

# 预测所有token
with torch.no_grad():
    # 将输入tensor输入，就得到了模型的输出，非常简单
    # outputs是一个元组，所有huggingface/transformers模型的输出都是元组
    # 本初的元组有两个，第一个是预测得分（没经过softmax之前的，也叫作logits），
    # 第二个是past，里面的attention计算的key value值
    # 此时我们需要的是第一个值
    outputs = model(tokens_tensor)
    # predictions shape为 torch.Size([1, 11, 50257])，
    # 也就是11个词每个词的预测得分（没经过softmax之前的）
    # 也叫做logits
    predictions = outputs[0]

# 我们需要预测下一个单词，所以是使用predictions第一个batch，最后一个词的logits去计算
# predicted_index = 582，通过计算最大得分的索引得到的
predicted_index = torch.argmax(predictions[0, -1, :]).item()
# 反向解码为我们需要的文本
predicted_text = tokenizer.decode(indexed_tokens + [predicted_index])
# 解码后的文本：'Who was Jim Henson? Jim Henson was a man'
# 成功预测出单词 'man'
print(predicted_text)
```

### gpt2样例二

`huggingface/transformers`官方样例，使用gpt2进行文本生成。`https://github.com/huggingface/transformers/tree/master/examples/text-generation`

此处一样使用将`model_name_or_path`参数改为文件夹的路径即可。

```py
python run_generation.py \
    --model_type=gpt2 \
    --model_name_or_path=/dfsdata2/yucc1_data/models/huggingface/gpt2
```

### chatglm-6b样例

下载模型：https://huggingface.co/THUDM/chatglm-6b-int4/tree/main

```bash
git clone https://huggingface.co/THUDM/chatglm-6b-int4 /yourpath/chatglm-6b
```

安装依赖：`pip install protobuf transformers==4.27.1 cpm_kernels`

注意需要将 `THUDM/chatglm-6b-int4` 替换成本地下载保存模型的目录地址

```py
>>> from transformers import AutoTokenizer, AutoModel
>>> tokenizer = AutoTokenizer.from_pretrained("THUDM/chatglm-6b-int4", trust_remote_code=True)
>>> model = AutoModel.from_pretrained("THUDM/chatglm-6b-int4", trust_remote_code=True).half().cuda()
>>> response, history = model.chat(tokenizer, "你好", history=[])
>>> print(response)
你好👋!我是人工智能助手 ChatGLM-6B,很高兴见到你,欢迎问我任何问题。
>>> response, history = model.chat(tokenizer, "晚上睡不着应该怎么办", history=history)
>>> print(response)
晚上睡不着可能会让你感到焦虑或不舒服,但以下是一些可以帮助你入睡的方法:

1. 制定规律的睡眠时间表:保持规律的睡眠时间表可以帮助你建立健康的睡眠习惯,使你更容易入睡。尽量在每天的相同时间上床,并在同一时间起床。
2. 创造一个舒适的睡眠环境:确保睡眠环境舒适,安静,黑暗且温度适宜。可以使用舒适的床上用品,并保持房间通风。
3. 放松身心:在睡前做些放松的活动,例如泡个热水澡,听些轻柔的音乐,阅读一些有趣的书籍等,有助于缓解紧张和焦虑,使你更容易入睡。
4. 避免饮用含有咖啡因的饮料:咖啡因是一种刺激性物质,会影响你的睡眠质量。尽量避免在睡前饮用含有咖啡因的饮料,例如咖啡,茶和可乐。
5. 避免在床上做与睡眠无关的事情:在床上做些与睡眠无关的事情,例如看电影,玩游戏或工作等,可能会干扰你的睡眠。
6. 尝试呼吸技巧:深呼吸是一种放松技巧,可以帮助你缓解紧张和焦虑,使你更容易入睡。试着慢慢吸气,保持几秒钟,然后缓慢呼气。

如果这些方法无法帮助你入睡,你可以考虑咨询医生或睡眠专家,寻求进一步的建议。
```

下载官方demo：git clone https://github.com/THUDM/ChatGLM-6B.git ，如果不需要官方demo也可以自己写

进入克隆的仓库目录，创建一个文件夹 `chatglm-6b-int4`，将上面下载的模型全部转移到该目录下

安装依赖：`pip install -r requirements.txt`，下面所有demo中的 `from_pretrained` 方法第一个参数目录要改成本地模型保存的目录地址 `chatglm-6b-int4`

```bash
# web_demo.py 是基于gradio开发的，带了前端交互页面，可以指定ip和port，便于远程访问

# api.py 是纯接口的实现，需要自行实现前端交互页面
curl -X POST "http://127.0.0.1:8000"
-H 'Content-Type: application/json'
-d '{"prompt": "你好", "history": []}'

{"response":"你好！我是人工智能助手 ChatGLM-6B，很高兴见到你，欢迎问我任何问题。",
 "history":[["你好","你好！我是人工智能助手 ChatGLM-6B，很高兴见到你，欢迎问我任何问题。"]],
 "status":200,
 "time":"xxxxx"}

# cli_demo.py 在命令行通过输入输出和模型交互 

```

如果需要在 cpu 上运行量化后的模型，还需要安装 `gcc` 与 `openmp`。多数 Linux 发行版默认已安装。

```py
# cpu版本运行
model = AutoModel.from_pretrained("THUDM/chatglm-6b-int4", trust_remote_code=True).float()
```

多卡部署：首先安装 `pip install accelerate`，然后通过如下方法加载模型

```py
# 将模型部署到两张 GPU 上进行推理。可以将 num_gpus 改为你希望使用的 GPU 数。默认是均匀切分的，也可以传入 device_map 参数来自己指定。
from utils import load_model_on_gpus
model = load_model_on_gpus("THUDM/chatglm-6b", num_gpus=2)
```


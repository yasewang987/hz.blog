# 机器学习离线部署

总体是，将所需要的预训练模型、词典等文件下载至本地文件夹中 ，然后加载的时候model_name_or_path参数指向文件的路径即可。

## 下载与训练模型、词典等

使用git下载离线模型

```bash
### 安装git lfs
curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | sudo bash
apt install git-lfs

### huggingface模型下载
git clone git@hf.co:THUDM/chatglm2-6b-int4

### modelscope模型下载
git lfs install
git clone https://www.modelscope.cn/<namespace>/<model-name>.git
# 例如: git clone https://www.modelscope.cn/qwen/Qwen-7B-Chat.git
# 私有模型下载，前提是您有响应模型权限 方法1
git lfs install
git clone http://oauth2:your_git_token@www.modelscope.cn/<namespace>/<model-name>.git
# 方法2
git clone http://your_user_name@www.modelscope.cn/<namespace>/<model-name>.git
# Password for 'http://your_user_name@modelscope.cn':
# input git token
```

如果不确定哪些需要下，哪些不需要的话，可以把文件全部下载下来。

打开模型网站：https://huggingface.co/models ，搜索需要的模型，然后进入文件页面，下载对应的文件

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

### chatglm2-6b样例

* python版本一定要`3.11`最新版本及以上

下载模型：https://huggingface.co/THUDM/chatglm2-6b-int4/tree/main ，也可以到这个地址一个一个下载所有文件。

```bash
# 安装git lfs
curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | sudo bash
apt install git-lfs
# 下载模型
git clone git@hf.co:THUDM/chatglm2-6b-int4
```

安装依赖：`pip install protobuf transformers==4.30.2 cpm_kernels torch>=2.0 gradio mdtex2html sentencepiece accelerate`

注意需要将 `THUDM/chatglm2-6b` 替换成本地下载保存模型的目录地址

```py
>>> from transformers import AutoTokenizer, AutoModel
>>> tokenizer = AutoTokenizer.from_pretrained("/root/chattest", trust_remote_code=True)
>>> model = AutoModel.from_pretrained("/root/chattest", trust_remote_code=True).half().cuda()
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

* **官方demo测试**

下载官方demo：`git clone https://github.com/THUDM/ChatGLM2-6B.git` ，如果不需要官方demo也可以自己写

安装依赖：`pip install -r requirements.txt`，下面所有demo中的 `from_pretrained` 方法第一个参数目录要改成本地模型保存的目录地址

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
# cpu版本运行 - 就是将后面的改成 float()
model = AutoModel.from_pretrained("/root/chattest", trust_remote_code=True).float()
```

多卡部署：首先安装 `pip install accelerate`，然后通过如下方法加载模型

```py
# 将模型部署到两张 GPU 上进行推理。可以将 num_gpus 改为你希望使用的 GPU 数。默认是均匀切分的，也可以传入 device_map 参数来自己指定。
from utils import load_model_on_gpus
model = load_model_on_gpus("/root/chattest", num_gpus=2)
```

## Qwen

```bash
# 环境依赖
python 3.8及以上版本
pytorch 1.12及以上版本，推荐2.0及以上版本
建议使用CUDA 11.4及以上（GPU用户、flash-attention用户等需考虑此选项）

# 推荐安装 flash-attention 库，以实现更高的效率和更低的显存占用。
git clone -b v1.0.8 https://github.com/Dao-AILab/flash-attention
cd flash-attention && pip install .
# 下方安装可选，安装可能比较缓慢。
# Below are optional. Installing them might be slow.
# pip install csrc/layer_norm
# pip install csrc/rotary

# 模型下载
git clone https://www.modelscope.cn/qwen/Qwen-7B-Chat.git

# demo代码下载
https://github.com/QwenLM/Qwen.git
# 修改demo里的模型地址为本地模型的路径
# 安装web-demo依赖
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements_web_demo.txt
# 启动webdemo，直接访问启动后的地址即可
python web_demo.py
```

# 模型微调

## chatglm2-6b模型微调

使用官方 p-tuning v2 方式微调广告生成，参考地址：https://github.com/THUDM/ChatGLM2-6B/blob/main/ptuning/README.md

```bash
# 安装额外依赖
pip install rouge_chinese nltk jieba datasets

# 下载训练数据（训练数据也可以自己编写）
wget https://cloud.tsinghua.edu.cn/seafhttp/files/61fb5d40-0eb9-475f-9672-cd5aaf76f99a/AdvertiseGen.tar.gz

# 修改 train.sh，将 THUDM/chatglm2-6b 改为模型本地的存放地址
# 如果是单独编译的python，需要将 torchrun 加入到可执行目录中或者修改为完整地址，例如 /root/python3/bin/torchrun
# 其他参数说明可以参考官方git文档

# 开始训练
bash train.sh

# 推理评测：在 P-tuning v2 训练时模型只保存 PrefixEncoder 部分的参数，所以在推理时需要同时加载原 ChatGLM2-6B 模型以及 PrefixEncoder 的权重，因此需要指定 evaluate.sh 中的参数
--model_name_or_path /root/chattest   # $CHECKPOINT_PATH
--ptuning_checkpoint $CHECKPOINT_PATH

# 测试例子1
Input: 类型#上衣*材质#牛仔布*颜色#白色*风格#简约*图案#刺绣*衣样式#外套*衣款式#破洞
Label: 简约而不简单的牛仔外套,白色的衣身十分百搭。衣身多处有做旧破洞设计,打破单调乏味,增加一丝造型看点。衣身后背处有趣味刺绣装饰,丰富层次感,彰显别样时尚。
Output[微调前]: 这件上衣的材质是牛仔布,颜色是白色,风格是简约,图案是刺绣,衣样式是外套,衣款式是破洞。
Output[微调后]: 这是一款简约的牛仔外套,破洞设计,将牛仔布破洞,带来一种随意与个性。破洞的牛仔外套,展现出时尚气息,带来一种休闲感。同时,刺绣图案,让整件外套更加立体。

# 测试例子2
Input: 类型#裙*版型#显瘦*风格#文艺*风格#简约*图案#印花*图案#撞色*裙下摆#压褶*裙长#连衣裙*裙领型#圆领
Label: 文艺个性的印花连衣裙,藏青色底蕴,低调又大气,撞色太阳花分布整个裙身,绚丽而美好,带来时尚减龄的气质。基础款的舒适圆领,简约不失大方,勾勒精致脸庞。领后是一粒包布扣固定,穿脱十分方便。前片立体的打褶设计,搭配后片压褶的做工,增添层次和空间感,显瘦又有型。
Output[微调前]: 类型#裙版型#显瘦风格#文艺风格#简约图案#印花图案#撞色裙下摆#压褶裙长#连衣裙裙领型#圆领 1. 连衣裙:简约风格,裙长为膝盖以上,裙领型为圆领。2. 裙下摆:压褶设计,使裙摆呈现出流畅的褶皱效果。3. 裙领型:裙领型为圆领,使穿上连衣裙后更加有型。4. 版型:采用显瘦设计,让连衣裙看起来更加苗条。5. 风格:文艺风格,让连衣裙更加有内涵和品味。6. 图案:印花设计,在连衣裙上印有独特的图案。7. 撞色:采用撞色设计,让连衣裙在色彩上更加鲜明、富有层次感。
Output[微调后]: 这是一款文艺范的连衣裙,以印花为元素,采用简约的印花,既能够突出文艺气质,又能够展现简约风。在印花的同时又有领子和裙摆的压褶设计,更加凸显文艺气质。简约而不会过于单调,搭配出街,穿着十分舒适。

# 模型部署（需要将模型地址改为训练后的名称）
# 注意你可能需要将 pre_seq_len 改成你训练时的实际值
# 注意需要映射端口，也可以直接使用官方文档的代码例子直接在python环境内运行测试
bash web_demo.sh
```


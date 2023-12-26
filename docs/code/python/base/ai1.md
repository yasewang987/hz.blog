# 机器学习Demo1

安装`transformers`

```bash
pip install -i https://pypi.douban.com/simple transformers
```

## 示例

```py
### 情绪分析
# 从transformers中导入pipeline
from transformers import pipeline
# 通过pipeline加载模型sentiment-analysis
# 它会自动从网站去下载需要的所有数据
classifier = pipeline('sentiment-analysis')
res = classifier('I like you very much!')
print(res)
# 输出
[{'label': 'POSITIVE', 'score': 0.9998810291290283}]

### 基于文本的问答
#使用场景：课本录进去，让它成为课本知识小达人，随时问，不用再去翻书查找
from transformers import pipeline
qa = pipeline('question-answering')
res = qa({
    # 正文：我是一个程序员，我从2022年开始写博客。
    'context': 'I am a programmer and have been writing blogs since 2022.',
    # 问题：我哪年开始写博客？
    'question': 'When do I start writing a blog?'
    })
print(res)
# 输出
{'score': 0.9318631291389465, 'start': 52, 'end': 56, 'answer': '2022'}
```

## 服务化

```py
from fastapi import FastAPI
import uvicorn
from transformers import pipeline

app = FastAPI(title='模型能力开放平台')

qas = pipeline('question-answering')
classifier = pipeline('sentiment-analysis')

@app.get("/sentiment", summary='情绪分析', tags=['NLP'])
def qa(text: str = None):
    res = classifier(text)
    res = res[0]['label']
    return { "code": 200, "result": res }

@app.get("/qa", summary='文本问答', tags=['NLP'])
def qa(text: str = None, q_text: str = None):
    res = qas({'question': q_text, 'context': text})
    print(res)
    res = res['answer']
    return { "code": 200, "result": res }

if __name__=='__main__':
    uvicorn.run("main:app", host='0.0.0.0', port=8899)
```
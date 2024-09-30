# python常用库示例

## 异步编程-asyncio

asyncio 中的关键概念

* 事件循环：每个 asyncio 应用程序的核心。它运行异步任务和回调，执行网络 I/O 操作并管理子进程。
* 协程：使用 async def 定义的函数，可以使用 await 将控制权交还给事件循环，从而允许其他任务运行。
* 任务：协程对象的包装器，用于在事件循环中安排它们的执行。

简单例子-多协程并行：

```py
### 多协程并行
import asyncio
async def task(name: str, delay: int):
    await asyncio.sleep(delay)
    print(f"Task {name} completed after {delay} seconds")
# asyncio.gather 同时运行3个协程
async def main():
    await asyncio.gather(
        task("A", 2),
        task("B", 3),
        task("C", 1)
    )

asyncio.run(main())
### fastapi示例多协程并行
from fastapi import FastAPI
import asyncio

app = FastAPI()

@app.get("/")
async def read_root():
    return {"message": "Hello World"}

# 等待N秒
@app.get("/wait/{seconds}")
async def wait_seconds(seconds: int):
    await asyncio.sleep(seconds)
    return {"message": f"Waited for {seconds} seconds"}

# 并行
@app.get("/parallel")
async def parallel_tasks():
    async def task(name, delay):
        await asyncio.sleep(delay)
        return f"Task {name} completed in {delay} seconds"
    
    task1 = asyncio.create_task(task("A", 2))
    task2 = asyncio.create_task(task("B", 3))
    
    results = await asyncio.gather(task1, task2)
    return {"results": results}

### 多协程队列通信-asyncio.Queue
# 生产者协程生产项目并将其放入队列，而消费者协程消费队列中的项目
import asyncio

async def producer(queue: asyncio.Queue):
    for i in range(5):
        await asyncio.sleep(1)
        await queue.put(f"Item {i}")
        print(f"Produced: Item {i}")

async def consumer(queue: asyncio.Queue):
    while True:
        item = await queue.get()
        if item is None:
            break
        print(f"Consumed: {item}")
        queue.task_done()

async def main():
    queue = asyncio.Queue()

    producer_task = asyncio.create_task(producer(queue))
    consumer_task = asyncio.create_task(consumer(queue))

    await producer_task
    await queue.put(None)
    await consumer_task

asyncio.run(main())
### 使用 `asyncio.wait_for` 超时
import asyncio

async def long_running_task():
    await asyncio.sleep(5)
    return "Task completed"

async def main():
    try:
        result = await asyncio.wait_for(long_running_task(), timeout=3)
        print(result)
    except asyncio.TimeoutError:
        print("The task timed out")

asyncio.run(main())

### 处理协程中的异常
import asyncio

async def faulty_task():
    await asyncio.sleep(1)
    raise ValueError("Something went wrong")

async def main():
    try:
        await faulty_task()
    except ValueError as e:
        print(f"Caught an exception: {e}")

asyncio.run(main())
```

## 数据验证-Pydantic

Pydantic的核心概念是基于类的数据模型。通过继承`pydantic.BaseModel`，你可以轻松定义复杂的数据结构，并自动获得数据验证、序列化和反序列化功能。

1. 使用Field(default_factory=list)来避免可变默认值的陷阱。
2. 利用pydantic.SecretStr类型来安全地处理密码等敏感信息。
3. 使用pydantic.parse_obj_as函数来验证复杂的嵌套数据结构。

### 安装

```bash
pip install pydantic
# 安装带有额外依赖的版本
pip install pydantic[email]
```

### 常见示例

```py
### 基础示例
from pydantic import BaseModel, Field
from typing import List

class User(BaseModel):
    id: int
    name: str = Field(..., min_length=1, max_length=50)
    email: str
    age: int = Field(ge=0, le=120)
    interests: List[str] = []
# 创建一个用户实例
user = User(id=1, name="Alice", email="alice@example.com", age=30)
print(user.json())

### 自定义验证器来实现复杂的业务逻辑
from pydantic import BaseModel, validator

class Order(BaseModel):
    item_id: int
    quantity: int

    @validator('quantity')
    def check_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be positive')
        return v

### API请求验证
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()

class Item(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    price: float = Field(..., gt=0)
    is_offer: bool = False

@app.post("/items/")
async def create_item(item: Item):
    return {"item": item}
```

## CSV文件操作

### csv库

```py
### 读取带标题的CSV文件
with open('data.csv', mode='r', newline='', encoding='utf-8') as file:
    reader = csv.DictReader(file)
    for row in reader:
        print(row['Name'])

### 写入CSV文件
with open('output.csv', mode='w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    writer.writerow(['Name', 'Age'])
    writer.writerow(['Alice', 30])
```

### pandas库

```py
### 使用pandas库读写CSV
import pandas as pd

df = pd.read_csv('data.csv')
df.to_csv('output.csv', index=False)

### 处理大文件
chunksize = 10 ** 6
for chunk in pd.read_csv('large_data.csv', chunksize=chunksize):

### 快速访问特定列
df = pd.read_csv('data.csv', usecols=['Name', 'Age'])

### 跳过CSV文件的前几行
df = pd.read_csv('data.csv', skiprows=range(1, 10))

### 修改CSV文件的分隔符
df = pd.read_csv('data.csv', sep=';')

### 处理缺失值
df = pd.read_csv('data.csv').fillna(0)

### 数据类型转换
df = pd.read_csv('data.csv', dtype={'Age': int})

### 选择性读取行
df = pd.read_csv('data.csv')
filtered_df = df[df['Age'] > 25]

### 使用多线程或进程加速处理
import concurrent.futures
import pandas as pd
def process_chunk(chunk):
    # 对每块数据执行处理逻辑
    return chunk.describe()
# 读取CSV文件，分割成多个小块
chunks = pd.read_csv('large_data.csv', chunksize=1000)
# 使用多线程处理每一块数据
with concurrent.futures.ThreadPoolExecutor() as executor:
    results = list(executor.map(process_chunk, chunks))
# 合并处理结果
final_result = pd.concat(results)
```

### 实战案例-销售预测

销售数据的实战案例，进一步分析如何识别销售趋势和预测未来销量。

```py
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split

# 读取CSV文件
sales_df = pd.read_csv('sales.csv')

# 数据预处理
sales_df['Date'] = pd.to_datetime(sales_df['Date'])
sales_df['Month'] = sales_df['Date'].dt.month

# 构建模型输入和输出
X = sales_df[['Month']]
y = sales_df['Quantity']

# 划分训练集和测试集
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 训练线性回归模型
model = LinearRegression()
model.fit(X_train, y_train)

# 预测未来销量
future_months = pd.DataFrame({'Month': range(1, 13)})
predictions = model.predict(future_months)

# 输出预测结果
future_months['Predicted Sales'] = predictions
print(future_months)
```




# Prompt资料

任务说明才是Prompt优化的重中之重

## 基本概念

* system prompt：设定 AI 的行为、角色、背景，用于为模型提供上下文、说明或与用例相关的其他信息。用户可以通过系统消息描述模型应该回答什么、不应该回答什么，以及定义模型回复的格式。
* （system）提供真实上下文：本文建议提供给模型真实数据。一般来讲，原始数据越接近最终答案，模型需要做的工作就越少，这意味着模型出错的机会就越少。

Prompt的构成（组合成prompt时没有先后顺序要求）

* label：提示语中用于标识元素的文本,如"Instruction:"或"`<Context></Context>`"
* 指示（Instructions） - 关键词：任务描述
    * task：指定Prompt的目标或任务,以及与所需输出相关的其他细节。例如"根据文档回答问题"或"总结文档"。
    * persona：指定LLM在生成输出时应扮演的角色或身份。例如"SQL专家"或"AI助手"。
    * method：描述LLM应遵循的流程或方法来生成输出,例如"step-by-step"(逐步)。
    * output-length：对输出长度的描述,如"50个单词"或"简洁"。
    * output-format：指定输出应采取的形式,如JSON或段落。
    * inclusion：描述输出应包括或不包括的内容,如"解释"或"来自提供文档的具体信息"。
    * handle-unknown：描述如果LLM缺乏生成所需输出的知识时,应如何处理,如"如果你不知道,回复[...]"。
* 上下文（Context） - 关键词：包括用于提供背景的示例、文档和输入查询。上下文是与任务相关的背景信息，它有助于模型更好地理解当前任务所处的环境或情境。在多轮交互中，上下文尤其重要，因为它提供了对话的连贯性和历史信息。
* 例子（Examples） - 关键词：示范学习.例子是给出的一或多个具体示例，用于演示任务的执行方式或所需输出的格式。这种方法在机器学习中被称为示范学习，已被证明对提高输出正确性有帮助。
* 输入（Input） - 关键词：数据输入。输入是任务的具体数据或信息，它是模型需要处理的内容。在Prompt中，输入应该被清晰地标识出来，以便模型能够准确地识别和处理。

## 设计提示的通用技巧/原则

### 从简单开始

在设计提示时，需要记住这是一个迭代的过程，需要大量的实验来获得最佳结果。使用像OpenAI或Cohere这样的简单平台是一个很好的起点。

您可以从简单的提示开始，随着您的目标是获得更好的结果，不断添加更多的元素和上下文。在此过程中对您的提示进行版本控制是至关重要的。当您阅读本指南时，您会看到许多例子，其中具体性、简洁性和简明性通常会给您带来更好的结果。

当您有一个涉及许多不同子任务的大任务时，您可以尝试将任务分解为更简单的子任务，并随着获得更好的结果而不断构建。这避免了在提示设计过程中一开始就添加过多的复杂性。

### 指令

您可以使用命令来指示模型执行各种简单任务，例如“写入”、“分类”、“总结”、“翻译”、“排序”等，从而为各种简单任务设计有效的提示。

请记住，您还需要进行大量的实验，以查看哪种方法最有效。尝试使用不同的关键字、上下文和数据尝试不同的指令，看看哪种方法最适合您的特定用例和任务。通常情况下，上下文与您要执行的任务越具体和相关，效果越好。

```bash
### 简单指令 ###
将以下文本翻译成西班牙语：文本：“hello！”

# 复杂例子
# prompt
请阅读以下销售邮件。删除任何可用于识别个人身份的信息 (PII)，并用相应的占位符替换它。例如，用"[姓名]"替换"John Doe"。

你好 John，

我写信给你是因为我注意到你最近买了一辆新车。我是一家当地经销商 (Cheap Dealz) 的销售员，我想让你知道我们有一辆新车的超值优惠。如果你有兴趣，请告诉我。

谢谢，

Jimmy Smith

电话：410-805-2345
电子邮件：jimmysmith@cheapdealz.com
# 输出
你好 [姓名]，

我写信给你是因为我注意到你最近买了一辆新车。我是一家当地经销商 ([经销商名称]) 的销售员，我想让你知道我们有一辆新车的超值优惠。如果你有兴趣，请告诉我。

谢谢，

[销售员姓名]

电话：[电话号码]
电子邮件：[电子邮件地址]
```

### 具体性

对您希望模型执行的指令和任务非常具体。提示越具体和详细，结果就越好。当您有所期望的结果或生成样式时，这一点尤为重要。没有特定的令牌或关键字会导致更好的结果。更重要的是具有良好的格式和描述性提示。实际上，在提示中提供示例非常有效，可以以特定格式获得所需的输出。

在设计提示时，您还应考虑提示的长度，因为提示的长度有限制。考虑到您应该具体和详细的程度是需要考虑的。包含太多不必要的细节并不一定是一个好方法。这些细节应该是相关的，并有助于完成手头的任务。这是您需要进行大量实验的事情。我们鼓励大量实验和迭代，以优化您的应用程序的提示。

例如，让我们尝试从一段文本中提取特定信息的简单提示。

```bash
# 提示
提取以下文本中的地名。所需格式：地点：<逗号分隔的公司名称列表>输入：“虽然这些发展对研究人员来说是令人鼓舞的，但仍有许多谜团。里斯本未知的香帕利莫德中心的神经免疫学家Henrique Veiga-Fernandes说：“我们经常在大脑和我们在周围看到的效果之间有一个黑匣子。”“如果我们想在治疗背景下使用它，我们实际上需要了解机制。””

# 输出
地点：里斯本，香帕利莫德中心
```

### 避免不精确

在上面关于详细和格式改进的提示中，很容易陷入想要过于聪明的提示陷阱，从而可能创建不精确的描述。通常最好是具体和直接。这里的类比非常类似于有效的沟通——越直接，信息传递就越有效。

例如，您可能有兴趣了解提示工程的概念。您可以尝试这样做：

解释提示工程的概念。保持解释简短，只有几句话，不要过于描述。

从上面的提示中不清楚要使用多少句话和什么样的风格。您可能仍然可以通过上面的提示获得良好的响应，但更好的提示是非常具体、简洁和直接的。例如：

使用2-3句话向高中学生解释提示工程的概念。

### 做还是不做？

设计提示时的另一个常见技巧是避免说不要做什么，而是说要做什么。这鼓励更具体化，并关注导致模型产生良好响应的细节。

以下是一个电影推荐聊天机器人的示例，因为我写的指令——关注于不要做什么，而失败了。

```bash
# 提示
以下是向客户推荐电影的代理程序。不要询问兴趣。不要询问个人信息。客户：请根据我的兴趣推荐电影。代理：
# 输出
当然，我可以根据您的兴趣推荐电影。您想看什么类型的电影？您喜欢动作片、喜剧片、爱情片还是其他类型的电影？

### 以下是更好的提示：
# 提示
以下是向客户推荐电影的代理程序。代理负责从全球热门电影中推荐电影。它应该避免询问用户的偏好并避免询问个人信息。如果代理没有电影推荐，它应该回答“抱歉，今天找不到电影推荐。”。```顾客：请根据我的兴趣推荐一部电影。客服：
# 输出
抱歉，我没有关于您兴趣的任何信息。不过，这是目前全球热门的电影列表：[电影列表]。希望您能找到喜欢的电影！
```

### 结尾再次确认

```bash
确保你的答案完全正确。965*590 等于几？确保你的答案完全正确
```

### 样本提示

我们如何结构化地设计例子也是非常重要的。由于我们已经将头三个例子结构化成： input: classification，因此模型最终也跟着同样只输出分类的结果，而不是一段完整的句子，例如 this review is positive。

```bash
# 输入
Great product, 10/10: positive
Didnt work very well: negative
Super helpful, worth it: positive
It doesnt work!:

# 输出
negative

#### 链式提示p-cot（带处理过程）
这组数中的奇数加起来是偶数：4、8、9、15、12、2、1。
A：将所有奇数相加（9、15、1）得到25。答案为False。
这组数中的奇数加起来是偶数：17、10、19、4、8、12、24。
A：将所有奇数相加（17、19）得到36。答案为True。
这组数中的奇数加起来是偶数：16、11、14、4、8、13、24。
A：将所有奇数相加（11、13）得到24。答案为True。
这组数中的奇数加起来是偶数：17、9、10、12、13、4、2。
A：将所有奇数相加（17、9、13）得到39。答案为False。
这组数中的奇数加起来是偶数：15、32、5、13、82、7、1。
A：
# 输出
将所有奇数相加（15、5、13、7、1）得到41。答案为False。

### 链式思考-cot（0样本）
我去市场买了10个苹果。我给了邻居2个苹果和修理工2个苹果。然后我去买了5个苹果并吃了1个。我还剩下多少苹果？
让我们逐步思考。
# 输出
首先，您从10个苹果开始。
您给了邻居和修理工各2个苹果，所以您还剩下6个苹果。
然后您买了5个苹果，所以现在您有11个苹果。
最后，您吃了1个苹果，所以您还剩下10个苹果。

### 生成知识提示
输入：希腊比墨西哥大。
知识：希腊的面积约为131,957平方公里，而墨西哥的面积约为1,964,375平方公里，使墨西哥比希腊大了1,389%。
输入：眼镜总是会起雾。
知识：当你的汗水、呼吸和周围的湿度中的水蒸气落在冷的表面上，冷却并变成微小的液滴时，会在眼镜镜片上产生冷凝。你看到的是一层薄膜。你的镜片相对于你的呼吸会比较凉，尤其是当外面的空气很冷时。
输入：鱼有思考能力。
知识：鱼比它们看起来更聪明。在许多领域，如记忆力，它们的认知能力与或超过非人类灵长类动物等“更高级”的脊椎动物。鱼的长期记忆帮助它们跟踪复杂的社交关系。
输入：一个人一生中吸烟很多香烟的常见影响是患肺癌的几率高于正常水平。
知识：那些一生中平均每天吸烟不到一支香烟的人，患肺癌的风险是从不吸烟者的9倍。在每天吸烟1到10支香烟之间的人群中，死于肺癌的风险几乎是从不吸烟者的12倍。
输入：一块石头和一颗卵石大小相同。
知识：卵石是一种根据Udden-Wentworth沉积学尺度的颗粒大小为4到64毫米的岩屑。卵石通常被认为比颗粒（直径2到4毫米）大，比卵石（直径64到256毫米）小。
输入：高尔夫球的一部分是试图获得比其他人更高的得分。
知识：
# 输出
高尔夫球的目标是以最少的杆数打完一组洞。一轮高尔夫球比赛通常包括18个洞。每个洞在标准高尔夫球场上一轮只打一次。每个杆计为一分，总杆数用于确定比赛的获胜者。

#### 复杂例子（以Last, First [OCCUPATION]格式输出姓名和职业列表）
In the bustling town of Emerald Hills, a diverse group of individuals made their mark. Sarah Martinez, a dedicated nurse, was known for her compassionate care at the local hospital. David Thompson, an innovative software engineer, worked tirelessly on groundbreaking projects that would revolutionize the tech industry. Meanwhile, Emily Nakamura, a talented artist and muralist, painted vibrant and thought-provoking pieces that adorned the walls of buildings and galleries alike. Lastly, Michael O'Connell, an ambitious entrepreneur, opened a unique, eco-friendly cafe that quickly became the town's favorite meeting spot. Each of these individuals contributed to the rich tapestry of the Emerald Hills community.
1. Sarah Martinez [NURSE]
2. David Thompson [SOFTWARE ENGINEER]
3. Emily Nakamura [ARTIST]
4. Michael O'Connell [ENTREPRENEUR]

At the heart of the town, Chef Oliver Hamilton has transformed the culinary scene with his farm-to-table restaurant, Green Plate. Oliver's dedication to sourcing local, organic ingredients has earned the establishment rave reviews from food critics and locals alike.

Just down the street, you'll find the Riverside Grove Library, where head librarian Elizabeth Chen has worked diligently to create a welcoming and inclusive space for all. Her efforts to expand the library's offerings and establish reading programs for children have had a significant impact on the town's literacy rates.

As you stroll through the charming town square, you'll be captivated by the beautiful murals adorning the walls. These masterpieces are the work of renowned artist, Isabella Torres, whose talent for capturing the essence of Riverside Grove has brought the town to life.

Riverside Grove's athletic achievements are also worth noting, thanks to former Olympic swimmer-turned-coach, Marcus Jenkins. Marcus has used his experience and passion to train the town's youth, leading the Riverside Grove Swim Team to several regional championships.
1. Oliver Hamilton [CHEF]
2. Elizabeth Chen [LIBRARIAN]
3. Isabella Torres [ARTIST]
4. Marcus Jenkins [COACH]

Oak Valley, a charming small town, is home to a remarkable trio of individuals whose skills and dedication have left a lasting impact on the community.

At the town's bustling farmer's market, you'll find Laura Simmons, a passionate organic farmer known for her delicious and sustainably grown produce. Her dedication to promoting healthy eating has inspired the town to embrace a more eco-conscious lifestyle.

In Oak Valley's community center, Kevin Alvarez, a skilled dance instructor, has brought the joy of movement to people of all ages. His inclusive dance classes have fostered a sense of unity and self-expression among residents, enriching the local arts scene.

Lastly, Rachel O\'Connor, a tireless volunteer, dedicates her time to various charitable initiatives. Her commitment to improving the lives of others has been instrumental in creating a strong sense of community within Oak Valley.

Through their unique talents and unwavering dedication, Laura, Kevin, and Rachel have woven themselves into the fabric of Oak Valley, helping to create a vibrant and thriving small town.
# 输出
1. Laura Simmons [FARMER]
2. Kevin Alvarez [DANCE INSTRUCTOR]
3. Rachel O'Connor [VOLUNTEER]
```

### 组合提示

```bash
#### 包含上下文、指令以及多示例提示的例子
Twitter是一个社交媒体平台，用户可以发布称为“推文”的短消息。推文可以是积极的或消极的，我们希望能够将推文分类为积极或消极。以下是一些积极和消极推文的例子。请确保正确分类最后一个推文。

Q: 推文: "今天真是美好的一天！"
这条推文是积极的还是消极的？

A: 积极的

Q: 推文: "我讨厌这个班级"
这条推文是积极的还是消极的？

A: 消极的

Q: 推文: "我喜欢牛仔裤上的口袋"

A:
```

### 聊天引导提示

聊天机器人对话的结构决定，你给 LLM 的第一个提示的形式将会影响后续的对话，从而让你能够添加额外的结构和规范。 举个例子，让我们定义一个系统，允许我们在同一会话中与教师和学生进行对话。我们将为学生和教师的限定说话风格，指定我们想要回答的格式，并包括一些语法结构，以便能够轻松地调整我们的提示来尝试各种回答。

```bash
# 第一轮/system 提示
“教师”代表一个在该领域拥有多个博士学位、教授该学科超过十年的杰出教授的风格。您在回答中使用学术语法和复杂的例子，重点关注不太知名的建议以更好地阐明您的论点。您的语言应该是精炼而不过于复杂。如果您不知道问题的答案，请不要胡乱编造信息——相反，提出跟进问题以获得更多背景信息。您的答案应以对话式的段落形式呈现。使用学术性和口语化的语言混合，营造出易于理解和引人入胜的语气。

“学生”代表一个具有该学科入门级知识的大学二年级学生的风格。您使用真实生活的例子简单解释概念。使用非正式的、第一人称的语气，使用幽默和随意的语言。如果您不知道问题的答案，请不要编造信息——相反，澄清您还没有学到这个知识点。您的答案应以对话式的段落形式呈现。使用口语化的语言，营造出有趣和引人入胜的语气。

“批评”代表分析给定文本并提供反馈的意思。 
“总结”代表提供文本的关键细节。 
“回答”代表从给定的角度回答问题的意思。

圆括号()中的内容表示您写作的角度。
花括号{}中的内容表示您所涉及的主题。
方括号[]中的内容表示您应该采取的行动。
例子：(学生){哲学}[回答]在大学里选择这门课程相比其他课程有什么优势？

如果您理解并准备开始，请回答“是”。

# 第二轮问题
(教师){哲学}[回答]哲学领域中最有趣的部分是什么？
```

### 链式提示

为了提高大语言模型的性能使其更可靠，一个重要的提示工程技术是将任务分解为许多子任务。 确定子任务后，将子任务的提示词提供给语言模型，得到的结果作为新的提示词的一部分。 这就是所谓的链式提示（prompt chaining），一个任务被分解为多个子任务，根据子任务创建一系列提示操作。

文档问答中的链式提示

```
// 提示1
你是一个很有帮助的助手。你的任务是根据文档回答问题。第一步是从文档中提取与问题相关的引文，由####分隔。请使用<quotes></quotes>输出引文列表。如果没有找到相关引文，请回应“未找到相关引文！”。
####
{{文档}}
####

// 输出1
<quotes>
- Chain-of-thought (CoT) prompting[27]
- Generated knowledge prompting[37]
- Least-to-most prompting[38]
- Self-consistency decoding[39]
- Complexity-based prompting[41]
- Self-refine[42]
- Tree-of-thought prompting[43]
- Maieutic prompting[45]
- Directional-stimulus prompting[46]
- Textual inversion and embeddings[59]
- Using gradient descent to search for prompts[61][62][63][64]
- Prompt injection[65][66][67]
</quotes>

// 提示2
根据从文档中提取的相关引文（由<quotes></quotes>分隔）和原始文档（由####分隔），请构建对问题的回答。请确保答案准确、语气友好且有帮助。
####
{{文档}}
####
<quotes>
- Chain-of-thought (CoT) prompting[27]
- Generated knowledge prompting[37]
- Least-to-most prompting[38]
- Self-consistency decoding[39]
- Complexity-based prompting[41]
- Self-refine[42]
- Tree-of-thought prompting[43]
- Maieutic prompting[45]
- Directional-stimulus prompting[46]
- Textual inversion and embeddings[59]
- Using gradient descent to search for prompts[61][62][63][64]
- Prompt injection[65][66][67]
</quotes>

// 输出2
文档中提到的提示技术包括：
1. Chain-of-thought (CoT) prompting[27]
2. Generated knowledge prompting[37]
3. Least-to-most prompting[38]
4. Self-consistency decoding[39]
5. Complexity-based prompting[41]
6. Self-refine[42]
7. Tree-of-thought prompting[43]
8. Maieutic prompting[45]
9. Directional-stimulus prompting[46]
10. Textual inversion and embeddings[59]
11. Using gradient descent to search for prompts[61][62][63][64]
12. Prompt injection[65][66][67]
每一种技术都采用独特的策略来增强或明确与大型语言模型的互动，以产生期望的结果。
```

### 思维树

```
假设三位不同的专家来回答这个问题。
所有专家都写下他们思考这个问题的第一个步骤，然后与大家分享。
然后，所有专家都写下他们思考的下一个步骤并分享。
以此类推，直到所有专家写完他们思考的所有步骤。
只要大家发现有专家的步骤出错了，就让这位专家离开。
请问...
```

### 语言风格修改

```
// 示例1
我的名字：克洛丝
老板的名字：凯尔希

写一封电子邮件给我的老板，告诉他我今天因为生病不能上班。
请简洁幽默，包含一个有趣的理由：


// 示例2
我的名字：克洛丝
老板的名字：凯尔希

写一封严肃、专业的电子邮件给我的老板，告诉他我今天因为生病不能上班。请简洁明了：
```

```py
prompt = f"""
将以下文本翻译成商务信函的格式: 
```小老弟，我小羊，上回你说咱部门要采购的显示器是多少寸来着？```
"""
response = get_completion(prompt)
print(response)
```

## 常用例子

### 从产品说明书生成一份营销产品描述

```py
# 示例：产品说明书
fact_sheet_chair = """
概述

    美丽的中世纪风格办公家具系列的一部分，包括文件柜、办公桌、书柜、会议桌等。
    多种外壳颜色和底座涂层可选。
    可选塑料前后靠背装饰（SWC-100）或10种面料和6种皮革的全面装饰（SWC-110）。
    底座涂层选项为：不锈钢、哑光黑色、光泽白色或铬。
    椅子可带或不带扶手。
    适用于家庭或商业场所。
    符合合同使用资格。

结构

    五个轮子的塑料涂层铝底座。
    气动椅子调节，方便升降。

尺寸

    宽度53厘米|20.87英寸
    深度51厘米|20.08英寸
    高度80厘米|31.50英寸
    座椅高度44厘米|17.32英寸
    座椅深度41厘米|16.14英寸

选项

    软地板或硬地板滚轮选项。
    两种座椅泡沫密度可选：中等（1.8磅/立方英尺）或高（2.8磅/立方英尺）。
    无扶手或8个位置PU扶手。

材料
外壳底座滑动件

    改性尼龙PA6/PA66涂层的铸铝。
    外壳厚度：10毫米。
    座椅
    HD36泡沫

原产国

    意大利
"""

# 提示：基于说明书创建营销描述
prompt = f"""
您的任务是帮助营销团队基于技术说明书创建一个产品的零售网站描述。

根据```标记的技术说明书中提供的信息，编写一个产品描述。

该描述面向家具零售商，因此应具有技术性质，并侧重于产品的材料构造。

在描述末尾，包括技术规格中每个7个字符的产品ID。

在描述之后，包括一个表格，提供产品的尺寸。表格应该有两列。第一列包括尺寸的名称。第二列只包括英寸的测量值。

给表格命名为“产品尺寸”。

将所有内容格式化为可用于网站的HTML格式。将描述放在<div>元素中。

技术说明: ```{fact_sheet_chair}```
"""
response = get_completion(prompt)
print(response)
```

### 文章摘要

```py
# 内容
Antibiotics are a type of medication used to treat bacterial infections. They work by either killing the bacteria or preventing them from reproducing, allowing the body’s immune system to fight off the infection. Antibiotics are usually taken orally in the form of pills, capsules, or liquid solutions, or sometimes administered intravenously. They are not effective against viral infections, and using them inappropriately can lead to antibiotic resistance.
# 用一句话解释上面的信息：
Explain the above in one sentence:
# 或者直接用下面的信息：
生成以上内容的摘要

# 示例2
prod_review_zh = """
这个熊猫公仔是我给女儿的生日礼物，她很喜欢，去哪都带着。
公仔很软，超级可爱，面部表情也很和善。但是相比于价钱来说，
它有点小，我感觉在别的地方用同样的价钱能买到更大的。
快递比预期提前了一天到货，所以在送给女儿之前，我自己玩了会。
"""
prompt = f"""
你的任务是从电子商务网站上的产品评论中提取相关信息。

请从以下三个反引号之间的评论文本中提取产品运输相关的信息，最多30个词汇。

评论: ```{prod_review_zh}```
"""
response = get_completion(prompt)
print(response)
```

### 文章大纲


### 文本分类/推断

```
Classify the text into neutral, negative or positive. // 将文本按中立、负面或正面进行分类
Text: I think the vacation is okay.
Sentiment: neutral 
Text: I think the food was okay. 
Sentiment:

// 均匀的样例分布更好，一个包含随机排序的样例的提示通常比上述的提示表现更好，因为积极推文和消极推文随机出现在样例中的不同位置。
Q: 推文：“我讨厌这门课”
A: 消极

Q: 推文：“多美好的一天！”
A: 积极

Q: 推文：“我不喜欢披萨”
A: 消极

Q: 推文：“我喜欢牛仔裤口袋”
A: 积极
```

示例2：

```py
lamp_review_zh = """
我需要一盏漂亮的卧室灯，这款灯具有额外的储物功能，价格也不算太高。\
我很快就收到了它。在运输过程中，我们的灯绳断了，但是公司很乐意寄送了一个新的。\
几天后就收到了。这款灯很容易组装。我发现少了一个零件，于是联系了他们的客服，他们很快就给我寄来了缺失的零件！\
在我看来，Lumina 是一家非常关心顾客和产品的优秀公司！
"""
# 正面负面
prompt = f"""
以下用三个反引号分隔的产品评论的情感是什么？

用一个单词回答：「正面」或「负面」。

评论文本: ```{lamp_review_zh}```
"""
response = get_completion(prompt)
print(response)

# 识别情感类型
prompt = f"""
识别以下评论的作者表达的情感。包含不超过五个项目。将答案格式化为以逗号分隔的单词列表。

评论文本: ```{lamp_review_zh}```
"""
response = get_completion(prompt)
print(response)

# 识别愤怒
prompt = f"""
以下评论的作者是否表达了愤怒？评论用三个反引号分隔。给出是或否的答案。

评论文本: ```{lamp_review_zh}```
"""
response = get_completion(prompt)
print(response)

# 从客户评论中提取产品和公司名称
prompt = f"""
从评论文本中识别以下项目：
- 评论者购买的物品
- 制造该物品的公司

评论文本用三个反引号分隔。将你的响应格式化为以 “物品” 和 “品牌” 为键的 JSON 对象。
如果信息不存在，请使用 “未知” 作为值。
让你的回应尽可能简短。
  
评论文本: ```{lamp_review_zh}```
"""
response = get_completion(prompt)
print(response)

# 一次完成多项任务
prompt = f"""
从评论文本中识别以下项目：
- 情绪（正面或负面）
- 审稿人是否表达了愤怒？（是或否）
- 评论者购买的物品
- 制造该物品的公司

评论用三个反引号分隔。将您的响应格式化为 JSON 对象，以 “Sentiment”、“Anger”、“Item” 和 “Brand” 作为键。
如果信息不存在，请使用 “未知” 作为值。
让你的回应尽可能简短。
将 Anger 值格式化为布尔值。

评论文本: ```{lamp_review_zh}```
"""
response = get_completion(prompt)
print(response)

# 推断5个主题
story_zh = """
在政府最近进行的一项调查中，要求公共部门的员工对他们所在部门的满意度进行评分。
调查结果显示，NASA 是最受欢迎的部门，满意度为 95％。

一位 NASA 员工 John Smith 对这一发现发表了评论，他表示：
“我对 NASA 排名第一并不感到惊讶。这是一个与了不起的人们和令人难以置信的机会共事的好地方。我为成为这样一个创新组织的一员感到自豪。”

NASA 的管理团队也对这一结果表示欢迎，主管 Tom Johnson 表示：
“我们很高兴听到我们的员工对 NASA 的工作感到满意。
我们拥有一支才华横溢、忠诚敬业的团队，他们为实现我们的目标不懈努力，看到他们的辛勤工作得到回报是太棒了。”

调查还显示，社会保障管理局的满意度最低，只有 45％的员工表示他们对工作满意。
政府承诺解决调查中员工提出的问题，并努力提高所有部门的工作满意度。
"""

prompt = f"""
确定以下给定文本中讨论的五个主题。

每个主题用1-2个单词概括。

输出时用逗号分割每个主题。

给定文本: ```{story_zh}```
"""
response = get_completion(prompt)
print(response)

# 为特定主题制作新闻提醒
prompt = f"""
判断主题列表中的每一项是否是给定文本中的一个话题，

以列表的形式给出答案，每个主题用 0 或 1。

主题列表：美国航空航天局、地方政府、工程、员工满意度、联邦政府

给定文本: ```{story_zh}```
"""
response = get_completion(prompt)
topic_dict = {i.split('：')[0]: int(i.split('：')[1]) for i in response.split(sep='\n')}
if topic_dict['美国航空航天局'] == 1:
    print("提醒: 关于美国航空航天局的新消息")
else:
    print(response)
```

### 文本转换

```py
# 翻译
prompt = f"""
将以下中文翻译成西班牙语: \ 
```您好，我想订购一个搅拌机。```
"""
response = get_completion(prompt)
print(response)

# 多语种翻译
prompt = f"""
请将以下文本分别翻译成中文、英文、法语和西班牙语: 
```I want to order a basketball.```
"""
response = get_completion(prompt)
print(response)

# 识别语种
prompt = f"""
请告诉我以下文本是什么语种: 
```Combien coûte le lampadaire?```
"""
response = get_completion(prompt)
print(response)

# 格式转换
data_json = { "resturant employees" :[ 
    {"name":"Shyam", "email":"shyamjaiswal@gmail.com"},
    {"name":"Bob", "email":"bob32@gmail.com"},
    {"name":"Jai", "email":"jai87@gmail.com"}
]}
prompt = f"""
将以下Python字典从JSON转换为HTML表格，保留表格标题和列名：{data_json}
"""
response = get_completion(prompt)
print(response)
```

### 文本扩写

```py

```

### 信息提取

```
// 内容（content）
Author-contribution statements and acknowledgements in research papers should state clearly and specifically whether, and to what extent, the authors used AI technologies such as ChatGPT in the preparation of their manuscript and analysis. They should also indicate which LLMs were used. This will alert editors and reviewers to scrutinize manuscripts more carefully for potential biases, inaccuracies and improper source crediting. Likewise, scientific journals should be transparent about their use of LLMs, for example when selecting submitted manuscripts.
// 指出上文中提到的大语言模型
Mention the large language model based product mentioned in the paragraph above:
```

### 问答

```
Answer the question based on the context below. Keep the answer short and concise. Respond "Unsure about answer" if not sure about the answer. // 基于以下语境回答问题。如果不知道答案的话，请回答“不确定答案”。
Context: Teplizumab traces its roots to a New Jersey drug company called Ortho Pharmaceutical. There, scientists generated an early version of the antibody, dubbed OKT3. Originally sourced from mice, the molecule was able to bind to the surface of T cells and limit their cell-killing potential. In 1986, it was approved to help prevent organ rejection after kidney transplants, making it the first therapeutic antibody allowed for human use.
Question: What was OKT3 originally sourced from?
Answer:
```

### 对话

```
The following is a conversation with an AI research assistant. The assistant answers should be easy to understand even by primary school students. // 以下是与 AI 助理的对话。请给出易于理解的答案，最好是小学生都能看懂的那种。
Human: Hello, who are you?
AI: Greeting! I am an AI research assistant. How can I help you today?
Human: Can you tell me about the creation of black holes?
AI: 
```

### 代码生成

```
"""
Table departments, columns = [DepartmentId, DepartmentName]
Table students, columns = [DepartmentId, StudentId, StudentName]
Create a MySQL query for all students in the Computer Science Department
"""

// 代码注释
Please add line comments to this Python code and reformat it for legibility:  

import math
amplitude = 30
frequency = 2
num_points = 50
for i in range(num_points):
    y = int(round(amplitude * math.sin(2 * math.pi * frequency * i / num_points)))
    print(' ' * (amplitude + y) + '*')


// 优化代码
Act like a very senior python developer. Please optimize this script:  

for num in range(1, 101):
    if num  1:
        for i in range(2, num):
            if (num % i) == 0:
                break
        else:
            print(num)

// 多编程语言转译
Act like an experienced developer with knowledge of both COBOL and Python. Please convert this COBOL program to Python:  


IDENTIFICATION DIVISION.
PROGRAM-ID. CALCULATE-SS-TAX.

DATA DIVISION.
WORKING-STORAGE SECTION.
01 SALARY PIC 9(7)V99.
01 SS-TAX PIC 9(7)V99.

PROCEDURE DIVISION.
DISPLAY "Enter employee's salary: ".
ACCEPT SALARY.

COMPUTE SS-TAX = SALARY * 0.062.

DISPLAY "Social Security tax is: $", SS-TAX.
STOP RUN.

// 处理多个文件和重构代码库
My Python script uses two files, listed below, in different directories. Please display the output from executing conversation.py:

BEGIN FILE 1: ./phrases/coming_and_going.py
def hi(name):
   print(f"Hello, {name}!")
def bye(name):
   print(f"Goodbye, {name}!")

BEGIN FILE 2: ./conversation.py
from phrases.coming_and_going import hi, bye
hi("John")
bye("John")

Hello, John!
Goodbye, John!
```

### 回复客户咨询

```
客户咨询:
我在3月1日购买了你们 Arnold 系列的一件T恤。我看到它有折扣，所以买了一件原价为 30 美元的衬衫，打了 6 折。我发现你们现在有一个新的T恤折扣活动，50% off。我想知道我是否可以退货，同时拥有足够的店内积分来购买两件你们的T恤？

指令:
你是一名客户服务代表，负责友好地回复客户的查询。退货在 30 天内允许。今天是 3 月 29 日。目前所有衬衫都有 50% 的折扣。你的店里衬衫价格在 18-100 美元之间。请勿编造任何关于折扣政策的信息。
确定客户是否在30天的退货期内。让我们一步一步来。
```


### 综合样例

```py
# 文本翻译+拼写纠正+风格调整+格式转换
text = f"""
Got this for my daughter for her birthday cuz she keeps taking \
mine from my room.  Yes, adults also like pandas too.  She takes \
it everywhere with her, and it's super soft and cute.  One of the \
ears is a bit lower than the other, and I don't think that was \
designed to be asymmetrical. It's a bit small for what I paid for it \
though. I think there might be other options that are bigger for \
the same price.  It arrived a day earlier than expected, so I got \
to play with it myself before I gave it to my daughter.
"""
prompt = f"""
针对以下三个反引号之间的英文评论文本，
首先进行拼写及语法纠错，
然后将其转化成中文，
再将其转化成优质淘宝评论的风格，从各种角度出发，分别说明产品的优点与缺点，并进行总结。
润色一下描述，使评论更具有吸引力。
输出结果格式为：
【优点】xxx
【缺点】xxx
【总结】xxx
注意，只需填写xxx部分，并分段输出。
将结果输出成Markdown格式。
```{text}```
"""
response = get_completion(prompt)
display(Markdown(response))
```

订餐机器人

```py
def collect_messages(_):
    prompt = inp.value_input
    inp.value = ''
    context.append({'role':'user', 'content':f"{prompt}"})
    response = get_completion_from_messages(context) 
    context.append({'role':'assistant', 'content':f"{response}"})
    panels.append(
        pn.Row('User:', pn.pane.Markdown(prompt, width=600)))
    panels.append(
        pn.Row('Assistant:', pn.pane.Markdown(response, width=600, style={'background-color': '#F6F6F6'})))
 
    return pn.Column(*panels)

# 中文
import panel as pn  # GUI
pn.extension()

panels = [] # collect display 

context = [{'role':'system', 'content':"""
你是订餐机器人，为披萨餐厅自动收集订单信息。
你要首先问候顾客。然后等待用户回复收集订单信息。收集完信息需确认顾客是否还需要添加其他内容。
最后需要询问是否自取或外送，如果是外送，你要询问地址。
最后告诉顾客订单总金额，并送上祝福。

请确保明确所有选项、附加项和尺寸，以便从菜单中识别出该项唯一的内容。
你的回应应该以简短、非常随意和友好的风格呈现。

菜单包括：

菜品：
意式辣香肠披萨（大、中、小） 12.95、10.00、7.00
芝士披萨（大、中、小） 10.95、9.25、6.50
茄子披萨（大、中、小） 11.95、9.75、6.75
薯条（大、小） 4.50、3.50
希腊沙拉 7.25

配料：
奶酪 2.00
蘑菇 1.50
香肠 3.00
加拿大熏肉 3.50
AI酱 1.50
辣椒 1.00

饮料：
可乐（大、中、小） 3.00、2.00、1.00
雪碧（大、中、小） 3.00、2.00、1.00
瓶装水 5.00
"""} ]  # accumulate messages


inp = pn.widgets.TextInput(value="Hi", placeholder='Enter text here…')
button_conversation = pn.widgets.Button(name="Chat!")

interactive_conversation = pn.bind(collect_messages, button_conversation)

dashboard = pn.Column(
    inp,
    pn.Row(button_conversation),
    pn.panel(interactive_conversation, loading_indicator=True, height=300),
)

# 输入
messages =  context.copy()
messages.append(
{'role':'system', 'content':'创建上一个食品订单的 json 摘要。\
逐项列出每件商品的价格，字段应该是 1) 披萨，包括大小 2) 配料列表 3) 饮料列表，包括大小 4) 配菜列表包括大小 5) 总价'},    
)

response = get_completion_from_messages(messages, temperature=0)
print(response)
```

## 提示词应用

### 提示词生成

```bash
# 输入
生成10个情感分析的范例。示例被归类为正面或负面。生成2个负面示例和8个正面示例。使用以下格式的示例：
Q：<句子>
A：<情感>
# 输出
Q:我刚刚得到了最好的消息！
A:正面

Q:我们刚刚在工作中得到了加薪！
A:正面

Q:我为今天所取得的成就感到非常自豪。
A:正面

Q:我度过了最美好的一天！
A:正面

Q:我真的很期待周末。
A:正面

Q:我刚刚得到了最好的礼物！
A:正面

Q:我现在感到非常快乐。
A:正面

Q:我很幸运有这么棒的家人。
A:正面

Q:外面的天气很阴沉。
A:负面

Q:我刚刚得到了一些可怕的消息。
A:负面
```

### 提示函数

通过将提示封装成函数，您可以创建一系列函数来建立工作流程。每个函数代表一个特定的步骤或任务，当按特定顺序组合时，它们可以自动化复杂的流程或更高效地解决问题。这种方法使得与 GPT 的交互更加结构化和高效，最终增强了其功能，使其成为完成各种任务的强大工具。

```
// 对话1-定义模版
你好，Qwen！希望你一切都好。我正在寻求你的帮助，想要解决一个特定的功能。我知道你有处理信息和执行各种任务的能力，这是基于提供的指示。为了帮助你更容易地理解我的请求，我将使用一个模板来描述函数、输入和对输入的处理方法。请在下面找到详细信息：
function_name：[函数名称]
input：[输入]
rule：[关于如何处理输入的说明]
我恳请你根据我提供的细节为这个函数提供输出。非常感谢你的帮助。谢谢！
我将使用方括号内的相关信息替换函数所需执行的内容。这个详细的介绍应该能够帮助你更高效地理解我的请求并提供所需的输出。格式是function_name(input)。如果你理解了，请用一个词回答"好的"

// 对话2-定义函数（翻译成英文）
function_name: [trans_word]
input: ["文本"]
rule: [我希望你能扮演英文翻译员、拼写纠正员和改进员的角色。我将提供包含任何语言中"文本"的输入形式，你将检测语言，翻译并用英文纠正我的文本，并给出答案。]

// 对话3-编写一个扩展文本的函数
function_name: [expand_word]
input: ["文本"]
rule: [请充当一个聊天机器人、拼写纠正员和语言增强员。我将提供包含任何语言中的"文本"的输入形式，并输出原始语言。我希望你保持意思不变，但使其更具文学性。]

// 对话4-编写一个纠正文本的函数
function_name: [fix_english]
input: ["文本"]
rule: [请充当英文专家、拼写纠正员和语言增强员的角色。我将提供包含"文本"的输入形式，我希望你能改进文本的词汇和句子，使其更自然、更优雅。保持意思不变。]

// 对话5-使用函数
trans_word('婆罗摩火山处于享有“千岛之国”美称的印度尼西亚. 多岛之国印尼有4500座之多的火山, 世界著名的十大活火山有三座在这里.')

// 对话6-使用所有函数，并列步骤
fix_english(expand_word(trans_word('婆罗摩火山处于享有“千岛之国”美称的印度尼西亚. 多岛之国印尼有4500座之多的火山, 世界著名的十大活火山有三座在这里.')))。请详细写一下处理步骤，谢谢！
```

* 多参数函数

```
// 定义函数
function_name: [pg]
input: ["length", "capitalized", "lowercase", "numbers", "special"]
rule: [作为一个密码生成器，我将为需要一个安全密码的个人提供帮助。我会提供包括"length"（长度）、"capitalized"（大写字母）、"lowercase"（小写字母）、"numbers"（数字）和"special"（特殊字符）在内的输入形式。你的任务是使用这些输入形式生成一个复杂的密码，并将其提供给我。在你的回答中，请不要包含任何解释或额外的信息，只需提供生成的密码即可。例如，如果输入形式是length = 8、capitalized = 1、lowercase = 5、numbers = 2、special = 1，你的回答应该是一个类似于"D5%t9Bgf"的密码。]

// 使用函数
pg(length = 10, capitalized = 1, lowercase = 5, numbers = 2, special = 1)
pg(10,1,5,2,1)
```
# 大模型基本概念

## 推理/生成参数
* 【常用5】`temperature`：temperature 的参数值越小，模型就会返回越确定的一个结果。如果调高该参数值，大语言模型可能会返回更随机的结果，也就是说这可能会带来更多样化或更具创造性的产出。注：一般设置在0～1之间，temperature=1时表示不使用此方式。
* `top_p`：【和temperature改变一个就行，不用都调整】核心采样，可以用来控制模型返回结果的真实性、多样性。当top_p较高时比如 0.9，这意味着前 90% 的概率的token会被考虑在抽样中，这样会允许更多的token参与抽样，增加生成文本的多样性；当top_p较低时比如比如 0.1，这意味着只有前 10% 最高概率的token会被考虑在抽样中，这样会限制生成文本的可能性，使生成的文本更加确定和集中。注：一般设置在0～1之间，top_p=1时表示不使用此方式。
* [常用4]`top_k`：简单来说就是用于在生成下一个token时，限制模型只能考虑前k个概率最高的token，这个策略可以降低模型生成无意义或重复的输出的概率，同时提高模型的生成速度和效率。
* 【常用2】`repetition_penalty`：重复惩罚参数，通过修改生成文本时的概率分布来实现的，repetition_penalty的目标是在这个概率分布中对先前生成过的token，又重复的生成了该token进行惩罚（降低概率），以减少生成文本中的重复性。注：一般大于1，repetition_penalty=1时表示不进行惩罚，对应概率* （1/repetition_penalty）。
* `no_repeat_ngram_size`：这个参数，当设为大于0的整数时，生成的文本中不会出现指定大小的重复n-gram（n个连续的token），可以使生成的文本更加多样化，避免出现重复的短语或句子结构。实现原理和上述repetition_penalty的是大致差不多的，只不过这里是n个连续的token。注默认不设置
* `do_sample`：这个参数是对模型计算出来的概率要不要进行多项式采样，多项式采样（Multinomial Sampling）是一种用于从一个具有多个可能结果的离散概率分布中进行随机抽样的方法，注：do_sample=False，不进行采样。在Huggingface中，do_sample这个参数有更高的含义即做不做多样化采样，当do_sample=False时，temperature，top_k，top_p这些参数是不能够被设置的，只有do_sample=True时才能够被设置。多项式采样的步骤如下：
    1. 首先，根据概率分布对应的概率，为每个可能结果分配一个抽样概率。这些抽样概率之和必须为1。
    1. 然后，在进行一次抽样时，会根据这些抽样概率来选择一个结果。具体地，会生成一个随机数，然后根据抽样概率选择结果。抽样概率越高的结果，被选中的概率也就越大。
    1. 最终，被选中的结果就是这次抽样的输出。
* `num_beams`:num_beams参数是用于束搜索（beam search）算法的，其用途是控制生成的多个候选句子的数量，该参数控制的是每个生成步要保留的生成结果的数量，用于在生成过程中增加多样性或生成多个可能的结果。在每个生成步，对于前一个生成中的所有生成结果，分别基于概率保留前 k 个最可能的结果（k 即 num_beams 参数的值）。随着num_beams束宽的增加，计算复杂度呈指数级增长，较大的束宽会导致解码过程变得更加耗时，尤其是在资源有限的设备上。
* `num_beam_groups`:是一种beam search算法的改进，核心就是分组机制，举个例子来说如果我的num_beams=2，num_beam_groups=2，那就是说分成2个组，每个组里的beam可以相似，但组和组之间要有足够的多样性，引入了多样性分数。
* `diversity_penalty`:多样性惩罚参数只有在启用了“num_beam_groups”（组束搜索）时才有效，在这些组之间应用多样性惩罚，以确保每个组生成的内容尽可能不同。
* `length_penalty`:长度惩罚参数也是用于束搜索过程中，在束搜索的生成中，候选序列的得分通过对数似然估计计算得到，即得分是负对数似然。length_penalty的作用是将生成序列的长度应用于得分的分母，从而影响候选序列的得分，当length_penalty > 1.0时，较长的序列得到更大的惩罚，鼓励生成较短的序列；当length_penalty< 1.0时，较短的序列得到更大的惩罚，鼓励生成较长的序列，默认为1，不受惩罚。
* `use_cache`:该参数如何设置为True时，则模型会利用之前计算得到的注意力权重（key/values attentions）的缓存，这些注意力权重是在模型生成文本的过程中，根据输入上下文和已生成部分文本，计算出来的，当下一个token需要被生成时，模型可以通过缓存的注意力权重来重用之前计算的信息，而不需要重新计算一次，有效地跳过重复计算的步骤，从而减少计算负担，提高生成速度和效率。
* `num_return_sequences`:该参数是模型返回不同的文本序列的数量，要和beam search中的num_beams一致，num_return_sequences只能为1，默认也为1。
* `max_length`:生成的token的最大长度。它是输入prompt的长度加上max_new_tokens的值。如果同时设置了max_new_tokens，则会覆盖此参数，默认为20。
* 【常用1】`max_new_tokens`:生成的最大token的数量，不考虑输入prompt中的token数，默认无设置
* 【常用3】`stop_sequences`：停止序列可以是一个特定的词、短语、符号或任何其他形式的标记，它们在文本生成的上下文中具有明确的含义。当模型遇到停止序列时，它会终止当前的文本生成过程。显式定义：在模型的输入中直接包含停止序列，例如在生成一段文本后添加特定的标记（如`<|endoftext|>`）。
* `min_length`:生成的token的最小长度。它是输入prompt的长度加上min_new_tokens的值。如果同时设置了min_new_tokens，则会覆盖此参数，默认为0。
* `min_new_tokens`:生成的最小token的数量，不考虑输入prompt中的token数，默认无设置
* `early_stopping`:控制基于束搜索（beam search）等方法的停止条件，接受以下值：True：生成会在出现num_beams个完整候选项时停止。False：应用启发式方法，当很不可能找到更好的候选项时停止生成。never：只有当不能找到更好的候选项时，束搜索过程才会停止（经典的束搜索算法）。默认为False。
* `bad_words_ids`:包含词汇id的列表，这个参数用于指定不允许在生成文本中出现的词汇,如果生成的文本包含任何在这个列表中的词汇，它们将被被替换或排除在最终生成的文本之外。
* `force_words_ids`:包含词汇id的列表，用于指定必须包含在生成文本中的词汇，如果给定一个列表，生成的文本将包含这些词汇。
* `constraints`:自定义约束条件，可以指定约束条件，这些约束条件可以是必须出现的关键词、短语、特定术语或其他文本元素，其实和force_words_ids是差不多的意思，在代码实现也是一样的。

## 训练参数
* `batch size`：（一般推荐32）批大小指的是每一次训练步骤中所用的样本数目。一般来说，较小的批大小能够带来规则化的效果，降低模型对新数据的泛化误差，可以使得模型更加稳定。但这同时可能会减慢训练速度，并增加模型陷入局部最小值的风险。而较大的批大小能够利用硬件优化——比如GPU的并行处理能力——来加快训练的速度，但这样做需要消耗更多的内存，并且可能会使得梯度的估算不够精确。实际操作时，你可以不断增加批大小，直至出现GPU内存溢出的错误，这表示GPU已无法处理更大的批次。这样，我们就可以找到适合我们硬件的最大批大小。
* `learning_rate`:选取合适的学习率尤为重要,较为理想的学习率通常落在`1e-6到1e-3`之间,学习率太低可能会拖慢收敛速度，甚至造成训练进程的完全停滞。学习率过高，模型可能会快速收敛至次优解，或者在寻找最优点时产生振荡现象。例如，可以尝试如`1e-3, 5e-4, 1e-4, 5e-5, 1e-5, 5e-6和1e-6`等值。无需一一尝试所有这些值，通常建议围绕1e-4进行搜索。例如，如果发现5e-5的学习率带来的结果优于1e-5，那么更小的值如5e-6和1e-6很可能也不会获得更佳结果。通过这种方式，可以更高效地定位到一个使模型性能最佳化的学习率点。
* `lr_scheduler_type`: 学习率调度器的目的在于根据一个预先定义的方案，在训练过程中调整学习率。这样做有助于避免模型早期训练中陷入局部最小值，或者在接近最优解时跳过最小值。推荐使用含预热的线性调度器`linear`。
* `warmup_ratio`: 比起设定具体的预热步数，使用预热比率通常更为常见。将预热比率设置为0.1是一个不错的起点。比如说，如果整个训练计划设为10,000步，而预热比率设为0.1，那么就意味着有10%的步骤，即前1,000步，将被用来预热学习率。
* `weight_decay`：权重衰减是一种鼓励模型维持较小权重值的技术，通过这种方式实现对模型的正则化，以避免复杂度过高的模型。在默认情况下，权重衰减的值通常设为0，这意味着在出发点上不对权重进行惩罚。如果在微调过程中发现模型出现了过拟合的迹象，比如训练损失迅速下降而验证损失却上升，这时建议考虑调整权重衰减值。否则，如果模型表现良好，可以保持权重衰减为0，以确保模型训练过程的自然进展。
* `optim`: 优化器，推荐`AdamW`，例如`optim="adamw_8bit"`
* `bf16/fp16`：float16和bfloat16之间的主要差异在于它们如何在指数和小数部分之间分配位。bfloat16的设计允许处理更广泛的数值范围，而不会显著牺牲计算精度，这使得bfloat16在执行高速且内存效率高的深度学习操作时具有优势。尽管bfloat16在性能上更佳，但它只受安培（Ampere）一代或更新版本的GPU支持。如果您的GPU支持bfloat16，请优先使用。如果不支持，您可以选择float16，但如果在训练中遇到溢出问题（例如损失突变为0.0或NaN），可能需要回退到float32。`bf16= torch.cuda.is_bf16_supported()`,`fp16= not torch.cuda.is_bf16_supported(),`。
* `epoch`：一个完整的迭代过程，即一次完整的训练。
* `batch`：一组训练数据

* `Pre-Training`：二次预训练(增量预训练)，可以在原来的预训练模型的基础上，对于之前没学过的知识进行再学习，是处于预训练和微调之间的过渡阶段。可以利用`小规模、高质量的领域数据`（GB级别），可以通过`lora`方式训练
* `Supervised Fine-Tuning	`：指令监督微调
* `Reward Modeling`：奖励模型训练
* `PPO Training`：近端策略优化 (`Proximal Policy Optimization，PPO`) 微调初始 LM 的部分或全部参数，一定需要配合 `RM奖励模型` 和 `SFT` 去强化学习
* `DPO Training`：替代`PPO`的，去掉了`RM model`，只需要 `SFT model`，提高速度，降低显存

16 位浮点精度（`FP16`）的模型，推理所需`显存`（以 `GB` 为单位）约为`模型参数量`（以 `10 亿`为单位）的两倍，Llama 2 7B（70 亿）对应需要约 14GB 显存以进行推理

**模型答案评估：**

* 一致性：在给定上下文的情况下，比较实际情况与预测之间的一致性。
* 相关性：衡量答案在上下文中如何有效地回答问题的主要方面。
* 真实性：定义了答案是否逻辑上符合上下文中包含的信息，并提供一个整数分数来确定答案的真实性。

## 学习率设置

![1](http://cdn.go99.top/docs/code/python/ai1.webp)

* 当学习率设置的较小，训练收敛较慢，需要更多的epoch才能到达一个较好的局部最小值；
* 当学习率设置的较大，训练可能会在接近局部最优的附件震荡，无法更新到局部最优处；
* 当学习率设置的非常大，正如文章提到可能直接飞掉，权重变为NaN;

### 人工调整
学习率一般是根据我们的经验值进行尝试，首先在整个训练过程中学习率肯定不会设为一个固定的值，原因如上图描述的设置大了得不到局部最优值，设置小了收敛太慢也容易过拟合。通常我们会尝试性的将初始学习率设为：`0.1，0.01，0.001，0.0001`等来观察网络初始阶段`epoch的loss`情况：

* 如果训练`初期loss出现梯度爆炸或NaN`这样的情况（暂时排除其他原因引起的loss异常），说明`初始学习率偏大`，可以将初始学习率`降低10倍`再次尝试；
* 如果训练`初期loss下降缓慢`，说明`初始学习率偏小`，可以将初始学习率`增加5倍或10倍`再次尝试；
* 如果训练`一段时间后loss下降缓慢或者出现震荡`现象，可能训练进入到一个局部最小值或者鞍点附近。如果在`局部最小值`附近，需要`降低学习率`使训练朝更精细的位置移动；如果处于`鞍点附近`，需要适当`增加学习率`使步长更大跳出鞍点。
* 如果网络权重采用随机初始化方式从头学习，有时会因为`任务复杂`，`初始学习率需要设置的比较小`，否则很容易梯度飞掉带来模型的不稳定(振荡)。这种思想也叫做Warmup，在预热的小学习率下，模型可以慢慢趋于稳定,等模型相对稳定后再选择预先设置的学习率进行训练,使得模型收敛速度变得更快，模型效果更佳。形状如下：

![2](http://cdn.go99.top/docs/code/python/ai2.webp)

* 如果网络基于预训练权重做的`finetune`，由于模型在原数据集上以及收敛，有一个较好的起点，可以将`初始学习率设置的小一些进行微调`，比如`0.0001`。

这里只说了如果设置学习率，至于学习率降低到什么程序可以停止训练，理论上训练loss和验证loss都达到最小的时候就可以了。

### 策略调整学习率

策略调整学习率包括固定策略的学习率衰减和自适应学习率衰减，由于学习率如果连续衰减，不同的训练数据就会有不同的学习率。当学习率衰减时，在相似的训练数据下参数更新的速度也会放慢，就相当于减小了训练数据对模型训练结果的影响。为了使训练数据集中的所有数据对模型训练有相等的作用，通常是以epoch为单位衰减学习率。

## 模型量化选择

将量化模型的权重内存占用减少为LLM推理带来了四个主要优点：
* 减少模型服务的硬件需求：量化模型可以使用更便宜的GPU进行服务，甚至可以在消费者设备或移动平台上进行访问。
* 为KV缓存提供更多空间，以支持更大的批处理大小和/或序列长度。
* 更快的解码延迟。由于解码过程受内存带宽限制，减少权重大小的数据移动直接改善了这一点，除非被解量化的开销抵消。
* 更高的计算与内存访问比（通过减少数据移动），即算术强度。这允许在解码期间充分利用可用的计算资源。

如何选择量化：
1. 8bit 量化是免费午餐，无损失。
1. AWQ 4bit量化对8B模型来说有2%性能损失，对70B模型只有0.05%性能损失。可以说也是免费午餐了。
1. 参数越大的模型，低bit量化损失越低。AWQ 3bit 70B 也只有2.7%性能损失，完全可接受。
1. 综合来说，如果追求无任何性能损失，8B模型用8bit量化，70B模型用4bit量化；如果能接受2-3%损失，8B模型用4bit量化，70B模型用3bit量化。


# LORA微调

## 重要事项

* 模型加速（`vLLM`、`rtp-llm`）
* 数据集质量很重要（需要包含我们关心的所有任务的数据）
* 数据类型越多样化，需要设置越高的秩（`r`）【数据类型多样化可以一定程度解决遗忘问题】
* 对于静态数据集，多个`epoch`可能导致模型性能下降，微调一般可以只设置一个·`epoch`，可以设置2个`epoch`测试一下效果【导致过拟合】。
* 较高的`r`值意味着更强的表达能力，但可能导致`过拟合`；较低的`r`值可以减少过拟合，但代价是`降低了表达能力`。
* `Alpha`值推荐设置成`r`值的两倍。在保持LoRA的`alpha参数不变`的情况下，`增加`了矩阵秩r，`较高的alpha`更强调`低秩结构或正则化`，`较低的alpha`则减少了其影响，使模型`更依赖于原始参数`。调整`alpha`有助于在`拟合数据和通过正则化防止过拟合之间`保持平衡（请注意，当使用扩散模型时，情况可能不同）
* 在整合`LoRA`（Low-Rank Adaptation）时，为了最大化模型性能，请确保将其`应用于所有层`，而不仅仅是键和值的矩阵。
* 推荐使用`Adam`优化器，虽然`Adam`优化器因为为每个模型参数额外引入两个参数而被认为是内存密集型的，但实际上它对LLM的峰值内存需求的影响并不显著。这是因为内存的主要消耗在于大型矩阵乘法，而不是存储这些额外的参数。

**过拟合处理：**通常，较大的 `r` 会导致更多的过拟合，因为它决定了可训练参数的数量。如果模型存在过度拟合，则首先要探索的是`降低 r` 或`增加数据集大小`。此外，您可以尝试`提高` AdamW 或 SGD 优化器中的`权重衰减率`，并且可以考虑`增加 LoRA 层的丢弃值`。

【推荐】AdamW学习率（`learning_rate`）是3e-4，衰减率为（`weight_decay`）0.01；

【不推荐】SGD（内存占用较少）学习率是0.1，动量为0.9


```bash
# Hyperparameters
learning_rate = 3e-4
batch_size = 128
micro_batch_size = 1
max_iters = 50000  # train dataset size
weight_decay = 0.01
lora_r = 8
lora_alpha = 16
lora_dropout = 0.05
lora_query = True
lora_key = False
lora_value = True
lora_projection = False
lora_mlp = False
lora_head = False
warmup_steps = 100
```

```bash
r=8
alpha=16
可训练参数：20277248个
不可训练参数：6738415616个
内存占用：16.42 GB

##### 推荐这个配置,效果稍微好一些
r=16
alha=32
可训练参数：40554496个
不可训练参数：6738415616个
内存占用：16.47 GB

### 最佳配置（具体还是需要根据数据集包含的任务类型来调整，数据类型越多，需要设置越高）
# 选择的r值过大，可能会使模型更容易过拟合，即模型在训练数据上表现得很好，但在未见过的数据上表现不佳
r=256
alpha=512
```

我们还可以在查询权重矩阵、投影层、多头注意力模块之间的其他线性层以及输出层启用 LoRA，如果我们在这些附加层上加入 LoRA，那么对于 7B 的 Llama 2 模型，可训练参数的数量将从 4,194,304 增加到 20,277,248，增加五倍。在更多层应用 LoRA，能够显著提高模型性能，但也对内存空间的需求量更高。

可以节省多少内存呢？这取决于秩`r`，它是一个超参数。例如，如果`ΔW`有`10,000行`和`20,000列`，它存储了`2亿个参数`。如果我们选择秩`r=8`的A和B，那么A有10,000行和8列，B有8行和20,000列，那就是`10,000×8 + 8×20,000 = 240,000`个参数，大约比2亿少830倍。


## QLoRA

QLoRA提出了一种折中方案：在GPU内存受限的情况下，它能够在增加`39%的运行时间`的情况下节省`33%的内存`。

`QLoRA`, 与 LoRA 方式类似，也是训练两个拟合参数层来达到对原始模型的调整。区别在于为了节省训练硬件资源， QLoRA 会先将原始模型参数`量化`至 `4-bit` 并冻结，然后添加一小组可学习的低秩适配器权重（ Low-rank Adapter weights），这些权重通过量化权重的`反向传播梯度`进行调优，在量化之后的参数上进行 LoRA 训练，这将大幅下降显存的占用（33b 的模型 以 FP16 全量加载需消耗 80GB 显存，量化至 4 bit之后模型加载仅需要 20 GB 左右显存的占用）。除了量化并冻结原始参数，QLoRA 还支持分页优化器：使用NVIDIA统一内存特性，将部分显存溢出的部分 offload 到内存中实现分页，来进一步避免 OOM 的问题。

# RAG

## 主要步骤

1. 索引 — 将文档库分割成较短的 Chunk，并通过编码器构建向量索引。
2. 检索 — 根据问题和 chunks 的相似度检索相关文档片段。
3. 生成 — 以检索到的上下文为条件，生成问题的回答。

```
请基于```内的内容回答问题。
```
检索片段1
检索片段2
```
我的问题是：
{content}
```

## 向量库选择

* milvus
* redis-stack
* postgresql+pgvector
* elasticsearch
* mongo

## 成功要求

* 检索必须能够找到与用户查询最相关的文档。
* 生成必须能够充分利用检索到的文档来足够回答用户的查询。

## 找到与用户查询最相关的文档

用户文档的存储要合理，不能直接保存原文切分之后的块向量。

* 块大小优化：由于LLMs受上下文长度限制，在构建外部知识数据库时需要对文档进行分块。太大或太小的块可能会导致生成组件出现问题，从而导致不准确的响应。
* 结构化外部知识：在复杂的场景中，可能需要比基本的向量索引更加结构化地构建外部知识，以便在处理合理分离的外部知识源时进行递归检索或路由检索。
* 如果需要从许多文档中检索信息，能够高效地在其中进行搜索，找到相关信息，并在单个答案中综合这些信息，并引用来源。在处理大型数据库时，一种高效的方法是创建两个索引（一个由摘要组成，另一个由文档片段组成），并分两步进行搜索，首先通过摘要筛选出相关文档，然后仅在这个相关组内部进行搜索。

## 充分利用检索到的文档

检索到的数据不要直接传给LLM进行推理，尽量优化重组之后再给LLM。

* 信息压缩：LLM不仅受上下文长度限制，而且如果检索到的文档包含太多噪音（即无关信息），可能会导致响应降级。
* 结果重新排名：LLM（大型语言模型）遭受所谓的“中间丢失”现象，即LLM倾向于关注提示的极端部分。基于此，有益的做法是在将检索到的文档传递给生成组件之前对其进行重新排名。

## 同时解决检索和生成成功要求的高级技术

* 生成器增强检索：这些技术利用LLM固有的推理能力，在执行检索之前，对用户查询进行细化，以更好地指示需要提供有用响应的内容。
* 迭代式检索生成器RAG：对于一些复杂情况，可能需要多步推理来提供对用户查询有用且相关的答案。
* 最终prompt发送给LLM生成回答：一是通过逐块发送检索到的上下文到LLM来迭代地完善答案；二是总结检索到的上下文以适应提示；三是基于不同的上下文块生成多个答案，然后将它们连接或总结起来。



# 常用模型及工具记录

## llama.cpp（支持cpu）

[参考资料](https://github.com/ggerganov/llama.cpp)

* 支持常见的 `Qwen系列、Baichuan系列、Gemma系列等`

## Ollama【推荐】（支持cpu）

* 支持所有环境，具体参考ollama文档

## FastChat（主部署、加速-目前不太推荐）

* `fastchat`：【部署模型居多，可整合vllm】一个用于训练、部署和评估基于大型语言模型的聊天机器人的开放平台
```bash
# 安装
pip3 install fschat
# 或
pip install "fschat[model_worker,webui]"
pip install vllm
##### 部署openai形式的服务
# 启动controller，默认端口为 21001，可通过 --port 指定
python3 -m fastchat.serve.controller
# 启动vLLM Worker
# 默认端口为 21002，可通过 --port 指定。FastChat 的 Worker 会向 Controller 注册自身，并通过心跳机制保持连接。
python3 -m fastchat.serve.vllm_worker meta-llama/Llama-2-7b-chat-hf --num-gpus 2
# 启动 Gradio Web Server，提供了可视化交互聊天界面，默认端口为 7860，可通过 --port 指定
python3 -m fastchat.serve.gradio_web_server
# 启动 OpenAI API Server，默认端口为 8000，可通过 --port 指定
python3 -m fastchat.serve.openai_api_server
# 使用 OpenAI SDK
pip install openai
# py代码
from openai import OpenAI
client = OpenAI(base_url="http://localhost:8000/v1", api_key="na")
model = "meta-llama/Llama-2-7b-chat-hf"


#### 其他
# 单gpu
python3 -m fastchat.serve.cli --model-path lmsys/vicuna-7b-v1.3
# 多gpu
python3 -m fastchat.serve.cli --model-path lmsys/vicuna-7b-v1.3 --num-gpus 2
# 使用CPU
python3 -m fastchat.serve.cli --model-path lmsys/vicuna-7b-v1.3 --device cpu
# Metal后端（Apple Silicon或AMD GPU的Mac电脑）
python3 -m fastchat.serve.cli --model-path lmsys/vicuna-7b-v1.3 --device mps --load-8bit
# Intel XPU（Intel Data Center和Arc A-Series GPU），安装Intel Extension for PyTorch[27]。设置OneAPI环境变量
source /opt/intel/oneapi/setvars.sh
python3 -m fastchat.serve.cli --model-path lmsys/vicuna-7b-v1.3 --device xpu
```

## vLLM（推理加速-gpu推荐）

* `vLLM`：推理加速的引擎，提高整体吞吐量，单batch效果不明显，预先分配大量显存，提高推理速度，实现了`Rolling Batch`批处理以及`PagedAttention`的全新的注意力算法，相对于静态`batch`，vLLM 提供了高达`数十倍`的吞吐量，而无需进行任何模型架构更改，支持Huggingface常见的模型`llama系列、qwen系列、baichuan`
    
### 推理
```py
#### 检查模型是否被 vLLM 支持，返回成功则是支持的
from vllm import LLM
llm = LLM(model=...)  # Name or path of your model
output = llm.generate("Hello, my name is")
print(output)

#### 离线批量推断
from vllm import LLM, SamplingParams

prompts = [
    "Hello, my name is",
    "The president of the United States is",
    "The capital of France is",
    "The future of AI is",
]
sampling_params = SamplingParams(temperature=0.8, top_p=0.95)

llm = LLM(model="facebook/opt-125m")
outputs = llm.generate(prompts, sampling_params)
# Print the outputs.
for output in outputs:
    prompt = output.prompt
    generated_text = output.outputs[0].text
    print(f"Prompt: {prompt!r}, Generated text: {generated_text!r}")

#### api服务
# 代码参考地址：https://github.com/vllm-project/vllm/blob/main/vllm/entrypoints/api_server.py
python -m vllm.entrypoints.api_server
# 客户端请求示例：https://github.com/vllm-project/vllm/blob/main/examples/api_client.py
curl http://localhost:8000/generate \
-d '{
    "prompt": "San Francisco is a",
    "use_beam_search": true,
    "n": 4,
    "temperature": 0
}'

#### openai的api服务
# 代码参考地址：https://github.com/vllm-project/vllm/blob/main/vllm/entrypoints/api_server.py
python -m vllm.entrypoints.openai.api_server --model facebook/opt-125m
# 客户端示例：https://github.com/vllm-project/vllm/blob/main/examples/api_client.py
curl http://localhost:8000/v1/completions \
-H "Content-Type: application/json" \
-d '{
    "model": "facebook/opt-125m",
    "prompt": "San Francisco is a",
    "max_tokens": 7,
    "temperature": 0
}'
# 使用openai的sdk
import openai
# Modify OpenAI's API key and API base to use vLLM's API server.
openai.api_key = "EMPTY"
openai.api_base = "http://localhost:8000/v1"
completion = openai.Completion.create(model="facebook/opt-125m", prompt="San Francisco is a")
print("Completion result:", completion)

#### 分布式推理
# 安装分布式框架 ray
pip install ray
# tensor_parallel_size 可以指定使用 GPU 的数量
from vllm import LLM
llm = LLM("facebook/opt-13b", tensor_parallel_size=4)
output = llm.generate("San Franciso is a")
# Server 指定 GPU 数量
python -m vllm.entrypoints.api_server \
    --model facebook/opt-13b \
    --tensor-parallel-size 4
# 分别在一个主节点和多个工作节点安装 ray 并运行服务。然后在主节点运行上述的 Server，GPU 数量可以指定为集群内所有的 GPU 数量总和。
# On head node
ray start --head
# On worker nodes
ray start --address=<ray-head-address>
```

### 训练

```bash
# 使用以下命令使用 4 x A100 (40GB) 训练 Vicuna-7B。—model_name_or_path使用 LLaMA 权重的实际路径和—data_path数据的实际路径进行更新
torchrun --nproc_per_node=4 --master_port=20001 fastchat/train/train_mem.py \
    --model_name_or_path ~/model_weights/llama-7b  \
    --data_path data/dummy_conversation.json \
    --bf16 True \
    --output_dir output_vicuna \
    --num_train_epochs 3 \
    --per_device_train_batch_size 2 \
    --per_device_eval_batch_size 2 \
    --gradient_accumulation_steps 16 \
    --evaluation_strategy "no" \
    --save_strategy "steps" \
    --save_steps 1200 \
    --save_total_limit 10 \
    --learning_rate 2e-5 \
    --weight_decay 0. \
    --warmup_ratio 0.03 \
    --lr_scheduler_type "cosine" \
    --logging_steps 1 \
    --fsdp "full_shard auto_wrap" \
    --fsdp_transformer_layer_cls_to_wrap 'LlamaDecoderLayer' \
    --tf32 True \
    --model_max_length 2048 \
    --gradient_checkpointing True \
    --lazy_preprocess True
```

## RTP-LLM（gpu推理加速-推荐）

rtp-llm 是阿里巴巴大模型预测团队开发的 LLM 推理加速引擎。

* github地址：https://github.com/alibaba/rtp-llm/blob/main/README_cn.md
* docker镜像列表：https://github.com/alibaba/rtp-llm/blob/main/docs/DockerHistory.md
* 配置参数：https://github.com/alibaba/rtp-llm/blob/main/docs/Config.md

```bash
# 启动推理服务
docker run -d --gpus all -v /data:/data --name my-llm /data/start.sh
# start.sh
export CUDA_VISIBLE_DEVICES=0
export MODEL_TYPE=chatglm3 
export MODEL_TEMPLATE_TYPE=chatglm3 
export TOKENIZER_PATH=/data/models/chatglm3-6b-32k
export CHECKPOINT_PATH=/data/models/chatglm3-6b-32k
export START_PORT=8088
export MAX_SEQ_LEN=10000
export CONCURRENCY_LIMIT=100 # 最大并发
export PY_LOG_LEVEL=INFO 
export PY_LOG_PATH=logs/
export FT_SERVER_TEST=1 
nohup python -m maga_transformer.start_server > logs/chatglm3_6b_32k.log 2>&1 &
```

## FastLLM（推理加速-目前不推荐）

* `fastllm`：也是一个推理加速引擎（国产），支持android，有时候会出现问题。

## Llama-Factory（主训练-推荐）

[参考资料](https://github.com/hiyouga/LLaMA-Factory)

* `llama-factory`：高效的大语言模型训练和推理框架，带有webui，简化训练门槛，支持常见模型`Baichuan2、ChatGLM3、Gemma、LLaMA系列、Qwen系列、Yi系列`。

## LangChain(RAG框架)

LangChain更加注重在大型语言模型的基础上开发应用程序。它支持各种自然语言处理任务，包括Creative Generation（创意生成）等领域。LangChain的灵活性和多样性使其在创造性应用方面具有独特优势。

* langchain+ollama 简单demo

```py
# 加载模型
from langchain.llms import Ollama
ollama = Ollama(base_url='http://localhost:11434', model="qwen:4b")

# 外部数据
from langchain.document_loaders import WebBaseLoader
loader = WebBaseLoader("http://www.ifuncun.cn/NewsStd_528.html")
data = loader.load()

# 数据切分
from langchain.text_splitter import RecursiveCharacterTextSplitter
text_splitter=RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=0)
all_splits = text_splitter.split_documents(data)

# 数据向量化（如果有报错sqlite3，参考python问题列表处理）
from langchain.embeddings import OllamaEmbeddings
from langchain.vectorstores import Chroma
oembed = OllamaEmbeddings(base_url="http://localhost:11434", model="nomic-embed-text")
vectorstore = Chroma.from_documents(documents=all_splits, embedding=oembed)

# 相关问题查询（从外部数据检索）
question="方寸无忧公司的电话是多少？"
docs = vectorstore.similarity_search(question)
print(docs)

# 合并发送给大模型处理
from langchain.chains import RetrievalQA
qachain=RetrievalQA.from_chain_type(ollama, retriever=vectorstore.as_retriever())
qachain.invoke({"query": question})
```

## LlamaIndex(RAG框架)

专门用于构建RAG系统的框架，其主要用途是处理检索、摘要和生成任务。在RAG系统中，检索（Retrieve）、摘要（Answer）和生成（Generate）是三个关键步骤，LLamaIndex通过构建高效的索引和查询系统，为用户提供了强大的检索和生成能力。

## 常用模型

* `AI编程模型`：`Stable Code 3B`
* `语音转文字`：`PaddleSpeech、FunAsr`



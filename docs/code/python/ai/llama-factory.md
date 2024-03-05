# Llama-Factory

【主训练-推荐】，[参考资料](https://github.com/hiyouga/LLaMA-Factory)

* `llama-factory`：高效的大语言模型训练和推理框架，带有webui，简化训练门槛，支持常见模型`Baichuan2、ChatGLM3、Gemma、LLaMA系列、Qwen系列、Yi系列`。

## 安装准备

需要先提前准备好带显卡的服务器（推荐3090以上），安装好的 `cuda12.2`，安装好`conda、python3.10及以上`等环境，也可以使用docker容器去运行。

```bash
# 运行以下命令安装 LLaMA Factory
pip install llmtuner
# 下载llama-factory
git clone https://github.com/hiyouga/LLaMA-Factory.git
cd LLaMA-Factory
pip install -r requirements.txt
# 本次修改模型【自我认知】，需要修改self_cognition.json里面的<NAME>,<AUTHOR>占位符
# 数据处理（建议把self_cognition.json模版复制一份备用）
# 如果有自定义数据集，可以参考github中的文档去处理
cp -f data/self_cognition.json data/self_cognition.json.back
sed -i 's/<NAME>/海鸥/g' data/self_cognition.json
sed -i 's/<AUTHOR>/摩尔智能/g' data/self_cognition.json
# 下载模型（使用qwen1.5-4b-chat）
git clone https://www.modelscope.cn/qwen/Qwen1.5-4B-Chat.git
```

## 训练实战

```bash
export CUDA_VISIBLE_DEVICES=0

# 训练模型（使用sft，其他的参考github）
python src/train_bash.py \
    --stage sft \
    --do_train \
    --model_name_or_path /root/Qwen1.5-4B-Chat \
    --dataset self_cognition,alpaca_gpt4_zh \
    --template default \
    --finetuning_type lora \
    --lora_target q_proj,v_proj \
    --output_dir /root/sft/checkpoint \
    --overwrite_cache \
    --per_device_train_batch_size 4 \
    --gradient_accumulation_steps 4 \
    --lr_scheduler_type cosine \
    --logging_steps 10 \
    --save_steps 2000 \
    --learning_rate 1e-4 \
    --num_train_epochs 5.0 \
    --plot_loss \
    --bf16 True

# 如果只有自我认知的数据集，测试设置较高的学习率效果好一些
python src/train_bash.py \
    --stage sft \
    --do_train \
    --model_name_or_path /root/Qwen1.5-4B-Chat \
    --dataset self_cognition \
    --template default \
    --finetuning_type lora \
    --lora_target q_proj,v_proj \
    --output_dir /root/sft/checkpoint \
    --overwrite_cache \
    --per_device_train_batch_size 4 \
    --gradient_accumulation_steps 4 \
    --lr_scheduler_type cosine \
    --logging_steps 10 \
    --save_steps 2000 \
    --learning_rate 1e-3 \
    --num_train_epochs 10.0 \
    --plot_loss \
    --bf16 True

# 模型测试（这里使用cli_demo，其他的参考github）
python src/cli_demo.py \
    --model_name_or_path /root/Qwen1.5-4B-Chat \
    --adapter_name_or_path /root/sft/checkpoint \
    --template default \
    --finetuning_type lora

# 合并 LoRA 权重并导出模型(尚不支持量化模型的 LoRA 权重合并及导出)
python src/export_model.py \
    --model_name_or_path /root/Qwen1.5-4B-Chat \
    --adapter_name_or_path /root/sft/checkpoint \
    --template default \
    --finetuning_type lora \
    --export_dir /root/sft/Qwen1.5-4B-Chat-sft \
    --export_size 2 \
    --export_legacy_format False

# 对外提供服务-openai-api（可以使用vLLM等部署）
python src/api_demo.py \
    --model_name_or_path /root/sft/Qwen1.5-4B-Chat-sft \
    --template default

# 测试stream输出
curl -X POST -H 'Content-Type: application/json' -d '{"model":"qwen1.5-4b-chat", "messages":[{"role":"user", "content":"你好"}], "stream":true}' http://127.0.0.1:8000/v1/chat/completions
# 测试完整输出
curl -X POST -H 'Content-Type: application/json' -d '{"model":"haiou", "messages":[{"role":"user", "content":"用python写一个贪吃蛇的游戏"}]}' http://127.0.0.1:8000/v1/chat/completions
```
# Python安装相关

## torch包

1. 到 [pytorch官网](https://pytorch.org/get-started/locally/#windows-prerequisites) 找到对应的版本安装命令。
1. 安装完之后验证
    ```bash
    import torch
    torch.cuda.is_available()
    # 验证gpu环境
    torch.zeros([2,5]).cuda()
    ```
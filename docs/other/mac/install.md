# Mac软件安装

## Homebrew安装

由于国内网络的原因，需要先把安装的脚本先下载到本地，再修改安装源。

1. 下载脚本：

    ```bash
    curl -o brew_install https://raw.githubusercontent.com/Homebrew/install/master/install
    ```
1. 修改安装源：

    ```bash
    #BREW_REPO = "https://github.com/Homebrew/brew".freeze
    BREW_REPO = "https://mirrors.ustc.edu.cn/brew.git".freeze
    ```
1. 执行安装命令：

    ```bash
    /usr/bin/ruby brew_install
    ```
    执行的时候有时候会失败，多执行几次即可

1. 更新命令

    ```bash
    brew update
    ```
## Oh-My-Zsh 安装

    ```bash
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
    ```
## nvm 安装

    ```bash
    brew install nvm

    # 完成之后执行如下操作
    mkdir ～/.nvm

    # 在～/.zshrc中添加如下内容
    export NVM_DIR="$HOME/.nvm"
    [ -s "/usr/local/opt/nvm/nvm.sh" ] && . "/usr/local/opt/nvm/nvm.sh"  # This loads nvm
    [ -s "/usr/local/opt/nvm/etc/bash_completion" ] && . "/usr/local/opt/nvm/etc/bash_completion"  # This loads nvm bash_completion
    ```
## node 安装

    ```bash
    nvm install --lts
    ```
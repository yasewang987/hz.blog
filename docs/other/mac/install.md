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

    # 如果有homebrew-core修改如下
    CORE_TAP_REPO = "https://mirrors.ustc.edu.cn/homebrew-core.git".freeze
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
1. 修改软件安装源

    中科大的源：

    ```bash
    cd "$(brew --repo)"
    git remote set-url origin git://mirrors.ustc.edu.cn/brew.git

    cd "$(brew --repo)/Library/Taps/homebrew/homebrew-core"
    git remote set-url origin git://mirrors.ustc.edu.cn/homebrew-core.git

    cd "$(brew --repo)/Library/Taps/homebrew/homebrew-cask"
    git remote set-url origin git://mirrors.ustc.edu.cn/homebrew-cask.git
    ```

    还原为默认源：

    ```bash
    cd "$(brew --repo)"
    git remote set-url origin https://github.com/Homebrew/brew.git

    cd "$(brew --repo)/Library/Taps/homebrew/homebrew-core"
    git remote set-url origin https://github.com/Homebrew/homebrew-core.git

    # 先安装cask才能修改下面软件源
    brew cask # 会自动安装

    cd "$(brew --repo)/Library/Taps/homebrew/homebrew-cask"
    git remote set-url origin https://github.com/Homebrew/homebrew-cask.git
    ```

    修改二进制源：

    ```bash
    # 对于bash用户：

    echo 'export HOMEBREW_BOTTLE_DOMAIN=https://mirrors.ustc.edu.cn/homebrew-bottles' >> ~/.bash_profile
    source ~/.bash_profile

    # 对于zsh用户

    echo 'export HOMEBREW_BOTTLE_DOMAIN=https://mirrors.ustc.edu.cn/homebrew-bottles' >> ~/.zshrc
    source ~/.zshrc

    source ~/.zshrc
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

## Docker 安装

    ```bash
    brew cask install docker
    ```

## java 安装

    ```bash
    brew cask install java
    ```
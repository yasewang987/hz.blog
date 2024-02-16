# Mac软件安装

## Oh-My-Zsh 安装

* 需要先安装`git`,直接在终端输入git会自动提示安装。
* 安装完之后会自动生成 `~/.zshrc` 文件

```bash
# 如果安装失败，应该是网络原因，可以多尝试几次
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"

# 国内安装
sh -c "$(curl -fsSL https://gitee.com/mirrors/oh-my-zsh/raw/master/tools/install.sh)"
```

* 安装重要插件

```bash
# 进入插件目录
cd ~/.oh-my-zsh/custom/plugins/

# 命令补全 zsh-autosuggestion
git clone https://github.com/zsh-users/zsh-autosuggestions

# 语法高亮：zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git
```

## Homebrew安装

安装参考：https://mirrors.tuna.tsinghua.edu.cn/help/homebrew/

1. 设置环境变量：

    ```bash
    export HOMEBREW_INSTALL_FROM_API=1
    export HOMEBREW_API_DOMAIN="https://mirrors.tuna.tsinghua.edu.cn/homebrew-bottles/api"
    export HOMEBREW_BOTTLE_DOMAIN="https://mirrors.tuna.tsinghua.edu.cn/homebrew-bottles"
    export HOMEBREW_BREW_GIT_REMOTE="https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/brew.git"
    ```

1. 下载脚本并安装：

    ```bash
    # 从本镜像下载安装脚本并安装 Homebrew / Linuxbrew
    git clone --depth=1 https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/install.git brew-install
    /bin/bash brew-install/install.sh
    rm -rf brew-install
    ```
    * 安装成功后需将 brew 程序的相关路径加入到环境变量中

1. 根据提示创建`.zshrc`文件

    ```bash
    # 如果没有则创建
    touch ~/.zshrc
    test -r ~/.zshrc && echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
    
    # 生效文件
    source ~/.zshrc

    # 替换镜像源
    export HOMEBREW_API_DOMAIN="https://mirrors.tuna.tsinghua.edu.cn/homebrew-bottles/api"
    export HOMEBREW_BREW_GIT_REMOTE="https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/brew.git"
    brew update
    ```
    
1. 安装 cask

    ```bash
    brew install cask
    ```

1. 修改安装源：

    ```bash
    # 手动设置
    git -C "$(brew --repo)" remote set-url origin https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/brew.git
    git -C "$(brew --repo homebrew/core)" remote set-url origin https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-core.git
    git -C "$(brew --repo homebrew/cask)" remote set-url origin https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-cask.git
    git -C "$(brew --repo homebrew/cask-fonts)" remote set-url origin https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-cask-fonts.git
    git -C "$(brew --repo homebrew/cask-drivers)" remote set-url origin https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-cask-drivers.git
    git -C "$(brew --repo homebrew/cask-versions)" remote set-url origin https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-cask-versions.git

    # 或使用下面的几行命令自动设置
    BREW_TAPS="$(brew tap)"
    for tap in core cask{,-fonts,-drivers,-versions}; do
        if echo "$BREW_TAPS" | grep -qE "^homebrew/${tap}\$"; then
            # 将已有 tap 的上游设置为本镜像并设置 auto update
            # 注：原 auto update 只针对托管在 GitHub 上的上游有效
            git -C "$(brew --repo homebrew/${tap})" remote set-url origin https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-${tap}.git
            git -C "$(brew --repo homebrew/${tap})" config homebrew.forceautoupdate true
        else   # 在 tap 缺失时自动安装（如不需要请删除此行和下面一行）
            brew tap --force-auto-update homebrew/${tap} https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-${tap}.git
        fi
    done
    ```

1. 更新命令

    ```bash
    brew update-reset
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

使用orbstack使用docker，下载地址： https://orbstack.dev/download ，或者使用`brew`安装

```bash
brew install orbstack
```

## redisClient

https://gitee.com/qishibo/AnotherRedisDesktopManager/releases

## 配置快速启动

```bash
vim .zshrc

# 添加如下内容
alias code='/Applications/Visual\ Studio\ Code.app/Contents/Resources/app/bin/code'
```
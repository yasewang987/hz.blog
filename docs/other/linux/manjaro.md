# Manjaro

## 安装之后优化

1. 更换中国源

    ```bash
    # 命令结束的时候会弹出一个窗口让你选择想要使用的源，选最快的那个就行了
    sudo pacman-mirrors -i -c China -m rank
    sudo pacman -Syy
    ```
1. 修改 `/etc/pacman.conf`

    ```conf
    [archlinuxcn]
    SigLevel = Optional TrustedOnly
    Server = https://mirrors.ustc.edu.cn/archlinuxcn/$arch
    ```
1. 然后运行这两行命令：

    ```bash
    sudo pacman -S archlinuxcn-keyring #-S表示安装某一软件
    sduo pacman -Syy # -Syy表示将本地的软件与软件仓库进行同步
    ```
1. 然后就可以更新一下系统：

    ```bash
    sudo pacman -Syyu
    #这是Arch系非常爽的一个命令，可以更新系统的一切软件包
    ```
1. 安装zsh

    ```bash
    sudo pacman -S zsh
    sh -c "$(curl -fsSL https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"#安装oh-my-zsh

    chsh -s /bin/zsh
    ```
1. 安装输入法

    ```bash
    sudo pacman -S fcitx-im #全部安装
    sudo pacman -S fcitx-configtool
    ```

    在`~/.xprofile`文件（没有则需要新建）中加入：

    ```
    export GTK_IM_MODULE=fcitx
    export QT_IM_MODULE=fcitx
    export XMODIFIERS="@im=fcitx"
    ```

    重启之后输入法就可以用了

1. 安装其他软件

    ```bash
    sudo pacman -S vim
    sudo pacman -S netease-cloud-music
    sudo pacman -S wps-office
    sudo pacman -S ttf-wps-fonts
    sudo pacman -S typora
    sudo pacman -S google-chrome
    ```

## 常见问题处理

1. Konsole有透明线条

    ```
    konsole——设置——编辑当前方案——外观——杂项——行距，这个值从 1 开始往上一个一个试，直到你看不到白线为止。
    ```
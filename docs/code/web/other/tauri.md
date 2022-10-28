# Tauri

先用过 `vite` 等先创建好项目，然后按照如下执行

## 安装依赖项

### mac
参考资料：https://tauri.studio/docs/getting-started/setting-up-macos

这里以`mac`为例，其他的参考其他对应文档，如果已经安装了对应的包就跳过

```bash
# 安装gcc
brew install gcc
# 安装xcode
xcode-select --install
# 安装node，npm，如果想用yarn等参考对应资料
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.2/install.sh | bash
# 安装rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# 查看rust版本信息
rustc --version
```

### windows

参考资料：https://tauri.app/zh/v1/guides/getting-started/prerequisites
```bash
# 安装依赖，报错也没关系
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

# 安装rustc,选择第一个默认安装即可
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh

# 生效rust
source $HOME/.cargo/env

# 查看版本
rustc --version
```

## 项目中引入tauri

```bash
yarn add -D @tauri-apps/cli
yarn add @tauri-apps/api
```

在`package.json`里`scripts` 添加如下内容

```json
"scripts": {
    "tauri": "tauri",
}
```

`Tauri`环境初始化

```bash
yarn tauri init
```

启动`web`项目

```bash
yarn dev
```

启动`tauri`, 如果在执行这一步时报错 `error: failed to select a version for the requirement tauri = "^1.0.0-rc.2"`，需要将 `src-tauri/Cargo.toml` 中的 `tauri-build` 信息改成与项目中 `package.json` 的 `@tauri-apps/api` 一样的版本。

```bash
yarn tauri dev
```
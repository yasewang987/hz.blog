# Tauri

先用过 `vite` 等先创建好项目，然后按照如下执行

## 安装依赖项

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
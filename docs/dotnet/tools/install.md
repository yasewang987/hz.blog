
# NetCore开发环境配置

## DotNet开发环境安装

* 下载地址
  > https://www.microsoft.com/net/learn/get-started-with-dotnet-tutorial
* 安装
  1. Windows
     > 直接下载安装包安装即可。
  1. Linux
     > 参考官网的安装教程
     > https://www.microsoft.com/net/learn/get-started-with-dotnet-tutorial
<!-- more -->
* 测试安装成功
  > `dotnet --version`或者`dotnet --info`

* 编译器（vscode）
  > https://www.cnblogs.com/yilezhu/p/9926078.html

## 常见错误

1. The SDK 'Microsoft.NET.Sdk' specified could not be found
   > 找不到sdk，通过设置环境变量解决：
      ```bash
      $ dotnet --info # 查看dotnet位置
      # 设置环境变脸
      MSBuildSDKsPath=/usr/local/share/dotnet/sdk/2.0.2/Sdks
      ```

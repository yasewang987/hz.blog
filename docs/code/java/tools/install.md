# JAVA开发环境搭建

Spring Boot, Maven, Gradle, Java等都可以使用SDKMAN安装
sdkman官网地址：https://sdkman.io

## JDK安装

* OracleJDK下载地址：https://www.oracle.com/technetwork/java/javase/downloads/index.html
* OpenJDK下载地址：https://adoptopenjdk.net/
* linux系统一般都有自带的`openjdk`可以先删除自带的jdk
  > 查看安装的jdk包：`sudo dpkg --list | grep -i jdk`
  > 删除相关包：`sudo apt purge openjdk-*`

* 安装JDK
    1. 建议使用sdkman直接安装，安装参考下面的gradle
    1. Linux:
        > 使用命令解压：`sudo tar zxvf jdk-XXX-linux-XXX.tar.gz`
        > 解压到指定目录：`sudo tar zxvf jdk-xxx.tar.gz -C 指定目录`
    1. Windows：
        > 直接下载exe安装包安装或者压缩包直接解压
    1. WSL:
        > 查询相应版本jdk `apt search openjdk-版本-jdk`
        > 安装jdk `apt install openjdk-版本-jdk`
* 配置环境变量
  1. Linux：
     > 配置文件末尾添加如下内容

       ```bash
       export JAVA_HOME=$HOME/java/jdk1.8.0_181 #这里填写的是jdk解压后的地址
       export JRE_HOME=$JAVA_HOME/jre
       export PATH=$JAVA_HOME/bin:$JRE_HOME/bin:$PATH
       ```
     > 全局配置（/etc/profile） #重启电脑
     > 按用户配置（按默认终端区分）
       1. `bash: ~/.bashrc` # 生效配置`source ~/.bashrc`
       1. `zsh: ~/.zshrc` #生效配置`source ~/.zshrc`
  1. Windows：
     > 直接在我的电脑右键-属性-高级系统设置-高级-环境变量-系统环境变量中作如下操作：
       1. 新建：`JAVA_HOME:D:\Program Files\Java\jdk1.8.0_181` （jdk的安装地址）
       1. 编辑：`PATH`，新增二行`%JAVA_HOME%\bin`，`%JAVA_HOME%\jre\bin`

## Maven安装

* 下载地址：https://maven.apache.org/download.cgi
* maven仓库：https://mvnrepository.com
* 安装配置：
  1. Linux
     1. 安装
        > 使用解压命令：`sudo tar zxvf apache-maven-3.5.4-bin.tar.gz`
     1. 配置环境变量
        > 配置文件末尾添加如下内容
          ```bash
          export MVN_HOME=$HOME/java/apache-maven-3.5.4
          export PATH=$MVN_HOME/bin:$PATH
          ```
        > 全局配置（/etc/profile） #重启电脑
        > 按用户配置（按默认终端区分）
        1. `bash: ~/.bashrc` # 生效配置`source ~/.bashrc`
        1. `zsh: ~/.zshrc` #生效配置`source ~/.zshrc`
  1. Windows
     1. 安装
        > 直接使用解压软件解压到自定义位置
     1. 配置环境变量
        > 直接在我的电脑右键-属性-高级系统设置-高级-环境变量-系统环境变量中作如下操作：
        1. 编辑：`PATH`，新增`D:\Program Files\Java\tools\apache-maven-3.5.4\bin`

## Gradle

* 官方地址：https://gradle.org/install/

* 安装配置
   1. Linux
      * 使用sdkman安装（https://sdkman.io/）
         ```bash
         #### 安装sdkman
         $ curl -s "https://get.sdkman.io" | bash

         source "$HOME/.sdkman/bin/sdkman-init.sh"

         # 验证 出现如sdkman 5.0.0+51字样即sdkman安装完成
         sdk version


         ##### 安装gradle
         sdk install gradle
         ```
      * 手动安装
         1. 下载解压:`unzip -d /opt/gradle gradle-5.2.1-bin.zip`
         1. 配置环境变量：
            ```bash
            export GRADLE_HOME=$HOME/soft/gradle-5.2.1
            export PATH=$GRADLE_HOME/bin:$PATH
            ```
         1. 启用配置
         > 全局配置（/etc/profile） #重启电脑
         > 按用户配置（按默认终端区分）
         1. `bash: ~/.bashrc` # 生效配置`source ~/.bashrc`
         1. `zsh: ~/.zshrc` #生效配置`source ~/.zshrc`

## VSCode

* JAVA基础开发插件
  1. 直接在插件中搜索`java`，然后选`Java Extension Pack`即可安装所有依赖组件

* Spring开发插件
  1. 插件中搜索`spring`,选择`Spring Boot Extension Pack`即可安装所有依赖组件

* 修改VSCode设置

   ```json
   // settings.json
   {
      "maven.executable.path": "/home/hzgod/soft/apache-maven-3.6.0/bin/mvn",
      "java.home": "/home/hzgod/soft/jdk1.8.0_201"
   }
   ```

---

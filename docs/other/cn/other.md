# 其他资料

* 龙芯的适配开源地址：`https://github.com/Loongson-Cloud-Community`
* 龙芯系统仓库地址：`http://pkg.loongnix.cn/loongnix-server/8.4/AppStream/loongarch64/release/Packages/`
* 龙芯python仓库地址：`https://pypi.loongnix.cn/`
* 龙芯官放开源社区：`http://www.loongnix.cn/zh/proj/`

## 国产系统信息记录

### 银河麒麟v10

查看系统版本：

```bash
cat /etc/os-release

(Tercel) 版本是 银河麒麟 V10 SP1 版本
(Sword) 版本是 银河麒麟 V10 SP2 版本
(Lance) 版本是 银河麒麟 V10 SP3 版本
```

软件升级参考资料：https://www.kylinos.cn/support/update/537.html

```bash
### 仓库源地址： 
# 银河麒麟高级服务器操作系统 V10 SP1
aarch64:https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/updates/aarch64/
x86_64:https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/updates/x86_64/
# 银河麒麟高级服务器操作系统 V10 SP2
aarch64:https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/aarch64/
x86_64:https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/x86_64/
# 麒麟V10 server SP3：
https://distro-images.kylinos.cn:8802/web_pungi/download/share/vYTMm38Pkaq0KRGzg9pBsWf2c16FUwJL/
# 麒麟V10 desktop SP1: 
https://distro-images.kylinos.cn:8802/web_pungi/download/share/b4vmX7qEk90dyBrFfS5ANpGngaW2hZUK/
```

适配镜像：arm和x86用 `python:3.7.4`, mips用 `python:3.7.7`

* 支持平台：arm，x86,mips64
* 安装包：【安全管理平台】rpm包
* python信息：3.7.4，/usr/bin/python3
* gcc版本：8.3.0
* cmake版本：3.12.1
* 其他：自带了mariadb

资源下载地址：

1. 银河麒麟高级服务器操作系统V10

兆芯版 海光版 AMD64版

下载地址：http://distro-images.kylinos.cn:8802/web_pungi/download/share/wA7vpuh4S5ZrxLWRXVBgGO0d9TfJqijD

提取码：NA

飞腾版 鲲鹏版

下载地址： http://distro-images.kylinos.cn:8802/web_pungi/download/share/BP9pZlFhKjANkwoWrsgETDMXLmOxait1

提取码：NA

龙芯-MIPS64el

下载地址： http://distro-images.kylinos.cn:8802/web_pungi/download/share/aru2QCiVKcZYlHpfnqX4AzLJBxNGsUvt

提取码：NA

龙芯-LoongArch64

下载地址：http://distro-images.kylinos.cn:8802/web_pungi/download/share/eqGsIRMaf1uU02SHovQrJCnj6DikBmNz

提取码：NA

申威版

下载地址：https://pan.baidu.com/s/1S8Myz_YxZyYi4rPxNw1DiQ

提取码：j2sa

2. 银河麒麟桌面操作系统V10

兆芯版 海光版

下载地址：http://distro-images.kylinos.cn:8802/web_pungi/download/share/9nl7ve2CSfEaQyqXYt8bRWUFdTBgj5hJ

提取码：NA

飞腾版 鲲鹏版

下载地址：http://distro-images.kylinos.cn:8802/web_pungi/download/share/tXbGgIYCdQEv5z0lPypmKTqAse2rojJx

提取码：NA

龙芯3a4000版

下载地址：http://distro-images.kylinos.cn:8802/web_pungi/download/share/EKvckinmNw1p9HXAsxLhB5Mf3eDUJ0VW

提取码：NA

龙芯3a5000版

下载地址：http://distro-images.kylinos.cn:8802/web_pungi/download/share/wrmC6ciOgptjAn5eMy1uhxfN8B7q9XRK

提取码：NA

申威版

AMD64版 intel版

下载地址：http://distro-images.kylinos.cn:8802/web_pungi/download/share/HXDYtGjZm3daA4UvOTLkiPl1nB9ErM0c

提取码：NA

海思麒麟

下载地址：https://pan.baidu.com/s/1oUvKP7xGbdXnD8aZTs95fA

提取码：rn8q

### 中科方德-SVS2.16.2

适配镜像：`python:3.6.8`

* 支持平台：arm，x86
* 安装包：【安全管理平台】rpm包
* python信息：3.6.8，/usr/bin/python3
* 其他：自带了mariadb

## 清理make源码编译

```bash
# 清理make命令所产生的object文件及可执行文件
make clean
# 同时也将configure生成dao的文件全部删除掉
make distclean
```

## 其他spec

### 永中插件

```conf
%define _binaries_in_noarch_packages_terminate_build 0
Name: test-yozo
Version: 2023.05
Release:        1
Summary:        test yozo

Group:          test
License:        GPLv3+
BuildArch: noarch

%description
test yozo

%prep


%build

%install
rm -rf %{buildroot}/opt/Yozosoft/Yozo_Office/Plugins/fcwy
mkdir -p %{buildroot}/opt/Yozosoft/Yozo_Office/Plugins/fcwy
cp -rf %{_builddir}/funcun/fcwy/* %{buildroot}/opt/Yozosoft/Yozo_Office/Plugins/fcwy

%files
/opt/Yozosoft/Yozo_Office/Plugins/fcwy



%changelog
```

### wps插件打包

把 `wpsplugin` 和 `wpsinstall.sh` 放到同一个文件夹 `wps` 下面即可。

```conf
%define _binaries_in_noarch_packages_terminate_build 0
Name: service-wpsplugin
Version: 2024.07
Release:        20
Summary:        service wpsplugin

Group:          service
License:        GPLv3+
BuildArch: noarch

%description
service wpsplugin

%prep


%build

%install
rm -rf %{buildroot}/opt/service/wps
mkdir -p %{buildroot}/opt/service/wps
cp -rf %{_builddir}/service/wps/* %{buildroot}/opt/service/wps

%post
/bin/bash /opt/service/wps/wpsinstall.sh

%files
/opt/service/wps

%changelog
```

`wpsinstall.sh`内容如下：

```sh
#!/bin/bash

VERSION=1.0.0
touch /opt/service/wps/test.log

users=$(cat /etc/passwd | grep bash | cut -d \: -f 1)
for HOMEDIR in $users; do
  jsXmlDir=/home/$HOMEDIR/.local/share/Kingsoft/wps/jsaddons
  echo $jsXmlDir >> /opt/service/wps/test.log
  mkdir -p ${jsXmlDir}
  rm -rf ${jsXmlDir}/service-wps_${VERSION} | true
  /bin/cp -rf /opt/service/wps/wpsplugin ${jsXmlDir}
  mv ${jsXmlDir}/wpsplugin ${jsXmlDir}/service-wps_${VERSION}
  jsXmlFile=${jsXmlDir}/jsplugins.xml
  echo $jsXmlFile >> /opt/service/wps/test.log
  if [ ! -f $jsXmlFile ]; then
    touch -f $jsXmlFile
    echo -e "<jsplugins>\n</jsplugins>" > $jsXmlFile
  fi
  columnStr=$(cat $jsXmlFile | grep service-wps)
  echo $columnStr >> /opt/service/wps/test.log
  sed -i '/service-wps/d' $jsXmlFile
  sed -i '/<jsplugins>/a\    <jsplugin url="null" name="service-wps" version="'${VERSION}'" type="wps"/>' $jsXmlFile
  chmod -R 777 ${jsXmlDir}
done
```

### 黑马wps安装示例

```bash

postinstall scriptlet (using /bin/sh):

function isInstallXml() {
  findRow=`sed -e p $1 | grep hmwpscheck`
  if [[ $findRow =~ "hmwpscheck" ]]
  then
    return 1
  else
    return 0
  fi
}

function insertXmlInfo(){
  isInstallXml $1
  status=$?
  if [[ "$status" == 0 ]]
  then
    sed -i '/<jsplugins>/a\    <jsplugin url="http://127.0.0.1:3889/hmwpscheck_1.0.0.7z" name="hmwpscheck" version="1.0.0" type="wps"/>' $1
  fi
}

function installJsXml(){
  for HOMEDIR in /home/*; do
    if [ ! -d $HOMEDIR ];then
        continue
    fi
    jsXmlDir=$HOMEDIR/.local/share/Kingsoft/wps/jsaddons
    if [[ ! -d $jsXmlDir ]]
    then
      mkdir -p $HOMEDIR/.local/share/Kingsoft/wps/jsaddons
    fi
    jsXmlFile=$jsXmlDir/jsplugins.xml
    if [ ! -f $jsXmlFile ];then
      touch -f $jsXmlFile
      echo -e "<jsplugins>\n</jsplugins>" > $jsXmlFile
    fi
    insertXmlInfo $jsXmlFile
  done
}

installJsXml
for HOMEDIR in /home/*; do
    if [ ! -d $HOMEDIR ];then
        continue
    fi
    if [ -d $HOMEDIR/.local/share ];then
        rm -rf $HOMEDIR/.local/share/Kingsoft/wps/jsaddons/hmwpscheck_1.0.0
        rm -rf $HOMEDIR/.local/share/Kingsoft/hmcheck
        if [ ! -d $HOMEDIR/.local/share/Kingsoft/wps/jsaddons ];then
            mkdir -p $HOMEDIR/.local/share/Kingsoft/wps/jsaddons
        fi        
        mkdir -p $HOMEDIR/.local/share/Kingsoft/hmcheck/
        cp -a /opt/apps/cn.wps.hmcheck/files/inst/hmwpscheck_1.0.0 $HOMEDIR/.local/share/Kingsoft/wps/jsaddons/
        cp /opt/apps/cn.wps.hmcheck/files/inst/hmcheck_wps.ini $HOMEDIR/.local/share/Kingsoft/hmcheck/
        cp /opt/apps/cn.wps.hmcheck/files/findlib.txt $HOMEDIR/.local/share/Kingsoft/hmcheck/
        touch $HOMEDIR/.local/share/Kingsoft/hmcheck/hmcheck.dat
        echo "[Install]" >> $HOMEDIR/.local/share/Kingsoft/hmcheck/hmcheck.dat
        echo "InstallDir=/opt/apps/cn.wps.hmcheck" >> $HOMEDIR/.local/share/Kingsoft/hmcheck/hmcheck.dat
        chmod -R 777 $HOMEDIR/.local/share/Kingsoft/hmcheck
        chmod -R 777 $HOMEDIR/.local/share/Kingsoft/wps/jsaddons
    fi
    HMAGENT_DESKTOP_FILE=/opt/apps/cn.wps.hmcheck/files/inst/hmcheck.desktop
    if [ -f $HMAGENT_DESKTOP_FILE ];then
        cp -f $HMAGENT_DESKTOP_FILE /usr/share/applications
        update-desktop-database
    fi
    if [ -d $HOMEDIR/桌面 ];then
        ln -sf /opt/apps/cn.wps.hmcheck/files/样本.doc $HOMEDIR/桌面/黑马校对样本.doc
    fi
done
chmod -R 777 /opt/apps/cn.wps.hmcheck
if [ -d "/opt/kingsoft/wps-office/office6/cfgs" ];then
    line=$(grep -n Support] /opt/kingsoft/wps-office/office6/cfgs/oem.ini)
    sline=$(echo "${line}" | cut -c1-2)
    sed -i ''$sline' aJsApiPlugin=true' /opt/kingsoft/wps-office/office6/cfgs/oem.ini
    #sed -i ''$sline' aJsApiShowWebDebugger=true' /opt/kingsoft/wps-office/office6/cfgs/oem.ini
fi
if [ -d "/opt/apps/cn.wps.wps-office-pro/files/kingsoft/wps-office/office6/cfgs" ];then
    line=$(grep -n Support] /opt/apps/cn.wps.wps-office-pro/files/kingsoft/wps-office/office6/cfgs/oem.ini)
    sline=$(echo "${line}" | cut -c1-2)
    sed -i ''$sline' aJsApiPlugin=true' /opt/apps/cn.wps.wps-office-pro/files/kingsoft/wps-office/office6/cfgs/oem.ini
    #sed -i ''$sline' aJsApiShowWebDebugger=true' /opt/apps/cn.wps.wps-office-pro/files/kingsoft/wps-office/office6/cfgs/oem.ini
fi
echo "安装结束，请重启电脑后使用！"
postuninstall scriptlet (using /bin/sh):

function removeXmlInfo(){
  row=`grep -n "hmwpscheck" $1`
  num=${row%:*}
  if [[ "$num" != "" ]]
  then
    sed -i ''${num}'d' $1
  fi
}

function uninstallJsXml(){
  for HOMEDIR in /home/*; do
    if [ ! -d $HOMEDIR ];then
        continue
    fi
    jsXmlFile=$HOMEDIR/.local/share/Kingsoft/wps/jsaddons/jsplugins.xml
    removeXmlInfo $jsXmlFile
  done
}

for HOMEDIR in /home/*; do
    if [ ! -d $HOMEDIR ];then
        continue
    fi
    if [ -d $HOMEDIR/.local/share/Kingsoft/hmcheck ];then
        rm -rf $HOMEDIR/.local/share/Kingsoft/wps/jsaddons/hmwpscheck_1.0.0  >/dev/null 2>&1
        uninstallJsXml
        rm -rf $HOMEDIR/.local/share/Kingsoft/hmcheck  >/dev/null 2>&1
    fi
    HMAGENT_DESKTOP_FILE=/usr/share/applications/hmcheck.desktop
    if [ -f $HMAGENT_DESKTOP_FILE ];then
        rm -f $HMAGENT_DESKTOP_FILE
        update-desktop-database
    fi
    if [ -L $HOMEDIR/桌面/黑马校对样本.doc ];then
        rm -f $HOMEDIR/桌面/黑马校对样本.doc
    fi
done
```

### so库打包

* 多个so库分开解压不要整个文件夹覆盖

```conf
%define __os_install_post %{nil}
%define debug_package %{nil}
%global mname baselibs
Name: %{mname}
Version: 2023.6
Summary: %{mname}
Release: 1
License: GPLv3+
Group: System Enviroment/Base
AutoReqProv: no

%description
%{mname}

%prep

%build

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}/usr/lib
cp -rf %{_builddir}/baselibs/libs/* %{buildroot}/usr/lib

%post

%clean

%files
/usr/lib/libdmdpi.so
/usr/lib/libdmdpi.so.1.0
```

### 通用打包（数据/代码）

```bash
#### 普通
%define _binaries_in_noarch_packages_terminate_build 0
%define __os_install_post %{nil}
%define debug_package %{nil}
%global mcompany service
%global mtype code
%global mname officialsearch
%global mpath %{mcompany}/%{mtype}/%{mname}
Name: %{mcompany}-%{mtype}-%{mname}
Version: 2024.02
Release:        29
Summary:        %{mcompany} %{mtype} %{mname}

Group:          %{mcompany}
License:        GPLv3+
BuildArch: noarch

%description
%{mcompany} %{mtype} %{mname}

%prep


%build

%install
rm -rf %{buildroot}/opt/%{mpath}
mkdir -p %{buildroot}/opt/%{mpath}
cp -rf %{_builddir}/%{mpath}/* %{buildroot}/opt/%{mpath}

%files
/opt/%{mpath}


### 定制(多了一级目录，把定制模块手动拼到mpath最后面)
%define _binaries_in_noarch_packages_terminate_build 0
%define __os_install_post %{nil}
%define debug_package %{nil}
%global mcompany service
%global mtype dingzhi
%global mname ynsw
%global mmodel import
%global mpath %{mcompany}/%{mtype}/%{mname}/%{mmodel}
Name: %{mcompany}-%{mtype}-%{mname}-%{mmodel}
Version: 2024.02
Release:        20
Summary:        %{mcompany} %{mtype} %{mname}

Group:          %{mcompany}
License:        GPLv3+
BuildArch: noarch

%description
%{mcompany} %{mtype} %{mname}

%prep


%build

%install
rm -rf %{buildroot}/opt/%{mpath}
mkdir -p %{buildroot}/opt/%{mpath}
cp -rf %{_builddir}/%{mpath}/* %{buildroot}/opt/%{mpath}

%files
/opt/%{mpath}

#### 工具
%define _binaries_in_noarch_packages_terminate_build 0
%define __os_install_post %{nil}
%define debug_package %{nil}
%global mcompany service
%global mtype tools
%global mpath %{mcompany}/%{mtype}
Name: %{mcompany}-%{mtype}
Version: 2024.07
Release:        22
Summary:        %{mcompany} %{mtype}

Group:          %{mcompany}
License:        GPLv3+
BuildArch: noarch

%description
%{mcompany} %{mtype}

%prep


%build

%install
rm -rf %{buildroot}/opt/%{mpath}
mkdir -p %{buildroot}/opt/%{mpath}
cp -rf %{_builddir}/%{mpath}/* %{buildroot}/opt/%{mpath}

%files
/opt/%{mpath}
```
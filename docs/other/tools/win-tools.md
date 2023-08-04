# Windows实用工具

文件搜索：火萤酱  http://www.huoying666.com/  
剪贴板：ditto https://ditto-cp.sourceforge.io/  
鼠标手势：WGestures  http://www.yingdev.com/projects/wgestures  
资源管理器插件 QTTabBar http://qttabbar.wikidot.com/  
贴图 Snipaste https://zh.snipaste.com/  
USB启动盘刻录：https://rufus.ie/zh_CN.html  或者 UltraISO(启动-写入硬盘镜像) 
终端：https://github.com/Eugeny/terminus/releases  
Windows子系统WSL: https://sspai.com/post/47719
Windows、Office激活工具：https://github.com/massgravel/Microsoft-Activation-Scripts

PowerToys : https://github.com/microsoft/PowerToys
gcc: https://www.cnblogs.com/feipeng8848/p/15227688.html

## 下载慢问题

* git下载慢

用这个地址下载：https://registry.npmmirror.com/binary.html?path=git-for-windows/

* vscode下载慢

复制下载链接，将`https://`和 `/stable` 之间的网址替换为`vscode.cdn.azure.cn`，替换之后类似下面地址：

https://vscode.cdn.azure.cn/stable/b3e4e68a0bc097f0ae7907b217c1119af9e03435/VSCodeUserSetup-x64-1.78.2.exe

## NSIS安装包教程

* 下载地址：https://nsis.sourceforge.io/Download
* 中文使用手册：https://www.nsisfans.com/help/index.html

安装之后将NSIS安装路径加入环境变量，然后在命令行输入`nsis`或者`makensis`测试是否能正常使用

创建 `.nsi` 文件作为安装包脚本，建议使用vscode打开，安装`NSIS`插件

* 需要注意，vscode里面编辑保存`.nsi`文件时，如果要支持中文，要以`utf8-bom`格式保存，不然中文会出现乱码

## 基本概念

### 区段

官方完整区段相关资料：https://nsis.sourceforge.io/Docs/Chapter4.html#sections

`区段`：包含安装或卸载过程的逻辑，用于组织不同的安装内容，有以下重要特点：

  * 必须至少有一个区段，不然程序没有安装的内容
  * 区段默认为安装区段，`un.`开头的区段为卸载区段
  * 区段可不设置区段名，或者在名称前加短横线`-`，这样让其在安装过程中不可见，悄悄安装
  * 区段可以是一个空区段

区段由`Section`和`SectionEnd`组成，`Section`行中参数依次为：区段名、区段的唯一标识码。代码中`Section1`为区段名，`SEC01`为区段的唯一标识码，用于其他地方操作区段的标识使用。

```conf
Section "Section1" SEC01
SectionEnd
```

### 添加输出文件和安装代码

```ini
; 指定生成的安装包的路径和名称
OutFile "MyApp.exe" ;只指定程序名称的情况下，安装文件输出到.nsi脚本同目录下
OutFile "D:\installer\MyApp.exe" ;指导路径的情况下，输出到指定路径下

Section "Section1" SEC01
  ; 用于指定后续指令的输出目录
  ; INSTDIR是一个自定义变量，前后要用引号包起来了，在NSIS里，数值和字符串用法都是一样。区别的方式就是字符串值在使用时，用引号包起来，不然默认会被当成数值处理。
  SetOutPath "$INSTDIR" 
  ; 用于指定安装包在打包时要包含进哪些文件，且在安装时要将这些文件安装到上面指定的目录中去
  File "..\myapp\MyApp.exe"
SectionEnd
```

### 执行脚本编译安装包

```bash
makensis ./test.nsi
```

### 安装程序属性

安装程序属性主要控制安装程序的：程序信息、图标、默认安装目录、外观、安装界面文本、页面、包含的文件。

官方完整属性：https://nsis.sourceforge.io/Docs/Chapter4.html#attribgen

内置常量变量：https://www.nsisfans.com/help/Section4.2.html#4.2.3

常用的设置安装属性的命令都是编辑时命令，更多属性和特殊用法查看：https://www.nsisfans.com/help/Section4.8.html

常用属性如下：

```ini
# !define是定义常量值的命令，它是一个编译时命令。常量定义好后不能改变值，定义后的常量使用 ${常量名}进行使用。如示例代码中的：${PRODUCT_NAME}
# define const value
!define PRODUCT_NAME "My app"
!define PRODUCT_SHORT_NAME "MyApp"
!define PRODUCT_VERSION "1.0"
!define PRODUCT_BUILD_VERSION "1.0.0.0"
!define PRODUCT_PUBLISHER "My company, Inc."
!define PRODUCT_COPYRIGHT "Copyright (c) 2023 My company Inc."
!define PRODUCT_WEB_SITE "http://www.mycompany.com"

# info of installer
# Name 设置安装程序的名称
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}" ; set name of installer execute
# 当名称中使用了&符号时，就需要传入第二个参数“双&名称”，将第一个参数名称中的&用两个&表示。
Name "Jhon & Jack App" "Jhon && Jack App"
OutFile "MyApp_Setup.exe" ; set file name of compiler out
# Icon 设置安装程序的图标，图标文件后缀名为.ico
Icon "..\myapp\nsis.ico"
# InstallDir 设置默认安装目录
InstallDir "C:${PRODUCT_SHORT_NAME}" ; set the default install dir

# info of installer execute file
# 安装程序版本信息类（右键属性查看安装包的信息）
VIAddVersionKey ProductName "${PRODUCT_NAME} Installer" ; product name
VIAddVersionKey ProductVersion "${PRODUCT_VERSION}" ; product version
VIAddVersionKey Comments "${PRODUCT_NAME}" ; description
VIAddVersionKey CompanyName "${PRODUCT_PUBLISHER}" ; compnay name
VIAddVersionKey LegalCopyright "${PRODUCT_COPYRIGHT}" ; copyright
VIAddVersionKey FileVersion "${PRODUCT_BUILD_VERSION}" ; file version
VIAddVersionKey FileDescription "${PRODUCT_NAME} Installer" ; file description
VIProductVersion "${PRODUCT_BUILD_VERSION}" ; product verion(actual replace FileVersion)
```

### 添加安装界面

中文参考资料：https://www.nsisfans.com/help/Section4.5.html#4.5

大部分的安装包都是有着完善的安装过程，它往往由几个界面组成：

* 欢迎界面
* license界面
* 安装路径选择界面
* 安装过程界面
* 安装完成界面

**古典安装界面**（现在用的比较少）

```ini
# 安装界面，使用Page命令指定安装过程要包含的界面
Page license
Page components
Page directory
Page instfiles
# 卸载界面，UninstPage命令指定卸载过程界面
UninstPage uninstConfirm
UninstPage instfiles
```

**现代UI界面**（MUI）

NSIS自带MUI，所以直接引用进来：

```ini
!include "MUI.nsh"

; MUI_ABORTWARNING常量标志关闭安装程序窗口时给出警告提示
!define MUI_ABORTWARNING
; MUI_ICON常量是MUI安装程序和界面的logo图标，在作用上替代了前文中Icon 命令
!define MUI_ICON "..\myapp\nsis.ico"


; 使用 insertmacro关键字导入不同界面的宏定义
; Welcome page
!insertmacro MUI_PAGE_WELCOME
; License page
!insertmacro MUI_PAGE_LICENSE ".\myapp\license.txt"
; Components page
!insertmacro MUI_PAGE_COMPONENTS
; Directory page
!insertmacro MUI_PAGE_DIRECTORY
; Instfiles page
!insertmacro MUI_PAGE_INSTFILES
; Finish page
!insertmacro MUI_PAGE_FINISH
```

这里用到了`insertmarco`关键字和`macro(宏)`的概念，宏常用于组织安装与卸载的代码片段

### 卸载程序

不同于安装程序，卸载程序包含在安装程序内被一起安装，在安装后运行进行卸载，所以NSIS要求我们在安装的`Section`中定义卸载程序，由编译器生成。并且，需要至少编写一个卸载区段，作为卸载程序的执行内容。这里使用唯一特殊的卸载区段`Uninstall`，这是一个特殊的卸载区段名称，可以不用加`un.`的前缀

卸载属性必须在所有安装和卸载页面之前定义。

```ini
# uninstaller, MUI_UNICON常量指定卸载程序使用的图标。
!define MUI_UNICON "..\myapp\uninstall.ico"

; Uninstaller pages(添加卸载界面)
!insertmacro MUI_UNPAGE_COMPONENTS
!insertmacro MUI_UNPAGE_INSTFILES

Section "Section1" SEC01
  SetOutPath "$INSTDIR"
  WriteUninstaller "$INSTDIR\uninstall.exe"
  
  File "..\myapp\MyApp.exe"
SectionEnd

Section -Uninstall
	; your uninstall code here
SectionEnd
```

### 设置语言界面

语言设置必须放在所有安装和卸载界面之后，不然编译会出现一个错误，或别的未知错误。

NSIS是顺序执行的，所以代码顺序十分重要。因为MUI在使用中包含宏代码，而它的宏代码中的变量又有前后关系，所以使用MUI的过程中会经常遇到一些因为代码顺序导致的问题。

```ini
; Language files
!insertmacro MUI_LANGUAGE "English"
```

### 编写安装与卸载内容

```ini
!define PRODUCT_UNINSTALL_KEY "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall${PRODUCT_NAME}"

; 安装
Section -myapp
  SetOutPath "$INSTDIR"
  ; 指示编译器后续代码中File指令的覆盖方式（如果存在），ifnewer 值表示当文件更新时覆盖安装
  SetOverwrite ifnewer

  WriteUninstaller "$INSTDIR\uninstall.exe"

  ; 安装指定文件到当前 SetOutPath 指定的目录下
  File "..\myapp\MyApp.exe"
  ; 安装指定文件到指定路径下，并重命名文件
  File "/oname=$INSTDIR\repair.file" "..\myapp\s_win_repair.file"

  SetOutPath "$INSTDIR\bin"
  ; 递归安装指定文件夹内所有的文件到当前 SetOutPath 指定的目录下，会保持内部的文件夹层级结构
  File /r "..\myapp\bin*.*"

  SetOutPath "$INSTDIR\resources"
  File "/oname=uninstallerIcon.ico" "${MUI_ICON}" 

  ; 安装桌面快捷方式
  ; $DESKTOP 常量表示执行安装的计算机的系统桌面路径
  CreateShortCut "$DESKTOP${PRODUCT_NAME}.lnk" "$INSTDIR${PRODUCT_SHORT_NAME}.exe"

  ; 安装开始菜单快捷方式
  ; 在$SMPROGRAMS常量表示的开始菜单目录下使用CreateDirectory创建了产品名称的目录，再在其中创建快捷方式
  IfFileExists "$SMPROGRAMS${PRODUCT_NAME}" +2 0
    CreateDirectory "$SMPROGRAMS${PRODUCT_NAME}"
  CreateShortCut "$SMPROGRAMS${PRODUCT_NAME}${PRODUCT_NAME}.lnk" "$INSTDIR${PRODUCT_SHORT_NAME}.exe"

  ; 注册安装程序（写入注册表）
  WriteRegStr HKLM "${PRODUCT_UNINSTALL_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr HKLM "${PRODUCT_UNINSTALL_KEY}" "InstallDir" "$INSTDIR"
  WriteRegStr HKLM "${PRODUCT_UNINSTALL_KEY}" "UninstallString" "$INSTDIR\uninstall.exe"
  WriteRegStr HKLM "${PRODUCT_UNINSTALL_KEY}" "DisplayIcon" "$INSTDIR\resources\uninstallerIcon.ico"
  WriteRegStr HKLM "${PRODUCT_UNINSTALL_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKLM "${PRODUCT_UNINSTALL_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr HKLM "${PRODUCT_UNINSTALL_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"

SectionEnd

; 卸载，一般的做法是，与安装的顺序对应，依次删除安装的文件，最后删除整个安装目录
Section -Uninstall
  ; 删除指定路径的文件
  Delete "$INSTDIR\uninstall.exe"
  Delete "$INSTDIR\repair.file"
  Delete "$INSTDIR\MyApp.exe"

  ; 递归删除指定文件夹
  RMDir /r "$INSTDIR\bin"

  Delete "$INSTDIR\resources\uninstallerIcon.ico"
  ; 删除指定文件夹，必须为空文件夹，不然无法删除并设置错误标记（不影响流程）
  RMDir "$INSTDIR\resources"

  RMDir "$INSTDIR"

  ; 删除桌面快捷方式
  Delete "$DESKTOP${PRODUCT_NAME}.lnk"

  ; 删除开始菜单
  Delete "$SMPROGRAMS${PRODUCT_NAME}${PRODUCT_NAME}.lnk"
  RMDir "$SMPROGRAMS${PRODUCT_NAME}"

  ; 删除注册表
  DeleteRegKey HKLM "${PRODUCT_UNINSTALL_KEY}"

  ; 自动关闭（安装阶段也适用）
  SetAutoClose true
SectionEnd
```

`IfFileExists`知识点(判断路径是否已经存在，它是一个流程控制指令):

```ini
; 位置可以指定行偏移或者标记，行偏移使用 +/-数值或者0，正数值代表从本行起向后的第几行，负数值代表从本行起向前的第几行，0代表从本行起继续执行。
IfFileExists 要检测的文件或路径 文件或路径存在时跳转的位置 [文件或路径不存在时跳转的位置]

; 如下例判断记事本程序是否已经安装在操作系统目录下，存在从改行顺序执行弹出 MessageBox。不存在则向后记2行开始执行，跳过MessageBox。
IfFileExists $WINDIR\notepad.exe 0 +2
  MessageBox MB_OK "记事本已安装"

; 指定标记则使用标记名称，直接跳转到标记的代码行开始执行
IfFileExists $WINDIR\notepad.exe 0 notExists
  MessageBox MB_OK "记事本已安装"
notExists:
```

`WriteRegStr`知识点（类似的添加注册表值的指令还有：WriteINIStr、WriteRegBin、WriteRegDWORD、WriteRegExpandStr）：

```ini
; subkey为具体注册表项相对于rootkey的全路径
WriteRegStr rootkey subkey key_name value
eg.
WriteRegStr rootkey "SOFTWARE\example" "key1" "Hello World!"

; rootkey可以为下列内容
; 常用HKLM为本机内容（一般用来记录为所有用户的信息），HKCU为当前用户
HKCR 或 HKEY_CLASSES_ROOT，前者为缩写，下同。
HKLM 或 HKEY_LOCAL_MACHINE
HKCU 或 HKEY_CURRENT_USER
HKU 或 HKEY_USERS
HKCC 或 HKEY_CURRENT_CONFIG
HKDD 或 HKEY_DYN_DATA
HKPD 或 HKEY_PERFORMANCE_DATA
SHCTX 或 SHELL_CONTEXT
```

### 定制安装向导

```ini
; 窗口标题，安装程序标题默认为 {Name命令指定的名称} Setup，如果你不喜欢可以自己设置
Caption "${PRODUCT_NAME} Installer"

; 底部分割线文本
; BrandingText设置安装窗口内容底部分割线上的文本。如果设置空字符串("")，则显示默认值(Nullsoft Install System v3.08)；如果不想在这里显示文本，设置只有一个空格的字符串" "就行
BrandingText /TRIMLEFT "文本内容"
eg.
BrandingText /TRIMLEFT "${PRODUCT_NAME} ${PRODUCT_VERSION}"

; 退出警告，用户点击关闭按钮退出安装程序时进行提示
!define MUI_ABORTWARNING

; 顶部右侧图标
; 安装过程界面的顶部右侧可以设置图标，默认为NSIS的logo。我们自己程序的安装包肯定是是替换它的，通过定义下列常量来实现：
; MUI_HEADERIMAGE作为开关量，必须定义后后续的常量才会生效
!define MUI_HEADERIMAGE ; Defining this value is the basis for the follow two definitions
; MUI_HEADERIMAGE_BITMAP常量定义使用的图片，格式限定为(.bmp)，图片区域尺寸是15057，图片最好是15057的倍数，不然就会被拉伸变形。
!define MUI_HEADERIMAGE_BITMAP ".\resource\header_150x57.bmp"
!define MUI_HEADERIMAGE_BITMAP_STRETCH NoStretchNoCropNoAlign
; MUI_HEADERIMAGE_RIGHT常量定义图片显示为右侧
!define MUI_HEADERIMAGE_RIGHT ; Display to right

; 欢迎界面
; 定义MUI_WELCOMEFINISHPAGE_BITMAP常量的值为图片路径，格式限定为(.bmp)。图片区域尺寸为164*314，推片最好是区域尺寸的倍数，不然可能会被裁剪。
!define MUI_WELCOMEFINISHPAGE_BITMAP ".\resource\welcome_install.bmp"
!insertmacro MUI_PAGE_WELCOME

; License界面
; 一般License界面我们定义用户需要勾选确认，而不是直接点击Agree就进入下一步了。在导入Lincese界面宏之前，定义MUI_LICENSEPAGE_CHECKBOX常量，设定必须点击同意选项了之后才能继续进行下一步。
!define MUI_LICENSEPAGE_CHECKBOX
!insertmacro MUI_PAGE_LICENSE "..\myapp\license.txt"

; 组件界面
; 组件界面在实际使用中不是一个非必须的界面，在有一些可选的内容需要用户选择性安装时才需要这个界面，选择安装列表显示所有可见的Section。反之，不需要的话就移除Components page 。
; 组件界面的文字信息很多，我们一般定义顶部的标题(MUI_PAGE_HEADER_TEXT)和文本(MUI_COMPONENTSPAGE_TEXT_COMPLIST)，与选择框的标题文本(MUI_PAGE_HEADER_SUBTEXT)。
!define MUI_PAGE_HEADER_TEXT "Component Selection"
!define MUI_COMPONENTSPAGE_TEXT_COMPLIST "Select components to install:"
!define MUI_PAGE_HEADER_SUBTEXT "Select the components you want to install."
!insertmacro MUI_PAGE_COMPONENTS
```

## 常用样例

WPS插件示例，使用了xml文件操作，参考：http://wiz0u.free.fr/prog/nsisXML/ ，下载好之后直接解压即可，将`.nsi`文件放到解压后的根目录即可

```ini
!define VERSION "2023.07.22"
!define PROENV "pro"
!define PROJECT_NAME "myproject"

!ifndef TARGETDIR
!ifdef NSIS_UNICODE
!define TARGETDIR ".\binU"
!else
!define TARGETDIR ".\bin"
!endif
!endif

!addplugindir "${TARGETDIR}"

Name "${PROJECT_NAME}-wps-${PROENV} ${VERSION}"
OutFile "${PROJECT_NAME}-wps-${PROENV}_${VERSION}.exe"
Icon "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
Unicode true
; ShowInstDetails show	

VIAddVersionKey ProductName "${PROJECT_NAME} installer"
VIAddVersionKey ProductVersion "${VERSION}"
VIAddVersionKey Comments "${PROJECT_NAME} installer"
VIAddVersionKey CompanyName "${PROJECT_NAME}"
VIAddVersionKey FileVersion "${VERSION}"
VIAddVersionKey FileDescription "${PROJECT_NAME} ${VERSION} Installer"
VIProductVersion "${VERSION}.0"

Section "Main program"
  SetOutPath "$APPDATA\kingsoft\wps\jsaddons\${PROJECT_NAME}-addons_${VERSION}"
  File /r ".\wpsplugin\*.*"
  Sleep 500
	nsisXML::create
  nsisXML::load "$APPDATA\kingsoft\wps\jsaddons\jsplugins.xml"
  IntCmp $0 0 noFile
	nsisXML::select '/jsplugins/jsplugin[@name="${PROJECT_NAME}-addons"]'
	IntCmp $2 0 noProject
	nsisXML::setAttribute "version" "${VERSION}"
	nsisXML::save "$APPDATA\kingsoft\wps\jsaddons\jsplugins.xml"
	nsisXML::release $0
	Goto end
noFile:
  ; MessageBox MB_OK "nofile"
  nsisXML::create
  nsisXML::createProcessingInstruction "xml" 'version="1.0" encoding="UTF-8"'
	nsisXML::appendChild
	nsisXML::createElement "jsplugins"
	nsisXML::appendChild
	StrCpy $1 $2
	nsisXML::createElement "jsplugin"
	nsisXML::setAttribute "url" "null"
	nsisXML::setAttribute "name" "${PROJECT_NAME}-addons"
  nsisXML::setAttribute "version" "${VERSION}"
  nsisXML::setAttribute "type" "wps"
	nsisXML::appendChild
	nsisXML::save "$APPDATA\kingsoft\wps\jsaddons\jsplugins.xml"
  Goto end
noProject:
  ; MessageBox MB_OK "nofuncun"
  nsisXML::create
  nsisXML::load "$APPDATA\kingsoft\wps\jsaddons\jsplugins.xml"
  nsisXML::select '/jsplugins'
  nsisXML::createElement "jsplugin"
	nsisXML::setAttribute "url" "null"
	nsisXML::setAttribute "name" "${PROJECT_NAME}-addons"
  nsisXML::setAttribute "version" "${VERSION}"
  nsisXML::setAttribute "type" "wps"
	nsisXML::appendChild
	nsisXML::save "$APPDATA\kingsoft\wps\jsaddons\jsplugins.xml"
end:
  MessageBox MB_OK "安装完成，请重启wps后使用！"
  ; 安装完成之后自动关闭
  SetAutoClose true
SectionEnd
```


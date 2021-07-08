# GitLab配置文件yml

## Gitlab CI

Gitlab CI 是与 Gitlab 配套使用，深度集成的强大的持续集成工具。

- 如何启用 Gitlab CI？
  目前 Gitlab 是对所有项目默认启用 CI 的。只需在项目根目录下添加`.gitlab-ci.yml`即可使用。
- 设置的位置在哪里？
  进入要设置的**项目设置->CI/CD**即可进行相关设置。

`.gitlab-ci.yml`书写方法

1. 参考[这里](http://www.ruanyifeng.com/blog/2016/07/yaml.html)的 yml 文件语法
2. 完整的参数可用列表参考[这里](https://docs.gitlab.com/ee/ci/yaml/)
1. CI高级技巧参考：https://www.jianshu.com/p/3c0cbb6c2936

## 常用参数列表

1. **stages**：`pipeline`的阶段列表。定义整个`pipeline`的阶段
2. **stage**：定义某个`job`的所在阶段。参考#1
3. **script**：（唯一一个必须写的参数）`job`执行过程中的命令列表
4. **only/except**：触发类型/限制`job`的创建条件。参考[可用的选项](https://docs.gitlab.com/ee/ci/yaml/#only-and-except-simplified)
5. **tags**：指定`runner`的`tag`，只有拥有指定`tag`的`runner`才会接收到这个任务
6. **cache**：缓存。可选部分目录或未被 git 追踪的文件进行缓存,[参考](https://docs.gitlab.com/ee/ci/yaml/#cache)
7. **environment**：指定部署相关任务的环境，并非真实环境，是对要部署到某环境的任务的归类。方便在`gitlab`上聚合以便进行回滚和重新部署操作，[参考](https://docs.gitlab.com/ee/ci/yaml/#environment)
8. **artifacts**：保留文档。在每次 job 之前`runner`会清除未被 git 跟踪的文件。为了让编译或其他操作后的产物可以留存到后续使用，添加该参数并设置保留的目录，保留时间等。被保留的文件将被上传到`gitlab`以备后续使用。[参考](https://docs.gitlab.com/ee/ci/yaml/#artifacts)
9. **dependencies**：任务依赖。指定`job`的前置`job`。添加该参数后，可以获取到前置`job`的`artifacts`。注意如果前置 job 执行失败，导致没能生成`artifacts`，则 job 也会直接失败。

## 变量定义

```yaml
# 全局变量
variables:
    SEVER_NAME: "law"

# 单job变量
job1:
  stag: build
  variables:
    SEVER_NAME: "law"
```

## 一个例子（萝卜白菜后端项目）

```yaml
stages: # 定义3个阶段。build，产品部署，测试部署
  - common build
  - production deploy
  - development deploy

project build:
  stage: common build
  only: # 只在以下分支执行，except：定义git分支，不创建job
    - test-develop
    - master
  before_script: # 正式命令前的预备命令。可以合并到script里。单独写出更加语义化
    - chcp 65001 # 处理windows中utf8编码文件乱码
    - call G:\TCSOFT\CI\nuget.exe restore ./ECShop.sln
  cache:
    untracked: true # 保留未被git追踪的文件(所有git没有追踪的文件)
    paths: # 指定缓存目录
      - packages/
  script:
    - chcp 65001
    - call "C:\Program Files (x86)\Microsoft Visual Studio\2017\Enterprise\MSBuild\15.0\Bin\msbuild.exe" ECShop.sln
  artifacts: # 工件保留目录。注意，工件有一个月的默认过期时间。如果需要更长可以自定义。
  # 可以缓存在gitlab的流水线记录中，供直接下载
    paths:
      - ECShop\bin
      - ECShop.WEB\bin
      - UTrans.API\bin
      - MIS.API/bin
  tags: # 指定tag的runner
    - .9 public

trans files:
  stage: development deploy
  environment:
    name: development
    url: http://test.xxxx.com
  dependencies:
    - project build # 定义job依赖关系，这样他们就可以互相传递artifacts
  only:
    - test-develop
  script:
    - call chcp 65001
    - call xcopy ECShop\bin\*.dll D:\TCSOFT\ECShopTest\ECShop.API\bin /e /y
    - call xcopy ECShop.WEB\bin\*.dll D:\TCSOFT\ECShopTest\ECShop.WEB\bin /e /y
    - call xcopy UTrans.API\bin\*.dll D:\TCSOFT\ECShopTest\UTrans.API\bin /e /y
  tags:
    - .9 public

trans mis api files:
  stage: development deploy
  environment:
    name: development
    url: http://test.xxxx.com
  dependencies:
    - project build
  only:
    - test-develop
  script:
    - call chcp 65001
    - call xcopy MIS.API\bin\*.dll D:\TCSoft\ECShopTest\MIS.API\bin /e /y
  tags:
    - .20 public

# 正式发布web api utapi 到正式服务器
trans production ecshop files:
  stage: production deploy
  environment:
    name: production
    url: https://www.xxxx.com
  dependencies:
    - project build
  only:
    - master
  script:
    - call chcp 65001
    - call xcopy ECShop\bin\*.dll E:\WebSite\ECShop\ECShop.API\bin /e /y
    - call xcopy ECShop.WEB\bin\*.dll E:\WebSite\ECShop\ECShop\bin /e /y
    - call xcopy UTrans.API\bin\*.dll E:\WebSite\ECShop\UTrans.API\bin /e /y
  tags:
    - 139.196.148.13 public

trans production mis api files:
  stage: production deploy
  environment:
    name: production
    url: https://www.xxxx.com
  dependencies:
    - project build
  only:
    - master
  script:
    - call chcp 65001
    - call xcopy MIS.API\bin\*.dll D:\TCSOFT\MISAPIForLBBC\MIS.API\bin /e /y
  tags:
    - .22 public
```

#### 店务通前台项目

```yaml
stages:
  - build test
  - build production
  - deploy test
  - deploy production

# 编译 ---------------------------------#
test build:
  stage: build test
  before_script:
    - npm i --progress=false
  cache:
    untracked: true
    paths:
      - node_modules/
  script:
    - npm run god
  artifacts:
    expire_in: 1 day
    name: "$CI_COMMIT_REF_NAME"
    paths:
      - dist/
  only:
    - develop
  tags:
    - linux public

production build:
  stage: build production
  before_script:
    - npm i --progress=false
  cache:
    untracked: true
    paths:
      - node_modules/
  script:
    - npm run build
  artifacts:
    expire_in: 1 month
    name: "$CI_COMMIT_REF_NAME"
    paths:
      - dist/
  only:
    - master
  tags:
    - linux public

# --------------------------------------#

# 部署 ---------------------------------#
test deploy:
  stage: deploy test
  script:
    - chcp 65001
    - call xcopy dist %TEST_SITE_PATH% /e /y
  only:
    - develop
  dependencies:
    - test build
  environment:
    name: god
    url: https://tcshopgod.xxxx.com
  tags:
    - 123.123.123.123 public

production deploy:
  stage: deploy production
  script:
    - chcp 65001
    - call xcopy dist %PUBLISH_SITE_PATH% /e /y
  only:
    - master
  dependencies:
    - production build
  environment:
    name: production
    url: https://tcshop.xxxx.com
  when: manual
  tags:
    - 123.123.123.123 public

# --------------------------------------#

```





#### pos微服务项目

```yml
stages:
  - build
  - deploy test
  - deploy production
before_script:
  - chcp 65001

project build:
  stage: build
  cache:
    untracked: true
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - packages
  script:
    - dotnet restore
    - dotnet publish -o ./out -c Release
  artifacts:
    name: ${CI_COMMIT_REF_SLUG}
    paths:
      - ./out
  tags:
    - 139.196.148.13 public

deploy to test:
  stage: deploy test
  environment:
    name: develop
  dependencies:
    - project build
  only:
    - develop
  script:
    - call xcopy out %TEST_PATH% /e /y
  tags:
    - 139.196.148.13 public

deploy to production:
  stage: deploy production
  environment:
    name: master
  dependencies:
    - project build
  only:
    - master
  script:
    - call xcopy out %PRODUCTION_PATH% /e /y
  when: manual
  tags:
    - 139.196.148.13 public
```

#### 注意点

1. 只有项目根目录添加了`.gitlab-ci.yml`才会真正启用 CI
2. 部分参数是可以添加到全局的，比如`cache`，`before_script`等。这时在`job`中添加同名参数可以在本`job`中覆盖掉全局的参数
3. 可以参考`yml`的语法减少公共的代码
4. 一定要做好限制，添加`only`，`tags`等参数，避免在不该执行的分支或时机或地点去执行`job`


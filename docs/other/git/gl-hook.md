# Gitlab钩子hook

## Git 钩子

和其它版本控制系统一样，Git 能在特定的重要动作发生时触发自定义脚本。 有两组这样的钩子：客户端的和服务器端的。 客户端钩子由诸如提交和合并这样的操作所调用，而服务器端钩子作用于诸如接收被推送的提交这样的联网操作。

把一个正确命名且可执行的文件放入 Git 目录下的 hooks 子目录中，即可激活该钩子脚本。 这样一来，它就能被 Git 调用。
你可以随心所欲地运用这些钩子。

[钩子列表](https://git-scm.com/book/zh/v2/%E8%87%AA%E5%AE%9A%E4%B9%89-Git-Git-%E9%92%A9%E5%AD%90)

## Git Server Hook

git 在服务端有 3 个钩子：`pre-receive`,`post-receive`, `update`

我们可以使用`pre-receive`来阻止某些不合规范的提交。
这个钩子有 3 个参数:

1. 最后一个提交的 sha1
1. 接受本次 push 前的最后一个提交的 sha1
1. 本次 push 所在的分支名

比如我们现在要阻止某些带有不符合规范的提交信息的 commit 被 push 上来
在钩子中使用`git log $0...$1 --format=%s`即可筛选出这次 push 所有提交的提交信息

接下来就可以对这些信息进行校验以判断是否要放行。

## Gitlab 的相关设置

参考[这里](https://docs.gitlab.com/ee/administration/custom_hooks.html)


# Git操作脚本-删除Git远程分支

脚本名称：del.sh

使用方法：调用del.sh脚本，输入2个参数：1.gitclone远程到本地的目录,2.需要保留的分支。

例子： ./del.sh schoolpal "develop,201906_develop" （这个例子中会进入schoolpal文件夹，删除除了`develop`和`201906_develop`的其他分支）。

```sh
#!/bin/bash
delpath="$1"
holdbranchstr="$2"
holdbranchs=${holdbranchstr//,/ }
cd $delpath;
allbranchs=`git branch -a`;
delarr=()
echo -e '\033[31m 下面远程仓库分支会被删除，请仔细核对！！！ \033[0m';
for br in $allbranchs;
do
    br_name=`echo $br | grep '/' | cut -d '/' -f3`
    if [[ "" != "$br_name" && "master" != "$br_name" && "HEAD" != "$br_name" ]]; then
        needel="Y";
        for hbr in $holdbranchs;
        do
            if [[ "$hbr" = "$br_name" ]];then
                needel="N";
                break;
            fi;
        done;
        if [[ "Y" = "$needel" ]];then
            echo "$br -->> $br_name"
            delarr[${#delarr[@]}]=$br_name
        fi;
    fi;
done;

read -p " 是否确认删除上面的远程仓库分支 (y/n)[n]: " answer

if [[ "$answer" = "Y" || "$answer" = "y" ]]; then 
    for dbr in ${delarr[@]};
    do
        git push origin --delete $dbr;
        echo "远程分支[ $dbr ]已经删除！";
    done;
else
    echo "已忽略！";
fi;

exit 0
```
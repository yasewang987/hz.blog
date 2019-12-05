# Mac光盘刻录

1. 首先优盘插入MAC后检查一下，可以看到disk5是我要用的优盘。 实际上Proxmox占用的空间并不大，4GB，8GB的优盘都够用了。

    ```bash
    diskutil list
    /dev/disk0 (internal, physical):
    #:                       TYPE NAME                    SIZE       IDENTIFIER
    0:      GUID_partition_scheme                        *1.0 TB     disk0
    1:                        EFI EFI                     209.7 MB   disk0s1
    2:                 Apple_APFS Container disk1         1.0 TB     disk0s2

    /dev/disk1 (synthesized):
    #:                       TYPE NAME                    SIZE       IDENTIFIER
    0:      APFS Container Scheme -                      +1.0 TB     disk1
                                    Physical Store disk0s2
    1:                APFS Volume Catalina - Data         68.9 GB    disk1s1
    2:                APFS Volume Preboot                 154.9 MB   disk1s2
    3:                APFS Volume Recovery                528.9 MB   disk1s3
    4:                APFS Volume VM                      1.1 MB     disk1s4
    5:                APFS Volume Catalina                10.6 GB    disk1s5

    /dev/disk2 (external, physical):
    #:                       TYPE NAME                    SIZE       IDENTIFIER
    0:     FDisk_partition_scheme                        *30.8 GB    disk2
    1:             Windows_FAT_32                         30.8 GB    disk2s4
    ```
1. Unmount优盘

    ```bash
    diskutil unmountDisk /dev/disk2
    ```
1. 将下载的Proxmox ISO文件写入优盘，大概需要几分钟： 

    ```bash
    sudo dd if=/Users/hzgod/Downloads/proxmox-ve_6.1-1.iso of=/dev/disk2 bs=4m
    ```
    搞定，可以用来启动安装了。从mac访达可以看到启动文件。
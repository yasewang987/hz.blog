# Ansible安装

* 官方参考资料： https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html

### Ubuntu

```bash
sudo apt update
sudo apt install software-properties-common
sudo apt-add-repository --yes --update ppa:ansible/ansible
sudo apt install ansible
# 命令补全
sudo apt install python-argcomplete
```

### CentOS

```bash
sudo yum install ansible

# 命令补全
sudo yum install python-argcomplete
```

### Github

```bash
# devel分支
python -m pip install --user https://github.com/ansible/ansible/archive/devel.tar.gz

# 指定稳定版定
python -m pip install --user https://github.com/ansible/ansible/archive/stable-2.9.tar.gz

sudo pip install ansible

# 命令补全
python -m pip install argcomplete
```

## 实战

一键创建一个sudoer用户，并添加ssh密钥，关闭root登录并更改默认ssh端口，还更新所有包，达到安装包前开箱即用状态

```yml
---
- hosts: all
  gather_facts: no

  vars:
    ansible_user: root
    ansible_port: "22"

  tasks:
    - name: print host
      debug:
        msg: "{{ ansible_host }}:{{ ansible_port }}"

    - name: Check if we're using the default SSH port
      wait_for:
        port: "22"
        state: "started"
        host: "{{ ansible_host }}"
        connect_timeout: "5"
        timeout: "10"
      delegate_to: "localhost"
      ignore_errors: "yes"
      register: default_ssh

    # If reachable, continue the following tasks with this port
    - name: Set inventory ansible_port to default
      set_fact:
        ansible_port: "22"
      when: default_ssh is defined and
            default_ssh.state == "started"
      register: ssh_port_set

    # If unreachable on port 22, check if we're able to reach
    # {{ ansible_host }} on {{ ansible_port }} provided by the inventory
    # from localhost
    - name: Check if we're using the inventory-provided SSH port
      wait_for:
        port: "{{ ansible_port }}"
        state: "started"
        host: "{{ ansible_host }}"
        connect_timeout: "5"
        timeout: "10"
      delegate_to: "localhost"
      ignore_errors: "yes"
      register: configured_ssh
      when: default_ssh is defined and
            default_ssh.state is undefined

    # If {{ ansible_port }} is reachable, we don't need to do anything special
    - name: SSH port is configured properly
      debug:
        msg: "SSH port is configured properly"
      when: configured_ssh is defined and
            configured_ssh.state is defined and
            configured_ssh.state == "started"
      register: ssh_port_set

    - name: Fail if SSH port was not auto-detected (unknown)
      fail:
        msg: "The SSH port is neither 22 or {{ ansible_port }}."
      when: ssh_port_set is undefined

    - name: Confirm host connection works
      ping:

    - name: Make sure we have a "wheel" group
      group:
        name: wheel
        state: present

    - name: Allow "wheel" group to have passwordless sudo
      lineinfile:
        dest: /etc/sudoers
        state: present
        regexp: "^%wheel"
        line: "%wheel ALL=(ALL) NOPASSWD: ALL"
        validate: "visudo -cf %s"

    - name: Create a sudoer login user
      user:
        name: "{{ username }}"
        password: "{{ '{{ password }}' | password_hash('bcrypt') }}"
        state: present
        shell: /bin/bash
        append: yes
        groups:
          - wheel
        system: no
        create_home: yes
        home: /home/{{ username }}
        ssh_key_bits: 2048
        ssh_key_file: .ssh/id_rsa

    - name: Set authorized keys for the user copying it from current user
      authorized_key:
        user: "{{ username }}"
        key: "{{ lookup('file', lookup('env','HOME') + '/.ssh/id_rsa.pub') }}"
        comment: my key

    - name: Run deferred setup to gather facts
      setup:

    # package
    - include_role:
        name: robertdebock.update
      vars:
        update_autoremove: yes
        update_upgrade_command: dist

    # selinux TODO
    - name: test to see if selinux is running
      command: getenforce
      register: sestatus
      changed_when: false
      when: ansible_facts['distribution'] == "CentOS"

    - block:
      - name: ensure a list of packages installed
        yum:
          name: "{{ packages }}"
        vars:
          packages:
          - libselinux-python
          - policycoreutils-python
        when: ansible_facts['distribution'] == "CentOS"

      # sshd
      - name: Setup selinux for alternate SSH port
        seport:
          ports: "2022"
          proto: "tcp"
          setype: "ssh_port_t"
          state: "present"
        # SELinux is disabled on this host
        ignore_errors: "yes"
      when: ansible_facts['distribution'] == "CentOS" and
            sestatus is defined and
            sestatus.stdout is defined and
            '"Enabled" in sestatus.stdout'

    - include_role:
        name: arillso.sshd
      vars:
        ssh_server_ports: ['2022'] # sshd
        ssh_client_password_login: true # ssh
        ssh_server_enabled: true
        ssh_server_password_login: false # sshd
        ssh_sftp_enabled: true # sftp
```

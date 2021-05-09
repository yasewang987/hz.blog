# Ansible介绍

Ansible是一款自动化运维工具，Ansible 有三个最吸引人的地方：无客户端、简单易用和日志集中控管。

Ansible无需在每台被管理的服务器上安装agent，只需要服务器支持ssh，并且有python环境即可。换句话说，当 `Control Machine` (主控端) 可以用 SSH 连上 `Managed node`，且被连上的机器里有预载 Python 时，Ansible 就可以运作了！

## 基本概念：

* Inventory: 记录远程主机的信息（IP，端口，密码等等）
* Modules: 基本的模块功能（如apt，ping）
* Tasks：任务，模块的更详细的设置
* Playbooks：定义一系列任务

## 组件：

* Hosts：同时操作属于一个组的多台主机,组和主机之间的关系通过 inventory 文件配置. 默认的文件路径为 `/etc/ansible/hosts`
* Tasks：任务，由模板定义的操作列表
* Variable：变量
* Templates：模板，一般是.j2为文件后缀
* Handlers：处理器，当某条件满足时，触发执行的操作
* Roles：角色

## Inventory

首先是/etc/ansible/hosts，也就是Inventory，我们可以定义主机

```bash
名字 ansible_port=端口 ansible_host=IP
```

完整参数如下：

* ansible_host
    * 将要连接的远程主机名.与你想要设定的主机的别名不同的话,可通过此变量设置.
* ansible_port
    * ssh端口号.如果不是默认的端口号,通过此变量设置.
* ansible_user
    * 默认的 ssh 用户名
* ansible_pass
    * ssh 密码(这种方式并不安全,我们强烈建议使用 --ask-pass 或 SSH 密钥)
* ansible_sudo_pass
    * sudo 密码(这种方式并不安全,我们强烈建议使用 --ask-sudo-pass)
* ansible_sudo_exe (new in version 1.8)
    * sudo 命令路径(适用于1.8及以上版本)
* ansible_connection
    * 与主机的连接类型.比如:local, ssh 或者 paramiko. Ansible 1.2 以前默认使用 paramiko.1.2 以后默认使用 ‘smart’,‘smart’ 方式会根据是否支持 ControlPersist, 来判断’ssh’ 方式是否可行.
* ansible_private_key_file
    * ssh 使用的私钥文件.适用于有多个密钥,而你不想使用 SSH 代理的情况.
* ansible_shell_type
    * 目标系统的shell类型.默认情况下,命令的执行使用 ‘sh’ 语法,可设置为 ‘csh’ 或 ‘fish’.
* ansible_python_interpreter
    * 目标主机的 python 路径.适用于的情况: 系统中有多个 Python, 或者命令路径不是"/usr/bin/python",比如 *BSD, 或者 /usr/bin/python
    * 不是 2.X 版本的 Python.我们不使用 “/usr/bin/env” 机制,因为这要求远程用户的路径设置正确,且要求 “python” 可执行程序名不可为 python以外的名字(实际有可能名为python26).
    * 与 ansible_python_interpreter 的工作方式相同,可设定如 ruby 或 perl 的路径

对于一个组的定义

```bash
[group_name]
名字 ansible_port=端口 ansible_host=IP
名字 ansible_port=端口 ansible_host=IP
```

`/etc/ansible/hosts` 不是唯一的，你可以创建自己的hosts文件，然后指定文件使用

```bash
ansible-playbook -i hosts xxx.yml
ansible <pattern_goes_here> -m <module_name> -a <arguments>
```

主机匹配 (就是上面的 `pattern_goes_here`)

* `all`和`*`代表目标为仓库(`inventory`)中的所有机器
* 也可以写IP地址或系列主机名`192.168.1.*`
* 必须隶属`webservers`组但同时不在`phoenix`组`webservers:!phoenix`
* 正则表达式使用`~`开头`~(web|db).*\.example\.com`
* 从文件读取hosts,文件名以`@`为前缀开头`@retry_hosts.txt`

```bash
*.example.com
webservers[0]
webservers[0-25]
```

## ad-hoc命令

Ansible提供两种方式去完成任务

* ad-hoc命令
* Ansible playbook

如果我们敲入一些命令去比较快的完成一些事情，而不需要将这些执行的命令特别保存下来，这样的命令就叫做ad-hoc命令

Ansible 能够以并行的方式同时运行ad-hoc命令

```bash
$ ansible atlanta -a "/sbin/reboot" -f 10
$ ansible atlanta -a "/usr/bin/foo" -u username
$ ansible atlanta -a "/usr/bin/foo" -u username --sudo [--ask-sudo-pass]
# 批量复制
$ ansible atlanta -m copy -a "src=/etc/hosts dest=/tmp/hosts"
# 修改权限
$ ansible webservers -m file -a "dest=/srv/foo/a.txt mode=600"
# 安装但不升级
$ ansible webservers -m yum -a "name=acme state=present"
# 确认一个软件包的安装版本
$ ansible webservers -m yum -a "name=acme-1.5 state=present"
# 确认一个软件包还没有安装
$ ansible webservers -m yum -a "name=acme state=absent"
# 确认某个服务在所有的webservers上都已经启动
$ ansible webservers -m service -a "name=httpd state=started"
# Gathering Facts
$ ansible all -m setup
```

## Playbooks

`Playbooks`是Ansible的配置、部署和编排语言。他们可以描述您希望远程系统实施的策略。我们把操作定义在Playbooks里面，Playbooks是一个yaml文件，文件名随意。playbook由一个或多个‘plays’组成.它的内容是一个以 `plays` 为元素的列表.

每一个`play`包含了一个`task列表`（任务列表），一个task在其所对应的所有主机上执行完毕之后，下一个task才会执行

如果一个host执行task失败，这个host将会从整个playbook的`rotation`中移除. 如果发生执行失败的情况，请修正playbook中的错误，然后重新执行即可。

他们是按照从上到下依次执行的

> 每个 task 的目标在于执行一个module, 每个tasks有一个name和一个module, modules 具有”幂等”性。

```yml
# ansible会去指定的inventory文件里寻找对应的webservers主机
- hosts: webservers
  vars:
    http_port: 80
    max_clients: 200
  remote_user: root
  
  tasks:
    - name: ensure apache is at the latest version
      yum: pkg=httpd state=latest
    - name: write the apache config file
      template: src=/srv/httpd.j2 dest=/etc/httpd.conf
      notify:
      - restart apache
    - name: ensure apache is running
      service: name=httpd state=started
    - name: template configuration file
      template: src=template.j2 dest=/etc/foo.conf
      # 在发生改变时执行的操作, 通过名字来引用
      # handlers 会按照声明的顺序执行
      notify:
        - restart memcached
        - restart apache
    - name: run this command and ignore the result
      shell: /usr/bin/somecommand
      ignore_errors: True

  handlers:
    - name: restart apache
      service: name=httpd state=restarted
```

```bash
# 并行的级别是10
ansible-playbook playbook.yml -f 10
```

### Ansible-Pull

Ansible-pull是一个小脚本，它从git上checkout一个关于配置指令的repo,然后以这个配置指令来运行ansible-playbook.

### include语句

用include语句引用task文件的方法，可允许你将一个配置策略分解到更小的文件中。使用include语句引用tasks是将tasks从其他文件拉取过来。因为handlers也是tasks，所以你也可以使用include语句去引用handlers文件。

Playbook同样可以使用include引用其他playbook文件中的play。这时被引用的play会被插入到当前的playbook中，当前的playbook中就有了一个更长的的play列表

```yml
tasks:
  - include: tasks/foo.yml
  # 传递变量
  - include: wordpress.yml wp_user=timmy
  - { include: wordpress.yml, wp_user: timmy, ssh_keys: [ 'keys/one.txt', 'keys/two.txt' ] }
  - include: wordpress.yml
    vars:
        wp_user: timmy
        some_list_variable:
          - alpha
          - beta
          - gamma
  
handlers:
  - include: handlers/handlers.yml
```

Include 语句也可用来将一个 playbook 文件导入另一个 playbook 文件。这种方式允许你定义一个 顶层的 playbook，这个顶层 playbook 由其他 playbook 所组成。

```yml
- name: this is a play at the top level of a file
  hosts: all
  remote_user: root

  tasks:

  - name: say hi
    tags: foo
    shell: echo "hi..."

- include: load_balancers.yml
- include: webservers.yml
- include: dbservers.yml
```

> 当你在 playbook 中引用其他 playbook 时，不能使用变量替换。

## 变量

```yml
---
- name: Hello World
  hosts: localhost

  tasks:
    - name: Hello World debug
    debug:
      msg: "Hello World"
```

上面可以输出一个 `Hello World`，但是如果我们想设置一些变量且输出，我们可以这样

```yml
---
- name: Hello World
  hosts: localhost

  vars:
    greeting: "hello from vars"

  tasks:
    - name: Hello World debug
    debug:
      msg: "{{ greeting }}"
```

我们可以定义类似字典和列表的变量

```yml
vars:
  greeting: "hello from vars"
  demo:
    a:
      - a: 1
      - b: 2
    b: test
```

如果我们想很好的规划变量，我们可以把变量放进单独文件里面，比如`vars/demo.yml`里，内容为

```yml
greeting: "hello from vars"
```

然后Playbooks里面写上

```yml
vars_files:
  - "vars/demo.yml"
```

我们可以定义多个变量文件，如果变量名相同，最下方的变量文件会覆盖之前的

## Host/组变量

上方 `Inventory` 设置的就是host级别的变量，如果一组服务器用户相同，我们一一设置起来非常麻烦，我们就可以设置组级别的变量

```
[all]
host1 http_port=80
host2 http_port=443

[all:vars]
ansible_user=root
ansible_password=ansible
```

> host变量级别大于组变量级别

同理，为了方便维护，我们可以把组变量等分开，再这个项目根目录下，我们这样创建文件夹

```
├── group_vars
│   └── all.yml
├── host_vars
│   └── host1.yml
└── host
```

将文件名对应正确的组或主机名即可。于是定义我们需要管理的主机可以变为

`hosts`

```
[all]
host1
host2
```

`host1.yml`

```yml
ansible_user=root
ansible_password=ansible
```

`host2.yml`

```yml
ansible_user=root
ansible_password=ansible
```

等等各种方式

## ansible.cfg

`ansible.cfg`在一个项目级别上定义配置

```conf
[default]
inventory = inventory/hosts
```

一般情况下，我们需要指定`inventory`文件，这样很麻烦，遵循一切皆代码的原则，我们可以把这些也弄成配置

于是就有了`ansible.cfg`文件，默认我们在执行`ansible-playbook`的时候，我们会按照一下顺序搜索`ansible.cfg`文件

* 当前目录下`ansible.cfg`
* 环境变量`ANSIBLE_CONFIG`
* 当前用户`home`下
* `/etc/ansible.cfg`

然后我们就可以直接运行

```bash
ansible-playbook main.yml
```

详细参见这里[Ansible配置文件](http://www.ansible.com.cn/docs/intro_configuration.html)

## 项目结构设计

```bash
.
├── inventory
│   ├── group_vars
│   │   └── all.yml
│   ├── host_vars
│   │   ├── host1.yml
│   │   └── host2.yml
│   └── host
├── ansible.cfg
└── main.yml
```

对于测试环境和生成环境，我们可以这样设置

```bash
.
├── inventory
│   ├── production
│   │   ├── group_vars
│   │   │   └── all.yml
│   │   ├── host_vars
│   │   │   ├── host1.yml
│   │   │   └── host2.yml
│   │   └── host
│   └── test
│       ├── group_vars
│       │   └── all.yml
│       ├── host_vars
│       │   ├── host1.yml
│       │   └── host2.yml
│       └── host
├── ansible.cfg
└── main.yml
```

目前流程: 写hosts -> 写hosts变量 -> 写playhooks -> 运行

## 模板

对于一些配置，我们可能针对不同情况需要不同的配置，就像渲染html页面一样，不过基本的框架是一样的,于是我们可以使用模板

```yml
- name: template
  template:
    src: templates/config.j2
    dest: /etc/file.conf
    owner: bin
    group: wheel
    mode: '0664'
```

而对于`config.j2`文件，采取和django一样的模板语法(jinja)

```j2
[default]

http_port = {{ http_port }}
```

## 执行条件

对于不同系统，我们可以有不同的安装指令，我们就需要对task进行条件设置

```yml
tasks:
  - name: "shut down Debian flavored systems"
    command: /sbin/shutdown -t now
    when: ansible_facts['os_family'] == "Debian"
```

还有条件引入。如果操作系统是CentOS，Ansible导入的第一个文件将是`vars/CentOS.yml`，紧接着是`/var/os_defaults.yml`,如果这个文件不存在.而且在列表中没有找到,就会报错. 在Debian最先查看的将是`vars/Debian.yml`而不是`vars/CentOS.yml`, 如果没找到,则寻找默认文件`vars/os_defaults.yml`

```yml
vars_files:
  - "vars/common.yml"
  - [ "vars/{{ ansible_os_family }}.yml", "vars/os_defaults.yml" ]
```

## 循环

对于某一些操作，可能要对不同值执行多次，所以需要用到循环

```yml
- name: add several users
  user:
    name: "{{ item.name }}"
    state: present
    groups: "{{ item.groups }}"
  loop:
    - { name: 'testuser1', groups: 'wheel' }
    - { name: 'testuser2', groups: 'root' }
- name: add several users
  user: name={{ item }} state=present groups=wheel
  with_items:
     - testuser1
     - testuser2
# 嵌套循环
- name: give users access to multiple databases
  mysql_user: name={{ item[0] }} priv={{ item[1] }}.*:ALL append_privs=yes password=foo
  with_nested:
    - [ 'alice', 'bob' ]
    - [ 'clientdb', 'employeedb', 'providerdb' ]
```

字典循环

```yml
users:
  alice:
    name: Alice Appleworth
    telephone: 123-456-7890
  bob:
    name: Bob Bananarama
    telephone: 987-654-3210
---
- name: Print phone records
  debug: msg="User {{ item.key }} is {{ item.value.name }} ({{ item.value.telephone }})"
  with_dict: "{{users}}"
```

Do-Until循环

```yml
- action: shell /usr/bin/foo
  register: result
  until: result.stdout.find("all systems go") != -1
  retries: 5
  delay: 10
```

## Block

对于一些指令，可能会导致执行失败，如果失败了，我们希望进行一些补救或者处理，类似python里面的 try except finally.

同时，可以定义一个task块，对于这一部分task块，同一使用某些条件或者权限等等

比如我们接下来一系列操作都需要sudo，或者只能在ubuntu上执行

```yml
tasks:
  - name: Install, configure, and start Apache
    block:
      - name: install httpd and memcached
        yum:
          name:
          - httpd
          - memcached
          state: present

      - name: apply the foo config template
        template:
          src: templates/src.j2
          dest: /etc/foo.conf
    when: ansible_facts['distribution'] == 'CentOS'
    become: true
```

而对于错误处理

```yml
tasks:
- name: Handle the error
  block:
    - debug:
        msg: 'I execute normally'
    - name: i force a failure
      command: /bin/false
    - debug:
        msg: 'I never execute, due to the above task failing, :-('
  rescue:
    - debug:
        msg: 'I caught an error, can do stuff here to fix it, :-)'
  always:
    - debug:
        msg: "This always executes, :-)"
```

## 角色

playbook里面有一系列task，很多都可以复用，而且把每个步骤的task分开管理也是很方便的，所以就有了role

我们在根目录下创建一个roles文件夹，然后再创建一个文件夹，名字随意，即为一个role，这里记为demo

```bash
.
└── demo
    ├── defaults
    │   └── main.yml
    ├── files
    ├── handlers
    │   └── main.yml
    ├── meta
    │   └── main.yml
    ├── README.md
    ├── tasks
    │   └── main.yml
    ├── templates
    ├── tests
    │   ├── inventory
    │   └── test.yml
    └── vars
        └── main.yml
```

下面的每一个子文件夹都对应着一些配置

* tasks: 任务
* defaults: 基本的常量变量
* vars: 这个任务专用变量
* templates: 模板文件
* files: 要传输的文件
* handlers: tasks的触发处理器

我们可以在主文件里面引用role

* 如果`roles/x/tasks/main.yml`存在, 其中列出的`tasks`将被添加到 play 中
* 如果`roles/x/handlers/main.yml`存在, 其中列出的`handlers`将被添加到 play 中
* 如果`roles/x/vars/main.yml`存在, 其中列出的`variables`将被添加到 play 中
* 如果`roles/x/meta/main.yml`存在, 其中列出的`角色依赖`将被添加到 roles 列表中 (1.3 and later)
* 所有`copy tasks`可以引用`roles/x/files/`中的文件，不需要指明文件的路径。
* 所有`script tasks`可以引用`roles/x/files/`中的脚本，不需要指明文件的路径。
* 所有`template tasks`可以引用`roles/x/templates/`中的文件，不需要指明文件的路径。
* 所有`include tasks`可以引用`roles/x/tasks/`中的文件，不需要指明文件的路径。

如果 roles 目录下有文件不存在，这些文件将被忽略。比如 roles 目录下面缺少了 `vars/` 目录，这也没关系。

```yml
---
- hosts: webservers
  roles:
     - common
     - webservers
```

或者其他语法

```yml
---
- hosts: webservers
  roles:
    - common
    - role: foo_app_instance
      vars:
        dir: '/opt/a'
        app_port: 5000
    - role: foo_app_instance
      vars:
        dir: '/opt/b'
        app_port: 5001
---
- hosts: webservers
  tasks:
    - import_role:
        name: example
    - include_role:
        name: example
---
- hosts: webservers
  roles:
    - role: '/path/to/my/roles/common'
---
- hosts: webservers
  tasks:
    - include_role:
        name: foo_app_instance
      vars:
        dir: '/opt/a'
        app_port: 5000
```

如果你希望定义一些 tasks，让它们在 roles 之前以及之后执行，你可以这样做

```yml
- hosts: webservers

  pre_tasks:
    - shell: echo 'hello'

  roles:
    - { role: some_role }

  tasks:
    - shell: echo 'still busy'

  post_tasks:
    - shell: echo 'goodbye'
```

handlers:

对于某一些操作，可能我们希望它执行过一次后就不要再执行了，我们就可以使用handlers。

对于每一个tasks，它可以是changed或者是ok的状态（还有其他状态），如果是ok则表示没有实际运行

因为它已经运行过了，比如安装过git了

```yml
- hosts: webservers
  tasks:
    - name: clone
    git:
      repo: '{{ repo_url }}'
      dest: ~/demo
    notify: test handlers
```

然后在`handles/main.yml`里面

```yml
- name: test handlers
  debug:
    msg: "Message from handles"
```

这样test handlers只会在clone是changed的时候运行(handler的本质还是一个task)

## 异步操作和轮询

默认情况下playbook中的任务执行时会一直保持连接,直到该任务在每个节点都执行完毕.有时这是不必要的,比如有些操作运行时间比SSH超时时间还要长.

有些任务可能需要执行很长时间，但是又不需要一直看着他，就可以使用异步模式

```yml
tasks:
- name: simulate long running op (15 sec), wait for up to 45 sec, poll every 5 sec
  command: /bin/sleep 15
  async: 45
  poll: 5
```

> 对于要求排它锁的操作,如果你需要在其之后对同一资源执行其它任务,那么你不应该对该操作使用”启动并忽略”.比如yum事务.
# Module

Module是基本功能的单位，这里介绍一些常见的模块

## Debug

https://docs.ansible.com/ansible/latest/modules/debug_module.html#debug-module

```yml
- name: print variable
  debug:
   msg: "Hello World"
```

## 复制文件

```yml
- name: Copy file with owner and permissions
  copy:
    src: /srv/myfiles/foo.conf
    dest: /etc/foo.conf
    owner: foo
    group: foo
    mode: '0644'

- name: Copy file with owner and permission, using symbolic representation
  copy:
    src: /srv/myfiles/foo.conf
    dest: /etc/foo.conf
    owner: foo
    group: foo
    mode: u=rw,g=r,o=r

- name: Another symbolic mode example, adding some permissions and removing others
  copy:
    src: /srv/myfiles/foo.conf
    dest: /etc/foo.conf
    owner: foo
    group: foo
    mode: u+rw,g-wx,o-rwx

- name: Copy a new "ntp.conf file into place, backing up the original if it differs from the copied version
  copy:
    src: /mine/ntp.conf
    dest: /etc/ntp.conf
    owner: root
    group: root
    mode: '0644'
    backup: yes

- name: Copy a new "sudoers" file into place, after passing validation with visudo
  copy:
    src: /mine/sudoers
    dest: /etc/sudoers
    validate: /usr/sbin/visudo -csf %s

- name: Copy a "sudoers" file on the remote machine for editing
  copy:
    src: /etc/sudoers
    dest: /etc/sudoers.edit
    remote_src: yes
    validate: /usr/sbin/visudo -csf %s

- name: Copy using inline content
  copy:
    content: '# This file was moved to /etc/other.conf'
    dest: /etc/mine.conf

- name: If follow=yes, /path/to/file will be overwritten by contents of foo.conf
  copy:
    src: /etc/foo.conf
    dest: /path/to/link  # link to /path/to/file
    follow: yes

- name: If follow=no, /path/to/link will become a file and be overwritten by contents of foo.conf
  copy:
    src: /etc/foo.conf
    dest: /path/to/link  # link to /path/to/file
    follow: no
```

## gather_facts

收集机器的相关的基本信息，默认是开启的，并且可以在变量中直接引用gather_facts里面的变量

```yml
- name: test
  hosts: all
  gather_facts: no

  tasks:
    - name: print facts
      debug:
        msg: "{{ ansible_deta_time }}"
```

## yum

https://docs.ansible.com/ansible/latest/modules/yum_module.html#yum-module

```yml
- name: install the latest version of Apache
  yum:
    name: httpd
    state: latest

- name: ensure a list of packages installed
  yum:
    name: "{{ packages }}"
  vars:
    packages:
    - httpd
    - httpd-tools

- name: remove the Apache package
  yum:
    name: httpd
    state: absent

- name: install the latest version of Apache from the testing repo
  yum:
    name: httpd
    enablerepo: testing
    state: present

- name: install one specific version of Apache
  yum:
    name: httpd-2.2.29-1.4.amzn1
    state: present

- name: upgrade all packages
  yum:
    name: '*'
    state: latest

- name: upgrade all packages, excluding kernel & foo related packages
  yum:
    name: '*'
    state: latest
    exclude: kernel*,foo*

- name: install the nginx rpm from a remote repo
  yum:
    name: http://nginx.org/packages/centos/6/noarch/RPMS/nginx-release-centos-6-0.el6.ngx.noarch.rpm
    state: present

- name: install nginx rpm from a local file
  yum:
    name: /usr/local/src/nginx-release-centos-6-0.el6.ngx.noarch.rpm
    state: present

- name: install the 'Development tools' package group
  yum:
    name: "@Development tools"
    state: present

- name: install the 'Gnome desktop' environment group
  yum:
    name: "@^gnome-desktop-environment"
    state: present

- name: List ansible packages and register result to print with debug later.
  yum:
    list: ansible
  register: result

- name: Install package with multiple repos enabled
  yum:
    name: sos
    enablerepo: "epel,ol7_latest"

- name: Install package with multiple repos disabled
  yum:
    name: sos
    disablerepo: "epel,ol7_latest"

- name: Install a list of packages
  yum:
    name:
      - nginx
      - postgresql
      - postgresql-server
    state: present

- name: Download the nginx package but do not install it
  yum:
    name:
      - nginx
    state: latest
    download_only: true
```

## apt

https://docs.ansible.com/ansible/latest/modules/apt_module.html#apt-module

```yml
- name: Install apache httpd  (state=present is optional)
  apt:
    name: apache2
    state: present

- name: Update repositories cache and install "foo" package
  apt:
    name: foo
    update_cache: yes

- name: Remove "foo" package
  apt:
    name: foo
    state: absent

- name: Install the package "foo"
  apt:
    name: foo

- name: Install a list of packages
  apt:
    pkg:
    - foo
    - foo-tools

- name: Install the version '1.00' of package "foo"
  apt:
    name: foo=1.00

- name: Update the repository cache and update package "nginx" to latest version using default release squeeze-backport
  apt:
    name: nginx
    state: latest
    default_release: squeeze-backports
    update_cache: yes

- name: Install latest version of "openjdk-6-jdk" ignoring "install-recommends"
  apt:
    name: openjdk-6-jdk
    state: latest
    install_recommends: no

- name: Upgrade all packages to the latest version
  apt:
    name: "*"
    state: latest

- name: Update all packages to the latest version
  apt:
    upgrade: dist

- name: Run the equivalent of "apt-get update" as a separate step
  apt:
    update_cache: yes

- name: Only run "update_cache=yes" if the last one is more than 3600 seconds ago
  apt:
    update_cache: yes
    cache_valid_time: 3600

- name: Pass options to dpkg on run
  apt:
    upgrade: dist
    update_cache: yes
    dpkg_options: 'force-confold,force-confdef'

- name: Install a .deb package
  apt:
    deb: /tmp/mypackage.deb

- name: Install the build dependencies for package "foo"
  apt:
    pkg: foo
    state: build-dep

- name: Install a .deb package from the internet.
  apt:
    deb: https://example.com/python-ppq_0.1-1_all.deb

- name: Remove useless packages from the cache
  apt:
    autoclean: yes

- name: Remove dependencies that are no longer required
  apt:
    autoremove: yes
```

## pip

https://docs.ansible.com/ansible/latest/modules/pip_module.html#pip-module

```yml
# Install (Bottle) python package.
- pip:
    name: bottle

# Install (Bottle) python package on version 0.11.
- pip:
    name: bottle==0.11

# Install (bottle) python package with version specifiers
- pip:
    name: bottle>0.10,<0.20,!=0.11

# Install multi python packages with version specifiers
- pip:
    name:
      - django>1.11.0,<1.12.0
      - bottle>0.10,<0.20,!=0.11

# Install python package using a proxy - it doesn't use the standard environment variables, please use the CAPITALIZED ones below
- pip:
    name: six
  environment:
    HTTP_PROXY: '127.0.0.1:8080'
    HTTPS_PROXY: '127.0.0.1:8080'

# Install (MyApp) using one of the remote protocols (bzr+,hg+,git+,svn+). You do not have to supply '-e' option in extra_args.
- pip:
    name: svn+http://myrepo/svn/MyApp#egg=MyApp

# Install MyApp using one of the remote protocols (bzr+,hg+,git+).
- pip:
    name: git+http://myrepo/app/MyApp

# Install (MyApp) from local tarball
- pip:
    name: file:///path/to/MyApp.tar.gz

# Install (Bottle) into the specified (virtualenv), inheriting none of the globally installed modules
- pip:
    name: bottle
    virtualenv: /my_app/venv

# Install (Bottle) into the specified (virtualenv), inheriting globally installed modules
- pip:
    name: bottle
    virtualenv: /my_app/venv
    virtualenv_site_packages: yes

# Install (Bottle) into the specified (virtualenv), using Python 2.7
- pip:
    name: bottle
    virtualenv: /my_app/venv
    virtualenv_command: virtualenv-2.7

# Install (Bottle) within a user home directory.
- pip:
    name: bottle
    extra_args: --user

# Install specified python requirements.
- pip:
    requirements: /my_app/requirements.txt

# Install specified python requirements in indicated (virtualenv).
- pip:
    requirements: /my_app/requirements.txt
    virtualenv: /my_app/venv

# Install specified python requirements and custom Index URL.
- pip:
    requirements: /my_app/requirements.txt
    extra_args: -i https://example.com/pypi/simple

# Install specified python requirements offline from a local directory with downloaded packages.
- pip:
    requirements: /my_app/requirements.txt
    extra_args: "--no-index --find-links=file:///my_downloaded_packages_dir"

# Install (Bottle) for Python 3.3 specifically,using the 'pip3.3' executable.
- pip:
    name: bottle
    executable: pip3.3

# Install (Bottle), forcing reinstallation if it's already installed
- pip:
    name: bottle
    state: forcereinstall

# Install (Bottle) while ensuring the umask is 0022 (to ensure other users can use it)
- pip:
    name: bottle
    umask: "0022"
  become: True
```

## get_url

https://docs.ansible.com/ansible/latest/modules/get_url_module.html#get-url-module

```yml
- name: Download foo.conf
  get_url:
    url: http://example.com/path/file.conf
    dest: /etc/foo.conf
    mode: '0440'

- name: Download file and force basic auth
  get_url:
    url: http://example.com/path/file.conf
    dest: /etc/foo.conf
    force_basic_auth: yes

- name: Download file with custom HTTP headers
  get_url:
    url: http://example.com/path/file.conf
    dest: /etc/foo.conf
    headers:
      key1: one
      key2: two

- name: Download file with check (sha256)
  get_url:
    url: http://example.com/path/file.conf
    dest: /etc/foo.conf
    checksum: sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c

- name: Download file with check (md5)
  get_url:
    url: http://example.com/path/file.conf
    dest: /etc/foo.conf
    checksum: md5:66dffb5228a211e61d6d7ef4a86f5758

- name: Download file with checksum url (sha256)
  get_url:
    url: http://example.com/path/file.conf
    dest: /etc/foo.conf
    checksum: sha256:http://example.com/path/sha256sum.txt

- name: Download file from a file path
  get_url:
    url: file:///tmp/afile.txt
    dest: /tmp/afilecopy.txt

- name: < Fetch file that requires authentication.
        username/password only available since 2.8, in older versions you need to use url_username/url_password
  get_url:
    url: http://example.com/path/file.conf
    dest: /etc/foo.conf
    username: bar
    password: '{{ mysecret }}'
```
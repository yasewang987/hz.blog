module.exports = {
    title: 'yasewang故事会',
    description: 'yasewang story',
    configureWebpack: {
        resolve: {
            alias: {
            '@img': 'img/'
            }
        }
    },
    base: '/',
    head: [
        ['link', { rel: 'icon', href: '/avatar.png' }],
        ['link', { rel: 'manifest', href: '/manifest.webmanifest'}]
    ],
    serviceWorker: true,
    themeConfig: {
        nav: [
            { text: '首页', link: '/' },
            { 
                text: 'Code', items: [
                    {
                        text: 'Dotnet',
                        items: [
                            { text: '常用功能', link: '/code/dotnet/common/' },
                            { text: '其他', link: '/code/dotnet/tools/' }
                        ]
                    },
                    {
                        text: 'Java',
                        items: [
                            { text: '基础知识', link: '/code/java/basics/' },
                            { text: 'Spring', link: '/code/java/spring/' },
                            { text: '其他', link: '/code/java/tools/' }
                        ]
                    },
                    {
                        text: 'Go',
                        items: [
                            { text: 'Gin', link: '/code/go/gin/' },
                            { text: 'Go常用功能', link: '/code/go/common/' },
                            { text: '其他', link: '/code/go/other/' }
                        ]
                    },
                    {
                        text: 'Web',
                        items: [
                            { text: 'Npm', link: '/code/web/npm/' },
                            { text: 'TypeScript', link: '/code/web/ts/' },
                            { text: 'Vue', link: '/code/web/vue/' },
                            { text: 'CSS', link: '/code/web/css/' }
                        ]
                    }
                ]
            },
            {
                text: 'MicroServices',
                items: [
                    { text: 'Consul', link: '/microservices/consul/' },
                    { text: 'Ocelot', link: '/microservices/ocelot/' },
                    { text: 'ELK', link: '/microservices/elk/' },
                    { text: 'Identity', link: '/microservices/identity/' },
                    { text: 'Skywalking', link: '/microservices/skywalking/' },
                    { text: 'MQ', link: '/microservices/mq/' },
                    { text: 'Dapr', link: '/microservices/dapr/' },
                    { text: '随笔', link: '/microservices/other/' }
                ]
            },
            {
                text: 'DevOps',
                items: [
                    { text: 'K8s-其他', link: '/devops/k8s/k8s-normal/' },
                    { text: 'K8s-从0开始系列', link: '/devops/k8s/k8s-learning/' },
                    { text: 'Docker', link: '/devops/docker/' },
                    { text: 'Nginx', link: '/devops/nginx/' },
                    { text: 'Jenkins', link: '/devops/jenkins/' },
                    { text: 'GitLab', link: '/devops/gitlab/' },
                    { text: 'Prometheus', link: '/devops/prometheus/' },
                    { text: 'Ansible', link: '/devops/ansible/' },
                    { text: '其他', link: '/devops/other/' }
                ]
            },
            {
                text: 'AI',
                items: [
                    { text: 'AI部署资料', link: '/ai/deploy/' }
                ]
            },
            {
                text: 'SQL',
                items: [
                    { text: 'MSSQL', link: '/sql/mssql/' },
                    { text: 'MYSQL', link: '/sql/mysql/' },
                    { text: 'MongoDB', link: '/sql/mongo/'}
                ]
            },
            { 
                text: '测试',
                items: [
                    { text: 'Jmeter', link: '/test/jmeter/' }
                ]
            },
            {
                text: 'Other',
                items: [
                    { text: '设计模式', link: '/other/designpattern/' },
                    { text: 'Git', link: '/other/git/' },
                    { text: 'Linux', link: '/other/linux/' },
                    { text: '实用工具', link: '/other/tools/' },
                    { text: 'Mac', link: '/other/mac/' },
                    { text: 'Cloud', link: '/other/cloud/'},
                    { text: '读书', link: '/other/book/'},
                    { text: '国产适配', link: '/other/cn/' }
                ]
            }
        ],
        sidebar: {
            '/code/dotnet/common/': [
                'code',
                'common',
                'config',
                'email',
                'middleware',
                'polly',
                'reflection',
                'signalr',
                'swagger',
                'wcf',
                'error',
                'builder-fac-provider',
                'webapimodel',
                'unittest'
            ],
            '/code/dotnet/tools/': [
                'install',
                'jexus',
                'nuget',
                'openapi',
                'template'
            ],
            '/code/java/basics/': [
                'volatile',
                'clone',
                'concurrence'
            ],
            '/code/java/spring/': [],
            '/code/java/tools/' : [
                'install'
            ],
            '/code/go/gin/': [
                'gin'
            ],
            '/code/go/common/': [
                'http',
                'mongodb',
                'lock',
                'package',
                'godoc',
                'rw',
                'filecopy',
                'readargs',
                'rpc',
                'mysql'
            ],
            '/code/go/other/': [
                'install',
                'docker',
                'problem',
                'cmd',
                'version'
            ],
            '/code/web/npm/': [
                'base',
                'ci',
		'install'
            ],
            '/code/web/ts/': [
                'base',
                'install'
            ],
            '/code/web/vue/': [
                'vscode'
            ],
            '/code/web/css/': [
                'resources',
                'animation'
            ],
            '/microservices/consul/': [
                'base',
                'cmd',
                'config',
                'docker'
            ],
            '/microservices/elk/': [
                'install',
                'install-one'
            ],
            '/microservices/identity/': [
                'oauth2-info',
                'oauth2-code',
                'oauth2-implicit',
                'oauth2-password',
                'oauth2-client',
                'oauth2-refresh',
                'idnetityserver4-client',
                'jwt'
            ],
            '/microservices/mq/': [
                'rabbitmq-install'
            ],
            '/microservices/dapr/': [
                'info',
                'install',
                'component',
                'invoke',
                'state',
                'pubsub',
                'bindings',
                'actor',
                'observability',
                'security',
                'middleware'
            ],
            '/microservices/ocelot/': [
                'middleware',
                'base'
            ],
            '/microservices/skywalking/': [
                'base'
            ],
            '/microservices/other/': [
                'hash',
                'note',
                'cap-base',
                'idgenerater',
                'ddd'
            ],
            '/test/jmeter/': [
                'install-docker',
            ],
            '/devops/docker/': [
                'cmd',
                'problem',
                'compose-netcore',
                'install',
                'dockerfiles',
                'dockerfilebest',
                'buildx',
                'network',
                'update'
            ],
            '/devops/gitlab/': [
                'gitlab-install',
                'runner',
                'netcore',
                'yml'
            ],
            '/devops/nginx/': [
                'nginx-docker',
                'nginx',
                'nginxhotreload',
                'problem'
            ],
            '/devops/prometheus/': [
                'prometheus',
                'node-exporter',
                'gpu-exporter',
                'custom-exporter',
                'wechat-alert'
            ],
            '/devops/jenkins/': [
                'dotnet',
                'install'
            ],
            '/devops/ansible/': [
                'info',
                'install',
                'module'
            ],
            '/devops/k8s/k8s-normal/': [
                'k8s-yamls',
                'k8s-cmd',
                'k8s-problem',
                'k8s-netcore',
                'k8s-multicluster'
            ],
            '/devops/k8s/k8s-learning/': [
                'k8s-base',
                'k8s-install-mini',
                'k8s-install-kind',
                'k8s-install-microk8s',
                'k8s-install-adm',
                'k8s-deployment',
                'k8s-daemonset',
                'k8s-job',
                'k8s-service',
                'k8s-rollingupdate',
                'k8s-healthcheck',
                'k8s-volume',
                'k8s-secret-configmap',
                'k8s-network',
                'k8s-ingress',
                'k8s-helm'
            ],
            '/devops/other/': [
                'podman',
                'nexus',
                'elasticsearch',
                'minio',
                'mysql',
                'redis',
                'qemu',
                'nextterminal',
                'jumpserver'
            ],
            '/sql/mssql/': [
                'usesul'
            ],
            '/sql/mysql/': [
                'install',
                'gh-ost',
                'announcements',
                'explain'
            ],
            '/sql/mongo/': [
                'install'
            ],
            '/other/designpattern/': [
                'factory',
                'abstractfactory',
                'singleton',
                'builder',
                'prototype',
                'facade',
                'observer'
            ],
            '/other/git/': [
                'history',
                'cmd',
                'git-hook',
                'gl-hook',
                'problem'
            ],
            '/other/linux/': [
                'cmd',
                'firewall',
                'info',
                'install',
                'systemd',
                'vim',
                'screen',
                'ubuntu',
                'manjaro',
                'ddns',
                'crontab',
                'curl',
                'awk',
                'sed',
                'rsync',
                'rpm',
                'shell'
            ],
            '/other/mac/': [
                'install',
                'disk'
            ],
            '/other/tools/': [
                'chrome',
                'win-cmd',
                'win-tools',
                'vscode',
                'resource',
                'zentao',
                'devtools'
            ],
            '/other/cloud/': [
                'proxmox',
                'theia',
                'cloudbeaver'
            ],
            '/other/book/': [
                'classical1',
                'regular'
            ],
            '/other/cn/': [
                'qemu',
                'es',
                'jdk',
                'mariadb',
                'minio',
                'nginx',
                'python',
                'redis'
            ],
            '/ai/deploy/': [
                'problem',
                'nvidia',
                'torchserve',
                'tfx',
                'tf',
                'python'
            ]
        },
        sidebarDepth: 2
    }
}

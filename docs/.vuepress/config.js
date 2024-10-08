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
                            { text: '其他', link: '/code/java/tools/' },
                        ]
                    },
                    {
                        text: 'Go',
                        items: [
                            { text: 'Go基础库', link: '/code/go/common/' },
                            { text: '其他', link: '/code/go/other/' },
                            { text: 'Demos', link: '/code/go/demo/' }
                        ]
                    },
                    {
                        text: 'Web',
                        items: [
                            { text: 'Npm', link: '/code/web/npm/' },
                            { text: 'TypeScript', link: '/code/web/ts/' },
                            { text: 'Vue', link: '/code/web/vue/' },
                            { text: 'CSS', link: '/code/web/css/' },
                            { text: 'Other', link: '/code/web/other/' }
                        ]
                    },
                    { text: 'Python', link: '/code/python/',
                      items: [
                        { text: '基础资料', link: '/code/python/base/'},
                        { text: 'Paddle系列', link: '/code/python/paddle/' },
                        { text: 'AI部署资料', link: '/code/python/deploy/' },
                        { text: 'AI资料', link: '/code/python/ai/' }
                      ]
                    }
                ]
            },
            {
                text: 'MicroServices',
                items: [
                    { text: '注册配置中心', link: '/microservices/register_config/' },
                    { text: '网关', link: '/microservices/ocelot/' },
                    { text: '日志中心', link: '/microservices/elk/' },
                    { text: '认证授权', link: '/microservices/identity/' },
                    { text: '链路跟踪', link: '/microservices/skywalking/' },
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
                    { text: 'Redis', link: '/devops/redis/' },
                    { text: '其他', link: '/devops/other/' }
                ]
            },
            {
                text: 'SQL',
                items: [
                    { text: 'MSSQL', link: '/sql/mssql/' },
                    { text: 'MYSQL', link: '/sql/mysql/' },
                    { text: 'MongoDB', link: '/sql/mongo/'},
                    { text: 'Postgresql', link: '/sql/postgresql/' }
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
                'install',
                'other',
                'problem'
            ],
            '/code/go/common/': [
                'base',
                'http',
                'lock',
                'rw',
                'file',
                'rpc',
                'scanf',
                'time',
                'io',
                'strings',
                'test',
                'channel',
                'select',
                'context',
                'generic',
                'error',
                'tags',
                'sync',
                'goroutine'
            ],
            '/code/go/other/': [
                'install',
                'docker',
                'problem',
                'cmd',
                'version',
                'common',
                'best',
                'package',
                'gpm'
            ],
            '/code/go/demo/': [
                'design',
                'loadbalance',
                'serviceRegister',
                'myrpc',
                'gin',
                'di',
                'mongodb',
                'sql',
                'orm',
                'server',
                'ssh',
                'conf',
                'redis',
                'encrypt',
                'viper',
                'spider',
                'taskschedule',
                'execCmd',
                'terminal',
                'websocket',
                'sse',
                'goweb',
                'file',
                'devops'
            ],
            '/code/web/npm/': [
                'base',
                'ci',
		        'install',
                'problem'
            ],
            '/code/web/ts/': [
                'base',
                'install',
                'promise',
                'websocket'
            ],
            '/code/web/vue/': [
                'vueui',
                'vscode',
                'vue3',
                'vitevue',
                'setupscript',
                'vueuse',
                'dynamic'
            ],
            '/code/web/css/': [
                'flex',
                'resources',
                'animation',
                'common',
                'tailwindcss'
            ],
            '/code/web/other/': [
                'qiankun',
                'microapp',
                'electron',
                'tauri',
                'wails',
                'flutter',
                'serve',
                'config',
                'chromeextensions',
                'element',
                'wps',
                'demos'
            ],
            '/code/python/base/': [
                'base',
                'libdemos',
                'source',
                'devops',
                'problem',
                'install',
                'tools'
            ],
            '/code/python/deploy/': [
                'nvidia',
                'torchserve',
                'tf'
            ],
            '/code/python/paddle/': [
                'paddle',
                'paddleocr',
                'paddlespeech',
                'paddleserving'
            ],
            '/code/python/ai/': [
                'install',
                'base',
                'tensor',
                'nlp',
                'tools',
                'ai1',
                'ai2',
                'ai-vector',
                'llama-factory',
                'prompt',
                'langchain',
                'agent',
                'ollama'
            ],
            '/microservices/register_config/': [
                'consul',
                'etcd'
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
                'ddd',
                'architecture',
                'abac'
            ],
            '/test/jmeter/': [
                'install-docker',
            ],
            '/devops/docker/': [
                'cmd',
                'problem',
                'install',
                'dockerfiles',
                'dockerfilebest',
                'buildx',
                'network',
                'update',
                'swarm',
                'composefile',
                'compose-netcore',
                'portainer'
            ],
            '/devops/gitlab/': [
                'gitlab-install',
                'runner',
                'netcore',
                'yml'
            ],
            '/devops/nginx/': [
                'base',
                'nginx',
                'nginxhotreload',
                'problem',
                'test',
                'nginxbest'
            ],
            '/devops/prometheus/': [
                'prometheus',
                'node-exporter',
                'gpu-exporter',
                'mysqld-exporter',
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
                'k8s-base',
                'k8s-problem',
                'k8s-netcore',
                'k8s-manage'
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
            '/devops/redis/': [
                'install',
                'base',
                'cmd',
                'sync',
                'problem',
                'mq',
                'redissearch'
            ],
            '/devops/other/': [
                'podman',
                'nexus',
                'elasticsearch',
                'minio',
                'nextterminal',
                'jumpserver',
                'containerd',
                'zentao',
                'shells',
                'frp',
                'webfirewall',
                'ssl'
            ],
            '/sql/mssql/': [
                'usesul',
                'sqlite'
            ],
            '/sql/mysql/': [
                'cmd',
                'install',
                'gh-ost',
                'announcements',
                'explain',
                'pxb',
                'recover',
                'problem'
            ],
            '/sql/mongo/': [
                'install'
            ],
            '/sql/postgresql/': [
                'install',
                'best'
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
                'problem',
                'submodule',
                'restore'
            ],
            '/other/linux/': [
                'cmd',
                'problem',
                'attack',
                'info',
                'firewall',
                'systemd',
                'vim',
                'screen',
                'crontab',
                'curl',
                'awk',
                'sed',
                'rsync',
                'unison',
                'rpm',
                'shell',
                'manjaro',
                'ddns'
            ],
            '/other/mac/': [
                'install',
                'disk'
            ],
            '/other/tools/': [
                'chrome',
                'win-tools',
                'vscode',
                'resource',
                'devtools',
                'plantuml',
                'vnc',
                'vpn'
            ],
            '/other/cloud/': [
                'proxmox',
                'theia',
                'codeserver',
                'cloudbeaver'
            ],
            '/other/book/': [
                'classical1',
                'regular',
                'version',
                'child'
            ],
            '/other/cn/': [
                'gcc',
                'qemu',
                'es',
                'jdk',
                'mariadb',
                'minio',
                'nginx',
                'python',
                'redis',
                'openssh',
                'dm',
                'milvus',
                'hanwuji',
                'shengteng',
                'shuguang',
                'other',
                'problem',
                'guomi',
                'dengbao'
            ],
        },
        sidebarDepth: 2
    }
}

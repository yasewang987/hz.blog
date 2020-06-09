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
                            { text: '常用功能', link: '/code/java/common/' },
                            { text: 'Spring', link: '/code/java/spring/' },
                            { text: '其他', link: '/code/java/tools/' }
                        ]
                    },
                    {
                        text: 'Go',
                        items: [
                            { text: '其他', link: '/code/go/tools/' }
                        ]
                    },
                    {
                        text: 'Web',
                        items: [
                            { text: 'Npm', link: '/code/web/npm/' },
                            { text: 'TypeScript', link: '/code/web/ts/' },
                            { text: 'Vue', link: '/code/web/vue/' }
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
                    { text: '随笔', link: '/microservices/other/' }
                ]
            },
            { 
                text: '测试',
                items: [
                    { text: 'Jmeter', link: '/test/jmeter/' }
                ]
            },
            {
                text: 'DevOps',
                items: [
                    { text: 'K8s-其他', link: '/devops/k8s/k8s-normal/' },
                    { text: 'K8s-从0开始系列', link: '/devops/k8s/k8s-learning/' },
                    { text: 'Docker', link: '/devops/docker/' },
                    { text: 'Jenkins', link: '/devops/jenkins/' },
                    { text: 'GitLab-Runner', link: '/devops/gitlabrunner/' },
                    { text: '脚本', link: '/devops/shell/' }
                ]
            },
            {
                text: 'SQL',
                items: [
                    { text: 'MSSQL', link: '/sql/mssql/' },
                    { text: 'MYSQL', link: '/sql/mysql/' }
                ]
            },
            {
                text: 'Other',
                items: [
                    { text: 'Git', link: '/other/git/' },
                    { text: 'Linux', link: '/other/linux/' },
                    { text: '实用工具', link: '/other/tools/' },
                    { text: 'Mac', link: '/other/mac/' },
                    { text: 'Cloud', link: '/other/cloud/'}
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
                'error'
            ],
            '/code/dotnet/tools/': [
                'install',
                'jexus',
                'nuget',
                'openapi',
                'template'
            ],
            '/code/java/common/': [],
            '/code/java/spring/': [],
            '/code/java/tools/' : [
                'install'
            ],
            '/code/go/tools/': [
                'install'
            ],
            '/code/web/npm/': [
                'base',
                'ci'
            ],
            '/code/web/ts/': [
                'base',
                'install'
            ],
            '/code/web/vue/': [
                'vscode'
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
                'client',
            ],
            '/microservices/mq/': [
                'rabbitmq-install'
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
                'note'
            ],
            '/test/jmeter/': [
                'install-docker',
            ],
            '/devops/docker/': [
                'cmd',
                'compose-netcore',
                'install',
                'dockerfiles'
            ],
            '/devops/gitlabrunner/': [
                'base',
                'netcore',
                'yml'
            ],
            '/devops/jenkins/': [
                'dotnet',
                'install'
            ],
            '/devops/k8s/k8s-normal/': [
                'k8s-yamls',
                'k8s-cmd',
                'k8s-problem',
                'k8s-netcore'
            ],
            '/devops/k8s/k8s-learning/': [
                'k8s-base',
                'k8s-install-mini',
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
            '/devops/shell/': [
                'sh-common.md',
                'sh-gitbranch.md'
            ],
            '/sql/mssql/': [
                'usesul'
            ],
            '/sql/mysql/': [
                'install',
                'gh-ost'
            ],
            '/other/git/': [
                'history',
                'cmd',
                'git-hook',
                'gl-hook',
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
                'manjaro'
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
                'resource'
            ],
            '/other/cloud/': [
                'vmware-vsphere',
                'proxmox'
            ]
        },
        sidebarDepth: 2
    }
}
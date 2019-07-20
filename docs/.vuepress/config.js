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
                text: 'Dotnet',
                items: [
                    { text: '常用功能', link: '/dotnet/common/' },
                    { text: '其他', link: '/dotnet/tools/' }
                ]
            },
            {
                text: 'Java',
                items: [
                    { text: '常用功能', link: '/java/common/' },
                    { text: 'Spring', link: '/java/spring/' },
                    { text: '其他', link: '/java/tools/' }
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
                    { text: 'MQ', link: '/microservices/mq/' }
                ]
            },
            {
                text: 'Web',
                items: [
                    { text: 'Npm', link: '/web/npm/' },
                    { text: 'TypeScript', link: '/web/ts/' },
                    { text: 'Vue', link: '/web/vue/' }
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
                    { text: 'K8s', link: '/devops/k8s/' },
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
                    { text: '实用工具', link: '/other/tools/' }
                ]
            }
        ],
        sidebar: {
            '/dotnet/common/': [
                'code',
                'common',
                'config',
                'email',
                'middleware',
                'polly',
                'reflection',
                'signalr',
                'swagger',
                'wcf'
            ],
            '/dotnet/tools/': [
                'install',
                'jexus',
                'nuget'
            ],
            '/java/common/': [],
            '/java/spring/': [],
            '/java/tools/' : [
                'install'
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
            '/web/npm/': [
                'base',
                'ci'
            ],
            '/web/ts/': [
                'base',
                'install'
            ],
            '/web/vue/': [
                'vscode'
            ],
            '/test/jmeter/': [
                'install-docker',
            ],
            '/devops/docker/': [
                'cmd',
                'compose-netcore',
                'install'
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
            '/devops/k8s/': [
                'k8s-cmd',
                'k8s-install',
                'k8s-problem',
                'k8s-netcore'
            ],
            '/devops/shell/': [
                'sh-common.md',
                'sh-gitbranch.md'
            ],
            '/sql/mssql/': [
                'usesul'
            ],
            '/sql/mysql/': [
                'install'
            ],
            '/other/git/': [
                'history',
                'cmd',
                'gl-hook',
            ],
            '/other/linux/': [
                'cmd',
                'error',
                'firewall',
                'info',
                'install',
                'sql',
                'systemd',
                'vim',
            ],
            '/other/tools/': [
                'chrome',
                'win-cmd',
                'win-tools'
            ]
        },
        sidebarDepth: 2
    }
}
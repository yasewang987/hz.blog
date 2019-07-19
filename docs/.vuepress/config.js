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
                    { text: '常用功能', link: '/dotnet/common/' }
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
            }
        ],
        sidebar: {
            '/dotnet/common/': [
                'core'
            ],
            '/test/jmeter/': [
                'install-docker',
            ],
            '/devops/k8s/': [
                'k8s-cmd',
                'k8s-install',
                'k8s-problem',
                'k8s-netcore'
            ],
            '/devops/docker/': [
                'docker1'
            ],
            '/devops/jenkins/': [
                'jenkins1'
            ],
            '/devops/gitlabrunner/': [
                'gitlabrunner1'
            ],
            '/devops/shell/': [
                'sh-common.md',
                'sh-gitbranch.md'
            ]
        },
        sidebarDepth: 2
    }
}
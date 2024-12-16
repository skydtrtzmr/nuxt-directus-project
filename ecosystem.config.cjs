// 用于pm2管理nuxt3项目
// 注意，要把ecosystem.config.js改为ecosystem.config.cjs才能使用。

module.exports = {
    apps: [
        {
            name: "nuxt3项目", // 启动项目名称，随便取，一般为项目名
            exec_mode: "cluster",
            instances: 20, // 进程数,默认为1，如果该配置文件需要管理多个项目，可根据项目的个数更改进程数
            port: "3000", // 端口，根据需要指定
            script: "./.output/server/index.mjs", // 启动入口，相对于 .output 目录的路径
            args: "start",
            env: {
                MODE: "production"
            }
        }
    ]
}

// 启动指令：
// pm2 start ./ecosystem.config.js
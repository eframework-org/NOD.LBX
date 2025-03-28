// Copyright (c) 2025 EFramework Organization. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import { XEnv, XFile, XLog } from "org.eframework.uni.util"
import { Install } from "./Install"
import { spawnSync } from "child_process"

/**
 * 主程序入口
 * 负责处理命令行参数、检查环境、启动 Luban 进程
 */
(async () => {
    // 处理命令行参数
    let args = process.argv.slice(2)
    args = await Install.Process(args)
    XLog.Debug("Luban with arguments: {0}", args.join(" "))

    // 处理帮助和版本信息
    if (args.length == 0 || args.indexOf("--help") >= 0) {
        try {
            // 读取并显示帮助文档
            const mfile = XFile.PathJoin(XEnv.LocalPath, "..", "README.md")
            if (XFile.HasFile(mfile)) {
                const lines = XFile.OpenText(mfile).split("\n")
                const nlines = new Array<string>()
                let manual = false
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i]
                    if (!manual && line.indexOf("## Manual") >= 0) manual = true
                    else if (manual && line.startsWith("##")) manual = false   // End of manual section
                    if (manual) nlines.push(line)
                }
                if (nlines.length == 0) console.info(XFile.OpenText(mfile))
                else console.info(nlines.join("\n"))
            }
        } catch (err) { console.error("Readout README.md failed: ", err) }
    } else if (args.indexOf("--version") >= 0) {
        console.info(`LubanX ${XEnv.Version}`)
    }

    // 检查 .NET SDK 环境
    const verret = spawnSync("dotnet", ["--version"], { encoding: "utf-8" })
    if (verret.error) {
        XLog.Error("Failed to get .NET SDK version: {0}, please install it and retry: {1}", verret.error.message, "https://dotnet.microsoft.com/zh-cn/download/dotnet/8.0")
        process.exit(1)
    }

    // 启动 Luban 进程
    const bin = XFile.PathJoin(XEnv.LocalPath, "Luban", "Luban.dll")
    args.unshift(bin)
    const child = spawnSync("dotnet", args, {
        stdio: [process.stdin, process.stdout, process.stderr],
        shell: false,
        env: process.env
    })

    // 处理进程退出
    if (child.error) throw child.error
    process.exit(child.status)
})()
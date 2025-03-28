// Copyright (c) 2025 EFramework Organization. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import { XEnv, XFile, XLog, XString } from "org.eframework.uni.util"
import * as fs from "fs"
import { https } from "follow-redirects"

/**
 * 安装模块，负责 Luban 工具链的安装和管理
 */
export namespace Install {
    /**
     * 处理安装相关的命令行参数，并执行安装流程
     * @param args 命令行参数数组
     * @returns 处理后的参数数组，移除了 install 和 gitproxy 参数
     * @throws 当安装过程出错时抛出异常
     */
    export async function Process(args: string[]): Promise<string[]> {
        return new Promise(async (resolve, reject) => {
            // 解析命令行参数
            let version = null        // Luban 版本号
            let gitproxy = null       // Git 代理地址

            // 处理参数，提取 install 和 gitproxy 选项
            const nargs = []
            for (let i = 0; i < args.length; i++) {
                const arg = args[i]
                if (arg.startsWith("--")) {
                    const strs = arg.split("=")
                    const key = strs[0].replace("--", "").trim()
                    const value = strs.length > 1 ? strs[1].trim() : null
                    if (key == "install") {
                        version = value
                        continue
                    } else if (key == "gitproxy") {
                        gitproxy = value
                        continue
                    }
                }
                nargs.push(arg)
            }

            // 检查本地版本
            const local = XFile.PathJoin(XEnv.LocalPath, "Luban.ver")
            if (XFile.HasFile(local) && XString.IsNullOrEmpty(version)) {
                XLog.Debug(`Luban: @${XFile.OpenText(local)}`)
            } else {
                // 设置默认版本
                if (XString.IsNullOrEmpty(version)) version = "3.13.0"
                try {
                    // 构建下载 URL
                    let url = `https://github.com/focus-creative-games/luban/releases/download/v${version}/Luban.7z`

                    // 检查是否需要使用代理
                    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone.toLocaleLowerCase()
                    if (XString.Contains(tz, "shanghai") || !XString.IsNullOrEmpty(gitproxy) || process.env.GITHUB_ACTIONS != null) {
                        if (XString.IsNullOrEmpty(gitproxy)) gitproxy = "https://ghproxy.cn/"
                        url = `${gitproxy.endsWith("/") ? gitproxy : gitproxy + "/"}${url}`
                        XLog.Debug(`Install.Process: using git proxy of ${gitproxy}.`)
                    }
                    XLog.Debug(`Install.Process: fetch from ${url}.`)

                    // 下载并解压工具包
                    const zip = XFile.PathJoin(XEnv.LocalPath, XFile.FileName(url))
                    const ws = fs.createWriteStream(zip)

                    await new Promise((resolve, reject) => {
                        https.get(url, (response) => {
                            response.pipe(ws)
                            ws.on("finish", () => {
                                ws.close(() => {
                                    XLog.Debug(`Install.Process: fetch into ${zip}.`)
                                    XFile.Unzip(zip, XEnv.LocalPath, resolve)
                                })
                            })
                        }).on("error", reject)
                    })

                    // 清理临时文件
                    XFile.DeleteFile(zip)

                    // 设置可执行权限
                    const dllFile = XFile.PathJoin(XEnv.LocalPath, "Luban", "Luban.dll")
                    if (XFile.HasFile(dllFile)) {
                        fs.chmodSync(dllFile, 0o755)
                        XLog.Debug(`Install.Process: chmod Luban.dll to 0o755.`)
                    }

                    const execFile = XFile.PathJoin(XEnv.LocalPath, "Luban", "Luban.exe")
                    if (XFile.HasFile(execFile)) {
                        fs.chmodSync(execFile, 0o755)
                        XLog.Debug(`Install.Process: chmod Luban.exe to 0o755.`)
                    }

                    // 记录安装版本
                    XLog.Debug(`Install.Process: @${version} has been installed.`)
                    XFile.SaveText(local, version)
                } catch (err) {
                    XLog.Error(`Install.Process: @${version} install failed: ${err}`)
                    reject(err)
                }
            }
            resolve(nargs)
        })
    }
}
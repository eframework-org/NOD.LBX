// Copyright (c) 2025 EFramework Organization. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import { XEnv, XFile, XTest } from "org.eframework.uni.util"
import { Install } from "../src/Install"

XTest.Test("Install Toolchains", async () => {
    XFile.DeleteDirectory(XEnv.LocalPath)
    XFile.CreateDirectory(XEnv.LocalPath)
    await Install.Process(["--install=3.12.0", "--gitproxy=https://ghproxy.cn/"]) // Install specified version.
})
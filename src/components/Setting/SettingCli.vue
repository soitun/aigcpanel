<script setup lang="ts">
import { onMounted, ref } from "vue";
import { t } from "../../lang";

const platform = window.$mapi.app.platformName() as "win" | "osx" | "linux";

const cliBinPath = ref("");
const symlinkTarget = "/usr/local/bin/aigcpanel";
const localBinTarget = "~/.local/bin/aigcpanel";

const installStatus = ref<"idle" | "loading" | "done" | "error">("idle");
const installMsg = ref("");
const isInstalled = ref(false);

onMounted(async () => {
    if (platform !== "win") {
        cliBinPath.value =
            await window.$mapi.app.resourcePathResolve("bin/aigcpanel");
        await checkInstalled();
    } else {
        cliBinPath.value =
            await window.$mapi.app.resourcePathResolve("bin/aigcpanel.exe");
    }
});

async function checkInstalled() {
    try {
        const { stdout } = await window.$mapi.app.shell(
            "which aigcpanel 2>/dev/null || echo ''",
        );
        isInstalled.value = stdout.trim().length > 0;
    } catch {
        isInstalled.value = false;
    }
}

const doInstall = async () => {
    installStatus.value = "loading";
    installMsg.value = "";
    try {
        if (platform === "osx") {
            await window.$mapi.app.shell(
                `osascript -e 'do shell script "ln -sf \\"${cliBinPath.value}\\" ${symlinkTarget}" with administrator privileges'`,
            );
            installMsg.value = `已安装到 ${symlinkTarget}`;
        } else if (platform === "linux") {
            await window.$mapi.app.shell(
                `mkdir -p "$HOME/.local/bin" && ln -sf "${cliBinPath.value}" "$HOME/.local/bin/aigcpanel"`,
            );
            installMsg.value = `已安装到 ~/.local/bin/aigcpanel`;
        }
        installStatus.value = "done";
        isInstalled.value = true;
    } catch (e: any) {
        installStatus.value = "error";
        installMsg.value = e.stderr || e.message || "安装失败";
    }
};
</script>

<template>
    <div>
        <!-- macOS / Linux -->
        <template v-if="platform !== 'win'">
            <div class="flex mb-3">
                <div class="w-24 flex-shrink-0">工具路径</div>
                <div
                    class="flex-grow text-gray-500 break-all text-sm leading-6"
                >
                    {{ cliBinPath || "加载中…" }}
                </div>
            </div>
            <div class="flex mb-3">
                <div class="w-24 flex-shrink-0">使用方法</div>
                <div class="flex-grow">
                    <div class="text-sm text-gray-500 mb-2">
                        安装后可在终端中直接使用
                        <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded"
                            >aigcpanel</code
                        >
                        命令：
                    </div>
                    <div
                        class="bg-gray-100 dark:bg-gray-800 rounded p-3 text-sm font-mono space-y-1"
                    >
                        <div># 查看版本</div>
                        <div>aigcpanel version</div>
                        <div class="mt-2"># 列出已安装服务</div>
                        <div>aigcpanel model_list</div>
                        <div class="mt-2"># 调用服务功能（示例：语音合成）</div>
                        <div>
                            aigcpanel model_call --model CosyVoice --version
                            1.0.0 --function soundTts --text "你好"
                        </div>
                    </div>
                    <div class="mt-3 text-sm text-gray-500">
                        安装位置：
                        <template v-if="platform === 'osx'">
                            <code
                                class="bg-gray-100 dark:bg-gray-700 px-1 rounded"
                                >{{ symlinkTarget }}</code
                            >（需要管理员密码）
                        </template>
                        <template v-else>
                            <code
                                class="bg-gray-100 dark:bg-gray-700 px-1 rounded"
                                >{{ localBinTarget }}</code
                            >
                            <span class="ml-2"
                                >若
                                <code
                                    class="bg-gray-100 dark:bg-gray-700 px-1 rounded"
                                    >~/.local/bin</code
                                >
                                不在 PATH 中，请添加
                                <code
                                    class="bg-gray-100 dark:bg-gray-700 px-1 rounded"
                                    >export PATH="$HOME/.local/bin:$PATH"</code
                                >
                                到 shell 配置文件</span
                            >
                        </template>
                    </div>
                </div>
            </div>
            <div class="flex mb-3 items-center">
                <div class="w-24 flex-shrink-0">安装</div>
                <div class="flex items-center gap-3">
                    <a-button
                        type="primary"
                        :loading="installStatus === 'loading'"
                        :disabled="!cliBinPath"
                        @click="doInstall"
                    >
                        <template #icon><icon-link /></template>
                        {{ isInstalled ? "重新安装" : "安装到系统" }}
                    </a-button>
                    <span
                        v-if="installStatus === 'done'"
                        class="text-green-600 text-sm"
                    >
                        <icon-check-circle /> {{ installMsg }}
                    </span>
                    <span
                        v-else-if="installStatus === 'error'"
                        class="text-red-500 text-sm"
                    >
                        <icon-close-circle /> {{ installMsg }}
                    </span>
                    <span v-else-if="isInstalled" class="text-gray-400 text-sm">
                        <icon-check-circle /> 已安装
                    </span>
                </div>
            </div>
        </template>

        <!-- Windows -->
        <template v-else>
            <div class="flex mb-3">
                <div class="w-24 flex-shrink-0">工具路径</div>
                <div
                    class="flex-grow text-gray-500 break-all text-sm leading-6"
                >
                    {{ cliBinPath || "加载中…" }}
                </div>
            </div>
            <div class="flex mb-3">
                <div class="w-24 flex-shrink-0">使用方法</div>
                <div class="flex-grow">
                    <div class="text-sm text-gray-500 mb-2">
                        将上方工具路径所在目录添加到系统 PATH
                        环境变量后，可在命令行直接使用：
                    </div>
                    <div
                        class="bg-gray-100 dark:bg-gray-800 rounded p-3 text-sm font-mono space-y-1"
                    >
                        <div>:: 查看版本</div>
                        <div>aigcpanel version</div>
                        <div class="mt-2">:: 列出已安装服务</div>
                        <div>aigcpanel model_list</div>
                        <div class="mt-2">
                            :: 调用服务功能（示例：语音合成）
                        </div>
                        <div>
                            aigcpanel model_call --model CosyVoice --version
                            1.0.0 --function soundTts --text "你好"
                        </div>
                    </div>
                    <div class="mt-3 text-sm text-gray-500">
                        配置 PATH：右键"此电脑" → 属性 → 高级系统设置 → 环境变量
                        → 在 Path 中添加上方目录路径
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

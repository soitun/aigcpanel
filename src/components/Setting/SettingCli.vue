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
            installMsg.value = t("cli.installedTo", { path: symlinkTarget });
        } else if (platform === "linux") {
            await window.$mapi.app.shell(
                `mkdir -p "$HOME/.local/bin" && ln -sf "${cliBinPath.value}" "$HOME/.local/bin/aigcpanel"`,
            );
            installMsg.value = t("cli.installedTo", {
                path: "~/.local/bin/aigcpanel",
            });
        }
        installStatus.value = "done";
        isInstalled.value = true;
    } catch (e: any) {
        installStatus.value = "error";
        installMsg.value = e.stderr || e.message || t("cli.installFailed");
    }
};
</script>

<template>
    <div>
        <!-- macOS / Linux -->
        <template v-if="platform !== 'win'">
            <div class="flex mb-3">
                <div class="w-24 flex-shrink-0">{{ $t("cli.toolPath") }}</div>
                <div
                    class="flex-grow text-gray-500 break-all text-sm leading-6"
                >
                    {{ cliBinPath || $t("common.loadingDots") }}
                </div>
            </div>
            <div class="flex mb-3">
                <div class="w-24 flex-shrink-0">
                    {{ $t("cli.usageInstructions") }}
                </div>
                <div class="flex-grow">
                    <div class="text-sm text-gray-500 mb-2">
                        {{ $t("cli.usageDesc") }}
                        <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded"
                            >aigcpanel</code
                        >
                    </div>
                    <div
                        class="bg-gray-100 dark:bg-gray-800 rounded p-3 text-sm font-mono space-y-1"
                    >
                        <div>{{ $t("cli.commentViewVersion") }}</div>
                        <div>aigcpanel version</div>
                        <div class="mt-2">
                            {{ $t("cli.commentListModels") }}
                        </div>
                        <div>aigcpanel model_list</div>
                        <div class="mt-2">
                            {{ $t("cli.commentCallFunction") }}
                        </div>
                        <div>
                            aigcpanel model_call --model CosyVoice --version
                            1.0.0 --function soundTts --text "你好"
                        </div>
                    </div>
                    <div class="mt-3 text-sm text-gray-500">
                        {{ $t("cli.installLocation") }}：
                        <template v-if="platform === 'osx'">
                            <code
                                class="bg-gray-100 dark:bg-gray-700 px-1 rounded"
                                >{{ symlinkTarget }}</code
                            >{{ $t("cli.requiresAdminPassword") }}
                        </template>
                        <template v-else>
                            <code
                                class="bg-gray-100 dark:bg-gray-700 px-1 rounded"
                                >{{ localBinTarget }}</code
                            >
                            <span class="ml-2">{{
                                $t("cli.pathHintLinux")
                            }}</span>
                        </template>
                    </div>
                </div>
            </div>
            <div class="flex mb-3 items-center">
                <div class="w-24 flex-shrink-0">
                    {{ $t("cli.installSection") }}
                </div>
                <div class="flex items-center gap-3">
                    <a-button
                        type="primary"
                        :loading="installStatus === 'loading'"
                        :disabled="!cliBinPath"
                        @click="doInstall"
                    >
                        <template #icon><icon-link /></template>
                        {{
                            isInstalled
                                ? $t("cli.reinstall")
                                : $t("cli.install")
                        }}
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
                        <icon-check-circle /> {{ $t("cli.installed") }}
                    </span>
                </div>
            </div>
        </template>

        <!-- Windows -->
        <template v-else>
            <div class="flex mb-3">
                <div class="w-24 flex-shrink-0">{{ $t("cli.toolPath") }}</div>
                <div
                    class="flex-grow text-gray-500 break-all text-sm leading-6"
                >
                    {{ cliBinPath || $t("common.loadingDots") }}
                </div>
            </div>
            <div class="flex mb-3">
                <div class="w-24 flex-shrink-0">
                    {{ $t("cli.usageInstructions") }}
                </div>
                <div class="flex-grow">
                    <div class="text-sm text-gray-500 mb-2">
                        {{ $t("cli.addPathDesc") }}
                    </div>
                    <div
                        class="bg-gray-100 dark:bg-gray-800 rounded p-3 text-sm font-mono space-y-1"
                    >
                        <div>{{ $t("cli.winCommentViewVersion") }}</div>
                        <div>aigcpanel version</div>
                        <div class="mt-2">
                            {{ $t("cli.winCommentListModels") }}
                        </div>
                        <div>aigcpanel model_list</div>
                        <div class="mt-2">
                            {{ $t("cli.winCommentCallFunction") }}
                        </div>
                        <div>
                            aigcpanel model_call --model CosyVoice --version
                            1.0.0 --function soundTts --text "你好"
                        </div>
                    </div>
                    <div class="mt-3 text-sm text-gray-500">
                        {{ $t("cli.configPath") }}
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

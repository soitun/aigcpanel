<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { t } from "../lang";
import { Dialog } from "../lib/dialog";
import {
    WorkflowLogService,
    WorkflowRecord,
    WorkflowService,
} from "../service/WorkflowService";
import { usePaginate } from "../hooks/paginate";
import ListerTop from "../components/common/ListerTop.vue";
import MEmpty from "../components/common/MEmpty.vue";

const searchText = ref("");
const loading = ref(false);

const { page, records, recordsFilterCount, recordsForPage } =
    usePaginate<WorkflowRecord>({
        pageSize: 10,
        filter: (r: WorkflowRecord) => {
            if (searchText.value) {
                return r.name
                    .toLowerCase()
                    .includes(searchText.value.toLowerCase());
            }
            return true;
        },
    });

const loadWorkflows = async () => {
    loading.value = true;
    try {
        records.value = await WorkflowService.list();
    } catch (error) {
        console.error("加载工作流列表失败:", error);
        Dialog.tipError("加载工作流列表失败");
    } finally {
        loading.value = false;
    }
};

const doDelete = async (workflow: WorkflowRecord) => {
    Dialog.confirm(t("确定要删除这个工作流吗？此操作不可撤销。")).then(
        async () => {
            await WorkflowLogService.deleteByWorkflowId(workflow.id!);
            await WorkflowService.delete(workflow.id!);
            Dialog.tipSuccess(t("删除成功"));
            await loadWorkflows();
        },
    );
};

onMounted(() => {
    loadWorkflows();
});
</script>

<template>
    <div class="bg-white p-6 min-h-full relative select-none">
        <div class="mb-2 flex items-center">
            <div class="text-3xl font-bold flex-grow">工作流</div>
        </div>

        <ListerTop
            :loading="loading"
            :total="records.length"
            @refresh="loadWorkflows"
        >
            <a-input-search
                v-model="searchText"
                placeholder="按名称搜索"
                class="w-64"
                allow-clear
            />
            <template #actions>
                <a-button
                    type="primary"
                    @click="$router.push({ path: '/workflow/edit/new' })"
                >
                    <template #icon>
                        <icon-plus />
                    </template>
                    {{ $t("创建工作流") }}
                </a-button>
            </template>
        </ListerTop>

        <div v-if="loading" class="text-center py-8">
            <a-spin />
            <div class="mt-2">加载中...</div>
        </div>

        <div v-else-if="records.length === 0" class="text-center py-8">
            <div>
                <m-empty text="暂无工作流" />
                <div>
                    <a-button
                        type="primary"
                        @click="$router.push({ path: '/workflow/edit/new' })"
                    >
                        <template #icon>
                            <icon-plus />
                        </template>
                        {{ $t("创建工作流") }}
                    </a-button>
                </div>
            </div>
        </div>

        <template v-else>
            <div class="space-y-4">
                <div
                    v-for="workflow in recordsForPage"
                    :key="workflow.id"
                    class="border border-gray-200 rounded-lg p-4"
                >
                    <div class="flex items-center justify-between">
                        <div
                            class="flex-1"
                            @click="
                                $router.push({
                                    path: '/workflow/edit/' + workflow.id,
                                })
                            "
                        >
                            <div class="text-lg font-semibold cursor-pointer">
                                {{ workflow.name }}
                            </div>
                            <div class="text-sm text-gray-500 mt-1">
                                <icon-calendar />
                                <timeago
                                    :datetime="
                                        (workflow.createdAt as any) * 1000
                                    "
                                />
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <a-button
                                @click="
                                    $router.push({
                                        path: '/workflow/edit/' + workflow.id,
                                    })
                                "
                            >
                                <template #icon>
                                    <icon-edit />
                                </template>
                                {{ $t("打开") }}
                            </a-button>
                            <a-button
                                @click="doDelete(workflow)"
                                status="danger"
                            >
                                <template #icon>
                                    <icon-delete />
                                </template>
                                {{ $t("删除") }}
                            </a-button>
                        </div>
                    </div>
                </div>
            </div>
            <div
                v-if="recordsFilterCount > 10"
                class="mt-4 flex justify-center"
            >
                <a-pagination
                    v-model:current="page"
                    :total="recordsFilterCount"
                    :page-size="10"
                    show-total
                />
            </div>
        </template>
    </div>
</template>

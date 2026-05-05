<script setup lang="ts">
import { t } from "../../../lang";
import { NodeProperties } from "../core/type";

const props = defineProps<{
    node: any;
    properties?: NodeProperties;
}>();
</script>

<template>
    <a-tooltip
        v-if="properties?.status === 'running'"
        :content="properties?.statusMsg || t('正在运行')"
        placement="top"
    >
        <icon-refresh class="text-orange-500" spin />
    </a-tooltip>
    <a-tooltip
        v-else-if="properties?.status === 'error'"
        :content="properties?.statusMsg || t('运行出现错误')"
        placement="top"
    >
        <icon-info-circle class="text-red-500" />
    </a-tooltip>
    <a-tooltip
        v-else-if="properties?.status === 'pause'"
        :content="properties?.statusMsg || t('已暂停')"
        placement="top"
    >
        <icon-pause-circle class="text-blue-500" />
    </a-tooltip>
    <a-tooltip
        v-else-if="properties?.status === 'success'"
        :content="properties?.statusMsg || t('运行成功')"
        placement="top"
    >
        <icon-check-circle class="text-green-500" />
    </a-tooltip>
    <a-tooltip
        v-else-if="properties?.status === 'success_ignore'"
        :content="properties?.statusMsg || t('条件分支未激活')"
        placement="top"
    >
        <icon-check-circle class="text-gray-400" />
    </a-tooltip>
    <a-tooltip
        v-else-if="properties?.status === 'idle'"
        :content="properties?.statusMsg || t('待运行')"
        placement="top"
    >
        <icon-play-circle class="text-gray-500" />
    </a-tooltip>
    <a-tooltip
        v-else
        placement="top"
        :content="'Unknown Status ' + properties?.status"
    >
        <icon-info-circle />
    </a-tooltip>
</template>

<script setup lang="ts">
import ServerNameVersion from "../../../components/Server/ServerNameVersion.vue";
import ParamFormView from "../../../components/common/ParamFormView.vue";

const props = defineProps<{
    data: any,
}>();
</script>

<template>
    <div class="mb-4">
        <div class="font-bold mb-2">
            {{ $t("语音识别配置") }}
        </div>
        <div>
            <ServerNameVersion :record="data"/>
            <ParamFormView :param="data.param"/>
        </div>
    </div>
</template>

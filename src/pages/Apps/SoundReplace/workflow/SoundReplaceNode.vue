<script setup lang="ts">
import {ref} from "vue";
import SoundGenerateFormView from "../../../Sound/components/SoundGenerateFormView.vue";
import SoundAsrFormView from "../../../Sound/components/SoundAsrFormView.vue";
import {
    FunctionCallNodeEmits,
    FunctionCallNodeProps,
    useFunctionCallNode
} from "../../../../module/Workflow/nodes/FunctionCall/lib";
import SoundReplaceItemDialog from "../components/SoundReplaceItemDialog.vue";
import SoundReplaceParamDialog from "../components/SoundReplaceParamDialog.vue";

const props = defineProps<FunctionCallNodeProps>();
const emit = defineEmits<FunctionCallNodeEmits>();
const {nodeData, nodeRunData, nodeUpdateData} = useFunctionCallNode(props, emit)
const soundReplaceItemDialog = ref<InstanceType<typeof SoundReplaceItemDialog>>();
const soundReplaceParamDialog = ref<InstanceType<typeof SoundReplaceParamDialog>>();
</script>

<template>
    <div class="p-2 relative">
        <div class="-mb-4">
            <SoundAsrFormView v-if="nodeData.soundAsr" :data="nodeData.soundAsr"/>
            <SoundGenerateFormView v-if="nodeData.soundGenerate" :data="nodeData.soundGenerate"/>
            <template v-if="props.source==='view'">
                <div v-if="!nodeData.soundAsr && !nodeData.soundGenerate"
                     class="p-2 text-center text-xs text-gray-500 rounded-lg bg-gray-100 cursor-pointer mb-4">
                    {{ $t("没有配置") }}
                </div>
            </template>
            <template v-else-if="props.source==='config'">
                <div v-if="!nodeData.soundAsr && !nodeData.soundGenerate"
                     @click="soundReplaceParamDialog.show()"
                     class="p-2 text-center text-xs text-gray-500 rounded-lg bg-gray-100 cursor-pointer mb-4">
                    {{ $t("点击配置") }}
                </div>
                <div class="-mt-2 mb-4">
                    <a-button size="mini" @click="soundReplaceParamDialog.show()">
                        <template #icon>
                            <icon-edit/>
                        </template>
                        {{ $t("修改") }}
                    </a-button>
                </div>
            </template>
            <div v-if="nodeRunData" class="mb-4">
                <div class="">
                    <a-button v-if="nodeRunData.taskId"
                              @click="soundReplaceItemDialog.show(nodeRunData.taskId)"
                              class="w-full">
                        <template #icon>
                            <icon-tool/>
                        </template>
                        {{ $t('查看任务') }}
                        #{{nodeRunData.taskId}}
                    </a-button>
                </div>
            </div>
        </div>
    </div>
    <SoundReplaceItemDialog ref="soundReplaceItemDialog"/>
    <SoundReplaceParamDialog ref="soundReplaceParamDialog" @update="nodeUpdateData"/>
</template>

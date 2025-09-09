<script setup lang="ts">
import {ref} from "vue";
import TaskDialogViewButton from "../../../../components/common/TaskDialogViewButton.vue";
import {
    FunctionCallNodeEmits,
    FunctionCallNodeProps,
    useFunctionCallNode
} from "../../../../module/Workflow/nodes/FunctionCall/lib";
import SoundGenerateFormView from "../../../Sound/components/SoundGenerateFormView.vue";
import LongTextTtsParamDialog from "../components/LongTextTtsParamDialog.vue";

const props = defineProps<FunctionCallNodeProps>();
const emit = defineEmits<FunctionCallNodeEmits>();
const {nodeData, nodeRunData, nodeUpdateData} = useFunctionCallNode(props, emit)
const paramDialog = ref<InstanceType<typeof LongTextTtsParamDialog>>();
</script>

<template>
    <div class="p-2 relative">
        <div class="-mb-4">
            <SoundGenerateFormView v-if="nodeData.soundGenerate" :data="nodeData.soundGenerate"/>
            <a-button v-if="(!nodeData.soundGenerate) || (props.source==='config')"
                      :class="props.source==='config'?'cursor-pointer':''"
                      @click="props.source==='config'&&paramDialog.show()"
                      size="small" class="w-full mb-4">
                {{ props.source === 'config' ? $t("修改配置") : $t("没有配置") }}
            </a-button>
            <div v-if="nodeRunData" class="mb-4">
                <div class="">
                    <TaskDialogViewButton :task-id="nodeRunData.taskId"/>
                </div>
            </div>
        </div>
    </div>
    <LongTextTtsParamDialog ref="paramDialog" @update="nodeUpdateData"/>
</template>

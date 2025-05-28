<script setup lang="ts">

import AudioPlayer from "../../components/common/AudioPlayer.vue";
import SoundPromptEditDialog from "../../components/Sound/SoundPromptEditDialog.vue";
import {onMounted, ref} from "vue";
import {t} from "../../lang";
import {Dialog} from "../../lib/dialog";
import {StorageRecord, StorageService} from "../../service/StorageService";
import InputInlineEditor from "../../components/common/InputInlineEditor.vue";

const editDialog = ref<InstanceType<typeof SoundPromptEditDialog>>()
const records = ref<StorageRecord[]>([])
const loading = ref(true)

const doRefresh = async () => {
    loading.value = true
    records.value = await StorageService.list('SoundPrompt')
    loading.value = false
}

onMounted(async () => {
    await doRefresh()
})

const onChangeTitle = async (record: StorageRecord, value: string) => {
    await StorageService.update(record.id as any, {
        title: value
    })
    await doRefresh()
}

const doDelete = async (record: StorageRecord) => {
    await Dialog.confirm(t('确认删除？'))
    await StorageService.delete(record)
    await doRefresh()
}
</script>

<template>
    <div class="p-5">
        <div class="mb-4 flex items-center">
            <div class="text-3xl font-bold flex-grow">
                {{ $t('我的音色') }}
            </div>
            <div class="flex items-center">
                <a-button @click="editDialog?.add()">
                    <template #icon>
                        <icon-plus/>
                    </template>
                    {{ $t('添加') }}
                </a-button>
            </div>
        </div>
        <div>
            <div style="height:60vh;">
                <m-empty v-if="!records.length&&!loading"/>
                <m-loading v-else-if="!records.length&&loading" page/>
                <div v-for="r in records">
                    <div class="rounded-xl shadow border p-4 mt-4 hover:shadow-lg">
                        <div class="flex mb-3">
                            <div class="flex-grow w-0 mr-2">
                                <div
                                    class="inline-flex max-w-full items-center bg-blue-100 rounded-full px-2 leading-8 h-8">
                                    <div class="truncate overflow-hidden flex-grow cursor-pointer">
                                        {{ r.title }}
                                    </div>
                                    <InputInlineEditor :value="r.title" @change="onChangeTitle(r, $event)">
                                        <a class="ml-1 text-gray-400" href="javascript:;">
                                            <icon-pen/>
                                        </a>
                                    </InputInlineEditor>
                                </div>
                            </div>
                            <div>
                                <a-button @click="doDelete(r)">
                                    <template #icon>
                                        <icon-delete/>
                                    </template>
                                </a-button>
                            </div>
                        </div>
                        <div class="mb-3">
                            <AudioPlayer show-wave :url="'file://'+r.content.url"/>
                        </div>
                        <div>
                            {{ r.content.promptText }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <SoundPromptEditDialog ref="editDialog" @update="doRefresh"/>
</template>


<script setup lang="ts">
import {onMounted, ref} from "vue";
import {StorageRecord, StorageService} from "../../../service/StorageService";

const soundPrompts = ref<StorageRecord[]>([])
onMounted(async () => {
    soundPrompts.value = await StorageService.list('SoundPrompt')
})
</script>

<template>
    <a-select :placeholder="$t('音色')" size="small">
        <a-option :value="0">
            {{ $t('请选择') }}
        </a-option>
        <a-option v-for="s in soundPrompts"
                  :value="s.id">
            {{ s.title }}
        </a-option>
    </a-select>
</template>

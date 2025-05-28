<script setup lang="ts">
const props = defineProps<{
    record: {
        result: Record<string, any>
    },
}>()
</script>

<template>
    <div v-if="record.result"
         class="inline-block">
        <div v-for="(v,k) in record.result" class="inline-block mr-4">
            <a-tooltip v-if="k as any==='UseCuda' && v" :content="$t('CUDA加速')" mini>
                <div class="bg-green-100 text-green-600 rounded-lg px-1 leading-6 h-6">
                    <i class="iconfont icon-cuda"></i>
                </div>
            </a-tooltip>
            <a-tooltip v-if="k as any==='UseCuda' && !v" content="CPU" mini>
                <div class="bg-yellow-100 text-yellow-600 rounded-lg px-1 leading-6 h-6">
                    <i class="iconfont icon-cpu"></i>
                </div>
            </a-tooltip>
        </div>
    </div>
</template>


<script setup lang="ts">
const props = defineProps<{
    param: {
        [key: string]: any;
    },
}>();
</script>

<template>
    <div v-for="(v,k) in param">
        <a-tag v-if="!(k as string).startsWith('_')" class="rounded-lg">
            <i class="iconfont icon-seed w-5"></i>
            {{ param['_' + k] || k }}:{{ param['__' + k] || v }}
        </a-tag>
    </div>
</template>

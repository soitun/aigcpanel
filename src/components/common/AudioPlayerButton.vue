<template>
  <span>
    <a v-if="!playing" class="play" href="javascript:;" @click="playing = true">
        <icon-play-circle/>
    </a>
    <a v-if="playing" class="pause" href="javascript:;" @click="playing = false">
      <icon-pause-circle/>
    </a>
    <audio ref="audio" :src="source" preload="none"></audio>
  </span>
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, watch} from 'vue'

const props = defineProps({
    source: {
        type: String,
        default: ''
    }
})

const audio = ref<HTMLAudioElement | null>(null)
const loaded = ref(false)
const playing = ref(false)
const durationSeconds = ref(0)

watch(() => props.source, (newValue, oldValue) => {
    if (newValue && newValue !== oldValue) {
        init()
    }
})

watch(playing, (value) => {
    if (!audio.value) return
    if (value) {
        audio.value.play()
    } else {
        audio.value.pause()
    }
})

function loadeddata() {
    if (audio.value && audio.value.readyState >= 2) {
        loaded.value = true
        // @ts-ignore
        durationSeconds.value = parseInt(audio.value.duration)
    } else {
        throw new Error('Failed to load sound file.')
    }
}

function init() {
    // 可以在这里重置一些状态
}

onMounted(() => {
    if (!audio.value) return
    audio.value.addEventListener('loadeddata', loadeddata)
    audio.value.addEventListener('pause', () => {
        playing.value = false
    })
    audio.value.addEventListener('play', () => {
        playing.value = true
    })
})

onBeforeUnmount(() => {
    if (!audio.value) return
    audio.value.removeEventListener('loadeddata', loadeddata)
})
</script>

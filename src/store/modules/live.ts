import {defineStore} from "pinia"
import store from "../index";
import {useServerStore} from "./server";
import {computed} from "vue";
import {EnumServerStatus, ServerRecord} from "../../types/Server";
import {ObjectUtil} from "../../lib/util";
import {Dialog} from "../../lib/dialog";
import {t} from "../../lang";
import {LiveStatusType} from "../../types/Live";

const serverStore = useServerStore()

const EMPTY_CONFIG = {
    avatar: {
        enable: false,
        width: 0,
        height: 0,
    },
    video: {
        enable: false,
        width: 0,
        height: 0,
    },
    audio: {
        enable: false,
    },
}

const EMPTY_RUNTIME = {
    status: "",
    avatarStatus: "",
    avatarVideoFps: 0,
    avatarAudioFps: 0,
    avatarRtmp: "",
    avatarHls: "",
    videoStatus: "",
    videoVideoFps: 0,
    videoAudioFps: 0,
    videoRtmp: "",
    videoHls: "",
    audioStatus: "",
    audioFps: 0,
    audioRtmp: "",
    audioHls: ""
}

export const liveStore = defineStore("live", {
    state: () => ({
        server: computed(() => {
            return serverStore.records.find(item => item.functions.includes('live')) as ServerRecord | undefined
        }) as any,
        available: computed(() => {
            //TODO
            return true
            return live.server && live.server.status === EnumServerStatus.RUNNING
        }),
        localConfig: {
            mode: 'avatar' as 'avatar' | 'audio',
            avatar: {
                width: 720,
                height: 1280,
                avatarIds: [
                    105, 106
                ],
            },
            audio: {},
            video: {
                width: 720,
                height: 1280,
                flowIds:[],
            },
        },
        status: 'stopped' as LiveStatusType,
        statusMsg: '',
        config: ObjectUtil.clone(EMPTY_CONFIG),
        runtime: ObjectUtil.clone(EMPTY_RUNTIME),
        statusUpdateTimer: undefined as any,
        avatars: [],
        knowledge: [],
    }),
    actions: {
        async init() {
            await this.statusUpdate()
        },
        async statusUpdate() {
            // console.log('update live', JSON.stringify(this.server))
            if (this.statusUpdateTimer) {
                clearTimeout(this.statusUpdateTimer)
            }
            if (!this.server) {
                if (this.status !== 'stopped') {
                    this.status = 'stopped'
                    this.config = ObjectUtil.clone(EMPTY_CONFIG)
                    this.runtime = ObjectUtil.clone(EMPTY_RUNTIME)
                }
                this.statusUpdateTimer = setTimeout(this.update, 2000)
                return
            }
            const serverInfo = await serverStore.serverInfo(this.server)
            // console.log('server', {
            //     serverInfo,
            //     server: ObjectUtil.clone(this.server),
            // })
            //TODO
            if (0 && this.server.status !== EnumServerStatus.RUNNING) {
                this.config = ObjectUtil.clone(EMPTY_CONFIG)
                this.runtime = ObjectUtil.clone(EMPTY_RUNTIME)
                this.statusUpdateTimer = setTimeout(this.update, 2000)
                return
            }
            const res = await window.$mapi.server.callFunctionWithException(serverInfo, 'apiRequest', {
                id: 'live',
                url: 'status',
                param: {}
            })
            if (res.code) {
                this.statusUpdateTimer = setTimeout(this.update, 2000)
                return
            }
            const {config, runtime} = res.data

            this.runtime.status = runtime.status
            this.runtime.avatarStatus = runtime.avatarStatus
            this.runtime.avatarVideoFps = runtime.avatarVideoFps
            this.runtime.avatarAudioFps = runtime.avatarAudioFps
            this.runtime.avatarRtmp = runtime.avatarRtmp
            this.runtime.avatarHls = runtime.avatarHls
            this.runtime.videoStatus = runtime.videoStatus
            this.runtime.videoVideoFps = runtime.videoVideoFps
            this.runtime.videoAudioFps = runtime.videoAudioFps
            this.runtime.videoRtmp = runtime.videoRtmp
            this.runtime.videoHls = runtime.videoHls
            this.runtime.audioStatus = runtime.audioStatus
            this.runtime.audioFps = runtime.audioFps
            this.runtime.audioRtmp = runtime.audioRtmp
            this.runtime.audioHls = runtime.audioHls

            this.config.avatar.enable = config.avatar.enable
            this.config.avatar.width = config.avatar.width
            this.config.avatar.height = config.avatar.height
            this.config.video.enable = config.video.enable
            this.config.video.width = config.video.width
            this.config.video.height = config.video.height
            this.config.audio.enable = config.audio.enable

            if (runtime.status === 'stopped') {
                if (['running', 'stopping',].includes(this.status)) {
                    this.status = 'stopped'
                }
            } else if (runtime.status === 'running') {
                if (['stopped', 'starting',].includes(this.status)) {
                    this.status = 'running'
                }
            }

            this.statusUpdateTimer = setTimeout(this.update, 2000)

        },
        async start() {
            this.status = 'starting'
            const configPost = {
                avatar: {
                    enable: this.localConfig.mode === 'avatar',
                    width: this.localConfig.avatar.width,
                    height: this.localConfig.avatar.height,
                },
                audio: {
                    enable: this.localConfig.mode === 'audio',
                },
                video: {
                    enable: true,
                    width: this.localConfig.video.width,
                    height: this.localConfig.video.height,
                }
            }
            const serverInfo = await serverStore.serverInfo(this.server)
            const res = await window.$mapi.server.callFunctionWithException(serverInfo, 'apiRequest', {
                id: 'live',
                url: 'start',
                param: {
                    config: configPost,
                }
            })
            // console.log('live.start', res)
            if (res.code) {
                this.status = 'error'
                this.statusMsg = res.msg
                Dialog.tipError(t('启动失败') + ':' + res.msg)
                return
            }
            this.statusMsg = ''
        },
        async stop() {
            this.status = 'stopping'
            const serverInfo = await serverStore.serverInfo(this.server)
            const res = await window.$mapi.server.callFunctionWithException(serverInfo, 'apiRequest', {
                id: 'live',
                url: 'stop',
                param: {}
            })
            // console.log('live.stop', res)
            if (res.code) {
                this.status = 'error'
                this.statusMsg = res.msg
                Dialog.tipError(t('停止失败') + ':' + res.msg)
                return
            }
            this.statusMsg = ''
        }
    }
})

const live = liveStore(store)
live.init().then(() => {
})

export const useLiveStore = () => {
    return live
}

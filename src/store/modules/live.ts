import {defineStore} from "pinia"
import store from "../index";
import {useServerStore} from "./server";
import {computed} from "vue";
import {EnumServerStatus, ServerRecord} from "../../types/Server";
import {ObjectUtil} from "../../lib/util";
import {Dialog} from "../../lib/dialog";
import {t} from "../../lang";
import {LiveStatusType} from "../../types/Live";
import {StorageService} from "../../service/StorageService";

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
    audioHls: "",
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
        serverConfig: [] as {
            ttsProviders: {
                name: string,
                title: string,
                param: {
                    name: string,
                    type: string,
                    title: string,
                    [key: string]: any
                }[]
            }[]
        }[],
        localConfig: {
            mode: 'avatar' as 'avatar' | 'audio',
            avatar: {
                width: 640,
                height: 480,
                avatarIds: [],
            },
            audio: {},
            video: {
                width: 640,
                height: 480,
            },
            config: {
                flowVideoIds: [],
                flowVideoMode: 'order' as 'order' | 'random',
                flowTalkIds: [],
                flowTalkMode: 'order' as 'order' | 'random',
                flowTalkDelayMin: 5,
                flowTalkDelayMax: 10,
                ttsProvider: '',
                ttsProviderParam: {} as {
                    [key: string]: any
                },
            }
        },
        status: 'stopped' as LiveStatusType,
        statusMsg: '',
        config: ObjectUtil.clone(EMPTY_CONFIG),
        runtime: ObjectUtil.clone(EMPTY_RUNTIME),
        monitor: {
            videoTitle: '',
            talkTitle: '',
            talkContent: '',
        },
        monitorData: {
            status: 'starting' as 'starting' | 'preparing' | 'running' | 'stopped',
            statusMsg: '',
            avatars: [],
            flowVideos: [],
            flowTalks: [],
            users: [],
            systems: [],
        },

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
            const res = await this.apiRequest('status', {})
            // console.log('res', JSON.stringify(res, null, 2))
            if (res.code) {
                this.statusUpdateTimer = setTimeout(this.update, 2000)
                return
            }
            const {config, runtime, monitor} = res.data

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

            this.monitor.videoTitle = monitor.videoTitle
            this.monitor.talkTitle = monitor.talkTitle
            this.monitor.talkContent = monitor.talkContent

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
                if (!['running', 'stopped'].includes(this.monitorData.status)) {
                    const resMonitor = await this.apiRequest('monitor', {})
                    if (resMonitor.code === 0) {
                        const monitorData = resMonitor.data
                        this.monitorData.status = monitorData.status
                        this.monitorData.statusMsg = monitorData.statusMsg
                        this.monitorData.avatars = monitorData.avatars
                        this.monitorData.flowVideos = monitorData.flowVideos
                        this.monitorData.flowTalks = monitorData.flowTalks
                        this.monitorData.users = monitorData.users
                        this.monitorData.systems = monitorData.systems
                    }
                }
                if (['stopped', 'starting',].includes(this.status)) {
                    this.status = 'running'
                }
            }

            this.statusUpdateTimer = setTimeout(this.statusUpdate, 5000)

        },
        async apiRequest(
            url: string,
            param: {
                [key: string]: any
            } = {}
        ) {
            const serverInfo = await serverStore.serverInfo(this.server)
            return await window.$mapi.server.callFunctionWithException(
                serverInfo,
                'apiRequest',
                {
                    id: 'live', url, param,
                }
            )
        },
        async configUpdate() {
            const res = await this.apiRequest('config', {})
            if (0 === res.code) {
                this.serverConfig = res.data
            }
        },
        async buildData() {
            const avatars: any[] = []
            const storageAvatars = await StorageService.listByIds(this.localConfig.avatar.avatarIds)
            if (!(storageAvatars && storageAvatars.length > 0)) {
                throw '没有选择播放的数字人'
            }
            for (const s of storageAvatars) {
                avatars.push({
                    id: 'Avatar' + s.id,
                    title: s.title,
                    url: s.content.url,
                })
            }
            const flowVideos: any[] = []
            const storageFlowVideos = await StorageService.listByIds(this.localConfig.config.flowVideoIds)
            if (!(storageFlowVideos && storageFlowVideos.length > 0)) {
                throw '没有选择循环素材'
            }
            for (const s of storageFlowVideos) {
                if (s.content.type !== 'flowVideo' || !s.content.enable) {
                    continue
                }
                flowVideos.push({
                    id: 'FlowVideo' + s.id,
                    title: s.title,
                    video: s.content.url,
                })
            }
            const flowTalks: any[] = []
            const storageFlowTalks = await StorageService.listByIds(this.localConfig.config.flowTalkIds)
            if (!(storageFlowTalks && storageFlowTalks.length > 0)) {
                throw '没有选择循环素材'
            }
            for (const s of storageFlowTalks) {
                if (s.content.type !== 'flowTalk' || !s.content.enable) {
                    continue
                }
                s.content.replies = s.content.replies.map(r => {
                    return {
                        value: r.value,
                        sound: r.sound || '',
                    }
                })
                flowTalks.push({
                    id: 'FlowTalk' + s.id,
                    title: s.title,
                    talks: [
                        {value: s.content.reply, sound: '',},
                        ...s.content.replies
                    ],
                    video: s.content.url,
                    durationMode: s.content.durationMode,
                })
            }
            const users: any[] = []
            const systems: any[] = []
            const storageUsers = await StorageService.list('LiveKnowledge')
            for (const s of storageUsers) {
                if (!s.content.enable) {
                    continue
                }
                s.content.replies = s.content.replies.map(r => {
                    return {
                        value: r.value,
                        sound: r.sound || '',
                    }
                })
                if (s.content.type === 'user') {
                    users.push({
                        id: 'User' + s.id,
                        title: s.title,
                        talks: [
                            {value: s.content.reply, sound: ''},
                            ...s.content.replies
                        ],
                        keywords: s.content.keywords,
                        video: s.content.url,
                        durationMode: s.content.durationMode,
                    })
                } else if (s.content.type === 'system') {
                    systems.push({
                        id: 'System' + s.id,
                        title: s.title,
                        talks: [
                            {value: s.content.reply, sound: ''},
                            ...s.content.replies
                        ],
                        systemType: s.content.systemType,
                        video: s.content.url,
                        durationMode: s.content.durationMode,
                    })
                }
            }
            return {avatars, flowVideos, flowTalks, users, systems}
        },
        async start() {
            // console.log('live.start', this.localConfig)
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
                },
                config: {
                    flowVideoMode: this.localConfig.config.flowVideoMode,
                    flowTalkMode: this.localConfig.config.flowTalkMode,
                    flowTalkDelayMin: this.localConfig.config.flowTalkDelayMin,
                    flowTalkDelayMax: this.localConfig.config.flowTalkDelayMax,
                    ttsProvider: this.localConfig.config.ttsProvider,
                    ttsProviderParam: this.localConfig.config.ttsProviderParam,
                },
                data: await this.buildData()
            }
            const configPostContent = JSON.stringify(configPost, null, 2)
            await window.$mapi.file.write('config-data-demo.json', configPostContent)
            // console.log('live.start', configPostContent)
            this.status = 'starting'
            this.monitorData.status = 'starting'
            const res = await this.apiRequest('start', {config: ObjectUtil.clone(configPost)})
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
            const res = await this.apiRequest('stop', {})
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

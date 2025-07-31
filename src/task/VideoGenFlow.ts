import {TaskBiz} from "../store/modules/task";
import {useServerStore} from "../store/modules/server";
import {VideoTemplateService} from "../service/VideoTemplateService";
import {TaskService} from "../service/TaskService";
import {DataService} from "../service/DataService";

const serverStore = useServerStore()

const prepareData = async (bizId: string, bizParam: any) => {
    const {record, server, serverInfo} = await serverStore.prepareForTask(bizId, bizParam)
    let soundTtsServer: any = null, soundTtsServerInfo: any = null
    let soundCloneServer: any = null, soundCloneServerInfo: any = null
    if (record.modelConfig.soundType === 'SoundTts') {
        soundTtsServer = await serverStore.getByNameVersion(record.modelConfig.soundTts.serverName, record.modelConfig.soundTts.serverVersion)
        if (!soundTtsServer) {
            throw new Error('soundTtsServer not found')
        }
        soundTtsServerInfo = await serverStore.serverInfo(soundTtsServer)
    } else if (record.modelConfig.soundType === 'SoundClone') {
        soundCloneServer = await serverStore.getByNameVersion(record.modelConfig.soundClone.serverName, record.modelConfig.soundClone.serverVersion)
        if (!soundCloneServer) {
            throw new Error('soundCloneServer not found')
        }
        soundCloneServerInfo = await serverStore.serverInfo(soundCloneServer)
    }
    return {
        record,
        server,
        serverInfo,
        soundTtsServer,
        soundTtsServerInfo,
        soundCloneServer,
        soundCloneServerInfo
    }
}

export const VideoGenFlow: TaskBiz = {
    runFunc: async (bizId, bizParam) => {
        // console.log('VideoGenFlow.runFunc', {bizId, bizParam})
        const {
            record, server, serverInfo,
            soundTtsServer, soundTtsServerInfo,
            soundCloneServer, soundCloneServerInfo,
        } = await prepareData(bizId, bizParam)
        // console.log('VideoGenFlow.runFunc.record', {record, server, soundTtsServer, soundCloneServer})
        // const videoServerInfo = await serverStore.serverInfo(server)
        // console.log('VideoGenFlow.runFunc.serverInfoc', serverInfo)
        await TaskService.update(bizId as any, {
            status: 'wait',
        })
        let audioFilePath: string | null = null
        if (record.modelConfig.soundType === 'SoundTts') {
            const res = await window.$mapi.server.callFunctionWithException(soundTtsServerInfo, 'soundTts', {
                id: serverStore.generateTaskId('VideoGenFlow', bizId),
                result: record.result,
                param: record.modelConfig.soundTts.param,
                text: record.modelConfig.text,
            }, {
                taskIdResultKey: 'soundTtsTaskId',
            })
            // console.log('VideoGenFlow.runFunc.soundTts.res', res)
            if (res.code) {
                throw res.msg || 'apiRequest videoGenFlow.soundTts fail'
            }
            switch (res.data.type) {
                case 'success':
                    await TaskService.update(bizId as any, {
                        jobResult: {
                            soundTts: res
                        },
                        result: {
                            url: null
                        }
                    })
                    audioFilePath = res.data.data.url
                    break;
                case 'retry':
                    return 'retry'
                default:
                    throw new Error('unknown res.data.type')
            }
        } else if (record.modelConfig.soundType === 'SoundClone') {
            const serverInfo = await serverStore.serverInfo(soundCloneServer)
            const res = await window.$mapi.server.callFunctionWithException(serverInfo, 'soundClone', {
                id: serverStore.generateTaskId('VideoGenFlow', bizId),
                result: record.result,
                param: record.modelConfig.soundClone.param,
                text: record.modelConfig.text,
                promptAudio: record.modelConfig.soundClone.promptUrl,
                promptText: record.modelConfig.soundClone.promptText,
            }, {
                taskIdResultKey: 'soundCloneTaskId',
            })
            // console.log('VideoGenFlow.runFunc.soundClone.res', res)
            if (res.code) {
                throw res.msg || 'apiRequest videoGenFlow.soundClone fail'
            }
            switch (res.data.type) {
                case 'success':
                    await TaskService.update(bizId as any, {
                        jobResult: {
                            soundClone: res
                        },
                        result: {
                            url: null
                        }
                    })
                    audioFilePath = res.data.data.url
                    break
                case 'querying':
                    await TaskService.update(bizId as any, {
                        jobResult: {
                            soundTts: res
                        },
                    })
                    return 'querying'
                case 'retry':
                    return 'retry'
                default:
                    throw new Error('unknown res.data.type')
            }
        } else {
            throw new Error('unknown soundType')
        }
        if (!audioFilePath) {
            throw new Error('soundFilePath not found')
        }
        const urlSound = await DataService.saveFile(audioFilePath)
        await TaskService.update(bizId as any, {
            result: {
                urlSound,
            }
        })
        // console.log('VideoGenFlow.runFunc.urlSound', urlSound)
        const res = await window.$mapi.server.callFunctionWithException(serverInfo, 'videoGen', {
            id: serverStore.generateTaskId('VideoGenFlow', bizId),
            result: record.result,
            param: record.param,
            video: record.modelConfig.videoUrl,
            audio: urlSound,
        }, {
            taskIdResultKey: 'videoGenTaskId',
        })
        // console.log('VideoGen.runFunc.res', res)
        if (res.code) {
            throw res.msg || 'apiRequest videoGenFlow fail'
        }
        switch (res.data.type) {
            case 'success':
                await TaskService.update(bizId as any, {
                    status: 'success',
                    jobResult: {
                        videoGen: res
                    },
                })
                return 'success'
            case 'retry':
                return 'retry'
            default:
                throw new Error('unknown res.data.type')
        }
    },
    successFunc: async (bizId, bizParam) => {
        // console.log('VideoGenFlow.successFunc', {bizId, bizParam})
        const {record} = await prepareData(bizId, bizParam)
        // console.log('VideoGenFlow.successFunc.record', {record, server, soundTtsServer, soundCloneServer})
        await TaskService.update(bizId as any, {
            status: 'success',
            endTime: Date.now(),
            result: {
                url: await DataService.saveFile(record.jobResult.videoGen.data.data.url)
            }
        })
    },
    failFunc: async (bizId, msg, bizParam) => {
        // console.log('VideoGenFlow.failFunc', {bizId, bizParam, msg})
        // const {record, server, soundTtsServer, soundCloneServer} = await prepareData(bizId, bizParam)
        await TaskService.update(bizId as any, {
            status: 'fail',
            statusMsg: msg,
            endTime: Date.now(),
        })
    },
}

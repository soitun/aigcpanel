import {TaskBiz} from "../store/modules/task";
import {useServerStore} from "../store/modules/server";
import {VideoTemplateService} from "../service/VideoTemplateService";
import {TaskService} from "../service/TaskService";
import {DataService} from "../service/DataService";

const serverStore = useServerStore()

const prepareData = async (bizId, bizParam) => {
    const record = await TaskService.get(bizId as any)
    // console.log('VideoGenFlow.runFunc.record', record)
    if (!record) {
        throw new Error('record not found')
    }
    let videoServer, soundTtsServer, soundCloneServer
    videoServer = await serverStore.getByNameVersion(record.serverName, record.serverVersion)
    // console.log('VideoGen.runFunc.server', server)
    if (!videoServer) {
        throw new Error('server not found')
    }
    if (record.modelConfig.soundType === 'soundTts') {
        soundTtsServer = await serverStore.getByNameVersion(record.modelConfig.soundTts.serverName, record.modelConfig.soundTts.serverVersion)
        if (!soundTtsServer) {
            throw new Error('soundTtsServer not found')
        }
    } else if (record.modelConfig.soundType === 'soundClone') {
        soundCloneServer = await serverStore.getByNameVersion(record.modelConfig.soundClone.serverName, record.modelConfig.soundClone.serverVersion)
        if (!soundCloneServer) {
            throw new Error('soundCloneServer not found')
        }
    }
    return {
        record,
        videoServer,
        soundTtsServer,
        soundCloneServer,
    }
}
export const VideoGenFlow: TaskBiz = {

    restore: async () => {
        await TaskService.restoreForTask('VideoGenFlow')
    },

    runFunc: async (bizId, bizParam) => {
        // console.log('VideoGenFlow.runFunc', {bizId, bizParam})
        const {record, videoServer, soundTtsServer, soundCloneServer} = await prepareData(bizId, bizParam)
        // console.log('VideoGenFlow.runFunc.record', {record, videoServer, soundTtsServer, soundCloneServer})
        // const videoServerInfo = await serverStore.serverInfo(videoServer)
        // console.log('VideoGenFlow.runFunc.serverInfo', serverInfo)
        await TaskService.update(bizId as any, {
            status: 'wait',
        })
        let soundFilePath
        if (record.modelConfig.soundType === 'soundTts') {
            const serverInfo = await serverStore.serverInfo(soundTtsServer)
            const res = await window.$mapi.server.callFunctionWithException(serverInfo, 'soundTts', {
                id: `VideoGenFlow_${bizId}`,
                text: record.modelConfig.text,
                param: record.modelConfig.soundTts.param,
                result: record.result,
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
                    soundFilePath = res.data.data.filePath
                    break;
                case 'querying':
                    await TaskService.update(bizId as any, {
                        status: 'running',
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
        } else if (record.modelConfig.soundType === 'soundClone') {
            const serverInfo = await serverStore.serverInfo(soundCloneServer)
            const res = await window.$mapi.server.callFunctionWithException(serverInfo, 'soundClone', {
                id: `VideoGenFlow_${bizId}`,
                text: record.modelConfig.text,
                promptAudio: record.modelConfig.soundClone.promptWav,
                promptText: record.modelConfig.soundClone.promptText,
                param: record.modelConfig.soundClone.param,
                result: record.result,
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
                    soundFilePath = res.data.data.filePath
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
        if (!soundFilePath) {
            throw new Error('soundFilePath not found')
        }
        const urlSound = await DataService.saveFile(soundFilePath, {
            ext: 'wav'
        })
        await TaskService.update(bizId as any, {
            result: {
                urlSound,
            }
        })
        const videoTemplate = await VideoTemplateService.get(record.modelConfig.videoTemplateId)
        if (!videoTemplate) {
            throw new Error('VideoTemplateEmpty')
        }
        const videoServerInfo = await serverStore.serverInfo(videoServer)
        const res = await window.$mapi.server.callFunctionWithException(videoServerInfo, 'videoGen', {
            id: `VideoGen_${bizId}`,
            videoFile: videoTemplate?.video,
            soundFile: urlSound,
            param: record.param,
            result: record.result,
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
            case 'querying':
                return 'querying'
            case 'retry':
                return 'retry'
        }
        throw new Error('unknown res.data.type')
    },
    queryFunc: async (bizId, bizParam) => {
        // console.log('VideoGenFlow.queryFunc', {bizId, bizParam})
        const {record, videoServer, soundTtsServer, soundCloneServer} = await prepareData(bizId, bizParam)
        // console.log('VideoGenFlow.queryFunc.record', {record, videoServer, soundTtsServer, soundCloneServer})
        if (record.result.videoGenTaskId) {
            const serverInfo = await serverStore.serverInfo(videoServer)
            const res = await window.$mapi.server.callFunctionWithException(serverInfo, 'query', {
                id: `VideoGen_${bizId}`,
                result: record.result,
            }, {
                taskIdResultKey: 'videoGenTaskId'
            })
            // console.log('VideoGenFlow.queryFunc.videoGen.res', res)
            if (res.code) {
                throw res.msg || 'VideoGen query fail'
            }
            // console.log('VideoGen.queryFunc.res', res)
            switch (res.data.type) {
                case 'success':
                    await TaskService.update(bizId as any, {
                        status: 'success',
                        jobResult: {
                            videoGen: res,
                        },
                    })
                    return 'success'
                case 'running':
                    return 'running'
            }
            return 'fail'
        }
        let soundFilePath = null
        if (record.result.soundTtsTaskId) {
            const serverInfo = await serverStore.serverInfo(soundTtsServer)
            const res = await window.$mapi.server.callFunctionWithException(serverInfo, 'query', {
                id: `VideoGen_${bizId}`,
                result: record.result,
            }, {
                taskIdResultKey: 'soundTtsTaskId'
            })
            // console.log('VideoGenFlow.queryFunc.soundTts.res', res)
            switch (res.data.type) {
                case 'success':
                    await TaskService.update(bizId as any, {
                        jobResult: {
                            soundTts: res
                        },
                    })
                    soundFilePath = res.data.data.filePath
                    break
                case 'running':
                    return 'running'
                default:
                    return 'fail'
            }
        } else if (record.result.soundCloneTaskId) {
            const serverInfo = await serverStore.serverInfo(soundCloneServer)
            const res = await window.$mapi.server.callFunctionWithException(serverInfo, 'query', {
                id: `VideoGen_${bizId}`,
                result: record.result,
            }, {
                taskIdResultKey: 'soundCloneTaskId'
            })
            // console.log('VideoGenFlow.queryFunc.soundClone.res', res)
            switch (res.data.type) {
                case 'success':
                    await TaskService.update(bizId as any, {
                        jobResult: {
                            soundClone: res
                        },
                    })
                    soundFilePath = res.data.data.filePath
                    break
                case 'running':
                    return 'running'
                default:
                    return 'fail'
            }
        }
        if (!soundFilePath) {
            throw new Error('soundFilePath not found')
        }
        const urlSound = await DataService.saveFile(soundFilePath, {
            ext: 'wav'
        })
        await TaskService.update(bizId as any, {
            result: {
                urlSound,
            }
        })
        const videoTemplate = await VideoTemplateService.get(record.modelConfig.videoTemplateId)
        if (!videoTemplate) {
            throw new Error('VideoTemplateEmpty')
        }
        const videoServerInfo = await serverStore.serverInfo(videoServer)
        const res = await window.$mapi.server.callFunctionWithException(videoServerInfo, 'videoGen', {
            id: `VideoGen_${bizId}`,
            videoFile: videoTemplate?.video,
            soundFile: urlSound,
            param: record.param,
            result: record.result,
        }, {
            taskIdResultKey: 'videoGenTaskId',
        })
        // console.log('VideoGenFlow.queryFunc.videoGen.res', res)
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
            case 'querying':
                return 'running'
            case 'fail':
                return 'fail'
        }
        throw new Error('unknown res.data.type')
    },
    successFunc: async (bizId, bizParam) => {
        // console.log('VideoGenFlow.successFunc', {bizId, bizParam})
        const {record, videoServer, soundTtsServer, soundCloneServer} = await prepareData(bizId, bizParam)
        // console.log('VideoGenFlow.successFunc.record', {record, videoServer, soundTtsServer, soundCloneServer})
        await TaskService.update(bizId as any, {
            status: 'success',
            endTime: Date.now(),
            result: {
                url: await DataService.saveFile(record.jobResult.videoGen.data.data.filePath, {
                    ext: 'mp4'
                })
            }
        })
    },
    failFunc: async (bizId, msg, bizParam) => {
        // console.log('VideoGenFlow.failFunc', {bizId, bizParam, msg})
        // const {record, videoServer, soundTtsServer, soundCloneServer} = await prepareData(bizId, bizParam)
        await TaskService.update(bizId as any, {
            status: 'fail',
            statusMsg: msg,
            endTime: Date.now(),
        })
    },
    update: async (bizId, update) => {
        if ('startTime' in update) {
            const result = await TaskService.get(bizId as any)
            if (result?.startTime) {
                delete update.startTime
            }
        }
        await TaskService.update(bizId as any, update)
    }
}

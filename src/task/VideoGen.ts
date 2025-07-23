import {TaskBiz} from "../store/modules/task";
import {useServerStore} from "../store/modules/server";
import {VideoTemplateService} from "../service/VideoTemplateService";
import {TaskService} from "../service/TaskService";
import {DataService} from "../service/DataService";

const serverStore = useServerStore()

export const VideoGen: TaskBiz = {

    runFunc: async (bizId, bizParam) => {
        // console.log('VideoGen.runFunc', {bizId, bizParam})
        const {record, server, serverInfo} = await serverStore.prepareForTask(bizId, bizParam)
        // console.log('VideoGen.runFunc.serverInfo', serverInfo)
        await TaskService.update(bizId as any, {
            status: 'wait',
        })
        const videoTemplateRecord = await VideoTemplateService.get(record.modelConfig.videoTemplateId)
        if (!videoTemplateRecord) {
            throw new Error('VideoTemplateEmpty')
        }
        let audioFile: string | null = null
        if (record.modelConfig.soundType === 'soundTts') {
            const soundTtsRecord = await TaskService.get(record.modelConfig.soundTtsId)
            audioFile = soundTtsRecord?.result.url as string
        } else if (record.modelConfig.soundType === 'soundClone') {
            const soundCloneRecord = await TaskService.get(record.modelConfig.soundCloneId)
            audioFile = soundCloneRecord?.result.url as string
        } else if (record.modelConfig.soundType === 'soundCustom') {
            audioFile = record.modelConfig.soundCustomFile
        }
        if (!audioFile) {
            throw new Error('AudioFileEmpty')
        }
        const res = await window.$mapi.server.callFunctionWithException(serverInfo, 'videoGen', {
            id: serverStore.generateTaskId('VideoGen', bizId),
            result: record.result,
            param: record.param,
            video: videoTemplateRecord?.video,
            audio: audioFile,
        })
        // console.log('VideoGen.runFunc.res', res)
        if (res.code) {
            throw res.msg || 'apiRequest videoGen fail'
        }
        switch (res.data.type) {
            case 'success':
                await TaskService.update(bizId as any, {
                    status: 'success',
                    jobResult: res,
                })
                return 'success'
            case 'retry':
                return 'retry'
            default:
                throw `unknown res.data.type : ${res.data.type}`
        }
    },
    successFunc: async (bizId, bizParam) => {
        // console.log('VideoGen.successFunc', {bizId, bizParam})
        const {record} = await serverStore.prepareForTask(bizId, bizParam)
        // console.log('VideoGen.successFunc.record', {record, server})
        await TaskService.update(bizId as any, {
            status: 'success',
            endTime: Date.now(),
            result: {
                url: await DataService.saveFile(record.jobResult.data.data.url)
            }
        })
    },
    failFunc: async (bizId, msg, bizParam) => {
        // console.log('VideoGen.failFunc', {bizId, bizParam, msg})
        // const {record, server} = await prepareData(bizId, bizParam)
        await TaskService.update(bizId as any, {
            status: 'fail',
            statusMsg: msg,
            endTime: Date.now(),
        })
    },
}

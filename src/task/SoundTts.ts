import {TaskBiz} from "../store/modules/task";
import {useServerStore} from "../store/modules/server";
import {TaskService} from "../service/TaskService";
import {DataService} from "../service/DataService";

const serverStore = useServerStore()

const prepareData = async (bizId, bizParam) => {
    const record = await TaskService.get(bizId as any)
    // console.log('SoundTts.runFunc.record', record)
    if (!record) {
        throw new Error('record not found')
    }
    const server = await serverStore.getByNameVersion(record.serverName, record.serverVersion)
    // console.log('SoundTts.runFunc.server', server)
    if (!server) {
        throw new Error('server not found')
    }
    return {
        record,
        server,
    }
}
export const SoundTts: TaskBiz = {

    restore: async () => {
        await TaskService.restoreForTask('SoundTts')
    },

    runFunc: async (bizId, bizParam) => {
        // console.log('SoundTts.runFunc', {bizId, bizParam})
        const {record, server} = await prepareData(bizId, bizParam)
        const serverInfo = await serverStore.serverInfo(server)
        // console.log('SoundTts.runFunc.serverInfo', serverInfo)
        await TaskService.update(bizId as any, {
            status: 'wait',
        })
        const res = await window.$mapi.server.callFunctionWithException(serverInfo, 'soundTts', {
            id: `SoundTts_${bizId}`,
            text: record.modelConfig.text,
            param: record.param,
            result: record.result,
        })
        if (res.code) {
            throw res.msg || 'SoundTts run fail'
        }
        switch (res.data.type) {
            case 'success':
                await TaskService.update(bizId as any, {
                    status: 'success',
                    jobResult: res,
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
        // console.log('SoundTts.queryFunc', {bizId, bizParam})
        const {record, server} = await prepareData(bizId, bizParam)
        const serverInfo = await serverStore.serverInfo(server)
        const res = await window.$mapi.server.callFunctionWithException(serverInfo, 'query', {
            id: `SoundTts_${bizId}`,
            result: record.result,
        })
        if (res.code) {
            throw res.msg || 'SoundTts query fail'
        }
        // console.log('SoundTts.queryFunc.res', res)
        switch (res.data.type) {
            case 'success':
                await TaskService.update(bizId as any, {
                    status: 'success',
                    jobResult: res,
                })
                return 'success'
            case 'running':
                return 'running'
        }
        return 'fail'
    },
    successFunc: async (bizId, bizParam) => {
        const {record, server} = await prepareData(bizId, bizParam)
        await TaskService.update(bizId as any, {
            status: 'success',
            endTime: Date.now(),
            result: {
                url: await DataService.saveFile(record.jobResult.data.data.filePath)
            }
        })
    },
    failFunc: async (bizId, msg, bizParam) => {
        // console.log('SoundTts.failFunc', {bizId, bizParam, msg})
        // const {record, server} = await prepareData(bizId, bizParam)
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

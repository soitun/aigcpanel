import {TaskBiz} from "../store/modules/task";
import {useServerStore} from "../store/modules/server";
import {TaskService} from "../service/TaskService";

const serverStore = useServerStore()

const prepareData = async (bizId, bizParam) => {
    const record = await TaskService.get(bizId as any)
    // console.log('SoundClone.runFunc.record', record)
    if (!record) {
        throw new Error('record not found')
    }
    const server = await serverStore.getByNameVersion(record.serverName, record.serverVersion)
    // console.log('SoundClone.runFunc.server', server)
    if (!server) {
        throw new Error('server not found')
    }
    return {
        record,
        server,
    }
}
export const SoundClone: TaskBiz = {

    restore: async () => {
        await TaskService.restoreForTask('SoundClone')
    },

    runFunc: async (bizId, bizParam) => {
        // console.log('SoundClone.runFunc', {bizId, bizParam})
        const {record, server} = await prepareData(bizId, bizParam)
        const serverInfo = await serverStore.serverInfo(server)
        // console.log('runFunc', serverInfo, record)
        await TaskService.update(bizId as any, {
            status: 'wait',
        })
        const res = await window.$mapi.server.callFunctionWithException(serverInfo, 'soundClone', {
            id: `SoundClone_${bizId}`,
            text: record.modelConfig.text,
            promptAudio: record.modelConfig.promptWav,
            promptText: record.modelConfig.promptText,
            param: record.param,
            result: record.result,
        })
        if (res.code) {
            throw res.msg || 'apiRequest soundClone fail'
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
            id: `SoundClone_${bizId}`,
            result: record.result,
        })
        if (res.code) {
            throw res.msg || 'SoundClone query fail'
        }
        // console.log('SoundClone.queryFunc.res', res)
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
                url: await TaskService.saveFile(record.jobResult.data.data.filePath)
            }
        })
    },
    failFunc: async (bizId, msg, bizParam) => {
        // console.log('SoundClone.failFunc', {bizId, bizParam, msg})
        // const {record, server} = await prepareData(bizId, bizParam)
        await TaskService.update(bizId as any, {
            status: 'fail',
            statusMsg: msg,
            endTime: Date.now(),
        })
    },
    update: async (bizId, update) => {
        if ('result' in update) {
            const record = await TaskService.get(bizId as any)
            if (record) {
                update.result = Object.assign({}, record.result, update.result)
            }
        }
        await TaskService.update(bizId as any, update)
    }
}

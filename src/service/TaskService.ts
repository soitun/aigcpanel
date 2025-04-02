import {TimeUtil} from "../lib/util";
import {useTaskStore} from "../store/modules/task";

const taskStore = useTaskStore()

export type TaskBiz = 'SoundClone' | 'SoundTts' | 'VideoGen' | 'VideoGenFlow'

export type TaskRecord = {
    id?: number;

    biz: TaskBiz;

    title: string,

    status?: 'queue' | 'wait' | 'running' | 'success' | 'fail';
    statusMsg?: string;
    startTime?: number,
    endTime?: number | undefined,

    serverName: string;
    serverTitle: string;
    serverVersion: string;

    param?: any;
    jobResult?: any;
    modelConfig?: any;
    result?: any;

    runtime?: TaskRuntime,
}

export type TaskRuntime = {}

export const TaskService = {
    tableName() {
        return 'data_task'
    },
    decodeRecord(record: TaskRecord): TaskRecord | null {
        if (!record) {
            return null
        }
        return {
            ...record,
            param: JSON.parse(record.param ? record.param : '{}'),
            jobResult: JSON.parse(record.jobResult ? record.jobResult : '{}'),
            modelConfig: JSON.parse(record.modelConfig ? record.modelConfig : '{}'),
            result: JSON.parse(record.result ? record.result : '{}')
        } as TaskRecord
    },
    encodeRecord(record: TaskRecord): TaskRecord {
        if ('param' in record) {
            record.param = JSON.stringify(record.param || {})
        }
        if ('jobResult' in record) {
            record.jobResult = JSON.stringify(record.jobResult || {})
        }
        if ('modelConfig' in record) {
            record.modelConfig = JSON.stringify(record.modelConfig || {})
        }
        if ('result' in record) {
            record.result = JSON.stringify(record.result || {})
        }
        return record
    },
    async get(id: number): Promise<TaskRecord | null> {
        const record: any =
            await window.$mapi.db.first(`SELECT *
                                         FROM ${this.tableName()}
                                         WHERE id = ?`, [id])
        return this.decodeRecord(record)
    },
    async list(biz: TaskBiz): Promise<TaskRecord[]> {
        const records: TaskRecord[] =
            await window.$mapi.db.select(`SELECT *
                                          FROM ${this.tableName()}
                                          WHERE biz = ?
                                          ORDER BY id DESC`, [biz])
        return records.map(this.decodeRecord) as TaskRecord[]
    },
    async restoreForTask(biz: TaskBiz) {
        const records: TaskRecord[] =
            await window.$mapi.db.select(`SELECT *
                                          FROM ${this.tableName()}
                                          WHERE biz = ?
                                            AND (status = 'running' OR status = 'wait' OR status = 'queue')
                                          ORDER BY id DESC`, [biz])
        // console.log('TaskService.restoreForTask', records.length)
        for (let record of records) {
            let status = record.status === 'running' ? 'querying' : 'queue'
            await taskStore.dispatch(record.biz, record.id as any, {}, {
                status: status,
                runStart: record.startTime,
                queryInterval: 5 * 1000,
            })
        }
    },
    async submit(record: TaskRecord) {
        record.status = 'queue'
        record.startTime = TimeUtil.timestampMS()
        const fields = [
            'biz', 'title',
            'status', 'statusMsg', 'startTime', 'endTime',
            'serverName', 'serverTitle', 'serverVersion',
            'param', 'modelConfig',
        ]
        record = this.encodeRecord(record)
        const values = fields.map(f => record[f])
        const valuesPlaceholder = fields.map(f => '?')
        const id = await window.$mapi.db.insert(`INSERT INTO ${this.tableName()} (${fields.join(',')})
                                                 VALUES (${valuesPlaceholder.join(',')})`, values)
        await taskStore.dispatch(record.biz, id, {}, {
            queryInterval: 5 * 1000
        })
    },
    async update(id: number, record: Partial<TaskRecord>) {
        if ('result' in record || 'jobResult' in record) {
            const recordOld = await this.get(id)
            if ('result' in record) {
                record.result = Object.assign(recordOld?.result, record.result)
            }
            if ('jobResult' in record) {
                record.jobResult = Object.assign(recordOld?.jobResult, record.jobResult)
            }
        }
        record = this.encodeRecord(record as TaskRecord)
        const fields = Object.keys(record)
        const values = fields.map(f => record[f])
        const set = fields.map(f => `${f} = ?`).join(',')
        return await window.$mapi.db.execute(`UPDATE ${this.tableName()}
                                              SET ${set}
                                              WHERE id = ?`, [...values, id])
    },
    async delete(record: TaskRecord) {
        const filesForClean: string[] = []
        if (record.result) {
            if (record.result.url) {
                filesForClean.push(record.result.url)
            }
            if (record.result.urlSound) {
                filesForClean.push(record.result.urlSound)
            }
        }
        if (record.modelConfig) {
            if (record.modelConfig.soundCustomFile) {
                filesForClean.push(record.modelConfig.soundCustomFile)
            }
        }
        for (const file of filesForClean) {
            const f = window.$mapi.file.absolutePath(file)
            await window.$mapi.file.deletes(f)
        }
        await window.$mapi.db.delete(`DELETE
                                      FROM ${this.tableName()}
                                      WHERE id = ?`, [record.id])
    },
    async count(biz: TaskBiz, startTime: number = 0, endTime: number = 0) {
        let sql = `SELECT COUNT(*) as cnt
                   FROM ${this.tableName()}
                   WHERE biz = ?`
        let params: any[] = [biz]
        if (startTime > 0) {
            sql += ` AND createdAt >= ?`
            params.push(startTime)
        }
        if (endTime > 0) {
            sql += ` AND createdAt <= ?`
            params.push(endTime)
        }
        const result = await window.$mapi.db.first(sql, params)
        return result.cnt
    }
}

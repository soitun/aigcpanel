import { StringUtil, TimeUtil } from "../lib/util";
import {
    NodeRunResult,
    WorkflowData,
    WorkflowStatus,
} from "../module/Workflow/core/type";
import { useTaskStore } from "../store/modules/task";
import { useWorkflowStore } from "../store/modules/workflow";

function extractStrings(obj: any): string[] {
    if (obj === null || obj === undefined) return [];
    if (typeof obj === "string") return [obj];
    if (Array.isArray(obj)) return obj.flatMap(extractStrings);
    if (typeof obj === "object")
        return Object.values(obj).flatMap(extractStrings);
    return [];
}

export type WorkflowRecord = {
    id?: number;
    createdAt?: number;
    updatedAt?: number;
    name: string;
    data: WorkflowData;
    thumb?: string;
};

export type WorkflowLogRecord = {
    id?: number;
    createdAt?: number;
    updatedAt?: number;
    workflowId: number;
    seqId?: number;
    pauseByType?: "task" | "";
    pauseById?: string;
    name?: string;
    data: WorkflowData;
    status: WorkflowStatus;
    statusMsg?: string;
    startTime?: number;
    endTime?: number;
};

const taskStore = useTaskStore();
const workflowStore = useWorkflowStore();

export const WorkflowService = {
    tableName() {
        return "workflow";
    },
    decodeRecord(record: any): WorkflowRecord | null {
        if (!record) {
            return null;
        }
        return {
            ...record,
            data: JSON.parse(record.data ? record.data : "{}"),
        } as WorkflowRecord;
    },
    encodeRecord(record: WorkflowRecord): any {
        const encoded: any = { ...record };
        if ("data" in encoded) {
            encoded.data = JSON.stringify(encoded.data || {});
        }
        return encoded;
    },
    async get(id: number | string): Promise<WorkflowRecord | null> {
        const record: any = await $mapi.db.first(
            `SELECT *
             FROM ${this.tableName()}
             WHERE id = ?`,
            [id],
        );
        return this.decodeRecord(record);
    },
    async getLatest(
        workflowId: number | string,
    ): Promise<WorkflowLogRecord | null> {
        const record: any = await $mapi.db.first(
            `SELECT *
             FROM ${WorkflowLogService.tableName()}
             WHERE workflowId = ?
             ORDER BY id DESC
             LIMIT 1`,
            [workflowId],
        );
        return WorkflowLogService.decodeRecord(record);
    },
    async list(): Promise<WorkflowRecord[]> {
        const records: WorkflowRecord[] = await $mapi.db.select(
            `SELECT *
             FROM ${this.tableName()}
             ORDER BY updatedAt DESC`,
        );
        records.map((record) => this.decodeRecord(record));
        return records;
    },
    async insert(record: WorkflowRecord): Promise<number> {
        record = this.encodeRecord(record);
        const fields = Object.keys(record);
        const values = fields.map((f) => record[f]);
        const valuesPlaceholder = fields.map((f) => "?");
        return await $mapi.db.insert(
            `INSERT INTO ${this.tableName()} (${fields.join(",")})
             VALUES (${valuesPlaceholder.join(",")})`,
            values,
        );
    },
    async update(
        id: number | string,
        record: Partial<WorkflowRecord>,
    ): Promise<void> {
        record = this.encodeRecord(record as WorkflowRecord);
        const fields = Object.keys(record);
        const values = fields.map((f) => record[f]);
        const set = fields.map((f) => `${f} = ?`).join(",");
        await $mapi.db.execute(
            `UPDATE ${this.tableName()}
             SET ${set}
             WHERE id = ?`,
            [...values, id],
        );
    },
    async delete(id: number | string): Promise<void> {
        await $mapi.db.execute(
            `DELETE
             FROM ${this.tableName()}
             WHERE id = ?`,
            [id],
        );
    },
    async count(): Promise<number> {
        const result = await $mapi.db.first(
            `SELECT COUNT(*) as cnt FROM ${this.tableName()}`,
            [],
        );
        return result.cnt;
    },
};

export const WorkflowLogService = {
    tableName() {
        return "workflow_log";
    },
    decodeRecord(record: any): WorkflowLogRecord | null {
        if (!record) {
            return null;
        }
        return {
            ...record,
            data: JSON.parse(record.data ? record.data : "{}"),
        } as WorkflowLogRecord;
    },
    encodeRecord(record: WorkflowLogRecord): any {
        const encoded: any = { ...record };
        if ("data" in encoded) {
            const data = JSON.parse(JSON.stringify(encoded.data || {}));
            data?.nodes?.forEach((node) => {
                delete node.properties.runRuntime;
            });
            encoded.data = JSON.stringify(data);
        }
        if ("pauseById" in encoded) {
            encoded.pauseById = encoded.pauseById || "";
            if (typeof encoded.pauseById !== "string") {
                encoded.pauseById = encoded.pauseById + "";
            }
        }
        return encoded;
    },
    async get(id: number | string): Promise<WorkflowLogRecord | null> {
        const record: any = await $mapi.db.first(
            `SELECT *
             FROM ${this.tableName()}
             WHERE id = ?`,
            [id],
        );
        return this.decodeRecord(record);
    },
    async getByPause(
        pauseByType: NodeRunResult["pauseByType"],
        pauseById: string,
    ): Promise<WorkflowLogRecord | null> {
        const record: any = await $mapi.db.first(
            `SELECT *
             FROM ${this.tableName()}
             WHERE pauseByType = ?
               AND pauseById = ?
             ORDER BY createdAt DESC
             LIMIT 1`,
            [pauseByType, pauseById],
        );
        return this.decodeRecord(record);
    },
    async getLatestByWorkflowId(
        workflowId: number,
    ): Promise<WorkflowLogRecord | null> {
        const record: any = await $mapi.db.first(
            `SELECT *
             FROM ${this.tableName()}
             WHERE workflowId = ?
             ORDER BY createdAt DESC
             LIMIT 1`,
            [workflowId],
        );
        return this.decodeRecord(record);
    },
    async listByWorkflowId(workflowId: number): Promise<WorkflowLogRecord[]> {
        const records: any[] = await $mapi.db.select(
            `SELECT *
             FROM ${this.tableName()}
             WHERE workflowId = ?
             ORDER BY createdAt DESC`,
            [workflowId],
        );
        return records
            .map((record) => this.decodeRecord(record))
            .filter(Boolean) as WorkflowLogRecord[];
    },
    async insert(record: WorkflowLogRecord): Promise<number> {
        // 自动计算seqId
        if (record.seqId === undefined) {
            const maxSeqId = await $mapi.db.first(
                `SELECT MAX(seqId) as maxSeq
                 FROM ${this.tableName()}
                 WHERE workflowId = ?`,
                [record.workflowId],
            );
            record.seqId = (maxSeqId?.maxSeq || 0) + 1;
        }
        // 自动生成name
        if (!record.name) {
            record.name =
                TimeUtil.datetimeString() + "_" + StringUtil.random(4);
        }
        record = this.encodeRecord(record);
        const fields = Object.keys(record);
        const values = fields.map((f) => record[f]);
        const valuesPlaceholder = fields.map((f) => "?");
        return await $mapi.db.insert(
            `INSERT INTO ${this.tableName()} (${fields.join(",")})
             VALUES (${valuesPlaceholder.join(",")})`,
            values,
        );
    },
    async update(
        id: number | string,
        record: Partial<WorkflowLogRecord>,
    ): Promise<void> {
        record = this.encodeRecord(record as WorkflowLogRecord);
        const fields = Object.keys(record);
        const values = fields.map((f) => record[f]);
        const set = fields.map((f) => `${f} = ?`).join(",");
        await $mapi.db.execute(
            `UPDATE ${this.tableName()}
             SET ${set}
             WHERE id = ?`,
            [...values, id],
        );
    },
    async count(startTime: number = 0, endTime: number = 0): Promise<number> {
        let sql = `SELECT COUNT(*) as cnt FROM ${this.tableName()}`;
        const params: any[] = [];
        const wheres: string[] = [];
        if (startTime > 0) {
            wheres.push("createdAt >= ?");
            params.push(startTime);
        }
        if (endTime > 0) {
            wheres.push("createdAt <= ?");
            params.push(endTime);
        }
        if (wheres.length > 0) {
            sql += " WHERE " + wheres.join(" AND ");
        }
        const result = await $mapi.db.first(sql, params);
        return result.cnt;
    },
    async deleteByWorkflowId(workflowId: number | string): Promise<void> {
        const records: WorkflowLogRecord[] = await $mapi.db.select(
            `SELECT * FROM ${this.tableName()} WHERE workflowId = ?`,
            [workflowId],
        );
        for (const raw of records) {
            const record = this.decodeRecord(raw);
            if (record) await this._cleanHubFiles(record);
        }
        await $mapi.db.execute(
            `DELETE
             FROM ${this.tableName()}
             WHERE workflowId = ?`,
            [workflowId],
        );
    },
    async delete(id: number | string): Promise<void> {
        const raw = await $mapi.db.first(
            `SELECT * FROM ${this.tableName()} WHERE id = ?`,
            [id],
        );
        const record = this.decodeRecord(raw);
        await $mapi.db.execute(
            `DELETE
             FROM ${this.tableName()}
             WHERE id = ?`,
            [id],
        );
        if (record) await this._cleanHubFiles(record);
    },
    async _cleanHubFiles(record: WorkflowLogRecord): Promise<void> {
        const candidates = extractStrings(record.data).filter(
            (s) =>
                s.length > 4 &&
                (s.includes("/") || s.includes("\\")) &&
                /\.[a-zA-Z0-9]{2,5}$/.test(s),
        );
        for (const file of candidates) {
            const normalFile = file.replace(/\\/g, "/");
            if (!(await $mapi.file.isHubFile(normalFile))) continue;
            const referenced = await $mapi.db.isFileReferenced(
                normalFile,
                this.tableName(),
                0,
            );
            if (!referenced) {
                await $mapi.file.deletes(normalFile);
            }
        }
    },
    async restoreForTask() {
        const records: WorkflowLogRecord[] = await $mapi.db.select(
            `SELECT *
             FROM ${this.tableName()}
             WHERE (status = 'running')
             ORDER BY id DESC`,
        );
        // console.log('TaskService.restoreForTask', records.length)
        for (let record of records) {
            record = this.decodeRecord(record) as WorkflowLogRecord;
            await workflowStore.submit(
                record.workflowId,
                record.id!,
                record.data,
            );
        }
    },
};

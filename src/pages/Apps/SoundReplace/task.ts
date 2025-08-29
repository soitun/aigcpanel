import {t} from "../../../lang";
import {ObjectUtil} from "../../../lib/util";
import {TaskRecord, TaskService, TaskType} from "../../../service/TaskService";
import {useServerStore} from "../../../store/modules/server";
import {TaskBiz, TaskChangeType, useTaskStore} from "../../../store/modules/task";
import {SoundReplaceJobResultType, SoundReplaceModelConfigType} from "./type";
import {ffmpegCombineVideoAudio, ffmpegMergeAudio, ffmpegVideoToAudio} from "../../../lib/ffmpeg";
import {serverSoundAsr, serverSoundGenerate} from "../../../lib/server";

const serverStore = useServerStore();
const taskStore = useTaskStore();

export const SoundReplaceRun = async (
    data: {
        taskId: string,
        title: string,
        video: string,
        soundAsr: SoundAsrParamType,
        soundGenerate: SoundGenerateParamType,
    }
): Promise<{
    taskId: string,
    result: () => Promise<{
        code: number,
        msg: string,
        data?: { status: 'success' | 'pause', video: string }
    }>,
}> => {
    console.log('SoundReplace.Run', data);
    let taskId = data.taskId;
    if (!taskId) {
        const record: TaskRecord = {
            type: TaskType.System,
            biz: "SoundReplace",
            title: data.title,
            serverName: "",
            serverTitle: "",
            serverVersion: "",
            modelConfig: {
                video: data.video,
                soundAsr: data.soundAsr,
                soundGenerate: data.soundGenerate,
            },
            param: {},
        };
        taskId = await TaskService.submit(record);
    }
    const result = () => {
        return new Promise<{
            code: number,
            msg: string,
            data?: { status: 'success' | 'pause', video: string }
        }>(resolve => {
            const callback = (bizId: string, type: TaskChangeType) => {
                if (bizId !== taskId) {
                    return;
                }
                TaskService.get(bizId).then(task => {
                    if (!task) {
                        resolve({code: -1, msg: t("任务不存在")});
                        taskStore.offChange('SoundReplace', callback);
                        return;
                    }
                    if (task.status === 'success') {
                        resolve({code: 0, msg: 'ok', data: {status: 'success', video: task.result.url}});
                        taskStore.offChange('SoundReplace', callback);
                        return;
                    }
                    if (task.status === 'pause') {
                        resolve({code: 0, msg: '', data: {status: 'pause', video: ''}});
                        taskStore.offChange('SoundReplace', callback);
                        return;
                    }
                    if (task.status === 'fail') {
                        resolve({code: -1, msg: task.statusMsg || t("任务失败")});
                        taskStore.offChange('SoundReplace', callback);
                        return;
                    }
                }).catch(error => {
                    resolve({code: -1, msg: '' + error || t("任务获取失败")});
                    taskStore.offChange('SoundReplace', callback);
                })
            }
            taskStore.onChange('SoundReplace', callback);
            callback(taskId, null!);
        })
    };
    return {
        taskId,
        result,
    }
}

export const SoundReplace: TaskBiz = {
    runFunc: async (bizId, bizParam) => {
        console.log("SoundReplace.runFunc", {bizId, bizParam});
        const {record} = await serverStore.prepareForTask(bizId, bizParam);
        const modelConfig: SoundReplaceModelConfigType = record.modelConfig;
        const jobResult: SoundReplaceJobResultType = record.jobResult;

        jobResult.step = jobResult.step || "ToAudio";
        jobResult.ToAudio = jobResult.ToAudio || {};
        jobResult.SoundAsr = jobResult.SoundAsr || {};
        jobResult.Confirm = jobResult.Confirm || {};
        jobResult.SoundGenerate = jobResult.SoundGenerate || {};
        jobResult.Combine = jobResult.Combine || {};
        if (jobResult.step === "ToAudio") {
            console.log("SoundReplace.ToAudio", jobResult);
            await TaskService.update(bizId, {
                status: "running",
                jobResult,
            });
            taskStore.fireChange({biz: "SoundReplace", bizId}, "running");
            const output = await ffmpegVideoToAudio(modelConfig.video);
            jobResult.ToAudio.file = await window.$mapi.file.hubSave(output, {
                saveGroup: "part",
                cleanOld: true,
            });
            jobResult.step = "SoundAsr";
            await TaskService.update(bizId, {jobResult});
        }

        if (jobResult.step === "SoundAsr") {
            console.log("SoundReplace.SoundAsr", jobResult);
            await TaskService.update(bizId, {
                status: "running",
                jobResult,
            });
            taskStore.fireChange({biz: "SoundReplace", bizId}, "running");
            const ret = await serverSoundAsr(
                "SoundReplace",
                bizId,
                modelConfig.soundAsr,
                jobResult.SoundAsr,
                jobResult.ToAudio.file
            );
            console.log("SoundReplace.SoundAsr.ret", ret);
            if (ret.type === "retry") {
                return ret.type;
            }
            jobResult.SoundAsr.start = ret.start;
            jobResult.SoundAsr.end = ret.end;
            jobResult.SoundAsr.records = ret.records;
            await TaskService.update(bizId, {jobResult});
            jobResult.step = "Confirm";
            await TaskService.update(bizId, {jobResult});
        }

        if (jobResult.step === "Confirm") {
            console.log("SoundReplace.Confirm", jobResult);
            jobResult.Confirm.records = ObjectUtil.clone(jobResult.SoundAsr.records);
            jobResult.Confirm.confirm = false;
            await TaskService.update(bizId, {jobResult});
            return "success";
        }

        if (jobResult.step === "SoundGenerate") {
            console.log("SoundReplace.SoundGenerate", jobResult);
            if (!jobResult.SoundGenerate.records) {
                jobResult.SoundGenerate.records = jobResult.Confirm.records.map(item => ({
                    ...item,
                    audio: "",
                }));
            }
            await TaskService.update(bizId, {jobResult});
            await TaskService.update(bizId, {
                status: "running",
            });
            taskStore.fireChange({biz: "SoundReplace", bizId}, "running");
            for (const record of jobResult.SoundGenerate.records) {
                if (record.audio) {
                    continue;
                }
                const ret = await serverSoundGenerate(
                    "SoundReplace",
                    bizId,
                    modelConfig.soundGenerate,
                    {},
                    record.text
                );
                if (ret.type === "retry") {
                    return ret.type;
                }
                record.audio = await window.$mapi.file.hubSave(ret.url, {
                    saveGroup: "part",
                    cleanOld: true,
                });
                await TaskService.update(bizId, {jobResult});
            }
            jobResult.step = "Combine";
            await TaskService.update(bizId, {jobResult});
        }

        if (jobResult.step === "Combine") {
            console.log("SoundReplace.Combine", jobResult);
            jobResult.Combine.audio = "";
            jobResult.Combine.file = "";
            await TaskService.update(bizId, {
                status: "running",
                jobResult,
            });
            taskStore.fireChange({biz: "SoundReplace", bizId}, "running");
            const videoDurationMs = await window.$mapi.ffmpeg.getMediaDuration(modelConfig.video, true);
            const filesToClean: string[] = [];
            try {
                // 创建合并后的音频文件
                const {output, cleans} = await ffmpegMergeAudio(jobResult.SoundGenerate.records, videoDurationMs);
                filesToClean.push(...cleans);
                jobResult.Combine.audio = await window.$mapi.file.hubSave(output, {
                    saveGroup: "part",
                    cleanOld: true,
                });
                await TaskService.update(bizId, {jobResult});
                // 使用合并后的音频替换视频的音频轨道
                const url = await ffmpegCombineVideoAudio(modelConfig.video, jobResult.Combine.audio);
                jobResult.Combine.file = await window.$mapi.file.hubSave(url, {
                    saveGroup: "part",
                    cleanOld: true,
                });
                jobResult.step = "End";
                await TaskService.update(bizId, {
                    jobResult,
                });
                return "success";
            } catch (error) {
                throw error;
            } finally {
                await window.$mapi.file.clean(filesToClean, {isFullPath: true});
            }
        }

        throw `SoundReplace.runFunc: unknown jobResult.step: ${jobResult.step}`;
    },
    successFunc: async (bizId, bizParam) => {
        const {record} = await serverStore.prepareForTask(bizId, bizParam);
        const jobResult: SoundReplaceJobResultType = record.jobResult;
        if (jobResult.step === "Confirm") {
            await TaskService.update(bizId, {
                status: "pause",
                statusMsg: t("任务未完成，需要手动确认文字"),
            });
        } else if (jobResult.step === "End") {
            await TaskService.update(bizId, {
                status: "success",
                endTime: Date.now(),
                result: {
                    url: await window.$mapi.file.hubSave(jobResult.Combine.file),
                },
            });
        } else {
            window.$mapi.log.error("SoundReplace.successFunc: unknown jobResult.step", jobResult.step);
        }
    },
    failFunc: async (bizId, msg, bizParam) => {
        // console.log('SoundReplace.failFunc', {bizId, bizParam, msg})
        await TaskService.update(bizId, {
            status: "fail",
            statusMsg: msg,
            endTime: Date.now(),
        });
    },
    update: async (bizId, data, bizParam) => {
        console.log("SoundReplace.update", {bizId, data, bizParam});
    },
};

import {t} from "../../../lang";
import {ObjectUtil} from "../../../lib/util";
import {TaskService} from "../../../service/TaskService";
import {useServerStore} from "../../../store/modules/server";
import {TaskBiz, useTaskStore} from "../../../store/modules/task";
import {SoundReplaceJobResultType, SoundReplaceModelConfigType} from "./type";
import {ffmpegCombineVideoAudio, ffmpegMergeAudio, ffmpegVideoToAudio} from "../../../lib/ffmpeg";
import {serverSoundAsr, serverSoundGenerate} from "../../../lib/server";

const serverStore = useServerStore();
const taskStore = useTaskStore();

export const SoundReplace: TaskBiz = {
    runFunc: async (bizId, bizParam) => {
        console.log("SoundReplace.runFunc", {bizId, bizParam});
        const {record} = await serverStore.prepareForTask(bizId, bizParam);
        const modelConfig: SoundReplaceModelConfigType = record.modelConfig;
        const jobResult: SoundReplaceJobResultType = record.jobResult;

        jobResult.step = jobResult.step || "ToAudio";
        if (jobResult.step === "ToAudio") {
            jobResult.ToAudio = jobResult.ToAudio || {}
            // console.log('SoundReplace.runFunc.serverInfo', serverInfo)
            await TaskService.update(bizId, {
                status: "running",
                jobResult,
            });
            taskStore.fireChange({biz: "SoundReplace", bizId}, "running");
            jobResult.ToAudio.file = await ffmpegVideoToAudio(modelConfig.video);
            jobResult.step = "SoundAsr";
            await TaskService.update(bizId, {jobResult});
        }

        if (jobResult.step === "SoundAsr") {
            jobResult.SoundAsr = jobResult.SoundAsr || {};
            await TaskService.update(bizId, {
                status: "running",
            });
            taskStore.fireChange({biz: "SoundReplace", bizId}, "running");
            const ret = await serverSoundAsr(
                "SoundReplace",
                bizId,
                modelConfig.soundAsr,
                jobResult.SoundAsr,
                jobResult.ToAudio.file
            )
            if (ret.type === 'retry') {
                return ret.type
            }
            jobResult.SoundAsr.start = ret.start
            jobResult.SoundAsr.end = ret.end
            jobResult.SoundAsr.records = ret.records
            await TaskService.update(bizId, {jobResult});
            jobResult.step = "Confirm";
            await TaskService.update(bizId, {jobResult});
        }

        if (jobResult.step === "Confirm") {
            jobResult.Confirm = jobResult.Confirm || {};
            jobResult.Confirm.records = ObjectUtil.clone(jobResult.SoundAsr.records);
            jobResult.Confirm.confirm = false;
            await TaskService.update(bizId, {jobResult});
            return "success";
        }

        if (jobResult.step === "SoundGenerate") {
            jobResult.SoundGenerate = jobResult.SoundGenerate || {};
            jobResult.SoundGenerate.records = jobResult.Confirm.records.map(item => ({
                ...item,
                audio: "",
            }));
            await TaskService.update(bizId, {jobResult});
            await TaskService.update(bizId, {
                status: "running",
            });
            taskStore.fireChange({biz: "SoundReplace", bizId}, "running");
            for (const record of jobResult.SoundGenerate.records) {
                if (record.audio) {
                    continue;
                }
                const ret = await serverSoundGenerate("SoundReplace", bizId, modelConfig.soundGenerate, {}, record.text)
                if (ret.type === 'retry') {
                    return ret.type;
                }
                record.audio = ret.url;
                await TaskService.update(bizId, {jobResult});
            }
            jobResult.step = "Combine";
            await TaskService.update(bizId, {jobResult});
        }

        if (jobResult.step === "Combine") {
            jobResult.Combine = jobResult.Combine || {};
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
                const {output, cleans} = await ffmpegMergeAudio(
                    jobResult.SoundGenerate.records,
                    videoDurationMs
                );
                filesToClean.push(...cleans);
                jobResult.Combine.audio = output;
                await TaskService.update(bizId, {jobResult});
                // 使用合并后的音频替换视频的音频轨道
                jobResult.Combine.file = await ffmpegCombineVideoAudio(modelConfig.video, jobResult.Combine.audio);
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
                    url: jobResult.Combine?.file || "",
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

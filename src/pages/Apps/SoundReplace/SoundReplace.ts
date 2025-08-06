import {t} from "../../../lang";
import {ObjectUtil} from "../../../lib/util";
import {TaskService} from "../../../service/TaskService";
import {useServerStore} from "../../../store/modules/server";
import {TaskBiz, useTaskStore} from "../../../store/modules/task";
import {SoundReplaceJobResultType, SoundReplaceModelConfigType} from "./type";

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
            // console.log('SoundReplace.runFunc.serverInfo', serverInfo)
            await TaskService.update(bizId, {
                status: "running",
                jobResult,
            });
            taskStore.fireChange({biz: "SoundReplace", bizId}, "running");
            const file = await window.$mapi.file.temp("mp3");
            await window.$mapi.ffmpeg.run([
                "-y",
                "-i",
                modelConfig.video,
                "-vn",
                "-acodec",
                "libmp3lame",
                "-ac",
                "1",
                "-ar",
                "16000",
                file,
            ]);
            if (!(await window.$mapi.file.exists(file, {isFullPath: true}))) {
                throw "转换成为音频失败，请检查视频文件是否存在或ffmpeg是否正常工作";
            }
            jobResult.ToAudio = {
                file,
            };
            jobResult.step = "SoundAsr";
            await TaskService.update(bizId, {jobResult});
        }
        if (jobResult.step === "SoundAsr") {
            jobResult.SoundAsr = jobResult.SoundAsr || {};
            await TaskService.update(bizId, {
                status: "running",
            });
            taskStore.fireChange({biz: "SoundReplace", bizId}, "running");
            const server = await serverStore.getByKey(modelConfig.soundAsr.serverKey);
            if (!server) {
                throw `SoundAsr server not found: ${modelConfig.soundAsr.serverKey}`;
            }
            const serverInfo = await serverStore.serverInfo(server);
            const res = await window.$mapi.server.callFunctionWithException(serverInfo, "asr", {
                id: serverStore.generateTaskId("SoundReplace", bizId),
                result: jobResult.SoundAsr,
                param: modelConfig.soundAsr.param,
                audio: jobResult.ToAudio.file,
            });
            if (res.code) {
                throw res.msg || "SoundAsr run fail";
            }
            switch (res.data.type) {
                case "success":
                    jobResult.SoundAsr.start = res.data.start;
                    jobResult.SoundAsr.end = res.data.end;
                    jobResult.SoundAsr.records = res.data.data.records || [];
                    break;
                case "retry":
                    return "retry";
                default:
                    throw `unknown res.data.type : ${res.data.type}`;
            }
            await TaskService.update(bizId, {jobResult});
            if (!jobResult.SoundAsr.records || !jobResult.SoundAsr.records.length) {
                throw "SoundAsr 识别结果为空，请检查音频文件是否正常";
            }
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
            const server = await serverStore.getByNameVersion(
                modelConfig.soundGenerate.serverName,
                modelConfig.soundGenerate.serverVersion
            );
            if (!server) {
                throw "SoundGenerate server not found: " + modelConfig.soundGenerate.serverName;
            }
            const serverInfo = await serverStore.serverInfo(server);
            for (const record of jobResult.SoundGenerate.records) {
                if (record.audio) {
                    continue;
                }
                console.log("SoundReplace.runFunc.soundGenerate", {record, serverInfo});
                let res;
                if (modelConfig.soundGenerate.type == "SoundTts") {
                    res = await window.$mapi.server.callFunctionWithException(serverInfo, "soundTts", {
                        id: serverStore.generateTaskId("SoundReplace", bizId),
                        result: {},
                        param: modelConfig.soundGenerate.ttsParam,
                        text: record.text,
                    });
                } else if (modelConfig.soundGenerate.type == "SoundClone") {
                    res = await window.$mapi.server.callFunctionWithException(serverInfo, "soundClone", {
                        id: serverStore.generateTaskId("SoundReplace", bizId),
                        result: {},
                        param: modelConfig.soundGenerate.cloneParam,
                        text: record.text,
                        promptAudio: modelConfig.soundGenerate.promptUrl,
                        promptText: modelConfig.soundGenerate.promptText,
                    });
                } else {
                    throw `unknown soundGenerate type: ${modelConfig.soundGenerate.type}`;
                }
                console.log("SoundReplace.runFunc.soundGenerate.res", res);
                if (res.code) {
                    throw res.msg || "SoundGenerate fail";
                }
                switch (res.data.type) {
                    case "success":
                        record.audio = res.data.data.url;
                        await TaskService.update(bizId, {jobResult});
                        break;
                    case "retry":
                        return "retry";
                    default:
                        throw `unknown res.data.type : ${res.data.type}`;
                }
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

            const video = modelConfig.video;
            const records = jobResult.SoundGenerate.records;
            if (!records || records.length === 0) {
                throw new Error("没有找到音频生成记录");
            }
            const videoDurationMs = await window.$mapi.ffmpeg.getMediaDuration(video, true);
            const filesToDelete: string[] = [];
            const audioFilesUse: string[] = [];
            try {
                // 处理每个音频片段
                for (let i = 0; i < records.length; i++) {
                    const currentRecord = records[i];
                    const nextRecord = records[i + 1];
                    if (
                        !currentRecord.audio ||
                        !(await window.$mapi.file.exists(currentRecord.audio, {isFullPath: true}))
                    ) {
                        throw `音频文件不存在: ${currentRecord.audio}`;
                    }
                    // 计算当前片段的时长限制
                    const startMs = currentRecord.start;
                    const maxDurationMs = nextRecord ? nextRecord.start - startMs : videoDurationMs - startMs;
                    const actualDurationMs = await window.$mapi.ffmpeg.getMediaDuration(currentRecord.audio, true);
                    let audioFileUse = currentRecord.audio;
                    // 如果音频时长超过限制，需要压缩
                    if (actualDurationMs > maxDurationMs) {
                        audioFileUse = await window.$mapi.ffmpeg.setMediaRatio(audioFileUse, "", {
                            ratio: actualDurationMs / maxDurationMs,
                        });
                        filesToDelete.push(audioFileUse);
                    }
                    // 统一归一化
                    audioFileUse = await window.$mapi.ffmpeg.convertAudio(audioFileUse);
                    filesToDelete.push(audioFileUse);
                    // 创建带静音的音频片段（从视频开始位置到当前片段开始位置添加静音）
                    let finalAudioFile = audioFileUse;
                    const silenceDurationSec = startMs / 1000;
                    if (silenceDurationSec > 0) {
                        // 添加前置静音
                        audioFileUse = await window.$mapi.ffmpeg.runToFileOrFail(
                            [
                                "-f",
                                "lavfi",
                                "-i",
                                `anullsrc=channel_layout=mono:sample_rate=44100:duration=${silenceDurationSec}`,
                                "-i",
                                audioFileUse,
                                "-filter_complex",
                                "[0:a][1:a]concat=n=2:v=0:a=1[out]",
                                "-map",
                                "[out]",
                                "-y",
                                "{output}",
                            ],
                            "wav"
                        );
                        filesToDelete.push(audioFileUse);
                        finalAudioFile = audioFileUse;
                    }
                    audioFilesUse.push(finalAudioFile);
                }

                if (!audioFilesUse.length) {
                    throw "没有生成任何音频文件";
                }

                // 创建合并后的音频文件
                const mergedAudioFile = await window.$mapi.file.temp("wav");
                if (audioFilesUse.length === 1) {
                    await window.$mapi.file.copy(audioFilesUse[0], mergedAudioFile, {isFullPath: true});
                } else if (audioFilesUse.length > 1) {
                    // 多个音频文件，使用 ffmpeg 混音合并
                    const inputs: string[] = [];
                    const filterInputs: string[] = [];
                    audioFilesUse.forEach((file, index) => {
                        inputs.push("-i", file);
                        filterInputs.push(`[${index}:a]`);
                    });
                    const filterComplex = [
                        `${filterInputs.join("")}amix=inputs=${filterInputs.length}:duration=longest:normalize=0[out]`,
                        // ";",
                        // `[out0]volume=${filterInputs.length}[out]`,
                    ].join("");
                    await window.$mapi.ffmpeg.run([
                        ...inputs,
                        "-filter_complex",
                        filterComplex,
                        "-map",
                        "[out]",
                        "-y",
                        mergedAudioFile,
                    ]);
                }
                // 检查合并后的音频是否存在
                if (!(await window.$mapi.file.exists(mergedAudioFile, {isFullPath: true}))) {
                    throw `音频合并失败: ${mergedAudioFile}`;
                }
                jobResult.Combine.audio = mergedAudioFile;
                await TaskService.update(bizId, {jobResult});
                // 使用合并后的音频替换视频的音频轨道
                const outputVideoFile = await window.$mapi.file.temp("mp4");
                await window.$mapi.ffmpeg.run([
                    "-i",
                    video,
                    "-i",
                    mergedAudioFile,
                    "-c:v",
                    "copy",
                    "-c:a",
                    "aac", // 音频编码为AAC
                    "-map",
                    "0:v:0", // 映射视频流
                    "-map",
                    "1:a:0", // 映射新的音频流
                    "-y",
                    outputVideoFile,
                ]);
                // 检查最终视频是否生成成功
                if (!(await window.$mapi.file.exists(outputVideoFile, {isFullPath: true}))) {
                    throw `视频音频替换失败: ${outputVideoFile}`;
                }
                // 保存最终结果
                jobResult.Combine.file = outputVideoFile;
                jobResult.step = "End";
                await TaskService.update(bizId, {
                    jobResult,
                });
                return "success";
            } catch (error) {
                throw error;
            } finally {
                await window.$mapi.file.clean(filesToDelete, {isFullPath: true});
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

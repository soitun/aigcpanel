import {TaskService} from "../../../service/TaskService";
import {useServerStore} from "../../../store/modules/server";
import {TaskBiz} from "../../../store/modules/task";
import {SoundReplaceModelConfigType} from "./type";

const serverStore = useServerStore();

export const SoundReplace: TaskBiz = {
    runFunc: async (bizId, bizParam) => {
        // console.log('SoundReplace.runFunc', {bizId, bizParam})
        const {record, server, serverInfo} = await serverStore.prepareForTask(bizId, bizParam);
        const modelConfig: SoundReplaceModelConfigType = record.modelConfig;
        // 处理步骤
        // 1 转mp3 ToAudio
        // 2 识别 SoundAsr
        // 3 确认 Confirm
        // 4 合成 SoundGenerate
        // 5 替换 Combile
        //
        /**
         * {
            "video": "/path/to/mp4-320s.mp4",
            "soundAsr": {
                "type": "SoundAsr",
                "serverKey": "CloudFunasr|1.0.0",
                "serverName": "CloudFunasr",
                "serverTitle": "[云端]FunASR模型",
                "serverVersion": "1.0.0",
                "param": {}
            },
            "soundGenerate": {
                "type": "SoundTts",
                "ttsServerKey": "CloudTecmz|1.0.0",
                "serverName": "CloudTecmz",
                "serverTitle": "[云端]聚合声音合成",
                "serverVersion": "1.0.0",
                "ttsParam": {
                    "speaker": null,
                    "speakerTitle": ""
                }
            }
        }
        */
        record.jobResult.step = record.jobResult.step || "ToAudio";
        if (record.jobResult.step === "ToAudio") {
            // console.log('SoundReplace.runFunc.serverInfo', serverInfo)
            await TaskService.update(bizId, {
                status: "running",
                jobResult: record.jobResult,
            });
            const file = await window.$mapi.file.temp("mp3");
            await window.$mapi.ffmpeg.run([
                "-y",
                "-i",
                record.modelConfig.video,
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
            record.jobResult.ToSound = {
                file,
            };
            record.jobResult.step = "SoundAsr";
            await TaskService.update(bizId, {
                jobResult: record.jobResult,
            });
        }
        if (record.jobResult.step === "SoundAsr") {
            record.jobResult.SoundAsr = record.jobResult.SoundAsr || {};
            await TaskService.update(bizId, {
                status: "running",
            });
            const res = await window.$mapi.server.callFunctionWithException(serverInfo, "asr", {
                id: serverStore.generateTaskId("SoundReplace", bizId),
                result: record.jobResult.SoundAsr,
                param: record.param,
                audio: record.modelConfig.audio,
            });
            if (res.code) {
                throw res.msg || "SoundAsr run fail";
            }
            record.jobResult.SoundAsr.data = res.data;
            record.jobResult.step = "Confirm";
            await TaskService.update(bizId, {
                jobResult: record.jobResult,
            });
        }
        return "success";
    },
    successFunc: async (bizId, bizParam) => {
        const {record} = await serverStore.prepareForTask(bizId, bizParam);
        if (record.jobResult.step === "xxx") {
            await TaskService.update(bizId, {
                status: "success",
                endTime: Date.now(),
                result: {
                    records: record.jobResult.data.data.records,
                },
            });
        } else {
            await TaskService.update(bizId, {
                status: "pause",
                statusMsg: "任务未完成，当前步骤：" + record.jobResult.step,
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
        const {record} = await serverStore.prepareForTask(bizId, bizParam);
        if ("result" in data) {
            if (record.jobResult.step === "SoundAsr") {
                TaskService.update(bizId, {
                    jobResult: {
                        SoundAsr: data.result,
                    },
                });
            }
        }
    },
};

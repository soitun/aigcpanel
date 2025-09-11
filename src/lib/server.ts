import {useServerStore} from "../store/modules/server";
import {TaskBiz} from "../service/TaskService";
import {getDataContent} from "../components/common/dataConfig";
import {SoundGenerateReplaceContent} from "../pages/Sound/config/replaceContent";

const serverStore = useServerStore();

export const serverSoundAsr = async (
    biz: TaskBiz,
    bizId: string,
    soundAsr: SoundAsrParamType,
    result: {},
    audio: string
): Promise<{
    type: string;
    start: number;
    end: number;
    records: any[];
}> => {
    const cacheRecords = await $mapi.file.cacheGet<any[]>({soundAsr, audio});
    if (cacheRecords) {
        return {
            type: "success",
            start: 0,
            end: 0,
            records: cacheRecords,
        }
    }
    const server = await serverStore.getByKey(soundAsr.serverKey);
    if (!server) {
        throw `SoundAsr server not found: ${soundAsr.serverKey}`;
    }
    const serverInfo = await serverStore.serverInfo(server);
    const res = await window.$mapi.server.callFunctionWithException(serverInfo, "asr", {
        id: serverStore.generateTaskId(biz, bizId),
        result: result,
        param: soundAsr.param,
        audio: audio,
    });
    if (res.code) {
        throw res.msg || "SoundAsr run fail";
    }
    const ret = {
        type: res.data.type,
        start: 0,
        end: 0,
        records: [],
    };
    switch (res.data.type) {
        case "success":
            ret.start = res.data.start;
            ret.end = res.data.end;
            ret.records = res.data.data.records || [];
            if (!ret.records || !ret.records.length) {
                throw "SoundAsr 识别结果为空，请检查音频文件是否正常";
            }
            await $mapi.file.cacheSet({soundAsr, audio}, ret.records);
            break;
        case "retry":
            break;
        default:
            throw `unknown res.data.type : ${res.data.type}`;
    }
    return ret;
};

export const replaceSoundGenerateText = async (text: string): Promise<string> => {
    if (!text) {
        return text;
    }
    const param = await getDataContent<{
        key: string,
        value: string
    }[]>('SoundGenerateReplaceContent', SoundGenerateReplaceContent);
    if (!param || !param.length) {
        return text;
    }
    for (const p of param) {
        // replace all
        text = text.replaceAll(p.key, p.value);
    }
    return text;
}

export const serverSoundGenerate = async (
    biz: TaskBiz,
    bizId: string,
    soundGenerate: SoundGenerateParamType,
    result: {},
    text: string
): Promise<{
    type: string;
    start: number;
    end: number;
    url: string;
}> => {
    text = await replaceSoundGenerateText(text);
    const cacheUrl = await $mapi.file.cacheGetPath({soundGenerate, text});
    if (cacheUrl) {
        return {
            type: "success",
            start: 0,
            end: 0,
            url: cacheUrl,
        }
    }
    const server = await serverStore.getByNameVersion(soundGenerate.serverName, soundGenerate.serverVersion);
    if (!server) {
        throw "SoundGenerate server not found: " + soundGenerate.serverName;
    }
    const serverInfo = await serverStore.serverInfo(server);
    let res;
    if (soundGenerate.type == "SoundTts") {
        res = await serverStore.call(serverInfo, "soundTts", {
            id: serverStore.generateTaskId(biz, bizId),
            result: result,
            param: soundGenerate.ttsParam,
            text: text,
        });
    } else if (soundGenerate.type == "SoundClone") {
        res = await serverStore.call(serverInfo, "soundClone", {
            id: serverStore.generateTaskId(biz, bizId),
            result: result,
            param: soundGenerate.cloneParam,
            text: text,
            promptAudio: soundGenerate.promptUrl,
            promptText: soundGenerate.promptText,
        });
    } else {
        throw `SoundGenerate.error - type error ${soundGenerate.type}`;
    }
    // console.log("SoundReplace.runFunc.soundGenerate.res", res);
    if (res.code) {
        throw res.msg || "SoundGenerate fail";
    }
    const ret = {
        type: res.data.type,
        start: 0,
        end: 0,
        url: "",
    };
    switch (res.data.type) {
        case "success":
            ret.url = res.data.data.url;
            if (!ret.url) {
                throw "SoundGenerate 生成结果为空，请检查参数是否正确";
            }
            await $mapi.file.cacheSet({soundGenerate, text}, ret.url);
            break;
        case "retry":
            break;
        default:
            throw `unknown res.data.type : ${res.data.type}`;
    }
    return ret;
};

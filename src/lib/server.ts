import {useServerStore} from "../store/modules/server";
import {TaskBiz} from "../service/TaskService";

const serverStore = useServerStore()

export const serverSoundAsr = async (
    biz: TaskBiz,
    bizId: string,
    soundAsr: SoundAsrParamType,
    result: {},
    audio: string
) => {
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
    }
    switch (res.data.type) {
        case "success":
            ret.start = res.data.start;
            ret.end = res.data.end;
            ret.records = res.data.data.records || [];
            if (!ret.records || !ret.records.length) {
                throw "SoundAsr 识别结果为空，请检查音频文件是否正常";
            }
            break;
        case "retry":
            break;
        default:
            throw `unknown res.data.type : ${res.data.type}`;
    }
    return ret
}

export const serverSoundGenerate = async (
    biz: TaskBiz,
    bizId: string,
    soundGenerate: SoundGenerateParamType,
    result: {},
    text: string
) => {
    const server = await serverStore.getByNameVersion(
        soundGenerate.serverName,
        soundGenerate.serverVersion
    );
    if (!server) {
        throw "SoundGenerate server not found: " + soundGenerate.serverName;
    }
    const serverInfo = await serverStore.serverInfo(server);
    let res
    if (soundGenerate.type == "SoundTts") {
        res = await window.$mapi.server.callFunctionWithException(serverInfo, "soundTts", {
            id: serverStore.generateTaskId(biz, bizId),
            result: result,
            param: soundGenerate.ttsParam,
            text: text,
        });
    } else if (soundGenerate.type == "SoundClone") {
        res = await window.$mapi.server.callFunctionWithException(serverInfo, "soundClone", {
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
        url: '',
    }
    switch (res.data.type) {
        case "success":
            ret.url = res.data.data.url
            break;
        case "retry":
            break;
        default:
            throw `unknown res.data.type : ${res.data.type}`;
    }
    return ret
}

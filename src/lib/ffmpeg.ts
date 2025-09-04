import {ffprobeGetMediaDuration} from "./ffprobe";

export const ffmpegSetMediaRatio = async (
    input: string,
    output: string,
    option?: {
        ratio: number;
    }
) => {
    option = Object.assign(
        {
            ratio: 1.0,
        },
        option || {}
    );
    const ext = await window.$mapi.file.ext(input);
    if (!output) {
        output = await window.$mapi.file.temp(ext);
    }
    const buildAtempoFilter = (ratio: number): string => {
        // atempo 只支持 0.5~2.0，超过需要多次串联
        const filters: string[] = [];
        let remain = ratio;
        while (remain > 2.0) {
            filters.push("atempo=2.0");
            remain /= 2.0;
        }
        while (remain < 0.5) {
            filters.push("atempo=0.5");
            remain /= 0.5;
        }
        filters.push(`atempo=${remain}`);
        return filters.join(",");
    };

    let args: string[] = [];
    if ("mp4" === ext) {
        args = [
            "-i",
            input,
            "-filter_complex",
            `[0:v]setpts=${(1 / option.ratio).toFixed(6)}*PTS[v];[0:a]${buildAtempoFilter(option.ratio)}[a]`,
            "-map",
            "[v]",
            "-map",
            "[a]",
            "-preset",
            "fast",
            "-y",
            output,
        ];
    } else {
        args = ["-i", input, "-filter:a", buildAtempoFilter(option.ratio), "-vn", "-y", output];
    }

    // console.log("FFmpeg setMediaRatio args:", args.join(" "));

    return new Promise<string>(async (resolve, reject) => {
        let buffer = "";
        let called = false;
        const endCheck = async () => {
            if (await window.$mapi.file.exists(output, {isFullPath: true})) {
                resolve(output);
            } else {
                reject("Failed to create output file");
            }
        };
        const controller = await window.$mapi.app.spawnBinary('ffmpeg', args, {
            shell: false,
            stdout: (data: string) => {
                // console.log("FFmpeg stdout:", data);
            },
            stderr: (data: string) => {
                // console.log("FFmpeg stderr:", data);
            },
            success: () => {
                endCheck().then();
            },
            error: (msg: string, exitCode: number) => {
                endCheck().then();
            },
        });
    });
};

const ffmpegConvertAudio = async (
    input: string,
    output?: string,
    option?: {
        channels?: number;
        sampleRate?: number;
        format?: string;
    }
) => {
    option = Object.assign({
            channels: 1,
            sampleRate: 44100,
            format: "wav",
        },
        option
    );
    if (!output) {
        output = await window.$mapi.file.temp(option.format);
    }
    return new Promise<string>(async (resolve, reject) => {
        const args: string[] = [
            "-i",
            input,
            "-ac",
            option.channels!.toString(),
            "-ar",
            option.sampleRate!.toString(),
            "-f",
            option.format!,
            "-y",
            output,
        ];
        // console.log("FFmpeg convertAudio args:", args.join(" "));
        const controller = await window.$mapi.app.spawnBinary('ffmpeg', args, {
            shell: false,
            stdout: (data: string) => {
                // console.log("FFmpeg stdout:", data);
            },
            stderr: (data: string) => {
                // console.log("FFmpeg stderr:", data);
            },
            success: () => {
                resolve(output);
            },
            error: (msg: string, exitCode: number) => {
                reject(`FFmpeg error (code ${exitCode}): ${msg}`);
            },
        });
    });
};

export type AudioRecord = {
    start: number;
    end: number;
    text: string;
    audio: string;
    actualStart?: number;
    actualEnd?: number;
}

export const ffmpegMergeAudio = async (
    records: AudioRecord[],
    recordMaxMs: number
): Promise<{
    output: string;
    cleans: string[];
    mergeRecords: AudioRecord[],
}> => {
    const cleans: string[] = [];
    const mergeRecords: {
        start: number;
        end: number;
        actualStart: number;
        actualEnd: number;
        text: string;
        audio: string;
    }[] = [];
    const wavFiles: {
        path: string;
        start: number;
    }[] = [];
    for (let i = 0; i < records.length; i++) {
        const currentRecord = records[i];
        const nextRecord = records[i + 1];
        if (!currentRecord.audio || !(await window.$mapi.file.exists(currentRecord.audio, {isFullPath: true}))) {
            throw `音频文件不存在: ${currentRecord.audio}`;
        }
        // 计算当前片段的时长限制
        const startMs = currentRecord.start;
        const maxDurationMs = nextRecord ? nextRecord.start - startMs : recordMaxMs - startMs;
        const actualDurationMs = await ffprobeGetMediaDuration(currentRecord.audio, true);
        mergeRecords.push({
            start: currentRecord.start,
            end: currentRecord.end,
            actualStart: startMs,
            actualEnd: startMs + Math.min(actualDurationMs, maxDurationMs),
            text: currentRecord.text,
            audio: currentRecord.audio,
        });
        let audioFileUse = currentRecord.audio;
        // 如果音频时长超过限制，需要压缩
        if (actualDurationMs > maxDurationMs) {
            audioFileUse = await ffmpegSetMediaRatio(audioFileUse, "", {
                ratio: actualDurationMs / maxDurationMs,
            });
            cleans.push(audioFileUse);
        }
        audioFileUse = await ffmpegConvertAudio(audioFileUse);
        cleans.push(audioFileUse);
        wavFiles.push({
            path: audioFileUse,
            start: startMs,
        });
    }

    if (!wavFiles.length) {
        throw "没有生成任何音频文件";
    }

    const output = await window.$mapi.file.temp("wav");
    if (wavFiles.length === 1) {
        await window.$mapi.file.copy(wavFiles[0].path, output, {isFullPath: true});
    } else if (wavFiles.length > 1) {
        const inputs: string[] = [];
        const inputSources: string[] = [];
        const inputFilters: string[] = [];
        wavFiles.forEach((file, index) => {
            inputs.push("-i", file.path);
            inputSources.push(`[${index}:a]adelay=${file.start}|${file.start}[a${index}]`);
            inputFilters.push(`[a${index}]`);
        });
        const filterComplex = [
            inputSources.join(";"),
            ";",
            inputFilters.join(""),
            "amix=inputs=" + inputSources.length + ":duration=longest:normalize=0",
        ].join("");
        await window.$mapi.app.spawnBinary('ffmpeg', [...inputs, "-filter_complex", filterComplex, output]);
    }
    // 检查合并后的音频是否存在
    if (!(await window.$mapi.file.exists(output, {isFullPath: true}))) {
        throw `音频合并失败: ${output}`;
    }
    return {
        output,
        cleans,
        mergeRecords,
    };
};

export const ffmpegCombineVideoAudio = async (video: string, audio: string) => {
    const output = await window.$mapi.file.temp("mp4");
    await window.$mapi.app.spawnBinary('ffmpeg', [
        "-i",
        video,
        "-i",
        audio,
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-y",
        output,
    ]);
    // 检查最终视频是否生成成功
    if (!(await window.$mapi.file.exists(output, {isFullPath: true}))) {
        throw `视频音频合成失败`;
    }
    return output;
};

export const ffmpegVideoToAudio = async (video: string) => {
    const file = await window.$mapi.file.temp("mp3");
    await window.$mapi.app.spawnBinary('ffmpeg', [
        "-y",
        "-i",
        video,
        "-vn",
        "-acodec",
        "libmp3lame",
        "-ac",
        "1",
        "-ar",
        "44100",
        file,
    ]);
    if (!(await window.$mapi.file.exists(file, {isFullPath: true}))) {
        throw "转换成为音频失败，请检查视频文件是否存在或ffmpeg是否正常工作";
    }
    return file;
};

import {AudioRecord} from "../../../lib/ffmpeg";

export function generateSubtitleContent(records: AudioRecord[]): string {
    let subtitleText = '';
    let index = 1;
    const formatMs = (ms: number) => {
        ms = Math.floor(ms);
        const hour = Math.floor(ms / 3600000);
        const minute = Math.floor((ms % 3600000) / 60000);
        const second = Math.floor((ms % 60000) / 1000);
        const millisecond = ms % 1000;
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')},${String(millisecond).padStart(3, '0')}`;
    }
    for (const record of records) {
        const start = formatMs(record.start);
        const end = formatMs(record.end);
        subtitleText += `${index}\n${start} --> ${end}\n${record.text}\n\n`;
        index++;
    }
    return subtitleText;
}

export function generateSubTitleRecords(
    records: AudioRecord[],
    option?: {
        maxWords: number,
    }
): AudioRecord[] {
    option = Object.assign({
        maxWords: 18,
    }, option);
    const subtitles: AudioRecord[] = [];
    for (const record of records) {
        if (record.text.length <= option.maxWords) {
            subtitles.push(record);
            continue;
        }
        // split by punctuation
        const sentences = record.text.split(/([，。！？；,.!?;])/);
        let currentTexts: string[] = [];
        const sentenceResults: string[] = [];
        for (const s of sentences) {
            if (!s) {
                continue;
            }
            if ([...currentTexts, s].join(' ').length > option.maxWords) {
                if (currentTexts.length > 0) {
                    sentenceResults.push(currentTexts.join(''));
                    currentTexts = [];
                } else {
                    // 当前句子就超长，直接切分
                    let start = 0;
                    while (start < s.length) {
                        sentenceResults.push(s.substring(start, start + option.maxWords));
                        start += option.maxWords;
                    }
                    currentTexts = [];
                }
            } else {
                currentTexts.push(s);
            }
        }
        if (currentTexts.length > 0) {
            sentenceResults.push(currentTexts.join(''));
        }
        // 计算每个句子的时间
        const totalDuration = record.actualEnd! - record.actualStart!;
        const totalChars = record.text.length;
        let charIndex = 0;
        let currentStart = record.actualStart!;
        for (const sentence of sentenceResults) {
            const charCount = sentence.length;
            const duration = Math.round(totalDuration * (charCount / totalChars));
            const subRecord: AudioRecord = {
                start: record.start + charIndex * (totalDuration / totalChars),
                end: record.start + (charIndex + charCount) * (totalDuration / totalChars),
                text: sentence,
                audio: record.audio,
            };
            subtitles.push(subRecord);
            charIndex += charCount;
            currentStart += duration;
        }
    }
    return subtitles;
}

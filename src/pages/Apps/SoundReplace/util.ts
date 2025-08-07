import {TaskRecord} from "../../../service/TaskService";
import {SoundReplaceJobResultType} from "./type";

export const soundReplaceFileCleanCollector = async (task: TaskRecord) => {
    const files: string[] = [];
    const jobResult: SoundReplaceJobResultType = task.jobResult;
    if (jobResult.ToAudio) {
        if (jobResult.ToAudio.file) {
            files.push(jobResult.ToAudio.file);
        }
    }
    if (jobResult.SoundGenerate) {
        if (jobResult.SoundGenerate.records) {
            for (const r of jobResult.SoundGenerate.records) {
                if (r.audio) {
                    files.push(r.audio);
                }
            }
        }
    }
    if (jobResult.Combine) {
        if (jobResult.Combine.audio) {
            files.push(jobResult.Combine.audio);
        }
        if (jobResult.Combine.file) {
            files.push(jobResult.Combine.file);
        }
    }
    return files;
};

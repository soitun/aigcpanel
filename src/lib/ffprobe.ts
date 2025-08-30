export const ffprobeVideoInfo = async (video: string): Promise<{
    duration: number;
    width: number;
    height: number;
    fps: number;
}> => {
    const res = await window.$mapi.app.spawnBinary("ffprobe", [
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height,r_frame_rate,duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        video,
    ]);
    const info = await res.result();
    const lines = info.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length < 4) {
        throw "Could not retrieve video info";
    }
    const width = parseInt(lines[0], 10);
    const height = parseInt(lines[1], 10);
    const fpsParts = lines[2].split("/");
    const fps = fpsParts.length === 2 ? parseFloat(fpsParts[0]) / parseFloat(fpsParts[1]) : parseFloat(lines[2]);
    const duration = parseFloat(lines[3]);
    if (isNaN(width) || isNaN(height) || isNaN(fps) || isNaN(duration)) {
        throw "Invalid video info data";
    }
    return {duration, width, height, fps};
}

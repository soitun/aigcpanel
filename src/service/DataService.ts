export const DataService = {
    async saveFile(file: string) {
        return await window.$mapi.file.hubSave(file, {
            isFullPath: true,
            returnFullPath: true,
        })
    },
    async saveBuffer(ext: string, data: Uint8Array) {
        const path = await window.$mapi.file.temp(ext)
        await window.$mapi.file.writeBuffer(path, data, {
            isFullPath: true,
        })
        const result = await this.saveFile(path)
        await window.$mapi.file.deletes(path, {
            isFullPath: true,
        })
        return result
    }
}

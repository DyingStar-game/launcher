// IPC event émis pendant le download
interface DownloadProgress {
    percent: number
    bytesDownloaded: number
    totalBytes: number
    currentFile: string
    speed: number   // bytes/sec
}
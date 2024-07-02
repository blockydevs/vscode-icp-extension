let dfxPath: string = '';
let canisterLogs: { [key: string]: string } = {};

export function setDfxPath(path: string) {
    dfxPath = path;
}

export function getDfxPath(): string {
    return dfxPath;
}

export function setCanisterLogs(logs: { [key: string]: string }) {
    canisterLogs = logs;
}

export function getCanisterLogs(): { [key: string]: string } {
    return canisterLogs;
}

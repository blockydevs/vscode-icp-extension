let dfxPath: string = '';
let canisterLogs: { [key: string]: string } = {};
let candidUICanisterId: string = '';

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

export function setCandidUICanisterId(path: string) {
    candidUICanisterId = path;
}

export function getCandidUICanisterId(): string {
    return candidUICanisterId;
}

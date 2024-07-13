let canisterLogs: { [key: string]: string } = {};

export function setCanisterLogs(logs: { [key: string]: string }) {
    canisterLogs = logs;
}

export function getCanisterLogs(): { [key: string]: string } {
    return canisterLogs;
}

let _canisterLogs: { [key: string]: string } = {};

export function setCanisterLogs(logs: { [key: string]: string }) {
    _canisterLogs = logs;
}

export function getCanisterLogs(): { [key: string]: string } {
    return _canisterLogs;
}

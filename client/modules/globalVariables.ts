let _canisterLogs: { [key: string]: string } = {};
let _candidUIDeployed = false;

export function setCanisterLogs(logs: { [key: string]: string }) {
    _canisterLogs = logs;
}

export function getCanisterLogs(): { [key: string]: string } {
    return _canisterLogs;
}

export function setCandidUIDeployed(candidUIDeployed: boolean) {
    _candidUIDeployed = candidUIDeployed;
}

export function getCandidUIDeployed(): boolean {
    return _candidUIDeployed;
}

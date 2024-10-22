import * as vscode from 'vscode';
import { JsonTreeCandidProvider } from './jsonTreeCandidProvider';
import { canisterStatusCheck, canisterStatusCheckWithCanisterId } from './canisterStatusCheck';

export function deployCanisterOnNetwork(canisterName: string, network: string, terminal: vscode.Terminal, jsonTreeCandidProvider: JsonTreeCandidProvider) {
    const args = `--network=${network}`;
    deployCanister(canisterName, terminal, jsonTreeCandidProvider, args);
}

export function deployCanister(canisterName: string, terminal: vscode.Terminal, jsonTreeCandidProvider: JsonTreeCandidProvider, args: string = '') {
    const command = `dfx deploy ${canisterName} ${args}`;
    terminal.show();
    terminal.sendText(command);
	const rootPath = vscode.workspace.rootPath;
	if (rootPath) {
    	checkForCanisterStatusAndRefreshJsonTree(rootPath, jsonTreeCandidProvider, canisterName, 0);
	}
}

export function deployCanistersOnNetwork(network: string, terminal: vscode.Terminal, jsonTreeCandidProvider: JsonTreeCandidProvider) {
    const args = `--network=${network}`;
    deployCanisters(terminal, jsonTreeCandidProvider, args);
}

export function deployCanisters(terminal: vscode.Terminal, jsonTreeCandidProvider: JsonTreeCandidProvider, args: string = '') {
    const command = `dfx deploy ${args}`;
    terminal.show();
    terminal.sendText(command);
	const rootPath = vscode.workspace.rootPath;
	if (rootPath) {
    	checkForCanistersStatusAndRefreshJsonTree(rootPath, jsonTreeCandidProvider, 0);
	}
}

async function checkForCanisterStatusAndRefreshJsonTree(rootPath: string, jsonTreeCandidProvider: JsonTreeCandidProvider, canisterName: string, iterator: number) {
    if (iterator < 100) {
        iterator++;
        if (canisterStatusCheckWithCanisterId(rootPath, canisterName)) {
            setTimeout(() => {
                jsonTreeCandidProvider.refresh();
            }, 5000);
        }
        else {
            setTimeout(() => {
                checkForCanisterStatusAndRefreshJsonTree(rootPath, jsonTreeCandidProvider, canisterName, 0);
            }, 5000);
        }
    }
}

async function checkForCanistersStatusAndRefreshJsonTree(rootPath: string, jsonTreeCandidProvider: JsonTreeCandidProvider, iterator: number) {
    if (iterator < 100) {
        iterator++;
        if (canisterStatusCheck(rootPath)) {
            setTimeout(() => {
                jsonTreeCandidProvider.refresh();
            }, 5000);
        }
        else {
            setTimeout(() => {
                checkForCanistersStatusAndRefreshJsonTree(rootPath, jsonTreeCandidProvider, 0);
            }, 5000);
        }
    }
}
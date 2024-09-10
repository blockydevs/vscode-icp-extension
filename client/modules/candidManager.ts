import * as vscode from 'vscode';
import * as path from 'path';
import { JsonTreeItem } from './jsonTreeProvider';
import { CandidUIWebviewProvider } from './candidUIWebviewProvider';
import { CandidUIWebviewSidebarProvider } from './candidUIWebviewSidebarProvider';
import { canisterStatusCheck } from './canisterStatusCheck';

export function startCandid(terminal: vscode.Terminal, extensionPath: string, rootPath: string | undefined) {
    const command = `cd "${extensionPath}/tools/ui" && dfx deploy && cd "${rootPath}"`;
    terminal.show();
    terminal.sendText(command);
}

export function startCandidAndOpenWebview(terminal: vscode.Terminal, extensionPath: string, rootPath: string | undefined, candidUIWebviewProvider: CandidUIWebviewProvider, item: JsonTreeItem, panel: vscode.WebviewPanel) {
    const command = `cd "${extensionPath}/tools/ui" && dfx deploy && cd "${rootPath}"`;
    terminal.show();
    terminal.sendText(command);
    checkCandidProcessAndUpdatehWebviewForItem(extensionPath, candidUIWebviewProvider, item, panel, 0);
}

export function startCandidAndOpenWebviewSidebarForJsonTreeItem(terminal: vscode.Terminal, extensionPath: string, rootPath: string | undefined, candidUIWebviewSidebarProvider: CandidUIWebviewSidebarProvider, item: JsonTreeItem) {    
    const command = `cd "${extensionPath}/tools/ui" && dfx deploy && cd "${rootPath}"`;
    terminal.show();
    terminal.sendText(command);
    checkCandidProcessAndRefreshWebviewForItem(extensionPath, candidUIWebviewSidebarProvider, item, 0);
}

export function startCandidAndOpenWebviewSidebarForCanisterId(terminal: vscode.Terminal, extensionPath: string, rootPath: string | undefined, candidUIWebviewSidebarProvider: CandidUIWebviewSidebarProvider, canisterId: string) {
    const command = `cd "${extensionPath}/tools/ui" && dfx deploy && cd "${rootPath}"`;
    terminal.show();
    terminal.sendText(command);
    checkCandidProcessAndRefreshWebviewForCanisterId(extensionPath, candidUIWebviewSidebarProvider, canisterId, 0);
}

async function checkCandidProcessAndUpdatehWebviewForItem(extensionPath: string, candidUIWebviewProvider: CandidUIWebviewProvider, item: JsonTreeItem, panel: vscode.WebviewPanel, iterator: number) {
    if (iterator < 100) {
        iterator++;
        if (canisterStatusCheck(path.join(extensionPath, 'tools', 'ui'))) {
            setTimeout(() => {
                candidUIWebviewProvider.refresh();
                candidUIWebviewProvider.updateWebviewHtml(item, panel);
            }, 5000);
        }
        else {
            setTimeout(() => {
                checkCandidProcessAndUpdatehWebviewForItem(extensionPath, candidUIWebviewProvider, item, panel, iterator);
            }, 5000);
        }
    }
}

async function checkCandidProcessAndRefreshWebviewForItem(extensionPath: string, candidUIWebviewSidebarProvider: CandidUIWebviewSidebarProvider, item: JsonTreeItem, iterator: number) {
    if (iterator < 100) {
        iterator++;
        if (canisterStatusCheck(path.join(extensionPath, 'tools', 'ui'))) {
            setTimeout(() => {
                candidUIWebviewSidebarProvider.refreshWebviewForJsonTreeItem(item)
            }, 5000);
        }
        else {
            setTimeout(() => {
                checkCandidProcessAndRefreshWebviewForItem(extensionPath, candidUIWebviewSidebarProvider, item, iterator);
            }, 5000);
        }
    }
}

async function checkCandidProcessAndRefreshWebviewForCanisterId(extensionPath: string, candidUIWebviewSidebarProvider: CandidUIWebviewSidebarProvider, canisterId: string, iterator: number) {
    if (iterator < 100) {
        iterator++;
        if (canisterStatusCheck(path.join(extensionPath, 'tools', 'ui'))) {
            setTimeout(() => {
                candidUIWebviewSidebarProvider.refreshWebviewForCanisterId(canisterId)
            }, 5000);
        }
        else {
            setTimeout(() => {
                checkCandidProcessAndRefreshWebviewForCanisterId(extensionPath, candidUIWebviewSidebarProvider, canisterId, iterator);
            }, 5000);
        }
    }
}
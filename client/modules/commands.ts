import * as vscode from 'vscode';
import * as path from 'path';
import { JsonTreeProvider, JsonTreeItem } from './jsonTreeProvider';
import { JsonTreeCandidProvider } from './jsonTreeCandidProvider';
import { startReplica } from './replicaManager';
import { startCandid, startCandidAndOpenWebview, startCandidAndOpenWebviewSidebarForJsonTreeItem, startCandidAndOpenWebviewSidebarForCanisterId } from './candidManager';
import { CandidUIWebviewProvider } from './candidUIWebviewProvider';
import { CandidUIWebviewSidebarProvider } from './candidUIWebviewSidebarProvider';
import { canisterStatusCheck } from './canisterStatusCheck';
import { deployCanister, deployCanisters } from './canisterDeployManager';
import { TerminalProvider } from './terminalProvider';

export function activateCommands(context: vscode.ExtensionContext, treeDataProvider: JsonTreeProvider, jsonTreeCandidProvider: JsonTreeCandidProvider,
                                 candidUIWebviewProvider: CandidUIWebviewProvider, candidUIWebviewSidebarProvider: CandidUIWebviewSidebarProvider, terminalProvider: TerminalProvider) {
    const rootPath = vscode.workspace.rootPath;
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(CandidUIWebviewSidebarProvider.viewType, candidUIWebviewSidebarProvider));
    vscode.commands.registerCommand('jsonTree.refreshEntry', () => treeDataProvider.refresh());
    vscode.commands.registerCommand('jsonTree.deployCanister', (item: JsonTreeItem) => {
        deployCanister(item.label.split(':')[0], terminalProvider.get(), jsonTreeCandidProvider);
    });
    vscode.commands.registerCommand('jsonTree.startReplica', () => {
        startReplica(terminalProvider.get());
    });
    vscode.commands.registerCommand('jsonTree.deployCanisters', () => {
        deployCanisters(terminalProvider.get(), jsonTreeCandidProvider);
    });
    vscode.commands.registerCommand('jsonTree.openJson', openJson);
    vscode.commands.registerCommand('jsonTree.showCanisterGroupActions', showCanisterGroupActions);
    vscode.commands.registerCommand('jsonTree.showCanisterActions', showCanisterActions);
    vscode.commands.registerCommand('dfx.startCandid', () => {
        startCandid(terminalProvider.get(), context.extensionPath, vscode.workspace.rootPath);  
    });
    vscode.commands.registerCommand('dfx.openCandidUI', (item: JsonTreeItem) => {
        if (!canisterStatusCheck(path.join(context.extensionPath, 'tools', 'ui'))) {
            let panel = candidUIWebviewProvider.createEmptyWebview();
            startCandidAndOpenWebview(terminalProvider.get(), context.extensionPath, rootPath, candidUIWebviewProvider, item, panel);
        }
        else {
            candidUIWebviewProvider.refresh();
            candidUIWebviewProvider.createWebViewPanel(item);
        }
    });
    vscode.commands.registerCommand('dfx.openCandidUISidebar', (item: JsonTreeItem) => {
        if (!canisterStatusCheck(path.join(context.extensionPath, 'tools', 'ui'))) {
            candidUIWebviewSidebarProvider.emptyWebview();
            startCandidAndOpenWebviewSidebarForJsonTreeItem(terminalProvider.get(), context.extensionPath, rootPath, candidUIWebviewSidebarProvider, item);
        }
        else {
            candidUIWebviewSidebarProvider.refreshWebviewForJsonTreeItem(item);
        }
    });

    vscode.commands.registerCommand('dfx.openCandidUISidebarFromJsonTree', (canisterId: string) => {
        if (!canisterStatusCheck(path.join(context.extensionPath, 'tools', 'ui'))) {
            candidUIWebviewSidebarProvider.emptyWebview();
            startCandidAndOpenWebviewSidebarForCanisterId(terminalProvider.get(), context.extensionPath, rootPath, candidUIWebviewSidebarProvider, canisterId);
        }
        else {
            candidUIWebviewSidebarProvider.refreshWebviewForCanisterId(canisterId);
        }
    });
}

function openJson(filePath: string, keyPath: string, value: any) {
    vscode.workspace.openTextDocument(filePath).then(doc => {
        vscode.window.showTextDocument(doc).then(editor => {
            const text = doc.getText();
            let regex;
            if (Array.isArray(value)) {
                regex = new RegExp(`"${keyPath.replace(/\./g, '\\.').replace(/\[|\]/g, '\\$&')}"\\s*:\\s*\\[`, 'g');
            } else {
                regex = new RegExp(`"${keyPath.replace(/\./g, '\\."')}"\\s*:\\s*${JSON.stringify(value).replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1')}`, 'g');
            }
            const match = regex.exec(text);
            if (match) {
                const position = doc.positionAt(match.index);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(new vscode.Range(position, position));
            }
        });
    });
}

async function showCanisterGroupActions() {
    const options = ['Start Replica', 'Deploy Canisters', 'Deploy Candid'];
    const selection = await vscode.window.showQuickPick(options, {
        placeHolder: 'Select an action'
    });

    if (selection === 'Start Replica') {
        vscode.commands.executeCommand('jsonTree.startReplica');
    } else if (selection === 'Deploy Canisters') {
        vscode.commands.executeCommand('jsonTree.deployCanisters');
    } else if (selection === 'Deploy Candid') {
        vscode.commands.executeCommand('dfx.startCandid');
    }
}

async function showCanisterActions(item: JsonTreeItem) {
    const options = ['Deploy Canister', 'Open Candid UI', 'Open Candid UI in sidebar'];
    const selection = await vscode.window.showQuickPick(options, {
        placeHolder: 'Select an action'
    });

    if (selection === 'Deploy Canister') {
        vscode.commands.executeCommand('jsonTree.deployCanister', item);
    } else if (selection === 'Open Candid UI') {
        vscode.commands.executeCommand('dfx.openCandidUI', item);
    } else if (selection === 'Open Candid UI in sidebar') {
        vscode.commands.executeCommand('dfx.openCandidUISidebar', item);
    }
}
import * as vscode from 'vscode';
import { JsonTreeProvider, JsonTreeItem } from './jsonTreeProvider';
import { JsonTreeCandidProvider } from './jsonTreeCandidProvider';
import { runCommand, viewLogs } from './logsManager';
import { startReplica } from './replicaManager';
import { startCandid, startCandidSync } from './candidManager';
import { CandidUIWebviewProvider } from './candidUIWebviewProvider';
import { CandidUIWebviewSidebarProvider } from './candidUIWebviewSidebarProvider';
import { getCandidUIDeployed } from './globalVariables';

export function activateCommands(context: vscode.ExtensionContext, treeDataProvider: JsonTreeProvider, jsonTreeCandidProvider: JsonTreeCandidProvider,
                                 candidUIWebviewProvider: CandidUIWebviewProvider, candidUIWebviewSidebarProvider: CandidUIWebviewSidebarProvider,
                                 outputChannel: vscode.OutputChannel) {
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(CandidUIWebviewSidebarProvider.viewType, candidUIWebviewSidebarProvider));
    vscode.commands.registerCommand('jsonTree.refreshEntry', () => treeDataProvider.refresh());
    vscode.commands.registerCommand('jsonTree.deployCanister', (item: JsonTreeItem) => {
        runCommand(`dfx deploy ${item.label.split(':')[0]}`, `Deploying canister: ${item.label}`, item.label, outputChannel, jsonTreeCandidProvider);
    });
    vscode.commands.registerCommand('jsonTree.startReplica', () => {
        startReplica(outputChannel);
    });
    vscode.commands.registerCommand('jsonTree.deployCanisters', () => {
        runCommand('dfx deploy', 'Deploying canisters...', undefined, outputChannel, jsonTreeCandidProvider);
    });
    vscode.commands.registerCommand('jsonTree.openJson', openJson);
    vscode.commands.registerCommand('jsonTree.showCanisterGroupActions', showCanisterGroupActions);
    vscode.commands.registerCommand('jsonTree.showCanisterActions', showCanisterActions);
    vscode.commands.registerCommand('jsonTree.viewLogs', (item: JsonTreeItem) => {
        viewLogs(item, context.extensionUri);
    });
    vscode.commands.registerCommand('dfx.startCandid', () => {
        startCandid(outputChannel, context.extensionPath);  
    });
    vscode.commands.registerCommand('dfx.openCandidUI', (item: JsonTreeItem) => {
        if (!getCandidUIDeployed()) {
            let panel = candidUIWebviewProvider.createEmptyWebview();
            startCandidSync(outputChannel, context.extensionPath);
            candidUIWebviewProvider.refresh();
            candidUIWebviewProvider.updateWebviewHtml(item, panel)
        }
        else {
            candidUIWebviewProvider.refresh();
            candidUIWebviewProvider.createWebViewPanel(item);
        }
    });
    vscode.commands.registerCommand('dfx.openCandidUISidebar', (item: JsonTreeItem) => {
        if (!getCandidUIDeployed()) {
            candidUIWebviewSidebarProvider.emptyWebview();
            startCandidSync(outputChannel, context.extensionPath);
        }
        candidUIWebviewSidebarProvider.refreshWebviewForJsonTreeItem(item);
    });

    vscode.commands.registerCommand('dfx.openCandidUISidebarFromJsonTree', (canisterId: string) => {
        if (!getCandidUIDeployed()) {
            candidUIWebviewSidebarProvider.emptyWebview();
            startCandidSync(outputChannel, context.extensionPath);
        }
        candidUIWebviewSidebarProvider.refreshWebviewForCanisterId(canisterId);
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
    const options = ['Deploy Canister', 'View Logs', 'Open Candid UI', 'Open Candid UI in sidebar'];
    const selection = await vscode.window.showQuickPick(options, {
        placeHolder: 'Select an action'
    });

    if (selection === 'Deploy Canister') {
        vscode.commands.executeCommand('jsonTree.deployCanister', item);
    } else if (selection === 'View Logs') {
        vscode.commands.executeCommand('jsonTree.viewLogs', item);
    } else if (selection === 'Open Candid UI') {
        vscode.commands.executeCommand('dfx.openCandidUI', item);
    } else if (selection === 'Open Candid UI in sidebar') {
        vscode.commands.executeCommand('dfx.openCandidUISidebar', item);
    }
}

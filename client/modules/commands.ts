import * as vscode from 'vscode';
import { JsonTreeProvider, JsonTreeItem } from '../jsonTreeProvider';
import { runCommand, createProject, viewLogs } from './projectManager';
import { getDfxPath, setDfxPath, getCandidUICanisterId, setCandidUICanisterId } from './globalVariables';
import { startReplica } from './replicaManager';
import { CandidUIWebviewProvider } from './candidUIWebviewProvider';
import { ReactPanel } from './ReactPanel';

export function activateCommands(context: vscode.ExtensionContext, treeDataProvider: JsonTreeProvider, canistersFileProvider: CandidUIWebviewProvider, outputChannel: vscode.OutputChannel) {
    vscode.commands.registerCommand('jsonTree.refreshEntry', () => treeDataProvider.refresh());
    vscode.commands.registerCommand('jsonTree.createProject', () => createProject(outputChannel));
    vscode.commands.registerCommand('jsonTree.deployCanister', (item: JsonTreeItem) => {
        runCommand(`dfx deploy ${item.label.split(':')[0]} --network playground`, `Deploying canister: ${item.label}`, item.label, outputChannel);
    });
    vscode.commands.registerCommand('jsonTree.startReplica', () => {
        startReplica(outputChannel);
    });
    vscode.commands.registerCommand('jsonTree.deployCanisters', () => {
        runCommand('dfx deploy --network playground', 'Deploying canisters...', undefined, outputChannel);
    });
    vscode.commands.registerCommand('jsonTree.openJson', openJson);
    vscode.commands.registerCommand('jsonTree.showCanisterGroupActions', showCanisterGroupActions);
    vscode.commands.registerCommand('jsonTree.showCanisterActions', showCanisterActions);
    vscode.commands.registerCommand('jsonTree.showOptions', showOptions);
    vscode.commands.registerCommand('jsonTree.configureDfxPath', configureDfxPath);
    vscode.commands.registerCommand('jsonTree.viewLogs', viewLogs);
    vscode.commands.registerCommand('dfx.openCandidUI', (item: JsonTreeItem) => {
        canistersFileProvider.refresh;
        canistersFileProvider.createWebViewPanel(item);
    });
    vscode.commands.registerCommand('dfx.setCandidUICanisterId', configureCandidUICanisterId);
    context.subscriptions.push(vscode.commands.registerCommand('react-webview.start', () => {
		ReactPanel.createOrShow(context.extensionPath, context.extensionUri);
	}));
	vscode.commands.executeCommand('react-webview.start');
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
    const options = ['Start Replica', 'Deploy Canisters'];
    const selection = await vscode.window.showQuickPick(options, {
        placeHolder: 'Select an action'
    });

    if (selection === 'Start Replica') {
        vscode.commands.executeCommand('jsonTree.startReplica');
    } else if (selection === 'Deploy Canisters') {
        vscode.commands.executeCommand('jsonTree.deployCanisters');
    }
}

async function showCanisterActions(item: JsonTreeItem) {
    const options = ['Deploy Canister', 'View Logs', 'Open Candid UI'];
    const selection = await vscode.window.showQuickPick(options, {
        placeHolder: 'Select an action'
    });

    if (selection === 'Deploy Canister') {
        vscode.commands.executeCommand('jsonTree.deployCanister', item);
    } else if (selection === 'View Logs') {
        vscode.commands.executeCommand('jsonTree.viewLogs', item);
    } else if (selection === 'Open Candid UI') {
        vscode.commands.executeCommand('dfx.openCandidUI', item);
    }
}

async function showOptions() {
    const options = [
        { label: 'Refresh', command: 'jsonTree.refreshEntry' },
        { label: 'Create New Project', command: 'jsonTree.createProject' },
        { label: 'Configure WSL DFX Path', command: 'jsonTree.configureDfxPath' },
        { label: 'Set Candid UI Canister ID', command: 'dfx.setCandidUICanisterId' },
    ];
    const selection = await vscode.window.showQuickPick(options, {
        placeHolder: 'Select an option'
    });

    if (selection) {
        vscode.commands.executeCommand(selection.command);
    }
}

async function configureDfxPath() {
    let newPath = await vscode.window.showInputBox({
        prompt: 'Enter the WSL path to dfx',
        placeHolder: '/home/user/.local/share/dfx/bin/'
    });

    if (newPath) {
        setDfxPath(newPath);
        vscode.window.showInformationMessage(`WSL DFX path set to: ${getDfxPath()}`);
    }
}

async function configureCandidUICanisterId() {
    let canisterId = await vscode.window.showInputBox({
        prompt: 'Enter the Candid UI Canister ID that you wish to display',
        placeHolder: 'bw4dl-smaaa-aaaaa-qaacq-cai'
    });

    if (canisterId) {
        setCandidUICanisterId(canisterId);
        vscode.window.showInformationMessage(`Candid UI Canister ID path set to: ${getCandidUICanisterId()}`);
    }
}

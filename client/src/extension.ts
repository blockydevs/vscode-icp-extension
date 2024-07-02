/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { JsonTreeItem, JsonTreeProvider } from './jsonTreeProvider';
import { exec } from 'child_process';

let client: LanguageClient;
let dfxPath: string;
let canisterLogs: { [key: string]: string } = {};

export function activate(context: vscode.ExtensionContext) {
    // The server is implemented in node
    const serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
        }
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ scheme: 'file', pattern: "**/dfx.json", language: 'json' }],
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
        }
    };

    // Create the language client and start the client.
    client = new LanguageClient('languageServerExample', 'Language Server Example', serverOptions, clientOptions);

    // Start the client. This will also launch the server
    client.start();

    // jsonTree
    const rootPath = vscode.workspace.rootPath;
    const treeDataProvider = new JsonTreeProvider(rootPath);
    vscode.window.registerTreeDataProvider('jsonTree', treeDataProvider);

    const outputChannel = vscode.window.createOutputChannel("Motoko");
    context.subscriptions.push(outputChannel);

    vscode.commands.registerCommand('jsonTree.refreshEntry', () => treeDataProvider.refresh());
    vscode.commands.registerCommand('jsonTree.createProject', () => createProject());
    vscode.commands.registerCommand('jsonTree.deployCanister', (item: JsonTreeItem) => {
        runCommand(`dfx deploy ${item.label.split(':')[0]} --network playground`, `Deploying canister: ${item.label}`, item.label);
    });
    vscode.commands.registerCommand('jsonTree.startReplica', () => {
        startReplica();
    });

    vscode.commands.registerCommand('jsonTree.deployCanisters', () => {
        runCommand('dfx deploy --network playground', 'Deploying canisters...');
    });

    vscode.commands.registerCommand('jsonTree.openJson', (filePath: string, keyPath: string, value: any) => {
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
    });


    vscode.commands.registerCommand('jsonTree.showCanisterGroupActions', async () => {
        const options = ['Start Replica', 'Deploy Canisters'];
        const selection = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select an action'
        });

        if (selection === 'Start Replica') {
            vscode.commands.executeCommand('jsonTree.startReplica');
        } else if (selection === 'Deploy Canisters') {
            vscode.commands.executeCommand('jsonTree.deployCanisters');
        }
    });

    vscode.commands.registerCommand('jsonTree.showCanisterActions', async (item: JsonTreeItem) => {
        const options = ['Deploy Canister', 'View Logs'];
        const selection = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select an action'
        });

        if (selection === 'Deploy Canister') {
            vscode.commands.executeCommand('jsonTree.deployCanister', item);
        } else if (selection === 'View Logs') {
            vscode.commands.executeCommand('jsonTree.viewLogs', item);
        }
    });

    vscode.commands.registerCommand('jsonTree.showOptions', async () => {
        const options = [
            { label: 'Refresh', command: 'jsonTree.refreshEntry' },
            { label: 'Create New Project', command: 'jsonTree.createProject' },
            { label: 'Configure WSL DFX Path', command: 'jsonTree.configureDfxPath' },
        ];
        const selection = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select an option'
        });

        if (selection) {
            vscode.commands.executeCommand(selection.command);
        }
    });

    vscode.commands.registerCommand('jsonTree.configureDfxPath', async () => {
        let newPath = await vscode.window.showInputBox({
            prompt: 'Enter the WSL path to dfx',
            placeHolder: '/home/user/.local/share/dfx/bin/'
        });

        if (newPath) {
            dfxPath = newPath;
            vscode.window.showInformationMessage(`WSL DFX path set to: ${dfxPath}`);
        }
    });

    vscode.commands.registerCommand('jsonTree.viewLogs', (item: JsonTreeItem) => {
        viewLogs(item);
    });

    function runCommand(command: string, infoMessage: string, canisterName?: string) {
        outputChannel.show(true);
        outputChannel.appendLine(infoMessage);

        const fullCommand = dfxPath ? `wsl ${dfxPath}${command}` : `${command}`;

        exec(fullCommand, { cwd: vscode.workspace.rootPath }, (error, stdout, stderr) => {
            if (error) {
                outputChannel.appendLine(`Error: ${error.message}`);
                if (canisterName) {
                    canisterLogs[canisterName] = (canisterLogs[canisterName] || '') + `Error: ${error.message}\n`;
                }
                return;
            }
            if (stderr) {
                outputChannel.appendLine(stderr.toString());
                if (canisterName) {
                    canisterLogs[canisterName] = (canisterLogs[canisterName] || '') + stderr.toString() + '\n';
                }
                return;
            }
            outputChannel.appendLine(stdout.toString());
            if (canisterName) {
                canisterLogs[canisterName] = (canisterLogs[canisterName] || '') + stdout.toString() + '\n';
            }
        });
    }

    function startReplica() {
        outputChannel.show(true);
        outputChannel.appendLine(`Starting replica...`);
        
        const command = dfxPath ? `wsl ${dfxPath}dfx start` : `dfx start`;
        const replicaProcess = exec(command, { cwd: vscode.workspace.rootPath });

        replicaProcess.stdout.on('data', (data) => {
            outputChannel.appendLine(data.toString());
        });

        replicaProcess.stderr.on('data', (data) => {
            outputChannel.appendLine(data.toString());
        });

        replicaProcess.on('close', (code) => {
            outputChannel.appendLine(`Replica process exited with code ${code}`);
        });
    }

    async function createProject() {
        const projectName = await vscode.window.showInputBox({
            prompt: 'Enter the name of the new project',
            placeHolder: 'my_new_project'
        });

        const projectLocation = await vscode.window.showInputBox({
            prompt: 'Enter the location where the project should be created',
            value: vscode.workspace.rootPath || '/path/to/project/location'
        });

        if (projectName && projectLocation) {
            outputChannel.show(true);
            outputChannel.appendLine(`Creating new project: ${projectName} at ${projectLocation}`);
            
            const command = dfxPath ? `wsl ${dfxPath}dfx new ${projectName}` : `dfx new ${projectName}`;
            const process = exec(command, { cwd: projectLocation });

            process.stdout.on('data', (data) => {
                outputChannel.appendLine(data.toString());
            });

            process.stderr.on('data', (data) => {
                outputChannel.appendLine(data.toString());
            });

            process.on('close', (code) => {
                outputChannel.appendLine(`Creating new project process exited with code ${code}`);
            });
        } else {
            vscode.window.showErrorMessage('Project name and location are required.');
        }
    }

    function getWebviewContent(canisterName: string): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Logs for ${canisterName}</title>
    <style>
        body { font-family: Arial, sans-serif; background: transparent; color: white; }
        #logs { white-space: pre-wrap; background: transparent; padding: 10px; border-radius: 5px; }
        a { color: #4f8aff; text-decoration: underline; }
    </style>
</head>
<body>
    <h1>Logs for ${canisterName}</h1>
    <div id="logs">Loading logs...</div>
    <script>
        const vscode = acquireVsCodeApi();
        window.onload = () => {
            vscode.postMessage({ command: 'fetchLogs' });
        };
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'updateLogs') {
                document.getElementById('logs').innerHTML = message.logs.replace(/(https?:\\/\\/\\S+)/g, '<a href="$1" target="_blank">$1</a>');
            }
        });
        setInterval(() => {
            vscode.postMessage({ command: 'fetchLogs' });
        }, 1000); // Fetch logs every second
    </script>
</body>
</html>`;
    }

    function viewLogs(item: JsonTreeItem) {
        const panel = vscode.window.createWebviewPanel(
            'canisterLogs',
            `Logs for ${item.label}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = getWebviewContent(item.label);

        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'fetchLogs':
                        const logs = canisterLogs[item.label] || 'No logs available';
                        panel.webview.postMessage({ command: 'updateLogs', logs });
                        break;
                }
            },
            undefined,
            context.subscriptions
        );

        // Initial fetch
        const initialLogs = canisterLogs[item.label] || 'No logs available';
        panel.webview.postMessage({ command: 'updateLogs', initialLogs });
    }
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

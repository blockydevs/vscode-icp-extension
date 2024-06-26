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
    vscode.commands.registerCommand('jsonTree.refreshEntry', () => treeDataProvider.refresh());
    vscode.commands.registerCommand('jsonTree.deployCanister', (item: JsonTreeItem) => {
        runCommand(`dfx deploy ${item.label.split(':')[0]} --network playground`, `Deploying canister: ${item.label}`);
    });
    vscode.commands.registerCommand('jsonTree.startReplica', () => {
        runCommand('dfx start --background', 'Starting replica...');
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('http://localhost:44749/_/dashboard'));
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
        const options = ['Deploy Canister'];
        const selection = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select an action'
        });

        if (selection === 'Deploy Canister') {
            vscode.commands.executeCommand('jsonTree.deployCanister', item);
        }
    });
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

function runCommand(command: string, infoMessage: string) {
    vscode.window.showInformationMessage(infoMessage);
    exec(command, { cwd: vscode.workspace.rootPath }, (error, stdout, stderr) => {
        if (error) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            vscode.window.showErrorMessage(`Stderr: ${stderr}`);
            return;
        }
        vscode.window.showInformationMessage(`Output: ${stdout}`);
    });
}

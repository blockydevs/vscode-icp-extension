/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';
import { JsonTreeProvider } from './jsonTreeProvider';
import { activateCommands } from './modules/commands';
import { configureLanguageClient } from './modules/languageClient';
import { setDfxPath, setCanisterLogs } from './modules/globalVariables';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
    client = configureLanguageClient(context);
    // Start the client. This will also launch the server
    client.start();

    const rootPath = vscode.workspace.rootPath;
    const treeDataProvider = new JsonTreeProvider(rootPath);
    vscode.window.registerTreeDataProvider('jsonTree', treeDataProvider);

    const outputChannel = vscode.window.createOutputChannel("Motoko");
    context.subscriptions.push(outputChannel);

    // Set initial global variables
    setDfxPath('');
    setCanisterLogs({});

    activateCommands(context, treeDataProvider, outputChannel);
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';
import { JsonTreeProvider } from './modules/jsonTreeProvider';
import { JsonTreeCandidProvider } from './modules/jsonTreeCandidProvider';
import { activateCommands } from './modules/commands';
import { configureLanguageClient } from './modules/languageClient';
import { CandidUIWebviewProvider } from './modules/candidUIWebviewProvider';
import { CandidUIWebviewSidebarProvider } from './modules/candidUIWebviewSidebarProvider';
import { TerminalProvider } from './modules/terminalProvider';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
    client = configureLanguageClient(context);
    // Start the client. This will also launch the server
    client.start();

    const rootPath = vscode.workspace.rootPath;
    const treeDataProvider = new JsonTreeProvider(rootPath);
    const candidProvider = new JsonTreeCandidProvider(rootPath);
    const candidUIWebviewProvider = new CandidUIWebviewProvider(rootPath, context.extensionPath, context.extensionUri);
    const candidUIWebviewSidebarProvider = new CandidUIWebviewSidebarProvider(context.extensionUri, rootPath, context.extensionPath);
    const terminal = new TerminalProvider()
    vscode.window.registerTreeDataProvider('jsonTree', treeDataProvider);
    vscode.window.registerTreeDataProvider('jsonTreeCandid', candidProvider);

    activateCommands(context, treeDataProvider, candidProvider, candidUIWebviewProvider, candidUIWebviewSidebarProvider, terminal);
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

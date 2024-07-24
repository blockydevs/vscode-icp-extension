import * as vscode from 'vscode';
import { exec } from 'child_process';
import { JsonTreeItem } from './jsonTreeProvider';
import { getCanisterLogs } from './globalVariables';
import { JsonTreeCandidProvider } from './jsonTreeCandidProvider';

function stripAnsiCodes(input: string): string {
    const ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
    return input.replace(ansiRegex, '');
}

export function runCommand(command: string, infoMessage: string, canisterName: string | undefined, outputChannel: vscode.OutputChannel, jsonTreeCandidProvider: JsonTreeCandidProvider) {
    const canisterLogs = getCanisterLogs();
    outputChannel.show(true);
    outputChannel.appendLine(infoMessage);

    exec(command, { cwd: vscode.workspace.rootPath }, (error, stdout, stderr) => {
        jsonTreeCandidProvider.refresh();
        if (error) {
            const cleanError = stripAnsiCodes(error.message);
            outputChannel.appendLine(`Error: ${cleanError}`);
            if (canisterName) {
                canisterLogs[canisterName] = (canisterLogs[canisterName] || '') + `Error: ${cleanError}\n`;
            }
            return;
        }
        if (stderr) {
            const cleanStderr = stripAnsiCodes(stderr.toString());
            outputChannel.appendLine(cleanStderr);
            if (canisterName) {
                canisterLogs[canisterName] = (canisterLogs[canisterName] || '') + cleanStderr + '\n';
            }
            return;
        }
        const cleanStdout = stripAnsiCodes(stdout.toString());
        outputChannel.appendLine(cleanStdout);
        if (canisterName) {
            canisterLogs[canisterName] = (canisterLogs[canisterName] || '') + cleanStdout + '\n';
        }
    });
}

export function viewLogs(item: JsonTreeItem, extensionUri: vscode.Uri) {
    const canisterLogs = getCanisterLogs();
    const panel = vscode.window.createWebviewPanel(
        'canisterLogs',
        `Logs for ${item.label}`,
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    const stylesPathOnDisk = vscode.Uri.joinPath(extensionUri, 'public', 'styles', 'styles-logs.css');
	const stylesUri = panel.webview.asWebviewUri(stylesPathOnDisk);

    panel.webview.html = getWebviewContent(item.label, stylesUri);

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
        []
    );

    const initialLogs = canisterLogs[item.label] || 'No logs available';
    panel.webview.postMessage({ command: 'updateLogs', initialLogs });
}

function getWebviewContent(canisterName: string, stylesUri: vscode.Uri): string {
    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Logs for ${canisterName}</title>
            <link href="${stylesUri}" rel="stylesheet" />
            <style>
                #logs { white-space: pre-wrap; padding: 10px; border-radius: 5px; }
                a { text-decoration: underline; }
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
                }, 1000);
            </script>
        </body>
        </html>`;
}

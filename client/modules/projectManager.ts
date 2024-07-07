import * as vscode from 'vscode';
import { exec } from 'child_process';
import { JsonTreeItem } from '../jsonTreeProvider';
import { getDfxPath, getCanisterLogs } from './globalVariables';

export async function createProject(outputChannel: vscode.OutputChannel) {
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
        outputChannel.appendLine(`Using DFX path: ${getDfxPath()}`);
        
        const command = getDfxPath() ? `wsl ${getDfxPath()}dfx new ${projectName}` : `dfx new ${projectName}`;
        const process = exec(command, { cwd: projectLocation });

        if (process.stdout) {
            process.stdout.on('data', (data) => {
                outputChannel.appendLine(data.toString());
            });
        }

        if (process.stderr) {
            process.stderr.on('data', (data) => {
                outputChannel.appendLine(data.toString());
            });
        }

        process.on('close', (code) => {
            outputChannel.appendLine(`Creating new project process exited with code ${code}`);
            if (code !== 0) {
                vscode.window.showErrorMessage(`Failed to create project. Exit code: ${code}`);
            }
        });
    } else {
        vscode.window.showErrorMessage('Project name and location are required.');
    }
}

export function runCommand(command: string, infoMessage: string, canisterName: string | undefined, outputChannel: vscode.OutputChannel) {
    const canisterLogs = getCanisterLogs();
    outputChannel.show(true);
    outputChannel.appendLine(infoMessage);

    const fullCommand = getDfxPath() ? `wsl ${getDfxPath()}${command}` : `${command}`;

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

export function viewLogs(item: JsonTreeItem) {
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
        []
    );

    const initialLogs = canisterLogs[item.label] || 'No logs available';
    panel.webview.postMessage({ command: 'updateLogs', initialLogs });
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
        }, 1000);
    </script>
</body>
</html>`;
}

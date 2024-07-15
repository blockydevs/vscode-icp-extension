import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';

export function startCandid(outputChannel: vscode.OutputChannel, extensionPath: string) {
    outputChannel.show(true);
    outputChannel.appendLine(`Starting Candid UI ...`);
    
    const command = `dfx deploy`;
    const candidProcess = exec(command, { cwd: path.join(extensionPath, 'tools', 'ui') });

    if (candidProcess.stdout) {
        candidProcess.stdout.on('data', (data) => {
            outputChannel.appendLine(data.toString());
        });
    }

    if (candidProcess.stderr) {
        candidProcess.stderr.on('data', (data) => {
            outputChannel.appendLine(data.toString());
        });
    }

    candidProcess.on('close', (code) => {
        outputChannel.appendLine(`Candid UI process exited with code ${code}`);
    });
}

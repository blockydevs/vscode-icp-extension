import * as vscode from 'vscode';
import { exec } from 'child_process';
import { getDfxPath } from './globalVariables';

export function startReplica(outputChannel: vscode.OutputChannel) {
    outputChannel.show(true);
    outputChannel.appendLine(`Starting replica...`);
    
    const command = getDfxPath() ? `wsl ${getDfxPath()}dfx start` : `dfx start`;
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

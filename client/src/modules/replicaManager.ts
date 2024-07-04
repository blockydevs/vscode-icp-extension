import * as vscode from 'vscode';
import { exec } from 'child_process';
import { getDfxPath } from './globalVariables';

function stripAnsiCodes(input: string): string {
    const ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
    return input.replace(ansiRegex, '');
}

export function startReplica(outputChannel: vscode.OutputChannel) {
    outputChannel.show(true);
    outputChannel.appendLine(`Starting replica...`);
    
    const command = getDfxPath() ? `wsl ${getDfxPath()}dfx start` : `dfx start`;
    const replicaProcess = exec(command, { cwd: vscode.workspace.rootPath });

    replicaProcess.stdout.on('data', (data) => {
        const cleanData = stripAnsiCodes(data.toString());
        outputChannel.appendLine(cleanData);
    });

    replicaProcess.stderr.on('data', (data) => {
        const cleanData = stripAnsiCodes(data.toString());
        outputChannel.appendLine(cleanData);
    });

    replicaProcess.on('close', (code) => {
        outputChannel.appendLine(`Replica process exited with code ${code}`);
    });
}

import * as vscode from 'vscode';
import { exec, execSync } from 'child_process';
import * as path from 'path';
import {setCandidUIDeployed} from './globalVariables'

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

    setCandidUIDeployed(true);
}

export function startCandidSync(outputChannel: vscode.OutputChannel, extensionPath: string) {
    outputChannel.show(true);
    outputChannel.appendLine(`Starting Candid UI ...`);
    
    const command = `dfx deploy`;
    const candidProcess = execSync(command, { cwd: path.join(extensionPath, 'tools', 'ui') });

    outputChannel.append(candidProcess.toString('utf-8'));

    setCandidUIDeployed(true);
}

import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import { JsonTreeItem } from './jsonTreeProvider';
import { CandidUIWebviewProvider } from './candidUIWebviewProvider';
import { CandidUIWebviewSidebarProvider } from './candidUIWebviewSidebarProvider';

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

export function startCandidAndOpenWebview(outputChannel: vscode.OutputChannel, extensionPath: string, candidUIWebviewProvider: CandidUIWebviewProvider, item: JsonTreeItem, panel: vscode.WebviewPanel) {
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
        candidUIWebviewProvider.refresh();
        candidUIWebviewProvider.updateWebviewHtml(item, panel);
    });
}

export function startCandidAndOpenWebviewSidebarForJsonTreeItem(outputChannel: vscode.OutputChannel, extensionPath: string, candidUIWebviewSidebarProvider: CandidUIWebviewSidebarProvider, item: JsonTreeItem) {
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
        candidUIWebviewSidebarProvider.refreshWebviewForJsonTreeItem(item);
    });
}

export function startCandidAndOpenWebviewSidebarForCanisterId(outputChannel: vscode.OutputChannel, extensionPath: string, candidUIWebviewSidebarProvider: CandidUIWebviewSidebarProvider, canisterId: string) {
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
        candidUIWebviewSidebarProvider.refreshWebviewForCanisterId(canisterId);
    });
}

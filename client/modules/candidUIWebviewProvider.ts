import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { JsonTreeItem } from '../jsonTreeProvider';

export class CandidUIWebviewProvider {
	private jsonData: any;
    private candidFileData: any;
    private jsonFilePath: string;
    private candidFilePath: string;
    private webViewPort: number;

	constructor (private workspaceRoot: string | undefined, private extensionPath : string, private port : number) {
        this.jsonFilePath = path.join(this.workspaceRoot!, '.dfx', 'local', 'canister_ids.json');
        this.candidFilePath = path.join(this.extensionPath!, 'tools', 'ui', '.dfx', 'local', 'canister_ids.json');
        this.webViewPort = port;
        this.refresh();
    }

	refresh(): void {
        if (this.workspaceRoot) {
            if (fs.existsSync(this.jsonFilePath)) {
                const fileContent = fs.readFileSync(this.jsonFilePath, 'utf-8');
                this.jsonData = JSON.parse(fileContent);
            } else {
                this.jsonData = null;
            }
        }
        if (fs.existsSync(this.candidFilePath)) {
            const candidFileContent = fs.readFileSync(this.candidFilePath, 'utf-8');
            this.candidFileData = JSON.parse(candidFileContent);
        } else {
            this.candidFileData = null;
        }
    }

    createWebViewPanel(item: JsonTreeItem) : void {
        if (this.jsonData && this.candidFileData) {
            let canisterId = this.getCanisterId(this.jsonData, item.label.split(':')[0]);
            let canisterCandidUI = this.getCanisterId(this.candidFileData, 'didjs');
            const panel = vscode.window.createWebviewPanel('dfx.candidUIPreview', 'Candid UI', vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    portMapping: [
                        { webviewPort: this.webViewPort, extensionHostPort: 8000}
                    ]
                });

            panel.webview.html = this.getWebviewContent(canisterCandidUI, canisterId);
        }
        else {
            vscode.window.showInformationMessage(`Could not get proper configuration for opening Candid UI`);
        }
    }

    private getWebviewContent(canisterCandidUI: any, canisterId: any) : string {
        return `<!DOCTYPE html>
                    <html lang="en"">
                    <head>
                        <meta charset="UTF-8">
                        <title>Candid UI</title>
                        <style>
                            html { width: 100%; height: 100%; min-height: 100%; display: flex; }
                            body { flex: 1; display: flex; }
                            iframe { flex: 1; border: none; background: white; }
                        </style>
                    </head>
                    <body>
                        <iframe src="http://localhost:${this.webViewPort}/?canisterId=${canisterCandidUI}&id=${canisterId}"></iframe>
                    </body>
                    </html>`
    }

    private getCanisterId(data: any, key: string) : any {
        return data[key]["local"];
    }
}
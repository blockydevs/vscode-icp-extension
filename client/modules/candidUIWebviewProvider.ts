import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { JsonTreeItem } from '../jsonTreeProvider';
import { getCandidUICanisterId } from './globalVariables';

export class CandidUIWebviewProvider {
	private jsonData: any;
    private jsonFilePath: string;
    private webViewPort: number;

	constructor (private workspaceRoot: string | undefined, private port : number) {
        this.jsonFilePath = path.join(this.workspaceRoot!, '.dfx', 'local', 'canister_ids.json');
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
    }

    createWebViewPanel(item: JsonTreeItem) : void {
        let canisterCandidUI = getCandidUICanisterId();
        if (this.jsonData && canisterCandidUI && canisterCandidUI !== '') {
            let canisterId = this.getCanisterId(item.label.split(':')[0]);
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

    private getCanisterId(key: string) : any {
        return this.jsonData[key]["local"];
    }
}
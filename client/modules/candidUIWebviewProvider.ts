import * as vscode from 'vscode';
import { JsonTreeItem } from './jsonTreeProvider';
import { CandidUIProvider } from './candidUIProvider';

export class CandidUIWebviewProvider extends CandidUIProvider {
	constructor (protected workspaceRoot: string | undefined, protected extensionPath : string) {
        super(workspaceRoot, extensionPath);
    }

    createWebViewPanel(item: JsonTreeItem) : void {
        let itemKey = item.label?.split(':')[0];
        if (!this.candidFileData) {
            this.showInformationMessage(`Could not acquire Candid UI canister file. Have you deployed Candid?`);
        }
        else if (!this.jsonData) {
            this.showInformationMessage(`Could not acquire deployed ${itemKey} canister file. Have you properly deployed the canister?`);
        }

        else {
            let canisterCandidUI = this.getCanisterId(this.candidFileData, CandidUIProvider.CANDID_CANISTER_NAME);
            let canisterId = this.getCanisterId(this.jsonData, itemKey);
            if (canisterCandidUI && canisterId) {
                const panel = vscode.window.createWebviewPanel('dfx.candidUIPreview', 'Candid UI', vscode.ViewColumn.One,
                    {
                        enableScripts: true,
                        portMapping: [
                            { webviewPort: CandidUIProvider.WEBVIEW_PORT, extensionHostPort: 8000}
                        ]
                    });

                panel.webview.html = this.getWebviewContent(canisterCandidUI, canisterId);
            }
            else {
                this.showInformationMessage(`Could not get proper configuration for opening Candid UI`);
            }
        }
    }

    updateWebviewHtml(item: JsonTreeItem, panel: vscode.WebviewPanel) : void {
        let itemKey = item.label?.split(':')[0];
        if (!this.candidFileData) {
            this.showInformationMessage(`Could not acquire Candid UI canister file. Have you deployed Candid?`);
        }
        else if (!this.jsonData) {
            this.showInformationMessage(`Could not acquire deployed ${itemKey} canister file. Have you properly deployed the canister?`);
        }

        else {
            let canisterCandidUI = this.getCanisterId(this.candidFileData, CandidUIProvider.CANDID_CANISTER_NAME);
            let canisterId = this.getCanisterId(this.jsonData, itemKey);
            if (canisterCandidUI && canisterId) {
                panel.webview.html = this.getWebviewContent(canisterCandidUI, canisterId);
            }
            else {
                this.showInformationMessage(`Could not get proper configuration for opening Candid UI`);
            }
        }
    }

    createEmptyWebview() : vscode.WebviewPanel {
        const panel = vscode.window.createWebviewPanel('dfx.candidUIPreview', 'Candid UI', vscode.ViewColumn.One,
            {
                enableScripts: true,
                portMapping: [
                    { webviewPort: CandidUIProvider.WEBVIEW_PORT, extensionHostPort: 8000}
                ]
            });

        panel.webview.html = this.getEmptyWebviewContent();
        return panel;
    }
}
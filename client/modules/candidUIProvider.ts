import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class CandidUIProvider {
	protected static readonly CANDID_CANISTER_NAME = 'didjs';
	protected static readonly WEBVIEW_PORT = 4943;
	private static readonly CANISTER_DEPLOYMENT_ENVIRONMENT = 'local';

	protected jsonData: any;
    protected candidFileData: any;
    protected jsonFilePath: string;
    protected candidFilePath: string;
    protected _extensionUri: vscode.Uri

	constructor (protected workspaceRoot: string | undefined, protected extensionPath : string, protected extensionUri: vscode.Uri) {
        this.jsonFilePath = path.join(this.workspaceRoot!, '.dfx', 'local', 'canister_ids.json');
        this.candidFilePath = path.join(this.extensionPath!, 'tools', 'ui', '.dfx', 'local', 'canister_ids.json');
        this._extensionUri = extensionUri;
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

    protected getWebviewContent(canisterCandidUI: any, canisterId: any) : string {
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
                            <script>
                                function getAllStyles() {
                                    const styles = document.querySelector('html').getAttribute('style');
                                    return styles;
                                }

                                function addStylesToIframe(styles) {
                                    const body = document.querySelector('body');
                                    const iframe = document.createElement('iframe');
                                    iframe.src = "http://localhost:${CandidUIProvider.WEBVIEW_PORT}/?canisterId=${canisterCandidUI}&id=${canisterId}";
                                    iframe.onload = function() {
                                        iframe.contentWindow.postMessage(styles, "*");
                                    }
                                    body.appendChild(iframe);                         
                                }

                                const styles = getAllStyles();
                                addStylesToIframe(styles);
                            </script>
                        </body>
                    </html>`
    }

    protected getEmptyWebviewContent(stylesUri: vscode.Uri) {
        return `<!DOCTYPE html>
                    <head>
                        <link href="${stylesUri}" rel="stylesheet" />
                        <style>
                            #logs { white-space: pre-wrap; padding: 10px; border-radius: 5px; }
                            a { text-decoration: underline; }
                        </style>
                    </head>
                    <html lang="en"">
                        <head>
                            <meta charset="UTF-8">
                            <title>Candid UI</title>
                        </head>
                        <body>
                            <p>Waiting for Candid UI deploy finish</p>
                        </body>
                    </html>`
    }

    getCanisterId(data: any, key: string) : any {
        if (data[key] && data[key][CandidUIProvider.CANISTER_DEPLOYMENT_ENVIRONMENT]) {
            return data[key][CandidUIProvider.CANISTER_DEPLOYMENT_ENVIRONMENT];
        }
        else {
            return undefined;
        }
    }

    showInformationMessage(message: string) : void {
        vscode.window.showInformationMessage(message);
    }
}
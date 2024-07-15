import * as vscode from 'vscode';
import { JsonTreeItem } from './jsonTreeProvider';
import { CandidUIProvider } from './candidUIProvider';

export class CandidUIWebviewSidebarProvider extends CandidUIProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'dfx.candidUISidebar';

	private _view?: vscode.WebviewView;
	private _item?: JsonTreeItem;


	constructor(
		private readonly _extensionUri: vscode.Uri,
		protected workspaceRoot: string | undefined, 
		protected extensionPath : string
	) { 
		super(workspaceRoot, extensionPath);
		this._extensionUri = _extensionUri;
	}

	public refreshWebview(item?: JsonTreeItem) {
		this._item = item;
		this.refresh();
		if (this._view) {
			this._view.webview.html = this.createWebViewPanel();
		}
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this.createWebViewPanel();
	}

	createWebViewPanel() : string {
		if (!this._item) {
			return `<!DOCTYPE html>
                    <html lang="en"">
                    </html>`
		}
        let itemKey = this._item.label?.split(':')[0];
        if (!this.candidFileData) {
            this.showInformationMessage(`Could not acquire Candid UI canister file. Have you deployed Candid?`);
			return `<!DOCTYPE html>
                    <html lang="en"">
                    </html>`
        }
        else if (!this.jsonData) {
            this.showInformationMessage(`Could not acquire deployed ${itemKey} canister file. Have you properly deployed the canister?`);
			return `<!DOCTYPE html>
                    <html lang="en"">
                    </html>`
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

                return this.getWebviewContent(canisterCandidUI, canisterId);
            }
            else {
                this.showInformationMessage(`Could not get proper configuration for opening Candid UI`);
				return `<!DOCTYPE html>
                    <html lang="en"">
                    </html>`
            }
        }
    }
}
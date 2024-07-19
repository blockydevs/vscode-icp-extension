import * as vscode from 'vscode';
import { JsonTreeItem } from './jsonTreeProvider';
import { CandidUIProvider } from './candidUIProvider';

export class CandidUIWebviewSidebarProvider extends CandidUIProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'dfx.candidUISidebar';

	private _view?: vscode.WebviewView;
	private _item?: JsonTreeItem;
	private _canisterId?: string;


	constructor(
		protected readonly extensionUri: vscode.Uri,
		protected workspaceRoot: string | undefined, 
		protected extensionPath : string
	) { 
		super(workspaceRoot, extensionPath, extensionUri);
	}

	public emptyWebview() {
		if (this._view) {
			const stylesPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'public', 'styles', 'styles-logs.css');
        	const stylesUri = this._view.webview.asWebviewUri(stylesPathOnDisk);
			this._view.webview.html = this.getEmptyWebviewContent(stylesUri);
		}
	}

	public refreshWebviewForJsonTreeItem(item?: JsonTreeItem) {
		this._item = item;
		this.refresh();
		if (this._view) {
			this._view.webview.html = this.createWebviewPanel();
		}
	}

	public refreshWebviewForCanisterId(canisterId?: string) {
		this._canisterId = canisterId;
		this.refresh();
		if (this._view) {
			this._view.webview.html = this.createWebviewPanel();
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

		webviewView.webview.html = this.createWebviewPanel();
	}

	createWebviewPanel() : string {
		if (!this._item && !this._canisterId) {
			return `<!DOCTYPE html>
                    <html lang="en"">
                    </html>`
		}
        if (!this.candidFileData) {
            this.showInformationMessage(`Could not acquire Candid UI canister file. Have you deployed Candid?`);
			return `<!DOCTYPE html>
                    <html lang="en"">
                    </html>`
        }
        else if (!this.jsonData) {
            this.showInformationMessage(`Could not acquire deployed canister file. Have you properly deployed the canister?`);
			return `<!DOCTYPE html>
                    <html lang="en"">
                    </html>`
        }
        else {
            let canisterId = this.resolveCanisterId();
			if (!canisterId) {
				return `<!DOCTYPE html>
				<html lang="en"">
				</html>`
			}
            let canisterCandidUI = this.getCanisterId(this.candidFileData, CandidUIProvider.CANDID_CANISTER_NAME);
            if (canisterCandidUI && canisterId) {
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

	private resolveCanisterId() : string | undefined {
		if (this._item) {
			let itemKey = this._item.label?.split(':')[0];
            return this.getCanisterId(this.jsonData, itemKey);
		}
		else if (this._canisterId) {
			return this._canisterId;
		}
		else {
			return undefined;
		}
	}
}
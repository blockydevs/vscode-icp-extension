import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { canisterStatusCheckWithCanisterId } from './canisterStatusCheck';

export class JsonTreeCandidProvider implements vscode.TreeDataProvider<JsonTreeCandidItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<JsonTreeCandidItem | undefined | void> = new vscode.EventEmitter<JsonTreeCandidItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<JsonTreeCandidItem | undefined | void> = this._onDidChangeTreeData.event;
    private jsonData: any;
    private jsonFilePath: string;

    constructor(private workspaceRoot: string | undefined) {
        this.jsonFilePath = path.join(this.workspaceRoot!, '.dfx', 'local', 'canister_ids.json');
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
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: JsonTreeCandidItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: JsonTreeCandidItem): Thenable<JsonTreeCandidItem[]> {
        if (!this.jsonData) {
            return Promise.resolve([new JsonTreeCandidItem('No deployed canisters found in this project', vscode.TreeItemCollapsibleState.None, '')]);
        }
        return Promise.resolve(this.getJsonTreeCandidItems(this.jsonData));
    }

    private getJsonTreeCandidItems(obj: any): JsonTreeCandidItem[] {
        return Object.keys(obj).filter(key => key && key !== '__Candid_UI' && this.workspaceRoot && canisterStatusCheckWithCanisterId(this.workspaceRoot, obj[key]?.local)).map(key => {
            const canisterId = obj[key]?.local;
            const collapsibleState = vscode.TreeItemCollapsibleState.None;
            const command = {
                command: 'dfx.openCandidUISidebarFromJsonTree',
                title: 'Open Candid UI in sidebar',
                arguments: [canisterId]
            };
            return new JsonTreeCandidItem(key, collapsibleState, `Open Candid UI for canister ${key}`, command);
        });
    }
}

export class JsonTreeCandidItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed,
        public readonly tooltip: string,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = tooltip;
        this.command = command;
    }
}

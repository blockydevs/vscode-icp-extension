import { DocumentUri, OptionalVersionedTextDocumentIdentifier, Position, Range  } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { WorkspaceChange, ApplyWorkspaceEditResult} from 'vscode-languageserver-protocol';
import { connection } from "./server";

export class WSUpdates{
    private _wschanges: WorkspaceChange;

    constructor(){
        this._wschanges = new WorkspaceChange();
    }

    
    hasChanges(): boolean{
        return (this._wschanges.edit.changes != undefined || this._wschanges.edit.documentChanges != undefined);

    }

    createFile(uri: DocumentUri, contents: string, overwrite: boolean) {
        this._wschanges.createFile(uri, {overwrite: overwrite});
        const edit = this._wschanges.edit;
        const change = this._wschanges.getTextEditChange(OptionalVersionedTextDocumentIdentifier.create(uri,null));
        this.insertText(uri,contents,0,0);
    }

    renameFile(uri:DocumentUri, newUri: DocumentUri, overwrite: boolean) {
        this._wschanges.renameFile(uri, newUri, { overwrite: overwrite});
    }

    deleteFileFolder(uri:DocumentUri, recursive: boolean, ignoreIfNotExists: boolean) {
        this._wschanges.deleteFile(uri, { recursive: recursive, ignoreIfNotExists: ignoreIfNotExists});
    }

    insertText(uri: DocumentUri, contents: string, line: number, column: number) {
        const change = this._wschanges.getTextEditChange(OptionalVersionedTextDocumentIdentifier.create(uri, null));
        change.insert(Position.create(line,column),contents);
    }

    replaceText(uri: DocumentUri, contents: string, startLine: number, startColumn: number, endLine: number, endColumn: number) {
        const change = this._wschanges.getTextEditChange(OptionalVersionedTextDocumentIdentifier.create(uri,null));
        change.replace(
            Range.create(Position.create(startLine, startColumn), Position.create(endLine, endColumn)),
            contents
        );
    }

    replaceAllText(uri: DocumentUri, contents: string) {
        this.replaceText(uri, contents, 0,0,Number.MAX_VALUE, Number.MAX_VALUE);
    }

    getLine(doc: TextDocument, line: number): string {
        const lineRange = this.getLineRange(doc, line, line + 1);
        return doc.getText(lineRange);
    }
    
    getLineRange(doc: TextDocument, lineStart: number, lineEnd: number): Range {
        const linePoistionStart = this.getLineStart(lineStart);
        const linePositionEnd = this.getLineEnd(doc, lineEnd);
        return Range.create(linePoistionStart, linePositionEnd);
    }
    
    getLineEnd(doc: TextDocument, line: number): Position {
        const nextLineOffset = this.getLineOffset(doc, line);
        return doc.positionAt(nextLineOffset - 1);
    }
    
    getLineOffset(doc: TextDocument, line: number): number {
        const lineStart = this.getLineStart(line);
        return doc.offsetAt(lineStart);
    }
    
    getLineStart(line: number): Position {
        return Position.create(line, 0);
    }

    async applyChanges(): Promise<ApplyWorkspaceEditResult>{
        return connection.workspace.applyEdit(this._wschanges.edit);
    }


}
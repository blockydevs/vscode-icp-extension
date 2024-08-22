import * as path from 'path';
import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

export function configureLanguageClient(context: vscode.ExtensionContext): LanguageClient {
	// The server is implemented in node
    const serverModule = context.asAbsolutePath(path.join('build', 'server', 'server.js'));

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
        }
    };

	// Options to control the language client
    const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
        documentSelector: [{ scheme: 'file', pattern: "**/dfx.json", language: 'json' }],
        synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
        }
    };
	// Create the language client
    return new LanguageClient('languageServerExample', 'Language Server Example', serverOptions, clientOptions);
}

/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	createConnection,
	TextDocuments,
	Diagnostic,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	DocumentDiagnosticReportKind,
	type DocumentDiagnosticReport,
	Position
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

import {
	getJsonFileWithoutKeyFormat,
	buildPropsFromJson
} from './dfxmodel';

import {
	validate
} from './validation';

import {
	autocomplete
} from './autocomplete';
import {
	WSUpdates
} from './workspaceChanges'

const parse = require('json-to-ast');

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
export const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let dfxJson : any = {};
let properties : any = {}

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;
	dfxJson = getJsonFileWithoutKeyFormat();
	properties = buildPropsFromJson();

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: false,
				triggerCharacters: ["\""]
			},
			diagnosticProvider: {
				interFileDependencies: false,
				workspaceDiagnostics: false
			}
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <ExampleSettings>(
			(change.settings.languageServerExample || defaultSettings)
		);
	}
	// Refresh the diagnostics since the `maxNumberOfProblems` could have changed.
	// We could optimize things here and re-fetch the setting first can compare it
	// to the existing setting, but this is out of scope for this example.
	connection.languages.diagnostics.refresh();
});

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'languageServerExample'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});


connection.languages.diagnostics.on(async (params) => {
	const document = documents.get(params.textDocument.uri);
	if (document !== undefined) {
		return {
			kind: DocumentDiagnosticReportKind.Full,
			items: await validateTextDocument(document)
		} satisfies DocumentDiagnosticReport;
	} else {
		// We don't know the document. We can either try to read it from disk
		// or we don't report problems for it.
		return {
			kind: DocumentDiagnosticReportKind.Full,
			items: []
		} satisfies DocumentDiagnosticReport;
	}
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<Diagnostic[]> {
	const text = textDocument.getText();
	const diagnostics: Diagnostic[] = [];

	if (isJsonString(text)) {
		const settingForParser = {
			loc: true
		};
		const ast = parse(text, settingForParser);
		const astJsonParsed = JSON.parse(JSON.stringify(ast));
		const customDiagnostics = validate(dfxJson, text, astJsonParsed);
		customDiagnostics.forEach((customDiagnostic) => {
			const diagnostic: Diagnostic = {
				severity: customDiagnostic.diagnosticSeverity,
				range: {
					start: Position.create(customDiagnostic.startLine, customDiagnostic.startOffset),
					end: Position.create(customDiagnostic.endLine, customDiagnostic.endOffset)
				},
				message: customDiagnostic.message ? customDiagnostic.message : 'Unknown error',
				source: 'dfx validator'
			};
			diagnostics.push(diagnostic);
		});
	}
	return diagnostics;
}

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received a file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		const document = documents.get(_textDocumentPosition.textDocument.uri);
		if (document) {
			return resolveAutocomplete(document, _textDocumentPosition, _textDocumentPosition.position);
		}
		else {
			return [];
		}
	}
);

function resolveAutocomplete(textDocument: TextDocument, _textDocumentPosition: TextDocumentPositionParams, position: Position) : CompletionItem[]{
	const text = textDocument.getText();
	if (isJsonString(text)) {
		if (text.replace(/[\n\r\t\s]+/g, '') === "\{\}") {
			return getCompletionItemsForEmptyFile();
		}
		else {
			const settingForParser = {
				loc: true
			};
			const ast = parse(text, settingForParser);
			const astJsonParsed = JSON.parse(JSON.stringify(ast));
			let completionItems = autocomplete(astJsonParsed, position).map((item) => {
				return {
					label: item.label,
					kind: item.kind,
					data: item.data
				};
			});
			return completionItems;
		}
	}
	else {
		const wsu = new WSUpdates();
		let lineText = wsu.getLine(textDocument, position.line).trim();
		if (lineText.replace(/[\n\r\t\s]+/g, '') === "\"\"") {
			wsu.replaceText(_textDocumentPosition.textDocument.uri, "\"\": \"\"\n", position.line, position.character-1, position.line + 1, 0);
			wsu.applyChanges();
		}
		return [];
	}
}

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		return item;
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

function isJsonString(text: string) {
    try {
        JSON.parse(text);
    } catch (e) {
        return false;
    }
    return true;
}

function getCompletionItemsForEmptyFile() : CompletionItem[] {
	return [
		{
			label: '"dfx": ""',
			kind: CompletionItemKind.Property,
			data: 1
		},
		{
			label: '"canisters": {\n}',
			kind: CompletionItemKind.Property,
			data: 2
		},
		{
			label: '"defaults": {\n}',
			kind: CompletionItemKind.Property,
			data: 3
		},
		{
			label: '"networks": {\n}',
			kind: CompletionItemKind.Property,
			data: 4
		},
		{
			label: '"output_env_file": ""',
			kind: CompletionItemKind.Property,
			data: 5
		},
		{
			label: '"profile": "Profile"',
			kind: CompletionItemKind.Property,
			data: 6
		},
		{
			label: '"version": 0',
			kind: CompletionItemKind.Property,
			data: 7
		}
	];
}
import {CompletionItemKind, Position} from 'vscode-languageserver/node';
import {
	Prop,
	buildPropsFromJson
} from './dfxmodel'

const props = buildPropsFromJson();

export class CustomCompletionItem {
	label: string;
	kind: CompletionItemKind = CompletionItemKind.Text;
	data: any;

	constructor(label: string, kind: CompletionItemKind, data: any) {
		this.label = label;
		this.kind = kind;
		this.data = data;
	}
}

class CustomPosition {
	line: number;
	character: number;

	constructor(Position: Position) {
		this.line = Position.line + 1;
		this.character = Position.character + 1;
	}
}

class CustomAstRange {
	startLine: number;
	startChar: number;
	endLine: number;
	endChar: number;

	constructor(astJsonParsed: any) {
		this.startLine = astJsonParsed.loc.start.line;
		this.startChar = astJsonParsed.loc.start.column;
		this.endLine = astJsonParsed.loc.end.line;
		this.endChar = astJsonParsed.loc.end.column;
	}
}

export function autocomplete(astJsonParsed: any, position: Position) : CustomCompletionItem[] {
	let customCompletionItems: CustomCompletionItem[] = [];
	let customPosition = new CustomPosition(position);
	buildCustomCompletionItems(props, customPosition, astJsonParsed, [], customCompletionItems);
	return customCompletionItems;
}

function buildCustomCompletionItems(props: Prop[], customPosition: CustomPosition, astJsonParsed: any, path: string[], customCompletionItems: CustomCompletionItem[]) {
	if (astJsonParsed.hasOwnProperty('loc')) {
		let customAstRange = new CustomAstRange(astJsonParsed);
		if (customPosition.line >= customAstRange.startLine && customPosition.line <= customAstRange.endLine) {
			if (customPosition.line > customAstRange.startLine && customPosition.line < customAstRange.endLine) {
				if (astJsonParsed.hasOwnProperty("key")) {
					path.push(astJsonParsed.key.value);
				}
				if (astJsonParsed.hasOwnProperty("children")) {
					astJsonParsed.children.forEach((child: any) => {
						buildCustomCompletionItems(props, customPosition, child, path, customCompletionItems);
					});
				}
				else if (astJsonParsed.hasOwnProperty("value")) {
					buildCustomCompletionItems(props, customPosition, astJsonParsed.value, path, customCompletionItems);
				}
			}
			else if (customPosition.line === customAstRange.startLine && customPosition.line === customAstRange.endLine) {
				if (astJsonParsed.hasOwnProperty("key") && astJsonParsed.key.loc && astJsonParsed.key.loc.start.column <= customPosition.character && astJsonParsed.key.loc.end.column >= customPosition.character) {
					buildCompletionItemsForKeys(props, path, customCompletionItems);
				}
				else if (astJsonParsed.hasOwnProperty("value") && astJsonParsed.value.loc && astJsonParsed.value.loc.start.column <= customPosition.character && astJsonParsed.value.loc.end.column >= customPosition.character) {
					buildCompletionItemsForValues(astJsonParsed, props, path, customCompletionItems);
				}
			}
		}
	}
}

function buildCompletionItemsForKeys(props: Prop[], path: string[], customCompletionItems: CustomCompletionItem[]) {
	if (path.length > 1) {
		let currentPathName = path.shift();
		if (currentPathName && currentPathName !== "") {
			let prop = props.find((prop) => prop.name === currentPathName || prop.name === "additionalProperties");
			if (prop) {
				let propPath = path;
				let oneOfPath = path;
				buildCompletionItemsForKeys(prop.properties, propPath, customCompletionItems, );
				buildCompletionItemsForKeys(prop.oneOfProperties, oneOfPath, customCompletionItems);
			}
		}
		else if (currentPathName === "") {
			buildCompletionItemsForKeys(props, path, customCompletionItems);
		}
	}
	else if (path.length === 1) {
		let currentPathName = path[0];
		let prop = props.find((prop) => prop.name === currentPathName || prop.name === "additionalProperties");
		if (prop) {
			prop.properties?.forEach((property) => {
				if (property.name) {
					buildCustomCompletionItem(property.name, customCompletionItems, CompletionItemKind.Property);
				}
			});
			buildCustomCompletionItemForOneOf(prop.oneOfProperties, customCompletionItems, CompletionItemKind.Property);
			prop.propsForItems?.forEach((propItem) => {
				if (propItem.name) {
					buildCustomCompletionItem(propItem.name, customCompletionItems, CompletionItemKind.Property);
				}
			});
		}
	}
	else {
		props.forEach((property) => {
			if (property.name) {
				buildCustomCompletionItem(property.name, customCompletionItems, CompletionItemKind.Property);
			}
		});
	}
}

function buildCompletionItemsForValues(jsonAst: any, props: Prop[], path: string[], customCompletionItems: CustomCompletionItem[]) {
	if (path.length > 1) {
		let currentPathName = path.shift();
		if (currentPathName && currentPathName !== "") {
			let prop = props.find((prop) => prop.name === currentPathName || prop.name === "additionalProperties");
			if (prop) {
				let propPath = path;
				let oneOfPath = path;
				buildCompletionItemsForValues(jsonAst, prop.properties, propPath, customCompletionItems);
				buildCompletionItemsForValues(jsonAst, prop.oneOfProperties, oneOfPath, customCompletionItems);
			}
		}
		else if (currentPathName === "") {
			buildCompletionItemsForValues(jsonAst, props, path, customCompletionItems);
		}
	}
	else if (path.length === 1) {
		if (jsonAst.hasOwnProperty("key")) {
			let itemKey = jsonAst.key.value;
			let currentPathName = path[0];
			let prop = props.find((prop) => prop.name === currentPathName || prop.name === "additionalProperties");
			if (prop) {
				prop.properties?.forEach((property) => {
					if (property.name && property.name === itemKey && property.enums.length > 0) {
						property.enums.forEach((enumValue) => {
							buildCustomCompletionItem(enumValue, customCompletionItems, CompletionItemKind.Value)
						});
					}
				});
				buildCustomCompletionItemForOneOfEnum(itemKey, prop.oneOfProperties, customCompletionItems, CompletionItemKind.Value);
				prop.propsForItems?.forEach((property) => {
					if (property.name && property.name === itemKey && property.enums.length > 0) {
						property.enums.forEach((enumValue) => {
							buildCustomCompletionItem(enumValue, customCompletionItems, CompletionItemKind.Value)
						});
					}
					else if (property.name && property.name === itemKey && property.oneOfProperties.length > 0) {
						buildCustomCompletionItemForOneOfEnum(itemKey, property.oneOfProperties, customCompletionItems, CompletionItemKind.Value);
					}
				});
			}
		}
	}
	else {
		if (jsonAst.hasOwnProperty("key")) {
			let itemKey = jsonAst.key.value;
			props?.forEach((property) => {
				if (property.name && property.name === itemKey && property.enums.length > 0) {
					property.enums.forEach((enumValue) => {
						buildCustomCompletionItem(enumValue, customCompletionItems, CompletionItemKind.Value)
					});
				}
			});
		}
	}
}

function buildCustomCompletionItemForOneOf(props: Prop[], customCompletionItems: CustomCompletionItem[], kind: CompletionItemKind) {
	let oneOfProps: string[] = [];
	props.forEach((prop) => {
		if (prop) {
			prop.properties?.forEach((prop) => {
				if (prop.name) {
					oneOfProps.push(prop.name);
				}
			});
		}
	});
	let oneOfPropsSet = new Set(oneOfProps);
	oneOfPropsSet.forEach((propName) => {
		if (propName) {
			buildCustomCompletionItem(propName, customCompletionItems, kind);
		}
	});
}

function buildCustomCompletionItemForOneOfEnum(itemKey: string, props: Prop[], customCompletionItems: CustomCompletionItem[], kind: CompletionItemKind) {
	props.forEach((prop) => {
		if (prop) {
			if (prop.enums.length > 0) {
				prop.enums.forEach((enumValue) => {
					buildCustomCompletionItem(enumValue, customCompletionItems, kind)
				});
			}
			else if (prop.properties.length > 0) {
				prop.properties?.forEach((prop) => {
					if (prop.name && prop.name === itemKey && prop.enums.length > 0) {
						prop.enums.forEach((enumValue) => {
							buildCustomCompletionItem(enumValue, customCompletionItems, kind)
						});
					}
				});
			}
		}
	});
}

function buildCustomCompletionItem(label: string, customCompletionItems: CustomCompletionItem[], kind: CompletionItemKind) {
	let customCompletionItem = new CustomCompletionItem(label, kind, customCompletionItems.length + 1);
	customCompletionItems.push(customCompletionItem);
}
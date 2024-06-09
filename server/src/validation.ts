import {
	GetValuesByInstancePath,
	GetValuesFromInputJsonByInstancePath
} from './search.js';
import Ajv from 'ajv';
import {
	findMainPropertyByName,
	buildPropsFromJson,
	Prop,
	isPropertyContainsType,
} from './dfxmodel';
import {DiagnosticSeverity} from 'vscode-languageserver/node';

const ajv = new Ajv({strict: false, allErrors: true, inlineRefs: false});
const props = buildPropsFromJson();

export class CustomDiagnostic {
	message?: string;
	startLine: number;
	startOffset: number;
	endLine: number;
	endOffset: number;
	diagnosticSeverity: DiagnosticSeverity = DiagnosticSeverity.Error;

	constructor(startLine: number, startOffset: number, endLine: number, endOffset: number) {
		this.startLine = startLine - 1;
		this.startOffset = startOffset - 1;
		this.endLine = endLine - 1;
		this.endOffset = endOffset - 1;
	}
}

export class AjvError {
	instancePath: string;
	schemaPath: string;
	keyword: string;
	params?: any;
	message?: string;
	depth?: number;

	constructor(instancePath: string, schemaPath: string, keyword: string) {
		this.instancePath = instancePath;
		this.schemaPath = schemaPath;
		this.keyword = keyword;
	}
}

class OneOfEnum {
	key: string;
	requiredProperties: string[] = []
	value: string;
	constructor(key: string, value: string) {
		this.key = key;
		this.value = value;
	}
}

export function validate(jsonSchema: any, jsonInput: any, astJsonParsed: any) : CustomDiagnostic[] {
    let input = JSON.parse(jsonInput);
    let schema = JSON.parse(JSON.stringify(jsonSchema));

    const isValid = ajv.validate(schema, input);
	let ajvErrors: AjvError[] = [];

    if (!isValid) {
        ajv.errors?.filter((error) => error.keyword !== "anyOf" && error.message !== "must be null").forEach((error) => {
			let ajvError = new AjvError(error.instancePath, error.schemaPath, error.keyword)
			if (ajvError.keyword === "enum") {
				let errorMessage = error.message + " ";
				error.params.allowedValues.forEach((value: string) => {
					errorMessage = errorMessage + value + ", ";
				});
				ajvError.message = errorMessage.slice(0, errorMessage.lastIndexOf(','));
			}
			else {
				ajvError.message = error.message;
			}
			ajvError.params = error.params;
			ajvErrors.push(ajvError);
		});
    };
	let ajvErrorsMap = putAjvErrorsToMap(ajvErrors);
	let diagnostics: CustomDiagnostic[] = [];
	ajvErrorsMap.forEach((ajvErrors, key) => {
		mapFromAjvErrorToCustomDiagnostic(diagnostics, ajvErrors, astJsonParsed);
	});
	return diagnostics;
}

function putAjvErrorsToMap(ajvErrors: AjvError[]) : Map<string, AjvError[]> {
	let ajvErrorsMap = new Map<string, AjvError[]>();
	ajvErrors.forEach((ajvError) => {
		let instancePathArray = ajvError.instancePath.split('/');
		instancePathArray.shift();
		let mainProperty = findMainPropertyByName(props, instancePathArray[0]);
		let key : string | null = null;
		if (mainProperty !== null) {
			if (isPropertyContainsType(mainProperty, "object") && instancePathArray.length > 1) {
				key = mainProperty.name + "." + instancePathArray[1];
			}
			else {
				key = mainProperty.name ?? null;
			}
		}
		if (key !== null && ajvErrorsMap.has(key)) {
			ajvError.depth = instancePathArray.length;
			ajvErrorsMap.get(key)?.push(ajvError);
		}
		else if (key !== null) {
			ajvError.depth = instancePathArray.length;
			ajvErrorsMap.set(key, [ajvError]);
		}
	});
	return ajvErrorsMap;
}

function mapFromAjvErrorToCustomDiagnostic(diagnostics: CustomDiagnostic[], ajvErrors: AjvError[], astJsonParsed: any) : CustomDiagnostic[] {
	let maxDepth = Math.max(...ajvErrors.map(o => o.depth ?? 0));
	let ajvErrorOneOf = ajvErrors.find((ajvError) => ajvError.keyword === 'oneOf' && ajvError.depth && (ajvError.depth === maxDepth || ajvError.depth === maxDepth - 1));
	if (ajvErrorOneOf) {
		resolveOneOfProblemsToCustomDiagnostic(diagnostics, ajvErrorOneOf, astJsonParsed);
	}
	else {
		resolveCustomDiagnosticFromAjvError(diagnostics, ajvErrors, astJsonParsed);
	}
	return diagnostics;
}

function resolveCustomDiagnosticFromAjvError(diagnostics: CustomDiagnostic[], ajvErrors: AjvError[], astJsonParsed: any) {
	let maxDepth = Math.max(...ajvErrors.map(o => o.depth ?? 0));
	ajvErrors.forEach((ajvError) => {
		if (ajvError.depth && ajvError.depth >= maxDepth) {
			let instancePathArray = ajvError.instancePath.split('/');
			instancePathArray.shift();
			let astValueList = GetValuesByInstancePath(astJsonParsed, instancePathArray);
			if (astValueList.length > 0) {
				let astValue = astValueList[0];
				let customDiagnostic = new CustomDiagnostic(astValue["startLine"], astValue["startOffset"], astValue["endLine"], astValue["endOffset"]);
				customDiagnostic.message = ajvError.message;
				customDiagnostic.diagnosticSeverity = DiagnosticSeverity.Error;
				pushDiagnosticsIfItIsNotDuplicated(diagnostics, customDiagnostic);
			}
		}
	});
}

function resolveOneOfProblemsToCustomDiagnostic(diagnostics: CustomDiagnostic[], ajvErrorOneOf: AjvError, astJsonParsed: any) {
	let oneOfEnums = resolvePropWithOneOfToOneOneEnum(ajvErrorOneOf?.instancePath.split('/') ?? [], props);
	if (oneOfEnums.length > 0) {
		let oneOfEnumKey = oneOfEnums[0].key;
		let enumProperty = getEnumValueByAjvErrors(ajvErrorOneOf?.instancePath.split('/') ?? [], oneOfEnumKey, astJsonParsed);
		let enumKey = enumProperty?.key ?? null;
		let enumValue = enumProperty?.value ?? "";
		if (enumKey !== null  && oneOfEnumKey === enumKey && enumValue !== null && typeof enumValue === "string") {
			let oneOfEnum = oneOfEnums.find((oneOfEnum) => oneOfEnum.value === enumValue);
			if (oneOfEnum) {
				let message = "required fields are: "; 
				oneOfEnum.requiredProperties.forEach((requiredProperty) => {
					message = message + requiredProperty + ", ";
				});
				message = message.slice(0, message.lastIndexOf(','));
				buildAndPushCustomDiagnostic(diagnostics, astJsonParsed, ajvErrorOneOf?.instancePath.split('/') ?? [], message);
			}
			else {
				let message = "property " + enumKey + " must have one of the values: "; 
				oneOfEnums.forEach((oneOfEnum) => {
					message = message + oneOfEnum.value + ", ";
				});
				message = message.slice(0, message.lastIndexOf(','));
				buildAndPushCustomDiagnostic(diagnostics, astJsonParsed, ajvErrorOneOf?.instancePath.split('/') ?? [], message);
			}

		}
		else if (enumKey !== null && oneOfEnumKey === enumKey) {
			let message = "property " + enumKey + " and must have one of the values: "; 
			oneOfEnums.forEach((oneOfEnum) => {
				message = message + oneOfEnum.value + ", ";
			});
			message = message.slice(0, message.lastIndexOf(','));
			buildAndPushCustomDiagnostic(diagnostics, astJsonParsed, ajvErrorOneOf?.instancePath.split('/') ?? [], message);
		}
		else {
			let message = "must be an object with property \"" + oneOfEnums[0].key + "\" with one of the values: "; 
			oneOfEnums.forEach((oneOfEnum) => {
				message = message + oneOfEnum.value + ", ";
			});
			message = message.slice(0, message.lastIndexOf(','));
			buildAndPushCustomDiagnostic(diagnostics, astJsonParsed, ajvErrorOneOf?.instancePath.split('/') ?? [], message);
		}
	}
}

function resolvePropWithOneOfToOneOneEnum(instancePathArray: string[], props: Prop[]) : OneOfEnum[] {
	instancePathArray.shift();
	let propertiesForSearch = props;
	let searchedProperty = null;
	while (instancePathArray.length > 0) {
		let prop = propertiesForSearch.find((prop) => prop.name === instancePathArray[0] || prop.name === "additionalProperties");
		if (prop) {
			instancePathArray.shift();
			if (isPropertyContainsType(prop, "array")) {
				propertiesForSearch = prop.propsForItems;
				searchedProperty = prop;
				instancePathArray.shift();
			}
			else {
				propertiesForSearch = prop.properties;
				searchedProperty = prop;
			}
		}
		else {
			searchedProperty = null;
			break;
		}
	}
	if (searchedProperty && searchedProperty.oneOfProperties.length > 0) {
		return getEnumsOneOfProp(searchedProperty);
	}
	else {
		return [];
	}
}

function getEnumsOneOfProp(oneOfProperty: Prop) : OneOfEnum[] {
	let oneOfEnums: OneOfEnum[] = [];
	oneOfProperty.oneOfProperties.forEach((o) => {
		if (isPropertyContainsType(o, "object")) {
			o.properties.map((prop) => {
				if (prop.enums.length > 0 && prop.name) {
					let oneOfEnum = new OneOfEnum(prop.name, prop.enums[0]);
					oneOfEnum.requiredProperties = o.requiredProperties;
					return oneOfEnum;
				}
			}).forEach((oneOfEnum) => {
				if (oneOfEnum) {
					oneOfEnums.push(oneOfEnum);
				}
			});
		}
		else if (o.enums.length > 0 && oneOfProperty.name) {
			let oneOfEnum = new OneOfEnum(oneOfProperty.name, o.enums[0]);
			oneOfEnum.requiredProperties = o.requiredProperties;
			oneOfEnums.push(oneOfEnum);
		}
	});
	return oneOfEnums;
}

function buildAndPushCustomDiagnostic(diagnostics: CustomDiagnostic[], astJsonParsed: any, instancePathArray: string[], message: string) {
	if (instancePathArray.length > 0) {
		instancePathArray.shift();
		let astValueList = GetValuesByInstancePath(astJsonParsed, instancePathArray ?? []);
			if (astValueList.length > 0) {
				let astValue = astValueList[0];
				let customDiagnostic = new CustomDiagnostic(astValue["startLine"], astValue["startOffset"], astValue["endLine"], astValue["endOffset"]);
				customDiagnostic.message = message;
				customDiagnostic.diagnosticSeverity = DiagnosticSeverity.Error;
				pushDiagnosticsIfItIsNotDuplicated(diagnostics, customDiagnostic);
			}
	}
}



function pushDiagnosticsIfItIsNotDuplicated(diagnostics: CustomDiagnostic[], diagnostic: CustomDiagnostic) {
	if (!diagnostics.find((d) => d.message === diagnostic.message && d.startLine === diagnostic.startLine && d.startOffset === diagnostic.startOffset && d.endLine === diagnostic.endLine && d.endOffset === diagnostic.endOffset)) {
		diagnostics.push(diagnostic);
	}
}

function getEnumValueByAjvErrors(instancePathArray: string[], enumKey: string, astJsonParsed: any) : any | null {
	if (!(instancePathArray[instancePathArray.length - 1] === enumKey)) {
		instancePathArray.push(enumKey);
	}
	instancePathArray.shift();
	let properties = GetValuesFromInputJsonByInstancePath(astJsonParsed, instancePathArray);
	if (properties.length > 0) {
		return properties[0];
	}
	else {
		return null
	}
}
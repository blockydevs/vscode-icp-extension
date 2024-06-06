import {
	GetValuesByInstancePath,
	GetValuesFromInputJsonByInstancePath
} from './search.js';
import Ajv from 'ajv';
import {
	buildDefinitionsFromJson,
	findMainPropertyByName,
	findByDefinitionByName,
	findDefintionByMainPropertyName,
	findOneOfPropertyByEnumName,
	getMainProperties,
	Definition
} from './dfxmodel';
import {DiagnosticSeverity} from 'vscode-languageserver/node';

const ajv = new Ajv({strict: false, allErrors: true, inlineRefs: false});
const definitions = buildDefinitionsFromJson();
const mainProperties = getMainProperties();

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

export function validate(jsonSchema: any, jsonInput: any, astJsonParsed: any) : CustomDiagnostic[] {
    let input = JSON.parse(jsonInput);
    let schema = JSON.parse(JSON.stringify(jsonSchema));

    const isValid = ajv.validate(schema, input);
	let ajvErrors: AjvError[] = [];

    if (!isValid) {

        ajv.errors?.forEach((error) => {
			let ajvError = new AjvError(error.instancePath, error.schemaPath, error.keyword)
			if (ajvError.keyword === "enum") {
				let errorMessage = error.message;
				error.params.allowedValues.forEach((value: string) => {
					errorMessage = errorMessage + " " + value;
				});
				ajvError.message = errorMessage;
			}
			else {
				ajvError.message = error.message;
			}
			ajvError.params = error.params;
			ajvErrors.push(ajvError);
		});
    }
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
		let mainProperty = findMainPropertyByName(mainProperties, instancePathArray[0]);
		let key : string | null = null;
		if (mainProperty !== null) {
			if (mainProperty.isObject && instancePathArray.length > 1) {
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
	if (!checkIfAjvErrorsHasOneOfProblems(diagnostics, ajvErrors, astJsonParsed)) {
		resolveCustomDiagnosticFromAjvError(diagnostics, ajvErrors, astJsonParsed);
	}
	return diagnostics;
}

function checkIfAjvErrorsHasOneOfProblems(diagnostics: CustomDiagnostic[], ajvErrors: AjvError[], astJsonParsed: any) : boolean {
	let ajvOneOfError = ajvErrors.find((ajvError) => ajvError.keyword === 'oneOf');
	if (ajvOneOfError) {
		let enumProperty = getEnumValueByAjvErrors(ajvOneOfError.depth, ajvErrors, astJsonParsed);
		let enumKey = enumProperty.key ?? null;
		let enumValue = enumProperty.value ?? null;
		let ajvErrorsWithoutOneOf = ajvErrors.filter((ajvError) => ajvError.keyword !== "oneOf" && (ajvError.keyword !== "enum" && ajvError.keyword !== "required" && ajvOneOfError.depth && ajvError.depth === ajvOneOfError.depth + 1));
		if (ajvErrorsWithoutOneOf.length > 0) {
			resolveCustomDiagnosticFromAjvError(diagnostics, ajvErrorsWithoutOneOf, astJsonParsed)
		}
		else {
			let definition : Definition | null = null;
			let instancePathArray = ajvOneOfError.instancePath.split('/');
			if (ajvOneOfError.schemaPath.includes("definitions")) {
				let definitionName = ajvOneOfError.schemaPath.split("/")[2];
				definition = findByDefinitionByName(definitions, definitionName) ?? null;
			}
			else {
				let mainPropertyName = instancePathArray[1];
				definition = findDefintionByMainPropertyName(definitions, mainPropertyName) ?? null;
			}
			if (definition && enumKey && enumValue && typeof enumValue === "string") {
				let oneOfProperty = findOneOfPropertyByEnumName(definition.oneOfProperties, enumValue);
				if (oneOfProperty && oneOfProperty.requiredProperties) {
					let message = "required fields are: ";
					oneOfProperty.requiredProperties.forEach((requiredProperty) => {
						message = message + requiredProperty + " ";
					});
					instancePathArray.shift();
					let astValueList = GetValuesByInstancePath(astJsonParsed, instancePathArray);
					if (astValueList.length > 0) {
						let astValue = astValueList[0];
						let customDiagnostic = new CustomDiagnostic(astValue["startLine"], astValue["startOffset"], astValue["endLine"], astValue["endOffset"]);
						customDiagnostic.message = message;
						customDiagnostic.diagnosticSeverity = DiagnosticSeverity.Error;
						diagnostics.push(customDiagnostic);
					}
				}
				else {
					let message = "property " + enumKey + " must have one of value: "; 
					definition.oneOfProperties?.forEach((oneOfProperty) => {
						message = message + oneOfProperty.enumName + " ";
					});
					instancePathArray.shift();
					let astValueList = GetValuesByInstancePath(astJsonParsed, instancePathArray);
					if (astValueList.length > 0) {
						let astValue = astValueList[0];
						let customDiagnostic = new CustomDiagnostic(astValue["startLine"], astValue["startOffset"], astValue["endLine"], astValue["endOffset"]);
						customDiagnostic.message = message;
						customDiagnostic.diagnosticSeverity = DiagnosticSeverity.Error;
						diagnostics.push(customDiagnostic);
					}
				}
			}
			else {
				return false;
			}
		}
		return true;
	}
	else {
		return false;
	}
}

function getEnumValueByAjvErrors(depth: number | undefined, ajvErrors: AjvError[], astJsonParsed: any) : any | null {
	let ajvError = ajvErrors.find((ajvError) => ajvError.keyword === "enum" && depth && (depth === ajvError.depth || depth + 1 === ajvError.depth));
	if (ajvError) {
		let instancePathArray = ajvError?.instancePath.split('/');
		instancePathArray.shift();
		let properties = GetValuesFromInputJsonByInstancePath(astJsonParsed, instancePathArray);
		if (properties.length > 0) {
			return properties[0];
		}
		else {
			return null
		}
	}
	else {
		return null;
	}
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
				diagnostics.push(customDiagnostic);
			}
		}
	});
}
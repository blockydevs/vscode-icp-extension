import { MainProperty } from './dfxmodel';
import {
	GetFirstPropertiesKey,
	GetFirstPropertiesValue
} from './search.js';

export class CustomDiagnostic {
	message: string;
	startLine: number;
	startOffset: number;
	endLine: number;
	endOffset: number;

	constructor(message: string, startLine: number, startOffset: number, endLine: number, endOffset: number) {
		this.message = message;
		this.startLine = startLine - 1;
		this.startOffset = startOffset - 1;
		this.endLine = endLine - 1;
		this.endOffset = endOffset - 1;
	}
}

export function validateJsonFirstProperties(mainProperties: MainProperty[], jsonToValidate: any) : CustomDiagnostic[] {
	let diagnostics: CustomDiagnostic[] = [];
	GetFirstPropertiesKey(jsonToValidate).forEach((property) => {
		if (!mainProperties.find((mainProperty) => mainProperty.name === property.key)) {
			diagnostics.push(new CustomDiagnostic(`Object \"${property.key}\" not found in the schema`, property.startLine, property.startOffset, property.endLine, property.endOffset));
		}
		else {
			GetFirstPropertiesValue(jsonToValidate, property.key).forEach((value) => {
				let valueTypeOf : string = getValueTypeOf(value);
				mainProperties.forEach((mainProperty) => {
					if (Array.isArray(mainProperty.types) && mainProperty.types.length && mainProperty.name === property.key 
					&& !mainProperty.types.find((type) => valueTypeOf === type.name)) {
						let messageTypes = mainProperty.types.map((type) => type.name).join(' or ');
						diagnostics.push(new CustomDiagnostic(`Property \"${property.key}\" not valid type of ${messageTypes}`, value.startLine, value.startOffset, value.endLine, value.endOffset));
					}
				});
			});
		}
	});
	return diagnostics;
}

function getValueTypeOf(value: any) : string {
	if (value.type === 'Literal' && value.value === null) {
		return 'null';
	}
	else if (value.type === 'Literal') {
		return typeof value.value;
	}
	else {
		return value.type.toLowerCase();
	}
}
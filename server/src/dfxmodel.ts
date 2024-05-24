import { json } from 'stream/consumers';
import jsonSchema from './dfx.json';
import {
	GetObjects,
	GetObject,
	GetStringObject,
	GetNumberObject,
	GetArrayObject
} from './search.js';

export class MainProperty {
	name: string;
	title?: string;
	description?: string;
	types?: Type[];
	format?: string;
	minimum?: number;
	properties?: Property[];

	constructor(name: string) {
		this.name = name;
	}
}

export class Definition {
	name: string;
	title?: string;
	description?: string;
	propertiesOneOf?: PropertyOneOf[];
	properties?: Property[];
	constructor(name: string) {
		this.name = name;
	}
}

export class PropertyOneOf {
	name: string;
	title?: string;
	defName?: string;
	requiredProperties?: string[];
	properties?: Property[];

	constructor(name: string) {
		this.name = name;
	}
}

export class Property {
	name: string;
	title?: string;
	description?: string;
	type?: Type;

	constructor(name: string) {
		this.name = name;
	}
}

export class Type {
	name: string;

	constructor(name: string) {
		this.name = name;
	}
}

export function getPropertiesFromDfx(): MainProperty[] {
	let propertiesArray: MainProperty[] = [];
	let dfxProperties = jsonSchema.properties;
	for (let key in dfxProperties) {
		let mainProperty = new MainProperty(key);
		let properties = GetObject(dfxProperties, key);
		for (let property in properties) {
			mapMainProperty(mainProperty, properties, property);
		}
		propertiesArray.push(mainProperty);
	}
	return propertiesArray;
}

function mapMainProperty(mainProperty: MainProperty, json: any, key: string) {
	if (key == "description") {
		mainProperty.description = GetStringObject(json, key);
	}
	else if (key == "title") {
		mainProperty.title = GetStringObject(json, key);
	}
	else if (key == "type") {
		let types: Type[] = [];
		GetArrayObject(json, key).forEach((element: any) => {
			types.push(new Type(element));
		});
		mainProperty.types = types;
	}
	else if (key == "format") {
		mainProperty.format = GetStringObject(json, key);
	}
	else if (key == "minimum") {
		mainProperty.format = GetNumberObject(json, key);
	}
}

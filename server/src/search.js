var RemoveKeys = function removeKeys(obj, keyToDelete) {
    if (obj && Object.keys(obj).length) {
        delete obj[keyToDelete];

        Object.keys(obj).forEach(key => {
            if (obj[key] !== null && typeof obj[key] === 'object' ) {
                removeKeys(obj[key], keyToDelete);
            }
        });
    }
};

var GetValuesByInstancePath = function getValuesByInstancePath(astJson, instancePathArray, properties = []) {
	var children = GetArrayObject(astJson, "children");
	if (children === null) {
		return properties;
	}
	children.forEach(function(child) {
		var firstElementKey = instancePathArray[0];
		var astKey = child["key"];
		if (astKey["value"] === firstElementKey) {
			instancePathArray.shift();
			if (instancePathArray.length == 0) {
				var value = child["value"];
				var property = {
					startLine: value["loc"]["start"]["line"],
					startOffset: value["loc"]["start"]["column"],
					endLine: value["loc"]["end"]["line"],
					endOffset: value["loc"]["end"]["column"]
				}
				properties.push(property);
			}
			else {
				if (child["value"].type === "Array") {
					firstElementKey = instancePathArray[0];
					var childToReplace = child["value"]["children"][firstElementKey];
					if (childToReplace && (childToReplace.type === "Object" || childToReplace.type === "Literal")) {
						instancePathArray.shift();
						child = childToReplace;
					}
					if (instancePathArray.length === 0) {
						var property = {
							startLine: child["loc"]["start"]["line"],
							startOffset: child["loc"]["start"]["column"],
							endLine: child["loc"]["end"]["line"],
							endOffset: child["loc"]["end"]["column"]
						}
						properties.push(property);
					}
					else {
						GetValuesByInstancePath(child, instancePathArray, properties);
					}
				}
				else {
					GetValuesByInstancePath(child["value"], instancePathArray, properties);
				}
			}
		}
	})
	return properties;
};

var GetValuesFromInputJsonByInstancePath = function getValuesFromInputJsonByInstancePath(astJson, instancePathArray, properties = []) {
	var children = GetArrayObject(astJson, "children");
	if (children === null) {
		return properties;
	}
	children.forEach(function(child) {
		var firstElementKey = instancePathArray[0];
		var astKey = child["key"];
		if (astKey["value"] === firstElementKey) {
			instancePathArray.shift();
			if (instancePathArray.length == 0) {
				var value = child["value"];
				var property = {
					key: astKey["value"],
					value: value["value"]
				}
				properties.push(property);
			}
			else {
				if (child["value"].type === "Array") {
					firstElementKey = instancePathArray[0];
					var childToReplace = child["value"]["children"][firstElementKey];
					if (childToReplace && (childToReplace.type === "Object" || childToReplace.type === "Literal")) {
						instancePathArray.shift();
						child = childToReplace;
					}
					GetValuesFromInputJsonByInstancePath(child, instancePathArray, properties);
				}
				else {
					GetValuesFromInputJsonByInstancePath(child["value"], instancePathArray, properties);
				}
			}
		}
	})
	return properties;
};

var GetArrayObject = function getArrayObject(obj, key) {
	if (obj && Array.isArray(obj[key]))
		return obj[key];
	else {
		return null;
	}
};

module.exports = {RemoveKeys, GetValuesByInstancePath, GetValuesFromInputJsonByInstancePath};
var GetObjects = function getObjects(obj, key) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getObjects(obj[i], key));
        } else if (typeof obj[i] == 'array') {
			for (var j = 0; j < obj[i].length; j++) {
				objects = objects.concat(getObjects(obj[i][j], key));
			}
		}
		else if (i == key) {
            objects.push(obj);
        }
    }
    return objects;
};

var GetObject = function getObject(obj, key) {
	if (typeof obj[key] == 'object') {
		return obj[key];
	}
	else {
		return null;
	}
};

var GetStringObject = function getStringObject(obj, key) {
	if (obj.hasOwnProperty(key) && typeof obj[key] == 'string')
		return obj[key];
	else {
		return null;
	}
};

var GetNumberObject = function getNumberObject(obj, key) {
	if (obj.hasOwnProperty(key) && typeof obj[key] == 'number')
		return obj[key];
	else {
		return null;
	}
};

var GetArrayObject = function getArrayObject(obj, key) {
	if (Array.isArray(obj[key]))
		return obj[key];
	else {
		return null;
	}
};


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
					if (childToReplace && childToReplace.type === "Object") {
						instancePathArray.shift();
						child = childToReplace;
					}
					GetValuesByInstancePath(child, instancePathArray, properties);
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
					if (childToReplace && childToReplace.type === "Object") {
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

module.exports = {GetObjects, GetObject, GetStringObject, GetNumberObject, GetArrayObject, RemoveKeys, GetValuesByInstancePath, GetValuesFromInputJsonByInstancePath};
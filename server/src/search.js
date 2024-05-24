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

var GetFirstPropertiesKey = function getFirstPropertiesKey(obj) {
	var properties = [];
	var children = GetArrayObject(obj, "children");
	children.forEach(function(child) {
		var key = child["key"];
		var property = {
			key: key["value"],
			startLine: key["loc"]["start"]["line"],
			startOffset: key["loc"]["start"]["column"],
			endLine: key["loc"]["end"]["line"],
			endOffset: key["loc"]["end"]["column"]
		}
		properties.push(property);
	});
	return properties;
}

var GetFirstPropertiesValue = function getFirstPropertiesValue(obj, key) {
	var properties = [];
	var children = GetArrayObject(obj, "children");
	children.forEach(function(child) {
		if (child["key"]["value"] == key) {
			var value = child["value"];
			var property = {
				value: value["value"],
				type: value["type"],
				startLine: value["loc"]["start"]["line"],
				startOffset: value["loc"]["start"]["column"],
				endLine: value["loc"]["end"]["line"],
				endOffset: value["loc"]["end"]["column"]
			}
			properties.push(property);
		};
	});
	return properties;
}

module.exports = {GetObjects, GetObject, GetStringObject, GetNumberObject, GetArrayObject, GetFirstPropertiesKey, GetFirstPropertiesValue};
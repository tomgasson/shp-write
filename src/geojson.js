module.exports.point = justType('Point', 'POINT');
module.exports.line = justType('LineString', 'POLYLINE');
module.exports.polygon = justType('Polygon', 'POLYGON');
module.exports.polygon = justType('MultiPolygon', 'POLYGON');

function justType(type, TYPE) {
    return function(gj) {
        var oftype = gj.features.filter(isType(type));
        return {
            geometries: oftype.map(justCoords),
            properties: oftype.map(justProps),
            type: TYPE
        };
    };
}

function justCoords(t) {
    console.log("justCoords", t)
    return t.geometry.coordinates;
    // if (t.geometry.coordinates[0] !== undefined &&
    //     t.geometry.coordinates[0][0] !== undefined &&
    //     t.geometry.coordinates[0][0][0] !== undefined) {
    //     console.log("justCoords 1")
    //     return t.geometry.coordinates[0];
    // } else {
    //     console.log("justCoords 2")
    //     return t.geometry.coordinates;
    // }
}

function justProps(t) {
    return t.properties;
}

function isType(t) {
    return function(f) { return f.geometry.type === t; };
}

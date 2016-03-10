var ext = require('./extent');

module.exports.write = function writePoints(geometries, extent, shpView, shxView, TYPE) {

    var shpI = 0,
        shxI = 0,
        shxOffset = 100;

    geometries.forEach(writePolyLine);

    function writePolyLine(coordinates, i) {

        var isMulti = multi(coordinates)
        var length = isMulti ? coordinates.length : 1
        var partIdx_acc = 0
        var partIdx = []
        if (isMulti){
            coordinates.forEach(function(d){
                partIdx.push(partIdx_acc)
                partIdx_acc += d.length
            })
        } else {
            partIdx.push(partIdx_acc)
        }
        var flattened = []

        if (isMulti){
            coordinates.forEach(function(part){
                part.forEach(function(coord){
                    flattened.push(coord)
                })
            })
        } else {
            coordinates.forEach(function(coord){
                flattened.push(coord)
            })
        }

        var contentLength = (flattened.length * 16) + 44 + (length * 4);

        var featureExtent = flattened.reduce(function(extent, c) {
            return ext.enlarge(extent, c);
        }, ext.blank());

        // INDEX
        shxView.setInt32(shxI, shxOffset / 2); // offset
        shxView.setInt32(shxI + 4, contentLength / 2); // offset length

        shxI += 8;
        shxOffset += contentLength + 8;

        shpView.setInt32(shpI, i + 1); // record number
        shpView.setInt32(shpI + 4, contentLength / 2); // length
        shpView.setInt32(shpI + 8, TYPE, true); // POLYLINE=3
        shpView.setFloat64(shpI + 12, featureExtent.xmin, true); // EXTENT
        shpView.setFloat64(shpI + 20, featureExtent.ymin, true);
        shpView.setFloat64(shpI + 28, featureExtent.xmax, true);
        shpView.setFloat64(shpI + 36, featureExtent.ymax, true);
        shpView.setInt32(shpI + 44, length, true); // PARTS=1
        shpView.setInt32(shpI + 48, flattened.length, true); // POINTS

        var idx = shpI + 52
        for (var i = 0; i < partIdx.length; i++){
            shpView.setInt32(idx, partIdx[i], true); // The only part - index zero
            idx += 4
        }

        flattened.forEach(function writeLine(coords, i) {
            shpView.setFloat64(idx, coords[0], true); // X
            idx += 8
            shpView.setFloat64(idx, coords[1], true); // Y
            idx += 8
        });

        shpI += contentLength + 8;
    }
};

module.exports.shpLength = function(geometries) {
    var size = 0
    geometries.forEach(function(d){
        size += getSize(d)
    })
    return size
};


function getSize(coordinates){
    var isMulti = multi(coordinates)
    var length = isMulti ? coordinates.length : 1
    var flattened = justCoords(coordinates);
    return 8 + 44 + (length * 4) + (flattened.length * 16)
}

module.exports.shxLength = function(geometries) {
    return geometries.length * 8;
};

module.exports.extent = function(coordinates) {
    return justCoords(coordinates).reduce(function(extent, c) {
        return ext.enlarge(extent, c);
    }, ext.blank());
};

function multi(coordinates){
    if (coordinates[0]&&coordinates[0][0]&&coordinates[0][0][0]){
        return true
    }
    return false
}

function totalPoints(geometries) {
    var sum = 0;
    geometries.forEach(function(g) { sum += g.length; });
    return sum;
}

function justCoords(coords, l) {
    if (l === undefined) l = [];
    if (typeof coords[0][0] == 'object') {
        return coords.reduce(function(memo, c) {
            return memo.concat(justCoords(c));
        }, l);
    } else {
        return coords;
    }
}
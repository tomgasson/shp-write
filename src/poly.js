var ext = require('./extent');

module.exports.write = function writePoints(geometries, extent, shpView, shxView, TYPE) {

    var shpI = 0,
        shxI = 0,
        shxOffset = 100;

    geometries.forEach(writePolyLine);

    function writePolyLine(coordinates, i) {
        if (coordinates[0] !== undefined &&
            coordinates[0][0] !== undefined &&
            coordinates[0][0][0] !== undefined) {
            var parts = coordinates.length
            var memoryInc = shpI
            var flattened = []
            coordinates.forEach(function(polygon, i) {
                Array.prototype.push.apply(flattened, justCoords(polygon))
            })
            var contentLength = 52 + (parts * 4) + (flattened.length * 16);

            console.log("flattened flattened.length coordinates", flattened, flattened.length, coordinates)
            var featureExtent = flattened.reduce(function(extent, c) {
                return ext.enlarge(extent, c);
            }, ext.blank());


            var xmin = Infinity
            var ymin = Infinity
            var xmax = -Infinity
            var ymax = -Infinity
            flattened.forEach(function(d){
                var x = d[0]
                var y = d[1];
                if (y > ymax){ ymax = y }
                if (y < ymin){ ymin = y }
                if (x > xmax){ xmax = x }
                if (x < xmin){ xmin = x }
            })

            // INDEX
            shxView.setInt32(shxI, shxOffset / 2); // offset
            shxView.setInt32(shxI + 4, contentLength / 2); // offset length

            shxI += 8;
            shxOffset += contentLength + 8;

            shpView.setInt32(memoryInc, i + 1); // record number
            memoryInc += 4

            shpView.setInt32(memoryInc, contentLength / 2); // length // XXXX
            memoryInc += 4

            shpView.setInt32(memoryInc, TYPE, true); // POLYLINE=3
            memoryInc += 4

            shpView.setFloat64(memoryInc, xmin, true); // EXTENT
            memoryInc += 8

            shpView.setFloat64(memoryInc, ymin, true);
            memoryInc += 8

            shpView.setFloat64(memoryInc, xmax, true);
            memoryInc += 8

            shpView.setFloat64(memoryInc, ymax, true);
            memoryInc += 8


            shpView.setInt32(memoryInc, parts, true); // PARTS=t.geometry.coordinates.length
            memoryInc += 4

            shpView.setInt32(memoryInc, flattened.length, true); // POINTS
            memoryInc += 4

            for (var j = 0; j < parts; j++) {
                shpView.setInt32(memoryInc, j, true);
                memoryInc += 4
            }

            console.log("coordinates", coordinates)

            for (var j = 0; j < parts; j++) {
                coordinates[j].forEach(function(polygon, k) {
                    polygon.forEach(function(coords, l) {
                        shpView.setFloat64(memoryInc, coords[0], true); // X
                        memoryInc += 8

                        shpView.setFloat64(memoryInc, coords[1], true); // Y
                        memoryInc += 8
                    })
                });
            }

            shpI = memoryInc;
        } else {
            var flattened = justCoords(coordinates),
                contentLength = (flattened.length * 16) + 48;

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
            shpView.setInt32(shpI + 44, 1, true); // PARTS=1
            shpView.setInt32(shpI + 48, flattened.length, true); // POINTS
            shpView.setInt32(shpI + 52, 0, true); // The only part - index zero

            flattened.forEach(function writeLine(coords, i) {
                shpView.setFloat64(shpI + 60 + (i * 16), coords[0], true); // X
                shpView.setFloat64(shpI + 60 + (i * 16) + 8, coords[1], true); // Y
            });

            shpI += contentLength + 8;
        }
    }
};

module.exports.shpLength = function(geometries) {
    var size = 0;
    geometries.forEach(function(coordinates){
        var parts = 1
        var polySize = 0;
        if (coordinates[0] !== undefined &&
            coordinates[0][0] !== undefined &&
            coordinates[0][0][0] !== undefined) {
            parts = coordinates.length
        }
        var flattened = []
        coordinates.forEach(function(polygon, i) {
            Array.prototype.push.apply(flattened, justCoords(polygon))
        })
        polySize = 52 + (parts * 4) + (flattened.length * 16);
        size += polySize
    })
    console.log('calculated size', size)
    return size
};

module.exports.shxLength = function(geometries) {
    return geometries.length * 8;
};

module.exports.extent = function(coordinates) {
    return justCoords(coordinates).reduce(function(extent, c) {
        return ext.enlarge(extent, c);
    }, ext.blank());
};

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

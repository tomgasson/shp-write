var expect = require('expect.js'),
    extent = require('../src/extent');
var write = require('../src/write')

describe('extent', function() {

    describe('#blank', function() {
        it('creates an ext', function() {
            var ext = extent.blank();
            expect(ext.xmin).to.be.ok();
            expect(ext.ymin).to.be.ok();
            expect(ext.xmax).to.be.ok();
            expect(ext.ymax).to.be.ok();
        });
    });

    describe('#enlarge', function() {
        it('encloses a point', function() {
            var ext = extent.blank();
            extent.enlarge(ext, [0, 0]);
            expect(ext.xmin).to.eql(0);
            expect(ext.ymin).to.eql(0);
            expect(ext.xmax).to.eql(0);
            expect(ext.ymax).to.eql(0);
        });
    });

    describe('#enlargeExtent', function() {
        it('encloses a extent', function() {
            var ext = extent.blank(),
                extB = extent.blank();
            extent.enlarge(ext, [0, 0]);
            extent.enlarge(ext, [10, 10]);
            extent.enlargeExtent(extB, ext);
            expect(ext.xmin).to.eql(0);
            expect(ext.ymin).to.eql(0);
            expect(ext.xmax).to.eql(10);
            expect(ext.ymax).to.eql(10);
        });
    });

    describe('multipolygon', function() {
        it('writes a multipolygon', function() {
            
            // 3 level coords
            var points =  [
                [
                    [
                        149.2822265625,
                        -31.222197032103185
                    ],
                    [
                        150.00732421875,
                        -32.30570601389429
                    ],
                    [
                        147.89794921875,
                        -32.34284135639301
                    ],
                    [
                        149.2822265625,
                        -31.222197032103185
                    ]
                ]
            ];

            write(
                // feature data
                [{ id: 0 }],
                // geometry type
                'POLYGON',
                // geometries
                points,
                function(err, files){
                    var shpView = files.shp
                    console.log("shpView", shpView)
                    // expect(shpView.getInt32(1)).to.eql(1) // record number
                    expect(shpView.getInt32(2)).to.eql(1) // record number

                    // expect(shpView.getInt32(memoryInc, contentLength / 2)).to.eql(124142) // length // XXXX
                    // expect(shpView.getInt32(memoryInc, TYPE, true)).to.eql(3) // POLYLINE=3
                    // expect(shpView.getFloat64(memoryInc, xmin, true)).to.eql() // EXTENT
                    // expect(shpView.getFloat64(memoryInc, ymin, true)).to.eql()
                    // expect(shpView.getFloat64(memoryInc, xmax, true)).to.eql()
                    // expect(shpView.getFloat64(memoryInc, ymax, true)).to.eql()
                    // expect(shpView.getInt32(memoryInc, parts, true)).to.eql() // PARTS=t.geometry.coordinates.length
                    // expect(shpView.getInt32(memoryInc, flattened.length, true)).to.eql() // POINTS
                }
            );

        });
    });
});


/*

[
          [
            [
              149.2822265625,
              -31.222197032103185
            ],
            [
              150.00732421875,
              -32.30570601389429
            ],
            [
              147.89794921875,
              -32.34284135639301
            ],
            [
              149.2822265625,
              -31.222197032103185
            ]
          ]
        ]
*/


/*


*/
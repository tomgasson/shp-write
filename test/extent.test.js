var expect = require('expect.js'),
    extent = require('../src/extent');
var write = require('../src/write');
var types = require('../src/types');
var fs = require('fs')

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

    describe('polygon', function(){
        var points =  [
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
        ];

        var xmin = Infinity
        points.forEach(function(d){ xmin = d[0] < xmin ? d[0] : xmin})
        var ymin = Infinity
        points.forEach(function(d){ ymin = d[1] < ymin ? d[1] : ymin})
        var xmax = -Infinity
        points.forEach(function(d){ xmax = d[0] > xmax ? d[0] : xmax})
        var ymax = -Infinity
        points.forEach(function(d){ ymax = d[1] > ymax ? d[1] : ymax})

        write(
            // feature data
            [{ id: 0 }],
            // geometry type
            'POLYGON',
            // geometries
            [points],
            function(err, files){
                fs.writeFileSync('polygon.shp', toBuffer(files.shp.buffer));
                fs.writeFileSync('polygon.shx', toBuffer(files.shx.buffer));
                fs.writeFileSync('polygon.dbf', toBuffer(files.dbf.buffer));
                var view = files.shp
                describe('the file', function(){
                    it('has the correct header', function(){
                        expect(view.getInt32(0)).to.eql(9994); // FILE CODE


                        expect(view.getInt32(28, true)).to.be(1000); // VERSION
                        expect(view.getInt32(32, true)).to.be(types.geometries['POLYGON']) // SHAPE TYPE
                    })

                    it('has the correct bounds', function(){
                        expect(view.getFloat64(36, true)).to.eql(xmin) // EXTENT
                        expect(view.getFloat64(44, true)).to.eql(ymin)
                        expect(view.getFloat64(52, true)).to.eql(xmax)
                        expect(view.getFloat64(60, true)).to.eql(ymax)
                    })

                })
                describe('the shape', function(){
                    describe('the shape header', function(){
                        it('should start record numbers at one', function(){
                            expect(view.getInt32(100 + 0)).to.eql(1) // record number
                        })

                    })
                    describe('the polygon', function(){
                        describe('the header', function(){
                            it('should be a polygon', function(){
                                expect(view.getInt32(100 + 8 + 0, true)).to.eql(types.geometries['POLYGON']) // POLYLINE=3
                            })
                            it('should have the correct bounds', function(){
                                expect(view.getFloat64(100 + 8 + 4, true)).to.eql(xmin) // EXTENT
                                expect(view.getFloat64(100 + 8 + 12, true)).to.eql(ymin)
                                expect(view.getFloat64(100 + 8 + 20, true)).to.eql(xmax)
                                expect(view.getFloat64(100 + 8 + 28, true)).to.eql(ymax)
                            })
                        })
                        describe('the counts', function(){
                            it('should have one part', function(){
                                expect(view.getInt32(100 + 8 + 36, true)).to.eql(1)
                            })
                            it('should have 4 points', function(){
                                expect(view.getInt32(100 + 8 + 40, true)).to.eql(4)
                            })
                        })
                        describe('the part ids', function(){
                            it('should name the first part 0', function(){
                                expect(view.getInt32(100 + 8 + 44, true)).to.eql(0)
                            })
                        })
                        describe('the points', function(){
                            it('should list the points correctly', function(){
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 1) + 0, true)).to.eql(149.2822265625)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 1) + 8, true)).to.eql(-31.222197032103185)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 1) + 16, true)).to.eql(150.00732421875)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 1) + 24, true)).to.eql(-32.30570601389429)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 1) + 32, true)).to.eql(147.89794921875)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 1) + 40, true)).to.eql(-32.34284135639301)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 1) + 48, true)).to.eql(149.2822265625)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 1) + 56, true)).to.eql(-31.222197032103185)
                            })  
                        })
                    })
                    describe('the shape header', function(){
                        var count
                        it('should have the right shape content length', function(){
                             count = 44 +/*to parts*/
                                4/*one part*/ +
                                (8 * 8)/*8 coords*/

                            expect(view.getInt32(100 + 4)).to.eql(count / 2) //TODO
                        })
                        it('should have the right file length', function(){
                            expect(view.getInt32(24)).to.be((
                                100 +// file header
                                8 + // shape header
                                count // shape size
                                ) / 2
                            );
                        })
                    })
                })
            }
        );
    })

    describe('multipolygon', function(){
        var points =  [
            [
                [
                    150.4248046875, -32.472695022061494
                ],
                [
                    151.171875, -34.089061315849946
                ],
                [
                    148.974609375, -34.107256396631186
                ],
                [
                    150.4248046875, -32.472695022061494
                ]
            ], [
                [
                    146.71142578125, -33.925129700071984
                ],
                [
                    145.04150390625, -33.100745405144245
                ],
                [
                    148.974609375, -32.39851580247402
                ],
                [
                    146.71142578125, -33.925129700071984
                ]
            ]
        ];

        var xmin = Infinity
        points.forEach(function(d){ d.forEach(function(d){ xmin = d[0] < xmin ? d[0] : xmin}) })
        var ymin = Infinity
        points.forEach(function(d){ d.forEach(function(d){ ymin = d[1] < ymin ? d[1] : ymin}) })
        var xmax = -Infinity
        points.forEach(function(d){ d.forEach(function(d){ xmax = d[0] > xmax ? d[0] : xmax}) })
        var ymax = -Infinity
        points.forEach(function(d){ d.forEach(function(d){ ymax = d[1] > ymax ? d[1] : ymax}) })

        write(
            // feature data
            [{ id: 0 }],
            // geometry type
            'POLYGON',
            // geometries
            [points],
            function(err, files){
                fs.writeFileSync('multipolygon.shp', toBuffer(files.shp.buffer));
                fs.writeFileSync('multipolygon.shx', toBuffer(files.shx.buffer));
                fs.writeFileSync('multipolygon.dbf', toBuffer(files.dbf.buffer));
                var view = files.shp

                describe('the file', function(){
                    it('has the correct header', function(){
                        expect(view.getInt32(0)).to.eql(9994); // FILE CODE

                        expect(view.getInt32(28, true)).to.be(1000); // VERSION
                        expect(view.getInt32(32, true)).to.be(types.geometries['POLYGON']) // SHAPE TYPE
                    })

                    it('has the correct bounds', function(){
                        expect(view.getFloat64(36, true)).to.eql(xmin) // EXTENT
                        expect(view.getFloat64(44, true)).to.eql(ymin)
                        expect(view.getFloat64(52, true)).to.eql(xmax)
                        expect(view.getFloat64(60, true)).to.eql(ymax)
                    })

                })
                describe('the shape', function(){
                    describe('the shape header', function(){
                        it('should start record numbers at one', function(){
                            expect(view.getInt32(100 + 0)).to.eql(1) // record number
                        })

                    })
                    describe('the polygon', function(){
                        describe('the header', function(){
                            it('should be a polygon', function(){
                                expect(view.getInt32(100 + 8 + 0, true)).to.eql(types.geometries['POLYGON']) // POLYLINE=3
                            })
                            it('should have the correct bounds', function(){
                                expect(view.getFloat64(100 + 8 + 4, true)).to.eql(xmin) // EXTENT
                                expect(view.getFloat64(100 + 8 + 12, true)).to.eql(ymin)
                                expect(view.getFloat64(100 + 8 + 20, true)).to.eql(xmax)
                                expect(view.getFloat64(100 + 8 + 28, true)).to.eql(ymax)
                            })
                        })
                        describe('the counts', function(){
                            it('should have 2 parts', function(){
                                expect(view.getInt32(100 + 8 + 36, true)).to.eql(2)
                            })
                            it('should have 8 points', function(){
                                expect(view.getInt32(100 + 8 + 40, true)).to.eql(8)
                            })
                        })
                        describe('the part indexes', function(){
                            it('the first part starts at 0', function(){
                                expect(view.getInt32(100 + 8 + 44, true)).to.eql(0)
                            })
                            it('the second part starts at 4', function(){
                                expect(view.getInt32(100 + 8 + 48, true)).to.eql(4)
                            })
                        })
                        describe('the points', function(){
                            it('should list the points correctly', function(){
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 2) + (8 * 0), true)).to.eql(150.4248046875)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 2) + (8 * 1), true)).to.eql(-32.472695022061494)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 2) + (8 * 2), true)).to.eql(151.171875)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 2) + (8 * 3), true)).to.eql(-34.089061315849946)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 2) + (8 * 4), true)).to.eql(148.974609375)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 2) + (8 * 5), true)).to.eql(-34.107256396631186)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 2) + (8 * 6), true)).to.eql(150.4248046875)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 2) + (8 * 7), true)).to.eql(-32.472695022061494)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 2) + (8 * 8), true)).to.eql(146.71142578125)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 2) + (8 * 9), true)).to.eql(-33.925129700071984)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 2) + (8 * 10), true)).to.eql(145.04150390625)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 2) + (8 * 11), true)).to.eql(-33.100745405144245)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 2) + (8 * 12), true)).to.eql(148.974609375)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 2) + (8 * 13), true)).to.eql(-32.39851580247402)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 2) + (8 * 14), true)).to.eql(146.71142578125)
                                expect(view.getFloat64(100 + 8 + 44 + (4 * 2) + (8 * 15), true)).to.eql(-33.925129700071984)
                            })  
                        })
                    })
                    describe('the shape header', function(){
                        var count
                        it('should have the right shape content length', function(){
                             count = 44 +/*poly header up till parts*/
                                (4 * 2)/*two part*/ +
                                (8 * 16)/*16 coords*/

                            expect(view.getInt32(100 + 4)).to.eql(count / 2) //TODO
                        })
                        it('should have the right file length', function(){
                            expect(view.getInt32(24)).to.be((
                                100 +// file header
                                8 + // shape header
                                count // shape size
                                ) / 2
                            );
                        })
                    })
                })
            }
        );
    })
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


function toBuffer(ab) {
    var buffer = new Buffer(ab.byteLength),
        view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) { buffer[i] = view[i]; }
    return buffer;
}

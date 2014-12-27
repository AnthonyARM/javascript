define( {
        create : function (main )
        {
                require(["js/ajax","js/utils","dojo/ready", "dojox/geo/openlayers/Map", "dojox/geo/openlayers/GfxLayer",
                          "dojox/geo/openlayers/GeometryFeature", "dojox/geo/openlayers/Point","dojo/_base/window","dojox/geo/openlayers/Collection",
                          "dojo/on", "dijit/Tooltip", "dojo/_base/lang","dojo/_base/array","dojo/dom-geometry", "dojox/geo/openlayers/LineString", 
                          "dojo/_base/Color","dijit/form/MultiSelect", "dijit/form/Select","dojox/layout/TableContainer","dijit/layout/ContentPane","dijit/form/Form", 
                          "dijit/form/CheckBox", "dijit/form/RadioButton", "js/url" ],
                     function(ajax, utils, ready, Map, GfxLayer, GeometryFeature, Point, win, Collection,on, Tooltip, lang, arr, domGeom, LineString, 
                             Color, MultiSelect, Select, TableContainer, ContentPane, Form, CheckBox, RadioButton, url){

                ready(function(){
                // create a map widget.
                var main_table = new TableContainer( { cols: 1, showLabels: false, style:'height:100%;'} );
                /*
                var type_select = new Select( { options : [ 
                        { label : 'Recent outings' , value:'recent', selected: true}, 
                        { label : 'Personal Bests' , value:'pbs'} ] } );
                if( url.get("type_select") )
                {
                       //Check it's a valid option:
                       for( opt of type_select.options )
                       {
                                if( opt.value == url.get("type_select") )
                                {
                                        type_select.set('value', url.get("type_select"));
                                        break;
                                }
                       }
                }
                if( type_select.value != url.get("type_select") )
                {
                        url.set("type_select", type_select.value);
                }

                type_select.on("change", function(new_value) { 
                        url.set("type_select", new_value);
                        } );
                        */


                var map_container = new ContentPane( { style:'height:100%;' });
                var menu_table = new TableContainer( { cols: 3, showLabels: false, style:'width:400px;white-space:nowrap;'} );
                var outings_table = new TableContainer( { cols: 2, showLabels: true} );
                var selection_table = new TableContainer( { cols: 1, showLabels: false} );
                var recent_selected = new RadioButton( { checked: true, value : "recent", name: "view_selection" });
                var pbs_selected = new RadioButton( { checked: false, value : "pbs", name: "view_selection" });
                menu_table.addChild( new ContentPane({content: "View: "}));
                selection_table.addChild( recent_selected );
                selection_table.addChild( pbs_selected );
                main_table.addChild( menu_table );
                main_table.addChild( outings_table );

                //TODO: Add DataGrid to outings_table with selectionMode=single

                var pbs_categories = new Select ({ options : [
                        { label : 'Per crew', value:'pb_crew', selected : true },
                        { label : 'Per boat', value:'pb_boat' }
                        ], style: "display: none" } );

                var crews = new MultiSelect( { multiple : "true", name: "crews", style: "display:" + (url.get("filter_crew") ? "block" : "none") } );
                //FIXME: Should be get_crews()
                ajax.get_boats( function( boats )
                {
                        var first = true;
                        for( var b of boats )
                        {
                                var opt = win.doc.createElement('option');
                                opt.innerHTML = b.name;
                                opt.value = b.num_rowers +","+ b.cox+","+b.id;
                                if(first)
                                {
                                        opt.selected = "selected";
                                        first = false;
                                }
                                crews.containerNode.appendChild(opt);
                        }
                });


                var filter_crew = new CheckBox( { id: "filter_crew", checked: url.get("filter_crew"), onChange: function(b) { 
                                url.set("filter_crew", b);
                                crews.set("style","display:" + (b ? "block" : "none"));
                                } });
                menu_table.addChild( filter_crew );

                var boats = new MultiSelect( { multiple : "true", name: "boats", style: "display:" + (url.get("filter_boat") ? "block" : "none") } );
                ajax.get_boats( function( boat_list )
                {
                        var first = true;
                        var boat_selected = url.get("boat");
                        if( boat_selected ) 
                        {
                                first = false;
                                console.log(boat_selected);
                                boat_selected = String(boat_selected).split(",");
                        }
                        else
                                boat_selected = Array();
                        for( var b of boat_list )
                        {
                                var opt = win.doc.createElement('option');
                                opt.innerHTML = b.name;
                                opt.value = b.id;
                                if(first || -1 !=  boat_selected.indexOf( b.id ))
                                {
                                        opt.selected = "selected";
                                        first = false;
                                }
                                boats.containerNode.appendChild(opt);
                        }
                });
                on( boats, "change", function(evt){
                        console.log(evt.join(','));
                        url.set("boat", String(evt.join(',')));
                });
                var filter_boat = new CheckBox( { id: "filter_boat", checked: url.get("filter_boat"), onChange: function(b) { 
                                url.set("filter_boat", b);
                                boats.set("style","display:" + (b ? "block" : "none"));
                                } });

                menu_table.addChild( filter_boat );

                menu_table.addChild( selection_table );
                menu_table.addChild( crews );
                menu_table.addChild( boats );

                function create_label( cb, txt )
                {
                        var lbl =  win.doc.createElement("label", { "for": cb.id});
                        lbl.innerHTML = txt;
                        cb.domNode.parentNode.appendChild( lbl );
                }
                main.addChild( main_table );
                create_label( filter_crew, "Filter by crew");
                create_label( filter_boat, "Filter by boat");
                create_label( recent_selected, "Recent outings");
                create_label( pbs_selected, "Personal Bests");
                main_table.addChild( map_container );

                    var map = new Map(map_container.containerNode);
                   // This is New York
                    var ny = {
                      latitude : 40.71427,
                      longitude : -74.00597
                    };
                    // create a GfxLayer
                    var layer = new GfxLayer();
                    // add layer to the map
                    map.addLayer(layer);
                    // fit to New York with 0.1 degrees extent

                        var localXY = function(p){
                                var x = p.x;
                                var y = p.y;
                                var layer = map.olMap.baseLayer;
                                var resolution = map.olMap.getResolution();
                                var extent = layer.getExtent();
                                console.log(extent);
                                var rx = (x / resolution + (-extent.left / resolution));
                                var ry = ((extent.top / resolution) - y / resolution);
                                return [rx, ry];
                        };

                ajax.get_trackpoints( 12492, 12522, function( pts )
                {
                        var min = { latitude : parseFloat(pts[0].latitude), longitude : parseFloat(pts[0].longitude) } ;
                        var max = { latitude : parseFloat(pts[0].latitude), longitude : parseFloat(pts[0].longitude) } ;
                        var min_speed = 3.77777;
                        var max_speed = 4.1994;
                        var prev = null;
                        var mins = 100;
                        var maxs = 0;
                        arr.forEach( pts, function(p)
                        {
                                var latitude = parseFloat( p.latitude );
                                var longitude = parseFloat( p.longitude );
                                var speed = parseFloat( p.speed );
                                if( latitude > max.latitude ) max.latitude = latitude ;
                                else if( latitude < min.latitude ) min.latitude = latitude ;
                                if( longitude > max.longitude ) max.longitude = longitude ;
                                else if( longitude < min.longitude ) min.longitude = longitude ;
                                //FIXME Remove this
                                if( speed > maxs ) maxs = speed;
                                else if( speed < mins) mins = speed;

                                var ratio = (p.speed - min_speed ) / (max_speed - min_speed );
                                var colour = Color.blendColors( Color.fromArray([255,0,0]), Color.fromArray([0,255,0]), ratio);
                                //console.log(colour+" Ratio : "+ratio);

                                if( prev)
                                {
                                        var diff_longitude = longitude - prev.longitude;
                                        var diff_latitude = latitude - prev.latitude;

                                        var start = prev;
                                        for( var i = 0.25; i <= 1.0; i += 0.25 )
                                        {
                                                var new_pt = { longitude: prev.longitude + i*diff_longitude, 
                                                        latitude:prev.latitude + i * diff_latitude, 
                                                        colour: Color.blendColors( prev.colour, colour, i ) };

                                                var line = new LineString( [{x:start.longitude,y:start.latitude},{x:new_pt.longitude,y:new_pt.latitude}]);
                                                var f = new GeometryFeature(line);
                                                f.setStroke({color: start.colour, width: 3});
                                                layer.addFeature(f);
                                                start = new_pt;
                                        }

                                }

                                prev = { longitude: longitude, latitude:latitude, colour: colour};

                                var pt = new Point( {x:longitude,y:latitude} );
                            var f = new GeometryFeature(pt);
                            var size = 2;
                            // set the shape properties, fill and stroke
                            //f.setFill([ 0, 128, 128 ]);
                            f.setStroke([ 0, 0, 0, 1 ]);
                            f.setShapeProperties({
                              r : 2
                            });
                            pt.tooltip= (p.speed * 3.6).toFixed(2) + " kph, dist: "+(p.distance / 1000).toFixed(2)+" km, time: "+ utils.time_to_str(p.time);
                            // add the feature to the layer
                            layer.addFeature(f);
                            f.getShape();
                             pt.shape.connect("onmouseover",function(evt){
                                             //evt.relatedTarget
                                             Tooltip.show(pt.tooltip, {x:evt.pageX, y:evt.pageY, w:2, h:2});
                                                });
                             pt.shape.connect("onmouseout", function(){
                                                                //FIXME: Doesn't work
                                             Tooltip.hide(pt.shape);
                                                        });
                        });
                        console.log("Min speed : "+mins+" Max speed : "+ maxs);
                        console.log(min.latitude+" , "+min.longitude+" / "+max.latitude+" , "+max.longitude);
                    map.fitTo({
                    bounds :[ min.longitude,min.latitude,max.longitude,max.latitude ]
                    });

                });
            });
            });
        }

});

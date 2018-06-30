define( {
        create : function (main )
        {
                require(["js/ajax","js/utils","dojo/ready", "dojox/geo/openlayers/Map", "dojox/geo/openlayers/GfxLayer",
                          "dojox/geo/openlayers/GeometryFeature", "dojox/geo/openlayers/Point","dojo/_base/window","dojox/geo/openlayers/Collection",
                          "dojo/on", "dijit/Tooltip", "dojo/_base/lang","dojo/_base/array","dojo/dom-geometry", "dojox/geo/openlayers/LineString", 
                          "dojo/_base/Color","dijit/form/MultiSelect", "dijit/form/Select","dojox/layout/TableContainer","dijit/layout/ContentPane","dijit/form/Form", 
                          "dijit/form/CheckBox", "dijit/form/RadioButton", "js/url",'dojo/data/ItemFileWriteStore', 'dojox/grid/DataGrid',"dijit/form/Button" ],
                     function(ajax, utils, ready, Map, GfxLayer, GeometryFeature, Point, win, Collection,on, Tooltip, lang, arr, domGeom, LineString, 
                             Color, MultiSelect, Select, TableContainer, ContentPane, Form, CheckBox, RadioButton, url, ItemFileWriteStore, DataGrid, Button){

                ready(function(){

            function MyGrid(name, layout, main)
            {
                this.name = name;
                this.store = new ItemFileWriteStore( { data: { identifier: 'id', items:[]} });
                this.layout = layout;
                this.grid = new DataGrid({
                            id: name+'_grid',
                            selectionMode: "single",
                            store: this.store,
                            structure: this.layout,
                            style:"height:20em;"});
               main.addChild(this.grid);
            }

            MyGrid.prototype.clear_store = function()
            {
                this.store = new ItemFileWriteStore( { data: { identifier: 'id', items:[]} });
                this.grid.setStore( this.store );
            }

            MyGrid.prototype.show = function( display )
            {
                this.grid.set("style","display: "+ (display ? "block" : "none"));
            } 

            function SelectionGrids(main)
            {
               var t = this;
               var table = new TableContainer( { cols: 2, showLabels: false} );
               t.outings = new MyGrid("outings",[[
                  {'name': 'Id', 'field': 'id', hidden: true},
                  {'name': 'Date', 'field': 'date', 'width': '140px', editable: false},
                  {'name': 'Title', 'field': 'title', 'width': '140px', editable: false},
                  {'name': 'Crew', 'field': 'crew', 'width': '200px', editable: false},
                  {'name': 'Boat', 'field': 'boat', 'width': '200px', editable: false},
                ]],table);
               t.outings.grid.set('colspan','2');

               t.pieces = new MyGrid("pieces", [[
                  {'name': 'Id', 'field': 'id', hidden: true},
                  {'name': 'Downstream','field':'downstream', 'width':'100px'},
                  {'name': 'Start (km)','field':'start', 'width':'100px'},
                  {'name': 'End (km)','field':'end', 'width':'100px'},
                  {'name': 'Length (m)','field':'distance', 'width':'100px'},
                  {'name': 'Duration','field':'fmt_duration', 'width':'100px'},
                ]],table);
               t.pieces.show( false );

                t.delete_piece_btn = new Button( { label:"Delete selected piece", onClick: function(){
                    //Delete selected piece:
                    console.log("Deleting : "+this.selected_piece);
                    ajax.delete_piece(this.selected_piece, function()
                        {
                            console.log("DONE!");
                            t.on_outing_selected();
                        });
                    
                    }});
                main.addChild(t.delete_piece_btn);
                t.delete_piece_btn.show = function( show )
                {
                    t.delete_piece_btn.set("style","display:" + ((utils.is_trusted() &&
show) ? "block" : "none"));
                };
                t.delete_piece_btn.show( false );
               t.PBs= new MyGrid("PBs", [[ {'name': 'Id', 'field': 'id', hidden: true},
                  {'name': 'Distance (m)','field':'distance', 'width':'100px'},
                  {'name': 'Projected','field':'projected', 'width':'100px'},
                  {'name': 'Start (m)','field':'start', 'width':'100px'},
                  {'name': 'End (m)','field':'end', 'width':'100px'},
                  {'name': 'Duration','field':'fmt_duration', 'width':'100px'},
                  {'name': 'Min speed (kph)','field':'min_speed', 'width':'100px'},
                  {'name': 'Max speed (kph)','field':'max_speed', 'width':'100px'},
                  {'name': 'Split (/500m)','field':'split_time', 'width':'100px'},
                ]],table);
               t.PBs.show( false );

               t.distanceBests= new MyGrid("distanceBests", [[
                  {'name': 'Id', 'field': 'id', hidden: true},
                  {'name': 'Downstream','field':'downstream', 'width':'100px'},
                  {'name': 'Date', 'field': 'date', 'width': '140px', editable: false},
                  {'name': 'Title', 'field': 'title', 'width': '140px', editable: false},
                  {'name': 'Duration','field':'fmt_duration', 'width':'100px'},
                  {'name': 'Min speed (kph)','field':'min_speed', 'width':'100px'},
                  {'name': 'Max speed (kph)','field':'max_speed', 'width':'100px'},
                  {'name': 'Crew', 'field': 'crew', 'width': '200px', editable: false},
                  {'name': 'Boat', 'field': 'boat', 'width': '200px', editable: false},
                  {'name': 'Start (km)','field':'start', 'width':'100px'},
                  {'name': 'End (km)','field':'end', 'width':'100px'},
                  {'name': 'Length (m)','field':'distance', 'width':'100px'},
                  {'name': 'Start (m)','field':'start', 'width':'100px'},
                  {'name': 'End (m)','field':'end', 'width':'100px'},
                  {'name': 'Duration','field':'fmt_duration', 'width':'100px'},
                  {'name': 'Min speed (kph)','field':'min_speed', 'width':'100px'},
                  {'name': 'Max speed (kph)','field':'max_speed', 'width':'100px'},
                ]],table);
               t.distanceBests.show( false );
               /*
                    id
                    piece_id
                    distance
                    start_point
                    end_point
                    duration
                    projected
                    min_speed
                    max_speed
                    */

               main.addChild(table);

               var selected_dist = url.get('dist');
               var selected_piece = url.get('piece');
               var selected_outing = url.get('outing');
               t.on_outing_selected = function() {
                    var outing = t.outings.grid.selection.getSelected()[0];
                    url.set("outing",outing.id);
                    url.unset("piece");
                    url.unset("dist");
                    ajax.get_pieces( outing.id, function( list ){
                       t.PBs.show( false );
                       t.delete_piece_btn.show( false );
                       t.pieces.clear_store();
                       t.pieces.grid.selection.clear();
                       var idx = 0;
                        for( p of list )
                        {
                            t.pieces.store.newItem(p);
                            if( p.id == selected_piece)
                            {
                                t.pieces.grid.selection.setSelected(idx, true);
                                t.pieces.grid.scrollToRow(idx);
                                selected_piece = null;
                            }
                            idx++;
                        }
                       t.pieces.show( true );
                    });
                };
               on( t.outings.grid, 'Selected', function(idx) {
                   t.on_outing_selected();
                });
               on( t.pieces.grid, 'Selected', function(idx) {
                    var piece = t.pieces.grid.selection.getSelected()[0];
                    url.set("piece",piece.id);
                    url.unset("dist");
                    ajax.get_pbs( piece.id, function( list ){
                        t.PBs.clear_store();
                        t.PBs.grid.selection.clear();
                        var idx=0;
                        for( p of list )
                        {
                            t.PBs.store.newItem(p);
                            if( p.id == selected_dist )
                            {
                                t.PBs.grid.selection.setSelected(idx, true);
                                t.PBs.grid.scrollToRow(idx);
                                selected_dist = null;
                            }
                            idx++;
                        }
                        t.PBs.show( true );
                        t.delete_piece_btn.show( true );
                        t.delete_piece_btn.selected_piece = piece.id;
                    });
                });

               ajax.get_outings( function(list){ 
                   var idx=0;
                   for( outing of list){
                       t.outings.store.newItem(outing);
                       if(outing.id == selected_outing)
                       {
                           t.outings.grid.selection.setSelected(idx, true);
                           t.outings.grid.scrollToRow(idx);
                           selected_outing= null;
                       }
                       idx++;
                   }
               });

                /*
                    id
                    outing_id
                    trackpoint_start
                    trackpoint_end
                    min_longitude
                    max_longitude
                    min_latitude
                    max_latitude
                    duration
                    distance
                    downstream
                    */
            }

            function MyMap(main){
                var map_container = new ContentPane( { style:'height:100%; overflow:hidden;' });
                main.addChild( map_container );
                this.map = new Map(map_container.containerNode);
                // create a GfxLayer
                this.layer = new GfxLayer();
                // add layer to the map
                this.map.addLayer(this.layer);
            }

            function MyFilters(main)
            {
                var main_table = new TableContainer( { cols: 1, showLabels: false} );
                var menu_table = new TableContainer( { cols: 3, showLabels: false, style:'width:400px;white-space:nowrap;'} );
                var selection_table = new TableContainer( { cols: 1, showLabels: false} );
                var t = this;
                t.recent_selected = new RadioButton( { checked: true, value : "recent", name: "view_selection"});
                t.pbs_selected = new RadioButton( { checked: false, value : "pbs", name: "view_selection"});
                menu_table.addChild( new ContentPane({content: "View: "}));
                selection_table.addChild( t.recent_selected );
                selection_table.addChild( t.pbs_selected );
                main_table.addChild( menu_table );

                var pbs_categories = new Select ({ options : [
                        { label : 'Per crew', value:'pb_crew', selected : true },
                        { label : 'Per boat', value:'pb_boat' }
                        ], style: "display: none" } );

                var crews = new MultiSelect( { multiple : "true", name: "crews", style: "display:" + (url.get("filter_crew") ? "block" : "none") } );
                ajax.get_crews( function( crew_list )
                {
                        var first = true;
                        for( var b of crew_list )
                        {
                                var opt = win.doc.createElement('option');
                                opt.innerHTML = b.name;
                                opt.value = "bla "+b.id;
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
                                //console.log(boat_selected);
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
                        //console.log(evt.join(','));
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
                create_label( t.recent_selected, "Recent outings");
                create_label( t.pbs_selected, "Personal Bests");
            }
            // create a map widget.
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


            //var filters = new MyFilters(main);
            var selectionGrids = new SelectionGrids(main);
            var map = new MyMap(main);

            /*
            on( filters.recent_selected, "Change", function(b){
               selectionGrids.outings.grid.selection.clear();
               selectionGrids.outings.show( b );
               selectionGrids.PBs.show( false );
               selectionGrids.pieces.show( false );
               selectionGrids.distanceBests.grid.selection.clear();
               selectionGrids.distanceBests.show(!b);
            });
            */
            on( selectionGrids.PBs.grid, "Selected", function(idx){
                var pb = selectionGrids.PBs.grid.selection.getSelected()[0];
                url.set("dist",pb.id);
                //console.log("Selected ! "+pb.max_latitude);
                ajax.get_trackpoints( pb.start_point, pb.end_point, function( pts )
                {
                        var min_speed = pb.min_speed / 3.6; /* has to be m/s not kph */
                        var diff_speed = (pb.max_speed - pb.min_speed)/ 3.6;
                        var prev = null;
                        var piece_start = selectionGrids.pieces.grid.selection.getSelected()[0].start *1000;
                        map.layer.clear();
                        arr.forEach( pts, function(p)
                        {
                                var latitude = parseFloat( p.latitude );
                                var longitude = parseFloat( p.longitude );
                                var speed = parseFloat( p.speed );
                                var ratio = (p.speed - min_speed ) / diff_speed;
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
                                                map.layer.addFeature(f);
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
                            pt.tooltip= (p.speed * 3.6).toFixed(2) + " kph, total dist: "+(p.distance / 1000).toFixed(2)+" km, piece distance: "+( p.distance - piece_start).toFixed(0)+", time: "+ utils.time_to_str(p.time);
                            // add the feature to the layer
                            map.layer.addFeature(f);
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
                    var diff_longitude = pb.max_longitude - pb.min_longitude;
                    var diff_latitude = pb.max_latitude - pb.min_latitude;
                    var scale = diff_longitude > diff_latitude ? diff_longitude : diff_latitude ;
                    var bounds =[ parseFloat(pb.min_longitude) + 0.5 * diff_longitude, parseFloat(pb.min_latitude) + 0.5 * diff_latitude ];
                    //console.log("Bounds "+bounds);
                    scale =0.1;
                    //console.log("diff long :"+diff_longitude+" diff lat :" +diff_latitude+" scale : "+scale);
                    map.map.fitTo({
                    bounds :[ parseFloat(pb.min_longitude),parseFloat(pb.min_latitude),parseFloat(pb.max_longitude),parseFloat(pb.max_latitude) ]
                    });
                    map.layer.redraw();
                    //console.log(" long [ "+pb.min_longitude+" , "+pb.max_longitude+" ] lat ["+pb.min_latitude+" , "+pb.max_latitude+" ] ");

                });
                });


            });
            });
        }

});

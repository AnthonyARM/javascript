define( {
        create : function (main )
        {
                require(["js/ajax","js/utils","dojo/ready", "dojox/geo/openlayers/Map", "dojox/geo/openlayers/GfxLayer",
                          "dojox/geo/openlayers/GeometryFeature", "dojox/geo/openlayers/Point","dojo/_base/window","dojox/geo/openlayers/Collection",
                          "dojo/on", "dijit/Tooltip", "dojo/_base/lang","dojo/_base/array","dojo/dom-geometry", "dojox/geo/openlayers/LineString", 
                          "dojo/_base/Color","dijit/form/MultiSelect", "dijit/form/Select","dojox/layout/TableContainer","dijit/layout/ContentPane","dijit/form/Form", 
                          "dijit/form/CheckBox", "dijit/form/RadioButton", "js/url",'dojo/data/ItemFileWriteStore', 'dojox/grid/DataGrid',"dijit/form/Button","dojox/form/HorizontalRangeSlider", "dojox/charting/Chart", "dojox/charting/axis2d/Default", "dojox/charting/plot2d/Lines",
                          "dojox/charting/action2d/MouseIndicator","dijit/Dialog","dijit/form/TextBox"],
                     function(ajax, utils, ready, Map, GfxLayer, GeometryFeature, Point, win, Collection,on, Tooltip, lang, arr, domGeom, LineString, 
                             Color, MultiSelect, Select, TableContainer, ContentPane, Form, CheckBox, RadioButton, url, ItemFileWriteStore, DataGrid, Button, HorizontalRangeSlider, Chart, Default, Lines,
                     MouseIndicator, Dialog, TextBox){

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
                  {'name': 'Start', 'field': 'trackpoint_start', hidden: true},
                  {'name': 'End', 'field': 'trackpoint_end', hidden: true},
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
				t.dlg = null;
                t.custom_piece_btn = new Button( { label:"Create custom piece from selection", onClick: function(){
                    console.log(parseInt(this.selected_piece_start) - 10);
					if(!t.dlg) {
						t.dlg = new Dialog({title:"Adding a custom piece"});
						var length = new TextBox({name:"length", value: "0"});
						var duration = new TextBox({name:"duration", value: "0"});
						var table = new TableContainer( { cols: 2, showLabels:false } );
						table.addChild( new ContentPane({content:"Force length (m):"}));
						table.addChild(length);
						table.addChild( new ContentPane({content:"Force duration (s):"}));
						table.addChild(duration);
						t.dlg.points = new MyGrid("points", [[
							{'name': 'Id', 'field': 'id', hidden: true, sortDesc: false},
							{'name': 'Speed (kph)', 'field': 'speed', 'width':'100px', editable:false},
							{'name': 'Time', 'field': 'date', 'width':'140px', editable:false},
						]], table);
						t.dlg.points.grid.set('colspan','2');
						t.dlg.points.grid.set('height','20em');
						t.dlg.points.data = [];
						table.addChild(new Button({ label:"+10 Before", onClick: function(){
							ajax.get_trackpoints(parseInt(t.dlg.points.first) - 10, parseInt(t.dlg.points.first) -1, function(pts){
								for(p of pts) {
									p.speed = p.speed * 3.6;
								}
								t.dlg.points.data = pts.concat(t.dlg.points.data);
								t.dlg.points.clear_store();
								t.dlg.points.first = t.dlg.points.data[0].id;
								t.dlg.points.last = t.dlg.points.data[t.dlg.points.data.length -1].id;
								for(p of t.dlg.points.data) {
									t.dlg.points.store.newItem(p);
								}
							});
						}}));
						table.addChild(new Button({ label:"+10 After", onClick: function(){
							ajax.get_trackpoints(parseInt(t.dlg.points.last) + 1, parseInt(t.dlg.points.last) +10, function(pts){
								for(p of pts) {
									p.speed = p.speed * 3.6;
								}
								t.dlg.points.data = t.dlg.points.data.concat(pts)
								t.dlg.points.clear_store();
								t.dlg.points.first = t.dlg.points.data[0].id;
								t.dlg.points.last = t.dlg.points.data[t.dlg.points.data.length -1].id;
								for(p of t.dlg.points.data) {
									t.dlg.points.store.newItem(p);
								}
							});
						}}));
						var this_btn = this;
						table.addChild(new Button({ label:"OK", onClick: function(){
							if(t.dlg.points.selected_point) {
								var start = t.dlg.points.selected_point;
								var end;
								var create = function(piece_id, start, end) {
									if(end){
										console.log(piece_id+" / "+start.id+" / "+end);
										ajax.create_custom_piece(piece_id, start.id, end, function(){
											console.log("Returned");
											t.dlg.hide();
										});
									}
									else {
										console.log("Failed to find the end of the piece");
									}
								}
								console.log(start);
								if(duration.value > 0) {
									var first = start.id;
									ajax.get_trackpoints_time( start.id, this_btn.selected_piece_end, parseInt(start.time) + parseInt(duration.value), function(pts) {
										console.log(pts[0].time - start.time)
										create(this_btn.selected_piece,start, pts[0].id);
									});
								}
								else if(length.value > 0 ){
									ajax.get_trackpoints_distance( start.id, this_btn.selected_piece_end, parseInt(start.distance)+ parseInt(length.value), function(pts) {
										console.log(pts[0].distance - start.distance)
										create(this_btn.selected_piece,start, pts[0].id);
									});
								} else {
									create(this_btn.selected_piece, start, this_btn.selected_piece_end);
								}
							}
						}}));
						table.addChild(new Button({label:"Cancel", onClick: function(){ t.dlg.hide();}}));
						t.dlg.addChild(table);
						on( t.dlg.points.grid, 'Selected', function(idx) {
							var point = t.dlg.points.grid.selection.getSelected()[0];
							t.dlg.points.selected_point = point;
						});
					}
					ajax.get_trackpoints( parseInt(this.selected_piece_start) - 10, parseInt(this.selected_piece_start) + 5, function( pts ){
						console.log(pts);
						for(p of pts) {
							p.speed = p.speed * 3.6;
						}
						t.dlg.points.data = pts;
						t.dlg.points.clear_store();
						t.dlg.show();
						t.dlg.points.first = t.dlg.points.data[0].id;
						t.dlg.points.last = t.dlg.points.data[t.dlg.points.data.length -1].id;
						for(p of t.dlg.points.data) {
							console.log(p);
							t.dlg.points.store.newItem(p);
						}
					});
				}});
                main.addChild(t.delete_piece_btn);
                main.addChild(t.custom_piece_btn);
                t.delete_piece_btn.show = function( show )
                {
                    t.delete_piece_btn.set("style","display:" + ((utils.is_trusted() &&
show) ? "block" : "none"));
                };
                t.custom_piece_btn.show = function( show )
                {
                    t.custom_piece_btn.set("style","display:" + ((utils.is_trusted() &&
show) ? "block" : "none"));
                };
                t.delete_piece_btn.show( false );
                t.custom_piece_btn.show( false );

               t.PBs= new MyGrid("PBs", [[ {'name': 'Id', 'field': 'id', hidden: true},
                  {'name': 'Distance (m)','field':'distance', 'width':'100px'},
                  {'name': 'Duration','field':'fmt_duration', 'width':'100px'},
                  {'name': 'Split (/500m)','field':'split_time', 'width':'100px'},
                  {'name': 'Max speed (kph)','field':'max_speed', 'width':'100px'},
                  {'name': 'Min speed (kph)','field':'min_speed', 'width':'100px'},
                  {'name': 'Projected','field':'projected', 'width':'100px'},
                  {'name': 'Start (m)','field':'start', 'width':'100px'},
                  {'name': 'End (m)','field':'end', 'width':'100px'},
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
                       t.custom_piece_btn.show( false );
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
                        t.custom_piece_btn.show( true );
                        t.delete_piece_btn.selected_piece = piece.id;
                        t.custom_piece_btn.selected_piece_start = piece.trackpoint_start;
                        t.custom_piece_btn.selected_piece_end = piece.trackpoint_end;
                        t.custom_piece_btn.selected_piece = piece.id;
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
                var speed_range = new ContentPane({})
                var This = this;
                main.addChild(speed_range);
                this.rangeSlider = new HorizontalRangeSlider({
                        value: [15,19],
                        minimum: 10,
                        maximum: 25,
                        discreteValues: 151,
                        intermediateChanges: true,
                        style: "width: 400px;",
                        onClick: function(ev){
                            This.redraw();
                            url.set("min_speed", this.get("value")[0]);
                            url.set("max_speed", this.get("value")[1]);
                        },
                        onChange: function(value){
                                  speed_range.set("content", "Speed Range: "+ value);
                        }
                  });
                this.rangeSlider.onChange(this.rangeSlider.get("value"));
                main.addChild(this.rangeSlider);

                var chart_container = new ContentPane( { style: 'height:200px;'});

                var map_container = new ContentPane( { style:'height:100%; margin:20px;overflow:hidden;' });
                main.addChild( chart_container );
                main.addChild( map_container );
                this.chart = new Chart(chart_container.containerNode);
                this.chart.addPlot("default", {labels:true, type:Lines, markers:true});
                this.map = new Map(map_container.containerNode);
                // create a GfxLayer
                this.layer = new GfxLayer();
                // add layer to the map
                this.map.addLayer(this.layer);
                this.pts = []
                this.redraw = function(pts) {
                    if( typeof pts != "undefined")
                    {
                        This.pts = pts;
                    }
                    var min_speed = This.rangeSlider.get("value")[0] / 3.6; /* has to be m/s not kph */
                    var diff_speed = (This.rangeSlider.get("value")[1] - This.rangeSlider.get("value")[0])/ 3.6;
                    var prev = null;
                    var speeds = [];
                    var distances = [0];
                    var times = [{value:0, text:"dummy"}];
                    var start_time = 0;
                    This.layer.clear();
                    arr.forEach( This.pts, function(p)
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
                                else
                                {
                                    start_time = p.time;
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
                            speeds.push(p.speed * 3.6);
                            distances.push((p.distance - This.piece_start).toFixed(0));
                            times.push({ value: times.length, text: utils.time_to_str(p.time - start_time)});
                            pt.tooltip= (p.speed * 3.6).toFixed(2) + " kph, total dist: "+(p.distance / 1000).toFixed(2)+" km, piece distance: "+distances.back+", time: "+ utils.time_to_str(p.time);
                            var p3 = new Point({x:longitude, y:latitude, distance: (p.distance - This.piece_start).toFixed(0)});
                            var f3 = new GeometryFeature(p3);
                            f3.createShape = function(s){
                                return s.createText({text:(p.speed * 3.6).toFixed(2) + " kph, dist: "+( p.distance - This.piece_start).toFixed(0), align:"middle", y:4});
                            };
                            f3.setFill('black');
                            // add the feature to the layer
                            map.layer.addFeature(f);
                            map.layer.addFeature(f3);
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
                    map.chart.addSeries("Series 1", speeds);
                    var chartMouseindicator = new MouseIndicator(this.chart, "default", { series: "Series 1",
                                        mouseOver: true,
                                            font: "normal normal bold 12pt Tahoma",
                                            fillFunc: function(v){
                                                var ratio = (v.y/3.6 - min_speed ) / diff_speed;
                                                var colour = Color.blendColors( Color.fromArray([255,0,0]), Color.fromArray([0,255,0]), ratio);
                                                //console.log(colour+" Ratio : "+ratio);
                                                return colour;
                                                                    },
                                            labels: false,
                                            labelFunc: function(v){
                                                return times[v.x].text + "<br/>" + v.y.toFixed(2) + "kph<br/>" + utils.time_to_str((0.5 / v.y)*3600) +" /500m<br/>"+distances[v.x]+"m";
                                                                    }});
                    var mouseTooltip = new Tooltip();
                    on(chartMouseindicator, "Change", function(evt){
                      if(evt.label)
                      {
                        var around = map.chart.getPlot("default").toPage({x: evt.start.x, y: maxVertical });
                        around.w = 1;
                        around.h = 1;
                        mouseTooltip.label = evt.label;
                        mouseTooltip.position = ["above-centered"];
                        if (!tooltipShown) {
                          shown = true;
                          mouseTooltip.open(around);
                          } else {
                          Tooltip._masterTT.containerNode.innerHTML = mouseTooltip.label;
                          place.around(Tooltip._masterTT.domNode, around, ["above-centered"]);
                          }
                          } else {
                          // hide
                          mouseTooltip.close();
                          tooltipShown = false;
                      }
                    });
                    this.chart.addAxis("x", { majorLabels:true, labels:times, minorLabels:false});
                    this.chart.addAxis("y", {vertical:true, majorLabels:true, fixLower: "major", fixUpper: "major", title: "Speed", min:this.rangeSlider.get("value")[0], max: this.rangeSlider.get("value")[1]});
                    map.chart.render();
                    map.map.fitTo({
                    bounds : This.bounds
                    });
                    This.layer.redraw();
                    var maxVertical = map.chart.getAxis("y").getScaler().bounds.to;
                    var tooltipShown = false;
                };
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
            var selected_min_speed = url.get('min_speed');
            var selected_max_speed = url.get('max_speed');
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
                    if(selected_min_speed && selected_max_speed)
                    {
                        map.rangeSlider.set("value",[parseFloat(selected_min_speed).toFixed(1), parseFloat(selected_max_speed).toFixed(1)]);
                        selected_min_speed = null;
                        selected_max_speed = null;
                    }
                    else
                    {
                        map.rangeSlider.set("value",[parseFloat(pb.min_speed).toFixed(1), parseFloat(pb.max_speed).toFixed(1)]);
                    }
                        map.piece_start = selectionGrids.pieces.grid.selection.getSelected()[0].start *1000;
                        map.bounds = [ parseFloat(pb.min_longitude),parseFloat(pb.min_latitude),parseFloat(pb.max_longitude),parseFloat(pb.max_latitude) ]
                        map.redraw(pts);

                });
                });


            });
            });
        }

});

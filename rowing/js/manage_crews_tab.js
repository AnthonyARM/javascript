function refresh_crew_list()
{
}

function create_new_crew( name, start_speed, end_speed, dialog, error_cb, success_cb )
{
        require(["js/ajax","dojox/widget/Standby"], function( ajax, Standby ){
                var standby = new Standby({target: dialog.domNode});
                dialog.addChild(standby);
                standby.show();
                ajax.add_crew( name, start_speed, end_speed, function(result){
                        crew_id = parseInt( result );
                        if( isNaN( crew_id )  )
                        {
                            error_cb( result );
                            standby.hide();
                        }
                        else
                        {
                            standby.hide();
                            dialog.hide();
                            var new_val = { id: crew_id, name: name, start_threshold: start_speed, end_threshold: end_speed};
                            success_cb( new_val );
                        }
                });
                });
}

function crew_form(main, cb)
{
        require(["js/ajax","dojo/on","dijit/form/Form", "dijit/layout/ContentPane",
            "dijit/form/Button", "dojox/layout/TableContainer", "dijit/form/TextBox", "dijit/Dialog","dojo/domReady!"],
        function(ajax, on, Form, ContentPane, Button, TableContainer, TextBox, Dialog){
                var dialog = new Dialog({title:"Create a new crew"});
                var form = new Form( { action: "add_outing.php"});
                var table = new TableContainer( { cols: 2, showLabels:false, style:'width:400px' } );

                var name = new TextBox( { name: "name"} );
                var start_threshold = new TextBox( { name: "start_threshold"} );
                var end_threshold = new TextBox( { name: "end_threshold"} );

                table.addChild( new ContentPane({content: "Name: "}));
                table.addChild( name );
                table.addChild( new ContentPane({content: "Start of piece speed threshold (kph): "}));
                table.addChild( start_threshold);
                table.addChild( new ContentPane({content: "End of piece speed threshold (kph): "}));
                table.addChild( end_threshold);

                var errorsPane = new ContentPane({ colspan:"2" });
                table.addChild( new Button( { type : "submit", label:"Create"}));
                table.addChild( new Button( { onClick: function(){ dialog.hide(); }, label:"Discard"}));
                table.addChild( errorsPane );

                on(form,"submit",function(evt){
                        dojo.stopEvent(evt);
                        var errors = "";
                        var start_val =  parseFloat(start_threshold.value);
                        var end_val =  parseFloat(end_threshold.value);
                        if( name.value == "" )
                                errors += "Please enter a Name for the crew<br/>";
                        if( start_threshold.value == "" )
                                errors += "Please enter a Start speed threshold for the crew<br/>";
                        else if( isNaN( start_val))
                                errors += "The Start speed threshold is not a valid speed (e.g 15.0 )<br/>";
                        if( end_threshold.value == "" )
                                errors += "Please enter an End speed threshold for the crew<br/>";
                        else if( isNaN( end_val))
                                errors += "The End speed threshold is not a valid speed (e.g 15.0 )<br/>";

                        errorsPane.set("content",errors)
                        if( errors == "")
                        {
                                create_new_crew( name.value, start_val, end_val, dialog, function(error){ errorsPane.set("content",error); }, cb);
                                return true;
                        }
                        else
                                return false;
                });

                table.placeAt( form.containerNode);
                dialog.addChild(form);
                dialog.show();
        });
}
define({ create : function(main){
        require(["js/ajax","dojo/on","dijit/form/Form", "dijit/layout/ContentPane",
            "dijit/form/Button", "dojox/layout/TableContainer", "dijit/form/TextBox", "dijit/Dialog", "dijit/form/MultiSelect",
            "dojo/_base/window", 'dojo/_base/lang', 'dojox/grid/DataGrid', 'dojo/store/Memory','dojo/data/ObjectStore','dojo/store/Observable','dojo/data/ItemFileWriteStore'
            ,"dojo/domReady!"],
        function(ajax, on, Form, ContentPane, 
                Button, TableContainer, TextBox, Dialog, MultiSelect, 
                win, lang, DataGrid, Memory, ObjectStore, Observable, ItemFileWriteStore){
                var table = new TableContainer( { cols: 2, showLabels:false, style:"width:450px" } );
                /*
                var crews = new MultiSelect({ multiple : "false", name: "crews", colspan:"3"});
                table.addChild(crews);
                */
             /*set up data store*/
                //var memory = new Memory({ data: { identifier: 'id', items:[]}               
                //});
                //var store = new ObjectStore( {objectStore: memory});
                var store = new ItemFileWriteStore( { data: { identifier: 'id', items:[]} });
                    /*set up layout*/
                    var layout = [[
                      {'name': 'Id', 'field': 'id', hidden: true},
                      {'name': 'Name', 'field': 'name', 'width': '240px', editable: true},
                      {'name': 'Start threshold (kph)', 'field': 'start_threshold', 'width': '80px', editable: true},
                      {'name': 'End threshold (kph)', 'field': 'end_threshold', 'width': '80px', editable: true},
                    ]];
                    var old_value;
                    var selected_item;

                    var delete_btn = new Button( { label:"Delete", disabled: true, onClick : function() {
                        store.deleteItem( selected_item );
                        ajax.delete_crew( selected_item.id, function( retval ){ 
                            if( isNaN( parseInt( retval ) ) ){
                                errorsPane.set("content", "ERROR while deleting a crew: "+ retval);
                            }
                        });
                        delete_btn.set("disabled",true);
                    }
                    });

                    var errorsPane = new ContentPane({ colspan:"2" });
                    /*create a new grid*/
                    var grid = new DataGrid({
                        id: 'grid',
                        selectionMode: "single",
                        store: store,
                        structure: layout,
                        colspan:"3", style:"height:20em;"});

                    on( grid, 'StartEdit',function( inCell, inRow ){
                        old_value = store.getValue( grid.getItem(inRow), inCell.field );
                    });
                    on( grid,'ApplyCellEdit', function( inVal, inRow, column){ 
                        var new_value = store.getValue( selected_item, column );
                        if( new_value != old_value )
                        {
                            if( column != "name" )
                            {
                                var float_val = parseFloat( new_value );
                                if( isNaN( float_val ))
                                {
                                    store.setValue(selected_item, column, old_value);
                                    errorsPane.set("content","Invalid value '"+new_value+"' for column '"+column+"'");
                                    return;
                                }
                            }
                            errorsPane.set("content","");
                            ajax.update_crew( selected_item.id, column, new_value, function( retval ){
                                if( isNaN( parseInt( retval ) ) ){
                                    errorsPane.set("content","ERROR while updating crew data: "+ retval);
                                }
                            });
                        }
                    });

                    on( grid, 'Selected', function(idx){
                        selected_item = grid.selection.getSelected()[0];
                        delete_btn.set("disabled",false);
                    });

                    /*append the new grid to the div*/
                    var div = ContentPane({style: "width:440px; height:300px;", colspan:"3"});
                    div.addChild(grid);
                    grid.startup();
                    table.addChild( div );

                ajax.get_crews( function( crew_list )
                {
                        for( var b of crew_list )
                        {
                              store.newItem( b );
                        }
                });


                table.addChild( new Button( { label:"Add", onClick: function(){
                    crew_form(main, function(new_crew){ 
                        store.newItem( new_crew );
                    });
                }
                }));
                table.addChild( delete_btn );
                table.addChild( errorsPane );
                main.addChild( table );
        });
}});



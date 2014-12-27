define({
	create : function( main )
        {
                require(["js/ajax","dojo/store/Memory","dojo/on","dijit/form/Form", "dijit/form/MultiSelect", "dijit/form/FilteringSelect","dijit/layout/ContentPane","dojo/_base/window",
                         "dojox/form/Uploader",
                    "dijit/form/Button", "dojox/layout/TableContainer", "dijit/form/TextBox", "dijit/form/CheckBox", "dojo/domReady!"],
                function(ajax, Memory, on, Form, MultiSelect, FilteringSelect, ContentPane, win, Uploader, Button, TableContainer, TextBox, CheckBox){
                        // create the BorderContainer and attach it to our appLayout div
                /*
                        main.addChild( new Button ( { label: "Upload", onClick: function() { console.log("First button was clicked");
                                                }}));
                        main.addChild( new Button ( { label: "Second", onClick: function() { console.log("Second button was clicked");
                                                }}));
                       */

                var form = new Form( { action: "add_outing.php", method:"post", encType:"multipart/form-data"});
                var table = new TableContainer( { cols: 2, showLabels:false } );
                var title = new TextBox( { name: "title"} );
                var loc = new TextBox( { name: "location", value:"Cam"} );

                table.addChild( new ContentPane({content: "Title:"}));
                table.addChild( title );

                table.addChild( new ContentPane({content: "Location:"}));
                table.addChild( loc );
                table.addChild( new ContentPane({content: "Boat:"}));
                var boat = new MultiSelect({ multiple : "false", name: "boat"});
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
                                boat.containerNode.appendChild(opt);
                        }
                });

                var num_rowers = 0;
                var people = [
                        { name : "Uploader", show: true },
                        { name : "Cox", show: false },
                        { name : "Stroke", show: false},
                        { name : 7, show: false},
                        { name : 6, show: false},
                        { name : 5, show: false},
                        { name : 4, show: false},
                        { name : 3, show: false},
                        { name : 2, show: false},
                        { name : "Bow",  show: false},
                        { name : "Coach", show: true}
                ];
                boat.startup();
                table.addChild( boat );

                var rowersStore = new Memory();
                ajax.get_rowers( function( rowers )
                {
                        for( var b of rowers )
                        {
                                rowersStore.put( { id: b.id, name: b.firstName + " " + b.lastName} );
                        }
                });

                var peopleNodes = new Array();
                for(var p of people )
                {
                        var newNode = { label: new ContentPane({content: p.name+":", id:p.name+"Lbl", style: "display:" + (p.show ? "block" : "none")+";"}),
                                        select: new FilteringSelect({store: rowersStore, id:p.name+"Select", name: p.name+"Select", style: "display:" + (p.show ? "block" : "none")+";"})
                        };
                        table.addChild( newNode.label );
                        table.addChild( newNode.select );
                        peopleNodes[p.name] = newNode;
                }

                on( boat, "change", function(evt){
                                var val = String(evt).split(",");
                                var num_rowers = parseInt(val[0]);
                                // Show cox ?
                                console.log("num_rowers = "+num_rowers+" val[1] = "+val[1]);
                                people[1].show = val[1] == 1;
                                people[2].show = num_rowers > 1;
                                people[3].show = num_rowers == 8;
                                people[4].show = num_rowers == 8;
                                people[5].show = num_rowers == 8;
                                people[6].show = num_rowers == 8;
                                people[7].show = num_rowers >= 4;
                                people[8].show = num_rowers >= 4;
                                people[9].show = num_rowers > 1;
                                console.log("1 = "+people[1].show);

                                for( p of people )
                                {
                                        console.log("Name "+p.name+" show "+p.show);
                                        peopleNodes[p.name].label.set("style","display:" + (p.show ? "block" : "none"));
                                        peopleNodes[p.name].select.set("style","display:" +(p.show ? "block" : "none"));
                                        //peopleNodes[p.name].select.set("required", p.show ? "true" : "false" );
                                }

                                });

                table.addChild( new ContentPane({content: "TCX track:"}));
                var uploader = new Uploader( { multiple:false, type:"submit", id: "tcxBtn", label:"Choose file" } ) 
                var fileCell = new TableContainer( { cols : 2, showLabels : false } );
                var filename = new ContentPane( );
                fileCell.addChild( uploader );
                fileCell.addChild(filename);

                on( uploader, "change", function(evt){
                                filename.set( "content", evt[0].name);
                                });

                table.addChild( fileCell );
                table.addChild( new Button( { type : "submit", label:"Upload"}));
                var errorsPane = new ContentPane();
                table.addChild( errorsPane );

                table.placeAt( form.containerNode );

                on (form, "submit", function(evt){
                                var errors = "";
                                if( filename.get("content") == "" )
                                        errors += "You need to select a TCX file to upload<br/>";
                                if( title.value == "")
                                        errors += "Please enter a Title for the outing<br/>";
                                if( loc.value == "")
                                        errors += "Please enter a Location for the outing<br/>";

                                for( p of people )
                                {
                                        if( p.show  && peopleNodes[p.name].select.value == "" && p.name != "Coach")
                                                errors += "Please select a "+ p.name+"<br/>";
                                }
                                var boat_array= String(boat.value).split(",");
                                if( boat_array.length > 2 )
                                {
                                        console.log("Boat: "+ boat_array[2]);
                                }
                                else
                                        console.log("Boat: ERG");

                                console.log( "Title: "+title.value);
                                console.log( "Uploader: "+peopleNodes["Uploader"].select.value);
                                errorsPane.set("content",errors)
                                //alert( errors );

                                return errors == "";
                                });
                main.addChild( form );
                });
        }
})

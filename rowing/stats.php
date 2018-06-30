<!DOCTYPE HTML>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Rowing Stats</title>
        <link rel="stylesheet" href="style.css" media="screen">
        <link rel="stylesheet" href="http://ajax.googleapis.com/ajax/libs/dojo/1.10.1/dijit/themes/claro/claro.css" media="screen">
        <link rel="stylesheet" href="//ajax.googleapis.com/ajax/libs/dojo/1.10.3/dojox/grid/resources/Grid.css" />
                        <link rel="stylesheet" href="//ajax.googleapis.com/ajax/libs/dojo/1.10.3/dojox/grid/resources/claroGrid.css" />
<style type="text/css">
body,html { height:100%; }
</style>
    </head>
    <body class="claro">
    <p id="error" trusted='<?php if(isset($_GET['trusted']))echo "1";else echo "0"; ?>'></p>
        <div id="appLayout" class="demoLayout">
        </div>
        <!-- load dojo and provide config via data attribute -->
        <script type="text/javascript" src="http://openlayers.org/api/2.10/OpenLayers.js"></script>
        <script src="//ajax.googleapis.com/ajax/libs/dojo/1.10.1/dojo/dojo.js"
                data-dojo-config="async: 1, packages: [ {
                                      name: 'js',
                                      location: location.pathname.replace(/\/[^/]+$/, '') + '/js' }]" >
        </script>
        <script>

        function create_main_layout()
        {
                require(["dijit/registry", "dijit/layout/BorderContainer",
                    "dijit/layout/TabContainer", "dijit/layout/ContentPane", "dijit/layout/SplitContainer","dijit/form/Button",
                    "js/url","js/new_outing_tab","js/view_outings_tab","js/manage_crews_tab", "js/utils",
                    "dojo/domReady!"],
                function(registry, BorderContainer, TabContainer, ContentPane, SplitContainer, Button, 
                        url, new_outing_tab, view_outings_tab, manage_crews_tab, utils)
                {
                        // create the BorderContainer and attach it to our appLayout div
                        var appLayout = new BorderContainer({
                            design: "headline"
                        }, "appLayout");

                        // create the TabContainer
                        var contentTabs = new TabContainer({
                            region: "center",
                            id: "contentTabs",
                            tabPosition: "top",
                            "class": "centerPanel"
                        });

                        // add the TabContainer as a child of the BorderContainer
                        appLayout.addChild( contentTabs );

                        // create and add the BorderContainer edge regions
                        appLayout.addChild(
                            new ContentPane({
                                region: "top",
                                "class": "edgePanel",
                                content: "Rowing stats"
                            })
                        );
                        /*
                        appLayout.addChild(
                            new ContentPane({
                                region: "left",
                                id: "leftCol", "class": "edgePanel",
                                content: "Sidebar content (left)",
                                splitter: true
                            })
                        );
                        */

                        var tabs = new Array();
                        tabs.push( new ContentPane({ title: "Recent outings", id:"recent", factory: view_outings_tab.create} ));
                        //tabs.push( new ContentPane({ title: "Search", id:"search", factory: create_search_tab } ));
                        if(utils.is_trusted())
                        {
                            tabs.push( new ContentPane({ title: "Add a new outing", id:"add", factory: new_outing_tab.create } ));
                            tabs.push( new ContentPane({ title: "Add/Edit rowers", id:"rowers" } ));
                            tabs.push( new ContentPane({ title: "Manage crews", id:"crews", factory: manage_crews_tab.create } ));
                            tabs.push( new ContentPane({ title: "Add/Edit boats", id:"boats" } ));
                            tabs.push( new ContentPane({ title: "Edit pieces", id:"pieces" } ));
                            tabs.push( new ContentPane({ title: "Add/Edit PB distances", id:"distances" } ));
                        }
                        if( ! url.get("tab") )
                        {
                                url.set("tab",tabs[0].id);
                        }
                        for( var tab of tabs )
                        {
                                contentTabs.addChild( tab );
                                if( url.get("tab") == tab.id )
                                {
                                        tab.factory( tab );
                                        tab.factory = null;
                                        contentTabs.selectChild( tab );
                                }
                        }

                        contentTabs.watch("selectedChildWidget", function(name, oval, nval){
                                //url.clear();
                                url.set( "tab", nval.id);
                                if( nval.factory )
                                {
                                        nval.factory( nval );
                                        nval.factory = null;
                                }
                                            });


                        // start up and do layout
                        appLayout.startup();
                });
        }
        create_main_layout();
        </script>
    </body>
</html>

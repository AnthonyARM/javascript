
define({
            get_boats: function ( cb ) {
                require([
                        'dojo/_base/xhr',
                        'dojo/json',
                        ], function(xhr,json) {
                        xhr.post({
                                // The URL of the request
                                url: "db_select.php",
                                // No content property -- just send the entire form
                                content: { query: "SELECT * from Boats" },
                                // The success handler
                                load: function(response)
                                {
                                        cb( json.parse( response, true ));
                                }
                        });
                        });
            },
            get_trackpoints : function( id_start, id_end, cb ) {
                require([
                        'dojo/_base/xhr',
                        'dojo/json',
                        ], function(xhr,json) {
                        xhr.post({
                                // The URL of the request
                                url: "db_select.php",
                                // No content property -- just send the entire form
                                content: { query: "SELECT * from TrackPoints where id between "+id_start+" AND "+id_end },
                                // The success handler
                                load: function(response)
                                {
                                        cb( json.parse( response, true ) );
                                }
                        });
                        });
            },
            get_rowers : function( cb ) {
                require([
                        'dojo/_base/xhr',
                        'dojo/json',
                        ], function(xhr,json) {
                        xhr.post({
                                // The URL of the request
                                url: "db_select.php",
                                // No content property -- just send the entire form
                                content: { query: "SELECT * from Rowers" },
                                // The success handler
                                load: function(response)
                                {
                                        cb( json.parse( response, true ) );
                                }
                        });
                        });
            }
    });

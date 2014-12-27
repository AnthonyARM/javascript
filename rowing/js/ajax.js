
function execute_select_query( cb, params )
{
                require([
                        'dojo/_base/xhr',
                        'dojo/json',
                        ], function(xhr,json) {
                        xhr.post({
                                // The URL of the request
                                url: "db_select.php",
                                // No content property -- just send the entire form
                                content: params,
                                // The success handler
                                load: function(response)
                                {
                                        if( response == 0 )
                                        {
                                                console.log("ERROR in "+params.query);
                                        }
                                        else
                                        {
                                                cb( json.parse( response, true ));
                                        }
                                }
                        });
                        });
}

function execute_insert_query( cb, params )
{
                require([
                        'dojo/_base/xhr',
                        ], function(xhr) {
                        xhr.post({
                                // The URL of the request
                                url: "db_insert.php",
                                // No content property -- just send the entire form
                                content: params,
                                // The success handler
                                load: function(response)
                                {
                                        cb( response );
                                }
                        });
                        });
}

define({
            get_boats: function ( cb ) {
                    execute_select_query(cb, { query: "get_boats" });
            },
            get_trackpoints : function( id_start, id_end, cb ) {
                    execute_select_query(cb, { query: "get_trackpoints_in_range", start: id_start, end:id_end });
            },
            get_rowers : function( cb ) {
                    execute_select_query(cb, { query: "get_rowers" });
            },
            get_crews : function ( cb ) {
                    execute_select_query(cb, { query: "get_crews" });
            },
            add_crew : function (name, start_speed, end_speed, cb ){
                    execute_insert_query(cb, { query: "new_crew", name: name, start_speed: start_speed, end_speed: end_speed});
            },
            delete_crew : function( id, cb){
                execute_insert_query(cb, { query: "delete_crew", id: id } );
            },
            update_crew: function( id, field, value, cb ){
                execute_insert_query(cb, { query: "update_crew", id: id, field: field, value:value});
            },
    });

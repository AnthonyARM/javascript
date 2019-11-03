
function execute_select_query( cb, params )
{
	//console.log( params );
 //       console.log(new Error().stack);
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
                                            //console.log("response : "+response);
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
            create_custom_piece: function( piece_id, start_pt, end_pt, cb ) {
                execute_insert_query(cb, { query: "create_custom_piece", piece_id:piece_id, start:start_pt, end:end_pt});
            },
            get_pbs: function( piece_id, cb ) {
                execute_select_query(cb, { query: "get_pbs", piece_id: piece_id});
            },
            get_pieces: function( outing_id, cb ) {
                execute_select_query(cb, { query: "get_pieces", outing_id: outing_id });
            },
            get_outings: function( cb ) {
                execute_select_query(cb, { query: "get_outings" });
            },
            get_boats: function ( cb ) {
                    execute_select_query(cb, { query: "get_boats" });
            },
            get_trackpoints : function( id_start, id_end, cb ) {
                    execute_select_query(cb, { query: "get_trackpoints_in_range", start: id_start, end:id_end });
            },
            get_trackpoints_time : function( id_start, id_end, time, cb ) {
                    execute_select_query(cb, { query: "get_trackpoints_in_range_time", start: id_start, end:id_end, time:time });
            },
            get_trackpoints_distance : function( id_start, id_end, distance, cb ) {
                    execute_select_query(cb, { query: "get_trackpoints_in_range_distance", start: id_start, end:id_end, distance:distance });
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
            delete_piece : function( id, cb){
                execute_insert_query(cb, { query: "delete_piece", id: id } );
            },
            delete_crew : function( id, cb){
                execute_insert_query(cb, { query: "delete_crew", id: id } );
            },
            update_crew: function( id, field, value, cb ){
                execute_insert_query(cb, { query: "update_crew", id: id, field: field, value:value});
            },
    });

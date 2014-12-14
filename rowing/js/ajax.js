
function execute_query( cb, params )
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
define({
            get_boats: function ( cb ) {
                    execute_query(cb,{ query: "get_boats" });
            },
            get_trackpoints : function( id_start, id_end, cb ) {
                    execute_query(cb, { query: "get_trackpoints_in_range", start: id_start, end:id_end });
            },
            get_rowers : function( cb ) {
                    execute_query(cb,{ query: "get_rowers" });
            }
    });

define({
        time_to_str : function( time_sec ){
                var mins = parseInt( time_sec / 60 );
                var secs = time_sec - mins * 60;
                var hours = parseInt( mins / 60 );
                mins = mins - hours * 60;
                var str = "";
                if( hours > 0 )
                        str += hours +" h ";
                if( mins > 0 )
                        str += mins + " min ";
                str += secs + " secs";
                return str;
        },
});


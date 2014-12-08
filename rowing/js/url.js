define(["dojo/io-query", "dojo/hash"], function( ioQuery, hash )
    {
        var _hashes = ioQuery.queryToObject(hash()); //get
        console.log("js/url constructor called");
        return {
            get : function( name ) { return _hashes[name];},
            set : function( name, value){
                _hashes[name] = value;
                this.update();
            },
            hashes : _hashes,
            update: function(){
                hash( ioQuery.objectToQuery(_hashes)); //set url
            }
        };

    });

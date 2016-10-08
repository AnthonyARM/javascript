<?php

/* MySQL:
$mysqli = new mysqli("localhost", "rowing", "radegund", "rowing_stats");
if($mysqli->connect_errno)
{
	echo "Failed to connect to MySQL: ".$mysqli->connect_error;
}

function db_fetch_array( $res )
{
	return $res->fetch_array(MYSQLI_ASSOC);
}

function db_to_time( $time )
{
	return "SEC_TO_TIME(".$time.")";
}

function db_truncate_float( $num, $dec)
{
	return "TRUNCATE(".$num.",".$dec.")";
}

function db_execute_query_params( $query, $query_args_types, $query_args )
{
        global $mysqli;
        if(! ($stmt = $mysqli->prepare($query)))
        {
                echo "ERROR: SQL Request preparation failed: (". $mysqli->errno .") ". $mysqli->error."<br/>";
        }
        $args = array();
        $args []= & $query_args_types;

        for( $i=0; $i < count($query_args); $i++)
        {
                $args[]= & $query_args[$i];
        }
        if( !call_user_func_array( array($stmt,'bind_param'), $args ))
        {
                echo "ERROR: SQL Request bind_param failed: (". $stmt->errno .") ". $stmt->error."<br/>";
        }
        return $stmt;
}

function db_error()
{
	global $mysqli;
	return "[".$mysqli->errno."] : ".$mysqli->error;
}

function db_last_insert_id()
{
	global $mysqli;
	return $mysqli->insert_id;
}
*/
/* SQLite3:*/
$mysqli = new SQLite3('rowing.sqlite');

function db_fetch_array( $res )
{
	return $res->fetchArray();
}
function db_to_time( $time )
{
	return "time(".$time.")";
}
function db_truncate_float( $num, $dec)
{
	return "printf(\"%.".$dec."f\",".$num.")";
}

function get_type( $type )
{
	switch( $type )
	{
		case "s":
			return SQLITE3_TEXT;
		case "d":
			return SQLITE3_FLOAT;
		case "i":
			return SQLITE3_INTEGER;
		default:
			die("db_connection.php:get_type(): Unsupported type ".$type."<br/>");
	}
}

function db_execute_query_params( $query, $query_args_types, $query_args )
{
	global $mysqli;
	if(! ($stmt = $mysqli->prepare($query)))
	{
		die("ERROR SQL Request preparation failed [Line ".__LINE__."]: ". db_error() . "query = ".$query."<br>");
	}
	for( $i=0; $i < count($query_args); $i++)
	{
		$stmt->bindValue(1+$i,$query_args[$i], get_type($query_args_types[$i]))or die("Failed to bind ".$i." of ".$query." : ".$query_args[$i]." : ".db_error()."<br/>");
	}
	return $stmt;
}

function db_error()
{
	global $mysqli;
	return "[".$mysqli->lastErrorCode()."] : ".$mysqli->lastErrorMsg();
}

function db_last_insert_id()
{
	global $mysqli;
	return $mysqli->lastInsertRowID();
}

?>

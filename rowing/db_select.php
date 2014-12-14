<?php

include('db_connection.php');

$requests = array (
        "get_boats" => function() { return "SELECT * from Boats";},
        "get_trackpoints_in_range" => function() { return "SELECT * from TrackPoints where id between ".$_POST['start']." AND ".$_POST['end']; },
        "get_rowers" => function() { return "SELECT * from Rowers";}
);

if( array_key_exists( $_POST['query'], $requests ) )
{
        $res = $mysqli->query( $requests[ $_POST['query'] ]());

        $json = array();
        while ($row = $res->fetch_array(MYSQLI_ASSOC)) 
        {
                array_push($json, $row);
        }
        echo json_encode($json);
}
else
        echo "ERROR: Unknown query '"+$_POST['query']+"'<br/>";
?>

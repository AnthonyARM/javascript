<?php

try
{
include('db_connection.php');

$requests = array (
    "get_boats" => function() { return "SELECT * from Boats";},
    "get_crews" => function() { return "SELECT * from Crews";},
    "get_trackpoints_in_range" => function() { return "SELECT * from TrackPoints where id between ".$_POST['start']." AND ".$_POST['end']; },
    "get_rowers" => function() { return "SELECT * from Rowers";},
    "get_outings" => function() { return "SELECT Outings.id, Outings.title, Outings.date, Crews.name as crew, Boats.name as boat FROM Outings INNER JOIN Crews ON Outings.crew_id=Crews.id INNER JOIN Boats ON Outings.boat_id=Boats.id ORDER BY Outings.date DESC";},
    "get_pieces" => function() { return "SELECT Pieces.*, ".db_to_time("Pieces.duration")." as fmt_duration, ".db_truncate_float("starts.distance/1000",3)." as start, ".db_truncate_float("ends.distance/1000",3)." as end FROM Pieces
    INNER JOIN TrackPoints starts ON starts.id=Pieces.trackpoint_start
    INNER JOIN TrackPoints ends ON ends.id=Pieces.trackpoint_end
    WHERE Pieces.outing_id=".$_POST['outing_id'];},
    "get_pbs" => function() { return "SELECT PBs.*, pieces.min_latitude, pieces.max_latitude, pieces.min_longitude, 
    pieces.max_longitude, ".db_to_time("PBs.duration", 1)." as fmt_duration, 
    ".db_to_split("PBs.duration","PBs.distance")." as split_time,
    ".db_truncate_float("(starts.distance - piece_start.distance)",0)." as start, 
    ".db_truncate_float("(ends.distance - piece_start.distance)",0)." as end FROM PBs
    INNER JOIN TrackPoints starts ON starts.id=PBs.start_point
    INNER JOIN TrackPoints ends ON ends.id=PBs.end_point
    INNER JOIN Pieces pieces ON pieces.id=PBs.piece_id
    INNER JOIN TrackPoints piece_start ON pieces.trackpoint_start=piece_start.id
        WHERE PBs.piece_id=".$_POST['piece_id'];},
);

if( array_key_exists( $_POST['query'], $requests ) )
{
        $res = $mysqli->query( $requests[ $_POST['query'] ]());

        $json = array();
        while ($row = db_fetch_array($res))
        {
                array_push($json, $row);
        }
        echo json_encode($json);
}
else
        echo "ERROR: Unknown query '"+$_POST['query']+"'<br/>";

}
catch (Exception $e)
{
	echo 'ERROR: ',  $e->getMessage(), "<br/>";
}
?>

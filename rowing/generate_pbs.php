<?php

/* Clean up:
DELETE FROM `Outings` WHERE 1;
DELETE FROM `PBs` WHERE 1;
DELETE FROM `TrackPoints` WHERE 1;
DELETE FROM `PersonalTrackPoints` WHERE 1;
DELETE FROM `Pieces` WHERE 1;
 */

function timeStr( $time )
{
        $minutes = intval($time / 60.0);
        $secs = $time - 60.0 * $minutes;
        $s = "";
        if( $minutes > 0 )
        {
                $s .= $minutes." min ";
        }
        $s .= number_format($secs,2) . " sec";
        return $s;
}

class Point
{
        public $distance = 0.0;
        public $date;
        public $prev = NULL;
        public $next = NULL;
        public $time = 0.0;
        public $speed = 0.0;
        public $delta_distance = 0.0;
        public $delta_time = 0.0;
        public $id = 0;
        public $longitude = 0;
        public $latitude = 0;

        function __construct( $prev, $distance, $date, $time, $speed, $id, $longitude, $latitude )
        {
                $this->prev = $prev;
                $this->distance = $distance;
                $this->date = $date;
                $this->time = $time;
                $this->id = $id;
                $this->longitude = $longitude;
                $this->latitude = $latitude;
                if( $this->prev )
                {
                        $this->prev->next = $this;
                        $this->delta_time = $this->time - $prev->time;
                        $this->delta_distance = $this->distance - $this->prev->distance;
                        $this->speed = $this->delta_distance * 3.6 / $this->delta_time;
                }
        }
}

class PB
{
        public $piece_start = NULL;
        public $start = NULL;
        public $distance = 0.0;
        public $end = NULL;
        public $time = 0.0;
        public $min_speed = 0.0;
        public $max_speed = 0.0;
        function __construct( $start, $end, $distance )
        {
                $this->piece_start = $start;
                $this->distance = $distance;
                if( $end->distance - $start->distance < $distance ) // If the piece is too short: calculate the projected finish time
                {
                        $this->time = ($end->time - $start->time) * $distance / ($end->distance - $start->distance);
                        $this->projected = 1;
                        $this->start = $start;
                        $this->end = $end;
                }
                else
                {
                        $pt = $start;
                        $best = 0.0;
                        while( $pt != $end->next )
                        {
                                while( $pt->distance - $start->distance > $distance ) // Do we have enough points to cover the distance ?
                                {
                                        $t = ($pt->time - $start->time) / ($pt->distance - $start->distance );
                                        if( ($this->start && $t < $best ) || !$this->start )
                                        {
                                                $this->start = $start;
                                                $this->end = $pt;
                                                $best = $t;
                                        }
                                        $start = $start->next;
                                }
                                $pt = $pt->next;
                        }
                        $this->time = ($this->end->time - $this->start->time) * $this->distance / ($this->end->distance - $this->start->distance);
                        $this->projected = 0;
                }
                $this->min_speed = $start->speed;
                $this->max_speed = $start->speed;
                $pt = $this->start;
                while( $pt != $this->end->next )
                {
                    if($this->min_speed > $pt->speed )
                        $this->min_speed = $pt->speed;
                    elseif($this->max_speed < $pt->speed )
                        $this->max_speed = $pt->speed;
                    $pt = $pt->next;
                }
        }
        function str()
        {
                $s = "";
                if( $this->start )
                {
                        $s .= "Best ";
                }
                else
                {
                        $s .= "PROJECTED ";
                }
                $s .= $this->distance . "m = ". timeStr( $this->time ). " ( ". number_format(3.6* $this->distance / $this->time,2)." kph )";
                if( $this->start )
                {
                        $s .= "[". intval($this->start->distance - $this->piece_start->distance)." -> ".intval($this->end->distance - $this->piece_start->distance)."]";
                        $s .= "IDS: ".$this->start->id." --> ".$this->end->id. " Distance = ". ($this->end->distance - $this->start->distance)." meters";
                }
                return $s;
        }
}

function addPiecesToDB( $outing_id, $pieces, $mysqli )
{
    foreach( $pieces as $p )
    {
        $query = "INSERT INTO Pieces ( outing_id, trackpoint_start, trackpoint_end, min_longitude, max_longitude, min_latitude, max_latitude, duration, distance, downstream ) VALUES ";
        $query .= "( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        if( $stmt = $mysqli->prepare($query))
        {
                $stmt->bind_param( "ssssssssss", $outing_id, $p->start->id, $p->end->id, $p->min_longitude, $p->max_longitude, $p->min_latitude, $p->max_latitude, $p->duration, $p->distance, $p->downstream);
                $stmt->execute();
                $stmt->close();
                $piece_id = $mysqli->insert_id;
                $query = "INSERT INTO PBs(piece_id, distance, start_point, end_point, duration, projected, min_speed, max_speed) VALUES ";
                $query_args_types = "";
                $query_args = array();
                $first = 1;
                foreach($p->PBs as $pb)
                {
                    if($first)
                    {
                        $first = 0;
                    }
                    else
                        $query .=", ";
                    $query .= "(?, ?, ?, ?, ?, ?, ?, ?)";
                    $query_args_types .= "ssssssss";
                    $query_args []= $piece_id;
                    $query_args []= $pb->distance;
                    $query_args []= $pb->start->id;
                    $query_args []= $pb->end->id;
                    $query_args []= $pb->time;
                    $query_args []= $pb->projected;
                    $query_args []= $pb->min_speed;
                    $query_args []= $pb->max_speed;

                }
                if( ! $first )
                {
                    if( $stmt = $mysqli->prepare($query))
                    {
                            $args = array();
                            $args []= & $query_args_types;

                            for( $i=0; $i < count($query_args); $i++)
                            {
                                    $args[]= & $query_args[$i];
                            }
                            call_user_func_array( array($stmt,'bind_param'), $args );
                            $stmt->execute();
                            $stmt->close();
                    }
                    else die("Statement failed: ". $mysqli->error . "<br>");
                }
        }
        else die("Statement failed: ". $mysqli->error . "<br>");
    }
}

class Piece
{
        public $start = NULL;
        public $end = NULL;
        public $duration = 0;
        public $distance = 0.0;
        public $PBs = array();
        public $min_longitude;
        public $max_longitude;
        public $min_latitude;
        public $max_latitude;
        public $downstream = 1;
        // TODO Read from database
        public $min_duration = 20.0;

        function process($pb_distances, $longitude_coeff, $latitude_coeff)
        {
                //TODO: Adjust start
                $this->duration = intval( $this->end->time - $this->start->time );
                if( $this->duration < $this->min_duration )
                {
                        return false;
                }
                $this->distance = intval($this->end->distance - $this->start->distance );
                foreach( $pb_distances as $pb )
                {
                        $this->PBs[]= new PB($this->start, $this->end, $pb);
                }
                $this->min_latitude = $this->start->latitude;
                $this->max_latitude = $this->start->latitude;
                $this->min_longitude = $this->start->longitude;
                $this->max_longitude = $this->start->longitude;
                $pt = $this->start;
                while( $pt != $this->end->next )
                {
                    if( $pt->latitude < $this->min_latitude )
                    {
                        $this->min_latitude = $pt->latitude;
                    }elseif( $pt->latitude > $this->max_latitude )
                    {
                        $this->max_latitude = $pt->latitude;
                    }
                    if( $pt->longitude < $this->min_longitude )
                    {
                        $this->min_longitude = $pt->longitude;
                    }elseif( $pt->longitude > $this->max_longitude )
                    {
                        $this->max_longitude = $pt->longitude;
                    }
                    $pt = $pt->next;
                }
                $this->downstream = 0 < (($this->end->latitude - $this->start->latitude) * $latitude_coeff + ($this->end->longitude - $this->start->longitude)* $longitude_coeff);
                return true;
        }
        function str()
        {
                $s = "";
                $s .= "Start ". number_format(0.001 * $this->start->distance,2). " End ".number_format(0.001 * $this->end->distance, 2 )." km<br/>";
                //$s .= $this->start->id." --> ".$this->end->id."<br/>";
                $s .= "Duration : ". timeStr($this->duration)." Length ".$this->distance." meters<br/>";
                $s .= "Downstream = ".$this->downstream." Delta lat : ". ($this->end->latitude - $this->start->latitude)." long: ".($this->end->longitude - $this->start->longitude)."<br/>";
                foreach($this->PBs as $pb)
                {
                        $s .= $pb->str()."<br/>";
                }
                return $s;
        }
}

function getCrewInfo( $crew_id, $mysqli )
{
        $res = $mysqli->query("SELECT * from Crews WHERE id = ".$crew_id);
        return $res->fetch_array(MYSQLI_ASSOC);
}

function getPBDistances( $mysqli )
{
    $distances = array();
    $res = $mysqli->query("SELECT * from PBDistances");
    if(!$res)
            die("ERROR : ".$mysqli->error."<br/>");

    while ($row = $res->fetch_array(MYSQLI_ASSOC)) 
    {
        $distances []= $row['distance'];
    }
    return $distances;
}

function generate_pbs( $outing_id, $crew_id, $mysqli, $flow_direction )
{
    $pb_distances = getPBDistances( $mysqli );
    $crew = getCrewInfo( $crew_id, $mysqli );
    $tmp_dir = explode(",", $flow_direction );
    if( count($tmp_dir) < 2 )
    {
        die("ERROR: flowDirection is invalid<br/>");
        return;
    }

    $res = $mysqli->query("SELECT * from TrackPoints WHERE outing_id = ".$outing_id);
    if(!$res)
            die("ERROR : ".$mysqli->error."<br/>");
    //$res = $mysqli->query($_POST['query']);

    $points = array();
    $prev = NULL;
    while ($row = $res->fetch_array(MYSQLI_ASSOC)) 
    {
            $point = new Point( $prev, $row["distance"], $row["date"], $row["time"], $row["speed"], $row["id"], $row["longitude"], $row["latitude"]);
            $points[] = $point;
            $prev = $point;
    }
    //echo count($points)."<br/>";
    $pieces = array();
    $piece = NULL;
    $stop = NULL;
    foreach( $points as $p )
    {
            if( ! $piece ) // Not currently doing a piece
            {
                    if( $p->speed > floatval($crew['start_threshold'])) // Are we going fast enough to start a piece ?
                    {
                            $piece = new Piece();
                            $piece->start = $p;
                    }
            }
            else // Doing a piece
            {
                    if( $p->speed < floatval($crew['end_threshold'])) // Is it the end of the piece ?
                    {
                            if( !$stop )
                            {
                                    $stop = $p;
                            }
                            else
                            {
                                    $piece->end = $stop;
                                    if( $piece->process($pb_distances, $tmp_dir[0], $tmp_dir[1]) )
                                    {
                                            $pieces[]= $piece;
                                    }
                                    $piece = NULL;
                            }
                    }
                    else
                    {
                            $stop = NULL;
                    }
            }
    }
    addPiecesToDB( $outing_id, $pieces, $mysqli );

    foreach( $pieces as $p )
    {
            echo $p->str()."<br/>";
    }

    //FIXME: Re-enable once testing is finished
  // header("Location: rowing_stats.html");
}
?>

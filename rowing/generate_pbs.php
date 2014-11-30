<?php

include('db_connection.php');

// TODO Read from database
$start_speed = 13.0;
// TODO Read from database
$stop_speed = 10.0;

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

        function __construct( $prev, $distance, $date, $time, $speed, $id )
        {
                $this->prev = $prev;
                $this->distance = $distance;
                $this->date = $date;
                $this->time = $time;
                $this->id = $id;
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
        function __construct( $start, $end, $distance )
        {
                $this->piece_start = $start;
                $this->distance = $distance;
                if( $end->distance - $start->distance < $distance ) // If the piece is too short: calculate the projected finish time
                {
                        $this->time = ($end->time - $start->time) * $distance / ($end->distance - $start->distance);
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

class Piece
{
        public $start = NULL;
        public $end = NULL;
        public $duration = 0;
        public $distance = 0.0;
        public $PBs = array();
        // TODO Read from database
        public $min_duration = 20.0;
        // TODO Read from database
        public $pb_distances = [ 50, 100, 200, 500, 900, 1000, 2000, 2900, 3000, 4000 ];

        function process()
        {
                //TODO: Adjust start
                $this->duration = intval( $this->end->time - $this->start->time );
                if( $this->duration < $this->min_duration )
                {
                        return false;
                }
                $this->distance = intval($this->end->distance - $this->start->distance );
                foreach( $this->pb_distances as $pb )
                {
                        $this->PBs[]= new PB($this->start, $this->end, $pb);
                }
                return true;
        }
        function str()
        {
                $s = "";
                $s .= "Start ". number_format(0.001 * $this->start->distance,2). " End ".number_format(0.001 * $this->end->distance, 2 )." km<br/>";
                //$s .= $this->start->id." --> ".$this->end->id."<br/>";
                /* TODO: Altitude doesn't work, remove it
                if( $this->start->altitude > $this->end->altitude )
                {
                        $s .= "Going downstream";
                }
                else
                {
                        $s .= "Going upstream";
                }
                $s .= "Start ".$this->start->altitude." End : ". $this->end->altitude."<br/>";
                 */
                $s .= "Duration : ". timeStr($this->duration)." Length ".$this->distance." meters<br/>";
                foreach($this->PBs as $pb)
                {
                        $s .= $pb->str()."<br/>";
                }
                return $s;
        }
}

$res = $mysqli->query("SELECT * from TrackPoints WHERE outing_id = 23");
if(!$res)
        die("ERROR : ".$mysqli->error."<br/>");
//$res = $mysqli->query($_POST['query']);

$points = array();
$prev = NULL;
while ($row = $res->fetch_array(MYSQLI_ASSOC)) 
{
        $point = new Point( $prev, $row["distance"], $row["date"], $row["time"], $row["speed"], $row["id"]);
        $points[] = $point;
        $prev = $point;
}
echo count($points)."<br/>";
$pieces = array();
$piece = NULL;
$stop = NULL;
foreach( $points as $p )
{
        if( ! $piece ) // Not currently doing a piece
        {
                if( $p->speed > $start_speed ) // Are we going fast enough to start a piece ?
                {
                        $piece = new Piece();
                        $piece->start = $p;
                }
        }
        else // Doing a piece
        {
                if( $p->speed < $stop_speed ) // Is it the end of the piece ?
                {
                        if( !$stop )
                        {
                                $stop = $p;
                        }
                        else
                        {
                                $piece->end = $stop;
                                if( $piece->process() )
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

foreach( $pieces as $p )
{
        echo $p->str()."<br/>";
}
?>

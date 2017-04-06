<?php
$time_pre = microtime(true);
/* POST:Array ( ) FILES : Array ( [uploadedfile] => Array ( [name] => 
        * 20141101-101519.tcx [type] => application/octet-stream [tmp_name] => 
        * /tmp/phpQynBjb [error] => 0 [size] => 586519 ) )
print_r($_REQUEST);
echo "<br/>POST:";
print_r($_POST);
echo "<br/>FILES : ";
        print_r($_FILES);
echo "<br/>";
 * */

$target_dir = "data/tcx/";
$filename = $_FILES["uploadedfile"]["name"];
$tmp_filename = $_FILES["uploadedfile"]["tmp_name"];
$target_file= $target_dir . basename( $filename );
$uploader = $_POST['UploaderSelect'];

include('db_connection.php');
include('generate_pbs.php');
/**
 * Calculates the great-circle distance between two points, with
 * the Haversine formula.
 * @param float $latitudeFrom Latitude of start point in [deg decimal]
 * @param float $longitudeFrom Longitude of start point in [deg decimal]
 * @param float $latitudeTo Latitude of target point in [deg decimal]
 * @param float $longitudeTo Longitude of target point in [deg decimal]
 * @param float $earthRadius Mean earth radius in [m]
 * @return float Distance between points in [m] (same as earthRadius)
 */
function calculate_distance(
  $latitudeFrom, $longitudeFrom, $latitudeTo, $longitudeTo, $earthRadius = 6371000)
{
  // convert from degrees to radians
  $latFrom = deg2rad($latitudeFrom);
  $lonFrom = deg2rad($longitudeFrom);
  $latTo = deg2rad($latitudeTo);
  $lonTo = deg2rad($longitudeTo);

  $latDelta = $latTo - $latFrom;
  $lonDelta = $lonTo - $lonFrom;

  $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
    cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
  return $angle * $earthRadius;
}

function convertTime( $str )
{

	$time = strtotime($str);
	date_default_timezone_set("Europe/London");
	return date("Y-m-d H:i:s", $time);
}
function getBoatInfo( $boat_id, $mysqli )
{
        $res = $mysqli->query("SELECT * from Boats WHERE id = ".$boat_id);
        return db_fetch_array($res);
}

function createOutingRecord( $mysqli, $date )
{
	$tmp_boat = explode( ",", $_POST['boat'] );
	if( count($tmp_boat) < 3 )
	{
		die("ERROR: boat_id invalid<br/>");
		return;
	}
	$values = array();

	$boat = getBoatInfo( $tmp_boat[2], $mysqli);
	$values['boat_id'] = $boat['id'];
	$values['crew_id'] = $_POST['crewSelect'];
	$title = $_POST['title'];
	$location = $_POST['location'];

	if( $boat['num_rowers'] == 1 )
	{
		if( $_POST['UploaderSelect'])
			$values["rower1"] = $_POST['UploaderSelect'];
	}
	else
	{
		if( $_POST['StrokeSelect'])
			$values["rower1"] = $_POST['StrokeSelect'];
	}

	for( $i=2; $i < $boat['num_rowers'] ; $i++ )
	{
		if( $_POST[$i.'Select'])
			$values["rower".$i] = $_POST[$i.'Select'];
	}

	if( $boat['num_rowers'] > 1 )
	{
		if($_POST['BowSelect'])
			$values["rower".$boat['num_rowers']] = $_POST['BowSelect'];
	}

	if( $_POST['CoachSelect'] )
	{
		$values['coach'] = $_POST['CoachSelect'];
	}

	if( $boat['cox'] == 1 && $_POST['CoxSelect'])
	{
		$values['cox'] = $_POST['CoxSelect'];
	}

	//http://www.wikihow.com/Prevent-SQL-Injection-in-PHP
	$stmt = db_execute_query_params("INSERT INTO Outings (title, location, date,".implode(",",array_keys($values)).") VALUES ( ?, ?, ?,".implode(",",array_values($values)).")","sss", [$title, $location, $date]);
	if( !$stmt->execute() )
	{
		die("Statement failed [Line ".__LINE__."]: ". db_error() . "<br>");
	}
	$stmt->close();

	return db_last_insert_id();
}

function getNodeText( $node, $name )
{
	$n = $node->getElementsByTagName( $name )->item(0);
	if($n)
		return $n->nodeValue;
	else
		return "";
}
function getNode( $node, $name )
{
	return $node->getElementsByTagName( $name )->item(0);
}

/* FIXME: Re-enable once testing is over 
if (file_exists($target_file))
{
    die("Sorry, file '". basename($filename)."' already exists.<br/>");
}
else
*/
{
	if (move_uploaded_file($tmp_filename, $target_file))
	{
		echo "The file ". basename( $filename ). " has been uploaded.<br/>";
		$dom = new DOMDocument();
		$dom->load( $target_file); 
		//$date = convertTime( getNodeText($dom, "Id") );
		$date = convertTime( getNodeText($dom, "time") );
		$outing_id = createOutingRecord( $mysqli, $date );

		//$points = $dom->getElementsByTagName("Trackpoint");
		$points = $dom->getElementsByTagName("trkpt");
		$start_time = 0.0;
		$first =1;
		$prev_time = 0.0;
		$distance = 0.0;
		$prev_lat = 0.0;
		$prev_lon = 0.0;
		$query = "INSERT INTO TrackPoints ( outing_id, longitude, latitude, distance, date, time, speed) VALUES ";
		$query_args_types = "";
		$query_args = array();
		$hr_values = array();
		$num=0;
		foreach( $points as $pt )
		{
			$time = 0.0;
			$speed = 0.0;
			//$dateStr =  getNodeText($pt, "Time" );
			$dateStr =  getNodeText($pt, "time" );
			/*
			$pos = getNode( $pt, "Position");
			if( $pos )
			{
				$latStr = getNodeText( $pos, "LatitudeDegrees" );
				$lonStr = getNodeText( $pos, "LongitudeDegrees" );
			}
			*/
			$latStr = getAttributeText( $pt, "lat" );
			$lonStr = getAttributeText( $pt, "lon" );
			//$distance = getNodeText( $pt, "DistanceMeters");
			//$hr = getNode( $pt, "HeartRateBpm");
			/*$hrStr = "";
			if( $hr )
			{
				$hrStr = getNodeText( $hr, "Value");
			}*/
			$hr_values[] = $hrStr;
			if( $first )
			{
				$start_time = strtotime($dateStr);
				$first = 0;
				$query .= "($outing_id, ?, ?, ?, ?, $time, $speed)";
			}
			else
			{
				$delta = calculate_distance($prev_lat, $prev_lon, $latStr, $lonStr);
				$distance += $delta;
				$time = strtotime($dateStr) - $start_time;
				$speed = $delta / ($time - $prev_time);
				if($num != 0 )
					$query .=", ";
				$query .= "($outing_id, ?, ?, ?, ?, $time, $speed)";
			}
			$query_args_types .= "ssss";
			$query_args []= $lonStr;
			$query_args []= $latStr;
			$query_args []= $distance;
			$query_args []= convertTime($dateStr);

			$prev_time = $time;
			$prev_lon = $lonStr;
			$prev_lat = $latStr;

			$num++;
			if($num > 50)
			{
				$stmt = db_execute_query_params($query, $query_args_types, $query_args);
				$stmt->execute() or die( __LINE__." : ".$mysqli->lastErrorMsg()."<br/>");
				$stmt->close();
				$query = "INSERT INTO TrackPoints ( outing_id, longitude, latitude, distance, date, time, speed) VALUES ";
				$query_args_types = "";
				$query_args = array();
				$num=0;
			}
		}
		if($num > 0 )
		{
			$stmt = db_execute_query_params($query, $query_args_types, $query_args);
			$stmt->execute() or die( __LINE__." : ".$mysqli->lastErrorMsg()."<br/>");
			$stmt->close();
		}

		/*
		$trackpoint_id = db_last_insert_id();//FIXME ?
		$query = "";
		$query_args_types = "";
		$query_args = array();
		foreach( $hr_values as $hr )
		{
			if( $hr != "" )
			{
				if( $query == "")
				{
					$query = "INSERT INTO PersonalTrackPoints ( rower_id, trackpoint_id, HR ) VALUES (? , ? , ?)";
				}
				else
				{
					$query .= ", ( ?, ?, ? )";
				}
				$query_args_types .= "iii";
				$query_args []= $uploader;
				$query_args []= $trackpoint_id;
				$query_args []= $hr;
			}
			$trackpoint_id++;
		}
		if( $query != "")
		{
			$stmt = db_execute_query_params( $query, $query_args_types, $query_args);
			$stmt->execute() or die( __LINE__." : ".$stmt->error."<br/>");
			$stmt->close();
		}
		 */
		generate_pbs($outing_id, $_POST['crewSelect'], $mysqli, $_POST['flowDirection']);
	}
	else
	{
		die("Sorry, there was an error uploading your file '".basename($filename)."'<br/>");
	}
}
$time_post = microtime(true);
$exec_time = $time_post - $time_pre;
//echo "<br/>$exec_time<br/>";
?>

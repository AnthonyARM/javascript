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
		$date = convertTime( getNodeText($dom, "Id") );
		$outing_id = createOutingRecord( $mysqli, $date );

		$points = $dom->getElementsByTagName("Trackpoint");
		$start_time = 0.0;
		$first =1;
		$prev_time = 0.0;
		$query = "INSERT INTO TrackPoints ( outing_id, longitude, latitude, distance, date, time, speed) VALUES ";
		$query_args_types = "";
		$query_args = array();
		$hr_values = array();
		$num=0;
		foreach( $points as $pt )
		{
			$time = 0.0;
			$speed = 0.0;
			$dateStr =  getNodeText($pt, "Time" );
			$pos = getNode( $pt, "Position");
			if( $pos )
			{
				$latStr = getNodeText( $pos, "LatitudeDegrees" );
				$lonStr = getNodeText( $pos, "LongitudeDegrees" );
			}
			$distance = getNodeText( $pt, "DistanceMeters");
			$hr = getNode( $pt, "HeartRateBpm");
			$hrStr = "";
			if( $hr )
			{
				$hrStr = getNodeText( $hr, "Value");
			}
			$hr_values[] = $hrStr;
			if( $first )
			{
				$start_time = strtotime($dateStr);
				$first = 0;
				$query .= "($outing_id, ?, ?, ?, ?, $time, $speed)";
			}
			else
			{
				$time = strtotime($dateStr) - $start_time;
				$speed = ( $distance - $prev_distance ) / ($time - $prev_time);
				$query .= ", ($outing_id, ?, ?, ?, ?, $time, $speed)";
			}
			$distance = strlen($distance) ? $distance : $prev_distance;
			$query_args_types .= "ssss";
			$query_args []= $lonStr;
			$query_args []= $latStr;
			$query_args []= $distance;
			$query_args []= convertTime($dateStr);

			$prev_time = $time;
			$prev_distance = $distance;
			$num++;
			if($num > 50)
			{
				$stmt = db_execute_query_params($query, $query_args_types, $query_args);
				$stmt->execute() or die( __LINE__." : ".$stmt->error."<br/>");
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
			$stmt->execute() or die( __LINE__." : ".$stmt->error."<br/>");
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

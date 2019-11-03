<?php
$target_dir = "data/tcx/";
$target_dir = $target_dir . basename( $_FILES["uploadFile"]["name"]);
$uploadOk=1;

/*
if (file_exists($target_dir . $_FILES["uploadFile"]["name"]))
{
	echo "Sorry, file already exists.";
	$uploadOk = 0;
}
 */

function getNodeText( $node, $name )
{
	return $node->getElementsByTagName( $name )->item(0)->nodeValue;
}
function getNode( $node, $name )
{
	return $node->getElementsByTagName( $name )->item(0);
}

if( $uploadOk != 0 )
{
	if (move_uploaded_file($_FILES["uploadFile"]["tmp_name"], $target_dir))
	{
		echo "The file ". basename( $_FILES["uploadFile"]["name"]). " has been uploaded.<br/>";

		$dom = new DOMDocument();
		$dom->load( $target_dir ); 
		$points = $dom->getElementsByTagName("Trackpoint");
		foreach( $points as $pt )
		{
			$dateStr =  getNodeText($pt, "Time" );
			$pos = getNode( $pt, "Position");
			$latStr = getNodeText( $pos, "LatitudeDegrees" );
			$lonStr = getNodeText( $pos, "LongitudeDegrees" );
			$distStr = getNodeText( $pt, "DistanceMeters");
			$hr = getNode( $pt, "HeartRateBpm");
			$hrStr = "";
			if( $hr )
			{
				$hrStr = getNodeText( $hr, "Value");
			}
			echo "Date : $dateStr  Latitude  $latStr  Longitude  $lonStr  Distance  $distStr  HR  $hrStr <br/>";
			// TODO: Calculate time (store)
			// Calculate speed (Only for piece finding)
		}
	}
	else
	{
		echo "Sorry, there was an error uploading your file.";
	}
}
?>

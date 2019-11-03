<?php

$mysqli = new mysqli("localhost", "rowing", "radegund", "rowing_stats");
if($mysqli->connect_errno)
{
	echo "Failed to connect to MySQL: ".$mysqli->connect_error;
}

$res = $mysqli->query("SELECT * from Rowers");

$json = array();
while ($row = $res->fetch_array(MYSQLI_ASSOC)) 
{
	array_push($json, $row);
	echo "Name : ".$row['firstName']." Side: ".$row['side'];
	if( $row['cox'] == '1' )
		echo " Is a cox";
	else
		echo " Is not a cox";
	echo "<br/>";
}
echo json_encode($json);
?>

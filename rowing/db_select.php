<?php

include('db_connection.php');

//$res = $mysqli->query("SELECT * from Rowers");
$res = $mysqli->query($_POST['query']);

$json = array();
while ($row = $res->fetch_array(MYSQLI_ASSOC)) 
{
	array_push($json, $row);
}
echo json_encode($json);
?>

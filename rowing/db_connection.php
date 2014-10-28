<?php

$mysqli = new mysqli("localhost", "rowing", "radegund", "rowing_stats");
if($mysqli->connect_errno)
{
	echo "Failed to connect to MySQL: ".$mysqli->connect_error;
}

?>

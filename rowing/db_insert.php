<?php

include('db_connection.php');
include('generate_pbs.php');

function validate_column_name( $column, $table )
{
    $stmt = db_execute_query_params("SELECT COUNT(column_name) FROM information_schema.columns WHERE table_name = ? AND column_name = ? AND table_schema='rowing_stats' ","ss", [$table, $column]);
    if( ! $stmt->execute() )
    {
            echo "ERROR: SQL Request execution failed: (". $stmt->errno .") ". $stmt->error."<br/>";
            return -1;
    }

    $stmt->store_result();

    if( ! $stmt->num_rows)
    {
        echo "ERROR: Field '".$column."' does not belong to table '".$table."'<br/>";
        return 0;
    }
    return 1;

}
function create_custom_piece()
{
	global $_POST;
	global $mysqli;
	return add_custom_piece($_POST['piece_id'], $_POST['start'], $_POST['end'], $mysqli);
}

function new_crew()
{
        global $_POST;
        return db_execute_query_params("INSERT INTO Crews(name,start_threshold,end_threshold) VALUES (?,?,?)", "sdd", [ $_POST['name'], floatval($_POST['start_speed']), floatval($_POST['end_speed'])]);
}

function delete_crew()
{
        global $_POST;
        return db_execute_query_params("DELETE FROM Crews where id = ?", "d", [ $_POST['id']]);
}

function delete_piece()
{
        global $_POST;
        return db_delete_piece($_POST['id']);
}

function update_crew()
{
        global $_POST;
        /*if( ! validate_column_name( $_POST['field'], "Crews") )
        {
            return null;
        }
         */
        $type = "s";
        $value = $_POST['value'];
        if( $_POST['field'] != "name")
        {
            $type = "d";
            $value = floatval($value);
        }
        return db_execute_query_params("UPDATE Crews SET ".$_POST['field']."=? where id = ?", $type."s", [ $value,$_POST['id']]);
}

$requests = array (
        "new_crew" => function() { return new_crew(); },
        "delete_crew" => function() { return delete_crew(); },
        "delete_piece" => function() { return delete_piece(); },
        "update_crew" => function() { return update_crew(); },
);

if( array_key_exists( $_POST['query'], $requests ) )
{
        $stmt = $requests[ $_POST['query'] ]();

        if( ! $stmt->execute() )
        {
                echo "ERROR: SQL Request execution failed: ".db_error()."<br/>";
        }
		$stmt->close();
        echo db_last_insert_id();
}
elseif( $_POST['query'] == "create_custom_piece"){
	create_custom_piece();
}
else
        echo "ERROR: Unknown query '".$_POST['query']."'<br/>";
?>

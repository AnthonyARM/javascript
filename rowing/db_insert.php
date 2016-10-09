<?php

include('db_connection.php');

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
function new_crew()
{
        global $_POST;
        return db_execute_query_params("INSERT INTO Crews(name,start_threshold,end_threshold) VALUES (?,?,?)", "sdd", [ $_POST['name'], $_POST['start_speed'], $_POST['end_speed']]);
}

function delete_crew()
{
        global $_POST;
        return db_execute_query_params("DELETE FROM Crews where id = ?", "d", [ $_POST['id']]);
}

function update_crew()
{
        global $_POST;
        /*if( ! validate_column_name( $_POST['field'], "Crews") )
        {
            return null;
        }
		 */
        return db_execute_query_params("UPDATE Crews SET ".$_POST['field']."=? where id = ?", "si", [ $_POST['value'],$_POST['id']]);
}

$requests = array (
        "new_crew" => function() { return new_crew(); },
        "delete_crew" => function() { return delete_crew(); },
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
else
        echo "ERROR: Unknown query '".$_POST['query']."'<br/>";
?>

<?php

include('db_connection.php');

function execute_query( $query, $query_args_types, $query_args )
{
        global $mysqli;
        if(! ($stmt = $mysqli->prepare($query)))
        {
                echo "ERROR: SQL Request preparation failed: (". $mysqli->errno .") ". $mysqli->error."<br/>";
        }
        $args = array();
        $args []= & $query_args_types;

        for( $i=0; $i < count($query_args); $i++)
        {
                $args[]= & $query_args[$i];
        }
        if( !call_user_func_array( array($stmt,'bind_param'), $args ))
        {
                echo "ERROR: SQL Request bind_param failed: (". $stmt->errno .") ". $stmt->error."<br/>";
        }
        return $stmt;
}

function validate_column_name( $column, $table )
{
    $stmt = execute_query("SELECT COUNT(column_name) FROM information_schema.columns WHERE table_name = ? AND column_name = ? AND table_schema='rowing_stats' ","ss", [$table, $column]);
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
        return execute_query("INSERT INTO Crews(name,start_threshold,end_threshold) VALUES (?,?,?)", "sdd", [ $_POST['name'], $_POST['start_speed'], $_POST['end_speed']]);
}

function delete_crew()
{
        global $_POST;
        return execute_query("DELETE FROM Crews where id = ?", "d", [ $_POST['id']]);
}

function update_crew()
{
        global $_POST;
        if( ! validate_column_name( $_POST['field'], "Crews") )
        {
            return null;
        }
        return execute_query("UPDATE Crews SET ".$_POST['field']."=? where id = ?", "sd", [ $_POST['value'],$_POST['id']]);
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
                echo "ERROR: SQL Request execution failed: (". $stmt->errno .") ". $stmt->error."<br/>";
        }
        echo mysqli_insert_id( $mysqli );
}
else
        echo "ERROR: Unknown query '".$_POST['query']."'<br/>";
?>

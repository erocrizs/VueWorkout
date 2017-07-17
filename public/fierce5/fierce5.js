let initiateFierce5 = function() {

    f5_a_codes.forEach( (superset) => {
        superset.forEach( (exercise) => {
            exercise[ "detail" ] = exercise_db[ exercise["code"] ];
        } );
    } );

    f5_b_codes.forEach( (superset) => {
        superset.forEach( (exercise) => {
            exercise[ "detail" ] = exercise_db[ exercise["code"] ];
        } );
    } );

    let workoutA = new Vue({
        el: '#workoutA',
        data: {
            routine: f5_a_codes
        }
    });

    let workoutB = new Vue({
        el: '#workoutB',
        data: {
            routine: f5_b_codes
        }
    });

};
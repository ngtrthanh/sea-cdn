// chart.js

let aircraftCount = 0;

google.charts.load('current', {'packages':['gauge']});
google.charts.setOnLoadCallback(() => {
    drawChart(aircraftCount); // Pass the initial aircraftCount value
});


// Define a variable to store the previous aircraft count
let prevAircraftCount = 0;

function drawChart(aircraftCount) { // Accept aircraftCount as a parameter
    if (aircraftCount === null || aircraftCount === undefined) {
        aircraftCount = 0; // Or any other default value you want to use
    }
    var data = google.visualization.arrayToDataTable([
        ['Label', 'Value'], // Column headers
        ['aircraft', aircraftCount] // Data rows
    ]);
    //console.log(google.visualization)    
    
    const maxr = 10000;

    var options = {
        width: 120,
        height: 120,
        greenFrom: maxr * 4 / 8, greenTo: maxr * 5 / 8, // Change the range for green color
        redFrom: maxr * 7 / 8, redTo: maxr, // Change the range for red color
        yellowFrom: maxr * 5 / 8, yellowTo: maxr * 7 / 8, // Change the range for yellow color
        min: 0, max: maxr, // Adjust the maximum value
        minorTicks: 4
    };

    var formatter = new google.visualization.NumberFormat({
        fractionDigits: 0
    });

    formatter.format(data, 1);

    var chart = new google.visualization.Gauge(document.getElementById('chart_div'));

    chart.draw(data, options);

    function updateMsgRate() {
        // Calculate the difference between the new and previous values
        var diff = aircraftCount - prevAircraftCount;
        // Incrementally update the value with the difference
        var newValue = data.getValue(0, 1) + diff;
        // Update the gauge value
        data.setValue(0, 1, newValue);
        formatter.format(data, 1);
        chart.draw(data, options);
        // Update the previous value for the next iteration
        prevAircraftCount = aircraftCount;
    }

    setInterval(updateMsgRate, 2000);
}

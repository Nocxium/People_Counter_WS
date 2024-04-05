document.addEventListener('DOMContentLoaded', function () {
    flatpickr('#datetime', {
        enableTime: true,
        dateFormat: 'Y-m-d H:i',
        minDate: '2024-03-18',
        maxDate: '2024-03-20',
        time_24hr: true,
        minTime: '09:00',
        maxTime: '22:00'
    });

    document.getElementById('queryData').addEventListener('click', function () {
        const datetime = document.getElementById('datetime').value;

        fetch('http://localhost:3000/api/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ datetime }),
        })
        .then(response => response.json())
        .then(data => {
            var chartData = data.map(item => ({
                x: item.client_id,
                value: item.net_ins
            }));

            anychart.onDocumentReady(function () {
                document.getElementById('chartContainer').innerHTML = '';
                var chart = anychart.column(chartData);
                chart.title('Cumulative people count by floor up to selected time');
                chart.xAxis().title('Floor');
                chart.yAxis().title('Total number of people');
                chart.container('chartContainer');
                chart.draw();
            });
        })
        .catch(error => console.error('Error:', error));
    });
});

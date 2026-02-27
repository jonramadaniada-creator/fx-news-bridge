<!DOCTYPE html>
<html>
<head>
    <title>Data Only</title>
</head>
<body>

    <div id="countdown-label">Next High Impact: Loading...</div>
    <div id="timer-display">00:00:00</div>

    <hr>

    <table border="1" id="newsTable">
        <thead>
            <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Currency</th>
                <th>Event</th>
                <th>Impact</th>
            </tr>
        </thead>
        <tbody></tbody>
    </table>

    <script>
        async function getNews() {
            try {
                const response = await fetch('https://news-7bvm.onrender.com/news');
                const data = await response.json();
                
                const tableBody = document.querySelector('#newsTable tbody');
                let highImpactEvents = [];

                // 1. Fill the table with raw data
                data.forEach(event => {
                    const row = `<tr>
                        <td>${event.date}</td>
                        <td>${event.time}</td>
                        <td>${event.country}</td>
                        <td>${event.title}</td>
                        <td>${event.impact}</td>
                    </tr>`;
                    tableBody.innerHTML += row;

                    // 2. Filter for future High Impact news
                    if (event.impact && event.impact.toLowerCase() === 'high') {
                        const eventTime = new Date(`${event.date} ${event.time} EST`);
                        if (eventTime > new Date()) {
                            highImpactEvents.push({ title: event.title, time: eventTime });
                        }
                    }
                });

                // 3. Start timer if high impact news exists
                if (highImpactEvents.length > 0) {
                    runTimer(highImpactEvents[0]);
                }

            } catch (err) {
                console.error("Data Fetch Error:", err);
                document.getElementById('countdown-label').innerText = "Server waking up...";
            }
        }

        function runTimer(event) {
            const timerDisplay = document.getElementById('timer-display');
            const label = document.getElementById('countdown-label');
            
            label.innerText = `Next High Impact: ${event.title}`;

            setInterval(() => {
                const now = new Date().getTime();
                const distance = event.time - now;

                const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((distance % (1000 * 60)) / 1000);

                timerDisplay.innerText = `${h}h ${m}m ${s}s`;

                if (distance < 0) {
                    timerDisplay.innerText = "LIVE";
                }
            }, 1000);
        }

        getNews();
    </script>
</body>
</html>

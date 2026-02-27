const express = require('express');
const xml2js = require('xml2js');
const cors = require('cors');

const app = express();
app.use(cors());

// Internal memory - starts as an empty list to prevent crashes
let cachedNews = [];
let lastUpdate = 0;
const ONE_HOUR = 60 * 60 * 1000;

app.get('/news', async (req, res) => {
    const now = Date.now();

    // 1. If we have data from the last hour, use it immediately
    if (cachedNews.length > 0 && (now - lastUpdate < ONE_HOUR)) {
        return res.json(cachedNews);
    }

    try {
        const ff_url = 'https://nfs.faireconomy.media/ff_calendar_thisweek.xml';
        const response = await fetch(ff_url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0' }
        });

        // 2. If blocked (429), just send back what we have in memory
        if (!response.ok) {
            console.log("Forex Factory busy/blocked. Status:", response.status);
            return res.json(cachedNews);
        }

        const xml = await response.text();
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xml);

        // 3. Store the successful data
        if (result && result.weeklyevents && result.weeklyevents.event) {
            cachedNews = result.weeklyevents.event;
            lastUpdate = now;
        }

        res.json(cachedNews);

    } catch (err) {
        console.error("Internal Error:", err.message);
        // 4. EMERGENCY FALLBACK: Never return a 500. Return a list.
        res.json(cachedNews.length > 0 ? cachedNews : [{ title: "Server Warming Up", impact: "Low", date: "Today", time: "Now" }]);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

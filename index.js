const express = require('express');
const xml2js = require('xml2js');
const cors = require('cors');

const app = express();
app.use(cors());

// Internal Storage (Cache)
let cachedData = []; 
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 Hour

app.get('/news', async (req, res) => {
    const currentTime = Date.now();

    // 1. If we have fresh cache, use it immediately
    if (cachedData.length > 0 && (currentTime - lastFetchTime < CACHE_DURATION)) {
        return res.json(cachedData);
    }

    try {
        const url = 'https://nfs.faireconomy.media/ff_calendar_thisweek.xml';
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0' }
        });

        // 2. If Forex Factory blocks us (429 or 403), don't crash!
        if (!response.ok) {
            console.log(`Forex Factory status: ${response.status}. Using cache.`);
            return res.json(cachedData); 
        }

        const xmlData = await response.text();
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);

        // 3. Update cache and timestamp
        if (result.weeklyevents && result.weeklyevents.event) {
            cachedData = result.weeklyevents.event;
            lastFetchTime = currentTime;
        }

        res.json(cachedData);

    } catch (error) {
        console.error("Server Error:", error.message);
        // 4. Send whatever we have (even if empty) to prevent 500 error
        res.json(cachedData || []);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));

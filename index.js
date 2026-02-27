const express = require('express');
const xml2js = require('xml2js');
const cors = require('cors');

const app = express();
app.use(cors());

// --- CACHE VARIABLES ---
let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

app.get('/news', async (req, res) => {
    const currentTime = Date.now();

    // Check if we have data AND if it's less than 30 minutes old
    if (cachedData && (currentTime - lastFetchTime < CACHE_DURATION)) {
        console.log("Serving from Cache (No request sent to Forex Factory)");
        return res.json(cachedData);
    }

    try {
        console.log("Cache expired or empty. Fetching fresh data from Forex Factory...");

        const url = 'https://nfs.faireconomy.media/ff_calendar_thisweek.xml';
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        if (!response.ok) throw new Error(`Blocked: ${response.status}`);

        const xmlData = await response.text();
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);

        // Save the results to our cache
        cachedData = result.weeklyevents.event;
        lastFetchTime = currentTime;

        res.json(cachedData);

    } catch (error) {
        console.error("Error:", error.message);
        
        // If the fetch fails but we have OLD data, show the old data instead of an error
        if (cachedData) {
            console.log("Fetch failed, serving stale cache as backup.");
            return res.json(cachedData);
        }

        res.status(500).json({ error: "Data feed unavailable", details: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/news`));
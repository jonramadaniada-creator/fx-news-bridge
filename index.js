const express = require('express');
const xml2js = require('xml2js');
const cors = require('cors');

const app = express();
app.use(cors());

// --- STEALTH CACHE SETTINGS ---
let cachedData = null;
let lastFetchTime = 0;
// Increased to 1 hour to avoid being "annoying" to Forex Factory
const CACHE_DURATION = 60 * 60 * 1000; 

app.get('/news', async (req, res) => {
    const currentTime = Date.now();

    // 1. Serve from memory if we have data and it's fresh
    if (cachedData && (currentTime - lastFetchTime < CACHE_DURATION)) {
        console.log("Serving from internal cache...");
        return res.json(cachedData);
    }

    try {
        console.log("Fetching fresh data from Forex Factory...");
        const url = 'https://nfs.faireconomy.media/ff_calendar_thisweek.xml';
        
        const response = await fetch(url, {
            headers: { 
                // This makes the request look like a real person on a Mac
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        // 2. Handle Rate Limiting (The 429 Error)
        if (response.status === 429) {
            console.log("Rate limited (429). Using old data if available.");
            if (cachedData) return res.json(cachedData);
            throw new Error("Forex Factory is temporarily blocking requests. Please wait 15 minutes.");
        }

        if (!response.ok) throw new Error(`External Error: ${response.status}`);

        const xmlData = await response.text();
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);

        // 3. Save to cache
        cachedData = result.weeklyevents.event;
        lastFetchTime = currentTime;

        res.json(cachedData);

    } catch (error) {
        console.error("System Error:", error.message);
        
        // 4. Ultimate Safety: Never show an error if we have ANY old data
        if (cachedData) {
            return res.json(cachedData);
        }

        res.status(500).json({ error: "Feed Unavailable", details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Stealth Bridge active on port ${PORT}`));

import express from "express";
import { createServer as createViteServer } from "vite";
import * as cheerio from "cheerio";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API route for marketing events
  app.get("/api/events/marketing", async (req, res) => {
    try {
      const url = "https://www.i-boss.co.kr/ab-2877";
      
      // Set an explicit timeout of 8 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      const events: any[] = [];
      
      // Extract links that look like board posts
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        const title = $(el).text().trim().replace(/\s+/g, ' ');
        
        // Filter valid post links (usually contain the board id and a document id)
        if (href && href.includes('ab-2877-') && title.length > 5 && !title.includes('댓글')) {
          events.push({
            id: `iboss-${i}`,
            title: title,
            url: href.startsWith('http') ? href : `https://www.i-boss.co.kr${href.startsWith('/') ? '' : '/'}${href}`,
            source: '아이보스'
          });
        }
      });
      
      // Deduplicate by URL
      const uniqueEvents = Array.from(new Map(events.map(e => [e.url, e])).values());
      
      res.json(uniqueEvents.slice(0, 15)); // Return top 15 recent posts
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn("Scraping timeout: Connection to i-boss was aborted (likely blocked by firewall). Returning empty list.");
      } else {
        console.error("Scraping error:", error.message || error);
      }
      res.json([]);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Steadfast proxy creating order
  app.post("/api/steadfast/create_order", async (req, res) => {
    try {
      const apiKey = req.headers['api-key'] || req.body.apiKey;
      const secretKey = req.headers['secret-key'] || req.body.secretKey;
      const orderData = req.body.orderData;

      if (!apiKey || !secretKey) {
        return res.status(400).json({ status: 400, message: "API Key and Secret Key are required." });
      }

      const response = await fetch("https://portal.packzy.com/api/v1/create_order", {
        method: "POST",
        headers: {
          "Api-Key": String(apiKey),
          "Secret-Key": String(secretKey),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderData)
      });

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        res.json(data);
      } catch (_) {
        res.status(response.status).json({ status: response.status, message: text || "Invalid response from Steadfast API" });
      }
    } catch (err: any) {
      console.error("Steadfast API Proxy Error:", err);
      res.status(500).json({ status: 500, message: err.message });
    }
  });

  // API Route: Steadfast proxy getting balance
  app.get("/api/steadfast/get_balance", async (req, res) => {
    try {
      const apiKey = req.headers['api-key'];
      const secretKey = req.headers['secret-key'];

      if (!apiKey || !secretKey) {
        return res.status(400).json({ status: 400, message: "API Key and Secret Key are required." });
      }

      const response = await fetch("https://portal.packzy.com/api/v1/get_balance", {
        method: "GET",
        headers: {
          "Api-Key": String(apiKey),
          "Secret-Key": String(secretKey),
          "Content-Type": "application/json"
        }
      });

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        res.json(data);
      } catch (_) {
        res.status(response.status).json({ status: response.status, message: text || "Invalid response from Steadfast API" });
      }
    } catch (err: any) {
      console.error("Steadfast Balance Proxy Error:", err);
      res.status(500).json({ status: 500, message: err.message });
    }
  });

  // API Route: Steadfast proxy retrieving status by CID / invoice / tracking code
  app.get("/api/steadfast/status/:type/:value", async (req, res) => {
    try {
      const apiKey = req.headers['api-key'];
      const secretKey = req.headers['secret-key'];
      const { type, value } = req.params;

      if (!apiKey || !secretKey) {
        return res.status(400).json({ status: 400, message: "API Key and Secret Key are required." });
      }

      let subPath = "";
      if (type === "cid") {
        subPath = `/status_by_cid/${value}`;
      } else if (type === "invoice") {
        subPath = `/status_by_invoice/${value}`;
      } else if (type === "tracking") {
        subPath = `/status_by_trackingcode/${value}`;
      } else {
        return res.status(400).json({ status: 400, message: "Invalid status type." });
      }

      const response = await fetch(`https://portal.packzy.com/api/v1${subPath}`, {
        method: "GET",
        headers: {
          "Api-Key": String(apiKey),
          "Secret-Key": String(secretKey),
          "Content-Type": "application/json"
        }
      });

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        res.json(data);
      } catch (_) {
        res.status(response.status).json({ status: response.status, message: text || "Invalid response from Steadfast API" });
      }
    } catch (err: any) {
      console.error("Steadfast Status Proxy Error:", err);
      res.status(500).json({ status: 500, message: err.message });
    }
  });

  // API Route: Meta Facebook Conversions API (CAPI) Proxy
  app.post("/api/fb-capi", async (req, res) => {
    try {
      const { pixelId, capiToken, payload } = req.body;

      if (!pixelId || !capiToken || !payload) {
        return res.status(400).json({ status: 400, message: "pixelId, capiToken, and payload are required." });
      }

      const capiUrl = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${capiToken}`;

      const response = await fetch(capiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.error("Meta CAPI Proxy Error:", err);
      res.status(500).json({ status: 500, message: err.message });
    }
  });

  // API Route: TikTok Conversions API (CAPI) Proxy
  app.post("/api/tiktok-capi", async (req, res) => {
    try {
      const { pixelId, capiToken, payload } = req.body;

      if (!pixelId || !capiToken || !payload) {
        return res.status(400).json({ status: 400, message: "pixelId (code), capiToken (token), and payload are required." });
      }

      // TikTok business track event URL endpoint
      const response = await fetch("https://business-api.tiktok.com/open_api/v1.3/pixel/track/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Token": capiToken
        },
        body: JSON.stringify({
          pixel_code: pixelId,
          ...payload
        })
      });

      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.error("TikTok CAPI Proxy Error:", err);
      res.status(500).json({ status: 500, message: err.message });
    }
  });

  // API Route: FraudShield check proxy
  app.post("/api/fraudshield/check", async (req, res) => {
    try {
      const apiKey = req.headers['x-fraudshield-api-key'] || req.body.apiKey;
      const { phone } = req.body;

      if (!apiKey) {
        return res.status(400).json({ success: false, error: "Unauthorized", message: "API key is required." });
      }
      if (!phone) {
        return res.status(400).json({ success: false, error: "Validation failed", message: "Phone number is required." });
      }

      const response = await fetch("https://fraudshield.bd/api/customer/check", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ phone })
      });

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        res.status(response.status).json(data);
      } catch (_) {
        res.status(response.status).json({ success: false, error: "Invalid response", message: text || "Invalid response from FraudShield API" });
      }
    } catch (err: any) {
      console.error("FraudShield API Proxy Error:", err);
      res.status(500).json({ success: false, error: "Server error", message: err.message });
    }
  });

  // API Route: FraudShield daily limit check proxy
  app.get("/api/fraudshield/daily-limit", async (req, res) => {
    try {
      const apiKey = req.headers['x-fraudshield-api-key'] || req.query.apiKey;

      if (!apiKey) {
        return res.status(400).json({ success: false, error: "Unauthorized", message: "API key is required." });
      }

      const response = await fetch("https://fraudshield.bd/api/usage/daily-limit", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json"
        }
      });

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        res.status(response.status).json(data);
      } catch (_) {
        res.status(response.status).json({ success: false, error: "Invalid response", message: text || "Invalid response from FraudShield API" });
      }
    } catch (err: any) {
      console.error("FraudShield limit Proxy Error:", err);
      res.status(500).json({ success: false, error: "Server error", message: err.message });
    }
  });

  // API Route: Get Firebase configuration
  app.get("/api/firebase-config", (req, res) => {
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        const data = fs.readFileSync(configPath, "utf-8");
        res.json(JSON.parse(data));
      } else {
        res.status(404).json({ error: "Config file not found" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Save Firebase configuration
  app.post("/api/firebase-config", (req, res) => {
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      const updatedConfig = req.body;
      
      // Validate configuration has required keys
      if (!updatedConfig.projectId || !updatedConfig.apiKey) {
        return res.status(400).json({ error: "projectId and apiKey are required" });
      }

      fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2), "utf-8");
      res.json({ success: true, message: "Firebase configuration updated successfully." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Sitemap.xml Dynamic Route
  app.get("/sitemap.xml", (req, res) => {
    res.header('Content-Type', 'application/xml');
    
    const host = req.get('host') || 'raincoat-factory.bd';
    const protocol = req.secure ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    const staticRoutes = [
      '',
      '/shop',
      '/raincoat',
      '/bikecover',
      '/rancoatcovercombo',
      '/boxer',
      '/track-order',
      '/order-history',
      '/cart'
    ];

    const productsSlugs = [
      'premium-waterproof-raincoat',
      'heavy-duty-waterproof-motorcycle-shoe-cover',
      'double-part-windproof-umbrella',
      'motorcycle-handlebar-waterproof-gloves',
      'premium-self-locking-bike-mobile-holder',
      'backpack-waterproof-ultra-shield',
      'sports-ultra-light-windbreaker',
      'kids-funny-cartoon-raincoat',
      'ladies-classic-long-belt-raincoat',
      'outdoor-travelers-waterproof-dry-bag',
      'night-safe-reflective-safety-vest',
      'heavy-heat-sealed-rain-poncho',
      'silicon-elastic-anti-slip-shoe-cover',
      'premium-bike-cover'
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    staticRoutes.forEach(route => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${route}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString().substring(0, 10)}</lastmod>\n`;
      xml += `    <changefreq>${route === '' || route === '/shop' ? 'daily' : 'weekly'}</changefreq>\n`;
      xml += `    <priority>${route === '' ? '1.0' : route === '/shop' ? '0.9' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    });

    productsSlugs.forEach(slug => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/product/${slug}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString().substring(0, 10)}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;
    res.send(xml);
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

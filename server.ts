import express from "express";
import path from "path";
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

  // API Route: FraudShield BD Proxy - Check Customer
  app.post("/api/fraudshield/check", async (req, res) => {
    try {
      const apiKey = req.headers['x-api-key'] || req.body.apiKey;
      const { phone } = req.body;

      if (!apiKey) {
        return res.status(401).json({ success: false, error: "Unauthorized", message: "FraudShield API Key is missing." });
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
      } catch (e) {
        res.status(response.status).json({ success: false, error: "Upstream Error", message: text || "Invalid response from upstream" });
      }
    } catch (err: any) {
      console.error("FraudShield Check Proxy Error:", err);
      res.status(500).json({ success: false, error: "Server error", message: err.message });
    }
  });

  // API Route: FraudShield BD Proxy - Check Usage Stats and User Status
  app.get("/api/fraudshield/usage", async (req, res) => {
    try {
      const apiKey = req.headers['x-api-key'];
      if (!apiKey) {
        return res.status(401).json({ success: false, error: "Unauthorized", message: "FraudShield API Key is missing." });
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
      } catch (e) {
        res.status(response.status).json({ success: false, error: "Upstream Error", message: text || "Invalid response from upstream" });
      }
    } catch (err: any) {
      console.error("FraudShield Limit Proxy Error:", err);
      res.status(500).json({ success: false, error: "Server error", message: err.message });
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

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

      const data = await response.json();
      res.json(data);
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

      const data = await response.json();
      res.json(data);
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

      const data = await response.json();
      res.json(data);
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

import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { validateHeaders } from "./src/cloudCatalog.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ProductRecord {
  id: string;
  cat: string;
  base: string;
  box?: number;
  stock?: number;
  img?: string;
  images?: string[];
  rating?: string;
  reviews?: number;
  unit?: string;
  warranty?: string;
  delivery?: string;
  condition?: string;
  single?: boolean;
  wholesale?: boolean;
  shop?: string;
  vars?: Array<{ name: string; label: string; price: number }>;
  chosen?: number;
  custom?: boolean;
  [key: string]: unknown;
}

const INITIAL_PRODUCTS: ProductRecord[] = [
  {
    id: "iph18p-new",
    cat: "phones",
    base: "iPhone 18 Pro 256GB Burgundy",
    box: 5,
    stock: 25,
    img: "https://i.postimg.cc/d3PN0pHx/photo-2026-10-22-08-21-18.jpg",
    images: ["https://i.postimg.cc/d3PN0pHx/photo-2026-10-22-08-21-18.jpg"],
    rating: "5.0",
    reviews: 34,
    unit: "Новый • Пломба • eSIM • Опт от 3 шт",
    warranty: "1 год (заводская)",
    delivery: "Склад Москва • отгрузка день в день",
    condition: "Новый, запечатан",
    single: false,
    wholesale: true,
    shop: "ELECTRO",
    vars: [{ name: "256", label: "256GB", price: 98900 }],
    chosen: 0,
  },
  {
    id: "airpods-pro2",
    cat: "earbuds",
    base: "AirPods Pro 2 USB-C",
    box: 20,
    stock: 48,
    img: "https://i.postimg.cc/W3M653Sj/photo-2026-09-10-14-03-55.jpg",
    images: ["https://i.postimg.cc/W3M653Sj/photo-2026-09-10-14-03-55.jpg"],
    rating: "4.9",
    reviews: 58,
    unit: "Опт • Партия от 10 шт • Склад Москва • Новые",
    warranty: "1 год (заводская)",
    delivery: "Склад Москва • отгрузка день в день",
    condition: "Новый, оригинал",
    single: false,
    wholesale: true,
    shop: "ELECTRO",
    vars: [{ name: "std", label: "USB-C", price: 18900 }],
    chosen: 0,
  },
  {
    id: "aw-ultra2",
    cat: "watches",
    base: "Apple Watch Ultra 2",
    box: 10,
    stock: 40,
    img: "https://i.postimg.cc/rmL5RTTN/i.jpg",
    images: ["https://i.postimg.cc/rmL5RTTN/i.jpg"],
    rating: "4.9",
    reviews: 21,
    unit: "Новый • Опт от 5 шт • Склад Москва",
    warranty: "1 год (заводская)",
    delivery: "Склад Москва • отгрузка день в день",
    condition: "Новый, запечатан",
    single: false,
    wholesale: true,
    shop: "ELECTRO",
    vars: [{ name: "49", label: "49mm", price: 64900 }],
    chosen: 0,
  },
  {
    id: "mba-m2",
    cat: "laptops",
    base: "MacBook Air 13 M2",
    box: 5,
    stock: 12,
    img: "https://i.postimg.cc/t4Kx8bsq/213.jpg",
    images: ["https://i.postimg.cc/t4Kx8bsq/213.jpg"],
    rating: "5.0",
    reviews: 17,
    unit: "Новый • 8/256 • Опт от 3 шт • Склад Москва",
    warranty: "1 год (заводская)",
    delivery: "Склад Москва • отгрузка день в день",
    condition: "Новый, запечатан",
    single: false,
    wholesale: true,
    shop: "ELECTRO",
    vars: [{ name: "256", label: "8/256", price: 89900 }],
    chosen: 0,
  },
  {
    id: "iph17p-97",
    cat: "phones",
    base: "iPhone 17 Pro 256GB",
    box: 1,
    stock: 1,
    img: "https://i.postimg.cc/L6ynyCKk/Obzor-dvuh-smartfonov-na-kirpicnoj-stene.png",
    images: [
      "https://i.postimg.cc/L6ynyCKk/Obzor-dvuh-smartfonov-na-kirpicnoj-stene.png",
      "https://i.postimg.cc/28HVHcR5/Smartfon-s-vyklucennym-ekranom-na-fone-kirpicnoj-steny.png",
    ],
    rating: "4.8",
    reviews: 12,
    unit: "АКБ 97% • Переклейка экрана • Полный комплект",
    warranty: "3 месяцев (после ремонта)",
    delivery: "Демо-витрина ELECTRO",
    condition: "После переклейки экрана",
    single: true,
    shop: "ELECTRO",
    vars: [{ name: "256", label: "256GB", price: 83000 }],
    chosen: 0,
  },
  {
    id: "iph14pm-128",
    cat: "phones",
    base: "iPhone 14 Pro Max 128GB",
    box: 1,
    stock: 1,
    img: "https://i.postimg.cc/vBQywy5H/Smartfon-s-vyklucennym-ekranom-na-fone-kirpicnoj-steny-(1).png",
    images: [
      "https://i.postimg.cc/vBQywy5H/Smartfon-s-vyklucennym-ekranom-na-fone-kirpicnoj-steny-(1).png",
      "https://i.postimg.cc/fRmQ3yKR/Belyj-i-Phone-na-fone-kirpicnoj-steny.png",
    ],
    rating: "4.8",
    reviews: 19,
    unit: "АКБ 87% • Белый • Без ремонта • Полный комплект",
    warranty: "6 месяцев (без ремонта)",
    delivery: "Демо-витрина ELECTRO",
    condition: "Отличное",
    single: true,
    shop: "ELECTRO",
    vars: [{ name: "128", label: "128GB", price: 43000 }],
    chosen: 0,
  },
];

const STATE_FILE = path.join(__dirname, "cloud_state.json");

let cloudCatalog: ProductRecord[] = [...INITIAL_PRODUCTS];
let cloudRate = 90.0;
let cloudStockMap: Record<string, number> = {
  "iph18p-new": 25,
  "airpods-pro2": 48,
  "aw-ultra2": 40,
  "mba-m2": 12,
  "iph17p-97": 1,
  "iph14pm-128": 1,
};

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
      if (Array.isArray(data.catalog) && data.catalog.length > 0) {
        cloudCatalog = data.catalog;
      }
      if (Number.isFinite(data.rate) && data.rate >= 50 && data.rate <= 200) {
        cloudRate = data.rate;
      }
      if (data.stock && typeof data.stock === "object") {
        cloudStockMap = data.stock;
      }
    }
  } catch (e) {
    console.warn("Could not load cloud_state.json:", e);
  }
}

function saveState() {
  try {
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify(
        {
          catalog: cloudCatalog,
          rate: cloudRate,
          stock: cloudStockMap,
          updatedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
  } catch (e) {
    console.warn("Could not save cloud_state.json:", e);
  }
}

loadState();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Enable CORS so fetch calls from any preview origin work reliably
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, apikey, Prefer");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "5mb" }));


  // PRODUCTS API
  app.get("/api/products", (_req, res) => {
    if (!cloudCatalog || cloudCatalog.length === 0) {
      cloudCatalog = [...INITIAL_PRODUCTS];
    }
    res.json(cloudCatalog);
  });

  app.post("/api/products", (req, res) => {
    const body = req.body;
    if (!body) {
      res.status(400).json({ error: "Empty product payload" });
      return;
    }
    const items: ProductRecord[] = Array.isArray(body) ? body : [body];
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const id = String(item.id || "p-" + Date.now().toString(36));
      const idx = cloudCatalog.findIndex((p) => p.id === id);
      if (idx >= 0) {
        cloudCatalog[idx] = { ...cloudCatalog[idx], ...item, id };
      } else {
        cloudCatalog.push({ ...item, id } as ProductRecord);
      }
      if (item.stock != null) {
        cloudStockMap[id] = Number(item.stock) || 0;
      }
    }
    saveState();
    res.status(201).json(cloudCatalog);
  });

  app.put("/api/products", (req, res) => {
    if (!Array.isArray(req.body)) {
      res.status(400).json({ error: "Expected array of products" });
      return;
    }
    cloudCatalog = req.body;
    for (const p of cloudCatalog) {
      if (p.id && p.stock != null) {
        cloudStockMap[p.id] = Number(p.stock) || 0;
      }
    }
    saveState();
    res.json(cloudCatalog);
  });

  app.delete("/api/products", (req, res) => {
    const rawId = typeof req.query.id === "string" ? req.query.id : "";
    const targetId = rawId.startsWith("eq.") ? rawId.slice(3) : rawId;
    if (!targetId) {
      res.status(400).json({ error: "Missing product id" });
      return;
    }
    cloudCatalog = cloudCatalog.filter((p) => p.id !== targetId);
    delete cloudStockMap[targetId];
    saveState();
    res.json(cloudCatalog);
  });

  // RATE CLOUD API (Shared across all users)
  app.get("/api/rate", (_req, res) => {
    res.json({ rate: cloudRate, updatedAt: new Date().toISOString() });
  });

  app.post("/api/rate", (req, res) => {
    let r: number | undefined;
    if (typeof req.body === "number") {
      r = req.body;
    } else if (req.body && typeof req.body === "object") {
      r = parseFloat(req.body.rate ?? req.body.value);
    } else if (typeof req.body === "string" && req.body.trim()) {
      r = parseFloat(req.body);
    }
    if (!Number.isFinite(r) && req.query) {
      r = parseFloat((req.query.rate as string) ?? (req.query.value as string));
    }
    if (Number.isFinite(r) && r! >= 50 && r! <= 200) {
      cloudRate = Math.round(r! * 100) / 100;
      saveState();
      res.json({ ok: true, rate: cloudRate, updatedAt: new Date().toISOString() });
    } else {
      res.status(400).json({ error: "Invalid rate" });
    }
  });

  // STOCK CLOUD API (Shared across all users)
  app.get("/api/stock", (_req, res) => {
    res.json(cloudStockMap);
  });

  app.post("/api/stock", (req, res) => {
    const map = req.body;
    if (map && typeof map === "object") {
      Object.keys(map).forEach((id) => {
        const n = parseInt(map[id], 10);
        if (Number.isFinite(n) && n >= 0) {
          cloudStockMap[id] = n;
          const prod = cloudCatalog.find((p) => p.id === id);
          if (prod) prod.stock = n;
        }
      });
      saveState();
      res.json({ ok: true, stockMap: cloudStockMap });
    } else {
      res.status(400).json({ error: "Invalid stock payload" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    const distIndex = path.join(distPath, "index.html");
    const rootIndex = path.join(__dirname, "index.html");
    const indexFile = fs.existsSync(distIndex) ? distIndex : rootIndex;

    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    app.use(express.static(__dirname));
    app.get("*all", (_req, res) => {
      res.sendFile(indexFile);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

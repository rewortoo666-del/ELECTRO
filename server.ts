import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Отдаем статические файлы (index.html, картинки)
app.use(express.static(__dirname));

// База данных в памяти сервера
let rate = 90.0;
let stock: Record<string, number> = {
  "iph18p-new": 25,
  "airpods-pro2": 48,
  "aw-ultra2": 40,
  "mba-m2": 12,
  "iph17p-97": 1,
  "iph14pm-128": 1
};
let products: any[] = [];

// 1. Эндпоинты для курса USD
app.get('/api/rate', (req, res) => {
  res.json({ rate });
});

app.post('/api/rate', (req, res) => {
  const newRate = parseFloat(req.body.rate);
  if (newRate && newRate >= 50 && newRate <= 200) {
    rate = newRate;
    return res.json({ success: true, rate });
  }
  res.status(400).json({ error: "Некорректный курс" });
});

// 2. Эндпоинты для остатков склада
app.get('/api/stock', (req, res) => {
  res.json(stock);
});

app.post('/api/stock', (req, res) => {
  if (req.body && typeof req.body === 'object') {
    stock = { ...stock, ...req.body };
    return res.json({ success: true, stock });
  }
  res.status(400).json({ error: "Некорректные данные остатков" });
});

// 3. Эндпоинты для товаров
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.post('/api/products', (req, res) => {
  const item = req.body;
  if (item && item.id) {
    products = products.filter(p => p.id !== item.id);
    products.push(item);
    if (item.stock != null) {
      stock[item.id] = parseInt(item.stock, 10) || 0;
    }
    return res.json({ success: true, products });
  }
  res.status(400).json({ error: "Товар должен содержать id" });
});

app.delete('/api/products/:id', (req, res) => {
  const id = req.params.id;
  products = products.filter(p => p.id !== id);
  delete stock[id];
  res.json({ success: true });
});

// Все остальные запросы отдают витрину
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер ELECTRO запущен на порту ${PORT}`);
});

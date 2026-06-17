// Compact e-commerce seed. Real Wave-1 dataset can be expanded later;
// this is enough rows to make queries and EXPLAIN meaningful.

const CUSTOMER_NAMES = [
  "Ava Patel", "Liam Chen", "Noah Kim", "Mia Garcia", "Ethan Brown",
  "Olivia Rossi", "James Wright", "Sophia Singh", "Benjamin Lee", "Isabella Cruz",
  "Lucas Reed", "Charlotte Adams", "Mason Park", "Amelia Diaz", "Logan Hayes",
  "Harper Khan", "Elijah Stone", "Evelyn Foster", "Aiden Walsh", "Abigail Nguyen",
];

const CITIES = ["Austin", "Seattle", "Boston", "Denver", "Miami", "Portland"];
const CATEGORIES = ["Electronics", "Books", "Home", "Apparel", "Toys", "Beauty"];
const STATUSES = ["pending", "shipped", "delivered", "cancelled"];

function rand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function buildEcommerceSQL(): string {
  const r = rand(42);
  const lines: string[] = [];

  lines.push(`
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      city TEXT,
      created_at TEXT
    );
    CREATE TABLE products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      price REAL,
      stock INTEGER
    );
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id),
      total REAL,
      status TEXT,
      created_at TEXT
    );
    CREATE TABLE order_items (
      id INTEGER PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id),
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER,
      unit_price REAL
    );
    CREATE TABLE reviews (
      id INTEGER PRIMARY KEY,
      product_id INTEGER REFERENCES products(id),
      customer_id INTEGER REFERENCES customers(id),
      rating INTEGER,
      comment TEXT,
      created_at TEXT
    );
    CREATE INDEX idx_orders_customer ON orders(customer_id);
    CREATE INDEX idx_order_items_order ON order_items(order_id);
  `);

  const customerCount = 120;
  const productCount = 50;
  const orderCount = 400;
  const itemCount = 900;
  const reviewCount = 250;

  lines.push("BEGIN;");

  for (let i = 1; i <= customerCount; i++) {
    const name = CUSTOMER_NAMES[(i - 1) % CUSTOMER_NAMES.length] + " " + i;
    const email = `user${i}@example.com`;
    const city = CITIES[Math.floor(r() * CITIES.length)];
    const date = `2024-${String(1 + Math.floor(r() * 12)).padStart(2, "0")}-${String(1 + Math.floor(r() * 28)).padStart(2, "0")}`;
    lines.push(
      `INSERT INTO customers VALUES (${i}, '${name.replace(/'/g, "''")}', '${email}', '${city}', '${date}');`
    );
  }

  for (let i = 1; i <= productCount; i++) {
    const category = CATEGORIES[Math.floor(r() * CATEGORIES.length)];
    const name = `${category} Item ${i}`;
    const price = +(5 + r() * 295).toFixed(2);
    const stock = Math.floor(r() * 200);
    lines.push(
      `INSERT INTO products VALUES (${i}, '${name}', '${category}', ${price}, ${stock});`
    );
  }

  for (let i = 1; i <= orderCount; i++) {
    const cust = 1 + Math.floor(r() * customerCount);
    const total = +(10 + r() * 500).toFixed(2);
    const status = STATUSES[Math.floor(r() * STATUSES.length)];
    const date = `2024-${String(1 + Math.floor(r() * 12)).padStart(2, "0")}-${String(1 + Math.floor(r() * 28)).padStart(2, "0")}`;
    lines.push(
      `INSERT INTO orders VALUES (${i}, ${cust}, ${total}, '${status}', '${date}');`
    );
  }

  for (let i = 1; i <= itemCount; i++) {
    const order = 1 + Math.floor(r() * orderCount);
    const product = 1 + Math.floor(r() * productCount);
    const qty = 1 + Math.floor(r() * 5);
    const price = +(5 + r() * 295).toFixed(2);
    lines.push(
      `INSERT INTO order_items VALUES (${i}, ${order}, ${product}, ${qty}, ${price});`
    );
  }

  for (let i = 1; i <= reviewCount; i++) {
    const product = 1 + Math.floor(r() * productCount);
    const cust = 1 + Math.floor(r() * customerCount);
    const rating = 1 + Math.floor(r() * 5);
    const date = `2024-${String(1 + Math.floor(r() * 12)).padStart(2, "0")}-${String(1 + Math.floor(r() * 28)).padStart(2, "0")}`;
    lines.push(
      `INSERT INTO reviews VALUES (${i}, ${product}, ${cust}, ${rating}, 'Review ${i}', '${date}');`
    );
  }

  lines.push("COMMIT;");
  return lines.join("\n");
}

import type { DatasetName } from "../types/database";

export const STARTER_QUERIES: Record<DatasetName, string> = {
  ecommerce: `-- Try a query. Cmd/Ctrl+Enter to run.
SELECT c.name, SUM(o.total) AS total_spent
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY total_spent DESC
LIMIT 5;`,
  music: `SELECT ar.name, COUNT(t.id) AS track_count
FROM artists ar
JOIN albums al ON al.artist_id = ar.id
JOIN tracks t ON t.album_id = al.id
GROUP BY ar.id, ar.name
ORDER BY track_count DESC
LIMIT 5;`,
  employees: `SELECT d.name AS department, AVG(e.salary) AS avg_salary
FROM departments d
JOIN employees e ON e.department_id = d.id
GROUP BY d.id, d.name
ORDER BY avg_salary DESC;`,
  social: `SELECT u.username, COUNT(p.id) AS post_count
FROM users u
LEFT JOIN posts p ON p.user_id = u.id
GROUP BY u.id, u.username
ORDER BY post_count DESC
LIMIT 5;`,
};

export function starterQueryForDataset(dataset: DatasetName): string {
  return STARTER_QUERIES[dataset];
}

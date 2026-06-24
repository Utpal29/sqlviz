import type { Challenge } from "./types";

export const HARD_CHALLENGES: Challenge[] = [
  {
    id: "hard-001-repeat-customers",
    title: "Repeat customers",
    description:
      "Find every customer who has placed more than one order. Return their `name` and `order_count`, sorted by `order_count` descending, then by `name` ascending.",
    difficulty: "hard",
    dataset: "ecommerce",
    concepts: ["GROUP BY", "HAVING", "multi-column ORDER BY"],
    hints: [
      "After GROUP BY, you can filter the *groups* with HAVING.",
      "`HAVING COUNT(o.id) > 1` keeps customers with multiple orders.",
      "ORDER BY can take multiple expressions; ties on count break by name.",
    ],
    starterQuery: `-- Customers with more than one order
SELECT c.name, COUNT(o.id) AS order_count
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
HAVING
ORDER BY order_count DESC, c.name;
`,
    solutionQuery: `SELECT c.name, COUNT(o.id) AS order_count
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
HAVING COUNT(o.id) > 1
ORDER BY order_count DESC, c.name;`,
    validation: { kind: "solution_query", orderMatters: true },
  },
  {
    id: "hard-002-highest-paid-per-department",
    title: "Highest-paid employee per department",
    description:
      "For every department, return the single highest-paid employee. Output `department`, `name`, and `salary`, sorted by department name. (Ties should pick whichever the window function returns; assume no ties on salary in this dataset.)",
    difficulty: "hard",
    dataset: "employees",
    concepts: ["window functions", "PARTITION BY", "RANK"],
    hints: [
      "Window functions let you rank rows inside a group without collapsing them.",
      "Try `RANK() OVER (PARTITION BY department_id ORDER BY salary DESC)`.",
      "Wrap the windowed query in a subquery, then keep only `rank = 1`.",
    ],
    starterQuery: `-- One row per department: the top earner
WITH ranked AS (
  SELECT
    d.name AS department,
    e.name,
    e.salary,
    RANK() OVER (PARTITION BY  ORDER BY  DESC) AS rnk
  FROM employees e
  JOIN departments d ON d.id = e.department_id
)
SELECT department, name, salary
FROM ranked
WHERE rnk = 1
ORDER BY department;
`,
    solutionQuery: `WITH ranked AS (
  SELECT
    d.name AS department,
    e.name,
    e.salary,
    RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS rnk
  FROM employees e
  JOIN departments d ON d.id = e.department_id
)
SELECT department, name, salary
FROM ranked
WHERE rnk = 1
ORDER BY department;`,
    validation: { kind: "solution_query", orderMatters: true },
  },
  {
    id: "hard-003-most-liked-post-per-user",
    title: "Each user's most-liked post",
    description:
      "For every user, return their single most-liked post. Output `username`, `content`, and `likes_count`, sorted by `likes_count` descending. Skip users with no posts.",
    difficulty: "hard",
    dataset: "social",
    concepts: ["window functions", "ROW_NUMBER", "tie-breaking", "JOIN"],
    hints: [
      "Use ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY likes_count DESC) to rank each user's posts.",
      "Use a CTE or subquery so you can filter by the row number = 1.",
      "Tie-break with a second ORDER BY column (e.g. created_at DESC) inside the window so the result is deterministic.",
    ],
    starterQuery: `-- Each user's single top post by likes
WITH ranked_posts AS (
  SELECT
    u.username,
    p.content,
    p.likes_count,
    ROW_NUMBER() OVER (
      PARTITION BY
      ORDER BY p.likes_count DESC, p.created_at DESC
    ) AS rn
  FROM users u
  JOIN posts p ON p.user_id = u.id
)
SELECT username, content, likes_count
FROM ranked_posts
WHERE rn = 1
ORDER BY likes_count DESC;
`,
    solutionQuery: `WITH ranked_posts AS (
  SELECT
    u.username,
    p.content,
    p.likes_count,
    ROW_NUMBER() OVER (
      PARTITION BY u.id
      ORDER BY p.likes_count DESC, p.created_at DESC
    ) AS rn
  FROM users u
  JOIN posts p ON p.user_id = u.id
)
SELECT username, content, likes_count
FROM ranked_posts
WHERE rn = 1
ORDER BY likes_count DESC;`,
    validation: { kind: "solution_query", orderMatters: true },
  },
];

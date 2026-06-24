import type { Challenge } from "./types";

export const MEDIUM_CHALLENGES: Challenge[] = [
  {
    id: "medium-001-top-spenders",
    title: "Top 5 spenders",
    description:
      "Find the 5 customers who have spent the most across all their orders. Return `name` and `total_spent` (sum of the `orders.total` for each customer), sorted descending.",
    difficulty: "medium",
    dataset: "ecommerce",
    concepts: ["JOIN", "GROUP BY", "SUM", "ORDER BY", "LIMIT"],
    hints: [
      "Join `customers` with `orders` on `customers.id = orders.customer_id`.",
      "GROUP BY the customer so each appears once in the output.",
      "SUM(o.total) gives the lifetime spend; alias it as `total_spent`.",
    ],
    starterQuery: `-- Top 5 spenders, lifetime total
SELECT c.name, SUM(o.total) AS total_spent
FROM customers c
JOIN orders o ON
GROUP BY c.id, c.name
ORDER BY total_spent DESC
LIMIT 5;
`,
    solutionQuery: `SELECT c.name, SUM(o.total) AS total_spent
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY total_spent DESC
LIMIT 5;`,
    validation: { kind: "solution_query", orderMatters: true },
  },
  {
    id: "medium-002-prolific-artists",
    title: "Most prolific artists",
    description:
      "List the 5 artists with the most tracks across all their albums. Return `artist` (the artist's name) and `track_count`, sorted descending.",
    difficulty: "medium",
    dataset: "music",
    concepts: ["multi-table JOIN", "GROUP BY", "COUNT", "aliasing"],
    hints: [
      "You need three tables: artists → albums → tracks.",
      "COUNT(t.id) counts tracks per artist after the joins.",
      "Don't forget GROUP BY artist id; ORDER BY the alias.",
    ],
    starterQuery: `-- 5 most prolific artists by track count
SELECT ar.name AS artist, COUNT(t.id) AS track_count
FROM artists ar
JOIN albums al ON
JOIN tracks t ON
GROUP BY ar.id, ar.name
ORDER BY track_count DESC
LIMIT 5;
`,
    solutionQuery: `SELECT ar.name AS artist, COUNT(t.id) AS track_count
FROM artists ar
JOIN albums al ON al.artist_id = ar.id
JOIN tracks t ON t.album_id = al.id
GROUP BY ar.id, ar.name
ORDER BY track_count DESC
LIMIT 5;`,
    validation: { kind: "solution_query", orderMatters: true },
  },
  {
    id: "medium-003-silent-users",
    title: "Users who never posted",
    description:
      "Return every user who has never created a post. Output their `username`, sorted A → Z.",
    difficulty: "medium",
    dataset: "social",
    concepts: ["LEFT JOIN", "NULL filtering", "anti-join pattern"],
    hints: [
      "A LEFT JOIN keeps users even when no matching post exists.",
      "After the join, rows with no post will have NULL on the posts side.",
      "Filter with `WHERE p.id IS NULL` to keep only those users.",
    ],
    starterQuery: `-- Usernames of people who have never posted
SELECT u.username
FROM users u
LEFT JOIN posts p ON
WHERE
ORDER BY u.username;
`,
    solutionQuery: `SELECT u.username
FROM users u
LEFT JOIN posts p ON p.user_id = u.id
WHERE p.id IS NULL
ORDER BY u.username;`,
    validation: { kind: "solution_query", orderMatters: true },
  },
];

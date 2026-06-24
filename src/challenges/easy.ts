import type { Challenge } from "./types";

export const EASY_CHALLENGES: Challenge[] = [
  {
    id: "easy-001-first-customers",
    title: "First customers, alphabetical",
    description:
      "Return the first 10 customers, ordered by name (A → Z). Include their `id`, `name`, and `email`.",
    difficulty: "easy",
    dataset: "ecommerce",
    concepts: ["SELECT", "ORDER BY", "LIMIT"],
    hints: [
      "You only need three columns: id, name, email.",
      "ORDER BY name sorts strings alphabetically by default.",
      "LIMIT 10 stops the result after the first ten rows.",
    ],
    starterQuery: `-- Return the first 10 customers, alphabetical
SELECT
FROM customers;
`,
    solutionQuery: `SELECT id, name, email
FROM customers
ORDER BY name
LIMIT 10;`,
    validation: { kind: "solution_query", orderMatters: true },
  },
  {
    id: "easy-002-cheap-products",
    title: "Cheap products",
    description:
      "List every product priced under 20 dollars. Return `name` and `price`, sorted by price ascending.",
    difficulty: "easy",
    dataset: "ecommerce",
    concepts: ["WHERE", "comparison operators", "ORDER BY"],
    hints: [
      "Use WHERE to filter rows before they reach the result.",
      "`price < 20` keeps rows with price less than 20.",
      "ORDER BY price puts the cheapest first.",
    ],
    starterQuery: `-- All products under $20, cheapest first
SELECT name, price
FROM products
WHERE
ORDER BY price;
`,
    solutionQuery: `SELECT name, price
FROM products
WHERE price < 20
ORDER BY price;`,
    validation: { kind: "solution_query", orderMatters: true },
  },
  {
    id: "easy-003-top-cities",
    title: "Cities with the most customers",
    description:
      "Which 5 cities have the most customers? Return `city` and the customer count as `customer_count`, sorted descending by count.",
    difficulty: "easy",
    dataset: "ecommerce",
    concepts: ["GROUP BY", "COUNT", "ORDER BY", "LIMIT"],
    hints: [
      "GROUP BY city collapses each city into a single row.",
      "COUNT(*) inside the SELECT counts rows per group.",
      "Alias the count with AS customer_count so the column name matches.",
    ],
    starterQuery: `-- Top 5 cities by customer count
SELECT city, COUNT(*) AS customer_count
FROM customers
GROUP BY
ORDER BY customer_count DESC
LIMIT 5;
`,
    solutionQuery: `SELECT city, COUNT(*) AS customer_count
FROM customers
GROUP BY city
ORDER BY customer_count DESC
LIMIT 5;`,
    validation: { kind: "solution_query", orderMatters: true },
  },
];

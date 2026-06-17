export function buildSocialSQL(): string {
  return `
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL,
      bio TEXT,
      joined_at TEXT
    );
    CREATE TABLE posts (
      id INTEGER PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      content TEXT,
      created_at TEXT,
      likes_count INTEGER
    );
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY,
      post_id INTEGER REFERENCES posts(id),
      user_id INTEGER REFERENCES users(id),
      content TEXT,
      created_at TEXT
    );
    CREATE TABLE follows (
      follower_id INTEGER REFERENCES users(id),
      following_id INTEGER REFERENCES users(id),
      PRIMARY KEY (follower_id, following_id)
    );
    CREATE INDEX idx_posts_user ON posts(user_id);
    CREATE INDEX idx_comments_post ON comments(post_id);
    CREATE INDEX idx_follows_following ON follows(following_id);

    BEGIN;
    INSERT INTO users VALUES
      (1, 'ava_sql', 'Learning query plans', '2024-01-02'),
      (2, 'join_master', 'Indexes are my favorite', '2024-01-10'),
      (3, 'nested_nora', 'Bootcamp student', '2024-02-14'),
      (4, 'scan_sam', 'Debugging slow dashboards', '2024-03-21'),
      (5, 'cte_chris', 'Writes readable SQL', '2024-04-05'),
      (6, 'where_wren', 'Filters first', '2024-05-30');
    INSERT INTO posts VALUES
      (1, 1, 'Why did SQLite scan this table?', '2025-01-01', 42),
      (2, 2, 'Covering indexes explained', '2025-01-03', 87),
      (3, 3, 'GROUP BY finally clicked', '2025-01-05', 31),
      (4, 1, 'JOIN order surprised me', '2025-01-07', 64),
      (5, 4, 'Temp B-tree in ORDER BY', '2025-01-08', 55),
      (6, 5, 'CTEs for clarity', '2025-01-10', 29),
      (7, 6, 'WHERE before HAVING', '2025-01-12', 38);
    INSERT INTO comments VALUES
      (1, 1, 2, 'Add an index to the filtered column.', '2025-01-02'),
      (2, 1, 3, 'The plan view helped.', '2025-01-02'),
      (3, 2, 1, 'Great example.', '2025-01-04'),
      (4, 5, 2, 'Try matching the ORDER BY.', '2025-01-09'),
      (5, 6, 6, 'Readable wins.', '2025-01-11');
    INSERT INTO follows VALUES
      (1, 2), (1, 3), (2, 1), (2, 4), (3, 1),
      (4, 2), (5, 1), (5, 6), (6, 2), (6, 5);
    COMMIT;
  `;
}

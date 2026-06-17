export function buildMusicSQL(): string {
  return `
    CREATE TABLE artists (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      genre TEXT,
      country TEXT
    );
    CREATE TABLE albums (
      id INTEGER PRIMARY KEY,
      artist_id INTEGER REFERENCES artists(id),
      title TEXT NOT NULL,
      year INTEGER,
      label TEXT
    );
    CREATE TABLE tracks (
      id INTEGER PRIMARY KEY,
      album_id INTEGER REFERENCES albums(id),
      title TEXT NOT NULL,
      duration_ms INTEGER,
      track_number INTEGER
    );
    CREATE TABLE playlists (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT
    );
    CREATE TABLE playlist_tracks (
      playlist_id INTEGER REFERENCES playlists(id),
      track_id INTEGER REFERENCES tracks(id),
      position INTEGER,
      PRIMARY KEY (playlist_id, track_id)
    );
    CREATE INDEX idx_albums_artist ON albums(artist_id);
    CREATE INDEX idx_tracks_album ON tracks(album_id);
    CREATE INDEX idx_playlist_tracks_track ON playlist_tracks(track_id);

    BEGIN;
    INSERT INTO artists VALUES
      (1, 'Northline', 'Indie', 'Canada'),
      (2, 'The Query Plan', 'Electronic', 'USA'),
      (3, 'Blue Index', 'Jazz', 'UK'),
      (4, 'Nested Loop', 'Rock', 'Australia'),
      (5, 'Temp B-Tree', 'Ambient', 'Germany');
    INSERT INTO albums VALUES
      (1, 1, 'Cold Starts', 2021, 'Atlas'),
      (2, 1, 'Late Materialize', 2023, 'Atlas'),
      (3, 2, 'Explain Analyze', 2022, 'Vector'),
      (4, 3, 'Covering Index', 2020, 'Bluebird'),
      (5, 4, 'Full Scan', 2019, 'Signal'),
      (6, 5, 'Sort Memory', 2024, 'Drift');
    INSERT INTO tracks VALUES
      (1, 1, 'Bootstrap', 184000, 1),
      (2, 1, 'Warm Cache', 201000, 2),
      (3, 2, 'Predicate Pushdown', 223000, 1),
      (4, 2, 'Hash Join', 210000, 2),
      (5, 3, 'Cost Model', 248000, 1),
      (6, 3, 'Plan Node', 196000, 2),
      (7, 4, 'Blue Filter', 230000, 1),
      (8, 4, 'Index Only', 204000, 2),
      (9, 5, 'Sequential', 221000, 1),
      (10, 5, 'Rewritten', 215000, 2),
      (11, 6, 'Order Work', 242000, 1),
      (12, 6, 'Memory Limit', 226000, 2);
    INSERT INTO playlists VALUES
      (1, 'Interview Prep', 'High signal tracks', '2025-01-04'),
      (2, 'Late Night Debug', 'Long focus session', '2025-02-12'),
      (3, 'Fast Lookup', 'Short efficient cuts', '2025-03-18');
    INSERT INTO playlist_tracks VALUES
      (1, 3, 1), (1, 5, 2), (1, 8, 3),
      (2, 1, 1), (2, 11, 2), (2, 12, 3),
      (3, 2, 1), (3, 6, 2), (3, 10, 3);
    COMMIT;
  `;
}

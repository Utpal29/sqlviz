export function buildEmployeesSQL(): string {
  return `
    CREATE TABLE departments (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      budget REAL,
      location TEXT
    );
    CREATE TABLE employees (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      department_id INTEGER REFERENCES departments(id),
      manager_id INTEGER REFERENCES employees(id),
      salary REAL,
      hire_date TEXT
    );
    CREATE INDEX idx_employees_department ON employees(department_id);
    CREATE INDEX idx_employees_manager ON employees(manager_id);

    BEGIN;
    INSERT INTO departments VALUES
      (1, 'Engineering', 1200000, 'Toronto'),
      (2, 'Product', 620000, 'New York'),
      (3, 'Design', 410000, 'Berlin'),
      (4, 'Sales', 890000, 'Austin'),
      (5, 'Support', 360000, 'Remote');
    INSERT INTO employees VALUES
      (1, 'Maya Stone', 1, NULL, 184000, '2018-03-12'),
      (2, 'Owen Lee', 1, 1, 142000, '2020-08-19'),
      (3, 'Nora Patel', 1, 1, 136000, '2021-02-04'),
      (4, 'Leo Chen', 2, NULL, 168000, '2019-06-11'),
      (5, 'Iris Khan', 2, 4, 121000, '2022-01-17'),
      (6, 'Elena Cruz', 3, NULL, 151000, '2018-11-02'),
      (7, 'Theo Adams', 3, 6, 118000, '2022-10-03'),
      (8, 'Grace Park', 4, NULL, 159000, '2017-04-25'),
      (9, 'Sam Wright', 4, 8, 97000, '2023-05-14'),
      (10, 'Ava Rossi', 5, NULL, 112000, '2020-12-07'),
      (11, 'Mason Reed', 5, 10, 86000, '2024-01-22'),
      (12, 'Zara Singh', 1, 2, 128000, '2023-09-01');
    COMMIT;
  `;
}

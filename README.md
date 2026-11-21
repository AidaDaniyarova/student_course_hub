# Student Course Hub

A server-rendered course browsing and administration app built with Deno and SQLite, following an MVC structure (models, views, controllers, middleware).

## Setup

```sh
cp .env.example .env
deno run --allow-all tasks/init-db.js   # creates and seeds course_hub.db
deno task dev                           # http://localhost:8000
```

The database is generated locally and is not committed.

## Demo accounts

> **Sample accounts for local testing only.**

`tasks/init-db.js` seeds sample accounts for local testing only. Their passwords are stored as bcrypt hashes and are not used in any deployed environment.

| Username | Password   | Role          |
|----------|------------|---------------|
| admin    | admin123   | Administrator |
| sjohnson | staff123   | Staff         |
| student1 | student123 | Student       |

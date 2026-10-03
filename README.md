# ☁️ CloudDrive — your USB in the cloud

A personal cloud storage app built for students: save files at school, open them at home,
and always know where you left off.

## ✨ Features

- 📤 Drag & drop uploads (any file type, up to 25 MB each)
- 📁 Nested folders, just like a real USB stick
- 🖼️ Inline preview for PDFs, images, video, audio, code, text, CSV and more
- ⭐ Starred files + instant search
- 🕒 "Recent" view so you can continue where you left off (school ↔ home)
- 📓 Activity log of every upload, rename, move and delete
- 📝 Notes attached to files ("continue chapter 3 on the bus")
- 📦 Storage usage indicator

## 🛠 Tech

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- PostgreSQL via Drizzle ORM (file bytes stored in the database)
- No external services required

## 🚀 How to run it on your own computer

1. Install [Node.js](https://nodejs.org) (version 20 or newer)
2. Open a terminal in this folder
3. Install the dependencies:

   ```bash
   npm install
   ```

4. Set up your database (free at [neon.tech](https://neon.tech)):

   ```bash
   cp .env.example .env
   ```

   Then open `.env` and paste your Neon connection string.

5. Create the tables:

   ```bash
   npx drizzle-kit push
   ```

6. Start the app:

   ```bash
   npm run dev
   ```

7. Open http://localhost:3000 🎉

## ☁️ How to deploy it (free)

### GitHub

```bash
git init
git add .
git commit -m "My CloudDrive app"
git branch -M main
git remote add origin https://github.com/asilokyean23-dotcom/clouddrive.git
git push -u origin main
```

### Vercel (hosting) + Neon (database)

1. Create a project at https://neon.tech and copy the connection string
2. Go to https://vercel.com → **Add New… → Project** → import `clouddrive`
3. Under **Environment Variables** add `DATABASE_URL` = your Neon connection string
4. Click **Deploy** and you're live 🎉
5. To create the tables on the live database, run this locally with your Neon URL in `.env`:

   ```bash
   npx drizzle-kit push
   ```

## 📂 Project structure

```
src/
  app/
    page.tsx              # the CloudDrive interface
    api/
      files/              # upload, list, rename, star, delete
      files/[id]/raw/     # download / preview a file
      folders/            # create, list, delete folders
      activities/         # the "what did I do?" feed
      stats/              # storage usage
      health/             # health check
  components/             # UI building blocks
  db/schema.ts            # database tables (Drizzle)
  lib/                    # helpers (formatting, file utils)
```

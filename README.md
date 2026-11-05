# EduManage – Coaching Institute Management

Next.js 14 (App Router) · MongoDB (Mongoose) · Cloudinary · Tailwind CSS · JWT auth · WhatsApp Cloud API

## 1. Setup

```bash
npm install
cp .env.example .env.local      # then fill in the values
npm run dev                     # http://localhost:3000
```

On the **first visit** `/login` shows a "Create your admin account" form (only while the database has zero users).
After that it becomes a normal sign-in page. Extra users (Teacher / Accounts) are added in **Settings → Users**.

### Environment variables
| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string (local or Atlas) |
| `JWT_SECRET` | long random string used to sign login cookies |
| `CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET` | student photos, documents, logo uploads |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` | WhatsApp Business Cloud API. **Optional** – without them messages are logged in the app but not delivered (demo mode) |
| `CRON_SECRET` | protects `/api/cron/reminders` |

### Quick look with sample data
After creating the admin account, open **Dashboard → Load sample data** (or Settings → Sample Data) to fill the app with
100 students, 6 teachers, 12 batches, 6 months of fees, attendance, salaries, expenses and notices.
Use **Clear all data** in Settings when you are ready to enter your real data.

### Landing page
The public marketing page lives at `/` (`src/app/page.js`; navbar, logo and testimonial slider in `src/components/landing/`).
It uses a royal-blue theme, separate from the purple app theme. Photos are in `public/landing/` – swap in your own
(same file names) for sharper images.

**Before publishing:** the client logos, the "1,000+ institutes / 5,00,000+ students / 1 Cr+ messages / 99.9% uptime"
figures and the testimonials are SAMPLE content from the design mock-up (see the `TRUSTED`, `STATS` and `TESTIMONIALS`
arrays at the top of `src/app/page.js`). Replace them with real, verifiable data and logos you have permission to use.

## 2. Typical workflow
1. **Courses & Batches** → add a course (with fee for each plan) → add batches (teacher, days, timings).
2. **Teachers** → add teachers (do this before batches if you want to assign them).
3. **Students → Add Student** (4-step admission). The first fee record is created automatically.
4. **Fees → Generate Month Fees** creates the month's dues for all active students (monthly/quarterly/half-yearly/yearly cycles respected). **Collect Fee** applies a payment to the oldest dues first.
5. **Attendance** → pick course, batch, date → Save. Absent parents get a WhatsApp alert if automation is on.
6. **Salary & Expenses** → *Process Salary* creates payroll rows, mark each paid; add expenses; profit/loss is calculated live.

## 3. Daily fee reminders
Call `GET /api/cron/reminders?secret=CRON_SECRET` once a day. `vercel.json` already schedules this on Vercel
(add `CRON_SECRET` in project env). It messages parents of dues falling 3 days from today.

## 4. WhatsApp notes
Meta only allows free-form text inside a 24-hour customer-service window. For production reminders you must
register **approved message templates** in Meta Business Manager and switch `sendText()` in `src/lib/whatsapp.js`
to send `type: "template"` payloads. Delivery/read counts need a webhook (not included) that updates the `Message` model.

## 5. Folder structure
```
edumanage/
├── package.json · next.config.js · tailwind.config.js · postcss.config.js · jsconfig.json
├── .env.example · vercel.json · README.md
└── src/
    ├── middleware.js                 # JWT guard for all pages + /api (public: /login, /api/auth/login, /api/setup, /api/cron)
    ├── lib/
    │   ├── db.js                     # cached Mongo connection (also registers all models)
    │   ├── auth.js                   # sign/verify JWT, session from cookie
    │   ├── crud.js                   # wrap() auth+error handler, collection() & item() generic CRUD
    │   ├── cloudinary.js             # upload_stream helper
    │   ├── whatsapp.js · templates.js# WhatsApp sender + default message templates
    │   ├── finance.js · utils.js     # income/salary/expense maths, IDs (STU0001), date helpers
    │   └── client.js                 # useApi (SWR), api(), upload(), toast(), CSV download
    ├── models/                       # User Student Course Batch Teacher FeeRecord Attendance
    │                                 # Salary Expense Notice Message Template Institute Counter
    ├── components/                   # ui.js (Stat, Card, Table, Modal, Pager…), Sidebar, Topbar, StudentForm
    └── app/
        ├── layout.js · globals.css · page.js
        ├── login/page.js
        ├── (app)/                    # authenticated shell (Sidebar + Topbar)
        │   ├── dashboard · students (+ new, [id]) · courses · fees · attendance
        │   └── teachers · salary · whatsapp · reports · notices · settings
        └── api/
            ├── auth/{login,logout,me} · setup · upload
            ├── students[/id][/summary] · courses · batches · teachers
            ├── fees[/generate|collect|recent] · attendance[/summary]
            ├── salary[/process|summary|id] · expenses · notices
            ├── whatsapp/{send,stats,templates} · dashboard · reports
            ├── users · settings · cron/reminders
```

## 6. Deploying
Vercel + MongoDB Atlas is the easiest: import the repo, add the env vars above, deploy.

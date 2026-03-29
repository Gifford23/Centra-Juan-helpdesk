# 🛠️ Central Juan Helpdesk & Ticketing System

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)

A comprehensive B2B2C (Business-to-Business-to-Consumer) Enterprise Helpdesk platform built for I.T. repair shops. This system streamlines the entire repair workflow—from public ticket submission and device tracking to internal technician assignments, Kanban board management, and real-time analytics.

Designed as a Capstone project by **Gifford John B. Ubaldo**, a 4th-year BSIT student at **Liceo de Cagayan University**.

---

## ✨ Key Features

### 🏢 Admin & Technician Portal (Internal)

- **Role-Based Access Control (RBAC):** Secure access levels separating "Super Admins" (full system control, logs, personnel management) from "Technicians" (restricted to assigned tasks).
- **Interactive Kanban Board:** Visual pipeline to manage device repairs across stages (Received ➔ Diagnosing ➔ In Repair ➔ Ready).
- **Live Data Queue:** Sortable, filterable, and exportable (CSV) master data table.
- **Real-Time Dashboard Analytics:** Built with Recharts to display dynamic visual data, including ticket volume over time and top hardware/software issues.
- **System Audit Logs:** Immutable tracking of all user actions to ensure enterprise-level accountability.
- **Printable Job Orders:** Instantly generate physical repair receipts formatted for POS printing.
- **Profile Customization:** Personnel can upload and update their own profile avatars via Cloud Storage.

### 👥 Customer Experience (External)

- **Public Submission Portal:** Customers can register their devices, write complaint notes, and upload diagnostic images before dropping off their device.
- **Interactive Chatbot:** A floating, rule-based assistant providing instant access to tracking links, contact info, and business hours.
- **Passwordless Customer Dashboard:** Secure login using only the registered Email and Phone Number.
- **Real-Time Notifications:** Customers receive live UI alerts when the status of their repair ticket changes.
- **Enterprise Policies:** Built-in comprehensive Terms & Conditions and Privacy agreements.

---

## 💻 Tech Stack

- **Frontend:** React 18, Vite, TypeScript
- **Styling:** Tailwind CSS, Lucide React (Icons)
- **Data Visualization:** Recharts
- **Backend & Database:** Supabase (PostgreSQL)
- **Authentication:** Custom RBAC / Passwordless Customer Auth
- **Storage:** Supabase Storage (for Avatars and Job Images)
- **Real-Time:** Supabase Realtime Channels

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A [Supabase](https://supabase.com/) account and project.

### 1. Clone the Repository

```bash
git clone [https://github.com/yourusername/centra-juan-helpdesk.git](https://github.com/yourusername/centra-juan-helpdesk.git)
cd centra-juan-helpdesk
```

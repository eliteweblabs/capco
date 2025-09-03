# CAPCo Fire Protection Systems

A comprehensive PDF submission and review system for fire protection projects.

## Project Overview

This application facilitates the process of submitting (by clients) and reviewing (by admins) PDFs for fire protection systems.

- **Clients**: Upload and submit PDF documents, download final submissions
- **Admins**: Review, manage, and approve/reject submissions
- **Authentication**: Password protected with role-based access

## Tech Stack

- **Framework**: [Astro](https://astro.build)
- **Database**: [Supabase](https://supabase.com)
- **Styling**: Tailwind CSS + Flowbite
- **Icons**: BoxIcons
- **⚠️ NO REACT**: Uses vanilla JS/TypeScript only

## Quick Reference

- 📋 **Project Scope**: See `scope.md` for detailed requirements
- 🔧 **Email Setup**: See `EMAIL_SETUP.md` for email configuration
- 🚀 **Development**: `npm run dev`
- 🎨 **Email Testing**: Visit `/api/send-react-email`

## Database Schema

Key tables: `projects`, `files`, `profiles`

- Run SQL in `scope.md` to get current schema
- Remember: `author_id` is UUID, `id` fields are integers

#!/bin/bash

# SiteLink Logistics - Install Additional Dependencies
# Run this script after the initial Next.js setup

echo "📦 Installing additional dependencies..."

# Supabase SSR package (updated version)
npm install @supabase/ssr

# Validation and forms
npm install zod @hookform/resolvers react-hook-form

# Date handling
npm install date-fns

# State management (optional, for real-time features)
npm install zustand

echo "✅ All dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Make sure your .env.local file has Supabase credentials"
echo "2. Run 'npm run dev' to start the development server"

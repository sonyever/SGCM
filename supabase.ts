import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bluvwvpqkvtseqngnfwc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsdXZ3dnBxa3Z0c2VxbmduZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDk4MjAsImV4cCI6MjA4MDE4NTgyMH0.Fm7TuU5X3jladE7--CHpGv6oaTwmI5n8EA8Rz4OhSzM';

export const supabase = createClient(supabaseUrl, supabaseKey);

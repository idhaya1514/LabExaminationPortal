-- Create staffs table
CREATE TABLE IF NOT EXISTS public.staffs (
    id SERIAL PRIMARY KEY,
    staff_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mapping table for staff and assigned students
CREATE TABLE IF NOT EXISTS public.staff_students (
    id SERIAL PRIMARY KEY,
    staff_id TEXT NOT NULL REFERENCES public.staffs(staff_id) ON DELETE CASCADE,
    student_register_number TEXT NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (staff_id, student_register_number)
);

-- Set up Row Level Security (RLS) policies
ALTER TABLE public.staffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on staffs" ON public.staffs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on staffs" ON public.staffs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on staffs" ON public.staffs FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on staff_students" ON public.staff_students FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on staff_students" ON public.staff_students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access on staff_students" ON public.staff_students FOR DELETE USING (true);

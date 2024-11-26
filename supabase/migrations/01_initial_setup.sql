-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    pin TEXT NOT NULL CHECK (length(pin) = 6),
    category TEXT NOT NULL CHECK (category IN ('C2', 'C1', 'B2', 'B1', 'A2', 'A1')),
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create assignments table
CREATE TABLE public.assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL CHECK (subject IN ('Communication', 'SAE', 'Anglais', 'Informatique', 'Management', 'Marketing')),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('global', 'group', 'personal')),
    target_groups TEXT[] DEFAULT ARRAY[]::TEXT[],
    target_users UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.assignments TO anon;
GRANT ALL ON public.assignments TO authenticated;

-- Users policies
CREATE POLICY "Public read access for users" ON public.users
    FOR SELECT TO public
    USING (true);

CREATE POLICY "Enable insert for authentication" ON public.users
    FOR INSERT TO public
    WITH CHECK (true);

CREATE POLICY "Enable update for users" ON public.users
    FOR UPDATE TO public
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for admin users" ON public.users
    FOR DELETE TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()::uuid
            AND users.role = 'admin'
        )
    );

-- Assignments policies
CREATE POLICY "Enable read access for assignments" ON public.assignments
    FOR SELECT TO public
    USING (
        target_type = 'global'
        OR (target_type = 'group' AND EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()::uuid
            AND users.category = ANY(assignments.target_groups)
        ))
        OR (target_type = 'personal' AND auth.uid()::uuid = ANY(target_users))
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()::uuid
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Enable insert for assignments" ON public.assignments
    FOR INSERT TO public
    WITH CHECK (true);

CREATE POLICY "Enable update for assignments" ON public.assignments
    FOR UPDATE TO public
    USING (
        created_by = auth.uid()::uuid
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()::uuid
            AND users.role = 'admin'
        )
    );

-- Create default admin user
INSERT INTO public.users (username, pin, category, role)
VALUES ('admin', '123456', 'C2', 'admin');

-- Create indexes
CREATE INDEX idx_assignments_created_by ON public.assignments(created_by);
CREATE INDEX idx_assignments_target_type ON public.assignments(target_type);
CREATE INDEX idx_assignments_due_date ON public.assignments(due_date);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_role ON public.users(role);
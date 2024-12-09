-- Create completions table
CREATE TABLE IF NOT EXISTS public.completions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(assignment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.completions TO authenticated;
GRANT ALL ON public.completions TO anon;

-- Create policies
CREATE POLICY "Enable read access for all completions" ON public.completions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for own completions" ON public.completions
    FOR INSERT WITH CHECK (
        auth.uid()::uuid = user_id
        AND EXISTS (
            SELECT 1 FROM assignments a
            WHERE a.id = assignment_id
            AND (
                a.target_type = 'global'
                OR (a.target_type = 'group' AND EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid()::uuid
                    AND u.category = ANY(a.target_groups)
                ))
                OR (a.target_type = 'personal' AND auth.uid()::uuid = ANY(a.target_users))
            )
        )
    );

CREATE POLICY "Enable delete for own completions" ON public.completions
    FOR DELETE USING (auth.uid()::uuid = user_id);

-- Create indexes
CREATE INDEX idx_completions_assignment_id ON public.completions(assignment_id);
CREATE INDEX idx_completions_user_id ON public.completions(user_id); 
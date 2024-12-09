-- Create archived_assignments table
CREATE TABLE IF NOT EXISTS public.archived_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    completion_rate DECIMAL NOT NULL,
    archived_by UUID REFERENCES public.users(id),
    UNIQUE(assignment_id)
);

-- Enable RLS
ALTER TABLE public.archived_assignments ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.archived_assignments TO authenticated;
GRANT ALL ON public.archived_assignments TO anon;

-- Create policies
CREATE POLICY "Enable read access for all archived assignments" ON public.archived_assignments
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for admins" ON public.archived_assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Enable delete for admins" ON public.archived_assignments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Add is_archived column to assignments table
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Create function to automatically archive assignments
CREATE OR REPLACE FUNCTION check_and_archive_assignment()
RETURNS TRIGGER AS $$
DECLARE
    total_users INTEGER;
    completion_count INTEGER;
    completion_rate DECIMAL;
    target_users_count INTEGER;
BEGIN
    -- Get the assignment details
    WITH assignment_details AS (
        SELECT 
            a.id,
            a.target_type,
            a.target_groups,
            a.target_users,
            COUNT(DISTINCT c.user_id) as completed_count
        FROM 
            assignments a
            LEFT JOIN completions c ON c.assignment_id = a.id
        WHERE 
            a.id = NEW.assignment_id
        GROUP BY 
            a.id, a.target_type, a.target_groups, a.target_users
    )
    SELECT 
        CASE
            WHEN ad.target_type = 'global' THEN (SELECT COUNT(*) FROM users)
            WHEN ad.target_type = 'group' THEN (
                SELECT COUNT(*) FROM users 
                WHERE category = ANY(ad.target_groups)
            )
            ELSE array_length(ad.target_users, 1)
        END as total_users,
        ad.completed_count
    INTO
        target_users_count,
        completion_count
    FROM 
        assignment_details ad;

    -- Calculate completion rate
    completion_rate := CASE 
        WHEN target_users_count > 0 
        THEN (completion_count::DECIMAL / target_users_count::DECIMAL) * 100
        ELSE 0
    END;

    -- If completion rate is over 70%, archive the assignment
    IF completion_rate >= 70 AND NOT EXISTS (
        SELECT 1 FROM archived_assignments 
        WHERE assignment_id = NEW.assignment_id
    ) THEN
        INSERT INTO archived_assignments (
            assignment_id,
            completion_rate,
            archived_by
        ) VALUES (
            NEW.assignment_id,
            completion_rate,
            NEW.user_id
        );

        -- Update the assignment's is_archived status
        UPDATE assignments 
        SET is_archived = true 
        WHERE id = NEW.assignment_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check completion rate after each new completion
CREATE TRIGGER check_completion_rate
    AFTER INSERT ON completions
    FOR EACH ROW
    EXECUTE FUNCTION check_and_archive_assignment();

-- Create indexes
CREATE INDEX idx_archived_assignments_assignment_id ON public.archived_assignments(assignment_id);
CREATE INDEX idx_archived_assignments_archived_at ON public.archived_assignments(archived_at);
CREATE INDEX idx_assignments_is_archived ON public.assignments(is_archived); 
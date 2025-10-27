-- Allow users to view transcripts for test call logs they have access to
CREATE POLICY "Users can view transcripts for test call logs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'call-transcripts' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM test_call_logs tcl
    JOIN onboarding_responses orr ON tcl.agent_id = orr.id
    WHERE tcl.transcript_file_path = storage.objects.name
      AND (
        -- User has access to the project
        (orr.project_id IS NOT NULL AND can_access_project(auth.uid(), orr.project_id))
        OR
        -- Or it's a personal agent (no project)
        (orr.project_id IS NULL AND auth.uid() = orr.user_id)
      )
  )
);
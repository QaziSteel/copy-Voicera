import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";
import { useToast } from "@/hooks/use-toast";

export const EmailConfirmationHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshProjects, switchProject } = useProject();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        // Get the invitation token from URL if present
        const invitationToken = searchParams.get('token');
        
        console.log('Email confirmation handler - invitation token:', invitationToken);

        // If there's an invitation token, accept it
        if (invitationToken) {
          console.log('Processing invitation acceptance...');
          
          const { data, error } = await supabase.functions.invoke('accept-project-invite', {
            body: { token: invitationToken }
          });

          if (error) {
            console.error('Error accepting invitation:', error);
            toast({
              title: "Error joining project",
              description: error.message || "Failed to join the project. Please try again.",
              variant: "destructive",
            });
            navigate('/dashboard');
            return;
          }

          console.log('Invitation accepted successfully:', data);

          // Refresh projects to get the newly joined project
          await refreshProjects();

          // Switch to the new project if project_id is returned
          if (data?.project_id) {
            await switchProject(data.project_id);
          }

          toast({
            title: "Welcome!",
            description: "You've successfully joined the project.",
          });

          // Redirect to dashboard (skip onboarding)
          navigate('/dashboard', { replace: true });
        } else {
          // No invitation token, just redirect to normal flow
          console.log('No invitation token, redirecting to index');
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Error in email confirmation handler:', error);
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
        navigate('/dashboard');
      } finally {
        setProcessing(false);
      }
    };

    handleConfirmation();
  }, [searchParams, navigate, refreshProjects, switchProject, toast]);

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg text-muted-foreground">Completing your registration...</p>
        </div>
      </div>
    );
  }

  return null;
};

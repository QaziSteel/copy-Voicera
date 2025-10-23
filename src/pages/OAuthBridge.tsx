import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const OAuthBridge = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    try {
      // Parse hash parameters
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      
      const type = params.get('type');
      const email = params.get('email');
      const agentId = params.get('agentId');
      const flow = params.get('flow');
      const error = params.get('error');

      if (!window.opener) {
        setStatus('error');
        setMessage('No parent window found. Please close this window and try again.');
        return;
      }

      if (type === 'OAUTH_SUCCESS') {
        setStatus('success');
        setMessage(`Successfully connected to Google Calendar${email ? ` as ${email}` : ''}!`);
        
        // Send success message to parent
        window.opener.postMessage(
          {
            type: 'OAUTH_SUCCESS',
            email,
            agentId,
            flow,
          },
          window.location.origin
        );
      } else if (type === 'OAUTH_ERROR') {
        setStatus('error');
        setMessage(error || 'OAuth authentication failed');
        
        // Send error message to parent
        window.opener.postMessage(
          {
            type: 'OAUTH_ERROR',
            error: error || 'OAuth authentication failed',
            flow,
          },
          window.location.origin
        );
      } else {
        setStatus('error');
        setMessage('Invalid OAuth callback parameters');
      }

      // Attempt to close the window after a brief delay
      setTimeout(() => {
        try {
          window.close();
        } catch (e) {
          // If auto-close fails, user will see the manual instruction
          console.log('Auto-close failed, showing manual instruction');
        }
      }, 1000);
    } catch (error) {
      console.error('Error processing OAuth callback:', error);
      setStatus('error');
      setMessage('An error occurred processing the OAuth callback');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-6">
        {status === 'processing' && (
          <>
            <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin" />
            <h2 className="text-2xl font-semibold">{message}</h2>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
            <h2 className="text-2xl font-semibold">Success!</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground mt-4">
              This window will close automatically. If it doesn't, please close it manually.
            </p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 mx-auto text-destructive" />
            <h2 className="text-2xl font-semibold">Error</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground mt-4">
              Please close this window and try again.
            </p>
          </>
        )}
      </Card>
    </div>
  );
};

export default OAuthBridge;

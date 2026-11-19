import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, Store } from 'lucide-react';
import { Button } from '@dashboard/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@dashboard/components/ui/card';
import { Input } from '@dashboard/components/ui/input';
import { Label } from '@dashboard/components/ui/label';
import { useToast } from '@dashboard/hooks/use-toast';
import { completeShopify, connectShopify, useShopifyConnection } from '@dashboard/hooks/useShopifyConnection';
import { formatDateTime } from '@dashboard/lib/format';

export function ShopifyConnectionCard() {
  const [approval] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('shopify_callback'));
  const [completing, setCompleting] = useState(!!approval);
  const completionStarted = useRef(false);
  const { data, isLoading, error, refetch, isFetching } = useShopifyConnection(!completing);
  const { toast } = useToast();
  const [shop, setShop] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [callbackResult, setCallbackResult] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has('shopify_error') ? 'error' : params.get('shopify_connected');
  });
  const connection = data?.connection;
  const connected = data?.state === 'connected';

  useEffect(() => {
    const url = new URL(window.location.href);
    if (approval || url.searchParams.has('shopify_connected') || url.searchParams.has('shopify_error')) {
      url.searchParams.delete('shopify_connected');
      url.searchParams.delete('shopify_error');
      if (approval) url.hash = '';
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }
  }, [approval]);
  useEffect(() => {
    if (!approval || completionStarted.current) return;
    completionStarted.current = true;
    void (async () => {
      try {
        await completeShopify(approval);
        const checked = await refetch();
        if (checked.error) throw checked.error;
        if (checked.data?.state !== 'connected') throw new Error('Shopify access could not be verified. Please connect again.');
        toast({ title: 'Shopify connected', description: 'Vouch verified access to your store.' });
      } catch (error) {
        setConnectError(error instanceof Error ? error.message : 'Could not complete Shopify authorization. Please connect again.');
      } finally {
        setCompleting(false);
      }
    })();
  }, [approval, refetch, toast]);
  useEffect(() => {
    if (callbackResult === '1' && connected && !error && !isFetching) {
      toast({ title: 'Shopify connected', description: 'Vouch verified access to your store.' });
      setCallbackResult(null);
    }
  }, [callbackResult, connected, error, isFetching, toast]);

  async function connect(domain: string) {
    setConnecting(true);
    setConnectError(null);
    setCallbackResult(null);
    try {
      await connectShopify(domain);
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : 'Could not connect Shopify.');
      setConnecting(false);
    }
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='text-sm flex items-center gap-2'>
          <Store className='w-4 h-4' />Shopify connection
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <p className='text-xs text-muted-foreground'>Connecting verifies access to this store’s products. Post to Pay checkout and payment compatibility are checked separately before activation.</p>
        {completing || isLoading
          ? (
            <p className='text-sm flex items-center gap-2' role='status'>
              <Loader2 className='w-4 h-4 animate-spin' />{completing ? 'Finishing Shopify connection…' : 'Checking Shopify…'}
            </p>
          )
          : error
          ? (
            <div role='alert' className='space-y-2'>
              <p className='text-sm'>{error.message}</p>
              <Button
                variant='outline'
                size='sm'
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                Try again
              </Button>
            </div>
          )
          : connection
          ? (
            <>
              <p className='text-sm font-medium flex items-center gap-2'>
                {connected && <CheckCircle2 className='w-4 h-4 text-success' />}
                {connected
                  ? 'Connected to'
                  : data.state === 'disconnected'
                  ? 'Disconnected from'
                  : 'Reconnect'} {connection.shop_name || connection.shop_domain}
              </p>
              <p className='text-xs text-muted-foreground'>
                {connection.shop_domain}
                {connection.shop_currency && ` · ${connection.shop_currency}`}
              </p>
              {!connected && (
                <p className='text-sm'>
                  Shopify authorization is needed before Vouch can access this store.
                </p>
              )}
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  variant={connected ? 'outline' : 'default'}
                  disabled={connecting || isFetching}
                  onClick={() => void connect(connection.shop_domain)}
                >
                  {connecting ? 'Opening Shopify…' : 'Reconnect Shopify'}
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  disabled={isFetching || connecting}
                  onClick={() => void refetch()}
                >
                  {isFetching ? 'Checking…' : 'Check connection'}
                </Button>
              </div>
              {connected && (
                <p className='text-xs text-muted-foreground'>
                  {connection.last_webhook_at
                    ? `Last store notification received ${
                      formatDateTime(connection.last_webhook_at)
                    }.`
                    : 'No store notifications received yet.'}
                </p>
              )}
            </>
          )
          : (
            <form
              className='space-y-3'
              onSubmit={(event) => {
                event.preventDefault();
                void connect(shop);
              }}
            >
              <p className='text-sm text-muted-foreground'>
                Link your Shopify storefront so Vouch can access its products. Shopify will ask you
                to approve access.
              </p>
              <div className='space-y-1'>
                <Label htmlFor='shopify-store'>Shopify store address</Label>
                <Input
                  id='shopify-store'
                  aria-describedby='shopify-store-help'
                  placeholder='your-store.myshopify.com'
                  autoComplete='off'
                  value={shop}
                  onChange={(event) => setShop(event.target.value)}
                  required
                  disabled={connecting}
                />
                <p id='shopify-store-help' className='text-xs text-muted-foreground'>Use your Shopify .myshopify.com address, even if customers visit a custom domain.</p>
              </div>
              <Button type='submit' size='sm' disabled={connecting || !shop.trim()}>
                {connecting ? 'Opening Shopify…' : 'Connect Shopify'}
              </Button>
            </form>
          )}
        {(connectError || callbackResult === 'error') && (
          <p className='text-sm text-destructive' role='alert'>
            {connectError ?? 'Shopify authorization could not be completed. Please connect again.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

import { calculatePostToPayQuote } from '@/lib/postToPayDiscount';
import { useState, useRef, useEffect } from 'react';
import { CheckoutProgressIndicator, CheckoutStep } from './CheckoutProgressIndicator';
import { PlatformSelector } from './PlatformSelector';
import { UsernameInput } from './UsernameInput';
import { EligibilityCheck } from './EligibilityCheck';
import { ContactPaymentForm } from './ContactPaymentForm';
import { ConfirmationStep } from './ConfirmationStep';
import { PayWithPostButton } from './PayWithPostButton';
import { SocialPlatform, CheckoutSession, CheckoutBrand } from '@/types/vouch';
import { lookupUsername } from '@/lib/checkoutMockData';
import { checkEligibility } from '@/lib/eligibilityCheck';
import iconWhite from '@/assets/icon-white.png';

interface VouchCheckoutInlineProps {
  brand: CheckoutBrand;
  orderTotal: number;
  excludeFromClickOutside?: React.RefObject<HTMLElement | null>;
  onExpand?: () => void;
}

export function VouchCheckoutInline({
  brand,
  orderTotal,
  excludeFromClickOutside,
  onExpand,
}: VouchCheckoutInlineProps) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState<CheckoutStep>('platform');
  const [session, setSession] = useState<CheckoutSession>({
    platform: null,
    username: '',
    accountStats: null,
    isEligible: false,
    eligibilityReasons: [],
    email: '',
    phone: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const quote = calculatePostToPayQuote(session.accountStats?.followers ?? 0, orderTotal, session.isEligible);

  // Click outside to collapse and reset
  useEffect(() => {
    if (!started) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideContainer = containerRef.current?.contains(target);
      const isInsideExcluded = excludeFromClickOutside?.current?.contains(target);
      
      if (!isInsideContainer && !isInsideExcluded) {
        resetSession();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [started, excludeFromClickOutside]);

  const resetSession = () => {
    setSession({
      platform: null,
      username: '',
      accountStats: null,
      isEligible: false,
      eligibilityReasons: [],
      email: '',
      phone: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvc: '',
    });
    setStep('platform');
    setOrderId(null);
    setStarted(false);
  };

  const handlePlatformSelect = (platform: SocialPlatform) => {
    setSession((prev) => ({ ...prev, platform }));
    setStep('username');
  };

  const handleUsernameSubmit = async (username: string) => {
    setSession((prev) => ({ ...prev, username }));
    setIsLoading(true);

    try {
      const stats = await lookupUsername(username, session.platform || 'instagram');
      
      if (stats) {
        const eligibility = checkEligibility(stats, brand.requirements);
        setSession((prev) => ({
          ...prev,
          accountStats: stats,
          isEligible: eligibility.eligible,
          eligibilityReasons: eligibility.reasons,
        }));
      } else {
        setSession((prev) => ({
          ...prev,
          accountStats: null,
          isEligible: false,
          eligibilityReasons: ['Could not find this account. Please check the username and try again.'],
        }));
      }
      
      setStep('verify');
    } catch (error) {
      console.error('Error looking up username:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyContinue = () => {
    setStep('details');
  };

  const handleTryDifferent = () => {
    setSession((prev) => ({
      ...prev,
      username: '',
      accountStats: null,
      isEligible: false,
      eligibilityReasons: [],
    }));
    setStep('username');
  };

  const handleUseOtherPayment = () => {
    resetSession();
  };

  const handleContactPaymentSubmit = (data: {
    email: string;
    phone: string;
    cardNumber: string;
    cardExpiry: string;
    cardCvc: string;
  }) => {
    setSession((prev) => ({ ...prev, ...data }));
    const mockOrderId = `VCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setOrderId(mockOrderId);
    setStep('confirm');
  };

  const handleBackToPlatform = () => {
    setSession((prev) => ({ ...prev, platform: null }));
    setStep('platform');
  };

  const handleBackToVerify = () => {
    setStep('verify');
  };

  if (!started) {
    return <PayWithPostButton onClick={() => {
      setStarted(true);
      onExpand?.();
    }} />;
  }

  return (
    <div ref={containerRef} className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2 vouch-gradient">
        <img src={iconWhite} alt="Vouch" className="h-4 w-4" />
        <span className="text-sm font-semibold text-white">Post to Pay</span>
      </div>
      
      <div className="p-4">
      
      {step !== 'confirm' && (
        <CheckoutProgressIndicator currentStep={step} />
      )}

      {step === 'platform' && (
        <PlatformSelector onSelect={handlePlatformSelect} />
      )}

      {step === 'username' && session.platform && (
        <UsernameInput
          platform={session.platform}
          requirements={brand.requirements}
          onSubmit={handleUsernameSubmit}
          onBack={handleBackToPlatform}
          isLoading={isLoading}
        />
      )}

      {step === 'verify' && session.platform && session.accountStats && (
        <EligibilityCheck
          quote={quote}
          platform={session.platform}
          username={session.username}
          stats={session.accountStats}
          isEligible={session.isEligible}
          reasons={session.eligibilityReasons}
          onContinue={handleVerifyContinue}
          onTryDifferent={handleTryDifferent}
          onUseOtherPayment={handleUseOtherPayment}
        />
      )}

      {step === 'verify' && !session.accountStats && (
        <EligibilityCheck
          quote={quote}
          platform={session.platform!}
          username={session.username}
          stats={{
            followers: 0,
            engagementRate: 0,
            sponsoredPosts30d: 0,
            verified: false,
            profileImageUrl: null,
            displayName: null,
          }}
          isEligible={false}
          reasons={session.eligibilityReasons}
          onContinue={handleVerifyContinue}
          onTryDifferent={handleTryDifferent}
          onUseOtherPayment={handleUseOtherPayment}
        />
      )}

      {step === 'details' && session.platform && (
        <ContactPaymentForm
          platform={session.platform}
          brand={brand}
          quote={quote}
          onSubmit={handleContactPaymentSubmit}
          onBack={handleBackToVerify}
        />
      )}

      {step === 'confirm' && orderId && session.platform && (
        <ConfirmationStep
          quote={quote}
          orderId={orderId}
          platform={session.platform}
          username={session.username}
          brand={brand}
          onClose={resetSession}
        />
      )}
      </div>
    </div>
  );
}

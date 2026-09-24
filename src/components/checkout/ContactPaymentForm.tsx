import { DiscountSummary } from './DiscountSummary';
import { PostToPayQuote } from '@/lib/postToPayDiscount';
import { useState } from 'react';
import { ArrowLeft, CreditCard, Mail, Phone, AlertCircle, Clock, Tag, Camera } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SocialPlatform, CheckoutBrand } from '@/types/vouch';
import { cn } from '@/lib/utils';

interface ContactPaymentFormProps {
  platform: SocialPlatform;
  brand: CheckoutBrand;
  quote: PostToPayQuote;
  onSubmit: (data: { email: string; phone: string; cardNumber: string; cardExpiry: string; cardCvc: string }) => void;
  onBack: () => void;
}

export function ContactPaymentForm({
  platform,
  brand,
  quote,
  onSubmit,
  onBack,
}: ContactPaymentFormProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [consentToBoost, setConsentToBoost] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const brandHandle = platform === 'instagram' ? brand.instagramUsername : brand.tiktokUsername;

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    return cleaned;
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    if (cleaned.length >= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length >= 3) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    }
    return cleaned;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    // Only validate fields if they have partial input
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone && cleanPhone.length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    const cleanCard = cardNumber.replace(/\s/g, '');
    if (cleanCard && cleanCard.length < 13) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }
    
    if (cardExpiry && !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      newErrors.cardExpiry = 'MM/YY';
    }
    
    if (cardCvc && cardCvc.length > 0 && cardCvc.length < 3) {
      newErrors.cardCvc = 'Invalid';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the Terms of Service';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ email, phone, cardNumber, cardExpiry, cardCvc });
    }
  };

  return (
    <div className="space-y-3">
      {/* Compact Info Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground whitespace-nowrap">Post in 72h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">@{brandHandle}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Camera className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">Photo/Video</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Post within 72 hours of delivery to keep your {quote.discountPercent.toLocaleString('en-US', { maximumFractionDigits: 2 })}% discount.
        </p>
      </div>

      <DiscountSummary quote={quote} />

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="email" className="flex items-center gap-1.5 text-xs">
            <Mail className="h-3.5 w-3.5" />
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn("h-9 text-sm", errors.email && 'border-destructive')}
          />
          {errors.email && (
            <p className="text-[10px] text-destructive flex items-center gap-1">
              <AlertCircle className="h-2.5 w-2.5" />
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="phone" className="flex items-center gap-1.5 text-xs">
            <Phone className="h-3.5 w-3.5" />
            Phone
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            className={cn("h-9 text-sm", errors.phone && 'border-destructive')}
          />
          {errors.phone && (
            <p className="text-[10px] text-destructive flex items-center gap-1">
              <AlertCircle className="h-2.5 w-2.5" />
              {errors.phone}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="cardNumber" className="flex items-center gap-1.5 text-xs">
            <CreditCard className="h-3.5 w-3.5" />
            Card Number
            <span className="text-[10px] text-muted-foreground font-normal">{quote.amountDue === 0 ? '(backup)' : '(payment & backup)'}</span>
          </Label>
          <Input
            id="cardNumber"
            type="text"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            className={cn("h-9 text-sm", errors.cardNumber && 'border-destructive')}
          />
          {errors.cardNumber && (
            <p className="text-[10px] text-destructive flex items-center gap-1">
              <AlertCircle className="h-2.5 w-2.5" />
              {errors.cardNumber}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="cardExpiry" className="text-xs">Expiry</Label>
            <Input
              id="cardExpiry"
              type="text"
              placeholder="MM/YY"
              value={cardExpiry}
              onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
              className={cn("h-9 text-sm", errors.cardExpiry && 'border-destructive')}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cardCvc" className="text-xs">CVC</Label>
            <Input
              id="cardCvc"
              type="text"
              placeholder="123"
              value={cardCvc}
              onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className={cn("h-9 text-sm", errors.cardCvc && 'border-destructive')}
            />
          </div>
        </div>

        {/* Terms of Service */}
        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
              className={cn("mt-0.5", errors.terms && "border-destructive")}
            />
            <label htmlFor="terms" className="text-[11px] text-muted-foreground leading-tight cursor-pointer">
              I have read and agree to the{' '}
              <a href="#" onClick={(e) => e.preventDefault()} className="text-primary underline hover:text-primary/80">
                Terms of Service
              </a>
            </label>
          </div>
          {errors.terms && (
            <p className="text-[10px] text-destructive flex items-center gap-1 ml-6">
              <AlertCircle className="h-2.5 w-2.5" />
              {errors.terms}
            </p>
          )}
          <div className="flex items-start gap-2 mt-1.5">
            <Checkbox
              id="consent-boost"
              checked={consentToBoost}
              onCheckedChange={(checked) => setConsentToBoost(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="consent-boost" className="text-[11px] text-muted-foreground leading-tight cursor-pointer">
              I consent to the brand boosting and/or reposting my content to increase views.
            </label>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1 h-9 text-sm">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back
          </Button>
          <Button type="submit" className="flex-1 h-9 text-sm">
            Complete Order
          </Button>
        </div>
      </form>
    </div>
  );
}

import React from 'react';
import { Sparkles, Lock } from 'lucide-react';
import { usePlan } from '../context/PlanContext';

interface ProBadgeProps {
  featureTitle?: string;
  featureDesc?: string;
  size?: 'sm' | 'md' | 'xs';
  showLockOnFree?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const ProBadge: React.FC<ProBadgeProps> = ({
  featureTitle,
  featureDesc,
  size = 'xs',
  showLockOnFree = true,
  className = '',
  onClick,
}) => {
  const { isPro, openUpgradeModal } = usePlan();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    } else if (!isPro) {
      openUpgradeModal({
        title: featureTitle || 'G-Deck Pro Automation',
        desc: featureDesc || 'Upgrade to G-Deck Pro for $12/month to unlock this cross-tool workflow.',
      });
    }
  };

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-0.5 font-bold tracking-wide',
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-bold tracking-wide',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
  };

  return (
    <span
      onClick={handleClick}
      title={
        isPro
          ? `G-Deck Pro Feature (${featureTitle || 'Included in your plan'})`
          : `G-Deck Pro ($12/mo): Click to unlock ${featureTitle || 'this feature'}`
      }
      className={`inline-flex items-center rounded-full border select-none transition-all cursor-pointer ${
        isPro
          ? 'bg-[#f3e8ff] text-[#7e22ce] border-[#d8b4fe] hover:bg-[#ebd5ff]'
          : 'bg-[#faf5ff] text-[#6b21a8] border-[#e9d5ff] hover:bg-[#f3e8ff] hover:border-[#c084fc] shadow-2xs'
      } ${sizeClasses[size]} ${className}`}
    >
      {!isPro && showLockOnFree ? (
        <Lock className="w-2.5 h-2.5 shrink-0 opacity-80" />
      ) : (
        <Sparkles className="w-2.5 h-2.5 shrink-0 fill-current opacity-75" />
      )}
      <span>PRO</span>
    </span>
  );
};

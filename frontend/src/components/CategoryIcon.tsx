import React from 'react';
import {
  Coffee,
  UtensilsCrossed,
  Bus,
  ShoppingCart,
  ShoppingBag,
  Receipt,
  Film,
  HeartPulse,
  Tag,
  Home,
  Zap,
  LucideProps,
} from 'lucide-react';
import { ExpenseCategory } from '../types';
import { CATEGORIES } from '../utils/constants';

interface CategoryIconProps extends LucideProps {
  category: ExpenseCategory;
  size?: number;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size = 18,
  className = '',
  ...props
}) => {
  const iconProps = { size, className, ...props };

  switch (category) {
    case 'housing':
      return <Home {...iconProps} />;
    case 'utilities':
      return <Zap {...iconProps} />;
    case 'dining_out':
    case 'food':
      return <UtensilsCrossed {...iconProps} />;
    case 'coffee':
      return <Coffee {...iconProps} />;
    case 'transport':
      return <Bus {...iconProps} />;
    case 'groceries':
      return <ShoppingCart {...iconProps} />;
    case 'shopping':
      return <ShoppingBag {...iconProps} />;
    case 'bills':
      return <Receipt {...iconProps} />;
    case 'entertainment':
      return <Film {...iconProps} />;
    case 'health':
      return <HeartPulse {...iconProps} />;
    case 'other':
    default:
      return <Tag {...iconProps} />;
  }
};

interface CategoryBadgeProps {
  category: ExpenseCategory;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  showLabel = true,
  size = 'md',
}) => {
  const meta = CATEGORIES[category] || CATEGORIES.other;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs font-medium px-2.5 py-1 gap-2',
    lg: 'text-sm font-medium px-3 py-1.5 gap-2.5',
  }[size];

  const iconSizes = {
    sm: 13,
    md: 15,
    lg: 18,
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium whitespace-nowrap transition-colors ${sizeClasses}`}
      style={{
        backgroundColor: meta.bgLight,
        color: meta.color,
        border: `1px solid ${meta.borderColor}`,
      }}
    >
      <CategoryIcon category={category} size={iconSizes} />
      {showLabel && <span>{meta.label}</span>}
    </span>
  );
};

import { User, Job, Material } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { PRICING } from '@/lib/utils/constants';

// This file should have no TypeScript errors
const testUser: User = {
  id: '123',
  email: 'test@example.com',
  phone: '0712345678',
  full_name: 'Test User',
  role: 'client',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

console.log('Base fee:', formatCurrency(PRICING.BASE_FEE_AMOUNT));
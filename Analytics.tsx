import React from 'react';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  ShoppingBagIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface AnalyticsProps {
  revenue: number;
  orders: number;
  products: number;
  customers: number;
  revenueChange: number;
  ordersChange: number;
}

export const Analytics: React.FC<AnalyticsProps> = ({
  revenue,
  orders,
  products,
  customers,
  revenueChange,
  ordersChange
}) => {
  const stats = [
    {
      label: 'Total Revenue',
      value: `$${revenue.toFixed(2)}`,
      change: revenueChange,
      icon: CurrencyDollarIcon,
      color: 'blue'
    },
    {
      label: 'Total Orders',
      value: orders.toString(),
      change: ordersChange,
      icon: ShoppingBagIcon,
      color: 'green'
    },
    {
      label: 'Products',
      value: products.toString(),
      change: 5.2,
      icon: ChartBarIcon,
      color: 'purple'
    },
    {
      label: 'Customers',
      value: customers.toString(),
      change: 3.8,
      icon: UsersIcon,
      color: 'orange'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-${stat.color}-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              <div className="flex items-center mt-2">
                {stat.change > 0 ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-xs ${stat.change > 0 ? 'text-green-600' : 'text-red-600'} ml-1`}>
                  {Math.abs(stat.change)}% from last month
                </span>
              </div>
            </div>
            <div className={`h-12 w-12 bg-${stat.color}-100 rounded-full flex items-center justify-center`}>
              <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
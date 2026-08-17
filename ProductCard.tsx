import React, { useState } from 'react';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const auth = useAuth();
  const isWholesaler = (auth as any).isWholesaler ?? false;
  const { loading } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const displayPrice = isWholesaler ? product.wholesalePrice : product.price;

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await onAddToCart(product.id);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const isOutOfStock = product.stock < product.minOrderQty;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 bg-gray-100">
        <img 
          src={product.image || 'https://via.placeholder.com/1087'} 
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1087';
          }}
        />
        {isOutOfStock && (
          <span className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
            Out of Stock
          </span>
        )}
        {isWholesaler && (
          <span className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
            Wholesale
          </span>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs text-gray-500 font-medium">{product.sku}</span>
            <h3 className="text-lg font-semibold text-gray-800 mt-1">{product.name}</h3>
          </div>
          <span className="inline-block px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded">
            {product.category}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.description}</p>
        
        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">${displayPrice.toFixed(2)}</span>
            {isWholesaler && product.wholesalePrice < product.price && (
              <span className="ml-2 text-xs text-gray-400 line-through">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Stock: {product.stock} units
          </div>
        </div>
        
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Min order: {product.minOrderQty}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding || loading}
            className={`ml-auto px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${!isOutOfStock && !isAdding
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            {isAdding ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};
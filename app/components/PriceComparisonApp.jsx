'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Save, Trash2, AlertCircle } from 'lucide-react';

// Conversion rates for different units
const CONVERSIONS = {
  volume: {
    ml: 1,
    L: 1000,
    'fl oz': 29.5735,
    ga: 3785.41
  },
  weight: {
    g: 1,
    kg: 1000,
    oz: 28.3495,
    lb: 453.592
  },
  count: {
    pc: 1,
    dozen: 12
  }
};

// Unit types grouping
const UNIT_TYPES = {
  volume: ['ml', 'L', 'fl oz', 'ga'],
  weight: ['g', 'kg', 'oz', 'lb'],
  count: ['pc', 'dozen']
};

const PriceComparisonApp = () => {
  // State management for items being compared
  const [items, setItems] = useState([
    { id: 1, name: '', price: '', amount: '', unit: 'ml', unitType: 'volume' },
    { id: 2, name: '', price: '', amount: '', unit: 'ml', unitType: 'volume' }
  ]);

  // State for saved comparisons
  const [savedComparisons, setSavedComparisons] = useState(() => {
    const saved = localStorage.getItem('savedComparisons');
    return saved ? JSON.parse(saved) : [];
  });

  // State for error messages
  const [errors, setErrors] = useState({});

  // Convert all values to base unit for comparison
  const convertToBase = useCallback((amount, unit, unitType) => {
    const value = parseFloat(amount);
    if (isNaN(value)) return 0;
    return value * CONVERSIONS[unitType][unit];
  }, []);

  // Calculate price per unit and find best value
  const calculations = useMemo(() => {
    const results = items.map(item => {
      if (!item.price || !item.amount) return null;

      const baseAmount = convertToBase(item.amount, item.unit, item.unitType);
      const price = parseFloat(item.price);
      if (baseAmount === 0 || isNaN(price)) return null;

      return {
        ...item,
        pricePerUnit: price / baseAmount
      };
    }).filter(Boolean);

    if (results.length === 0) return { results: [], bestValue: null };

    const bestValue = results.reduce((prev, curr) => 
      prev.pricePerUnit < curr.pricePerUnit ? prev : curr
    );

    return {
      results: results.map(result => ({
        ...result,
        percentageDiff: ((result.pricePerUnit - bestValue.pricePerUnit) / bestValue.pricePerUnit * 100).toFixed(2)
      })),
      bestValue
    };
  }, [items, convertToBase]);

  // Handle input changes
  const handleChange = useCallback((id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      // Handle unit type change
      if (field === 'unitType') {
        return {
          ...item,
          [field]: value,
          unit: UNIT_TYPES[value][0]
        };
      }

      // Handle price validation
      if (field === 'price' && value !== '') {
        const priceRegex = /^\$?\d*\.?\d*$/;
        if (!priceRegex.test(value.replace('$', ''))) return item;
        value = value.replace('$', '');
      }

      return { ...item, [field]: value };
    }));

    // Clear errors when user starts typing
    setErrors(prev => ({
      ...prev,
      [id]: undefined
    }));
  }, []);

  // Save comparison to localStorage
  const saveComparison = useCallback(() => {
    // Validate inputs
    const newErrors = {};
    items.forEach(item => {
      if (!item.name || !item.price || !item.amount) {
        newErrors[item.id] = 'All fields are required';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const comparison = {
      id: Date.now(),
      items: items,
      date: new Date().toLocaleString()
    };

    setSavedComparisons(prev => {
      const updated = [...prev, comparison];
      localStorage.setItem('savedComparisons', JSON.stringify(updated));
      return updated;
    });
  }, [items]);

  // Load saved comparison
  const loadComparison = useCallback((savedItems) => {
    setItems(savedItems);
  }, []);

  // Delete saved comparison
  const deleteComparison = useCallback((id) => {
    setSavedComparisons(prev => {
      const updated = prev.filter(comp => comp.id !== id);
      localStorage.setItem('savedComparisons', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center mb-6">Price Comparison Calculator</h1>
      
      {/* Input fields for items */}
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="p-4 bg-white rounded-lg shadow space-y-3">
            <input
              type="text"
              placeholder="Item name"
              value={item.name}
              onChange={(e) => handleChange(item.id, 'name', e.target.value)}
              className="w-full p-2 border rounded"
            />
            
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Price ($)"
                value={item.price}
                onChange={(e) => handleChange(item.id, 'price', e.target.value)}
                className="w-1/2 p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Amount"
                value={item.amount}
                onChange={(e) => handleChange(item.id, 'amount', e.target.value)}
                className="w-1/4 p-2 border rounded"
              />
              
              <select
                value={item.unitType}
                onChange={(e) => handleChange(item.id, 'unitType', e.target.value)}
                className="w-1/4 p-2 border rounded"
              >
                {Object.keys(UNIT_TYPES).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              
              <select
                value={item.unit}
                onChange={(e) => handleChange(item.id, 'unit', e.target.value)}
                className="w-1/4 p-2 border rounded"
              >
                {UNIT_TYPES[item.unitType].map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            
            {errors[item.id] && (
              <div className="flex items-center text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors[item.id]}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Results section */}
      {calculations.results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Results</h2>
          {calculations.results.map((result) => (
            <div
              key={result.id}
              className={`p-4 rounded-lg ${
                result.id === calculations.bestValue.id
                  ? 'bg-green-100 border-green-500'
                  : 'bg-white'
              } shadow`}
            >
              <div className="flex justify-between">
                <span className="font-medium">{result.name}</span>
                <span>${result.pricePerUnit.toFixed(4)}/{result.unit}</span>
              </div>
              {result.id !== calculations.bestValue.id && (
                <div className="text-sm text-red-500">
                  {result.percentageDiff}% more expensive
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={saveComparison}
        className="w-full p-2 bg-blue-500 text-white rounded-lg flex items-center justify-center space-x-2"
      >
        <Save className="w-4 h-4" />
        <span>Save Comparison</span>
      </button>

      {/* Saved comparisons section */}
      {savedComparisons.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Saved Comparisons</h2>
          {savedComparisons.map((comparison) => (
            <div key={comparison.id} className="p-4 bg-white rounded-lg shadow">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">
                    {comparison.items.map(item => item.name).join(' vs ')}
                  </div>
                  <div className="text-sm text-gray-500">{comparison.date}</div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => loadComparison(comparison.items)}
                    className="p-2 bg-blue-100 text-blue-600 rounded"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => deleteComparison(comparison.id)}
                    className="p-2 bg-red-100 text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PriceComparisonApp;
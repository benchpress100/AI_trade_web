import React, { useState } from 'react';
import { tradeAPI } from '../services/api';

const TradeForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    symbol: '',
    symbolName: '',
    action: 'BUY',
    quantity: '',
    price: '',
    note: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await tradeAPI.createTrade(formData);
      alert('交易操作发布成功！');
      setFormData({
        symbol: '',
        symbolName: '',
        action: 'BUY',
        quantity: '',
        price: '',
        note: '',
      });
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.error || '发布失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">发布交易操作</h2>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              股票代码
            </label>
            <input
              type="text"
              name="symbol"
              required
              placeholder="例如: AAPL"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={formData.symbol}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              股票名称
            </label>
            <input
              type="text"
              name="symbolName"
              placeholder="例如: 苹果公司"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={formData.symbolName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              操作类型
            </label>
            <select
              name="action"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={formData.action}
              onChange={handleChange}
            >
              <option value="BUY">买入</option>
              <option value="SELL">卖出</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              数量
            </label>
            <input
              type="number"
              name="quantity"
              required
              step="0.01"
              min="0.01"
              placeholder="100"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={formData.quantity}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              价格
            </label>
            <input
              type="number"
              name="price"
              required
              step="0.0001"
              min="0.0001"
              placeholder="150.5000"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={formData.price}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            备注（可选）
          </label>
          <textarea
            name="note"
            rows="3"
            placeholder="交易理由或备注..."
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            value={formData.note}
            onChange={handleChange}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {loading ? '发布中...' : '发布交易'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TradeForm;

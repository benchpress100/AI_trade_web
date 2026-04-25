import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tradeAPI } from '../services/api';
import TradeForm from '../components/TradeForm';
import TradeList from '../components/TradeList';
import PositionList from '../components/PositionList';
import AccountInfo from '../components/AccountInfo';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [trades, setTrades] = useState([]);
  const [positions, setPositions] = useState([]);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('positions');

  useEffect(() => {
    fetchData();
    // 每30秒刷新一次数据
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [tradesRes, positionsRes, accountRes] = await Promise.all([
        tradeAPI.getTrades(),
        tradeAPI.getPositions(),
        tradeAPI.getAccount(),
      ]);

      setTrades(tradesRes.data.trades);
      setPositions(positionsRes.data.positions);
      setAccount(accountRes.data.account);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTradeSuccess = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">股票交易模拟盘</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                {user?.username}
                {user?.isAdmin && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    管理员
                  </span>
                )}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 账户信息卡片 */}
        {account && <AccountInfo account={account} />}

        {/* 管理员操作区 */}
        {user?.isAdmin && (
          <div className="mt-6">
            <TradeForm onSuccess={handleTradeSuccess} />
          </div>
        )}

        {/* 标签页切换 */}
        <div className="mt-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('positions')}
                className={`${
                  activeTab === 'positions'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                持仓信息
              </button>
              <button
                onClick={() => setActiveTab('trades')}
                className={`${
                  activeTab === 'trades'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                交易记录
              </button>
            </nav>
          </div>

          <div className="mt-6">
            {activeTab === 'positions' && <PositionList positions={positions} />}
            {activeTab === 'trades' && <TradeList trades={trades} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

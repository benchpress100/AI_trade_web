import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tradeAPI } from '../services/api';

const PublicView = () => {
  const navigate = useNavigate();
  const [publicInfo, setPublicInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicInfo();
    // 每30秒刷新一次数据
    const interval = setInterval(fetchPublicInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPublicInfo = async () => {
    try {
      const res = await tradeAPI.getPublicInfo();
      setPublicInfo(res.data);
    } catch (error) {
      console.error('获取公开信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num, decimals = 2) => {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">股票交易日志</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                登录
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-blue-700"
              >
                注册
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 总盈利率卡片 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">总盈利率</h2>
            <div className="flex items-baseline">
              <span
                className={`text-4xl font-bold ${
                  parseFloat(publicInfo?.totalProfitLossPercent || 0) >= 0
                    ? 'text-success'
                    : 'text-danger'
                }`}
              >
                {parseFloat(publicInfo?.totalProfitLossPercent || 0) >= 0 ? '+' : ''}
                {formatNumber(publicInfo?.totalProfitLossPercent || 0, 2)}%
              </span>
            </div>
          </div>

          {/* 第一支股票持仓 */}
          {publicInfo?.firstPosition ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">持仓展示</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-500">股票代码</div>
                  <div className="text-lg font-medium text-gray-900">
                    {publicInfo.firstPosition.symbol}
                  </div>
                </div>
                {publicInfo.firstPosition.symbol_name && (
                  <div>
                    <div className="text-sm text-gray-500">股票名称</div>
                    <div className="text-lg font-medium text-gray-900">
                      {publicInfo.firstPosition.symbol_name}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-500">持仓数量</div>
                  <div className="text-lg font-medium text-gray-900">
                    {formatNumber(publicInfo.firstPosition.quantity, 2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">成本价</div>
                  <div className="text-lg font-medium text-gray-900">
                    ¥{formatNumber(publicInfo.firstPosition.avg_cost, 4)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">当前价</div>
                  <div className="text-lg font-medium text-gray-900">
                    ¥{formatNumber(publicInfo.firstPosition.current_price, 4)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">市值</div>
                  <div className="text-lg font-medium text-gray-900">
                    ¥{formatNumber(publicInfo.firstPosition.market_value, 2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">盈亏</div>
                  <div
                    className={`text-lg font-medium ${
                      parseFloat(publicInfo.firstPosition.profit_loss) >= 0
                        ? 'text-success'
                        : 'text-danger'
                    }`}
                  >
                    ¥{formatNumber(publicInfo.firstPosition.profit_loss, 2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">盈亏率</div>
                  <div
                    className={`text-lg font-medium ${
                      parseFloat(publicInfo.firstPosition.profit_loss_percent) >= 0
                        ? 'text-success'
                        : 'text-danger'
                    }`}
                  >
                    {parseFloat(publicInfo.firstPosition.profit_loss_percent) >= 0 ? '+' : ''}
                    {formatNumber(publicInfo.firstPosition.profit_loss_percent, 2)}%
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              暂无持仓信息
            </div>
          )}

          {/* 提示信息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  登录后可查看完整的交易记录、所有持仓信息和账户详情
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicView;

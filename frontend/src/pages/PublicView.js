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

          {/* 持仓列表 */}
          {publicInfo?.positions && publicInfo.positions.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">持仓信息</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        股票代码
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        股票名称
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        持仓数量
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        成本价
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        当前价
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        市值
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        盈亏
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        盈亏率
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {publicInfo.positions.map((position, index) => {
                      const isFirst = index === 0;
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {position.symbol}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {position.symbol_name || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {isFirst ? formatNumber(position.quantity, 2) : '***'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {isFirst ? `¥${formatNumber(position.avg_cost, 4)}` : '¥***'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {isFirst ? `¥${formatNumber(position.current_price, 4)}` : '¥***'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {isFirst ? `¥${formatNumber(position.market_value, 2)}` : '¥***'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isFirst ? (
                              <div
                                className={`text-sm font-medium ${
                                  parseFloat(position.profit_loss) >= 0
                                    ? 'text-success'
                                    : 'text-danger'
                                }`}
                              >
                                ¥{formatNumber(position.profit_loss, 2)}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400">¥***</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isFirst ? (
                              <div
                                className={`text-sm font-medium ${
                                  parseFloat(position.profit_loss_percent) >= 0
                                    ? 'text-success'
                                    : 'text-danger'
                                }`}
                              >
                                {parseFloat(position.profit_loss_percent) >= 0 ? '+' : ''}
                                {formatNumber(position.profit_loss_percent, 2)}%
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400">***%</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
                  登录后可查看完整的交易记录、所有持仓详情和账户信息
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

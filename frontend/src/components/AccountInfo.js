import React from 'react';

const AccountInfo = ({ account }) => {
  const formatNumber = (num) => {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatPercent = (num) => {
    const value = parseFloat(num);
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">账户总览</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <p className="text-sm text-gray-500">总资产</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ¥{formatNumber(account.total_assets)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">可用资金</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ¥{formatNumber(account.cash)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">总盈亏</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              parseFloat(account.total_profit_loss) >= 0
                ? 'text-success'
                : 'text-danger'
            }`}
          >
            ¥{formatNumber(account.total_profit_loss)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">收益率</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              parseFloat(account.total_profit_loss_percent) >= 0
                ? 'text-success'
                : 'text-danger'
            }`}
          >
            {formatPercent(account.total_profit_loss_percent)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountInfo;

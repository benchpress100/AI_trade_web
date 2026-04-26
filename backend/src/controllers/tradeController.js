const { db } = require('../config/database');

// 发布交易操作（仅管理员）
exports.createTrade = async (req, res) => {
  const { symbol, symbolName, action, quantity, price, note } = req.body;
  const userId = req.user.id;

  try {
    const totalAmount = quantity * price;

    // 插入交易记录
    const tradeResult = db.prepare(
      `INSERT INTO trades (user_id, symbol, symbol_name, action, quantity, price, total_amount, note) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(userId, symbol.toUpperCase(), symbolName || null, action.toUpperCase(), quantity, price, totalAmount, note || null);

    const tradeId = tradeResult.lastInsertRowid;

    // 更新持仓
    updatePosition(userId, symbol.toUpperCase(), symbolName, action.toUpperCase(), quantity, price);

    // 更新账户资金
    updateAccount(userId, action.toUpperCase(), totalAmount);

    const trade = db.prepare('SELECT * FROM trades WHERE id = ?').get(tradeId);

    res.status(201).json({
      message: '交易操作发布成功',
      trade
    });
  } catch (error) {
    console.error('创建交易错误:', error);
    res.status(500).json({ error: '服务器错误: ' + error.message });
  }
};

// 更新持仓
function updatePosition(userId, symbol, symbolName, action, quantity, price) {
  const position = db.prepare(
    'SELECT * FROM positions WHERE user_id = ? AND symbol = ?'
  ).get(userId, symbol);

  if (!position) {
    // 新建持仓（买入）
    if (action === 'BUY') {
      db.prepare(
        `INSERT INTO positions (user_id, symbol, symbol_name, quantity, avg_cost, current_price, market_value, profit_loss, profit_loss_percent) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(userId, symbol, symbolName || null, quantity, price, price, quantity * price, 0, 0);
    }
  } else {
    if (action === 'BUY') {
      // 加仓
      const newQuantity = parseFloat(position.quantity) + parseFloat(quantity);
      const newAvgCost = (parseFloat(position.avg_cost) * parseFloat(position.quantity) + parseFloat(price) * parseFloat(quantity)) / newQuantity;
      const profitLoss = (price - newAvgCost) * newQuantity;
      const profitLossPercent = ((price - newAvgCost) / newAvgCost) * 100;
      
      db.prepare(
        `UPDATE positions 
         SET quantity = ?, avg_cost = ?, current_price = ?, market_value = ?, 
             profit_loss = ?, profit_loss_percent = ?, symbol_name = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ? AND symbol = ?`
      ).run(
        newQuantity, 
        newAvgCost, 
        price, 
        newQuantity * price,
        profitLoss,
        profitLossPercent,
        symbolName || position.symbol_name,
        userId, 
        symbol
      );
    } else if (action === 'SELL') {
      // 减仓
      const newQuantity = parseFloat(position.quantity) - parseFloat(quantity);
      
      if (newQuantity <= 0) {
        // 清仓
        db.prepare(
          'DELETE FROM positions WHERE user_id = ? AND symbol = ?'
        ).run(userId, symbol);
      } else {
        const profitLoss = (price - position.avg_cost) * newQuantity;
        const profitLossPercent = ((price - position.avg_cost) / position.avg_cost) * 100;
        
        db.prepare(
          `UPDATE positions 
           SET quantity = ?, current_price = ?, market_value = ?,
               profit_loss = ?, profit_loss_percent = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE user_id = ? AND symbol = ?`
        ).run(
          newQuantity, 
          price, 
          newQuantity * price,
          profitLoss,
          profitLossPercent,
          userId, 
          symbol
        );
      }
    }
  }
}

// 更新账户资金
function updateAccount(userId, action, totalAmount) {
  // 检查账户是否存在，不存在则创建
  let account = db.prepare('SELECT * FROM account WHERE user_id = ?').get(userId);
  
  if (!account) {
    console.log('账户不存在，创建新账户 for userId:', userId);
    db.prepare('INSERT INTO account (user_id) VALUES (?)').run(userId);
    account = db.prepare('SELECT * FROM account WHERE user_id = ?').get(userId);
  }

  if (action === 'BUY') {
    db.prepare(
      'UPDATE account SET cash = cash - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
    ).run(totalAmount, userId);
  } else if (action === 'SELL') {
    db.prepare(
      'UPDATE account SET cash = cash + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
    ).run(totalAmount, userId);
  }

  // 更新总资产
  account = db.prepare('SELECT cash FROM account WHERE user_id = ?').get(userId);
  const positions = db.prepare('SELECT SUM(market_value) as total_market_value FROM positions WHERE user_id = ?').get(userId);
  
  const totalAssets = parseFloat(account.cash) + (parseFloat(positions.total_market_value) || 0);
  const totalProfitLoss = totalAssets - 1000000; // 初始资金 100万
  const totalProfitLossPercent = (totalProfitLoss / 1000000) * 100;

  db.prepare(
    `UPDATE account 
     SET total_assets = ?, total_profit_loss = ?, total_profit_loss_percent = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE user_id = ?`
  ).run(totalAssets, totalProfitLoss, totalProfitLossPercent, userId);
}

// 获取所有交易记录
exports.getTrades = async (req, res) => {
  try {
    const trades = db.prepare(
      `SELECT t.*, u.username 
       FROM trades t 
       JOIN users u ON t.user_id = u.id 
       WHERE u.is_admin = 1 
       ORDER BY t.trade_time DESC 
       LIMIT 100`
    ).all();

    res.json({ trades });
  } catch (error) {
    console.error('获取交易记录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

// 获取持仓信息
exports.getPositions = async (req, res) => {
  try {
    const positions = db.prepare(
      `SELECT p.*, u.username 
       FROM positions p 
       JOIN users u ON p.user_id = u.id 
       WHERE u.is_admin = 1 
       ORDER BY p.market_value DESC`
    ).all();

    res.json({ positions });
  } catch (error) {
    console.error('获取持仓信息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

// 获取账户信息
exports.getAccount = async (req, res) => {
  try {
    const account = db.prepare(
      `SELECT a.*, u.username 
       FROM account a 
       JOIN users u ON a.user_id = u.id 
       WHERE u.is_admin = 1`
    ).get();

    if (!account) {
      return res.status(404).json({ error: '账户不存在' });
    }

    res.json({ account });
  } catch (error) {
    console.error('获取账户信息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

// 获取公开信息（访客模式，不需要登录）
exports.getPublicInfo = async (req, res) => {
  try {
    // 获取总盈利率
    const account = db.prepare(
      `SELECT total_profit_loss_percent 
       FROM account a 
       JOIN users u ON a.user_id = u.id 
       WHERE u.is_admin = 1`
    ).get();

    // 获取第一支股票的持仓
    const firstPosition = db.prepare(
      `SELECT symbol, symbol_name, quantity, avg_cost, current_price, market_value, profit_loss, profit_loss_percent 
       FROM positions p 
       JOIN users u ON p.user_id = u.id 
       WHERE u.is_admin = 1 
       ORDER BY p.id ASC 
       LIMIT 1`
    ).get();

    res.json({
      totalProfitLossPercent: account ? account.total_profit_loss_percent : 0,
      firstPosition: firstPosition || null
    });
  } catch (error) {
    console.error('获取公开信息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

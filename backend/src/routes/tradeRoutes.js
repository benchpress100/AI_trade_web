const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const tradeController = require('../controllers/tradeController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 所有路由都需要登录
router.use(authenticateToken);

// 发布交易操作（仅管理员）
router.post('/', [
  requireAdmin,
  body('symbol').notEmpty().withMessage('股票代码不能为空'),
  body('action').isIn(['BUY', 'SELL']).withMessage('操作类型必须是 BUY 或 SELL'),
  body('quantity').isFloat({ min: 0.01 }).withMessage('数量必须大于0'),
  body('price').isFloat({ min: 0.01 }).withMessage('价格必须大于0')
], tradeController.createTrade);

// 获取交易记录
router.get('/', tradeController.getTrades);

// 获取持仓信息
router.get('/positions', tradeController.getPositions);

// 获取账户信息
router.get('/account', tradeController.getAccount);

module.exports = router;

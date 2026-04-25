const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// 注册
router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('用户名长度必须在3-50之间'),
  body('email').isEmail().withMessage('邮箱格式不正确'),
  body('password').isLength({ min: 6 }).withMessage('密码长度至少为6位')
], authController.register);

// 登录
router.post('/login', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空')
], authController.login);

// 获取当前用户信息（需要认证）
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 代理API请求到后端
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.NODE_ENV === 'development' && process.env.DOCKER_ENV 
        ? 'http://backend:8000' 
        : 'http://localhost:8000',
      changeOrigin: true,
      timeout: 120000, // 2分钟超时
    })
  );

  // 代理media文件请求到后端
  app.use(
    '/media',
    createProxyMiddleware({
      target: process.env.NODE_ENV === 'development' && process.env.DOCKER_ENV 
        ? 'http://backend:8000' 
        : 'http://localhost:8000',
      changeOrigin: true,
      timeout: 30000, // 30秒超时
    })
  );
};

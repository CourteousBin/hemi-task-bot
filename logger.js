// logger.js
import winston from 'winston';

// 配置 Winston 日志记录器
const logger = winston.createLogger({
  level: 'info', // 设置日志级别为 'info'
  format: winston.format.combine(
    winston.format.timestamp({
      // 自定义时间戳格式
      format: () => {
        const date = new Date();
        // 将时间转换为 UTC+8
        const utc8Date = new Date(date.getTime() + 8 * 60 * 60 * 1000);
        return utc8Date.toISOString(); // 返回 ISO 格式的时间字符串
      }
    }),
    winston.format.json() // 日志输出格式为 JSON
  ),
  transports: [
    // 将错误日志输出到 'error.log' 文件
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // 将所有日志输出到 'combined.log' 文件
    new winston.transports.File({ filename: 'combined.log' }),
    // 在控制台输出所有日志
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // 使输出带颜色
        winston.format.simple() // 使用简单的格式输出
      )
    })
  ],
});

// 导出 logger
export default logger;

import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import logger from './logger.js';
import fs from 'fs';
import readline from 'readline';

// 钱包类，用于生成钱包信息
class Wallet {
  constructor() {
    // 生成新的私钥
    this.privateKey = generatePrivateKey();
    // 根据私钥生成账户信息（地址和公钥）
    this.account = privateKeyToAccount(this.privateKey);
  }

  // 返回钱包信息
  getInfo() {
    return {
      privateKey: this.privateKey,
      address: this.account.address,
      publicKey: this.account.publicKey,
    };
  }
}

// 批量创建钱包并保存到 config.js
async function createWallets(count) {
  const wallets = [];

  for (let i = 0; i < count; i++) {
    const wallet = new Wallet();
    wallets.push(wallet.getInfo());
    logger.info(`钱包 ${i + 1} 创建成功: ${wallet.getInfo().address}`); // 使用 logger 记录信息
  }

  // 输出到 config.js 文件
  const configContent = `// config.js\nexport const accounts = ${JSON.stringify(wallets, null, 2)};`;

  await saveToFile('config.js', configContent);
}

// 将数据保存到指定文件
function saveToFile(filename, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, (err) => {
      if (err) {
        logger.error(`保存 ${filename} 时出错: ${err.message}`); // 使用 logger 记录错误
        reject(err);
      } else {
        logger.info(`${filename} 已成功保存`); // 使用 logger 记录信息
        resolve();
      }
    });
  });
}

// 读取用户输入
async function getUserInput() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('请输入要创建的钱包数量: ', (answer) => {
      rl.close();
      resolve(parseInt(answer, 10)); // 将输入转换为整数
    });
  });
}

// 主函数
(async () => {
  const numberOfWallets = await getUserInput(); // 获取用户输入的钱包数量
  if (isNaN(numberOfWallets) || numberOfWallets <= 0) {
    console.error('请输入一个有效的正整数作为钱包数量。');
    return;
  }
  await createWallets(numberOfWallets);
})();

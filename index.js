import { http, createWalletClient, createPublicClient, parseEther, encodeFunctionData } from "viem";
import { hemiPublicBitcoinKitActions, hemiPublicOpNodeActions, hemiSepolia } from "hemi-viem";
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from "viem/chains";
import logger from './logger.js'; // 引入 logger
import hemiABI from './abi.js';
import WETHABI from './WETH.js';
import UNIABI from './uniswap.js';
import { accounts } from './config.js'; // 导入配置文件

// 以太坊客户端类，用于与以太坊区块链交互
class EthereumClient {
  constructor(privateKey) {
    this.parameters = { chain: sepolia, transport: http() };
    this.account = privateKeyToAccount(privateKey);

    // 创建钱包客户端
    this.walletClient = createWalletClient({
      account: this.account,
      ...this.parameters
    });

    this.publicClient = createPublicClient({
      ...this.parameters,
    });
  }

  // 向代理合约存入 ETH
  async depositETH(minGasLimit, extraData, amount) {
    const proxyContractAddress = '0xc94b1BEe63A3e101FE5F71C80F912b4F4b055925';
    const sendEth = parseEther(amount.toString());

    // 查询余额是否大于转账质押数量
    const { address } = this.account;
    const balance = await this.publicClient.getBalance({
      address,
    });

    if (balance < sendEth) {
      logger.error(`余额不足，请先存入足够的 ETH，余额${balance}`); // 使用 logger 记录错误
      throw new Error('Invalid balance'); // 抛出错误以终止后续操作
    }

    // 编码函数数据
    const data = encodeFunctionData({
      abi: hemiABI,
      functionName: 'depositETH',
      args: [minGasLimit, extraData]
    });

    try {
      // 发送交易
      const tx = await this.walletClient.sendTransaction({
        to: proxyContractAddress,
        data,
        value: sendEth,
      });

      logger.info(`Transaction sent: ${tx}`); // 使用 logger 记录交易信息
    } catch (error) {
      logger.error(`发送交易时出错: ${error.message}`); // 使用 logger 记录错误
      throw error; // 抛出错误以便在外层捕获
    }
  }
}

// Hemi Sepolia 交互类，用于处理 Hemi Sepolia 相关的操作
class HemiSepolia {
  constructor(privateKey) {
    // 设置链和传输参数
    this.parameters = { chain: hemiSepolia, transport: http() };
    this.account = privateKeyToAccount(privateKey);

    // 创建公共客户端
    this.publicClient = createPublicClient(this.parameters)
      .extend(hemiPublicOpNodeActions())
      .extend(hemiPublicBitcoinKitActions());

    // 创建钱包客户端
    this.walletClient = createWalletClient({
      account: this.account,
      ...this.parameters
    });
  }

  // 交换 WETH 的方法
  async swapWeth() {
    const WethContractAddress = '0x0C8aFD1b58aa2A5bAd2414B861D8A7fF898eDC3A';
    const sendEth = parseEther('0.00001');

    // 查询余额
    const { address } = this.account;
    const balance = await this.publicClient.getBalance({
      address,
    });

    if (balance < sendEth) {
      logger.error(`余额不足，请先存入足够的 ETH 进行 WETH 交换`); // 使用 logger 记录错误
      throw new Error('Insufficient balance for WETH swap'); // 抛出错误以终止后续操作
    }

    const data = encodeFunctionData({
      abi: WETHABI,
      functionName: 'deposit',
    });

    try {
      // 发送交易
      const tx = await this.walletClient.sendTransaction({
        to: WethContractAddress,
        data,
        value: sendEth,
      });

      logger.info(`WETH Transaction sent: ${tx}`); // 使用 logger 记录交易信息
    } catch (error) {
      logger.error(`WETH 交换时出错: ${error.message}`); // 使用 logger 记录错误
      throw error; // 抛出错误以便在外层捕获
    }
  }

  // 交换 DAI 的方法
  async swapDai() {
    const UniswapContractAddress = '0xA18019E62f266C2E17e33398448e4105324e0d0F';
    const sendEth = parseEther('0.00001');

    const { address } = this.account;
    const balance = await this.publicClient.getBalance({
      address,
    });

    if (balance < sendEth) {
      logger.error(`余额不足，请先存入足够的 DAI 进行交换`); // 使用 logger 记录错误
      throw new Error('Insufficient balance for DAI swap'); // 抛出错误以终止后续操作
    }

    const data = encodeFunctionData({
      abi: UNIABI,
      functionName: 'execute',
      args: [
        '0x0b00',
        [
          "0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000005af3107a4000",
          "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000005af3107a4000000000000000000000000000000000000000000000000000457fd60a0614bb5400000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002b0c8afd1b58aa2a5bad2414b861d8a7ff898edc3a000bb8ec46e0efb2ea8152da0327a5eb3ff9a43956f13e000000000000000000000000000000000000000000"
        ],
        // 20 分钟后过期
        Math.floor(Date.now() / 1000) + 60 * 20 + ''
      ]
    });

    try {
      // 发送交易
      const tx = await this.walletClient.sendTransaction({
        to: UniswapContractAddress,
        data,
        value: sendEth,
      });

      logger.info(`DAI Transaction sent: ${tx}`); // 使用 logger 记录交易信息
    } catch (error) {
      logger.error(`DAI 交换时出错: ${error.message}`); // 使用 logger 记录错误
      throw error; // 抛出错误以便在外层捕获
    }
  }
}

// 使用示例
(async () => {
  for (const account of accounts) {
    const { privateKey } = account;

    // 检查私钥格式，如果没有以 0x 开头，则添加 0x， 主要死兼容 metamask 创建的私钥
    let formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;

    try {
      // 将私钥转换为账户对象
      const accountInfo = privateKeyToAccount(formattedPrivateKey);
    } catch (error) {
      logger.error(`转换账户时出错: ${error.message} (私钥: ${privateKey})`);
      continue; // 跳过当前账号，继续下一个账号
    }

    try {
      // 创建以太坊客户端并进行存款
      const ethClient = new EthereumClient(formattedPrivateKey);
      await ethClient.depositETH(200000, '0x', 0.1);
    } catch (error) {
      logger.error(`存款时出错: ${error.message} (私钥: ${privateKey})`);
      continue; // 跳过当前账号，继续下一个账号
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // 创建 Hemi Sepolia 客户端并进行 WETH 和 DAI 交换
      const hemiSepolia = new HemiSepolia(formattedPrivateKey);
      // 兑换 WETH
      await hemiSepolia.swapWeth();

      await new Promise(resolve => setTimeout(resolve, 1000));

      // 兑换 DAI
      await hemiSepolia.swapDai();
    } catch (error) {
      logger.error(`Hemi Sepolia 操作时出错: ${error.message} (私钥: ${privateKey})`);
    }
  }

})();

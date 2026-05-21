import type { AddressRiskSample, ContractRiskSample } from '@/types'

export const addressRiskSamples: AddressRiskSample[] = [
  {
    address: '0xPh1shA3cD12fF91E3c8A1b23Ee920001aaFf0101',
    label: '空投钓鱼地址',
    riskType: '钓鱼诱导',
    severity: 'high',
    evidenceSources: ['Etherscan 交易图谱', 'X.com 用户爆料', '已知黑名单库', '链上行为统计'],
    analysisScript: [
      { delayMs: 650, stage: '抓取数据源', source: 'Etherscan', finding: '接收小额转账后统一归集', reason: '典型诱导入金归集路径', scoreDelta: 18, levelAfter: '中风险' },
      { delayMs: 700, stage: '关联社交情报', source: 'X.com', finding: '多位用户举报假客服空投', reason: '社工钓鱼特征明显', scoreDelta: 22, levelAfter: '高风险' },
      { delayMs: 650, stage: '生成结论', source: 'AI 风险引擎', finding: '判定为空投钓鱼地址', reason: '建议终止转账', scoreDelta: 16, levelAfter: '极高风险' }
    ]
  },
  {
    address: '0xHackC0re091aaFF8023b4C2D6e7fFF1000000202',
    label: '黑客资金中转',
    riskType: '盗币团伙',
    severity: 'high',
    evidenceSources: ['Etherscan 交易图谱', 'X.com 事件追踪', '已知黑名单库', '链上行为统计'],
    analysisScript: [
      { delayMs: 700, stage: '抓取数据源', source: 'Etherscan', finding: '与被盗地址存在直接资金关系', reason: '疑似赃款转移', scoreDelta: 22, levelAfter: '高风险' },
      { delayMs: 700, stage: '黑名单交叉验证', source: '链上黑名单库', finding: '命中盗币团伙地址簇', reason: '历史事件重复出现', scoreDelta: 22, levelAfter: '极高风险' },
      { delayMs: 650, stage: '生成结论', source: 'AI 风险引擎', finding: '判定为黑客中转地址', reason: '建议阻断并拉黑', scoreDelta: 14, levelAfter: '极高风险' }
    ]
  },
  {
    address: '0xMix3r5ecf9991AA33b7E8c1222bBB30000000303',
    label: '混币关联地址',
    riskType: '混币关联',
    severity: 'medium',
    evidenceSources: ['Etherscan 交易图谱', '链上行为统计', '已知黑名单库'],
    analysisScript: [
      { delayMs: 680, stage: '行为建模', source: '链上行为统计', finding: '地址活跃呈脚本化节律', reason: '非自然账户行为', scoreDelta: 15, levelAfter: '中风险' },
      { delayMs: 680, stage: '黑名单交叉验证', source: '链上黑名单库', finding: '命中混币关联标签', reason: '建议人工复核', scoreDelta: 12, levelAfter: '中高风险' },
      { delayMs: 620, stage: '生成结论', source: 'AI 风险引擎', finding: '判定为混币关联地址', reason: '建议降低额度', scoreDelta: 10, levelAfter: '中高风险' }
    ]
  }
]

export const contractRiskSamples: ContractRiskSample[] = [
  {
    contract: '0xHoneyTr4p0fA11cE5522ddEE0000000000000707',
    name: 'FakeYieldPool',
    maliciousType: 'Honeypot',
    severity: 'high',
    codeHints: ['检测到仅允许买入，不允许普通地址卖出'],
    evidenceSources: ['Etherscan 合约代码', 'X.com 安全预警', '链上行为统计'],
    maliciousAction: { approvalText: '授权 ETH 2.0000', drain: { eth: 0.12, usdc: 0 } },
    analysisScript: [
      { delayMs: 700, stage: '拉取合约代码', source: 'Etherscan', finding: '识别到限制卖出逻辑', reason: '符合 honeypot 特征', scoreDelta: 26, levelAfter: '极高风险' },
      { delayMs: 680, stage: '关联社区预警', source: 'X.com', finding: '用户反馈可买不可卖', reason: '实证与代码一致', scoreDelta: 18, levelAfter: '极高风险' },
      { delayMs: 650, stage: '生成结论', source: 'AI 合约引擎', finding: '判定为高危 honeypot', reason: '建议禁止交互', scoreDelta: 10, levelAfter: '极高风险' }
    ]
  },
  {
    contract: '0xAppR0veSteaL33445566AA0000000000000808',
    name: 'GiftAirdrop',
    maliciousType: '恶意授权盗取',
    severity: 'high',
    codeHints: ['存在批量 transferFrom 调用入口'],
    evidenceSources: ['Etherscan 合约代码', '黑名单库', 'X.com 举报帖'],
    maliciousAction: { approvalText: '授权 USDC 5000.00', drain: { eth: 0.02, usdc: 90 } },
    analysisScript: [
      { delayMs: 700, stage: '拉取合约代码', source: 'Etherscan', finding: '发现隐藏批量扣款函数', reason: '超出正常空投权限', scoreDelta: 24, levelAfter: '极高风险' },
      { delayMs: 680, stage: '关联社交情报', source: 'X.com', finding: '授权后钱包被秒转', reason: '受害路径一致', scoreDelta: 18, levelAfter: '极高风险' },
      { delayMs: 650, stage: '生成结论', source: 'AI 合约引擎', finding: '判定为恶意授权盗取', reason: '建议拒绝授权', scoreDelta: 12, levelAfter: '极高风险' }
    ]
  },
  {
    contract: '0xUpgr4deTrap22334455Dd0000000000001111',
    name: 'MetaBridgeX',
    maliciousType: '代理后门升级',
    severity: 'medium',
    codeHints: ['代理管理员可随时替换实现合约'],
    evidenceSources: ['Etherscan 合约代码', 'X.com 安全观察', '链上行为统计'],
    maliciousAction: { approvalText: '授权 ETH 0.8000', drain: { eth: 0.04, usdc: 18 } },
    analysisScript: [
      { delayMs: 700, stage: '拉取合约代码', source: 'Etherscan', finding: '检测到无时间锁升级权限', reason: '上线后逻辑可变更', scoreDelta: 18, levelAfter: '高风险' },
      { delayMs: 680, stage: '行为验证', source: '链上行为统计', finding: '近30天频繁升级', reason: '治理可信度不足', scoreDelta: 13, levelAfter: '中高风险' },
      { delayMs: 650, stage: '生成结论', source: 'AI 合约引擎', finding: '判定为升级后门风险', reason: '建议小额测试', scoreDelta: 10, levelAfter: '中高风险' }
    ]
  }
]

import type { AddressRiskSample, ContractRiskSample } from '@/types'

export const addressRiskSamples: AddressRiskSample[] = [
  {
    address: '0xPh1shA3cD12fF91E3c8A1b23Ee920001aaFf0101',
    label: '空投钓鱼地址',
    riskType: '钓鱼诱导',
    severity: 'high',
    aiAdvice: '疑似社工钓鱼，请立即取消转账并将该地址加入本地黑名单。',
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
    aiAdvice: '命中黑客资金中转集群，建议终止交易并保留证据截图。',
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
    aiAdvice: '该地址与混币路径关联，建议仅在必要场景下小额测试并二次确认。',
    evidenceSources: ['Etherscan 交易图谱', '链上行为统计', '已知黑名单库'],
    analysisScript: [
      { delayMs: 680, stage: '行为建模', source: '链上行为统计', finding: '地址活跃呈脚本化节律', reason: '非自然账户行为', scoreDelta: 15, levelAfter: '中风险' },
      { delayMs: 680, stage: '黑名单交叉验证', source: '链上黑名单库', finding: '命中混币关联标签', reason: '建议人工复核', scoreDelta: 12, levelAfter: '中高风险' },
      { delayMs: 620, stage: '生成结论', source: 'AI 风险引擎', finding: '判定为混币关联地址', reason: '建议降低额度', scoreDelta: 10, levelAfter: '中高风险' }
    ]
  },
  {
    address: '0xOfFiciAL0000Fake7788AA1122330000000404',
    label: '仿冒官方客服地址',
    riskType: '仿冒官方',
    severity: 'high',
    aiAdvice: '仿冒官方风险高，建议通过官网渠道二次核验并拒绝本次交易。',
    evidenceSources: ['X.com 官方账号声明', 'Etherscan 标签信息', '已知黑名单库', '链上行为统计'],
    analysisScript: [
      { delayMs: 690, stage: '关联身份画像', source: 'X.com 官方账号声明', finding: '官方声明该地址非认证收款地址', reason: '存在仿冒官方身份行为', scoreDelta: 20, levelAfter: '高风险' },
      { delayMs: 680, stage: '交易路径比对', source: 'Etherscan 交易图谱', finding: '小额收款后快速分流到未知集群', reason: '与诈骗归集路径相似', scoreDelta: 19, levelAfter: '极高风险' },
      { delayMs: 640, stage: '生成结论', source: 'AI 风险引擎', finding: '判定为仿冒官方高危地址', reason: '建议立即中止并提示用户报警', scoreDelta: 12, levelAfter: '极高风险' }
    ]
  },
  {
    address: '0xAirdropAppr0ve9944CC550011220000000505',
    label: '假空投授权地址',
    riskType: '假空投授权',
    severity: 'high',
    aiAdvice: '疑似假空投授权陷阱，建议取消并检查近期授权列表。',
    evidenceSources: ['X.com 举报线索', 'Etherscan 授权记录', '链上行为统计'],
    analysisScript: [
      { delayMs: 700, stage: '授权行为扫描', source: 'Etherscan 授权记录', finding: '历史关联地址频繁请求无限授权', reason: '与盗取授权套路吻合', scoreDelta: 23, levelAfter: '高风险' },
      { delayMs: 680, stage: '社交情报关联', source: 'X.com 举报线索', finding: '多条帖子反馈“领取空投后被清空”', reason: '受害叙事高度一致', scoreDelta: 20, levelAfter: '极高风险' },
      { delayMs: 620, stage: '生成结论', source: 'AI 风险引擎', finding: '判定为假空投授权地址', reason: '建议拒绝任何授权请求', scoreDelta: 10, levelAfter: '极高风险' }
    ]
  },
  {
    address: '0xJuMpGateRisk5522EEAA7711990000000606',
    label: '高风险跳转地址',
    riskType: '高风险跳转',
    severity: 'medium',
    aiAdvice: '存在异常跳转行为，建议先使用白名单地址或缩小转账额度。',
    evidenceSources: ['链上行为统计', 'Etherscan 交易图谱', '黑名单库'],
    analysisScript: [
      { delayMs: 670, stage: '行为建模', source: '链上行为统计', finding: '短时间多次跨地址跳转后归集', reason: '可能用于追踪规避', scoreDelta: 14, levelAfter: '中风险' },
      { delayMs: 680, stage: '关系图谱扩散', source: 'Etherscan 交易图谱', finding: '二跳地址命中高风险标签簇', reason: '存在间接风险传染', scoreDelta: 13, levelAfter: '中高风险' },
      { delayMs: 630, stage: '生成结论', source: 'AI 风险引擎', finding: '判定为高风险跳转地址', reason: '建议小额白名单验证后再操作', scoreDelta: 10, levelAfter: '中高风险' }
    ]
  }
]

export const contractRiskSamples: ContractRiskSample[] = [
  {
    contract: '0xHoneyTr4p0fA11cE5522ddEE0000000000000707',
    name: 'FakeYieldPool',
    maliciousType: 'Honeypot',
    severity: 'high',
    aiAdvice: '检测到 Honeypot 特征，建议立即取消并避免后续授权。',
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
    aiAdvice: '该合约可能盗取授权资产，建议拒绝授权并清理历史高额授权。',
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
    aiAdvice: '检测到可疑升级后门，建议仅隔离钱包小额测试或直接放弃交互。',
    codeHints: ['代理管理员可随时替换实现合约'],
    evidenceSources: ['Etherscan 合约代码', 'X.com 安全观察', '链上行为统计'],
    maliciousAction: { approvalText: '授权 ETH 0.8000', drain: { eth: 0.04, usdc: 18 } },
    analysisScript: [
      { delayMs: 700, stage: '拉取合约代码', source: 'Etherscan', finding: '检测到无时间锁升级权限', reason: '上线后逻辑可变更', scoreDelta: 18, levelAfter: '高风险' },
      { delayMs: 680, stage: '行为验证', source: '链上行为统计', finding: '近30天频繁升级', reason: '治理可信度不足', scoreDelta: 13, levelAfter: '中高风险' },
      { delayMs: 650, stage: '生成结论', source: 'AI 合约引擎', finding: '判定为升级后门风险', reason: '建议小额测试', scoreDelta: 10, levelAfter: '中高风险' }
    ]
  },
  {
    contract: '0xFreezeList9944BB331177aa0000000000001212',
    name: 'StableXPro',
    maliciousType: '黑名单冻结',
    severity: 'high',
    aiAdvice: '该合约存在冻结控制风险，建议中止授权并转移资产到安全地址。',
    codeHints: ['包含 owner 可动态冻结地址函数', '转账前检查黑名单映射'],
    evidenceSources: ['Etherscan 合约代码', '链上行为统计', 'X.com 安全预警'],
    maliciousAction: { approvalText: '授权 USDC 1500.00', drain: { eth: 0.01, usdc: 120 } },
    analysisScript: [
      { delayMs: 700, stage: '拉取合约代码', source: 'Etherscan', finding: '发现可任意追加黑名单逻辑', reason: '用户资产可被项目方单方面限制', scoreDelta: 21, levelAfter: '高风险' },
      { delayMs: 680, stage: '链上行为验证', source: '链上行为统计', finding: '历史出现批量冻结后扣款', reason: '存在资产控制风险', scoreDelta: 19, levelAfter: '极高风险' },
      { delayMs: 640, stage: '生成结论', source: 'AI 合约引擎', finding: '判定为黑名单冻结高危合约', reason: '建议避免交互', scoreDelta: 11, levelAfter: '极高风险' }
    ]
  },
  {
    contract: '0xMintHid3n7733AA44dd880000000000001313',
    name: 'YieldNova',
    maliciousType: '隐藏增发',
    severity: 'high',
    aiAdvice: '检测到隐藏增发风险，建议不参与质押并远离该资产池。',
    codeHints: ['发现权限分支可隐式调用 mint', '总量上限校验可绕过'],
    evidenceSources: ['Etherscan 合约代码', '审计片段', '链上行为统计'],
    maliciousAction: { approvalText: '授权 ETH 1.2000', drain: { eth: 0.08, usdc: 45 } },
    analysisScript: [
      { delayMs: 700, stage: '代码语义解析', source: 'Etherscan', finding: '权限角色可触发隐藏增发入口', reason: '代币价值可被稀释', scoreDelta: 22, levelAfter: '高风险' },
      { delayMs: 680, stage: '供应量回放', source: '链上行为统计', finding: '异常时段供应量突增', reason: '与隐藏增发行为一致', scoreDelta: 18, levelAfter: '极高风险' },
      { delayMs: 640, stage: '生成结论', source: 'AI 合约引擎', finding: '判定为隐藏增发风险合约', reason: '建议拒绝质押/授权', scoreDelta: 12, levelAfter: '极高风险' }
    ]
  },
  {
    contract: '0xBr1dgeTrap6644EE22cc990000000000001414',
    name: 'BridgeLite',
    maliciousType: '伪跨链桥劫持',
    severity: 'high',
    aiAdvice: '疑似伪跨链桥，建议立即停止交互并撤销相关授权。',
    codeHints: ['接收资产后由中心地址手动放款', '缺少可验证跨链证明'],
    evidenceSources: ['Etherscan 合约代码', 'X.com 风险爆料', '链上行为统计'],
    maliciousAction: { approvalText: '授权 USDC 3000.00', drain: { eth: 0.03, usdc: 160 } },
    analysisScript: [
      { delayMs: 710, stage: '桥接流程分析', source: 'Etherscan', finding: '跨链结果依赖中心化签名地址', reason: '资金可被单点截留', scoreDelta: 24, levelAfter: '高风险' },
      { delayMs: 690, stage: '受害事件对比', source: 'X.com', finding: '用户反馈“跨链成功但对端未到账”', reason: '疑似人为劫持路径', scoreDelta: 18, levelAfter: '极高风险' },
      { delayMs: 640, stage: '生成结论', source: 'AI 合约引擎', finding: '判定为伪跨链桥劫持风险', reason: '建议停止交互并撤销授权', scoreDelta: 11, levelAfter: '极高风险' }
    ]
  }
]

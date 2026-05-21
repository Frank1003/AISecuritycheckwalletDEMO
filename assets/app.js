// 全局钱包状态（仅演示用途）
const state = {
  version: "v0.2.5",
  balances: {
    ETH: 0,
    USDC: 0,
  },
  // 控制总额是否隐藏显示
  isTotalHidden: false,
  // 结构化记录余额变化，便于按币种展示明细
  balanceChanges: [],
  // 恶意地址与恶意 DApp 的交互记录
  interactions: [],
  records: [
    "系统初始化：钱包已创建，等待领取测试资产。",
  ],
};

const initialSnapshot = {
  balances: { ETH: 0, USDC: 0 },
  records: ["系统初始化：钱包已创建，等待领取测试资产。"],
};

const addressRiskSamples = [
  {
    address: "0xPh1shA3cD12fF91E3c8A1b23Ee920001aaFf0101",
    label: "空投钓鱼地址",
    riskType: "钓鱼诱导",
    severity: "high",
    evidenceSources: ["Etherscan 交易图谱", "X.com 用户爆料", "已知黑名单库", "链上行为统计"],
    analysisScript: [
      { delayMs: 900, stage: "抓取数据源", source: "Etherscan", finding: "近24小时接收 312 笔小额转入，随后统一归集", reason: "典型诱导入金后快速归集模式", scoreDelta: 18, levelAfter: "中风险" },
      { delayMs: 1100, stage: "关联社交情报", source: "X.com", finding: "6 名用户举报该地址假冒空投客服并发送恶意链接", reason: "社工钓鱼特征明显，受害者路径一致", scoreDelta: 20, levelAfter: "高风险" },
      { delayMs: 1000, stage: "黑名单交叉验证", source: "链上黑名单库", finding: "与 2 个历史钓鱼团伙归集地址存在二跳关联", reason: "资金流向关联高危地址簇", scoreDelta: 22, levelAfter: "高风险" },
      { delayMs: 800, stage: "行为建模", source: "链上行为统计", finding: "地址活跃窗口集中在 UTC+8 00:00-03:00 且 Gas 策略异常统一", reason: "疑似脚本化批量作案", scoreDelta: 16, levelAfter: "高风险" },
      { delayMs: 700, stage: "生成结论", source: "AI 风险引擎", finding: "判定为空投钓鱼地址，建议终止转账", reason: "多源证据一致指向资金诱导与归集诈骗", scoreDelta: 12, levelAfter: "极高风险" },
    ],
  },
  {
    address: "0xHackC0re091aaFF8023b4C2D6e7fFF1000000202",
    label: "黑客资金中转",
    riskType: "盗币团伙",
    severity: "high",
    evidenceSources: ["Etherscan 交易图谱", "X.com 事件追踪", "已知黑名单库", "链上行为统计"],
    analysisScript: [
      { delayMs: 850, stage: "抓取数据源", source: "Etherscan", finding: "检测到与某 DeFi 被盗地址存在直接入账关系", reason: "被盗资产在 2 小时内流入目标地址", scoreDelta: 21, levelAfter: "高风险" },
      { delayMs: 1000, stage: "关联社交情报", source: "X.com", finding: "安全研究员披露该地址参与跨链洗转", reason: "公开情报与链上路径高度重合", scoreDelta: 18, levelAfter: "高风险" },
      { delayMs: 900, stage: "黑名单交叉验证", source: "链上黑名单库", finding: "命中盗币团伙标签（置信度 0.92）", reason: "历史攻击事件中重复出现", scoreDelta: 24, levelAfter: "极高风险" },
      { delayMs: 900, stage: "行为建模", source: "链上行为统计", finding: "大额进账后分拆至 40+ 新地址", reason: "典型资金分层洗白策略", scoreDelta: 17, levelAfter: "极高风险" },
      { delayMs: 700, stage: "生成结论", source: "AI 风险引擎", finding: "判定为盗币团伙中转地址", reason: "建议立即中止并拉黑该地址", scoreDelta: 10, levelAfter: "极高风险" },
    ],
  },
  {
    address: "0xMix3r5ecf9991AA33b7E8c1222bBB30000000303",
    label: "混币关联地址",
    riskType: "混币关联",
    severity: "medium",
    evidenceSources: ["Etherscan 交易图谱", "链上行为统计", "已知黑名单库", "X.com 用户讨论"],
    analysisScript: [
      { delayMs: 900, stage: "抓取数据源", source: "Etherscan", finding: "与多个 Tornado 风格中间地址存在频繁交互", reason: "资产路径可追溯至匿名池", scoreDelta: 15, levelAfter: "中风险" },
      { delayMs: 950, stage: "行为建模", source: "链上行为统计", finding: "转账时间呈固定节律，疑似自动化脚本", reason: "非自然用户行为模式", scoreDelta: 14, levelAfter: "中风险" },
      { delayMs: 850, stage: "黑名单交叉验证", source: "链上黑名单库", finding: "命中可疑混币关联标签（置信度 0.73）", reason: "历史关联并非直接作案地址", scoreDelta: 12, levelAfter: "中高风险" },
      { delayMs: 700, stage: "生成结论", source: "AI 风险引擎", finding: "判定为混币关联地址", reason: "建议小额测试或人工复核后再操作", scoreDelta: 8, levelAfter: "中高风险" },
    ],
  },
  {
    address: "0xFak3Off1cE11188aBcDe44f6000000000000404",
    label: "仿冒官方地址",
    riskType: "仿冒官方",
    severity: "high",
    evidenceSources: ["X.com 官方声明", "Etherscan 标签数据", "链上行为统计", "已知黑名单库"],
    analysisScript: [
      { delayMs: 800, stage: "关联社交情报", source: "X.com", finding: "官方账号声明该地址非官方收款地址", reason: "存在品牌仿冒风险", scoreDelta: 20, levelAfter: "高风险" },
      { delayMs: 900, stage: "抓取数据源", source: "Etherscan", finding: "地址备注使用近似品牌名，历史更名 3 次", reason: "疑似规避追踪与误导用户", scoreDelta: 16, levelAfter: "高风险" },
      { delayMs: 950, stage: "行为建模", source: "链上行为统计", finding: "大量新钱包小额入金后无返还记录", reason: "符合冒充客服收款模式", scoreDelta: 19, levelAfter: "极高风险" },
      { delayMs: 700, stage: "生成结论", source: "AI 风险引擎", finding: "判定为仿冒官方地址", reason: "建议阻断并提醒用户核验官方公告", scoreDelta: 10, levelAfter: "极高风险" },
    ],
  },
  {
    address: "0xA1rdr0p8888FFeE778899aa0000000000000505",
    label: "假空投授权地址",
    riskType: "假空投诱导",
    severity: "high",
    evidenceSources: ["X.com 举报贴", "Etherscan 交易图谱", "已知黑名单库", "链上行为统计"],
    analysisScript: [
      { delayMs: 900, stage: "关联社交情报", source: "X.com", finding: "用户反馈点击空投链接后资产被转空", reason: "授权钓鱼路径清晰", scoreDelta: 19, levelAfter: "高风险" },
      { delayMs: 1100, stage: "抓取数据源", source: "Etherscan", finding: "关联地址在接收授权后批量触发 transferFrom", reason: "疑似利用无限授权盗取代币", scoreDelta: 23, levelAfter: "极高风险" },
      { delayMs: 900, stage: "黑名单交叉验证", source: "链上黑名单库", finding: "该地址簇被标记为授权盗币团伙", reason: "已关联 4 起已披露事件", scoreDelta: 17, levelAfter: "极高风险" },
      { delayMs: 700, stage: "生成结论", source: "AI 风险引擎", finding: "判定为假空投诱导地址", reason: "建议立即拦截并提示撤销授权", scoreDelta: 11, levelAfter: "极高风险" },
    ],
  },
  {
    address: "0xR1skExch0000aBcDef9876540000000000000606",
    label: "高风险跳转地址",
    riskType: "高风险交易所跳转",
    severity: "medium",
    evidenceSources: ["Etherscan 交易图谱", "链上行为统计", "X.com 社群讨论", "已知黑名单库"],
    analysisScript: [
      { delayMs: 850, stage: "抓取数据源", source: "Etherscan", finding: "资金频繁流向多个未实名交易所热钱包", reason: "路径复杂且缺乏透明归属", scoreDelta: 14, levelAfter: "中风险" },
      { delayMs: 900, stage: "行为建模", source: "链上行为统计", finding: "转入后 5 分钟内多链分发，追踪难度高", reason: "常见跳转清洗路径", scoreDelta: 15, levelAfter: "中高风险" },
      { delayMs: 850, stage: "关联社交情报", source: "X.com", finding: "社区提示该地址疑似 OTC 欺诈结算入口", reason: "存在交易对手违约历史", scoreDelta: 10, levelAfter: "中高风险" },
      { delayMs: 700, stage: "生成结论", source: "AI 风险引擎", finding: "判定为高风险跳转地址", reason: "建议降低额度并增加人工核验", scoreDelta: 8, levelAfter: "中高风险" },
    ],
  },
];

const contractRiskSamples = [
  {
    contract: "0xHoneyTr4p0fA11cE5522ddEE0000000000000707",
    name: "FakeYieldPool",
    maliciousType: "Honeypot",
    severity: "high",
    codeHints: ["检测到仅允许买入，不允许普通地址卖出", "`transfer` 对白名单外地址返回 false"],
    evidenceSources: ["Etherscan 合约代码", "X.com 安全预警", "链上行为统计"],
    maliciousAction: { approvalText: "授权 ETH 2.0000", drain: { eth: 0.12, usdc: 0 } },
    analysisScript: [
      { delayMs: 1000, stage: "拉取合约代码", source: "Etherscan", finding: "读取到 sell 限制逻辑仅放行 owner 与白名单", reason: "持仓用户无法正常退出，符合 Honeypot 特征", scoreDelta: 26, levelAfter: "极高风险" },
      { delayMs: 900, stage: "关联社区预警", source: "X.com", finding: "多位用户反馈买入后无法卖出", reason: "实证行为与代码逻辑一致", scoreDelta: 18, levelAfter: "极高风险" },
      { delayMs: 850, stage: "链上行为验证", source: "链上行为统计", finding: "仅创建者地址出现卖出记录", reason: "普通用户被困仓概率极高", scoreDelta: 16, levelAfter: "极高风险" },
      { delayMs: 700, stage: "生成结论", source: "AI 合约引擎", finding: "判定为 Honeypot 合约", reason: "建议禁止交互", scoreDelta: 8, levelAfter: "极高风险" },
    ],
  },
  {
    contract: "0xAppR0veSteaL33445566AA0000000000000808",
    name: "GiftAirdrop",
    maliciousType: "恶意授权盗取",
    severity: "high",
    codeHints: ["存在批量 `transferFrom` 调用入口", "授权后可被代理合约转走全部代币"],
    evidenceSources: ["Etherscan 合约代码", "已知黑名单库", "X.com 举报帖"],
    maliciousAction: { approvalText: "授权 USDC 5000.00", drain: { eth: 0.02, usdc: 90 } },
    analysisScript: [
      { delayMs: 900, stage: "拉取合约代码", source: "Etherscan", finding: "发现隐藏函数可调用外部地址批量拉取授权资产", reason: "超出正常空投合约权限范围", scoreDelta: 24, levelAfter: "极高风险" },
      { delayMs: 900, stage: "黑名单交叉验证", source: "链上黑名单库", finding: "同模板 bytecode 命中历史盗币样本", reason: "代码复用风险高", scoreDelta: 19, levelAfter: "极高风险" },
      { delayMs: 850, stage: "关联社交情报", source: "X.com", finding: "用户反馈授权后 USDC 被秒转", reason: "受害路径与函数调用日志一致", scoreDelta: 15, levelAfter: "极高风险" },
      { delayMs: 700, stage: "生成结论", source: "AI 合约引擎", finding: "判定为恶意授权盗取合约", reason: "建议拒绝授权与交互", scoreDelta: 10, levelAfter: "极高风险" },
    ],
  },
  {
    contract: "0xFrEezeL1st99887766Bb000000000000000909",
    name: "StableXPro",
    maliciousType: "黑名单冻结",
    severity: "medium",
    codeHints: ["管理员可任意冻结任意用户地址", "冻结后禁止转账且无透明申诉逻辑"],
    evidenceSources: ["Etherscan 合约代码", "链上行为统计", "X.com 讨论"],
    maliciousAction: { approvalText: "授权 USDC 1200.00", drain: { eth: 0, usdc: 28 } },
    analysisScript: [
      { delayMs: 900, stage: "拉取合约代码", source: "Etherscan", finding: "识别到 blacklist[address] 强制拦截转账", reason: "过度中心化控制风险", scoreDelta: 15, levelAfter: "中风险" },
      { delayMs: 900, stage: "链上行为验证", source: "链上行为统计", finding: "近 7 天新增 38 个冻结地址", reason: "冻结操作频率异常高", scoreDelta: 14, levelAfter: "中高风险" },
      { delayMs: 850, stage: "关联社交情报", source: "X.com", finding: "用户反馈资产被冻结后无法解锁", reason: "治理透明度不足", scoreDelta: 9, levelAfter: "中高风险" },
      { delayMs: 700, stage: "生成结论", source: "AI 合约引擎", finding: "判定为高控制风险合约", reason: "建议谨慎交互并降低仓位", scoreDelta: 7, levelAfter: "中高风险" },
    ],
  },
  {
    contract: "0xM1ntBackD00r77665544Cc0000000000001010",
    name: "USDXClassic",
    maliciousType: "隐藏增发",
    severity: "high",
    codeHints: ["mint 函数在代理层可被隐式调用", "总供应变化缺少事件披露"],
    evidenceSources: ["Etherscan 合约代码", "链上行为统计", "已知黑名单库"],
    maliciousAction: { approvalText: "授权 ETH 1.5000 + USDC 3000.00", drain: { eth: 0.07, usdc: 55 } },
    analysisScript: [
      { delayMs: 950, stage: "拉取合约代码", source: "Etherscan", finding: "发现 owner 可通过内部函数触发隐式 mint", reason: "可稀释持币者价值", scoreDelta: 21, levelAfter: "高风险" },
      { delayMs: 900, stage: "链上行为验证", source: "链上行为统计", finding: "供应量在无公告情况下突增 12%", reason: "与链上事件披露不一致", scoreDelta: 18, levelAfter: "极高风险" },
      { delayMs: 850, stage: "黑名单交叉验证", source: "链上黑名单库", finding: "同类模板合约曾被用于拉高出货", reason: "历史欺诈概率高", scoreDelta: 14, levelAfter: "极高风险" },
      { delayMs: 700, stage: "生成结论", source: "AI 合约引擎", finding: "判定为隐藏增发风险合约", reason: "建议禁止深度交互", scoreDelta: 9, levelAfter: "极高风险" },
    ],
  },
  {
    contract: "0xUpgr4deTrap22334455Dd0000000000001111",
    name: "MetaBridgeX",
    maliciousType: "代理后门升级",
    severity: "high",
    codeHints: ["代理管理员可随时更换实现合约", "升级权限未设置时间锁"],
    evidenceSources: ["Etherscan 合约代码", "X.com 安全观察", "链上行为统计"],
    maliciousAction: { approvalText: "授权 ETH 0.8000", drain: { eth: 0.04, usdc: 18 } },
    analysisScript: [
      { delayMs: 1000, stage: "拉取合约代码", source: "Etherscan", finding: "代理模式允许管理员无延迟升级实现逻辑", reason: "存在上线后逻辑突变风险", scoreDelta: 19, levelAfter: "高风险" },
      { delayMs: 900, stage: "链上行为验证", source: "链上行为统计", finding: "30 天内升级 5 次，且升级前后 ABI 差异大", reason: "功能边界不稳定", scoreDelta: 16, levelAfter: "高风险" },
      { delayMs: 900, stage: "关联社交情报", source: "X.com", finding: "社区记录曾在升级后新增转账限制", reason: "治理可信度不足", scoreDelta: 12, levelAfter: "中高风险" },
      { delayMs: 700, stage: "生成结论", source: "AI 合约引擎", finding: "判定为代理后门升级风险", reason: "建议仅小额测试并持续监控升级事件", scoreDelta: 8, levelAfter: "中高风险" },
    ],
  },
];

const elements = {
  claimBtn: document.getElementById("claimBtn"),
  toggleTotalBtn: document.getElementById("toggleTotalBtn"),
  totalBalance: document.getElementById("totalBalance"),
  ethTokenCard: document.getElementById("ethTokenCard"),
  usdcTokenCard: document.getElementById("usdcTokenCard"),
  ethBalance: document.getElementById("ethBalance"),
  usdcBalance: document.getElementById("usdcBalance"),
  transferCard: document.getElementById("transferCard"),
  addressSelect: document.getElementById("addressSelect"),
  tokenSelect: document.getElementById("tokenSelect"),
  amountInput: document.getElementById("amountInput"),
  startTransferBtn: document.getElementById("startTransferBtn"),
  dappGrid: document.getElementById("dappGrid"),
  selectedDappName: document.getElementById("selectedDappName"),
  selectedDappTip: document.getElementById("selectedDappTip"),
  startContractBtn: document.getElementById("startContractBtn"),
  setEthInput: document.getElementById("setEthInput"),
  setUsdcInput: document.getElementById("setUsdcInput"),
  applyBalanceBtn: document.getElementById("applyBalanceBtn"),
  interactionList: document.getElementById("interactionList"),
  recordsList: document.getElementById("recordsList"),
  resetWalletBtn: document.getElementById("resetWalletBtn"),
  tabButtons: document.querySelectorAll(".tab"),
  tabSections: document.querySelectorAll(".page-section"),
  analysisModal: document.getElementById("analysisModal"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  sourceTags: document.getElementById("sourceTags"),
  progressBar: document.getElementById("progressBar"),
  progressText: document.getElementById("progressText"),
  analysisStream: document.getElementById("analysisStream"),
  riskScore: document.getElementById("riskScore"),
  riskLevel: document.getElementById("riskLevel"),
  riskAction: document.getElementById("riskAction"),
  cancelActionBtn: document.getElementById("cancelActionBtn"),
  confirmActionBtn: document.getElementById("confirmActionBtn"),
  balanceModal: document.getElementById("balanceModal"),
  balanceModalTitle: document.getElementById("balanceModalTitle"),
  closeBalanceModalBtn: document.getElementById("closeBalanceModalBtn"),
  balanceHistorySubtitle: document.getElementById("balanceHistorySubtitle"),
  balanceHistoryList: document.getElementById("balanceHistoryList"),
};

// AI 分析会话状态，用于驱动实时进度与风险分
const analysisSession = {
  currentStep: 0,
  totalSteps: 0,
  score: 0,
  level: "待评估",
  status: "idle",
};

let analysisContext = null;
let analysisToken = 0;
let selectedContractIndex = 0;

function init() {
  renderSelectOptions();
  renderDappGrid();
  bindEvents();
  renderBalances();
  syncTestInputs();
  renderRecords();
  renderInteractions();
}

function bindEvents() {
  elements.claimBtn.addEventListener("click", claimTestAssets);
  elements.toggleTotalBtn.addEventListener("click", toggleTotalDisplay);
  elements.startTransferBtn.addEventListener("click", onStartTransfer);
  elements.startContractBtn.addEventListener("click", onStartContractInteraction);
  elements.cancelActionBtn.addEventListener("click", onCancelAction);
  elements.confirmActionBtn.addEventListener("click", onConfirmAction);
  elements.closeModalBtn.addEventListener("click", closeAnalysisModal);
  elements.closeBalanceModalBtn.addEventListener("click", closeBalanceModal);
  elements.applyBalanceBtn.addEventListener("click", onApplyBalance);
  elements.resetWalletBtn.addEventListener("click", onResetWallet);

  elements.ethTokenCard.addEventListener("click", () => openBalanceModal("ETH"));
  elements.usdcTokenCard.addEventListener("click", () => openBalanceModal("USDC"));
  elements.ethTokenCard.addEventListener("keydown", (event) => onTokenCardKeydown(event, "ETH"));
  elements.usdcTokenCard.addEventListener("keydown", (event) => onTokenCardKeydown(event, "USDC"));

  document.querySelectorAll(".transfer-quick").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const token = event.currentTarget.dataset.token;
      elements.tokenSelect.value = token;
      elements.transferCard.scrollIntoView({ behavior: "smooth", block: "center" });
      elements.transferCard.style.outline = "2px solid #8cb1ff";
      window.setTimeout(() => {
        elements.transferCard.style.outline = "none";
      }, 900);
    });
  });

  elements.tabButtons.forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tabTarget));
  });
}

function switchTab(target) {
  elements.tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tabTarget === target);
  });

  elements.tabSections.forEach((section) => {
    section.classList.toggle("hidden", section.dataset.tab !== target);
  });
}

function renderSelectOptions() {
  elements.addressSelect.innerHTML = addressRiskSamples
    .map((item, index) => `<option value="${index}">${item.label} | ${shorten(item.address)} | ${item.riskType}</option>`)
    .join("");
}

function renderDappGrid() {
  elements.dappGrid.innerHTML = contractRiskSamples
    .map((item, index) => {
      return `
        <article class="dapp-item ${index === selectedContractIndex ? "active" : ""}" data-index="${index}">
          <div class="dapp-icon">${makeDappIcon(item.name)}</div>
          <div>
            <div class="dapp-name">${item.name}</div>
            <div class="dapp-type">${item.maliciousType}</div>
          </div>
        </article>
      `;
    })
    .join("");

  elements.dappGrid.querySelectorAll(".dapp-item").forEach((card) => {
    card.addEventListener("click", () => {
      selectedContractIndex = Number(card.dataset.index);
      updateSelectedDapp();
      renderDappGrid();
    });
  });

  updateSelectedDapp();
}

function updateSelectedDapp() {
  const target = contractRiskSamples[selectedContractIndex];
  if (!target) {
    elements.selectedDappName.textContent = "当前：-";
    elements.selectedDappTip.textContent = "请选择一个恶意 DApp";
    return;
  }

  elements.selectedDappName.textContent = `当前：${target.name}`;
  const attackPlan = getContractAttackPlan(target);
  elements.selectedDappTip.textContent = `${target.maliciousType} | ${target.codeHints[0]} | 恶意操作：${attackPlan.approvalText} | 预计扣减：${attackPlan.drain.eth.toFixed(4)} ETH、${attackPlan.drain.usdc.toFixed(2)} USDC`;
}

function claimTestAssets() {
  state.balances.ETH += 1.25;
  state.balances.USDC += 1800;
  addBalanceChange("ETH", 1.25, "领取测试资产", "领取测试资产按钮");
  addBalanceChange("USDC", 1800, "领取测试资产", "领取测试资产按钮");
  addRecord("领取测试资产成功：+1.25 ETH，+1800 USDC（模拟）");
  renderBalances();
  syncTestInputs();
}

function onApplyBalance() {
  const nextEth = Number(elements.setEthInput.value);
  const nextUsdc = Number(elements.setUsdcInput.value);

  if (Number.isNaN(nextEth) || nextEth < 0 || Number.isNaN(nextUsdc) || nextUsdc < 0) {
    alert("请输入有效的余额数值。");
    return;
  }

  const diffEth = nextEth - state.balances.ETH;
  const diffUsdc = nextUsdc - state.balances.USDC;

  state.balances.ETH = nextEth;
  state.balances.USDC = nextUsdc;

  if (diffEth !== 0) {
    addBalanceChange("ETH", diffEth, "测试修改余额", "测试菜单手动修改");
  }
  if (diffUsdc !== 0) {
    addBalanceChange("USDC", diffUsdc, "测试修改余额", "测试菜单手动修改");
  }

  addRecord(`测试菜单修改余额：ETH=${nextEth.toFixed(4)}，USDC=${nextUsdc.toFixed(2)}`);
  renderBalances();
}

function onResetWallet() {
  state.balances.ETH = initialSnapshot.balances.ETH;
  state.balances.USDC = initialSnapshot.balances.USDC;
  state.isTotalHidden = false;
  state.balanceChanges = [];
  state.interactions = [];
  state.records = [...initialSnapshot.records];
  const labelNode = elements.toggleTotalBtn.querySelector(".total-label");
  labelNode.textContent = "钱包总额（点击隐藏）";

  addRecord("钱包状态已重置：余额、交互情况、操作记录已恢复初始状态。");
  renderBalances();
  renderRecords();
  renderInteractions();
  syncTestInputs();
}

function renderBalances() {
  elements.ethBalance.textContent = state.balances.ETH.toFixed(4);
  elements.usdcBalance.textContent = state.balances.USDC.toFixed(2);
  const total = state.balances.ETH * 2500 + state.balances.USDC;
  elements.totalBalance.textContent = state.isTotalHidden ? "******" : `$${total.toFixed(2)}`;
}

function syncTestInputs() {
  elements.setEthInput.value = state.balances.ETH.toFixed(4);
  elements.setUsdcInput.value = state.balances.USDC.toFixed(2);
}

function renderRecords() {
  elements.recordsList.innerHTML = state.records
    .slice()
    .reverse()
    .map((text) => `<li class="record-item">${text}</li>`)
    .join("");
}

function addRecord(text) {
  const line = `${new Date().toLocaleString("zh-CN", { hour12: false })} | ${text}`;
  state.records.push(line);
  renderRecords();
}

function addInteractionLog(item) {
  state.interactions.push({
    ...item,
    time: new Date().toLocaleString("zh-CN", { hour12: false }),
  });
  renderInteractions();
}

function renderInteractions() {
  if (state.interactions.length === 0) {
    elements.interactionList.innerHTML = "<li class=\"record-item\">暂无恶意地址或 DApp 交互记录。</li>";
    return;
  }

  elements.interactionList.innerHTML = state.interactions
    .slice()
    .reverse()
    .map((item) => {
      const extra = item.detail ? ` | ${item.detail}` : "";
      return `<li class="record-item">${item.time} | ${item.kind} | ${item.target} | 风险类型=${item.riskType} | 状态=${item.status} | 风险分=${item.score}${extra}</li>`;
    })
    .join("");
}

function onStartTransfer() {
  const target = addressRiskSamples[Number(elements.addressSelect.value)];
  const token = elements.tokenSelect.value;
  const amount = Number(elements.amountInput.value);

  if (!target || Number.isNaN(amount) || amount <= 0) {
    alert("请输入有效的转账数量。");
    return;
  }

  if (state.balances[token] < amount) {
    alert(`余额不足：当前 ${token} 可用 ${state.balances[token].toFixed(token === "ETH" ? 4 : 2)}`);
    return;
  }

  analysisContext = {
    mode: "transfer",
    token,
    amount,
    sample: target,
    title: "地址转账前 AI 风险分析",
  };

  runAnalysis(target);
}

function onStartContractInteraction() {
  const target = contractRiskSamples[selectedContractIndex];
  if (!target) {
    alert("请先选择恶意 DApp。");
    return;
  }

  analysisContext = {
    mode: "contract",
    sample: target,
    title: "合约交互前 AI 风险分析",
  };

  runAnalysis(target);
}

async function runAnalysis(sample) {
  analysisToken += 1;
  const currentToken = analysisToken;

  resetAnalysisUI();
  openAnalysisModal(analysisContext.title);
  paintSources(sample.evidenceSources);

  analysisSession.currentStep = 0;
  analysisSession.totalSteps = sample.analysisScript.length;
  analysisSession.score = 0;
  analysisSession.level = "待评估";
  analysisSession.status = "running";

  elements.confirmActionBtn.disabled = true;
  elements.confirmActionBtn.textContent = "分析中...";
  elements.cancelActionBtn.disabled = false;

  // 按预设脚本逐步执行，模拟 AI 实时推理
  for (let i = 0; i < sample.analysisScript.length; i += 1) {
    if (currentToken !== analysisToken) {
      return;
    }

    const step = sample.analysisScript[i];
    analysisSession.currentStep = i + 1;
    analysisSession.score = Math.min(100, analysisSession.score + step.scoreDelta);
    analysisSession.level = step.levelAfter;

    const progress = Math.round((analysisSession.currentStep / analysisSession.totalSteps) * 100);
    elements.progressBar.style.width = `${progress}%`;
    elements.progressText.textContent = `正在执行：${step.stage}（${analysisSession.currentStep}/${analysisSession.totalSteps}）`;

    const streamNode = createStreamNode(step);
    elements.analysisStream.appendChild(streamNode.wrap);
    elements.analysisStream.scrollTop = elements.analysisStream.scrollHeight;

    updateResultPanel();
    await typeText(streamNode.body, `发现了什么：${step.finding}\n证据来源：${step.source}\n为什么危险：${step.reason}\n风险等级变化：${step.levelAfter}`);
    await sleep(step.delayMs);
  }

  if (currentToken !== analysisToken) {
    return;
  }

  analysisSession.status = "done";
  elements.progressText.textContent = "分析完成：请决定是否继续操作";
  elements.riskAction.textContent = suggestActionByScore(analysisSession.score);
  elements.confirmActionBtn.disabled = false;
  elements.confirmActionBtn.textContent = analysisContext.mode === "transfer" ? "确认继续转账" : "确认继续交互";
}

function createStreamNode(step) {
  const wrap = document.createElement("article");
  wrap.className = "stream-item";

  const head = document.createElement("div");
  head.className = "stream-head";
  head.innerHTML = `<span><i class="pulse-dot"></i>${step.stage}</span><span>${currentTimeText()}</span>`;

  const body = document.createElement("div");
  body.className = "stream-body";

  wrap.appendChild(head);
  wrap.appendChild(body);
  return { wrap, body };
}

function updateResultPanel() {
  elements.riskScore.textContent = `${analysisSession.score}`;
  elements.riskLevel.textContent = analysisSession.level;
  elements.riskLevel.className = analysisSession.score >= 80 ? "stream-risk" : "";
}

function suggestActionByScore(score) {
  if (score >= 80) {
    return "建议强制拦截，禁止继续";
  }
  if (score >= 55) {
    return "建议取消操作，若继续需人工复核";
  }
  return "可继续操作，但建议保留监控";
}

function paintSources(sources) {
  elements.sourceTags.innerHTML = sources
    .map((item) => `<span class="source-tag">${item}</span>`)
    .join("");
}

function onCancelAction() {
  if (!analysisContext) {
    closeAnalysisModal();
    return;
  }

  if (analysisSession.status === "done") {
    if (analysisContext.mode === "transfer") {
      addInteractionLog({
        kind: "恶意地址转账",
        target: shorten(analysisContext.sample.address),
        riskType: analysisContext.sample.riskType,
        status: "已取消",
        score: analysisSession.score,
      });
    } else {
      addInteractionLog({
        kind: "恶意 DApp 交互",
        target: analysisContext.sample.name,
        riskType: analysisContext.sample.maliciousType,
        status: "已取消",
        score: analysisSession.score,
      });
    }
    addRecord("用户已取消本次高风险操作。");
  } else {
    addRecord("用户在分析过程中终止了本次模拟。");
  }

  closeAnalysisModal();
}

function onConfirmAction() {
  if (!analysisContext || analysisSession.status !== "done") {
    return;
  }

  if (analysisContext.mode === "transfer") {
    state.balances[analysisContext.token] -= analysisContext.amount;
    addBalanceChange(
      analysisContext.token,
      -analysisContext.amount,
      "模拟转账",
      `目标=${shorten(analysisContext.sample.address)}，风险类型=${analysisContext.sample.riskType}`
    );

    addInteractionLog({
      kind: "恶意地址转账",
      target: shorten(analysisContext.sample.address),
      riskType: analysisContext.sample.riskType,
      status: "已执行",
      score: analysisSession.score,
    });

    addRecord(
      `模拟转账已执行：向 ${shorten(analysisContext.sample.address)} 转出 ${analysisContext.amount} ${analysisContext.token}，` +
      `风险类型=${analysisContext.sample.riskType}，风险分=${analysisSession.score}`
    );
    renderBalances();
    syncTestInputs();
  } else {
    // 恶意 DApp 交互后，模拟授权与资产被盗，余额会减少
    const attackPlan = getContractAttackPlan(analysisContext.sample);
    applyDrainLoss(attackPlan.drain, attackPlan.approvalText);

    addInteractionLog({
      kind: "恶意 DApp 交互",
      target: analysisContext.sample.name,
      riskType: analysisContext.sample.maliciousType,
      status: "已执行",
      score: analysisSession.score,
      detail: `恶意操作=${attackPlan.approvalText}，扣减=${attackPlan.drain.eth.toFixed(4)} ETH/${attackPlan.drain.usdc.toFixed(2)} USDC`,
    });

    addRecord(
      `模拟合约交互已执行：${analysisContext.sample.name}（${analysisContext.sample.maliciousType}），` +
      `风险分=${analysisSession.score}，恶意操作=${attackPlan.approvalText}，资产变化：-${attackPlan.drain.eth.toFixed(4)} ETH，-${attackPlan.drain.usdc.toFixed(2)} USDC`
    );
    renderBalances();
    syncTestInputs();
  }

  closeAnalysisModal();
}

function openAnalysisModal(title) {
  const titleNode = document.getElementById("analysisTitle");
  titleNode.textContent = title;
  elements.analysisModal.classList.remove("hidden");
}

function closeAnalysisModal() {
  analysisToken += 1;
  analysisSession.status = "idle";
  analysisContext = null;
  elements.analysisModal.classList.add("hidden");
}

function resetAnalysisUI() {
  elements.analysisStream.innerHTML = "";
  elements.progressBar.style.width = "0";
  elements.progressText.textContent = "准备开始分析...";
  elements.riskScore.textContent = "0";
  elements.riskLevel.textContent = "待评估";
  elements.riskAction.textContent = "等待分析完成";
}

function typeText(container, text) {
  // 打字机效果：增强实时分析感
  return new Promise((resolve) => {
    const paragraph = document.createElement("p");
    container.appendChild(paragraph);

    let i = 0;
    const timer = window.setInterval(() => {
      paragraph.textContent = text.slice(0, i);
      i += 1;
      if (i > text.length) {
        window.clearInterval(timer);
        resolve();
      }
    }, 12);
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function onTokenCardKeydown(event, token) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openBalanceModal(token);
  }
}

function openBalanceModal(token) {
  elements.balanceModalTitle.textContent = `${token} 余额变动明细`;
  elements.balanceHistorySubtitle.textContent = `展示 ${token} 最近的余额变化与触发原因`;
  renderBalanceHistory(token);
  elements.balanceModal.classList.remove("hidden");
}

function closeBalanceModal() {
  elements.balanceModal.classList.add("hidden");
}

function renderBalanceHistory(token) {
  const changes = state.balanceChanges
    .filter((item) => item.token === token)
    .slice()
    .reverse();

  if (changes.length === 0) {
    elements.balanceHistoryList.innerHTML = `<li class="record-item">暂无 ${token} 余额变动记录。</li>`;
    return;
  }

  elements.balanceHistoryList.innerHTML = changes
    .map((item) => {
      return `<li class="record-item">${item.time} | ${item.action} | ${formatDelta(item.delta, token)} | 触发：${item.detail} | 变动后余额：${formatTokenBalance(item.after, token)}</li>`;
    })
    .join("");
}

function addBalanceChange(token, delta, action, detail) {
  state.balanceChanges.push({
    token,
    delta,
    action,
    detail,
    after: state.balances[token],
    time: new Date().toLocaleString("zh-CN", { hour12: false }),
  });
}

function toggleTotalDisplay() {
  state.isTotalHidden = !state.isTotalHidden;
  const labelNode = elements.toggleTotalBtn.querySelector(".total-label");
  labelNode.textContent = state.isTotalHidden
    ? "钱包总额（已隐藏，点击显示信息）"
    : "钱包总额（点击隐藏）";
  renderBalances();
}

function buildContractDrainPlan(severity) {
  const preset = severity === "high"
    ? { eth: 0.08, usdc: 40 }
    : { eth: 0.03, usdc: 12 };

  return {
    eth: Math.min(state.balances.ETH, preset.eth),
    usdc: Math.min(state.balances.USDC, preset.usdc),
  };
}

function getContractAttackPlan(sample) {
  const configured = sample.maliciousAction || {};
  const drainPreset = configured.drain || buildContractDrainPlan(sample.severity);
  const approvalText = configured.approvalText || "授权代币无限额度";

  return {
    approvalText,
    drain: {
      eth: Math.min(state.balances.ETH, drainPreset.eth || 0),
      usdc: Math.min(state.balances.USDC, drainPreset.usdc || 0),
    },
  };
}

function applyDrainLoss(drainPlan, approvalText) {
  if (drainPlan.eth > 0) {
    state.balances.ETH -= drainPlan.eth;
    addBalanceChange("ETH", -drainPlan.eth, "恶意 DApp 交互扣减", `${approvalText} 后触发 ETH 扣减`);
  }

  if (drainPlan.usdc > 0) {
    state.balances.USDC -= drainPlan.usdc;
    addBalanceChange("USDC", -drainPlan.usdc, "恶意 DApp 交互扣减", `${approvalText} 后触发 USDC 扣减`);
  }
}

function shorten(addr) {
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

function currentTimeText() {
  return new Date().toLocaleTimeString("zh-CN", { hour12: false });
}

function formatDelta(delta, token) {
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${formatTokenBalance(delta, token)} ${token}`;
}

function formatTokenBalance(value, token) {
  return token === "ETH" ? Number(value).toFixed(4) : Number(value).toFixed(2);
}

function makeDappIcon(name) {
  return name.slice(0, 2).toUpperCase();
}

init();

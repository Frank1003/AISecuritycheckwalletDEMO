import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@repo/ui/components/button'
import { Card } from '@repo/ui/components/card'
import { Input } from '@repo/ui/components/input'
import { Select } from '@repo/ui/components/select'
import { addressRiskSamples, contractRiskSamples } from '@/data/samples'
import { walletCoreService } from '@/services/walletCoreService'
import type { AddressSource, AnalysisStep, BalanceChange, InteractionAuditRecord } from '@/types'

type TabKey = 'wallet' | 'contract' | 'test'

type TokenKey = 'ETH' | 'USDC'

type ActionContext =
  | { mode: 'transfer'; token: TokenKey; amount: number; label: string; targetAddress: string; riskType: string; aiAdvice: string }
  | { mode: 'contract'; name: string; contractAddress: string; riskType: string; approvalText: string; drainEth: number; drainUsdc: number; aiAdvice: string }

interface AnalysisLog extends AnalysisStep {
  time: string
}

interface AnalysisState {
  open: boolean
  title: string
  score: number
  level: string
  progressText: string
  totalSteps: number
  sources: string[]
  logs: AnalysisLog[]
  done: boolean
}

const initialAnalysis: AnalysisState = {
  open: false,
  title: 'AI 风控实时分析',
  score: 0,
  level: '待评估',
  progressText: '准备开始分析...',
  totalSteps: 0,
  sources: [],
  logs: [],
  done: false
}

const basePrice = { ETH: 2500, USDC: 1 }

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('wallet')
  const [balances, setBalances] = useState<{ ETH: number; USDC: number }>({ ETH: 0, USDC: 0 })
  const [isTotalHidden, setIsTotalHidden] = useState(false)
  const [balanceChanges, setBalanceChanges] = useState<BalanceChange[]>([])
  const [records, setRecords] = useState<string[]>(['系统初始化：检测到未创建钱包，已进入创建钱包引导。'])
  const [audits, setAudits] = useState<InteractionAuditRecord[]>([])

  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0)
  const [selectedToken, setSelectedToken] = useState<TokenKey>('ETH')
  const [amountInput, setAmountInput] = useState('0.1')

  const [selectedContractIndex, setSelectedContractIndex] = useState(0)

  const [analysis, setAnalysis] = useState<AnalysisState>(initialAnalysis)
  const [analysisContext, setAnalysisContext] = useState<ActionContext | null>(null)
  const [pendingExecution, setPendingExecution] = useState<ActionContext | null>(null)

  const analysisTokenRef = useRef(0)

  const [coreReady, setCoreReady] = useState(false)
  const [coreMode, setCoreMode] = useState('初始化中')
  const [walletId, setWalletId] = useState('')
  const [mnemonicMasked, setMnemonicMasked] = useState('')
  const [ethAddress, setEthAddress] = useState('')
  const [addressSource, setAddressSource] = useState<AddressSource>('unavailable')
  const [showFullAddress, setShowFullAddress] = useState(false)
  const [signInput, setSignInput] = useState('demo message')
  const [signature, setSignature] = useState('')
  const [walletPassword, setWalletPassword] = useState('12345678')
  const [coreStatus, setCoreStatus] = useState('等待初始化')
  const [creatingWallet, setCreatingWallet] = useState(false)
  const [signingAction, setSigningAction] = useState(false)

  const [setEthInput, setSetEthInput] = useState('0.0000')
  const [setUsdcInput, setSetUsdcInput] = useState('0.00')

  const [balanceModalToken, setBalanceModalToken] = useState<TokenKey | null>(null)
  const [signNotice, setSignNotice] = useState<{
    title: string
    summary: string
    advice: string
    signatureDigest: string
    riskScore: number
    lossText: string
  } | null>(null)

  const totalBalance = useMemo(() => balances.ETH * basePrice.ETH + balances.USDC * basePrice.USDC, [balances])

  const selectedAddress = addressRiskSamples[selectedAddressIndex]
  const selectedContract = contractRiskSamples[selectedContractIndex]

  useEffect(() => {
    void initCore()
  }, [])

  useEffect(() => {
    setSetEthInput(balances.ETH.toFixed(4))
    setSetUsdcInput(balances.USDC.toFixed(2))
  }, [balances])

  async function initCore() {
    try {
      await walletCoreService.init()
      setCoreReady(true)
      setCoreMode(walletCoreService.getRuntime().mode)
      setCoreStatus('内核初始化完成')
    } catch (error) {
      setCoreReady(false)
      setCoreMode('初始化失败')
      setCoreStatus(`初始化失败：${getErrorMessage(error)}`)
    }
  }

  function nowText() {
    return new Date().toLocaleString('zh-CN', { hour12: false })
  }

  function addRecord(text: string) {
    setRecords((prev) => [...prev, `${nowText()} | ${text}`])
  }

  function addBalanceChange(
    token: TokenKey,
    delta: number,
    action: string,
    detail: string,
    nextValue: number,
    source: AddressSource = addressSource
  ) {
    setBalanceChanges((prev) => [
      ...prev,
      {
        token,
        delta,
        action,
        detail,
        after: nextValue,
        time: nowText(),
        addressSource: source
      }
    ])
  }

  function claimAssets() {
    const next = { ETH: balances.ETH + 1.25, USDC: balances.USDC + 1800 }
    setBalances(next)
    addBalanceChange('ETH', 1.25, '领取测试资产', '领取按钮', next.ETH, 'unavailable')
    addBalanceChange('USDC', 1800, '领取测试资产', '领取按钮', next.USDC, 'unavailable')
    addRecord('领取测试资产成功：+1.25 ETH，+1800 USDC（模拟）')
  }

  function jumpTransfer(token: TokenKey) {
    setSelectedToken(token)
    setActiveTab('wallet')
    const el = document.getElementById('transfer-card')
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function runAnalysis(title: string, sources: string[], script: AnalysisStep[]) {
    analysisTokenRef.current += 1
    const token = analysisTokenRef.current

    setAnalysis({
      open: true,
      title,
      score: 0,
      level: '待评估',
      progressText: '准备开始分析...',
      totalSteps: script.length,
      sources,
      logs: [],
      done: false
    })

    let score = 0

    for (let i = 0; i < script.length; i += 1) {
      if (token !== analysisTokenRef.current) {
        return false
      }
      const step = script[i]
      score = Math.min(100, score + step.scoreDelta)

      setAnalysis((prev) => ({
        ...prev,
        score,
        level: step.levelAfter,
        progressText: `正在执行：${step.stage}（${i + 1}/${script.length}）`,
        logs: [...prev.logs, { ...step, time: nowText() }]
      }))

      await sleep(step.delayMs)
    }

    if (token !== analysisTokenRef.current) {
      return false
    }

    setAnalysis((prev) => ({
      ...prev,
      done: true,
      progressText: '分析完成：请决定是否继续操作'
    }))

    return true
  }

  async function preSign(actionLabel: string) {
    if (!walletId) {
      throw new Error('请先在内核能力区创建钱包')
    }
    const payload = `${actionLabel} @ ${Date.now()}`
    const sig = await walletCoreService.signMessage(walletId, walletPassword, payload)
    setSignature(sig)
    return summarizeSignature(sig)
  }

  function closeSignNotice() {
    setSignNotice(null)
  }

  async function startTransferFlow() {
    const amount = Number(amountInput)
    if (Number.isNaN(amount) || amount <= 0) {
      alert('请输入有效转账数量')
      return
    }

    if (balances[selectedToken] < amount) {
      alert('余额不足')
      return
    }

    try {
      setAnalysisContext({
        mode: 'transfer',
        token: selectedToken,
        amount,
        label: selectedAddress.label,
        targetAddress: selectedAddress.address,
        riskType: selectedAddress.riskType,
        aiAdvice: selectedAddress.aiAdvice
      })
      const done = await runAnalysis('签名转账操作（Token Core）风险分析', selectedAddress.evidenceSources, selectedAddress.analysisScript)
      if (!done) return

      addRecord(`本次地址来源：${getAddressSourceLabel(addressSource)}`)
    } catch (error) {
      alert(getErrorMessage(error))
    }
  }

  async function startContractFlow() {
    try {
      const action = selectedContract.maliciousAction
      const drainEth = Math.min(balances.ETH, action.drain.eth)
      const drainUsdc = Math.min(balances.USDC, action.drain.usdc)

      setAnalysisContext({
        mode: 'contract',
        name: selectedContract.name,
        contractAddress: selectedContract.contract,
        riskType: selectedContract.maliciousType,
        approvalText: action.approvalText,
        drainEth,
        drainUsdc,
        aiAdvice: selectedContract.aiAdvice
      })
      const done = await runAnalysis('签名合约操作（Token Core）风险分析', selectedContract.evidenceSources, selectedContract.analysisScript)
      if (!done) return

      addRecord(`本次地址来源：${getAddressSourceLabel(addressSource)}`)
    } catch (error) {
      alert(getErrorMessage(error))
    }
  }

  function closeAnalysis() {
    analysisTokenRef.current += 1
    setAnalysis(initialAnalysis)
    setAnalysisContext(null)
  }

  async function confirmAction() {
    if (!analysis.done || !analysisContext) {
      return
    }
    setSigningAction(true)
    try {
      const signPayload =
        analysisContext.mode === 'transfer'
          ? `transfer:${analysisContext.targetAddress}:${analysisContext.token}:${analysisContext.amount}`
          : `contract:${analysisContext.contractAddress}:${analysisContext.approvalText}`
      const sigDigest = await preSign(signPayload)
      addRecord(
        analysisContext.mode === 'transfer'
          ? `Token Core 签名完成：签名转账操作，摘要=${sigDigest}`
          : `Token Core 签名完成：签名合约操作，摘要=${sigDigest}`
      )

      const summary =
        analysisContext.mode === 'transfer'
          ? `你已经交互恶意转账地址：${analysisContext.label}（${analysisContext.riskType}）`
          : `你已经交互恶意合约：${analysisContext.name}（${analysisContext.riskType}）`

      setPendingExecution(analysisContext)
      setSignNotice({
        title: '经明御钱包实时监控发现',
        summary,
        advice: analysisContext.aiAdvice,
        signatureDigest: sigDigest,
        riskScore: analysis.score,
        lossText: formatLossForNotice(analysisContext)
      })
      closeAnalysis()
    } catch (error) {
      alert(getErrorMessage(error))
    } finally {
      setSigningAction(false)
    }
  }

  function executePendingAction() {
    if (!pendingExecution) {
      closeSignNotice()
      return
    }

    if (pendingExecution.mode === 'transfer') {
      const nextBalance = {
        ...balances,
        [pendingExecution.token]: balances[pendingExecution.token] - pendingExecution.amount
      }
      setBalances(nextBalance)
      addBalanceChange(
        pendingExecution.token,
        -pendingExecution.amount,
        '模拟转账',
        `风险类型=${pendingExecution.riskType}`,
        nextBalance[pendingExecution.token]
      )
      addRecord(
        `模拟转账已执行：${pendingExecution.label}，转出 ${pendingExecution.amount} ${pendingExecution.token}，风险分=${signNotice?.riskScore ?? analysis.score}`
      )
      setAudits((prev) => [
        ...prev,
        {
          time: nowText(),
          kind: '恶意地址转账',
          target: pendingExecution.label,
          riskType: pendingExecution.riskType,
          approvalText: '签名通过',
          drainEth: pendingExecution.token === 'ETH' ? pendingExecution.amount : 0,
          drainUsdc: pendingExecution.token === 'USDC' ? pendingExecution.amount : 0,
          signatureDigest: summarizeSignature(signature),
          addressSource,
          status: '已执行'
        }
      ])
    } else {
      const nextBalance = {
        ETH: balances.ETH - pendingExecution.drainEth,
        USDC: balances.USDC - pendingExecution.drainUsdc
      }
      setBalances(nextBalance)
      if (pendingExecution.drainEth > 0) {
        addBalanceChange('ETH', -pendingExecution.drainEth, '恶意 DApp 交互扣减', `${pendingExecution.approvalText} 后触发扣减`, nextBalance.ETH)
      }
      if (pendingExecution.drainUsdc > 0) {
        addBalanceChange('USDC', -pendingExecution.drainUsdc, '恶意 DApp 交互扣减', `${pendingExecution.approvalText} 后触发扣减`, nextBalance.USDC)
      }
      addRecord(
        `恶意合约交互已执行：${pendingExecution.name}，恶意操作=${pendingExecution.approvalText}，扣减 ${pendingExecution.drainEth.toFixed(4)} ETH / ${pendingExecution.drainUsdc.toFixed(2)} USDC`
      )
      setAudits((prev) => [
        ...prev,
        {
          time: nowText(),
          kind: '恶意 DApp 交互',
          target: pendingExecution.name,
          riskType: pendingExecution.riskType,
          approvalText: pendingExecution.approvalText,
          drainEth: pendingExecution.drainEth,
          drainUsdc: pendingExecution.drainUsdc,
          signatureDigest: summarizeSignature(signature),
          addressSource,
          status: '已执行'
        }
      ])
    }

    setPendingExecution(null)
    closeSignNotice()
  }

  function cancelPendingExecution() {
    if (pendingExecution) {
      if (pendingExecution.mode === 'transfer') {
        setAudits((prev) => [
          ...prev,
          {
            time: nowText(),
            kind: '恶意地址转账',
            target: pendingExecution.label,
            riskType: pendingExecution.riskType,
            approvalText: '已取消',
            drainEth: 0,
            drainUsdc: 0,
            signatureDigest: summarizeSignature(signature),
            addressSource,
            status: '已取消'
          }
        ])
      } else {
        setAudits((prev) => [
          ...prev,
          {
            time: nowText(),
            kind: '恶意 DApp 交互',
            target: pendingExecution.name,
            riskType: pendingExecution.riskType,
            approvalText: '已取消',
            drainEth: 0,
            drainUsdc: 0,
            signatureDigest: summarizeSignature(signature),
            addressSource,
            status: '已取消'
          }
        ])
      }
      addRecord('用户在风险提示阶段取消了本次操作')
    }
    setPendingExecution(null)
    closeSignNotice()
  }

  function cancelAction() {
    if (analysis.done && analysisContext) {
      if (analysisContext.mode === 'transfer') {
        setAudits((prev) => [
          ...prev,
          {
            time: nowText(),
            kind: '恶意地址转账',
            target: analysisContext.label,
            riskType: analysisContext.riskType,
            approvalText: '已取消',
            drainEth: 0,
            drainUsdc: 0,
            signatureDigest: summarizeSignature(signature),
            addressSource,
            status: '已取消'
          }
        ])
      } else {
        setAudits((prev) => [
          ...prev,
          {
            time: nowText(),
            kind: '恶意 DApp 交互',
            target: analysisContext.name,
            riskType: analysisContext.riskType,
            approvalText: '已取消',
            drainEth: 0,
            drainUsdc: 0,
            signatureDigest: summarizeSignature(signature),
            addressSource,
            status: '已取消'
          }
        ])
      }
      addRecord('用户取消了本次高风险操作')
    }
    closeAnalysis()
  }

  async function createWallet() {
    setCreatingWallet(true)
    try {
      const info = await walletCoreService.createWallet(walletPassword)
      setWalletId(info.walletId)
      setMnemonicMasked(info.mnemonicMasked)
      setEthAddress(info.ethAddress)
      setAddressSource(info.addressSource)
      setShowFullAddress(false)
      setCoreStatus('钱包创建成功')
      addRecord(`钱包创建成功，本次地址来源：${getAddressSourceLabel(info.addressSource)}`)
    } catch (error) {
      setCoreStatus(`创建失败：${getErrorMessage(error)}`)
      addRecord(`钱包创建失败：${getErrorMessage(error)}`)
    } finally {
      setCreatingWallet(false)
    }
  }

  async function signMessage() {
    try {
      const result = await walletCoreService.signMessage(walletId, walletPassword, signInput)
      setSignature(result)
      setCoreStatus('签名成功')
    } catch (error) {
      setCoreStatus(`签名失败：${getErrorMessage(error)}`)
    }
  }

  function applyBalanceChange() {
    const nextEth = Number(setEthInput)
    const nextUsdc = Number(setUsdcInput)

    if (Number.isNaN(nextEth) || nextEth < 0 || Number.isNaN(nextUsdc) || nextUsdc < 0) {
      alert('请输入有效余额')
      return
    }

    const diffEth = nextEth - balances.ETH
    const diffUsdc = nextUsdc - balances.USDC

    setBalances({ ETH: nextEth, USDC: nextUsdc })

    if (diffEth !== 0) {
      addBalanceChange('ETH', diffEth, '测试修改余额', '测试菜单手动修改', nextEth, 'unavailable')
    }
    if (diffUsdc !== 0) {
      addBalanceChange('USDC', diffUsdc, '测试修改余额', '测试菜单手动修改', nextUsdc, 'unavailable')
    }
    addRecord(`测试菜单修改余额：ETH=${nextEth.toFixed(4)}，USDC=${nextUsdc.toFixed(2)}`)
  }

  function resetWalletState() {
    setBalances({ ETH: 0, USDC: 0 })
    setIsTotalHidden(false)
    setBalanceChanges([])
    setAudits([])
    setWalletId('')
    setMnemonicMasked('')
    setEthAddress('')
    setAddressSource('unavailable')
    setSignature('')
    setShowFullAddress(false)
    setRecords(['系统初始化：检测到未创建钱包，已进入创建钱包引导。', `${nowText()} | 钱包状态已重置`])
    setSetEthInput('0.0000')
    setSetUsdcInput('0.00')
  }

  const tokenChanges = useMemo(() => {
    if (!balanceModalToken) return []
    return balanceChanges.filter((item) => item.token === balanceModalToken).slice().reverse()
  }, [balanceChanges, balanceModalToken])

  return (
    <div className="app-bg">
      <main className="phone-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">安全钱包演示</p>
            <h1>明御安全钱包</h1>
          </div>
          <Button onClick={claimAssets} disabled={!walletId}>领取测试资产</Button>
        </header>

        <section className="tabs">
          <button className={activeTab === 'wallet' ? 'tab active' : 'tab'} onClick={() => setActiveTab('wallet')} disabled={!walletId}>钱包</button>
          <button className={activeTab === 'contract' ? 'tab active' : 'tab'} onClick={() => setActiveTab('contract')} disabled={!walletId}>合约</button>
          <button className={activeTab === 'test' ? 'tab active' : 'tab'} onClick={() => setActiveTab('test')} disabled={!walletId}>测试</button>
        </section>

        {activeTab === 'wallet' ? (
          <>
            <Card title="资产总览" className="balance-card">
              <button className="total-block" onClick={() => setIsTotalHidden((prev) => !prev)}>
                <span className="total-label">钱包总额（点击隐藏）</span>
                <strong className="total-value">{isTotalHidden ? '******' : `$${totalBalance.toFixed(2)}`}</strong>
              </button>
              <div className="address-summary">
                <p className="tiny balance-tiny">ETH 地址（Token Core）</p>
                {ethAddress ? (
                  <button className="address-btn" onClick={() => setShowFullAddress((prev) => !prev)}>
                    {showFullAddress ? ethAddress : shorten(ethAddress)}
                  </button>
                ) : (
                  <p className="tiny balance-tiny">未获得可展示地址</p>
                )}
              </div>
            </Card>

            <Card title="资产" className="asset-card">
              <div className="asset-row" role="button" tabIndex={0} onClick={() => setBalanceModalToken('ETH')}>
                <span className="asset-name">ETH</span>
                <span className="asset-balance">{balances.ETH.toFixed(4)}</span>
                <Button variant="secondary" className="quick-btn" onClick={(e) => { e.stopPropagation(); jumpTransfer('ETH') }}>转账</Button>
              </div>
              <div className="asset-row" role="button" tabIndex={0} onClick={() => setBalanceModalToken('USDC')}>
                <span className="asset-name">USDC</span>
                <span className="asset-balance">{balances.USDC.toFixed(2)}</span>
                <Button variant="secondary" className="quick-btn" onClick={(e) => { e.stopPropagation(); jumpTransfer('USDC') }}>转账</Button>
              </div>
            </Card>

            <Card title="转账模拟" className="transfer-card" >
              <div id="transfer-card" />
              <label>目标地址（内置风险样本）</label>
              <Select value={String(selectedAddressIndex)} onChange={(e) => setSelectedAddressIndex(Number(e.target.value))}>
                {addressRiskSamples.map((item, index) => (
                  <option value={index} key={item.address}>{item.label} | {shorten(item.address)} | {item.riskType}</option>
                ))}
              </Select>

              <div className="grid-two">
                <div>
                  <label>币种</label>
                  <Select value={selectedToken} onChange={(e) => setSelectedToken(e.target.value as TokenKey)}>
                    <option value="ETH">ETH</option>
                    <option value="USDC">USDC</option>
                  </Select>
                </div>
                <div>
                  <label>数量</label>
                  <Input value={amountInput} onChange={(e) => setAmountInput(e.target.value)} type="number" step="0.0001" min="0" />
                </div>
              </div>
              <Button block onClick={() => void startTransferFlow()}>开始风险分析并转账</Button>
            </Card>
          </>
        ) : null}

        {activeTab === 'contract' ? (
          <>
            <Card title="恶意 DApp 列表（Token UI 组件渲染）">
              <div className="dapp-grid">
                {contractRiskSamples.map((item, index) => (
                  <article
                    key={item.contract}
                    className={index === selectedContractIndex ? 'dapp-item active' : 'dapp-item'}
                    onClick={() => setSelectedContractIndex(index)}
                  >
                    <div className="dapp-icon">{item.name.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <div className="dapp-name">{item.name}</div>
                      <div className="dapp-type">{item.maliciousType}</div>
                    </div>
                  </article>
                ))}
              </div>
            </Card>

            <Card title="DApp 交互模拟（含恶意授权与扣减）">
              <p className="tiny">当前：{selectedContract.name}</p>
              <p className="tiny">恶意操作：{selectedContract.maliciousAction.approvalText}</p>
              <p className="tiny">预计扣减：{selectedContract.maliciousAction.drain.eth.toFixed(4)} ETH / {selectedContract.maliciousAction.drain.usdc.toFixed(2)} USDC</p>
              <Button variant="warning" block onClick={() => void startContractFlow()}>模拟交互并启动 AI 分析</Button>
            </Card>
          </>
        ) : null}

        {activeTab === 'test' ? (
          <>
            <Card title="Token Core 内核能力" className="core-card">
              <p className="runtime">内核运行模式：{coreMode}</p>
              <div className="grid-two">
                <div>
                  <label>钱包密码</label>
                  <Input value={walletPassword} onChange={(e) => setWalletPassword(e.target.value)} />
                </div>
                <div className="actions-inline">
                  <Button onClick={() => void createWallet()} disabled={!coreReady || creatingWallet}>{creatingWallet ? '创建中...' : '创建钱包'}</Button>
                </div>
              </div>
              <p className="tiny">walletId：{walletId || '-'}</p>
              <p className="tiny">助记词（遮罩）：{mnemonicMasked || '-'}</p>
              <p className="tiny">ETH 地址来源：{getAddressSourceLabel(addressSource)}</p>
              <p className="tiny">
                ETH 地址：
                {ethAddress ? (showFullAddress ? ethAddress : shorten(ethAddress)) : '-'}
              </p>
              <div className="grid-two">
                <div>
                  <label>待签名内容</label>
                  <Input value={signInput} onChange={(e) => setSignInput(e.target.value)} />
                </div>
                <div className="actions-inline">
                  <Button variant="warning" onClick={() => void signMessage()} disabled={!walletId}>消息签名</Button>
                </div>
              </div>
              <p className="tiny">签名结果：{signature || '-'}</p>
              <p className="tiny">状态：{coreStatus}</p>
            </Card>

            <Card title="测试工具（修改余额）">
              <div className="grid-two">
                <div>
                  <label>ETH 余额</label>
                  <Input value={setEthInput} onChange={(e) => setSetEthInput(e.target.value)} type="number" step="0.0001" min="0" />
                </div>
                <div>
                  <label>USDC 余额</label>
                  <Input value={setUsdcInput} onChange={(e) => setSetUsdcInput(e.target.value)} type="number" step="0.01" min="0" />
                </div>
              </div>
              <Button block onClick={applyBalanceChange}>应用余额修改</Button>
            </Card>

            <Card title="恶意交互审计日志">
              <ul className="list-grid">
                {audits.length === 0 ? <li className="list-item">暂无恶意交互日志</li> : audits.slice().reverse().map((item, idx) => (
                  <li className="list-item" key={`${item.time}-${idx}`}>
                    {item.time} | {item.kind} | {item.target} | 地址来源={getAddressSourceLabel(item.addressSource)} | 授权={item.approvalText} | 扣减={item.drainEth.toFixed(4)} ETH/{item.drainUsdc.toFixed(2)} USDC | 签名={item.signatureDigest} | 状态={item.status}
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="操作记录">
              <ul className="list-grid">
                {records.slice().reverse().map((item, idx) => (
                  <li className="list-item" key={`${idx}-${item}`}>{item}</li>
                ))}
              </ul>
            </Card>

            <Card title="重置">
              <Button variant="danger" block onClick={resetWalletState}>重置钱包状态</Button>
            </Card>
          </>
        ) : null}
      </main>

      {!walletId ? (
        <div className="wallet-mask">
          <div className="wallet-mask-panel">
            <h2>创建钱包后继续</h2>
            <p>当前未检测到钱包，请先创建钱包以解锁资产、转账和合约交互功能。</p>
            <label>钱包密码</label>
            <Input value={walletPassword} onChange={(e) => setWalletPassword(e.target.value)} />
            <Button block onClick={() => void createWallet()} disabled={!coreReady || creatingWallet}>
              {creatingWallet ? '创建中...' : '立即创建钱包'}
            </Button>
            <p className="tiny">内核状态：{coreStatus}</p>
            <p className="tiny">运行模式：{coreMode}</p>
          </div>
        </div>
      ) : null}

      {signNotice ? (
        <div className="modal-overlay">
          <div className="modal-panel">
            <header className="modal-header">
              <h2>{signNotice.title}</h2>
            </header>
            <section className="source-board">
              <p>{signNotice.summary}</p>
              <p className="tiny">签名摘要：{signNotice.signatureDigest}</p>
              <p className="tiny">风险分：{signNotice.riskScore}/100</p>
              <p className="tiny">预计损失：{signNotice.lossText}</p>
            </section>
            <section className="result-panel">
              <p>AI 补救建议：{signNotice.advice}</p>
            </section>
            <footer className="modal-actions">
              <Button variant="danger" onClick={executePendingAction}>我已经知晓</Button>
            </footer>
          </div>
        </div>
      ) : null}

      {analysis.open ? (
        <div className="modal-overlay">
          <div className="modal-panel">
            <header className="modal-header">
              <h2>{analysis.title}</h2>
              <button className="close-btn" onClick={cancelAction}>×</button>
            </header>

            <section className="source-board">
              <p>数据来源融合</p>
              <div className="source-tags">
                {analysis.sources.map((item) => <span className="source-tag" key={item}>{item}</span>)}
              </div>
            </section>

            <section className="progress-wrap">
              <div className="progress-line">
                <div className="progress-bar" style={{ width: `${Math.round((analysis.logs.length / Math.max(1, analysis.totalSteps)) * 100)}%` }} />
              </div>
              <p className="tiny">{analysis.progressText}</p>
            </section>

            <section className="analysis-stream">
              {analysis.logs.map((log, index) => (
                <article className="stream-item" key={`${log.stage}-${index}-${log.time}`}>
                  <div className="stream-head">
                    <span>{log.stage}</span>
                    <span>{log.time}</span>
                  </div>
                  <p>{`发现了什么：${log.finding}\n证据来源：${log.source}\n为什么危险：${log.reason}\n风险等级变化：${log.levelAfter}`}</p>
                </article>
              ))}
            </section>

            {analysis.done ? (
              <section className="result-panel">
                <p>风险分：{analysis.score}/100</p>
                <p>风险等级：<span className={analysis.score >= 80 ? 'risk-high' : ''}>{analysis.level}</span></p>
                <p>AI 建议动作：{analysisContext ? analysisContext.aiAdvice : '-'}</p>
              </section>
            ) : null}

            <footer className="modal-actions">
              <Button variant="ghost" onClick={cancelAction}>取消操作</Button>
              <Button variant="danger" onClick={() => void confirmAction()} disabled={!analysis.done || signingAction}>
                {signingAction ? '签名中...' : analysisContext?.mode === 'contract' ? '签名合约操作' : '签名转账操作'}
              </Button>
            </footer>
          </div>
        </div>
      ) : null}

      {balanceModalToken ? (
        <div className="modal-overlay">
          <div className="modal-panel">
            <header className="modal-header">
              <h2>{balanceModalToken} 余额变动明细</h2>
              <button className="close-btn" onClick={() => setBalanceModalToken(null)}>×</button>
            </header>
            <ul className="list-grid">
              {tokenChanges.length === 0 ? (
                <li className="list-item">暂无记录</li>
              ) : tokenChanges.map((item, idx) => (
                <li className="list-item" key={`${item.time}-${idx}`}>
                  {item.time} | {item.action} | {formatDelta(item.delta, item.token)} | 来源：{getAddressSourceLabel(item.addressSource)} | 触发：{item.detail} | 变动后：{formatBalance(item.after, item.token)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function summarizeSignature(signature: string) {
  if (!signature) return '-'
  return `${signature.slice(0, 10)}...${signature.slice(-8)}`
}

function formatBalance(value: number, token: TokenKey) {
  return token === 'ETH' ? value.toFixed(4) : value.toFixed(2)
}

function formatDelta(delta: number, token: TokenKey) {
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${formatBalance(delta, token)} ${token}`
}

function shorten(addr: string) {
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

function getAddressSourceLabel(source: AddressSource) {
  if (source === 'token_core_real') return 'Token Core 真实地址'
  if (source === 'demo_fallback') return '兼容演示地址（非真实）'
  return '未获得真实地址'
}

function formatLossForNotice(ctx: ActionContext) {
  if (ctx.mode === 'transfer') {
    return `${formatBalance(ctx.amount, ctx.token)} ${ctx.token}`
  }
  return `${ctx.drainEth.toFixed(4)} ETH / ${ctx.drainUsdc.toFixed(2)} USDC`
}

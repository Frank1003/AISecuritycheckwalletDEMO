export interface AnalysisStep {
  delayMs: number
  stage: string
  source: string
  finding: string
  reason: string
  scoreDelta: number
  levelAfter: string
}

export type AddressSource = 'token_core_real' | 'demo_fallback' | 'unavailable'

export interface AddressRiskSample {
  address: string
  label: string
  riskType: string
  severity: 'high' | 'medium' | 'low'
  aiAdvice: string
  evidenceSources: string[]
  analysisScript: AnalysisStep[]
}

export interface MaliciousActionConfig {
  approvalText: string
  drain: {
    eth: number
    usdc: number
  }
}

export interface ContractRiskSample {
  contract: string
  name: string
  maliciousType: string
  severity: 'high' | 'medium' | 'low'
  aiAdvice: string
  codeHints: string[]
  evidenceSources: string[]
  maliciousAction: MaliciousActionConfig
  analysisScript: AnalysisStep[]
}

export interface InteractionAuditRecord {
  time: string
  kind: string
  target: string
  riskType: string
  approvalText: string
  drainEth: number
  drainUsdc: number
  signatureDigest: string
  addressSource: AddressSource
  status: '已执行' | '已取消'
}

export interface BalanceChange {
  token: 'ETH' | 'USDC'
  delta: number
  action: string
  detail: string
  after: number
  time: string
  addressSource: AddressSource
}

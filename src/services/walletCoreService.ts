import tcxInit, { create_keystore, derive_accounts, sign_message } from '@consenlabs/tcx-wasm'
import tcxWasmUrl from '@consenlabs/tcx-wasm/tcx_wasm_bg.wasm?url'

interface WalletInfo {
  walletId: string
  mnemonicMasked: string
  ethAddress: string
  addressSource: 'token_core_real' | 'demo_fallback' | 'unavailable'
}

interface WalletRecord {
  walletId: string
  keyPair: CryptoKeyPair
  mnemonicMasked: string
  ethAddress: string
  addressSource: 'token_core_real' | 'demo_fallback' | 'unavailable'
  password: string
  keystoreJson?: string
}

interface WalletCoreRuntime {
  mode: 'tcx-wasm' | 'fallback-webcrypto'
}

export interface WalletCoreService {
  init(): Promise<void>
  createWallet(password: string): Promise<WalletInfo>
  signMessage(walletId: string, password: string, message: string): Promise<string>
  getRuntime(): WalletCoreRuntime
}

const words = ['alpha', 'block', 'chain', 'token', 'secure', 'wallet', 'sign', 'crypto', 'seed', 'derive', 'bridge', 'guard']

class WalletCoreServiceImpl implements WalletCoreService {
  private runtime: WalletCoreRuntime = { mode: 'fallback-webcrypto' }

  private wallets = new Map<string, WalletRecord>()

  async init(): Promise<void> {
    try {
      await tcxInit(tcxWasmUrl)
      this.runtime = { mode: 'tcx-wasm' }
    } catch (error) {
      // tcx 初始化失败时回退本地模式，保证 demo 可运行
      console.error('Token Core wasm 初始化失败，将回退兼容模式：', error)
      this.runtime = { mode: 'fallback-webcrypto' }
    }
  }

  async createWallet(_password: string): Promise<WalletInfo> {
    const password = _password || '12345678'
    if (this.runtime.mode === 'tcx-wasm') {
      try {
        let walletId: string = crypto.randomUUID()
        let mnemonicMasked = '****** ****** ****** ******'

        const keystoreJson = create_keystore(JSON.stringify({ password, network: 'MAINNET' }))
        const rawAccounts = derive_accounts(
          JSON.stringify({
            keystoreJson,
            key: password,
            derivations: [
              {
                chain: 'ETHEREUM',
                derivationPath: "m/44'/60'/0'/0/0",
                chainId: '1',
                network: 'MAINNET'
              }
            ]
          })
        )
        const parsedAccounts = safeJsonParse(rawAccounts)
        const tokenCoreAddress = this.tryResolveTcxEthAddressFromAccounts(parsedAccounts)
        const ethAddress = tokenCoreAddress || await this.generateDemoEthAddress(walletId)
        const addressSource = tokenCoreAddress ? 'token_core_real' : 'demo_fallback'
        const keyPair = await this.generateKeyPair()
        mnemonicMasked = 'TokenCore ****** ****** Wallet'

        this.wallets.set(walletId, { walletId, keyPair, mnemonicMasked, ethAddress, addressSource, password, keystoreJson })
        return { walletId, mnemonicMasked, ethAddress, addressSource }
      } catch {
        // 失败回退到本地实现
      }
    }

    const walletId = crypto.randomUUID()
    const mnemonicMasked = this.makeMaskedMnemonic()
    const keyPair = await this.generateKeyPair()
    const demoAddress = await this.generateDemoEthAddress(walletId)
    this.wallets.set(walletId, { walletId, keyPair, mnemonicMasked, ethAddress: demoAddress, addressSource: 'demo_fallback', password })
    return { walletId, mnemonicMasked, ethAddress: demoAddress, addressSource: 'demo_fallback' }
  }

  async signMessage(walletId: string, _password: string, message: string): Promise<string> {
    if (!message.trim()) {
      throw new Error('待签名内容不能为空')
    }
    const password = _password || ''
    const wallet = this.wallets.get(walletId)
    if (!wallet) {
      throw new Error('钱包不存在，请先创建钱包')
    }
    if (wallet.password !== password) {
      throw new Error('钱包密码错误，请重新输入')
    }

    if (this.runtime.mode === 'tcx-wasm') {
      try {
        if (wallet?.keystoreJson) {
          const raw = sign_message(
            JSON.stringify({
              keystoreJson: wallet.keystoreJson,
              key: password,
              chain: 'ETHEREUM',
              derivationPath: "m/44'/60'/0'/0/0",
              input: {
                message,
                signatureType: 'PersonalSign'
              }
            })
          )
          const parsed = safeJsonParse(raw)
          const signature = String(parsed?.signature || '')
          if (signature) {
            return signature
          }
        }
      } catch {
        // 忽略并回退本地签名
      }
    }

    const data = new TextEncoder().encode(message)
    const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, wallet.keyPair.privateKey, data)
    return bytesToHex(new Uint8Array(signature))
  }

  getRuntime(): WalletCoreRuntime {
    return this.runtime
  }

  private makeMaskedMnemonic(): string {
    const picked = Array.from({ length: 12 }, () => words[Math.floor(Math.random() * words.length)])
    return `${picked.slice(0, 2).join(' ')} ****** ****** ${picked.slice(10, 12).join(' ')}`
  }

  private async generateKeyPair() {
    return crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    )
  }

  private tryResolveTcxEthAddressFromAccounts(result: unknown): string {
    if (Array.isArray(result)) {
      for (const item of result) {
        const address = this.normalizeEthAddress((item as any)?.address)
        if (address) return address
      }
    }
    if (result && typeof result === 'object') {
      const maybeArray = (result as any)?.accounts
      if (Array.isArray(maybeArray)) {
        for (const item of maybeArray) {
          const address = this.normalizeEthAddress((item as any)?.address)
          if (address) return address
        }
      }
      const direct = this.normalizeEthAddress((result as any)?.address)
      if (direct) return direct
    }
    return ''
  }

  private async generateDemoEthAddress(seed: string): Promise<string> {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`demo:${seed}`))
    const hex = [...new Uint8Array(buffer)].map((n) => n.toString(16).padStart(2, '0')).join('')
    return `0x${hex.slice(0, 40)}`
  }

  private normalizeEthAddress(input: unknown): string {
    if (typeof input !== 'string') return ''
    const value = input.trim()
    if (/^0x[a-fA-F0-9]{40}$/.test(value)) {
      return value
    }
    return ''
  }
}

function safeJsonParse(input: unknown): any {
  if (typeof input !== 'string') return input
  try {
    return JSON.parse(input)
  } catch {
    return input
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((n) => n.toString(16).padStart(2, '0')).join('')
}

export const walletCoreService: WalletCoreService = new WalletCoreServiceImpl()

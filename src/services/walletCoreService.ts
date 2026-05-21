interface WalletInfo {
  walletId: string
  mnemonicMasked: string
}

interface WalletRecord {
  walletId: string
  keyPair: CryptoKeyPair
  mnemonicMasked: string
}

interface WalletCoreRuntime {
  mode: 'tcx-wasm' | 'fallback-webcrypto'
}

export interface WalletCoreService {
  init(): Promise<void>
  createWallet(password: string): Promise<WalletInfo>
  deriveAddress(walletId: string, chain: 'ETH'): Promise<string>
  signMessage(walletId: string, password: string, message: string): Promise<string>
  getRuntime(): WalletCoreRuntime
}

const words = ['alpha', 'block', 'chain', 'token', 'secure', 'wallet', 'sign', 'crypto', 'seed', 'derive', 'bridge', 'guard']

class WalletCoreServiceImpl implements WalletCoreService {
  private runtime: WalletCoreRuntime = { mode: 'fallback-webcrypto' }

  private tcxModule: any | null = null

  private wallets = new Map<string, WalletRecord>()

  async init(): Promise<void> {
    const candidates = ['tcx-wasm', '@consenlabs/tcx-wasm', '@imtoken/tcx-wasm']

    for (const pkg of candidates) {
      try {
        const mod = await import(/* @vite-ignore */ pkg)
        this.tcxModule = mod
        this.runtime = { mode: 'tcx-wasm' }
        if (typeof mod.init === 'function') {
          await mod.init()
        }
        return
      } catch {
        // 忽略并尝试下一个候选包
      }
    }

    // 无 tcx-wasm 时使用浏览器密码学兜底，保证 demo 可运行
    this.runtime = { mode: 'fallback-webcrypto' }
  }

  async createWallet(_password: string): Promise<WalletInfo> {
    if (this.runtime.mode === 'tcx-wasm' && this.tcxModule) {
      try {
        if (typeof this.tcxModule.createWallet === 'function') {
          const result = await this.tcxModule.createWallet()
          return {
            walletId: String(result?.walletId || result?.id || crypto.randomUUID()),
            mnemonicMasked: String(result?.mnemonicMasked || '****** ****** ****** ******')
          }
        }
      } catch {
        // 失败回退到本地实现
      }
    }

    const walletId = crypto.randomUUID()
    const mnemonicMasked = this.makeMaskedMnemonic()
    const keyPair = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    )

    this.wallets.set(walletId, { walletId, keyPair, mnemonicMasked })
    return { walletId, mnemonicMasked }
  }

  async deriveAddress(walletId: string, chain: 'ETH'): Promise<string> {
    if (chain !== 'ETH') {
      throw new Error('当前仅支持 ETH')
    }

    if (this.runtime.mode === 'tcx-wasm' && this.tcxModule) {
      try {
        if (typeof this.tcxModule.deriveAddress === 'function') {
          const result = await this.tcxModule.deriveAddress(walletId, 'ETH')
          return String(result?.address || result)
        }
      } catch {
        // 失败回退本地推导
      }
    }

    const wallet = this.wallets.get(walletId)
    if (!wallet) {
      throw new Error('钱包不存在，请先创建钱包')
    }

    const jwk = await crypto.subtle.exportKey('jwk', wallet.keyPair.publicKey)
    const seed = `${jwk.x || ''}${jwk.y || ''}`
    const hashed = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seed))
    const hex = [...new Uint8Array(hashed)].map((n) => n.toString(16).padStart(2, '0')).join('')
    return `0x${hex.slice(0, 40)}`
  }

  async signMessage(walletId: string, _password: string, message: string): Promise<string> {
    if (!message.trim()) {
      throw new Error('待签名内容不能为空')
    }

    if (this.runtime.mode === 'tcx-wasm' && this.tcxModule) {
      try {
        if (typeof this.tcxModule.signMessage === 'function') {
          const result = await this.tcxModule.signMessage(walletId, message)
          return String(result?.signature || result)
        }
      } catch {
        // 失败回退本地签名
      }
    }

    const wallet = this.wallets.get(walletId)
    if (!wallet) {
      throw new Error('钱包不存在，请先创建钱包')
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
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((n) => n.toString(16).padStart(2, '0')).join('')
}

export const walletCoreService: WalletCoreService = new WalletCoreServiceImpl()

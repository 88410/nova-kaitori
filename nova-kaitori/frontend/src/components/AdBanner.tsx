import { useEffect } from 'react'

interface AdBannerProps {
  slot: string
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical'
  responsive?: boolean
}

export default function AdBanner({ slot, format = 'auto', responsive = true }: AdBannerProps) {
  useEffect(() => {
    // Google AdSense などの広告スクリプトをロード
    if (window.adsbygoogle) {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    }
  }, [])

  // 広告が無効の場合は何も表示しない
  if (!window.NOVA_AD_CONFIG?.enabled) {
    return (
      <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
        <p>Advertisement Space</p>
        <p className="text-sm">{slot}</p>
      </div>
    )
  }

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={window.NOVA_AD_CONFIG.clientId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive}
    />
  )
}

// グローバル型定義
declare global {
  interface Window {
    adsbygoogle: any[]
    NOVA_AD_CONFIG: {
      enabled: boolean
      provider: string
      clientId?: string
    }
  }
}

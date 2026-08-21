export interface AITestCase {
  id: number
  category: string
  question: string
  answer: string
}

type Language = 'en' | 'zh' | 'ja'
type Localized = Record<Language, string>

interface Topic {
  label: Localized
  focus: Localized
}

const localized = (en: string, zh: string, ja: string): Localized => ({ en, zh, ja })
const topic = (
  labelEn: string,
  labelZh: string,
  labelJa: string,
  focusEn: string,
  focusZh: string,
  focusJa: string,
): Topic => ({
  label: localized(labelEn, labelZh, labelJa),
  focus: localized(focusEn, focusZh, focusJa),
})

const MODEL_NAMES = [
  'iPhone 17 Pro Max',
  'iPhone 17 Pro',
  'iPhone Air',
  'iPhone 17',
  'iPhone 16e',
  'iPhone 16 Pro Max',
  'iPhone 16 Pro',
  'iPhone 16 Plus',
  'iPhone 16',
  'iPhone 15 Pro Max',
  'iPhone 15 Pro',
  'iPhone 15 Plus',
  'iPhone 15',
  'iPhone 14 Pro Max',
  'iPhone 14 Pro',
  'iPhone 14 Plus',
  'iPhone 14',
  'iPhone 13 Pro Max',
  'iPhone 13 Pro',
  'iPhone 13 mini',
  'iPhone 13',
  'iPhone SE（第3世代）',
  'iPhone 12 Pro Max',
  'iPhone 12 Pro',
  'iPhone 12 mini',
  'iPhone 12',
  'iPhone 11 Pro Max',
  'iPhone 11 Pro',
  'iPhone 11',
  'iPhone SE（第2世代）',
]

const REGIONS = [
  localized('Japan', '日本', '日本'),
  localized('United States', '美国', '米国'),
  localized('Mainland China', '中国大陆', '中国本土'),
  localized('Hong Kong and Macau', '香港及澳门', '香港・マカオ'),
  localized('South Korea', '韩国', '韓国'),
  localized('Taiwan', '中国台湾', '台湾'),
  localized('Singapore', '新加坡', 'シンガポール'),
  localized('Australia', '澳大利亚', 'オーストラリア'),
  localized('Canada', '加拿大', 'カナダ'),
  localized('United Kingdom', '英国', '英国'),
  localized('European Union', '欧盟地区', 'EU地域'),
  localized('United Arab Emirates', '阿联酋', 'アラブ首長国連邦'),
]

const TRADE_TOPICS: Topic[] = [
  topic('wholesale quote validity', '批发报价有效期', '卸売見積の有効期限', 'record the issue time, expiry time and quantity covered by the quote', '记录报价时间、失效时间和对应数量', '提示時刻・失効時刻・対象数量を記録する'),
  topic('minimum order quantity', '最低起订量', '最低取引数量', 'confirm whether the minimum applies by model, capacity or the whole shipment', '确认最低数量按机型、容量还是整批计算', '機種別・容量別・出荷全体のどれに適用されるか確認する'),
  topic('volume price tiers', '数量阶梯价', '数量別の価格帯', 'compare every quantity tier and avoid applying a large-lot quote to a small lot', '逐档比较数量价格，不能把大批量报价套到小批量', '数量帯ごとに比較し、大口価格を小口へ流用しない'),
  topic('seller identity and invoice', '交易方资质与发票', '取引先情報と請求書', 'verify the legal entity, invoice issuer, tax information and receiving account', '核对公司主体、开票方、税务信息和收款账户', '法人名義・請求書発行者・税務情報・受取口座を照合する'),
  topic('payment terms', '付款条件', '支払条件', 'write down deposit, balance, due dates and the condition for releasing goods', '写清定金、尾款、付款期限和放货条件', '前金・残金・期限・出荷条件を書面化する'),
  topic('settlement currency', '结算币种', '決済通貨', 'separate the product price from bank fees and currency conversion costs', '把货款、银行手续费和换汇成本分开计算', '商品代金・銀行手数料・為替コストを分けて計算する'),
  topic('foreign-exchange lock', '汇率锁定', '為替レートの固定', 'define the reference rate, timestamp and who bears movement before settlement', '约定参考汇率、时间点和结算前的汇率风险承担方', '基準レート・時刻・決済前の変動負担者を決める'),
  topic('Japanese consumption tax', '日本消费税', '日本の消費税', 'confirm whether every quote is tax-inclusive and how purchase records are retained', '确认报价是否含税，并保存合规的采购记录', '税込・税抜を確認し、適切な仕入記録を保存する'),
  topic('export tax treatment', '出口税务处理', '輸出時の税務処理', 'check eligibility and evidence with a qualified tax professional before pricing any refund', '把退税资格和证明交给专业税务人员确认后再计入利润', '還付の可否と証憑を専門家へ確認してから利益へ反映する'),
  topic('customs declaration value', '海关申报价', '税関申告価格', 'use truthful transaction documents and keep the invoice, packing list and payment proof consistent', '如实申报，并确保发票、装箱单和付款凭证一致', '実際の取引に基づき、請求書・梱包明細・支払証憑を一致させる'),
  topic('import duties and local taxes', '进口关税与当地税费', '輸入関税と現地税', 'calculate duties and taxes for the destination before judging the margin', '先计算目的地关税和税费，再判断利润', '仕向地の関税・税金を先に計算して採算を判断する'),
  topic('international shipping', '国际运输方案', '国際配送方法', 'compare delivery time, tracking, battery restrictions and customs handling', '比较时效、追踪能力、锂电池限制和清关方式', '納期・追跡・リチウム電池制限・通関方法を比較する'),
  topic('cargo insurance', '货运保险', '運送保険', 'check the insured value, exclusions, deductible and evidence required for a claim', '核对保额、免责、免赔额和理赔所需证明', '保険金額・免責・自己負担・請求証拠を確認する'),
  topic('loss and transit damage', '丢件与运输损坏', '紛失・輸送破損', 'assign responsibility at each handoff and photograph the lot before dispatch', '明确每次交接责任，并在发货前拍照留证', '各引渡し時点の責任を決め、出荷前に写真を残す'),
  topic('inspection procedure', '验货流程', '検品手順', 'use the same checklist for model, capacity, color, IMEI, appearance and function', '用统一清单检查型号、容量、颜色、IMEI、外观和功能', '機種・容量・色・IMEI・外観・機能を同一手順で確認する'),
  topic('condition grades', '成色等级', '状態ランク', 'define every grade with photos and measurable defects instead of subjective wording', '用照片和可量化缺陷定义等级，避免只写主观描述', '写真と測定可能な欠点でランクを定義し、主観表現を避ける'),
  topic('battery-health thresholds', '电池健康门槛', 'バッテリー最大容量の基準', 'set deductions for each battery-health band and verify the reading at inspection', '按电池健康区间设定扣款，并在验货时复核', '最大容量の区分ごとに減額を定め、検品時に再確認する'),
  topic('parts and repair history', '部件与维修记录', '部品と修理履歴', 'check Parts and Service History and price unknown or non-genuine parts separately', '检查部件与维修历史，对未知或非原装部件单独定价', '部品と修理の履歴を確認し、不明部品や非純正部品を別査定する'),
  topic('Activation Lock', '激活锁', 'アクティベーションロック', 'require Find My to be disabled and confirm activation after erasure before payment', '付款前必须关闭“查找”，抹除后再确认能够激活', '支払前に「探す」を解除し、消去後にアクティベート可能か確認する'),
  topic('carrier and SIM lock', '运营商锁与SIM锁', 'キャリア・SIMロック', 'verify lock status against the destination carrier before purchase', '采购前确认锁定状态能否支持目的地运营商', '仕入前に仕向地キャリアで利用できる状態か確認する'),
  topic('network blacklist risk', '网络黑名单风险', 'ネットワーク利用制限', 'check IMEI status near both purchase and resale and retain a return clause', '在采购和转售前都查询IMEI状态，并保留退货条款', '仕入時と販売前にIMEI判定を確認し、返品条件を設ける'),
  topic('IMEI and serial verification', 'IMEI与序列号核验', 'IMEI・シリアル確認', 'match the device, settings screen, box and transaction list without exposing the data publicly', '核对设备、设置页面、包装盒和交易清单，且不要公开敏感编号', '端末・設定画面・箱・取引明細を照合し、番号は公開しない'),
  topic('JAN and model-code mapping', 'JAN与型号编号对应', 'JAN・モデル番号の対応', 'map seller names to a canonical product before comparing or storing prices', '先把卖家商品名对应到标准商品库，再比较和入库', '販売名を標準商品へ対応付けてから価格比較・保存を行う'),
  topic('country-model compatibility', '国家版本兼容性', '国・地域モデルの互換性', 'check model number, radio bands, SIM format, camera rules and warranty region', '核对型号编号、频段、SIM形式、相机限制和保修地区', 'モデル番号・周波数・SIM方式・カメラ仕様・保証地域を確認する'),
  topic('box and accessories', '包装与配件', '箱・付属品', 'price the device, box, cable and missing accessories as separate line items', '把手机、包装、线材和缺失配件分别计价', '端末・箱・ケーブル・欠品を分けて査定する'),
  topic('unopened seal condition', '未拆封状态', '未開封状態', 'define accepted seals and reject resealed or uncertain packaging from unopened pricing', '明确认可的封条，重新封装或无法确认的不能按未拆封价', '認める封印状態を定義し、再封や不明品を未開封価格から除外する'),
  topic('dead-on-arrival handling', '到货故障处理', '初期不良対応', 'set the testing window, evidence and refund or replacement process in advance', '事先约定测试期限、证明材料和退款或换货流程', '検査期限・証拠・返金または交換手順を事前に決める'),
  topic('return conditions', '退货条件', '返品条件', 'list eligible defects, deadlines, shipping responsibility and refund timing', '写清可退问题、期限、运费承担和退款时间', '対象不良・期限・送料負担・返金時期を明記する'),
  topic('warranty coverage', '保修范围', '保証範囲', 'confirm whether warranty follows the device internationally and what purchase proof is required', '确认保修是否跨地区有效以及需要什么购买凭证', '国をまたいで保証されるか、必要な購入証明を確認する'),
  topic('certified data erasure', '数据清除证明', 'データ消去証明', 'erase devices with a repeatable process and retain only the minimum audit record', '用可复核流程清除数据，只保留最少的审计记录', '再現可能な手順で消去し、必要最小限の監査記録だけ残す'),
  topic('stolen-device screening', '盗抢设备筛查', '盗難端末の確認', 'verify source documents and stop the trade when ownership cannot be reasonably established', '核查来源证明，无法合理确认所有权时停止交易', '入手経路を確認し、所有権を合理的に確認できなければ取引を止める'),
  topic('capacity and color mix', '容量与颜色配比', '容量・色の構成', 'calculate margin and sell-through by variant instead of valuing a mixed lot at one average', '按具体版本计算利润和周转，不能整批只用一个均价', 'バリエーション別に利益と回転を計算し、一律平均で評価しない'),
  topic('inventory aging', '库存周期', '在庫日数', 'track days in stock and lower the target price before an aging lot becomes illiquid', '跟踪库存天数，在滞销前调整目标价', '在庫日数を追い、動かなくなる前に目標価格を調整する'),
  topic('launch-season timing', '新品发布周期', '新製品発売時期', 'model price pressure around announcements, preorders and first delivery dates', '围绕发布、预售和首批交付时间评估价格压力', '発表・予約・初回発売日の前後で価格下落圧力を見積もる'),
  topic('sudden price-drop risk', '突然跌价风险', '急落リスク', 'limit quote duration and position size when stores are changing prices quickly', '店铺快速调价时缩短报价有效期并控制库存量', '店舗価格が速く動く時は見積期限を短くし、在庫量を抑える'),
  topic('net profit calculation', '净利润计算', '純利益計算', 'subtract tax, FX, payment, logistics, inspection, returns and capital cost from revenue', '从收入中扣除税费、汇率、支付、物流、验货、退货和资金成本', '売上から税・為替・決済・物流・検品・返品・資金コストを差し引く'),
]

const DATA_TOPICS: Topic[] = [
  topic('highest valid price', '有效最高价', '有効な最高価格', 'use only matching products and sources updated within the validity window', '只使用相同商品且在有效时间内更新的数据', '同一商品で有効時間内に更新されたデータだけを使う'),
  topic('effective average price', '有效平均价', '有効平均価格', 'remove invalid, stale and obvious mismatches before averaging accepted store prices', '剔除无效、过期和明显错配后，再平均有效店铺价格', '無効・期限切れ・明らかな誤対応を除いて平均する'),
  topic('median price', '中位价', '中央値', 'sort valid quotes and use the middle value to reduce outlier influence', '将有效报价排序后取中间值，降低异常值影响', '有効価格を並べ、中央の値で外れ値の影響を抑える'),
  topic('outlier detection', '异常价识别', '外れ値判定', 'compare against peer stores, recent history and product identity before exclusion', '结合其他店铺、近期历史和商品对应关系判断，不能只因价格不同就删除', '他店・直近履歴・商品対応を照合し、価格差だけで削除しない'),
  topic('24-hour validity', '24小时有效期', '24時間の有効期限', 'exclude older quotes from AI answers and current calculations while retaining them as history', '超过24小时不参与当前AI和计算，但可保留为历史', '24時間超は現在のAI・計算から除外し、履歴として保持する'),
  topic('stale prices', '过期价格', '古い価格', 'show the update time and never present stale data as a current offer', '显示更新时间，不能把过期数据当成当前报价', '更新時刻を表示し、期限切れを現在価格として見せない'),
  topic('NA and blank values', 'NA与空值', 'NA・空欄', 'reject non-numeric prices before storage and calculation', '非数字价格在入库和计算前直接判为无效', '数値でない価格は保存・計算前に無効とする'),
  topic('official and sheet sources', '官网价与表格价', '公式価格と表価格', 'store both sources with separate timestamps and show them side by side', '分别保存来源和时间，并在后台并排显示', '出典と時刻を分けて保存し、管理画面で並べて表示する'),
  topic('source update timestamp', '来源更新时间', '情報源の更新時刻', 'retain collection time and source update time when both are available', '同时保留采集时间和来源自身更新时间', '取得時刻と情報源の更新時刻を両方保持する'),
  topic('unchanged daily prices', '连续相同价格', '連日同じ価格', 'treat an unchanged but freshly confirmed numeric quote as valid', '价格没变化不代表无效，只要当天重新确认就可使用', '価格が同じでも当日再確認した数値なら有効とする'),
  topic('duplicate records', '重复记录', '重複レコード', 'deduplicate by store, canonical product, condition, source and observation time', '按店铺、标准商品、状态、来源和采集时间去重', '店舗・標準商品・状態・出典・観測時刻で重複を除く'),
  topic('same store and product', '同店同商品记录', '同一店舗・同一商品', 'select the newest valid observation per source for current display', '当前展示按来源选择最新一条有效记录', '現在表示では出典ごとの最新有効値を選ぶ'),
  topic('capacity normalization', '容量标准化', '容量の標準化', 'map spelling variants to one capacity without guessing missing capacity', '统一容量写法，但缺少容量时不能猜测', '表記揺れを統一し、容量不明を推測で補わない'),
  topic('color normalization', '颜色标准化', '色の標準化', 'map store color names to canonical multilingual variants', '把店铺颜色名对应到本地三语言标准颜色', '店舗の色名を多言語の標準カラーへ対応付ける'),
  topic('default color pricing', '无颜色明细的默认价', '色別価格がない場合', 'apply one store price to all colors only when the source clearly has no color split', '只有来源明确不分颜色时，才把同一价格作为全部颜色默认价', '情報源が色別でない場合だけ全色共通価格として扱う'),
  topic('regional model mapping', '地区型号对应', '地域モデルの対応', 'keep distinct model numbers separate even when the marketing name is identical', '营销名称相同也要按不同地区型号编号区分', '販売名が同じでも地域別モデル番号は分けて管理する'),
  topic('product-name aliases', '商品别名', '商品名の表記揺れ', 'normalize punctuation, spacing and common abbreviations before matching', '先统一标点、空格和常见缩写，再进行商品对应', '記号・空白・略称を正規化してから照合する'),
  topic('products without JAN', '没有JAN的商品', 'JANがない商品', 'match with model, capacity, color, region and source evidence and record confidence', '综合型号、容量、颜色、地区和来源证据对应，并记录可信度', '機種・容量・色・地域・出典証拠で対応し、信頼度を残す'),
  topic('condition normalization', '状态等级统一', '状態区分の統一', 'translate each store grade into a canonical condition without erasing the original label', '把各店等级映射到统一状态，同时保留原始名称', '各店ランクを標準状態へ対応し、元の名称も保持する'),
  topic('unopened and activated devices', '未拆封与已激活', '未開封と開通済み', 'keep unopened, opened-unused and activated inventory as separate conditions', '把未拆封、开封未用和已激活分别定价', '未開封・開封未使用・開通済みを別状態で扱う'),
  topic('battery-health deductions', '电池健康扣价', 'バッテリー劣化の減額', 'compare quotes only after applying the same battery-health assumption', '统一电池健康条件后再比较店铺报价', '同じ最大容量条件へ揃えてから比較する'),
  topic('repair-history deductions', '维修记录扣价', '修理歴の減額', 'separate official repairs, genuine used parts and unknown parts', '区分官方维修、原装拆机件和未知部件', '正規修理・純正中古部品・不明部品を分ける'),
  topic('appearance damage', '外观损伤', '外観キズ', 'use consistent deductions for screen, frame, back glass and camera damage', '分别定义屏幕、边框、背板和摄像头损伤扣价', '画面・フレーム・背面・カメラの減額を統一する'),
  topic('missing accessories', '缺失配件', '付属品不足', 'show accessory deductions separately from the device value', '配件扣款与手机本体价值分开显示', '付属品の減額を端末本体価格と分けて表示する'),
  topic('sample size', '样本数量', 'サンプル数', 'show how many valid stores support an average or range', '平均价和区间必须同时显示有效店铺数量', '平均・範囲とともに有効店舗数を表示する'),
  topic('store coverage', '店铺覆盖率', '店舗カバー率', 'distinguish unavailable data from a store that truly does not buy the model', '区分采集不到与店铺确实不收该型号', '取得不能と実際の買取対象外を区別する'),
  topic('price confidence', '价格可信度', '価格の信頼度', 'base confidence on freshness, source agreement, sample size and mapping certainty', '根据新鲜度、来源一致性、样本量和商品对应可信度计算', '鮮度・価格一致度・件数・商品対応確度から評価する'),
  topic('K-line OHLC values', 'K线开高低收', 'KラインのOHLC', 'derive open, high, low and close from valid observations in one time bucket', '仅用同一时间区间内的有效记录计算开高低收', '同一時間枠の有効観測値だけで始値・高値・安値・終値を作る'),
  topic('average-price K-line', '平均价K线', '平均価格ライン', 'calculate each point from accepted store prices and publish its sample size', '每个点使用有效店铺价格平均，并显示样本数', '各点を有効店舗価格の平均で作り、件数も示す'),
  topic('time zones', '时间与时区', '時刻とタイムゾーン', 'store timestamps consistently and display them in the user or market time zone', '统一保存时间，并按用户或市场时区显示', '時刻を統一保存し、利用者または市場のタイムゾーンで表示する'),
  topic('tax-inclusive comparison', '含税与未税比较', '税込・税抜の比較', 'convert every price to the same tax basis before ranking', '排名前先把全部价格统一为同一税务口径', '順位付け前に税込・税抜の条件を統一する'),
  topic('currency conversion', '汇率换算', '為替換算', 'show the currency source and timestamp and retain the original local-currency price', '显示汇率来源和时间，并保留原币价格', '為替の出典・時刻と現地通貨価格を残す'),
  topic('multi-device totals', '多台总价', '複数台の合計', 'multiply each exact variant by its valid price before summing the lot', '每个具体版本先按有效单价乘数量，再计算总价', '各バリエーションを有効単価と台数で計算してから合計する'),
  topic('selling-route totals', '卖出路线总价', '売却ルートの合計', 'include store splitting, travel, shipping, fees and acceptance limits', '把分店出售、交通、运费、手续费和店铺收购上限都算进去', '店舗分割・交通・送料・手数料・受付上限を含める'),
  topic('private sale and store buyback', '个人交易与店铺回收', '個人売買と店舗買取', 'compare net proceeds, time, fraud risk, returns and payment certainty', '比较到手价、时间、欺诈风险、退货和收款确定性', '手取り・時間・不正リスク・返品・入金確実性を比較する'),
  topic('future price movement', '后续价格走势', '今後の価格変動', 'present scenarios based on history and launch timing instead of claiming a guaranteed forecast', '根据历史和新品周期给出情景，不能把预测说成确定结果', '履歴と発売時期からシナリオを示し、確実な予測とは言わない'),
]

function modelCase(language: Language, model: string, variant: number, id: number): AITestCase {
  const category = localized('Model prices', '机型价格', '機種別価格')[language]

  if (variant === 0) {
    const question = localized(
      'For ' + model + ', what are the latest valid highest price, average and store range for each capacity?',
      model + ' 各容量目前的有效最高价、平均价和店铺报价区间是多少？',
      model + ' の容量別に、現在有効な最高価格・平均価格・店舗価格帯を教えてください。',
    )[language]
    const answer = localized(
      'Match the exact capacity first, then use only numeric store prices refreshed within 24 hours. Report the top store, accepted average, range, sample size and update time; do not reuse a price from another capacity.',
      '先准确对应容量，只使用最近24小时更新的数字报价。回答应列出最高店铺、有效平均价、区间、样本数和更新时间，不能把其他容量的价格混进来。',
      '容量を正確に対応させ、24時間以内に更新された数値価格だけを使います。最高店舗・有効平均・価格帯・件数・更新時刻を示し、別容量の価格は混ぜません。',
    )[language]
    return { id, category, question, answer }
  }

  const question = localized(
    'How do color, regional model, condition, battery health and repair history change the buyback value of ' + model + '?',
    '颜色、地区型号、成色、电池健康和维修记录会怎样影响 ' + model + ' 的回收价？',
    '色・地域モデル・状態・バッテリー最大容量・修理歴は ' + model + ' の買取価格にどう影響しますか。',
  )[language]
  const answer = localized(
    'Price the canonical model and each variant separately. Keep store-specific color premiums, regional model compatibility, condition grade, battery deductions and parts history visible instead of collapsing everything into one number.',
    '应按本地标准商品库逐项对应，分别保留颜色溢价、地区型号兼容性、成色、电池扣价和部件记录，不能全部压成一个价格。',
    '標準商品と各バリエーションを分け、色差・地域モデル互換性・状態・バッテリー減額・部品履歴を残します。すべてを一つの価格へまとめません。',
  )[language]
  return { id, category, question, answer }
}

function regionCase(language: Language, region: Localized, variant: number, id: number, index: number): AITestCase {
  const category = localized('International prices', '各国型号与价格', '各国モデル・価格')[language]
  const regionName = region[language]
  const models = ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone 16 Pro Max', 'iPhone 15 Pro Max']
  const model = models[(index + variant) % models.length]

  const questions = [
    localized(
      'What is the current official retail price of ' + model + ' in ' + regionName + ', and what is it in yen on the same tax basis?',
      regionName + '版 ' + model + ' 当前官方售价是多少？统一税务口径后折合多少日元？',
      regionName + '版 ' + model + ' の現在の公式価格と、税条件を揃えた円換算額はいくらですか。',
    ),
    localized(
      'Which model numbers, SIM or eSIM rules, radio bands and warranty conditions apply to the ' + regionName + ' version of ' + model + '?',
      regionName + '版 ' + model + ' 的型号编号、SIM/eSIM、网络频段和保修条件有什么区别？',
      regionName + '版 ' + model + ' のモデル番号、SIM・eSIM、周波数帯、保証条件はどう違いますか。',
    ),
    localized(
      'How should the ' + regionName + ' version of ' + model + ' be compared with the Japanese version for resale in Japan?',
      '把 ' + regionName + '版 ' + model + ' 卖到日本时，应该怎样和日本版比较回收价？',
      regionName + '版 ' + model + ' を日本で売る場合、日本版との買取価格差をどう比較しますか。',
    ),
    localized(
      'How is the landed cost of a batch of ' + regionName + ' ' + model + ' units calculated before import?',
      '批量进口 ' + regionName + '版 ' + model + ' 前，落地成本应该怎样计算？',
      regionName + '版 ' + model + ' をまとめて輸入する前に、着地原価をどう計算しますか。',
    ),
  ]

  const answers = [
    localized(
      'Read the latest official price in local currency, note whether tax is included, and convert with a timestamped exchange rate. Keep both the original price and yen conversion; do not hard-code an old launch price.',
      '应读取最新官方当地货币售价，注明是否含税，再用带时间的汇率换算。原币价和日元换算价都要保留，不能长期写死首发价。',
      '現地通貨の最新公式価格と税込・税抜を確認し、時刻付き為替で円換算します。現地価格と円換算を両方残し、古い発売価格を固定表示しません。',
    ),
    localized(
      'Identify the exact regional model number before pricing. Then check SIM format, supported bands, camera or regulatory differences and whether service is available in the destination market.',
      '先确认准确的地区型号编号，再核对SIM形式、支持频段、相机或法规差异，以及目的地能否获得保修服务。',
      '地域モデル番号を先に特定し、SIM方式・対応周波数・カメラや法規上の差・仕向地での修理可否を確認します。',
    ),
    localized(
      'Compare the same capacity, color and condition. Apply any discount for regional compatibility, warranty or buyer demand, and use fresh Japanese store quotes rather than only currency conversion.',
      '必须比较相同容量、颜色和状态，再考虑地区兼容、保修和买家需求的扣价。不能只按汇率推算，要使用日本店铺的最新实际报价。',
      '同じ容量・色・状態で比較し、地域互換性・保証・需要による差を反映します。為替換算だけでなく、日本店舗の最新実売査定を使います。',
    ),
    localized(
      'Landed cost equals purchase price plus tax, FX spread, payment fees, shipping, insurance, customs, inspection, expected returns and financing cost. Margin should be tested against a conservative resale price.',
      '落地成本应包含采购价、税费、汇差、支付费、运输、保险、海关、验货、预计退货和资金成本，再用保守的转售价测算利润。',
      '着地原価は仕入・税・為替差・決済・送料・保険・通関・検品・返品見込・資金コストの合計です。保守的な販売価格で利益を確認します。',
    ),
  ]

  return { id, category, question: questions[variant][language], answer: answers[variant][language] }
}

function topicCase(language: Language, item: Topic, id: number, kind: 'trade' | 'data'): AITestCase {
  const isTrade = kind === 'trade'
  const category = isTrade
    ? localized('iPhone trade', 'iPhone贸易', 'iPhone取引')[language]
    : localized('Price data', '价格数据', '価格データ')[language]
  const question = isTrade
    ? localized(
        'How should ' + item.label.en + ' be checked in iPhone trading?',
        '做 iPhone 贸易时，' + item.label.zh + '应该怎么确认？',
        'iPhone取引で「' + item.label.ja + '」はどのように確認すべきですか。',
      )[language]
    : localized(
        'How should NOVA handle ' + item.label.en + ' in iPhone price analysis?',
        'NOVA 在分析 iPhone 价格时，应该怎样处理' + item.label.zh + '？',
        'NOVAのiPhone価格分析では「' + item.label.ja + '」をどう扱いますか。',
      )[language]

  const answer = isTrade
    ? localized(
        'First, ' + item.focus.en + '. Put the definition, evidence, deadline, cost responsibility and exception process in the transaction terms, then calculate profit from the net amount rather than the headline quote.',
        '首先要' + item.focus.zh + '。定义、证明、期限、费用承担和异常处理都应写进交易条件，最后按实际净额计算利润，不能只看表面报价。',
        'まず' + item.focus.ja + 'ことが必要です。定義・証拠・期限・費用負担・例外対応を取引条件へ明記し、表面価格ではなく手取りで利益を計算します。',
      )[language]
    : localized(
        'The rule is to ' + item.focus.en + '. NOVA should keep the raw source and timestamp, show the applied rule, and avoid presenting uncertain data as an exact current price.',
        '处理原则是' + item.focus.zh + '。NOVA还应保留原始来源和时间，显示所用规则，不能把不确定数据当成准确的当前价格。',
        '基本は' + item.focus.ja + 'ことです。元の出典と時刻、適用ルールを残し、不確かな値を正確な現在価格として表示しません。',
      )[language]

  return { id, category, question, answer }
}

export function buildExpandedTestCases(language: Language, baseCases: AITestCase[]): AITestCase[] {
  const cases = baseCases.map((item) => ({ ...item }))
  let id = cases.length + 1

  MODEL_NAMES.forEach((model) => {
    cases.push(modelCase(language, model, 0, id++))
    cases.push(modelCase(language, model, 1, id++))
  })

  REGIONS.forEach((region, index) => {
    for (let variant = 0; variant < 4; variant += 1) {
      cases.push(regionCase(language, region, variant, id++, index))
    }
  })

  TRADE_TOPICS.forEach((item) => cases.push(topicCase(language, item, id++, 'trade')))
  DATA_TOPICS.forEach((item) => cases.push(topicCase(language, item, id++, 'data')))

  if (cases.length !== 200) {
    throw new Error('AI test catalog must contain exactly 200 cases per language')
  }

  return cases
}

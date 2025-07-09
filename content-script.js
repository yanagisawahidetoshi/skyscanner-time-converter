// Skyscanner Time Converter Content Script
(function() {
  'use strict';

  // 時間変換の設定
  const CONFIG = {
    targetTimezone: 'Asia/Tokyo',
    enabled: true,
    debug: true
  };

  // ログ出力用関数
  function log(message, data) {
    if (CONFIG.debug) {
      console.log(`[Skyscanner Time Converter] ${message}`, data || '');
    }
  }

  // 時間文字列をパースする関数
  function parseTimeString(timeString) {
    // 様々な時間形式に対応
    const patterns = [
      /(\d{1,2}):(\d{2})\s*(AM|PM)?/i,
      /(\d{1,2})時(\d{2})分/,
      /(\d{1,2}):(\d{2})/
    ];

    for (const pattern of patterns) {
      const match = timeString.match(pattern);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const ampm = match[3];

        if (ampm) {
          if (ampm.toUpperCase() === 'PM' && hours !== 12) {
            hours += 12;
          } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
          }
        }

        return { hours, minutes };
      }
    }
    return null;
  }

  // 空港コードを抽出する関数
  function extractAirportCode(element) {
    const text = element.textContent || element.innerText;
    // 3文字の空港コードを抽出
    const codeMatch = text.match(/\b[A-Z]{3}\b/);
    return codeMatch ? codeMatch[0] : null;
  }

  // 時間を日本時間に変換する関数（シンプルな時差計算版）
  function convertToJapanTime(timeString, airportCode) {
    // 主要空港の日本時間に対する時差（分単位）
    // 正の値：日本より進んでいる、負の値：日本より遅れている
    const TIMEZONE_OFFSETS = {
      // 日本（時差なし）
      'NRT': 0, 'HND': 0, 'KIX': 0, 'NGO': 0, 'FUK': 0, 'OKA': 0, 'CTS': 0, 'ITM': 0,
      'SDJ': 0, 'KOJ': 0, 'KMI': 0, 'KKJ': 0, 'HIJ': 0, 'OIT': 0, 'KMJ': 0, 'TAK': 0,
      
      // 韓国（時差なし）
      'ICN': 0, 'GMP': 0, 'PUS': 0, 'CJU': 0, 'TAE': 0, 'KWJ': 0, 'RSU': 0, 'USN': 0,
      
      // 中国（日本より1時間遅れ）
      'PEK': -60, 'PVG': -60, 'SHA': -60, 'CAN': -60, 'SZX': -60, 'CTU': -60, 'CKG': -60,
      'XIY': -60, 'KMG': -60, 'HGH': -60, 'NKG': -60, 'TAO': -60, 'DLC': -60, 'WUH': -60,
      'XMN': -60, 'FOC': -60, 'CSX': -60, 'KWE': -60, 'SYX': -60, 'HAK': -60, 'NNG': -60,
      'CGO': -60, 'HRB': -60, 'TYN': -60, 'URC': -60, 'TSN': -60, 'SHE': -60, 'SJW': -60,
      
      // 香港・マカオ（日本より1時間遅れ）
      'HKG': -60, 'MFM': -60,
      
      // 台湾（日本より1時間遅れ）
      'TPE': -60, 'TSA': -60, 'KHH': -60, 'RMQ': -60, 'TNN': -60,
      
      // フィリピン（日本より1時間遅れ）
      'MNL': -60, 'CEB': -60, 'DVO': -60, 'CRK': -60, 'ILO': -60, 'BCD': -60, 'TAG': -60,
      'KLO': -60, 'PPS': -60, 'ZAM': -60, 'CDO': -60, 'GES': -60, 'LGP': -60, 'DGT': -60,
      'MPH': -60, 'CYZ': -60, 'USU': -60, 'BAG': -60, 'LAO': -60, 'CBO': -60, 'BXU': -60,
      
      // タイ（日本より2時間遅れ）
      'BKK': -120, 'DMK': -120, 'HKT': -120, 'CNX': -120, 'HDY': -120, 'KBV': -120, 'USM': -120,
      'URT': -120, 'CEI': -120, 'HHQ': -120, 'KKC': -120, 'NAW': -120, 'NST': -120, 'TST': -120,
      'UTH': -120, 'PHS': -120, 'SNO': -120, 'THS': -120, 'UBP': -120, 'UNN': -120,
      
      // ベトナム（日本より2時間遅れ）
      'SGN': -120, 'HAN': -120, 'DAD': -120, 'CXR': -120, 'DLI': -120, 'HPH': -120, 'HUI': -120,
      'PQC': -120, 'PXU': -120, 'UIH': -120, 'VCA': -120, 'VCL': -120, 'VCS': -120, 'VII': -120,
      'VKG': -120, 'BMV': -120, 'CAH': -120, 'DIN': -120, 'THD': -120, 'TBB': -120,
      
      // シンガポール（日本より1時間遅れ）
      'SIN': -60, 'XSP': -60, 'QPG': -60, 'JHB': -60,
      
      // マレーシア（日本より1時間遅れ）
      'KUL': -60, 'PEN': -60, 'LGK': -60, 'AOR': -60, 'BKI': -60, 'BTU': -60, 'KCH': -60,
      'KUA': -60, 'LBU': -60, 'LDU': -60, 'MKZ': -60, 'MYY': -60, 'SBW': -60, 'SDK': -60,
      'TGG': -60, 'TWU': -60, 'IPH': -60, 'JHB': -60, 'KBR': -60, 'KTE': -60, 'KTG': -60,
      
      // インドネシア（地域により異なる）
      'CGK': -120, // ジャカルタ（日本より2時間遅れ）
      'SUB': -120, // スラバヤ（日本より2時間遅れ）
      'DPS': -60,  // バリ（日本より1時間遅れ）
      'UPG': -60,  // マカッサル（日本より1時間遅れ）
      'MDC': -60,  // マナド（日本より1時間遅れ）
      'BPN': -60,  // バリクパパン（日本より1時間遅れ）
      'PLM': -120, // パレンバン
      'PDG': -120, // パダン
      'PKU': -120, // プカンバル
      'BTH': -120, // バタム
      'PNK': -120, // ポンティアナック
      'BDO': -120, // バンドゥン
      'SRG': -120, // スマラン
      'SOC': -120, // ソロ
      'JOG': -120, // ジョグジャカルタ
      'MLG': -120, // マラン
      'AMQ': -60,  // アンボン
      'TTE': -60,  // テルナテ
      'GTO': -60,  // ゴロンタロ
      'LOP': -60,  // プラヤ（ロンボク）
      'WGP': -60,  // ワインガプ
      'KDI': -60,  // ケンダリ
      'PLW': -60,  // パル
      'SOQ': 0,    // ソロン（日本と同じ）
      'DJJ': 0,    // ジャヤプラ（日本と同じ）
      'TIM': 0,    // ティミカ（日本と同じ）
      'BIK': 0,    // ビアク（日本と同じ）
      'MKW': 0,    // マノクワリ（日本と同じ）
      
      // 東ティモール（日本と同じ時間）
      'DIL': 0,    // ディリ（UTC+9）
      
      // ブルネイ（日本より1時間遅れ）
      'BWN': -60,
      
      // ミャンマー（日本より2時間30分遅れ）
      'RGN': -150, 'MDL': -150, 'NYU': -150, 'HEH': -150,
      
      // ラオス（日本より2時間遅れ）
      'VTE': -120, 'LPQ': -120, 'PKZ': -120,
      
      // カンボジア（日本より2時間遅れ）
      'PNH': -120, 'REP': -120, 'KOS': -120,
      
      // インド（日本より3時間30分遅れ）
      'DEL': -210, 'BOM': -210, 'BLR': -210, 'MAA': -210, 'CCU': -210, 'HYD': -210,
      'COK': -210, 'GOI': -210, 'AMD': -210, 'ATQ': -210, 'BBI': -210, 'BHO': -210,
      'CJB': -210, 'GAU': -210, 'IDR': -210, 'IXC': -210, 'JAI': -210, 'LKO': -210,
      'NAG': -210, 'PAT': -210, 'PNQ': -210, 'SXR': -210, 'TRV': -210, 'TRZ': -210,
      'VNS': -210, 'VTZ': -210, 'AGR': -210, 'IXU': -210, 'RPR': -210,
      
      // スリランカ（日本より3時間30分遅れ）
      'CMB': -210, 'HRI': -210,
      
      // ネパール（日本より3時間15分遅れ）
      'KTM': -195, 'PKR': -195, 'BWA': -195, 'BIR': -195,
      
      // バングラデシュ（日本より3時間遅れ）
      'DAC': -180, 'CGP': -180, 'ZYL': -180, 'JSR': -180,
      
      // モルディブ（日本より4時間遅れ）
      'MLE': -240, 'GAN': -240,
      
      // パキスタン（日本より4時間遅れ）
      'KHI': -240, 'ISB': -240, 'LHE': -240, 'PEW': -240, 'MUX': -240, 'SKT': -240,
      'UET': -240, 'GWD': -240, 'LYP': -240,
      
      // 中東
      'DXB': -300, 'AUH': -300, 'SHJ': -300, 'AAN': -300, 'AYM': -300, 'RKT': -300, // UAE（-5時間）
      'DOH': -360, 'DIA': -360, // カタール（-6時間）
      'KWI': -360, // クウェート（-6時間）
      'BAH': -360, // バーレーン（-6時間）
      'MCT': -300, 'SLL': -300, // オマーン（-5時間）
      'RUH': -360, 'JED': -360, 'DMM': -360, 'MED': -360, 'TUU': -360, 'AHB': -360, // サウジアラビア（-6時間）
      'AMM': -420, 'AQJ': -420, // ヨルダン（-7時間）
      'BEY': -420, // レバノン（-7時間）
      'DAM': -420, 'LTK': -420, // シリア（-7時間）
      'BGW': -360, 'BSR': -360, 'NJF': -360, 'EBL': -360, // イラク（-6時間）
      'THR': -270, 'IKA': -270, 'MHD': -270, 'SYZ': -270, 'KER': -270, 'BND': -270, // イラン（-4時間30分）
      'TLV': -420, 'SDV': -420, 'ETH': -420, 'HFA': -420, 'VDA': -420, // イスラエル（-7時間）
      
      // トルコ（-6時間）
      'IST': -360, 'SAW': -360, 'AYT': -360, 'ESB': -360, 'ADA': -360, 'DLM': -360,
      'TZX': -360, 'BJV': -360, 'ADB': -360,
      
      // オーストラリア（地域・季節により異なる）
      'SYD': 120,  // シドニー（夏時間+2時間）
      'MEL': 120,  // メルボルン（夏時間+2時間）
      'BNE': 60,   // ブリスベン（+1時間）
      'PER': -60,  // パース（-1時間）
      'ADL': 90,   // アデレード（夏時間+1時間30分）
      'CBR': 120,  // キャンベラ（夏時間+2時間）
      'OOL': 60,   // ゴールドコースト（+1時間）
      'CNS': 60,   // ケアンズ（+1時間）
      'DRW': 30,   // ダーウィン（+30分）
      'HBA': 120,  // ホバート（夏時間+2時間）
      'LST': 120,  // ランセストン（夏時間+2時間）
      'TSV': 60,   // タウンズビル（+1時間）
      'MCY': 60,   // サンシャインコースト（+1時間）
      'ASP': 30,   // アリススプリングス（+30分）
      'KTA': -60,  // カラサ（-1時間）
      'BME': -60,  // ブルーム（-1時間）
      'PHE': -60,  // ポートヘッドランド（-1時間）
      
      // ニュージーランド（夏時間により異なる）
      'AKL': 240,  // オークランド（夏時間+4時間）
      'WLG': 240,  // ウェリントン（夏時間+4時間）
      'CHC': 240,  // クライストチャーチ（夏時間+4時間）
      'ZQN': 240,  // クイーンズタウン（夏時間+4時間）
      'DUD': 240,  // ダニーデン（夏時間+4時間）
      
      // 太平洋諸島
      'NAN': 180,  // ナンディ（フィジー、+3時間）
      'SUV': 180,  // スバ（フィジー、+3時間）
      'NOU': 120,  // ヌメア（ニューカレドニア、+2時間）
      'PPT': -1140, // タヒチ（-19時間）
      'VLI': 120,  // ポートビラ（バヌアツ、+2時間）
      'APW': 180,  // アピア（サモア、+3時間）
      'TBU': 240,  // トンガタプ（トンガ、+4時間）
      'RUR': -1260, // ルルツ（フレンチポリネシア、-21時間）
      'GUM': 60,   // グアム（+1時間）
      'SPN': 60,   // サイパン（+1時間）
      'ROR': 0,    // パラオ（時差なし）
      
      // ヨーロッパ（夏時間により異なる、以下は夏時間）
      'LHR': -480, 'LGW': -480, 'LCY': -480, 'STN': -480, 'LTN': -480, 'MAN': -480,
      'EDI': -480, 'BHX': -480, 'GLA': -480, 'BRS': -480, 'NCL': -480, 'EMA': -480,
      'BFS': -480, 'ABZ': -480, 'LPL': -480, 'SOU': -480, 'CWL': -480, // イギリス（-8時間）
      
      'CDG': -420, 'ORY': -420, 'LYS': -420, 'NCE': -420, 'MRS': -420, 'TLS': -420,
      'BOD': -420, 'NTE': -420, 'SXB': -420, 'MPL': -420, 'BVA': -420, // フランス（-7時間）
      
      'FRA': -420, 'MUC': -420, 'TXL': -420, 'DUS': -420, 'HAM': -420, 'STR': -420,
      'CGN': -420, 'HAJ': -420, 'BRE': -420, 'NUE': -420, 'LEJ': -420, 'DTM': -420,
      'FKB': -420, 'PAD': -420, 'SXF': -420, 'HHN': -420, // ドイツ（-7時間）
      
      'MAD': -420, 'BCN': -420, 'PMI': -420, 'AGP': -420, 'VLC': -420, 'SVQ': -420,
      'BIO': -420, 'ALC': -420, 'IBZ': -420, 'TFS': -420, 'LPA': -420, 'SCQ': -420,
      'OVD': -420, 'ZAZ': -420, 'GRX': -420, 'ACE': -420, 'FUE': -420, 'MAH': -420,
      'REU': -420, 'VLL': -420, 'SDR': -420, 'XRY': -420, 'LEI': -420, // スペイン（-7時間）
      
      'FCO': -420, 'MXP': -420, 'VCE': -420, 'NAP': -420, 'BGY': -420, 'CIA': -420,
      'BLQ': -420, 'CTA': -420, 'PMO': -420, 'FLR': -420, 'TRN': -420, 'PSA': -420,
      'VRN': -420, 'TSF': -420, 'CAG': -420, 'BRI': -420, 'GOA': -420, 'LIN': -420,
      'TRS': -420, 'BDS': -420, 'SUF': -420, 'AHO': -420, // イタリア（-7時間）
      
      'AMS': -420, 'EIN': -420, 'RTM': -420, 'GRQ': -420, 'MST': -420, // オランダ（-7時間）
      'BRU': -420, 'CRL': -420, 'ANR': -420, 'LGG': -420, 'OST': -420, // ベルギー（-7時間）
      'ZRH': -420, 'GVA': -420, 'BSL': -420, 'BRN': -420, 'LUG': -420, // スイス（-7時間）
      'VIE': -420, 'SZG': -420, 'INN': -420, 'GRZ': -420, 'LNZ': -420, // オーストリア（-7時間）
      
      'ATH': -420, 'SKG': -420, 'HER': -420, 'RHO': -420, 'CFU': -420, 'CHQ': -420,
      'MJT': -420, 'JMK': -420, 'JTR': -420, 'KGS': -420, // ギリシャ（-7時間）
      
      'OTP': -420, 'TSR': -420, 'CLJ': -420, 'IAS': -420, 'SBZ': -420, // ルーマニア（-7時間）
      'SOF': -420, 'BOJ': -420, 'VAR': -420, 'PDV': -420, // ブルガリア（-7時間）
      
      'BUD': -420, 'DEB': -420, // ハンガリー（-7時間）
      'WAW': -420, 'KRK': -420, 'WRO': -420, 'POZ': -420, 'GDN': -420, 'KTW': -420,
      'SZZ': -420, 'WMI': -420, 'LCJ': -420, 'BZG': -420, 'RZE': -420, // ポーランド（-7時間）
      
      'PRG': -420, 'BRQ': -420, 'OSR': -420, // チェコ（-7時間）
      'BTS': -420, 'KSC': -420, // スロバキア（-7時間）
      
      'ZAG': -420, 'SPU': -420, 'DBV': -420, 'ZAD': -420, 'PUY': -420, 'RJK': -420, // クロアチア（-7時間）
      'LJU': -420, 'MBX': -420, // スロベニア（-7時間）
      'BEG': -420, 'INI': -420, // セルビア（-7時間）
      'SJJ': -420, 'TZL': -420, 'OMO': -420, 'BNX': -420, // ボスニア・ヘルツェゴビナ（-7時間）
      'TGD': -420, 'TIV': -420, // モンテネグロ（-7時間）
      'SKP': -420, 'OHD': -420, // 北マケドニア（-7時間）
      'TIA': -420, // アルバニア（-7時間）
      'PRN': -420, // コソボ（-7時間）
      
      'CPH': -420, 'BLL': -420, 'AAL': -420, 'AAR': -420, // デンマーク（-7時間）
      'ARN': -420, 'GOT': -420, 'MMX': -420, 'LLA': -420, 'UME': -420, 'KRN': -420,
      'VXO': -420, 'OSD': -420, 'KLR': -420, 'RNB': -420, // スウェーデン（-7時間）
      'OSL': -420, 'BGO': -420, 'TRD': -420, 'SVG': -420, 'BOO': -420, 'TOS': -420,
      'KRS': -420, 'AES': -420, 'HAU': -420, 'EVE': -420, // ノルウェー（-7時間）
      'HEL': -420, 'TKU': -420, 'OUL': -420, 'TMP': -420, 'RVN': -420, 'JOE': -420,
      'KUO': -420, 'VAA': -420, 'JYV': -420, 'LPP': -420, // フィンランド（-7時間）
      
      'KEF': -540, 'RKV': -540, 'AEY': -540, 'IFJ': -540, 'EGS': -540, // アイスランド（-9時間）
      'DUB': -480, 'ORK': -480, 'SNN': -480, 'NOC': -480, 'KIR': -480, // アイルランド（-8時間）
      
      'TLL': -420, 'TRU': -420, // エストニア（-7時間）
      'RIX': -420, 'LPX': -420, // ラトビア（-7時間）
      'VNO': -420, 'KUN': -420, 'PLQ': -420, // リトアニア（-7時間）
      
      'LIS': -480, 'OPO': -480, 'FAO': -480, 'FNC': -480, 'PDL': -480, 'HOR': -480,
      'PXO': -480, 'TER': -480, 'SMA': -480, 'PIX': -480, 'FLW': -480, // ポルトガル（-8時間）
      
      'SVO': -360, 'DME': -360, 'VKO': -360, 'LED': -360, 'KGD': -420, 'SVX': -300,
      'OVB': -180, 'KRR': -360, 'AER': -360, 'KZN': -360, 'UFA': -300, 'ROV': -360,
      'CEK': -300, 'PEE': -360, 'SGC': -360, 'KJA': -180, 'IKT': -60, 'YKS': 0,
      'PKC': 120, 'VVO': 60, 'KHV': 60, 'UUS': 120, // ロシア（地域により異なる）
      
      'KBP': -420, 'LWO': -420, 'DNK': -420, 'ODS': -420, 'HRK': -420, 'SIP': -420,
      'IEV': -420, 'CWC': -420, // ウクライナ（-7時間）
      'MSQ': -360, 'BQT': -360, // ベラルーシ（-6時間）
      'KIV': -420, // モルドバ（-7時間）
      
      'CAI': -420, 'SSH': -420, 'HRG': -420, 'HBE': -420, 'ASW': -420, 'LXR': -420,
      'RMF': -420, 'ATZ': -420, 'MUH': -420, 'SPX': -420, // エジプト（-7時間）
      
      // アフリカ
      'JNB': -420, 'CPT': -420, 'DUR': -420, 'PLZ': -420, 'ELS': -420, 'BFN': -420,
      'GRJ': -420, 'KIM': -420, 'UTN': -420, 'MQP': -420, // 南アフリカ（-7時間）
      
      'NBO': -360, 'MBA': -360, 'KIS': -360, 'EDL': -360, 'UKA': -360, // ケニア（-6時間）
      'ADD': -360, 'JIM': -360, 'BJR': -360, 'MQX': -360, 'DIR': -360, // エチオピア（-6時間）
      'DAR': -360, 'JRO': -360, 'ZNZ': -360, 'MWZ': -360, 'MBA': -360, // タンザニア（-6時間）
      'SEZ': -300, // セーシェル（-5時間）
      'RUN': -300, 'DZA': -300, // レユニオン・マヨット（-5時間）
      'TNR': -360, 'MJN': -360, // マダガスカル（-6時間）
      'MRU': -300, 'RRG': -300, // モーリシャス・ロドリゲス（-5時間）
      
      'LOS': -480, 'ABV': -480, 'PHC': -480, 'KAN': -480, 'ENU': -480, 'BNI': -480,
      'CBQ': -480, 'IBA': -480, 'ILR': -480, 'JOS': -480, 'KAD': -480, 'MDI': -480,
      'MIU': -480, 'QOW': -480, 'QRW': -480, 'SKO': -480, 'YOL': -480, // ナイジェリア（-8時間）
      
      'ACC': -540, 'KMS': -540, 'TML': -540, // ガーナ（-9時間）
      'ABJ': -540, 'BYK': -540, // コートジボワール（-9時間）
      'DKR': -540, 'DSS': -540, 'ZIG': -540, // セネガル（-9時間）
      'BKO': -540, 'GAQ': -540, // マリ（-9時間）
      'OUA': -540, 'BOY': -540, // ブルキナファソ（-9時間）
      'NIM': -540, 'ZND': -540, // ニジェール（-9時間）
      'LFW': -540, 'LPA': -540, 'ADD': -540, // トーゴ（-9時間）
      'COO': -540, 'BOY': -540, // ベナン（-9時間）
      'FNA': -540, 'MLW': -540, 'ROB': -540, // シエラレオネ（-9時間）
      'BNI': -540, 'CKY': -540, // ギニア（-9時間）
      'OXB': -540, // ギニアビサウ（-9時間）
      'NOU': -540, 'KED': -540, // モーリタニア（-9時間）
      'BYK': -540, // リベリア（-9時間）
      
      'ALG': -480, 'ORN': -480, 'CZL': -480, 'AAE': -480, 'BJA': -480, 'TLM': -480,
      'GHA': -480, 'HME': -480, 'TMR': -480, 'OUZ': -480, 'BSF': -480, 'ELG': -480,
      'INZ': -480, 'VVZ': -480, 'BMW': -480, 'OGX': -480, 'IAM': -480, 'TID': -480,
      'DJG': -480, 'AZR': -480, 'LOO': -480, 'TMX': -480, 'MZW': -480, // アルジェリア（-8時間）
      
      'TUN': -480, 'MIR': -480, 'DJE': -480, 'SFA': -480, 'GAE': -480, 'TBR': -480,
      'GAF': -480, 'TOE': -480, // チュニジア（-8時間）
      
      'CMN': -480, 'RAK': -480, 'AGA': -480, 'TNG': -480, 'FEZ': -480, 'OZZ': -480,
      'NDR': -480, 'OUD': -480, 'RBA': -480, 'TTU': -480, 'ESU': -480, 'EUN': -480,
      'VIL': -480, 'TTA': -480, 'ERH': -480, 'GLN': -480, 'AHU': -480, // モロッコ（-8時間）
      
      'TIP': -480, 'BEN': -480, 'MJI': -480, 'SEB': -480, 'TOB': -480, 'SRX': -480,
      'LAQ': -480, 'GHT': -480, 'AKF': -480, 'HUQ': -480, 'WAD': -480, // リビア（-8時間）
      
      'KRT': -360, 'PZU': -360, 'DOG': -360, 'ATB': -360, 'KSL': -360, 'UYL': -360,
      'DNI': -360, 'RSS': -360, 'ELF': -360, 'NHF': -360, 'EGN': -360, 'WHF': -360,
      'WUU': -360, 'JUB': -360, 'MAK': -360, // スーダン（-6時間）
      
      'ASM': -360, 'MSW': -360, 'ASA': -360, 'TES': -360, // エリトリア（-6時間）
      'JIB': -360, // ジブチ（-6時間）
      
      'EBB': -360, 'SRT': -360, 'JIN': -360, 'ULU': -360, 'ARU': -360, 'PAF': -360,
      'KBG': -360, 'KLA': -360, 'BUX': -360, 'RUA': -360, // ウガンダ（-6時間）
      
      'KGL': -420, 'KME': -420, 'CYA': -420, // ルワンダ（-7時間）
      'BJM': -420, 'GIT': -420, 'BUJ': -420, // ブルンジ（-7時間）
      
      'FIH': -480, 'FBM': -480, 'MJM': -480, 'MAT': -480, 'MDK': -480, 'BAN': -480,
      'BNC': -480, 'NLO': -480, 'FKI': -480, 'GME': -480, 'GOM': -480, 'KIS': -480,
      'LIQ': -480, 'KGA': -480, 'INN': -480, 'MNO': -480, 'KWZ': -480, 'BOA': -480,
      'BUN': -480, 'BKY': -480, 'BUK': -480, 'KND': -480, 'YAN': -480, 'GMA': -480,
      'INN': -480, 'ISI': -480, 'KEC': -480, 'KOO': -480, 'LOD': -480, 'LUA': -480,
      'LZA': -480, 'LZI': -480, 'PUN': -480, 'TSH': -480, // コンゴ民主共和国（-8時間）
      
      'BZV': -480, 'PNR': -480, 'DIS': -480, 'MKJ': -480, 'NKL': -480, 'GMM': -480,
      'OLL': -480, 'ION': -480, 'SIB': -480, 'EWO': -480, 'KEE': -480, 'OUE': -480,
      'ANJ': -480, 'BOE': -480, 'BTB': -480, 'DJO': -480, 'MQU': -480, // コンゴ共和国（-8時間）
      
      'LBV': -480, 'POG': -480, 'MVB': -480, 'OYE': -480, 'MJL': -480, 'KOU': -480,
      'MFF': -480, 'BMM': -480, 'LBQ': -480, 'OMB': -480, 'TCH': -480, 'ZKM': -480,
      'MKU': -480, // ガボン（-8時間）
      
      'SSG': -480, 'BSG': -480, 'BMF': -480, // 赤道ギニア（-8時間）
      'NSI': -480, 'BGF': -480, 'BBG': -480, 'OCC': -480, 'FOM': -480, 'GOU': -480,
      'KBI': -480, 'KLE': -480, 'MVR': -480, 'NGE': -480, 'SOE': -480, 'YAO': -480,
      'ROU': -480, 'BAT': -480, 'BEL': -480, 'BTA': -480, 'BUF': -480, 'BUC': -480,
      'DLA': -480, 'TKC': -480, 'FOM': -480, 'GAR': -480, 'MMF': -480, 'DSC': -480,
      'MBI': -480, // カメルーン（-8時間）
      
      'NDJ': -480, 'SRH': -480, 'AEH': -480, 'MQQ': -480, 'OUT': -480, 'ATV': -480,
      'AMC': -480, 'PLF': -480, 'LTC': -480, 'OUM': -480, 'MEF': -480, 'MVO': -480,
      'AMO': -480, 'BKR': -480, 'OGR': -480, // チャド（-8時間）
      
      'BGU': -480, 'BBY': -480, 'BBT': -480, 'BOP': -480, 'BIV': -480, 'BGP': -480,
      'BMY': -480, 'BSN': -480, 'BTG': -480, 'CRF': -480, 'ODJ': -480, 'ODA': -480,
      'IRO': -480, 'MHS': -480, 'MKI': -480, 'NDL': -480, 'OGD': -480, // 中央アフリカ（-8時間）
      
      'MPM': -420, 'VPY': -420, 'BEW': -420, 'APL': -420, 'INH': -420, 'VNX': -420,
      'VXC': -420, 'POL': -420, 'TET': -420, 'UEL': -420, 'LFB': -420, 'MZB': -420,
      'FQM': -420, 'LAD': -420, 'MTB': -420, // モザンビーク（-7時間）
      
      'LUN': -420, 'LLW': -420, 'KAA': -420, 'MUA': -420, 'NLA': -420, 'SLI': -420,
      'KLB': -420, 'CIP': -420, 'ZGU': -420, 'MFU': -420, // ザンビア（-7時間）
      
      'BLZ': -420, 'ZWA': -420, 'MFU': -420, 'CEH': -420, 'CMJ': -420, 'DET': -420,
      'GDI': -420, 'MNR': -420, 'MUZ': -420, 'MYZ': -420, 'NTI': -420, 'PLU': -420,
      'RKA': -420, 'SHY': -420, 'TKD': -420, 'VFA': -420, 'LKA': -420, 'TEX': -420,
      'VUP': -420, 'ZKB': -420, // マラウイ（-7時間）
      
      'HRE': -420, 'BUQ': -420, 'VFA': -420, 'MVZ': -420, 'KAB': -420, 'HWN': -420,
      'GWE': -420, 'BFO': -420, 'WKI': -420, // ジンバブエ（-7時間）
      
      'WDH': -420, 'WVB': -420, 'ERS': -420, 'LUD': -420, 'KMP': -420, 'MPA': -420,
      'NDU': -420, 'OMD': -420, 'OND': -420, 'RUN': -420, 'SWP': -420, 'TSB': -420,
      'TCY': -420, // ナミビア（-7時間）
      
      'GBE': -420, 'MUB': -420, 'FRW': -420, 'JWA': -420, 'BBK': -420, 'ORP': -420,
      'PKW': -420, 'SXN': -420, 'TBY': -420, // ボツワナ（-7時間）
      
      'MBD': -420, 'WYS': -420, 'MZF': -420, 'LMQ': -420, 'MZQ': -420, 'SZK': -420,
      'TSN': -420, // エスワティニ（-7時間）
      
      'MSU': -420, 'LES': -420, 'MKH': -420, 'MOQ': -420, 'PZB': -420, 'QMN': -420,
      'SOS': -420, 'TKH': -420, 'THB': -420, 'UTT': -420, // レソト（-7時間）
      
      'LAD': -480, 'BUG': -480, 'CBT': -480, 'CNN': -480, 'BFX': -480, 'CAB': -480,
      'CAV': -480, 'CFF': -480, 'CXM': -480, 'CEO': -480, 'DUE': -480, 'JMB': -480,
      'KNP': -480, 'LBZ': -480, 'PBN': -480, 'SPP': -480, 'SDD': -480, 'SME': -480,
      'SZA': -480, 'NZA': -480, 'GXG': -480, 'MSZ': -480, 'NOV': -480, 'SVP': -480,
      'UGO': -480, 'UAL': -480, 'VPE': -480, 'VHC': -480, 'XGN': -480, // アンゴラ（-8時間）
      
      'SAH': -540, 'BOD': -540, 'CNA': -540, 'AAN': -540, 'ANF': -540, 'ANS': -540,
      'BJZ': -540, 'RMI': -540, 'IOB': -540, 'TAT': -540, 'TOQ': -540, 'YVA': -540,
      'YOT': -540, // イエメン（-9時間）
      
      'HAH': -540, 'MGQ': -540, 'HPA': -540, 'HAD': -540, 'CYK': -540, 'WAE': -540,
      'BIR': -540, 'MRY': -540, 'PRN': -540, 'CMU': -540, 'CHU': -540, 'DES': -540,
      'MYM': -540, 'MTT': -540, 'OUA': -540, 'POL': -540, 'RUG': -540, 'SIF': -540,
      'TMW': -540, 'ZIS': -540, // ソマリア（-9時間）
      
      // 北米
      'JFK': -780, 'EWR': -780, 'LGA': -780, 'ISP': -780, 'HPN': -780, 'SWF': -780, // ニューヨーク（-13時間）
      'BOS': -780, 'PVD': -780, 'BDL': -780, 'MHT': -780, 'PWM': -780, 'BGR': -780, // ボストン周辺（-13時間）
      'PHL': -780, 'PIT': -780, 'BWI': -780, 'DCA': -780, 'IAD': -780, 'RIC': -780, // 東海岸中部（-13時間）
      'ATL': -780, 'CLT': -780, 'RDU': -780, 'CHS': -780, 'SAV': -780, 'JAX': -780, // 南東部（-13時間）
      'MIA': -780, 'FLL': -780, 'PBI': -780, 'RSW': -780, 'TPA': -780, 'MCO': -780, // フロリダ（-13時間）
      'SJU': -780, 'STT': -780, 'STX': -780, // プエルトリコ・US領バージン諸島（-13時間）
      
      'ORD': -840, 'MDW': -840, 'MKE': -840, 'MSP': -840, 'DTW': -840, 'CLE': -840, // 中西部（-14時間）
      'STL': -840, 'MCI': -840, 'OMA': -840, 'DSM': -840, 'CVG': -840, 'IND': -840, // 中部（-14時間）
      'DFW': -840, 'IAH': -840, 'AUS': -840, 'SAT': -840, 'MSY': -840, 'HOU': -840, // 南部（-14時間）
      'MEM': -840, 'BNA': -840, 'BHM': -840, 'JAN': -840, 'LIT': -840, 'OKC': -840, // 南中部（-14時間）
      
      'DEN': -900, 'COS': -900, 'ABQ': -900, 'ELP': -900, 'TUS': -900, // 山岳部（-15時間）
      'PHX': -900, 'LAS': -900, 'SLC': -900, 'BOI': -900, // 山岳西部（-15時間）
      
      'LAX': -960, 'SFO': -960, 'SAN': -960, 'OAK': -960, 'SJC': -960, 'BUR': -960, // カリフォルニア（-16時間）
      'SEA': -960, 'PDX': -960, 'GEG': -960, 'YVR': -960, 'YYC': -900, 'YEG': -900, // 太平洋岸北西部（-16時間）
      
      'ANC': -1020, 'FAI': -1020, 'JNU': -1020, // アラスカ（-17時間）
      'HNL': -1140, 'OGG': -1140, 'KOA': -1140, 'LIH': -1140, 'ITO': -1140, // ハワイ（-19時間）
      
      'YYZ': -780, 'YOW': -780, 'YUL': -780, 'YHZ': -780, // カナダ東部（-13時間）
      'YWG': -840, 'YQR': -840, 'YXE': -840, // カナダ中部（-14時間）
      'YYC': -900, 'YEG': -900, // カナダ山岳部（-15時間）
      'YVR': -960, 'YYJ': -960, // カナダ西部（-16時間）
      
      // メキシコ
      'MEX': -840, 'GDL': -840, 'MTY': -840, 'TIJ': -960, 'CUN': -780, 'SJD': -900,
      'PVR': -840, 'ACA': -840, 'MZT': -900, 'CUL': -900, 'HMO': -900, 'CJS': -900,
      'AGU': -840, 'BJX': -840, 'CUU': -900, 'DGO': -840, 'GYM': -900, 'LAP': -900,
      'LMM': -840, 'MAN': -840, 'MID': -780, 'MLM': -840, 'MTT': -780, 'MXL': -960,
      'NLU': -840, 'OAX': -840, 'PAZ': -900, 'PBC': -840, 'PXM': -840, 'QRO': -840,
      'REX': -840, 'SLP': -840, 'TAM': -840, 'TAP': -780, 'TGZ': -780, 'TLC': -840,
      'TRC': -840, 'VER': -840, 'VSA': -840, 'ZCL': -840, 'ZIH': -840, 'ZLO': -840,
      
      // 中米
      'GUA': -840, 'SAL': -840, 'TGU': -840, 'SAP': -840, 'MGA': -840, 'SJO': -840,
      'PTY': -780, 'BZE': -840, 'FRS': -840, 'RTB': -840,
      
      // カリブ海
      'HAV': -780, 'VRA': -780, 'HOG': -780, 'SCU': -780, 'CYO': -780, 'CMW': -780,
      'CFG': -780, 'CCC': -780, // キューバ（-13時間）
      
      'KIN': -780, 'MBJ': -780, 'OCJ': -780, 'POT': -780, 'NEG': -780, // ジャマイカ（-13時間）
      'SDQ': -780, 'POP': -780, 'PUJ': -780, 'STI': -780, 'LRM': -780, // ドミニカ共和国（-13時間）
      'PAP': -780, 'CAP': -780, // ハイチ（-13時間）
      
      'NAS': -780, 'FPO': -780, 'GGT': -780, 'ELH': -780, 'MAY': -780, 'IGA': -780,
      'TBI': -780, 'AXP': -780, 'RSD': -780, 'GHB': -780, 'GHC': -780, // バハマ（-13時間）
      
      'BGI': -780, 'TAB': -780, // バルバドス（-13時間）
      'POS': -780, 'ANR': -780, 'PBM': -780, // トリニダード・トバゴ（-13時間）
      
      'CUR': -780, 'BON': -780, 'AUA': -780, 'SXM': -780, // オランダ領カリブ（-13時間）
      'GND': -780, 'STL': -780, 'SVD': -780, 'SLU': -780, 'DOM': -780, 'DCF': -780,
      'SKB': -780, 'NEV': -780, 'ANU': -780, 'BBU': -780, 'EIS': -780, 'VIJ': -780,
      'AXA': -780, 'MNI': -780, 'PLS': -780, 'GDT': -780, 'LSS': -780, 'CCE': -780,
      'SBH': -780, 'PTP': -780, 'FDF': -780, 'BQU': -780, 'CYB': -780, 'LCE': -780,
      'LRM': -780, // その他カリブ海諸島（-13時間）
      
      // 南米
      'GRU': -660, 'CGH': -660, 'BSB': -660, 'GIG': -660, 'SDU': -660, 'CNF': -660,
      'SSA': -660, 'REC': -660, 'FOR': -660, 'POA': -660, 'FLN': -660, 'CWB': -660,
      'BEL': -660, 'MAO': -720, 'SLZ': -660, 'CGB': -720, 'CGR': -720, 'GYN': -660,
      'VCP': -660, 'RAO': -660, 'UDI': -660, 'MGF': -660, 'JPA': -660, 'THE': -660,
      'AJU': -660, 'MCZ': -660, 'VDC': -660, 'IOS': -660, 'BVB': -720, 'STM': -720,
      'MAB': -720, 'CZS': -720, 'TBT': -720, 'SJP': -660, 'BAU': -660, 'PPB': -660,
      'LDB': -660, 'JDO': -660, 'BPS': -660, 'CAC': -660, 'PMG': -660, 'NVT': -660,
      'BYO': -660, 'IGU': -660, 'PET': -660, 'VIX': -660, 'PMW': -660, 'MCP': -660,
      'BZC': -720, 'CIZ': -720, 'AAX': -660, 'AFL': -660, 'ARU': -660, 'BEZ': -660,
      'BRA': -660, 'BSS': -660, 'CDJ': -660, 'CFB': -660, 'XAP': -660, 'CLV': -660,
      'CMG': -660, 'CAU': -660, 'CAW': -720, 'CCM': -660, 'JCM': -660, 'CLN': -660,
      'CKS': -720, 'CPV': -660, 'CRQ': -660, 'DOU': -660, 'ERM': -660, 'FEC': -660,
      'FEN': -660, 'GPB': -660, 'GRP': -660, 'GUJ': -660, 'GVR': -660, 'HUW': -720,
      'IMP': -660, 'IPN': -660, 'ITN': -660, 'ITB': -720, 'JJG': -660, 'JOI': -660,
      'JPR': -660, 'LAJ': -660, 'LAZ': -720, 'MII': -660, 'MEU': -660, 'MOC': -660,
      'MVF': -660, 'MBZ': -660, 'NNU': -660, 'NQL': -660, 'OYK': -720, 'OPS': -660,
      'PGZ': -660, 'PNZ': -660, 'PAV': -660, 'PBQ': -660, 'PHB': -660, 'PIV': -720,
      'POJ': -660, 'PMN': -720, 'PVH': -720, 'RBR': -720, 'REC': -660, 'RIG': -660,
      'RDC': -660, 'ROO': -660, 'RIA': -660, 'SJK': -660, 'SBJ': -720, 'SOD': -660,
      'TMT': -720, 'TRQ': -660, 'TFF': -720, 'TUR': -660, 'UBA': -660, 'VAG': -660,
      'BVH': -720, 'VLP': -660, 'AQA': -660, 'ATM': -660, 'AUX': -660, 'CXJ': -660,
      'CAF': -660, 'DIQ': -660, 'DNO': -660, 'ERN': -720, 'FEJ': -660, 'HZB': -660,
      'IDO': -660, 'ITR': -660, 'JIA': -660, 'JLS': -660, 'JNA': -660, 'JTC': -660,
      'JTI': -660, 'JRN': -660, 'JCB': -660, 'JDF': -660, 'JEQ': -660, 'MAE': -660,
      'MNX': -660, 'NPU': -660, 'OAL': -660, 'OUT': -660, 'PHI': -660, 'PTO': -660,
      'PCS': -660, 'PSW': -660, 'QPS': -660, 'QRN': -660, 'QDV': -660, 'RVD': -660,
      'SID': -660, 'SFK': -660, 'SLB': -660, 'SEI': -660, 'TFL': -660, 'TOW': -660,
      'TXF': -660, 'TJL': -660, 'TEC': -660, 'UBT': -660, 'UNA': -660, 'UMU': -660,
      'URB': -660, 'VAL': -660, 'VMI': -660, 'VOT': -660, 'IRZ': -660, // ブラジル（地域により-11～-12時間）
      
      'EZE': -660, 'AEP': -660, 'COR': -660, 'ROS': -660, 'MDZ': -660, 'BRC': -660,
      'IGR': -660, 'REL': -660, 'SLA': -660, 'JUJ': -660, 'TUC': -660, 'RGA': -660,
      'UAQ': -660, 'RCU': -660, 'RSA': -660, 'BHI': -660, 'CRD': -660, 'FTE': -660,
      'RGL': -660, 'USH': -660, 'NQN': -660, 'CTC': -660, 'CNQ': -660, 'CPE': -660,
      'CSZ': -660, 'EQS': -660, 'MDQ': -660, 'PRA': -660, 'RCQ': -660, 'RES': -660,
      'RHD': -660, 'AOL': -660, 'VDM': -660, 'IRJ': -660, 'LUQ': -660, 'LGS': -660,
      'ORA': -660, 'PSS': -660, 'SDE': -660, 'SFN': -660, 'AFA': -660, 'VME': -660,
      'APZ': -660, 'VLG': -660, 'HOS': -660, 'JSM': -660, 'SGV': -660, 'OVR': -660,
      'GPI': -660, 'LPG': -660, 'OYO': -660, 'GPO': -660, 'GUQ': -660, // アルゼンチン（-12時間）
      
      'SCL': -720, 'CCP': -720, 'ANF': -720, 'IQQ': -720, 'ARI': -720, 'CJC': -720,
      'LSC': -720, 'CPO': -720, 'PMC': -720, 'PNT': -720, 'PUQ': -720, 'BBA': -720,
      'MHC': -720, 'WPR': -720, 'WPA': -720, 'IPC': -900, 'ESR': -720, 'ZCO': -720,
      'WPU': -720, 'ZAL': -720, 'WCA': -720, 'CCH': -720, 'LGR': -720, 'LSQ': -720,
      'VAP': -720, 'KNA': -720, 'SCL': -720, 'ZOS': -720, 'CNR': -720, 'WCH': -720,
      'FFU': -720, 'PZS': -720, 'PCQ': -720, // チリ（-12時間、イースター島-14時間）
      
      'LIM': -780, 'CUZ': -780, 'AQP': -780, 'PIU': -780, 'TRU': -780, 'CIX': -780,
      'IQT': -780, 'TPP': -780, 'PEM': -780, 'TCQ': -780, 'TBP': -780, 'CHM': -780,
      'JUL': -780, 'CJA': -780, 'TYL': -780, 'PCL': -780, 'ANS': -780, 'ATA': -780,
      'AYP': -780, 'HUU': -780, 'JAE': -780, 'JAU': -780, 'JJI': -780, 'TGI': -780,
      'YMS': -780, 'CHH': -780, 'CHY': -780, 'SFK': -780, 'RIM': -780, 'REQ': -780,
      'SJA': -780, 'IBP': -780, 'SMG': -780, 'MBP': -780, 'ALD': -780, 'AOP': -780,
      'ATG': -780, 'AYC': -780, 'BLP': -780, 'CHG': -780, 'CUZ': -780, 'SFK': -780,
      'CRP': -780, 'DOI': -780, 'HCO': -780, 'HUC': -780, 'HUX': -780, 'ILC': -780,
      'ILQ': -780, 'JNE': -780, 'JUR': -780, 'LOH': -780, 'MGP': -780, 'MZA': -780,
      'OTZ': -780, 'PAC': -780, 'PAS': -780, 'SFK': -780, 'PIR': -780, 'POI': -780,
      'PQT': -780, 'PYC': -780, 'RDN': -780, 'REV': -780, 'RIJ': -780, 'SQU': -780,
      'SFK': -780, 'TKQ': -780, 'TMI': -780, 'TNM': -780, 'TRF': -780, 'UCZ': -780,
      'UMI': -780, 'VNU': -780, 'YLM': -780, 'YOP': -780, 'YRT': -780, 'YVR': -780, // ペルー（-14時間）
      
      'BOG': -780, 'MDE': -780, 'CLO': -780, 'CTG': -780, 'BAQ': -780, 'BGA': -780,
      'ADZ': -780, 'PEI': -780, 'CUC': -780, 'SMR': -780, 'LET': -780, 'MVP': -780,
      'EOH': -780, 'PSO': -780, 'MZL': -780, 'NVA': -780, 'RCH': -780, 'AXM': -780,
      'BUN': -780, 'CRC': -780, 'TCO': -780, 'VUP': -780, 'EYP': -780, 'GGL': -780,
      'APO': -780, 'MTR': -780, 'UIB': -780, 'AUC': -780, 'BSC': -780, 'CPB': -780,
      'CZU': -780, 'EBG': -780, 'FLA': -780, 'FDA': -780, 'GRA': -780, 'GLJ': -780,
      'LPE': -780, 'SVI': -780, 'MFS': -780, 'MGN': -780, 'MVP': -780, 'MQU': -780,
      'MTB': -780, 'MZL': -780, 'NCI': -780, 'NAR': -780, 'NQU': -780, 'OCV': -780,
      'OTU': -780, 'PCR': -780, 'PDA': -780, 'PZA': -780, 'PPN': -780, 'PUU': -780,
      'PVA': -780, 'ACD': -780, 'CSR': -780, 'RVE': -780, 'SJE': -780, 'RFG': -780,
      'SRS': -780, 'SSL': -780, 'SQE': -780, 'TME': -780, 'TBT': -780, 'TDA': -780,
      'TLU': -780, 'TQS': -780, 'TRB': -780, 'ULS': -780, 'UNC': -780, 'VGZ': -780,
      'VVC': -780, 'AYG': -780, 'NBB': -780, 'HTZ': -780, 'IGO': -780, 'LQM': -780,
      'MND': -780, 'MHF': -780, 'MCJ': -780, 'ORC': -780, 'PTX': -780, 'PLU': -780,
      'PBE': -780, 'PDM': -780, 'PYN': -780, 'RAV': -780, 'SNG': -780, 'SOH': -780,
      'TTM': -780, 'URI': -780, 'URR': -780, 'ZPS': -780, // コロンビア（-14時間）
      
      'UIO': -780, 'GYE': -780, 'GPS': -840, 'CUE': -780, 'MEC': -780, 'ESM': -780,
      'PTZ': -780, 'LOH': -780, 'ATF': -780, 'BHA': -780, 'COO': -780, 'ETR': -780,
      'JIP': -780, 'LGO': -780, 'LTX': -780, 'MRR': -780, 'OCC': -780, 'PVS': -780,
      'PYO': -780, 'QUI': -780, 'SNC': -780, 'SUQ': -780, 'TSC': -780, 'TPN': -780,
      'TPC': -780, 'TUA': -780, 'UEU': -780, 'XMS': -780, 'SCY': -840, // エクアドル（-14時間、ガラパゴス諸島-15時間）
      
      'CCS': -720, 'MAR': -720, 'CUM': -720, 'PZO': -720, 'BRM': -720, 'MRD': -720,
      'VLN': -720, 'STD': -720, 'BNS': -720, 'VIG': -720, 'SFD': -720, 'LFR': -720,
      'LSP': -720, 'AGV': -720, 'PMV': -720, 'CBL': -720, 'CRV': -720, 'CLX': -720,
      'GDO': -720, 'HHH': -720, 'ICA': -720, 'JAV': -720, 'LGY': -720, 'LRV': -720,
      'MAT': -720, 'MUN': -720, 'MYC': -720, 'PBL': -720, 'PDZ': -720, 'PPH': -720,
      'PYH': -720, 'SFX': -720, 'SOM': -720, 'STB': -720, 'SVZ': -720, 'TUV': -720,
      'TMO': -720, 'URM': -720, 'VDP': -720, 'VLV': -720, // ベネズエラ（-12時間30分）
      
      'GEO': -660, 'ORG': -660, 'NYA': -660, 'SKM': -660, 'BMJ': -660, 'NAI': -660,
      'OEM': -660, 'LTM': -660, 'GFO': -660, 'MBW': -660, // ガイアナ（-11時間）
      
      'PBM': -660, 'CAY': -660, 'MPY': -660, 'REI': -660, 'XAU': -660, 'TMT': -660,
      'LDN': -660, 'REG': -660, 'OXP': -660, // フランス領ギアナ（-11時間）
      
      'PBM': -660, 'AGI': -660, 'BTO': -660, 'DOE': -660, 'DRJ': -660, 'ORG': -660,
      'SMZ': -660, 'SNM': -660, 'TOT': -660, 'WSJ': -660, // スリナム（-11時間）
      
      'LPB': -720, 'VVI': -720, 'CBB': -720, 'SRZ': -720, 'TJA': -720, 'SRE': -720,
      'TDD': -720, 'POI': -720, 'ORU': -720, 'RIB': -720, 'RBQ': -720, 'SBL': -720,
      'MHW': -720, 'BYC': -720, 'SRJ': -720, 'CAM': -720, 'SBH': -720, 'APB': -720,
      'ASC': -720, 'BVK': -720, 'BLZ': -720, 'CCA': -720, 'CEP': -720, 'CIJ': -720,
      'GYA': -720, 'HUN': -720, 'MGD': -720, 'PBF': -720, 'PSV': -720, 'PSZ': -720,
      'RAB': -720, 'RBO': -720, 'SBT': -720, 'SNG': -720, 'SRD': -720, 'SRL': -720,
      'SRP': -720, 'UAC': -720, 'UYU': -720, 'VAH': -720, 'VLM': -720, // ボリビア（-12時間）
      
      'ASU': -660, 'AGT': -660, 'CIH': -660, 'PCJ': -660, 'PIL': -660, // パラグアイ（-12時間）
      
      'MVD': -660, 'PDP': -660, 'CYR': -660, 'DZO': -660, 'MLZ': -660, 'PDU': -660,
      'RVY': -660, 'STY': -660, 'TAW': -660, 'TYT': -660, 'VCH': -660, 'ATI': -660, // ウルグアイ（-12時間）
      
      // パプアニューギニア（+1時間）
      'POM': 60, 'LAE': 60, 'WEW': 60, 'HGU': 60, 'MAG': 60, 'RAB': 60, 'GKA': 60,
      'LSJ': 60, 'BUA': 60, 'CMU': 60, 'CVL': 60, 'DNU': 60, 'GRL': 60, 'HKN': 60,
      'KVG': 60, 'LNV': 60, 'MAS': 60, 'MDU': 60, 'MIS': 60, 'MXH': 60, 'PNP': 60,
      'TBG': 60, 'TFI': 60, 'TOK': 60, 'TKW': 60, 'VAI': 60, 'WBM': 60, 'WWK': 60,
      
      // ソロモン諸島（+2時間）
      'HIR': 120, 'GZO': 120, 'CHY': 120, 'BNY': 120, 'ANU': 120, 'ATD': 120, 'AVU': 120,
      'IRA': 120, 'SCZ': 120, 'MUA': 120, 'RUS': 120, 'EGM': 120, 'FRE': 120, 'KWS': 120,
      'NNB': 120, 'RNA': 120, 'RBV': 120, 'RNL': 120, 'RIN': 120, 'VEV': 120, 'KGE': 120,
      
      // その他の太平洋諸島
      'MAJ': 180, 'KWA': 180, 'TRW': 180, 'FSM': 60, 'PNI': 60, 'TKK': 60, 'YAP': 60,
      'KWJ': 180, 'MAJ': 180, 'RNI': 180, 'AAU': 180, 'AIS': 180, 'AIT': 180, 'AIU': 180,
      'BKI': 180, 'BKU': 180, 'CIS': 180, 'CJN': 180, 'CUK': 180, 'DRK': 180, 'DSI': 180,
      'HAA': 180, 'HHI': 180, 'HOP': 180, 'JEG': 180, 'KOC': 180, 'LBS': 180, 'LIJ': 180,
      'LIK': 180, 'LML': 180, 'LOS': 180, 'LUO': 180, 'LUP': 180, 'MJB': 180, 'MJE': 180,
      'MKP': 180, 'MNI': 180, 'MRY': 180, 'MUK': 180, 'MWK': 180, 'MXS': 180, 'NIU': 180,
      'NTT': 180, 'OBU': 180, 'OFU': 180, 'ONR': 180, 'PEN': 180, 'PKO': 180, 'PPG': 180,
      'PPT': 180, 'PUK': 180, 'PYE': 180, 'RAF': 180, 'RAK': 180, 'RAR': 180, 'RKA': 180,
      'RMT': 180, 'RRG': 180, 'RRK': 180, 'RUR': 180, 'RVV': 180, 'SAW': 180, 'TAH': 180,
      'TAV': 180, 'TIH': 180, 'TMC': 180, 'TOE': 180, 'TTG': 180, 'TUB': 180, 'UAH': 180,
      'UAP': 180, 'UIP': 180, 'UJE': 180, 'UJN': 180, 'UNK': 180, 'UOL': 180, 'UPP': 180,
      'UTB': 180, 'VAU': 180, 'VBV': 180, 'VHZ': 180, 'VIY': 180, 'VLI': 180, 'VMU': 180,
      'VPE': 180, 'WAL': 180, 'WFU': 180, 'WLS': 180, 'WNR': 180, 'WOE': 180, 'WOL': 180,
      'WOT': 180, 'WTE': 180, 'YAM': 180, 'ZON': 180, // その他太平洋諸島（時差は島により異なる）
    };

    const offset = TIMEZONE_OFFSETS[airportCode];
    if (offset === undefined) {
      log(`Unknown airport code: ${airportCode}`);
      return null;
    }

    // 既に日本時間の空港は「同じ時間」と表示
    if (offset === 0) {
      log(`${airportCode} is already in JST`);
      return `${timeString} (JST同等)`;
    }

    const parsedTime = parseTimeString(timeString);
    if (!parsedTime) {
      log(`Could not parse time: ${timeString}`);
      return null;
    }

    try {
      // 時間を分に変換
      let totalMinutes = parsedTime.hours * 60 + parsedTime.minutes;
      
      // 時差を適用
      // 例：フィリピン19:20（日本より1時間遅れ）→ 日本20:20
      // 19:20 = 1160分、-(-60) = +60分 → 1220分 = 20:20
      totalMinutes = totalMinutes - offset;
      
      // 24時間を超えた場合の処理
      if (totalMinutes >= 1440) {
        totalMinutes -= 1440;
      } else if (totalMinutes < 0) {
        totalMinutes += 1440;
      }
      
      // 時間と分に戻す
      const japanHours = Math.floor(totalMinutes / 60);
      const japanMinutes = totalMinutes % 60;
      
      // フォーマット
      const japanTimeString = `${String(japanHours).padStart(2, '0')}:${String(japanMinutes).padStart(2, '0')}`;
      
      log(`Converted ${airportCode} ${timeString} → ${japanTimeString} JST (offset: ${offset} minutes)`);
      return `${japanTimeString} (JST)`;
    } catch (error) {
      log('Time conversion error:', error);
      return null;
    }
  }

  // DOM要素を検索して時間を変換する関数
  function convertTimesInPage() {
    log('Starting time conversion...');

    let convertedCount = 0;

    // 検索結果ページの時間変換
    convertedCount += convertSearchResultTimes();
    
    // 詳細ページの時間変換
    convertedCount += convertDetailPageTimes();

    log(`Total converted ${convertedCount} times`);
    return convertedCount;
  }

  // 検索結果ページの時間変換
  function convertSearchResultTimes() {
    let convertedCount = 0;
    
    // スカイスキャナーの実際のHTML構造に基づいてフライト情報を抽出
    const flightCards = document.querySelectorAll('.BpkDividedCard_bpk-divided-card--horizontal-container__YmViN');
    
    flightCards.forEach(card => {
      // フライト詳細コンテナを取得
      const legDetailsContainer = card.querySelector('.LegDetails_container__MTkyM');
      if (!legDetailsContainer) return;

      // 出発時間の要素を取得
      const departureTimeElement = legDetailsContainer.querySelector('.LegInfo_routePartialDepart__YTMzN .BpkText_bpk-text--heading-5__MTRjZ');
      const departureAirportElement = legDetailsContainer.querySelector('.LegInfo_routePartialDepart__YTMzN .LegInfo_routePartialCityTooltip__MGJlM');
      
      // 到着時間の要素を取得
      const arrivalTimeElement = legDetailsContainer.querySelector('.LegInfo_routePartialArrive__ZjZlZ .BpkText_bpk-text--heading-5__MTRjZ');
      const arrivalAirportElement = legDetailsContainer.querySelector('.LegInfo_routePartialArrive__ZjZlZ .LegInfo_routePartialCityTooltip__MGJlM');

      // 出発時間を変換
      if (departureTimeElement && departureAirportElement) {
        const departureTime = departureTimeElement.textContent.trim();
        const departureAirport = departureAirportElement.textContent.trim();
        
        if (departureTime.match(/\d{1,2}:\d{2}/)) {
          const convertedTime = convertToJapanTime(departureTime, departureAirport);
          if (convertedTime && !departureTimeElement.querySelector('.japan-time')) {
            // 日本時間を併記（既に追加されていない場合のみ）
            departureTimeElement.innerHTML = `
              ${departureTime}
              <div class="japan-time" style="font-size: 1rem; color: #0066cc; font-weight: normal;">
                ${convertedTime}
              </div>
            `;
            convertedCount++;
            log(`Converted departure: ${departureTime} → ${convertedTime} (${departureAirport})`);
          }
        }
      }

      // 到着時間を変換
      if (arrivalTimeElement && arrivalAirportElement) {
        const arrivalTime = arrivalTimeElement.textContent.trim();
        const arrivalAirport = arrivalAirportElement.textContent.trim();
        
        if (arrivalTime.match(/\d{1,2}:\d{2}/)) {
          const convertedTime = convertToJapanTime(arrivalTime, arrivalAirport);
          if (convertedTime && !arrivalTimeElement.querySelector('.japan-time')) {
            // 日本時間を併記（既に追加されていない場合のみ）
            arrivalTimeElement.innerHTML = `
              ${arrivalTime}
              <div class="japan-time" style="font-size: 1rem; color: #0066cc; font-weight: normal;">
                ${convertedTime}
              </div>
            `;
            convertedCount++;
            log(`Converted arrival: ${arrivalTime} → ${convertedTime} (${arrivalAirport})`);
          }
        }
      }
    });

    return convertedCount;
  }

  // 詳細ページの時間変換
  function convertDetailPageTimes() {
    let convertedCount = 0;
    
    // 詳細ページの時間要素を取得
    const timeElements = document.querySelectorAll('.SegmentEndpoint_time__NWM3N .TimeWithOffsetTooltip_colorPrimary__OTkwN');
    
    timeElements.forEach(timeElement => {
      const timeText = timeElement.textContent.trim();
      
      if (timeText.match(/\d{1,2}:\d{2}/) && !timeElement.querySelector('.japan-time')) {
        // 空港コードを探す
        const segmentEndpoint = timeElement.closest('.SegmentEndpoint_segmentEndpoint__MTQxY');
        if (!segmentEndpoint) return;
        
        const airportElement = segmentEndpoint.querySelector('span[aria-hidden="true"]');
        if (!airportElement) return;
        
        const airportText = airportElement.textContent.trim();
        const airportCodeMatch = airportText.match(/^([A-Z]{3})\s/);
        
        if (airportCodeMatch) {
          const airportCode = airportCodeMatch[1];
          const convertedTime = convertToJapanTime(timeText, airportCode);
          
          if (convertedTime) {
            // 日本時間を併記
            timeElement.innerHTML = `
              ${timeText}
              <div class="japan-time" style="font-size: 0.9rem; color: #0066cc; font-weight: normal; margin-top: 2px;">
                ${convertedTime}
              </div>
            `;
            convertedCount++;
            log(`Converted detail page time: ${timeText} → ${convertedTime} (${airportCode})`);
          }
        }
      }
    });

    // レガシー詳細ページの時間要素も変換
    const legacyTimeElements = document.querySelectorAll('.BpkText_bpk-text--base__MWRjY.TimeWithOffsetTooltip_colorPrimary__OTkwN');
    
    legacyTimeElements.forEach(timeElement => {
      const timeText = timeElement.textContent.trim();
      
      if (timeText.match(/\d{1,2}:\d{2}/) && !timeElement.querySelector('.japan-time')) {
        // 空港コードを探す
        const segmentEndpoint = timeElement.closest('.SegmentEndpoint_segmentEndpoint__MTQxY');
        if (!segmentEndpoint) return;
        
        const airportElement = segmentEndpoint.querySelector('span[aria-hidden="true"]');
        if (!airportElement) return;
        
        const airportText = airportElement.textContent.trim();
        const airportCodeMatch = airportText.match(/^([A-Z]{3})\s/);
        
        if (airportCodeMatch) {
          const airportCode = airportCodeMatch[1];
          const convertedTime = convertToJapanTime(timeText, airportCode);
          
          if (convertedTime) {
            // 日本時間を併記
            timeElement.innerHTML = `
              ${timeText}
              <div class="japan-time" style="font-size: 0.9rem; color: #0066cc; font-weight: normal; margin-top: 2px;">
                ${convertedTime}
              </div>
            `;
            convertedCount++;
            log(`Converted legacy detail page time: ${timeText} → ${convertedTime} (${airportCode})`);
          }
        }
      }
    });

    return convertedCount;
  }

  // URLから空港コードを抽出する関数
  function extractAirportCodesFromURL() {
    const url = window.location.href;
    const match = url.match(/\/flights\/([A-Z]{3,4})\/([A-Z]{3,4})\//);
    if (match) {
      return {
        departure: match[1],
        arrival: match[2]
      };
    }
    return null;
  }

  // ページ読み込み完了時に実行
  function init() {
    log('Initializing Skyscanner Time Converter...');
    
    const airportCodes = extractAirportCodesFromURL();
    if (airportCodes) {
      log('Detected route:', airportCodes);
    }

    // 初回実行
    convertTimesInPage();

    // 動的コンテンツの変更を監視
    const observer = new MutationObserver(() => {
      convertTimesInPage();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    log('Time converter initialized successfully');
  }

  // DOM読み込み完了を待つ
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 拡張機能の状態を確認するためのメッセージリスナー
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getStatus') {
      sendResponse({
        enabled: CONFIG.enabled,
        convertedCount: document.querySelectorAll('.japan-time').length
      });
    } else if (request.action === 'refresh') {
      // 既存の日本時間表示を削除
      document.querySelectorAll('.japan-time').forEach(el => el.remove());
      // 時間変換を再実行
      const count = convertTimesInPage();
      sendResponse({ convertedCount: count });
    } else if (request.action === 'updateSettings') {
      CONFIG.enabled = request.enabled !== undefined ? request.enabled : CONFIG.enabled;
      CONFIG.debug = request.debug !== undefined ? request.debug : CONFIG.debug;
      
      if (CONFIG.enabled) {
        convertTimesInPage();
      } else {
        // 無効化時は日本時間表示を削除
        document.querySelectorAll('.japan-time').forEach(el => el.remove());
      }
      
      sendResponse({ success: true });
    }
    
    return true; // 非同期レスポンスを示す
  });

})();
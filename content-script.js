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
      'NRT': 0, 'HND': 0, 'KIX': 0, 'NGO': 0, 'FUK': 0, 'OKA': 0,
      
      // フィリピン（日本より1時間遅れ = -1時間）
      'MNL': -60, 'CEB': -60, 'DVO': -60, 'CRK': -60,
      
      // タイ（日本より2時間遅れ = -2時間）
      'BKK': -120, 'DMK': -120, 'HKT': -120, 'CNX': -120,
      
      // シンガポール・マレーシア（日本より1時間遅れ = -1時間）
      'SIN': -60, 'KUL': -60,
      
      // 中国・香港・台湾（日本より1時間遅れ = -1時間）
      'PEK': -60, 'PVG': -60, 'HKG': -60, 'TPE': -60,
      
      // 韓国（時差なし）
      'ICN': 0, 'GMP': 0, 'PUS': 0,
      
      // ベトナム（日本より2時間遅れ = -2時間）
      'SGN': -120, 'HAN': -120, 'DAD': -120,
      
      // インドネシア
      'CGK': -120, // ジャカルタ（日本より2時間遅れ）
      'DPS': -60,  // バリ（日本より1時間遅れ）
    };

    const offset = TIMEZONE_OFFSETS[airportCode];
    if (offset === undefined) {
      log(`Unknown airport code: ${airportCode}`);
      return null;
    }

    // 既に日本時間の空港は変換しない
    if (offset === 0) {
      log(`${airportCode} is already in JST`);
      return null;
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
              <div class="japan-time" style="font-size: 0.8em; color: #0066cc; font-weight: normal;">
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
              <div class="japan-time" style="font-size: 0.8em; color: #0066cc; font-weight: normal;">
                ${convertedTime}
              </div>
            `;
            convertedCount++;
            log(`Converted arrival: ${arrivalTime} → ${convertedTime} (${arrivalAirport})`);
          }
        }
      }
    });

    log(`Converted ${convertedCount} times`);
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
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

  // 時間を日本時間に変換する関数
  function convertToJapanTime(timeString, airportCode) {
    const timezone = AIRPORT_TIMEZONES[airportCode];
    if (!timezone) {
      log(`Unknown airport code: ${airportCode}`);
      return timeString;
    }

    const parsedTime = parseTimeString(timeString);
    if (!parsedTime) {
      log(`Could not parse time: ${timeString}`);
      return timeString;
    }

    try {
      // 現在の日付を使用（実際のフライト日付が必要な場合は別途取得）
      const today = new Date();
      const localTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 
                                parsedTime.hours, parsedTime.minutes);

      // 現地時間から日本時間への変換
      const japanTime = new Date(localTime.toLocaleString("en-US", {timeZone: timezone}));
      const japanTimeConverted = new Date(japanTime.getTime() + (japanTime.getTimezoneOffset() * 60000));
      
      // 日本時間として表示
      const japanTimeString = japanTimeConverted.toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      return `${japanTimeString} (JST)`;
    } catch (error) {
      log('Time conversion error:', error);
      return timeString;
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
          if (convertedTime !== departureTime && !departureTimeElement.querySelector('.japan-time')) {
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
          if (convertedTime !== arrivalTime && !arrivalTimeElement.querySelector('.japan-time')) {
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
// Popup script for Skyscanner Time Converter

document.addEventListener('DOMContentLoaded', function() {
  // DOM要素を取得
  const conversionStatus = document.getElementById('conversion-status');
  const convertedCount = document.getElementById('converted-count');
  const currentPage = document.getElementById('current-page');
  const enableToggle = document.getElementById('enable-toggle');
  const debugToggle = document.getElementById('debug-toggle');
  const refreshButton = document.getElementById('refresh-button');

  // 現在のタブの情報を取得
  function getCurrentTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        resolve(tabs[0]);
      });
    });
  }

  // コンテンツスクリプトにメッセージを送信
  function sendMessageToContent(message) {
    return new Promise((resolve) => {
      getCurrentTab().then(tab => {
        chrome.tabs.sendMessage(tab.id, message, (response) => {
          resolve(response);
        });
      });
    });
  }

  // 設定を保存
  function saveSettings() {
    const settings = {
      enabled: enableToggle.checked,
      debug: debugToggle.checked
    };
    chrome.storage.sync.set(settings);
  }

  // 設定を読み込み
  function loadSettings() {
    chrome.storage.sync.get(['enabled', 'debug'], function(result) {
      enableToggle.checked = result.enabled !== false; // デフォルトは有効
      debugToggle.checked = result.debug || false;
    });
  }

  // ページの状態を更新
  function updatePageStatus() {
    getCurrentTab().then(tab => {
      const url = tab.url;
      
      // スカイスキャナーのページかどうかチェック
      if (url.includes('skyscanner.jp') || url.includes('skyscanner.com')) {
        if (url.includes('/flights/')) {
          currentPage.textContent = 'スカイスキャナー';
          currentPage.style.color = '#0066cc';
          
          // コンテンツスクリプトの状態を取得
          sendMessageToContent({action: 'getStatus'}).then(response => {
            if (response) {
              conversionStatus.textContent = response.enabled ? '有効' : '無効';
              convertedCount.textContent = response.convertedCount || 0;
              conversionStatus.style.color = response.enabled ? '#28a745' : '#dc3545';
            } else {
              conversionStatus.textContent = '未読み込み';
              conversionStatus.style.color = '#ffc107';
            }
          });
        } else {
          currentPage.textContent = 'スカイスキャナー (フライト検索以外)';
          currentPage.style.color = '#ffc107';
          conversionStatus.textContent = '対象外';
          conversionStatus.style.color = '#6c757d';
        }
      } else {
        currentPage.textContent = '対象外のページ';
        currentPage.style.color = '#6c757d';
        conversionStatus.textContent = '対象外';
        conversionStatus.style.color = '#6c757d';
      }
    });
  }

  // 時間変換を再実行
  function refreshConversion() {
    refreshButton.textContent = '🔄 実行中...';
    refreshButton.disabled = true;
    
    sendMessageToContent({action: 'refresh'}).then(() => {
      setTimeout(() => {
        refreshButton.textContent = '🔄 時間変換を再実行';
        refreshButton.disabled = false;
        updatePageStatus();
      }, 1000);
    });
  }

  // イベントリスナー設定
  enableToggle.addEventListener('change', function() {
    saveSettings();
    sendMessageToContent({
      action: 'updateSettings',
      enabled: enableToggle.checked
    });
  });

  debugToggle.addEventListener('change', function() {
    saveSettings();
    sendMessageToContent({
      action: 'updateSettings',
      debug: debugToggle.checked
    });
  });

  refreshButton.addEventListener('click', refreshConversion);

  // 初期化
  loadSettings();
  updatePageStatus();
  
  // 5秒おきに状態を更新
  setInterval(updatePageStatus, 5000);
});
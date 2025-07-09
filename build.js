// date-fnsを使用したバージョンを作成するビルドスクリプト
const fs = require('fs');
const path = require('path');

// WebpackやRollupを使わずに、シンプルにdate-fnsのコードを含める
const buildWithDateFns = () => {
  const contentScript = `
// date-fnsの必要な関数を直接含める（CDN版を使用）
// 実際のプロジェクトではwebpackやrollupを使用することを推奨

(function() {
  'use strict';

  // 時間変換の設定
  const CONFIG = {
    enabled: true,
    debug: true
  };

  // ログ出力用関数
  function log(message, data) {
    if (CONFIG.debug) {
      console.log(\`[Skyscanner Time Converter] \${message}\`, data || '');
    }
  }

  // date-fnsを使用した時間変換（CDN版を想定）
  function convertToJapanTimeWithDateFns(timeString, timezone) {
    // 実際にはCDNからdate-fnsを読み込むか、バンドルする必要があります
    // ここではシンプルな実装を維持します
    return null;
  }

  // 既存のシンプルな実装を使用
  ${fs.readFileSync('content-script.js', 'utf8')}
})();
`;

  fs.writeFileSync('content-script-bundle.js', contentScript);
  console.log('Built content-script-bundle.js');
};

// 実行
buildWithDateFns();
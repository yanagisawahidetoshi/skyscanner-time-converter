# Skyscanner Time Converter

スカイスキャナーの検索結果の現地時間を日本時間（JST）に変換するChrome拡張機能です。

## 機能

- **検索結果ページ**: フライト一覧の出発時間・到着時間を自動で日本時間に変換
- **詳細ページ**: 詳細フライト情報の各セグメントの時間を日本時間に変換
- **対応範囲**: 世界中の主要空港の時間帯に対応
- **UI**: ポップアップUIで有効/無効の切り替え
- **デバッグ**: デバッグモードでコンソールログを表示

## 変換ルール

- **日本の空港（NRT、HND等）**: 何も表示されない（変換不要）
- **日本以外で同じ時間帯（DIL、韓国の空港等）**: `15:05 (JST同等)`
- **他の時間帯**: `20:05 (JST)` のように変換

## インストール方法

1. このリポジトリをダウンロードまたはクローン
   ```bash
   git clone https://github.com/yanagisawahidetoshi/skyscanner-time-converter.git
   ```

2. Chromeで `chrome://extensions/` を開く

3. 「デベロッパーモード」を有効にする

4. 「パッケージ化されていない拡張機能を読み込む」をクリック

5. ダウンロードしたフォルダを選択

## 使用方法

1. [スカイスキャナー](https://www.skyscanner.jp/) でフライトを検索
2. 検索結果ページで自動的に時間変換が実行される
3. 詳細ページでも各フライトセグメントの時間が変換される
4. 拡張機能のアイコンをクリックして設定を変更可能

## 対応空港

世界中の主要空港に対応しています：
- 日本（NRT、HND、KIX、NGO、FUK、OKA等）
- アジア（ICN、PEK、BKK、SIN、MNL、CEB等）
- ヨーロッパ（LHR、CDG、FRA、AMS等）
- 北米（JFK、LAX、SFO、ORD等）
- オセアニア（SYD、AKL等）
- その他世界各国の空港

## ファイル構成

```
skyscanner-time-converter/
├── manifest.json           # 拡張機能の設定
├── content-script.js       # メインの時間変換ロジック
├── airport-timezones.js    # 空港コードと時間帯のマッピング
├── popup.html             # ポップアップUI
├── popup.js               # ポップアップの制御
├── icon.svg               # アイコンファイル（SVG）
├── icon16.png             # 16x16 アイコン
├── icon48.png             # 48x48 アイコン
├── icon128.png            # 128x128 アイコン
├── LICENSE                # MITライセンス
└── README.md              # このファイル
```

## 開発

### デバッグ
1. 拡張機能のポップアップでデバッグモードを有効にする
2. ブラウザのデベロッパーツールのコンソールでログを確認

## ライセンス

MIT License

## 作者

[yanagisawahidetoshi](https://github.com/yanagisawahidetoshi)
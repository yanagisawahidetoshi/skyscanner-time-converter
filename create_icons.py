#!/usr/bin/env python3
"""
Chrome拡張機能用のアイコンファイルを作成するスクリプト
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    """指定されたサイズのアイコンを作成"""
    # 背景色 (青色)
    bg_color = (0, 102, 204)
    
    # 新しい画像を作成
    img = Image.new('RGBA', (size, size), bg_color + (255,))
    draw = ImageDraw.Draw(img)
    
    # 時計の円を描画
    center = size // 2
    radius = size // 3
    
    # 時計の外枠
    draw.ellipse([center - radius, center - radius, center + radius, center + radius], 
                 outline='white', width=max(1, size // 32))
    
    # 時計の針
    # 短針 (9時を指す)
    hand_length = radius * 0.6
    draw.line([center, center, center - hand_length, center], 
              fill='white', width=max(1, size // 16))
    
    # 長針 (12時を指す)
    hand_length = radius * 0.8
    draw.line([center, center, center, center - hand_length], 
              fill='white', width=max(1, size // 20))
    
    # 中心点
    dot_size = max(1, size // 16)
    draw.ellipse([center - dot_size, center - dot_size, center + dot_size, center + dot_size], 
                 fill='white')
    
    # JST テキスト (小さいサイズでは省略)
    if size >= 32:
        try:
            # システムフォントを使用
            font_size = max(8, size // 8)
            font = ImageFont.load_default()
            
            text = "JST"
            # テキストのバウンディングボックスを取得
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            # テキストを中央下部に配置
            text_x = center - text_width // 2
            text_y = center + radius // 2
            
            draw.text((text_x, text_y), text, fill='white', font=font)
        except:
            # フォントが利用できない場合はテキストを省略
            pass
    
    return img

def main():
    """メイン関数"""
    # アイコンサイズ
    sizes = [16, 48, 128]
    
    for size in sizes:
        icon = create_icon(size)
        filename = f"icon{size}.png"
        icon.save(filename)
        print(f"Created {filename}")

if __name__ == "__main__":
    main()
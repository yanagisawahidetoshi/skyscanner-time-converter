// 空港コードと時間帯のマッピングデータ
// 主要空港を中心に、地域別の時間帯を設定
const AIRPORT_TIMEZONES = {
  // 日本
  'NRT': 'Asia/Tokyo',
  'HND': 'Asia/Tokyo',
  'KIX': 'Asia/Tokyo',
  'NGO': 'Asia/Tokyo',
  'FUK': 'Asia/Tokyo',
  'OKA': 'Asia/Tokyo',
  
  // 韓国
  'ICN': 'Asia/Seoul',
  'GMP': 'Asia/Seoul',
  'PUS': 'Asia/Seoul',
  
  // 中国
  'PEK': 'Asia/Shanghai',
  'PVG': 'Asia/Shanghai',
  'CAN': 'Asia/Shanghai',
  'SZX': 'Asia/Shanghai',
  'HKG': 'Asia/Hong_Kong',
  'TPE': 'Asia/Taipei',
  
  // 東南アジア
  'SIN': 'Asia/Singapore',
  'BKK': 'Asia/Bangkok',
  'CGK': 'Asia/Jakarta',
  'MNL': 'Asia/Manila',
  'KUL': 'Asia/Kuala_Lumpur',
  'VIE': 'Asia/Ho_Chi_Minh',
  'SGN': 'Asia/Ho_Chi_Minh',
  'RGN': 'Asia/Yangon',
  
  // インド・南アジア
  'DEL': 'Asia/Kolkata',
  'BOM': 'Asia/Kolkata',
  'MAA': 'Asia/Kolkata',
  'BLR': 'Asia/Kolkata',
  'HYD': 'Asia/Kolkata',
  'CCU': 'Asia/Kolkata',
  'DAC': 'Asia/Dhaka',
  'KTM': 'Asia/Kathmandu',
  'CMB': 'Asia/Colombo',
  
  // 中東
  'DXB': 'Asia/Dubai',
  'AUH': 'Asia/Dubai',
  'DOH': 'Asia/Qatar',
  'KWI': 'Asia/Kuwait',
  'RUH': 'Asia/Riyadh',
  'JED': 'Asia/Riyadh',
  'TLV': 'Asia/Jerusalem',
  'CAI': 'Africa/Cairo',
  'IST': 'Europe/Istanbul',
  
  // ヨーロッパ
  'LHR': 'Europe/London',
  'LGW': 'Europe/London',
  'STN': 'Europe/London',
  'CDG': 'Europe/Paris',
  'ORY': 'Europe/Paris',
  'FRA': 'Europe/Berlin',
  'MUC': 'Europe/Berlin',
  'FCO': 'Europe/Rome',
  'BCN': 'Europe/Madrid',
  'MAD': 'Europe/Madrid',
  'AMS': 'Europe/Amsterdam',
  'BRU': 'Europe/Brussels',
  'ZUR': 'Europe/Zurich',
  'VIE': 'Europe/Vienna',
  'CPH': 'Europe/Copenhagen',
  'ARN': 'Europe/Stockholm',
  'HEL': 'Europe/Helsinki',
  'SVO': 'Europe/Moscow',
  'DME': 'Europe/Moscow',
  
  // 北米
  'JFK': 'America/New_York',
  'LGA': 'America/New_York',
  'EWR': 'America/New_York',
  'BOS': 'America/New_York',
  'DCA': 'America/New_York',
  'IAD': 'America/New_York',
  'PHL': 'America/New_York',
  'MIA': 'America/New_York',
  'ATL': 'America/New_York',
  'ORD': 'America/Chicago',
  'DFW': 'America/Chicago',
  'IAH': 'America/Chicago',
  'DEN': 'America/Denver',
  'LAX': 'America/Los_Angeles',
  'SFO': 'America/Los_Angeles',
  'SEA': 'America/Los_Angeles',
  'PDX': 'America/Los_Angeles',
  'LAS': 'America/Los_Angeles',
  'SAN': 'America/Los_Angeles',
  'YVR': 'America/Vancouver',
  'YYZ': 'America/Toronto',
  'YUL': 'America/Montreal',
  
  // 南米
  'GRU': 'America/Sao_Paulo',
  'GIG': 'America/Sao_Paulo',
  'EZE': 'America/Argentina/Buenos_Aires',
  'BOG': 'America/Bogota',
  'LIM': 'America/Lima',
  'SCL': 'America/Santiago',
  
  // オセアニア
  'SYD': 'Australia/Sydney',
  'MEL': 'Australia/Melbourne',
  'BNE': 'Australia/Brisbane',
  'PER': 'Australia/Perth',
  'AKL': 'Pacific/Auckland',
  'CHC': 'Pacific/Auckland',
  'NOU': 'Pacific/Noumea',
  'PPT': 'Pacific/Tahiti',
  'SUV': 'Pacific/Fiji',
  
  // アフリカ
  'JNB': 'Africa/Johannesburg',
  'CPT': 'Africa/Johannesburg',
  'ADD': 'Africa/Addis_Ababa',
  'NBO': 'Africa/Nairobi',
  'LOS': 'Africa/Lagos',
  'ALG': 'Africa/Algiers',
  'CAS': 'Africa/Casablanca',
  'TUN': 'Africa/Tunis',
  
  // フィリピン
  'CEB': 'Asia/Manila',
  'DVO': 'Asia/Manila',
  'ILO': 'Asia/Manila',
  'BCD': 'Asia/Manila',
  'TAG': 'Asia/Manila',
  'CRK': 'Asia/Manila',
  'GES': 'Asia/Manila',
  'LGP': 'Asia/Manila',
  'ZAM': 'Asia/Manila',
  'CDO': 'Asia/Manila',
  
  // 東京 (羽田) から セブ (セブ島) のルート用
  'TYOA': 'Asia/Tokyo', // 羽田
  'CEB': 'Asia/Manila'  // セブ
};

// 時間帯から日本時間への変換用関数
function convertToJapanTime(timeString, airportCode) {
  const timezone = AIRPORT_TIMEZONES[airportCode];
  if (!timezone) {
    console.warn(`Unknown airport code: ${airportCode}`);
    return timeString;
  }
  
  try {
    // 時間文字列をパース (例: "14:30" or "2:30 PM")
    const date = new Date();
    const [hours, minutes] = parseTimeString(timeString);
    
    // 現地時間として設定
    const localTime = new Date();
    localTime.setHours(hours, minutes, 0, 0);
    
    // 日本時間に変換
    const japanTime = convertTimezone(localTime, timezone, 'Asia/Tokyo');
    
    return formatTime(japanTime);
  } catch (error) {
    console.error('Time conversion error:', error);
    return timeString;
  }
}

function parseTimeString(timeString) {
  // "14:30" or "2:30 PM" の形式をパース
  const timeMatch = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!timeMatch) {
    throw new Error('Invalid time format');
  }
  
  let hours = parseInt(timeMatch[1]);
  const minutes = parseInt(timeMatch[2]);
  const ampm = timeMatch[3];
  
  if (ampm) {
    if (ampm.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
  }
  
  return [hours, minutes];
}

function convertTimezone(date, fromTimezone, toTimezone) {
  // 簡易的な時間帯変換（実際はIntl.DateTimeFormatを使用）
  const options = { 
    timeZone: toTimezone, 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  };
  
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const japanTimeString = formatter.format(date);
  
  return japanTimeString;
}

function formatTime(timeString) {
  return timeString; // 既にフォーマット済み
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AIRPORT_TIMEZONES, convertToJapanTime };
}
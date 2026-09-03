#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const INPUT = path.join(ROOT, 'docs', 'research', 'kanji-translated-1000-stage8-zhko.csv');
const OUTPUT = path.join(ROOT, 'docs', 'research', 'kanji-translated-1000-zh-vi-ne.csv');
const REVIEW = path.join(ROOT, 'docs', 'research', 'kanji-translated-1000-zh-vi-ne-review.md');

const VI = {
  one: 'một', two: 'hai', three: 'ba', four: 'bốn', five: 'năm', six: 'sáu', seven: 'bảy', eight: 'tám', nine: 'chín', ten: 'mười',
  hundred: 'trăm', thousand: 'nghìn', 'ten thousand': 'vạn', now: 'bây giờ', what: 'cái gì', minute: 'phút', time: 'thời gian',
  day: 'ngày', sun: 'mặt trời', moon: 'mặt trăng', year: 'năm', morning: 'buổi sáng', night: 'đêm', spring: 'mùa xuân', summer: 'mùa hè', autumn: 'mùa thu', winter: 'mùa đông',
  person: 'người', man: 'nam giới', woman: 'phụ nữ', child: 'trẻ em', mother: 'mẹ', father: 'cha', friend: 'bạn', family: 'gia đình',
  up: 'trên', down: 'dưới', middle: 'giữa', inside: 'bên trong', outside: 'bên ngoài', left: 'trái', right: 'phải', front: 'phía trước', before: 'trước', after: 'sau',
  east: 'đông', west: 'tây', south: 'nam', north: 'bắc', country: 'quốc gia', capital: 'thủ đô', city: 'thành phố', ward: 'quận', town: 'thị trấn', village: 'làng',
  mountain: 'núi', river: 'sông', sea: 'biển', sky: 'bầu trời', rain: 'mưa', snow: 'tuyết', wind: 'gió', cloud: 'mây', fire: 'lửa', water: 'nước', tree: 'cây', soil: 'đất', earth: 'đất',
  money: 'tiền', gold: 'vàng', silver: 'bạc', copper: 'đồng', iron: 'sắt', yen: 'yên', price: 'giá', value: 'giá trị', cost: 'chi phí',
  station: 'nhà ga', car: 'xe', road: 'đường', route: 'tuyến đường', traffic: 'giao thông', transport: 'vận chuyển', ship: 'tàu', airplane: 'máy bay', mail: 'bưu điện',
  enter: 'vào', exit: 'ra', go: 'đi', come: 'đến', return: 'trở về', leave: 'rời đi', walk: 'đi bộ', run: 'chạy', ride: 'đi xe', stop: 'dừng',
  read: 'đọc', write: 'viết', hear: 'nghe', see: 'nhìn', speak: 'nói', talk: 'nói chuyện', language: 'ngôn ngữ', word: 'từ', character: 'chữ', sentence: 'câu',
  study: 'học', school: 'trường học', teacher: 'giáo viên', student: 'học sinh', exam: 'kỳ thi', test: 'bài kiểm tra', question: 'câu hỏi', answer: 'trả lời',
  eat: 'ăn', drink: 'uống', buy: 'mua', sell: 'bán', shop: 'cửa hàng', meal: 'bữa ăn', rice: 'cơm', tea: 'trà', fish: 'cá', meat: 'thịt',
  house: 'nhà', room: 'phòng', door: 'cửa', gate: 'cổng', building: 'tòa nhà', company: 'công ty', office: 'văn phòng', institution: 'cơ quan',
  work: 'công việc', job: 'việc làm', duty: 'nhiệm vụ', service: 'dịch vụ', care: 'chăm sóc', health: 'sức khỏe', hospital: 'bệnh viện', doctor: 'bác sĩ', medicine: 'thuốc',
  live: 'sống', life: 'cuộc sống', birth: 'sinh', death: 'chết', rest: 'nghỉ', sleep: 'ngủ', wake: 'thức dậy',
  name: 'tên', number: 'số', sign: 'dấu hiệu', seal: 'con dấu', record: 'ghi chép', document: 'tài liệu', certificate: 'giấy chứng nhận',
  public: 'công cộng', private: 'riêng tư', government: 'chính phủ', law: 'luật', rule: 'quy tắc', system: 'hệ thống', tax: 'thuế', insurance: 'bảo hiểm',
  safe: 'an toàn', danger: 'nguy hiểm', disaster: 'thiên tai', warning: 'cảnh báo', prevent: 'phòng ngừa', avoid: 'tránh', protect: 'bảo vệ',
  big: 'lớn', large: 'lớn', small: 'nhỏ', high: 'cao', low: 'thấp', long: 'dài', short: 'ngắn', heavy: 'nặng', light: 'nhẹ', new: 'mới', old: 'cũ',
  white: 'trắng', black: 'đen', red: 'đỏ', blue: 'xanh', yellow: 'vàng', color: 'màu sắc',
  hand: 'tay', foot: 'chân', eye: 'mắt', ear: 'tai', mouth: 'miệng', head: 'đầu', face: 'mặt', body: 'cơ thể', heart: 'tim',
  power: 'sức mạnh', force: 'lực', ability: 'khả năng', skill: 'kỹ năng', mind: 'tâm trí', thought: 'suy nghĩ', feeling: 'cảm xúc',
  make: 'làm', create: 'tạo ra', use: 'sử dụng', change: 'thay đổi', open: 'mở', close: 'đóng', cut: 'cắt', connect: 'kết nối', separate: 'tách ra',
  start: 'bắt đầu', beginning: 'bắt đầu', end: 'kết thúc', complete: 'hoàn thành', continue: 'tiếp tục', again: 'lại',
  meet: 'gặp', help: 'giúp đỡ', send: 'gửi', receive: 'nhận', give: 'cho', take: 'lấy', borrow: 'mượn', lend: 'cho mượn',
  possible: 'có thể', decide: 'quyết định', know: 'biết', think: 'nghĩ', understand: 'hiểu', remember: 'nhớ', forget: 'quên',
  kind: 'loại', sort: 'loại', part: 'phần', group: 'nhóm', all: 'tất cả', every: 'mỗi', half: 'một nửa', many: 'nhiều', few: 'ít',
  god: 'thần', shrine: 'đền', temple: 'chùa', festival: 'lễ hội', beauty: 'vẻ đẹp', sound: 'âm thanh', music: 'âm nhạc',
  book: 'sách', electricity: 'điện', back: 'sau', english: 'tiếng Anh', noon: 'buổi trưa', ahead: 'phía trước', prefecture: 'tỉnh', metropolis: 'đô thị', spirit: 'tinh thần',
  reside: 'cư trú', stay: 'ở lại', resource: 'tài nguyên', status: 'tư cách', clear: 'rõ ràng', apply: 'nộp đơn', request: 'yêu cầu', place: 'nơi chốn', sex: 'giới tính',
  agency: 'cơ quan', account: 'tài khoản', contract: 'hợp đồng', promise: 'lời hứa', support: 'hỗ trợ', pay: 'trả tiền', fee: 'phí', free: 'miễn phí', none: 'không có',
  have: 'có', period: 'thời hạn', renew: 'gia hạn', notify: 'thông báo', pass: 'qua', confirm: 'xác nhận', recognize: 'công nhận', permit: 'cho phép',
  register: 'đăng ký', attach: 'đính kèm', submit: 'nộp', window: 'cửa sổ', mutual: 'lẫn nhau', consult: 'tư vấn', guide: 'hướng dẫn', note: 'ghi chú',
  attention: 'chú ý', prohibit: 'cấm', harm: 'tác hại', difficult: 'khó', report: 'báo cáo', extinguish: 'dập tắt', rescue: 'cứu hộ', urgent: 'khẩn cấp',
  illness: 'bệnh', inspect: 'kiểm tra', symptom: 'triệu chứng', condition: 'tình trạng', healthy: 'khỏe mạnh', feel: 'cảm thấy', infect: 'nhiễm', dye: 'nhuộm',
  line: 'đường dây', 'get off': 'xuống xe', port: 'cảng', aviation: 'hàng không', deliver: 'giao hàng', luggage: 'hành lý', thing: 'vật', home: 'nhà',
  rent: 'tiền thuê', manage: 'quản lý', reason: 'lý do', matter: 'vấn đề', self: 'bản thân', early: 'sớm', fun: 'vui', task: 'nhiệm vụ', business: 'kinh doanh',
  little: 'ít', much: 'nhiều', ancient: 'cổ xưa', not: 'không', method: 'phương pháp', circle: 'hình tròn', thread: 'sợi chỉ', king: 'vua', jewel: 'ngọc',
  ear: 'tai', base: 'nền tảng', standard: 'tiêu chuẩn', ratio: 'tỷ lệ', compare: 'so sánh', equipment: 'thiết bị', cloth: 'vải', wife: 'vợ', milk: 'sữa',
  brain: 'não', ceremony: 'nghi lễ', visit: 'thăm', translation: 'dịch', excellent: 'xuất sắc', desire: 'mong muốn', training: 'đào tạo', economy: 'kinh tế',
  politics: 'chính trị', society: 'xã hội', culture: 'văn hóa', industry: 'công nghiệp', agriculture: 'nông nghiệp', education: 'giáo dục', environment: 'môi trường',
  problem: 'vấn đề', result: 'kết quả', plan: 'kế hoạch', relation: 'quan hệ', connection: 'kết nối', responsibility: 'trách nhiệm', right: 'quyền lợi',
  obligation: 'nghĩa vụ', agreement: 'thỏa thuận', address: 'địa chỉ', residence: 'nơi cư trú', card: 'thẻ', visa: 'thị thực', nationality: 'quốc tịch',
  citizen: 'công dân', police: 'cảnh sát', fireman: 'lính cứu hỏa', bank: 'ngân hàng', savings: 'tiết kiệm', loan: 'khoản vay', freight: 'hàng hóa',
  goods: 'hàng hóa', trade: 'thương mại', tax: 'thuế', invoice: 'hóa đơn', salary: 'lương', employment: 'việc làm', hire: 'thuê', labor: 'lao động',
  accident: 'tai nạn', crime: 'tội phạm', penalty: 'hình phạt', court: 'tòa án', judge: 'thẩm phán', proof: 'bằng chứng', verification: 'xác minh',
  license: 'giấy phép', schoolhouse: 'trường học', class: 'lớp học', lesson: 'bài học', practice: 'luyện tập', memory: 'trí nhớ', meaning: 'nghĩa',
};

const NE = {
  one: 'एक', two: 'दुई', three: 'तीन', four: 'चार', five: 'पाँच', six: 'छ', seven: 'सात', eight: 'आठ', nine: 'नौ', ten: 'दश',
  hundred: 'सय', thousand: 'हजार', 'ten thousand': 'दस हजार', now: 'अहिले', what: 'के', minute: 'मिनेट', time: 'समय',
  day: 'दिन', sun: 'सूर्य', moon: 'चन्द्रमा', year: 'वर्ष', morning: 'बिहान', night: 'रात', spring: 'वसन्त', summer: 'गर्मी', autumn: 'शरद', winter: 'जाडो',
  person: 'मानिस', man: 'पुरुष', woman: 'महिला', child: 'बालक', mother: 'आमा', father: 'बुबा', friend: 'साथी', family: 'परिवार',
  up: 'माथि', down: 'तल', middle: 'बीच', inside: 'भित्र', outside: 'बाहिर', left: 'बायाँ', right: 'दायाँ', front: 'अगाडि', before: 'पहिले', after: 'पछि',
  east: 'पूर्व', west: 'पश्चिम', south: 'दक्षिण', north: 'उत्तर', country: 'देश', capital: 'राजधानी', city: 'सहर', ward: 'वडा', town: 'नगर', village: 'गाउँ',
  mountain: 'हिमाल', river: 'नदी', sea: 'समुद्र', sky: 'आकाश', rain: 'वर्षा', snow: 'हिउँ', wind: 'हावा', cloud: 'बादल', fire: 'आगो', water: 'पानी', tree: 'रुख', soil: 'माटो', earth: 'पृथ्वी',
  money: 'पैसा', gold: 'सुन', silver: 'चाँदी', copper: 'तामा', iron: 'फलाम', yen: 'येन', price: 'मूल्य', value: 'मूल्य', cost: 'लागत',
  station: 'स्टेशन', car: 'गाडी', road: 'सडक', route: 'मार्ग', traffic: 'यातायात', transport: 'ढुवानी', ship: 'जहाज', airplane: 'विमान', mail: 'हुलाक',
  enter: 'प्रवेश', exit: 'बाहिर निस्कनु', go: 'जानु', come: 'आउनु', return: 'फर्कनु', leave: 'छोड्नु', walk: 'हिँड्नु', run: 'दौडनु', ride: 'चढ्नु', stop: 'रोक्नु',
  read: 'पढ्नु', write: 'लेख्नु', hear: 'सुन्नु', see: 'हेर्नु', speak: 'बोल्नु', talk: 'कुरा गर्नु', language: 'भाषा', word: 'शब्द', character: 'अक्षर', sentence: 'वाक्य',
  study: 'अध्ययन', school: 'विद्यालय', teacher: 'शिक्षक', student: 'विद्यार्थी', exam: 'परीक्षा', test: 'परीक्षा', question: 'प्रश्न', answer: 'उत्तर',
  eat: 'खानु', drink: 'पिउनु', buy: 'किन्नु', sell: 'बेच्नु', shop: 'पसल', meal: 'भोजन', rice: 'भात', tea: 'चिया', fish: 'माछा', meat: 'मासु',
  house: 'घर', room: 'कोठा', door: 'ढोका', gate: 'गेट', building: 'भवन', company: 'कम्पनी', office: 'कार्यालय', institution: 'संस्था',
  work: 'काम', job: 'काम', duty: 'कर्तव्य', service: 'सेवा', care: 'हेरचाह', health: 'स्वास्थ्य', hospital: 'अस्पताल', doctor: 'डाक्टर', medicine: 'औषधि',
  live: 'बस्नु', life: 'जीवन', birth: 'जन्म', death: 'मृत्यु', rest: 'आराम', sleep: 'सुत्नु', wake: 'उठ्नु',
  name: 'नाम', number: 'संख्या', sign: 'चिन्ह', seal: 'छाप', record: 'रेकर्ड', document: 'कागजात', certificate: 'प्रमाणपत्र',
  public: 'सार्वजनिक', private: 'निजी', government: 'सरकार', law: 'कानुन', rule: 'नियम', system: 'प्रणाली', tax: 'कर', insurance: 'बीमा',
  safe: 'सुरक्षित', danger: 'खतरा', disaster: 'विपद्', warning: 'चेतावनी', prevent: 'रोकथाम', avoid: 'जोगिनु', protect: 'सुरक्षा',
  big: 'ठूलो', large: 'ठूलो', small: 'सानो', high: 'उच्च', low: 'कम', long: 'लामो', short: 'छोटो', heavy: 'भारी', light: 'हल्का', new: 'नयाँ', old: 'पुरानो',
  white: 'सेतो', black: 'कालो', red: 'रातो', blue: 'नीलो', yellow: 'पहेंलो', color: 'रङ',
  hand: 'हात', foot: 'खुट्टा', eye: 'आँखा', ear: 'कान', mouth: 'मुख', head: 'टाउको', face: 'अनुहार', body: 'शरीर', heart: 'मन',
  power: 'शक्ति', force: 'बल', ability: 'क्षमता', skill: 'सीप', mind: 'मन', thought: 'विचार', feeling: 'भावना',
  make: 'बनाउनु', create: 'सिर्जना', use: 'प्रयोग', change: 'परिवर्तन', open: 'खोल्नु', close: 'बन्द', cut: 'काट्नु', connect: 'जोड्नु', separate: 'अलग',
  start: 'सुरु', beginning: 'सुरुवात', end: 'अन्त्य', complete: 'पूरा', continue: 'जारी', again: 'फेरि',
  meet: 'भेट्नु', help: 'मद्दत', send: 'पठाउनु', receive: 'प्राप्त', give: 'दिनु', take: 'लिनु', borrow: 'सापटी लिनु', lend: 'सापटी दिनु',
  possible: 'सम्भव', decide: 'निर्णय', know: 'थाहा', think: 'सोच्नु', understand: 'बुझ्नु', remember: 'सम्झनु', forget: 'बिर्सनु',
  kind: 'प्रकार', sort: 'प्रकार', part: 'भाग', group: 'समूह', all: 'सबै', every: 'हरेक', half: 'आधा', many: 'धेरै', few: 'थोरै',
  god: 'देवता', shrine: 'मन्दिर', temple: 'मन्दिर', festival: 'चाड', beauty: 'सुन्दरता', sound: 'ध्वनि', music: 'संगीत',
  book: 'किताब', electricity: 'बिजुली', back: 'पछाडि', english: 'अंग्रेजी', noon: 'दिउँसो', ahead: 'अगाडि', prefecture: 'प्रान्त', metropolis: 'महानगर', spirit: 'आत्मा',
  reside: 'बसोबास', stay: 'बस्नु', resource: 'स्रोत', status: 'स्थिति', clear: 'स्पष्ट', apply: 'आवेदन', request: 'अनुरोध', place: 'स्थान', sex: 'लिङ्ग',
  agency: 'निकाय', account: 'खाता', contract: 'सम्झौता', promise: 'प्रतिज्ञा', support: 'समर्थन', pay: 'भुक्तानी', fee: 'शुल्क', free: 'निःशुल्क', none: 'छैन',
  have: 'हुनु', period: 'अवधि', renew: 'नवीकरण', notify: 'सूचना', pass: 'पास', confirm: 'पुष्टि', recognize: 'मान्यता', permit: 'अनुमति',
  register: 'दर्ता', attach: 'संलग्न', submit: 'पेश', window: 'झ्याल', mutual: 'आपसी', consult: 'परामर्श', guide: 'मार्गदर्शन', note: 'टिप्पणी',
  attention: 'ध्यान', prohibit: 'निषेध', harm: 'हानि', difficult: 'कठिन', report: 'प्रतिवेदन', extinguish: 'निभाउनु', rescue: 'उद्धार', urgent: 'जरुरी',
  illness: 'रोग', inspect: 'निरीक्षण', symptom: 'लक्षण', condition: 'अवस्था', healthy: 'स्वस्थ', feel: 'महसुस', infect: 'संक्रमण', dye: 'रङ लगाउनु',
  line: 'रेखा', 'get off': 'ओर्लनु', port: 'बन्दरगाह', aviation: 'उड्डयन', deliver: 'वितरण', luggage: 'सामान', thing: 'वस्तु', home: 'घर',
  rent: 'भाडा', manage: 'व्यवस्थापन', reason: 'कारण', matter: 'मामिला', self: 'आफू', early: 'चाँडो', fun: 'रमाइलो', task: 'कार्य', business: 'व्यवसाय',
  little: 'थोरै', much: 'धेरै', ancient: 'प्राचीन', not: 'होइन', method: 'विधि', circle: 'वृत्त', thread: 'धागो', king: 'राजा', jewel: 'रत्न',
  ear: 'कान', base: 'आधार', standard: 'मापदण्ड', ratio: 'अनुपात', compare: 'तुलना', equipment: 'उपकरण', cloth: 'कपडा', wife: 'श्रीमती', milk: 'दूध',
  brain: 'मस्तिष्क', ceremony: 'समारोह', visit: 'भ्रमण', translation: 'अनुवाद', excellent: 'उत्कृष्ट', desire: 'इच्छा', training: 'तालिम', economy: 'अर्थतन्त्र',
  politics: 'राजनीति', society: 'समाज', culture: 'संस्कृति', industry: 'उद्योग', agriculture: 'कृषि', education: 'शिक्षा', environment: 'वातावरण',
  problem: 'समस्या', result: 'नतिजा', plan: 'योजना', relation: 'सम्बन्ध', connection: 'जडान', responsibility: 'जिम्मेवारी', right: 'अधिकार',
  obligation: 'दायित्व', agreement: 'सहमति', address: 'ठेगाना', residence: 'निवास', card: 'कार्ड', visa: 'भिसा', nationality: 'राष्ट्रियता',
  citizen: 'नागरिक', police: 'प्रहरी', fireman: 'दमकलकर्मी', bank: 'बैंक', savings: 'बचत', loan: 'ऋण', freight: 'मालसामान',
  goods: 'सामान', trade: 'व्यापार', invoice: 'बिल', salary: 'तलब', employment: 'रोजगारी', hire: 'भाडामा लिनु', labor: 'श्रम',
  accident: 'दुर्घटना', crime: 'अपराध', penalty: 'जरिवाना', court: 'अदालत', judge: 'न्यायाधीश', proof: 'प्रमाण', verification: 'प्रमाणीकरण',
  license: 'अनुमतिपत्र', schoolhouse: 'विद्यालय', class: 'कक्षा', lesson: 'पाठ', practice: 'अभ्यास', memory: 'स्मृति', meaning: 'अर्थ',
};

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], n = text[i + 1];
    if (q) {
      if (ch === '"' && n === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (ch !== '\r') cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function csvCell(value) {
  const s = String(value ?? '');
  if (/[",\r\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function normalizeTerm(raw) {
  return String(raw ?? '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/\*\*/g, '')
    .replace(/\bthe\b/g, '')
    .replace(/\ban\b/g, '')
    .replace(/\ba\b/g, '')
    .replace(/[^a-z0-9 /-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function translateMeaning(en, dict, fallback) {
  const normalized = normalizeTerm(en);
  if (!normalized) return fallback;
  if (dict[normalized]) return dict[normalized];

  const parts = normalized
    .split(/[\/,;-]/)
    .map((x) => x.trim())
    .filter(Boolean);
  for (const part of parts) {
    if (dict[part]) return dict[part];
  }

  const words = normalized.split(' ').filter(Boolean);
  const translated = words.map((word) => dict[word]).filter(Boolean);
  if (translated.length) return [...new Set(translated)].slice(0, 2).join(' / ');
  return fallback;
}

async function main() {
  const rows = parseCsv(await fs.readFile(INPUT, 'utf8'));
  const header = rows[0];
  const ix = Object.fromEntries(header.map((x, i) => [x, i]));
  const out = [['char', 'reading', 'jaMeaning', 'en', 'zh', 'ko', 'vi', 'ne']];
  const fallbackRows = [];

  for (const [i, row] of rows.slice(1).entries()) {
    const en = row[ix.en] || row[ix.jaMeaning] || row[ix.char];
    const vi = translateMeaning(en, VI, 'khái niệm');
    const ne = translateMeaning(en, NE, 'अर्थ');
    if (vi === 'khái niệm' || ne === 'अर्थ') {
      fallbackRows.push({ row: i + 2, char: row[ix.char], en, vi, ne });
    }
    out.push([
      row[ix.char],
      row[ix.reading],
      row[ix.jaMeaning],
      row[ix.en],
      row[ix.zhCN],
      row[ix.ko],
      vi,
      ne
    ]);
  }

  await fs.writeFile(OUTPUT, out.map((r) => r.map(csvCell).join(',')).join('\n') + '\n', 'utf8');
  await fs.writeFile(REVIEW, [
    '# Vietnamese/Nepali Translation Expansion Review',
    '',
    `Source: ${path.relative(ROOT, INPUT)}`,
    `Output: ${path.relative(ROOT, OUTPUT)}`,
    `Rows using fallback meanings: ${fallbackRows.length}`,
    '',
    'Fallback rows are not blockers by themselves, but they should be reviewed when improving semantic quality.',
    '',
    ...fallbackRows.slice(0, 200).map((r) => `- row ${r.row}: ${r.char} / ${r.en} -> vi=${r.vi}, ne=${r.ne}`)
  ].join('\n') + '\n', 'utf8');

  console.log(JSON.stringify({ output: OUTPUT, rows: out.length - 1, fallbackRows: fallbackRows.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

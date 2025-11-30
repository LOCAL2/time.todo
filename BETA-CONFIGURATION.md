# 🚀 Beta Configuration Guide

## การตั้งค่า Beta Badge และ Banner

ระบบนี้ใช้ **environment variables** และ **config file** ในการจัดการสถานะ Beta โดยไม่ต้อง hardcode

---

## 📁 ไฟล์ที่เกี่ยวข้อง

### 1. **src/config/app.ts** - Configuration File
ไฟล์หลักสำหรับตั้งค่าแอป รวมถึงสถานะ Beta

```typescript
export const appConfig = {
  version: '1.0.0',
  stage: 'beta',  // 'beta', 'alpha', 'stable', 'dev'
  showBetaBadge: true,
  appName: 'Priority Queue Board',
  beta: {
    feedbackUrl: 'https://forms.gle/your-feedback-form',
    showFeedbackButton: true,
    bannerMessage: 'เวอร์ชัน Beta - ช่วยเราปรับปรุงด้วยการแชร์ความคิดเห็น',
  },
}
```

### 2. **.env** - Environment Variables
ตั้งค่าผ่าน environment variables (ไม่ต้อง commit ไฟล์นี้)

```env
VITE_APP_VERSION=1.0.0
VITE_APP_STAGE=beta
VITE_SHOW_BETA_BADGE=true
VITE_FEEDBACK_URL=https://forms.gle/your-feedback-form
```

### 3. **Components**
- `src/components/common/BetaBadge.tsx` - Badge component
- `src/components/common/BetaBanner.tsx` - Top banner component

---

## 🎯 วิธีใช้งาน

### แสดง Beta Badge/Banner

#### Option 1: ใช้ Environment Variables (แนะนำ)
```env
# .env
VITE_APP_STAGE=beta
VITE_SHOW_BETA_BADGE=true
```

#### Option 2: แก้ไข Config File
```typescript
// src/config/app.ts
export const appConfig = {
  stage: 'beta',
  showBetaBadge: true,
}
```

### ซ่อน Beta Badge/Banner

#### Option 1: ปิดผ่าน Environment Variable
```env
# .env
VITE_SHOW_BETA_BADGE=false
```

#### Option 2: เปลี่ยนสถานะเป็น Stable
```env
# .env
VITE_APP_STAGE=stable
```

---

## 🎨 Components

### 1. BetaBadge
แสดง badge ขนาดเล็กหรือแบบเต็ม

```tsx
import { BetaBadge } from './components/common/BetaBadge';

// Compact version (แค่ badge)
<BetaBadge variant="compact" />

// Full version (มีข้อความและปุ่ม feedback)
<BetaBadge variant="full" showFeedback={true} />
```

**ตำแหน่งที่ใช้:**
- Sidebar header (full version)

### 2. BetaBanner
แสดง banner ด้านบนสุดของหน้าเว็บ

```tsx
import { BetaBanner } from './components/common/BetaBanner';

<BetaBanner />
```

**Features:**
- ✅ แสดงข้อความ Beta
- ✅ ปุ่ม Feedback (เปิด URL ใหม่)
- ✅ ปุ่มปิด (บันทึกใน localStorage)
- ✅ Animated background (shimmer effect)
- ✅ Responsive design

**ตำแหน่งที่ใช้:**
- App.tsx (ด้านบนสุด)

---

## 🔧 การปรับแต่ง

### เปลี่ยนข้อความ Banner
```typescript
// src/config/app.ts
beta: {
  bannerMessage: 'ข้อความที่คุณต้องการ',
}
```

### เปลี่ยน Feedback URL
```env
# .env
VITE_FEEDBACK_URL=https://your-feedback-form-url
```

หรือ

```typescript
// src/config/app.ts
beta: {
  feedbackUrl: 'https://your-feedback-form-url',
}
```

### ซ่อนปุ่ม Feedback
```typescript
// src/config/app.ts
beta: {
  showFeedbackButton: false,
}
```

### เปลี่ยนชื่อแอป
```typescript
// src/config/app.ts
appName: 'ชื่อแอปของคุณ',
```

---

## 🎭 Stages ที่รองรับ

```typescript
stage: 'beta'    // แสดง Beta badge (สีม่วง-ชมพู)
stage: 'alpha'   // แสดง Alpha badge (สีแดง)
stage: 'dev'     // แสดง Dev badge (สีเหลือง)
stage: 'stable'  // ไม่แสดง badge
```

---

## 📦 Deployment

### Development
```bash
# ใช้ .env.development
VITE_APP_STAGE=dev
VITE_SHOW_BETA_BADGE=true
```

### Staging/Beta
```bash
# ใช้ .env.staging
VITE_APP_STAGE=beta
VITE_SHOW_BETA_BADGE=true
VITE_FEEDBACK_URL=https://forms.gle/beta-feedback
```

### Production
```bash
# ใช้ .env.production
VITE_APP_STAGE=stable
VITE_SHOW_BETA_BADGE=false
```

---

## 🎨 Styling

### Colors
- **Beta:** Purple to Pink gradient (`from-purple-600 to-pink-600`)
- **Alpha:** Red gradient
- **Dev:** Yellow gradient

### Animations
- **Pulse:** Badge มีการ pulse
- **Shimmer:** Banner มี shimmer effect
- **Slide:** Toast-style animations

---

## 🧪 Testing

### ทดสอบ Beta Mode
1. ตั้งค่า `VITE_APP_STAGE=beta`
2. Refresh หน้าเว็บ
3. ควรเห็น:
   - Beta banner ด้านบน
   - Beta badge ใน Sidebar
   - ปุ่ม Feedback

### ทดสอบ Stable Mode
1. ตั้งค่า `VITE_APP_STAGE=stable`
2. Refresh หน้าเว็บ
3. ไม่ควรเห็น Beta badge/banner

---

## 📱 Responsive Design

- **Desktop:** แสดงข้อความเต็ม + ปุ่ม Feedback
- **Tablet:** แสดงข้อความย่อ + ปุ่ม Feedback
- **Mobile:** แสดงข้อความย่อ + icon เท่านั้น

---

## 💡 Tips

1. **ใช้ Environment Variables** สำหรับ deployment ต่างๆ
2. **ไม่ต้อง commit .env** ให้ใช้ .env.example แทน
3. **User สามารถปิด Banner ได้** (บันทึกใน localStorage)
4. **Feedback URL** ควรเป็น Google Forms หรือ Typeform
5. **Version number** ควร sync กับ package.json

---

## 🚀 Quick Start

1. Copy `.env.example` เป็น `.env`
2. ตั้งค่า `VITE_APP_STAGE=beta`
3. ตั้งค่า `VITE_FEEDBACK_URL` ของคุณ
4. Run `npm run dev`
5. เห็น Beta badge/banner แล้ว!

---

## 📞 Support

ถ้ามีปัญหาหรือต้องการปรับแต่งเพิ่มเติม:
1. ดูที่ `src/config/app.ts`
2. อ่าน comments ในโค้ด
3. ทดสอบด้วย environment variables ต่างๆ

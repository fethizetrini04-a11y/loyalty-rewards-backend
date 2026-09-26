#!/bin/bash

# ألوان للطباعة
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="http://localhost:5000/api"

echo -e "${BLUE}========== اختبار API ==========${NC}\n"

# 1. اختبار الصحة
echo -e "${BLUE}1️⃣  اختبار صحة الخادم...${NC}"
curl -s $API_URL/health | jq .
echo ""

# 2. تسجيل متجر جديد
echo -e "${BLUE}2️⃣  تسجيل متجر جديد...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "store_name": "متجر الاختبار",
    "email": "test@example.com",
    "password": "test123456",
    "phone": "0501234567"
  }')

echo $REGISTER_RESPONSE | jq .

# استخراج Token
TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.token')
STORE_ID=$(echo $REGISTER_RESPONSE | jq -r '.store.id')

echo -e "\n${GREEN}✅ Token: $TOKEN${NC}\n"

# 3. الحصول على بيانات المتجر
echo -e "${BLUE}3️⃣  الحصول على بيانات المتجر...${NC}"
curl -s -X GET $API_URL/store/profile \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 4. إضافة عميل
echo -e "${BLUE}4️⃣  إضافة عميل جديد...${NC}"
CUSTOMER_RESPONSE=$(curl -s -X POST $API_URL/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0509876543",
    "email": "customer@example.com",
    "name": "أحمد محمد"
  }')

echo $CUSTOMER_RESPONSE | jq .
CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | jq -r '.customer.id')

echo ""

# 5. إضافة كوبون
echo -e "${BLUE}5️⃣  إضافة كوبون...${NC}"
COUPON_RESPONSE=$(curl -s -X POST $API_URL/coupons \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "خصم 20% على كل المشتريات",
    "description": "كوبون خصم خاص للعملاء الوفيين",
    "discount_type": "percentage",
    "discount_value": 20,
    "points_required": 100,
    "max_uses": 50
  }')

echo $COUPON_RESPONSE | jq .
COUPON_ID=$(echo $COUPON_RESPONSE | jq -r '.coupon.id')

echo ""

# 6. منح نقاط للعميل
echo -e "${BLUE}6️⃣  منح نقاط للعميل...${NC}"
curl -s -X POST $API_URL/points/add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer_id\": $CUSTOMER_ID,
    \"points_amount\": 150,
    \"description\": \"شراء بقيمة 750 ريال\"
  }" | jq .

echo ""

# 7. إحصائيات المتجر
echo -e "${BLUE}7️⃣  إحصائيات المتجر...${NC}"
curl -s -X GET $API_URL/store/stats \
  -H "Authorization: Bearer $TOKEN" | jq .

echo ""
echo -e "${GREEN}✅ انتهى الاختبار!${NC}"
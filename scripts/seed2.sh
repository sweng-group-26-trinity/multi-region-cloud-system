#!/usr/bin/env bash
set -e

API_URL="http://localhost:8080/api"

# --- Admin login ---
echo "[INFO] Logging in as admin..."
ADMIN_TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin_user","password":"Admin1234!"}' | jq -r '.accessToken')

if [ -z "$ADMIN_TOKEN" ]; then
  echo "[ERROR] Failed to acquire admin token."
  exit 1
fi

echo "[OK] Admin token acquired."

# --- Restaurants ---
echo "[INFO] Creating restaurants..."
declare -A RESTAURANTS=(
  ["Napoli Pizza Co."]="Italian"
  ["The Burgery"]="American"
  ["Sakura Sushi"]="Japanese"
)

declare -A REST_IDS

for name in "${!RESTAURANTS[@]}"; do
  resp=$(curl -s -X POST "$API_URL/restaurants" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$name\",\"address\":\"1 Main St\",\"cuisineType\":\"${RESTAURANTS[$name]}\",\"openingHours\":\"9-22\"}")
  id=$(echo "$resp" | jq -r '.id')
  REST_IDS[$name]=$id
  echo "[OK] Created restaurant '$name' with ID $id"
done

# --- Menu items ---
echo "[INFO] Creating menu items..."
declare -A MENU_ITEMS
MENU_ITEMS["Napoli Pizza Co."]="Margherita Pepperoni Feast Tiramisu Sparkling Lemonade"
MENU_ITEMS["The Burgery"]="Classic Smash Burger Crispy Chicken Burger Loaded Fries Vanilla Shake"
MENU_ITEMS["Sakura Sushi"]="Salmon Nigiri (6 pcs) Dragon Roll (8 pcs) Miso Soup Matcha Ice Cream"

for restaurant in "${!MENU_ITEMS[@]}"; do
  echo "[INFO] ${restaurant} menu"
  id=${REST_IDS[$restaurant]}
  for item in ${MENU_ITEMS[$restaurant]}; do
    resp=$(curl -s -X POST "$API_URL/restaurants/$id/menu" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"$item\",\"category\":\"Main\",\"price\":10.0}")
    if [ "$(echo "$resp" | jq -r '.id?')" ]; then
      echo "[OK] Created menu item '$item'"
    else
      echo "[WARN] Failed to create menu item '$item'"
    fi
  done
done

# --- Orders ---
echo "[INFO] Creating orders..."
# Example: customer_one orders Margherita from Napoli Pizza Co.
CUSTOMER_TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"customer_one","password":"Customer123!"}' | jq -r '.accessToken')

PIZZA_REST_ID=${REST_IDS["Napoli Pizza Co."]}
PIZZA_ITEM_ID=$(curl -s "$API_URL/restaurants/$PIZZA_REST_ID/menu" | jq -r '.data[0].id')

curl -s -X POST "$API_URL/orders" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"restaurantId\":\"$PIZZA_REST_ID\",
    \"items\":[{\"itemId\":\"$PIZZA_ITEM_ID\",\"quantity\":2}],
    \"customerName\":\"Customer One\",
    \"customerEmail\":\"customer_one@test.com\"
  }" | jq

echo "[INFO] Database seeding completed."

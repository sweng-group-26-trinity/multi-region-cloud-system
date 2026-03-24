#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080/api}"

# ── Colours ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
info() { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*" >&2; }
die() {
  echo -e "${RED}[ERROR]${NC} $*" >&2
  exit 1
}

require() { command -v "$1" &>/dev/null || die "'$1' is required but not installed."; }
require curl
require jq

# ── HTTP helpers ───────────────────────────────────────────────────────────────
post() {
  local path="$1" body="$2" token="${3:-}"
  local auth_header=()
  [[ -n $token ]] && auth_header=(-H "Authorization: Bearer $token")
  curl -s -X POST "$BASE_URL$path" -H "Content-Type: application/json" "${auth_header[@]}" -d "$body"
}

put() {
  local path="$1" body="$2" token="$3"
  curl -s -X PUT "$BASE_URL$path" -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d "$body"
}

extract() { echo "$1" | jq -r "$2"; }

# ── Login & registration ──────────────────────────────────────────────────────
login() {
  local identifier="$1" password="$2"
  local resp
  resp=$(post "/auth/login" "{\"identifier\":\"$identifier\",\"password\":\"$password\"}")
  local token
  token=$(extract "$resp" '.accessToken // empty')
  [[ -z $token ]] && die "Login failed for '$identifier': $(extract "$resp" '.message // .')"
  echo "$token"
}

register() {
  local username="$1" email="$2" password="$3" first="$4" last="$5"
  local resp
  resp=$(post "/auth/register" \
    "{\"username\":\"$username\",\"email\":\"$email\",\"password\":\"$password\",\"firstName\":\"$first\",\"lastName\":\"$last\"}")
  local id
  id=$(extract "$resp" '.id // empty')
  if [[ -z $id ]]; then
    warn "register '$username': $(extract "$resp" '.message // .')"
  else
    success "Registered user '$username' ($id)"
  fi
}

# ── Create restaurant ──────────────────────────────────────────────────────────
create_restaurant() {
  local name="$1" cuisine="$2" image="$3"
  local resp
  resp=$(post "/restaurants" \
    "$(jq -n \
      --arg name "$name" \
      --arg description "Best $cuisine food" \
      --arg address "1 Main St" \
      --arg phone "123456789" \
      --arg email "test@test.com" \
      --arg cuisineType "$cuisine" \
      --arg openingHours "9-22" \
      --arg image "$image" \
      '{
         name: $name,
         description: $description,
         address: $address,
         phone: $phone,
         email: $email,
         cuisineType: $cuisineType,
         openingHours: $openingHours,
         imageUrl: $image,
         logoUrl: $image
       }')" "$ADMIN_TOKEN")
  local id
  id=$(extract "$resp" '.id // empty')
  [[ -z $id ]] && {
    warn "Failed to create restaurant '$name': $(echo "$resp" | jq .)"
    return
  }
  success "Created restaurant '$name' ($id)"
  echo "$id"
}

# ── Seed menu item ─────────────────────────────────────────────────────────────
seed_menu_item() {
  local restaurant_id="$1" name="$2" category="$3" price="$4" desc="$5" image="$6"
  local resp
  resp=$(curl -s -X POST "$BASE_URL/restaurants/$restaurant_id/menu" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
      --arg name "$name" \
      --arg desc "$desc" \
      --arg category "$category" \
      --argjson price "$price" \
      --arg image "$image" \
      --argjson available true \
      '{
              name: $name,
              description: $desc,
              category: $category,
              price: $price,
              imageUrl: $image,
              isAvailable: $available
            }')")
  local id
  id=$(extract "$resp" '.id // empty')
  [[ -z $id ]] && {
    warn "Failed to create menu item '$name': $(echo "$resp" | jq .)"
    return
  }
  success "  MenuItem '$name' ($id)"
  echo "$id"
}

# ── Assets ────────────────────────────────────────────────────────────────────
IMG_DIR="$(pwd)/assets"
declare -A MENU_IMAGES=(
  ["Margherita"]="$IMG_DIR/Pizza.webp"
  ["Pepperoni Feast"]="$IMG_DIR/Pizza.webp"
  ["Tiramisu"]="$IMG_DIR/Tiramisu.webp"
  ["Sparkling Lemonade"]="$IMG_DIR/OrangeJuice.webp"
  ["Classic Smash Burger"]="$IMG_DIR/Burger.webp"
  ["Crispy Chicken Burger"]="$IMG_DIR/Burger.webp"
  ["Loaded Fries"]="$IMG_DIR/Chips.webp"
  ["Vanilla Shake"]="$IMG_DIR/Milkshake.webp"
  ["Salmon Nigiri (6 pcs)"]="$IMG_DIR/Sushi.webp"
  ["Dragon Roll (8 pcs)"]="$IMG_DIR/Sushi.webp"
  ["Miso Soup"]="$IMG_DIR/Soup.webp"
  ["Matcha Ice Cream"]="$IMG_DIR/IceCream.webp"
)

# ── Begin seeding ─────────────────────────────────────────────────────────────
info "=== Seeding database against $BASE_URL ==="

# 1. Users
info "--- Users ---"
register "admin_user" "admin@gmail.com" "Admin1234!" "Admin" "User"
register "owner_alice" "alice@gmail.com" "Alice1234!" "Alice" "Smith"
register "owner_bob" "bob@gmail.com" "Bob12345!" "Bob" "Jones"
register "customer_one" "customer1@gmail.com" "Cust1234!" "Jane" "Doe"
register "customer_two" "customer2@gmail.com" "Cust5678!" "John" "Doe"

# 2. Admin login
info "--- Logging in as admin ---"
ADMIN_TOKEN=$(login "admin_user" "Admin1234!")
success "Admin token acquired"

# 3. Restaurants
info "--- Restaurants ---"
PIZZA_ID=$(create_restaurant "Napoli Pizza Co." "Italian" "$IMG_DIR/Pizza.webp")
BURGER_ID=$(create_restaurant "The Burgery" "American" "$IMG_DIR/Burger.webp")
SUSHI_ID=$(create_restaurant "Sakura Sushi" "Japanese" "$IMG_DIR/Sushi.webp")

# 4. Menu items
info "--- Menu items ---"
for item in "${!MENU_IMAGES[@]}"; do
  image="${MENU_IMAGES[$item]}"

  # Determine category
  case "$item" in
  *Pizza* | *"Burger"*) category="Main" ;;
  *Sushi* | *Nigiri* | *Roll*) category="Main" ;;
  *Ice*Cream* | Tiramisu*) category="Dessert" ;;
  *Lemonade* | *Shake*) category="Drink" ;;
  *Soup*) category="Starter" ;;
  *Fries* | *Chips*) category="Sides" ;;
  *) category="Main" ;;
  esac

  # Determine price and description
  case "$item" in
  "Margherita")
    price=11.50
    description="San Marzano tomato, fior di latte, fresh basil."
    ;;
  "Pepperoni Feast")
    price=13.50
    description="Generous pepperoni, mozzarella, tomato base."
    ;;
  "Tiramisu")
    price=6.00
    description="Classic Italian mascarpone dessert."
    ;;
  "Sparkling Lemonade")
    price=3.50
    description="Homemade sparkling lemonade."
    ;;
  "Classic Smash Burger")
    price=12.00
    description="Double smash patty, American cheese, pickles, house sauce."
    ;;
  "Crispy Chicken Burger")
    price=11.50
    description="Buttermilk fried chicken, slaw, sriracha mayo."
    ;;
  "Loaded Fries")
    price=5.50
    description="Skin-on fries, cheddar, jalapenos, sour cream."
    ;;
  "Vanilla Shake")
    price=5.00
    description="Thick vanilla milkshake."
    ;;
  "Salmon Nigiri (6 pcs)")
    price=10.00
    description="Fresh Atlantic salmon over seasoned rice."
    ;;
  "Dragon Roll (8 pcs)")
    price=14.00
    description="Prawn tempura, avocado, eel sauce."
    ;;
  "Miso Soup")
    price=3.00
    description="Traditional dashi-based miso with tofu and wakame."
    ;;
  "Matcha Ice Cream")
    price=5.50
    description="Two scoops of premium matcha ice cream."
    ;;
  *)
    price=10
    description="$item"
    ;;
  esac

  # Assign to restaurant
  case "$item" in
  *Pizza*) seed_menu_item "$PIZZA_ID" "$item" "$category" "$price" "$desc" "$image" ;;
  *Burger* | *Fries* | *Shake*) seed_menu_item "$BURGER_ID" "$item" "$category" "$price" "$desc" "$image" ;;
  *Sushi* | *Nigiri* | *Roll* | *Miso* | *Matcha*) seed_menu_item "$SUSHI_ID" "$item" "$category" "$price" "$desc" "$image" ;;
  esac
done

# 5. Orders
info "--- Orders ---"
CUST1_TOKEN=$(login "customer_one" "Cust1234!")
CUST2_TOKEN=$(login "customer_two" "Cust5678!")

# Order 1
ORDER1_RESP=$(post "/orders" "$(jq -n \
  --arg rid "$PIZZA_ID" \
  --arg mid "$(extract "$PIZZA_ID" '.id')" \
  --arg lid "$(extract "$MENU_IMAGES[\"Sparkling Lemonade\"]" '.id')" \
  '{
    restaurantId: $rid,
    customerName: "Jane Doe",
    customerEmail: "customer1@example.com",
    specialInstructions: "Extra basil on the Margherita please.",
    items: [
      { itemId: $mid, quantity: 1 },
      { itemId: $lid, quantity: 2 }
    ]
  }')" "$CUST1_TOKEN")
ORDER1_ID=$(extract "$ORDER1_RESP" '.id // empty')

# Order 2
ORDER2_RESP=$(post "/orders" "$(jq -n \
  --arg rid "$BURGER_ID" \
  --arg sid "$(extract "$BURGER_ID" '.id')" \
  --arg fid "$(extract "$MENU_IMAGES[\"Loaded Fries\"]" '.id')" \
  --arg shid "$(extract "$MENU_IMAGES[\"Vanilla Shake\"]" '.id')" \
  '{
    restaurantId: $rid,
    customerName: "John Doe",
    customerEmail: "customer2@example.com",
    items: [
      { itemId: $sid,  quantity: 2 },
      { itemId: $fid,  quantity: 1 },
      { itemId: $shid, quantity: 2 }
    ]
  }')" "$CUST2_TOKEN")

# 6. Advance order 1 to 'preparing'
if [[ -n $ORDER1_ID ]]; then
  info "--- Advancing order 1 to 'preparing' ---"
  UPD_RESP=$(put "/orders/$ORDER1_ID" '{"status":"preparing"}' "$ADMIN_TOKEN")
  UPD_STATUS=$(extract "$UPD_RESP" '.status // empty')
  [[ $UPD_STATUS == "preparing" ]] && success "Order 1 status → preparing" || warn "Status update failed"
fi

success "=== Seed complete ==="

#!/usr/bin/env bash
# =============================================================================
# seed.sh — Populate the restaurant ordering API with sample data
#
# Usage:
#   bash seed.sh
#   BASE_URL=http://myserver:8080/api bash seed.sh
#
# Requirements:
#   - curl
#   - jq
#   - bun  (for the temporary asset file server)
#   - A running backend at BASE_URL (default: http://localhost:8080/api)
#
# Image serving:
#   For local dev, assets/ is served temporarily on port 3000 by this script.
#   For production, set IMG_BASE to your GCS bucket URL:
#     IMG_BASE=https://storage.googleapis.com/your-bucket bash seed.sh
#
# What this script does:
#   1. Starts a temporary static file server for assets/ using bun
#   2. Registers all users (first user becomes ADMIN automatically)
#   3. Logs in as admin
#   4. Creates 9 restaurants with images
#   5. Creates menu items for each restaurant matched to asset images
#   6. Logs in as customers and places sample orders
#   7. Advances order 1 to 'preparing' status
#   8. Stops the static file server
# =============================================================================
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080/api}"
IMG_BASE="${IMG_BASE:-}"

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# All human-readable output goes to stderr so stdout is clean for ID capture
info() { echo -e "${CYAN}[INFO]${NC}  $*" >&2; }
success() { echo -e "${GREEN}[OK]${NC}    $*" >&2; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*" >&2; }
die() {
  echo -e "${RED}[ERROR]${NC} $*" >&2
  exit 1
}

require() { command -v "$1" &>/dev/null || die "'$1' is required but not installed."; }
require curl
require jq

# ── Static file server ────────────────────────────────────────────────────────
# If IMG_BASE is not set, start a temporary bun file server for local dev.
# The server is automatically killed when the script exits.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSETS_DIR="$SCRIPT_DIR/assets"
SERVER_PID=""

if [[ -z $IMG_BASE ]]; then
  require bun
  if [[ ! -d $ASSETS_DIR ]]; then
    die "Assets directory not found at $ASSETS_DIR — set IMG_BASE to skip local serving"
  fi
  info "Starting static file server for $ASSETS_DIR on port 3000..."
  bun --eval "
const server = Bun.serve({
  port: 5000,
  async fetch(req) {
    const url = new URL(req.url);
    const file = Bun.file('$ASSETS_DIR' + url.pathname);
    if (await file.exists()) {
      return new Response(file);
    }
    return new Response('Not found', { status: 404 });
  },
});
console.error('File server ready on port 5000');
await new Promise(() => {});
" &>/dev/null &
  SERVER_PID=$!
  trap '[[ -n "$SERVER_PID" ]] && kill "$SERVER_PID" 2>/dev/null && info "Static file server stopped"' EXIT
  sleep 1
  success "Static file server running (PID $SERVER_PID)"
  IMG_BASE="http://localhost:3000"
else
  info "Using external image base: $IMG_BASE"
fi

# ── post path body [token] ────────────────────────────────────────────────────
# Sends a POST request to BASE_URL+path with JSON body.
# Optionally includes a Bearer token.
post() {
  local path="$1" body="$2" token="${3:-}"
  local auth_header=()
  [[ -n $token ]] && auth_header=(-H "Authorization: Bearer $token")
  curl -s -w "\n%{http_code}" -X POST "$BASE_URL$path" \
    -H "Content-Type: application/json" \
    "${auth_header[@]}" \
    -d "$body"
}

# ── put path body token ───────────────────────────────────────────────────────
# Sends a PUT request to BASE_URL+path with JSON body and Bearer token.
put() {
  local path="$1" body="$2" token="$3"
  curl -s -X PUT "$BASE_URL$path" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -d "$body"
}

# ── extract json jqFilter ─────────────────────────────────────────────────────
# Extracts a value from a JSON string using a jq filter.
extract() { echo "$1" | jq -r "$2"; }

# ── parse_response raw ────────────────────────────────────────────────────────
# Splits curl -w output into body and status code.
# Sets globals: RESP_BODY, RESP_STATUS
parse_response() {
  local raw="$1"
  RESP_STATUS=$(echo "$raw" | tail -1)
  RESP_BODY=$(echo "$raw" | sed '$d')
}

# ── register username email password firstname lastname ───────────────────────
# Registers a new user. The first user registered becomes ADMIN automatically.
# Subsequent users are assigned the CUSTOMER role.
register() {
  local username="$1" email="$2" password="$3" first="$4" last="$5"
  local raw id
  raw=$(post "/auth/register" "$(jq -n \
    --arg u "$username" --arg e "$email" --arg p "$password" \
    --arg f "$first" --arg l "$last" \
    '{username:$u,email:$e,password:$p,firstName:$f,lastName:$l}')")
  parse_response "$raw"
  id=$(extract "$RESP_BODY" '.id // empty')
  if [[ -z $id ]]; then
    warn "❌ register '$username'"
    warn "   HTTP status : $RESP_STATUS"
    warn "   Message     : $(extract "$RESP_BODY" '.message // .error // "no message"')"
    warn "   Full resp   : $(echo "$RESP_BODY" | jq -c . 2>/dev/null || echo "$RESP_BODY")"
  else
    success "Registered '$username' ($id)"
  fi
}

# ── login identifier password ─────────────────────────────────────────────────
# Authenticates a user and prints the JWT access token to stdout.
# Dies if login fails.
login() {
  local identifier="$1" password="$2"
  local raw token
  raw=$(post "/auth/login" "$(jq -n \
    --arg i "$identifier" --arg p "$password" \
    '{identifier:$i,password:$p}')")
  parse_response "$raw"
  token=$(extract "$RESP_BODY" '.accessToken // empty')
  if [[ -z $token ]]; then
    warn "   HTTP status : $RESP_STATUS"
    warn "   Full resp   : $(echo "$RESP_BODY" | jq -c . 2>/dev/null || echo "$RESP_BODY")"
    die "❌ Login failed for '$identifier': $(extract "$RESP_BODY" '.message // .error // "unknown"')"
  fi
  echo "$token"
}

# ── create_restaurant name cuisine description img ────────────────────────────
# Creates a restaurant using the current ADMIN_TOKEN.
# Prints the new restaurant UUID to stdout on success, empty string on failure.
create_restaurant() {
  local name="$1" cuisine="$2" desc="$3" img="$4"
  local raw id
  raw=$(post "/restaurants" "$(jq -n \
    --arg name "$name" \
    --arg desc "$desc" \
    --arg cuisine "$cuisine" \
    --arg img "$img" \
    '{
      name:         $name,
      description:  $desc,
      address:      "1 Main St",
      phone:        "123456789",
      email:        "contact@restaurant.com",
      cuisineType:  $cuisine,
      openingHours: "9AM-10PM",
      imageUrl:     $img,
      logoUrl:      $img
    }')" "$ADMIN_TOKEN")
  parse_response "$raw"
  id=$(extract "$RESP_BODY" '.id // empty')
  if [[ -z $id ]]; then
    warn "❌ Failed to create restaurant '$name'"
    warn "   HTTP status : $RESP_STATUS"
    warn "   Message     : $(extract "$RESP_BODY" '.message // .error // "no message"')"
    warn "   Full resp   : $(echo "$RESP_BODY" | jq -c . 2>/dev/null || echo "$RESP_BODY")"
    echo ""
    return
  fi
  success "Restaurant '$name' ($id)"
  echo "$id"
}

# ── add_item restaurantId name category price description img ─────────────────
# Adds a menu item to a restaurant using the current ADMIN_TOKEN.
# Prints the new menu item UUID to stdout on success.
# Skips silently if restaurantId is empty.
add_item() {
  local rid="$1" name="$2" category="$3" price="$4" desc="$5" img="$6"
  if [[ -z $rid ]]; then
    warn "Skipping '$name' — no restaurant ID"
    return
  fi
  local raw id
  raw=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/restaurants/$rid/menu" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
      --arg name "$name" \
      --arg desc "$desc" \
      --arg category "$category" \
      --argjson price "$price" \
      --arg img "$img" \
      '{name:$name,description:$desc,category:$category,price:$price,imageUrl:$img,isAvailable:true}')")
  parse_response "$raw"
  id=$(extract "$RESP_BODY" '.id // empty')
  if [[ -z $id ]]; then
    warn "  ❌ Failed '$name'"
    warn "     HTTP status : $RESP_STATUS"
    warn "     Message     : $(extract "$RESP_BODY" '.message // .error // "no message"')"
    warn "     Full resp   : $(echo "$RESP_BODY" | jq -c . 2>/dev/null || echo "$RESP_BODY")"
    return
  fi
  success "  [$category] $name — \$$price ($id)"
  echo "$id"
}

# ── place_order token restaurantId itemId quantity customerName customerEmail ──
# Places an order as the given customer token.
# Prints the new order UUID to stdout on success.
place_order() {
  local token="$1" rid="$2" iid="$3" qty="$4" cname="$5" cemail="$6"
  if [[ -z $rid || -z $iid ]]; then
    warn "Skipping order for '$cname' — missing restaurant or item ID"
    return
  fi
  local raw order_id
  raw=$(post "/orders" "$(jq -n \
    --arg rid "$rid" \
    --arg iid "$iid" \
    --argjson qty "$qty" \
    --arg cname "$cname" \
    --arg cemail "$cemail" \
    '{
      restaurantId:  $rid,
      customerName:  $cname,
      customerEmail: $cemail,
      items: [{itemId: $iid, quantity: $qty}]
    }')" "$token")
  parse_response "$raw"
  order_id=$(extract "$RESP_BODY" '.id // empty')
  if [[ -z $order_id ]]; then
    warn "❌ Order failed for '$cname'"
    warn "   HTTP status : $RESP_STATUS"
    warn "   Message     : $(extract "$RESP_BODY" '.message // .error // "no message"')"
    warn "   Full resp   : $(echo "$RESP_BODY" | jq -c . 2>/dev/null || echo "$RESP_BODY")"
    return
  fi
  success "Order placed by '$cname' ($order_id)"
  echo "$order_id"
}

# =============================================================================
info "=== Seeding $BASE_URL ==="

# ── 1. Users ──────────────────────────────────────────────────────────────────
# The first registered user is automatically assigned the ADMIN role.
# All subsequent users are assigned the CUSTOMER role.
info "--- Users ---"
register "admin_user" "admin@example.com" "Admin1234!" "Admin" "User"
register "owner_alice" "alice@example.com" "Alice1234!" "Alice" "Smith"
register "owner_bob" "bob@example.com" "Bob12345!" "Bob" "Jones"
register "customer_one" "customer1@example.com" "Cust1234!" "Jane" "Doe"
register "customer_two" "customer2@example.com" "Cust5678!" "John" "Doe"

# ── 2. Admin login ────────────────────────────────────────────────────────────
info "--- Admin login ---"
ADMIN_TOKEN=$(login "admin_user" "Admin1234!")
success "Admin token acquired"

# ── 3. Restaurants + menus ────────────────────────────────────────────────────
info "--- Restaurants ---"

# ── Napoli Pizza Co. ──────────────────────────────────────────────────────────
PIZZA_ID=$(create_restaurant "Napoli Pizza Co." "Italian" "Authentic Neapolitan pizza and pasta" "$IMG_BASE/Italian.webp")
if [[ -z $PIZZA_ID ]]; then
  warn "Skipping Napoli Pizza Co. menu — restaurant creation failed"
else
  info "  Menu: Napoli Pizza Co."
  MARGHERITA_ID=$(add_item "$PIZZA_ID" "Margherita" "Main" "11.50" "San Marzano tomato, fior di latte, fresh basil" "$IMG_BASE/Pizza.webp")
  add_item "$PIZZA_ID" "Spaghetti Bolognese" "Main" "13.00" "Slow-cooked beef ragù, parmesan" "$IMG_BASE/Pasta.webp"
  add_item "$PIZZA_ID" "Garlic Bread" "Starter" "4.00" "Toasted ciabatta with garlic butter" "$IMG_BASE/GarlicBread.webp"
  add_item "$PIZZA_ID" "Tiramisu" "Dessert" "6.00" "Classic Italian mascarpone dessert" "$IMG_BASE/Tiramisu.webp"
  add_item "$PIZZA_ID" "Latte" "Drink" "3.00" "Smooth Italian latte" "$IMG_BASE/Latte.webp"
fi

# ── The Burgery ───────────────────────────────────────────────────────────────
BURGER_ID=$(create_restaurant "The Burgery" "American" "Classic smash burgers and loaded sides" "$IMG_BASE/Burger.webp")
if [[ -z $BURGER_ID ]]; then
  warn "Skipping The Burgery menu — restaurant creation failed"
else
  info "  Menu: The Burgery"
  BURGER_ITEM_ID=$(add_item "$BURGER_ID" "Classic Smash Burger" "Main" "12.00" "Double smash patty, American cheese, pickles" "$IMG_BASE/Burger.webp")
  add_item "$BURGER_ID" "Cheeseburger" "Main" "11.00" "Beef patty with melted cheddar" "$IMG_BASE/CheeseBurger.webp"
  add_item "$BURGER_ID" "Onion Rings" "Starter" "4.50" "Crispy beer-battered onion rings" "$IMG_BASE/OnionRings.webp"
  add_item "$BURGER_ID" "Loaded Fries" "Starter" "5.50" "Skin-on fries, cheddar, jalapenos, sour cream" "$IMG_BASE/Chips.webp"
  add_item "$BURGER_ID" "Milkshake" "Drink" "5.00" "Thick vanilla or chocolate milkshake" "$IMG_BASE/Milkshake.webp"
  add_item "$BURGER_ID" "Brownie" "Dessert" "5.00" "Warm chocolate brownie with vanilla ice cream" "$IMG_BASE/Brownie.webp"
fi

# ── Sakura Sushi ──────────────────────────────────────────────────────────────
SUSHI_ID=$(create_restaurant "Sakura Sushi" "Japanese" "Fresh sushi and authentic ramen" "$IMG_BASE/Japanese.webp")
if [[ -z $SUSHI_ID ]]; then
  warn "Skipping Sakura Sushi menu — restaurant creation failed"
else
  info "  Menu: Sakura Sushi"
  add_item "$SUSHI_ID" "Salmon Nigiri (6 pcs)" "Main" "10.00" "Fresh Atlantic salmon over seasoned rice" "$IMG_BASE/Sushi.webp"
  add_item "$SUSHI_ID" "Dragon Roll (8 pcs)" "Main" "14.00" "Prawn tempura, avocado, eel sauce" "$IMG_BASE/Sushi.webp"
  add_item "$SUSHI_ID" "Ramen" "Main" "12.00" "Rich tonkotsu broth with pork and soft-boiled egg" "$IMG_BASE/Ramen.webp"
  add_item "$SUSHI_ID" "Miso Soup" "Starter" "3.00" "Dashi-based miso with tofu and wakame" "$IMG_BASE/Soup.webp"
  add_item "$SUSHI_ID" "Matcha Ice Cream" "Dessert" "5.50" "Two scoops of premium matcha ice cream" "$IMG_BASE/Icecream.webp"
  add_item "$SUSHI_ID" "Green Tea" "Drink" "2.50" "Traditional Japanese green tea" "$IMG_BASE/Tea.webp"
fi

# ── Dragon Wok ────────────────────────────────────────────────────────────────
CHINESE_ID=$(create_restaurant "Dragon Wok" "Chinese" "Traditional Chinese street food and dim sum" "$IMG_BASE/Chinese.webp")
if [[ -z $CHINESE_ID ]]; then
  warn "Skipping Dragon Wok menu — restaurant creation failed"
else
  info "  Menu: Dragon Wok"
  add_item "$CHINESE_ID" "Dumplings" "Starter" "6.00" "Steamed pork and ginger dumplings" "$IMG_BASE/Dumplings.webp"
  add_item "$CHINESE_ID" "Egg Fried Rice" "Main" "10.00" "Wok-fried rice with egg and spring onion" "$IMG_BASE/Rice.webp"
  add_item "$CHINESE_ID" "Noodles" "Main" "11.00" "Stir-fried noodles with vegetables" "$IMG_BASE/Noodles.webp"
  add_item "$CHINESE_ID" "Mixed Grill Platter" "Main" "16.00" "Selection of grilled meats" "$IMG_BASE/MixedGrilledPlatter.webp"
  add_item "$CHINESE_ID" "Cheesecake" "Dessert" "4.50" "Creamy New York cheesecake" "$IMG_BASE/Cheesecake.webp"
  add_item "$CHINESE_ID" "Tea" "Drink" "2.00" "Jasmine or green tea" "$IMG_BASE/Tea.webp"
fi

# ── Curry House ───────────────────────────────────────────────────────────────
INDIAN_ID=$(create_restaurant "Curry House" "Indian" "Rich and aromatic Indian curries" "$IMG_BASE/Indian.webp")
if [[ -z $INDIAN_ID ]]; then
  warn "Skipping Curry House menu — restaurant creation failed"
else
  info "  Menu: Curry House"
  add_item "$INDIAN_ID" "Chicken Curry" "Main" "13.00" "Tender chicken in a fragrant curry sauce" "$IMG_BASE/Curry.webp"
  add_item "$INDIAN_ID" "Steamed Rice" "Starter" "3.00" "Fluffy basmati rice" "$IMG_BASE/Rice.webp"
  add_item "$INDIAN_ID" "Nachos" "Starter" "5.50" "Crispy nachos with mango salsa" "$IMG_BASE/Nachos.webp"
  add_item "$INDIAN_ID" "Mango Lassi" "Drink" "3.50" "Chilled yoghurt and mango drink" "$IMG_BASE/OrangeJuice.webp"
  add_item "$INDIAN_ID" "Cheesecake" "Dessert" "5.50" "Creamy New York cheesecake" "$IMG_BASE/Cheesecake.webp"
fi

# ── El Taco Loco ──────────────────────────────────────────────────────────────
MEXICAN_ID=$(create_restaurant "El Taco Loco" "Mexican" "Vibrant Mexican street food" "$IMG_BASE/Mexican.webp")
if [[ -z $MEXICAN_ID ]]; then
  warn "Skipping El Taco Loco menu — restaurant creation failed"
else
  info "  Menu: El Taco Loco"
  add_item "$MEXICAN_ID" "Beef Tacos" "Main" "10.00" "Three soft tacos with seasoned beef and salsa" "$IMG_BASE/Tacos.webp"
  add_item "$MEXICAN_ID" "Shawarma Wrap" "Main" "11.00" "Spiced meat wrap with garlic sauce" "$IMG_BASE/Shawarma.webp"
  add_item "$MEXICAN_ID" "Nachos" "Starter" "6.00" "Loaded nachos with cheese and jalapeños" "$IMG_BASE/Nachos.webp"
  add_item "$MEXICAN_ID" "Cola" "Drink" "2.50" "Ice cold cola" "$IMG_BASE/Cola.webp"
  add_item "$MEXICAN_ID" "Chocolate Cake" "Dessert" "5.00" "Rich chocolate layer cake" "$IMG_BASE/ChocolateCake.webp"
fi

# ── BBQ Pit ───────────────────────────────────────────────────────────────────
BBQ_ID=$(create_restaurant "BBQ Pit" "BBQ" "Slow-smoked BBQ meats and grilled platters" "$IMG_BASE/Bbq.webp")
if [[ -z $BBQ_ID ]]; then
  warn "Skipping BBQ Pit menu — restaurant creation failed"
else
  info "  Menu: BBQ Pit"
  add_item "$BBQ_ID" "Pork Ribs" "Main" "16.00" "Slow-smoked pork ribs with BBQ glaze" "$IMG_BASE/Ribs.webp"
  add_item "$BBQ_ID" "Grilled Steak" "Main" "18.00" "8oz sirloin with chimichurri sauce" "$IMG_BASE/Steak.webp"
  add_item "$BBQ_ID" "Grilled Fish" "Main" "14.00" "Catch of the day with lemon butter" "$IMG_BASE/GrilledFish.webp"
  add_item "$BBQ_ID" "Mixed Grill" "Main" "20.00" "Selection of BBQ meats and sides" "$IMG_BASE/MixedGrilledPlatter.webp"
  add_item "$BBQ_ID" "Chips" "Starter" "3.50" "Golden skin-on fries" "$IMG_BASE/Chips.webp"
  add_item "$BBQ_ID" "Cola" "Drink" "2.50" "Ice cold cola" "$IMG_BASE/Cola.webp"
  add_item "$BBQ_ID" "Brownie" "Dessert" "5.00" "Warm brownie with vanilla ice cream" "$IMG_BASE/Brownie.webp"
fi

# ── Paris Bites ───────────────────────────────────────────────────────────────
FRENCH_ID=$(create_restaurant "Paris Bites" "French" "Classic French bistro cuisine" "$IMG_BASE/French.webp")
if [[ -z $FRENCH_ID ]]; then
  warn "Skipping Paris Bites menu — restaurant creation failed"
else
  info "  Menu: Paris Bites"
  add_item "$FRENCH_ID" "Steak Frites" "Main" "17.00" "Sirloin steak with crispy fries" "$IMG_BASE/Steak.webp"
  add_item "$FRENCH_ID" "French Onion Soup" "Starter" "6.50" "Rich onion broth with gruyère crouton" "$IMG_BASE/Soup.webp"
  add_item "$FRENCH_ID" "Garlic Bread" "Starter" "4.00" "Toasted baguette with garlic butter" "$IMG_BASE/GarlicBread.webp"
  add_item "$FRENCH_ID" "Salad" "Starter" "5.00" "Mixed leaves with Dijon vinaigrette" "$IMG_BASE/Salad.webp"
  add_item "$FRENCH_ID" "Latte" "Drink" "3.00" "Smooth café latte" "$IMG_BASE/Latte.webp"
  add_item "$FRENCH_ID" "Tiramisu" "Dessert" "6.00" "Classic mascarpone dessert" "$IMG_BASE/Tiramisu.webp"
fi

# ── Mediterraneo ─────────────────────────────────────────────────────────────
MED_ID=$(create_restaurant "Mediterraneo" "Mediterranean" "Fresh Mediterranean flavours and mezze" "$IMG_BASE/Mediterranean.webp")
if [[ -z $MED_ID ]]; then
  warn "Skipping Mediterraneo menu — restaurant creation failed"
else
  info "  Menu: Mediterraneo"
  add_item "$MED_ID" "Mixed Grill" "Main" "15.00" "Selection of grilled meats and vegetables" "$IMG_BASE/MixedGrilledPlatter.webp"
  add_item "$MED_ID" "Grilled Fish" "Main" "14.00" "Catch of the day with herb oil" "$IMG_BASE/GrilledFish.webp"
  add_item "$MED_ID" "Tapas" "Starter" "7.00" "Assorted Mediterranean tapas" "$IMG_BASE/Tapas.webp"
  add_item "$MED_ID" "Greek Salad" "Starter" "5.00" "Feta, olives, cucumber, tomato" "$IMG_BASE/Salad.webp"
  add_item "$MED_ID" "Orange Juice" "Drink" "3.00" "Freshly squeezed orange juice" "$IMG_BASE/OrangeJuice.webp"
  add_item "$MED_ID" "Cheesecake" "Dessert" "5.50" "Honey and walnut cheesecake" "$IMG_BASE/Cheesecake.webp"
fi

# ── Green Bowl ────────────────────────────────────────────────────────────────
VEGAN_ID=$(create_restaurant "Green Bowl" "Vegan" "Fresh plant-based bowls and salads" "$IMG_BASE/Vegan.webp")
if [[ -z $VEGAN_ID ]]; then
  warn "Skipping Green Bowl menu — restaurant creation failed"
else
  info "  Menu: Green Bowl"
  add_item "$VEGAN_ID" "Vegan Bowl" "Main" "11.00" "Roasted veg, quinoa, tahini dressing" "$IMG_BASE/Vegan.webp"
  add_item "$VEGAN_ID" "Garden Salad" "Starter" "5.00" "Mixed leaves, cherry tomatoes, vinaigrette" "$IMG_BASE/Salad.webp"
  add_item "$VEGAN_ID" "Orange Juice" "Drink" "3.00" "Freshly squeezed orange juice" "$IMG_BASE/OrangeJuice.webp"
  add_item "$VEGAN_ID" "Coffee" "Drink" "3.00" "Freshly brewed coffee" "$IMG_BASE/Coffee.webp"
  add_item "$VEGAN_ID" "Ice Cream" "Dessert" "4.50" "Dairy-free coconut ice cream" "$IMG_BASE/Icecream.webp"
  add_item "$VEGAN_ID" "Water" "Drink" "1.50" "Still or sparkling water" "$IMG_BASE/Water.webp"
fi

# ── 4. Customer logins ────────────────────────────────────────────────────────
info "--- Customer logins ---"
CUST1_TOKEN=$(login "customer_one" "Cust1234!")
CUST2_TOKEN=$(login "customer_two" "Cust5678!")

# ── 5. Orders ─────────────────────────────────────────────────────────────────
info "--- Orders ---"
ORDER1_ID=$(place_order "$CUST1_TOKEN" "$PIZZA_ID" "${MARGHERITA_ID:-}" 2 "Jane Doe" "customer1@example.com")
place_order "$CUST2_TOKEN" "$BURGER_ID" "${BURGER_ITEM_ID:-}" 1 "John Doe" "customer2@example.com"

# ── 6. Advance order 1 to 'preparing' ────────────────────────────────────────
# Simulates a restaurant accepting and starting to prepare the order
if [[ -n ${ORDER1_ID:-} ]]; then
  info "--- Advancing order 1 to 'preparing' ---"
  UPD_RESP=$(put "/orders/$ORDER1_ID" '{"status":"preparing"}' "$ADMIN_TOKEN")
  UPD_STATUS=$(extract "$UPD_RESP" '.status // empty')
  if [[ $UPD_STATUS == "preparing" ]]; then
    success "Order 1 status → preparing"
  else
    warn "Status update failed — got '$UPD_STATUS'"
  fi
fi

# =============================================================================
success "=== Seed complete ==="
info "Credentials:"
info "  admin_user   / Admin1234!  (ADMIN)"
info "  owner_alice  / Alice1234!  (CUSTOMER)"
info "  owner_bob    / Bob12345!   (CUSTOMER)"
info "  customer_one / Cust1234!   (CUSTOMER)"
info "  customer_two / Cust5678!   (CUSTOMER)"
info ""
info "For production seeding with GCS images:"
info "  IMG_BASE=https://storage.googleapis.com/your-bucket bash seed.sh"

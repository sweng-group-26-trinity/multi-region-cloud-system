package com.sweng.backend.seed;

import java.net.URI;
import java.net.http.*;
import java.util.*;

public class SeedData {

    private static final String BASE_URL = "http://localhost:8080/api";
    private static final String IMG_BASE = "http://localhost:3000/public/";

    public static void main(String[] args) throws Exception {

        HttpClient client = HttpClient.newHttpClient();

        String username = "admin";
        String email = "admin@test.com";
        String password = "Password123!";

        // REGISTER
        client.send(HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/auth/register"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(
                        "{\"username\":\"" + username + "\",\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"
                )).build(), HttpResponse.BodyHandlers.ofString());

        // LOGIN
        HttpResponse<String> loginRes = client.send(HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(
                        "{\"identifier\":\"" + username + "\",\"password\":\"" + password + "\"}"
                )).build(), HttpResponse.BodyHandlers.ofString());

        String token = extract(loginRes.body(), "accessToken");

        List<Restaurant> restaurants = new ArrayList<>(List.of(
                new Restaurant("Burger Shack", "American", IMG_BASE + "Burger.webp"),
                new Restaurant("Pasta Palace", "Italian", IMG_BASE + "Italian.webp"),
                new Restaurant("Dragon Wok", "Chinese", IMG_BASE + "Chinese.webp"),
                new Restaurant("Curry House", "Indian", IMG_BASE + "Indian.webp"),
                new Restaurant("El Taco Loco", "Mexican", IMG_BASE + "Mexican.webp"),
                new Restaurant("Sushi Zen", "Japanese", IMG_BASE + "Japanese.webp"),
                new Restaurant("Green Bowl", "Vegan", IMG_BASE + "Vegan.webp"),
                new Restaurant("BBQ Pit", "BBQ", IMG_BASE + "BBQ.webp"),
                new Restaurant("Paris Bites", "French", IMG_BASE + "French.webp"),
                new Restaurant("Mediterraneo", "Mediterranean", IMG_BASE + "Mediterranean.webp")
        ));

        Collections.shuffle(restaurants);

        Map<String, String> starterImages = new HashMap<>();
        starterImages.put("Chips", IMG_BASE + "Chips.webp");
        starterImages.put("Dumplings", IMG_BASE + "Dumplings.webp");
        starterImages.put("Garlic Bread", IMG_BASE + "GarlicBread.webp");
        starterImages.put("Nachos", IMG_BASE + "Nachos.webp");
        starterImages.put("Onion Rings", IMG_BASE + "OnionRings.webp");
        starterImages.put("Salad", IMG_BASE + "Salad.webp");
        starterImages.put("Soup", IMG_BASE + "Soup.webp");
        starterImages.put("Tapas", IMG_BASE + "Tapas.webp");

        Map<String, String> mainImages = new HashMap<>();
        mainImages.put("Burger", IMG_BASE + "Burger.webp");
        mainImages.put("Pizza", IMG_BASE + "Pizza.webp");
        mainImages.put("Pasta", IMG_BASE + "Pasta.webp");
        mainImages.put("Noodles", IMG_BASE + "Noodles.webp");
        mainImages.put("Curry", IMG_BASE + "Curry.webp");
        mainImages.put("Tacos", IMG_BASE + "Tacos.webp");
        mainImages.put("Sushi", IMG_BASE + "Sushi.webp");
        mainImages.put("Ramen", IMG_BASE + "Ramen.webp");
        mainImages.put("Steak", IMG_BASE + "Steak.webp");
        mainImages.put("Ribs", IMG_BASE + "Ribs.webp");
        mainImages.put("Shawarma", IMG_BASE + "Shawarma.webp");
        mainImages.put("Rice", IMG_BASE + "Rice.webp");
        mainImages.put("Grilled Fish", IMG_BASE + "GrilledFish.webp");
        mainImages.put("Mixed Grill", IMG_BASE + "MixedGrilledPlatter.webp");
        mainImages.put("Vegan", IMG_BASE + "Vegan.webp");

        Map<String, String> dessertImages = new HashMap<>();
        dessertImages.put("Brownie", IMG_BASE + "Brownie.webp");
        dessertImages.put("Cheesecake", IMG_BASE + "Cheesecake.webp");
        dessertImages.put("Chocolate Cake", IMG_BASE + "ChocolateCake.webp");
        dessertImages.put("Ice Cream", IMG_BASE + "Icecream.webp");
        dessertImages.put("Tiramisu", IMG_BASE + "Tiramisu.webp");

        Map<String, String> drinkImages = new HashMap<>();
        drinkImages.put("Coffee", IMG_BASE + "Coffee.webp");
        drinkImages.put("Cola", IMG_BASE + "Cola.webp");
        drinkImages.put("Latte", IMG_BASE + "Latte.webp");
        drinkImages.put("Milkshake", IMG_BASE + "Milkshake.webp");
        drinkImages.put("Orange Juice", IMG_BASE + "OrangeJuice.webp");
        drinkImages.put("Tea", IMG_BASE + "Tea.webp");
        drinkImages.put("Water", IMG_BASE + "Water.webp");

        Set<String> existing = getExistingRestaurantNames(client);

        int created = 0;

        for (Restaurant r : restaurants) {

            if (created >= 7) break;
            if (existing.contains(r.name)) continue;

            String id = createRestaurant(client, token, r);

            addItems(client, token, id, starterImages, 5, "Starter");
            addItems(client, token, id, mainImages, 10, "Main");
            addItems(client, token, id, dessertImages, 5, "Dessert");
            addItems(client, token, id, drinkImages, 7, "Drink");

            created++;
        }

        System.out.println("Done");
    }

    private static void addItems(HttpClient client, String token, String id,
                                 Map<String, String> items, int count, String category) throws Exception {

        List<Map.Entry<String, String>> list = new ArrayList<>(items.entrySet());
        Collections.shuffle(list);

        for (int i = 0; i < Math.min(count, list.size()); i++) {
            var entry = list.get(i);

            double price = getPrice(entry.getKey(), category);

            String json = "{"
                    + "\"name\":\"" + entry.getKey() + "\","
                    + "\"description\":\"" + entry.getKey() + "\","
                    + "\"category\":\"" + category + "\","
                    + "\"price\":" + price + ","
                    + "\"imageUrl\":\"" + entry.getValue() + "\","
                    + "\"isAvailable\":true"
                    + "}";

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(BASE_URL + "/restaurants/" + id + "/menu"))
                    .header("Authorization", "Bearer " + token)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            client.send(req, HttpResponse.BodyHandlers.ofString());
        }
    }

    private static double getPrice(String name, String category) {
        String n = name.toLowerCase();

        if (category.equals("Drink")) return 2.5;
        if (category.equals("Dessert")) return 5.0;
        if (category.equals("Starter")) return 6.0;

        if (n.contains("steak") || n.contains("ribs")) return 15.0;
        if (n.contains("pizza") || n.contains("burger")) return 11.0;
        if (n.contains("pasta") || n.contains("curry")) return 12.0;

        return 10.0;
    }

    private static String createRestaurant(HttpClient client, String token, Restaurant r) throws Exception {
        String json = "{"
                + "\"name\":\"" + r.name + "\","
                + "\"description\":\"Best " + r.cuisine + "\","
                + "\"address\":\"1 Main St\","
                + "\"phone\":\"123456789\","
                + "\"email\":\"test@test.com\","
                + "\"imageUrl\":\"" + r.image + "\","
                + "\"logoUrl\":\"" + r.image + "\","
                + "\"cuisineType\":\"" + r.cuisine + "\","
                + "\"openingHours\":\"9-10\""
                + "}";

        HttpResponse<String> res = client.send(HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/restaurants"))
                .header("Authorization", "Bearer " + token)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build(), HttpResponse.BodyHandlers.ofString());

        return extract(res.body(), "id");
    }

    private static Set<String> getExistingRestaurantNames(HttpClient client) throws Exception {
        HttpResponse<String> res = client.send(HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/restaurants?page=0&size=100"))
                .GET().build(), HttpResponse.BodyHandlers.ofString());

        Set<String> names = new HashSet<>();
        String[] parts = res.body().split("\"name\":\"");

        for (int i = 1; i < parts.length; i++) {
            names.add(parts[i].split("\"")[0]);
        }

        return names;
    }

    private static String extract(String json, String key) {
        return json.split("\"" + key + "\":\"")[1].split("\"")[0];
    }

    static class Restaurant {
        String name;
        String cuisine;
        String image;

        Restaurant(String name, String cuisine, String image) {
            this.name = name;
            this.cuisine = cuisine;
            this.image = image;
        }
    }
}
from datetime import date, timedelta
import csv, random

random.seed(7)

def daterange(start, end):
    d = start
    while d <= end:
        yield d
        d += timedelta(days=1)

def write_csv(path, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["date","merchant","amount","currency","city","state","category"])
        w.writerows(rows)

def make_transactions(start, end, base_city, base_state, profile):
    rows = []
    subs = profile.get("subscriptions", [])
    merchants = profile.get("merchants", [])
    spikes = profile.get("spikes", [])
    duplicates = profile.get("duplicates", [])

    # recurring subscriptions
    for d in daterange(start, end):
        for (m,a,dom,cat) in subs:
            if d.day == dom:
                rows.append([d.isoformat(), m, round(a,2), "USD", base_city, base_state, cat])
        # random daily purchases
        for _ in range(random.randint(0,3)):
            m, lo, hi, cat, *place = random.choice(merchants)
            amt = round(random.uniform(lo, hi), 2)
            city = place[0] if place else base_city
            state = place[1] if len(place)>1 else base_state
            rows.append([d.isoformat(), m, amt, "USD", city, state, cat])

    # occasional spikes
    for (ds, m, amt, cat, *place) in spikes:
        city = place[0] if place else base_city
        state = place[1] if len(place)>1 else base_state
        rows.append([ds, m, round(amt,2), "USD", city, state, cat])

    # deliberate duplicates across adjacent days
    for (ds, m, amt, times, cat) in duplicates:
        for i in range(times):
            rows.append([(ds + timedelta(days=i)).isoformat(), m, round(amt,2), "USD", base_city, base_state, cat])

    # sort by date then merchant
    rows.sort(key=lambda r: (r[0], r[1]))
    return rows

start = date(2025,7,1)
end   = date(2025,9,20)

personas = {
    "student_budget": {
        "base": ("Tempe","AZ"),
        "profile": {
            "subscriptions": [
                ("NETFLIX.COM", 15.49, 3, "streaming"),
                ("SPOTIFY", 10.99, 12, "streaming"),
                ("APPLE.COM/BILL", 0.99, 20, "streaming"),
            ],
            "merchants": [
                ("UBER *TRIP", 9.0, 25.0, "ride_hail"),
                ("LYFT RIDE", 9.0, 24.0, "ride_hail"),
                ("STARBUCKS", 3.0, 8.0, "restaurants"),
                ("CHIPOTLE", 8.0, 18.0, "restaurants"),
                ("SPROUTS FARMERS", 15.0, 85.0, "groceries"),
                ("TARGET", 10.0, 120.0, "general_retail"),
                ("AMAZON Mktp US", 5.0, 60.0, "delivery_shipping"),
            ],
            "spikes": [
                ("2025-08-30", "BEST BUY #123", 899.99, "electronics", "Scottsdale","AZ"),
            ],
            "duplicates": [
                (date(2025,8,15), "STARBUCKS", 5.45, 3, "restaurants"),
            ],
        },
    },
    "new_grad_commuter": {
        "base": ("Phoenix","AZ"),
        "profile": {
            "subscriptions": [
                ("YOUTUBE PREMIUM", 13.99, 5, "streaming"),
                ("HULU", 14.99, 17, "streaming"),
            ],
            "merchants": [
                ("CITY TRANSIT", 2.5, 5.0, "general_retail"),
                ("UBER *TRIP", 10.0, 28.0, "ride_hail"),
                ("STARBUCKS", 3.0, 8.0, "restaurants"),
                ("PANERA BREAD", 8.0, 18.0, "restaurants"),
                ("SAFEWAY", 20.0, 120.0, "groceries"),
                ("AMAZON Mktp US", 5.0, 80.0, "delivery_shipping"),
                ("MICRO CENTER", 20.0, 350.0, "electronics"),
            ],
            "spikes": [
                ("2025-09-10", "MICRO CENTER", 1299.00, "electronics", "Tempe","AZ"),
            ],
            "duplicates": [
                (date(2025,8,2), "CITY TRANSIT", 2.50, 2, "general_retail"),
            ],
        },
    },
    "frequent_traveler": {
        "base": ("Scottsdale","AZ"),
        "profile": {
            "subscriptions": [
                ("SPOTIFY", 10.99, 12, "streaming"),
                ("DISNEYPLUS", 9.99, 22, "streaming"),
            ],
            "merchants": [
                ("UBER *TRIP", 12.0, 35.0, "ride_hail"),
                ("LYFT RIDE", 12.0, 35.0, "ride_hail"),
                ("DELTA AIR", 120.0, 650.0, "air_travel"),
                ("SOUTHWEST AIR", 110.0, 550.0, "air_travel"),
                ("MARRIOTT HOTEL", 120.0, 380.0, "general_retail"),
                ("STARBUCKS", 3.0, 8.0, "restaurants"),
                ("AMAZON Mktp US", 5.0, 60.0, "delivery_shipping"),
                ("WHOLE FOODS", 20.0, 150.0, "groceries"),
            ],
            "spikes": [
                ("2025-07-20", "DELTA AIR", 1200.00, "air_travel", "Atlanta","GA"),
            ],
            "duplicates": [
                (date(2025,9,1), "MARRIOTT HOTEL", 199.00, 2, "general_retail"),
            ],
        },
    },
    "family_household": {
        "base": ("Mesa","AZ"),
        "profile": {
            "subscriptions": [
                ("SPOTIFY FAMILY", 15.99, 6, "streaming"),
                ("AMAZON PRIME", 14.99, 18, "delivery_shipping"),
                ("PEACOCK", 5.99, 9, "streaming"),
            ],
            "merchants": [
                ("WALMART", 15.0, 180.0, "general_retail"),
                ("TARGET", 10.0, 200.0, "general_retail"),
                ("COSTCO", 25.0, 300.0, "general_retail"),
                ("SPROUTS FARMERS", 20.0, 200.0, "groceries"),
                ("AMAZON Mktp US", 5.0, 120.0, "delivery_shipping"),
                ("UBER *TRIP", 10.0, 30.0, "ride_hail"),
                ("APPLE.COM/BILL", 0.99, 9.99, "streaming"),
                ("HOME DEPOT", 10.0, 400.0, "general_retail"),
                ("BEST BUY #123", 15.0, 900.0, "electronics"),
            ],
            "spikes": [
                ("2025-08-25", "HOME DEPOT", 1200.00, "general_retail", "Phoenix","AZ"),
            ],
            "duplicates": [
                (date(2025,7,14), "WALMART", 45.12, 2, "general_retail"),
            ],
        },
    },
}

def main():
    for name, cfg in personas.items():
        city, state = cfg["base"]
        rows = make_transactions(start, end, city, state, cfg["profile"])
        path = f"./{name}.csv"
        write_csv(path, rows)
        print(f"Wrote {path} with {len(rows)} rows")

if __name__ == "__main__":
    main()

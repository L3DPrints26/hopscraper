# Hopscraper: App Store cheat sheet

## Step 1: Business setup (your dad, now)
Go to **appstoreconnect.apple.com** and click **Business** (or "Agreements, Tax, and Banking").
- **Paid Apps Agreement**: accept it. Without it, no purchase can go through.
- **Bank account**: the routing number and account number where the money goes.
- **Tax form**: in the US that's the W-9. You need the account holder's legal name, address and SSN (or an EIN if it's a business).
- **Contacts**: fill in the ones it asks for (Legal, Finance, etc.). They can all be the same person.
- Everything should say **Active** after about 1–2 days.

> **Seller name.** On an *individual* developer account, the App Store shows the account holder's legal name (your dad's) as the seller, not "GamerCrafter". Showing "GamerCrafter" there needs an *organization* account (a registered business plus a free D-U-N-S number). "GamerCrafter" still appears inside the game either way (intro and credits).

## Step 2: The app listing (later)
- **App name:** Hopscraper
- **Bundle ID:** com.gamercrafter.hopscraper
- **Privacy Policy URL:** https://l3dprints26.github.io/hopscraper/privacy.html
  - This page is still being created in the fix pass.
  - It must stay online even after the rest of the GitHub site is taken down.
- **Support URL:** required. Any page or email contact page works; the same GitHub site works too.
- **Age rating questionnaire:**
  - Answer **YES** to "In-App Purchases".
  - Answer **YES** to "random items purchasable" (the Premium Wheel is paid with gems).
  - Cartoon/fantasy violence: mild or none (spikes and saws, no gore).
- **Screenshots:** landscape iPhone and iPad screenshots of the real game.

## Step 3: In-app purchases (create each in App Store Connect → your app → Monetization)
The **Product ID must match exactly**. Prices can be changed.

| Product ID | Name | Type | Price |
|---|---|---|---|
| com.gamercrafter.hopscraper.gems80 | 80 Gems | Consumable | $0.99 |
| com.gamercrafter.hopscraper.gems250 | 250 Gems | Consumable | $2.99 |
| com.gamercrafter.hopscraper.gems700 | 700 Gems | Consumable | $6.99 |
| com.gamercrafter.hopscraper.gems1600 | 1,600 Gems | Consumable | $14.99 |
| com.gamercrafter.hopscraper.cardpack | Power Card Pack | Consumable | $1.99 |
| com.gamercrafter.hopscraper.starter | Starter Pack | Non-Consumable | $1.99 |
| com.gamercrafter.hopscraper.supporter | Supporter Pack | Non-Consumable | $4.99 |
| com.gamercrafter.hopscraper.doubler | Coin Doubler | Non-Consumable | $2.99 |
| com.gamercrafter.hopscraper.pack_neon | Neon Pack | Non-Consumable | $0.99 |
| com.gamercrafter.hopscraper.pack_space | Space Pack | Non-Consumable | $0.99 |
| com.gamercrafter.hopscraper.pack_monster | Monster Pack | Non-Consumable | $0.99 |
| com.gamercrafter.hopscraper.chaos | Chaos Pass | Non-Consumable | $0.99 |
| com.gamercrafter.hopscraper.world6only | World 6 Unlock | Non-Consumable | (see game) |
| com.gamercrafter.hopscraper.world6bundle | World 6 + Space Bundle | Non-Consumable | (see game) |
| com.gamercrafter.hopscraper.goldworldbundle | Gilded Vale Bundle | Non-Consumable | $3.99 |
| com.gamercrafter.hopscraper.monsterworldbundle | Monster Woods Bundle | Non-Consumable | $2.99 |
| com.gamercrafter.hopscraper.allworldsbundle | All 3 Bonus Worlds | Non-Consumable | $7.99 |
| com.gamercrafter.hopscraper.club | Hopscraper Club | **Auto-Renewable Subscription** (monthly) | $2.99/mo |

- The Club subscription needs a **Subscription Group**; call it "Hopscraper Club".
- Each product needs a display name, a description and a review screenshot. Use a screenshot of the in-game Store.
- The prices shown in the game are placeholders. The app will show Apple's real local prices once purchases are wired up.

## Step 4: Before submitting
- Remove **Dev Mode** from the game.
- Test every purchase in **TestFlight** with a Sandbox tester account. Create one under Users and Access → Sandbox.
- Test the **Restore Purchases** button too. Apple checks it.

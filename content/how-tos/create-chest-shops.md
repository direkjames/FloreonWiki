---
title: How to create Chest Shops?
description: Make a shop with a sign and a chest so other players can buy from you or sell to you.
order: 30
---
A Chest Shop is a sign on a chest. Other players right-click the sign to **buy** and left-click it to **sell**. You are paid the moment someone trades with you, so there is nothing to collect.

If you are offline when someone buys, you get a chat message about every sale the next time you join.

## Make a shop

1. Put a chest (or double chest, barrel or shulker box) down and fill it with **one kind of item**.
2. Place a sign on the chest, or on top of it.
3. Write the four lines like this:

| Line | What to write |
|---|---|
| 1 | Leave it empty |
| 2 | How many items per click, for example `16` |
| 3 | The prices, for example `B 100:S 40` |
| 4 | `?` to use the item in the chest, or the item name, for example `diamond` or `poke_ball` |

The sign is rewritten with your name and locked. It can no longer be edited.

> [!TIP] Not sure what to write on line 4?
> Hold the item and type `/iteminfo`. It tells you exactly what to write.

## Prices

- `B 100` means players **buy** from you: they pay 100 for the amount on line 2.
- `S 40` means players **sell** to you: you pay 40 for that amount.
- `B 100:S 40` does both. Use just one of them if you only want to sell or only want to buy.
- Prices are whole numbers. The most you can charge is 1,000,000,000 and the most items per click is 64.

## How it works for buyers

- **Right-click** the sign to buy.
- **Left-click** the sign to sell your items to the shop.
- The shop matches the exact item. A renamed or enchanted sword is not the same as a plain one.

## Tax

The person who **receives** the money pays a 5% tax. When a buyer pays 100, you receive 95. When you pay a seller 40, the seller receives 38. The tax is removed from the economy.

## Good to know

- A shop that **buys** items only works while its owner is online.
- Only you can open your shop chest or break your sign. Other players can only trade.
- To remove your own shop, **sneak** and **left-click** the sign.
- To change a shop, break the sign and place a new one.
- Shops also work inside protected regions.
- Sophisticated Storage chests can't be used as shop chests.

---
title: Global Trading System (GTS)
description: Sell Pokémon and items to other players on the GTS market.
order: 18
---
The GTS (Global Trading System) is a market where you can sell your Pokémon and items to other players.

## Commands

| Command | What it does |
|---|---|
| `/gts` | Opens the market |
| `/gts sell item <price>` | Lists the item (whole stack) in your hand |
| `/gts sell pokemon <slot> <price>` | Lists the Pokémon in that party slot |
| `/gts mine` | Your listings (click one to take it off sale) |
| `/gts expired` | Listings that ran out or were cancelled, to claim back |
| `/gts search <text>` | Opens the market filtered by name or seller |
| `/gts history [page]` | Your own sales, purchases and listings |

## Rules

- **Price:** from 100 up to 5,000,000.
- **Listings:** each listing lasts 72 hours. By default you can have **1 active listing** at a time.
- **Expired listings:** a listing that runs out or is cancelled moves to `/gts expired`. Claim it back within 30 days or it is removed.

## Tax

When your listing sells, a tax is taken from the price. The more expensive the sale, the higher the tax:

| Price | Tax |
|---|---|
| 1 to 9,999 | 3% |
| 10,000 to 49,999 | 5% |
| 50,000 to 199,999 | 8% |
| 200,000 to 599,999 | 12% |
| 600,000 and up | 15% |

## Items you can't sell

These items are banned from the GTS:

- Ability Patch
- Ability Capsule
- Master Ball
- Keystone
- Mega Stone

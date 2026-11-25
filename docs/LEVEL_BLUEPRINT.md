# Burger Town vertical slice — level blueprint
One persistent restaurant; 12x10 grid, 1m tiles, x=0..11 left→right, z=0..9 north→south. Each character radius 0.30m, counter 1x1 tile height 0.9m; two tables and seating on east side. Floor render extends beyond grid; walls cut away. Proposed dimensions to validate in G0/M1. Camera fits all cells and HUD.

```
   012345678901
0  ############
1  #BPMCLG.|..#
2  #.......|T.#
3  #K.....S...#
4  #.......|..#
5  #W.A....|T.#
6  #.......|..#
7  #R......|..#
8  #.12....|.D#
9  ############
```
# wall, | partition, . walk, B bun, P patty, M tomato, C cheese, L lettuce bins, G stove/pan, K prep, S serving counter (x7,z3), W sink, A assembly, R combined plate rack/trash zone (rack x1,z7; trash x1,z8, map . at x1,z8 is reserved for trash), T table, D customer entrance, 1/2 chef starts. Partition gap at z3 connects zones; customer paths use x9–10, entrance accessible from x10,z8. Staff remain in kitchen by default; serving is counter-mediated, not manual table delivery. Tables have one seated customer each in slice; queue cap 3. Customer placement at x10 adjacent to table. No overlap with chef starts. Validate approach tiles cardinal-adjacent to every mandatory station, including trash/rack. Blueprint text overrides visual board. Use typed layout data; validate occupancy, zone routes, reservation and spawn positions.
## Tutorial and seven days
Untimed tutorial: movement/pick/place → classic burger → wash → switch chef → start day. Day 1: classic only, target 6; day 2 cheese unlocked, target 8; day 3 garden unlocked, target 10; days 4–7 all recipes, target 10, seeded mix and upgrade opportunity. All days 300s, order spawn 18–25s (initially first order at 0), patience 60s, stop spawning final 60s. Allow repeat days, no forced grind; adjust targets/spawn at playtest if infeasible. Initial cash 100, 4 plates, 2 tables, equipment as GDD. Staff prep/wash only, no auto-serve. After day 7, repeatable shift with unlocked recipes. No forced online account.
## Service sequence and failure
Customer arrives → queue → seat/order → waiting → served/eating (8s proposed) → leaves/dirty plate returned → next seat. Queue wait also 60s, no order until seat; cap arrivals when queue full, log rejected arrival separately. Exact recipe match oldest valid order; plate becomes unavailable until wash. At closing stop service, expire pending tickets, return physical items/reset station stock for next day; settle once. Planning persists equipment/cash/reputation/day; no mid-shift save. If failure show clear reason and recovery route. Validate 7-day economy against actual play, not invented performance.
## Layout edit rules
Only planning; reserve customer zone and fixed entrance/serving counter; movable kitchen appliances only. Preview ghost, blocked icon, confirm/cancel/undo, atomic purchase+placement, no inaccessible station, no collision with spawns/partition. Recompute navigation after commit. Expansion footprint deferred to post-G2.

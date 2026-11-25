# Gameplay interactions and animation contract
Simulation owns state; animation observes committed action events, never determines cooking truth. E transfers held item/container, Space activates highlighted station, WASD moves, Shift dash, Q switches chef, Tab toggles order list, Esc pauses. Target nearest valid station in facing cone within 1.25m, stable ID tie-break; highlight and prompt before action. Proposed movement 3m/s walk, 4.5m/s dash for .25s, cooldown .75s; AABB sweep collision. One held item/container; plate may contain unique ingredients. No throw mechanic in slice.
| Action | Preconditions / transition | Feedback / edge case | Test |
|---|---|---|---|
| Fetch | Empty hands + bin stock → new owned item; record cost once | Hand socket + icon; full hands blocked | Q03 |
| Place/pick | Free slot or valid plate assembly; atomic transfer | Pop/contact; occupied slot leaves source unchanged | Q03 |
| Chop | Raw lettuce/tomato at board; hold Space 2s; release preserves | Chop loop + progress; switch cancels active hold | Q15 |
| Cook | Raw patty in pan; 8s perfect, >12 overcooked, >16 burnt | Steam, ready ping, warning; continues unattended, pause freezes | Q05 |
| Assemble | Clean plate accepts unique valid ingredients; order-independent | Stack offsets; duplicate invalid, no lost item | Q04 |
| Serve | Exact recipe + valid quality; oldest matching pending order | Tip/cash once; wrong dish retained | Q04/Q06 |
| Wash | Dirty plate at sink, hold 3s → clean plate | Bubbles and loop; release retains progress | Q15 |
| Trash | Deliberate Space at trash with item, plate retained | Waste counter; no accidental deletion | Q16 |
| Switch | Q swaps active chef; releases staff reservation | Ring and HUD update; held item stays with old chef | Q07 |
| Staff | Assign prep/wash; reserve item/station; navigate; cancel on unreachable | Task badge; no duplicate or indefinite lock | Q07 |
| Pause | Esc or visibility loss clears input, clock freezes | Explicit resume, audio suspended | Q02/Q05 |
## Clip contract (proposed timing, seconds)
| Clip | Duration / loop | Contact and interruption |
|---|---|---|
| idle | 2.0 loop | blink additive; freely interrupt |
| walk / run | .8 / .55 loop | foot plants; speed blend; no root motion |
| carry_walk / carry_run | .8 / .55 loop | locked carry socket; locomotion blend |
| pickup / place | .32 / .32 once | contact .12; event starts after logical commit; cosmetic prop attach interpolates |
| chop | .5 loop | contact .22; progress simulation 2s, cancel on release |
| fry_interact | .35 once | contact .14; pan simulation independent |
| wash | .6 loop | contact .15; progress simulation 3s |
| serve | .45 once | contact .18; committed ownership already changed |
| success / panic | .65 / .7 once | upper body/emote, interruptible |
Customer idle/walk/seat/eat/leave clips; reuse shared rig where feasible. Blend .08–.15s, no blocking of controls by cosmetic clips. Use deterministic clip names and glTF export; verify animation durations, looping, state transitions, hand sockets and pause. If event arrives mid-clip, cancel/reblend with no double transfer. Record screenshot sequence or video at 30/60 FPS. Future stir/oven/slip/extinguisher deferred.

# M0 foundation browser evidence

Captured on 2026-11-25 from commit `4f739fd` at the project subpath. Browser was headless Chromium 156.0.8078.79 on Debian 13 x86_64 with SwiftShader. Screens capture boot and recovery before a simulation exists, so there is no scene seed.

| Scenario | 1280×720 | 1920×1080 |
|---|---|---|
| Q01 clean boot | [PNG](foundation-boot-1280x720.png) | [PNG](foundation-boot-1920x1080.png) |
| Q01 HTTP 404 content error before keyboard retry | [PNG](foundation-missing-content-1280x720.png) | [PNG](foundation-missing-content-1920x1080.png) |
| Q01 simulated WebGL 2 unavailability | [PNG](foundation-webgl-error-1280x720.png) | [PNG](foundation-webgl-error-1920x1080.png) |

[Local command log](verification.log)

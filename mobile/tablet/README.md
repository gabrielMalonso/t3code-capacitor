# Tablet adaptations

Tablets use the upstream T3 Code layout. Shared Android behavior such as safe areas, system bars,
composer focus, and Enter handling lives in `../shared/`.

Tablet-only code belongs here when it cannot be expressed as shared behavior. Phone modules must be
activated through the coarse-pointer phone breakpoint so they do not alter tablet layouts.

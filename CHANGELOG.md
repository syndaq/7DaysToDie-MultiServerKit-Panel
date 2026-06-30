# Changelog

All notable changes to this project are documented here.

## [Unreleased]

## [1.0.0] - 2026-06-30

First production-ready MultiServerKit panel release.

### Added

- React admin UI with full per-server and cluster-wide management pages
- Fastify API with PostgreSQL, Prisma, and session authentication
- Server registry, health checks, and mod API proxy
- Cluster-wide shop, VIP gifts, CD keys, level gifts, lottery, point log
- Cluster-native points ingest API (`POST /api/points/ingest`)
- WebSocket live event aggregation from all game servers (`GET /api/ws`)
- Production Docker Compose stack (PostgreSQL + API + nginx)
- Wiki documentation and publish workflow
- GitHub Release workflow with source tarball

### Changed

- Dashboard shows live cluster event feed
- README and deployment docs expanded

[Unreleased]: https://github.com/syndaq/7DaysToDie-MultiServerKit-Panel/compare/v1.0.0...main
[1.0.0]: https://github.com/syndaq/7DaysToDie-MultiServerKit-Panel/releases/tag/v1.0.0

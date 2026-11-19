# YITZone — Hệ thống Quản lý Hoạt động Đoàn - Hội & Học thuật Khoa CNTT

Codebase được khởi tạo bám sát kiến trúc **Decoupled Client-Server & Modular Monolith** trong [HLD_YITZone.md](./HLD_YITZone.md), [LLD_YITZone.md](./LLD_YITZone.md) và [SRS_YITZone.md](./SRS_YITZone.md).

## Cấu trúc Thư mục

```text
YITZone/
├── yitzone-client/          # React 19 + TypeScript (Strict) + Vite 6 + PWA (Workbox/Dexie/WebCrypto) + Tailwind CSS
├── yitzone-server/          # Java 21 LTS (Virtual Threads) + Spring Boot 3.3.x Modular Monolith (22 modules)
├── nginx/                   # Reverse Proxy cho Static PWA, REST/SSE (/api/*) & STOMP WebSocket (/ws/*)
├── .github/workflows/       # CI pipeline (mvn test + tsc --noEmit + eslint + vite build)
├── docker-compose.yml       # Hạ tầng Topology A (MongoDB RS, Redis 7.4, ClamAV, pgsty/silo, Client, Server)
└── .env.example             # Mẫu biến môi trường
```

## Chạy Phát triển Cục bộ (Local Dev)

### 1. Khởi chạy hạ tầng phụ trợ (MongoDB RS + Redis + Silo + ClamAV)
```bash
docker compose up -d mongodb redis silo clamav
```

### 2. Chạy Backend (`yitzone-server`)
```bash
cd yitzone-server
mvn spring-boot:run
```
Swagger UI: `http://localhost:8080/swagger-ui.html`  
Actuator Health: `http://localhost:8080/actuator/health`

### 3. Chạy Frontend (`yitzone-client`)
```bash
cd yitzone-client
npm install
npm run dev
```
Ứng dụng PWA Dev Server: `http://localhost:5173`

# Mizan ERP — Deployment, CLI & Operations Guide

**Target Audience:** DevOps engineers, system administrators, infrastructure leads.  
**Platform Version:** Mizan 3.0 (Docker + PostgreSQL 16 + FastAPI + Tauri/Capacitor)

---

## 1. System Requirements & Architecture

Mizan is architected for containerized deployment across on-premises servers, bare-metal VPS (Debian/Ubuntu), or managed cloud environments (AWS, GCP, Hetzner).

| Component | Minimum | Recommended Production |
| :--- | :--- | :--- |
| **CPU** | 2 vCPU | 4+ vCPU |
| **RAM** | 2 GB | 8+ GB |
| **Storage** | 20 GB SSD | 100+ GB NVMe SSD |
| **OS** | Linux (Ubuntu 22.04 LTS / 24.04 LTS, Debian 12) | Linux x86_64 or ARM64 |
| **Docker** | Docker Engine 24.0+ & Docker Compose v2 | Latest Docker CE |

---

## 2. Docker Compose Deployment

Mizan's microservices are orchestrated via `docker-compose.yml`:

```yaml
version: "3.8"

services:
  db:
    image: postgres:16-alpine
    container_name: mizan-db-1
    restart: unless-stopped
    environment:
      POSTGRES_DB: inventory_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./data/sql/init_data.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5433:5432"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: mizan-backend-1
    restart: unless-stopped
    depends_on:
      - db
    env_file:
      - ./backend/.env
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - ./backend/app/modules:/app/app/modules

volumes:
  pgdata:
```

---

## 3. Environment Variables Reference (`.env`)

Create or configure `backend/.env`:

```ini
# Database Connection (AsyncPG Driver)
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/inventory_db

# Cryptographic Security
SECRET_KEY=generate-a-strong-64-character-hex-secret-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Multi-Tenancy & CORS
CORS_ORIGINS=["https://mizan.app", "http://localhost:5173", "http://localhost:8080"]
TENANT_RESOLUTION_STRATEGY=path_and_header

# Automation & Worker Interval (seconds)
CRON_POLL_INTERVAL=60
ZKTECO_SYNC_ENABLED=true
```

---

## 4. Production Nginx Reverse Proxy & SSL

For high-traffic production environments, place Nginx in front of Vite and Uvicorn:

```nginx
server {
    listen 80;
    server_name erp.yourdomain.com *.erp.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name erp.yourdomain.com *.erp.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/erp.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/erp.yourdomain.com/privkey.pem;

    # Static Frontend SPA
    location / {
        root /var/www/mizan/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Asynchronous Backend REST API
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSockets (Live KDS & Biometric Terminals)
    location /ws/ {
        proxy_pass http://127.0.0.1:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 5. Mizan Management CLI (`manage.py`)

Mizan ships with an enterprise-grade administrative CLI script at the project root (`manage.py`).

### CLI Command Reference:

| Command | Syntax | Description |
| :--- | :--- | :--- |
| **First-Time Setup** | `python manage.py setup` | Boots containers and initializes base database schema and sample data. |
| **Safe Deployment** | `python manage.py deploy` | Pulls latest code, creates automatic safety backup, and executes migrations. |
| **Fresh Reset** | `python manage.py deploy-fresh` | ⚠️ **Wipes all database data** and restores fresh snapshot from `init_data.sql`. |
| **Database Backup** | `python manage.py backup` | Takes compressed snapshot of PostgreSQL and stores it in `backups/`. |
| **Restore Backup** | `python manage.py restore <file>` | Restores database state from a specified SQL backup file. |
| **Run Migrations** | `python manage.py migrate` | Inspects schema and executes incremental database column additions safely. |
| **Container Status** | `python manage.py status` | Displays container health, uptime, and database port bindings. |
| **Tail Logs** | `python manage.py logs` | Live streaming log tail from all services (`backend`, `db`, `frontend`). |
| **Build Android APK** | `python manage.py build-apk` | 📱 Compiles native offline-capable Android APK via Capacitor + Gradle. |
| **Build Linux Desktop** | `python manage.py build-appimage` | 🖥️ Compiles native desktop Linux AppImage via Rust + Tauri. |
| **Build Windows Desktop** | `python manage.py build-exe` | 🪟 Compiles native Windows `.exe` standalone installer via Rust + Tauri. |

### CLI Usage Example:
```bash
# Verify health of all system components
python manage.py status

# Take a manual pre-deployment backup
python manage.py backup

# Apply database updates safely
python manage.py deploy --yes
```

# MySQL/MariaDB Setup Fix

## Issue
```
ERROR 1698 (28000): Access denied for user 'trustbridge'@'localhost'
```

This is a common MariaDB authentication issue. MariaDB uses unix_socket authentication by default for the root user.

## Quick Fix (Choose One)

### Option 1: Use Docker MySQL (Recommended - Fastest)

This avoids MariaDB authentication issues entirely:

```bash
# Stop MariaDB if running
sudo systemctl stop mariadb

# Start Docker MySQL
docker run --name trustbridge-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpass123 \
  -e MYSQL_DATABASE=trustbridge \
  -e MYSQL_USER=trustbridge \
  -e MYSQL_PASSWORD=trustbridge123 \
  -p 3306:3306 \
  -d mysql:8.0

# Wait 15 seconds for MySQL to start
sleep 15

# Import schema
docker exec -i trustbridge-mysql mysql -utrustbridge -ptrustbridge123 trustbridge < sql/mysql-schema.sql

# Verify
docker exec -i trustbridge-mysql mysql -utrustbridge -ptrustbridge123 trustbridge -e "SHOW TABLES;"
```

**Update .env:**
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=trustbridge
DB_PASSWORD=trustbridge123
DB_NAME=trustbridge
```

### Option 2: Fix MariaDB Authentication

```bash
# Login as root using sudo (unix_socket)
sudo mysql

# Run these commands in MySQL/MariaDB:
DROP USER IF EXISTS 'trustbridge'@'localhost';
CREATE USER 'trustbridge'@'localhost' IDENTIFIED BY 'trustbridge123';
GRANT ALL PRIVILEGES ON *.* TO 'trustbridge'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Test login
mysql -u trustbridge -ptrustbridge123 -e "SELECT 1;"

# If that works, create database
mysql -u trustbridge -ptrustbridge123 -e "CREATE DATABASE IF NOT EXISTS trustbridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import schema
mysql -u trustbridge -ptrustbridge123 trustbridge < sql/mysql-schema.sql

# Verify
mysql -u trustbridge -ptrustbridge123 trustbridge -e "SHOW TABLES;"
```

**Update .env:**
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=trustbridge
DB_PASSWORD=trustbridge123
DB_NAME=trustbridge
```

### Option 3: Use Root with sudo (Quick Test)

```bash
# Create database as root
sudo mysql -e "CREATE DATABASE IF NOT EXISTS trustbridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import schema
sudo mysql trustbridge < sql/mysql-schema.sql

# Verify
sudo mysql trustbridge -e "SHOW TABLES;"
```

**Update .env to use root:**
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=trustbridge
```

**Note:** This only works with `sudo mysql` - not recommended for production.

## Recommended: Use Docker (Option 1)

Docker MySQL is the easiest and most consistent:

```bash
# Complete setup in 30 seconds
docker run --name trustbridge-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpass123 \
  -e MYSQL_DATABASE=trustbridge \
  -e MYSQL_USER=trustbridge \
  -e MYSQL_PASSWORD=trustbridge123 \
  -p 3306:3306 \
  -d mysql:8.0 && \
sleep 15 && \
docker exec -i trustbridge-mysql mysql -utrustbridge -ptrustbridge123 trustbridge < sql/mysql-schema.sql && \
echo "✅ MySQL ready!"
```

Then update `.env`:
```bash
cat >> .env << 'EOF'
DB_HOST=localhost
DB_PORT=3306
DB_USER=trustbridge
DB_PASSWORD=trustbridge123
DB_NAME=trustbridge
EOF
```

## After Setup

Start backend:
```bash
npx nodemon --watch src --exec ts-node src/index.ts
```

Expected output:
```
✅ Connected to MySQL database
✅ Connected to Redis
🚀 TrustBridge Backend running on port 3000
```

## Useful Docker Commands

```bash
# Check if container is running
docker ps | grep trustbridge-mysql

# View logs
docker logs trustbridge-mysql

# Stop container
docker stop trustbridge-mysql

# Start existing container
docker start trustbridge-mysql

# Remove container
docker rm -f trustbridge-mysql

# Access MySQL shell
docker exec -it trustbridge-mysql mysql -utrustbridge -ptrustbridge123 trustbridge
```

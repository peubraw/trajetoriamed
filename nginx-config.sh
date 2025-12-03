#!/bin/bash
cat > /etc/nginx/sites-available/wppbot << 'EOF'
server {
    listen 80;
    server_name 165.22.158.58;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
ln -sf /etc/nginx/sites-available/wppbot /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

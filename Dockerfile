FROM python:3.13.3-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE 1 \
    PYTHONUNBUFFERED 1 

WORKDIR /app

# 安裝編譯 psycopg2 所需的相依套件 (解決你之前的編譯錯誤)
RUN apt-get update && apt-get install -y \
    curl \
    git \
    gcc \
    python3-dev \
    libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# 注意這裡改成了直接複製目前的 requirements.txt
COPY requirements.txt .
RUN chmod +x /app/entrypoint.sh
RUN pip install -r requirements.txt

# 直接複製目前資料夾下的所有檔案到容器的 /app
COPY . .

EXPOSE 8000

# 確保 entrypoint 具備執行權限 (預防萬一)
RUN chmod +x entrypoint.sh

CMD ["./entrypoint.sh"]
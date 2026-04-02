FROM python:3.13.3-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    git \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# 因為 build context 是 ./app，所以直接 COPY 檔案即可
COPY requirements.txt .
RUN pip install -r requirements.txt

# 複製 app 資料夾內的所有內容（manage.py, src/ 等）
COPY . .

RUN chmod +x entrypoint.sh

EXPOSE 8000
CMD ["./entrypoint.sh"]
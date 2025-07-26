FROM python:3.11-slim as builder

RUN apt-get update && apt-get install -y gcc g++ git curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.11-slim as runner

RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*
RUN useradd --create-home --shell /bin/bash app

WORKDIR /app
COPY --from=builder /root/.local /home/app/.local
COPY --chown=app:app . .
RUN mkdir -p /app/analysis_reports && chown -R app:app /app

USER app
ENV PATH=/home/app/.local/bin:$PATH

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/docs || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

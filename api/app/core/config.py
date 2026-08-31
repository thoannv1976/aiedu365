"""Cấu hình ứng dụng, đọc từ biến môi trường."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Ứng dụng ---
    app_name: str = "AIEDU365 API"
    environment: str = "development"
    data_dir: Path = Path(__file__).resolve().parents[3] / "data"
    cors_origins: str = "http://localhost:3000"

    # --- Google Cloud ---
    gcp_project: str = "aiedu365"
    gcp_location: str = "asia-southeast1"
    firestore_database: str = "(default)"
    use_firestore: bool = False
    """Tắt Firestore để chạy hoàn toàn từ file JSON — tiện cho phát triển cục bộ."""

    # --- Mô hình ---
    llm_provider: str = "vertex"
    """vertex | anthropic | openai | echo (echo dùng để test, không gọi mạng)."""
    chat_model: str = "gemini-2.5-flash"
    reasoning_model: str = "gemini-2.5-pro"
    embedding_model: str = "text-embedding-004"
    embedding_dimensions: int = 768
    max_output_tokens: int = 1400
    temperature: float = 0.2

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-5"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # --- RAG ---
    retrieval_top_k: int = 8
    retrieval_top_k_compare: int = 16
    similarity_threshold: float = 0.50
    """Hiệu chỉnh lại theo provider embedding đang dùng — xem ``guardrails.has_sufficient_context``."""
    max_history_turns: int = 6

    # --- Giới hạn ---
    rate_limit_messages_per_session_hour: int = 20
    rate_limit_requests_per_ip_hour: int = 100
    max_message_length: int = 1500
    daily_token_budget: int = 2_000_000

    # --- Bảo mật ---
    admin_emails: str = "hoanganh.goldenlight@gmail.com"
    firebase_project_id: str = "aiedu365"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def admin_email_list(self) -> list[str]:
        return [e.strip().lower() for e in self.admin_emails.split(",") if e.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

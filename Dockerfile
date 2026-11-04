# Hugging Face Spaces build (GitHub sync): wraps the CI-published backend
# image and rebinds it to port 7860, which HF Spaces routes to.
FROM ghcr.io/ammar0xff/mizan-backend:beta

ENV HOME=/app

EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
import os

from dotenv import load_dotenv

load_dotenv()


def get_env_var(name: str) -> str:
    value = os.getenv(name)

    if not value:
        raise RuntimeError(f"{name} environment variable is not set")

    return value


def get_boolean_env_var(name: str) -> bool:
    value = get_env_var(name)

    if value == "true":
        return True

    if value == "false":
        return False

    raise RuntimeError(f"{name} must be set to true or false")

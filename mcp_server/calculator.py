"""Small, dependency-free calculation tool used by the JARVIS MCP lesson."""
from decimal import Decimal, InvalidOperation


def calculate_total(price: float | int | str, quantity: int) -> dict[str, str | int]:
    """Return a validated item total. No network, file, or device access."""
    if isinstance(quantity, bool) or not isinstance(quantity, int):
        raise ValueError("quantity must be a whole number")
    if quantity < 0 or quantity > 1_000_000:
        raise ValueError("quantity must be between 0 and 1,000,000")

    try:
        unit_price = Decimal(str(price))
    except (InvalidOperation, ValueError, TypeError):
        raise ValueError("price must be a valid number") from None

    if not unit_price.is_finite():
        raise ValueError("price must be finite")
    if unit_price < 0 or unit_price > Decimal("1000000000"):
        raise ValueError("price must be between 0 and 1,000,000,000")

    total = (unit_price * quantity).quantize(Decimal("0.01"))
    return {
        "price": format(unit_price, "f"),
        "quantity": quantity,
        "total": format(total, "f"),
        "currency": "INR",
    }
